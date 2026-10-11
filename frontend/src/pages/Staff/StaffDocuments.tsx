import "./StaffDocuments.css";

import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaBell, FaSearch } from "react-icons/fa";
import axios from "axios";

import logo from "../../assets/Logo.svg";

/* =========================================================
   TYPE
========================================================= */

interface StaffDocument {
  id: number;

  document_type: string;
  document_code: string;

  approved_at: string;
  download_status: string;
  pdf_path: string | null;

  project_title: string;
  academic_year: string;

  advisor_name: string;

  student_name: string;
  student_username: string;
}

/* =========================================================
   COMPONENT
========================================================= */

function StaffDocuments() {
  const navigate = useNavigate();

  const username = sessionStorage.getItem("username");

  const profileImage = sessionStorage.getItem("profileImage");

  const userId = sessionStorage.getItem("userId");

  /* =========================================================
     STATE
  ========================================================= */

  const [documents, setDocuments] = useState<StaffDocument[]>([]);

  const [loading, setLoading] = useState(true);

  const [searchTerm, setSearchTerm] = useState("");

  const [yearFilter, setYearFilter] = useState("ทั้งหมด");

  const [currentPage, setCurrentPage] = useState(1);

  const itemsPerPage = 10;

  /* =========================================================
     LOGIN
  ========================================================= */

  useEffect(() => {
    if (!userId) {
      navigate("/");
    }
  }, [userId, navigate]);

  /* =========================================================
     LOAD DOCUMENTS
  ========================================================= */

  useEffect(() => {
    axios
      .get("http://localhost:5000/staff/documents")
      .then((res) => {
        console.log("Staff Documents =", res.data);

        setDocuments(res.data);
      })
      .catch((err) => {
        console.log("Get staff documents error:", err);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  /* =========================================================
     DATE
  ========================================================= */

  const formatThaiDate = (dateString: string) => {
    if (!dateString) return "-";

    const date = new Date(dateString);

    return date.toLocaleDateString("th-TH", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  /* =========================================================
     ปีการศึกษา
  ========================================================= */

  const academicYears = useMemo(() => {
    return [
      ...new Set(
        documents.map((document) => document.academic_year).filter(Boolean),
      ),
    ];
  }, [documents]);

  /* =========================================================
     SEARCH + FILTER
  ========================================================= */

  const filteredDocuments = documents.filter((document) => {
    const keyword = searchTerm.toLowerCase().trim();

    const matchesSearch =
      (document.advisor_name || "").toLowerCase().includes(keyword) ||
      (document.project_title || "").toLowerCase().includes(keyword);

    const matchesYear =
      yearFilter === "ทั้งหมด" || document.academic_year === yearFilter;

    return matchesSearch && matchesYear;
  });

  /* =========================================================
     PAGINATION
  ========================================================= */

  const totalPages = Math.ceil(filteredDocuments.length / itemsPerPage);

  const startIndex = (currentPage - 1) * itemsPerPage;

  const currentDocuments = filteredDocuments.slice(
    startIndex,
    startIndex + itemsPerPage,
  );

  /* เมื่อค้นหาหรือกรอง ให้กลับหน้า 1 */

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, yearFilter]);

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
    <div className="staff-documents-page">
      {/* ================= SIDEBAR ================= */}

      <aside className="staff-documents-sidebar">
        <div className="staff-documents-logo">
          <img src={logo} alt="SPTC Logo" />

          <div>
            <h2>SPTC System</h2>

            <p>ระบบติดตามและสื่อสารโครงงานนิสิต</p>
          </div>
        </div>

        <nav>
          <ul>
            <li onClick={() => navigate("/staff-home")}>หน้าหลัก</li>

            <li className="active">เอกสารขออนุมัติหัวข้อโครงงาน</li>

            <li onClick={() => navigate("/staff-signature-history")}>
              ประวัติการลงนาม
            </li>

            <li onClick={() => navigate("/staff-notifications")}>
              การแจ้งเตือน
            </li>

            <li>ข้อมูลส่วนตัว</li>
          </ul>
        </nav>

        <button className="staff-documents-logout" onClick={handleLogout}>
          ออกจากระบบ
        </button>
      </aside>

      {/* ================= MAIN ================= */}

      <main className="staff-documents-main">
        {/* HEADER */}

        <header className="staff-documents-header">
          <h2>เอกสารขออนุมัติหัวข้อโครงงาน</h2>

          <div className="staff-documents-header-right">
            <button className="staff-documents-notification">
              <FaBell />
            </button>

            <div className="staff-documents-user">
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

        <div className="staff-documents-content">
          {/* SEARCH + YEAR */}

          <div className="staff-documents-toolbar">
            <div className="staff-documents-search">
              <FaSearch />

              <input
                type="text"
                placeholder="ค้นหาชื่ออาจารย์หรือชื่อหัวข้อโครงงาน"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div className="staff-documents-select-wrapper">
              <select
                value={yearFilter}
                onChange={(e) => setYearFilter(e.target.value)}
                className="staff-documents-filter"
              >
                <option value="ทั้งหมด">ปีการศึกษาทั้งหมด</option>

                {academicYears.map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>

              <span className="staff-documents-select-arrow">▼</span>
            </div>
          </div>

          {/* ================= TABLE CARD ================= */}

          <div className="staff-documents-card">
            <h3>เอกสารล่าสุด</h3>

            <table className="staff-documents-table">
              <thead>
                <tr>
                  <th>อาจารย์ผู้อนุมัติ</th>

                  <th>ชื่อหัวข้อโครงงาน</th>

                  <th>การดาวน์โหลด</th>

                  <th>วันที่อนุมัติ</th>

                  <th>จัดการ</th>
                </tr>
              </thead>

              <tbody>
                {loading && (
                  <tr>
                    <td colSpan={5} className="staff-documents-message">
                      กำลังโหลดข้อมูล...
                    </td>
                  </tr>
                )}

                {!loading && currentDocuments.length === 0 && (
                  <tr>
                    <td colSpan={5} className="staff-documents-message">
                      ไม่พบเอกสาร
                    </td>
                  </tr>
                )}

                {!loading &&
                  currentDocuments.map((document) => (
                    <tr key={document.id}>
                      <td>{document.advisor_name}</td>

                      <td className="staff-documents-project-title">
                        {document.project_title}
                      </td>

                      <td>{document.download_status}</td>

                      <td>{formatThaiDate(document.approved_at)}</td>

                      <td>
                        <button
                          className="staff-documents-detail-btn"
                          onClick={() =>
                            navigate(
                              `/staff-document/${document.id}?from=documents`,
                            )
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
              <div className="staff-documents-pagination">
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

export default StaffDocuments;
