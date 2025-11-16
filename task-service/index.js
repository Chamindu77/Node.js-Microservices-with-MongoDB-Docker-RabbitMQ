// require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const amqp = require('amqplib');


// const cors = require("cors");
const app = express();
const PORT = process.env.PORT || 5001;

app.use(bodyParser.json());
// app.use(express.json());
 
async function connectDB() {
  try {
    await mongoose.connect(process.env.MONGO_URL || 'mongodb://mongo:27017/tasks');
    console.log("Connected to MongoDB");
  } catch (err) {
    console.error("Error connecting to MongoDB", err);
  }
}
const TaskSchema = new mongoose. Schema({
    title: String,
    description: String,
    userId: String,
    createdAt: { type: Date, default: Date.now }
});

const Task = mongoose.model('Task', TaskSchema);

let channel, connection;

async function connectRabbitMQWithRetry(restries = 5, delay = 5000) {
  while (restries) {
    try {
      connection = await amqp.connect('amqp://rabbitmq:5672');
      channel = await connection.createChannel();
      await channel.assertQueue('task_created');
      console.log("Connected to RabbitMQ");
      return;
    } catch (error) {
      console.error("Error connecting to RabbitMQ", error.message);
      restries--;
      console.log(`Retries again: ${restries}`);
      await new Promise(res => setTimeout(res, delay));
    }
}}

app.post('/tasks', async (req, res) => {
    const {title, description, userId} = req.body;
    try{
        const task = new Task ({title, description, userId})
        await task.save();
        
        const message = {taskId: task._id, title, description, userId};
        if (channel) {
          channel.sendToQueue('task_created', Buffer.from(JSON.stringify(message)));
        }
        else {
          return res.status(500).send({error: "No channel found"});
        }

        res.status(201).send(task);
    } catch (error){
        res.status(500).send(error);
    }
})

app.get('/tasks', async (req, res) => {
    try{
        const tasks = await Task.find();
        res.status(200).send(tasks);
    } catch (error){
        res.status(500).send(error);
    }
})

app.get("/", (req, res) => res.send("node microservices task service Backend is running"));



const startServer = async () => {
  await connectDB(); 
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  connectRabbitMQWithRetry();
};

startServer();