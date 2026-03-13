type ScoreBarProps = {
  label: string;
  value: number;
  reverse?: boolean;
};

export function ScoreBar({ label, value, reverse = false }: ScoreBarProps) {
  const clamped = Math.max(10, Math.min(96, value));
  const filled = reverse ? 100 - clamped : clamped;

  return (
    <div className="score-row">
      <div className="score-topline">
        <span>{label}</span>
        <strong>{clamped}%</strong>
      </div>
      <div className="score-track">
        <div className="score-fill" style={{ width: `${filled}%` }} />
      </div>
    </div>
  );
}
