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
    source,
    student_id,
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
      ?
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
      source,
    ],
    (err, result) => {
      if (err) {
        console.log("Create project error:", err);

        return res.status(500).json({
          message: "Database Error",
        });
      }

      const projectId = result.insertId;

      // ถ้า source เป็น teacher
      res.json({
        success: true,
        project_id: projectId,
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
    contact_type,
    contact_value,
    introduction,
  } = req.body;

  // ห้ามเชิญตัวเอง
  if (Number(sender_id) === Number(receiver_id)) {
    return res.status(400).json({
      message: "ไม่สามารถเชิญตัวเองเข้าร่วมโครงงานได้",
    });
  }

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
    requirements,
    contact_type,
    contact_value,
    introduction
  )
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
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
      contact_type,
      contact_value,
      introduction,
    ],
    (err, result) => {
      if (err) {
        console.log("Project invitation error:", err);

        return res.status(500).json({
          message: "Database Error",
        });
      }
      res.json({
  success: true,
  invitation_id: result.insertId,
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

      -- สมาชิกคนที่ 1
      sender.id AS sender_id,
      sender.username AS sender_username,
      sender.name AS sender_name,

      -- สมาชิกคนที่ 2
      receiver.id AS receiver_id,
      receiver.username AS receiver_username,
      receiver.name AS receiver_name,

      -- ข้อมูลโครงงาน
      pi.title,
      pi.project_type,
      pi.description,
      pi.objectives,
      pi.skills,
      pi.requirements,

      -- ข้อมูลติดต่อ
      pi.contact_type,
      pi.contact_value,
      pi.introduction,

      pi.status,
      pi.created_at

    FROM project_invitations pi

    JOIN users sender
      ON pi.sender_id = sender.id

    JOIN users receiver
      ON pi.receiver_id = receiver.id

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

    console.log("INVITATION DATA:", result);

    res.json(result);
  });
});

app.post("/project-invitations/:id/accept", (req, res) => {
  const invitationId = req.params.id;

  // 1. ดึงข้อมูลคำเชิญ
  const getInvitationSql = `
    SELECT
      pi.*,
      sender.name AS sender_name,
      receiver.name AS receiver_name
    FROM project_invitations pi

    JOIN users sender
      ON pi.sender_id = sender.id

    JOIN users receiver
      ON pi.receiver_id = receiver.id

    WHERE pi.id = ?
  `;

  db.query(getInvitationSql, [invitationId], (err, invitationResult) => {
    if (err) {
      console.log("Get invitation error:", err);

      return res.status(500).json({
        message: "Database Error",
      });
    }

    if (invitationResult.length === 0) {
      return res.status(404).json({
        message: "ไม่พบคำเชิญ",
      });
    }

    const invitation = invitationResult[0];

    // ตรวจสอบว่าคำเชิญยังรอตอบรับอยู่หรือไม่
    if (invitation.status !== "รอตอบรับ") {
      return res.status(400).json({
        message: "คำเชิญนี้ถูกตอบไปแล้ว",
      });
    }

    // 2. เปลี่ยนสถานะคำเชิญ
    const updateInvitationSql = `
      UPDATE project_invitations
      SET status = 'ตอบรับ'
      WHERE id = ?
    `;

    db.query(updateInvitationSql, [invitationId], (err) => {
      if (err) {
        console.log("Update invitation error:", err);

        return res.status(500).json({
          message: "Database Error",
        });
      }

      // 3. สร้าง project_request
      // student_id = สมาชิกคนที่ 1 (sender_id)
      const insertRequestSql = `
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
        insertRequestSql,
        [
          invitation.project_id,
          invitation.sender_id,
          invitation.contact_type,
          invitation.contact_value,
          invitation.introduction,
        ],
        (err, requestResult) => {
          if (err) {
            console.log("Create project request error:", err);

            return res.status(500).json({
              message: "สร้างคำขอไม่สำเร็จ",
            });
          }

          // 4. ส่ง notification กลับไปหาสมาชิกคนที่ 1
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
              invitation.sender_id,
              `${invitation.receiver_name} ตอบรับคำเชิญเข้าร่วมโครงงาน "${invitation.title}" แล้ว`,
            ],
            (notificationErr) => {
              if (notificationErr) {
                console.log("Notification error:", notificationErr);
              }

              // 5. ส่งผลกลับไป Frontend
              res.json({
                success: true,
                message: "ตอบรับคำเชิญเรียบร้อยแล้ว",
                invitation_id: invitationId,
                request_id: requestResult.insertId,
              });
            },
          );
        },
      );
    });
  });
});

app.post("/project-invitations/:id/reject", (req, res) => {
  const invitationId = req.params.id;

  // 1. ดึงข้อมูลคำเชิญก่อน
  const getInvitationSql = `
    SELECT
      pi.id,
      pi.sender_id,
      pi.receiver_id,
      pi.project_id,
      pi.title,
      pi.status,
      u.name AS receiver_name
    FROM project_invitations pi
    JOIN users u
      ON pi.receiver_id = u.id
    WHERE pi.id = ?
  `;

  db.query(getInvitationSql, [invitationId], (err, invitationResult) => {
    if (err) {
      console.log("Get invitation error:", err);

      return res.status(500).json({
        message: "Database Error",
      });
    }

    if (invitationResult.length === 0) {
      return res.status(404).json({
        message: "ไม่พบคำเชิญนี้",
      });
    }

    const invitation = invitationResult[0];

    // ต้องเป็นคำเชิญที่ยังรอตอบรับเท่านั้น
    if (invitation.status !== "รอตอบรับ") {
      return res.status(400).json({
        message: "คำเชิญนี้ได้รับการตอบไปแล้ว",
      });
    }

    // 2. เปลี่ยนสถานะคำเชิญเป็น "ปฏิเสธ"
    const updateSql = `
      UPDATE project_invitations
      SET status = 'ปฏิเสธ'
      WHERE id = ?
    `;

    db.query(updateSql, [invitationId], (err) => {
      if (err) {
        console.log("Reject invitation update error:", err);

        return res.status(500).json({
          message: "Database Error",
        });
      }

      // 3. แจ้งเตือนกลับไปหาสมาชิกคนที่ 1
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
          invitation.sender_id,
          `${invitation.receiver_name} ปฏิเสธคำเชิญเข้าร่วมโครงงาน "${invitation.title}"`,
        ],
        (notificationErr) => {
          if (notificationErr) {
            console.log(
              "Reject notification error:",
              notificationErr
            );
          }

          res.json({
            success: true,
            message: "ปฏิเสธคำเชิญเรียบร้อยแล้ว",
          });
        }
      );
    });
  });
});

app.get("/notifications/:userId", (req, res) => {
  const userId = req.params.userId;

const sql = `
  SELECT
    id,
    message,
    created_at
  FROM notifications
  WHERE user_id = ?
    AND message NOT LIKE '%ได้เชิญคุณเข้าร่วมโครงงาน%'
  ORDER BY created_at DESC
`;

  db.query(sql, [userId], (err, result) => {
    if (err) {
      console.log("Get notifications error:", err);

      return res.status(500).json({
        message: "Database Error",
      });
    }

    res.json(result);
  });
});

app.get("/teacher/projects/:advisorId", (req, res) => {
  const advisorId = req.params.advisorId;

  const sql = `
    SELECT
      id,
      title,
      description,
      skills,
      requirements,
      max_members,
      current_members,
      status,
      project_type,
      academic_year,
      visibility
    FROM projects
    WHERE advisor_id = ?
      AND source = 'teacher'
    ORDER BY id DESC
  `;

  db.query(sql, [advisorId], (err, results) => {
    if (err) {
      console.log("Get teacher projects error:", err);

      return res.status(500).json({
        message: "Database Error",
      });
    }

    console.log("Teacher Projects:", results);

    res.json(results);
  });
});

app.listen(5000, () => {
  console.log("Server running on port 5000");
});
