# Faculty Announcement Hub (CE306 - DPU Smart Campus)

ระบบศูนย์กลางข่าวสารและประกาศอัจฉริยะสำหรับคณะวิศวกรรมศาสตร์ มหาวิทยาลัยธุรกิจบัณฑิตย์ (DPU)  
พัฒนาขึ้นตามมาตรฐานและเครื่องมือสมัยใหม่แบบเดียวกับโปรเจกต์หลัก (Full-stack TypeScript, Express, Socket.io, Real-time WebSockets, SQLite, Scrypt Security)

---

## 🛠️ สถาปัตยกรรมและเทคโนโลยีที่ใช้ (Tech Stack & Architecture)

- **Backend Language & Runtime:** **TypeScript (ES2022 / NodeNext)** + Node.js 22+ / 24+
- **Tooling & Transpiler:** `tsx` (Ultra-fast execution & live reloading) + `tsc` (Strict Typecheck)
- **Web Framework:** Express 5.x
- **Real-time Engine:** **Socket.io (WebSockets)** — อัปเดตข้อมูลแบบทันทีทุกเบราว์เซอร์โดยไม่ต้องโหลดหน้าใหม่
- **Database:** SQLite ผ่าน `node:sqlite` (Zero-config, ข้อมูลไม่สูญหาย บันทึกใน `database/data/announcements.sqlite`)
- **Security & Auth:** Salted `scrypt` password hashing, Secure HTTP-only cookies, Double Submit CSRF protection
- **Frontend:** Vanilla JavaScript (ES6+), HTML5, CSS3 Theme Variables, Quill Rich-text Editor, Dynamic QR Code Generator

---

## 🚀 ฟังก์ชันการทำงานหลัก (Key Features)

1. **ระบบเรียลไทม์เต็มรูปแบบ (Full Real-time Synchronization)**
   - เมื่ออาจารย์สร้าง, แก้ไข หรือลบประกาศ หน้าจอของนักศึกษาทุกคนจะอัปเดตทันที
   - ตัวเลขนับการกด "รับทราบ" (Acknowledgement Count) อัปเดตสดแบบ Real-time
   - จำนวนที่นั่งที่เหลือของกิจกรรม (Seats Available / Taken) อัปเดตสดทันทีที่มีคนลงทะเบียน
   - กระดานถาม-ตอบ (Q&A Comments) อัปเดตข้อความใหม่ทันทีที่อาจารย์หรือนักศึกษาพิมพ์ตอบ
2. **ระบบสิทธิ์ผู้ใช้งาน (Role-based Access Control: Teacher & Student)**
   - **อาจารย์ (Teacher):** สร้างประกาศใหม่, แก้ไขประกาศ, ลบประกาศ, ปักหมุด/ถอดหมุดด่วน, ดูรายชื่อและพิมพ์ใบรายชื่อผู้ลงทะเบียนกิจกรรม, ตอบคำถาม Q&A ในฐานะอาจารย์
   - **นักศึกษา (Student):** ค้นหาประกาศ, คัดกรองตามหมวดหมู่, บันทึกประกาศ (Bookmark), กดยืนยันรับทราบ, ลงทะเบียนกิจกรรมพร้อมรับบัตร QR Code
3. **ระบบบัตรเข้างานอิเล็กทรอนิกส์ (Dynamic QR Code E-Ticket)**
   - สร้าง QR Code SVG แบบไดนามิกทันทีที่นักศึกษาลงทะเบียนกิจกรรม
   - บันทึกชื่อ, อีเมล, รหัสกิจกรรม, และ Ticket Verification Code
   - รองรับการพิมพ์บัตรเข้างาน (Print Ticket)
4. **ผู้ช่วยอัจฉริยะ Smart AI Assistant**
   - ผู้ช่วยแชทบอทอัจฉริยะที่เชื่อมต่อกับฐานข้อมูลประกาศจริง
   - ค้นหาข้อมูลตารางสอบ, ทุนการศึกษา, และกิจกรรม พร้อมปุ่มลัดสำหรับเปิดดูประกาศต้นฉบับได้ทันที
5. **โปรแกรมดูเอกสารแนบในตัว (In-App Document Viewer)**
   - แสดงหน้าเอกสารประกาศทางการของคณะวิศวกรรมศาสตร์ พร้อมตารางกำหนดการ และรองรับการพิมพ์ออกเป็น PDF

---

## 👥 บัญชีตัวอย่างสำหรับทดสอบ (Demo Accounts)

ระบบเตรียมปุ่ม **1-Click Demo Login** บนหน้าต่างเข้าสู่ระบบ เพื่อความสะดวกในการทดสอบทั้งสองบทบาท:

| บทบาท (Role) | อีเมล (Email) | รหัสผ่าน (Password) | คำอธิบาย |
| :--- | :--- | :--- | :--- |
| **อาจารย์ (Teacher)** | `teacher@dpu.ac.th` | `password123` | มีสิทธิ์จัดการประกาศเต็มรูปแบบ + ดูรายชื่อผู้ลงทะเบียน |
| **นักศึกษา (Student)** | `student@dpu.ac.th` | `password123` | รับข่าวสาร, กดรับทราบ, ลงทะเบียนกิจกรรมรับ QR Code |

*(สามารถสมัครสมาชิกใหม่ผ่านหน้าเว็บได้ โดยผู้สมัครใหม่จะได้รับสิทธิ์เป็นนักศึกษา)*

---

## 💻 วิธีการติดตั้งและรันระบบ (How to Run)

จากไดเรกทอรี `project`:

```powershell
# ติดตั้ง dependencies
npm install

# ตรวจสอบ TypeScript Types
npm run typecheck

# เริ่มต้นระบบในโหมด Production/Direct
npm start

# หรือเริ่มในโหมด Development (Live Reloading เมื่อแก้โค้ด)
npm run dev
```

เปิดเว็บเบราว์เซอร์ที่ <http://localhost:3000>

---

## 🔌 รายการ API Endpoints

- `GET /api/health` — สถานะเซิร์ฟเวอร์, ฐานข้อมูล และ Socket.io
- `GET /api/auth/me` — ข้อมูลเซสชันปัจจุบัน
- `POST /api/auth/register` — สมัครสมาชิกนักศึกษาใหม่
- `POST /api/auth/login` — เข้าสู่ระบบด้วยอีเมลและรหัสผ่าน
- `POST /api/auth/demo-login` — เข้าสู่ระบบตัวอย่างแบบ 1 คลิก (teacher / student)
- `POST /api/auth/logout` — ออกจากระบบ
- `GET /api/announcements` — ดึงรายการประกาศทั้งหมด
- `GET /api/announcements/:id` — ดึงรายละเอียดประกาศรายตัว
- `POST /api/announcements` — สร้างประกาศใหม่ (เฉพาะอาจารย์)
- `PUT /api/announcements/:id` — แก้ไขประกาศเดิม (เฉพาะอาจารย์)
- `DELETE /api/announcements/:id` — ลบประกาศ (เฉพาะอาจารย์)
- `PATCH /api/announcements/:id/pin` — ปักหมุด / ถอดหมุดประกาศ (เฉพาะอาจารย์)
- `PUT /api/announcements/:id/acknowledgement` — กดยืนยันหรือยกเลิกการรับทราบ
- `POST /api/announcements/:id/registration` — ลงทะเบียนเข้าร่วมกิจกรรม
- `GET /api/announcements/:id/registrations` — ดูรายชื่อนักศึกษาที่ลงทะเบียน (เฉพาะอาจารย์)
- `GET /api/announcements/:id/ticket` — ดึงข้อมูลตั๋ว QR Code ของผู้ใช้
- `POST /api/announcements/:id/comments` — แสดงความคิดเห็น / ถาม-ตอบ
- `POST /api/ai/ask` — ค้นหาและสอบถามข้อมูลประกาศผ่าน Smart AI Assistant
