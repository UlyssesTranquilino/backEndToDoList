const express = require("express");
const Task = require("../models/Task.js")
const router = express.Router();
const {getTask, getTasks, createTask, updateTask, deleteTask} = require('../controllers/taskControllers.js');

router.post('/', createTask); // Create
router.get('/', getTasks); // Read
router.get('/:id', getTask); // Read
router.put('/:id', updateTask); // Update
router.delete('/:id', deleteTask); //Delete

module.exports = router;
