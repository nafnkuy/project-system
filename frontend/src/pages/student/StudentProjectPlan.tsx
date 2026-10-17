import "./StudentProjectPlan.css";

import { useCallback, useEffect, useMemo, useState } from "react";

import { useNavigate, useParams } from "react-router-dom";

import axios from "axios";

import { FaEdit, FaPlusCircle, FaSearch } from "react-icons/fa";

import logo from "../../assets/Logo.svg";

import StudentNotificationBell from "./StudentNotificationBell";

/* =========================================================
   TYPE
========================================================= */

interface ProjectMember {
  id: number;
  username: string;
  name: string;
}

interface ProjectInfo {
  id: number;
  title: string;
}

interface Subtask {
  id: number;
  task_id: number;
  subtask_name: string;

  status: "ยังไม่เริ่ม" | "กำลังดำเนินการ" | "เสร็จสิ้น";

  subtask_order: number;

  created_at: string;
  updated_at: string;
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

  task_order: number;

  created_at: string;
  updated_at: string;

  completed_subtasks: number;
  total_subtasks: number;

  subtasks: Subtask[];
}

interface Phase {
  id: number;

  project_id: number;

  phase_name: string;

  start_date: string | null;
  due_date: string | null;

  phase_order: number;

  created_at: string;
  updated_at: string;

  status: "ยังไม่เริ่ม" | "กำลังดำเนินการ" | "เสร็จสิ้น";

  completed_tasks: number;
  total_tasks: number;

  tasks: Task[];
}

interface PlanResponse {
  project: ProjectInfo;

  members: ProjectMember[];

  phases: Phase[];
}

/* =========================================================
   COMPONENT
========================================================= */

function StudentProjectPlan() {
  const navigate = useNavigate();

  const { projectId } = useParams();

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

  const [members, setMembers] = useState<ProjectMember[]>([]);

  const [phases, setPhases] = useState<Phase[]>([]);

  const [loading, setLoading] = useState(true);

  /* =========================================================
     VIEW
  ========================================================= */

  const [viewMode, setViewMode] = useState<"board" | "list">("board");

  /* =========================================================
     SEARCH / FILTER
  ========================================================= */

  const [searchTerm, setSearchTerm] = useState("");

  const [phaseFilter, setPhaseFilter] = useState("ทั้งหมด");

  const [taskStatusFilter, setTaskStatusFilter] = useState("ทั้งหมด");

  const [reviewStatusFilter, setReviewStatusFilter] = useState("ทั้งหมด");

  /* =========================================================
     CREATE PHASE MODAL
  ========================================================= */

  const [showPhaseModal, setShowPhaseModal] = useState(false);

  const [phaseName, setPhaseName] = useState("");

  const [phaseStartDate, setPhaseStartDate] = useState("");

  const [phaseDueDate, setPhaseDueDate] = useState("");

  const [creatingPhase, setCreatingPhase] = useState(false);

  /* =========================================================
   EDIT PHASE MODAL
========================================================= */

  const [showEditPhaseModal, setShowEditPhaseModal] = useState(false);

  const [editingPhase, setEditingPhase] = useState<Phase | null>(null);

  const [editPhaseName, setEditPhaseName] = useState("");

  const [editPhaseStartDate, setEditPhaseStartDate] = useState("");

  const [editPhaseDueDate, setEditPhaseDueDate] = useState("");

  const [savingPhase, setSavingPhase] = useState(false);

  const [deletingPhase, setDeletingPhase] = useState(false);
  /* =========================================================
   ADD TASK MODAL
========================================================= */

  const [showTaskModal, setShowTaskModal] = useState(false);

  const [selectedPhase, setSelectedPhase] = useState<Phase | null>(null);

  const [taskName, setTaskName] = useState("");

  const [taskDescription, setTaskDescription] = useState("");

  const [taskStartDate, setTaskStartDate] = useState("");

  const [taskDueDate, setTaskDueDate] = useState("");

  const [taskSubtasks, setTaskSubtasks] = useState("");

  const [creatingTask, setCreatingTask] = useState(false);

  /* =========================================================
   EDIT TASK MODAL
========================================================= */

  const [showEditTaskModal, setShowEditTaskModal] = useState(false);

  const [editingTask, setEditingTask] = useState<Task | null>(null);

  const [editTaskName, setEditTaskName] = useState("");

  const [editTaskPhaseId, setEditTaskPhaseId] = useState("");

  const [editTaskDescription, setEditTaskDescription] = useState("");

  const [editTaskStartDate, setEditTaskStartDate] = useState("");

  const [editTaskDueDate, setEditTaskDueDate] = useState("");

  const [editTaskSubtasks, setEditTaskSubtasks] = useState("");

  const [savingTask, setSavingTask] = useState(false);

  const [deletingTask, setDeletingTask] = useState(false);

  /* =========================================================
   TASK DETAIL MODAL
========================================================= */

  const [showTaskDetailModal, setShowTaskDetailModal] = useState(false);

  const [selectedTaskDetail, setSelectedTaskDetail] = useState<Task | null>(
    null,
  );

  const [startingTask, setStartingTask] = useState(false);

  /* =========================================================
     CHECK LOGIN
  ========================================================= */

  useEffect(() => {
    if (!userId) {
      navigate("/");
    }
  }, [userId, navigate]);

  /* =========================================================
     LOAD PLAN
  ========================================================= */

  const loadPlan = useCallback(() => {
    if (!projectId) {
      return;
    }

    setLoading(true);

    axios
      .get(`http://localhost:5000/student/projects/${projectId}/plan`)
      .then((res) => {
        const data = res.data as PlanResponse;

        console.log("Student Project Plan =", data);

        setProject(data.project);

        setMembers(data.members || []);

        setPhases(data.phases || []);
      })
      .catch((err) => {
        console.log("Get project plan error:", err);

        alert(err.response?.data?.message || "ไม่สามารถโหลดแผนงานได้");

        navigate(`/student-project-detail/${projectId}`);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [projectId, navigate]);

  useEffect(() => {
    loadPlan();
  }, [loadPlan]);

  /* =========================================================
     CREATE PHASE
  ========================================================= */

  const handleCreatePhase = async () => {
    if (!projectId || !userId) {
      return;
    }

    if (!phaseName.trim()) {
      alert("กรุณาระบุชื่อ Phase");

      return;
    }

    if (phaseStartDate && phaseDueDate && phaseStartDate > phaseDueDate) {
      alert("วันที่เริ่มต้นต้องไม่เกินวันที่สิ้นสุด");

      return;
    }

    try {
      setCreatingPhase(true);

      const res = await axios.post(
        `http://localhost:5000/student/projects/${projectId}/phases`,
        {
          student_id: Number(userId),

          phase_name: phaseName.trim(),

          start_date: phaseStartDate || null,

          due_date: phaseDueDate || null,
        },
      );

      alert(res.data.message);

      setShowPhaseModal(false);

      setPhaseName("");

      setPhaseStartDate("");

      setPhaseDueDate("");

      loadPlan();
    } catch (err: any) {
      console.log("Create phase error:", err);

      alert(err.response?.data?.message || "ไม่สามารถสร้าง Phase ได้");
    } finally {
      setCreatingPhase(false);
    }
  };

  /* =========================================================
   OPEN EDIT PHASE
========================================================= */

  const openEditPhase = (phase: Phase) => {
    setEditingPhase(phase);

    setEditPhaseName(phase.phase_name || "");

    setEditPhaseStartDate(formatDateInput(phase.start_date));

    setEditPhaseDueDate(formatDateInput(phase.due_date));

    setShowEditPhaseModal(true);
  };

  /* =========================================================
   EDIT PHASE VALID
========================================================= */

  const isEditPhaseValid =
    editPhaseName.trim() !== "" &&
    editPhaseStartDate !== "" &&
    editPhaseDueDate !== "" &&
    editPhaseStartDate <= editPhaseDueDate;

  /* =========================================================
   SAVE EDIT PHASE
========================================================= */

  const handleSaveEditPhase = async () => {
    if (!editingPhase || !userId || !isEditPhaseValid) {
      return;
    }

    try {
      setSavingPhase(true);

      const res = await axios.put(
        `http://localhost:5000/student/phases/${editingPhase.id}`,
        {
          student_id: Number(userId),

          phase_name: editPhaseName.trim(),

          start_date: editPhaseStartDate,

          due_date: editPhaseDueDate,
        },
      );

      alert(res.data.message);

      setShowEditPhaseModal(false);

      setEditingPhase(null);

      loadPlan();
    } catch (err: any) {
      console.log("Edit phase error:", err);

      alert(err.response?.data?.message || "ไม่สามารถแก้ไข Phase ได้");
    } finally {
      setSavingPhase(false);
    }
  };

  /* =========================================================
   DELETE PHASE
========================================================= */

  const handleDeletePhase = async () => {
    if (!editingPhase || !userId) {
      return;
    }

    const confirmDelete = window.confirm(
      `ต้องการลบ Phase "${editingPhase.phase_name}" หรือไม่?\n\nงานและ Subtask ภายใน Phase นี้จะถูกลบด้วย`,
    );

    if (!confirmDelete) {
      return;
    }

    try {
      setDeletingPhase(true);

      const res = await axios.delete(
        `http://localhost:5000/student/phases/${editingPhase.id}`,
        {
          data: {
            student_id: Number(userId),
          },
        },
      );

      alert(res.data.message);

      setShowEditPhaseModal(false);

      setEditingPhase(null);

      loadPlan();
    } catch (err: any) {
      console.log("Delete phase error:", err);

      alert(err.response?.data?.message || "ไม่สามารถลบ Phase ได้");
    } finally {
      setDeletingPhase(false);
    }
  };

  /* =========================================================
   OPEN ADD TASK
========================================================= */

  const openAddTask = (phase: Phase) => {
    setSelectedPhase(phase);

    setTaskName("");

    setTaskDescription("");

    setTaskStartDate("");

    setTaskDueDate("");

    setTaskSubtasks("");

    setShowTaskModal(true);
  };

  /* =========================================================
   TASK VALID
========================================================= */

  const isTaskValid =
    taskName.trim() !== "" &&
    taskStartDate !== "" &&
    taskDueDate !== "" &&
    taskStartDate <= taskDueDate;

  /* =========================================================
   CREATE TASK
========================================================= */

  const handleCreateTask = async () => {
    if (!selectedPhase || !userId || !isTaskValid) {
      return;
    }

    /*
      1 บรรทัด = 1 Subtask

      รองรับทั้ง:
      ออกแบบฐานข้อมูล

      หรือ:
      - ออกแบบฐานข้อมูล
    */

    const subtasks = taskSubtasks
      .split(/\r?\n/)
      .map((item) => item.trim().replace(/^[-•]\s*/, ""))
      .filter(Boolean);

    try {
      setCreatingTask(true);

      const res = await axios.post(
        `http://localhost:5000/student/phases/${selectedPhase.id}/tasks`,
        {
          student_id: Number(userId),

          task_name: taskName.trim(),

          description: taskDescription.trim(),

          start_date: taskStartDate,

          due_date: taskDueDate,

          subtasks,
        },
      );

      alert(res.data.message);

      setShowTaskModal(false);

      setSelectedPhase(null);

      setTaskName("");

      setTaskDescription("");

      setTaskStartDate("");

      setTaskDueDate("");

      setTaskSubtasks("");

      loadPlan();
    } catch (err: any) {
      console.log("Create task error:", err);

      alert(err.response?.data?.message || "ไม่สามารถเพิ่มงานได้");
    } finally {
      setCreatingTask(false);
    }
  };

  /* =========================================================
   OPEN EDIT TASK
========================================================= */

  const openEditTask = (task: Task) => {
    setEditingTask(task);

    setEditTaskName(task.task_name || "");

    setEditTaskPhaseId(String(task.phase_id));

    setEditTaskDescription(task.description || "");

    setEditTaskStartDate(formatDateInput(task.start_date));

    setEditTaskDueDate(formatDateInput(task.due_date));

    setEditTaskSubtasks(
      (task.subtasks || []).map((subtask) => subtask.subtask_name).join("\n"),
    );

    setShowEditTaskModal(true);
  };

  const selectedEditTaskPhase =
    phases.find((phase) => Number(phase.id) === Number(editTaskPhaseId)) ||
    null;

  const isEditTaskValid =
    editTaskName.trim() !== "" &&
    editTaskPhaseId !== "" &&
    editTaskStartDate !== "" &&
    editTaskDueDate !== "" &&
    editTaskStartDate <= editTaskDueDate &&
    (!selectedEditTaskPhase?.start_date ||
      editTaskStartDate >= formatDateInput(selectedEditTaskPhase.start_date)) &&
    (!selectedEditTaskPhase?.due_date ||
      editTaskDueDate <= formatDateInput(selectedEditTaskPhase.due_date));

  /* =========================================================
   SAVE EDIT TASK
========================================================= */

  const handleSaveEditTask = async () => {
    if (!editingTask || !userId || !isEditTaskValid) {
      return;
    }

    const lines = editTaskSubtasks
      .split(/\r?\n/)
      .map((item) => item.trim().replace(/^[-•]\s*/, ""))
      .filter(Boolean);

    /*
      พยายามรักษา id ของ Subtask เดิมไว้
      เพื่อไม่ให้ status เดิมหาย
    */

    const usedIds = new Set<number>();

    const subtasks = lines.map((name, index) => {
      // หาอันเดิมที่ชื่อเหมือนกันก่อน
      let original = editingTask.subtasks.find(
        (subtask) =>
          subtask.subtask_name.trim() === name && !usedIds.has(subtask.id),
      );

      // ถ้าเป็นการแก้ชื่อ
      // ใช้ตำแหน่งเดิม
      if (!original) {
        const byIndex = editingTask.subtasks[index];

        if (byIndex && !usedIds.has(byIndex.id)) {
          original = byIndex;
        }
      }

      if (original) {
        usedIds.add(original.id);
      }

      return {
        id: original?.id || null,

        subtask_name: name,
      };
    });

    try {
      setSavingTask(true);

      const res = await axios.put(
        `http://localhost:5000/student/tasks/${editingTask.id}`,
        {
          student_id: Number(userId),

          phase_id: Number(editTaskPhaseId),

          task_name: editTaskName.trim(),

          description: editTaskDescription.trim(),

          start_date: editTaskStartDate,

          due_date: editTaskDueDate,

          subtasks,
        },
      );

      alert(res.data.message);

      setShowEditTaskModal(false);

      setEditingTask(null);

      loadPlan();
    } catch (err: any) {
      console.log("Edit task error:", err);

      alert(err.response?.data?.message || "ไม่สามารถแก้ไขงานได้");
    } finally {
      setSavingTask(false);
    }
  };

  /* =========================================================
   DELETE TASK
========================================================= */

  const handleDeleteTask = async () => {
    if (!editingTask || !userId) {
      return;
    }

    const confirmDelete = window.confirm(
      `ต้องการลบงาน "${editingTask.task_name}" หรือไม่?\n\nSubtask ภายในงานนี้จะถูกลบด้วย`,
    );

    if (!confirmDelete) {
      return;
    }

    try {
      setDeletingTask(true);

      const res = await axios.delete(
        `http://localhost:5000/student/tasks/${editingTask.id}`,
        {
          data: {
            student_id: Number(userId),
          },
        },
      );

      alert(res.data.message);

      setShowEditTaskModal(false);
      setEditingTask(null);

      loadPlan();
    } catch (err: any) {
      console.log("Delete task error:", err);

      alert(err.response?.data?.message || "ไม่สามารถลบงานได้");
    } finally {
      setDeletingTask(false);
    }
  };

  /* =========================================================
   OPEN TASK DETAIL
========================================================= */

  const openTaskDetail = (task: Task) => {
    setSelectedTaskDetail(task);

    setShowTaskDetailModal(true);
  };

  /* =========================================================
   START TASK
========================================================= */

  const handleStartTask = async () => {
    if (!selectedTaskDetail || !userId) {
      return;
    }

    const confirmStart = window.confirm(
      `ต้องการเริ่มดำเนินการงาน "${selectedTaskDetail.task_name}" หรือไม่?`,
    );

    if (!confirmStart) {
      return;
    }

    try {
      setStartingTask(true);

      const res = await axios.put(
        `http://localhost:5000/student/tasks/${selectedTaskDetail.id}/start`,
        {
          student_id: Number(userId),
        },
      );

      alert(res.data.message);

      setShowTaskDetailModal(false);

      setSelectedTaskDetail(null);

      loadPlan();
    } catch (err: any) {
      console.log("Start task error:", err);

      alert(err.response?.data?.message || "ไม่สามารถเริ่มดำเนินการงานได้");
    } finally {
      setStartingTask(false);
    }
  };

  const selectedTaskDetailPhase = selectedTaskDetail
    ? phases.find(
        (phase) => Number(phase.id) === Number(selectedTaskDetail.phase_id),
      ) || null
    : null;

  /* =========================================================
   GO TO TASK DETAIL PAGE
========================================================= */

  const goToTaskDetailPage = (task: Task) => {
    navigate(`/student-project-detail/${projectId}/plan/task/${task.id}`);
  };

  /* =========================================================
     FILTER
  ========================================================= */

  const filteredPhases = useMemo(() => {
    const keyword = searchTerm.trim().toLowerCase();

    return phases
      .map((phase) => {
        let tasks = phase.tasks || [];

        /* ค้นหาชื่องาน */

        if (keyword) {
          tasks = tasks.filter((task) =>
            task.task_name.toLowerCase().includes(keyword),
          );
        }

        /* Filter สถานะงาน */

        if (taskStatusFilter !== "ทั้งหมด") {
          tasks = tasks.filter((task) => task.status === taskStatusFilter);
        }

        /* Filter สถานะตรวจ */

        if (reviewStatusFilter !== "ทั้งหมด") {
          tasks = tasks.filter(
            (task) => task.review_status === reviewStatusFilter,
          );
        }

        return {
          ...phase,
          tasks,
        };
      })
      .filter((phase) => {
        /* Filter Phase */

        if (phaseFilter !== "ทั้งหมด" && String(phase.id) !== phaseFilter) {
          return false;
        }

        if (!keyword) {
          return true;
        }

        const phaseMatches = phase.phase_name.toLowerCase().includes(keyword);

        return phaseMatches || phase.tasks.length > 0;
      });
  }, [phases, searchTerm, phaseFilter, taskStatusFilter, reviewStatusFilter]);

  function formatDateInput(value: string | null) {
    if (!value) {
      return "";
    }

    return value.slice(0, 10);
  }
  /* =========================================================
     DATE
  ========================================================= */

  const formatThaiDate = (value: string | null) => {
    if (!value) return "-";

    const date = new Date(value);

    return date.toLocaleDateString("th-TH", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  /* =========================================================
     PHASE LABEL
  ========================================================= */

  const getPhaseTitle = (phase: Phase) => {
    return `Phase ${phase.phase_order} : ${phase.phase_name}`;
  };

  /* =========================================================
     LAST UPDATE
  ========================================================= */

  const lastUpdated = useMemo(() => {
    const dates: string[] = [];

    phases.forEach((phase) => {
      if (phase.updated_at) {
        dates.push(phase.updated_at);
      }

      phase.tasks?.forEach((task) => {
        if (task.updated_at) {
          dates.push(task.updated_at);
        }

        task.subtasks?.forEach((subtask) => {
          if (subtask.updated_at) {
            dates.push(subtask.updated_at);
          }
        });
      });
    });

    if (dates.length === 0) {
      return "-";
    }

    const newest = dates.sort(
      (a, b) => new Date(b).getTime() - new Date(a).getTime(),
    )[0];

    return formatThaiDate(newest);
  }, [phases]);

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
    return <div className="student-plan-loading">กำลังโหลดแผนงาน...</div>;
  }

  /* =========================================================
     RENDER
  ========================================================= */

  return (
    <div className="student-project-plan-page">
      {/* =====================================================
          SIDEBAR
      ===================================================== */}

      <aside className="student-plan-sidebar">
        <div className="student-plan-logo">
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

        <button className="student-plan-logout" onClick={handleLogout}>
          ออกจากระบบ
        </button>
      </aside>

      {/* =====================================================
          MAIN
      ===================================================== */}

      <main className="student-plan-main">
        {/* ===================================================
            HEADER
        =================================================== */}

        <header className="student-plan-header">
          <h2>
            <span
              className="student-plan-breadcrumb-link"
              onClick={() => navigate("/student-project")}
            >
              โครงงานของฉัน
            </span>

            <span>{" > "}</span>

            <span
              className="student-plan-breadcrumb-link"
              onClick={() => navigate(`/student-project-detail/${projectId}`)}
            >
              รายละเอียดโครงงาน
            </span>

            <span>{" > "}</span>

            <span>แผนงาน</span>
          </h2>

          <div className="student-plan-header-right">
            <StudentNotificationBell />

            <div className="student-plan-user">
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

        <div className="student-plan-content">
          {/* PROJECT HEADER */}

          <div className="student-plan-project-heading">
            <h3>{project?.title || "-"}</h3>

            <p>อัปเดตล่าสุด : {lastUpdated}</p>
          </div>

          {/* =================================================
              TABS
          ================================================= */}

          <div className="student-plan-tabs">
            <button
              onClick={() => navigate(`/student-project-detail/${projectId}`)}
            >
              ภาพรวม
            </button>

            <button className="active">แผนงาน</button>

            <button>เอกสารและการส่งงาน</button>

            <button>กำหนดการสอบ</button>

            <button>ผลการประเมิน</button>
          </div>

          {/* =================================================
              PLAN CARD
          ================================================= */}

          <section className="student-plan-container">
            {/* TITLE */}

            <div className="student-plan-title-row">
              <h3>แผนงานโครงงาน</h3>

              <button
                className="student-plan-create-phase-btn"
                onClick={() => setShowPhaseModal(true)}
              >
                สร้าง Phase
                <FaPlusCircle />
              </button>
            </div>

            {/* ===============================================
                SEARCH + FILTER
            =============================================== */}

            <div className="student-plan-toolbar">
              <div className="student-plan-search">
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="ค้นหา Phase หรืองาน"
                />

                <FaSearch />
              </div>

              {/* PHASE FILTER */}

              <select
                value={phaseFilter}
                onChange={(e) => setPhaseFilter(e.target.value)}
              >
                <option value="ทั้งหมด">Phase ทั้งหมด</option>

                {phases.map((phase) => (
                  <option key={phase.id} value={phase.id}>
                    Phase {phase.phase_order}
                  </option>
                ))}
              </select>

              {/* TASK STATUS */}

              <select
                value={taskStatusFilter}
                onChange={(e) => setTaskStatusFilter(e.target.value)}
              >
                <option value="ทั้งหมด">สถานะงานทั้งหมด</option>

                <option value="ยังไม่เริ่ม">ยังไม่เริ่ม</option>

                <option value="กำลังดำเนินการ">กำลังดำเนินการ</option>

                <option value="เสร็จสิ้น">เสร็จสิ้น</option>
              </select>

              {/* REVIEW STATUS */}

              <select
                value={reviewStatusFilter}
                onChange={(e) => setReviewStatusFilter(e.target.value)}
              >
                <option value="ทั้งหมด">สถานะการตรวจทั้งหมด</option>

                <option value="ยังไม่ส่ง">ยังไม่ส่ง</option>

                <option value="รอตรวจ">รอตรวจ</option>

                <option value="ผ่าน">ผ่าน</option>

                <option value="แก้ไข">แก้ไข</option>
              </select>
            </div>

            {/* ===============================================
                BOARD / LIST
            =============================================== */}

            <div className="student-plan-view-switch">
              <button
                className={viewMode === "board" ? "active" : ""}
                onClick={() => setViewMode("board")}
              >
                Board
              </button>

              <button
                className={viewMode === "list" ? "active" : ""}
                onClick={() => setViewMode("list")}
              >
                List
              </button>
            </div>

            {/* ===============================================
                EMPTY
            =============================================== */}

            {filteredPhases.length === 0 && (
              <div className="student-plan-empty">
                <h4>ยังไม่มี Phase</h4>

                <p>กดปุ่ม "สร้าง Phase" เพื่อเริ่มกำหนดแผนงานของโครงงาน</p>
              </div>
            )}

            {/* ===============================================
                BOARD
            =============================================== */}

            {viewMode === "board" &&
              filteredPhases.map((phase) => (
                <div className="student-phase-card" key={phase.id}>
                  {/* PHASE HEADER */}

                  <div className="student-phase-header">
                    <div className="student-phase-name">
                      <span>{getPhaseTitle(phase)}</span>

                      <button
                        className="student-phase-edit-btn"
                        onClick={() => openEditPhase(phase)}
                      >
                        <FaEdit />
                      </button>
                    </div>

                    <span
                      className={`student-phase-status ${
                        phase.status === "เสร็จสิ้น"
                          ? "completed"
                          : phase.status === "กำลังดำเนินการ"
                            ? "working"
                            : "not-started"
                      }`}
                    >
                      {phase.status}
                    </span>
                  </div>

                  {/* PHASE BODY */}

                  <div className="student-phase-body">
                    <p>
                      ระยะเวลา : {formatThaiDate(phase.start_date)}
                      {" - "}
                      {formatThaiDate(phase.due_date)}
                    </p>

                    <p>
                      เสร็จสิ้นแล้ว {phase.completed_tasks}
                      {" จาก "}
                      {phase.total_tasks}
                      {" งาน"}
                    </p>

                    <button
                      className="student-phase-add-task-btn"
                      onClick={() => openAddTask(phase)}
                    >
                      เพิ่มงาน
                      <FaPlusCircle />
                    </button>

                    {/* BOARD COLUMNS */}

                    <div className="student-phase-board">
                      {/* =====================================
                          NOT STARTED
                      ===================================== */}

                      <div className="student-phase-column">
                        <div className="student-phase-column-title">
                          ยังไม่เริ่ม
                        </div>

                        <div className="student-phase-task-list">
                          {phase.tasks
                            .filter((task) => task.status === "ยังไม่เริ่ม")
                            .map((task) => (
                              <TaskCard
                                key={task.id}
                                task={task}
                                formatThaiDate={formatThaiDate}
                                onEdit={openEditTask}
                                onView={openTaskDetail}
                                onDetail={goToTaskDetailPage}
                              />
                            ))}
                        </div>
                      </div>

                      {/* =====================================
                          WORKING
                      ===================================== */}

                      <div className="student-phase-column">
                        <div className="student-phase-column-title">
                          กำลังดำเนินการ
                        </div>

                        <div className="student-phase-task-list">
                          {phase.tasks
                            .filter((task) => task.status === "กำลังดำเนินการ")
                            .map((task) => (
                              <TaskCard
                                key={task.id}
                                task={task}
                                formatThaiDate={formatThaiDate}
                                onEdit={openEditTask}
                                onView={openTaskDetail}
                                onDetail={goToTaskDetailPage}
                              />
                            ))}
                        </div>
                      </div>

                      {/* =====================================
                          COMPLETED
                      ===================================== */}

                      <div className="student-phase-column">
                        <div className="student-phase-column-title">
                          เสร็จสิ้น
                        </div>

                        <div className="student-phase-task-list">
                          {phase.tasks
                            .filter((task) => task.status === "เสร็จสิ้น")
                            .map((task) => (
                              <TaskCard
                                key={task.id}
                                task={task}
                                formatThaiDate={formatThaiDate}
                                onEdit={openEditTask}
                                onView={openTaskDetail}
                                onDetail={goToTaskDetailPage}
                              />
                            ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}

            {/* ===============================================
                LIST
            =============================================== */}

            {viewMode === "list" && filteredPhases.length > 0 && (
              <div className="student-plan-list">
                {filteredPhases.map((phase) => (
                  <div className="student-plan-list-phase" key={phase.id}>
                    <div className="student-plan-list-phase-header">
                      <strong>{getPhaseTitle(phase)}</strong>

                      <span>{phase.status}</span>
                    </div>

                    {phase.tasks.length === 0 ? (
                      <p className="student-plan-list-empty">ยังไม่มีงาน</p>
                    ) : (
                      <table>
                        <thead>
                          <tr>
                            <th>ชื่องาน</th>

                            <th>ผู้รับผิดชอบ</th>

                            <th>กำหนดส่ง</th>

                            <th>Subtask</th>

                            <th>สถานะงาน</th>

                            <th>สถานะการตรวจ</th>
                          </tr>
                        </thead>

                        <tbody>
                          {phase.tasks.map((task) => (
                            <tr key={task.id}>
                              <td>{task.task_name}</td>

                              <td>{task.assignee_name || "-"}</td>

                              <td>{formatThaiDate(task.due_date)}</td>

                              <td>
                                {task.completed_subtasks}

                                {" / "}

                                {task.total_subtasks}
                              </td>

                              <td>{task.status}</td>

                              <td>{task.review_status}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      </main>

      {/* =====================================================
          CREATE PHASE MODAL
      ===================================================== */}

      {showPhaseModal && (
        <div className="student-phase-modal-overlay">
          <div className="student-phase-modal">
            <h3>สร้าง Phase</h3>

            <div className="student-phase-modal-divider" />

            <label>
              ชื่อ Phase
              <span>*</span>
            </label>

            <input
              type="text"
              value={phaseName}
              onChange={(e) => setPhaseName(e.target.value)}
              placeholder="เช่น Proposal, Design, Development"
            />

            <label>วันที่เริ่มต้น</label>

            <input
              type="date"
              value={phaseStartDate}
              onChange={(e) => setPhaseStartDate(e.target.value)}
            />

            <label>วันที่สิ้นสุด</label>

            <input
              type="date"
              value={phaseDueDate}
              onChange={(e) => setPhaseDueDate(e.target.value)}
            />

            <div className="student-phase-modal-actions">
              <button
                className="student-phase-modal-cancel"
                disabled={creatingPhase}
                onClick={() => {
                  setShowPhaseModal(false);

                  setPhaseName("");

                  setPhaseStartDate("");

                  setPhaseDueDate("");
                }}
              >
                ยกเลิก
              </button>

              <button
                className="student-phase-modal-save"
                disabled={creatingPhase}
                onClick={handleCreatePhase}
              >
                {creatingPhase ? "กำลังสร้าง..." : "สร้าง Phase"}
              </button>
            </div>
          </div>
        </div>
      )}
      {/* =====================================================
    EDIT PHASE MODAL
===================================================== */}

      {showEditPhaseModal && editingPhase && (
        <div className="student-phase-modal-overlay">
          <div className="student-edit-phase-modal">
            {/* TITLE */}

            <h3>แก้ไข Phase</h3>

            <div className="student-edit-phase-divider" />

            {/* ===============================
          PHASE NAME
      =============================== */}

            <label>
              ชื่อ Phase
              <span>*</span>
            </label>

            <input
              type="text"
              value={editPhaseName}
              onChange={(e) => setEditPhaseName(e.target.value)}
            />

            {/* ===============================
          START DATE
      =============================== */}

            <label>
              วันที่เริ่มต้น
              <span>*</span>
            </label>

            <input
              type="date"
              value={editPhaseStartDate}
              onChange={(e) => setEditPhaseStartDate(e.target.value)}
            />

            {/* ===============================
          DUE DATE
      =============================== */}

            <label>
              วันที่สิ้นสุด
              <span>*</span>
            </label>

            <input
              type="date"
              value={editPhaseDueDate}
              onChange={(e) => setEditPhaseDueDate(e.target.value)}
            />

            {/* ===============================
          DATE ERROR
      =============================== */}

            {editPhaseStartDate &&
              editPhaseDueDate &&
              editPhaseStartDate > editPhaseDueDate && (
                <p className="student-edit-phase-error">
                  วันที่เริ่มต้นต้องไม่เกินวันที่สิ้นสุด
                </p>
              )}

            {/* ===============================
          DELETE
      =============================== */}

            <button
              type="button"
              className="student-edit-phase-delete"
              onClick={handleDeletePhase}
              disabled={deletingPhase || savingPhase}
            >
              {deletingPhase ? "กำลังลบ..." : "ลบ Phase"}
            </button>

            {/* ===============================
          ACTIONS
      =============================== */}

            <div className="student-edit-phase-actions">
              <button
                type="button"
                className="student-edit-phase-cancel"
                disabled={savingPhase || deletingPhase}
                onClick={() => {
                  setShowEditPhaseModal(false);

                  setEditingPhase(null);
                }}
              >
                ยกเลิก
              </button>

              <button
                type="button"
                className={`student-edit-phase-save ${
                  isEditPhaseValid ? "enabled" : "disabled"
                }`}
                disabled={!isEditPhaseValid || savingPhase || deletingPhase}
                onClick={handleSaveEditPhase}
              >
                {savingPhase ? "กำลังบันทึก..." : "บันทึกการแก้ไข"}
              </button>
            </div>
          </div>
        </div>
      )}
      {/* =====================================================
    ADD TASK MODAL
===================================================== */}

      {showTaskModal && selectedPhase && (
        <div className="student-phase-modal-overlay">
          <div className="student-task-modal">
            {/* TITLE */}

            <h3>เพิ่มงาน</h3>

            <div className="student-task-modal-divider" />

            {/* ===============================================
          PHASE
      =============================================== */}

            <label>Phase</label>

            <div className="student-task-phase-readonly">
              {selectedPhase.phase_name}
            </div>

            {/* ===============================================
          TASK NAME
      =============================================== */}

            <label>
              ชื่องาน
              <span>*</span>
            </label>

            <input
              type="text"
              value={taskName}
              onChange={(e) => setTaskName(e.target.value)}
            />

            {/* ===============================================
          DESCRIPTION
      =============================================== */}

            <label>รายละเอียด</label>

            <textarea
              className="student-task-description-input"
              value={taskDescription}
              onChange={(e) => setTaskDescription(e.target.value)}
            />

            {/* ===============================================
          START DATE
      =============================================== */}

            <label>
              วันที่เริ่มต้น
              <span>*</span>
            </label>

            <input
              type="date"
              value={taskStartDate}
              min={formatDateInput(selectedPhase.start_date)}
              max={formatDateInput(selectedPhase.due_date)}
              onChange={(e) => setTaskStartDate(e.target.value)}
            />

            {/* ===============================================
          DUE DATE
      =============================================== */}

            <label>
              กำหนดส่ง
              <span>*</span>
            </label>

            <input
              type="date"
              value={taskDueDate}
              min={taskStartDate || formatDateInput(selectedPhase.start_date)}
              max={formatDateInput(selectedPhase.due_date)}
              onChange={(e) => setTaskDueDate(e.target.value)}
            />

            {/* ===============================================
          DATE ERROR
      =============================================== */}

            {taskStartDate && taskDueDate && taskStartDate > taskDueDate && (
              <p className="student-task-modal-error">
                วันที่เริ่มต้นต้องไม่เกินกำหนดส่ง
              </p>
            )}

            {/* ===============================================
          SUBTASK
      =============================================== */}

            <label>Subtask</label>

            <textarea
              className="student-task-subtask-input"
              value={taskSubtasks}
              onChange={(e) => setTaskSubtasks(e.target.value)}
              placeholder={
                "พิมพ์ 1 Subtask ต่อ 1 บรรทัด\nเช่น\nออกแบบฐานข้อมูล\nสร้าง API\nทำหน้า UI"
              }
            />

            {/* ===============================================
          BUTTONS
      =============================================== */}

            <div className="student-task-modal-actions">
              <button
                type="button"
                className="student-task-modal-cancel"
                disabled={creatingTask}
                onClick={() => {
                  setShowTaskModal(false);

                  setSelectedPhase(null);

                  setTaskName("");

                  setTaskDescription("");

                  setTaskStartDate("");

                  setTaskDueDate("");

                  setTaskSubtasks("");
                }}
              >
                ยกเลิก
              </button>

              <button
                type="button"
                className={`student-task-modal-save ${
                  isTaskValid ? "enabled" : "disabled"
                }`}
                disabled={!isTaskValid || creatingTask}
                onClick={handleCreateTask}
              >
                {creatingTask ? "กำลังเพิ่ม..." : "เพิ่มงาน"}
              </button>
            </div>
          </div>
        </div>
      )}
      {/* =====================================================
    EDIT TASK MODAL
===================================================== */}

      {showEditTaskModal && editingTask && (
        <div className="student-phase-modal-overlay">
          <div className="student-edit-task-modal">
            <h3>แก้ไขงาน</h3>

            <div className="student-edit-task-divider" />

            {/* ชื่องาน */}

            <label>
              ชื่องาน
              <span>*</span>
            </label>

            <input
              type="text"
              value={editTaskName}
              onChange={(e) => setEditTaskName(e.target.value)}
            />

            {/* Phase */}

            <label>
              Phase
              <span>*</span>
            </label>

            <select
              value={editTaskPhaseId}
              onChange={(e) => setEditTaskPhaseId(e.target.value)}
            >
              {phases.map((phase) => (
                <option key={phase.id} value={phase.id}>
                  Phase {phase.phase_order}
                  {" : "}
                  {phase.phase_name}
                </option>
              ))}
            </select>

            {/* รายละเอียด */}

            <label>รายละเอียด</label>

            <textarea
              className="student-edit-task-description"
              value={editTaskDescription}
              onChange={(e) => setEditTaskDescription(e.target.value)}
            />

            {/* วันที่เริ่มต้น */}

            <label>
              วันที่เริ่มต้น
              <span>*</span>
            </label>

            <input
              type="date"
              value={editTaskStartDate}
              min={formatDateInput(selectedEditTaskPhase?.start_date || null)}
              max={formatDateInput(selectedEditTaskPhase?.due_date || null)}
              onChange={(e) => setEditTaskStartDate(e.target.value)}
            />

            {/* กำหนดส่ง */}

            <label>
              กำหนดส่ง
              <span>*</span>
            </label>

            <input
              type="date"
              value={editTaskDueDate}
              min={
                editTaskStartDate ||
                formatDateInput(selectedEditTaskPhase?.start_date || null)
              }
              max={formatDateInput(selectedEditTaskPhase?.due_date || null)}
              onChange={(e) => setEditTaskDueDate(e.target.value)}
            />

            {/* Subtask */}

            <label>Subtask</label>

            <textarea
              className="student-edit-task-subtasks"
              value={editTaskSubtasks}
              onChange={(e) => setEditTaskSubtasks(e.target.value)}
            />

            {/* ลบงาน */}

            <button
              type="button"
              className="student-edit-task-delete"
              onClick={handleDeleteTask}
              disabled={savingTask || deletingTask}
            >
              {deletingTask ? "กำลังลบ..." : "ลบงาน"}
            </button>

            {/* ปุ่มล่าง */}

            <div className="student-edit-task-actions">
              <button
                type="button"
                className="student-edit-task-cancel"
                disabled={savingTask || deletingTask}
                onClick={() => {
                  setShowEditTaskModal(false);
                  setEditingTask(null);
                }}
              >
                ยกเลิก
              </button>

              <button
                type="button"
                className={`student-edit-task-save ${
                  isEditTaskValid ? "enabled" : "disabled"
                }`}
                disabled={!isEditTaskValid || savingTask || deletingTask}
                onClick={handleSaveEditTask}
              >
                {savingTask ? "กำลังบันทึก..." : "บันทึกการแก้ไข"}
              </button>
            </div>
          </div>
        </div>
      )}
      {/* =====================================================
    TASK DETAIL MODAL
===================================================== */}

      {showTaskDetailModal && selectedTaskDetail && (
        <div className="student-phase-modal-overlay">
          <div className="student-task-detail-modal">
            {/* TITLE */}

            <h3>รายละเอียดงาน</h3>

            <div className="student-task-detail-divider" />

            {/* ===============================================
          NAME + STATUS
      =============================================== */}

            <div className="student-task-detail-heading">
              <strong>{selectedTaskDetail.task_name}</strong>

              <span
                className={`student-task-detail-status ${
                  selectedTaskDetail.status === "ยังไม่เริ่ม"
                    ? "not-started"
                    : selectedTaskDetail.status === "กำลังดำเนินการ"
                      ? "working"
                      : "completed"
                }`}
              >
                {selectedTaskDetail.status}
              </span>
            </div>

            {/* ===============================================
          PHASE
      =============================================== */}

            <p>
              <strong>
                Phase {selectedTaskDetailPhase?.phase_order || "-"}
                {" : "}
              </strong>

              {selectedTaskDetailPhase?.phase_name || "-"}
            </p>

            {/* ===============================================
          ASSIGNEE
      =============================================== */}

            <p>
              <strong>ผู้รับผิดชอบ :</strong>{" "}
              {selectedTaskDetail.assignee_name || "-"}
            </p>

            {/* ===============================================
          DATE
      =============================================== */}

            <p>
              <strong>วันที่เริ่มต้น :</strong>{" "}
              {formatThaiDate(selectedTaskDetail.start_date)}
            </p>

            <p>
              <strong>กำหนดส่ง :</strong>{" "}
              {formatThaiDate(selectedTaskDetail.due_date)}
            </p>

            {/* ===============================================
          DESCRIPTION
      =============================================== */}

            <div className="student-task-detail-section">
              <h4>รายละเอียดงาน</h4>

              <p>{selectedTaskDetail.description || "-"}</p>
            </div>

            {/* ===============================================
          SUBTASK
      =============================================== */}

            <div className="student-task-detail-section">
              <h4>
                Subtask : {selectedTaskDetail.completed_subtasks}
                {" / "}
                {selectedTaskDetail.total_subtasks}
              </h4>

              {selectedTaskDetail.subtasks.length === 0 ? (
                <p>ไม่มี Subtask</p>
              ) : (
                <div className="student-task-detail-subtasks">
                  {selectedTaskDetail.subtasks.map((subtask) => (
                    <div
                      key={subtask.id}
                      className={`student-task-detail-subtask ${
                        subtask.status === "เสร็จสิ้น" ? "completed" : ""
                      }`}
                    >
                      <span className="student-task-detail-circle">
                        {subtask.status === "เสร็จสิ้น" ? "✓" : ""}
                      </span>

                      <span>{subtask.subtask_name}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* ===============================================
          BUTTONS
      =============================================== */}

            <div className="student-task-detail-actions">
              <button
                type="button"
                className="student-task-detail-cancel"
                disabled={startingTask}
                onClick={() => {
                  setShowTaskDetailModal(false);

                  setSelectedTaskDetail(null);
                }}
              >
                ยกเลิก
              </button>

              {selectedTaskDetail.status === "ยังไม่เริ่ม" && (
                <button
                  type="button"
                  className="student-task-detail-start"
                  disabled={startingTask}
                  onClick={handleStartTask}
                >
                  {startingTask ? "กำลังดำเนินการ..." : "เริ่มดำเนินการ"}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* =========================================================
   TASK CARD
========================================================= */

function TaskCard({
  task,
  formatThaiDate,
  onEdit,
  onView,
  onDetail,
}: {
  task: Task;

  formatThaiDate: (value: string | null) => string;

  onEdit: (task: Task) => void;

  onView: (task: Task) => void;

  onDetail: (task: Task) => void;
}) {
  return (
    <div className="student-task-card" onClick={() => onView(task)}>
      <div className="student-task-title">
        <span>{task.task_name}</span>

        <button
          type="button"
          className="student-task-edit-btn"
          onClick={(e) => {
            e.stopPropagation();

            onEdit(task);
          }}
        >
          <FaEdit />
        </button>
      </div>

      <p>ผู้รับผิดชอบ : {task.assignee_name || "-"}</p>

      {task.due_date && <p>กำหนดส่ง : {formatThaiDate(task.due_date)}</p>}

      <p>
        Subtask : {task.completed_subtasks}
        {" / "}
        {task.total_subtasks}
      </p>

      <button
        type="button"
        className="student-task-detail-btn"
        onClick={(e) => {
          e.stopPropagation();

          onDetail(task);
        }}
      >
        ดูรายละเอียด
      </button>

      {task.review_status !== "ยังไม่ส่ง" && (
        <span
          className={`student-task-review ${
            task.review_status === "ผ่าน"
              ? "passed"
              : task.review_status === "รอตรวจ"
                ? "waiting"
                : "revision"
          }`}
        >
          {task.review_status}
        </span>
      )}
    </div>
  );
}

export default StudentProjectPlan;
