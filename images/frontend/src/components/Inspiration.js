import React, { useState, useEffect } from 'react';

const Inspiration = ({ projectId, user }) => {
  const [items, setItems] = useState([]);
  const [findings, setFindings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState({
    is_vital: false,
    linked_finding_id: ''
  });
  const [imageFile, setImageFile] = useState(null);
  const [selectedImage, setSelectedImage] = useState(null);

  useEffect(() => {
    fetchItems();
    fetchFindings();
  }, [projectId]);

  const fetchItems = async () => {
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/inspiration/projects/${projectId}/inspiration`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const data = await response.json();
      setItems(data);
    } catch (error) {
      console.error('Error fetching inspiration items:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchFindings = async () => {
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/research/projects/${projectId}/findings`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const data = await response.json();
      setFindings(data);
    } catch (error) {
      console.error('Error fetching findings:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const formDataToSend = new FormData();
    formDataToSend.append('is_vital', formData.is_vital);
    formDataToSend.append('title', "")
    if (formData.linked_finding_id) {
      formDataToSend.append('linked_finding_id', formData.linked_finding_id);
    }
    
    if (imageFile) {
      formDataToSend.append('image', imageFile);
    }

    try {
      const url = editingItem 
        ? `${process.env.REACT_APP_API_URL}/inspiration/inspiration/${editingItem.id}`
        : `${process.env.REACT_APP_API_URL}/inspiration/projects/${projectId}/inspiration`;
      
      const method = editingItem ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: formDataToSend
      });

      if (response.ok) {
        resetForm();
        fetchItems();
      }
    } catch (error) {
      console.error('Error saving inspiration item:', error);
    }
  };

  const handleEdit = (item) => {
    setEditingItem(item);
    setFormData({
      is_vital: item.is_vital,
      linked_finding_id: item.linked_finding_id || ''
    });
    setShowAddForm(true);
  };

  const handleDelete = async (itemId) => {
    try {
      await fetch(`${process.env.REACT_APP_API_URL}/inspiration/inspiration/${itemId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      fetchItems();
    } catch (error) {
      console.error('Error deleting inspiration item:', error);
    }
  
  };

  const toggleVital = async (itemId) => {
    try {
      await fetch(`${process.env.REACT_APP_API_URL}/inspiration/inspiration/${itemId}/vital`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      fetchItems();
    } catch (error) {
      console.error('Error toggling vital status:', error);
    }
  };

  const resetForm = () => {
    setFormData({
      is_vital: false,
      linked_finding_id: ''
    });
    setImageFile(null);
    setEditingItem(null);
    setShowAddForm(false);
  };

  const handleImageClick = (imagePaths) => {
    setSelectedImage(imagePaths);
  };

  const closeImageOverlay = () => {
    setSelectedImage(null);
  };

  if (loading) {
    return <div className="loading">Loading inspiration items...</div>;
  }

  return (
    <div className="inspiration">
      <div className="inspiration-header">
        <button 
          onClick={() => setShowAddForm(true)}
          className="add-item-btn"
        >
          + Add Inspiration
        </button>
      </div>

      {showAddForm && (
        <div className="inspiration-form">
          <h4>{editingItem ? 'Edit Inspiration' : 'Add New Inspiration'}</h4>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="linked_finding_id">Link to Research Finding:</label>
              <select
                id="linked_finding_id"
                value={formData.linked_finding_id}
                onChange={(e) => setFormData({...formData, linked_finding_id: e.target.value})}
              >
                <option value="">Select a finding...</option>
                {findings.map(finding => (
                  <option key={finding.id} value={finding.id}>
                    {finding.title}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="image">Image:</label>
              <input
                type="file"
                id="image"
                onChange={(e) => setImageFile(e.target.files[0])}
                accept=".png,.gif,.webp,.jpeg,.jpg"
              />
              {imageFile && <span className="file-name">{imageFile.name}</span>}
              {editingItem && editingItem.image_path && !imageFile && (
                <div className="current-image">
                  Current image: <img src={`${process.env.REACT_APP_API_URL}${editingItem.image_path}`} alt="Current" />
                </div>
              )}
            </div>

            <div className="form-group checkbox-group">
              <label>
                <input
                  type="checkbox"
                  checked={formData.is_vital}
                  onChange={(e) => setFormData({...formData, is_vital: e.target.checked})}
                />
                Mark as vital
              </label>
            </div>

            <div className="form-actions">
              <button type="submit" className="save-btn">
                {editingItem ? 'Update' : 'Save'} Inspiration
              </button>
              <button type="button" onClick={resetForm} className="cancel-btn">
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="inspiration-grid">
        {items.length === 0 ? (
          <div className="no-items">
            <p>No inspiration items yet.</p>
            <button onClick={() => setShowAddForm(true)} className="add-first-item-btn">
              Add Your First Inspiration
            </button>
          </div>
        ) : (
          items.map(item => (
            <div 
              key={item.id} 
              className={`inspiration-item ${item.is_vital ? 'vital' : ''}`}
            >
              <div className="inspiration-header">
                <div className="inspiration-actions">
                  <button 
                    onClick={() => toggleVital(item.id)}
                    className={`vital-btn ${item.is_vital ? 'vital' : ''}`}
                    title={item.is_vital ? 'Remove vital status' : 'Mark as vital'}
                  >
                    {item.is_vital ? '🔴' : '⚪'}
                  </button>
                  <button 
                    onClick={() => handleEdit(item)}
                    className="edit-btn"
                    title="Edit inspiration"
                  >
                    ✏️
                  </button>
                  <button 
                    onClick={() => handleDelete(item.id)}
                    className="delete-btn"
                    title="Delete inspiration"
                  >
                    🗑️
                  </button>
                </div>
              </div>
              <div className="inspiration-meta">
                <span className="inspiration-author">
                  By {item.first_name} {item.last_name}
                </span>
                <span className="inspiration-date">
                  {new Date(item.created_at).toLocaleDateString()}
                </span>
              </div>

              {item.imagePaths && (
                <div className="inspiration-image">
                  <img 
                    src={`${process.env.REACT_APP_API_URL}${item.imagePaths.thumb || item.imagePaths.original}`} 
                    alt={item.title}
                    onClick={() => handleImageClick(item.imagePaths)}
                    className="inspiration-img"
                  />
                </div>
              )}



              {item.linked_finding_title && (
                <div className="inspiration-link">
                  <strong>Linked to Research:</strong>
                  <a href="#" className="finding-link">
                    {item.linked_finding_title}
                  </a>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {selectedImage && (
        <div className="image-overlay" onClick={closeImageOverlay}>
          <div className="overlay-content">
            <button className="close-overlay" onClick={closeImageOverlay}>×</button>
            <img 
              src={`${process.env.REACT_APP_API_URL}${selectedImage.wide || selectedImage.original}`} 
              alt="Full size inspiration"
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default Inspiration;