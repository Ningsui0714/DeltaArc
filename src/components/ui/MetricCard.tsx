type MetricCardProps = {
  label: string;
  value: string;
  tone: 'good' | 'info' | 'alert';
};

export function MetricCard({ label, value, tone }: MetricCardProps) {
  return (
    <article className={`metric-card metric-${tone}`}>
      <span>{label}</span>
      <strong>{value}</strong>
    </article>
  );
}
