// Stato applicazione
let currentDate = new Date();
let selectedDate = null;

// State management (Local Storage)
let taskData = JSON.parse(localStorage.getItem('dailyTasks_v1_data')) || {};
let activeTasks = JSON.parse(localStorage.getItem('dailyTasks_v1_activeList')) || [
    { id: 't_water', name: 'Acqua', icon: '💧' },
    { id: 't_sport', name: 'Sport', icon: '🏃‍♂️' },
    { id: 't_read', name: 'Lettura', icon: '📚' }
];

// Elementi DOM main view
const calendarView = document.getElementById('calendar-view');
const dayView = document.getElementById('day-view');
const calendarGrid = document.getElementById('calendar-grid');
const monthYearDisplay = document.getElementById('month-year-display');
const currentDayDisplay = document.getElementById('current-day-display');
const tasksContainer = document.getElementById('tasks-container');
const emptyTasksState = document.getElementById('empty-tasks-state');

// Sidebar DOM
const sidebar = document.getElementById('sidebar-tasks');
const overlay = document.getElementById('sidebar-overlay');
const activeTasksList = document.getElementById('active-tasks-list');
const newTaskIcon = document.getElementById('new-task-icon');
const newTaskName = document.getElementById('new-task-name');

// Nomi dei mesi in italiano abbreviati
const monthNames = [
    'Gennaio', 'Febbraio', 'Marzo', 'Aprile', 'Maggio', 'Giugno', 
    'Luglio', 'Agosto', 'Settembre', 'Ottobre', 'Novembre', 'Dicembre'
];

function init() {
    renderCalendar();

    // Event listeners navigazione
    document.getElementById('prev-month').addEventListener('click', () => changeMonth(-1));
    document.getElementById('next-month').addEventListener('click', () => changeMonth(1));
    
    document.getElementById('today-btn').addEventListener('click', () => {
        currentDate = new Date();
        renderCalendar();
        setTimeout(() => openDayView(currentDate), 100);
    });

    document.getElementById('back-btn').addEventListener('click', closeDayView);

    // Sidebar Listeners
    document.getElementById('open-sidebar-btn').addEventListener('click', openSidebar);
    document.getElementById('close-sidebar').addEventListener('click', closeSidebar);
    overlay.addEventListener('click', closeSidebar);
    
    document.getElementById('btn-add-task').addEventListener('click', handleAddTask);
}

function renderCalendar() {
    calendarGrid.innerHTML = '';
    
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    
    monthYearDisplay.textContent = `${monthNames[month]} ${year}`;
    
    const firstDay = new Date(year, month, 1).getDay();
    const startOffset = firstDay === 0 ? 6 : firstDay - 1; // Lunedì come primo giorno
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    
    const today = new Date();
    
    const totalCells = Math.ceil((startOffset + daysInMonth) / 7) * 7;
    
    for (let i = 0; i < totalCells; i++) {
        const d = document.createElement('div');
        d.className = 'cal-day';
        
        // Calcola i bordi per l'involucro griglia table-like
        if ((i + 1) % 7 === 0) d.classList.add('no-right-border');
        if (i >= totalCells - 7) d.classList.add('no-bottom-border');

        if (i < startOffset || i >= startOffset + daysInMonth) {
            d.classList.add('empty');
        } else {
            const dayNum = i - startOffset + 1;
            const dateObj = new Date(year, month, dayNum);
            const dateString = formatDate(dateObj);
            
            d.textContent = dayNum;
            
            // Evidenzia oggi
            if (dateObj.getDate() === today.getDate() && 
                dateObj.getMonth() === today.getMonth() && 
                dateObj.getFullYear() === today.getFullYear()) {
                d.classList.add('today');
            }
            
            // Punti indicatori
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
            
            // Click
            d.addEventListener('click', () => {
                selectedDate = dateObj;
                const rect = d.getBoundingClientRect();
                d.style.transform = 'scale(0.85)';
                setTimeout(() => {
                    d.style.transform = '';
                    openDayView(selectedDate);
                }, 100);
            });
        }
        
        calendarGrid.appendChild(d);
    }
}

function changeMonth(dir) {
    const newMonth = currentDate.getMonth() + dir;
    const currentYear = new Date().getFullYear();
    const newYear = currentDate.getFullYear() + Math.floor(newMonth / 12);
    
    // Restringi scorrimento fino a dicembre dell'anno corrente 
    // e non andare troppo indietro (es. min gen anno corrente)
    if (newYear > currentYear && newMonth % 12 > 11) return; // Non oltre Dicembre anno corrente (o limiti custom)
    // Permettiamo navigazione flessibile ma blocca se eccede l'anno in avanti:
    if (currentDate.getFullYear() === currentYear && newMonth > 11 && dir > 0) return;

    currentDate.setMonth(currentDate.getMonth() + dir);
    renderCalendar();
}

// ==== GESTIONE SIDEBAR E TASK INDEX ==== //

function openSidebar() {
    renderActiveTasksList();
    sidebar.classList.add('active');
    overlay.classList.add('active');
}

function closeSidebar() {
    sidebar.classList.remove('active');
    overlay.classList.remove('active');
}

function renderActiveTasksList() {
    activeTasksList.innerHTML = '';
    
    if (activeTasks.length === 0) {
        activeTasksList.innerHTML = '<p style="color:var(--text-muted); font-size:0.9rem;">Nessuna task. Aggiungine una sotto.</p>';
        return;
    }
    
    activeTasks.forEach((task, index) => {
        const item = document.createElement('div');
        item.className = 'sidebar-task-item';
        item.innerHTML = `
            <span>${task.icon} ${task.name}</span>
            <button class="remove-task" data-idx="${index}">×</button>
        `;
        
        item.querySelector('.remove-task').addEventListener('click', () => {
            activeTasks.splice(index, 1);
            saveState();
            renderActiveTasksList();
        });
        
        activeTasksList.appendChild(item);
    });
}

function handleAddTask() {
    const name = newTaskName.value.trim();
    const icon = newTaskIcon.value;
    
    if (!name) return;
    
    const newTask = {
        id: 't_' + Date.now(),
        name: name,
        icon: icon
    };
    
    activeTasks.push(newTask);
    saveState();
    
    newTaskName.value = '';
    renderActiveTasksList();
}

function saveState() {
    localStorage.setItem('dailyTasks_v1_activeList', JSON.stringify(activeTasks));
    localStorage.setItem('dailyTasks_v1_data', JSON.stringify(taskData));
}

// ==== GESTIONE DAY VIEW ==== //

function openDayView(date) {
    const options = { weekday: 'long', day: 'numeric', month: 'long' };
    let text = date.toLocaleDateString('it-IT', options);
    currentDayDisplay.textContent = text.charAt(0).toUpperCase() + text.slice(1);
    
    const dateString = formatDate(date);
    if (!taskData[dateString]) taskData[dateString] = {};
    
    renderTasks(dateString);
    
    calendarView.classList.remove('active');
    calendarView.classList.add('zoomed-out');
    dayView.classList.remove('zoomed-in');
    dayView.classList.add('active');
}

function closeDayView() {
    renderCalendar(); 
    dayView.classList.remove('active');
    dayView.classList.add('zoomed-in');
    calendarView.classList.remove('zoomed-out');
    calendarView.classList.add('active');
}

function renderTasks(dateString) {
    tasksContainer.innerHTML = '';
    
    if (activeTasks.length === 0) {
        emptyTasksState.style.display = 'block';
        return;
    }
    emptyTasksState.style.display = 'none';
    
    activeTasks.forEach((task, index) => {
        const val = taskData[dateString][task.id] || 0;
        
        const card = document.createElement('div');
        // Usiamo il container class task-card pill shaped che abbiamo in CSS
        card.className = 'task-card';
        card.style.opacity = '0';
        card.style.transform = 'translateY(15px)';
        card.style.transitionDelay = `${index * 40}ms`;
        
        card.innerHTML = `
            <div class="task-info">
                <div class="task-icon">${task.icon}</div>
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
        
        requestAnimationFrame(() => {
            card.style.opacity = '1';
            card.style.transform = 'translateY(0)';
            card.style.transitionDelay = '0ms'; 
        });
    });
}

function updateTaskValue(dateString, taskId, change, event) {
    let currentVal = taskData[dateString][taskId] || 0;
    currentVal += change;
    if (currentVal < 0) currentVal = 0;
    
    taskData[dateString][taskId] = currentVal;
    
    const valElement = document.getElementById(`val-${taskId}`);
    valElement.textContent = currentVal;
    
    // Hard Brutalist Animation
    valElement.animate([
        { transform: 'scale(1.4)' },
        { transform: 'scale(1)' }
    ], { duration: 250, easing: 'cubic-bezier(0.34, 1.56, 0.64, 1)' });
    
    saveState();
    
    if (change > 0) throwMoney(event.clientX, event.clientY);
}

function formatDate(date) {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function throwMoney(x, y) {
    const originX = x / window.innerWidth;
    const originY = y / window.innerHeight;
    
    confetti({
        particleCount: 50,
        spread: 80,
        origin: { y: originY, x: originX },
        colors: ['#000000', '#333333', '#ffffff'], // Brutalism colors for confetti
        shapes: ['square'],
        border: true,
        disableForReducedMotion: true
    });
}

document.addEventListener('DOMContentLoaded', init);
