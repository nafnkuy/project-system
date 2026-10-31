import "./StudentProject.css";
import StudentNotificationBell from "./StudentNotificationBell";

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import axios from "axios";

import logo from "../../assets/Logo.svg";

interface ProjectMember {
  id: number;
  username: string;
  name: string;
}

interface MyProjectRequest {
  request_id: number;

  project_id: number;

  student_id: number;

  request_status: string;

  request_date: string;

  decision_date: string | null;

  suggestion: string | null;

  rejection_reason: string | null;

  title: string;

  project_type: string;

  academic_year: string | null;

  source: "teacher" | "student";

  advisor_name: string;

  current_members: number;

  max_members: number;

  project_status: string;

  members: ProjectMember[];
}

interface PlanTask {
  status: string;
  updated_at: string | null;
  subtasks?: {
    updated_at: string | null;
  }[];
}

interface PlanPhase {
  updated_at: string | null;
  tasks: PlanTask[];
}

interface PlanResponse {
  phases: PlanPhase[];
}

/* =========================================================
   COMPONENT
========================================================= */

function StudentProject() {
  const navigate = useNavigate();

  /* =========================================================
     SESSION
  ========================================================= */

  const userId = sessionStorage.getItem("userId");

  const username = sessionStorage.getItem("username");

  const profileImage = sessionStorage.getItem("profileImage");

  /* =========================================================
     STATE
  ========================================================= */

  const [request, setRequest] = useState<MyProjectRequest | null>(null);

  const [loading, setLoading] = useState(true);

  const [progressData, setProgressData] = useState({
    totalTasks: 0,
    completedTasks: 0,
    lastUpdated: "-",
  });

  const [progressLoading, setProgressLoading] = useState(true);
  const [progressError, setProgressError] = useState("");

  /* =========================================================
     LOGIN CHECK
  ========================================================= */

  useEffect(() => {
    if (!userId || !username) {
      navigate("/");
    }
  }, [userId, username, navigate]);

  /* =========================================================
     LOAD MY PROJECT
  ========================================================= */

  useEffect(() => {
    if (!userId) return;

    axios
      .get(`http://localhost:5000/student/my-project/${userId}`)
      .then((res) => {
        console.log("Student My Project =", res.data);

        setRequest(res.data.request);
      })
      .catch((err) => {
        console.log("Get student project error:", err);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [userId]);

  /* =========================================================
     FORMAT DATE
  ========================================================= */

  const formatThaiDate = (dateString: string | null) => {
    if (!dateString) return "-";

    const date = new Date(dateString);

    return date.toLocaleDateString("th-TH", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const formatThaiDateTime = (value: string | null) => {
    if (!value) return "-";

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) return "-";

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

  /* =========================================
   LOAD PROJECT PROGRESS
========================================= */

  useEffect(() => {
    if (!request || request.request_status !== "อนุมัติ") {
      return;
    }

    let cancelled = false;

    const loadProgress = async () => {
      setProgressLoading(true);
      setProgressError("");

      try {
        const res = await axios.get<PlanResponse>(
          `http://localhost:5000/student/projects/${request.project_id}/plan`,
        );

        if (cancelled) return;

        const phases = res.data.phases || [];

        // รวมงานทั้งหมดจากทุก Phase
        const allTasks = phases.flatMap((phase) => phase.tasks || []);

        const completedTasks = allTasks.filter(
          (task) => task.status === "เสร็จสิ้น",
        ).length;

        // หาวันที่อัปเดตล่าสุด
        const dates: string[] = [];

        phases.forEach((phase) => {
          if (phase.updated_at) {
            dates.push(phase.updated_at);
          }

          phase.tasks?.forEach((task) => {
            if (task.updated_at) {
              dates.push(task.updated_at);
            }

            task.subtasks?.forEach((subtask) => {
              if (subtask.updated_at) {
                dates.push(subtask.updated_at);
              }
            });
          });
        });

        const validTimes = dates
          .map((value) => new Date(value).getTime())
          .filter((time) => Number.isFinite(time));

        let lastUpdated = "-";

        if (validTimes.length > 0) {
          const newest = new Date(Math.max(...validTimes));
          lastUpdated = formatThaiDateTime(newest.toISOString());
        }

        setProgressData({
          totalTasks: allTasks.length,
          completedTasks,
          lastUpdated,
        });
      } catch (err) {
        if (cancelled) return;

        console.error("Load project progress error:", err);
        setProgressError("ไม่สามารถโหลดข้อมูลความคืบหน้าได้");
      } finally {
        if (!cancelled) {
          setProgressLoading(false);
        }
      }
    };

    loadProgress();

    return () => {
      cancelled = true;
    };
  }, [request]);

  const progressPercent =
    progressData.totalTasks > 0
      ? Math.round(
          (progressData.completedTasks / progressData.totalTasks) * 100,
        )
      : 0;

  /* =========================================================
     STATUS
  ========================================================= */

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "รอพิจารณา":
        return "รอพิจารณา";

      case "ต้องแก้ไข":
        return "ต้องแก้ไข";

      case "ปฏิเสธ":
        return "ไม่อนุมัติ";

      case "อนุมัติ":
        return "อนุมัติ";

      default:
        return status || "-";
    }
  };

  const getStatusClass = (status: string) => {
    switch (status) {
      case "รอพิจารณา":
        return "pending";

      case "ต้องแก้ไข":
        return "revision";

      case "ปฏิเสธ":
        return "rejected";

      case "อนุมัติ":
        return "approved";

      default:
        return "";
    }
  };

  /* =========================================================
     SECTION TITLE
  ========================================================= */

  const getSectionTitle = () => {
    if (!request) {
      return "";
    }

    if (request.request_status === "รอพิจารณา") {
      return "คำขอที่กำลังพิจารณา";
    }

    if (request.request_status === "อนุมัติ") {
      return "โครงงานปัจจุบัน";
    }

    return "คำขอล่าสุด";
  };

  /* =========================================================
     DETAIL
  ========================================================= */

  const handleDetail = () => {
    if (!request || !userId) return;

    // อนุมัติแล้ว
    // ไปหน้ารายละเอียดโครงงานจริง
    if (request.request_status === "อนุมัติ") {
      navigate(`/student-project-detail/${request.project_id}`);

      return;
    }

    // รอพิจารณา / ต้องแก้ไข / ปฏิเสธ
    // ไปหน้ารายละเอียดคำขอ
    navigate(`/student-project-request-detail/${request.request_id}/${userId}`);
  };

  /* =========================================================
     EDIT + RESUBMIT
  ========================================================= */

  const handleEditAndResubmit = () => {
    if (!request) return;

    navigate(
      `/submit-new-project?mode=resubmit&projectId=${request.project_id}&requestId=${request.request_id}`,
    );
  };

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
    <div className="student-project-page">
      {/* =====================================================
          SIDEBAR
      ===================================================== */}

      <aside className="student-project-sidebar">
        {/* LOGO */}

        <div className="student-project-logo">
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

            <li className="active">โครงงานของฉัน</li>

            <li onClick={() => navigate("/student-notifications")}>
              การแจ้งเตือน
            </li>

            <li>ข้อมูลส่วนตัว</li>
          </ul>
        </nav>

        {/* LOGOUT */}

        <button className="student-project-logout" onClick={handleLogout}>
          ออกจากระบบ
        </button>
      </aside>

      {/* =====================================================
          MAIN
      ===================================================== */}

      <main className="student-project-main">
        {/* HEADER */}

        <header className="student-project-header">
          <h2>โครงงานของฉัน</h2>

          <div className="student-project-header-right">
            <StudentNotificationBell />

            <div className="student-project-user">
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

        <div className="student-project-content">
          {/* ================= LOADING ================= */}

          {loading && (
            <div className="student-project-empty-wrapper">
              <div className="student-project-empty-card">
                <h3>กำลังโหลดข้อมูล...</h3>
              </div>
            </div>
          )}

          {/* ================= NO PROJECT ================= */}

          {!loading && !request && (
            <div className="student-project-empty-wrapper">
              <div className="student-project-empty-card">
                <h3>ยังไม่มีโครงงาน</h3>

                <p>ขณะนี้ยังไม่มีโครงงานหรือคำขอที่อยู่ระหว่างการพิจารณา</p>

                <div className="student-project-empty-actions">
                  <button
                    className="student-project-blue-btn"
                    onClick={() => navigate("/student-home")}
                  >
                    ดูรายการหัวข้อโครงงาน
                  </button>

                  <button
                    className="student-project-green-btn"
                    onClick={() => navigate("/submit-new-project")}
                  >
                    ส่งคำเสนอโครงงานใหม่
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ================= REQUEST ================= */}

          {!loading && request && request.request_status !== "อนุมัติ" && (
            <div className="student-project-request-area">
              <h3 className="student-project-section-title">
                {getSectionTitle()}
              </h3>

              <div className="student-project-request-card">
                {/* STATUS */}

                <span
                  className={`student-project-status ${getStatusClass(
                    request.request_status,
                  )}`}
                >
                  {getStatusLabel(request.request_status)}
                </span>

                {/* DATA */}

                <div className="student-project-request-info">
                  <p className="student-project-request-title">
                    {request.title}
                  </p>

                  <p>อาจารย์ที่ปรึกษา : {request.advisor_name || "-"}</p>

                  <p>ประเภทโครงงาน : {request.project_type || "-"}</p>

                  <p>ปีการศึกษา : {request.academic_year || "-"}</p>

                  <p>วันที่ส่งคำขอ : {formatThaiDate(request.request_date)}</p>

                  <button
                    className="student-project-detail-btn"
                    onClick={handleDetail}
                  >
                    {request.request_status === "อนุมัติ"
                      ? "ดูรายละเอียดโครงงาน"
                      : "ดูรายละเอียดคำขอ"}
                  </button>
                </div>
              </div>
            </div>
          )}
          {/* ===================================================
    CURRENT PROJECT
=================================================== */}

          {!loading && request && request.request_status === "อนุมัติ" && (
            <div className="student-current-project-area">
              <h3 className="student-project-section-title">โครงงานปัจจุบัน</h3>

              <div className="student-current-project-card">
                {/* ================= STATUS ================= */}

                <span className="student-current-status">กำลังดำเนินการ</span>

                {/* ================= TITLE ================= */}

                <h3 className="student-current-project-title">
                  {request.title}
                </h3>

                {/* ================= BASIC INFO ================= */}

                <div className="student-current-project-info">
                  <p>อาจารย์ที่ปรึกษา : {request.advisor_name || "-"}</p>

                  <p>ประเภทโครงงาน : {request.project_type || "-"}</p>

                  <p>ปีการศึกษา : {request.academic_year || "-"}</p>
                </div>

                {/* ================= MEMBERS ================= */}

                <div className="student-current-members">
                  <h4>
                    สมาชิกในโครงงาน ({request.members?.length || 0}/
                    {request.max_members || 0})
                  </h4>

                  {request.members && request.members.length > 0 ? (
                    request.members.map((member) => (
                      <div
                        key={member.id}
                        className="student-current-member-row"
                      >
                        <span>{member.username}</span>

                        <span>{member.name}</span>
                      </div>
                    ))
                  ) : (
                    <p className="student-current-no-member">
                      ยังไม่มีข้อมูลสมาชิก
                    </p>
                  )}
                </div>

                {/* ================= PROGRESS ================= */}

                <div className="student-current-progress">
                  <h4>ความคืบหน้า</h4>

                  <div className="student-current-progress-row">
                    <div className="student-current-progress-track">
                      <div
                        className="student-current-progress-fill"
                        style={{
                          width: `${progressPercent}%`,
                        }}
                      />
                    </div>

                    <span className="student-current-progress-percent">
                      {progressLoading ? "..." : `${progressPercent}%`}
                    </span>
                  </div>

                  <p className="student-current-progress-text">
                    {progressLoading
                      ? "กำลังโหลดความคืบหน้า..."
                      : progressError
                        ? progressError
                        : progressData.totalTasks > 0
                          ? `เสร็จสิ้นแล้ว ${progressData.completedTasks} จาก ${progressData.totalTasks} งาน`
                          : "ยังไม่มีข้อมูลความคืบหน้า"}
                  </p>
                </div>

                {/* ================= UPDATE ================= */}

                <p className="student-current-updated">
                  อัปเดตล่าสุด :{" "}
                  {progressLoading ? "กำลังโหลด..." : progressData.lastUpdated}
                </p>

                {/* ================= BUTTON ================= */}

                <button
                  className="student-current-detail-btn"
                  onClick={handleDetail}
                >
                  ดูรายละเอียดโครงงาน
                </button>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default StudentProject;
