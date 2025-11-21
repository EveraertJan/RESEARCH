import React, { useState, useEffect } from 'react';

const Sketches = ({ projectId, user }) => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState({
    is_vital: false
  });
  const [imageFile, setImageFile] = useState(null);
  const [selectedImage, setSelectedImage] = useState(null);

  useEffect(() => {
    fetchItems();
  }, [projectId]);

  const fetchItems = async () => {
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/sketches/projects/${projectId}/sketches`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const data = await response.json();
      setItems(data);
    } catch (error) {
      console.error('Error fetching sketches:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const formDataToSend = new FormData();
    formDataToSend.append('is_vital', formData.is_vital);
    
    if (imageFile) {
      formDataToSend.append('image', imageFile);
    }

    try {
      const url = editingItem 
        ? `${process.env.REACT_APP_API_URL}/sketches/sketches/${editingItem.id}`
        : `${process.env.REACT_APP_API_URL}/sketches/projects/${projectId}/sketches`;
      
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
      console.error('Error saving sketch:', error);
    }
  };

  const handleEdit = (item) => {
    setEditingItem(item);
    setFormData({
      is_vital: item.is_vital
    });
    setShowAddForm(true);
  };

  const handleDelete = async (itemId) => {
    try {
      await fetch(`${process.env.REACT_APP_API_URL}/sketches/sketches/${itemId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      fetchItems();
    } catch (error) {
      console.error('Error deleting sketch:', error);
    }
  
  };

  const toggleVital = async (itemId) => {
    try {
      await fetch(`${process.env.REACT_APP_API_URL}/sketches/sketches/${itemId}/vital`, {
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
      is_vital: false
    });
    setImageFile(null);
    setEditingItem(null);
    setShowAddForm(false);
  };

  const handleImageClick = (imagePaths) => {
    console.log(imagePaths)
    setSelectedImage(imagePaths);
  };

  const closeImageOverlay = () => {
    setSelectedImage(null);
  };


  if (loading) {
    return <div className="loading">Loading sketches...</div>;
  }

  return (
    <div className="sketches">
      <div className="sketches-header">
        <button 
          onClick={() => setShowAddForm(true)}
          className="add-item-btn"
        >
          + Add Sketch
        </button>
      </div>

      {showAddForm && (
        <div className="sketches-form">
          <h4>{editingItem ? 'Edit Sketch' : 'Add New Sketch'}</h4>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="image">Sketch Image:</label>
              <input
                type="file"
                id="image"
                onChange={(e) => setImageFile(e.target.files[0])}
                accept=".png,.jpg,.jpeg"
                required
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
                {editingItem ? 'Update' : 'Save'} Sketch
              </button>
              <button type="button" onClick={resetForm} className="cancel-btn">
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="sketches-grid">
        {items.length === 0 ? (
          <div className="no-items">
            <p>No sketches yet.</p>
            <button onClick={() => setShowAddForm(true)} className="add-first-item-btn">
              Add Your First Sketch
            </button>
          </div>
        ) : (
          items.map(item => (
            <div 
              key={item.id} 
              className={`sketches-item ${item.is_vital ? 'vital' : ''}`}
            >
              <div className="sketches-header">
                <div className="sketches-actions">
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
                    title="Edit sketch"
                  >
                    ✏️
                  </button>
                  <button 
                    onClick={() => handleDelete(item.id)}
                    className="delete-btn"
                    title="Delete sketch"
                  >
                    🗑️
                  </button>
                </div>
              </div>
              
              <div className="sketches-meta">
                <span className="sketches-author">
                  By {item.first_name} {item.last_name}
                </span>
                <span className="sketches-date">
                  {new Date(item.created_at).toLocaleDateString()}
                </span>
              </div>

              {item.imagePaths && (
                <div className="sketches-image">
                  <img 
                    src={`${process.env.REACT_APP_API_URL}${item.imagePaths.thumb || item.imagePaths.original}`} 
                    alt={item.title || 'Sketch'}
                    onClick={() => handleImageClick(item.imagePaths)}
                    className="sketches-img"
                  />
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
              alt="Full size sketch"
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default Sketches;