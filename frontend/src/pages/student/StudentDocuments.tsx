import "./StudentTaskDetail.css";
import "./StudentDocuments.css";

import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import { FaSearch, FaFileAlt } from "react-icons/fa";

import logo from "../../assets/Logo.svg";
import StudentNotificationBell from "./StudentNotificationBell";

/* =========================================================
   INTERFACE
========================================================= */

interface SubmittedFile {
  id: number;
  task_id: number;
  original_name: string;
  file_path: string;
  file_size: number | null;
  uploaded_at: string;
}

interface SubmittedTask {
  task_id: number;
  task_name: string;

  submission_count: number;

  phase_id: number | null;
  phase_name: string | null;
  phase_order: number | null;

  submitted_at: string;
  review_status: string;

  files: SubmittedFile[];
}

interface ProjectInfo {
  id: number;
  title: string;
}

interface DocumentsResponse {
  project: ProjectInfo;
  submissions: SubmittedTask[];
}

/* =========================================================
   COMPONENT
========================================================= */

function StudentDocuments() {
  const navigate = useNavigate();
  const { projectId } = useParams();

  const userId = sessionStorage.getItem("userId");
  const username = sessionStorage.getItem("username");
  const profileImage = sessionStorage.getItem("profileImage");

  /* =========================================================
     STATE
  ========================================================= */

  const [project, setProject] = useState<ProjectInfo | null>(null);
  const [submissions, setSubmissions] = useState<SubmittedTask[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [searchTerm, setSearchTerm] = useState("");
  const [phaseFilter, setPhaseFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  /* =========================================================
     LOAD SUBMITTED TASKS
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

    setLoading(true);
    setError("");

    axios
      .get(
        `http://localhost:5000/student/projects/${projectId}/submissions/${userId}`,
      )
      .then((res) => {
        if (cancelled) return;

        const data = res.data as DocumentsResponse;

        setProject(data.project);
        setSubmissions(data.submissions || []);
      })
      .catch((err) => {
        if (cancelled) return;

        console.log("Load submitted documents error:", err);

        setError(
          err.response?.data?.message || "ไม่สามารถโหลดเอกสารและการส่งงานได้",
        );
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [projectId, userId, navigate]);

  /* =========================================================
     PHASE FILTER OPTIONS
  ========================================================= */

  const phaseOptions = useMemo(() => {
    const phaseMap = new Map<
      number,
      {
        id: number;
        name: string;
        order: number;
      }
    >();

    submissions.forEach((task) => {
      if (task.phase_id !== null) {
        phaseMap.set(task.phase_id, {
          id: task.phase_id,
          name: task.phase_name || "-",
          order: task.phase_order || 0,
        });
      }
    });

    return Array.from(phaseMap.values()).sort((a, b) => a.order - b.order);
  }, [submissions]);

  /* =========================================================
     SEARCH AND FILTER
  ========================================================= */

  const filteredSubmissions = useMemo(() => {
    return submissions.filter((task) => {
      const keyword = searchTerm.trim().toLowerCase();

      const matchesSearch =
        task.task_name.toLowerCase().includes(keyword) ||
        (task.phase_name || "").toLowerCase().includes(keyword) ||
        task.files.some((file) =>
          file.original_name.toLowerCase().includes(keyword),
        );

      const matchesPhase =
        phaseFilter === "all" || String(task.phase_id) === phaseFilter;

      const matchesStatus =
        statusFilter === "all" || task.review_status === statusFilter;

      return matchesSearch && matchesPhase && matchesStatus;
    });
  }, [submissions, searchTerm, phaseFilter, statusFilter]);

  /* =========================================================
     PAGINATION
  ========================================================= */

  const totalPages = Math.max(
    1,
    Math.ceil(filteredSubmissions.length / itemsPerPage),
  );

  const currentSubmissions = filteredSubmissions.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage,
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, phaseFilter, statusFilter]);

  /* =========================================================
     DATE FORMAT
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

  /* =========================================================
     STATUS DISPLAY
  ========================================================= */

  const getStatusText = (status: string) => {
    if (status === "แก้ไข") return "ต้องแก้ไข";

    return status;
  };

  const getStatusClass = (status: string) => {
    if (status === "ผ่าน") return "sd-passed";
    if (status === "แก้ไข") return "sd-revision";
    if (status === "รอตรวจ") return "sd-waiting";

    return "sd-other";
  };

  /* =========================================================
     LOGOUT
  ========================================================= */

  const handleLogout = () => {
    sessionStorage.clear();
    navigate("/");
  };

  /* =========================================================
     RENDER
  ========================================================= */

  return (
    <div className="student-task-page">
      {/* =====================================================
          SIDEBAR
      ===================================================== */}

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

      {/* =====================================================
          MAIN
      ===================================================== */}

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

            <span>เอกสารและการส่งงาน</span>
          </h2>

          <div className="student-task-header-right">
            <StudentNotificationBell />

            <div className="student-task-user">
              <img
                src={
                  profileImage ? `http://localhost:5000${profileImage}` : logo
                }
                alt="Profile"
              />

              <span>{username || "-"}</span>
            </div>
          </div>
        </header>

        {/* =====================================================
            CONTENT
        ===================================================== */}

        <div className="student-task-content">
          {/* PROJECT NAME */}

          <div className="student-task-project-heading">
            <h3>{project?.title || "-"}</h3>
          </div>

          {/* =================================================
              TABS
          ================================================= */}

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

            <button type="button" className="active">
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

            <button type="button" disabled title="ยังไม่เปิดใช้งาน">
              ผลการประเมิน
            </button>
          </div>

          {/* =================================================
              DOCUMENT PANEL
          ================================================= */}

          <section className="sd-container">
            <h3>เอกสารและการส่งงาน</h3>

            {/* SEARCH / FILTER */}

            <div className="sd-toolbar">
              <div className="sd-search-box">
                <input
                  type="search"
                  value={searchTerm}
                  placeholder="ค้นหาชื่องานหรือชื่อไฟล์"
                  aria-label="ค้นหาชื่องานหรือชื่อไฟล์"
                  onChange={(e) => setSearchTerm(e.target.value)}
                />

                <FaSearch className="sd-search-icon" />
              </div>

              <select
                value={phaseFilter}
                aria-label="เลือก Phase"
                onChange={(e) => setPhaseFilter(e.target.value)}
              >
                <option value="all">Phase ทั้งหมด</option>

                {phaseOptions.map((phase) => (
                  <option key={phase.id} value={String(phase.id)}>
                    {phase.name}
                  </option>
                ))}
              </select>

              <select
                value={statusFilter}
                aria-label="เลือกสถานะการตรวจ"
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="all">สถานะการตรวจทั้งหมด</option>

                <option value="รอตรวจ">รอตรวจ</option>
                <option value="ผ่าน">ผ่าน</option>
                <option value="แก้ไข">ต้องแก้ไข</option>
              </select>
            </div>

            {/* =================================================
                TABLE
            ================================================= */}

            <div className="sd-table-wrapper">
              <table className="sd-table">
                <thead>
                  <tr>
                    <th>งาน</th>
                    <th>Phase</th>
                    <th>ไฟล์ที่ส่ง</th>
                    <th>วันที่ส่ง</th>
                    <th>สถานะ</th>
                  </tr>
                </thead>

                <tbody>
                  {loading || error || currentSubmissions.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="sd-empty">
                        {loading
                          ? "กำลังโหลดเอกสารและการส่งงาน..."
                          : error
                            ? error
                            : submissions.length === 0
                              ? "ยังไม่มีงานที่ส่งให้อาจารย์ตรวจ"
                              : "ไม่พบรายการที่ตรงกับการค้นหา"}
                      </td>
                    </tr>
                  ) : (
                    currentSubmissions.map((task) => (
                      <tr key={task.task_id}>
                        {/* TASK NAME */}

                        <td>
                          <div className="sd-task-cell">
                            <button
                              type="button"
                              className="sd-task-link"
                              title="ดูประวัติการส่งงาน"
                              onClick={() =>
                                navigate(
                                  `/student-project-detail/${projectId}/documents/${task.task_id}/history`,
                                )
                              }
                            >
                              {task.task_name}
                            </button>

                            <span className="sd-submission-count">
                              ส่งแล้ว {Number(task.submission_count) || 0} ครั้ง
                            </span>
                          </div>
                        </td>

                        {/* PHASE */}

                        <td>{task.phase_name || "-"}</td>

                        {/* SUBMITTED FILES */}

                        <td>
                          {task.files.length === 0 ? (
                            <span className="sd-no-file">
                              ไม่มีไฟล์ที่แสดงได้
                            </span>
                          ) : (
                            <div className="sd-file-list">
                              {task.files.map((file) => (
                                <a
                                  key={file.id}
                                  className="sd-file-link"
                                  href={`http://localhost:5000${file.file_path}`}
                                  target="_blank"
                                  rel="noreferrer"
                                  title={`เปิด ${file.original_name}`}
                                >
                                  <FaFileAlt />
                                  <span>{file.original_name}</span>
                                </a>
                              ))}
                            </div>
                          )}
                        </td>

                        {/* SUBMITTED DATE */}

                        <td>{formatThaiDate(task.submitted_at)}</td>

                        {/* REVIEW STATUS */}

                        <td>
                          <span
                            className={`sd-status ${getStatusClass(
                              task.review_status,
                            )}`}
                          >
                            {getStatusText(task.review_status)}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* =================================================
                PAGINATION
            ================================================= */}

            {!loading && !error && (
              <div className="sd-pagination">
                <button
                  type="button"
                  disabled={currentPage <= 1}
                  onClick={() => setCurrentPage((page) => page - 1)}
                >
                  ‹
                </button>

                <span>{currentPage}</span>

                <button
                  type="button"
                  disabled={currentPage >= totalPages}
                  onClick={() => setCurrentPage((page) => page + 1)}
                >
                  ›
                </button>
              </div>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}

export default StudentDocuments;
