import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard'; // <--- 1. Import the Dashboard
import './App.css';
import ResetPassword from './pages/ResetPassword';
function App() {
  return (
    <Router>
      <Routes>
        {/* Home page is Login */}
        <Route path="/" element={<Login />} />
        
        {/* 2. Add the Dashboard Route */}
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/resetpassword/:resetToken" element={<ResetPassword />} />
      </Routes>
    </Router>
  );
}

export default App;