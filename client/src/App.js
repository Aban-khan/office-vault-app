import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast'; // <--- 1. Import this

import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import ResetPassword from './pages/ResetPassword';

function App() {
  return (
    <BrowserRouter>
      {/* 2. Add the Toaster here. This controls how the popups look. */}
      <Toaster 
        position="top-center" 
        toastOptions={{
          style: {
            background: '#333',
            color: '#fff',
            zIndex: 9999,
          },
        }} 
      />
      
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/reset-password/:resetToken" element={<ResetPassword />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;