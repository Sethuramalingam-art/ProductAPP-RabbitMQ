const express = require("express");
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const User = require("../auth-service/models/User");
const app = express();
app.use(express.json());
const PORT = process.env.PORT || 7070;

const connectDB = async () => {
  try {
    await mongoose.connect("mongodb://localhost/auth-service", {
      //The useNewUrlParser flag is used to allow users to fall back to the old parser if they find a bug in the new parser.
      //The useNewUrlParser option is set to true to use the new MongoDB connection string parser. The current URL string parser is deprecated and will be removed in a future version.
      useNewUrlParser: true,
      //Set to true to opt in to using the MongoDB driver's new connection management engine. You should set this option to true , except for the unlikely case that it prevents
      //you from maintaining a stable connection.
      useUnifiedTopology: true,
    });
    console.log("DB Connected");
  } catch (error) {
    console.log("Error connecting to MongoDB:", error);
  }
};
connectDB();
app.post("/auth/login", async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email });
  if (!user) {
    return res.json({ message: "User doesn't exist" });
  } else {
    if (password !== user.password) {
      return res.json({ message: "Password Incorrect" });
    }
    const payload = {
      email,
      name: user.name,
    };
    jwt.sign(payload, "secret", (err, token) => {
      if (err) console.log(err);
      else return res.json({ token: token });
    });
  }
});

app.post("/auth/register", async (req, res) => {
  const { email, password, name } = req.body;
  const userExists = await User.findOne({ email });
  if (userExists) {
    return res.json({ message: "User already exists" });
  } else {
    const newUser = new User({
      email,
      name,
      password,
    });
    newUser.save();
    return res.json(newUser);
  }
});

app.listen(PORT, () => {
  console.log(`Auth-Service at ${PORT}`);
});
