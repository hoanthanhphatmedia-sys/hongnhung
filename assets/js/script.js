/* =====================================================
   HỒNG NHUNG BĐS — script.js
   ===================================================== */

// ----- Năm hiện tại trong footer -----
document.querySelectorAll("#year").forEach(el => el.textContent = new Date().getFullYear());

// ----- Header: đổi nền navy khi cuộn trang -----
const header = document.querySelector(".site-header");
function onScroll(){
  if (!header) return;
  if (window.scrollY > 40) header.classList.add("scrolled");
  else header.classList.remove("scrolled");
}
onScroll();
window.addEventListener("scroll", onScroll, { passive:true });

// ----- Dropdown "Loại hình BĐS" -----
document.querySelectorAll(".dropdown-toggle").forEach(btn => {
  btn.addEventListener("click", e => {
    e.stopPropagation();
    const dd = btn.closest(".dropdown");
    const open = dd.classList.toggle("open");
    btn.setAttribute("aria-expanded", open ? "true" : "false");
  });
});
document.addEventListener("click", () => {
  document.querySelectorAll(".dropdown.open").forEach(dd => dd.classList.remove("open"));
});

// ----- Menu mobile -----
const navToggle = document.querySelector(".nav-toggle");
const mobileMenu = document.querySelector(".mobile-menu");
if (navToggle && mobileMenu) {
  navToggle.addEventListener("click", e => {
    e.stopPropagation();
    mobileMenu.classList.toggle("open");
  });
  mobileMenu.addEventListener("click", e => e.stopPropagation());
  document.addEventListener("click", () => mobileMenu.classList.remove("open"));
}

// =====================================================
// DỮ LIỆU BẤT ĐỘNG SẢN
// - "slug" là tên file trang chi tiết trong thư mục du-an/
// - "type" phải là một trong: Căn hộ, Biệt thự, Nhà phố, Đất nền, Chuyển nhượng, Thương mại
// =====================================================
const properties = window.SITE_PROPERTIES || [
  // CĂN HỘ
  { id:1,  slug:"sunshine-legend-city-canho",  type:"Căn hộ",     name:"Sunshine Legend City",                  addr:"Tây Mỗ, Nam Từ Liêm, Hà Nội",      price:"Liên hệ", beds:2, baths:2, area:78,  img:"assets/img/sunshine-legend-city-canho.jpg" },
  { id:2,  slug:"alumi-alluvia-city",          type:"Căn hộ",     name:"Alumi - Alluvia City",                  addr:"Hưng Yên",                          price:"Liên hệ", beds:2, baths:2, area:75,  img:"assets/img/alluvia-city-canho.jpg" },
  { id:3,  slug:"masteri-grand-coast",         type:"Căn hộ",     name:"Masteri Grand Coast",                   addr:"Hạ Long, Quảng Ninh",               price:"Liên hệ", beds:2, baths:2, area:72,  img:"assets/img/masteri-grand-coast.jpg" },
  { id:4,  slug:"masteri-era-landmark",        type:"Căn hộ",     name:"Masteri Era Landmark",                  addr:"Hà Nội",                            price:"Liên hệ", beds:2, baths:2, area:75,  img:"assets/img/masteri-era-landmark.jpg" },
  { id:5,  slug:"hanoi-seasons-garden",        type:"Căn hộ",     name:"Hanoi Seasons Garden",                  addr:"Thanh Xuân, Hà Nội",                price:"Liên hệ", beds:2, baths:2, area:80,  img:"assets/img/hanoi-seasons-garden.jpg" },
  { id:6,  slug:"chung-cu-ecopark",            type:"Căn hộ",     name:"Chung cư Ecopark",                      addr:"Văn Giang, Hưng Yên",               price:"Liên hệ", beds:2, baths:2, area:74,  img:"assets/img/ecopark-canho.jpg" },
  // BIỆT THỰ
  { id:7,  slug:"biet-thu-sunshine-legend-city", type:"Biệt thự", name:"Biệt thự Sunshine Legend City",         addr:"Tây Mỗ, Nam Từ Liêm, Hà Nội",      price:"Liên hệ", beds:5, baths:5, area:280, img:"assets/img/sunshine-legend-city-thaptang.jpg" },
  { id:8,  slug:"biet-thu-alluvia-city",       type:"Biệt thự",   name:"Biệt thự Alluvia City",                 addr:"Hưng Yên",                          price:"Liên hệ", beds:5, baths:5, area:300, img:"assets/img/alluvia-city-thaptang.jpg" },
  { id:9,  slug:"biet-thu-vinhomes-ocean-city",type:"Biệt thự",   name:"Biệt thự Vinhomes Ocean City",          addr:"Gia Lâm, Hà Nội",                   price:"Liên hệ", beds:6, baths:6, area:350, img:"assets/img/vinhomes-ocean-city.jpg" },
  { id:10, slug:"biet-thu-ecopark",            type:"Biệt thự",   name:"Biệt thự Ecopark",                      addr:"Văn Giang, Hưng Yên",               price:"Liên hệ", beds:5, baths:6, area:320, img:"assets/img/ecopark-thaptang.jpg" },
  // NHÀ PHỐ
  { id:11, slug:"nha-pho-sunshine-legend-city",type:"Nhà phố",    name:"Nhà phố Sunshine Legend City",          addr:"Tây Mỗ, Nam Từ Liêm, Hà Nội",      price:"Liên hệ", beds:4, baths:5, area:120, img:"assets/img/sunshine-legend-city-thaptang.jpg" },
  { id:12, slug:"nha-pho-alluvia-city",        type:"Nhà phố",    name:"Nhà phố Alluvia City",                  addr:"Hưng Yên",                          price:"Liên hệ", beds:4, baths:4, area:110, img:"assets/img/alluvia-city-thaptang.jpg" },
  { id:13, slug:"nha-pho-vinhomes-ocean-city", type:"Nhà phố",    name:"Nhà phố Vinhomes Ocean City",           addr:"Gia Lâm, Hà Nội",                   price:"Liên hệ", beds:5, baths:5, area:130, img:"assets/img/vinhomes-ocean-city.jpg" },
  { id:14, slug:"nha-pho-ecopark",             type:"Nhà phố",    name:"Nhà phố Ecopark",                       addr:"Văn Giang, Hưng Yên",               price:"Liên hệ", beds:4, baths:5, area:115, img:"assets/img/ecopark-thaptang.jpg" },
  // THƯƠNG MẠI
  { id:15, slug:"shophouse-sunshine-legend-city", type:"Thương mại", name:"Shophouse Sunshine Legend City",     addr:"Tây Mỗ, Nam Từ Liêm, Hà Nội",      price:"Liên hệ", beds:0, baths:0, area:160, img:"assets/img/sunshine-legend-city-thaptang.jpg" },
  { id:16, slug:"shophouse-alluvia-city",      type:"Thương mại", name:"Shophouse Alluvia City",                addr:"Hưng Yên",                          price:"Liên hệ", beds:0, baths:0, area:150, img:"assets/img/alluvia-city-thaptang.jpg" },
  { id:17, slug:"shophouse-vinhomes-ocean-city",type:"Thương mại",name:"Shophouse Vinhomes Ocean City",         addr:"Gia Lâm, Hà Nội",                   price:"Liên hệ", beds:0, baths:0, area:180, img:"assets/img/vinhomes-ocean-city.jpg" },
  { id:18, slug:"shophouse-ecopark",           type:"Thương mại", name:"Shophouse Ecopark",                     addr:"Văn Giang, Hưng Yên",               price:"Liên hệ", beds:0, baths:0, area:165, img:"assets/img/ecopark-thaptang.jpg" },
  // ĐẤT NỀN
  { id:19, slug:"dat-nen-hung-yen",            type:"Đất nền",    name:"Đất nền Tỉnh Hưng Yên",                 addr:"Văn Giang · Văn Lâm · Khoái Châu · Yên Mỹ", price:"Liên hệ", beds:0, baths:0, area:0, meta:"Đất nền pháp lý đầy đủ — nhiều diện tích & vị trí",   img:"assets/img/dat-nen-hung-yen.jpg" },
  { id:20, slug:"dat-nen-phia-dong-ha-noi",    type:"Đất nền",    name:"Đất nền Khu vực phía Đông Hà Nội",      addr:"Gia Lâm · Long Biên · Đông Anh · Văn Giang giáp ranh", price:"Liên hệ", beds:0, baths:0, area:0, meta:"Đất nền dân cư & dự án — đa dạng diện tích", img:"assets/img/dat-nen-hung-yen.jpg" },
  // CHUYỂN NHƯỢNG
  { id:21, slug:"chuyen-nhuong",               type:"Chuyển nhượng", name:"Dịch vụ chuyển nhượng BĐS",          addr:"Hà Nội · Hưng Yên · Hải Phòng · Quảng Ninh · Bắc Ninh", price:"Liên hệ", beds:0, baths:0, area:0, meta:"Tư vấn chuyển nhượng · định giá · kết nối khách mua – khách bán", img:"assets/img/chuyen-nhuong-bds.jpg" },
];

const grid = document.getElementById("listings-grid");
const typeSel = document.getElementById("filter-type");
const searchInp = document.getElementById("filter-search");

// Đường dẫn tới trang chi tiết. Khi đứng ở root web -> "du-an/", khi ở trong du-an/ -> "" (tự link trong cùng folder)
function detailHref(slug){
  const inDuAn = location.pathname.includes("/du-an/");
  return (inDuAn ? "" : "du-an/") + slug + ".html";
}

function render(list){
  if (!grid) return;
  if (!list.length){
    grid.innerHTML = '<p style="color:#6c7886;padding:20px 0">Không tìm thấy bất động sản phù hợp.</p>';
    return;
  }
  grid.innerHTML = list.map(p => {
    const metaText = p.meta
      ? p.meta
      : (p.beds > 0
          ? `${p.beds} PN · ${p.baths} WC · ${p.area} m²`
          : `Diện tích: ${p.area} m²`);
    return `
    <a class="listing-card" href="${detailHref(p.slug)}">
      <div class="listing-img" style="background-image:url('${p.img}')"></div>
      <div class="listing-body">
        <span class="tag">${p.type}</span>
        <h3>${p.name}</h3>
        <p class="addr">${p.addr}</p>
        <p class="price">${p.price}</p>
        <p class="meta">${metaText}</p>
      </div>
    </a>`;
  }).join("");
}

function applyFilter(){
  const t = typeSel ? typeSel.value : "";
  const q = searchInp ? searchInp.value.toLowerCase() : "";
  render(properties.filter(p =>
    (!t || p.type === t) &&
    (!q || p.name.toLowerCase().includes(q) || p.addr.toLowerCase().includes(q))
  ));
}

if (grid) {
  const presetType = new URLSearchParams(location.search).get("type");
  if (presetType && typeSel) {
    const match = [...typeSel.options].find(o => o.value === presetType);
    if (match) typeSel.value = presetType;
  }
  applyFilter();
  typeSel && typeSel.addEventListener("change", applyFilter);
  searchInp && searchInp.addEventListener("input", applyFilter);
}

// =====================================================
// TESTIMONIALS — auto rotate 3s, swipe được, dot indicators
// =====================================================
const testiTrack = document.querySelector(".testi-track");
if (testiTrack) {
  const carousel = testiTrack.parentElement;
  const dotsBox = carousel.querySelector(".testi-dots");
  const cards = () => testiTrack.querySelectorAll(".testi-card");
  const perView = () => window.innerWidth < 680 ? 1 : window.innerWidth < 980 ? 2 : 3;
  const cardWidth = () => {
    const c = cards()[0];
    if (!c) return 0;
    const style = getComputedStyle(c);
    return c.offsetWidth + parseFloat(style.marginRight || 0);
  };
  let current = 0;
  let timer;

  function maxIndex(){ return Math.max(0, cards().length - perView()); }
  function go(i){
    current = Math.max(0, Math.min(i, maxIndex()));
    testiTrack.style.transform = `translateX(${-current * cardWidth()}px)`;
    updateDots();
  }
  function next(){ current = current >= maxIndex() ? 0 : current + 1; go(current); }
  function prev(){ current = current <= 0 ? maxIndex() : current - 1; go(current); }
  function updateDots(){
    if (!dotsBox) return;
    const total = maxIndex() + 1;
    if (dotsBox.children.length !== total){
      dotsBox.innerHTML = "";
      for (let i = 0; i < total; i++){
        const b = document.createElement("button");
        b.setAttribute("aria-label", `Đến nhóm cảm nhận ${i+1}`);
        b.addEventListener("click", () => { go(i); restart(); });
        dotsBox.appendChild(b);
      }
    }
    [...dotsBox.children].forEach((b,i) => b.classList.toggle("active", i === current));
  }
  function start(){ stop(); timer = setInterval(next, 3000); }
  function stop(){ if (timer) clearInterval(timer); }
  function restart(){ stop(); start(); }

  go(0);
  start();
  carousel.addEventListener("mouseenter", stop);
  carousel.addEventListener("mouseleave", start);

  // Swipe trên mobile
  let startX = 0, dx = 0, dragging = false;
  testiTrack.addEventListener("touchstart", e => { startX = e.touches[0].clientX; dx = 0; dragging = true; stop(); }, { passive:true });
  testiTrack.addEventListener("touchmove",  e => { if (dragging) dx = e.touches[0].clientX - startX; }, { passive:true });
  testiTrack.addEventListener("touchend",   () => {
    if (!dragging) return;
    if (Math.abs(dx) > 40) { dx > 0 ? prev() : next(); }
    dragging = false; dx = 0;
    start();
  });

  window.addEventListener("resize", () => go(current));
}
