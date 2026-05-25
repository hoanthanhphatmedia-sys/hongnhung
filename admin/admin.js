const passwordKey = "hnbds_admin_password";

let state = { site: null, projects: [] };
let currentProjectIndex = 0;
let pendingAssets = [];
let dirty = false;

const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

const panels = {
  site: "Thông tin chung",
  home: "Trang chủ",
  about: "Giới thiệu",
  contact: "Liên hệ",
  projects: "Dự án",
};

function escapeHtml(value = "") {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function getPath(obj, path) {
  return path.split(".").reduce((acc, key) => (acc == null ? acc : acc[key]), obj);
}

function setPath(obj, path, value) {
  const parts = path.split(".");
  const last = parts.pop();
  const target = parts.reduce((acc, key) => acc[key], obj);
  target[last] = value;
}

function markDirty() {
  dirty = true;
  setStatus("Có thay đổi chưa lưu", "");
}

function setStatus(text, type = "") {
  const status = $("#statusText");
  status.textContent = text;
  status.className = `status ${type}`.trim();
}

function field(path, label, options = {}) {
  const value = getPath(state, path) ?? "";
  const type = options.type || "text";
  const input = type === "textarea"
    ? `<textarea data-path="${escapeHtml(path)}" ${options.rows ? `rows="${options.rows}"` : ""}>${escapeHtml(value)}</textarea>`
    : `<input data-path="${escapeHtml(path)}" data-type="${escapeHtml(type)}" type="${type === "number" ? "number" : "text"}" value="${escapeHtml(value)}" />`;
  return `<label class="${options.className || ""}">${escapeHtml(label)}${input}</label>`;
}

function checkbox(path, label) {
  const checked = getPath(state, path) ? "checked" : "";
  return `<label><input data-path="${escapeHtml(path)}" data-type="checkbox" type="checkbox" ${checked} /> ${escapeHtml(label)}</label>`;
}

function bindInputs(root = document) {
  $$("[data-path]", root).forEach((input) => {
    input.addEventListener("input", () => {
      const type = input.dataset.type;
      const value = type === "number" ? Number(input.value || 0) : type === "checkbox" ? input.checked : input.value;
      setPath(state, input.dataset.path, value);
      markDirty();
    });
    input.addEventListener("change", () => {
      const type = input.dataset.type;
      if (type === "checkbox") {
        setPath(state, input.dataset.path, input.checked);
        markDirty();
      }
    });
  });
}

function renderAll() {
  renderSite();
  renderHome();
  renderAbout();
  renderContact();
  renderProjects();
  bindInputs();
}

function renderSite() {
  const panel = $('[data-panel="site"]');
  panel.innerHTML = `
    <div class="box">
      <h3>Thương hiệu</h3>
      <div class="grid">
        ${field("site.brand", "Tên thương hiệu")}
        ${field("site.logo", "Logo chính")}
        ${field("site.logoDark", "Logo nền tối")}
      </div>
    </div>
    <div class="box">
      <h3>Liên hệ toàn site</h3>
      <div class="grid">
        ${field("site.contact.phone", "Số điện thoại dạng máy đọc")}
        ${field("site.contact.phoneDisplay", "Số điện thoại hiển thị")}
        ${field("site.contact.email", "Email")}
        ${field("site.contact.office", "Văn phòng")}
        ${field("site.contact.areas", "Khu vực hoạt động", { className: "span-2" })}
        ${field("site.contact.zalo", "Link Zalo")}
        ${field("site.contact.facebookPage", "Fanpage Facebook")}
        ${field("site.contact.facebookPersonal", "Facebook cá nhân")}
      </div>
    </div>
    <div class="box">
      <h3>Loại hình BĐS</h3>
      <p>Mỗi dòng là một loại hình trong menu và bộ lọc.</p>
      <textarea id="navTypesText" rows="7">${escapeHtml((state.site.navTypes || []).join("\n"))}</textarea>
    </div>
  `;
  $("#navTypesText", panel).addEventListener("input", (event) => {
    state.site.navTypes = event.target.value.split("\n").map((item) => item.trim()).filter(Boolean);
    markDirty();
  });
}

function renderHome() {
  const panel = $('[data-panel="home"]');
  panel.innerHTML = `
    <div class="box">
      <h3>Hero trang chủ</h3>
      <div class="grid">
        ${field("site.home.title", "Thẻ title SEO", { className: "span-2" })}
        ${field("site.home.description", "Meta description", { type: "textarea", rows: 3, className: "span-2" })}
        ${field("site.home.heroVideo", "Video hero")}
        ${field("site.home.eyebrow", "Dòng nhỏ trên tiêu đề")}
        ${field("site.home.heading", "Tiêu đề chính", { className: "span-2" })}
        ${field("site.home.lead", "Mô tả ngắn", { type: "textarea", rows: 3, className: "span-2" })}
      </div>
    </div>
    <div class="box">
      <h3>Bất động sản nổi bật</h3>
      ${field("site.home.featuredTitle", "Tiêu đề khu vực")}
      <label>Slug dự án nổi bật, mỗi dòng một slug
        <textarea id="featuredSlugsText" rows="7">${escapeHtml((state.site.home.featuredSlugs || []).join("\n"))}</textarea>
      </label>
    </div>
    <div class="box">
      <h3>Khối giới thiệu ngắn</h3>
      <p>Đây là HTML nội dung nằm trong khối “Về tôi” ở trang chủ.</p>
      ${field("site.home.aboutStripHtml", "HTML khối giới thiệu", { type: "textarea", rows: 12 })}
    </div>
    <div class="box">
      <h3>Cảm nhận khách hàng</h3>
      ${field("site.home.testimonialsTitle", "Tiêu đề khu vực")}
      <div id="testimonialRows">${testimonialRows()}</div>
      <button class="small-btn" id="addTestimonial" type="button">Thêm cảm nhận</button>
    </div>
  `;
  $("#featuredSlugsText", panel).addEventListener("input", (event) => {
    state.site.home.featuredSlugs = event.target.value.split("\n").map((item) => item.trim()).filter(Boolean);
    markDirty();
  });
  $("#addTestimonial", panel).addEventListener("click", () => {
    state.site.home.testimonials.push({ quote: "", author: "Khách hàng" });
    renderHome();
    bindInputs(panel);
    markDirty();
  });
  bindListButtons(panel, "site.home.testimonials", renderHome);
}

function testimonialRows() {
  return (state.site.home.testimonials || []).map((item, index) => `
    <div class="row">
      <label>Cảm nhận
        <textarea data-path="site.home.testimonials.${index}.quote" rows="3">${escapeHtml(item.quote)}</textarea>
      </label>
      <label>Người nói
        <input data-path="site.home.testimonials.${index}.author" value="${escapeHtml(item.author || "")}" />
      </label>
      <button class="danger" data-remove-index="${index}" data-array-path="site.home.testimonials" type="button">Xóa</button>
    </div>
  `).join("");
}

function renderAbout() {
  const panel = $('[data-panel="about"]');
  panel.innerHTML = `
    <div class="box">
      <h3>Trang giới thiệu</h3>
      <div class="grid">
        ${field("site.about.title", "Thẻ title SEO", { className: "span-2" })}
        ${field("site.about.description", "Meta description", { type: "textarea", rows: 3, className: "span-2" })}
        ${field("site.about.pageTitle", "Tiêu đề trang")}
        ${field("site.about.pageLead", "Mô tả dưới tiêu đề")}
        ${field("site.about.bodyHtml", "Nội dung HTML", { type: "textarea", rows: 24, className: "span-2" })}
      </div>
    </div>
  `;
}

function renderContact() {
  const panel = $('[data-panel="contact"]');
  panel.innerHTML = `
    <div class="box">
      <h3>Trang liên hệ</h3>
      <div class="grid">
        ${field("site.contactPage.title", "Thẻ title SEO", { className: "span-2" })}
        ${field("site.contactPage.description", "Meta description", { type: "textarea", rows: 3, className: "span-2" })}
        ${field("site.contactPage.pageTitle", "Tiêu đề trang")}
        ${field("site.contactPage.pageLead", "Mô tả dưới tiêu đề")}
        ${field("site.contactPage.formAction", "Form action", { className: "span-2" })}
      </div>
    </div>
  `;
}

function renderProjects() {
  const panel = $('[data-panel="projects"]');
  const selected = state.projects[currentProjectIndex] || state.projects[0];
  if (!selected) {
    panel.innerHTML = `<div class="box"><h3>Chưa có dự án</h3><button class="small-btn" id="newProject">Thêm dự án</button></div>`;
    $("#newProject", panel).addEventListener("click", addProject);
    return;
  }
  currentProjectIndex = state.projects.indexOf(selected);
  panel.innerHTML = `
    <div class="project-layout">
      <aside class="project-list">
        <select id="projectSelect" size="18">
          ${state.projects.map((project, index) => `<option value="${index}" ${index === currentProjectIndex ? "selected" : ""}>${escapeHtml(project.name)}</option>`).join("")}
        </select>
        <button class="small-btn" id="newProject" type="button">Thêm dự án</button>
        <button class="small-btn danger" id="deleteProject" type="button">Xóa dự án</button>
      </aside>
      <section>
        ${projectForm(selected, currentProjectIndex)}
      </section>
    </div>
  `;
  $("#projectSelect", panel).addEventListener("change", (event) => {
    currentProjectIndex = Number(event.target.value);
    renderProjects();
    bindInputs(panel);
  });
  $("#newProject", panel).addEventListener("click", addProject);
  $("#deleteProject", panel).addEventListener("click", deleteProject);
  bindPairButtons(panel);
  bindImageUpload(panel);
}

function projectForm(project, index) {
  const image = project.hero?.image || project.img || "";
  return `
    <div class="box">
      <h3>Thông tin danh mục</h3>
      <div class="grid">
        ${field(`projects.${index}.name`, "Tên dự án")}
        ${field(`projects.${index}.slug`, "Slug URL")}
        ${field(`projects.${index}.type`, "Loại hình")}
        ${field(`projects.${index}.addr`, "Địa chỉ")}
        ${field(`projects.${index}.price`, "Giá hiển thị")}
        ${field(`projects.${index}.area`, "Diện tích số", { type: "number" })}
        ${field(`projects.${index}.beds`, "Số phòng ngủ", { type: "number" })}
        ${field(`projects.${index}.baths`, "Số phòng VS", { type: "number" })}
        ${field(`projects.${index}.img`, "Ảnh card")}
        ${field(`projects.${index}.meta`, "Mô tả ngắn trên card")}
      </div>
    </div>
    <div class="box">
      <h3>SEO và hero</h3>
      <div class="grid">
        ${field(`projects.${index}.title`, "Thẻ title SEO", { className: "span-2" })}
        ${field(`projects.${index}.description`, "Meta description", { type: "textarea", rows: 3, className: "span-2" })}
        ${field(`projects.${index}.hero.eyebrow`, "Dòng nhỏ hero")}
        ${field(`projects.${index}.hero.title`, "Tiêu đề hero")}
        ${field(`projects.${index}.hero.address`, "Địa chỉ hero")}
        ${field(`projects.${index}.hero.image`, "Ảnh hero")}
      </div>
      <label>Upload ảnh mới
        <input id="projectImageUpload" type="file" accept="image/*" />
      </label>
      ${image ? `<img class="asset-preview" src="/${escapeHtml(image)}" alt="">` : ""}
      <p class="muted">Ảnh upload sẽ được commit vào GitHub khi bấm “Lưu & xuất bản”. Nên dùng ảnh đã nén dưới 4 MB.</p>
    </div>
    <div class="box">
      <h3>Thông số dự án</h3>
      <div id="specRows">${pairRows(project.specs || [], `projects.${index}.specs`)}</div>
      <button class="small-btn" data-add-pair="projects.${index}.specs" type="button">Thêm dòng thông số</button>
    </div>
    <div class="box">
      <h3>Khối thông tin sản phẩm & báo giá</h3>
      <div class="grid">
        ${field(`projects.${index}.contactBox.heading`, "Tiêu đề khối")}
        ${field(`projects.${index}.contactBox.priceLabel`, "Nhãn giá")}
        ${field(`projects.${index}.contactBox.priceValue`, "Giá trị giá")}
      </div>
      <div id="contactRows">${pairRows(project.contactBox?.items || [], `projects.${index}.contactBox.items`)}</div>
      <button class="small-btn" data-add-pair="projects.${index}.contactBox.items" type="button">Thêm dòng thông tin</button>
    </div>
    <div class="box">
      <h3>Nội dung chi tiết</h3>
      ${field(`projects.${index}.contentHtml`, "HTML nội dung", { type: "textarea", rows: 24 })}
    </div>
    <div class="box">
      <h3>CTA cuối trang</h3>
      ${field(`projects.${index}.cta.title`, "Tiêu đề CTA")}
      ${field(`projects.${index}.cta.text`, "Mô tả CTA", { type: "textarea", rows: 4 })}
    </div>
  `;
}

function pairRows(items, basePath) {
  return items.map((item, index) => `
    <div class="row">
      <label>Nhãn
        <input data-path="${basePath}.${index}.label" value="${escapeHtml(item.label || "")}" />
      </label>
      <label>Giá trị
        <input data-path="${basePath}.${index}.value" value="${escapeHtml(item.value || "")}" />
      </label>
      <div>
        ${checkbox(`${basePath}.${index}.muted`, "Đang cập nhật")}
        <button class="danger" data-remove-index="${index}" data-array-path="${basePath}" type="button">Xóa</button>
      </div>
    </div>
  `).join("");
}

function bindListButtons(root, arrayPath, rerender) {
  $$(`[data-array-path="${arrayPath}"]`, root).forEach((button) => {
    button.addEventListener("click", () => {
      getPath(state, arrayPath).splice(Number(button.dataset.removeIndex), 1);
      rerender();
      bindInputs($(`[data-panel="${currentView()}"]`));
      markDirty();
    });
  });
}

function bindPairButtons(root) {
  $$("[data-add-pair]", root).forEach((button) => {
    button.addEventListener("click", () => {
      getPath(state, button.dataset.addPair).push({ label: "", value: "", muted: false });
      renderProjects();
      bindInputs($('[data-panel="projects"]'));
      markDirty();
    });
  });
  $$("[data-array-path]", root).forEach((button) => {
    button.addEventListener("click", () => {
      getPath(state, button.dataset.arrayPath).splice(Number(button.dataset.removeIndex), 1);
      renderProjects();
      bindInputs($('[data-panel="projects"]'));
      markDirty();
    });
  });
}

function bindImageUpload(root) {
  const input = $("#projectImageUpload", root);
  if (!input) return;
  input.addEventListener("change", async () => {
    const file = input.files?.[0];
    if (!file) return;
    const project = state.projects[currentProjectIndex];
    const ext = (file.name.split(".").pop() || "jpg").toLowerCase().replace(/[^a-z0-9]/g, "") || "jpg";
    const assetPath = `assets/img/${slugify(project.slug || project.name)}.${ext}`;
    const dataUrl = await fileToDataUrl(file);
    const base64 = dataUrl.split(",")[1];
    pendingAssets = pendingAssets.filter((asset) => asset.path !== assetPath);
    pendingAssets.push({ path: assetPath, content: base64, encoding: "base64" });
    project.img = assetPath;
    project.hero.image = assetPath;
    markDirty();
    renderProjects();
    bindInputs($('[data-panel="projects"]'));
    setStatus(`Đã chọn ảnh ${assetPath}. Bấm lưu để đưa lên GitHub.`, "");
  });
}

function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function slugify(value) {
  return String(value || "du-an-moi")
    .normalize("NFD")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") || "du-an-moi";
}

function addProject() {
  const name = window.prompt("Tên dự án mới?");
  if (!name) return;
  const slugBase = slugify(name);
  let slug = slugBase;
  let n = 2;
  while (state.projects.some((project) => project.slug === slug)) slug = `${slugBase}-${n++}`;
  const maxId = Math.max(0, ...state.projects.map((project) => Number(project.id || 0)));
  state.projects.push({
    id: maxId + 1,
    slug,
    type: state.site.navTypes?.[0] || "Căn hộ",
    name,
    addr: "Đang cập nhật",
    price: "Liên hệ",
    beds: 0,
    baths: 0,
    area: 0,
    img: "assets/img/placeholder.jpg",
    meta: "Đang cập nhật",
    title: `${name} | ${state.site.brand}`,
    description: `${name} - liên hệ ${state.site.brand} để nhận tư vấn.`,
    hero: { image: "assets/img/placeholder.jpg", eyebrow: "Đang cập nhật", title: name, address: "Đang cập nhật" },
    specs: [{ label: "Loại hình", value: state.site.navTypes?.[0] || "Căn hộ", muted: false }],
    contactBox: {
      heading: "Thông tin sản phẩm & Báo giá",
      items: [{ label: "Diện tích", value: "Đang cập nhật", muted: true }],
      priceLabel: "Giá",
      priceValue: "Liên hệ Hotline",
    },
    contentHtml: "<h2>Tổng quan dự án</h2>\n<p><em>Đang cập nhật nội dung chi tiết.</em></p>",
    cta: { title: `Nhận tư vấn chi tiết về ${name}`, text: "Vui lòng để lại thông tin hoặc gọi trực tiếp để nhận tư vấn." },
  });
  currentProjectIndex = state.projects.length - 1;
  renderProjects();
  bindInputs($('[data-panel="projects"]'));
  markDirty();
}

function deleteProject() {
  const project = state.projects[currentProjectIndex];
  if (!project) return;
  if (!window.confirm(`Xóa dự án "${project.name}" khỏi dữ liệu?`)) return;
  state.projects.splice(currentProjectIndex, 1);
  currentProjectIndex = Math.max(0, currentProjectIndex - 1);
  renderProjects();
  bindInputs($('[data-panel="projects"]'));
  markDirty();
}

function currentView() {
  return $(".tabs button.active")?.dataset.view || "site";
}

async function loadContent() {
  setStatus("Đang tải dữ liệu...", "");
  try {
    const response = await fetch("/api/content", {
      headers: { "x-admin-password": sessionStorage.getItem(passwordKey) || "" },
    });
    if (!response.ok) throw new Error(`API trả về ${response.status}`);
    state = await response.json();
    afterLoad("Đã tải dữ liệu từ Vercel API.");
  } catch (error) {
    const [siteRes, projectsRes] = await Promise.all([
      fetch("/content/site.json"),
      fetch("/content/projects.json"),
    ]);
    if (!siteRes.ok || !projectsRes.ok) throw error;
    state = { site: await siteRes.json(), projects: await projectsRes.json() };
    afterLoad("Đang xem dữ liệu tĩnh. Lưu chỉ hoạt động sau khi deploy lên Vercel.", "error");
  }
}

function afterLoad(message, type = "ok") {
  $("#loginPanel").classList.add("hidden");
  $("#app").classList.remove("hidden");
  renderAll();
  dirty = false;
  setStatus(message, type);
  $("#statusKicker").textContent = `${state.projects.length} dự án`;
}

async function saveContent() {
  if (!state.site || !state.projects) return;
  setStatus("Đang commit thay đổi lên GitHub...", "");
  $("#saveBtn").disabled = true;
  try {
    const response = await fetch("/api/save", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-admin-password": sessionStorage.getItem(passwordKey) || "",
      },
      body: JSON.stringify({ site: state.site, projects: state.projects, assets: pendingAssets }),
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(result.error || `API trả về ${response.status}`);
    pendingAssets = [];
    dirty = false;
    setStatus("Đã lưu lên GitHub. Vercel sẽ tự deploy lại trong ít phút.", "ok");
  } catch (error) {
    setStatus(`Lưu thất bại: ${error.message}`, "error");
  } finally {
    $("#saveBtn").disabled = false;
  }
}

function switchPanel(view) {
  $$(".tabs button").forEach((button) => button.classList.toggle("active", button.dataset.view === view));
  $$(".panel").forEach((panel) => panel.classList.toggle("active", panel.dataset.panel === view));
  $("#panelTitle").textContent = panels[view] || "Quản trị";
}

function init() {
  $("#loginForm").addEventListener("submit", async (event) => {
    event.preventDefault();
    sessionStorage.setItem(passwordKey, $("#adminPassword").value);
    try {
      await loadContent();
    } catch (error) {
      setStatus(`Không tải được dữ liệu: ${error.message}`, "error");
      $("#statusText").textContent = "";
      alert(`Không tải được dữ liệu: ${error.message}`);
    }
  });

  $$(".tabs button").forEach((button) => {
    button.addEventListener("click", () => switchPanel(button.dataset.view));
  });

  $("#saveBtn").addEventListener("click", saveContent);
  $("#logoutBtn").addEventListener("click", () => {
    sessionStorage.removeItem(passwordKey);
    location.reload();
  });

  const savedPassword = sessionStorage.getItem(passwordKey);
  if (savedPassword) {
    $("#adminPassword").value = savedPassword;
    loadContent().catch(() => {
      $("#loginPanel").classList.remove("hidden");
      $("#app").classList.add("hidden");
    });
  }

  window.addEventListener("beforeunload", (event) => {
    if (!dirty) return;
    event.preventDefault();
    event.returnValue = "";
  });
}

init();
