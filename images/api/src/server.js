const express = require('express');
const { createServer } = require('http');
const cors = require('cors');
const path = require('path');
const { errorHandler } = require('./middleware/errorHandler');

const user_routes = require('./routes/user');
const project_routes = require('./routes/projects');
const stack_routes = require('./routes/stacks');
const insight_routes = require('./routes/insights');
const chat_routes = require('./routes/chat');
const tag_routes = require('./routes/tags');

const app = express();
const server = createServer(app);

const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, './__uploads')));

app.get('/', (req, res) => {
  res.json({
    status: 'success',
    message: 'API is running',
    version: '2.0.0'
  });
});

app.use('/users', user_routes);
app.use('/projects', project_routes);
app.use('/stacks', stack_routes);
app.use('/insights', insight_routes);
app.use('/chat', chat_routes);
app.use('/tags', tag_routes);

app.use(errorHandler);

module.exports = app;
