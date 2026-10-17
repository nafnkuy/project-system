const express = require("express");
const cors = require("cors");
const path = require("path");
const fs = require("fs");
const sharp = require("sharp");
const wordcut = require("wordcut");

const { PDFDocument } = require("pdf-lib");
const fontkit = require("@pdf-lib/fontkit");

wordcut.init();

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

// ==========================================
// ข้อมูลส่วนตัวเจ้าหน้าที่
// ==========================================

app.get("/staff/profile/:staffId", (req, res) => {
  const { staffId } = req.params;

  const sql = `
    SELECT
      id,
      username,
      prefix,
      name,
      role,
      profile_image,
      phone,
      email
    FROM users
    WHERE id = ?
      AND role = 'staff'
  `;

  db.query(sql, [staffId], (err, results) => {
    if (err) {
      console.log("Get staff profile error:", err);

      return res.status(500).json({
        message: "Database Error",
      });
    }

    if (results.length === 0) {
      return res.status(404).json({
        message: "ไม่พบข้อมูลเจ้าหน้าที่",
      });
    }

    res.json(results[0]);
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

    /* ==========================================
         1. สร้างคำขอ
      ========================================== */

    const insertSql = `
        INSERT INTO project_requests
        (
          project_id,
          student_id,
          contact_type,
          contact_value,
          introduction,
          status
        )
        VALUES (?, ?, ?, ?, ?, 'รอพิจารณา')
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

        const requestId = result.insertId;

        /* ==========================================
             2. แจ้งเตือนอาจารย์ที่ปรึกษา
          ========================================== */

        const notificationSql = `
            INSERT INTO notifications
            (
              user_id,
              message,
              request_id,
              project_id
            )

            SELECT
              p.advisor_id,

              CASE
                WHEN p.source = 'student'
                THEN CONCAT(
                  s.name,
                  ' ส่งคำเสนอหัวข้อโครงงาน "',
                  p.title,
                  '" มาให้คุณพิจารณา'
                )

                ELSE CONCAT(
                  s.name,
                  ' ส่งคำขอสมัครเข้าร่วมโครงงาน "',
                  p.title,
                  '" มาให้คุณพิจารณา'
                )
              END,

              ?,
              p.id

            FROM projects p

            INNER JOIN users s
              ON s.id = ?

            WHERE p.id = ?
              AND p.advisor_id IS NOT NULL
          `;

        db.query(
          notificationSql,
          [requestId, student_id, project_id],
          (notificationErr) => {
            if (notificationErr) {
              console.log("Teacher notification error:", notificationErr);
            }

            res.json({
              success: true,
              id: requestId,
            });
          },
        );
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
    status,
    suggestion
  FROM project_requests
  WHERE project_id = ?
    AND student_id = ?
    AND status != 'ถูกยกเลิก'
  ORDER BY id DESC
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

// ==========================================
// โครงงานของฉัน
// ==========================================

app.get("/student/my-project/:studentId", (req, res) => {
  const { studentId } = req.params;

  const sql = `
    SELECT
      pr.id AS request_id,
      pr.project_id,
      pr.student_id,

      pr.status AS request_status,
      pr.request_date,
      pr.decision_date,
      pr.suggestion,
      pr.rejection_reason,

      p.title,
      p.project_type,
      p.academic_year,
      p.source,

      p.current_members,
      p.max_members,
      p.status AS project_status,

      COALESCE(
        advisor.name,
        p.advisor
      ) AS advisor_name

    FROM project_requests pr

    INNER JOIN projects p
      ON pr.project_id = p.id

    LEFT JOIN users advisor
      ON p.advisor_id = advisor.id

    WHERE pr.status != 'ถูกยกเลิก'

      AND (
        pr.student_id = ?

        OR

        EXISTS (
          SELECT 1

          FROM project_invitations pi

          WHERE pi.project_id = pr.project_id
            AND pi.sender_id = pr.student_id
            AND pi.receiver_id = ?
            AND pi.status = 'ตอบรับ'
        )
      )

    ORDER BY
      pr.request_date DESC,
      pr.id DESC

    LIMIT 1
  `;

  db.query(sql, [studentId, studentId], (err, results) => {
    if (err) {
      console.log("Get student my project error:", err);

      return res.status(500).json({
        message: "Database Error",
      });
    }

    if (results.length === 0) {
      return res.json({
        request: null,
      });
    }

    const request = results[0];

    // ==========================================
    // ดึงสมาชิกในโครงงาน
    // หลังอาจารย์อนุมัติแล้ว
    // ==========================================

    const memberSql = `
        SELECT
          u.id,
          u.username,
          u.name

        FROM project_members pm

        INNER JOIN users u
          ON pm.user_id = u.id

        WHERE pm.project_id = ?

        ORDER BY pm.id ASC
      `;

    db.query(memberSql, [request.project_id], (memberErr, members) => {
      if (memberErr) {
        console.log("Get project members error:", memberErr);

        return res.status(500).json({
          message: "Database Error",
        });
      }

      request.members = members;

      res.json({
        request,
      });
    });
  });
});

// ==========================================
// รายละเอียดคำขอของนิสิต
// ==========================================

app.get("/student/request-detail/:requestId/:studentId", (req, res) => {
  const { requestId, studentId } = req.params;

  const sql = `
    SELECT
      pr.id AS request_id,
      pr.project_id,
      pr.student_id,

      pr.status AS request_status,
      pr.request_date,
      pr.decision_date,
      pr.suggestion,
      pr.rejection_reason,
      pr.introduction,

      p.title,
      p.project_type,
      p.major,
      p.academic_year,
      p.description,
      p.objectives,
      p.skills,
      p.requirements,
      p.source,
      p.max_members,

      advisor.id AS advisor_id,
      advisor.name AS advisor_name

    FROM project_requests pr

    INNER JOIN projects p
      ON pr.project_id = p.id

    LEFT JOIN users advisor
      ON p.advisor_id = advisor.id

    WHERE pr.id = ?

      AND (
        pr.student_id = ?

        OR EXISTS (
          SELECT 1
          FROM project_invitations pi
          WHERE pi.project_id = pr.project_id
            AND pi.receiver_id = ?
            AND pi.status = 'ตอบรับ'
        )
      )

    LIMIT 1
  `;

  db.query(sql, [requestId, studentId, studentId], (err, results) => {
    if (err) {
      console.log("Get student request detail error:", err);

      return res.status(500).json({
        message: "Database Error",
      });
    }

    if (results.length === 0) {
      return res.status(404).json({
        message: "ไม่พบคำขอ",
      });
    }

    const request = results[0];

    // ==========================================
    // สมาชิกของคำขอ
    // ==========================================

    const membersSql = `
        SELECT DISTINCT
          u.id,
          u.username,
          u.name

        FROM users u

        WHERE u.id = ?

        OR u.id IN (
          SELECT pi.receiver_id
          FROM project_invitations pi

          WHERE pi.project_id = ?
            AND pi.sender_id = ?
            AND pi.status = 'ตอบรับ'
        )

        ORDER BY u.id ASC
      `;

    db.query(
      membersSql,
      [request.student_id, request.project_id, request.student_id],
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
  const { name = "" } = req.query;

  const sql = `
    SELECT
      u.id,
      u.name,
      u.major,

      /* ==========================================
         จำนวนนิสิตที่อาจารย์รับแล้วจริง ๆ
      ========================================== */

      (
        SELECT COUNT(DISTINCT pm.user_id)

        FROM project_members pm

        INNER JOIN projects p
          ON pm.project_id = p.id

        WHERE p.advisor_id = u.id

      ) AS accepted_students,


      /* ==========================================
         จำนวนสูงสุดที่อาจารย์รับได้
         ให้ตรงกับ TeacherHome
      ========================================== */

      14 AS total_capacity,


      /* ==========================================
         จำนวนที่ยังรับได้
      ========================================== */

      GREATEST(
        14 - (
          SELECT COUNT(DISTINCT pm.user_id)

          FROM project_members pm

          INNER JOIN projects p
            ON pm.project_id = p.id

          WHERE p.advisor_id = u.id
        ),
        0
      ) AS remaining_capacity,


      /* ==========================================
         สถานะการรับนิสิต
      ========================================== */

      CASE

        WHEN (
          SELECT COUNT(DISTINCT pm.user_id)

          FROM project_members pm

          INNER JOIN projects p
            ON pm.project_id = p.id

          WHERE p.advisor_id = u.id
        ) >= 14

          THEN 'เต็ม'


        WHEN 14 - (
          SELECT COUNT(DISTINCT pm.user_id)

          FROM project_members pm

          INNER JOIN projects p
            ON pm.project_id = p.id

          WHERE p.advisor_id = u.id
        ) <= 2

          THEN 'ใกล้เต็ม'


        ELSE 'เปิดรับ'

      END AS advisor_status


    FROM users u

    WHERE u.role = 'teacher'
      AND u.name LIKE ?

    ORDER BY u.id ASC
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

// ==========================================
// รายละเอียดอาจารย์
// ==========================================

app.get("/teachers/:teacherId", (req, res) => {
  const { teacherId } = req.params;

  // ==========================================
  // 1. ดึงข้อมูลอาจารย์
  // ==========================================

  const teacherSql = `
    SELECT
      u.id,
      u.username,
      u.name,
      u.major,
      u.phone,
      u.email,
      u.profile_image,

      tp.english_name,
      tp.position,
      tp.office,
      tp.office_phone,
      tp.expertise,
      tp.max_capacity

    FROM users u

    LEFT JOIN teacher_profiles tp
      ON u.id = tp.user_id

    WHERE u.id = ?
      AND u.role = 'teacher'
  `;

  db.query(teacherSql, [teacherId], (teacherErr, teacherResult) => {
    if (teacherErr) {
      console.log("Get teacher detail error:", teacherErr);

      return res.status(500).json({
        message: "Database Error",
      });
    }

    if (teacherResult.length === 0) {
      return res.status(404).json({
        message: "ไม่พบข้อมูลอาจารย์",
      });
    }

    const teacher = teacherResult[0];

    // ==========================================
    // 2. ดึงหัวข้อโครงงานของอาจารย์
    // ==========================================

    const projectSql = `
  SELECT
    id,
    title,
    status,
    project_type,
    max_members,
    current_members,
    academic_year,
    source,
    visibility

  FROM projects

  WHERE advisor_id = ?
    AND source = 'teacher'
    AND visibility = 'แสดง'

  ORDER BY id DESC
`;

    db.query(projectSql, [teacherId], (projectErr, projects) => {
      if (projectErr) {
        console.log("Get teacher projects error:", projectErr);

        return res.status(500).json({
          message: "Database Error",
        });
      }

      // ==========================================
      // 3. คำนวณจำนวนโครงงาน
      // ==========================================

      const currentProjects = projects.length;

      const maxCapacity = Number(teacher.max_capacity) || 0;

      const remainingCapacity = Math.max(maxCapacity - currentProjects, 0);

      // ==========================================
      // 4. คำนวณสถานะ
      // ==========================================

      let advisorStatus = "เปิดรับ";

      if (remainingCapacity <= 0) {
        advisorStatus = "เต็ม";
      } else if (remainingCapacity <= 2) {
        advisorStatus = "ใกล้เต็ม";
      }

      // ==========================================
      // 5. แปลง expertise
      // Database Technology|Web Technology
      // เป็น Array
      // ==========================================

      const expertise = teacher.expertise
        ? teacher.expertise
            .split("|")
            .map((item) => item.trim())
            .filter(Boolean)
        : [];

      // ==========================================
      // RESPONSE
      // ==========================================

      res.json({
        id: teacher.id,
        username: teacher.username,

        name: teacher.name,
        english_name: teacher.english_name,

        position: teacher.position,

        major: teacher.major,

        phone: teacher.phone,
        email: teacher.email,

        office: teacher.office,
        office_phone: teacher.office_phone,

        profile_image: teacher.profile_image,

        expertise,

        current_projects: currentProjects,
        max_capacity: maxCapacity,
        remaining_capacity: remainingCapacity,

        advisor_status: advisorStatus,

        projects,
      });
    });
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
  pr.status,
  pr.resubmitted_at

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

// ==========================================
// ประวัติการพิจารณาของอาจารย์
// ==========================================

app.get("/teacher/decision-history/:advisorId", (req, res) => {
  const { advisorId } = req.params;

  const sql = `
    SELECT
      pr.id,
      pr.project_id,
      pr.student_id,
      pr.status,
      pr.decision_date,

      p.title,
      p.source,

      student.username AS student_username,
      student.name AS student_name

    FROM project_requests pr

    INNER JOIN projects p
      ON pr.project_id = p.id

    INNER JOIN users student
      ON pr.student_id = student.id

    WHERE p.advisor_id = ?
      AND pr.status IN (
        'อนุมัติ',
        'ต้องแก้ไข',
        'ปฏิเสธ'
      )
      AND pr.decision_date IS NOT NULL

    ORDER BY
      pr.decision_date DESC,
      pr.id DESC
  `;

  db.query(sql, [advisorId], (err, results) => {
    if (err) {
      console.log("Get teacher decision history error:", err);

      return res.status(500).json({
        message: "Database Error",
      });
    }

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
      pi.id,
      pi.project_id,
      pi.sender_id,
      pi.receiver_id,
      pi.status,

      receiver.username AS receiver_username,
      receiver.name AS receiver_name,
      receiver.major AS receiver_major

    FROM project_invitations pi

    INNER JOIN users receiver
      ON pi.receiver_id = receiver.id

    WHERE pi.project_id = ?
      AND pi.sender_id = ?
      AND pi.status = 'ตอบรับ'

    ORDER BY pi.created_at DESC
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
        message: "ไม่พบสมาชิกคนที่ 2",
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
  is_read,
  request_id,
  project_id,
  document_id,
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
// อ่านการแจ้งเตือน
// ==========================================

app.put("/notifications/:notificationId/read", (req, res) => {
  const { notificationId } = req.params;

  const sql = `
    UPDATE notifications
    SET is_read = 1
    WHERE id = ?
  `;

  db.query(sql, [notificationId], (err) => {
    if (err) {
      console.log("Mark notification read error:", err);

      return res.status(500).json({
        message: "Database Error",
      });
    }

    res.json({
      success: true,
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
        pr.resubmitted_at,

        pr.suggestion,
        pr.rejection_reason,
        pr.decision_date,

        -- ข้อมูลนิสิต
        student.username AS student_username,
        student.name AS student_name,
        student.major AS student_major,

        -- ข้อมูลโครงงาน
        p.title,
        p.advisor_id,
        p.source,
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
    u.major,
    u.email,
    u.phone
  FROM users u
  WHERE u.id = ?

  UNION

  SELECT
    u.id,
    u.username,
    u.name,
    u.major,
    u.email,
    u.phone
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
            SET
              status = 'อนุมัติ',
              decision_date = NOW()
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
                  WHEN source = 'student'
                    THEN 'อนุมัติ'

                  WHEN current_members + ? >= max_members
                    THEN 'ปิดรับ'

                  WHEN max_members - (current_members + ?) = 1
                    THEN 'ใกล้เต็ม'

                  ELSE 'เปิดรับ'
                END

              WHERE id = ?
            `;

            db.query(
              updateProjectSql,
              [
                memberIds.length,
                memberIds.length,
                memberIds.length,
                request.project_id,
              ],
              async (err) => {
                if (err) {
                  console.log("Update project member count error:", err);

                  return res.status(500).json({
                    message: "อัปเดตจำนวนสมาชิกไม่สำเร็จ",
                  });
                }

                // ==========================================
                // 8. สร้างเอกสารให้เจ้าหน้าที่
                //    สมาชิก 1 คน = เอกสาร 1 ใบ
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

                try {
                  // สร้างเอกสารให้สมาชิกทุกคน
                  for (const studentId of memberIds) {
                    const approvalDocumentId = await new Promise(
                      (resolve, reject) => {
                        db.query(
                          insertDocumentSql,
                          [
                            request.id,
                            request.project_id,

                            // ตรงนี้สำคัญ
                            // ใช้นิสิตทีละคนจาก memberIds
                            studentId,

                            request.advisor_id,
                            documentType,
                            request.advisor_signature,
                          ],
                          (documentErr, documentResult) => {
                            if (documentErr) {
                              reject(documentErr);
                              return;
                            }

                            resolve(documentResult.insertId);
                          },
                        );
                      },
                    );

                    console.log(
                      "สร้างเอกสารให้นิสิต:",
                      studentId,
                      "documentId:",
                      approvalDocumentId,
                    );

                    // ==========================================
                    // 8.1 สร้าง PDF ของนิสิตคนนี้
                    // ==========================================

                    try {
                      const pdfResponse = await fetch(
                        `http://localhost:5000/staff/documents/${approvalDocumentId}/generate-pdf`,
                      );

                      const pdfResult = await pdfResponse.json();

                      if (!pdfResponse.ok) {
                        console.log("Auto generate PDF failed:", pdfResult);
                      } else {
                        console.log("Auto PDF created:", pdfResult.pdf_path);
                      }
                    } catch (pdfError) {
                      console.log("Auto generate PDF request error:", pdfError);
                    }

                    // ==========================================
                    // แจ้งเตือนเจ้าหน้าที่สำหรับเอกสารใบนี้
                    // ==========================================

                    const getStaffSql = `
  SELECT id
  FROM users
  WHERE role = 'staff'
`;

                    const staffResults = await new Promise(
                      (resolve, reject) => {
                        db.query(getStaffSql, (staffErr, results) => {
                          if (staffErr) {
                            reject(staffErr);
                            return;
                          }

                          resolve(results);
                        });
                      },
                    );

                    if (staffResults.length > 0) {
                      const staffValues = staffResults
                        .map(() => "(?, ?, ?, ?, ?)")
                        .join(", ");

                      const staffParams = staffResults.flatMap((staff) => [
                        staff.id,

                        `${request.advisor_name || "อาจารย์"} อนุมัติและลงนามเอกสาร "${request.title}"`,

                        request.id,
                        request.project_id,
                        approvalDocumentId,
                      ]);

                      const staffNotificationSql = `
    INSERT INTO notifications
    (
      user_id,
      message,
      request_id,
      project_id,
      document_id
    )
    VALUES ${staffValues}
  `;

                      await new Promise((resolve, reject) => {
                        db.query(
                          staffNotificationSql,
                          staffParams,
                          (staffNotificationErr) => {
                            if (staffNotificationErr) {
                              reject(staffNotificationErr);
                              return;
                            }

                            resolve();
                          },
                        );
                      });
                    }
                  }

                  // ==========================================
                  // 9. แจ้งเตือนนิสิตทุกคน
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
                } catch (documentErr) {
                  console.log("Create approval documents error:", documentErr);

                  return res.status(500).json({
                    message: "สร้างเอกสารสำหรับเจ้าหน้าที่ไม่สำเร็จ",
                  });
                }
              },
            );
          });
        });
      },
    );
  });
});

// ==========================================
// ส่งคำขอกลับให้นิสิตแก้ไข
// ==========================================
app.post("/teacher/request/:requestId/revision", (req, res) => {
  const { requestId } = req.params;
  const { advisor_id, suggestion } = req.body;

  if (!suggestion || !suggestion.trim()) {
    return res.status(400).json({
      message: "กรุณาระบุสิ่งที่นิสิตต้องแก้ไข",
    });
  }

  const getRequestSql = `
    SELECT
      pr.id,
      pr.project_id,
      pr.student_id,
      pr.status,
      p.title,
      p.source

    FROM project_requests pr

    INNER JOIN projects p
      ON pr.project_id = p.id

    WHERE pr.id = ?
      AND p.advisor_id = ?
      AND p.source IN ('teacher', 'student')
  `;

  db.query(getRequestSql, [requestId, advisor_id], (err, results) => {
    if (err) {
      console.log("Get revision request error:", err);

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
          status = 'ต้องแก้ไข',
          suggestion = ?,
          rejection_reason = NULL,
          teacher_comment = NULL,
          decision_date = NOW(),
          resubmitted_at = NULL
        WHERE id = ?
      `;

    db.query(updateSql, [suggestion.trim(), requestId], (err) => {
      if (err) {
        console.log("Update revision request error:", err);

        return res.status(500).json({
          message: "อัปเดตสถานะคำขอไม่สำเร็จ",
        });
      }

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

      const message =
        `อาจารย์ส่งคำขอโครงงาน "${request.title}" ` +
        `กลับมาให้แก้ไข\n\n` +
        `สิ่งที่ต้องแก้ไข: ${suggestion.trim()}`;

      db.query(
        notificationSql,
        [request.student_id, message, request.id, request.project_id],
        (notificationErr) => {
          if (notificationErr) {
            console.log("Revision notification error:", notificationErr);
          }

          res.json({
            success: true,
            message: "ส่งคำขอกลับให้นิสิตแก้ไขเรียบร้อยแล้ว",
          });
        },
      );
    });
  });
});

// ==========================================
// ปฏิเสธคำขอ
// ==========================================
app.post("/teacher/request/:requestId/reject", (req, res) => {
  const { requestId } = req.params;

  const { advisor_id, rejection_reason } = req.body;

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

    const reason = rejection_reason?.trim() || null;

    const updateSql = `
        UPDATE project_requests
        SET
          status = 'ปฏิเสธ',
          teacher_comment = NULL,
          suggestion = NULL,
          rejection_reason = ?,
          decision_date = NOW()
        WHERE id = ?
      `;

    db.query(updateSql, [reason, requestId], (err) => {
      if (err) {
        console.log("Reject request error:", err);

        return res.status(500).json({
          message: "อัปเดตสถานะคำขอไม่สำเร็จ",
        });
      }

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

      const message = reason
        ? `อาจารย์ปฏิเสธคำขอโครงงาน "${request.title}" ของคุณ\n\nเหตุผลการปฏิเสธ: ${reason}`
        : `อาจารย์ปฏิเสธคำขอโครงงาน "${request.title}" ของคุณ`;

      db.query(
        notificationSql,
        [request.student_id, message, request.id, request.project_id],
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
    });
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
  // และต้องเป็นคำขอที่อาจารย์ส่งกลับมาให้แก้ไข
  const checkSql = `
  SELECT
    pr.id,
    pr.status,
    pr.student_id,

    p.id AS project_id,
    p.source,
    p.advisor_id,
    p.title,

    student.name AS student_name

  FROM project_requests pr

  INNER JOIN projects p
    ON pr.project_id = p.id

  INNER JOIN users student
    ON pr.student_id = student.id

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

    if (oldRequest.status !== "ต้องแก้ไข") {
      return res.status(400).json({
        message: "สามารถส่งใหม่ได้เฉพาะคำขอที่อาจารย์ส่งกลับให้แก้ไข",
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
                decision_date = NULL,
                resubmitted_at = CURRENT_TIMESTAMP
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

            const notificationMessage =
              `${oldRequest.student_name} แก้ไขคำเสนอโครงงาน "` +
              `${title}" และส่งกลับมาให้คุณพิจารณาอีกครั้ง`;

            db.query(
              notificationSql,
              [
                oldRequest.advisor_id,
                notificationMessage,
                requestId,
                projectId,
              ],
              (notificationErr) => {
                if (notificationErr) {
                  console.log(
                    "Resubmit teacher notification error:",
                    notificationErr,
                  );
                }

                res.json({
                  success: true,
                  message: "แก้ไขและส่งให้อาจารย์พิจารณาใหม่เรียบร้อยแล้ว",
                });
              },
            );
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

    LIMIT 10
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
// เอกสารขออนุมัติหัวข้อโครงงานทั้งหมด
// ==========================================

app.get("/staff/documents", (req, res) => {
  const sql = `
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

    ORDER BY ad.approved_at DESC, ad.id DESC
  `;

  db.query(sql, (err, results) => {
    if (err) {
      console.log("Get staff documents error:", err);

      return res.status(500).json({
        message: "Database Error",
      });
    }

    res.json(results);
  });
});

// ==========================================
// ประวัติการลงนาม
// ==========================================

app.get("/staff/signature-history", (req, res) => {
  const sql = `
    SELECT
      ad.id,
      ad.document_type,
      ad.document_code,
      ad.approved_at,
      ad.signature_image,
      ad.pdf_path,

      p.title AS project_title,
      p.academic_year,

      advisor.name AS advisor_name,

      CONCAT(
        ad.document_code,
        '-',
        SUBSTRING_INDEX(p.academic_year, '/', 1),
        '-',
        LPAD(ad.id, 3, '0')
      ) AS document_number

    FROM approval_documents ad

    INNER JOIN projects p
      ON ad.project_id = p.id

    INNER JOIN users advisor
      ON ad.advisor_id = advisor.id

    WHERE ad.signature_image IS NOT NULL

    ORDER BY ad.approved_at DESC, ad.id DESC
  `;

  db.query(sql, (err, results) => {
    if (err) {
      console.log("Get signature history error:", err);

      return res.status(500).json({
        message: "Database Error",
      });
    }

    res.json(results);
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
    p.major AS major,
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
// ใส่ข้อมูลจริงลง PDF
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

      // อ่านชื่อ family จริงจากไฟล์ font
      const thaiFontInfo = fontkit.create(fontBytes);
      const thaiFontFamily = thaiFontInfo.familyName || "sans";

      const thaiFont = await pdfDoc.embedFont(fontBytes);

      const page = pdfDoc.getPages()[0];

      const drawSignatureAboveLine = async (signatureUrl, box) => {
        const signaturePath = getAssetFilePath(signatureUrl);

        if (!signaturePath || !fs.existsSync(signaturePath)) {
          return;
        }

        const signatureBytes = fs.readFileSync(signaturePath);

        const trimmedBytes = await sharp(signatureBytes)
          .trim({ threshold: 35 })
          .png()
          .toBuffer();

        const signatureImage = await pdfDoc.embedPng(trimmedBytes);

        const imageAspect = signatureImage.width / signatureImage.height;

        const boxAspect = box.width / box.height;

        /*
    ถ้าลายเซ็นกว้างและเตี้ยมาก
    ตัวจำกัดจะเป็น width

    อนุญาตให้กว้างเกินเส้นเล็กน้อย
    แต่ยังจัดกลางเส้นเดิม
  */
        const extraWidth = imageAspect > boxAspect ? box.extraWidth || 0 : 0;

        const allowedWidth = box.width + extraWidth;

        const fittedSize = signatureImage.scaleToFit(allowedWidth, box.height);

        /*
    ใช้ center ของเส้นจริง
    ต่อให้อนุญาต extraWidth
    ลายเซ็นก็ยังอยู่กลางตำแหน่งเดิม
  */
        const lineCenterX = box.x + box.width / 2;

        const drawX = lineCenterX - fittedSize.width / 2;

        const drawY = box.lineY + (box.gap || 0);

        page.drawImage(signatureImage, {
          x: drawX,
          y: drawY,
          width: fittedSize.width,
          height: fittedSize.height,
        });
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
      // ตัดคำเอง + สร้างทีละบรรทัด
      // ==========================================

      const reasonText = (document.introduction || "-")
        .normalize("NFC")
        .replace(/[\u200B-\u200D\uFEFF]/g, "")
        .replace(/\u00A0/g, " ")
        .replace(/\r?\n+/g, " ")
        .replace(/[ \t]+/g, " ")
        .trim();

      const reasonLeftX = 55;
      const reasonRightX = 542;

      const reasonFirstLineY = 532;
      const reasonLineHeight = 18;
      const maxReasonLines = 6;

      let reasonFontSize = 10.5;
      const minimumReasonFontSize = 8.5;

      const renderDpi = 288;
      const pixelToPdf = 72 / renderDpi;

      const reasonWidthPdf = reasonRightX - reasonLeftX;
      const reasonWidthPx = Math.round(reasonWidthPdf / pixelToPdf);

      // เยื้องบรรทัดแรก
      const firstLineIndentPdf = 10;
      const firstLineIndentPx = Math.round(firstLineIndentPdf / pixelToPdf);

      const escapePango = (text) =>
        text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

      // ใช้ตัวตัดคำภาษาไทยของ JS
      const segmenter = new Intl.Segmenter("th", { granularity: "word" });

      // วัดความกว้างข้อความจริง
      const measureTextWidthPx = async (text, fontSize) => {
        if (!text || !text.trim()) return 0;

        const { info } = await sharp({
          text: {
            text: escapePango(text),
            font: `${thaiFontFamily} ${fontSize}`,
            fontfile: fontPath,
            dpi: renderDpi,
            rgba: true,
            align: "left",
            justify: false,
            wrap: "none",
            spacing: 0,
          },
        })
          .trim()
          .png()
          .toBuffer({ resolveWithObject: true });

        return info.width;
      };

      // สร้างบรรทัดเอง
      const buildReasonLines = async (fontSize) => {
        const tokens = [...segmenter.segment(reasonText)].map(
          (item) => item.segment,
        );

        const lines = [];
        let currentLine = "";

        for (const rawToken of tokens) {
          const token = currentLine === "" ? rawToken.trimStart() : rawToken;

          const candidate = currentLine + token;

          const maxWidthThisLinePx =
            lines.length === 0
              ? reasonWidthPx - firstLineIndentPx
              : reasonWidthPx;

          const candidateWidth = await measureTextWidthPx(candidate, fontSize);

          if (candidateWidth <= maxWidthThisLinePx || currentLine === "") {
            currentLine = candidate;
          } else {
            lines.push(currentLine.trimEnd());
            currentLine = rawToken.trimStart();
          }
        }

        if (currentLine.trim()) {
          lines.push(currentLine.trimEnd());
        }

        return lines;
      };

      // ถ้าเกิน 6 บรรทัด ค่อยลดฟอนต์
      let reasonLines = await buildReasonLines(reasonFontSize);

      while (
        reasonLines.length > maxReasonLines &&
        reasonFontSize > minimumReasonFontSize
      ) {
        reasonFontSize -= 0.25;
        reasonLines = await buildReasonLines(reasonFontSize);
      }

      reasonLines = reasonLines.slice(0, maxReasonLines);

      // render ทีละบรรทัด
      const renderReasonLineImage = async (text, fontSize) => {
        return await sharp({
          text: {
            text: escapePango(text),
            font: `${thaiFontFamily} ${fontSize}`,
            fontfile: fontPath,
            dpi: renderDpi,
            rgba: true,
            align: "left",
            justify: false,
            wrap: "none",
            spacing: 0,
          },
        })
          .trim()
          .png()
          .toBuffer();
      };

      // วางทีละบรรทัดลง PDF
      for (let index = 0; index < reasonLines.length; index++) {
        const lineText = reasonLines[index];

        const lineX =
          index === 0 ? reasonLeftX + firstLineIndentPdf : reasonLeftX;

        const lineBuffer = await renderReasonLineImage(
          lineText,
          reasonFontSize,
        );

        const lineImage = await pdfDoc.embedPng(lineBuffer);

        const meta = await sharp(lineBuffer).metadata();

        const drawWidth = (meta.width || 0) * pixelToPdf;

        const drawHeight = (meta.height || 0) * pixelToPdf;

        const dottedLineY = reasonFirstLineY - index * reasonLineHeight;

        page.drawImage(lineImage, {
          x: lineX,
          y: dottedLineY,

          // ใช้ความกว้างจริงของตัวหนังสือ
          // ห้ามยืดให้เต็มบรรทัด
          width: drawWidth,

          height: drawHeight,
        });
      }
      // ==========================================
      // ลายเซ็นนิสิต
      // ==========================================

      await drawSignatureAboveLine(document.student_signature, {
        x: 392,

        // ความกว้างจริงของเส้นลายเซ็น
        width: 158,

        // เพิ่มจาก 24 เพื่อให้ลายเซ็นเล็กโตขึ้น
        height: 28,

        // เส้นจริงของ template อยู่ประมาณ y = 409.5
        lineY: 410,

        // ให้ก้นรูปอยู่เหนือเส้น
        gap: 0,

        // ใช้เฉพาะลายเซ็นที่กว้างและเตี้ย
        extraWidth: 12,
      });

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

      await drawSignatureAboveLine(document.advisor_signature, {
        x: 195,
        width: 88,
        height: 18,
        lineY: 287,
        gap: 1,
      });

      const advisorDateFontSize = 10.5;

      const advisorDateBoxX = 195;
      const advisorDateBoxWidth = 88;

      const advisorDateWidth = thaiFont.widthOfTextAtSize(
        thaiDate,
        advisorDateFontSize,
      );

      page.drawText(thaiDate, {
        x: advisorDateBoxX + (advisorDateBoxWidth - advisorDateWidth) / 2,

        y: 268,
        size: advisorDateFontSize,
        font: thaiFont,
      });

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

    const filePath = path.join(__dirname, "generated", fileName);

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
          console.log("Update download status error:", updateErr);
          return;
        }

        console.log(`Document ${documentId} downloaded successfully`);
      });
    });
  });
});

// =========================================================
// STUDENT PROJECT PLAN
// =========================================================

// =========================================================
// 1. ดูแผนงานทั้งหมดของโครงงาน
// =========================================================

app.get("/student/projects/:projectId/plan", (req, res) => {
  const { projectId } = req.params;

  // -----------------------------------------
  // ข้อมูลโครงงาน
  // -----------------------------------------

  const projectSql = `
      SELECT
        p.id,
        p.title

      FROM projects p

      WHERE p.id = ?
    `;

  db.query(projectSql, [projectId], (projectErr, projectRows) => {
    if (projectErr) {
      console.log("Get plan project error:", projectErr);

      return res.status(500).json({
        message: "Database Error",
      });
    }

    if (projectRows.length === 0) {
      return res.status(404).json({
        message: "ไม่พบโครงงาน",
      });
    }

    const project = projectRows[0];

    // -----------------------------------------
    // สมาชิกในโครงงาน
    // -----------------------------------------

    const memberSql = `
          SELECT
            u.id,
            u.username,
            u.name

          FROM project_members pm

          INNER JOIN users u
            ON pm.user_id = u.id

          WHERE pm.project_id = ?

          ORDER BY pm.id ASC
        `;

    db.query(memberSql, [projectId], (memberErr, members) => {
      if (memberErr) {
        console.log("Get plan members error:", memberErr);

        return res.status(500).json({
          message: "Database Error",
        });
      }

      // -----------------------------------------
      // Phase
      // -----------------------------------------

      const phaseSql = `
              SELECT
                id,
                project_id,
                phase_name,
                start_date,
                due_date,
                phase_order,
                created_at,
                updated_at

              FROM project_phases

              WHERE project_id = ?

              ORDER BY
                phase_order ASC,
                id ASC
            `;

      db.query(phaseSql, [projectId], (phaseErr, phases) => {
        if (phaseErr) {
          console.log("Get phases error:", phaseErr);

          return res.status(500).json({
            message: "Database Error",
          });
        }

        // -----------------------------------------
        // Task
        // -----------------------------------------

        const taskSql = `
                  SELECT
                    t.id,
                    t.project_id,
                    t.phase_id,

                    t.task_name,
                    t.description,

                    t.assignee_id,

                    u.username
                      AS assignee_username,

                    u.name
                      AS assignee_name,

                    t.start_date,
                    t.due_date,

                    t.status,
                    t.review_status,

                    t.task_order,

                    t.created_at,
                    t.updated_at

                  FROM project_tasks t

                  LEFT JOIN users u
                    ON t.assignee_id = u.id

                  WHERE t.project_id = ?

                  ORDER BY
                    t.task_order ASC,
                    t.id ASC
                `;

        db.query(taskSql, [projectId], (taskErr, tasks) => {
          if (taskErr) {
            console.log("Get tasks error:", taskErr);

            return res.status(500).json({
              message: "Database Error",
            });
          }

          // -----------------------------------------
          // Subtask
          // -----------------------------------------

          const subtaskSql = `
                      SELECT
                        st.id,
                        st.task_id,
                        st.subtask_name,
                        st.status,
                        st.subtask_order,
                        st.created_at,
                        st.updated_at

                      FROM project_subtasks st

                      INNER JOIN project_tasks t
                        ON st.task_id = t.id

                      WHERE t.project_id = ?

                      ORDER BY
                        st.subtask_order ASC,
                        st.id ASC
                    `;

          db.query(subtaskSql, [projectId], (subtaskErr, subtasks) => {
            if (subtaskErr) {
              console.log("Get subtasks error:", subtaskErr);

              return res.status(500).json({
                message: "Database Error",
              });
            }

            // =====================================
            // จัด Subtask เข้า Task
            // =====================================

            const tasksWithSubtasks = tasks.map((task) => {
              const taskSubtasks = subtasks.filter(
                (subtask) => Number(subtask.task_id) === Number(task.id),
              );

              const completedSubtasks = taskSubtasks.filter(
                (subtask) => subtask.status === "เสร็จสิ้น",
              ).length;

              return {
                ...task,

                subtasks: taskSubtasks,

                completed_subtasks: completedSubtasks,

                total_subtasks: taskSubtasks.length,
              };
            });

            // =====================================
            // จัด Task เข้า Phase
            // =====================================

            const phasesWithTasks = phases.map((phase) => {
              const phaseTasks = tasksWithSubtasks.filter(
                (task) => Number(task.phase_id) === Number(phase.id),
              );

              const completedTasks = phaseTasks.filter(
                (task) => task.status === "เสร็จสิ้น",
              ).length;

              const totalTasks = phaseTasks.length;

              let phaseStatus = "ยังไม่เริ่ม";

              if (totalTasks > 0 && completedTasks === totalTasks) {
                phaseStatus = "เสร็จสิ้น";
              } else if (
                phaseTasks.some(
                  (task) =>
                    task.status === "กำลังดำเนินการ" ||
                    task.status === "เสร็จสิ้น",
                )
              ) {
                phaseStatus = "กำลังดำเนินการ";
              }

              return {
                ...phase,

                status: phaseStatus,

                completed_tasks: completedTasks,

                total_tasks: totalTasks,

                tasks: phaseTasks,
              };
            });

            // =====================================
            // RESPONSE
            // =====================================

            res.json({
              project,

              members,

              phases: phasesWithTasks,
            });
          });
        });
      });
    });
  });
});

// =========================================================
// 2. สร้าง Phase
// =========================================================

app.post("/student/projects/:projectId/phases", (req, res) => {
  const { projectId } = req.params;

  const { student_id, phase_name, start_date, due_date } = req.body;

  // -----------------------------------------
  // ตรวจข้อมูล
  // -----------------------------------------

  if (!student_id || !phase_name?.trim()) {
    return res.status(400).json({
      message: "กรุณาระบุชื่อ Phase",
    });
  }

  if (start_date && due_date && new Date(start_date) > new Date(due_date)) {
    return res.status(400).json({
      message: "วันที่เริ่มต้นต้องไม่เกินวันที่สิ้นสุด",
    });
  }

  // -----------------------------------------
  // ตรวจว่านิสิตเป็นสมาชิกโครงงานจริง
  // -----------------------------------------

  const memberCheckSql = `
      SELECT id

      FROM project_members

      WHERE project_id = ?
        AND user_id = ?

      LIMIT 1
    `;

  db.query(memberCheckSql, [projectId, student_id], (memberErr, memberRows) => {
    if (memberErr) {
      console.log("Check project member error:", memberErr);

      return res.status(500).json({
        message: "Database Error",
      });
    }

    if (memberRows.length === 0) {
      return res.status(403).json({
        message: "คุณไม่ใช่สมาชิกของโครงงานนี้",
      });
    }

    // -----------------------------------------
    // หา order ถัดไป
    // -----------------------------------------

    const orderSql = `
          SELECT
            COALESCE(
              MAX(phase_order),
              0
            ) + 1 AS next_order

          FROM project_phases

          WHERE project_id = ?
        `;

    db.query(orderSql, [projectId], (orderErr, orderRows) => {
      if (orderErr) {
        console.log("Get phase order error:", orderErr);

        return res.status(500).json({
          message: "Database Error",
        });
      }

      const nextOrder = Number(orderRows[0]?.next_order) || 1;

      // -----------------------------------------
      // Insert Phase
      // -----------------------------------------

      const insertSql = `
              INSERT INTO project_phases
              (
                project_id,
                phase_name,
                start_date,
                due_date,
                phase_order
              )

              VALUES (?, ?, ?, ?, ?)
            `;

      db.query(
        insertSql,
        [
          projectId,

          phase_name.trim(),

          start_date || null,

          due_date || null,

          nextOrder,
        ],
        (insertErr, result) => {
          if (insertErr) {
            console.log("Create phase error:", insertErr);

            return res.status(500).json({
              message: "สร้าง Phase ไม่สำเร็จ",
            });
          }

          res.json({
            success: true,

            message: "สร้าง Phase เรียบร้อยแล้ว",

            phase_id: result.insertId,
          });
        },
      );
    });
  });
});
// =========================================================
// 3. แก้ไข Phase
// =========================================================

app.put("/student/phases/:phaseId", (req, res) => {
  const { phaseId } = req.params;

  const { student_id, phase_name, start_date, due_date } = req.body;

  // ==========================================
  // ตรวจข้อมูล
  // ==========================================

  if (!student_id || !phase_name?.trim() || !start_date || !due_date) {
    return res.status(400).json({
      message: "กรุณากรอกข้อมูลให้ครบ",
    });
  }

  if (new Date(start_date) > new Date(due_date)) {
    return res.status(400).json({
      message: "วันที่เริ่มต้นต้องไม่เกินวันที่สิ้นสุด",
    });
  }

  // ==========================================
  // หา Phase + ตรวจว่านิสิตเป็นสมาชิกโครงงาน
  // ==========================================

  const checkSql = `
      SELECT
        ph.id,
        ph.project_id

      FROM project_phases ph

      INNER JOIN project_members pm
        ON pm.project_id = ph.project_id

      WHERE ph.id = ?
        AND pm.user_id = ?

      LIMIT 1
    `;

  db.query(checkSql, [phaseId, student_id], (checkErr, rows) => {
    if (checkErr) {
      console.log("Check edit phase error:", checkErr);

      return res.status(500).json({
        message: "Database Error",
      });
    }

    if (rows.length === 0) {
      return res.status(403).json({
        message: "คุณไม่มีสิทธิ์แก้ไข Phase นี้",
      });
    }

    // ==========================================
    // UPDATE
    // ==========================================

    const updateSql = `
          UPDATE project_phases

          SET
            phase_name = ?,
            start_date = ?,
            due_date = ?

          WHERE id = ?
        `;

    db.query(
      updateSql,
      [phase_name.trim(), start_date, due_date, phaseId],
      (updateErr) => {
        if (updateErr) {
          console.log("Update phase error:", updateErr);

          return res.status(500).json({
            message: "แก้ไข Phase ไม่สำเร็จ",
          });
        }

        res.json({
          success: true,

          message: "แก้ไข Phase เรียบร้อยแล้ว",
        });
      },
    );
  });
});
// =========================================================
// 4. ลบ Phase
// =========================================================

app.delete("/student/phases/:phaseId", (req, res) => {
  const { phaseId } = req.params;

  const { student_id } = req.body;

  if (!student_id) {
    return res.status(400).json({
      message: "ไม่พบข้อมูลผู้ใช้งาน",
    });
  }

  // ==========================================
  // ตรวจสิทธิ์ก่อน
  // ==========================================

  const checkSql = `
      SELECT
        ph.id,
        ph.project_id,
        ph.phase_name

      FROM project_phases ph

      INNER JOIN project_members pm
        ON pm.project_id = ph.project_id

      WHERE ph.id = ?
        AND pm.user_id = ?

      LIMIT 1
    `;

  db.query(checkSql, [phaseId, student_id], (checkErr, rows) => {
    if (checkErr) {
      console.log("Check delete phase error:", checkErr);

      return res.status(500).json({
        message: "Database Error",
      });
    }

    if (rows.length === 0) {
      return res.status(403).json({
        message: "คุณไม่มีสิทธิ์ลบ Phase นี้",
      });
    }

    // ==========================================
    // DELETE
    // ==========================================

    const deleteSql = `
          DELETE FROM project_phases

          WHERE id = ?
        `;

    db.query(deleteSql, [phaseId], (deleteErr) => {
      if (deleteErr) {
        console.log("Delete phase error:", deleteErr);

        return res.status(500).json({
          message: "ลบ Phase ไม่สำเร็จ",
        });
      }

      res.json({
        success: true,

        message: "ลบ Phase เรียบร้อยแล้ว",
      });
    });
  });
});
// =========================================================
// 5. สร้างงานใน Phase
// =========================================================

app.post("/student/phases/:phaseId/tasks", (req, res) => {
  const { phaseId } = req.params;

  const {
    student_id,
    task_name,
    description,
    start_date,
    due_date,
    subtasks = [],
  } = req.body;

  // ==========================================
  // ตรวจข้อมูล
  // ==========================================

  if (!student_id || !task_name?.trim() || !start_date || !due_date) {
    return res.status(400).json({
      message: "กรุณากรอกข้อมูลที่จำเป็นให้ครบ",
    });
  }

  if (new Date(start_date) > new Date(due_date)) {
    return res.status(400).json({
      message: "วันที่เริ่มต้นต้องไม่เกินกำหนดส่ง",
    });
  }

  // ==========================================
  // ตรวจ Phase + ตรวจว่านิสิตเป็นสมาชิก
  // ==========================================

  const checkSql = `
      SELECT
        ph.id,
        ph.project_id,
        ph.start_date AS phase_start_date,
        ph.due_date AS phase_due_date

      FROM project_phases ph

      INNER JOIN project_members pm
        ON pm.project_id = ph.project_id

      WHERE ph.id = ?
        AND pm.user_id = ?

      LIMIT 1
    `;

  db.query(checkSql, [phaseId, student_id], (checkErr, rows) => {
    if (checkErr) {
      console.log("Check task phase error:", checkErr);

      return res.status(500).json({
        message: "Database Error",
      });
    }

    if (rows.length === 0) {
      return res.status(403).json({
        message: "คุณไม่มีสิทธิ์เพิ่มงานใน Phase นี้",
      });
    }

    const phase = rows[0];

    // ==========================================
    // ตรวจวันที่ของงานกับ Phase
    // ==========================================

    if (
      phase.phase_start_date &&
      new Date(start_date) < new Date(phase.phase_start_date)
    ) {
      return res.status(400).json({
        message: "วันที่เริ่มงานต้องไม่ก่อนวันที่เริ่มต้นของ Phase",
      });
    }

    if (
      phase.phase_due_date &&
      new Date(due_date) > new Date(phase.phase_due_date)
    ) {
      return res.status(400).json({
        message: "กำหนดส่งต้องไม่เกินวันที่สิ้นสุดของ Phase",
      });
    }

    // ==========================================
    // หา task_order ถัดไป
    // ==========================================

    const orderSql = `
          SELECT
            COALESCE(
              MAX(task_order),
              0
            ) + 1 AS next_order

          FROM project_tasks

          WHERE phase_id = ?
        `;

    db.query(orderSql, [phaseId], (orderErr, orderRows) => {
      if (orderErr) {
        console.log("Get task order error:", orderErr);

        return res.status(500).json({
          message: "Database Error",
        });
      }

      const nextOrder = Number(orderRows[0]?.next_order) || 1;

      // ==========================================
      // INSERT TASK
      // ==========================================

      const insertTaskSql = `
              INSERT INTO project_tasks
              (
                project_id,
                phase_id,
                task_name,
                description,
                assignee_id,
                start_date,
                due_date,
                status,
                review_status,
                task_order
              )

              VALUES (
                ?, ?, ?, ?, ?, ?, ?,
                'ยังไม่เริ่ม',
                'ยังไม่ส่ง',
                ?
              )
            `;

      db.query(
        insertTaskSql,
        [
          phase.project_id,
          phaseId,

          task_name.trim(),

          description?.trim() || null,

          student_id,

          start_date,
          due_date,

          nextOrder,
        ],
        (taskErr, taskResult) => {
          if (taskErr) {
            console.log("Create task error:", taskErr);

            return res.status(500).json({
              message: "เพิ่มงานไม่สำเร็จ",
            });
          }

          const taskId = taskResult.insertId;

          // ==========================================
          // ไม่มี Subtask
          // ==========================================

          if (!Array.isArray(subtasks) || subtasks.length === 0) {
            return res.json({
              success: true,

              message: "เพิ่มงานเรียบร้อยแล้ว",

              task_id: taskId,
            });
          }

          // ==========================================
          // INSERT SUBTASK
          // ==========================================

          const subtaskValues = subtasks
            .map((item, index) => [
              taskId,
              String(item).trim(),
              "ยังไม่เริ่ม",
              index + 1,
            ])
            .filter((item) => item[1] !== "");

          if (subtaskValues.length === 0) {
            return res.json({
              success: true,

              message: "เพิ่มงานเรียบร้อยแล้ว",

              task_id: taskId,
            });
          }

          const insertSubtaskSql = `
                  INSERT INTO project_subtasks
                  (
                    task_id,
                    subtask_name,
                    status,
                    subtask_order
                  )

                  VALUES ?
                `;

          db.query(insertSubtaskSql, [subtaskValues], (subtaskErr) => {
            if (subtaskErr) {
              console.log("Create subtasks error:", subtaskErr);

              // ถ้า Subtask ผิด
              // ลบ Task ที่เพิ่งสร้างออก
              db.query(
                `
                          DELETE
                          FROM project_tasks
                          WHERE id = ?
                        `,
                [taskId],
              );

              return res.status(500).json({
                message: "เพิ่ม Subtask ไม่สำเร็จ",
              });
            }

            res.json({
              success: true,

              message: "เพิ่มงานเรียบร้อยแล้ว",

              task_id: taskId,
            });
          });
        },
      );
    });
  });
});

// =========================================================
// 6. แก้ไขงาน
// =========================================================

app.put("/student/tasks/:taskId", async (req, res) => {
  const { taskId } = req.params;

  const {
    student_id,
    phase_id,
    task_name,
    description,
    start_date,
    due_date,
    subtasks = [],
  } = req.body;

  // ใช้ Promise ครอบ db.query
  const query = (sql, params = []) => {
    return new Promise((resolve, reject) => {
      db.query(sql, params, (err, result) => {
        if (err) {
          reject(err);
          return;
        }

        resolve(result);
      });
    });
  };

  try {
    // ==========================================
    // ตรวจข้อมูล
    // ==========================================

    if (
      !student_id ||
      !phase_id ||
      !task_name?.trim() ||
      !start_date ||
      !due_date
    ) {
      return res.status(400).json({
        message: "กรุณากรอกข้อมูลที่จำเป็นให้ครบ",
      });
    }

    if (new Date(start_date) > new Date(due_date)) {
      return res.status(400).json({
        message: "วันที่เริ่มต้นต้องไม่เกินกำหนดส่ง",
      });
    }

    // ==========================================
    // ตรวจงาน + ตรวจสิทธิ์สมาชิก
    // ==========================================

    const taskRows = await query(
      `
            SELECT
              t.id,
              t.project_id,
              t.phase_id,
              t.task_order

            FROM project_tasks t

            INNER JOIN project_members pm
              ON pm.project_id = t.project_id

            WHERE t.id = ?
              AND pm.user_id = ?

            LIMIT 1
          `,
      [taskId, student_id],
    );

    if (taskRows.length === 0) {
      return res.status(403).json({
        message: "คุณไม่มีสิทธิ์แก้ไขงานนี้",
      });
    }

    const currentTask = taskRows[0];

    // ==========================================
    // ตรวจ Phase ใหม่
    // ต้องอยู่ใน project เดียวกัน
    // ==========================================

    const phaseRows = await query(
      `
            SELECT
              id,
              project_id,
              start_date,
              due_date

            FROM project_phases

            WHERE id = ?
              AND project_id = ?

            LIMIT 1
          `,
      [phase_id, currentTask.project_id],
    );

    if (phaseRows.length === 0) {
      return res.status(400).json({
        message: "ไม่พบ Phase ที่เลือก",
      });
    }

    const targetPhase = phaseRows[0];

    // ==========================================
    // ตรวจวันกับช่วง Phase
    // ==========================================

    if (
      targetPhase.start_date &&
      new Date(start_date) < new Date(targetPhase.start_date)
    ) {
      return res.status(400).json({
        message: "วันที่เริ่มงานต้องไม่ก่อนวันที่เริ่มต้นของ Phase",
      });
    }

    if (
      targetPhase.due_date &&
      new Date(due_date) > new Date(targetPhase.due_date)
    ) {
      return res.status(400).json({
        message: "กำหนดส่งต้องไม่เกินวันที่สิ้นสุดของ Phase",
      });
    }

    // ==========================================
    // ถ้าย้าย Phase
    // หา task_order ใหม่
    // ==========================================

    let newTaskOrder = currentTask.task_order;

    if (Number(currentTask.phase_id) !== Number(phase_id)) {
      const orderRows = await query(
        `
              SELECT
                COALESCE(
                  MAX(task_order),
                  0
                ) + 1 AS next_order

              FROM project_tasks

              WHERE phase_id = ?
                AND id != ?
            `,
        [phase_id, taskId],
      );

      newTaskOrder = Number(orderRows[0]?.next_order) || 1;
    }

    // ==========================================
    // UPDATE TASK
    // ==========================================

    await query(
      `
          UPDATE project_tasks

          SET
            phase_id = ?,
            task_name = ?,
            description = ?,
            start_date = ?,
            due_date = ?,
            task_order = ?

          WHERE id = ?
        `,
      [
        phase_id,
        task_name.trim(),

        description?.trim() || null,

        start_date,
        due_date,

        newTaskOrder,

        taskId,
      ],
    );

    // ==========================================
    // SUBTASK เดิม
    // ==========================================

    const oldSubtasks = await query(
      `
            SELECT
              id

            FROM project_subtasks

            WHERE task_id = ?
          `,
      [taskId],
    );

    const oldIds = new Set(oldSubtasks.map((item) => Number(item.id)));

    // ID เดิมที่ยังถูกใช้อยู่
    const keepOldIds = new Set();

    let order = 1;

    // ==========================================
    // UPDATE / INSERT SUBTASK
    // ==========================================

    for (const item of subtasks) {
      const name = String(item.subtask_name || "").trim();

      if (!name) {
        continue;
      }

      const subtaskId = Number(item.id);

      // Subtask เดิม
      if (subtaskId && oldIds.has(subtaskId)) {
        await query(
          `
              UPDATE project_subtasks

              SET
                subtask_name = ?,
                subtask_order = ?

              WHERE id = ?
                AND task_id = ?
            `,
          [name, order, subtaskId, taskId],
        );

        keepOldIds.add(subtaskId);
      } else {
        // Subtask ใหม่
        await query(
          `
              INSERT INTO project_subtasks
              (
                task_id,
                subtask_name,
                status,
                subtask_order
              )

              VALUES (
                ?,
                ?,
                'ยังไม่เริ่ม',
                ?
              )
            `,
          [taskId, name, order],
        );
      }

      order++;
    }

    // ==========================================
    // ลบ Subtask ที่ผู้ใช้เอาออก
    // ==========================================

    const removedIds = [...oldIds].filter((id) => !keepOldIds.has(id));

    if (removedIds.length > 0) {
      const placeholders = removedIds.map(() => "?").join(",");

      await query(
        `
            DELETE FROM project_subtasks

            WHERE task_id = ?
              AND id IN (${placeholders})
          `,
        [taskId, ...removedIds],
      );
    }

    res.json({
      success: true,

      message: "แก้ไขงานเรียบร้อยแล้ว",
    });
  } catch (err) {
    console.log("Update task error:", err);

    res.status(500).json({
      message: "แก้ไขงานไม่สำเร็จ",
    });
  }
});

// =========================================================
// 7. ลบงาน
// =========================================================

app.delete("/student/tasks/:taskId", (req, res) => {
  const { taskId } = req.params;

  const { student_id } = req.body;

  if (!student_id) {
    return res.status(400).json({
      message: "ไม่พบข้อมูลผู้ใช้งาน",
    });
  }

  const checkSql = `
      SELECT
        t.id

      FROM project_tasks t

      INNER JOIN project_members pm
        ON pm.project_id =
           t.project_id

      WHERE t.id = ?
        AND pm.user_id = ?

      LIMIT 1
    `;

  db.query(checkSql, [taskId, student_id], (checkErr, rows) => {
    if (checkErr) {
      console.log("Check delete task error:", checkErr);

      return res.status(500).json({
        message: "Database Error",
      });
    }

    if (rows.length === 0) {
      return res.status(403).json({
        message: "คุณไม่มีสิทธิ์ลบงานนี้",
      });
    }

    db.query(
      `
            DELETE FROM project_tasks
            WHERE id = ?
          `,
      [taskId],
      (deleteErr) => {
        if (deleteErr) {
          console.log("Delete task error:", deleteErr);

          return res.status(500).json({
            message: "ลบงานไม่สำเร็จ",
          });
        }

        res.json({
          success: true,

          message: "ลบงานเรียบร้อยแล้ว",
        });
      },
    );
  });
});

// =========================================================
// 8. เริ่มดำเนินการงาน
// =========================================================

app.put("/student/tasks/:taskId/start", (req, res) => {
  const { taskId } = req.params;

  const { student_id } = req.body;

  if (!student_id) {
    return res.status(400).json({
      message: "ไม่พบข้อมูลผู้ใช้งาน",
    });
  }

  // ตรวจว่านิสิตเป็นสมาชิกโครงงาน
  const checkSql = `
      SELECT
        t.id,
        t.status

      FROM project_tasks t

      INNER JOIN project_members pm
        ON pm.project_id = t.project_id

      WHERE t.id = ?
        AND pm.user_id = ?

      LIMIT 1
    `;

  db.query(checkSql, [taskId, student_id], (checkErr, rows) => {
    if (checkErr) {
      console.log("Check start task error:", checkErr);

      return res.status(500).json({
        message: "Database Error",
      });
    }

    if (rows.length === 0) {
      return res.status(403).json({
        message: "คุณไม่มีสิทธิ์ดำเนินการงานนี้",
      });
    }

    if (rows[0].status !== "ยังไม่เริ่ม") {
      return res.status(400).json({
        message: "งานนี้เริ่มดำเนินการแล้ว",
      });
    }

    const updateSql = `
          UPDATE project_tasks

          SET status = 'กำลังดำเนินการ'

          WHERE id = ?
        `;

    db.query(updateSql, [taskId], (updateErr) => {
      if (updateErr) {
        console.log("Start task error:", updateErr);

        return res.status(500).json({
          message: "ไม่สามารถเริ่มดำเนินการงานได้",
        });
      }

      res.json({
        success: true,

        message: "เริ่มดำเนินการงานเรียบร้อยแล้ว",
      });
    });
  });
});

// =========================================================
// 9. บันทึกความคืบหน้าของงาน
// =========================================================

app.put("/student/tasks/:taskId/progress", async (req, res) => {
  const { taskId } = req.params;

  const { student_id, subtasks } = req.body;

  if (!student_id || !Array.isArray(subtasks)) {
    return res.status(400).json({
      message: "ข้อมูลไม่ครบถ้วน",
    });
  }

  const runQuery = (sql, params = []) => {
    return new Promise((resolve, reject) => {
      db.query(sql, params, (err, results) => {
        if (err) {
          reject(err);
          return;
        }

        resolve(results);
      });
    });
  };

  try {
    // ==========================================
    // ตรวจสิทธิ์
    // ==========================================

    const taskRows = await runQuery(
      `
            SELECT
              t.id,
              t.project_id,
              t.status,
              t.review_status

            FROM project_tasks t

            INNER JOIN project_members pm
              ON pm.project_id = t.project_id

            WHERE t.id = ?
              AND pm.user_id = ?

            LIMIT 1
          `,
      [taskId, student_id],
    );

    if (taskRows.length === 0) {
      return res.status(403).json({
        message: "คุณไม่มีสิทธิ์แก้ไขความคืบหน้าของงานนี้",
      });
    }

    const task = taskRows[0];

    // ==========================================
    // ต้องเริ่มงานก่อน
    // ==========================================

    if (task.status === "ยังไม่เริ่ม") {
      return res.status(400).json({
        message: "กรุณาเริ่มดำเนินการงานก่อนบันทึกความคืบหน้า",
      });
    }

    // ==========================================
    // ถ้าส่งให้อาจารย์ตรวจแล้ว
    // ห้ามแก้ความคืบหน้า
    // ==========================================

    if (task.review_status === "รอตรวจ" || task.review_status === "ผ่าน") {
      return res.status(400).json({
        message:
          "ไม่สามารถแก้ไขความคืบหน้าได้ เนื่องจากงานถูกส่งให้อาจารย์ตรวจแล้ว",
      });
    }

    // ==========================================
    // Subtask ของงานนี้จริง ๆ
    // ==========================================

    const currentSubtasks = await runQuery(
      `
            SELECT
              id

            FROM project_subtasks

            WHERE task_id = ?
          `,
      [taskId],
    );

    const validIds = new Set(currentSubtasks.map((item) => Number(item.id)));

    // ==========================================
    // UPDATE STATUS SUBTASK
    // ==========================================

    for (const item of subtasks) {
      const subtaskId = Number(item.id);

      if (!validIds.has(subtaskId)) {
        continue;
      }

      const newStatus =
        item.status === "เสร็จสิ้น" ? "เสร็จสิ้น" : "ยังไม่เริ่ม";

      await runQuery(
        `
            UPDATE project_subtasks

            SET status = ?

            WHERE id = ?
              AND task_id = ?
          `,
        [newStatus, subtaskId, taskId],
      );
    }

    // ==========================================
    // นับความคืบหน้าใหม่
    // ==========================================

    const progressRows = await runQuery(
      `
            SELECT

              COUNT(*) AS total_subtasks,

              SUM(
                CASE
                  WHEN status = 'เสร็จสิ้น'
                  THEN 1
                  ELSE 0
                END
              ) AS completed_subtasks

            FROM project_subtasks

            WHERE task_id = ?
          `,
      [taskId],
    );

    const totalSubtasks = Number(progressRows[0]?.total_subtasks || 0);

    const completedSubtasks = Number(progressRows[0]?.completed_subtasks || 0);

    // ==========================================
    // คำนวณสถานะงาน
    // ==========================================

    let taskStatus = "กำลังดำเนินการ";

    if (totalSubtasks > 0 && completedSubtasks === totalSubtasks) {
      taskStatus = "เสร็จสิ้น";
    }

    await runQuery(
      `
          UPDATE project_tasks

          SET status = ?

          WHERE id = ?
        `,
      [taskStatus, taskId],
    );

    const progress =
      totalSubtasks === 0
        ? 0
        : Math.round((completedSubtasks / totalSubtasks) * 100);

    res.json({
      success: true,

      message: "บันทึกความคืบหน้าเรียบร้อยแล้ว",

      completed_subtasks: completedSubtasks,

      total_subtasks: totalSubtasks,

      progress,

      task_status: taskStatus,
    });
  } catch (err) {
    console.log("Save task progress error:", err);

    res.status(500).json({
      message: "ไม่สามารถบันทึกความคืบหน้าได้",
    });
  }
});

// =========================================================
// 10. เพิ่ม Subtask
// =========================================================

app.post("/student/tasks/:taskId/subtasks", async (req, res) => {
  const { taskId } = req.params;

  const { student_id, subtask_name } = req.body;

  if (!student_id || !subtask_name?.trim()) {
    return res.status(400).json({
      message: "กรุณาระบุชื่อ Subtask",
    });
  }

  const runQuery = (sql, params = []) => {
    return new Promise((resolve, reject) => {
      db.query(sql, params, (err, results) => {
        if (err) {
          reject(err);
          return;
        }

        resolve(results);
      });
    });
  };

  try {
    // ==========================================
    // ตรวจสิทธิ์
    // ==========================================

    const taskRows = await runQuery(
      `
            SELECT
              t.id,
              t.project_id,
              t.status,
              t.review_status

            FROM project_tasks t

            INNER JOIN project_members pm
              ON pm.project_id =
                 t.project_id

            WHERE t.id = ?
              AND pm.user_id = ?

            LIMIT 1
          `,
      [taskId, student_id],
    );

    if (taskRows.length === 0) {
      return res.status(403).json({
        message: "คุณไม่มีสิทธิ์เพิ่ม Subtask ในงานนี้",
      });
    }

    const task = taskRows[0];

    // ==========================================
    // งานที่กำลังรอตรวจ / ผ่านแล้ว ห้ามแก้
    // ==========================================

    if (task.review_status === "รอตรวจ" || task.review_status === "ผ่าน") {
      return res.status(400).json({
        message:
          "ไม่สามารถเพิ่ม Subtask ได้ เนื่องจากงานถูกส่งให้อาจารย์ตรวจแล้ว",
      });
    }

    // ==========================================
    // หา order ถัดไป
    // ==========================================

    const orderRows = await runQuery(
      `
            SELECT

              COALESCE(
                MAX(subtask_order),
                0
              ) + 1
                AS next_order

            FROM project_subtasks

            WHERE task_id = ?
          `,
      [taskId],
    );

    const nextOrder = Number(orderRows[0]?.next_order) || 1;

    // ==========================================
    // INSERT
    // ==========================================

    const result = await runQuery(
      `
            INSERT INTO project_subtasks
            (
              task_id,
              subtask_name,
              status,
              subtask_order
            )

            VALUES (
              ?,
              ?,
              'ยังไม่เริ่ม',
              ?
            )
          `,
      [taskId, subtask_name.trim(), nextOrder],
    );

    // ถ้างานเคยเสร็จแล้ว
    // แต่มีการเพิ่ม Subtask ใหม่
    // ให้กลับมาเป็นกำลังดำเนินการ

    if (task.status === "เสร็จสิ้น") {
      await runQuery(
        `
            UPDATE project_tasks

            SET status =
              'กำลังดำเนินการ'

            WHERE id = ?
          `,
        [taskId],
      );
    }

    res.json({
      success: true,

      message: "เพิ่ม Subtask เรียบร้อยแล้ว",

      subtask_id: result.insertId,
    });
  } catch (err) {
    console.log("Create subtask error:", err);

    res.status(500).json({
      message: "ไม่สามารถเพิ่ม Subtask ได้",
    });
  }
});

// =========================================================
// 11. แก้ไข Subtask
// =========================================================

app.put("/student/subtasks/:subtaskId", async (req, res) => {
  const { subtaskId } = req.params;

  const { student_id, subtask_name } = req.body;

  if (!student_id || !subtask_name?.trim()) {
    return res.status(400).json({
      message: "กรุณาระบุชื่อ Subtask",
    });
  }

  const runQuery = (sql, params = []) => {
    return new Promise((resolve, reject) => {
      db.query(sql, params, (err, results) => {
        if (err) {
          reject(err);
          return;
        }

        resolve(results);
      });
    });
  };

  try {
    // ==========================================
    // ตรวจ Subtask + สิทธิ์
    // ==========================================

    const rows = await runQuery(
      `
            SELECT
              st.id,
              st.task_id,
              t.review_status

            FROM project_subtasks st

            INNER JOIN project_tasks t
              ON st.task_id = t.id

            INNER JOIN project_members pm
              ON pm.project_id =
                 t.project_id

            WHERE st.id = ?
              AND pm.user_id = ?

            LIMIT 1
          `,
      [subtaskId, student_id],
    );

    if (rows.length === 0) {
      return res.status(403).json({
        message: "คุณไม่มีสิทธิ์แก้ไข Subtask นี้",
      });
    }

    if (
      rows[0].review_status === "รอตรวจ" ||
      rows[0].review_status === "ผ่าน"
    ) {
      return res.status(400).json({
        message:
          "ไม่สามารถแก้ไข Subtask ได้ เนื่องจากงานถูกส่งให้อาจารย์ตรวจแล้ว",
      });
    }

    // ==========================================
    // UPDATE
    // ==========================================

    await runQuery(
      `
          UPDATE project_subtasks

          SET subtask_name = ?

          WHERE id = ?
        `,
      [subtask_name.trim(), subtaskId],
    );

    res.json({
      success: true,

      message: "แก้ไข Subtask เรียบร้อยแล้ว",
    });
  } catch (err) {
    console.log("Update subtask error:", err);

    res.status(500).json({
      message: "ไม่สามารถแก้ไข Subtask ได้",
    });
  }
});

// =========================================================
// 12. ลบ Subtask
// =========================================================

app.delete("/student/subtasks/:subtaskId", async (req, res) => {
  const { subtaskId } = req.params;

  const { student_id } = req.body;

  if (!student_id) {
    return res.status(400).json({
      message: "ไม่พบข้อมูลผู้ใช้งาน",
    });
  }

  const runQuery = (sql, params = []) => {
    return new Promise((resolve, reject) => {
      db.query(sql, params, (err, results) => {
        if (err) {
          reject(err);
          return;
        }

        resolve(results);
      });
    });
  };

  try {
    // ==========================================
    // ตรวจสิทธิ์
    // ==========================================

    const rows = await runQuery(
      `
            SELECT

              st.id,
              st.task_id,

              t.review_status

            FROM project_subtasks st

            INNER JOIN project_tasks t
              ON st.task_id = t.id

            INNER JOIN project_members pm
              ON pm.project_id =
                 t.project_id

            WHERE st.id = ?
              AND pm.user_id = ?

            LIMIT 1
          `,
      [subtaskId, student_id],
    );

    if (rows.length === 0) {
      return res.status(403).json({
        message: "คุณไม่มีสิทธิ์ลบ Subtask นี้",
      });
    }

    const subtask = rows[0];

    if (
      subtask.review_status === "รอตรวจ" ||
      subtask.review_status === "ผ่าน"
    ) {
      return res.status(400).json({
        message: "ไม่สามารถลบ Subtask ได้ เนื่องจากงานถูกส่งให้อาจารย์ตรวจแล้ว",
      });
    }

    // ==========================================
    // DELETE
    // ==========================================

    await runQuery(
      `
          DELETE FROM project_subtasks

          WHERE id = ?
        `,
      [subtaskId],
    );

    // ==========================================
    // เช็กว่า Subtask ที่เหลือเสร็จครบหรือยัง
    // ==========================================

    const progressRows = await runQuery(
      `
            SELECT

              COUNT(*) AS total_subtasks,

              SUM(
                CASE
                  WHEN status =
                    'เสร็จสิ้น'
                  THEN 1
                  ELSE 0
                END
              ) AS completed_subtasks

            FROM project_subtasks

            WHERE task_id = ?
          `,
      [subtask.task_id],
    );

    const total = Number(progressRows[0]?.total_subtasks || 0);

    const completed = Number(progressRows[0]?.completed_subtasks || 0);

    if (total > 0 && completed === total) {
      await runQuery(
        `
            UPDATE project_tasks

            SET status =
              'เสร็จสิ้น'

            WHERE id = ?
          `,
        [subtask.task_id],
      );
    }

    res.json({
      success: true,

      message: "ลบ Subtask เรียบร้อยแล้ว",
    });
  } catch (err) {
    console.log("Delete subtask error:", err);

    res.status(500).json({
      message: "ไม่สามารถลบ Subtask ได้",
    });
  }
});

app.listen(5000, () => {
  console.log("Server running on port 5000");
});
