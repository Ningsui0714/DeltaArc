import test from 'node:test';
import assert from 'node:assert/strict';
import { extractJsonObject, repairJsonObjectLocally } from './sandboxResult';

test('repairJsonObjectLocally escapes nested quotes inside string values', () => {
  const malformed = '{"summary":"他说 "你好" 并继续分析","count":1}';
  const repaired = repairJsonObjectLocally(malformed);
  const parsed = JSON.parse(repaired) as { summary: string; count: number };

  assert.equal(parsed.summary, '他说 "你好" 并继续分析');
  assert.equal(parsed.count, 1);
});

test('repairJsonObjectLocally inserts missing commas and preserves newlines inside strings', () => {
  const malformed = '{"summary":"line1\nline2" "flag": true "score": 3}';
  const repaired = repairJsonObjectLocally(malformed);
  const parsed = JSON.parse(repaired) as { summary: string; flag: boolean; score: number };

  assert.equal(parsed.summary, 'line1\nline2');
  assert.equal(parsed.flag, true);
  assert.equal(parsed.score, 3);
});

test('extractJsonObject remains strict without local repair candidates', () => {
  assert.throws(
    () => extractJsonObject('{"summary":"bad "quote" here"}'),
    /Expected ',' or '}' after property value in JSON/,
  );
});
