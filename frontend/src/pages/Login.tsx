import { useState } from "react";
import { FaEye, FaEyeSlash } from "react-icons/fa";

function Login() {

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = () => {

  if (!username && !password) {
    setError(
      "กรุณากรอกรหัสประจำตัวและรหัสผ่าน"
    );
    return;
  }

  if (!username) {
    setError("กรุณากรอกรหัสประจำตัว");
    return;
  }

  if (!password) {
    setError("กรุณากรอกรหัสผ่าน");
    return;
  }

  setError("");

  alert("ผ่าน Validation แล้ว");
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
      onChange={(e) => setUsername(e.target.value)}
    />

<div className="password-container">
  <input
    type={showPassword ? "text" : "password"}
    placeholder="รหัสผ่าน"
    value={password}
    onChange={(e) => setPassword(e.target.value)}
  />

  <button
    type="button"
    className="toggle-password"
    onClick={() => setShowPassword(!showPassword)}
  >
    {showPassword ? <FaEyeSlash /> : <FaEye />}
  </button>
</div>

    {error && (
      <p style={{ color: "red" }}>
        {error}
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