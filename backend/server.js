const express = require("express");
const cors = require("cors");
const path = require("path");

const app = express();

app.use(cors());
app.use(express.json());
app.use(
  "/src/assets",
  express.static(path.join(__dirname, "../frontend/src/assets")),
);

const users = [
  {
    id: 1,
    username: "66160000",
    password: "1234",
    role: "student",
    name: "สุขใจ ใจดี",
    profileImage: "/src/assets/student.jpg",
  },
  {
    id: 2,
    username: "teacher01",
    password: "1234",
    role: "teacher",
    name: "Ajarn Anan",
    profileImage: "/src/assets/teacher01.jpg",
  },
];

app.get("/", (req, res) => {
  res.send("Backend OK");
});

app.post("/login", (req, res) => {
  const { username, password } = req.body;

  const user = users.find(
    (u) => u.username === username && u.password === password,
  );

  if (!user) {
    return res.status(401).json({
      message: "Invalid username or password",
    });
  }

  res.json({
    token: "fake-jwt-token",
    user: {
      id: user.id,
      username: user.username,
      name: user.name,
      role: user.role,
      profileImage: user.profileImage,
    },
  });
});

app.listen(5000, () => {
  console.log("Server running on port 5000");
});
