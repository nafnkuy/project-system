import "./TeacherDecisionHistory.css";

import { useEffect, useMemo, useState } from "react";

import { useNavigate } from "react-router-dom";

import axios from "axios";

import { FaSearch } from "react-icons/fa";

import logo from "../../assets/Logo.svg";

import TeacherNotificationBell from "./TeacherNotificationBell";

interface DecisionHistory {
  id: number;

  project_id: number;

  student_id: number;

  source: "teacher" | "student";

  student_username: string;

  student_name: string;

  title: string;

  decision_date: string;

  status: "อนุมัติ" | "ต้องแก้ไข" | "ปฏิเสธ";
}

function TeacherDecisionHistory() {
  const navigate = useNavigate();

  const userId = sessionStorage.getItem("userId");

  const username = sessionStorage.getItem("username");

  const profileImage = sessionStorage.getItem("profileImage");

  const [history, setHistory] = useState<DecisionHistory[]>([]);

  const [loading, setLoading] = useState(true);

  const [searchTerm, setSearchTerm] = useState("");

  const [statusFilter, setStatusFilter] = useState("ทั้งหมด");

  const [currentPage, setCurrentPage] = useState(1);

  const itemsPerPage = 10;

  /* ================= LOGIN ================= */

  useEffect(() => {
    if (!userId) {
      navigate("/");
    }
  }, [userId, navigate]);

  /* ================= LOAD DATA ================= */

  useEffect(() => {
    if (!userId) return;

    axios
      .get(`http://localhost:5000/teacher/decision-history/${userId}`)
      .then((res) => {
        console.log("Teacher Decision History =", res.data);

        setHistory(res.data);
      })
      .catch((err) => {
        console.log("Get teacher decision history error:", err);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [userId]);

  /* ================= SEARCH / FILTER ================= */

  const filteredHistory = useMemo(() => {
    const keyword = searchTerm.trim().toLowerCase();

    return history.filter((item) => {
      const typeText =
        item.source === "student" ? "เสนอหัวข้อโครงงาน" : "สมัครเข้าร่วม";

      const matchesSearch =
        item.student_username?.toLowerCase().includes(keyword) ||
        item.student_name?.toLowerCase().includes(keyword) ||
        item.title?.toLowerCase().includes(keyword) ||
        typeText.toLowerCase().includes(keyword);

      const matchesStatus =
        statusFilter === "ทั้งหมด" || item.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [history, searchTerm, statusFilter]);

  /* ================= PAGINATION ================= */

  const totalPages = Math.ceil(filteredHistory.length / itemsPerPage);

  const startIndex = (currentPage - 1) * itemsPerPage;

  const currentHistory = filteredHistory.slice(
    startIndex,
    startIndex + itemsPerPage,
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter]);

  /* ================= DATE ================= */

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

  /* ================= TYPE ================= */

  const getTypeText = (source: "teacher" | "student") => {
    return source === "student" ? "เสนอหัวข้อโครงงาน" : "สมัครเข้าร่วม";
  };

  /* ================= LOGOUT ================= */

  const handleLogout = () => {
    sessionStorage.clear();

    navigate("/");
  };

  return (
    <div className="teacher-history-page">
      {/* ================= SIDEBAR ================= */}

      <aside className="teacher-history-sidebar">
        <div className="teacher-history-logo">
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

            <li onClick={() => navigate("/teacher-managed-projects")}>โครงงานที่ดูแล</li>

            <li onClick={() => navigate("/teacher-work")}>งานที่ต้องดำเนินการ</li>

            <li className="active">ประวัติการพิจารณา</li>

            <li onClick={() => navigate("/teacher-notifications")}>
              การแจ้งเตือน
            </li>

            <li>ข้อมูลส่วนตัว</li>
          </ul>
        </nav>

        <button className="teacher-history-logout" onClick={handleLogout}>
          ออกจากระบบ
        </button>
      </aside>

      {/* ================= MAIN ================= */}

      <main className="teacher-history-main">
        {/* HEADER */}

        <header className="teacher-history-header">
          <h2>ประวัติการพิจารณา</h2>

          <div className="teacher-history-header-right">
            <TeacherNotificationBell />

            <div className="teacher-history-user">
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

        {/* ================= CONTENT ================= */}

        <div className="teacher-history-content">
          {/* SEARCH / FILTER */}

          <div className="teacher-history-toolbar">
            <div className="teacher-history-search">
              <FaSearch />

              <input
                type="text"
                placeholder="ค้นหารหัส ชื่อนิสิต หรือชื่อหัวข้อโครงงาน"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div className="teacher-history-select-wrapper">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="teacher-history-filter"
              >
                <option value="ทั้งหมด">สถานะ</option>

                <option value="อนุมัติ">อนุมัติ</option>

                <option value="ต้องแก้ไข">ต้องแก้ไข</option>

                <option value="ปฏิเสธ">ปฏิเสธ</option>
              </select>

              <span className="teacher-history-select-arrow">▼</span>
            </div>
          </div>

          {/* ================= CARD ================= */}

          <div className="teacher-history-card">
            <h3>ประวัติการพิจารณาทั้งหมด {filteredHistory.length} รายการ</h3>

            <table className="teacher-history-table">
              <thead>
                <tr>
                  <th>ประเภท</th>

                  <th>รหัสประจำตัว</th>

                  <th>ชื่อนิสิต</th>

                  <th>ชื่อหัวข้อโครงงาน</th>

                  <th>วันเวลาที่พิจารณา</th>

                  <th>สถานะ</th>

                  <th>จัดการ</th>
                </tr>
              </thead>

              <tbody>
                {loading && (
                  <tr>
                    <td colSpan={7} className="teacher-history-message">
                      กำลังโหลดข้อมูล...
                    </td>
                  </tr>
                )}

                {!loading && currentHistory.length === 0 && (
                  <tr>
                    <td colSpan={7} className="teacher-history-message">
                      ไม่พบประวัติการพิจารณา
                    </td>
                  </tr>
                )}

                {!loading &&
                  currentHistory.map((item) => (
                    <tr key={item.id}>
                      <td>{getTypeText(item.source)}</td>

                      <td>{item.student_username}</td>

                      <td>{item.student_name}</td>

                      <td>{item.title}</td>

                      <td>{formatDateTime(item.decision_date)}</td>

                      <td>
                        <span
                          className={`teacher-history-status ${
                            item.status === "อนุมัติ"
                              ? "approved"
                              : item.status === "ต้องแก้ไข"
                                ? "revision"
                                : "rejected"
                          }`}
                        >
                          {item.status}
                        </span>
                      </td>

                      <td>
                        <button
                          className="teacher-history-detail-btn"
                          onClick={() =>
                            navigate(`/teacher-request-details/${item.id}`)
                          }
                        >
                          รายละเอียด
                        </button>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>

            {/* ================= PAGINATION ================= */}

            {!loading && totalPages > 0 && (
              <div className="teacher-history-pagination">
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

export default TeacherDecisionHistory;
