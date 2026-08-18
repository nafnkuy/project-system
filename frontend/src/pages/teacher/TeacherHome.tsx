import "./TeacherHome.css";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react"; //ใช้ตรวจสอบการเข้าสู่ระบบ
import axios from "axios";
import { FaBell, FaSearch } from "react-icons/fa";

import logo from "../../assets/Logo.svg";

interface Request {
  id: number;
  title: string;
  source: string;
  student_id: number;
  student_username: string;
  student_name: string;
  request_date: string;
  status: string;
}

interface Dashboard {
  totalProjects: number;
  pendingRequests: number;
  acceptedStudents: number;
  totalCapacity: number;
  status: string;
}

function TeacherHome() {
  const navigate = useNavigate();

  const userId = sessionStorage.getItem("userId"); //ดึงค่ารหัสประจำตัวจาก sessionStorage
  const username = sessionStorage.getItem("username");
  const profileImage = sessionStorage.getItem("profileImage");

  const [showNotifications, setShowNotifications] = useState(false);

  const [requests, setRequests] = useState<Request[]>([]);
  const [dashboard, setDashboard] = useState<Dashboard>({
    totalProjects: 0,
    pendingRequests: 0,
    acceptedStudents: 0,
    totalCapacity: 0,
    status: "เปิดรับ",
  });
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("ทั้งหมด");
  const [typeFilter, setTypeFilter] = useState("ทั้งหมด");

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const filteredRequests = requests.filter((item) => {
  const matchesSearch =
    item.student_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.title.toLowerCase().includes(searchTerm.toLowerCase());

  const matchesStatus =
    statusFilter === "ทั้งหมด" || item.status === statusFilter;

  const requestType =
    item.source === "student" ? "เสนอหัวข้อโครงงาน" : "สมัครเข้าร่วม";

  const matchesType =
    typeFilter === "ทั้งหมด" || requestType === typeFilter;

  return matchesSearch && matchesStatus && matchesType;
});

  //const totalPages = Math.ceil(filteredRequests.length / itemsPerPage);

  const currentRequests = filteredRequests.slice(
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
    if (!userId) {
      //ถ้าไม่มีรหัสประจำตัวให้เปลี่ยนหน้าไปยังหน้าเข้าสู่ระบบ
      navigate("/");
    }
  }, [userId, navigate]); //ตรวจสอบค่ารหัสประจำตัวและฟังก์ชัน navigate

  useEffect(() => {
    console.log("Teacher ID =", userId);

    axios
      .get(`http://localhost:5000/teacher/requests/${userId}`)
      .then((res) => {
        console.log("API Response =", res.data); // เพิ่มบรรทัดนี้
        setRequests(res.data);
      })
      .catch((err) => console.log(err));
  }, []);

  useEffect(() => {
    //รีเซ็ตหน้าปัจจุบันเมื่อมีการค้นหา
    setCurrentPage(1);
  }, [searchTerm]);

  const handleLogout = () => {
    sessionStorage.removeItem("userId"); //ลบค่ารหัสประจำตัวจาก sessionStorage
    sessionStorage.removeItem("username"); //ลบค่ารหัสประจำตัวจาก sessionStorage
    sessionStorage.removeItem("name"); //ลบค่าชื่อผู้ใช้จาก sessionStorage
    sessionStorage.removeItem("profileImage"); //ลบค่ารูปโปรไฟล์จาก sessionStorage
    navigate("/"); //เปลี่ยนหน้าไปยังหน้าเข้าสู่ระบบ
  };

  useEffect(() => {
    if (!userId) return;

    axios
      .get(`http://localhost:5000/teacher/dashboard/${userId}`)
      .then((res) => {
        console.log("Dashboard =", res.data);
        setDashboard(res.data);
      })
      .catch((err) => {
        console.log("Dashboard error =", err);
      });
  }, [userId]);

  /*const name =
    sessionStorage.getItem("name");*/

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
            <li onClick={() => navigate("/teacher-projects")}>
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

        {/* Dashboard */}
        <div className="dashboard-content">
          {/* Search */}
          <div className="search-section">
  <div className="search-box">
    <input
      type="text"
      placeholder="ค้นหาชื่อนิสิต หรือหัวข้อโครงงาน"
      value={searchTerm}
      onChange={(e) => setSearchTerm(e.target.value)}
    />

    <FaSearch className="search-icon" />
  </div>

  {/* ตัวกรองสถานะ */}
<div className="select-wrapper">
  <span className="select-label">
    {statusFilter === "ทั้งหมด" ? "สถานะทั้งหมด" : statusFilter}
  </span>

  <select
    value={statusFilter}
    onChange={(e) => setStatusFilter(e.target.value)}
    className="status-filter"
  >
    <option value="ทั้งหมด">สถานะทั้งหมด</option>
    <option value="รอพิจารณา">รอพิจารณา</option>
    <option value="อนุมัติ">อนุมัติ</option>
    <option value="ปฏิเสธ">ปฏิเสธ</option>
  </select>

  <span className="select-arrow">▼</span>
</div>

{/* ตัวกรองประเภท */}
<div className="select-wrapper type-select">
  <span className="select-label">
    {typeFilter === "ทั้งหมด" ? "ประเภททั้งหมด" : typeFilter}
  </span>

  <select
    value={typeFilter}
    onChange={(e) => setTypeFilter(e.target.value)}
    className="status-filter"
  >
    <option value="ทั้งหมด">ประเภททั้งหมด</option>
    <option value="สมัครเข้าร่วม">สมัครเข้าร่วม</option>
    <option value="เสนอหัวข้อโครงงาน">เสนอหัวข้อโครงงาน</option>
  </select>

  <span className="select-arrow">▼</span>
</div>
</div>

          {/* Dashboard Cards */}
          <div className="dashboard-cards">
            <div className="dashboard-card">
              <div className="card-title">หัวข้อโครงงานของฉัน</div>

              <div className="card-number blue">{dashboard.totalProjects}</div>
            </div>

            <div className="dashboard-card">
              <div className="card-title">คำขอรอพิจารณา</div>

              <div className="card-number orange">
                {dashboard.pendingRequests}
              </div>
            </div>

            <div className="dashboard-card">
              <div className="card-title">รับนิสิตแล้ว</div>

              <div className="card-number green">
                {dashboard.acceptedStudents} / {dashboard.totalCapacity}
              </div>
            </div>

            <div className="dashboard-card">
              <div className="card-title">สถานะ</div>

              <div
                className={`card-status ${
                  dashboard.status === "เปิดรับ" ? "status-open" : "status-full"
                }`}
              >
                {dashboard.status}
              </div>
            </div>
          </div>

          {/* Request Table */}
          <div className="table-container">
            <h3>คำขอเข้าร่วมโครงงาน</h3>

            <table>
              <thead>
                <tr>
                  <th>ประเภท</th>
                  <th>รหัสประจำตัว</th>
                  <th>ชื่อนิสิต</th>
                  <th>ชื่อหัวข้อโครงงาน</th>
                  <th>วันที่</th>
                  <th>เวลา</th>
                  <th>สถานะ</th>
                  <th>จัดการ</th>
                </tr>
              </thead>

              <tbody>
                {currentRequests.length === 0 ? (
                  <tr>
                    <td
                      colSpan={8}
                      style={{
                        textAlign: "center",
                        padding: "30px",
                      }}
                    >
                      ไม่พบคำขอ
                    </td>
                  </tr>
                ) : (
                  currentRequests.map((item) => (
                    <tr key={item.id}>
                      <td>
                        {" "}
                        {item.source === "student"
                          ? "เสนอหัวข้อโครงงาน"
                          : "สมัครเข้าร่วม"}
                      </td>

                      <td>{item.student_username}</td>

                      <td>{item.student_name}</td>

                      <td>{item.title}</td>

                      <td>
                        {new Date(item.request_date).toLocaleDateString(
                          "th-TH",
                        )}
                      </td>

                      <td>
                        {new Date(item.request_date).toLocaleTimeString(
                          "th-TH",
                          {
                            hour: "2-digit",
                            minute: "2-digit",
                          },
                        )}{" "}
                        น.
                      </td>

                      <td>
                        <span
                          className={`request-status ${
                            item.status === "อนุมัติ"
                              ? "approved"
                              : item.status === "ปฏิเสธ"
                                ? "rejected"
                                : "pending"
                          }`}
                        >
                          {item.status}
                        </span>
                      </td>

                      <td>
                        <button
                          className="detail-btn"
                          onClick={() =>
                            navigate(`/teacher-request-details/${item.id}`)
                          }
                        >
                          รายละเอียด
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>

            <div className="view-all">
              <button onClick={() => navigate("/teacher/requests")}>
                ดูทั้งหมด →
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default TeacherHome;
