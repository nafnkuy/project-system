import "./TeacherHome.css";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react"; //ใช้ตรวจสอบการเข้าสู่ระบบ
import axios from "axios";
import { FaBell } from "react-icons/fa";

import logo from "../../assets/Logo.svg";

interface Request {
  id: number;
  title: string;
  student_name: string;
  request_date: string;
  status: string;
}

function TeacherHome() {
const navigate = useNavigate();

  const userId = localStorage.getItem("userId"); //ดึงค่ารหัสประจำตัวจาก localStorage
  const username = localStorage.getItem("username");
  const profileImage = localStorage.getItem("profileImage");

  const [showNotifications, setShowNotifications] = useState(false);

const [requests, setRequests] = useState<Request[]>([]);
const [searchTerm, setSearchTerm] = useState("");

const [currentPage, setCurrentPage] = useState(1);
const itemsPerPage = 10;

const filteredRequests = requests.filter(
  (item) =>
    item.student_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    //item.student_id.includes(searchTerm) ||
    item.title.toLowerCase().includes(searchTerm.toLowerCase())
);

//const totalPages = Math.ceil(filteredRequests.length / itemsPerPage);

const currentRequests = filteredRequests.slice(
  (currentPage - 1) * itemsPerPage,
  currentPage * itemsPerPage
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
    localStorage.removeItem("userId"); //ลบค่ารหัสประจำตัวจาก localStorage
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
            <li>โครงงานที่ฉันรับผิดชอบ</li>
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

        {/* Table */}
<div className="table-container">

<h3>คำขอเข้าร่วมโครงงาน</h3>

<table>

<thead>

<tr>

    <th>ชื่อนิสิต</th>
    <th>หัวข้อโครงงาน</th>
    <th>วันที่ส่งคำขอ</th>
    <th>สถานะ</th>
    <th>จัดการ</th>

</tr>

</thead>

<tbody>
  {currentRequests.map((item) => (
    <tr key={item.id}>
      <td>{item.student_name}</td>
      <td>{item.title}</td>
      <td>{item.request_date}</td>
      <td>{item.status}</td>
      <td>
        <button
          onClick={() => navigate(`/teacher/request/${item.id}`)}
        >
          ดูรายละเอียด
        </button>
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

export default TeacherHome;