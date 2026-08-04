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
    WHERE student_id = ?
      AND status IN ('รอพิจารณา','อนุมัติ')
`;

  db.query(checkSql, [student_id], (err, rows) => {
    if (err) {
      return res.status(500).json({
        message: "Database Error",
      });
    }

    if (rows.length > 0) {
      return res.status(400).json({
        message: "คุณมีใบสมัครที่กำลังรอพิจารณาหรือได้รับการอนุมัติแล้ว",
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
    WHERE project_id = ?
      AND student_id = ?
      AND status != 'ถูกยกเลิก'
  `;

  db.query(sql, [projectId, studentId], (err, result) => {
    if (err) {
      return res.status(500).json({
        message: "Database Error",
      });
    }

    res.json({
      submitted: result.length > 0,
    });
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

app.get("/project-requests/student/:studentId", (req, res) => {
  const { studentId } = req.params;

  const sql = `
    SELECT id
    FROM project_requests
    WHERE student_id = ?
      AND status IN ('รอพิจารณา','อนุมัติ')
  `;

  db.query(sql, [studentId], (err, result) => {
    if (err) {
      return res.status(500).json({
        message: "Database Error",
      });
    }

    res.json({
      hasPending: result.length > 0,
    });
  });
});

app.post("/projects", (req, res) => {
  const {
    title,
    advisor,
    advisor_id,
    major,
    project_type,
    max_members,
    academic_year,
    description,
    objectives,
    skills,
    requirements,
  } = req.body;

  const sql = `
    INSERT INTO projects
    (
      title,
      advisor,
      advisor_id,
      major,
      status,
      project_type,
      max_members,
      current_members,
      academic_year,
      description,
      objectives,
      skills,
      requirements,
      source
    )
    VALUES
    (
      ?, ?, ?, ?, 'รออนุมัติ',
      ?, ?, 0, ?,
      ?, ?, ?, ?,
      'student'
    )
  `;

  db.query(
    sql,
    [
      title,
      advisor,
      advisor_id,
      major,
      project_type,
      max_members,
      academic_year,
      description,
      objectives,
      skills,
      requirements,
    ],
    (err, result) => {
      if (err) {
        console.log("Create project error:", err);

        return res.status(500).json({
          message: "Database Error",
        });
      }

      res.json({
        success: true,
        project_id: result.insertId,
      });
    },
  );
});

app.get("/teachers/search", (req, res) => {
  const { name } = req.query;

  const sql = `
    SELECT
      id,
      name
    FROM users
    WHERE role = 'teacher'
      AND name LIKE ?
  `;

  db.query(sql, [`%${name}%`], (err, results) => {
    if (err) {
      return res.status(500).json({
        message: "Database Error",
      });
    }

    res.json(results);
  });
});

app.get("/users/student/:username", (req, res) => {
  const { username } = req.params;

  const sql = `
    SELECT
      id,
      username,
      name
    FROM users
    WHERE username = ?
      AND role = 'student'
  `;

  db.query(sql, [username], (err, result) => {
    if (err) {
      return res.status(500).json({
        message: "Database Error",
      });
    }

    if (result.length === 0) {
      return res.status(404).json({
        message: "ไม่พบนิสิต",
      });
    }

    res.json(result[0]);
  });
});

app.get("/teacher/requests/:advisorId", (req, res) => {
  const advisorId = req.params.advisorId;

  const sql = `
    SELECT
      pr.id,
      p.title,
      u.name AS student_name,
      pr.request_date,
      pr.status

    FROM project_requests pr

    INNER JOIN projects p
      ON pr.project_id = p.id

    INNER JOIN users u
      ON pr.student_id = u.id

    WHERE p.advisor_id = ?

    ORDER BY pr.request_date DESC
  `;

  db.query(sql, [advisorId], (err, results) => {
    if (err) {
      console.log("Teacher requests error:", err);

      return res.status(500).json({
        message: "Database Error",
      });
    }

    console.log("Teacher requests:", results);

    res.json(results);
  });
});

app.post("/project-invitations", (req, res) => {
  const {
    sender_id,
    receiver_id,
    project_id,
    advisor_id,
    title,
    project_type,
    description,
    objectives,
    skills,
    requirements,
  } = req.body;

  const sql = `
    INSERT INTO project_invitations
    (
      sender_id,
      receiver_id,
      project_id,
      advisor_id,
      title,
      project_type,
      description,
      objectives,
      skills,
      requirements
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;

  db.query(
    sql,
    [
      sender_id,
      receiver_id,
      project_id,
      advisor_id,
      title,
      project_type,
      description,
      objectives,
      skills,
      requirements,
    ],
    (err, result) => {
      if (err) {
        console.log("Project invitation error:", err);

        return res.status(500).json({
          message: "Database Error",
        });
      }

      // หา名字คนส่ง
      const senderSql = `
        SELECT name
        FROM users
        WHERE id = ?
      `;

      db.query(senderSql, [sender_id], (senderErr, senderResult) => {
        if (senderErr) {
          console.log("Get sender error:", senderErr);

          return res.status(500).json({
            message: "Database Error",
          });
        }

        const senderName = senderResult[0]?.name || "นิสิต";

        // สร้าง notification
        const notificationSql = `
          INSERT INTO notifications
          (
            user_id,
            message
          )
          VALUES (?, ?)
        `;

        db.query(
          notificationSql,
          [
            receiver_id,
            `${senderName} ได้เชิญคุณเข้าร่วมโครงงาน "${title}"`,
          ],
          (notificationErr) => {
            if (notificationErr) {
              console.log("Notification error:", notificationErr);
            }

            res.json({
              success: true,
              invitation_id: result.insertId,
            });
          },
        );
      });
    },
  );
});

app.get("/project-invitations/:userId", (req, res) => {
  const userId = req.params.userId;

  const sql = `
    SELECT
      pi.id,
      pi.project_id,
      u.name AS sender_name,
      pi.title,
      pi.project_type,
      pi.description,
      pi.objectives,
      pi.skills,
      pi.requirements,
      pi.status,
      pi.created_at

    FROM project_invitations pi

    JOIN users u
      ON pi.sender_id = u.id

    WHERE pi.receiver_id = ?
      AND pi.status = 'รอตอบรับ'

    ORDER BY pi.created_at DESC
  `;

  db.query(sql, [userId], (err, result) => {
    if (err) {
      console.log("Get invitations error:", err);

      return res.status(500).json({
        message: "Database Error",
      });
    }

    res.json(result);
  });
});


app.listen(5000, () => {
  console.log("Server running on port 5000");
});
