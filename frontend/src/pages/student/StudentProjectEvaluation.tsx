import "./StudentProjectDetail.css";
import "./StudentProjectEvaluation.css";

import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";

import logo from "../../assets/Logo.svg";
import StudentNotificationBell from "./StudentNotificationBell";

interface ScoreItem {
  label: string;
  max: number;
  score: number;
}

interface CommitteeComment {
  teacher_name: string;
  comment: string;
}
interface RevisionDetail {
  teacher_name: string;
  detail: string;
}
interface ExamRevisionSubmission {
  id: number;
  status: string;
  student_name: string;
  submitted_at: string;
  description: string;
  review_comment?: string | null;
  reviewed_at?: string | null;
  files: {
    name: string;
    path: string;
    size: number;
  }[];
}

type EvaluationResult =
  | {
      status: "pending";
      project_title: string;
    }
  | {
      status: "published";
      project_title: string;
      result_status: string;
      grade: string;
      total_score: number;
      evaluated_at: string | null;
      committee: string[];
      scores: ScoreItem[];
      comments: CommitteeComment[];
      revision_details: RevisionDetail[];
    };

interface ExamRetakeRequest {
  id: number;
  status: string;
  exam_round: number;
  latest_result_round: number;
  has_schedule: number;
  advisor_comment: string | null;
}

interface ProjectData {
  id: number;
  title: string;
  updated_at?: string | null;
}

function StudentProjectEvaluation() {
  const navigate = useNavigate();
  const { projectId } = useParams();

  const userId = sessionStorage.getItem("userId");
  const username = sessionStorage.getItem("username");
  const profileImage = sessionStorage.getItem("profileImage");

  const [project, setProject] = useState<ProjectData | null>(null);
  const [result, setResult] = useState<EvaluationResult | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  // สมัครสอบใหม่
  const [retakeRequest, setRetakeRequest] = useState<ExamRetakeRequest | null>(
    null,
  );

  const [retakeLoading, setRetakeLoading] = useState(true);
  const [retakeLoadError, setRetakeLoadError] = useState("");
  const [retakeSubmitting, setRetakeSubmitting] = useState(false);
  const [retakeSubmitError, setRetakeSubmitError] = useState("");
  const [retakeSent, setRetakeSent] = useState(false);
  const [showRevisionModal, setShowRevisionModal] = useState(false);
  const [revisionDescription, setRevisionDescription] = useState("");
  const [revisionFiles, setRevisionFiles] = useState<File[]>([]);
  const revisionFileInputRef = useRef<HTMLInputElement>(null);
  const [revisionSubmission, setRevisionSubmission] =
    useState<ExamRevisionSubmission | null>(null);

  const [revisionSubmissions, setRevisionSubmissions] = useState<
    ExamRevisionSubmission[]
  >([]);

  const [selectedRevisionId, setSelectedRevisionId] = useState<number | null>(
    null,
  );

  const displayedRevision =
    revisionSubmissions.find((item) => item.id === selectedRevisionId) ??
    revisionSubmission;
  const revisionPassed =
    result?.status === "published" &&
    result.result_status === "ผ่านแบบมีเงื่อนไข" &&
    revisionSubmission?.status === "ผ่าน";

  const finalResultStatus =
    result?.status === "published"
      ? revisionPassed
        ? "ผ่าน"
        : result.result_status
      : "";

  const [revisionLoading, setRevisionLoading] = useState(true);
  const [revisionLoadError, setRevisionLoadError] = useState("");
  const [revisionSubmitting, setRevisionSubmitting] = useState(false);
  const [revisionError, setRevisionError] = useState("");

  /* =========================================
     LOAD DATA
  ========================================= */

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

    let active = true;

    const loadData = async () => {
      setLoading(true);
      setError("");

      try {
        const [projectRes, evaluationRes] = await Promise.all([
          axios.get<ProjectData>(`http://localhost:5000/projects/${projectId}`),

          axios.get<EvaluationResult>(
            `http://localhost:5000/student/projects/${projectId}/evaluation/${userId}`,
          ),
        ]);

        if (!active) return;

        setProject(projectRes.data);
        setResult(evaluationRes.data);
      } catch (err) {
        if (!active) return;

        console.error("Load student evaluation error:", err);

        setError(
          axios.isAxiosError(err)
            ? err.response?.data?.message || "ไม่สามารถโหลดผลการประเมินได้"
            : "ไม่สามารถโหลดผลการประเมินได้",
        );
      } finally {
        if (active) setLoading(false);
      }
    };

    loadData();

    return () => {
      active = false;
    };
  }, [projectId, userId, navigate]);
  useEffect(() => {
    if (!projectId || !userId) return;

    let active = true;

    const fetchRevision = async () => {
      setRevisionLoading(true);
      setRevisionLoadError("");

      try {
        const res = await axios.get<{
          submission: ExamRevisionSubmission | null;
          submissions: ExamRevisionSubmission[];
        }>(
          `http://localhost:5000/student/projects/${projectId}/exam-revision/${userId}`,
        );

        if (active) {
          setRevisionSubmission(res.data.submission);
          setRevisionSubmissions(res.data.submissions ?? []);
          setSelectedRevisionId(null);
        }
      } catch (err) {
        if (active) {
          setRevisionLoadError("ไม่สามารถโหลดข้อมูลงานแก้ไขได้");
        }
      } finally {
        if (active) setRevisionLoading(false);
      }
    };

    fetchRevision();

    return () => {
      active = false;
    };
  }, [projectId, userId]);

  /* =========================================
   LOAD EXAM RETAKE REQUEST
========================================= */

  useEffect(() => {
    if (!projectId || !userId) return;

    let active = true;

    const loadRetakeRequest = async () => {
      setRetakeLoading(true);
      setRetakeLoadError("");

      try {
        const response = await axios.get<{
          request: ExamRetakeRequest | null;
        }>(
          `http://localhost:5000/student/projects/${projectId}/exam-request/${userId}`,
        );

        if (!active) return;

        const request = response.data.request;

        // แสดงเฉพาะคำขอที่ใหม่กว่ารอบที่มีผลสอบแล้ว
        if (
          request &&
          Number(request.exam_round) > Number(request.latest_result_round)
        ) {
          setRetakeRequest(request);
        } else {
          setRetakeRequest(null);
        }
      } catch (err) {
        if (!active) return;

        console.error("Load retake request error:", err);
        setRetakeLoadError("ไม่สามารถตรวจสอบสถานะคำขอสอบใหม่ได้");
      } finally {
        if (active) setRetakeLoading(false);
      }
    };

    loadRetakeRequest();

    return () => {
      active = false;
    };
  }, [projectId, userId]);

  /* =========================================
     FORMAT
  ========================================= */

  const formatThaiDateTime = (value: string | null) => {
    if (!value) return "-";

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) return "-";

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

  const formatScore = (value: number) => {
    return Number(value).toLocaleString("th-TH", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    });
  };

  const goToOverview = () => {
    navigate(`/student-project-detail/${projectId}`);
  };

  const handleLogout = () => {
    sessionStorage.removeItem("userId");
    sessionStorage.removeItem("username");
    sessionStorage.removeItem("name");
    sessionStorage.removeItem("profileImage");
    navigate("/");
  };

  const groupRevisionDetails = (items: RevisionDetail[]) => {
    const groups: Record<string, string[]> = {};

    items.forEach((item) => {
      const teacherName = item.teacher_name || "ไม่ระบุชื่ออาจารย์";
      const detail = item.detail?.trim();

      if (!detail) return;

      if (!groups[teacherName]) {
        groups[teacherName] = [];
      }

      groups[teacherName].push(detail);
    });

    return Object.entries(groups);
  };
  const submitExamRevision = async () => {
    if (revisionSubmitting) return;

    if (!revisionDescription.trim()) {
      setRevisionError("กรุณากรอกรายละเอียดการแก้ไข");
      return;
    }

    if (revisionFiles.length === 0) {
      setRevisionError("กรุณาแนบไฟล์อย่างน้อย 1 ไฟล์");
      return;
    }

    const formData = new FormData();

    formData.append("student_id", String(userId));
    formData.append("description", revisionDescription.trim());

    revisionFiles.forEach((file) => {
      formData.append("files", file);
    });

    setRevisionSubmitting(true);
    setRevisionError("");

    try {
      const res = await axios.post<{
        submission: ExamRevisionSubmission;
      }>(
        `http://localhost:5000/student/projects/${projectId}/exam-revision`,
        formData,
      );

      setRevisionSubmission(res.data.submission);

      setRevisionSubmissions((prev) => [
        ...prev.filter((item) => item.id !== res.data.submission.id),
        res.data.submission,
      ]);

      setSelectedRevisionId(null);
      setShowRevisionModal(false);
      setRevisionDescription("");
      setRevisionFiles([]);

      if (revisionFileInputRef.current) {
        revisionFileInputRef.current.value = "";
      }
    } catch (err) {
      setRevisionError(
        axios.isAxiosError(err)
          ? err.response?.data?.message || "ไม่สามารถส่งงานแก้ไขได้"
          : "ไม่สามารถส่งงานแก้ไขได้",
      );
    } finally {
      setRevisionSubmitting(false);
    }
  };

  /* =========================================
   SUBMIT EXAM RETAKE REQUEST
========================================= */

  const submitRetakeRequest = async () => {
    if (
      !projectId ||
      !userId ||
      retakeSubmitting ||
      retakeLoading ||
      retakeRequest ||
      retakeSent
    ) {
      return;
    }

    const confirmed = window.confirm(
      "ยืนยันการสมัครสอบโครงงานครั้งใหม่หรือไม่?",
    );

    if (!confirmed) return;

    setRetakeSubmitting(true);
    setRetakeSubmitError("");

    try {
      await axios.post(
        `http://localhost:5000/student/projects/${projectId}/exam-request`,
        {
          student_id: Number(userId),
          revision_note: "",
        },
      );

      // ส่งสำเร็จแล้ว ซ่อนปุ่มทันที
      setRetakeSent(true);
    } catch (err) {
      console.error("Submit exam retake error:", err);

      setRetakeSubmitError(
        axios.isAxiosError(err)
          ? err.response?.data?.message || "ไม่สามารถส่งคำขอสอบใหม่ได้"
          : "ไม่สามารถส่งคำขอสอบใหม่ได้",
      );
    } finally {
      setRetakeSubmitting(false);
    }
  };

  return (
    <div className="student-project-detail-page student-eval-page">
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
          className="student-detail-logout"
          onClick={handleLogout}
        >
          ออกจากระบบ
        </button>
      </aside>

      {/* MAIN */}

      <main className="student-detail-main">
        <header className="student-detail-header">
          <h2 className="student-eval-breadcrumb">
            <button type="button" onClick={() => navigate("/student-project")}>
              โครงงานของฉัน
            </button>

            <span>&gt;</span>

            <button type="button" onClick={goToOverview}>
              รายละเอียดโครงงาน
            </button>

            <span>&gt;</span>

            <span>ผลการประเมิน</span>
          </h2>

          <div className="student-detail-header-right">
            <StudentNotificationBell />

            <div className="student-detail-user">
              <img
                src={
                  profileImage ? `http://localhost:5000${profileImage}` : logo
                }
                alt="โปรไฟล์นิสิต"
              />

              <span>{username || "-"}</span>
            </div>
          </div>
        </header>

        <div className="student-detail-content">
          {/* PROJECT HEADING */}

          <div className="student-detail-project-heading">
            <h3>{project?.title || result?.project_title || "โครงงาน"}</h3>

            {project?.updated_at && (
              <p>อัปเดตล่าสุด : {formatThaiDateTime(project.updated_at)}</p>
            )}
          </div>

          {/* TABS */}

          <div className="student-detail-tabs">
            <button type="button" onClick={goToOverview}>
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

            <button
              type="button"
              onClick={() =>
                navigate(`/student-project-detail/${projectId}/documents`)
              }
            >
              เอกสารและการส่งงาน
            </button>

            <button
              type="button"
              onClick={() => navigate(`/student-project-exam/${projectId}`)}
            >
              กำหนดการสอบ
            </button>

            <button type="button" className="active">
              ผลการประเมิน
            </button>
          </div>

          {/* EVALUATION PANEL */}

          <section className="student-eval-panel">
            <h3>ผลการประเมิน</h3>

            {loading ? (
              <div className="student-eval-message">
                กำลังโหลดผลการประเมิน...
              </div>
            ) : error ? (
              <div className="student-eval-message">{error}</div>
            ) : !result || result.status === "pending" ? (
              /* S060 - NOT YET EVALUATED */

              <div className="student-eval-empty-area">
                <div className="student-eval-empty-box">
                  <h4>ยังไม่มีผลการประเมิน</h4>

                  <div className="student-eval-divider" />

                  <p>
                    ผลการประเมินจะแสดงเมื่อคณะกรรมการ
                    <br />
                    ดำเนินการประเมินเรียบร้อยแล้ว
                  </p>
                </div>
              </div>
            ) : (
              /* S061 - EVALUATION RESULT */
              <>
                <div className="student-eval-result-card">
                  {/* TITLE + GRADE */}

                  <div className="student-eval-result-header">
                    <strong>{result.project_title}</strong>

                    {finalResultStatus === "ผ่าน" && (
                      <span className="student-eval-grade">
                        เกรดที่คาดว่าจะได้รับ {result.grade}
                      </span>
                    )}
                  </div>

                  <div className="student-eval-divider" />

                  {/* RESULT SUMMARY */}

                  <div className="student-eval-summary">
                    <div className="student-eval-status-row">
                      <span>ผลการประเมิน :</span>

                      <span
                        className={`student-eval-status ${
                          finalResultStatus === "ผ่าน"
                            ? "is-pass"
                            : finalResultStatus === "ผ่านแบบมีเงื่อนไข"
                              ? "is-revision"
                              : "is-fail"
                        }`}
                      >
                        {finalResultStatus}
                      </span>
                    </div>

                    <p>คะแนนรวม : {formatScore(result.total_score)} / 100</p>

                    <p>
                      วันที่สรุปผล : {formatThaiDateTime(result.evaluated_at)}
                    </p>
                  </div>

                  {/* COMMITTEE */}

                  <div className="student-eval-committee">
                    <h4>คณะกรรมการสอบ</h4>

                    <ul>
                      {result.committee.map((teacher, index) => (
                        <li key={index}>{teacher}</li>
                      ))}
                    </ul>
                  </div>

                  {/* SCORE TABLE */}

                  <div className="student-eval-scores">
                    <h4>รายละเอียดคะแนน</h4>

                    <div className="student-eval-table-wrap">
                      <table className="student-eval-score-table">
                        <thead>
                          <tr>
                            <th>เกณฑ์การประเมิน</th>
                            <th>คะแนนเต็ม</th>
                            <th>คะแนนที่ได้</th>
                          </tr>
                        </thead>

                        <tbody>
                          {result.scores.map((item, index) => (
                            <tr key={index}>
                              <td>{item.label}</td>
                              <td>{item.max}</td>
                              <td>{formatScore(item.score)}</td>
                            </tr>
                          ))}

                          <tr className="student-eval-total-row">
                            <td>รวม</td>
                            <td>100</td>
                            <td>{formatScore(result.total_score)}</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* COMMENTS */}

                  <div className="student-eval-comments">
                    <h4>ข้อเสนอแนะจากคณะกรรมการ</h4>

                    <div className="student-eval-comment-box">
                      {result.comments.length > 0 ? (
                        result.comments.map((item, index) => (
                          <p key={index}>{item.comment}</p>
                        ))
                      ) : (
                        <p>ไม่มีข้อเสนอแนะเพิ่มเติม</p>
                      )}
                    </div>
                  </div>

                  {/* REVISION DETAILS */}

                  {result.result_status === "ผ่านแบบมีเงื่อนไข" && (
                    <div className="student-eval-revision">
                      <h4>ประเด็นที่ต้องแก้ไข</h4>

                      <div className="student-eval-comment-box">
                        {result.revision_details.length > 0 ? (
                          <>
                            {groupRevisionDetails(result.revision_details).map(
                              ([teacherName, details]) => (
                                <div
                                  key={teacherName}
                                  className="student-eval-revision-group"
                                >
                                  <strong>{teacherName}</strong>

                                  <ul className="student-eval-revision-list">
                                    {details.map((detail, index) => (
                                      <li key={index}>{detail}</li>
                                    ))}
                                  </ul>
                                </div>
                              ),
                            )}
                          </>
                        ) : (
                          <p>ไม่มีรายละเอียดประเด็นที่ต้องแก้ไข</p>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* สมัครสอบใหม่ กรณีสอบไม่ผ่าน */}
                {result.result_status === "ไม่ผ่าน" && (
                  <div className="student-eval-retake">
                    {retakeLoading ? (
                      <p>กำลังตรวจสอบสถานะคำขอสอบใหม่...</p>
                    ) : retakeLoadError ? (
                      <p>{retakeLoadError}</p>
                    ) : retakeSent ? (
                      <p>
                        ส่งคำขอสมัครสอบใหม่เรียบร้อยแล้ว
                        <strong> สถานะ : รอพิจารณา</strong>
                      </p>
                    ) : retakeRequest ? (
                      <>
                        <p>
                          สถานะคำขอสอบครั้งที่ {retakeRequest.exam_round} :{" "}
                          <strong>
                            {Number(retakeRequest.has_schedule) === 1
                              ? "ประกาศกำหนดการสอบแล้ว"
                              : retakeRequest.status}
                          </strong>
                        </p>

                        {retakeRequest.advisor_comment && (
                          <p>
                            ความคิดเห็นจากอาจารย์ :{" "}
                            {retakeRequest.advisor_comment}
                          </p>
                        )}
                      </>
                    ) : (
                      <>
                        <p>
                          ผลการประเมินครั้งนี้ไม่ผ่านเกณฑ์ที่กำหนด
                          นิสิตสามารถสมัครเข้ารับการสอบใหม่ในรอบถัดไปได้
                        </p>

                        <button
                          type="button"
                          className="student-eval-retake-btn"
                          onClick={submitRetakeRequest}
                          disabled={retakeSubmitting}
                        >
                          {retakeSubmitting
                            ? "กำลังส่งคำขอ..."
                            : "สมัครสอบใหม่"}
                        </button>
                      </>
                    )}

                    {retakeSubmitError && (
                      <p className="student-eval-revision-error">
                        {retakeSubmitError}
                      </p>
                    )}
                  </div>
                )}

                {/* EXAM REVISION SUBMISSION */}

                {result.result_status === "ผ่านแบบมีเงื่อนไข" && (
                  <>
                    {revisionLoading ? (
                      <p>กำลังโหลดงานแก้ไข...</p>
                    ) : revisionLoadError ? (
                      <p className="student-eval-revision-error">
                        {revisionLoadError}
                      </p>
                    ) : displayedRevision ? (
                      <>
                        <div className="student-eval-submitted-card">
                          {/* HEADER + SELECT ROUND */}
                          <div className="student-eval-round-header">
                            <h4>งานแก้ไข</h4>

                            <select
                              value={displayedRevision.id}
                              onChange={(e) =>
                                setSelectedRevisionId(Number(e.target.value))
                              }
                              className="student-eval-round-select"
                            >
                              {revisionSubmissions.map((item, index) => (
                                <option key={item.id} value={item.id}>
                                  ครั้งที่ {index + 1}
                                </option>
                              ))}
                            </select>
                          </div>

                          <div className="student-eval-divider" />

                          <p className="student-eval-submitted-status">
                            สถานะงานแก้ไข :{" "}
                            <span
                              className={
                                displayedRevision.status === "ผ่าน"
                                  ? "student-eval-revision-complete"
                                  : ""
                              }
                            >
                              {displayedRevision.status === "ผ่าน"
                                ? "แก้ไขเรียบร้อยแล้ว"
                                : displayedRevision.status}
                            </span>
                          </p>

                          <p>
                            ส่งครั้งที่{" "}
                            {revisionSubmissions.findIndex(
                              (item) => item.id === displayedRevision.id,
                            ) + 1}
                          </p>

                          <p>ส่งโดย : {displayedRevision.student_name}</p>

                          <p>
                            ส่งเมื่อ :{" "}
                            {formatThaiDateTime(displayedRevision.submitted_at)}
                          </p>

                          <div className="student-eval-submitted-field">
                            <h5>รายละเอียดการแก้ไข</h5>

                            <div className="student-eval-submitted-description">
                              {displayedRevision.description}
                            </div>
                          </div>

                          <div className="student-eval-submitted-field">
                            <h5>ไฟล์ที่ส่ง</h5>

                            <div className="student-eval-submitted-files">
                              {displayedRevision.files.map((file, index) => (
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

                        {/* REVIEW RESULT FOR SELECTED ROUND */}

                        {(displayedRevision.status === "ต้องแก้ไข" ||
                          displayedRevision.status === "ผ่าน") && (
                          <div className="student-eval-advisor-review">
                            <h4>ผลการตรวจจากอาจารย์ที่ปรึกษา</h4>

                            <div className="student-eval-divider" />

                            <p>
                              สถานะงานแก้ไข :{" "}
                              <strong>{displayedRevision.status}</strong>
                            </p>

                            <p>
                              ตรวจเมื่อ :{" "}
                              {formatThaiDateTime(
                                displayedRevision.reviewed_at ?? null,
                              )}
                            </p>

                            <div className="student-eval-advisor-review-field">
                              <h5>ข้อเสนอแนะจากอาจารย์ที่ปรึกษา</h5>

                              <div className="student-eval-advisor-review-comment">
                                {displayedRevision.review_comment?.trim() ||
                                  "ไม่มีข้อเสนอแนะเพิ่มเติม"}
                              </div>
                            </div>
                          </div>
                        )}

                        {/* ACTIONS - ONLY LATEST ROUND CAN BE RESUBMITTED */}

                        <div className="student-eval-revision-actions">
                          {revisionSubmission?.status === "ต้องแก้ไข" &&
                          displayedRevision.id === revisionSubmission.id ? (
                            <button
                              type="button"
                              className="student-eval-resubmit-btn"
                              onClick={() => {
                                setRevisionDescription("");
                                setRevisionFiles([]);
                                setRevisionError("");
                                setShowRevisionModal(true);
                              }}
                            >
                              ส่งงานแก้ไขอีกครั้ง
                            </button>
                          ) : (
                            <button
                              type="button"
                              className="student-eval-back-btn"
                              onClick={goToOverview}
                            >
                              กลับ
                            </button>
                          )}
                        </div>
                      </>
                    ) : (
                      <div className="student-eval-revision-actions">
                        <button
                          type="button"
                          className="student-eval-revision-btn"
                          onClick={() => {
                            setRevisionError("");
                            setShowRevisionModal(true);
                          }}
                        >
                          ส่งงานแก้ไข
                        </button>
                      </div>
                    )}
                  </>
                )}
              </>
            )}
          </section>
        </div>
      </main>

      {/* =========================================
    REVISION SUBMISSION POPUP
========================================= */}

      {showRevisionModal &&
        result?.status === "published" &&
        result.result_status === "ผ่านแบบมีเงื่อนไข" && (
          <div className="student-eval-revision-overlay">
            <div
              className="student-eval-revision-modal"
              role="dialog"
              aria-modal="true"
              aria-label="ส่งงานแก้ไขหลังการสอบ"
            >
              <h3>ส่งงานแก้ไขหลังการสอบ</h3>

              <div className="student-eval-revision-modal-divider" />

              <div className="student-eval-revision-modal-issues">
                <h4>สิ่งที่ต้องดำเนินการแก้ไข</h4>

                {groupRevisionDetails(result.revision_details).map(
                  ([teacherName, details]) => (
                    <div key={teacherName}>
                      <strong>{teacherName}</strong>

                      <ul>
                        {details.map((detail, index) => (
                          <li key={index}>{detail}</li>
                        ))}
                      </ul>
                    </div>
                  ),
                )}
              </div>

              <div className="student-eval-revision-modal-field">
                <label htmlFor="revision-description">
                  รายละเอียดการแก้ไข <span>*</span>
                </label>

                <textarea
                  id="revision-description"
                  rows={4}
                  value={revisionDescription}
                  onChange={(e) => setRevisionDescription(e.target.value)}
                  placeholder="อธิบายรายละเอียดที่ดำเนินการแก้ไข..."
                />
              </div>

              <div className="student-eval-revision-modal-field">
                <label htmlFor="revision-file">
                  ไฟล์ที่ส่ง <span>*</span>
                </label>

                <input
                  id="revision-file"
                  ref={revisionFileInputRef}
                  type="file"
                  accept=".pdf,.doc,.docx"
                  multiple
                  style={{
                    position: "absolute",
                    width: "1px",
                    height: "1px",
                    opacity: 0,
                    pointerEvents: "none",
                  }}
                  onChange={(e) => {
                    const newFiles = Array.from(e.target.files || []);

                    setRevisionFiles((prevFiles) => {
                      const filesToAdd = newFiles.filter((newFile) => {
                        return !prevFiles.some(
                          (file) =>
                            file.name === newFile.name &&
                            file.size === newFile.size &&
                            file.lastModified === newFile.lastModified,
                        );
                      });

                      return [...prevFiles, ...filesToAdd];
                    });

                    e.target.value = "";
                  }}
                />

                {/* รายการไฟล์ที่เลือก */}

                {revisionFiles.length > 0 && (
                  <div className="student-eval-file-list">
                    {revisionFiles.map((file, index) => (
                      <div
                        key={`${file.name}-${file.size}-${file.lastModified}`}
                        className="student-eval-file-card"
                      >
                        <span className="student-eval-file-icon">📄</span>

                        <div className="student-eval-file-info">
                          <span className="student-eval-file-name">
                            {file.name}
                          </span>
                        </div>

                        <button
                          type="button"
                          className="student-eval-file-remove"
                          onClick={() => {
                            setRevisionFiles((prevFiles) =>
                              prevFiles.filter(
                                (_, fileIndex) => fileIndex !== index,
                              ),
                            );
                          }}
                        >
                          ลบ
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* ปุ่มเพิ่มไฟล์ */}

                <label
                  htmlFor="revision-file"
                  className="student-eval-file-picker"
                >
                  <strong>
                    {revisionFiles.length > 0 ? "+ เพิ่มไฟล์" : "+ เลือกไฟล์"}
                  </strong>

                  <small>รองรับไฟล์ PDF, DOC และ DOCX</small>
                </label>
              </div>
              {revisionError && (
                <p className="student-eval-revision-error">{revisionError}</p>
              )}
              <div className="student-eval-revision-modal-actions">
                <button
                  type="button"
                  className="student-eval-revision-cancel"
                  onClick={() => setShowRevisionModal(false)}
                >
                  ยกเลิก
                </button>

                <button
                  type="button"
                  className="student-eval-revision-submit"
                  onClick={submitExamRevision}
                  disabled={
                    revisionSubmitting ||
                    !revisionDescription.trim() ||
                    revisionFiles.length === 0
                  }
                >
                  {revisionSubmitting ? "กำลังส่ง..." : "ยืนยันการส่ง"}
                </button>
              </div>
            </div>
          </div>
        )}
    </div>
  );
}

export default StudentProjectEvaluation;
