import "./SubmitNewProject.css";

import { useNavigate, useSearchParams } from "react-router-dom";
import { useEffect, useState } from "react";
import axios from "axios";
import { FaBell, FaSearch } from "react-icons/fa";

import logo from "../../assets/Logo.svg";

/* =========================================================
   TYPE
========================================================= */

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

/* =========================================================
   COMPONENT
========================================================= */

function SubmitNewProject() {
  const navigate = useNavigate();

  const [searchParams] = useSearchParams();

  const mode = searchParams.get("mode");
  const resubmitProjectId = searchParams.get("projectId");
  const resubmitRequestId = searchParams.get("requestId");

  const isResubmit =
    mode === "resubmit" && !!resubmitProjectId && !!resubmitRequestId;

  /* =========================================================
     SESSION
  ========================================================= */

  const username = sessionStorage.getItem("username");
  const userId = sessionStorage.getItem("userId");
  const profileImage = sessionStorage.getItem("profileImage");
  const name = sessionStorage.getItem("name");

  /* =========================================================
     NOTIFICATION
  ========================================================= */

  const [showNotifications, setShowNotifications] = useState(false);

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

  /* =========================================================
     PROJECT FORM
  ========================================================= */

  const [projectTitle, setProjectTitle] = useState("");

  const [academicYear, setAcademicYear] = useState("");

  const [projectType, setProjectType] = useState("โครงงานเดี่ยว");

  const [projectId, setProjectId] = useState<number | null>(null);

  const [major, setMajor] = useState("");

  const [description, setDescription] = useState("");

  const [objective, setObjective] = useState("");

  const [skills, setSkills] = useState("");

  /* =========================================================
     MEMBER
  ========================================================= */

  const [memberId, setMemberId] = useState("");

  const [memberUserId, setMemberUserId] = useState<number | null>(null);

  const [memberName, setMemberName] = useState("");

  /* =========================================================
     ADVISOR
  ========================================================= */

  const [teacherKeyword, setTeacherKeyword] = useState("");

  const [teacherList, setTeacherList] = useState<any[]>([]);

  const [advisorId, setAdvisorId] = useState<number | null>(null);

  const [advisorName, setAdvisorName] = useState("");

  /* =========================================================
     CONTACT
  ========================================================= */

  const [contactType, setContactType] = useState("");

  const [contactValue, setContactValue] = useState("");

  const [introduction, setIntroduction] = useState("");

  /* =========================================================
     CHECK LOGIN
  ========================================================= */

  useEffect(() => {
    if (!username) {
      navigate("/");
    }
  }, [username, navigate]);

  /* =========================================================
     SEARCH TEACHER
  ========================================================= */

  useEffect(() => {
    if (teacherKeyword.trim() === "") {
      setTeacherList([]);
      return;
    }

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

  /* =========================================================
     LOAD RESUBMIT DATA
  ========================================================= */

  useEffect(() => {
    if (!isResubmit || !resubmitProjectId || !userId) {
      return;
    }

    const loadResubmitData = async () => {
      try {
        const [projectRes, requestRes] = await Promise.all([
          axios.get(`http://localhost:5000/projects/${resubmitProjectId}`),

          axios.get(
            `http://localhost:5000/project-requests/${resubmitProjectId}/${userId}`,
          ),
        ]);

        const projectData = projectRes.data;

        const requestData = requestRes.data;

        /* ---------- PROJECT ---------- */

        setProjectId(Number(resubmitProjectId));

        setProjectTitle(projectData.title || "");

        setAcademicYear(projectData.academic_year || "");

        setProjectType(projectData.project_type || "โครงงานเดี่ยว");

        setAdvisorId(
          projectData.advisor_id ? Number(projectData.advisor_id) : null,
        );

        setAdvisorName(projectData.advisor_name || projectData.advisor || "");

        setTeacherKeyword(
          projectData.advisor_name || projectData.advisor || "",
        );

        setMajor(projectData.major || "");

        setDescription(projectData.description || "");

        setObjective(projectData.objectives || "");

        setSkills(projectData.skills || "");

        /* ---------- REQUEST ---------- */

        setContactType(requestData.contact_type || "");

        setContactValue(requestData.contact_value || "");

        setIntroduction(requestData.introduction || "");
      } catch (err: any) {
        console.log("Load resubmit data error =", err);

        alert(
          err.response?.data?.message ||
            "ไม่สามารถโหลดข้อมูลคำเสนอโครงงานเดิมได้",
        );
      }
    };

    loadResubmitData();
  }, [isResubmit, resubmitProjectId, resubmitRequestId, userId]);

  /* =========================================================
     LOGOUT
  ========================================================= */

  const handleLogout = () => {
    sessionStorage.removeItem("username");

    sessionStorage.removeItem("name");

    sessionStorage.removeItem("profileImage");

    sessionStorage.removeItem("userId");

    sessionStorage.removeItem("major");

    navigate("/");
  };

  /* =========================================================
     SEARCH STUDENT
  ========================================================= */

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

      setMemberUserId(res.data.id);

      setMemberId(res.data.username);
    } catch (err) {
      alert("ไม่พบนิสิต");

      setMemberName("");
      setMemberUserId(null);
    }
  };

  /* =========================================================
     SEND INVITATION
  ========================================================= */

  const sendInvitation = async () => {
    try {
      if (!projectTitle.trim()) {
        alert("กรุณากรอกชื่อหัวข้อโครงงาน");

        return;
      }

      if (!academicYear) {
        alert("กรุณาเลือกปีการศึกษา");

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

      /* =====================================================
         CREATE PROJECT ก่อนส่งคำเชิญ
      ===================================================== */

      if (!currentProjectId) {
        const projectRes = await axios.post("http://localhost:5000/projects", {
          title: projectTitle,

          academic_year: academicYear,

          advisor: advisorName,

          advisor_id: advisorId,

          major: major,

          project_type: projectType,

          max_members: projectType === "โครงงานคู่" ? 2 : 1,

          description: description,

          objectives: objective,

          skills: skills,

          requirements: "",

          source: "student",

          student_id: Number(userId),
        });

        currentProjectId = projectRes.data.project_id;

        if (!currentProjectId) {
          throw new Error("สร้าง project ไม่สำเร็จ: ไม่มี project_id");
        }

        setProjectId(currentProjectId);
      }

      /* =====================================================
         SEND INVITATION
      ===================================================== */

      await axios.post("http://localhost:5000/project-invitations", {
        sender_id: Number(userId),

        receiver_id: memberUserId,

        project_id: currentProjectId,

        advisor_id: advisorId,

        title: projectTitle,

        academic_year: academicYear,

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

  /* =========================================================
     SUBMIT PROJECT
  ========================================================= */

  const handleSubmit = async () => {
    try {
      if (!projectTitle.trim()) {
        alert("กรุณากรอกชื่อหัวข้อโครงงาน");

        return;
      }

      if (!academicYear) {
        alert("กรุณาเลือกปีการศึกษา");

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

      /* =====================================================
         RESUBMIT
      ===================================================== */

      if (isResubmit && resubmitProjectId && resubmitRequestId) {
        const res = await axios.put(
          `http://localhost:5000/student/project-resubmit/${resubmitProjectId}/${resubmitRequestId}`,
          {
            student_id: Number(userId),

            title: projectTitle,

            academic_year: academicYear,

            advisor: advisorName,

            advisor_id: advisorId,

            major: major,

            project_type: projectType,

            max_members: projectType === "โครงงานคู่" ? 2 : 1,

            description: description,

            objectives: objective,

            skills: skills,

            requirements: "",

            contact_type: contactType,

            contact_value: contactValue,

            introduction: introduction,
          },
        );

        alert(res.data.message);

        navigate("/StudentHome");

        return;
      }

      /* =====================================================
         PROJECT คู่
      ===================================================== */

      if (projectType === "โครงงานคู่") {
        if (!projectId) {
          alert("กรุณาส่งคำเชิญให้สมาชิกก่อน");

          return;
        }

        const invitationRes = await axios.get(
          `http://localhost:5000/project-invitations/status/${projectId}/${userId}`,
        );

        if (invitationRes.data.status === "รอตอบรับ") {
          alert("สมาชิกคนที่ 2 ยังไม่ได้ตอบรับคำเชิญ");

          return;
        }

        if (invitationRes.data.status === "ปฏิเสธ") {
          alert("สมาชิกคนที่ 2 ปฏิเสธคำเชิญ กรุณาเลือกสมาชิกใหม่");

          return;
        }

        if (invitationRes.data.status !== "ตอบรับ") {
          alert("ไม่สามารถส่งข้อเสนอได้");

          return;
        }

        await axios.post("http://localhost:5000/project-requests", {
          project_id: projectId,

          student_id: Number(userId),

          contact_type: contactType,

          contact_value: contactValue,

          introduction: introduction,
        });

        alert("ส่งข้อเสนอโครงงานสำเร็จ");

        navigate("/StudentHome");

        return;
      }

      /* =====================================================
         PROJECT เดี่ยว
      ===================================================== */

      const projectRes = await axios.post("http://localhost:5000/projects", {
        title: projectTitle,

        academic_year: academicYear,

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

  /* =========================================================
     JSX
  ========================================================= */

  return (
    <div className="student-submit-project-page">
      {/* =====================================================
          SIDEBAR
      ===================================================== */}

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

      {/* =====================================================
          MAIN
      ===================================================== */}

      <main className="main">
        {/* ===================================================
            HEADER
        =================================================== */}

        <header className="header">
          <h2>{isResubmit ? "แก้ไขคำเสนอโครงงาน" : "ส่งคำเสนอโครงงานใหม่"}</h2>

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
                src={
                  profileImage ? `http://localhost:5000${profileImage}` : logo
                }
                alt="Profile"
                className="profile-image"
              />

              <span>{username}</span>
            </div>
          </div>
        </header>

        {/* ===================================================
            FORM CARD
        =================================================== */}

        <div className="proposal-card">
          <h3>{isResubmit ? "แก้ไขคำเสนอโครงงาน" : "ส่งคำเสนอโครงงานใหม่"}</h3>

          {/* =================================================
              PROJECT TITLE
          ================================================= */}

          <div className="form-group">
            <label>ชื่อหัวข้อโครงงาน</label>

            <input
              type="text"
              value={projectTitle}
              onChange={(e) => setProjectTitle(e.target.value)}
            />
          </div>

          {/* =================================================
              ACADEMIC YEAR
          ================================================= */}

          <div className="form-group">
            <label>ปีการศึกษา</label>

            <div className="contact-select-wrapper">
              <select
                value={academicYear}
                onChange={(e) => setAcademicYear(e.target.value)}
              >
                <option value="">เลือกปีการศึกษา</option>

                <option value="2569/1">2569/1</option>

                <option value="2569/2">2569/2</option>

                <option value="2570/1">2570/1</option>

                <option value="2570/2">2570/2</option>
              </select>

              <span className="contact-select-arrow">▼</span>
            </div>
          </div>

          {/* =================================================
              PROJECT TYPE
          ================================================= */}

          <div className="form-group">
            <label>ประเภทโครงงาน</label>
          </div>

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

          {/* =================================================
    MEMBER
================================================= */}

          <h4>สมาชิกโครงงาน</h4>

          {/* ================= สมาชิกคนที่ 1 ================= */}

          <div className="member-card">
            <h5>สมาชิกคนที่ 1</h5>

            <div className="form-group">
              <label className="member-field-label">รหัสประจำตัว</label>

              <input type="text" value={username || ""} disabled />
            </div>

            <div className="form-group">
              <label className="member-field-label">ชื่อ</label>

              <input type="text" value={name || ""} disabled />
            </div>
          </div>

          {/* =================================================
    MEMBER 2
================================================= */}

          {projectType === "โครงงานคู่" && (
            <div className="member-card">
              <h5>สมาชิกคนที่ 2</h5>

              <div className="form-group">
                <label className="member-field-label">รหัสประจำตัว</label>

                <div className="search-box">
                  <input
                    type="text"
                    value={memberId}
                    onChange={(e) => setMemberId(e.target.value)}
                  />

                  <button type="button" onClick={searchStudent}>
                    <FaSearch />
                  </button>
                </div>
              </div>

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

          {/* =================================================
              CONTACT TYPE
          ================================================= */}

          <div className="form-group">
            <label>ช่องทางการติดต่อ</label>

            <div className="contact-select-wrapper">
              <select
                value={contactType}
                onChange={(e) => {
                  setContactType(e.target.value);

                  setContactValue("");
                }}
              >
                <option value="">เลือกช่องทางการติดต่อ</option>

                <option value="Email">Email</option>

                <option value="Line ID">Line ID</option>

                <option value="Facebook">Facebook</option>

                <option value="Discord">Discord</option>

                <option value="Instagram">Instagram</option>

                <option value="เบอร์โทรศัพท์">เบอร์โทรศัพท์</option>
              </select>

              <span className="contact-select-arrow">▼</span>
            </div>
          </div>

          {/* =================================================
              CONTACT VALUE
          ================================================= */}

          {contactType !== "" && (
            <div className="form-group">
              <label>{contactType}</label>

              <input
                type={
                  contactType === "Email"
                    ? "email"
                    : contactType === "เบอร์โทรศัพท์"
                      ? "tel"
                      : "text"
                }
                value={contactValue}
                onChange={(e) => setContactValue(e.target.value)}
                placeholder={
                  contactType === "Email"
                    ? "กรอกอีเมล เช่น 66160001@go.buu.ac.th"
                    : contactType === "Line ID"
                      ? "กรอก Line ID"
                      : contactType === "Facebook"
                        ? "กรอกชื่อบัญชีหรือ URL Facebook"
                        : contactType === "Discord"
                          ? "กรอกชื่อผู้ใช้ Discord"
                          : contactType === "Instagram"
                            ? "กรอกชื่อผู้ใช้ Instagram"
                            : contactType === "เบอร์โทรศัพท์"
                              ? "กรอกเบอร์โทรศัพท์"
                              : ""
                }
              />
            </div>
          )}

          {/* =================================================
              INTRODUCTION
          ================================================= */}

          <div className="form-group">
            <label>เหตุผลในการเสนอหัวข้อโครงงาน</label>

            <textarea
              rows={4}
              value={introduction}
              onChange={(e) => setIntroduction(e.target.value)}
              placeholder="กรุณาระบุเหตุผลที่ต้องการเสนอหัวข้อโครงงานนี้"
            />
          </div>

          {/* =================================================
              ADVISOR
          ================================================= */}

          <div className="form-group">
            <label>เลือกอาจารย์ที่ปรึกษา</label>

            {advisorName ? (
              <div className="advisor-selected-row">
                <span className="advisor-name">{advisorName}</span>

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

                {teacherList.map((teacher) => {
                  const requiredSlots = projectType === "โครงงานคู่" ? 2 : 1;

                  const canAccept =
                    Number(teacher.remaining_capacity) >= requiredSlots;

                  return (
                    <div
                      key={teacher.id}
                      className={`teacher-item ${
                        !canAccept ? "teacher-full" : ""
                      }`}
                      onClick={() => {
                        if (!canAccept) {
                          alert(
                            projectType === "โครงงานคู่"
                              ? `อาจารย์ท่านนี้เหลือรับนิสิตได้ ${teacher.remaining_capacity} คน ไม่เพียงพอสำหรับโครงงานคู่`
                              : "อาจารย์ท่านนี้รับนิสิตครบแล้ว",
                          );

                          return;
                        }

                        setAdvisorId(teacher.id);

                        setAdvisorName(teacher.name);

                        setMajor(teacher.major);

                        setTeacherKeyword(teacher.name);

                        setTeacherList([]);
                      }}
                    >
                      <span>{teacher.name}</span>

                      <span>
                        {canAccept
                          ? `เปิดรับ (${teacher.accepted_students}/14)`
                          : `ไม่สามารถรับเพิ่ม (${teacher.accepted_students}/14)`}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* =================================================
    DESCRIPTION
================================================= */}

          <div className="form-group">
            <label>รายละเอียดโครงงาน</label>

            <textarea
              rows={5}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="กรอกรายละเอียดของโครงงาน"
            />
          </div>

          {/* =================================================
    OBJECTIVE
================================================= */}

          <div className="form-group">
            <label>วัตถุประสงค์</label>

            <textarea
              rows={4}
              value={objective}
              onChange={(e) => setObjective(e.target.value)}
              placeholder="กรอกวัตถุประสงค์ของโครงงาน"
            />
          </div>

          {/* =================================================
    SKILLS
================================================= */}

          <div className="form-group">
            <label>เทคโนโลยีที่ใช้</label>

            <p className="example-text">
              ตัวอย่างการกรอก: React|Node.js|MySQL|Git|HTML|CSS
              <br />
              ห้ามเว้นวรรคระหว่างเครื่องหมาย |
            </p>

            <input
              value={skills}
              onChange={(e) => setSkills(e.target.value)}
              placeholder="กรอกเทคโนโลยีหรือทักษะที่จำเป็นสำหรับโครงงาน"
            />
          </div>

          {/* =================================================
              BUTTON
          ================================================= */}

          <div className="button-group">
            <button
              type="button"
              className="cancel-btn"
              onClick={() => navigate(-1)}
            >
              ยกเลิก
            </button>

            <button type="button" className="submit-btn" onClick={handleSubmit}>
              {isResubmit ? "ส่งให้อาจารย์พิจารณาใหม่" : "ส่งข้อเสนอ"}
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}

export default SubmitNewProject;
