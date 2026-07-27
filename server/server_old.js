const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();
const Task = require('./Models/Tasks');

const app = express();
app.use(cors());
app.use(express.json());

const PORT = 5000;

app.post('/tasks', async (req, res) => {
  try {
    const { title, description } = req.body;
    if (!title || !description) {
      return res.status(400).json({ error: 'Title and description are required' });
    }

    const newTask = new Task({ title, description });
    await newTask.save();
    res.status(201).json(newTask);
  } catch (error) {
    console.error('❌ Error creating task:', error.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});
app.get('/tasks', async (req, res) => {
  try {
    const tasks = await Task.find();
    res.status(200).json(tasks);
  } catch (error) {
    console.error('❌ Error fetching tasks:', error.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.put('/tasks/:id', async (req, res) => {
  try {
    const { title, completed } = req.body; // Accept new title or status
    const updatedTask = await Task.findByIdAndUpdate(
      req.params.id, 
      { title, completed }, 
      { new: true }
    );
    res.json(updatedTask);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/tasks/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const deletedTask = await Task.findByIdAndDelete(id);

    if (!deletedTask) {
      return res.status(404).json({ error: 'Task not found' });
    }

    res.status(200).json({ message: 'Task deleted successfully' });
  } catch (error) {
    console.error('❌ Error deleting task:', error.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});

mongoose.connect('mongodb://127.0.0.1:27017/mern_local')
  .then(() => console.log('✅ MongoDB Connected Locally'))
  .catch(err => {
      console.error('❌ Connection Error:', err.message);
      console.log('Tip: Check if MongoDB Community Server is installed and running.');
  });

app.get('/', (req, res) => res.send('Server is running'));

