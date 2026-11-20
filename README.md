# 🎓 Faculty Announcement Hub (CE306 Web Application Mini Project)
### 🏛️ ระบบศูนย์กลางประกาศและบริหารกิจกรรมอัจฉริยะ คณะวิศวกรรมศาสตร์ มหาวิทยาลัยธุรกิจบัณฑิตย์ (DPU)

> **โครงงานรายวิชา:** CE 306 โปรแกรมประยุกต์บนเว็บ (Web Applications)  
> **หลักสูตร:** วิศวกรรมศาสตรบัณฑิต สาขาวิชาวิศวกรรมคอมพิวเตอร์  
> **สถานะระบบ:** 🟢 ใช้งานได้จริง (Production Ready) • เชื่อมต่อข้อมูลแบบเรียลไทม์ (Full Real-time Synchronization)

---

## 📌 บทสรุปผู้บริหารและภาพรวมโครงการ (Executive Summary)

**Faculty Announcement Hub** ได้รับการพัฒนาขึ้นเพื่อเป็นศูนย์กลางการสื่อสารและกระจายข่าวสารอย่างมีประสิทธิภาพระหว่างคณาจารย์และนักศึกษา โดยยกระดับจากระบบประกาศทั่วไปสู่ **Smart Campus Portal** ที่รองรับข้อมูลแบบเรียลไทม์ (Real-time) เต็มรูปแบบ 

ระบบได้รับการปรับเปลี่ยนสถาปัตยกรรมและเทคโนโลยีตามมาตรฐานของโปรเจกต์หลัก (`Full-stack TypeScript + Express + Socket.io WebSockets + SQLite + Scrypt Security`) ช่วยให้สามารถรองรับการแจ้งเตือน การลงทะเบียนกิจกรรม และการถาม-ตอบได้แบบทันทีโดยไม่ต้องโหลดหน้าเว็บใหม่

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
├── demo.html               # หน้าเว็บหลัก Single Page Application (SPA)
├── css/
│   └── demo.css            # สไตล์ชีตหลัก, Responsive Design, Print Styles & Dark Mode
├── js/
│   └── demo.js             # Client Script, Socket.io Real-time Client, Dynamic QR Engine
├── project/
│   ├── src/                # ซอร์สโค้ดฝั่ง Backend (TypeScript)
│   │   ├── app.ts          # Express Application, Middleware & Route Configuration
│   │   ├── server.ts       # Server Entry Point (HTTP + Socket.io Server)
│   │   ├── config/
│   │   │   └── env.ts      # จัดการ Environment Variables และพาธของระบบ
│   │   ├── database/
│   │   │   ├── db.ts       # เชื่อมต่อ SQLite Database (`node:sqlite`)
│   │   │   ├── schema.sql  # Database Schema (ตารางและ Constraints ทั้งหมด)
│   │   │   └── seed.ts     # ข้อมูลเริ่มต้น (4 ประกาศหลัก + บัญชีตัวอย่าง)
│   │   ├── middlewares/
│   │   │   └── auth.middleware.ts  # ระบบสิทธิ์, Session Cookies, Scrypt Hash, CSRF
│   │   ├── routes/
│   │   │   ├── ai.routes.ts            # API ผู้ช่วยอัจฉริยะ Smart Assistant
│   │   │   ├── announcements.routes.ts # API จัดการประกาศ, ลงทะเบียน, รับทราบ, Q&A
│   │   │   └── auth.routes.ts          # API เข้าสู่ระบบ, สมัครสมาชิก, Demo Login
│   │   ├── services/
│   │   │   └── realtime.service.ts     # ตัวกระจายข้อมูล WebSocket Broadcast
│   │   └── types/
│   │       └── index.ts    # TypeScript Interface และ Type Definitions
│   ├── database/
│   │   └── data/
│   │       └── announcements.sqlite    # ไฟล์ฐานข้อมูล SQLite จริง (เก็บข้อมูลถาวร)
│   ├── dist/               # โค้ดที่คอมไพล์จาก TypeScript เรียบร้อยแล้ว
│   ├── package.json        # Dependencies และคำสั่ง Scripts
│   ├── server.js           # Entry Point สำหรับความเข้ากันได้ย้อนหลัง (Backward Compatibility)
│   ├── tsconfig.json       # การตั้งค่า TypeScript Compiler (Strict Mode)
│   └── README.md           # เอกสารประกอบของโฟลเดอร์ Backend
└── README.md               # เอกสารภาพรวมของโครงการ (หน้านี้)
```

---

## 🚀 วิธีการติดตั้งและเริ่มใช้งาน (Getting Started)

### ความต้องการของระบบ (Prerequisites)
- **Node.js:** เวอร์ชั่น 22.5.0 หรือใหม่กว่า (แนะนำ Node.js 22 หรือ 24)
- **npm:** ติดตั้งมาพร้อมกับ Node.js

### ขั้นตอนการรันระบบ
1. เปิด Terminal / PowerShell แล้วเข้าไปที่โฟลเดอร์ `project`:
   ```powershell
   cd "c:\Users\kuy bank\Documents\GitHub\CE306-MINIPROJECT\project"
   ```

2. ติดตั้งแพ็กเกจที่จำเป็น (หากยังไม่ได้ติดตั้ง):
   ```powershell
   npm install
   ```

3. ตรวจสอบความถูกต้องของ Types (TypeScript Typecheck):
   ```powershell
   npm run typecheck
   ```

4. เริ่มต้นเซิร์ฟเวอร์:
   * **โหมด Production / มาตรฐาน:**
     ```powershell
     npm start
     ```
   * **โหมด Development (รีสตาร์ทอัตโนมัติเมื่อแก้โค้ด):**
     ```powershell
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
- **สาขาวิชา:** วิศวกรรมคอมพิวเตอร์ คณะวิศวกรรมศาสตร์ มหาวิทยาลัยธุรกิจบัณฑิตย์ (DPU)
- **รายวิชา:** CE 306 โปรแกรมประยุกต์บนเว็บ (Web Applications)
