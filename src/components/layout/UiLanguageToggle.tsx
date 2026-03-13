import { useUiLanguage } from '../../hooks/useUiLanguage';

export function UiLanguageToggle() {
  const { language, setLanguage } = useUiLanguage();

  return (
    <div className="ui-language-toggle" role="group" aria-label="界面语言">
      <button
        type="button"
        className={`ui-language-button ${language === 'zh' ? 'is-active' : ''}`}
        onClick={() => setLanguage('zh')}
      >
        ZH
      </button>
      <button
        type="button"
        className={`ui-language-button ${language === 'en' ? 'is-active' : ''}`}
        onClick={() => setLanguage('en')}
      >
        EN
      </button>
    </div>
  );
}
