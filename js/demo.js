let currentUserRole = 'student';
    let activePostId = null;
    let csrfToken = '';
    let currentUser = null;
    const CATEGORIES = { academic: 'วิชาการ', scholarship: 'ทุนการศึกษา', activity: 'กิจกรรม', general: 'ทั่วไป' };
const RICH_TEXT_TAGS = new Set([
  'A', 'B', 'BLOCKQUOTE', 'BR', 'CODE', 'DIV', 'EM', 'H1', 'H2', 'H3',
  'I', 'LI', 'OL', 'P', 'PRE', 'S', 'SPAN', 'STRONG', 'U', 'UL',
]);

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, character => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  })[character]);
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
      const response = await fetch(path, {
        ...options,
        headers,
      });
      const result = await response.json();
      if (!response.ok) {
        if (response.status === 401) showLoginScreen();
        throw new Error(result.error || 'เชื่อมต่อเซิร์ฟเวอร์ไม่สำเร็จ');
      }
      return result;
    }

    function showLoginScreen(message = '') {
      currentUser = null;
      csrfToken = '';
      document.getElementById('appShell').inert = true;
      document.getElementById('authScreen').hidden = false;
      const errorBox = document.getElementById('authError');
      errorBox.textContent = message;
      errorBox.hidden = !message;
    }

    async function loginWithDemo(role) {
      try {
        const result = await requestApi('/api/auth/demo', {
          method: 'POST',
          body: JSON.stringify({ role }),
        });
        await initializeApplication(result.csrfToken);
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
      document.getElementById('welcome-text').innerHTML = user.role === 'teacher'
        ? 'ระบบบริหารจัดการประกาศ <span class="text-gradient">สำหรับอาจารย์</span>'
        : 'ศูนย์กลางประกาศ <span class="text-gradient">สำหรับนักศึกษา</span>';
    }

    async function initializeApplication(sessionCsrfToken = '') {
      const config = await requestApi('/api/auth/config');
      document.getElementById('demoLoginOptions').hidden = !config.demoEnabled;

      const session = await requestApi('/api/auth/me');
      if (!session.authenticated) {
        showLoginScreen();
        return;
      }

      csrfToken = sessionCsrfToken || session.csrfToken;
      updateProfile(session.user);
      document.getElementById('appShell').inert = false;
      document.getElementById('authScreen').hidden = true;
      await loadAnnouncements();
    }

    function applyAnnouncement(updated) {
      const previous = announcements.find((item) => item.id === updated.id);
      const merged = { ...updated, bookmarked: previous?.bookmarked ?? bookmarkedIds.has(String(updated.id)) };
      const index = announcements.findIndex((item) => item.id === merged.id);
      if (index === -1) announcements.push(merged);
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

    function updateAnalytics() {
      document.getElementById('stat-total').innerText = announcements.length;
      const totalAck = announcements.reduce((sum, a) => sum + a.ackCount, 0);
      const totalReg = announcements.reduce((sum, a) => sum + (a.seatsTaken || 0), 0);
      const totalQa = announcements.reduce((sum, a) => sum + a.comments.length, 0);
      document.getElementById('stat-ack').innerText = `${totalAck} ครั้ง`;
      document.getElementById('stat-reg').innerText = `${totalReg} คน`;
      document.getElementById('stat-qa').innerText = `${totalQa} รายการ`;
    }

    function renderCards() {
      updateAnalytics();
      const grid = document.getElementById('announcement-grid');
      let filtered = announcements.filter(a => {
        const matchRole = currentUserRole === 'teacher' ? true : (a.target === 'all' || a.target === 'student');
        const matchCat = currentFilter === 'all' || a.category === currentFilter;
        const matchSearch = a.title.toLowerCase().includes(searchQuery.toLowerCase()) || a.content.toLowerCase().includes(searchQuery.toLowerCase());
        const matchBook = showBookmarksOnly ? a.bookmarked : true;
        return matchRole && matchCat && matchSearch && matchBook;
      });

      filtered.sort((a, b) => {
        if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
        return sortOrder === 'newest' ? new Date(b.date) - new Date(a.date) : new Date(a.date) - new Date(b.date);
      });

      grid.innerHTML = filtered.map(item => {
        let roleTag = '';
        if (currentUserRole === 'teacher') {
          roleTag = item.target === 'teacher'
            ? '<span class="badge badge-target-teacher">💼 เฉพาะอาจารย์</span>'
            : '<span class="badge badge-target-student">👨‍🎓 นักศึกษา</span>';
        }

        return `
        <div class="card ${item.pinned ? 'pinned' : ''}">
          <div class="card-meta">
            <div style="display:flex; gap:6px; flex-wrap:wrap;">
              <span class="badge badge-cat">${CATEGORIES[item.category]}</span>
              ${roleTag}
              ${item.pinned ? '<span class="badge badge-pinned">📌 ด่วน</span>' : ''}
            </div>
            <span style="font-size:0.74rem; color:var(--text-muted);">${new Date(item.date).toLocaleDateString('th-TH', { day:'numeric', month:'short' })}</span>
          </div>

          <h3 onclick="openDetailModal(${item.id})">${escapeHtml(item.title)}</h3>

          <div class="ai-box">
            <strong>✨ AI สรุปประเด็นสำคัญ:</strong>
            ${escapeHtml(item.aiSummary)}
          </div>

          <div class="content">${sanitizeRichText(item.content)}</div>

          <div class="feature-bar">
            <button class="chip-btn ${item.acknowledged ? 'ack-done' : ''}" onclick="toggleAck(${item.id})">
              ${item.acknowledged ? '✅ รับทราบแล้ว' : '☑️ กดรับทราบ'} (${item.ackCount})
            </button>

            ${item.category === 'activity' ? `
              <button class="chip-btn" style="border-color:var(--primary); color:var(--primary);" onclick="registerEvent(${item.id})">
                🎟️ ${item.registered ? 'ดู QR เข้างาน' : 'ลงทะเบียน'} (${item.seatsTaken}/${item.seatsMax})
              </button>
            ` : ''}

            ${item.hasPdf ? `
              <button class="chip-btn" onclick="openPdfModalFor(${item.id})">📄 ดูไฟล์แนบ</button>
            ` : ''}

            ${item.eventDate ? `
              <button class="chip-btn" onclick="addToCalendarFor(${item.id})">📅 เพิ่มลงปฏิทิน</button>
            ` : ''}
          </div>

          <div class="card-footer">
            <span style="cursor:pointer; font-weight:bold; color:var(--primary);" onclick="openDetailModal(${item.id})">
              💬 ถาม-ตอบ (${item.comments.length}) • อ่านเต็มๆ
            </span>
            <div class="card-actions">
              <button class="icon-btn" onclick="showToast('🔗 คัดลอกลิงก์ประกาศแล้ว!')" title="แชร์">🔗</button>
              <button class="icon-btn ${item.bookmarked ? 'bookmarked' : ''}" onclick="toggleBookmark(${item.id})">
                ${item.bookmarked ? '⭐️' : '☆'}
              </button>
            </div>
          </div>
        </div>`;
      }).join('');
    }

    async function toggleAck(id) {
      const post = announcements.find(a => a.id === id);
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

    async function registerEvent(id) {
      const post = announcements.find(a => a.id === id);
      if (!post) return;
      const wasRegistered = post.registered;
      try {
        const updated = await requestApi(`/api/announcements/${id}/registration`, {
          method: 'POST',
          body: JSON.stringify({}),
        });
        applyAnnouncement(updated);
        if (!wasRegistered) showToast('🎉 ลงทะเบียนสำเร็จ! ระบบสร้าง QR Code ให้คุณแล้ว');
        document.getElementById('qrEventTitle').innerText = post.title;
        document.getElementById('qrModal').style.display = 'grid';
      } catch (error) {
        console.error(error);
        showToast(error.message);
      }
    }

    function openPdfModal(title) {
      document.getElementById('pdfDocTitle').innerText = `เอกสารแนบ: ${title}`;
      document.getElementById('pdfModal').style.display = 'grid';
    }

    function openPdfModalFor(id) {
      const post = announcements.find(item => item.id === id);
      if (post) openPdfModal(post.title);
    }

    function addToCalendar(title, dates) {
      const url = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent('[DPU] ' + title)}&dates=${dates}`;
      window.open(url, '_blank');
      showToast('📅 เปิดหน้าต่างบันทึกกำหนดการลง Google Calendar แล้ว');
    }

    function addToCalendarFor(id) {
      const post = announcements.find(item => item.id === id);
      if (post?.eventDate) addToCalendar(post.title, post.eventDate);
    }

    function openDetailModal(id) {
      activePostId = id;
      const post = announcements.find(a => a.id === id);
      if (!post) return;
      document.getElementById('detailContent').innerHTML = `
        <span class="badge badge-cat">${CATEGORIES[post.category]}</span>
        <h2 style="margin:8px 0;">${escapeHtml(post.title)}</h2>
        <div class="ai-box"><strong>✨ AI สรุปประเด็นสำคัญ:</strong> ${escapeHtml(post.aiSummary)}</div>
        <div style="margin:14px 0; line-height:1.7;">${sanitizeRichText(post.content)}</div>
      `;
      renderComments(post);
      document.getElementById('detailModal').style.display = 'grid';
    }

    function renderComments(post) {
      const box = document.getElementById('commentSection');
      if (post.comments.length === 0) {
        box.innerHTML = `<div style="color:var(--text-muted); font-size:0.84rem;">ยังไม่มีคำถามในประกาศนี้ สามารถพิมพ์สอบถามอาจารย์ด้านล่างได้เลย</div>`;
        return;
      }
      box.innerHTML = `<strong>💬 กระดานถาม-ตอบ (${post.comments.length})</strong>` + post.comments.map(c => `
        <div class="comment-item ${c.isTeacher ? 'teacher-reply' : ''}">
          <strong style="color:${c.isTeacher ? 'var(--teacher)' : 'var(--primary)'};">${escapeHtml(c.author)}:</strong> ${escapeHtml(c.text)}
        </div>
      `).join('');
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

    // Chatbot
    function toggleChat() {
      const win = document.getElementById('chatbotWindow');
      win.style.display = win.style.display === 'flex' ? 'none' : 'flex';
    }
    function askBot(q) {
      document.getElementById('chatInput').value = q;
      sendChat();
    }
    function sendChat() {
      const input = document.getElementById('chatInput');
      const q = input.value.trim();
      if (!q) return;
      const body = document.getElementById('chatBody');
      body.innerHTML += `<div class="chat-msg user">${escapeHtml(q)}</div>`;
      input.value = '';

      let reply = 'สามารถดูรายละเอียดทั้งหมดได้ในการ์ดประกาศด้านซ้าย หรือพิมพ์คำว่า "สอบ", "ทุน", "กิจกรรม" ได้เลยครับ';
      if (q.includes('สอบ')) reply = '📌 กำหนดการสอบปลายภาค 1/2569 คือวันที่ 1–15 พ.ย. 2569 ตรวจสอบห้องสอบได้ที่ระบบ REG ครับ';
      else if (q.includes('ทุน')) reply = '🎓 ตอนนี้มี "ทุนเรียนดีและทุนนวัตกรรม 2569" สำหรับเกรด 3.25 ขึ้นไป ยื่นเอกสารได้ถึงสิ้นเดือนนี้ครับ';
      else if (q.includes('กิจกรรม') || q.includes('อบรม')) reply = '🎉 มีงาน "Tech Workshop: Web App & AI" วันที่ 25 ต.ค. 2569 กดลงทะเบียนรับ QR Code ในหน้าเว็บได้เลย!';

      setTimeout(() => {
        body.innerHTML += `<div class="chat-msg bot">${reply}</div>`;
        body.scrollTop = body.scrollHeight;
      }, 350);
    }

    // Filter & Admin
    document.querySelectorAll('.filter-btn').forEach(btn => {
      btn.addEventListener('click', e => {
        document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
        e.target.classList.add('active');
        currentFilter = e.target.dataset.cat;
        renderCards();
      });
    });
    function handleSearch() { searchQuery = document.getElementById('searchInput').value; renderCards(); }
    function handleSort() { sortOrder = document.getElementById('sortSelect').value; renderCards(); }
    function toggleViewBookmarks() {
      showBookmarksOnly = !showBookmarksOnly;
      document.getElementById('btn-bookmarks').classList.toggle('active', showBookmarksOnly);
      renderCards();
    }
    function toggleBookmark(id) {
      const t = announcements.find(a => a.id === id);
      if (t) {
        t.bookmarked = !t.bookmarked;
        if (t.bookmarked) bookmarkedIds.add(String(id));
        else bookmarkedIds.delete(String(id));
        localStorage.setItem(bookmarkKey, JSON.stringify([...bookmarkedIds]));
        renderCards();
      }
    }
    function closeModal(id) { document.getElementById(id).style.display = 'none'; }

    let isDark = false;
    function toggleDarkMode() {
      isDark = !isDark;
      document.body.setAttribute('data-theme', isDark ? 'dark' : 'light');
    }

    let quill;
    function openAdminModal() {
      document.getElementById('adminModal').style.display = 'grid';
      if (!quill) quill = new Quill('#editor', { theme: 'snow' });
    }
    async function submitAnnouncement() {
      const title = document.getElementById('postTitle').value.trim();
      if (!title) return alert('กรุณาระบุหัวข้อประกาศ');
      const cat = document.getElementById('postCategory').value;
      const aiSum = document.getElementById('postAiSummary').value.trim() || `สรุปอัตโนมัติ: ${title} (กรุณาอ่านรายละเอียดเพิ่มเติมด้านล่าง)`;
      try {
        const announcement = await requestApi('/api/announcements', {
          method: 'POST',
          body: JSON.stringify({
            title,
            aiSummary: aiSum,
            content: quill.root.innerHTML || 'รายละเอียดประกาศใหม่',
            category: cat,
            target: document.getElementById('postTarget').value,
            pinned: document.getElementById('isPinned').checked,
            hasPdf: document.getElementById('hasAttachment').checked,
            seatsMax: cat === 'activity' ? 50 : null,
          }),
        });
        applyAnnouncement(announcement);
        closeModal('adminModal');
        showToast('✅ เผยแพร่ประกาศใหม่พร้อมสร้าง AI Summary เรียบร้อย!');
      } catch (error) {
        console.error(error);
        showToast(error.message);
      }
    }

    let toastTimer;
    function showToast(msg) {
      const t = document.getElementById('toastBox');
      t.innerText = msg; t.classList.add('show');
      clearTimeout(toastTimer);
      toastTimer = setTimeout(() => t.classList.remove('show'), 3200);
    }

    initializeApplication().catch((error) => {
      console.error(error);
      showLoginScreen(`เริ่มต้นระบบไม่สำเร็จ: ${error.message}`);
    });
