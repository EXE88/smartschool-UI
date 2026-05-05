import { api, hasToken, login, logout } from "./api.js";

let account = null;
let modal = null;

const THEME_KEY = "smartschool_theme";
const $ = (id) => document.getElementById(id);
const escapeHtml = (value) => String(value ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" }[c]));
const formatDate = (value) => value ? new Intl.DateTimeFormat("fa-IR", { dateStyle: "medium", timeZone: "Asia/Tehran" }).format(new Date(value)) : "-";
const toIsoDate = (date) => {
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 10);
};
const todayIso = () => toIsoDate(new Date());
const tomorrowIso = () => {
  const date = new Date();
  date.setDate(date.getDate() + 1);
  return toIsoDate(date);
};

const pad2 = (value) => String(value).padStart(2, "0");
const persianPartsFormatter = new Intl.DateTimeFormat("en-US-u-ca-persian", {
  year: "numeric",
  month: "numeric",
  day: "numeric",
  timeZone: "Asia/Tehran",
});

function addDays(date, days) {
  const next = new Date(date);
  next.setUTCDate(next.getUTCDate() + days);
  return next;
}

function isoFromUtcDate(date) {
  return date.toISOString().slice(0, 10);
}

function jalaliPartsFromDate(date) {
  const parts = Object.fromEntries(
    persianPartsFormatter
      .formatToParts(date)
      .filter((part) => ["year", "month", "day"].includes(part.type))
      .map((part) => [part.type, Number(part.value)])
  );
  return [parts.year, parts.month, parts.day];
}

function gregorianIsoToJalaliParts(isoDate) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(isoDate))) return null;
  return jalaliPartsFromDate(new Date(`${isoDate}T12:00:00Z`));
}

function gregorianIsoToJalali(isoDate) {
  const parts = gregorianIsoToJalaliParts(isoDate);
  return parts ? `${parts[0]}/${pad2(parts[1])}/${pad2(parts[2])}` : "";
}

function jalaliToGregorianIso(jy, jm, jd) {
  const target = [Number(jy), Number(jm), Number(jd)];
  if (!target.every(Number.isInteger) || target[1] < 1 || target[1] > 12 || target[2] < 1 || target[2] > 31) return null;

  const start = new Date(Date.UTC(target[0] + 621, 2, 15));
  for (let offset = 0; offset < 380; offset += 1) {
    const candidate = addDays(start, offset);
    const parts = jalaliPartsFromDate(candidate);
    if (parts[0] === target[0] && parts[1] === target[1] && parts[2] === target[2]) return isoFromUtcDate(candidate);
  }
  return null;
}

function jalaliMonthLength(jy, jm) {
  if (jm <= 6) return 31;
  if (jm <= 11) return 30;
  return jalaliToGregorianIso(jy, 12, 30) ? 30 : 29;
}

const jalaliMonthNames = ["فروردین", "اردیبهشت", "خرداد", "تیر", "مرداد", "شهریور", "مهر", "آبان", "آذر", "دی", "بهمن", "اسفند"];
const jalaliWeekdays = ["ش", "ی", "د", "س", "چ", "پ", "ج"];
let jalaliPickerState = null;

function ensureJalaliPicker() {
  let picker = document.getElementById("jalaliDatePicker");
  if (picker) return picker;
  picker = document.createElement("div");
  picker.id = "jalaliDatePicker";
  picker.className = "jalali-picker hidden";
  document.body.appendChild(picker);
  picker.addEventListener("click", (event) => event.stopPropagation());
  document.addEventListener("click", (event) => {
    if (!picker.contains(event.target) && !event.target.closest("[data-jalali-date]")) closeJalaliPicker();
  });
  return picker;
}

function closeJalaliPicker() {
  document.getElementById("jalaliDatePicker")?.classList.add("hidden");
  jalaliPickerState = null;
}

function renderJalaliPicker() {
  if (!jalaliPickerState) return;
  const { input, hidden, jy, jm } = jalaliPickerState;
  const picker = ensureJalaliPicker();
  const selected = gregorianIsoToJalaliParts(hidden.value);
  const firstGregorian = jalaliToGregorianIso(jy, jm, 1);
  if (!firstGregorian || !jalaliMonthNames[jm - 1]) return closeJalaliPicker();
  const firstDate = new Date(`${firstGregorian}T00:00:00`);
  const firstWeekday = (firstDate.getDay() + 1) % 7;
  const days = jalaliMonthLength(jy, jm);
  const cells = [];
  for (let i = 0; i < firstWeekday; i += 1) cells.push(`<span class="jalali-day is-empty"></span>`);
  for (let day = 1; day <= days; day += 1) {
    const isSelected = selected && selected[0] === jy && selected[1] === jm && selected[2] === day;
    cells.push(`<button type="button" class="jalali-day ${isSelected ? "is-selected" : ""}" data-day="${day}">${day}</button>`);
  }
  picker.innerHTML = `
    <div class="jalali-picker-head">
      <button type="button" data-jalali-prev><i class="bi bi-chevron-right"></i></button>
      <strong>${jalaliMonthNames[jm - 1]} ${jy}</strong>
      <button type="button" data-jalali-next><i class="bi bi-chevron-left"></i></button>
    </div>
    <div class="jalali-weekdays">${jalaliWeekdays.map((day) => `<span>${day}</span>`).join("")}</div>
    <div class="jalali-days">${cells.join("")}</div>`;
  const rect = input.getBoundingClientRect();
  picker.style.top = `${rect.bottom + window.scrollY + 8}px`;
  picker.style.left = `${Math.max(12, rect.left + window.scrollX)}px`;
  picker.style.width = `${Math.min(330, Math.max(280, rect.width))}px`;
  picker.classList.remove("hidden");
  picker.querySelector("[data-jalali-prev]").addEventListener("click", (event) => {
    event.preventDefault();
    event.stopPropagation();
    jalaliPickerState.jm -= 1;
    if (jalaliPickerState.jm < 1) {
      jalaliPickerState.jm = 12;
      jalaliPickerState.jy -= 1;
    }
    renderJalaliPicker();
  });
  picker.querySelector("[data-jalali-next]").addEventListener("click", (event) => {
    event.preventDefault();
    event.stopPropagation();
    jalaliPickerState.jm += 1;
    if (jalaliPickerState.jm > 12) {
      jalaliPickerState.jm = 1;
      jalaliPickerState.jy += 1;
    }
    renderJalaliPicker();
  });
  picker.querySelectorAll("[data-day]").forEach((button) => button.addEventListener("click", (event) => {
    event.preventDefault();
    event.stopPropagation();
    const gregorian = jalaliToGregorianIso(jy, jm, Number(button.dataset.day));
    if (!gregorian) return;
    hidden.value = gregorian;
    input.value = gregorianIsoToJalali(gregorian);
    closeJalaliPicker();
  }));
}

function initJalaliDatePickers(root = document) {
  root.querySelectorAll("[data-jalali-date]").forEach((input) => {
    if (input.dataset.jalaliBound === "1") return;
    input.dataset.jalaliBound = "1";
    const hidden = root.querySelector(`#${input.dataset.target}`) || document.getElementById(input.dataset.target);
    if (!hidden) return;
    input.value = hidden.value ? gregorianIsoToJalali(hidden.value) : "";
    input.addEventListener("focus", () => openJalaliPicker(input, hidden));
    input.addEventListener("click", () => openJalaliPicker(input, hidden));
  });
}

function openJalaliPicker(input, hidden) {
  const parts = gregorianIsoToJalaliParts(hidden.value || todayIso()) || gregorianIsoToJalaliParts(todayIso());
  jalaliPickerState = { input, hidden, jy: parts[0], jm: parts[1] };
  renderJalaliPicker();
}

function toast(message, type = "info") {
  const alert = document.createElement("div");
  alert.className = `alert alert-${type} shadow toast-message`;
  alert.textContent = message;
  document.body.appendChild(alert);
  setTimeout(() => alert.remove(), 2800);
}

function preferredTheme() {
  const saved = localStorage.getItem(THEME_KEY);
  if (saved === "dark" || saved === "light") return saved;
  return window.matchMedia?.("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function applyTheme(theme) {
  document.documentElement.dataset.theme = theme;
  localStorage.setItem(THEME_KEY, theme);
  const icon = $("themeToggle")?.querySelector("i");
  if (icon) icon.className = theme === "dark" ? "bi bi-sun" : "bi bi-moon-stars";
}

function toggleTheme() {
  applyTheme(document.documentElement.dataset.theme === "dark" ? "light" : "dark");
}

function hideSplash() {
  window.setTimeout(() => $("splashScreen")?.classList.add("is-hidden"), 260);
}

function showLogin() {
  document.body.classList.add("auth-screen");
  document.body.classList.remove("app-screen");
  $("loginPage").classList.remove("hidden");
  $("dashboard").classList.add("hidden");
}

function showDashboard() {
  document.body.classList.add("app-screen");
  document.body.classList.remove("auth-screen");
  $("loginPage").classList.add("hidden");
  $("dashboard").classList.remove("hidden");
}

function fullName(profile) {
  return `${profile?.firstname || ""} ${profile?.lastname || ""}`.trim() || account?.user?.username || "-";
}

function roleLabel() {
  return account.role === "teacher" ? "معلم" : account.role === "student" ? "دانش‌آموز" : "مدیر";
}

function assignmentLabel(assignment) {
  return `${assignment.class_name || assignment.classobj} - ${assignment.lesson_name || assignment.lesson}`;
}

function classStudents(assignment) {
  return (account.students || []).filter((student) => student.classobj === assignment.classobj_id);
}

function assignmentForStudent(studentId) {
  const student = (account.students || []).find((item) => item.id === Number(studentId));
  return (account.teaching_assignments || []).find((item) => item.classobj_id === student?.classobj);
}

function attendanceStatusLabel(status) {
  return status === "absent" ? "غایب" : "حاضر";
}

function attendanceStatusBadge(status) {
  const badgeClass = status === "absent" ? "bg-danger" : "bg-success";
  return `<span class="badge ${badgeClass}">${attendanceStatusLabel(status)}</span>`;
}

function absentAttendanceCount() {
  return account.stats?.absent_attendances_count ?? (account.attendances || []).filter((attendance) => attendance.status === "absent").length;
}

function unreadCommentCount() {
  return account?.stats?.unchecked_comments_count ?? (account?.comments || []).filter((comment) => !comment.checked).length;
}

function updateMessageBadge() {
  const nav = document.querySelector('[data-page="messages"].nav-item');
  if (!nav) return;
  nav.querySelector(".nav-badge")?.remove();
  const count = unreadCommentCount();
  if (account?.role !== "student" || count <= 0) return;
  const badge = document.createElement("span");
  badge.className = "nav-badge";
  badge.textContent = count > 99 ? "99+" : String(count);
  nav.appendChild(badge);
}

async function markUnreadCommentsRead() {
  if (account?.role !== "student") return;
  const unread = (account.comments || []).filter((comment) => !comment.checked);
  if (!unread.length) return;

  unread.forEach((comment) => {
    comment.checked = true;
  });
  if (account.stats) account.stats.unchecked_comments_count = 0;
  renderComments();
  updateMessageBadge();

  try {
    await Promise.all(unread.map((comment) => api.updateComment(comment.id, { checked: true })));
    await reload();
  } catch (error) {
    toast(error.message, "danger");
    await reload();
  }
}

function smartTitle(title, icon, action = "") {
  return `<div class="smart-card-head"><div><span class="card-icon"><i class="bi ${icon}"></i></span><h2>${title}</h2></div>${action}</div>`;
}

function meta(label, value, icon = "bi-dot") {
  return `<span class="metric-pill"><i class="bi ${icon}"></i>${label}: <strong>${escapeHtml(value)}</strong></span>`;
}

function card(title, body, footer = "", extra = "") {
  return `<article class="smart-card ${extra}">${title}<div class="smart-card-body">${body}</div>${footer ? `<div class="smart-card-foot">${footer}</div>` : ""}</article>`;
}

function emptyState(message, icon = "bi-inbox") {
  return `<div class="empty-state"><div class="icon-wrapper"><i class="bi ${icon}"></i></div><h3 class="title">${message}</h3></div>`;
}

function setSection(headerId, cardsId, title, actionHtml, cardsHtml) {
  $(headerId).innerHTML = `
    <section class="section-shell">
      <header class="section-header">
        <div>
          <span class="section-kicker">SmartSchool</span>
          <h1 class="section-title">${title}</h1>
        </div>
        <div class="section-actions">${actionHtml || ""}</div>
      </header>
      <div class="cards-grid" id="${cardsId}">${cardsHtml}</div>
    </section>`;
}

function dateKey(value) {
  if (!value) return "بدون تاریخ";
  return String(value).slice(0, 10);
}

function classKey(item) {
  return item.class_name || item.classobj || "بدون کلاس";
}

function normalizeSearch(value) {
  return String(value ?? "").toLowerCase().replace(/\s+/g, " ").trim();
}

function groupedSearchText(item, extra = []) {
  return normalizeSearch([
    item.student_name,
    item.teacher_name,
    item.lesson_name,
    item.class_name,
    item.description,
    item.value,
    item.status ? attendanceStatusLabel(item.status) : "",
    formatDate(item.created_at || item.due_date),
    ...extra,
  ].join(" "));
}

function groupedCollection(items, options) {
  const query = normalizeSearch(options.query || "");
  const filtered = query
    ? items.filter((item) => groupedSearchText(item, options.extraSearch?.(item) || []).includes(query))
    : items;

  if (!filtered.length) return emptyState(query ? "موردی با این جستجو پیدا نشد" : options.emptyMessage, options.emptyIcon);

  const byDate = filtered.reduce((acc, item) => {
    const key = options.dateKey(item);
    acc[key] = acc[key] || [];
    acc[key].push(item);
    return acc;
  }, {});

  return Object.entries(byDate).map(([groupDate, dateItems], index) => {
    const byClass = dateItems.reduce((acc, item) => {
      const key = classKey(item);
      acc[key] = acc[key] || [];
      acc[key].push(item);
      return acc;
    }, {});

    return `<details class="grouped-date" ${index === 0 ? "open" : ""}>
      <summary>
        <span><i class="bi bi-calendar3"></i>${formatDate(groupDate)}</span>
        <small>${dateItems.length} مورد</small>
      </summary>
      <div class="grouped-date-body">
        ${Object.entries(byClass).map(([groupClass, classItems]) => `<section class="grouped-class">
          <header><h3>${escapeHtml(groupClass)}</h3><span>${classItems.length} مورد</span></header>
          <div class="grouped-cards">${classItems.map(options.renderItem).join("")}</div>
        </section>`).join("")}
      </div>
    </details>`;
  }).join("");
}

function setGroupedSection(headerId, cardsId, title, actionHtml, searchId, searchPlaceholder, groupedHtml) {
  $(headerId).innerHTML = `
    <section class="section-shell">
      <header class="section-header">
        <div>
          <span class="section-kicker">SmartSchool</span>
          <h1 class="section-title">${title}</h1>
        </div>
        <div class="section-actions">${actionHtml || ""}</div>
      </header>
      <div class="collection-toolbar">
        <label class="collection-search">
          <i class="bi bi-search"></i>
          <input id="${searchId}" type="search" placeholder="${searchPlaceholder}">
        </label>
      </div>
      <div class="grouped-list" id="${cardsId}">${groupedHtml}</div>
    </section>`;
}

function openForm(title, body) {
  $("formModalTitle").textContent = title;
  $("formModalBody").innerHTML = body;
  modal = modal || new bootstrap.Modal($("formModal"));
  modal.show();
  window.setTimeout(() => initJalaliDatePickers($("formModalBody")), 0);
}

function closeForm() {
  if (modal) modal.hide();
}

function renderProfile() {
  const profile = account.profile || {};
  const name = fullName(profile);
  $("profileButtonText").textContent = name;
  $("dropdown-user-info").innerHTML = `
    <p class="mb-1"><strong>نام:</strong> ${escapeHtml(name)}</p>
    <p class="mb-0"><strong>نقش:</strong> ${roleLabel()}</p>
  `;

  const sections = [
    profileSection("اطلاعات هویتی", "bi-fingerprint", [
      ["نام", profile.firstname, "bi-person"],
      ["نام خانوادگی", profile.lastname, "bi-person"],
      ["کد ملی", profile.nationalcode, "bi-credit-card"],
      ["تاریخ تولد", profile.birthdate ? formatDate(profile.birthdate) : "", "bi-calendar-heart"],
    ]),
    account.role === "student" ? profileSection("اطلاعات آموزشی", "bi-mortarboard", [
      ["کلاس", profile.classobj, "bi-people"],
      ["پایه", profile.grade, "bi-bar-chart"],
      ["رشته", profile.subject, "bi-journal-bookmark"],
      ["تکالیف", account.stats?.homeworks_count, "bi-book"],
      ["نمرات", account.stats?.scores_count, "bi-trophy"],
      ["غیبت‌ها", absentAttendanceCount(), "bi-calendar-x"],
    ]) : "",
    account.role === "student" ? profileSection("اطلاعات تماس خانواده", "bi-telephone", [
      ["شماره پدر", profile.father_phonenumber, "bi-telephone"],
      ["شماره مادر", profile.mother_phonenumber, "bi-telephone"],
      ["تلفن منزل", profile.home_phonenumber, "bi-house-door"],
    ]) : "",
    account.role === "teacher" ? profileSection("اطلاعات تماس", "bi-telephone", [
      ["شماره تماس", profile.phonenumber, "bi-telephone"],
    ]) : "",
    account.role === "teacher" ? renderTeacherAssignmentsProfile() : "",
    account.role === "teacher" ? profileSection("خلاصه فعالیت", "bi-graph-up", [
      ["کلاس/درس‌های فعال", account.stats?.teaching_assignments_count, "bi-layout-text-window"],
      ["دانش‌آموزهای مرتبط", account.students?.length, "bi-people"],
      ["نمره‌های ثبت‌شده", account.stats?.scores_count, "bi-trophy"],
      ["تکلیف‌های ایجادشده", account.stats?.homeworks_count, "bi-book"],
      ["رکوردهای حضور و غیاب", account.stats?.attendances_count, "bi-calendar-check"],
      ["پیام‌ها", account.stats?.comments_count, "bi-chat-dots"],
    ]) : "",
  ].filter(Boolean).join("");

  $("educational-profile-system-div").innerHTML = `
    <div class="profile-container">
      <section class="profile-card profile-hero">
        <div class="profile-avatar"><i class="bi bi-person-badge"></i></div>
        <div>
          <span class="profile-role">${roleLabel()}</span>
          <h1>${escapeHtml(name)}</h1>
          <p>اطلاعات طبقه‌بندی‌شده حساب، وضعیت آموزشی و دسترسی‌های مرتبط</p>
        </div>
      </section>
      <div class="profile-sections">${sections}</div>
    </div>`;
}

function profileSection(title, icon, items) {
  const tiles = items.map(([label, value, tileIcon]) => profileTile(label, value, tileIcon)).filter(Boolean).join("");
  if (!tiles) return "";
  return `<section class="profile-info-section">
    <header class="profile-section-header"><i class="bi ${icon}"></i><h2>${title}</h2></header>
    <div class="profile-grid">${tiles}</div>
  </section>`;
}

function profileTile(label, value, icon) {
  if (value === null || value === undefined || value === "") return "";
  return `<article class="profile-tile"><i class="bi ${icon}"></i><span>${label}</span><strong>${escapeHtml(value)}</strong></article>`;
}

function renderTeacherAssignmentsProfile() {
  const assignments = account.teaching_assignments || [];
  if (!assignments.length) return "";
  const grouped = assignments.reduce((acc, assignment) => {
    const key = assignment.class_name || assignment.classobj || "بدون کلاس";
    acc[key] = acc[key] || [];
    acc[key].push(assignment.lesson_name || assignment.lesson);
    return acc;
  }, {});
  return `<section class="profile-info-section">
    <header class="profile-section-header"><i class="bi bi-easel"></i><h2>کلاس‌ها و درس‌های تدریس</h2></header>
    <div class="profile-assignment-list">
      ${Object.entries(grouped).map(([className, lessons]) => `<article class="profile-assignment-card">
        <h3>${escapeHtml(className)}</h3>
        <div>${lessons.map((lesson) => `<span>${escapeHtml(lesson)}</span>`).join("")}</div>
      </article>`).join("")}
    </div>
  </section>`;
}
function renderHome() {
  const root = $("class-list-div");
  if (account.role === "teacher") {
    root.innerHTML = `
      <section class="section-shell">
        <header class="section-header">
          <div><span class="section-kicker">کلاس‌های فعال</span><h1 class="section-title">داشبورد معلم</h1></div>
        </header>
        <div class="class-list">
          ${(account.teaching_assignments || []).map((assignment) => {
            const students = classStudents(assignment);
            return `<button class="class-card" data-assignment-id="${assignment.id}">
              <span class="class-badge"><i class="bi bi-book"></i>${escapeHtml(assignment.lesson_name)}</span>
              <h2>${escapeHtml(assignment.class_name)}</h2>
              <p>${students.length} دانش‌آموز در این کلاس ثبت شده است.</p>
              <span class="open-class">مدیریت سریع <i class="bi bi-arrow-left"></i></span>
            </button>`;
          }).join("") || emptyState("کلاسی برای شما ثبت نشده است")}
        </div>
      </section>`;
    root.querySelectorAll(".class-card").forEach((el) => el.addEventListener("click", () => openClass(Number(el.dataset.assignmentId))));
  } else {
    const today = todayIso();
    const tomorrow = tomorrowIso();
    const activeHomeworks = (account.homeworks || []).filter((homework) => homework.due_date >= today);
    const tomorrowHomeworks = activeHomeworks.filter((homework) => homework.due_date === tomorrow);
    root.innerHTML = `
      <section class="section-shell student-home-shell">
        <header class="section-header">
          <div>
            <span class="section-kicker">نمای کلی</span>
            <h1 class="section-title">داشبورد دانش‌آموز</h1>
            <p class="section-subtitle">وضعیت‌های مهم امروز و تکلیف‌های فردا</p>
          </div>
        </header>
        <div class="stats-grid student-stats-grid">
          ${statCard("غیبت‌ها", absentAttendanceCount(), "bi-calendar-x")}
          ${statCard("پیام‌های جدید", account.stats.unchecked_comments_count, "bi-chat-dots")}
          ${statCard("تکالیف مهلت‌دار", activeHomeworks.length, "bi-journal-check")}
        </div>
        <section class="tomorrow-homeworks-panel">
          <div class="panel-heading">
            <div>
              <span class="section-kicker">برای فردا</span>
              <h2>تکلیف‌های فردا</h2>
            </div>
            <span class="metric-pill"><i class="bi bi-calendar-event"></i>${tomorrowHomeworks.length} مورد</span>
          </div>
          <div class="tomorrow-homeworks-grid">
            ${tomorrowHomeworks.map(renderTomorrowHomework).join("") || emptyState("برای فردا تکلیفی ثبت نشده است", "bi-journal-check")}
          </div>
        </section>
      </section>`;
  }
}

function statCard(label, value, icon) {
  return `<article class="stat-card"><i class="bi ${icon}"></i><strong>${value}</strong><span>${label}</span></article>`;
}

function renderTomorrowHomework(homework) {
  return `<article class="tomorrow-homework-card">
    <div class="smart-card-head">
      <div><span class="card-icon"><i class="bi bi-book"></i></span><h3>${escapeHtml(homework.lesson_name)}</h3></div>
    </div>
    <p>${escapeHtml(homework.description).replace(/\n/g, "<br>")}</p>
    <div class="metric-row">
      ${meta("کلاس", homework.class_name, "bi-people")}
      ${meta("مهلت", formatDate(homework.due_date), "bi-calendar-event")}
    </div>
  </article>`;
}
function openClass(assignmentId) {
  const assignment = account.teaching_assignments.find((item) => item.id === assignmentId);
  const students = classStudents(assignment);
  openForm(assignmentLabel(assignment), `
    <div class="quick-list">
      ${students.map((student) => `<article class="quick-student">
        <strong>${escapeHtml(student.name)}</strong>
        <div class="quick-actions">
          <input type="number" class="form-control form-control-sm" min="0" max="20" step="0.25" id="quick-score-${student.id}" placeholder="نمره">
          <button class="btn btn-sm btn-primary" data-action="quick-score" data-assignment="${assignment.id}" data-student="${student.id}">ثبت نمره</button>
          <button class="btn btn-sm btn-success" data-action="quick-attendance" data-status="present" data-assignment="${assignment.id}" data-student="${student.id}">حاضر</button>
          <button class="btn btn-sm btn-danger" data-action="quick-attendance" data-status="absent" data-assignment="${assignment.id}" data-student="${student.id}">غایب</button>
        </div>
      </article>`).join("") || emptyState("دانش‌آموزی برای این کلاس ثبت نشده است")}
    </div>
  `);
  $("formModalBody").querySelectorAll("[data-action]").forEach((btn) => btn.addEventListener("click", handleQuickAction));
}

async function handleQuickAction(event) {
  const btn = event.currentTarget;
  try {
    if (btn.dataset.action === "quick-score") {
      const value = Number($(`quick-score-${btn.dataset.student}`).value);
      if (Number.isNaN(value) || value < 0 || value > 20) return toast("نمره باید بین ۰ تا ۲۰ باشد", "warning");
      await api.createScore({ teacher_assignment: Number(btn.dataset.assignment), student: Number(btn.dataset.student), value });
      toast("نمره ثبت شد", "success");
    } else {
      await api.createAttendance({ teacher_assignment: Number(btn.dataset.assignment), student: Number(btn.dataset.student), status: btn.dataset.status || "present" });
      toast(`${attendanceStatusLabel(btn.dataset.status)} ثبت شد`, "success");
    }
    await reload();
  } catch (error) {
    toast(error.message, "danger");
  }
}

function renderScores() {
  const action = account.role === "teacher" ? `<button class="btn btn-primary" id="addScoreBtn"><i class="bi bi-plus"></i> ثبت نمره</button>` : "";
  const searchId = "scoresSearchInput";
  const query = document.getElementById(searchId)?.value || "";
  const keepFocus = document.activeElement?.id === searchId;
  const rows = groupedCollection(account.scores || [], {
    query,
    emptyMessage: "نمره‌ای ثبت نشده است",
    emptyIcon: "bi-trophy",
    dateKey: (score) => dateKey(score.created_at),
    renderItem: (score) => card(
      smartTitle(escapeHtml(account.role === "teacher" ? score.student_name : score.lesson_name), "bi-trophy", `<button class="btn btn-sm btn-outline-primary ${account.role !== "teacher" ? "d-none" : ""}" data-score-edit="${score.id}">ویرایش</button>`),
      `<div class="metric-row">${meta("نمره", score.value, "bi-star-fill")}${meta("درس", score.lesson_name, "bi-book")}${meta("کلاس", score.class_name, "bi-people")}</div><small>${formatDate(score.created_at)}</small>`
    ),
  });
  setGroupedSection("last-fifty-score-header-text", "last-fifty-score-cards-div", "نمرات", action, searchId, "جستجو در نمرات، درس، کلاس یا دانش‌آموز", rows);
  $("addScoreBtn")?.addEventListener("click", openCreateScore);
  $(searchId)?.addEventListener("input", renderScores);
  if ($(searchId)) $(searchId).value = query;
  if (keepFocus) $(searchId)?.focus();
  document.querySelectorAll("[data-score-edit]").forEach((el) => el.addEventListener("click", () => openEditScore(Number(el.dataset.scoreEdit))));
}

function assignmentOptions() {
  return (account.teaching_assignments || []).map((a) => `<option value="${a.id}">${escapeHtml(assignmentLabel(a))}</option>`).join("");
}

function studentOptions() {
  return (account.students || []).map((s) => `<option value="${s.id}">${escapeHtml(s.name)} - ${escapeHtml(s.class_name || "")}</option>`).join("");
}

function openCreateScore() {
  openForm("ثبت نمره", `<form id="scoreForm">
    <label class="form-label">کلاس و درس</label><select class="form-control mb-3" name="assignment">${assignmentOptions()}</select>
    <label class="form-label">دانش‌آموز</label><select class="form-control mb-3" name="student">${studentOptions()}</select>
    <label class="form-label">نمره</label><input class="form-control mb-3" type="number" min="0" max="20" step="0.25" name="value">
    <button class="btn btn-primary w-100">ثبت</button></form>`);
  $("scoreForm").addEventListener("submit", async (event) => {
    event.preventDefault();
    const form = new FormData(event.target);
    await submit(() => api.createScore({ teacher_assignment: Number(form.get("assignment")), student: Number(form.get("student")), value: Number(form.get("value")) }), "نمره ثبت شد");
  });
}

function openEditScore(id) {
  const score = account.scores.find((item) => item.id === id);
  openForm("ویرایش نمره", `<form id="scoreEditForm">
    <input class="form-control mb-3" type="number" min="0" max="20" step="0.25" name="value" value="${score.value}">
    <div class="d-flex gap-2"><button class="btn btn-primary flex-fill">ذخیره</button><button class="btn btn-danger flex-fill" type="button" id="deleteScoreBtn">حذف</button></div></form>`);
  $("scoreEditForm").addEventListener("submit", async (event) => {
    event.preventDefault();
    await submit(() => api.updateScore(id, { value: Number(new FormData(event.target).get("value")) }), "نمره ویرایش شد");
  });
  $("deleteScoreBtn").addEventListener("click", () => submit(() => api.deleteScore(id), "نمره حذف شد"));
}

function renderHomeworks() {
  const action = account.role === "teacher" ? `<button class="btn btn-primary" id="addHomeworkBtn"><i class="bi bi-plus"></i> ایجاد تکلیف</button>` : "";
  const searchId = "homeworksSearchInput";
  const query = document.getElementById(searchId)?.value || "";
  const keepFocus = document.activeElement?.id === searchId;
  const rows = groupedCollection(account.homeworks || [], {
    query,
    emptyMessage: "تکلیفی ثبت نشده است",
    emptyIcon: "bi-book",
    dateKey: (homework) => dateKey(homework.created_at || homework.due_date),
    renderItem: (homework) => card(
      smartTitle(escapeHtml(homework.lesson_name), "bi-book", `<button class="btn btn-sm btn-outline-primary ${account.role !== "teacher" ? "d-none" : ""}" data-homework-edit="${homework.id}">ویرایش</button>`),
      `<p>${escapeHtml(homework.description).replace(/\n/g, "<br>")}</p><div class="metric-row">${meta("کلاس", homework.class_name, "bi-people")}${meta("مهلت", formatDate(homework.due_date), "bi-calendar-event")}</div>`
    ),
  });
  setGroupedSection("last-fifty-homework-header-text", "last-fifty-homework-cards-div", "تکالیف", action, searchId, "جستجو در تکلیف‌ها، درس، کلاس یا توضیحات", rows);
  $("addHomeworkBtn")?.addEventListener("click", openCreateHomework);
  $(searchId)?.addEventListener("input", renderHomeworks);
  if ($(searchId)) $(searchId).value = query;
  if (keepFocus) $(searchId)?.focus();
  document.querySelectorAll("[data-homework-edit]").forEach((el) => el.addEventListener("click", () => openEditHomework(Number(el.dataset.homeworkEdit))));
}

function openCreateHomework() {
  openForm("ایجاد تکلیف", `<form id="homeworkForm">
    <label class="form-label">کلاس و درس</label><select class="form-control mb-3" name="assignment">${assignmentOptions()}</select>
    <label class="form-label">مهلت</label><input class="form-control mb-3" type="text" data-jalali-date data-target="homeworkDueDate" placeholder="مثلا ۱۴۰۳/۰۷/۱۵" readonly><input type="hidden" id="homeworkDueDate" name="due_date" value="${todayIso()}">
    <label class="form-label">توضیحات</label><textarea class="form-control mb-3" name="description" rows="4"></textarea>
    <button class="btn btn-primary w-100">ایجاد</button></form>`);
  $("homeworkForm").addEventListener("submit", async (event) => {
    event.preventDefault();
    const form = new FormData(event.target);
    const assignment = account.teaching_assignments.find((item) => item.id === Number(form.get("assignment")));
    await submit(() => api.createHomework({ classobj: assignment.classobj_id, lesson: assignment.lesson_id, due_date: form.get("due_date"), description: form.get("description") }), "تکلیف ایجاد شد");
  });
}

function openEditHomework(id) {
  const homework = account.homeworks.find((item) => item.id === id);
  openForm("ویرایش تکلیف", `<form id="homeworkEditForm">
    <label class="form-label">مهلت</label><input class="form-control mb-3" type="text" data-jalali-date data-target="homeworkEditDueDate" readonly><input type="hidden" id="homeworkEditDueDate" name="due_date" value="${homework.due_date}">
    <textarea class="form-control mb-3" name="description" rows="4">${escapeHtml(homework.description)}</textarea>
    <div class="d-flex gap-2"><button class="btn btn-primary flex-fill">ذخیره</button><button class="btn btn-danger flex-fill" type="button" id="deleteHomeworkBtn">حذف</button></div></form>`);
  $("homeworkEditForm").addEventListener("submit", async (event) => {
    event.preventDefault();
    const form = new FormData(event.target);
    await submit(() => api.updateHomework(id, { due_date: form.get("due_date"), description: form.get("description") }), "تکلیف ویرایش شد");
  });
  $("deleteHomeworkBtn").addEventListener("click", () => submit(() => api.deleteHomework(id), "تکلیف حذف شد"));
}

function renderAttendances() {
  const action = account.role === "teacher" ? `<button class="btn btn-primary" id="addAttendanceBtn"><i class="bi bi-plus"></i> ثبت حضور و غیاب</button>` : "";
  const searchId = "attendancesSearchInput";
  const query = document.getElementById(searchId)?.value || "";
  const keepFocus = document.activeElement?.id === searchId;
  const rows = groupedCollection(account.attendances || [], {
    query,
    emptyMessage: "رکورد حضور و غیابی ثبت نشده است",
    emptyIcon: "bi-calendar-check",
    dateKey: (attendance) => dateKey(attendance.created_at),
    renderItem: (attendance) => card(
      smartTitle(escapeHtml(account.role === "teacher" ? attendance.student_name : attendance.lesson_name), "bi-calendar-check", `<button class="btn btn-sm btn-outline-danger ${account.role !== "teacher" ? "d-none" : ""}" data-attendance-delete="${attendance.id}">حذف</button>`),
      `<div class="metric-row">${attendanceStatusBadge(attendance.status)}${meta("درس", attendance.lesson_name, "bi-book")}${meta("کلاس", attendance.class_name, "bi-people")}${meta("تاریخ", formatDate(attendance.created_at), "bi-clock")}</div>`
    ),
  });
  setGroupedSection("last-fifty-attendance-header-text", "last-fifty-attendance-cards-div", "حضور و غیاب", action, searchId, "جستجو در حضور و غیاب، کلاس، درس، دانش‌آموز یا وضعیت", rows);
  $("addAttendanceBtn")?.addEventListener("click", openCreateAttendance);
  $(searchId)?.addEventListener("input", renderAttendances);
  if ($(searchId)) $(searchId).value = query;
  if (keepFocus) $(searchId)?.focus();
  document.querySelectorAll("[data-attendance-delete]").forEach((el) => el.addEventListener("click", () => submit(() => api.deleteAttendance(Number(el.dataset.attendanceDelete)), "حضور حذف شد")));
}

function openCreateAttendance() {
  openForm("ثبت حضور و غیاب", `<form id="attendanceForm">
    <label class="form-label">کلاس و درس</label><select class="form-control mb-3" name="assignment">${assignmentOptions()}</select>
    <label class="form-label">دانش‌آموز</label><select class="form-control mb-3" name="student">${studentOptions()}</select>
    <label class="form-label">وضعیت</label><select class="form-control mb-3" name="status"><option value="present">حاضر</option><option value="absent">غایب</option></select>
    <button class="btn btn-primary w-100">ثبت وضعیت</button></form>`);
  $("attendanceForm").addEventListener("submit", async (event) => {
    event.preventDefault();
    const form = new FormData(event.target);
    await submit(() => api.createAttendance({ teacher_assignment: Number(form.get("assignment")), student: Number(form.get("student")), status: form.get("status") }), "وضعیت حضور و غیاب ثبت شد");
  });
}

function renderComments() {
  const action = account.role === "teacher" ? `<button class="btn btn-primary" id="addCommentBtn"><i class="bi bi-plus"></i> ثبت پیام</button>` : "";
  const rows = (account.comments || []).map((comment) => card(
    smartTitle(escapeHtml(account.role === "teacher" ? comment.student_name : comment.teacher_name), "bi-chat-dots", `<button class="btn btn-sm btn-outline-primary ${account.role !== "teacher" ? "d-none" : ""}" data-comment-edit="${comment.id}">ویرایش</button>`),
    `<p>${escapeHtml(comment.message).replace(/\n/g, "<br>")}</p><div class="metric-row"><span class="badge ${comment.checked ? "bg-success" : "bg-warning text-dark"}">${comment.checked ? "خوانده شده" : "جدید"}</span>${meta("تاریخ", formatDate(comment.created_at), "bi-clock")}</div>`
  )).join("") || emptyState("پیامی ثبت نشده است", "bi-chat-dots");
  setSection("last-fifty-comments-header-text", "last-fifty-comments-cards-div", "پیام‌ها", action, rows);
  $("addCommentBtn")?.addEventListener("click", openCreateComment);
  document.querySelectorAll("[data-comment-edit]").forEach((el) => el.addEventListener("click", () => openEditComment(Number(el.dataset.commentEdit))));
}

function openCreateComment() {
  openForm("ثبت پیام", `<form id="commentForm">
    <label class="form-label">دانش‌آموز</label><select class="form-control mb-3" name="student">${studentOptions()}</select>
    <label class="form-label">متن پیام</label><textarea class="form-control mb-3" name="message" rows="4"></textarea>
    <button class="btn btn-primary w-100">ثبت</button></form>`);
  $("commentForm").addEventListener("submit", async (event) => {
    event.preventDefault();
    const form = new FormData(event.target);
    await submit(() => api.createComment({ student: Number(form.get("student")), message: form.get("message") }), "پیام ثبت شد");
  });
}

function openEditComment(id) {
  const comment = account.comments.find((item) => item.id === id);
  openForm("ویرایش پیام", `<form id="commentEditForm">
    <textarea class="form-control mb-3" name="message" rows="4">${escapeHtml(comment.message)}</textarea>
    <div class="d-flex gap-2"><button class="btn btn-primary flex-fill">ذخیره</button><button class="btn btn-danger flex-fill" type="button" id="deleteCommentBtn">حذف</button></div></form>`);
  $("commentEditForm").addEventListener("submit", async (event) => {
    event.preventDefault();
    await submit(() => api.updateComment(id, { message: new FormData(event.target).get("message") }), "پیام ویرایش شد");
  });
  $("deleteCommentBtn").addEventListener("click", () => submit(() => api.deleteComment(id), "پیام حذف شد"));
}

async function submit(action, message) {
  try {
    await action();
    toast(message, "success");
    closeForm();
    await reload();
  } catch (error) {
    toast(error.message, "danger");
  }
}

function renderAll() {
  renderProfile();
  renderHome();
  renderScores();
  renderHomeworks();
  renderAttendances();
  renderComments();
  updateMessageBadge();
}

async function reload() {
  account = await api.account();
  renderAll();
}

function initNavigation() {
  const profileButton = document.querySelector(".profile-button");
  const dropdown = document.querySelector(".dropdown-content");
  profileButton.addEventListener("click", (event) => {
    event.stopPropagation();
    dropdown.classList.toggle("show");
  });
  document.addEventListener("click", (event) => {
    if (!dropdown.contains(event.target) && !profileButton.contains(event.target)) dropdown.classList.remove("show");
  });
  document.querySelectorAll("[data-page]").forEach((item) => item.addEventListener("click", (event) => {
    event.preventDefault();
    const pageId = item.dataset.page;
    document.querySelectorAll(".nav-item").forEach((nav) => nav.classList.toggle("active", nav.dataset.page === pageId));
    document.querySelectorAll(".page").forEach((page) => {
      page.classList.toggle("active", page.id === pageId);
      if (page.id === pageId) {
        page.style.animation = "none";
        page.offsetHeight;
        page.style.animation = "";
      }
    });
    history.replaceState(null, "", `#${pageId}`);
    $("tabs-content")?.scrollTo({ top: 0, behavior: "smooth" });
    if (pageId === "messages") void markUnreadCommentsRead();
    dropdown.classList.remove("show");
  }));
}

async function boot() {
  applyTheme(preferredTheme());
  initNavigation();
  $("themeToggle")?.addEventListener("click", toggleTheme);
  $("logoutButton").addEventListener("click", () => {
    logout();
    showLogin();
  });
  $("loginForm").addEventListener("submit", async (event) => {
    event.preventDefault();
    try {
      $("login-form-submit-button").disabled = true;
      await login($("typeUsernameX").value, $("typePasswordX").value);
      showDashboard();
      await reload();
    } catch (error) {
      toast(error.message, "danger");
    } finally {
      $("login-form-submit-button").disabled = false;
    }
  });

  if (!hasToken()) {
    showLogin();
    hideSplash();
    return;
  }

  try {
    showDashboard();
    await reload();
  } catch {
    logout();
    showLogin();
  } finally {
    hideSplash();
  }
}

document.addEventListener("DOMContentLoaded", boot);








