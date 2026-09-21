import "./StudentHome.css";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import axios from "axios";
import { FaBell, FaSearch } from "react-icons/fa";
import logo from "../../assets/Logo.svg";


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


interface SystemNotification {
  id: number;

  message: string;

  request_id: number | null;

  project_id: number | null;

  created_at: string;
}


interface Notification {
  id: number;

  project_id: number;

  sender_id: number;

  sender_username: string;

  sender_name: string;

  receiver_id: number;

  receiver_username: string;

  receiver_name: string;

  title: string;

  project_type: string;

  description: string;

  objectives: string;

  skills: string;

  requirements: string;

  contact_type: string;

  contact_value: string;

  introduction: string;

  status: string;

  created_at: string;
}


/* =========================================================
   COMPONENT
========================================================= */

function StudentHome() {
  const navigate = useNavigate();


  /* =========================================================
     SESSION
  ========================================================= */

  const userId = sessionStorage.getItem("userId");

  const username = sessionStorage.getItem("username");

  const profileImage = sessionStorage.getItem("profileImage");


  /* =========================================================
     STATE
  ========================================================= */

  const [projects, setProjects] = useState<Project[]>([]);

  const [searchTerm, setSearchTerm] = useState("");

  const [currentPage, setCurrentPage] = useState(1);

  const itemsPerPage = 10;


  /* ---------- NOTIFICATION ---------- */

  const [showNotifications, setShowNotifications] =
    useState(false);

  const [notifications, setNotifications] = useState<
    Notification[]
  >([]);

  const [systemNotifications, setSystemNotifications] =
    useState<SystemNotification[]>([]);


  /* ---------- SELECTED POPUP ---------- */

  const [
    selectedInvitation,
    setSelectedInvitation,
  ] = useState<Notification | null>(null);

  const [
    selectedSystemNotification,
    setSelectedSystemNotification,
  ] = useState<SystemNotification | null>(null);


  /* =========================================================
     FILTER PROJECT
  ========================================================= */

  const filteredProjects = projects.filter((project) => {
    const keyword = searchTerm.toLowerCase().trim();

    const matchesSearch =
      project.title
        .toLowerCase()
        .includes(keyword) ||
      project.advisor
        .toLowerCase()
        .includes(keyword);

    const canDisplay =
      project.source === "teacher" &&
      project.visibility === "แสดง" &&
      (
        project.status === "เปิดรับ" ||
        project.status === "ใกล้เต็ม"
      );

    return canDisplay && matchesSearch;
  });


  /* =========================================================
     PAGINATION
  ========================================================= */

  const totalPages = Math.ceil(
    filteredProjects.length / itemsPerPage,
  );

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
     PROJECT INVITATION
  ========================================================= */

  useEffect(() => {
    if (!userId) return;

    axios
      .get(
        `http://localhost:5000/project-invitations/${userId}`,
      )
      .then((res) => {
        console.log(
          "Project Invitations =",
          res.data,
        );

        setNotifications(res.data);
      })
      .catch((err) => {
        console.log(
          "Get project invitations error:",
          err,
        );
      });
  }, [userId]);


  /* =========================================================
     SYSTEM NOTIFICATION
  ========================================================= */

  useEffect(() => {
    if (!userId) return;

    axios
      .get(
        `http://localhost:5000/notifications/${userId}`,
      )
      .then((res) => {
        console.log(
          "System Notifications =",
          res.data,
        );

        setSystemNotifications(res.data);
      })
      .catch((err) => {
        console.log(
          "Get notifications error:",
          err,
        );
      });
  }, [userId]);


  /* =========================================================
     ACCEPT INVITATION
  ========================================================= */

  const handleAcceptInvitation = async () => {
    if (!selectedInvitation) return;

    try {
      const res = await axios.post(
        `http://localhost:5000/project-invitations/${selectedInvitation.id}/accept`,
      );

      alert(res.data.message);


      /* เอาคำเชิญออกจากรายการ */

      setNotifications((prev) =>
        prev.filter(
          (item) =>
            item.id !== selectedInvitation.id,
        ),
      );


      /* ปิด popup */

      setSelectedInvitation(null);

      setShowNotifications(false);
    } catch (err: any) {
      console.log(
        "Accept invitation error:",
        err,
      );

      console.log(err.response?.data);

      alert(
        err.response?.data?.message ||
          "ไม่สามารถตอบรับคำเชิญได้",
      );
    }
  };


  /* =========================================================
     REJECT INVITATION
  ========================================================= */

  const handleRejectInvitation = async () => {
    if (!selectedInvitation) return;

    try {
      const res = await axios.post(
        `http://localhost:5000/project-invitations/${selectedInvitation.id}/reject`,
      );

      alert(res.data.message);


      /* เอาคำเชิญออกจากรายการ */

      setNotifications((prev) =>
        prev.filter(
          (item) =>
            item.id !== selectedInvitation.id,
        ),
      );


      /* ปิด popup */

      setSelectedInvitation(null);

      setShowNotifications(false);
    } catch (err: any) {
      console.log(
        "Reject invitation error:",
        err,
      );

      console.log(err.response?.data);

      alert(
        err.response?.data?.message ||
          "ไม่สามารถปฏิเสธคำเชิญได้",
      );
    }
  };


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
          <img
            src={logo}
            alt="SPTC Logo"
          />

          <div>
            <h2>SPTC System</h2>

            <p>
              ระบบติดตามและสื่อสารโครงงานนิสิต
            </p>
          </div>
        </div>


        {/* MENU */}

        <nav>
          <ul>

            <li className="active">
              หน้าหลัก
            </li>

            <li>
              รายชื่ออาจารย์
            </li>

            <li
              onClick={() =>
                navigate("/submit-new-project")
              }
            >
              ส่งคำเสนอโครงงานใหม่
            </li>

            <li>
              โครงงานของฉัน
            </li>

            <li>
              การแจ้งเตือน
            </li>

            <li>
              ข้อมูลส่วนตัว
            </li>

          </ul>
        </nav>


        {/* LOGOUT */}

        <button
          className="logout-btn"
          onClick={handleLogout}
        >
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

            <div className="notification-box">

              <div className="notification-wrapper">

                <button
                  className="notification-btn"
                  onClick={() =>
                    setShowNotifications(
                      !showNotifications,
                    )
                  }
                >
                  <FaBell />


                  {/* จำนวนแจ้งเตือน */}

                  {(notifications.length +
                    systemNotifications.length) >
                    0 && (
                    <span className="notification-count">
                      {notifications.length +
                        systemNotifications.length}
                    </span>
                  )}

                </button>


                {/* ===========================================
                    NOTIFICATION DROPDOWN
                =========================================== */}

                {showNotifications && (
                  <div className="notification-dropdown">

                    <h4>การแจ้งเตือน</h4>


                    {/* PROJECT INVITATION */}

                    {notifications.map((item) => (
                      <div
                        key={`invitation-${item.id}`}
                        className="notification-item"
                        onClick={() => {
                          setSelectedInvitation(
                            item,
                          );

                          setShowNotifications(
                            false,
                          );
                        }}
                      >
                        <p>
                          {item.sender_name}{" "}
                          ได้เชิญคุณเข้าร่วมโครงงาน
                        </p>

                        <small>
                          {item.created_at}
                        </small>
                      </div>
                    ))}


                    {/* SYSTEM NOTIFICATION */}

                    {systemNotifications.map(
                      (item) => (
                        <div
                          key={`notification-${item.id}`}
                          className="notification-item"
                          onClick={() => {
                            setSelectedSystemNotification(
                              item,
                            );

                            setShowNotifications(
                              false,
                            );
                          }}
                        >
                          <p>
                            {
                              item.message.split(
                                "\n",
                              )[0]
                            }
                          </p>

                          <small>
                            {item.created_at}
                          </small>
                        </div>
                      ),
                    )}


                    {/* ไม่มีแจ้งเตือน */}

                    {notifications.length ===
                      0 &&
                      systemNotifications.length ===
                        0 && (
                        <div className="notification-item">
                          <p>
                            ไม่มีการแจ้งเตือน
                          </p>
                        </div>
                      )}

                  </div>
                )}

              </div>
            </div>


            {/* USER */}

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
              placeholder="ค้นหาชื่อโครงงาน หรืออาจารย์"
              value={searchTerm}
              onChange={(e) =>
                setSearchTerm(
                  e.target.value,
                )
              }
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

                <th>
                  ชื่อหัวข้อโครงงาน
                </th>

                <th>
                  อาจารย์ที่ปรึกษา
                </th>

                <th>
                  สาขาวิชา
                </th>

                <th>
                  รับนิสิต
                </th>

                <th>
                  จัดการ
                </th>

              </tr>
            </thead>


            {/* TABLE BODY */}

            <tbody>

              {currentProjects.length === 0 ? (

                <tr>

                  <td
                    colSpan={5}
                    className="student-empty-cell"
                  >
                    {searchTerm.trim() !== ""
                      ? "ไม่พบหัวข้อโครงงานที่ตรงกับการค้นหา"
                      : "ยังไม่มีหัวข้อโครงงาน"}
                  </td>

                </tr>

              ) : (

                currentProjects.map(
                  (project) => (

                    <tr key={project.id}>

                      {/* ชื่อโครงงาน */}

                      <td
                        className="student-project-title"
                        title={project.title}
                      >
                        {project.title}
                      </td>


                      {/* อาจารย์ */}

                      <td>
                        {project.advisor}
                      </td>


                      {/* สาขา */}

                      <td>
                        {project.major}
                      </td>


                      {/* จำนวนรับ */}

                      <td>
                        {
                          project.current_members
                        }{" "}
                        /{" "}
                        {
                          project.max_members
                        }{" "}
                        คน
                      </td>


                      {/* DETAIL */}

                      <td>
                        <button
                          className="student-detail-btn"
                          onClick={() =>
                            navigate(
                              `/project-details/${project.id}`,
                            )
                          }
                        >
                          รายละเอียด
                        </button>
                      </td>

                    </tr>
                  ),
                )

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
                onClick={() =>
                  setCurrentPage(
                    currentPage - 1,
                  )
                }
                disabled={
                  currentPage === 1
                }
              >
                &lt;
              </button>


              {/* PAGE */}

              <span>
                {currentPage} of{" "}
                {Math.max(
                  totalPages,
                  1,
                )}
              </span>


              {/* NEXT */}

              <button
                onClick={() =>
                  setCurrentPage(
                    currentPage + 1,
                  )
                }
                disabled={
                  currentPage ===
                    totalPages ||
                  totalPages === 0
                }
              >
                &gt;
              </button>

            </div>

          )}

        </div>


        {/* ===================================================
            INVITATION POPUP
        =================================================== */}

        {selectedInvitation && (

          <div className="invitation-overlay">

            <div className="invitation-popup">

              <h3>
                คำเชิญเข้าร่วมโครงงาน
              </h3>


              <div className="invitation-divider"></div>


              {/* PROJECT */}

              <div className="invitation-detail">

                <p>
                  <strong>
                    ชื่อหัวข้อโครงงาน
                  </strong>
                </p>

                <p>
                  {
                    selectedInvitation.title
                  }
                </p>

              </div>


              {/* MEMBER 1 */}

              <div className="invitation-detail">

                <p>
                  <strong>
                    สมาชิกคนที่ 1
                  </strong>
                </p>

                <p>
                  {
                    selectedInvitation.sender_username
                  }{" "}
                  {
                    selectedInvitation.sender_name
                  }
                </p>

              </div>


              {/* MEMBER 2 */}

              <div className="invitation-detail">

                <p>
                  <strong>
                    สมาชิกคนที่ 2
                  </strong>
                </p>

                <p>
                  {
                    selectedInvitation.receiver_username
                  }{" "}
                  {
                    selectedInvitation.receiver_name
                  }
                </p>

              </div>


              <div className="invitation-divider"></div>


              <p className="invitation-question">
                คุณต้องการเข้าร่วมโครงงานนี้หรือไม่
              </p>


              {/* ACTION */}

              <div className="invitation-actions">

                <button
                  className="reject-btn"
                  onClick={
                    handleRejectInvitation
                  }
                >
                  ปฏิเสธ
                </button>


                <button
                  className="accept-btn"
                  onClick={
                    handleAcceptInvitation
                  }
                >
                  ตกลง
                </button>

              </div>

            </div>

          </div>

        )}


        {/* ===================================================
            SYSTEM NOTIFICATION POPUP
        =================================================== */}

        {selectedSystemNotification && (

          <div
            className="invitation-overlay"
            onClick={() =>
              setSelectedSystemNotification(
                null,
              )
            }
          >

            <div
              className="invitation-popup"
              onClick={(e) =>
                e.stopPropagation()
              }
            >

              <h3>
                ผลการพิจารณาโครงงาน
              </h3>


              <div className="invitation-divider"></div>


              <div className="notification-detail-message">
                {
                  selectedSystemNotification.message
                }
              </div>


              <div className="invitation-divider"></div>


              <div className="invitation-actions">

                {/* CLOSE */}

                <button
                  className="reject-btn"
                  onClick={() =>
                    setSelectedSystemNotification(
                      null,
                    )
                  }
                >
                  ปิด
                </button>


                {/* RESUBMIT */}

                {selectedSystemNotification.project_id &&
                  selectedSystemNotification.request_id && (

                    <button
                      className="accept-btn"
                      onClick={() => {
                        navigate(
                          `/submit-new-project?mode=resubmit&projectId=${selectedSystemNotification.project_id}&requestId=${selectedSystemNotification.request_id}`,
                        );
                      }}
                    >
                      แก้ไขและส่งใหม่
                    </button>

                  )}

              </div>

            </div>

          </div>

        )}

      </main>

    </div>
  );
}


export default StudentHome;