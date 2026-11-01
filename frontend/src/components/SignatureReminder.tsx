
import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import axios from "axios";

import "./SignatureReminder.css";

/* =========================================================
   โครงสร้างข้อมูลสถานะลายเซ็น
========================================================= */

interface SignatureStatus {
  role: string;
  has_signature: number;
}

function SignatureReminder() {
  const navigate = useNavigate();
  const location = useLocation();

  /* =========================================================
     เก็บสถานะป๊อปอัป
  ========================================================= */

  const [showPopup, setShowPopup] = useState(false);
  const [userRole, setUserRole] = useState("");

  /* =========================================================
     ตรวจสอบลายเซ็นหลังเข้าสู่ระบบ
  ========================================================= */

  useEffect(() => {
    // เมื่อกลับไปหน้าเข้าสู่ระบบ ให้เริ่มรอบแจ้งเตือนใหม่
    if (location.pathname === "/") {
      const previousUserId = sessionStorage.getItem(
        "signature-reminder-account"
      );

      if (previousUserId) {
        sessionStorage.removeItem(
          "signature-reminded-" + previousUserId
        );

        sessionStorage.removeItem(
          "signature-reminder-account"
        );
      }

      setShowPopup(false);
      return;
    }

    // อ่านรหัสผู้ใช้ที่เข้าสู่ระบบ
    const userId = sessionStorage.getItem("userId");

    if (!userId) {
      setShowPopup(false);
      return;
    }

    // ตรวจสอบว่าเคยแจ้งเตือนในรอบนี้แล้วหรือยัง
    const reminderKey = "signature-reminded-" + userId;

    if (sessionStorage.getItem(reminderKey) === "yes") {
      return;
    }

    let cancelled = false;

    const checkSignature = async () => {
      try {
        const response = await axios.get<SignatureStatus>(
          `http://localhost:5000/profile/signature-status/${userId}`
        );

        if (cancelled) {
          return;
        }

        const role = response.data.role;
        const hasSignature = Number(
          response.data.has_signature
        );

        // แจ้งเตือนเฉพาะนิสิตและอาจารย์ที่ยังไม่มีลายเซ็น
        if (
          (role === "student" || role === "teacher") &&
          hasSignature === 0
        ) {
          setUserRole(role);
          setShowPopup(true);

          // บันทึกว่าแจ้งเตือนในรอบนี้แล้ว
          sessionStorage.setItem(reminderKey, "yes");
          sessionStorage.setItem(
            "signature-reminder-account",
            userId
          );
        }
      } catch (error) {
        console.error(
          "ตรวจสอบสถานะลายเซ็นไม่สำเร็จ:",
          error
        );
      }
    };

    checkSignature();

    return () => {
      cancelled = true;
    };
  }, [location.pathname]);

  /* =========================================================
     ไปยังหน้าข้อมูลส่วนตัวเพื่อเพิ่มลายเซ็น
  ========================================================= */

  const handleGoToProfile = () => {
    setShowPopup(false);

    if (userRole === "student") {
      navigate("/student-profile");
    }

    if (userRole === "teacher") {
      navigate("/teacher-profile");
    }
  };

  /* =========================================================
     แสดงป๊อปอัป
  ========================================================= */

  if (showPopup === false) {
    return null;
  }

  return (
    <div className="signature-reminder-overlay">
      <div
        className="signature-reminder-popup"
        role="dialog"
        aria-modal="true"
        aria-labelledby="signature-reminder-title"
      >

        {/* ไอคอนแจ้งเตือน */}
        <div className="signature-reminder-icon">
          !
        </div>

        {/* หัวข้อ */}
        <h3 id="signature-reminder-title">
          ยังไม่ได้เพิ่มลายเซ็นอิเล็กทรอนิกส์
        </h3>

        <p className="signature-reminder-description">
          บัญชีของคุณยังไม่มีลายเซ็นบันทึกไว้ในระบบ
          กรุณาเพิ่มลายเซ็นเพื่อใช้สำหรับลงนาม
          ในเอกสารโครงงาน
        </p>

        {/* แนะนำตำแหน่งเพิ่มลายเซ็น */}
        <div className="signature-reminder-location">
          <p>สามารถเพิ่มลายเซ็นได้ที่</p>

          <strong>
            ข้อมูลส่วนตัว → ลายเซ็นอิเล็กทรอนิกส์
          </strong>

          <p>
            จากนั้นกดปุ่ม "เพิ่มลายเซ็น"
          </p>
        </div>

        {/* ปุ่มดำเนินการ */}
        <div className="signature-reminder-actions">
          <button
            type="button"
            className="signature-reminder-later"
            onClick={() => setShowPopup(false)}
          >
            ไว้ภายหลัง
          </button>

          <button
            type="button"
            className="signature-reminder-go"
            onClick={handleGoToProfile}
          >
            ไปเพิ่มลายเซ็น
          </button>
        </div>

      </div>
    </div>
  );
}

export default SignatureReminder;
