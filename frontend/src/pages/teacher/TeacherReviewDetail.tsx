import "./TeacherWork.css";
import "./TeacherReviewDetail.css";

import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";

import { FaPaperclip, FaDownload } from "react-icons/fa";

import logo from "../../assets/Logo.svg";
import TeacherNotificationBell from "./TeacherNotificationBell";

/* =========================================================
   TYPE
========================================================= */

interface ReviewTask {
  id: number;
  project_id: number;
  task_name: string;
  description: string | null;
  status: string;
  review_status: string;
  start_date: string | null;
  due_date: string | null;
  submission_note: string | null;
  submitted_at: string | null;
  reviewed_at: string | null;
  reviewed_by_name: string | null;
  teacher_comment: string | null;
  teacher_file: string | null;
  project_title: string;
  phase_name: string;
  phase_order: number;
  assignee_name: string | null;
}

interface ReviewSubtask {
  id: number;
  subtask_name: string;
  status: string;
}

interface ReviewFile {
  id: number;
  original_name: string;
  file_path: string;
  file_size: number | null;
  uploader_name: string | null;
}

interface ReviewResponse {
  task: ReviewTask;
  subtasks: ReviewSubtask[];
  files: ReviewFile[];
}

type ReviewDecision = "" | "ผ่าน" | "แก้ไข";

/* =========================================================
   COMPONENT
========================================================= */

function TeacherReviewDetail() {
  const navigate = useNavigate();
  const { taskId } = useParams();

  const userId = sessionStorage.getItem("userId");
  const username = sessionStorage.getItem("username");
  const profileImage = sessionStorage.getItem("profileImage");

  /* =========================================================
     STATE
  ========================================================= */

  const [taskData, setTaskData] = useState<ReviewResponse | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [decision, setDecision] = useState<ReviewDecision>("");

  const [teacherComment, setTeacherComment] = useState("");
  const [teacherFiles, setTeacherFiles] = useState<File[]>([]);

  const [savingReview, setSavingReview] = useState(false);

  /* =========================================================
   VALIDATE TEACHER FILE
========================================================= */

  const validateTeacherFile = (file: File) => {
    const allowedExtensions = [
      "pdf",
      "doc",
      "docx",
      "ppt",
      "pptx",
      "jpg",
      "jpeg",
      "png",
    ];

    const extension = file.name.split(".").pop()?.toLowerCase();

    if (!extension || !allowedExtensions.includes(extension)) {
      alert(`ไม่รองรับไฟล์ ${file.name}`);
      return false;
    }

    if (file.size > 10 * 1024 * 1024) {
      alert(`ไฟล์ ${file.name} ต้องมีขนาดไม่เกิน 10 MB`);
      return false;
    }

    return true;
  };

  /* =========================================================
   DASHBOARD COUNT
========================================================= */

  const [pendingReviewCount, setPendingReviewCount] = useState<number | null>(
    null,
  );

  useEffect(() => {
    if (!userId) return;

    axios
      .get(`http://localhost:5000/teacher/work/reviews/${userId}`)
      .then((res) => {
        const tasks = res.data.tasks || [];

        const pending = tasks.filter(
          (task: { review_status: string }) => task.review_status === "รอตรวจ",
        );

        setPendingReviewCount(pending.length);
      })
      .catch((err) => {
        console.log("Load pending count error:", err);
        setPendingReviewCount(null);
      });
  }, [userId]);

  /* =========================================================
     LOAD DATA
  ========================================================= */

  useEffect(() => {
    if (!userId) {
      navigate("/");
      return;
    }

    if (!taskId) {
      setError("ไม่พบรหัสงาน");
      setLoading(false);
      return;
    }

    let cancelled = false;

    axios
      .get(`http://localhost:5000/teacher/work/review/${taskId}/${userId}`)
      .then((res) => {
        if (!cancelled) {
          setTaskData(res.data);
          setError("");
        }
      })
      .catch((err) => {
        console.log("Get review detail error:", err);

        if (!cancelled) {
          setError(
            err.response?.data?.message || "ไม่สามารถโหลดรายละเอียดงานได้",
          );
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [taskId, userId, navigate]);

  /* =========================================================
     PROGRESS
  ========================================================= */

  const completedSubtasks = useMemo(() => {
    if (!taskData) return 0;

    return taskData.subtasks.filter((item) => item.status === "เสร็จสิ้น")
      .length;
  }, [taskData]);

  const progress = useMemo(() => {
    if (!taskData || taskData.subtasks.length === 0) {
      return 0;
    }

    return Math.round((completedSubtasks / taskData.subtasks.length) * 100);
  }, [taskData, completedSubtasks]);

  /* =========================================================
     DATE
  ========================================================= */

  const formatThaiDate = (value: string | null) => {
    if (!value) return "-";

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) return "-";

    return date.toLocaleDateString("th-TH", {
      day: "numeric",
      month: "short",
      year: "numeric",
      timeZone: "Asia/Bangkok",
    });
  };

  const formatThaiDateTime = (value: string | null) => {
    if (!value) return "-";

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) return "-";

    return (
      date.toLocaleString("th-TH", {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
        timeZone: "Asia/Bangkok",
      }) + " น."
    );
  };

  const formatFileSize = (size: number | null) => {
    if (size == null) return "-";

    if (size < 1024) return `${size} B`;

    if (size < 1024 * 1024) {
      return `${(size / 1024).toFixed(1)} KB`;
    }

    return `${(size / 1024 / 1024).toFixed(1)} MB`;
  };

  /* =========================================================
     LOGOUT
  ========================================================= */

  const handleLogout = () => {
    sessionStorage.clear();
    navigate("/");
  };

  const goBack = () => {
    navigate("/teacher-work");
  };

  /* =========================================================
   SAVE TEACHER REVIEW
========================================================= */

  const handleSaveReview = async () => {
    if (!taskData || !userId || !taskId || savingReview) {
      return;
    }

    // ตรวจสอบว่างานยังรอตรวจอยู่หรือไม่

    if (taskData.task.review_status !== "รอตรวจ") {
      alert("งานนี้ได้รับการตรวจแล้ว");
      return;
    }

    // ตรวจสอบผลการตรวจ

    if (decision !== "ผ่าน" && decision !== "แก้ไข") {
      alert("กรุณาเลือกผลการตรวจ");
      return;
    }

    // ถ้าต้องแก้ไข ต้องกรอกข้อเสนอแนะ

    if (decision === "แก้ไข" && !teacherComment.trim()) {
      alert("กรุณากรอกข้อเสนอแนะให้นิสิตแก้ไข");
      return;
    }

    // จำกัดจำนวนไฟล์

    if (teacherFiles.length > 10) {
      alert("สามารถแนบไฟล์ได้สูงสุด 10 ไฟล์");
      return;
    }

    // จำกัดขนาดไฟล์

    const maxSize = 10 * 1024 * 1024;

    for (const file of teacherFiles) {
      if (file.size > maxSize) {
        alert(`ไฟล์ ${file.name} มีขนาดเกิน 10 MB`);
        return;
      }
    }

    // ยืนยันก่อนบันทึก

    const confirmSave = window.confirm(
      decision === "ผ่าน"
        ? "ยืนยันการตรวจผ่านงานนี้หรือไม่?"
        : "ยืนยันการส่งงานกลับให้นิสิตแก้ไขหรือไม่?",
    );

    if (!confirmSave) {
      return;
    }

    // เตรียมข้อมูลส่ง Backend

    const formData = new FormData();

    formData.append("advisor_id", userId);

    formData.append("decision", decision);

    formData.append("teacher_comment", teacherComment.trim());

    // เพิ่มไฟล์ทั้งหมดลง FormData

    for (const file of teacherFiles) {
      formData.append("files", file);
    }

    try {
      setSavingReview(true);

      const res = await axios.post(
        `http://localhost:5000/teacher/work/review/${taskId}/submit`,
        formData,
      );

      alert(res.data.message || "บันทึกผลการตรวจเรียบร้อยแล้ว");

      // กลับหน้ารายการตรวจงาน

      navigate("/teacher-work");
    } catch (err: unknown) {
      console.log("Save teacher review error:", err);

      let message = "ไม่สามารถบันทึกผลการตรวจได้";

      if (axios.isAxiosError(err)) {
        message = err.response?.data?.message || message;
      }

      alert(message);
    } finally {
      setSavingReview(false);
    }
  };

  /* =========================================================
     RENDER
  ========================================================= */

  return (
    <div className="teacher-work-page">
      {/* =====================================================
          SIDEBAR
      ===================================================== */}

      <aside className="tw-sidebar">
        <div className="tw-logo">
          <img src={logo} alt="SPTC Logo" />

          <div>
            <h2>SPTC System</h2>
            <p>ระบบติดตามและสื่อสารโครงงานนิสิต</p>
          </div>
        </div>

        <nav className="tw-nav">
          <ul>
            <li onClick={() => navigate("/teacher-home")}>หน้าหลัก</li>

            <li onClick={() => navigate("/teacher-projects")}>
              จัดการหัวข้อโครงงาน
            </li>

            <li onClick={() => navigate("/teacher-requests")}>
              คำขอเข้าร่วมโครงงาน
            </li>

            <li onClick={() => navigate("/teacher-managed-projects")}>โครงงานที่ดูแล</li>

            <li className="tw-active" onClick={goBack}>
              งานที่ต้องดำเนินการ
            </li>

            <li>ประวัติการพิจารณา</li>
            <li>การแจ้งเตือน</li>
            <li>ข้อมูลส่วนตัว</li>
          </ul>
        </nav>

        <button type="button" className="tw-logout-btn" onClick={handleLogout}>
          ออกจากระบบ
        </button>
      </aside>

      {/* =====================================================
          MAIN
      ===================================================== */}

      <main className="tw-main">
        <header className="tw-header">
          <h2>
            <span className="trd-breadcrumb" onClick={goBack}>
              งานที่ต้องดำเนินการ
            </span>
            {" > "}
            <span className="trd-breadcrumb" onClick={goBack}>
              การตรวจงาน
            </span>
            {" > "}รายละเอียดการตรวจงาน
          </h2>

          <div className="tw-header-right">
            <TeacherNotificationBell />

            <div className="tw-user-info">
              <img
                src={
                  profileImage ? `http://localhost:5000${profileImage}` : logo
                }
                alt="Profile"
                className="tw-profile-image"
              />

              <span>{username || "-"}</span>
            </div>
          </div>
        </header>

        {/* =====================================================
            CONTENT
        ===================================================== */}

        <div className="trd-content">
          {loading ? (
            <div className="trd-message">กำลังโหลดรายละเอียดงาน...</div>
          ) : error ? (
            <div className="trd-message">
              <p>{error}</p>
              <button onClick={goBack}>กลับไปยังการตรวจงาน</button>
            </div>
          ) : taskData ? (
            <>
              {/* =================================================
    DASHBOARD CARDS
================================================= */}

              <div className="tw-dashboard-cards">
                <div className="tw-dashboard-card">
                  <span className="tw-card-title">งานรอตรวจ</span>

                  <strong className="tw-card-number tw-blue">
                    {pendingReviewCount ?? "—"}
                  </strong>
                </div>

                <div className="tw-dashboard-card">
                  <span className="tw-card-title">รอประกาศกำหนดการสอบ</span>

                  <strong className="tw-card-number tw-orange">—</strong>
                </div>

                <div className="tw-dashboard-card">
                  <span className="tw-card-title">รอการประเมิน</span>

                  <strong className="tw-card-number tw-yellow">—</strong>
                </div>
              </div>

              {/* =================================================
    MAIN TABS
================================================= */}

              <div className="tw-tabs">
                <button
                  type="button"
                  className="tw-tab tw-tab-active"
                  onClick={() => navigate("/teacher-work")}
                >
                  การตรวจงาน
                </button>

                <button
                  type="button"
                  className="tw-tab"
                  onClick={() => navigate("/teacher-work?tab=exam")}
                >
                  กำหนดการสอบ
                </button>

                <button
                  type="button"
                  className="tw-tab"
                  onClick={() => navigate("/teacher-work?tab=evaluation")}
                >
                  การประเมิน
                </button>
              </div>

              {/* =================================================
                  DETAIL CONTAINER
              ================================================= */}

              <section className="trd-container">
                <h3>รายละเอียดการตรวจงาน</h3>

                {/* =================================================
                    TASK DETAIL
                ================================================= */}

                <div className="trd-card">
                  <div className="trd-card-title-row">
                    <strong>{taskData.task.task_name}</strong>

                    <span
                      className={`trd-review-badge ${
                        taskData.task.review_status === "รอตรวจ"
                          ? "waiting"
                          : taskData.task.review_status === "ผ่าน"
                            ? "passed"
                            : "revision"
                      }`}
                    >
                      {taskData.task.review_status === "แก้ไข"
                        ? "ต้องแก้ไข"
                        : taskData.task.review_status}
                    </span>
                  </div>

                  <div className="trd-divider" />

                  <div className="trd-review-status-row">
                    <span>สถานะการตรวจ :</span>

                    <span
                      className={`trd-review-badge ${
                        taskData.task.review_status === "รอตรวจ"
                          ? "waiting"
                          : taskData.task.review_status === "ผ่าน"
                            ? "passed"
                            : "revision"
                      }`}
                    >
                      {taskData.task.review_status === "แก้ไข"
                        ? "ต้องแก้ไข"
                        : taskData.task.review_status}
                    </span>
                  </div>

                  {/* BASIC INFORMATION */}

                  <div className="trd-info">
                    <p>
                      <strong>โครงงาน : </strong>
                      {taskData.task.project_title}
                    </p>
                    <p>
                      Phase {taskData.task.phase_order}
                      {" : "}
                      {taskData.task.phase_name}
                    </p>

                    <p>ผู้รับผิดชอบ : {taskData.task.assignee_name || "-"}</p>

                    <p>
                      วันที่เริ่มต้น :{" "}
                      {formatThaiDate(taskData.task.start_date)}
                    </p>

                    <p>กำหนดส่ง : {formatThaiDate(taskData.task.due_date)}</p>

                    <p>
                      ส่งตรวจ : {formatThaiDateTime(taskData.task.submitted_at)}
                    </p>
                  </div>

                  {/* DESCRIPTION */}

                  <div className="trd-section">
                    <h4>รายละเอียดงาน</h4>

                    <p>{taskData.task.description || "-"}</p>
                  </div>

                  {/* SUBTASK */}

                  <div className="trd-section">
                    <h4>
                      Subtask : {completedSubtasks}
                      {" / "}
                      {taskData.subtasks.length}
                    </h4>

                    <div className="trd-subtasks">
                      {taskData.subtasks.map((subtask) => (
                        <label key={subtask.id} className="trd-subtask-row">
                          <input
                            type="checkbox"
                            checked={subtask.status === "เสร็จสิ้น"}
                            disabled
                            readOnly
                          />

                          <span>{subtask.subtask_name}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* PROGRESS */}

                  <div className="trd-section">
                    <h4>ความคืบหน้า</h4>

                    <div className="trd-progress-row">
                      <div className="trd-progress-bar">
                        <div
                          className="trd-progress-fill"
                          style={{ width: `${progress}%` }}
                        />
                      </div>

                      <span>{progress}%</span>
                    </div>
                  </div>

                  {/* ATTACHMENTS */}

                  <div className="trd-section">
                    <h4>เอกสารแนบ</h4>

                    {taskData.files.length === 0 ? (
                      <p>ไม่มีเอกสารแนบ</p>
                    ) : (
                      <div className="trd-file-list">
                        {taskData.files.map((file) => (
                          <div key={file.id} className="trd-file-item">
                            <div className="trd-file-info">
                              <FaPaperclip />

                              <div>
                                <strong>{file.original_name}</strong>

                                <small>
                                  {formatFileSize(file.file_size)}
                                  {" • "}
                                  อัปโหลดโดย {file.uploader_name || "-"}
                                </small>
                              </div>
                            </div>

                            <a
                              href={`http://localhost:5000${file.file_path}`}
                              target="_blank"
                              rel="noreferrer"
                              className="trd-download-btn"
                            >
                              <FaDownload />
                              ดาวน์โหลด
                            </a>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* STUDENT NOTE */}

                  <div className="trd-section">
                    <h4>หมายเหตุถึงอาจารย์</h4>

                    <div className="trd-note-box">
                      {taskData.task.submission_note?.trim() || "-"}
                    </div>
                  </div>
                </div>

                {/* =================================================
                    REVIEW FORM / RESULT
                ================================================= */}

                <div className="trd-card">
                  <h3>ผลการตรวจงาน</h3>

                  <div className="trd-divider" />

                  {taskData.task.review_status === "รอตรวจ" ? (
                    <>
                      <div className="trd-section">
                        <h4>ผลการตรวจ *</h4>

                        <div className="trd-decision-group">
                          <label
                            className={`trd-decision-option ${
                              decision === "ผ่าน" ? "selected" : ""
                            }`}
                          >
                            <input
                              type="radio"
                              name="reviewDecision"
                              value="ผ่าน"
                              checked={decision === "ผ่าน"}
                              onChange={() => setDecision("ผ่าน")}
                            />
                            ผ่าน
                          </label>

                          <label
                            className={`trd-decision-option ${
                              decision === "แก้ไข" ? "selected" : ""
                            }`}
                          >
                            <input
                              type="radio"
                              name="reviewDecision"
                              value="แก้ไข"
                              checked={decision === "แก้ไข"}
                              onChange={() => setDecision("แก้ไข")}
                            />
                            ต้องแก้ไข
                          </label>
                        </div>
                      </div>

                      <div className="trd-section">
                        <h4>
                          ข้อเสนอแนะอาจารย์
                          {decision === "แก้ไข" ? " *" : ""}
                        </h4>

                        <textarea
                          className="trd-comment-input"
                          value={teacherComment}
                          onChange={(e) => setTeacherComment(e.target.value)}
                          placeholder="กรอกความคิดเห็นหรือข้อเสนอแนะในการตรวจงาน"
                          rows={5}
                        />
                      </div>

                      {/* TEACHER ATTACHMENT */}

                      <div className="trd-section">
                        <h4>ไฟล์แนบจากอาจารย์ (ถ้ามี)</h4>

                        {/* เพิ่มไฟล์ */}

                        <input
                          id="trd-add-teacher-files"
                          type="file"
                          className="trd-teacher-file-input"
                          accept=".pdf,.doc,.docx,.ppt,.pptx,.jpg,.jpeg,.png"
                          multiple
                          onChange={(e) => {
                            const selectedFiles = Array.from(
                              e.target.files || [],
                            );

                            const validFiles = selectedFiles.filter((file) =>
                              validateTeacherFile(file),
                            );

                            setTeacherFiles((prev) => [...prev, ...validFiles]);

                            e.target.value = "";
                          }}
                        />

                        <label
                          htmlFor="trd-add-teacher-files"
                          className="trd-teacher-upload-btn"
                        >
                          + แนบไฟล์
                        </label>

                        {/* รายการไฟล์ที่เลือก */}

                        {teacherFiles.length > 0 && (
                          <div className="trd-teacher-file-list">
                            {teacherFiles.map((file, index) => (
                              <div
                                key={`${file.name}-${file.lastModified}-${index}`}
                                className="trd-teacher-file-row"
                              >
                                {/* ชื่อไฟล์ */}

                                <div className="trd-teacher-file-name">
                                  <FaPaperclip />
                                  <span>{file.name}</span>
                                </div>

                                {/* เปลี่ยนไฟล์ */}

                                <input
                                  id={`trd-replace-file-${index}`}
                                  type="file"
                                  className="trd-teacher-file-input"
                                  accept=".pdf,.doc,.docx,.ppt,.pptx,.jpg,.jpeg,.png"
                                  onChange={(e) => {
                                    const newFile = e.target.files?.[0];

                                    if (
                                      newFile &&
                                      validateTeacherFile(newFile)
                                    ) {
                                      setTeacherFiles((prev) =>
                                        prev.map((item, i) =>
                                          i === index ? newFile : item,
                                        ),
                                      );
                                    }

                                    e.target.value = "";
                                  }}
                                />

                                <label
                                  htmlFor={`trd-replace-file-${index}`}
                                  className="trd-teacher-replace-btn"
                                >
                                  เปลี่ยนไฟล์
                                </label>

                                {/* ลบไฟล์ */}

                                <button
                                  type="button"
                                  className="trd-teacher-remove-btn"
                                  onClick={() => {
                                    setTeacherFiles((prev) =>
                                      prev.filter((_, i) => i !== index),
                                    );
                                  }}
                                >
                                  ลบไฟล์
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </>
                  ) : (
                    <>
                      <p>
                        สถานะการตรวจ :{" "}
                        {taskData.task.review_status === "แก้ไข"
                          ? "ต้องแก้ไข"
                          : taskData.task.review_status}
                      </p>

                      <p>ตรวจโดย : {taskData.task.reviewed_by_name || "-"}</p>

                      <p>
                        วันที่ตรวจ :{" "}
                        {formatThaiDateTime(taskData.task.reviewed_at)}
                      </p>

                      <div className="trd-section">
                        <h4>ข้อเสนอแนะอาจารย์</h4>

                        <div className="trd-note-box">
                          {taskData.task.teacher_comment || "-"}
                        </div>
                      </div>

                      {taskData.task.teacher_file && (
                        <div className="trd-section">
                          <h4>ไฟล์แนบจากอาจารย์</h4>

                          <a
                            href={`http://localhost:5000${taskData.task.teacher_file}`}
                            target="_blank"
                            rel="noreferrer"
                            className="trd-download-btn"
                          >
                            <FaDownload />
                            ดาวน์โหลดไฟล์อาจารย์
                          </a>
                        </div>
                      )}
                    </>
                  )}
                </div>

                {/* =================================================
                    ACTIONS
                ================================================= */}

                <div className="trd-actions">
                  <button
                    type="button"
                    className="trd-back-btn"
                    onClick={goBack}
                  >
                    กลับไปยังการตรวจงาน
                  </button>

                  {taskData.task.review_status === "รอตรวจ" && (
                    <button
                      type="button"
                      className="trd-submit-btn"
                      disabled={savingReview}
                      onClick={handleSaveReview}
                    >
                      {savingReview ? "กำลังบันทึก..." : "บันทึกผลการตรวจ"}
                    </button>
                  )}
                </div>
              </section>
            </>
          ) : null}
        </div>
      </main>
    </div>
  );
}

export default TeacherReviewDetail;
