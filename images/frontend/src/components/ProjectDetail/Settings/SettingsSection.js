import React from 'react';

const SettingsSection = ({
  projectId,
  projectAPI,
  tags,
  onCreateTag,
  onUpdateTag,
  onDeleteTag,
  onShowCollaboratorModal,
  onShowTagModal,
  storageUsed = 0,
  className = ''
}) => {
  const formatBytes = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  return (
    <div className={`settings-section-container ${className}`}>
      <div className="settings-content-wrapper">
        <div className="settings-item">
          <h3>Collaborators</h3>
          <p className="settings-description">Manage who can access this project</p>
          <button onClick={onShowCollaboratorModal} className="btn-primary">
            Manage Collaborators
          </button>
        </div>

        <div className="settings-item">
          <h3>Tags</h3>
          <p className="settings-description">Create and manage tags for organizing content</p>
          <button onClick={onShowTagModal} className="btn-primary">
            Manage Tags
          </button>
        </div>

        <div className="settings-item">
          <h3>Storage</h3>
          <p className="settings-description">Space used by this project</p>
          <div className="storage-display">
            <span className="storage-amount">{formatBytes(storageUsed)}</span>
            <span className="storage-label">used</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsSection;
