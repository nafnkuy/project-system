import "./TeacherNotificationBell.css";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { FaBell } from "react-icons/fa";
import { createPortal } from "react-dom";

interface TeacherNotification {
  id: number;
  message: string;
  is_read: number;
  request_id: number | null;
  project_id: number | null;
  created_at: string;
}

/* =========================================
   EXAM COMMITTEE INVITATION
========================================= */

interface ExamInvitation {
  invitation_id: number;
  schedule_id: number;
  teacher_id: number;
  invitation_status: string;
  invited_at: string;

  project_id: number;
  project_title: string;

  exam_date: string;
  start_time: string;
  end_time: string;
  location: string;

  advisor_name: string;
}

function TeacherNotificationBell() {
  const navigate = useNavigate();
  const userId = sessionStorage.getItem("userId");

  const [showNotifications, setShowNotifications] = useState(false);

  const [notifications, setNotifications] = useState<TeacherNotification[]>([]);

  const [examInvitations, setExamInvitations] = useState<ExamInvitation[]>([]);

  const [respondingInvitationId, setRespondingInvitationId] = useState<
    number | null
  >(null);

  const [invitationFeedback, setInvitationFeedback] = useState("");

  const [selectedExamInvitation, setSelectedExamInvitation] =
    useState<ExamInvitation | null>(null);

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
        setNotifications(data.filter((item) => Number(item.is_read) === 0));
      })
      .catch((err) => {
        console.log("Get teacher notifications error:", err);
      });

    return () => {
      active = false;
    };
  }, [userId]);

  /* =========================================
   LOAD EXAM INVITATIONS
========================================= */

  useEffect(() => {
    if (!userId) {
      setExamInvitations([]);
      return;
    }

    let active = true;

    axios
      .get(`http://localhost:5000/teacher/exam/invitations/${userId}`)
      .then((res) => {
        if (!active) return;

        const data: ExamInvitation[] = Array.isArray(res.data.invitations)
          ? res.data.invitations
          : [];

        setExamInvitations(data);
      })
      .catch((err) => {
        console.log("Get exam invitations error:", err);
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

    setInvitationFeedback("");

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

    try {
      const res = await axios.get(
        `http://localhost:5000/teacher/exam/invitations/${userId}`,
      );

      const data: ExamInvitation[] = Array.isArray(res.data.invitations)
        ? res.data.invitations
        : [];

      setExamInvitations(data);
    } catch (err) {
      console.log("Refresh exam invitations error:", err);
    }
  };

  /* =========================================
     CLICK NOTIFICATION
  ========================================= */
  const handleNotificationClick = async (item: TeacherNotification) => {
    try {
      if (Number(item.is_read) === 0) {
        await axios.put(`http://localhost:5000/notifications/${item.id}/read`);
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
   RESPOND TO EXAM INVITATION
========================================= */

  const handleExamInvitationResponse = async (
    invitationId: number,
    decision: "ตอบรับ" | "ปฏิเสธ",
  ) => {
    if (!userId || respondingInvitationId !== null) return;

    try {
      setRespondingInvitationId(invitationId);
      setInvitationFeedback("");

      await axios.post(
        `http://localhost:5000/teacher/exam/invitations/${invitationId}/respond`,
        {
          teacher_id: Number(userId),
          decision: decision,
        },
      );

      // เอาคำเชิญที่ตอบแล้วออกจากรายการรอตอบรับ
      setExamInvitations((prev) =>
        prev.filter((item) => item.invitation_id !== invitationId),
      );

      setInvitationFeedback("");
      setSelectedExamInvitation(null);
      setShowNotifications(false);
    } catch (err) {
      console.log("Respond exam invitation error:", err);
      setInvitationFeedback("ไม่สามารถบันทึกคำตอบได้ กรุณาลองอีกครั้ง");
    } finally {
      setRespondingInvitationId(null);
    }
  };

  /* =========================================
   FORMAT EXAM DATE
========================================= */

  const formatExamDate = (value: string) => {
    if (!value) return "-";

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) return "-";

    return date.toLocaleDateString("th-TH", {
      timeZone: "Asia/Bangkok",
      day: "numeric",
      month: "short",
      year: "numeric",
    });
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
        {notifications.length + examInvitations.length > 0 && (
          <span className="teacher-notification-count">
            {notifications.length + examInvitations.length}
          </span>
        )}
      </button>

      {/* DROPDOWN */}
      {showNotifications && (
        <div className="teacher-notification-dropdown">
          <h4>การแจ้งเตือน</h4>

          {invitationFeedback && (
            <div className="teacher-exam-feedback" role="status">
              {invitationFeedback}
            </div>
          )}

          {notifications.length === 0 && examInvitations.length === 0 ? (
            <div className="teacher-notification-empty">ไม่มีการแจ้งเตือน</div>
          ) : (
            <>
              {/* คำเชิญกรรมการสอบ */}
              {examInvitations.map((invitation) => (
                <button
                  key={`exam-${invitation.invitation_id}`}
                  type="button"
                  className="teacher-exam-invitation-preview"
                  onClick={() => {
                    setInvitationFeedback("");
                    setSelectedExamInvitation(invitation);
                    setShowNotifications(false);
                  }}
                >
                  <div className="teacher-exam-preview-header">
                    <strong>คำเชิญเป็นกรรมการสอบ</strong>
                    <span>รอตอบรับ</span>
                  </div>

                  <p>{invitation.project_title}</p>

                  <small>{formatNotificationDate(invitation.invited_at)}</small>
                </button>
              ))}

              {/* การแจ้งเตือนเดิม */}
              {notifications.map((item) => (
                <div
                  key={`notification-${item.id}`}
                  className="teacher-notification-item"
                  onClick={() => handleNotificationClick(item)}
                >
                  <p>{item.message.split("\n")[0]}</p>
                  <small>{formatNotificationDate(item.created_at)}</small>
                </div>
              ))}
            </>
          )}
        </div>
      )}

      {/* EXAM INVITATION POPUP */}
      {selectedExamInvitation &&
        createPortal(
          <div
            className="teacher-exam-popup-overlay"
            onClick={() => {
              if (respondingInvitationId === null) {
                setSelectedExamInvitation(null);
              }
            }}
          >
            <div
              className="teacher-exam-popup"
              role="dialog"
              aria-modal="true"
              aria-labelledby="teacher-exam-popup-title"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 id="teacher-exam-popup-title">รายละเอียดคำเชิญกรรมการสอบ</h3>

              <div className="teacher-exam-popup-divider" />

              <div className="teacher-exam-popup-content">
                <h4>{selectedExamInvitation.project_title}</h4>

                <p>
                  <strong>ผู้เชิญ :</strong>{" "}
                  {selectedExamInvitation.advisor_name}
                </p>

                <p>
                  <strong>วันที่สอบ :</strong>{" "}
                  {formatExamDate(selectedExamInvitation.exam_date)}
                </p>

                <p>
                  <strong>เวลา :</strong>{" "}
                  {selectedExamInvitation.start_time?.slice(0, 5)}
                  {" - "}
                  {selectedExamInvitation.end_time?.slice(0, 5)} น.
                </p>

                <p>
                  <strong>สถานที่สอบ :</strong>{" "}
                  {selectedExamInvitation.location}
                </p>

                <p>
                  <strong>สถานะ :</strong>{" "}
                  <span className="teacher-exam-popup-status">รอตอบรับ</span>
                </p>

                {invitationFeedback && (
                  <p className="teacher-exam-popup-error" role="alert">
                    {invitationFeedback}
                  </p>
                )}
              </div>

              <div className="teacher-exam-popup-actions">
                <button
                  type="button"
                  className="teacher-exam-popup-back"
                  disabled={respondingInvitationId !== null}
                  onClick={() => setSelectedExamInvitation(null)}
                >
                  กลับ
                </button>

                <button
                  type="button"
                  className="teacher-exam-popup-reject"
                  disabled={respondingInvitationId !== null}
                  onClick={() =>
                    handleExamInvitationResponse(
                      selectedExamInvitation.invitation_id,
                      "ปฏิเสธ",
                    )
                  }
                >
                  ปฏิเสธ
                </button>

                <button
                  type="button"
                  className="teacher-exam-popup-accept"
                  disabled={respondingInvitationId !== null}
                  onClick={() =>
                    handleExamInvitationResponse(
                      selectedExamInvitation.invitation_id,
                      "ตอบรับ",
                    )
                  }
                >
                  {respondingInvitationId ===
                  selectedExamInvitation.invitation_id
                    ? "กำลังบันทึก..."
                    : "ตอบรับ"}
                </button>
              </div>
            </div>
          </div>,
          document.body,
        )}
    </div>
  );
}

export default TeacherNotificationBell;
