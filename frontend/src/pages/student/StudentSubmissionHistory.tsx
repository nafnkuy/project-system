import "./StudentTaskDetail.css";
import "./StudentSubmissionHistory.css";

import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";

import {
  FaArrowLeft,
  FaPaperclip,
  FaFileAlt,
  FaChevronDown,
  FaChevronUp,
} from "react-icons/fa";

import logo from "../../assets/Logo.svg";
import StudentNotificationBell from "./StudentNotificationBell";

const API_URL = "http://localhost:5000";

/* =========================================================
   INTERFACES
========================================================= */

interface HistoryFile {
  id: number;
  original_name: string;
  file_path: string;
  file_size: number | null;
  mime_type: string | null;
}

interface SubmissionHistory {
  id: number;
  task_id: number;
  submission_number: number;
  student_id: number | null;

  student_name: string | null;
  submission_note: string | null;
  submitted_at: string;

  review_status: string;
  reviewed_at: string | null;
  reviewed_by: number | null;
  reviewer_name: string | null;
  teacher_comment: string | null;

  files: HistoryFile[];
  teacher_files: HistoryFile[];
}

interface HistoryTask {
  id: number;
  project_id: number;
  task_name: string;
  review_status: string;
  project_title: string;
  phase_name: string | null;
}

interface HistoryResponse {
  task: HistoryTask;
  history: SubmissionHistory[];
}

/* =========================================================
   COMPONENT
========================================================= */

function StudentSubmissionHistory() {
  const navigate = useNavigate();

  const { projectId, taskId } = useParams();

  const userId = sessionStorage.getItem("userId");
  const username = sessionStorage.getItem("username");
  const profileImage = sessionStorage.getItem("profileImage");

  /* =========================================================
     STATES
  ========================================================= */

  const [task, setTask] = useState<HistoryTask | null>(null);

  const [history, setHistory] = useState<SubmissionHistory[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // เปิดดูรายละเอียดของรอบล่าสุดเป็นค่าเริ่มต้น
  const [openRound, setOpenRound] = useState<number | null>(null);

  /* =========================================================
     LOAD SUBMISSION HISTORY
  ========================================================= */

  useEffect(() => {
    if (!userId) {
      navigate("/");
      return;
    }

    if (!taskId || !projectId) {
      setError("ไม่พบข้อมูลโครงงานหรืองาน");
      setLoading(false);
      return;
    }

    let cancelled = false;

    const loadHistory = async () => {
      try {
        setLoading(true);
        setError("");

        const res = await axios.get<HistoryResponse>(
          `${API_URL}/student/tasks/${taskId}/submission-history/${userId}`,
        );

        if (cancelled) return;

        if (Number(res.data.task.project_id) !== Number(projectId)) {
          setError("งานนี้ไม่ได้อยู่ในโครงงานที่เลือก");
          return;
        }

        setTask(res.data.task);

        const submissions = res.data.history || [];

        setHistory(submissions);

        // เปิดรอบล่าสุดก่อน
        setOpenRound(submissions[0]?.id ?? null);
      } catch (err: unknown) {
        if (cancelled) return;

        console.log("Load submission history error:", err);

        let message = "ไม่สามารถโหลดประวัติการส่งงานได้";

        if (axios.isAxiosError(err)) {
          message = err.response?.data?.message || message;
        }

        setError(message);
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    loadHistory();

    return () => {
      cancelled = true;
    };
  }, [taskId, projectId, userId, navigate]);

  /* =========================================================
     THAI DATE FORMAT
  ========================================================= */

  const formatThaiDateTime = (value: string | null) => {
    if (!value) return "-";

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return "-";
    }

    return (
      date.toLocaleString("th-TH", {
        timeZone: "Asia/Bangkok",
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      }) + " น."
    );
  };

  /* =========================================================
     STATUS
  ========================================================= */

  const getStatusText = (status: string) => {
    if (status === "แก้ไข") return "ต้องแก้ไข";
    return status;
  };

  const getStatusClass = (status: string) => {
    if (status === "ผ่าน") return "ssh-passed";
    if (status === "แก้ไข") return "ssh-revision";
    if (status === "รอตรวจ") return "ssh-waiting";

    return "ssh-other";
  };

  /* =========================================================
     NAVIGATION
  ========================================================= */

  const goDocuments = () => {
    navigate(`/student-project-detail/${projectId}/documents`);
  };

  const handleLogout = () => {
    sessionStorage.clear();
    navigate("/");
  };

  /* =========================================================
     RENDER
  ========================================================= */

  return (
    <div className="student-task-page">
      {/* SIDEBAR */}

      <aside className="student-task-sidebar">
        <div className="student-task-logo">
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

            <li onClick={() => navigate("/student-notifications")}>
              การแจ้งเตือน
            </li>

            <li>ข้อมูลส่วนตัว</li>
          </ul>
        </nav>

        <button
          type="button"
          className="student-task-logout"
          onClick={handleLogout}
        >
          ออกจากระบบ
        </button>
      </aside>

      {/* MAIN */}

      <main className="student-task-main">
        {/* HEADER */}

        <header className="student-task-header">
          <h2>
            <span
              className="student-task-breadcrumb"
              onClick={() => navigate("/student-project")}
            >
              โครงงานของฉัน
            </span>

            {" > "}

            <span
              className="student-task-breadcrumb"
              onClick={() => navigate(`/student-project-detail/${projectId}`)}
            >
              รายละเอียดโครงงาน
            </span>

            {" > "}

            <span className="student-task-breadcrumb" onClick={goDocuments}>
              เอกสารและการส่งงาน
            </span>

            {" > "}

            <span>ประวัติการส่งงาน</span>
          </h2>

          <div className="student-task-header-right">
            <StudentNotificationBell />

            <div className="student-task-user">
              <img
                src={profileImage ? `${API_URL}${profileImage}` : logo}
                alt="Profile"
              />

              <span>{username || "-"}</span>
            </div>
          </div>
        </header>

        {/* CONTENT */}

        <div className="student-task-content">
          {/* PROJECT NAME */}

          <div className="student-task-project-heading">
            <h3>{task?.project_title || "-"}</h3>
          </div>

          {/* TABS */}

          <div className="student-task-tabs">
            <button
              type="button"
              onClick={() => navigate(`/student-project-detail/${projectId}`)}
            >
              ภาพรวม
            </button>

            <button
              type="button"
              onClick={() =>
                navigate(`/student-project-detail/${projectId}/plan`)
              }
            >
              แผนงาน
            </button>

            <button type="button" className="active" onClick={goDocuments}>
              เอกสารและการส่งงาน
            </button>

            <button type="button" disabled>
              กำหนดการสอบ
            </button>

            <button type="button" disabled>
              ผลการประเมิน
            </button>
          </div>

          {/* HISTORY CONTAINER */}

          <section className="ssh-container">
            <div className="ssh-heading">
              <h3>ประวัติการส่งงาน</h3>

              <button
                type="button"
                className="ssh-back-link"
                onClick={goDocuments}
              >
                <FaArrowLeft />
                กลับไปยังรายการเอกสาร
              </button>
            </div>

            {/* LOADING / ERROR */}

            {loading ? (
              <div className="ssh-message">กำลังโหลดประวัติการส่งงาน...</div>
            ) : error ? (
              <div className="ssh-message">{error}</div>
            ) : (
              <>
                {/* TASK INFORMATION */}

                <div className="ssh-task-info">
                  <h4>{task?.task_name || "-"}</h4>

                  <p>Phase : {task?.phase_name || "-"}</p>

                  <p>จำนวนครั้งที่ส่ง : {history.length} ครั้ง</p>
                </div>

                {/* HISTORY LIST */}

                {history.length === 0 ? (
                  <div className="ssh-message">
                    ยังไม่มีประวัติการส่งงานที่บันทึกไว้
                  </div>
                ) : (
                  <div className="ssh-history-list">
                    {history.map((submission) => {
                      const isOpen = openRound === submission.id;

                      return (
                        <div className="ssh-round-card" key={submission.id}>
                          {/* ROUND HEADER */}

                          <button
                            type="button"
                            className="ssh-round-header"
                            aria-expanded={isOpen}
                            onClick={() =>
                              setOpenRound(isOpen ? null : submission.id)
                            }
                          >
                            <span className="ssh-round-title">
                              ส่งครั้งที่ {submission.submission_number}
                            </span>

                            <span className="ssh-round-header-right">
                              <span
                                className={`ssh-status ${getStatusClass(
                                  submission.review_status,
                                )}`}
                              >
                                {getStatusText(submission.review_status)}
                              </span>

                              {isOpen ? <FaChevronUp /> : <FaChevronDown />}
                            </span>
                          </button>

                          {/* ROUND DETAILS */}

                          {isOpen && (
                            <div className="ssh-round-body">
                              {/* SUBMISSION INFO */}

                              <div className="ssh-info">
                                <p>
                                  วันที่ส่ง :{" "}
                                  {formatThaiDateTime(submission.submitted_at)}
                                </p>

                                <p>ผู้ส่ง : {submission.student_name || "-"}</p>
                              </div>

                              {/* SUBMISSION NOTE */}

                              {submission.submission_note && (
                                <div className="ssh-section">
                                  <h4>หมายเหตุการส่งงาน</h4>

                                  <div className="ssh-note">
                                    {submission.submission_note}
                                  </div>
                                </div>
                              )}

                              {/* STUDENT FILES */}

                              <div className="ssh-section">
                                <h4>เอกสารที่นิสิตส่ง</h4>

                                {submission.files.length === 0 ? (
                                  <p className="ssh-no-file">
                                    ไม่มีข้อมูลไฟล์ที่ส่ง
                                  </p>
                                ) : (
                                  <div className="ssh-file-list">
                                    {submission.files.map((file) => (
                                      <a
                                        key={file.id}
                                        className="ssh-file"
                                        href={`${API_URL}${file.file_path}`}
                                        target="_blank"
                                        rel="noreferrer"
                                      >
                                        <FaFileAlt />

                                        <span>{file.original_name}</span>

                                        <FaPaperclip />
                                      </a>
                                    ))}
                                  </div>
                                )}
                              </div>

                              {/* REVIEW RESULT */}

                              <div className="ssh-review-box">
                                <h4>ผลการตรวจงาน</h4>

                                <div className="ssh-divider" />

                                <div className="ssh-info">
                                  <p>
                                    สถานะการตรวจ :{" "}
                                    <span
                                      className={`ssh-status ${getStatusClass(
                                        submission.review_status,
                                      )}`}
                                    >
                                      {getStatusText(submission.review_status)}
                                    </span>
                                  </p>

                                  {submission.reviewed_at ? (
                                    <>
                                      <p>
                                        ตรวจโดย :{" "}
                                        {submission.reviewer_name || "-"}
                                      </p>

                                      <p>
                                        วันที่ตรวจ :{" "}
                                        {formatThaiDateTime(
                                          submission.reviewed_at,
                                        )}
                                      </p>
                                    </>
                                  ) : (
                                    <p>อยู่ระหว่างรออาจารย์ตรวจงาน</p>
                                  )}
                                </div>

                                {/* TEACHER COMMENT */}

                                {submission.reviewed_at && (
                                  <div className="ssh-section">
                                    <h4>ข้อเสนอแนะจากอาจารย์</h4>

                                    <div className="ssh-note">
                                      {submission.teacher_comment || "-"}
                                    </div>
                                  </div>
                                )}

                                {/* TEACHER FILES */}

                                {submission.teacher_files.length > 0 && (
                                  <div className="ssh-section">
                                    <h4>ไฟล์จากอาจารย์</h4>

                                    <div className="ssh-file-list">
                                      {submission.teacher_files.map((file) => (
                                        <a
                                          key={file.id}
                                          className="ssh-file"
                                          href={`${API_URL}${file.file_path}`}
                                          target="_blank"
                                          rel="noreferrer"
                                        >
                                          <FaPaperclip />

                                          <span>{file.original_name}</span>
                                        </a>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </>
            )}

            {/* BACK BUTTON */}

            <div className="ssh-actions">
              <button
                type="button"
                className="ssh-back-btn"
                onClick={goDocuments}
              >
                กลับไปยังเอกสารและการส่งงาน
              </button>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}

export default StudentSubmissionHistory;
