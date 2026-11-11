// Apple HIG System Colors
const APPLE_COLORS = [
  '#007AFF', // Blue
  '#34C759', // Green
  '#FF9500', // Orange
  '#FF3B30', // Red
  '#AF52DE', // Purple
  '#FF2D55', // Pink
  '#00C7BE', // Mint
  '#FFCC00'  // Yellow
];

let selectedTagColor = APPLE_COLORS[0];
let activeTagTypeToCreate = 'general'; // 'general' or 'place'

// Data Models
let tasks = JSON.parse(localStorage.getItem('pwa_tasks') || '[]');
let tags = JSON.parse(localStorage.getItem('pwa_tags') || `[
  {"id":"1","name":"Work","color":"#007AFF","type":"general"},
  {"id":"2","name":"Personal","color":"#34C759","type":"general"},
  {"id":"3","name":"Home","color":"#FF9500","type":"place"},
  {"id":"4","name":"Office","color":"#AF52DE","type":"place"}
]`);

let activeTagFilter = null;
let showCompleted = false;
let editingTaskId = null;
let currentTaskTagIds = [];
let currentTaskPlaceId = null;

function saveState() {
  localStorage.setItem('pwa_tasks', JSON.stringify(tasks));
  localStorage.setItem('pwa_tags', JSON.stringify(tags));
  render();
}

function setTab(completed) {
  showCompleted = completed;
  document.getElementById('tabUpcoming').classList.toggle('active', !completed);
  document.getElementById('tabCompleted').classList.toggle('active', completed);
  render();
}

// Modal Handlers
function openModal(taskId = null) {
  editingTaskId = taskId;
  const modal = document.getElementById('taskModal');

  if (taskId) {
    const task = tasks.find(t => t.id === taskId);
    document.getElementById('modalTitle').innerText = 'Edit Task';
    document.getElementById('taskTitleInput').value = task.title;
    document.getElementById('taskNotesInput').value = task.notes || '';
    document.getElementById('taskDueDateInput').value = task.dueDate;
    currentTaskTagIds = task.tagIds ? [...task.tagIds] : [];
    currentTaskPlaceId = task.placeId || null;
  } else {
    document.getElementById('modalTitle').innerText = 'New Task';
    document.getElementById('taskTitleInput').value = '';
    document.getElementById('taskNotesInput').value = '';
    document.getElementById('taskDueDateInput').value = new Date().toISOString().split('T')[0];
    currentTaskTagIds = [];
    currentTaskPlaceId = null;
  }

  renderTaskTagSelector();
  renderTaskPlaceSelector();
  modal.classList.add('active');
}

function closeModal() { 
  document.getElementById('taskModal').classList.remove('active'); 
}

// Selectors inside Task Modal
function renderTaskTagSelector() {
  const container = document.getElementById('taskTagSelector');
  const generalTags = tags.filter(t => t.type === 'general');
  
  if (generalTags.length === 0) {
    container.innerHTML = '<span style="font-size:0.8rem; color:#94a3b8;">No general tags created yet.</span>';
    return;
  }
  container.innerHTML = generalTags.map(t => {
    const isSelected = currentTaskTagIds.includes(t.id);
    return `<div class="tag-chip ${isSelected ? 'active' : ''}" style="${isSelected ? `background:${t.color}; color:white; border-color:${t.color};` : ''}" onclick="toggleTaskModalTag('${t.id}')">${t.name}</div>`;
  }).join('');
}

function toggleTaskModalTag(id) {
  if (currentTaskTagIds.includes(id)) {
    currentTaskTagIds = currentTaskTagIds.filter(tId => tId !== id);
  } else {
    currentTaskTagIds.push(id);
  }
  renderTaskTagSelector();
}

function renderTaskPlaceSelector() {
  const select = document.getElementById('taskPlaceSelect');
  const placeTags = tags.filter(t => t.type === 'place');
  
  select.innerHTML = '<option value="">No Place Assigned</option>' + 
    placeTags.map(t => `<option value="${t.id}" ${currentTaskPlaceId === t.id ? 'selected' : ''}>📍 ${t.name}</option>`).join('');
}

// Task CRUD
function saveTask() {
  const title = document.getElementById('taskTitleInput').value.trim();
  if (!title) return;
  const notes = document.getElementById('taskNotesInput').value.trim();
  const dueDate = document.getElementById('taskDueDateInput').value;
  const tagIds = [...currentTaskTagIds];
  const placeId = document.getElementById('taskPlaceSelect').value || null;

  if (editingTaskId) {
    tasks = tasks.map(t => t.id === editingTaskId ? { ...t, title, notes, dueDate, tagIds, placeId } : t);
  } else {
    tasks.unshift({ 
      id: Date.now().toString(), 
      title, 
      notes, 
      dueDate, 
      tagIds, 
      placeId, 
      completed: false, 
      createdAt: new Date().toISOString() 
    });
  }
  closeModal();
  saveState();
}

function toggleTask(id) {
  tasks = tasks.map(t => t.id === id ? { ...t, completed: !t.completed } : t);
  saveState();
}

function deleteTask(id) {
  tasks = tasks.filter(t => t.id !== id);
  saveState();
}

// Tag CRUD & Color Swatches
function openTagModal() {
  renderColorSwatches();
  renderTagManager();
  document.getElementById('tagModal').classList.add('active');
}

function closeTagModal() { 
  document.getElementById('tagModal').classList.remove('active'); 
}

function switchTagType(type) {
  activeTagTypeToCreate = type;
}

function renderColorSwatches() {
  const container = document.getElementById('colorPickerSwatches');
  container.innerHTML = APPLE_COLORS.map(color => {
    const isSelected = selectedTagColor === color;
    return `
      <div onclick="selectColor('${color}')" style="
        width: 26px; height: 26px; border-radius: 50%; background: ${color}; 
        cursor: pointer; box-shadow: ${isSelected ? '0 0 0 3px #1e293b' : 'none'};
        transform: ${isSelected ? 'scale(1.1)' : 'scale(1)'}; transition: all 0.15s ease;
      "></div>
    `;
  }).join('') + `
    <input type="color" value="${selectedTagColor}" onchange="selectColor(this.value)" style="width:28px; height:28px; padding:0; border:none; background:none; cursor:pointer;" title="Custom Color">
  `;
}

function selectColor(color) {
  selectedTagColor = color;
  renderColorSwatches();
}

function addTag() {
  const nameInput = document.getElementById('newTagName');
  const name = nameInput.value.trim();
  if (!name) return;

  // Check for duplicate name (case-insensitive) within the same tag type
  const nameLower = name.toLowerCase();
  const exists = tags.some(t => t.type === activeTagTypeToCreate && t.name.toLowerCase() === nameLower);

  if (exists) {
    alert(`A ${activeTagTypeToCreate} tag with the name "${name}" already exists!`);
    return;
  }

  tags.push({ id: Date.now().toString(), name, color: selectedTagColor, type: activeTagTypeToCreate });
  nameInput.value = '';
  renderTagManager();
  saveState();
}

function removeTag(id) {
  const target = tags.find(t => t.id === id);
  tags = tags.filter(t => t.id !== id);
  
  if (target && target.type === 'place') {
    tasks = tasks.map(t => t.placeId === id ? { ...t, placeId: null } : t);
  } else {
    tasks = tasks.map(t => ({ ...t, tagIds: t.tagIds ? t.tagIds.filter(tId => tId !== id) : [] }));
  }
  
  renderTagManager();
  saveState();
}

function renderTagManager() {
  const list = document.getElementById('tagManagerList');
  if (tags.length === 0) {
    list.innerHTML = '<span style="font-size:0.8rem; color:#94a3b8;">No tags found.</span>';
    return;
  }
  list.innerHTML = tags.map(t => `
    <div style="display:flex; justify-content:space-between; align-items:center; background:#f1f5f9; padding:6px 10px; border-radius:6px;">
      <span style="color:${t.color}; font-weight:bold;">${t.type === 'place' ? '📍' : '●'} ${t.name} <small style="color:#64748b; font-weight:normal;">(${t.type})</small></span>
      <button class="btn-danger" style="padding:2px 8px; font-size:0.75rem;" onclick="removeTag('${t.id}')">Delete</button>
    </div>
  `).join('');
}

// Main Render
function render() {
  // Tags Filter Bar
  const tagBar = document.getElementById('tagFilterBar');
  tagBar.innerHTML = `<div class="tag-chip ${!activeTagFilter ? 'active' : ''}" onclick="activeTagFilter=null; render();">All</div>` + 
    tags.map(t => {
      const isSelected = activeTagFilter === t.id;
      const prefix = t.type === 'place' ? '📍 ' : '';
      return `<div class="tag-chip ${isSelected ? 'active' : ''}" style="${isSelected ? `background:${t.color}; color:white; border-color:${t.color};` : ''}" onclick="activeTagFilter='${t.id}'; render();">${prefix}${t.name}</div>`;
    }).join('');

  const searchQuery = document.getElementById('searchInput').value.toLowerCase();
  const sortBy = document.getElementById('sortSelect').value;

  const filtered = tasks
    .filter(t => !!t.completed === showCompleted)
    .filter(t => t.title.toLowerCase().includes(searchQuery) || (t.notes && t.notes.toLowerCase().includes(searchQuery)))
    .filter(t => {
      if (!activeTagFilter) return true;
      const filterTag = tags.find(g => g.id === activeTagFilter);
      if (!filterTag) return true;
      return filterTag.type === 'place' ? t.placeId === activeTagFilter : (t.tagIds && t.tagIds.includes(activeTagFilter));
    })
    .sort((a, b) => {
      if (sortBy === 'dueDate') return a.dueDate.localeCompare(b.dueDate);
      if (sortBy === 'createdAt') return b.createdAt.localeCompare(a.createdAt);
      return a.title.localeCompare(b.title);
    });

  const listContainer = document.getElementById('taskList');
  if (filtered.length === 0) {
    listContainer.innerHTML = '<p style="text-align:center; color:#94a3b8; margin-top:20px;">No tasks found.</p>';
    return;
  }

  listContainer.innerHTML = filtered.map(t => {
    const taskTags = tags.filter(g => t.tagIds && t.tagIds.includes(g.id));
    const placeTag = tags.find(g => g.id === t.placeId);
    
    const badgesHtml = taskTags.map(g => `<span class="badge" style="background:${g.color}">${g.name}</span>`).join(' ');
    const placeBadgeHtml = placeTag 
      ? `<span class="badge" style="background:transparent; border: 1.5px solid ${placeTag.color}; color: ${placeTag.color}; font-weight:bold;">📍 ${placeTag.name}</span>`
      : '';

    const primaryBorderColor = placeTag ? placeTag.color : (taskTags.length > 0 ? taskTags[0].color : '#007AFF');

    return `
      <div class="task-card ${t.completed ? 'completed' : ''}" style="border-left-color: ${primaryBorderColor}">
        <div class="card-header">
          <input type="checkbox" ${t.completed ? 'checked' : ''} onchange="toggleTask('${t.id}')">
          <span class="title">${t.title}</span>
          <div style="display:flex; gap:4px; flex-wrap:wrap; justify-content:flex-end; align-items:center;">
            ${placeBadgeHtml}
            ${badgesHtml}
          </div>
        </div>
        ${t.notes ? `<div class="notes">${t.notes}</div>` : ''}
        <div class="card-footer">
          <span>Due: ${t.dueDate || 'No date'}</span>
          <div>
            <button class="btn-secondary" style="padding:2px 6px; font-size:0.75rem;" onclick="openModal('${t.id}')">Edit</button>
            <button class="btn-danger" style="padding:2px 6px; font-size:0.75rem;" onclick="deleteTask('${t.id}')">Delete</button>
          </div>
        </div>
      </div>
    `;
  }).join('');
}

// Initialize Render
render();