import "./TeacherProjectDetail.css";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import { FaBell } from "react-icons/fa";

import logo from "../../assets/Logo.svg";

interface Member {
  id: number;
  username: string;
  name: string;
}

interface Project {
  id: number;
  title: string;
  advisor_name: string;
  major: string;
  academic_year: string;

  project_type: string;
  status: string;

  max_members: number;
  current_members: number;

  description: string;
  objectives: string;
  skills: string;
  requirements: string;

  visibility: "แสดง" | "ซ่อน";

  members: Member[];
}

function TeacherProjectDetail() {
  const navigate = useNavigate();
  const { id } = useParams();

  const userId = sessionStorage.getItem("userId");
  const username = sessionStorage.getItem("username");
  const profileImage = sessionStorage.getItem("profileImage");

  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);

  // =========================
  // ตรวจสอบ Login
  // =========================
  useEffect(() => {
    if (!userId) {
      navigate("/");
      return;
    }

    if (!id) {
      navigate("/teacher-projects");
      return;
    }

    // =========================
    // ดึงรายละเอียดโครงงาน
    // =========================
    axios
      .get(`http://localhost:5000/teacher/projects/${id}/${userId}`)
      .then((res) => {
        console.log("Teacher Project Detail =", res.data);

        setProject(res.data);
      })
      .catch((err) => {
        console.log("Get project detail error:", err);

        alert(
          err.response?.data?.message || "ไม่สามารถโหลดรายละเอียดโครงงานได้",
        );

        navigate("/teacher-projects");
      })
      .finally(() => {
        setLoading(false);
      });
  }, [id, userId, navigate]);

  // =========================
  // Logout
  // =========================
  const handleLogout = () => {
    sessionStorage.removeItem("userId");
    sessionStorage.removeItem("username");
    sessionStorage.removeItem("name");
    sessionStorage.removeItem("profileImage");

    navigate("/");
  };
  const skillStyles: Record<
    string,
    { backgroundColor: string; borderColor: string }
  > = {
    React: {
      backgroundColor: "#DBEAFE",
      borderColor: "#4385F5",
    },
    "Node.js": {
      backgroundColor: "#DCFCE7",
      borderColor: "#30BF2D",
    },
    MySQL: {
      backgroundColor: "#FFEDD5",
      borderColor: "#FF8A05",
    },
    Git: {
      backgroundColor: "#FEE2E2",
      borderColor: "#DD5245",
    },
    Python: {
      backgroundColor: "#FEF3C7",
      borderColor: "#EEB400",
    },
    RFID: {
      backgroundColor: "#F3E8FF",
      borderColor: "#BB38FF",
    },
    AI: {
      backgroundColor: "#E0E7FF",
      borderColor: "#055DF2",
    },
    HTML: {
      backgroundColor: "#FDF2F8", // ชมพูพาสเทล
      borderColor: "#F472B6",
    },

    CSS: {
      backgroundColor: "#ECFDF5", // มิ้นต์พาสเทล
      borderColor: "#34D399",
    },

    JavaScript: {
      backgroundColor: "#FAF5FF", // ม่วงพาสเทล
      borderColor: "#C084FC",
    },

    "QR Code": {
      backgroundColor: "#FFEAF4",
      borderColor: "#E91E63", // ชมพูเข้ม
    },

    "API Integration": {
      backgroundColor: "#E8F8F5",
      borderColor: "#16A085", // เขียวอมฟ้า (Teal)
    },
  };
  if (!project) {
    return <h2 style={{ padding: 20 }}>กำลังโหลด...</h2>;
  }

  // =========================
  // Loading state
  // =========================
  if (loading) {
    return <div>กำลังโหลดข้อมูล...</div>;
  }

  // =========================
  // ไม่พบโครงงาน
  // =========================
  if (!project) {
    return <div>ไม่พบข้อมูลโครงงาน</div>;
  }

  // =========================
  // เตรียมข้อมูลสำหรับการแสดงผล
  // =========================
  const objectives = project.objectives ? project.objectives.split("|") : [];

  const skills = project.skills ? project.skills.split("|") : [];

  const requirements = project.requirements
    ? project.requirements.split("|")
    : [];

  return (
    <div className="teacher-project-detail-page">
      {/* SIDEBAR */}
      <aside className="sidebar">
        <div className="sidebar-logo">
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

      {/* MAIN */}
      <main className="main">
        {/* HEADER */}
        <header className="header">
          <div className="breadcrumb">
            <span
              onClick={() => navigate("/teacher-projects")}
              className="breadcrumb-link"
            >
              จัดการหัวข้อโครงงาน
            </span>

            <span> &gt; </span>

            <span>รายละเอียดโครงงาน</span>
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

        {/* =========================
            CONTENT
        ========================= */}
        <div className="detail-content">
          {/* =========================
              PROJECT HEADER
          ========================= */}
          <div className="project-detail-header">
            <h1>{project.title}</h1>

            <div className="project-badges">
              <span>ประเภทโครงงาน : {project.project_type}</span>

              <span>
                รับนิสิต : {project.current_members} / {project.max_members} คน
              </span>

              <span>
                สถานะ :{" "}
                <strong className={`status-text ${project.status}`}>
                  {project.status}
                </strong>
              </span>
            </div>
          </div>

          {/* =========================
              PROJECT INFORMATION
          ========================= */}
          <section className="detail-section">
            <h3>ข้อมูลโครงงาน</h3>

            <div className="detail-info">
              <p>
                <strong>อาจารย์ที่ปรึกษา :</strong> {project.advisor_name}
              </p>

              <p>
                <strong>สาขาวิชา :</strong> {project.major}
              </p>

              <p>
                <strong>ปีการศึกษา :</strong> {project.academic_year}
              </p>

              <div className="project-members-info">
                <p>
                  <strong>
                    สมาชิกในโครงงาน ({project.current_members}/
                    {project.max_members}) :
                  </strong>
                </p>

                {project.members.length === 0 ? (
                  <p className="empty-member">ยังไม่มีนิสิตเข้าร่วมโครงงาน</p>
                ) : (
                  <div className="member-list">
                    {project.members.map((member) => (
                      <div className="member-item" key={member.id}>
                        {member.name}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </section>

          {/* =========================
              DESCRIPTION
          ========================= */}
          <section className="detail-section">
            <h3>รายละเอียดโครงงาน</h3>

            <p className="detail-text">{project.description || "-"}</p>
          </section>

          {/* =========================
              OBJECTIVES
          ========================= */}
          <section className="detail-section">
            <h3>วัตถุประสงค์</h3>

            <ul>
              {objectives.map((item, index) => (
                <li key={index}>{item}</li>
              ))}
            </ul>
          </section>

          {/* =========================
              SKILLS
          ========================= */}
          <section className="detail-section">
            <h3>เทคโนโลยีที่ใช้</h3>

            <div className="tag-list">
              {(project.skills || "").split("|").map((skill, index) => {
                const style = skillStyles[skill] || {
                  backgroundColor: "#F3F4F6",
                  borderColor: "#D1D5DB",
                };

                return (
                  <span
                    key={index}
                    style={{
                      backgroundColor: style.backgroundColor,
                      border: `1px solid ${style.borderColor}`,
                    }}
                  >
                    {skill}
                  </span>
                );
              })}
            </div>
          </section>

          {/* =========================
              REQUIREMENTS
          ========================= */}
          <section className="detail-section">
            <h3>คุณสมบัติผู้สมัคร</h3>

            <ul>
              {requirements.map((item, index) => (
                <li key={index}>{item}</li>
              ))}
            </ul>
          </section>

          {/* =========================
              VISIBILITY
          ========================= */}
          <section className="detail-section">
            <h3>การแสดงผล</h3>

            <p>
              สถานะการแสดงผล : <strong>{project.visibility}</strong>
            </p>
          </section>

          {/* =========================
              ACTIONS
          ========================= */}
          <div className="detail-actions">
            <button
              className="back-btn"
              onClick={() => navigate("/teacher-projects")}
            >
              กลับ
            </button>

            <button
              className="edit-btn"
              onClick={() => navigate(`/teacher-project-edit/${project.id}`)}
            >
              แก้ไข
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}

export default TeacherProjectDetail;
