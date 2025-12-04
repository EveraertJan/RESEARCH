import React from 'react';
import TagList from '../Shared/TagList';
import { documentAPI } from '../../../services/api';

const InsightsTable = ({
  insights,
  onDelete,
  onEdit,
  onAddTag,
  onRemoveTag,
  onLinkDocument,
  onRemoveDocument
}) => {
  return (
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
                        style={{ marginRight: "20px"}}
                        title={insight.documents[0].name}
                      >
                        {insight.documents[0].name.length > 20
                          ? insight.documents[0].name.substring(0, 20) + '...'
                          : insight.documents[0].name}
                      </a>
                      <button
                        className="add-tag-btn"
                        onClick={() => onRemoveDocument(insight.id, insight.documents[0].id)}
                        title="Unlink document"
                      >
                        ×
                      </button>
                    </span>
                  ) : (
                    <button
                      className="add-tag-btn"
                      onClick={() => onLinkDocument(insight)}
                      title="Link document"
                    >
                      +
                    </button>
                  )}
                </div>
              </td>
              <td>
                <TagList
                  tags={insight.tags}
                  onRemoveTag={(tagId) => onRemoveTag(insight.id, tagId)}
                  onAddTag={() => onAddTag(insight)}
                />
              </td>
              <td>{insight.username}</td>
              <td>
                <button
                  onClick={() => onEdit(insight)}
                  className="btn-small"
                  style={{ marginRight: '8px' }}
                >
                  Edit
                </button>
                <button
                  onClick={() => onDelete(insight.id)}
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

export default InsightsTable;
