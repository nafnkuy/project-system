import { BrowserRouter, Routes, Route } from "react-router-dom";
import "./App.css";
import Login from "./pages/Login";
import StudentHome from "./pages/student/StudentHome";
import ProjectDetail from "./pages/student/ProjectDetail";
import ApplyProject from "./pages/student/ApplyProject";
import SubmitNewProject from "./pages/student/SubmitNewProject";
import TeacherList from "./pages/student/TeacherList";
import TeacherDetail from "./pages/student/TeacherDetail";
import StudentProject from "./pages/student/StudentProject";
import StudentNotifications from "./pages/student/StudentNotifications";
import StudentProjectDetail from "./pages/student/StudentProjectDetail";
import StudentProjectPlan from "./pages/student/StudentProjectPlan";
import StudentTaskDetail from "./pages/student/StudentTaskDetail";

import TeacherHome from "./pages/teacher/TeacherHome";
import TeacherProjects from "./pages/teacher/TeacherProjects";
import CreateTeacherProject from "./pages/teacher/CreateTeacherProject";
import TeacherProjectDetail from "./pages/teacher/TeacherProjectDetail";
import TeacherProjectEdit from "./pages/teacher/TeacherProjectEdit";
import TeacherRequestDetail from "./pages/teacher/TeacherRequestDetail";
import StudentProjectRequestDetail from "./pages/student/StudentProjectRequestDetail";
import TeacherNotifications from "./pages/teacher/TeacherNotifications";
import TeacherDecisionHistory from "./pages/teacher/TeacherDecisionHistory";
import TeacherRequests from "./pages/teacher/TeacherRequests";


import StaffHome from "./pages/Staff/StaffHome";
import StaffDocumentDetail from "./pages/Staff/StaffDocumentDetail";
import StaffDocuments from "./pages/Staff/StaffDocuments";
import StaffSignatureHistory from "./pages/Staff/StaffSignatureHistory";
import StaffNotifications from "./pages/Staff/StaffNotifications";
import StaffProfile from "./pages/Staff/StaffProfile";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/StudentHome" element={<StudentHome />} />
        <Route path="/apply-project/:id" element={<ApplyProject />} />
        <Route path="/project-details/:id" element={<ProjectDetail />} />
        <Route path="/submit-new-project" element={<SubmitNewProject />} />
        <Route path="/teachers" element={<TeacherList />} />
        <Route path="/teacher-detail/:teacherId" element={<TeacherDetail />} />
        <Route path="/student-project" element={<StudentProject />} />
        <Route path="/student-project-request-detail/:requestId/:studentId" element={<StudentProjectRequestDetail />} />
        <Route path="/student-notifications" element={<StudentNotifications />} />
        <Route path="/student-project-detail/:projectId" element={<StudentProjectDetail />} />
        <Route path="/student-project-detail/:projectId/plan" element={<StudentProjectPlan />} />
        <Route path="/student-project-detail/:projectId/plan/task/:taskId" element={<StudentTaskDetail />} />

        <Route path="/teacher-home" element={<TeacherHome />} />
        <Route path="/teacher-projects" element={<TeacherProjects />} />
        <Route path="/create-teacher-project"  element={<CreateTeacherProject />}/>
        <Route path="/teacher-project-details/:id"  element={<TeacherProjectDetail />}/>
        <Route  path="/teacher-project-edit/:id"  element={<TeacherProjectEdit />}/>
        <Route  path="/teacher-request-details/:id"  element={<TeacherRequestDetail />}/>
        <Route path="/teacher-notifications" element={<TeacherNotifications />} />
        <Route path="/teacher-decision-history" element={<TeacherDecisionHistory />} />
        <Route path="/teacher-requests" element={<TeacherRequests />} />


        <Route path="/staff-home" element={<StaffHome />} />
        <Route path="/staff-document/:id" element={<StaffDocumentDetail />} />
        <Route path="/staff-documents" element={<StaffDocuments />} />
        <Route path="/staff-signature-history" element={<StaffSignatureHistory />} />
        <Route path="/staff-notifications" element={<StaffNotifications />} />
        <Route path="/staff-profile" element={<StaffProfile />} />
      </Routes>
    </BrowserRouter>
  );
}
export default App;
