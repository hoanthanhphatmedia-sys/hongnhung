const fs = require("fs");
const path = require("path");
const vm = require("vm");

const root = path.resolve(__dirname, "..");

function read(relPath) {
  return fs.readFileSync(path.join(root, relPath), "utf8");
}

function writeJson(relPath, data) {
  const target = path.join(root, relPath);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, `${JSON.stringify(data, null, 2)}\n`, "utf8");
}

function decodeEntities(value = "") {
  return value
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)));
}

function plain(value = "") {
  return decodeEntities(
    value
      .replace(/<script[\s\S]*?<\/script>/gi, "")
      .replace(/<style[\s\S]*?<\/style>/gi, "")
      .replace(/<[^>]*>/g, " ")
      .replace(/\s+/g, " ")
      .trim()
  );
}

function first(html, regex, fallback = "") {
  const match = html.match(regex);
  return match ? decodeEntities(match[1].trim()) : fallback;
}

function firstRaw(html, regex, fallback = "") {
  const match = html.match(regex);
  return match ? match[1].trim() : fallback;
}

function between(html, start, end, fallback = "") {
  const startIndex = html.indexOf(start);
  if (startIndex < 0) return fallback;
  const contentStart = startIndex + start.length;
  const endIndex = html.indexOf(end, contentStart);
  if (endIndex < 0) return fallback;
  return html.slice(contentStart, endIndex).trim();
}

function extractPairs(block = "") {
  const pairs = [];
  const pairRegex = /<div([^>]*)>\s*<span>([\s\S]*?)<\/span>\s*<strong>([\s\S]*?)<\/strong>\s*<\/div>/g;
  let match;
  while ((match = pairRegex.exec(block))) {
    pairs.push({
      label: plain(match[2]),
      value: plain(match[3]),
      muted: /class=["'][^"']*updating[^"']*["']/.test(match[1]),
    });
  }
  return pairs;
}

function normalizeAssetPath(value = "") {
  return value.replace(/^\.\.\//, "").replace(/^\.\//, "");
}

function extractProperties() {
  const script = read("assets/js/script.js");
  const match = script.match(/const properties\s*=\s*(\[[\s\S]*?\]);/);
  if (!match) return [];
  return vm.runInNewContext(match[1]);
}

function extractProject(slug, card) {
  const relPath = `du-an/${slug}.html`;
  const html = fs.existsSync(path.join(root, relPath)) ? read(relPath) : read("du-an/_template.html");
  const specsBlock = between(html, '<div class="project-specs">', '<div class="project-contact">');
  const infoBlock = between(html, '<div class="contact-info-grid">', '<div class="contact-price-block">');
  const heroImage = firstRaw(html, /<section class="project-hero"[^>]*background-image:url\('([^']+)'\)/);
  const contentHtml = firstRaw(html, /<div class="project-content">([\s\S]*?)<\/div>\s*<\/section>/);

  return {
    id: card.id,
    slug,
    type: card.type || "",
    name: card.name || first(html, /<h1>([\s\S]*?)<\/h1>/),
    addr: card.addr || first(html, /<p class="project-addr">([\s\S]*?)<\/p>/),
    price: card.price || "Liên hệ",
    beds: Number(card.beds || 0),
    baths: Number(card.baths || 0),
    area: Number(card.area || 0),
    img: normalizeAssetPath(card.img || heroImage),
    meta: card.meta || "",
    title: first(html, /<title>([\s\S]*?)<\/title>/),
    description: first(html, /<meta name="description" content="([^"]*)"/),
    hero: {
      image: normalizeAssetPath(heroImage || card.img || ""),
      eyebrow: first(html, /<p class="eyebrow"><a [^>]*>([\s\S]*?)<\/a><\/p>/, card.type || ""),
      title: first(html, /<section class="project-hero"[\s\S]*?<h1>([\s\S]*?)<\/h1>/, card.name || ""),
      address: first(html, /<p class="project-addr">([\s\S]*?)<\/p>/, card.addr || ""),
    },
    specs: extractPairs(specsBlock),
    contactBox: {
      heading: first(html, /<p class="project-contact-head">([\s\S]*?)<\/p>/, "Thông tin sản phẩm & Báo giá"),
      items: extractPairs(infoBlock),
      priceLabel: first(html, /<div class="price-label">[\s\S]*?<span>([\s\S]*?)<\/span>/, "Giá"),
      priceValue: first(html, /<div class="price-label">[\s\S]*?<strong>([\s\S]*?)<\/strong>/, "Liên hệ Hotline"),
    },
    contentHtml,
    cta: {
      title: first(html, /<section class="project-cta">[\s\S]*?<h2>([\s\S]*?)<\/h2>/, `Nhận tư vấn chi tiết về ${card.name}`),
      text: first(html, /<section class="project-cta">[\s\S]*?<p>([\s\S]*?)<\/p>/, ""),
    },
  };
}

function extractTestimonials(html) {
  const items = [];
  const regex = /<blockquote class="testi-card">([\s\S]*?)<cite>([\s\S]*?)<\/cite><\/blockquote>/g;
  let match;
  while ((match = regex.exec(html))) {
    const quote = plain(match[1]).replace(/^["“]+|["”]+$/g, "").trim();
    const author = plain(match[2]).replace(/^[-—]\s*/, "").trim();
    items.push({ quote, author });
  }
  return items;
}

function extractFeaturedSlugs(html) {
  const slugs = [];
  const regex = /<a class="listing-card" href="du-an\/([^"]+)\.html">/g;
  let match;
  while ((match = regex.exec(html))) {
    if (!slugs.includes(match[1])) slugs.push(match[1]);
  }
  return slugs.slice(0, 6);
}

function extractAboutPage(html) {
  const longHtml = firstRaw(html, /<section class="container about-long">([\s\S]*?)<\/section>/);
  return {
    title: first(html, /<title>([\s\S]*?)<\/title>/),
    description: first(html, /<meta name="description" content="([^"]*)"/),
    pageTitle: first(html, /<section class="page-hero">[\s\S]*?<h1>([\s\S]*?)<\/h1>/, "Giới thiệu"),
    pageLead: first(html, /<section class="page-hero">[\s\S]*?<p>([\s\S]*?)<\/p>/, ""),
    bodyHtml: longHtml,
  };
}

function extractHome(html) {
  const aboutStrip = between(html, '<section class="about-strip">', '<section class="testimonials container">');
  return {
    title: first(html, /<title>([\s\S]*?)<\/title>/),
    description: first(html, /<meta name="description" content="([^"]*)"/),
    heroVideo: firstRaw(html, /<source src="([^"]+)" type="video\/mp4"/, "assets/video/hero.mp4"),
    eyebrow: first(html, /<div class="hero-inner">[\s\S]*?<p class="eyebrow">([\s\S]*?)<\/p>/),
    heading: first(html, /<div class="hero-inner">[\s\S]*?<h1>([\s\S]*?)<\/h1>/),
    lead: first(html, /<div class="hero-inner">[\s\S]*?<p class="lead">([\s\S]*?)<\/p>/),
    featuredTitle: first(html, /<section class="featured">[\s\S]*?<h2 class="section-title">([\s\S]*?)<\/h2>/, "Bất động sản nổi bật"),
    featuredSlugs: extractFeaturedSlugs(html),
    aboutStripHtml: aboutStrip,
    testimonialsTitle: first(html, /<section class="testimonials container">[\s\S]*?<h2 class="section-title">([\s\S]*?)<\/h2>/, "Khách hàng nói gì"),
    testimonials: extractTestimonials(html),
  };
}

function extractContactPage(html) {
  return {
    title: first(html, /<title>([\s\S]*?)<\/title>/),
    description: first(html, /<meta name="description" content="([^"]*)"/),
    pageTitle: first(html, /<section class="page-hero">[\s\S]*?<h1>([\s\S]*?)<\/h1>/, "Liên hệ"),
    pageLead: first(html, /<section class="page-hero">[\s\S]*?<p>([\s\S]*?)<\/p>/, ""),
    formAction: firstRaw(html, /<form action="([^"]+)"/, "https://formspree.io/f/your-id-here"),
  };
}

const properties = extractProperties();
const projects = properties.map((card) => extractProject(card.slug, card));
const indexHtml = read("index.html");
const aboutHtml = read("about.html");
const contactHtml = read("contact.html");

const site = {
  brand: "Hồng Nhung BĐS",
  logo: "assets/img/logo.png",
  logoDark: "assets/img/logo-nen-den.png",
  navTypes: ["Căn hộ", "Biệt thự", "Nhà phố", "Đất nền", "Chuyển nhượng", "Thương mại"],
  contact: {
    phone: "0915299163",
    phoneDisplay: "0915 299 163",
    email: "hoanghongnhungvnpt@gmail.com",
    office: "KĐT Ecopark, Hưng Yên.",
    areas: "Hà Nội, Hưng Yên, Hải Phòng, Quảng Ninh, Bắc Ninh.",
    zalo: "https://zalo.me/0915299163",
    facebookPage: "https://www.facebook.com/batdongsan.hanoi.hungyen/",
    facebookPersonal: "https://www.facebook.com/hoanghongnhungvnpt",
  },
  home: extractHome(indexHtml),
  about: extractAboutPage(aboutHtml),
  listings: {
    title: first(read("listings.html"), /<title>([\s\S]*?)<\/title>/),
    description: first(read("listings.html"), /<meta name="description" content="([^"]*)"/),
    pageTitle: first(read("listings.html"), /<section class="page-hero">[\s\S]*?<h1>([\s\S]*?)<\/h1>/, "Danh mục bất động sản"),
    pageLead: first(read("listings.html"), /<section class="page-hero">[\s\S]*?<p>([\s\S]*?)<\/p>/, ""),
  },
  contactPage: extractContactPage(contactHtml),
};

writeJson("content/site.json", site);
writeJson("content/projects.json", projects);
console.log(`Extracted ${projects.length} projects into content/*.json`);
