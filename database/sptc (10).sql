-- phpMyAdmin SQL Dump
-- version 5.2.2
-- https://www.phpmyadmin.net/
--
-- Host: mysql:3306
-- Generation Time: Oct 20, 2026 at 02:07 PM
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
(1, 2, 4, 1, 2, 'สมัครเข้าร่วมโครงงาน', 'RE01', '2026-10-13 13:14:50', '/src/assets/SignatureTeacher/teacher01.png', '/generated/RE01-2569-001.pdf', 'ยังไม่ได้ดาวน์โหลด', NULL, '2026-10-13 13:14:50'),
(2, 1, 22, 7, 2, 'เสนอหัวข้อโครงงาน', 'RE01', '2026-10-14 14:00:05', '/src/assets/SignatureTeacher/teacher01.png', '/generated/RE01-2569-002.pdf', 'ยังไม่ได้ดาวน์โหลด', NULL, '2026-10-14 14:00:05'),
(3, 1, 22, 9, 2, 'เสนอหัวข้อโครงงาน', 'RE01', '2026-10-14 14:00:06', '/src/assets/SignatureTeacher/teacher01.png', '/generated/RE01-2569-003.pdf', 'ยังไม่ได้ดาวน์โหลด', NULL, '2026-10-14 14:00:06'),
(4, 5, 24, 12, 2, 'เสนอหัวข้อโครงงาน', 'RE01', '2026-10-14 14:11:12', '/src/assets/SignatureTeacher/teacher01.png', '/generated/RE01-2569-004.pdf', 'ยังไม่ได้ดาวน์โหลด', NULL, '2026-10-14 14:11:12');

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
  `project_id` int DEFAULT NULL,
  `document_id` int DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `notifications`
--

INSERT INTO `notifications` (`id`, `user_id`, `message`, `is_read`, `created_at`, `request_id`, `project_id`, `document_id`) VALUES
(1, 10, 'อาจารย์ส่งคำขอโครงงาน \"ระบบตรวจสอบและเปรียบเทียบราคาสินค้า\" กลับมาให้แก้ไข\n\nสิ่งที่ต้องแก้ไข: ขอเจาะจงกว่านี้หน่อย', 1, '2026-10-13 13:13:12', 4, 23, NULL),
(2, 2, 'ธนกฤต วัฒนชัย แก้ไขคำเสนอโครงงาน \"ระบบตรวจสอบและเปรียบเทียบราคาสินค้า\" และส่งกลับมาให้คุณพิจารณาอีกครั้ง', 1, '2026-10-13 13:13:33', 4, 23, NULL),
(3, 8, 'ผศ.ดร.สมชาย ใจดี อนุมัติและลงนามเอกสาร \"ระบบจัดการการยืม-คืนอุปกรณ์สำหรับนักศึกษา\"', 1, '2026-10-13 13:14:51', 2, 4, 1),
(4, 1, 'อาจารย์อนุมัติคำขอเข้าร่วมโครงงาน \"ระบบจัดการการยืม-คืนอุปกรณ์สำหรับนักศึกษา\" ของคุณแล้ว', 0, '2026-10-13 13:14:51', NULL, NULL, NULL),
(5, 7, 'อาจารย์ส่งคำขอโครงงาน \"ระบบแนะนำร้านอาหารตามงบประมาณ\" กลับมาให้แก้ไข\n\nสิ่งที่ต้องแก้ไข: ขอชัดเจนกว่านี้', 1, '2026-10-14 13:37:04', 1, 22, NULL),
(6, 2, 'กิตติพงษ์ แสงดี แก้ไขคำเสนอโครงงาน \"ระบบแนะนำร้านอาหารตามงบประมาณ\" และส่งกลับมาให้คุณพิจารณาอีกครั้ง', 0, '2026-10-14 13:37:18', 1, 22, NULL),
(7, 8, 'ผศ.ดร.สมชาย ใจดี อนุมัติและลงนามเอกสาร \"ระบบแนะนำร้านอาหารตามงบประมาณ\"', 0, '2026-10-14 14:00:06', 1, 22, 2),
(8, 8, 'ผศ.ดร.สมชาย ใจดี อนุมัติและลงนามเอกสาร \"ระบบแนะนำร้านอาหารตามงบประมาณ\"', 0, '2026-10-14 14:00:06', 1, 22, 3),
(9, 7, 'อาจารย์อนุมัติคำขอเข้าร่วมโครงงาน \"ระบบแนะนำร้านอาหารตามงบประมาณ\" ของคุณแล้ว', 0, '2026-10-14 14:00:06', NULL, NULL, NULL),
(10, 9, 'อาจารย์อนุมัติคำขอเข้าร่วมโครงงาน \"ระบบแนะนำร้านอาหารตามงบประมาณ\" ของคุณแล้ว', 0, '2026-10-14 14:00:06', NULL, NULL, NULL),
(11, 2, 'ณัฐวุฒิ เจริญสุข ส่งคำเสนอหัวข้อโครงงาน \"ระบบตรวจสอบข่าวปลอมและวิเคราะห์ความน่าเชื่อถือของข่าว\" มาให้คุณพิจารณา', 1, '2026-10-14 14:11:00', 5, 24, NULL),
(12, 8, 'ผศ.ดร.สมชาย ใจดี อนุมัติและลงนามเอกสาร \"ระบบตรวจสอบข่าวปลอมและวิเคราะห์ความน่าเชื่อถือของข่าว\"', 0, '2026-10-14 14:11:13', 5, 24, 4),
(13, 12, 'อาจารย์อนุมัติคำขอเข้าร่วมโครงงาน \"ระบบตรวจสอบข่าวปลอมและวิเคราะห์ความน่าเชื่อถือของข่าว\" ของคุณแล้ว', 1, '2026-10-14 14:11:13', NULL, NULL, NULL),
(14, 2, 'ณัฐวุฒิ เจริญสุข ส่งงาน \"สำรวจปัญหาและความต้องการของผู้ใช้งาน\" มาให้คุณตรวจแล้ว', 1, '2026-10-19 12:06:15', NULL, 24, NULL),
(15, 12, 'อาจารย์ส่งงาน \"สำรวจปัญหาและความต้องการของผู้ใช้งาน\" กลับให้แก้ไข', 0, '2026-10-19 14:56:03', NULL, 24, NULL),
(16, 2, 'ณัฐวุฒิ เจริญสุข ส่งงาน \"สำรวจปัญหาและความต้องการของผู้ใช้งาน\" มาให้คุณตรวจแล้ว', 0, '2026-10-19 15:15:51', NULL, 24, NULL),
(17, 12, 'อาจารย์ส่งงาน \"สำรวจปัญหาและความต้องการของผู้ใช้งาน\" กลับให้แก้ไข', 0, '2026-10-19 15:16:10', NULL, 24, NULL),
(18, 2, 'ณัฐวุฒิ เจริญสุข ส่งงาน \"สำรวจปัญหาและความต้องการของผู้ใช้งาน\" มาให้คุณตรวจแล้ว', 0, '2026-10-19 17:24:08', NULL, 24, NULL),
(19, 12, 'อาจารย์ส่งงาน \"สำรวจปัญหาและความต้องการของผู้ใช้งาน\" กลับให้แก้ไข', 0, '2026-10-19 17:24:53', NULL, 24, NULL),
(20, 2, 'ณัฐวุฒิ เจริญสุข ส่งงาน \"สำรวจปัญหาและความต้องการของผู้ใช้งาน\" มาให้คุณตรวจแล้ว', 0, '2026-10-19 17:25:36', NULL, 24, NULL),
(21, 12, 'อาจารย์ตรวจงาน \"สำรวจปัญหาและความต้องการของผู้ใช้งาน\" ผ่านแล้ว', 0, '2026-10-20 11:54:43', NULL, 24, NULL),
(22, 2, 'ณัฐวุฒิ เจริญสุข ส่งงาน \"ศึกษาแหล่งข้อมูลตรวจสอบข้อเท็จจริง\" มาให้คุณตรวจแล้ว', 0, '2026-10-20 12:13:14', NULL, 24, NULL),
(23, 2, 'ณัฐวุฒิ เจริญสุข ส่งงาน \"กำหนดขอบเขตและความต้องการของระบบ\" (ครั้งที่ 1) มาให้คุณตรวจแล้ว', 0, '2026-10-20 12:25:00', NULL, 24, NULL),
(24, 12, 'อาจารย์ส่งงาน \"ศึกษาแหล่งข้อมูลตรวจสอบข้อเท็จจริง\" กลับให้แก้ไข', 0, '2026-10-20 12:26:07', NULL, 24, NULL),
(25, 2, 'ณัฐวุฒิ เจริญสุข ส่งงาน \"ศึกษาแหล่งข้อมูลตรวจสอบข้อเท็จจริง\" (ครั้งที่ 1) มาให้คุณตรวจแล้ว', 0, '2026-10-20 12:26:43', NULL, 24, NULL),
(26, 12, 'อาจารย์ส่งงาน \"ศึกษาแหล่งข้อมูลตรวจสอบข้อเท็จจริง\" กลับให้แก้ไข', 0, '2026-10-20 12:28:42', NULL, 24, NULL),
(27, 2, 'ณัฐวุฒิ เจริญสุข ส่งงาน \"ศึกษาแหล่งข้อมูลตรวจสอบข้อเท็จจริง\" (ครั้งที่ 2) มาให้คุณตรวจแล้ว', 0, '2026-10-20 12:48:12', NULL, 24, NULL);

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
(4, 'ระบบจัดการการยืม-คืนอุปกรณ์สำหรับนักศึกษา', 'ผศ.ดร.สมชาย ใจดี', 2, 'IT', 'ปิดรับ', 'แสดง', 'โครงงานเดี่ยว', 1, 1, '2569/1', 'พัฒนาระบบสำหรับจัดการการยืมและคืนอุปกรณ์ของมหาวิทยาลัย เช่น กล้อง โน้ตบุ๊ก โปรเจกเตอร์ และอุปกรณ์อิเล็กทรอนิกส์ โดยผู้ใช้สามารถตรวจสอบอุปกรณ์ที่พร้อมให้ยืม ส่งคำขอยืม และตรวจสอบกำหนดคืน ขณะที่เจ้าหน้าที่สามารถอนุมัติและจัดการข้อมูลอุปกรณ์ได้', 'เพื่อจัดการข้อมูลอุปกรณ์อย่างเป็นระบบ\nเพื่ออำนวยความสะดวกในการยืมและคืนอุปกรณ์\nเพื่อป้องกันการยืมอุปกรณ์ที่ไม่พร้อมใช้งาน\nเพื่อจัดเก็บประวัติการยืมคืน', 'React|Node.js|Express.js|MySQL|QR Code|JWT|Git|GitHub', 'มีพื้นฐาน React\nมีพื้นฐาน Node.js\nมีความรู้ MySQL\nมีความเข้าใจ CRUD\nมีพื้นฐานการสร้างระบบ Authentication', 'teacher'),
(6, 'ดดดดดดดด', 'ผศ.ดร.สมชาย ใจดี', 2, 'IT', 'เปิดรับ', 'แสดง', 'โครงงานเดี่ยว', 1, 0, NULL, 'กดเดกเ', 'กดเกดเ', 'กดเดกเ', '', 'student'),
(9, 'สุดยอดต', 'ผศ.ดร.สมชาย', 2, 'IT', 'ปิดรับ', 'แสดง', 'โครงงานคู่', 2, 1, '2569/1', 'ระบบที่ช่วยให้นิสิตและอาจารย์สามารถติดตามความคืบหน้าของโครงงานได้แบบต่อเนื่อง ลดปัญหาการส่งงานล่าช้าและการสื่อสารที่ไม่ชัดเจน ผู้ใช้งานสามารถอัปโหลดไฟล์ ส่งรายงาน และรับข้อเสนอแนะจากอาจารย์ได้ทันที ทำให้การทำโครงงานมีทิศทางชัดเจนและตรวจสอบได้ตลอดเวลา\r\n', 'ศึกษาการประยุกต์ใช้ RFID|พัฒนาระบบ Web Application|ประยุกต์ใช้ AI วิเคราะห์ข้อมูล', 'React|Node.js|MySQL|Git', 'ปี 2 ขึ้นไป|มีพื้นฐาน React|ทำงานเป็นทีมได้', 'teacher'),
(13, 'โครงงานติดตามนิสิต', 'ผศ.ดร.สมชาย ใจดี', 2, 'IT', 'เปิดรับ', 'แสดง', 'โครงงานเดี่ยว', 1, 1, NULL, 'หหหฟปหป', 'หปฟหป', 'React | Node.js | MySQL', '', 'student'),
(16, 'ระบบติดตาม', 'ผศ.ดร.สมชาย ใจดี', 2, 'IT', 'เปิดรับ', 'แสดง', 'โครงงานเดี่ยว', 1, 0, NULL, 'กดเกดเ', 'ดกเกดเ', 'React | Node.js | MySQL | Git | Html|CSS', '', 'student'),
(18, 'ระบบ AI ช่วยจัดทีมโครงงานสำหรับนิสิต', 'ผศ.ดร.สมชาย ใจดี', 2, 'IT', 'เปิดรับ', 'แสดง', 'โครงงานเดี่ยว', 1, 0, '2569/1', 'พัฒนาระบบสำหรับช่วยจับคู่และจัดกลุ่มนิสิตเพื่อทำโครงงาน โดยวิเคราะห์ข้อมูลด้านทักษะ ความสนใจ ความถนัด และเวลาว่างของนิสิต แล้วนำมาประมวลผลเพื่อเสนอสมาชิกทีมที่มีความเหมาะสมต่อกัน นอกจากนี้ระบบสามารถจัดการข้อมูลสมาชิก ทีม และหัวข้อโครงงาน รวมถึงติดตามสถานะการรวมทีมได้', 'เพื่อช่วยลดเวลาในการค้นหาเพื่อนร่วมทีม\nเพื่อจับคู่สมาชิกตามทักษะและความสนใจที่เหมาะสม\nเพื่อช่วยให้นิสิตสามารถจัดตั้งทีมโครงงานได้ง่ายขึ้น\nเพื่อจัดเก็บข้อมูลทักษะและความสนใจของนิสิตอย่างเป็นระบบ', 'React|Node.js|Express.js|MySQL|Python|AI/ML|Git|GitHub', 'มีพื้นฐาน React และ JavaScript\nมีพื้นฐาน Node.js หรือ Python\nมีความรู้พื้นฐานเกี่ยวกับฐานข้อมูล MySQL\nสนใจด้าน AI หรือ Machine Learning\nสามารถใช้งาน Git/GitHub ได้\nสามารถวิเคราะห์และออกแบบระบบได้\nสามารถทำงานร่วมกับผู้อื่นได้', 'teacher'),
(19, 'ระบบบริหารจัดการหอพักนักศึกษา', 'ผศ.ดร.สมชาย ใจดี', 2, 'IT', 'เปิดรับ', 'แสดง', 'โครงงานเดี่ยว', 1, 0, NULL, 'พัฒนาระบบเว็บสำหรับบริหารจัดการหอพักนักศึกษา โดยรองรับการจองห้องพัก การแจ้งปัญหาหรือซ่อมบำรุง การตรวจสอบค่าใช้จ่าย และการติดตามสถานะการดำเนินงานของผู้ดูแลหอพัก', 'เพื่อพัฒนาระบบจัดการข้อมูลหอพักและห้องพัก\nเพื่ออำนวยความสะดวกในการแจ้งปัญหาและติดตามงานซ่อม\nเพื่อลดขั้นตอนการจัดการข้อมูลของผู้ดูแลหอพัก\nเพื่อให้นักศึกษาสามารถตรวจสอบข้อมูลของตนเองได้', 'React|Node.js|Express.js|MySQL|Git', '', 'student'),
(20, 'ระบบตรวจสอบการเข้าเรียนด้วย QR Code', 'ผศ.ดร.สมชาย ใจดี', 2, 'IT', 'เปิดรับ', 'แสดง', 'โครงงานเดี่ยว', 1, 0, '2569/1', 'พัฒนาระบบสำหรับบันทึกการเข้าเรียนของนิสิตผ่าน QR Code โดยอาจารย์สามารถสร้าง QR Code สำหรับแต่ละรายวิชาและคาบเรียน นิสิตสแกน QR Code เพื่อบันทึกเวลาเข้าเรียน และสามารถตรวจสอบประวัติการเข้าเรียนของตนเองได้ ขณะที่อาจารย์สามารถตรวจสอบและจัดการข้อมูลการเข้าเรียนของนิสิตได้', 'เพื่อพัฒนาระบบตรวจสอบการเข้าเรียนด้วย QR Code\nเพื่อลดเวลาและขั้นตอนในการตรวจสอบการเข้าเรียน\nเพื่อจัดเก็บข้อมูลการเข้าเรียนของนิสิตอย่างเป็นระบบ\nเพื่อให้อาจารย์สามารถตรวจสอบสถิติการเข้าเรียนได้สะดวก\nเพื่อให้นิสิตสามารถตรวจสอบประวัติการเข้าเรียนของตนเองได้', 'React|Node.js|Express.js|MySQL|QR Code|JWT|Git|GitHub', '', 'student'),
(22, 'ระบบแนะนำร้านอาหารตามงบประมาณ', 'ผศ.ดร.สมชาย ใจดี', 2, 'IT', 'อนุมัติ', 'แสดง', 'โครงงานคู่', 2, 2, '2569/1', 'พัฒนาระบบที่ช่วยแนะนำร้านอาหารและเมนูให้เหมาะสมกับงบประมาณ ความชอบ และประเภทอาหารที่ผู้ใช้ต้องการ โดยผู้ใช้สามารถกำหนดงบประมาณและเงื่อนไขต่าง ๆ ระบบจะแสดงร้านอาหารหรือเมนูที่ตรงกับความต้องการแก้แก้แก้แก้กกกกกกกก', 'เพื่อช่วยค้นหาร้านอาหารตามเงื่อนไข\nเพื่อช่วยควบคุมงบประมาณในการรับประทานอาหาร\nเพื่อแนะนำร้านอาหารที่ตรงกับความสนใจ\nเพื่อรวบรวมข้อมูลร้านอาหารไว้ในระบบเดียว', 'React|Node.js|Express.js|MySQL|Google Maps API|Git|GitHub', '', 'student'),
(23, 'ระบบตรวจสอบและเปรียบเทียบราคาสินค้า', 'ผศ.ดร.สมชาย ใจดี', 2, 'IT', 'รออนุมัติ', 'แสดง', 'โครงงานคู่', 2, 0, '2569/1', 'พัฒนาระบบเว็บสำหรับรวบรวมและเปรียบเทียบราคาสินค้าจากร้านค้าต่าง ๆ โดยผู้ใช้งานสามารถค้นหาสินค้า ตรวจสอบราคา เปรียบเทียบราคา และดูประวัติการเปลี่ยนแปลงของราคา เพื่อช่วยให้ตัดสินใจเลือกซื้อสินค้าได้อย่างเหมาะสม', 'เพื่อพัฒนาระบบค้นหาและเปรียบเทียบราคาสินค้า\nเพื่อช่วยลดเวลาในการค้นหาข้อมูลสินค้า\nเพื่อแสดงประวัติการเปลี่ยนแปลงของราคา\nเพื่อช่วยให้ผู้บริโภคตัดสินใจเลือกซื้อสินค้าได้ง่ายขึ้นมากจริงๆ', 'React|Node.js|Express.js|MySQL|Chart.js|Git|GitHub', '', 'student'),
(24, 'ระบบตรวจสอบข่าวปลอมและวิเคราะห์ความน่าเชื่อถือของข่าว', 'ผศ.ดร.สมชาย ใจดี', 2, 'IT', 'อนุมัติ', 'แสดง', 'โครงงานเดี่ยว', 1, 1, '2569/1', 'พัฒนาระบบสำหรับช่วยผู้ใช้งานตรวจสอบข่าวที่ได้รับจากสื่อออนไลน์ โดยผู้ใช้สามารถส่งข้อความข่าวหรือ URL เข้าสู่ระบบ จากนั้นระบบจะแสดงแหล่งข้อมูลที่เกี่ยวข้อง สรุปประเด็นสำคัญ และช่วยประเมินความน่าเชื่อถือโดยอ้างอิงข้อมูลจากแหล่งตรวจสอบข้อเท็จจริงที่เชื่อถือได้', 'เพื่อพัฒนาระบบช่วยตรวจสอบข้อมูลข่าวสาร\nเพื่อรวบรวมแหล่งอ้างอิงที่เกี่ยวข้องกับข่าว\nเพื่อช่วยให้ผู้ใช้งานตรวจสอบข้อเท็จจริงได้สะดวกขึ้น\nเพื่อส่งเสริมการใช้สื่อออนไลน์อย่างมีวิจารณญาณ', 'React|Node.js|Express.js|MySQL|Python|NLP|AI API|Git|GitHub', '', 'student');

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
(1, 7, 9, 22, 2, 'ระบบแนะนำร้านอาหารตามงบประมาณ', 'โครงงานคู่', 'พัฒนาระบบที่ช่วยแนะนำร้านอาหารและเมนูให้เหมาะสมกับงบประมาณ ความชอบ และประเภทอาหารที่ผู้ใช้ต้องการ โดยผู้ใช้สามารถกำหนดงบประมาณและเงื่อนไขต่าง ๆ ระบบจะแสดงร้านอาหารหรือเมนูที่ตรงกับความต้องการ', 'เพื่อช่วยค้นหาร้านอาหารตามเงื่อนไข\nเพื่อช่วยควบคุมงบประมาณในการรับประทานอาหาร\nเพื่อแนะนำร้านอาหารที่ตรงกับความสนใจ\nเพื่อรวบรวมข้อมูลร้านอาหารไว้ในระบบเดียว', 'React|Node.js|Express.js|MySQL|Google Maps API|Git|GitHub', '', 'Email', '66160001@go.buu.ac.th', 'ผู้ใช้งานอาจใช้เวลาในการค้นหาร้านอาหารที่เหมาะสมกับงบประมาณและความต้องการของตนเอง จึงต้องการพัฒนาระบบแนะนำร้านอาหารที่ช่วยคัดกรองข้อมูลและนำเสนอทางเลือกที่เหมาะสม ทำให้การตัดสินใจเลือกร้านอาหารสะดวกและรวดเร็วยิ่งขึ้น', 'ตอบรับ', '2026-10-06 14:31:57'),
(2, 10, 11, 23, 2, 'ระบบตรวจสอบและเปรียบเทียบราคาสินค้า', 'โครงงานคู่', 'พัฒนาระบบเว็บสำหรับรวบรวมและเปรียบเทียบราคาสินค้าจากร้านค้าต่าง ๆ โดยผู้ใช้งานสามารถค้นหาสินค้า ตรวจสอบราคา เปรียบเทียบราคา และดูประวัติการเปลี่ยนแปลงของราคา เพื่อช่วยให้ตัดสินใจเลือกซื้อสินค้าได้อย่างเหมาะสม', 'เพื่อพัฒนาระบบค้นหาและเปรียบเทียบราคาสินค้า\nเพื่อช่วยลดเวลาในการค้นหาข้อมูลสินค้า\nเพื่อแสดงประวัติการเปลี่ยนแปลงของราคา\nเพื่อช่วยให้ผู้บริโภคตัดสินใจเลือกซื้อสินค้าได้ง่ายขึ้น', 'React|Node.js|Express.js|MySQL|Chart.js|Git|GitHub', '', 'Email', '66160003@gmail.com', 'ปัจจุบันสินค้าประเภทเดียวกันอาจมีราคาที่แตกต่างกันในแต่ละร้าน ทำให้ผู้บริโภคต้องเสียเวลาในการค้นหาและเปรียบเทียบราคา จึงมีแนวคิดในการพัฒนาระบบที่ช่วยรวบรวมข้อมูลราคาไว้ในที่เดียว เพื่อให้ผู้ใช้งานสามารถเปรียบเทียบราคาและวางแผนการซื้อสินค้าได้สะดวกยิ่งขึ้น', 'ตอบรับ', '2026-10-13 12:34:33');

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
(1, 4, 1, NULL),
(2, 22, 7, NULL),
(3, 22, 9, NULL),
(4, 24, 12, NULL);

-- --------------------------------------------------------

--
-- Table structure for table `project_phases`
--

CREATE TABLE `project_phases` (
  `id` int NOT NULL,
  `project_id` int NOT NULL,
  `phase_name` varchar(255) NOT NULL,
  `start_date` date DEFAULT NULL,
  `due_date` date DEFAULT NULL,
  `phase_order` int DEFAULT '1',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `project_phases`
--

INSERT INTO `project_phases` (`id`, `project_id`, `phase_name`, `start_date`, `due_date`, `phase_order`, `created_at`, `updated_at`) VALUES
(2, 22, 'ศึกษาความต้องการและรวบรวมข้อมูลร้านอาหาร', '2026-10-14', '2026-10-28', 1, '2026-10-14 14:51:05', '2026-10-14 14:51:05'),
(3, 24, 'ศึกษาปัญหาและวิเคราะห์ความต้องการระบบ', '2026-10-14', '2026-10-28', 1, '2026-10-14 15:05:20', '2026-10-14 15:05:20'),
(4, 24, 'ออกแบบระบบและฐานข้อมูล', '2026-10-19', '2026-10-26', 2, '2026-10-19 11:57:18', '2026-10-19 11:57:18');

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
  `resubmitted_at` datetime DEFAULT NULL,
  `contact_type` varchar(50) DEFAULT NULL,
  `contact_value` varchar(255) DEFAULT NULL,
  `teacher_comment` text,
  `suggestion` text,
  `rejection_reason` text
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `project_requests`
--

INSERT INTO `project_requests` (`id`, `project_id`, `student_id`, `introduction`, `request_file`, `status`, `reject_reason`, `request_date`, `decision_date`, `resubmitted_at`, `contact_type`, `contact_value`, `teacher_comment`, `suggestion`, `rejection_reason`) VALUES
(1, 22, 7, 'ผู้ใช้งานอาจใช้เวลาในการค้นหาร้านอาหารที่เหมาะสมกับงบประมาณและความต้องการของตนเอง จึงต้องการพัฒนาระบบแนะนำร้านอาหารที่ช่วยคัดกรองข้อมูลและนำเสนอทางเลือกที่เหมาะสม ทำให้การตัดสินใจเลือกร้านอาหารสะดวกและรวดเร็วยิ่งขึ้น', NULL, 'อนุมัติ', NULL, '2026-10-14 13:37:18', '2026-10-14 14:00:05', '2026-10-14 13:37:18', 'Email', '66160001@go.buu.ac.th', NULL, NULL, NULL),
(2, 4, 1, 'ผมสนใจการทำระบบจัดการการยืม-คืนอุปกรณ์สำหรับนักศึกษาครับ และมีความรู้ตามที่อาจารย์ต้องการอยู่ในระดับกลางๆและสามารถรับฟังอาจารย์เพื่อเรียนรู้เพิ่มตามได้เสมอครับ', NULL, 'อนุมัติ', NULL, '2026-10-06 14:33:53', '2026-10-13 13:14:50', NULL, 'Email', '66160000@go.buu.ac.th', NULL, NULL, NULL),
(4, 23, 10, 'ปัจจุบันสินค้าประเภทเดียวกันอาจมีราคาที่แตกต่างกันในแต่ละร้าน ทำให้ผู้บริโภคต้องเสียเวลาในการค้นหาและเปรียบเทียบราคา จึงมีแนวคิดในการพัฒนาระบบที่ช่วยรวบรวมข้อมูลราคาไว้ในที่เดียว เพื่อให้ผู้ใช้งานสามารถเปรียบเทียบราคาและวางแผนการซื้อสินค้าได้สะดวกยิ่งขึ้น', NULL, 'รอพิจารณา', NULL, '2026-10-13 13:13:33', NULL, '2026-10-13 13:13:33', 'Email', '66160003@gmail.com', NULL, NULL, NULL),
(5, 24, 12, 'ปัจจุบันข้อมูลข่าวสารสามารถเผยแพร่ผ่านสื่อออนไลน์ได้อย่างรวดเร็ว ทำให้ผู้ใช้งานอาจพบข้อมูลที่คลาดเคลื่อนหรือข่าวปลอม และอาจแชร์ข้อมูลต่อโดยไม่ได้ตรวจสอบ จึงต้องการพัฒนาระบบที่ช่วยรวบรวมหลักฐานและแหล่งอ้างอิงที่เกี่ยวข้อง เพื่อสนับสนุนให้ผู้ใช้งานตรวจสอบข้อมูลก่อนเชื่อหรือเผยแพร่ต่อ', NULL, 'อนุมัติ', NULL, '2026-10-14 14:11:00', '2026-10-14 14:11:12', NULL, 'Email', '66160005@go.buu.ac.th', NULL, NULL, NULL);

-- --------------------------------------------------------

--
-- Table structure for table `project_subtasks`
--

CREATE TABLE `project_subtasks` (
  `id` int NOT NULL,
  `task_id` int NOT NULL,
  `subtask_name` varchar(255) NOT NULL,
  `status` enum('ยังไม่เริ่ม','กำลังดำเนินการ','เสร็จสิ้น') DEFAULT 'ยังไม่เริ่ม',
  `subtask_order` int DEFAULT '1',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `project_subtasks`
--

INSERT INTO `project_subtasks` (`id`, `task_id`, `subtask_name`, `status`, `subtask_order`, `created_at`, `updated_at`) VALUES
(4, 2, 'ศึกษาปัญหาข่าวปลอมบนสื่อออนไลน์', 'เสร็จสิ้น', 1, '2026-10-17 13:38:16', '2026-10-19 11:51:59'),
(5, 2, 'ศึกษาพฤติกรรมการรับข่าวสารของผู้ใช้งาน', 'เสร็จสิ้น', 2, '2026-10-17 13:38:16', '2026-10-19 11:51:59'),
(6, 2, 'สรุปปัญหาและความต้องการของผู้ใช้งาน', 'เสร็จสิ้น', 3, '2026-10-17 13:38:16', '2026-10-19 11:51:59'),
(11, 4, 'ออกแบบหน้าแรกของระบบ', 'ยังไม่เริ่ม', 1, '2026-10-19 11:57:52', '2026-10-19 11:57:52'),
(12, 4, 'ออกแบบหน้ากรอกข้อความข่าวหรือ URL', 'ยังไม่เริ่ม', 2, '2026-10-19 11:57:52', '2026-10-19 11:57:52'),
(13, 4, 'ออกแบบหน้าแสดงผลการตรวจสอบข่าว', 'ยังไม่เริ่ม', 3, '2026-10-19 11:57:52', '2026-10-19 11:57:52'),
(14, 5, 'รวบรวมเว็บไซต์ตรวจสอบข้อเท็จจริงที่น่าเชื่อถือ', 'เสร็จสิ้น', 1, '2026-10-19 12:15:19', '2026-10-20 12:13:03'),
(15, 5, 'ศึกษาวิธีค้นหาแหล่งอ้างอิงที่เกี่ยวข้อง', 'เสร็จสิ้น', 2, '2026-10-19 12:15:19', '2026-10-20 12:13:03'),
(16, 5, 'ศึกษาเทคโนโลยี AI และ NLP สำหรับวิเคราะห์ข่าวน', 'เสร็จสิ้น', 3, '2026-10-19 12:15:19', '2026-10-20 12:13:03'),
(17, 6, 'กำหนดข้อมูลนำเข้าของระบบ', 'เสร็จสิ้น', 1, '2026-10-19 12:16:21', '2026-10-20 12:24:57'),
(18, 6, 'กำหนดรูปแบบผลลัพธ์และแหล่งอ้างอิง', 'เสร็จสิ้น', 2, '2026-10-19 12:16:21', '2026-10-20 12:24:57'),
(19, 6, 'สรุปขอบเขตและความต้องการของระบบ', 'เสร็จสิ้น', 3, '2026-10-19 12:16:21', '2026-10-20 12:24:57');

-- --------------------------------------------------------

--
-- Table structure for table `project_tasks`
--

CREATE TABLE `project_tasks` (
  `id` int NOT NULL,
  `project_id` int NOT NULL,
  `phase_id` int NOT NULL,
  `task_name` varchar(255) NOT NULL,
  `description` text,
  `assignee_id` int DEFAULT NULL,
  `start_date` date DEFAULT NULL,
  `due_date` date DEFAULT NULL,
  `status` enum('ยังไม่เริ่ม','กำลังดำเนินการ','เสร็จสิ้น') DEFAULT 'ยังไม่เริ่ม',
  `review_status` enum('ยังไม่ส่ง','รอตรวจ','ผ่าน','แก้ไข') DEFAULT 'ยังไม่ส่ง',
  `submission_note` text,
  `submitted_at` datetime DEFAULT NULL,
  `reviewed_at` datetime DEFAULT NULL,
  `reviewed_by` int DEFAULT NULL,
  `teacher_comment` text,
  `teacher_file` varchar(500) DEFAULT NULL,
  `task_order` int DEFAULT '1',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `revision_started_at` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `project_tasks`
--

INSERT INTO `project_tasks` (`id`, `project_id`, `phase_id`, `task_name`, `description`, `assignee_id`, `start_date`, `due_date`, `status`, `review_status`, `submission_note`, `submitted_at`, `reviewed_at`, `reviewed_by`, `teacher_comment`, `teacher_file`, `task_order`, `created_at`, `updated_at`, `revision_started_at`) VALUES
(2, 24, 3, 'สำรวจปัญหาและความต้องการของผู้ใช้งาน', 'ศึกษาปัญหาข่าวปลอมบนสื่อออนไลน์ พฤติกรรมการรับข่าวสารของผู้ใช้งาน และความต้องการของระบบที่จะช่วยตรวจสอบข่าวก่อนนำไปแชร์ต่อ', 12, '2026-10-15', '2026-10-20', 'เสร็จสิ้น', 'ผ่าน', NULL, '2026-10-19 17:25:36', '2026-10-20 11:54:43', 2, NULL, NULL, 1, '2026-10-17 13:38:16', '2026-10-20 11:54:43', NULL),
(4, 24, 4, 'ออกแบบหน้าจอผู้ใช้งาน', 'ออกแบบหน้าจอสำหรับรับข้อความข่าวหรือ URL แสดงผลการวิเคราะห์ข่าว สรุปประเด็นสำคัญ และแสดงแหล่งอ้างอิงที่เกี่ยวข้อง', 12, '2026-10-19', '2026-10-25', 'ยังไม่เริ่ม', 'ยังไม่ส่ง', NULL, NULL, NULL, NULL, NULL, NULL, 1, '2026-10-19 11:57:52', '2026-10-19 11:57:52', NULL),
(5, 24, 3, 'ศึกษาแหล่งข้อมูลตรวจสอบข้อเท็จจริง', 'ศึกษาเว็บไซต์ตรวจสอบข้อเท็จจริงที่น่าเชื่อถือ วิธีค้นหาแหล่งอ้างอิง และเทคโนโลยีที่สามารถนำมาใช้วิเคราะห์ข้อความข่าวและสรุปเนื้อหา', 12, '2026-10-19', '2026-10-20', 'เสร็จสิ้น', 'รอตรวจ', NULL, '2026-10-20 12:48:12', NULL, NULL, NULL, NULL, 2, '2026-10-19 12:15:19', '2026-10-20 12:48:12', NULL),
(6, 24, 3, 'กำหนดขอบเขตและความต้องการของระบบ', 'กำหนดความสามารถหลักของระบบ ได้แก่ การรับข้อความข่าวหรือ URL การแสดงสรุปข่าว แหล่งอ้างอิงที่เกี่ยวข้อง และผลประเมินความน่าเชื่อถือเบื้องต้น', 12, '2026-10-20', '2026-10-26', 'เสร็จสิ้น', 'รอตรวจ', NULL, '2026-10-20 12:25:00', NULL, NULL, NULL, NULL, 3, '2026-10-19 12:16:21', '2026-10-20 12:25:00', NULL);

-- --------------------------------------------------------

--
-- Table structure for table `task_files`
--

CREATE TABLE `task_files` (
  `id` int NOT NULL,
  `task_id` int NOT NULL,
  `uploader_id` int NOT NULL,
  `original_name` varchar(255) NOT NULL,
  `stored_name` varchar(255) NOT NULL,
  `file_path` varchar(500) NOT NULL,
  `mime_type` varchar(100) DEFAULT NULL,
  `file_size` bigint DEFAULT NULL,
  `uploaded_at` datetime DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `task_files`
--

INSERT INTO `task_files` (`id`, `task_id`, `uploader_id`, `original_name`, `stored_name`, `file_path`, `mime_type`, `file_size`, `uploaded_at`) VALUES
(1, 2, 12, 'lab10_66160135.docx', '1792326523025-117421895.docx', '/uploads/task-files/1792326523025-117421895.docx', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 18646, '2026-10-18 12:28:43'),
(3, 6, 12, 'RE01-2569-002 (5).pdf', '1792499094143-778876545.pdf', '/uploads/task-files/1792499094143-778876545.pdf', 'application/pdf', 369545, '2026-10-20 12:24:54'),
(4, 5, 12, '66160002.jpg', '1792500461747-897647920.jpg', '/uploads/task-files/1792500461747-897647920.jpg', 'image/jpeg', 74780, '2026-10-20 12:47:41');

-- --------------------------------------------------------

--
-- Table structure for table `task_review_files`
--

CREATE TABLE `task_review_files` (
  `id` int NOT NULL,
  `task_id` int NOT NULL,
  `reviewer_id` int NOT NULL,
  `submitted_at` datetime NOT NULL,
  `original_name` varchar(255) NOT NULL,
  `stored_name` varchar(255) NOT NULL,
  `file_path` varchar(500) NOT NULL,
  `mime_type` varchar(150) DEFAULT NULL,
  `file_size` bigint UNSIGNED NOT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `task_review_files`
--

INSERT INTO `task_review_files` (`id`, `task_id`, `reviewer_id`, `submitted_at`, `original_name`, `stored_name`, `file_path`, `mime_type`, `file_size`, `created_at`) VALUES
(1, 2, 2, '2026-10-19 12:06:15', 'student4.jpg.jpg', '1792421763832-685901903.jpg', '/uploads/teacher-review-files/1792421763832-685901903.jpg', 'image/jpeg', 59063, '2026-10-19 14:56:03'),
(2, 2, 2, '2026-10-19 15:15:51', 'download (17).jpg', '1792422970168-978305315.jpg', '/uploads/teacher-review-files/1792422970168-978305315.jpg', 'image/jpeg', 12901, '2026-10-19 15:16:10'),
(3, 2, 2, '2026-10-19 17:24:08', 'student5.jpg.jpg', '1792430693450-986121752.jpg', '/uploads/teacher-review-files/1792430693450-986121752.jpg', 'image/jpeg', 81997, '2026-10-19 17:24:53'),
(4, 5, 2, '2026-10-20 12:13:14', 'download (17).jpg', '1792499167391-112766490.jpg', '/uploads/teacher-review-files/1792499167391-112766490.jpg', 'image/jpeg', 12901, '2026-10-20 12:26:07'),
(5, 5, 2, '2026-10-20 12:26:43', 'student4.jpg.jpg', '1792499322369-977218252.jpg', '/uploads/teacher-review-files/1792499322369-977218252.jpg', 'image/jpeg', 59063, '2026-10-20 12:28:42');

-- --------------------------------------------------------

--
-- Table structure for table `task_submissions`
--

CREATE TABLE `task_submissions` (
  `id` int NOT NULL,
  `task_id` int NOT NULL,
  `submission_number` int NOT NULL,
  `student_id` int DEFAULT NULL,
  `submission_note` text,
  `submitted_at` datetime NOT NULL,
  `review_status` enum('รอตรวจ','ผ่าน','แก้ไข') NOT NULL DEFAULT 'รอตรวจ',
  `reviewed_at` datetime DEFAULT NULL,
  `reviewed_by` int DEFAULT NULL,
  `teacher_comment` text,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `task_submissions`
--

INSERT INTO `task_submissions` (`id`, `task_id`, `submission_number`, `student_id`, `submission_note`, `submitted_at`, `review_status`, `reviewed_at`, `reviewed_by`, `teacher_comment`, `created_at`) VALUES
(1, 6, 1, 12, NULL, '2026-10-20 12:25:00', 'รอตรวจ', NULL, NULL, NULL, '2026-10-20 12:25:00'),
(2, 5, 1, 12, NULL, '2026-10-20 12:26:43', 'แก้ไข', '2026-10-20 12:28:42', 2, 'กดหกดหกดหกด', '2026-10-20 12:26:43'),
(3, 5, 2, 12, NULL, '2026-10-20 12:48:12', 'รอตรวจ', NULL, NULL, NULL, '2026-10-20 12:48:12'),
(4, 2, 1, NULL, NULL, '2026-10-19 17:25:36', 'ผ่าน', '2026-10-20 11:54:43', 2, NULL, '2026-10-20 12:58:37');

-- --------------------------------------------------------

--
-- Table structure for table `task_submission_files`
--

CREATE TABLE `task_submission_files` (
  `id` int NOT NULL,
  `submission_id` int NOT NULL,
  `original_name` varchar(255) NOT NULL,
  `stored_name` varchar(255) NOT NULL,
  `file_path` varchar(500) NOT NULL,
  `mime_type` varchar(150) DEFAULT NULL,
  `file_size` bigint UNSIGNED DEFAULT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `task_submission_files`
--

INSERT INTO `task_submission_files` (`id`, `submission_id`, `original_name`, `stored_name`, `file_path`, `mime_type`, `file_size`, `created_at`) VALUES
(1, 1, 'RE01-2569-002 (5).pdf', 'submission-1-3-1792499094143-778876545.pdf', '/uploads/task-submissions/submission-1-3-1792499094143-778876545.pdf', 'application/pdf', 369545, '2026-10-20 12:25:00'),
(2, 2, 'download (17).jpg', 'submission-2-2-1792498380347-316630373.jpg', '/uploads/task-submissions/submission-2-2-1792498380347-316630373.jpg', 'image/jpeg', 12901, '2026-10-20 12:26:43'),
(3, 3, '66160002.jpg', 'submission-3-4-1792500461747-897647920.jpg', '/uploads/task-submissions/submission-3-4-1792500461747-897647920.jpg', 'image/jpeg', 74780, '2026-10-20 12:48:12'),
(4, 4, 'lab10_66160135.docx', 'legacy-2-4-1-1792326523025-117421895.docx', '/uploads/task-submissions/legacy-2-4-1-1792326523025-117421895.docx', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 18646, '2026-10-20 12:58:37');

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
(8, 'staff01', '1234', NULL, 'นายสมชาย ใจดี', 'staff', '/src/assets/staff01.jpg', NULL, '038-102000', 'staff01@go.buu.ac.th', '/src/assets/staff01.jpg'),
(9, '66160002', '1234', 'นางสาว', 'กัญญารัตน์ สุขเกษม', 'student', '/src/assets/student3.jpg', 'IT', '0812345678', '66160002@go.buu.ac.th', '/src/assets/SignatureStudent/66160002.png'),
(10, '66160003', '1234', 'นาย', 'ธนกฤต วัฒนชัย', 'student', '/src/assets/student4.jpg', 'IT', '0812345673', '66160003@go.buu.ac.th', '/src/assets/SignatureStudent/66160003.png'),
(11, '66160004', '1234', 'นางสาว', 'พิมพ์ชนก ศรีสุวรรณ', 'student', '/src/assets/student5.jpg', 'CS', '0812345674', '66160004@go.buu.ac.th', '/src/assets/SignatureStudent/66160004.png'),
(12, '66160005', '1234', 'นาย', 'ณัฐวุฒิ เจริญสุข', 'student', '/src/assets/student6.jpg', 'SE', '0812345675', '66160005@go.buu.ac.th', '/src/assets/SignatureStudent/66160005.png');

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
-- Indexes for table `project_phases`
--
ALTER TABLE `project_phases`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fk_phase_project` (`project_id`);

--
-- Indexes for table `project_requests`
--
ALTER TABLE `project_requests`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_request` (`project_id`,`student_id`),
  ADD KEY `student_id` (`student_id`);

--
-- Indexes for table `project_subtasks`
--
ALTER TABLE `project_subtasks`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fk_subtask_task` (`task_id`);

--
-- Indexes for table `project_tasks`
--
ALTER TABLE `project_tasks`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fk_task_project` (`project_id`),
  ADD KEY `fk_task_phase` (`phase_id`),
  ADD KEY `fk_task_assignee` (`assignee_id`);

--
-- Indexes for table `task_files`
--
ALTER TABLE `task_files`
  ADD PRIMARY KEY (`id`),
  ADD KEY `task_id` (`task_id`),
  ADD KEY `uploader_id` (`uploader_id`);

--
-- Indexes for table `task_review_files`
--
ALTER TABLE `task_review_files`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_task_review_files_task` (`task_id`);

--
-- Indexes for table `task_submissions`
--
ALTER TABLE `task_submissions`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_task_submission` (`task_id`,`submission_number`),
  ADD KEY `idx_submission_date` (`task_id`,`submitted_at`);

--
-- Indexes for table `task_submission_files`
--
ALTER TABLE `task_submission_files`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_submission_files` (`submission_id`);

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
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT for table `notifications`
--
ALTER TABLE `notifications`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=28;

--
-- AUTO_INCREMENT for table `projects`
--
ALTER TABLE `projects`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=25;

--
-- AUTO_INCREMENT for table `project_invitations`
--
ALTER TABLE `project_invitations`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `project_members`
--
ALTER TABLE `project_members`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT for table `project_phases`
--
ALTER TABLE `project_phases`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT for table `project_requests`
--
ALTER TABLE `project_requests`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT for table `project_subtasks`
--
ALTER TABLE `project_subtasks`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=20;

--
-- AUTO_INCREMENT for table `project_tasks`
--
ALTER TABLE `project_tasks`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT for table `task_files`
--
ALTER TABLE `task_files`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT for table `task_review_files`
--
ALTER TABLE `task_review_files`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT for table `task_submissions`
--
ALTER TABLE `task_submissions`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT for table `task_submission_files`
--
ALTER TABLE `task_submission_files`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT for table `teacher_profiles`
--
ALTER TABLE `teacher_profiles`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=13;

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
-- Constraints for table `project_phases`
--
ALTER TABLE `project_phases`
  ADD CONSTRAINT `fk_phase_project` FOREIGN KEY (`project_id`) REFERENCES `projects` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `project_requests`
--
ALTER TABLE `project_requests`
  ADD CONSTRAINT `project_requests_ibfk_1` FOREIGN KEY (`project_id`) REFERENCES `projects` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `project_requests_ibfk_2` FOREIGN KEY (`student_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `project_subtasks`
--
ALTER TABLE `project_subtasks`
  ADD CONSTRAINT `fk_subtask_task` FOREIGN KEY (`task_id`) REFERENCES `project_tasks` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `project_tasks`
--
ALTER TABLE `project_tasks`
  ADD CONSTRAINT `fk_task_assignee` FOREIGN KEY (`assignee_id`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `fk_task_phase` FOREIGN KEY (`phase_id`) REFERENCES `project_phases` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_task_project` FOREIGN KEY (`project_id`) REFERENCES `projects` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `task_files`
--
ALTER TABLE `task_files`
  ADD CONSTRAINT `task_files_ibfk_1` FOREIGN KEY (`task_id`) REFERENCES `project_tasks` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `task_files_ibfk_2` FOREIGN KEY (`uploader_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `task_submissions`
--
ALTER TABLE `task_submissions`
  ADD CONSTRAINT `fk_task_submissions_task` FOREIGN KEY (`task_id`) REFERENCES `project_tasks` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `task_submission_files`
--
ALTER TABLE `task_submission_files`
  ADD CONSTRAINT `fk_submission_files_submission` FOREIGN KEY (`submission_id`) REFERENCES `task_submissions` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `teacher_profiles`
--
ALTER TABLE `teacher_profiles`
  ADD CONSTRAINT `teacher_profiles_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
