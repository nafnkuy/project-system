import "./SubmitNewProject.css";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import axios from "axios";
import { FaBell, FaSearch } from "react-icons/fa";

import logo from "../../assets/Logo.svg";

function SubmitNewProject() {
  const navigate = useNavigate();

  const username = localStorage.getItem("username"); //ดึงค่ารหัสประจำตัวจาก localStorage
  const userId = localStorage.getItem("userId");
  const profileImage = localStorage.getItem("profileImage");

  const [showNotifications, setShowNotifications] = useState(false);

  const [projectTitle, setProjectTitle] = useState("");
  const [projectType, setProjectType] = useState("เดี่ยว");
  const [memberId, setMemberId] = useState("");
  const [memberName, setMemberName] = useState("");

  const [teacherKeyword, setTeacherKeyword] = useState("");
  const [teacherList, setTeacherList] = useState<any[]>([]);
  const [advisorId, setAdvisorId] = useState<number | null>(null);
  const [advisorName, setAdvisorName] = useState("");


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

    if (teacherKeyword.trim() === "") {
        setTeacherList([]);
        return;
    }

    // ถ้าชื่อในช่อง = ชื่อที่เลือกแล้ว
    // ไม่ต้องค้นหาอีก
    if (teacherKeyword === advisorName) {
        setTeacherList([]);
        return;
    }

    axios
        .get("http://localhost:5000/teachers/search", {
            params: {
                name: teacherKeyword,
            },
        })
        .then((res) => {
            setTeacherList(res.data);
        })
        .catch(() => {
            setTeacherList([]);
        });

}, [teacherKeyword, advisorName]);

  const handleLogout = () => {
    localStorage.removeItem("username"); //ลบค่ารหัสประจำตัวจาก localStorage
    localStorage.removeItem("name"); //ลบค่าชื่อผู้ใช้จาก localStorage
    localStorage.removeItem("profileImage"); //ลบค่ารูปโปรไฟล์จาก localStorage
    navigate("/"); //เปลี่ยนหน้าไปยังหน้าเข้าสู่ระบบ
  };

  const name = localStorage.getItem("name");
  const [description, setDescription] = useState("");
  const [objective, setObjective] = useState("");

  const [skills, setSkills] = useState("");


  const searchStudent = async () => {
    if (!memberId.trim()) {
      alert("กรุณากรอกรหัสนิสิต");
      return;
    }

    try {
      const res = await axios.get(
        `http://localhost:5000/users/student/${memberId}`,
      );

      setMemberName(res.data.name);
      setMemberId(res.data.username);
    } catch (err) {
      alert("ไม่พบนิสิต");
      setMemberName("");
    }
  };

  const sendInvitation = async () => {

  try {

    await axios.post(
      "http://localhost:5000/project-invitations",
      {

        project_id: null,
        sender_id: userId,
        receiver_id: memberId

      }
    );

    alert("ส่งคำเชิญแล้ว");

  } catch (err: any) {
  console.log(err);
  console.log(err.response?.data);

  alert(err.response?.data?.message || "ส่งไม่สำเร็จ");

  }

};

  const handleSubmit = async () => {
    try {
      await axios.post("http://localhost:5000/projects", {
        title: projectTitle,
        advisor_id: advisorId,
        project_type: projectType,
        description,
        objectives: objective,
      });

      alert("ส่งข้อเสนอสำเร็จ");
      navigate("/StudentHome");
    } catch (err) {
      console.log(err);
      alert("ส่งข้อเสนอไม่สำเร็จ");
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
            <li onClick={() => navigate("/StudentHome")}>หน้าหลัก</li>
            <li>รายชื่ออาจารย์</li>
            <li
              className="active"
              onClick={() => navigate("/submit-new-project")}
            >
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

        <div className="proposal-card">
          <h3>ส่งคำเสนอโครงงานใหม่</h3>

          <div className="form-group">
            <label>ชื่อหัวข้อโครงงาน</label>

            <input
              value={projectTitle}
              onChange={(e) => setProjectTitle(e.target.value)}
            />

            <label>ประเภทโครงงาน</label>
          </div>

          <div className="radio-group">
            <label>
              <input
                type="radio"
                checked={projectType === "เดี่ยว"}
                onChange={() => setProjectType("เดี่ยว")}
              />
              โครงงานเดี่ยว
            </label>

            <label>
              <input
                type="radio"
                checked={projectType === "คู่"}
                onChange={() => setProjectType("คู่")}
              />
              โครงงานคู่
            </label>
          </div>

          <h4>สมาชิกโครงงาน</h4>
          <div className="member-card">
            <h5>สมาชิกคนที่ 1</h5>

            <div className="form-group">
              <label>รหัสประจำตัว</label>

              <input value={username || ""} disabled />
            </div>

            <div className="form-group">
              <label>ชื่อ</label>

              <input value={name || ""} disabled />
            </div>
          </div>

          {projectType === "คู่" && (
            <div className="member-card">
              <h5>สมาชิกคนที่ 2</h5>

              <label>รหัสประจำตัว</label>

              <div className="search-box">
                <input
                  value={memberId}
                  onChange={(e) => setMemberId(e.target.value)}
                />

                <button type="button" onClick={searchStudent}>
                  <FaSearch />
                </button>
              </div>
{memberName && (

  <div className="member-result">

    <h4 className="success-text">
      พบข้อมูล
    </h4>

    <div className="result-item">
      <label>รหัสประจำตัว</label>
      <p>{memberId}</p>
    </div>

    <div className="result-item">
      <label>ชื่อ</label>
      <p>{memberName}</p>
    </div>

    <div className="member-action">

      <button
        type="button"
        className="change-btn"
        onClick={()=>{
          setMemberId("");
          setMemberName("");
        }}
      >
        เปลี่ยนสมาชิก
      </button>

<button
  type="button"
  className="invite-btn"
  onClick={sendInvitation}
>
        เชิญเข้าร่วมโครงงาน
      </button>

    </div>

  </div>

)}
            </div>
          )}

          <div className="form-group">
            <label>เลือกอาจารย์ที่ปรึกษา</label>

{advisorName ? (

  <div className="advisor-selected-row">

    <span className="advisor-name">
      {advisorName}
    </span>

    <button
      type="button"
      className="change-advisor-btn"
      onClick={() => {
        setAdvisorId(null);
        setAdvisorName("");
        setTeacherKeyword("");
        setTeacherList([]);
      }}
    >
      เปลี่ยนอาจารย์
    </button>

  </div>

) : (

  <div className="teacher-search">

    <div className="search-box">

      <input
        value={teacherKeyword}
        onChange={(e) => setTeacherKeyword(e.target.value)}
        placeholder="พิมพ์ชื่ออาจารย์"
      />

    </div>

    {teacherList.length > 0 && (
      <div className="teacher-list">
        {teacherList.map((teacher) => (
          <div
            key={teacher.id}
            className="teacher-item"
            onClick={() => {
              setAdvisorId(teacher.id);
              setAdvisorName(teacher.name);
              setTeacherKeyword(teacher.name);
              setTeacherList([]);
            }}
          >
            {teacher.name}
          </div>
        ))}
      </div>
    )}

  </div>

)}


          </div>

          <div className="form-group">
            <label>รายละเอียดโครงงาน</label>

            <textarea
              rows={5}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label>วัตถุประสงค์</label>

            <textarea
              rows={4}
              value={objective}
              onChange={(e) => setObjective(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label>เทคโนโลยีที่ใช้</label>

            <p className="example-text">
              ตัวอย่างการกรอก React | Node.js | MySQL | Git | Html|CSS
            </p>

            <input value={skills} onChange={(e) => setSkills(e.target.value)} />
          </div>

          <div className="button-group">
            <button className="cancel-btn" onClick={() => navigate(-1)}>
              ยกเลิก
            </button>

            <button className="submit-btn" onClick={handleSubmit}>
              ส่งข้อเสนอ
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}

export default SubmitNewProject;
