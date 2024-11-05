
const express = require('express')
const mongoose = require("mongoose")
const app = express()

const Task = require('./models/Task.js')
const taskRoute = require('./routes/task.route')

app.use(express.json())
app.use(express.urlencoded({extended: false}))


app.use('/tasks', taskRoute)


mongoose.
connect('mongodb+srv://tranquilinoulysses9:uEE8A6tWejjf3jpt@backenddb.cloxn.mongodb.net/?retryWrites=true&w=majority&appName=BackendDB')
.then(() => {
    console.log('Connected to MongoDB')
    app.listen(3000, () => {
        console.log('Hello World Node API is running on port 3000')
    })
}).catch((error) => {
    console.log(error)
})

