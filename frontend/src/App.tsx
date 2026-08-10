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
      </Routes>
    </BrowserRouter>
  );
}
export default App
