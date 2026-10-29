
import "./StudentProjectDetail.css";
import "./StudentProjectEvaluation.css";

import { useEffect, useState } from "react";
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
    };

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
          axios.get<ProjectData>(
            `http://localhost:5000/projects/${projectId}`
          ),

          axios.get<EvaluationResult>(
            `http://localhost:5000/student/projects/${projectId}/evaluation/${userId}`
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
            ? err.response?.data?.message ||
                "ไม่สามารถโหลดผลการประเมินได้"
            : "ไม่สามารถโหลดผลการประเมินได้"
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
            <button
              type="button"
              onClick={() => navigate("/student-project")}
            >
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
                  profileImage
                    ? `http://localhost:5000${profileImage}`
                    : logo
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
            <h3>
              {project?.title || result?.project_title || "โครงงาน"}
            </h3>

            {project?.updated_at && (
              <p>
                อัปเดตล่าสุด :{" "}
                {formatThaiDateTime(project.updated_at)}
              </p>
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
              <div className="student-eval-message">
                {error}
              </div>
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

              <div className="student-eval-result-card">
                {/* TITLE + GRADE */}

                <div className="student-eval-result-header">
                  <strong>{result.project_title}</strong>

                  <span className="student-eval-grade">
                    เกรดที่คาดว่าจะได้รับ {result.grade}
                  </span>
                </div>

                <div className="student-eval-divider" />

                {/* RESULT SUMMARY */}

                <div className="student-eval-summary">
                  <div className="student-eval-status-row">
                    <span>ผลการประเมิน :</span>

                    <span
                      className={`student-eval-status ${
                        result.result_status === "ผ่าน"
                          ? "is-pass"
                          : result.result_status === "ต้องแก้ไข"
                            ? "is-revision"
                            : "is-fail"
                      }`}
                    >
                      {result.result_status}
                    </span>
                  </div>

                  <p>
                    คะแนนรวม : {formatScore(result.total_score)} / 100
                  </p>

                  <p>
                    วันที่สรุปผล :{" "}
                    {formatThaiDateTime(result.evaluated_at)}
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
              </div>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}

export default StudentProjectEvaluation;
