const express = require("express");
const cors = require("cors");
const path = require("path");
const fs = require("fs");
const sharp = require("sharp");

const { PDFDocument } = require("pdf-lib");
const fontkit = require("@pdf-lib/fontkit");

const db = require("./db");

const app = express();

app.use(cors());
app.use(express.json());
app.use("/generated", express.static(path.join(__dirname, "generated")));
app.use(
  "/src/assets",
  express.static(path.join(__dirname, "../frontend/src/assets")),
);
const getAssetFilePath = (assetUrl) => {
  if (!assetUrl) return null;

  const relativePath = assetUrl.replace(/^\/src\/assets\//, "");

  return path.join(__dirname, "../frontend/src/assets", relativePath);
};

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

  const status = source === "teacher" ? "เปิดรับ" : "รออนุมัติ";

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
      u.id,
      u.name,
      u.major,

      COUNT(DISTINCT pm.user_id) AS accepted_students,

      14 AS total_capacity,

      GREATEST(
        14 - COUNT(DISTINCT pm.user_id),
        0
      ) AS remaining_capacity,

      CASE
        WHEN COUNT(DISTINCT pm.user_id) >= 14
        THEN 'เต็ม'
        ELSE 'เปิดรับ'
      END AS advisor_status

    FROM users u

    LEFT JOIN projects p
      ON p.advisor_id = u.id

    LEFT JOIN project_members pm
      ON pm.project_id = p.id

    WHERE u.role = 'teacher'
      AND u.name LIKE ?

    GROUP BY
      u.id,
      u.name,
      u.major
  `;

  db.query(sql, [`%${name}%`], (err, results) => {
    if (err) {
      console.log("Teacher search error:", err);

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

    // ต้องเป็นคำเชิญที่ยังรอตอบรับเท่านั้น
    if (invitation.status !== "รอตอบรับ") {
      return res.status(400).json({
        message: "คำเชิญนี้ถูกตอบไปแล้ว",
      });
    }

    // 2. เปลี่ยนสถานะคำเชิญเป็น "ตอบรับ"
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

      // 3. แจ้งเตือนกลับไปหาคนที่ 1 เท่านั้น
      // ยังไม่สร้าง project_request
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

          res.json({
            success: true,
            message: "ตอบรับคำเชิญเรียบร้อยแล้ว",
            invitation_id: invitationId,
          });
        },
      );
    });
  });
});

app.get("/project-invitations/status/:projectId/:senderId", (req, res) => {
  const { projectId, senderId } = req.params;

  const sql = `
    SELECT
      id,
      project_id,
      sender_id,
      receiver_id,
      status
    FROM project_invitations
    WHERE project_id = ?
      AND sender_id = ?
    ORDER BY created_at DESC
    LIMIT 1
  `;

  db.query(sql, [projectId, senderId], (err, result) => {
    if (err) {
      console.log("Get invitation status error:", err);

      return res.status(500).json({
        message: "Database Error",
      });
    }

    if (result.length === 0) {
      return res.status(404).json({
        message: "ไม่พบคำเชิญสมาชิก",
      });
    }

    res.json(result[0]);
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
            console.log("Reject notification error:", notificationErr);
          }

          res.json({
            success: true,
            message: "ปฏิเสธคำเชิญเรียบร้อยแล้ว",
          });
        },
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
    request_id,
    project_id,
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

app.put("/teacher/projects/:projectId/:advisorId/visibility", (req, res) => {
  const { projectId, advisorId } = req.params;
  const { visibility } = req.body;

  const sql = `
      UPDATE projects
      SET visibility = ?
      WHERE id = ?
        AND advisor_id = ?
        AND source = 'teacher'
    `;

  db.query(sql, [visibility, projectId, advisorId], (err, result) => {
    if (err) {
      console.log("Hide project error:", err);

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
      message: "ซ่อนหัวข้อโครงงานเรียบร้อยแล้ว",
    });
  });
});
/* =========================
   ลบหัวข้อโครงงาน
========================= */

app.delete("/teacher/projects/:projectId/:advisorId", (req, res) => {
  const { projectId, advisorId } = req.params;

  const sql = `
      DELETE FROM projects
      WHERE id = ?
        AND advisor_id = ?
        AND source = 'teacher'
    `;

  db.query(sql, [projectId, advisorId], (err, result) => {
    if (err) {
      console.log("Delete project error:", err);

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
      message: "ลบหัวข้อโครงงานเรียบร้อยแล้ว",
    });
  });
});

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
      AND pr.status = 'รอพิจารณา'
  `;

  // 3. จำนวนสมาชิกที่อาจารย์อนุมัติแล้ว
  const membersSql = `
    SELECT COUNT(DISTINCT pm.user_id) AS accepted_students
    FROM project_members pm
    INNER JOIN projects p
      ON pm.project_id = p.id
    WHERE p.advisor_id = ?
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

        const totalProjects = Number(projectResult[0]?.total_projects) || 0;

        const pendingRequests = Number(pendingResult[0]?.pending_requests) || 0;

        const acceptedStudents =
          Number(membersResult[0]?.accepted_students) || 0;

        // อาจารย์รับนิสิตได้สูงสุด 14 คน
        const totalCapacity = 14;

        res.json({
          totalProjects,
          pendingRequests,
          acceptedStudents,
          totalCapacity,
          status: acceptedStudents < totalCapacity ? "เปิดรับ" : "เต็ม",
        });
      });
    });
  });
});

// ==========================================
// รายละเอียดคำขอเข้าร่วมโครงงาน
// ==========================================
app.get("/teacher/request/:requestId/:advisorId", (req, res) => {
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

  db.query(sql, [requestId, advisorId], (err, results) => {
    if (err) {
      console.log("Get teacher request detail error:", err);

      return res.status(500).json({
        message: "Database Error",
      });
    }

    if (results.length === 0) {
      return res.status(404).json({
        message: "ไม่พบคำขอ หรือคำขอนี้ไม่ใช่ของคุณ",
      });
    }

    const request = results[0];
    // ดึงสมาชิกของโครงงาน
    // คนที่ 1 = project_requests.student_id
    // คนที่ 2 = project_invitations.receiver_id
    const memberSql = `
  SELECT
    u.id,
    u.username,
    u.name,
    u.major
  FROM users u
  WHERE u.id = ?

  UNION

  SELECT
    u.id,
    u.username,
    u.name,
    u.major
  FROM project_invitations pi
  INNER JOIN users u
    ON pi.receiver_id = u.id
  WHERE pi.project_id = ?
    AND pi.sender_id = ?
    AND pi.status = 'ตอบรับ'
`;

    db.query(
      memberSql,
      [
        request.student_id, // คนที่ 1
        request.project_id, // project
        request.student_id, // sender = คนที่ 1
      ],
      (memberErr, members) => {
        if (memberErr) {
          console.log("Get request members error:", memberErr);

          return res.status(500).json({
            message: "Database Error",
          });
        }

        request.members = members;

        res.json(request);
      },
    );
  });
});

// ==========================================
// อนุมัติคำขอเข้าร่วมโครงงาน
// ==========================================
app.post("/teacher/request/:requestId/approve", (req, res) => {
  const { requestId } = req.params;
  const { advisor_id } = req.body;

  // 1. ดึงข้อมูลคำขอ
  const getRequestSql = `
      SELECT
        pr.*,
        p.title,
        p.advisor_id,
        p.project_type,
        p.source,
        p.max_members, 
        p.current_members,

        (
  SELECT pi.receiver_id
  FROM project_invitations pi
  WHERE pi.project_id = pr.project_id
    AND pi.sender_id = pr.student_id
    AND pi.status = 'ตอบรับ'
  ORDER BY pi.created_at DESC
  LIMIT 1
) AS second_member_id,
student.name AS student_name,

advisor.name AS advisor_name,
advisor.signature_image AS advisor_signature

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

  db.query(getRequestSql, [requestId, advisor_id], (err, results) => {
    if (err) {
      console.log("Get approve request error:", err);

      return res.status(500).json({
        message: "Database Error",
      });
    }

    if (results.length === 0) {
      return res.status(404).json({
        message: "ไม่พบคำขอ หรือคำขอนี้ไม่ใช่ของคุณ",
      });
    }

    const request = results[0];

    const memberIds = [Number(request.student_id)];

    if (request.source === "student" && request.project_type === "โครงงานคู่") {
      if (!request.second_member_id) {
        return res.status(400).json({
          message: "ไม่พบสมาชิกคนที่ 2 ของโครงงานคู่",
        });
      }

      memberIds.push(Number(request.second_member_id));
    }

    // 2. ต้องเป็นคำขอที่รอพิจารณาเท่านั้น
    if (request.status !== "รอพิจารณา") {
      return res.status(400).json({
        message: "คำขอนี้ได้รับการพิจารณาแล้ว",
      });
    }

    // 3. ตรวจสอบจำนวนสมาชิก
    if (
      Number(request.current_members) + memberIds.length >
      Number(request.max_members)
    ) {
      return res.status(400).json({
        message: "จำนวนสมาชิกเกินที่โครงงานกำหนด",
      });
    }

    // 4. ตรวจสอบว่าสมาชิกอยู่ใน project_members แล้วหรือยัง
    const placeholders = memberIds.map(() => "?").join(", ");

    const checkMemberSql = `
  SELECT id
  FROM project_members
  WHERE project_id = ?
    AND user_id IN (${placeholders})
`;

    db.query(
      checkMemberSql,
      [request.project_id, ...memberIds],
      (err, memberRows) => {
        if (err) {
          return res.status(500).json({
            message: "Database Error",
          });
        }

        if (memberRows.length > 0) {
          return res.status(400).json({
            message: "นิสิตคนนี้เป็นสมาชิกโครงงานอยู่แล้ว",
          });
        }

        // 5. เพิ่มสมาชิก
        const insertValues = memberIds.map(() => "(?, ?)").join(", ");

        const insertParams = memberIds.flatMap((userId) => [
          request.project_id,
          userId,
        ]);

        const insertMemberSql = `
          INSERT INTO project_members
        (
          project_id,
          user_id
        )
         VALUES ${insertValues}
        `;

        db.query(insertMemberSql, insertParams, (err) => {
          if (err) {
            console.log("Insert project member error:", err);

            return res.status(500).json({
              message: "เพิ่มสมาชิกโครงงานไม่สำเร็จ",
            });
          }

          // 6. เปลี่ยนสถานะ request
          const updateRequestSql = `
                  UPDATE project_requests
                  SET status = 'อนุมัติ'
                  WHERE id = ?
                `;

          db.query(updateRequestSql, [requestId], (err) => {
            if (err) {
              console.log("Update request status error:", err);

              return res.status(500).json({
                message: "อัปเดตสถานะคำขอไม่สำเร็จ",
              });
            }

            // 7. เพิ่มจำนวนสมาชิก
            const updateProjectSql = `
              UPDATE projects
              SET
                current_members = current_members + ?,
                status = CASE
                  WHEN source = 'student' THEN 'อนุมัติ'
                  ELSE status
                END
              WHERE id = ?
            `;

            db.query(
              updateProjectSql,
              [memberIds.length, request.project_id],
              (err) => {
                if (err) {
                  console.log("Update project member count error:", err);

                  return res.status(500).json({
                    message: "อัปเดตจำนวนสมาชิกไม่สำเร็จ",
                  });
                }

                // ==========================================
                // 8. สร้างเอกสารให้เจ้าหน้าที่
                // ==========================================

                const documentType =
                  request.source === "student"
                    ? "เสนอหัวข้อโครงงาน"
                    : "สมัครเข้าร่วมโครงงาน";

                const insertDocumentSql = `
  INSERT INTO approval_documents
  (
    request_id,
    project_id,
    student_id,
    advisor_id,
    document_type,
    document_code,
    approved_at,
    signature_image
  )
  VALUES (?, ?, ?, ?, ?, 'RE01', NOW(), ?)
`;

                db.query(
                  insertDocumentSql,
                  [
                    request.id,
                    request.project_id,
                    request.student_id,
                    request.advisor_id,
                    documentType,
                    request.advisor_signature,
                  ],
                  (documentErr) => {
                    if (documentErr) {
                      console.log(
                        "Create approval document error:",
                        documentErr,
                      );

                      return res.status(500).json({
                        message: "สร้างเอกสารสำหรับเจ้าหน้าที่ไม่สำเร็จ",
                      });
                    }

                    // ==========================================
                    // 9. แจ้งเตือนนิสิต
                    // ==========================================

                    const notificationValues = memberIds
                      .map(() => "(?, ?)")
                      .join(", ");

                    const notificationParams = memberIds.flatMap((userId) => [
                      userId,
                      `อาจารย์อนุมัติคำขอเข้าร่วมโครงงาน "${request.title}" ของคุณแล้ว`,
                    ]);

                    const notificationSql = `
                        INSERT INTO notifications
                              (
                                user_id,
                                message
                              )
                              VALUES ${notificationValues}
                            `;

                    db.query(
                      notificationSql,
                      notificationParams,
                      (notificationErr) => {
                        if (notificationErr) {
                          console.log("Notification error:", notificationErr);
                        }

                        res.json({
                          success: true,
                          message: "อนุมัติคำขอเรียบร้อยแล้ว",
                        });
                      },
                    );
                  },
                );
              },
            );
          });
        });
      },
    );
  });
});

// ==========================================
// ปฏิเสธคำขอเข้าร่วมโครงงาน
// ==========================================
app.post("/teacher/request/:requestId/reject", (req, res) => {
  const { requestId } = req.params;

  const { advisor_id, teacher_comment, suggestion, rejection_reason } =
    req.body;

  if (!rejection_reason || !rejection_reason.trim()) {
    return res.status(400).json({
      message: "กรุณาระบุเหตุผลการปฏิเสธ",
    });
  }

  const getRequestSql = `
  SELECT
    pr.id,
    pr.project_id,
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

  db.query(getRequestSql, [requestId, advisor_id], (err, results) => {
    if (err) {
      console.log("Get reject request error:", err);

      return res.status(500).json({
        message: "Database Error",
      });
    }

    if (results.length === 0) {
      return res.status(404).json({
        message: "ไม่พบคำขอ หรือคำขอนี้ไม่ใช่ของคุณ",
      });
    }

    const request = results[0];

    if (request.status !== "รอพิจารณา") {
      return res.status(400).json({
        message: "คำขอนี้ได้รับการพิจารณาแล้ว",
      });
    }

    const updateSql = `
  UPDATE project_requests
  SET
    status = 'ปฏิเสธ',
    teacher_comment = ?,
    suggestion = ?,
    rejection_reason = ?
  WHERE id = ?
        `;

    db.query(
      updateSql,
      [
        teacher_comment || null,
        suggestion || null,
        rejection_reason,
        requestId,
      ],
      (err) => {
        if (err) {
          console.log("Reject request error:", err);

          return res.status(500).json({
            message: "อัปเดตสถานะคำขอไม่สำเร็จ",
          });
        }

        // แจ้งเตือนนิสิต
        const notificationSql = `
              INSERT INTO notifications
              (
                user_id,
                message,
                request_id,
                project_id
              )
              VALUES (?, ?, ?, ?)
            `;

        db.query(
          notificationSql,
          [
            request.student_id,

            `อาจารย์ปฏิเสธคำขอโครงงาน "${request.title}" ของคุณ

            เหตุผลการปฏิเสธ: ${rejection_reason}

            ความคิดเห็น: ${teacher_comment || "-"}

            ข้อเสนอแนะ: ${suggestion || "-"}`,

            request.id,
            request.project_id,
          ],
          (notificationErr) => {
            if (notificationErr) {
              console.log("Reject notification error:", notificationErr);
            }

            res.json({
              success: true,
              message: "ปฏิเสธคำขอเรียบร้อยแล้ว",
            });
          },
        );
      },
    );
  });
});

// ==========================================
// นิสิตแก้ไขคำเสนอโครงงานและส่งพิจารณาใหม่
// ==========================================
app.put("/student/project-resubmit/:projectId/:requestId", (req, res) => {
  const { projectId, requestId } = req.params;

  const {
    student_id,

    title,
    advisor,
    advisor_id,
    major,

    project_type,
    max_members,

    description,
    objectives,
    skills,
    requirements,

    contact_type,
    contact_value,
    introduction,
  } = req.body;

  // ตรวจสอบก่อนว่าคำขอนี้เป็นของนิสิตจริง
  // และต้องถูกปฏิเสธมาก่อน
  const checkSql = `
      SELECT
        pr.id,
        pr.status,
        pr.student_id,
        p.id AS project_id,
        p.source
      FROM project_requests pr

      INNER JOIN projects p
        ON pr.project_id = p.id

      WHERE pr.id = ?
        AND p.id = ?
        AND pr.student_id = ?
        AND p.source = 'student'
      LIMIT 1
    `;

  db.query(checkSql, [requestId, projectId, student_id], (err, results) => {
    if (err) {
      console.log("Check resubmit error:", err);

      return res.status(500).json({
        message: "Database Error",
      });
    }

    if (results.length === 0) {
      return res.status(404).json({
        message: "ไม่พบคำเสนอโครงงานของคุณ",
      });
    }

    const oldRequest = results[0];

    if (oldRequest.status !== "ปฏิเสธ") {
      return res.status(400).json({
        message: "สามารถส่งใหม่ได้เฉพาะคำขอที่ถูกปฏิเสธ",
      });
    }

    // =========================
    // 1. แก้ข้อมูล project เดิม
    // =========================

    const updateProjectSql = `
          UPDATE projects
          SET
            title = ?,
            advisor = ?,
            advisor_id = ?,
            major = ?,
            project_type = ?,
            max_members = ?,
            description = ?,
            objectives = ?,
            skills = ?,
            requirements = ?,
            status = 'รออนุมัติ'
          WHERE id = ?
            AND source = 'student'
        `;

    db.query(
      updateProjectSql,
      [
        title,
        advisor,
        advisor_id,
        major,
        project_type,
        max_members,
        description,
        objectives,
        skills,
        requirements || "",
        projectId,
      ],
      (err) => {
        if (err) {
          console.log("Update resubmit project error:", err);

          return res.status(500).json({
            message: "แก้ไขข้อมูลโครงงานไม่สำเร็จ",
          });
        }

        // =========================
        // 2. เปลี่ยน request เดิมกลับมารอพิจารณา
        // =========================

        const updateRequestSql = `
              UPDATE project_requests
              SET
                contact_type = ?,
                contact_value = ?,
                introduction = ?,

                status = 'รอพิจารณา',

                teacher_comment = NULL,
                suggestion = NULL,
                rejection_reason = NULL,

                request_date = CURRENT_TIMESTAMP,
                decision_date = NULL
              WHERE id = ?
                AND student_id = ?
                AND project_id = ?
            `;

        db.query(
          updateRequestSql,
          [
            contact_type,
            contact_value,
            introduction,

            requestId,
            student_id,
            projectId,
          ],
          (err) => {
            if (err) {
              console.log("Update resubmit request error:", err);

              return res.status(500).json({
                message: "ส่งคำขอใหม่ไม่สำเร็จ",
              });
            }

            res.json({
              success: true,
              message: "แก้ไขและส่งให้อาจารย์พิจารณาใหม่เรียบร้อยแล้ว",
            });
          },
        );
      },
    );
  });
});

// ==========================================
// Dashboard เจ้าหน้าที่
// ==========================================

app.get("/staff/dashboard", (req, res) => {
  const summarySql = `
    SELECT
      COUNT(*) AS totalDocuments,

      SUM(
        CASE
          WHEN YEAR(created_at) = YEAR(CURDATE())
           AND MONTH(created_at) = MONTH(CURDATE())
          THEN 1
          ELSE 0
        END
      ) AS thisMonth,

      SUM(
        CASE
          WHEN DATE(created_at) = CURDATE()
          THEN 1
          ELSE 0
        END
      ) AS today

    FROM approval_documents
  `;

  const latestSql = `
    SELECT
      ad.id,
      ad.document_type,
      ad.document_code,
      ad.approved_at,
      ad.download_status,
      ad.pdf_path,

      p.title AS project_title,
      p.academic_year,

      advisor.name AS advisor_name,

      student.name AS student_name,
      student.username AS student_username

    FROM approval_documents ad

    INNER JOIN projects p
      ON ad.project_id = p.id

    INNER JOIN users advisor
      ON ad.advisor_id = advisor.id

    INNER JOIN users student
      ON ad.student_id = student.id

    ORDER BY ad.approved_at DESC

    LIMIT 5
  `;

  db.query(summarySql, (summaryErr, summaryResult) => {
    if (summaryErr) {
      console.log("Staff dashboard summary error:", summaryErr);

      return res.status(500).json({
        message: "Database Error",
      });
    }

    db.query(latestSql, (latestErr, latestResult) => {
      if (latestErr) {
        console.log("Staff latest documents error:", latestErr);

        return res.status(500).json({
          message: "Database Error",
        });
      }

      const summary = summaryResult[0];

      res.json({
        totalDocuments: Number(summary.totalDocuments) || 0,
        thisMonth: Number(summary.thisMonth) || 0,
        today: Number(summary.today) || 0,

        latestDocuments: latestResult,
      });
    });
  });
});

// ==========================================
// รายละเอียดเอกสารสำหรับเจ้าหน้าที่
// ==========================================

app.get("/staff/documents/:documentId", (req, res) => {
  const { documentId } = req.params;

  const documentSql = `
  SELECT
    ad.id,
    ad.request_id,
    ad.project_id,
    ad.student_id,
    ad.advisor_id,
    ad.document_type,
    ad.document_code,
    ad.approved_at,
    ad.signature_image,
    ad.pdf_path,
    ad.download_status,
    ad.downloaded_at,

    -- ข้อมูลโครงงาน
    p.title AS project_title,
    p.project_type,
    p.major AS project_major,
    p.academic_year,

    -- ข้อมูลนิสิตผู้ยื่นคำขอ
    student.username AS student_username,
    student.name AS student_name,
    student.major AS student_major,
    student.phone AS student_phone,
    student.email AS student_email,
    student.signature_image AS student_signature,

    -- ข้อมูลจากคำขอ
    pr.contact_type,
    pr.contact_value,
    pr.introduction,

    -- ข้อมูลอาจารย์
    advisor.name AS advisor_name,
    advisor.signature_image AS advisor_signature

  FROM approval_documents ad

  INNER JOIN projects p
    ON ad.project_id = p.id

  INNER JOIN project_requests pr
    ON ad.request_id = pr.id

  INNER JOIN users student
    ON ad.student_id = student.id

  INNER JOIN users advisor
    ON ad.advisor_id = advisor.id

  WHERE ad.id = ?
`;

  db.query(documentSql, [documentId], (err, documentResult) => {
    if (err) {
      console.log("Get staff document detail error:", err);

      return res.status(500).json({
        message: "Database Error",
      });
    }

    if (documentResult.length === 0) {
      return res.status(404).json({
        message: "ไม่พบเอกสาร",
      });
    }

    const document = documentResult[0];

    // ดึงสมาชิกของโครงงาน
    const membersSql = `
      SELECT
        u.id,
        u.username,
        u.name,
        u.major,
        u.signature_image

      FROM project_members pm

      INNER JOIN users u
        ON pm.user_id = u.id

      WHERE pm.project_id = ?

      ORDER BY pm.id ASC
    `;

    db.query(membersSql, [document.project_id], (memberErr, members) => {
      if (memberErr) {
        console.log("Get document members error:", memberErr);

        return res.status(500).json({
          message: "Database Error",
        });
      }

      document.members = members;

      res.json(document);
    });
  });
});

// ==========================================
// ทดสอบใส่ข้อมูลจริงลง PDF
// ==========================================

app.get("/staff/documents/:documentId/generate-pdf", (req, res) => {
  const documentId = req.params.documentId;
  const sql = `
    SELECT
      ad.id,
        ad.document_type,
        ad.document_code,
        ad.approved_at,

        p.academic_year,

      student.prefix AS student_prefix,
      student.name AS student_name,
      student.username AS student_username,
      student.major AS student_major,
      student.phone AS student_phone,
      student.email AS student_email,
      student.signature_image AS student_signature,

      pr.introduction,

      advisor.name AS advisor_name,
      advisor.signature_image AS advisor_signature

    FROM approval_documents ad

    INNER JOIN projects p
      ON ad.project_id = p.id

    INNER JOIN users student
      ON ad.student_id = student.id

    INNER JOIN users advisor
      ON ad.advisor_id = advisor.id

    INNER JOIN project_requests pr
      ON ad.request_id = pr.id

    WHERE ad.id = ?
  `;

  db.query(sql, [documentId], async (err, results) => {
    if (err) {
      console.log("Get PDF data error:", err);

      return res.status(500).json({
        message: "Database Error",
      });
    }

    if (results.length === 0) {
      return res.status(404).json({
        message: "ไม่พบเอกสาร",
      });
    }

    try {
      const document = results[0];

      /* เปิด PDF ต้นฉบับ */
      const templatePath = path.join(
        __dirname,
        "templates",
        "RE01-template.pdf",
      );

      const templateBytes = fs.readFileSync(templatePath);

      const pdfDoc = await PDFDocument.load(templateBytes);

      pdfDoc.registerFontkit(fontkit);

      /* Font ภาษาไทย */
      const fontPath = path.join(__dirname, "fonts", "ThaiFont.ttf");

      const fontBytes = fs.readFileSync(fontPath);

      const thaiFont = await pdfDoc.embedFont(fontBytes);

      const page = pdfDoc.getPages()[0];

      const wrapText = (text, font, size, maxWidth) => {
        const lines = [];
        let currentLine = "";

        const segmenter = new Intl.Segmenter("th", { granularity: "word" });
        const words = [...segmenter.segment(text)].map((item) => item.segment);

        for (const word of words) {
          const testLine = currentLine + word;
          const width = font.widthOfTextAtSize(testLine, size);

          if (width > maxWidth && currentLine) {
            lines.push(currentLine.trim());
            currentLine = word;
          } else {
            currentLine = testLine;
          }
        }

        if (currentLine.trim()) {
          lines.push(currentLine.trim());
        }

        return lines;
      };

      /* =========================
         เตรียมข้อมูลจริง
      ========================= */

      const approvedDate = new Date(document.approved_at);

      const thaiDate = approvedDate.toLocaleDateString("th-TH", {
        timeZone: "Asia/Bangkok",
        day: "numeric",
        month: "short",
        year: "numeric",
      });

      const subject =
        document.document_type === "เสนอหัวข้อโครงงาน"
          ? "ขอเสนอหัวข้อโครงงาน"
          : "ขอสมัครเข้าร่วมโครงงาน";
      const facultyName = "วิทยาการสารสนเทศ";

      const majorMap = {
        IT: "เทคโนโลยีสารสนเทศ",
        CS: "วิทยาการคอมพิวเตอร์",
        SE: "วิศวกรรมซอฟต์แวร์",
      };

      const majorName =
        majorMap[document.student_major] || document.student_major || "-";

      /* =========================
         ใส่ข้อมูลจริงลงแบบ
      ========================= */

      // วันที่
      page.drawText(thaiDate, {
        x: 115, // ขยับขวา
        y: 680, // ขยับลง
        size: 11.5,
        font: thaiFont,
      });

      // เรื่อง
      page.drawText(subject, {
        x: 125,
        y: 662,
        size: 11.5,
        font: thaiFont,
      });

      // เรียน
      page.drawText(document.advisor_name || "", {
        x: 115,
        y: 642,
        size: 11.5,
        font: thaiFont,
      });

      // ชื่อนิสิต
      page.drawText(
        `${document.student_prefix || ""}${document.student_name || ""}`,
        {
          x: 115,
          y: 624,
          size: 11.5,
          font: thaiFont,
        },
      );

      // รหัสประจำตัวนิสิต
      const studentId = String(document.student_username || "");

      const studentIdStartX = 397;
      const studentIdY = 625;
      const boxWidth = 21.2;

      for (let i = 0; i < studentId.length; i++) {
        page.drawText(studentId[i], {
          x: studentIdStartX + i * boxWidth,
          y: studentIdY,
          size: 13,
          font: thaiFont,
        });
      }

      // คณะ
      page.drawText(facultyName, {
        x: 130,
        y: 605,
        size: 11.5,
        font: thaiFont,
      });

      // สาขาวิชา
      page.drawText(majorName, {
        x: 390,
        y: 605,
        size: 11.5,
        font: thaiFont,
      });

      // หมายเลขโทรศัพท์
      page.drawText(document.student_phone || "-", {
        x: 205,
        y: 586,
        size: 11.5,
        font: thaiFont,
      });

      // E-mail
      page.drawText(document.student_email || "-", {
        x: 390,
        y: 586,
        size: 10.5,
        font: thaiFont,
      });

      // ==========================================
      // เหตุผลประกอบคำร้อง
      // ==========================================

      const reasonText = (document.introduction || "-")
        // ลบช่องว่างแฝงที่อาจติดมากับข้อความ
        .replace(/[\u200B-\u200D\uFEFF]/g, "")
        // ช่องว่างหลายตัวให้เหลือแค่ตัวเดียว
        .replace(/\s+/g, " ")
        .trim();

      const wrapThaiText = (text, font, size, maxWidth) => {
        const segmenter = new Intl.Segmenter("th", {
          granularity: "word",
        });

        const words = Array.from(
          segmenter.segment(text),
          (item) => item.segment,
        );

        const lines = [];
        let currentLine = "";

        for (const word of words) {
          const testLine = currentLine + word;

          const textWidth = font.widthOfTextAtSize(testLine, size);

          if (textWidth <= maxWidth) {
            currentLine = testLine;
          } else {
            if (currentLine.trim()) {
              lines.push(currentLine.trim());
            }

            currentLine = word.trimStart();
          }
        }

        if (currentLine.trim()) {
          lines.push(currentLine.trim());
        }

        return lines;
      };

      const reasonFontSize = 10.5;

      const reasonLines = wrapThaiText(
        reasonText,
        thaiFont,
        reasonFontSize,
        390,
      );

      reasonLines.slice(0, 6).forEach((line, index) => {
        page.drawText(line, {
          x: index === 0 ? 65 : 55,
          y: 535 - index * 20,
          size: reasonFontSize,
          font: thaiFont,
        });
      });

      // ==========================================
      // ลายเซ็นนิสิต
      // ==========================================

      const studentSignaturePath = getAssetFilePath(document.student_signature);

      if (studentSignaturePath && fs.existsSync(studentSignaturePath)) {
        const signatureBytes = fs.readFileSync(studentSignaturePath);

        // ตัดพื้นที่ว่างรอบลายเซ็นอัตโนมัติ
        const trimmedSignatureBytes = await sharp(signatureBytes)
          .trim()
          .png()
          .toBuffer();

        const signatureImage = await pdfDoc.embedPng(trimmedSignatureBytes);

        // ตอนนี้ขยายได้โดยไม่บีบรูป
        const signatureSize = signatureImage.scaleToFit(125, 38);

        page.drawImage(signatureImage, {
          x: 400,
          y: 410,
          width: signatureSize.width,
          height: signatureSize.height,
        });
      }

      // ==========================================
      // ความเห็นอาจารย์ที่ปรึกษา
      // ==========================================

      const advisorCommentY = 335;
      const advisorCommentSize = 11.5;

      const firstText = "ยินดีรับเป็นอาจารย์ที่";
      const secondText = "ปรึกษา";

      // ขอบเขตช่องความเห็นอาจารย์ฝั่งซ้าย
      const advisorBoxLeft = 20;
      const advisorBoxWidth = 285;

      // คำนวณความกว้างข้อความ
      const firstTextWidth = thaiFont.widthOfTextAtSize(
        firstText,
        advisorCommentSize,
      );

      const secondTextWidth = thaiFont.widthOfTextAtSize(
        secondText,
        advisorCommentSize,
      );

      // รวมความกว้างทั้งหมด
      const totalTextWidth = firstTextWidth + secondTextWidth - 3;

      // หา x เริ่มต้นให้อยู่กลางกล่อง
      const advisorCommentX =
        advisorBoxLeft + (advisorBoxWidth - totalTextWidth) / 2;

      // วาดข้อความ
      page.drawText(firstText, {
        x: advisorCommentX,
        y: advisorCommentY,
        size: advisorCommentSize,
        font: thaiFont,
      });

      page.drawText(secondText, {
        x: advisorCommentX + firstTextWidth,
        y: advisorCommentY,
        size: advisorCommentSize,
        font: thaiFont,
      });
      // ==========================================
      // ลายเซ็นอาจารย์
      // ==========================================

      const advisorSignaturePath = getAssetFilePath(document.advisor_signature);

      if (advisorSignaturePath && fs.existsSync(advisorSignaturePath)) {
        const advisorSignatureBytes = fs.readFileSync(advisorSignaturePath);

        // ตัดขอบว่างรอบลายเซ็น
        const trimmedAdvisorSignature = await sharp(advisorSignatureBytes)
          .trim()
          .png()
          .toBuffer();

        const advisorSignatureImage = await pdfDoc.embedPng(
          trimmedAdvisorSignature,
        );

        const advisorSignatureSize = advisorSignatureImage.scaleToFit(82, 22);

        page.drawImage(advisorSignatureImage, {
          x: 198,
          y: 289,
          width: advisorSignatureSize.width,
          height: advisorSignatureSize.height,
        });

        page.drawText(thaiDate, {
          x: 200, // ขยับขวาจากเดิมนิดเดียว
          y: 268, // ยกขึ้นอีกนิด
          size: 10.5,
          font: thaiFont,
        });
      }

      /* ==========================================
   บันทึก PDF
========================================== */

      const pdfBytes = await pdfDoc.save();

      // ปีการศึกษา เช่น "2569/1" → เอาเฉพาะ "2569"
      const academicYear = String(document.academic_year || "unknown").split(
        "/",
      )[0];

      // เลขเอกสาร เช่น id = 1 → 001
      const documentNumber = String(document.id).padStart(3, "0");

      // รหัสเอกสาร เช่น RE01
      const documentCode = document.document_code || "RE01";

      // ชื่อไฟล์
      const fileName = `${documentCode}-${academicYear}-${documentNumber}.pdf`;

      // path ที่เก็บไฟล์จริง
      const outputPath = path.join(__dirname, "generated", fileName);

      // path ที่เก็บลงฐานข้อมูล
      const pdfPath = `/generated/${fileName}`;

      // เขียนไฟล์ PDF
      fs.writeFileSync(outputPath, pdfBytes);

      // บันทึก path ลง approval_documents
      const updatePdfSql = `
  UPDATE approval_documents
  SET pdf_path = ?
  WHERE id = ?
`;

      db.query(updatePdfSql, [pdfPath, documentId], (updateErr) => {
        if (updateErr) {
          console.log("Update PDF path error:", updateErr);

          return res.status(500).json({
            success: false,
            message: "สร้าง PDF สำเร็จ แต่บันทึก path ไม่สำเร็จ",
          });
        }

        res.json({
          success: true,
          message: "สร้างและบันทึก PDF เรียบร้อยแล้ว",
          pdf_path: pdfPath,
          file_name: fileName,
        });
      });
    } catch (error) {
      console.log("Test real PDF error:", error);

      res.status(500).json({
        success: false,
        message: "สร้าง PDF ไม่สำเร็จ",
        error: error.message,
      });
    }
  });
});

// ==========================================
// เจ้าหน้าที่ดาวน์โหลดเอกสาร PDF
// ==========================================

app.get("/staff/documents/:documentId/download", (req, res) => {
  const documentId = req.params.documentId;

  const sql = `
    SELECT
      id,
      pdf_path
    FROM approval_documents
    WHERE id = ?
  `;

  db.query(sql, [documentId], (err, results) => {
    if (err) {
      console.log("Get PDF for download error:", err);

      return res.status(500).json({
        message: "Database Error",
      });
    }

    if (results.length === 0) {
      return res.status(404).json({
        message: "ไม่พบเอกสาร",
      });
    }

    const document = results[0];

    if (!document.pdf_path) {
      return res.status(404).json({
        message: "ยังไม่มีไฟล์ PDF สำหรับเอกสารนี้",
      });
    }

    // เช่น /generated/RE01-2569-001.pdf
    // เอาเฉพาะชื่อไฟล์
    const fileName = path.basename(document.pdf_path);

    const filePath = path.join(
      __dirname,
      "generated",
      fileName,
    );

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({
        message: "ไม่พบไฟล์ PDF ในระบบ",
      });
    }

    // ส่งไฟล์ให้ browser ดาวน์โหลด
    res.download(filePath, fileName, (downloadErr) => {
      if (downloadErr) {
        console.log("Download PDF error:", downloadErr);
        return;
      }

      // ดาวน์โหลดสำเร็จแล้ว → อัปเดตสถานะ
      const updateSql = `
        UPDATE approval_documents
        SET
          download_status = 'ดาวน์โหลดแล้ว',
          downloaded_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `;

      db.query(updateSql, [documentId], (updateErr) => {
        if (updateErr) {
          console.log(
            "Update download status error:",
            updateErr,
          );
          return;
        }

        console.log(
          `Document ${documentId} downloaded successfully`,
        );
      });
    });
  });
});

app.listen(5000, () => {
  console.log("Server running on port 5000");
});
