import "./TeacherList.css";

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaBell, FaSearch } from "react-icons/fa";
import axios from "axios";

import logo from "../../assets/Logo.svg";

interface Teacher {
  id: number;
  name: string;
  major: string;

  accepted_students: number;
  total_capacity: number;
  remaining_capacity: number;

  advisor_status: string;
}

function TeacherList() {
  const navigate = useNavigate();

  const username = sessionStorage.getItem("username");
  const profileImage = sessionStorage.getItem("profileImage");

  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [search, setSearch] = useState("");

  const [loading, setLoading] = useState(true);

  const [currentPage, setCurrentPage] = useState(1);

  const itemsPerPage = 10;

  /* =========================
     ดึงรายชื่ออาจารย์
  ========================= */

  useEffect(() => {
    const fetchTeachers = async () => {
      try {
        setLoading(true);

        const response = await axios.get(
          "http://localhost:5000/teachers/search",
          {
            params: {
              name: search,
            },
          },
        );

        setTeachers(response.data);
      } catch (error) {
        console.log("Get teachers error:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchTeachers();
  }, [search]);

  /* =========================
     กลับหน้า 1 เมื่อค้นหา
  ========================= */

  useEffect(() => {
    setCurrentPage(1);
  }, [search]);

  /* =========================
     Pagination
  ========================= */

  const totalPages = Math.ceil(teachers.length / itemsPerPage);

  const startIndex = (currentPage - 1) * itemsPerPage;

  const currentTeachers = teachers.slice(startIndex, startIndex + itemsPerPage);

  /* =========================
     Logout
  ========================= */

  const handleLogout = () => {
    sessionStorage.clear();
    navigate("/");
  };

  return (
    <div className="teacher-list-page">
      {/* ================= SIDEBAR ================= */}

      <aside className="teacher-list-sidebar">
        <div className="teacher-list-logo">
          <img src={logo} alt="SPTC Logo" />

          <div>
            <h2>SPTC System</h2>
            <p>ระบบติดตามและสื่อสารโครงงานนิสิต</p>
          </div>
        </div>

        <nav>
          <ul>
            <li onClick={() => navigate("/StudentHome")}>หน้าหลัก</li>

            <li className="active">รายชื่ออาจารย์</li>

            <li onClick={() => navigate("/submit-new-project")}>
              ส่งคำเสนอโครงงานใหม่
            </li>

            <li>โครงงานของฉัน</li>

            <li>การแจ้งเตือน</li>

            <li>ข้อมูลส่วนตัว</li>
          </ul>
        </nav>

        <button className="teacher-list-logout" onClick={handleLogout}>
          ออกจากระบบ
        </button>
      </aside>

      {/* ================= MAIN ================= */}

      <main className="teacher-list-main">
        {/* ================= HEADER ================= */}

        <header className="teacher-list-header">
          <h2>รายชื่ออาจารย์</h2>

          <div className="teacher-list-header-right">
            <button className="teacher-list-bell" type="button">
              <FaBell />
            </button>

            <div className="teacher-list-user">
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

        <div className="teacher-list-content">
          {/* ================= SEARCH ================= */}

          <div className="teacher-search-wrapper">
            <div className="teacher-search-box">
              <input
                type="text"
                placeholder="ค้นหาโครงงาน/อาจารย์"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />

              <FaSearch />
            </div>
          </div>

          {/* ================= TABLE ================= */}

          <div className="teacher-table-card">
            <table className="teacher-table">
              <thead>
                <tr>
                  <th>อาจารย์</th>
                  <th>สาขาวิชา</th>
                  <th>โครงงาน</th>
                  <th>สถานะ</th>
                  <th>รายละเอียด</th>
                </tr>
              </thead>

              <tbody>
                {loading && (
                  <tr>
                    <td colSpan={5} className="teacher-table-message">
                      กำลังโหลดข้อมูล...
                    </td>
                  </tr>
                )}

                {!loading && currentTeachers.length === 0 && (
                  <tr>
                    <td colSpan={5} className="teacher-table-message">
                      ไม่พบข้อมูลอาจารย์
                    </td>
                  </tr>
                )}

                {!loading &&
                  currentTeachers.map((teacher) => {
                    const isFull = teacher.advisor_status === "เต็ม";

                    const isAlmostFull =
                      !isFull && teacher.remaining_capacity <= 2;

                    const statusText = isFull
                      ? "เต็ม"
                      : isAlmostFull
                        ? "ใกล้เต็ม"
                        : "เปิดรับ";

                    const statusClass = isFull
                      ? "full"
                      : isAlmostFull
                        ? "almost"
                        : "open";

                    return (
                      <tr key={teacher.id}>
                        <td>{teacher.name}</td>

                        <td>{teacher.major || "-"}</td>

                        <td>
                          {teacher.accepted_students} / {teacher.total_capacity}
                        </td>

                        <td>
                          <span className={`teacher-status ${statusClass}`}>
                            {statusText}
                          </span>
                        </td>

                        <td>
                          <button
                            className="teacher-detail-link"
                            type="button"
                            onClick={() =>
                              navigate(`/teacher-detail/${teacher.id}`)
                            }
                          >
                            ดูรายละเอียด
                          </button>
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>

          {/* ================= PAGINATION ================= */}

          {totalPages > 0 && (
            <div className="teacher-pagination">
              <button
                type="button"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((page) => Math.max(page - 1, 1))}
              >
                ‹
              </button>

              <span>{currentPage}</span>

              <button
                type="button"
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
      </main>
    </div>
  );
}

export default TeacherList;
