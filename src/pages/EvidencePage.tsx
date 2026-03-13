import { useDeferredValue, useState } from 'react';
import { getTrustLabel } from '../lib/analysis';
import type { EvidenceItem } from '../types';
import { FileImportCard, type ImportFeedback } from '../components/import/FileImportCard';

const trustClassMap = {
  low: 'trust-low',
  medium: 'trust-medium',
  high: 'trust-high',
} as const;

type EvidencePageProps = {
  evidenceItems: EvidenceItem[];
  onAddEvidence: (lines: string[]) => number;
  onRefreshAnalysis: () => void;
  evidenceImportFeedback: ImportFeedback | null;
  onImportEvidenceFile: (file: File) => Promise<void>;
};

export function EvidencePage({
  evidenceItems,
  onAddEvidence,
  onRefreshAnalysis,
  evidenceImportFeedback,
  onImportEvidenceFile,
}: EvidencePageProps) {
  const [quickPaste, setQuickPaste] = useState('');
  const deferredQuickPaste = useDeferredValue(quickPaste);
  const parsedPreview = deferredQuickPaste
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean);

  function handleAddEvidence() {
    const addedCount = onAddEvidence(parsedPreview);
    if (addedCount > 0) {
      setQuickPaste('');
      onRefreshAnalysis();
    }
  }

  return (
    <section className="page-grid">
      <section className="panel composer-panel">
        <div className="panel-heading">
          <div>
            <p className="eyebrow">Signals Intake</p>
            <h3>证据输入</h3>
          </div>
          <span className="panel-badge">快速粘贴优先</span>
        </div>
        <div className="composer-grid">
          <label className="field-card">
            <span>快速粘贴材料</span>
            <textarea
              rows={7}
              value={quickPaste}
              onChange={(event) => setQuickPaste(event.target.value)}
              placeholder="每行一条观察，例如：玩家认为双人机关必须有单人补位方案"
            />
          </label>
          <div className="field-card preview-card">
            <span>解析预览</span>
            <strong>{parsedPreview.length} 条待加入观察</strong>
            <p>这里不要求完整表单，先把高价值原话和风险碎片快速堆出来。</p>
            <button type="button" className="accent-button" onClick={handleAddEvidence}>
              加入证据流
            </button>
          </div>
        </div>
      </section>

      <FileImportCard
        title="导入证据文件"
        description="上传单个 Markdown、TXT 或 JSON 材料，系统会自动解析成证据卡。适合访谈摘录、玩法草案、竞品评论归纳和结构化证据数组。"
        accept=".json,.md,.markdown,.txt"
        hint="单个文档会追加到当前证据流，JSON 数组会批量生成证据卡"
        buttonLabel="选择证据文件"
        feedback={evidenceImportFeedback}
        onImport={onImportEvidenceFile}
      />

      <section className="card-stream">
        {evidenceItems.map((item) => (
          <article key={item.id} className="evidence-card">
            <div className="card-topline">
              <span className="tiny-chip">{item.type}</span>
              <span className={`trust-chip ${trustClassMap[item.trust]}`}>{getTrustLabel(item.trust)}</span>
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
    </section>
  );
}
