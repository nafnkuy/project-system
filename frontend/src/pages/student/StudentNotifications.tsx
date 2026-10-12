import "./StudentNotifications.css";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import { useNavigate } from "react-router-dom";

import axios from "axios";

import { FaSearch } from "react-icons/fa";

import logo from "../../assets/Logo.svg";

import StudentNotificationBell from "./StudentNotificationBell";


interface NotificationItem {
  id: number;

  message: string;

  is_read: number;

  request_id: number | null;

  project_id: number | null;

  document_id: number | null;

  created_at: string;
}


function StudentNotifications() {
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


  /* =========================================================
     LOGIN
  ========================================================= */

  useEffect(() => {
    if (!userId) {
      navigate("/");
    }
  }, [userId, navigate]);


  /* =========================================================
     LOAD NOTIFICATIONS
  ========================================================= */

  useEffect(() => {
    if (!userId) return;

    axios
      .get(
        `http://localhost:5000/notifications/${userId}`,
      )
      .then((res) => {
        console.log(
          "Student notifications =",
          res.data,
        );

        setNotifications(res.data);
      })
      .catch((err) => {
        console.log(
          "Get student notifications error:",
          err,
        );
      })
      .finally(() => {
        setLoading(false);
      });

  }, [userId]);


  /* =========================================================
     FILTER
  ========================================================= */

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


  /* =========================================================
     PAGINATION
  ========================================================= */

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


  /* =========================================================
     OPEN NOTIFICATION
  ========================================================= */

  const handleNotificationClick =
    async (
      item: NotificationItem,
    ) => {

      try {

        if (item.is_read === 0) {

          await axios.put(
            `http://localhost:5000/notifications/${item.id}/read`,
          );


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


        /*
          ถ้าแจ้งเตือนนี้เกี่ยวกับคำขอโครงงาน
          ให้ไปดูรายละเอียดคำขอนั้นได้เลย
        */

        if (
          item.request_id &&
          userId
        ) {
          navigate(
            `/student-project-request-detail/${item.request_id}/${userId}`,
          );
        }

      } catch (err) {

        console.log(
          "Open notification error:",
          err,
        );

      }
    };


  /* =========================================================
     DATE
  ========================================================= */

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
    <div className="student-notifications-page">

      {/* ======================================
          SIDEBAR
      ====================================== */}

      <aside className="student-notifications-sidebar">

        <div className="student-notifications-logo">

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
                  "/StudentHome",
                )
              }
            >
              หน้าหลัก
            </li>


            <li
              onClick={() =>
                navigate(
                  "/teachers",
                )
              }
            >
              รายชื่ออาจารย์
            </li>


            <li
              onClick={() =>
                navigate(
                  "/submit-new-project",
                )
              }
            >
              ส่งคำเสนอโครงงานใหม่
            </li>


            <li
              onClick={() =>
                navigate(
                  "/student-project",
                )
              }
            >
              โครงงานของฉัน
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
          className="student-notifications-logout"
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

      <main className="student-notifications-main">

        {/* HEADER */}

        <header className="student-notifications-header">

          <h2>
            การแจ้งเตือน
          </h2>


          <div className="student-notifications-header-right">

            <StudentNotificationBell />


            <div className="student-notifications-user">

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

        <div className="student-notifications-content">


          {/* TOOLBAR */}

          <div className="student-notifications-toolbar">

            <div className="student-notifications-search">

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


            <div className="student-notifications-select-wrapper">

              <select
                className="student-notifications-filter"
                value={
                  statusFilter
                }
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

              <span className="student-notifications-select-arrow">
                ▼
              </span>

            </div>

          </div>


          {/* ======================================
              LIST
          ====================================== */}

          <div className="student-notifications-card">

            {loading ? (

              <div className="student-notifications-empty">
                กำลังโหลดข้อมูล...
              </div>

            ) : currentNotifications.length === 0 ? (

              <div className="student-notifications-empty">
                ไม่มีการแจ้งเตือน
              </div>

            ) : (

              currentNotifications.map(
                (item) => (

                  <div
                    key={item.id}
                    className={`student-notifications-row ${
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

                    {/* จุดสถานะ */}

                    <div className="student-notifications-dot">

                      {item.is_read === 0
                        ? "●"
                        : "○"}

                    </div>


                    {/* ข้อความ */}

                    <div className="student-notifications-message">

                      {item.message}

                    </div>


                    {/* วันเวลา */}

                    <div className="student-notifications-date">

                      {formatDateTime(
                        item.created_at,
                      )}

                    </div>

                  </div>

                ),
              )

            )}


            {/* PAGINATION */}

            {filteredNotifications.length >
              0 && (

              <div className="student-notifications-pagination">

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
                  ‹
                </button>


                <span>
                  {currentPage}
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


export default StudentNotifications;