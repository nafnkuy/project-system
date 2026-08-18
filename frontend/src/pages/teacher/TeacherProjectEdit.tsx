import "./TeacherProjectEdit.css";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import { FaBell, FaPaperclip } from "react-icons/fa";

import logo from "../../assets/Logo.svg";

interface Project {
  id: number;
  title: string;

  advisor: string;
  advisor_id: number;
  advisor_name: string;
  major: string;

  description: string;
  objectives: string;
  skills: string;
  requirements: string;

  max_members: number;
  current_members: number;

  status: string;
  project_type: string;
  academic_year: string;

  visibility: "แสดง" | "ซ่อน";
}

function TeacherProjectEdit() {
  const navigate = useNavigate();
  const { id } = useParams();

  const userId = sessionStorage.getItem("userId");
  const username = sessionStorage.getItem("username");
  const profileImage = sessionStorage.getItem("profileImage");

  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  // =========================
  // ตรวจสอบ Login
  // =========================
  useEffect(() => {
    if (!userId) {
      navigate("/");
    }
  }, [userId, navigate]);

  // =========================
  // ดึงข้อมูลโครงงาน
  // =========================
  useEffect(() => {
    if (!id || !userId) return;

    axios
      .get(`http://localhost:5000/teacher/projects/${id}/${userId}`)
      .then((res) => {
        console.log("Teacher Project Edit =", res.data);
        setProject(res.data);
      })
      .catch((err) => {
        console.log("Get teacher project edit error:", err);

        alert(err.response?.data?.message || "ไม่สามารถโหลดข้อมูลโครงงานได้");
      })
      .finally(() => {
        setLoading(false);
      });
  }, [id, userId]);

  // =========================
  // Logout
  // =========================
  const handleLogout = () => {
    sessionStorage.removeItem("userId");
    sessionStorage.removeItem("username");
    sessionStorage.removeItem("name");
    sessionStorage.removeItem("profileImage");
    sessionStorage.removeItem("major");

    navigate("/");
  };

  // =========================
  // เปลี่ยนข้อมูล
  // =========================
  const handleChange = (field: keyof Project, value: string | number) => {
    if (!project) return;

    setProject({
      ...project,
      [field]: value,
    });

    setHasChanges(true);
  };
  // =========================
  // บันทึก
  // =========================
  const handleSubmit = async () => {
    if (!project || !userId) return;

    setSaving(true);

    try {
      await axios.put(
        `http://localhost:5000/teacher/projects/${project.id}/${userId}`,
        {
          title: project.title,
          project_type: project.project_type,
          max_members: project.max_members,
          academic_year: project.academic_year,
          description: project.description,
          objectives: project.objectives,
          skills: project.skills,
          requirements: project.requirements,
          status: project.status,
          visibility: project.visibility,
        },
      );

      alert("บันทึกการแก้ไขเรียบร้อยแล้ว");

      navigate("/teacher-projects");
    } catch (error: any) {
      console.log("Update project error:", error);

      alert(error.response?.data?.message || "ไม่สามารถบันทึกการแก้ไขได้");
    } finally {
      setSaving(false);
    }
  };

  // =========================
  // Loading
  // =========================
  if (loading) {
    return <div className="edit-loading">กำลังโหลดข้อมูล...</div>;
  }

  // =========================
  // ไม่พบข้อมูล
  // =========================
  if (!project) {
    return <div className="edit-loading">ไม่พบหัวข้อโครงงาน</div>;
  }

  return (
    <div className="teacher-project-edit-page">
      {/* ================= SIDEBAR ================= */}

      <aside className="sidebar">
        <div className="logo-section">
          <img src={logo} alt="SPTC Logo" />

          <div>
            <h2>SPTC System</h2>
            <p>ระบบติดตามและสื่อสารโครงงานนิสิต</p>
          </div>
        </div>

        <nav>
          <ul>
            <li onClick={() => navigate("/teacher-home")}>หน้าหลัก</li>

            <li
              className="active"
              onClick={() => navigate("/teacher-projects")}
            >
              จัดการหัวข้อโครงงาน
            </li>

            <li>คำขอเข้าร่วมโครงงาน</li>
            <li>ภาระงานที่ปรึกษา</li>
            <li>ประวัติการพิจารณา</li>
            <li>การแจ้งเตือน</li>
            <li>ข้อมูลส่วนตัว</li>
          </ul>
        </nav>

        <button className="logout-btn" onClick={handleLogout}>
          ออกจากระบบ
        </button>
      </aside>

      {/* ================= MAIN ================= */}

      <main className="main">
        {/* ================= HEADER ================= */}

        <header className="header">
          <div className="breadcrumb">
            <span
              className="breadcrumb-link"
              onClick={() => navigate("/teacher-projects")}
            >
              จัดการหัวข้อโครงงาน
            </span>

            <span>&gt;</span>

            <span>แก้ไข</span>
          </div>

          <div className="header-right">
            <button className="notification-btn">
              <FaBell />
            </button>

            <div className="user-info">
              <img
                src={
                  profileImage ? `http://localhost:5000${profileImage}` : logo
                }
                alt="Profile"
                className="profile-image"
              />

              <span>{username}</span>
            </div>
          </div>
        </header>

        {/* ================= CONTENT ================= */}

        <div className="edit-content">
          <form
            className="edit-form"
            onSubmit={(e) => {
              e.preventDefault();
              handleSubmit();
            }}
          >
            {/* =================================================
                ชื่อหัวข้อ
            ================================================= */}

            <section className="form-section">
              <div className="form-group">
                <label>ชื่อหัวข้อโครงงาน *</label>

                <input
                  type="text"
                  value={project.title}
                  onChange={(e) => handleChange("title", e.target.value)}
                />
              </div>
            </section>

            {/* =================================================
                ข้อมูลอาจารย์
            ================================================= */}

            <section className="form-section teacher-section">
              <div className="teacher-row">
                <div className="teacher-info-item">
                  <label>อาจารย์ที่ปรึกษา</label>

                  <div className="teacher-info-value">
                    {project.advisor_name || project.advisor || "-"}
                  </div>
                </div>

                <div className="teacher-info-item">
                  <label>สาขาวิชา</label>

                  <div className="teacher-info-value">
                    {project.major || "-"}
                  </div>
                </div>
              </div>
            </section>

            {/* =================================================
                การเปิดรับ
            ================================================= */}

            <section className="form-section">
              <div className="form-row">
                {/* ประเภทโครงงาน */}
                <div className="form-group">
                  <label>ประเภทโครงงาน *</label>

                  <div className="edit-select-wrapper">
                    <select
                      value={project.project_type}
                      onChange={(e) => {
                        const value = e.target.value;

                        handleChange("project_type", value);

                        handleChange(
                          "max_members",
                          value === "โครงงานเดี่ยว" ? 1 : 2,
                        );
                      }}
                      className="edit-filter-select"
                    >
                      <option value="โครงงานเดี่ยว">โครงงานเดี่ยว</option>
                      <option value="โครงงานคู่">โครงงานคู่</option>
                    </select>

                    <span className="edit-select-arrow">▼</span>
                  </div>
                </div>

                {/* ปีการศึกษา / ภาคเรียน */}
                <div className="form-group">
                  <label>ปีการศึกษา / ภาคเรียน *</label>

                  <div className="edit-select-wrapper">
                    <select
                      value={project.academic_year}
                      onChange={(e) =>
                        handleChange("academic_year", e.target.value)
                      }
                      className="edit-filter-select"
                    >
                      <option value="2569/1">2569/1</option>
                      <option value="2569/2">2569/2</option>
                      <option value="2570/1">2570/1</option>
                      <option value="2570/2">2570/2</option>
                    </select>

                    <span className="edit-select-arrow">▼</span>
                  </div>
                </div>
              </div>

              {/* จำนวนที่รับ */}
              <div className="project-member-info">
                <span>จำนวนที่รับ</span>

                <strong>
                  {project.project_type === "โครงงานเดี่ยว"
                    ? "รับ 1 คน"
                    : "รับ 2 คน"}
                </strong>

                {project.current_members > 0 && (
                  <small>ขณะนี้มีสมาชิกแล้ว {project.current_members} คน</small>
                )}
              </div>
            </section>

            {/* =================================================
                รายละเอียด
            ================================================= */}

            <section className="form-section">
              <div className="form-group">
                <label>รายละเอียดโครงงาน *</label>

                <textarea
                  rows={5}
                  value={project.description}
                  onChange={(e) => handleChange("description", e.target.value)}
                />
              </div>

              <div className="form-group">
                <label>วัตถุประสงค์</label>

                <textarea
                  rows={5}
                  value={project.objectives}
                  onChange={(e) => handleChange("objectives", e.target.value)}
                />
              </div>

              <div className="form-group">
                <label>เทคโนโลยีที่ใช้ *</label>

                <div className="example-text">
                  ตัวอย่างการกรอก: React|Node.js|MySQL|Git|HTML|CSS
                  <br />
                  <strong>ห้ามเว้นวรรคระหว่างเครื่องหมาย |</strong>
                </div>

                <input
                  type="text"
                  value={project.skills}
                  onChange={(e) => handleChange("skills", e.target.value)}
                />
              </div>

              <div className="form-group">
                <label>คุณสมบัติ/ข้อกำหนดของนิสิต</label>

                <textarea
                  rows={4}
                  value={project.requirements}
                  onChange={(e) => handleChange("requirements", e.target.value)}
                />
              </div>

              {/* ปุ่ม */}
              <div className="form-actions">
                <button
                  type="button"
                  className="cancel-btn"
                  onClick={() => navigate("/teacher-projects")}
                >
                  ยกเลิก
                </button>

                <button
                  type="submit"
                  className="save-btn"
                  disabled={saving || !hasChanges}
                >
                  {saving ? "กำลังบันทึก..." : "บันทึกการแก้ไข"}
                </button>
              </div>
            </section>
          </form>
        </div>
      </main>
    </div>
  );
}

export default TeacherProjectEdit;
