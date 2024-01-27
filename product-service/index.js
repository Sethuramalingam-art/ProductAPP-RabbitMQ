const express = require("express");
const app = express();
const mongoose = require("mongoose");
const Product = require("./Product");
const jwt = require("jsonwebtoken");
const amqp = require("amqplib"); //rabbitMQ library
const isAuthenticated = require("../isAuthenticated");
var order;

var channel, connection;

const PORT = process.env.PORT | 8080;

app.use(express.json());

const connetToDB = async () => {
  try {
    await mongoose.connect("mongodb://localhost/product-service", {
      //The useNewUrlParser flag is used to allow users to fall back to the old parser if they find a bug in the new parser.
      //The useNewUrlParser option is set to true to use the new MongoDB connection string parser. The current URL string parser is deprecated and will be removed in a future version.
      useNewUrlParser: true,
      //Set to true to opt in to using the MongoDB driver's new connection management engine. You should set this option to true , except for the unlikely case that it prevents
      //you from maintaining a stable connection.
      useUnifiedTopology: true,
    });
    console.log("Product service DB Connected");
  } catch (error) {
    console.log("Error connecting to MongoDB:", error);
  }
};

connetToDB();

// RabbitMQ connection
async function connectToQueuingServer() {
  const amqpServer = "amqp://localhost:5672";
  connection = amqp.connect(amqpServer);
  channel = (await connection).createChannel();
  (await channel).assertQueue("PRODUCT");
}
connectToQueuingServer;

app.post("/product/buy", isAuthenticated, async (req, res) => {
  const { ids } = req.body;
  const products = await Product.find({ _id: { $in: ids } });
  channel.sendToQueue(
      "ORDER",
      Buffer.from(
          JSON.stringify({
              products,
              userEmail: req.user.email,
          })
      )
  );
  channel.consume("PRODUCT", (data) => {
      order = JSON.parse(data.content);
  });
  return res.json(order);
});

app.post("/product/create", isAuthenticated, async (req, res) => {
  const { name, description, price } = req.body;
  const newProduct = new Product({
    name,
    description,
    price,
  });
  newProduct.save();
  return res.json(newProduct);
});

app.listen(PORT, () => {
  console.log(`Product-Service at ${PORT}`);
});
