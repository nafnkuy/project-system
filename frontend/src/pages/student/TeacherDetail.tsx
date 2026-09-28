import "./TeacherDetail.css";

import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { FaBell } from "react-icons/fa";
import axios from "axios";

import logo from "../../assets/Logo.svg";

interface Project {
  id: number;
  title: string;
  status: string;
  project_type: string;
  max_members: number;
  current_members: number;
  academic_year: string | null;
}

interface TeacherDetailData {
  id: number;
  username: string;

  name: string;
  english_name: string | null;

  position: string | null;
  major: string | null;

  phone: string | null;
  email: string | null;

  office: string | null;
  office_phone: string | null;

  profile_image: string | null;

  expertise: string[];

  current_projects: number;
  max_capacity: number;
  remaining_capacity: number;

  advisor_status: string;

  projects: Project[];
}

function TeacherDetail() {
  const navigate = useNavigate();

  const { teacherId } = useParams();

  const username = sessionStorage.getItem("username");
  const profileImage = sessionStorage.getItem("profileImage");

  const [teacher, setTeacher] = useState<TeacherDetailData | null>(null);

  const [loading, setLoading] = useState(true);

  /* =========================
     ดึงข้อมูลอาจารย์
  ========================= */

  useEffect(() => {
    if (!teacherId) return;

    axios
      .get(`http://localhost:5000/teachers/${teacherId}`)
      .then((res) => {
        console.log("Teacher Detail =", res.data);

        setTeacher(res.data);
      })
      .catch((err) => {
        console.log("Get teacher detail error:", err);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [teacherId]);

  /* =========================
     Logout
  ========================= */

  const handleLogout = () => {
    sessionStorage.clear();
    navigate("/");
  };

  if (loading) {
    return <div className="teacher-detail-loading">กำลังโหลดข้อมูล...</div>;
  }

  if (!teacher) {
    return <div className="teacher-detail-loading">ไม่พบข้อมูลอาจารย์</div>;
  }

  return (
    <div className="teacher-detail-page">
      {/* ================= SIDEBAR ================= */}

      <aside className="teacher-detail-sidebar">
        <div className="teacher-detail-logo">
          <img src={logo} alt="SPTC Logo" />

          <div>
            <h2>SPTC System</h2>
            <p>
              ระบบติดตามและสื่อสาร
              <br />
              โครงงานนิสิต
            </p>
          </div>
        </div>

        <nav>
          <ul>
            <li onClick={() => navigate("/StudentHome")}>หน้าหลัก</li>

            <li className="active" onClick={() => navigate("/teachers")}>
              รายชื่ออาจารย์
            </li>

            <li onClick={() => navigate("/submit-new-project")}>
              ส่งคำเสนอโครงงานใหม่
            </li>

            <li>ข้อมูลส่วนตัว</li>

            <li>โครงงานของฉัน</li>

            <li>การแจ้งเตือน</li>
          </ul>
        </nav>

        <button className="teacher-detail-logout" onClick={handleLogout}>
          ออกจากระบบ
        </button>
      </aside>

      {/* ================= MAIN ================= */}

      <main className="teacher-detail-main">
        {/* ================= HEADER ================= */}

        <header className="teacher-detail-header">
          <h2>รายละเอียดอาจารย์</h2>

          <div className="teacher-detail-header-right">
            <button className="teacher-detail-bell" type="button">
              <FaBell />
            </button>

            <div className="teacher-detail-user">
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

        <div className="teacher-detail-content">
          {/* ================= PROFILE ================= */}

          <section className="teacher-profile-card">
            <div className="teacher-profile-image">
              <img
                src={
                  teacher.profile_image
                    ? `http://localhost:5000${teacher.profile_image}`
                    : logo
                }
                alt={teacher.name}
              />
            </div>

            <div className="teacher-profile-info">
              <div className="teacher-profile-title">
                <h3>{teacher.name}</h3>

                <span
                  className={`teacher-detail-status ${
                    teacher.advisor_status === "เต็ม"
                      ? "full"
                      : teacher.advisor_status === "ใกล้เต็ม"
                        ? "almost"
                        : "open"
                  }`}
                >
                  สถานะ : <strong>{teacher.advisor_status}</strong>
                </span>
              </div>

              <div className="teacher-profile-divider" />

              <div className="teacher-information">
                <p>
                  <span>ชื่อ :</span> {teacher.english_name || "-"}
                </p>

                <p>
                  <span>ตำแหน่ง :</span> {teacher.position || "-"}
                </p>

                <p>
                  <span>อีเมล :</span> {teacher.email || "-"}
                </p>

                <p>
                  <span>ห้องทำงาน :</span> {teacher.office || "-"}
                </p>

                <p>
                  <span>เบอร์โทร :</span>{" "}
                  {teacher.office_phone || teacher.phone || "-"}
                </p>

                <div className="teacher-expertise">
                  <span>สาขาที่สนใจ :</span>

                  <div>
                    {teacher.expertise.length > 0 ? (
                      teacher.expertise.map((item, index) => (
                        <p key={index}>{item}</p>
                      ))
                    ) : (
                      <p>-</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* ================= SUMMARY ================= */}

          <section className="teacher-summary">
            <div className="teacher-summary-card">
              <span>จำนวนโครงงานปัจจุบัน</span>

              <strong className="current">{teacher.current_projects}</strong>
            </div>

            <div className="teacher-summary-card">
              <span>จำนวนสูงสุด</span>

              <strong className="maximum">{teacher.max_capacity}</strong>
            </div>

            <div className="teacher-summary-card">
              <span>คงเหลือ</span>

              <strong className="remaining">
                {teacher.remaining_capacity}
              </strong>
            </div>
          </section>

          {/* ================= PROJECTS ================= */}

          <section className="teacher-project-card">
            <div className="teacher-project-heading">
              <h3>รายการหัวข้อโครงงาน</h3>

              <button
                type="button"
                className="teacher-propose-btn"
                disabled={teacher.remaining_capacity <= 0}
                onClick={() =>
                  navigate(`/submit-new-project?advisorId=${teacher.id}`)
                }
              >
                ส่งคำเสนอโครงงานใหม่&nbsp; ⊕
              </button>
            </div>

            <table className="teacher-project-table">
              <thead>
                <tr>
                  <th>ชื่อหัวข้อ</th>
                  <th>สถานะ</th>
                  <th>จำนวนรับ</th>
                  <th>รายละเอียด</th>
                </tr>
              </thead>

              <tbody>
                {teacher.projects.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="teacher-project-empty">
                      ยังไม่มีหัวข้อโครงงาน
                    </td>
                  </tr>
                ) : (
                  teacher.projects.map((project) => (
                    <tr
                      key={project.id}
                      className={
                        project.status === "ปิดรับ" ? "project-row-closed" : ""
                      }
                    >
                      <td>{project.title}</td>

                      <td>{project.status}</td>

                      <td>
                        {project.current_members}/{project.max_members}
                      </td>

                      <td>
                        <button
                          type="button"
                          className="teacher-project-detail-btn"
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
          </section>
        </div>
      </main>
    </div>
  );
}

export default TeacherDetail;
