import "./StudentProjectRequestDetail.css";

import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { FaBell } from "react-icons/fa";
import axios from "axios";

import logo from "../../assets/Logo.svg";

/* =========================================================
   TYPE
========================================================= */

interface Member {
  id: number;
  username: string;
  name: string;
}

interface RequestDetail {
  request_id: number;
  project_id: number;
  student_id: number;

  request_status: string;

  request_date: string;
  decision_date: string | null;

  suggestion: string | null;
  rejection_reason: string | null;
  introduction: string | null;

  title: string;
  project_type: string;
  major: string;
  academic_year: string | null;

  description: string | null;
  objectives: string | null;
  skills: string | null;
  requirements: string | null;

  source: "teacher" | "student";
  max_members: number;

  advisor_id: number;
  advisor_name: string;

  members: Member[];
}

/* =========================================================
   SKILL COLORS
========================================================= */

const skillStyles: Record<
  string,
  {
    backgroundColor: string;
    borderColor: string;
  }
> = {
  React: {
    backgroundColor: "#DBEAFE",
    borderColor: "#4385F5",
  },

  "Node.js": {
    backgroundColor: "#DCFCE7",
    borderColor: "#30BF2D",
  },

  MySQL: {
    backgroundColor: "#FFEDD5",
    borderColor: "#FF8A05",
  },

  Git: {
    backgroundColor: "#FEE2E2",
    borderColor: "#DD5245",
  },

  Python: {
    backgroundColor: "#FEF3C7",
    borderColor: "#EEB400",
  },

  RFID: {
    backgroundColor: "#F3E8FF",
    borderColor: "#BB38FF",
  },

  AI: {
    backgroundColor: "#E0E7FF",
    borderColor: "#055DF2",
  },

  HTML: {
    backgroundColor: "#FDF2F8",
    borderColor: "#F472B6",
  },

  CSS: {
    backgroundColor: "#ECFDF5",
    borderColor: "#34D399",
  },

  JavaScript: {
    backgroundColor: "#FAF5FF",
    borderColor: "#C084FC",
  },

  "QR Code": {
    backgroundColor: "#FFEAF4",
    borderColor: "#E91E63",
  },

  "API Integration": {
    backgroundColor: "#E8F8F5",
    borderColor: "#16A085",
  },
};

/* ถ้าเจอ Technology ที่ยังไม่ได้กำหนดสี */
const defaultSkillStyle = {
  backgroundColor: "#F3F4F6",
  borderColor: "#BFC4CC",
};

/* =========================================================
   COMPONENT
========================================================= */

function StudentProjectRequestDetail() {
  const navigate = useNavigate();

  const { requestId, studentId } = useParams();

  const username = sessionStorage.getItem("username");

  const profileImage = sessionStorage.getItem("profileImage");

  const [request, setRequest] = useState<RequestDetail | null>(null);

  const [loading, setLoading] = useState(true);

  /* =========================================================
     LOAD DATA
  ========================================================= */

  useEffect(() => {
    if (!requestId || !studentId) return;

    axios
      .get(
        `http://localhost:5000/student/request-detail/${requestId}/${studentId}`,
      )
      .then((res) => {
        console.log("Student Request Detail =", res.data);

        setRequest(res.data);
      })
      .catch((err) => {
        console.log("Get request detail error:", err);

        alert("ไม่สามารถโหลดรายละเอียดคำขอได้");

        navigate("/student-project");
      })
      .finally(() => {
        setLoading(false);
      });
  }, [requestId, studentId, navigate]);

  /* =========================================================
     DATE
  ========================================================= */

  const formatThaiDate = (dateString: string | null) => {
    if (!dateString) return "-";

    const date = new Date(dateString);

    return date.toLocaleDateString("th-TH", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  /* =========================================================
     TIME
  ========================================================= */

  const formatThaiTime = (dateString: string | null) => {
    if (!dateString) return "-";

    const date = new Date(dateString);

    return date.toLocaleTimeString("th-TH", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  /* =========================================================
     STATUS
  ========================================================= */

  const getStatusLabel = (status: string) => {
    if (status === "ปฏิเสธ") {
      return "ไม่อนุมัติ";
    }

    return status;
  };

  const getStatusClass = (status: string) => {
    switch (status) {
      case "รอพิจารณา":
        return "pending";

      case "ต้องแก้ไข":
        return "revision";

      case "ปฏิเสธ":
        return "rejected";

      case "อนุมัติ":
        return "approved";

      default:
        return "";
    }
  };

  /* =========================================================
     OBJECTIVES
  ========================================================= */

  const getObjectives = () => {
    if (!request?.objectives) {
      return [];
    }

    return request.objectives
      .split(/\||\n/)
      .map((item) => item.trim())
      .filter(Boolean);
  };

  /* =========================================================
     SKILLS
  ========================================================= */

  const getSkills = () => {
    if (!request?.skills) {
      return [];
    }

    return request.skills
      .split(/\||,/)
      .map((item) => item.trim())
      .filter(Boolean);
  };

  /* =========================================================
     EDIT
  ========================================================= */

  const handleEditRequest = () => {
    if (!request) return;

    navigate(
      `/submit-new-project?mode=resubmit&projectId=${request.project_id}&requestId=${request.request_id}`,
    );
  };

  /* =========================================================
     LOGOUT
  ========================================================= */

  const handleLogout = () => {
    sessionStorage.clear();

    navigate("/");
  };

  /* =========================================================
     LOADING
  ========================================================= */

  if (loading) {
    return <div className="student-request-loading">กำลังโหลดข้อมูล...</div>;
  }

  if (!request) {
    return <div className="student-request-loading">ไม่พบข้อมูลคำขอ</div>;
  }

  const objectives = getObjectives();

  const skills = getSkills();

  /* =========================================================
     RENDER
  ========================================================= */

  return (
    <div className="student-request-page">
      {/* ================= SIDEBAR ================= */}

      <aside className="student-request-sidebar">
        <div className="student-request-logo">
          <img src={logo} alt="SPTC Logo" />

          <div>
            <h2>SPTC System</h2>

            <p>ระบบติดตามและสื่อสารโครงงานนิสิต</p>
          </div>
        </div>

        <nav>
          <ul>
            <li onClick={() => navigate("/StudentHome")}>หน้าหลัก</li>

            <li onClick={() => navigate("/teachers")}>รายชื่ออาจารย์</li>

            <li onClick={() => navigate("/submit-new-project")}>
              ส่งคำเสนอโครงงานใหม่
            </li>

            <li className="active" onClick={() => navigate("/student-project")}>
              โครงงานของฉัน
            </li>

            <li>การแจ้งเตือน</li>

            <li>ข้อมูลส่วนตัว</li>
          </ul>
        </nav>

        <button className="student-request-logout" onClick={handleLogout}>
          ออกจากระบบ
        </button>
      </aside>

      {/* ================= MAIN ================= */}

      <main className="student-request-main">
        {/* ================= HEADER ================= */}

        <header className="student-request-header">
          <h2>โครงงานของฉัน &gt; รายละเอียดคำขอ</h2>

          <div className="student-request-header-right">
            <button className="student-request-bell">
              <FaBell />
            </button>

            <div className="student-request-user">
              <img
                src={
                  profileImage ? `http://localhost:5000${profileImage}` : logo
                }
                alt="Profile"
              />

              <span>{username}</span>
            </div>
          </div>
        </header>

        {/* ================= CONTENT ================= */}

        <div className="student-request-content">
          <div className="student-request-card">
            {/* ================= TITLE ================= */}

            <div className="student-request-title-row">
              <h3>{request.title}</h3>

              <span className="student-request-status">
                <span>สถานะ :</span>

                <strong
                  className={`student-request-status-value ${getStatusClass(
                    request.request_status,
                  )}`}
                >
                  {getStatusLabel(request.request_status)}
                </strong>
              </span>
            </div>

            {/* ================= ข้อมูลคำขอ ================= */}

            <section className="student-request-section">
              <h4>ข้อมูลคำขอ</h4>

              <div className="student-request-line" />

              <p>
                ประเภทคำขอ :{" "}
                {request.source === "student"
                  ? "เสนอหัวข้อโครงงาน"
                  : "สมัครเข้าร่วมโครงงาน"}
              </p>

              <p>วันที่ส่งคำขอ : {formatThaiDate(request.request_date)}</p>

              <p>เวลา : {formatThaiTime(request.request_date)} น.</p>
            </section>

            {/* ================= ข้อมูลโครงงาน ================= */}

            <section className="student-request-section">
              <h4>ข้อมูลโครงงาน</h4>

              <div className="student-request-line" />

              <p>อาจารย์ที่ปรึกษา : {request.advisor_name || "-"}</p>

              <p>ประเภทโครงงาน : {request.project_type || "-"}</p>

              <p>สาขาวิชา : {request.major || "-"}</p>

              <p>ปีการศึกษา : {request.academic_year || "-"}</p>

              <div className="student-request-member-title">
                สมาชิกในโครงงาน ({request.members.length}/{request.max_members})
              </div>

              <div className="student-request-members">
                {request.members.map((member) => (
                  <p key={member.id}>
                    {member.username} {member.name}
                  </p>
                ))}
              </div>
            </section>

            {/* ================= รายละเอียด ================= */}

            <section className="student-request-section">
              <h4>รายละเอียดโครงงาน</h4>

              <div className="student-request-line" />

              <p className="student-request-description">
                {request.description || "-"}
              </p>
            </section>

            {/* ================= วัตถุประสงค์ ================= */}

            <section className="student-request-section">
              <h4>วัตถุประสงค์</h4>

              <div className="student-request-line" />

              {objectives.length > 0 ? (
                <ul className="student-request-objectives">
                  {objectives.map((item, index) => (
                    <li key={index}>{item}</li>
                  ))}
                </ul>
              ) : (
                <p>-</p>
              )}
            </section>

            {/* ================= เทคโนโลยี ================= */}

            <section className="student-request-section">
              <h4>เทคโนโลยีที่ใช้</h4>

              <div className="student-request-line" />

              <div className="student-request-skills">
                {skills.length > 0 ? (
                  skills.map((skill, index) => {
                    const style = skillStyles[skill] || defaultSkillStyle;

                    return (
                      <span
                        key={index}
                        className="student-request-skill"
                        style={{
                          backgroundColor: style.backgroundColor,

                          borderColor: style.borderColor,
                        }}
                      >
                        {skill}
                      </span>
                    );
                  })
                ) : (
                  <p>-</p>
                )}
              </div>
            </section>

            {/* =================================================
                ผลการพิจารณา
                ไม่แสดงตอนรอพิจารณา
            ================================================= */}

            {request.request_status !== "รอพิจารณา" && (
              <section className="student-request-section student-request-decision">
                <h4>ผลการพิจารณา</h4>

                <div className="student-request-line" />

                <p>ผู้พิจารณา : {request.advisor_name}</p>

                <p>วันที่พิจารณา : {formatThaiDate(request.decision_date)}</p>

                <p>เวลา : {formatThaiTime(request.decision_date)} น.</p>

                {/* ===== ต้องแก้ไข ===== */}

                {request.request_status === "ต้องแก้ไข" && (
                  <div className="student-request-feedback">
                    <strong>ข้อเสนอแนะจากอาจารย์</strong>

                    <div className="student-request-feedback-box">
                      {request.suggestion || "-"}
                    </div>
                  </div>
                )}

                {/* ===== ปฏิเสธ ===== */}

                {request.request_status === "ปฏิเสธ" && (
                  <div className="student-request-feedback">
                    <strong>เหตุผล</strong>

                    <div className="student-request-feedback-box">
                      {request.rejection_reason || "อาจารย์ไม่ได้ระบุเหตุผล"}
                    </div>
                  </div>
                )}
              </section>
            )}

            {/* ================= BUTTON ================= */}

            <div className="student-request-actions">
              <button
                className="student-request-back-btn"
                onClick={() => navigate("/student-project")}
              >
                ย้อนกลับ
              </button>

              {request.request_status === "ต้องแก้ไข" && (
                <button
                  className="student-request-edit-btn"
                  onClick={handleEditRequest}
                >
                  แก้ไขคำขอ
                </button>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default StudentProjectRequestDetail;
