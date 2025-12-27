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
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');

    try {
      if (view === 'login') {
        const { data } = await axios.post('/auth/login', { email, password });
        localStorage.setItem('userInfo', JSON.stringify(data));
        navigate('/dashboard');
      } 
      else if (view === 'signup') {
        await axios.post('/auth/register', { name, email, password, phoneNumber });
        setMessage('Signup successful! Wait for approval.');
        setView('login');
      } 
      else if (view === 'forgot-email') {
        // Step 1: Send Email -> Backend looks up Phone -> Sends OTP
        const { data } = await axios.post('/auth/forgot-otp', { email });
        setMessage(data.message); // e.g. "OTP sent to phone ending in 9999"
        setView('forgot-otp');
      }
      else if (view === 'forgot-otp') {
        // Step 2: Verify OTP using Email to identify user
        await axios.post('/auth/reset-otp', { email, otp, newPassword });
        setMessage('Password Changed Successfully! Please Login.');
        setView('login');
      }
    } catch (error) {
      setMessage(error.response?.data?.message || 'Something went wrong');
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="w-full max-w-md p-8 bg-white rounded shadow-md">
        <h2 className="text-2xl font-bold text-center text-gray-800 mb-6">
          {view === 'login' && 'Login'}
          {view === 'signup' && 'Create Account'}
          {view.includes('forgot') && 'Reset Password'}
        </h2>
        
        {message && <div className={`p-3 mb-4 text-sm rounded ${message.includes('Success') || message.includes('sent') ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{message}</div>}

        <form onSubmit={handleSubmit} className="space-y-4">
          
          {/* SIGNUP FIELDS */}
          {view === 'signup' && (
            <>
              <div><label className="text-sm font-bold text-gray-700">Name</label><input type="text" className="w-full p-2 border rounded" value={name} onChange={e=>setName(e.target.value)} required /></div>
              <div><label className="text-sm font-bold text-gray-700">Phone Number (For Recovery)</label><input type="text" placeholder="e.g. 9876543210" className="w-full p-2 border rounded" value={phoneNumber} onChange={e=>setPhoneNumber(e.target.value)} required /></div>
            </>
          )}

          {/* EMAIL FIELD (Used in Login, Signup, and Forgot Password) */}
          {(view === 'login' || view === 'signup' || view === 'forgot-email') && (
             <div><label className="text-sm font-bold text-gray-700">Email Address</label><input type="email" className="w-full p-2 border rounded" value={email} onChange={e=>setEmail(e.target.value)} required /></div>
          )}

          {/* PASSWORD FIELD (Login/Signup) */}
          {(view === 'login' || view === 'signup') && (
            <div><label className="text-sm font-bold text-gray-700">Password</label><input type="password" className="w-full p-2 border rounded" value={password} onChange={e=>setPassword(e.target.value)} required /></div>
          )}

          {/* FORGOT PASSWORD - STEP 2 (Enter OTP & New Pass) */}
          {view === 'forgot-otp' && (
            <>
               <div className="p-2 bg-blue-50 text-blue-800 text-xs rounded mb-2">Check the phone number registered with <b>{email}</b> for the code.</div>
               <div><label className="text-sm font-bold text-gray-700">Enter OTP Code</label><input type="text" className="w-full p-2 border rounded" value={otp} onChange={e=>setOtp(e.target.value)} required /></div>
               <div><label className="text-sm font-bold text-gray-700">New Password</label><input type="password" className="w-full p-2 border rounded" value={newPassword} onChange={e=>setNewPassword(e.target.value)} required /></div>
            </>
          )}

          <button type="submit" className="w-full py-2 font-bold text-white bg-blue-600 rounded hover:bg-blue-700">
            {view === 'login' ? 'Login' : view === 'signup' ? 'Sign Up' : view === 'forgot-email' ? 'Send OTP to My Phone' : 'Reset Password'}
          </button>
        </form>

        <div className="mt-4 text-center text-sm space-y-2">
            {view === 'login' && (
                <>
                    <p>Don't have an account? <button onClick={() => { setView('signup'); setMessage(''); }} className="text-blue-600 font-bold hover:underline">Sign Up</button></p>
                    <button onClick={() => { setView('forgot-email'); setMessage(''); }} className="text-gray-500 hover:underline">Forgot Password?</button>
                </>
            )}
            {view !== 'login' && (
                <button onClick={() => { setView('login'); setMessage(''); }} className="text-blue-600 font-bold hover:underline">Back to Login</button>
            )}
        </div>
      </div>
    </div>
  );
};

export default Login;