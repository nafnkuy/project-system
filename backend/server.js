const express = require("express");
const cors = require("cors");
const path = require("path");
const fs = require("fs");
const multer = require("multer");
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
app.use("/uploads", express.static(path.join(__dirname, "uploads")));
// =========================================================
// TASK FILE UPLOAD
// =========================================================

const taskUploadDir = path.join(__dirname, "uploads", "task-files");

if (!fs.existsSync(taskUploadDir)) {
  fs.mkdirSync(taskUploadDir, {
    recursive: true,
  });
}

const taskFileStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, taskUploadDir);
  },

  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);

    const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;

    cb(null, uniqueName);
  },
});

const allowedTaskFileTypes = [
  "application/pdf",

  "application/msword",

  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",

  "application/vnd.ms-powerpoint",

  "application/vnd.openxmlformats-officedocument.presentationml.presentation",

  "image/jpeg",
  "image/png",
];

const uploadTaskFile = multer({
  storage: taskFileStorage,

  limits: {
    fileSize: 10 * 1024 * 1024,
  },

  fileFilter: (req, file, cb) => {
    if (allowedTaskFileTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("รองรับเฉพาะ PDF, DOC, DOCX, PPT, PPTX, JPG และ PNG"));
    }
  },
});
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
            t.revision_started_at,

            t.submission_note,
            t.submitted_at,

            t.reviewed_at,
            t.reviewed_by,

            reviewer.name
              AS reviewed_by_name,

            t.teacher_comment,
            t.teacher_file,

            t.task_order,

            t.created_at,
            t.updated_at

          FROM project_tasks t

          LEFT JOIN users u
            ON t.assignee_id = u.id

          LEFT JOIN users reviewer
            ON t.reviewed_by = reviewer.id

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

// =========================================================
// 13. อัปโหลดเอกสารแนบของงาน
// =========================================================

app.post(
  "/student/tasks/:taskId/files",

  uploadTaskFile.single("file"),

  (req, res) => {
    const { taskId } = req.params;

    const studentId = Number(req.body.student_id);

    if (!studentId || !req.file) {
      if (req.file?.path) {
        fs.unlinkSync(req.file.path);
      }

      return res.status(400).json({
        message: "ข้อมูลไฟล์ไม่ครบถ้วน",
      });
    }

    const checkSql = `
      SELECT
        t.id,
        t.project_id,
        t.review_status

      FROM project_tasks t

      INNER JOIN project_members pm
        ON pm.project_id =
           t.project_id

      WHERE t.id = ?
        AND pm.user_id = ?

      LIMIT 1
    `;

    db.query(checkSql, [taskId, studentId], (checkErr, rows) => {
      if (checkErr) {
        fs.unlinkSync(req.file.path);

        console.log("Check task file error:", checkErr);

        return res.status(500).json({
          message: "Database Error",
        });
      }

      if (rows.length === 0) {
        fs.unlinkSync(req.file.path);

        return res.status(403).json({
          message: "คุณไม่มีสิทธิ์แนบไฟล์ในงานนี้",
        });
      }

      if (
        rows[0].review_status === "รอตรวจ" ||
        rows[0].review_status === "ผ่าน"
      ) {
        fs.unlinkSync(req.file.path);

        return res.status(400).json({
          message: "ไม่สามารถแนบไฟล์ได้ เนื่องจากงานถูกส่งให้อาจารย์ตรวจแล้ว",
        });
      }

      const filePath = `/uploads/task-files/${req.file.filename}`;

      const insertSql = `
          INSERT INTO task_files
          (
            task_id,
            uploader_id,
            original_name,
            stored_name,
            file_path,
            mime_type,
            file_size
          )

          VALUES (?, ?, ?, ?, ?, ?, ?)
        `;

      db.query(
        insertSql,
        [
          taskId,

          studentId,

          req.file.originalname,

          req.file.filename,

          filePath,

          req.file.mimetype,

          req.file.size,
        ],
        (insertErr, result) => {
          if (insertErr) {
            fs.unlinkSync(req.file.path);

            console.log("Insert task file error:", insertErr);

            return res.status(500).json({
              message: "ไม่สามารถบันทึกไฟล์ได้",
            });
          }

          res.json({
            success: true,

            message: "แนบเอกสารเรียบร้อยแล้ว",

            file_id: result.insertId,
          });
        },
      );
    });
  },
);

// =========================================================
// 14. ดูรายการเอกสารแนบ
// =========================================================

app.get(
  "/student/tasks/:taskId/files",

  (req, res) => {
    const { taskId } = req.params;

    const sql = `
      SELECT
        tf.id,
        tf.task_id,
        tf.uploader_id,

        tf.original_name,
        tf.file_path,
        tf.mime_type,
        tf.file_size,
        tf.uploaded_at,

        u.username
          AS uploader_username,

        u.name
          AS uploader_name

      FROM task_files tf

      INNER JOIN users u
        ON tf.uploader_id =
           u.id

      WHERE tf.task_id = ?

      ORDER BY
        tf.uploaded_at DESC,
        tf.id DESC
    `;

    db.query(sql, [taskId], (err, rows) => {
      if (err) {
        console.log("Get task files error:", err);

        return res.status(500).json({
          message: "Database Error",
        });
      }

      res.json(rows);
    });
  },
);

// =========================================================
// 15. ลบเอกสารแนบ
// =========================================================

app.delete(
  "/student/task-files/:fileId",

  (req, res) => {
    const { fileId } = req.params;

    const studentId = Number(req.body.student_id);

    const findSql = `
      SELECT
        tf.*,
        t.review_status

      FROM task_files tf

      INNER JOIN project_tasks t
        ON tf.task_id = t.id

      WHERE tf.id = ?
        AND tf.uploader_id = ?

      LIMIT 1
    `;

    db.query(findSql, [fileId, studentId], (findErr, rows) => {
      if (findErr) {
        return res.status(500).json({
          message: "Database Error",
        });
      }

      if (rows.length === 0) {
        return res.status(403).json({
          message: "คุณไม่มีสิทธิ์ลบไฟล์นี้",
        });
      }

      const file = rows[0];

      if (file.review_status === "รอตรวจ" || file.review_status === "ผ่าน") {
        return res.status(403).json({
          message: "ไม่สามารถลบเอกสารได้ เนื่องจากงานถูกส่งตรวจแล้ว",
        });
      }

      db.query(
        `
            DELETE
            FROM task_files

            WHERE id = ?
          `,
        [fileId],
        (deleteErr) => {
          if (deleteErr) {
            return res.status(500).json({
              message: "ไม่สามารถลบไฟล์ได้",
            });
          }

          const realPath = path.join(
            __dirname,
            file.file_path.replace(/^\//, ""),
          );

          if (fs.existsSync(realPath)) {
            fs.unlinkSync(realPath);
          }

          res.json({
            success: true,

            message: "ลบเอกสารเรียบร้อยแล้ว",
          });
        },
      );
    });
  },
);

/* =========================================================
   STUDENT - SUBMIT TASK WITH SUBMISSION HISTORY
========================================================= */

// โฟลเดอร์เก็บสำเนาเอกสารของแต่ละรอบการส่ง

const taskSubmissionDir = path.join(__dirname, "uploads", "task-submissions");

fs.mkdirSync(taskSubmissionDir, {
  recursive: true,
});

// =========================================
// ส่งงานให้อาจารย์ตรวจ
// =========================================

app.post("/student/tasks/:taskId/submit-review", async (req, res) => {
  const taskId = Number(req.params.taskId);
  const studentId = Number(req.body.student_id);

  const submissionNote = String(req.body.submission_note || "").trim();

  // =========================================
  // ตรวจข้อมูลเบื้องต้น
  // =========================================

  if (
    !Number.isInteger(taskId) ||
    taskId <= 0 ||
    !Number.isInteger(studentId) ||
    studentId <= 0
  ) {
    return res.status(400).json({
      message: "รหัสงานหรือรหัสนิสิตไม่ถูกต้อง",
    });
  }

  // =========================================
  // ฟังก์ชันช่วยจัดการ Database
  // =========================================

  const acquireConnection = () => {
    return new Promise((resolve, reject) => {
      if (typeof db.getConnection === "function") {
        db.getConnection((err, connection) => {
          if (err) {
            reject(err);
          } else {
            resolve({
              connection,
              fromPool: true,
            });
          }
        });
      } else {
        resolve({
          connection: db,
          fromPool: false,
        });
      }
    });
  };

  const query = (connection, sql, params = []) => {
    return new Promise((resolve, reject) => {
      connection.query(sql, params, (err, result) => {
        if (err) {
          reject(err);
        } else {
          resolve(result);
        }
      });
    });
  };

  const transaction = (connection, action) => {
    return new Promise((resolve, reject) => {
      connection[action]((err) => {
        if (err) reject(err);
        else resolve();
      });
    });
  };

  const stop = (statusCode, message) => {
    const error = new Error(message);
    error.statusCode = statusCode;
    throw error;
  };

  let connection = null;
  let fromPool = false;
  let transactionStarted = false;

  // เก็บชื่อไฟล์ที่คัดลอกแล้ว
  // ถ้าบันทึกไม่สำเร็จจะได้ลบสำเนาออก

  const copiedFiles = [];

  try {
    // =========================================
    // 1. เริ่ม Transaction
    // =========================================

    const acquired = await acquireConnection();

    connection = acquired.connection;
    fromPool = acquired.fromPool;

    await transaction(connection, "beginTransaction");
    transactionStarted = true;

    // =========================================
    // 2. ตรวจงานและสิทธิ์นิสิต
    // =========================================

    const taskRows = await query(
      connection,
      `
        SELECT
          t.id,
          t.project_id,
          t.task_name,
          t.status,
          t.review_status,
          t.revision_started_at,

          p.advisor_id,

          student.name AS student_name

        FROM project_tasks t

        INNER JOIN projects p
          ON p.id = t.project_id

        INNER JOIN project_members pm
          ON pm.project_id = t.project_id

        INNER JOIN users student
          ON student.id = pm.user_id

        WHERE t.id = ?
          AND pm.user_id = ?

        LIMIT 1
        FOR UPDATE
      `,
      [taskId, studentId],
    );

    if (taskRows.length === 0) {
      stop(403, "คุณไม่มีสิทธิ์ส่งงานนี้");
    }

    const task = taskRows[0];

    // =========================================
    // 3. ตรวจสอบสถานะงาน
    // =========================================

    if (task.status !== "เสร็จสิ้น") {
      stop(400, "กรุณาดำเนินงานให้เสร็จสิ้นก่อนส่งให้อาจารย์ตรวจ");
    }

    if (task.review_status !== "ยังไม่ส่ง" && task.review_status !== "แก้ไข") {
      stop(409, "งานนี้อยู่ระหว่างรอตรวจหรือผ่านการตรวจแล้ว");
    }

    // ถ้าเป็นงานที่อาจารย์ส่งกลับมาให้แก้ไข
    // ต้องกดดำเนินการแก้ไขก่อน

    if (task.review_status === "แก้ไข" && !task.revision_started_at) {
      stop(409, "กรุณากดดำเนินการแก้ไขก่อนส่งงานรอบใหม่");
    }

    // =========================================
    // 4. ตรวจไฟล์ของนิสิต
    // =========================================

    const files = await query(
      connection,
      `
        SELECT
          id,
          original_name,
          stored_name,
          file_path,
          mime_type,
          file_size

        FROM task_files

        WHERE task_id = ?

        ORDER BY id ASC
        FOR UPDATE
      `,
      [taskId],
    );

    if (files.length === 0) {
      stop(400, "กรุณาแนบเอกสารอย่างน้อย 1 ไฟล์ก่อนส่งตรวจ");
    }

    // =========================================
    // 5. หาเลขรอบการส่งครั้งต่อไป
    // =========================================

    const roundRows = await query(
      connection,
      `
        SELECT
          COALESCE(
            MAX(submission_number),
            0
          ) + 1 AS next_round

        FROM task_submissions

        WHERE task_id = ?
      `,
      [taskId],
    );

    const submissionNumber = Number(roundRows[0].next_round) || 1;

    // =========================================
    // 6. เปลี่ยนสถานะงานเป็นรอตรวจ
    // =========================================

    await query(
      connection,
      `
        UPDATE project_tasks

        SET
          review_status = 'รอตรวจ',
          revision_started_at = NULL,

          submission_note = ?,
          submitted_at = NOW(),

          reviewed_at = NULL,
          reviewed_by = NULL,
          teacher_comment = NULL,
          teacher_file = NULL

        WHERE id = ?
      `,
      [submissionNote || null, taskId],
    );

    // =========================================
    // 7. สร้างประวัติการส่งรอบใหม่
    // =========================================

    const submissionResult = await query(
      connection,
      `
        INSERT INTO task_submissions
        (
          task_id,
          submission_number,
          student_id,
          submission_note,
          submitted_at,
          review_status
        )

        SELECT
          t.id,
          ?,
          ?,
          t.submission_note,
          t.submitted_at,
          'รอตรวจ'

        FROM project_tasks t

        WHERE t.id = ?
      `,
      [submissionNumber, studentId, taskId],
    );

    const submissionId = submissionResult.insertId;

    // =========================================
    // 8. คัดลอกเอกสารเก็บแยกแต่ละรอบ
    // =========================================

    for (const file of files) {
      if (!file.stored_name) {
        stop(409, `ไม่พบข้อมูลไฟล์ต้นฉบับ ${file.original_name}`);
      }

      // อ่านไฟล์จากโฟลเดอร์ task-files เดิม

      const sourcePath = path.join(
        taskUploadDir,
        path.basename(file.stored_name),
      );

      // ตั้งชื่อสำเนาใหม่ ป้องกันชนกัน

      const newStoredName =
        `submission-${submissionId}-${file.id}-` +
        path.basename(file.stored_name);

      const destinationPath = path.join(taskSubmissionDir, newStoredName);

      // ตรวจสอบว่ามีไฟล์จริง

      if (!fs.existsSync(sourcePath)) {
        stop(409, `ไม่พบไฟล์ ${file.original_name} ในเซิร์ฟเวอร์`);
      }

      // คัดลอกไฟล์จริง

      await fs.promises.copyFile(sourcePath, destinationPath);

      copiedFiles.push(destinationPath);

      // Path สำหรับเปิดไฟล์จากหน้าเว็บ

      const snapshotPath = `/uploads/task-submissions/${newStoredName}`;

      // บันทึกประวัติไฟล์

      await query(
        connection,
        `
          INSERT INTO task_submission_files
          (
            submission_id,
            original_name,
            stored_name,
            file_path,
            mime_type,
            file_size
          )

          VALUES (?, ?, ?, ?, ?, ?)
        `,
        [
          submissionId,
          file.original_name,
          newStoredName,
          snapshotPath,
          file.mime_type,
          file.file_size,
        ],
      );
    }

    // =========================================
    // 9. แจ้งเตือนอาจารย์
    // =========================================

    if (task.advisor_id) {
      const message =
        `${task.student_name} ส่งงาน "${task.task_name}" ` +
        `(ครั้งที่ ${submissionNumber}) มาให้คุณตรวจแล้ว`;

      await query(
        connection,
        `
          INSERT INTO notifications
          (
            user_id,
            message,
            project_id
          )

          VALUES (?, ?, ?)
        `,
        [task.advisor_id, message, task.project_id],
      );
    }

    // =========================================
    // 10. ยืนยันการบันทึก
    // =========================================

    await transaction(connection, "commit");
    transactionStarted = false;

    return res.json({
      success: true,
      message: `ส่งงานครั้งที่ ${submissionNumber} เรียบร้อยแล้ว`,
      submission_id: submissionId,
      submission_number: submissionNumber,
      uploaded_files: files.length,
    });
  } catch (err) {
    console.log("Submit task with history error:", err);

    // ย้อนกลับข้อมูลฐานข้อมูล

    if (transactionStarted && connection) {
      try {
        await transaction(connection, "rollback");
      } catch (rollbackErr) {
        console.log("Rollback error:", rollbackErr);
      }
    }

    // ลบสำเนาไฟล์ที่สร้างระหว่างการบันทึก
    // กรณีเกิดข้อผิดพลาด

    for (const filePath of copiedFiles) {
      try {
        await fs.promises.unlink(filePath);
      } catch (fileErr) {
        console.log("Remove snapshot error:", fileErr);
      }
    }

    const statusCode = err.statusCode || 500;

    return res.status(statusCode).json({
      message:
        statusCode === 500 ? "ไม่สามารถส่งงานและบันทึกประวัติได้" : err.message,
    });
  } finally {
    // คืน Connection ให้ Pool

    if (fromPool && connection && typeof connection.release === "function") {
      connection.release();
    }
  }
});

/* =========================================================
   TEACHER WORK - TASK REVIEW LIST
========================================================= */

app.get("/teacher/work/reviews/:advisorId", (req, res) => {
  const { advisorId } = req.params;

  const sql = `
  SELECT
    t.id,
    t.project_id,
    t.task_name,
    t.review_status,
    t.submitted_at,
    t.reviewed_at,

    p.title AS project_title,

    u.name AS assignee_name,

    -- เลขรอบการส่งล่าสุด
    last_submission.latest_round AS submission_number,

    -- ผลการตรวจของรอบก่อนหน้า
    previous_submission.review_status
      AS previous_review_status

  FROM project_tasks t

  INNER JOIN projects p
    ON t.project_id = p.id

  LEFT JOIN users u
    ON t.assignee_id = u.id

  -- หาเลขรอบล่าสุดของแต่ละงาน
  LEFT JOIN (
    SELECT
      task_id,
      MAX(submission_number) AS latest_round

    FROM task_submissions

    GROUP BY task_id
  ) last_submission
    ON last_submission.task_id = t.id

  -- ตรวจว่ารอบก่อนหน้าถูกสั่งแก้ไขหรือไม่
  LEFT JOIN task_submissions previous_submission
    ON previous_submission.task_id = t.id
    AND previous_submission.submission_number =
        last_submission.latest_round - 1

  WHERE p.advisor_id = ?
    AND t.submitted_at IS NOT NULL
    AND t.review_status IN (
      'รอตรวจ',
      'ผ่าน',
      'แก้ไข'
    )

  ORDER BY
    CASE
      WHEN t.review_status = 'รอตรวจ' THEN 0
      ELSE 1
    END,
    t.submitted_at DESC,
    t.id DESC
`;

  db.query(sql, [advisorId], (err, results) => {
    if (err) {
      console.log("Get teacher work reviews error:", err);

      return res.status(500).json({
        message: "ไม่สามารถโหลดรายการตรวจงานได้",
      });
    }

    res.json({
      tasks: results,
    });
  });
});

/* =========================================================
   TEACHER WORK - REVIEW TASK DETAIL
========================================================= */

app.get("/teacher/work/review/:taskId/:advisorId", (req, res) => {
  const { taskId, advisorId } = req.params;

  // =========================================
  // 1. ข้อมูลรายละเอียดงาน
  // =========================================

  const taskSql = `
    SELECT
      t.id,
      t.project_id,
      t.phase_id,
      t.task_name,
      t.description,
      t.status,
      t.review_status,
      t.start_date,
      t.due_date,
      t.submission_note,
      t.submitted_at,
      t.reviewed_at,
      t.reviewed_by,
      t.teacher_comment,
      t.teacher_file,

      p.title AS project_title,

      ph.phase_name,
      ph.phase_order,

      student.name AS assignee_name,
      reviewer.name AS reviewed_by_name

    FROM project_tasks t

    INNER JOIN projects p
      ON t.project_id = p.id

    LEFT JOIN project_phases ph
      ON t.phase_id = ph.id

    LEFT JOIN users student
      ON t.assignee_id = student.id

    LEFT JOIN users reviewer
      ON t.reviewed_by = reviewer.id

    WHERE t.id = ?
      AND p.advisor_id = ?

    LIMIT 1
  `;

  db.query(taskSql, [taskId, advisorId], (err, tasks) => {
    if (err) {
      console.log("Get teacher task detail error:", err);

      return res.status(500).json({
        message: "ไม่สามารถโหลดรายละเอียดงานได้",
      });
    }

    if (tasks.length === 0) {
      return res.status(404).json({
        message: "ไม่พบงาน หรือคุณไม่มีสิทธิ์ตรวจงานนี้",
      });
    }

    const task = tasks[0];

    // =========================================
    // 2. ดึงรายการ Subtask
    // =========================================

    const subtaskSql = `
      SELECT
        id,
        task_id,
        subtask_name,
        status,
        subtask_order

      FROM project_subtasks

      WHERE task_id = ?

      ORDER BY subtask_order ASC, id ASC
    `;

    db.query(subtaskSql, [taskId], (subtaskErr, subtasks) => {
      if (subtaskErr) {
        console.log("Get review subtasks error:", subtaskErr);

        return res.status(500).json({
          message: "ไม่สามารถโหลด Subtask ได้",
        });
      }

      // =========================================
      // 3. ดึงเอกสารแนบของนิสิต
      // =========================================

      const fileSql = `
        SELECT
          tf.id,
          tf.task_id,
          tf.original_name,
          tf.file_path,
          tf.file_size,
          tf.mime_type,
          tf.uploaded_at,

          u.name AS uploader_name

        FROM task_files tf

        LEFT JOIN users u
          ON tf.uploader_id = u.id

        WHERE tf.task_id = ?

        ORDER BY tf.uploaded_at DESC, tf.id DESC
      `;

      db.query(fileSql, [taskId], (fileErr, files) => {
        if (fileErr) {
          console.log("Get review files error:", fileErr);

          return res.status(500).json({
            message: "ไม่สามารถโหลดเอกสารแนบได้",
          });
        }

        // =========================================
        // RESPONSE
        // =========================================

        res.json({
          task,
          subtasks,
          files,
        });
      });
    });
  });
});

/* =========================================================
   TEACHER REVIEW - MULTIPLE FILE UPLOAD
========================================================= */

// โฟลเดอร์เก็บไฟล์ตรวจงานของอาจารย์

const teacherReviewUploadDir = path.join(
  __dirname,
  "uploads",
  "teacher-review-files",
);

if (!fs.existsSync(teacherReviewUploadDir)) {
  fs.mkdirSync(teacherReviewUploadDir, {
    recursive: true,
  });
}

// ตั้งค่าการเก็บไฟล์

const teacherReviewStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, teacherReviewUploadDir);
  },

  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();

    const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;

    cb(null, uniqueName);
  },
});

// ประเภทไฟล์ที่อนุญาต

const allowedTeacherReviewExtensions = [
  ".pdf",
  ".doc",
  ".docx",
  ".ppt",
  ".pptx",
  ".jpg",
  ".jpeg",
  ".png",
];

const uploadTeacherReviewFiles = multer({
  storage: teacherReviewStorage,

  limits: {
    fileSize: 10 * 1024 * 1024,
    files: 10,
  },

  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();

    if (
      allowedTeacherReviewExtensions.includes(ext) &&
      allowedTaskFileTypes.includes(file.mimetype)
    ) {
      cb(null, true);
    } else {
      cb(new Error("ประเภทไฟล์ไม่ถูกต้อง"));
    }
  },
}).array("files", 10);

/* =========================================================
   SAVE TEACHER REVIEW
========================================================= */

app.post("/teacher/work/review/:taskId/submit", (req, res) => {
  uploadTeacherReviewFiles(req, res, async (uploadErr) => {
    const { taskId } = req.params;

    const files = req.files || [];

    // ลบไฟล์ที่อัปโหลดชั่วคราว เมื่อบันทึกไม่สำเร็จ

    const cleanupFiles = () => {
      for (const file of files) {
        try {
          if (fs.existsSync(file.path)) {
            fs.unlinkSync(file.path);
          }
        } catch (err) {
          console.log("Cleanup file error:", err);
        }
      }
    };

    if (uploadErr) {
      cleanupFiles();

      return res.status(400).json({
        message: uploadErr.message,
      });
    }

    const advisorId = Number(req.body.advisor_id);

    const decision = req.body.decision;

    const teacherComment = String(req.body.teacher_comment || "").trim();

    // =========================================
    // VALIDATION
    // =========================================

    if (
      !Number.isInteger(Number(taskId)) ||
      Number(taskId) <= 0 ||
      !Number.isInteger(advisorId) ||
      advisorId <= 0
    ) {
      cleanupFiles();

      return res.status(400).json({
        message: "รหัสงานหรือรหัสอาจารย์ไม่ถูกต้อง",
      });
    }

    if (decision !== "ผ่าน" && decision !== "แก้ไข") {
      cleanupFiles();

      return res.status(400).json({
        message: "กรุณาเลือกผลการตรวจงาน",
      });
    }

    if (decision === "แก้ไข" && !teacherComment) {
      cleanupFiles();

      return res.status(400).json({
        message: "กรุณากรอกข้อเสนอแนะสำหรับงานที่ต้องแก้ไข",
      });
    }

    // รองรับ db ที่เป็น mysql2 connection หรือ pool

    const acquireConnection = () => {
      return new Promise((resolve, reject) => {
        if (typeof db.getConnection === "function") {
          db.getConnection((err, connection) => {
            if (err) {
              reject(err);
            } else {
              resolve({
                connection,
                fromPool: true,
              });
            }
          });
        } else {
          resolve({
            connection: db,
            fromPool: false,
          });
        }
      });
    };

    const runQuery = (connection, sql, params = []) => {
      return new Promise((resolve, reject) => {
        connection.query(sql, params, (err, rows) => {
          if (err) {
            reject(err);
          } else {
            resolve(rows);
          }
        });
      });
    };

    const beginTransaction = (connection) => {
      return new Promise((resolve, reject) => {
        connection.beginTransaction((err) => {
          if (err) reject(err);
          else resolve();
        });
      });
    };

    const commitTransaction = (connection) => {
      return new Promise((resolve, reject) => {
        connection.commit((err) => {
          if (err) reject(err);
          else resolve();
        });
      });
    };

    const rollbackTransaction = (connection) => {
      return new Promise((resolve) => {
        connection.rollback(() => resolve());
      });
    };

    let connection = null;
    let fromPool = false;
    let transactionStarted = false;

    try {
      const acquired = await acquireConnection();

      connection = acquired.connection;
      fromPool = acquired.fromPool;

      await beginTransaction(connection);
      transactionStarted = true;

      // =========================================
      // 1. ตรวจสอบงานและอาจารย์
      // =========================================

      const taskRows = await runQuery(
        connection,
        `
          SELECT
            t.id,
            t.project_id,
            t.task_name,
            t.review_status,
            t.submitted_at

          FROM project_tasks t

          INNER JOIN projects p
            ON t.project_id = p.id

          INNER JOIN users reviewer
            ON reviewer.id = p.advisor_id
            AND reviewer.role = 'teacher'

          WHERE t.id = ?
            AND p.advisor_id = ?

          LIMIT 1
          FOR UPDATE
        `,
        [taskId, advisorId],
      );

      if (taskRows.length === 0) {
        await rollbackTransaction(connection);
        transactionStarted = false;
        cleanupFiles();

        return res.status(403).json({
          message: "ไม่พบงาน หรือคุณไม่มีสิทธิ์ตรวจงานนี้",
        });
      }

      const task = taskRows[0];

      // งานต้องอยู่สถานะรอตรวจเท่านั้น

      if (task.review_status !== "รอตรวจ" || !task.submitted_at) {
        await rollbackTransaction(connection);
        transactionStarted = false;
        cleanupFiles();

        return res.status(409).json({
          message: "งานนี้ไม่ได้อยู่ในสถานะรอตรวจ",
        });
      }

      // =========================================
      // 2. บันทึกผลการตรวจ
      // =========================================

      await runQuery(
        connection,
        `
    UPDATE project_tasks

    SET
      review_status = ?,
      reviewed_at = NOW(),
      reviewed_by = ?,
      teacher_comment = ?,
      teacher_file = NULL,
      revision_started_at = NULL,

      status = CASE
        WHEN ? = 'แก้ไข'
          THEN 'กำลังดำเนินการ'
        ELSE status
      END

    WHERE id = ?
      AND review_status = 'รอตรวจ'
  `,
        [decision, advisorId, teacherComment || null, decision, taskId],
      );

      // =========================================
      // 2.1 บันทึกผลตรวจลงประวัติการส่งงาน
      // =========================================

      // ค้นหาการส่งงานรอบปัจจุบัน

      const submissionRows = await runQuery(
        connection,
        `
          SELECT
            id,
            submission_number,
            review_status

          FROM task_submissions

          WHERE task_id = ?
            AND submitted_at = ?

          ORDER BY id DESC

          LIMIT 1
          FOR UPDATE
        `,
        [taskId, task.submitted_at],
      );

      // งานเก่าที่ไม่มีประวัติจะยังตรวจได้ตามปกติ

      if (submissionRows.length > 0) {
        const submission = submissionRows[0];

        // ตรวจสอบว่ายังรอการตรวจ

        if (submission.review_status !== "รอตรวจ") {
          throw new Error("ประวัติการส่งงานรอบนี้ได้รับการตรวจแล้ว");
        }

        // อัปเดตผลการตรวจของรอบนั้น

        const historyResult = await runQuery(
          connection,
          `
            UPDATE task_submissions

            SET
              review_status = ?,
              reviewed_at = NOW(),
              reviewed_by = ?,
              teacher_comment = ?

            WHERE id = ?
              AND review_status = 'รอตรวจ'
          `,
          [decision, advisorId, teacherComment || null, submission.id],
        );

        if (historyResult.affectedRows !== 1) {
          throw new Error("ไม่สามารถอัปเดตประวัติการตรวจงานได้");
        }
      }

      // =========================================
      // 3. บันทึกไฟล์หลายรายการ
      // =========================================

      for (const file of files) {
        const filePath = `/uploads/teacher-review-files/${file.filename}`;

        await runQuery(
          connection,
          `
            INSERT INTO task_review_files
            (
              task_id,
              reviewer_id,
              submitted_at,
              original_name,
              stored_name,
              file_path,
              mime_type,
              file_size
            )

            SELECT
              t.id,
              ?,
              t.submitted_at,
              ?,
              ?,
              ?,
              ?,
              ?

            FROM project_tasks t
            WHERE t.id = ?
          `,
          [
            advisorId,
            file.originalname,
            file.filename,
            filePath,
            file.mimetype,
            file.size,
            taskId,
          ],
        );
      }

      // =========================================
      // 4. แจ้งเตือนนิสิตในโครงงาน
      // =========================================

      const message =
        decision === "ผ่าน"
          ? `อาจารย์ตรวจงาน "${task.task_name}" ผ่านแล้ว`
          : `อาจารย์ส่งงาน "${task.task_name}" กลับให้แก้ไข`;

      await runQuery(
        connection,
        `
          INSERT INTO notifications
          (
            user_id,
            message,
            project_id
          )

          SELECT DISTINCT
            pm.user_id,
            ?,
            ?

          FROM project_members pm

          WHERE pm.project_id = ?
        `,
        [message, task.project_id, task.project_id],
      );

      // =========================================
      // 5. ยืนยันการบันทึกทั้งหมด
      // =========================================

      await commitTransaction(connection);
      transactionStarted = false;

      return res.json({
        success: true,
        message: "บันทึกผลการตรวจเรียบร้อยแล้ว",
        review_status: decision,
        uploaded_files: files.length,
      });
    } catch (err) {
      console.log("Save teacher review error:", err);

      if (transactionStarted && connection) {
        await rollbackTransaction(connection);
      }

      cleanupFiles();

      return res.status(500).json({
        message: "ไม่สามารถบันทึกผลการตรวจได้",
      });
    } finally {
      if (fromPool && connection && typeof connection.release === "function") {
        connection.release();
      }
    }
  });
});

/* =========================================================
   STUDENT - GET TEACHER REVIEW FILES
========================================================= */

app.get("/student/tasks/:taskId/review-files/:studentId", (req, res) => {
  const { taskId, studentId } = req.params;

  const sql = `
    SELECT
      rf.id,
      rf.task_id,
      rf.reviewer_id,

      rf.original_name,
      rf.file_path,
      rf.mime_type,
      rf.file_size,
      rf.created_at,

      reviewer.name AS reviewer_name

    FROM task_review_files rf

    INNER JOIN project_tasks t
      ON rf.task_id = t.id
      AND rf.submitted_at = t.submitted_at

    INNER JOIN project_members pm
      ON pm.project_id = t.project_id
      AND pm.user_id = ?

    LEFT JOIN users reviewer
      ON rf.reviewer_id = reviewer.id

    WHERE rf.task_id = ?
      AND t.review_status IN ('ผ่าน', 'แก้ไข')

    ORDER BY
      rf.created_at DESC,
      rf.id DESC
  `;

  db.query(sql, [studentId, taskId], (err, results) => {
    if (err) {
      console.log("Get teacher review files error:", err);

      return res.status(500).json({
        message: "ไม่สามารถโหลดไฟล์ของอาจารย์ได้",
      });
    }

    res.json({
      files: results,
    });
  });
});

/* =========================================================
   STUDENT - START TASK REVISION
========================================================= */

app.put("/student/tasks/:taskId/start-revision", (req, res) => {
  const taskId = Number(req.params.taskId);
  const studentId = Number(req.body.student_id);

  if (
    !Number.isInteger(taskId) ||
    taskId <= 0 ||
    !Number.isInteger(studentId) ||
    studentId <= 0
  ) {
    return res.status(400).json({
      message: "ข้อมูลนิสิตหรืองานไม่ถูกต้อง",
    });
  }

  const sql = `
    UPDATE project_tasks t

    INNER JOIN project_members pm
      ON pm.project_id = t.project_id

    SET
      t.revision_started_at = NOW(),
      t.status = 'กำลังดำเนินการ'

    WHERE t.id = ?
      AND pm.user_id = ?
      AND t.review_status = 'แก้ไข'
      AND t.revision_started_at IS NULL
  `;

  db.query(sql, [taskId, studentId], (err, result) => {
    if (err) {
      console.log("Start revision error:", err);

      return res.status(500).json({
        message: "ไม่สามารถเริ่มแก้ไขงานได้",
      });
    }

    if (result.affectedRows === 0) {
      return res.status(409).json({
        message: "ไม่สามารถเริ่มแก้ไขงานได้ กรุณาตรวจสอบสถานะหรือรีเฟรชหน้า",
      });
    }

    res.json({
      success: true,
      message: "เริ่มดำเนินการแก้ไขงานเรียบร้อยแล้ว",
    });
  });
});

/* =========================================================
   STUDENT - SUBMITTED DOCUMENTS AND TASKS
========================================================= */

app.get("/student/projects/:projectId/submissions/:studentId", (req, res) => {
  const projectId = Number(req.params.projectId);
  const studentId = Number(req.params.studentId);

  if (
    !Number.isInteger(projectId) ||
    projectId <= 0 ||
    !Number.isInteger(studentId) ||
    studentId <= 0
  ) {
    return res.status(400).json({
      message: "รหัสโครงงานหรือรหัสนิสิตไม่ถูกต้อง",
    });
  }

  // =========================================
  // 1. ตรวจสอบสมาชิกโครงงาน
  // =========================================

  const projectSql = `
      SELECT
        p.id,
        p.title

      FROM projects p

      INNER JOIN project_members pm
        ON pm.project_id = p.id

      WHERE p.id = ?
        AND pm.user_id = ?

      LIMIT 1
    `;

  db.query(projectSql, [projectId, studentId], (projectErr, projectRows) => {
    if (projectErr) {
      console.log("Get submission project error:", projectErr);

      return res.status(500).json({
        message: "ไม่สามารถโหลดข้อมูลโครงงานได้",
      });
    }

    if (projectRows.length === 0) {
      return res.status(403).json({
        message: "ไม่พบโครงงาน หรือคุณไม่ใช่สมาชิกโครงงานนี้",
      });
    }

    const project = projectRows[0];

    // =========================================
    // 2. ดึงเฉพาะงานที่ส่งอาจารย์แล้ว
    // =========================================

    const taskSql = `
          SELECT
            t.id AS task_id,
            t.task_name,
            t.review_status,
            t.submitted_at,
            
            (
              SELECT COUNT(*)
              FROM task_submissions ts
              WHERE ts.task_id = t.id
            ) AS submission_count,


            ph.id AS phase_id,
            ph.phase_name,
            ph.phase_order

          FROM project_tasks t

          LEFT JOIN project_phases ph
            ON ph.id = t.phase_id

          WHERE t.project_id = ?
            AND t.submitted_at IS NOT NULL

          ORDER BY
            t.submitted_at DESC,
            t.id DESC
        `;

    db.query(taskSql, [projectId], (taskErr, tasks) => {
      if (taskErr) {
        console.log("Get submitted tasks error:", taskErr);

        return res.status(500).json({
          message: "ไม่สามารถโหลดรายการงานที่ส่งได้",
        });
      }

      if (tasks.length === 0) {
        return res.json({
          project,
          submissions: [],
        });
      }

      // =========================================
      // 3. ดึงไฟล์ที่อัปโหลดก่อนหรือขณะส่งงาน
      // =========================================

      const fileSql = `
  SELECT
    sf.id,
    ts.task_id,
    sf.original_name,
    sf.file_path,
    sf.file_size,

    ts.submitted_at AS uploaded_at

  FROM task_submission_files sf

  INNER JOIN task_submissions ts
    ON ts.id = sf.submission_id

  INNER JOIN project_tasks t
    ON t.id = ts.task_id

  WHERE t.project_id = ?

    AND ts.id = (
      SELECT latest.id
      FROM task_submissions latest

      WHERE latest.task_id = ts.task_id

      ORDER BY
        latest.submission_number DESC,
        latest.id DESC

      LIMIT 1
    )

  ORDER BY sf.id DESC
`;

      db.query(fileSql, [projectId], (fileErr, files) => {
        if (fileErr) {
          console.log("Get submitted files error:", fileErr);

          return res.status(500).json({
            message: "ไม่สามารถโหลดเอกสารที่ส่งได้",
          });
        }

        // =========================================
        // 4. จัดไฟล์ให้ตรงกับแต่ละงาน
        // =========================================

        const submissions = tasks.map((task) => {
          const taskFiles = files.filter(
            (file) => Number(file.task_id) === Number(task.task_id),
          );

          return {
            ...task,
            files: taskFiles,
          };
        });

        // =========================================
        // RESPONSE
        // =========================================

        res.json({
          project,
          submissions,
        });
      });
    });
  });
});

/* =========================================================
   STUDENT - TASK SUBMISSION HISTORY
========================================================= */

app.get(
  "/student/tasks/:taskId/submission-history/:studentId",
  async (req, res) => {
    const taskId = Number(req.params.taskId);
    const studentId = Number(req.params.studentId);

    if (
      !Number.isInteger(taskId) ||
      taskId <= 0 ||
      !Number.isInteger(studentId) ||
      studentId <= 0
    ) {
      return res.status(400).json({
        message: "รหัสงานหรือรหัสนิสิตไม่ถูกต้อง",
      });
    }

    const query = (sql, params = []) => {
      return new Promise((resolve, reject) => {
        db.query(sql, params, (err, results) => {
          if (err) {
            reject(err);
          } else {
            resolve(results);
          }
        });
      });
    };

    try {
      // =========================================
      // 1. ตรวจสิทธิ์และดึงข้อมูลงาน
      // =========================================

      const taskRows = await query(
        `
          SELECT
            t.id,
            t.project_id,
            t.task_name,
            t.review_status,

            p.title AS project_title,
            ph.phase_name

          FROM project_tasks t

          INNER JOIN projects p
            ON p.id = t.project_id

          LEFT JOIN project_phases ph
            ON ph.id = t.phase_id

          INNER JOIN project_members pm
            ON pm.project_id = t.project_id

          WHERE t.id = ?
            AND pm.user_id = ?

          LIMIT 1
        `,
        [taskId, studentId],
      );

      if (taskRows.length === 0) {
        return res.status(403).json({
          message: "ไม่พบงานหรือคุณไม่มีสิทธิ์ดูประวัตินี้",
        });
      }

      const task = taskRows[0];

      // =========================================
      // 2. ดึงประวัติการส่งทุกครั้ง
      // =========================================

      const submissions = await query(
        `
          SELECT
            ts.id,
            ts.task_id,
            ts.submission_number,
            ts.student_id,
            ts.submission_note,
            ts.submitted_at,

            ts.review_status,
            ts.reviewed_at,
            ts.reviewed_by,
            ts.teacher_comment,

            student.name AS student_name,
            reviewer.name AS reviewer_name

          FROM task_submissions ts

          LEFT JOIN users student
            ON student.id = ts.student_id

          LEFT JOIN users reviewer
            ON reviewer.id = ts.reviewed_by

          WHERE ts.task_id = ?

          ORDER BY
            ts.submission_number DESC,
            ts.id DESC
        `,
        [taskId],
      );

      // =========================================
      // 3. ดึงไฟล์ที่นิสิตส่งในแต่ละรอบ
      // =========================================

      const submittedFiles = await query(
        `
          SELECT
            sf.id,
            sf.submission_id,
            sf.original_name,
            sf.file_path,
            sf.file_size,
            sf.mime_type

          FROM task_submission_files sf

          INNER JOIN task_submissions ts
            ON ts.id = sf.submission_id

          WHERE ts.task_id = ?

          ORDER BY sf.id ASC
        `,
        [taskId],
      );

      // =========================================
      // 4. ดึงไฟล์ที่อาจารย์แนบแต่ละรอบ
      // =========================================

      const teacherFiles = await query(
        `
          SELECT
            rf.id,
            ts.id AS submission_id,
            rf.original_name,
            rf.file_path,
            rf.file_size,
            rf.mime_type

          FROM task_review_files rf

          INNER JOIN task_submissions ts
            ON ts.task_id = rf.task_id
            AND ts.submitted_at = rf.submitted_at

          WHERE ts.task_id = ?

          ORDER BY rf.id ASC
        `,
        [taskId],
      );

      // =========================================
      // 5. จัดไฟล์เข้าแต่ละรอบการส่ง
      // =========================================

      const history = submissions.map((submission) => {
        const files = submittedFiles.filter(
          (file) => Number(file.submission_id) === Number(submission.id),
        );

        const reviewFiles = teacherFiles.filter(
          (file) => Number(file.submission_id) === Number(submission.id),
        );

        return {
          ...submission,
          files,
          teacher_files: reviewFiles,
        };
      });

      // =========================================
      // RESPONSE
      // =========================================

      res.json({
        task,
        history,
      });
    } catch (err) {
      console.log("Get submission history error:", err);

      return res.status(500).json({
        message: "ไม่สามารถโหลดประวัติการส่งงานได้",
      });
    }
  },
);

/* =========================================================
   STUDENT - CHECK EXAM READINESS
========================================================= */

app.get(
  "/student/projects/:projectId/exam-readiness/:studentId",
  (req, res) => {
    const projectId = Number(req.params.projectId);
    const studentId = Number(req.params.studentId);

    if (
      !Number.isInteger(projectId) ||
      projectId <= 0 ||
      !Number.isInteger(studentId) ||
      studentId <= 0
    ) {
      return res.status(400).json({
        message: "ข้อมูลโครงงานหรือนิสิตไม่ถูกต้อง",
      });
    }

    const sql = `
      SELECT
        p.id AS project_id,
        p.title,

        (
          SELECT COUNT(*)
          FROM project_phases
          WHERE project_id = p.id
        ) AS total_phases,

        (
          SELECT COUNT(*)
          FROM project_tasks
          WHERE project_id = p.id
        ) AS total_tasks,

        (
          SELECT COUNT(*)
          FROM project_tasks
          WHERE project_id = p.id
            AND status = 'เสร็จสิ้น'
            AND review_status = 'ผ่าน'
        ) AS passed_tasks,

        (
          SELECT COUNT(*)
          FROM project_exam_schedules
          WHERE project_id = p.id
        ) AS existing_exams,

        (
          SELECT COUNT(*)
          FROM project_exam_requests
          WHERE project_id = p.id
            AND status IN ('รอพิจารณา', 'อนุมัติ')
        ) AS active_requests

      FROM projects p

      WHERE p.id = ?
        AND EXISTS (
          SELECT 1
          FROM project_members pm
          WHERE pm.project_id = p.id
            AND pm.user_id = ?
        )

      LIMIT 1
    `;

    db.query(sql, [projectId, studentId], (err, rows) => {
      if (err) {
        console.error("Exam readiness error:", err);

        return res.status(500).json({
          message: "ไม่สามารถตรวจสอบความพร้อมได้",
        });
      }

      if (rows.length === 0) {
        return res.status(404).json({
          message: "ไม่พบโครงงาน หรือคุณไม่ใช่สมาชิก",
        });
      }

      const data = rows[0];

      const totalPhases = Number(data.total_phases);
      const totalTasks = Number(data.total_tasks);
      const passedTasks = Number(data.passed_tasks);

      const reasons = [];

      if (totalPhases === 0) {
        reasons.push("ยังไม่ได้สร้างแผนงาน Phase");
      }

      if (totalTasks === 0) {
        reasons.push("ยังไม่มีงานในโครงงาน");
      } else if (passedTasks < totalTasks) {
        reasons.push("ยังมีงานที่ไม่เสร็จหรือยังไม่ผ่านการตรวจ");
      }

      if (Number(data.existing_exams) > 0) {
        reasons.push("โครงงานนี้มีกำหนดการสอบแล้ว");
      }

      if (Number(data.active_requests) > 0) {
        reasons.push("โครงงานนี้มีคำขอสอบที่กำลังดำเนินการ");
      }

      res.json({
        project_id: data.project_id,
        project_title: data.title,

        total_phases: totalPhases,
        total_tasks: totalTasks,
        passed_tasks: passedTasks,

        progress:
          totalTasks > 0 ? Math.round((passedTasks / totalTasks) * 100) : 0,

        can_request_exam: reasons.length === 0,
        reasons: reasons,
      });
    });
  },
);

/* =========================================================
   STUDENT - REQUEST PROJECT EXAM
========================================================= */

app.post("/student/projects/:projectId/exam-request", (req, res) => {
  const projectId = Number(req.params.projectId);
  const studentId = Number(req.body.student_id);
  const revisionNote = String(req.body.revision_note || "").trim();

  if (
    !Number.isInteger(projectId) ||
    projectId <= 0 ||
    !Number.isInteger(studentId) ||
    studentId <= 0
  ) {
    return res.status(400).json({
      message: "ข้อมูลโครงงานหรือนิสิตไม่ถูกต้อง",
    });
  }
  if (revisionNote.length > 2000) {
    return res.status(400).json({
      message: "รายละเอียดการแก้ไขต้องไม่เกิน 2000 ตัวอักษร",
    });
  }

  const sql = `
  INSERT INTO project_exam_requests (
    project_id,
    student_id,
    revision_note,
    exam_round
  )

  SELECT
    p.id,
    ?,
    ?,
    COALESCE(s.exam_round, 0) + 1

  FROM projects p

  LEFT JOIN project_exam_schedules s
    ON s.id = (
      SELECT s2.id
      FROM project_exam_schedules s2
      WHERE s2.project_id = p.id
      ORDER BY s2.exam_round DESC, s2.id DESC
      LIMIT 1
    )

  LEFT JOIN project_exam_results r
    ON r.schedule_id = s.id

  WHERE p.id = ?

    -- ต้องเป็นสมาชิกโครงงาน
    AND EXISTS (
      SELECT 1
      FROM project_members pm
      WHERE pm.project_id = p.id
        AND pm.user_id = ?
    )

    -- ต้องมี Phase
    AND EXISTS (
      SELECT 1
      FROM project_phases ph
      WHERE ph.project_id = p.id
    )

    -- ต้องมีงาน
    AND EXISTS (
      SELECT 1
      FROM project_tasks t
      WHERE t.project_id = p.id
    )

    -- ทุกงานต้องผ่านการตรวจ
    AND NOT EXISTS (
      SELECT 1
      FROM project_tasks t
      WHERE t.project_id = p.id
        AND (
          COALESCE(t.status, '') <> 'เสร็จสิ้น'
          OR COALESCE(t.review_status, '') <> 'ผ่าน'
        )
    )

    -- สอบครั้งแรก หรือสอบล่าสุดไม่ผ่าน
    AND (
      s.id IS NULL
      OR r.final_result_status = 'ไม่ผ่าน'
    )

    -- ห้ามมีคำขอค้างอยู่ในรอบที่จะสมัคร
    AND NOT EXISTS (
      SELECT 1
      FROM project_exam_requests er
      WHERE er.project_id = p.id
        AND er.exam_round = COALESCE(s.exam_round, 0) + 1
        AND er.status IN ('รอพิจารณา', 'อนุมัติ')
    )

    -- รอบใหม่ยังไม่เคยส่งคำขอ
    -- หรือคำขอล่าสุดถูกส่งกลับแก้ไข
    AND (
      NOT EXISTS (
        SELECT 1
        FROM project_exam_requests old_request
        WHERE old_request.project_id = p.id
          AND old_request.exam_round =
              COALESCE(s.exam_round, 0) + 1
      )

      OR (
        ? <> ''

        AND (
          SELECT last_request.status
          FROM project_exam_requests last_request
          WHERE last_request.project_id = p.id
            AND last_request.exam_round =
                COALESCE(s.exam_round, 0) + 1
          ORDER BY last_request.id DESC
          LIMIT 1
        ) = 'ส่งกลับแก้ไข'
      )
    )

  LIMIT 1
`;

  db.query(
    sql,
    [studentId, revisionNote, projectId, studentId, revisionNote],
    (err, result) => {
      if (err) {
        console.error("Exam request error:", err);

        return res.status(500).json({
          message: "ไม่สามารถส่งคำขอสอบได้",
        });
      }

      if (result.affectedRows === 0) {
        return res.status(403).json({
          message: "โครงงานยังไม่พร้อมขอสอบ หรือมีคำขอสอบอยู่แล้ว",
        });
      }

      return res.status(201).json({
        success: true,
        request_id: result.insertId,
        status: "รอพิจารณา",
        message: "ส่งคำขอสอบโครงงานเรียบร้อยแล้ว",
      });
    },
  );
});

/* =========================================================
   STUDENT - GET PROJECT EXAM REQUEST STATUS
========================================================= */

app.get("/student/projects/:projectId/exam-request/:studentId", (req, res) => {
  const projectId = Number(req.params.projectId);
  const studentId = Number(req.params.studentId);

  if (
    !Number.isInteger(projectId) ||
    projectId <= 0 ||
    !Number.isInteger(studentId) ||
    studentId <= 0
  ) {
    return res.status(400).json({
      message: "ข้อมูลโครงงานหรือนิสิตไม่ถูกต้อง",
    });
  }

  const sql = `
      
SELECT
  er.id,
  er.project_id,
  er.student_id,
  er.status,
  er.advisor_comment,
  er.requested_at,
  er.reviewed_at,
  er.exam_round,

  -- รอบล่าสุดที่มีผลสอบบันทึกแล้ว
  COALESCE(
    (
      SELECT MAX(r.exam_round)
      FROM project_exam_results r
      WHERE r.project_id = er.project_id
    ),
    0
  ) AS latest_result_round,

  -- ตรวจว่าคำขอนี้มีกำหนดการสอบแล้วหรือยัง
  EXISTS (
    SELECT 1
    FROM project_exam_schedules s
    WHERE s.project_id = er.project_id
      AND s.exam_round = er.exam_round
  ) AS has_schedule


      FROM project_exam_requests er

      WHERE er.project_id = ?

        AND EXISTS (
          SELECT 1
          FROM project_members pm
          WHERE pm.project_id = er.project_id
            AND pm.user_id = ?
        )

      ORDER BY er.id DESC
      LIMIT 1
    `;

  db.query(sql, [projectId, studentId], (err, rows) => {
    if (err) {
      console.error("Get exam request status error:", err);

      return res.status(500).json({
        message: "ไม่สามารถโหลดสถานะคำขอสอบได้",
      });
    }

    return res.json({
      request: rows[0] || null,
    });
  });
});

/* =========================================================
   TEACHER - GET PENDING EXAM REQUESTS
========================================================= */

app.get("/teacher/exam-requests/:advisorId", (req, res) => {
  const advisorId = Number(req.params.advisorId);

  if (!Number.isInteger(advisorId) || advisorId <= 0) {
    return res.status(400).json({
      message: "รหัสอาจารย์ไม่ถูกต้อง",
    });
  }

  const sql = `
    SELECT
      er.id AS request_id,
      er.project_id,
      er.student_id,
      er.status,
      er.revision_note,
      er.requested_at,

      p.title AS project_title,
      p.project_type,
      p.academic_year,

      u.username AS student_username,
      u.name AS student_name,

      members.student_names

    FROM project_exam_requests er

    INNER JOIN projects p
      ON er.project_id = p.id

    INNER JOIN users u
      ON er.student_id = u.id

    LEFT JOIN (
      SELECT
        pm.project_id,

        GROUP_CONCAT(
          CONCAT(s.username, ' ', s.name)
          ORDER BY pm.id ASC
          SEPARATOR ' | '
        ) AS student_names

      FROM project_members pm

      INNER JOIN users s
        ON pm.user_id = s.id

      GROUP BY pm.project_id
    ) members
      ON members.project_id = p.id

    
WHERE p.advisor_id = ?
  AND er.status IN ('รอพิจารณา', 'อนุมัติ')

  -- แสดงเฉพาะคำขอที่ยังไม่มีกำหนดการสอบของรอบนั้น
  AND NOT EXISTS (
    SELECT 1
    FROM project_exam_schedules s
    WHERE s.project_id = er.project_id
      AND s.exam_round = er.exam_round
  )


    ORDER BY er.requested_at DESC, er.id DESC
  `;

  db.query(sql, [advisorId], (err, rows) => {
    if (err) {
      console.error("Get exam requests error:", err);

      return res.status(500).json({
        message: "ไม่สามารถโหลดคำขอสอบโครงงานได้",
      });
    }

    res.json({
      pending: rows,
      pending_count: rows.filter((item) => item.status === "รอพิจารณา").length,
    });
  });
});

/* =========================================================
   TEACHER - REVIEW EXAM REQUEST
========================================================= */

app.put("/teacher/exam-requests/:requestId/review", (req, res) => {
  const requestId = Number(req.params.requestId);
  const advisorId = Number(req.body.advisor_id);
  const status = req.body.status;
  const comment = String(req.body.advisor_comment || "").trim();

  const allowedStatuses = ["อนุมัติ", "ส่งกลับแก้ไข"];

  // ตรวจข้อมูลเบื้องต้น
  if (
    !Number.isInteger(requestId) ||
    requestId <= 0 ||
    !Number.isInteger(advisorId) ||
    advisorId <= 0 ||
    !allowedStatuses.includes(status)
  ) {
    return res.status(400).json({
      message: "ข้อมูลการพิจารณาไม่ถูกต้อง",
    });
  }

  // หากส่งกลับแก้ไข ต้องระบุเหตุผล
  if (status === "ส่งกลับแก้ไข" && !comment) {
    return res.status(400).json({
      message: "กรุณาระบุเหตุผลที่ส่งกลับแก้ไข",
    });
  }

  const sql = `
    UPDATE project_exam_requests er

    INNER JOIN projects p
      ON p.id = er.project_id

    SET
      er.status = ?,
      er.advisor_comment = ?,
      er.reviewed_by = ?,
      er.reviewed_at = NOW()

    WHERE er.id = ?
      AND p.advisor_id = ?
      AND er.status = 'รอพิจารณา'

      
      -- ห้ามพิจารณาคำขอรอบที่มีกำหนดการสอบแล้ว
      AND NOT EXISTS (
        SELECT 1
        FROM project_exam_schedules s
        WHERE s.project_id = er.project_id
          AND s.exam_round = er.exam_round
      )


      -- หากอนุมัติ ต้องตรวจความพร้อมอีกครั้ง
      AND (
        ? <> 'อนุมัติ'
        OR (
          EXISTS (
            SELECT 1
            FROM project_phases ph
            WHERE ph.project_id = er.project_id
          )

          AND EXISTS (
            SELECT 1
            FROM project_tasks t
            WHERE t.project_id = er.project_id
          )

          AND NOT EXISTS (
            SELECT 1
            FROM project_tasks t
            WHERE t.project_id = er.project_id
              AND (
                COALESCE(t.status, '') <> 'เสร็จสิ้น'
                OR COALESCE(t.review_status, '') <> 'ผ่าน'
              )
          )
        )
      )
  `;

  db.query(
    sql,
    [status, comment || null, advisorId, requestId, advisorId, status],
    (err, result) => {
      if (err) {
        console.error("Review exam request error:", err);

        return res.status(500).json({
          message: "ไม่สามารถบันทึกผลการพิจารณาได้",
        });
      }

      if (result.affectedRows === 0) {
        return res.status(409).json({
          message:
            "ไม่สามารถพิจารณาคำขอได้ กรุณาตรวจสอบสถานะคำขอและความพร้อมของโครงงาน",
        });
      }

      return res.json({
        success: true,
        request_id: requestId,
        status: status,
        message: "บันทึกผลการพิจารณาเรียบร้อยแล้ว",
      });
    },
  );
});

/* =========================================================
   TEACHER - EXAM SCHEDULE LIST
========================================================= */

app.get("/teacher/exams/:advisorId", (req, res) => {
  const advisorId = Number(req.params.advisorId);

  if (!Number.isInteger(advisorId) || advisorId <= 0) {
    return res.status(400).json({
      message: "รหัสอาจารย์ไม่ถูกต้อง",
    });
  }

  const sql = `
    SELECT
      p.id AS project_id,
      p.title AS project_title,
      p.academic_year,

      members.student_names,

      s.id AS schedule_id,
      DATE_FORMAT(s.exam_date, '%Y-%m-%d') AS exam_date,
      TIME_FORMAT(s.start_time, '%H:%i') AS start_time,
      TIME_FORMAT(s.end_time, '%H:%i') AS end_time,
      s.location,
      s.committee,
      s.notes,
      s.announced_at

    FROM projects p

    INNER JOIN (
      SELECT
        pm.project_id,

        GROUP_CONCAT(
          CONCAT(u.username, ' ', u.name)
          ORDER BY pm.id ASC
          SEPARATOR ' | '
        ) AS student_names

      FROM project_members pm

      INNER JOIN users u
        ON pm.user_id = u.id

      GROUP BY pm.project_id
    ) members
      ON members.project_id = p.id

    
      LEFT JOIN project_exam_schedules s
        ON s.project_id = p.id
        AND s.exam_round = COALESCE(
          (
            SELECT MAX(er.exam_round)
            FROM project_exam_requests er
            WHERE er.project_id = p.id
              AND er.status = 'อนุมัติ'
          ),
          1
        )


    WHERE p.advisor_id = ?

    ORDER BY p.id DESC
  `;

  db.query(sql, [advisorId], (err, results) => {
    if (err) {
      console.log("Get exam schedules error:", err);

      return res.status(500).json({
        message: "ไม่สามารถโหลดกำหนดการสอบได้",
      });
    }

    const pending = results.filter((item) => item.schedule_id === null);

    const announced = results.filter((item) => item.schedule_id !== null);

    res.json({
      pending,
      announced,

      pending_count: pending.length,
      announced_count: announced.length,
    });
  });
});

/* =========================================================
   TEACHER - ANNOUNCE EXAM SCHEDULE
========================================================= */

app.post("/teacher/exams", async (req, res) => {
  const {
    project_id,
    advisor_id,
    exam_date,
    start_time,
    end_time,
    location,
    committee,
    notes,
    committee_teacher_ids,
  } = req.body;

  const projectId = Number(project_id);
  const advisorId = Number(advisor_id);

  const teacherIds = Array.isArray(committee_teacher_ids)
    ? committee_teacher_ids
    : [];

  if (
    teacherIds.length === 0 ||
    teacherIds.some(
      (id) => !Number.isInteger(id) || id <= 0 || id === advisorId,
    ) ||
    new Set(teacherIds).size !== teacherIds.length
  ) {
    return res.status(400).json({
      message: "กรุณาเลือกกรรมการสอบที่ถูกต้องอย่างน้อย 1 ท่าน",
    });
  }

  const examDate = String(exam_date || "").trim();
  const startTime = String(start_time || "").trim();
  const endTime = String(end_time || "").trim();
  const examLocation = String(location || "").trim();
  const examCommittee = String(committee || "").trim();
  const examNotes = String(notes || "").trim();

  // ตรวจข้อมูลที่จำเป็น

  if (
    !Number.isInteger(projectId) ||
    projectId <= 0 ||
    !Number.isInteger(advisorId) ||
    advisorId <= 0 ||
    !examDate ||
    !startTime ||
    !endTime ||
    !examLocation ||
    !examCommittee
  ) {
    return res.status(400).json({
      message: "กรุณากรอกข้อมูลกำหนดการสอบให้ครบถ้วน",
    });
  }

  const parsedDate = new Date(`${examDate}T00:00:00Z`);

  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(examDate) ||
    Number.isNaN(parsedDate.getTime()) ||
    parsedDate.toISOString().slice(0, 10) !== examDate
  ) {
    return res.status(400).json({
      message: "วันที่สอบไม่ถูกต้อง",
    });
  }

  const timePattern = /^([01]\d|2[0-3]):[0-5]\d$/;

  if (
    !timePattern.test(startTime) ||
    !timePattern.test(endTime) ||
    startTime >= endTime
  ) {
    return res.status(400).json({
      message: "เวลาสิ้นสุดต้องมากกว่าเวลาเริ่มสอบ",
    });
  }

  if (examLocation.length > 255) {
    return res.status(400).json({
      message: "ชื่อสถานที่สอบยาวเกิน 255 ตัวอักษร",
    });
  }

  // ใช้ Connection เดียวกันตลอด Transaction

  const getConnection = () =>
    new Promise((resolve, reject) => {
      if (typeof db.getConnection === "function") {
        db.getConnection((err, connection) => {
          if (err) reject(err);
          else resolve({ connection, pooled: true });
        });
      } else {
        resolve({ connection: db, pooled: false });
      }
    });

  const query = (connection, sql, params = []) =>
    new Promise((resolve, reject) => {
      connection.query(sql, params, (err, result) => {
        if (err) reject(err);
        else resolve(result);
      });
    });

  let connection;
  let pooled = false;
  let transactionStarted = false;

  try {
    const acquired = await getConnection();

    connection = acquired.connection;
    pooled = acquired.pooled;

    await query(connection, "START TRANSACTION");
    transactionStarted = true;

    // 1. ตรวจว่าโครงงานเป็นของอาจารย์
    // และมีนิสิตเป็นสมาชิกแล้ว

    const projects = await query(
      connection,
      `
        SELECT p.id, p.title
        FROM projects p
        INNER JOIN users u
          ON u.id = p.advisor_id
          AND u.role = 'teacher'
        WHERE p.id = ?
          AND p.advisor_id = ?
          AND EXISTS (
            SELECT 1
            FROM project_members pm
            WHERE pm.project_id = p.id
          )
        LIMIT 1
        FOR UPDATE
      `,
      [projectId, advisorId],
    );

    if (projects.length === 0) {
      await query(connection, "ROLLBACK");
      transactionStarted = false;

      return res.status(403).json({
        message: "ไม่พบโครงงาน หรือคุณไม่มีสิทธิ์ประกาศ",
      });
    }

    // ตรวจสอบรอบสอบที่ได้รับอนุมัติล่าสุด
    const approvedRequests = await query(
      connection,
      `
        SELECT exam_round
        FROM project_exam_requests
        WHERE project_id = ?
          AND status = 'อนุมัติ'
        ORDER BY exam_round DESC, id DESC
        LIMIT 1
        FOR UPDATE
      `,
      [projectId],
    );

    if (approvedRequests.length === 0) {
      await query(connection, "ROLLBACK");
      transactionStarted = false;

      return res.status(409).json({
        message: "ยังไม่มีคำขอสอบที่ได้รับอนุมัติ",
      });
    }

    const examRound = Number(approvedRequests[0].exam_round);

    // 2. ป้องกันการประกาศซ้ำ

    const existing = await query(
      connection,
      `
        SELECT id
        FROM project_exam_schedules
        WHERE project_id = ?
          AND exam_round = ?
        LIMIT 1
      `,
      [projectId, examRound],
    );

    if (existing.length > 0) {
      await query(connection, "ROLLBACK");
      transactionStarted = false;

      return res.status(409).json({
        message: "โครงงานนี้ประกาศกำหนดการสอบแล้ว",
      });
    }

    // 3. บันทึกกำหนดการสอบ

    // ตรวจสอบว่า ID ที่เลือกเป็นอาจารย์จริงทุกคน

    const placeholders = teacherIds.map(() => "?").join(", ");

    const teachers = await query(
      connection,
      `
    SELECT id
    FROM users
    WHERE role = 'teacher'
      AND id IN (${placeholders})
  `,
      teacherIds,
    );

    if (teachers.length !== teacherIds.length) {
      await query(connection, "ROLLBACK");
      transactionStarted = false;

      return res.status(400).json({
        message: "ไม่พบข้อมูลอาจารย์บางท่าน กรุณาเลือกใหม่",
      });
    }

    const result = await query(
      connection,
      `
        INSERT INTO project_exam_schedules
        (
          project_id,
          advisor_id,
          exam_round,
          exam_date,
          start_time,
          end_time,
          location,
          committee,
          notes,
          announced_at
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
      `,
      [
        projectId,
        advisorId,
        examRound,
        examDate,
        startTime,
        endTime,
        examLocation,
        examCommittee,
        examNotes || null,
      ],
    );

    // =========================================
    // เพิ่มอาจารย์ที่ปรึกษาเป็นกรรมการอัตโนมัติ
    // =========================================

    const scheduleId = result.insertId;

    await query(
      connection,
      `
    INSERT INTO exam_committee_members
    (
      schedule_id,
      teacher_id,
      invited_by,
      invitation_status,
      responded_at
    )
    VALUES (?, ?, ?, 'ตอบรับ', NOW())
  `,
      [scheduleId, advisorId, advisorId],
    );

    // =========================================
    // ส่งคำเชิญให้อาจารย์ที่เลือกทุกท่าน
    // =========================================

    for (const teacherId of teacherIds) {
      await query(
        connection,
        `
      INSERT INTO exam_committee_members
      (
        schedule_id,
        teacher_id,
        invited_by,
        invitation_status
      )
      VALUES (?, ?, ?, 'รอตอบรับ')
    `,
        [scheduleId, teacherId, advisorId],
      );
    }

    // 4. แจ้งเตือนนิสิตทุกคนในโครงงาน

    const message =
      `อาจารย์ประกาศกำหนดการสอบโครงงาน "${projects[0].title}" ` +
      `วันที่ ${examDate} เวลา ${startTime} - ${endTime} น. ` +
      `สถานที่ ${examLocation}`;

    await query(
      connection,
      `
        INSERT INTO notifications
        (
          user_id,
          message,
          project_id
        )
        SELECT DISTINCT
          pm.user_id,
          ?,
          ?
        FROM project_members pm
        WHERE pm.project_id = ?
      `,
      [message, projectId, projectId],
    );

    // 5. ยืนยันข้อมูลทั้งหมด

    await query(connection, "COMMIT");
    transactionStarted = false;

    res.status(201).json({
      success: true,
      message: "ประกาศกำหนดการสอบเรียบร้อยแล้ว",
      schedule_id: result.insertId,
    });
  } catch (err) {
    console.log("Announce exam error:", err);

    if (transactionStarted && connection) {
      try {
        await query(connection, "ROLLBACK");
      } catch (rollbackErr) {
        console.log("Exam rollback error:", rollbackErr);
      }
    }

    res.status(err.code === "ER_DUP_ENTRY" ? 409 : 500).json({
      message:
        err.code === "ER_DUP_ENTRY"
          ? "โครงงานนี้ประกาศกำหนดการสอบแล้ว"
          : "ไม่สามารถประกาศกำหนดการสอบได้",
    });
  } finally {
    if (pooled && connection && typeof connection.release === "function") {
      connection.release();
    }
  }
});

/* =========================================================
   STUDENT - GET EXAM SCHEDULE
========================================================= */

app.get("/student/projects/:projectId/exam/:studentId", (req, res) => {
  const projectId = Number(req.params.projectId);
  const studentId = Number(req.params.studentId);

  if (
    !Number.isInteger(projectId) ||
    projectId <= 0 ||
    !Number.isInteger(studentId) ||
    studentId <= 0
  ) {
    return res.status(400).json({
      message: "ข้อมูลโครงงานหรือนิสิตไม่ถูกต้อง",
    });
  }

  // ตรวจว่านิสิตเป็นสมาชิกโครงงาน

  const projectSql = `
      SELECT
        p.id,
        p.title,
        advisor.name AS advisor_name

      FROM projects p

      INNER JOIN project_members pm
        ON pm.project_id = p.id

      LEFT JOIN users advisor
        ON advisor.id = p.advisor_id

      WHERE p.id = ?
        AND pm.user_id = ?

      LIMIT 1
    `;

  db.query(projectSql, [projectId, studentId], (projectErr, projects) => {
    if (projectErr) {
      console.log("Get exam project error:", projectErr);

      return res.status(500).json({
        message: "ไม่สามารถโหลดข้อมูลโครงงานได้",
      });
    }

    if (projects.length === 0) {
      return res.status(403).json({
        message: "คุณไม่มีสิทธิ์ดูข้อมูลโครงงานนี้",
      });
    }

    // ดึงกำหนดการสอบที่ประกาศแล้ว

    const examSql = `
          SELECT
            s.id,
            s.project_id,

            DATE_FORMAT(
              s.exam_date, '%Y-%m-%d'
            ) AS exam_date,

            TIME_FORMAT(
              s.start_time, '%H:%i'
            ) AS start_time,

            TIME_FORMAT(
              s.end_time, '%H:%i'
            ) AS end_time,

            s.location,
            s.committee,
            s.notes,
            s.announced_at

          FROM project_exam_schedules s

          WHERE s.project_id = ?
            AND s.announced_at IS NOT NULL

          ORDER BY s.announced_at DESC
          LIMIT 1
        `;

    db.query(examSql, [projectId], (examErr, schedules) => {
      if (examErr) {
        console.log("Get student exam error:", examErr);

        return res.status(500).json({
          message: "ไม่สามารถโหลดกำหนดการสอบได้",
        });
      }

      res.json({
        project: projects[0],
        schedule: schedules[0] || null,
      });
    });
  });
});

/* =========================================================
   TEACHER - UPDATE EXAM SCHEDULE
========================================================= */

app.put("/teacher/exams/:scheduleId", async (req, res) => {
  const scheduleId = Number(req.params.scheduleId);

  const {
    advisor_id,
    exam_date,
    start_time,
    end_time,
    location,
    notes,
    committee_teacher_ids,
  } = req.body;

  const advisorId = Number(advisor_id);
  const examDate = String(exam_date || "").trim();
  const startTime = String(start_time || "").trim();
  const endTime = String(end_time || "").trim();
  const examLocation = String(location || "").trim();

  const teacherIds = committee_teacher_ids;

  const examNotes = String(notes || "").trim();

  // ตรวจสอบรายชื่อกรรมการที่เลือก

  if (
    !Array.isArray(teacherIds) ||
    teacherIds.length === 0 ||
    teacherIds.some(
      (id) => !Number.isInteger(id) || id <= 0 || id === advisorId,
    ) ||
    new Set(teacherIds).size !== teacherIds.length
  ) {
    return res.status(400).json({
      message: "กรุณาเลือกกรรมการสอบที่ถูกต้องอย่างน้อย 1 ท่าน",
    });
  }

  // ตรวจข้อมูล

  if (
    !Number.isInteger(scheduleId) ||
    scheduleId <= 0 ||
    !Number.isInteger(advisorId) ||
    advisorId <= 0 ||
    !examDate ||
    !startTime ||
    !endTime ||
    !examLocation
  ) {
    return res.status(400).json({
      message: "กรุณากรอกข้อมูลที่จำเป็นให้ครบถ้วน",
    });
  }

  const parsedDate = new Date(`${examDate}T00:00:00Z`);

  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(examDate) ||
    Number.isNaN(parsedDate.getTime()) ||
    parsedDate.toISOString().slice(0, 10) !== examDate
  ) {
    return res.status(400).json({
      message: "วันที่สอบไม่ถูกต้อง",
    });
  }

  const timePattern = /^([01]\d|2[0-3]):[0-5]\d$/;

  if (
    !timePattern.test(startTime) ||
    !timePattern.test(endTime) ||
    startTime >= endTime
  ) {
    return res.status(400).json({
      message: "เวลาสิ้นสุดต้องมากกว่าเวลาเริ่มสอบ",
    });
  }

  if (examLocation.length > 255) {
    return res.status(400).json({
      message: "ชื่อสถานที่สอบยาวเกิน 255 ตัวอักษร",
    });
  }

  // รองรับ MySQL connection และ pool

  const getConnection = () =>
    new Promise((resolve, reject) => {
      if (typeof db.getConnection === "function") {
        db.getConnection((err, connection) => {
          if (err) reject(err);
          else resolve({ connection, pooled: true });
        });
      } else {
        resolve({ connection: db, pooled: false });
      }
    });

  const query = (connection, sql, params = []) =>
    new Promise((resolve, reject) => {
      connection.query(sql, params, (err, result) => {
        if (err) reject(err);
        else resolve(result);
      });
    });

  let connection;
  let pooled = false;
  let transactionStarted = false;

  try {
    const acquired = await getConnection();
    connection = acquired.connection;
    pooled = acquired.pooled;

    await query(connection, "START TRANSACTION");
    transactionStarted = true;

    // 1. ตรวจว่ากำหนดการเป็นของอาจารย์จริง

    const schedules = await query(
      connection,
      `
        SELECT
          s.id,
          s.project_id,
          p.title AS project_title

        FROM project_exam_schedules s

        INNER JOIN projects p
          ON s.project_id = p.id

        INNER JOIN users u
          ON u.id = p.advisor_id
          AND u.role = 'teacher'

        WHERE s.id = ?
          AND s.advisor_id = ?
          AND p.advisor_id = ?
          AND s.announced_at IS NOT NULL

        LIMIT 1
        FOR UPDATE
      `,
      [scheduleId, advisorId, advisorId],
    );

    if (schedules.length === 0) {
      await query(connection, "ROLLBACK");
      transactionStarted = false;

      return res.status(403).json({
        message: "ไม่พบกำหนดการสอบ หรือคุณไม่มีสิทธิ์แก้ไข",
      });
    }

    const schedule = schedules[0];

    // ==========================================
    // ตรวจสอบกรรมการที่เลือก
    // ==========================================

    const placeholders = teacherIds.map(() => "?").join(", ");

    const teachers = await query(
      connection,
      `
    SELECT id, name
    FROM users
    WHERE role = 'teacher'
      AND id IN (${placeholders})
  `,
      teacherIds,
    );

    if (teachers.length !== teacherIds.length) {
      await query(connection, "ROLLBACK");
      transactionStarted = false;

      return res.status(400).json({
        message: "ไม่พบข้อมูลอาจารย์บางท่าน",
      });
    }

    // เปลี่ยน ID เป็นรายชื่อ สำหรับบันทึกในกำหนดการ

    const nameById = new Map(
      teachers.map((teacher) => [Number(teacher.id), teacher.name]),
    );

    const advisorRows = await query(
      connection,
      `
    SELECT name
    FROM users
    WHERE id = ?
      AND role = 'teacher'
    LIMIT 1
  `,
      [advisorId],
    );

    const advisorName = advisorRows[0].name;

    const committeeNames = [
      advisorName,
      ...teacherIds.map((id) => nameById.get(id)),
    ].join("\n");

    // ==========================================
    // ดึงกรรมการเดิมจากฐานข้อมูล
    // ==========================================

    const currentMembers = await query(
      connection,
      `
    SELECT id, teacher_id, invitation_status
    FROM exam_committee_members
    WHERE schedule_id = ?
    FOR UPDATE
  `,
      [scheduleId],
    );

    const currentByTeacherId = new Map(
      currentMembers.map((member) => [Number(member.teacher_id), member]),
    );

    const selectedIds = new Set(teacherIds);

    // หาคนที่ถูกนำออกจากรายการ

    const removing = currentMembers.filter(
      (member) =>
        Number(member.teacher_id) !== advisorId &&
        member.invitation_status !== "ปฏิเสธ" &&
        !selectedIds.has(Number(member.teacher_id)),
    );

    // ==========================================
    // ตรวจสอบว่ากรรมการให้คะแนนแล้วหรือยัง
    // ==========================================

    if (removing.length > 0) {
      const placeholders2 = removing.map(() => "?").join(", ");

      const evaluations = await query(
        connection,
        `
      SELECT id
      FROM exam_evaluations
      WHERE committee_member_id IN (${placeholders2})
      LIMIT 1
    `,
        removing.map((member) => member.id),
      );

      if (evaluations.length > 0) {
        await query(connection, "ROLLBACK");
        transactionStarted = false;

        return res.status(409).json({
          message: "กรรมการบางท่านบันทึกคะแนนแล้ว ไม่สามารถนำออกได้",
        });
      }
    }

    // ==========================================
    // เพิ่มอาจารย์ที่ปรึกษาเป็นกรรมการอัตโนมัติ
    // ==========================================

    await query(
      connection,
      `
    INSERT INTO exam_committee_members
    (
      schedule_id,
      teacher_id,
      invited_by,
      invitation_status,
      responded_at
    )
    VALUES (?, ?, ?, 'ตอบรับ', NOW())

    ON DUPLICATE KEY UPDATE id = id
  `,
      [scheduleId, advisorId, advisorId],
    );

    // ==========================================
    // ถอนกรรมการที่ถูกนำออก
    // ==========================================

    for (const member of removing) {
      await query(
        connection,
        `
      DELETE FROM exam_committee_members
      WHERE id = ?
    `,
        [member.id],
      );

      // แจ้งอาจารย์ที่ถูกถอนจากกรรมการ

      await query(
        connection,
        `
      INSERT INTO notifications
      (user_id, message, project_id)
      VALUES (?, ?, ?)
    `,
        [
          member.teacher_id,
          `อาจารย์ที่ปรึกษาถอนคำเชิญกรรมการสอบโครงงาน "${schedule.project_title}"`,
          schedule.project_id,
        ],
      );
    }

    // ==========================================
    // เพิ่มกรรมการใหม่หรือเชิญใหม่
    // ==========================================

    for (const teacherId of teacherIds) {
      const existing = currentByTeacherId.get(teacherId);

      // กรรมการใหม่
      if (!existing) {
        await query(
          connection,
          `
        INSERT INTO exam_committee_members
        (
          schedule_id,
          teacher_id,
          invited_by,
          invitation_status
        )
        VALUES (?, ?, ?, 'รอตอบรับ')
      `,
          [scheduleId, teacherId, advisorId],
        );
      }

      // กรรมการที่เคยปฏิเสธ ให้เชิญใหม่ได้
      else if (existing.invitation_status === "ปฏิเสธ") {
        await query(
          connection,
          `
        UPDATE exam_committee_members
        SET
          invitation_status = 'รอตอบรับ',
          invited_by = ?,
          invited_at = NOW(),
          responded_at = NULL
        WHERE id = ?
      `,
          [advisorId, existing.id],
        );
      }
    }

    // 2. อัปเดตกำหนดการสอบเดิม

    await query(
      connection,
      `
        UPDATE project_exam_schedules

        SET
          exam_date = ?,
          start_time = ?,
          end_time = ?,
          location = ?,
          committee = ?,
          notes = ?

        WHERE id = ?
      `,

      [
        examDate,
        startTime,
        endTime,
        examLocation,
        committeeNames,
        examNotes || null,
        scheduleId,
      ],
    );

    // 3. แจ้งเตือนนิสิตทุกคน

    const message =
      `อาจารย์แก้ไขกำหนดการสอบโครงงาน "${schedule.project_title}" ` +
      `เป็นวันที่ ${examDate} เวลา ${startTime} - ${endTime} น. ` +
      `สถานที่ ${examLocation}`;

    await query(
      connection,
      `
        INSERT INTO notifications
        (
          user_id,
          message,
          project_id
        )

        SELECT DISTINCT
          pm.user_id,
          ?,
          ?

        FROM project_members pm

        WHERE pm.project_id = ?
      `,
      [message, schedule.project_id, schedule.project_id],
    );

    // 4. ยืนยันการบันทึก

    await query(connection, "COMMIT");
    transactionStarted = false;

    res.json({
      success: true,
      message: "แก้ไขกำหนดการสอบเรียบร้อยแล้ว",
    });
  } catch (err) {
    console.log("Update exam schedule error:", err);

    if (transactionStarted && connection) {
      try {
        await query(connection, "ROLLBACK");
      } catch (rollbackErr) {
        console.log("Rollback exam error:", rollbackErr);
      }
    }

    res.status(500).json({
      message: "ไม่สามารถแก้ไขกำหนดการสอบได้",
    });
  } finally {
    if (pooled && connection && typeof connection.release === "function") {
      connection.release();
    }
  }
});

/* =========================================================
   TEACHER - CANCEL EXAM SCHEDULE
========================================================= */

app.delete("/teacher/exams/:scheduleId", async (req, res) => {
  const scheduleId = Number(req.params.scheduleId);
  const advisorId = Number(req.body.advisor_id);

  if (
    !Number.isInteger(scheduleId) ||
    scheduleId <= 0 ||
    !Number.isInteger(advisorId) ||
    advisorId <= 0
  ) {
    return res.status(400).json({
      message: "ข้อมูลกำหนดการสอบไม่ถูกต้อง",
    });
  }

  // ใช้รูปแบบ Connection เดียวกับ API ประกาศกำหนดการสอบ

  const getConnection = () =>
    new Promise((resolve, reject) => {
      if (typeof db.getConnection === "function") {
        db.getConnection((err, connection) => {
          if (err) reject(err);
          else resolve({ connection, pooled: true });
        });
      } else {
        resolve({ connection: db, pooled: false });
      }
    });

  const query = (connection, sql, params = []) =>
    new Promise((resolve, reject) => {
      connection.query(sql, params, (err, result) => {
        if (err) reject(err);
        else resolve(result);
      });
    });

  let connection;
  let pooled = false;
  let transactionStarted = false;

  try {
    const acquired = await getConnection();

    connection = acquired.connection;
    pooled = acquired.pooled;

    await query(connection, "START TRANSACTION");
    transactionStarted = true;

    // =========================================
    // 1. ตรวจสอบว่ากำหนดการสอบเป็นของอาจารย์
    // =========================================

    const schedules = await query(
      connection,
      `
        SELECT
          s.id,
          s.project_id,
          p.title AS project_title

        FROM project_exam_schedules s

        INNER JOIN projects p
          ON p.id = s.project_id

        WHERE s.id = ?
          AND s.advisor_id = ?
          AND p.advisor_id = ?

        LIMIT 1
        FOR UPDATE
      `,
      [scheduleId, advisorId, advisorId],
    );

    if (schedules.length === 0) {
      await query(connection, "ROLLBACK");
      transactionStarted = false;

      return res.status(404).json({
        message: "ไม่พบกำหนดการสอบ หรือไม่มีสิทธิ์ยกเลิก",
      });
    }

    const schedule = schedules[0];

    // =========================================
    // 2. ป้องกันการลบข้อมูลที่มีผลประเมินแล้ว
    // =========================================

    const evaluations = await query(
      connection,
      `
        SELECT ev.id
        FROM exam_evaluations ev

        INNER JOIN exam_committee_members ecm
          ON ev.committee_member_id = ecm.id

        WHERE ecm.schedule_id = ?

        LIMIT 1
      `,
      [scheduleId],
    );

    if (evaluations.length > 0) {
      await query(connection, "ROLLBACK");
      transactionStarted = false;

      return res.status(409).json({
        message: "กำหนดการนี้มีข้อมูลผลประเมินแล้ว ไม่สามารถยกเลิกได้",
      });
    }

    // =========================================
    // 3. แจ้งเตือนกรรมการสอบที่ได้รับเชิญ
    // =========================================

    const committeeMessage =
      `อาจารย์ที่ปรึกษายกเลิกกำหนดการสอบโครงงาน ` +
      `"${schedule.project_title}"`;

    await query(
      connection,
      `
        INSERT INTO notifications
        (
          user_id,
          message,
          project_id
        )

        SELECT DISTINCT
          ecm.teacher_id,
          ?,
          ?

        FROM exam_committee_members ecm

        WHERE ecm.schedule_id = ?
          AND ecm.teacher_id != ?
          AND ecm.invitation_status IN ('รอตอบรับ', 'ตอบรับ')
      `,
      [committeeMessage, schedule.project_id, scheduleId, advisorId],
    );

    // =========================================
    // 4. แจ้งเตือนนิสิตในโครงงาน
    // =========================================

    const studentMessage =
      `อาจารย์ยกเลิกกำหนดการสอบโครงงาน ` +
      `"${schedule.project_title}" กรุณารอประกาศกำหนดการสอบใหม่`;

    await query(
      connection,
      `
        INSERT INTO notifications
        (
          user_id,
          message,
          project_id
        )

        SELECT DISTINCT
          pm.user_id,
          ?,
          ?

        FROM project_members pm

        WHERE pm.project_id = ?
      `,
      [studentMessage, schedule.project_id, schedule.project_id],
    );

    // =========================================
    // 5. ลบคำเชิญและรายชื่อกรรมการสอบ
    // =========================================

    await query(
      connection,
      `
        DELETE FROM exam_committee_members
        WHERE schedule_id = ?
      `,
      [scheduleId],
    );

    // =========================================
    // 6. ลบกำหนดการสอบเดิม
    // =========================================

    await query(
      connection,
      `
        DELETE FROM project_exam_schedules
        WHERE id = ?
          AND advisor_id = ?
      `,
      [scheduleId, advisorId],
    );

    // =========================================
    // 7. ยืนยันการเปลี่ยนแปลง
    // =========================================

    await query(connection, "COMMIT");
    transactionStarted = false;

    res.json({
      success: true,
      message: "ยกเลิกกำหนดการสอบเรียบร้อยแล้ว",
    });
  } catch (err) {
    console.log("Cancel exam schedule error:", err);

    if (transactionStarted && connection) {
      try {
        await query(connection, "ROLLBACK");
      } catch (rollbackErr) {
        console.log("Cancel exam rollback error:", rollbackErr);
      }
    }

    res.status(500).json({
      message: "ไม่สามารถยกเลิกกำหนดการสอบได้",
    });
  } finally {
    if (pooled && connection && typeof connection.release === "function") {
      connection.release();
    }
  }
});

/* =========================================================
   EXAM - GET AVAILABLE COMMITTEE TEACHERS
========================================================= */

app.get("/teacher/exam/committee-candidates/:advisorId", (req, res) => {
  const { advisorId } = req.params;

  const sql = `
    SELECT
      id,
      username,
      name,
      major

    FROM users

    WHERE role = 'teacher'
      AND id != ?

    ORDER BY name ASC
  `;

  db.query(sql, [advisorId], (err, results) => {
    if (err) {
      console.log("Get committee candidates error:", err);

      return res.status(500).json({
        message: "ไม่สามารถโหลดรายชื่ออาจารย์ได้",
      });
    }

    res.json({
      teachers: results,
    });
  });
});

/* =========================================================
   EXAM - INVITE COMMITTEE MEMBER
========================================================= */

app.post("/teacher/exam/committee-invite", (req, res) => {
  const scheduleId = Number(req.body.schedule_id);
  const advisorId = Number(req.body.advisor_id);
  const teacherId = Number(req.body.teacher_id);

  // 1. ตรวจสอบข้อมูล
  if (
    !Number.isInteger(scheduleId) ||
    scheduleId <= 0 ||
    !Number.isInteger(advisorId) ||
    advisorId <= 0 ||
    !Number.isInteger(teacherId) ||
    teacherId <= 0
  ) {
    return res.status(400).json({
      message: "ข้อมูลไม่ถูกต้อง",
    });
  }

  if (advisorId === teacherId) {
    return res.status(400).json({
      message: "อาจารย์ที่ปรึกษาไม่ต้องส่งคำเชิญให้ตัวเอง",
    });
  }

  // 2. ตรวจสอบกำหนดการสอบและอาจารย์ที่ปรึกษา
  const scheduleSql = `
    SELECT
      es.id,
      es.project_id,
      es.advisor_id,
      p.title AS project_title

    FROM project_exam_schedules es

    INNER JOIN projects p
      ON es.project_id = p.id

    WHERE es.id = ?
      AND es.advisor_id = ?
      AND p.advisor_id = ?

    LIMIT 1
  `;

  db.query(
    scheduleSql,
    [scheduleId, advisorId, advisorId],
    (scheduleErr, schedules) => {
      if (scheduleErr) {
        console.log("Check exam schedule error:", scheduleErr);

        return res.status(500).json({
          message: "ตรวจสอบกำหนดการสอบไม่สำเร็จ",
        });
      }

      if (schedules.length === 0) {
        return res.status(404).json({
          message: "ไม่พบกำหนดการสอบ หรือคุณไม่ใช่อาจารย์ที่ปรึกษา",
        });
      }

      const schedule = schedules[0];

      // 3. ตรวจสอบผู้ที่ได้รับเชิญ
      const teacherSql = `
        SELECT id, name
        FROM users
        WHERE id = ?
          AND role = 'teacher'
        LIMIT 1
      `;

      db.query(teacherSql, [teacherId], (teacherErr, teachers) => {
        if (teacherErr) {
          return res.status(500).json({
            message: "ตรวจสอบข้อมูลอาจารย์ไม่สำเร็จ",
          });
        }

        if (teachers.length === 0) {
          return res.status(404).json({
            message: "ไม่พบอาจารย์ที่ต้องการเชิญ",
          });
        }

        // 4. เพิ่มอาจารย์ที่ปรึกษาเป็นกรรมการอัตโนมัติ
        const advisorSql = `
          INSERT INTO exam_committee_members
          (
            schedule_id,
            teacher_id,
            invited_by,
            invitation_status,
            responded_at
          )
          VALUES (?, ?, ?, 'ตอบรับ', NOW())

          ON DUPLICATE KEY UPDATE
            id = id
        `;

        db.query(
          advisorSql,
          [scheduleId, advisorId, advisorId],
          (advisorErr) => {
            if (advisorErr) {
              console.log("Add advisor committee error:", advisorErr);

              return res.status(500).json({
                message: "เพิ่มอาจารย์ที่ปรึกษาไม่สำเร็จ",
              });
            }

            // 5. บันทึกคำเชิญกรรมการ
            const inviteSql = `
              INSERT INTO exam_committee_members
              (
                schedule_id,
                teacher_id,
                invited_by,
                invitation_status
              )
              VALUES (?, ?, ?, 'รอตอบรับ')
            `;

            db.query(
              inviteSql,
              [scheduleId, teacherId, advisorId],
              (inviteErr, result) => {
                if (inviteErr) {
                  if (inviteErr.code === "ER_DUP_ENTRY") {
                    return res.status(409).json({
                      message: "อาจารย์ท่านนี้มีคำเชิญอยู่แล้ว",
                    });
                  }

                  console.log("Invite committee error:", inviteErr);

                  return res.status(500).json({
                    message: "ส่งคำเชิญไม่สำเร็จ",
                  });
                }

                // 6. แจ้งเตือนอาจารย์ที่ได้รับเชิญ
                const notificationSql = `
                  INSERT INTO notifications
                  (
                    user_id,
                    message,
                    project_id
                  )
                  VALUES (?, ?, ?)
                `;

                const message =
                  `คุณได้รับคำเชิญเป็นกรรมการสอบโครงงาน ` +
                  `"${schedule.project_title}"`;

                db.query(
                  notificationSql,
                  [teacherId, message, schedule.project_id],
                  (notificationErr) => {
                    if (notificationErr) {
                      console.log(
                        "Committee notification error:",
                        notificationErr,
                      );
                    }

                    res.json({
                      success: true,
                      message: notificationErr
                        ? "บันทึกคำเชิญแล้ว แต่สร้างการแจ้งเตือนไม่สำเร็จ"
                        : "ส่งคำเชิญกรรมการเรียบร้อยแล้ว",
                      invitation_id: result.insertId,
                    });
                  },
                );
              },
            );
          },
        );
      });
    },
  );
});

/* =========================================================
   EXAM - GET COMMITTEE INVITATIONS
========================================================= */

app.get("/teacher/exam/invitations/:teacherId", (req, res) => {
  const teacherId = Number(req.params.teacherId);

  if (!Number.isInteger(teacherId) || teacherId <= 0) {
    return res.status(400).json({
      message: "รหัสอาจารย์ไม่ถูกต้อง",
    });
  }

  const sql = `
    SELECT
      ecm.id AS invitation_id,
      ecm.schedule_id,
      ecm.teacher_id,
      ecm.invitation_status,
      ecm.invited_at,
      ecm.responded_at,

      p.id AS project_id,
      p.title AS project_title,

      es.exam_date,
      es.start_time,
      es.end_time,
      es.location,

      advisor.name AS advisor_name

    FROM exam_committee_members ecm

    INNER JOIN project_exam_schedules es
      ON ecm.schedule_id = es.id

    INNER JOIN projects p
      ON es.project_id = p.id

    INNER JOIN users advisor
      ON ecm.invited_by = advisor.id

    WHERE ecm.teacher_id = ?
      AND ecm.invitation_status = 'รอตอบรับ'

    ORDER BY ecm.invited_at DESC, ecm.id DESC
  `;

  db.query(sql, [teacherId], (err, results) => {
    if (err) {
      console.log("Get exam invitations error:", err);

      return res.status(500).json({
        message: "ไม่สามารถโหลดคำเชิญกรรมการสอบได้",
      });
    }

    res.json({
      invitations: results,
    });
  });
});

/* =========================================================
   EXAM - RESPOND TO COMMITTEE INVITATION
========================================================= */

app.post("/teacher/exam/invitations/:invitationId/respond", (req, res) => {
  const invitationId = Number(req.params.invitationId);
  const teacherId = Number(req.body.teacher_id);
  const decision = req.body.decision;

  // =========================================
  // 1. ตรวจสอบข้อมูล
  // =========================================

  if (
    !Number.isInteger(invitationId) ||
    invitationId <= 0 ||
    !Number.isInteger(teacherId) ||
    teacherId <= 0
  ) {
    return res.status(400).json({
      message: "ข้อมูลคำเชิญหรืออาจารย์ไม่ถูกต้อง",
    });
  }

  if (decision !== "ตอบรับ" && decision !== "ปฏิเสธ") {
    return res.status(400).json({
      message: "กรุณาเลือกตอบรับหรือปฏิเสธคำเชิญ",
    });
  }

  // =========================================
  // 2. ตรวจสอบคำเชิญ
  // =========================================

  const checkSql = `
    SELECT
      ecm.id,
      ecm.teacher_id,
      ecm.invited_by,
      ecm.invitation_status,

      es.project_id,

      p.title AS project_title,

      teacher.name AS teacher_name

    FROM exam_committee_members ecm

    INNER JOIN project_exam_schedules es
      ON ecm.schedule_id = es.id

    INNER JOIN projects p
      ON es.project_id = p.id

    INNER JOIN users teacher
      ON ecm.teacher_id = teacher.id
      AND teacher.role = 'teacher'

    WHERE ecm.id = ?
      AND ecm.teacher_id = ?

    LIMIT 1
  `;

  db.query(checkSql, [invitationId, teacherId], (checkErr, rows) => {
    if (checkErr) {
      console.log("Check committee invitation error:", checkErr);

      return res.status(500).json({
        message: "ตรวจสอบคำเชิญไม่สำเร็จ",
      });
    }

    if (rows.length === 0) {
      return res.status(404).json({
        message: "ไม่พบคำเชิญของอาจารย์ท่านนี้",
      });
    }

    const invitation = rows[0];

    // =========================================
    // 3. ต้องยังไม่ตอบรับหรือปฏิเสธ
    // =========================================

    if (invitation.invitation_status !== "รอตอบรับ") {
      return res.status(409).json({
        message: "คำเชิญนี้ได้รับการตอบแล้ว",
      });
    }

    // =========================================
    // 4. อัปเดตสถานะคำเชิญ
    // =========================================

    const updateSql = `
      UPDATE exam_committee_members

      SET
        invitation_status = ?,
        responded_at = NOW()

      WHERE id = ?
        AND teacher_id = ?
        AND invitation_status = 'รอตอบรับ'
    `;

    db.query(
      updateSql,
      [decision, invitationId, teacherId],
      (updateErr, result) => {
        if (updateErr) {
          console.log("Update committee invitation error:", updateErr);

          return res.status(500).json({
            message: "ไม่สามารถบันทึกคำตอบได้",
          });
        }

        if (result.affectedRows === 0) {
          return res.status(409).json({
            message: "คำเชิญนี้ได้รับการตอบแล้ว",
          });
        }

        // =========================================
        // 5. แจ้งเตือนอาจารย์ที่ปรึกษา
        // =========================================

        const message =
          `${invitation.teacher_name} ${decision}คำเชิญ` +
          `เป็นกรรมการสอบโครงงาน "${invitation.project_title}"`;

        const notificationSql = `
          INSERT INTO notifications
          (
            user_id,
            message,
            project_id
          )

          VALUES (?, ?, ?)
        `;

        db.query(
          notificationSql,
          [invitation.invited_by, message, invitation.project_id],
          (notificationErr) => {
            if (notificationErr) {
              console.log(
                "Committee response notification error:",
                notificationErr,
              );
            }

            res.json({
              success: true,
              message: notificationErr
                ? "บันทึกคำตอบแล้ว แต่แจ้งเตือนอาจารย์ที่ปรึกษาไม่สำเร็จ"
                : decision === "ตอบรับ"
                  ? "ตอบรับคำเชิญกรรมการสอบเรียบร้อยแล้ว"
                  : "ปฏิเสธคำเชิญกรรมการสอบเรียบร้อยแล้ว",
              invitation_id: invitationId,
              invitation_status: decision,
            });
          },
        );
      },
    );
  });
});

/* =========================================================
   EXAM - COMMITTEE STATUS
========================================================= */

app.get("/teacher/exam/committee-status/:scheduleId/:advisorId", (req, res) => {
  const { scheduleId, advisorId } = req.params;

  const sql = `
    SELECT
      ecm.id AS committee_member_id,
      ecm.schedule_id,
      ecm.teacher_id,

      u.username AS teacher_username,
      u.name AS teacher_name,

      ecm.invitation_status,
      ecm.invited_at,
      ecm.responded_at

    FROM exam_committee_members ecm

    INNER JOIN project_exam_schedules es
      ON ecm.schedule_id = es.id

    INNER JOIN users u
      ON ecm.teacher_id = u.id

    WHERE es.id = ?
      AND es.advisor_id = ?
      AND u.role = 'teacher'

    ORDER BY ecm.id ASC
  `;

  db.query(sql, [scheduleId, advisorId], (err, results) => {
    if (err) {
      console.log("Get committee status error:", err);

      return res.status(500).json({
        message: "ไม่สามารถโหลดรายชื่อกรรมการสอบได้",
      });
    }

    res.json({
      committee: results,
    });
  });
});

// บันทึกผลสอบรวม เมื่อกรรมการประเมินครบ
function saveCompletedExamResult(memberId, callback) {
  const sql = `
    SELECT
      s.id AS schedule_id,
      s.project_id,
      s.exam_round,
      cm.invitation_status,
      ev.id AS evaluation_id,
      ev.score_correctness,
      ev.score_design,
      ev.score_presentation,
      ev.score_documentation,
      ev.score_questions,
      ev.total_score,
      ev.needs_revision
    FROM exam_committee_members cm
    JOIN project_exam_schedules s
      ON s.id = cm.schedule_id
    LEFT JOIN exam_evaluations ev
      ON ev.committee_member_id = cm.id
    WHERE cm.schedule_id = (
      SELECT schedule_id
      FROM exam_committee_members
      WHERE id = ?
    )
  `;

  db.query(sql, [memberId], (err, rows) => {
    if (err) {
      return callback(err);
    }

    if (rows.length === 0) {
      return callback(new Error("ไม่พบกำหนดการสอบ"));
    }

    let hasPendingInvitation = false;
    let acceptedCount = 0;
    let evaluatedCount = 0;
    let hasRevision = false;

    let sumCorrectness = 0;
    let sumDesign = 0;
    let sumPresentation = 0;
    let sumDocumentation = 0;
    let sumQuestions = 0;
    let sumTotal = 0;

    for (const row of rows) {
      if (row.invitation_status === "รอตอบรับ") {
        hasPendingInvitation = true;
      }

      if (row.invitation_status === "ตอบรับ") {
        acceptedCount++;

        if (row.evaluation_id !== null) {
          evaluatedCount++;

          sumCorrectness += Number(row.score_correctness);
          sumDesign += Number(row.score_design);
          sumPresentation += Number(row.score_presentation);
          sumDocumentation += Number(row.score_documentation);
          sumQuestions += Number(row.score_questions);
          sumTotal += Number(row.total_score);

          if (Number(row.needs_revision) === 1) {
            hasRevision = true;
          }
        }
      }
    }

    // ยังมีกรรมการรอตอบรับ หรือประเมินไม่ครบ
    if (
      hasPendingInvitation ||
      acceptedCount === 0 ||
      evaluatedCount !== acceptedCount
    ) {
      return callback(null, false);
    }

    // คำนวณคะแนนเฉลี่ย
    const average = (sum) => {
      return Number((sum / acceptedCount).toFixed(2));
    };

    const totalScore = average(sumTotal);

    // คำนวณเกรด
    let grade = "F";

    if (totalScore >= 80) grade = "A";
    else if (totalScore >= 75) grade = "B+";
    else if (totalScore >= 70) grade = "B";
    else if (totalScore >= 65) grade = "C+";
    else if (totalScore >= 60) grade = "C";
    else if (totalScore >= 55) grade = "D+";
    else if (totalScore >= 50) grade = "D";

    // คำนวณผลสอบ
    let status = "ผ่าน";

    if (totalScore < 50) {
      status = "ไม่ผ่าน";
    } else if (hasRevision) {
      status = "ผ่านแบบมีเงื่อนไข";
    }

    const finalStatus = status;

    const insertSql = `
      INSERT INTO project_exam_results (
        project_id,
        schedule_id,
        exam_round,
        committee_count,
        score_correctness,
        score_design,
        score_presentation,
        score_documentation,
        score_questions,
        total_score,
        estimated_grade,
        initial_result_status,
        final_result_status,
        published_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
      ON DUPLICATE KEY UPDATE id = id
    `;

    db.query(
      insertSql,
      [
        rows[0].project_id,
        rows[0].schedule_id,
        rows[0].exam_round,
        acceptedCount,
        average(sumCorrectness),
        average(sumDesign),
        average(sumPresentation),
        average(sumDocumentation),
        average(sumQuestions),
        totalScore,
        grade,
        status,
        finalStatus,
      ],
      (saveErr, result) => {
        if (saveErr) {
          return callback(saveErr);
        }

        callback(null, result.affectedRows > 0);
      },
    );
  });
}

/* =========================================================
   TEACHER - SAVE EXAM EVALUATION
========================================================= */

app.post("/teacher/evaluations", (req, res) => {
  const {
    committee_member_id,
    teacher_id,
    score_correctness,
    score_design,
    score_presentation,
    score_documentation,
    score_questions,
    teacher_comment,
    needs_revision,
    revision_details,
  } = req.body;

  const memberId = Number(committee_member_id);
  const teacherId = Number(teacher_id);

  if (
    !Number.isInteger(memberId) ||
    memberId <= 0 ||
    !Number.isInteger(teacherId) ||
    teacherId <= 0
  ) {
    return res.status(400).json({
      message: "ข้อมูลกรรมการสอบไม่ถูกต้อง",
    });
  }

  // ตรวจคะแนนทั้ง 5 หัวข้อ
  const scores = [
    [score_correctness, 30],
    [score_design, 25],
    [score_presentation, 20],
    [score_documentation, 15],
    [score_questions, 10],
  ];

  const validScores = scores.every(([score, max]) => {
    return (
      typeof score === "number" &&
      Number.isInteger(score) &&
      score >= 0 &&
      score <= max
    );
  });

  if (!validScores) {
    return res.status(400).json({
      message: "กรุณากรอกคะแนนให้ถูกต้องครบทุกหัวข้อ",
    });
  }

  if (needs_revision !== 0 && needs_revision !== 1) {
    return res.status(400).json({
      message: "กรุณาระบุว่ามีประเด็นที่ต้องแก้ไขหรือไม่",
    });
  }

  const comment =
    typeof teacher_comment === "string" ? teacher_comment.trim() : "";

  const revisionDetails =
    typeof revision_details === "string" ? revision_details.trim() : "";

  if (needs_revision === 1 && !revisionDetails) {
    return res.status(400).json({
      message: "กรุณาระบุประเด็นที่ต้องแก้ไข",
    });
  }

  // ตรวจสิทธิ์กรรมการและบันทึกคะแนน
  const sql = `
    INSERT INTO exam_evaluations
    (
      committee_member_id,
      score_correctness,
      score_design,
      score_presentation,
      score_documentation,
      score_questions,
      teacher_comment,
      needs_revision,
      revision_details
    )

    SELECT
      ecm.id,
      ?, ?, ?, ?, ?,
      ?, ?, ?

    FROM exam_committee_members ecm

    INNER JOIN project_exam_schedules s
      ON s.id = ecm.schedule_id

    WHERE ecm.id = ?
      AND ecm.teacher_id = ?
      AND ecm.invitation_status = 'ตอบรับ'
      AND s.announced_at IS NOT NULL
  `;

  db.query(
    sql,
    [
      score_correctness,
      score_design,
      score_presentation,
      score_documentation,
      score_questions,
      comment || null,
      needs_revision,
      needs_revision === 1 ? revisionDetails : null,
      memberId,
      teacherId,
    ],
    (err, result) => {
      if (err) {
        console.error("Save evaluation error:", err);

        if (err.code === "ER_DUP_ENTRY") {
          return res.status(409).json({
            message: "กรรมการท่านนี้บันทึกผลการประเมินแล้ว",
          });
        }

        return res.status(500).json({
          message: "ไม่สามารถบันทึกผลการประเมินได้",
        });
      }

      if (result.affectedRows === 0) {
        return res.status(403).json({
          message: "ไม่พบสิทธิ์ประเมินหรือยังไม่ได้ตอบรับคำเชิญ",
        });
      }

      saveCompletedExamResult(memberId, (summaryErr, resultSaved) => {
        if (summaryErr) {
          console.error("Save exam result error:", summaryErr);

          return res.status(201).json({
            success: true,
            result_saved: false,
            message: "บันทึกคะแนนแล้ว แต่ยังบันทึกผลรวมไม่สำเร็จ",
            evaluation_id: result.insertId,
          });
        }

        res.status(201).json({
          success: true,
          result_saved: resultSaved,
          message: "บันทึกผลการประเมินเรียบร้อยแล้ว",
          evaluation_id: result.insertId,
        });
      });
    },
  );
});

/* =========================================================
   TEACHER - EXAM EVALUATION LIST
========================================================= */

app.get("/teacher/evaluations/:teacherId", (req, res) => {
  const teacherId = Number(req.params.teacherId);

  if (!Number.isInteger(teacherId) || teacherId <= 0) {
    return res.status(400).json({
      message: "รหัสอาจารย์ไม่ถูกต้อง",
    });
  }

  const sql = `
    SELECT
      ecm.id AS committee_member_id,

      s.id AS schedule_id,
      DATE_FORMAT(s.exam_date, '%Y-%m-%d') AS exam_date,
      TIME_FORMAT(s.start_time, '%H:%i') AS start_time,
      TIME_FORMAT(s.end_time, '%H:%i') AS end_time,
      s.location,

      p.id AS project_id,
      p.title AS project_title,

      advisor.name AS advisor_name,

      COALESCE(students.student_names, '-') AS student_names,

      
      ev.id AS evaluation_id,

      ev.score_correctness,
      ev.score_design,
      ev.score_presentation,
      ev.score_documentation,
      ev.score_questions,

      ev.total_score,
      ev.teacher_comment,
      ev.needs_revision,
      ev.revision_details,
      ev.evaluated_at


    FROM exam_committee_members ecm

    INNER JOIN project_exam_schedules s
      ON ecm.schedule_id = s.id

    INNER JOIN projects p
      ON s.project_id = p.id

    INNER JOIN users advisor
      ON p.advisor_id = advisor.id

    LEFT JOIN (
      SELECT
        pm.project_id,

        GROUP_CONCAT(
          CONCAT(u.username, ' ', u.name)
          ORDER BY pm.id ASC
          SEPARATOR ' | '
        ) AS student_names

      FROM project_members pm

      INNER JOIN users u
        ON pm.user_id = u.id

      GROUP BY pm.project_id
    ) students
      ON students.project_id = p.id

    LEFT JOIN exam_evaluations ev
      ON ev.committee_member_id = ecm.id

    WHERE ecm.teacher_id = ?
      AND ecm.invitation_status = 'ตอบรับ'
      AND s.announced_at IS NOT NULL

    ORDER BY s.exam_date DESC, s.start_time DESC
  `;

  db.query(sql, [teacherId], (err, results) => {
    if (err) {
      console.log("Get evaluation list error:", err);

      return res.status(500).json({
        message: "ไม่สามารถโหลดรายการประเมินได้",
      });
    }

    const pending = results.filter((item) => item.evaluation_id === null);

    const evaluated = results.filter((item) => item.evaluation_id !== null);

    res.json({
      pending,
      evaluated,
      pending_count: pending.length,
      evaluated_count: evaluated.length,
    });
  });
});

/* =========================================================
   STUDENT - PROJECT EVALUATION RESULT
========================================================= */

app.get(
  "/student/projects/:projectId/evaluation/:studentId",
  async (req, res) => {
    const projectId = Number(req.params.projectId);
    const studentId = Number(req.params.studentId);

    if (
      !Number.isInteger(projectId) ||
      projectId <= 0 ||
      !Number.isInteger(studentId) ||
      studentId <= 0
    ) {
      return res.status(400).json({
        message: "ข้อมูลโครงงานหรือนิสิตไม่ถูกต้อง",
      });
    }

    const query = (sql, params = []) =>
      new Promise((resolve, reject) => {
        db.query(sql, params, (err, results) => {
          if (err) reject(err);
          else resolve(results);
        });
      });

    try {
      // 1. ตรวจสอบว่านิสิตเป็นสมาชิกโครงงานจริง

      const projects = await query(
        `
    SELECT
      p.id,
      p.title,

      (
        SELECT s.id
        FROM project_exam_schedules s
        WHERE s.project_id = p.id
          AND s.announced_at IS NOT NULL
        ORDER BY s.exam_round DESC, s.id DESC
        LIMIT 1
      ) AS schedule_id

    FROM projects p

    INNER JOIN project_members pm
      ON pm.project_id = p.id

    WHERE p.id = ?
      AND pm.user_id = ?

    LIMIT 1
  `,
        [projectId, studentId],
      );

      if (projects.length === 0) {
        return res.status(404).json({
          message: "ไม่พบโครงงานหรือไม่มีสิทธิ์ดูผลการประเมิน",
        });
      }

      const project = projects[0];

      const pendingResult = {
        status: "pending",
        project_title: project.title,
      };

      // ยังไม่ได้ประกาศกำหนดการสอบ

      if (!project.schedule_id) {
        return res.json(pendingResult);
      }

      // 2. ดึงกรรมการและคะแนนแต่ละท่าน

      const members = await query(
        `
          SELECT
            ecm.teacher_id,
            ecm.invitation_status,

            u.name AS teacher_name,

            ev.id AS evaluation_id,
            ev.score_correctness,
            ev.score_design,
            ev.score_presentation,
            ev.score_documentation,
            ev.score_questions,
            ev.total_score,
            ev.teacher_comment,
            ev.needs_revision,
            ev.revision_details,
            ev.evaluated_at

          FROM exam_committee_members ecm

          INNER JOIN users u
            ON u.id = ecm.teacher_id

          LEFT JOIN exam_evaluations ev
            ON ev.committee_member_id = ecm.id

          WHERE ecm.schedule_id = ?

          ORDER BY
            CASE
              WHEN ecm.teacher_id = (
                SELECT advisor_id
                FROM project_exam_schedules
                WHERE id = ?
              ) THEN 0
              ELSE 1
            END,
            ecm.id ASC
        `,
        [project.schedule_id, project.schedule_id],
      );

      // 3. ต้องไม่มีคำเชิญที่ยังรอตอบรับ

      const hasPendingInvitation = members.some(
        (member) => member.invitation_status === "รอตอบรับ",
      );

      const acceptedMembers = members.filter(
        (member) => member.invitation_status === "ตอบรับ",
      );

      // 4. กรรมการที่ตอบรับทุกท่านต้องบันทึกคะแนนครบ

      const allEvaluated =
        acceptedMembers.length > 0 &&
        acceptedMembers.every(
          (member) =>
            member.evaluation_id !== null && member.total_score !== null,
        );

      if (hasPendingInvitation || !allEvaluated) {
        return res.json(pendingResult);
      }

      // 5. คำนวณคะแนนเฉลี่ย

      const average = (field) => {
        const sum = acceptedMembers.reduce(
          (total, member) => total + Number(member[field]),
          0,
        );

        return Number((sum / acceptedMembers.length).toFixed(2));
      };

      const totalScore = average("total_score");

      // 6. แปลงคะแนนเฉลี่ยเป็นเกรด

      const getGrade = (score) => {
        if (score >= 80) return "A";
        if (score >= 75) return "B+";
        if (score >= 70) return "B";
        if (score >= 65) return "C+";
        if (score >= 60) return "C";
        if (score >= 55) return "D+";
        if (score >= 50) return "D";
        return "E/F";
      };

      // 7. ตรวจว่ามีกรรมการระบุให้แก้ไขหรือไม่

      const hasRevision = acceptedMembers.some(
        (member) => Number(member.needs_revision) === 1,
      );

      const resultStatus =
        totalScore < 50
          ? "ไม่ผ่าน"
          : hasRevision
            ? "ผ่านแบบมีเงื่อนไข"
            : "ผ่าน";

      // 8. วันที่กรรมการคนสุดท้ายบันทึกคะแนน

      const evaluatedDates = acceptedMembers
        .map((member) => new Date(member.evaluated_at))
        .filter((date) => !Number.isNaN(date.getTime()));

      const publishedAt =
        evaluatedDates.length > 0
          ? new Date(Math.max(...evaluatedDates.map((date) => date.getTime())))
          : null;

      // 9. รวบรวมความคิดเห็นของกรรมการ

      const comments = acceptedMembers
        .filter(
          (member) =>
            member.teacher_comment && member.teacher_comment.trim() !== "",
        )
        .map((member) => ({
          teacher_name: member.teacher_name,
          comment: member.teacher_comment,
        }));

      // ==========================================
      // รวบรวมประเด็นที่กรรมการระบุให้แก้ไข
      // ==========================================

      const revisionDetails = acceptedMembers
        .filter(
          (member) =>
            Number(member.needs_revision) === 1 &&
            typeof member.revision_details === "string",
        )
        .flatMap((member) =>
          member.revision_details
            .split(/\r?\n/)
            .map((item) => item.trim().replace(/^[-•]\s*/, ""))
            .filter((item) => item !== "")
            .map((item) => ({
              teacher_name: member.teacher_name,
              detail: item,
            })),
        );

      // ดึงผลประเมินที่บันทึกไว้ในฐานข้อมูล
      const savedRows = await query(
        `
    SELECT *
    FROM project_exam_results
    WHERE project_id = ?
      AND schedule_id = ?
    LIMIT 1
  `,
        [projectId, project.schedule_id],
      );

      const savedResult = savedRows[0] || null;

      // 10. ส่งผลให้ฝั่งนิสิต

      return res.json({
        status: "published",

        project_title: project.title,

        result_status: savedResult?.initial_result_status ?? resultStatus,

        final_result_status: savedResult?.final_result_status ?? null,

        grade: savedResult?.estimated_grade ?? getGrade(totalScore),

        total_score: savedResult ? Number(savedResult.total_score) : totalScore,

        evaluated_at: savedResult?.published_at ?? publishedAt,

        committee: acceptedMembers.map((member) => member.teacher_name),

        scores: [
          {
            label: "ความถูกต้องและความสมบูรณ์ของระบบ",
            max: 30,
            score: average("score_correctness"),
          },
          {
            label: "การออกแบบและพัฒนาระบบ",
            max: 25,
            score: average("score_design"),
          },
          {
            label: "การนำเสนอ",
            max: 20,
            score: average("score_presentation"),
          },
          {
            label: "เอกสารประกอบโครงงาน",
            max: 15,
            score: average("score_documentation"),
          },
          {
            label: "การตอบคำถาม",
            max: 10,
            score: average("score_questions"),
          },
        ],

        comments: comments,
        revision_details: revisionDetails,
      });
    } catch (err) {
      console.error("Student evaluation error:", err);

      return res.status(500).json({
        message: "ไม่สามารถโหลดผลการประเมินได้",
      });
    }
  },
);

/* =========================================================
   TEACHER - MANAGED PROJECT EVALUATION RESULT
========================================================= */

app.get("/teacher/managed-projects/:projectId/evaluation", async (req, res) => {
  const projectId = Number(req.params.projectId);
  const advisorId = Number(req.query.advisorId);

  if (
    !Number.isInteger(projectId) ||
    projectId <= 0 ||
    !Number.isInteger(advisorId) ||
    advisorId <= 0
  ) {
    return res.status(400).json({
      message: "ข้อมูลโครงงานหรืออาจารย์ไม่ถูกต้อง",
    });
  }

  const query = (sql, params = []) => {
    return new Promise((resolve, reject) => {
      db.query(sql, params, (err, results) => {
        if (err) {
          reject(err);
        } else {
          resolve(results);
        }
      });
    });
  };

  try {
    // 1. ตรวจสอบว่าเป็นโครงงานที่อาจารย์ดูแล

    const projects = await query(
      `
        SELECT
          p.id,
          p.title,

          (
            SELECT MAX(s.id)
            FROM project_exam_schedules s
            WHERE s.project_id = p.id
              AND s.announced_at IS NOT NULL
          ) AS schedule_id

        FROM projects p

        WHERE p.id = ?
          AND p.advisor_id = ?

        LIMIT 1
        `,
      [projectId, advisorId],
    );

    if (projects.length === 0) {
      return res.status(404).json({
        message: "ไม่พบโครงงานที่ดูแล",
      });
    }

    const project = projects[0];

    const pendingResult = {
      hasEvaluation: false,
    };

    if (!project.schedule_id) {
      return res.json(pendingResult);
    }

    // 2. ดึงกรรมการและผลคะแนนที่บันทึกไว้

    const members = await query(
      `
        SELECT
          cm.teacher_id,
          cm.invitation_status,

          u.name AS teacher_name,

          ev.id AS evaluation_id,
          ev.score_correctness,
          ev.score_design,
          ev.score_presentation,
          ev.score_documentation,
          ev.score_questions,
          ev.total_score,
          ev.teacher_comment,
          ev.needs_revision,
          ev.revision_details,
          ev.evaluated_at

        FROM exam_committee_members cm

        INNER JOIN users u
          ON u.id = cm.teacher_id

        LEFT JOIN exam_evaluations ev
          ON ev.committee_member_id = cm.id

        WHERE cm.schedule_id = ?

        ORDER BY
          CASE
            WHEN cm.teacher_id = ? THEN 0
            ELSE 1
          END,
          cm.id ASC
        `,
      [project.schedule_id, advisorId],
    );

    // 3. กรรมการต้องตอบรับและประเมินครบก่อน

    const hasPendingInvitation = members.some(
      (member) => member.invitation_status === "รอตอบรับ",
    );

    const acceptedMembers = members.filter(
      (member) => member.invitation_status === "ตอบรับ",
    );

    const allEvaluated =
      acceptedMembers.length > 0 &&
      acceptedMembers.every(
        (member) =>
          member.evaluation_id !== null && member.total_score !== null,
      );

    if (hasPendingInvitation || !allEvaluated) {
      return res.json(pendingResult);
    }

    // 4. คำนวณคะแนนเฉลี่ยของกรรมการ

    const average = (field) => {
      const total = acceptedMembers.reduce(
        (sum, member) => sum + Number(member[field]),
        0,
      );

      return Number((total / acceptedMembers.length).toFixed(2));
    };

    const totalScore = average("total_score");

    // 5. ตรวจผลการประเมิน

    const needsRevision = acceptedMembers.some(
      (member) => Number(member.needs_revision) === 1,
    );

    const resultStatus =
      totalScore < 50 ? "ไม่ผ่าน" : needsRevision ? "ต้องแก้ไข" : "ผ่าน";

    // 6. วันที่กรรมการคนสุดท้ายบันทึกผล

    const evaluatedDates = acceptedMembers
      .map((member) => new Date(member.evaluated_at))
      .filter((date) => !Number.isNaN(date.getTime()));

    const evaluatedAt =
      evaluatedDates.length > 0
        ? new Date(Math.max(...evaluatedDates.map((date) => date.getTime())))
        : null;

    // 7. รวมความคิดเห็น / ข้อเสนอแนะ

    const comments = acceptedMembers
      .filter(
        (member) =>
          member.teacher_comment && member.teacher_comment.trim() !== "",
      )
      .map((member) => `${member.teacher_name}: ${member.teacher_comment}`)
      .join("\n");

    // 8. รวมประเด็นที่ต้องแก้ไข

    const revisionDetails = acceptedMembers
      .filter(
        (member) =>
          Number(member.needs_revision) === 1 && member.revision_details,
      )
      .map((member) => `${member.teacher_name}: ${member.revision_details}`)
      .join("\n");

    // 9. ส่งผลการประเมินไปยังหน้าอาจารย์

    return res.json({
      hasEvaluation: true,

      resultStatus,
      totalScore,
      evaluatedAt,

      committeeNames: acceptedMembers.map((member) => member.teacher_name),

      details: [
        {
          criteria: "ความถูกต้องและความสมบูรณ์ของระบบ",
          fullScore: 30,
          score: average("score_correctness"),
        },
        {
          criteria: "การออกแบบและพัฒนาระบบ",
          fullScore: 25,
          score: average("score_design"),
        },
        {
          criteria: "การนำเสนอ",
          fullScore: 20,
          score: average("score_presentation"),
        },
        {
          criteria: "เอกสารประกอบโครงงาน",
          fullScore: 15,
          score: average("score_documentation"),
        },
        {
          criteria: "การตอบคำถาม",
          fullScore: 10,
          score: average("score_questions"),
        },
      ],

      comment: comments,
      needsRevision,
      revisionDetails,
    });
  } catch (error) {
    console.error("Managed evaluation error:", error);

    return res.status(500).json({
      message: "ไม่สามารถโหลดผลการประเมินได้",
    });
  }
});

/* =========================================================
   TEACHER - MANAGED PROJECTS
========================================================= */

app.get("/teacher/managed-projects/:advisorId", (req, res) => {
  const advisorId = Number(req.params.advisorId);

  if (!Number.isInteger(advisorId) || advisorId <= 0) {
    return res.status(400).json({
      message: "รหัสอาจารย์ไม่ถูกต้อง",
    });
  }

  const sql = `
    SELECT
      p.id,
      p.title,

      COALESCE(
        (
          SELECT GROUP_CONCAT(
            CONCAT(u.username, ' ', u.name)
            ORDER BY pm.id ASC
            SEPARATOR ' | '
          )
          FROM project_members pm
          INNER JOIN users u ON pm.user_id = u.id
          WHERE pm.project_id = p.id
        ),
        '-'
      ) AS students,

      s.id AS schedule_id,
      DATE_FORMAT(s.exam_date, '%Y-%m-%d') AS exam_date,
      TIME_FORMAT(s.end_time, '%H:%i') AS end_time,

      (
        SELECT COUNT(*)
        FROM exam_committee_members cm
        WHERE cm.schedule_id = s.id
          AND cm.invitation_status = 'ตอบรับ'
      ) AS accepted_count,

      (
        SELECT COUNT(*)
        FROM exam_committee_members cm
        WHERE cm.schedule_id = s.id
          AND cm.invitation_status = 'รอตอบรับ'
      ) AS pending_invitation_count,

      (
        SELECT COUNT(*)
        FROM exam_committee_members cm
        INNER JOIN exam_evaluations ev
          ON ev.committee_member_id = cm.id
        WHERE cm.schedule_id = s.id
          AND cm.invitation_status = 'ตอบรับ'
      ) AS evaluation_count

    FROM projects p

    LEFT JOIN project_exam_schedules s
      ON s.id = (
        SELECT MAX(s2.id)
        FROM project_exam_schedules s2
        WHERE s2.project_id = p.id
      )

    WHERE p.advisor_id = ?

      AND EXISTS (
        SELECT 1
        FROM project_members pm
        WHERE pm.project_id = p.id
      )

    ORDER BY p.id DESC
  `;

  db.query(sql, [advisorId], (err, results) => {
    if (err) {
      console.error("Managed projects error:", err);

      return res.status(500).json({
        message: "ไม่สามารถโหลดโครงงานที่ดูแลได้",
      });
    }

    const projects = results.map((item) => {
      let status = "in_progress";

      const accepted = Number(item.accepted_count);
      const pending = Number(item.pending_invitation_count);
      const evaluated = Number(item.evaluation_count);

      if (item.schedule_id) {
        if (accepted > 0 && pending === 0 && evaluated === accepted) {
          status = "completed";
        } else {
          const examEnd = item.exam_date
            ? new Date(`${item.exam_date}T${item.end_time || "23:59"}:00+07:00`)
            : null;

          if (examEnd && examEnd > new Date()) {
            status = "waiting_exam";
          } else {
            status = "evaluating";
          }
        }
      }

      return {
        id: item.id,
        title: item.title,
        students: item.students,
        status: status,
      };
    });

    res.json(projects);
  });
});

/* =========================================================
   STUDENT - EXAM REVISION SUBMISSION
========================================================= */

const examRevisionDir = path.join(__dirname, "uploads", "exam-revision-files");

fs.mkdirSync(examRevisionDir, { recursive: true });

const examRevisionUpload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, examRevisionDir);
    },

    filename: (req, file, cb) => {
      const ext = path.extname(file.originalname).toLowerCase();
      const filename = `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;

      cb(null, filename);
    },
  }),

  limits: {
    fileSize: 10 * 1024 * 1024,
    files: 10,
  },

  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();

    if ([".pdf", ".doc", ".docx"].includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error("รองรับเฉพาะไฟล์ PDF, DOC และ DOCX"));
    }
  },
}).array("files", 10);

const examRevisionQuery = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.query(sql, params, (err, result) => {
      if (err) reject(err);
      else resolve(result);
    });
  });
};

// บันทึกงานแก้ไขหลังการสอบ
app.post("/student/projects/:projectId/exam-revision", (req, res) => {
  examRevisionUpload(req, res, async (uploadError) => {
    const uploadedFiles = req.files || [];

    const cleanupFiles = () => {
      for (const file of uploadedFiles) {
        try {
          if (fs.existsSync(file.path)) {
            fs.unlinkSync(file.path);
          }
        } catch (err) {
          console.error("Cleanup exam revision file:", err);
        }
      }
    };

    if (uploadError) {
      cleanupFiles();

      return res.status(400).json({
        message: uploadError.message,
      });
    }

    try {
      const projectId = Number(req.params.projectId);
      const studentId = Number(req.body.student_id);
      const description = String(req.body.description || "").trim();

      if (
        !Number.isInteger(projectId) ||
        projectId <= 0 ||
        !Number.isInteger(studentId) ||
        studentId <= 0
      ) {
        throw Object.assign(new Error("ข้อมูลโครงงานหรือนิสิตไม่ถูกต้อง"), {
          statusCode: 400,
        });
      }

      if (!description || uploadedFiles.length === 0) {
        throw Object.assign(
          new Error("กรุณากรอกรายละเอียดและแนบไฟล์อย่างน้อย 1 ไฟล์"),
          { statusCode: 400 },
        );
      }

      // ตรวจสอบสมาชิกโครงงาน
      const members = await examRevisionQuery(
        `SELECT u.name AS student_name
         FROM project_members pm
         JOIN users u ON u.id = pm.user_id
         WHERE pm.project_id = ?
           AND pm.user_id = ?
         LIMIT 1`,
        [projectId, studentId],
      );

      if (members.length === 0) {
        throw Object.assign(new Error("ไม่มีสิทธิ์ส่งงานแก้ไขของโครงงานนี้"), {
          statusCode: 403,
        });
      }

      // ตรวจสอบว่ากรรมการประเมินครบ และผลเป็นผ่านแบบมีเงื่อนไข
      const summaryRows = await examRevisionQuery(
        `SELECT
           COUNT(CASE WHEN cm.invitation_status = 'ตอบรับ'
             THEN 1 END) AS accepted_count,

           COUNT(CASE WHEN cm.invitation_status = 'รอตอบรับ'
             THEN 1 END) AS pending_count,

           COUNT(CASE WHEN cm.invitation_status = 'ตอบรับ'
                      AND ev.id IS NOT NULL
             THEN 1 END) AS evaluated_count,

           MAX(CASE WHEN cm.invitation_status = 'ตอบรับ'
             THEN COALESCE(ev.needs_revision, 0)
             ELSE 0 END) AS needs_revision,

           AVG(CASE WHEN cm.invitation_status = 'ตอบรับ'
             THEN ev.total_score END) AS average_score

         FROM project_exam_schedules s
         JOIN exam_committee_members cm ON cm.schedule_id = s.id
         LEFT JOIN exam_evaluations ev ON ev.committee_member_id = cm.id
         WHERE s.project_id = ?`,
        [projectId],
      );

      const summary = summaryRows[0];

      const accepted = Number(summary.accepted_count);
      const evaluated = Number(summary.evaluated_count);

      if (
        accepted === 0 ||
        Number(summary.pending_count) > 0 ||
        accepted !== evaluated ||
        Number(summary.needs_revision) !== 1 ||
        Number(summary.average_score) < 50
      ) {
        throw Object.assign(
          new Error("โครงงานนี้ยังไม่มีผลผ่านแบบมีเงื่อนไข"),
          { statusCode: 400 },
        );
      }

      // ป้องกันการส่งซ้ำระหว่างรอตรวจ
      const previous = await examRevisionQuery(
        `SELECT status
         FROM exam_revision_submissions
         WHERE project_id = ?
         ORDER BY id DESC
         LIMIT 1`,
        [projectId],
      );

      if (previous.length > 0 && previous[0].status !== "ต้องแก้ไข") {
        throw Object.assign(new Error("โครงงานนี้ส่งงานแก้ไขแล้ว"), {
          statusCode: 409,
        });
      }

      const files = uploadedFiles.map((file) => ({
        name: file.originalname,
        path: `/uploads/exam-revision-files/${file.filename}`,
        size: file.size,
      }));

      const saved = await examRevisionQuery(
        `INSERT INTO exam_revision_submissions
          (project_id, student_id, description, files_json, status)
         VALUES (?, ?, ?, ?, 'รอตรวจ')`,
        [projectId, studentId, description, JSON.stringify(files)],
      );
      // ==========================================
      // แจ้งเตือนอาจารย์ที่ปรึกษาเมื่อส่งงานแก้ไข
      // ==========================================

      try {
        const notificationSql = `
    INSERT INTO notifications
      (user_id, message, project_id)

    SELECT
      p.advisor_id,
      CONCAT(
        u.name,
        ' ส่งงานแก้ไขหลังการสอบของโครงงาน "',
        p.title,
        '" รอให้คุณตรวจสอบ'
      ),
      p.id

    FROM projects p

    INNER JOIN users u
      ON u.id = ?

    WHERE p.id = ?
      AND p.advisor_id IS NOT NULL
  `;

        await examRevisionQuery(notificationSql, [studentId, projectId]);
      } catch (notificationError) {
        console.error("Exam revision notification error:", notificationError);
      }

      res.status(201).json({
        success: true,
        message: "ส่งงานแก้ไขเรียบร้อยแล้ว",
        submission: {
          id: saved.insertId,
          status: "รอตรวจ",
          student_name: members[0].student_name,
          description,
          files,
          submitted_at: new Date().toISOString(),
        },
      });
    } catch (err) {
      cleanupFiles();
      console.error("Submit exam revision error:", err);

      res.status(err.statusCode || 500).json({
        message: err.statusCode ? err.message : "ไม่สามารถบันทึกงานแก้ไขได้",
      });
    }
  });
});

// ดึงงานแก้ไขล่าสุดเพื่อแสดงเมื่อเปิดหน้าอีกครั้ง
app.get(
  "/student/projects/:projectId/exam-revision/:studentId",
  async (req, res) => {
    try {
      const projectId = Number(req.params.projectId);
      const studentId = Number(req.params.studentId);

      if (
        !Number.isInteger(projectId) ||
        projectId <= 0 ||
        !Number.isInteger(studentId) ||
        studentId <= 0
      ) {
        return res.status(400).json({
          message: "ข้อมูลโครงงานหรือนิสิตไม่ถูกต้อง",
        });
      }

      const membership = await examRevisionQuery(
        `SELECT id
         FROM project_members
         WHERE project_id = ? AND user_id = ?
         LIMIT 1`,
        [projectId, studentId],
      );

      if (membership.length === 0) {
        return res.status(403).json({
          message: "ไม่มีสิทธิ์ดูงานแก้ไขนี้",
        });
      }

      const rows = await examRevisionQuery(
        `SELECT
           ers.id,
           ers.description,
           ers.status,
           ers.submitted_at,
           ers.review_comment,
           ers.reviewed_at,
           ers.files_json,
           u.name AS student_name
         FROM exam_revision_submissions ers
         JOIN users u ON u.id = ers.student_id
         WHERE ers.project_id = ?
         ORDER BY ers.id ASC`,
        [projectId],
      );

      if (rows.length === 0) {
        return res.json({
          submission: null,
          submissions: [],
        });
      }

      const submissions = rows.map((row) => {
        return {
          id: row.id,
          description: row.description,
          status: row.status,
          review_comment: row.review_comment,
          reviewed_at: row.reviewed_at,
          student_name: row.student_name,
          submitted_at: row.submitted_at,

          files:
            typeof row.files_json === "string"
              ? JSON.parse(row.files_json || "[]")
              : row.files_json || [],
        };
      });

      res.json({
        submission: submissions[submissions.length - 1] || null,
        submissions: submissions,
      });
    } catch (err) {
      console.error("Get exam revision error:", err);

      res.status(500).json({
        message: "ไม่สามารถโหลดงานแก้ไขได้",
      });
    }
  },
);
// ==========================================
// TEACHER - งานแก้ไขหลังสอบที่รอตรวจ
// ==========================================

app.get("/teacher/exam-revisions/pending/:advisorId", async (req, res) => {
  try {
    const advisorId = Number(req.params.advisorId);

    if (!Number.isInteger(advisorId) || advisorId <= 0) {
      return res.status(400).json({
        message: "รหัสอาจารย์ไม่ถูกต้อง",
      });
    }

    const sql = `
      SELECT
        ers.id AS submission_id,
        ers.project_id,
        p.title AS project_title,

        u.username AS student_username,
        u.name AS student_name,

        ers.description,
        ers.files_json,
        ers.submitted_at,
        ers.status

      FROM exam_revision_submissions ers

      INNER JOIN projects p
        ON ers.project_id = p.id

      INNER JOIN users u
        ON ers.student_id = u.id

      WHERE p.advisor_id = ?
        AND ers.status = 'รอตรวจ'

      ORDER BY ers.submitted_at DESC
    `;

    const rows = await examRevisionQuery(sql, [advisorId]);

    const pending = rows.map((row) => ({
      submission_id: row.submission_id,
      project_id: row.project_id,
      project_title: row.project_title,
      student_username: row.student_username,
      student_name: row.student_name,
      description: row.description,
      submitted_at: row.submitted_at,
      status: row.status,
      work_type: "งานแก้ไขหลังสอบ",
      files:
        typeof row.files_json === "string"
          ? JSON.parse(row.files_json)
          : row.files_json || [],
    }));

    res.json({
      pending,
      pending_count: pending.length,
    });
  } catch (error) {
    console.error("Load pending exam revisions error:", error);

    res.status(500).json({
      message: "ไม่สามารถโหลดงานแก้ไขหลังสอบได้",
    });
  }
});

/* =========================================================
   TEACHER - EXAM REVISION DETAIL
========================================================= */

app.get("/teacher/exam-revisions/:submissionId", async (req, res) => {
  try {
    const submissionId = Number(req.params.submissionId);
    const advisorId = Number(req.query.advisorId);

    if (
      !Number.isInteger(submissionId) ||
      submissionId <= 0 ||
      !Number.isInteger(advisorId) ||
      advisorId <= 0
    ) {
      return res.status(400).json({
        message: "ข้อมูลไม่ถูกต้อง",
      });
    }

    const rows = await examRevisionQuery(
      `SELECT
        ers.id AS submission_id,
        ers.project_id,
        p.title AS project_title,
        u.name AS student_name,
        u.username AS student_username,
        ers.description,
        ers.files_json,
        ers.status,
        ers.submitted_at,
        ers.review_comment,
        ers.reviewed_at
       FROM exam_revision_submissions ers
       INNER JOIN projects p ON p.id = ers.project_id
       INNER JOIN users u ON u.id = ers.student_id
       WHERE ers.id = ?
         AND p.advisor_id = ?
       LIMIT 1`,
      [submissionId, advisorId],
    );

    if (rows.length === 0) {
      return res.status(404).json({
        message: "ไม่พบงานแก้ไขหรือไม่มีสิทธิ์ตรวจ",
      });
    }

    const row = rows[0];

    // ดึงสิ่งที่กรรมการแต่ละท่านให้แก้ไข
    const comments = await examRevisionQuery(
      `SELECT
         teacher.name AS teacher_name,
         ev.revision_details
       FROM project_exam_schedules s
       INNER JOIN exam_committee_members cm
         ON cm.schedule_id = s.id
       INNER JOIN users teacher
         ON teacher.id = cm.teacher_id
       INNER JOIN exam_evaluations ev
         ON ev.committee_member_id = cm.id
       WHERE s.project_id = ?
         AND cm.invitation_status = 'ตอบรับ'
         AND ev.needs_revision = 1
       ORDER BY cm.id ASC`,
      [row.project_id],
    );

    const revision_items = comments
      .map((item) => ({
        teacher_name: item.teacher_name,
        details: String(item.revision_details || "")
          .split(/\r?\n/)
          .map((detail) => detail.trim().replace(/^[-•]\s*/, ""))
          .filter(Boolean),
      }))
      .filter((item) => item.details.length > 0);

    res.json({
      submission_id: row.submission_id,
      project_id: row.project_id,
      project_title: row.project_title,
      student_name: row.student_name,
      student_username: row.student_username,
      description: row.description,
      status: row.status,
      submitted_at: row.submitted_at,
      review_comment: row.review_comment,
      reviewed_at: row.reviewed_at,
      files:
        typeof row.files_json === "string"
          ? JSON.parse(row.files_json)
          : row.files_json || [],
      revision_items,
    });
  } catch (error) {
    console.error("Exam revision detail error:", error);

    res.status(500).json({
      message: "ไม่สามารถโหลดรายละเอียดงานแก้ไขได้",
    });
  }
});

/* =========================================================
   TEACHER - SAVE EXAM REVISION REVIEW
========================================================= */

app.patch("/teacher/exam-revisions/:submissionId/review", async (req, res) => {
  try {
    const submissionId = Number(req.params.submissionId);
    const advisorId = Number(req.body.advisor_id);
    const result = req.body.result;
    const comment = String(req.body.comment || "").trim();

    if (
      !Number.isInteger(submissionId) ||
      submissionId <= 0 ||
      !Number.isInteger(advisorId) ||
      advisorId <= 0
    ) {
      return res.status(400).json({
        message: "ข้อมูลไม่ถูกต้อง",
      });
    }

    if (result !== "ผ่าน" && result !== "ต้องแก้ไข") {
      return res.status(400).json({
        message: "กรุณาเลือกผลการตรวจ",
      });
    }

    if (result === "ต้องแก้ไข" && !comment) {
      return res.status(400).json({
        message: "กรุณาระบุข้อเสนอแนะให้นิสิตแก้ไข",
      });
    }

    const saved = await examRevisionQuery(
      `UPDATE exam_revision_submissions ers
         INNER JOIN projects p
           ON p.id = ers.project_id
         SET
           ers.status = ?,
           ers.review_comment = ?,
           ers.reviewed_at = NOW()
         WHERE ers.id = ?
           AND p.advisor_id = ?
           AND ers.status = 'รอตรวจ'`,
      [result, comment || null, submissionId, advisorId],
    );

    if (saved.affectedRows === 0) {
      return res.status(409).json({
        message: "ไม่พบงานรอตรวจ หรือมีการบันทึกผลไปแล้ว",
      });
    }

    res.json({
      success: true,
      message: "บันทึกผลการตรวจเรียบร้อยแล้ว",
      status: result,
    });
  } catch (error) {
    console.error("Save exam revision review error:", error);

    res.status(500).json({
      message: "ไม่สามารถบันทึกผลการตรวจได้",
    });
  }
});

app.listen(5000, () => {
  console.log("Server running on port 5000");
});
