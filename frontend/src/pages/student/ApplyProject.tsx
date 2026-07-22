import "./ApplyProject.css";
import { useNavigate } from "react-router-dom";
import { FaBell } from "react-icons/fa";
import { FaChevronDown } from "react-icons/fa";
import { useEffect, useState } from "react";
import axios from "axios";
import { useParams } from "react-router-dom";

import logo from "../../assets/Logo.svg";

interface Project {
  id: number;
  title: string;
  advisor: string;
  advisor_name: string;
  max_members: number;
  current_members: number;
}

function ApplyProject() {
  const navigate = useNavigate();

  const { id } = useParams(); //คือการดึงค่าพารามิเตอร์จาก URL โดยในที่นี้คือ id ของโครงงานที่ต้องการสมัครเข้าร่วม

  // <Project | null> หมายถึงค่าของ state project สามารถเป็นได้ทั้ง object ของ Project หรือ null ซึ่ง null จะใช้ในกรณีที่ยังไม่มีข้อมูลโครงงานถูกโหลดเข้ามา
  const [project, setProject] = useState<Project | null>(null);

  // State สำหรับการแสดงผลการแจ้งเตือน
  const [showNotifications, setShowNotifications] = useState(false);

  // State สำหรับเก็บค่าช่องทางการติดต่อและข้อมูลอื่น ๆ ของผู้สมัคร
  const [contactType, setContactType] = useState("");
  const [contactValue, setContactValue] = useState("");
  const [introduction, setIntroduction] = useState("");
  const [agree, setAgree] = useState(false);

  const [showPopup, setShowPopup] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const userId = localStorage.getItem("userId");
  const username = localStorage.getItem("username");
  const name = localStorage.getItem("name");
  const profileImage = localStorage.getItem("profileImage");

  const handleLogout = () => {
    localStorage.removeItem("username"); //ลบค่ารหัสประจำตัวจาก localStorage
    localStorage.removeItem("name"); //ลบค่าชื่อผู้ใช้จาก localStorage
    localStorage.removeItem("profileImage"); //ลบค่ารูปโปรไฟล์จาก localStorage
    navigate("/"); //เปลี่ยนหน้าไปยังหน้าเข้าสู่ระบบ
  };

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
    axios
      .get(`http://localhost:5000/projects/${id}`)
      .then((res) => {
        setProject(res.data);
      })
      .catch((err) => {
        console.log(err);
      });
  }, [id]);

  useEffect(() => {
  if (!project?.id || !userId) return;

  axios
    .get(
      `http://localhost:5000/project-requests/check/${project.id}/${userId}`
    )
    .then((res) => {
      setIsSubmitted(res.data.submitted);
    })
    .catch((err) => {
      console.log(err);
    });
}, [project, userId]);

useEffect(() => {
  if (!project?.id || !userId) return;

  axios
    .get(
      `http://localhost:5000/project-requests/${project.id}/${userId}`
    )
    .then((res) => {
      setContactType(res.data.contact_type);
      setContactValue(res.data.contact_value);
      setIntroduction(res.data.introduction || "");
      setAgree(true);
    })
    .catch(() => {});
}, [project, userId]);

  const handleSubmit = async () => {
    if (!contactType || !contactValue || !agree) {
      alert("กรุณากรอกข้อมูลให้ครบ");
      return;
    }

    try {
      setShowPopup(true);
      setIsSubmitting(true);

      await axios.post("http://localhost:5000/project-requests", {
        project_id: project?.id,
        student_id: Number(userId),
        contact_type: contactType,
        contact_value: contactValue,
        introduction,
      });

      setTimeout(() => {
        setIsSubmitting(false);
        setIsSubmitted(true);
      }, 5000);
    } catch (err) {
      console.log(err);
      alert("ส่งใบสมัครไม่สำเร็จ");
    }
  };

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
            <li className="active" onClick={() => navigate("/StudentHome")}>
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
        <header className="header">
          <div className="breadcrumb">
            <span onClick={() => navigate("/StudentHome")}>หน้าหลัก</span>

            <span> &gt; </span>

            <span onClick={() => navigate(-1)} style={{ cursor: "pointer" }}>
              รายละเอียด
            </span>

            <span> &gt; </span>

            <span>สมัครเข้าร่วมโครงงาน</span>
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
                alt="Profile"
              />

              <span>{username}</span>
            </div>
          </div>
        </header>

        {/* Card */}

        <div className="apply-card">
          <h2>สมัครเข้าร่วมโครงงาน</h2>

          <div className="section">
            <h3>ข้อมูลโครงงาน</h3>

            <p>
              <strong>ชื่อโครงงาน :</strong> {project?.title}
            </p>

            <p>
              <strong>อาจารย์ที่ปรึกษา :</strong> {project?.advisor_name}
            </p>

            <p>
              <strong>สมาชิกโครงงาน :</strong> {project?.current_members}/
              {project?.max_members}
            </p>
          </div>
          <div className="apply-row">
            {/* ผู้สมัคร */}
            <div className="section">
              <h3>ข้อมูลผู้สมัคร</h3>

              <label>รหัสประจำตัว</label>

              <input value={username || ""} disabled />

              <label>ชื่อ</label>

              <input value={name || ""} disabled />
            </div>

            {/* ช่องทางการติดต่อ */}
            <div className="section">
              <h3>
                ช่องทางการติดต่อ
                <span style={{ color: "red" }}> *</span>
              </h3>

              <div className="select-wrapper">
                <select
                  value={contactType}
                  onChange={(e) => setContactType(e.target.value)}
                >
                  <option value="">เลือกช่องทางการติดต่อ</option>
                  <option>Email</option>
                  <option>Line ID</option>
                  <option>Facebook</option>
                  <option>Instagram</option>
                  <option>Discord</option>
                  <option>โทรศัพท์</option>
                </select>

                <FaChevronDown className="select-arrow" />
              </div>

              {contactType !== "" && (
                <>
                  <label>{contactType}</label>

                  <input
                    value={contactValue}
                    onChange={(e) => setContactValue(e.target.value)}
                    placeholder={`กรอก ${contactType}`}
                  />
                </>
              )}
            </div>
          </div>
          <div className="section">
            <h3>แนะนำตัว (ไม่บังคับ)</h3>

            <textarea
              value={introduction}
              onChange={(e) => setIntroduction(e.target.value)}
            />
          </div>

          <div className="agree-box">
            <input
              type="checkbox"
              checked={agree}
              onChange={(e) => setAgree(e.target.checked)}
            />

            <label>
              ยินยอมให้อาจารย์เจ้าของโครงงานติดต่อผ่านข้อมูลที่ระบุไว้
            </label>
          </div>

          <div className="button-group">

  {isSubmitted ? (

    <button className="submit-btn" disabled>
      ✓ ส่งใบสมัครแล้ว
    </button>

  ) : (

    <>
      <button
        className="cancel-btn"
        onClick={() => navigate(-1)}
      >
        ยกเลิก
      </button>

      <button
        className="submit-btn"
        onClick={handleSubmit}
      >
        ส่งคำขอเข้าร่วมโครงงาน
      </button>
    </>

  )}

</div>
        </div>
      </main>
      {showPopup && (
        <div className="popup-overlay">
          <div className="popup-card">
            {isSubmitting ? (
              <>
                <div className="loader"></div>
                <h3>กำลังส่งใบสมัคร...</h3>
                <p>กรุณารอสักครู่</p>
              </>
            ) : (
              <>
                <h3>ส่งใบสมัครสำเร็จ</h3>

                <p>
                  ใบสมัครของคุณถูกส่งไปยังอาจารย์แล้ว
                  <br />
                  กรุณารอการพิจารณา
                </p>

                <button
                  onClick={() => setShowPopup(false)}
                  className="submit-btn"
                >
                  ตกลง
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default ApplyProject;
