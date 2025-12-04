import React, { useState, useEffect } from 'react';

function ManageCollaboratorsModal({ show, onClose, projectId, projectAPI }) {
  const [collaborators, setCollaborators] = useState([]);
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (show && projectId) {
      fetchCollaborators();
    }
  }, [show, projectId]);

  const fetchCollaborators = async () => {
    try {
      const response = await projectAPI.getCollaborators(projectId);
      setCollaborators(response.data.collaborators || []);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleAddCollaborator = async (e) => {
    e.preventDefault();

    if (!email.trim()) {
      setError('Email is required');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      await projectAPI.addCollaborator(projectId, email);
      setEmail('');
      fetchCollaborators();
    } catch (err) {
      setError(err.message || 'Failed to add collaborator');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveCollaborator = async (collaboratorId) => {
    if (!window.confirm('Remove this collaborator?')) {
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      await projectAPI.removeCollaborator(projectId, collaboratorId);
      fetchCollaborators();
    } catch (err) {
      setError(err.message || 'Failed to remove collaborator');
    } finally {
      setIsLoading(false);
    }
  };

  if (!show) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Manage Collaborators</h3>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        <div className="modal-body">
          {error && (
            <div style={{ color: '#F00', marginBottom: '15px', padding: '10px', border: '1px solid #F00' }}>
              {error}
            </div>
          )}

          <form onSubmit={handleAddCollaborator} style={{ marginBottom: '20px' }}>
            <div className="form-group">
              <label>Add Collaborator by Email</label>
              <div style={{ display: 'flex', gap: '10px' }}>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter email address..."
                  disabled={isLoading}
                  style={{ flex: 1 }}
                />
                <button type="submit" disabled={isLoading}>
                  {isLoading ? 'Adding...' : 'Add'}
                </button>
              </div>
            </div>
          </form>

          <div className="collaborators-list">
            <h4 style={{ marginBottom: '10px', fontWeight: 'bold' }}>Current Collaborators</h4>
            {collaborators.length === 0 ? (
              <p className="empty-message">No collaborators yet</p>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    <th style={{ padding: '10px', textAlign: 'left', borderBottom: '1px solid #000', background: '#f5f5f5' }}>
                      Email
                    </th>
                    <th style={{ padding: '10px', textAlign: 'left', borderBottom: '1px solid #000', background: '#f5f5f5' }}>
                      Role
                    </th>
                    <th style={{ padding: '10px', textAlign: 'left', borderBottom: '1px solid #000', background: '#f5f5f5' }}>
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {collaborators.map((collaborator) => (
                    <tr key={collaborator.id}>
                      <td style={{ padding: '10px', borderBottom: '1px solid #eee' }}>
                        {collaborator.email}
                      </td>
                      <td style={{ padding: '10px', borderBottom: '1px solid #eee' }}>
                        {collaborator.role}
                      </td>
                      <td style={{ padding: '10px', borderBottom: '1px solid #eee' }}>
                        {collaborator.role !== 'owner' && (
                          <button
                            onClick={() => handleRemoveCollaborator(collaborator.id)}
                            className="btn-danger-small"
                            disabled={isLoading}
                          >
                            Remove
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        <div className="modal-footer">
          <button onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
}

export default ManageCollaboratorsModal;
