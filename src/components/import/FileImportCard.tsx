import { useState, type ChangeEvent } from 'react';

type ImportTone = 'success' | 'warning' | 'error' | 'neutral';

export type ImportFeedback = {
  tone: ImportTone;
  message: string;
};

type FileImportCardProps = {
  title: string;
  description: string;
  accept: string;
  hint: string;
  buttonLabel: string;
  feedback: ImportFeedback | null;
  onImport: (file: File) => Promise<void>;
};

export function FileImportCard({
  title,
  description,
  accept,
  hint,
  buttonLabel,
  feedback,
  onImport,
}: FileImportCardProps) {
  const [isImporting, setIsImporting] = useState(false);

  async function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = '';

    if (!file) {
      return;
    }

    setIsImporting(true);
    try {
      await onImport(file);
    } finally {
      setIsImporting(false);
    }
  }

  return (
    <section className="panel upload-panel">
      <div className="panel-heading">
        <div>
          <p className="eyebrow">File Import</p>
          <h3>{title}</h3>
        </div>
        <span className="panel-badge">支持 .json / .md</span>
      </div>

      <p className="upload-description">{description}</p>

      <label className="upload-dropzone">
        <input type="file" accept={accept} onChange={handleFileChange} />
        <strong>{isImporting ? '解析中...' : buttonLabel}</strong>
        <span>{hint}</span>
      </label>

      {feedback ? <p className={`upload-feedback feedback-${feedback.tone}`}>{feedback.message}</p> : null}
    </section>
  );
}
