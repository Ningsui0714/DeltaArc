import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

const outputDir = path.resolve(process.cwd(), 'dist-server');
const packageJsonPath = path.join(outputDir, 'package.json');

await mkdir(outputDir, { recursive: true });
await writeFile(packageJsonPath, `${JSON.stringify({ type: 'commonjs' }, null, 2)}\n`, 'utf8');
