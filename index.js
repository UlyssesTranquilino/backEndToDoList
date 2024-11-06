
const express = require('express')
const mongoose = require("mongoose")
const app = express()

require('dotenv').config();
const MONGO_URI = process.env.MONGO_URI;

const Task = require('./models/Task.js')
const taskRoute = require('./routes/task.route')

app.use(express.json())
app.use(express.urlencoded({extended: false}))


app.use('/tasks', taskRoute)


mongoose.
connect(MONGO_URI)
.then(() => {
    console.log('Connected to MongoDB')
    app.listen(3000, () => {
        console.log('Hello World Node API is running on port 3000')
    })
}).catch((error) => {
    console.log(error)
})

