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

/* =========================================================
   EXAM SCHEDULE INTERFACE
========================================================= */

interface ExamProject {
  project_id: number;
  project_title: string;
  academic_year: string | null;
  student_names: string | null;

  schedule_id: number | null;
  exam_date: string | null;
  start_time: string | null;
  end_time: string | null;
  location: string | null;
  committee: string | null;
  notes: string | null;
  announced_at: string | null;
}

interface ExamListResponse {
  pending: ExamProject[];
  announced: ExamProject[];
  pending_count: number;
  announced_count: number;
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

  /* =========================================================
   EXAM SCHEDULE STATE
========================================================= */

  const [examData, setExamData] = useState<ExamListResponse>({
    pending: [],
    announced: [],
    pending_count: 0,
    announced_count: 0,
  });

  const [examFilter, setExamFilter] = useState<"รอประกาศ" | "ประกาศแล้ว">(
    "รอประกาศ",
  );

  const [examSearchTerm, setExamSearchTerm] = useState("");

  const [examLoading, setExamLoading] = useState(true);
  const [examError, setExamError] = useState("");

  /* =========================================================
   EXAM ANNOUNCEMENT MODAL
========================================================= */

  const [selectedExamProject, setSelectedExamProject] =
    useState<ExamProject | null>(null);

  const [examForm, setExamForm] = useState({
    exam_date: "",
    start_time: "",
    end_time: "",
    location: "",
    committee: "",
    notes: "",
  });

  const [examFormError, setExamFormError] = useState("");
  const [showExamConfirm, setShowExamConfirm] = useState(false);

  /* =========================================================
   EXAM DETAIL MODAL
========================================================= */

  const [examDetailProject, setExamDetailProject] =
    useState<ExamProject | null>(null);

  /* =========================================================
   EDIT EXAM SCHEDULE STATE
========================================================= */

  const [examEditProject, setExamEditProject] = useState<ExamProject | null>(
    null,
  );

  const [examEditForm, setExamEditForm] = useState({
    exam_date: "",
    start_time: "",
    end_time: "",
    location: "",
    committee: "",
    notes: "",
  });

  const [examEditError, setExamEditError] = useState("");
  const [examEditSaving, setExamEditSaving] = useState(false);

  const [examSubmitting, setExamSubmitting] = useState(false);

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
   LOAD EXAM SCHEDULES
========================================================= */

  useEffect(() => {
    if (!userId) {
      setExamLoading(false);
      return;
    }

    let cancelled = false;

    setExamLoading(true);
    setExamError("");

    axios
      .get<ExamListResponse>(`http://localhost:5000/teacher/exams/${userId}`)
      .then((res) => {
        if (!cancelled) {
          setExamData(res.data);

          console.log("Exam schedules:", res.data);
        }
      })
      .catch((err) => {
        console.log("Load exam schedules error:", err);

        if (!cancelled) {
          setExamError(
            err.response?.data?.message || "ไม่สามารถโหลดกำหนดการสอบได้",
          );
        }
      })
      .finally(() => {
        if (!cancelled) {
          setExamLoading(false);
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

  /* =================================================
   EXAM FILTER + SEARCH
================================================= */

  const filteredExamProjects = (
    examFilter === "รอประกาศ" ? examData.pending : examData.announced
  ).filter((project) => {
    const keyword = examSearchTerm.trim().toLowerCase();

    const projectName = project.project_title.toLowerCase();
    const studentNames = (project.student_names || "").toLowerCase();

    return projectName.includes(keyword) || studentNames.includes(keyword);
  });

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
   OPEN / CLOSE EXAM MODAL
========================================================= */

  const openExamModal = (project: ExamProject) => {
    setSelectedExamProject(project);

    setExamForm({
      exam_date: "",
      start_time: "",
      end_time: "",
      location: "",
      committee: "",
      notes: "",
    });

    setExamFormError("");
    setShowExamConfirm(false);
  };

  const closeExamModal = () => {
    setSelectedExamProject(null);
    setExamFormError("");
    setShowExamConfirm(false);
  };

  /* =========================================================
   CONFIRM EXAM ANNOUNCEMENT
========================================================= */

  const confirmExamAnnouncement = async () => {
    if (!selectedExamProject || !userId || examSubmitting) {
      return;
    }

    setExamSubmitting(true);
    setExamFormError("");

    try {
      // 1. บันทึกกำหนดการสอบ

      await axios.post("http://localhost:5000/teacher/exams", {
        project_id: selectedExamProject.project_id,
        advisor_id: Number(userId),

        exam_date: examForm.exam_date,
        start_time: examForm.start_time,
        end_time: examForm.end_time,

        location: examForm.location,
        committee: examForm.committee,
        notes: examForm.notes,
      });

      // 2. ปิด Modal หลังบันทึกสำเร็จ

      closeExamModal();

      // 3. เปลี่ยนไปแสดงแท็บประกาศแล้ว

      setExamFilter("ประกาศแล้ว");

      // 4. โหลดข้อมูลกำหนดการสอบใหม่

      setExamLoading(true);

      try {
        const response = await axios.get<ExamListResponse>(
          `http://localhost:5000/teacher/exams/${userId}`,
        );

        setExamData(response.data);
        setExamError("");
      } catch (reloadError) {
        console.error("Reload exams error:", reloadError);

        setExamError(
          "ประกาศสำเร็จแล้ว แต่โหลดข้อมูลใหม่ไม่สำเร็จ กรุณารีเฟรชหน้า",
        );
      } finally {
        setExamLoading(false);
      }
    } catch (err) {
      console.error("Confirm exam error:", err);

      if (axios.isAxiosError(err)) {
        setExamFormError(
          err.response?.data?.message || "ไม่สามารถประกาศกำหนดการสอบได้",
        );
      } else {
        setExamFormError("ไม่สามารถประกาศกำหนดการสอบได้");
      }
    } finally {
      setExamSubmitting(false);
    }
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
   EXAM DATE FOR INPUT
========================================================= */

  const toExamInputDate = (value: string | null) => {
    if (!value) return "";

    // ถ้าเป็น YYYY-MM-DD อยู่แล้ว
    if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
      return value;
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return "";
    }

    // แปลงวันที่ตามประเทศไทย
    const parts = new Intl.DateTimeFormat("en-US", {
      timeZone: "Asia/Bangkok",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).formatToParts(date);

    const getPart = (type: string) =>
      parts.find((part) => part.type === type)?.value || "";

    return `${getPart("year")}-` + `${getPart("month")}-` + `${getPart("day")}`;
  };

  /* =========================================================
   OPEN EDIT EXAM
========================================================= */

  const openExamEdit = () => {
    if (!examDetailProject?.schedule_id) return;

    // เอาข้อมูลเดิมมาใส่ฟอร์ม

    setExamEditForm({
      exam_date: toExamInputDate(examDetailProject.exam_date),
      start_time: examDetailProject.start_time?.slice(0, 5) || "",
      end_time: examDetailProject.end_time?.slice(0, 5) || "",
      location: examDetailProject.location || "",
      committee: (examDetailProject.committee || "").replace(/\|/g, "\n"),
      notes: examDetailProject.notes || "",
    });

    setExamEditError("");
    setExamEditProject(examDetailProject);

    // ปิดหน้าดูรายละเอียด
    setExamDetailProject(null);
  };

  /* =========================================================
   CLOSE EDIT EXAM
========================================================= */

  const closeExamEdit = () => {
    if (examEditSaving) return;

    // กลับไปดูรายละเอียดเดิม

    setExamDetailProject(examEditProject);
    setExamEditProject(null);
    setExamEditError("");
  };

  /* =========================================================
   SAVE EDIT EXAM
========================================================= */

  const saveExamEdit = async () => {
    if (!examEditProject?.schedule_id || !userId || examEditSaving) {
      return;
    }

    // ตรวจข้อมูลก่อนบันทึก

    if (
      !examEditForm.exam_date ||
      !examEditForm.start_time ||
      !examEditForm.end_time ||
      !examEditForm.location.trim() ||
      !examEditForm.committee.trim()
    ) {
      setExamEditError("กรุณากรอกข้อมูลที่จำเป็นให้ครบถ้วน");
      return;
    }

    if (examEditForm.start_time >= examEditForm.end_time) {
      setExamEditError("เวลาสิ้นสุดต้องมากกว่าเวลาเริ่มสอบ");
      return;
    }

    setExamEditSaving(true);
    setExamEditError("");

    try {
      // 1. บันทึกข้อมูลใหม่ลง MySQL

      await axios.put(
        `http://localhost:5000/teacher/exams/${examEditProject.schedule_id}`,
        {
          advisor_id: Number(userId),
          exam_date: examEditForm.exam_date,
          start_time: examEditForm.start_time,
          end_time: examEditForm.end_time,
          location: examEditForm.location.trim(),
          committee: examEditForm.committee.trim(),
          notes: examEditForm.notes.trim(),
        },
      );

      // 2. ปิดฟอร์มและแสดงรายละเอียดที่แก้แล้ว

      // ปิดหน้าต่างแก้ไขและรายละเอียด
      setExamEditProject(null);
      setExamDetailProject(null);

      // กลับไปที่ตารางประกาศแล้ว
      setExamFilter("ประกาศแล้ว");

      // 3. โหลดข้อมูลใหม่จาก Backend

      try {
        const response = await axios.get<ExamListResponse>(
          `http://localhost:5000/teacher/exams/${userId}`,
        );

        setExamData(response.data);
        setExamError("");

      } catch (reloadError) {
        console.error("Reload exam after edit:", reloadError);

        setExamError(
          "บันทึกสำเร็จแล้ว แต่โหลดรายการใหม่ไม่สำเร็จ กรุณารีเฟรชหน้า",
        );
      }
    } catch (err) {
      console.error("Save exam edit error:", err);

      if (axios.isAxiosError(err)) {
        setExamEditError(
          err.response?.data?.message || "ไม่สามารถแก้ไขกำหนดการสอบได้",
        );
      } else {
        setExamEditError("ไม่สามารถแก้ไขกำหนดการสอบได้");
      }
    } finally {
      setExamEditSaving(false);
    }
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

              <strong className="tw-card-number tw-orange">
                {examLoading ? "..." : examError ? "-" : examData.pending_count}
              </strong>
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
            ) : activeTab === "exam" ? (
              <>
                {/* =========================================
        EXAM STATUS FILTER
    ========================================= */}

                <div className="tw-review-filters">
                  <button
                    type="button"
                    className={
                      examFilter === "รอประกาศ"
                        ? "tw-filter tw-filter-active"
                        : "tw-filter"
                    }
                    onClick={() => setExamFilter("รอประกาศ")}
                  >
                    รอประกาศ
                  </button>

                  <button
                    type="button"
                    className={
                      examFilter === "ประกาศแล้ว"
                        ? "tw-filter tw-filter-active"
                        : "tw-filter"
                    }
                    onClick={() => setExamFilter("ประกาศแล้ว")}
                  >
                    ประกาศแล้ว
                  </button>
                </div>

                {/* =========================================
        SEARCH
    ========================================= */}

                <div className="tw-search-container">
                  <div className="tw-search-box">
                    <input
                      type="search"
                      placeholder="ค้นหาชื่อโครงงานหรือนิสิต"
                      value={examSearchTerm}
                      onChange={(e) => setExamSearchTerm(e.target.value)}
                    />

                    <FaSearch className="tw-search-icon" />
                  </div>
                </div>

                {/* =========================================
        EXAM TABLE
    ========================================= */}

                <div className="tw-table-wrap">
                  <table className="tw-table tw-exam-table">
                    <thead>
                      {examFilter === "รอประกาศ" ? (
                        <tr>
                          <th>โครงงาน</th>
                          <th>นิสิต</th>
                          <th>ปีการศึกษา</th>
                          <th>การดำเนินการ</th>
                        </tr>
                      ) : (
                        <tr>
                          <th>โครงงาน</th>
                          <th>วันที่สอบ</th>
                          <th>เวลา</th>
                          <th>สถานที่</th>
                          <th>รายละเอียด</th>
                        </tr>
                      )}
                    </thead>

                    <tbody>
                      {examLoading ||
                      examError ||
                      filteredExamProjects.length === 0 ? (
                        <tr>
                          <td
                            colSpan={examFilter === "รอประกาศ" ? 4 : 5}
                            className="tw-empty-cell"
                          >
                            {examLoading
                              ? "กำลังโหลดข้อมูล..."
                              : examError ||
                                (examSearchTerm.trim()
                                  ? "ไม่พบโครงงานที่ค้นหา"
                                  : examFilter === "รอประกาศ"
                                    ? "ไม่มีโครงงานรอประกาศ"
                                    : "ยังไม่มีการประกาศกำหนดการสอบ")}
                          </td>
                        </tr>
                      ) : (
                        filteredExamProjects.map((project) => (
                          <tr key={project.project_id}>
                            <td>{project.project_title}</td>

                            {examFilter === "รอประกาศ" ? (
                              <>
                                <td>
                                  <div className="tw-exam-students">
                                    {(project.student_names || "-")
                                      .split("|")
                                      .map((name, index) => (
                                        <span key={index}>{name.trim()}</span>
                                      ))}
                                  </div>
                                </td>

                                <td>
                                  {project.academic_year?.split("/")[0] || "-"}
                                </td>

                                <td>
                                  <button
                                    type="button"
                                    className="tw-exam-action-btn"
                                    onClick={() => openExamModal(project)}
                                  >
                                    ประกาศกำหนดการ
                                  </button>
                                </td>
                              </>
                            ) : (
                              <>
                                <td>{formatThaiDate(project.exam_date)}</td>

                                <td>
                                  {project.start_time || "-"} -{" "}
                                  {project.end_time || "-"}
                                </td>

                                <td>{project.location || "-"}</td>

                                <td>
                                  <button
                                    type="button"
                                    className="tw-exam-action-btn"
                                    onClick={() =>
                                      setExamDetailProject(project)
                                    }
                                  >
                                    ดูรายละเอียด
                                  </button>
                                </td>
                              </>
                            )}
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </>
            ) : (
              <div className="tw-placeholder">
                ส่วนการประเมินจะเชื่อมข้อมูลในขั้นถัดไป
              </div>
            )}
          </section>

          {/* =========================================================
    EDIT EXAM SCHEDULE MODAL - T043
========================================================= */}

          {examEditProject && (
            <div className="tw-exam-edit-overlay">
              <form
                className="tw-exam-edit-modal"
                onSubmit={(e) => {
                  e.preventDefault();
                  saveExamEdit();
                }}
              >
                {/* HEADER */}

                <h3>แก้ไขกำหนดการสอบ</h3>

                <div className="tw-exam-edit-divider" />

                {/* PROJECT */}

                <div className="tw-exam-edit-field">
                  <label>โครงงาน</label>

                  <div className="tw-exam-edit-project-name">
                    {examEditProject.project_title}
                  </div>
                </div>

                {/* EXAM DATE */}

                <div className="tw-exam-edit-field">
                  <label>
                    วันที่สอบ <span>*</span>
                  </label>

                  <input
                    type="date"
                    required
                    value={examEditForm.exam_date}
                    onChange={(e) =>
                      setExamEditForm({
                        ...examEditForm,
                        exam_date: e.target.value,
                      })
                    }
                  />
                </div>

                {/* EXAM TIME */}

                <div className="tw-exam-edit-field">
                  <label>
                    เวลา <span>*</span>
                  </label>

                  <div className="tw-exam-edit-time-row">
                    <input
                      type="time"
                      required
                      value={examEditForm.start_time}
                      onChange={(e) =>
                        setExamEditForm({
                          ...examEditForm,
                          start_time: e.target.value,
                        })
                      }
                    />

                    <span>ถึง</span>

                    <input
                      type="time"
                      required
                      value={examEditForm.end_time}
                      onChange={(e) =>
                        setExamEditForm({
                          ...examEditForm,
                          end_time: e.target.value,
                        })
                      }
                    />
                  </div>
                </div>

                {/* LOCATION */}

                <div className="tw-exam-edit-field">
                  <label>
                    สถานที่สอบ <span>*</span>
                  </label>

                  <input
                    type="text"
                    required
                    maxLength={255}
                    value={examEditForm.location}
                    onChange={(e) =>
                      setExamEditForm({
                        ...examEditForm,
                        location: e.target.value,
                      })
                    }
                  />
                </div>

                {/* COMMITTEE */}

                <div className="tw-exam-edit-field">
                  <label>
                    กรรมการสอบ <span>*</span>
                  </label>

                  <textarea
                    rows={3}
                    required
                    value={examEditForm.committee}
                    onChange={(e) =>
                      setExamEditForm({
                        ...examEditForm,
                        committee: e.target.value,
                      })
                    }
                  />
                </div>

                {/* NOTES */}

                <div className="tw-exam-edit-field">
                  <label>หมายเหตุ</label>

                  <textarea
                    rows={3}
                    value={examEditForm.notes}
                    onChange={(e) =>
                      setExamEditForm({
                        ...examEditForm,
                        notes: e.target.value,
                      })
                    }
                  />
                </div>

                {/* ERROR */}

                {examEditError && (
                  <p className="tw-exam-edit-error">{examEditError}</p>
                )}

                {/* ACTIONS */}

                <div className="tw-exam-edit-actions">
                  <button
                    type="button"
                    className="tw-exam-edit-cancel"
                    onClick={closeExamEdit}
                    disabled={examEditSaving}
                  >
                    ยกเลิก
                  </button>

                  <button
                    type="submit"
                    className="tw-exam-edit-save"
                    disabled={examEditSaving}
                  >
                    {examEditSaving ? "กำลังบันทึก..." : "บันทึกการแก้ไข"}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* =========================================================
    EXAM DETAIL MODAL
========================================================= */}

          {examDetailProject && (
            <div
              className="tw-exam-detail-overlay"
              role="presentation"
              onClick={() => setExamDetailProject(null)}
            >
              <div
                className="tw-exam-detail-modal"
                role="dialog"
                aria-modal="true"
                aria-label="รายละเอียดกำหนดการสอบ"
                onClick={(e) => e.stopPropagation()}
              >
                {/* TITLE */}

                <h3>รายละเอียดกำหนดการสอบ</h3>

                <div className="tw-exam-detail-divider" />

                {/* PROJECT NAME */}

                <div className="tw-exam-detail-project">
                  <strong>{examDetailProject.project_title}</strong>
                </div>

                {/* BASIC INFO */}

                <div className="tw-exam-detail-info">
                  <p>
                    วันที่สอบ : {formatThaiDate(examDetailProject.exam_date)}
                  </p>

                  <p>
                    เวลา : {examDetailProject.start_time?.slice(0, 5) || "-"}
                    {" - "}
                    {examDetailProject.end_time?.slice(0, 5) || "-"} น.
                  </p>

                  <p>สถานที่สอบ : {examDetailProject.location || "-"}</p>
                </div>

                {/* COMMITTEE */}

                <div className="tw-exam-detail-section">
                  <h4>กรรมการสอบ</h4>

                  {examDetailProject.committee ? (
                    <ul>
                      {examDetailProject.committee
                        .split(/\r?\n|\|/)
                        .map((name) => name.trim())
                        .filter(Boolean)
                        .map((name, index) => (
                          <li key={index}>{name}</li>
                        ))}
                    </ul>
                  ) : (
                    <p>-</p>
                  )}
                </div>

                {/* NOTES */}

                <div className="tw-exam-detail-section">
                  <h4>หมายเหตุ</h4>

                  <p className="tw-exam-detail-notes">
                    {examDetailProject.notes || "-"}
                  </p>
                </div>

                {/* ANNOUNCED DATE */}

                <p className="tw-exam-detail-announced">
                  ประกาศเมื่อ : {formatThaiDate(examDetailProject.announced_at)}
                  {" เวลา "}
                  {examDetailProject.announced_at &&
                  !Number.isNaN(
                    new Date(examDetailProject.announced_at).getTime(),
                  )
                    ? new Date(
                        examDetailProject.announced_at,
                      ).toLocaleTimeString("th-TH", {
                        timeZone: "Asia/Bangkok",
                        hour: "2-digit",
                        minute: "2-digit",
                        hour12: false,
                      })
                    : "-"}
                  {" น."}
                </p>

                {/* BUTTONS */}

                <div className="tw-exam-detail-actions">
                  <button
                    type="button"
                    className="tw-exam-detail-back"
                    onClick={() => setExamDetailProject(null)}
                  >
                    กลับ
                  </button>

                  <button
                    type="button"
                    className="tw-exam-detail-edit"
                    onClick={openExamEdit}
                  >
                    แก้ไขกำหนดการ
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* =================================================
    EXAM ANNOUNCEMENT MODAL
================================================= */}

          {selectedExamProject && (
            <div className="tw-exam-modal-overlay">
              <div className="tw-exam-modal">
                {!showExamConfirm ? (
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();

                      if (examForm.start_time >= examForm.end_time) {
                        setExamFormError("เวลาสิ้นสุดต้องมากกว่าเวลาเริ่มสอบ");
                        return;
                      }

                      setExamFormError("");
                      setShowExamConfirm(true);
                    }}
                  >
                    <h3>ประกาศกำหนดการสอบ</h3>

                    <div className="tw-exam-modal-divider" />

                    {/* ชื่อโครงงาน */}

                    <div className="tw-exam-form-group">
                      <label>โครงงาน</label>

                      <div className="tw-exam-project-name">
                        {selectedExamProject.project_title}
                      </div>
                    </div>

                    {/* วันที่สอบ */}

                    <div className="tw-exam-form-group">
                      <label>
                        วันที่สอบ <span>*</span>
                      </label>

                      <input
                        type="date"
                        required
                        value={examForm.exam_date}
                        onChange={(e) =>
                          setExamForm({
                            ...examForm,
                            exam_date: e.target.value,
                          })
                        }
                      />
                    </div>

                    {/* เวลาสอบ */}

                    <div className="tw-exam-form-group">
                      <label>
                        เวลา <span>*</span>
                      </label>

                      <div className="tw-exam-time-row">
                        <input
                          type="time"
                          required
                          value={examForm.start_time}
                          onChange={(e) =>
                            setExamForm({
                              ...examForm,
                              start_time: e.target.value,
                            })
                          }
                        />

                        <span>ถึง</span>

                        <input
                          type="time"
                          required
                          value={examForm.end_time}
                          onChange={(e) =>
                            setExamForm({
                              ...examForm,
                              end_time: e.target.value,
                            })
                          }
                        />
                      </div>
                    </div>

                    {/* สถานที่สอบ */}

                    <div className="tw-exam-form-group">
                      <label>
                        สถานที่สอบ <span>*</span>
                      </label>

                      <input
                        type="text"
                        required
                        value={examForm.location}
                        onChange={(e) =>
                          setExamForm({
                            ...examForm,
                            location: e.target.value,
                          })
                        }
                      />
                    </div>

                    {/* กรรมการสอบ */}

                    <div className="tw-exam-form-group">
                      <label>
                        กรรมการสอบ <span>*</span>
                      </label>

                      <textarea
                        rows={3}
                        required
                        value={examForm.committee}
                        onChange={(e) =>
                          setExamForm({
                            ...examForm,
                            committee: e.target.value,
                          })
                        }
                      />
                    </div>

                    {/* หมายเหตุ */}

                    <div className="tw-exam-form-group">
                      <label>หมายเหตุ</label>

                      <textarea
                        rows={3}
                        value={examForm.notes}
                        onChange={(e) =>
                          setExamForm({
                            ...examForm,
                            notes: e.target.value,
                          })
                        }
                      />
                    </div>

                    {examFormError && (
                      <p className="tw-exam-form-error">{examFormError}</p>
                    )}

                    {/* ปุ่ม */}

                    {examFormError && (
                      <p className="tw-exam-form-error">{examFormError}</p>
                    )}

                    <div className="tw-exam-modal-actions">
                      <button
                        type="button"
                        className="tw-exam-cancel-btn"
                        onClick={closeExamModal}
                      >
                        ยกเลิก
                      </button>

                      <button type="submit" className="tw-exam-save-btn">
                        ประกาศกำหนดการ
                      </button>
                    </div>
                  </form>
                ) : (
                  <div className="tw-exam-confirm-content">
                    <h3>ยืนยันการประกาศกำหนดการสอบ</h3>

                    <div className="tw-exam-modal-divider" />

                    <p>คุณต้องการประกาศกำหนดการสอบของ</p>

                    <strong>“{selectedExamProject.project_title}”</strong>

                    <p>ให้กับนิสิตทราบหรือไม่</p>

                    <div className="tw-exam-confirm-info">
                      <p>วันที่ {formatThaiDate(examForm.exam_date)}</p>

                      <p>
                        เวลา {examForm.start_time} - {examForm.end_time} น.
                      </p>

                      <p>สถานที่ {examForm.location}</p>
                    </div>

                    <p>
                      ระบบจะแจ้งเตือนกำหนดการสอบให้นิสิตทราบ หลังจากยืนยันสำเร็จ
                    </p>

                    <div className="tw-exam-modal-actions">
                      <button
                        type="button"
                        className="tw-exam-cancel-btn"
                        onClick={() => setShowExamConfirm(false)}
                      >
                        กลับไปแก้ไข
                      </button>

                      <button
                        type="button"
                        className="tw-exam-save-btn"
                        onClick={confirmExamAnnouncement}
                        disabled={examSubmitting}
                      >
                        {examSubmitting ? "กำลังประกาศ..." : "ยืนยันการประกาศ"}
                      </button>
                    </div>
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

export default TeacherWork;
