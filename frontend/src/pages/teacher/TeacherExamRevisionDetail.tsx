
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import logo from "../../assets/Logo.svg";
import TeacherNotificationBell from "./TeacherNotificationBell";

import "./TeacherWork.css";
import "./TeacherExamRevisionDetail.css";

interface RevisionFile {
  name: string;
  path: string;
  size: number;
}

interface RevisionItem {
  teacher_name: string;
  details: string[];
}

interface RevisionDetail {
  submission_id: number;
  project_id: number;
  project_title: string;
  student_name: string;
  student_username: string;
  description: string;
  status: string;
  submitted_at: string;
  review_comment: string | null;
  reviewed_at: string | null;
  files: RevisionFile[];
  revision_items: RevisionItem[];
}

type ReviewResult = "" | "ผ่าน" | "ต้องแก้ไข";

function TeacherExamRevisionDetail() {
  const navigate = useNavigate();
  const { submissionId } = useParams();

  const userId = sessionStorage.getItem("userId");
  const username = sessionStorage.getItem("username");
  const profileImage = sessionStorage.getItem("profileImage");

  const [detail, setDetail] = useState<RevisionDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [result, setResult] = useState<ReviewResult>("");
  const [comment, setComment] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");

  const [counts, setCounts] = useState<{
    reviews: number | null;
    exams: number | null;
    evaluations: number | null;
  }>({
    reviews: null,
    exams: null,
    evaluations: null,
  });

  const goBack = () => {
    navigate("/teacher-work?tab=review");
  };

  const formatThaiDateTime = (value: string) => {
    const date = new Date(value);

    if (Number.isNaN(date.getTime())) return "-";

    return date.toLocaleString("th-TH", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      timeZone: "Asia/Bangkok",
    }) + " น.";
  };

  // โหลดรายละเอียดงานแก้ไข
  useEffect(() => {
    if (!userId) {
      navigate("/");
      return;
    }

    if (!submissionId) {
      setError("ไม่พบรหัสงานแก้ไข");
      setLoading(false);
      return;
    }

    let active = true;

    setLoading(true);
    setError("");

    axios
      .get<RevisionDetail>(
        `http://localhost:5000/teacher/exam-revisions/${submissionId}`,
        { params: { advisorId: userId } },
      )
      .then((res) => {
        if (active) setDetail(res.data);
      })
      .catch((err) => {
        if (!active) return;

        setError(
          err.response?.data?.message ||
            "ไม่สามารถโหลดรายละเอียดงานแก้ไขได้",
        );
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [submissionId, userId, navigate]);

  // โหลดจำนวนงานในการ์ดสรุป
  useEffect(() => {
    if (!userId) return;

    let active = true;

    Promise.allSettled([
      axios.get(`http://localhost:5000/teacher/work/reviews/${userId}`),
      axios.get(`http://localhost:5000/teacher/exams/${userId}`),
      axios.get(`http://localhost:5000/teacher/evaluations/${userId}`),
    ]).then(([reviews, exams, evaluations]) => {
      if (!active) return;

      setCounts({
        reviews:
          reviews.status === "fulfilled"
            ? (reviews.value.data.tasks || []).filter(
                (task: { review_status: string }) =>
                  task.review_status === "รอตรวจ",
              ).length
            : null,

        exams:
          exams.status === "fulfilled"
            ? exams.value.data.pending_count
            : null,

        evaluations:
          evaluations.status === "fulfilled"
            ? evaluations.value.data.pending_count
            : null,
      });
    });

    return () => {
      active = false;
    };
  }, [userId]);

  const saveReview = async () => {
    if (!detail || !userId || saving) return;

    if (!result) {
      setSaveError("กรุณาเลือกผลการตรวจ");
      return;
    }

    if (result === "ต้องแก้ไข" && !comment.trim()) {
      setSaveError("กรุณาระบุข้อเสนอแนะให้นิสิตแก้ไข");
      return;
    }

    try {
      setSaving(true);
      setSaveError("");

      await axios.patch(
        `http://localhost:5000/teacher/exam-revisions/${detail.submission_id}/review`,
        {
          advisor_id: Number(userId),
          result,
          comment: comment.trim(),
        },
      );

      goBack();
    } catch (err) {
      if (axios.isAxiosError(err)) {
        setSaveError(
          err.response?.data?.message ||
            "ไม่สามารถบันทึกผลการตรวจได้",
        );
      } else {
        setSaveError("ไม่สามารถบันทึกผลการตรวจได้");
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="teacher-work-page teacher-exam-revision-page">
      {/* SIDEBAR */}
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
            <li onClick={() => navigate("/teacher-managed-projects")}>
              โครงงานที่ดูแล
            </li>
            <li className="tw-active" onClick={goBack}>
              งานที่ต้องดำเนินการ
            </li>
            <li onClick={() => navigate("/teacher-decision-history")}>
              ประวัติการพิจารณา
            </li>
            <li onClick={() => navigate("/teacher-notifications")}>
              การแจ้งเตือน
            </li>
            <li>ข้อมูลส่วนตัว</li>
          </ul>
        </nav>

        <button
          type="button"
          className="tw-logout-btn"
          onClick={() => {
            sessionStorage.clear();
            navigate("/");
          }}
        >
          ออกจากระบบ
        </button>
      </aside>

      {/* MAIN */}
      <main className="tw-main">
        <header className="tw-header">
          <h2>
            งานที่ต้องดำเนินการ &gt; การตรวจงาน &gt; รอตรวจ &gt; ตรวจงานแก้ไข
          </h2>

          <div className="tw-header-right">
            <TeacherNotificationBell />

            <div className="tw-user-info">
              <img
                src={
                  profileImage
                    ? `http://localhost:5000${profileImage}`
                    : logo
                }
                alt="Profile"
                className="tw-profile-image"
              />
              <span>{username || "-"}</span>
            </div>
          </div>
        </header>

        <div className="tw-content">
          {/* DASHBOARD */}
          <div className="tw-dashboard-cards">
            <div className="tw-dashboard-card">
              <span className="tw-card-title">งานรอตรวจ</span>
              <strong className="tw-card-number tw-blue">
                {counts.reviews ?? "-"}
              </strong>
            </div>

            <div className="tw-dashboard-card">
              <span className="tw-card-title">
                รอประกาศกำหนดการสอบ
              </span>
              <strong className="tw-card-number tw-orange">
                {counts.exams ?? "-"}
              </strong>
            </div>

            <div className="tw-dashboard-card">
              <span className="tw-card-title">รอการประเมิน</span>
              <strong className="tw-card-number tw-yellow">
                {counts.evaluations ?? "-"}
              </strong>
            </div>
          </div>

          {/* TABS */}
          <div className="tw-tabs">
            <button
              type="button"
              className="tw-tab tw-tab-active"
              onClick={goBack}
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

          {/* DETAIL PANEL */}
          <section className="tw-panel ter-panel">
            <h3>ตรวจงานแก้ไขหลังการสอบ</h3>

            {loading ? (
              <p>กำลังโหลดรายละเอียด...</p>
            ) : error ? (
              <p className="ter-error">{error}</p>
            ) : detail ? (
              <>
                <div className="ter-card">
                  <div className="ter-card-heading">
                    <strong>{detail.project_title}</strong>
                    <span className="ter-status">
                      {detail.status}
                    </span>
                  </div>

                  <div className="ter-divider" />

                  <p>ส่งโดย : {detail.student_name}</p>
                  <p>
                    ส่งเมื่อ : {formatThaiDateTime(detail.submitted_at)}
                  </p>

                  <div className="ter-field">
                    <h4>สิ่งที่คณะกรรมการให้แก้ไข</h4>
                    <div className="ter-gray-box">
                      {detail.revision_items.length > 0 ? (
                        detail.revision_items.map((group, index) => (
                          <div key={index} className="ter-revision-group">
                            <strong>{group.teacher_name}</strong>
                            <ul>
                              {group.details.map((text, i) => (
                                <li key={i}>{text}</li>
                              ))}
                            </ul>
                          </div>
                        ))
                      ) : (
                        <p>ไม่มีรายละเอียดประเด็นที่ต้องแก้ไข</p>
                      )}
                    </div>
                  </div>

                  <div className="ter-field">
                    <h4>รายละเอียดการแก้ไขจากนิสิต</h4>
                    <div className="ter-gray-box">
                      {detail.description}
                    </div>
                  </div>

                  <div className="ter-field">
                    <h4>ไฟล์ที่ส่ง</h4>
                    <div className="ter-files">
                      {detail.files.map((file, index) => (
                        <a
                          key={index}
                          href={`http://localhost:5000${file.path}`}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          📄 {file.name}
                        </a>
                      ))}
                    </div>
                  </div>
                </div>

                {/* REVIEW RESULT */}
                <div className="ter-card ter-result-card">
                  <h4>ผลการตรวจงาน</h4>
                  <div className="ter-divider" />

                  {detail.status === "รอตรวจ" ? (
                    <>
                      <h4>ผลการตรวจ</h4>

                      <div className="ter-choices">
                        <label
                          className={
                            result === "ผ่าน" ? "ter-selected" : ""
                          }
                        >
                          <input
                            type="radio"
                            name="revisionResult"
                            value="ผ่าน"
                            checked={result === "ผ่าน"}
                            onChange={() => {
                              setResult("ผ่าน");
                              setSaveError("");
                            }}
                          />
                          ผ่าน
                        </label>

                        <label
                          className={
                            result === "ต้องแก้ไข" ? "ter-selected" : ""
                          }
                        >
                          <input
                            type="radio"
                            name="revisionResult"
                            value="ต้องแก้ไข"
                            checked={result === "ต้องแก้ไข"}
                            onChange={() => {
                              setResult("ต้องแก้ไข");
                              setSaveError("");
                            }}
                          />
                          ต้องแก้ไข
                        </label>
                      </div>

                      <div className="ter-field">
                        <h4>
                          ข้อเสนอแนะจากอาจารย์
                          {result === "ต้องแก้ไข" && (
                            <span className="ter-required"> *</span>
                          )}
                        </h4>

                        <textarea
                          value={comment}
                          onChange={(e) => setComment(e.target.value)}
                          placeholder="ระบุข้อเสนอแนะหรือสิ่งที่ต้องแก้ไข..."
                          rows={4}
                        />
                      </div>

                      {saveError && (
                        <p className="ter-error">{saveError}</p>
                      )}
                    </>
                  ) : (
                    <>
                      <p>
                        ผลการตรวจ : <strong>{detail.status}</strong>
                      </p>
                      <p>
                        ข้อเสนอแนะ : {detail.review_comment || "-"}
                      </p>
                    </>
                  )}
                </div>

                <div className="ter-actions">
                  <button
                    type="button"
                    className="ter-cancel-btn"
                    onClick={goBack}
                  >
                    {detail.status === "รอตรวจ" ? "ยกเลิก" : "กลับ"}
                  </button>

                  {detail.status === "รอตรวจ" && (
                    <button
                      type="button"
                      className="ter-save-btn"
                      disabled={saving}
                      onClick={saveReview}
                    >
                      {saving ? "กำลังบันทึก..." : "บันทึกผลการตรวจ"}
                    </button>
                  )}
                </div>
              </>
            ) : (
              <p>ไม่พบข้อมูลงานแก้ไข</p>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}

export default TeacherExamRevisionDetail;
