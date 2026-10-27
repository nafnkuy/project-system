import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";

import TeacherNotificationBell from "./TeacherNotificationBell";
import logo from "../../assets/Logo.svg";

import "./TeacherManagedProjectDetail.css";

interface ProjectApi {
  title: string;
  updated_at?: string | null;
  advisor_name?: string | null;
  project_type?: string | null;
  major?: string | null;
  academic_year?: string | null;
  description?: string | null;
  objectives?: string | null;
  skills?: string | null;
  members?: {
    id: number;
    username: string;
    name: string;
  }[];
}

interface TaskApi {
  id: number;
  task_name: string;
  status: string;
  review_status: string | null;
  assignee_name: string | null;
  submitted_at: string | null;
  due_date: string | null;
  completed_subtasks: number;
  total_subtasks: number;
}

interface PhaseApi {
  id: number;
  phase_name: string;
  start_date: string | null;
  due_date: string | null;
  status: string;
  tasks: TaskApi[];
}

interface PlanApi {
  phases: PhaseApi[];
}

interface OverviewData {
  title: string;
  updated_at: string;
  total_tasks: number;
  completed_tasks: number;
  in_progress_tasks: number;
  overdue_tasks: number;
  current_phase_name: string;
  current_phase_start: string;
  current_phase_end: string;
  current_phase_progress: number;
  current_phase_done_tasks: number;
  current_phase_total_tasks: number;
  pending_reviews: {
    task_title: string;
    phase_name: string;
    student_name: string;
    submitted_at: string;
    completed_subtasks: number;
    total_subtasks: number;
    progress_percent: number;
  }[];
  project_info: {
    advisor_name: string;
    project_type: string;
    major: string;
    academic_year: string;
    students: string[];
    description: string;
    objectives: string[];
    technologies: string[];
  };
}

interface EvaluationData {
  hasEvaluation: boolean;
  totalScore?: number;
  committeeNames?: string[];
  details?: {
    criteria: string;
    fullScore: number;
    score: number;
  }[];
  comment?: string;
  needsRevision?: boolean;
  revisionDetails?: string;
}

function TeacherManagedProjectDetail() {
  const { projectId } = useParams();

  const navigate = useNavigate();

  const username = sessionStorage.getItem("username");
  const profileImage = sessionStorage.getItem("profileImage");

  const handleLogout = () => {
    sessionStorage.removeItem("userId");
    sessionStorage.removeItem("username");
    sessionStorage.removeItem("name");
    sessionStorage.removeItem("profileImage");

    navigate("/");
  };

  const [activeTab, setActiveTab] = useState<"overview" | "evaluation">(
    "overview",
  );
  const [overview, setOverview] = useState<OverviewData | null>(null);
  const [evaluation, setEvaluation] = useState<EvaluationData | null>(null);

  useEffect(() => {
    fetchOverview();

    if (activeTab === "evaluation") {
      fetchEvaluation();
    }
  }, [projectId, activeTab]);

  const fetchOverview = async () => {
    if (!projectId) return;

    try {
      const [projectRes, planRes] = await Promise.all([
        axios.get<ProjectApi>(`http://localhost:5000/projects/${projectId}`),
        axios.get<PlanApi>(
          `http://localhost:5000/student/projects/${projectId}/plan`,
        ),
      ]);

      const project = projectRes.data;
      const phases = planRes.data.phases || [];

      // รวมงานทั้งหมดจากทุก Phase
      const allTasks = phases.flatMap((phase) => phase.tasks || []);

      // นับจำนวนงานตามสถานะ
      const completedTasks = allTasks.filter(
        (task) => task.status === "เสร็จสิ้น",
      ).length;

      const inProgressTasks = allTasks.filter(
        (task) => task.status === "กำลังดำเนินการ",
      ).length;

      const today = new Date().toLocaleDateString("sv-SE", {
        timeZone: "Asia/Bangkok",
      });

      const overdueTasks = allTasks.filter((task) => {
        if (!task.due_date || task.status === "เสร็จสิ้น") {
          return false;
        }

        return task.due_date.slice(0, 10) < today;
      }).length;

      // ค้นหา Phase ปัจจุบัน
      const currentPhase =
        phases.find((phase) => phase.status === "กำลังดำเนินการ") ||
        phases.find((phase) => phase.status !== "เสร็จสิ้น") ||
        phases[phases.length - 1];

      const phaseTasks = currentPhase?.tasks || [];

      const phaseCompleted = phaseTasks.filter(
        (task) => task.status === "เสร็จสิ้น",
      ).length;

      const phaseProgress =
        phaseTasks.length > 0
          ? Math.round((phaseCompleted / phaseTasks.length) * 100)
          : 0;

      // งานที่รออาจารย์ตรวจ
      const pendingReviews = phases.flatMap((phase) =>
        (phase.tasks || [])
          .filter((task) => task.review_status === "รอตรวจ")
          .map((task) => ({
            task_title: task.task_name,
            phase_name: phase.phase_name,
            student_name: task.assignee_name || "-",
            submitted_at: task.submitted_at || "",
            completed_subtasks: Number(task.completed_subtasks || 0),
            total_subtasks: Number(task.total_subtasks || 0),
            progress_percent:
              task.total_subtasks > 0
                ? Math.round(
                    (task.completed_subtasks / task.total_subtasks) * 100,
                  )
                : 0,
          })),
      );

      // ส่งข้อมูลเข้า State ที่หน้าเว็บใช้อยู่
      setOverview({
        title: project.title,
        updated_at: project.updated_at || "-",

        total_tasks: allTasks.length,
        completed_tasks: completedTasks,
        in_progress_tasks: inProgressTasks,
        overdue_tasks: overdueTasks,

        current_phase_name: currentPhase?.phase_name || "-",

        current_phase_start: currentPhase?.start_date || "-",

        current_phase_end: currentPhase?.due_date || "-",

        current_phase_progress: phaseProgress,
        current_phase_done_tasks: phaseCompleted,
        current_phase_total_tasks: phaseTasks.length,

        pending_reviews: pendingReviews,

        project_info: {
          advisor_name: project.advisor_name || "-",
          project_type: project.project_type || "-",
          major: project.major || "-",
          academic_year: project.academic_year || "-",

          students: (project.members || []).map(
            (member) => `${member.username} ${member.name}`,
          ),

          description: project.description || "-",

          objectives: (project.objectives || "")
            .split("\n")
            .map((item) => item.trim())
            .filter(Boolean),

          technologies: (project.skills || "")
            .split("|")
            .map((item) => item.trim())
            .filter(Boolean),
        },
      });
    } catch (error) {
      console.error("โหลดข้อมูลโครงงานที่ดูแลไม่สำเร็จ", error);
    }
  };

  const fetchEvaluation = async () => {
    try {
      const res = await axios.get(
        `http://localhost:5000/teacher/managed-projects/${projectId}/evaluation`,
      );
      setEvaluation(res.data);
    } catch (error) {
      console.error("โหลด evaluation ไม่สำเร็จ", error);
    }
  };

  /* =========================================
   SKILL STYLE
========================================= */

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

  if (!overview) {
    return <div className="tmd-page">กำลังโหลด...</div>;
  }

  return (
    <div className="teacher-home-page teacher-managed-detail-page">
      {/* SIDEBAR */}

      <aside className="sidebar">
        <div className="logo">
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

            <li onClick={() => navigate("/teacher-requests")}>
              คำขอเข้าร่วมโครงงาน
            </li>

            <li
              className="active"
              onClick={() => navigate("/teacher-managed-projects")}
            >
              โครงงานที่ดูแล
            </li>

            <li onClick={() => navigate("/teacher-work")}>
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

        <button type="button" className="logout-btn" onClick={handleLogout}>
          ออกจากระบบ
        </button>
      </aside>

      {/* MAIN */}

      <main className="main">
        {/* HEADER */}

        <header className="header">
          <h2 className="tmd-breadcrumb">
            <button
              type="button"
              onClick={() => navigate("/teacher-managed-projects")}
            >
              โครงงานที่ดูแล
            </button>

            <span>&gt;</span>

            <button type="button" onClick={() => setActiveTab("overview")}>
              รายละเอียดโครงงาน
            </button>

            <span>&gt;</span>

            <span>{activeTab === "overview" ? "ภาพรวม" : "ผลการประเมิน"}</span>
          </h2>

          <div className="header-right">
            <TeacherNotificationBell />

            <div className="user-info">
              <img
                src={
                  profileImage ? `http://localhost:5000${profileImage}` : logo
                }
                alt="Profile"
                className="profile-image"
              />

              <span>{username || "-"}</span>
            </div>
          </div>
        </header>

        {/* CONTENT */}

        <div className="tmd-page">
          <div className="tmd-header">
            <h3>{overview.title}</h3>
            <p>อัปเดตล่าสุด : {overview.updated_at}</p>
          </div>

          {/* =========================================
    TABS
========================================= */}

          <div className="tmd-tabs">
            <button
              type="button"
              className={activeTab === "overview" ? "active" : ""}
              onClick={() => setActiveTab("overview")}
            >
              ภาพรวม
            </button>

            <button
              type="button"
              className={activeTab === "evaluation" ? "active" : ""}
              onClick={() => setActiveTab("evaluation")}
            >
              ผลการประเมิน
            </button>
          </div>

          {activeTab === "overview" ? (
            <div className="tmd-section">
              {/* =========================================
        PROJECT PROGRESS
    ========================================= */}

              <div className="tmd-progress-box">
                <p>ความคืบหน้าโครงงาน</p>

                <div className="tmd-progress-row">
                  <div className="tmd-progress-track">
                    <div
                      className="tmd-progress-fill"
                      style={{
                        width: `${
                          overview.total_tasks > 0
                            ? Math.round(
                                (overview.completed_tasks /
                                  overview.total_tasks) *
                                  100,
                              )
                            : 0
                        }%`,
                      }}
                    />
                  </div>

                  <span>
                    {overview.total_tasks > 0
                      ? Math.round(
                          (overview.completed_tasks / overview.total_tasks) *
                            100,
                        )
                      : 0}
                    %
                  </span>
                </div>

                <p>
                  เสร็จสิ้นแล้ว {overview.completed_tasks} จาก{" "}
                  {overview.total_tasks} งาน
                </p>
              </div>

              {/* =========================================
        SUMMARY CARDS
    ========================================= */}

              <div className="tmd-summary-cards">
                <div className="tmd-card">
                  งานทั้งหมด
                  <strong>{overview.total_tasks}</strong>
                </div>

                <div className="tmd-card">
                  เสร็จสิ้น
                  <strong>{overview.completed_tasks}</strong>
                </div>

                <div className="tmd-card">
                  กำลังดำเนินการ
                  <strong>{overview.in_progress_tasks}</strong>
                </div>

                <div className="tmd-card">
                  เกินกำหนด
                  <strong>{overview.overdue_tasks}</strong>
                </div>
              </div>

              {/* =========================================
        CURRENT PHASE
    ========================================= */}

              <div className="tmd-box">
                <h4>Phase ปัจจุบัน</h4>

                <div className="tmd-phase-card">
                  <p>
                    <strong>{overview.current_phase_name}</strong>
                  </p>

                  <p>
                    ระยะเวลา : {overview.current_phase_start} -{" "}
                    {overview.current_phase_end}
                  </p>

                  <p>ความคืบหน้า Phase</p>

                  <div className="tmd-progress-row">
                    <div className="tmd-progress-track">
                      <div
                        className="tmd-progress-fill"
                        style={{
                          width: `${overview.current_phase_progress}%`,
                        }}
                      />
                    </div>

                    <span>{overview.current_phase_progress}%</span>
                  </div>

                  <p>
                    เสร็จสิ้นแล้ว {overview.current_phase_done_tasks} จาก{" "}
                    {overview.current_phase_total_tasks} งาน
                  </p>
                </div>
              </div>

              {/* =========================================
        PENDING REVIEWS
    ========================================= */}

              <div className="tmd-box">
                <h4>งานที่รอตรวจ</h4>

                {overview.pending_reviews.length > 0 ? (
                  overview.pending_reviews.map((item, index) => (
                    <div className="tmd-review-card" key={index}>
                      <p>
                        <strong>{item.task_title}</strong>
                      </p>

                      <p>{item.phase_name}</p>

                      <p>ผู้รับผิดชอบ : {item.student_name}</p>

                      <p>ส่งตรวจ : {item.submitted_at}</p>

                      <p>
                        Subtask : {item.completed_subtasks} /{" "}
                        {item.total_subtasks}
                      </p>

                      <div className="tmd-progress-row">
                        <div className="tmd-progress-track">
                          <div
                            className="tmd-progress-fill"
                            style={{
                              width: `${item.progress_percent}%`,
                            }}
                          />
                        </div>

                        <span>{item.progress_percent}%</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <p>ไม่มีงานรอตรวจ</p>
                )}
              </div>

              {/* =========================================
        PROJECT INFORMATION
    ========================================= */}

              <div className="tmd-box">
                <h4>ข้อมูลโครงงาน</h4>

                <div className="tmd-info-card tmd-project-info-card">
                  <p className="tmd-info-project-name">
                    <strong>{overview.title}</strong>
                  </p>

                  <h4>ข้อมูลโครงงาน</h4>
                  <hr />

                  <p>อาจารย์ที่ปรึกษา : {overview.project_info.advisor_name}</p>

                  <p>ประเภทโครงงาน : {overview.project_info.project_type}</p>

                  <p>สาขาวิชา : {overview.project_info.major}</p>

                  <p>ปีการศึกษา : {overview.project_info.academic_year}</p>

                  <h4>
                    สมาชิกในโครงงาน ({overview.project_info.students.length}/
                    {overview.project_info.project_type === "โครงงานคู่"
                      ? 2
                      : 1}
                    )
                  </h4>

                  <div className="tmd-info-member-list">
                    {overview.project_info.students.map((student, index) => (
                      <p key={index}>{student}</p>
                    ))}
                  </div>

                  <h4>รายละเอียดโครงงาน</h4>
                  <hr />

                  <p>{overview.project_info.description}</p>

                  <h4>วัตถุประสงค์</h4>
                  <hr />

                  <ul>
                    {overview.project_info.objectives.map((item, index) => (
                      <li key={index}>{item}</li>
                    ))}
                  </ul>

                  <h4>เทคโนโลยีที่ใช้</h4>
                  <hr />

                  <div className="tmd-tech-list">
                    {overview.project_info.technologies.map((tech, index) => {
                      const style = skillStyles[tech.trim()] || {
                        backgroundColor: "#F3F4F6",
                        borderColor: "#D1D5DB",
                      };

                      return (
                        <span
                          key={index}
                          className="tmd-tech-tag"
                          style={{
                            backgroundColor: style.backgroundColor,
                            border: `1px solid ${style.borderColor}`,
                          }}
                        >
                          {tech}
                        </span>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* =========================================
      EVALUATION
  ========================================= */

            <div className="tmd-section">
              <div className="tmd-box">
                <h4>ผลการประเมิน</h4>

                {evaluation?.hasEvaluation ? (
                  <div className="tmd-info-card">
                    <p>
                      <strong>{overview.title}</strong>
                    </p>

                    <hr />

                    <p>คะแนนรวม : {evaluation.totalScore} / 100</p>

                    <h4>คณะกรรมการสอบ</h4>

                    <ul>
                      {evaluation.committeeNames?.map((name, index) => (
                        <li key={index}>{name}</li>
                      ))}
                    </ul>

                    <table className="tmd-eval-table">
                      <thead>
                        <tr>
                          <th>เกณฑ์การประเมิน</th>
                          <th>คะแนนเต็ม</th>
                          <th>คะแนนที่ได้</th>
                        </tr>
                      </thead>

                      <tbody>
                        {evaluation.details?.map((item, index) => (
                          <tr key={index}>
                            <td>{item.criteria}</td>
                            <td>{item.fullScore}</td>
                            <td>{item.score}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>

                    <h4>ข้อเสนอแนะจากคณะกรรมการ</h4>

                    <div className="tmd-comment-box">
                      {evaluation.comment || "-"}
                    </div>

                    {evaluation.needsRevision && (
                      <>
                        <h4>ประเด็นที่ต้องแก้ไข</h4>

                        <div className="tmd-comment-box">
                          {evaluation.revisionDetails || "-"}
                        </div>
                      </>
                    )}
                  </div>
                ) : (
                  <div className="tmd-empty-result">
                    <p>
                      <strong>ยังไม่มีผลการประเมิน</strong>
                    </p>

                    <hr />

                    <p>
                      ผลการประเมินจะแสดงเมื่อคณะกรรมการ
                      ดำเนินการประเมินเรียบร้อยแล้ว
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default TeacherManagedProjectDetail;
