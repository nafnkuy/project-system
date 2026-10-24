import "./StudentNotificationBell.css";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { FaBell } from "react-icons/fa";
import { createPortal } from "react-dom";

/* =========================================================
   TYPE
========================================================= */

interface SystemNotification {
  id: number;

  message: string;

  is_read: number;

  request_id: number | null;

  project_id: number | null;

  created_at: string;
}

interface ProjectInvitation {
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

function StudentNotificationBell() {
  const navigate = useNavigate();

  const userId = sessionStorage.getItem("userId");

  /* =========================================================
     STATE
  ========================================================= */

  const [showNotifications, setShowNotifications] = useState(false);

  const [invitations, setInvitations] = useState<ProjectInvitation[]>([]);

  const [systemNotifications, setSystemNotifications] = useState<
    SystemNotification[]
  >([]);

  const [selectedInvitation, setSelectedInvitation] =
    useState<ProjectInvitation | null>(null);

  const [selectedSystemNotification, setSelectedSystemNotification] =
    useState<SystemNotification | null>(null);

  /* =========================================================
     LOAD PROJECT INVITATIONS
  ========================================================= */

  useEffect(() => {
    if (!userId) return;

    axios
      .get(`http://localhost:5000/project-invitations/${userId}`)
      .then((res) => {
        setInvitations(res.data);
      })
      .catch((err) => {
        console.log("Get project invitations error:", err);
      });
  }, [userId]);

  /* =========================================================
     LOAD SYSTEM NOTIFICATIONS
  ========================================================= */

  useEffect(() => {
    if (!userId) return;

    axios
      .get(`http://localhost:5000/notifications/${userId}`)
      .then((res) => {
        // กระดิ่งแสดงเฉพาะที่ยังไม่อ่าน
        const unread = res.data.filter(
          (item: SystemNotification) => Number(item.is_read) === 0,
        );

        setSystemNotifications(unread);
      })
      .catch((err) => {
        console.log("Get notifications error:", err);
      });
  }, [userId]);

  /* =========================================================
     OPEN SYSTEM NOTIFICATION
  ========================================================= */

  const handleSystemNotificationClick = async (item: SystemNotification) => {
    try {
      if (Number(item.is_read) === 0) {
        await axios.put(`http://localhost:5000/notifications/${item.id}/read`);
      }

      // เปิดรายละเอียดก่อน
      setSelectedSystemNotification({
        ...item,
        is_read: 1,
      });

      // แล้วเอาออกจากรายการบนกระดิ่ง
      setSystemNotifications((prev) =>
        prev.filter((notification) => notification.id !== item.id),
      );

      setShowNotifications(false);
    } catch (err) {
      console.log("Mark notification read error:", err);
    }
  };

  /* =========================================================
     ACCEPT INVITATION
  ========================================================= */

  const handleAcceptInvitation = async () => {
    if (!selectedInvitation) {
      return;
    }

    try {
      const res = await axios.post(
        `http://localhost:5000/project-invitations/${selectedInvitation.id}/accept`,
      );

      alert(res.data.message);

      // เอาคำเชิญออกจากกระดิ่ง
      setInvitations((prev) =>
        prev.filter((item) => item.id !== selectedInvitation.id),
      );

      setSelectedInvitation(null);

      setShowNotifications(false);
    } catch (err: any) {
      console.log("Accept invitation error:", err);

      alert(err.response?.data?.message || "ไม่สามารถตอบรับคำเชิญได้");
    }
  };

  /* =========================================================
     REJECT INVITATION
  ========================================================= */

  const handleRejectInvitation = async () => {
    if (!selectedInvitation) {
      return;
    }

    try {
      const res = await axios.post(
        `http://localhost:5000/project-invitations/${selectedInvitation.id}/reject`,
      );

      alert(res.data.message);

      setInvitations((prev) =>
        prev.filter((item) => item.id !== selectedInvitation.id),
      );

      setSelectedInvitation(null);

      setShowNotifications(false);
    } catch (err: any) {
      console.log("Reject invitation error:", err);

      alert(err.response?.data?.message || "ไม่สามารถปฏิเสธคำเชิญได้");
    }
  };

  /* =========================================================
     COUNT
  ========================================================= */

  const notificationCount = invitations.length + systemNotifications.length;

  const notificationMessage = selectedSystemNotification?.message || "";
  const isInvitationReply =
    notificationMessage.includes("ตอบรับคำเชิญ") ||
    notificationMessage.includes("ปฏิเสธคำเชิญ");
  const isRevision =
    notificationMessage.includes("ต้องแก้ไข") ||
    notificationMessage.includes("แก้ไขเพิ่มเติม");
  const systemPopupTitle = isInvitationReply
    ? "การตอบกลับคำเชิญเข้าร่วมโครงงาน"
    : "ผลการพิจารณาโครงงาน";

  /* =========================================================
     RENDER
  ========================================================= */

  return (
    <>
      <div className="student-notification-wrapper">
        {/* BELL */}

        <button
          type="button"
          className="student-notification-btn"
          onClick={async () => {
            if (!showNotifications && userId) {
              try {
                const [invitationResponse, notificationResponse] =
                  await Promise.all([
                    axios.get(
                      `http://localhost:5000/project-invitations/${userId}`,
                    ),
                    axios.get(`http://localhost:5000/notifications/${userId}`),
                  ]);
                setInvitations(invitationResponse.data);
                setSystemNotifications(
                  notificationResponse.data.filter(
                    (item: SystemNotification) => Number(item.is_read) === 0,
                  ),
                );
              } catch (error) {
                console.error("Refresh notifications error:", error);
              }
            }
            setShowNotifications((current) => !current);
          }}
        >
          <FaBell />

          {notificationCount > 0 && (
            <span className="student-notification-count">
              {notificationCount}
            </span>
          )}
        </button>

        {/* =============================================
            DROPDOWN
        ============================================= */}

        {showNotifications && (
          <div className="student-notification-dropdown">
            <h4>การแจ้งเตือน</h4>

            {/* PROJECT INVITATION */}

            {invitations.map((item) => (
              <div
                key={`invitation-${item.id}`}
                className="student-notification-item"
                onClick={() => {
                  setSelectedInvitation(item);

                  setShowNotifications(false);
                }}
              >
                <p>{item.sender_name} ได้เชิญคุณเข้าร่วมโครงงาน</p>

                <small>{item.created_at}</small>
              </div>
            ))}

            {/* SYSTEM NOTIFICATION */}

            {systemNotifications.map((item) => (
              <div
                key={`system-${item.id}`}
                className="student-notification-item"
                onClick={() => handleSystemNotificationClick(item)}
              >
                <p>{item.message.split("\n")[0]}</p>

                <small>{item.created_at}</small>
              </div>
            ))}

            {/* EMPTY */}

            {notificationCount === 0 && (
              <div className="student-notification-empty">
                ไม่มีการแจ้งเตือน
              </div>
            )}
          </div>
        )}
      </div>

      {/* =====================================================
          INVITATION POPUP
      ===================================================== */}
      {createPortal(
        <>
      {selectedInvitation && (
        <div
          className="student-notification-overlay"
          onClick={() => setSelectedInvitation(null)}
        >
          <div
            className="student-notification-popup invitation-notification-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="student-invitation-popup-title"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 id="student-invitation-popup-title">
              คำเชิญเข้าร่วมโครงงาน
            </h3>

            <div className="student-notification-divider" />

            <div className="student-invitation-detail">
              <span className="student-invitation-label">
                ชื่อหัวข้อโครงงาน
              </span>
              <p className="student-invitation-value">
                {selectedInvitation.title}
              </p>
            </div>

            <div className="student-invitation-detail">
              <span className="student-invitation-label">
                สมาชิกคนที่ 1
              </span>
              <p className="student-invitation-value">
                {selectedInvitation.sender_username}{" "}
                {selectedInvitation.sender_name}
              </p>
            </div>

            <div className="student-invitation-detail student-invitation-last">
              <span className="student-invitation-label">
                สมาชิกคนที่ 2
              </span>
              <p className="student-invitation-value">
                {selectedInvitation.receiver_username}{" "}
                {selectedInvitation.receiver_name}
              </p>
            </div>

            <div className="student-notification-divider student-invitation-divider" />

            <p className="student-notification-question">
              คุณต้องการเข้าร่วมโครงงานนี้หรือไม่
            </p>

            <div className="student-notification-actions">
              <button
                type="button"
                className="student-notification-reject"
                onClick={handleRejectInvitation}
              >
                ปฏิเสธ
              </button>

              <button
                type="button"
                className="student-notification-accept"
                onClick={handleAcceptInvitation}
              >
                ตกลง
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================
          SYSTEM NOTIFICATION POPUP
      ===================================================== */}
      {selectedSystemNotification && (
        <div
          className="student-notification-overlay"
          onClick={() => setSelectedSystemNotification(null)}
        >
          <div
            className="student-notification-popup system-notification-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="student-system-notification-title"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 id="student-system-notification-title">{systemPopupTitle}</h3>
            <div className="student-notification-divider" />

            <div className="student-notification-message">
              {isInvitationReply && notificationMessage.includes('"') ? (
                <>
                  <p className="notification-reply-text">
                    {notificationMessage.split('"')[0].trim()}
                  </p>

                  <div className="notification-project-info">
                    <span className="notification-project-label">
                      ชื่อหัวข้อโครงงาน
                    </span>

                    <p className="notification-project-title">
                      {notificationMessage.split('"')[1]}
                    </p>
                  </div>
                </>
              ) : (
                <p className="notification-reply-text">
                  {selectedSystemNotification.message}
                </p>
              )}
            </div>

            <div className="student-notification-actions">
              <button
                type="button"
                className="student-notification-confirm"
                onClick={() => setSelectedSystemNotification(null)}
              >
                ตกลง
              </button>
              {isRevision &&
                !isInvitationReply &&
                selectedSystemNotification.project_id != null &&
                selectedSystemNotification.request_id != null && (
                  <button
                    type="button"
                    className="student-notification-accept"
                    onClick={() => {
                      navigate(
                        `/submit-new-project?mode=resubmit&projectId=${selectedSystemNotification.project_id}&requestId=${selectedSystemNotification.request_id}`,
                      );
                      setSelectedSystemNotification(null);
                    }}
                  >
                    แก้ไขและส่งใหม่
                  </button>
                )}
            </div>
          </div>
        </div>
      )}
        </>,
        document.body,
      )}
    </>
  );
}

export default StudentNotificationBell;
