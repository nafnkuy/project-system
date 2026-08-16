import { BrowserRouter, Routes, Route } from "react-router-dom";
import './App.css'
import Login from './pages/Login'
import StudentHome from "./pages/student/StudentHome";
import ProjectDetail from "./pages/student/ProjectDetail";
import ApplyProject from "./pages/student/ApplyProject";
import SubmitNewProject from "./pages/student/SubmitNewProject";

import TeacherHome from "./pages/teacher/TeacherHome";
import TeacherProjects from "./pages/teacher/TeacherProjects";
import CreateTeacherProject from "./pages/teacher/CreateTeacherProject";
import TeacherProjectDetail from "./pages/teacher/TeacherProjectDetail";
import TeacherProjectEdit from "./pages/teacher/TeacherProjectEdit";
import TeacherRequestDetail from "./pages/teacher/TeacherRequestDetail";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/StudentHome" element={<StudentHome />} />
        <Route path="/apply-project/:id" element={<ApplyProject />} />
        <Route path="/project-details/:id" element={<ProjectDetail />} />
        <Route path="/submit-new-project" element={<SubmitNewProject />} />
        <Route path="/teacher-home" element={<TeacherHome />} />
        <Route path="/teacher-projects" element={<TeacherProjects />} />
        <Route path="/create-teacher-project" element={<CreateTeacherProject />} />
        <Route path="/teacher-project-details/:id" element={<TeacherProjectDetail />} />
        <Route path="/teacher-project-edit/:id" element={<TeacherProjectEdit />} />
        <Route path="/teacher-request-details/:id" element={<TeacherRequestDetail />} />
      </Routes>
    </BrowserRouter>
  );
}
export default App
