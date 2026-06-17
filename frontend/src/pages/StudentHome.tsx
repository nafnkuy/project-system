import "./StudentHome.css";
import { useNavigate } from "react-router-dom"; 
import { useEffect } from "react"; //ใช้ตรวจสอบการเข้าสู่ระบบ

function StudentHome() {

    const navigate = useNavigate();

    const username = localStorage.getItem("username"); //ดึงค่ารหัสประจำตัวจาก localStorage

    useEffect(() => { //ตรวจสอบว่าผู้ใช้เข้าสู่ระบบหรือไม่
      if (!username) { //ถ้าไม่มีรหัสประจำตัวให้เปลี่ยนหน้าไปยังหน้าเข้าสู่ระบบ
      navigate("/");
    }}, [username, navigate]); //ตรวจสอบค่ารหัสประจำตัวและฟังก์ชัน navigate

    const handleLogout = () => {

    localStorage.removeItem("username"); //ลบค่ารหัสประจำตัวจาก localStorage
    localStorage.removeItem("name"); //ลบค่าชื่อผู้ใช้จาก localStorage
    navigate("/"); //เปลี่ยนหน้าไปยังหน้าเข้าสู่ระบบ
    };


  /*const name =
    localStorage.getItem("name");*/

  return (
    <div className="layout">

      {/* Sidebar */}
      <aside className="sidebar">
        <div className="logo">
          <h2>SPTC System</h2>
          <p>ระบบติดตามและสื่อสารโครงงานนิสิต</p>
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

          <div className="user-info">
            🔔
            <span>{username}</span>
          </div>
        </header>

        {/* Search */}
        <div className="search-box">
          <input
            type="text"
            placeholder="ค้นหาโครงงาน/อาจารย์"
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
              <tr>
                <td>ระบบติดตามโครงงานนิสิต</td>
                <td>ผศ.ดร.สมชาย</td>
                <td>IT</td>
                <td>เปิดรับ</td>
                <td>
                  <button>ดูรายละเอียด</button>
                </td>
              </tr>

              <tr>
                <td>ระบบจัดการห้องสมุด</td>
                <td>ผศ.ดร.กิตติ</td>
                <td>CS</td>
                <td>ใกล้เต็ม</td>
                <td>
                  <button>ดูรายละเอียด</button>
                </td>
              </tr>
            </tbody>

          </table>
        </div>

      </main>

    </div>
  );
}

export default StudentHome;