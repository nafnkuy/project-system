-- phpMyAdmin SQL Dump
-- version 5.2.2
-- https://www.phpmyadmin.net/
--
-- Host: mysql:3306
-- Generation Time: Aug 10, 2026 at 03:08 PM
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
(1, 7, 'นายสุขใจ ใจดี ได้เชิญคุณเข้าร่วมโครงงาน \"งสาน่นร่\"', 0, '2026-08-07 16:10:49'),
(2, 7, 'นายสุขใจ ใจดี ได้เชิญคุณเข้าร่วมโครงงาน \"ทดทดสอบสอบ\"', 0, '2026-08-08 18:36:30'),
(3, 1, 'กิตติพงษ์ แสงดี ตอบรับคำเชิญเข้าร่วมโครงงาน \"ทดทดสอบสอบ\" แล้ว', 0, '2026-08-08 19:07:41'),
(4, 7, 'กิตติพงษ์ แสงดี ได้เชิญคุณเข้าร่วมโครงงาน \"สอบบบบ\"', 0, '2026-08-08 19:27:55'),
(5, 7, 'กิตติพงษ์ แสงดี ตอบรับคำเชิญเข้าร่วมโครงงาน \"สอบบบบ\" แล้ว', 0, '2026-08-09 19:13:23'),
(6, 1, 'กิตติพงษ์ แสงดี ตอบรับคำเชิญเข้าร่วมโครงงาน \"งสาน่นร่\" แล้ว', 0, '2026-08-09 19:14:33'),
(7, 1, 'กิตติพงษ์ แสงดี ได้เชิญคุณเข้าร่วมโครงงาน \"เห้อ\"', 0, '2026-08-09 19:17:44'),
(8, 7, 'นายสุขใจ ใจดี ปฏิเสธคำเชิญเข้าร่วมโครงงาน \"เห้อ\"', 0, '2026-08-09 19:18:10'),
(9, 1, 'กิตติพงษ์ แสงดี ได้เชิญคุณเข้าร่วมโครงงาน \"ครั้งที่เอ็น\"', 0, '2026-08-09 19:19:38'),
(10, 7, 'นายสุขใจ ใจดี ได้เชิญคุณเข้าร่วมโครงงาน \"อยาดาดก\"', 0, '2026-08-09 19:26:08'),
(11, 1, 'กิตติพงษ์ แสงดี ปฏิเสธคำเชิญเข้าร่วมโครงงาน \"อยาดาดก\"', 0, '2026-08-09 19:37:07');

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
(2, 'ระบบห้องสมุด', 'ผศ.ดร.กิตติ', 3, 'CS', 'ปิดรับ', 'แสดง', 'โครงงานเดี่ยว', 1, 1, '2569', 'ระบบบริหารจัดการห้องสมุดสำหรับยืม-คืนหนังสือ ค้นหาหนังสือ และจัดการสมาชิก', 'พัฒนาระบบยืมคืนหนังสือ|ออกแบบระบบค้นหาหนังสือ|จัดการข้อมูลสมาชิก', 'Html|CSS|JavaScript|MySQL|PHP', 'ปี 1 ขึ้นไป|มีพื้นฐาน Web|ทำงานเป็นทีมได้', 'teacher'),
(3, 'IoT Intelligent Sleep Analysis and Recommendation System', 'ผศ.ดร.ประวิทย์', 4, 'SE', 'เปิดรับ', 'แสดง', 'โครงงานคู่', 2, 0, '2569', 'ระบบที่ช่วยให้ร้านอาหารสามารถจัดการออเดอร์ โต๊ะ และการเสิร์ฟอาหารได้อย่างเป็นระบบ ลดความสับสนระหว่างพนักงานครัวและพนักงานเสิร์ฟ ทำให้การให้บริการลูกค้ารวดเร็วขึ้น และลดปัญหาออเดอร์ตกหล่นในช่วงเวลาที่ร้านมีลูกค้าเยอะ\r\n', 'จัดการออเดอร์แบบเรียลไทม์|ลดความผิดพลาดในการสั่งอาหาร|จัดการโต๊ะและสถานะลูกค้า|เพิ่มความเร็วในการให้บริการ', 'React|Node.js|MySQL|Express', 'ปี 4 เท่านั้น|ทำงานภายใต้แรงกดดันได้|สื่อสารในทีมได้|เข้าใจระบบ Order', 'teacher'),
(4, 'ระบบจัดการร้านกาแฟ', 'ผศ.ดร.สุชาติ', 5, 'CS', 'เปิดรับ', 'แสดง', 'โครงงานเดี่ยว', 1, 0, '2569', 'ระบบที่ช่วยควบคุมการรับออเดอร์และจัดการเมนูภายในร้านกาแฟ ลดความผิดพลาดจากการจดออเดอร์ด้วยมือ และช่วยให้พนักงานสามารถดูรายการสั่งซื้อได้แบบเรียลไทม์ ทำให้การบริการลูกค้าเป็นไปอย่างรวดเร็วและแม่นยำ', 'จัดการเมนูและออเดอร์|ลดความผิดพลาดจากการจดรายการ|คำนวณยอดขายอัตโนมัติ|เพิ่มความเร็วในการบริการ', 'HTML|CSS|JavaScript|MySQL', 'ปี 4 เท่านั้น|พื้นฐาน Web|ทำงานละเอียด|สื่อสารได้', 'teacher'),
(5, 'ระบบติดตามการเข้าเรียน', 'ผศ.ดร.สมชาย', 2, 'IT', 'เปิดรับ', 'แสดง', 'โครงงานเดี่ยว', 1, 0, '2569', 'ระบบที่ช่วยบันทึกการเข้าเรียนของนักศึกษาแบบอัตโนมัติ ลดปัญหาการเช็คชื่อด้วยมือและการลงชื่อแทนกัน สามารถสรุปสถิติการเข้าเรียนของแต่ละคนได้ ทำให้อาจารย์สามารถติดตามวินัยการเข้าเรียนได้อย่างแม่นยำ\r\n', 'บันทึกการเข้าเรียนแบบอัตโนมัติ|ลดการปลอมแปลงการเช็คชื่อ|สรุปสถิติการเข้าเรียน|เพิ่มความแม่นยำของข้อมูล', 'React|Node.js|MySQL|QR Code', 'ปี 4 เท่านั้น|เข้าใจ JavaScript|ชอบระบบ automation|รับผิดชอบสูง', 'teacher'),
(6, 'ระบบคลังสินค้า', 'ผศ.ดร.กิตติ', 3, 'CS', 'ใกล้เต็ม', 'แสดง', 'โครงงานคู่', 2, 0, '2569', 'ระบบที่ช่วยควบคุมการเข้า-ออกของสินค้าในคลัง ลดปัญหาสต็อกไม่ตรงและสินค้าหาย สามารถตรวจสอบจำนวนสินค้าแบบเรียลไทม์ และช่วยแจ้งเตือนเมื่อสินค้าใกล้หมด ทำให้การจัดการคลังมีประสิทธิภาพมากขึ้น', 'จัดการสต็อกสินค้าแบบเรียลไทม์|ลดสินค้าสูญหาย|ตรวจสอบสินค้าได้แม่นยำ|เพิ่มประสิทธิภาพคลังสินค้า', 'PHP|MySQL|JavaScript', 'ปี 4 เท่านั้น|ละเอียดรอบคอบ|เข้าใจระบบ stock|ทำงานเป็นระบบ', 'teacher'),
(7, 'ระบบร้านหนังสือออนไลน์', 'ผศ.ดร.อนันต์', 6, 'IT', 'เปิดรับ', 'แสดง', 'โครงงานคู่', 2, 0, '2569', 'ระบบที่เปิดโอกาสให้ลูกค้าสามารถเลือกซื้อหนังสือผ่านออนไลน์ได้โดยไม่ต้องเดินทางไปหน้าร้าน รองรับการค้นหาและสั่งซื้อหนังสือได้ในที่เดียว พร้อมระบบตะกร้าสินค้าและการจัดการคำสั่งซื้อที่ครบถ้วน', 'สร้างระบบขายหนังสือออนไลน์|จัดการตะกร้าสินค้า|เพิ่มช่องทางการขาย|จัดการออเดอร์ลูกค้า', 'React|Node.js|MySQL', 'ปี 4 เท่านั้น|สนใจ E-commerce|พื้นฐาน Web|ทำงานเป็นทีม', 'teacher'),
(8, 'ระบบจองสนามกีฬา', 'ผศ.ดร.สุชาติ', 5, 'CS', 'เปิดรับ', 'แสดง', 'โครงงานเดี่ยว', 1, 0, '2569', 'ระบบที่ช่วยให้ผู้ใช้งานสามารถตรวจสอบและจองสนามกีฬาได้ล่วงหน้า ลดปัญหาการแย่งสนามหรือจองซ้ำ ทำให้การจัดการเวลาการใช้งานสนามเป็นระบบและโปร่งใสมากขึ้น\r\n', 'จัดการการจองสนามแบบเรียลไทม์|ลดการจองซ้ำ|จัดการเวลาใช้งานสนาม|เพิ่มความโปร่งใส', 'React|Node.js|MySQL', 'ปี 4 เท่านั้น|จัดการเวลาได้ดี|เข้าใจระบบจอง|รับผิดชอบ', 'teacher'),
(9, 'ระบบบริหารคลินิก', 'ผศ.ดร.ประวิทย์', 4, 'SE', 'เปิดรับ', 'แสดง', 'โครงงานคู่', 2, 0, '2569', 'ระบบที่ช่วยจัดการข้อมูลคนไข้ การนัดหมาย และประวัติการรักษา ลดความซ้ำซ้อนของเอกสารและเพิ่มความแม่นยำในการดูแลผู้ป่วย ทำให้แพทย์สามารถเข้าถึงข้อมูลได้อย่างรวดเร็ว\r\n', 'จัดการข้อมูลคนไข้|จัดการนัดหมายแพทย์|ลดความซ้ำซ้อนของข้อมูล|เพิ่มความรวดเร็วในการบริการ', 'PHP|MySQL|JavaScript', 'ปี 4 เท่านั้น|ละเอียดมาก|เข้าใจข้อมูลสุขภาพ|รอบคอบ', 'teacher'),
(10, 'ระบบจัดการหอพักนักศึกษา', 'ผศ.ดร.สมชาย', 2, 'IT', 'ใกล้เต็ม', 'แสดง', 'โครงงานคู่', 2, 0, '2569', 'ระบบที่ช่วยให้ผู้พักสามารถจองห้อง ตรวจสอบสถานะห้อง และชำระค่าเช่าได้ออนไลน์ ลดความยุ่งยากในการจัดการหอพักและช่วยให้ผู้ดูแลสามารถควบคุมข้อมูลห้องพักได้ง่ายขึ้น', 'จัดการห้องพักและค่าเช่า|ลดเอกสาร|เพิ่มความสะดวกผู้เช่า|ตรวจสอบสถานะห้อง', 'React|Node.js|MySQL', 'ปี 4 เท่านั้น|รับผิดชอบ|เข้าใจระบบหอพัก|ทำงานเป็นระบบ', 'teacher'),
(11, 'ระบบแจ้งซ่อมออนไลน์', 'ผศ.ดร.กิตติ', 3, 'CS', 'เปิดรับ', 'แสดง', 'โครงงานเดี่ยว', 1, 0, '2569', 'ระบบที่ช่วยให้ผู้ใช้งานสามารถแจ้งปัญหาอุปกรณ์หรือสิ่งชำรุดได้ทันที และติดตามสถานะการซ่อมได้แบบเรียลไทม์ ลดปัญหาการแจ้งซ้ำและการซ่อมล่าช้า ทำให้การจัดการงานซ่อมมีประสิทธิภาพมากขึ้น', 'แจ้งซ่อมและติดตามสถานะงาน|ลดงานตกหล่น|เพิ่มความรวดเร็วในการแก้ปัญหา', 'React|Node.js|MySQL', 'ปี 4 เท่านั้น|แก้ปัญหาเป็นระบบ|สื่อสารได้|รับผิดชอบ', 'teacher'),
(12, 'ระบบจัดการร้านขายยา', 'ผศ.ดร.อนันต์', 6, 'IT', 'เปิดรับ', 'แสดง', 'โครงงานคู่', 2, 0, '2569', 'ระบบที่ช่วยควบคุมการขายและสต็อกยา ลดปัญหายาใกล้หมดอายุหรือข้อมูลสต็อกไม่ตรง ช่วยให้การจ่ายยาเป็นระบบและลดความผิดพลาดในการจัดการสินค้า', 'จัดการสต็อกยา|ลดสินค้าหมดอายุ|เพิ่มความแม่นยำการขาย', 'PHP|MySQL|JavaScript', 'ปี 4 เท่านั้น|ละเอียดมาก|เข้าใจ stock|รอบคอบ', 'teacher'),
(13, 'ระบบเช็คชื่อด้วย QR Code', 'ผศ.ดร.สมชาย', 2, 'IT', 'ใกล้เต็ม', 'แสดง', 'โครงงานคู่', 2, 0, '2569', 'ระบบที่ช่วยให้นักศึกษาสามารถเช็คชื่อเข้าเรียนได้อย่างรวดเร็วผ่านการสแกน QR Code ลดการเช็คชื่อแบบเดิมที่ใช้เวลานานและมีโอกาสผิดพลาด พร้อมบันทึกข้อมูลเข้าเรียนแบบอัตโนมัติ', 'เช็คชื่อด้วย QR แบบอัตโนมัติ|ลดเวลาเรียน|ป้องกันการปลอมแปลง', 'React|Node.js|QR Code|MySQL', 'ปี 4 เท่านั้น|ชอบ automation|JS ได้|คิดเป็นระบบ', 'teacher'),
(14, 'ระบบจองคิวโรงพยาบาล', 'ผศ.ดร.ประวิทย์', 4, 'SE', 'เปิดรับ', 'แสดง', 'โครงงานคู่', 2, 0, '2569', 'ระบบที่ช่วยให้ผู้ป่วยสามารถจองคิวพบแพทย์ล่วงหน้าได้ ลดระยะเวลาการรอคอยในโรงพยาบาล และช่วยให้การจัดลำดับคิวเป็นระบบมากขึ้น เพิ่มความสะดวกทั้งผู้ป่วยและเจ้าหน้าที่', 'จัดการคิวผู้ป่วย|ลดเวลารอ|เพิ่มความเป็นระบบ', 'React|Node.js|MySQL', 'ปี 4 เท่านั้น|ละเอียด|สื่อสารดี|รับผิดชอบ', 'teacher'),
(15, 'ระบบจัดการฟิตเนส', 'ผศ.ดร.สุชาติ', 5, 'CS', 'ใกล้เต็ม', 'แสดง', 'โครงงานคู่', 2, 0, '2569', 'ระบบที่ช่วยบริหารสมาชิกและการเข้าใช้งานฟิตเนส ทำให้สามารถติดตามจำนวนผู้ใช้และสถานะสมาชิกได้ง่ายขึ้น ลดความยุ่งยากในการจัดการข้อมูลสมาชิกแบบเดิม', 'จัดการสมาชิกฟิตเนส|ติดตามการเข้าใช้|ลดความซ้ำซ้อนข้อมูล', 'React|Node.js|MySQL', 'ปี 4 เท่านั้น|สนใจสุขภาพ|พื้นฐาน Web', 'teacher'),
(16, 'ระบบขายสินค้าออนไลน์', 'ผศ.ดร.อนันต์', 6, 'IT', 'เปิดรับ', 'แสดง', 'โครงงานเดี่ยว', 1, 0, '2569', 'ระบบที่ช่วยให้ร้านค้าสามารถขายสินค้าออนไลน์ได้ครบวงจร ตั้งแต่การเลือกสินค้า ตะกร้า ไปจนถึงการสั่งซื้อ ช่วยเพิ่มช่องทางการขายและเข้าถึงลูกค้าได้มากขึ้น', 'ระบบขายสินค้าออนไลน์ครบวงจร|เพิ่มยอดขาย|จัดการออเดอร์', 'React|Node.js|MySQL', 'ปี 4 เท่านั้น|สนใจ E-commerce|คิดเชิงธุรกิจ', 'teacher'),
(17, 'ระบบติดตามการส่งพัสดุ', 'ผศ.ดร.กิตติ', 3, 'CS', 'เปิดรับ', 'แสดง', 'โครงงานเดี่ยว', 1, 0, '2569', 'ระบบที่ช่วยให้ผู้ใช้สามารถตรวจสอบสถานะพัสดุได้แบบเรียลไทม์ ลดความไม่แน่นอนในการจัดส่ง และช่วยให้ผู้รับสามารถวางแผนการรับพัสดุได้สะดวกขึ้น', 'ติดตามสถานะพัสดุแบบเรียลไทม์|ลดความไม่แน่นอน|เพิ่มความโปร่งใส', 'React|Node.js|API Integration', 'ปี 4 เท่านั้น|เข้าใจ API|ละเอียด', 'teacher'),
(18, 'ระบบจัดการโรงแรม', 'ผศ.ดร.ประวิทย์', 4, 'SE', 'ใกล้เต็ม', 'แสดง', 'โครงงานคู่', 2, 0, '2569', 'ระบบที่ช่วยบริหารการจองห้องพัก เช็คอิน และเช็คเอาท์อย่างเป็นระบบ ลดปัญหาการจองซ้ำและช่วยให้โรงแรมสามารถจัดการห้องพักได้อย่างมีประสิทธิภาพ', 'จัดการจองห้องพัก|ลดการจองซ้ำ|เพิ่มประสิทธิภาพโรงแรม', 'React|Node.js|MySQL', 'ปี 4 เท่านั้น|จัดการระบบได้|สื่อสารดี', 'teacher'),
(19, 'ระบบบริหารร้านซักรีด', 'ผศ.ดร.สุชาติ', 5, 'CS', 'เปิดรับ', 'แสดง', 'โครงงานเดี่ยว', 1, 0, '2569', 'ระบบที่ช่วยจัดการออเดอร์รับ-ส่งผ้าและติดตามสถานะงานซัก ลดความสับสนในการรับงานและช่วยให้ลูกค้าสามารถตรวจสอบสถานะงานได้ตลอดเวลา\r\n', 'จัดการออเดอร์ซักผ้า|ติดตามสถานะงาน|ลดความสับสน', 'PHP|MySQL|JavaScript', 'ปี 4 เท่านั้น|ละเอียด|เข้าใจ workflow', 'teacher'),
(20, 'ระบบบริหารศูนย์รับเลี้ยงสัตว์', 'ผศ.ดร.อนันต์', 6, 'IT', 'เปิดรับ', 'แสดง', 'โครงงานคู่', 2, 0, '2569', 'ระบบที่ช่วยจัดการการรับฝากสัตว์เลี้ยงและติดตามสถานะระหว่างฝาก ช่วยให้เจ้าของมั่นใจว่าสัตว์เลี้ยงได้รับการดูแลอย่างเหมาะสมและตรวจสอบได้ตลอดเวลา', 'จัดการการฝากสัตว์|ติดตามสถานะสัตว์|เพิ่มความมั่นใจเจ้าของ', 'React|Node.js|MySQL', 'ปี 4 เท่านั้น|รักสัตว์|สื่อสารดี', 'teacher'),
(21, 'ระบบจองโต๊ะร้านอาหาร', 'ผศ.ดร.สมชาย', 2, 'IT', 'ใกล้เต็ม', 'แสดง', 'โครงงานคู่', 2, 0, '2569', 'ระบบที่ช่วยให้ลูกค้าสามารถจองโต๊ะล่วงหน้าได้ ลดปัญหาการรอคิวหน้าร้าน และช่วยให้ร้านสามารถจัดการจำนวนลูกค้าได้อย่างมีประสิทธิภาพมากขึ้น', 'จองโต๊ะออนไลน์แบบเรียลไทม์|ลดการรอคิว|จัดการลูกค้า', 'React|Node.js|MySQL', 'ปี 4 เท่านั้น|ตรงเวลา|เข้าใจระบบจอง', 'teacher'),
(22, 'ระบบจัดการร้านดอกไม้', 'ผศ.ดร.กิตติ', 3, 'CS', 'เปิดรับ', 'แสดง', 'โครงงานเดี่ยว', 1, 0, '2569', 'ระบบที่ช่วยจัดการออเดอร์ดอกไม้และการจัดส่ง ลดความผิดพลาดในการรับออเดอร์ และช่วยให้การส่งสินค้าเป็นไปอย่างถูกต้องและตรงเวลา', 'จัดการออเดอร์ดอกไม้|ลดความผิดพลาด|จัดส่งตรงเวลา', 'PHP|MySQL|JavaScript', 'ปี 4 เท่านั้น|ละเอียด|จัดการงานดี', 'teacher'),
(23, 'ระบบจองห้องประชุม', 'ผศ.ดร.อนันต์', 6, 'IT', 'เปิดรับ', 'แสดง', 'โครงงานเดี่ยว', 1, 0, '2569', 'ระบบที่ช่วยให้ผู้ใช้งานสามารถตรวจสอบและจองห้องประชุมได้แบบเรียลไทม์ ลดปัญหาการจองซ้ำและช่วยให้การใช้งานห้องประชุมในองค์กรเป็นระบบมากขึ้น', 'จองห้องประชุมออนไลน์|ลดการจองซ้ำ|จัดการเวลาใช้ห้อง', 'React|Node.js|MySQL', 'ปี 4 เท่านั้น|จัดการเวลาได้|สื่อสารดี', 'teacher'),
(24, 'งสาน่นร่', 'ผศ.ดร.สมชาย ใจดี', 2, 'CS', 'รออนุมัติ', 'แสดง', 'คู่', 2, 0, NULL, '', '', '', '', 'student'),
(25, 'ดเเดเ', 'ผศ.ดร.สมชาย ใจดี', 2, 'CS', 'รออนุมัติ', 'แสดง', 'เดี่ยว', 1, 0, NULL, 'ดดด', 'ดดด', ' React | Node.js ', '', 'student'),
(26, 'fffffff', 'ผศ.ดร.สมชาย ใจดี', 2, 'CS', 'รออนุมัติ', 'แสดง', 'เดี่ยว', 1, 0, NULL, 'ดดดด', 'ดดด', 'ดดดด', '', 'student'),
(27, 'ครั้งที่ 1', 'ผศ.ดร.ประวิทย์', 4, 'CS', 'รออนุมัติ', 'แสดง', 'เดี่ยว', 1, 0, NULL, 'เเเเเ', 'เเเเ', 'React | Node.js ', '', 'student'),
(28, 'ออออออ', 'ผศ.ดร.สุชาติ', 5, 'CS', 'รออนุมัติ', 'แสดง', 'คู่', 2, 0, NULL, 'กหดหกด', 'หกดหกด', 'React | Node.js ', '', 'student'),
(29, 'ทดทดสอบสอบ', 'ผศ.ดร.สมชาย ใจดี', 2, 'CS', 'รออนุมัติ', 'แสดง', 'คู่', 2, 0, NULL, 'ทด', 'สอบบบบบบ', 'React | Node.js', '', 'student'),
(30, 'ทดทดสอบสอบ', 'ผศ.ดร.สมชาย ใจดี', 2, 'CS', 'รออนุมัติ', 'แสดง', 'เดี่ยว', 1, 0, NULL, 'ทด', 'สอบบบบบบ', 'React | Node.js', '', 'student'),
(31, 'ทดทดสอบสอบ', 'ผศ.ดร.ประวิทย์', 4, 'CS', 'รออนุมัติ', 'แสดง', 'เดี่ยว', 1, 0, NULL, 'ทด', 'สอบบบบบบ', 'React | Node.js', '', 'student'),
(32, 'สอบบบบ', 'ผศ.ดร.กิตติ', 3, 'SE', 'รออนุมัติ', 'แสดง', 'คู่', 2, 0, NULL, 'กดเกดเ', 'กดเกดเ', 'React | Node.js ', '', 'student'),
(33, '3333', 'ผศ.ดร.สุชาติ', 5, 'CS', 'รออนุมัติ', 'แสดง', 'คู่', 2, 0, NULL, '้เ่เ้่', 'เ้่้เ่', 'เ้่้เ่', '', 'student'),
(34, 'เห้อ', 'ผศ.ดร.ประวิทย์', 4, 'SE', 'รออนุมัติ', 'แสดง', 'คู่', 2, 0, NULL, 'กหดห', 'หกด', 'หกด', '', 'student'),
(35, 'ครั้งที่เอ็น', 'ผศ.ดร.อนันต์', 6, 'IT', 'รออนุมัติ', 'แสดง', 'คู่', 2, 0, NULL, 'กหดหก', 'กหดหกด', 'กหดห', '', 'student'),
(36, 'อยาดาดก', 'ผศ.ดร.กิตติ', 3, 'IT', 'รออนุมัติ', 'แสดง', 'คู่', 2, 0, NULL, 'หกดหกด', 'หกดหด', 'หกดหกด', '', 'student');

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
(1, 1, 7, 24, 2, 'งสาน่นร่', 'คู่', '', '', '', '', NULL, NULL, NULL, 'ตอบรับ', '2026-08-07 16:10:49'),
(2, 1, 7, 29, 2, 'ทดทดสอบสอบ', 'คู่', 'ทด', 'สอบบบบบบ', 'React | Node.js', '', 'Line ID', '2665', 'ทดสอบ', 'ตอบรับ', '2026-08-08 18:36:30'),
(3, 7, 7, 32, 3, 'สอบบบบ', 'คู่', 'กดเกดเ', 'กดเกดเ', 'React | Node.js ', '', 'Line ID', 'ดเดกเด', 'กดเดกเ', 'ตอบรับ', '2026-08-08 19:27:55'),
(4, 7, 1, 34, 4, 'เห้อ', 'คู่', 'กหดห', 'หกด', 'หกด', '', 'Line ID', 'หกดกหด', 'กหดหกด', 'ปฏิเสธ', '2026-08-09 19:17:44'),
(5, 7, 1, 35, 6, 'ครั้งที่เอ็น', 'คู่', 'กหดหก', 'กหดหกด', 'กหดห', '', 'Email', 'ดกหดหกด', 'หกดหกด', 'รอตอบรับ', '2026-08-09 19:19:38'),
(6, 1, 7, 36, 3, 'อยาดาดก', 'คู่', 'หกดหกด', 'หกดหด', 'หกดหกด', '', 'Email', 'หกดกหด', 'หกดกหด', 'ปฏิเสธ', '2026-08-09 19:26:08');

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
(4, 2, 7, NULL);

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
(1, 2, 1, '', NULL, 'รอพิจารณา', NULL, '2026-07-29 14:27:57', NULL, 'Email', 'แก้อำกพด้นรเ่อ'),
(2, 2, 7, '', NULL, 'รอพิจารณา', NULL, '2026-07-29 14:42:43', NULL, 'Line ID', '0324785'),
(3, 27, 1, NULL, NULL, 'รอพิจารณา', NULL, '2026-08-08 17:31:11', NULL, NULL, NULL),
(4, 28, 1, NULL, NULL, 'รอพิจารณา', NULL, '2026-08-08 17:55:47', NULL, NULL, NULL),
(5, 29, 1, 'ทดสอบ', NULL, 'รอพิจารณา', NULL, '2026-08-08 19:07:41', NULL, 'Line ID', '2665'),
(6, 32, 7, 'กดเดกเ', NULL, 'รอพิจารณา', NULL, '2026-08-09 19:13:23', NULL, 'Line ID', 'ดเดกเด'),
(7, 24, 1, NULL, NULL, 'รอพิจารณา', NULL, '2026-08-09 19:14:33', NULL, NULL, NULL);

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
  `profile_image` varchar(255) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`id`, `username`, `password`, `name`, `role`, `profile_image`) VALUES
(1, '66160000', '1234', 'นายสุขใจ ใจดี', 'student', '/src/assets/student.jpg'),
(2, 'teacher01', '1234', 'ผศ.ดร.สมชาย ใจดี', 'teacher', '/src/assets/teacher01.jpg'),
(3, 'teacher02', '1234', 'ผศ.ดร.กิตติ', 'teacher', '/src/assets/teacher02.jpg'),
(4, 'teacher03', '1234', 'ผศ.ดร.ประวิทย์', 'teacher', '/src/assets/teacher03.jpg'),
(5, 'teacher04', '1234', 'ผศ.ดร.สุชาติ', 'teacher', '/src/assets/teacher04.jpg'),
(6, 'teacher05', '1234', 'ผศ.ดร.อนันต์', 'teacher', '/src/assets/teacher05.jpg'),
(7, '66160001', '1234', 'กิตติพงษ์ แสงดี', 'student', '/src/assets/student2.jpg');

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
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=12;

--
-- AUTO_INCREMENT for table `projects`
--
ALTER TABLE `projects`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=37;

--
-- AUTO_INCREMENT for table `project_invitations`
--
ALTER TABLE `project_invitations`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT for table `project_members`
--
ALTER TABLE `project_members`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT for table `project_requests`
--
ALTER TABLE `project_requests`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=8;

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
