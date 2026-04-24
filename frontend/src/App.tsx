import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Editor from './components/Editor';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route
          path="/lexical-test"
          element={
            <div
              style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                minHeight: '100vh',
                padding: '2rem',
                textAlign: 'left',
              }}
            >
              <div style={{ width: '100%', maxWidth: '42rem' }}>
                <Editor />
              </div>
            </div>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}
