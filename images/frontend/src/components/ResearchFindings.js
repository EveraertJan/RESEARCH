import React, { useState, useEffect } from 'react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';

const ResearchFindings = ({ projectId, user }) => {
  const [findings, setFindings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingFinding, setEditingFinding] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({
    title: '',
    body: '',
    url: '',
    is_vital: false
  });
  const [documentFile, setDocumentFile] = useState(null);

  useEffect(() => {
    fetchFindings();
  }, [projectId, searchTerm]);

  const fetchFindings = async () => {
    try {
      const searchParam = searchTerm ? `?search=${encodeURIComponent(searchTerm)}` : '';
      const response = await fetch(`${process.env.REACT_APP_API_URL}/research/projects/${projectId}/findings${searchParam}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const data = await response.json();
      setFindings(data);
    } catch (error) {
      console.error('Error fetching findings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const formDataToSend = new FormData();
    formDataToSend.append('title', formData.title);
    formDataToSend.append('body', formData.body);
    formDataToSend.append('url', formData.url);
    formDataToSend.append('is_vital', formData.is_vital);
    
    if (documentFile) {
      formDataToSend.append('document', documentFile);
    }

    try {
      const url = editingFinding 
        ? `${process.env.REACT_APP_API_URL}/research/findings/${editingFinding.id}`
        : `${process.env.REACT_APP_API_URL}/research/projects/${projectId}/findings`;
      
      const method = editingFinding ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: formDataToSend
      });

      if (response.ok) {
        resetForm();
        fetchFindings();
      }
    } catch (error) {
      console.error('Error saving finding:', error);
    }
  };

  const handleEdit = (finding) => {
    setEditingFinding(finding);
    setFormData({
      title: finding.title,
      body: finding.body,
      url: finding.url || '',
      is_vital: finding.is_vital
    });
    setShowAddForm(true);
  };

  const handleDelete = async (findingId) => {
    if (window.confirm('Are you sure you want to delete this finding?')) {
      try {
        await fetch(`${process.env.REACT_APP_API_URL}/research/findings/${findingId}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        fetchFindings();
      } catch (error) {
        console.error('Error deleting finding:', error);
      }
    }
  };

  const toggleVital = async (findingId) => {
    try {
      await fetch(`${process.env.REACT_APP_API_URL}/research/findings/${findingId}/vital`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      fetchFindings();
    } catch (error) {
      console.error('Error toggling vital status:', error);
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      body: '',
      url: '',
      is_vital: false
    });
    setDocumentFile(null);
    setEditingFinding(null);
    setShowAddForm(false);
  };

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
  };

  if (loading) {
    return <div className="loading">Loading findings...</div>;
  }

  return (
    <div className="research-findings">
      <div className="findings-header">
        <div className="findings-actions">
          <div className="search-box">
            <input
              type="text"
              placeholder="Search findings..."
              value={searchTerm}
              onChange={handleSearch}
              className="search-input"
            />
          </div>
          <button 
            onClick={() => setShowAddForm(true)}
            className="add-finding-btn"
          >
            + Add Finding
          </button>
        </div>
      </div>

      {showAddForm && (
        <div className="finding-form">
          <h4>{editingFinding ? 'Edit Finding' : 'Add New Finding'}</h4>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="title">Title:</label>
              <input
                type="text"
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({...formData, title: e.target.value})}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="url">URL (optional):</label>
              <input
                type="url"
                id="url"
                value={formData.url}
                onChange={(e) => setFormData({...formData, url: e.target.value})}
                placeholder="https://example.com"
              />
            </div>

            <div className="form-group">
              <label htmlFor="document">Document (optional):</label>
              <input
                type="file"
                id="document"
                onChange={(e) => setDocumentFile(e.target.files[0])}
                accept=".pdf,.doc,.docx,.txt,.md"
              />
              {documentFile && <span className="file-name">{documentFile.name}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="body">Content:</label>
              <ReactQuill
                theme="snow"
                value={formData.body}
                onChange={(value) => setFormData({...formData, body: value})}
                placeholder="Add your research findings here..."
              />
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
                {editingFinding ? 'Update' : 'Save'} Finding
              </button>
              <button type="button" onClick={resetForm} className="cancel-btn">
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="findings-list">
        {findings.length === 0 ? (
          <div className="no-findings">
            <p>No research findings yet.</p>
            <button onClick={() => setShowAddForm(true)} className="add-first-finding-btn">
              Add Your First Finding
            </button>
          </div>
        ) : (
          findings.map(finding => (
            <div 
              key={finding.id} 
              className={`finding-item ${finding.is_vital ? 'vital' : ''}`}
            >
              <div className="finding-header">
                <h4 className="finding-title">
                  {finding.is_vital && <span className="vital-indicator">🔴 </span>}
                  {finding.title}
                </h4>
                <div className="finding-actions">
                  <button 
                    onClick={() => toggleVital(finding.id)}
                    className={`vital-btn ${finding.is_vital ? 'vital' : ''}`}
                    title={finding.is_vital ? 'Remove vital status' : 'Mark as vital'}
                  >
                    {finding.is_vital ? '🔴' : '⚪'}
                  </button>
                  <button 
                    onClick={() => handleEdit(finding)}
                    className="edit-btn"
                    title="Edit finding"
                  >
                    ✏️
                  </button>
                  <button 
                    onClick={() => handleDelete(finding.id)}
                    className="delete-btn"
                    title="Delete finding"
                  >
                    🗑️
                  </button>
                </div>
              </div>
              
              <div className="finding-meta">
                <span className="finding-author">
                  By {finding.first_name} {finding.last_name}
                </span>
                <span className="finding-date">
                  {new Date(finding.created_at).toLocaleDateString()}
                </span>
              </div>

              {finding.url && (
                <div className="finding-url">
                  <a href={finding.url} target="_blank" rel="noopener noreferrer">
                    🔗 {finding.url}
                  </a>
                </div>
              )}

              {finding.document_path && (
                <div className="finding-document">
                  <a href={`${process.env.REACT_APP_API_URL}${finding.document_path}`} target="_blank" rel="noopener noreferrer">
                    📄 View Document
                  </a>
                </div>
              )}

              {finding.body && (
                <div 
                  className="finding-content"
                  dangerouslySetInnerHTML={{ __html: finding.body }}
                />
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default ResearchFindings;