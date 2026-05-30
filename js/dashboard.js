const state = {
  user: { user_id: "", name: "", role: "", avatar_url: "" },
  courses: [],
  searchResult: null,
};

const $ = (id) => document.getElementById(id);

function formatDate(raw) {
  if (!raw) return "";
  const d = new Date(raw);
  if (Number.isNaN(d.getTime())) return "";
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${mm}-${dd}`;
}

function avatarFullUrl(url) {
  if (!url) return "";
  if (url.startsWith("http")) return url;
  return `${CONFIG.API_BASE_URL}${url}`;
}

function isStudentOrTa(role) {
  return role === "student" || role === "ta";
}

function openCourse(courseCode) {
  const base = (CONFIG.MAIN_APP_URL || "").replace(/\/$/, "");
  if (base) {
    window.location.href = `${base}/course/${courseCode}`;
  } else {
    alert(`課程代碼：${courseCode}\n\n若需進入完整課程頁，請在 js/config.js 設定 MAIN_APP_URL（Vue 前端網址）。`);
  }
}

function loadUser() {
  state.user.user_id = getUser() || "使用者";
  state.user.name = state.user.user_id;
  $("userMenuTrigger").textContent = `${state.user.user_id} ▾`;
  $("profileId").textContent = state.user.user_id;
  $("profileName").textContent = state.user.name;
  return true;
}

function renderToolbar() {
  const toolbar = $("courseToolbar");
  toolbar.innerHTML = "";

  if (isStudentOrTa(state.user.role)) {
    const input = document.createElement("input");
    input.type = "text";
    input.id = "searchText";
    input.placeholder = "輸入課程ID或名稱";
    input.className = "input-box";
    input.style.cssText = "width:160px;font-size:12px;padding:4px 8px;";

    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "btn btn-secondary";
    btn.textContent = "加入課程";
    btn.addEventListener("click", searchCourse);

    toolbar.append(input, btn);
  } else {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "btn btn-secondary";
    btn.textContent = "建立課程";
    btn.addEventListener("click", () => openModal("create"));
    toolbar.appendChild(btn);
  }
}

function renderCourses() {
  const grid = $("courseGrid");
  const empty = $("courseEmpty");
  grid.innerHTML = "";

  if (!state.courses.length) {
    empty.classList.remove("hidden");
    return;
  }
  empty.classList.add("hidden");

  state.courses.forEach((course) => {
    const card = document.createElement("div");
    card.className = "course-card";
    card.addEventListener("click", () => openCourse(course.course_code));

    const teachers =
      course.teachers && course.teachers.length
        ? course.teachers.map((t) => t.name).join("、")
        : "尚未指派";

    card.innerHTML = `
      <div class="course-card-thumb">✔ Course</div>
      <div class="course-card-body">
        <h4>${escapeHtml(course.course_name)}</h4>
        <p>老師: ${escapeHtml(teachers)}</p>
        <p>學年度: ${escapeHtml(course.academic_year || "未提供")}</p>
        <p>代碼: ${escapeHtml(course.course_code)}</p>
      </div>
    `;
    grid.appendChild(card);
  });
}

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str ?? "";
  return div.innerHTML;
}

async function fetchMyCourses() {
  try {
    state.courses = await api.get("/api/courses/user");
  } catch {
    console.error("取得課程失敗");
    state.courses = [];
  }
  renderCourses();
}

async function fetchLatestAnnouncements() {
  const loading = $("announceLoading");
  const list = $("announceList");
  const empty = $("announceEmpty");

  if (!state.courses.length) {
    loading.classList.add("hidden");
    list.classList.add("hidden");
    empty.classList.remove("hidden");
    return;
  }

  loading.classList.remove("hidden");
  list.classList.add("hidden");
  empty.classList.add("hidden");

  try {
    const results = await Promise.all(
      state.courses.map(async (course) => {
        try {
          const res = await api.get(`/api/courses/${course.course_code}/announcements`);
          const items = res.announcements || [];
          return items.map((item) => ({
            id: item.id,
            title: item.title,
            created_at: item.created_at,
            courseCode: course.course_code,
            courseName: course.course_name,
            isNew: item.isNew,
          }));
        } catch {
          return [];
        }
      }),
    );

    const merged = results.flat();
    merged.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    const top = merged.slice(0, 3);

    list.innerHTML = "";
    top.forEach((item) => {
      const li = document.createElement("li");
      li.innerHTML = `
        <span class="announce-course">[${escapeHtml(item.courseName || item.courseCode)}]</span>
        ${formatDate(item.created_at)} ${escapeHtml(item.title)}
        ${item.isNew ? '<span class="badge-new">NEW</span>' : ""}
      `;
      li.addEventListener("click", () => openCourse(item.courseCode));
      list.appendChild(li);
    });

    loading.classList.add("hidden");
    if (top.length) {
      list.classList.remove("hidden");
      empty.classList.add("hidden");
    } else {
      empty.classList.remove("hidden");
    }
  } catch {
    loading.classList.add("hidden");
    empty.classList.remove("hidden");
  }
}

async function searchCourse() {
  const input = $("searchText");
  if (!input || !input.value.trim()) {
    alert("請輸入課程ID或名稱");
    return;
  }

  const text = input.value.trim();
  const isCourseCode = /^[A-Za-z]{2}\d+/.test(text);
  const query = isCourseCode ? `code=${encodeURIComponent(text)}` : `name=${encodeURIComponent(text)}`;

  try {
    state.searchResult = await api.get(`/api/courses?${query}`);
    input.value = "";
    openModal("enroll");
  } catch {
    state.searchResult = null;
    alert("找不到課程");
  }
}

function openModal(mode) {
  const overlay = $("modalOverlay");
  const studentBody = $("modalStudentBody");
  const teacherBody = $("modalTeacherBody");
  const enrollBtn = $("modalEnroll");
  const createBtn = $("modalCreate");

  overlay.classList.add("show");

  if (mode === "enroll" && state.searchResult) {
    $("modalTitle").textContent = "課程資訊";
    studentBody.classList.remove("hidden");
    teacherBody.classList.add("hidden");
    enrollBtn.classList.remove("hidden");
    createBtn.classList.add("hidden");

    const t = state.searchResult;
    const teachers =
      t.teachers && t.teachers.length
        ? `<ul>${t.teachers.map((x) => `<li>${escapeHtml(x.name)}</li>`).join("")}</ul>`
        : "<ul><li>尚未指派老師</li></ul>";

    $("searchResultContent").innerHTML = `
      <p><strong>課程名稱：</strong>${escapeHtml(t.course_name)}</p>
      <p><strong>課程代碼：</strong>${escapeHtml(t.course_code)}</p>
      <p><strong>學年度：</strong>${escapeHtml(t.academic_year)}</p>
      <p><strong>描述：</strong>${escapeHtml(t.description || "無")}</p>
      <p><strong>授課老師：</strong></p>${teachers}
    `;
  } else {
    $("modalTitle").textContent = "建立課程";
    studentBody.classList.add("hidden");
    teacherBody.classList.remove("hidden");
    enrollBtn.classList.add("hidden");
    createBtn.classList.remove("hidden");
    $("formCourseName").value = "";
    $("formCourseCode").value = "";
    $("formAcademicYear").value = "";
    $("formDescription").value = "";
  }
}

function closeModal() {
  $("modalOverlay").classList.remove("show");
}

async function addCourse() {
  if (!state.searchResult) return;
  try {
    const res = await api.post("/api/courses/enroll", {
      course_code: state.searchResult.course_code,
    });
    alert(res.message || "已加入課程");
    closeModal();
    await fetchMyCourses();
    await fetchLatestAnnouncements();
  } catch (err) {
    alert(err.data?.message || err.message || "選課失敗");
  }
}

async function createCourse() {
  const course_name = $("formCourseName").value.trim();
  const course_code = $("formCourseCode").value.trim();
  const academic_year = $("formAcademicYear").value.trim();
  const description = $("formDescription").value.trim();

  if (!course_name || !course_code || !academic_year) {
    alert("請填寫課程名稱、課程代碼與學年度");
    return;
  }

  try {
    const res = await api.post("/api/courses", {
      course_name,
      course_code,
      academic_year,
      description,
    });
    alert(res.message || "課程已建立");
    closeModal();
    await fetchMyCourses();
    await fetchLatestAnnouncements();
  } catch (err) {
    alert(err.data?.message || err.message || "建立課程失敗");
  }
}

$("userMenuTrigger").addEventListener("click", () => {
  $("userMenu").classList.toggle("open");
});

document.addEventListener("click", (e) => {
  if (!$("userMenu").contains(e.target)) {
    $("userMenu").classList.remove("open");
  }
});

$("logoutBtn").addEventListener("click", () => {
  clearAuth();
  window.location.href = "login.html";
});

$("modalCancel").addEventListener("click", closeModal);
$("modalOverlay").addEventListener("click", (e) => {
  if (e.target === $("modalOverlay")) closeModal();
});
$("modalEnroll").addEventListener("click", addCourse);
$("modalCreate").addEventListener("click", createCourse);

(async function init() {
  loadUser();
  renderToolbar();
  await fetchMyCourses();
  await fetchLatestAnnouncements();
})();
