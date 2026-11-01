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
import TeacherNotificationBell from "./TeacherNotificationBell";

import "./TeacherHome.css";
import "../student/StudentProfile.css";
import "./TeacherProfile.css";

/* =========================================================
   โครงสร้างข้อมูลส่วนตัวของอาจารย์
========================================================= */

interface TeacherProfileData {
  id: number;
  username: string;
  prefix: string | null;
  name: string;
  major: string | null;
  phone: string | null;
  email: string | null;
  backup_email: string | null;
  profile_image: string | null;
  position: string | null;
  english_name: string | null;
  office: string | null;
  office_phone: string | null;
  has_signature: number;
}

function TeacherProfile() {
  const navigate = useNavigate();

  const teacherId = sessionStorage.getItem("userId");
  const username = sessionStorage.getItem("username");
  const profileImage = sessionStorage.getItem("profileImage");

  /* =========================================================
     เก็บข้อมูลส่วนตัวของอาจารย์
  ========================================================= */

  const [teacher, setTeacher] = useState<TeacherProfileData | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  /* =========================================================
   จัดการการแก้ไขข้อมูลการติดต่อของอาจารย์
========================================================= */

  const [isEditingContact, setIsEditingContact] = useState(false);

  const [editBackupEmail, setEditBackupEmail] = useState("");
  const [editPhone, setEditPhone] = useState("");

  const [savingContact, setSavingContact] = useState(false);

  const [contactError, setContactError] = useState("");
  const [contactSuccess, setContactSuccess] = useState("");

  /* =========================================================
   จัดการเปลี่ยนรูปโปรไฟล์ของอาจารย์
========================================================= */

  // เก็บไฟล์รูปภาพที่เลือก
  const [selectedProfileImage, setSelectedProfileImage] = useState<File | null>(
    null,
  );

  // เก็บรูปภาพตัวอย่าง
  const [profilePreview, setProfilePreview] = useState("");

  // สถานะระหว่างบันทึกรูปภาพ
  const [uploadingProfile, setUploadingProfile] = useState(false);

  // ข้อความแจ้งผล
  const [profileError, setProfileError] = useState("");
  const [profileSuccess, setProfileSuccess] = useState("");

  /* =========================================================
   จัดการเพิ่มและเปลี่ยนลายเซ็นของอาจารย์
========================================================= */

  // เปิดหรือปิดส่วนแก้ไขลายเซ็น
  const [isEditingSignature, setIsEditingSignature] = useState(false);

  // เลือกวิธีวาดหรืออัปโหลด
  const [signatureMode, setSignatureMode] = useState("");

  // พื้นที่วาดลายเซ็น
  const signatureCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // ตรวจสอบว่ากำลังวาดหรือไม่
  const isDrawingSignature = useRef(false);

  // ตรวจสอบว่ามีลายเซ็นที่วาดแล้ว
  const [hasDrawnSignature, setHasDrawnSignature] = useState(false);

  // เก็บไฟล์ลายเซ็นจากเครื่อง
  const [signatureFile, setSignatureFile] = useState<File | null>(null);

  // ตัวอย่างรูปลายเซ็น
  const [signaturePreview, setSignaturePreview] = useState("");

  // รหัสผ่านสำหรับยืนยัน
  const [signaturePassword, setSignaturePassword] = useState("");

  // สถานะการบันทึก
  const [savingSignature, setSavingSignature] = useState(false);

  // ข้อความแจ้งผล
  const [signatureError, setSignatureError] = useState("");
  const [signatureSuccess, setSignatureSuccess] = useState("");

  /* =========================================================
   เลือกรูปโปรไฟล์ที่จะแสดงบนหน้าเว็บ
========================================================= */
  const avatarPath = teacher?.profile_image || profileImage;
  let imageToShow = logo;

  // รูปเดิมจากฐานข้อมูล
  if (avatarPath) {
    imageToShow = `http://localhost:5000${avatarPath}`;
  }

  // ถ้าเลือกรูปใหม่ ให้แสดงรูปตัวอย่างก่อน
  if (profilePreview !== "") {
    imageToShow = profilePreview;
  }

  /* =========================================================
     ดึงข้อมูลอาจารย์จากฐานข้อมูล
  ========================================================= */

  useEffect(() => {
    if (!teacherId) {
      navigate("/");
      return;
    }

    const fetchTeacherProfile = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await axios.get<TeacherProfileData>(
          `http://localhost:5000/teacher/profile/${teacherId}`,
        );

        setTeacher(response.data);
        setEditBackupEmail(response.data.backup_email || "");
        setEditPhone(response.data.phone || "");
      } catch (err) {
        console.error("โหลดข้อมูลอาจารย์ไม่สำเร็จ:", err);
        setError("ไม่สามารถโหลดข้อมูลส่วนตัวได้");
      } finally {
        setLoading(false);
      }
    };

    fetchTeacherProfile();
  }, [teacherId, navigate]);

  /* =========================================================
   เลือกรูปโปรไฟล์ของอาจารย์
========================================================= */

  const handleChooseProfileImage = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    setProfileError("");
    setProfileSuccess("");

    // ตรวจสอบประเภทไฟล์
    if (
      file.type !== "image/jpeg" &&
      file.type !== "image/png" &&
      file.type !== "image/webp"
    ) {
      setProfileError("รองรับเฉพาะ JPG, PNG และ WebP");
      event.target.value = "";
      return;
    }

    // ตรวจสอบขนาดไฟล์
    if (file.size > 2 * 1024 * 1024) {
      setProfileError("รูปภาพต้องมีขนาดไม่เกิน 2 MB");
      event.target.value = "";
      return;
    }

    // อ่านรูปภาพเพื่อแสดงตัวอย่าง
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
   ยกเลิกการเปลี่ยนรูปโปรไฟล์
========================================================= */

  const handleCancelProfileImage = () => {
    setSelectedProfileImage(null);
    setProfilePreview("");
    setProfileError("");
    setProfileSuccess("");
  };

  /* =========================================================
   บันทึกรูปโปรไฟล์ของอาจารย์
========================================================= */

  const handleSaveProfileImage = async () => {
    if (teacherId === null) {
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

    // เตรียมไฟล์รูปภาพสำหรับส่งไป Backend
    const formData = new FormData();

    formData.append("profileImage", selectedProfileImage);

    try {
      const response = await axios.put(
        `http://localhost:5000/teacher/profile/${teacherId}/image`,
        formData,
      );

      const newImage = response.data.profile_image;

      // อัปเดตรูปภาพในข้อมูลอาจารย์
      setTeacher((previousTeacher) => {
        if (previousTeacher === null) {
          return null;
        }

        return {
          ...previousTeacher,
          profile_image: newImage,
        };
      });

      // อัปเดตข้อมูลรูปภาพใน Session
      sessionStorage.setItem("profileImage", newImage);

      // ล้างรูปภาพตัวอย่าง
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
   เปิดแบบฟอร์มแก้ไขข้อมูลการติดต่อ
========================================================= */

  const handleEditContact = () => {
    setEditBackupEmail(teacher?.backup_email || "");
    setEditPhone(teacher?.phone || "");

    setContactError("");
    setContactSuccess("");

    setIsEditingContact(true);
  };

  /* =========================================================
   ยกเลิกการแก้ไขข้อมูลการติดต่อ
========================================================= */

  const handleCancelContact = () => {
    setEditBackupEmail(teacher?.backup_email || "");
    setEditPhone(teacher?.phone || "");

    setContactError("");
    setIsEditingContact(false);
  };

  /* =========================================================
   บันทึกข้อมูลการติดต่อของอาจารย์
========================================================= */

  const handleSaveContact = async () => {
    // ตรวจสอบรหัสผู้ใช้
    if (teacherId === null) {
      return;
    }

    // ป้องกันการกดบันทึกซ้ำ
    if (savingContact === true) {
      return;
    }

    setSavingContact(true);
    setContactError("");
    setContactSuccess("");

    try {
      // ส่งข้อมูลไปยัง Backend
      const response = await axios.put(
        `http://localhost:5000/teacher/profile/${teacherId}/contact`,
        {
          backup_email: editBackupEmail.trim(),
          phone: editPhone.trim(),
        },
      );

      // อัปเดตข้อมูลบนหน้าเว็บ
      setTeacher((previousTeacher) => {
        if (previousTeacher === null) {
          return null;
        }

        return {
          ...previousTeacher,
          backup_email: response.data.backup_email,
          phone: response.data.phone,
        };
      });

      setIsEditingContact(false);
      setContactSuccess("บันทึกข้อมูลการติดต่อเรียบร้อยแล้ว");
    } catch (error) {
      if (axios.isAxiosError(error)) {
        let message = "ไม่สามารถบันทึกข้อมูลได้";

        if (error.response?.data?.message) {
          message = error.response.data.message;
        }

        setContactError(message);
      } else {
        setContactError("เกิดข้อผิดพลาดในการบันทึกข้อมูล");
      }
    } finally {
      setSavingContact(false);
    }
  };

  /* =========================================================
   เริ่มวาดลายเซ็น
========================================================= */

  const handleSignaturePointerDown = (
    event: ReactPointerEvent<HTMLCanvasElement>,
  ) => {
    const canvas = signatureCanvasRef.current;

    if (canvas === null) return;

    const context = canvas.getContext("2d");

    if (context === null) return;

    const rectangle = canvas.getBoundingClientRect();

    const x =
      (event.clientX - rectangle.left) * (canvas.width / rectangle.width);

    const y =
      (event.clientY - rectangle.top) * (canvas.height / rectangle.height);

    context.strokeStyle = "#000000";
    context.lineWidth = 2.5;
    context.lineCap = "round";
    context.lineJoin = "round";

    context.beginPath();
    context.moveTo(x, y);
    context.lineTo(x, y);
    context.stroke();

    isDrawingSignature.current = true;
    setHasDrawnSignature(true);

    canvas.setPointerCapture(event.pointerId);
  };

  /* =========================================================
   วาดลายเซ็นขณะเลื่อนเมาส์
========================================================= */

  const handleSignaturePointerMove = (
    event: ReactPointerEvent<HTMLCanvasElement>,
  ) => {
    if (isDrawingSignature.current === false) return;

    const canvas = signatureCanvasRef.current;

    if (canvas === null) return;

    const context = canvas.getContext("2d");

    if (context === null) return;

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
   ล้างลายเซ็นที่วาด
========================================================= */

  const handleClearSignature = () => {
    const canvas = signatureCanvasRef.current;

    if (canvas === null) return;

    const context = canvas.getContext("2d");

    if (context === null) return;

    context.clearRect(0, 0, canvas.width, canvas.height);

    isDrawingSignature.current = false;
    setHasDrawnSignature(false);
    setSignatureError("");
  };

  /* =========================================================
   เลือกรูปลายเซ็นจากเครื่อง
========================================================= */

  const handleChooseSignatureImage = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    if (!file) return;

    setSignatureError("");
    setSignatureFile(null);
    setSignaturePreview("");

    if (file.type !== "image/png" && file.type !== "image/jpeg") {
      setSignatureError("รองรับเฉพาะ PNG และ JPG");
      event.target.value = "";
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      setSignatureError("ไฟล์ต้องมีขนาดไม่เกิน 2 MB");
      event.target.value = "";
      return;
    }

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
   เลือกวิธีเพิ่มหรือเปลี่ยนลายเซ็น
========================================================= */

  const handleSelectSignatureMode = (mode: string) => {
    setSignatureMode(mode);
    setHasDrawnSignature(false);
    setSignatureFile(null);
    setSignaturePreview("");
    setSignaturePassword("");
    setSignatureError("");
    setSignatureSuccess("");
  };

  /* =========================================================
   ยกเลิกการแก้ไขลายเซ็น
========================================================= */

  const handleCancelSignature = () => {
    setIsEditingSignature(false);
    setSignatureMode("");
    setHasDrawnSignature(false);
    setSignatureFile(null);
    setSignaturePreview("");
    setSignaturePassword("");
    setSignatureError("");
  };

  /* =========================================================
   บันทึกลายเซ็นของอาจารย์
========================================================= */

  const handleSaveSignature = async () => {
    if (teacherId === null) {
      setSignatureError("ไม่พบข้อมูลอาจารย์");
      return;
    }

    if (savingSignature === true) return;

    if (signaturePassword.trim() === "") {
      setSignatureError("กรุณากรอกรหัสผ่านเพื่อยืนยัน");
      return;
    }

    if (signatureMode === "draw" && !hasDrawnSignature) {
      setSignatureError("กรุณาวาดลายเซ็นก่อนบันทึก");
      return;
    }

    if (signatureMode === "upload" && signatureFile === null) {
      setSignatureError("กรุณาเลือกรูปลายเซ็น");
      return;
    }

    // ยืนยันก่อนเปลี่ยนลายเซ็นเดิม
    if (teacher?.has_signature === 1) {
      const confirmed = window.confirm("ต้องการเปลี่ยนลายเซ็นเดิมใช่หรือไม่?");

      if (!confirmed) return;
    }

    setSavingSignature(true);
    setSignatureError("");
    setSignatureSuccess("");

    try {
      const formData = new FormData();

      // กรณีวาดลายเซ็น
      if (signatureMode === "draw") {
        const canvas = signatureCanvasRef.current;

        if (canvas === null) {
          throw new Error("ไม่พบพื้นที่วาดลายเซ็น");
        }

        const imageBlob = await new Promise<Blob | null>((resolve) => {
          canvas.toBlob((blob) => {
            resolve(blob);
          }, "image/png");
        });

        if (imageBlob === null) {
          throw new Error("ไม่สามารถสร้างไฟล์ลายเซ็นได้");
        }

        formData.append("signatureImage", imageBlob, "teacher-signature.png");
      }

      // กรณีอัปโหลดรูปลายเซ็น
      if (signatureMode === "upload") {
        if (signatureFile === null) {
          throw new Error("ไม่พบไฟล์ลายเซ็น");
        }

        formData.append("signatureImage", signatureFile);
      }

      formData.append("password", signaturePassword);

      const response = await axios.put(
        `http://localhost:5000/teacher/profile/${teacherId}/signature`,
        formData,
      );

      if (response.data.success === true) {
        // อัปเดตสถานะลายเซ็น
        setTeacher((previousTeacher) => {
          if (previousTeacher === null) return null;

          return {
            ...previousTeacher,
            has_signature: 1,
          };
        });

        handleCancelSignature();

        setSignatureSuccess("บันทึกลายเซ็นเรียบร้อยแล้ว");
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
     ออกจากระบบ
  ========================================================= */

  const handleLogout = () => {
    sessionStorage.clear();
    navigate("/");
  };

  return (
    <div className="teacher-home-page student-profile-page teacher-profile-page">
      {/* เมนูด้านข้างของอาจารย์ */}
      <aside className="sidebar">
        <div className="logo">
          <img src={logo} alt="SPTC Logo" />

          <div>
            <h2>SPTC System</h2>
            <p>ระบบติดตามและสื่อสารโครงงานนิสิต</p>
          </div>
        </div>

        <nav>
          <ul>
            <li onClick={() => navigate("/teacher-home")}>หน้าหลัก</li>

            <li onClick={() => navigate("/teacher-projects")}>
              จัดการหัวข้อโครงงาน
            </li>

            <li onClick={() => navigate("/teacher-requests")}>
              คำขอเข้าร่วมโครงงาน
            </li>

            <li onClick={() => navigate("/teacher-managed-projects")}>
              โครงงานที่ดูแล
            </li>

            <li onClick={() => navigate("/teacher-work")}>
              งานที่ต้องดำเนินการ
            </li>

            <li onClick={() => navigate("/teacher-decision-history")}>
              ประวัติการพิจารณา
            </li>

            <li onClick={() => navigate("/teacher-notifications")}>
              การแจ้งเตือน
            </li>

            <li className="active">ข้อมูลส่วนตัว</li>
          </ul>
        </nav>

        <button className="logout-btn" onClick={handleLogout}>
          ออกจากระบบ
        </button>
      </aside>

      {/* พื้นที่เนื้อหาหลัก */}
      <main className="main">
        {/* ส่วนหัวของหน้า */}
        <header className="header">
          <h2>ข้อมูลส่วนตัว</h2>

          <div className="header-right">
            <TeacherNotificationBell />

            <div className="user-info">
              <img
                src={imageToShow}
                onError={(event) => {
                  event.currentTarget.src = logo;
                }}
                alt="รูปโปรไฟล์"
                className="profile-image"
              />

              <span>{teacher?.username || username || "-"}</span>
            </div>
          </div>
        </header>

        <div className="student-profile-content teacher-profile-content">
          {/* สถานะการโหลดข้อมูล */}
          {loading && (
            <p className="student-profile-note">กำลังโหลดข้อมูลอาจารย์...</p>
          )}

          {error && <p className="student-profile-error">{error}</p>}

          {/* การ์ดรูปโปรไฟล์ */}
          <section className="student-profile-card">
            <div className="student-profile-header">
              <img
                className="student-profile-avatar"
                src={imageToShow}
                alt="รูปโปรไฟล์อาจารย์"
                onError={(event) => {
                  event.currentTarget.src = logo;
                }}
              />

              <div>
                <h3>{teacher?.name || "ข้อมูลอาจารย์"}</h3>

                <p>ชื่อผู้ใช้ : {teacher?.username || "-"}</p>

                <p>ตำแหน่ง : {teacher?.position || "-"}</p>

                <p>สาขาวิชา : {teacher?.major || "-"}</p>

                {/* ปุ่มและช่องเลือกรูปโปรไฟล์ */}
                <div className="student-profile-image-actions">
                  <label
                    htmlFor="teacher-profile-image-input"
                    className="student-profile-image-btn"
                  >
                    เปลี่ยนรูปโปรไฟล์
                  </label>

                  <input
                    id="teacher-profile-image-input"
                    type="file"
                    accept=".jpg,.jpeg,.png,.webp"
                    className="student-profile-file-input"
                    onChange={handleChooseProfileImage}
                    disabled={uploadingProfile}
                  />

                  {/* แสดงปุ่มเมื่อเลือกรูปใหม่แล้ว */}
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

                {/* ข้อความหลังเลือกรูปภาพ */}
                {selectedProfileImage !== null && (
                  <p className="student-profile-image-hint">
                    เลือกรูปภาพแล้ว (ยังไม่ได้บันทึก)
                  </p>
                )}

                {/* ข้อความข้อผิดพลาด */}
                {profileError !== "" && (
                  <p className="student-profile-error">{profileError}</p>
                )}

                {/* ข้อความเมื่อบันทึกสำเร็จ */}
                {profileSuccess !== "" && (
                  <p className="student-profile-success">{profileSuccess}</p>
                )}
              </div>
            </div>
          </section>

          {/* จัดการ์ดข้อมูลเป็นสองคอลัมน์ */}
          <div className="student-profile-details-grid">
            {/* ข้อมูลอาจารย์ */}
            <section className="student-profile-card">
              <h3>ข้อมูลอาจารย์</h3>

              <div className="student-profile-divider" />

              <div className="student-profile-info-row">
                <span>ชื่อ-นามสกุล</span>
                <strong>{teacher?.name || "-"}</strong>
              </div>

              <div className="student-profile-info-row">
                <span>ชื่อภาษาอังกฤษ</span>
                <strong>{teacher?.english_name || "-"}</strong>
              </div>

              <div className="student-profile-info-row">
                <span>สาขาวิชา</span>
                <strong>{teacher?.major || "-"}</strong>
              </div>

              <div className="student-profile-info-row">
                <span>ห้องทำงาน</span>
                <strong>{teacher?.office || "-"}</strong>
              </div>
            </section>

            {/* ข้อมูลการติดต่อ */}

            <section className="student-profile-card student-profile-contact-card">
              {/* หัวข้อและปุ่มแก้ไขข้อมูล */}
              <div className="student-profile-contact-heading">
                <h3>ข้อมูลการติดต่อ</h3>

                {isEditingContact === false && (
                  <button
                    type="button"
                    className="student-profile-edit-btn"
                    onClick={handleEditContact}
                  >
                    แก้ไขข้อมูล
                  </button>
                )}
              </div>

              <div className="student-profile-divider" />

              <div className="student-profile-info-row">
                <span>อีเมลหลัก</span>

                <div className="student-profile-primary-email">
                  <strong>{teacher?.email || "-"}</strong>

                  <small className="student-profile-email-hint">
                    อีเมลหลักของบัญชี ไม่สามารถแก้ไขได้
                  </small>
                </div>
              </div>

              {/* อีเมลสำรอง */}
              <div className="student-profile-info-row">
                <span>อีเมลสำรอง</span>

                {isEditingContact === true ? (
                  <input
                    type="email"
                    className="student-profile-input"
                    value={editBackupEmail}
                    onChange={(event) => {
                      setEditBackupEmail(event.target.value);
                    }}
                    placeholder="กรอกอีเมลสำรอง (ไม่บังคับ)"
                    disabled={savingContact}
                  />
                ) : (
                  <strong>{teacher?.backup_email || "ยังไม่ได้เพิ่ม"}</strong>
                )}
              </div>

              {/* เบอร์โทรศัพท์ */}
              <div className="student-profile-info-row">
                <span>เบอร์โทรศัพท์</span>

                {isEditingContact === true ? (
                  <input
                    type="tel"
                    className="student-profile-input"
                    value={editPhone}
                    onChange={(event) => {
                      setEditPhone(event.target.value);
                    }}
                    placeholder="กรอกเบอร์โทรศัพท์"
                    disabled={savingContact}
                  />
                ) : (
                  <strong>{teacher?.phone || "-"}</strong>
                )}
              </div>

              <div className="student-profile-info-row">
                <span>เบอร์สำนักงาน</span>
                <strong>{teacher?.office_phone || "-"}</strong>
              </div>

              {/* ข้อความข้อผิดพลาด */}
              {contactError !== "" && (
                <p className="student-profile-error">{contactError}</p>
              )}

              {/* ข้อความบันทึกสำเร็จ */}
              {contactSuccess !== "" && (
                <p className="student-profile-success">{contactSuccess}</p>
              )}

              {/* ปุ่มยกเลิกและบันทึก */}
              {isEditingContact === true && (
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

              {teacher !== null &&
                (teacher.has_signature === 1 ? (
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

            {/* ข้อความและปุ่มเปิดแก้ไข */}
            <div className="teacher-signature-toolbar">
              <p className="student-profile-note">
                ลายเซ็นสำหรับใช้ลงนามในเอกสารโครงงาน
              </p>

              {isEditingSignature === false && (
                <button
                  type="button"
                  className="student-profile-edit-btn"
                  onClick={() => {
                    setIsEditingSignature(true);
                    setSignatureSuccess("");
                  }}
                >
                  {teacher?.has_signature === 1
                    ? "เปลี่ยนลายเซ็น"
                    : "เพิ่มลายเซ็น"}
                </button>
              )}
            </div>

            {/* แจ้งผลเมื่อบันทึกสำเร็จ */}
            {signatureSuccess !== "" && (
              <p className="student-profile-success">{signatureSuccess}</p>
            )}

            {/* แบบฟอร์มแก้ไขลายเซ็น */}
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
                      handleSelectSignatureMode("draw");
                    }}
                    disabled={savingSignature}
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
                      handleSelectSignatureMode("upload");
                    }}
                    disabled={savingSignature}
                  >
                    อัปโหลดรูปลายเซ็น
                  </button>
                </div>

                {/* แสดงส่วนจัดการเมื่อเลือกวิธีแล้ว */}
                {signatureMode !== "" && (
                  <div className="student-signature-layout">
                    {/* คอลัมน์ซ้าย */}
                    <div className="student-signature-work-area">
                      {/* วาดลายเซ็น */}
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

                      {/* อัปโหลดลายเซ็น */}
                      {signatureMode === "upload" && (
                        <div className="student-signature-section">
                          <div className="student-signature-upload-box">
                            <h4>อัปโหลดรูปลายเซ็น</h4>

                            <p>เลือกรูปลายเซ็นจากเครื่องของคุณ</p>

                            <p className="student-signature-upload-hint">
                              รองรับ PNG และ JPG ขนาดไม่เกิน 2 MB
                            </p>

                            <input
                              id="teacher-signature-file"
                              type="file"
                              accept=".png,.jpg,.jpeg"
                              className="student-signature-file-input"
                              onChange={handleChooseSignatureImage}
                              disabled={savingSignature}
                            />

                            <label
                              htmlFor="teacher-signature-file"
                              className="student-signature-upload-btn"
                            >
                              เลือกไฟล์ลายเซ็น
                            </label>

                            {signatureFile !== null && (
                              <p className="student-signature-file-name">
                                ไฟล์ที่เลือก : {signatureFile.name}
                              </p>
                            )}
                          </div>

                          {signaturePreview !== "" && (
                            <div className="student-signature-preview">
                              <p>ตัวอย่างลายเซ็น</p>

                              <img
                                src={signaturePreview}
                                alt="ตัวอย่างลายเซ็นอาจารย์"
                              />

                              <p className="student-profile-note">
                                เลือกรูปลายเซ็นแล้ว (ยังไม่ได้บันทึก)
                              </p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* คอลัมน์ขวา */}
                    <div className="student-signature-save-section">
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

                      <label htmlFor="teacher-signature-password">
                        รหัสผ่านของบัญชี
                      </label>

                      <input
                        id="teacher-signature-password"
                        type="password"
                        placeholder="กรอกรหัสผ่านของบัญชี"
                        value={signaturePassword}
                        onChange={(event) => {
                          setSignaturePassword(event.target.value);
                          setSignatureError("");
                        }}
                        autoComplete="current-password"
                        disabled={savingSignature}
                      />

                      <p className="student-profile-note">
                        กรุณายืนยันรหัสผ่านก่อนบันทึกลายเซ็น
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
                  </div>
                )}

                {/* ข้อความข้อผิดพลาด */}
                {signatureError !== "" && (
                  <p className="student-profile-error">{signatureError}</p>
                )}
              </>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}

export default TeacherProfile;
