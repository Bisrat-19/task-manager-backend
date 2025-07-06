const express = require('express');
const fs = require('fs').promises;
const path = require('path');
const cors = require('cors');
const morgan = require('morgan');

const app = express();
const port = 3000;
const dataFile = path.join(__dirname, 'tasks.json');

// Middleware
app.use(express.json());
app.use(cors());
app.use(morgan('dev'));

// Homepage
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Helpers
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

// Smart completion keywords
const completionKeywords = ['done', 'finished', 'complete', 'completed'];

// POST /api/tasks - Add task with creative logic
app.post('/api/tasks', async (req, res) => {
  const { title, dueDate } = req.body;

  if (!title || title.trim() === '') {
    return res.status(400).json({ error: 'Task title is required' });
  }

  const tasks = await readTasks();
  const now = new Date().toISOString();

  const isCompleted = completionKeywords.some(word =>
    title.toLowerCase().includes(word)
  );

  const newTask = {
    id: tasks.length ? Math.max(...tasks.map(t => t.id)) + 1 : 1,
    title: title.trim(),
    completed: isCompleted,
    createdAt: now,
    updatedAt: now,
    dueDate: dueDate || null
  };

  tasks.push(newTask);
  await writeTasks(tasks);

  if (dueDate) {
    const timeLeft = new Date(dueDate) - new Date();
    if (timeLeft < 3600000 && timeLeft > 0) {
      console.log(`🔔 Reminder: Task "${newTask.title}" is due soon!`);
    }
  }

  res.status(201).json(newTask);
});

// GET /api/tasks with overdue calculation
app.get('/api/tasks', async (req, res) => {
  const tasks = await readTasks();
  const now = new Date();

  const enrichedTasks = tasks.map(task => ({
    ...task,
    isOverdue: task.dueDate && !task.completed && new Date(task.dueDate) < now
  }));

  res.json(enrichedTasks);
});

// PUT, PATCH, DELETE same as before (simplified for brevity)
app.put('/api/tasks/:id', async (req, res) => {
  const tasks = await readTasks();
  const task = tasks.find(t => t.id === parseInt(req.params.id));
  if (!task) return res.status(404).json({ error: 'Task not found' });

  task.completed = true;
  task.updatedAt = new Date().toISOString();
  await writeTasks(tasks);
  res.json(task);
});

app.patch('/api/tasks/:id', async (req, res) => {
  const tasks = await readTasks();
  const task = tasks.find(t => t.id === parseInt(req.params.id));
  if (!task) return res.status(404).json({ error: 'Task not found' });

  if (req.body.title) task.title = req.body.title.trim();
  if (req.body.dueDate) task.dueDate = req.body.dueDate;
  task.updatedAt = new Date().toISOString();
  await writeTasks(tasks);
  res.json(task);
});

app.delete('/api/tasks/:id', async (req, res) => {
  const tasks = await readTasks();
  const index = tasks.findIndex(t => t.id === parseInt(req.params.id));
  if (index === -1) return res.status(404).json({ error: 'Task not found' });

  tasks.splice(index, 1);
  await writeTasks(tasks);
  res.status(204).send();
});

// 📊 GET /api/stats - Show task stats
app.get('/api/stats', async (req, res) => {
  const tasks = await readTasks();
  const now = new Date();

  const total = tasks.length;
  const completed = tasks.filter(t => t.completed).length;
  const overdue = tasks.filter(
    t => t.dueDate && !t.completed && new Date(t.dueDate) < now
  ).length;

  res.json({ total, completed, overdue });
});

// Start the server
app.listen(port, () => {
  console.log(`🚀 Creative Task API running at http://localhost:${port}`);
});
