import { useState } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';

const ResetPassword = () => {
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const { resetToken } = useParams(); // Get token from URL
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const { data } = await axios.put(`/api/auth/resetpassword/${resetToken}`, { password });
      setMessage('Password Reset Successful! Redirecting...');
      setTimeout(() => navigate('/'), 2000);
    } catch (error) {
      setMessage(error.response?.data?.message || 'Error resetting password');
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="w-full max-w-md p-8 bg-white rounded shadow-md">
        <h2 className="text-2xl font-bold text-center text-gray-800 mb-4">Set New Password</h2>
        {message && <div className={`p-3 mb-4 text-sm rounded ${message.includes('Successful') ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{message}</div>}
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <input type="password" placeholder="New Password" className="w-full p-2 border rounded" value={password} onChange={(e) => setPassword(e.target.value)} required />
          <button className="w-full py-2 font-bold text-white bg-green-600 rounded">Update Password</button>
        </form>
      </div>
    </div>
  );
};

export default ResetPassword;