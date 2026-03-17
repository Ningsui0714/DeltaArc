import type { SandboxMemorySignal } from '../../../shared/sandbox';
import type { SandboxMemoryRecord } from './memoryStore';

function joinMemoryItems(items: string[]) {
  const cleaned = items.map((item) => item.trim()).filter(Boolean);
  return cleaned.length > 0 ? cleaned.join(' / ') : '无';
}

function buildMemorySignature(memory: SandboxMemoryRecord) {
  return [
    memory.primaryRisk.trim().toLowerCase(),
    joinMemoryItems(memory.blindSpots).toLowerCase(),
    joinMemoryItems(memory.validationFocus).toLowerCase(),
    joinMemoryItems(memory.contrarianMoves).toLowerCase(),
  ].join('|');
}

function dedupeMemoryRecords(memories: SandboxMemoryRecord[]) {
  const seen = new Set<string>();

  return memories.filter((memory) => {
    const signature = buildMemorySignature(memory);
    if (seen.has(signature)) {
      return false;
    }
    seen.add(signature);
    return true;
  });
}

export function summarizeMemories(memories: SandboxMemoryRecord[]) {
  const uniqueMemories = dedupeMemoryRecords(memories);

  if (uniqueMemories.length === 0) {
    return {
      memorySignals: [] as SandboxMemorySignal[],
      memoryContext: '没有可用的历史推演记忆，这是这个项目的首次或孤立分析。',
    };
  }

  const memorySignals = uniqueMemories.map((memory, index) => {
    const validationFocus = joinMemoryItems(memory.validationFocus);

    return {
      title: `历史信号 ${index + 1}`,
      summary:
        validationFocus === '无'
          ? `${memory.createdAt}：历史主风险是 ${memory.primaryRisk}`
          : `${memory.createdAt}：历史主风险是 ${memory.primaryRisk}；当时优先验证 ${validationFocus}`,
      signalStrength: index === 0 ? 'fresh' : 'recurring',
    };
  }) as SandboxMemorySignal[];

  const memoryContext = [
    '以下历史记忆只作为风险、盲点和验证线索使用，不能直接沿用其中任何旧结论。',
    ...uniqueMemories.map(
      (memory, index) =>
        `${index + 1}. 时间：${memory.createdAt}\n历史主风险：${memory.primaryRisk}\n历史盲点：${joinMemoryItems(memory.blindSpots)}\n历史验证焦点：${joinMemoryItems(memory.validationFocus)}\n历史逆向动作：${joinMemoryItems(memory.contrarianMoves)}`,
    ),
  ]
    .filter(Boolean)
    .join('\n\n');

  return {
    memorySignals,
    memoryContext,
  };
}
