const express = require("express");
const cors = require("cors");
const path = require("path");
const db = require("./db");

const app = express();

app.use(cors());
app.use(express.json());
app.use(
  "/src/assets",
  express.static(path.join(__dirname, "../frontend/src/assets")),
);

app.get("/", (req, res) => {
  res.send("<h1>Backend OK</h1>");
});

app.post("/login", (req, res) => {
  console.log("Login request received:", req.body);
  const { username, password } = req.body;

  const sql = "SELECT * FROM users WHERE username = ? AND password = ?";

  db.query(sql, [username, password], (err, results) => {
    if (err) {
      return res.status(500).json({
        message: "Database Error",
      });
    }
    console.log("Login results:", results);

    if (results.length === 0) {
      return res.status(401).json({
        message: "Invalid username or password",
      });
    }

    const user = results[0];

    res.json({
      token: "fake-jwt-token",
      user: {
        id: user.id,
        username: user.username,
        name: user.name,
        role: user.role,
        profileImage: user.profile_image,
      },
    });
  });
});

app.get("/projects", (req, res) => {
  const sql = `
    SELECT
      p.*,
      u.name AS advisor_name
    FROM projects p
    LEFT JOIN users u
      ON p.advisor_id = u.id
  `;

  db.query(sql, (err, results) => {
    if (err) {
      return res.status(500).json({
        message: "Database Error",
      });
    }

    res.json(results);
  });
});

app.get("/projects/:id", (req, res) => {
  const { id } = req.params;

  const sql = `
  SELECT
      p.*,
      u.name AS advisor_name
  FROM projects p
  LEFT JOIN users u
  ON p.advisor_id = u.id
  WHERE p.id = ?
  `;

  db.query(sql, [id], (err, results) => {
    if (err) {
      return res.status(500).json({
        message: "Database Error",
      });
    }

    if (results.length === 0) {
      return res.status(404).json({
        message: "Project not found",
      });
    }

    const project = results[0];

    const memberSql = `
    SELECT
        u.id,
        u.username,
        u.name
    FROM project_members pm
    JOIN users u
    ON pm.user_id = u.id
    WHERE pm.project_id = ?
    `;

    db.query(memberSql, [id], (err, members) => {
      if (err) {
        return res.status(500).json({
          message: "Database Error",
        });
      }

      project.members = members;

      res.json(project);
    });
  });
});

app.post("/project-requests", (req, res) => {
  const { project_id, student_id, contact_type, contact_value, introduction } =
    req.body;

  const checkSql = `
    SELECT id
    FROM project_requests
    WHERE project_id = ?
      AND student_id = ?
      AND status != 'ถูกยกเลิก'
  `;

  db.query(checkSql, [project_id, student_id], (err, rows) => {
    if (err) {
      return res.status(500).json({
        message: "Database Error",
      });
    }

    if (rows.length > 0) {
      return res.status(400).json({
        message: "คุณได้ส่งใบสมัครแล้ว",
      });
    }

    const insertSql = `
      INSERT INTO project_requests
      (
        project_id,
        student_id,
        contact_type,
        contact_value,
        introduction
      )
      VALUES (?, ?, ?, ?, ?)
    `;

    db.query(
      insertSql,
      [project_id, student_id, contact_type, contact_value, introduction],
      (err, result) => {
        if (err) {
          return res.status(500).json({
            message: "Database Error",
          });
        }

        res.json({
          success: true,
          id: result.insertId,
        });
      },
    );
  });
});

app.get("/project-requests/check/:projectId/:studentId", (req, res) => {
  const { projectId, studentId } = req.params;

  const sql = `
    SELECT id
    FROM project_requests
    WHERE project_id=?
      AND student_id=?
      AND status!='ถูกยกเลิก'
  `;

  db.query(sql, [projectId, studentId], (err, result) => {
    if (err) {
      return res.status(500).json({ message: "Database Error" });
    }

    res.json({
      submitted: result.length > 0,
    });
  });

  app.get("/project-requests/:projectId/:studentId", (req, res) => {
    const { projectId, studentId } = req.params;

    const sql = `
    SELECT
      contact_type,
      contact_value,
      introduction,
      status
    FROM project_requests
    WHERE project_id = ?
      AND student_id = ?
      AND status != 'ถูกยกเลิก'
    LIMIT 1
  `;

    db.query(sql, [projectId, studentId], (err, result) => {
      if (err) {
        return res.status(500).json({
          message: "Database Error",
        });
      }

      if (result.length === 0) {
        return res.status(404).json({
          message: "Not Found",
        });
      }

      res.json(result[0]);
    });
  });
});
app.listen(5000, () => {
  console.log("Server running on port 5000");
});
