// ==========================
// AESTHETIC LEARNING TRACKER - script.js
// ==========================
(() => {
  // ---------- Config ----------
  const WEEKLY_TARGET_MIN = 300; // menit per minggu default (5 jam)
  const POMODORO_MIN = 25;
  const POMODORO_BREAK_MIN = 5;

  // ---------- Storage keys ----------
  const STORAGE_KEYS = {
    LOGS: "lt_logs_v1",
    GOALS: "lt_goals_v1",
    THEME: "lt_theme_v1",
    ACHIEVEMENTS: "lt_achv_v1",
  };

  // ---------- Elements ----------
  const topicInput = document.getElementById("topicInput");
  const durationInput = document.getElementById("durationInput");
  const categoryInput = document.getElementById("categoryInput");
  const moodInput = document.getElementById("moodInput");
  const noteInput = document.getElementById("noteInput");
  const saveLogBtn = document.getElementById("saveLogBtn");

  const searchInput = document.getElementById("searchInput");

  const weeklyProgressFill = document.getElementById("weeklyProgress");
  const weeklyProgressText = document.getElementById("weeklyProgressText");
  const streakDaysEl = document.getElementById("streakDays");

  const goalText = document.getElementById("goalText");
  const addGoalBtn = document.getElementById("addGoalBtn");
  const goalList = document.getElementById("goalList");

  const achievementBox = document.getElementById("achievementBox");

  const timerDisplay = document.getElementById("timerDisplay");
  const startTimerBtn = document.getElementById("startTimer");
  const resetTimerBtn = document.getElementById("resetTimer");

  const weeklyHoursEl = document.getElementById("weeklyHours");
  const topCategoryEl = document.getElementById("topCategory");
  const topMoodEl = document.getElementById("topMood");
  const busiestDayEl = document.getElementById("busiestDay");

  const logContainer = document.getElementById("logContainer");

  const downloadDataBtn = document.getElementById("downloadData");
  const uploadDataInput = document.getElementById("uploadData");

  const themeBtns = document.querySelectorAll(".theme-btn");

  // ---------- In-memory state ----------
  let logs = JSON.parse(localStorage.getItem(STORAGE_KEYS.LOGS) || "[]"); // each: {id, topic, duration, category, mood, note, dateISO}
  let goals = JSON.parse(localStorage.getItem(STORAGE_KEYS.GOALS) || "[]"); // each: {id,text,done}
  let achievements = JSON.parse(localStorage.getItem(STORAGE_KEYS.ACHIEVEMENTS) || "[]");
  let currentTheme = localStorage.getItem(STORAGE_KEYS.THEME) || "pink";

  // ---------- Utility ----------
  const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2,8);
  const fmtMinToHHmm = mins => {
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return `${h} jam ${m} mnt`;
  };
  const todayISO = () => new Date().toISOString().slice(0,10);
  const toDateISO = d => new Date(d).toISOString().slice(0,10);

  // ---------- Persistence ----------
  function saveAll() {
    localStorage.setItem(STORAGE_KEYS.LOGS, JSON.stringify(logs));
    localStorage.setItem(STORAGE_KEYS.GOALS, JSON.stringify(goals));
    localStorage.setItem(STORAGE_KEYS.ACHIEVEMENTS, JSON.stringify(achievements));
  }

  // ---------- Add Log ----------
  function addLog({ topic, duration, category, mood, note, dateISO }) {
    const entry = {
      id: uid(),
      topic: topic || "Pomodoro Session",
      duration: Number(duration) || 0,
      category: category || "Lainnya",
      mood: mood || "Biasa",
      note: note || "",
      dateISO: dateISO || todayISO()
    };
    logs.push(entry);
    saveAll();
    refreshUI();
  }

  // ---------- Delete Log ----------
  function deleteLog(id) {
    logs = logs.filter(l => l.id !== id);
    saveAll();
    refreshUI();
  }

  // ---------- Goals ----------
  function addGoal(text) {
    if (!text || !text.trim()) return;
    goals.push({ id: uid(), text: text.trim(), done: false });
    localStorage.setItem(STORAGE_KEYS.GOALS, JSON.stringify(goals));
    renderGoals();
  }
  function toggleGoal(id) {
    const g = goals.find(x=>x.id===id);
    if (g) { g.done = !g.done; localStorage.setItem(STORAGE_KEYS.GOALS, JSON.stringify(goals)); renderGoals(); }
  }
  function deleteGoal(id) {
    goals = goals.filter(g=>g.id!==id); localStorage.setItem(STORAGE_KEYS.GOALS, JSON.stringify(goals)); renderGoals();
  }

  // ---------- Stats ----------
  function getLast7DaysISO() {
    const arr = [];
    const now = new Date();
    for (let i=6;i>=0;i--) {
      const d = new Date(now);
      d.setDate(now.getDate() - i);
      arr.push(d.toISOString().slice(0,10));
    }
    return arr;
  }

  function weeklyMinutes() {
    const last7 = getLast7DaysISO();
    let total = 0;
    logs.forEach(l => {
      if (last7.includes(l.dateISO)) total += Number(l.duration || 0);
    });
    return total;
  }

  function totalMinutesAllTime() {
    return logs.reduce((s,l)=>s+Number(l.duration||0),0);
  }

  function categoryCounts() {
    const map = {};
    logs.forEach(l => { map[l.category] = (map[l.category]||0) + Number(l.duration||0); });
    return map;
  }

  function moodCounts() {
    const map = {};
    logs.forEach(l => { map[l.mood] = (map[l.mood]||0) + 1; });
    return map;
  }

  function busiestDay() {
    const map = {};
    logs.forEach(l => { map[l.dateISO] = (map[l.dateISO]||0) + Number(l.duration||0); });
    let best = null;
    for (let d in map) {
      if (!best || map[d] > map[best]) best = d;
    }
    return best ? `${best} (${map[best]} mnt)` : "-";
  }

  // ---------- Streak calculation ----------
  function calcStreak() {
    // Count consecutive days ending today where there's at least one log.
    let streak = 0;
    let idx = 0;
    while (true) {
      const d = new Date();
      d.setDate(d.getDate() - idx);
      const iso = d.toISOString().slice(0,10);
      const exists = logs.some(l => l.dateISO === iso);
      if (exists) { streak++; idx++; }
      else break;
    }
    return streak;
  }

  // ---------- Achievements ----------
  function checkAchievements() {
    // simple achievements: 7-day streak, weekly target reached, total minutes milestones
    const current = [...achievements];
    const streak = calcStreak();
    const weekly = weeklyMinutes();
    const total = totalMinutesAllTime();

    // helper add if not exist
    function award(id, title, label) {
      if (!achievements.some(a=>a.id===id)) {
        achievements.push({ id, title, label, date: new Date().toISOString().slice(0,10) });
      }
    }

    if (streak >= 7) award("streak7", "7-Day Streak", "Belajar tiap hari selama 7 hari!");
    if (weekly >= WEEKLY_TARGET_MIN) award("weeklyTarget", "Weekly Target", `Mencapai ${WEEKLY_TARGET_MIN} menit minggu ini.`);
    if (total >= 600) award("total600", "600 Menit Total", "Sudah belajar 10 jam total.");
    if (total >= 1200) award("total1200", "1200 Menit Total", "Sudah belajar 20 jam total.");

    // persist
    localStorage.setItem(STORAGE_KEYS.ACHIEVEMENTS, JSON.stringify(achievements));
  }

  // ---------- Render / UI ----------
  function renderLogs(filterText="") {
    const filter = (filterText||"").toLowerCase().trim();
    logContainer.innerHTML = "";

    // sort by date desc then id
    const sorted = [...logs].sort((a,b)=> (b.dateISO + b.id).localeCompare(a.dateISO + a.id));
    sorted.forEach(l => {
      if (filter) {
        const hay = `${l.topic} ${l.category} ${l.mood} ${l.note}`.toLowerCase();
        if (!hay.includes(filter)) return;
      }
      const card = document.createElement("div");
      card.className = "log-card";
      card.innerHTML = `
        <div class="log-left">
          <div class="log-top"><strong>${escapeHtml(l.topic)}</strong> <span class="log-meta">• ${l.category} • ${l.mood}</span></div>
          <div class="log-note">${escapeHtml(l.note || "")}</div>
          <div class="log-bottom"><small>${l.dateISO} • ${l.duration} menit</small></div>
        </div>
        <div class="log-right">
          <button class="btn small del" data-id="${l.id}">Hapus</button>
        </div>
      `;
      logContainer.appendChild(card);
    });

    // attach delete handlers
    document.querySelectorAll(".btn.del").forEach(b => {
      b.addEventListener("click", () => {
        const id = b.dataset.id;
        if (confirm("Hapus catatan ini?")) deleteLog(id);
      });
    });
  }

  function renderGoals() {
    goalList.innerHTML = "";
    goals.forEach(g => {
      const li = document.createElement("li");
      li.className = "goal-item";
      li.innerHTML = `
        <label>
          <input type="checkbox" ${g.done ? "checked" : ""} data-id="${g.id}" class="goal-checkbox">
          <span>${escapeHtml(g.text)}</span>
        </label>
        <button class="btn small del-goal" data-id="${g.id}">Hapus</button>
      `;
      goalList.appendChild(li);
    });

    document.querySelectorAll(".goal-checkbox").forEach(cb => {
      cb.addEventListener("change", e => toggleGoal(e.target.dataset.id));
    });
    document.querySelectorAll(".del-goal").forEach(b => {
      b.addEventListener("click", () => {
        if (confirm("Hapus target ini?")) deleteGoal(b.dataset.id);
      });
    });
  }

  function renderAchievements() {
    achievementBox.innerHTML = "";
    if (!achievements.length) {
      achievementBox.innerHTML = `<p class="muted">Belum ada pencapaian — ayo mulai belajar!</p>`;
      return;
    }
    achievements.slice().reverse().forEach(a => {
      const el = document.createElement("div");
      el.className = "achv";
      el.innerHTML = `<strong>${escapeHtml(a.title)}</strong><div class="achv-label">${escapeHtml(a.label)}</div><div class="achv-date">${a.date}</div>`;
      achievementBox.appendChild(el);
    });
  }

  function refreshStatsAndProgress() {
    const weeklyMin = weeklyMinutes();
    const pct = Math.min(Math.round((weeklyMin / WEEKLY_TARGET_MIN) * 100), 100);
    weeklyProgressFill.style.width = pct + "%";
    weeklyProgressText.textContent = `${weeklyMin} / ${WEEKLY_TARGET_MIN} menit minggu ini`;

    weeklyHoursEl.textContent = (weeklyMin / 60).toFixed(1);
    // top category
    const catMap = categoryCounts();
    const topCat = Object.keys(catMap).sort((a,b)=>catMap[b]-catMap[a])[0] || "-";
    topCategoryEl.textContent = topCat;
    // top mood
    const moodMap = moodCounts();
    const topMood = Object.keys(moodMap).sort((a,b)=>moodMap[b]-moodMap[a])[0] || "-";
    topMoodEl.textContent = topMood;
    // busiest day
    busiestDayEl.textContent = busiestDay();

    // streak
    streakDaysEl.textContent = calcStreak();

    checkAchievements(); renderAchievements();
  }

  function refreshUI() {
    renderLogs(searchInput.value || "");
    renderGoals();
    refreshStatsAndProgress();
  }

  // ---------- Timer / Pomodoro ----------
  let timer = {
    running: false,
    remainingSec: POMODORO_MIN * 60,
    timeoutId: null,
    inBreak: false
  };

  function updateTimerDisplay() {
    const mm = Math.floor(timer.remainingSec / 60).toString().padStart(2,"0");
    const ss = (timer.remainingSec % 60).toString().padStart(2,"0");
    timerDisplay.textContent = `${mm}:${ss}`;
  }

  function startPomodoro() {
    if (timer.running) return;
    timer.running = true;
    tickTimer();
    startTimerBtn.textContent = "Jeda";
  }

  function tickTimer() {
    timer.timeoutId = setInterval(() => {
      timer.remainingSec--;
      updateTimerDisplay();
      if (timer.remainingSec <= 0) {
        clearInterval(timer.timeoutId);
        timer.running = false;
        // finished a session
        if (!timer.inBreak) {
          // add session log automatically
          const minutes = POMODORO_MIN;
          addLog({
            topic: "Pomodoro Session",
            duration: minutes,
            category: "Pomodoro",
            mood: "Fokus",
            note: "Sesi otomatis dari timer",
            dateISO: todayISO()
          });
          alert("Pomodoro selesai — 25 menit ditambahkan ke log!");
          // start break
          timer.inBreak = true;
          timer.remainingSec = POMODORO_BREAK_MIN * 60;
          updateTimerDisplay();
          startPomodoro(); // start break automatically
        } else {
          // break finished
          timer.inBreak = false;
          timer.remainingSec = POMODORO_MIN * 60;
          updateTimerDisplay();
          startTimerBtn.textContent = "Mulai";
          alert("Break selesai — siap untuk sesi berikutnya!");
        }
      }
    }, 1000);
  }

  function toggleTimer() {
    if (!timer.running) {
      // start
      timer.running = true;
      // if remainingSec is zero, reset
      if (timer.remainingSec <= 0) timer.remainingSec = POMODORO_MIN * 60;
      tickTimer();
      startTimerBtn.textContent = "Jeda";
    } else {
      // pause
      clearInterval(timer.timeoutId);
      timer.running = false;
      startTimerBtn.textContent = "Lanjutkan";
    }
  }

  function resetTimer() {
    clearInterval(timer.timeoutId);
    timer.running = false;
    timer.inBreak = false;
    timer.remainingSec = POMODORO_MIN * 60;
    updateTimerDisplay();
    startTimerBtn.textContent = "Mulai";
  }

  // ---------- Search ----------
  function onSearch() {
    const q = searchInput.value || "";
    renderLogs(q);
  }

  // ---------- Theme ----------
  function applyTheme(t) {
    currentTheme = t;
    document.body.setAttribute("data-theme", t);
    localStorage.setItem(STORAGE_KEYS.THEME, t);
    // Visual mark on buttons
    themeBtns.forEach(b => b.classList.toggle("active", b.dataset.theme === t));
  }

  // ---------- Backup / Restore ----------
  function downloadData() {
    const dump = { logs, goals, achievements, theme: currentTheme };
    const blob = new Blob([JSON.stringify(dump, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `learning-tracker-backup-${new Date().toISOString().slice(0,10)}.json`;
    document.body.appendChild(a); a.click(); a.remove();
    URL.revokeObjectURL(url);
  }

  function uploadData(file) {
    const reader = new FileReader();
    reader.onload = e => {
      try {
        const obj = JSON.parse(e.target.result);
        if (obj.logs && Array.isArray(obj.logs)) logs = obj.logs;
        if (obj.goals && Array.isArray(obj.goals)) goals = obj.goals;
        if (obj.achievements && Array.isArray(obj.achievements)) achievements = obj.achievements;
        if (obj.theme) applyTheme(obj.theme);
        saveAll();
        refreshUI();
        alert("Data berhasil di-restore.");
      } catch (err) {
        alert("File tidak valid.");
      }
    };
    reader.readAsText(file);
  }

  // ---------- Small helpers ----------
  function escapeHtml(str) {
    if (!str) return "";
    return str.replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;");
  }

  // ---------- Event bindings ----------
  saveLogBtn && saveLogBtn.addEventListener("click", () => {
    const topic = topicInput.value.trim();
    const duration = Number(durationInput.value) || 0;
    const category = categoryInput.value;
    const mood = moodInput.value;
    const note = noteInput.value.trim();
    if (!topic) { alert("Isi topik belajar."); return; }
    if (!duration || duration <= 0) { alert("Isi durasi (menit)."); return; }
    addLog({ topic, duration, category, mood, note, dateISO: todayISO() });
    // clear inputs
    topicInput.value = ""; durationInput.value = ""; noteInput.value = "";
  });

  searchInput && searchInput.addEventListener("input", onSearch);
  addGoalBtn && addGoalBtn.addEventListener("click", () => { addGoal(goalText.value); goalText.value = ""; });
  startTimerBtn && startTimerBtn.addEventListener("click", toggleTimer);
  resetTimerBtn && resetTimerBtn.addEventListener("click", resetTimer);
  downloadDataBtn && downloadDataBtn.addEventListener("click", downloadData);
  uploadDataInput && uploadDataInput.addEventListener("change", (e) => {
    const f = e.target.files[0];
    if (f) uploadData(f);
  });

  // theme buttons
  themeBtns.forEach(b => {
    b.addEventListener("click", () => applyTheme(b.dataset.theme));
  });

  // ---------- Initialization ----------
  function init() {
    // ensure defaults
    if (!Array.isArray(logs)) logs = [];
    if (!Array.isArray(goals)) goals = [];
    if (!Array.isArray(achievements)) achievements = [];

    // set theme
    applyTheme(currentTheme);

    // set timer display
    timer.remainingSec = POMODORO_MIN * 60;
    updateTimerDisplay();

    // render
    refreshUI();
  }

  init();

  // expose some for console/debug (optional)
  window._LT = { logs, goals, achievements, addLog, deleteLog, addGoal, calcStreak };
})();
