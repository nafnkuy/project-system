import "./CreateTeacherProject.css";
import TeacherNotificationBell from "./TeacherNotificationBell";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import axios from "axios";

import logo from "../../assets/Logo.svg";

function CreateTeacherProject() {
  const navigate = useNavigate();

  const userId = sessionStorage.getItem("userId");
  const username = sessionStorage.getItem("username");
  const name = sessionStorage.getItem("name");
  const profileImage = sessionStorage.getItem("profileImage");
  const major = sessionStorage.getItem("major");

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [objectives, setObjectives] = useState("");
  const [skills, setSkills] = useState("");
  const [requirements, setRequirements] = useState("");

  const [projectType, setProjectType] = useState("โครงงานเดี่ยว");
  const [academicYear, setAcademicYear] = useState("2569/1");
  const [loading, setLoading] = useState(false);

  // ตรวจสอบการเข้าสู่ระบบ (คงการทำงานเดิม)
  useEffect(() => {
    if (!userId) {
      navigate("/");
    }
  }, [userId, navigate]);

  const handleLogout = () => {
    sessionStorage.removeItem("userId");
    sessionStorage.removeItem("username");
    sessionStorage.removeItem("name");
    sessionStorage.removeItem("profileImage");
    sessionStorage.removeItem("major");
    navigate("/");
  };

  // สร้างหัวข้อโครงงาน: ใช้ API และข้อมูลชุดเดิมของอาจารย์
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
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
      {/* ======================= SIDEBAR ======================= */}
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
            <li className="active" onClick={() => navigate("/teacher-projects")}>
              จัดการหัวข้อโครงงาน
            </li>
            <li onClick={() => navigate("/teacher-requests")}>
              คำขอเข้าร่วมโครงงาน
            </li>
            <li onClick={() => navigate("/teacher-managed-projects")}>โครงงานที่ดูแล</li>
            <li onClick={() => navigate("/teacher-work")}>งานที่ต้องดำเนินการ</li>
            <li onClick={() => navigate("/teacher-decision-history")}>
              ประวัติการพิจารณา
            </li>
            <li onClick={() => navigate("/teacher-notifications")}>
              การแจ้งเตือน
            </li>
            <li>ข้อมูลส่วนตัว</li>
          </ul>
        </nav>

        <button type="button" className="logout-btn" onClick={handleLogout}>
          ออกจากระบบ
        </button>
      </aside>

      {/* ======================== MAIN ========================= */}
      <main className="main">
        <header className="header">
          <div className="breadcrumb">
            <span
              className="breadcrumb-link"
              onClick={() => navigate("/teacher-projects")}
            >
              จัดการหัวข้อโครงงาน
            </span>
            <span className="breadcrumb-separator">&gt;</span>
            <span>สร้างหัวข้อโครงงาน</span>
          </div>

          <div className="header-right">
            <TeacherNotificationBell />
            <div className="user-info">
              <img
                src={profileImage ? `http://localhost:5000${profileImage}` : logo}
                alt="Profile"
                className="profile-image"
              />
              <span>{username}</span>
            </div>
          </div>
        </header>

        {/* ฟอร์มหน้าอาจารย์: หน้าตาอ้างอิง SubmitNewProject ของนิสิต */}
        <div className="create-project-content">
          <form onSubmit={handleSubmit}>
            {/* การ์ด 1: ชื่อหัวข้อโครงงาน */}
            <section className="form-section">
              <div className="form-group">
                <label htmlFor="teacher-project-title">
                  ชื่อหัวข้อโครงงาน <span className="required-star">*</span>
                </label>
                <input
                  id="teacher-project-title"
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="กรอกชื่อหัวข้อโครงงาน"
                />
              </div>
            </section>

            {/* การ์ด 2: ปีการศึกษา + ประเภท + จำนวนที่รับ */}
            <section className="form-section">
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="teacher-project-year">
                    ปีการศึกษา / ภาคเรียน <span className="required-star">*</span>
                  </label>
                  <div className="create-select-wrapper">
                    <select
                      id="teacher-project-year"
                      className="create-filter-select"
                      value={academicYear}
                      onChange={(e) => setAcademicYear(e.target.value)}
                    >
                      <option value="2569/1">2569/1</option>
                      <option value="2569/2">2569/2</option>
                      <option value="2570/1">2570/1</option>
                      <option value="2570/2">2570/2</option>
                    </select>
                    <span className="create-select-arrow" aria-hidden="true">▼</span>
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="teacher-project-type">
                    ประเภทโครงงาน <span className="required-star">*</span>
                  </label>
                  <div className="create-select-wrapper">
                    <select
                      id="teacher-project-type"
                      className="create-filter-select"
                      value={projectType}
                      onChange={(e) => setProjectType(e.target.value)}
                    >
                      <option value="โครงงานเดี่ยว">โครงงานเดี่ยว</option>
                      <option value="โครงงานคู่">โครงงานคู่</option>
                    </select>
                    <span className="create-select-arrow" aria-hidden="true">▼</span>
                  </div>
                </div>
              </div>

              <div className="project-member-info">
                <span>จำนวนที่รับ</span>
                <strong>
                  {projectType === "โครงงานเดี่ยว" ? "รับ 1 คน" : "รับ 2 คน"}
                </strong>
              </div>
            </section>

            {/* การ์ด 3: ข้อมูลอาจารย์ อ่านอย่างเดียว */}
            <section className="form-section teacher-section">
              <div className="section-title">ข้อมูลอาจารย์ที่ปรึกษา</div>
              <div className="teacher-row">
                <div className="teacher-info-item">
                  <label>อาจารย์ที่ปรึกษา</label>
                  <div className="teacher-info-value">{name || "-"}</div>
                </div>
                <div className="teacher-info-item">
                  <label>สาขาวิชา</label>
                  <div className="teacher-info-value">{major || "-"}</div>
                </div>
              </div>
            </section>

            {/* การ์ด 4: รายละเอียดเดิมของอาจารย์ */}
            <section className="form-section details-section">
              <div className="form-group">
                <label htmlFor="teacher-project-description">
                  รายละเอียดโครงงาน <span className="required-star">*</span>
                </label>
                <textarea
                  id="teacher-project-description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="กรอกรายละเอียดของโครงงาน"
                  rows={5}
                />
              </div>

              <div className="form-group">
                <label htmlFor="teacher-project-objectives">
                  วัตถุประสงค์ <span className="required-star">*</span>
                </label>
                <textarea
                  id="teacher-project-objectives"
                  value={objectives}
                  onChange={(e) => setObjectives(e.target.value)}
                  placeholder="กรอกวัตถุประสงค์ของโครงงาน"
                  rows={4}
                />
              </div>

              <div className="form-group">
                <label htmlFor="teacher-project-skills">
                  เทคโนโลยีที่ใช้ <span className="required-star">*</span>
                </label>
                <div className="example-text">
                  ตัวอย่างการกรอก: React|Node.js|MySQL|Git|HTML|CSS
                  <div>ห้ามเว้นวรรคระหว่างเครื่องหมาย |</div>
                </div>
                <input
                  id="teacher-project-skills"
                  type="text"
                  value={skills}
                  onChange={(e) => setSkills(e.target.value)}
                  placeholder="กรอกเทคโนโลยีที่ใช้ในโครงงาน"
                />
              </div>

              <div className="form-group">
                <label htmlFor="teacher-project-requirements">
                  คุณสมบัติผู้สมัคร <span className="required-star">*</span>
                </label>
                <textarea
                  id="teacher-project-requirements"
                  value={requirements}
                  onChange={(e) => setRequirements(e.target.value)}
                  placeholder="กรอกคุณสมบัติของผู้สมัครเข้าร่วมโครงงาน"
                  rows={3}
                />
              </div>

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
                  disabled={
                    loading ||
                    !title.trim() ||
                    !description.trim() ||
                    !skills.trim()
                  }
                >
                  {loading ? "กำลังบันทึก..." : "บันทึกหัวข้อโครงงาน"}
                </button>
              </div>
            </section>
          </form>
        </div>
      </main>
    </div>
  );
}

export default CreateTeacherProject;
