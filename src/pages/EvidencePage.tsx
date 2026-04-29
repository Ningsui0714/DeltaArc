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
      title: isEnglish ? 'Comment Excerpt' : '评论摘录',
      copy: isEnglish
        ? 'A student said, "The drink itself looked fine, but I only wanted to repost it after I saw real roommate reactions."'
        : '学生说“饮品本身还行，但我真正想转发，是看到室友试喝反应之后”。',
    },
    {
      title: isEnglish ? 'KOC Interview' : 'KOC 访谈',
      copy: isEnglish
        ? 'A campus KOC said that checklist-style selling points feel too official, while roommate storylines are easier to post.'
        : '校园 KOC 反馈：清单式卖点太像官方口播，但“室友故事线”更容易发出来。',
    },
    {
      title: isEnglish ? 'Competitor Note' : '竞品观察',
      copy: isEnglish
        ? 'A competing campus drink campaign got saves but weak comments because every post repeated the same product-angle template.'
        : '某校园饮品种草 campaign 的收藏不低，但评论弱，因为所有内容都在重复同一种产品角度。',
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
            <h3>{isEnglish ? 'Clean up the signals before deciding when to run the diagnosis' : '先把信号收干净，再决定什么时候跑正式诊断'}</h3>
          </div>
          <span className="panel-badge">{isEnglish ? 'No auto-run' : '现在不自动触发诊断'}</span>
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
          <p>
            {isEnglish
              ? 'Keep each evidence item to one concrete observation. Preserve direct quotes, posting scenes, data points, and timestamps before abstract conclusions.'
              : '每条证据尽量只写一个明确观察，优先保留原话、发帖场景、数据点和时间点，少写抽象结论。'}
          </p>
        </div>
      </section>

      <section className="panel composer-panel">
        <div className="panel-heading">
          <div>
            <p className="eyebrow">{isEnglish ? 'Signals Intake' : '信号入库'}</p>
            <h3>{isEnglish ? 'Add evidence' : '补充证据'}</h3>
          </div>
          <span className="panel-badge">{isEnglish ? 'Store first, no auto diagnosis' : '先入库，不自动诊断'}</span>
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
                  ? 'One observation per line, for example: Roommate reaction posts drive more comments than feature lists.'
                  : '每行一条观察，例如：室友反应类内容比功能介绍更容易带来评论'
              }
            />
          </label>
          <div className="field-card preview-card">
            <span>{isEnglish ? 'Parsed Preview' : '解析预览'}</span>
            <strong>{isEnglish ? `${parsedPreview.length} items ready to add` : `${parsedPreview.length} 条待加入观察`}</strong>
            <p>
              {isEnglish
                ? 'This area only loads evidence. It will not quietly run a diagnosis for you. Once the sample looks solid, go to the Diagnosis Desk and run it manually.'
                : '这里现在只负责把证据收进来，不会偷偷替你跑正式诊断。等你确认样本够了，再进入诊断台手动运行。'}
            </p>
            <button
              type="button"
              className="accent-button"
              disabled={parsedPreview.length === 0}
              onClick={handleAddEvidence}
            >
              {isEnglish ? 'Add to evidence stream' : '加入证据流'}
            </button>
            {lastAddedCount > 0 ? (
              <small>
                {isEnglish
                  ? `${lastAddedCount} items added. Next, go to the Diagnosis Desk and run the diagnosis manually.`
                  : `已加入 ${lastAddedCount} 条证据。下一步请进入诊断台手动运行正式诊断。`}
              </small>
            ) : null}
          </div>
        </div>
      </section>

      <FileImportCard
        title={isEnglish ? 'Import Evidence File' : '导入证据文件'}
        description={isEnglish ? 'Upload a single Markdown, TXT, or JSON file and it will be parsed into evidence cards. Importing only adds evidence and never generates a diagnosis automatically.' : '上传单个 Markdown、TXT 或 JSON 材料，系统会解析成证据卡。导入只会补充证据，不会自动生成诊断。'}
        accept=".json,.md,.markdown,.txt"
        hint={isEnglish ? 'Check the evidence cards after import, then run Quick Diagnosis or Deep Simulation from the Diagnosis Desk.' : '导入后建议先检查证据卡，再进入诊断台开始快速诊断或深度推演'}
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
          <p>{isEnglish ? 'Start with comment excerpts, KOC interviews, competitor observations, or brief snippets. You do not need a full template first.' : '你可以先从评论摘录、KOC 访谈、竞品观察或 brief 摘录开始，不需要先准备完整模板。'}</p>
          <ul className="bullet-list">
            <li>{isEnglish ? 'Keep each evidence item to one observation instead of mixing causes, conclusions, and suggestions together.' : '每条证据只写一个观察，不要把原因、结论、建议揉成一团。'}</li>
            <li>{isEnglish ? 'Preserve concrete scenes when possible, for example: "The comment rate only jumped after roommate reaction clips appeared."' : '尽量保留具体场景，例如“换成室友反应后，评论率才明显抬起来”。'}</li>
            <li>{isEnglish ? 'After importing or pasting evidence, go to the Diagnosis Desk and run it manually. Nothing auto-triggers now.' : '导入或粘贴证据后，记得去诊断台手动运行正式诊断，不会再自动触发。'}</li>
          </ul>
          <div className="empty-state-actions">
            <button type="button" className="ghost-button" onClick={() => onNavigate('overview')}>
              {isEnglish ? 'Back to Campaign Brief' : '回传播任务页补定义'}
            </button>
          </div>
        </section>
      )}
    </section>
  );
}
