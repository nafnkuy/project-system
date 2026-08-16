import "./TeacherRequestDetail.css";
import { useNavigate, useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import axios from "axios";

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

  const userId = localStorage.getItem("userId");

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

        alert(
          err.response?.data?.message ||
            "ไม่สามารถโหลดรายละเอียดคำขอได้",
        );

        navigate("/teacher-home");
      })
      .finally(() => {
        setLoading(false);
      });
  }, [id, userId, navigate]);

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

      navigate("/teacher");
    } catch (err: any) {
      console.log("Approve error =", err);

      alert(
        err.response?.data?.message ||
          "ไม่สามารถอนุมัติคำขอได้",
      );
    } finally {
      setProcessing(false);
    }
  };

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

      navigate("/teacher");
    } catch (err: any) {
      console.log("Reject error =", err);

      alert(
        err.response?.data?.message ||
          "ไม่สามารถปฏิเสธคำขอได้",
      );
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="request-detail-loading">
        กำลังโหลดข้อมูล...
      </div>
    );
  }

  if (!request) {
    return (
      <div className="request-detail-loading">
        ไม่พบข้อมูลคำขอ
      </div>
    );
  }

  return (
    <div className="request-detail-layout">
      {/* Sidebar */}
      <aside className="request-sidebar">
        <div className="request-logo">
          <h2>SPTC System</h2>
          <p>ระบบติดตามและสื่อสารโครงงานนิสิต</p>
        </div>

        <nav>
          <ul>
            <li onClick={() => navigate("/teacher-home")}>
              หน้าหลัก
            </li>

            <li
              onClick={() =>
                navigate("/teacher-projects")
              }
            >
              จัดการหัวข้อโครงงาน
            </li>

            <li className="active">
              คำขอเข้าร่วมโครงงาน
            </li>

            <li>ภาระงานที่ปรึกษา</li>
            <li>ประวัติการพิจารณา</li>
            <li>การแจ้งเตือน</li>
            <li>ข้อมูลส่วนตัว</li>
          </ul>
        </nav>
      </aside>

      {/* Main */}
      <main className="request-main">

        {/* Header */}
        <header className="request-header">
          <h2>
            คำขอเข้าร่วมโครงงาน &gt; รายละเอียดคำขอเข้าร่วมโครงงาน
          </h2>
        </header>

        <div className="request-content">

          {/* Title + status */}
          <div className="request-title-row">
            <h3>คำขอสมัครเข้าร่วมโครงงาน</h3>

            <div className="request-meta">
              <span>
                วันที่ส่งคำขอ :{" "}
                {new Date(
                  request.request_date,
                ).toLocaleDateString("th-TH")}
              </span>

              <span>
                เวลาส่ง :{" "}
                {new Date(
                  request.request_date,
                ).toLocaleTimeString("th-TH", {
                  hour: "2-digit",
                  minute: "2-digit",
                })}{" "}
                น.
              </span>

              <span>
                สถานะ : {request.status}
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
                <strong>ชื่อโครงงาน :</strong>{" "}
                {request.title}
              </p>

              <p>
                <strong>อาจารย์ที่ปรึกษา :</strong>{" "}
                {request.advisor_name}
              </p>

              <p>
                <strong>ประเภทโครงงาน :</strong>{" "}
                {request.project_type}
              </p>

              <p>
                <strong>สาขาวิชา :</strong>{" "}
                {request.major}
              </p>

              <p>
                <strong>ปีการศึกษา :</strong>{" "}
                {request.academic_year}
              </p>

              <p>
                <strong>รับนิสิต :</strong>{" "}
                {request.current_members} /{" "}
                {request.max_members} คน
              </p>

              <h4>สมาชิกโครงงาน</h4>

              {request.members.length === 0 ? (
                <p>ยังไม่มีสมาชิก</p>
              ) : (
                request.members.map((member, index) => (
                  <div
                    className="member-row"
                    key={member.id}
                  >
                    {index + 1}. {member.username}{" "}
                    {member.name}
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
              <div className="readonly-box">
                {request.student_username}
              </div>

              <label>ชื่อ</label>
              <div className="readonly-box">
                {request.student_name}
              </div>

              <label>
                ช่องทางการติดต่อ
              </label>
              <div className="readonly-box">
                {request.contact_type} :{" "}
                {request.contact_value}
              </div>

              <label>แนะนำตัว</label>
              <textarea
                value={request.introduction || ""}
                readOnly
              />
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

            <h4>ทักษะที่เกี่ยวข้อง</h4>

            <div className="skills">
              {request.skills
                ?.split(",")
                .map((skill) => (
                  <span key={skill}>
                    {skill.trim()}
                  </span>
                ))}
            </div>

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
                    checked={request.status === "อนุมัติ"}
                    readOnly
                  />
                  อนุมัติ
                </label>

                <label>
                  <input
                    type="radio"
                    checked={request.status === "ปฏิเสธ"}
                    readOnly
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

          {/* Buttons */}
          <div className="request-actions">

            <button
              className="cancel-btn"
              onClick={() => navigate("/teacher-home")}
              disabled={processing}
            >
              ยกเลิก
            </button>

            <button
              className="reject-btn"
              onClick={handleReject}
              disabled={
                processing ||
                request.status !== "รอพิจารณา"
              }
            >
              ปฏิเสธ
            </button>

            <button
              className="approve-btn"
              onClick={handleApprove}
              disabled={
                processing ||
                request.status !== "รอพิจารณา"
              }
            >
              {processing
                ? "กำลังดำเนินการ..."
                : "บันทึกผลการพิจารณา"}
            </button>

          </div>
        </div>
      </main>
    </div>
  );
}

export default TeacherRequestDetail;