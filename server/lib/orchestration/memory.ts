import type { SandboxMemorySignal } from '../../../shared/sandbox';
import type { SandboxMemoryRecord } from './memoryStore';

export function summarizeMemories(memories: SandboxMemoryRecord[]) {
  if (memories.length === 0) {
    return {
      memorySignals: [] as SandboxMemorySignal[],
      memoryContext: '没有可用的历史推演记忆，这是这个项目的首次或孤立分析。',
    };
  }

  const memorySignals = memories.map((memory, index) => ({
    title: `历史信号 ${index + 1}`,
    summary: `${memory.createdAt}：${memory.summary}；主风险：${memory.primaryRisk}`,
    signalStrength: index === 0 ? 'fresh' : 'recurring',
  })) as SandboxMemorySignal[];

  const memoryContext = memories
    .map(
      (memory, index) =>
        `${index + 1}. 时间：${memory.createdAt}\n结论：${memory.verdict}\n主风险：${memory.primaryRisk}\n盲点：${memory.blindSpots.join(' / ') || '无'}\n验证焦点：${memory.validationFocus.join(' / ') || '无'}\n逆向动作：${memory.contrarianMoves.join(' / ') || '无'}`,
    )
    .join('\n\n');

  return {
    memorySignals,
    memoryContext,
  };
}
