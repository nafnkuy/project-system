
const nodemailer = require("nodemailer");
const path = require("path");

require("dotenv").config({
  path: path.join(__dirname, ".env"),
});

// ตั้งค่าบัญชี Gmail สำหรับส่งอีเมล
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_APP_PASSWORD,
  },
});

// ฟังก์ชันส่งอีเมลแจ้งเตือน
const sendNotificationEmail = async (to, message) => {
  const recipient = process.env.EMAIL_TEST_TO || to;

  if (!recipient) {
    throw new Error("ไม่พบอีเมลผู้รับ");
  }

  await transporter.sendMail({
    from: `"SPTC System" <${process.env.SMTP_USER}>`,
    to: recipient,
    subject: "SPTC System - การแจ้งเตือนใหม่",
    text: `
คุณมีการแจ้งเตือนใหม่จากระบบ SPTC

${message}

กรุณาเข้าสู่ระบบ SPTC เพื่อดูรายละเอียด
    `,
  });
};

module.exports = { sendNotificationEmail };
