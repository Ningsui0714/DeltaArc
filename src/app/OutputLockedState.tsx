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
            ? 'Run the inference desk before reviewing the current model.'
            : '先去推理台跑出正式结果，再看当前判断',
          description: isEnglish
            ? 'The output area only shows content from the formal backend run. Switch to the Inference Desk and run Quick Scan or Deep Dive first.'
            : '结果区只展示正式推理后的内容。现在请先切到“推理台”开始快速扫描或深度推演。',
          trustNote: isEnglish
            ? 'Inputs, inference, and outputs are now separated. Until a formal run completes, nothing here will pretend to be a conclusion.'
            : '输入、推理、输出现在已经拆开。没有正式结果前，这里不会提前长出看起来像结论的内容。',
        }
      : step === 'strategy'
        ? {
            title: isEnglish
              ? 'Run the inference desk before reviewing future evolution.'
              : '先去推理台跑出正式结果，再看未来演化',
            description: isEnglish
              ? 'Future beats, community rhythms, and inflection signals only come from the formal backend result, not from the intake pages.'
              : '未来时间线、社区节奏和转折信号都来自正式结果，不再和输入页混在一起。',
            trustNote: isEnglish
              ? 'If the formal run has not started yet, go to the Inference Desk first. That is the only place where the full process runs.'
              : '如果还没跑正式推理，请先切到“推理台”。那里才是运行和观察全过程的地方。',
          }
        : step === 'sandbox'
          ? {
              title: isEnglish
                ? 'Run the inference desk before opening the variable sandbox.'
                : '先去推理台跑出正式结果，再进入变量推演',
              description: isEnglish
                ? 'Variable Sandbox builds on top of the formal result. Run Quick Scan or Deep Dive first, then come back here to freeze a baseline and test a new variable.'
                : '变量推演建立在正式结果之上。请先开始快速扫描或深度推演，生成正式结果后再回来冻结基线并测试新变量。',
              trustNote: isEnglish
                ? 'This is a core workflow step, but it still needs a formal truth source before it can start.'
                : '这是第 5 步的核心流程，但它仍然需要一份稳定的正式结果才能启动。',
            }
          : {
              title: isEnglish
                ? 'Run the inference desk before opening the forecast report.'
                : '先去推理台跑出正式结果，再打开预测报告',
              description: isEnglish
                ? 'The report area only shows conclusions, timelines, trajectory signals, and actions after the formal run is complete.'
                : '报告区只会在正式推理完成后展示结论、时间线、走势信号和行动建议。',
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
