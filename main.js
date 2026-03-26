// Stato
let currentDate = new Date();
let selectedDate = null;
let currentView = 'landing'; // landing, calendar, day, trends, projects
let isHomeMenuOpen = false;

// Dati persistenti
let taskData = JSON.parse(localStorage.getItem('dailyTasks_v3_data')) || {};
let activeTasks = JSON.parse(localStorage.getItem('dailyTasks_v3_list')) || [];
let projectsData = JSON.parse(localStorage.getItem('dailyTasks_v3_projects')) || [];

// Audio 
const trilloAudio = new Audio('trillo.mp3');
trilloAudio.volume = 0.5;

function playSound() {
    // Reset time to allow rapid clicks
    trilloAudio.currentTime = 0;
    trilloAudio.play().catch(e => console.log('Audio autoplay prevented by browser until user interaction.'));
}

// Colori pastello 
const PASTEL_COLORS = [
    '#ffffcc', '#ffcc99', '#ffcccc', '#ff99cc', '#ffccff', '#cc99ff', 
    '#ccccff', '#99ccff', '#ccffff', '#99ffcc', '#ccffcc', '#ccff99'
];

const monthNames = [
    'Gennaio', 'Febbraio', 'Marzo', 'Aprile', 'Maggio', 'Giugno', 
    'Luglio', 'Agosto', 'Settembre', 'Ottobre', 'Novembre', 'Dicembre'
];

const views = {
    landing: document.getElementById('landing-view'),
    calendar: document.getElementById('calendar-view'),
    day: document.getElementById('day-view'),
    trends: document.getElementById('trend-view'),
    projects: document.getElementById('projects-view')
};

const calendarGrid = document.getElementById('calendar-grid');
const monthYearDisplay = document.getElementById('month-year-display');
const currentDayDisplay = document.getElementById('current-day-display');
const tasksContainer = document.getElementById('tasks-container');

const sidebarTasks = document.getElementById('sidebar-tasks');
const modalProject = document.getElementById('modal-project');
const overlay = document.getElementById('sidebar-overlay');

function init() {
    if (activeTasks.length === 0) {
        activeTasks = [
            { id: 't_allenamento', name: 'Allenamento', iconClass: 'icon-allenamento', color: PASTEL_COLORS[7] },
            { id: 't_lettura', name: 'Lettura', iconClass: 'icon-lettura', color: PASTEL_COLORS[1] },
            { id: 't_video', name: 'Video', iconClass: 'icon-video', color: PASTEL_COLORS[10] }
        ];
        saveState();
    }

    renderCalendar();

    // ==== LANDING INTERACTIONS ====
    document.getElementById('btn-home-house').addEventListener('click', () => {
        playSound();
        const subBtns = document.getElementById('landing-sub-btns');
        const welcomeTxt = document.getElementById('landing-welcome');
        const houseBtn = document.getElementById('btn-home-house');
        if (!isHomeMenuOpen) {
            subBtns.classList.add('show');
            welcomeTxt.classList.add('show');
            houseBtn.classList.add('shrunk');
            isHomeMenuOpen = true;
        } else {
            switchView('calendar');
        }
    });

    document.getElementById('btn-home-wrench').addEventListener('click', () => {
        playSound();
        switchView('projects');
    });

    document.getElementById('btn-home-graph').addEventListener('click', () => {
        playSound();
        switchView('trends');
    });

    // ==== BACK BUTTONS ====
    document.querySelectorAll('.back-to-home-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            playSound();
            switchView('landing');
        });
    });
    
    // ==== OTHER LISTENERS ====
    document.getElementById('btn-open-sidebar').addEventListener('click', () => {
        renderActiveTasksList();
        openSidebar(sidebarTasks);
    });

    document.getElementById('new-project-btn').addEventListener('click', () => openSidebar(modalProject));
    
    document.getElementById('prev-month').addEventListener('click', () => changeMonth(-1));
    document.getElementById('next-month').addEventListener('click', () => changeMonth(1));
    document.getElementById('today-btn').addEventListener('click', () => {
        currentDate = new Date();
        renderCalendar();
    });
    
    document.getElementById('back-to-cal-btn').addEventListener('click', () => switchView('calendar'));

    document.getElementById('close-sidebar').addEventListener('click', () => closeSidebar(sidebarTasks));
    document.getElementById('close-project-modal').addEventListener('click', () => closeSidebar(modalProject));
    overlay.addEventListener('click', () => {
        closeSidebar(sidebarTasks);
        closeSidebar(modalProject);
    });

    document.getElementById('btn-add-task').addEventListener('click', handleAddTask);
    document.getElementById('btn-add-proj').addEventListener('click', handleAddProject);
}

// ==== NAVIGATION LOGIC ==== //
function switchView(target) {
    currentView = target;
    Object.values(views).forEach(v => v.classList.remove('active'));
    views[target].classList.add('active');

    if (target === 'trends') renderTrends();
    if (target === 'projects') renderProjects();
    if (target === 'calendar') renderCalendar();
}

function openSidebar(el) {
    el.classList.add('active');
    overlay.classList.add('active');
}
function closeSidebar(el) {
    el.classList.remove('active');
    overlay.classList.remove('active');
}

// ==== CALENDAR LOGIC ==== //
function renderCalendar() {
    calendarGrid.innerHTML = '';
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    
    monthYearDisplay.textContent = `${monthNames[month]} ${year}`;
    
    const firstDay = new Date(year, month, 1).getDay();
    const startOffset = firstDay === 0 ? 6 : firstDay - 1; 
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const today = new Date();
    const totalCells = Math.ceil((startOffset + daysInMonth) / 7) * 7;
    
    for (let i = 0; i < totalCells; i++) {
        const d = document.createElement('div');
        d.className = 'cal-day';
        if ((i + 1) % 7 === 0) d.classList.add('no-right-border');
        if (i >= totalCells - 7) d.classList.add('no-bottom-border');

        if (i < startOffset || i >= startOffset + daysInMonth) {
            d.classList.add('empty');
        } else {
            const dayNum = i - startOffset + 1;
            const dateObj = new Date(year, month, dayNum);
            const dateString = formatDate(dateObj);
            
            d.textContent = dayNum;
            if (dateString === formatDate(today)) d.classList.add('today');
            
            const dayTasks = taskData[dateString] || {};
            const dotsContainer = document.createElement('div');
            dotsContainer.className = 'task-dots';
            
            let completedCount = 0;
            activeTasks.forEach(t => {
                if (dayTasks[t.id] > 0 && completedCount < 3) {
                    const dot = document.createElement('div');
                    dot.className = 'dot';
                    dotsContainer.appendChild(dot);
                    completedCount++;
                }
            });
            d.appendChild(dotsContainer);
            
            d.addEventListener('click', () => {
                selectedDate = dateObj;
                openDayView(selectedDate);
            });
        }
        calendarGrid.appendChild(d);
    }
}

function changeMonth(dir) {
    const newMonth = currentDate.getMonth() + dir;
    const currentYear = new Date().getFullYear();
    const newYear = currentDate.getFullYear() + Math.floor(newMonth / 12);
    
    if (newYear > currentYear && newMonth % 12 > 11) return;
    if (currentDate.getFullYear() === currentYear && newMonth > 11 && dir > 0) return;

    currentDate.setMonth(currentDate.getMonth() + dir);
    renderCalendar();
}

// ==== DAY VIEW LOGIC ==== //
function openDayView(date) {
    const options = { weekday: 'long', day: 'numeric', month: 'long' };
    const text = date.toLocaleDateString('it-IT', options);
    currentDayDisplay.textContent = text.charAt(0).toUpperCase() + text.slice(1);
    
    const dateString = formatDate(date);
    if (!taskData[dateString]) taskData[dateString] = {};
    
    renderTasks(dateString);
    switchView('day');
}

function renderTasks(dateString) {
    tasksContainer.innerHTML = '';
    const emptyState = document.getElementById('empty-tasks-state');
    
    if (activeTasks.length === 0) {
        emptyState.style.display = 'block';
        return;
    }
    emptyState.style.display = 'none';
    
    activeTasks.forEach((task) => {
        const val = taskData[dateString][task.id] || 0;
        const card = document.createElement('div');
        card.className = 'task-card';
        card.style.backgroundColor = task.color;
        
        card.innerHTML = `
            <div class="task-info">
                <div class="sprite-icon ${task.iconClass}"></div>
                <div class="task-name">${task.name}</div>
            </div>
            <div class="task-controls">
                <button class="action-btn minus-btn" data-id="${task.id}">-</button>
                <div class="task-value" id="val-${task.id}">${val}</div>
                <button class="action-btn plus-btn" data-id="${task.id}">+</button>
            </div>
        `;
        
        card.querySelector('.minus-btn').addEventListener('click', (e) => updateTaskValue(dateString, task.id, -1, e));
        card.querySelector('.plus-btn').addEventListener('click', (e) => updateTaskValue(dateString, task.id, 1, e));
        
        tasksContainer.appendChild(card);
    });
}

function updateTaskValue(dateString, taskId, change, event) {
    let currentVal = taskData[dateString][taskId] || 0;
    currentVal += change;
    if (currentVal < 0) currentVal = 0;
    
    taskData[dateString][taskId] = currentVal;
    
    const valElement = document.getElementById(`val-${taskId}`);
    valElement.textContent = currentVal;
    
    saveState();
    
    if (change > 0) throwConfetti(event.clientX, event.clientY);
}

// ==== SIDEBAR TASKS LOGIC ==== //
function renderActiveTasksList() {
    const list = document.getElementById('active-tasks-list');
    list.innerHTML = '';
    
    if (activeTasks.length === 0) {
        list.innerHTML = '<p class="empty-state">Nessuna task.</p>';
        return;
    }
    
    activeTasks.forEach((task, index) => {
        const item = document.createElement('div');
        item.className = 'sidebar-task-item';
        item.style.borderLeft = `4px solid ${task.color}`;
        item.innerHTML = `
            <div style="display:flex; align-items:center; gap:8px;">
                <div class="sprite-icon ${task.iconClass}" style="transform: scale(0.8)"></div> 
                <span>${task.name}</span>
            </div>
            <button class="remove-task" data-idx="${index}">×</button>
        `;
        item.querySelector('.remove-task').addEventListener('click', () => {
            activeTasks.splice(index, 1);
            saveState();
            renderActiveTasksList();
        });
        list.appendChild(item);
    });
}

function handleAddTask() {
    const nameInput = document.getElementById('new-task-name');
    const name = nameInput.value.trim();
    const iconClass = document.getElementById('new-task-icon').value;
    
    if (!name) return;
    
    const colorIndex = activeTasks.length % PASTEL_COLORS.length;
    
    activeTasks.push({
        id: 't_' + Date.now(),
        name: name,
        iconClass: iconClass,
        color: PASTEL_COLORS[colorIndex]
    });
    
    saveState();
    nameInput.value = '';
    renderActiveTasksList();
}

// ==== TRENDS LOGIC ==== //
let chartInstances = {};

function renderTrends() {
    const container = document.getElementById('charts-container');
    container.innerHTML = '';
    
    if (activeTasks.length === 0) {
        container.innerHTML = '<p class="empty-state">Nessuna task attiva per mostrare l\'andamento.</p>';
        return;
    }

    const labels = [];
    const dates = [];
    const today = new Date();
    for (let i = 6; i >= 0; i--) {
        const d = new Date(today);
        d.setDate(today.getDate() - i);
        labels.push(`${d.getDate()}/${d.getMonth()+1}`);
        dates.push(formatDate(d));
    }

    activeTasks.forEach((task) => {
        const box = document.createElement('div');
        box.className = 'chart-box';
        // Imposta colore pastello dei bordi
        box.style.borderColor = task.color;
        
        const headerDiv = document.createElement('div');
        headerDiv.style.display = 'flex';
        headerDiv.style.alignItems = 'center';
        headerDiv.style.gap = '8px';
        headerDiv.style.marginBottom = '12px';
        headerDiv.innerHTML = `<div class="sprite-icon ${task.iconClass}" style="transform: scale(0.8)"></div> <strong>${task.name}</strong>`;
        box.appendChild(headerDiv);

        const canvasWrapper = document.createElement('div');
        canvasWrapper.style.position = 'relative';
        canvasWrapper.style.height = '180px';
        canvasWrapper.style.width = '100%';

        const canvas = document.createElement('canvas');
        canvas.id = `chart-${task.id}`;
        canvasWrapper.appendChild(canvas);
        box.appendChild(canvasWrapper);

        container.appendChild(box);
        
        const data = dates.map(dStr => {
            return (taskData[dStr] && taskData[dStr][task.id]) ? taskData[dStr][task.id] : 0;
        });
        
        if(chartInstances[task.id]) chartInstances[task.id].destroy();

        const ctx = canvas.getContext('2d');
        chartInstances[task.id] = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: `Completamenti`,
                    data: data,
                    borderColor: task.color,
                    backgroundColor: task.color + '4D', // 30% alpha
                    tension: 0.3,
                    fill: true,
                    borderWidth: 3,
                    pointBackgroundColor: '#ffffff',
                    pointBorderColor: task.color,
                    pointBorderWidth: 2,
                    pointRadius: 4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false }
                },
                scales: {
                    y: { beginAtZero: true, ticks: { stepSize: 1 } }
                }
            }
        });
    });
}

// ==== PROJECTS LOGIC ==== //
function handleAddProject() {
    const nameInput = document.getElementById('new-proj-name');
    const iconClass = document.getElementById('new-proj-icon').value;
    const name = nameInput.value.trim();
    if(!name) return;
    
    projectsData.push({
        id: 'p_' + Date.now(),
        name,
        iconClass,
        parts: []
    });
    
    saveState();
    nameInput.value = '';
    closeSidebar(modalProject);
    renderProjects();
}

function renderProjects() {
    const container = document.getElementById('projects-list-container');
    container.innerHTML = '';
    
    if (projectsData.length === 0) {
        container.innerHTML = '<p class="empty-state">Nessun progetto creato.</p>';
        return;
    }
    
    projectsData.forEach(proj => {
        const completed = proj.parts.filter(p => p.checked).length;
        const total = proj.parts.length;
        
        const card = document.createElement('div');
        card.className = 'project-card';
        card.innerHTML = `
            <div class="proj-header" id="ph-${proj.id}">
                <div class="proj-title">
                    <div class="sprite-icon ${proj.iconClass}" style="transform: scale(0.8)"></div> ${proj.name}
                </div>
                <div class="proj-progress">${completed}/${total} ▼</div>
            </div>
            <div class="proj-body" id="pb-${proj.id}">
                <div class="parts-list" id="pl-${proj.id}" style="display:flex; flex-direction:column; gap:16px;"></div>
                <div class="add-part-form">
                    <input type="text" id="pi-${proj.id}" class="flat-input" style="padding: 6px 10px; font-size:0.9rem;" placeholder="Nuova parte...">
                    <button id="pbtn-${proj.id}" class="flat-btn small primary">+</button>
                </div>
                <button id="pdel-${proj.id}" class="flat-btn small" style="color:#ef4444; border-color:#ef4444; margin-top:10px;">Elimina Progetto</button>
            </div>
        `;
        
        container.appendChild(card);
        
        const partsList = document.getElementById(`pl-${proj.id}`);
        proj.parts.forEach(part => {
            const partEl = document.createElement('div');
            partEl.className = 'part-item';
            partEl.innerHTML = `
                <input type="checkbox" class="part-checkbox" ${part.checked ? 'checked' : ''}>
                <span class="part-text ${part.checked ? 'checked' : ''}">${part.name}</span>
            `;
            partEl.querySelector('.part-checkbox').addEventListener('change', (e) => {
                part.checked = e.target.checked;
                saveState();
                renderProjects(); 
            });
            partsList.appendChild(partEl);
        });
        
        document.getElementById(`ph-${proj.id}`).addEventListener('click', () => {
            document.getElementById(`pb-${proj.id}`).classList.toggle('expanded');
        });
        
        document.getElementById(`pbtn-${proj.id}`).addEventListener('click', () => {
            const input = document.getElementById(`pi-${proj.id}`);
            if(input.value.trim()) {
                proj.parts.push({ id: 'part_'+Date.now(), name: input.value.trim(), checked: false });
                saveState();
                renderProjects();
                document.getElementById(`pb-${proj.id}`).classList.add('expanded');
            }
        });
        
        document.getElementById(`pdel-${proj.id}`).addEventListener('click', () => {
            projectsData = projectsData.filter(p => p.id !== proj.id);
            saveState();
            renderProjects();
        });
    });
}

// ==== UTILS ==== //
function saveState() {
    localStorage.setItem('dailyTasks_v3_list', JSON.stringify(activeTasks));
    localStorage.setItem('dailyTasks_v3_data', JSON.stringify(taskData));
    localStorage.setItem('dailyTasks_v3_projects', JSON.stringify(projectsData));
}

function formatDate(date) {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function throwConfetti(x, y) {
    const originX = x / window.innerWidth;
    const originY = y / window.innerHeight;
    confetti({
        particleCount: 50, spread: 70, origin: { x: originX, y: originY },
        colors: PASTEL_COLORS, shapes: ['circle', 'square'], disableForReducedMotion: true
    });
}

document.addEventListener('DOMContentLoaded', init);
