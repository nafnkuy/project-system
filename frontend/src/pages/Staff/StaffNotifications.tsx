import "./StaffNotifications.css";

import { useEffect, useMemo, useState } from "react";

import { useNavigate } from "react-router-dom";

import { FaBell, FaSearch } from "react-icons/fa";

import axios from "axios";

import logo from "../../assets/Logo.svg";

interface NotificationItem {
  id: number;
  message: string;

  is_read: number;

  request_id: number | null;
  project_id: number | null;
  document_id: number | null;

  created_at: string;
}

function StaffNotifications() {
  const navigate = useNavigate();

  const userId = sessionStorage.getItem("userId");

  const username = sessionStorage.getItem("username");

  const profileImage = sessionStorage.getItem("profileImage");

  const [notifications, setNotifications] = useState<NotificationItem[]>([]);

  const [loading, setLoading] = useState(true);

  const [searchTerm, setSearchTerm] = useState("");

  const [statusFilter, setStatusFilter] = useState("ทั้งหมด");

  const [currentPage, setCurrentPage] = useState(1);

  const itemsPerPage = 10;

  /* =========================
     CHECK LOGIN
  ========================= */

  useEffect(() => {
    if (!userId) {
      navigate("/");
    }
  }, [userId, navigate]);

  /* =========================
     LOAD NOTIFICATIONS
  ========================= */

  useEffect(() => {
    if (!userId) return;

    axios
      .get(`http://localhost:5000/notifications/${userId}`)
      .then((res) => {
        setNotifications(res.data);
      })
      .catch((err) => {
        console.log("Get staff notifications error:", err);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [userId]);

  /* =========================
     FILTER
  ========================= */

  const filteredNotifications = useMemo(() => {
    const keyword = searchTerm.trim().toLowerCase();

    return notifications.filter((notification) => {
      const matchesSearch = notification.message
        .toLowerCase()
        .includes(keyword);

      const matchesStatus =
        statusFilter === "ทั้งหมด" ||
        (statusFilter === "ยังไม่อ่าน" && notification.is_read === 0) ||
        (statusFilter === "อ่านแล้ว" && notification.is_read === 1);

      return matchesSearch && matchesStatus;
    });
  }, [notifications, searchTerm, statusFilter]);

  /* =========================
     PAGINATION
  ========================= */

  const totalPages = Math.ceil(filteredNotifications.length / itemsPerPage);

  const startIndex = (currentPage - 1) * itemsPerPage;

  const currentNotifications = filteredNotifications.slice(
    startIndex,
    startIndex + itemsPerPage,
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter]);

  /* =========================
     DATE
  ========================= */

  const formatThaiDateTime = (dateString: string) => {
    if (!dateString) return "-";

    const date = new Date(dateString);

    const datePart = date.toLocaleDateString("th-TH", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });

    const timePart = date.toLocaleTimeString("th-TH", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });

    return `${datePart} ${timePart} น.`;
  };

  /* =========================
     CLICK NOTIFICATION
  ========================= */

  const handleNotificationClick = async (notification: NotificationItem) => {
    try {
      if (notification.is_read === 0) {
        await axios.put(
          `http://localhost:5000/notifications/${notification.id}/read`,
        );

        setNotifications((prev) =>
          prev.map((item) =>
            item.id === notification.id
              ? {
                  ...item,
                  is_read: 1,
                }
              : item,
          ),
        );
      }

      // ถ้ามี document_id
      // ไปหน้ารายละเอียดเอกสารใบนั้นโดยตรง
      if (notification.document_id) {
        navigate(
          `/staff-document/${notification.document_id}?from=notifications`,
        );
      } else {
        // สำหรับ notification เก่า
        // ที่ยังไม่มี document_id
        navigate("/staff-documents");
      }
    } catch (err) {
      console.log("Open notification error:", err);
    }
  };

  /* =========================
     LOGOUT
  ========================= */

  const handleLogout = () => {
    sessionStorage.clear();
    navigate("/");
  };

  return (
    <div className="staff-notification-page">
      {/* SIDEBAR */}

      <aside className="staff-notification-sidebar">
        <div className="staff-notification-logo">
          <img src={logo} alt="SPTC Logo" />

          <div>
            <h2>SPTC System</h2>

            <p>ระบบติดตามและสื่อสารโครงงานนิสิต</p>
          </div>
        </div>

        <nav>
          <ul>
            <li onClick={() => navigate("/staff-home")}>หน้าหลัก</li>

            <li onClick={() => navigate("/staff-documents")}>
              เอกสารขออนุมัติหัวข้อโครงงาน
            </li>

            <li onClick={() => navigate("/staff-signature-history")}>
              ประวัติการลงนาม
            </li>

            <li className="active">การแจ้งเตือน</li>

            <li>ข้อมูลส่วนตัว</li>
          </ul>
        </nav>

        <button className="staff-notification-logout" onClick={handleLogout}>
          ออกจากระบบ
        </button>
      </aside>

      {/* MAIN */}

      <main className="staff-notification-main">
        <header className="staff-notification-header">
          <h2>การแจ้งเตือน</h2>

          <div className="staff-notification-header-right">
            <button className="staff-notification-bell">
              <FaBell />
            </button>

            <div className="staff-notification-user">
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

        <div className="staff-notification-content">
          {/* SEARCH + FILTER */}

          <div className="staff-notification-toolbar">
            <div className="staff-notification-search">
              <FaSearch />

              <input
                type="text"
                placeholder="ค้นหาการแจ้งเตือน"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div className="staff-notification-select-wrapper">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="staff-notification-filter"
              >
                <option value="ทั้งหมด">ทั้งหมด</option>

                <option value="ยังไม่อ่าน">ยังไม่อ่าน</option>

                <option value="อ่านแล้ว">อ่านแล้ว</option>
              </select>

              <span className="staff-notification-select-arrow">▼</span>
            </div>
          </div>

          {/* LIST */}

          <div className="staff-notification-card">
            {loading && (
              <div className="staff-notification-empty">กำลังโหลดข้อมูล...</div>
            )}

            {!loading && currentNotifications.length === 0 && (
              <div className="staff-notification-empty">ไม่มีการแจ้งเตือน</div>
            )}

            {!loading &&
              currentNotifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`staff-notification-row ${
                    notification.is_read === 0 ? "unread" : "read"
                  }`}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <div className="staff-notification-dot">
                    {notification.is_read === 0 ? "●" : "○"}
                  </div>

                  <div className="staff-notification-message">
                    {notification.message}
                  </div>

                  <div className="staff-notification-date">
                    {formatThaiDateTime(notification.created_at)}
                  </div>
                </div>
              ))}

            {/* PAGINATION */}

            {!loading && totalPages > 0 && (
              <div className="staff-notification-pagination">
                <button
                  disabled={currentPage === 1}
                  onClick={() =>
                    setCurrentPage((page) => Math.max(page - 1, 1))
                  }
                >
                  ‹
                </button>

                <span>{currentPage}</span>

                <button
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
        </div>
      </main>
    </div>
  );
}

export default StaffNotifications;
