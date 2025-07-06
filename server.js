const express = require('express');
const fs = require('fs').promises;
const path = require('path');
const cors = require('cors');
const morgan = require('morgan'); // Logging

const app = express();
const port = 3000;
const dataFile = path.join(__dirname, 'tasks.json');

// Middleware
app.use(express.json());
app.use(cors());
app.use(morgan('dev')); // Log requests

// Serve homepage
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Helper functions
async function readTasks() {
  try {
    const data = await fs.readFile(dataFile, 'utf8');
    return JSON.parse(data);
  } catch {
    return [];
  }
}

async function writeTasks(tasks) {
  await fs.writeFile(dataFile, JSON.stringify(tasks, null, 2));
}

// GET /api/tasks?completed=true/false&search=query&sort=desc/asc
app.get('/api/tasks', async (req, res) => {
  let tasks = await readTasks();
  const { completed, search, sort } = req.query;

  if (completed !== undefined) {
    tasks = tasks.filter(t => t.completed.toString() === completed);
  }

  if (search) {
    const lower = search.toLowerCase();
    tasks = tasks.filter(t => t.title.toLowerCase().includes(lower));
  }

  if (sort === 'desc') {
    tasks = tasks.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  } else if (sort === 'asc') {
    tasks = tasks.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
  }

  res.json(tasks);
});

// POST /api/tasks
app.post('/api/tasks', async (req, res) => {
  const { title } = req.body;
  if (!title || title.trim() === '') {
    return res.status(400).json({ error: 'Task title is required' });
  }

  const tasks = await readTasks();
  const now = new Date().toISOString();
  const newTask = {
    id: tasks.length ? Math.max(...tasks.map(t => t.id)) + 1 : 1,
    title: title.trim(),
    completed: false,
    createdAt: now,
    updatedAt: now
  };

  tasks.push(newTask);
  await writeTasks(tasks);
  res.status(201).json(newTask);
});

// PUT /api/tasks/:id - mark as completed
app.put('/api/tasks/:id', async (req, res) => {
  const { id } = req.params;
  const tasks = await readTasks();
  const task = tasks.find(t => t.id === parseInt(id));

  if (!task) return res.status(404).json({ error: 'Task not found' });

  task.completed = true;
  task.updatedAt = new Date().toISOString();
  await writeTasks(tasks);
  res.json(task);
});

// PATCH /api/tasks/:id - update task title
app.patch('/api/tasks/:id', async (req, res) => {
  const { id } = req.params;
  const { title } = req.body;

  const tasks = await readTasks();
  const task = tasks.find(t => t.id === parseInt(id));

  if (!task) return res.status(404).json({ error: 'Task not found' });

  if (title && title.trim() !== '') {
    task.title = title.trim();
    task.updatedAt = new Date().toISOString();
  }

  await writeTasks(tasks);
  res.json(task);
});

// DELETE /api/tasks/:id
app.delete('/api/tasks/:id', async (req, res) => {
  const { id } = req.params;
  const tasks = await readTasks();
  const index = tasks.findIndex(t => t.id === parseInt(id));

  if (index === -1) return res.status(404).json({ error: 'Task not found' });

  tasks.splice(index, 1);
  await writeTasks(tasks);
  res.status(204).send();
});

// Start server
app.listen(port, () => {
  console.log(`🚀 Server running at http://localhost:${port}`);
});
