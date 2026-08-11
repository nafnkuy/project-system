-- phpMyAdmin SQL Dump
-- version 5.2.2
-- https://www.phpmyadmin.net/
--
-- Host: mysql:3306
-- Generation Time: Aug 11, 2026 at 12:34 PM
-- Server version: 8.0.43
-- PHP Version: 8.2.29

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `sptc`
--

-- --------------------------------------------------------

--
-- Table structure for table `notifications`
--

CREATE TABLE `notifications` (
  `id` int NOT NULL,
  `user_id` int NOT NULL,
  `message` text NOT NULL,
  `is_read` tinyint DEFAULT '0',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `notifications`
--

INSERT INTO `notifications` (`id`, `user_id`, `message`, `is_read`, `created_at`) VALUES
(1, 1, 'กิตติพงษ์ แสงดี ตอบรับคำเชิญเข้าร่วมโครงงาน \"รอบที่ล้าน\" แล้ว', 0, '2026-08-10 19:08:28');

-- --------------------------------------------------------

--
-- Table structure for table `projects`
--

CREATE TABLE `projects` (
  `id` int NOT NULL,
  `title` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT 'ชื่อหัวข้อโครงงาน',
  `advisor` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT 'อาจารย์ที่ปรึกษา',
  `advisor_id` int NOT NULL COMMENT 'id ของอาจารยฺ์',
  `major` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT 'สาขาวิชา',
  `status` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT 'สถานะมีเปิดรับ ปิดรับ',
  `visibility` enum('แสดง','ซ่อน') DEFAULT 'แสดง',
  `project_type` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL COMMENT 'เป็นประเภทของงานว่าเป็นคู่หรือเดี่ยว',
  `max_members` int DEFAULT NULL COMMENT 'จำนวนที่รับ',
  `current_members` int DEFAULT NULL COMMENT 'จำนวนสมาชิกที่รับแล้ว',
  `academic_year` varchar(10) DEFAULT NULL COMMENT 'ปีการศึกษา',
  `description` text,
  `objectives` text,
  `skills` text,
  `requirements` text,
  `source` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT 'มาจากใคร'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `projects`
--

INSERT INTO `projects` (`id`, `title`, `advisor`, `advisor_id`, `major`, `status`, `visibility`, `project_type`, `max_members`, `current_members`, `academic_year`, `description`, `objectives`, `skills`, `requirements`, `source`) VALUES
(1, 'ระบบติดตามโครงงานนิสิต', 'ผศ.ดร.สมชาย', 2, 'IT', 'ใกล้เต็ม', 'แสดง', 'โครงงานคู่', 2, 1, '2569/1', 'ระบบที่ช่วยให้นิสิตและอาจารย์สามารถติดตามความคืบหน้าของโครงงานได้แบบต่อเนื่อง ลดปัญหาการส่งงานล่าช้าและการสื่อสารที่ไม่ชัดเจน ผู้ใช้งานสามารถอัปโหลดไฟล์ ส่งรายงาน และรับข้อเสนอแนะจากอาจารย์ได้ทันที ทำให้การทำโครงงานมีทิศทางชัดเจนและตรวจสอบได้ตลอดเวลา\r\n', 'ศึกษาการประยุกต์ใช้ RFID|พัฒนาระบบ Web Application|ประยุกต์ใช้ AI วิเคราะห์ข้อมูล', 'React|Node.js|MySQL|Git', 'ปี 2 ขึ้นไป|มีพื้นฐาน React|ทำงานเป็นทีมได้', 'teacher'),
(2, 'ทดสอบ', 'teacher01', 2, 'IT', 'เปิดรับ', 'แสดง', 'โครงงานเดี่ยว', 1, 0, '2569/1', 'ดดดดดดด', 'ดดดดดดด', 'React|Node.js|MySQL|Git', 'กหอกหอกหอ', 'teacher'),
(3, 'รอบที่ล้าน', 'ผศ.ดร.สมชาย ใจดี', 2, 'IT', 'รออนุมัติ', 'แสดง', 'คู่', 2, 0, NULL, 'ดกเดก', 'กดเกดเ', 'React | Node.js', '', 'student'),
(4, 'รอบที่ห้าล้านย', 'ผศ.ดร.สมชาย ใจดี', 2, 'IT', 'เปิดรับ', 'แสดง', 'โครงงานเดี่ยว', 1, 0, '2569/1', 'หกดเกหเ', 'ดกเกดเ', 'ดกเดกเ', 'ดกเกดเ', 'teacher'),
(5, '555555', 'ผศ.ดร.สมชาย ใจดี', 2, 'IT', 'เปิดรับ', 'แสดง', 'โครงงานเดี่ยว', 1, 0, '2569/1', 'หกหด', 'กหดหกด', 'กหดหกด', 'หกดกหด', 'teacher'),
(6, 'ดดดดดดดด', 'ผศ.ดร.สมชาย ใจดี', 2, 'IT', 'รออนุมัติ', 'แสดง', 'เดี่ยว', 1, 0, NULL, 'กดเดกเ', 'กดเกดเ', 'กดเดกเ', '', 'student');

-- --------------------------------------------------------

--
-- Table structure for table `project_invitations`
--

CREATE TABLE `project_invitations` (
  `id` int NOT NULL,
  `sender_id` int NOT NULL,
  `receiver_id` int NOT NULL,
  `project_id` int NOT NULL,
  `advisor_id` int NOT NULL,
  `title` varchar(255) NOT NULL,
  `project_type` varchar(20) DEFAULT NULL,
  `description` text,
  `objectives` text,
  `skills` text,
  `requirements` text,
  `contact_type` varchar(50) DEFAULT NULL,
  `contact_value` varchar(255) DEFAULT NULL,
  `introduction` text,
  `status` enum('รอตอบรับ','ตอบรับ','ปฏิเสธ') DEFAULT 'รอตอบรับ',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `project_invitations`
--

INSERT INTO `project_invitations` (`id`, `sender_id`, `receiver_id`, `project_id`, `advisor_id`, `title`, `project_type`, `description`, `objectives`, `skills`, `requirements`, `contact_type`, `contact_value`, `introduction`, `status`, `created_at`) VALUES
(7, 1, 7, 3, 2, 'รอบที่ล้าน', 'คู่', 'ดกเดก', 'กดเกดเ', 'React | Node.js', '', 'Line ID', '564654', 'ดกเดกเ', 'ตอบรับ', '2026-08-10 19:07:53'),
(8, 1, 7, 3, 2, 'รอบที่ล้าน', 'คู่', 'ดกเดก', 'กดเกดเ', 'React | Node.js', '', 'Line ID', '564654', 'ดกเดกเ', 'ตอบรับ', '2026-08-10 19:08:36');

-- --------------------------------------------------------

--
-- Table structure for table `project_members`
--

CREATE TABLE `project_members` (
  `id` int NOT NULL,
  `project_id` int NOT NULL,
  `user_id` int NOT NULL,
  `project_memberscol` varchar(45) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Table structure for table `project_requests`
--

CREATE TABLE `project_requests` (
  `id` int NOT NULL,
  `project_id` int NOT NULL,
  `student_id` int NOT NULL,
  `introduction` text,
  `request_file` varchar(255) DEFAULT NULL,
  `status` enum('รอพิจารณา','อนุมัติ','ไม่อนุมัติ','ถูกยกเลิก') DEFAULT 'รอพิจารณา',
  `reject_reason` text,
  `request_date` datetime DEFAULT CURRENT_TIMESTAMP,
  `decision_date` datetime DEFAULT NULL,
  `contact_type` varchar(50) DEFAULT NULL,
  `contact_value` varchar(255) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `project_requests`
--

INSERT INTO `project_requests` (`id`, `project_id`, `student_id`, `introduction`, `request_file`, `status`, `reject_reason`, `request_date`, `decision_date`, `contact_type`, `contact_value`) VALUES
(8, 1, 1, 'เด้ดเ้ดเ้', NULL, 'รอพิจารณา', NULL, '2026-08-10 18:55:30', NULL, 'Line ID', '52542452'),
(9, 3, 1, 'ดกเดกเ', NULL, 'รอพิจารณา', NULL, '2026-08-10 19:08:28', NULL, 'Line ID', '564654'),
(11, 5, 7, 'กหดกหด', NULL, 'รอพิจารณา', NULL, '2026-08-10 19:27:56', NULL, 'Line ID', 'กดดหกด');

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `id` int NOT NULL,
  `username` varchar(20) NOT NULL,
  `password` varchar(255) NOT NULL,
  `name` varchar(100) NOT NULL,
  `role` enum('student','teacher') NOT NULL,
  `profile_image` varchar(255) DEFAULT NULL,
  `major` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`id`, `username`, `password`, `name`, `role`, `profile_image`, `major`) VALUES
(1, '66160000', '1234', 'นายสุขใจ ใจดี', 'student', '/src/assets/student.jpg', 'IT'),
(2, 'teacher01', '1234', 'ผศ.ดร.สมชาย ใจดี', 'teacher', '/src/assets/teacher01.jpg', 'IT'),
(3, 'teacher02', '1234', 'ผศ.ดร.กิตติ', 'teacher', '/src/assets/teacher02.jpg', 'CS'),
(4, 'teacher03', '1234', 'ผศ.ดร.ประวิทย์', 'teacher', '/src/assets/teacher03.jpg', 'SE'),
(5, 'teacher04', '1234', 'ผศ.ดร.สุชาติ', 'teacher', '/src/assets/teacher04.jpg', 'CS'),
(6, 'teacher05', '1234', 'ผศ.ดร.อนันต์', 'teacher', '/src/assets/teacher05.jpg', 'IT'),
(7, '66160001', '1234', 'กิตติพงษ์ แสงดี', 'student', '/src/assets/student2.jpg', 'SE');

--
-- Indexes for dumped tables
--

--
-- Indexes for table `notifications`
--
ALTER TABLE `notifications`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `projects`
--
ALTER TABLE `projects`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `project_invitations`
--
ALTER TABLE `project_invitations`
  ADD PRIMARY KEY (`id`),
  ADD KEY `sender_id` (`sender_id`),
  ADD KEY `receiver_id` (`receiver_id`),
  ADD KEY `advisor_id` (`advisor_id`),
  ADD KEY `project_id` (`project_id`);

--
-- Indexes for table `project_members`
--
ALTER TABLE `project_members`
  ADD PRIMARY KEY (`id`),
  ADD KEY `project_id` (`project_id`),
  ADD KEY `user_id` (`user_id`);

--
-- Indexes for table `project_requests`
--
ALTER TABLE `project_requests`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_request` (`project_id`,`student_id`),
  ADD KEY `student_id` (`student_id`);

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `username` (`username`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `notifications`
--
ALTER TABLE `notifications`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `projects`
--
ALTER TABLE `projects`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT for table `project_invitations`
--
ALTER TABLE `project_invitations`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=9;

--
-- AUTO_INCREMENT for table `project_members`
--
ALTER TABLE `project_members`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT for table `project_requests`
--
ALTER TABLE `project_requests`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=12;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=8;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `project_invitations`
--
ALTER TABLE `project_invitations`
  ADD CONSTRAINT `project_invitations_ibfk_1` FOREIGN KEY (`sender_id`) REFERENCES `users` (`id`),
  ADD CONSTRAINT `project_invitations_ibfk_2` FOREIGN KEY (`receiver_id`) REFERENCES `users` (`id`),
  ADD CONSTRAINT `project_invitations_ibfk_3` FOREIGN KEY (`advisor_id`) REFERENCES `users` (`id`),
  ADD CONSTRAINT `project_invitations_ibfk_4` FOREIGN KEY (`project_id`) REFERENCES `projects` (`id`);

--
-- Constraints for table `project_members`
--
ALTER TABLE `project_members`
  ADD CONSTRAINT `project_members_ibfk_1` FOREIGN KEY (`project_id`) REFERENCES `projects` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `project_members_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `project_requests`
--
ALTER TABLE `project_requests`
  ADD CONSTRAINT `project_requests_ibfk_1` FOREIGN KEY (`project_id`) REFERENCES `projects` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `project_requests_ibfk_2` FOREIGN KEY (`student_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
