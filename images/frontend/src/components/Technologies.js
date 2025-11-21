import React, { useState, useEffect } from 'react';

const Technologies = ({ projectId, user }) => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    url: '',
    amount_per_unit: '',
    unit: '',
    is_vital: false,
    is_rented: false
  });
  const [documentFile, setDocumentFile] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchItems();
  }, [projectId]);

  const fetchItems = async () => {
    try {
      let url = `${process.env.REACT_APP_API_URL}/technologies/projects/${projectId}/technologies`;
      if (searchTerm) {
        url += `?search=${encodeURIComponent(searchTerm)}`;
      }
      
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const data = await response.json();
      setItems(data);
    } catch (error) {
      console.error('Error fetching technology items:', error);
    } finally {
      setLoading(false);
    }
  };
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const formDataToSend = new FormData();
    formDataToSend.append('name', formData.name);
    formDataToSend.append('description', formData.description);
    formDataToSend.append('url', formData.url);
    formDataToSend.append('amount_per_unit', formData.amount_per_unit);
    formDataToSend.append('unit', formData.unit);
    formDataToSend.append('is_vital', formData.is_vital);
    formDataToSend.append('is_rented', formData.is_rented);
    
    if (documentFile) {
      formDataToSend.append('document', documentFile);
    }

    try {
      const url = editingItem 
        ? `${process.env.REACT_APP_API_URL}/technologies/technologies/${editingItem.id}`
        : `${process.env.REACT_APP_API_URL}/technologies/projects/${projectId}/technologies`;
      
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
      console.error('Error saving technology item:', error);
    }
  };

  const handleEdit = (item) => {
    setEditingItem(item);
    setFormData({
      name: item.name,
      description: item.description,
      url: item.url,
      amount_per_unit: item.amount_per_unit,
      unit: item.unit,
      is_vital: item.is_vital,
      is_rented: item.is_rented
    });
    setShowAddForm(true);
  };

  const handleDelete = async (itemId) => {
    if (window.confirm('Are you sure you want to delete this technology item?')) {
      try {
        await fetch(`${process.env.REACT_APP_API_URL}/technologies/technologies/${itemId}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        fetchItems();
      } catch (error) {
        console.error('Error deleting technology item:', error);
      }
    }
  };

  const toggleVital = async (itemId) => {
    try {
      await fetch(`${process.env.REACT_APP_API_URL}/technologies/technologies/${itemId}/vital`, {
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

  const toggleRented = async (itemId) => {
    try {
      await fetch(`${process.env.REACT_APP_API_URL}/technologies/technologies/${itemId}/rented`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      fetchItems();
    } catch (error) {
      console.error('Error toggling rented status:', error);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      url: '',
      amount_per_unit: '',
      unit: '',
      is_vital: false,
      is_rented: false
    });
    setDocumentFile(null);
    setEditingItem(null);
    setShowAddForm(false);
  };

  if (loading) {
    return <div className="loading">Loading technology items...</div>;
  }

  return (
    <div className="technologies">
      <div className="technologies-header">
        <h3>Technologies</h3>
        <div className="table-controls">
          <input
            type="text"
            placeholder="Search technologies..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
          <button 
            onClick={() => setShowAddForm(true)}
            className="add-item-btn"
          >
            + Add Technology
          </button>
        </div>
      </div>

      {showAddForm && (
        <div className="technologies-form">
          <h4>{editingItem ? 'Edit Technology' : 'Add New Technology'}</h4>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="name">Technology Name:</label>
              <input
                type="text"
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="description">Description:</label>
              <textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                rows="4"
                placeholder="Add technology description..."
              />
            </div>

            <div className="form-group">
              <label htmlFor="url">URL:</label>
              <input
                type="url"
                id="url"
                value={formData.url}
                onChange={(e) => setFormData({...formData, url: e.target.value})}
                placeholder="https://example.com"
              />
            </div>

            <div className="form-group">
              <label htmlFor="document">Technical Document (PDF, DOC, DOCX, TXT):</label>
              <input
                type="file"
                id="document"
                onChange={(e) => setDocumentFile(e.target.files[0])}
                accept=".pdf,.doc,.docx,.txt"
              />
              {documentFile && <span className="file-name">{documentFile.name}</span>}
              {editingItem && editingItem.document_path && !documentFile && (
                <div className="current-document">
                  Current document: <a href={`${process.env.REACT_APP_API_URL}${editingItem.document_path}`} target="_blank" rel="noopener noreferrer">View Document</a>
                </div>
              )}
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="amount_per_unit">Amount per Unit:</label>
                <input
                  type="number"
                  id="amount_per_unit"
                  value={formData.amount_per_unit}
                  onChange={(e) => setFormData({...formData, amount_per_unit: e.target.value})}
                  step="0.01"
                  min="0"
                />
              </div>
              <div className="form-group">
                <label htmlFor="unit">Unit:</label>
                <select
                  id="unit"
                  value={formData.unit}
                  onChange={(e) => setFormData({...formData, unit: e.target.value})}
                >
                  <option value="">Select unit...</option>
                  <option value="hour">Hour</option>
                  <option value="day">Day</option>
                  <option value="week">Week</option>
                  <option value="month">Month</option>
                  <option value="year">Year</option>
                </select>
              </div>
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

            <div className="form-group checkbox-group">
              <label>
                <input
                  type="checkbox"
                  checked={formData.is_rented}
                  onChange={(e) => setFormData({...formData, is_rented: e.target.checked})}
                />
                Mark as rented/bought
              </label>
            </div>

            <div className="form-actions">
              <button type="submit" className="save-btn">
                {editingItem ? 'Update' : 'Save'} Technology
              </button>
              <button type="button" onClick={resetForm} className="cancel-btn">
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {items.length === 0 ? (
        <div className="no-items">
          <p>No technology items yet.</p>
          <button onClick={() => setShowAddForm(true)} className="add-first-item-btn">
            Add Your First Technology
          </button>
        </div>
      ) : (
        <div className="technologies-table-container">
          <table className="technologies-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Description</th>
                <th>URL</th>
                <th>Document</th>
                <th>Price</th>
                <th>Author</th>
                <th>Date</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.map(item => (
                <tr 
                  key={item.id} 
                  className={`technology-row ${item.is_vital ? 'vital' : ''} ${item.is_rented ? 'rented' : ''}`}
                >
                  <td className="name-cell">
                    {item.is_vital && <span className="vital-indicator">🔴 </span>}
                    {item.is_rented && <span className="rented-indicator">💰 </span>}
                    {item.name}
                  </td>
                  <td className="description-cell">
                    {item.description ? (
                      <div className="description-content" title={item.description}>
                        {item.description.length > 100 ? 
                          `${item.description.substring(0, 100)}...` : 
                          item.description
                        }
                      </div>
                    ) : '-'}
                  </td>
                  <td className="url-cell">
                    {item.url ? (
                      <a href={item.url} target="_blank" rel="noopener noreferrer" className="url-link">
                        🔗 Link
                      </a>
                    ) : '-'}
                  </td>
                  <td className="document-cell">
                    {item.document_path ? (
                      <a href={`${process.env.REACT_APP_API_URL}${item.document_path}`} target="_blank" rel="noopener noreferrer" className="document-link">
                        📄 Document
                      </a>
                    ) : '-'}
                  </td>
                  <td className="price-cell">
                    {(item.amount_per_unit && item.unit) ? 
                      `$${item.amount_per_unit}/${item.unit}` : '-'
                    }
                  </td>
                  <td className="author-cell">
                    {item.first_name} {item.last_name}
                  </td>
                  <td className="date-cell">
                    {new Date(item.created_at).toLocaleDateString()}
                  </td>
                  <td className="status-cell">
                    <div className="status-indicators">
                      {item.is_vital && <span className="status-badge vital">Vital</span>}
                      {item.is_rented && <span className="status-badge rented">Rented</span>}
                    </div>
                  </td>
                  <td className="actions-cell">
                    <div className="action-buttons">
                      <button 
                        onClick={() => toggleVital(item.id)}
                        className={`action-btn vital-btn ${item.is_vital ? 'active' : ''}`}
                        title={item.is_vital ? 'Remove vital status' : 'Mark as vital'}
                      >
                        {item.is_vital ? '🔴' : '⚪'}
                      </button>
                      <button 
                        onClick={() => toggleRented(item.id)}
                        className={`action-btn rented-btn ${item.is_rented ? 'active' : ''}`}
                        title={item.is_rented ? 'Mark as bought' : 'Mark as rented'}
                      >
                        {item.is_rented ? '💰' : '🔘'}
                      </button>
                      <button 
                        onClick={() => handleEdit(item)}
                        className="action-btn edit-btn"
                        title="Edit technology"
                      >
                        ✏️
                      </button>
                      <button 
                        onClick={() => handleDelete(item.id)}
                        className="action-btn delete-btn"
                        title="Delete technology"
                      >
                        🗑️
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default Technologies;