import "./StudentTaskDetail.css";

import { useEffect, useMemo, useState } from "react";

import { useNavigate, useParams } from "react-router-dom";

import axios from "axios";

import { FaEdit, FaPlus, FaTrash } from "react-icons/fa";

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

    if (task.status === "ยังไม่เริ่ม") {
      return false;
    }

    if (task.review_status === "รอตรวจ" || task.review_status === "ผ่าน") {
      return false;
    }

    return true;
  }, [taskData]);

  /* =========================================================
   CAN EDIT SUBTASK
========================================================= */

  const canEditSubtasks = useMemo(() => {
    if (!taskData) {
      return false;
    }

    if (
      taskData.task.review_status === "รอตรวจ" ||
      taskData.task.review_status === "ผ่าน"
    ) {
      return false;
    }

    return true;
  }, [taskData]);

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
    if (!taskData || !userId || !hasProgressChanges) {
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

            <button>เอกสารและการส่งงาน</button>

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

                  <button
                    type="button"
                    className="student-add-subtask-btn"
                    disabled={!canEditSubtasks || savingProgress}
                    onClick={handleOpenAddSubtask}
                  >
                    <FaPlus />
                    เพิ่ม Subtask
                  </button>
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

                        <div className="student-subtask-actions">
                          <button
                            type="button"
                            className="student-subtask-edit-btn"
                            title="แก้ไข Subtask"
                            disabled={
                              !canEditSubtasks ||
                              deletingSubtaskId === subtask.id
                            }
                            onClick={() => handleOpenEditSubtask(subtask)}
                          >
                            <FaEdit />
                          </button>

                          <button
                            type="button"
                            className="student-subtask-delete-btn"
                            title="ลบ Subtask"
                            disabled={
                              !canEditSubtasks ||
                              deletingSubtaskId === subtask.id
                            }
                            onClick={() => handleDeleteSubtask(subtask)}
                          >
                            <FaTrash />
                          </button>
                        </div>
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
                <h4>เอกสารแนบ</h4>

                <div className="student-task-file-area">
                  <button
                    type="button"
                    className="student-task-file-btn"
                    disabled
                  >
                    แนบเอกสาร
                  </button>

                  <span>ยังไม่มีเอกสารแนบ</span>
                </div>
              </div>
            </div>

            {/* BUTTON */}

            <div className="student-task-actions">
              <button
                type="button"
                className="student-task-back-btn"
                onClick={() =>
                  navigate(`/student-project-detail/${projectId}/plan`)
                }
              >
                กลับไปยังแผนงาน
              </button>

              <button
                type="button"
                className="student-task-save-btn"
                disabled={
                  !canEditProgress || !hasProgressChanges || savingProgress
                }
                onClick={handleSaveProgress}
              >
                {savingProgress ? "กำลังบันทึก..." : "บันทึกความคืบหน้า"}
              </button>
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
    </div>
  );
}

export default StudentTaskDetail;
