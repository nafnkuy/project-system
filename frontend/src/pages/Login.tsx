import { useState } from "react";
import { useNavigate } from "react-router-dom"; //useNavigate ใช้เปลี่ยนหน้า
import { FaEye, FaEyeSlash } from "react-icons/fa"; //ไอคอนตา

function Login() {
  const navigate = useNavigate(); //ใช้เปลี่ยนหน้า

  const [username, setUsername] = useState(""); //เก็บค่ารหัสประจำตัว
  const [password, setPassword] = useState(""); //เก็บค่ารหัสผ่าน

  const [errors, setErrors] = useState({
    //เก็บค่าความผิดพลาด
    username: "",
    password: "",
  });

  const [loginError, setLoginError] = useState(""); //เก็บค่าความผิดพลาดในการเข้าสู่ระบบ
  const [showPassword, setShowPassword] = useState(false); //เก็บค่าการแสดงรหัสผ่าน

  const handleLogin = async () => {
    //ฟังก์ชันสำหรับเข้าสู่ระบบ
    const newErrors = {
      //เก็บค่าความผิดพลาด
      username: "",
      password: "",
    };

    if (!username.trim()) {
      //ตรวจสอบว่ารหัสประจำตัวว่างหรือไม่
      newErrors.username = "กรุณากรอกรหัสประจำตัว";
    }

    if (!password.trim()) {
      //ตรวจสอบว่ารหัสผ่านว่างหรือไม่
      newErrors.password = "กรุณากรอกรหัสผ่าน";
    }

    setErrors(newErrors); //อัปเดตค่าความผิดพลาด

    if (newErrors.username || newErrors.password) {
      //ตรวจสอบว่ามีความผิดพลาดหรือไม่
      return;
    }

    setLoginError(""); //ล้างค่าความผิดพลาดในการเข้าสู่ระบบ

    try {
      //ลองเข้าสู่ระบบ
      const response = await fetch(
        //ส่งคำขอเข้าสู่ระบบ
        "http://localhost:5000/login", //ส่งคำขอเข้าสู่ระบบไปยังเซิร์ฟเวอร์ endpoint /login
        {
          method: "POST",
          headers: {
            //กำหนดหัวข้อของคำขอ
            "Content-Type": "application/json", //กำหนดประเภทของข้อมูลเป็น JSON
          },
          body: JSON.stringify({
            //แปลงข้อมูลเป็น JSON
            username,
            password,
          }),
        },
      );

      if (!response.ok) {
        //ตรวจสอบว่าการเข้าสู่ระบบสำเร็จหรือไม่
        setLoginError(
          //แสดงข้อความความผิดพลาด
          "รหัสประจำตัวหรือรหัสผ่านไม่ถูกต้อง",
        );
        return;
      }

      const data = await response.json(); //แปลงข้อมูลที่ได้รับจากเซิร์ฟเวอร์เป็น JSON

      if (data.user.role === "student") {
        //ตรวจสอบว่าผู้ใช้เป็นนิสิตหรือไม่

        localStorage.setItem(
          //เก็บค่ารหัสประจำตัวและชื่อผู้ใช้ใน localStorage
          "username",
          data.user.username,
        );
        /*localStorage.setItem( 
"name",
data.user.name
);*/
        localStorage.setItem("profileImage", data.user.profileImage);

        navigate("/StudentHome"); //เปลี่ยนหน้าไปยังหน้าหลักของนิสิต

        return;
      }

      if (data.user.role === "teacher") {
        //ตรวจสอบว่าผู้ใช้เป็นอาจารย์หรือไม่
        localStorage.setItem("profileImage", data.user.profileImage);

        navigate("/teacher-home");

        return;
      }

      console.log("Login Success:", data); //แสดงข้อความเข้าสู่ระบบสำเร็จ

      //alert("เข้าสู่ระบบสำเร็จ");

      // ไว้แก้กลับทีหลัง
      //navigate("/home");
    } catch (error) {
      //จับข้อผิดพลาดในการเข้าสู่ระบบ
      console.error(error);

      setLoginError("ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้");
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
            setUsername(e.target.value); //อัปเดตค่ารหัสประจำตัว

            setLoginError(""); //ล้างค่าความผิดพลาดในการเข้าสู่ระบบ

            if (errors.username) {
              //ตรวจสอบว่ามีความผิดพลาดหรือไม่
              setErrors((prev) => ({
                //อัปเดตค่าความผิดพลาด
                ...prev,
                username: "",
              }));
            }
          }}
          className={errors.username || loginError ? "input-error" : ""}
        />

        {errors.username && ( //ตรวจสอบว่ามีความผิดพลาดหรือไม่
          <p className="error-text">ⓘ {errors.username}</p>
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
            onClick={() => setShowPassword(!showPassword)} //สลับการแสดงรหัสผ่าน
          >
            {showPassword ? <FaEyeSlash /> : <FaEye />}
          </button>
        </div>

        {errors.password && ( //ตรวจสอบว่ามีความผิดพลาดหรือไม่
          <p className="error-text">ⓘ {errors.password}</p>
        )}
        {loginError && ( //ตรวจสอบว่ามีความผิดพลาดในการเข้าสู่ระบบหรือไม่
          <p className="error-text">ⓘ {loginError}</p>
        )}

        <button className="login-btn" onClick={handleLogin}>
          เข้าสู่ระบบ
        </button>
      </div>
    </div>
  );
}

export default Login;
