import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { projectAPI, stackAPI, chatAPI, insightAPI, tagAPI } from '../services/api';

const COLOR_PALETTE = [
  { name: 'Red', value: '#FF3B30' },
  { name: 'Orange', value: '#FF9500' },
  { name: 'Yellow', value: '#FFCC00' },
  { name: 'Green', value: '#34C759' },
  { name: 'Blue', value: '#007AFF' },
  { name: 'Purple', value: '#AF52DE' },
  { name: 'Gray', value: '#8E8E93' }
];

const ColorSquare = ({ color1, color2, size = 16 }) => {
  if (!color2) {
    return (
      <span
        className="color-square"
        style={{
          width: `${size}px`,
          height: `${size}px`,
          backgroundColor: color1
        }}
      />
    );
  }

  return (
    <span
      className="color-square dual"
      style={{
        width: `${size}px`,
        height: `${size}px`,
        background: `linear-gradient(to top right, ${color1} 0%, ${color1} 50%, ${color2} 50%, ${color2} 100%)`
      }}
    />
  );
};

const ProjectDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const messagesEndRef = useRef(null);

  const [project, setProject] = useState(null);
  const [stacks, setStacks] = useState([]);
  const [currentStack, setCurrentStack] = useState(null);
  const [messages, setMessages] = useState([]);
  const [insights, setInsights] = useState([]);
  const [tags, setTags] = useState([]);
  const [messageInput, setMessageInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTagIds, setSelectedTagIds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCollaboratorModal, setShowCollaboratorModal] = useState(false);
  const [showTagModal, setShowTagModal] = useState(false);
  const [showAddTagModal, setShowAddTagModal] = useState(false);
  const [selectedInsight, setSelectedInsight] = useState(null);
  const [collaboratorEmail, setCollaboratorEmail] = useState('');
  const [newTag, setNewTag] = useState({ name: '', color1: '#007AFF', color2: null });

  useEffect(() => {
    fetchProjectData();
  }, [id]);

  useEffect(() => {
    if (currentStack) {
      fetchMessages();
      fetchInsights();
    }
  }, [currentStack]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchProjectData = async () => {
    try {
      const [projectRes, stacksRes, tagsRes] = await Promise.all([
        projectAPI.getById(id),
        stackAPI.getByProject(id),
        tagAPI.getByProject(id)
      ]);

      setProject(projectRes.data.project);
      setStacks(stacksRes.data.stacks || []);
      setTags(tagsRes.data.tags || []);

      if (stacksRes.data.stacks?.length > 0) {
        setCurrentStack(stacksRes.data.stacks[0]);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async () => {
    if (!currentStack) return;
    try {
      const response = await chatAPI.getMessages(id, currentStack.id);
      setMessages(response.data.messages || []);
    } catch (err) {
      setError(err.message);
    }
  };

  const fetchInsights = async () => {
    if (!currentStack) return;
    try {
      const response = await insightAPI.getByStack(currentStack.id, {
        tagIds: selectedTagIds,
        search: searchQuery
      });
      setInsights(response.data.insights || []);
    } catch (err) {
      setError(err.message);
    }
  };

  useEffect(() => {
    if (currentStack) {
      fetchInsights();
    }
  }, [selectedTagIds, searchQuery]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!messageInput.trim()) return;

    try {
      const response = await chatAPI.sendMessage(id, messageInput, currentStack?.id);
      setMessageInput('');

      // Check if it was a command that created a stack or insight
      if (response.data.type === 'stack_created') {
        // Refresh stacks and switch to the new one
        const stacksRes = await stackAPI.getByProject(id);
        setStacks(stacksRes.data.stacks || []);
        setCurrentStack(response.data.data);
      } else if (response.data.type === 'insight_created') {
        // Refresh insights
        fetchInsights();
      }

      // Refresh messages
      fetchMessages();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleAddCollaborator = async (e) => {
    e.preventDefault();
    try {
      await projectAPI.addCollaborator(id, collaboratorEmail);
      setShowCollaboratorModal(false);
      setCollaboratorEmail('');
      fetchProjectData();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleRemoveCollaborator = async (collaboratorId) => {
    if (window.confirm('Remove this collaborator?')) {
      try {
        await projectAPI.removeCollaborator(id, collaboratorId);
        fetchProjectData();
      } catch (err) {
        setError(err.message);
      }
    }
  };

  const handleDeleteInsight = async (insightId) => {
    if (window.confirm('Delete this insight?')) {
      try {
        await insightAPI.delete(insightId);
        fetchInsights();
      } catch (err) {
        setError(err.message);
      }
    }
  };

  const handleCreateTag = async (e) => {
    e.preventDefault();
    try {
      await tagAPI.create(id, newTag);
      setNewTag({ name: '', color1: '#007AFF', color2: null });
      setShowTagModal(false);
      const tagsRes = await tagAPI.getByProject(id);
      setTags(tagsRes.data.tags || []);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleAddTagToInsight = async (tagId) => {
    try {
      await tagAPI.addToInsight(selectedInsight.id, tagId);
      setShowAddTagModal(false);
      setSelectedInsight(null);
      fetchInsights();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleRemoveTagFromInsight = async (insightId, tagId) => {
    try {
      await tagAPI.removeFromInsight(insightId, tagId);
      fetchInsights();
    } catch (err) {
      setError(err.message);
    }
  };

  const toggleTagFilter = (tagId) => {
    setSelectedTagIds(prev =>
      prev.includes(tagId)
        ? prev.filter(id => id !== tagId)
        : [...prev, tagId]
    );
  };

  if (loading) {
    return <div className="loading">Loading project...</div>;
  }

  if (!project) {
    return <div className="error">Project not found</div>;
  }

  return (
    <div className="project-detail">
      <div className="project-header">
        <button onClick={() => navigate('/dashboard')} className="btn-back">
          ← Back to Projects
        </button>
        <div className="project-info">
          <h1>{project.name}</h1>
          {/*{project.client && <p>Client: {project.client}</p>}
          {project.deadline && <p>Deadline: {new Date(project.deadline).toLocaleDateString()}</p>}*/}
        </div>
        <button onClick={() => setShowCollaboratorModal(true)} className="btn-secondary">
          Manage Collaborators
        </button>
      </div>

      {error && <div className="error">{error}</div>}

      <div className="project-content">
        {/* Left side: Chat */}
        <div className="chat-section">
          <div className="stack-tabs">
            {stacks.length === 0 ? (
              <div className="empty-stack">
                <p>No research stacks yet. Use <code>/stack [topic]</code> in chat to create one!</p>
              </div>
            ) : (
              stacks.map((stack) => (
                <button
                  key={stack.id}
                  className={`stack-tab ${currentStack?.id === stack.id ? 'active' : ''}`}
                  onClick={() => setCurrentStack(stack)}
                >
                  {stack.topic}
                </button>
              ))
            )}
          </div>

          <div className="chat-messages">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`message ${msg.message_type === 'system' ? 'system' : 'user'}`}
              >
                {msg.message_type !== 'system' && (
                  <span className="message-author">
                    {msg.username || 'Unknown'}:
                  </span>
                )}
                <span className="message-text">{msg.message}</span>
                <span className="message-time">
                  {new Date(msg.created_at).toLocaleTimeString()}
                </span>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          <form onSubmit={handleSendMessage} className="chat-input-form">
            <input
              type="text"
              value={messageInput}
              onChange={(e) => setMessageInput(e.target.value)}
              placeholder={
                currentStack
                  ? 'Type a message or use /insight [text] to add insight...'
                  : 'Use /stack [topic] to create a research stack...'
              }
              className="chat-input"
            />
            <button type="submit" className="btn-primary">
              Send
            </button>
          </form>

          <div className="command-help">
            <strong>Commands:</strong>
            <code>/stack [topic]</code> - Create new research stack
            {currentStack && (
              <>
                {' | '}
                <code>/insight [text]</code> - Add insight to current stack
              </>
            )}
          </div>
        </div>

        {/* Right side: Insights Table */}
        <div className="insights-section">
          <div className="insights-header">
            <h2>Insights {currentStack && `for "${currentStack.topic}"`}</h2>
            <button onClick={() => setShowTagModal(true)} className="btn-secondary">
              Manage Tags
            </button>
          </div>

          {currentStack && (
            <div className="insights-filters">
              <input
                type="text"
                placeholder="Search insights..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="search-input"
              />
              <div className="tag-filters">
                <strong>Filter by tags:</strong>
                {tags.length === 0 ? (
                  <span className="no-tags">No tags yet</span>
                ) : (
                  tags.map((tag) => (
                    <button
                      key={tag.id}
                      className={`tag-filter ${selectedTagIds.includes(tag.id) ? 'active' : ''}`}
                      onClick={() => toggleTagFilter(tag.id)}
                    >
                      <ColorSquare color1={tag.color1} color2={tag.color2} size={14} />
                      <span>{tag.name}</span>
                    </button>
                  ))
                )}
              </div>
            </div>
          )}

          {!currentStack ? (
            <div className="empty-state">
              <p>Select or create a research stack to view insights</p>
            </div>
          ) : insights.length === 0 ? (
            <div className="empty-state">
              <p>No insights yet. Use <code>/insight [text]</code> to add one!</p>
            </div>
          ) : (
            <div className="insights-table">
              <table>
                <thead>
                  <tr>
                    <th>Insight</th>
                    <th>Tags</th>
                    <th>Added By</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {insights.map((insight) => (
                    <tr key={insight.id}>
                      <td>{insight.content}</td>
                      <td>
                        <div className="insight-tags">
                          {insight.tags?.map((tag) => (
                            <span key={tag.id} className="tag-badge">
                              <ColorSquare color1={tag.color1} color2={tag.color2} size={12} />
                              <span className="tag-name">{tag.name}</span>
                              <button
                                className="tag-remove"
                                onClick={() => handleRemoveTagFromInsight(insight.id, tag.id)}
                              >
                                ×
                              </button>
                            </span>
                          ))}
                          <button
                            className="add-tag-btn"
                            onClick={() => {
                              setSelectedInsight(insight);
                              setShowAddTagModal(true);
                            }}
                          >
                            +
                          </button>
                        </div>
                      </td>
                      <td>{insight.username}</td>
                      <td>
                        <button
                          onClick={() => handleDeleteInsight(insight.id)}
                          className="btn-danger-small"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Collaborator Modal */}
      {showCollaboratorModal && (
        <div className="modal-overlay" onClick={() => setShowCollaboratorModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>Manage Collaborators</h2>

            <div className="collaborators-list">
              <h3>Current Collaborators</h3>
              {project.collaborators?.length === 0 ? (
                <p>No collaborators yet</p>
              ) : (
                <ul>
                  {project.collaborators?.map((collab) => (
                    <li key={collab.id}>
                      {collab.first_name} {collab.last_name} ({collab.email})
                      <button
                        onClick={() => handleRemoveCollaborator(collab.id)}
                        className="btn-danger-small"
                      >
                        Remove
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <form onSubmit={handleAddCollaborator}>
              <h3>Add Collaborator</h3>
              <div className="form-group">
                <label htmlFor="email">Email Address</label>
                <input
                  type="email"
                  id="email"
                  value={collaboratorEmail}
                  onChange={(e) => setCollaboratorEmail(e.target.value)}
                  required
                />
              </div>
              <div className="modal-actions">
                <button
                  type="button"
                  onClick={() => setShowCollaboratorModal(false)}
                  className="btn-secondary"
                >
                  Close
                </button>
                <button type="submit" className="btn-primary">
                  Add Collaborator
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Tag Management Modal */}
      {showTagModal && (
        <div className="modal-overlay" onClick={() => setShowTagModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>Manage Tags</h2>

            <div className="tags-list">
              <h3>Project Tags</h3>
              {tags.length === 0 ? (
                <p>No tags yet</p>
              ) : (
                <div className="tag-grid">
                  {tags.map((tag) => (
                    <div key={tag.id} className="tag-item">
                      <span className="tag-badge">
                        <ColorSquare color1={tag.color1} color2={tag.color2} size={14} />
                        <span className="tag-name">{tag.name}</span>
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <form onSubmit={handleCreateTag}>
              <h3>Create New Tag</h3>
              <div className="form-group">
                <label htmlFor="tagName">Tag Name</label>
                <input
                  type="text"
                  id="tagName"
                  value={newTag.name}
                  onChange={(e) => setNewTag({ ...newTag, name: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label>Primary Color</label>
                <div className="color-palette">
                  {COLOR_PALETTE.map((color) => (
                    <button
                      key={color.value}
                      type="button"
                      className={`palette-color ${newTag.color1 === color.value ? 'selected' : ''}`}
                      style={{ backgroundColor: color.value }}
                      onClick={() => setNewTag({ ...newTag, color1: color.value })}
                      title={color.name}
                    />
                  ))}
                </div>
              </div>
              <div className="form-group">
                <label>Secondary Color (optional)</label>
                <div className="color-palette">
                  <button
                    type="button"
                    className={`palette-color ${!newTag.color2 ? 'selected' : ''}`}
                    style={{ backgroundColor: '#fff', border: '2px solid #000' }}
                    onClick={() => setNewTag({ ...newTag, color2: null })}
                    title="None"
                  >
                    ×
                  </button>
                  {COLOR_PALETTE.map((color) => (
                    <button
                      key={color.value}
                      type="button"
                      className={`palette-color ${newTag.color2 === color.value ? 'selected' : ''}`}
                      style={{ backgroundColor: color.value }}
                      onClick={() => setNewTag({ ...newTag, color2: color.value })}
                      title={color.name}
                    />
                  ))}
                </div>
              </div>
              <div className="form-group">
                <label>Preview</label>
                <div className="tag-preview">
                  <ColorSquare color1={newTag.color1} color2={newTag.color2} size={20} />
                  <span>{newTag.name || 'Tag Name'}</span>
                </div>
              </div>
              <div className="modal-actions">
                <button
                  type="button"
                  onClick={() => setShowTagModal(false)}
                  className="btn-secondary"
                >
                  Close
                </button>
                <button type="submit" className="btn-primary">
                  Create Tag
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Tag to Insight Modal */}
      {showAddTagModal && selectedInsight && (
        <div className="modal-overlay" onClick={() => setShowAddTagModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>Add Tag to Insight</h2>
            <p className="modal-subtitle">{selectedInsight.content.substring(0, 100)}...</p>

            {tags.length === 0 ? (
              <div className="empty-state">
                <p>No tags available. Create tags first!</p>
              </div>
            ) : (
              <div className="tag-selection">
                {tags
                  .filter(tag => !selectedInsight.tags?.some(t => t.id === tag.id))
                  .map((tag) => (
                    <button
                      key={tag.id}
                      className="tag-badge selectable"
                      onClick={() => handleAddTagToInsight(tag.id)}
                    >
                      <ColorSquare color1={tag.color1} color2={tag.color2} size={14} />
                      <span className="tag-name">{tag.name}</span>
                    </button>
                  ))}
                {tags.every(tag => selectedInsight.tags?.some(t => t.id === tag.id)) && (
                  <p>All tags have been added to this insight</p>
                )}
              </div>
            )}

            <div className="modal-actions">
              <button
                type="button"
                onClick={() => {
                  setShowAddTagModal(false);
                  setSelectedInsight(null);
                }}
                className="btn-secondary"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectDetail;
