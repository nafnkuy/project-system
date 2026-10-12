import "./StaffProfile.css";

import {
  useEffect,
  useState,
} from "react";

import { useNavigate } from "react-router-dom";

import axios from "axios";

import { FaBell } from "react-icons/fa";

import logo from "../../assets/Logo.svg";


interface StaffProfileData {
  id: number;

  username: string;

  prefix: string | null;

  name: string;

  role: string;

  profile_image: string | null;

  phone: string | null;

  email: string | null;
}


function StaffProfile() {
  const navigate = useNavigate();

  const userId =
    sessionStorage.getItem("userId");

  const username =
    sessionStorage.getItem("username");

  const profileImage =
    sessionStorage.getItem("profileImage");


  const [profile, setProfile] =
    useState<StaffProfileData | null>(null);

  const [loading, setLoading] =
    useState(true);


  /* ==========================================
     ตรวจสอบ Login
  ========================================== */

  useEffect(() => {
    if (!userId) {
      navigate("/");
    }
  }, [userId, navigate]);


  /* ==========================================
     โหลดข้อมูลเจ้าหน้าที่
  ========================================== */

  useEffect(() => {
    if (!userId) return;

    axios
      .get(
        `http://localhost:5000/staff/profile/${userId}`,
      )
      .then((res) => {
        console.log(
          "Staff profile:",
          res.data,
        );

        setProfile(res.data);
      })
      .catch((err) => {
        console.log(
          "Get staff profile error:",
          err,
        );
      })
      .finally(() => {
        setLoading(false);
      });

  }, [userId]);


  /* ==========================================
     ออกจากระบบ
  ========================================== */

  const handleLogout = () => {
    sessionStorage.clear();

    navigate("/");
  };


  return (
    <div className="staff-profile-page">

      {/* ======================================
          SIDEBAR
      ====================================== */}

      <aside className="staff-profile-sidebar">

        <div className="staff-profile-logo">

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


        <nav>
          <ul>

            <li
              onClick={() =>
                navigate("/staff-home")
              }
            >
              หน้าหลัก
            </li>


            <li
              onClick={() =>
                navigate(
                  "/staff-documents",
                )
              }
            >
              เอกสารขออนุมัติหัวข้อโครงงาน
            </li>


            <li
              onClick={() =>
                navigate(
                  "/staff-signature-history",
                )
              }
            >
              ประวัติการลงนาม
            </li>


            <li
              onClick={() =>
                navigate(
                  "/staff-notifications",
                )
              }
            >
              การแจ้งเตือน
            </li>


            <li className="active">
              ข้อมูลส่วนตัว
            </li>

          </ul>
        </nav>


        <button
          className="staff-profile-logout"
          onClick={handleLogout}
        >
          ออกจากระบบ
        </button>

      </aside>


      {/* ======================================
          MAIN
      ====================================== */}

      <main className="staff-profile-main">

        {/* HEADER */}

        <header className="staff-profile-header">

          <h2>ข้อมูลส่วนตัว</h2>


          <div className="staff-profile-header-right">

            <button
              className="staff-profile-bell"
              onClick={() =>
                navigate(
                  "/staff-notifications",
                )
              }
            >
              <FaBell />
            </button>


            <div className="staff-profile-user">

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

        <div className="staff-profile-content">

          {loading ? (

            <div className="staff-profile-loading">
              กำลังโหลดข้อมูล...
            </div>

          ) : !profile ? (

            <div className="staff-profile-loading">
              ไม่พบข้อมูลเจ้าหน้าที่
            </div>

          ) : (

            <div className="staff-profile-card">


              {/* PROFILE IMAGE */}

              <div className="staff-profile-top">

                <img
                  className="staff-profile-avatar"
                  src={
                    profile.profile_image
                      ? `http://localhost:5000${profile.profile_image}`
                      : logo
                  }
                  alt="Staff Profile"
                />


                <div className="staff-profile-name-box">
                  {profile.name}
                </div>


                <div className="staff-profile-role">
                  เจ้าหน้าที่
                </div>

              </div>


              {/* เส้นคั่น */}

              <div className="staff-profile-divider" />


              {/* ACCOUNT INFO */}

              <div className="staff-profile-info">

                <h3>
                  ข้อมูลบัญชี
                </h3>


                <div className="staff-profile-info-row">

                  <span className="staff-profile-label">
                    รหัสผู้ใช้งาน :
                  </span>

                  <span className="staff-profile-value">
                    {profile.username}
                  </span>

                </div>


                <div className="staff-profile-info-row">

                  <span className="staff-profile-label">
                    ชื่อ - นามสกุล :
                  </span>

                  <span className="staff-profile-value">
                    {profile.name}
                  </span>

                </div>


                <div className="staff-profile-info-row">

                  <span className="staff-profile-label">
                    ประเภทผู้ใช้งาน :
                  </span>

                  <span className="staff-profile-value">
                    เจ้าหน้าที่
                  </span>

                </div>


                <div className="staff-profile-info-row">

                  <span className="staff-profile-label">
                    อีเมล :
                  </span>

                  <span className="staff-profile-value">
                    {profile.email || "-"}
                  </span>

                </div>


                <div className="staff-profile-info-row">

                  <span className="staff-profile-label">
                    เบอร์โทรศัพท์ :
                  </span>

                  <span className="staff-profile-value">
                    {profile.phone || "-"}
                  </span>

                </div>

              </div>

            </div>

          )}

        </div>

      </main>

    </div>
  );
}


export default StaffProfile;