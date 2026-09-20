-- phpMyAdmin SQL Dump
-- version 5.2.2
-- https://www.phpmyadmin.net/
--
-- Host: mysql:3306
-- Generation Time: Sep 20, 2026 at 04:23 PM
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
-- Table structure for table `approval_documents`
--

CREATE TABLE `approval_documents` (
  `id` int NOT NULL,
  `request_id` int NOT NULL,
  `project_id` int NOT NULL,
  `student_id` int NOT NULL,
  `advisor_id` int NOT NULL,
  `document_type` enum('สมัครเข้าร่วมโครงงาน','เสนอหัวข้อโครงงาน') NOT NULL,
  `document_code` varchar(20) DEFAULT 'RE01',
  `approved_at` datetime NOT NULL,
  `signature_image` varchar(255) DEFAULT NULL,
  `pdf_path` varchar(255) DEFAULT NULL,
  `download_status` enum('ยังไม่ได้ดาวน์โหลด','ดาวน์โหลดแล้ว') DEFAULT 'ยังไม่ได้ดาวน์โหลด',
  `downloaded_at` datetime DEFAULT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `approval_documents`
--

INSERT INTO `approval_documents` (`id`, `request_id`, `project_id`, `student_id`, `advisor_id`, `document_type`, `document_code`, `approved_at`, `signature_image`, `pdf_path`, `download_status`, `downloaded_at`, `created_at`) VALUES
(1, 1, 18, 7, 2, 'สมัครเข้าร่วมโครงงาน', 'RE01', '2026-09-20 10:33:28', '/src/assets/SignatureTeacher/teacher01.png', '/generated/RE01-2569-001.pdf', 'ดาวน์โหลดแล้ว', '2026-09-20 16:20:50', '2026-09-20 10:33:28');

-- --------------------------------------------------------

--
-- Table structure for table `notifications`
--

CREATE TABLE `notifications` (
  `id` int NOT NULL,
  `user_id` int NOT NULL,
  `message` text NOT NULL,
  `is_read` tinyint DEFAULT '0',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `request_id` int DEFAULT NULL,
  `project_id` int DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `notifications`
--

INSERT INTO `notifications` (`id`, `user_id`, `message`, `is_read`, `created_at`, `request_id`, `project_id`) VALUES
(1, 1, 'อาจารย์ปฏิเสธคำขอโครงงาน \"ระบบติดตาม\" ของคุณ\n\n            เหตุผลการปฏิเสธ: กหดหกดหก\n\n            ความคิดเห็น: กดหด\n\n            ข้อเสนอแนะ: กหดหกด', 0, '2026-08-26 13:01:56', 1, 16),
(3, 7, 'อาจารย์อนุมัติคำขอเข้าร่วมโครงงาน \"ระบบติดตามงาน\" ของคุณแล้ว', 0, '2026-08-26 13:18:46', NULL, NULL),
(4, 7, 'อาจารย์อนุมัติคำขอเข้าร่วมโครงงาน \"ระบบบริหารจัดการหอพักนักศึกษา\" ของคุณแล้ว', 0, '2026-09-20 09:37:24', NULL, NULL),
(5, 7, 'อาจารย์อนุมัติคำขอเข้าร่วมโครงงาน \"ระบบ AI ช่วยจัดทีมโครงงานสำหรับนิสิต\" ของคุณแล้ว', 0, '2026-09-20 10:33:28', NULL, NULL);

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
(3, 'รอบที่ล้าน', 'ผศ.ดร.สมชาย ใจดี', 2, 'IT', 'รออนุมัติ', 'แสดง', 'โครงงานคู่', 2, 0, NULL, 'ดกเดก', 'กดเกดเ', 'React | Node.js', '', 'student'),
(4, 'รอบที่ห้าล้าน', 'ผศ.ดร.สมชาย ใจดี', 2, 'IT', 'เปิดรับ', 'แสดง', 'โครงงานเดี่ยว', 1, 0, '2569/1', 'หกดเกหเ', 'ดกเกดเ', 'ดกเดกเ', 'ดกเกดเ', 'teacher'),
(6, 'ดดดดดดดด', 'ผศ.ดร.สมชาย ใจดี', 2, 'IT', 'รออนุมัติ', 'แสดง', 'โครงงานเดี่ยว', 1, 0, NULL, 'กดเดกเ', 'กดเกดเ', 'กดเดกเ', '', 'student'),
(9, 'สุดยอดต', 'ผศ.ดร.สมชาย', 2, 'IT', 'เปิดรับ', 'แสดง', 'โครงงานคู่', 2, 1, '2569/1', 'ระบบที่ช่วยให้นิสิตและอาจารย์สามารถติดตามความคืบหน้าของโครงงานได้แบบต่อเนื่อง ลดปัญหาการส่งงานล่าช้าและการสื่อสารที่ไม่ชัดเจน ผู้ใช้งานสามารถอัปโหลดไฟล์ ส่งรายงาน และรับข้อเสนอแนะจากอาจารย์ได้ทันที ทำให้การทำโครงงานมีทิศทางชัดเจนและตรวจสอบได้ตลอดเวลา\r\n', 'ศึกษาการประยุกต์ใช้ RFID|พัฒนาระบบ Web Application|ประยุกต์ใช้ AI วิเคราะห์ข้อมูล', 'React|Node.js|MySQL|Git', 'ปี 2 ขึ้นไป|มีพื้นฐาน React|ทำงานเป็นทีมได้', 'teacher'),
(13, 'โครงงานติดตามนิสิต', 'ผศ.ดร.สมชาย ใจดี', 2, 'IT', 'อนุมัติ', 'แสดง', 'โครงงานเดี่ยว', 1, 1, NULL, 'หหหฟปหป', 'หปฟหป', 'React | Node.js | MySQL', '', 'student'),
(16, 'ระบบติดตาม', 'ผศ.ดร.สมชาย ใจดี', 2, 'IT', 'รออนุมัติ', 'แสดง', 'โครงงานเดี่ยว', 1, 0, NULL, 'กดเกดเ', 'ดกเกดเ', 'React | Node.js | MySQL | Git | Html|CSS', '', 'student'),
(18, 'ระบบ AI ช่วยจัดทีมโครงงานสำหรับนิสิต', 'ผศ.ดร.สมชาย ใจดี', 2, 'IT', 'เปิดรับ', 'แสดง', 'โครงงานเดี่ยว', 1, 1, '2569/1', 'พัฒนาระบบสำหรับช่วยจับคู่และจัดกลุ่มนิสิตเพื่อทำโครงงาน โดยวิเคราะห์ข้อมูลด้านทักษะ ความสนใจ ความถนัด และเวลาว่างของนิสิต แล้วนำมาประมวลผลเพื่อเสนอสมาชิกทีมที่มีความเหมาะสมต่อกัน นอกจากนี้ระบบสามารถจัดการข้อมูลสมาชิก ทีม และหัวข้อโครงงาน รวมถึงติดตามสถานะการรวมทีมได้', 'เพื่อช่วยลดเวลาในการค้นหาเพื่อนร่วมทีม\nเพื่อจับคู่สมาชิกตามทักษะและความสนใจที่เหมาะสม\nเพื่อช่วยให้นิสิตสามารถจัดตั้งทีมโครงงานได้ง่ายขึ้น\nเพื่อจัดเก็บข้อมูลทักษะและความสนใจของนิสิตอย่างเป็นระบบ', 'React|Node.js|Express.js|MySQL|Python|AI/ML|Git|GitHub', 'มีพื้นฐาน React และ JavaScript\nมีพื้นฐาน Node.js หรือ Python\nมีความรู้พื้นฐานเกี่ยวกับฐานข้อมูล MySQL\nสนใจด้าน AI หรือ Machine Learning\nสามารถใช้งาน Git/GitHub ได้\nสามารถวิเคราะห์และออกแบบระบบได้\nสามารถทำงานร่วมกับผู้อื่นได้', 'teacher'),
(19, 'ระบบบริหารจัดการหอพักนักศึกษา', 'ผศ.ดร.สมชาย ใจดี', 2, 'IT', 'อนุมัติ', 'แสดง', 'โครงงานเดี่ยว', 1, 1, NULL, 'พัฒนาระบบเว็บสำหรับบริหารจัดการหอพักนักศึกษา โดยรองรับการจองห้องพัก การแจ้งปัญหาหรือซ่อมบำรุง การตรวจสอบค่าใช้จ่าย และการติดตามสถานะการดำเนินงานของผู้ดูแลหอพัก', 'เพื่อพัฒนาระบบจัดการข้อมูลหอพักและห้องพัก\nเพื่ออำนวยความสะดวกในการแจ้งปัญหาและติดตามงานซ่อม\nเพื่อลดขั้นตอนการจัดการข้อมูลของผู้ดูแลหอพัก\nเพื่อให้นักศึกษาสามารถตรวจสอบข้อมูลของตนเองได้', 'React|Node.js|Express.js|MySQL|Git', '', 'student');

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

--
-- Dumping data for table `project_members`
--

INSERT INTO `project_members` (`id`, `project_id`, `user_id`, `project_memberscol`) VALUES
(1, 19, 7, NULL),
(2, 18, 7, NULL);

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
  `status` enum('รอพิจารณา','อนุมัติ','ไม่อนุมัติ','ปฏิเสธ','ถูกยกเลิก') DEFAULT 'รอพิจารณา',
  `reject_reason` text,
  `request_date` datetime DEFAULT CURRENT_TIMESTAMP,
  `decision_date` datetime DEFAULT NULL,
  `contact_type` varchar(50) DEFAULT NULL,
  `contact_value` varchar(255) DEFAULT NULL,
  `teacher_comment` text,
  `suggestion` text,
  `rejection_reason` text
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `project_requests`
--

INSERT INTO `project_requests` (`id`, `project_id`, `student_id`, `introduction`, `request_file`, `status`, `reject_reason`, `request_date`, `decision_date`, `contact_type`, `contact_value`, `teacher_comment`, `suggestion`, `rejection_reason`) VALUES
(1, 18, 7, 'มีความสนใจเข้าร่วมโครงงานนี้ เนื่องจากต้องการพัฒนาทักษะด้านการพัฒนาเว็บแอปพลิเคชันและการทำงานร่วมกับฐานข้อมูล', NULL, 'อนุมัติ', NULL, '2026-09-20 10:33:13', NULL, 'Email', '66160001@go.buu.ac.th', NULL, NULL, NULL);

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `id` int NOT NULL,
  `username` varchar(20) NOT NULL,
  `password` varchar(255) NOT NULL,
  `prefix` varchar(20) DEFAULT NULL,
  `name` varchar(100) NOT NULL,
  `role` enum('student','teacher','staff') NOT NULL,
  `profile_image` varchar(255) DEFAULT NULL,
  `major` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  `phone` varchar(20) DEFAULT NULL,
  `email` varchar(255) DEFAULT NULL,
  `signature_image` varchar(255) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`id`, `username`, `password`, `prefix`, `name`, `role`, `profile_image`, `major`, `phone`, `email`, `signature_image`) VALUES
(1, '66160000', '1234', 'นาย', 'นายสุขใจ ใจดี', 'student', '/src/assets/student.jpg', 'IT', NULL, NULL, '/src/assets/SignatureStudent/66160000.png'),
(2, 'teacher01', '1234', NULL, 'ผศ.ดร.สมชาย ใจดี', 'teacher', '/src/assets/teacher01.jpg', 'IT', NULL, NULL, '/src/assets/SignatureTeacher/teacher01.png'),
(3, 'teacher02', '1234', NULL, 'ผศ.ดร.กิตติ', 'teacher', '/src/assets/teacher02.jpg', 'CS', NULL, NULL, NULL),
(4, 'teacher03', '1234', NULL, 'ผศ.ดร.ประวิทย์', 'teacher', '/src/assets/teacher03.jpg', 'SE', NULL, NULL, NULL),
(5, 'teacher04', '1234', NULL, 'ผศ.ดร.สุชาติ', 'teacher', '/src/assets/teacher04.jpg', 'CS', NULL, NULL, NULL),
(6, 'teacher05', '1234', NULL, 'ผศ.ดร.อนันต์', 'teacher', '/src/assets/teacher05.jpg', 'IT', NULL, NULL, NULL),
(7, '66160001', '1234', 'นาย', 'กิตติพงษ์ แสงดี', 'student', '/src/assets/student2.jpg', 'SE', '0812345678', '66160001@go.buu.ac.th', '/src/assets/SignatureStudent/66160001.png'),
(8, 'staff01', '1234', NULL, 'เจ้าหน้าที่โครงงาน', 'staff', '/src/assets/staff01.jpg', NULL, NULL, NULL, '/src/assets/staff01.jpg');

--
-- Indexes for dumped tables
--

--
-- Indexes for table `approval_documents`
--
ALTER TABLE `approval_documents`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `request_id` (`request_id`);

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
-- AUTO_INCREMENT for table `approval_documents`
--
ALTER TABLE `approval_documents`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `notifications`
--
ALTER TABLE `notifications`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT for table `projects`
--
ALTER TABLE `projects`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=20;

--
-- AUTO_INCREMENT for table `project_invitations`
--
ALTER TABLE `project_invitations`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `project_members`
--
ALTER TABLE `project_members`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `project_requests`
--
ALTER TABLE `project_requests`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=9;

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
