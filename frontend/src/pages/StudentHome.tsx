import "./StudentHome.css";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react"; //ใช้ตรวจสอบการเข้าสู่ระบบ
import { FaBell } from "react-icons/fa";

import logo from "../assets/Logo.svg";

function StudentHome() {
  const navigate = useNavigate();

  const username = localStorage.getItem("username"); //ดึงค่ารหัสประจำตัวจาก localStorage
  const profileImage = localStorage.getItem("profileImage");

  const [showNotifications, setShowNotifications] = useState(false);

  const projects = [
  {
    id: 1,
    title: "ระบบติดตามโครงงานนิสิต",
    advisor: "ผศ.ดร.สมชาย",
    major: "IT",
    status: "เปิดรับ",
  },
  {
    id: 2,
    title: "ระบบจัดการห้องสมุด",
    advisor: "ผศ.ดร.กิตติ",
    major: "CS",
    status: "ใกล้เต็ม",
  },
  {
    id: 3,
    title: "ระบบจองห้องประชุม",
    advisor: "ผศ.ดร.อนันต์",
    major: "IT",
    status: "เปิดรับ",
  },
  {
    id: 4,
    title: "ระบบจัดการร้านกาแฟ",
    advisor: "ผศ.ดร.สุชาติ",
    major: "CS",
    status: "เต็ม",
  },
  {
    id: 5,
    title: "ระบบติดตามการเข้าเรียน",
    advisor: "ผศ.ดร.สมชาย",
    major: "IT",
    status: "เปิดรับ",
  },
  {
    id: 6,
    title: "ระบบคลังสินค้า",
    advisor: "ผศ.ดร.กิตติ",
    major: "CS",
    status: "ใกล้เต็ม",
  },
  {
    id: 7,
    title: "ระบบร้านหนังสือออนไลน์",
    advisor: "ผศ.ดร.อนันต์",
    major: "IT",
    status: "เปิดรับ",
  },
  {
    id: 8,
    title: "ระบบจัดการโรงแรม",
    advisor: "ผศ.ดร.สุชาติ",
    major: "CS",
    status: "เต็ม",
  }
];

const [searchTerm, setSearchTerm] = useState("");

const filteredProjects = projects.filter(
  (project) =>
    project.title
      .toLowerCase()
      .includes(searchTerm.toLowerCase()) ||
    project.advisor
      .toLowerCase()
      .includes(searchTerm.toLowerCase())
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
    if (!username) {
      //ถ้าไม่มีรหัสประจำตัวให้เปลี่ยนหน้าไปยังหน้าเข้าสู่ระบบ
      navigate("/");
    }
  }, [username, navigate]); //ตรวจสอบค่ารหัสประจำตัวและฟังก์ชัน navigate

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

        <div className="menu-area">
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
        </div>

        <button className="logout-btn" onClick={handleLogout}>
          ออกจากระบบ
        </button>
      </aside>

      {/* Main */}
      <main className="main">
        {/* Header */}
        <header className="header">
          <h2>หน้าหลัก</h2>

          <div className="user-info">

  <div className="notification-wrapper">

    <button
      className="notification-btn"
      onClick={() =>
        setShowNotifications(!showNotifications)
      }
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
          <div
            key={item.id}
            className="notification-item"
          >
            <p>{item.message}</p>
            <small>{item.time}</small>
          </div>
        ))}

      </div>
    )}

  </div>
<img
  src={`http://localhost:5000${profileImage}`}
  alt="Profile"
  className="profile-image"
/>
  <span>{username}</span>

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
  {filteredProjects.map((project) => (
    <tr key={project.id}>
      <td>{project.title}</td>
      <td>{project.advisor}</td>
      <td>{project.major}</td>
      <td>{project.status}</td>
      <td>
        <button>ดูรายละเอียด</button>
      </td>
    </tr>
  ))}
</tbody>
          </table>
        </div>
      </main>
    </div>
  );
}

export default StudentHome;
