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

  if (!project) {
    return <h2 style={{ padding: 20 }}>กำลังโหลด...</h2>;
  }

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
                  {notifications.map((n) => (
                    <div key={n.id} className="notification-item">
                      <p>{n.message}</p>
                      <small>{n.time}</small>
                    </div>
                  ))}
                </div>
              )}
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
                รับนิสิต : {project.current_members} / {project.max_members} คน
              </span>
              <span>สถานะ : {project.status}</span>
            </div>
          </div>

          <section>
            <h4>ข้อมูลโครงงาน</h4>

            <p>อาจารย์ที่ปรึกษา : {project.advisor_name}</p>
            <p>สาขาวิชา : {project.major}</p>
            <p>ปีการศึกษา : {project.academic_year}</p>

            <br />

            <strong>สมาชิกในโครงงาน (1/2)</strong>
            <p>66160001 นายทดสอบ ระบบ</p>
          </section>

          <section>
            <h4>รายละเอียดโครงงาน</h4>

            <p>{project.description}</p>
          </section>

          <section>
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

          <section>
            <h4>ทักษะที่เกี่ยวข้อง</h4>

            <div className="skill-tags">
              {(project.skills || "")
                .split("|")
                .map(
                  (skill, index) => skill && <span key={index}>{skill}</span>,
                )}
            </div>
          </section>

          <section>
            <h4>คุณสมบัติผู้สมัคร</h4>

            <ul className="requirement-list">
              {(project.requirements || "")
                .split("|")
                .map((req, index) => req && <li key={index}>{req}</li>)}
            </ul>
          </section>

          <section>
            <h4>เอกสารที่เกี่ยวข้อง</h4>

            <div className="file-box">📄 Project Proposal.pdf</div>

            <div className="file-box">📄 Requirement Specification.pdf</div>
          </section>

          <div className="apply-section">
            <button className="apply-btn">สมัครเข้าร่วมโครงงาน</button>
          </div>
        </div>
      </main>
    </div>
  );
}

export default ProjectDetail;
