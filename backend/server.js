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
        major: user.major,
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
      ?, ?, ?, ?, ?,
      ?, ?, 0, ?,
      ?, ?, ?, ?,
      ?
    )
  `;

const status = source === "teacher"
  ? "เปิดรับ"
  : "รออนุมัติ";

db.query(
  sql,
  [
    title,
    advisor,
    advisor_id,
    major,
    status,
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
      name,
      major
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
  p.source,
  u.id AS student_id,
  u.username AS student_username,
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

app.get("/teacher/projects/:projectId/:advisorId", (req, res) => {
  const { projectId, advisorId } = req.params;

  const sql = `
 SELECT
      p.*,
      u.name AS advisor_name
    FROM projects p
    LEFT JOIN users u
      ON p.advisor_id = u.id
    WHERE p.id = ?
      AND p.advisor_id = ?
      AND p.source = 'teacher'
  `;

  db.query(sql, [projectId, advisorId], (err, results) => {
    if (err) {
      console.log("Get teacher project detail error:", err);

      return res.status(500).json({
        message: "Database Error",
      });
    }

    if (results.length === 0) {
      return res.status(404).json({
        message: "ไม่พบหัวข้อโครงงาน หรือหัวข้อนี้ไม่ใช่ของคุณ",
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

    db.query(memberSql, [projectId], (memberErr, members) => {
      if (memberErr) {
        console.log("Get project members error:", memberErr);

        return res.status(500).json({
          message: "Database Error",
        });
      }

      project.members = members;

      res.json(project);
    });
  });
});


// ==========================================
// แก้ไขหัวข้อโครงงานของอาจารย์
// ==========================================

app.put("/teacher/projects/:projectId/:advisorId", (req, res) => {
  const { projectId, advisorId } = req.params;

  const {
    title,
    project_type,
    max_members,
    academic_year,
    description,
    objectives,
    skills,
    requirements,
    status,
    visibility,
  } = req.body;

  const sql = `
    UPDATE projects
    SET
      title = ?,
      project_type = ?,
      max_members = ?,
      academic_year = ?,
      description = ?,
      objectives = ?,
      skills = ?,
      requirements = ?,
      status = ?,
      visibility = ?
    WHERE id = ?
      AND advisor_id = ?
      AND source = 'teacher'
  `;

  db.query(
    sql,
    [
      title,
      project_type,
      max_members,
      academic_year,
      description,
      objectives,
      skills,
      requirements,
      status,
      visibility,
      projectId,
      advisorId,
    ],
    (err, result) => {
      if (err) {
        console.log("Update teacher project error:", err);

        return res.status(500).json({
          message: "Database Error",
        });
      }

      if (result.affectedRows === 0) {
        return res.status(404).json({
          message: "ไม่พบหัวข้อโครงงาน หรือหัวข้อนี้ไม่ใช่ของคุณ",
        });
      }

      res.json({
        success: true,
        message: "แก้ไขหัวข้อโครงงานเรียบร้อยแล้ว",
      });
    },
  );
});

/* =========================
   ซ่อนหัวข้อโครงงาน
========================= */

app.put(
  "/teacher/projects/:projectId/:advisorId/visibility",
  (req, res) => {
    const { projectId, advisorId } = req.params;
    const { visibility } = req.body;

    const sql = `
      UPDATE projects
      SET visibility = ?
      WHERE id = ?
        AND advisor_id = ?
        AND source = 'teacher'
    `;

    db.query(
      sql,
      [visibility, projectId, advisorId],
      (err, result) => {
        if (err) {
          console.log("Hide project error:", err);

          return res.status(500).json({
            message: "Database Error",
          });
        }

        if (result.affectedRows === 0) {
          return res.status(404).json({
            message:
              "ไม่พบหัวข้อโครงงาน หรือหัวข้อนี้ไม่ใช่ของคุณ",
          });
        }

        res.json({
          success: true,
          message: "ซ่อนหัวข้อโครงงานเรียบร้อยแล้ว",
        });
      },
    );
  },
);
/* =========================
   ลบหัวข้อโครงงาน
========================= */

app.delete(
  "/teacher/projects/:projectId/:advisorId",
  (req, res) => {
    const { projectId, advisorId } = req.params;

    const sql = `
      DELETE FROM projects
      WHERE id = ?
        AND advisor_id = ?
        AND source = 'teacher'
    `;

    db.query(
      sql,
      [projectId, advisorId],
      (err, result) => {
        if (err) {
          console.log("Delete project error:", err);

          return res.status(500).json({
            message: "Database Error",
          });
        }

        if (result.affectedRows === 0) {
          return res.status(404).json({
            message:
              "ไม่พบหัวข้อโครงงาน หรือหัวข้อนี้ไม่ใช่ของคุณ",
          });
        }

        res.json({
          success: true,
          message: "ลบหัวข้อโครงงานเรียบร้อยแล้ว",
        });
      },
    );
  },
);

// ==========================================
// Dashboard ของอาจารย์
// ==========================================
app.get("/teacher/dashboard/:advisorId", (req, res) => {
  const advisorId = req.params.advisorId;

  // 1. จำนวนหัวข้อโครงงานของอาจารย์
  const projectSql = `
    SELECT COUNT(*) AS total_projects
    FROM projects
    WHERE advisor_id = ?
      AND source = 'teacher'
  `;

  // 2. จำนวนคำขอที่รอพิจารณา
  const pendingSql = `
    SELECT COUNT(*) AS pending_requests
    FROM project_requests pr
    INNER JOIN projects p
      ON pr.project_id = p.id
    WHERE p.advisor_id = ?
      AND p.source = 'teacher'
      AND pr.status = 'รอพิจารณา'
  `;

  // 3. จำนวนสมาชิกที่อาจารย์อนุมัติแล้ว
  const membersSql = `
    SELECT COUNT(DISTINCT pm.user_id) AS accepted_students
    FROM project_members pm
    INNER JOIN projects p
      ON pm.project_id = p.id
    WHERE p.advisor_id = ?
      AND p.source = 'teacher'
  `;

  db.query(projectSql, [advisorId], (err, projectResult) => {
    if (err) {
      console.log("Dashboard project error:", err);
      return res.status(500).json({
        message: "Database Error",
      });
    }

    db.query(pendingSql, [advisorId], (err, pendingResult) => {
      if (err) {
        console.log("Dashboard pending error:", err);
        return res.status(500).json({
          message: "Database Error",
        });
      }

      db.query(membersSql, [advisorId], (err, membersResult) => {
        if (err) {
          console.log("Dashboard members error:", err);
          return res.status(500).json({
            message: "Database Error",
          });
        }

        const totalProjects =
          Number(projectResult[0]?.total_projects) || 0;

        const pendingRequests =
          Number(pendingResult[0]?.pending_requests) || 0;

        const acceptedStudents =
          Number(membersResult[0]?.accepted_students) || 0;

        // อาจารย์รับนิสิตได้สูงสุด 14 คน
        const totalCapacity = 14;

        res.json({
          totalProjects,
          pendingRequests,
          acceptedStudents,
          totalCapacity,
          status:
            acceptedStudents < totalCapacity
              ? "เปิดรับ"
              : "เต็ม",
        });
      });
    });
  });
});

// ==========================================
// รายละเอียดคำขอเข้าร่วมโครงงาน
// ==========================================
app.get(
  "/teacher/request/:requestId/:advisorId",
  (req, res) => {
    const { requestId, advisorId } = req.params;

    const sql = `
      SELECT
        pr.id,
        pr.project_id,
        pr.student_id,
        pr.contact_type,
        pr.contact_value,
        pr.introduction,
        pr.request_date,
        pr.status,

        -- ข้อมูลนิสิต
        student.username AS student_username,
        student.name AS student_name,
        student.major AS student_major,

        -- ข้อมูลโครงงาน
        p.title,
        p.advisor_id,
        p.major,
        p.project_type,
        p.max_members,
        p.current_members,
        p.academic_year,
        p.description,
        p.objectives,
        p.skills,
        p.requirements,

        -- อาจารย์
        advisor.name AS advisor_name

      FROM project_requests pr

      INNER JOIN projects p
        ON pr.project_id = p.id

      INNER JOIN users student
        ON pr.student_id = student.id

      LEFT JOIN users advisor
        ON p.advisor_id = advisor.id

      WHERE pr.id = ?
        AND p.advisor_id = ?
        AND p.source IN ('teacher', 'student')
    `;

    db.query(
      sql,
      [requestId, advisorId],
      (err, results) => {
        if (err) {
          console.log(
            "Get teacher request detail error:",
            err,
          );

          return res.status(500).json({
            message: "Database Error",
          });
        }

        if (results.length === 0) {
          return res.status(404).json({
            message:
              "ไม่พบคำขอ หรือคำขอนี้ไม่ใช่ของคุณ",
          });
        }

        const request = results[0];

        // ดึงสมาชิกของโครงงาน
        const memberSql = `
          SELECT
            u.id,
            u.username,
            u.name
          FROM project_members pm

          INNER JOIN users u
            ON pm.user_id = u.id

          WHERE pm.project_id = ?
        `;

        db.query(
          memberSql,
          [request.project_id],
          (memberErr, members) => {
            if (memberErr) {
              console.log(
                "Get request members error:",
                memberErr,
              );

              return res.status(500).json({
                message: "Database Error",
              });
            }

            request.members = members;

            res.json(request);
          },
        );
      },
    );
  },
);

// ==========================================
// อนุมัติคำขอเข้าร่วมโครงงาน
// ==========================================
app.post(
  "/teacher/request/:requestId/approve",
  (req, res) => {
    const { requestId } = req.params;
    const { advisor_id } = req.body;

    // 1. ดึงข้อมูลคำขอ
    const getRequestSql = `
      SELECT
        pr.*,
        p.title,
        p.advisor_id,
        p.max_members,
        p.current_members,
        student.name AS student_name
      FROM project_requests pr

      INNER JOIN projects p
        ON pr.project_id = p.id

      INNER JOIN users student
        ON pr.student_id = student.id

      WHERE pr.id = ?
        AND p.advisor_id = ?
        AND p.source IN ('teacher', 'student')
    `;

    db.query(
      getRequestSql,
      [requestId, advisor_id],
      (err, results) => {
        if (err) {
          console.log(
            "Get approve request error:",
            err,
          );

          return res.status(500).json({
            message: "Database Error",
          });
        }

        if (results.length === 0) {
          return res.status(404).json({
            message:
              "ไม่พบคำขอ หรือคำขอนี้ไม่ใช่ของคุณ",
          });
        }

        const request = results[0];

        // 2. ต้องเป็นคำขอที่รอพิจารณาเท่านั้น
        if (request.status !== "รอพิจารณา") {
          return res.status(400).json({
            message: "คำขอนี้ได้รับการพิจารณาแล้ว",
          });
        }

        // 3. ตรวจสอบจำนวนสมาชิก
        if (
          Number(request.current_members) >=
          Number(request.max_members)
        ) {
          return res.status(400).json({
            message:
              "โครงงานนี้มีสมาชิกเต็มแล้ว",
          });
        }

        // 4. ตรวจสอบว่านิสิตอยู่ใน project_members แล้วหรือยัง
        const checkMemberSql = `
          SELECT id
          FROM project_members
          WHERE project_id = ?
            AND user_id = ?
        `;

        db.query(
          checkMemberSql,
          [
            request.project_id,
            request.student_id,
          ],
          (err, memberRows) => {
            if (err) {
              return res.status(500).json({
                message: "Database Error",
              });
            }

            if (memberRows.length > 0) {
              return res.status(400).json({
                message:
                  "นิสิตคนนี้เป็นสมาชิกโครงงานอยู่แล้ว",
              });
            }

            // 5. เพิ่มสมาชิก
            const insertMemberSql = `
              INSERT INTO project_members
              (
                project_id,
                user_id
              )
              VALUES (?, ?)
            `;

            db.query(
              insertMemberSql,
              [
                request.project_id,
                request.student_id,
              ],
              (err) => {
                if (err) {
                  console.log(
                    "Insert project member error:",
                    err,
                  );

                  return res.status(500).json({
                    message:
                      "เพิ่มสมาชิกโครงงานไม่สำเร็จ",
                  });
                }

                // 6. เปลี่ยนสถานะ request
                const updateRequestSql = `
                  UPDATE project_requests
                  SET status = 'อนุมัติ'
                  WHERE id = ?
                `;

                db.query(
                  updateRequestSql,
                  [requestId],
                  (err) => {
                    if (err) {
                      console.log(
                        "Update request status error:",
                        err,
                      );

                      return res.status(500).json({
                        message:
                          "อัปเดตสถานะคำขอไม่สำเร็จ",
                      });
                    }

                    // 7. เพิ่มจำนวนสมาชิก
                    const updateProjectSql = `
                      UPDATE projects
                      SET current_members = current_members + 1
                      WHERE id = ?
                    `;

                    db.query(
                      updateProjectSql,
                      [request.project_id],
                      (err) => {
                        if (err) {
                          console.log(
                            "Update project member count error:",
                            err,
                          );

                          return res.status(500).json({
                            message:
                              "อัปเดตจำนวนสมาชิกไม่สำเร็จ",
                          });
                        }

                        // 8. Notification
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
                            request.student_id,
                            `อาจารย์อนุมัติคำขอเข้าร่วมโครงงาน "${request.title}" ของคุณแล้ว`,
                          ],
                          (notificationErr) => {
                            if (notificationErr) {
                              console.log(
                                "Notification error:",
                                notificationErr,
                              );
                            }

                            res.json({
                              success: true,
                              message:
                                "อนุมัติคำขอเรียบร้อยแล้ว",
                            });
                          },
                        );
                      },
                    );
                  },
                );
              },
            );
          },
        );
      },
    );
  },
);

// ==========================================
// ปฏิเสธคำขอเข้าร่วมโครงงาน
// ==========================================
app.post(
  "/teacher/request/:requestId/reject",
  (req, res) => {
    const { requestId } = req.params;
    const { advisor_id } = req.body;

    const getRequestSql = `
      SELECT
        pr.id,
        pr.student_id,
        pr.status,
        p.title
      FROM project_requests pr

      INNER JOIN projects p
        ON pr.project_id = p.id

      WHERE pr.id = ?
        AND p.advisor_id = ?
        AND p.source IN ('teacher', 'student')
    `;

    db.query(
      getRequestSql,
      [requestId, advisor_id],
      (err, results) => {
        if (err) {
          console.log(
            "Get reject request error:",
            err,
          );

          return res.status(500).json({
            message: "Database Error",
          });
        }

        if (results.length === 0) {
          return res.status(404).json({
            message:
              "ไม่พบคำขอ หรือคำขอนี้ไม่ใช่ของคุณ",
          });
        }

        const request = results[0];

        if (request.status !== "รอพิจารณา") {
          return res.status(400).json({
            message:
              "คำขอนี้ได้รับการพิจารณาแล้ว",
          });
        }

        const updateSql = `
          UPDATE project_requests
          SET status = 'ปฏิเสธ'
          WHERE id = ?
        `;

        db.query(
          updateSql,
          [requestId],
          (err) => {
            if (err) {
              console.log(
                "Reject request error:",
                err,
              );

              return res.status(500).json({
                message:
                  "อัปเดตสถานะคำขอไม่สำเร็จ",
              });
            }

            // แจ้งเตือนนิสิต
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
                request.student_id,
                `อาจารย์ปฏิเสธคำขอเข้าร่วมโครงงาน "${request.title}" ของคุณ`,
              ],
              (notificationErr) => {
                if (notificationErr) {
                  console.log(
                    "Reject notification error:",
                    notificationErr,
                  );
                }

                res.json({
                  success: true,
                  message:
                    "ปฏิเสธคำขอเรียบร้อยแล้ว",
                });
              },
            );
          },
        );
      },
    );
  },
);

app.listen(5000, () => {
  console.log("Server running on port 5000");
});
