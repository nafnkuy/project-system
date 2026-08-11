import "./CreateTeacherProject.css";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import axios from "axios";
import { FaBell } from "react-icons/fa";

import logo from "../../assets/Logo.svg";

function CreateTeacherProject() {
  const navigate = useNavigate();

  const userId = localStorage.getItem("userId");
  const username = localStorage.getItem("username");
  const name = localStorage.getItem("name");
  const profileImage = localStorage.getItem("profileImage");
  const major = localStorage.getItem("major");

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [objectives, setObjectives] = useState("");
  const [skills, setSkills] = useState("");
  const [requirements, setRequirements] = useState("");

  const [projectType, setProjectType] = useState("โครงงานเดี่ยว");

  const [academicYear, setAcademicYear] = useState("2569/1");

  const [loading, setLoading] = useState(false);

  // ตรวจสอบ Login
  useEffect(() => {
    if (!userId) {
      navigate("/");
    }
  }, [userId, navigate]);

  // Logout
  const handleLogout = () => {
    localStorage.removeItem("userId");
    localStorage.removeItem("username");
    localStorage.removeItem("name");
    localStorage.removeItem("profileImage");
    localStorage.removeItem("major");

    navigate("/");
  };

  // สร้างหัวข้อโครงงาน
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
      alert("กรุณากรอกชื่อหัวข้อโครงงาน");
      return;
    }

    if (!description.trim()) {
      alert("กรุณากรอกรายละเอียดหัวข้อโครงงาน");
      return;
    }

    if (!skills.trim()) {
      alert("กรุณากรอกทักษะหรือความรู้ที่จำเป็น");
      return;
    }

    try {
      setLoading(true);

      // กำหนดจำนวนสมาชิกจากประเภทโครงงาน
      const maxMembers = projectType === "โครงงานเดี่ยว" ? 1 : 2;

      const res = await axios.post("http://localhost:5000/projects", {
        title,
        advisor: name,
        advisor_id: userId,
        major: major,

        project_type: projectType,
        max_members: maxMembers,
        current_members: 0,

        academic_year: academicYear,

        description,
        objectives,
        skills,
        requirements,

        // อาจารย์เป็นผู้สร้าง
        source: "teacher",
      });

      console.log("Create project response:", res.data);

      alert("สร้างหัวข้อโครงงานเรียบร้อยแล้ว");

      navigate("/teacher-projects");
    } catch (err: any) {
      console.log("Create teacher project error:", err);
      console.log(err.response?.data);

      alert(err.response?.data?.message || "ไม่สามารถสร้างหัวข้อโครงงานได้");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="teacher-project-page">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="logo-section">
          <img src={logo} alt="SPTC Logo" />

          <div>
            <h2>SPTC System</h2>
            <p>ระบบติดตามและสื่อสารโครงงานนิสิต</p>
          </div>
        </div>

        <nav>
          <ul>
            <li onClick={() => navigate("/teacher-home")}>หน้าหลัก</li>

            <li
              className="active"
              onClick={() => navigate("/teacher-projects")}
            >
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
          <div className="breadcrumb">
            <span
              onClick={() => navigate("/teacher-projects")}
              className="breadcrumb-link"
            >
              จัดการหัวข้อโครงงาน
            </span>

            <span> &gt; </span>

            <span>สร้างหัวข้อโครงงาน</span>
          </div>

          <div className="header-right">
            <button className="notification-btn">
              <FaBell />
            </button>

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

        {/* Content */}
        <div className="create-project-content">
          <form onSubmit={handleSubmit}>

  {/* =========================
      ชื่อหัวข้อโครงงาน
  ========================= */}
  <div className="form-section">

    <div className="form-group">
      <label>ชื่อหัวข้อโครงงาน *</label>

      <input
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="กรอกชื่อหัวข้อโครงงาน"
      />
    </div>

  </div>


  {/* =========================
      อาจารย์ที่ปรึกษา
  ========================= */}
  <div className="form-section teacher-section">

  <div className="teacher-row">

    {/* อาจารย์ที่ปรึกษา */}
    <div className="form-group">
      <label>อาจารย์ที่ปรึกษา</label>

      <input
        type="text"
        value={name || ""}
        readOnly
        className="readonly-input"
      />
    </div>


    {/* สาขาวิชา */}
    <div className="form-group">
      <label>สาขาวิชา</label>

      <input
        type="text"
        value={major || "-"}
        readOnly
        className="readonly-input"
      />
    </div>

  </div>

</div>


  {/* =========================
      การเปิดรับ
  ========================= */}
  <div className="form-section">
    <div className="form-row">

      {/* ประเภทโครงงาน */}
      <div className="form-group">
        <label>ประเภทโครงงาน *</label>

        <select
          value={projectType}
          onChange={(e) => setProjectType(e.target.value)}
        >
          <option value="โครงงานเดี่ยว">
            โครงงานเดี่ยว
          </option>

          <option value="โครงงานคู่">
            โครงงานคู่
          </option>
        </select>
      </div>


      {/* ปีการศึกษา */}
      <div className="form-group">
        <label>ปีการศึกษา / ภาคเรียน *</label>

        <select
          value={academicYear}
          onChange={(e) => setAcademicYear(e.target.value)}
        >
          <option value="2569/1">2569/1</option>
          <option value="2569/2">2569/2</option>
          <option value="2570/1">2570/1</option>
          <option value="2570/2">2570/2</option>
        </select>
      </div>

    </div>


    {/* จำนวนสมาชิก */}
    <div className="project-member-info">

      <span>จำนวนที่รับ</span>

      <strong>
        {projectType === "โครงงานเดี่ยว"
          ? "รับ 1 คน"
          : "รับ 2 คน"}
      </strong>

    </div>

  </div>


  {/* =========================
      รายละเอียดโครงงาน
  ========================= */}
  <div className="form-section">
    
    {/* รายละเอียด */}
    <div className="form-group">
      <label>รายละเอียดโครงงาน *</label>

      <textarea
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder="กรอกรายละเอียดของโครงงาน"
        rows={5}
      />
    </div>


    {/* วัตถุประสงค์ */}
    <div className="form-group">
      <label>วัตถุประสงค์</label>

      <textarea
        value={objectives}
        onChange={(e) => setObjectives(e.target.value)}
        placeholder="กรอกวัตถุประสงค์ของโครงงาน"
        rows={4}
      />
    </div>


    {/* เทคโนโลยี / ทักษะ */}
    <div className="form-group">
      <label>เทคโนโลยีหรือทักษะที่จำเป็น *</label>

      <textarea
        value={skills}
        onChange={(e) => setSkills(e.target.value)}
        placeholder="เช่น React, Node.js, MySQL"
        rows={3}
      />
    </div>


    {/* คุณสมบัติ */}
    <div className="form-group">
      <label>คุณสมบัติ/ข้อกำหนดของนิสิต</label>

      <textarea
        value={requirements}
        onChange={(e) => setRequirements(e.target.value)}
        placeholder="เช่น มีพื้นฐานการเขียนโปรแกรม"
        rows={3}
      />
    </div>

  </div>


  {/* =========================
      ปุ่ม
  ========================= */}
  <div className="form-actions">

    <button
      type="button"
      className="cancel-btn"
      onClick={() => navigate("/teacher-projects")}
    >
      ยกเลิก
    </button>

    <button
      type="submit"
      className="save-btn"
      disabled={loading}
    >
      {loading
        ? "กำลังบันทึก..."
        : "บันทึกหัวข้อโครงงาน"}
    </button>

  </div>

</form>
        </div>
      </main>
    </div>
  );
}

export default CreateTeacherProject;
