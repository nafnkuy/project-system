import "./StaffHome.css";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaBell, FaSearch } from "react-icons/fa";
import axios from "axios";

import logo from "../../assets/Logo.svg";

/* =========================
   TYPE
========================= */

interface LatestDocument {
  id: number;

  document_type: string;
  document_code: string;
  academic_year: string;

  approved_at: string;
  download_status: string;
  pdf_path: string | null;

  project_title: string;

  advisor_name: string;

  student_name: string;
  student_username: string;
}

interface StaffDashboardData {
  totalDocuments: number;
  thisMonth: number;
  today: number;
  latestDocuments: LatestDocument[];
}

function StaffHome() {
  const navigate = useNavigate();

  const username = sessionStorage.getItem("username");
  const profileImage = sessionStorage.getItem("profileImage");
  const userId = sessionStorage.getItem("userId");

  /* =========================
     STATE
  ========================= */

  const [dashboard, setDashboard] = useState<StaffDashboardData>({
    totalDocuments: 0,
    thisMonth: 0,
    today: 0,
    latestDocuments: [],
  });

  const [loading, setLoading] = useState(true);

  const [searchTerm, setSearchTerm] = useState("");
  const [downloadFilter, setDownloadFilter] = useState("ทั้งหมด");

  /* =========================
     ตรวจสอบ Login
  ========================= */

  useEffect(() => {
    if (!userId) {
      navigate("/");
    }
  }, [userId, navigate]);

  /* =========================
     ดึงข้อมูล Dashboard
  ========================= */

  useEffect(() => {
    axios
      .get("http://localhost:5000/staff/dashboard")
      .then((res) => {
        console.log("Staff Dashboard =", res.data);

        setDashboard(res.data);
      })
      .catch((err) => {
        console.log("Get staff dashboard error:", err);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  /* =========================
     วันที่
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
     เลขที่เอกสาร
  ========================= */

  const getDocumentNumber = (document: LatestDocument) => {
    const academicYear =
      document.academic_year?.split("/")[0] ||
      String(new Date(document.approved_at).getFullYear() + 543);

    return `${document.document_code}-${academicYear}-${String(
      document.id,
    ).padStart(3, "0")}`;
  };

  /* =========================
     SEARCH + FILTER
  ========================= */

  const filteredDocuments = dashboard.latestDocuments.filter((document) => {
    const keyword = searchTerm.toLowerCase().trim();

    const matchesSearch =
      getDocumentNumber(document).toLowerCase().includes(keyword) ||
      (document.advisor_name || "").toLowerCase().includes(keyword) ||
      (document.project_title || "").toLowerCase().includes(keyword);

    const matchesDownload =
      downloadFilter === "ทั้งหมด" ||
      document.download_status === downloadFilter;

    return matchesSearch && matchesDownload;
  });

  /* =========================
     EMPTY MESSAGE
  ========================= */

  const getEmptyMessage = () => {
    if (dashboard.latestDocuments.length === 0) {
      return "ยังไม่มีเอกสาร";
    }

    if (searchTerm.trim() !== "") {
      return "ไม่พบเอกสารที่ตรงกับการค้นหา";
    }

    if (downloadFilter === "ดาวน์โหลดแล้ว") {
      return "ไม่พบเอกสารที่ดาวน์โหลดแล้ว";
    }

    if (downloadFilter === "ยังไม่ดาวน์โหลด") {
      return "ไม่พบเอกสารที่ยังไม่ดาวน์โหลด";
    }

    return "ไม่พบเอกสาร";
  };

  /* =========================
     Logout
  ========================= */

  const handleLogout = () => {
    sessionStorage.removeItem("userId");
    sessionStorage.removeItem("username");
    sessionStorage.removeItem("name");
    sessionStorage.removeItem("profileImage");
    sessionStorage.removeItem("major");

    navigate("/");
  };

  return (
    <div className="staff-home-page">
      {/* ================= SIDEBAR ================= */}

      <aside className="staff-sidebar">
        <div className="staff-logo">
          <img src={logo} alt="SPTC Logo" />

          <div>
            <h2>SPTC System</h2>
            <p>ระบบติดตามและสื่อสารโครงงานนิสิต</p>
          </div>
        </div>

        <nav>
          <ul>
            <li className="active">หน้าหลัก</li>

            <li>เอกสารขออนุมัติหัวข้อโครงงาน</li>

            <li>ประวัติการลงนาม</li>

            <li>การแจ้งเตือน</li>

            <li>ข้อมูลส่วนตัว</li>
          </ul>
        </nav>

        <button className="staff-logout-btn" onClick={handleLogout}>
          ออกจากระบบ
        </button>
      </aside>

      {/* ================= MAIN ================= */}

      <main className="staff-main">
        {/* ================= HEADER ================= */}

        <header className="staff-header">
          <h2>หน้าหลัก</h2>

          <div className="staff-header-right">
            <button className="staff-notification-btn">
              <FaBell />
            </button>

            <div className="staff-user-info">
              <img
                src={
                  profileImage
                    ? `http://localhost:5000${profileImage}`
                    : logo
                }
                alt="Profile"
              />

              <span>{username}</span>
            </div>
          </div>
        </header>

        {/* ================= CONTENT ================= */}

        <div className="staff-content">
          {/* ================= SEARCH + FILTER ================= */}

          <div className="staff-toolbar">
            {/* SEARCH */}

            <div className="staff-search">
              <FaSearch />

              <input
                type="text"
                placeholder="ค้นหาเลขที่เอกสาร อาจารย์ หรือชื่อหัวข้อโครงงาน"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            {/* FILTER */}

            <div className="staff-select-wrapper">
              <select
                value={downloadFilter}
                onChange={(e) => setDownloadFilter(e.target.value)}
                className="staff-filter-select"
              >
                <option value="ทั้งหมด">การดาวน์โหลดทั้งหมด</option>

                <option value="ดาวน์โหลดแล้ว">
                  ดาวน์โหลดแล้ว
                </option>

                <option value="ยังไม่ดาวน์โหลด">
                  ยังไม่ดาวน์โหลด
                </option>
              </select>

              <span className="staff-select-arrow">▼</span>
            </div>
          </div>

          {/* ================= SUMMARY ================= */}

          <div className="staff-summary">
            <div className="staff-summary-card">
              <span>เอกสารทั้งหมด</span>

              <strong className="staff-total">
                {dashboard.totalDocuments}
              </strong>
            </div>

            <div className="staff-summary-card">
              <span>เอกสารที่ได้รับเดือนนี้</span>

              <strong className="staff-month">
                {dashboard.thisMonth}
              </strong>
            </div>

            <div className="staff-summary-card">
              <span>เอกสารที่ได้รับวันนี้</span>

              <strong className="staff-today">
                {dashboard.today}
              </strong>
            </div>
          </div>

          {/* ================= เอกสารล่าสุด ================= */}

          <div className="latest-documents">
            <h3>เอกสารล่าสุด</h3>

            <table className="staff-document-table">
              <thead>
                <tr>
                  <th>เลขที่เอกสาร</th>
                  <th>อาจารย์ผู้อนุมัติ</th>
                  <th>ชื่อหัวข้อโครงงาน</th>
                  <th>การดาวน์โหลด</th>
                  <th>วันที่อนุมัติ</th>
                  <th>จัดการ</th>
                </tr>
              </thead>

              <tbody>
                {/* กำลังโหลด */}

                {loading && (
                  <tr>
                    <td colSpan={6} className="staff-table-message">
                      กำลังโหลดข้อมูล...
                    </td>
                  </tr>
                )}

                {/* ไม่พบข้อมูล */}

                {!loading && filteredDocuments.length === 0 && (
                  <tr>
                    <td colSpan={6} className="staff-table-message">
                      {getEmptyMessage()}
                    </td>
                  </tr>
                )}

                {/* มีข้อมูล */}

                {!loading &&
                  filteredDocuments.map((document) => (
                    <tr key={document.id}>
                      <td>{getDocumentNumber(document)}</td>

                      <td>{document.advisor_name}</td>

                      <td className="staff-project-title">
                        {document.project_title}
                      </td>

                      <td>{document.download_status}</td>

                      <td>{formatThaiDate(document.approved_at)}</td>

                      <td>
                        <button
                          className="staff-detail-btn"
                          onClick={() =>
                            navigate(`/staff-document/${document.id}`)
                          }
                        >
                          รายละเอียด
                        </button>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>

            {/* แสดงเฉพาะตอนมีข้อมูล */}

            {filteredDocuments.length > 0 && (
              <button className="staff-view-all-btn">
                ดูทั้งหมด →
              </button>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

export default StaffHome;