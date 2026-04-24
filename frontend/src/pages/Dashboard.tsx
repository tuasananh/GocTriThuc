import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import type { User } from '../types/User';

export default function Dashboard() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    axios
      .get('/api/users/me')
      .then((response) => {
        if (response.data.authenticated) {
          setUser(response.data);
        } else {
          navigate('/login');
        }
      })
      .catch((error) => {
        console.error(error);
        navigate('/login');
      })
      .finally(() => {
        setLoading(false);
      });
  }, [navigate]);

  const handleLogout = async () => {
    try {
      await axios.post('/api/logout');
      setUser(null);
      navigate('/login');
    } catch (error) {
      console.error(error);
      navigate('/login');
    }
  };

  if (loading) {
    return <div style={{ textAlign: 'center', marginTop: '50px' }}>Loading...</div>;
  }

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
      <div style={{ marginTop: '20px' }}>
        <Link to="/lexical-test">
          <button style={{ marginRight: '10px' }}>Thử Lexical</button>
        </Link>
        <button onClick={handleLogout}>Log Out</button>
      </div>
    </div>
  );
}
