import "./TeacherWork.css";

import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { FaSearch } from "react-icons/fa";

import logo from "../../assets/Logo.svg";
import TeacherNotificationBell from "./TeacherNotificationBell";

/* =========================================================
   INTERFACE
========================================================= */

interface ReviewTask {
  id: number;
  project_id: number;
  task_name: string;
  project_title: string;

  assignee_name: string | null;
  submitted_at: string | null;
  reviewed_at: string | null;

  review_status: "รอตรวจ" | "ผ่าน" | "แก้ไข";

  // เลขรอบการส่งล่าสุด
  submission_number: number | null;

  // ผลการตรวจจากรอบก่อนหน้า
  previous_review_status: "รอตรวจ" | "ผ่าน" | "แก้ไข" | null;
}

type WorkTab = "review" | "exam" | "evaluation";
type ReviewFilter = "รอตรวจ" | "ตรวจแล้ว";

/* =========================================================
   COMPONENT
========================================================= */

function TeacherWork() {
  const navigate = useNavigate();

  const userId = sessionStorage.getItem("userId");
  const username = sessionStorage.getItem("username");
  const profileImage = sessionStorage.getItem("profileImage");

  /* =========================================================
     STATE
  ========================================================= */

  const [tasks, setTasks] = useState<ReviewTask[]>([]);

  const [activeTab, setActiveTab] = useState<WorkTab>(() => {
    const tab = new URLSearchParams(window.location.search).get("tab");

    if (tab === "exam" || tab === "evaluation") {
      return tab;
    }

    return "review";
  });

  const [reviewFilter, setReviewFilter] = useState<ReviewFilter>("รอตรวจ");

  const [searchTerm, setSearchTerm] = useState("");

  const [currentPage, setCurrentPage] = useState(1);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const itemsPerPage = 10;

  /* =========================================================
     CHECK LOGIN
  ========================================================= */

  useEffect(() => {
    if (!userId) {
      navigate("/");
    }
  }, [userId, navigate]);

  /* =========================================================
     LOAD REVIEW TASKS
  ========================================================= */

  useEffect(() => {
    if (!userId) {
      return;
    }

    let cancelled = false;

    setLoading(true);
    setError("");

    axios
      .get(`http://localhost:5000/teacher/work/reviews/${userId}`)
      .then((res) => {
        if (!cancelled) {
          setTasks(res.data.tasks || []);
        }
      })
      .catch((err) => {
        console.log("Get review tasks error:", err);

        if (!cancelled) {
          setError(
            err.response?.data?.message || "ไม่สามารถโหลดรายการตรวจงานได้",
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
  }, [userId]);

  /* =========================================================
     DASHBOARD COUNTS
  ========================================================= */

  const pendingReviewCount = tasks.filter(
    (task) => task.review_status === "รอตรวจ",
  ).length;

  /* =========================================================
     FILTER + SEARCH
  ========================================================= */

  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => {
      const matchesStatus =
        reviewFilter === "รอตรวจ"
          ? task.review_status === "รอตรวจ"
          : task.review_status === "ผ่าน" || task.review_status === "แก้ไข";

      const keyword = searchTerm.trim().toLowerCase();

      const matchesSearch =
        task.task_name.toLowerCase().includes(keyword) ||
        task.project_title.toLowerCase().includes(keyword) ||
        (task.assignee_name || "").toLowerCase().includes(keyword);

      return matchesStatus && matchesSearch;
    });
  }, [tasks, reviewFilter, searchTerm]);

  /* =========================================================
     PAGINATION
  ========================================================= */

  const totalPages = Math.max(
    1,
    Math.ceil(filteredTasks.length / itemsPerPage),
  );

  const currentTasks = filteredTasks.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage,
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, reviewFilter, activeTab]);

  /* =========================================================
     FORMAT DATE
  ========================================================= */

  const formatThaiDate = (value: string | null) => {
    if (!value) {
      return "-";
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return "-";
    }

    return date.toLocaleDateString("th-TH", {
      day: "numeric",
      month: "short",
      year: "numeric",
      timeZone: "Asia/Bangkok",
    });
  };

  /* =========================================================
     TAB TITLE
  ========================================================= */

  const tabTitle =
    activeTab === "review"
      ? "การตรวจงาน"
      : activeTab === "exam"
        ? "กำหนดการสอบ"
        : "การประเมิน";

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

            <li>โครงงานที่ดูแล</li>

            <li className="tw-active">งานที่ต้องดำเนินการ</li>

            <li onClick={() => navigate("/teacher-decision-history")}>
              ประวัติการพิจารณา
            </li>

            <li onClick={() => navigate("/teacher-notifications")}>
              การแจ้งเตือน
            </li>

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
        {/* HEADER */}

        <header className="tw-header">
          <h2>
            งานที่ต้องดำเนินการ
            {" > "}
            {tabTitle}
            {activeTab === "review" && (
              <>
                {" > "}
                {reviewFilter}
              </>
            )}
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

        <div className="tw-content">
          {/* DASHBOARD CARDS */}

          <div className="tw-dashboard-cards">
            <div className="tw-dashboard-card">
              <span className="tw-card-title">งานรอตรวจ</span>

              <strong className="tw-card-number tw-blue">
                {loading ? "..." : error ? "-" : pendingReviewCount}
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
              className={
                activeTab === "review" ? "tw-tab tw-tab-active" : "tw-tab"
              }
              onClick={() => setActiveTab("review")}
            >
              การตรวจงาน
            </button>

            <button
              type="button"
              className={
                activeTab === "exam" ? "tw-tab tw-tab-active" : "tw-tab"
              }
              onClick={() => setActiveTab("exam")}
            >
              กำหนดการสอบ
            </button>

            <button
              type="button"
              className={
                activeTab === "evaluation" ? "tw-tab tw-tab-active" : "tw-tab"
              }
              onClick={() => setActiveTab("evaluation")}
            >
              การประเมิน
            </button>
          </div>

          {/* =================================================
              PANEL
          ================================================= */}

          <section className="tw-panel">
            <h3>{tabTitle}</h3>

            {activeTab === "review" ? (
              <>
                {/* STATUS FILTER */}

                <div className="tw-review-filters">
                  <button
                    type="button"
                    className={
                      reviewFilter === "รอตรวจ"
                        ? "tw-filter tw-filter-active"
                        : "tw-filter"
                    }
                    onClick={() => setReviewFilter("รอตรวจ")}
                  >
                    รอตรวจ
                  </button>

                  <button
                    type="button"
                    className={
                      reviewFilter === "ตรวจแล้ว"
                        ? "tw-filter tw-filter-active"
                        : "tw-filter"
                    }
                    onClick={() => setReviewFilter("ตรวจแล้ว")}
                  >
                    ตรวจแล้ว
                  </button>
                </div>

                {/* SEARCH */}

                <div className="tw-search-container">
                  <div className="tw-search-box">
                    <input
                      type="search"
                      value={searchTerm}
                      placeholder="ค้นหาชื่องาน โครงงาน หรือผู้รับผิดชอบ"
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />

                    <FaSearch className="tw-search-icon" />
                  </div>
                </div>

                {/* =================================================
                    REVIEW TABLE
                ================================================= */}

                <div className="tw-table-wrap">
                  <table className="tw-table">
                    <thead>
                      <tr>
                        <th>งาน</th>
                        <th>โครงงาน</th>
                        <th>ผู้รับผิดชอบ</th>
                        <th>วันที่ส่ง</th>
                        <th>สถานะ</th>
                        <th>การดำเนินการ</th>
                      </tr>
                    </thead>

                    <tbody>
                      {loading || error || currentTasks.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="tw-empty-cell">
                            {loading
                              ? "กำลังโหลดรายการตรวจงาน..."
                              : error
                                ? error
                                : searchTerm.trim()
                                  ? "ไม่พบงานที่ตรงกับการค้นหา"
                                  : reviewFilter === "รอตรวจ"
                                    ? "ไม่มีงานรอตรวจ"
                                    : "ยังไม่มีรายการตรวจแล้ว"}
                          </td>
                        </tr>
                      ) : (
                        currentTasks.map((task) => (
                          <tr key={task.id}>
                            {/* ชื่องาน */}
                            <td>{task.task_name}</td>

                            {/* โครงงาน */}
                            <td>{task.project_title}</td>

                            {/* ผู้รับผิดชอบ */}
                            <td>{task.assignee_name || "-"}</td>

                            {/* วันที่ส่ง */}
                            <td>{formatThaiDate(task.submitted_at)}</td>

                            {/* สถานะ */}
                            <td>
                              <div className="tw-review-status-cell">
                                {task.review_status === "รอตรวจ" && (
                                  <>
                                    <span className="tw-review-status-badge tw-status-waiting">
                                      รอตรวจ
                                    </span>

                                    {Number(task.submission_number) > 1 &&
                                      task.previous_review_status ===
                                        "แก้ไข" && (
                                        <span className="tw-resubmission-label">
                                          ส่งแก้ไขครั้งที่{" "}
                                          {task.submission_number}
                                        </span>
                                      )}
                                  </>
                                )}

                                {task.review_status === "ผ่าน" && (
                                  <span className="tw-review-status-badge tw-status-passed">
                                    ผ่าน
                                  </span>
                                )}

                                {task.review_status === "แก้ไข" && (
                                  <span className="tw-review-status-badge tw-status-revision">
                                    ต้องแก้ไข
                                  </span>
                                )}
                              </div>
                            </td>

                            {/* การดำเนินการ */}
                            <td>
                              <button
                                type="button"
                                className="tw-review-btn"
                                onClick={() =>
                                  navigate(`/teacher-work/review/${task.id}`)
                                }
                              >
                                {reviewFilter === "รอตรวจ"
                                  ? "ตรวจงาน"
                                  : "ดูผลการตรวจ"}
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

                {/* PAGINATION */}

                {!loading && !error && totalPages > 1 && (
                  <div className="tw-pagination">
                    <button
                      type="button"
                      disabled={currentPage === 1}
                      onClick={() => setCurrentPage(currentPage - 1)}
                    >
                      ก่อนหน้า
                    </button>

                    <span>
                      หน้า {currentPage} / {totalPages}
                    </span>

                    <button
                      type="button"
                      disabled={currentPage === totalPages}
                      onClick={() => setCurrentPage(currentPage + 1)}
                    >
                      ถัดไป
                    </button>
                  </div>
                )}
              </>
            ) : (
              <div className="tw-placeholder">
                {activeTab === "exam"
                  ? "ส่วนกำหนดการสอบจะเชื่อมข้อมูลในขั้นถัดไป"
                  : "ส่วนการประเมินจะเชื่อมข้อมูลในขั้นถัดไป"}
              </div>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}

export default TeacherWork;
