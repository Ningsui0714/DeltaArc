import { existsSync } from 'node:fs';
import path from 'node:path';
import express from 'express';
import { sandboxRouter } from './routes/sandbox';
import { serverConfig } from './config';

const app = express();
const clientDistPath = path.resolve(process.cwd(), 'dist');

app.use(express.json({ limit: '1mb' }));

app.get('/api/health', (_req, res) => {
  res.json({
    ok: true,
    port: serverConfig.port,
  });
});

app.use('/api/sandbox', sandboxRouter);

if (existsSync(clientDistPath)) {
  app.use(express.static(clientDistPath));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api/')) {
      next();
      return;
    }

    res.sendFile(path.join(clientDistPath, 'index.html'));
  });
}

app.listen(serverConfig.port, () => {
  console.log(`Sandbox server listening on http://127.0.0.1:${serverConfig.port}`);
});
