import "./StaffSignatureHistory.css";

import { useEffect, useMemo, useState } from "react";

import { useNavigate } from "react-router-dom";

import { FaBell, FaSearch } from "react-icons/fa";

import axios from "axios";

import logo from "../../assets/Logo.svg";

interface SignatureHistory {
  id: number;

  document_type: string;
  document_code: string;
  document_number: string;

  approved_at: string;

  project_title: string;
  academic_year: string;

  advisor_name: string;
}

function StaffSignatureHistory() {
  const navigate = useNavigate();

  const username = sessionStorage.getItem("username");

  const profileImage = sessionStorage.getItem("profileImage");

  const userId = sessionStorage.getItem("userId");

  const [history, setHistory] = useState<SignatureHistory[]>([]);

  const [loading, setLoading] = useState(true);

  const [searchTerm, setSearchTerm] = useState("");

  const [yearFilter, setYearFilter] = useState("ทั้งหมด");

  const [currentPage, setCurrentPage] = useState(1);

  const itemsPerPage = 10;

  /* =========================
     LOGIN
  ========================= */

  useEffect(() => {
    if (!userId) {
      navigate("/");
    }
  }, [userId, navigate]);

  /* =========================
     LOAD DATA
  ========================= */

  useEffect(() => {
    axios
      .get("http://localhost:5000/staff/signature-history")
      .then((res) => {
        console.log("Signature History =", res.data);

        setHistory(res.data);
      })
      .catch((err) => {
        console.log("Get signature history error:", err);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  /* =========================
     DATE
  ========================= */

  const formatThaiDate = (dateString: string) => {
    if (!dateString) return "-";

    const date = new Date(dateString);

    return date.toLocaleDateString("th-TH", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  /* =========================
     YEARS
  ========================= */

  const academicYears = useMemo(() => {
    return [
      ...new Set(history.map((item) => item.academic_year).filter(Boolean)),
    ];
  }, [history]);

  /* =========================
     SEARCH / FILTER
  ========================= */

  const filteredHistory = history.filter((item) => {
    const keyword = searchTerm.trim().toLowerCase();

    const matchesSearch =
      item.advisor_name?.toLowerCase().includes(keyword) ||
      item.project_title?.toLowerCase().includes(keyword) ||
      item.document_number?.toLowerCase().includes(keyword);

    const matchesYear =
      yearFilter === "ทั้งหมด" || item.academic_year === yearFilter;

    return matchesSearch && matchesYear;
  });

  /* =========================
     PAGINATION
  ========================= */

  const totalPages = Math.ceil(filteredHistory.length / itemsPerPage);

  const startIndex = (currentPage - 1) * itemsPerPage;

  const currentHistory = filteredHistory.slice(
    startIndex,
    startIndex + itemsPerPage,
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, yearFilter]);

  /* =========================
     LOGOUT
  ========================= */

  const handleLogout = () => {
    sessionStorage.clear();
    navigate("/");
  };

  return (
    <div className="staff-history-page">
      {/* SIDEBAR */}

      <aside className="staff-history-sidebar">
        <div className="staff-history-logo">
          <img src={logo} alt="SPTC Logo" />

          <div>
            <h2>SPTC System</h2>

            <p>ระบบติดตามและสื่อสารโครงงานนิสิต</p>
          </div>
        </div>

        <nav>
          <ul>
            <li onClick={() => navigate("/staff-home")}>หน้าหลัก</li>

            <li onClick={() => navigate("/staff-documents")}>
              เอกสารขออนุมัติหัวข้อโครงงาน
            </li>

            <li className="active">ประวัติการลงนาม</li>

            <li onClick={() => navigate("/staff-notifications")}>
              การแจ้งเตือน
            </li>

            <li onClick={() => navigate("/staff-profile")}>
              ข้อมูลส่วนตัว
            </li>
          </ul>
        </nav>

        <button className="staff-history-logout" onClick={handleLogout}>
          ออกจากระบบ
        </button>
      </aside>

      {/* MAIN */}

      <main className="staff-history-main">
        {/* HEADER */}

        <header className="staff-history-header">
          <h2>ประวัติการลงนาม</h2>

          <div className="staff-history-header-right">
            <button className="staff-history-notification">
              <FaBell />
            </button>

            <div className="staff-history-user">
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

        {/* CONTENT */}

        <div className="staff-history-content">
          {/* SEARCH */}

          <div className="staff-history-toolbar">
            <div className="staff-history-search">
              <FaSearch />

              <input
                type="text"
                placeholder="ค้นหาชื่ออาจารย์ ชื่อหัวข้อ หรือเลขที่เอกสาร"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div className="staff-history-select-wrapper">
              <select
                value={yearFilter}
                onChange={(e) => setYearFilter(e.target.value)}
                className="staff-history-filter"
              >
                <option value="ทั้งหมด">ปีการศึกษา</option>

                {academicYears.map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>

              <span className="staff-history-select-arrow">▼</span>
            </div>
          </div>

          {/* CARD */}

          <div className="staff-history-card">
            <h3>ประวัติการลงนามทั้งหมด {filteredHistory.length} รายการ</h3>

            <table className="staff-history-table">
              <thead>
                <tr>
                  <th>อาจารย์ผู้อนุมัติ</th>

                  <th>ชื่อหัวข้อโครงงาน</th>

                  <th>เลขที่เอกสาร</th>

                  <th>วันที่อนุมัติ</th>

                  <th>จัดการ</th>
                </tr>
              </thead>

              <tbody>
                {loading && (
                  <tr>
                    <td colSpan={5} className="staff-history-message">
                      กำลังโหลดข้อมูล...
                    </td>
                  </tr>
                )}

                {!loading && currentHistory.length === 0 && (
                  <tr>
                    <td colSpan={5} className="staff-history-message">
                      ไม่พบประวัติการลงนาม
                    </td>
                  </tr>
                )}

                {!loading &&
                  currentHistory.map((item) => (
                    <tr key={item.id}>
                      <td>{item.advisor_name}</td>

                      <td>{item.project_title}</td>

                      <td>{item.document_number}</td>

                      <td>{formatThaiDate(item.approved_at)}</td>

                      <td>
                        <button
                          className="staff-history-detail-btn"
                          onClick={() =>
                            navigate(`/staff-document/${item.id}?from=history`)
                          }
                        >
                          รายละเอียด
                        </button>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>

            {/* PAGINATION */}

            {!loading && totalPages > 0 && (
              <div className="staff-history-pagination">
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

export default StaffSignatureHistory;
