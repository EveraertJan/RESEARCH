const ImageRepository = require('../repositories/ImageRepository');
const ProjectRepository = require('../repositories/ProjectRepository');
const ResearchStackRepository = require('../repositories/ResearchStackRepository');
const { AppError } = require('../middleware/errorHandler');

class ImageService {
  constructor() {
    this.imageRepository = new ImageRepository();
    this.projectRepository = new ProjectRepository();
    this.stackRepository = new ResearchStackRepository();
  }

  async createImage(stackId, userId, imageData) {
    const { name, filePath, mimeType, fileSize } = imageData;

    if (!name || name.trim() === '') {
      throw new AppError('Image name is required', 400);
    }

    if (!filePath) {
      throw new AppError('File path is required', 400);
    }

    const stack = await this.stackRepository.findById(stackId);
    if (!stack) {
      throw new AppError('Research stack not found', 404);
    }

    const hasAccess = await this.projectRepository.hasAccess(stack.project_id, userId);
    if (!hasAccess) {
      throw new AppError('You do not have access to this project', 403);
    }

    const image = await this.imageRepository.createImage(
      stack.project_id,
      stackId,
      name.trim(),
      filePath,
      mimeType,
      fileSize,
      userId
    );

    return image;
  }

  async getImagesForStack(stackId, userId, options = {}) {
    const stack = await this.stackRepository.findById(stackId);
    if (!stack) {
      throw new AppError('Research stack not found', 404);
    }

    const hasAccess = await this.projectRepository.hasAccess(stack.project_id, userId);
    if (!hasAccess) {
      throw new AppError('You do not have access to this project', 403);
    }

    const images = await this.imageRepository.findByStack(stackId, options);
    return images;
  }

  async deleteImage(imageId, userId) {
    const image = await this.imageRepository.findById(imageId);
    if (!image) {
      throw new AppError('Image not found', 404);
    }

    const hasAccess = await this.projectRepository.hasAccess(image.project_id, userId);
    if (!hasAccess) {
      throw new AppError('You do not have access to this project', 403);
    }

    await this.imageRepository.delete(imageId);
    return { message: 'Image deleted successfully' };
  }

  async addTagToImage(imageId, tagId, userId) {
    const image = await this.imageRepository.findById(imageId);
    if (!image) {
      throw new AppError('Image not found', 404);
    }

    const hasAccess = await this.projectRepository.hasAccess(image.project_id, userId);
    if (!hasAccess) {
      throw new AppError('You do not have access to this project', 403);
    }

    const hasTag = await this.imageRepository.hasTag(imageId, tagId);
    if (hasTag) {
      throw new AppError('Tag is already assigned to this image', 409);
    }

    await this.imageRepository.addTagToImage(imageId, tagId);
    return { message: 'Tag added to image successfully' };
  }

  async removeTagFromImage(imageId, tagId, userId) {
    const image = await this.imageRepository.findById(imageId);
    if (!image) {
      throw new AppError('Image not found', 404);
    }

    const hasAccess = await this.projectRepository.hasAccess(image.project_id, userId);
    if (!hasAccess) {
      throw new AppError('You do not have access to this project', 403);
    }

    await this.imageRepository.removeTagFromImage(imageId, tagId);
    return { message: 'Tag removed from image successfully' };
  }
}

module.exports = ImageService;
