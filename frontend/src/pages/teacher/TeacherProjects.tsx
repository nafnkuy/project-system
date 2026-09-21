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

  const userId = sessionStorage.getItem("userId");
  const username = sessionStorage.getItem("username");
  const profileImage = sessionStorage.getItem("profileImage");

  const [projects, setProjects] = useState<Project[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortOrder, setSortOrder] = useState("");

  const [loading, setLoading] = useState(true);
  const [openMenuId, setOpenMenuId] = useState<number | null>(null);

  /* =========================
   POPUP ซ่อน / แสดงหัวข้อ
========================= */

  const [confirmModal, setConfirmModal] = useState<{
    open: boolean;
    type: "hide" | "show" | "delete" | null;
    projectId: number | null;
    projectTitle: string;
  }>({
    open: false,
    type: null,
    projectId: null,
    projectTitle: "",
  });

  /* Popup ลบสำเร็จ */
  const [deleteSuccessModal, setDeleteSuccessModal] = useState(false);

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
    sessionStorage.removeItem("userId");
    sessionStorage.removeItem("username");
    sessionStorage.removeItem("name");
    sessionStorage.removeItem("profileImage");

    navigate("/");
  };

  /* =========================
   เปิด / ปิด Popup
========================= */

  const openHideModal = (projectId: number) => {
    setConfirmModal({
      open: true,
      type: "hide",
      projectId,
      projectTitle: "",
    });

    setOpenMenuId(null);
  };

  const openShowModal = (projectId: number) => {
    setConfirmModal({
      open: true,
      type: "show",
      projectId,
      projectTitle: "",
    });

    setOpenMenuId(null);
  };

  const openDeleteModal = (projectId: number, projectTitle: string) => {
    setConfirmModal({
      open: true,
      type: "delete",
      projectId,
      projectTitle,
    });

    setOpenMenuId(null);
  };

  const closeConfirmModal = () => {
    setConfirmModal({
      open: false,
      type: null,
      projectId: null,
      projectTitle: "",
    });
  };

  /* =========================
   ซ่อนหัวข้อโครงงาน
========================= */

  const handleHideProject = async (projectId: number) => {
    if (!userId) return;

    try {
      await axios.put(
        `http://localhost:5000/teacher/projects/${projectId}/${userId}/visibility`,
        {
          visibility: "ซ่อน",
        },
      );

      setProjects((prevProjects) =>
        prevProjects.map((project) =>
          project.id === projectId
            ? { ...project, visibility: "ซ่อน" }
            : project,
        ),
      );

      closeConfirmModal();
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

    try {
      await axios.put(
        `http://localhost:5000/teacher/projects/${projectId}/${userId}/visibility`,
        {
          visibility: "แสดง",
        },
      );

      setProjects((prevProjects) =>
        prevProjects.map((project) =>
          project.id === projectId
            ? { ...project, visibility: "แสดง" }
            : project,
        ),
      );

      closeConfirmModal();
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

    try {
      await axios.delete(
        `http://localhost:5000/teacher/projects/${projectId}/${userId}`,
      );

      setProjects((prevProjects) =>
        prevProjects.filter((project) => project.id !== projectId),
      );

      /* ปิด popup ยืนยันการลบ */
      closeConfirmModal();

      /* เปิด popup ลบสำเร็จ */
      setDeleteSuccessModal(true);
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

      if (statusFilter === "open") {
        matchStatus =
          project.visibility !== "ซ่อน" &&
          (project.status === "เปิดรับ" || project.status === "ใกล้เต็ม");
      } else if (statusFilter === "closed") {
        matchStatus =
          project.visibility !== "ซ่อน" && project.status === "ปิดรับ";
      } else if (statusFilter === "hidden") {
        matchStatus = project.visibility === "ซ่อน";
      }

      return matchSearch && matchStatus;
    })
    .sort((a, b) => {
      if (sortOrder === "oldest") {
        return a.id - b.id;
      }

      // ค่า default และ latest
      return b.id - a.id;
    });

  /* =========================
     จำนวนหัวข้อ
  ========================= */

  const totalProjects = projects.length;

  const openProjects = projects.filter(
    (project) =>
      project.visibility !== "ซ่อน" &&
      (project.status === "เปิดรับ" || project.status === "ใกล้เต็ม"),
  ).length;

  const closedProjects = projects.filter(
    (project) => project.visibility !== "ซ่อน" && project.status === "ปิดรับ",
  ).length;

  const hiddenProjects = projects.filter(
    (project) => project.visibility === "ซ่อน",
  ).length;

  /* =========================
     ข้อความที่ใช้แสดงในตาราง
  ========================= */

  const getDisplayStatus = (project: Project) => {
    if (project.visibility === "ซ่อน") {
      return "ซ่อน";
    }

    // หน้านี้ให้ "ใกล้เต็ม" อยู่ในกลุ่มเปิดรับ
    if (project.status === "ใกล้เต็ม") {
      return "เปิดรับ";
    }

    return project.status;
  };

  const getStatusClass = (project: Project) => {
    if (project.visibility === "ซ่อน") {
      return "hidden";
    }

    if (project.status === "ปิดรับ") {
      return "closed";
    }

    return "open";
  };

  const getProjectTypeLabel = (type: string) => {
    if (type === "เดี่ยว") return "โครงงานเดี่ยว";
    if (type === "คู่") return "โครงงานคู่";

    return type;
  };

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
            <div className="project-search">
              <FaSearch />

              <input
                type="text"
                placeholder="ค้นหาชื่อหัวข้อโครงงาน"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            {/* STATUS FILTER */}
            <div className="project-select-wrapper status-select">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="project-filter-select"
              >
                <option value="all">สถานะ</option>
                <option value="open">เปิดรับ</option>
                <option value="closed">ปิดรับ</option>
                <option value="hidden">ซ่อน</option>
              </select>

              <span className="project-select-arrow">▼</span>
            </div>

            {/* SORT */}
            <div className="project-select-wrapper sort-select">
              <select
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value)}
                className="project-filter-select"
              >
                <option value="">เรียงตาม</option>
                <option value="latest">ล่าสุด</option>
                <option value="oldest">เก่าสุด</option>
              </select>

              <span className="project-select-arrow">▼</span>
            </div>
          </div>

          {/* ================= SUMMARY ================= */}

          <div className="project-summary">
            <div className="summary-card">
              <span>ทั้งหมด</span>
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

            <div className="summary-card">
              <span>ซ่อน</span>
              <strong>{hiddenProjects}</strong>
            </div>
          </div>

          {/* ================= PROJECT TABLE ================= */}

          <div className="project-list-container">
            <div className="project-list-header">
              <h3>จัดการหัวข้อโครงงาน</h3>

              <button
                className="create-project-btn"
                onClick={() => navigate("/create-teacher-project")}
              >
                สร้างหัวข้อโครงงาน
                <FaPlus />
              </button>
            </div>

            <div className="project-table-wrapper">
              <table className="project-table">
                <thead>
                  <tr>
                    <th>ชื่อหัวข้อโครงงาน</th>
                    <th>ปีการศึกษา</th>
                    <th>ประเภทโครงงาน</th>
                    <th>รับนิสิต</th>
                    <th>สถานะ</th>
                    <th>จัดการ</th>
                  </tr>
                </thead>

                <tbody>
                  {loading && (
                    <tr>
                      <td colSpan={6} className="table-message">
                        กำลังโหลดข้อมูล...
                      </td>
                    </tr>
                  )}

                  {!loading && filteredProjects.length === 0 && (
                    <tr>
                      <td colSpan={6} className="table-message">
                        {projects.length === 0
                          ? "ยังไม่มีหัวข้อโครงงาน"
                          : "ไม่พบหัวข้อโครงงาน"}
                      </td>
                    </tr>
                  )}

                  {!loading &&
                    filteredProjects.map((project) => (
                      <tr
                        key={project.id}
                        className={
                          project.visibility === "ซ่อน"
                            ? "hidden-project-row"
                            : ""
                        }
                      >
                        {/* ชื่อหัวข้อ */}
                        <td className="project-title-cell">{project.title}</td>

                        {/* ปี */}
                        <td>{project.academic_year}</td>

                        {/* ประเภท */}
                        <td>{getProjectTypeLabel(project.project_type)}</td>

                        {/* รับนิสิต */}
                        <td>
                          {project.current_members} / {project.max_members} คน
                        </td>

                        {/* สถานะ */}
                        <td>
                          <span
                            className={`table-status ${getStatusClass(project)}`}
                          >
                            {getDisplayStatus(project)}
                          </span>
                        </td>

                        {/* จัดการ */}
                        <td>
                          <div className="table-actions">
                            <button
                              className="action-btn detail-btn"
                              onClick={() =>
                                navigate(
                                  `/teacher-project-details/${project.id}`,
                                )
                              }
                            >
                              รายละเอียด
                            </button>

                            <button
                              className="action-btn edit-btn"
                              onClick={() =>
                                navigate(`/teacher-project-edit/${project.id}`)
                              }
                            >
                              แก้ไข
                            </button>

                            <div className="more-menu-wrapper">
                              <button
                                className="action-btn more-btn"
                                onClick={() =>
                                  setOpenMenuId(
                                    openMenuId === project.id
                                      ? null
                                      : project.id,
                                  )
                                }
                              >
                                <FaEllipsisV />
                              </button>

                              {openMenuId === project.id && (
                                <div className="more-menu">
                                  {project.visibility === "แสดง" ? (
                                    <button
                                      onClick={() => openHideModal(project.id)}
                                    >
                                      ซ่อนหัวข้อ
                                    </button>
                                  ) : (
                                    <button
                                      onClick={() => openShowModal(project.id)}
                                    >
                                      แสดงหัวข้อ
                                    </button>
                                  )}

                                  <button
                                    className="delete-option"
                                    onClick={() =>
                                      openDeleteModal(project.id, project.title)
                                    }
                                  >
                                    ลบหัวข้อ
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>
      {/* =========================
          POPUP ซ่อน / แสดงหัวข้อ
      ========================= */}

      {confirmModal.open && (
        <div className="confirm-modal-overlay">
          <div className="confirm-modal">
            <h3>
              {confirmModal.type === "hide"
                ? "ซ่อนหัวข้อโครงงาน?"
                : confirmModal.type === "show"
                  ? "แสดงหัวข้อโครงงาน?"
                  : "ลบหัวข้อโครงงาน?"}
            </h3>

            <div className="confirm-line"></div>

            {confirmModal.type === "delete" ? (
              <div className="delete-confirm-content">
                <p>คุณกำลังจะลบหัวข้อ</p>

                <p className="delete-project-title">
                  “{confirmModal.projectTitle}”
                </p>

                <p>การลบหัวข้อจะทำให้หัวข้อนี้ไม่สามารถใช้งานต่อได้</p>

                <p className="delete-warning">⚠️ กรุณาตรวจสอบข้อมูลก่อนลบ</p>
              </div>
            ) : (
              <p>
                {confirmModal.type === "hide"
                  ? "หากซ่อนหัวข้อนี้ นิสิตจะไม่สามารถมองเห็นและสมัครเข้าร่วมโครงงานนี้ได้"
                  : "หากแสดงหัวข้อนี้ นิสิตจะสามารถมองเห็นและสมัครเข้าร่วมโครงงานนี้ได้"}
              </p>
            )}

            <div className="confirm-actions">
              {/* ปุ่มยกเลิก */}
              <button
                className="confirm-cancel-btn"
                onClick={closeConfirmModal}
              >
                ยกเลิก
              </button>

              {/* ปุ่มยืนยัน */}
              <button
                className="confirm-submit-btn"
                onClick={() => {
                  if (confirmModal.projectId === null) return;

                  if (confirmModal.type === "hide") {
                    handleHideProject(confirmModal.projectId);
                  } else if (confirmModal.type === "show") {
                    handleShowProject(confirmModal.projectId);
                  } else if (confirmModal.type === "delete") {
                    handleDeleteProject(confirmModal.projectId);
                  }
                }}
              >
                {confirmModal.type === "hide"
                  ? "ซ่อน"
                  : confirmModal.type === "show"
                    ? "แสดง"
                    : "ลบหัวข้อ"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default TeacherProjects;
