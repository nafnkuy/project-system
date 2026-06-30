import "./StudentHome.css";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react"; //ใช้ตรวจสอบการเข้าสู่ระบบ
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

function StudentHome() {
  const navigate = useNavigate();

  const username = localStorage.getItem("username"); //ดึงค่ารหัสประจำตัวจาก localStorage
  const profileImage = localStorage.getItem("profileImage");

  const [showNotifications, setShowNotifications] = useState(false);

  const [projects, setProjects] = useState<Project[]>([]);

  const [searchTerm, setSearchTerm] = useState("");

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const filteredProjects = projects.filter(
    (project) =>
      project.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      project.advisor.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const totalPages = Math.ceil(filteredProjects.length / itemsPerPage);

  const currentProjects = filteredProjects.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage,
  );

  const notifications = [
    {
      id: 1,
      message: "อาจารย์ตอบรับหัวข้อของคุณแล้ว",
      time: "2 ชั่วโมงที่แล้ว",
    },
    {
      id: 2,
      message: "ส่งคำขอเลือกหัวข้อสำเร็จ",
      time: "1 วันที่แล้ว",
    },
  ];

  useEffect(() => {
    //ตรวจสอบว่าผู้ใช้เข้าสู่ระบบหรือไม่
    //ตรวจสอบว่าผู้ใช้เข้าสู่ระบบหรือไม่
    if (!username) {
      //ถ้าไม่มีรหัสประจำตัวให้เปลี่ยนหน้าไปยังหน้าเข้าสู่ระบบ
      navigate("/");
    }
  }, [username, navigate]); //ตรวจสอบค่ารหัสประจำตัวและฟังก์ชัน navigate

  useEffect(() => {
    //ดึงข้อมูลโครงงานจาก backend
    axios
      .get("http://localhost:5000/projects")
      .then((res) => {
        setProjects(res.data);
      })
      .catch((err) => {
        console.log(err);
      });
  }, []);

  useEffect(() => {
    //รีเซ็ตหน้าปัจจุบันเมื่อมีการค้นหา
    setCurrentPage(1);
  }, [searchTerm]);

  const handleLogout = () => {
    localStorage.removeItem("username"); //ลบค่ารหัสประจำตัวจาก localStorage
    localStorage.removeItem("name"); //ลบค่าชื่อผู้ใช้จาก localStorage
    localStorage.removeItem("profileImage"); //ลบค่ารูปโปรไฟล์จาก localStorage
    navigate("/"); //เปลี่ยนหน้าไปยังหน้าเข้าสู่ระบบ
  };

  /*const name =
    localStorage.getItem("name");*/

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
            <li className="active">หน้าหลัก</li>
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
          <h2>หน้าหลัก</h2>

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
                alt="Profile"
                className="profile-image"
              />
              <span>{username}</span>
            </div>
          </div>
        </header>

        {/* Search */}
        <div className="search-box">
          <input
            type="text"
            placeholder="ค้นหาโครงงาน/อาจารย์"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* Table */}
        <div className="table-container">
          <h3>รายการหัวข้อโครงงาน</h3>

          <table>
            <thead>
              <tr>
                <th>ชื่อหัวข้อ</th>
                <th>อาจารย์ที่ปรึกษา</th>
                <th>สาขาวิชา</th>
                <th>สถานะ</th>
                <th>รายละเอียด</th>
              </tr>
            </thead>

            <tbody>
              {currentProjects.map((project) => (
                <tr key={project.id}>
                  <td>{project.title}</td>
                  <td>{project.advisor}</td>
                  <td>{project.major}</td>
                  <td>{project.status}</td>
                  <td>
                    <button
                      onClick={() => navigate(`/project-details/${project.id}`)}
                    >
                      ดูรายละเอียด
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="pagination">
            <button
              onClick={() => setCurrentPage(currentPage - 1)}
              disabled={currentPage === 1}
            >
              &lt;
            </button>

            <span>
              {currentPage} of {totalPages}
            </span>

            <button
              onClick={() => setCurrentPage(currentPage + 1)}
              disabled={currentPage === totalPages}
            >
              &gt;
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}

export default StudentHome;
