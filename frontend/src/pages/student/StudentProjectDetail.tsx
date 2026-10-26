import "./StudentProjectDetail.css";

import { useEffect, useState } from "react";

import { useNavigate, useParams } from "react-router-dom";

import axios from "axios";

import logo from "../../assets/Logo.svg";

import StudentNotificationBell from "./StudentNotificationBell";

/* =========================================================
   TYPE
========================================================= */

interface ProjectMember {
  id: number;
  username: string;
  name: string;
}

interface ProjectDetailData {
  id: number;

  title: string;

  advisor: string | null;
  advisor_id: number | null;
  advisor_name: string | null;

  major: string | null;

  status: string;

  project_type: string;

  max_members: number;
  current_members: number;

  academic_year: string | null;

  description: string | null;
  objectives: string | null;
  skills: string | null;
  requirements: string | null;

  source: "teacher" | "student";

  members: ProjectMember[];
}

/* =========================================================
   PROJECT OVERVIEW - PLAN DATA
========================================================= */

interface OverviewTask {
  id: number;
  task_name: string;

  // ชื่อผู้รับผิดชอบ
  assignee_name: string | null;

  status: "ยังไม่เริ่ม" | "กำลังดำเนินการ" | "เสร็จสิ้น";
  review_status: "ยังไม่ส่ง" | "รอตรวจ" | "ผ่าน" | "แก้ไข";

  start_date: string | null;
  due_date: string | null;
  submitted_at: string | null;
  updated_at: string | null;

  completed_subtasks: number;
  total_subtasks: number;
}

interface OverviewPhase {
  id: number;
  phase_name: string;
  phase_order: number;

  status: "ยังไม่เริ่ม" | "กำลังดำเนินการ" | "เสร็จสิ้น";

  start_date: string | null;
  due_date: string | null;
  updated_at: string | null;

  completed_tasks: number;
  total_tasks: number;

  tasks: OverviewTask[];
}

interface OverviewPlanResponse {
  phases: OverviewPhase[];
}

/* =========================================================
   COMPONENT
========================================================= */

function StudentProjectDetail() {
  const navigate = useNavigate();

  const { projectId } = useParams();

  /* =========================================================
     SESSION
  ========================================================= */

  const userId = sessionStorage.getItem("userId");

  const username = sessionStorage.getItem("username");

  const profileImage = sessionStorage.getItem("profileImage");

  /* =========================================================
     STATE
  ========================================================= */

  const [project, setProject] = useState<ProjectDetailData | null>(null);

  const [loading, setLoading] = useState(true);

  /* =========================================================
   PROJECT OVERVIEW - STATES
========================================================= */

  const [phases, setPhases] = useState<OverviewPhase[]>([]);

  const [planLoading, setPlanLoading] = useState(true);
  const [planError, setPlanError] = useState("");

  /* =========================================================
   CALCULATE PROJECT PROGRESS
========================================================= */

  // รวมงานจากทุก Phase
  const allTasks = phases.flatMap((phase) =>
    (phase.tasks || []).map((task) => ({
      ...task,

      // นำข้อมูล Phase มาใส่ใน Task
      phase_name: phase.phase_name,
      phase_order: phase.phase_order,
    })),
  );

  // จำนวนงานทั้งหมด
  const totalTasks = allTasks.length;

  // งานที่เสร็จสิ้น
  const completedTasks = allTasks.filter(
    (task) => task.status === "เสร็จสิ้น",
  ).length;

  // งานที่กำลังดำเนินการ
  const inProgressTasks = allTasks.filter(
    (task) => task.status === "กำลังดำเนินการ",
  ).length;

  // วันที่ปัจจุบันตามเวลาไทย
  const today = new Date().toLocaleDateString("sv-SE", {
    timeZone: "Asia/Bangkok",
  });

  // งานเกินกำหนดและยังไม่เสร็จ
  const overdueTasks = allTasks.filter((task) => {
    if (!task.due_date || task.status === "เสร็จสิ้น") {
      return false;
    }

    const dueDate = new Date(task.due_date).toLocaleDateString("sv-SE", {
      timeZone: "Asia/Bangkok",
    });

    return dueDate < today;
  }).length;

  // ความคืบหน้าโครงงานจากจำนวนงานที่เสร็จสิ้น
  const progressPercent =
    totalTasks === 0 ? 0 : Math.round((completedTasks / totalTasks) * 100);

  /* =========================================================
   TASK PROGRESS
========================================================= */

  // คำนวณความคืบหน้าของ Task จาก Subtask
  const taskProgress = (task: OverviewTask) => {
    const total = Number(task.total_subtasks) || 0;
    const completed = Number(task.completed_subtasks) || 0;

    if (total > 0) {
      return Math.round((completed / total) * 100);
    }

    if (task.status === "เสร็จสิ้น") {
      return 100;
    }

    return 0;
  };

  /* =========================================================
   CURRENT PHASE
========================================================= */

  const currentPhase =
    phases.find((phase) => phase.status === "กำลังดำเนินการ") ||
    phases.find((phase) => phase.status === "ยังไม่เริ่ม") ||
    phases[phases.length - 1] ||
    null;

  /* =========================================================
   ACTIVE TASKS
========================================================= */

  const activeTasks = allTasks.filter(
    (task) =>
      task.status !== "เสร็จสิ้น" &&
      task.review_status !== "รอตรวจ" &&
      task.review_status !== "ผ่าน",
  );

  /* =========================================================
   WAITING REVIEW
========================================================= */

  const waitingReviewTasks = allTasks.filter(
    (task) => task.review_status === "รอตรวจ",
  );

  /* =========================================================
   DATE FORMAT
========================================================= */

  const formatThaiDate = (value: string | null) => {
    if (!value) return "-";

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) return "-";

    return date.toLocaleDateString("th-TH", {
      timeZone: "Asia/Bangkok",
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  /* =========================================================
   FORMAT SUBMISSION DATE AND TIME
========================================================= */

  const formatThaiDateTime = (value: string | null) => {
    if (!value) return "-";

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return "-";
    }

    const thaiDate = date.toLocaleDateString("th-TH", {
      timeZone: "Asia/Bangkok",
      day: "numeric",
      month: "short",
      year: "numeric",
    });

    const thaiTime = date.toLocaleTimeString("th-TH", {
      timeZone: "Asia/Bangkok",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });

    return `${thaiDate} เวลา ${thaiTime} น.`;
  };

  /* =========================================================
     LOGIN CHECK
  ========================================================= */

  useEffect(() => {
    if (!userId) {
      navigate("/");
    }
  }, [userId, navigate]);

  /* =========================================================
     LOAD PROJECT
  ========================================================= */

  useEffect(() => {
    if (!projectId) {
      return;
    }

    axios
      .get(`http://localhost:5000/projects/${projectId}`)
      .then((res) => {
        console.log("Student Project Detail =", res.data);

        setProject(res.data);
      })
      .catch((err) => {
        console.log("Get student project detail error:", err);

        alert("ไม่สามารถโหลดข้อมูลโครงงานได้");

        navigate("/student-project");
      })
      .finally(() => {
        setLoading(false);
      });
  }, [projectId, navigate]);

  /* =========================================================
   LOAD PROJECT PLAN FOR OVERVIEW
========================================================= */

  useEffect(() => {
    if (!projectId) {
      setPlanLoading(false);
      return;
    }

    let cancelled = false;

    const loadOverviewPlan = async () => {
      try {
        setPlanLoading(true);
        setPlanError("");

        const res = await axios.get<OverviewPlanResponse>(
          `http://localhost:5000/student/projects/${projectId}/plan`,
        );

        if (cancelled) return;

        console.log("Overview Plan =", res.data);

        setPhases(res.data.phases || []);
      } catch (err) {
        if (cancelled) return;

        console.log("Load overview plan error:", err);

        setPlanError("ไม่สามารถโหลดข้อมูลแผนงานได้");
      } finally {
        if (!cancelled) {
          setPlanLoading(false);
        }
      }
    };

    loadOverviewPlan();

    return () => {
      cancelled = true;
    };
  }, [projectId]);

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
     DATA FORMAT
  ========================================================= */

  const objectives = project?.objectives
    ? project.objectives
        .split(/\r?\n|\|/)
        .map((item) => item.trim().replace(/^[-•]\s*/, ""))
        .filter(Boolean)
    : [];

  const requirements = project?.requirements
    ? project.requirements
        .split("|")
        .map((item) => item.trim())
        .filter(Boolean)
    : [];

  const skills = project?.skills
    ? project.skills
        .split(/[|,]/)
        .map((item) => item.trim())
        .filter(Boolean)
    : [];

  /* =========================================================
     SKILL STYLE
  ========================================================= */

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

  /* =========================================================
     LOADING
  ========================================================= */

  if (loading) {
    return <div className="student-detail-loading">กำลังโหลดข้อมูล...</div>;
  }

  if (!project) {
    return <div className="student-detail-loading">ไม่พบข้อมูลโครงงาน</div>;
  }

  /* =========================================================
     RENDER
  ========================================================= */

  return (
    <div className="student-project-detail-page">
      {/* =====================================================
          SIDEBAR
      ===================================================== */}

      <aside className="student-detail-sidebar">
        {/* LOGO */}

        <div className="student-detail-logo">
          <img src={logo} alt="SPTC Logo" />

          <div>
            <h2>SPTC System</h2>

            <p>ระบบติดตามและสื่อสารโครงงานนิสิต</p>
          </div>
        </div>

        {/* MENU */}

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

        {/* LOGOUT */}

        <button className="student-detail-logout" onClick={handleLogout}>
          ออกจากระบบ
        </button>
      </aside>

      {/* =====================================================
          MAIN
      ===================================================== */}

      <main className="student-detail-main">
        {/* ===================================================
            HEADER
        =================================================== */}

        <header className="student-detail-header">
          <h2>
            <span
              className="student-detail-breadcrumb"
              onClick={() => navigate("/student-project")}
            >
              โครงงานของฉัน
            </span>

            <span>{" > "}</span>

            <span>รายละเอียดโครงงาน</span>

            <span>{" > "}</span>

            <span>ภาพรวม</span>
          </h2>

          <div className="student-detail-header-right">
            <StudentNotificationBell />

            <div className="student-detail-user">
              <img
                src={
                  profileImage ? `http://localhost:5000${profileImage}` : logo
                }
                alt="Profile"
              />

              <span>{username}</span>
            </div>
          </div>
        </header>

        {/* ===================================================
            CONTENT
        =================================================== */}

        <div className="student-detail-content">
          {/* =================================================
              PROJECT HEADER
          ================================================= */}

          <div className="student-detail-project-heading">
            <h3>{project.title}</h3>

            <p>อัปเดตล่าสุด : -</p>
          </div>

          {/* =================================================
              TABS
          ================================================= */}

          <div className="student-detail-tabs">
            <button className="active">ภาพรวม</button>

            <button
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
              onClick={() =>
                navigate(`/student-project-exam/${projectId}`)
              }
            >
              กำหนดการสอบ
            </button>

            <button>ผลการประเมิน</button>
          </div>

          {/* =================================================
              PROGRESS OVERVIEW
          ================================================= */}

          <section className="student-overview-card">
            <h3>ความคืบหน้าโครงงาน</h3>

            <div className="student-overview-progress-row">
              <div className="student-overview-progress-track">
                <div
                  className="student-overview-progress-fill"
                  style={{
                    width: `${progressPercent}%`,
                  }}
                />
              </div>

              <span>{progressPercent}%</span>
            </div>

            <p className="student-overview-progress-text">
              {totalTasks === 0
                ? "ยังไม่มีแผนงาน"
                : `เสร็จสิ้นแล้ว ${completedTasks} จาก ${totalTasks} งาน`}
            </p>

            {/* DASHBOARD */}

            <div className="student-overview-summary">
              <div className="student-overview-summary-card">
                <span>งานทั้งหมด</span>

                <strong className="total">{totalTasks}</strong>
              </div>

              <div className="student-overview-summary-card">
                <span>เสร็จสิ้น</span>

                <strong className="completed">{completedTasks}</strong>
              </div>

              <div className="student-overview-summary-card">
                <span>กำลังดำเนินการ</span>

                <strong className="working">{inProgressTasks}</strong>
              </div>

              <div className="student-overview-summary-card">
                <span>เกินกำหนด</span>

                <strong className="overdue">{overdueTasks}</strong>
              </div>
            </div>
          </section>

          {/* =================================================
    CURRENT PHASE
================================================= */}

          <section className="student-overview-section">
            <h3>Phase ปัจจุบัน</h3>

            {planLoading ? (
              <div className="student-overview-empty-card">
                <p>กำลังโหลดแผนงาน...</p>
              </div>
            ) : planError ? (
              <div className="student-overview-empty-card">
                <p>{planError}</p>
              </div>
            ) : currentPhase ? (
              <div className="s039-phase-card">
                {/* ชื่อ Phase และสถานะ */}

                <div className="s039-phase-heading">
                  <strong>
                    Phase {currentPhase.phase_order} : {currentPhase.phase_name}
                  </strong>

                  <span
                    className={
                      currentPhase.status === "เสร็จสิ้น"
                        ? "s039-phase-status completed"
                        : currentPhase.status === "กำลังดำเนินการ"
                          ? "s039-phase-status working"
                          : "s039-phase-status not-started"
                    }
                  >
                    {currentPhase.status}
                  </span>
                </div>

                {/* ระยะเวลา */}

                <p className="s039-phase-date">
                  ระยะเวลา : {formatThaiDate(currentPhase.start_date)}
                  {" - "}
                  {formatThaiDate(currentPhase.due_date)}
                </p>

                {/* ความคืบหน้า Phase */}

                <div className="s039-phase-progress">
                  <p>ความคืบหน้า Phase</p>

                  <div className="s039-phase-progress-row">
                    <div className="s039-phase-progress-track">
                      <div
                        className="s039-phase-progress-fill"
                        style={{
                          width: `${
                            currentPhase.total_tasks > 0
                              ? Math.round(
                                  (currentPhase.completed_tasks /
                                    currentPhase.total_tasks) *
                                    100,
                                )
                              : 0
                          }%`,
                        }}
                      />
                    </div>

                    <span>
                      {currentPhase.total_tasks > 0
                        ? Math.round(
                            (currentPhase.completed_tasks /
                              currentPhase.total_tasks) *
                              100,
                          )
                        : 0}
                      %
                    </span>
                  </div>

                  <small>
                    เสร็จสิ้นแล้ว {currentPhase.completed_tasks} จาก{" "}
                    {currentPhase.total_tasks} งาน
                  </small>
                </div>

                {/* ปุ่มดูแผนงาน */}

                <button
                  type="button"
                  className="s039-phase-button"
                  onClick={() =>
                    navigate(`/student-project-detail/${projectId}/plan`)
                  }
                >
                  ดูแผนงาน
                </button>
              </div>
            ) : (
              <div className="student-overview-empty-card">
                <p>ยังไม่มี Phase</p>
                <span>เริ่มสร้างแผนงานเพื่อกำหนด Phase ของโครงงาน</span>
              </div>
            )}
          </section>

          {/* =================================================
    ACTIVE TASKS
================================================= */}

          <section className="student-overview-section">
            <h3>งานที่ต้องดำเนินการ</h3>

            {planLoading ? (
              <div className="student-overview-empty-card">
                <p>กำลังโหลดงาน...</p>
              </div>
            ) : planError ? (
              <div className="student-overview-empty-card">
                <p>{planError}</p>
              </div>
            ) : activeTasks.length > 0 ? (
              <div className="student-overview-card-stack">
                {activeTasks.map((task) => (
                  <div className="student-overview-data-card" key={task.id}>
                    {/* ชื่องานและสถานะ */}

                    <div className="student-overview-title-line">
                      <strong>{task.task_name}</strong>

                      <span className="student-overview-status is-active">
                        กำลังดำเนินการ
                      </span>
                    </div>

                    {/* ข้อมูลของงาน */}

                    <p>
                      Phase {task.phase_order} : {task.phase_name}
                    </p>

                    <p>ผู้รับผิดชอบ : {task.assignee_name || "-"}</p>

                    <p>กำหนดส่ง : {formatThaiDate(task.due_date)}</p>

                    {/* ความคืบหน้าของ Subtask */}

                    <div className="student-overview-progress-detail">
                      <p>
                        Subtask : {task.completed_subtasks} /{" "}
                        {task.total_subtasks}
                      </p>

                      <div className="student-overview-mini-progress-row">
                        <div className="student-overview-mini-track">
                          <div
                            className="student-overview-mini-fill"
                            style={{
                              width: `${taskProgress(task)}%`,
                            }}
                          />
                        </div>

                        <span>{taskProgress(task)}%</span>
                      </div>
                    </div>

                    {/* ปุ่มทำงานต่อ */}

                    <button
                      type="button"
                      className="student-overview-outline-btn"
                      onClick={() =>
                        navigate(
                          `/student-project-detail/${projectId}/plan/task/${task.id}`,
                        )
                      }
                    >
                      ทำงานต่อ
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="student-overview-empty-card">
                <p>ยังไม่มีงานที่ต้องดำเนินการ</p>
              </div>
            )}
          </section>

          {/* =================================================
    WAITING REVIEW
================================================= */}

          <section className="student-overview-section">
            <h3>งานที่รออาจารย์ตรวจ</h3>

            {planLoading ? (
              <div className="student-overview-empty-card">
                <p>กำลังโหลดงาน...</p>
              </div>
            ) : planError ? (
              <div className="student-overview-empty-card">
                <p>{planError}</p>
              </div>
            ) : waitingReviewTasks.length > 0 ? (
              <div className="student-overview-card-stack">
                {waitingReviewTasks.map((task) => (
                  <div key={task.id} className="student-overview-data-card">
                    {/* ชื่องานและสถานะ */}

                    <div className="student-overview-title-line">
                      <strong>{task.task_name}</strong>

                      <span className="student-overview-status is-waiting">
                        รอตรวจ
                      </span>
                    </div>

                    {/* ข้อมูลงาน */}

                    <p>
                      Phase {task.phase_order} : {task.phase_name}
                    </p>

                    <p>ผู้รับผิดชอบ : {task.assignee_name || "-"}</p>

                    <p>ส่งตรวจ : {formatThaiDateTime(task.submitted_at)}</p>

                    {/* ความคืบหน้า Subtask */}

                    <div className="student-overview-progress-detail">
                      <p>
                        Subtask : {task.completed_subtasks} /{" "}
                        {task.total_subtasks}
                      </p>

                      <div className="student-overview-mini-progress-row">
                        <div className="student-overview-mini-track">
                          <div
                            className="student-overview-mini-fill"
                            style={{
                              width: `${taskProgress(task)}%`,
                            }}
                          />
                        </div>

                        <span>{taskProgress(task)}%</span>
                      </div>
                    </div>

                    {/* ปุ่มดูงาน */}

                    <button
                      type="button"
                      className="student-overview-outline-btn"
                      onClick={() =>
                        navigate(
                          `/student-project-detail/${projectId}/plan/task/${task.id}`,
                        )
                      }
                    >
                      ดูงาน
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="student-overview-empty-card">
                <p>ยังไม่มีงานที่รออาจารย์ตรวจ</p>
              </div>
            )}
          </section>

          {/* =================================================
              PROJECT INFORMATION
          ================================================= */}

          <section className="student-overview-project-section">
            <h3>ข้อมูลโครงงาน</h3>

            <div className="student-overview-project-card">
              {/* PROJECT TITLE */}

              <h2>{project.title}</h2>

              {/* BASIC INFORMATION */}

              <div className="student-overview-project-block">
                <h4>ข้อมูลโครงงาน</h4>

                <div className="student-overview-divider" />

                <p>
                  อาจารย์ที่ปรึกษา :{" "}
                  {project.advisor_name || project.advisor || "-"}
                </p>

                <p>ประเภทโครงงาน : {project.project_type || "-"}</p>

                <p>สาขาวิชา : {project.major || "-"}</p>

                <p>ปีการศึกษา : {project.academic_year || "-"}</p>

                {/* MEMBERS */}

                <h4 className="student-overview-member-title">
                  สมาชิกในโครงงาน ({project.members?.length || 0}/
                  {project.max_members || 0})
                </h4>

                {project.members && project.members.length > 0 ? (
                  project.members.map((member) => (
                    <div key={member.id} className="student-overview-member">
                      <span>{member.username}</span>

                      <span>{member.name}</span>
                    </div>
                  ))
                ) : (
                  <p>ยังไม่มีข้อมูลสมาชิก</p>
                )}
              </div>

              {/* DESCRIPTION */}

              <div className="student-overview-project-block">
                <h4>รายละเอียดโครงงาน</h4>

                <div className="student-overview-divider" />

                <p className="student-overview-description">
                  {project.description || "-"}
                </p>
              </div>

              {/* OBJECTIVES */}

              <div className="student-overview-project-block">
                <h4>วัตถุประสงค์</h4>

                <div className="student-overview-divider" />

                {objectives.length > 0 ? (
                  <ul>
                    {objectives.map((objective, index) => (
                      <li key={index}>{objective}</li>
                    ))}
                  </ul>
                ) : (
                  <p>-</p>
                )}
              </div>

              {/* SKILLS */}

              <div className="student-overview-project-block">
                <h4>เทคโนโลยีที่ใช้</h4>

                <div className="student-overview-divider" />

                <div className="student-overview-tags">
                  {skills.length > 0 ? (
                    skills.map((skill, index) => {
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
                    })
                  ) : (
                    <p>-</p>
                  )}
                </div>
              </div>

              {/* REQUIREMENTS */}

              {requirements.length > 0 && (
                <div className="student-overview-project-block">
                  <h4>คุณสมบัติ / ข้อกำหนด</h4>

                  <div className="student-overview-divider" />

                  <ul>
                    {requirements.map((requirement, index) => (
                      <li key={index}>{requirement}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}

export default StudentProjectDetail;
