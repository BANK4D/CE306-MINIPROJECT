// Faculty Announcement Hub - CE306 DPU Smart Campus
// Client-side Application with Real-time WebSocket Integration

let currentUserRole = 'student';
let activePostId = null;
let csrfToken = '';
let currentUser = null;
let editingPostId = null;
let quill = null;

const CATEGORIES = {
  academic: 'วิชาการ',
  scholarship: 'ทุนการศึกษา',
  activity: 'กิจกรรม',
  general: 'ทั่วไป',
};

const CATEGORY_BANNERS = {
  academic: 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=800&q=80',
  activity: 'https://images.unsplash.com/photo-1531482615713-2afd69097998?auto=format&fit=crop&w=800&q=80',
  scholarship: 'https://images.unsplash.com/photo-1546410531-bb4caa6b424d?auto=format&fit=crop&w=800&q=80',
  general: 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&w=800&q=80',
};

const RICH_TEXT_TAGS = new Set([
  'A', 'B', 'BLOCKQUOTE', 'BR', 'CODE', 'DIV', 'EM', 'H1', 'H2', 'H3',
  'I', 'LI', 'OL', 'P', 'PRE', 'S', 'SPAN', 'STRONG', 'U', 'UL',
]);

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, (char) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  })[char]);
}

function sanitizeRichText(value) {
  const template = document.createElement('template');
  template.innerHTML = value;

  function clean(parent) {
    for (const node of [...parent.childNodes]) {
      if (node.nodeType !== Node.ELEMENT_NODE) {
        if (node.nodeType !== Node.TEXT_NODE) node.remove();
        continue;
      }

      if (!RICH_TEXT_TAGS.has(node.tagName)) {
        node.remove();
        continue;
      }

      const href = node.tagName === 'A' ? node.getAttribute('href') : null;
      for (const attribute of [...node.attributes]) node.removeAttribute(attribute.name);
      if (href) {
        try {
          const url = new URL(href, window.location.origin);
          if (['http:', 'https:', 'mailto:'].includes(url.protocol)) {
            node.setAttribute('href', url.href);
          }
        } catch {
          node.removeAttribute('href');
        }
      }
      clean(node);
    }
  }

  clean(template.content);
  return template.innerHTML;
}

const bookmarkKey = 'faculty-announcement-bookmarks';
const savedBookmarks = localStorage.getItem(bookmarkKey);
let bookmarkedIds = new Set(savedBookmarks ? JSON.parse(savedBookmarks) : ['2']);
let announcements = [];

async function requestApi(path, options = {}) {
  const method = options.method ?? 'GET';
  const headers = { 'Content-Type': 'application/json', ...options.headers };
  if (method !== 'GET' && csrfToken) headers['X-CSRF-Token'] = csrfToken;

  const response = await fetch(path, { ...options, headers });
  const result = await response.json().catch(() => ({}));
  if (!response.ok) {
    if (response.status === 401) showLoginScreen();
    throw new Error(result.error || `เซิร์ฟเวอร์ตอบกลับผิดพลาด (${response.status})`);
  }
  return result;
}

// Web Audio Chime Notification
let soundEnabled = true;
let audioCtx = null;

function getAudioContext() {
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (AudioContextClass) audioCtx = new AudioContextClass();
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

function toggleSoundNotification() {
  soundEnabled = !soundEnabled;
  const btn = document.getElementById('btn-sound-toggle');
  if (btn) {
    btn.innerText = soundEnabled ? '🔔' : '🔕';
    btn.title = soundEnabled ? 'เปิดเสียงแจ้งเตือนประกาศด่วน' : 'ปิดเสียงแจ้งเตือนประกาศด่วน';
  }
  showToast(soundEnabled ? '🔔 เปิดเสียงแจ้งเตือนเรียบร้อยแล้ว' : '🔕 ปิดเสียงแจ้งเตือนแล้ว');
}

function playChime(isUrgent = false) {
  if (!soundEnabled) return;
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    const tones = isUrgent ? [659.25, 880] : [523.25, 659.25];
    tones.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + idx * 0.15);
      gain.gain.setValueAtTime(0, now + idx * 0.15);
      gain.gain.linearRampToValueAtTime(0.18, now + idx * 0.15 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.15 + 0.38);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + idx * 0.15);
      osc.stop(now + idx * 0.15 + 0.4);
    });
  } catch (err) {
    console.warn('Audio chime warning:', err);
  }
}

// Real-time WebSocket Setup
let socket = null;
function setupRealtime() {
  if (typeof io === 'undefined') {
    console.warn('Socket.io library not loaded');
    return;
  }

  socket = io();

  socket.on('connect', () => {
    updateRealtimeStatus(true);
  });

  socket.on('disconnect', () => {
    updateRealtimeStatus(false);
  });

  // Real-time Event: Announcement Created
  socket.on('announcement:created', (newPost) => {
    const exists = announcements.some((a) => a.id === newPost.id);
    if (!exists) {
      newPost.bookmarked = bookmarkedIds.has(String(newPost.id));
      announcements.unshift(newPost);
      renderCards();
      playChime(Boolean(newPost.pinned));
      showToast(`🔔 ประกาศใหม่: ${newPost.title}`);
    }
  });

  // Real-time Event: Announcement Updated
  socket.on('announcement:updated', (updatedPost) => {
    applyAnnouncement(updatedPost);
    if (activePostId === updatedPost.id) {
      openDetailModal(updatedPost.id);
    }
    showToast(`📝 มีการอัปเดตประกาศ: ${updatedPost.title}`);
  });

  // Real-time Event: Announcement Deleted
  socket.on('announcement:deleted', ({ id }) => {
    announcements = announcements.filter((a) => a.id !== id);
    if (activePostId === id) {
      closeModal('detailModal');
    }
    renderCards();
    showToast('🗑️ มีประกาศถูกลบออกจากระบบ');
  });

  // Real-time Event: Acknowledgement Count Changed
  socket.on('announcement:ack', ({ announcementId, ackCount }) => {
    const post = announcements.find((a) => a.id === announcementId);
    if (post) {
      post.ackCount = ackCount;
      renderCards();
    }
  });

  // Real-time Event: Activity Registration Changed
  socket.on('announcement:registered', ({ announcementId, seatsTaken, seatsMax }) => {
    const post = announcements.find((a) => a.id === announcementId);
    if (post) {
      post.seatsTaken = seatsTaken;
      if (seatsMax !== undefined) post.seatsMax = seatsMax;
      renderCards();
    }
  });

  // Real-time Event: Attendance Check-in
  socket.on('attendance:checkedin', (data) => {
    if (activeRosterId === data.announcementId && activeRosterUsers) {
      const u = activeRosterUsers.find((user) => user.id === data.userId);
      if (u) {
        u.checkedIn = data.checkedIn;
        u.checkedInAt = data.checkedInAt;
        renderRosterTable();
      }
    }
    const post = announcements.find((a) => a.id === data.announcementId);
    if (post && data.seatsTaken !== undefined) {
      post.seatsTaken = data.seatsTaken;
      renderCards();
    }
    showToast('🎟️ มีการอัปเดตการเช็คชื่อเข้างานกิจกรรม');
  });

  // Real-time Event: New Comment Added
  socket.on('comment:new', ({ announcementId, comment, updatedAnnouncement }) => {
    const post = announcements.find((a) => a.id === announcementId);
    if (post) {
      if (!post.comments.some((c) => c.id === comment.id)) {
        post.comments.push(comment);
      }
      if (activePostId === announcementId) {
        renderComments(post);
      }
      renderCards();
    }
  });
}

function updateRealtimeStatus(connected) {
  const badge = document.getElementById('realtime-badge');
  const text = document.getElementById('realtime-text');
  if (!badge || !text) return;

  if (connected) {
    badge.style.display = 'inline-flex';
    badge.style.borderColor = 'rgba(52, 211, 153, 0.4)';
    badge.style.color = '#34d399';
    text.innerText = 'เรียลไทม์: ออนไลน์';
  } else {
    badge.style.borderColor = 'rgba(230, 57, 70, 0.4)';
    badge.style.color = '#e63946';
    text.innerText = 'เรียลไทม์: กำลังเชื่อมต่อ...';
  }
}

// Authentication & Session
function showLoginScreen(message = '') {
  currentUser = null;
  csrfToken = '';
  document.getElementById('appShell').inert = true;
  document.getElementById('authScreen').hidden = false;
  const errorBox = document.getElementById('authError');
  errorBox.textContent = message;
  errorBox.hidden = !message;
}

let authMode = 'login';
function setAuthMode(mode) {
  authMode = mode;
  const registering = mode === 'register';
  document.getElementById('authTitle').innerText = registering ? 'สมัครสมาชิก' : 'เข้าสู่ระบบ';
  document.getElementById('authDescription').innerText = registering
    ? 'สร้างบัญชีใหม่เพื่อใช้งานระบบประกาศ'
    : 'เข้าสู่ระบบด้วยอีเมลและรหัสผ่าน';
  document.getElementById('authNameField').hidden = !registering;
  document.getElementById('authName').disabled = !registering;
  document.getElementById('authName').required = registering;
  document.getElementById('authConfirmField').hidden = !registering;
  document.getElementById('authConfirmPassword').disabled = !registering;
  document.getElementById('authConfirmPassword').required = registering;
  document.getElementById('authPassword').autocomplete = registering ? 'new-password' : 'current-password';
  document.getElementById('authSubmit').innerText = registering ? 'สมัครสมาชิก' : 'เข้าสู่ระบบ';
  document.getElementById('authSwitchPrompt').innerText = registering ? 'มีบัญชีแล้ว?' : 'ยังไม่มีบัญชี?';
  document.getElementById('authSwitch').innerText = registering ? 'เข้าสู่ระบบ' : 'สมัครสมาชิก';
  document.getElementById('authError').hidden = true;
}

async function submitAuth(event) {
  event.preventDefault();
  const registering = authMode === 'register';
  const password = document.getElementById('authPassword').value;
  const errorBox = document.getElementById('authError');

  if (registering && password !== document.getElementById('authConfirmPassword').value) {
    errorBox.textContent = 'รหัสผ่านและการยืนยันรหัสผ่านไม่ตรงกัน';
    errorBox.hidden = false;
    return;
  }

  const submitButton = document.getElementById('authSubmit');
  submitButton.disabled = true;
  submitButton.innerText = registering ? 'กำลังสมัครสมาชิก...' : 'กำลังเข้าสู่ระบบ...';

  try {
    const result = await requestApi(registering ? '/api/auth/register' : '/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        ...(registering ? { name: document.getElementById('authName').value } : {}),
        email: document.getElementById('authEmail').value,
        password,
      }),
    });
    await initializeApplication(result.csrfToken);
  } catch (error) {
    console.error(error);
    showLoginScreen(error.message);
  } finally {
    submitButton.disabled = false;
    submitButton.innerText = registering ? 'สมัครสมาชิก' : 'เข้าสู่ระบบ';
  }
}

// 1-Click Demo Login (Teacher / Student)
async function loginDemo(role) {
  try {
    showToast(role === 'teacher' ? 'กำลังเข้าสู่ระบบเป็นอาจารย์...' : 'กำลังเข้าสู่ระบบเป็นนักศึกษา...');
    const result = await requestApi('/api/auth/demo-login', {
      method: 'POST',
      body: JSON.stringify({ role }),
    });
    await initializeApplication(result.csrfToken);
    showToast(`✅ ยินดีต้อนรับ ${role === 'teacher' ? 'อาจารย์' : 'นักศึกษา'}`);
  } catch (error) {
    console.error(error);
    showLoginScreen(error.message);
  }
}

async function logout() {
  try {
    await requestApi('/api/auth/logout', { method: 'POST' });
    announcements = [];
    renderCards();
    showLoginScreen();
  } catch (error) {
    console.error(error);
    showToast(error.message);
  }
}

function updateProfile(user) {
  currentUser = user;
  currentUserRole = user.role;
  document.getElementById('user-name').innerText = user.name;
  const badge = document.getElementById('user-role-badge');
  badge.innerText = user.role === 'teacher' ? 'อาจารย์' : 'นักศึกษา';
  badge.className = `role-badge ${user.role === 'teacher' ? 'role-teacher' : 'role-student'}`;
  document.getElementById('user-avatar').innerText = user.role === 'teacher' ? '💼' : '👨‍💻';
  document.getElementById('admin-actions').style.display = user.role === 'teacher' ? 'block' : 'none';
  document.getElementById('analytics-bar').style.display = user.role === 'teacher' ? 'grid' : 'none';
  document.getElementById('welcome-text').innerHTML =
    user.role === 'teacher'
      ? 'ระบบบริหารจัดการประกาศ <span class="text-gold">สำหรับคณาจารย์ CITE</span>'
      : 'ศูนย์กลางประกาศและกิจกรรม <span class="text-gold">วิศวกรรมคอมพิวเตอร์</span>';
}

async function initializeApplication(sessionCsrfToken = '') {
  const session = await requestApi('/api/auth/me');
  if (!session.authenticated) {
    showLoginScreen();
    return;
  }

  csrfToken = sessionCsrfToken || session.csrfToken;
  updateProfile(session.user);
  document.getElementById('appShell').inert = false;
  document.getElementById('authScreen').hidden = true;
  setupRealtime();
  await loadAnnouncements();
}

document.getElementById('authForm').addEventListener('submit', submitAuth);
document.getElementById('authSwitch').addEventListener('click', () => {
  setAuthMode(authMode === 'login' ? 'register' : 'login');
});

function applyAnnouncement(updated) {
  const previous = announcements.find((item) => item.id === updated.id);
  const merged = {
    ...updated,
    bookmarked: previous?.bookmarked ?? bookmarkedIds.has(String(updated.id)),
  };
  const index = announcements.findIndex((item) => item.id === merged.id);
  if (index === -1) announcements.unshift(merged);
  else announcements[index] = merged;
  renderCards();
  return merged;
}

async function loadAnnouncements() {
  const records = await requestApi('/api/announcements');
  announcements = records.map((item) => ({
    ...item,
    bookmarked: bookmarkedIds.has(String(item.id)),
  }));
  renderCards();
}

let currentFilter = 'all';
let searchQuery = '';
let sortOrder = 'newest';
let showBookmarksOnly = false;
let showMyEventsOnly = false;

function updateAnalytics() {
  document.getElementById('stat-total').innerText = announcements.length;
  const totalAck = announcements.reduce((sum, a) => sum + a.ackCount, 0);
  const totalReg = announcements.reduce((sum, a) => sum + (a.seatsTaken || 0), 0);
  const totalQa = announcements.reduce((sum, a) => sum + (a.comments?.length || 0), 0);
  document.getElementById('stat-ack').innerText = `${totalAck} ครั้ง`;
  document.getElementById('stat-reg').innerText = `${totalReg} คน`;
  document.getElementById('stat-qa').innerText = `${totalQa} รายการ`;
}

function renderCards() {
  updateAnalytics();
  const grid = document.getElementById('announcement-grid');
  let filtered = announcements.filter((a) => {
    const matchRole = currentUserRole === 'teacher' ? true : a.target === 'all' || a.target === 'student';
    const matchCat = currentFilter === 'all' || a.category === currentFilter;
    const matchSearch =
      a.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.aiSummary.toLowerCase().includes(searchQuery.toLowerCase());
    const matchBook = showBookmarksOnly ? a.bookmarked : true;
    const matchMyEvents = showMyEventsOnly ? Boolean(a.registered && a.category === 'activity') : true;
    return matchRole && matchCat && matchSearch && matchBook && matchMyEvents;
  });

  filtered.sort((a, b) => {
    if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
    if (sortOrder === 'popular') return b.ackCount - a.ackCount;
    return sortOrder === 'newest'
      ? new Date(b.date).getTime() - new Date(a.date).getTime()
      : new Date(a.date).getTime() - new Date(b.date).getTime();
  });

  if (filtered.length === 0) {
    grid.innerHTML = `
      <div style="grid-column: 1/-1; text-align: center; padding: 40px; color: var(--text-muted); background: var(--surface-color); border-radius: 18px; border: 1px dashed var(--border-line);">
        <div style="font-size: 2.2rem; margin-bottom: 8px;">📭</div>
        <strong>ไม่พบประกาศในเงื่อนไขที่เลือก</strong>
        <p style="font-size: 0.85rem; margin-top: 4px;">ลองเปลี่ยนหมวดหมู่หรือคำค้นหาด้านบน</p>
      </div>
    `;
    return;
  }

  grid.innerHTML = filtered
    .map((item) => {
      let roleTag = '';
      if (currentUserRole === 'teacher') {
        roleTag =
          item.target === 'teacher'
            ? '<span class="badge badge-target-teacher">💼 เฉพาะอาจารย์</span>'
            : item.target === 'student'
            ? '<span class="badge badge-target-student">👨‍🎓 นักศึกษา</span>'
            : '<span class="badge badge-cat">🌐 ทุกคน</span>';
      }

      // Teacher controls on card
      let teacherActions = '';
      if (currentUserRole === 'teacher') {
        teacherActions = `
          <div class="teacher-card-actions">
            <button class="btn-teacher-action" onclick="openEditModal(${item.id})">✏️ แก้ไข</button>
            <button class="btn-teacher-action" onclick="togglePinAnnouncement(${item.id})">
              ${item.pinned ? '📌 ถอดหมุด' : '📍 ปักหมุด'}
            </button>
            ${
              item.category === 'activity'
                ? `<button class="btn-teacher-action" onclick="openRosterModal(${item.id})">👥 รายชื่อ (${item.seatsTaken || 0})</button>`
                : ''
            }
            <button class="btn-teacher-action btn-teacher-delete" onclick="deleteAnnouncement(${item.id})">🗑️ ลบ</button>
          </div>
        `;
      }

      // Category visual banner and badges
      const bannerImg = CATEGORY_BANNERS[item.category] || CATEGORY_BANNERS.academic;
      const catClass = `badge-${item.category}`;

      // Seat Progress for Activity
      let seatProgressBar = '';
      if (item.category === 'activity' && item.seatsMax) {
        const taken = item.seatsTaken || 0;
        const max = item.seatsMax;
        const percent = Math.min(100, Math.round((taken / max) * 100));
        const remaining = Math.max(0, max - taken);
        seatProgressBar = `
          <div class="seat-progress-container">
            <div class="seat-progress-labels">
              <span>โควตาที่นั่งกิจกรรม</span>
              <span style="color:var(--primary); font-weight:700;">${taken} / ${max} ที่นั่ง (${remaining > 0 ? `เหลือ ${remaining} ที่นั่ง` : 'เต็มแล้ว'})</span>
            </div>
            <div class="seat-progress-bar">
              <div class="seat-progress-fill" style="width: ${percent}%;"></div>
            </div>
          </div>
        `;
      }

      return `
      <div class="card ${item.pinned ? 'pinned' : ''}">
        <div class="card-banner" style="background-image: url('${bannerImg}');">
          <div class="card-banner-badges">
            <span class="badge ${catClass}">${CATEGORIES[item.category] || item.category}</span>
            ${roleTag}
            ${item.pinned ? '<span class="badge badge-pinned">📌 ด่วน</span>' : ''}
          </div>
          <span class="card-date-badge">
            📅 ${new Date(item.date).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: '2-digit' })}
          </span>
        </div>

        <div class="card-body">
          <h3 class="card-title" onclick="openDetailModal(${item.id})">${escapeHtml(item.title)}</h3>

          <div class="highlights-box">
            <div class="highlights-header">
              <span>📌</span> <span>ประเด็นสำคัญประจำประกาศ:</span>
            </div>
            ${escapeHtml(item.aiSummary)}
          </div>

          <div class="card-text">${sanitizeRichText(item.content)}</div>

          ${seatProgressBar}

          <div class="feature-chips">
            <button class="chip-btn ${item.acknowledged ? 'ack-done' : ''}" onclick="toggleAck(${item.id})">
              ${item.acknowledged ? '✅ รับทราบแล้ว' : '☑️ กดรับทราบ'} (${item.ackCount})
            </button>

            ${
              item.category === 'activity'
                ? `
              <button class="chip-btn" style="border-color:var(--primary); color:var(--primary);" onclick="registerEvent(${item.id})">
                🎟️ ${item.registered ? 'ดูบัตร QR เข้างาน' : 'ลงทะเบียน'} (${item.seatsTaken || 0}/${item.seatsMax ?? 'ไม่จำกัด'})
              </button>
            `
                : ''
            }

            ${
              item.hasPdf
                ? `
              <button class="chip-btn" onclick="openPdfModalFor(${item.id})">📄 ดูเอกสารแนบ</button>
            `
                : ''
            }

            ${
              item.eventDate
                ? `
              <button class="chip-btn" onclick="addToCalendarFor(${item.id})">📅 เพิ่มลงปฏิทิน</button>
            `
                : ''
            }
          </div>

          <div class="card-footer">
            <span class="btn-qa-read" onclick="openDetailModal(${item.id})">
              💬 ถาม-ตอบ (${item.comments ? item.comments.length : 0}) • อ่านฉบับเต็ม
            </span>
            <div class="card-action-icons">
              <button class="icon-btn" onclick="shareAnnouncement(${item.id})" title="คัดลอกลิงก์">🔗</button>
              <button class="icon-btn ${item.bookmarked ? 'bookmarked' : ''}" onclick="toggleBookmark(${item.id})" title="บันทึก">
                ${item.bookmarked ? '⭐️' : '☆'}
              </button>
            </div>
          </div>

          ${teacherActions}
        </div>
      </div>`;
    })
    .join('');
}

// Acknowledgement
async function toggleAck(id) {
  const post = announcements.find((a) => a.id === id);
  if (!post) return;
  const acknowledged = !post.acknowledged;

  try {
    const updated = await requestApi(`/api/announcements/${id}/acknowledgement`, {
      method: 'PUT',
      body: JSON.stringify({ acknowledged }),
    });
    applyAnnouncement(updated);
    showToast(acknowledged ? '✅ ยืนยันการรับทราบประกาศแล้ว' : 'ยกเลิกสถานะรับทราบ');
  } catch (error) {
    console.error(error);
    showToast(error.message);
  }
}

// Activity Registration & QR Code
async function registerEvent(id) {
  const post = announcements.find((a) => a.id === id);
  if (!post) return;
  const wasRegistered = post.registered;

  try {
    const updated = await requestApi(`/api/announcements/${id}/registration`, {
      method: 'POST',
      body: JSON.stringify({}),
    });
    applyAnnouncement(updated);

    if (!wasRegistered) {
      showToast('🎉 ลงทะเบียนสำเร็จ! ระบบสร้างบัตร QR Code สำหรับคุณแล้ว');
    }

    // Display QR Modal
    await displayTicketModal(post);
  } catch (error) {
    console.error(error);
    showToast(error.message);
  }
}

async function displayTicketModal(post) {
  document.getElementById('qrEventTitle').innerText = post.title;
  document.getElementById('qrUserName').innerText = currentUser ? `${currentUser.name} (${currentUser.email})` : 'นักศึกษา DPU';

  let ticketId = `DPU-ACT-${post.id}-${currentUser ? currentUser.id.slice(0, 8).toUpperCase() : 'PASS'}`;
  try {
    const ticketData = await requestApi(`/api/announcements/${post.id}/ticket`);
    if (ticketData?.ticketId) ticketId = ticketData.ticketId;
  } catch {}

  document.getElementById('qrTicketId').innerText = ticketId;

  // Render high-quality dynamic SVG QR code
  renderDynamicQRCode('qrCodeContainer', ticketId);
  document.getElementById('qrModal').style.display = 'grid';
}

// Dynamic SVG QR Code Generator
function renderDynamicQRCode(containerId, dataString) {
  const container = document.getElementById(containerId);
  if (!container) return;

  // Generate pseudo-random deterministic matrix pattern based on dataString
  let hash = 0;
  for (let i = 0; i < dataString.length; i++) {
    hash = (hash << 5) - hash + dataString.charCodeAt(i);
    hash |= 0;
  }

  const size = 21;
  const matrix = Array.from({ length: size }, () => Array(size).fill(0));

  // Position detection patterns (corners)
  function drawCorner(startX, startY) {
    for (let r = 0; r < 7; r++) {
      for (let c = 0; c < 7; c++) {
        if (r === 0 || r === 6 || c === 0 || c === 6 || (r >= 2 && r <= 4 && c >= 2 && c <= 4)) {
          matrix[startY + r][startX + c] = 1;
        }
      }
    }
  }

  drawCorner(0, 0);
  drawCorner(size - 7, 0);
  drawCorner(0, size - 7);

  // Timing patterns
  for (let i = 8; i < size - 8; i++) {
    matrix[6][i] = i % 2 === 0 ? 1 : 0;
    matrix[i][6] = i % 2 === 0 ? 1 : 0;
  }

  // Fill data cells deterministically
  let seed = Math.abs(hash);
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (matrix[r][c] === 0 && !(r < 8 && c < 8) && !(r < 8 && c >= size - 8) && !(r >= size - 8 && c < 8)) {
        seed = (seed * 9301 + 49297) % 233280;
        matrix[r][c] = seed / 233280 > 0.5 ? 1 : 0;
      }
    }
  }

  // Generate SVG elements
  const cellSize = 7;
  const svgSize = size * cellSize;
  let rects = '';
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (matrix[r][c] === 1) {
        rects += `<rect x="${c * cellSize}" y="${r * cellSize}" width="${cellSize}" height="${cellSize}" fill="#08152f"/>`;
      }
    }
  }

  container.innerHTML = `
    <svg width="160" height="160" viewBox="0 0 ${svgSize} ${svgSize}" style="border-radius:8px;">
      <rect width="100%" height="100%" fill="#ffffff"/>
      ${rects}
      <!-- Center branding logo -->
      <circle cx="${svgSize / 2}" cy="${svgSize / 2}" r="14" fill="#ffffff" stroke="#2d78d4" stroke-width="2"/>
      <text x="${svgSize / 2}" y="${svgSize / 2 + 4}" text-anchor="middle" font-size="9" font-weight="bold" fill="#2d78d4">DPU</text>
    </svg>
  `;
}

function printTicket() {
  window.print();
}

// PDF Document Viewer
function openPdfModalFor(id) {
  const post = announcements.find((item) => item.id === id);
  if (!post) return;

  document.getElementById('pdfDocTitle').innerText = post.title;
  document.getElementById('docCategoryBadge').innerText = CATEGORIES[post.category] || post.category;
  document.getElementById('pdfDocDate').innerText = `ประกาศเมื่อวันที่: ${new Date(post.date).toLocaleDateString('th-TH', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })}`;
  document.getElementById('pdfDocBody').innerHTML = sanitizeRichText(post.content);

  document.getElementById('pdfModal').style.display = 'grid';
}

// Calendar Integration
function addToCalendarFor(id) {
  const post = announcements.find((item) => item.id === id);
  if (!post?.eventDate) return;
  const url = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(
    '[DPU] ' + post.title
  )}&dates=${post.eventDate}&details=${encodeURIComponent(post.aiSummary)}`;
  window.open(url, '_blank');
  showToast('📅 บันทึกกำหนดการลง Google Calendar เรียบร้อยแล้ว');
}

// Details & Comments
function openDetailModal(id) {
  activePostId = id;
  const post = announcements.find((a) => a.id === id);
  if (!post) return;

  document.getElementById('detailContent').innerHTML = `
    <div style="display:flex; gap:6px; margin-bottom:8px;">
      <span class="badge badge-cat">${CATEGORIES[post.category]}</span>
      ${post.pinned ? '<span class="badge badge-pinned">📌 ด่วน</span>' : ''}
    </div>
    <h2 style="margin:4px 0 10px;">${escapeHtml(post.title)}</h2>
    <div class="ai-box"><strong>✨ AI สรุปประเด็นสำคัญ:</strong> ${escapeHtml(post.aiSummary)}</div>
    <div style="margin:14px 0; line-height:1.7;">${sanitizeRichText(post.content)}</div>
  `;
  renderComments(post);
  document.getElementById('detailModal').style.display = 'grid';
}

function renderComments(post) {
  const box = document.getElementById('commentSection');
  if (!post.comments || post.comments.length === 0) {
    box.innerHTML = `<div style="color:var(--text-muted); font-size:0.84rem;">ยังไม่มีคำถามในประกาศนี้ สามารถพิมพ์สอบถามอาจารย์ได้ที่กล่องด้านล่าง</div>`;
    return;
  }
  box.innerHTML =
    `<strong>💬 กระดานถาม-ตอบ (${post.comments.length})</strong>` +
    post.comments
      .map(
        (c) => `
      <div class="comment-item ${c.isTeacher ? 'teacher-reply' : ''}">
        <div style="display:flex; justify-content:space-between;">
          <strong style="color:${c.isTeacher ? 'var(--teacher)' : 'var(--primary)'};">
            ${c.isTeacher ? '💼 ' : '👤 '}${escapeHtml(c.author)}:
          </strong>
          <small style="color:var(--text-muted); font-size:0.7rem;">
            ${new Date(c.createdAt || Date.now()).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })}
          </small>
        </div>
        <div style="margin-top:3px;">${escapeHtml(c.text)}</div>
      </div>
    `
      )
      .join('');
}

async function addComment() {
  const input = document.getElementById('commentInput');
  const text = input.value.trim();
  if (!text || !activePostId) return;

  try {
    const updated = await requestApi(`/api/announcements/${activePostId}/comments`, {
      method: 'POST',
      body: JSON.stringify({ text }),
    });
    const post = applyAnnouncement(updated);
    input.value = '';
    renderComments(post);
    showToast('💬 ส่งข้อความลงในกระดานถาม-ตอบแล้ว');
  } catch (error) {
    console.error(error);
    showToast(error.message);
  }
}

// Teacher Management: Create / Edit / Delete / Pin
function openAdminModal() {
  editingPostId = null;
  document.getElementById('adminModalTitle').innerText = '📝 สร้างประกาศใหม่';
  document.getElementById('btnSubmitPost').innerText = 'เผยแพร่ประกาศ';
  document.getElementById('postTitle').value = '';
  document.getElementById('postAiSummary').value = '';
  document.getElementById('postCategory').value = 'academic';
  document.getElementById('postTarget').value = 'all';
  document.getElementById('isPinned').checked = false;
  document.getElementById('hasAttachment').checked = true;
  document.getElementById('postSeatsMax').value = '50';
  document.getElementById('postEventDate').value = '';
  handleCategoryChange();

  if (!quill) quill = new Quill('#editor', { theme: 'snow' });
  quill.root.innerHTML = '';
  document.getElementById('adminModal').style.display = 'grid';
}

function openEditModal(id) {
  const post = announcements.find((a) => a.id === id);
  if (!post) return;

  editingPostId = id;
  document.getElementById('adminModalTitle').innerText = '✏️ แก้ไขประกาศ';
  document.getElementById('btnSubmitPost').innerText = 'บันทึกการแก้ไข';
  document.getElementById('postTitle').value = post.title;
  document.getElementById('postAiSummary').value = post.aiSummary;
  document.getElementById('postCategory').value = post.category;
  document.getElementById('postTarget').value = post.target;
  document.getElementById('isPinned').checked = Boolean(post.pinned);
  document.getElementById('hasAttachment').checked = Boolean(post.hasPdf);
  document.getElementById('postSeatsMax').value = post.seatsMax ?? 50;
  document.getElementById('postEventDate').value = post.eventDate ?? '';
  handleCategoryChange();

  if (!quill) quill = new Quill('#editor', { theme: 'snow' });
  quill.root.innerHTML = post.content || '';
  document.getElementById('adminModal').style.display = 'grid';
}

function handleCategoryChange() {
  const cat = document.getElementById('postCategory').value;
  const row = document.getElementById('activityOptionsRow');
  if (row) {
    row.style.display = cat === 'activity' ? 'flex' : 'none';
  }
}

async function submitAnnouncement() {
  const title = document.getElementById('postTitle').value.trim();
  if (!title) return alert('กรุณาระบุหัวข้อประกาศ');
  const cat = document.getElementById('postCategory').value;
  const aiSum =
    document.getElementById('postAiSummary').value.trim() ||
    `สรุปอัตโนมัติ: ${title} (กรุณาอ่านรายละเอียดเพิ่มเติมด้านล่าง)`;

  const payload = {
    title,
    aiSummary: aiSum,
    content: quill ? quill.root.innerHTML : '',
    category: cat,
    target: document.getElementById('postTarget').value,
    pinned: document.getElementById('isPinned').checked,
    hasPdf: document.getElementById('hasAttachment').checked,
    seatsMax: cat === 'activity' ? Number(document.getElementById('postSeatsMax').value) || 50 : null,
    eventDate: document.getElementById('postEventDate').value.trim() || null,
  };

  try {
    if (editingPostId) {
      const updated = await requestApi(`/api/announcements/${editingPostId}`, {
        method: 'PUT',
        body: JSON.stringify(payload),
      });
      applyAnnouncement(updated);
      showToast('✅ แก้ไขประกาศเรียบร้อยแล้ว');
    } else {
      const created = await requestApi('/api/announcements', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      applyAnnouncement(created);
      showToast('✅ เผยแพร่ประกาศใหม่เรียบร้อยแล้ว');
    }
    closeModal('adminModal');
  } catch (error) {
    console.error(error);
    showToast(error.message);
  }
}

async function deleteAnnouncement(id) {
  if (!confirm('คุณแน่ใจหรือไม่ว่าต้องการลบประกาศนี้?')) return;
  try {
    await requestApi(`/api/announcements/${id}`, { method: 'DELETE' });
    announcements = announcements.filter((a) => a.id !== id);
    renderCards();
    showToast('🗑️ ลบประกาศเรียบร้อยแล้ว');
  } catch (error) {
    console.error(error);
    showToast(error.message);
  }
}

async function togglePinAnnouncement(id) {
  try {
    const updated = await requestApi(`/api/announcements/${id}/pin`, { method: 'PATCH' });
    applyAnnouncement(updated);
    showToast(updated.pinned ? '📌 ปักหมุดประกาศแล้ว' : 'ยกเลิกการปักหมุดแล้ว');
  } catch (error) {
    console.error(error);
    showToast(error.message);
  }
}

// Attendee Roster Modal for Teachers
async function openRosterModal(id) {
  const post = announcements.find((a) => a.id === id);
  if (!post) return;

  document.getElementById('rosterEventTitle').innerText = post.title;
  const content = document.getElementById('rosterContent');
  content.innerHTML = '<div style="padding:20px; text-align:center;">กำลังโหลดรายชื่อ...</div>';
  document.getElementById('rosterModal').style.display = 'grid';

  try {
    const data = await requestApi(`/api/announcements/${id}/registrations`);
    const users = data.registeredUsers || [];
    document.getElementById('rosterTotalCount').innerText = `รวมผู้ลงทะเบียน: ${users.length} คน (จากที่นั่ง ${post.seatsMax || 'ไม่จำกัด'})`;

    if (users.length === 0) {
      content.innerHTML = '<div style="padding:20px; text-align:center; color:var(--text-muted);">ยังไม่มีผู้ลงทะเบียนในกิจกรรมนี้</div>';
      return;
    }

    content.innerHTML = `
      <table class="roster-table">
        <thead>
          <tr>
            <th>#</th>
            <th>ชื่อ - นามสกุล</th>
            <th>อีเมล</th>
            <th>เวลาที่ลงทะเบียน</th>
            <th>สถานะ</th>
          </tr>
        </thead>
        <tbody>
          ${users
            .map(
              (u, index) => `
            <tr>
              <td>${index + 1}</td>
              <td><strong>${escapeHtml(u.name)}</strong></td>
              <td>${escapeHtml(u.email)}</td>
              <td>${new Date(u.registeredAt).toLocaleString('th-TH')}</td>
              <td><span style="color:var(--success); font-weight:bold;">✅ สิทธิ์ Verified</span></td>
            </tr>
          `
            )
            .join('')}
        </tbody>
      </table>
    `;
  } catch (error) {
    content.innerHTML = `<div style="color:var(--danger); padding:20px;">เกิดข้อผิดพลาด: ${error.message}</div>`;
  }
}

function printRoster() {
  window.print();
}

// Smart AI Assistant
function toggleChat() {
  const win = document.getElementById('chatbotWindow');
  win.style.display = win.style.display === 'flex' ? 'none' : 'flex';
}

function askBot(q) {
  document.getElementById('chatInput').value = q;
  sendChat();
}

async function sendChat() {
  const input = document.getElementById('chatInput');
  const q = input.value.trim();
  if (!q) return;

  const body = document.getElementById('chatBody');
  body.innerHTML += `<div class="chat-msg user">${escapeHtml(q)}</div>`;
  input.value = '';
  body.scrollTop = body.scrollHeight;

  // Add thinking indicator
  const thinkingId = 'thinking-' + Date.now();
  body.innerHTML += `<div class="chat-msg bot" id="${thinkingId}">🤖 กำลังค้นหาข้อมูลจากฐานข้อมูลประกาศ...</div>`;
  body.scrollTop = body.scrollHeight;

  try {
    const result = await requestApi('/api/ai/ask', {
      method: 'POST',
      body: JSON.stringify({ query: q }),
    });

    const thinkingEl = document.getElementById(thinkingId);
    let replyHtml = `<div style="line-height:1.5;">${escapeHtml(result.answer).replace(/\n/g, '<br>')}</div>`;

    if (result.matches && result.matches.length > 0) {
      replyHtml += `
        <div style="margin-top:8px; padding-top:6px; border-top:1px dashed var(--border-line);">
          <small style="color:var(--text-muted); display:block; margin-bottom:4px;">ประกาศที่เกี่ยวข้อง:</small>
          ${result.matches
            .map(
              (m) => `
            <button class="chip-btn" style="margin-bottom:4px; width:100%; justify-content:flex-start; text-align:left;" onclick="openDetailModal(${m.id})">
              📌 ${escapeHtml(m.title)}
            </button>
          `
            )
            .join('')}
        </div>
      `;
    }

    if (thinkingEl) {
      thinkingEl.innerHTML = replyHtml;
    }
  } catch (error) {
    const thinkingEl = document.getElementById(thinkingId);
    if (thinkingEl) thinkingEl.innerText = `ขออภัย เกิดข้อผิดพลาดในการค้นหา: ${error.message}`;
  }
  body.scrollTop = body.scrollHeight;
}

// Filter, Search, Bookmarks, Darkmode
document.querySelectorAll('.filter-btn').forEach((btn) => {
  btn.addEventListener('click', (e) => {
    document.querySelectorAll('.filter-btn').forEach((b) => b.classList.remove('active'));
    e.target.classList.add('active');
    currentFilter = e.target.dataset.cat;
    renderCards();
  });
});

function handleSearch() {
  searchQuery = document.getElementById('searchInput').value;
  renderCards();
}

function handleSort() {
  sortOrder = document.getElementById('sortSelect').value;
  renderCards();
}

function toggleViewBookmarks() {
  showBookmarksOnly = !showBookmarksOnly;
  document.getElementById('btn-bookmarks').classList.toggle('active', showBookmarksOnly);
  renderCards();
}

function toggleBookmark(id) {
  const item = announcements.find((a) => a.id === id);
  if (item) {
    item.bookmarked = !item.bookmarked;
    if (item.bookmarked) bookmarkedIds.add(String(id));
    else bookmarkedIds.delete(String(id));
    localStorage.setItem(bookmarkKey, JSON.stringify([...bookmarkedIds]));
    renderCards();
    showToast(item.bookmarked ? '⭐️ เพิ่มในรายการที่บันทึกไว้แล้ว' : 'นำออกจากรายการบันทึกแล้ว');
  }
}

function shareAnnouncement(id) {
  const url = `${window.location.origin}/#announcement-${id}`;
  if (navigator.clipboard) {
    navigator.clipboard.writeText(url);
  }
  showToast('🔗 คัดลอกลิงก์ประกาศลงคลิปบอร์ดแล้ว!');
}

function closeModal(id) {
  document.getElementById(id).style.display = 'none';
}

let isDark = false;
function toggleDarkMode() {
  isDark = !isDark;
  document.body.setAttribute('data-theme', isDark ? 'dark' : 'light');
}

let toastTimer;
function showToast(msg) {
  const t = document.getElementById('toastBox');
  t.innerText = msg;
  t.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove('show'), 3200);
}

// Global exposure for inline HTML events
window.loginDemo = loginDemo;
window.logout = logout;
window.toggleAck = toggleAck;
window.registerEvent = registerEvent;
window.openDetailModal = openDetailModal;
window.openPdfModalFor = openPdfModalFor;
window.addToCalendarFor = addToCalendarFor;
window.addComment = addComment;
window.toggleChat = toggleChat;
window.askBot = askBot;
window.sendChat = sendChat;
window.openAdminModal = openAdminModal;
window.openEditModal = openEditModal;
window.deleteAnnouncement = deleteAnnouncement;
window.togglePinAnnouncement = togglePinAnnouncement;
window.openRosterModal = openRosterModal;
window.printRoster = printRoster;
window.printTicket = printTicket;
window.closeModal = closeModal;
window.toggleDarkMode = toggleDarkMode;
window.toggleViewBookmarks = toggleViewBookmarks;
window.toggleBookmark = toggleBookmark;
window.shareAnnouncement = shareAnnouncement;
window.handleSearch = handleSearch;
window.handleSort = handleSort;
window.handleCategoryChange = handleCategoryChange;
window.submitAnnouncement = submitAnnouncement;

// Initialize
initializeApplication().catch((error) => {
  console.error(error);
  showLoginScreen(`เริ่มต้นระบบไม่สำเร็จ: ${error.message}`);
});
