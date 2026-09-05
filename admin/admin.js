// ============================================================
// ADMIN DASHBOARD — JavaScript
// Handles: Auth, Projects CRUD, Blog CRUD, Settings, Appearance, UI
// ============================================================

// ── STATE ──────────────────────────────────────────────────
let currentTab = 'projects';
let projects   = [];
let blogs      = [];
let drawerMode = null;   // 'project' | 'blog' | 'skill' | 'experience'
let editingId  = null;
let confirmCb  = null;
let skills     = [];
let experience = [];

// ── AUTH GUARD ──────────────────────────────────────────────
auth.onAuthStateChanged(user => {
  if (!user) { window.location.href = 'index.html'; return; }
  document.getElementById('adminEmail').textContent = user.email;
  init();
});

document.getElementById('logoutBtn').addEventListener('click', async () => {
  await auth.signOut();
  window.location.href = 'index.html';
});

// ── INIT ────────────────────────────────────────────────────
async function init() {
  await Promise.all([loadProjects(), loadBlogs(), loadSkills(), loadExperience(), loadSettings(), loadAppearance()]);
}

// ── TABS ────────────────────────────────────────────────────
document.querySelectorAll('.nav-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    const tab = btn.dataset.tab;
    document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.tab-pane').forEach(p => p.classList.remove('active'));
    btn.classList.add('active');
    document.getElementById('tab-' + tab).classList.add('active');
    currentTab = tab;
  });
});

// ── PROJECTS ────────────────────────────────────────────────
async function loadProjects() {
  try {
    const snap = await db.collection('projects').orderBy('order').get();
    projects = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    renderProjects();
    if (projects.length === 0) {
      document.getElementById('seedBannerProjects').style.display = 'flex';
    }
  } catch (e) {
    document.getElementById('projectsList').innerHTML =
      `<div class="empty-state"><div class="empty-state-icon">⚠️</div><h3>Could not load projects</h3><p>${e.message}</p></div>`;
  }
}

function renderProjects() {
  const container = document.getElementById('projectsList');
  if (projects.length === 0) {
    container.innerHTML = `<div class="empty-state"><div class="empty-state-icon">📂</div><h3>No projects yet</h3><p>Click "+ Add Project" to add your first project.</p></div>`;
    return;
  }
  container.innerHTML = projects.map(p => `
    <div class="item-row">
      <span class="item-order">${p.order || '–'}</span>
      <div class="item-info">
        <div class="item-title">${esc(p.title)}</div>
        <div class="item-meta">${esc(p.category || '')}</div>
        <div class="item-excerpt">${esc(p.tech || '')}</div>
      </div>
      ${p.featured ? `<span class="badge badge-featured">Featured</span>` : ''}
      <div class="toggle-wrap">
        <span class="toggle-label">Visible</span>
        <label class="toggle">
          <input type="checkbox" ${p.visible !== false ? 'checked' : ''} onchange="toggleProjectVisible('${p.id}', this.checked)">
          <span class="toggle-slider"></span>
        </label>
      </div>
      <div class="item-actions">
        <button class="btn-edit"   onclick="openProjectDrawer('${p.id}')">Edit</button>
        <button class="btn-danger" onclick="confirmDelete('project', '${p.id}', '${esc(p.title)}')">Delete</button>
      </div>
    </div>
  `).join('');
}

async function toggleProjectVisible(id, visible) {
  try {
    await db.collection('projects').doc(id).update({ visible });
    const p = projects.find(x => x.id === id);
    if (p) p.visible = visible;
    showToast(visible ? 'Project is now visible' : 'Project hidden', 'success');
  } catch (e) { showToast('Error: ' + e.message, 'error'); }
}

async function saveProject(data) {
  try {
    if (editingId) {
      await db.collection('projects').doc(editingId).update(data);
      showToast('Project updated!', 'success');
    } else {
      data.createdAt = firebase.firestore.FieldValue.serverTimestamp();
      await db.collection('projects').add(data);
      showToast('Project added!', 'success');
    }
    closeDrawer();
    await loadProjects();
  } catch (e) { showToast('Error: ' + e.message, 'error'); }
}

async function deleteProject(id) {
  try {
    await db.collection('projects').doc(id).delete();
    showToast('Project deleted', 'success');
    await loadProjects();
  } catch (e) { showToast('Error: ' + e.message, 'error'); }
}

// ── BLOG ────────────────────────────────────────────────────
async function loadBlogs() {
  try {
    const snap = await db.collection('blogs').orderBy('createdAt', 'desc').get();
    blogs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    renderBlogs();
  } catch (e) {
    document.getElementById('blogList').innerHTML =
      `<div class="empty-state"><div class="empty-state-icon">⚠️</div><h3>Could not load posts</h3><p>${e.message}</p></div>`;
  }
}

function renderBlogs() {
  const container = document.getElementById('blogList');
  if (blogs.length === 0) {
    container.innerHTML = `<div class="empty-state"><div class="empty-state-icon">✍️</div><h3>No blog posts yet</h3><p>Click "+ Add Post" to write your first post.</p></div>`;
    return;
  }
  container.innerHTML = blogs.map(b => `
    <div class="item-row">
      <div class="item-info">
        <div class="item-title">${esc(b.title)}</div>
        <div class="item-meta">${esc(b.date || '')} · ${esc(b.category || '')}</div>
        <div class="item-excerpt">${esc(b.excerpt || '')}</div>
      </div>
      <span class="badge ${b.published ? 'badge-published' : 'badge-draft'}">${b.published ? 'Published' : 'Draft'}</span>
      <div class="toggle-wrap">
        <span class="toggle-label">Published</span>
        <label class="toggle">
          <input type="checkbox" ${b.published ? 'checked' : ''} onchange="toggleBlogPublished('${b.id}', this.checked)">
          <span class="toggle-slider"></span>
        </label>
      </div>
      <div class="item-actions">
        <button class="btn-edit"   onclick="openBlogDrawer('${b.id}')">Edit</button>
        <button class="btn-danger" onclick="confirmDelete('blog', '${b.id}', '${esc(b.title)}')">Delete</button>
      </div>
    </div>
  `).join('');
}

async function toggleBlogPublished(id, published) {
  try {
    await db.collection('blogs').doc(id).update({ published });
    const b = blogs.find(x => x.id === id);
    if (b) b.published = published;
    showToast(published ? 'Post published!' : 'Post moved to draft', 'success');
  } catch (e) { showToast('Error: ' + e.message, 'error'); }
}

async function saveBlog(data) {
  try {
    if (editingId) {
      await db.collection('blogs').doc(editingId).update(data);
      showToast('Post updated!', 'success');
    } else {
      data.createdAt = firebase.firestore.FieldValue.serverTimestamp();
      await db.collection('blogs').add(data);
      showToast('Post added!', 'success');
    }
    closeDrawer();
    await loadBlogs();
  } catch (e) { showToast('Error: ' + e.message, 'error'); }
}

async function deleteBlog(id) {
  try {
    await db.collection('blogs').doc(id).delete();
    showToast('Post deleted', 'success');
    await loadBlogs();
  } catch (e) { showToast('Error: ' + e.message, 'error'); }
}

// ── SKILLS ──────────────────────────────────────────────────
async function loadSkills() {
  try {
    const snap = await db.collection('skills').orderBy('order').get();
    skills = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    renderSkills();
  } catch (e) {
    document.getElementById('skillsList').innerHTML =
      `<div class="empty-state"><div class="empty-state-icon">⚠️</div><h3>Could not load skills</h3><p>${e.message}</p></div>`;
  }
}

function renderSkills() {
  const container = document.getElementById('skillsList');
  if (skills.length === 0) {
    container.innerHTML = `<div class="empty-state"><div class="empty-state-icon">🛠️</div><h3>No skill categories yet</h3><p>Click "+ Add Category" to add your first skill group, or use "Import Existing Data" on the Projects tab to seed defaults.</p></div>`;
    return;
  }
  container.innerHTML = skills.map(s => `
    <div class="item-row">
      <span class="item-order">${s.order || '–'}</span>
      <div class="item-info">
        <div class="item-title">${esc(s.icon || '')} ${esc(s.name)}</div>
        <div class="item-meta">${(s.tags || []).length} skill${(s.tags || []).length !== 1 ? 's' : ''}</div>
        <div class="item-excerpt">${esc((s.tags || []).join(' · '))}</div>
      </div>
      <div class="toggle-wrap">
        <span class="toggle-label">Visible</span>
        <label class="toggle">
          <input type="checkbox" ${s.visible !== false ? 'checked' : ''} onchange="toggleSkillVisible('${s.id}', this.checked)">
          <span class="toggle-slider"></span>
        </label>
      </div>
      <div class="item-actions">
        <button class="btn-edit"   onclick="openSkillDrawer('${s.id}')">Edit</button>
        <button class="btn-danger" onclick="confirmDelete('skill', '${s.id}', '${esc(s.name)}')">Delete</button>
      </div>
    </div>
  `).join('');
}

async function toggleSkillVisible(id, visible) {
  try {
    await db.collection('skills').doc(id).update({ visible });
    const s = skills.find(x => x.id === id);
    if (s) s.visible = visible;
    showToast(visible ? 'Skill category visible' : 'Skill category hidden', 'success');
  } catch (e) { showToast('Error: ' + e.message, 'error'); }
}

async function saveSkill(data) {
  try {
    if (editingId) {
      await db.collection('skills').doc(editingId).update(data);
      showToast('Skill category updated!', 'success');
    } else {
      data.createdAt = firebase.firestore.FieldValue.serverTimestamp();
      await db.collection('skills').add(data);
      showToast('Skill category added!', 'success');
    }
    closeDrawer();
    await loadSkills();
  } catch (e) { showToast('Error: ' + e.message, 'error'); }
}

async function deleteSkill(id) {
  try {
    await db.collection('skills').doc(id).delete();
    showToast('Skill category deleted', 'success');
    await loadSkills();
  } catch (e) { showToast('Error: ' + e.message, 'error'); }
}

// ── EXPERIENCE ──────────────────────────────────────────────
async function loadExperience() {
  try {
    const snap = await db.collection('experience').orderBy('order').get();
    experience = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    renderExperience();
  } catch (e) {
    document.getElementById('experienceList').innerHTML =
      `<div class="empty-state"><div class="empty-state-icon">⚠️</div><h3>Could not load experience</h3><p>${e.message}</p></div>`;
  }
}

function renderExperience() {
  const container = document.getElementById('experienceList');
  if (experience.length === 0) {
    container.innerHTML = `<div class="empty-state"><div class="empty-state-icon">💼</div><h3>No experience entries yet</h3><p>Click "+ Add Role" to add your first work experience entry.</p></div>`;
    return;
  }
  container.innerHTML = experience.map(ex => `
    <div class="item-row">
      <span class="item-order">${ex.order || '–'}</span>
      <div class="item-info">
        <div class="item-title">${esc(ex.role)}</div>
        <div class="item-meta">${esc(ex.company || '')}${ex.location ? ' · ' + esc(ex.location) : ''}</div>
        <div class="item-excerpt">${esc(ex.duration || '')}${ex.type ? ' · ' + esc(ex.type) : ''}</div>
      </div>
      ${ex.current ? `<span class="badge badge-featured">Current</span>` : ''}
      <div class="toggle-wrap">
        <span class="toggle-label">Visible</span>
        <label class="toggle">
          <input type="checkbox" ${ex.visible !== false ? 'checked' : ''} onchange="toggleExperienceVisible('${ex.id}', this.checked)">
          <span class="toggle-slider"></span>
        </label>
      </div>
      <div class="item-actions">
        <button class="btn-edit"   onclick="openExperienceDrawer('${ex.id}')">Edit</button>
        <button class="btn-danger" onclick="confirmDelete('experience', '${ex.id}', '${esc(ex.role)}')">Delete</button>
      </div>
    </div>
  `).join('');
}

async function toggleExperienceVisible(id, visible) {
  try {
    await db.collection('experience').doc(id).update({ visible });
    const ex = experience.find(x => x.id === id);
    if (ex) ex.visible = visible;
    showToast(visible ? 'Experience entry visible' : 'Experience entry hidden', 'success');
  } catch (e) { showToast('Error: ' + e.message, 'error'); }
}

async function saveExperience(data) {
  try {
    if (editingId) {
      await db.collection('experience').doc(editingId).update(data);
      showToast('Experience updated!', 'success');
    } else {
      data.createdAt = firebase.firestore.FieldValue.serverTimestamp();
      await db.collection('experience').add(data);
      showToast('Experience added!', 'success');
    }
    closeDrawer();
    await loadExperience();
  } catch (e) { showToast('Error: ' + e.message, 'error'); }
}

async function deleteExperience(id) {
  try {
    await db.collection('experience').doc(id).delete();
    showToast('Experience entry deleted', 'success');
    await loadExperience();
  } catch (e) { showToast('Error: ' + e.message, 'error'); }
}

// ── SETTINGS ────────────────────────────────────────────────
async function loadSettings() {
  try {
    const doc = await db.collection('settings').doc('profile').get();
    if (!doc.exists) return;
    const s = doc.data();
    if (s.availableForRoles !== undefined)
      document.getElementById('settingAvailable').checked = s.availableForRoles;
    if (s.stats) {
      document.getElementById('statProjects').value = s.stats.projects || '8+';
      document.getElementById('statDomains').value  = s.stats.domains  || '4+';
      document.getElementById('statOther').value    = s.stats.other    || '∞';
    }
    if (s.aboutParagraphs) {
      document.getElementById('aboutP1').value = s.aboutParagraphs[0] || '';
      document.getElementById('aboutP2').value = s.aboutParagraphs[1] || '';
      document.getElementById('aboutP3').value = s.aboutParagraphs[2] || '';
    }
    if (s.typingPhrases) {
      document.getElementById('typingPhrases').value = s.typingPhrases.join('\n');
    }
  } catch (e) { /* Settings not critical, fail silently */ }
}

document.getElementById('saveSettingsBtn').addEventListener('click', async () => {
  const btn = document.getElementById('saveSettingsBtn');
  btn.textContent = 'Saving…';
  btn.disabled = true;
  try {
    const phrases = document.getElementById('typingPhrases').value
      .split('\n').map(l => l.trim()).filter(Boolean);
    await db.collection('settings').doc('profile').set({
      availableForRoles: document.getElementById('settingAvailable').checked,
      stats: {
        projects: document.getElementById('statProjects').value.trim(),
        domains:  document.getElementById('statDomains').value.trim(),
        other:    document.getElementById('statOther').value.trim()
      },
      aboutParagraphs: [
        document.getElementById('aboutP1').value.trim(),
        document.getElementById('aboutP2').value.trim(),
        document.getElementById('aboutP3').value.trim()
      ],
      typingPhrases: phrases.length ? phrases : ['Machine Learning models.', 'FastAPI backends.']
    }, { merge: true });
    showToast('Settings saved!', 'success');
  } catch (e) { showToast('Error: ' + e.message, 'error'); }
  btn.textContent = 'Save Changes';
  btn.disabled = false;
});

// ── DRAWER — PROJECTS ────────────────────────────────────────
document.getElementById('addProjectBtn').addEventListener('click', () => openProjectDrawer(null));

function openProjectDrawer(id) {
  drawerMode = 'project';
  editingId  = id;
  const p    = id ? projects.find(x => x.id === id) : null;

  document.getElementById('drawerTitle').textContent = p ? 'Edit Project' : 'Add Project';
  document.getElementById('drawerBody').innerHTML = `
    <div class="field-group">
      <label class="field-label">Project Title *</label>
      <input class="field-input" id="f-title" placeholder="Loan Approval Prediction" value="${esc(p?.title || '')}">
    </div>
    <div class="field-group">
      <label class="field-label">Category / Domain</label>
      <input class="field-input" id="f-cat" placeholder="FINANCE AI · MACHINE LEARNING" value="${esc(p?.category || '')}">
    </div>
    <div class="field-group">
      <label class="field-label">Description *</label>
      <textarea class="field-textarea" id="f-desc" placeholder="What does this project do?">${esc(p?.description || '')}</textarea>
    </div>
    <div class="field-group">
      <label class="field-label">Tech Stack</label>
      <input class="field-input" id="f-tech" placeholder="Python · FastAPI · MongoDB · Docker" value="${esc(p?.tech || '')}">
      <p class="field-hint">Separate with · (middle dot) or commas</p>
    </div>
    <div class="field-row">
      <div class="field-group">
        <label class="field-label">Live URL</label>
        <input class="field-input" id="f-live" type="url" placeholder="https://..." value="${esc(p?.liveUrl || '')}">
      </div>
      <div class="field-group">
        <label class="field-label">Source Code URL</label>
        <input class="field-input" id="f-source" type="url" placeholder="https://github.com/..." value="${esc(p?.sourceUrl || '')}">
      </div>
    </div>
    <div class="field-row">
      <div class="field-group">
        <label class="field-label">Document / Detail URL</label>
        <input class="field-input" id="f-doc" placeholder="project-detail.html" value="${esc(p?.documentUrl || '')}">
      </div>
      <div class="field-group">
        <label class="field-label">Display Order</label>
        <input class="field-input" id="f-order" type="number" min="1" placeholder="1" value="${p?.order || ''}">
        <p class="field-hint">Lower = appears first</p>
      </div>
    </div>
    <div class="field-group">
      <div class="field-toggle-row" style="margin-bottom:0.75rem;">
        <span class="field-toggle-label">Featured (full-width card)</span>
        <label class="toggle">
          <input type="checkbox" id="f-featured" ${p?.featured ? 'checked' : ''}>
          <span class="toggle-slider"></span>
        </label>
      </div>
      <div class="field-toggle-row">
        <span class="field-toggle-label">Visible on site</span>
        <label class="toggle">
          <input type="checkbox" id="f-visible" ${p?.visible !== false ? 'checked' : ''}>
          <span class="toggle-slider"></span>
        </label>
      </div>
    </div>
  `;
  openDrawer();
}

// ── DRAWER — BLOG ────────────────────────────────────────────
document.getElementById('addBlogBtn').addEventListener('click', () => openBlogDrawer(null));

function openBlogDrawer(id) {
  drawerMode = 'blog';
  editingId  = id;
  const b    = id ? blogs.find(x => x.id === id) : null;

  document.getElementById('drawerTitle').textContent = b ? 'Edit Blog Post' : 'Add Blog Post';
  document.getElementById('drawerBody').innerHTML = `
    <div class="field-group">
      <label class="field-label">Post Title *</label>
      <input class="field-input" id="b-title" placeholder="How I Built a Fraud Detector..." value="${esc(b?.title || '')}">
    </div>
    <div class="field-row">
      <div class="field-group">
        <label class="field-label">Date Label</label>
        <input class="field-input" id="b-date" placeholder="MAY 2026" value="${esc(b?.date || '')}">
      </div>
      <div class="field-group">
        <label class="field-label">Category</label>
        <input class="field-input" id="b-cat" placeholder="ARCHITECTURE" value="${esc(b?.category || '')}">
      </div>
    </div>
    <div class="field-group">
      <label class="field-label">URL Slug</label>
      <input class="field-input" id="b-slug" placeholder="how-i-built-fraud-detector" value="${esc(b?.slug || '')}">
      <p class="field-hint">Lowercase, hyphens only. Used in the page URL.</p>
    </div>
    <div class="field-group">
      <label class="field-label">Tags</label>
      <input class="field-input" id="b-tags" placeholder="Computer Vision, System Design, FastAPI" value="${esc((b?.tags || []).join(', '))}">
      <p class="field-hint">Comma-separated tags</p>
    </div>
    <div class="field-group">
      <label class="field-label">Excerpt *</label>
      <textarea class="field-textarea" id="b-excerpt" placeholder="A short summary shown in the blog list...">${esc(b?.excerpt || '')}</textarea>
    </div>
    <div class="field-group">
      <label class="field-label">Full Content (HTML)</label>
      <textarea class="field-textarea content" id="b-content"
        placeholder="Write your blog post here. Use HTML: &lt;h2&gt;, &lt;p&gt;, &lt;code&gt;, &lt;pre&gt;, &lt;ul&gt;, etc.">${esc(b?.content || '')}</textarea>
      <p class="field-hint">Supports HTML tags. Use &lt;h2&gt; for sections, &lt;code&gt; for inline code, &lt;pre&gt;&lt;code&gt; for code blocks.</p>
    </div>
    <div class="field-toggle-row">
      <span class="field-toggle-label">Published (visible on blog page)</span>
      <label class="toggle">
        <input type="checkbox" id="b-published" ${b?.published ? 'checked' : ''}>
        <span class="toggle-slider"></span>
      </label>
    </div>
  `;
  openDrawer();
}

// ── DRAWER — SKILLS ──────────────────────────────────────────
document.getElementById('addSkillBtn').addEventListener('click', () => openSkillDrawer(null));

function openSkillDrawer(id) {
  drawerMode = 'skill';
  editingId  = id;
  const sk   = id ? skills.find(x => x.id === id) : null;

  document.getElementById('drawerTitle').textContent = sk ? 'Edit Skill Category' : 'Add Skill Category';
  document.getElementById('drawerBody').innerHTML = `
    <div class="field-row">
      <div class="field-group" style="flex:0 0 100px;">
        <label class="field-label">Icon (Emoji)</label>
        <input class="field-input" id="sk-icon" placeholder="🐍" maxlength="4" style="text-align:center;font-size:1.4rem;" value="${esc(sk?.icon || '')}">
      </div>
      <div class="field-group">
        <label class="field-label">Category Name *</label>
        <input class="field-input" id="sk-name" placeholder="Languages" value="${esc(sk?.name || '')}">
      </div>
    </div>
    <div class="field-group">
      <label class="field-label">Skills / Tags *</label>
      <textarea class="field-textarea" id="sk-tags" placeholder="Python&#10;JavaScript&#10;Node.js&#10;SQL" rows="6">${esc((sk?.tags || []).join('\n'))}</textarea>
      <p class="field-hint">One skill per line</p>
    </div>
    <div class="field-row">
      <div class="field-group">
        <label class="field-label">Display Order</label>
        <input class="field-input" id="sk-order" type="number" min="1" placeholder="1" value="${sk?.order || ''}">
        <p class="field-hint">Lower = appears first</p>
      </div>
      <div class="field-group" style="padding-top:1.5rem;">
        <div class="field-toggle-row">
          <span class="field-toggle-label">Visible on site</span>
          <label class="toggle">
            <input type="checkbox" id="sk-visible" ${sk?.visible !== false ? 'checked' : ''}>
            <span class="toggle-slider"></span>
          </label>
        </div>
      </div>
    </div>
  `;
  openDrawer();
}

// ── DRAWER — EXPERIENCE ───────────────────────────────────────
document.getElementById('addExperienceBtn').addEventListener('click', () => openExperienceDrawer(null));

function openExperienceDrawer(id) {
  drawerMode = 'experience';
  editingId  = id;
  const ex   = id ? experience.find(x => x.id === id) : null;

  const typeOptions = ['Internship', 'Full-time', 'Part-time', 'Freelance', 'Contract', 'Open Source'];
  const typeSelect  = typeOptions.map(t =>
    `<option${ex?.type === t ? ' selected' : ''}>${t}</option>`
  ).join('');

  document.getElementById('drawerTitle').textContent = ex ? 'Edit Experience' : 'Add Experience';
  document.getElementById('drawerBody').innerHTML = `
    <div class="field-group">
      <label class="field-label">Role / Job Title *</label>
      <input class="field-input" id="ex-role" placeholder="Software Developer Intern" value="${esc(ex?.role || '')}">
    </div>
    <div class="field-row">
      <div class="field-group">
        <label class="field-label">Company *</label>
        <input class="field-input" id="ex-company" placeholder="XYZ Technologies" value="${esc(ex?.company || '')}">
      </div>
      <div class="field-group">
        <label class="field-label">Location</label>
        <input class="field-input" id="ex-location" placeholder="Mumbai, India" value="${esc(ex?.location || '')}">
      </div>
    </div>
    <div class="field-row">
      <div class="field-group">
        <label class="field-label">Duration *</label>
        <input class="field-input" id="ex-duration" placeholder="Jan 2025 – Jun 2025" value="${esc(ex?.duration || '')}">
      </div>
      <div class="field-group">
        <label class="field-label">Type</label>
        <select class="field-select" id="ex-type">${typeSelect}</select>
      </div>
    </div>
    <div class="field-group">
      <label class="field-label">Description</label>
      <textarea class="field-textarea" id="ex-desc" placeholder="Brief overview of the role...">${esc(ex?.description || '')}</textarea>
    </div>
    <div class="field-group">
      <label class="field-label">Key Achievements</label>
      <textarea class="field-textarea" id="ex-bullets" rows="5"
        placeholder="Built ML models for fraud detection&#10;Reduced API latency by 45%&#10;Led team of 3 engineers">${esc((ex?.bullets || []).join('\n'))}</textarea>
      <p class="field-hint">One bullet point per line</p>
    </div>
    <div class="field-group">
      <label class="field-label">Tech Stack</label>
      <input class="field-input" id="ex-tech" placeholder="Python · FastAPI · MongoDB" value="${esc(ex?.tech || '')}">
    </div>
    <div class="field-row">
      <div class="field-group">
        <label class="field-label">Display Order</label>
        <input class="field-input" id="ex-order" type="number" min="1" placeholder="1" value="${ex?.order || ''}">
        <p class="field-hint">Lower = appears first</p>
      </div>
      <div class="field-group">
        <div class="field-toggle-row" style="margin-top:1.5rem;margin-bottom:0.75rem;">
          <span class="field-toggle-label">Current role</span>
          <label class="toggle">
            <input type="checkbox" id="ex-current" ${ex?.current ? 'checked' : ''}>
            <span class="toggle-slider"></span>
          </label>
        </div>
        <div class="field-toggle-row">
          <span class="field-toggle-label">Visible on site</span>
          <label class="toggle">
            <input type="checkbox" id="ex-visible" ${ex?.visible !== false ? 'checked' : ''}>
            <span class="toggle-slider"></span>
          </label>
        </div>
      </div>
    </div>
  `;
  openDrawer();
}

// ── DRAWER — GENERIC ─────────────────────────────────────────
function openDrawer() {
  document.getElementById('drawerOverlay').classList.add('open');
  document.getElementById('drawer').classList.add('open');
}
function closeDrawer() {
  document.getElementById('drawerOverlay').classList.remove('open');
  document.getElementById('drawer').classList.remove('open');
  editingId = null;
  drawerMode = null;
}

document.getElementById('drawerClose').addEventListener('click', closeDrawer);
document.getElementById('drawerCancel').addEventListener('click', closeDrawer);
document.getElementById('drawerOverlay').addEventListener('click', closeDrawer);

document.getElementById('drawerSave').addEventListener('click', async () => {
  const btn = document.getElementById('drawerSave');
  btn.textContent = 'Saving…';
  btn.disabled = true;

  if (drawerMode === 'project') {
    const title = document.getElementById('f-title')?.value.trim();
    if (!title) { showToast('Title is required', 'error'); btn.textContent = 'Save'; btn.disabled = false; return; }
    await saveProject({
      title,
      category:    document.getElementById('f-cat').value.trim(),
      description: document.getElementById('f-desc').value.trim(),
      tech:        document.getElementById('f-tech').value.trim(),
      liveUrl:     document.getElementById('f-live').value.trim(),
      sourceUrl:   document.getElementById('f-source').value.trim(),
      documentUrl: document.getElementById('f-doc').value.trim(),
      order:       parseInt(document.getElementById('f-order').value) || 99,
      featured:    document.getElementById('f-featured').checked,
      visible:     document.getElementById('f-visible').checked
    });
  } else if (drawerMode === 'blog') {
    const title = document.getElementById('b-title')?.value.trim();
    if (!title) { showToast('Title is required', 'error'); btn.textContent = 'Save'; btn.disabled = false; return; }
    const rawTags = document.getElementById('b-tags').value;
    const tags = rawTags ? rawTags.split(',').map(t => t.trim()).filter(Boolean) : [];
    await saveBlog({
      title,
      date:      document.getElementById('b-date').value.trim(),
      category:  document.getElementById('b-cat').value.trim(),
      slug:      document.getElementById('b-slug').value.trim().toLowerCase().replace(/\s+/g, '-'),
      tags,
      excerpt:   document.getElementById('b-excerpt').value.trim(),
      content:   document.getElementById('b-content').value,
      published: document.getElementById('b-published').checked
    });
  } else if (drawerMode === 'skill') {
    const name = document.getElementById('sk-name')?.value.trim();
    if (!name) { showToast('Category name is required', 'error'); btn.textContent = 'Save'; btn.disabled = false; return; }
    const tags = document.getElementById('sk-tags').value
      .split('\n').map(t => t.trim()).filter(Boolean);
    await saveSkill({
      icon:    document.getElementById('sk-icon').value.trim(),
      name,
      tags,
      order:   parseInt(document.getElementById('sk-order').value) || 99,
      visible: document.getElementById('sk-visible').checked
    });
  } else if (drawerMode === 'experience') {
    const role = document.getElementById('ex-role')?.value.trim();
    if (!role) { showToast('Role is required', 'error'); btn.textContent = 'Save'; btn.disabled = false; return; }
    const company = document.getElementById('ex-company')?.value.trim();
    if (!company) { showToast('Company is required', 'error'); btn.textContent = 'Save'; btn.disabled = false; return; }
    const bullets = document.getElementById('ex-bullets').value
      .split('\n').map(b => b.trim()).filter(Boolean);
    await saveExperience({
      role,
      company,
      location:    document.getElementById('ex-location').value.trim(),
      duration:    document.getElementById('ex-duration').value.trim(),
      type:        document.getElementById('ex-type').value,
      description: document.getElementById('ex-desc').value.trim(),
      bullets,
      tech:        document.getElementById('ex-tech').value.trim(),
      order:       parseInt(document.getElementById('ex-order').value) || 99,
      current:     document.getElementById('ex-current').checked,
      visible:     document.getElementById('ex-visible').checked
    });
  }

  btn.textContent = 'Save';
  btn.disabled = false;
});

// ── CONFIRM DELETE ───────────────────────────────────────────
function confirmDelete(type, id, name) {
  document.getElementById('confirmTitle').textContent = `Delete "${name}"?`;
  document.getElementById('confirmMsg').textContent   = 'This will permanently remove it from your portfolio.';
  document.getElementById('confirmOverlay').classList.add('open');
  confirmCb = async () => {
    document.getElementById('confirmOverlay').classList.remove('open');
    if (type === 'project')         await deleteProject(id);
    else if (type === 'blog')       await deleteBlog(id);
    else if (type === 'skill')      await deleteSkill(id);
    else                            await deleteExperience(id);
  };
}
document.getElementById('confirmOk').addEventListener('click', () => { if (confirmCb) confirmCb(); });
document.getElementById('confirmCancel').addEventListener('click', () => {
  document.getElementById('confirmOverlay').classList.remove('open');
  confirmCb = null;
});

// ── SEED INITIAL DATA ────────────────────────────────────────
document.getElementById('seedBtn').addEventListener('click', async () => {
  const btn = document.getElementById('seedBtn');
  btn.textContent = 'Importing…';
  btn.disabled = true;

  const initialProjects = [
    { title: 'Loan Approval Prediction', category: 'FINANCE AI · MACHINE LEARNING', description: 'End-to-end classification architecture utilizing advanced statistical modeling and linear algebra optimizations. Correlation matrix determinant hacks for multicollinearity detection, covariance-based dimensionality reduction. Sub-100ms inference via Flask API.', tech: 'Random Forest · Gradient Boosting · Pandas · NumPy · Flask · Joblib · Render', liveUrl: 'https://loan-approval-prediction-j50e.onrender.com', sourceUrl: 'https://github.com/varmaManish', documentUrl: 'project-detail.html', order: 1, featured: true, visible: true },
    { title: 'Fashion Recommendation System', category: 'E-COMMERCE · MACHINE LEARNING', description: 'End-to-end classification architecture utilizing advanced statistical modeling and linear algebra optimizations to recommend related products with high precision.', tech: 'Random Forest · Gradient Boosting · Pandas · NumPy · Flask · Render', liveUrl: '', sourceUrl: 'https://github.com/varmaManish/Fashion-Recomendation-system-Using-ML-DL/tree/master', documentUrl: 'projectDocument/Fashion recomendation.html', order: 2, featured: false, visible: true },
    { title: 'Heart Attack Prediction', category: 'HEALTHCARE AI', description: 'Clinical ML model analyzing patient health metrics — blood pressure, cholesterol, ECG patterns — to predict cardiac risk with explainable statistical outputs for medical decision support.', tech: 'Python · Scikit-Learn · Statistical Modeling · Healthcare Data', liveUrl: '', sourceUrl: 'https://github.com/varmaManish', documentUrl: 'project-detail.html', order: 3, featured: false, visible: true },
    { title: 'Prostate Cancer Detection', category: 'DIAGNOSTIC AI', description: 'Diagnostic AI system for cancer stage classification using biopsy datasets. Statistical feature engineering and ensemble modeling for high-precision clinical classification.', tech: 'Scikit-Learn · Data Analysis · Ensemble Methods · ML', liveUrl: '', sourceUrl: 'https://github.com/varmaManish', documentUrl: 'project-detail.html', order: 4, featured: false, visible: true },
    { title: 'Fake UPI Screenshot Detector', category: 'COMPUTER VISION · SECURITY', description: 'AI-powered fraud detection system analyzing manipulated UPI payment screenshots via OCR and heuristic pixel analysis. 45% latency reduction through optimized matrix preprocessing.', tech: 'Tesseract · OpenCV · FastAPI · MongoDB · Docker · AWS', liveUrl: '', sourceUrl: 'https://github.com/varmaManish', documentUrl: 'project-detail.html', order: 5, featured: false, visible: true },
    { title: 'GitHub Repository Analyzer', category: 'DATA ANALYTICS', description: 'Advanced analytics platform offering contributor insights, commit trend analysis, and repository intelligence with interactive visualizations and dependency graphs.', tech: 'FastAPI · JavaScript · Chart.js · Mermaid.js · GitHub API', liveUrl: '', sourceUrl: 'https://github.com/varmaManish', documentUrl: 'projectDocument/Repoanlyzer.html', order: 6, featured: false, visible: true },
    { title: 'Custom EPUB Reader', category: 'FULL STACK UTILITY', description: 'Calibre-inspired EPUB reader with custom rendering architecture, optimized font stacks, chapter indexing, and progress tracking for a superior digital reading experience.', tech: 'Python · Document Parsing · Custom Architecture · JS', liveUrl: '', sourceUrl: 'https://github.com/varmaManish', documentUrl: 'project-detail.html', order: 7, featured: false, visible: true },
    { title: 'AI Healthcare Companion', category: 'HEALTHCARE AI', description: 'Intelligent healthcare assistant platform driven by ML-backed symptom analysis, API integrations, and conversational support for patient-facing diagnostic guidance.', tech: 'AI · ML · FastAPI · Full Stack · REST APIs', liveUrl: '', sourceUrl: 'https://github.com/varmaManish', documentUrl: 'project-detail.html', order: 8, featured: false, visible: true },
    { title: 'Word to EPUB Automation', category: 'AUTOMATION PIPELINE', description: 'Intelligent pipeline converting unstructured Word documents into structured, standards-compliant EPUB publications with automated chapter detection and metadata injection.', tech: 'AutoGen · Python · EPUB Processing · Document Parsing', liveUrl: '', sourceUrl: 'https://github.com/varmaManish', documentUrl: 'project-detail.html', order: 9, featured: false, visible: true },
    { title: 'Chrome Extension Sentiment Analysis', category: 'COMPUTER VISION · SECURITY', description: 'AI-powered fraud detection analyzing manipulated UPI payment screenshots via OCR and heuristic pixel analysis. 45% latency reduction through optimized image preprocessing.', tech: 'Tesseract · OpenCV · FastAPI · MongoDB · Docker', liveUrl: '', sourceUrl: 'https://github.com/varmaManish', documentUrl: 'project-detail.html', order: 10, featured: false, visible: true }
  ];

  const initialBlogs = [
    { title: 'How I Built a Fake UPI Screenshot Detector using OCR & FastAPI', date: 'MAY 2026', category: 'ARCHITECTURE', slug: 'fake-upi-screenshot-detector', tags: ['Computer Vision', 'System Design'], excerpt: 'A deep dive into the engineering decisions behind a fraud detection system, analyzing image manipulation artifacts using Tesseract and Python.', content: '<h2>Overview</h2><p>A deep dive into the engineering decisions behind a fraud detection system, analyzing image manipulation artifacts using Tesseract and Python.</p><p>Edit this post in the admin panel to add your full article content.</p>', published: true },
    { title: 'Flask vs FastAPI: Benchmarking for AI Applications', date: 'APR 2026', category: 'BACKEND', slug: 'flask-vs-fastapi-benchmark', tags: ['FastAPI', 'Performance'], excerpt: 'When deploying machine learning models, async I/O matters. Here is a performance breakdown between Flask and FastAPI under heavy ML inference loads.', content: '<h2>Overview</h2><p>When deploying machine learning models, async I/O matters. Here is a performance breakdown between Flask and FastAPI under heavy ML inference loads.</p><p>Edit this post in the admin panel to add your full article content.</p>', published: true },
    { title: 'Optimizing Matrix Operations for Faster Model Inference', date: 'MAR 2026', category: 'MACHINE LEARNING', slug: 'optimizing-matrix-operations', tags: ['Mathematics', 'NumPy'], excerpt: 'Exploring mathematical hacks and linear algebra shortcuts to reduce computational overhead in statistical models.', content: '<h2>Overview</h2><p>Exploring mathematical hacks and linear algebra shortcuts to reduce computational overhead in statistical models.</p><p>Edit this post in the admin panel to add your full article content.</p>', published: true },
    { title: 'Building End-to-End Machine Learning Systems', date: 'FEB 2026', category: 'ENGINEERING', slug: 'end-to-end-ml-systems', tags: ['MLOps', 'Architecture'], excerpt: 'Why Jupyter Notebooks are not enough. A guide to transitioning from exploratory data analysis to production-ready deployment.', content: '<h2>Overview</h2><p>Why Jupyter Notebooks are not enough. A guide to transitioning from exploratory data analysis to production-ready deployment.</p><p>Edit this post in the admin panel to add your full article content.</p>', published: true }
  ];

  try {
    const batch1 = db.batch();
    for (const p of initialProjects) {
      batch1.set(db.collection('projects').doc(), { ...p, createdAt: firebase.firestore.FieldValue.serverTimestamp() });
    }
    await batch1.commit();

    const batch2 = db.batch();
    for (const b of initialBlogs) {
      batch2.set(db.collection('blogs').doc(), { ...b, createdAt: firebase.firestore.FieldValue.serverTimestamp() });
    }
    await batch2.commit();

    const initialSkills = [
      { icon: '🐍', name: 'Languages',      tags: ['Python', 'JavaScript', 'Node.js', 'SQL'],              order: 1, visible: true },
      { icon: '⚡', name: 'Backend & APIs', tags: ['FastAPI', 'Flask', 'RESTful', 'Async I/O'],            order: 2, visible: true },
      { icon: '🧠', name: 'ML & Data',      tags: ['Scikit-Learn', 'Pandas', 'NumPy', 'OpenCV'],           order: 3, visible: true },
      { icon: '☁️', name: 'Infra & Tooling', tags: ['MongoDB', 'MySQL', 'Docker', 'AWS', 'Git'],           order: 4, visible: true }
    ];
    const batch3 = db.batch();
    for (const s of initialSkills) {
      batch3.set(db.collection('skills').doc(), { ...s, createdAt: firebase.firestore.FieldValue.serverTimestamp() });
    }
    await batch3.commit();

    document.getElementById('seedBannerProjects').style.display = 'none';
    showToast('✓ Data imported successfully!', 'success');
    await Promise.all([loadProjects(), loadBlogs(), loadSkills()]);
  } catch (e) {
    showToast('Import failed: ' + e.message, 'error');
    btn.textContent = 'Import Existing Data';
    btn.disabled = false;
  }
});

// ── APPEARANCE ───────────────────────────────────────────────

const DEFAULT_COLORS = {
  '--accent':  '#c97d3a',
  '--accent2': '#e8a055',
  '--brown':   '#6b4e35',
  '--darkbr':  '#3d2b1a',
  '--ink':     '#1a0f06',
  '--text':    '#2c1f12',
  '--muted':   '#7a6652',
  '--cream':   '#f5f0e8',
  '--warm0':   '#faf7f2',
  '--warm1':   '#f0e9db',
  '--warm2':   '#e5ddd0'
};

async function loadAppearance() {
  try {
    const doc = await db.collection('settings').doc('appearance').get();
    const saved = doc.exists ? doc.data() : {};
    const merged = { ...DEFAULT_COLORS, ...saved };
    Object.entries(merged).forEach(([varName, value]) => {
      setColorPickerValue(varName, value);
    });
    updatePreview(merged);
  } catch(e) { /* fail silently */ }
}

function setColorPickerValue(varName, value) {
  const swatch = document.getElementById('clr-' + varName);
  const hex    = document.getElementById('hex-' + varName);
  if (swatch) swatch.value = value;
  if (hex)    hex.value    = value;
}

function updatePreview(vars) {
  const preview = document.getElementById('appearancePreview');
  if (!preview) return;
  const p = vars || readCurrentColors();
  preview.style.setProperty('--p-accent',  p['--accent']  || DEFAULT_COLORS['--accent']);
  preview.style.setProperty('--p-accent2', p['--accent2'] || DEFAULT_COLORS['--accent2']);
  preview.style.setProperty('--p-brown',   p['--brown']   || DEFAULT_COLORS['--brown']);
  preview.style.setProperty('--p-ink',     p['--ink']     || DEFAULT_COLORS['--ink']);
  preview.style.setProperty('--p-text',    p['--text']    || DEFAULT_COLORS['--text']);
  preview.style.setProperty('--p-muted',   p['--muted']   || DEFAULT_COLORS['--muted']);
  preview.style.setProperty('--p-cream',   p['--cream']   || DEFAULT_COLORS['--cream']);
  preview.style.setProperty('--p-warm0',   p['--warm0']   || DEFAULT_COLORS['--warm0']);
  preview.style.setProperty('--p-warm1',   p['--warm1']   || DEFAULT_COLORS['--warm1']);
}

function readCurrentColors() {
  const colors = {};
  Object.keys(DEFAULT_COLORS).forEach(varName => {
    const swatch = document.getElementById('clr-' + varName);
    if (swatch) colors[varName] = swatch.value;
  });
  return colors;
}

// Wire up all color pickers — swatch ↔ hex input stay in sync + update preview
document.addEventListener('DOMContentLoaded', () => {
  Object.keys(DEFAULT_COLORS).forEach(varName => {
    const swatch = document.getElementById('clr-' + varName);
    const hex    = document.getElementById('hex-' + varName);
    if (!swatch || !hex) return;

    swatch.addEventListener('input', () => {
      hex.value = swatch.value;
      updatePreview();
    });
    hex.addEventListener('input', () => {
      const val = hex.value.trim();
      if (/^#[0-9a-fA-F]{6}$/.test(val)) {
        swatch.value = val;
        updatePreview();
      }
    });
    hex.addEventListener('blur', () => {
      const val = hex.value.trim();
      if (!/^#[0-9a-fA-F]{6}$/.test(val)) hex.value = swatch.value;
    });
  });
});

document.getElementById('saveAppearanceBtn').addEventListener('click', async () => {
  const btn = document.getElementById('saveAppearanceBtn');
  btn.textContent = 'Saving…';
  btn.disabled = true;
  try {
    const colors = readCurrentColors();
    await db.collection('settings').doc('appearance').set(colors);
    // Cache in localStorage so public pages apply instantly
    localStorage.setItem('mv_theme', JSON.stringify(colors));
    showToast('Theme saved! Changes are live on your site.', 'success');
    updatePreview(colors);
  } catch(e) { showToast('Error: ' + e.message, 'error'); }
  btn.textContent = 'Save & Apply';
  btn.disabled = false;
});

document.getElementById('resetAppearanceBtn').addEventListener('click', async () => {
  if (!confirm('Reset all colors to the original defaults?')) return;
  try {
    await db.collection('settings').doc('appearance').delete();
    localStorage.removeItem('mv_theme');
    Object.entries(DEFAULT_COLORS).forEach(([varName, value]) => {
      setColorPickerValue(varName, value);
    });
    updatePreview(DEFAULT_COLORS);
    showToast('Colors reset to defaults.', 'success');
  } catch(e) { showToast('Error: ' + e.message, 'error'); }
});

// ── HELPERS ──────────────────────────────────────────────────
function esc(str) {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

let toastTimer;
function showToast(msg, type = '') {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.className   = 'toast show ' + type;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove('show'), 3500);
}
