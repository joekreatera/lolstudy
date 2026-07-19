import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import LanguageProvider from './i18n/LanguageProvider.tsx';
import './index.css';

// The provider sits above <App/> so switching language re-renders the survey
// without remounting it — App's progress state is untouched by the change.
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <LanguageProvider>
      <App />
    </LanguageProvider>
  </StrictMode>
);
