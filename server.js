const express = require('express');
const fs = require('fs').promises;
const path = require('path');
const cors = require('cors'); // Just in case someone wants to test with a frontend

const app = express();
const port = 3000;
const dataFile = path.join(__dirname, 'tasks.json');

// Middleware to parse JSON and enable CORS
app.use(express.json());
app.use(cors());

// Serve a simple HTML page to show API is running
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Helper to read tasks from JSON file
async function readTasks() {
  try {
    const data = await fs.readFile(dataFile, 'utf8');
    return JSON.parse(data);
  } catch (err) {
    // If file doesn't exist or is empty, start with an empty array
    return [];
  }
}

// Helper to write tasks to JSON file
async function writeTasks(tasks) {
  await fs.writeFile(dataFile, JSON.stringify(tasks, null, 2));
}

// GET /api/tasks - Return all tasks
app.get('/api/tasks', async (req, res) => {
  const tasks = await readTasks();
  res.json(tasks);
});

// POST /api/tasks - Add a new task
app.post('/api/tasks', async (req, res) => {
  const { title } = req.body;

  // Basic validation
  if (!title || title.trim() === '') {
    return res.status(400).json({ error: 'Task title is required' });
  }

  const tasks = await readTasks();
  const newTask = {
    id: tasks.length ? Math.max(...tasks.map(t => t.id)) + 1 : 1,
    title: title.trim(),
    completed: false
  };
  tasks.push(newTask);
  await writeTasks(tasks);
  res.status(201).json(newTask);
});

// PUT /api/tasks/:id - Mark task as completed
app.put('/api/tasks/:id', async (req, res) => {
  const { id } = req.params;
  const tasks = await readTasks();
  const task = tasks.find(t => t.id === parseInt(id));

  if (!task) {
    return res.status(404).json({ error: 'Task not found' });
  }

  task.completed = true;
  await writeTasks(tasks);
  res.json(task);
});

// DELETE /api/tasks/:id - Delete a task
app.delete('/api/tasks/:id', async (req, res) => {
  const { id } = req.params;
  const tasks = await readTasks();
  const taskIndex = tasks.findIndex(t => t.id === parseInt(id));

  if (taskIndex === -1) {
    return res.status(404).json({ error: 'Task not found' });
  }

  tasks.splice(taskIndex, 1);
  await writeTasks(tasks);
  res.status(204).send();
});

// Start the server
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});