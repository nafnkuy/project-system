
const db = require("./db");
const { sendNotificationEmail } = require("./emailService");

const query = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.query(sql, params, (error, results) => {
      if (error) {
        reject(error);
      } else {
        resolve(results);
      }
    });
  });
};

let isProcessing = false;

const checkNewNotifications = async () => {
  if (isProcessing) return;

  isProcessing = true;

  try {
    const notifications = await query(`
      SELECT
        n.id,
        n.message,
        u.email
      FROM notifications n
      LEFT JOIN users u ON n.user_id = u.id
      WHERE n.email_status = 'pending'
        AND n.email_attempts < 3
      ORDER BY n.id ASC
      LIMIT 10
    `);

    for (const notification of notifications) {
      try {
        if (!notification.email && !process.env.EMAIL_TEST_TO) {
          await query(
            `UPDATE notifications
             SET email_status = 'skipped',
                 email_error = 'ไม่พบอีเมลผู้รับ'
             WHERE id = ?`,
            [notification.id]
          );

          continue;
        }

        await sendNotificationEmail(
          notification.email,
          notification.message
        );

        await query(
          `UPDATE notifications
           SET email_status = 'sent',
               email_sent_at = NOW(),
               email_error = NULL
           WHERE id = ?`,
          [notification.id]
        );

        console.log("ส่งอีเมลแจ้งเตือนแล้ว:", notification.id);
      } catch (error) {
        console.error("ส่งอีเมลไม่สำเร็จ:", error.message);

        await query(
          `UPDATE notifications
           SET email_attempts = email_attempts + 1,
               email_status = CASE
                 WHEN email_attempts + 1 >= 3
                 THEN 'failed'
                 ELSE 'pending'
               END,
               email_error = ?
           WHERE id = ?`,
          [error.message, notification.id]
        );
      }
    }
  } catch (error) {
    console.error("ตรวจสอบการแจ้งเตือนล้มเหลว:", error);
  } finally {
    isProcessing = false;
  }
};

const startEmailNotifier = () => {
  if (process.env.EMAIL_ENABLED !== "true") {
    console.log("ระบบแจ้งเตือนอีเมลยังไม่เปิดใช้งาน");
    return;
  }

  console.log("เริ่มระบบแจ้งเตือนผ่านอีเมล");

  checkNewNotifications();

  setInterval(checkNewNotifications, 10000);
};

module.exports = { startEmailNotifier };
