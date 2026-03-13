import { parseJsonImport } from './parseJsonImport';
import { parseMarkdownImport } from './parseMarkdownImport';
import type { ImportLanguage, ImportedPayload } from './types';

async function readFileAsText(file: File) {
  return await file.text();
}

export async function importStructuredFile(file: File, language: ImportLanguage): Promise<ImportedPayload> {
  const text = await readFileAsText(file);
  const name = file.name.toLowerCase();

  if (name.endsWith('.json')) {
    return parseJsonImport(text);
  }

  if (name.endsWith('.md') || name.endsWith('.markdown') || name.endsWith('.txt')) {
    return parseMarkdownImport(text, file.name, language);
  }

  throw new Error(
    language === 'en'
      ? 'Only .json, .md, .markdown, and .txt files are supported.'
      : '当前只支持 .json、.md、.markdown、.txt 文件。',
  );
}
