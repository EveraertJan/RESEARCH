import React from 'react';
import TagList from '../Shared/TagList';
import { documentAPI } from '../../../services/api';

const DocumentsTable = ({
  documents,
  onDelete,
  onEdit,
  onAddTag,
  onRemoveTag
}) => {
  return (
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
                <TagList
                  tags={document.tags}
                  onRemoveTag={(tagId) => onRemoveTag(document.id, tagId)}
                  onAddTag={() => onAddTag(document)}
                />
              </td>
              <td>{document.username}</td>
              <td>
                <button
                  onClick={() => onEdit(document)}
                  className="btn-small"
                  style={{ marginRight: '8px' }}
                >
                  Edit
                </button>
                <button
                  onClick={() => onDelete(document.id)}
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
  );
};

export default DocumentsTable;
