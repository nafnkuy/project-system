import "./TeacherNotificationBell.css";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { FaBell } from "react-icons/fa";

interface TeacherNotification {
  id: number;
  message: string;
  is_read: number;
  request_id: number | null;
  project_id: number | null;
  created_at: string;
}

function TeacherNotificationBell() {
  const navigate = useNavigate();
  const userId = sessionStorage.getItem("userId");

  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState<TeacherNotification[]>([]);

  /* =========================================
     LOAD NOTIFICATIONS
  ========================================= */
  useEffect(() => {
    if (!userId) {
      setNotifications([]);
      return;
    }

    let active = true;

    axios
      .get(`http://localhost:5000/notifications/${userId}`)
      .then((res) => {
        if (!active) return;

        const data: TeacherNotification[] = Array.isArray(res.data)
          ? res.data
          : [];

        // กระดิ่งแสดงเฉพาะรายการที่ยังไม่ได้อ่าน
        setNotifications(
          data.filter((item) => Number(item.is_read) === 0),
        );
      })
      .catch((err) => {
        console.log("Get teacher notifications error:", err);
      });

    return () => {
      active = false;
    };
  }, [userId]);

  /* =========================================
     REFRESH WHEN OPENING BELL
  ========================================= */
  const handleBellClick = async () => {
    const willOpen = !showNotifications;
    setShowNotifications(willOpen);

    if (!willOpen || !userId) return;

    try {
      const res = await axios.get(
        `http://localhost:5000/notifications/${userId}`,
      );

      const data: TeacherNotification[] = Array.isArray(res.data)
        ? res.data
        : [];

      setNotifications(data.filter((item) => Number(item.is_read) === 0));
    } catch (err) {
      console.log("Refresh teacher notifications error:", err);
    }
  };

  /* =========================================
     CLICK NOTIFICATION
  ========================================= */
  const handleNotificationClick = async (item: TeacherNotification) => {
    try {
      if (Number(item.is_read) === 0) {
        await axios.put(
          `http://localhost:5000/notifications/${item.id}/read`,
        );
      }

      // ซ่อนรายการที่อ่านแล้วออกจากกระดิ่ง
      setNotifications((prev) =>
        prev.filter((notification) => notification.id !== item.id),
      );
      setShowNotifications(false);

      // แจ้งเตือนเกี่ยวกับคำขอ: ไปหน้ารายละเอียดคำขอ
      if (item.request_id != null) {
        navigate(`/teacher-request-details/${item.request_id}`);
      }
    } catch (err) {
      console.log("Open teacher notification error:", err);
    }
  };

  /* =========================================
     FORMAT DATE (ใช้รูปแบบเดิมของอาจารย์)
  ========================================= */
  const formatNotificationDate = (value: string) => {
    if (!value) return "-";

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;

    return date.toLocaleString("th-TH", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="teacher-notification-wrapper">
      {/* BELL */}
      <button
        type="button"
        className="teacher-notification-btn"
        aria-label="การแจ้งเตือน"
        aria-expanded={showNotifications}
        onClick={handleBellClick}
      >
        <FaBell />
        {notifications.length > 0 && (
          <span className="teacher-notification-count">
            {notifications.length}
          </span>
        )}
      </button>

      {/* DROPDOWN */}
      {showNotifications && (
        <div className="teacher-notification-dropdown">
          <h4>การแจ้งเตือน</h4>

          {notifications.length === 0 ? (
            <div className="teacher-notification-empty">
              ไม่มีการแจ้งเตือน
            </div>
          ) : (
            notifications.map((item) => (
              <div
                key={item.id}
                className="teacher-notification-item"
                onClick={() => handleNotificationClick(item)}
              >
                <p>{item.message.split("\n")[0]}</p>
                <small>{formatNotificationDate(item.created_at)}</small>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}

export default TeacherNotificationBell;
