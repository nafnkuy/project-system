import { BrowserRouter, Routes, Route } from "react-router-dom";
import './App.css'
import Login from './pages/Login'
import StudentHome from "./pages/student/StudentHome";
import TeacherHome from "./pages/teacher/Teacher-home";
import ProjectDetail from "./pages/student/ProjectDetail";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/StudentHome" element={<StudentHome />} />
        <Route path="/project-details/:id" element={<ProjectDetail />} />
        <Route path="/teacher-home" element={<TeacherHome />} />
      </Routes>
    </BrowserRouter>
  );
}
export default App
