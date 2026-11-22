# Faculty Announcement Hub (CE306 - DPU CITE Smart Campus)

ระบบศูนย์กลางข่าวสารและบริหารกิจกรรมอัจฉริยะสำหรับคณะวิศวกรรมศาสตร์ มหาวิทยาลัยธุรกิจบัณฑิตย์ (DPU)  
พัฒนาขึ้นตามมาตรฐานและเครื่องมือระดับโปรดักชัน (Full-stack TypeScript, Express, Socket.io WebSockets, SQLite, Scrypt Security)

---

## 🛠️ สถาปัตยกรรมและเทคโนโลยีที่ใช้ (Tech Stack & Architecture)

- **Backend Language & Runtime:** **TypeScript (ES2022 / NodeNext)** + Node.js 22+ / 24+
- **Tooling & Transpiler:** `tsx` (Live execution & dev watching) + `tsc` (Strict Typecheck & build)
- **Web Framework:** Express 5.x
- **Real-time Engine:** **Socket.io (WebSockets)** — อัปเดตข้อมูลแบบทันทีทุกเบราว์เซอร์โดยไม่ต้องโหลดหน้าใหม่
- **Database:** SQLite ผ่าน `node:sqlite` (Zero-config, ข้อมูลไม่สูญหาย บันทึกใน `database/data/announcements.sqlite`)
- **Security & Auth:** Salted `scrypt` password hashing, Secure HTTP-only cookies, Double Submit CSRF protection
- **Frontend Design System:** Google Fonts (`Prompt` & `Sarabun`), DPU Royal Purple, CITE Cyber Blue, Heritage Gold, Quill Rich-text Editor, Dynamic SVG QR Code E-Ticket Generator

---

## 🚀 ฟังก์ชันการทำงานหลัก (Key Features)

1. **ระบบเรียลไทม์เต็มรูปแบบ (Full Real-time Synchronization)**
   - เมื่ออาจารย์สร้าง, แก้ไข หรือลบประกาศ หน้าจอของนักศึกษาทุกคนจะอัปเดตทันที
   - ตัวเลขนับการกด "รับทราบ" (Acknowledgement Count) อัปเดตสดแบบ Real-time
   - จำนวนที่นั่งที่เหลือของกิจกรรม (Seats Available / Taken) พร้อมแถบ Progress Bar อัปเดตสดทันทีที่มีคนลงทะเบียน
   - กระดานถาม-ตอบ (Q&A Comments) อัปเดตข้อความใหม่ทันทีที่อาจารย์หรือนักศึกษาพิมพ์ตอบ
2. **ระบบสิทธิ์ผู้ใช้งาน (Role-based Access Control: Teacher & Student)**
   - **อาจารย์ (Teacher):** สร้างประกาศใหม่, แก้ไขประกาศ, ลบประกาศ, ปักหมุด/ถอดหมุดด่วน, ดูรายชื่อและพิมพ์ใบรายชื่อผู้ลงทะเบียนกิจกรรม, ตอบคำถาม Q&A ในฐานะอาจารย์
   - **นักศึกษา (Student):** ค้นหาประกาศ, คัดกรองตามหมวดหมู่, บันทึกประกาศ (Bookmark), กดยืนยันรับทราบ, ลงทะเบียนกิจกรรมพร้อมรับบัตร QR Code
3. **ระบบบัตรเข้างานอิเล็กทรอนิกส์ (Dynamic QR Code E-Ticket)**
   - สร้าง QR Code SVG แบบไดนามิกทันทีที่นักศึกษาลงทะเบียนกิจกรรม
   - มีลายน้ำ DPU โลโก้ตรงกลาง QR Code บันทึกชื่อ, อีเมล, รหัสกิจกรรม, และ Ticket Verification Code
   - รองรับการพิมพ์บัตรเข้างาน (Print Ticket)
4. **ผู้ช่วยอัจฉริยะ Smart AI Assistant (`/api/ai/ask`)**
   - ผู้ช่วยแชทบอทอัจฉริยะที่เชื่อมต่อกับฐานข้อมูลประกาศจริง
   - ค้นหาข้อมูลตารางสอบ, ทุนการศึกษา, และกิจกรรม พร้อมปุ่มลัดสำหรับเปิดดูประกาศต้นฉบับได้ทันที
5. **โปรแกรมดูเอกสารแนบทางการ (In-App Document Viewer)**
   - แสดงหน้าเอกสารประกาศทางการของคณะวิศวกรรมศาสตร์ ม.ธุรกิจบัณฑิตย์ พร้อมตารางกำหนดการ และรองรับการพิมพ์ออกเป็น PDF

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

## ⚙️ การตั้งค่า (Configuration)

คัดลอก `.env.example` เป็น `.env` เพื่อกำหนดค่า (ไม่บังคับ):

| ตัวแปร | ค่าเริ่มต้น | คำอธิบาย |
| :--- | :--- | :--- |
| `PORT` | `3000` | พอร์ตของเซิร์ฟเวอร์ |
| `HOST` | `127.0.0.1` | ที่อยู่ที่เซิร์ฟเวอร์ผูก (bind) |
| `DATABASE_PATH` | `database/data/announcements.sqlite` | ตำแหน่งไฟล์ฐานข้อมูล (ฐานข้อมูลและข้อมูลตัวอย่างถูกสร้างอัตโนมัติเมื่อรันครั้งแรก) |
| `UPLOADS_PATH` | `database/uploads` | โฟลเดอร์เก็บไฟล์แนบ |

## 🧱 โครงสร้าง `src/`

`server.ts` (entry) → `app.ts` (Express) → `routes/` (auth, announcements, ai) → `database/db.ts` (SQLite) · `middlewares/` (auth/CSRF) · `services/realtime.service.ts` (Socket.io)
