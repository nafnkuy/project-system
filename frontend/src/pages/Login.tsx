import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaEye, FaEyeSlash } from "react-icons/fa";

function Login() {

const navigate = useNavigate();

const [username, setUsername] = useState("");
const [password, setPassword] = useState("");

const [errors, setErrors] = useState({
  username: "",
  password: "",
});

const [loginError, setLoginError] = useState("");
const [showPassword, setShowPassword] = useState(false);

/*const mockUser = {
  username: "66160000",
  password: "1234",
};*/

const handleLogin = async () => {
  const newErrors = {
    username: "",
    password: "",
  };

  if (!username.trim()) {
    newErrors.username = "กรุณากรอกรหัสประจำตัว";
  }

  if (!password.trim()) {
    newErrors.password = "กรุณากรอกรหัสผ่าน";
  }

  setErrors(newErrors);

  if (newErrors.username || newErrors.password) {
    return;
  }

  setLoginError("");

  try {
    const response = await fetch(
      "http://localhost:5000/login",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username,
          password,
        }),
      }
    );

    if (!response.ok) {
      setLoginError(
        "รหัสประจำตัวหรือรหัสผ่านไม่ถูกต้อง"
      );
      return;
    }

    const data = await response.json();

if (data.user.role === "student") {

  localStorage.setItem(
    "username",
    data.user.username
  );

  localStorage.setItem(
    "name",
    data.user.name
  );

  navigate("/StudentHome");

  return;
}

if (data.user.role === "teacher") {
  navigate("/teacher-home");
  return;
}

    console.log("Login Success:", data);

    //alert("เข้าสู่ระบบสำเร็จ");

    // ไว้แก้กลับทีหลัง
     //navigate("/home");

  } catch (error) {
    console.error(error);

    setLoginError(
      "ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้"
    );
  }
};

  return (
    <div className="login-container">
      <div className="login-card">

        <h1>เข้าสู่ระบบ</h1>

          <p className="login-description">
            กรุณากรอกรหัสประจำตัวและรหัสผ่านเพื่อเข้าสู่ระบบ
          </p>

<input
  type="text"
  placeholder="รหัสประจำตัว"
  value={username}
  onChange={(e) => {
    setUsername(e.target.value);

    setLoginError("");

    if (errors.username) {
      setErrors((prev) => ({
        ...prev,
        username: "",
      }));
    }
  }}
  className={
  errors.username || loginError
    ? "input-error"
    : ""
}
/>

{errors.username && (
  <p className="error-text">
    ⓘ {errors.username}
  </p>
)}

<div className="password-container">
  <input
    type={showPassword ? "text" : "password"}
    placeholder="รหัสผ่าน"
    value={password}
    onChange={(e) => {
      setPassword(e.target.value);

      setLoginError("");

      if (errors.password) {
        setErrors((prev) => ({
          ...prev,
          password: "",
        }));
      }
    }}
    className={errors.password ? "input-error" : ""}
  />

  <button
    type="button"
    className="toggle-password"
    onClick={() => setShowPassword(!showPassword)}
  >
    {showPassword ? <FaEyeSlash /> : <FaEye />}
  </button>
</div>

{errors.password && (
  <p className="error-text">
    ⓘ {errors.password}
  </p>
)}
{loginError && (
  <p className="error-text">
    ⓘ {loginError}
  </p>
)}


    <button
      className="login-btn"
      onClick={handleLogin}
    >
      เข้าสู่ระบบ
    </button>

      </div>
    </div>
  );
}

export default Login;