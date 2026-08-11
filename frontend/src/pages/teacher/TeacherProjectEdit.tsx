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

  const userId = localStorage.getItem("userId");
  const username = localStorage.getItem("username");
  const profileImage = localStorage.getItem("profileImage");

  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

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
      })
      .finally(() => {
        setLoading(false);
      });
  }, [id, userId]);

  // =========================
  // Logout
  // =========================
  const handleLogout = () => {
    localStorage.removeItem("userId");
    localStorage.removeItem("username");
    localStorage.removeItem("name");
    localStorage.removeItem("profileImage");

    navigate("/");
  };

  // =========================
  // แก้ไขข้อมูลในฟอร์ม
  // =========================
  const handleChange = (
    field: keyof Project,
    value: string | number,
  ) => {
    if (!project) return;

    setProject({
      ...project,
      [field]: value,
    });
  };

  // =========================
  // บันทึกข้อมูล
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
    } catch (error) {
      console.log("Update project error:", error);

      alert("ไม่สามารถบันทึกการแก้ไขได้");
    } finally {
      setSaving(false);
    }
  };

  // =========================
  // Loading
  // =========================
  if (loading) {
    return (
      <div className="edit-loading">
        กำลังโหลดข้อมูล...
      </div>
    );
  }

  // =========================
  // ไม่พบข้อมูล
  // =========================
  if (!project) {
    return (
      <div className="edit-loading">
        ไม่พบหัวข้อโครงงาน
      </div>
    );
  }

  return (
    <div className="layout">
      {/* ================= SIDEBAR ================= */}

      <aside className="sidebar">
        <div className="logo">
          <img src={logo} alt="Logo" />

          <div>
            <h2>SPTC System</h2>
            <p>ระบบติดตามและสื่อสารโครงงานนิสิต</p>
          </div>
        </div>

        <nav>
          <ul>
            <li onClick={() => navigate("/teacher-home")}>
              หน้าหลัก
            </li>

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
              onClick={() => navigate("/teacher-projects")}
              className="breadcrumb-link"
            >
              จัดการหัวข้อโครงงาน
            </span>

            <span>&gt;</span>

            <span>รายละเอียด &gt; แก้ไข</span>
          </div>

          <div className="header-right">
            <button className="notification-btn">
              <FaBell />
            </button>

            <div className="user-info">
              <img
                src={
                  profileImage
                    ? `http://localhost:5000${profileImage}`
                    : logo
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
          <div className="edit-card">

            <h2 className="edit-title">
              แก้ไขหัวข้อโครงงาน
            </h2>

            {/* ================= ชื่อหัวข้อ ================= */}

            <div className="form-group">
              <label>ชื่อหัวข้อโครงงาน</label>

              <input
                type="text"
                value={project.title}
                onChange={(e) =>
                  handleChange("title", e.target.value)
                }
              />
            </div>

            {/* ================= อาจารย์ ================= */}

            <div className="form-group">
              <label>อาจารย์ที่ปรึกษา</label>

              <div className="advisor-label">
                ชื่อ
              </div>

              <div className="advisor-display">
                {project.advisor_name || project.advisor || "-"}
              </div>
            </div>

            {/* ================= ปีการศึกษา ================= */}

            <div className="form-group">
              <label>ปีการศึกษา</label>

              <select
                value={project.academic_year}
                onChange={(e) =>
                  handleChange(
                    "academic_year",
                    e.target.value,
                  )
                }
              >
                <option value="2569/1">2569/1</option>
                <option value="2569/2">2569/2</option>
                <option value="2570/1">2570/1</option>
                <option value="2570/2">2570/2</option>
              </select>
            </div>

            {/* ================= ประเภทโครงงาน ================= */}

            <div className="form-group">
              <label>ประเภทโครงงาน</label>

              <div className="radio-group">
                <label>
                  <input
                    type="radio"
                    name="project_type"
                    value="โครงงานเดี่ยว"
                    checked={
                      project.project_type === "โครงงานเดี่ยว"
                    }
                    onChange={(e) =>
                      handleChange(
                        "project_type",
                        e.target.value,
                      )
                    }
                  />

                  โครงงานเดี่ยว
                </label>

                <label>
                  <input
                    type="radio"
                    name="project_type"
                    value="โครงงานคู่"
                    checked={
                      project.project_type === "โครงงานคู่"
                    }
                    onChange={(e) =>
                      handleChange(
                        "project_type",
                        e.target.value,
                      )
                    }
                  />

                  โครงงานคู่
                </label>
              </div>
            </div>

            {/* ================= จำนวนที่รับ ================= */}

            <div className="form-group">
              <label>จำนวนนิสิตที่รับ</label>

              <div className="number-input">
                <input
                  type="number"
                  min="1"
                  value={project.max_members}
                  onChange={(e) =>
                    handleChange(
                      "max_members",
                      Number(e.target.value),
                    )
                  }
                />

                <span>คน</span>
              </div>

              {project.current_members > 0 && (
                <small className="member-warning">
                  ขณะนี้มีสมาชิกแล้ว {project.current_members} คน
                </small>
              )}
            </div>

            {/* ================= รายละเอียด ================= */}

            <div className="form-group">
              <label>รายละเอียดโครงงาน</label>

              <textarea
                rows={5}
                value={project.description}
                onChange={(e) =>
                  handleChange(
                    "description",
                    e.target.value,
                  )
                }
              />
            </div>

            {/* ================= วัตถุประสงค์ ================= */}

            <div className="form-group">
              <label>วัตถุประสงค์</label>

              <textarea
                rows={5}
                value={project.objectives}
                onChange={(e) =>
                  handleChange(
                    "objectives",
                    e.target.value,
                  )
                }
              />
            </div>

            {/* ================= เทคโนโลยี ================= */}

            <div className="form-group">
              <label>เทคโนโลยีที่ใช้</label>

              <div className="example-text">
                 ตัวอย่างการกรอก: React|Node.js|MySQL|Git|HTML|CSS
                 **ห้ามเว้นวรรคระหว่างเครื่องหมาย |**
              </div>

              {/* <div className="technology-box">
                {project.skills || "-"}
              </div> */}

              <input
                type="text"
                value={project.skills}
                onChange={(e) =>
                  handleChange("skills", e.target.value)
                }
              />
            </div>

            {/* ================= คุณสมบัติ ================= */}

            <div className="form-group">
              <label>คุณสมบัติผู้สมัคร</label>

              <textarea
                rows={5}
                value={project.requirements}
                onChange={(e) =>
                  handleChange(
                    "requirements",
                    e.target.value,
                  )
                }
              />
            </div>

            {/* ================= เอกสาร ================= */}

            <div className="form-group">
              <label>เอกสารที่เกี่ยวข้อง</label>

              <div className="document-list">
                <button type="button">
                  <FaPaperclip />
                  Project Proposal.pdf
                </button>

                <button type="button">
                  <FaPaperclip />
                  Requirement Specification.pdf
                </button>
              </div>

              <button
                type="button"
                className="choose-file-btn"
              >
                <FaPaperclip />
                เลือกไฟล์
              </button>
            </div>

            {/* ================= สถานะ ================= */}

            <div className="form-group">
              <label>สถานะ</label>

              <div className="radio-group">
                <label>
                  <input
                    type="radio"
                    name="visibility"
                    checked={project.visibility === "แสดง"}
                    onChange={() =>
                      handleChange("visibility", "แสดง")
                    }
                  />

                  เปิดรับสมัคร
                </label>

                <label>
                  <input
                    type="radio"
                    name="visibility"
                    checked={project.visibility === "ซ่อน"}
                    onChange={() =>
                      handleChange("visibility", "ซ่อน")
                    }
                  />

                  ซ่อนหัวข้อ
                </label>
              </div>
            </div>

            {/* ================= BUTTON ================= */}

            <div className="edit-actions">
              <button
                type="button"
                className="cancel-btn"
                onClick={() =>
                  navigate("/teacher-projects")
                }
              >
                ยกเลิก
              </button>

              <button
                type="button"
                className="save-btn"
                onClick={handleSubmit}
                disabled={saving}
              >
                {saving
                  ? "กำลังบันทึก..."
                  : "บันทึกข้อแก้ไข"}
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default TeacherProjectEdit;