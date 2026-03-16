import { existsSync } from 'node:fs';
import path from 'node:path';
import express from 'express';
import { sandboxRouter } from './routes/sandbox';
import { serverConfig } from './config';

const app = express();
const clientDistPath = path.resolve(process.cwd(), 'dist');
const runtimeEntryPath = path.resolve(process.argv[1] ?? '');
const isProductionStartScript = process.env.npm_lifecycle_event === 'start';
const shouldServeClientDist =
  existsSync(clientDistPath) &&
  (isProductionStartScript || /(?:^|[\\/])dist-server(?:[\\/]|$)/.test(runtimeEntryPath));

app.use(express.json({ limit: '1mb' }));

app.get('/api/health', (_req, res) => {
  res.json({
    ok: true,
    port: serverConfig.port,
  });
});

app.use('/api/sandbox', sandboxRouter);

if (shouldServeClientDist) {
  app.use(express.static(clientDistPath));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api/')) {
      next();
      return;
    }

    res.sendFile(path.join(clientDistPath, 'index.html'));
  });
} else {
  app.get('/', (_req, res) => {
    res
      .status(200)
      .type('text/plain; charset=utf-8')
      .send('开发模式下这里仅提供 API。最新前端请打开 http://127.0.0.1:3000 。');
  });
}

app.listen(serverConfig.port, () => {
  console.log(`Sandbox server listening on http://127.0.0.1:${serverConfig.port}`);
});
