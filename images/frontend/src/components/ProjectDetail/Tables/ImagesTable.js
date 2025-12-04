import React from 'react';
import TagList from '../Shared/TagList';
import { imageAPI } from '../../../services/api';

const ImagesTable = ({
  images,
  onDelete,
  onAddTag,
  onRemoveTag,
  onImageClick
}) => {
  return (
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
                  onClick={() => onImageClick(index)}
                  style={{ cursor: 'pointer' }}
                />
              </td>
              <td>{image.name}</td>
              <td>
                <TagList
                  tags={image.tags}
                  onRemoveTag={(tagId) => onRemoveTag(image.id, tagId)}
                  onAddTag={() => onAddTag(image)}
                />
              </td>
              <td>{image.username}</td>
              <td>
                <button
                  onClick={() => onDelete(image.id)}
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

export default ImagesTable;
