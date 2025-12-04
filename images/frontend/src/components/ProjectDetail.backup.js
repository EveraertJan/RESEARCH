import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { projectAPI, stackAPI, chatAPI, insightAPI, tagAPI, imageAPI, documentAPI } from '../services/api';

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
  const textareaRef = useRef(null);

  const [project, setProject] = useState(null);
  const [stacks, setStacks] = useState([]);
  const [currentStack, setCurrentStack] = useState(null);
  const [messages, setMessages] = useState([]);
  const [insights, setInsights] = useState([]);
  const [images, setImages] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [tags, setTags] = useState([]);
  const [messageInput, setMessageInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTagIds, setSelectedTagIds] = useState([]);
  const [activeTab, setActiveTab] = useState('insights');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCollaboratorModal, setShowCollaboratorModal] = useState(false);
  const [showTagModal, setShowTagModal] = useState(false);
  const [showAddTagModal, setShowAddTagModal] = useState(false);
  const [showImageUploadModal, setShowImageUploadModal] = useState(false);
  const [showDocumentUploadModal, setShowDocumentUploadModal] = useState(false);
  const [showLinkDocumentModal, setShowLinkDocumentModal] = useState(false);
  const [selectedInsight, setSelectedInsight] = useState(null);
  const [selectedImage, setSelectedImage] = useState(null);
  const [selectedDocument, setSelectedDocument] = useState(null);
  const [collaboratorEmail, setCollaboratorEmail] = useState('');
  const [newTag, setNewTag] = useState({ name: '', color1: '#007AFF', color2: null });
  const [imageUploadData, setImageUploadData] = useState({ name: '', file: null, selectedTagIds: [] });
  const [documentUploadData, setDocumentUploadData] = useState({ name: '', description: '', file: null, selectedTagIds: [] });
  const [showImageViewer, setShowImageViewer] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  useEffect(() => {
    fetchProjectData();
  }, [id]);

  useEffect(() => {
    if (currentStack) {
      fetchMessages();
      fetchInsights();
      fetchImages();
      fetchDocuments();
    }
  }, [currentStack]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const autoResizeTextarea = () => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = textarea.scrollHeight + 'px';
    }
  };

  const handleTextareaChange = (e) => {
    setMessageInput(e.target.value);
    autoResizeTextarea();
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && e.shiftKey) {
      e.preventDefault();
      handleSendMessage(e);
    }
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

  const fetchImages = async () => {
    if (!currentStack) return;
    try {
      const response = await imageAPI.getByStack(currentStack.id, {
        tagIds: selectedTagIds
      });
      setImages(response.data.images || []);
    } catch (err) {
      setError(err.message);
    }
  };

  const fetchDocuments = async () => {
    if (!currentStack) return;
    try {
      const response = await documentAPI.getByStack(currentStack.id, {
        tagIds: selectedTagIds
      });
      setDocuments(response.data.documents || []);
    } catch (err) {
      setError(err.message);
    }
  };

  useEffect(() => {
    if (currentStack) {
      fetchInsights();
      fetchImages();
      fetchDocuments();
    }
  }, [selectedTagIds, searchQuery]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!messageInput.trim()) return;

    try {
      const response = await chatAPI.sendMessage(id, messageInput, currentStack?.id);
      setMessageInput('');

      // Reset textarea height
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }

      // Check if it was a command that created a stack, insight, or image upload request
      if (response.data.type === 'stack_created') {
        // Refresh stacks and switch to the new one
        const stacksRes = await stackAPI.getByProject(id);
        setStacks(stacksRes.data.stacks || []);
        setCurrentStack(response.data.data);
      } else if (response.data.type === 'insight_created') {
        // Refresh insights
        fetchInsights();
      } else if (response.data.type === 'image_upload_requested') {
        // Show image upload modal
        setImageUploadData({ name: response.data.data.name, file: null, selectedTagIds: [] });
        setShowImageUploadModal(true);
        return; // Don't refresh messages yet
      } else if (response.data.type === 'document_upload_requested') {
        // Show document upload modal
        setDocumentUploadData({ name: response.data.data.name, description: '', file: null, selectedTagIds: [] });
        setShowDocumentUploadModal(true);
        return; // Don't refresh messages yet
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

  const handleImageUpload = async (e) => {
    e.preventDefault();
    if (!imageUploadData.file) {
      setError('Please select a file');
      return;
    }

    try {
      const formData = new FormData();
      formData.append('image', imageUploadData.file);
      formData.append('name', imageUploadData.name);

      const response = await imageAPI.upload(currentStack.id, formData);
      const uploadedImage = response.data.data.image;

      // Add tags if any were selected
      if (imageUploadData.selectedTagIds.length > 0) {
        for (const tagId of imageUploadData.selectedTagIds) {
          await imageAPI.addTag(uploadedImage.id, tagId);
        }
      }

      setShowImageUploadModal(false);
      setImageUploadData({ name: '', file: null, selectedTagIds: [] });
      fetchImages();
      setActiveTab('images');
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDeleteImage = async (imageId) => {
    if (window.confirm('Delete this image?')) {
      try {
        await imageAPI.delete(imageId);
        fetchImages();
      } catch (err) {
        setError(err.message);
      }
    }
  };

  const handleAddTagToImage = async (tagId) => {
    try {
      await imageAPI.addTag(selectedImage.id, tagId);
      setShowAddTagModal(false);
      setSelectedImage(null);
      fetchImages();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleRemoveTagFromImage = async (imageId, tagId) => {
    try {
      await imageAPI.removeTag(imageId, tagId);
      fetchImages();
    } catch (err) {
      setError(err.message);
    }
  };

  const toggleImageTagFilter = (tagId) => {
    if (imageUploadData.selectedTagIds.includes(tagId)) {
      setImageUploadData({
        ...imageUploadData,
        selectedTagIds: imageUploadData.selectedTagIds.filter(id => id !== tagId)
      });
    } else {
      setImageUploadData({
        ...imageUploadData,
        selectedTagIds: [...imageUploadData.selectedTagIds, tagId]
      });
    }
  };

  const handleDocumentUpload = async (e) => {
    e.preventDefault();
    if (!documentUploadData.file) {
      setError('Please select a file');
      return;
    }

    try {
      const formData = new FormData();
      formData.append('document', documentUploadData.file);
      formData.append('name', documentUploadData.name);
      formData.append('description', documentUploadData.description);

      const response = await documentAPI.upload(currentStack.id, formData);
      const uploadedDocument = response.data.data.document;

      // Add tags if any were selected
      if (documentUploadData.selectedTagIds.length > 0) {
        for (const tagId of documentUploadData.selectedTagIds) {
          await documentAPI.addTag(uploadedDocument.id, tagId);
        }
      }

      setShowDocumentUploadModal(false);
      setDocumentUploadData({ name: '', description: '', file: null, selectedTagIds: [] });
      fetchDocuments();
      setActiveTab('documents');
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDeleteDocument = async (documentId) => {
    if (window.confirm('Delete this document?')) {
      try {
        await documentAPI.delete(documentId);
        fetchDocuments();
      } catch (err) {
        setError(err.message);
      }
    }
  };

  const handleAddTagToDocument = async (tagId) => {
    try {
      await documentAPI.addTag(selectedDocument.id, tagId);
      setShowAddTagModal(false);
      setSelectedDocument(null);
      fetchDocuments();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleRemoveTagFromDocument = async (documentId, tagId) => {
    try {
      await documentAPI.removeTag(documentId, tagId);
      fetchDocuments();
    } catch (err) {
      setError(err.message);
    }
  };

  const toggleDocumentTagFilter = (tagId) => {
    if (documentUploadData.selectedTagIds.includes(tagId)) {
      setDocumentUploadData({
        ...documentUploadData,
        selectedTagIds: documentUploadData.selectedTagIds.filter(id => id !== tagId)
      });
    } else {
      setDocumentUploadData({
        ...documentUploadData,
        selectedTagIds: [...documentUploadData.selectedTagIds, tagId]
      });
    }
  };

  const handleLinkDocumentToInsight = async (documentId) => {
    try {
      await insightAPI.linkDocument(selectedInsight.id, documentId);
      setShowLinkDocumentModal(false);
      setSelectedInsight(null);
      fetchInsights();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleRemoveDocumentFromInsight = async (insightId, documentId) => {
    try {
      await insightAPI.unlinkDocument(insightId, documentId);
      fetchInsights();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleImageClick = (index) => {
    setCurrentImageIndex(index);
    setShowImageViewer(true);
  };

  const handlePreviousImage = () => {
    setCurrentImageIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  };

  const handleNextImage = () => {
    setCurrentImageIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  };

  const handleCloseImageViewer = () => {
    setShowImageViewer(false);
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (showImageViewer) {
        if (e.key === 'Escape') {
          handleCloseImageViewer();
        } else if (e.key === 'ArrowLeft') {
          handlePreviousImage();
        } else if (e.key === 'ArrowRight') {
          handleNextImage();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showImageViewer, images.length]);

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
            <textarea
              ref={textareaRef}
              value={messageInput}
              onChange={handleTextareaChange}
              onKeyDown={handleKeyDown}
              placeholder={
                currentStack
                  ? 'Type a message or use /insight [text] to add insight... (Shift+Enter to send)'
                  : 'Use /stack [topic] to create a research stack... (Shift+Enter to send)'
              }
              className="chat-input"
              rows="1"
            />
            <button type="submit" className="btn-primary">
              Send
            </button>
          </form>
        </div>

        {/* Right side: Insights/Images Table */}
        <div className="insights-section">
            <div className="stack-tabs">
              <button
                className={`stack-tab ${activeTab === 'insights' ? 'active' : ''}`}
                onClick={() => setActiveTab('insights')}
              >
                Insights
              </button>
              <button
                className={`stack-tab ${activeTab === 'images' ? 'active' : ''}`}
                onClick={() => setActiveTab('images')}
              >
                Images
              </button>
              <button
                className={`stack-tab ${activeTab === 'documents' ? 'active' : ''}`}
                onClick={() => setActiveTab('documents')}
              >
                Documents
              </button>
              <button onClick={() => setShowTagModal(true)} className="stack-tab manage-btn">
                Manage Tags
              </button>
          </div>
          <div className="content-section">
            {currentStack && (
              <div className="insights-filters">
                {activeTab === 'insights' && (
                  <input
                    type="text"
                    placeholder="Search insights..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="search-input"
                  />
                )}
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
          </div>
            {!currentStack ? (
              <div className="empty-state">
                <p>Select or create a research stack to view {activeTab}</p>
              </div>
            ) : activeTab === 'insights' ? (

              <div className="insights-table">
                <table>
                  <thead>
                    <tr>
                      <th>Insight</th>
                      <th>Documents</th>
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
                          <div className="insight-documents">
                            {insight.documents?.[0] ? (
                              <span className="document-link-wrapper">
                                <a
                                  href={documentAPI.getFileUrl(insight.documents[0].file_path)}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="document-link"
                                >
                                  {insight.documents[0].name}
                                </a>
                                <button
                                  className="document-remove"
                                  onClick={() => handleRemoveDocumentFromInsight(insight.id, insight.documents[0].id)}
                                  title="Unlink document"
                                >
                                  ×
                                </button>
                              </span>
                            ) : (
                              <button
                                className="add-document-btn"
                                onClick={() => {
                                  setSelectedInsight(insight);
                                  setShowLinkDocumentModal(true);
                                }}
                                title="Link document"
                              >
                                + Link document
                              </button>
                            )}
                          </div>
                        </td>
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
            ) : activeTab === 'images' ? (
              <div className="images-table">
                <table>
                  <thead>
                    <tr>
                      <th>Image</th>
                      <th>Name</th>
                      <th>Tags</th>
                      <th>Added By</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {images.map((image, index) => (
                      <tr key={image.id}>
                        <td>
                          <img
                            src={imageAPI.getFileUrl(image.file_path)}
                            alt={image.name}
                            className="image-thumbnail"
                            onClick={() => handleImageClick(index)}
                            style={{ cursor: 'pointer' }}
                          />
                        </td>
                        <td>{image.name}</td>
                        <td>
                          <div className="insight-tags">
                            {image.tags?.map((tag) => (
                              <span key={tag.id} className="tag-badge">
                                <ColorSquare color1={tag.color1} color2={tag.color2} size={12} />
                                <span className="tag-name">{tag.name}</span>
                                <button
                                  className="tag-remove"
                                  onClick={() => handleRemoveTagFromImage(image.id, tag.id)}
                                >
                                  ×
                                </button>
                              </span>
                            ))}
                            <button
                              className="add-tag-btn"
                              onClick={() => {
                                setSelectedImage(image);
                                setShowAddTagModal(true);
                              }}
                            >
                              +
                            </button>
                          </div>
                        </td>
                        <td>{image.username}</td>
                        <td>
                          <button
                            onClick={() => handleDeleteImage(image.id)}
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
            ) : (
              <div className="documents-table">
                <table>
                  <thead>
                    <tr>
                      <th>Document</th>
                      <th>Description</th>
                      <th>Tags</th>
                      <th>Added By</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {documents.map((document) => (
                      <tr key={document.id}>
                        <td>
                          <a
                            href={documentAPI.getFileUrl(document.file_path)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="document-link"
                          >
                            📄 {document.name}
                          </a>
                        </td>
                        <td>{document.description || '-'}</td>
                        <td>
                          <div className="insight-tags">
                            {document.tags?.map((tag) => (
                              <span key={tag.id} className="tag-badge">
                                <ColorSquare color1={tag.color1} color2={tag.color2} size={12} />
                                <span className="tag-name">{tag.name}</span>
                                <button
                                  className="tag-remove"
                                  onClick={() => handleRemoveTagFromDocument(document.id, tag.id)}
                                >
                                  ×
                                </button>
                              </span>
                            ))}
                            <button
                              className="add-tag-btn"
                              onClick={() => {
                                setSelectedDocument(document);
                                setShowAddTagModal(true);
                              }}
                            >
                              +
                            </button>
                          </div>
                        </td>
                        <td>{document.username}</td>
                        <td>
                          <button
                            onClick={() => handleDeleteDocument(document.id)}
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

      {/* Image Upload Modal */}
      {showImageUploadModal && (
        <div className="modal-overlay" onClick={() => setShowImageUploadModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>Upload Image</h2>
            <form onSubmit={handleImageUpload}>
              <div className="form-group">
                <label htmlFor="imageName">Image Name</label>
                <input
                  type="text"
                  id="imageName"
                  value={imageUploadData.name}
                  onChange={(e) => setImageUploadData({ ...imageUploadData, name: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="imageFile">Select Image</label>
                <input
                  type="file"
                  id="imageFile"
                  accept="image/*"
                  onChange={(e) => setImageUploadData({ ...imageUploadData, file: e.target.files[0] })}
                  required
                />
              </div>
              <div className="form-group">
                <label>Tags (optional)</label>
                <div className="tag-selection">
                  {tags.length === 0 ? (
                    <span className="no-tags">No tags available</span>
                  ) : (
                    tags.map((tag) => (
                      <button
                        key={tag.id}
                        type="button"
                        className={`tag-badge selectable ${imageUploadData.selectedTagIds.includes(tag.id) ? 'active' : ''}`}
                        onClick={() => toggleImageTagFilter(tag.id)}
                      >
                        <ColorSquare color1={tag.color1} color2={tag.color2} size={14} />
                        <span className="tag-name">{tag.name}</span>
                      </button>
                    ))
                  )}
                </div>
              </div>
              <div className="modal-actions">
                <button
                  type="button"
                  onClick={() => {
                    setShowImageUploadModal(false);
                    setImageUploadData({ name: '', file: null, selectedTagIds: [] });
                  }}
                  className="btn-secondary"
                >
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  Upload
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Document Upload Modal */}
      {showDocumentUploadModal && (
        <div className="modal-overlay" onClick={() => setShowDocumentUploadModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>Upload Document (PDF)</h2>
            <form onSubmit={handleDocumentUpload}>
              <div className="form-group">
                <label htmlFor="documentName">Document Name</label>
                <input
                  type="text"
                  id="documentName"
                  value={documentUploadData.name}
                  onChange={(e) => setDocumentUploadData({ ...documentUploadData, name: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="documentDescription">Description (optional)</label>
                <textarea
                  id="documentDescription"
                  value={documentUploadData.description}
                  onChange={(e) => setDocumentUploadData({ ...documentUploadData, description: e.target.value })}
                  rows="3"
                />
              </div>
              <div className="form-group">
                <label htmlFor="documentFile">Select PDF</label>
                <input
                  type="file"
                  id="documentFile"
                  accept="application/pdf,.pdf"
                  onChange={(e) => setDocumentUploadData({ ...documentUploadData, file: e.target.files[0] })}
                  required
                />
              </div>
              <div className="form-group">
                <label>Tags (optional)</label>
                <div className="tag-selection">
                  {tags.length === 0 ? (
                    <span className="no-tags">No tags available</span>
                  ) : (
                    tags.map((tag) => (
                      <button
                        key={tag.id}
                        type="button"
                        className={`tag-badge selectable ${documentUploadData.selectedTagIds.includes(tag.id) ? 'active' : ''}`}
                        onClick={() => toggleDocumentTagFilter(tag.id)}
                      >
                        <ColorSquare color1={tag.color1} color2={tag.color2} size={14} />
                        <span className="tag-name">{tag.name}</span>
                      </button>
                    ))
                  )}
                </div>
              </div>
              <div className="modal-actions">
                <button
                  type="button"
                  onClick={() => {
                    setShowDocumentUploadModal(false);
                    setDocumentUploadData({ name: '', description: '', file: null, selectedTagIds: [] });
                  }}
                  className="btn-secondary"
                >
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  Upload
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Link Document to Insight Modal */}
      {showLinkDocumentModal && selectedInsight && (
        <div className="modal-overlay" onClick={() => setShowLinkDocumentModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>Link Document to Insight</h2>
            <p className="modal-subtitle">{selectedInsight.content.substring(0, 100)}...</p>

            {documents.length === 0 ? (
              <div className="empty-state">
                <p>No documents available in this stack. Upload documents first!</p>
              </div>
            ) : (
              <div className="document-selection">
                <p style={{ marginBottom: '10px' }}>Select a document to link (one per insight):</p>
                {documents.map((doc) => (
                  <button
                    key={doc.id}
                    className="document-item selectable"
                    onClick={() => handleLinkDocumentToInsight(doc.id)}
                    style={{ display: 'block', width: '100%', marginBottom: '8px', padding: '10px', textAlign: 'left' }}
                  >
                    {doc.name}
                    {doc.description && <div style={{ fontSize: '12px', color: '#666' }}>{doc.description}</div>}
                  </button>
                ))}
              </div>
            )}

            <div className="modal-actions">
              <button
                type="button"
                onClick={() => {
                  setShowLinkDocumentModal(false);
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

      {/* Add Tag Modal (for Insights, Images, and Documents) */}
      {showAddTagModal && (selectedInsight || selectedImage || selectedDocument) && (
        <div className="modal-overlay" onClick={() => setShowAddTagModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>Add Tag to {selectedInsight ? 'Insight' : selectedImage ? 'Image' : 'Document'}</h2>
            {selectedInsight && (
              <p className="modal-subtitle">{selectedInsight.content.substring(0, 100)}...</p>
            )}
            {selectedImage && (
              <p className="modal-subtitle">{selectedImage.name}</p>
            )}
            {selectedDocument && (
              <p className="modal-subtitle">{selectedDocument.name}</p>
            )}

            {tags.length === 0 ? (
              <div className="empty-state">
                <p>No tags available. Create tags first!</p>
              </div>
            ) : (
              <div className="tag-selection">
                {tags
                  .filter(tag => {
                    const currentTags = selectedInsight ? selectedInsight.tags : selectedImage ? selectedImage.tags : selectedDocument.tags;
                    return !currentTags?.some(t => t.id === tag.id);
                  })
                  .map((tag) => (
                    <button
                      key={tag.id}
                      className="tag-badge selectable"
                      onClick={() => selectedInsight ? handleAddTagToInsight(tag.id) : selectedImage ? handleAddTagToImage(tag.id) : handleAddTagToDocument(tag.id)}
                    >
                      <ColorSquare color1={tag.color1} color2={tag.color2} size={14} />
                      <span className="tag-name">{tag.name}</span>
                    </button>
                  ))}
                {tags.every(tag => {
                  const currentTags = selectedInsight ? selectedInsight.tags : selectedImage.tags;
                  return currentTags?.some(t => t.id === tag.id);
                }) && (
                  <p>All tags have been added</p>
                )}
              </div>
            )}

            <div className="modal-actions">
              <button
                type="button"
                onClick={() => {
                  setShowAddTagModal(false);
                  setSelectedInsight(null);
                  setSelectedImage(null);
                  setSelectedDocument(null);
                }}
                className="btn-secondary"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Image Viewer Lightbox */}
      {showImageViewer && images.length > 0 && (
        <div className="lightbox-overlay" onClick={handleCloseImageViewer}>
          <button className="lightbox-close" onClick={handleCloseImageViewer}>
            ×
          </button>
          <button className="lightbox-nav lightbox-prev" onClick={(e) => { e.stopPropagation(); handlePreviousImage(); }}>
            ←
          </button>
          <button className="lightbox-nav lightbox-next" onClick={(e) => { e.stopPropagation(); handleNextImage(); }}>
            →
          </button>
          <div className="lightbox-content" onClick={(e) => e.stopPropagation()}>
            <img
              src={imageAPI.getFileUrl(images[currentImageIndex].file_path)}
              alt={images[currentImageIndex].name}
              className="lightbox-image"
            />
            <div className="lightbox-info">
              <p className="lightbox-name">{images[currentImageIndex].name}</p>
              <p className="lightbox-counter">{currentImageIndex + 1} / {images.length}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectDetail;
