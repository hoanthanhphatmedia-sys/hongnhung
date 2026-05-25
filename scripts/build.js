const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const site = readJson("content/site.json");
const projects = readJson("content/projects.json");

function readJson(relPath) {
  return JSON.parse(fs.readFileSync(path.join(root, relPath), "utf8"));
}

function write(relPath, content) {
  const target = path.join(root, relPath);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, `${content.trim()}\n`, "utf8");
}

function escapeHtml(value = "") {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function escapeAttr(value = "") {
  return escapeHtml(value).replace(/\n/g, " ");
}

function prefixPath(prefix, value = "") {
  if (!value) return "";
  if (/^(https?:|mailto:|tel:|#)/.test(value)) return value;
  return `${prefix}${value.replace(/^\.\//, "").replace(/^\.\.\//, "")}`;
}

function typeHref(prefix, type) {
  return `${prefix}listings.html?type=${encodeURIComponent(type || "")}`;
}

function phoneHref() {
  return `tel:${site.contact.phone}`;
}

function zaloHref() {
  return site.contact.zalo || `https://zalo.me/${site.contact.phone}`;
}

function header(active, prefix = "") {
  const nav = [
    ["about", "Giới thiệu", "about.html"],
    ["listings", "Bất động sản", "listings.html"],
    ["contact", "Liên hệ", "contact.html"],
  ];
  const navLinks = nav
    .map(([key, label, href]) => `<a href="${prefix}${href}"${active === key ? ' class="active"' : ""}>${label}</a>`)
    .join("\n        ");
  const typeLinks = (site.navTypes || [])
    .map((type) => `<a href="${typeHref(prefix, type)}">${escapeHtml(type === "Chuyển nhượng" ? "Chuyển nhượng BĐS" : type === "Thương mại" ? "BĐS thương mại" : type)}</a>`)
    .join("\n            ");
  const mobileTypeLinks = (site.navTypes || [])
    .map((type) => `<a class="mm-sub" href="${typeHref(prefix, type)}">${escapeHtml(type === "Chuyển nhượng" ? "Chuyển nhượng BĐS" : type === "Thương mại" ? "BĐS thương mại" : type)}</a>`)
    .join("\n        ");

  return `
  <header class="site-header">
    <div class="container nav-wrap">
      <nav class="nav-left">
        ${navLinks}
      </nav>
      <a href="${prefix}index.html" class="logo-center">
        <img src="${prefixPath(prefix, site.logo || "assets/img/logo.png")}" alt="${escapeAttr(site.brand)} - Hà Nội" />
      </a>
      <div class="nav-right">
        <div class="dropdown">
          <button class="dropdown-toggle" aria-haspopup="true" aria-expanded="false">Loại hình BĐS <span class="caret">▼</span></button>
          <div class="dropdown-menu">
            ${typeLinks}
          </div>
        </div>
        <a href="${prefix}contact.html" class="btn-appoint">Đặt lịch hẹn</a>
        <button class="nav-toggle" aria-label="Mở menu">☰</button>
      </div>
      <div class="mobile-menu">
        <a href="${prefix}index.html">Trang chủ</a>
        <a href="${prefix}about.html">Giới thiệu</a>
        <a href="${prefix}listings.html">Bất động sản</a>
        <a href="${prefix}contact.html">Liên hệ</a>
        <div class="mm-label">Loại hình BĐS</div>
        ${mobileTypeLinks}
        <a class="mm-appoint" href="${prefix}contact.html">Đặt lịch hẹn</a>
      </div>
    </div>
  </header>`;
}

function footer(prefix = "") {
  const c = site.contact;
  return `
  <footer class="site-footer">
    <div class="container foot-grid">
      <div>
        <p class="logo">${escapeHtml(site.brand)}</p>
        <p>${escapeHtml(c.office)}</p>
        <p>Điện thoại: <a href="${phoneHref()}">${escapeHtml(c.phoneDisplay || c.phone)}</a></p>
        <p>Email: <a href="mailto:${escapeAttr(c.email)}">${escapeHtml(c.email)}</a></p>
      </div>
      <div>
        <p class="foot-title">Liên kết</p>
        <a href="${prefix}index.html">Trang chủ</a>
        <a href="${prefix}about.html">Giới thiệu</a>
        <a href="${prefix}listings.html">Bất động sản</a>
        <a href="${prefix}contact.html">Liên hệ</a>
      </div>
      <div>
        <p class="foot-title">Theo dõi</p>
        <a href="${escapeAttr(c.facebookPage)}" target="_blank" rel="noopener">Facebook · BĐS Hà Nội - Hưng Yên</a>
        <a href="${escapeAttr(c.facebookPersonal)}" target="_blank" rel="noopener">Facebook · Hoàng Hồng Nhung</a>
        <a href="${escapeAttr(zaloHref())}" target="_blank" rel="noopener">Zalo · ${escapeHtml(c.phoneDisplay || c.phone)}</a>
      </div>
    </div>
    <p class="copyright">© <span id="year"></span> ${escapeHtml(site.brand)}. Mọi quyền được bảo lưu.</p>
  </footer>`;
}

function page({ title, description, active, prefix = "", body }) {
  return `<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${escapeHtml(title)}</title>
  <meta name="description" content="${escapeAttr(description)}" />
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@300;400;500;600;700&amp;family=Lato:wght@300;400;700&amp;display=swap" rel="stylesheet">
  <link rel="stylesheet" href="${prefix}assets/css/style.css" />
</head>
<body>
${header(active, prefix)}
${body}
${footer(prefix)}
  <script src="${prefix}assets/js/data.js"></script>
  <script src="${prefix}assets/js/script.js"></script>
</body>
</html>`;
}

function projectCard(project, prefix = "") {
  const img = project.img || project.hero?.image || "";
  const metaText = project.meta
    ? project.meta
    : project.beds > 0
      ? `${project.beds} PN · ${project.baths} WC · ${project.area} m²`
      : project.area > 0
        ? `Diện tích: ${project.area} m²`
        : "Đang cập nhật";
  return `
      <a class="listing-card" href="${prefix}du-an/${escapeAttr(project.slug)}.html">
        <div class="listing-img" style="background-image:url('${prefixPath(prefix, img)}')"></div>
        <div class="listing-body">
          <span class="tag">${escapeHtml(project.type)}</span>
          <h3>${escapeHtml(project.name)}</h3>
          <p class="addr">${escapeHtml(project.addr)}</p>
          <p class="price">${escapeHtml(project.price)}</p>
          <p class="meta">${escapeHtml(metaText)}</p>
        </div>
      </a>`;
}

function buildIndex() {
  const home = site.home;
  const aboutStripHtml = (home.aboutStripHtml || "").replace(/<\/section>\s*$/i, "").trim();
  const featured = (home.featuredSlugs || [])
    .map((slug) => projects.find((project) => project.slug === slug))
    .filter(Boolean);
  const featuredCards = [...featured, ...featured].map((project) => projectCard(project)).join("");
  const testimonials = (home.testimonials || [])
    .map((item) => `
        <blockquote class="testi-card">"${escapeHtml(item.quote)}" <cite>— ${escapeHtml(item.author || "Khách hàng")}</cite></blockquote>`)
    .join("");

  const body = `
  <section class="hero">
    <video class="hero-video" autoplay muted loop playsinline preload="auto">
      <source src="${escapeAttr(home.heroVideo || "assets/video/hero.mp4")}" type="video/mp4" />
    </video>
    <div class="hero-overlay"></div>
    <div class="hero-inner">
      <p class="eyebrow">${escapeHtml(home.eyebrow)}</p>
      <h1>${escapeHtml(home.heading)}</h1>
      <p class="lead">${escapeHtml(home.lead)}</p>
      <a href="listings.html" class="btn btn-primary">Xem danh mục</a>
      <a href="contact.html" class="btn btn-ghost">Liên hệ ngay</a>
    </div>
  </section>

  <section class="featured">
    <h2 class="section-title">${escapeHtml(home.featuredTitle || "Bất động sản nổi bật")}</h2>
    <div class="marquee">
      <div class="marquee-track">${featuredCards}
      </div>
    </div>
  </section>

  <section class="about-strip">
    ${aboutStripHtml}
  </section>

  <section class="testimonials container">
    <h2 class="section-title">${escapeHtml(home.testimonialsTitle || "Khách hàng nói gì")}</h2>
    <div class="testi-carousel">
      <div class="testi-track">${testimonials}
      </div>
      <div class="testi-dots" aria-label="Điều hướng cảm nhận"></div>
    </div>
  </section>`;

  write("index.html", page({
    title: home.title,
    description: home.description,
    active: "home",
    body,
  }));
}

function buildListings() {
  const listings = site.listings;
  const options = (site.navTypes || [])
    .map((type) => `<option value="${escapeAttr(type)}">${escapeHtml(type === "Chuyển nhượng" ? "Chuyển nhượng BĐS" : type === "Thương mại" ? "BĐS thương mại" : type)}</option>`)
    .join("\n        ");
  const body = `
  <section class="page-hero">
    <h1>${escapeHtml(listings.pageTitle)}</h1>
    <p>${escapeHtml(listings.pageLead)}</p>
  </section>

  <section class="container">
    <div class="filters">
      <select id="filter-type">
        <option value="">Tất cả loại hình</option>
        ${options}
      </select>
      <input id="filter-search" type="text" placeholder="Tìm theo tên hoặc địa chỉ..." />
    </div>

    <div class="listings-grid" id="listings-grid">
      <!-- JS render từ assets/js/data.js -->
    </div>
  </section>`;
  write("listings.html", page({
    title: listings.title,
    description: listings.description,
    active: "listings",
    body,
  }));
}

function buildAbout() {
  const about = site.about;
  const body = `
  <section class="page-hero">
    <h1>${escapeHtml(about.pageTitle)}</h1>
    <p>${escapeHtml(about.pageLead)}</p>
  </section>

  <section class="container about-long">
    ${about.bodyHtml || ""}
  </section>`;
  write("about.html", page({
    title: about.title,
    description: about.description,
    active: "about",
    body,
  }));
}

function buildContact() {
  const contactPage = site.contactPage;
  const c = site.contact;
  const body = `
  <section class="page-hero">
    <h1>${escapeHtml(contactPage.pageTitle)}</h1>
    <p>${escapeHtml(contactPage.pageLead)}</p>
  </section>

  <section class="container contact-grid">
    <form action="${escapeAttr(contactPage.formAction)}" method="POST" class="contact-form">
      <label>Họ và tên <input name="name" required /></label>
      <label>Email <input name="email" type="email" required /></label>
      <label>Số điện thoại <input name="phone" /></label>
      <label>Nội dung <textarea name="message" rows="5" required></textarea></label>
      <button class="btn btn-primary" type="submit">Gửi tin nhắn</button>
    </form>
    <aside class="contact-info">
      <h3>Thông tin liên hệ</h3>
      <p>Điện thoại: <a href="${phoneHref()}">${escapeHtml(c.phoneDisplay || c.phone)}</a></p>
      <p>Email: <a href="mailto:${escapeAttr(c.email)}">${escapeHtml(c.email)}</a></p>
      <p>Văn phòng: ${escapeHtml(c.office)}</p>
      <p>Khu vực hoạt động: ${escapeHtml(c.areas)}</p>
      <p class="contact-social">
        <a href="${escapeAttr(zaloHref())}" target="_blank" rel="noopener">Nhắn Zalo</a>
        <a href="${escapeAttr(c.facebookPage)}" target="_blank" rel="noopener">Fanpage Facebook</a>
      </p>
    </aside>
  </section>`;
  write("contact.html", page({
    title: contactPage.title,
    description: contactPage.description,
    active: "contact",
    body,
  }));
}

function pairGrid(items = [], className = "") {
  return items
    .map((item) => `<div${item.muted ? ' class="updating"' : ""}><span>${escapeHtml(item.label)}</span><strong>${escapeHtml(item.value)}</strong></div>`)
    .join("\n      ");
}

function buildProject(project) {
  const prefix = "../";
  const image = project.hero?.image || project.img || "";
  const body = `
  <section class="project-hero" style="background-image:url('${prefixPath(prefix, image)}')">
    <div class="project-hero-overlay"></div>
    <div class="container project-hero-inner">
      <p class="eyebrow"><a href="${typeHref(prefix, project.type)}">${escapeHtml(project.hero?.eyebrow || project.type)}</a></p>
      <h1>${escapeHtml(project.hero?.title || project.name)}</h1>
      <p class="project-addr">${escapeHtml(project.hero?.address || project.addr)}</p>
    </div>
  </section>

  <section class="container project-body">
    <a href="../listings.html" class="project-back">← Về danh mục bất động sản</a>

    <div class="project-specs">
      ${pairGrid(project.specs)}
    </div>

    <div class="project-contact">
      <p class="project-contact-head">${escapeHtml(project.contactBox?.heading || "Thông tin sản phẩm & Báo giá")}</p>
      <div class="contact-info-grid">
      ${pairGrid(project.contactBox?.items)}
      </div>
      <div class="contact-price-block">
        <div class="price-label">
          <span>${escapeHtml(project.contactBox?.priceLabel || "Giá")}</span>
          <strong>${escapeHtml(project.contactBox?.priceValue || "Liên hệ Hotline")}</strong>
        </div>
        <div class="price-actions">
          <a href="${phoneHref()}" class="btn-hotline" aria-label="Gọi hotline ${escapeAttr(site.contact.phoneDisplay || site.contact.phone)}">
            <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M20 15.5c-1.2 0-2.4-.2-3.6-.6-.3-.1-.7 0-1 .2l-2.2 2.2c-2.8-1.4-5.1-3.8-6.6-6.6l2.2-2.2c.3-.3.4-.7.2-1-.3-1.1-.5-2.3-.5-3.5 0-.6-.5-1-1-1H4c-.6 0-1 .4-1 1 0 9.4 7.6 17 17 17 .6 0 1-.4 1-1v-3.5c0-.5-.5-1-1-1z"/></svg>
            Gọi ${escapeHtml(site.contact.phoneDisplay || site.contact.phone)}
          </a>
          <a href="${escapeAttr(zaloHref())}" class="btn-zalo" target="_blank" rel="noopener" aria-label="Nhắn Zalo ${escapeAttr(site.contact.phoneDisplay || site.contact.phone)}">
            <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2C6.5 2 2 5.8 2 10.4c0 2.5 1.4 4.8 3.6 6.3v3.5c0 .4.5.7.9.5l3.4-2.1c.7.1 1.4.2 2.1.2 5.5 0 10-3.8 10-8.4S17.5 2 12 2zm-3 9.4H7.5v-3H6v3H4.7v.8H9v-.8zm3 0h-1.5v-3.7h1.5v3.7zm3.7-3l-1.7 2.2h1.7v.8h-3v-.7l1.7-2.2h-1.6v-.8h2.9v.7zm3.6 3l-.3-.7h-1.5l-.3.7H16l1.4-3.7h1l1.4 3.7h-1.5zm-1-2.7l-.5 1.3h.9l-.4-1.3z"/></svg>
            Nhắn Zalo
          </a>
        </div>
      </div>
    </div>

    <div class="project-content">
      ${project.contentHtml || ""}
    </div>
  </section>

  <section class="project-cta">
    <h2>${escapeHtml(project.cta?.title || `Nhận tư vấn chi tiết về ${project.name}`)}</h2>
    <p>${escapeHtml(project.cta?.text || "")}</p>
    <a href="${phoneHref()}" class="btn btn-primary">Gọi ${escapeHtml(site.contact.phoneDisplay || site.contact.phone)}</a>
    <a href="${escapeAttr(zaloHref())}" class="btn btn-ghost-dark" target="_blank" rel="noopener">Nhắn Zalo</a>
    <a href="../contact.html" class="btn btn-ghost-dark">Gửi yêu cầu</a>
  </section>`;

  write(`du-an/${project.slug}.html`, page({
    title: project.title || `${project.name} | ${site.brand}`,
    description: project.description || `${project.name} - liên hệ ${site.brand} để nhận tư vấn.`,
    active: "listings",
    prefix,
    body,
  }));
}

function buildDataFile() {
  const properties = projects.map((project) => ({
    id: project.id,
    slug: project.slug,
    type: project.type,
    name: project.name,
    addr: project.addr,
    price: project.price,
    beds: Number(project.beds || 0),
    baths: Number(project.baths || 0),
    area: Number(project.area || 0),
    meta: project.meta || "",
    img: project.img || project.hero?.image || "",
  }));
  const json = JSON.stringify(properties, null, 2).replace(/</g, "\\u003c");
  write("assets/js/data.js", `window.SITE_PROPERTIES = ${json};`);
}

function buildSitemap() {
  const urls = ["index.html", "about.html", "listings.html", "contact.html", ...projects.map((project) => `du-an/${project.slug}.html`)];
  const body = urls
    .map((url) => `  <url><loc>/${url}</loc></url>`)
    .join("\n");
  write("sitemap.xml", `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${body}
</urlset>`);
}

buildDataFile();
buildIndex();
buildListings();
buildAbout();
buildContact();
projects.forEach(buildProject);
buildSitemap();

console.log(`Built ${projects.length} project pages from content JSON.`);
