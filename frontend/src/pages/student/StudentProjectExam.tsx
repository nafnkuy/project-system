
import "./StudentProjectDetail.css";
import "./StudentProjectExam.css";

import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";

import logo from "../../assets/Logo.svg";
import StudentNotificationBell from "./StudentNotificationBell";

/* =========================================================
   TYPE
========================================================= */

interface ExamProject {
  id: number;
  title: string;
  advisor_name: string | null;
}

interface ExamSchedule {
  id: number;
  project_id: number;

  exam_date: string;
  start_time: string;
  end_time: string;

  location: string;
  committee: string;
  notes: string | null;

  announced_at: string;
}

interface ExamResponse {
  project: ExamProject;
  schedule: ExamSchedule | null;
}

/* =========================================================
   COMPONENT
========================================================= */

function StudentProjectExam() {
  const navigate = useNavigate();
  const { projectId } = useParams();

  const userId = sessionStorage.getItem("userId");
  const username = sessionStorage.getItem("username");
  const profileImage = sessionStorage.getItem("profileImage");

  const [project, setProject] = useState<ExamProject | null>(null);
  const [schedule, setSchedule] = useState<ExamSchedule | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  /* =========================================================
     LOAD EXAM SCHEDULE
  ========================================================= */

  useEffect(() => {
    if (!userId) {
      navigate("/");
      return;
    }

    if (!projectId) {
      setError("ไม่พบรหัสโครงงาน");
      setLoading(false);
      return;
    }

    let cancelled = false;

    const loadExam = async () => {
      try {
        setLoading(true);
        setError("");

        const res = await axios.get<ExamResponse>(
          `http://localhost:5000/student/projects/${projectId}/exam/${userId}`
        );

        if (cancelled) return;

        setProject(res.data.project);
        setSchedule(res.data.schedule);

      } catch (err) {
        if (cancelled) return;

        console.log("Load student exam error:", err);

        if (axios.isAxiosError(err)) {
          setError(
            err.response?.data?.message ||
              "ไม่สามารถโหลดกำหนดการสอบได้"
          );
        } else {
          setError("ไม่สามารถโหลดกำหนดการสอบได้");
        }

      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    loadExam();

    return () => {
      cancelled = true;
    };
  }, [projectId, userId, navigate]);

  /* =========================================================
     DATE FORMAT
  ========================================================= */

  const formatExamDate = (value: string | null) => {
    if (!value) return "-";

    const parts = value.split("-").map(Number);

    if (parts.length !== 3 || parts.some(Number.isNaN)) {
      return "-";
    }

    const date = new Date(
      Date.UTC(parts[0], parts[1] - 1, parts[2])
    );

    return date.toLocaleDateString("th-TH", {
      timeZone: "UTC",
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const formatDateTime = (value: string | null) => {
    if (!value) return "-";

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) return "-";

    const dateText = date.toLocaleDateString("th-TH", {
      timeZone: "Asia/Bangkok",
      day: "numeric",
      month: "short",
      year: "numeric",
    });

    const timeText = date.toLocaleTimeString("th-TH", {
      timeZone: "Asia/Bangkok",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });

    return `${dateText} เวลา ${timeText} น.`;
  };

  /* =========================================================
     COMMITTEE LIST
  ========================================================= */

  const committeeList = schedule?.committee
    ? schedule.committee
        .split(/\r?\n|\|/)
        .map((item) => item.trim())
        .filter(Boolean)
    : [];

  /* =========================================================
     LOGOUT
  ========================================================= */

  const handleLogout = () => {
    sessionStorage.removeItem("userId");
    sessionStorage.removeItem("username");
    sessionStorage.removeItem("name");
    sessionStorage.removeItem("profileImage");
    sessionStorage.removeItem("major");

    navigate("/");
  };

  /* =========================================================
     RENDER
  ========================================================= */

  return (
    <div className="student-project-detail-page s058-page">

      {/* SIDEBAR */}

      <aside className="student-detail-sidebar">
        <div className="student-detail-logo">
          <img src={logo} alt="SPTC Logo" />

          <div>
            <h2>SPTC System</h2>
            <p>ระบบติดตามและสื่อสารโครงงานนิสิต</p>
          </div>
        </div>

        <nav>
          <ul>
            <li onClick={() => navigate("/StudentHome")}>
              หน้าหลัก
            </li>

            <li onClick={() => navigate("/teachers")}>
              รายชื่ออาจารย์
            </li>

            <li onClick={() => navigate("/submit-new-project")}>
              ส่งคำเสนอโครงงานใหม่
            </li>

            <li
              className="active"
              onClick={() => navigate("/student-project")}
            >
              โครงงานของฉัน
            </li>

            <li
              onClick={() => navigate("/student-notifications")}
            >
              การแจ้งเตือน
            </li>

            <li>ข้อมูลส่วนตัว</li>
          </ul>
        </nav>

        <button
          className="student-detail-logout"
          onClick={handleLogout}
        >
          ออกจากระบบ
        </button>
      </aside>

      {/* MAIN */}

      <main className="student-detail-main">

        {/* HEADER */}

        <header className="student-detail-header">
          <h2>
            <span
              className="student-detail-breadcrumb"
              onClick={() => navigate("/student-project")}
            >
              โครงงานของฉัน
            </span>

            {" > "}

            <span
              className="student-detail-breadcrumb"
              onClick={() =>
                navigate(`/student-project-detail/${projectId}`)
              }
            >
              รายละเอียดโครงงาน
            </span>

            {" > "}กำหนดการสอบ
          </h2>

          <div className="student-detail-header-right">
            <StudentNotificationBell />

            <div className="student-detail-user">
              <img
                src={
                  profileImage
                    ? `http://localhost:5000${profileImage}`
                    : logo
                }
                alt="Profile"
              />
              <span>{username}</span>
            </div>
          </div>
        </header>

        {/* CONTENT */}

        <div className="student-detail-content">

          {/* PROJECT TITLE */}

          <div className="student-detail-project-heading">
            <h3>{project?.title || "-"}</h3>

            <p>
              อัปเดตล่าสุด :{" "}
              {schedule
                ? formatDateTime(schedule.announced_at)
                : "-"}
            </p>
          </div>

          {/* TABS */}

          <div className="student-detail-tabs">
            <button
              onClick={() =>
                navigate(`/student-project-detail/${projectId}`)
              }
            >
              ภาพรวม
            </button>

            <button
              onClick={() =>
                navigate(`/student-project-detail/${projectId}/plan`)
              }
            >
              แผนงาน
            </button>

            <button
              onClick={() =>
                navigate(`/student-project-detail/${projectId}/documents`)
              }
            >
              เอกสารและการส่งงาน
            </button>

            <button className="active">
              กำหนดการสอบ
            </button>

            <button
              type="button"
              onClick={() =>
                navigate(`/student-project-detail/${projectId}/evaluation`)
              }
            >
              ผลการประเมิน
            </button>
          </div>

          {/* EXAM CONTENT */}

          <section className="s058-container">
            <h3>กำหนดการสอบ</h3>

            {loading ? (
              <div className="s058-center-message">
                กำลังโหลดกำหนดการสอบ...
              </div>

            ) : error ? (
              <div className="s058-center-message">
                {error}
              </div>

            ) : !schedule ? (

              /* S058 - NO SCHEDULE */

              <div className="s058-empty-wrapper">
                <div className="s058-empty-card">
                  <h4>ยังไม่มีกำหนดการสอบ</h4>

                  <div className="s058-divider" />

                  <p>
                    อาจารย์ยังไม่ได้ประกาศกำหนดการสอบโครงงาน
                  </p>

                  <p>
                    เมื่อมีการกำหนดวัน เวลา และสถานที่สอบ
                    <br />
                    รายละเอียดจะแสดงในหน้านี้และระบบจะแจ้งเตือนให้ทราบ
                  </p>
                </div>
              </div>

            ) : (

              /* S059 - ANNOUNCED SCHEDULE */

              <div className="s058-exam-card">

                <div className="s058-card-heading">
                  <strong>การสอบโครงงาน</strong>
                  <span className="s058-status">
                    กำหนดแล้ว
                  </span>
                </div>

                <div className="s058-divider" />

                <div className="s058-basic-info">
                  <p>
                    วันที่สอบ : {formatExamDate(schedule.exam_date)}
                  </p>

                  <p>
                    เวลา : {schedule.start_time} -{" "}
                    {schedule.end_time} น.
                  </p>

                  <p>
                    สถานที่ : {schedule.location}
                  </p>

                  <p>
                    อาจารย์ที่ปรึกษา :{" "}
                    {project?.advisor_name || "-"}
                  </p>
                </div>

                <div className="s058-info-section">
                  <h4>คณะกรรมการสอบ</h4>

                  {committeeList.length > 0 ? (
                    <ul>
                      {committeeList.map((name, index) => (
                        <li key={index}>{name}</li>
                      ))}
                    </ul>
                  ) : (
                    <p>-</p>
                  )}
                </div>

                <div className="s058-info-section">
                  <h4>หมายเหตุ</h4>

                  <p className="s058-notes">
                    {schedule.notes || "-"}
                  </p>
                </div>

                <p className="s058-announced-date">
                  ประกาศเมื่อ :{" "}
                  {formatDateTime(schedule.announced_at)}
                </p>

              </div>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}

export default StudentProjectExam;
