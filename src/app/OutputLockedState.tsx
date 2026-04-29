import { AnalysisStatePanel } from '../components/analysis/AnalysisStatePanel';
import { isEnglishUi, useUiLanguage } from '../hooks/useUiLanguage';

type LockedOutputStep = 'modeling' | 'strategy' | 'sandbox' | 'report';

type OutputLockedStateProps = {
  step: LockedOutputStep;
  canRunAnalysis: boolean;
  onRunQuickForecast: () => void;
  onRunDeepForecast: () => void;
};

export function OutputLockedState({
  step,
  canRunAnalysis,
  onRunQuickForecast,
  onRunDeepForecast,
}: OutputLockedStateProps) {
  const { language } = useUiLanguage();
  const isEnglish = isEnglishUi(language);

  const copy =
    step === 'modeling'
      ? {
          title: isEnglish
            ? 'Run the diagnosis desk before reviewing the current diagnosis.'
            : '先去诊断台跑出策略结果，再看当前诊断',
          description: isEnglish
            ? 'The output area only shows content from the formal backend diagnosis. Switch to the Diagnosis Desk and run Quick Diagnosis or Deep Simulation first.'
            : '结果区只展示正式诊断后的内容。现在请先切到“诊断台”开始快速诊断或深度推演。',
          trustNote: isEnglish
            ? 'Inputs, diagnosis, and strategy outputs are separated. Until a formal run completes, nothing here will pretend to be a conclusion.'
            : '传播任务、诊断、策略输出现在已经拆开。没有正式结果前，这里不会提前长出看起来像结论的内容。',
        }
      : step === 'strategy'
        ? {
            title: isEnglish
              ? 'Run the diagnosis desk before reviewing spread evolution.'
              : '先去诊断台跑出策略结果，再看扩散演化',
            description: isEnglish
              ? 'Spread beats, platform rhythms, and inflection signals only come from the formal backend result, not from the intake pages.'
              : '扩散节点、平台节奏和转折信号都来自正式结果，不再和输入页混在一起。',
            trustNote: isEnglish
              ? 'If the formal run has not started yet, go to the Diagnosis Desk first. That is the place where the full process runs.'
              : '如果还没跑正式诊断，请先切到“诊断台”。那里才是运行和观察全过程的地方。',
          }
        : step === 'sandbox'
          ? {
              title: isEnglish
                ? 'Run the diagnosis desk before opening the variable lab.'
                : '先去诊断台跑出策略结果，再进入变量实验',
              description: isEnglish
                ? 'Variable Lab builds on top of the formal strategy result. Run Quick Diagnosis or Deep Simulation first, then come back here to freeze a baseline and test a content variable.'
                : '变量实验建立在正式策略结果之上。请先开始快速诊断或深度推演，生成正式结果后再回来冻结基线并测试内容变量。',
              trustNote: isEnglish
                ? 'This is a core workflow step, but it still needs a formal truth source before it can start.'
                : '这是第 5 步的核心流程，但它仍然需要一份稳定的正式结果才能启动。',
            }
          : {
              title: isEnglish
                ? 'Run the diagnosis desk before opening the strategy report.'
                : '先去诊断台跑出策略结果，再打开策略报告',
              description: isEnglish
                ? 'The report area only shows conclusions, spread signals, risks, and actions after the formal run is complete.'
                : '报告区只会在正式诊断完成后展示结论、扩散信号、主要风险和行动建议。',
              trustNote: isEnglish
                ? 'Without the remote analysis pipeline, this area will not show anything that looks like a conclusion.'
                : '如果没有触发远端分析链路，这里不会提前展示任何看起来像结论的内容。',
            };

  return (
    <AnalysisStatePanel
      title={copy.title}
      description={copy.description}
      trustNote={copy.trustNote}
      canRunAnalysis={canRunAnalysis}
      onRunQuickForecast={onRunQuickForecast}
      onRunDeepForecast={onRunDeepForecast}
    />
  );
}
