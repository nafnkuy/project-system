import "./ApplyProject.css";
import { useNavigate } from "react-router-dom";
import { FaBell } from "react-icons/fa";

import logo from "../../assets/Logo.svg";

function ApplyProject() {
  const navigate = useNavigate();

  const username = localStorage.getItem("username");
  const profileImage = localStorage.getItem("profileImage");

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

            <li
              className="active"
              onClick={() => navigate("/StudentHome")}
            >
              หน้าหลัก
            </li>

            <li>รายชื่ออาจารย์</li>

            <li>ส่งคำเสนอหัวข้อใหม่</li>

            <li>โครงงานของฉัน</li>

            <li>การแจ้งเตือน</li>

            <li>ข้อมูลส่วนตัว</li>

          </ul>

        </nav>

        <button className="logout-btn">
          ออกจากระบบ
        </button>

      </aside>

      {/* Main */}

      <main className="main">

        <header className="header">

          <div className="breadcrumb">

            <span onClick={() => navigate("/StudentHome")}>
              หน้าหลัก
            </span>

            <span> &gt; </span>

            <span
              onClick={() => navigate(-1)}
              style={{ cursor: "pointer" }}
            >
              รายละเอียด
            </span>

            <span> &gt; </span>

            <span>สมัครเข้าร่วมโครงงาน</span>

          </div>

          <div className="header-right">

            <button className="notification-btn">
              <FaBell />
              <span className="notification-count">
                {notifications.length}
              </span>
            </button>

            <div className="user-info">

              <img
                src={`http://localhost:5000${profileImage}`}
                className="profile-image"
              />

              <span>{username}</span>

            </div>

          </div>

        </header>

        {/* Card */}

        <div className="apply-card">

          <h2>สมัครเข้าร่วมโครงงาน</h2>

        </div>

      </main>

    </div>
  );
}

export default ApplyProject;