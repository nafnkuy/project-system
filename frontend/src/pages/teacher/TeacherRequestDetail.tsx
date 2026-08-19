import "./TeacherRequestDetail.css";
import { useNavigate, useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import axios from "axios";
import { FaBell } from "react-icons/fa";

import logo from "../../assets/Logo.svg";

interface Member {
  id: number;
  username: string;
  name: string;
}

interface RequestDetail {
  id: number;

  // ข้อมูลคำขอ
  request_date: string;
  status: string;
  contact_type: string;
  contact_value: string;
  introduction: string;

  // ข้อมูลนิสิต
  student_id: number;
  student_username: string;
  student_name: string;
  student_major: string;

  // ข้อมูลโครงงาน
  project_id: number;
  title: string;
  advisor_name: string;
  major: string;
  project_type: string;
  max_members: number;
  current_members: number;
  academic_year: string;

  description: string;
  objectives: string;
  skills: string;
  requirements: string;

  members: Member[];
}

function TeacherRequestDetail() {
  const navigate = useNavigate();
  const { id } = useParams();

  const [request, setRequest] = useState<RequestDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);

  const [decision, setDecision] = useState<"อนุมัติ" | "ปฏิเสธ" | "">("");

  // =========================
  // ข้อมูลอาจารย์
  // =========================
  const userId = sessionStorage.getItem("userId");
  const username = sessionStorage.getItem("username");
  const profileImage = sessionStorage.getItem("profileImage");

  // =========================
  // Logout
  // =========================
  const handleLogout = () => {
    sessionStorage.removeItem("userId");
    sessionStorage.removeItem("username");
    sessionStorage.removeItem("name");
    sessionStorage.removeItem("profileImage");
    sessionStorage.removeItem("major");

    navigate("/");
  };

  const skillStyles: Record<
    string,
    { backgroundColor: string; borderColor: string }
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
      backgroundColor: "#FDF2F8", // ชมพูพาสเทล
      borderColor: "#F472B6",
    },

    CSS: {
      backgroundColor: "#ECFDF5", // มิ้นต์พาสเทล
      borderColor: "#34D399",
    },

    JavaScript: {
      backgroundColor: "#FAF5FF", // ม่วงพาสเทล
      borderColor: "#C084FC",
    },

    "QR Code": {
      backgroundColor: "#FFEAF4",
      borderColor: "#E91E63", // ชมพูเข้ม
    },

    "API Integration": {
      backgroundColor: "#E8F8F5",
      borderColor: "#16A085", // เขียวอมฟ้า (Teal)
    },
  };

  // =========================
  // โหลดรายละเอียดคำขอ
  // =========================
  useEffect(() => {
    if (!userId) {
      navigate("/");
      return;
    }

    if (!id) return;

    axios
      .get(`http://localhost:5000/teacher/request/${id}/${userId}`)
      .then((res) => {
        console.log("Request Detail =", res.data);
        setRequest(res.data);
      })
      .catch((err) => {
        console.log("Get request detail error =", err);

        alert(err.response?.data?.message || "ไม่สามารถโหลดรายละเอียดคำขอได้");

        navigate("/teacher-home");
      })
      .finally(() => {
        setLoading(false);
      });
  }, [id, userId, navigate]);

  // =========================
  // อนุมัติ
  // =========================
  const handleApprove = async () => {
    if (!request) return;

    const confirmApprove = window.confirm(
      `ต้องการอนุมัติคำขอของ ${request.student_name} หรือไม่?`,
    );

    if (!confirmApprove) return;

    try {
      setProcessing(true);

      const res = await axios.post(
        `http://localhost:5000/teacher/request/${request.id}/approve`,
        {
          advisor_id: userId,
        },
      );

      alert(res.data.message);

      navigate("/teacher-home");
    } catch (err: any) {
      console.log("Approve error =", err);

      alert(err.response?.data?.message || "ไม่สามารถอนุมัติคำขอได้");
    } finally {
      setProcessing(false);
    }
  };

  // =========================
  // ปฏิเสธ
  // =========================
  const handleReject = async () => {
    if (!request) return;

    const confirmReject = window.confirm(
      `ต้องการปฏิเสธคำขอของ ${request.student_name} หรือไม่?`,
    );

    if (!confirmReject) return;

    try {
      setProcessing(true);

      const res = await axios.post(
        `http://localhost:5000/teacher/request/${request.id}/reject`,
        {
          advisor_id: userId,
        },
      );

      alert(res.data.message);

      navigate("/teacher-home");
    } catch (err: any) {
      console.log("Reject error =", err);

      alert(err.response?.data?.message || "ไม่สามารถปฏิเสธคำขอได้");
    } finally {
      setProcessing(false);
    }
  };

  // =========================
  // บันทึกผลการพิจารณา
  // =========================
  const handleSaveDecision = () => {
    if (!decision) {
      alert("กรุณาเลือกผลการพิจารณา");
      return;
    }

    if (decision === "อนุมัติ") {
      handleApprove();
      return;
    }

    if (decision === "ปฏิเสธ") {
      handleReject();
    }
  };

  // =========================
  // Loading
  // =========================
  if (loading) {
    return <div className="request-detail-loading">กำลังโหลดข้อมูล...</div>;
  }

  if (!request) {
    return <div className="request-detail-loading">ไม่พบข้อมูลคำขอ</div>;
  }

  return (
    <div className="teacher-request-detail-page">
      {/* ================= SIDEBAR ================= */}

      <aside className="sidebar">
        <div className="sidebar-logo">
          <img src={logo} alt="SPTC Logo" />

          <div>
            <h2>SPTC System</h2>
            <p>ระบบติดตามและสื่อสารโครงงานนิสิต</p>
          </div>
        </div>

        <nav>
          <ul>
            <li onClick={() => navigate("/teacher-home")}>หน้าหลัก</li>

            <li onClick={() => navigate("/teacher-projects")}>
              จัดการหัวข้อโครงงาน
            </li>

            <li className="active">คำขอเข้าร่วมโครงงาน</li>

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

      {/* ================= MAIN ================= */}

      <main className="main">
        {/* ================= HEADER ================= */}

        <header className="header">
          <h2>คำขอเข้าร่วมโครงงาน &gt; รายละเอียดคำขอเข้าร่วมโครงงาน</h2>

          <div className="header-right">
            {/* Notification */}
            <button className="notification-btn">
              <FaBell />
            </button>

            {/* User */}
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

        {/* ================= CONTENT ================= */}

        <div className="request-content">
          <div className="request-main-card">
            {/* ================= TITLE ================= */}

            <div className="request-title-row">
              <h3>คำขอสมัครเข้าร่วมโครงงาน</h3>

              <div className="request-meta">
                <span>
                  วันที่ส่งคำขอ :{" "}
                  {new Date(request.request_date).toLocaleDateString("th-TH")}
                </span>

                <span>
                  เวลาส่ง :{" "}
                  {new Date(request.request_date).toLocaleTimeString("th-TH", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}{" "}
                  น.
                </span>

                <span>
                  สถานะ :
                  <strong className={`request-status-text ${request.status}`}>
                    {request.status}
                  </strong>
                </span>
              </div>
            </div>

            {/* =========================
              ข้อมูลโครงงาน
          ========================= */}

            <section className="detail-card">
              <h3>ข้อมูลโครงงาน</h3>

              <div className="detail-divider" />

              <div className="project-info">
                <p>
                  <strong>ชื่อโครงงาน :</strong> {request.title}
                </p>

                <p>
                  <strong>อาจารย์ที่ปรึกษา :</strong> {request.advisor_name}
                </p>

                <p>
                  <strong>ประเภทโครงงาน :</strong> {request.project_type}
                </p>

                <p>
                  <strong>สาขาวิชา :</strong> {request.major}
                </p>

                <p>
                  <strong>ปีการศึกษา :</strong> {request.academic_year}
                </p>

                <p>
                  <strong>รับนิสิต :</strong> {request.current_members} /{" "}
                  {request.max_members} คน
                </p>

                <h4>สมาชิกโครงงาน</h4>

                {request.members.length === 0 ? (
                  <p>ยังไม่มีสมาชิก</p>
                ) : (
                  request.members.map((member, index) => (
                    <div className="member-row" key={member.id}>
                      {index + 1}. {member.username} {member.name}
                    </div>
                  ))
                )}
              </div>
            </section>

            {/* =========================
              ข้อมูลผู้สมัคร
          ========================= */}

            <section className="detail-card">
              <h3>ข้อมูลผู้สมัคร</h3>

              <div className="detail-divider" />

              <div className="applicant-info">
                <label>รหัสประจำตัว</label>

                <div className="readonly-box">{request.student_username}</div>

                <label>ชื่อ</label>

                <div className="readonly-box">{request.student_name}</div>

                <label>ช่องทางการติดต่อ</label>

                <div className="readonly-box">
                  {request.contact_type} : {request.contact_value}
                </div>

                <label>แนะนำตัว</label>

                <textarea value={request.introduction || ""} readOnly />
              </div>
            </section>

            {/* =========================
              รายละเอียดโครงงาน
          ========================= */}

            <section className="detail-card">
              <h3>รายละเอียดโครงงาน</h3>

              <div className="detail-divider" />

              <div className="text-section">
                <p>{request.description}</p>
              </div>

              <h4>วัตถุประสงค์</h4>

              <div className="text-section">
                <p>{request.objectives}</p>
              </div>

              <section className="detail-section">
                <h3>เทคโนโลยีที่ใช้</h3>

                <div className="tag-list">
                  {(request.skills || "").split("|").map((skill, index) => {
                    const style = skillStyles[skill] || {
                      backgroundColor: "#F3F4F6",
                      borderColor: "#D1D5DB",
                    };

                    return (
                      <span
                        key={index}
                        style={{
                          backgroundColor: style.backgroundColor,
                          border: `1px solid ${style.borderColor}`,
                        }}
                      >
                        {skill}
                      </span>
                    );
                  })}
                </div>
              </section>

              <h4>คุณสมบัติผู้สมัคร</h4>

              <div className="text-section">
                <p>{request.requirements}</p>
              </div>
            </section>

            {/* =========================
              ผลการพิจารณา
          ========================= */}

            <section className="detail-card result-card">
              <h3>ผลการพิจารณา</h3>

              <div className="detail-divider" />

              <div className="result-section">
                <label>สถานะ</label>

                <div className="radio-row">
                  <label>
                    <input
                      type="radio"
                      name="decision"
                      checked={decision === "อนุมัติ"}
                      onChange={() => setDecision("อนุมัติ")}
                    />
                    อนุมัติ
                  </label>

                  <label>
                    <input
                      type="radio"
                      name="decision"
                      checked={decision === "ปฏิเสธ"}
                      onChange={() => setDecision("ปฏิเสธ")}
                    />
                    ปฏิเสธ
                  </label>
                </div>

                <label>ความคิดเห็น</label>

                <textarea
                  className="comment-box"
                  placeholder="ความคิดเห็น"
                  disabled
                />
              </div>
            </section>

            {/* ================= BUTTONS ================= */}

            <div className="request-actions">
              <button
                className="cancel-btn"
                onClick={() => navigate("/teacher-home")}
                disabled={processing}
              >
                ยกเลิก
              </button>

              <button
                className="approve-btn"
                onClick={handleSaveDecision}
                disabled={
                  processing || request.status !== "รอพิจารณา" || !decision
                }
              >
                {processing ? "กำลังดำเนินการ..." : "บันทึกผลการพิจารณา"}
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default TeacherRequestDetail;
