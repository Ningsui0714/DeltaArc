import assert from 'node:assert/strict';
import test from 'node:test';
import { summarizeMemories } from './memory';

test('summarizeMemories keeps historical context neutral and dedupes repeated conclusions', () => {
  const repeatedVerdict = '方向暂不宜乐观扩张，先用更小成本验证关键前提。';
  const result = summarizeMemories([
    {
      id: 'memory_1',
      projectKey: 'project_a',
      projectName: 'Project A',
      createdAt: '2026-03-16T00:00:00.000Z',
      verdict: repeatedVerdict,
      primaryRisk: '车辆系统没有真正进入核心循环。',
      summary: '旧摘要 1',
      blindSpots: ['新手引导影响未知'],
      validationFocus: ['确认车辆系统是否参与委托闭环'],
      contrarianMoves: ['先把车辆降级成纯移动工具'],
    },
    {
      id: 'memory_2',
      projectKey: 'project_a',
      projectName: 'Project A',
      createdAt: '2026-03-16T01:00:00.000Z',
      verdict: repeatedVerdict,
      primaryRisk: '车辆系统没有真正进入核心循环。',
      summary: '旧摘要 2',
      blindSpots: ['新手引导影响未知'],
      validationFocus: ['确认车辆系统是否参与委托闭环'],
      contrarianMoves: ['先把车辆降级成纯移动工具'],
    },
  ]);

  assert.equal(result.memorySignals.length, 1);
  assert.match(result.memorySignals[0]?.summary ?? '', /历史主风险是 车辆系统没有真正进入核心循环/);
  assert.match(result.memorySignals[0]?.summary ?? '', /当时优先验证 确认车辆系统是否参与委托闭环/);
  assert.doesNotMatch(result.memorySignals[0]?.summary ?? '', /旧摘要/);
  assert.doesNotMatch(result.memoryContext, /方向暂不宜乐观扩张/);
  assert.doesNotMatch(result.memoryContext, /结论：/);
  assert.match(result.memoryContext, /以下历史记忆只作为风险、盲点和验证线索使用/);
  assert.match(result.memoryContext, /历史验证焦点：确认车辆系统是否参与委托闭环/);
});
