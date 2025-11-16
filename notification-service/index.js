const amqplib = require('amqplib');

let retries = 5;
const delay = 5000;

async function start() {
  try {
    const connection = await amqplib.connect('amqp://rabbitmq:5672');
    const channel = await connection.createChannel();

    await channel.assertQueue('task_created');
    console.log("Notification Service listening to messages from RabbitMQ");

    channel.consume('task_created', msg => {
      const message = JSON.parse(msg.content.toString());

      console.log("New Task Created:", message.title);
      console.log("Full Task Data:", message);

      channel.ack(msg);
    });
  } catch (error) {
    console.error("Error connecting to RabbitMQ:", error.message);
    
    retries--;
    console.log(`Retrying... attempts left: ${retries}`);

    if (retries > 0) {
      await new Promise(res => setTimeout(res, delay));
      start();
    } else {
      console.error("Max retries reached. Exiting...");
      process.exit(1);
    }
  }
}

start();
