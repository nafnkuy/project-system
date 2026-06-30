import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";

interface Project {
  id: number;
  title: string;
  advisor: string;
  major: string;
  status: string;
}

function ProjectDetail() {
  const { id } = useParams();

  const [project, setProject] = useState<Project | null>(null);

  useEffect(() => {
    axios
      .get(`http://localhost:5000/projects/${id}`)
      .then((res) => {
        setProject(res.data);
      })
      .catch((err) => {
        console.log(err);
      });
  }, [id]);

  if (!project) {
    return <h2>กำลังโหลด...</h2>;
  }

  return (
    <div>
      <h1>{project.title}</h1>

      <p>อาจารย์ที่ปรึกษา : {project.advisor}</p>

      <p>สาขา : {project.major}</p>

      <p>สถานะ : {project.status}</p>
    </div>
  );
}

export default ProjectDetail;