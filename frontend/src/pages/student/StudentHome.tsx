import "./StudentHome.css";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import axios from "axios";
import { FaSearch } from "react-icons/fa";
import logo from "../../assets/Logo.svg";
import StudentNotificationBell from "./StudentNotificationBell";

/* =========================================================
   TYPE
========================================================= */

interface Project {
  id: number;

  title: string;

  advisor: string;

  major: string;

  max_members: number;

  current_members: number;

  source: string;

  status: string;

  visibility: "แสดง" | "ซ่อน";
}

/* =========================================================
   COMPONENT
========================================================= */

function StudentHome() {
  const navigate = useNavigate();

  /* =========================================================
     SESSION
  ========================================================= */

  const username = sessionStorage.getItem("username");

  const profileImage = sessionStorage.getItem("profileImage");

  /* =========================================================
     STATE
  ========================================================= */

  const [projects, setProjects] = useState<Project[]>([]);

  const [searchTerm, setSearchTerm] = useState("");

  const [currentPage, setCurrentPage] = useState(1);

  const itemsPerPage = 10;

  /* =========================================================
     FILTER PROJECT
  ========================================================= */

  const filteredProjects = projects.filter((project) => {
    const keyword = searchTerm.toLowerCase().trim();

    const matchesSearch =
      project.title.toLowerCase().includes(keyword) ||
      project.advisor.toLowerCase().includes(keyword);

    const canDisplay =
      project.source === "teacher" &&
      project.visibility === "แสดง" &&
      (project.status === "เปิดรับ" || project.status === "ใกล้เต็ม");

    return canDisplay && matchesSearch;
  });

  /* =========================================================
     PAGINATION
  ========================================================= */

  const totalPages = Math.ceil(filteredProjects.length / itemsPerPage);

  const currentProjects = filteredProjects.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage,
  );

  /* =========================================================
     ตรวจสอบ LOGIN
  ========================================================= */

  useEffect(() => {
    if (!username) {
      navigate("/");
    }
  }, [username, navigate]);

  /* =========================================================
     ดึง PROJECT
  ========================================================= */

  useEffect(() => {
    axios
      .get("http://localhost:5000/projects")
      .then((res) => {
        console.log("Projects =", res.data);

        setProjects(res.data);
      })
      .catch((err) => {
        console.log("Get projects error:", err);
      });
  }, []);

  /* =========================================================
     RESET PAGE ตอน SEARCH
  ========================================================= */

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

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
    <div className="student-home-page">
      {/* =====================================================
          SIDEBAR
      ===================================================== */}

      <aside className="sidebar">
        {/* LOGO */}

        <div className="logo">
          <img src={logo} alt="SPTC Logo" />

          <div>
            <h2>SPTC System</h2>

            <p>ระบบติดตามและสื่อสารโครงงานนิสิต</p>
          </div>
        </div>

        {/* MENU */}

        <nav>
          <ul>
            <li className="active">หน้าหลัก</li>

            <li onClick={() => navigate("/teachers")}>รายชื่ออาจารย์</li>

            <li onClick={() => navigate("/submit-new-project")}>
              ส่งคำเสนอโครงงานใหม่
            </li>

            <li onClick={() => navigate("/student-project")}>โครงงานของฉัน</li>

            <li onClick={() => navigate("/student-notifications")}>
              การแจ้งเตือน
            </li>

            <li>ข้อมูลส่วนตัว</li>
          </ul>
        </nav>

        {/* LOGOUT */}

        <button className="logout-btn" onClick={handleLogout}>
          ออกจากระบบ
        </button>
      </aside>

      {/* =====================================================
          MAIN
      ===================================================== */}

      <main className="main">
        {/* ===================================================
            HEADER
        =================================================== */}

        <header className="header">
          <h2>หน้าหลัก</h2>

          <div className="header-right">
            {/* NOTIFICATION */}

            <StudentNotificationBell />

            {/* USER */}

            <div className="user-info">
              <img
                src={
                  profileImage ? `http://localhost:5000${profileImage}` : logo
                }
                alt="Profile"
                className="profile-image"
              />

              <span>{username}</span>
            </div>
          </div>
        </header>

        {/* ===================================================
            SEARCH
        =================================================== */}

        <div className="search-box">
          <div className="student-search">
            <input
              type="text"
              placeholder="ค้นหาหัวข้อโครงงานหรืออาจารย์"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />

            <FaSearch />
          </div>
        </div>

        {/* ===================================================
            PROJECT TABLE
        =================================================== */}

        <div className="table-container">
          <h3>รายการหัวข้อโครงงาน</h3>

          <table>
            {/* TABLE HEADER */}

            <thead>
              <tr>
                <th>ชื่อหัวข้อโครงงาน</th>

                <th>อาจารย์ที่ปรึกษา</th>

                <th>สาขาวิชา</th>

                <th>รับนิสิต</th>

                <th>จัดการ</th>
              </tr>
            </thead>

            {/* TABLE BODY */}

            <tbody>
              {currentProjects.length === 0 ? (
                <tr>
                  <td colSpan={5} className="student-empty-cell">
                    {searchTerm.trim() !== ""
                      ? "ไม่พบหัวข้อโครงงานที่ตรงกับการค้นหา"
                      : "ยังไม่มีหัวข้อโครงงาน"}
                  </td>
                </tr>
              ) : (
                currentProjects.map((project) => (
                  <tr key={project.id}>
                    {/* ชื่อโครงงาน */}

                    <td className="student-project-title" title={project.title}>
                      {project.title}
                    </td>

                    {/* อาจารย์ */}

                    <td>{project.advisor}</td>

                    {/* สาขา */}

                    <td>{project.major}</td>

                    {/* จำนวนรับ */}

                    <td>
                      {project.current_members} / {project.max_members} คน
                    </td>

                    {/* DETAIL */}

                    <td>
                      <button
                        className="student-detail-btn"
                        onClick={() =>
                          navigate(`/project-details/${project.id}`)
                        }
                      >
                        ดูรายละเอียด
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>

          {/* =================================================
              PAGINATION
          ================================================= */}

          {filteredProjects.length > 0 && (
            <div className="pagination">
              {/* PREVIOUS */}

              <button
                onClick={() => setCurrentPage(currentPage - 1)}
                disabled={currentPage === 1}
              >
                &lt;
              </button>

              {/* PAGE */}

              <span>
                {currentPage} of {Math.max(totalPages, 1)}
              </span>

              {/* NEXT */}

              <button
                onClick={() => setCurrentPage(currentPage + 1)}
                disabled={currentPage === totalPages || totalPages === 0}
              >
                &gt;
              </button>
            </div>
          )}
        </div>

      </main>
    </div>
  );
}

export default StudentHome;

