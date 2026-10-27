import "./TeacherWork.css";
import "./TeacherEvaluationDetail.css";

import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";

import logo from "../../assets/Logo.svg";
import TeacherNotificationBell from "./TeacherNotificationBell";

/* =========================================
   INTERFACE
========================================= */

interface EvaluationProject {
  committee_member_id: number;
  schedule_id: number;
  project_id: number;
  project_title: string;
  exam_date: string;
  start_time: string;
  end_time: string;
  location: string;
  advisor_name: string;
  student_names: string;

  evaluation_id: number | null;

  score_correctness: number | null;
  score_design: number | null;
  score_presentation: number | null;
  score_documentation: number | null;
  score_questions: number | null;

  total_score: number | null;
  teacher_comment: string | null;
  needs_revision: number | null;
  revision_details: string | null;
  evaluated_at: string | null;
}

interface EvaluationListResponse {
  pending: EvaluationProject[];
  evaluated: EvaluationProject[];
}

const criteria = [
  {
    key: "score_correctness",
    label: "ความถูกต้องและความสมบูรณ์ของระบบ",
    max: 30,
  },
  {
    key: "score_design",
    label: "การออกแบบและพัฒนาระบบ",
    max: 25,
  },
  {
    key: "score_presentation",
    label: "การนำเสนอ",
    max: 20,
  },
  {
    key: "score_documentation",
    label: "เอกสารประกอบโครงงาน",
    max: 15,
  },
  {
    key: "score_questions",
    label: "การตอบคำถาม",
    max: 10,
  },
] as const;

type ScoreKey = (typeof criteria)[number]["key"];

type EvaluationForm = Record<ScoreKey, string> & {
  teacher_comment: string;
  needs_revision: "" | "ไม่มี" | "มี";
  revision_details: string;
};

const initialForm: EvaluationForm = {
  score_correctness: "",
  score_design: "",
  score_presentation: "",
  score_documentation: "",
  score_questions: "",
  teacher_comment: "",
  needs_revision: "",
  revision_details: "",
};

/* =========================================
   COMPONENT
========================================= */

function TeacherEvaluationDetail() {
  const navigate = useNavigate();
  const { committeeMemberId } = useParams<{
    committeeMemberId: string;
  }>();

  const userId = sessionStorage.getItem("userId");
  const username = sessionStorage.getItem("username");
  const profileImage = sessionStorage.getItem("profileImage");

  const [project, setProject] = useState<EvaluationProject | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [form, setForm] = useState<EvaluationForm>(initialForm);
  const [formError, setFormError] = useState("");
  const [showConfirm, setShowConfirm] = useState(false);

  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");

  /* =========================================
     LOAD EVALUATION DATA
  ========================================= */

  useEffect(() => {
    if (!userId) {
      navigate("/");
      return;
    }

    const memberId = Number(committeeMemberId);

    if (!Number.isInteger(memberId) || memberId <= 0) {
      setError("รหัสกรรมการสอบไม่ถูกต้อง");
      setLoading(false);
      return;
    }

    let active = true;

    setLoading(true);
    setError("");

    axios
      .get<EvaluationListResponse>(
        `http://localhost:5000/teacher/evaluations/${userId}`,
      )
      .then((res) => {
        if (!active) return;

        const allProjects = [...res.data.pending, ...res.data.evaluated];

        const selected = allProjects.find(
          (item) => item.committee_member_id === memberId,
        );

        if (!selected) {
          setError("ไม่พบข้อมูลการประเมินหรือไม่มีสิทธิ์ประเมิน");
          return;
        }

        setProject(selected);
      })
      .catch((err) => {
        if (!active) return;

        setError(
          err.response?.data?.message || "ไม่สามารถโหลดข้อมูลการประเมินได้",
        );
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [userId, committeeMemberId, navigate]);

  /* =========================================
     FORMAT DATE
  ========================================= */

  const formatThaiDate = (value: string) => {
    if (!value) return "-";

    const date = new Date(`${value}T12:00:00+07:00`);

    if (Number.isNaN(date.getTime())) return "-";

    return date.toLocaleDateString("th-TH", {
      day: "numeric",
      month: "short",
      year: "numeric",
      timeZone: "Asia/Bangkok",
    });
  };

  /* =========================================
     UPDATE SCORES
  ========================================= */

  const updateScore = (key: ScoreKey, max: number, value: string) => {
    if (value !== "") {
      if (!/^\d+$/.test(value)) return;
      if (Number(value) > max) return;
    }

    setForm((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const totalScore = criteria.reduce(
    (total, item) => total + Number(form[item.key] || 0),
    0,
  );

  /* =========================================
     CONFIRM BEFORE SAVE
  ========================================= */

  const confirmEvaluation = () => {
    setFormError("");

    const missingScore = criteria.some((item) => form[item.key].trim() === "");

    if (missingScore) {
      setFormError("กรุณากรอกคะแนนให้ครบทุกหัวข้อ");
      return;
    }

    const invalidScore = criteria.some((item) => {
      const value = Number(form[item.key]);

      return !Number.isInteger(value) || value < 0 || value > item.max;
    });

    if (invalidScore) {
      setFormError("คะแนนที่กรอกไม่ถูกต้อง");
      return;
    }

    if (form.needs_revision === "") {
      setFormError("กรุณาเลือกว่ามีประเด็นที่ต้องแก้ไขหรือไม่");
      return;
    }

    if (form.needs_revision === "มี" && !form.revision_details.trim()) {
      setFormError("กรุณาระบุประเด็นที่ต้องแก้ไข");
      return;
    }

    setShowConfirm(true);
  };

  const saveEvaluation = async () => {
    if (!project || !userId || saving) return;

    setSaving(true);
    setSaveError("");

    try {
      await axios.post("http://localhost:5000/teacher/evaluations", {
        committee_member_id: project.committee_member_id,
        teacher_id: Number(userId),

        score_correctness: Number(form.score_correctness),
        score_design: Number(form.score_design),
        score_presentation: Number(form.score_presentation),
        score_documentation: Number(form.score_documentation),
        score_questions: Number(form.score_questions),

        teacher_comment: form.teacher_comment.trim(),

        needs_revision: form.needs_revision === "มี" ? 1 : 0,

        revision_details:
          form.needs_revision === "มี" ? form.revision_details.trim() : "",
      });

      // บันทึกสำเร็จแล้ว
      setShowConfirm(false);

      // กลับไปหน้า การประเมิน
      navigate("/teacher-work?tab=evaluation");
    } catch (err) {
      console.error("Save evaluation error:", err);

      if (axios.isAxiosError(err)) {
        setSaveError(
          err.response?.data?.message || "ไม่สามารถบันทึกผลการประเมินได้",
        );
      } else {
        setSaveError("ไม่สามารถบันทึกผลการประเมินได้");
      }
    } finally {
      setSaving(false);
    }
  };

  const goBack = () => {
    navigate("/teacher-work?tab=evaluation");
  };

  const students = (project?.student_names || "")
    .split("|")
    .map((student) => student.trim())
    .filter(Boolean);

  /* =========================================
     RENDER
  ========================================= */

  return (
    <div className="teacher-work-page teacher-eval-page">
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

            <li>โครงงานที่ดูแล</li>

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
          <h2 className="tw-eval-breadcrumb">
            <button type="button" onClick={() => navigate("/teacher-work")}>
              งานที่ต้องดำเนินการ
            </button>

            <span>&gt;</span>

            <button
              type="button"
              onClick={() => navigate("/teacher-work?tab=evaluation")}
            >
              การประเมิน
            </button>

            <span>&gt;</span>

            <span className="tw-eval-breadcrumb-current">ประเมินโครงงาน</span>
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

        <div className="tw-content">
          <section className="tw-panel tw-eval-panel">
            <h3>ผลการประเมิน</h3>

            {loading ? (
              <p>กำลังโหลดข้อมูลการประเมิน...</p>
            ) : error || !project ? (
              <div className="tw-eval-message">
                <p>{error || "ไม่พบข้อมูลการประเมิน"}</p>

                <button type="button" onClick={goBack}>
                  กลับไปรายการประเมิน
                </button>
              </div>
            ) : (
              <>
                {/* PROJECT INFORMATION */}

                <div className="tw-eval-card">
                  <h4 className="tw-eval-project-title">
                    {project.project_title}
                  </h4>

                  <div className="tw-eval-divider" />

                  <div className="tw-eval-info">
                    <strong>ข้อมูลการสอบ</strong>

                    <p>วันที่สอบ : {formatThaiDate(project.exam_date)}</p>

                    <p>
                      เวลา : {project.start_time} - {project.end_time} น.
                    </p>

                    <p>สถานที่ : {project.location}</p>

                    <p className="tw-eval-advisor">
                      อาจารย์ที่ปรึกษา : {project.advisor_name}
                    </p>

                    <p>สมาชิกในโครงงาน ({students.length} คน)</p>

                    <div className="tw-eval-students">
                      {students.map((student, index) => (
                        <p key={index}>{student}</p>
                      ))}
                    </div>
                  </div>

                  {project.evaluation_id === null ? (
                    <>
                      {/* EVALUATION SCORE TABLE */}

                      <div className="tw-eval-section">
                        <h4>แบบประเมิน</h4>

                        <div className="tw-eval-table-wrap">
                          <table className="tw-eval-score-table">
                            <thead>
                              <tr>
                                <th>เกณฑ์การประเมิน</th>
                                <th>คะแนนเต็ม</th>
                                <th>คะแนนที่ได้</th>
                              </tr>
                            </thead>

                            <tbody>
                              {criteria.map((item) => (
                                <tr key={item.key}>
                                  <td>{item.label}</td>
                                  <td>{item.max}</td>

                                  <td>
                                    <input
                                      type="text"
                                      inputMode="numeric"
                                      value={form[item.key]}
                                      onChange={(e) =>
                                        updateScore(
                                          item.key,
                                          item.max,
                                          e.target.value,
                                        )
                                      }
                                      aria-label={item.label}
                                    />
                                  </td>
                                </tr>
                              ))}

                              <tr className="tw-eval-total-row">
                                <td>รวม</td>
                                <td>100</td>
                                <td>{totalScore}</td>
                              </tr>
                            </tbody>
                          </table>
                        </div>
                      </div>

                      {/* COMMENT */}

                      <div className="tw-eval-field">
                        <label htmlFor="eval-comment">
                          ความคิดเห็น / ข้อเสนอแนะ
                        </label>

                        <textarea
                          id="eval-comment"
                          rows={4}
                          value={form.teacher_comment}
                          onChange={(e) =>
                            setForm((prev) => ({
                              ...prev,
                              teacher_comment: e.target.value,
                            }))
                          }
                        />
                      </div>

                      {/* REVISION */}

                      <div className="tw-eval-field">
                        <label>ประเด็นที่ต้องแก้ไข</label>

                        <div className="tw-eval-choices">
                          <label
                            className={`tw-eval-choice ${
                              form.needs_revision === "ไม่มี" ? "selected" : ""
                            }`}
                          >
                            <input
                              type="radio"
                              name="needs_revision"
                              value="ไม่มี"
                              checked={form.needs_revision === "ไม่มี"}
                              onChange={() =>
                                setForm((prev) => ({
                                  ...prev,
                                  needs_revision: "ไม่มี",
                                  revision_details: "",
                                }))
                              }
                            />
                            <span>ไม่มี</span>
                          </label>

                          <label
                            className={`tw-eval-choice ${
                              form.needs_revision === "มี" ? "selected" : ""
                            }`}
                          >
                            <input
                              type="radio"
                              name="needs_revision"
                              value="มี"
                              checked={form.needs_revision === "มี"}
                              onChange={() =>
                                setForm((prev) => ({
                                  ...prev,
                                  needs_revision: "มี",
                                }))
                              }
                            />
                            <span>มี</span>
                          </label>
                        </div>
                      </div>

                      {/* REVISION DETAILS */}

                      {form.needs_revision === "มี" && (
                        <div className="tw-eval-field">
                          <label htmlFor="eval-revision">
                            ระบุประเด็นที่ต้องแก้ไข
                            <span className="tw-eval-required"> *</span>
                          </label>

                          <textarea
                            id="eval-revision"
                            rows={4}
                            value={form.revision_details}
                            onChange={(e) =>
                              setForm((prev) => ({
                                ...prev,
                                revision_details: e.target.value,
                              }))
                            }
                          />
                        </div>
                      )}

                      {formError && (
                        <p className="tw-eval-error" role="alert">
                          {formError}
                        </p>
                      )}
                    </>
                  ) : (
                    <>
                      {/* =========================================
      SAVED EVALUATION RESULT
  ========================================= */}

                      <div className="tw-eval-section">
                        <h4>แบบประเมิน</h4>

                        <div className="tw-eval-table-wrap">
                          <table className="tw-eval-score-table">
                            <thead>
                              <tr>
                                <th>เกณฑ์การประเมิน</th>
                                <th>คะแนนเต็ม</th>
                                <th>คะแนนที่ได้</th>
                              </tr>
                            </thead>

                            <tbody>
                              {criteria.map((item) => (
                                <tr key={item.key}>
                                  <td>{item.label}</td>

                                  <td>{item.max}</td>

                                  <td>{project[item.key] ?? "-"}</td>
                                </tr>
                              ))}

                              <tr className="tw-eval-total-row">
                                <td>รวม</td>
                                <td>100</td>
                                <td>{project.total_score ?? "-"}</td>
                              </tr>
                            </tbody>
                          </table>
                        </div>
                      </div>

                      {/* =========================================
      TEACHER COMMENT
  ========================================= */}

                      <div className="tw-eval-field">
                        <label>ความคิดเห็น / ข้อเสนอแนะ</label>

                        <textarea
                          rows={4}
                          value={
                            project.teacher_comment?.trim() ||
                            "ไม่มีความคิดเห็นเพิ่มเติม"
                          }
                          readOnly
                        />
                      </div>

                      {/* =========================================
      REVISION STATUS
  ========================================= */}

                      <div className="tw-eval-field">
                        <label>ประเด็นที่ต้องแก้ไข</label>

                        <div className="tw-eval-choices">
                          <label
                            className={`tw-eval-choice ${
                              project.needs_revision === 0 ? "selected" : ""
                            }`}
                          >
                            <input
                              type="radio"
                              checked={project.needs_revision === 0}
                              disabled
                            />
                            <span>ไม่มี</span>
                          </label>

                          <label
                            className={`tw-eval-choice ${
                              project.needs_revision === 1 ? "selected" : ""
                            }`}
                          >
                            <input
                              type="radio"
                              checked={project.needs_revision === 1}
                              disabled
                            />
                            <span>มี</span>
                          </label>
                        </div>
                      </div>

                      {/* =========================================
      REVISION DETAILS
  ========================================= */}

                      {project.needs_revision === 1 && (
                        <div className="tw-eval-field">
                          <label>ระบุประเด็นที่ต้องแก้ไข</label>

                          <textarea
                            rows={4}
                            value={project.revision_details?.trim() || "-"}
                            readOnly
                          />
                        </div>
                      )}

                      {/* =========================================
      EVALUATED DATE
  ========================================= */}

                      <div className="tw-eval-recorded">
                        <p>
                          บันทึกผลเมื่อ :{" "}
                          {project.evaluated_at
                            ? new Date(project.evaluated_at).toLocaleString(
                                "th-TH",
                                {
                                  timeZone: "Asia/Bangkok",
                                  day: "numeric",
                                  month: "short",
                                  year: "numeric",
                                  hour: "2-digit",
                                  minute: "2-digit",
                                },
                              )
                            : "-"}
                        </p>
                      </div>
                    </>
                  )}
                </div>

                {/* ACTIONS */}

                <div className="tw-eval-actions">
                  <button
                    type="button"
                    className="tw-eval-cancel-btn"
                    onClick={goBack}
                  >
                    {project.evaluation_id === null ? "ยกเลิก" : "กลับ"}
                  </button>

                  {project.evaluation_id === null && (
                    <button
                      type="button"
                      className="tw-eval-save-btn"
                      onClick={confirmEvaluation}
                    >
                      บันทึกผลการประเมิน
                    </button>
                  )}
                </div>
              </>
            )}
          </section>
        </div>
      </main>

      {/* CONFIRMATION POPUP */}

      {showConfirm && project && (
        <div className="tw-eval-confirm-overlay">
          <div
            className="tw-eval-confirm-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="eval-confirm-title"
          >
            <h3 id="eval-confirm-title">ยืนยันผลการประเมิน</h3>

            <div className="tw-eval-confirm-divider" />

            <p>คุณต้องการบันทึกผลการประเมินของ</p>

            <strong className="tw-eval-confirm-project">
              “{project.project_title}”
            </strong>

            <p>หรือไม่</p>

            <div className="tw-eval-confirm-score">
              <p>คะแนนที่ให้</p>
              <strong>{totalScore} / 100</strong>
            </div>

            <p className="tw-eval-confirm-note">
              เมื่อยืนยันแล้ว ระบบจะบันทึกคะแนน ความคิดเห็น
              และประเด็นที่ต้องแก้ไขของคุณ
            </p>

            {saveError && (
              <p className="tw-eval-error" role="alert">
                {saveError}
              </p>
            )}

            <div className="tw-eval-confirm-actions">
              <button
                type="button"
                className="tw-eval-modal-cancel"
                onClick={() => setShowConfirm(false)}
              >
                ยกเลิก
              </button>

              <button
                type="button"
                className="tw-eval-modal-save"
                onClick={saveEvaluation}
                disabled={saving}
              >
                {saving ? "กำลังบันทึก..." : "ยืนยันการประเมิน"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default TeacherEvaluationDetail;
