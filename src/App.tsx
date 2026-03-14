import { AppContent } from './app/AppContent';
import { UiLanguageProvider } from './hooks/useUiLanguage';

function App() {
  return (
    <UiLanguageProvider>
      <AppContent />
    </UiLanguageProvider>
  );
}

export default App;
