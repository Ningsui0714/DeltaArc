import assert from 'node:assert/strict';
import test from 'node:test';
import { parseMarkdownImport } from './parseMarkdownImport';

test('parseMarkdownImport keeps subjective concern fields out of evidence summaries', () => {
  const payload = parseMarkdownImport(
    `项目名称：代号：远岸旅团
阶段模式：Validation
游戏类型：合作生存建造
目标平台：PC, Steam Deck
目标玩家：轻中度合作生存玩家, 双人开黑玩家
核心体验承诺：
和朋友在连续失控的营地危机里临场补位，把一场快要崩盘的局面救回来。

标题：双人机关玩法草案
类型：design_doc
来源：内部策划稿 v0.2

一句话想法：
验证双人协作机关是否能提升中期留存。

核心循环：
探索 -> 收集 -> 建造 -> 协作机关 -> 防守

核心事实：
- 玩家需要两人分别站在机关的不同区域，才能开启资源仓或解锁通道。
- 成功后可获得推进中期建造的关键材料。

玩家可能接受的原因：
- 合作目标清晰，会让“和朋友一起玩”更有价值。

玩家可能反感的原因：
- 如果朋友掉线或暂时离开，单人完全无法推进。

当前最大担忧：
- 失败惩罚太长，容易把合作乐趣变成重复劳动。`,
    'coop-camp-upload-sample.md',
    'zh',
  );

  assert.equal(payload.project?.name, '代号：远岸旅团');
  assert.equal(payload.project?.mode, 'Validation');
  assert.equal(payload.evidenceItems?.[0]?.trust, 'medium');
  assert.match(payload.evidenceItems?.[0]?.summary ?? '', /玩家需要两人分别站在机关的不同区域/);
  assert.doesNotMatch(payload.evidenceItems?.[0]?.summary ?? '', /单人完全无法推进/);
  assert.doesNotMatch(payload.evidenceItems?.[0]?.summary ?? '', /失败惩罚太长/);
});

test('parseMarkdownImport understands the English template labels', () => {
  const payload = parseMarkdownImport(
    `Project Name: Co-op Relay
Stage Mode: Live
Genre: Co-op action
Platforms: PC, Steam Deck
Target Players: Partner squads, creator-focused duos
Core Experience Promise:
Hold a collapsing run together long enough to create one memorable rescue.

Title: Sync Gate Draft
Type: design_doc
Source: Internal draft

Idea to Validate:
Test whether sync gates improve mid-run recall.

Core Loop:
Scout -> Gather -> Build -> Sync Gate -> Defend

Core Facts:
- Two players must stand on different switches to open the supply room.
- Success grants the material needed for the next camp upgrade.`,
    'sync-gate.md',
    'en',
  );

  assert.equal(payload.project?.name, 'Co-op Relay');
  assert.equal(payload.project?.mode, 'Live');
  assert.deepEqual(payload.project?.platforms, ['PC', 'Steam Deck']);
  assert.equal(payload.evidenceItems?.[0]?.title, 'Sync Gate Draft');
  assert.equal(payload.evidenceItems?.[0]?.trust, 'medium');
  assert.match(payload.evidenceItems?.[0]?.summary ?? '', /Two players must stand on different switches/);
});

test('parseMarkdownImport lowers evidence trust when core facts are missing', () => {
  const payload = parseMarkdownImport(
    `Title: Weekly retention note
Type: design_doc
Source: Internal note

One-line Idea:
Check whether the co-op gate improves recall.

Why Players May Accept:
- The success moment looks streamable.`,
    'retention-note.md',
    'en',
  );

  assert.equal(payload.project?.name, 'Weekly retention note');
  assert.equal(payload.evidenceItems?.[0]?.trust, 'low');
  assert.match(payload.warnings.join(' '), /Core Facts section/i);
});
