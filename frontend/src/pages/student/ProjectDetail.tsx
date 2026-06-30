import "./StudentHome.css";
import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { FaBell } from "react-icons/fa";

import logo from "../../assets/Logo.svg";

interface Project {
  id: number;
  title: string;
  advisor: string;
  major: string;
  status: string;
}

function ProjectDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const username = localStorage.getItem("username");
  const profileImage = localStorage.getItem("profileImage");

  const [project, setProject] = useState<Project | null>(null);
  const [showNotifications, setShowNotifications] = useState(false);

  const notifications = [
    { id: 1, message: "อาจารย์ตอบรับหัวข้อของคุณแล้ว", time: "2 ชั่วโมงที่แล้ว" },
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
            <li className="active" onClick={() => navigate("/student-home")}>หน้าหลัก</li>
            <li>รายชื่ออาจารย์</li>
            <li>ส่งคำเสนอหัวข้อใหม่</li>
            <li>ข้อมูลส่วนตัว</li>
            <li>โครงงานของฉัน</li>
            <li>การแจ้งเตือน</li>
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
    <span onClick={() => navigate("/student-home")}>
      หน้าหลัก
    </span>

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
        <div className="table-container">
          <h3>รายละเอียดโครงงาน</h3>

          <table>
            <thead>
              <tr>
                <th>หัวข้อ</th>
                <th>อาจารย์ที่ปรึกษา</th>
                <th>สาขา</th>
                <th>สถานะ</th>
              </tr>
            </thead>

            <tbody>
              <tr>
                <td>{project.title}</td>
                <td>{project.advisor}</td>
                <td>{project.major}</td>
                <td>{project.status}</td>
              </tr>
            </tbody>
          </table>
        </div>

      </main>
    </div>
  );
}

export default ProjectDetail;