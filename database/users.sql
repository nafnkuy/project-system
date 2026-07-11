CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(20) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  name VARCHAR(100) NOT NULL,
  role ENUM('student','teacher') NOT NULL,
  profile_image VARCHAR(255)
);

INSERT INTO `users` (`id`, `username`, `password`, `name`, `role`, `profile_image`) VALUES
(1, '66160000', '1234', 'สุขใจ ใจดี', 'student', '/src/assets/student.jpg'),
(2, 'teacher01', '1234', 'ผศ.ดร.สมชาย ใจดี', 'teacher', '/src/assets/teacher01.jpg'),
(3, 'teacher02', '1234', 'ผศ.ดร.กิตติ', 'teacher', '/src/assets/teacher02.jpg'),
(4, 'teacher03', '1234', 'ผศ.ดร.ประวิทย์', 'teacher', '/src/assets/teacher03.jpg'),
(5, 'teacher04', '1234', 'ผศ.ดร.สุชาติ', 'teacher', '/src/assets/teacher04.jpg'),
(6, 'teacher05', '1234', 'ผศ.ดร.อนันต์', 'teacher', '/src/assets/teacher05.jpg'),
(7, '66160001', '1234', 'กิตติพงษ์ แสงดี', 'student', '/src/assets/student2.jpg');