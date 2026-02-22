import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import './App.css';
import SignIn from './components/SignIn';
import SignUp from './components/SignUp';

function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/" element={<Navigate to="/signin" replace />} />
          <Route path="/signin" element={<SignIn />} />
          <Route path="/signup" element={<SignUp />} />
          <Route path="/dashboard" element={<Dashboard />} />
        </Routes>
      </div>
    </Router>
  );
}

// Temporary Dashboard placeholder
function Dashboard() {
  return (
    <div style={{ padding: '40px', textAlign: 'center' }}>
      <h1>Dashboard</h1>
      <p>Welcome to Nexia Digital CRM!</p>
      <button 
        onClick={() => {
          localStorage.removeItem('token');
          window.location.href = '/signin';
        }}
        style={{
          padding: '12px 24px',
          background: '#1E90FF',
          color: 'white',
          border: 'none',
          borderRadius: '8px',
          cursor: 'pointer',
          fontSize: '14px',
          fontWeight: '600'
        }}
      >
        Se déconnecter
      </button>
    </div>
  );
}

export default App;
