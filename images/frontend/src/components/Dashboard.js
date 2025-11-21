import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';

const Dashboard = () => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showNewProjectForm, setShowNewProjectForm] = useState(false);
  const [newProject, setNewProject] = useState({ name: '', client: '', deadline: '' });
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      const response = await axios.get(process.env.REACT_APP_API_URL + '/projects');
      setProjects(response.data);
    } catch (error) {
      console.error('Error fetching projects:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateProject = async (e) => {
    e.preventDefault();
    try {
      await axios.post(process.env.REACT_APP_API_URL + '/projects', newProject);
      setNewProject({ name: '', client: '', deadline: '' });
      setShowNewProjectForm(false);
      fetchProjects();
    } catch (error) {
      console.error('Error creating project:', error);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (loading || !user) {
    return <div className="loading">Loading...</div>;
  }

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <h1>Welcome, {user?.first_name}!</h1>
        <div className="header-actions">
          <button onClick={() => navigate('/settings')} className="settings-btn">
            Settings
          </button>
          <button onClick={handleLogout} className="logout-btn">
            Logout
          </button>
        </div>
      </header>

      <main className="dashboard-main">
        <div className="projects-section">
          <div className="section-header">
            <h2>My Projects</h2>
            <button 
              onClick={() => setShowNewProjectForm(true)}
              className="new-project-btn"
            >
              + New Project
            </button>
          </div>

          {showNewProjectForm && (
            <div className="new-project-form">
              <h3>Create New Project</h3>
              <form onSubmit={handleCreateProject}>
                <div className="form-group">
                  <label htmlFor="name">Project Name:</label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={newProject.name}
                    onChange={(e) => setNewProject({...newProject, name: e.target.value})}
                    required
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="client">Client:</label>
                  <input
                    type="text"
                    id="client"
                    name="client"
                    value={newProject.client}
                    onChange={(e) => setNewProject({...newProject, client: e.target.value})}
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="deadline">Deadline:</label>
                  <input
                    type="date"
                    id="deadline"
                    name="deadline"
                    value={newProject.deadline}
                    onChange={(e) => setNewProject({...newProject, deadline: e.target.value})}
                  />
                </div>
                <div className="form-actions">
                  <button type="submit">Create Project</button>
                  <button type="button" onClick={() => setShowNewProjectForm(false)}>
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}

          <div className="projects-grid">
            {projects.length === 0 ? (
              <div className="no-projects">
                <p>No projects yet. Create your first project to get started!</p>
              </div>
            ) : (
              projects.map(project => (
                <div 
                  key={project.id} 
                  className="project-card"
                  onClick={() => navigate(`/projects/${project.id}`)}
                >
                  <h3>{project.name}</h3>
                  {project.client && <p className="client">Client: {project.client}</p>}
                  {project.deadline && <p className="deadline">Deadline: {new Date(project.deadline).toLocaleDateString()}</p>}
                  <div className="project-meta">
                    <small>Created: {new Date(project.created_at).toLocaleDateString()}</small>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;