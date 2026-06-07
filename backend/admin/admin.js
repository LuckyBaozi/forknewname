/**
 * 起名小程序 - 后台管理前端逻辑
 * Vanilla JS, no dependencies
 */

let adminKey = '';
let currentPage = 1;

// ============================================================
// Auth
// ============================================================
document.getElementById('key-submit').addEventListener('click', () => {
  adminKey = document.getElementById('key-input').value.trim();
  if (!adminKey) return;
  // Verify by fetching config
  fetch(`/admin/api/config?key=${encodeURIComponent(adminKey)}`)
    .then(r => {
      if (r.ok) {
        document.getElementById('auth-overlay').style.display = 'none';
        document.getElementById('app').style.display = 'block';
        loadNames();
      } else {
        document.getElementById('key-error').textContent = '密钥无效，请重试';
      }
    })
    .catch(() => {
      document.getElementById('key-error').textContent = '连接失败，请检查服务器状态';
    });
});

document.getElementById('key-input').addEventListener('keydown', e => {
  if (e.key === 'Enter') document.getElementById('key-submit').click();
});

// ============================================================
// Tab switching
// ============================================================
document.querySelectorAll('.tab').forEach(tab => {
  tab.addEventListener('click', () => {
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
    tab.classList.add('active');
    document.getElementById(`tab-${tab.dataset.tab}`).classList.add('active');

    const loaders = {
      names: loadNames,
      blacklist: loadBlacklist,
      config: loadConfig,
      stats: loadStats
    };
    if (loaders[tab.dataset.tab]) loaders[tab.dataset.tab]();
  });
});

// ============================================================
// API helpers
// ============================================================
function api(path, options = {}) {
  const sep = path.includes('?') ? '&' : '?';
  const url = `/admin/api${path}${sep}key=${encodeURIComponent(adminKey)}`;
  return fetch(url, {
    headers: { 'Content-Type': 'application/json' },
    ...options
  }).then(r => r.json());
}

// ============================================================
// Names CRUD
// ============================================================
function loadNames() {
  currentPage = 1;
  fetchNames();
}

function fetchNames() {
  const search = document.getElementById('name-search')?.value || '';
  api(`/names?page=${currentPage}&limit=20&search=${encodeURIComponent(search)}`)
    .then(data => {
      if (data.code !== 0) return;
      renderNames(data.data.names);
      document.getElementById('names-pager').textContent =
        `共 ${data.data.total} 条 | 第 ${currentPage} 页`;
    });
}

function renderNames(names) {
  const tbody = document.getElementById('names-tbody');
  tbody.innerHTML = names.map(n => `
    <tr>
      <td>${n.id}</td>
      <td>${esc(n.given_name)}</td>
      <td>${genderLabel(n.gender)}</td>
      <td>${n.name_length === 2 ? '两字名' : '三字名'}</td>
      <td>${(Array.isArray(n.styles) ? n.styles : []).map(s => `<span class="tag">${esc(s)}</span>`).join('')}</td>
      <td>${(Array.isArray(n.zodiac_suits) ? n.zodiac_suits : []).slice(0,4).join(',')}</td>
      <td>${esc(n.pronunciation)}</td>
      <td><span class="${n.is_active ? 'status-active' : 'status-inactive'}">${n.is_active ? '启用' : '停用'}</span></td>
      <td>
        <button class="btn-small" onclick="editName(${n.id})">编辑</button>
        <button class="btn-danger" onclick="deleteName(${n.id})">${n.is_active ? '停用' : '删除'}</button>
      </td>
    </tr>
  `).join('');
}

document.getElementById('btn-add-name').addEventListener('click', () => {
  document.getElementById('nm-id').value = '';
  document.getElementById('name-modal-title').textContent = '添加名字';
  clearNameForm();
  document.getElementById('name-modal').style.display = 'flex';
});

function editName(id) {
  api(`/names?page=1&limit=100`).then(data => {
    const name = data.data.names.find(n => n.id === id);
    if (!name) return;
    document.getElementById('nm-id').value = name.id;
    document.getElementById('name-modal-title').textContent = '编辑名字';
    document.getElementById('nm-given_name').value = name.given_name || '';
    document.getElementById('nm-gender').value = name.gender || 'boy';
    document.getElementById('nm-name_length').value = name.name_length || 2;
    document.getElementById('nm-styles').value = (Array.isArray(name.styles) ? name.styles : []).join(',');
    document.getElementById('nm-zodiac_suits').value = (Array.isArray(name.zodiac_suits) ? name.zodiac_suits : []).join(',');
    document.getElementById('nm-zodiac_avoids').value = (Array.isArray(name.zodiac_avoids) ? name.zodiac_avoids : []).join(',');
    document.getElementById('nm-pronunciation').value = name.pronunciation || '';
    document.getElementById('nm-char_meaning').value = name.char_meaning || '';
    document.getElementById('nm-overall_meaning').value = name.overall_meaning || '';
    document.getElementById('nm-region_tags').value = (Array.isArray(name.region_tags) ? name.region_tags : []).join(',');
    document.getElementById('nm-is_active').checked = name.is_active === 1;
    document.getElementById('name-modal').style.display = 'flex';
  });
}

function deleteName(id) {
  if (!confirm('确定停用/删除该名字？')) return;
  api(`/names/${id}`, { method: 'DELETE' }).then(d => {
    alert(d.message);
    loadNames();
  });
}

document.getElementById('btn-save-name').addEventListener('click', () => {
  const id = document.getElementById('nm-id').value;
  const body = {
    given_name: document.getElementById('nm-given_name').value.trim(),
    gender: document.getElementById('nm-gender').value,
    name_length: parseInt(document.getElementById('nm-name_length').value),
    styles: document.getElementById('nm-styles').value.split(',').map(s => s.trim()).filter(Boolean),
    zodiac_suits: document.getElementById('nm-zodiac_suits').value.split(',').map(s => s.trim()).filter(Boolean),
    zodiac_avoids: document.getElementById('nm-zodiac_avoids').value.split(',').map(s => s.trim()).filter(Boolean),
    pronunciation: document.getElementById('nm-pronunciation').value.trim(),
    char_meaning: document.getElementById('nm-char_meaning').value.trim(),
    overall_meaning: document.getElementById('nm-overall_meaning').value.trim(),
    region_tags: document.getElementById('nm-region_tags').value.split(',').map(s => s.trim()).filter(Boolean),
    is_active: document.getElementById('nm-is_active').checked
  };

  if (!body.given_name || !body.gender) {
    alert('请填写名字和性别');
    return;
  }

  const method = id ? 'PUT' : 'POST';
  const path = id ? `/names/${id}` : '/names';

  api(path, { method, body: JSON.stringify(body) }).then(d => {
    alert(d.message);
    if (d.code === 0) {
      document.getElementById('name-modal').style.display = 'none';
      loadNames();
    }
  });
});

document.getElementById('btn-cancel-name').addEventListener('click', () => {
  document.getElementById('name-modal').style.display = 'none';
});

document.getElementById('name-search').addEventListener('input', () => {
  currentPage = 1;
  fetchNames();
});

function clearNameForm() {
  ['nm-given_name','nm-styles','nm-zodiac_suits','nm-zodiac_avoids','nm-pronunciation',
   'nm-char_meaning','nm-overall_meaning','nm-region_tags'].forEach(id => {
    document.getElementById(id).value = '';
  });
  document.getElementById('nm-gender').value = 'boy';
  document.getElementById('nm-name_length').value = '2';
  document.getElementById('nm-is_active').checked = true;
  document.getElementById('nm-region_tags').value = '全国通用';
}

// ============================================================
// Blacklist
// ============================================================
function loadBlacklist() {
  api('/blacklist').then(data => {
    if (data.code !== 0) return;
    const tbody = document.getElementById('blacklist-tbody');
    tbody.innerHTML = data.data.map(item => `
      <tr>
        <td>${item.id}</td>
        <td style="font-size:1.4em;">${esc(item.character)}</td>
        <td>${esc(item.reason || '-')}</td>
        <td>${item.created_at}</td>
        <td><button class="btn-danger" onclick="removeBlacklist(${item.id})">移除</button></td>
      </tr>
    `).join('');
  });
}

document.getElementById('btn-add-bl').addEventListener('click', () => {
  const character = document.getElementById('bl-char').value.trim();
  const reason = document.getElementById('bl-reason').value.trim();

  if (!character || character.length !== 1) {
    alert('请输入单个汉字');
    return;
  }

  api('/blacklist', { method: 'POST', body: JSON.stringify({ character, reason }) }).then(d => {
    alert(d.message);
    document.getElementById('bl-char').value = '';
    document.getElementById('bl-reason').value = '';
    loadBlacklist();
  });
});

function removeBlacklist(id) {
  if (!confirm('确定移除？')) return;
  api(`/blacklist/${id}`, { method: 'DELETE' }).then(d => {
    alert(d.message);
    loadBlacklist();
  });
}

// ============================================================
// Config
// ============================================================
function loadConfig() {
  api('/config').then(data => {
    if (data.code !== 0) return;
    document.getElementById('cfg-adUnitId').value = data.data.adUnitId || '';
    document.getElementById('cfg-resultCount').value = data.data.resultCount || 8;
    document.getElementById('cfg-styleTags').value = Array.isArray(data.data.styleTags) ? data.data.styleTags.join(',') : '';
    document.getElementById('cfg-enableAds').checked = data.data.enableAds !== false;
  });
}

document.getElementById('btn-save-config').addEventListener('click', () => {
  const body = {
    adUnitId: document.getElementById('cfg-adUnitId').value.trim(),
    resultCount: parseInt(document.getElementById('cfg-resultCount').value) || 8,
    styleTags: document.getElementById('cfg-styleTags').value.split(',').map(s => s.trim()).filter(Boolean),
    enableAds: document.getElementById('cfg-enableAds').checked
  };

  api('/config', { method: 'PUT', body: JSON.stringify(body) }).then(d => {
    document.getElementById('cfg-msg').textContent = d.message;
    document.getElementById('cfg-msg').style.color = d.code === 0 ? '#27ae60' : '#e74c3c';
  });
});

// ============================================================
// Stats
// ============================================================
function loadStats() {
  api('/stats?days=7').then(data => {
    if (data.code !== 0) return;
    const types = ['page_view', 'form_submit', 'ad_complete', 'result_view'];
    const cards = document.querySelectorAll('.stat-card .stat-num');
    types.forEach((type, i) => {
      if (cards[i]) cards[i].textContent = data.data.stats[type] || 0;
    });
    document.getElementById('stat-total').textContent = data.data.total;
  });
}

document.getElementById('btn-refresh-stats').addEventListener('click', loadStats);

// ============================================================
// Helpers
// ============================================================
function esc(str) {
  if (!str) return '';
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

function genderLabel(g) {
  const map = { boy: '男孩', girl: '女孩' };
  return map[g] || g;
}
