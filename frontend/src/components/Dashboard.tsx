import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Button } from '@/components/ui/button';

interface User {
  authenticated: boolean;
  email?: string;
  avatarUrl?: string;
  displayName?: string;
}

export const Dashboard = () => {
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
        console.error('Lỗi tải dữ liệu người dùng:', error);
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
      console.error('Lỗi đăng xuất:', error);
      navigate('/login');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-linear-to-br from-slate-900 via-slate-800 to-slate-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mb-4" />
          <p className="text-slate-200">Đang tải...</p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  console.log('Dữ liệu người dùng:', user);

  return (
    <div className="min-h-screen w-full bg-linear-to-br from-slate-900 via-slate-800 to-slate-900 px-4 py-8">
      <div className="max-w-2xl mx-auto">
        {/* Header with logout button */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white">GocTriThuc</h1>
            <p className="text-sm text-slate-400">Đọc là "Góc Tri Thức"</p>
          </div>
          <Button
            onClick={handleLogout}
            variant="outline"
            className="bg-red-600 hover:bg-red-700 text-white border-0 font-semibold flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
              />
            </svg>
            Đăng Xuất
          </Button>
        </div>

        {/* User Profile Card */}
        <div className="bg-slate-800 rounded-lg border border-slate-700 p-8 space-y-6">
          <div className="flex flex-col items-center space-y-4">
            {user.avatarUrl && (
              <img
                src={user.avatarUrl}
                alt="Ảnh hồ sơ"
                className="w-24 h-24 rounded-full border-4 border-blue-500 object-cover"
              />
            )}
            <div className="text-center">
              <h2 className="text-2xl font-bold text-white">Chào mừng, {user.displayName}!</h2>
              <p className="text-slate-400 mt-1">Email: {user.email}</p>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-6 border-t border-slate-700">
            <Button className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2">
              Khám Phá Khóa Học
            </Button>
            <Button
              variant="outline"
              className="bg-slate-700 hover:bg-slate-600 text-white border-slate-600 font-semibold py-2"
            >
              Thông Tin Tài Khoản
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
