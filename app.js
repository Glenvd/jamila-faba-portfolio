/* ── Jamila Faba Portfolio — app.js ── */

const STORAGE_KEY  = 'jf_portfolio_v2';
const ADMIN_PASS   = 'style2026';
const MAX_IMG_W    = 1400;
const JPEG_QUALITY = 0.78;

let images       = [];
let filteredImgs = [];
let lbIndex      = 0;
let isAdmin      = false;

/* ── Init ── */
document.addEventListener('DOMContentLoaded', () => {
  loadImages();

  // Restore admin session
  if (sessionStorage.getItem('jf_admin') === '1') {
    enableAdmin();
  }

  // If we're on a sub-page (not index), show the site immediately
  if (document.body.classList.contains('page-loaded')) {
    return;
  }

  // index page — render gallery
  renderGallery('all');
});

/* ── Splash ── */
function enterSite() {
  const splash = document.getElementById('splash');
  const site   = document.getElementById('site');
  if (!splash || !site) return;

  splash.classList.add('gone');
  site.classList.remove('hidden');

  renderGallery('all');
}

/* ── Storage ── */
function loadImages() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    images = raw ? JSON.parse(raw) : [];
  } catch {
    images = [];
  }
}

function saveImages() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(images));
  } catch {
    alert('Storage full — try deleting some images or using smaller files.');
  }
}

/* ── Gallery ── */
function renderGallery(cat) {
  const gallery    = document.getElementById('gallery');
  const emptyState = document.getElementById('emptyState');
  const emptyHint  = document.getElementById('emptyHint');
  if (!gallery) return;

  filteredImgs = cat === 'all' ? [...images] : images.filter(i => i.category === cat);

  // Clear existing items (keep emptyState node)
  Array.from(gallery.querySelectorAll('.gallery-item')).forEach(el => el.remove());

  if (filteredImgs.length === 0) {
    if (emptyState) {
      emptyState.style.display = 'block';
      if (emptyHint) emptyHint.textContent = isAdmin
        ? 'Click "+ Add Work" in the nav bar to upload images.'
        : 'Log in as admin to add images.';
    }
    return;
  }

  if (emptyState) emptyState.style.display = 'none';

  filteredImgs.forEach((item, idx) => {
    const div = document.createElement('div');
    div.className = 'gallery-item';
    div.dataset.index = idx;

    div.innerHTML = `
      <img src="${item.src}" alt="${item.caption || 'Portfolio piece'}" loading="lazy">
      <div class="gallery-item-overlay">
        ${item.caption ? `<p class="gallery-item-caption">${item.caption}</p>` : ''}
        <p class="gallery-item-cat">${item.category}</p>
      </div>
      <button class="item-delete" title="Delete" onclick="deleteItem(event, ${images.indexOf(item)})">×</button>
    `;

    div.addEventListener('click', (e) => {
      if (e.target.classList.contains('item-delete')) return;
      openLightbox(idx);
    });

    gallery.appendChild(div);
  });
}

/* ── Filter ── */
function filter(cat, btn) {
  document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
  if (btn) btn.classList.add('active');
  renderGallery(cat);
}

/* ── Upload ── */
function openModal() {
  document.getElementById('modal').classList.remove('hidden');
}
function closeModal() {
  document.getElementById('modal').classList.add('hidden');
  document.getElementById('imgFile').value  = '';
  document.getElementById('imgCaption').value = '';
  document.getElementById('submitBtn').disabled = false;
  document.getElementById('submitBtn').textContent = 'Upload';
}

function handleUpload() {
  const file    = document.getElementById('imgFile').files[0];
  const cat     = document.getElementById('imgCat').value;
  const caption = document.getElementById('imgCaption').value.trim();
  const btn     = document.getElementById('submitBtn');

  if (!file) { alert('Please select an image.'); return; }

  btn.disabled = true;
  btn.textContent = 'Processing…';

  const reader = new FileReader();
  reader.onload = e => {
    const img = new Image();
    img.src = e.target.result;
    img.onload = () => {
      const canvas = document.createElement('canvas');
      let w = img.width, h = img.height;
      if (w > MAX_IMG_W) { h = Math.round(h * MAX_IMG_W / w); w = MAX_IMG_W; }
      canvas.width = w; canvas.height = h;
      canvas.getContext('2d').drawImage(img, 0, 0, w, h);
      const src = canvas.toDataURL('image/jpeg', JPEG_QUALITY);

      images.push({ category: cat, caption, src });
      saveImages();

      // Re-render using current active filter
      const activeBtn = document.querySelector('.filter-btn.active');
      const currentCat = activeBtn ? activeBtn.dataset.cat : 'all';
      renderGallery(currentCat);

      closeModal();
    };
  };
  reader.readAsDataURL(file);
}

/* ── Delete ── */
function deleteItem(e, realIdx) {
  e.stopPropagation();
  if (!confirm('Delete this image permanently?')) return;
  images.splice(realIdx, 1);
  saveImages();

  const activeBtn = document.querySelector('.filter-btn.active');
  const currentCat = activeBtn ? activeBtn.dataset.cat : 'all';
  renderGallery(currentCat);
}

/* ── Lightbox ── */
function openLightbox(idx) {
  lbIndex = idx;
  showLbImage();
  document.getElementById('lightbox').classList.remove('hidden');
  document.body.style.overflow = 'hidden';
}

function showLbImage() {
  const item = filteredImgs[lbIndex];
  if (!item) return;
  document.getElementById('lbImg').src        = item.src;
  document.getElementById('lbCaption').textContent = item.caption || '';
}

function closeLightbox(e) {
  if (e && e.target !== document.getElementById('lightbox') && !e.target.classList.contains('lb-close')) return;
  document.getElementById('lightbox').classList.add('hidden');
  document.body.style.overflow = '';
}

function lbNav(dir) {
  lbIndex = (lbIndex + dir + filteredImgs.length) % filteredImgs.length;
  showLbImage();
}

/* ── Admin ── */
function toggleAdmin() {
  if (isAdmin) { logoutAdmin(); return; }
  const pw = prompt('Enter admin password:');
  if (pw === ADMIN_PASS) {
    enableAdmin();
  } else if (pw !== null) {
    alert('Incorrect password.');
  }
}

function enableAdmin() {
  isAdmin = true;
  document.body.classList.add('admin');
  sessionStorage.setItem('jf_admin', '1');

  const uploadBtn = document.getElementById('uploadBtn');
  const adminBar  = document.getElementById('adminBar');
  if (uploadBtn) uploadBtn.classList.remove('hidden');
  if (adminBar)  adminBar.classList.remove('hidden');

  // Re-render so delete buttons appear
  const activeBtn = document.querySelector('.filter-btn.active');
  const currentCat = activeBtn ? activeBtn.dataset.cat : 'all';
  renderGallery(currentCat);
}

function logoutAdmin() {
  isAdmin = false;
  document.body.classList.remove('admin');
  sessionStorage.removeItem('jf_admin');

  const uploadBtn = document.getElementById('uploadBtn');
  const adminBar  = document.getElementById('adminBar');
  if (uploadBtn) uploadBtn.classList.add('hidden');
  if (adminBar)  adminBar.classList.add('hidden');

  const activeBtn = document.querySelector('.filter-btn.active');
  const currentCat = activeBtn ? activeBtn.dataset.cat : 'all';
  renderGallery(currentCat);
}

/* ── Keyboard ── */
document.addEventListener('keydown', e => {
  const lb = document.getElementById('lightbox');
  if (!lb || lb.classList.contains('hidden')) return;
  if (e.key === 'Escape')      { document.getElementById('lightbox').classList.add('hidden'); document.body.style.overflow = ''; }
  if (e.key === 'ArrowRight')  lbNav(1);
  if (e.key === 'ArrowLeft')   lbNav(-1);
});
