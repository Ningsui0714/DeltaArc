import type { ProjectIntakeFieldId, ProjectIntakeInsights } from '../../lib/projectIntake';

type ProjectUnderstandingPanelProps = {
  isEnglish: boolean;
  positioningSummary: string;
  insights: ProjectIntakeInsights;
  getFieldLabel: (field: ProjectIntakeFieldId) => string;
};

export function ProjectUnderstandingPanel({
  isEnglish,
  positioningSummary,
  insights,
  getFieldLabel,
}: ProjectUnderstandingPanelProps) {
  const overviewMetrics = [
    {
      label: isEnglish ? 'Strong signals' : '明确优势',
      value: insights.strengths.length,
      hint: isEnglish ? 'already visible' : '已经看得出来',
    },
    {
      label: isEnglish ? 'Risk signals' : '风险信号',
      value: insights.risks.length,
      hint: isEnglish ? 'already exposed' : '已经暴露出来',
    },
    {
      label: isEnglish ? 'Missing signals' : '待补信号',
      value: insights.missingFieldIds.length,
      hint: isEnglish ? 'still affecting confidence' : '还会影响判断稳定性',
    },
  ];

  return (
    <aside className="project-understanding-panel">
      <div className="section-heading">
        <div>
          <p className="eyebrow">{isEnglish ? 'Current Read' : '当前系统理解'}</p>
          <h4>{isEnglish ? 'Live strategy understanding' : '实时策略理解预览'}</h4>
          <p>
            {isEnglish
              ? 'This is not the final verdict. It is a rolling read of what your current brief already makes clear.'
              : '这不是正式结论，而是系统根据当前输入已经能读出来的内容策略判断。'}
          </p>
        </div>
        <span className="meta-chip">{isEnglish ? 'Updates live' : '实时更新'}</span>
      </div>

      <div className="understanding-overview-panel">
        <article className="understanding-spotlight">
          <span>{isEnglish ? 'Current positioning read' : '当前定位判断'}</span>
          <strong>{positioningSummary}</strong>
        </article>

        <div className="understanding-snapshot-grid">
          {overviewMetrics.map((metric) => (
            <article key={metric.label} className="understanding-snapshot-card">
              <span>{metric.label}</span>
              <strong>{String(metric.value).padStart(2, '0')}</strong>
              <p>{metric.hint}</p>
            </article>
          ))}
        </div>
      </div>

      <div className="project-understanding-grid">
        <article className="understanding-card">
          <span>{isEnglish ? 'Signals that already feel strong' : '当前已经比较清楚的优势信号'}</span>
          {insights.strengths.length > 0 ? (
            <ul className="understanding-list">
              {insights.strengths.map((item) => (
                <li key={item.field}>
                  <strong>{getFieldLabel(item.field)}</strong>
                  <p>{item.value}</p>
                </li>
              ))}
            </ul>
          ) : (
            <p className="understanding-empty">
              {isEnglish ? 'The strongest content angle still is not clear enough.' : '现在还看不出足够明确的内容方向和传播卖点。'}
            </p>
          )}
        </article>

        <article className="understanding-card">
          <span>{isEnglish ? 'Signals that already look risky' : '当前已经暴露出来的风险信号'}</span>
          {insights.risks.length > 0 ? (
            <ul className="understanding-list">
              {insights.risks.map((item) => (
                <li key={item.field}>
                  <strong>{getFieldLabel(item.field)}</strong>
                  <p>{item.value}</p>
                </li>
              ))}
            </ul>
          ) : (
            <p className="understanding-empty">
              {isEnglish ? 'No explicit execution risk has been named yet.' : '你还没有明确写出主要传播或执行风险。'}
            </p>
          )}
        </article>

        <article className="understanding-card">
          <span>{isEnglish ? 'Signals still missing for a sharper call' : '要做更准判断还缺哪些信号'}</span>
          {insights.missingFieldIds.length > 0 ? (
            <ul className="understanding-list">
              {insights.missingFieldIds.slice(0, 6).map((field) => (
                <li key={field}>
                  <strong>{getFieldLabel(field)}</strong>
                  <p>
                    {isEnglish
                      ? 'Still empty, so the product read stays less stable here.'
                      : '这里还没有内容，所以系统在这个方向上的判断还不稳定。'}
                  </p>
                </li>
              ))}
            </ul>
          ) : (
            <p className="understanding-empty">
              {isEnglish
                ? 'The intake frame already looks complete enough for a sharper first diagnosis.'
                : '当前输入骨架已经比较完整，足以支撑更清晰的第一轮内容诊断。'}
            </p>
          )}
        </article>
      </div>
    </aside>
  );
}
