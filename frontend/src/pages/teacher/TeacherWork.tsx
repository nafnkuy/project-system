import "./TeacherWork.css";

import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { createPortal } from "react-dom";
import { FaSearch } from "react-icons/fa";

import logo from "../../assets/Logo.svg";
import TeacherNotificationBell from "./TeacherNotificationBell";

/* =========================================================
   INTERFACE
========================================================= */

interface ReviewTask {
  id: number;
  project_id: number;
  task_name: string;
  project_title: string;

  assignee_name: string | null;
  submitted_at: string | null;
  reviewed_at: string | null;

  review_status: "รอตรวจ" | "ผ่าน" | "แก้ไข";

  // เลขรอบการส่งล่าสุด
  submission_number: number | null;

  // ผลการตรวจจากรอบก่อนหน้า
  previous_review_status: "รอตรวจ" | "ผ่าน" | "แก้ไข" | null;
}

/* =========================================================
   EXAM SCHEDULE INTERFACE
========================================================= */

interface ExamProject {
  project_id: number;
  project_title: string;
  academic_year: string | null;
  student_names: string | null;

  schedule_id: number | null;
  exam_date: string | null;
  start_time: string | null;
  end_time: string | null;
  location: string | null;
  committee: string | null;
  notes: string | null;
  announced_at: string | null;
}
interface PendingExamRequest {
  request_id: number;
  project_id: number;
  student_id: number;
  status: string;
  requested_at: string;
  project_title: string;
  project_type: string;
  academic_year: string;
  student_username: string;
  student_name: string;
  student_names: string | null;
}

interface PendingExamRequestsResponse {
  pending: PendingExamRequest[];
  pending_count: number;
}

interface ExamListResponse {
  pending: ExamProject[];
  announced: ExamProject[];
  pending_count: number;
  announced_count: number;
}

/* =========================================================
   EXAM COMMITTEE INTERFACE
========================================================= */

interface ExamCommitteeMember {
  committee_member_id: number;
  schedule_id: number;
  teacher_id: number;
  teacher_username: string;
  teacher_name: string;
  invitation_status: string;
  invited_at: string;
  responded_at: string | null;
}

/* =========================================
   TEACHER SEARCH OPTION
========================================= */

interface TeacherOption {
  id: number;
  username: string;
  name: string;
  major: string | null;
}

/* =========================================================
   EXAM EVALUATION INTERFACE
========================================================= */

interface EvaluationProject {
  committee_member_id: number;

  schedule_id: number;
  project_id: number;
  project_title: string;

  exam_date: string;
  start_time: string;
  end_time: string;
  location: string;

  advisor_name: string;
  student_names: string;

  evaluation_id: number | null;
  total_score: number | null;
  evaluated_at: string | null;
}

interface EvaluationListResponse {
  pending: EvaluationProject[];
  evaluated: EvaluationProject[];
  pending_count: number;
  evaluated_count: number;
}

type WorkTab = "review" | "exam" | "evaluation";
interface ExamRevisionItem {
  submission_id: number;
  project_id: number;
  project_title: string;
  student_username: string;
  student_name: string;
  description: string;
  submitted_at: string;
  status: string;
  work_type: string;
  files: {
    name: string;
    path: string;
    size: number;
  }[];
}

interface ExamRevisionResponse {
  pending: ExamRevisionItem[];
  pending_count: number;
}
type ReviewFilter = "รอตรวจ" | "ตรวจแล้ว" | "งานแก้ไขหลังสอบ";

/* =========================================================
   COMPONENT
========================================================= */

function TeacherWork() {
  const navigate = useNavigate();

  const userId = sessionStorage.getItem("userId");
  const username = sessionStorage.getItem("username");
  const profileImage = sessionStorage.getItem("profileImage");

  /* =========================================================
     STATE
  ========================================================= */

  const [tasks, setTasks] = useState<ReviewTask[]>([]);

  const [activeTab, setActiveTab] = useState<WorkTab>(() => {
    const tab = new URLSearchParams(window.location.search).get("tab");

    if (tab === "exam" || tab === "evaluation") {
      return tab;
    }

    return "review";
  });

  const [reviewFilter, setReviewFilter] = useState<ReviewFilter>("รอตรวจ");

  const [searchTerm, setSearchTerm] = useState("");

  const [currentPage, setCurrentPage] = useState(1);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  /* =========================================================
   EXAM SCHEDULE STATE
========================================================= */

  const [examData, setExamData] = useState<ExamListResponse>({
    pending: [],
    announced: [],
    pending_count: 0,
    announced_count: 0,
  });

  const [examFilter, setExamFilter] = useState<"รอประกาศ" | "ประกาศแล้ว">(
    "รอประกาศ",
  );

  const [examSearchTerm, setExamSearchTerm] = useState("");

  const [examLoading, setExamLoading] = useState(true);
  const [examError, setExamError] = useState("");

  /* =========================================================
   PENDING EXAM REQUESTS
========================================================= */

  const [examRequests, setExamRequests] = useState<PendingExamRequest[]>([]);

  const [examRequestsLoading, setExamRequestsLoading] = useState(true);

  const [examRequestsError, setExamRequestsError] = useState("");
  const [selectedExamRequest, setSelectedExamRequest] =
    useState<PendingExamRequest | null>(null);

  /* =========================================================
   EXAM ANNOUNCEMENT MODAL
========================================================= */

  const [selectedExamProject, setSelectedExamProject] =
    useState<ExamProject | null>(null);

  const [examForm, setExamForm] = useState({
    exam_date: "",
    start_time: "",
    end_time: "",
    location: "",
    committee: "",
    notes: "",
  });

  const [examFormError, setExamFormError] = useState("");

  /* =========================================
   SELECT EXAM COMMITTEE
========================================= */

  const [teacherOptions, setTeacherOptions] = useState<TeacherOption[]>([]);

  const [committeeSearch, setCommitteeSearch] = useState("");

  const [selectedCommitteeTeachers, setSelectedCommitteeTeachers] = useState<
    TeacherOption[]
  >([]);

  const [teacherOptionsLoading, setTeacherOptionsLoading] = useState(false);

  const [teacherOptionsError, setTeacherOptionsError] = useState("");

  const [showExamConfirm, setShowExamConfirm] = useState(false);

  /* =========================================================
   EXAM DETAIL MODAL
========================================================= */

  const [examDetailProject, setExamDetailProject] =
    useState<ExamProject | null>(null);

  /* =========================================================
   EXAM COMMITTEE STATE
========================================================= */

  const [committeeMembers, setCommitteeMembers] = useState<
    ExamCommitteeMember[]
  >([]);

  const [committeeLoading, setCommitteeLoading] = useState(false);

  const [committeeError, setCommitteeError] = useState("");

  /* =========================================================
   EDIT EXAM SCHEDULE STATE
========================================================= */

  const [examEditProject, setExamEditProject] = useState<ExamProject | null>(
    null,
  );

  const [examEditForm, setExamEditForm] = useState({
    exam_date: "",
    start_time: "",
    end_time: "",
    location: "",
    committee: "",
    notes: "",
  });

  const [examEditError, setExamEditError] = useState("");
  const [examEditSaving, setExamEditSaving] = useState(false);

  const [showExamCancelConfirm, setShowExamCancelConfirm] = useState(false);

  const [examCancelling, setExamCancelling] = useState(false);

  const [examCancelError, setExamCancelError] = useState("");

  const [editCommitteeSearch, setEditCommitteeSearch] = useState("");

  const [editTeacherOptions, setEditTeacherOptions] = useState<TeacherOption[]>(
    [],
  );

  const [editSelectedTeachers, setEditSelectedTeachers] = useState<
    TeacherOption[]
  >([]);

  const [editCommitteeLoading, setEditCommitteeLoading] = useState(false);

  const [examSubmitting, setExamSubmitting] = useState(false);

  /* =========================================================
   EVALUATION STATE
========================================================= */

  const [evaluationData, setEvaluationData] = useState<EvaluationListResponse>({
    pending: [],
    evaluated: [],
    pending_count: 0,
    evaluated_count: 0,
  });

  const [evaluationFilter, setEvaluationFilter] = useState<
    "รอประเมิน" | "ประเมินแล้ว"
  >("รอประเมิน");

  const [evaluationSearch, setEvaluationSearch] = useState("");

  const [evaluationLoading, setEvaluationLoading] = useState(true);

  const [evaluationError, setEvaluationError] = useState("");
  const [examRevisions, setExamRevisions] = useState<ExamRevisionResponse>({
    pending: [],
    pending_count: 0,
  });

  const [examRevisionLoading, setExamRevisionLoading] = useState(false);

  const [examRevisionError, setExamRevisionError] = useState("");

  const [selectedEvaluation, setSelectedEvaluation] =
    useState<EvaluationProject | null>(null);

  const itemsPerPage = 10;

  /* =========================================================
     CHECK LOGIN
  ========================================================= */

  useEffect(() => {
    if (!userId) {
      navigate("/");
    }
  }, [userId, navigate]);

  /* =========================================================
     LOAD REVIEW TASKS
  ========================================================= */

  useEffect(() => {
    if (!userId) {
      return;
    }

    let cancelled = false;

    setLoading(true);
    setError("");

    axios
      .get(`http://localhost:5000/teacher/work/reviews/${userId}`)
      .then((res) => {
        if (!cancelled) {
          setTasks(res.data.tasks || []);
        }
      })
      .catch((err) => {
        console.log("Get review tasks error:", err);

        if (!cancelled) {
          setError(
            err.response?.data?.message || "ไม่สามารถโหลดรายการตรวจงานได้",
          );
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [userId]);

  /* =========================================================
   LOAD EXAM SCHEDULES
========================================================= */

  useEffect(() => {
    if (!userId) {
      setExamLoading(false);
      return;
    }

    let cancelled = false;

    setExamLoading(true);
    setExamError("");

    axios
      .get<ExamListResponse>(`http://localhost:5000/teacher/exams/${userId}`)
      .then((res) => {
        if (!cancelled) {
          setExamData(res.data);

          console.log("Exam schedules:", res.data);
        }
      })
      .catch((err) => {
        console.log("Load exam schedules error:", err);

        if (!cancelled) {
          setExamError(
            err.response?.data?.message || "ไม่สามารถโหลดกำหนดการสอบได้",
          );
        }
      })
      .finally(() => {
        if (!cancelled) {
          setExamLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [userId]);

  /* =========================================================
   LOAD PENDING EXAM REQUESTS
========================================================= */

  useEffect(() => {
    if (activeTab !== "exam" || !userId) {
      return;
    }

    let cancelled = false;

    setExamRequestsLoading(true);
    setExamRequestsError("");

    axios
      .get<PendingExamRequestsResponse>(
        `http://localhost:5000/teacher/exam-requests/${userId}`,
      )
      .then((res) => {
        if (!cancelled) {
          setExamRequests(res.data.pending || []);
        }
      })
      .catch((err) => {
        console.error("Load exam requests error:", err);

        if (!cancelled) {
          setExamRequestsError("ไม่สามารถโหลดคำขอสอบโครงงานได้");
        }
      })
      .finally(() => {
        if (!cancelled) {
          setExamRequestsLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [activeTab, userId]);

  /* =========================================================
   LOAD EXAM EVALUATIONS
========================================================= */

  useEffect(() => {
    if (!userId) {
      setEvaluationLoading(false);
      return;
    }

    let active = true;

    setEvaluationLoading(true);
    setEvaluationError("");

    axios
      .get<EvaluationListResponse>(
        `http://localhost:5000/teacher/evaluations/${userId}`,
      )
      .then((res) => {
        if (!active) return;

        setEvaluationData(res.data);
      })
      .catch((err) => {
        if (!active) return;

        console.error("Load evaluations error:", err);

        setEvaluationError(
          err.response?.data?.message || "ไม่สามารถโหลดรายการประเมินได้",
        );
      })
      .finally(() => {
        if (active) {
          setEvaluationLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [userId, activeTab, examData.announced_count]);

  /* =========================================================
   LOAD EXAM REVISION SUBMISSIONS
========================================================= */

  useEffect(() => {
    if (!userId || activeTab !== "review") {
      return;
    }

    let active = true;

    setExamRevisionLoading(true);
    setExamRevisionError("");

    axios
      .get<ExamRevisionResponse>(
        `http://localhost:5000/teacher/exam-revisions/pending/${userId}`,
      )
      .then((res) => {
        if (!active) return;

        setExamRevisions(res.data);
      })
      .catch((error) => {
        if (!active) return;

        console.error("Load exam revisions error:", error);

        setExamRevisionError("ไม่สามารถโหลดงานแก้ไขหลังสอบได้");
      })
      .finally(() => {
        if (active) {
          setExamRevisionLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [userId, activeTab]);

  /* =========================================================
   LOAD EXAM COMMITTEE MEMBERS
========================================================= */

  useEffect(() => {
    const scheduleId = examDetailProject?.schedule_id;

    if (!scheduleId || !userId) {
      setCommitteeMembers([]);
      setCommitteeLoading(false);
      setCommitteeError("");
      return;
    }

    let active = true;

    setCommitteeLoading(true);
    setCommitteeError("");
    setCommitteeMembers([]);

    axios
      .get<{ committee: ExamCommitteeMember[] }>(
        `http://localhost:5000/teacher/exam/committee-status/${scheduleId}/${userId}`,
      )
      .then((res) => {
        if (!active) return;

        setCommitteeMembers(
          Array.isArray(res.data.committee) ? res.data.committee : [],
        );
      })
      .catch((err) => {
        if (!active) return;

        console.log("Load exam committee error:", err);
        setCommitteeError("ไม่สามารถโหลดรายชื่อกรรมการสอบได้");
      })
      .finally(() => {
        if (active) {
          setCommitteeLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [examDetailProject?.schedule_id, userId]);

  /* =========================================
   LOAD TEACHERS FOR EXAM COMMITTEE
========================================= */

  useEffect(() => {
    if (!selectedExamProject || !userId) return;

    let active = true;

    setTeacherOptionsLoading(true);
    setTeacherOptionsError("");

    axios
      .get(`http://localhost:5000/teacher/exam/committee-candidates/${userId}`)
      .then((res) => {
        if (!active) return;

        setTeacherOptions(
          Array.isArray(res.data.teachers) ? res.data.teachers : [],
        );
      })
      .catch((err) => {
        if (!active) return;

        console.log("Load teacher options error:", err);
        setTeacherOptionsError("ไม่สามารถโหลดรายชื่ออาจารย์ได้");
      })
      .finally(() => {
        if (active) {
          setTeacherOptionsLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [selectedExamProject?.project_id, userId]);

  /* =========================================================
     DASHBOARD COUNTS
  ========================================================= */

  const pendingReviewCount = tasks.filter(
    (task) => task.review_status === "รอตรวจ",
  ).length;

  /* =================================================
   COMBINED EXAM TABLE
================================================= */

  const filteredExamRows = [
    ...examRequests.map((request) => ({
      rowType: "request" as const,
      id: `request-${request.request_id}`,
      projectId: request.project_id,
      projectTitle: request.project_title,
      studentNames:
        request.student_names ||
        `${request.student_username} ${request.student_name}`,
      requestedAt: request.requested_at as string | null,
      status: request.status,
      examProject: null as ExamProject | null,
    })),

    ...examData.announced.map((project) => ({
      rowType: "announced" as const,
      id: `announced-${project.project_id}`,
      projectId: project.project_id,
      projectTitle: project.project_title,
      studentNames: project.student_names || "-",
      requestedAt: null as string | null,
      status: "ประกาศแล้ว",
      examProject: project,
    })),
  ].filter((row) => {
    const matchesFilter =
      examFilter === "รอประกาศ"
        ? row.rowType === "request"
        : row.rowType === "announced";

    const keyword = examSearchTerm.trim().toLowerCase();

    const matchesSearch =
      row.projectTitle.toLowerCase().includes(keyword) ||
      row.studentNames.toLowerCase().includes(keyword);

    return matchesFilter && matchesSearch;
  });

  const examTableLoading =
    examFilter === "รอประกาศ" ? examRequestsLoading : examLoading;

  const examTableError =
    examFilter === "รอประกาศ" ? examRequestsError : examError;

  const filteredEvaluations = (
    evaluationFilter === "รอประเมิน"
      ? evaluationData.pending
      : evaluationData.evaluated
  ).filter((item) => {
    const keyword = evaluationSearch.trim().toLowerCase();

    return (
      item.project_title.toLowerCase().includes(keyword) ||
      item.student_names.toLowerCase().includes(keyword)
    );
  });

  const filteredExamRevisions = examRevisions.pending.filter((item) => {
    const keyword = searchTerm.trim().toLowerCase();

    return (
      item.project_title.toLowerCase().includes(keyword) ||
      item.student_name.toLowerCase().includes(keyword) ||
      item.student_username.toLowerCase().includes(keyword)
    );
  });

  /* =========================================================
     FILTER + SEARCH
  ========================================================= */

  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => {
      const matchesStatus =
        reviewFilter === "รอตรวจ"
          ? task.review_status === "รอตรวจ"
          : task.review_status === "ผ่าน" || task.review_status === "แก้ไข";

      const keyword = searchTerm.trim().toLowerCase();

      const matchesSearch =
        task.task_name.toLowerCase().includes(keyword) ||
        task.project_title.toLowerCase().includes(keyword) ||
        (task.assignee_name || "").toLowerCase().includes(keyword);

      return matchesStatus && matchesSearch;
    });
  }, [tasks, reviewFilter, searchTerm]);

  /* =========================================================
     PAGINATION
  ========================================================= */

  const totalPages = Math.max(
    1,
    Math.ceil(filteredTasks.length / itemsPerPage),
  );

  const currentTasks = filteredTasks.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage,
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, reviewFilter, activeTab]);

  /* =========================================================
     FORMAT DATE
  ========================================================= */

  const formatThaiDate = (value: string | null) => {
    if (!value) {
      return "-";
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return "-";
    }

    return date.toLocaleDateString("th-TH", {
      day: "numeric",
      month: "short",
      year: "numeric",
      timeZone: "Asia/Bangkok",
    });
  };

  /* =========================================
   SELECT COMMITTEE TEACHER
========================================= */

  const addCommitteeTeacher = (teacher: TeacherOption) => {
    const alreadySelected = selectedCommitteeTeachers.some(
      (item) => item.id === teacher.id,
    );

    if (alreadySelected) return;

    const next = [...selectedCommitteeTeachers, teacher];

    setSelectedCommitteeTeachers(next);
    setCommitteeSearch("");

    setExamForm((prev) => ({
      ...prev,
      committee: next.map((item) => item.name).join("\n"),
    }));
  };

  /* =========================================
   REMOVE COMMITTEE TEACHER
========================================= */

  const removeCommitteeTeacher = (teacherId: number) => {
    const next = selectedCommitteeTeachers.filter(
      (item) => item.id !== teacherId,
    );

    setSelectedCommitteeTeachers(next);

    setExamForm((prev) => ({
      ...prev,
      committee: next.map((item) => item.name).join("\n"),
    }));
  };

  /* =========================================================
   OPEN / CLOSE EXAM MODAL
========================================================= */

  const openExamModal = (project: ExamProject) => {
    setSelectedCommitteeTeachers([]);
    setCommitteeSearch("");
    setTeacherOptions([]);
    setSelectedExamProject(project);

    setExamForm({
      exam_date: "",
      start_time: "",
      end_time: "",
      location: "",
      committee: "",
      notes: "",
    });

    setExamFormError("");
    setShowExamConfirm(false);
  };

  const closeExamModal = () => {
    setSelectedExamProject(null);
    setExamFormError("");
    setShowExamConfirm(false);
  };

  /* =========================================================
   CONFIRM EXAM ANNOUNCEMENT
========================================================= */

  const confirmExamAnnouncement = async () => {
    if (!selectedExamProject || !userId || examSubmitting) {
      return;
    }

    setExamSubmitting(true);
    setExamFormError("");

    try {
      // 1. บันทึกกำหนดการสอบ

      await axios.post("http://localhost:5000/teacher/exams", {
        project_id: selectedExamProject.project_id,
        advisor_id: Number(userId),

        exam_date: examForm.exam_date,
        start_time: examForm.start_time,
        end_time: examForm.end_time,

        location: examForm.location,
        committee: examForm.committee,
        notes: examForm.notes,

        // ส่ง ID ของอาจารย์ที่เลือกไปยัง Backend
        committee_teacher_ids: selectedCommitteeTeachers.map(
          (teacher) => teacher.id,
        ),
      });

      // 2. ปิด Modal หลังบันทึกสำเร็จ

      closeExamModal();

      // 3. เปลี่ยนไปแสดงแท็บประกาศแล้ว

      setExamFilter("ประกาศแล้ว");

      // 4. โหลดข้อมูลกำหนดการสอบใหม่

      setExamLoading(true);

      try {
        const response = await axios.get<ExamListResponse>(
          `http://localhost:5000/teacher/exams/${userId}`,
        );

        setExamData(response.data);
        setExamError("");
      } catch (reloadError) {
        console.error("Reload exams error:", reloadError);

        setExamError(
          "ประกาศสำเร็จแล้ว แต่โหลดข้อมูลใหม่ไม่สำเร็จ กรุณารีเฟรชหน้า",
        );
      } finally {
        setExamLoading(false);
      }
    } catch (err) {
      console.error("Confirm exam error:", err);

      if (axios.isAxiosError(err)) {
        setExamFormError(
          err.response?.data?.message || "ไม่สามารถประกาศกำหนดการสอบได้",
        );
      } else {
        setExamFormError("ไม่สามารถประกาศกำหนดการสอบได้");
      }
    } finally {
      setExamSubmitting(false);
    }
  };

  /* =========================================================
     TAB TITLE
  ========================================================= */

  const tabTitle =
    activeTab === "review"
      ? "การตรวจงาน"
      : activeTab === "exam"
        ? "กำหนดการสอบ"
        : "การประเมิน";

  /* =========================================================
   EXAM DATE FOR INPUT
========================================================= */

  const toExamInputDate = (value: string | null) => {
    if (!value) return "";

    // ถ้าเป็น YYYY-MM-DD อยู่แล้ว
    if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
      return value;
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return "";
    }

    // แปลงวันที่ตามประเทศไทย
    const parts = new Intl.DateTimeFormat("en-US", {
      timeZone: "Asia/Bangkok",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).formatToParts(date);

    const getPart = (type: string) =>
      parts.find((part) => part.type === type)?.value || "";

    return `${getPart("year")}-` + `${getPart("month")}-` + `${getPart("day")}`;
  };

  const updateEditCommittee = (teachers: TeacherOption[]) => {
    setEditSelectedTeachers(teachers);

    setExamEditForm((prev) => ({
      ...prev,
      committee: teachers.map((teacher) => teacher.name).join("\n"),
    }));
  };

  /* =========================================================
   OPEN EDIT EXAM
========================================================= */

  const openExamEdit = async () => {
    if (!examDetailProject?.schedule_id || !userId) return;

    const project = examDetailProject;

    setExamEditError("");
    setEditCommitteeSearch("");
    setEditCommitteeLoading(true);
    setEditTeacherOptions([]);
    setEditSelectedTeachers([]);

    setExamEditForm({
      exam_date: toExamInputDate(project.exam_date),
      start_time: project.start_time?.slice(0, 5) || "",
      end_time: project.end_time?.slice(0, 5) || "",
      location: project.location || "",
      committee: project.committee || "",
      notes: project.notes || "",
    });

    setExamEditProject(project);
    setExamDetailProject(null);

    try {
      const [memberRes, teacherRes] = await Promise.all([
        axios.get(
          `http://localhost:5000/teacher/exam/committee-status/${project.schedule_id}/${userId}`,
        ),
        axios.get(
          `http://localhost:5000/teacher/exam/committee-candidates/${userId}`,
        ),
      ]);

      const members: ExamCommitteeMember[] = memberRes.data.committee || [];

      const teachers: TeacherOption[] = teacherRes.data.teachers || [];

      const selected = members
        .filter(
          (member) =>
            member.teacher_id !== Number(userId) &&
            member.invitation_status !== "ปฏิเสธ",
        )
        .map((member) => ({
          id: member.teacher_id,
          username: member.teacher_username,
          name: member.teacher_name,
          major: null,
        }));

      setEditTeacherOptions(teachers);
      setEditSelectedTeachers(selected);

      setExamEditForm((prev) => ({
        ...prev,
        committee: selected.map((teacher) => teacher.name).join("\n"),
      }));
    } catch (err) {
      console.error("Load edit committee error:", err);
      setExamEditError("ไม่สามารถโหลดข้อมูลกรรมการสอบได้");
    } finally {
      setEditCommitteeLoading(false);
    }
  };

  /* =========================================================
   CLOSE EDIT EXAM
========================================================= */

  const closeExamEdit = () => {
    if (examEditSaving) return;

    // กลับไปดูรายละเอียดเดิม

    setExamDetailProject(examEditProject);
    setExamEditProject(null);
    setExamEditError("");
  };

  /* =========================================================
   SAVE EDIT EXAM
========================================================= */

  const saveExamEdit = async () => {
    if (!examEditProject?.schedule_id || !userId || examEditSaving) {
      return;
    }

    if (
      editCommitteeLoading ||
      examEditError === "ไม่สามารถโหลดข้อมูลกรรมการสอบได้"
    ) {
      setExamEditError("กรุณารอหรือโหลดข้อมูลกรรมการสอบใหม่");
      return;
    }

    // ตรวจข้อมูลก่อนบันทึก

    if (
      !examEditForm.exam_date ||
      !examEditForm.start_time ||
      !examEditForm.end_time ||
      !examEditForm.location.trim()
    ) {
      setExamEditError("กรุณากรอกข้อมูลที่จำเป็นให้ครบถ้วน");
      return;
    }

    if (editSelectedTeachers.length === 0) {
      setExamEditError("กรุณาเลือกกรรมการสอบอย่างน้อย 1 ท่าน");
      return;
    }

    if (examEditForm.start_time >= examEditForm.end_time) {
      setExamEditError("เวลาสิ้นสุดต้องมากกว่าเวลาเริ่มสอบ");
      return;
    }

    setExamEditSaving(true);
    setExamEditError("");

    try {
      // 1. บันทึกข้อมูลใหม่ลง MySQL

      await axios.put(
        `http://localhost:5000/teacher/exams/${examEditProject.schedule_id}`,
        {
          advisor_id: Number(userId),

          exam_date: examEditForm.exam_date,
          start_time: examEditForm.start_time,
          end_time: examEditForm.end_time,

          location: examEditForm.location.trim(),
          notes: examEditForm.notes.trim(),

          // รายชื่อกรรมการที่เลือกจากช่องค้นหา
          committee_teacher_ids: editSelectedTeachers.map(
            (teacher) => teacher.id,
          ),
        },
      );

      // 2. ปิดฟอร์มและแสดงรายละเอียดที่แก้แล้ว

      // ปิดหน้าต่างแก้ไขและรายละเอียด
      setExamEditProject(null);
      setExamDetailProject(null);

      // กลับไปที่ตารางประกาศแล้ว
      setExamFilter("ประกาศแล้ว");

      // 3. โหลดข้อมูลใหม่จาก Backend

      try {
        const response = await axios.get<ExamListResponse>(
          `http://localhost:5000/teacher/exams/${userId}`,
        );

        setExamData(response.data);
        setExamError("");
      } catch (reloadError) {
        console.error("Reload exam after edit:", reloadError);

        setExamError(
          "บันทึกสำเร็จแล้ว แต่โหลดรายการใหม่ไม่สำเร็จ กรุณารีเฟรชหน้า",
        );
      }
    } catch (err) {
      console.error("Save exam edit error:", err);

      if (axios.isAxiosError(err)) {
        setExamEditError(
          err.response?.data?.message || "ไม่สามารถแก้ไขกำหนดการสอบได้",
        );
      } else {
        setExamEditError("ไม่สามารถแก้ไขกำหนดการสอบได้");
      }
    } finally {
      setExamEditSaving(false);
    }
  };

  const cancelExamSchedule = async () => {
    if (!examDetailProject?.schedule_id || !userId || examCancelling) {
      return;
    }

    setExamCancelling(true);
    setExamCancelError("");

    try {
      await axios.delete(
        `http://localhost:5000/teacher/exams/${examDetailProject.schedule_id}`,
        {
          data: {
            advisor_id: Number(userId),
          },
        },
      );

      // ปิด Pop-up ทั้งสองชั้น
      setShowExamCancelConfirm(false);
      setExamDetailProject(null);

      // กลับไปแสดงรายการรอประกาศ
      setExamFilter("รอประกาศ");
      setExamLoading(true);

      try {
        const response = await axios.get<ExamListResponse>(
          `http://localhost:5000/teacher/exams/${userId}`,
        );

        setExamData(response.data);
        setExamError("");
      } catch (reloadError) {
        console.error("Reload exams error:", reloadError);
        setExamError(
          "ยกเลิกสำเร็จแล้ว แต่โหลดรายการใหม่ไม่สำเร็จ กรุณารีเฟรชหน้า",
        );
      } finally {
        setExamLoading(false);
      }
    } catch (err) {
      console.error("Cancel exam error:", err);

      if (axios.isAxiosError(err)) {
        setExamCancelError(
          err.response?.data?.message || "ไม่สามารถยกเลิกกำหนดการสอบได้",
        );
      } else {
        setExamCancelError("ไม่สามารถยกเลิกกำหนดการสอบได้");
      }
    } finally {
      setExamCancelling(false);
    }
  };

  /* =========================================================
     LOGOUT
  ========================================================= */

  const handleLogout = () => {
    sessionStorage.clear();
    navigate("/");
  };

  /* =========================================================
     RENDER
  ========================================================= */

  return (
    <div className="teacher-work-page">
      {selectedExamRequest &&
        createPortal(
          <div
            className="tw-exam-request-overlay"
            onClick={() => setSelectedExamRequest(null)}
          >
            <div
              className="tw-exam-request-modal"
              onClick={(e) => e.stopPropagation()}
            >
              <h3>พิจารณาคำขอสอบโครงงาน</h3>
              <hr />

              <p>
                <strong>ชื่อโครงงาน</strong>
              </p>
              <p>{selectedExamRequest.project_title}</p>

              <p>
                <strong>นิสิต</strong>
              </p>
              <p>
                {selectedExamRequest.student_names ||
                  selectedExamRequest.student_name}
              </p>

              <p>
                <strong>วันที่ส่งคำขอ</strong>
              </p>
              <p>{formatThaiDate(selectedExamRequest.requested_at)}</p>

              <p>
                <strong>สถานะคำขอ</strong>
              </p>
              <p>{selectedExamRequest.status}</p>

              <div className="tw-exam-request-modal-actions">
                <button
                  type="button"
                  onClick={() => setSelectedExamRequest(null)}
                >
                  ปิด
                </button>
              </div>
            </div>
          </div>,
          document.body,
        )}

      {/* =====================================================
          SIDEBAR
      ===================================================== */}

      <aside className="tw-sidebar">
        <div className="tw-logo">
          <img src={logo} alt="SPTC Logo" />

          <div>
            <h2>SPTC System</h2>
            <p>ระบบติดตามและสื่อสารโครงงานนิสิต</p>
          </div>
        </div>

        <nav className="tw-nav">
          <ul>
            <li onClick={() => navigate("/teacher-home")}>หน้าหลัก</li>

            <li onClick={() => navigate("/teacher-projects")}>
              จัดการหัวข้อโครงงาน
            </li>

            <li onClick={() => navigate("/teacher-requests")}>
              คำขอเข้าร่วมโครงงาน
            </li>

            <li onClick={() => navigate("/teacher-managed-projects")}>
              โครงงานที่ดูแล
            </li>

            <li className="tw-active">งานที่ต้องดำเนินการ</li>

            <li onClick={() => navigate("/teacher-decision-history")}>
              ประวัติการพิจารณา
            </li>

            <li onClick={() => navigate("/teacher-notifications")}>
              การแจ้งเตือน
            </li>

            <li>ข้อมูลส่วนตัว</li>
          </ul>
        </nav>

        <button type="button" className="tw-logout-btn" onClick={handleLogout}>
          ออกจากระบบ
        </button>
      </aside>

      {/* =====================================================
          MAIN
      ===================================================== */}

      <main className="tw-main">
        {/* HEADER */}

        <header className="tw-header">
          <h2>
            งานที่ต้องดำเนินการ
            {" > "}
            {tabTitle}
            {activeTab === "review" && (
              <>
                {" > "}
                {reviewFilter}
              </>
            )}
          </h2>

          <div className="tw-header-right">
            <TeacherNotificationBell />

            <div className="tw-user-info">
              <img
                src={
                  profileImage ? `http://localhost:5000${profileImage}` : logo
                }
                alt="Profile"
                className="tw-profile-image"
              />

              <span>{username || "-"}</span>
            </div>
          </div>
        </header>

        {/* =====================================================
            CONTENT
        ===================================================== */}

        <div className="tw-content">
          {/* DASHBOARD CARDS */}

          <div className="tw-dashboard-cards">
            <div className="tw-dashboard-card">
              <span className="tw-card-title">งานรอตรวจ</span>

              <strong className="tw-card-number tw-blue">
                {loading ? "..." : error ? "-" : pendingReviewCount}
              </strong>
            </div>

            <div className="tw-dashboard-card">
              <span className="tw-card-title">รอประกาศกำหนดการสอบ</span>

              <strong className="tw-card-number tw-orange">
                {examLoading ? "..." : examError ? "-" : examData.pending_count}
              </strong>
            </div>

            <div className="tw-dashboard-card">
              <span className="tw-card-title">รอการประเมิน</span>

              <strong className="tw-card-number tw-yellow">
                {evaluationLoading
                  ? "..."
                  : evaluationError
                    ? "-"
                    : evaluationData.pending_count}
              </strong>
            </div>
          </div>

          {/* =================================================
              MAIN TABS
          ================================================= */}

          <div className="tw-tabs">
            <button
              type="button"
              className={
                activeTab === "review" ? "tw-tab tw-tab-active" : "tw-tab"
              }
              onClick={() => setActiveTab("review")}
            >
              การตรวจงาน
            </button>

            <button
              type="button"
              className={
                activeTab === "exam" ? "tw-tab tw-tab-active" : "tw-tab"
              }
              onClick={() => setActiveTab("exam")}
            >
              กำหนดการสอบ
            </button>

            <button
              type="button"
              className={
                activeTab === "evaluation" ? "tw-tab tw-tab-active" : "tw-tab"
              }
              onClick={() => setActiveTab("evaluation")}
            >
              การประเมิน
            </button>
          </div>

          {/* =================================================
              PANEL
          ================================================= */}

          <section className="tw-panel">
            <h3>{tabTitle}</h3>

            {activeTab === "review" ? (
              <>
                {/* STATUS FILTER */}

                <div className="tw-review-filters">
                  <button
                    type="button"
                    className={
                      reviewFilter === "รอตรวจ"
                        ? "tw-filter tw-filter-active"
                        : "tw-filter"
                    }
                    onClick={() => setReviewFilter("รอตรวจ")}
                  >
                    รอตรวจ
                  </button>

                  <button
                    type="button"
                    className={
                      reviewFilter === "ตรวจแล้ว"
                        ? "tw-filter tw-filter-active"
                        : "tw-filter"
                    }
                    onClick={() => setReviewFilter("ตรวจแล้ว")}
                  >
                    ตรวจแล้ว
                  </button>
                  <button
                    type="button"
                    className={
                      reviewFilter === "งานแก้ไขหลังสอบ"
                        ? "tw-filter tw-filter-active"
                        : "tw-filter"
                    }
                    onClick={() => setReviewFilter("งานแก้ไขหลังสอบ")}
                  >
                    งานแก้ไขหลังสอบ ({examRevisions.pending_count})
                  </button>
                </div>

                {/* SEARCH */}

                <div className="tw-search-container">
                  <div className="tw-search-box">
                    <input
                      type="search"
                      value={searchTerm}
                      placeholder="ค้นหาชื่องาน โครงงาน หรือผู้รับผิดชอบ"
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />

                    <FaSearch className="tw-search-icon" />
                  </div>
                </div>

                {/* =================================================
                    REVIEW TABLE
                ================================================= */}

                {reviewFilter === "งานแก้ไขหลังสอบ" ? (
                  <div className="tw-table-wrap">
                    <table className="tw-table">
                      <thead>
                        <tr>
                          <th>โครงงาน</th>
                          <th>นิสิต</th>
                          <th>ประเภทงาน</th>
                          <th>วันที่ส่ง</th>
                          <th>สถานะ</th>
                          <th>การดำเนินการ</th>
                        </tr>
                      </thead>

                      <tbody>
                        {examRevisionLoading ||
                        examRevisionError ||
                        filteredExamRevisions.length === 0 ? (
                          <tr>
                            <td colSpan={6} className="tw-empty-cell">
                              {examRevisionLoading
                                ? "กำลังโหลดงานแก้ไขหลังสอบ..."
                                : examRevisionError
                                  ? examRevisionError
                                  : searchTerm.trim()
                                    ? "ไม่พบงานที่ค้นหา"
                                    : "ไม่มีงานแก้ไขหลังสอบรอตรวจ"}
                            </td>
                          </tr>
                        ) : (
                          filteredExamRevisions.map((item) => (
                            <tr key={item.submission_id}>
                              <td>{item.project_title}</td>

                              <td>
                                {item.student_username} {item.student_name}
                              </td>

                              <td>{item.work_type}</td>

                              <td>{formatThaiDate(item.submitted_at)}</td>

                              <td>
                                <span className="tw-review-status-badge tw-status-waiting">
                                  รอตรวจ
                                </span>
                              </td>

                              <td>
                                <td>
                                  <button
                                    type="button"
                                    className="tw-review-btn"
                                    onClick={() =>
                                      navigate(
                                        `/teacher-work/exam-revision/${item.submission_id}`,
                                      )
                                    }
                                  >
                                    ตรวจงานแก้ไข
                                  </button>
                                </td>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="tw-table-wrap">
                    <table className="tw-table">
                      <thead>
                        <tr>
                          <th>งาน</th>
                          <th>โครงงาน</th>
                          <th>ผู้รับผิดชอบ</th>
                          <th>วันที่ส่ง</th>
                          <th>สถานะ</th>
                          <th>การดำเนินการ</th>
                        </tr>
                      </thead>

                      <tbody>
                        {loading || error || currentTasks.length === 0 ? (
                          <tr>
                            <td colSpan={6} className="tw-empty-cell">
                              {loading
                                ? "กำลังโหลดรายการตรวจงาน..."
                                : error
                                  ? error
                                  : searchTerm.trim()
                                    ? "ไม่พบงานที่ตรงกับการค้นหา"
                                    : reviewFilter === "รอตรวจ"
                                      ? "ไม่มีงานรอตรวจ"
                                      : "ยังไม่มีรายการตรวจแล้ว"}
                            </td>
                          </tr>
                        ) : (
                          currentTasks.map((task) => (
                            <tr key={task.id}>
                              {/* ชื่องาน */}
                              <td>{task.task_name}</td>

                              {/* โครงงาน */}
                              <td>{task.project_title}</td>

                              {/* ผู้รับผิดชอบ */}
                              <td>{task.assignee_name || "-"}</td>

                              {/* วันที่ส่ง */}
                              <td>{formatThaiDate(task.submitted_at)}</td>

                              {/* สถานะ */}
                              <td>
                                <div className="tw-review-status-cell">
                                  {task.review_status === "รอตรวจ" && (
                                    <>
                                      <span className="tw-review-status-badge tw-status-waiting">
                                        รอตรวจ
                                      </span>

                                      {Number(task.submission_number) > 1 &&
                                        task.previous_review_status ===
                                          "แก้ไข" && (
                                          <span className="tw-resubmission-label">
                                            ส่งแก้ไขครั้งที่{" "}
                                            {task.submission_number}
                                          </span>
                                        )}
                                    </>
                                  )}

                                  {task.review_status === "ผ่าน" && (
                                    <span className="tw-review-status-badge tw-status-passed">
                                      ผ่าน
                                    </span>
                                  )}

                                  {task.review_status === "แก้ไข" && (
                                    <span className="tw-review-status-badge tw-status-revision">
                                      ต้องแก้ไข
                                    </span>
                                  )}
                                </div>
                              </td>

                              {/* การดำเนินการ */}
                              <td>
                                <button
                                  type="button"
                                  className="tw-review-btn"
                                  onClick={() =>
                                    navigate(`/teacher-work/review/${task.id}`)
                                  }
                                >
                                  {reviewFilter === "รอตรวจ"
                                    ? "ตรวจงาน"
                                    : "ดูผลการตรวจ"}
                                </button>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* PAGINATION */}

                {reviewFilter !== "งานแก้ไขหลังสอบ" &&
                  !loading &&
                  !error &&
                  totalPages > 1 && (
                    <div className="tw-pagination">
                      <button
                        type="button"
                        disabled={currentPage === 1}
                        onClick={() => setCurrentPage(currentPage - 1)}
                      >
                        ก่อนหน้า
                      </button>

                      <span>
                        หน้า {currentPage} / {totalPages}
                      </span>

                      <button
                        type="button"
                        disabled={currentPage === totalPages}
                        onClick={() => setCurrentPage(currentPage + 1)}
                      >
                        ถัดไป
                      </button>
                    </div>
                  )}
              </>
            ) : activeTab === "exam" ? (
              <>
                {/* =========================================
        EXAM STATUS FILTER
    ========================================= */}

                <div className="tw-review-filters">
                  <button
                    type="button"
                    className={
                      examFilter === "รอประกาศ"
                        ? "tw-filter tw-filter-active"
                        : "tw-filter"
                    }
                    onClick={() => setExamFilter("รอประกาศ")}
                  >
                    รอประกาศ
                  </button>

                  <button
                    type="button"
                    className={
                      examFilter === "ประกาศแล้ว"
                        ? "tw-filter tw-filter-active"
                        : "tw-filter"
                    }
                    onClick={() => setExamFilter("ประกาศแล้ว")}
                  >
                    ประกาศแล้ว
                  </button>
                </div>

                {/* =========================================
        SEARCH
    ========================================= */}

                <div className="tw-search-container">
                  <div className="tw-search-box">
                    <input
                      type="search"
                      placeholder="ค้นหาชื่อโครงงานหรือนิสิต"
                      value={examSearchTerm}
                      onChange={(e) => setExamSearchTerm(e.target.value)}
                    />

                    <FaSearch className="tw-search-icon" />
                  </div>
                </div>

                {/* =========================================
        EXAM TABLE
    ========================================= */}

                <div className="tw-table-wrap">
                  <table className="tw-table tw-exam-table">
                    <thead>
                      <tr>
                        <th>โครงงาน</th>
                        <th>นิสิต</th>
                        <th>วันที่ส่งคำขอ</th>
                        <th>สถานะ</th>
                        <th>การดำเนินการ</th>
                      </tr>
                    </thead>

                    <tbody>
                      {examTableLoading ||
                      examTableError ||
                      filteredExamRows.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="tw-empty-cell">
                            {examTableLoading
                              ? "กำลังโหลดข้อมูล..."
                              : examTableError ||
                                (examSearchTerm.trim()
                                  ? "ไม่พบโครงงานที่ค้นหา"
                                  : examFilter === "รอประกาศ"
                                    ? "ไม่มีคำขอสอบที่รอพิจารณา"
                                    : "ยังไม่มีการประกาศกำหนดการสอบ")}
                          </td>
                        </tr>
                      ) : (
                        filteredExamRows.map((row) => (
                          <tr key={row.id}>
                            <td>{row.projectTitle}</td>

                            <td>
                              <div className="tw-exam-students">
                                {row.studentNames
                                  .split("|")
                                  .map((name, index) => (
                                    <span key={index}>{name.trim()}</span>
                                  ))}
                              </div>
                            </td>

                            <td>{formatThaiDate(row.requestedAt)}</td>

                            <td>
                              <span
                                className={
                                  row.status === "ประกาศแล้ว"
                                    ? "tw-exam-request-announced"
                                    : "tw-exam-request-pending"
                                }
                              >
                                {row.status}
                              </span>
                            </td>

                            <td>
                              {row.rowType === "request" ? (
                                <button
                                  type="button"
                                  className="tw-exam-action-btn"
                                  onClick={() => {
                                    const request = examRequests.find(
                                      (item) =>
                                        item.project_id === row.projectId,
                                    );

                                    if (request) {
                                      setSelectedExamRequest(request);
                                    }
                                  }}
                                >
                                  พิจารณาคำขอ
                                </button>
                              ) : (
                                <button
                                  type="button"
                                  className="tw-exam-action-btn"
                                  onClick={() => {
                                    if (row.examProject) {
                                      setExamDetailProject(row.examProject);
                                    }
                                  }}
                                >
                                  ดูรายละเอียด
                                </button>
                              )}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </>
            ) : (
              <>
                {selectedEvaluation ? (
                  <div className="tw-evaluation-preview">
                    <h3>ประเมินโครงงาน</h3>

                    <div className="tw-evaluation-preview-info">
                      <strong>{selectedEvaluation.project_title}</strong>

                      <p>
                        วันที่สอบ :{" "}
                        {formatThaiDate(selectedEvaluation.exam_date)}
                      </p>

                      <p>
                        เวลา : {selectedEvaluation.start_time} -{" "}
                        {selectedEvaluation.end_time} น.
                      </p>

                      <p>สถานที่ : {selectedEvaluation.location}</p>

                      <p>
                        อาจารย์ที่ปรึกษา : {selectedEvaluation.advisor_name}
                      </p>

                      <p>นิสิต : {selectedEvaluation.student_names}</p>

                      {selectedEvaluation.evaluation_id !== null && (
                        <p>
                          คะแนนที่บันทึก : {selectedEvaluation.total_score} /
                          100
                        </p>
                      )}
                    </div>

                    <button
                      type="button"
                      className="tw-exam-action-btn"
                      onClick={() => setSelectedEvaluation(null)}
                    >
                      กลับไปรายการประเมิน
                    </button>
                  </div>
                ) : (
                  <>
                    {/* STATUS FILTER */}

                    <div className="tw-review-filters">
                      <button
                        type="button"
                        className={
                          evaluationFilter === "รอประเมิน"
                            ? "tw-filter tw-filter-active"
                            : "tw-filter"
                        }
                        onClick={() => setEvaluationFilter("รอประเมิน")}
                      >
                        รอประเมิน
                      </button>

                      <button
                        type="button"
                        className={
                          evaluationFilter === "ประเมินแล้ว"
                            ? "tw-filter tw-filter-active"
                            : "tw-filter"
                        }
                        onClick={() => setEvaluationFilter("ประเมินแล้ว")}
                      >
                        ประเมินแล้ว
                      </button>
                    </div>

                    {/* SEARCH */}

                    <div className="tw-search-container">
                      <div className="tw-search-box">
                        <input
                          type="search"
                          placeholder="ค้นหาชื่อโครงงานหรือนิสิต"
                          value={evaluationSearch}
                          onChange={(e) => setEvaluationSearch(e.target.value)}
                        />

                        <FaSearch className="tw-search-icon" />
                      </div>
                    </div>

                    {/* EVALUATION TABLE */}

                    <div className="tw-table-wrap">
                      <table className="tw-table tw-evaluation-table">
                        <thead>
                          <tr>
                            <th>โครงงาน</th>
                            <th>นิสิต</th>
                            <th>วันที่สอบ</th>
                            <th>การดำเนินการ</th>
                          </tr>
                        </thead>

                        <tbody>
                          {evaluationLoading ||
                          evaluationError ||
                          filteredEvaluations.length === 0 ? (
                            <tr>
                              <td colSpan={4} className="tw-empty-cell">
                                {evaluationLoading
                                  ? "กำลังโหลดรายการประเมิน..."
                                  : evaluationError
                                    ? evaluationError
                                    : evaluationSearch.trim()
                                      ? "ไม่พบโครงงานที่ค้นหา"
                                      : evaluationFilter === "รอประเมิน"
                                        ? "ไม่มีโครงงานรอประเมิน"
                                        : "ยังไม่มีรายการประเมินแล้ว"}
                              </td>
                            </tr>
                          ) : (
                            filteredEvaluations.map((item) => (
                              <tr key={item.committee_member_id}>
                                <td>{item.project_title}</td>

                                <td>
                                  <div className="tw-exam-students">
                                    {item.student_names
                                      .split("|")
                                      .map((student, index) => (
                                        <span key={index}>
                                          {student.trim()}
                                        </span>
                                      ))}
                                  </div>
                                </td>

                                <td>{formatThaiDate(item.exam_date)}</td>

                                <td>
                                  <button
                                    type="button"
                                    className="tw-exam-action-btn"
                                    onClick={() =>
                                      navigate(
                                        `/teacher-work/evaluation/${item.committee_member_id}`,
                                      )
                                    }
                                  >
                                    {evaluationFilter === "รอประเมิน"
                                      ? "ประเมิน"
                                      : "ดูผลประเมิน"}
                                  </button>
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </>
                )}
              </>
            )}
          </section>

          {/* =========================================================
    EDIT EXAM SCHEDULE MODAL - T043
========================================================= */}

          {examEditProject && (
            <div className="tw-exam-edit-overlay">
              <form
                className="tw-exam-edit-modal"
                onSubmit={(e) => {
                  e.preventDefault();
                  saveExamEdit();
                }}
              >
                {/* HEADER */}

                <h3>แก้ไขกำหนดการสอบ</h3>

                <div className="tw-exam-edit-divider" />

                {/* PROJECT */}

                <div className="tw-exam-edit-field">
                  <label>โครงงาน</label>

                  <div className="tw-exam-edit-project-name">
                    {examEditProject.project_title}
                  </div>
                </div>

                {/* EXAM DATE */}

                <div className="tw-exam-edit-field">
                  <label>
                    วันที่สอบ <span>*</span>
                  </label>

                  <input
                    type="date"
                    required
                    value={examEditForm.exam_date}
                    onChange={(e) =>
                      setExamEditForm({
                        ...examEditForm,
                        exam_date: e.target.value,
                      })
                    }
                  />
                </div>

                {/* EXAM TIME */}

                <div className="tw-exam-edit-field">
                  <label>
                    เวลา <span>*</span>
                  </label>

                  <div className="tw-exam-edit-time-row">
                    <input
                      type="time"
                      required
                      value={examEditForm.start_time}
                      onChange={(e) =>
                        setExamEditForm({
                          ...examEditForm,
                          start_time: e.target.value,
                        })
                      }
                    />

                    <span>ถึง</span>

                    <input
                      type="time"
                      required
                      value={examEditForm.end_time}
                      onChange={(e) =>
                        setExamEditForm({
                          ...examEditForm,
                          end_time: e.target.value,
                        })
                      }
                    />
                  </div>
                </div>

                {/* LOCATION */}

                <div className="tw-exam-edit-field">
                  <label>
                    สถานที่สอบ <span>*</span>
                  </label>

                  <input
                    type="text"
                    required
                    maxLength={255}
                    value={examEditForm.location}
                    onChange={(e) =>
                      setExamEditForm({
                        ...examEditForm,
                        location: e.target.value,
                      })
                    }
                  />
                </div>

                {/* COMMITTEE */}
                <div className="tw-exam-edit-field">
                  <label>
                    กรรมการสอบ <span>*</span>
                  </label>

                  {editCommitteeLoading ? (
                    <p>กำลังโหลดรายชื่อกรรมการ...</p>
                  ) : (
                    <>
                      <div className="tw-committee-selected">
                        {editSelectedTeachers.map((teacher) => (
                          <div
                            key={teacher.id}
                            className="tw-committee-selected-item"
                          >
                            <span>{teacher.name}</span>

                            <button
                              type="button"
                              onClick={() =>
                                updateEditCommittee(
                                  editSelectedTeachers.filter(
                                    (item) => item.id !== teacher.id,
                                  ),
                                )
                              }
                            >
                              ×
                            </button>
                          </div>
                        ))}
                      </div>

                      <div className="tw-committee-search">
                        <input
                          type="text"
                          placeholder="ค้นหาชื่ออาจารย์เพื่อเพิ่มกรรมการ..."
                          value={editCommitteeSearch}
                          onChange={(e) =>
                            setEditCommitteeSearch(e.target.value)
                          }
                        />

                        {editCommitteeSearch.trim() !== "" && (
                          <div className="tw-committee-search-results">
                            {editTeacherOptions
                              .filter((teacher) => {
                                const selected = editSelectedTeachers.some(
                                  (item) => item.id === teacher.id,
                                );

                                const keyword = editCommitteeSearch
                                  .trim()
                                  .toLowerCase();

                                return (
                                  !selected &&
                                  (teacher.name
                                    .toLowerCase()
                                    .includes(keyword) ||
                                    teacher.username
                                      .toLowerCase()
                                      .includes(keyword))
                                );
                              })
                              .slice(0, 8)
                              .map((teacher) => (
                                <button
                                  key={teacher.id}
                                  type="button"
                                  className="tw-committee-search-option"
                                  onClick={() => {
                                    updateEditCommittee([
                                      ...editSelectedTeachers,
                                      teacher,
                                    ]);

                                    setEditCommitteeSearch("");
                                  }}
                                >
                                  <strong>{teacher.name}</strong>
                                  <small>{teacher.username}</small>
                                </button>
                              ))}
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </div>

                {/* NOTES */}

                <div className="tw-exam-edit-field">
                  <label>หมายเหตุ</label>

                  <textarea
                    rows={3}
                    value={examEditForm.notes}
                    onChange={(e) =>
                      setExamEditForm({
                        ...examEditForm,
                        notes: e.target.value,
                      })
                    }
                  />
                </div>

                {/* ERROR */}

                {examEditError && (
                  <p className="tw-exam-edit-error">{examEditError}</p>
                )}

                {/* ACTIONS */}

                <div className="tw-exam-edit-actions">
                  <button
                    type="button"
                    className="tw-exam-edit-cancel"
                    onClick={closeExamEdit}
                    disabled={examEditSaving}
                  >
                    ยกเลิก
                  </button>

                  <button
                    type="submit"
                    className="tw-exam-edit-save"
                    disabled={examEditSaving}
                  >
                    {examEditSaving ? "กำลังบันทึก..." : "บันทึกการแก้ไข"}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* =========================================================
    EXAM DETAIL MODAL
========================================================= */}

          {examDetailProject && (
            <div
              className="tw-exam-detail-overlay"
              role="presentation"
              onClick={() => setExamDetailProject(null)}
            >
              <div
                className="tw-exam-detail-modal"
                role="dialog"
                aria-modal="true"
                aria-label="รายละเอียดกำหนดการสอบ"
                onClick={(e) => e.stopPropagation()}
              >
                {/* TITLE */}

                <h3>รายละเอียดกำหนดการสอบ</h3>

                <div className="tw-exam-detail-divider" />

                {/* PROJECT NAME */}

                <div className="tw-exam-detail-project">
                  <strong>{examDetailProject.project_title}</strong>
                </div>

                {/* BASIC INFO */}

                <div className="tw-exam-detail-info">
                  <p>
                    วันที่สอบ : {formatThaiDate(examDetailProject.exam_date)}
                  </p>

                  <p>
                    เวลา : {examDetailProject.start_time?.slice(0, 5) || "-"}
                    {" - "}
                    {examDetailProject.end_time?.slice(0, 5) || "-"} น.
                  </p>

                  <p>สถานที่สอบ : {examDetailProject.location || "-"}</p>
                </div>

                {/* COMMITTEE */}

                {/* COMMITTEE */}
                <div className="tw-exam-detail-section">
                  <h4>กรรมการสอบ</h4>

                  {committeeLoading ? (
                    <p>กำลังโหลดรายชื่อกรรมการสอบ...</p>
                  ) : committeeError ? (
                    <p className="tw-committee-error">{committeeError}</p>
                  ) : committeeMembers.length === 0 ? (
                    <p>ยังไม่มีรายชื่อกรรมการสอบ</p>
                  ) : (
                    <div className="tw-committee-list">
                      {committeeMembers.map((member) => (
                        <div
                          key={member.committee_member_id}
                          className="tw-committee-item"
                        >
                          <div className="tw-committee-info">
                            <strong>{member.teacher_name}</strong>

                            <small>
                              {member.teacher_id === Number(userId)
                                ? "อาจารย์ที่ปรึกษา"
                                : "กรรมการสอบ"}
                            </small>
                          </div>

                          <span
                            className={`tw-committee-status ${
                              member.invitation_status === "ตอบรับ"
                                ? "tw-committee-accepted"
                                : member.invitation_status === "ปฏิเสธ"
                                  ? "tw-committee-rejected"
                                  : "tw-committee-pending"
                            }`}
                          >
                            {member.invitation_status}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* NOTES */}

                <div className="tw-exam-detail-section">
                  <h4>หมายเหตุ</h4>

                  <p className="tw-exam-detail-notes">
                    {examDetailProject.notes || "-"}
                  </p>
                </div>

                {/* ANNOUNCED DATE */}

                <p className="tw-exam-detail-announced">
                  ประกาศเมื่อ : {formatThaiDate(examDetailProject.announced_at)}
                  {" เวลา "}
                  {examDetailProject.announced_at &&
                  !Number.isNaN(
                    new Date(examDetailProject.announced_at).getTime(),
                  )
                    ? new Date(
                        examDetailProject.announced_at,
                      ).toLocaleTimeString("th-TH", {
                        timeZone: "Asia/Bangkok",
                        hour: "2-digit",
                        minute: "2-digit",
                        hour12: false,
                      })
                    : "-"}
                  {" น."}
                </p>

                {/* BUTTONS */}

                <div className="tw-exam-detail-actions">
                  <button
                    type="button"
                    className="tw-exam-detail-back"
                    onClick={() => setExamDetailProject(null)}
                  >
                    กลับ
                  </button>

                  <button
                    type="button"
                    className="tw-exam-detail-edit"
                    onClick={openExamEdit}
                  >
                    แก้ไขกำหนดการ
                  </button>
                  <button
                    type="button"
                    className="tw-exam-detail-cancel"
                    onClick={() => {
                      setExamCancelError("");
                      setShowExamCancelConfirm(true);
                    }}
                  >
                    ยกเลิกกำหนดการสอบ
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* =========================================
    CANCEL EXAM CONFIRMATION POPUP
========================================= */}

          {showExamCancelConfirm &&
            examDetailProject &&
            createPortal(
              <div className="tw-exam-cancel-overlay">
                <div
                  className="tw-exam-cancel-modal"
                  role="dialog"
                  aria-modal="true"
                  aria-labelledby="tw-exam-cancel-title"
                >
                  <h3 id="tw-exam-cancel-title">ยืนยันการยกเลิกกำหนดการสอบ</h3>

                  <div className="tw-exam-cancel-divider" />

                  <p>ต้องการยกเลิกกำหนดการสอบของโครงงาน</p>

                  <strong>{examDetailProject.project_title}</strong>

                  <p>
                    เมื่อยกเลิกแล้ว โครงงานจะกลับไปอยู่ในรายการ "รอประกาศ"
                    และคำเชิญกรรมการสอบเดิมจะถูกยกเลิก
                  </p>

                  {examCancelError && (
                    <p className="tw-exam-cancel-error">{examCancelError}</p>
                  )}

                  <div className="tw-exam-cancel-actions">
                    <button
                      type="button"
                      className="tw-exam-cancel-back"
                      disabled={examCancelling}
                      onClick={() => {
                        setShowExamCancelConfirm(false);
                        setExamCancelError("");
                      }}
                    >
                      กลับ
                    </button>

                    <button
                      type="button"
                      className="tw-exam-cancel-confirm"
                      disabled={examCancelling}
                      onClick={cancelExamSchedule}
                    >
                      {examCancelling ? "กำลังยกเลิก..." : "ยืนยันการยกเลิก"}
                    </button>
                  </div>
                </div>
              </div>,
              document.body,
            )}

          {/* =================================================
    EXAM ANNOUNCEMENT MODAL
================================================= */}

          {selectedExamProject && (
            <div className="tw-exam-modal-overlay">
              <div className="tw-exam-modal">
                {!showExamConfirm ? (
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();

                      if (selectedCommitteeTeachers.length === 0) {
                        setExamFormError(
                          "กรุณาเลือกกรรมการสอบอย่างน้อย 1 ท่าน",
                        );
                        return;
                      }

                      if (examForm.start_time >= examForm.end_time) {
                        setExamFormError("เวลาสิ้นสุดต้องมากกว่าเวลาเริ่มสอบ");
                        return;
                      }

                      setExamFormError("");
                      setShowExamConfirm(true);
                    }}
                  >
                    <h3>ประกาศกำหนดการสอบ</h3>

                    <div className="tw-exam-modal-divider" />

                    {/* ชื่อโครงงาน */}

                    <div className="tw-exam-form-group">
                      <label>โครงงาน</label>

                      <div className="tw-exam-project-name">
                        {selectedExamProject.project_title}
                      </div>
                    </div>

                    {/* วันที่สอบ */}

                    <div className="tw-exam-form-group">
                      <label>
                        วันที่สอบ <span>*</span>
                      </label>

                      <input
                        type="date"
                        required
                        value={examForm.exam_date}
                        onChange={(e) =>
                          setExamForm({
                            ...examForm,
                            exam_date: e.target.value,
                          })
                        }
                      />
                    </div>

                    {/* เวลาสอบ */}

                    <div className="tw-exam-form-group">
                      <label>
                        เวลา <span>*</span>
                      </label>

                      <div className="tw-exam-time-row">
                        <input
                          type="time"
                          required
                          value={examForm.start_time}
                          onChange={(e) =>
                            setExamForm({
                              ...examForm,
                              start_time: e.target.value,
                            })
                          }
                        />

                        <span>ถึง</span>

                        <input
                          type="time"
                          required
                          value={examForm.end_time}
                          onChange={(e) =>
                            setExamForm({
                              ...examForm,
                              end_time: e.target.value,
                            })
                          }
                        />
                      </div>
                    </div>

                    {/* สถานที่สอบ */}

                    <div className="tw-exam-form-group">
                      <label>
                        สถานที่สอบ <span>*</span>
                      </label>

                      <input
                        type="text"
                        required
                        value={examForm.location}
                        onChange={(e) =>
                          setExamForm({
                            ...examForm,
                            location: e.target.value,
                          })
                        }
                      />
                    </div>

                    {/* กรรมการสอบ */}

                    {/* กรรมการสอบ */}

                    <div className="tw-exam-form-group">
                      <label>
                        กรรมการสอบ <span>*</span>
                      </label>

                      <div className="tw-committee-search">
                        <input
                          type="text"
                          placeholder="ค้นหาชื่ออาจารย์..."
                          value={committeeSearch}
                          onChange={(e) => setCommitteeSearch(e.target.value)}
                          autoComplete="off"
                        />

                        {teacherOptionsLoading && (
                          <p className="tw-committee-hint">
                            กำลังโหลดรายชื่ออาจารย์...
                          </p>
                        )}

                        {teacherOptionsError && (
                          <p className="tw-committee-error">
                            {teacherOptionsError}
                          </p>
                        )}

                        {!teacherOptionsLoading &&
                          !teacherOptionsError &&
                          committeeSearch.trim() !== "" && (
                            <div className="tw-committee-search-results">
                              {teacherOptions
                                .filter((teacher) => {
                                  const alreadySelected =
                                    selectedCommitteeTeachers.some(
                                      (item) => item.id === teacher.id,
                                    );

                                  const keyword = committeeSearch
                                    .trim()
                                    .toLowerCase();

                                  const matches =
                                    teacher.name
                                      .toLowerCase()
                                      .includes(keyword) ||
                                    teacher.username
                                      .toLowerCase()
                                      .includes(keyword) ||
                                    (teacher.major || "")
                                      .toLowerCase()
                                      .includes(keyword);

                                  return !alreadySelected && matches;
                                })
                                .slice(0, 8)
                                .map((teacher) => (
                                  <button
                                    key={teacher.id}
                                    type="button"
                                    className="tw-committee-search-option"
                                    onClick={() => addCommitteeTeacher(teacher)}
                                  >
                                    <strong>{teacher.name}</strong>
                                    <small>
                                      {teacher.username} |{" "}
                                      {teacher.major || "-"}
                                    </small>
                                  </button>
                                ))}
                            </div>
                          )}
                      </div>

                      {/* รายชื่อกรรมการที่เลือกแล้ว */}

                      {selectedCommitteeTeachers.length > 0 && (
                        <div className="tw-committee-selected">
                          {selectedCommitteeTeachers.map((teacher) => (
                            <div
                              key={teacher.id}
                              className="tw-committee-selected-item"
                            >
                              <span>{teacher.name}</span>

                              <button
                                type="button"
                                onClick={() =>
                                  removeCommitteeTeacher(teacher.id)
                                }
                                aria-label={`ลบ ${teacher.name}`}
                              >
                                ×
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* หมายเหตุ */}

                    <div className="tw-exam-form-group">
                      <label>หมายเหตุ</label>

                      <textarea
                        rows={3}
                        value={examForm.notes}
                        onChange={(e) =>
                          setExamForm({
                            ...examForm,
                            notes: e.target.value,
                          })
                        }
                      />
                    </div>

                    {examFormError && (
                      <p className="tw-exam-form-error">{examFormError}</p>
                    )}

                    {/* ปุ่ม */}

                    {examFormError && (
                      <p className="tw-exam-form-error">{examFormError}</p>
                    )}

                    <div className="tw-exam-modal-actions">
                      <button
                        type="button"
                        className="tw-exam-cancel-btn"
                        onClick={closeExamModal}
                      >
                        ยกเลิก
                      </button>

                      <button type="submit" className="tw-exam-save-btn">
                        ประกาศกำหนดการ
                      </button>
                    </div>
                  </form>
                ) : (
                  <div className="tw-exam-confirm-content">
                    <h3>ยืนยันการประกาศกำหนดการสอบ</h3>

                    <div className="tw-exam-modal-divider" />

                    <p>คุณต้องการประกาศกำหนดการสอบของ</p>

                    <strong>“{selectedExamProject.project_title}”</strong>

                    <p>ให้กับนิสิตทราบหรือไม่</p>

                    <div className="tw-exam-confirm-info">
                      <p>วันที่ {formatThaiDate(examForm.exam_date)}</p>

                      <p>
                        เวลา {examForm.start_time} - {examForm.end_time} น.
                      </p>

                      <p>สถานที่ {examForm.location}</p>
                    </div>

                    <p>
                      ระบบจะแจ้งเตือนกำหนดการสอบให้นิสิตทราบ หลังจากยืนยันสำเร็จ
                    </p>

                    <div className="tw-exam-modal-actions">
                      <button
                        type="button"
                        className="tw-exam-cancel-btn"
                        onClick={() => setShowExamConfirm(false)}
                      >
                        กลับไปแก้ไข
                      </button>

                      <button
                        type="button"
                        className="tw-exam-save-btn"
                        onClick={confirmExamAnnouncement}
                        disabled={examSubmitting}
                      >
                        {examSubmitting ? "กำลังประกาศ..." : "ยืนยันการประกาศ"}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default TeacherWork;
