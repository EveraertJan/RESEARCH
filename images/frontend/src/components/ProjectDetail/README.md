# ProjectDetail Component Structure

This directory contains the refactored ProjectDetail components, organized for better maintainability and reusability.

## Directory Structure

```
ProjectDetail/
├── Chat/
│   ├── ChatSection.js       # Main chat container
│   ├── StackList.js         # List of research stacks
│   ├── MessageList.js       # Chat messages display
│   └── ChatInput.js         # Message input form with commands
├── Tables/
│   ├── InsightsTable.js     # Insights table with documents and tags
│   ├── ImagesTable.js       # Images table with tags
│   └── DocumentsTable.js    # Documents table with tags
├── Modals/
│   ├── AddTagModal.js       # Modal for adding tags to items
│   ├── UploadImageModal.js  # Modal for uploading images
│   ├── UploadDocumentModal.js # Modal for uploading PDFs
│   └── LinkDocumentModal.js # Modal for linking documents to insights
└── Shared/
    ├── ColorSquare.js       # Reusable color indicator component
    ├── TagList.js           # Reusable tag list with add/remove
    └── TagFilters.js        # Tag filtering buttons

```

## Component Responsibilities

### Chat Components

**ChatSection** - Top-level chat container that orchestrates:
- Stack list display
- Message history
- Chat input and command handling

**StackList** - Displays available research stacks
- Shows active stack highlight
- Handles stack selection

**MessageList** - Renders chat messages
- System messages vs user messages
- Auto-scrolling with ref

**ChatInput** - Message input with slash commands
- Auto-resizing textarea
- Command help display
- Shift+Enter to send

### Table Components

**InsightsTable** - Displays insights with:
- Linked documents (one per insight)
- Tags with add/remove
- Delete functionality
- Document linking/unlinking

**ImagesTable** - Displays uploaded images with:
- Thumbnail preview
- Tags management
- Image viewer integration
- Delete functionality

**DocumentsTable** - Displays PDFs with:
- Download links
- Descriptions
- Tags management
- Delete functionality

### Modal Components

**AddTagModal** - Generic tag addition modal
- Works with insights, images, or documents
- Shows only available tags
- Filters out already-assigned tags

**UploadImageModal** - Image upload with:
- File selection
- Optional tag assignment
- Name input

**UploadDocumentModal** - PDF upload with:
- File selection
- Name and description inputs
- Optional tag assignment

**LinkDocumentModal** - Link documents to insights
- Shows available documents in stack
- One document per insight enforcement
- Document preview with description

### Shared Components

**ColorSquare** - Visual tag indicator
- Single or dual color support
- Configurable size
- Gradient for dual colors

**TagList** - Reusable tag display
- Shows tags with colors
- Remove tag functionality
- Add tag button

**TagFilters** - Tag filtering UI
- Active/inactive state
- Toggle functionality
- Color-coded buttons

## Benefits of This Structure

### 1. **Separation of Concerns**
Each component has a single, clear responsibility:
- Chat components handle messaging
- Table components handle data display
- Modals handle user interactions
- Shared components provide reusability

### 2. **Reusability**
Shared components like ColorSquare and TagList can be used throughout:
- Reduces code duplication
- Consistent UI across features
- Easier to maintain and update

### 3. **Testability**
Smaller components are easier to:
- Unit test in isolation
- Mock dependencies
- Verify behavior

### 4. **Maintainability**
- Easy to locate and fix bugs
- Clear file organization
- Self-documenting structure

### 5. **Scalability**
Easy to add new features:
- Add new table types
- Create new modal types
- Extend shared components

## Usage Example

```jsx
import ProjectDetail from './components/ProjectDetail';

// The main component automatically imports and uses all subcomponents
<ProjectDetail />
```

## State Management

State remains in the parent ProjectDetail component:
- Centralized state management
- Props drilling kept minimal
- Clear data flow from parent to children

## Props Pattern

Components receive:
- **Data props**: What to display
- **Handler props**: What to do on interactions
- **State props**: Current UI state

Example:
```jsx
<InsightsTable
  insights={data}              // Data to display
  onDelete={handleDelete}      // Interaction handler
  onAddTag={handleAddTag}      // Interaction handler
/>
```

## Future Improvements

Consider implementing:
1. **Context API** - For deeply nested prop drilling
2. **Custom Hooks** - For shared logic (useTagManagement, useDocumentUpload)
3. **React Query** - For data fetching and caching
4. **TypeScript** - For type safety
5. **Storybook** - For component documentation and testing

## Migration Notes

The old monolithic ProjectDetail.js has been:
- Backed up as `ProjectDetailOld.js`
- Replaced with the new refactored version
- All functionality preserved
- Improved organization and clarity
