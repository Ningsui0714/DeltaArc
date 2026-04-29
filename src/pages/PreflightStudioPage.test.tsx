import assert from 'node:assert/strict';
import test from 'node:test';
import { renderToStaticMarkup } from 'react-dom/server';
import { PreflightStudioPage } from './PreflightStudioPage';

test('PreflightStudioPage renders the KOC growth product positioning without competition wording', () => {
  const html = renderToStaticMarkup(<PreflightStudioPage />);

  assert.match(html, /KOC Growth Lab/);
  assert.match(html, /社媒 AI Agent/);
  assert.match(html, /一键载入示例/);
  assert.match(html, /发布前预演/);
  assert.match(html, /示例评论区/);
  assert.match(html, /推演完成后显示真实动作/);
  assert.match(html, /点赞/);
  assert.match(html, /转发/);
  assert.match(html, /发布与涨粉动作/);
  assert.doesNotMatch(html, /第五赛道|Track 05|扣题/);
});
