import "./ProjectDetail.css";
import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { FaBell } from "react-icons/fa";

import logo from "../../assets/Logo.svg";

interface Project {
  id: number;
  title: string;
  advisor: string;
  advisor_name: string;
  major: string;
  status: string;
  project_type: string;
  max_members: number;
  current_members: number;
  academic_year: number;
  description: string;
  objectives: string;
  skills: string;
  requirements: string;
  members: Member[];
}

interface Member {
  id: number;
  username: string;
  name: string;
}

function ProjectDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const username = localStorage.getItem("username");
  const profileImage = localStorage.getItem("profileImage");

  const [project, setProject] = useState<Project | null>(null);
  const [showNotifications, setShowNotifications] = useState(false);

  const notifications = [
    {
      id: 1,
      message: "อาจารย์ตอบรับหัวข้อของคุณแล้ว",
      time: "2 ชั่วโมงที่แล้ว",
    },
    { id: 2, message: "ส่งคำขอเลือกหัวข้อสำเร็จ", time: "1 วันที่แล้ว" },
  ];

  useEffect(() => {
    if (!username) navigate("/");
  }, [username, navigate]);

  useEffect(() => {
    axios
      .get(`http://localhost:5000/projects/${id}`)
      .then((res) => setProject(res.data))
      .catch((err) => console.log(err));
  }, [id]);

  const handleLogout = () => {
    localStorage.removeItem("username"); //ลบค่ารหัสประจำตัวจาก localStorage
    localStorage.removeItem("name"); //ลบค่าชื่อผู้ใช้จาก localStorage
    localStorage.removeItem("profileImage"); //ลบค่ารูปโปรไฟล์จาก localStorage
    navigate("/"); //เปลี่ยนหน้าไปยังหน้าเข้าสู่ระบบ
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

  const currentMembers = project.current_members ?? 0;

  const maxMembers =
    project.max_members ?? (project.project_type === "โครงงานคู่" ? 2 : 1);

  return (
    <div className="layout">
      {/* Sidebar */}
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
            <li className="active" onClick={() => navigate("/student-home")}>
              หน้าหลัก
            </li>
            <li>รายชื่ออาจารย์</li>
            <li>ส่งคำเสนอหัวข้อใหม่</li>
            <li>โครงงานของฉัน</li>
            <li>การแจ้งเตือน</li>
            <li>ข้อมูลส่วนตัว</li>
          </ul>
        </nav>

        <button className="logout-btn" onClick={handleLogout}>
          ออกจากระบบ
        </button>
      </aside>

      {/* Main */}
      <main className="main">
        {/* Header */}
        <header className="header">
          <div className="breadcrumb">
            <span onClick={() => navigate("/StudentHome")}>หน้าหลัก</span>

            <span> &gt; </span>

            <span>รายละเอียด</span>
          </div>

          <div className="header-right">
            <div className="notification-box">
              <div className="notification-wrapper">
                <button
                  className="notification-btn"
                  onClick={() => setShowNotifications(!showNotifications)}
                >
                  <FaBell />

                  <span className="notification-count">
                    {notifications.length}
                  </span>
                </button>

                {showNotifications && (
                  <div className="notification-dropdown">
                    <h4>การแจ้งเตือน</h4>

                    {notifications.map((item) => (
                      <div key={item.id} className="notification-item">
                        <p>{item.message}</p>
                        <small>{item.time}</small>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="user-info">
              <img
                src={`http://localhost:5000${profileImage}`}
                className="profile-image"
              />
              <span>{username}</span>
            </div>
          </div>
        </header>

        {/* TABLE DETAIL (สำคัญ) */}
        <div className="project-detail-card">
          <div className="project-top">
            <h2>{project.title}</h2>

            <div className="project-badges">
              <span>ประเภท : {project.project_type}</span>

              <span>
                รับนิสิต : {currentMembers} / {maxMembers} คน
              </span>

              <span>
                สถานะ :
                <b className={`status ${project.status}`}>{project.status}</b>
              </span>
            </div>
          </div>

          <section className="detail-section">
            <h4>ข้อมูลโครงงาน</h4>

            <div className="project-meta">
              <strong>อาจารย์ที่ปรึกษา :</strong>
              <span>{project.advisor_name}</span>

              <strong>สาขาวิชา :</strong>
              <span>{project.major}</span>

              <strong>ปีการศึกษา :</strong>
              <span>{project.academic_year}</span>
            </div>

            <br />

            <strong>
              สมาชิกในโครงงาน ({currentMembers}/{maxMembers} คน)
            </strong>

            <div className="member-list">
              {project.members.length > 0 ? (
                project.members.map((member) => (
                  <p key={member.id}>
                    {member.username} {member.name}
                  </p>
                ))
              ) : (
                <p>ยังไม่มีสมาชิก</p>
              )}
            </div>
          </section>

          <section className="detail-section">
            <h4>รายละเอียดโครงงาน</h4>

            <p>{project.description}</p>
          </section>

          <section className="detail-section">
            <h4>วัตถุประสงค์</h4>

            <ul>
              {(project.objectives || "")
                .split("|")
                .map(
                  (objective, index) =>
                    objective && <li key={index}>{objective}</li>,
                )}
            </ul>
          </section>

          <section className="detail-section">
            <h4>ทักษะที่เกี่ยวข้อง</h4>

            <div className="skill-tags">
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

          <section className="detail-section">
            <h4>คุณสมบัติผู้สมัคร</h4>

            <ul className="requirement-list">
              {(project.requirements || "")
                .split("|")
                .map((req, index) => req && <li key={index}>{req}</li>)}
            </ul>
          </section>

          <section className="detail-section">
            <h4>เอกสารที่เกี่ยวข้อง</h4>

            <div className="file-box">📄 Project Proposal.pdf</div>
            <br />
            <div className="file-box">📄 Requirement Specification.pdf</div>
          </section>

          <div className="apply-section">
            <button
              className="apply-btn"
              onClick={() => navigate(`/apply-project/${project.id}`)}
            >
              สมัครเข้าร่วมโครงงาน
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}

export default ProjectDetail;
