import "./StudentNotificationBell.css";

import {
  useEffect,
  useState,
} from "react";

import { useNavigate } from "react-router-dom";

import axios from "axios";

import { FaBell } from "react-icons/fa";


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

  const userId =
    sessionStorage.getItem("userId");


  /* =========================================================
     STATE
  ========================================================= */

  const [
    showNotifications,
    setShowNotifications,
  ] = useState(false);


  const [
    invitations,
    setInvitations,
  ] = useState<ProjectInvitation[]>([]);


  const [
    systemNotifications,
    setSystemNotifications,
  ] = useState<SystemNotification[]>([]);


  const [
    selectedInvitation,
    setSelectedInvitation,
  ] = useState<ProjectInvitation | null>(
    null,
  );


  const [
    selectedSystemNotification,
    setSelectedSystemNotification,
  ] = useState<SystemNotification | null>(
    null,
  );


  /* =========================================================
     LOAD PROJECT INVITATIONS
  ========================================================= */

  useEffect(() => {
    if (!userId) return;

    axios
      .get(
        `http://localhost:5000/project-invitations/${userId}`,
      )
      .then((res) => {
        setInvitations(res.data);
      })
      .catch((err) => {
        console.log(
          "Get project invitations error:",
          err,
        );
      });
  }, [userId]);


  /* =========================================================
     LOAD SYSTEM NOTIFICATIONS
  ========================================================= */

  useEffect(() => {
    if (!userId) return;

    axios
      .get(
        `http://localhost:5000/notifications/${userId}`,
      )
      .then((res) => {

        // กระดิ่งแสดงเฉพาะที่ยังไม่อ่าน
        const unread =
          res.data.filter(
            (
              item: SystemNotification,
            ) => item.is_read === 0,
          );

        setSystemNotifications(unread);
      })
      .catch((err) => {
        console.log(
          "Get notifications error:",
          err,
        );
      });

  }, [userId]);


  /* =========================================================
     OPEN SYSTEM NOTIFICATION
  ========================================================= */

  const handleSystemNotificationClick =
    async (
      item: SystemNotification,
    ) => {

      try {

        if (item.is_read === 0) {
          await axios.put(
            `http://localhost:5000/notifications/${item.id}/read`,
          );
        }


        // เปิดรายละเอียดก่อน
        setSelectedSystemNotification({
          ...item,
          is_read: 1,
        });


        // แล้วเอาออกจากรายการบนกระดิ่ง
        setSystemNotifications(
          (prev) =>
            prev.filter(
              (notification) =>
                notification.id !==
                item.id,
            ),
        );


        setShowNotifications(false);

      } catch (err) {

        console.log(
          "Mark notification read error:",
          err,
        );

      }
    };


  /* =========================================================
     ACCEPT INVITATION
  ========================================================= */

  const handleAcceptInvitation =
    async () => {

      if (!selectedInvitation) {
        return;
      }

      try {

        const res = await axios.post(
          `http://localhost:5000/project-invitations/${selectedInvitation.id}/accept`,
        );

        alert(res.data.message);


        // เอาคำเชิญออกจากกระดิ่ง
        setInvitations(
          (prev) =>
            prev.filter(
              (item) =>
                item.id !==
                selectedInvitation.id,
            ),
        );


        setSelectedInvitation(null);

        setShowNotifications(false);

      } catch (err: any) {

        console.log(
          "Accept invitation error:",
          err,
        );

        alert(
          err.response?.data?.message ||
            "ไม่สามารถตอบรับคำเชิญได้",
        );

      }
    };


  /* =========================================================
     REJECT INVITATION
  ========================================================= */

  const handleRejectInvitation =
    async () => {

      if (!selectedInvitation) {
        return;
      }

      try {

        const res = await axios.post(
          `http://localhost:5000/project-invitations/${selectedInvitation.id}/reject`,
        );

        alert(res.data.message);


        setInvitations(
          (prev) =>
            prev.filter(
              (item) =>
                item.id !==
                selectedInvitation.id,
            ),
        );


        setSelectedInvitation(null);

        setShowNotifications(false);

      } catch (err: any) {

        console.log(
          "Reject invitation error:",
          err,
        );

        alert(
          err.response?.data?.message ||
            "ไม่สามารถปฏิเสธคำเชิญได้",
        );

      }
    };


  /* =========================================================
     COUNT
  ========================================================= */

  const notificationCount =
    invitations.length +
    systemNotifications.length;


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
          onClick={() =>
            setShowNotifications(
              !showNotifications,
            )
          }
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
                  key={`system-${item.id}`}
                  className="student-notification-item"
                  onClick={() =>
                    handleSystemNotificationClick(
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
                    {item.created_at}
                  </small>

                </div>

              ),
            )}


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

      {selectedInvitation && (

        <div
          className="student-notification-overlay"
          onClick={() =>
            setSelectedInvitation(null)
          }
        >

          <div
            className="student-notification-popup"
            onClick={(e) =>
              e.stopPropagation()
            }
          >

            <h3>
              คำเชิญเข้าร่วมโครงงาน
            </h3>


            <div className="student-notification-divider" />


            <p>
              <strong>
                ชื่อโครงงาน
              </strong>
            </p>

            <p>
              {selectedInvitation.title}
            </p>


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


            <div className="student-notification-divider" />


            <p className="student-notification-question">
              คุณต้องการเข้าร่วมโครงงานนี้หรือไม่
            </p>


            <div className="student-notification-actions">

              <button
                className="student-notification-reject"
                onClick={
                  handleRejectInvitation
                }
              >
                ปฏิเสธ
              </button>


              <button
                className="student-notification-accept"
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


      {/* =====================================================
          SYSTEM NOTIFICATION POPUP
      ===================================================== */}

      {selectedSystemNotification && (

        <div
          className="student-notification-overlay"
          onClick={() =>
            setSelectedSystemNotification(
              null,
            )
          }
        >

          <div
            className="student-notification-popup"
            onClick={(e) =>
              e.stopPropagation()
            }
          >

            <h3>
              ผลการพิจารณาโครงงาน
            </h3>


            <div className="student-notification-divider" />


            <div className="student-notification-message">
              {
                selectedSystemNotification.message
              }
            </div>


            <div className="student-notification-divider" />


            <div className="student-notification-actions">

              <button
                className="student-notification-reject"
                onClick={() =>
                  setSelectedSystemNotification(
                    null,
                  )
                }
              >
                ปิด
              </button>


              {/* ถ้าเป็นคำขอให้แก้ไข */}

              {selectedSystemNotification.message.includes(
                "แก้ไข",
              ) &&
                selectedSystemNotification.project_id &&
                selectedSystemNotification.request_id && (

                  <button
                    className="student-notification-accept"
                    onClick={() => {

                      navigate(
                        `/submit-new-project?mode=resubmit&projectId=${selectedSystemNotification.project_id}&requestId=${selectedSystemNotification.request_id}`,
                      );

                      setSelectedSystemNotification(
                        null,
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

    </>
  );
}


export default StudentNotificationBell;