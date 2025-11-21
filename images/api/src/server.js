const http = require('http');
const { createServer } = require('http');
const express = require('express');
const cors = require("cors")
const user_routes = require('./routes/user')
const project_routes = require('./routes/projects')
const research_routes = require('./routes/research')
const inspiration_routes = require('./routes/inspiration')
const sketches_routes = require('./routes/sketches')
const technologies_routes = require('./routes/technologies')
const { join } = require('node:path');
const path = require('path');


const app = express();

const server = createServer(app);

app.use(cors());
app.use(express.json());

app.use('/uploads', express.static(path.join(__dirname, './__uploads')));


const port = 3000;

app.use(cors());
app.use('/users', user_routes);
app.use('/projects', project_routes);
app.use('/research', research_routes);
app.use('/inspiration', inspiration_routes);
app.use('/sketches', sketches_routes);
app.use('/technologies', technologies_routes);



app.get('/', (req, res) => {
  res.send("running")
})






module.exports = app;
