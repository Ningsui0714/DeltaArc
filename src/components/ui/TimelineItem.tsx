type TimelineItemProps = {
  time: string;
  title: string;
  detail: string;
};

export function TimelineItem({ time, title, detail }: TimelineItemProps) {
  return (
    <article className="timeline-item">
      <span>{time}</span>
      <div>
        <strong>{title}</strong>
        <p>{detail}</p>
      </div>
    </article>
  );
}
