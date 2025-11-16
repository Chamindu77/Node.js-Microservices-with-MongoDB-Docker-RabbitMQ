// require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');

// const cors = require("cors");
const app = express();
const PORT = process.env.PORT || 5000;

app.use(bodyParser.json());
// app.use(express.json());
 
async function connectDB() {
  try {
    await mongoose.connect(process.env.MONGO_URL || 'mongodb://mongo:27017/users');
    console.log("Connected to MongoDB");
  } catch (err) {
    console.error("Error connecting to MongoDB", err);
  }
}
const UserSchema = new mongoose. Schema({
    name: String,
    email: String
});

const User = mongoose.model('User', UserSchema);


app.post('/users', async (req, res) => {
    const {name, email} = req.body;
    try{
        const user = new User ({name, email})
        await user.save();
        res.status(201).send(user);
    } catch (error){
        res.status(500).send(error);
    }
})

app.get('/users', async (req, res) => {
    try{
        const users = await User.find();
        res.status(200).send(users);
    } catch (error){
        res.status(500).send(error);
    }
})

app.get("/", (req, res) => res.send("node microservices user service Backend is running"));



const startServer = async () => {
  await connectDB(); 
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
};

startServer();