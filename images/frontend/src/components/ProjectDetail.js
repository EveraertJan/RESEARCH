import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import ResearchFindings from './ResearchFindings';
import Inspiration from './Inspiration';
import Sketches from './Sketches';
import Technologies from './Technologies';

const ProjectDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeSection, setActiveSection] = useState('research');
  const [editingSection, setEditingSection] = useState(null);
  const [sectionContent, setSectionContent] = useState('');
  const [showCollaborators, setShowCollaborators] = useState(false);
  const [collaborators, setCollaborators] = useState([]);
  const [newCollaborator, setNewCollaborator] = useState({ email: '', role: 'collaborator' });

  useEffect(() => {
    fetchProject();
  }, [id]);

  useEffect(() => {
    if (showCollaborators && project) {
      fetchCollaborators();
    }
  }, [showCollaborators, project]);

  const fetchProject = async () => {
    try {
      const response = await axios.get(process.env.REACT_APP_API_URL + `/projects/${id}`);
      setProject(response.data);
    } catch (error) {
      console.error('Error fetching project:', error);
      navigate('/dashboard');
    } finally {
      setLoading(false);
    }
  };

  const handleSectionEdit = (sectionType) => {
    const section = project.sections.find(s => s.section_type === sectionType);
    setEditingSection(sectionType);
    setSectionContent(section?.content || '');
  };

  const handleSectionSave = async () => {
    try {
      await axios.put(
        process.env.REACT_APP_API_URL + `/projects/${id}/sections/${editingSection}`,
        { content: sectionContent }
      );
      setEditingSection(null);
      fetchProject();
    } catch (error) {
      console.error('Error saving section:', error);
    }
  };

  const handleSectionCancel = () => {
    setEditingSection(null);
    setSectionContent('');
  };

  const fetchCollaborators = async () => {
    try {
      const response = await axios.get(process.env.REACT_APP_API_URL + `/projects/${id}/collaborators`);
      setCollaborators(response.data);
    } catch (error) {
      console.error('Error fetching collaborators:', error);
    }
  };

  const handleAddCollaborator = async (e) => {
    e.preventDefault();
    try {
      await axios.post(process.env.REACT_APP_API_URL + `/projects/${id}/collaborators`, newCollaborator);
      setNewCollaborator({ email: '', role: 'collaborator' });
      fetchCollaborators();
    } catch (error) {
      console.error('Error adding collaborator:', error);
    }
  };

  const handleRemoveCollaborator = async (collaboratorId) => {
    try {
      await axios.delete(process.env.REACT_APP_API_URL + `/projects/${id}/collaborators/${collaboratorId}`);
      fetchCollaborators();
    } catch (error) {
      console.error('Error removing collaborator:', error);
    }
  };

  const sections = [
    { id: 'research', title: 'Research', icon: '🔍' },
    { id: 'inspiration', title: 'Inspiration', icon: '💡' },
    { id: 'sketches', title: 'Sketches', icon: '✏️' },
    { id: 'technologies', title: 'Technologies', icon: '⚙️' }
  ];

  if (loading) {
    return <div className="loading">Loading project...</div>;
  }

  if (!project) {
    return <div className="error">Project not found</div>;
  }

  if (!user) {
    return <div className="loading">Loading user data...</div>;
  }

  const currentSection = project.sections.find(s => s.section_type === activeSection);

  return (
    <div className="project-detail">
      <header className="project-header">
        <button onClick={() => navigate('/dashboard')} className="back-btn">
          ← Back to Projects
        </button>
        <div className="project-info">
          <h1>{project.name}</h1>
          {project.client && <p className="client">Client: {project.client}</p>}
          {project.deadline && <p className="deadline">Deadline: {new Date(project.deadline).toLocaleDateString()}</p>}
          <button 
            onClick={() => setShowCollaborators(!showCollaborators)}
            className="collaborators-btn"
          >
            {showCollaborators ? 'Hide' : 'Show'} Collaborators
          </button>
        </div>
      </header>

      {showCollaborators && (
        <div className="collaborators-section">
          <div className="collaborators-header">
            <h3>Collaborators</h3>
            {project.owner_id === user?.id && (
              <button 
                onClick={() => document.getElementById('add-collaborator-form').style.display = 'block'}
                className="add-collaborator-btn"
              >
                + Add Collaborator
              </button>
            )}
          </div>

          {project.owner_id === user?.id && (
            <form 
              id="add-collaborator-form" 
              onSubmit={handleAddCollaborator} 
              className="add-collaborator-form"
              style={{ display: 'none' }}
            >
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="email">Email:</label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={newCollaborator.email}
                    onChange={(e) => setNewCollaborator({...newCollaborator, email: e.target.value})}
                    required
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="role">Role:</label>
                  <select
                    id="role"
                    name="role"
                    value={newCollaborator.role}
                    onChange={(e) => setNewCollaborator({...newCollaborator, role: e.target.value})}
                  >
                    <option value="collaborator">Collaborator</option>
                    <option value="viewer">Viewer</option>
                  </select>
                </div>
              </div>
              <div className="form-actions">
                <button type="submit">Add</button>
                <button type="button" onClick={() => {
                  document.getElementById('add-collaborator-form').style.display = 'none';
                  setNewCollaborator({ email: '', role: 'collaborator' });
                }}>
                  Cancel
                </button>
              </div>
            </form>
          )}

          <div className="collaborators-list">
            {collaborators.length === 0 ? (
              <p>No collaborators yet.</p>
            ) : (
              collaborators.map(collaborator => (
                <div key={collaborator.id || `owner-${collaborator.user_id}`} className="collaborator-item">
                  <div className="collaborator-info">
                    <strong>{collaborator.first_name} {collaborator.last_name}</strong>
                    <span className="collaborator-email">{collaborator.email}</span>
                    <span className={`collaborator-role ${collaborator.role === 'owner' ? 'owner' : ''}`}>
                      {collaborator.role}
                    </span>
                    {collaborator.role === 'owner' ? (
                      <span className="collaborator-owner-badge">Project Creator</span>
                    ) : collaborator.invited_by ? (
                      <span className="collaborator-invited-by">
                        Invited by {collaborator.invited_by_first_name} {collaborator.invited_by_last_name}
                      </span>
                    ) : null}
                  </div>
                  {collaborator.role !== 'owner' && (project.owner_id === user?.id || collaborator.user_id === user?.id) && (
                    <button 
                      onClick={() => handleRemoveCollaborator(collaborator.id)}
                      className="remove-collaborator-btn"
                      title={collaborator.user_id === user?.id ? 'Leave project' : 'Remove collaborator'}
                    >
                      {collaborator.user_id === user?.id ? 'Leave' : 'Remove'}
                    </button>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}

      <div className="project-content">
        <nav className="section-nav">
          {sections.map(section => (
            <button
              key={section.id}
              className={`section-tab ${activeSection === section.id ? 'active' : ''}`}
              onClick={() => setActiveSection(section.id)}
            >
              <span className="section-icon">{section.icon}</span>
              {section.title}
            </button>
          ))}
        </nav>

        <main className="section-content">
          <div className="section-header">
            <h2>{sections.find(s => s.id === activeSection)?.title}</h2>
            {editingSection === activeSection ? (
              <div className="section-actions">
                <button onClick={handleSectionSave} className="save-btn">
                  Save
                </button>
                <button onClick={handleSectionCancel} className="cancel-btn">
                  Cancel
                </button>
              </div>
            ) : (
              <button 
                onClick={() => handleSectionEdit(activeSection)}
                className="edit-btn"
              >
                Edit
              </button>
            )}
          </div>

          {activeSection === 'research' ? (
            <ResearchFindings projectId={id} user={user} />
          ) : activeSection === 'inspiration' ? (
            <Inspiration projectId={id} user={user} />
          ) : activeSection === 'sketches' ? (
            <Sketches projectId={id} user={user} />
          ) : activeSection === 'technologies' ? (
            <Technologies projectId={id} user={user} />
          ) : editingSection === activeSection ? (
            <div className="section-editor">
              <ReactQuill
                theme="snow"
                value={sectionContent}
                onChange={setSectionContent}
                placeholder={`Add ${activeSection} content here...`}
              />
            </div>
          ) : (
            <div className="section-view">
              {currentSection?.content ? (
                <div>
                  <div 
                    className="content-display"
                    dangerouslySetInnerHTML={{ __html: currentSection.content }}
                  />
                  {currentSection.last_updated_by && (
                    <div className="content-attribution">
                      Last updated by {currentSection.updated_by_first_name} {currentSection.updated_by_last_name} (@{currentSection.updated_by_username})
                    </div>
                  )}
                </div>
              ) : (
                <div className="empty-section">
                  <p>No content in this section yet.</p>
                  <button onClick={() => handleSectionEdit(activeSection)}>
                    Add Content
                  </button>
                </div>
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default ProjectDetail;