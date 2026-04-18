/* =============================================
   RESUME FORGE — Application Logic
   ============================================= */

'use strict';

// ===== STATE =====
const state = {
  photo: null,
  fullName: '', jobTitle: '', email: '', phone: '',
  location: '', website: '', linkedin: '', summary: '',
  skills: '', languages: '',
  experience: [],
  education: [],
  projects: [],
  template: 'modern',
  accent: '#6C63FF',
  theme: 'light',
  zoom: 100
};

let expCounter = 0, eduCounter = 0, projCounter = 0;

// ===== INIT =====
document.addEventListener('DOMContentLoaded', () => {
  loadFromStorage();
  setupEventListeners();
  renderAllEntries();
  renderResume();
  applyTheme();
  applyAccent();
  updateZoom();

  // Default: show form on mobile
  document.querySelector('.form-panel').classList.add('active');
});

// ===== LOCAL STORAGE =====
function saveToStorage() {
  const { photo, ...rest } = state;
  localStorage.setItem('resumeforge_data', JSON.stringify(rest));
  if (photo) localStorage.setItem('resumeforge_photo', photo);
}

function loadFromStorage() {
  try {
    const data = localStorage.getItem('resumeforge_data');
    if (data) {
      const parsed = JSON.parse(data);
      Object.assign(state, parsed);
      expCounter = state.experience.length;
      eduCounter = state.education.length;
      projCounter = state.projects.length;
    }
    const photo = localStorage.getItem('resumeforge_photo');
    if (photo) state.photo = photo;
    populateForm();
  } catch (e) { console.warn('Storage load failed', e); }
}

function populateForm() {
  const fields = ['fullName','jobTitle','email','phone','location','website','linkedin','summary','skills','languages'];
  fields.forEach(f => {
    const el = document.getElementById(f) || document.querySelector(`[data-field="${f}"]`);
    if (el && state[f]) el.value = state[f];
  });
  if (state.photo) {
    const preview = document.getElementById('photoPreview');
    preview.innerHTML = `<img src="${state.photo}" alt="Profile"/>`;
  }
  renderSkillTags();
  applyTheme();
  applyAccent();
  // Update template buttons
  document.querySelectorAll('.tmpl-btn').forEach(b => {
    b.classList.toggle('active', b.dataset.template === state.template);
  });
  // Update swatch
  document.querySelectorAll('.swatch').forEach(s => {
    s.classList.toggle('active', s.dataset.color === state.accent);
  });
}

// ===== EVENT LISTENERS =====
function setupEventListeners() {
  // Form field changes
  document.querySelectorAll('[data-field]').forEach(el => {
    el.addEventListener('input', (e) => {
      state[e.target.dataset.field] = e.target.value;
      if (e.target.dataset.field === 'skills') renderSkillTags();
      debounceRender();
      debounceStorage();
    });
  });

  // Photo upload
  document.getElementById('photoInput').addEventListener('change', handlePhotoUpload);

  // Section toggles
  document.querySelectorAll('.card-header').forEach(header => {
    header.addEventListener('click', () => {
      const body = header.nextElementSibling;
      body.classList.toggle('open');
      header.classList.toggle('open');
    });
  });

  // Template switcher
  document.querySelectorAll('.tmpl-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.tmpl-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      state.template = btn.dataset.template;
      renderResume();
      saveToStorage();
    });
  });

  // Color swatches
  document.querySelectorAll('.swatch').forEach(swatch => {
    swatch.addEventListener('click', () => {
      document.querySelectorAll('.swatch').forEach(s => s.classList.remove('active'));
      swatch.classList.add('active');
      state.accent = swatch.dataset.color;
      applyAccent();
      renderResume();
      saveToStorage();
    });
  });

  // Theme toggle
  document.getElementById('themeToggle').addEventListener('click', () => {
    state.theme = state.theme === 'light' ? 'dark' : 'light';
    applyTheme();
    saveToStorage();
  });

  // Add experience
  document.getElementById('addExperience').addEventListener('click', () => {
    const id = ++expCounter;
    state.experience.push({ id, company: '', position: '', start: '', end: '', current: false, desc: '' });
    renderExperienceEntry(state.experience[state.experience.length - 1]);
    debounceRender();
  });

  // Add education
  document.getElementById('addEducation').addEventListener('click', () => {
    const id = ++eduCounter;
    state.education.push({ id, school: '', degree: '', field: '', start: '', end: '', gpa: '' });
    renderEducationEntry(state.education[state.education.length - 1]);
    debounceRender();
  });

  // Add project
  document.getElementById('addProject').addEventListener('click', () => {
    const id = ++projCounter;
    state.projects.push({ id, name: '', tech: '', link: '', desc: '' });
    renderProjectEntry(state.projects[state.projects.length - 1]);
    debounceRender();
  });

  // Download PDF
  document.getElementById('downloadBtn').addEventListener('click', downloadPDF);
  document.getElementById('mobileDownload').addEventListener('click', downloadPDF);

  // Zoom
  document.getElementById('zoomIn').addEventListener('click', () => {
    state.zoom = Math.min(150, state.zoom + 10);
    updateZoom();
  });
  document.getElementById('zoomOut').addEventListener('click', () => {
    state.zoom = Math.max(50, state.zoom - 10);
    updateZoom();
  });

  // Clear all
  document.getElementById('clearAllBtn').addEventListener('click', () => {
    if (confirm('Clear all data? This cannot be undone.')) {
      localStorage.clear();
      location.reload();
    }
  });

  // Mobile tabs
  document.querySelectorAll('.mobile-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      if (tab.id === 'mobileDownload') { downloadPDF(); return; }
      document.querySelectorAll('.mobile-tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      const panel = tab.dataset.panel;
      document.querySelector('.form-panel').classList.toggle('active', panel === 'form');
      document.querySelector('.preview-panel').classList.toggle('active', panel === 'preview');
    });
  });
}

// ===== PHOTO UPLOAD =====
function handlePhotoUpload(e) {
  const file = e.target.files[0];
  if (!file) return;
  if (file.size > 5 * 1024 * 1024) { showToast('Image too large. Max 5MB.'); return; }

  const reader = new FileReader();
  reader.onload = (ev) => {
    state.photo = ev.target.result;
    document.getElementById('photoPreview').innerHTML = `<img src="${state.photo}" alt="Profile"/>`;
    renderResume();
    saveToStorage();
  };
  reader.readAsDataURL(file);
}

// ===== RENDER ENTRIES =====
function renderAllEntries() {
  document.getElementById('experienceEntries').innerHTML = '';
  document.getElementById('educationEntries').innerHTML = '';
  document.getElementById('projectEntries').innerHTML = '';
  state.experience.forEach(e => renderExperienceEntry(e));
  state.education.forEach(e => renderEducationEntry(e));
  state.projects.forEach(e => renderProjectEntry(e));
}

function renderExperienceEntry(item) {
  const container = document.getElementById('experienceEntries');
  const div = document.createElement('div');
  div.className = 'entry-card';
  div.dataset.id = item.id;
  div.innerHTML = `
    <div class="entry-header">
      <div>
        <div class="entry-title">${item.position || 'New Position'}</div>
        <div class="entry-subtitle">${item.company || 'Company Name'}</div>
      </div>
      <div class="entry-controls">
        <button class="btn-entry-action toggle" title="Collapse">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none"><polyline points="6 9 12 15 18 9" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>
        </button>
        <button class="btn-entry-action delete" title="Remove">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none"><line x1="18" y1="6" x2="6" y2="18" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><line x1="6" y1="6" x2="18" y2="18" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>
        </button>
      </div>
    </div>
    <div class="entry-body">
      <div class="form-grid two-col">
        <div class="form-group"><label>Job Title</label>
          <input type="text" placeholder="Senior Developer" value="${item.position||''}" data-key="position"/>
        </div>
        <div class="form-group"><label>Company</label>
          <input type="text" placeholder="Acme Corp" value="${item.company||''}" data-key="company"/>
        </div>
      </div>
      <div class="form-grid two-col">
        <div class="form-group"><label>Start Date</label>
          <input type="text" placeholder="Jan 2021" value="${item.start||''}" data-key="start"/>
        </div>
        <div class="form-group"><label>End Date</label>
          <input type="text" placeholder="Present" value="${item.end||''}" data-key="end"/>
        </div>
      </div>
      <div class="form-group"><label>Description / Achievements</label>
        <textarea placeholder="• Developed and maintained key product features&#10;• Led a team of 4 developers&#10;• Improved performance by 40%" rows="4" data-key="desc">${item.desc||''}</textarea>
      </div>
    </div>
  `;
  setupEntryListeners(div, 'experience', item.id);
  container.appendChild(div);
}

function renderEducationEntry(item) {
  const container = document.getElementById('educationEntries');
  const div = document.createElement('div');
  div.className = 'entry-card';
  div.dataset.id = item.id;
  div.innerHTML = `
    <div class="entry-header">
      <div>
        <div class="entry-title">${item.degree || 'Degree'} ${item.field ? '— ' + item.field : ''}</div>
        <div class="entry-subtitle">${item.school || 'Institution'}</div>
      </div>
      <div class="entry-controls">
        <button class="btn-entry-action toggle" title="Collapse">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none"><polyline points="6 9 12 15 18 9" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>
        </button>
        <button class="btn-entry-action delete" title="Remove">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none"><line x1="18" y1="6" x2="6" y2="18" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><line x1="6" y1="6" x2="18" y2="18" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>
        </button>
      </div>
    </div>
    <div class="entry-body">
      <div class="form-group"><label>School / University</label>
        <input type="text" placeholder="MIT" value="${item.school||''}" data-key="school"/>
      </div>
      <div class="form-grid two-col">
        <div class="form-group"><label>Degree</label>
          <input type="text" placeholder="B.Sc." value="${item.degree||''}" data-key="degree"/>
        </div>
        <div class="form-group"><label>Field of Study</label>
          <input type="text" placeholder="Computer Science" value="${item.field||''}" data-key="field"/>
        </div>
      </div>
      <div class="form-grid two-col">
        <div class="form-group"><label>Start Year</label>
          <input type="text" placeholder="2018" value="${item.start||''}" data-key="start"/>
        </div>
        <div class="form-group"><label>End Year</label>
          <input type="text" placeholder="2022" value="${item.end||''}" data-key="end"/>
        </div>
      </div>
      <div class="form-group"><label>GPA / Grade (optional)</label>
        <input type="text" placeholder="3.8/4.0" value="${item.gpa||''}" data-key="gpa"/>
      </div>
    </div>
  `;
  setupEntryListeners(div, 'education', item.id);
  container.appendChild(div);
}

function renderProjectEntry(item) {
  const container = document.getElementById('projectEntries');
  const div = document.createElement('div');
  div.className = 'entry-card';
  div.dataset.id = item.id;
  div.innerHTML = `
    <div class="entry-header">
      <div>
        <div class="entry-title">${item.name || 'Project Name'}</div>
        <div class="entry-subtitle">${item.tech || 'Technologies'}</div>
      </div>
      <div class="entry-controls">
        <button class="btn-entry-action toggle" title="Collapse">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none"><polyline points="6 9 12 15 18 9" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>
        </button>
        <button class="btn-entry-action delete" title="Remove">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none"><line x1="18" y1="6" x2="6" y2="18" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><line x1="6" y1="6" x2="18" y2="18" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>
        </button>
      </div>
    </div>
    <div class="entry-body">
      <div class="form-group"><label>Project Name</label>
        <input type="text" placeholder="AI Dashboard" value="${item.name||''}" data-key="name"/>
      </div>
      <div class="form-grid two-col">
        <div class="form-group"><label>Technologies</label>
          <input type="text" placeholder="React, Node.js, PostgreSQL" value="${item.tech||''}" data-key="tech"/>
        </div>
        <div class="form-group"><label>Link (optional)</label>
          <input type="url" placeholder="https://github.com/..." value="${item.link||''}" data-key="link"/>
        </div>
      </div>
      <div class="form-group"><label>Description</label>
        <textarea placeholder="Describe what this project does and your contributions..." rows="3" data-key="desc">${item.desc||''}</textarea>
      </div>
    </div>
  `;
  setupEntryListeners(div, 'projects', item.id);
  container.appendChild(div);
}

function setupEntryListeners(div, section, id) {
  // Toggle collapse
  div.querySelector('.btn-entry-action.toggle').addEventListener('click', (e) => {
    e.stopPropagation();
    const body = div.querySelector('.entry-body');
    body.classList.toggle('hidden');
  });

  // Delete
  div.querySelector('.btn-entry-action.delete').addEventListener('click', (e) => {
    e.stopPropagation();
    state[section] = state[section].filter(i => i.id !== id);
    div.style.animation = 'none';
    div.style.opacity = '0';
    div.style.transform = 'translateX(-10px)';
    div.style.transition = 'all 0.2s ease';
    setTimeout(() => div.remove(), 200);
    debounceRender();
    debounceStorage();
  });

  // Header click collapse
  div.querySelector('.entry-header').addEventListener('click', () => {
    const body = div.querySelector('.entry-body');
    body.classList.toggle('hidden');
  });

  // Input changes
  div.querySelectorAll('[data-key]').forEach(input => {
    input.addEventListener('input', (e) => {
      e.stopPropagation();
      const key = e.target.dataset.key;
      const item = state[section].find(i => i.id === id);
      if (item) {
        item[key] = e.target.value;
        // Update header labels
        updateEntryHeader(div, section, item);
      }
      debounceRender();
      debounceStorage();
    });
  });
}

function updateEntryHeader(div, section, item) {
  const title = div.querySelector('.entry-title');
  const subtitle = div.querySelector('.entry-subtitle');
  if (section === 'experience') {
    title.textContent = item.position || 'New Position';
    subtitle.textContent = item.company || 'Company Name';
  } else if (section === 'education') {
    title.textContent = `${item.degree || 'Degree'} ${item.field ? '— ' + item.field : ''}`;
    subtitle.textContent = item.school || 'Institution';
  } else if (section === 'projects') {
    title.textContent = item.name || 'Project Name';
    subtitle.textContent = item.tech || 'Technologies';
  }
}

// ===== SKILL TAGS =====
function renderSkillTags() {
  const container = document.getElementById('skillTags');
  const skills = state.skills.split(',').map(s => s.trim()).filter(Boolean);
  container.innerHTML = skills.map(s => `<span class="skill-tag">${escHtml(s)}</span>`).join('');
}

// ===== RESUME RENDER =====
let renderTimeout;
function debounceRender() {
  clearTimeout(renderTimeout);
  renderTimeout = setTimeout(renderResume, 80);
}

let storageTimeout;
function debounceStorage() {
  clearTimeout(storageTimeout);
  storageTimeout = setTimeout(saveToStorage, 500);
}

function renderResume() {
  const el = document.getElementById('resumePreview');
  el.className = `resume-doc template-${state.template}`;

  const isEmpty = !state.fullName && !state.email && state.experience.length === 0 && state.education.length === 0;

  if (isEmpty) {
    el.innerHTML = `
      <div class="resume-empty-state">
        <svg width="52" height="52" viewBox="0 0 24 24" fill="none">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6z" stroke="currentColor" stroke-width="1.5"/>
          <path d="M14 2v6h6M16 13H8M16 17H8M10 9H8" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
        </svg>
        <p>Start filling in your details to see your resume here!</p>
      </div>`;
    return;
  }

  const renderers = { modern: renderModern, minimal: renderMinimal, creative: renderCreative };
  (renderers[state.template] || renderModern)(el);
}

// ===== TEMPLATE: MODERN =====
function renderModern(el) {
  const s = state;
  const skills = s.skills.split(',').map(t => t.trim()).filter(Boolean);
  const langs = s.languages.split(',').map(t => t.trim()).filter(Boolean);

  el.innerHTML = `
    <div class="resume-header">
      ${s.photo
        ? `<img src="${s.photo}" class="resume-photo" alt="Profile"/>`
        : `<div class="resume-photo-placeholder">👤</div>`}
      <div class="header-info">
        <div class="r-name">${escHtml(s.fullName || 'Your Name')}</div>
        ${s.jobTitle ? `<div class="r-title">${escHtml(s.jobTitle)}</div>` : ''}
        <div class="r-contact">
          ${s.email ? `<span class="r-contact-item">✉ ${escHtml(s.email)}</span>` : ''}
          ${s.phone ? `<span class="r-contact-item">📞 ${escHtml(s.phone)}</span>` : ''}
          ${s.location ? `<span class="r-contact-item">📍 ${escHtml(s.location)}</span>` : ''}
          ${s.website ? `<span class="r-contact-item">🔗 ${escHtml(s.website)}</span>` : ''}
          ${s.linkedin ? `<span class="r-contact-item">in ${escHtml(s.linkedin)}</span>` : ''}
        </div>
      </div>
    </div>

    <div class="resume-body">
      <div class="resume-main">
        ${s.summary ? `
        <div class="r-summary">${escHtml(s.summary)}</div>` : ''}

        ${s.experience.length ? `
        <div class="r-section">
          <div class="r-section-title">Experience</div>
          ${s.experience.map(e => `
          <div class="r-item">
            <div class="r-item-header">
              <div class="r-item-title">${escHtml(e.position||'')}</div>
              ${(e.start||e.end) ? `<div class="r-item-date">${escHtml(e.start||'')}${e.end ? ' – ' + escHtml(e.end) : ''}</div>` : ''}
            </div>
            ${e.company ? `<div class="r-item-org">${escHtml(e.company)}</div>` : ''}
            ${e.desc ? `<div class="r-item-desc">${formatDesc(e.desc)}</div>` : ''}
          </div>`).join('')}
        </div>` : ''}

        ${s.education.length ? `
        <div class="r-section">
          <div class="r-section-title">Education</div>
          ${s.education.map(e => `
          <div class="r-item">
            <div class="r-item-header">
              <div class="r-item-title">${escHtml(e.degree||'')}${e.field ? ` in ${escHtml(e.field)}` : ''}</div>
              ${(e.start||e.end) ? `<div class="r-item-date">${escHtml(e.start||'')}${e.end ? ' – ' + escHtml(e.end) : ''}</div>` : ''}
            </div>
            ${e.school ? `<div class="r-item-org">${escHtml(e.school)}</div>` : ''}
            ${e.gpa ? `<div class="r-item-desc">GPA: ${escHtml(e.gpa)}</div>` : ''}
          </div>`).join('')}
        </div>` : ''}

        ${s.projects.length ? `
        <div class="r-section">
          <div class="r-section-title">Projects</div>
          ${s.projects.map(p => `
          <div class="r-item">
            <div class="r-item-header">
              <div class="r-item-title">${escHtml(p.name||'')}</div>
              ${p.tech ? `<div class="r-item-date">${escHtml(p.tech)}</div>` : ''}
            </div>
            ${p.link ? `<div class="r-item-org">${escHtml(p.link)}</div>` : ''}
            ${p.desc ? `<div class="r-item-desc">${escHtml(p.desc)}</div>` : ''}
          </div>`).join('')}
        </div>` : ''}
      </div>

      <div class="resume-sidebar">
        ${skills.length ? `
        <div class="r-sidebar-label">Skills</div>
        <div>${skills.map(s => `<span class="r-skill-tag">${escHtml(s)}</span>`).join('')}</div>
        ` : ''}

        ${langs.length ? `
        <div class="r-sidebar-label" style="margin-top:18px">Languages</div>
        <div>${langs.map(l => `<div style="font-size:0.78rem;margin-bottom:6px;color:#5F6380"><strong style="color:#1A1B2E">${escHtml(l.split('(')[0].trim())}</strong>${l.includes('(') ? `<br><span style="color:#9496AF">${escHtml(l.match(/\(([^)]+)\)/)?.[1]||'')}</span>` : ''}</div>`).join('')}
        ` : ''}
      </div>
    </div>
  `;
}

// ===== TEMPLATE: MINIMAL =====
function renderMinimal(el) {
  const s = state;
  const skills = s.skills.split(',').map(t => t.trim()).filter(Boolean);
  const langs = s.languages.split(',').map(t => t.trim()).filter(Boolean);

  el.innerHTML = `
    <div class="resume-header">
      <div class="header-flex">
        ${s.photo
          ? `<img src="${s.photo}" class="resume-photo" alt="Profile"/>`
          : `<div class="resume-photo-placeholder">👤</div>`}
        <div>
          <div class="r-name">${escHtml(s.fullName || 'Your Name')}</div>
          ${s.jobTitle ? `<div class="r-title">${escHtml(s.jobTitle)}</div>` : ''}
        </div>
      </div>
      <div class="r-contact">
        ${s.email ? `<span class="r-contact-item">✉ ${escHtml(s.email)}</span>` : ''}
        ${s.phone ? `<span class="r-contact-item">📞 ${escHtml(s.phone)}</span>` : ''}
        ${s.location ? `<span class="r-contact-item">📍 ${escHtml(s.location)}</span>` : ''}
        ${s.website ? `<span class="r-contact-item">🔗 ${escHtml(s.website)}</span>` : ''}
        ${s.linkedin ? `<span class="r-contact-item">in ${escHtml(s.linkedin)}</span>` : ''}
      </div>
    </div>

    <div class="resume-body">
      <div class="resume-main">
        ${s.summary ? `
        <div class="r-section">
          <div class="r-section-title">About</div>
          <div class="r-summary">${escHtml(s.summary)}</div>
        </div>` : ''}

        ${s.experience.length ? `
        <div class="r-section">
          <div class="r-section-title">Experience</div>
          ${s.experience.map(e => `
          <div class="r-item">
            <div class="r-item-header">
              <div class="r-item-title">${escHtml(e.position||'')}${e.company ? ` · ${escHtml(e.company)}` : ''}</div>
              ${(e.start||e.end) ? `<div class="r-item-date">${escHtml(e.start||'')}${e.end ? '–'+escHtml(e.end) : ''}</div>` : ''}
            </div>
            ${e.desc ? `<div class="r-item-desc">${formatDesc(e.desc)}</div>` : ''}
          </div>`).join('')}
        </div>` : ''}

        ${s.education.length ? `
        <div class="r-section">
          <div class="r-section-title">Education</div>
          ${s.education.map(e => `
          <div class="r-item">
            <div class="r-item-header">
              <div class="r-item-title">${escHtml(e.degree||'')} ${e.field ? `in ${escHtml(e.field)}` : ''}</div>
              ${(e.start||e.end) ? `<div class="r-item-date">${escHtml(e.start||'')}${e.end ? '–'+escHtml(e.end) : ''}</div>` : ''}
            </div>
            ${e.school ? `<div class="r-item-org">${escHtml(e.school)}</div>` : ''}
            ${e.gpa ? `<div class="r-item-desc">GPA: ${escHtml(e.gpa)}</div>` : ''}
          </div>`).join('')}
        </div>` : ''}

        ${s.projects.length ? `
        <div class="r-section">
          <div class="r-section-title">Projects</div>
          ${s.projects.map(p => `
          <div class="r-item">
            <div class="r-item-header">
              <div class="r-item-title">${escHtml(p.name||'')}</div>
            </div>
            ${p.tech ? `<div class="r-item-org">${escHtml(p.tech)}</div>` : ''}
            ${p.desc ? `<div class="r-item-desc">${escHtml(p.desc)}</div>` : ''}
          </div>`).join('')}
        </div>` : ''}

        ${skills.length ? `
        <div class="r-section">
          <div class="r-section-title">Skills</div>
          <div>${skills.map(s => `<span class="r-skill-tag">${escHtml(s)}</span>`).join('')}</div>
        </div>` : ''}

        ${langs.length ? `
        <div class="r-section">
          <div class="r-section-title">Languages</div>
          <div style="font-size:0.8rem;color:#5F6380">${langs.map(l => escHtml(l)).join(' · ')}</div>
        </div>` : ''}
      </div>
    </div>
  `;
}

// ===== TEMPLATE: CREATIVE =====
function renderCreative(el) {
  const s = state;
  const skills = s.skills.split(',').map(t => t.trim()).filter(Boolean);
  const langs = s.languages.split(',').map(t => t.trim()).filter(Boolean);

  el.innerHTML = `
    <div class="resume-header">
      <div class="header-left">
        ${s.photo
          ? `<img src="${s.photo}" class="resume-photo" alt="Profile"/>`
          : `<div class="resume-photo-placeholder">👤</div>`}
        <div class="header-left-name">${escHtml(s.fullName||'Your Name')}</div>
        ${s.jobTitle ? `<div class="header-left-title">${escHtml(s.jobTitle)}</div>` : ''}
      </div>
      <div class="header-right">
        <div class="r-name">${escHtml(s.fullName||'Your Name')}</div>
        ${s.jobTitle ? `<div class="r-title">${escHtml(s.jobTitle)}</div>` : ''}
        <div class="r-contact">
          ${s.email ? `<span class="r-contact-item">✉ ${escHtml(s.email)}</span>` : ''}
          ${s.phone ? `<span class="r-contact-item">📞 ${escHtml(s.phone)}</span>` : ''}
          ${s.location ? `<span class="r-contact-item">📍 ${escHtml(s.location)}</span>` : ''}
          ${s.website ? `<span class="r-contact-item">🔗 ${escHtml(s.website)}</span>` : ''}
          ${s.linkedin ? `<span class="r-contact-item">in ${escHtml(s.linkedin)}</span>` : ''}
        </div>
      </div>
    </div>

    <div class="resume-body">
      <div class="resume-sidebar">
        ${skills.length ? `
        <div class="r-sidebar-label">Skills</div>
        ${skills.map(s => `<div class="r-sidebar-skill">${escHtml(s)}</div>`).join('')}
        ` : ''}
        ${langs.length ? `
        <div class="r-sidebar-label">Languages</div>
        ${langs.map(l => `<div class="r-sidebar-skill">${escHtml(l)}</div>`).join('')}
        ` : ''}
      </div>

      <div class="resume-main">
        ${s.summary ? `
        <div class="r-section">
          <div class="r-section-title">Profile</div>
          <div class="r-summary">${escHtml(s.summary)}</div>
        </div>` : ''}

        ${s.experience.length ? `
        <div class="r-section">
          <div class="r-section-title">Experience</div>
          ${s.experience.map(e => `
          <div class="r-item">
            <div class="r-item-title">${escHtml(e.position||'')}</div>
            ${(e.start||e.end) ? `<div class="r-item-date">${escHtml(e.start||'')}${e.end ? ' – '+escHtml(e.end) : ''}</div>` : ''}
            ${e.company ? `<div class="r-item-org">${escHtml(e.company)}</div>` : ''}
            ${e.desc ? `<div class="r-item-desc">${formatDesc(e.desc)}</div>` : ''}
          </div>`).join('')}
        </div>` : ''}

        ${s.education.length ? `
        <div class="r-section">
          <div class="r-section-title">Education</div>
          ${s.education.map(e => `
          <div class="r-item">
            <div class="r-item-title">${escHtml(e.degree||'')} ${e.field ? `in ${escHtml(e.field)}` : ''}</div>
            ${(e.start||e.end) ? `<div class="r-item-date">${escHtml(e.start||'')}${e.end ? ' – '+escHtml(e.end) : ''}</div>` : ''}
            ${e.school ? `<div class="r-item-org">${escHtml(e.school)}</div>` : ''}
            ${e.gpa ? `<div class="r-item-desc">GPA: ${escHtml(e.gpa)}</div>` : ''}
          </div>`).join('')}
        </div>` : ''}

        ${s.projects.length ? `
        <div class="r-section">
          <div class="r-section-title">Projects</div>
          ${s.projects.map(p => `
          <div class="r-item">
            <div class="r-item-title">${escHtml(p.name||'')}</div>
            ${p.tech ? `<div class="r-item-date">${escHtml(p.tech)}</div>` : ''}
            ${p.link ? `<div class="r-item-org">${escHtml(p.link)}</div>` : ''}
            ${p.desc ? `<div class="r-item-desc">${escHtml(p.desc)}</div>` : ''}
          </div>`).join('')}
        </div>` : ''}
      </div>
    </div>
  `;
}

// ===== PDF DOWNLOAD =====
async function downloadPDF() {
  const btn = document.getElementById('downloadBtn');
  const originalHTML = btn.innerHTML;
  btn.innerHTML = `<span class="download-loading"></span> Exporting...`;
  btn.disabled = true;

  try {
    const resumeEl = document.getElementById('resumePreview');
    const name = state.fullName.replace(/\s+/g, '_') || 'Resume';

    const opt = {
      margin: 0,
      filename: `${name}_Resume.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#FFFFFF',
        logging: false
      },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };

    // Temporarily reset zoom for PDF
    const wrapper = document.getElementById('resumeWrapper');
    const prevTransform = wrapper.style.transform;
    wrapper.style.transform = 'scale(1)';

    await html2pdf().set(opt).from(resumeEl).save();

    wrapper.style.transform = prevTransform;
    showToast('✅ Resume exported successfully!');
  } catch (err) {
    showToast('❌ Export failed. Please try again.');
    console.error(err);
  } finally {
    btn.innerHTML = originalHTML;
    btn.disabled = false;
  }
}

// ===== ZOOM =====
function updateZoom() {
  const wrapper = document.getElementById('resumeWrapper');
  wrapper.style.transform = `scale(${state.zoom / 100})`;
  document.getElementById('zoomLevel').textContent = `${state.zoom}%`;
}

// ===== THEME =====
function applyTheme() {
  document.documentElement.setAttribute('data-theme', state.theme);
  const sunIcon = document.querySelector('.sun-icon');
  const moonIcon = document.querySelector('.moon-icon');
  if (state.theme === 'dark') {
    sunIcon.style.display = 'none';
    moonIcon.style.display = 'block';
  } else {
    sunIcon.style.display = 'block';
    moonIcon.style.display = 'none';
  }
}

// ===== ACCENT COLOR =====
function applyAccent() {
  document.documentElement.style.setProperty('--accent', state.accent);
  // Derive lighter versions
  document.documentElement.style.setProperty('--accent-dark', darkenColor(state.accent, 15));
  // Update accent-light based on new color
  const lightColor = hexToRgb(state.accent);
  if (lightColor) {
    document.documentElement.style.setProperty('--accent-light', `rgba(${lightColor.r},${lightColor.g},${lightColor.b},0.12)`);
    document.documentElement.style.setProperty('--shadow-accent', `0 4px 20px rgba(${lightColor.r},${lightColor.g},${lightColor.b},0.28)`);
  }
}

function hexToRgb(hex) {
  const r = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return r ? { r: parseInt(r[1],16), g: parseInt(r[2],16), b: parseInt(r[3],16) } : null;
}

function darkenColor(hex, amount) {
  let { r, g, b } = hexToRgb(hex) || { r: 100, g: 100, b: 100 };
  r = Math.max(0, r - amount);
  g = Math.max(0, g - amount);
  b = Math.max(0, b - amount);
  return `#${r.toString(16).padStart(2,'0')}${g.toString(16).padStart(2,'0')}${b.toString(16).padStart(2,'0')}`;
}

// ===== HELPERS =====
function escHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g,'&amp;')
    .replace(/</g,'&lt;')
    .replace(/>/g,'&gt;')
    .replace(/"/g,'&quot;');
}

function formatDesc(text) {
  if (!text) return '';
  const escaped = escHtml(text);
  // Convert bullet-point lines to HTML list items
  const lines = escaped.split('\n').filter(l => l.trim());
  if (lines.some(l => l.trim().startsWith('•') || l.trim().startsWith('-'))) {
    const items = lines.map(l => l.replace(/^[•\-]\s*/, '').trim()).filter(Boolean);
    return `<ul style="margin:0;padding-left:16px;list-style-type:disc">${items.map(i => `<li style="margin-bottom:3px">${i}</li>`).join('')}</ul>`;
  }
  return escaped.replace(/\n/g, '<br>');
}

function showToast(message) {
  const toast = document.getElementById('toast');
  toast.textContent = message;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 3000);
}
