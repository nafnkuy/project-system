import "./StudentTaskDetail.css";

import { useEffect, useMemo, useRef, useState } from "react";

import { useNavigate, useParams } from "react-router-dom";

import axios from "axios";

import {
  FaDownload,
  FaEdit,
  FaPaperclip,
  FaPlus,
  FaTrash,
} from "react-icons/fa";

import logo from "../../assets/Logo.svg";

import StudentNotificationBell from "./StudentNotificationBell";

/* =========================================================
   TYPE
========================================================= */

interface Subtask {
  id: number;
  task_id: number;

  subtask_name: string;

  status: "ยังไม่เริ่ม" | "กำลังดำเนินการ" | "เสร็จสิ้น";

  subtask_order: number;
}

interface TaskFile {
  id: number;

  task_id: number;
  uploader_id: number;

  original_name: string;
  file_path: string;

  mime_type: string | null;
  file_size: number | null;

  uploaded_at: string;

  uploader_username: string;
  uploader_name: string;
}

/* =========================================================
   TEACHER REVIEW FILE
========================================================= */

interface TeacherReviewFile {
  id: number;
  task_id: number;
  reviewer_id: number;

  original_name: string;
  file_path: string;
  mime_type: string | null;
  file_size: number | null;

  created_at: string;
  reviewer_name: string | null;
}

interface Task {
  id: number;

  project_id: number;
  phase_id: number;

  task_name: string;

  description: string | null;

  assignee_id: number | null;
  assignee_username: string | null;
  assignee_name: string | null;

  start_date: string | null;
  due_date: string | null;

  status: "ยังไม่เริ่ม" | "กำลังดำเนินการ" | "เสร็จสิ้น";

  review_status: "ยังไม่ส่ง" | "รอตรวจ" | "ผ่าน" | "แก้ไข";
  revision_started_at: string | null;

  submission_note: string | null;
  submitted_at: string | null;

  reviewed_at: string | null;
  reviewed_by: number | null;
  reviewed_by_name: string | null;

  teacher_comment: string | null;
  teacher_file: string | null;

  completed_subtasks: number;
  total_subtasks: number;

  subtasks: Subtask[];
}

interface Phase {
  id: number;

  project_id: number;

  phase_name: string;

  phase_order: number;

  status: "ยังไม่เริ่ม" | "กำลังดำเนินการ" | "เสร็จสิ้น";

  tasks: Task[];
}

interface ProjectInfo {
  id: number;
  title: string;
}

interface PlanResponse {
  project: ProjectInfo;
  phases: Phase[];
}

/* =========================================================
   COMPONENT
========================================================= */

function StudentTaskDetail() {
  const navigate = useNavigate();

  const { projectId, taskId } = useParams();

  /* =========================================================
     SESSION
  ========================================================= */

  const userId = sessionStorage.getItem("userId");

  const username = sessionStorage.getItem("username");

  const profileImage = sessionStorage.getItem("profileImage");

  /* =========================================================
     DATA
  ========================================================= */

  const [project, setProject] = useState<ProjectInfo | null>(null);

  const [phases, setPhases] = useState<Phase[]>([]);

  const [loading, setLoading] = useState(true);

  /* =========================================================
   PROGRESS EDIT
========================================================= */

  const [draftSubtasks, setDraftSubtasks] = useState<Subtask[]>([]);

  const [savingProgress, setSavingProgress] = useState(false);

  const [startingRevision, setStartingRevision] = useState(false);

  const [refreshPlan, setRefreshPlan] = useState(0);

  /* =========================================================
   SUBTASK MANAGEMENT
========================================================= */

  const [showAddSubtaskModal, setShowAddSubtaskModal] = useState(false);

  const [newSubtaskName, setNewSubtaskName] = useState("");

  const [addingSubtask, setAddingSubtask] = useState(false);

  const [editingSubtask, setEditingSubtask] = useState<Subtask | null>(null);

  const [editSubtaskName, setEditSubtaskName] = useState("");

  const [savingSubtask, setSavingSubtask] = useState(false);

  const [deletingSubtaskId, setDeletingSubtaskId] = useState<number | null>(
    null,
  );

  /* =========================================================
   TASK FILE
========================================================= */

  const [taskFiles, setTaskFiles] = useState<TaskFile[]>([]);

  const [uploadingFile, setUploadingFile] = useState(false);

  const [deletingFileId, setDeletingFileId] = useState<number | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  /* =========================================================
   TEACHER REVIEW FILES
========================================================= */

  const [teacherReviewFiles, setTeacherReviewFiles] = useState<
    TeacherReviewFile[]
  >([]);

  const [teacherFilesLoading, setTeacherFilesLoading] = useState(false);

  const [teacherFilesError, setTeacherFilesError] = useState("");

  /* =========================================================
   SUBMIT REVIEW
========================================================= */

  const [showSubmitReviewModal, setShowSubmitReviewModal] = useState(false);

  const [submissionNote, setSubmissionNote] = useState("");

  const [submittingReview, setSubmittingReview] = useState(false);

  /* =========================================================
     CHECK LOGIN
  ========================================================= */

  useEffect(() => {
    if (!userId) {
      navigate("/");
    }
  }, [userId, navigate]);

  /* =========================================================
     LOAD PROJECT PLAN
  ========================================================= */

  useEffect(() => {
    if (!projectId) {
      return;
    }

    setLoading(true);

    axios
      .get(`http://localhost:5000/student/projects/${projectId}/plan`)
      .then((res) => {
        const data = res.data as PlanResponse;

        console.log("Task Detail Data =", data);

        setProject(data.project);

        setPhases(data.phases || []);
      })
      .catch((err) => {
        console.log("Get task detail error:", err);

        alert(err.response?.data?.message || "ไม่สามารถโหลดรายละเอียดงานได้");

        navigate(`/student-project-detail/${projectId}/plan`);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [projectId, navigate, refreshPlan]);

  /* =========================================================
     FIND TASK + PHASE
  ========================================================= */

  const taskData = useMemo(() => {
    for (const phase of phases) {
      const task = phase.tasks.find(
        (item) => Number(item.id) === Number(taskId),
      );

      if (task) {
        return {
          phase,
          task,
        };
      }
    }

    return null;
  }, [phases, taskId]);

  /* =========================================================
   COPY SUBTASK TO DRAFT
========================================================= */

  useEffect(() => {
    if (!taskData) {
      return;
    }

    setDraftSubtasks(
      taskData.task.subtasks.map((subtask) => ({
        ...subtask,
      })),
    );
  }, [taskData]);

  /* =========================================================
   PROGRESS
========================================================= */

  const completedDraftSubtasks = useMemo(() => {
    return draftSubtasks.filter((subtask) => subtask.status === "เสร็จสิ้น")
      .length;
  }, [draftSubtasks]);

  const progress = useMemo(() => {
    const total = draftSubtasks.length;

    if (total === 0) {
      return 0;
    }

    return Math.round((completedDraftSubtasks / total) * 100);
  }, [draftSubtasks, completedDraftSubtasks]);

  /* =========================================================
   CHECK PROGRESS CHANGE
========================================================= */

  const hasProgressChanges = useMemo(() => {
    if (!taskData) {
      return false;
    }

    if (taskData.task.subtasks.length !== draftSubtasks.length) {
      return true;
    }

    return draftSubtasks.some((draft) => {
      const original = taskData.task.subtasks.find(
        (subtask) => Number(subtask.id) === Number(draft.id),
      );

      return original?.status !== draft.status;
    });
  }, [taskData, draftSubtasks]);

  /* =========================================================
   CAN EDIT PROGRESS
========================================================= */

  const canEditProgress = useMemo(() => {
    if (!taskData) {
      return false;
    }

    const task = taskData.task;

    // ยังไม่เริ่มงาน
    if (task.status === "ยังไม่เริ่ม") {
      return false;
    }

    // รอตรวจหรือผ่านแล้ว ห้ามแก้
    if (task.review_status === "รอตรวจ" || task.review_status === "ผ่าน") {
      return false;
    }

    // อาจารย์ส่งกลับมาแก้ไข
    // แต่ยังไม่กดดำเนินการแก้ไข
    if (task.review_status === "แก้ไข" && !task.revision_started_at) {
      return false;
    }

    return true;
  }, [taskData]);

  /* =========================================================
   CAN EDIT SUBTASKS
========================================================= */

  const canEditSubtasks = useMemo(() => {
    if (!taskData) {
      return false;
    }

    const task = taskData.task;

    if (task.review_status === "รอตรวจ" || task.review_status === "ผ่าน") {
      return false;
    }

    // ถ้าต้องแก้ไข ต้องกดปุ่มเริ่มก่อน
    if (task.review_status === "แก้ไข" && !task.revision_started_at) {
      return false;
    }

    return true;
  }, [taskData]);

  /* =========================================================
   START TASK REVISION
========================================================= */

  const handleStartRevision = async () => {
    if (!taskData || !userId || startingRevision) {
      return;
    }

    // ตรวจสอบว่าต้องแก้ไขจริงหรือไม่

    if (taskData.task.review_status !== "แก้ไข") {
      return;
    }

    // ยืนยันการเริ่มแก้ไข

    const confirmStart = window.confirm(
      "ต้องการเริ่มดำเนินการแก้ไขงานนี้หรือไม่?",
    );

    if (!confirmStart) {
      return;
    }

    try {
      setStartingRevision(true);

      // ส่งข้อมูลไป Backend

      const res = await axios.put(
        `http://localhost:5000/student/tasks/${taskData.task.id}/start-revision`,
        {
          student_id: Number(userId),
        },
      );

      alert(res.data.message);

      // โหลดข้อมูลงานใหม่

      setRefreshPlan((value) => value + 1);
    } catch (err: unknown) {
      console.log("Start revision error:", err);

      let message = "ไม่สามารถเริ่มแก้ไขงานได้";

      if (axios.isAxiosError(err)) {
        message = err.response?.data?.message || message;
      }

      alert(message);
    } finally {
      setStartingRevision(false);
    }
  };

  /* =========================================================
   TOGGLE SUBTASK
========================================================= */

  const handleToggleSubtask = (subtaskId: number) => {
    if (!canEditProgress) {
      return;
    }

    setDraftSubtasks((current) =>
      current.map((subtask) => {
        if (Number(subtask.id) !== Number(subtaskId)) {
          return subtask;
        }

        return {
          ...subtask,

          status: subtask.status === "เสร็จสิ้น" ? "ยังไม่เริ่ม" : "เสร็จสิ้น",
        };
      }),
    );
  };

  /* =========================================================
   SAVE PROGRESS
========================================================= */

  const handleSaveProgress = async () => {
    if (!taskData || !userId) {
      return;
    }

    const isActiveRevision =
      taskData.task.review_status === "แก้ไข" &&
      !!taskData.task.revision_started_at;

    if (!hasProgressChanges && !isActiveRevision) {
      return;
    }

    try {
      setSavingProgress(true);

      const res = await axios.put(
        `http://localhost:5000/student/tasks/${taskData.task.id}/progress`,
        {
          student_id: Number(userId),

          subtasks: draftSubtasks.map((subtask) => ({
            id: subtask.id,

            status: subtask.status,
          })),
        },
      );

      alert(res.data.message);

      // โหลดข้อมูลใหม่จาก DB
      setRefreshPlan((value) => value + 1);
    } catch (err: any) {
      console.log("Save progress error:", err);

      alert(err.response?.data?.message || "ไม่สามารถบันทึกความคืบหน้าได้");
    } finally {
      setSavingProgress(false);
    }
  };

  /* =========================================================
   OPEN ADD SUBTASK
========================================================= */

  const handleOpenAddSubtask = () => {
    if (!canEditSubtasks) {
      return;
    }

    // ถ้ามี checkbox ที่ยังไม่ได้บันทึก
    // ให้บันทึกก่อนเพื่อไม่ให้ข้อมูลหาย

    if (hasProgressChanges) {
      alert("กรุณาบันทึกความคืบหน้าก่อนเพิ่ม Subtask");

      return;
    }

    setNewSubtaskName("");

    setShowAddSubtaskModal(true);
  };

  /* =========================================================
   ADD SUBTASK
========================================================= */

  const handleAddSubtask = async () => {
    if (!taskData || !userId || !newSubtaskName.trim()) {
      return;
    }

    try {
      setAddingSubtask(true);

      const res = await axios.post(
        `http://localhost:5000/student/tasks/${taskData.task.id}/subtasks`,
        {
          student_id: Number(userId),

          subtask_name: newSubtaskName.trim(),
        },
      );

      alert(res.data.message);

      setShowAddSubtaskModal(false);

      setNewSubtaskName("");

      setRefreshPlan((value) => value + 1);
    } catch (err: any) {
      console.log("Add subtask error:", err);

      alert(err.response?.data?.message || "ไม่สามารถเพิ่ม Subtask ได้");
    } finally {
      setAddingSubtask(false);
    }
  };

  /* =========================================================
   OPEN EDIT SUBTASK
========================================================= */

  const handleOpenEditSubtask = (subtask: Subtask) => {
    if (!canEditSubtasks) {
      return;
    }

    if (hasProgressChanges) {
      alert("กรุณาบันทึกความคืบหน้าก่อนแก้ไข Subtask");

      return;
    }

    setEditingSubtask(subtask);

    setEditSubtaskName(subtask.subtask_name);
  };

  /* =========================================================
   SAVE EDIT SUBTASK
========================================================= */

  const handleSaveEditSubtask = async () => {
    if (!editingSubtask || !userId || !editSubtaskName.trim()) {
      return;
    }

    try {
      setSavingSubtask(true);

      const res = await axios.put(
        `http://localhost:5000/student/subtasks/${editingSubtask.id}`,
        {
          student_id: Number(userId),

          subtask_name: editSubtaskName.trim(),
        },
      );

      alert(res.data.message);

      setEditingSubtask(null);

      setEditSubtaskName("");

      setRefreshPlan((value) => value + 1);
    } catch (err: any) {
      console.log("Edit subtask error:", err);

      alert(err.response?.data?.message || "ไม่สามารถแก้ไข Subtask ได้");
    } finally {
      setSavingSubtask(false);
    }
  };

  /* =========================================================
   DELETE SUBTASK
========================================================= */

  const handleDeleteSubtask = async (subtask: Subtask) => {
    if (!userId || !canEditSubtasks) {
      return;
    }

    if (hasProgressChanges) {
      alert("กรุณาบันทึกความคืบหน้าก่อนลบ Subtask");

      return;
    }

    const confirmDelete = window.confirm(
      `ต้องการลบ Subtask "${subtask.subtask_name}" หรือไม่?`,
    );

    if (!confirmDelete) {
      return;
    }

    try {
      setDeletingSubtaskId(subtask.id);

      const res = await axios.delete(
        `http://localhost:5000/student/subtasks/${subtask.id}`,
        {
          data: {
            student_id: Number(userId),
          },
        },
      );

      alert(res.data.message);

      setRefreshPlan((value) => value + 1);
    } catch (err: any) {
      console.log("Delete subtask error:", err);

      alert(err.response?.data?.message || "ไม่สามารถลบ Subtask ได้");
    } finally {
      setDeletingSubtaskId(null);
    }
  };

  /* =========================================================
   LOAD TASK FILES
========================================================= */

  const loadTaskFiles = async () => {
    if (!taskId) {
      return;
    }

    try {
      const res = await axios.get(
        `http://localhost:5000/student/tasks/${taskId}/files`,
      );

      setTaskFiles(res.data || []);
    } catch (err) {
      console.log("Load task files error:", err);
    }
  };

  /* =========================================================
   LOAD FILES WHEN OPEN PAGE
========================================================= */

  useEffect(() => {
    loadTaskFiles();
  }, [taskId]);

  /* =========================================================
   LOAD TEACHER REVIEW FILES
========================================================= */

  const reviewStatus = taskData?.task.review_status;
  const submittedAt = taskData?.task.submitted_at;

  useEffect(() => {
    if (
      !taskId ||
      !userId ||
      (reviewStatus !== "ผ่าน" && reviewStatus !== "แก้ไข")
    ) {
      setTeacherReviewFiles([]);
      setTeacherFilesError("");
      return;
    }

    let cancelled = false;

    setTeacherFilesLoading(true);
    setTeacherFilesError("");

    axios
      .get(
        `http://localhost:5000/student/tasks/${taskId}/review-files/${userId}`,
      )
      .then((res) => {
        if (!cancelled) {
          setTeacherReviewFiles(res.data.files || []);
        }
      })
      .catch((err) => {
        console.log("Load teacher review files error:", err);

        if (!cancelled) {
          setTeacherReviewFiles([]);
          setTeacherFilesError(
            err.response?.data?.message || "ไม่สามารถโหลดไฟล์ของอาจารย์ได้",
          );
        }
      })
      .finally(() => {
        if (!cancelled) {
          setTeacherFilesLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [taskId, userId, reviewStatus, submittedAt]);

  /* =========================================================
   UPLOAD TASK FILE
========================================================= */

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];

    if (!file || !taskData || !userId) {
      return;
    }

    const maxSize = 10 * 1024 * 1024;

    if (file.size > maxSize) {
      alert("ไฟล์ต้องมีขนาดไม่เกิน 10 MB");

      e.target.value = "";

      return;
    }

    const allowedExtensions = [
      ".pdf",
      ".doc",
      ".docx",
      ".ppt",
      ".pptx",
      ".jpg",
      ".jpeg",
      ".png",
    ];

    const extension = "." + (file.name.split(".").pop() || "").toLowerCase();

    if (!allowedExtensions.includes(extension)) {
      alert("รองรับเฉพาะ PDF, DOC, DOCX, PPT, PPTX, JPG และ PNG");

      e.target.value = "";

      return;
    }

    const formData = new FormData();

    formData.append("file", file);

    formData.append("student_id", userId);

    try {
      setUploadingFile(true);

      const res = await axios.post(
        `http://localhost:5000/student/tasks/${taskData.task.id}/files`,
        formData,
      );

      alert(res.data.message);

      await loadTaskFiles();
    } catch (err: any) {
      console.log("Upload file error:", err);

      alert(err.response?.data?.message || "ไม่สามารถแนบเอกสารได้");
    } finally {
      setUploadingFile(false);

      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  /* =========================================================
   DELETE TASK FILE
========================================================= */

  const handleDeleteFile = async (file: TaskFile) => {
    if (!userId) {
      return;
    }

    const confirmDelete = window.confirm(
      `ต้องการลบไฟล์ "${file.original_name}" หรือไม่?`,
    );

    if (!confirmDelete) {
      return;
    }

    try {
      setDeletingFileId(file.id);

      const res = await axios.delete(
        `http://localhost:5000/student/task-files/${file.id}`,
        {
          data: {
            student_id: Number(userId),
          },
        },
      );

      alert(res.data.message);

      await loadTaskFiles();
    } catch (err: any) {
      console.log("Delete file error:", err);

      alert(err.response?.data?.message || "ไม่สามารถลบเอกสารได้");
    } finally {
      setDeletingFileId(null);
    }
  };

  /* =========================================================
   FORMAT FILE SIZE
========================================================= */

  const formatFileSize = (bytes: number | null) => {
    if (!bytes) {
      return "-";
    }

    if (bytes < 1024) {
      return `${bytes} B`;
    }

    if (bytes < 1024 * 1024) {
      return `${(bytes / 1024).toFixed(1)} KB`;
    }

    return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  };

  /* =========================================================
   OPEN SUBMIT REVIEW MODAL
========================================================= */

  const handleOpenSubmitReview = () => {
    if (!taskData) {
      return;
    }

    if (taskData.task.status !== "เสร็จสิ้น") {
      alert("กรุณาดำเนินงานให้เสร็จสิ้นก่อน");

      return;
    }

    if (hasProgressChanges) {
      alert("กรุณาบันทึกความคืบหน้าก่อนส่งงาน");

      return;
    }

    setSubmissionNote("");

    setShowSubmitReviewModal(true);
  };

  /* =========================================================
   SUBMIT TO ADVISOR
========================================================= */

  const handleSubmitReview = async () => {
    if (!taskData || !userId) {
      return;
    }

    if (taskFiles.length === 0) {
      alert("กรุณาแนบเอกสารอย่างน้อย 1 ไฟล์ก่อนส่งให้อาจารย์ตรวจ");

      return;
    }

    try {
      setSubmittingReview(true);

      const res = await axios.post(
        `http://localhost:5000/student/tasks/${taskData.task.id}/submit-review`,
        {
          student_id: Number(userId),

          submission_note: submissionNote.trim(),
        },
      );

      alert(res.data.message);

      setShowSubmitReviewModal(false);

      setSubmissionNote("");

      // โหลด task ใหม่
      // review_status จะกลายเป็น "รอตรวจ"

      setRefreshPlan((value) => value + 1);
    } catch (err: any) {
      console.log("Submit review error:", err);

      alert(err.response?.data?.message || "ไม่สามารถส่งงานให้อาจารย์ตรวจได้");
    } finally {
      setSubmittingReview(false);
    }
  };

  /* =========================================================
     DATE
  ========================================================= */

  const formatThaiDate = (value: string | null) => {
    if (!value) {
      return "-";
    }

    const date = new Date(value);

    return date.toLocaleDateString("th-TH", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  /* =========================================================
   DATE AND TIME
========================================================= */

  const formatThaiDateTime = (value: string | null) => {
    if (!value) {
      return "-";
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return "-";
    }

    const dateText = date.toLocaleDateString("th-TH", {
      day: "numeric",
      month: "short",
      year: "numeric",
      timeZone: "Asia/Bangkok",
    });

    const timeText = date.toLocaleTimeString("th-TH", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
      timeZone: "Asia/Bangkok",
    });

    return `${dateText} เวลา ${timeText} น.`;
  };

  /* =========================================================
     LOGOUT
  ========================================================= */

  const handleLogout = () => {
    sessionStorage.clear();

    navigate("/");
  };

  /* =========================================================
     LOADING
  ========================================================= */

  if (loading) {
    return (
      <div className="student-task-page-loading">กำลังโหลดรายละเอียดงาน...</div>
    );
  }

  if (!taskData) {
    return <div className="student-task-page-loading">ไม่พบข้อมูลงาน</div>;
  }

  const { task, phase } = taskData;

  /* =========================================================
   REVIEW STATUS
========================================================= */

  const isWaitingReview = task.review_status === "รอตรวจ";

  const isPassed = task.review_status === "ผ่าน";

  const isRevision = task.review_status === "แก้ไข";

  const canManageFiles =
    task.review_status === "ยังไม่ส่ง" ||
    (isRevision && !!task.revision_started_at);

  /* =========================================================
     RENDER
  ========================================================= */

  return (
    <div className="student-task-page">
      {/* =====================================================
          SIDEBAR
      ===================================================== */}

      <aside className="student-task-sidebar">
        <div className="student-task-logo">
          <img src={logo} alt="SPTC Logo" />

          <div>
            <h2>SPTC System</h2>

            <p>ระบบติดตามและสื่อสารโครงงานนิสิต</p>
          </div>
        </div>

        <nav>
          <ul>
            <li onClick={() => navigate("/StudentHome")}>หน้าหลัก</li>

            <li onClick={() => navigate("/teachers")}>รายชื่ออาจารย์</li>

            <li onClick={() => navigate("/submit-new-project")}>
              ส่งคำเสนอโครงงานใหม่
            </li>

            <li className="active" onClick={() => navigate("/student-project")}>
              โครงงานของฉัน
            </li>

            <li onClick={() => navigate("/student-notifications")}>
              การแจ้งเตือน
            </li>

            <li>ข้อมูลส่วนตัว</li>
          </ul>
        </nav>

        <button className="student-task-logout" onClick={handleLogout}>
          ออกจากระบบ
        </button>
      </aside>

      {/* =====================================================
          MAIN
      ===================================================== */}

      <main className="student-task-main">
        {/* ===================================================
            HEADER
        =================================================== */}

        <header className="student-task-header">
          <h2>
            <span
              className="student-task-breadcrumb"
              onClick={() => navigate("/student-project")}
            >
              โครงงานของฉัน
            </span>

            {" > "}

            <span
              className="student-task-breadcrumb"
              onClick={() => navigate(`/student-project-detail/${projectId}`)}
            >
              รายละเอียดโครงงาน
            </span>

            {" > "}

            <span
              className="student-task-breadcrumb"
              onClick={() =>
                navigate(`/student-project-detail/${projectId}/plan`)
              }
            >
              แผนงาน
            </span>

            {" > "}

            <span>รายละเอียดงาน</span>
          </h2>

          <div className="student-task-header-right">
            <StudentNotificationBell />

            <div className="student-task-user">
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

        {/* ===================================================
            CONTENT
        =================================================== */}

        <div className="student-task-content">
          {/* PROJECT NAME */}

          <div className="student-task-project-heading">
            <h3>{project?.title || "-"}</h3>
          </div>

          {/* TABS */}

          <div className="student-task-tabs">
            <button
              onClick={() => navigate(`/student-project-detail/${projectId}`)}
            >
              ภาพรวม
            </button>

            <button
              className="active"
              onClick={() =>
                navigate(`/student-project-detail/${projectId}/plan`)
              }
            >
              แผนงาน
            </button>

            <button
              type="button"
              onClick={() =>
                navigate(`/student-project-detail/${projectId}/documents`)
              }
            >
              เอกสารและการส่งงาน
            </button>

            <button>กำหนดการสอบ</button>

            <button>ผลการประเมิน</button>
          </div>

          {/* =================================================
              TASK DETAIL
          ================================================= */}

          <section className="student-task-container">
            <h3>รายละเอียดงาน</h3>

            <div className="student-task-detail-card">
              {/* TITLE + STATUS */}

              <div className="student-task-title-row">
                <div className="student-task-title">
                  <strong>{task.task_name}</strong>
                </div>

                <span
                  className={`student-task-status ${
                    task.status === "ยังไม่เริ่ม"
                      ? "not-started"
                      : task.status === "กำลังดำเนินการ"
                        ? "working"
                        : "completed"
                  }`}
                >
                  {task.status}
                </span>
              </div>

              <div className="student-task-divider" />

              {/* REVIEW STATUS */}

              {(isWaitingReview || isPassed || isRevision) && (
                <div className="student-task-review-row">
                  <span>สถานะการตรวจ :</span>

                  <span
                    className={`student-task-review-badge ${
                      isWaitingReview
                        ? "waiting"
                        : isPassed
                          ? "passed"
                          : "revision"
                    }`}
                  >
                    {isRevision ? "ต้องแก้ไข" : task.review_status}
                  </span>
                </div>
              )}

              {/* BASIC INFO */}

              <div className="student-task-info">
                <p>
                  Phase {phase.phase_order}
                  {" : "}
                  {phase.phase_name}
                </p>

                <p>ผู้รับผิดชอบ : {task.assignee_name || "-"}</p>

                <p>วันที่เริ่มต้น : {formatThaiDate(task.start_date)}</p>

                <p>กำหนดส่ง : {formatThaiDate(task.due_date)}</p>

                {/* วันที่ส่งตรวจ */}

                {(isWaitingReview || isPassed || isRevision) &&
                  task.submitted_at && (
                    <p>
                      {isRevision ? "ส่งตรวจครั้งล่าสุด : " : "ส่งตรวจ : "}

                      {formatThaiDateTime(task.submitted_at)}
                    </p>
                  )}
              </div>

              {/* DESCRIPTION */}

              <div className="student-task-section">
                <h4>รายละเอียดงาน</h4>

                <p>{task.description || "-"}</p>
              </div>

              {/* SUBTASK */}

              <div className="student-task-section">
                {/* =========================================
      SUBTASK HEADER
  ========================================= */}

                <div className="student-subtask-header">
                  <h4>
                    Subtask : {completedDraftSubtasks}
                    {" / "}
                    {draftSubtasks.length}
                  </h4>

                  {canEditSubtasks && (
                    <button
                      type="button"
                      className="student-add-subtask-btn"
                      disabled={savingProgress}
                      onClick={handleOpenAddSubtask}
                    >
                      <FaPlus />
                      เพิ่ม Subtask
                    </button>
                  )}
                </div>

                {/* =========================================
      SUBTASK LIST
  ========================================= */}

                {draftSubtasks.length === 0 ? (
                  <p className="student-task-empty">ไม่มี Subtask</p>
                ) : (
                  <div className="student-task-subtasks">
                    {draftSubtasks.map((subtask) => (
                      <div
                        key={subtask.id}
                        className={`student-task-subtask-row ${
                          subtask.status === "เสร็จสิ้น" ? "completed" : ""
                        }`}
                      >
                        {/* CHECKBOX + NAME */}

                        <label className="student-task-subtask-check">
                          <input
                            type="checkbox"
                            checked={subtask.status === "เสร็จสิ้น"}
                            disabled={!canEditProgress || savingProgress}
                            onChange={() => handleToggleSubtask(subtask.id)}
                          />

                          <span>{subtask.subtask_name}</span>
                        </label>

                        {/* EDIT / DELETE */}

                        {canEditSubtasks && (
                          <div className="student-subtask-actions">
                            {/* EDIT SUBTASK */}

                            <button
                              type="button"
                              className="student-subtask-edit-btn"
                              title="แก้ไข Subtask"
                              disabled={deletingSubtaskId === subtask.id}
                              onClick={() => handleOpenEditSubtask(subtask)}
                            >
                              <FaEdit />
                            </button>

                            {/* DELETE SUBTASK */}

                            <button
                              type="button"
                              className="student-subtask-delete-btn"
                              title="ลบ Subtask"
                              disabled={deletingSubtaskId === subtask.id}
                              onClick={() => handleDeleteSubtask(subtask)}
                            >
                              <FaTrash />
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* PROGRESS */}

              <div className="student-task-section">
                <h4>ความคืบหน้า</h4>

                <div className="student-task-progress-row">
                  <div className="student-task-progress-bar">
                    <div
                      className="student-task-progress-fill"
                      style={{
                        width: `${progress}%`,
                      }}
                    />
                  </div>

                  <span className="student-task-progress-percent">
                    {progress}%
                  </span>
                </div>
              </div>

              {/* ATTACHMENT */}

              <div className="student-task-section">
                <div className="student-task-file-header">
                  <h4>เอกสารแนบ</h4>

                  {canManageFiles && (
                    <>
                      <button
                        type="button"
                        className="student-task-file-btn"
                        disabled={uploadingFile || !canEditSubtasks}
                        onClick={() => fileInputRef.current?.click()}
                      >
                        <FaPaperclip />
                        {uploadingFile ? "กำลังอัปโหลด..." : "แนบเอกสาร"}
                      </button>

                      <input
                        ref={fileInputRef}
                        type="file"
                        className="student-task-file-input"
                        accept=".pdf,.doc,.docx,.ppt,.pptx,.jpg,.jpeg,.png"
                        onChange={handleFileChange}
                      />
                    </>
                  )}
                </div>

                {taskFiles.length === 0 ? (
                  <p className="student-task-no-file">ยังไม่มีเอกสารแนบ</p>
                ) : (
                  <div className="student-task-file-list">
                    {taskFiles.map((file) => (
                      <div key={file.id} className="student-task-file-item">
                        <div className="student-task-file-info">
                          <FaPaperclip />

                          <div>
                            <strong>{file.original_name}</strong>

                            <span>
                              {formatFileSize(file.file_size)}
                              {" • "}
                              อัปโหลดโดย {file.uploader_name}
                            </span>
                          </div>
                        </div>

                        {canManageFiles && (
                          <div className="student-task-file-actions">
                            <a
                              href={`http://localhost:5000${file.file_path}`}
                              target="_blank"
                              rel="noreferrer"
                              className="student-task-file-download"
                            >
                              <FaDownload />
                              ดาวน์โหลด
                            </a>

                            {Number(file.uploader_id) === Number(userId) && (
                              <button
                                type="button"
                                className="student-task-file-delete"
                                disabled={deletingFileId === file.id}
                                onClick={() => handleDeleteFile(file)}
                              >
                                <FaTrash />
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* SUBMISSION NOTE */}

              {(isWaitingReview || isPassed || isRevision) && (
                <div className="student-task-section">
                  <h4>หมายเหตุถึงอาจารย์</h4>

                  <div className="student-task-submission-note">
                    {task.submission_note?.trim() || "-"}
                  </div>
                </div>
              )}
            </div>

            {/* =====================================================
    TEACHER REVIEW RESULT
===================================================== */}

            {(isPassed || isRevision) && (
              <div className="student-task-review-result">
                <h3>ผลการตรวจงาน</h3>

                <div className="student-task-review-result-divider" />

                {/* REVIEW STATUS */}

                <div className="student-task-review-result-row">
                  <span>สถานะการตรวจ :</span>

                  <span
                    className={`student-task-review-badge ${
                      isPassed ? "passed" : "revision"
                    }`}
                  >
                    {isPassed ? "ผ่าน" : "ต้องแก้ไข"}
                  </span>
                </div>

                {/* REVIEW INFORMATION */}

                <div className="student-task-review-result-info">
                  <p>ตรวจโดย : {task.reviewed_by_name || "-"}</p>

                  <p>วันที่ตรวจ : {formatThaiDateTime(task.reviewed_at)}</p>
                </div>

                {/* TEACHER COMMENT */}

                <div className="student-task-review-result-section">
                  <h4>ข้อเสนอแนะจากอาจารย์</h4>

                  <div className="student-task-review-comment">
                    {task.teacher_comment?.trim() || "-"}
                  </div>
                </div>

                {/* TEACHER FILES */}

                {(teacherFilesLoading ||
                  teacherFilesError ||
                  teacherReviewFiles.length > 0) && (
                  <div className="student-task-review-result-section">
                    <h4>ไฟล์จากอาจารย์</h4>

                    {teacherFilesLoading ? (
                      <p>กำลังโหลดไฟล์จากอาจารย์...</p>
                    ) : teacherFilesError ? (
                      <p>{teacherFilesError}</p>
                    ) : (
                      <div className="student-task-teacher-files">
                        {teacherReviewFiles.map((file) => (
                          <a
                            key={file.id}
                            href={`http://localhost:5000${file.file_path}`}
                            target="_blank"
                            rel="noreferrer"
                            className="student-task-teacher-file"
                          >
                            <FaPaperclip />
                            <span>{file.original_name}</span>
                          </a>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* BUTTON */}

            <div className="student-task-actions">
              {/* กลับไปยังแผนงาน */}

              <button
                type="button"
                className="student-task-back-btn"
                onClick={() =>
                  navigate(`/student-project-detail/${projectId}/plan`)
                }
              >
                กลับไปยังแผนงาน
              </button>

              {/* =========================================
      ยังไม่กดดำเนินการแก้ไข
  ========================================= */}

              {isRevision && !task.revision_started_at && (
                <button
                  type="button"
                  className="student-task-revision-start-btn"
                  disabled={startingRevision}
                  onClick={handleStartRevision}
                >
                  {startingRevision ? "กำลังเริ่มแก้ไข..." : "ดำเนินการแก้ไข"}
                </button>
              )}

              {/* =========================================
      กำลังดำเนินงาน / กำลังแก้ไข
  ========================================= */}

              {task.status !== "เสร็จสิ้น" &&
                (task.review_status === "ยังไม่ส่ง" ||
                  (isRevision && !!task.revision_started_at)) && (
                  <button
                    type="button"
                    className={`student-task-save-btn ${
                      isRevision ? "revision-save" : ""
                    }`}
                    disabled={
                      !canEditProgress ||
                      savingProgress ||
                      (!isRevision && !hasProgressChanges)
                    }
                    onClick={handleSaveProgress}
                  >
                    {savingProgress ? "กำลังบันทึก..." : "บันทึกความคืบหน้า"}
                  </button>
                )}

              {/* =========================================
      งานเสร็จแล้ว พร้อมส่งตรวจ
  ========================================= */}

              {task.status === "เสร็จสิ้น" &&
                (task.review_status === "ยังไม่ส่ง" ||
                  (isRevision && !!task.revision_started_at)) && (
                  <button
                    type="button"
                    className="student-task-submit-review-btn"
                    onClick={handleOpenSubmitReview}
                  >
                    {isRevision
                      ? "ส่งงานแก้ไขให้อาจารย์ตรวจ"
                      : "ส่งให้อาจารย์ตรวจ"}
                  </button>
                )}

              {/* รออาจารย์ตรวจ */}

              {isWaitingReview && (
                <button
                  type="button"
                  className="student-task-waiting-review-btn"
                  disabled
                >
                  รออาจารย์ตรวจ
                </button>
              )}

              {/* ผ่านการตรวจแล้ว */}

              {isPassed && (
                <button
                  type="button"
                  className="student-task-passed-btn"
                  disabled
                >
                  ผ่านการตรวจแล้ว
                </button>
              )}
            </div>
          </section>
        </div>
      </main>
      {/* =====================================================
        ADD SUBTASK MODAL
    ===================================================== */}

      {showAddSubtaskModal && (
        <div className="student-subtask-modal-overlay">
          <div className="student-subtask-modal">
            <h3>เพิ่ม Subtask</h3>

            <div className="student-subtask-modal-divider" />

            <label>
              ชื่อ Subtask
              <span>*</span>
            </label>

            <input
              type="text"
              value={newSubtaskName}
              placeholder="กรอกชื่อ Subtask"
              onChange={(e) => setNewSubtaskName(e.target.value)}
            />

            <div className="student-subtask-modal-actions">
              <button
                type="button"
                className="student-subtask-modal-cancel"
                disabled={addingSubtask}
                onClick={() => {
                  setShowAddSubtaskModal(false);

                  setNewSubtaskName("");
                }}
              >
                ยกเลิก
              </button>

              <button
                type="button"
                className="student-subtask-modal-save"
                disabled={!newSubtaskName.trim() || addingSubtask}
                onClick={handleAddSubtask}
              >
                {addingSubtask ? "กำลังเพิ่ม..." : "เพิ่ม Subtask"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================
        EDIT SUBTASK MODAL
    ===================================================== */}

      {editingSubtask && (
        <div className="student-subtask-modal-overlay">
          <div className="student-subtask-modal">
            <h3>แก้ไข Subtask</h3>

            <div className="student-subtask-modal-divider" />

            <label>
              ชื่อ Subtask
              <span>*</span>
            </label>

            <input
              type="text"
              value={editSubtaskName}
              onChange={(e) => setEditSubtaskName(e.target.value)}
            />

            <div className="student-subtask-modal-actions">
              <button
                type="button"
                className="student-subtask-modal-cancel"
                disabled={savingSubtask}
                onClick={() => {
                  setEditingSubtask(null);

                  setEditSubtaskName("");
                }}
              >
                ยกเลิก
              </button>

              <button
                type="button"
                className="student-subtask-modal-save"
                disabled={!editSubtaskName.trim() || savingSubtask}
                onClick={handleSaveEditSubtask}
              >
                {savingSubtask ? "กำลังบันทึก..." : "บันทึกการแก้ไข"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================
    SUBMIT REVIEW MODAL
===================================================== */}

      {showSubmitReviewModal && taskData && (
        <div className="student-submit-review-overlay">
          <div className="student-submit-review-modal">
            {/* TITLE */}

            <h3>ส่งงานให้อาจารย์ตรวจ</h3>

            <div className="student-submit-review-divider" />

            {/* TASK */}

            <div className="student-submit-review-info">
              <strong>{task.task_name}</strong>

              <p>
                Phase {phase.phase_order}
                {" : "}
                {phase.phase_name}
              </p>

              <p>ผู้รับผิดชอบ : {task.assignee_name || "-"}</p>
            </div>

            {/* FILE */}

            <div className="student-submit-review-section">
              <h4>เอกสารประกอบการส่งงาน</h4>

              {taskFiles.length === 0 ? (
                <p className="student-submit-no-file">ยังไม่มีเอกสารแนบ</p>
              ) : (
                <div className="student-submit-file-list">
                  {taskFiles.map((file) => (
                    <a
                      key={file.id}
                      href={`http://localhost:5000${file.file_path}`}
                      target="_blank"
                      rel="noreferrer"
                      className="student-submit-file"
                    >
                      <FaPaperclip />

                      {file.original_name}
                    </a>
                  ))}
                </div>
              )}
            </div>

            {/* NOTE */}

            <div className="student-submit-review-section">
              <label>หมายเหตุถึงอาจารย์</label>

              <textarea
                value={submissionNote}
                onChange={(e) => setSubmissionNote(e.target.value)}
                placeholder="ระบุข้อความถึงอาจารย์ (ถ้ามี)"
              />
            </div>

            {/* WARNING */}

            <div className="student-submit-review-warning">
              <strong>โปรดตรวจสอบข้อมูลและเอกสารให้เรียบร้อยก่อนส่ง</strong>

              <p>เมื่อส่งแล้วจะไม่สามารถแก้ไขงานได้ จนกว่าอาจารย์จะตรวจสอบ</p>
            </div>

            {/* ACTION */}

            <div className="student-submit-review-actions">
              <button
                type="button"
                className="student-submit-review-cancel"
                disabled={submittingReview}
                onClick={() => {
                  setShowSubmitReviewModal(false);

                  setSubmissionNote("");
                }}
              >
                ยกเลิก
              </button>

              <button
                type="button"
                className="student-submit-review-confirm"
                disabled={submittingReview || taskFiles.length === 0}
                onClick={handleSubmitReview}
              >
                {submittingReview ? "กำลังส่ง..." : "ยืนยันการส่ง"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default StudentTaskDetail;
