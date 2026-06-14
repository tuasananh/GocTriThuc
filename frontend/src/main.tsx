import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.tsx';

async function enableMocking() {
  // Chỉ chạy mock ở chế độ development VÀ khi không tắt tường minh bằng VITE_USE_MOCKS
  if (import.meta.env.MODE !== 'development' || import.meta.env.VITE_USE_MOCKS === 'false') {
    return;
  }

  const { worker } = await import('./mocks/browser');
  // `worker.start()` returns a Promise that resolves
  // once the Service Worker is up and ready to intercept requests.
  return worker.start({
    onUnhandledRequest: 'bypass',
  });
}

enableMocking().then(() => {
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
});
