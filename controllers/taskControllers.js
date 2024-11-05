const Task = require('../models/Task')

const getTasks = async(req, res) => {
    try {
        const task = await Task.find({});
        res.status(200).json(task);
    } catch (error) {
        res.status(500).json({message: error.message})
    }
};

const getTask = async(req, res) => {
    try {
        const {id} = req.params;
        const task = await Task.findById(id);
        res.status(200).json(task);
    } catch(error) {
        res.status(500).json({message: error.message})
    }
};

const createTask = async(req, res) => {
    try {
        const task = await Task.create(req.body)
        res.status(200).json(task)
    } catch (error) {
        console.log(error.message);
        res.status(500).json({message: error.message})
    }
};

const updateTask = async(req, res) => {
    try {
        const {id} = req.params;
        const task = await Task.findByIdAndUpdate(id, req.body, {new: true, runValidators: true});

        if (!task) {
            return res.status(404).json({message: `Cannot find any product with ID ${id}`});
        }
        res.status(200).json(task);
    } catch(error) {
        res.status(500).json({message: error.message})
    }
};

const deleteTask = async(req, res) => {
    try {
        const {id} = req.params;
        const task = await Task.findByIdAndDelete(id);

        if (!task) {
            return res.status(404).json({message: `Cannot find any product with ID ${id}`})
        }
        res.status(200).json(task);
    } catch(error) {
        res.status(500).json({message: error.message})
    }
};

module.exports = {
    getTask,
    getTasks,
    createTask,
    updateTask,
    deleteTask
};