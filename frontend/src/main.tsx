import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import './styles.css';
import '@fontsource/be-vietnam-pro/400.css';
import '@fontsource/be-vietnam-pro/700.css';
import '@fontsource/nunito/400.css';
import '@fontsource/nunito/700.css';
import '@fontsource/roboto/400.css';
import '@fontsource/roboto/700.css';
import '@fontsource/open-sans/400.css';
import '@fontsource/open-sans/700.css';
import '@fontsource/montserrat/400.css';
import '@fontsource/montserrat/700.css';
import '@fontsource/lexend/400.css';
import '@fontsource/lexend/700.css';
import '@fontsource/source-sans-3/400.css';
import '@fontsource/source-sans-3/700.css';
import '@fontsource/inter/400.css';
import '@fontsource/inter/700.css';
import './api/axiosConfig';
import App from './App.tsx';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
