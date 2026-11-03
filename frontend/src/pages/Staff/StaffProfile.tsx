
import { useEffect, useState, type ChangeEvent } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { FaBell } from "react-icons/fa";

import logo from "../../assets/Logo.svg";

import "../teacher/TeacherHome.css";
import "../student/StudentProfile.css";
import "../teacher/TeacherProfile.css";
import "./StaffProfile.css";

/* =========================================================
   ข้อมูลส่วนตัวของเจ้าหน้าที่
========================================================= */

interface StaffProfileData {
  id: number;
  username: string;
  prefix: string | null;
  name: string;
  role: string;
  profile_image: string | null;
  email: string | null;
  backup_email: string | null;
  phone: string | null;
}

function StaffProfile() {
  const navigate = useNavigate();

  const userId = sessionStorage.getItem("userId");
  const username = sessionStorage.getItem("username");
  const profileImage = sessionStorage.getItem("profileImage");

  /* =========================================================
     ข้อมูลเจ้าหน้าที่
  ========================================================= */

  const [profile, setProfile] = useState<StaffProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  /* =========================================================
     เปลี่ยนรูปโปรไฟล์
  ========================================================= */

  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState("");
  const [uploadingImage, setUploadingImage] = useState(false);
  const [imageError, setImageError] = useState("");
  const [imageSuccess, setImageSuccess] = useState("");

  /* =========================================================
     แก้ไขข้อมูลการติดต่อ
  ========================================================= */

  const [isEditingContact, setIsEditingContact] = useState(false);
  const [editBackupEmail, setEditBackupEmail] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [savingContact, setSavingContact] = useState(false);
  const [contactError, setContactError] = useState("");
  const [contactSuccess, setContactSuccess] = useState("");

  /* =========================================================
     รูปโปรไฟล์ที่ใช้แสดง
  ========================================================= */

  let imageToShow = logo;

  const currentImage = profile?.profile_image || profileImage;

  if (currentImage) {
    imageToShow = `http://localhost:5000${currentImage}`;
  }

  if (imagePreview) {
    imageToShow = imagePreview;
  }

  /* =========================================================
     ตรวจสอบ Login และโหลดข้อมูลเจ้าหน้าที่
  ========================================================= */

  useEffect(() => {
    if (!userId || !username) {
      navigate("/", { replace: true });
      return;
    }

    const loadProfile = async () => {
      try {
        setLoading(true);
        setError("");

        const res = await axios.get<StaffProfileData>(
          `http://localhost:5000/staff/profile/${userId}`
        );

        setProfile(res.data);
        setEditBackupEmail(res.data.backup_email || "");
        setEditPhone(res.data.phone || "");
      } catch (err) {
        console.error("โหลดข้อมูลเจ้าหน้าที่ไม่สำเร็จ:", err);
        setError("ไม่สามารถโหลดข้อมูลส่วนตัวได้");
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, [userId, username, navigate]);

  /* =========================================================
     เลือกรูปโปรไฟล์
  ========================================================= */

  const handleChooseImage = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    if (!file) return;

    setImageError("");
    setImageSuccess("");

    if (
      file.type !== "image/jpeg" &&
      file.type !== "image/png" &&
      file.type !== "image/webp"
    ) {
      setImageError("รองรับเฉพาะ JPG, PNG และ WebP");
      event.target.value = "";
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      setImageError("รูปภาพต้องมีขนาดไม่เกิน 2 MB");
      event.target.value = "";
      return;
    }

    const reader = new FileReader();

    reader.onload = () => {
      if (typeof reader.result === "string") {
        setSelectedImage(file);
        setImagePreview(reader.result);
      }
    };

    reader.onerror = () => {
      setImageError("ไม่สามารถอ่านรูปภาพได้");
    };

    reader.readAsDataURL(file);

    event.target.value = "";
  };

  /* =========================================================
     ยกเลิกการเปลี่ยนรูป
  ========================================================= */

  const handleCancelImage = () => {
    setSelectedImage(null);
    setImagePreview("");
    setImageError("");
    setImageSuccess("");
  };

  /* =========================================================
     บันทึกรูปโปรไฟล์ใหม่
  ========================================================= */

  const handleSaveImage = async () => {
    if (!userId || !selectedImage || uploadingImage) {
      return;
    }

    try {
      setUploadingImage(true);
      setImageError("");
      setImageSuccess("");

      const formData = new FormData();
      formData.append("profileImage", selectedImage);

      const res = await axios.put(
        `http://localhost:5000/staff/profile/${userId}/image`,
        formData
      );

      const newImage = res.data.profile_image;

      setProfile((previous) => {
        if (!previous) return null;

        return {
          ...previous,
          profile_image: newImage,
        };
      });

      sessionStorage.setItem("profileImage", newImage);

      setSelectedImage(null);
      setImagePreview("");
      setImageSuccess("เปลี่ยนรูปโปรไฟล์เรียบร้อยแล้ว");
    } catch (err) {
      if (axios.isAxiosError(err)) {
        setImageError(
          err.response?.data?.message || "ไม่สามารถบันทึกรูปโปรไฟล์ได้"
        );
      } else {
        setImageError("เกิดข้อผิดพลาดในการอัปโหลดรูปภาพ");
      }
    } finally {
      setUploadingImage(false);
    }
  };

  /* =========================================================
     เปิดหน้าแก้ไขข้อมูลการติดต่อ
  ========================================================= */

  const handleEditContact = () => {
    setEditBackupEmail(profile?.backup_email || "");
    setEditPhone(profile?.phone || "");
    setContactError("");
    setContactSuccess("");
    setIsEditingContact(true);
  };

  /* =========================================================
     ยกเลิกการแก้ไขข้อมูล
  ========================================================= */

  const handleCancelContact = () => {
    setEditBackupEmail(profile?.backup_email || "");
    setEditPhone(profile?.phone || "");
    setContactError("");
    setIsEditingContact(false);
  };

  /* =========================================================
     บันทึกข้อมูลการติดต่อ
  ========================================================= */

  const handleSaveContact = async () => {
    if (!userId || savingContact) {
      return;
    }

    try {
      setSavingContact(true);
      setContactError("");
      setContactSuccess("");

      const res = await axios.put(
        `http://localhost:5000/staff/profile/${userId}/contact`,
        {
          backup_email: editBackupEmail.trim(),
          phone: editPhone.trim(),
        }
      );

      setProfile((previous) => {
        if (!previous) return null;

        return {
          ...previous,
          backup_email: res.data.backup_email,
          phone: res.data.phone,
        };
      });

      setIsEditingContact(false);
      setContactSuccess("บันทึกข้อมูลการติดต่อเรียบร้อยแล้ว");
    } catch (err) {
      if (axios.isAxiosError(err)) {
        setContactError(
          err.response?.data?.message || "ไม่สามารถบันทึกข้อมูลได้"
        );
      } else {
        setContactError("เกิดข้อผิดพลาดในการบันทึกข้อมูล");
      }
    } finally {
      setSavingContact(false);
    }
  };

  /* =========================================================
     ออกจากระบบ
  ========================================================= */

  const handleLogout = () => {
    sessionStorage.clear();
    navigate("/", { replace: true });
  };

  /* =========================================================
     ไม่แสดงหน้าเมื่อยังไม่ได้ Login
  ========================================================= */

  if (!userId || !username) {
    return null;
  }

  return (
    <div className="teacher-home-page student-profile-page teacher-profile-page staff-profile-page">

      {/* เมนูด้านข้างของเจ้าหน้าที่ */}
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
            <li onClick={() => navigate("/staff-home")}>
              หน้าหลัก
            </li>

            <li onClick={() => navigate("/staff-documents")}>
              เอกสารขออนุมัติหัวข้อโครงงาน
            </li>

            <li onClick={() => navigate("/staff-signature-history")}>
              ประวัติการลงนาม
            </li>

            <li onClick={() => navigate("/staff-notifications")}>
              การแจ้งเตือน
            </li>

            <li className="active">
              ข้อมูลส่วนตัว
            </li>
          </ul>
        </nav>

        <button
          type="button"
          className="logout-btn"
          onClick={handleLogout}
        >
          ออกจากระบบ
        </button>
      </aside>

      {/* เนื้อหาหลัก */}
      <main className="main">

        {/* ส่วนหัว */}
        <header className="header">
          <h2>ข้อมูลส่วนตัว</h2>

          <div className="header-right">
            <button
              type="button"
              className="staff-profile-bell"
              onClick={() => navigate("/staff-notifications")}
              aria-label="การแจ้งเตือน"
            >
              <FaBell />
            </button>

            <div className="user-info">
              <img
                src={imageToShow}
                alt="รูปโปรไฟล์"
                className="profile-image"
                onError={(event) => {
                  event.currentTarget.src = logo;
                }}
              />

              <span>{profile?.username || username}</span>
            </div>
          </div>
        </header>

        <div className="student-profile-content teacher-profile-content">

          {loading && (
            <p className="student-profile-note">
              กำลังโหลดข้อมูลเจ้าหน้าที่...
            </p>
          )}

          {error && (
            <p className="student-profile-error">{error}</p>
          )}

          {!loading && profile && (
            <>
              {/* ======================================
                  การ์ดรูปโปรไฟล์
              ====================================== */}

              <section className="student-profile-card">
                <div className="student-profile-header">

                  <img
                    className="student-profile-avatar"
                    src={imageToShow}
                    alt="รูปโปรไฟล์เจ้าหน้าที่"
                    onError={(event) => {
                      event.currentTarget.src = logo;
                    }}
                  />

                  <div>
                    <h3>{profile.name}</h3>

                    <p>ชื่อผู้ใช้ : {profile.username}</p>
                    <p>ประเภทผู้ใช้งาน : เจ้าหน้าที่</p>

                    <div className="student-profile-image-actions">
                      <label
                        htmlFor="staff-profile-image-input"
                        className="student-profile-image-btn"
                      >
                        เปลี่ยนรูปโปรไฟล์
                      </label>

                      <input
                        id="staff-profile-image-input"
                        type="file"
                        accept=".jpg,.jpeg,.png,.webp"
                        className="student-profile-file-input"
                        onChange={handleChooseImage}
                        disabled={uploadingImage}
                      />

                      {selectedImage !== null && (
                        <>
                          <button
                            type="button"
                            className="student-profile-cancel-image-btn"
                            onClick={handleCancelImage}
                            disabled={uploadingImage}
                          >
                            ยกเลิก
                          </button>

                          <button
                            type="button"
                            className="student-profile-save-image-btn"
                            onClick={handleSaveImage}
                            disabled={uploadingImage}
                          >
                            {uploadingImage
                              ? "กำลังบันทึก..."
                              : "บันทึกรูปโปรไฟล์"}
                          </button>
                        </>
                      )}
                    </div>

                    {selectedImage !== null && (
                      <p className="student-profile-image-hint">
                        เลือกรูปภาพแล้ว (ยังไม่ได้บันทึก)
                      </p>
                    )}

                    {imageError && (
                      <p className="student-profile-error">{imageError}</p>
                    )}

                    {imageSuccess && (
                      <p className="student-profile-success">{imageSuccess}</p>
                    )}
                  </div>
                </div>
              </section>

              {/* ======================================
                  ข้อมูลเจ้าหน้าที่และข้อมูลการติดต่อ
              ====================================== */}

              <div className="student-profile-details-grid">

                {/* ข้อมูลเจ้าหน้าที่ */}
                <section className="student-profile-card">
                  <h3>ข้อมูลเจ้าหน้าที่</h3>

                  <div className="student-profile-divider" />

                  <div className="student-profile-info-row">
                    <span>ชื่อ-นามสกุล</span>
                    <strong>{profile.name || "-"}</strong>
                  </div>

                  <div className="student-profile-info-row">
                    <span>ชื่อผู้ใช้</span>
                    <strong>{profile.username || "-"}</strong>
                  </div>

                  <div className="student-profile-info-row">
                    <span>ประเภทผู้ใช้งาน</span>
                    <strong>เจ้าหน้าที่</strong>
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
                        onClick={handleEditContact}
                      >
                        แก้ไขข้อมูล
                      </button>
                    )}
                  </div>

                  <div className="student-profile-divider" />

                  {/* อีเมลหลัก */}
                  <div className="student-profile-info-row">
                    <span>อีเมลหลัก</span>

                    <div className="student-profile-primary-email">
                      <strong>{profile.email || "-"}</strong>

                      <small className="student-profile-email-hint">
                        อีเมลหลักของบัญชี ไม่สามารถแก้ไขได้
                      </small>
                    </div>
                  </div>

                  {/* อีเมลสำรอง */}
                  <div className="student-profile-info-row">
                    <span>อีเมลสำรอง</span>

                    {isEditingContact ? (
                      <input
                        type="email"
                        className="student-profile-input"
                        value={editBackupEmail}
                        onChange={(event) =>
                          setEditBackupEmail(event.target.value)
                        }
                        placeholder="กรอกอีเมลสำรอง (ไม่บังคับ)"
                        disabled={savingContact}
                      />
                    ) : (
                      <strong>
                        {profile.backup_email || "ยังไม่ได้เพิ่ม"}
                      </strong>
                    )}
                  </div>

                  {/* เบอร์โทรศัพท์ */}
                  <div className="student-profile-info-row">
                    <span>เบอร์โทรศัพท์</span>

                    {isEditingContact ? (
                      <input
                        type="tel"
                        className="student-profile-input"
                        value={editPhone}
                        onChange={(event) =>
                          setEditPhone(event.target.value)
                        }
                        placeholder="กรอกเบอร์โทรศัพท์"
                        disabled={savingContact}
                      />
                    ) : (
                      <strong>{profile.phone || "-"}</strong>
                    )}
                  </div>

                  {contactError && (
                    <p className="student-profile-error">
                      {contactError}
                    </p>
                  )}

                  {contactSuccess && (
                    <p className="student-profile-success">
                      {contactSuccess}
                    </p>
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
                        {savingContact
                          ? "กำลังบันทึก..."
                          : "บันทึกข้อมูล"}
                      </button>
                    </div>
                  )}
                </section>

              </div>
            </>
          )}

          {!loading && !profile && !error && (
            <p className="student-profile-note">
              ไม่พบข้อมูลเจ้าหน้าที่
            </p>
          )}

        </div>
      </main>
    </div>
  );
}

export default StaffProfile;
