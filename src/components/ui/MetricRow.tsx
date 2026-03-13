type MetricRowProps = {
  label: string;
  value: string;
};

export function MetricRow({ label, value }: MetricRowProps) {
  return (
    <div className="metric-row">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}
