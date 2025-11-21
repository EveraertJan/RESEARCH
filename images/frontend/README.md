# Research Documentation Frontend

React-based frontend for the Student Research Documentation System.

## Features

- Create and manage research documents
- Add research questions, methodology, findings, and conclusions
- Organize notes by type (observation, idea, resource, citation)
- Track research resources with URLs and metadata
- Status tracking (draft, in progress, completed)

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

```bash
npm install
```

### Development

```bash
npm start
```

Runs the app in development mode at [http://localhost:3001](http://localhost:3001).

### Environment Variables

Create a `.env` file:

```
REACT_APP_API_URL=http://localhost:3000
PORT=3001
```

## Project Structure

```
src/
├── components/       # Reusable React components
├── pages/           # Page components
│   ├── DocumentsList.js      # List all research documents
│   ├── CreateDocument.js     # Create new document
│   └── DocumentDetail.js     # View/edit document with notes & resources
├── services/        # API service layer
│   └── api.js       # Axios API calls
├── App.js           # Main app component with routing
├── index.js         # React entry point
└── index.css        # Global styles
```

## Available Routes

- `/` - List all research documents
- `/create` - Create new research document
- `/document/:id` - View and edit specific document

## Docker

Build and run with Docker:

```bash
docker build -t research-frontend .
docker run -p 3001:3001 research-frontend
```

Or use docker-compose from the project root:

```bash
docker compose up frontend
```
