import { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const Login = () => {
  // Views: 'login', 'signup', 'forgot-email', 'forgot-otp'
  const [view, setView] = useState('login'); 
  
  // Form Data
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  
  // OTP Data
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');

  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false); // Added Loading State
  const navigate = useNavigate();

  // --- 🔥 VITAL: THE BACKEND URL ---
  const API_URL = 'https://office-vault-app.onrender.com/api/auth';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    setLoading(true);

    try {
      if (view === 'login') {
        const { data } = await axios.post(`${API_URL}/login`, { email, password });
        localStorage.setItem('userInfo', JSON.stringify(data));
        navigate('/dashboard');
      } 
      else if (view === 'signup') {
        await axios.post(`${API_URL}/register`, { name, email, password, phoneNumber });
        setMessage('Signup successful! Wait for approval.');
        setView('login');
      } 
      else if (view === 'forgot-email') {
        const { data } = await axios.post(`${API_URL}/forgot-otp`, { email });
        setMessage(data.message); 
        setView('forgot-otp');
      }
      else if (view === 'forgot-otp') {
        await axios.post(`${API_URL}/reset-otp`, { email, otp, newPassword });
        setMessage('Password Changed Successfully! Please Login.');
        setView('login');
      }
      setLoading(false);
    } catch (error) {
      console.error("Login Error:", error); 
      setMessage(error.response?.data?.message || 'Connection Failed. Check Internet or Backend.');
      setLoading(false);
    }
  };

  return (
    // ✨ UPDATED BACKGROUND: Dark Gradient to make the card pop
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      
      {/* Login Card with Cream Background */}
      <div className="w-full max-w-md p-8 bg-[#FFF8E7] rounded-xl shadow-2xl border border-[#dcd6c8]">
        
        {/* 🏢 LOGO SECTION (Make sure logo192.png is in your public folder) */}
        <div className="flex justify-center mb-6">
            <img src="/logo192.png" alt="Logo" className="h-20 object-contain" />
        </div>

        <h2 className="text-3xl font-bold text-center text-gray-800 mb-6 font-serif">
          {view === 'login' && 'Staff Login'}
          {view === 'signup' && 'Join the Vault'}
          {view.includes('forgot') && 'Reset Password'}
        </h2>
        
        {message && <div className={`p-3 mb-4 text-sm font-bold text-center rounded ${message.includes('Success') || message.includes('sent') ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{message}</div>}

        <form onSubmit={handleSubmit} className="space-y-5">
          
          {/* SIGNUP FIELDS */}
          {view === 'signup' && (
            <>
              <div><label className="text-sm font-bold text-gray-700 uppercase">Full Name</label><input type="text" className="w-full p-3 border border-gray-300 rounded focus:outline-none focus:border-brown-600" value={name} onChange={e=>setName(e.target.value)} required /></div>
              <div><label className="text-sm font-bold text-gray-700 uppercase">Phone (For Recovery)</label><input type="text" placeholder="+91..." className="w-full p-3 border border-gray-300 rounded focus:outline-none focus:border-brown-600" value={phoneNumber} onChange={e=>setPhoneNumber(e.target.value)} required /></div>
            </>
          )}

          {/* EMAIL */}
          {(view === 'login' || view === 'signup' || view === 'forgot-email') && (
             <div><label className="text-sm font-bold text-gray-700 uppercase">Email Address</label><input type="email" className="w-full p-3 border border-gray-300 rounded focus:outline-none focus:border-brown-600" value={email} onChange={e=>setEmail(e.target.value)} required /></div>
          )}

          {/* PASSWORD */}
          {(view === 'login' || view === 'signup') && (
            <div><label className="text-sm font-bold text-gray-700 uppercase">Password</label><input type="password" className="w-full p-3 border border-gray-300 rounded focus:outline-none focus:border-brown-600" value={password} onChange={e=>setPassword(e.target.value)} required /></div>
          )}

          {/* FORGOT PASS STEPS */}
          {view === 'forgot-otp' && (
            <>
               <div className="p-2 bg-blue-50 text-blue-800 text-xs rounded mb-2">Code sent to phone linked with <b>{email}</b></div>
               <div><label className="text-sm font-bold text-gray-700">Enter OTP</label><input type="text" className="w-full p-3 border rounded" value={otp} onChange={e=>setOtp(e.target.value)} required /></div>
               <div><label className="text-sm font-bold text-gray-700">New Password</label><input type="password" className="w-full p-3 border rounded" value={newPassword} onChange={e=>setNewPassword(e.target.value)} required /></div>
            </>
          )}

          <button disabled={loading} type="submit" className="w-full py-3 text-lg font-bold text-white transition-all bg-stone-700 rounded hover:bg-stone-800 shadow-md">
            {loading ? 'Processing...' : (view === 'login' ? 'Access Vault' : view === 'signup' ? 'Submit Request' : view === 'forgot-email' ? 'Send Code' : 'Update Password')}
          </button>
        </form>

        <div className="mt-6 text-center text-sm space-y-3">
            {view === 'login' && (
                <>
                    <p className="text-gray-600">New Staff? <button onClick={() => { setView('signup'); setMessage(''); }} className="text-stone-700 font-bold hover:underline">Apply Here</button></p>
                    <button onClick={() => { setView('forgot-email'); setMessage(''); }} className="text-gray-400 hover:text-stone-600 text-xs">Forgot Password?</button>
                </>
            )}
            {view !== 'login' && (
                <button onClick={() => { setView('login'); setMessage(''); }} className="text-stone-700 font-bold hover:underline">← Back to Login</button>
            )}
        </div>
      </div>
    </div>
  );
};

export default Login;