import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { projectAPI } from '../services/api';

const Dashboard = () => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [newProject, setNewProject] = useState({
    name: '',
    client: '',
    deadline: ''
  });
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      const response = await projectAPI.getAll();
      setProjects(response.data.projects || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateProject = async (e) => {
    e.preventDefault();
    setError('');

    try {
      await projectAPI.create(newProject);
      setShowModal(false);
      setNewProject({ name: '', client: '', deadline: '' });
      fetchProjects();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleProjectClick = (projectId) => {
    navigate(`/projects/${projectId}`);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (loading) {
    return <div className="loading">Loading projects...</div>;
  }

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <div>
          <h1>My Projects</h1>
          <p>Welcome back, {user?.first_name}!</p>
        </div>
        <div className="header-actions">
          <button onClick={() => navigate('/settings')} className="btn-secondary">
            Settings
          </button>
          <button onClick={handleLogout} className="btn-secondary">
            Logout
          </button>
          <button onClick={() => setShowModal(true)} className="btn-primary">
            + New Project
          </button>
        </div>
      </div>

      {error && <div className="error">{error}</div>}

      {projects.length === 0 ? (
        <div className="empty-state">
          <p>No projects yet. Create your first project to get started!</p>
        </div>
      ) : (
        <div className="projects-grid">
          {projects.map((project) => (
            <div
              key={project.id}
              className="project-card"
              onClick={() => handleProjectClick(project.id)}
            >
              <h3>{project.name}</h3>
              {project.client && <p className="client">Client: {project.client}</p>}
              {project.deadline && (
                <p className="deadline">
                  Deadline: {new Date(project.deadline).toLocaleDateString()}
                </p>
              )}
              <p className="meta">
                Created: {new Date(project.created_at).toLocaleDateString()}
              </p>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>Create New Project</h2>
            <form onSubmit={handleCreateProject}>
              <div className="form-group">
                <label htmlFor="name">Project Name *</label>
                <input
                  type="text"
                  id="name"
                  value={newProject.name}
                  onChange={(e) =>
                    setNewProject({ ...newProject, name: e.target.value })
                  }
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="client">Client</label>
                <input
                  type="text"
                  id="client"
                  value={newProject.client}
                  onChange={(e) =>
                    setNewProject({ ...newProject, client: e.target.value })
                  }
                />
              </div>
              <div className="form-group">
                <label htmlFor="deadline">Deadline</label>
                <input
                  type="date"
                  id="deadline"
                  value={newProject.deadline}
                  onChange={(e) =>
                    setNewProject({ ...newProject, deadline: e.target.value })
                  }
                />
              </div>
              <div className="modal-actions">
                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  Create Project
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
