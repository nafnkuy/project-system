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
        message: "Database Error"
      });
    }

    res.json({
      submitted: result.length > 0
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
      ?, ?, ?, 'รออนุมัติ',
      ?, ?, 0, ?,
      ?, ?, ?, ?,
      'student'
    )
  `;

  db.query(
    sql,
    [
      title,
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
        console.log(err);
        return res.status(500).json({
          message: "Database Error",
        });
      }

      res.json({
        success: true,
        project_id: result.insertId,
      });
    }
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
      console.log(err);
      return res.status(500).json({
        message: "Database Error",
      });
    }

    console.log(results); // เพิ่มไว้ดูผล

    res.json(results);
  });

});

app.post("/project-invitations", (req, res) => {

  const {
    project_id,
    sender_id,
    receiver_id
  } = req.body;

  const sql = `
    INSERT INTO project_invitations
    (
      project_id,
      sender_id,
      receiver_id
    )
    VALUES (?, ?, ?)
  `;

  db.query(
    sql,
    [project_id, sender_id, receiver_id],
    (err, result) => {

      if (err) {
        console.log(err);

        return res.status(500).json({
          message: "Database Error"
        });
      }

      res.json({
        success: true
      });

    }
  );

});

app.get("/project-invitations/:userId",(req,res)=>{

const userId=req.params.userId;

const sql=`
SELECT
    pi.id,
    u.name AS sender_name,
    p.title

FROM project_invitations pi

JOIN users u
ON pi.sender_id = u.id

JOIN projects p
ON pi.project_id = p.id

WHERE pi.receiver_id = ?
AND pi.status = 'pending'
`;

db.query(sql,[userId],(err,result)=>{

if(err){

return res.status(500).json({
message:"Database Error"
});

}

res.json(result);

});

});
app.listen(5000, () => {
  console.log("Server running on port 5000");
});
