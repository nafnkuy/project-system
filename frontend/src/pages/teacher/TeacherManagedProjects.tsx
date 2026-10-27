import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { FaSearch } from "react-icons/fa";

import TeacherNotificationBell from "./TeacherNotificationBell";
import logo from "../../assets/Logo.svg";

import "./TeacherHome.css";
import "./TeacherManagedProjects.css";

interface ManagedProject {
  id: number;
  title: string;
  students: string;
  status: "in_progress" | "waiting_exam" | "evaluating" | "completed";
}

function TeacherManagedProjects() {
  const navigate = useNavigate();

  const advisorId = sessionStorage.getItem("userId");

  const username = sessionStorage.getItem("username");
  const profileImage = sessionStorage.getItem("profileImage");

  const handleLogout = () => {
    sessionStorage.removeItem("userId");
    sessionStorage.removeItem("username");
    sessionStorage.removeItem("name");
    sessionStorage.removeItem("profileImage");

    navigate("/");
  };

  const [projects, setProjects] = useState<ManagedProject[]>([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    if (!advisorId) return;
    try {
      const res = await axios.get(
        `http://localhost:5000/teacher/managed-projects/${advisorId}`,
      );
      setProjects(res.data || []);
    } catch (error) {
      console.error("โหลดโครงงานที่ดูแลไม่สำเร็จ", error);
    }
  };

  const filteredProjects = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    if (!keyword) return projects;

    return projects.filter(
      (item) =>
        item.title.toLowerCase().includes(keyword) ||
        item.students.toLowerCase().includes(keyword),
    );
  }, [projects, search]);

  const getStatusLabel = (status: ManagedProject["status"]) => {
    switch (status) {
      case "in_progress":
        return "กำลังดำเนินการ";
      case "waiting_exam":
        return "รอการสอบ";
      case "evaluating":
        return "อยู่ระหว่างการประเมิน";
      case "completed":
        return "เสร็จสิ้น";
      default:
        return "-";
    }
  };

  const getStatusClass = (status: ManagedProject["status"]) => {
    switch (status) {
      case "in_progress":
        return "tmp-status tmp-in-progress";
      case "waiting_exam":
        return "tmp-status tmp-waiting-exam";
      case "evaluating":
        return "tmp-status tmp-evaluating";
      case "completed":
        return "tmp-status tmp-completed";
      default:
        return "tmp-status";
    }
  };

  return (
  <div className="teacher-home-page teacher-managed-page">

    {/* =========================================
        SIDEBAR
    ========================================= */}

    <aside className="sidebar">
      <div className="logo">
        <img src={logo} alt="Logo" />

        <div>
          <h2>SPTC System</h2>
          <p>ระบบติดตามและสื่อสารโครงงานนิสิต</p>
        </div>
      </div>

      <nav>
        <ul>
          <li onClick={() => navigate("/teacher-home")}>
            หน้าหลัก
          </li>

          <li onClick={() => navigate("/teacher-projects")}>
            จัดการหัวข้อโครงงาน
          </li>

          <li onClick={() => navigate("/teacher-requests")}>
            คำขอเข้าร่วมโครงงาน
          </li>

          <li className="active">
            โครงงานที่ดูแล
          </li>

          <li onClick={() => navigate("/teacher-work")}>
            งานที่ต้องดำเนินการ
          </li>

          <li
            onClick={() =>
              navigate("/teacher-decision-history")
            }
          >
            ประวัติการพิจารณา
          </li>

          <li
            onClick={() => navigate("/teacher-notifications")}
          >
            การแจ้งเตือน
          </li>

          <li>ข้อมูลส่วนตัว</li>
        </ul>
      </nav>

      <button
        type="button"
        className="logout-btn"
        onClick={handleLogout}
      >
        ออกจากระบบ
      </button>
    </aside>

    {/* =========================================
        MAIN
    ========================================= */}

    <main className="main">

      {/* HEADER */}

      <header className="header">
        <h2>โครงงานที่ดูแล</h2>

        <div className="header-right">
          <TeacherNotificationBell />

          <div className="user-info">
            <img
              src={
                profileImage
                  ? `http://localhost:5000${profileImage}`
                  : logo
              }
              alt="Profile"
              className="profile-image"
            />

            <span>{username || "-"}</span>
          </div>
        </div>
      </header>

      {/* =========================================
          PAGE CONTENT
      ========================================= */}

      <div className="tmp-page">

        {/* SEARCH */}

        <div className="tmp-search-wrap">
          <div className="tmp-search-box">
            <input
              type="text"
              placeholder="ค้นหาโครงงานหรือนิสิต"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="tmp-search"
            />

            <FaSearch className="tmp-search-icon" />
          </div>
        </div>

        {/* PROJECT TABLE CARD */}

        <div className="tmp-card">
          <h3>โครงงานที่ดูแล</h3>

          <div className="tmp-table-wrap">
            <table className="tmp-table">
              <thead>
                <tr>
                  <th>โครงงาน</th>
                  <th>นิสิต</th>
                  <th>สถานะ</th>
                  <th>รายละเอียด</th>
                </tr>
              </thead>

              <tbody>
                {filteredProjects.length > 0 ? (
                  filteredProjects.map((project) => (
                    <tr key={project.id}>

                      {/* PROJECT TITLE */}

                      <td>{project.title}</td>

                      {/* STUDENTS */}

                      <td>
                        <div className="tmp-students">
                          {project.students
                            .split("|")
                            .map((student, index) => (
                              <span key={index}>
                                {student.trim()}
                              </span>
                            ))}
                        </div>
                      </td>

                      {/* STATUS */}

                      <td>
                        <span
                          className={getStatusClass(project.status)}
                        >
                          {getStatusLabel(project.status)}
                        </span>
                      </td>

                      {/* DETAILS */}

                      <td>
                        <button
                          type="button"
                          className="tmp-detail-btn"
                          onClick={() =>
                            navigate(
                              `/teacher-managed-projects/${project.id}`
                            )
                          }
                        >
                          ดูรายละเอียด
                        </button>
                      </td>

                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="tmp-empty">
                      {search.trim()
                        ? "ไม่พบโครงงานที่ค้นหา"
                        : "ยังไม่มีโครงงานที่ดูแล"}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </main>
  </div>
);

}
export default TeacherManagedProjects;