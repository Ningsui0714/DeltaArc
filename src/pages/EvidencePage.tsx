import { useDeferredValue, useState } from 'react';
import { FileImportCard, type ImportFeedback } from '../components/import/FileImportCard';
import { getTrustLabel } from '../lib/analysis';
import { isEnglishUi, useUiLanguage } from '../hooks/useUiLanguage';
import type { EvidenceItem, StepId } from '../types';

const trustClassMap = {
  low: 'trust-low',
  medium: 'trust-medium',
  high: 'trust-high',
} as const;

type EvidencePageProps = {
  evidenceItems: EvidenceItem[];
  onAddEvidence: (lines: string[]) => number;
  evidenceImportFeedback: ImportFeedback | null;
  onImportEvidenceFile: (file: File) => Promise<void>;
  onNavigate: (step: StepId) => void;
};

export function EvidencePage({
  evidenceItems,
  onAddEvidence,
  evidenceImportFeedback,
  onImportEvidenceFile,
  onNavigate,
}: EvidencePageProps) {
  const { language } = useUiLanguage();
  const isEnglish = isEnglishUi(language);
  const [quickPaste, setQuickPaste] = useState('');
  const [lastAddedCount, setLastAddedCount] = useState(0);
  const deferredQuickPaste = useDeferredValue(quickPaste);
  const parsedPreview = deferredQuickPaste
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean);

  const evidenceExamples = [
    {
      title: isEnglish ? 'Interview Quote' : '访谈原话',
      copy: isEnglish
        ? 'A player said, "The first eight minutes felt like memorizing rules. It only became fun after the first rescue worked."'
        : '玩家说“前 8 分钟都像在背规则，直到第一次救援成功才觉得有意思”。',
    },
    {
      title: isEnglish ? 'Playtest Note' : '试玩观察',
      copy: isEnglish
        ? 'The tester missed twice that the two-player mechanism required simultaneous activation and blamed the teammate instead.'
        : '测试者连续两次没看懂双人机关需要同步触发，于是把失败归因到队友。',
    },
    {
      title: isEnglish ? 'Competitor Signal' : '竞品信号',
      copy: isEnglish
        ? 'Negative Steam reviews cluster around an overlong tutorial and harsh failure punishment, not around the theme itself.'
        : 'Steam 差评集中在教程过长和失败惩罚过重，而不是题材本身。',
    },
  ];

  function handleAddEvidence() {
    const addedCount = onAddEvidence(parsedPreview);
    if (addedCount > 0) {
      setQuickPaste('');
      setLastAddedCount(addedCount);
    }
  }

  return (
    <section className="page-grid">
      <section className="panel evidence-guide-panel">
        <div className="panel-heading">
          <div>
            <p className="eyebrow">{isEnglish ? 'Evidence Guide' : '证据指南'}</p>
            <h3>{isEnglish ? 'Clean up the signals before deciding when to run the forecast' : '先把信号收干净，再决定什么时候跑预测'}</h3>
          </div>
          <span className="panel-badge">{isEnglish ? 'No auto-run' : '现在不自动触发分析'}</span>
        </div>
        <div className="evidence-guide-grid">
          {evidenceExamples.map((example) => (
            <article key={example.title} className="guide-note-card">
              <p className="eyebrow">{example.title}</p>
              <p className="example-snippet">{example.copy}</p>
            </article>
          ))}
        </div>
        <div className="editor-note">
          <strong>{isEnglish ? 'Writing Rule' : '写法原则'}</strong>
          <p>{isEnglish ? 'Keep each evidence item to one concrete observation. Preserve direct quotes, scenes, and timestamps before abstract conclusions.' : '每条证据尽量只写一个明确观察，优先保留原话、具体场景和时间点，少写抽象结论。'}</p>
        </div>
      </section>

      <section className="panel composer-panel">
        <div className="panel-heading">
          <div>
            <p className="eyebrow">{isEnglish ? 'Signals Intake' : '信号入库'}</p>
            <h3>{isEnglish ? 'Add evidence' : '补充证据'}</h3>
          </div>
          <span className="panel-badge">{isEnglish ? 'Store first, no auto forecast' : '先入库，不自动预测'}</span>
        </div>
        <div className="composer-grid">
          <label className="field-card">
            <span>{isEnglish ? 'Quick Paste' : '快速粘贴素材'}</span>
            <textarea
              rows={7}
              value={quickPaste}
              onChange={(event) => setQuickPaste(event.target.value)}
              placeholder={
                isEnglish
                  ? 'One observation per line, for example: Players think the co-op mechanism needs a solo fallback path.'
                  : '每行一条观察，例如：玩家认为双人机关必须有单人补位方案'
              }
            />
          </label>
          <div className="field-card preview-card">
            <span>{isEnglish ? 'Parsed Preview' : '解析预览'}</span>
            <strong>{isEnglish ? `${parsedPreview.length} items ready to add` : `${parsedPreview.length} 条待加入观察`}</strong>
            <p>
              {isEnglish
                ? 'This area only loads evidence. It will not quietly run a forecast for you. Once the sample looks solid, go to the Inference Desk and run it manually.'
                : '这里现在只负责把证据收进来，不会偷偷替你跑预测。等你确认样本够了，再进入推理台手动运行推理。'}
            </p>
            <button
              type="button"
              className="accent-button"
              disabled={parsedPreview.length === 0}
              onClick={handleAddEvidence}
            >
              {isEnglish ? 'Add to evidence stream' : '加入证据流'}
            </button>
            {lastAddedCount > 0 ? <small>{isEnglish ? `${lastAddedCount} items added. Next, go to the Inference Desk and run the forecast manually.` : `已加入 ${lastAddedCount} 条证据。下一步请进入推理台手动运行推理。`}</small> : null}
          </div>
        </div>
      </section>

      <FileImportCard
        title={isEnglish ? 'Import Evidence File' : '导入证据文件'}
        description={isEnglish ? 'Upload a single Markdown, TXT, or JSON file and it will be parsed into evidence cards. Importing only adds evidence and never generates a forecast automatically.' : '上传单个 Markdown、TXT 或 JSON 材料，系统会解析成证据卡。导入只会补充证据，不会自动生成预测。'}
        accept=".json,.md,.markdown,.txt"
        hint={isEnglish ? 'Check the evidence cards after import, then run Quick Scan or Deep Dive from the Inference Desk.' : '导入后建议先检查证据卡，再进入推理台开始快速扫描或深度推演'}
        buttonLabel={isEnglish ? 'Choose Evidence File' : '选择证据文件'}
        feedback={evidenceImportFeedback}
        onImport={onImportEvidenceFile}
      />

      {evidenceItems.length > 0 ? (
        <section className="card-stream">
          {evidenceItems.map((item) => (
            <article key={item.id} className="evidence-card">
              <div className="card-topline">
                <span className="tiny-chip">{item.type}</span>
                <span className={`trust-chip ${trustClassMap[item.trust]}`}>{getTrustLabel(item.trust, language)}</span>
              </div>
              <h4>{item.title}</h4>
              <p>{item.summary}</p>
              <footer>
                <span>{item.source}</span>
                <span>{item.createdAt}</span>
              </footer>
            </article>
          ))}
        </section>
      ) : (
        <section className="panel empty-state-panel">
          <p className="eyebrow">{isEnglish ? 'No Evidence Yet' : '暂无证据'}</p>
          <h3>{isEnglish ? 'There are no evidence cards yet' : '这里还没有证据卡'}</h3>
          <p>{isEnglish ? 'Start with interview quotes, playtest notes, competitor reviews, or design excerpts. You do not need a full template first.' : '你可以先从访谈原话、试玩观察、竞品评论或设计摘录开始，不需要先准备完整模板。'}</p>
          <ul className="bullet-list">
            <li>{isEnglish ? 'Keep each evidence item to one observation instead of mixing causes, conclusions, and suggestions together.' : '每条证据只写一个观察，不要把原因、结论、建议揉成一团。'}</li>
            <li>{isEnglish ? 'Preserve concrete scenes when possible, for example: "It only became fun at minute eight."' : '尽量保留具体场景，例如“第 8 分钟才第一次觉得有趣”。'}</li>
            <li>{isEnglish ? 'After importing or pasting evidence, go to the Inference Desk and run it manually. Nothing auto-triggers now.' : '导入或粘贴证据后，记得去推理台手动运行推理，不会再自动触发。'}</li>
          </ul>
          <div className="empty-state-actions">
            <button type="button" className="ghost-button" onClick={() => onNavigate('overview')}>
              {isEnglish ? 'Back to Project Setup' : '回项目概览补定义'}
            </button>
          </div>
        </section>
      )}
    </section>
  );
}
