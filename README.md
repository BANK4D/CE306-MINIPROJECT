# 🎓 Faculty Announcement Hub (CE306 Web Application Mini Project)
### 🏛️ ระบบศูนย์กลางประกาศและบริหารกิจกรรมอัจฉริยะ คณะวิศวกรรมศาสตร์ มหาวิทยาลัยธุรกิจบัณฑิตย์ (DPU)

> **โครงงานรายวิชา:** CE 306 โปรแกรมประยุกต์บนเว็บ (Web Applications)  
> **หลักสูตร:** วิศวกรรมศาสตรบัณฑิต สาขาวิชาวิศวกรรมคอมพิวเตอร์ วิทยาลัยวิศวกรรมศาสตร์และเทคโนโลยี (CITE DPU)  
> **สถานะระบบ:** 🟢 ใช้งานได้จริง (Production Ready) • เชื่อมต่อข้อมูลแบบเรียลไทม์ (Full Real-time Synchronization)

---

## 📌 บทสรุปผู้บริหารและภาพรวมโครงการ (Executive Summary)

**Faculty Announcement Hub** ได้รับการพัฒนาขึ้นเพื่อเป็นศูนย์กลางการสื่อสารและกระจายข่าวสารอย่างมีประสิทธิภาพระหว่างคณาจารย์และนักศึกษา โดยยกระดับจากระบบประกาศทั่วไปสู่ **Smart Campus Portal** ที่มีเอกลักษณ์ของสถาบันอย่างแท้จริง ออกแบบตามมาตรฐานโปรเจกต์ระดับโปรดักชัน (`Full-stack TypeScript + Express + Socket.io WebSockets + SQLite + Scrypt Security`) 

ตัวระบบรองรับการแสดงผลและการแจ้งเตือนแบบ **Real-time 100%** เมื่ออาจารย์สร้างหรือแก้ไขประกาศ นักศึกษาจะเห็นข้อมูลทันทีโดยไม่ต้องรีเฟรชหน้าเว็บ พร้อมระบบลงทะเบียนกิจกรรมเพื่อรับบัตร **Dynamic E-Ticket QR Code** สำหรับใช้เช็คชื่อหน้างาน

---

## 🎨 การออกแบบส่วนต่อประสานผู้ใช้ใหม่ (New UI & Design System)

ระบบได้รับการยกเครื่องดีไซน์ใหม่ทั้งหมด เพื่อลบภาพจำแบบ "เทมเพลต AI ทั่วไป" และผสาน **อัตลักษณ์ทางการของ DPU และ CITE** ไว้อย่างโดดเด่น:

1. **อัตลักษณ์มหาวิทยาลัยธุรกิจบัณฑิตย์ (DPU Branding):**
   - **ตราสัญลักษณ์สถาบัน (DPU Emblem):** ติดตั้งบน Header และหน้าต่าง Login ชัดเจน
   - **แถบ University Utility Bar ด้านบน:** เชื่อมโยงระบบบริการนักศึกษาจริง เช่น `REG DPU`, `หอสมุดกลาง DPU`, `DPU Canvas LMS` และ `อีเมลติดต่อคณะ CITE`
   - **ภาพบรรยากาศมหาวิทยาลัย (Campus Visual Banner):** ภาพอาคารและบรรยากาศจริงของ ม.ธุรกิจบัณฑิตย์ พร้อมโทนสีสถาบัน
   - **แถบข่าวด่วนประชาสัมพันธ์ (Campus Breaking News Ticker):** แถบวิ่งแจ้งข่าวด่วนสำคัญของคณะแบบ Real-time
2. **ระบบการจัดพิมพ์และตัวอักษร (Typography):**
   - นำเข้าฟอนต์พรีเมียม **Google Fonts `Prompt`** (สำหรับหัวข้อ ปุ่ม และตัวเลข ให้ความทันสมัย คมชัด โดดเด่น) ผสานกับ **`Sarabun`** (สำหรับเนื้อหาทางการ)
3. **ชุดสีเอกลักษณ์สถาบัน (DPU Official Color Palette):**
   - **DPU Royal Purple (`#581c87`):** สีม่วงเข้มสง่างามประจำสถาบัน
   - **CITE Cyber Blue (`#0284c7`):** สีนวัตกรรมเทคโนโลยีและวิศวกรรมคอมพิวเตอร์
   - **Heritage Gold (`#f59e0b`):** สีทองสัญลักษณ์แห่งปัญญาและความสำเร็จ
4. **การ์ดประกาศพร้อมภาพแบนเนอร์ประจำหมวดหมู่ (Category Visual Banners):**
   - ภาพห้องสอบ/หอสมุดสำหรับหมวดวิชาการ, ภาพกิจกรรมแล็บและโค้ดดิ้งสำหรับ Tech Workshop, ภาพบัณฑิตสำหรับทุนการศึกษา และภาพห้องประชุมทางการ
   - **หลอดวัดที่นั่งกิจกรรมสด (Live Seat Capacity Bar):** แสดงแถบเปอร์เซ็นต์ที่นั่งและจำนวนที่เหลือแบบสด
   - **กรอบประเด็นสำคัญประจำประกาศ:** ดีไซน์สไตล์บันทึกข้อความทางการของคณะ
5. **บัตรเข้างานอิเล็กทรอนิกส์ (DPU Official E-Ticket Pass):**
   - ดีไซน์บัตร E-Pass ทางการ พร้อมลายน้ำ DPU ตรงกลาง QR Code, ชื่อผู้ลงทะเบียน, รหัสตั๋ว และปุ่มสั่งพิมพ์บัตร
6. **เอกสารประกาศทางการ (In-App Document Viewer):**
   - จัดรูปแบบตามหนังสือราชการของคณะวิศวกรรมศาสตร์ ม.ธุรกิจบัณฑิตย์ สั่งพิมพ์เป็น PDF ได้ทันที

---

## 🛠️ เทคโนโลยีและเครื่องมือที่ใช้ (Tech Stack & Tools)

| หมวดหมู่ | เทคโนโลยี / เครื่องมือ | หน้าที่และการใช้งาน |
| :--- | :--- | :--- |
| **Backend Language** | **TypeScript (ES2022 / NodeNext)** | พัฒนาสถาปัตยกรรมเซิร์ฟเวอร์แบบ Typed ปลอดภัยและมีโครงสร้างชัดเจน |
| **Backend Runtime** | **Node.js 22+ / 24+** | สภาพแวดล้อมประมวลผลเซิร์ฟเวอร์ประสิทธิภาพสูง |
| **Development Tooling** | **`tsx` + `tsc`** | รันโค้ดและ Type-check ตรวจสอบความถูกต้องของโปรแกรม |
| **Server Framework** | **Express 5.x** | จัดการ RESTful API endpoints และ Static Asset Delivery |
| **Real-time Engine** | **Socket.io (WebSockets)** | ถ่ายทอดข้อมูลแบบสองทิศทาง (Bi-directional Real-time Broadcast) |
| **Database** | **SQLite (`node:sqlite`)** | ฐานข้อมูลในตัวระบบ ไม่ต้องลงโปรแกรมเพิ่ม ข้อมูลคงทนถาวร |
| **Security & Auth** | **Salted `scrypt` + Session Cookies + CSRF** | เข้ารหัสรหัสผ่านอย่างปลอดภัย ป้องกัน CSRF Attack และ Session Hijacking |
| **Frontend** | **HTML5, CSS3 Theme Variables, JavaScript ES6+** | หน้าบ้านทำงานได้รวดเร็ว รองรับ Responsive, Dark/Light Mode |
| **Rich Text Editor** | **Quill.js (Snow Theme)** | เครื่องมือพิมพ์และจัดรูปแบบประกาศสำหรับอาจารย์ |
| **Offline QR Engine** | **Dynamic SVG QR Generator** | สร้าง QR Code E-Ticket สำหรับเช็คชื่อเข้างานกิจกรรมแบบไดนามิก |

---

## 🌟 ฟังก์ชันหลักของระบบ (System Features)

### 1. ⚡ ข้อมูลและสถานะแบบเรียลไทม์ (Real-time Synchronization)
- **ประกาศใหม่ (Live Announcement):** เมื่ออาจารย์เผยแพร่ แก้ไข หรือลบประกาศ หน้าจอของนักศึกษาทุกคนจะอัปเดตการ์ดและแสดง Toast แจ้งเตือนทันที
- **ยอดการรับทราบ (Live Acknowledgement):** ตัวเลขการกด "รับทราบ" อัปเดตสดพร้อมกันทุกเครื่อง
- **ยอดลงทะเบียนกิจกรรม (Live Seat Availability):** เมื่อมีผู้ลงทะเบียน จำนวนที่นั่งคงเหลือจะลดลงแบบสด ป้องกันการจองเกินโควตา
- **กระดานถาม-ตอบ (Live Q&A):** ข้อความคำถามของนักศึกษาหรือคำตอบของอาจารย์จะปรากฏในหน้าต่างสนทนาทันที
- **สถานะการเชื่อมต่อ:** มีไฟสถานะ `🟢 เรียลไทม์: ออนไลน์` บน Header แจ้งเตือนสถานะการเชื่อมต่อของ Socket.io

### 2. 👥 การจัดการสิทธิ์ผู้ใช้งาน (Role-based Access Control)
- **อาจารย์ (Teacher):**
  - สร้างประกาศใหม่ พร้อมเลือกกลุ่มเป้าหมาย (ทุกคน / นักศึกษา / อาจารย์)
  - กำหนดวันจัดกิจกรรม โควตาที่นั่งสูงสุด และปักหมุดประกาศด่วน
  - ปุ่มแก้ไข (Edit) และปุ่มลบ (Delete) บนการ์ดประกาศ
  - ปุ่มปักหมุด / ถอดหมุดด่วนบนการ์ด
  - **ดูรายชื่อผู้ลงทะเบียนกิจกรรม (Attendee Roster):** แสดงตารางนักศึกษาที่ลงทะเบียน วันเวลา รหัสตั๋ว และมีปุ่มสั่งพิมพ์ใบรายชื่อสำหรับเช็คชื่อหน้างาน
- **นักศึกษา (Student):**
  - ค้นหาประกาศด้วย Keyword แบบ Real-time
  - คัดกรองตามหมวดหมู่: วิชาการ, ทุนการศึกษา, กิจกรรม, ทั่วไป
  - เรียงลำดับ: ใหม่ล่าสุด, เก่าสุด, ได้รับความนิยมสูงสุด (ยอดรับทราบ)
  - บันทึกประกาศที่สนใจ (Bookmarks) ลงใน Local Storage
  - กดยืนยันการรับทราบประกาศ
  - ลงทะเบียนเข้าร่วมกิจกรรมและรับบัตร E-Ticket QR Code

### 3. 🎟️ ระบบบัตรเข้างานอิเล็กทรอนิกส์ (Dynamic E-Ticket QR Code)
- สร้าง QR Code SVG ไดนามิกอัตโนมัติเมื่อลงทะเบียนกิจกรรมสำเร็จ
- แสดงข้อมูลชื่อนักศึกษา อีเมล รหัสกิจกรรม และรหัสตรวจสอบความถูกต้อง (Verification Code)
- รองรับการสั่งพิมพ์บัตรเข้างาน (Print Ticket) เพื่อใช้ยืนยันตัวตนหน้างาน

### 4. 🤖 ผู้ช่วยอัจฉริยะ Smart AI Assistant (`/api/ai/ask`)
- ระบบแชทบอทอัจฉริยะที่เชื่อมโยงกับฐานข้อมูลประกาศจริง
- ตอบคำถามเกี่ยวกับกำหนดการสอบปลายภาค รายละเอียดทุนการศึกษา งานกิจกรรม หรือการประชุม
- นำเสนอคำตอบเป็นภาษาไทย พร้อมสร้างปุ่มลัดคลิกเพื่อเปิดดูประกาศต้นฉบับได้ทันที

### 5. 📄 โปรแกรมดูเอกสารแนบในตัว (In-App Document Viewer)
- หน้าแสดงตัวอย่างเอกสารทางการของคณะวิศวกรรมศาสตร์ ม.ธุรกิจบัณฑิตย์
- แสดงหัวข้อ รายละเอียด วันที่ประกาศ ตารางกำหนดการ และลายเซ็นรับรองอิเล็กทรอนิกส์
- รองรับการพิมพ์หรือบันทึกออกเป็นไฟล์ PDF ผ่านคำสั่ง Print ของเบราว์เซอร์

---

## 🔑 บัญชีตัวอย่างสำหรับทดสอบ (1-Click Demo Accounts)

บนหน้าจอเข้าสู่ระบบ (Sign-in Screen) ได้จัดเตรียมปุ่ม **1-Click Demo Login** เพื่อความสะดวกรวดเร็วในการตรวจงานและทดสอบสิทธิ์:

| บทบาท (Role) | อีเมล (Email) | รหัสผ่าน (Password) | สิทธิ์และการทดสอบ |
| :--- | :--- | :--- | :--- |
| **อาจารย์ (Teacher)** | `teacher@dpu.ac.th` | `password123` | จัดการประกาศเต็มรูปแบบ, แก้ไข, ลบ, ดูรายชื่อผู้ลงทะเบียน |
| **นักศึกษา (Student)** | `student@dpu.ac.th` | `password123` | อ่านประกาศ, กดรับทราบ, ลงทะเบียนรับ QR Code, ถาม Q&A |

*(ผู้ใช้ยังสามารถเลือกสมัครสมาชิกใหม่ได้ โดยบัญชีใหม่จะได้รับสิทธิ์นักศึกษาโดยอัตโนมัติ)*

---

## 📁 โครงสร้างโปรเจกต์ (Project Directory Structure)

```text
CE306-MINIPROJECT/
├── demo.html                 # หน้าเว็บหลัก (SPA) ธีม CITE DPU
├── css/demo.css              # สไตล์ชีต, Responsive, Print, Dark Mode
├── js/demo.js                # Client script, Socket.io client, QR E-Ticket generator
├── project/
│   ├── src/
│   │   ├── server.ts         # Entry point (HTTP + Socket.io)
│   │   ├── app.ts            # Express app, middleware, static files
│   │   ├── config/env.ts     # Environment variables และพาธของระบบ
│   │   ├── database/
│   │   │   ├── db.ts         # SQLite (`node:sqlite`) + query helpers + migration
│   │   │   ├── schema.sql    # Database schema
│   │   │   └── seed.ts       # ข้อมูลเริ่มต้น (4 ประกาศ + บัญชีตัวอย่าง)
│   │   ├── middlewares/auth.middleware.ts   # Session, Scrypt, CSRF, role guard
│   │   ├── routes/
│   │   │   ├── auth.routes.ts           # สมัคร / เข้าสู่ระบบ / Demo login
│   │   │   ├── announcements.routes.ts  # ประกาศ, ลงทะเบียน, Q&A, เช็คชื่อ, CSV, ไฟล์แนบ
│   │   │   └── ai.routes.ts             # ผู้ช่วยค้นหาประกาศ
│   │   ├── services/realtime.service.ts # Socket.io broadcast
│   │   └── types/index.ts               # TypeScript types
│   ├── database/data/        # ไฟล์ SQLite ถูกสร้างอัตโนมัติที่นี่ (ไม่ถูก commit)
│   ├── .env.example          # ตัวอย่างค่า PORT / DATABASE_PATH
│   ├── package.json
│   ├── tsconfig.json
│   └── README.md             # เอกสารฝั่ง Backend
└── README.md                 # เอกสารภาพรวม (หน้านี้)
```

> ไฟล์ไหนที่ถูกลบในรอบทำความสะอาด: `project/server.js`, `project/database/{db.js,schema.sql,seed.js}` (โค้ด JavaScript รุ่นเก่าที่ซ้ำกับ `src/` และไม่ได้ถูกเรียกใช้), dependency `zod` และสคริปต์ `db:init` ที่ไม่ได้ใช้

---

## 🚀 วิธีการติดตั้งและเริ่มใช้งาน (Getting Started)

### ความต้องการของระบบ (Prerequisites)
- **Node.js:** เวอร์ชั่น 22.5.0 หรือใหม่กว่า (แนะนำ Node.js 22 หรือ 24)
- **npm:** ติดตั้งมาพร้อมกับ Node.js

### ขั้นตอนการรันระบบ
1. เปิด Terminal / PowerShell แล้วเข้าไปที่โฟลเดอร์ `project`:
   ```bash
   cd project
   ```

2. ติดตั้งแพ็กเกจที่จำเป็น (หากยังไม่ได้ติดตั้ง):
   ```bash
   npm install
   ```

3. ตรวจสอบความถูกต้องของ Types (TypeScript Typecheck):
   ```bash
   npm run typecheck
   ```

4. เริ่มต้นเซิร์ฟเวอร์:
   * **โหมด Production / มาตรฐาน:**
     ```bash
     npm start
     ```
   * **โหมด Development (รีสตาร์ทอัตโนมัติเมื่อแก้โค้ด):**
     ```bash
     npm run dev
     ```

5. เปิดเว็บเบราว์เซอร์ไปที่:
   ```text
   http://localhost:3000
   ```

---

## 📡 รายการ API Endpoints (API Specification)

### 🔐 หมวด Authentication
| Method | Endpoint | สิทธิ์ | คำอธิบาย |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/auth/me` | สาธารณะ | ตรวจสอบสถานะการล็อกอินและสิทธิ์ปัจจุบัน |
| `POST` | `/api/auth/register` | สาธารณะ | สมัครสมาชิกใหม่ (ได้รับสิทธิ์นักศึกษา) |
| `POST` | `/api/auth/login` | สาธารณะ | เข้าสู่ระบบด้วยอีเมลและรหัสผ่าน |
| `POST` | `/api/auth/demo-login` | สาธารณะ | เข้าสู่ระบบด้วยบัญชีตัวอย่าง 1-Click (teacher / student) |
| `POST` | `/api/auth/logout` | ล็อกอินแล้ว | ออกจากระบบและล้างเซสชัน |

### 📢 หมวด Announcements
| Method | Endpoint | สิทธิ์ | คำอธิบาย |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/announcements` | ล็อกอินแล้ว | ดึงรายการประกาศทั้งหมดตามสิทธิ์ของผู้ใช้ |
| `GET` | `/api/announcements/:id` | ล็อกอินแล้ว | ดึงรายละเอียดประกาศรายตัว |
| `POST` | `/api/announcements` | อาจารย์ | สร้างประกาศใหม่ (Broadcast เรียลไทม์) |
| `PUT` | `/api/announcements/:id` | อาจารย์ | แก้ไขข้อมูลประกาศเดิม (Broadcast เรียลไทม์) |
| `DELETE` | `/api/announcements/:id` | อาจารย์ | ลบประกาศ (Broadcast เรียลไทม์) |
| `PATCH` | `/api/announcements/:id/pin` | อาจารย์ | ปักหมุด / ถอดหมุดประกาศ (Broadcast เรียลไทม์) |
| `PUT` | `/api/announcements/:id/acknowledgement` | ล็อกอินแล้ว | บันทึกหรือยกเลิกการรับทราบประกาศ (Broadcast เรียลไทม์) |
| `POST` | `/api/announcements/:id/registration` | ล็อกอินแล้ว | ลงทะเบียนเข้าร่วมกิจกรรม (Broadcast เรียลไทม์) |
| `GET` | `/api/announcements/:id/registrations` | อาจารย์ | ดูรายชื่อนักศึกษาที่ลงทะเบียนกิจกรรม |
| `POST` | `/api/announcements/:id/checkin` | อาจารย์ | เช็คชื่อ/ยกเลิกเช็คชื่อผู้เข้างานด้วยรหัสตั๋วหรือ user id |
| `GET` | `/api/announcements/:id/export-csv` | อาจารย์ | ดาวน์โหลดรายชื่อผู้ลงทะเบียนเป็น CSV |
| `POST` | `/api/announcements/:id/attachments` | อาจารย์ | อัปโหลดไฟล์แนบ (สูงสุด 10 ไฟล์ / 10 MB ต่อไฟล์) |
| `GET` | `/api/announcements/:id/attachments/:attachmentId` | ล็อกอินแล้ว | เปิด/ดาวน์โหลดไฟล์แนบ |
| `DELETE` | `/api/announcements/:id/attachments/:attachmentId` | อาจารย์ | ลบไฟล์แนบ |
| `GET` | `/api/announcements/:id/ticket` | ล็อกอินแล้ว | ดึงข้อมูลบัตรเข้างาน E-Ticket สำหรับสร้าง QR Code |
| `POST` | `/api/announcements/:id/comments` | ล็อกอินแล้ว | ส่งข้อความถาม-ตอบบนประกาศ (Broadcast เรียลไทม์) |

### 🤖 หมวด Smart AI Assistant & Health
| Method | Endpoint | สิทธิ์ | คำอธิบาย |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/ai/ask` | ล็อกอินแล้ว | ค้นหาและตอบคำถามจากฐานข้อมูลประกาศจริง |
| `GET` | `/api/health` | สาธารณะ | ตรวจสอบสถานะการเชื่อมต่อ Database และ WebSocket |

---

## ⚡ รายการ Socket.io Real-time Events

| Event Name | ทิศทาง | Payload | การทำงานบนหน้าบ้าน |
| :--- | :--- | :--- | :--- |
| `announcement:created` | Server ➔ Client | `Announcement` | เพิ่มการ์ดประกาศใหม่บนสุดทันที พร้อมเสียงแจ้งเตือน |
| `announcement:updated` | Server ➔ Client | `Announcement` | อัปเดตเนื้อหาของการ์ดประกาศนั้นแบบสด |
| `announcement:deleted` | Server ➔ Client | `{ id }` | ลบการ์ดประกาศออกจากหน้าจอทันที |
| `announcement:ack` | Server ➔ Client | `{ announcementId, ackCount }` | อัปเดตตัวเลขยอดรับทราบของการ์ดนั้นสด |
| `announcement:registered`| Server ➔ Client | `{ announcementId, seatsTaken, seatsMax }` | อัปเดตที่นั่งที่ถูกจองสดทันที |
| `attendance:checkedin` | Server ➔ Client | `{ announcementId, userId, name, checkedIn, checkedInAt }` | อัปเดตสถานะเช็คชื่อในรายชื่อสด |
| `comment:new` | Server ➔ Client | `{ announcementId, comment }` | ดันข้อความความคิดเห็นใหม่เข้า Modal Q&A ทันที |

---

## 💾 ข้อมูลตัวอย่างเริ่มต้น (Preserved Data)
ฐานข้อมูลเก็บรักษาประกาศหลัก 4 รายการดั้งเดิมไว้ครบถ้วน ได้แก่:
1. **แจ้งกำหนดการสอบปลายภาค ภาคการศึกษาที่ 1/2569** (หมวดวิชาการ • 1-15 พ.ย. 2569)
2. **Tech Workshop: การพัฒนา Web Application ยุคใหม่ & AI** (หมวดกิจกรรม • รับ 50 ที่นั่ง • มี QR Code)
3. **เปิดรับสมัครทุนเรียนดีและทุนนวัตกรรม ประจำปี 2569** (หมวดทุนการศึกษา • เกรด 3.25 ขึ้นไป)
4. **[ภายใน] ขอเชิญประชุมคณาจารย์เพื่อทบทวนเกณฑ์มาตรฐานหลักสูตร** (หมวดทั่วไป • เฉพาะอาจารย์)

---

## 👨‍💻 ข้อมูลผู้พัฒนา
- **นักศึกษา:** ธนบดี หมื่นไกรทอง
- **สาขาวิชา:** วิศวกรรมคอมพิวเตอร์ วิทยาลัยนวัตกรรมด้านเทคโนโลยีและวิศวกรรมศาสตร์ (CITE) มหาวิทยาลัยธุรกิจบัณฑิตย์ (DPU)
- **รายวิชา:** CE 306 โปรแกรมประยุกต์บนเว็บ (Web Applications)
