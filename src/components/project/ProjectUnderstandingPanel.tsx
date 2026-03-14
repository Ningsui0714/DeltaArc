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
  return (
    <aside className="project-understanding-panel">
      <div className="section-heading">
        <div>
          <p className="eyebrow">{isEnglish ? 'Current Read' : '当前系统理解'}</p>
          <h4>{isEnglish ? 'Live product understanding' : '实时产品理解预览'}</h4>
          <p>
            {isEnglish
              ? 'This is not the final verdict. It is a rolling read of what your current inputs already make clear.'
              : '这不是正式结论，而是系统根据当前输入已经能读出来的产品判断。'}
          </p>
        </div>
        <span className="meta-chip">{isEnglish ? 'Updates live' : '实时更新'}</span>
      </div>

      <article className="understanding-spotlight">
        <span>{isEnglish ? 'Current positioning read' : '当前定位判断'}</span>
        <strong>{positioningSummary}</strong>
      </article>

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
              {isEnglish ? 'The strongest selling angle still is not clear enough.' : '现在还看不出足够明确的卖点轮廓。'}
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
              {isEnglish ? 'No explicit risk has been named yet.' : '你还没有明确写出主要风险。'}
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
                ? 'The intake frame already looks complete enough for a sharper first analysis.'
                : '当前输入骨架已经比较完整，足以支撑更清晰的第一轮分析。'}
            </p>
          )}
        </article>
      </div>
    </aside>
  );
}
