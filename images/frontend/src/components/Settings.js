import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';

const Settings = () => {
  const navigate = useNavigate();
  const { user, updateUser } = useAuth();
  const [profileData, setProfileData] = useState({
    first_name: '',
    last_name: '',
    username: '',
    email: ''
  });
  const [passwordData, setPasswordData] = useState({
    current_password: '',
    new_password: ''
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (user) {
      fetchProfile();
    }
  }, [user]);

  const fetchProfile = async () => {
    try {
      const response = await axios.get(process.env.REACT_APP_API_URL + '/users/profile');
      setProfileData({
        first_name: response.data.first_name,
        last_name: response.data.last_name,
        username: response.data.username,
        email: response.data.email
      });
    } catch (error) {
      console.error('Error fetching profile:', error);
    }
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');

    try {
      const response = await axios.put(process.env.REACT_APP_API_URL + '/users/profile', profileData);
      setMessage('Profile updated successfully!');
      // Update user data in auth context
      updateUser(response.data.user);
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');

    try {
      await axios.put(process.env.REACT_APP_API_URL + '/users/password', passwordData);
      setMessage('Password updated successfully!');
      setPasswordData({ current_password: '', new_password: '' });
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to update password');
    } finally {
      setLoading(false);
    }
  };

  const handleProfileChange = (e) => {
    setProfileData({
      ...profileData,
      [e.target.name]: e.target.value
    });
  };

  const handlePasswordChange = (e) => {
    setPasswordData({
      ...passwordData,
      [e.target.name]: e.target.value
    });
  };

  return (
    <div className="settings">
      <header className="settings-header">
        <button onClick={() => navigate('/dashboard')} className="back-btn">
          ← Back to Dashboard
        </button>
        <h1>Settings</h1>
      </header>

      <main className="settings-main">
        {message && <div className="success-message">{message}</div>}
        {error && <div className="error-message">{error}</div>}

        <section className="settings-section">
          <h2>Profile Information</h2>
          <form onSubmit={handleProfileSubmit} className="settings-form">
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="first_name">First Name:</label>
                <input
                  type="text"
                  id="first_name"
                  name="first_name"
                  value={profileData.first_name}
                  onChange={handleProfileChange}
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="last_name">Last Name:</label>
                <input
                  type="text"
                  id="last_name"
                  name="last_name"
                  value={profileData.last_name}
                  onChange={handleProfileChange}
                  required
                />
              </div>
            </div>
            
            <div className="form-group">
              <label htmlFor="username">Username:</label>
              <input
                type="text"
                id="username"
                name="username"
                value={profileData.username}
                onChange={handleProfileChange}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="email">Email:</label>
              <input
                type="email"
                id="email"
                name="email"
                value={profileData.email}
                onChange={handleProfileChange}
                required
              />
            </div>

            <button type="submit" disabled={loading} className="save-btn">
              {loading ? 'Saving...' : 'Save Profile'}
            </button>
          </form>
        </section>

        <section className="settings-section">
          <h2>Change Password</h2>
          <form onSubmit={handlePasswordSubmit} className="settings-form">
            <div className="form-group">
              <label htmlFor="current_password">Current Password:</label>
              <input
                type="password"
                id="current_password"
                name="current_password"
                value={passwordData.current_password}
                onChange={handlePasswordChange}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="new_password">New Password:</label>
              <input
                type="password"
                id="new_password"
                name="new_password"
                value={passwordData.new_password}
                onChange={handlePasswordChange}
                required
                minLength="6"
              />
            </div>

            <button type="submit" disabled={loading} className="save-btn">
              {loading ? 'Updating...' : 'Update Password'}
            </button>
          </form>
        </section>
      </main>
    </div>
  );
};

export default Settings;