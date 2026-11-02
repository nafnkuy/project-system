import "./SubmitNewProject.css";
import StudentNotificationBell from "./StudentNotificationBell";

import { useNavigate, useSearchParams } from "react-router-dom";
import { useEffect, useState } from "react";
import axios from "axios";
import { FaSearch } from "react-icons/fa";

import logo from "../../assets/Logo.svg";

type ResubmitEditableValues = {
  projectTitle: string;
  description: string;
  objective: string;
  skills: string;
  contactType: string;
  contactValue: string;
  introduction: string;
};

function SubmitNewProject() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const mode = searchParams.get("mode");
  const resubmitProjectId = searchParams.get("projectId");
  const resubmitRequestId = searchParams.get("requestId");

  const isResubmit =
    mode === "resubmit" && !!resubmitProjectId && !!resubmitRequestId;

  /* =========================================================
     SESSION
  ========================================================= */

  const username = sessionStorage.getItem("username");
  const userId = sessionStorage.getItem("userId");
  const profileImage = sessionStorage.getItem("profileImage");
  const name = sessionStorage.getItem("name");

  /* =========================================================
     PROJECT FORM
  ========================================================= */

  const [projectTitle, setProjectTitle] = useState("");
  const [academicYear, setAcademicYear] = useState("");
  const [projectType, setProjectType] = useState("โครงงานเดี่ยว");

  const [major, setMajor] = useState("");

  const [description, setDescription] = useState("");
  const [objective, setObjective] = useState("");
  const [skills, setSkills] = useState("");

  /* =========================================================
     MEMBER
  ========================================================= */

  const [memberId, setMemberId] = useState("");

  const [memberUserId, setMemberUserId] = useState<number | null>(null);

  const [memberName, setMemberName] = useState("");

  /* =========================================================
   เก็บข้อมูลคำเชิญสมาชิกคนที่ 2
========================================================= */

  const [invitationId, setInvitationId] = useState<number | null>(null);

  const [invitationStatus, setInvitationStatus] = useState("");

  const [sendingInvitation, setSendingInvitation] = useState(false);

  /* =========================================================
     ADVISOR
  ========================================================= */

  const [teacherKeyword, setTeacherKeyword] = useState("");
  const [teacherList, setTeacherList] = useState<any[]>([]);

  const [advisorId, setAdvisorId] = useState<number | null>(null);

  const [advisorName, setAdvisorName] = useState("");

  /* =========================================================
     CONTACT
  ========================================================= */

  const [contactType, setContactType] = useState("");
  const [contactValue, setContactValue] = useState("");
  const [introduction, setIntroduction] = useState("");

  const [revisionSuggestion, setRevisionSuggestion] = useState("");

  // ป้องกันการกดส่งคำขอ ก่อนโหลดข้อมูลเดิมในโหมดแก้ไขเสร็จ
  const [resubmitLoadState, setResubmitLoadState] = useState<
    "idle" | "loading" | "loaded" | "error"
  >("idle");
  const [resubmitLoadError, setResubmitLoadError] = useState("");
  // จำค่าที่โหลดมาครั้งแรก เพื่อเปิดปุ่มส่งเฉพาะเมื่อมีข้อมูลเปลี่ยนจริง
  const [originalResubmitValues, setOriginalResubmitValues] =
    useState<ResubmitEditableValues | null>(null);

  /* =========================================================
     CHECK LOGIN
  ========================================================= */

  useEffect(() => {
    if (!username) {
      navigate("/");
    }
  }, [username, navigate]);

  /* =========================================================
     SEARCH TEACHER
  ========================================================= */

  useEffect(() => {
    if (teacherKeyword.trim() === "") {
      setTeacherList([]);
      return;
    }

    if (teacherKeyword === advisorName) {
      setTeacherList([]);
      return;
    }

    axios
      .get("http://localhost:5000/teachers/search", {
        params: {
          name: teacherKeyword,
        },
      })
      .then((res) => {
        setTeacherList(res.data);
      })
      .catch(() => {
        setTeacherList([]);
      });
  }, [teacherKeyword, advisorName]);

  /* =========================================================
     LOAD RESUBMIT DATA
     ใช้ API เดียวกับหน้า StudentProjectRequestDetail
     ซึ่งคืนรายละเอียดโครงงาน + คำขอ + ข้อเสนอแนะ
  ========================================================= */

  useEffect(() => {
    if (!isResubmit || !resubmitProjectId || !resubmitRequestId || !userId) {
      return;
    }

    let cancelled = false;

    const loadResubmitData = async () => {
      setResubmitLoadState("loading");
      setResubmitLoadError("");
      setOriginalResubmitValues(null);

      try {
        // หน้าแสดงรายละเอียดคำขอใช้ API นี้อยู่แล้วและแสดงข้อมูลได้ครบ
        const detailRes = await axios.get(
          `http://localhost:5000/student/request-detail/${resubmitRequestId}/${userId}`,
        );

        const detail = detailRes.data?.request ?? detailRes.data;

        if (
          !detail ||
          String(detail.request_id) !== String(resubmitRequestId)
        ) {
          throw new Error("ข้อมูลคำขอที่ได้รับไม่ตรงกับคำขอที่ต้องการแก้ไข");
        }

        if (detail.request_status !== "ต้องแก้ไข") {
          if (!cancelled) {
            alert("คำขอนี้ไม่อยู่ในสถานะที่แก้ไขได้แล้ว");
            navigate("/student-project");
          }
          return;
        }

        // บาง backend ยังคืนข้อมูลติดต่อจาก route นี้เท่านั้น
        // โหลดเป็นข้อมูลเสริม โดยไม่ให้ความล้มเหลวของ route นี้ลบข้อมูลโครงงานหลัก
        let contactData: any = {};
        try {
          const contactRes = await axios.get(
            `http://localhost:5000/project-requests/${resubmitProjectId}/${userId}`,
          );
          contactData = contactRes.data?.request ?? contactRes.data ?? {};
        } catch (contactError) {
          console.warn("Load request contact fallback:", contactError);
        }

        if (cancelled) return;

        // เก็บข้อมูลเดิมไว้เทียบกับค่าที่นิสิตแก้ไขในฟอร์ม
        const initialValues: ResubmitEditableValues = {
          projectTitle: detail.title || "",
          description: detail.description || "",
          objective: detail.objectives || "",
          skills: detail.skills || "",
          contactType: detail.contact_type || contactData.contact_type || "",
          contactValue: detail.contact_value || contactData.contact_value || "",
          introduction: detail.introduction || contactData.introduction || "",
        };

        /* ================= PROJECT ================= */

        setProjectTitle(initialValues.projectTitle);
        setAcademicYear(detail.academic_year || "");
        setProjectType(detail.project_type || "โครงงานเดี่ยว");
        setMajor(detail.major || "");

        const loadedAdvisorName = detail.advisor_name || detail.advisor || "";
        setAdvisorId(detail.advisor_id ? Number(detail.advisor_id) : null);
        setAdvisorName(loadedAdvisorName);
        setTeacherKeyword(loadedAdvisorName);

        setDescription(initialValues.description);
        setObjective(initialValues.objective);
        setSkills(initialValues.skills);

        /* ================= REQUEST ================= */

        setContactType(initialValues.contactType);
        setContactValue(initialValues.contactValue);
        setIntroduction(initialValues.introduction);
        setRevisionSuggestion(
          detail.suggestion || contactData.suggestion || "",
        );
        setOriginalResubmitValues(initialValues);

        /* ================= MEMBER 2 ================= */

        if (detail.project_type === "โครงงานคู่") {
          // สมาชิกในคำขอจริงเชื่อถือได้มากกว่าสถานะคำเชิญเก่า
          const otherMember = Array.isArray(detail.members)
            ? detail.members.find(
                (member: any) => String(member.username) !== String(username),
              )
            : null;

          if (otherMember) {
            setMemberId(otherMember.username || "");
            setMemberUserId(otherMember.id ? Number(otherMember.id) : null);
            setMemberName(otherMember.name || "");
          } else {
            try {
              const invitationRes = await axios.get(
                `http://localhost:5000/project-invitations/status/${resubmitProjectId}/${userId}`,
              );
              if (cancelled) return;
              const invitation = invitationRes.data;
              if (invitation.status === "ตอบรับ") {
                setMemberId(invitation.receiver_username || "");
                setMemberUserId(
                  invitation.receiver_id
                    ? Number(invitation.receiver_id)
                    : null,
                );
                setMemberName(invitation.receiver_name || "");
              } else {
                setMemberId("");
                setMemberUserId(null);
                setMemberName("");
              }
            } catch (invitationError) {
              console.warn("Load partner fallback:", invitationError);
              setMemberId("");
              setMemberUserId(null);
              setMemberName("");
            }
          }
        } else {
          setMemberId("");
          setMemberUserId(null);
          setMemberName("");
        }

        if (!cancelled) setResubmitLoadState("loaded");
      } catch (err: any) {
        if (cancelled) return;
        console.error("Load resubmit data error:", err);
        setResubmitLoadError(
          err.response?.data?.message ||
            err.message ||
            "ไม่สามารถโหลดข้อมูลคำเสนอโครงงานเดิมได้",
        );
        setResubmitLoadState("error");
      }
    };

    void loadResubmitData();
    return () => {
      cancelled = true;
    };
  }, [
    isResubmit,
    resubmitProjectId,
    resubmitRequestId,
    userId,
    username,
    navigate,
  ]);

  /* =========================================================
   โหลดคำเชิญเดิมของนิสิต
========================================================= */

  useEffect(() => {
    // ไม่โหลดคำเชิญเมื่อยังไม่ได้เข้าสู่ระบบ
    if (!userId || isResubmit) {
      return;
    }

    const loadInvitation = async () => {
      try {
        const res = await axios.get(
          `http://localhost:5000/project-invitations/draft/${userId}`,
        );

        const invitation = res.data.invitation;

        // ถ้าไม่มีคำเชิญค้างอยู่ ไม่ต้องทำอะไร
        if (!invitation) {
          return;
        }

        // เก็บข้อมูลคำเชิญ
        setInvitationId(invitation.id);
        setInvitationStatus(invitation.status);

        // นำข้อมูลเดิมกลับมาแสดงในฟอร์ม
        setProjectType("โครงงานคู่");
        setProjectTitle(invitation.title);
        setAcademicYear(invitation.academic_year || "");

        // ข้อมูลสมาชิกคนที่ 2
        setMemberId(invitation.receiver_username);
        setMemberUserId(invitation.receiver_id);
        setMemberName(invitation.receiver_name);
      } catch (err) {
        console.log("โหลดคำเชิญเดิมไม่สำเร็จ:", err);
      }
    };

    loadInvitation();
  }, [userId, isResubmit]);

  /* =========================================================
     LOGOUT
  ========================================================= */

  const handleLogout = () => {
    sessionStorage.removeItem("username");
    sessionStorage.removeItem("name");
    sessionStorage.removeItem("profileImage");
    sessionStorage.removeItem("userId");
    sessionStorage.removeItem("major");

    navigate("/");
  };

  /* =========================================================
   ค้นหาสมาชิกคนที่ 2
========================================================= */

  const searchStudent = async () => {
    if (!memberId.trim()) {
      alert("กรุณากรอกรหัสนิสิต");
      return;
    }

    // ป้องกันการค้นหาบัญชีของตัวเอง
    if (memberId.trim() === username) {
      alert("ไม่สามารถเชิญตัวเองเข้าร่วมโครงงานได้");

      setMemberName("");
      setMemberUserId(null);
      return;
    }

    try {
      const res = await axios.get(
        `http://localhost:5000/users/student/${memberId.trim()}`,
      );

      setMemberName(res.data.name);
      setMemberUserId(res.data.id);
      setMemberId(res.data.username);
    } catch (err) {
      alert("ไม่พบนิสิต");

      setMemberName("");
      setMemberUserId(null);
    }
  };

  /* =========================================================
   ส่งคำเชิญเพื่อนก่อนเลือกอาจารย์ที่ปรึกษา
========================================================= */

  const sendInvitation = async () => {
    // ตรวจสอบการเข้าสู่ระบบ
    if (!userId) {
      navigate("/", { replace: true });
      return;
    }

    // ตรวจสอบชื่อโครงงาน
    if (!projectTitle.trim()) {
      alert("กรุณากรอกชื่อหัวข้อโครงงาน");
      return;
    }

    // ตรวจสอบปีการศึกษา
    if (!academicYear) {
      alert("กรุณาเลือกปีการศึกษา");
      return;
    }

    // ตรวจสอบว่าเป็นโครงงานคู่
    if (projectType !== "โครงงานคู่" || isResubmit) {
      return;
    }

    // ตรวจสอบสมาชิกคนที่ 2
    if (!memberUserId) {
      alert("กรุณาค้นหาและเลือกสมาชิกก่อน");
      return;
    }

    // ห้ามเชิญตัวเอง
    if (Number(memberUserId) === Number(userId)) {
      alert("ไม่สามารถเชิญตัวเองเข้าร่วมโครงงานได้");
      return;
    }

    // ป้องกันการกดส่งคำเชิญเดิมซ้ำ
    if (invitationId !== null || sendingInvitation) {
      alert("คุณส่งคำเชิญสมาชิกคนที่ 2 แล้ว");
      return;
    }

    try {
      setSendingInvitation(true);

      // บันทึกคำเชิญโดยยังไม่สร้างโครงงาน
      const res = await axios.post(
        "http://localhost:5000/project-invitations",
        {
          sender_id: Number(userId),
          receiver_id: memberUserId,

          // ยังไม่เลือกอาจารย์และยังไม่มีโครงงาน
          project_id: null,
          advisor_id: null,

          title: projectTitle,
          academic_year: academicYear,
          project_type: "โครงงานคู่",

          description: description,
          objectives: objective,
          skills: skills,
          requirements: "",

          contact_type: contactType,
          contact_value: contactValue,
          introduction: introduction,
        },
      );

      // เก็บรหัสคำเชิญที่ Backend ส่งกลับมา
      setInvitationId(res.data.invitation_id);
      setInvitationStatus("รอตอบรับ");

      alert("ส่งคำเชิญเข้าร่วมโครงงานเรียบร้อยแล้ว");
    } catch (err: any) {
      console.log("ส่งคำเชิญไม่สำเร็จ:", err);

      alert(err.response?.data?.message || "ไม่สามารถส่งคำเชิญได้");
    } finally {
      setSendingInvitation(false);
    }
  };

  /* =========================================================
   ตรวจสอบสถานะการตอบรับของสมาชิกคนที่ 2
========================================================= */

  const checkInvitationStatus = async () => {
    if (!invitationId || !userId) {
      return;
    }

    try {
      const res = await axios.get(
        `http://localhost:5000/project-invitations/draft-status/${invitationId}/${userId}`,
      );

      const status = res.data.status;

      setInvitationStatus(status);

      if (status === "ตอบรับ") {
        alert("สมาชิกคนที่ 2 ตอบรับคำเชิญแล้ว สามารถเลือกอาจารย์ที่ปรึกษาได้");
        return;
      }

      if (status === "รอตอบรับ") {
        alert("สมาชิกคนที่ 2 ยังไม่ได้ตอบรับคำเชิญ");
        return;
      }

      if (status === "ปฏิเสธ") {
        alert("สมาชิกคนที่ 2 ปฏิเสธคำเชิญ กรุณาเลือกสมาชิกใหม่");

        setInvitationId(null);
        setInvitationStatus("");

        setMemberId("");
        setMemberUserId(null);
        setMemberName("");
      }
    } catch (err: any) {
      console.log("ตรวจสอบคำเชิญไม่สำเร็จ:", err);

      alert(err.response?.data?.message || "ไม่สามารถตรวจสอบสถานะคำเชิญได้");
    }
  };

  /* =========================================================
     RESUBMIT: ENABLE BUTTON ONLY WHEN DATA HAS CHANGED
  ========================================================= */

  // ช่องปีการศึกษาและประเภทโครงงานถูกล็อกในโหมดแก้ไข จึงไม่ต้องนำมาเปรียบเทียบ
  const hasResubmitChanges =
    originalResubmitValues !== null &&
    (projectTitle.trim() !== originalResubmitValues.projectTitle.trim() ||
      description.trim() !== originalResubmitValues.description.trim() ||
      objective.trim() !== originalResubmitValues.objective.trim() ||
      skills.trim() !== originalResubmitValues.skills.trim() ||
      contactType !== originalResubmitValues.contactType ||
      contactValue.trim() !== originalResubmitValues.contactValue.trim() ||
      introduction.trim() !== originalResubmitValues.introduction.trim());

  const resubmitRequiredFieldsComplete =
    projectTitle.trim() !== "" &&
    academicYear.trim() !== "" &&
    advisorId !== null &&
    major.trim() !== "" &&
    contactType.trim() !== "" &&
    contactValue.trim() !== "" &&
    description.trim() !== "" &&
    objective.trim() !== "" &&
    skills.trim() !== "";

  const canResubmit =
    resubmitLoadState === "loaded" &&
    hasResubmitChanges &&
    resubmitRequiredFieldsComplete;

  /* =========================================================
     SUBMIT PROJECT
  ========================================================= */

  const handleSubmit = async () => {
    try {
      if (isResubmit && !canResubmit) {
        // ยังไม่แก้ข้อมูลจริง หรือกรอกข้อมูลบังคับไม่ครบ
        return;
      }

      if (!projectTitle.trim()) {
        alert("กรุณากรอกชื่อหัวข้อโครงงาน");
        return;
      }

      if (!academicYear) {
        alert("กรุณาเลือกปีการศึกษา");
        return;
      }

      if (!advisorId) {
        alert("กรุณาเลือกอาจารย์ที่ปรึกษาก่อน");
        return;
      }

      if (!major) {
        alert("กรุณาเลือกสาขาวิชา");
        return;
      }

      if (!contactType || !contactValue) {
        alert("กรุณากรอกข้อมูลการติดต่อ");
        return;
      }

      /* =====================================================
         RESUBMIT
      ===================================================== */

      if (isResubmit && resubmitProjectId && resubmitRequestId) {
        const res = await axios.put(
          `http://localhost:5000/student/project-resubmit/${resubmitProjectId}/${resubmitRequestId}`,
          {
            student_id: Number(userId),

            title: projectTitle,

            academic_year: academicYear,

            advisor: advisorName,

            advisor_id: advisorId,

            major: major,

            project_type: projectType,

            max_members: projectType === "โครงงานคู่" ? 2 : 1,

            description: description,

            objectives: objective,

            skills: skills,

            requirements: "",

            contact_type: contactType,

            contact_value: contactValue,

            introduction: introduction,
          },
        );

        alert(res.data.message);

        navigate("/StudentHome");
        return;
      }

      /* =====================================================
   ส่งคำเสนอโครงงานคู่
===================================================== */

      if (projectType === "โครงงานคู่") {
        // ตรวจสอบว่ามีคำเชิญเพื่อนแล้วหรือยัง
        if (!invitationId) {
          alert("กรุณาเชิญสมาชิกคนที่ 2 ก่อน");
          return;
        }

        // ตรวจสอบสถานะการตอบรับที่แสดงในหน้าเว็บ
        if (invitationStatus !== "ตอบรับ") {
          alert("กรุณารอให้สมาชิกตอบรับคำเชิญก่อน");
          return;
        }

        // ตรวจสอบข้อมูลโครงงาน
        if (!description.trim() || !objective.trim() || !skills.trim()) {
          alert("กรุณากรอกรายละเอียด วัตถุประสงค์ และเทคโนโลยีที่ใช้");
          return;
        }

        // ให้ Backend ตรวจสถานะและบันทึกทั้งหมด
        const res = await axios.post(
          "http://localhost:5000/student/submit-pair-project",
          {
            invitation_id: invitationId,
            sender_id: Number(userId),
            advisor_id: advisorId,

            description: description,
            objectives: objective,
            skills: skills,

            contact_type: contactType,
            contact_value: contactValue,
            introduction: introduction,
          },
        );

        alert(res.data.message);

        navigate("/StudentHome");
        return;
      }

      /* =====================================================
         PROJECT เดี่ยว
      ===================================================== */

      const projectRes = await axios.post("http://localhost:5000/projects", {
        title: projectTitle,

        academic_year: academicYear,

        advisor: advisorName,

        advisor_id: advisorId,

        major: major,

        project_type: "โครงงานเดี่ยว",

        max_members: 1,

        description: description,

        objectives: objective,

        skills: skills,

        requirements: "",

        source: "student",

        student_id: Number(userId),
      });

      const newProjectId = projectRes.data.project_id;

      await axios.post("http://localhost:5000/project-requests", {
        project_id: newProjectId,

        student_id: Number(userId),

        contact_type: contactType,

        contact_value: contactValue,

        introduction: introduction,
      });

      alert("ส่งข้อเสนอโครงงานสำเร็จ");

      navigate("/StudentHome");
    } catch (err: any) {
      console.log(err);
      console.log(err.response?.data);

      alert(err.response?.data?.message || "ส่งข้อเสนอไม่สำเร็จ");
    }
  };

  /* =========================================================
     JSX
  ========================================================= */

  return (
    <div className="student-submit-project-page">
      {/* ================= SIDEBAR ================= */}

      <aside className="sidebar">
        <div className="logo">
          <img src={logo} alt="Logo" />

          <div>
            <h2>SPTC System</h2>
            <p>ระบบติดตามและสื่อสารโครงงานนิสิต</p>
          </div>
        </div>

        <nav>
          <ul>
            <li onClick={() => navigate("/StudentHome")}>หน้าหลัก</li>

            <li onClick={() => navigate("/teachers")}>รายชื่ออาจารย์</li>

            <li
              className="active"
              onClick={() => navigate("/submit-new-project")}
            >
              ส่งคำเสนอโครงงานใหม่
            </li>

            <li onClick={() => navigate("/student-project")}>โครงงานของฉัน</li>

            <li onClick={() => navigate("/student-notifications")}>
              การแจ้งเตือน
            </li>

            <li onClick={() => navigate("/student-profile")}>ข้อมูลส่วนตัว</li>
          </ul>
        </nav>

        <button className="logout-btn" onClick={handleLogout}>
          ออกจากระบบ
        </button>
      </aside>

      {/* ================= MAIN ================= */}

      <main className="main">
        {/* ================= HEADER ================= */}

        <header className="header">
          <h2>{isResubmit ? "แก้ไขคำเสนอโครงงาน" : "ส่งคำเสนอโครงงานใหม่"}</h2>

          <div className="header-right">
            <StudentNotificationBell />

            <div className="user-info">
              <img
                src={
                  profileImage ? `http://localhost:5000${profileImage}` : logo
                }
                alt="Profile"
                className="profile-image"
              />

              <span>{username}</span>
            </div>
          </div>
        </header>

        {/* ================= FORM ================= */}

        <div className="proposal-card">
          {isResubmit && resubmitLoadState === "loading" && (
            <div className="resubmit-data-message" role="status">
              กำลังโหลดข้อมูลคำเสนอโครงงานเดิม...
            </div>
          )}
          {isResubmit && resubmitLoadState === "error" && (
            <div className="resubmit-data-message error" role="alert">
              โหลดข้อมูลคำขอเดิมไม่สำเร็จ: {resubmitLoadError}
              กรุณากลับไปหน้ารายละเอียดคำขอ แล้วลองกดแก้ไขอีกครั้ง
            </div>
          )}
          {/* ================= REVISION: READ BEFORE EDITING ================= */}
          {isResubmit && resubmitLoadState === "loaded" && (
            <div className="revision-suggestion-box" role="note">
              <div className="revision-suggestion-title">สิ่งที่ต้องแก้ไข</div>
              <div className="revision-suggestion-text">
                {revisionSuggestion || "-"}
              </div>
            </div>
          )}

          {/* ================= TITLE ================= */}

          <section className="proposal-section">
            <div className="form-group">
              <label>
                ชื่อหัวข้อโครงงาน <span className="required-star">*</span>
              </label>

              <input
                type="text"
                value={projectTitle}
                onChange={(e) => setProjectTitle(e.target.value)}
                placeholder="กรอกชื่อหัวข้อโครงงาน"
                disabled={invitationId !== null}
              />
            </div>
          </section>

          {/* ================= YEAR + TYPE ================= */}

          <section className="proposal-section">
            <div className="proposal-two-column">
              <div className="form-group">
                <label>
                  ปีการศึกษา / ภาคเรียน <span className="required-star">*</span>
                </label>

                <div className="contact-select-wrapper">
                  <select
                    value={academicYear}
                    onChange={(e) => setAcademicYear(e.target.value)}
                    disabled={isResubmit || invitationId !== null}
                  >
                    <option value="">เลือกปีการศึกษา</option>

                    <option value="2569/1">2569/1</option>

                    <option value="2569/2">2569/2</option>

                    <option value="2570/1">2570/1</option>

                    <option value="2570/2">2570/2</option>
                  </select>

                  {!isResubmit && (
                    <span className="contact-select-arrow">▼</span>
                  )}
                </div>
              </div>

              <div className="form-group">
                <label>
                  ประเภทโครงงาน <span className="required-star">*</span>
                </label>

                <div className="contact-select-wrapper">
                  <select
                    value={projectType}
                    onChange={(e) => {
                      // เปลี่ยนประเภทโครงงาน
                      setProjectType(e.target.value);

                      // ล้างข้อมูลอาจารย์ที่เคยเลือก
                      setAdvisorId(null);
                      setAdvisorName("");
                      setTeacherKeyword("");
                      setTeacherList([]);
                      setMajor("");

                      // ถ้าเปลี่ยนเป็นโครงงานเดี่ยว ให้ล้างสมาชิกคนที่ 2
                      if (e.target.value === "โครงงานเดี่ยว") {
                        setMemberId("");
                        setMemberUserId(null);
                        setMemberName("");
                      }
                    }}
                    disabled={isResubmit || invitationId !== null}
                    aria-label="ประเภทโครงงาน"
                    title={
                      isResubmit
                        ? "ไม่สามารถเปลี่ยนประเภทโครงงานระหว่างแก้ไขคำขอได้"
                        : undefined
                    }
                  >
                    <option value="โครงงานเดี่ยว">โครงงานเดี่ยว</option>

                    <option value="โครงงานคู่">โครงงานคู่</option>
                  </select>

                  {!isResubmit && (
                    <span className="contact-select-arrow">▼</span>
                  )}
                </div>
              </div>
            </div>

            <div className="proposal-member-info">
              <span>จำนวนสมาชิก</span>

              <strong>
                {projectType === "โครงงานเดี่ยว" ? "1 คน" : "2 คน"}
              </strong>
            </div>
          </section>

          {/* ================= MEMBER ================= */}

          <section className="proposal-section">
            <h4 className="proposal-section-title">สมาชิกโครงงาน</h4>

            {/* MEMBER 1 */}

            <div className="member-card">
              <h5>สมาชิกคนที่ 1</h5>

              <div className="member-field-grid">
                <div className="form-group">
                  <label className="member-field-label">รหัสประจำตัว</label>

                  <input type="text" value={username || ""} disabled />
                </div>

                <div className="form-group">
                  <label className="member-field-label">ชื่อ</label>

                  <input type="text" value={name || ""} disabled />
                </div>
              </div>
            </div>

            {/* MEMBER 2 */}

            {projectType === "โครงงานคู่" && (
              <div className="member-card">
                <h5>สมาชิกคนที่ 2</h5>

                {isResubmit ? (
                  <div className="member-field-grid">
                    <div className="form-group">
                      <label className="member-field-label">รหัสประจำตัว</label>

                      <input type="text" value={memberId} disabled />
                    </div>

                    <div className="form-group">
                      <label className="member-field-label">ชื่อ</label>

                      <input type="text" value={memberName} disabled />
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="form-group">
                      <label className="member-field-label">รหัสประจำตัว</label>

                      <div className="search-box">
                        <input
                          type="text"
                          value={memberId}
                          onChange={(e) => {
                            setMemberId(e.target.value);
                            setMemberUserId(null);
                            setMemberName("");
                          }}
                          placeholder="กรอกรหัสนิสิต"
                          disabled={invitationId !== null}
                        />

                        <button
                          type="button"
                          onClick={searchStudent}
                          disabled={invitationId !== null}
                        >
                          <FaSearch />
                        </button>
                      </div>
                    </div>

                    {memberName && (
                      <div className="member-result">
                        <h4 className="success-text">พบข้อมูล</h4>

                        <div className="member-result-grid">
                          <div className="result-item">
                            <span className="result-label">รหัสประจำตัว</span>
                            <strong className="result-value">{memberId}</strong>
                          </div>

                          <div className="result-item">
                            <span className="result-label">ชื่อ</span>
                            <strong className="result-value">
                              {memberName}
                            </strong>
                          </div>
                        </div>

                        <div className="member-action">
                          <button
                            type="button"
                            className="change-btn"
                            disabled={invitationId !== null}
                            onClick={() => {
                              setMemberId("");

                              setMemberUserId(null);

                              setMemberName("");
                            }}
                          >
                            เปลี่ยนสมาชิก
                          </button>

                          {/* ปุ่มเชิญสมาชิกคนที่ 2 */}
                          <button
                            type="button"
                            className="invite-btn"
                            onClick={sendInvitation}
                            disabled={
                              invitationId !== null || sendingInvitation
                            }
                          >
                            {sendingInvitation
                              ? "กำลังส่งคำเชิญ..."
                              : invitationId !== null
                                ? "ส่งคำเชิญแล้ว"
                                : "เชิญเข้าร่วมโครงงาน"}
                          </button>

                          {/* ปุ่มตรวจสอบผลการตอบรับ */}
                          {invitationId !== null && (
                            <button
                              type="button"
                              className="change-btn"
                              onClick={checkInvitationStatus}
                            >
                              ตรวจสอบสถานะคำเชิญ
                            </button>
                          )}
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}
          </section>

          <div className="proposal-contact-advisor-grid">
            {/* ================= CONTACT ================= */}

            <section className="proposal-section">
              <h4 className="proposal-section-title">
                ช่องทางการติดต่อ <span className="required-star">*</span>
              </h4>

              <div className="contact-select-wrapper">
                <select
                  value={contactType}
                  onChange={(e) => {
                    setContactType(e.target.value);
                    setContactValue("");
                  }}
                >
                  <option value="">เลือกช่องทางการติดต่อ</option>
                  <option value="Email">Email</option>
                  <option value="Line ID">Line ID</option>
                  <option value="Facebook">Facebook</option>
                  <option value="Discord">Discord</option>
                  <option value="Instagram">Instagram</option>
                  <option value="เบอร์โทรศัพท์">เบอร์โทรศัพท์</option>
                </select>

                <span className="contact-select-arrow">▼</span>
              </div>

              {contactType !== "" && (
                <div className="form-group">
                  <label>
                    {contactType} <span className="required-star">*</span>
                  </label>

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
                  />
                </div>
              )}
            </section>

            {/* ================= ADVISOR ================= */}

            <section className="proposal-section">
              <div className="form-group">
                <label>
                  เลือกอาจารย์ที่ปรึกษา <span className="required-star">*</span>
                </label>

                {advisorName ? (
                  <div className="advisor-selected-row">
                    <span className="advisor-name">{advisorName}</span>

                    {!isResubmit && (
                      <button
                        type="button"
                        className="change-advisor-btn"
                        onClick={() => {
                          setAdvisorId(null);
                          setAdvisorName("");
                          setTeacherKeyword("");
                          setTeacherList([]);
                        }}
                      >
                        เปลี่ยนอาจารย์
                      </button>
                    )}
                  </div>
                ) : (
                  !isResubmit && (
                    <div className="teacher-search">
                      <div className="search-box">
                        <input
                          type="text"
                          value={teacherKeyword}
                          onChange={(e) => setTeacherKeyword(e.target.value)}
                          placeholder="พิมพ์ชื่ออาจารย์"
                        />
                      </div>

                      {teacherList.map((teacher) => {
                        const requiredSlots =
                          projectType === "โครงงานคู่" ? 2 : 1;

                        const canAccept =
                          Number(teacher.remaining_capacity) >= requiredSlots;

                        return (
                          <div
                            key={teacher.id}
                            className={`teacher-item ${
                              !canAccept ? "teacher-full" : ""
                            }`}
                            onClick={() => {
                              /* =================================================
                                   ตรวจสอบคำเชิญก่อนเลือกอาจารย์สำหรับโครงงานคู่
                                ================================================= */

                              if (
                                !isResubmit &&
                                projectType === "โครงงานคู่" &&
                                invitationStatus !== "ตอบรับ"
                              ) {
                                alert(
                                  "กรุณาเชิญเพื่อนและรอให้ตอบรับก่อนเลือกอาจารย์",
                                );
                                return;
                              }

                              if (!canAccept) {
                                alert(
                                  projectType === "โครงงานคู่"
                                    ? `อาจารย์ท่านนี้เหลือรับนิสิตได้ ${teacher.remaining_capacity} คน ไม่เพียงพอสำหรับโครงงานคู่`
                                    : "อาจารย์ท่านนี้รับนิสิตครบแล้ว",
                                );

                                return;
                              }

                              setAdvisorId(teacher.id);
                              setAdvisorName(teacher.name);
                              setMajor(teacher.major);
                              setTeacherKeyword(teacher.name);
                              setTeacherList([]);
                            }}
                          >
                            <span>{teacher.name}</span>

                            <span>
                              {canAccept
                                ? `เปิดรับ (${teacher.accepted_students}/${teacher.total_capacity})`
                                : `ไม่สามารถรับเพิ่ม (${teacher.accepted_students}/${teacher.total_capacity})`}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  )
                )}
              </div>
            </section>
          </div>

          {/* ================= REASON ================= */}

          <section className="proposal-section">
            <div className="form-group">
              <label>เหตุผลในการเสนอหัวข้อโครงงาน</label>
              <textarea
                rows={4}
                value={introduction}
                onChange={(e) => setIntroduction(e.target.value)}
                placeholder="กรุณาระบุเหตุผลที่ต้องการเสนอหัวข้อโครงงานนี้"
              />
            </div>
          </section>

          {/* ================= DETAILS ================= */}

          <section className="proposal-section">
            <div className="form-group">
              <label>
                รายละเอียดโครงงาน <span className="required-star">*</span>
              </label>

              <textarea
                rows={5}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="กรอกรายละเอียดของโครงงาน"
              />
            </div>

            <div className="form-group">
              <label>
                วัตถุประสงค์ <span className="required-star">*</span>
              </label>

              <textarea
                rows={4}
                value={objective}
                onChange={(e) => setObjective(e.target.value)}
                placeholder="กรอกวัตถุประสงค์ของโครงงาน"
              />
            </div>

            <div className="form-group">
              <label>
                เทคโนโลยีที่ใช้ <span className="required-star">*</span>
              </label>

              <p className="example-text">
                ตัวอย่างการกรอก: React|Node.js|MySQL|Git|HTML|CSS
                <br />
                ห้ามเว้นวรรคระหว่างเครื่องหมาย |
              </p>

              <input
                type="text"
                value={skills}
                onChange={(e) => setSkills(e.target.value)}
                placeholder="กรอกเทคโนโลยีที่ใช้ในโครงงาน"
              />
            </div>

            {/* ================= BUTTON ================= */}

            <div className="button-group">
              <button
                type="button"
                className="cancel-btn"
                onClick={() => navigate(-1)}
              >
                ยกเลิก
              </button>

              <button
                type="button"
                className="submit-btn"
                onClick={handleSubmit}
                disabled={isResubmit && !canResubmit}
              >
                {isResubmit ? "ส่งให้อาจารย์พิจารณาใหม่" : "ส่งคำเสนอโครงงาน"}
              </button>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}

export default SubmitNewProject;
