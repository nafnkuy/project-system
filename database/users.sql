CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(20) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  name VARCHAR(100) NOT NULL,
  role ENUM('student','teacher') NOT NULL,
  profile_image VARCHAR(255)
);

INSERT INTO users (username,password,name,role,profile_image)
VALUES
('66160000','1234','สุขใจ ใจดี','student','/src/assets/student.jpg'),
('teacher01','1234','ผศ.ดร.สมชาย ใจดี','teacher','/src/assets/teacher01.jpg');