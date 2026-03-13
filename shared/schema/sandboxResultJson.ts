import { JsonRecord } from './common';

type JsonContainerState =
  | {
      kind: 'object';
      mode: 'expectKeyOrEnd' | 'expectColon' | 'expectValue' | 'expectCommaOrEnd';
    }
  | {
      kind: 'array';
      mode: 'expectValueOrEnd' | 'expectCommaOrEnd';
    };

type JsonStringState = {
  kind: 'key' | 'value';
  quote: '"' | "'";
};

export function extractJsonObject(content: string) {
  const candidates = collectJsonCandidates(content, false);
  let lastError: unknown = null;

  for (const candidate of candidates) {
    const cleaned = sanitizeJsonCandidate(candidate);

    try {
      return JSON.parse(cleaned) as JsonRecord;
    } catch (error) {
      lastError = error;
    }
  }

  const message = lastError instanceof Error ? lastError.message : 'No parseable JSON object was returned.';
  throw new Error(message);
}

export function repairJsonObjectLocally(content: string) {
  const baseCandidate = collectJsonCandidates(content, false)[0] ?? content.trim().replace(/^\uFEFF/, '');
  return sanitizeJsonCandidate(rewriteMalformedJsonCandidate(baseCandidate));
}

function collectJsonCandidates(content: string, includeLocalRepair = true) {
  const normalizedContent = content.trim().replace(/^\uFEFF/, '');
  const candidates = new Set<string>();

  if (normalizedContent) {
    candidates.add(normalizedContent);
  }

  const fencedContent = normalizedContent
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/, '')
    .trim();

  if (fencedContent) {
    candidates.add(fencedContent);
  }

  const balancedObject = extractBalancedJsonObject(fencedContent || normalizedContent);
  if (balancedObject) {
    candidates.add(balancedObject);
  }

  if (includeLocalRepair) {
    const repairedContent = rewriteMalformedJsonCandidate(balancedObject || fencedContent || normalizedContent);
    if (repairedContent) {
      candidates.add(repairedContent);
    }
  }

  return [...candidates];
}

function extractBalancedJsonObject(content: string) {
  let start = -1;
  let depth = 0;
  let inString = false;
  let escaped = false;

  for (let index = 0; index < content.length; index += 1) {
    const character = content[index];

    if (escaped) {
      escaped = false;
      continue;
    }

    if (character === '\\') {
      escaped = true;
      continue;
    }

    if (character === '"') {
      inString = !inString;
      continue;
    }

    if (inString) {
      continue;
    }

    if (character === '{') {
      if (depth === 0) {
        start = index;
      }
      depth += 1;
      continue;
    }

    if (character === '}') {
      depth -= 1;

      if (depth === 0 && start !== -1) {
        return content.slice(start, index + 1);
      }
    }
  }

  return null;
}

function rewriteMalformedJsonCandidate(content: string) {
  const source = sanitizeJsonCandidate(content)
    .replace(/^\s*```(?:json)?\s*/i, '')
    .replace(/\s*```$/, '');

  if (!source.trim()) {
    return '';
  }

  const output: string[] = [];
  const stack: JsonContainerState[] = [];
  let stringState: JsonStringState | null = null;
  let index = 0;

  while (index < source.length) {
    const character = source[index];

    if (stringState) {
      const result = consumeStringCharacter(source, index, stringState, stack, output);
      index = result.nextIndex;
      stringState = result.nextStringState;
      continue;
    }

    if (/\s/.test(character)) {
      output.push(character);
      index += 1;
      continue;
    }

    const container = stack[stack.length - 1];

    if (shouldInsertMissingComma(container, character)) {
      output.push(',');
      advanceContainerAfterComma(container);
      continue;
    }

    if (shouldInsertMissingColon(container, character)) {
      output.push(':');
      if (container?.kind === 'object') {
        container.mode = 'expectValue';
      }
      continue;
    }

    if (character === '"' || character === "'") {
      output.push('"');
      stringState = {
        kind: container?.kind === 'object' && container.mode === 'expectKeyOrEnd' ? 'key' : 'value',
        quote: character,
      };
      index += 1;
      continue;
    }

    if (character === '{') {
      output.push(character);
      stack.push({ kind: 'object', mode: 'expectKeyOrEnd' });
      index += 1;
      continue;
    }

    if (character === '[') {
      output.push(character);
      stack.push({ kind: 'array', mode: 'expectValueOrEnd' });
      index += 1;
      continue;
    }

    if (character === '}') {
      output.push(character);
      if (stack[stack.length - 1]?.kind === 'object') {
        stack.pop();
        markValueComplete(stack);
      }
      index += 1;
      continue;
    }

    if (character === ']') {
      output.push(character);
      if (stack[stack.length - 1]?.kind === 'array') {
        stack.pop();
        markValueComplete(stack);
      }
      index += 1;
      continue;
    }

    if (character === ':') {
      output.push(character);
      if (container?.kind === 'object') {
        container.mode = 'expectValue';
      }
      index += 1;
      continue;
    }

    if (character === ',') {
      output.push(character);
      advanceContainerAfterComma(container);
      index += 1;
      continue;
    }

    if (character === '/' && source[index + 1] === '/') {
      index = consumeLineComment(source, index + 2);
      continue;
    }

    if (character === '/' && source[index + 1] === '*') {
      index = consumeBlockComment(source, index + 2);
      continue;
    }

    if (isScalarTokenStart(character)) {
      const token = consumeScalarToken(source, index);
      output.push(normalizeScalarToken(token.value));
      markValueComplete(stack);
      index = token.nextIndex;
      continue;
    }

    output.push(character);
    index += 1;
  }

  if (stringState) {
    output.push('"');
    finalizeCompletedString(stack, stringState);
  }

  while (stack.length > 0) {
    const container = stack.pop();
    output.push(container?.kind === 'array' ? ']' : '}');
    markValueComplete(stack);
  }

  return output.join('');
}

function consumeStringCharacter(
  source: string,
  index: number,
  stringState: JsonStringState,
  stack: JsonContainerState[],
  output: string[],
) {
  const character = source[index];

  if (character === '\\') {
    const nextCharacter = source[index + 1];

    if (nextCharacter === undefined) {
      output.push('\\\\');
      return { nextIndex: index + 1, nextStringState: stringState };
    }

    if (nextCharacter === "'") {
      output.push("'");
      return { nextIndex: index + 2, nextStringState: stringState };
    }

    if (nextCharacter === '\r' || nextCharacter === '\n') {
      return {
        nextIndex: nextCharacter === '\r' && source[index + 2] === '\n' ? index + 3 : index + 2,
        nextStringState: stringState,
      };
    }

    output.push('\\', nextCharacter);
    return { nextIndex: index + 2, nextStringState: stringState };
  }

  if (character === '\r') {
    output.push('\\n');
    return {
      nextIndex: source[index + 1] === '\n' ? index + 2 : index + 1,
      nextStringState: stringState,
    };
  }

  if (character === '\n') {
    output.push('\\n');
    return { nextIndex: index + 1, nextStringState: stringState };
  }

  if (character === '\t') {
    output.push('\\t');
    return { nextIndex: index + 1, nextStringState: stringState };
  }

  if (character === '"') {
    if (stringState.quote === '"') {
      const nextCharacter = getNextSignificantCharacter(source, index + 1);
      if (shouldCloseString(stringState.kind, nextCharacter)) {
        output.push('"');
        finalizeCompletedString(stack, stringState);
        return { nextIndex: index + 1, nextStringState: null };
      }
    }

    output.push('\\"');
    return { nextIndex: index + 1, nextStringState: stringState };
  }

  if (character === "'") {
    if (stringState.quote === "'") {
      const nextCharacter = getNextSignificantCharacter(source, index + 1);
      if (shouldCloseString(stringState.kind, nextCharacter)) {
        output.push('"');
        finalizeCompletedString(stack, stringState);
        return { nextIndex: index + 1, nextStringState: null };
      }
    }

    output.push("'");
    return { nextIndex: index + 1, nextStringState: stringState };
  }

  if (/[\u0000-\u001F]/.test(character)) {
    return { nextIndex: index + 1, nextStringState: stringState };
  }

  output.push(character);
  return { nextIndex: index + 1, nextStringState: stringState };
}

function finalizeCompletedString(stack: JsonContainerState[], stringState: JsonStringState) {
  const container = stack[stack.length - 1];

  if (stringState.kind === 'key') {
    if (container?.kind === 'object') {
      container.mode = 'expectColon';
    }
    return;
  }

  markValueComplete(stack);
}

function shouldCloseString(kind: JsonStringState['kind'], nextCharacter: string | null) {
  if (kind === 'key') {
    return nextCharacter === ':';
  }

  return (
    nextCharacter === null ||
    nextCharacter === ',' ||
    nextCharacter === '}' ||
    nextCharacter === ']' ||
    nextCharacter === '"' ||
    nextCharacter === "'"
  );
}

function shouldInsertMissingComma(container: JsonContainerState | undefined, character: string) {
  if (!container) {
    return false;
  }

  if (container.kind === 'object' && container.mode === 'expectCommaOrEnd') {
    return character !== '}' && character !== ',';
  }

  if (container.kind === 'array' && container.mode === 'expectCommaOrEnd') {
    return character !== ']' && character !== ',';
  }

  return false;
}

function shouldInsertMissingColon(container: JsonContainerState | undefined, character: string) {
  return container?.kind === 'object' && container.mode === 'expectColon' && character !== ':';
}

function advanceContainerAfterComma(container: JsonContainerState | undefined) {
  if (!container) {
    return;
  }

  if (container.kind === 'object') {
    container.mode = 'expectKeyOrEnd';
    return;
  }

  container.mode = 'expectValueOrEnd';
}

function markValueComplete(stack: JsonContainerState[]) {
  const container = stack[stack.length - 1];

  if (!container) {
    return;
  }

  if (container.kind === 'object' && container.mode === 'expectValue') {
    container.mode = 'expectCommaOrEnd';
    return;
  }

  if (container.kind === 'array' && container.mode === 'expectValueOrEnd') {
    container.mode = 'expectCommaOrEnd';
  }
}

function consumeLineComment(source: string, index: number) {
  let nextIndex = index;

  while (nextIndex < source.length && source[nextIndex] !== '\n' && source[nextIndex] !== '\r') {
    nextIndex += 1;
  }

  return nextIndex;
}

function consumeBlockComment(source: string, index: number) {
  let nextIndex = index;

  while (nextIndex < source.length) {
    if (source[nextIndex] === '*' && source[nextIndex + 1] === '/') {
      return nextIndex + 2;
    }

    nextIndex += 1;
  }

  return source.length;
}

function isScalarTokenStart(character: string) {
  return /[-0-9.tfn]/i.test(character);
}

function consumeScalarToken(source: string, index: number) {
  let nextIndex = index;

  while (nextIndex < source.length) {
    const character = source[nextIndex];

    if (/\s/.test(character) || character === ',' || character === '}' || character === ']') {
      break;
    }

    nextIndex += 1;
  }

  return {
    value: source.slice(index, nextIndex),
    nextIndex,
  };
}

function normalizeScalarToken(token: string) {
  if (token === 'True') {
    return 'true';
  }

  if (token === 'False') {
    return 'false';
  }

  if (token === 'None') {
    return 'null';
  }

  return token;
}

function getNextSignificantCharacter(source: string, startIndex: number) {
  for (let index = startIndex; index < source.length; index += 1) {
    if (!/\s/.test(source[index])) {
      return source[index];
    }
  }

  return null;
}

function sanitizeJsonCandidate(content: string) {
  return content
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '')
    .replace(/[“”]/g, '"')
    .replace(/[‘’]/g, "'")
    .replace(/,\s*([}\]])/g, '$1')
    .trim();
}
