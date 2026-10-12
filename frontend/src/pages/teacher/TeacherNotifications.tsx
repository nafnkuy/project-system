import "./TeacherNotifications.css";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import { useNavigate } from "react-router-dom";

import axios from "axios";

import { FaSearch } from "react-icons/fa";

import logo from "../../assets/Logo.svg";

import TeacherNotificationBell from "./TeacherNotificationBell";


interface NotificationItem {
  id: number;

  message: string;

  is_read: number;

  request_id: number | null;

  project_id: number | null;

  document_id: number | null;

  created_at: string;
}


function TeacherNotifications() {
  const navigate = useNavigate();

  const userId =
    sessionStorage.getItem("userId");

  const username =
    sessionStorage.getItem("username");

  const profileImage =
    sessionStorage.getItem("profileImage");


  const [
    notifications,
    setNotifications,
  ] = useState<NotificationItem[]>([]);

  const [
    searchTerm,
    setSearchTerm,
  ] = useState("");

  const [
    statusFilter,
    setStatusFilter,
  ] = useState<
    "ทั้งหมด" | "ยังไม่อ่าน" | "อ่านแล้ว"
  >("ทั้งหมด");

  const [
    currentPage,
    setCurrentPage,
  ] = useState(1);

  const [
    loading,
    setLoading,
  ] = useState(true);

  const itemsPerPage = 10;


  /* ==========================================
     CHECK LOGIN
  ========================================== */

  useEffect(() => {
    if (!userId) {
      navigate("/");
    }
  }, [userId, navigate]);


  /* ==========================================
     LOAD NOTIFICATIONS
  ========================================== */

  useEffect(() => {
    if (!userId) return;

    axios
      .get(
        `http://localhost:5000/notifications/${userId}`,
      )
      .then((res) => {
        console.log(
          "Teacher notifications =",
          res.data,
        );

        setNotifications(res.data);
      })
      .catch((err) => {
        console.log(
          "Get teacher notifications error:",
          err,
        );
      })
      .finally(() => {
        setLoading(false);
      });

  }, [userId]);


  /* ==========================================
     FILTER
  ========================================== */

  const filteredNotifications =
    useMemo(() => {

      const keyword =
        searchTerm
          .trim()
          .toLowerCase();

      return notifications.filter(
        (item) => {

          const matchesSearch =
            item.message
              .toLowerCase()
              .includes(keyword);


          const matchesStatus =
            statusFilter === "ทั้งหมด"
              ? true

              : statusFilter ===
                  "ยังไม่อ่าน"
                ? item.is_read === 0

                : item.is_read === 1;


          return (
            matchesSearch &&
            matchesStatus
          );
        },
      );

    }, [
      notifications,
      searchTerm,
      statusFilter,
    ]);


  /* ==========================================
     PAGINATION
  ========================================== */

  const totalPages = Math.ceil(
    filteredNotifications.length /
      itemsPerPage,
  );


  const currentNotifications =
    filteredNotifications.slice(
      (currentPage - 1) *
        itemsPerPage,

      currentPage *
        itemsPerPage,
    );


  useEffect(() => {
    setCurrentPage(1);
  }, [
    searchTerm,
    statusFilter,
  ]);


  /* ==========================================
     CLICK NOTIFICATION
  ========================================== */

  const handleNotificationClick =
    async (
      item: NotificationItem,
    ) => {

      try {

        // ถ้ายังไม่อ่าน
        if (item.is_read === 0) {

          await axios.put(
            `http://localhost:5000/notifications/${item.id}/read`,
          );


          // เปลี่ยนสถานะในหน้าทันที
          setNotifications(
            (prev) =>
              prev.map(
                (notification) =>
                  notification.id ===
                  item.id
                    ? {
                        ...notification,
                        is_read: 1,
                      }
                    : notification,
              ),
          );

        }


        // ถ้ามี request_id
        // ไปหน้ารายละเอียดคำขอ
        if (item.request_id) {

          navigate(
            `/teacher-request-details/${item.request_id}`,
          );

        }

      } catch (err) {

        console.log(
          "Open teacher notification error:",
          err,
        );

      }
    };


  /* ==========================================
     DATE
  ========================================== */

  const formatDateTime = (
    value: string,
  ) => {

    if (!value) return "-";

    const date =
      new Date(value);

    return date.toLocaleString(
      "th-TH",
      {
        day: "numeric",
        month: "short",
        year: "numeric",

        hour: "2-digit",
        minute: "2-digit",
      },
    );

  };


  /* ==========================================
     LOGOUT
  ========================================== */

  const handleLogout = () => {

    sessionStorage.clear();

    navigate("/");

  };


  return (
    <div className="teacher-notifications-page">


      {/* ======================================
          SIDEBAR
      ====================================== */}

      <aside className="teacher-notifications-sidebar">

        <div className="teacher-notifications-logo">

          <img
            src={logo}
            alt="SPTC Logo"
          />

          <div>

            <h2>
              SPTC System
            </h2>

            <p>
              ระบบติดตามและสื่อสารโครงงานนิสิต
            </p>

          </div>

        </div>


        <nav>
          <ul>

            <li
              onClick={() =>
                navigate(
                  "/teacher-home",
                )
              }
            >
              หน้าหลัก
            </li>


            <li
              onClick={() =>
                navigate(
                  "/teacher-projects",
                )
              }
            >
              จัดการหัวข้อโครงงาน
            </li>


            <li
              onClick={() =>
                navigate(
                  "/teacher/requests",
                )
              }
            >
              คำขอเข้าร่วมโครงงาน
            </li>


            <li>
              ภาระงานที่ปรึกษา
            </li>


            <li>
              ประวัติการพิจารณา
            </li>


            <li className="active">
              การแจ้งเตือน
            </li>


            <li>
              ข้อมูลส่วนตัว
            </li>

          </ul>
        </nav>


        <button
          className="teacher-notifications-logout"
          onClick={
            handleLogout
          }
        >
          ออกจากระบบ
        </button>

      </aside>


      {/* ======================================
          MAIN
      ====================================== */}

      <main className="teacher-notifications-main">


        {/* HEADER */}

        <header className="teacher-notifications-header">

          <h2>
            การแจ้งเตือน
          </h2>


          <div className="teacher-notifications-header-right">

            <TeacherNotificationBell />


            <div className="teacher-notifications-user">

              <img
                src={
                  profileImage
                    ? `http://localhost:5000${profileImage}`
                    : logo
                }
                alt="Profile"
              />

              <span>
                {username}
              </span>

            </div>

          </div>

        </header>


        {/* ======================================
            CONTENT
        ====================================== */}

        <div className="teacher-notifications-content">


          {/* SEARCH + FILTER */}

          <div className="teacher-notifications-toolbar">


            <div className="teacher-notifications-search">

              <input
                type="text"
                placeholder="ค้นหาการแจ้งเตือน"
                value={
                  searchTerm
                }
                onChange={(e) =>
                  setSearchTerm(
                    e.target.value,
                  )
                }
              />

              <FaSearch />

            </div>


            <div className="teacher-notifications-select-wrapper">

              <select
                value={
                  statusFilter
                }
                className="teacher-notifications-filter"
                onChange={(e) =>
                  setStatusFilter(
                    e.target.value as
                      | "ทั้งหมด"
                      | "ยังไม่อ่าน"
                      | "อ่านแล้ว",
                  )
                }
              >

                <option value="ทั้งหมด">
                  ทั้งหมด
                </option>

                <option value="ยังไม่อ่าน">
                  ยังไม่อ่าน
                </option>

                <option value="อ่านแล้ว">
                  อ่านแล้ว
                </option>

              </select>


              <span className="teacher-notifications-select-arrow">
                ▼
              </span>

            </div>

          </div>


          {/* ======================================
              NOTIFICATION LIST
          ====================================== */}

          <div className="teacher-notifications-card">


            {loading ? (

              <div className="teacher-notifications-empty">
                กำลังโหลดข้อมูล...
              </div>

            ) : currentNotifications.length === 0 ? (

              <div className="teacher-notifications-empty">
                ไม่มีการแจ้งเตือน
              </div>

            ) : (

              currentNotifications.map(
                (item) => (

                  <div
                    key={item.id}
                    className={`teacher-notifications-row ${
                      item.is_read === 0
                        ? "unread"
                        : "read"
                    }`}
                    onClick={() =>
                      handleNotificationClick(
                        item,
                      )
                    }
                  >


                    {/* READ STATUS */}

                    <div className="teacher-notifications-dot">

                      {item.is_read === 0
                        ? "●"
                        : "○"}

                    </div>


                    {/* MESSAGE */}

                    <div className="teacher-notifications-message">

                      {item.message}

                    </div>


                    {/* DATE */}

                    <div className="teacher-notifications-date">

                      {formatDateTime(
                        item.created_at,
                      )}

                    </div>

                  </div>

                ),
              )

            )}


            {/* ======================================
                PAGINATION
            ====================================== */}

            {filteredNotifications.length >
              0 && (

              <div className="teacher-notifications-pagination">

                <button
                  onClick={() =>
                    setCurrentPage(
                      (prev) =>
                        prev - 1,
                    )
                  }
                  disabled={
                    currentPage === 1
                  }
                >
                  &lt;
                </button>


                <span>
                  {currentPage} of{" "}
                  {Math.max(
                    totalPages,
                    1,
                  )}
                </span>


                <button
                  onClick={() =>
                    setCurrentPage(
                      (prev) =>
                        prev + 1,
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

        </div>

      </main>

    </div>
  );
}


export default TeacherNotifications;