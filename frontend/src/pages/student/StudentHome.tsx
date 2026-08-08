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

interface Notification {
  id: number;
  project_id: number;

  sender_id: number;
  sender_username: string;
  sender_name: string;

  receiver_id: number;
  receiver_username: string;
  receiver_name: string;

  title: string;
  project_type: string;

  description: string;
  objectives: string;
  skills: string;
  requirements: string;

  contact_type: string;
  contact_value: string;
  introduction: string;

  status: string;
  created_at: string;
}


function formatThaiDate(dateString: string) {
  // ดึงตัวเลขวันที่ออกมาโดยไม่ให้ Browser เดา timezone เอง
  const match = dateString.match(
    /(\d{4})[-/](\d{1,2})[-/](\d{1,2}).*?(\d{1,2}):(\d{2})(?::(\d{2}))?/
  );

  if (!match) {
    return dateString;
  }

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const hour = Number(match[4]);
  const minute = Number(match[5]);
  const second = Number(match[6] || 0);

  // ถือว่าค่าจาก Database เป็น UTC แล้วแปลงเป็นเวลาไทย
  const date = new Date(
    Date.UTC(year, month - 1, day, hour, minute, second)
  );

  const thaiDate = new Intl.DateTimeFormat("th-TH-u-ca-buddhist", {
    timeZone: "Asia/Bangkok",
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);

  const thaiTime = new Intl.DateTimeFormat("th-TH", {
    timeZone: "Asia/Bangkok",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(date);

  return `วันที่ ${thaiDate} เวลา ${thaiTime} น.`;
}

function StudentHome() {
  const navigate = useNavigate();

  const userId = localStorage.getItem("userId");
  const username = localStorage.getItem("username"); //ดึงค่ารหัสประจำตัวจาก localStorage
  const profileImage = localStorage.getItem("profileImage");

  const [showNotifications, setShowNotifications] = useState(false);
  const [selectedInvitation, setSelectedInvitation] =
    useState<Notification | null>(null);

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

  const [notifications, setNotifications] = useState<Notification[]>([]);
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

  useEffect(() => {
    axios
      .get(`http://localhost:5000/project-invitations/${userId}`)
      .then((res) => {
        setNotifications(res.data);
      });
  }, []);


  const handleAcceptInvitation = async () => {
  if (!selectedInvitation) {
    return;
  }

  try {
    const res = await axios.post(
      `http://localhost:5000/project-invitations/${selectedInvitation.id}/accept`
    );

    alert(res.data.message);

    // เอาคำเชิญที่ตอบรับแล้วออกจากรายการแจ้งเตือน
    setNotifications((prev) =>
      prev.filter((item) => item.id !== selectedInvitation.id)
    );

    // ปิด Popup
    setSelectedInvitation(null);

    // ปิด dropdown แจ้งเตือน
    setShowNotifications(false);

  } catch (err: any) {
    console.log("Accept invitation error:", err);
    console.log(err.response?.data);

    alert(
      err.response?.data?.message ||
        "ไม่สามารถตอบรับคำเชิญได้"
    );
  }
};


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
            <li onClick={() => navigate("/submit-new-project")}>
              ส่งคำเสนอโครงงานใหม่
            </li>
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
                      <div
                        key={item.id}
                        className="notification-item"
                        onClick={() => setSelectedInvitation(item)}
                      >
                        <p>{item.sender_name} ได้เชิญคุณเข้าร่วมโครงงาน</p>
                        <small>{formatThaiDate(item.created_at)}</small>
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
            {/* Table */}
    <div className="table-container">
      {/* ของเดิมทั้งหมดของคุณ */}
    </div>

    {/* Invitation Popup */}
    {selectedInvitation && (
      <div className="invitation-overlay">
        <div className="invitation-popup">

          <h3>คำเชิญเข้าร่วมโครงงาน</h3>

          <div className="invitation-divider"></div>

          <div className="invitation-detail">
            <p>
              <strong>ชื่อหัวข้อโครงงาน</strong>
            </p>

            <p>{selectedInvitation.title}</p>
          </div>

          <div className="invitation-detail">
            <p>
              <strong>สมาชิกคนที่ 1</strong>
            </p>

            <p>
              {selectedInvitation.sender_username}{" "}
              {selectedInvitation.sender_name}
            </p>
          </div>

          <div className="invitation-detail">
            <p>
              <strong>สมาชิกคนที่ 2</strong>
            </p>

            <p>
              {selectedInvitation.receiver_username}{" "}
              {selectedInvitation.receiver_name}
            </p>
          </div>

          <div className="invitation-divider"></div>

          <p className="invitation-question">
            คุณต้องการเข้าร่วมหรือไม่
          </p>

          <div className="invitation-actions">
            <button
              className="reject-btn"
              onClick={() => setSelectedInvitation(null)}
            >
              ปฏิเสธ
            </button>

            <button
              className="accept-btn"
              onClick={handleAcceptInvitation}
            >
              ตกลง
            </button>
          </div>

        </div>
      </div>
    )}
  </main>
    </div>
  );
}

export default StudentHome;
