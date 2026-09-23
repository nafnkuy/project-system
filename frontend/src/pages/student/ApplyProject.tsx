import "./ApplyProject.css";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import { FaBell } from "react-icons/fa";
import logo from "../../assets/Logo.svg";

interface Project {
  id: number;

  title: string;

  advisor: string;

  advisor_name: string;

  max_members: number;

  current_members: number;
}

function ApplyProject() {
  const navigate = useNavigate();

  const { id } = useParams();

  const [project, setProject] = useState<Project | null>(null);

  const [showNotifications, setShowNotifications] = useState(false);

  const [contactType, setContactType] = useState("");

  const [contactValue, setContactValue] = useState("");

  const [introduction, setIntroduction] = useState("");

  const [showPopup, setShowPopup] = useState(false);

  const [popupType, setPopupType] = useState<"loading" | "success" | "error">(
    "loading",
  );

  const [popupMessage, setPopupMessage] = useState("");

  const [isSubmitted, setIsSubmitted] = useState(false);

  const [hasPendingRequest, setHasPendingRequest] = useState(false);

  const userId = sessionStorage.getItem("userId");

  const username = sessionStorage.getItem("username");

  const name = sessionStorage.getItem("name");

  const profileImage = sessionStorage.getItem("profileImage");

  const notifications = [
    {
      id: 1,

      message: "อาจารย์ตอบรับหัวข้อของคุณแล้ว",

      time: "2 ชั่วโมงที่แล้ว",
    },

    {
      id: 2,

      message: "ส่งคำขอเลือกหัวข้อสำเร็จ",

      time: "1 วันที่แล้ว",
    },
  ];

  const handleLogout = () => {
    sessionStorage.removeItem("userId");

    sessionStorage.removeItem("username");

    sessionStorage.removeItem("name");

    sessionStorage.removeItem("profileImage");

    sessionStorage.removeItem("major");

    navigate("/");
  };

  useEffect(() => {
    axios
      .get(`http://localhost:5000/projects/${id}`)
      .then((res) => {
        console.log("Project Detail =", res.data);

        setProject(res.data);
      })
      .catch((err) => {
        console.log("Get project error:", err);
      });
  }, [id]);

  useEffect(() => {
    if (!project?.id || !userId) {
      return;
    }

    axios
      .get(
        `http://localhost:5000/project-requests/check/${project.id}/${userId}`,
      )
      .then((res) => {
        setIsSubmitted(res.data.submitted);
      })
      .catch((err) => {
        console.log("Check submitted error:", err);
      });
  }, [project, userId]);

  useEffect(() => {
    if (!project?.id || !userId) {
      return;
    }

    axios
      .get(`http://localhost:5000/project-requests/${project.id}/${userId}`)
      .then((res) => {
        setContactType(res.data.contact_type || "");

        setContactValue(res.data.contact_value || "");

        setIntroduction(res.data.introduction || "");
      })
      .catch(() => {
        /* ถ้ายังไม่มีข้อมูลคำขอ ไม่ต้องทำอะไร */
      });
  }, [project, userId]);

  useEffect(() => {
    if (!userId) {
      return;
    }

    axios
      .get(`http://localhost:5000/project-requests/student/${userId}`)
      .then((res) => {
        setHasPendingRequest(res.data.hasPending);
      })
      .catch((err) => {
        console.log("Check pending request error:", err);
      });
  }, [userId]);

  const handleSubmit = async () => {
    if (!contactType || !contactValue) {
      alert("กรุณากรอกข้อมูลให้ครบ");

      return;
    }

    try {
      /* ---------- Loading ---------- */

      setPopupType("loading");

      setShowPopup(true);

      /* ---------- POST ---------- */

      await axios.post("http://localhost:5000/project-requests", {
        project_id: project?.id,

        student_id: Number(userId),

        contact_type: contactType,

        contact_value: contactValue,

        introduction: introduction,
      });

      /* ---------- Success ---------- */

      setPopupType("success");

      setIsSubmitted(true);

      setHasPendingRequest(true);
    } catch (err: any) {
      console.log("Submit project request error:", err);

      /* ---------- Error ---------- */

      setPopupType("error");

      setPopupMessage(
        err.response?.data?.message ||
          "ไม่สามารถส่งใบสมัครได้ กรุณาลองใหม่อีกครั้ง",
      );
    }
  };

  return (
    <div className="student-apply-project-page">
      <aside className="sidebar">
        {/* LOGO */}

        <div className="logo">
          <img src={logo} alt="SPTC Logo" />

          <div>
            <h2>SPTC System</h2>

            <p>ระบบติดตามและสื่อสารโครงงานนิสิต</p>
          </div>
        </div>

        {/* MENU */}

        <nav>
          <ul>
            <li className="active" onClick={() => navigate("/StudentHome")}>
              หน้าหลัก
            </li>

            <li>รายชื่ออาจารย์</li>

            <li onClick={() => navigate("/submit-new-project")}>
              ส่งคำเสนอโครงงานใหม่
            </li>

            <li>โครงงานของฉัน</li>

            <li>การแจ้งเตือน</li>

            <li>ข้อมูลส่วนตัว</li>
          </ul>
        </nav>

        {/* LOGOUT */}

        <button className="logout-btn" onClick={handleLogout}>
          ออกจากระบบ
        </button>
      </aside>

      <main className="main">
        <header className="header">
          {/* BREADCRUMB */}

          <div className="breadcrumb">
            <span
              onClick={() => navigate("/StudentHome")}
              style={{
                cursor: "pointer",
              }}
            >
              หน้าหลัก
            </span>

            <span>&gt;</span>

            <span
              onClick={() => navigate(-1)}
              style={{
                cursor: "pointer",
              }}
            >
              รายละเอียดโครงงาน
            </span>

            <span>&gt;</span>

            <span>สมัครเข้าร่วมโครงงาน</span>
          </div>

          {/* HEADER RIGHT */}

          <div className="header-right">
            {/* NOTIFICATION */}

            <div className="notification-box">
              <div className="notification-wrapper">
                <button
                  className="notification-btn"
                  onClick={() => setShowNotifications(!showNotifications)}
                >
                  <FaBell />

                  {notifications.length > 0 && (
                    <span className="notification-count">
                      {notifications.length}
                    </span>
                  )}
                </button>

                {/* DROPDOWN */}

                {showNotifications && (
                  <div className="notification-dropdown">
                    <h4>การแจ้งเตือน</h4>

                    {notifications.map((item) => (
                      <div key={item.id} className="notification-item">
                        <p>{item.message}</p>

                        <small>{item.time}</small>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* USER */}

            <div className="user-info">
              <img
                src={
                  profileImage ? `http://localhost:5000${profileImage}` : logo
                }
                className="profile-image"
                alt="Profile"
              />

              <span>{username}</span>
            </div>
          </div>
        </header>

        <div className="apply-card">
          <h2>สมัครเข้าร่วมโครงงาน</h2>

          <div className="section">
            <h3>ข้อมูลโครงงาน</h3>

            <p>
              <strong>ชื่อโครงงาน :</strong> {project?.title || "-"}
            </p>

            <p>
              <strong>อาจารย์ที่ปรึกษา :</strong>{" "}
              {project?.advisor_name || project?.advisor || "-"}
            </p>

            <p>
              <strong>รับนิสิต :</strong> {project?.current_members ?? 0} /{" "}
              {project?.max_members ?? 0} คน
            </p>
          </div>

          <div className="apply-row">
            <div className="section">
              <h3>ข้อมูลผู้สมัคร</h3>

              <label>รหัสประจำตัว</label>

              <input value={username || ""} disabled />

              <label>ชื่อ</label>

              <input value={name || ""} disabled />
            </div>

            <div className="section">
              <h3>
                ช่องทางการติดต่อ
                <span style={{ color: "red" }}> *</span>
              </h3>

              {/* ================= ช่องทางการติดต่อ ================= */}

              <div className="apply-select-wrapper">
                <select
                  value={contactType}
                  onChange={(e) => {
                    setContactType(e.target.value);
                    setContactValue("");
                  }}
                  disabled={isSubmitted}
                >
                  <option value="">เลือกช่องทางการติดต่อ</option>
                  <option value="Email">Email</option>
                  <option value="Line ID">Line ID</option>
                  <option value="Facebook">Facebook</option>
                  <option value="Discord">Discord</option>
                  <option value="Instagram">Instagram</option>
                  <option value="เบอร์โทรศัพท์">เบอร์โทรศัพท์</option>
                </select>

                <span className="apply-select-arrow">▼</span>
              </div>

              {/* ================= ช่องกรอกข้อมูล ================= */}

              {contactType !== "" && (
                <>
                  <label>{contactType}</label>

                  <input
                    type={
                      contactType === "Email"
                        ? "email"
                        : contactType === "เบอร์โทรศัพท์"
                          ? "tel"
                          : "text"
                    }
                    value={contactValue}
                    onChange={(e) => setContactValue(e.target.value)}
                    placeholder={
                      contactType === "Email"
                        ? "กรอกอีเมล เช่น 66160001@go.buu.ac.th"
                        : contactType === "Line ID"
                          ? "กรอก Line ID"
                          : contactType === "Facebook"
                            ? "กรอกชื่อบัญชีหรือ URL Facebook"
                            : contactType === "Discord"
                              ? "กรอกชื่อผู้ใช้ Discord"
                              : contactType === "Instagram"
                                ? "กรอกชื่อผู้ใช้ Instagram"
                                : contactType === "เบอร์โทรศัพท์"
                                  ? "กรอกเบอร์โทรศัพท์"
                                  : ""
                    }
                    disabled={isSubmitted}
                  />
                </>
              )}
            </div>
          </div>

          <div className="section">
            <h3>เหตุผลในการสมัครเข้าร่วมโครงงาน</h3>

            <textarea
              value={introduction}
              onChange={(e) => setIntroduction(e.target.value)}
              placeholder="กรุณาระบุเหตุผลที่ต้องการสมัครเข้าร่วมโครงงานนี้"
              disabled={isSubmitted}
            />
          </div>

          <div className="button-group">
            {isSubmitted ? (
              <button className="submit-btn" disabled>
                ✓ ส่งใบสมัครแล้ว
              </button>
            ) : (
              <>
                {/* CANCEL */}

                <button
                  type="button"
                  className="cancel-btn"
                  onClick={() => navigate(-1)}
                >
                  ยกเลิก
                </button>

                {/* SUBMIT */}

                <button
                  type="button"
                  className="submit-btn"
                  disabled={!contactType || !contactValue || hasPendingRequest}
                  onClick={handleSubmit}
                >
                  {hasPendingRequest
                    ? "มีใบสมัครที่กำลังรอพิจารณา"
                    : "ส่งคำขอสมัครเข้าร่วมโครงงาน"}
                </button>
              </>
            )}
          </div>
        </div>
      </main>

      {showPopup && (
        <div className="popup-overlay">
          <div className="popup-card">
            {popupType === "loading" && (
              <>
                <div className="loader"></div>

                <h3 className="popup-title">กำลังส่งใบสมัคร</h3>

                <div className="popup-divider"></div>

                <p className="popup-message">กรุณารอสักครู่</p>
              </>
            )}

            {popupType === "success" && (
              <>
                <div className="popup-status-icon success">✓</div>

                <h3 className="popup-title">ส่งใบสมัครสำเร็จ</h3>

                <div className="popup-divider"></div>

                <p className="popup-message">
                  ใบสมัครของคุณถูกส่งไปยังอาจารย์แล้ว
                  <br />
                  กรุณารอการพิจารณา
                </p>

                <button
                  type="button"
                  className="popup-action-btn success-btn"
                  onClick={() => setShowPopup(false)}
                >
                  ตกลง
                </button>
              </>
            )}

            {popupType === "error" && (
              <>
                <div className="popup-status-icon error">!</div>

                <h3 className="popup-title">ไม่สามารถส่งใบสมัครได้</h3>

                <div className="popup-divider"></div>

                <p className="popup-message">{popupMessage}</p>

                <button
                  type="button"
                  className="popup-action-btn error-btn"
                  onClick={() => setShowPopup(false)}
                >
                  ปิด
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default ApplyProject;
