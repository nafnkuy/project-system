const express = require("express");
const cors = require("cors");

const app = express();

app.use(cors());
app.use(express.json());

const users = [
  {
    id: 1,
    username: "student01",
    password: "1234",
    role: "student",
    name: "Somchai"
  },
  {
    id: 2,
    username: "teacher01",
    password: "1234",
    role: "teacher",
    name: "Ajarn Anan"
  }
];

app.get("/", (req, res) => {
  res.send("Backend OK");
});

app.post("/login", (req, res) => {
  const { username, password } = req.body;

  const user = users.find(
    (u) =>
      u.username === username &&
      u.password === password
  );

  if (!user) {
    return res.status(401).json({
      message: "Invalid username or password"
    });
  }

  res.json({
    token: "fake-jwt-token",
    user: {
      name: user.name,
      role: user.role
    }
  });
});

app.listen(5000, () => {
  console.log("Server running on port 5000");
});