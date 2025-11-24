const ChatMessageRepository = require('../repositories/ChatMessageRepository');
const ProjectRepository = require('../repositories/ProjectRepository');
const ResearchStackRepository = require('../repositories/ResearchStackRepository');
const ResearchStackService = require('./ResearchStackService');
const InsightService = require('./InsightService');
const { AppError } = require('../middleware/errorHandler');

class ChatService {
  constructor() {
    this.messageRepository = new ChatMessageRepository();
    this.projectRepository = new ProjectRepository();
    this.stackRepository = new ResearchStackRepository();
    this.stackService = new ResearchStackService();
    this.insightService = new InsightService();
  }

  parseSlashCommand(message) {
    const stackPattern = /^\/stack\s+(.+)$/i;
    const insightPattern = /^\/insight\s+(.+)$/i;
    const imagePattern = /^\/image\s+(.+)$/i;

    const stackMatch = message.match(stackPattern);
    if (stackMatch) {
      return {
        type: 'stack',
        content: stackMatch[1].trim()
      };
    }

    const insightMatch = message.match(insightPattern);
    if (insightMatch) {
      return {
        type: 'insight',
        content: insightMatch[1].trim()
      };
    }

    const imageMatch = message.match(imagePattern);
    if (imageMatch) {
      return {
        type: 'image',
        content: imageMatch[1].trim()
      };
    }

    return null;
  }

  async sendMessage(projectId, stackId, userId, message) {
    const hasAccess = await this.projectRepository.hasAccess(projectId, userId);
    if (!hasAccess) {
      throw new AppError('You do not have access to this project', 403);
    }

    if (stackId) {
      const stack = await this.stackRepository.findById(stackId);
      if (!stack || stack.project_id !== projectId) {
        throw new AppError('Stack not found in this project', 404);
      }
    }

    // Check for slash commands
    const command = this.parseSlashCommand(message);

    if (command) {
      return await this.handleCommand(projectId, stackId, userId, command);
    }

    // Regular message
    const chatMessage = await this.messageRepository.createMessage(
      projectId,
      stackId,
      userId,
      message,
      'user'
    );

    return {
      type: 'message',
      data: chatMessage
    };
  }

  async handleCommand(projectId, stackId, userId, command) {
    switch (command.type) {
      case 'stack':
        // Create a new research stack
        const newStack = await this.stackService.createStack(projectId, userId, command.content);

        // Log system message
        await this.messageRepository.createSystemMessage(
          projectId,
          newStack.id,
          `Research stack "${command.content}" created`
        );

        return {
          type: 'stack_created',
          data: newStack
        };

      case 'insight':
        if (!stackId) {
          throw new AppError('You must be in a stack chat to add insights', 400);
        }

        // Create insight
        const insight = await this.insightService.createInsight(stackId, userId, command.content);

        // Log system message
        await this.messageRepository.createSystemMessage(
          projectId,
          stackId,
          `Insight added: "${command.content.substring(0, 50)}${command.content.length > 50 ? '...' : ''}"`
        );

        return {
          type: 'insight_created',
          data: insight
        };

      case 'image':
        if (!stackId) {
          throw new AppError('You must be in a stack chat to add images', 400);
        }

        // Return instruction to show upload modal
        return {
          type: 'image_upload_requested',
          data: {
            stackId: stackId,
            name: command.content
          }
        };

      default:
        throw new AppError('Unknown command', 400);
    }
  }

  async getMessages(projectId, stackId, userId) {
    const hasAccess = await this.projectRepository.hasAccess(projectId, userId);
    if (!hasAccess) {
      throw new AppError('You do not have access to this project', 403);
    }

    if (stackId) {
      const stack = await this.stackRepository.findById(stackId);
      if (!stack || stack.project_id !== projectId) {
        throw new AppError('Stack not found in this project', 404);
      }
    }

    const messages = await this.messageRepository.findByProject(projectId, stackId);
    return messages;
  }
}

module.exports = ChatService;
