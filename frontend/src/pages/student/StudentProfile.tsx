import {
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type PointerEvent as ReactPointerEvent,
} from "react";

import { useNavigate } from "react-router-dom";
import axios from "axios";

import logo from "../../assets/Logo.svg";
import StudentNotificationBell from "./StudentNotificationBell";

import "./StudentNotifications.css";
import "./StudentProfile.css";

/* =========================================================
   โครงสร้างข้อมูลส่วนตัวของนิสิต
========================================================= */

interface StudentProfileData {
  id: number;
  username: string;
  prefix: string | null;
  name: string;
  major: string | null;
  phone: string | null;
  email: string | null;
  backup_email: string | null;
  profile_image: string | null;
  has_signature: number;
}

function StudentProfile() {
  const navigate = useNavigate();

  const username = sessionStorage.getItem("username");

  const profileImage = sessionStorage.getItem("profileImage");

  const userId = sessionStorage.getItem("userId");

  /* =========================================================
   เก็บข้อมูลส่วนตัวของนิสิต
========================================================= */

  const [student, setStudent] = useState<StudentProfileData | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  /* =========================================================
   แก้ไขข้อมูลการติดต่อของนิสิต
========================================================= */

  const [isEditingContact, setIsEditingContact] = useState(false);

  const [editBackupEmail, setEditBackupEmail] = useState("");
  const [editPhone, setEditPhone] = useState("");

  const [savingContact, setSavingContact] = useState(false);
  const [contactError, setContactError] = useState("");
  const [contactSuccess, setContactSuccess] = useState("");

  /* =========================================================
   เปลี่ยนรูปโปรไฟล์ของนิสิต
========================================================= */

  const [selectedProfileImage, setSelectedProfileImage] = useState<File | null>(
    null,
  );

  const [profilePreview, setProfilePreview] = useState("");

  const [uploadingProfile, setUploadingProfile] = useState(false);

  const [profileError, setProfileError] = useState("");

  const [profileSuccess, setProfileSuccess] = useState("");

  /* =========================================================
   จัดการลายเซ็นของนิสิต
========================================================= */

  // เลือกวิธีเพิ่มลายเซ็น
  const [signatureMode, setSignatureMode] = useState("");

  /* =========================================================
   เปิดหรือปิดแบบฟอร์มเพิ่มและเปลี่ยนลายเซ็น
========================================================= */

  const [isEditingSignature, setIsEditingSignature] = useState(false);

  // พื้นที่สำหรับวาดลายเซ็น
  const signatureCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // ตรวจสอบว่ากำลังวาดลายเซ็นหรือไม่
  const isDrawingSignature = useRef(false);

  // ตรวจสอบว่ามีการวาดลายเซ็นแล้วหรือยัง
  const [hasDrawnSignature, setHasDrawnSignature] = useState(false);

  // เก็บรูปภาพลายเซ็นที่เลือกจากเครื่อง
  const [signatureFile, setSignatureFile] = useState<File | null>(null);

  // เก็บรูปภาพสำหรับแสดงตัวอย่าง
  const [signaturePreview, setSignaturePreview] = useState("");

  // เก็บข้อความข้อผิดพลาด
  const [signatureError, setSignatureError] = useState("");

  /* =========================================================
   บันทึกและยืนยันลายเซ็นของนิสิต
========================================================= */

  // รหัสผ่านสำหรับยืนยันการเปลี่ยนลายเซ็น
  const [signaturePassword, setSignaturePassword] = useState("");

  // สถานะระหว่างบันทึกลายเซ็น
  const [savingSignature, setSavingSignature] = useState(false);

  // ข้อความเมื่อบันทึกสำเร็จ
  const [signatureSuccess, setSignatureSuccess] = useState("");

  const avatarPath = student?.profile_image || profileImage;

  /* =========================================================
   เลือกรูปภาพที่จะแสดงบนหน้าเว็บ
========================================================= */

  let imageToShow = logo;

  // ใช้รูปโปรไฟล์เดิมจากฐานข้อมูล
  if (avatarPath) {
    imageToShow = `http://localhost:5000${avatarPath}`;
  }

  // ถ้าเลือกรูปใหม่ ให้แสดงรูปตัวอย่างแทน
  if (profilePreview !== "") {
    imageToShow = profilePreview;
  }

  /* =========================================================
   ดึงข้อมูลนิสิตจากฐานข้อมูล
========================================================= */

  useEffect(() => {
    if (!userId) {
      navigate("/");
      return;
    }

    const fetchStudentProfile = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await axios.get<StudentProfileData>(
          `http://localhost:5000/student/profile/${userId}`,
        );

        setStudent(response.data);

        setEditBackupEmail(response.data.backup_email || "");
        setEditPhone(response.data.phone || "");
      } catch (err) {
        console.error("โหลดข้อมูลนิสิตไม่สำเร็จ:", err);
        setError("ไม่สามารถโหลดข้อมูลส่วนตัวได้");
      } finally {
        setLoading(false);
      }
    };

    fetchStudentProfile();
  }, [userId, navigate]);

  /* =========================================================
   บันทึกอีเมลสำรองและเบอร์โทรศัพท์ของนิสิต
========================================================= */

  const handleSaveContact = async () => {
    if (userId === null) {
      return;
    }

    if (savingContact === true) {
      return;
    }

    setSavingContact(true);
    setContactError("");
    setContactSuccess("");

    try {
      const response = await axios.put(
        `http://localhost:5000/student/profile/${userId}/contact`,
        {
          backup_email: editBackupEmail.trim(),
          phone: editPhone.trim(),
        },
      );

      // อัปเดตข้อมูลที่แสดงบนหน้าเว็บ
      setStudent((previousStudent) => {
        if (previousStudent === null) {
          return null;
        }

        return {
          ...previousStudent,
          backup_email: response.data.backup_email,
          phone: response.data.phone,
        };
      });

      setIsEditingContact(false);
      setContactSuccess("บันทึกข้อมูลการติดต่อเรียบร้อยแล้ว");
    } catch (error) {
      if (axios.isAxiosError(error)) {
        setContactError(
          error.response?.data?.message || "ไม่สามารถบันทึกข้อมูลได้",
        );
      } else {
        setContactError("เกิดข้อผิดพลาดในการบันทึกข้อมูล");
      }
    } finally {
      setSavingContact(false);
    }
  };

  /* =========================================================
   ยกเลิกการแก้ไขข้อมูลการติดต่อ
========================================================= */

  const handleCancelContact = () => {
    setEditBackupEmail(student?.backup_email || "");
    setEditPhone(student?.phone || "");

    setContactError("");
    setContactSuccess("");
    setIsEditingContact(false);
  };

  /* =========================================================
   เลือกรูปโปรไฟล์ของนิสิต
========================================================= */

  const handleChooseProfileImage = (event: ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;

    // ตรวจสอบว่ามีการเลือกไฟล์หรือไม่
    if (files === null) {
      return;
    }

    if (files.length === 0) {
      return;
    }

    const file = files[0];

    setProfileError("");
    setProfileSuccess("");

    // ตรวจสอบประเภทไฟล์รูปภาพ
    if (
      file.type !== "image/jpeg" &&
      file.type !== "image/png" &&
      file.type !== "image/webp"
    ) {
      setProfileError("รองรับเฉพาะไฟล์ JPG, PNG และ WebP");
      event.target.value = "";
      return;
    }

    // ตรวจสอบขนาดไฟล์ ไม่เกิน 2 MB
    const maxSize = 2 * 1024 * 1024;

    if (file.size > maxSize) {
      setProfileError("ขนาดรูปภาพต้องไม่เกิน 2 MB");
      event.target.value = "";
      return;
    }

    // อ่านไฟล์รูปภาพ
    const reader = new FileReader();

    reader.onload = () => {
      if (typeof reader.result === "string") {
        setSelectedProfileImage(file);
        setProfilePreview(reader.result);
      }
    };

    reader.onerror = () => {
      setProfileError("ไม่สามารถอ่านไฟล์รูปภาพได้");
    };

    reader.readAsDataURL(file);

    event.target.value = "";
  };

  /* =========================================================
   ยกเลิกการเลือกรูปโปรไฟล์
========================================================= */

  const handleCancelProfileImage = () => {
    setSelectedProfileImage(null);
    setProfilePreview("");
    setProfileError("");
    setProfileSuccess("");
  };

  /* =========================================================
   บันทึกรูปโปรไฟล์ของนิสิต
========================================================= */

  const handleSaveProfileImage = async () => {
    // ตรวจสอบข้อมูลก่อนบันทึก
    if (userId === null) {
      return;
    }

    if (selectedProfileImage === null) {
      setProfileError("กรุณาเลือกรูปภาพก่อน");
      return;
    }

    if (uploadingProfile === true) {
      return;
    }

    setUploadingProfile(true);
    setProfileError("");
    setProfileSuccess("");

    // เตรียมไฟล์สำหรับส่งไป Backend
    const formData = new FormData();

    formData.append("profileImage", selectedProfileImage);

    try {
      // ส่งรูปไปบันทึก
      const response = await axios.put(
        `http://localhost:5000/student/profile/${userId}/image`,
        formData,
      );

      const newImage = response.data.profile_image;

      // เปลี่ยนรูปในข้อมูลนิสิต
      setStudent((previousStudent) => {
        if (previousStudent === null) {
          return null;
        }

        return {
          ...previousStudent,
          profile_image: newImage,
        };
      });

      // อัปเดตรูปใน Session
      sessionStorage.setItem("profileImage", newImage);

      // ล้างข้อมูลรูปตัวอย่าง
      setSelectedProfileImage(null);
      setProfilePreview("");

      setProfileSuccess("เปลี่ยนรูปโปรไฟล์เรียบร้อยแล้ว");
    } catch (error) {
      if (axios.isAxiosError(error)) {
        setProfileError(
          error.response?.data?.message || "ไม่สามารถบันทึกรูปโปรไฟล์ได้",
        );
      } else {
        setProfileError("เกิดข้อผิดพลาดในการอัปโหลดรูปภาพ");
      }
    } finally {
      setUploadingProfile(false);
    }
  };

  /* =========================================================
   เริ่มวาดลายเซ็น
========================================================= */

  const handleSignaturePointerDown = (
    event: ReactPointerEvent<HTMLCanvasElement>,
  ) => {
    const canvas = signatureCanvasRef.current;

    if (canvas === null) {
      return;
    }

    const context = canvas.getContext("2d");

    if (context === null) {
      return;
    }

    // คำนวณตำแหน่งที่ผู้ใช้กดบนพื้นที่วาด
    const rectangle = canvas.getBoundingClientRect();

    const x =
      (event.clientX - rectangle.left) * (canvas.width / rectangle.width);

    const y =
      (event.clientY - rectangle.top) * (canvas.height / rectangle.height);

    // กำหนดสีและขนาดเส้น
    context.strokeStyle = "#000000";
    context.lineWidth = 2.5;
    context.lineCap = "round";
    context.lineJoin = "round";

    context.beginPath();
    context.moveTo(x, y);

    // วาดจุดเริ่มต้น
    context.lineTo(x, y);
    context.stroke();

    isDrawingSignature.current = true;
    setHasDrawnSignature(true);

    canvas.setPointerCapture(event.pointerId);
  };

  /* =========================================================
   วาดลายเซ็นขณะเลื่อนเมาส์หรือนิ้ว
========================================================= */

  const handleSignaturePointerMove = (
    event: ReactPointerEvent<HTMLCanvasElement>,
  ) => {
    if (isDrawingSignature.current === false) {
      return;
    }

    const canvas = signatureCanvasRef.current;

    if (canvas === null) {
      return;
    }

    const context = canvas.getContext("2d");

    if (context === null) {
      return;
    }

    const rectangle = canvas.getBoundingClientRect();

    const x =
      (event.clientX - rectangle.left) * (canvas.width / rectangle.width);

    const y =
      (event.clientY - rectangle.top) * (canvas.height / rectangle.height);

    context.lineTo(x, y);
    context.stroke();
  };

  /* =========================================================
   หยุดวาดลายเซ็น
========================================================= */

  const handleSignaturePointerUp = () => {
    isDrawingSignature.current = false;
  };

  /* =========================================================
   ล้างลายเซ็นเพื่อวาดใหม่
========================================================= */

  const handleClearSignature = () => {
    const canvas = signatureCanvasRef.current;

    if (canvas === null) {
      return;
    }

    const context = canvas.getContext("2d");

    if (context === null) {
      return;
    }

    context.clearRect(0, 0, canvas.width, canvas.height);

    isDrawingSignature.current = false;
    setHasDrawnSignature(false);
    setSignatureError("");
  };

  /* =========================================================
   เลือกรูปภาพลายเซ็นจากเครื่อง
========================================================= */

  const handleChooseSignatureImage = (event: ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;

    if (files === null) {
      return;
    }

    if (files.length === 0) {
      return;
    }

    const file = files[0];

    setSignatureError("");
    setSignatureFile(null);
    setSignaturePreview("");

    // ตรวจสอบประเภทไฟล์
    if (file.type !== "image/png" && file.type !== "image/jpeg") {
      setSignatureError("รองรับเฉพาะไฟล์ PNG และ JPG");
      event.target.value = "";
      return;
    }

    // จำกัดขนาดไฟล์ไม่เกิน 2 MB
    if (file.size > 2 * 1024 * 1024) {
      setSignatureError("ไฟล์ลายเซ็นต้องมีขนาดไม่เกิน 2 MB");
      event.target.value = "";
      return;
    }

    // อ่านไฟล์เพื่อแสดงตัวอย่าง
    const reader = new FileReader();

    reader.onload = () => {
      if (typeof reader.result === "string") {
        setSignatureFile(file);
        setSignaturePreview(reader.result);
      }
    };

    reader.onerror = () => {
      setSignatureError("ไม่สามารถอ่านรูปลายเซ็นได้");
    };

    reader.readAsDataURL(file);

    event.target.value = "";
  };

  /* =========================================================
   บันทึกลายเซ็นของนิสิตลงฐานข้อมูล
========================================================= */

  const handleSaveSignature = async () => {
    // ตรวจสอบรหัสผู้ใช้
    if (userId === null) {
      setSignatureError("ไม่พบข้อมูลผู้ใช้");
      return;
    }

    // ป้องกันการกดบันทึกซ้ำ
    if (savingSignature === true) {
      return;
    }

    // ตรวจสอบรหัสผ่าน
    if (signaturePassword.trim() === "") {
      setSignatureError("กรุณากรอกรหัสผ่านเพื่อยืนยัน");
      return;
    }

    // ตรวจสอบการวาดลายเซ็น
    if (signatureMode === "draw") {
      if (hasDrawnSignature === false) {
        setSignatureError("กรุณาวาดลายเซ็นก่อนบันทึก");
        return;
      }
    }

    // ตรวจสอบไฟล์ลายเซ็นที่อัปโหลด
    if (signatureMode === "upload") {
      if (signatureFile === null) {
        setSignatureError("กรุณาเลือกรูปลายเซ็นก่อนบันทึก");
        return;
      }
    }

    // ยืนยันก่อนเปลี่ยนลายเซ็นเดิม
    if (student?.has_signature === 1) {
      const confirmed = window.confirm(
        "คุณมีลายเซ็นอยู่แล้ว ต้องการเปลี่ยนลายเซ็นใหม่ใช่หรือไม่?",
      );

      if (confirmed === false) {
        return;
      }
    }

    setSavingSignature(true);
    setSignatureError("");
    setSignatureSuccess("");

    try {
      // เตรียมข้อมูลสำหรับส่งไป Backend
      const formData = new FormData();

      // วิธีที่ 1 วาดลายเซ็น
      if (signatureMode === "draw") {
        const canvas = signatureCanvasRef.current;

        if (canvas === null) {
          throw new Error("ไม่พบพื้นที่วาดลายเซ็น");
        }

        // แปลงภาพที่วาดเป็นไฟล์ PNG
        const imageBlob = await new Promise<Blob | null>((resolve) => {
          canvas.toBlob((blob) => {
            resolve(blob);
          }, "image/png");
        });

        if (imageBlob === null) {
          throw new Error("ไม่สามารถสร้างไฟล์ลายเซ็นได้");
        }

        const imageFile = new File([imageBlob], "signature.png", {
          type: "image/png",
        });

        formData.append("signatureImage", imageFile);
      }

      // วิธีที่ 2 อัปโหลดรูปจากเครื่อง
      if (signatureMode === "upload") {
        if (signatureFile === null) {
          throw new Error("ไม่พบไฟล์ลายเซ็น");
        }

        formData.append("signatureImage", signatureFile);
      }

      // ส่งรหัสผ่านเพื่อยืนยันกับ Backend
      formData.append("password", signaturePassword);

      // ส่งข้อมูลไปบันทึก
      const response = await axios.put(
        `http://localhost:5000/student/profile/${userId}/signature`,
        formData,
      );

      if (response.data.success === true) {
        // อัปเดตสถานะว่ามีลายเซ็นแล้ว
        setStudent((previousStudent) => {
          if (previousStudent === null) {
            return null;
          }

          return {
            ...previousStudent,
            has_signature: 1,
          };
        });

        // ล้างรหัสผ่านและข้อมูลที่ใช้บันทึก
        setSignaturePassword("");
        setSignatureFile(null);
        setSignaturePreview("");
        setHasDrawnSignature(false);

        // ล้างพื้นที่วาดหลังบันทึกสำเร็จ
        const canvas = signatureCanvasRef.current;

        if (canvas !== null) {
          const context = canvas.getContext("2d");

          if (context !== null) {
            context.clearRect(0, 0, canvas.width, canvas.height);
          }
        }

        setSignatureSuccess("บันทึกลายเซ็นเรียบร้อยแล้ว");
        setSignatureMode("");
        setIsEditingSignature(false);
      }
    } catch (error) {
      if (axios.isAxiosError(error)) {
        setSignatureError(
          error.response?.data?.message || "ไม่สามารถบันทึกลายเซ็นได้",
        );
      } else if (error instanceof Error) {
        setSignatureError(error.message);
      } else {
        setSignatureError("เกิดข้อผิดพลาดในการบันทึกลายเซ็น");
      }
    } finally {
      setSavingSignature(false);
    }
  };

  /* =========================================================
   ยกเลิกการเพิ่มหรือเปลี่ยนลายเซ็น
========================================================= */

  const handleCancelSignature = () => {
    setIsEditingSignature(false);
    setSignatureMode("");
    setHasDrawnSignature(false);
    setSignatureFile(null);
    setSignaturePreview("");
    setSignaturePassword("");
    setSignatureError("");
    setSignatureSuccess("");
  };

  const handleLogout = () => {
    sessionStorage.clear();
    navigate("/");
  };

  return (
    <div className="student-notifications-page student-profile-page">
      {/* SIDEBAR */}
      <aside className="student-notifications-sidebar">
        <div className="student-notifications-logo">
          <img src={logo} alt="SPTC Logo" />

          <div>
            <h2>SPTC System</h2>
            <p>ระบบติดตามและสื่อสารโครงงานนิสิต</p>
          </div>
        </div>

        <nav>
          <ul>
            <li onClick={() => navigate("/StudentHome")}>หน้าหลัก</li>

            <li onClick={() => navigate("/teachers")}>รายชื่ออาจารย์</li>

            <li onClick={() => navigate("/submit-new-project")}>
              ส่งคำเสนอโครงงานใหม่
            </li>

            <li onClick={() => navigate("/student-project")}>โครงงานของฉัน</li>

            <li onClick={() => navigate("/student-notifications")}>
              การแจ้งเตือน
            </li>

            <li className="active">ข้อมูลส่วนตัว</li>
          </ul>
        </nav>

        <button className="student-notifications-logout" onClick={handleLogout}>
          ออกจากระบบ
        </button>
      </aside>

      {/* MAIN */}
      <main className="student-notifications-main">
        <header className="student-notifications-header">
          <h2>ข้อมูลส่วนตัว</h2>

          <div className="student-notifications-header-right">
            <StudentNotificationBell />

            <div className="student-notifications-user">
              <img
                src={avatarPath ? `http://localhost:5000${avatarPath}` : logo}
                alt="Profile"
              />

              <span>{student?.username || username || "-"}</span>
            </div>
          </div>
        </header>

        <div className="student-notifications-content student-profile-content">
          {/* สถานะการโหลดข้อมูลส่วนตัว */}
          {loading && (
            <p className="student-profile-note">กำลังโหลดข้อมูลนิสิต...</p>
          )}

          {error && (
            <p className="student-profile-note" role="alert">
              {error}
            </p>
          )}

          {/* PROFILE */}
          <section className="student-profile-card">
            <div className="student-profile-header">
              <img
                className="student-profile-avatar"
                src={imageToShow}
                alt="รูปโปรไฟล์"
              />

              <div>
                <h3>
                  {[student?.prefix, student?.name].filter(Boolean).join(" ") ||
                    "ข้อมูลนิสิต"}
                </h3>

                <p>รหัสนิสิต : {student?.username || "-"}</p>

                {/* ส่วนเลือกรูปโปรไฟล์ */}
                <div className="student-profile-image-actions">
                  <label
                    htmlFor="student-profile-image-input"
                    className="student-profile-image-btn"
                  >
                    เปลี่ยนรูปโปรไฟล์
                  </label>

                  <input
                    id="student-profile-image-input"
                    type="file"
                    accept=".jpg,.jpeg,.png,.webp"
                    className="student-profile-file-input"
                    onChange={handleChooseProfileImage}
                    disabled={uploadingProfile}
                  />

                  {selectedProfileImage !== null && (
                    <>
                      <button
                        type="button"
                        className="student-profile-cancel-image-btn"
                        onClick={handleCancelProfileImage}
                        disabled={uploadingProfile}
                      >
                        ยกเลิก
                      </button>

                      <button
                        type="button"
                        className="student-profile-save-image-btn"
                        onClick={handleSaveProfileImage}
                        disabled={uploadingProfile}
                      >
                        {uploadingProfile
                          ? "กำลังบันทึก..."
                          : "บันทึกรูปโปรไฟล์"}
                      </button>
                    </>
                  )}
                </div>

                {/* ข้อความหลังเลือกรูป */}
                {selectedProfileImage !== null && (
                  <p className="student-profile-image-hint">
                    เลือกรูปภาพแล้ว (ยังไม่ได้บันทึก)
                  </p>
                )}

                {/* ข้อความข้อผิดพลาด */}
                {profileError !== "" && (
                  <p className="student-profile-error">{profileError}</p>
                )}

                {/* ข้อความบันทึกสำเร็จ */}
                {profileSuccess !== "" && (
                  <p className="student-profile-success">{profileSuccess}</p>
                )}
              </div>
            </div>
          </section>

          {/* จัดข้อมูลนิสิตและข้อมูลการติดต่อให้อยู่แถวเดียวกัน */}
          <div className="student-profile-details-grid">
            {/* ข้อมูลนิสิต */}
            <section className="student-profile-card">
              <h3>ข้อมูลนิสิต</h3>
              <div className="student-profile-divider" />

              <div className="student-profile-info-row">
                <span>ชื่อ-นามสกุล</span>
                <strong>
                  {[student?.prefix, student?.name].filter(Boolean).join(" ") ||
                    "-"}
                </strong>
              </div>

              <div className="student-profile-info-row">
                <span>รหัสนิสิต</span>
                <strong>{student?.username || "-"}</strong>
              </div>

              <div className="student-profile-info-row">
                <span>สาขาวิชา</span>
                <strong>{student?.major || "-"}</strong>
              </div>
            </section>

            {/* ข้อมูลการติดต่อ */}
            <section className="student-profile-card student-profile-contact-card">
              <div className="student-profile-contact-heading">
                <h3>ข้อมูลการติดต่อ</h3>

                {!isEditingContact && (
                  <button
                    type="button"
                    className="student-profile-edit-btn"
                    onClick={() => {
                      setContactError("");
                      setContactSuccess("");
                      setIsEditingContact(true);
                    }}
                  >
                    แก้ไขข้อมูล
                  </button>
                )}
              </div>

              <div className="student-profile-divider" />

              {/* อีเมลหลัก ไม่อนุญาตให้แก้ไข */}
              <div className="student-profile-info-row">
                <span>อีเมลหลัก</span>

                {/* แสดงอีเมลหลักที่ไม่สามารถแก้ไขได้ */}
                <div className="student-profile-primary-email">
                  <strong>{student?.email || "-"}</strong>

                  <small className="student-profile-email-hint">
                    อีเมลหลักของบัญชี ไม่สามารถแก้ไขได้
                  </small>
                </div>
              </div>

              {/* อีเมลสำรอง สามารถแก้ไขได้ */}
              <div className="student-profile-info-row">
                <span>อีเมลสำรอง</span>

                {isEditingContact ? (
                  <input
                    type="email"
                    className="student-profile-input"
                    value={editBackupEmail}
                    onChange={(event) => {
                      setEditBackupEmail(event.target.value);
                    }}
                    placeholder="กรอกอีเมลสำรอง (ไม่บังคับ)"
                  />
                ) : (
                  <strong>{student?.backup_email || "ยังไม่ได้เพิ่ม"}</strong>
                )}
              </div>

              <div className="student-profile-info-row">
                <span>เบอร์โทรศัพท์</span>

                {isEditingContact ? (
                  <input
                    type="tel"
                    className="student-profile-input"
                    value={editPhone}
                    onChange={(e) => setEditPhone(e.target.value)}
                    placeholder="กรอกเบอร์โทรศัพท์"
                    maxLength={10}
                  />
                ) : (
                  <strong>{student?.phone || "-"}</strong>
                )}
              </div>

              {contactError && (
                <p className="student-profile-error">{contactError}</p>
              )}

              {contactSuccess && (
                <p className="student-profile-success">{contactSuccess}</p>
              )}

              {isEditingContact && (
                <div className="student-profile-actions">
                  <button
                    type="button"
                    className="student-profile-cancel-btn"
                    onClick={handleCancelContact}
                    disabled={savingContact}
                  >
                    ยกเลิก
                  </button>

                  <button
                    type="button"
                    className="student-profile-save-btn"
                    onClick={handleSaveContact}
                    disabled={savingContact}
                  >
                    {savingContact ? "กำลังบันทึก..." : "บันทึกข้อมูล"}
                  </button>
                </div>
              )}
            </section>
          </div>

          {/* ลายเซ็นอิเล็กทรอนิกส์ */}
          <section className="student-profile-card">
            {/* หัวข้อและสถานะลายเซ็น */}
            <div className="student-signature-heading">
              <h3>ลายเซ็นอิเล็กทรอนิกส์</h3>

              {/* ตรวจสอบว่ามีลายเซ็นในระบบหรือไม่ */}
              {student !== null &&
                (student.has_signature === 1 ? (
                  <span className="student-signature-status saved">
                    มีลายเซ็นบันทึกไว้ในระบบแล้ว
                  </span>
                ) : (
                  <span className="student-signature-status missing">
                    ยังไม่มีลายเซ็นในระบบ
                  </span>
                ))}
            </div>

            <div className="student-profile-divider" />

            {/* ข้อความและปุ่มเพิ่มหรือเปลี่ยนลายเซ็น */}
            <div className="student-signature-toolbar">
              <p className="student-profile-note">
                ลายเซ็นสำหรับใช้ลงนามในเอกสารโครงงาน
              </p>

              {student !== null && isEditingSignature === false && (
                <button
                  type="button"
                  className="student-profile-edit-btn"
                  onClick={() => {
                    setIsEditingSignature(true);
                    setSignatureMode("");
                    setSignatureError("");
                    setSignatureSuccess("");
                  }}
                >
                  {student.has_signature === 1
                    ? "เปลี่ยนลายเซ็น"
                    : "เพิ่มลายเซ็น"}
                </button>
              )}
            </div>

            {/* ข้อความเมื่อบันทึกลายเซ็นสำเร็จ */}
            {signatureSuccess !== "" && (
              <p className="student-profile-success">{signatureSuccess}</p>
            )}
            {/* แสดงส่วนจัดการลายเซ็นเมื่อกดเพิ่มหรือเปลี่ยน */}
            {isEditingSignature && (
              <>
                {/* เลือกวิธีเพิ่มลายเซ็น */}
                <div className="student-signature-tabs">
                  <button
                    type="button"
                    className={
                      signatureMode === "draw"
                        ? "student-signature-tab active"
                        : "student-signature-tab"
                    }
                    onClick={() => {
                      setSignatureMode("draw");
                      setHasDrawnSignature(false);
                      setSignatureError("");
                      setSignatureSuccess("");
                      setSignaturePassword("");
                    }}
                  >
                    วาดลายเซ็น
                  </button>

                  <button
                    type="button"
                    className={
                      signatureMode === "upload"
                        ? "student-signature-tab active"
                        : "student-signature-tab"
                    }
                    onClick={() => {
                      setSignatureMode("upload");
                      setSignatureFile(null);
                      setSignaturePreview("");
                      setHasDrawnSignature(false);
                      setSignatureError("");
                      setSignatureSuccess("");
                      setSignaturePassword("");
                    }}
                  >
                    อัปโหลดรูปลายเซ็น
                  </button>
                </div>

                {/* จัดพื้นที่ลายเซ็นเป็นสองคอลัมน์ */}
                <div className="student-signature-layout">
                  {/* คอลัมน์ซ้ายสำหรับวาดหรืออัปโหลดลายเซ็น */}
                  <div className="student-signature-work-area">
                    {/* วิธีที่ 1 วาดลายเซ็น */}
                    {signatureMode === "draw" && (
                      <div className="student-signature-section">
                        <p>กรุณาวาดลายเซ็นในช่องด้านล่าง</p>

                        <canvas
                          ref={signatureCanvasRef}
                          width={600}
                          height={180}
                          className="student-signature-canvas"
                          onPointerDown={handleSignaturePointerDown}
                          onPointerMove={handleSignaturePointerMove}
                          onPointerUp={handleSignaturePointerUp}
                          onPointerCancel={handleSignaturePointerUp}
                        />

                        {hasDrawnSignature && (
                          <p className="student-profile-note">
                            วาดลายเซ็นแล้ว (ยังไม่ได้บันทึก)
                          </p>
                        )}
                      </div>
                    )}

                    {/* วิธีที่ 2 อัปโหลดรูปลายเซ็น */}
                    {signatureMode === "upload" && (
                      <div className="student-signature-section">
                        <div className="student-signature-upload-box">
                          <h4>อัปโหลดรูปลายเซ็น</h4>

                          <p>เลือกรูปภาพลายเซ็นจากเครื่องของคุณ</p>

                          <p className="student-signature-upload-hint">
                            รองรับไฟล์ PNG และ JPG ขนาดไม่เกิน 2 MB
                          </p>

                          {/* ช่องเลือกไฟล์ที่ซ่อนไว้ */}
                          <input
                            id="student-signature-file"
                            type="file"
                            accept=".png,.jpg,.jpeg"
                            className="student-signature-file-input"
                            onChange={handleChooseSignatureImage}
                            disabled={savingSignature}
                          />

                          {/* ปุ่มเลือกไฟล์ */}
                          <label
                            htmlFor="student-signature-file"
                            className="student-signature-upload-btn"
                          >
                            เลือกไฟล์ลายเซ็น
                          </label>

                          {/* ชื่อไฟล์ที่เลือก */}
                          {signatureFile !== null && (
                            <p className="student-signature-file-name">
                              ไฟล์ที่เลือก : {signatureFile.name}
                            </p>
                          )}
                        </div>

                        {/* แสดงตัวอย่างลายเซ็น */}
                        {signaturePreview !== "" && (
                          <div className="student-signature-preview">
                            <p>ตัวอย่างลายเซ็น</p>

                            <img src={signaturePreview} alt="ตัวอย่างลายเซ็น" />

                            <p className="student-profile-note">
                              เลือกรูปลายเซ็นแล้ว (ยังไม่ได้บันทึก)
                            </p>
                          </div>
                        )}
                      </div>
                    )}

                    {/* ข้อความข้อผิดพลาด */}
                    {signatureError !== "" && (
                      <p className="student-profile-error">{signatureError}</p>
                    )}
                  </div>

                  {/* ยืนยันรหัสผ่านก่อนบันทึกลายเซ็น */}
                  {signatureMode !== "" && (
                    <div className="student-signature-save-section">
                      {/* หัวข้อส่วนยืนยันและปุ่มล้างลายเซ็น */}
                      <div className="student-signature-control-heading">
                        <h4>ยืนยันและบันทึกลายเซ็น</h4>

                        {signatureMode === "draw" && (
                          <button
                            type="button"
                            className="student-signature-clear-btn"
                            onClick={handleClearSignature}
                            disabled={savingSignature}
                          >
                            ล้างลายเซ็น
                          </button>
                        )}
                      </div>

                      {/* ช่องยืนยันรหัสผ่าน */}
                      <label htmlFor="signature-password">
                        รหัสผ่านของบัญชี
                      </label>

                      <input
                        id="signature-password"
                        type="password"
                        value={signaturePassword}
                        onChange={(event) => {
                          setSignaturePassword(event.target.value);
                          setSignatureError("");
                        }}
                        placeholder="กรอกรหัสผ่านของบัญชี"
                        autoComplete="current-password"
                        disabled={savingSignature}
                      />

                      <p className="student-profile-note">
                        กรุณายืนยันรหัสผ่านเพื่อเพิ่มหรือเปลี่ยนลายเซ็น
                      </p>

                      <div className="student-signature-save-actions">
                        <button
                          type="button"
                          className="student-profile-cancel-btn"
                          onClick={handleCancelSignature}
                          disabled={savingSignature}
                        >
                          ยกเลิก
                        </button>

                        <button
                          type="button"
                          className="student-signature-save-btn"
                          onClick={handleSaveSignature}
                          disabled={savingSignature}
                        >
                          {savingSignature ? "กำลังบันทึก..." : "บันทึกลายเซ็น"}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}

export default StudentProfile;
