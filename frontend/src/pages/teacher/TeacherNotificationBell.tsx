import "./TeacherNotificationBell.css";

import {
  useEffect,
  useState,
} from "react";

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

  const userId =
    sessionStorage.getItem("userId");


  const [
    showNotifications,
    setShowNotifications,
  ] = useState(false);


  const [
    notifications,
    setNotifications,
  ] = useState<TeacherNotification[]>([]);


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

        // กระดิ่งแสดงเฉพาะยังไม่อ่าน
        const unread =
          res.data.filter(
            (
              item: TeacherNotification,
            ) => item.is_read === 0,
          );

        setNotifications(unread);
      })
      .catch((err) => {
        console.log(
          "Get teacher notifications error:",
          err,
        );
      });

  }, [userId]);


  /* ==========================================
     CLICK NOTIFICATION
  ========================================== */

  const handleNotificationClick =
    async (
      item: TeacherNotification,
    ) => {

      try {

        if (item.is_read === 0) {

          await axios.put(
            `http://localhost:5000/notifications/${item.id}/read`,
          );

        }


        // เอาออกจากกระดิ่งทันที
        setNotifications(
          (prev) =>
            prev.filter(
              (notification) =>
                notification.id !==
                item.id,
            ),
        );


        setShowNotifications(false);


        // ถ้าเกี่ยวกับคำขอ
        // ไปหน้ารายละเอียดคำขอเลย
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


  return (

    <div className="teacher-notification-wrapper">

      {/* BELL */}

      <button
        type="button"
        className="teacher-notification-btn"
        onClick={() =>
          setShowNotifications(
            !showNotifications,
          )
        }
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

          <h4>
            การแจ้งเตือน
          </h4>


          {notifications.length === 0 ? (

            <div className="teacher-notification-empty">

              ไม่มีการแจ้งเตือน

            </div>

          ) : (

            notifications.map(
              (item) => (

                <div
                  key={item.id}
                  className="teacher-notification-item"
                  onClick={() =>
                    handleNotificationClick(
                      item,
                    )
                  }
                >

                  <p>
                    {
                      item.message.split(
                        "\n",
                      )[0]
                    }
                  </p>

                  <small>
                    {new Date(
                      item.created_at,
                    ).toLocaleString(
                      "th-TH",
                      {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      },
                    )}
                  </small>

                </div>

              ),
            )

          )}

        </div>

      )}

    </div>

  );
}


export default TeacherNotificationBell;