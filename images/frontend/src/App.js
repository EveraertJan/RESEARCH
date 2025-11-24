import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import Login from './components/Login';
import Register from './components/Register';
import Dashboard from './components/Dashboard';
import ProjectDetail from './components/ProjectDetail';
import Settings from './components/Settings';
import Footer from './components/Footer';
import './index.css';

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="App">
          <div className="container">
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/projects/:id" element={<ProjectDetail />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="/" element={<Login />} />
            </Routes>
          </div>
          <Footer />
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
