const mongoose = require('mongoose')

const taskSchema = mongoose.Schema(
    {
        task: {
            type: String,
            required: [true, 'Please enter the task']
        },
        description: {
            type: String,
            require: false
        }
    },
    {
        timeStamps: true
    }
)

const Task = mongoose.model('Task', taskSchema);

module.exports = Task;