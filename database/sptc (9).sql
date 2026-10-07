-- phpMyAdmin SQL Dump
-- version 5.2.2
-- https://www.phpmyadmin.net/
--
-- Host: mysql:3306
-- Generation Time: Oct 07, 2026 at 07:14 AM
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
(1, 7, 'กัญญารัตน์ สุขเกษม ตอบรับคำเชิญเข้าร่วมโครงงาน \"ระบบแนะนำร้านอาหารตามงบประมาณ\" แล้ว', 0, '2026-10-06 14:32:03', NULL, NULL),
(2, 7, 'อาจารย์ส่งคำขอโครงงาน \"ระบบแนะนำร้านอาหารตามงบประมาณ\" กลับมาให้แก้ไข\n\nสิ่งที่ต้องแก้ไข: ช่วยเจาะจงกว่านี้', 0, '2026-10-06 14:38:46', 1, 22),
(3, 7, 'อาจารย์ส่งคำขอโครงงาน \"ระบบแนะนำร้านอาหารตามงบประมาณ\" กลับมาให้แก้ไข\n\nสิ่งที่ต้องแก้ไข: คลุมครือเกินไป', 0, '2026-10-06 14:51:17', 1, 22),
(4, 7, 'อาจารย์ส่งคำขอโครงงาน \"ระบบแนะนำร้านอาหารตามงบประมาณ\" กลับมาให้แก้ไข\n\nสิ่งที่ต้องแก้ไข: เเเเ', 0, '2026-10-06 15:20:10', 1, 22),
(5, 7, 'อาจารย์อนุมัติคำขอเข้าร่วมโครงงาน \"ระบบแนะนำร้านอาหารตามงบประมาณ\" ของคุณแล้ว', 0, '2026-10-06 16:18:10', NULL, NULL),
(6, 9, 'อาจารย์อนุมัติคำขอเข้าร่วมโครงงาน \"ระบบแนะนำร้านอาหารตามงบประมาณ\" ของคุณแล้ว', 0, '2026-10-06 16:18:10', NULL, NULL),
(7, 1, 'อาจารย์ปฏิเสธคำขอโครงงาน \"ระบบจัดการการยืม-คืนอุปกรณ์สำหรับนักศึกษา\" ของคุณ', 0, '2026-10-06 16:19:04', 2, 4),
(8, 7, 'อาจารย์ส่งคำขอโครงงาน \"ระบบแนะนำร้านอาหารตามงบประมาณ\" กลับมาให้แก้ไข\n\nสิ่งที่ต้องแก้ไข: เดกเดกเ', 0, '2026-10-07 07:13:45', 1, 22);

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
(3, 'รอบที่ล้าน', 'ผศ.ดร.สมชาย ใจดี', 2, 'IT', 'เปิดรับ', 'แสดง', 'โครงงานคู่', 2, 0, NULL, 'ดกเดก', 'กดเกดเ', 'React | Node.js', '', 'student'),
(4, 'ระบบจัดการการยืม-คืนอุปกรณ์สำหรับนักศึกษา', 'ผศ.ดร.สมชาย ใจดี', 2, 'IT', 'เปิดรับ', 'แสดง', 'โครงงานเดี่ยว', 1, 0, '2569/1', 'พัฒนาระบบสำหรับจัดการการยืมและคืนอุปกรณ์ของมหาวิทยาลัย เช่น กล้อง โน้ตบุ๊ก โปรเจกเตอร์ และอุปกรณ์อิเล็กทรอนิกส์ โดยผู้ใช้สามารถตรวจสอบอุปกรณ์ที่พร้อมให้ยืม ส่งคำขอยืม และตรวจสอบกำหนดคืน ขณะที่เจ้าหน้าที่สามารถอนุมัติและจัดการข้อมูลอุปกรณ์ได้', 'เพื่อจัดการข้อมูลอุปกรณ์อย่างเป็นระบบ\nเพื่ออำนวยความสะดวกในการยืมและคืนอุปกรณ์\nเพื่อป้องกันการยืมอุปกรณ์ที่ไม่พร้อมใช้งาน\nเพื่อจัดเก็บประวัติการยืมคืน', 'React|Node.js|Express.js|MySQL|QR Code|JWT|Git|GitHub', 'มีพื้นฐาน React\nมีพื้นฐาน Node.js\nมีความรู้ MySQL\nมีความเข้าใจ CRUD\nมีพื้นฐานการสร้างระบบ Authentication', 'teacher'),
(6, 'ดดดดดดดด', 'ผศ.ดร.สมชาย ใจดี', 2, 'IT', 'เปิดรับ', 'แสดง', 'โครงงานเดี่ยว', 1, 0, NULL, 'กดเดกเ', 'กดเกดเ', 'กดเดกเ', '', 'student'),
(9, 'สุดยอดต', 'ผศ.ดร.สมชาย', 2, 'IT', 'เปิดรับ', 'แสดง', 'โครงงานคู่', 2, 0, '2569/1', 'ระบบที่ช่วยให้นิสิตและอาจารย์สามารถติดตามความคืบหน้าของโครงงานได้แบบต่อเนื่อง ลดปัญหาการส่งงานล่าช้าและการสื่อสารที่ไม่ชัดเจน ผู้ใช้งานสามารถอัปโหลดไฟล์ ส่งรายงาน และรับข้อเสนอแนะจากอาจารย์ได้ทันที ทำให้การทำโครงงานมีทิศทางชัดเจนและตรวจสอบได้ตลอดเวลา\r\n', 'ศึกษาการประยุกต์ใช้ RFID|พัฒนาระบบ Web Application|ประยุกต์ใช้ AI วิเคราะห์ข้อมูล', 'React|Node.js|MySQL|Git', 'ปี 2 ขึ้นไป|มีพื้นฐาน React|ทำงานเป็นทีมได้', 'teacher'),
(13, 'โครงงานติดตามนิสิต', 'ผศ.ดร.สมชาย ใจดี', 2, 'IT', 'เปิดรับ', 'แสดง', 'โครงงานเดี่ยว', 1, 1, NULL, 'หหหฟปหป', 'หปฟหป', 'React | Node.js | MySQL', '', 'student'),
(16, 'ระบบติดตาม', 'ผศ.ดร.สมชาย ใจดี', 2, 'IT', 'เปิดรับ', 'แสดง', 'โครงงานเดี่ยว', 1, 0, NULL, 'กดเกดเ', 'ดกเกดเ', 'React | Node.js | MySQL | Git | Html|CSS', '', 'student'),
(18, 'ระบบ AI ช่วยจัดทีมโครงงานสำหรับนิสิต', 'ผศ.ดร.สมชาย ใจดี', 2, 'IT', 'เปิดรับ', 'แสดง', 'โครงงานเดี่ยว', 1, 0, '2569/1', 'พัฒนาระบบสำหรับช่วยจับคู่และจัดกลุ่มนิสิตเพื่อทำโครงงาน โดยวิเคราะห์ข้อมูลด้านทักษะ ความสนใจ ความถนัด และเวลาว่างของนิสิต แล้วนำมาประมวลผลเพื่อเสนอสมาชิกทีมที่มีความเหมาะสมต่อกัน นอกจากนี้ระบบสามารถจัดการข้อมูลสมาชิก ทีม และหัวข้อโครงงาน รวมถึงติดตามสถานะการรวมทีมได้', 'เพื่อช่วยลดเวลาในการค้นหาเพื่อนร่วมทีม\nเพื่อจับคู่สมาชิกตามทักษะและความสนใจที่เหมาะสม\nเพื่อช่วยให้นิสิตสามารถจัดตั้งทีมโครงงานได้ง่ายขึ้น\nเพื่อจัดเก็บข้อมูลทักษะและความสนใจของนิสิตอย่างเป็นระบบ', 'React|Node.js|Express.js|MySQL|Python|AI/ML|Git|GitHub', 'มีพื้นฐาน React และ JavaScript\nมีพื้นฐาน Node.js หรือ Python\nมีความรู้พื้นฐานเกี่ยวกับฐานข้อมูล MySQL\nสนใจด้าน AI หรือ Machine Learning\nสามารถใช้งาน Git/GitHub ได้\nสามารถวิเคราะห์และออกแบบระบบได้\nสามารถทำงานร่วมกับผู้อื่นได้', 'teacher'),
(19, 'ระบบบริหารจัดการหอพักนักศึกษา', 'ผศ.ดร.สมชาย ใจดี', 2, 'IT', 'เปิดรับ', 'แสดง', 'โครงงานเดี่ยว', 1, 0, NULL, 'พัฒนาระบบเว็บสำหรับบริหารจัดการหอพักนักศึกษา โดยรองรับการจองห้องพัก การแจ้งปัญหาหรือซ่อมบำรุง การตรวจสอบค่าใช้จ่าย และการติดตามสถานะการดำเนินงานของผู้ดูแลหอพัก', 'เพื่อพัฒนาระบบจัดการข้อมูลหอพักและห้องพัก\nเพื่ออำนวยความสะดวกในการแจ้งปัญหาและติดตามงานซ่อม\nเพื่อลดขั้นตอนการจัดการข้อมูลของผู้ดูแลหอพัก\nเพื่อให้นักศึกษาสามารถตรวจสอบข้อมูลของตนเองได้', 'React|Node.js|Express.js|MySQL|Git', '', 'student'),
(20, 'ระบบตรวจสอบการเข้าเรียนด้วย QR Code', 'ผศ.ดร.สมชาย ใจดี', 2, 'IT', 'เปิดรับ', 'แสดง', 'โครงงานเดี่ยว', 1, 0, '2569/1', 'พัฒนาระบบสำหรับบันทึกการเข้าเรียนของนิสิตผ่าน QR Code โดยอาจารย์สามารถสร้าง QR Code สำหรับแต่ละรายวิชาและคาบเรียน นิสิตสแกน QR Code เพื่อบันทึกเวลาเข้าเรียน และสามารถตรวจสอบประวัติการเข้าเรียนของตนเองได้ ขณะที่อาจารย์สามารถตรวจสอบและจัดการข้อมูลการเข้าเรียนของนิสิตได้', 'เพื่อพัฒนาระบบตรวจสอบการเข้าเรียนด้วย QR Code\nเพื่อลดเวลาและขั้นตอนในการตรวจสอบการเข้าเรียน\nเพื่อจัดเก็บข้อมูลการเข้าเรียนของนิสิตอย่างเป็นระบบ\nเพื่อให้อาจารย์สามารถตรวจสอบสถิติการเข้าเรียนได้สะดวก\nเพื่อให้นิสิตสามารถตรวจสอบประวัติการเข้าเรียนของตนเองได้', 'React|Node.js|Express.js|MySQL|QR Code|JWT|Git|GitHub', '', 'student'),
(22, 'ระบบแนะนำร้านอาหารตามงบประมาณ', 'ผศ.ดร.สมชาย ใจดี', 2, 'IT', 'รออนุมัติ', 'แสดง', 'โครงงานคู่', 2, 2, '2569/1', 'พัฒนาระบบที่ช่วยแนะนำร้านอาหารและเมนูให้เหมาะสมกับงบประมาณ ความชอบ และประเภทอาหารที่ผู้ใช้ต้องการ โดยผู้ใช้สามารถกำหนดงบประมาณและเงื่อนไขต่าง ๆ ระบบจะแสดงร้านอาหารหรือเมนูที่ตรงกับความต้องการแก้แก้แก้แก้กกกกกกกก', 'เพื่อช่วยค้นหาร้านอาหารตามเงื่อนไข\nเพื่อช่วยควบคุมงบประมาณในการรับประทานอาหาร\nเพื่อแนะนำร้านอาหารที่ตรงกับความสนใจ\nเพื่อรวบรวมข้อมูลร้านอาหารไว้ในระบบเดียว', 'React|Node.js|Express.js|MySQL|Google Maps API|Git|GitHub', '', 'student');

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
(1, 7, 9, 22, 2, 'ระบบแนะนำร้านอาหารตามงบประมาณ', 'โครงงานคู่', 'พัฒนาระบบที่ช่วยแนะนำร้านอาหารและเมนูให้เหมาะสมกับงบประมาณ ความชอบ และประเภทอาหารที่ผู้ใช้ต้องการ โดยผู้ใช้สามารถกำหนดงบประมาณและเงื่อนไขต่าง ๆ ระบบจะแสดงร้านอาหารหรือเมนูที่ตรงกับความต้องการ', 'เพื่อช่วยค้นหาร้านอาหารตามเงื่อนไข\nเพื่อช่วยควบคุมงบประมาณในการรับประทานอาหาร\nเพื่อแนะนำร้านอาหารที่ตรงกับความสนใจ\nเพื่อรวบรวมข้อมูลร้านอาหารไว้ในระบบเดียว', 'React|Node.js|Express.js|MySQL|Google Maps API|Git|GitHub', '', 'Email', '66160001@go.buu.ac.th', 'ผู้ใช้งานอาจใช้เวลาในการค้นหาร้านอาหารที่เหมาะสมกับงบประมาณและความต้องการของตนเอง จึงต้องการพัฒนาระบบแนะนำร้านอาหารที่ช่วยคัดกรองข้อมูลและนำเสนอทางเลือกที่เหมาะสม ทำให้การตัดสินใจเลือกร้านอาหารสะดวกและรวดเร็วยิ่งขึ้น', 'ตอบรับ', '2026-10-06 14:31:57');

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
  `status` enum('รอพิจารณา','อนุมัติ','ต้องแก้ไข','ไม่อนุมัติ','ปฏิเสธ','ถูกยกเลิก') DEFAULT NULL,
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
(1, 22, 7, 'ผู้ใช้งานอาจใช้เวลาในการค้นหาร้านอาหารที่เหมาะสมกับงบประมาณและความต้องการของตนเอง จึงต้องการพัฒนาระบบแนะนำร้านอาหารที่ช่วยคัดกรองข้อมูลและนำเสนอทางเลือกที่เหมาะสม ทำให้การตัดสินใจเลือกร้านอาหารสะดวกและรวดเร็วยิ่งขึ้น', NULL, 'รอพิจารณา', NULL, '2026-10-07 07:14:04', NULL, 'Email', '66160001@go.buu.ac.th', NULL, NULL, NULL),
(2, 4, 1, 'ผมสนใจการทำระบบจัดการการยืม-คืนอุปกรณ์สำหรับนักศึกษาครับ และมีความรู้ตามที่อาจารย์ต้องการอยู่ในระดับกลางๆและสามารถรับฟังอาจารย์เพื่อเรียนรู้เพิ่มตามได้เสมอครับ', NULL, 'ปฏิเสธ', NULL, '2026-10-06 14:33:53', '2026-10-06 16:19:04', 'Email', '66160000@go.buu.ac.th', NULL, NULL, NULL);

-- --------------------------------------------------------

--
-- Table structure for table `teacher_profiles`
--

CREATE TABLE `teacher_profiles` (
  `id` int NOT NULL,
  `user_id` int NOT NULL,
  `english_name` varchar(150) DEFAULT NULL,
  `position` varchar(150) DEFAULT NULL,
  `office` varchar(150) DEFAULT NULL,
  `office_phone` varchar(50) DEFAULT NULL,
  `expertise` text,
  `max_capacity` int DEFAULT '10'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `teacher_profiles`
--

INSERT INTO `teacher_profiles` (`id`, `user_id`, `english_name`, `position`, `office`, `office_phone`, `expertise`, `max_capacity`) VALUES
(1, 2, 'Somchai Jaidee', 'ผู้ช่วยศาสตราจารย์', 'IF-301', '038-102030', 'Database Technology|Object-Oriented Technology|Web Technology', 10),
(2, 3, 'Kitti', 'ผู้ช่วยศาสตราจารย์', 'IF-302', '038-102031', 'Artificial Intelligence|Machine Learning|Data Science', 10),
(3, 4, 'Prawit', 'ผู้ช่วยศาสตราจารย์', 'IF-303', '038-102032', 'Software Engineering|Software Testing|Requirements Engineering', 10),
(4, 5, 'Suchat', 'ผู้ช่วยศาสตราจารย์', 'IF-304', '038-102033', 'Computer Networks|Cybersecurity|Cloud Computing', 10),
(5, 6, 'Anan', 'ผู้ช่วยศาสตราจารย์', 'IF-305', '038-102034', 'Database Technology|Web Technology|Internet of Things', 10);

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
(1, '66160000', '1234', 'นาย', 'นายสุขใจ ใจดี', 'student', '/src/assets/student.jpg', 'IT', '0812345678', '66160000@go.buu.ac.th', '/src/assets/SignatureStudent/66160000.png'),
(2, 'teacher01', '1234', NULL, 'ผศ.ดร.สมชาย ใจดี', 'teacher', '/src/assets/teacher01.jpg', 'IT', '038-102030', 'somchai@go.buu.ac.th', '/src/assets/SignatureTeacher/teacher01.png'),
(3, 'teacher02', '1234', NULL, 'ผศ.ดร.กิตติ', 'teacher', '/src/assets/teacher02.jpg', 'CS', '038-102031', 'teacher02@go.buu.ac.th', NULL),
(4, 'teacher03', '1234', NULL, 'ผศ.ดร.ประวิทย์', 'teacher', '/src/assets/teacher03.jpg', 'SE', '038-102032', 'teacher03@go.buu.ac.th', NULL),
(5, 'teacher04', '1234', NULL, 'ผศ.ดร.สุชาติ', 'teacher', '/src/assets/teacher04.jpg', 'CS', '038-102033', 'teacher04@go.buu.ac.th', NULL),
(6, 'teacher05', '1234', NULL, 'ผศ.ดร.อนันต์', 'teacher', '/src/assets/teacher05.jpg', 'IT', '038-102034', 'teacher05@go.buu.ac.th', NULL),
(7, '66160001', '1234', 'นาย', 'กิตติพงษ์ แสงดี', 'student', '/src/assets/student2.jpg', 'SE', '0812345678', '66160001@go.buu.ac.th', '/src/assets/SignatureStudent/66160001.png'),
(8, 'staff01', '1234', NULL, 'เจ้าหน้าที่โครงงาน', 'staff', '/src/assets/staff01.jpg', NULL, NULL, NULL, '/src/assets/staff01.jpg'),
(9, '66160002', '1234', 'นางสาว', 'กัญญารัตน์ สุขเกษม', 'student', '/src/assets/student3.jpg', 'IT', '0812345678', '66160002@go.buu.ac.th', '/src/assets/SignatureStudent/66160002.png');

--
-- Indexes for dumped tables
--

--
-- Indexes for table `approval_documents`
--
ALTER TABLE `approval_documents`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_request_student` (`request_id`,`student_id`);

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
-- Indexes for table `teacher_profiles`
--
ALTER TABLE `teacher_profiles`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `user_id` (`user_id`);

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
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `notifications`
--
ALTER TABLE `notifications`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=9;

--
-- AUTO_INCREMENT for table `projects`
--
ALTER TABLE `projects`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=23;

--
-- AUTO_INCREMENT for table `project_invitations`
--
ALTER TABLE `project_invitations`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `project_members`
--
ALTER TABLE `project_members`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `project_requests`
--
ALTER TABLE `project_requests`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `teacher_profiles`
--
ALTER TABLE `teacher_profiles`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=10;

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

--
-- Constraints for table `teacher_profiles`
--
ALTER TABLE `teacher_profiles`
  ADD CONSTRAINT `teacher_profiles_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
