import "./TeacherProjects.css";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import axios from "axios";
import { FaBell, FaPlus, FaSearch, FaEllipsisV } from "react-icons/fa";

import logo from "../../assets/Logo.svg";

interface Project {
  id: number;
  title: string;
  description: string;
  skills: string;
  requirements: string;
  max_members: number;
  current_members: number;
  status: string;
  project_type: string;
  academic_year: string;
  visibility: "แสดง" | "ซ่อน";
}

function TeacherProjects() {
  const navigate = useNavigate();

  const userId = localStorage.getItem("userId");
  const username = localStorage.getItem("username");
  const profileImage = localStorage.getItem("profileImage");

  const [projects, setProjects] = useState<Project[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortOrder, setSortOrder] = useState("latest");

  const [loading, setLoading] = useState(true);
  const [openMenuId, setOpenMenuId] = useState<number | null>(null);

  /* =========================
     ตรวจสอบ Login
  ========================= */
  useEffect(() => {
    if (!userId) {
      navigate("/");
    }
  }, [userId, navigate]);

  /* =========================
     ดึงหัวข้อโครงงานของอาจารย์
  ========================= */
  useEffect(() => {
    if (!userId) return;

    console.log("Teacher ID =", userId);

    axios
      .get(`http://localhost:5000/teacher/projects/${userId}`)
      .then((res) => {
        console.log("Teacher Projects =", res.data);

        setProjects(res.data);
      })
      .catch((err) => {
        console.log("Get teacher projects error:", err);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [userId]);

  /* =========================
     Logout
  ========================= */
  const handleLogout = () => {
    localStorage.removeItem("userId");
    localStorage.removeItem("username");
    localStorage.removeItem("name");
    localStorage.removeItem("profileImage");

    navigate("/");
  };

  /* =========================
   ซ่อนหัวข้อโครงงาน
========================= */

const handleHideProject = async (projectId: number) => {
  if (!userId) return;

  const confirmHide = window.confirm(
    "คุณต้องการซ่อนหัวข้อโครงงานนี้ใช่หรือไม่?"
  );

  if (!confirmHide) return;

  try {
    await axios.put(
      `http://localhost:5000/teacher/projects/${projectId}/${userId}/visibility`,
      {
        visibility: "ซ่อน",
      },
    );

    // เปลี่ยนข้อมูลบนหน้าทันที
    setProjects((prevProjects) =>
      prevProjects.map((project) =>
        project.id === projectId
          ? { ...project, visibility: "ซ่อน" }
          : project
      )
    );

    setOpenMenuId(null);

    alert("ซ่อนหัวข้อโครงงานเรียบร้อยแล้ว");
  } catch (error) {
    console.log("Hide project error:", error);

    alert("ไม่สามารถซ่อนหัวข้อโครงงานได้");
  }
};
/* =========================
   แสดงหัวข้อโครงงาน
========================= */

const handleShowProject = async (projectId: number) => {
  if (!userId) return;

  const confirmShow = window.confirm(
    "คุณต้องการแสดงหัวข้อโครงงานนี้อีกครั้งใช่หรือไม่?"
  );

  if (!confirmShow) return;

  try {
    await axios.put(
      `http://localhost:5000/teacher/projects/${projectId}/${userId}/visibility`,
      {
        visibility: "แสดง",
      },
    );

    // เปลี่ยนข้อมูลบนหน้าทันที
    setProjects((prevProjects) =>
      prevProjects.map((project) =>
        project.id === projectId
          ? {
              ...project,
              visibility: "แสดง",
            }
          : project
      )
    );

    setOpenMenuId(null);

    alert("แสดงหัวข้อโครงงานเรียบร้อยแล้ว");
  } catch (error) {
    console.log("Show project error:", error);

    alert("ไม่สามารถแสดงหัวข้อโครงงานได้");
  }
};

/* =========================
   ลบหัวข้อโครงงาน
========================= */

const handleDeleteProject = async (projectId: number) => {
  if (!userId) return;

  const confirmDelete = window.confirm(
    "คุณต้องการลบหัวข้อโครงงานนี้ใช่หรือไม่?\nการลบจะไม่สามารถกู้คืนได้",
  );

  if (!confirmDelete) return;

  try {
    await axios.delete(
      `http://localhost:5000/teacher/projects/${projectId}/${userId}`,
    );

    // เอาออกจากรายการทันที
    setProjects((prevProjects) =>
      prevProjects.filter(
        (project) => project.id !== projectId
      )
    );

    setOpenMenuId(null);

    alert("ลบหัวข้อโครงงานเรียบร้อยแล้ว");
  } catch (error) {
    console.log("Delete project error:", error);

    alert("ไม่สามารถลบหัวข้อโครงงานได้");
  }
};

  /* =========================
     Search + Filter + Sort
  ========================= */
  const filteredProjects = [...projects]
    .filter((project) => {
      const matchSearch = project.title
        .toLowerCase()
        .includes(searchTerm.toLowerCase());

      let matchStatus = true;

      if (statusFilter === "รับนิสิต") {
        matchStatus =
          project.status === "เปิดรับ" || project.status === "ใกล้เต็ม";
      } else if (statusFilter === "ปิดรับ") {
        matchStatus = project.status === "ปิดรับ";
      }

      return matchSearch && matchStatus;
    })
    .sort((a, b) => {
      if (sortOrder === "title") {
        return a.title.localeCompare(b.title, "th");
      }

      if (sortOrder === "oldest") {
        return a.id - b.id;
      }

      return b.id - a.id;
    });

  /* =========================
     จำนวนหัวข้อ
  ========================= */

  const totalProjects = projects.length;

  const openProjects = projects.filter(
    (project) => project.status === "เปิดรับ" || project.status === "ใกล้เต็ม",
  ).length;

  const closedProjects = projects.filter(
    (project) => project.status === "ปิดรับ",
  ).length;

  return (
    <div className="teacher-projects-page">
      {/* ================= SIDEBAR ================= */}

      <aside className="sidebar">
        <div className="sidebar-logo">
          <img src={logo} alt="SPTC Logo" />

          <div>
            <h2>SPTC System</h2>

            <p>ระบบติดตามและสื่อสารโครงงานนิสิต</p>
          </div>
        </div>

        <nav>
          <ul>
            <li onClick={() => navigate("/teacher-home")}>หน้าหลัก</li>

            <li className="active">จัดการหัวข้อโครงงาน</li>

            <li>คำขอเข้าร่วมโครงงาน</li>

            <li>ภาระงานที่ปรึกษา</li>

            <li>ประวัติการพิจารณา</li>

            <li>การแจ้งเตือน</li>

            <li>ข้อมูลส่วนตัว</li>
          </ul>
        </nav>

        <button className="logout-btn" onClick={handleLogout}>
          ออกจากระบบ
        </button>
      </aside>

      {/* ================= MAIN ================= */}

      <main className="main">
        {/* ================= HEADER ================= */}

        <header className="header">
          <h2>จัดการหัวข้อโครงงาน</h2>

          <div className="header-right">
            <button className="notification-btn">
              <FaBell />
            </button>

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

        {/* ================= CONTENT ================= */}

        <div className="project-content">
          {/* ================= TOOLBAR ================= */}

          <div className="project-toolbar">
            {/* Search */}

            <div className="project-search">
              <FaSearch />

              <input
                type="text"
                placeholder="ค้นหาหัวข้อโครงงาน"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            {/* Status */}

            <div className="select-wrapper">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="all">สถานะทั้งหมด</option>

                <option value="รับนิสิต">เปิดรับ</option>

                <option value="ปิดรับ">ปิดรับ</option>
              </select>

              <span className="select-arrow">▼</span>
            </div>

            {/* Sort */}

            <div className="select-wrapper">
              <select
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value)}
              >
                <option value="latest">เรียงตาม</option>

                <option value="latest">ล่าสุด</option>

                <option value="oldest">เก่าสุด</option>
              </select>

              <span className="select-arrow">▼</span>
            </div>

            {/* Create */}

            <button
              className="create-project-btn"
              onClick={() => navigate("/create-teacher-project")}
            >
              <FaPlus />
              สร้างหัวข้อโครงงาน
            </button>
          </div>

          {/* ================= SUMMARY ================= */}

          <div className="project-summary">
            <div className="summary-card">
              <span>หัวข้อทั้งหมด</span>

              <strong>{totalProjects}</strong>
            </div>

            <div className="summary-card">
              <span>เปิดรับ</span>

              <strong>{openProjects}</strong>
            </div>

            <div className="summary-card">
              <span>ปิดรับ</span>

              <strong>{closedProjects}</strong>
            </div>
          </div>

          {/* ================= PROJECT LIST ================= */}

          <div className="project-list-container">
            <div className="project-list-header">
              <h3>หัวข้อโครงงานของฉัน</h3>
            </div>

            {/* Loading */}

            {loading && (
              <div className="empty-project">
                <p>กำลังโหลดข้อมูล...</p>
              </div>
            )}

            {/* ไม่มีข้อมูล */}

            {!loading && filteredProjects.length === 0 && (
              <div className="empty-project">
                <p>
                  {projects.length === 0
                    ? "ยังไม่มีหัวข้อโครงงาน"
                    : "ไม่พบหัวข้อโครงงาน"}
                </p>

                <span>
                  {projects.length === 0
                    ? 'กด "สร้างหัวข้อโครงงาน" เพื่อเพิ่มหัวข้อใหม่'
                    : "ลองเปลี่ยนคำค้นหาหรือสถานะ"}
                </span>
              </div>
            )}

            {/* ================= PROJECT CARDS ================= */}

            {!loading &&
              filteredProjects.map((project) => (
                <div className="project-card" key={project.id}>
                  {/* Card Header */}

                  <div className="project-card-header">
                    <h4>{project.title}</h4>

                    <span className="project-status">{project.status}</span>
                  </div>

                  {/* Project Info */}

                  <div className="project-info">
                    <p>
                      <strong>ปีการศึกษา :</strong> {project.academic_year}
                    </p>

                    <p>
                      <strong>ประเภทโครงงาน :</strong> {project.project_type}
                    </p>

                    <p>
                      <strong>รับนิสิต :</strong> {project.max_members} คน
                    </p>

                    <p>
                      <strong>สมาชิกในโครงงาน :</strong>{" "}
                      {project.current_members} / {project.max_members} คน
                    </p>

                    <p>
                      <strong>เทคโนโลยีที่ใช้ :</strong> {project.skills || "-"}
                    </p>

                    <p>
                      <strong>การแสดงผล :</strong> {project.visibility}
                    </p>
                  </div>

                  {/* Card Actions */}

                  <div className="project-card-actions">
                    <button
                      onClick={() =>
                        navigate(`/teacher-project-details/${project.id}`)
                      }
                    >
                      รายละเอียด
                    </button>

                    <button
                      onClick={() =>
                        navigate(`/teacher-project-edit/${project.id}`)
                      }
                    >
                      แก้ไข
                    </button>

<div className="more-menu-wrapper">
  <button
    className="more-btn"
    onClick={() =>
      setOpenMenuId(
        openMenuId === project.id
          ? null
          : project.id
      )
    }
  >
    <FaEllipsisV />
  </button>
{openMenuId === project.id && (
  <div className="more-menu">

    {project.visibility === "แสดง" ? (
      <button
        onClick={() =>
          handleHideProject(project.id)
        }
      >
        ซ่อนหัวข้อ
      </button>
    ) : (
      <button
        onClick={() =>
          handleShowProject(project.id)
        }
      >
        แสดงหัวข้อ
      </button>
    )}

    <button
      className="delete-option"
      onClick={() =>
        handleDeleteProject(project.id)
      }
    >
      ลบหัวข้อ
    </button>

  </div>
)}
</div>
                  </div>
                </div>
              ))}
          </div>
        </div>
      </main>
    </div>
  );
}

export default TeacherProjects;
