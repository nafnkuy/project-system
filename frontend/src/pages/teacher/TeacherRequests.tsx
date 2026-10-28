import "./TeacherRequests.css";

import { useEffect, useMemo, useState } from "react";

import { useNavigate } from "react-router-dom";

import axios from "axios";

import { FaSearch } from "react-icons/fa";

import logo from "../../assets/Logo.svg";

import TeacherNotificationBell from "./TeacherNotificationBell";

interface TeacherRequest {
  id: number;

  title: string;

  source: "teacher" | "student";

  student_id: number;

  student_username: string;

  student_name: string;

  request_date: string;

  status: string;

  resubmitted_at: string | null;
}

function TeacherRequests() {
  const navigate = useNavigate();

  const userId = sessionStorage.getItem("userId");

  const username = sessionStorage.getItem("username");

  const profileImage = sessionStorage.getItem("profileImage");

  const [requests, setRequests] = useState<TeacherRequest[]>([]);

  const [loading, setLoading] = useState(true);

  const [searchTerm, setSearchTerm] = useState("");

  const [statusFilter, setStatusFilter] = useState("ทั้งหมด");

  const [currentPage, setCurrentPage] = useState(1);

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
     LOAD REQUESTS
  ========================================================= */

  useEffect(() => {
    if (!userId) return;

    axios
      .get(`http://localhost:5000/teacher/requests/${userId}`)
      .then((res) => {
        console.log("Teacher Requests =", res.data);

        setRequests(res.data);
      })
      .catch((err) => {
        console.log("Get teacher requests error:", err);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [userId]);

  /* =========================================================
     DISPLAY STATUS
  ========================================================= */

  const getDisplayStatus = (item: TeacherRequest) => {
    if (item.status === "รอพิจารณา" && item.resubmitted_at) {
      return "แก้ไขแล้ว";
    }

    return item.status;
  };

  /* =========================================================
     TYPE
  ========================================================= */

  const getTypeText = (source: "teacher" | "student") => {
    return source === "student" ? "เสนอหัวข้อโครงงาน" : "สมัครเข้าร่วม";
  };

  /* =========================================================
     SEARCH + FILTER
  ========================================================= */

  const filteredRequests = useMemo(() => {
    const keyword = searchTerm.trim().toLowerCase();

    return requests.filter((item) => {
      const displayStatus = getDisplayStatus(item);

      /*
            หน้านี้แสดงเฉพาะงานที่
            อาจารย์ต้องดำเนินการ
          */

      const isActiveRequest =
        displayStatus === "รอพิจารณา" || displayStatus === "แก้ไขแล้ว";

      if (!isActiveRequest) {
        return false;
      }

      const typeText = getTypeText(item.source);

      const matchesSearch =
        item.student_username?.toLowerCase().includes(keyword) ||
        item.student_name?.toLowerCase().includes(keyword) ||
        item.title?.toLowerCase().includes(keyword) ||
        typeText.toLowerCase().includes(keyword);

      const matchesStatus =
        statusFilter === "ทั้งหมด" || displayStatus === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [requests, searchTerm, statusFilter]);

  /* =========================================================
     PAGINATION
  ========================================================= */

  const totalPages = Math.ceil(filteredRequests.length / itemsPerPage);

  const startIndex = (currentPage - 1) * itemsPerPage;

  const currentRequests = filteredRequests.slice(
    startIndex,
    startIndex + itemsPerPage,
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter]);

  /* =========================================================
     DATE TIME
  ========================================================= */

  const formatDateTime = (value: string) => {
    if (!value) return "-";

    const date = new Date(value);

    const dateText = date.toLocaleDateString("th-TH", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });

    const timeText = date.toLocaleTimeString("th-TH", {
      hour: "2-digit",
      minute: "2-digit",
    });

    return `${dateText} ${timeText} น.`;
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
    <div className="teacher-requests-page">
      {/* =====================================================
          SIDEBAR
      ===================================================== */}

      <aside className="teacher-requests-sidebar">
        <div className="teacher-requests-logo">
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

            <li className="active">คำขอเข้าร่วมโครงงาน</li>

            <li onClick={() => navigate("/teacher-managed-projects")}>โครงงานที่ดูแล</li>

            <li onClick={() => navigate("/teacher-work")}>งานที่ต้องดำเนินการ</li>

            <li onClick={() => navigate("/teacher-decision-history")}>
              ประวัติการพิจารณา
            </li>

            <li onClick={() => navigate("/teacher-notifications")}>
              การแจ้งเตือน
            </li>

            <li>ข้อมูลส่วนตัว</li>
          </ul>
        </nav>

        <button className="teacher-requests-logout" onClick={handleLogout}>
          ออกจากระบบ
        </button>
      </aside>

      {/* =====================================================
          MAIN
      ===================================================== */}

      <main className="teacher-requests-main">
        {/* HEADER */}

        <header className="teacher-requests-header">
          <h2>คำขอเข้าร่วมโครงงาน</h2>

          <div className="teacher-requests-header-right">
            <TeacherNotificationBell />

            <div className="teacher-requests-user">
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

        {/* =====================================================
            CONTENT
        ===================================================== */}

        <div className="teacher-requests-content">
          {/* SEARCH / FILTER */}

          <div className="teacher-requests-toolbar">
            <div className="teacher-requests-search">
              <FaSearch />

              <input
                type="text"
                placeholder="ค้นหารหัส ชื่อนิสิต หรือชื่อหัวข้อโครงงาน"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div className="teacher-requests-select-wrapper">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="teacher-requests-filter"
              >
                <option value="ทั้งหมด">สถานะ</option>

                <option value="รอพิจารณา">รอพิจารณา</option>

                <option value="แก้ไขแล้ว">แก้ไขแล้ว</option>
              </select>

              <span className="teacher-requests-select-arrow">▼</span>
            </div>
          </div>

          {/* =====================================================
              TABLE CARD
          ===================================================== */}

          <div className="teacher-requests-card">
            <h3>คำขอทั้งหมด {filteredRequests.length} รายการ</h3>

            <table className="teacher-requests-table">
              <thead>
                <tr>
                  <th>ประเภท</th>

                  <th>รหัสประจำตัว</th>

                  <th>ชื่อนิสิต</th>

                  <th>ชื่อหัวข้อโครงงาน</th>

                  <th>วันเวลาที่ส่งคำขอ</th>

                  <th>สถานะ</th>

                  <th>จัดการ</th>
                </tr>
              </thead>

              <tbody>
                {loading && (
                  <tr>
                    <td colSpan={7} className="teacher-requests-message">
                      กำลังโหลดข้อมูล...
                    </td>
                  </tr>
                )}

                {!loading && currentRequests.length === 0 && (
                  <tr>
                    <td colSpan={7} className="teacher-requests-message">
                      ไม่พบคำขอ
                    </td>
                  </tr>
                )}

                {!loading &&
                  currentRequests.map((item) => {
                    const displayStatus = getDisplayStatus(item);

                    const displayDate = item.resubmitted_at
                      ? item.resubmitted_at
                      : item.request_date;

                    return (
                      <tr key={item.id}>
                        {/* TYPE */}

                        <td>{getTypeText(item.source)}</td>

                        {/* STUDENT ID */}

                        <td>{item.student_username}</td>

                        {/* STUDENT NAME */}

                        <td>{item.student_name}</td>

                        {/* PROJECT TITLE */}

                        <td>{item.title}</td>

                        {/* DATE */}

                        <td>{formatDateTime(displayDate)}</td>

                        {/* STATUS */}

                        <td>
                          <span
                            className={`teacher-requests-status ${
                              displayStatus === "แก้ไขแล้ว"
                                ? "resubmitted"
                                : "pending"
                            }`}
                          >
                            {displayStatus}
                          </span>
                        </td>

                        {/* MANAGE */}

                        <td>
                          <button
                            className="teacher-requests-detail-btn"
                            onClick={() =>
                              navigate(`/teacher-request-details/${item.id}`, {
                                state: {
                                  from: "requests",
                                },
                              })
                            }
                          >
                            รายละเอียด
                          </button>
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>

            {/* =================================================
                PAGINATION
            ================================================= */}

            {!loading && totalPages > 0 && (
              <div className="teacher-requests-pagination">
                <button
                  disabled={currentPage === 1}
                  onClick={() =>
                    setCurrentPage((page) => Math.max(page - 1, 1))
                  }
                >
                  ‹
                </button>

                <span>{currentPage}</span>

                <button
                  disabled={currentPage === totalPages}
                  onClick={() =>
                    setCurrentPage((page) => Math.min(page + 1, totalPages))
                  }
                >
                  ›
                </button>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

export default TeacherRequests;
