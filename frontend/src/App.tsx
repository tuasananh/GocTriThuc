import { BrowserRouter, Routes, Route, Link, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import axios from 'axios';

// Import component CurriculumManager ông vừa tạo
// Đảm bảo đường dẫn import khớp với nơi ông tạo file nhé
import CurriculumManager from './pages/studio/course/curriculum';
import LessonEdit from './pages/studio/course/lesson';

// 1. Configure Axios globally so it always sends your session and CSRF cookies
axios.defaults.withCredentials = true;
axios.defaults.xsrfCookieName = 'XSRF-TOKEN';
axios.defaults.xsrfHeaderName = 'X-XSRF-TOKEN';

// Define the shape of our User data
interface User {
  authenticated: boolean;
  name?: string;
  email?: string;
  avatar?: string;
}

const Landing = () => (
  <div style={{ textAlign: 'center', marginTop: '50px' }}>
    <h1>Welcome to the LMS</h1>
    <Link to="/login">
      <button>Go to Login</button>
    </Link>
  </div>
);

const Login = () => {
  const handleGoogleLogin = () => {
    // Rely on the Vite proxy to forward this to Spring Boot
    window.location.href = '/oauth2/authorization/google';
  };

  return (
    <div style={{ textAlign: 'center', marginTop: '50px' }}>
      <h2>Sign In</h2>
      <button onClick={handleGoogleLogin}>Log in with Google</button>
    </div>
  );
};

const Dashboard = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    // The moment the Dashboard loads, ask Spring Boot for the user data
    axios
      .get('/api/users/me')
      .then((response) => {
        if (response.data.authenticated) {
          // User is logged in! Save their data to state.
          setUser(response.data);
        } else {
          // Not logged in. Kick them back to the login screen.
          navigate('/login');
        }
      })
      .catch((error) => {
        console.error('Error fetching user session:', error);
        navigate('/login');
      })
      .finally(() => {
        setLoading(false);
      });
  }, [navigate]);

  // --- NEW LOGOUT FUNCTION ---
  const handleLogout = async () => {
    try {
      // 1. Send the POST request to destroy the session and cookies
      await axios.post('/api/logout');

      // 2. Clear out any local React state (optional, but good practice)
      setUser(null);

      // 3. Gracefully route the user back to the login page
      navigate('/login');
    } catch (error) {
      console.error('Failed to log out cleanly', error);
      // Even if the server errors out, force them back to login locally
      navigate('/login');
    }
  };

  // Show a loading screen while waiting for Spring Boot to reply
  if (loading) {
    return <div style={{ textAlign: 'center', marginTop: '50px' }}>Loading...</div>;
  }

  // If the user is somehow null at this point, render nothing (the navigate will catch them)
  if (!user) return null;

  return (
    <div style={{ textAlign: 'center', marginTop: '50px' }}>
      <h2>Dashboard</h2>
      {user.avatar && (
        <img
          src={user.avatar}
          alt="Profile Avatar"
          style={{ width: '100px', borderRadius: '50%', marginBottom: '15px' }}
        />
      )}
      <h3>Welcome, {user.name}!</h3>
      <p>Logged in as: {user.email}</p>

      {/* A simple logout button that hits Spring Security's default logout endpoint */}
      <button onClick={handleLogout}>Log Out</button>
    </div>
  );
};

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/dashboard" element={<Dashboard />} />

        {/* Thêm Route mới cho phần Curriculum Manager */}
        <Route path="/studio/course/:courseId/curriculum" element={<CurriculumManager />} />
        {/* THÊM ROUTE MỚI CHO TRANG EDIT LESSON Ở ĐÂY */}
        <Route path="/studio/course/:courseId/lesson/:lessonId" element={<LessonEdit />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
