import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { projectAPI, stackAPI, chatAPI, insightAPI, tagAPI, imageAPI, documentAPI } from '../services/api';

// Import components
import ChatSection from './ProjectDetail/Chat/ChatSection';
import InsightsTable from './ProjectDetail/Tables/InsightsTable';
import ImagesTable from './ProjectDetail/Tables/ImagesTable';
import DocumentsTable from './ProjectDetail/Tables/DocumentsTable';
import TagFilters from './ProjectDetail/Shared/TagFilters';
import AddTagModal from './ProjectDetail/Modals/AddTagModal';
import UploadImageModal from './ProjectDetail/Modals/UploadImageModal';
import UploadDocumentModal from './ProjectDetail/Modals/UploadDocumentModal';
import LinkDocumentModal from './ProjectDetail/Modals/LinkDocumentModal';
import EditInsightModal from './ProjectDetail/Modals/EditInsightModal';
import EditDocumentModal from './ProjectDetail/Modals/EditDocumentModal';
import ManageTagsModal from './ProjectDetail/Modals/ManageTagsModal';
import ManageCollaboratorsModal from './ProjectDetail/Modals/ManageCollaboratorsModal';

const COLOR_PALETTE = [
  { name: 'Red', value: '#FF3B30' },
  { name: 'Orange', value: '#FF9500' },
  { name: 'Yellow', value: '#FFCC00' },
  { name: 'Green', value: '#34C759' },
  { name: 'Blue', value: '#007AFF' },
  { name: 'Purple', value: '#AF52DE' },
  { name: 'Gray', value: '#8E8E93' }
];

const ProjectDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);

  // State
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

  // Modal states
  const [showCollaboratorModal, setShowCollaboratorModal] = useState(false);
  const [showTagModal, setShowTagModal] = useState(false);
  const [showAddTagModal, setShowAddTagModal] = useState(false);
  const [showImageUploadModal, setShowImageUploadModal] = useState(false);
  const [showDocumentUploadModal, setShowDocumentUploadModal] = useState(false);
  const [showLinkDocumentModal, setShowLinkDocumentModal] = useState(false);
  const [showImageViewer, setShowImageViewer] = useState(false);
  const [showEditInsightModal, setShowEditInsightModal] = useState(false);
  const [showEditDocumentModal, setShowEditDocumentModal] = useState(false);

  // Selected items
  const [selectedInsight, setSelectedInsight] = useState(null);
  const [selectedImage, setSelectedImage] = useState(null);
  const [selectedDocument, setSelectedDocument] = useState(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  // Form data
  const [collaboratorEmail, setCollaboratorEmail] = useState('');
  const [newTag, setNewTag] = useState({ name: '', color1: '#007AFF', color2: null });
  const [imageUploadData, setImageUploadData] = useState({ name: '', file: null, selectedTagIds: [] });
  const [documentUploadData, setDocumentUploadData] = useState({ name: '', description: '', file: null, selectedTagIds: [] });

  // Effects
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

  useEffect(() => {
    if (currentStack) {
      fetchInsights();
      fetchImages();
      fetchDocuments();
    }
  }, [selectedTagIds, searchQuery]);

  // Helper functions
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

  // Fetch functions
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

      if (stacksRes.data.stacks && stacksRes.data.stacks.length > 0) {
        setCurrentStack(stacksRes.data.stacks[0]);
      }

      setLoading(false);
    } catch (err) {
      setError(err.message);
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

  // Chat handlers
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

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!messageInput.trim()) return;

    try {
      const response = await chatAPI.sendMessage(id, messageInput, currentStack?.id);
      setMessageInput('');

      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }

      if (response.data.type === 'stack_created') {
        const stacksRes = await stackAPI.getByProject(id);
        setStacks(stacksRes.data.stacks || []);
        setCurrentStack(response.data.data);
      } else if (response.data.type === 'insight_created') {
        fetchInsights();
      } else if (response.data.type === 'image_upload_requested') {
        setImageUploadData({ name: response.data.data.name, file: null, selectedTagIds: [] });
        setShowImageUploadModal(true);
        return;
      } else if (response.data.type === 'document_upload_requested') {
        setDocumentUploadData({ name: response.data.data.name, description: '', file: null, selectedTagIds: [] });
        setShowDocumentUploadModal(true);
        return;
      }

      fetchMessages();
    } catch (err) {
      setError(err.message);
    }
  };

  // Insight handlers
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

  const handleEditInsight = async (insightId, newContent) => {
    try {
      await insightAPI.update(insightId, newContent);
      fetchInsights();
    } catch (err) {
      setError(err.message);
      throw err;
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

  // Image handlers
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
    setImageUploadData(prev => ({
      ...prev,
      selectedTagIds: prev.selectedTagIds.includes(tagId)
        ? prev.selectedTagIds.filter(id => id !== tagId)
        : [...prev.selectedTagIds, tagId]
    }));
  };

  // Document handlers
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

  const handleEditDocument = async (documentId, updates) => {
    try {
      await documentAPI.update(documentId, updates);
      fetchDocuments();
    } catch (err) {
      setError(err.message);
      throw err;
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
    setDocumentUploadData(prev => ({
      ...prev,
      selectedTagIds: prev.selectedTagIds.includes(tagId)
        ? prev.selectedTagIds.filter(id => id !== tagId)
        : [...prev.selectedTagIds, tagId]
    }));
  };

  // Image viewer handlers
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

  // Tag handlers
  const toggleTagFilter = (tagId) => {
    setSelectedTagIds(prev =>
      prev.includes(tagId)
        ? prev.filter(id => id !== tagId)
        : [...prev, tagId]
    );
  };

  const handleCreateTag = async (tagData) => {
    try {
      await tagAPI.create(id, tagData);
      const tagsRes = await tagAPI.getByProject(id);
      setTags(tagsRes.data.tags || []);
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  const handleUpdateTag = async (tagId, updates) => {
    try {
      await tagAPI.update(tagId, updates);
      const tagsRes = await tagAPI.getByProject(id);
      setTags(tagsRes.data.tags || []);
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  const handleDeleteTag = async (tagId) => {
    try {
      await tagAPI.delete(tagId);
      const tagsRes = await tagAPI.getByProject(id);
      setTags(tagsRes.data.tags || []);
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  // Determine which handler to use for add tag modal
  const handleAddTag = (tagId) => {
    if (selectedInsight) {
      handleAddTagToInsight(tagId);
    } else if (selectedImage) {
      handleAddTagToImage(tagId);
    } else if (selectedDocument) {
      handleAddTagToDocument(tagId);
    }
  };

  const getSelectedItemType = () => {
    if (selectedInsight) return 'insight';
    if (selectedImage) return 'image';
    if (selectedDocument) return 'document';
    return null;
  };

  const getSelectedItem = () => {
    return selectedInsight || selectedImage || selectedDocument;
  };

  if (loading) return <div className="loading">Loading project...</div>;
  if (error) return <div className="error">{error}</div>;
  if (!project) return <div className="error">Project not found</div>;

  return (
    <div className="project-detail">
      <div className="project-header">
        <div>
          <button onClick={() => navigate('/')} className="btn-back">← Back</button>
          <h1>{project.name}</h1>
          {project.client && <p className="client-name">Client: {project.client}</p>}
        </div>
        <button onClick={() => setShowCollaboratorModal(true)} className="btn-secondary">
          Manage Collaborators
        </button>
      </div>

      <div className="project-content">
        <ChatSection
          stacks={stacks}
          currentStack={currentStack}
          messages={messages}
          messageInput={messageInput}
          textareaRef={textareaRef}
          messagesEndRef={messagesEndRef}
          onSelectStack={setCurrentStack}
          onSendMessage={handleSendMessage}
          onMessageChange={handleTextareaChange}
          onKeyDown={handleKeyDown}
        />

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
            <button onClick={() => setShowTagModal(true)} className="stack-tab">
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
                <TagFilters
                  tags={tags}
                  selectedTagIds={selectedTagIds}
                  onToggle={toggleTagFilter}
                />
              </div>
            )}
          </div>

          {!currentStack ? (
            <div className="empty-state">
              <p>Select or create a research stack to view {activeTab}</p>
            </div>
          ) : activeTab === 'insights' ? (
            <InsightsTable
              insights={insights}
              onDelete={handleDeleteInsight}
              onEdit={(insight) => {
                setSelectedInsight(insight);
                setShowEditInsightModal(true);
              }}
              onAddTag={(insight) => {
                setSelectedInsight(insight);
                setShowAddTagModal(true);
              }}
              onRemoveTag={handleRemoveTagFromInsight}
              onLinkDocument={(insight) => {
                setSelectedInsight(insight);
                setShowLinkDocumentModal(true);
              }}
              onRemoveDocument={handleRemoveDocumentFromInsight}
            />
          ) : activeTab === 'images' ? (
            <ImagesTable
              images={images}
              onDelete={handleDeleteImage}
              onAddTag={(image) => {
                setSelectedImage(image);
                setShowAddTagModal(true);
              }}
              onRemoveTag={handleRemoveTagFromImage}
              onImageClick={handleImageClick}
            />
          ) : (
            <DocumentsTable
              documents={documents}
              onDelete={handleDeleteDocument}
              onEdit={(document) => {
                setSelectedDocument(document);
                setShowEditDocumentModal(true);
              }}
              onAddTag={(document) => {
                setSelectedDocument(document);
                setShowAddTagModal(true);
              }}
              onRemoveTag={handleRemoveTagFromDocument}
            />
          )}
        </div>
      </div>

      {/* Modals */}
      <AddTagModal
        show={showAddTagModal}
        onClose={() => {
          setShowAddTagModal(false);
          setSelectedInsight(null);
          setSelectedImage(null);
          setSelectedDocument(null);
        }}
        tags={tags}
        selectedItem={getSelectedItem()}
        itemType={getSelectedItemType()}
        onAddTag={handleAddTag}
      />

      <UploadImageModal
        show={showImageUploadModal}
        onClose={() => {
          setShowImageUploadModal(false);
          setImageUploadData({ name: '', file: null, selectedTagIds: [] });
        }}
        onSubmit={handleImageUpload}
        tags={tags}
        uploadData={imageUploadData}
        setUploadData={setImageUploadData}
        onToggleTag={toggleImageTagFilter}
      />

      <UploadDocumentModal
        show={showDocumentUploadModal}
        onClose={() => {
          setShowDocumentUploadModal(false);
          setDocumentUploadData({ name: '', description: '', file: null, selectedTagIds: [] });
        }}
        onSubmit={handleDocumentUpload}
        tags={tags}
        uploadData={documentUploadData}
        setUploadData={setDocumentUploadData}
        onToggleTag={toggleDocumentTagFilter}
      />

      <LinkDocumentModal
        show={showLinkDocumentModal}
        onClose={() => {
          setShowLinkDocumentModal(false);
          setSelectedInsight(null);
        }}
        documents={documents}
        selectedInsight={selectedInsight}
        onLinkDocument={handleLinkDocumentToInsight}
      />

      {showEditInsightModal && (
        <EditInsightModal
          insight={selectedInsight}
          onClose={() => {
            setShowEditInsightModal(false);
            setSelectedInsight(null);
          }}
          onSave={handleEditInsight}
        />
      )}

      {showEditDocumentModal && (
        <EditDocumentModal
          document={selectedDocument}
          onClose={() => {
            setShowEditDocumentModal(false);
            setSelectedDocument(null);
          }}
          onSave={handleEditDocument}
        />
      )}

      <ManageTagsModal
        show={showTagModal}
        onClose={() => setShowTagModal(false)}
        tags={tags}
        onCreateTag={handleCreateTag}
        onUpdateTag={handleUpdateTag}
        onDeleteTag={handleDeleteTag}
      />

      <ManageCollaboratorsModal
        show={showCollaboratorModal}
        onClose={() => setShowCollaboratorModal(false)}
        projectId={id}
        projectAPI={projectAPI}
      />

      {/* Image Viewer Modal */}
      {showImageViewer && (
        <div className="modal-overlay" onClick={() => setShowImageViewer(false)}>
          <div className="image-viewer-modal" onClick={(e) => e.stopPropagation()}>
            <button className="close-viewer" onClick={() => setShowImageViewer(false)}>×</button>
            <button className="nav-button prev" onClick={handlePreviousImage}>‹</button>
            <img
              src={imageAPI.getFileUrl(images[currentImageIndex]?.file_path)}
              alt={images[currentImageIndex]?.name}
              className="viewer-image"
            />
            <button className="nav-button next" onClick={handleNextImage}>›</button>
            <div className="image-info">
              {images[currentImageIndex]?.name}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectDetail;
