
const fs = require("fs");
const path = require("path");
const db = require("../db");

/* =========================================================
   BACKFILL OLD TASK SUBMISSION
   TASK ID = 2
   PROJECT ID = 24
========================================================= */

const TASK_ID = 2;
const PROJECT_ID = 24;

const backendDir = path.resolve(__dirname, "..");

const taskFileDir = path.join(
  backendDir,
  "uploads",
  "task-files"
);

const snapshotDir = path.join(
  backendDir,
  "uploads",
  "task-submissions"
);

/* =========================================================
   DATABASE HELPERS
========================================================= */

function getConnection() {
  return new Promise((resolve, reject) => {
    if (typeof db.getConnection === "function") {
      db.getConnection((err, connection) => {
        if (err) return reject(err);

        resolve({
          connection,
          fromPool: true,
        });
      });
    } else {
      resolve({
        connection: db,
        fromPool: false,
      });
    }
  });
}

function query(connection, sql, params = []) {
  return new Promise((resolve, reject) => {
    connection.query(sql, params, (err, rows) => {
      if (err) return reject(err);

      resolve(rows);
    });
  });
}

function transaction(connection, action) {
  return new Promise((resolve, reject) => {
    connection[action]((err) => {
      if (err) return reject(err);

      resolve();
    });
  });
}

/* =========================================================
   MAIN MIGRATION
========================================================= */

async function migrate() {
  let connection = null;
  let fromPool = false;
  let transactionStarted = false;

  const copiedFiles = [];

  try {
    const acquired = await getConnection();

    connection = acquired.connection;
    fromPool = acquired.fromPool;

    await fs.promises.mkdir(snapshotDir, {
      recursive: true,
    });

    await transaction(connection, "beginTransaction");
    transactionStarted = true;

    // =========================================
    // 1. ตรวจสอบ Task
    // =========================================

    const tasks = await query(
      connection,
      `
        SELECT
          id,
          project_id,
          task_name,
          review_status,
          submitted_at

        FROM project_tasks

        WHERE id = ?
          AND project_id = ?

        LIMIT 1
        FOR UPDATE
      `,
      [TASK_ID, PROJECT_ID]
    );

    if (tasks.length === 0) {
      throw new Error("ไม่พบ Task ID 2 ในโครงงาน 24");
    }

    const task = tasks[0];

    if (!task.submitted_at) {
      throw new Error(
        "งานนี้ไม่มีวันที่ส่ง จึงไม่สามารถสร้างประวัติย้อนหลังได้"
      );
    }

    if (
      !["ผ่าน", "แก้ไข", "รอตรวจ"].includes(
        task.review_status
      )
    ) {
      throw new Error("สถานะการตรวจไม่ถูกต้อง");
    }

    // =========================================
    // 2. ป้องกันการย้ายซ้ำ
    // =========================================

    const existing = await query(
      connection,
      `
        SELECT id
        FROM task_submissions
        WHERE task_id = ?
        FOR UPDATE
      `,
      [TASK_ID]
    );

    if (existing.length > 0) {
      console.log(
        "Task ID 2 มีประวัติอยู่แล้ว ไม่ต้องย้ายซ้ำ"
      );

      await transaction(connection, "rollback");
      transactionStarted = false;
      return;
    }

    // =========================================
    // 3. ตรวจไฟล์ที่ยังเหลืออยู่
    // =========================================

    const files = await query(
      connection,
      `
        SELECT
          tf.id,
          tf.original_name,
          tf.stored_name,
          tf.mime_type,
          tf.file_size

        FROM task_files tf

        INNER JOIN project_tasks t
          ON t.id = tf.task_id

        WHERE tf.task_id = ?
          AND tf.uploaded_at <= t.submitted_at

        ORDER BY tf.id ASC
      `,
      [TASK_ID]
    );

    // ตรวจไฟล์จริงก่อนบันทึก

    for (const file of files) {
      if (!file.stored_name) {
        throw new Error(
          `ไฟล์ ${file.original_name} ไม่มีชื่อไฟล์ที่เก็บไว้`
        );
      }

      const sourcePath = path.join(
        taskFileDir,
        path.basename(file.stored_name)
      );

      if (!fs.existsSync(sourcePath)) {
        throw new Error(
          `ไม่พบไฟล์ต้นฉบับ: ${file.original_name}`
        );
      }
    }

    // =========================================
    // 4. สร้างประวัติจากข้อมูลจริงที่ยังมีอยู่
    // =========================================

    const result = await query(
      connection,
      `
        INSERT INTO task_submissions
        (
          task_id,
          submission_number,
          student_id,
          submission_note,
          submitted_at,
          review_status,
          reviewed_at,
          reviewed_by,
          teacher_comment
        )

        SELECT
          id,
          1,
          NULL,
          submission_note,
          submitted_at,
          review_status,
          reviewed_at,
          reviewed_by,
          teacher_comment

        FROM project_tasks

        WHERE id = ?
      `,
      [TASK_ID]
    );

    const submissionId = result.insertId;

    // =========================================
    // 5. คัดลอกไฟล์ไปเก็บแยก
    // =========================================

    for (const file of files) {
      const originalStoredName = path.basename(
        file.stored_name
      );

      const sourcePath = path.join(
        taskFileDir,
        originalStoredName
      );

      const newStoredName =
        `legacy-${TASK_ID}-${submissionId}-${file.id}-` +
        originalStoredName;

      const destinationPath = path.join(
        snapshotDir,
        newStoredName
      );

      // ห้ามเขียนทับสำเนาที่มีอยู่แล้ว
      await fs.promises.copyFile(
        sourcePath,
        destinationPath,
        fs.constants.COPYFILE_EXCL
      );

      copiedFiles.push(destinationPath);

      const filePath =
        `/uploads/task-submissions/${newStoredName}`;

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
          filePath,
          file.mime_type,
          file.file_size,
        ]
      );
    }

    // =========================================
    // 6. ยืนยันการบันทึก
    // =========================================

    await transaction(connection, "commit");
    transactionStarted = false;

    console.log("ย้ายประวัติ Task ID 2 สำเร็จ");
    console.log("Submission ID:", submissionId);
    console.log("จำนวนไฟล์ที่สำรอง:", files.length);

  } catch (err) {
    if (transactionStarted && connection) {
      await transaction(connection, "rollback");
    }

    // ลบสำเนาที่คัดลอกระหว่างการทำงาน
    for (const filePath of copiedFiles) {
      try {
        await fs.promises.unlink(filePath);
      } catch (fileErr) {
        console.log("ลบสำเนาไม่สำเร็จ:", fileErr);
      }
    }

    throw err;

  } finally {
    if (fromPool && connection) {
      connection.release();
    }
  }
}

/* =========================================================
   RUN ONCE
========================================================= */

async function main() {
  try {
    await migrate();
  } catch (err) {
    console.error("Migration Error:", err.message);
    process.exitCode = 1;
  } finally {
    if (typeof db.end === "function") {
      await new Promise((resolve) => {
        db.end(() => resolve());
      });
    }
  }
}

main();
