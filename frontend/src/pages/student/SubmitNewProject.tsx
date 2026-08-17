import "./SubmitNewProject.css"; // นำไฟล์ CSS สำหรับสไตล์ของหน้านี้เข้ามา
import { useNavigate } from "react-router-dom"; // hook สำหรับเปลี่ยนหน้า (navigation)
import { useEffect, useState } from "react"; // React hooks ที่ใช้งานในคอมโพเนนต์นี้
import axios from "axios"; // ไลบรารีสำหรับเรียก API (HTTP requests)
import { FaBell, FaSearch } from "react-icons/fa"; // ไอคอนที่ใช้ใน UI

import logo from "../../assets/Logo.svg"; // รูปโลโก้ที่จะแสดงใน sidebar

// ฟังก์ชันคอมโพเนนต์หลักสำหรับหน้าส่งคำเสนอโครงงานใหม่
function SubmitNewProject() {
  // สร้างตัวช่วยเปลี่ยนหน้า (เช่น navigate('/StudentHome'))
  const navigate = useNavigate();

  // อ่านข้อมูลผู้ใช้จาก sessionStorage (ค่าที่เก็บตอนล็อกอิน)
  // ค่าที่ได้เป็น string หรือ null ถ้าไม่มีข้อมูล
  const username = sessionStorage.getItem("username"); // รหัสประจำตัวผู้ใช้ (เช่น 66160000)
  const userId = sessionStorage.getItem("userId"); // id ที่อาจใช้เรียก API
  const profileImage = sessionStorage.getItem("profileImage"); // path รูปโปรไฟล์ที่เก็บไว้

  // สถานะภายในคอมโพเนนต์ ใช้ useState เพื่อให้ UI รีเรนเดอร์เมื่อค่ามีการเปลี่ยน
  const [showNotifications, setShowNotifications] = useState(false); // ควบคุมการโชว์ dropdown การแจ้งเตือน

  // ข้อมูลฟอร์มและการค้นหาอาจารย์
  const [projectTitle, setProjectTitle] = useState(""); // ชื่อหัวข้อโครงงานที่ผู้ใช้พิมพ์
  const [projectType, setProjectType] = useState("โครงงานเดี่ยว"); // ประเภทโครงงาน: 'เดี่ยว' หรือ 'คู่'
  const [projectId, setProjectId] = useState<number | null>(null);
  const [memberId, setMemberId] = useState(""); // username เช่น 66160001
  const [memberUserId, setMemberUserId] = useState<number | null>(null); // users.id
  const [memberName, setMemberName] = useState("");
  const [major, setMajor] = useState("");

  // ค้นหาและเลือกอาจารย์ที่ปรึกษา
  const [teacherKeyword, setTeacherKeyword] = useState(""); // ข้อความค้นหาอาจารย์ (input)
  const [teacherList, setTeacherList] = useState<any[]>([]); // ผลลัพธ์การค้นหาอาจารย์ (array ของ object)
  const [advisorId, setAdvisorId] = useState<number | null>(null); // id ของอาจารย์ที่เลือก (null ถ้ายังไม่เลือก)
  const [advisorName, setAdvisorName] = useState(""); // ชื่อของอาจารย์ที่เลือก

  // ตัวอย่างการแจ้งเตือน (mock data) — ในโปรดักชันข้อมูลนี้น่าจะมาจาก API
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

  // useEffect ตัวแรก: ตรวจสอบว่ามีผู้ใช้ล็อกอิน (username) หรือไม่
  // ถ้าไม่มี จะบังคับเปลี่ยนหน้าไปที่หน้าเข้าสู่ระบบ
  useEffect(() => {
    // username จะเป็น null ถ้า user ยังไม่ได้ล็อกอิน
    if (!username) {
      // ถ้าไม่มี username ให้ navigate กลับไปหน้าล็อกอิน (route '/')
      navigate("/");
    }
    // ใส่ username และ navigate ใน dependency array
    // เพื่อให้ effect นี้รันเมื่อค่า username หรือ navigate เปลี่ยน (navigate ปกติไม่เปลี่ยน)
  }, [username, navigate]);

  // useEffect ตัวที่สอง: ทำการเรียก API เพื่อค้นหาอาจารย์เมื่อผู้ใช้พิมพ์คำค้น
  // เงื่อนไขการค้นหา:
  // - ถ้าช่องว่าง ให้เคลียร์ผลลัพธ์
  // - ถ้าช่องคำค้นตรงกับชื่ออาจารย์ที่เราเลือกแล้ว ให้เคลียร์ผลลัพธ์ (ไม่ต้องค้นซ้ำ)
  // - ถ้าไม่เข้าเงื่อนไขด้านบน ให้เรียก API /teachers/search?name=keyword
  useEffect(() => {
    // trim() เพื่อตัดช่องว่างหัวท้ายก่อนเช็ค
    if (teacherKeyword.trim() === "") {
      // ถ้าช่องว่าง ให้เคลียร์รายการอาจารย์ที่โชว์
      setTeacherList([]);
      return; // ยุติการทำงานของ effect
    }

    // ถ้าชื่อในช่องตรงกับชื่ออาจารย์ที่เลือกแล้ว
    // ผู้ใช้อาจพิมพ์ชื่อจนตรงกับอาจารย์ที่เลือกไว้ — ในกรณีนี้ไม่ต้องค้นซ้ำ
    if (teacherKeyword === advisorName) {
      setTeacherList([]);
      return; // ยุติการทำงานของ effect
    }

    // เรียก API ไปยัง backend เพื่อค้นหาอาจารย์ตามชื่อ
    axios
      .get("http://localhost:5000/teachers/search", {
        params: {
          name: teacherKeyword, // ส่งพารามิเตอร์ชื่อไปให้ backend
        },
      })
      .then((res) => {
        // เมื่อได้ผลลัพธ์ ให้เก็บไว้ใน state เพื่อให้ UI แสดงรายการ
        setTeacherList(res.data);
      })
      .catch(() => {
        // เมื่อเกิดข้อผิดพลาด เช่น เครือข่ายขาด ให้เคลียร์รายการ
        setTeacherList([]);
      });
    // dependency array: ให้ effect นี้รันใหม่เมื่อ teacherKeyword หรือ advisorName เปลี่ยน
  }, [teacherKeyword, advisorName]);

  // ฟังก์ชันสำหรับล็อกเอาต์ผู้ใช้
  // - ลบข้อมูลที่เก็บไว้ใน sessionStorage
  // - เปลี่ยนหน้าไปที่หน้าล็อกอิน
  const handleLogout = () => {
    sessionStorage.removeItem("username"); // ลบค่ารหัสประจำตัวจาก sessionStorage
    sessionStorage.removeItem("name"); // ลบค่าชื่อผู้ใช้จาก sessionStorage
    sessionStorage.removeItem("profileImage"); // ลบค่าที่เก็บรูปโปรไฟล์
    navigate("/"); // เปลี่ยนหน้าไปยังหน้าเข้าสู่ระบบ
  };

  // อ่านชื่อผู้ใช้จาก sessionStorage เพื่อแสดงในฟอร์ม (ถ้ามี)
  const name = sessionStorage.getItem("name");
  // สถานะสำหรับรายละเอียดโครงงานและวัตถุประสงค์
  const [description, setDescription] = useState(""); // ข้อความรายละเอียด
  const [objective, setObjective] = useState(""); // ข้อความวัตถุประสงค์

  // สถานะสำหรับเทคโนโลยีที่ใช้
  const [skills, setSkills] = useState(""); // ข้อความเทคโนโลยี (ตัวอย่าง: React | Node.js)

  const [contactType, setContactType] = useState("");
  const [contactValue, setContactValue] = useState("");
  const [introduction, setIntroduction] = useState("");

  // ฟังก์ชันค้นหานิสิตโดยรหัส (เมื่อกดปุ่มค้นหา)
  // - ตรวจสอบว่าผู้ใช้กรอกรหัสหรือไม่
  // - เรียก API ไปหา user ประเภท student
  // - ถ้าพบ ให้แสดงชื่อและใส่ข้อมูลรหัสในช่อง
  // - ถ้าไม่พบ ให้แสดงข้อความแจ้งเตือน
  const searchStudent = async () => {
    // trim เพื่อตัดช่องวางทั้งต้นและปลาย
    if (!memberId.trim()) {
      alert("กรุณากรอกรหัสนิสิต"); // แจ้งผู้ใช้กรอกข้อมูล
      return; // หยุดการทำงานถ้ารหัสว่าง
    }

    try {
      // เรียก API ไปยัง backend เพื่อดึงข้อมูลนิสิตตามรหัส
      const res = await axios.get(
        `http://localhost:5000/users/student/${memberId}`,
      );

      // ถ้าพบข้อมูล ให้เก็บชื่อที่ได้จาก response
      setMemberName(res.data.name);
      setMemberUserId(res.data.id);
      // ป้องกันกรณี backend คืนค่ารหัสจริงต่างจาก input
      setMemberId(res.data.username);
    } catch (err) {
      // ถ้าเกิดข้อผิดพลาด ให้แจ้งผู้ใช้ว่าไม่พบข้อมูล
      alert("ไม่พบนิสิต");
      setMemberName(""); // เคลียร์ชื่อ
    }
  };

  // ฟังก์ชันส่งคำเชิญไปหานิสิต (เมื่อกดปุ่มเชิญ)
  // สร้าง request ไปยัง endpoint project-invitations
  const sendInvitation = async () => {
    try {
      // ตรวจสอบข้อมูลก่อน
      if (!projectTitle.trim()) {
        alert("กรุณากรอกชื่อหัวข้อโครงงาน");
        return;
      }

      if (!advisorId) {
        alert("กรุณาเลือกอาจารย์ที่ปรึกษาก่อน");
        return;
      }

      if (!memberUserId) {
        alert("กรุณาค้นหาและเลือกสมาชิกก่อน");
        return;
      }

      let currentProjectId = projectId;

      // ถ้ายังไม่มี project ให้สร้างก่อน
      if (!currentProjectId) {
        const projectRes = await axios.post("http://localhost:5000/projects", {
          title: projectTitle,
          advisor: advisorName,
          advisor_id: advisorId,
          major: major,
          project_type: projectType,
          max_members: projectType === "โครงงานคู่" ? 2 : 1,
          description: description,
          objectives: objective,
          skills: skills,
          requirements: "",

          // เพิ่ม
          source: "student",
          student_id: Number(userId),
        });

        currentProjectId = projectRes.data.project_id;
        if (!currentProjectId) {
          throw new Error("สร้าง project ไม่สำเร็จ: ไม่มี project_id");
        }

        setProjectId(currentProjectId);
      }

      // ส่งคำเชิญ
      await axios.post("http://localhost:5000/project-invitations", {
        sender_id: Number(userId),
        receiver_id: memberUserId,
        project_id: currentProjectId,
        advisor_id: advisorId,
        title: projectTitle,
        project_type: projectType,
        description: description,
        objectives: objective,
        skills: skills,
        requirements: "",

        contact_type: contactType,
        contact_value: contactValue,
        introduction: introduction,
      });

      alert("ส่งคำเชิญแล้ว");
    } catch (err: any) {
      console.log("Invitation error:", err);
      console.log(err.response?.data);

      alert(err.response?.data?.message || "ส่งคำเชิญไม่สำเร็จ");
    }
  };

  // ฟังก์ชันเมื่อกดปุ่มส่งข้อเสนอโครงงาน
  // - ส่งข้อมูลฟอร์มไปยัง backend (สร้าง project)
  const handleSubmit = async () => {
    try {
      if (!projectTitle.trim()) {
        alert("กรุณากรอกชื่อหัวข้อโครงงาน");
        return;
      }

      if (!advisorId) {
        alert("กรุณาเลือกอาจารย์ที่ปรึกษาก่อน");
        return;
      }

      if (!major) {
        alert("กรุณาเลือกสาขาวิชา");
        return;
      }

      if (!contactType || !contactValue) {
        alert("กรุณากรอกข้อมูลการติดต่อ");
        return;
      }

      // =========================
      // กรณีโครงงานคู่
      // =========================
      if (projectType === "โครงงานคู่") {
        alert("กรุณาส่งคำเชิญให้สมาชิกก่อน");
        return;
      }

      // =========================
      // กรณีโครงงานเดี่ยว
      // =========================

      // 1. สร้าง project ก่อน
      const projectRes = await axios.post("http://localhost:5000/projects", {
        title: projectTitle,
        advisor: advisorName,
        advisor_id: advisorId,
        major: major,
        project_type: "โครงงานเดี่ยว",
        max_members: 1,
        description: description,
        objectives: objective,
        skills: skills,
        requirements: "",
        source: "student",
        student_id: Number(userId),
      });

      const newProjectId = projectRes.data.project_id;

      // 2. สร้าง project_request
      await axios.post("http://localhost:5000/project-requests", {
        project_id: newProjectId,
        student_id: Number(userId),
        contact_type: contactType,
        contact_value: contactValue,
        introduction: introduction,
      });

      alert("ส่งข้อเสนอโครงงานสำเร็จ");

      navigate("/StudentHome");
    } catch (err: any) {
      console.log(err);
      console.log(err.response?.data);

      alert(err.response?.data?.message || "ส่งข้อเสนอไม่สำเร็จ");
    }
  };
  // ส่วน JSX: โครงสร้าง HTML ของหน้า
  return (
    <div className="layout">
      {/* ส่วน Sidebar ทางซ้ายของหน้า */}
      <aside className="sidebar">
        <div className="logo">
          {/* แสดงโลโก้ */}
          <img src={logo} alt="Logo" />

          <div>
            {/* ชื่อระบบและคำอธิบายสั้น ๆ */}
            <h2>SPTC System</h2>
            <p>ระบบติดตามและสื่อสารโครงงานนิสิต</p>
          </div>
        </div>

        <nav>
          <ul>
            {/* แต่ละรายการใช้ onClick เพื่อเปลี่ยนหน้า */}
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

        {/* ปุ่มออกจากระบบ */}
        <button className="logout-btn" onClick={handleLogout}>
          ออกจากระบบ
        </button>
      </aside>

      {/* ส่วน Main เนื้อหาหลักทางขวา */}
      <main className="main">
        {/* Header ของหน้า */}
        <header className="header">
          <h2>หน้าหลัก</h2>

          <div className="header-right">
            <div className="notification-box">
              <div className="notification-wrapper">
                {/* ปุ่มแสดง/ซ่อน การแจ้งเตือน */}
                <button
                  className="notification-btn"
                  onClick={() => setShowNotifications(!showNotifications)}
                >
                  <FaBell />

                  {/* จำนวนการแจ้งเตือนที่มี */}
                  <span className="notification-count">
                    {notifications.length}
                  </span>
                </button>

                {/* ถ้า showNotifications เป็น true ให้แสดง dropdown */}
                {showNotifications && (
                  <div className="notification-dropdown">
                    <h4>การแจ้งเตือน</h4>

                    {/* วนแสดงแต่ละการแจ้งเตือนจาก array notifications */}
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

            {/* ข้อมูลผู้ใช้ทางขวา: รูปและชื่อ */}
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

        {/* บัตรฟอร์มสำหรับส่งข้อเสนอ */}
        <div className="proposal-card">
          <h3>ส่งคำเสนอโครงงานใหม่</h3>

          <div className="form-group">
            <label>ชื่อหัวข้อโครงงาน</label>

            {/* input สำหรับชื่อหัวข้อ ใช้ value และ onChange เพื่อเป็น controlled component */}
            <input
              value={projectTitle}
              onChange={(e) => setProjectTitle(e.target.value)}
            />

            <label>ประเภทโครงงาน</label>
          </div>

          {/* กลุ่มปุ่ม radio สำหรับเลือกประเภทโครงงาน */}
          <div className="radio-group">
            <label>
              <input
                type="radio"
                checked={projectType === "โครงงานเดี่ยว"}
                onChange={() => setProjectType("โครงงานเดี่ยว")}
              />
              โครงงานเดี่ยว
            </label>

            <label>
              <input
                type="radio"
                checked={projectType === "โครงงานคู่"}
                onChange={() => setProjectType("โครงงานคู่")}
              />
              โครงงานคู่
            </label>
          </div>

          <h4>สมาชิกโครงงาน</h4>
          <div className="member-card">
            <h5>สมาชิกคนที่ 1</h5>

            <div className="form-group">
              <label>รหัสประจำตัว</label>

              {/* แสดงรหัสผู้ใช้ที่ล็อกอินไว้ เป็นช่อง disabled ไม่ให้แก้ */}
              <input value={username || ""} disabled />
            </div>

            <div className="form-group">
              <label>ชื่อ</label>

              <input value={name || ""} disabled />
            </div>
          </div>

          {/* เงื่อนไข: ถ้าเลือกเป็นโครงงานคู่ จะแสดงฟอร์มสมาชิกคนที่ 2 */}
          {projectType === "โครงงานคู่" && (
            <div className="member-card">
              <h5>สมาชิกคนที่ 2</h5>

              <label>รหัสประจำตัว</label>

              <div className="search-box">
                {/* input สำหรับกรอกรหัสนิสิต */}
                <input
                  value={memberId}
                  onChange={(e) => setMemberId(e.target.value)}
                />

                {/* ปุ่มค้นหาเรียก searchStudent */}
                <button type="button" onClick={searchStudent}>
                  <FaSearch />
                </button>
              </div>

              {/* เมื่อค้นเจอ memberName จะแสดงผลลัพธ์ */}
              {memberName && (
                <div className="member-result">
                  <h4 className="success-text">พบข้อมูล</h4>

                  <div className="result-item">
                    <label>รหัสประจำตัว</label>
                    <p>{memberId}</p>
                  </div>

                  <div className="result-item">
                    <label>ชื่อ</label>
                    <p>{memberName}</p>
                  </div>

                  <div className="member-action">
                    {/* ปุ่มเปลี่ยนสมาชิก: เคลียร์ค่า memberId และ memberName */}
                    <button
                      type="button"
                      className="change-btn"
                      onClick={() => {
                        setMemberId("");
                        setMemberUserId(null);
                        setMemberName("");
                      }}
                    >
                      เปลี่ยนสมาชิก
                    </button>

                    {/* ปุ่มเชิญเข้าร่วมโครงงาน */}
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

          {/* ช่องทางการติดต่อ */}
          <div className="form-group">
            <label>ช่องทางการติดต่อ</label>

            <select
              value={contactType}
              onChange={(e) => setContactType(e.target.value)}
            >
              <option value="">เลือกช่องทางติดต่อ</option>
              <option value="Email">Email</option>
              <option value="Line ID">Line ID</option>
              <option value="เบอร์โทรศัพท์">เบอร์โทรศัพท์</option>
            </select>
          </div>

          <div className="form-group">
            <label>ข้อมูลการติดต่อ</label>

            <input
              value={contactValue}
              onChange={(e) => setContactValue(e.target.value)}
              placeholder="เช่น 66160001@gmail.com หรือ ID Line"
            />
          </div>

          {/* แนะนำตัว */}
          <div className="form-group">
            <label>แนะนำตัว / ข้อมูลเพิ่มเติม</label>

            <textarea
              rows={4}
              value={introduction}
              onChange={(e) => setIntroduction(e.target.value)}
              placeholder="แนะนำตัวหรือข้อมูลเพิ่มเติมสำหรับอาจารย์"
            />
          </div>

          {/* ส่วนเลือกอาจารย์ที่ปรึกษา */}
          <div className="form-group">
            <label>เลือกอาจารย์ที่ปรึกษา</label>

            {/* ถ้า advisorName มีค่า (เลือกแล้ว) ให้แสดงชื่อและปุ่มเปลี่ยน */}
            {advisorName ? (
              <div className="advisor-selected-row">
                <span className="advisor-name">{advisorName}</span>

                <button
                  type="button"
                  className="change-advisor-btn"
                  onClick={() => {
                    // ถ้ากดเปลี่ยนอาจารย์ ให้เคลียร์สถานะการเลือก
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
              // ถ้ายังไม่เลือกอาจารย์ ให้แสดงช่องค้นหาและรายการผลลัพธ์
              <div className="teacher-search">
                <div className="search-box">
                  <input
                    value={teacherKeyword}
                    onChange={(e) => setTeacherKeyword(e.target.value)}
                    placeholder="พิมพ์ชื่ออาจารย์"
                  />
                </div>

                {/* ถ้ามีรายการ teacherList ให้แสดงเป็นรายการเลือก */}
                {teacherList.length > 0 && (
                  <div className="teacher-list">
                    {teacherList.map((teacher) => (
                      <div
                        key={teacher.id}
                        className="teacher-item"
                        onClick={() => {
                          // เมื่อเลือกอาจารย์จากรายการ ให้เซ็ต id, name
                          setAdvisorId(teacher.id);
                          setAdvisorName(teacher.name);
                          setMajor(teacher.major);
                          // ตั้งค่าช่องค้นหาเป็นชื่อนั้น (เพื่อแสดงใน input)
                          setTeacherKeyword(teacher.name);
                          // และเคลียร์รายการผลลัพธ์
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

          {/* รายละเอียดโครงงาน */}
          <div className="form-group">
            <label>รายละเอียดโครงงาน</label>

            <textarea
              rows={5}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          {/* วัตถุประสงค์ */}
          <div className="form-group">
            <label>วัตถุประสงค์</label>

            <textarea
              rows={4}
              value={objective}
              onChange={(e) => setObjective(e.target.value)}
            />
          </div>

          {/* เทคโนโลยีที่ใช้ */}
          <div className="form-group">
            <label>เทคโนโลยีที่ใช้</label>

            <p className="example-text">
              ตัวอย่างการกรอก React | Node.js | MySQL | Git | Html|CSS
            </p>

            <input value={skills} onChange={(e) => setSkills(e.target.value)} />
          </div>

          {/* ปุ่มยกเลิกและปุ่มส่ง */}
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
