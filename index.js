require('dotenv').config();  // Load environment variables from .env file

const express = require('express');
const mongoose = require('mongoose');
const app = express();

const Task = require('./models/Task.js');
const taskRoute = require('./routes/task.route');

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use('/tasks', taskRoute);

const PORT = process.env.PORT || 3000;

mongoose
  .connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => {
    console.log('Connected to MongoDB');
    app.listen(PORT, () => {
      console.log(`Hello World Node API is running on port ${PORT}`);
    });
  })
  .catch((error) => {
    console.log(error);
  });
