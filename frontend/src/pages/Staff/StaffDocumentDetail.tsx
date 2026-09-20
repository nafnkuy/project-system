import "./StaffDocumentDetail.css";

import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { FaBell } from "react-icons/fa";
import axios from "axios";

import logo from "../../assets/Logo.svg";

interface Member {
  id: number;
  username: string;
  name: string;
  major: string;
  signature_image: string | null;
}

interface DocumentDetail {
  id: number;

  request_id: number;
  project_id: number;
  student_id: number;
  advisor_id: number;

  document_type: string;
  document_code: string;

  approved_at: string;

  signature_image: string | null;
  pdf_path: string | null;

  download_status: string;
  downloaded_at: string | null;

  project_title: string;
  project_type: string;
  major: string;
  academic_year: string;

  advisor_name: string;

  members: Member[];
}

function StaffDocumentDetail() {
  const navigate = useNavigate();

  const { id } = useParams();

  const username = sessionStorage.getItem("username");
  const profileImage = sessionStorage.getItem("profileImage");

  const [document, setDocument] = useState<DocumentDetail | null>(null);

  const [loading, setLoading] = useState(true);

  /* =========================
     ดึงข้อมูลเอกสาร
  ========================= */

  useEffect(() => {
    if (!id) return;

    axios
      .get(`http://localhost:5000/staff/documents/${id}`)
      .then((res) => {
        console.log("Document Detail =", res.data);

        setDocument(res.data);
      })
      .catch((err) => {
        console.log("Get document detail error:", err);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [id]);

  /* =========================
     Format วันที่
  ========================= */

  const formatThaiDate = (dateString: string) => {
    if (!dateString) return "-";

    const date = new Date(dateString);

    return date.toLocaleDateString("th-TH", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  /* =========================
     Format เวลา
  ========================= */

  const formatThaiTime = (dateString: string) => {
    if (!dateString) return "-";

    const date = new Date(dateString);

    return date.toLocaleTimeString("th-TH", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  /* =========================
     เลขที่เอกสาร
  ========================= */

  const getDocumentNumber = () => {
    if (!document) return "-";

    const academicYear =
      document.academic_year?.split("/")[0] ||
      String(new Date(document.approved_at).getFullYear() + 543);

    return `${document.document_code}-${academicYear}-${String(
      document.id,
    ).padStart(3, "0")}`;
  };

  /* =========================
     Logout
  ========================= */

  const handleLogout = () => {
    sessionStorage.clear();
    navigate("/");
  };

  const handleDownload = async () => {
    if (!document || !id) return;

    try {
      const response = await axios.get(
        `http://localhost:5000/staff/documents/${id}/download`,
        {
          responseType: "blob",
        },
      );

      // สร้าง URL ชั่วคราวจากไฟล์ PDF
      const fileUrl = window.URL.createObjectURL(
        new Blob([response.data], {
          type: "application/pdf",
        }),
      );

      // สร้าง <a> เพื่อดาวน์โหลดไฟล์
      const link = window.document.createElement("a");

      link.href = fileUrl;
      link.download = `${getDocumentNumber()}.pdf`;

      window.document.body.appendChild(link);

      link.click();

      window.document.body.removeChild(link);
      window.URL.revokeObjectURL(fileUrl);

      // อัปเดตสถานะในหน้าจอทันที
      setDocument((prev) =>
        prev
          ? {
              ...prev,
              download_status: "ดาวน์โหลดแล้ว",
              downloaded_at: new Date().toISOString(),
            }
          : prev,
      );
    } catch (error) {
      console.log("Download PDF error:", error);

      alert("ไม่สามารถดาวน์โหลดเอกสารได้");
    }
  };

  if (loading) {
    return <div>กำลังโหลดข้อมูล...</div>;
  }

  if (!document) {
    return <div>ไม่พบเอกสาร</div>;
  }

  return (
    <div className="staff-detail-page">
      {/* ================= SIDEBAR ================= */}

      <aside className="staff-detail-sidebar">
        <div className="staff-detail-logo">
          <img src={logo} alt="SPTC Logo" />

          <div>
            <h2>SPTC System</h2>
            <p>ระบบติดตามและสื่อสารโครงงานนิสิต</p>
          </div>
        </div>

        <nav>
          <ul>
            <li onClick={() => navigate("/staff-home")}>หน้าหลัก</li>

            <li className="active">เอกสารขออนุมัติหัวข้อโครงงาน</li>

            <li>ประวัติการลงนาม</li>

            <li>การแจ้งเตือน</li>

            <li>ข้อมูลส่วนตัว</li>
          </ul>
        </nav>

        <button className="staff-detail-logout" onClick={handleLogout}>
          ออกจากระบบ
        </button>
      </aside>

      {/* ================= MAIN ================= */}

      <main className="staff-detail-main">
        {/* HEADER */}

        <header className="staff-detail-header">
          <h2>เอกสารขออนุมัติหัวข้อโครงงาน &gt; รายละเอียด</h2>

          <div className="staff-detail-header-right">
            <button className="staff-detail-bell">
              <FaBell />
            </button>

            <div className="staff-detail-user">
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

        {/* ================= CONTENT ================= */}

        <div className="staff-detail-content">
          <div className="staff-detail-card">
            <h3>รายละเอียดเอกสารขออนุมัติหัวข้อโครงงาน</h3>

            {/* ================= ข้อมูลเอกสาร ================= */}

            <section className="detail-section">
              <h4>ข้อมูลเอกสาร</h4>

              <div className="detail-line"></div>

              <p>
                <span>เลขที่เอกสาร :</span> {getDocumentNumber()}
              </p>

              <p>
                <span>วันที่อนุมัติ :</span>{" "}
                {formatThaiDate(document.approved_at)}
              </p>

              <p>
                <span>เวลา :</span> {formatThaiTime(document.approved_at)} น.
              </p>

              <p>
                <span>ประเภทเอกสาร :</span> {document.document_type}
              </p>

              <p>
                <span>ปีการศึกษา :</span> {document.academic_year || "-"}
              </p>
            </section>

            {/* ================= ข้อมูลโครงงาน ================= */}

            <section className="detail-section project-section">
              <h4>ข้อมูลโครงงาน</h4>

              <div className="detail-line"></div>

              <p>
                <span>ชื่อโครงงาน :</span> {document.project_title}
              </p>

              <p>
                <span>ประเภทโครงงาน :</span> {document.project_type}
              </p>

              <p>
                <span>สาขาวิชา :</span> {document.major}
              </p>

              <p>
                <span>ปีการศึกษา :</span> {document.academic_year || "-"}
              </p>

              <div className="member-title">สมาชิกโครงงาน :</div>

              <div className="member-list">
                {document.members.length === 0 ? (
                  <p>ไม่พบข้อมูลสมาชิก</p>
                ) : (
                  document.members.map((member) => (
                    <p key={member.id}>
                      {member.username} {member.name}
                    </p>
                  ))
                )}
              </div>
            </section>

            {/* ================= ข้อมูลการอนุมัติ ================= */}

            <section className="detail-section">
              <h4>ข้อมูลการอนุมัติและลงนาม</h4>

              <div className="detail-line"></div>

              <p>
                <span>อาจารย์ผู้อนุมัติ :</span> {document.advisor_name}
              </p>

              <p>
                <span>วันที่ลงนาม :</span>{" "}
                {formatThaiDate(document.approved_at)}
              </p>

              <p>
                <span>เวลาที่ลงนาม :</span>{" "}
                {formatThaiTime(document.approved_at)} น.
              </p>

              <div className="signature-status-row">
                <span>สถานะการลงนาม :</span>

                {document.signature_image ? (
                  <span className="signature-complete">
                    ✓ ลงนามเรียบร้อยแล้ว
                  </span>
                ) : (
                  <span className="signature-missing">ยังไม่มีลายเซ็น</span>
                )}
              </div>
            </section>

            {/* ================= ข้อมูลการดาวน์โหลด ================= */}

            {document.download_status === "ดาวน์โหลดแล้ว" &&
              document.downloaded_at && (
                <section className="detail-section">
                  <h4>ข้อมูลการดาวน์โหลด</h4>

                  <div className="detail-line"></div>

                  <div className="signature-status-row">
                    <span>สถานะการดาวน์โหลด :</span>

                    <span className="signature-complete">✓ ดาวน์โหลดแล้ว</span>
                  </div>

                  <p>
                    <span>วันที่ดาวน์โหลด :</span>{" "}
                    {formatThaiDate(document.downloaded_at)}
                  </p>

                  <p>
                    <span>เวลา :</span> {formatThaiTime(document.downloaded_at)}{" "}
                    น.
                  </p>

                  <p>
                    <span>ผู้ดาวน์โหลด :</span> เจ้าหน้าที่
                  </p>
                </section>
              )}

            {/* ================= DOWNLOAD ================= */}

            <div className="download-area">
              <button
                className="download-document-btn"
                onClick={handleDownload}
              >
                ⬇{" "}
                {document.download_status === "ดาวน์โหลดแล้ว"
                  ? "ดาวน์โหลดเอกสารอีกครั้ง"
                  : "ดาวน์โหลดเอกสาร PDF"}
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default StaffDocumentDetail;
