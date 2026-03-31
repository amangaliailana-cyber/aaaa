const API_URL = 'http://localhost:3000/api';
let currentUser = null;

// DOM Elements
const authView = document.getElementById('auth-view');
const dashboardView = document.getElementById('dashboard-view');
const kioskOverlay = document.getElementById('kiosk-mode-overlay');
const loginForm = document.getElementById('login-form');
const logoutBtn = document.getElementById('logout-btn');
const toggleKioskBtn = document.getElementById('toggle-kiosk');
const exitKioskBtn = document.getElementById('exit-kiosk');

// Login Handling
loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('login-email').value;
    const pwd = document.getElementById('login-password').value;
    
    // Quick demo login hack to avoid needing full DB setup just for showing prototypes
    let mockUser = null;
    if (email === 'student@test.com') mockUser = { id: 1, role: 'student', name: 'Алихан П.', email: email, class: '9В' };
    if (email === 'teacher@test.com') mockUser = { id: 2, role: 'teacher', name: 'Анна М.', email: email, subject: 'Математика' };
    if (email === 'parent@test.com') mockUser = { id: 3, role: 'parent', name: 'Мария П.', email: email, childName: 'Алихан П. (9В)' };
    if (email === 'admin@test.com') mockUser = { id: 4, role: 'admin', name: 'Главный Администратор', email: email };

    try {
        const response = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password: pwd })
        });
        if (response.ok) {
            currentUser = await response.json();
            showDashboard();
        } else {
            // Fallback to mock user for easy presentation if backend isn't seeded
            if (mockUser) {
                currentUser = mockUser;
                showDashboard();
            } else {
                alert('Invalid credentials and not a demo account.');
            }
        }
    } catch (e) {
        if (mockUser) {
            currentUser = mockUser;
            showDashboard();
        } else {
            console.error(e);
            alert('Cannot connect to server. Use demo accounts.');
        }
    }
});

function showDashboard() {
    authView.classList.add('hidden');
    dashboardView.classList.remove('hidden');
    
    // Fallback if elements exist
    const userNameEl = document.getElementById('user-name');
    if(userNameEl) userNameEl.textContent = currentUser.name;
    const userRoleEl = document.getElementById('user-role-badge');
    if(userRoleEl) userRoleEl.textContent = currentUser.role.toUpperCase();

    // Render Dynamic Sidebar Profile
    const profileContainer = document.getElementById('sidebar-profile-info');
    if (profileContainer) {
        let profileHTML = `<div style="display:flex; align-items:center; gap:12px; padding-bottom:10px; border-bottom:1px solid rgba(255,255,255,0.1); width:100%;">
            <div style="width:45px; height:45px; border-radius:50%; background:linear-gradient(135deg, var(--accent-purple), var(--accent-blue)); display:flex; align-items:center; justify-content:center; font-weight:bold; font-size:1.4rem; color:white; flex-shrink:0; box-shadow: 0 4px 10px rgba(0,0,0,0.3);">
                ${currentUser.name.charAt(0)}
            </div>
            <div style="display:flex; flex-direction:column; font-size:0.8rem; color:var(--text-muted); line-height:1.3; overflow:hidden;">
                <strong style="color:white; font-size:0.95rem; white-space:nowrap; text-overflow:ellipsis; overflow:hidden;">${currentUser.name}</strong>
        `;

        if (currentUser.role === 'teacher') {
            profileHTML += `<span style="white-space:nowrap; text-overflow:ellipsis; overflow:hidden;">Предмет: ${currentUser.subject}</span><span style="white-space:nowrap; text-overflow:ellipsis; overflow:hidden;">${currentUser.email}</span>`;
        } else if (currentUser.role === 'student') {
            profileHTML += `<span>Ученик ${currentUser.class} класса</span>`;
        } else if (currentUser.role === 'parent') {
            profileHTML += `<span style="white-space:nowrap; text-overflow:ellipsis; overflow:hidden;">Ребенок: ${currentUser.childName}</span><span style="white-space:nowrap; text-overflow:ellipsis; overflow:hidden;">${currentUser.email}</span>`;
        } else if (currentUser.role === 'admin') {
            profileHTML += `<span>Администратор</span><span style="white-space:nowrap; text-overflow:ellipsis; overflow:hidden;">${currentUser.email}</span>`;
        }
        
        profileHTML += `</div></div>`;
        profileContainer.innerHTML = profileHTML;
    }

    // Adjust UI based on Role
    document.querySelectorAll('.student-only').forEach(el => el.classList.toggle('hidden', currentUser.role !== 'student'));
    document.querySelectorAll('.not-student-only').forEach(el => el.classList.toggle('hidden', currentUser.role === 'student'));
    document.querySelectorAll('.admin-only').forEach(el => el.classList.toggle('hidden', currentUser.role !== 'admin'));
    document.querySelectorAll('.teacher-only').forEach(el => el.classList.toggle('hidden', currentUser.role !== 'teacher'));
    
    // Parent logic maps to the non-student overview view as we programmed earlier
    const showParentView = currentUser.role === 'parent' || currentUser.role === 'student';
    document.querySelectorAll('.parent-only').forEach(el => el.classList.toggle('hidden', !showParentView));
    document.querySelectorAll('.default-overview').forEach(el => el.classList.toggle('hidden', showParentView));

    // Reset tabs to default initially
    document.querySelectorAll('.nav-item').forEach(nav => nav.classList.remove('active'));
    if (currentUser.role === 'student') {
        switchTab('student-dashboard');
        document.querySelector('[data-target="student-dashboard"]').classList.add('active');
    } else if (currentUser.role === 'teacher') {
        switchTab('teacher-dashboard');
        document.querySelector('[data-target="teacher-dashboard"]').classList.add('active');
        updateTeacherDashboardStats(); // Hydrate initial stats
    } else {
        switchTab('overview');
        document.querySelector('[data-target="overview"]').classList.add('active');
    }

    loadDashboardData();
}

// Tab Switching Logic
document.querySelectorAll('.nav-item').forEach(item => {
    item.addEventListener('click', (e) => {
        e.preventDefault();
        const target = e.currentTarget.getAttribute('data-target');
        
        // Update active class on nav
        document.querySelectorAll('.nav-item').forEach(nav => nav.classList.remove('active'));
        e.currentTarget.classList.add('active');
        
        switchTab(target);
    });
});

function switchTab(tabId) {
    document.querySelectorAll('.dashboard-view-tab').forEach(tab => tab.classList.add('hidden'));
    
    const selectedTab = document.getElementById(`tab-${tabId}`);
    if(selectedTab) {
        selectedTab.classList.remove('hidden');
    }

    if (tabId === 'overview' && currentUser.role === 'admin') {
        renderHistogram();
    }
    if (tabId === 'self-study' && currentUser.role === 'student') {
        setTimeout(renderSpiderChart, 100); // small delay to ensure display:block applies so canvas has dimensions
    }
}

let classChart = null;

function renderHistogram() {
    const ctx = document.getElementById('ratingChart');
    if (!ctx) return;
    
    // Destroy previous instance to prevent overlapping glitches if redrawn
    if (classChart) classChart.destroy();

    // Mock data from 7A to 11/12 classes
    const classes = ['7А', '7Б', '8А', '8В', '9А', '9Б', '10А', '11А', '12А'];
    const ratings = [75, 82, 88, 95, 60, 70, 89, 92, 85]; // Ex: 8В has 95% which is very high

    classChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: classes,
            datasets: [{
                label: 'Средний рейтинг класса (%)',
                data: ratings,
                backgroundColor: ratings.map(r => r >= 90 ? 'rgba(16, 185, 129, 0.7)' : r >= 75 ? 'rgba(99, 102, 241, 0.7)' : 'rgba(239, 68, 68, 0.7)'),
                borderColor: ratings.map(r => r >= 90 ? 'rgba(16, 185, 129, 1)' : r >= 75 ? 'rgba(99, 102, 241, 1)' : 'rgba(239, 68, 68, 1)'),
                borderWidth: 1,
                borderRadius: 4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    max: 100,
                    ticks: { callback: function(value) { return value + '%'; }, color: '#94a3b8' },
                    grid: { color: 'rgba(255,255,255,0.05)' }
                },
                x: {
                    ticks: { color: '#f8fafc' },
                    grid: { display: false }
                }
            },
            plugins: {
                legend: { labels: { color: '#f8fafc' } }
            }
        }
    });
}

let spiderChartInstance = null;
function renderSpiderChart() {
    const ctx = document.getElementById('spiderChart');
    if (!ctx) return;
    
    if (spiderChartInstance) spiderChartInstance.destroy();
    
    // Derive subjects and scores from teacher-assigned grades
    const gradesDb = JSON.parse(localStorage.getItem('aqbobek_grades') || '[]');
    const myEmail = currentUser?.email || 'student@test.com';
    const myGrades = gradesDb.filter(g => g.studentEmail === myEmail);
    
    let subjectMap = {};
    myGrades.forEach(g => {
        const score = parseFloat(g.score);
        if (!subjectMap[g.subject]) subjectMap[g.subject] = [];
        subjectMap[g.subject].push(score);
    });
    
    let subjects, scores;
    const subjectKeys = Object.keys(subjectMap);
    
    if (subjectKeys.length > 0) {
        subjects = subjectKeys;
        scores = subjects.map(s => {
            const arr = subjectMap[s];
            const avg = arr.reduce((a, b) => a + b, 0) / arr.length;
            // Normalize: if score <= 5, treat as grade (scale to 0-100), else treat as percentage
            return avg <= 5 ? Math.round(avg * 20) : Math.round(avg);
        });
    } else {
        subjects = ['Нет данных'];
        scores = [0];
    }
    
    spiderChartInstance = new Chart(ctx, {
        type: 'radar',
        data: {
            labels: subjects,
            datasets: [{
                label: 'Средний балл (%)',
                data: scores,
                backgroundColor: 'rgba(16, 185, 129, 0.2)',
                borderColor: '#10b981',
                pointBackgroundColor: '#10b981',
                pointBorderColor: '#fff',
                pointHoverBackgroundColor: '#fff',
                pointHoverBorderColor: '#10b981'
            }]
        },
        options: {
            scales: {
                r: {
                    angleLines: { color: 'rgba(255, 255, 255, 0.1)' },
                    grid: { color: 'rgba(255, 255, 255, 0.1)' },
                    pointLabels: { color: '#94a3b8', font: {size: 11} },
                    ticks: { display: false, min: 0, max: 100 }
                }
            },
            plugins: {
                legend: { display: false }
            },
            maintainAspectRatio: false
        }
    });

    updateSelfStudyRisk(subjects, scores);
}

function updateSelfStudyRisk(subjects, scores) {
    const riskTextEl = document.getElementById('self-study-risk-text');
    const riskDetailsEl = document.getElementById('self-study-risk-details');
    if (!riskTextEl || !riskDetailsEl) return;

    // Find the subject with the lowest score
    let minScore = 100;
    let worstSubject = '';
    scores.forEach((s, i) => {
        if (s < minScore) {
            minScore = s;
            worstSubject = subjects[i];
        }
    });

    const riskProbability = Math.round(100 - minScore + (Math.random() * 10)); // Simple mock logic
    riskTextEl.innerHTML = `С вероятностью <strong>${riskProbability}%</strong> тебе нужно уделить внимание предмету <strong>${worstSubject}</strong>.`;
    
    riskDetailsEl.innerHTML = `
        <div style="margin-bottom:10px;"><em>Модель риска: (0.35 * слабость) + (0.30 * СОР) + (0.20 * пропуски)</em></div>
        Твой текущий показатель по предмету <strong>${worstSubject}</strong> составляет <strong>${minScore}%</strong>. <br>
        Рекомендация: Используйте кнопку ниже для создания плана подготовки.
    `;
    
    // Store for the button
    window.currentRiskSubject = worstSubject;
}

// AI Preparation Plan Generation
const btnGenPlan = document.getElementById('btn-generate-prep-plan');
if (btnGenPlan) {
    btnGenPlan.addEventListener('click', () => {
        const subject = window.currentRiskSubject || 'Физика';
        const container = document.getElementById('ai-prep-plan-result');
        const content = document.getElementById('prep-plan-content');
        
        btnGenPlan.textContent = '⏳ Генерируем план...';
        btnGenPlan.disabled = true;

        setTimeout(() => {
            const plan = generatePlanData(subject);
            let html = '';
            plan.forEach(day => {
                html += `
                    <div style="background:rgba(255,255,255,0.05); padding:12px; border-radius:10px; border-left:4px solid var(--accent-green);">
                        <div style="font-weight:bold; color:var(--accent-green); margin-bottom:5px;">${day.title}</div>
                        <div style="font-size:0.9rem; margin-bottom:8px;">${day.focus}</div>
                        <ul style="font-size:0.85rem; color:var(--text-muted); list-style-position:inside;">
                            ${day.tasks.map(t => `<li>${t}</li>`).join('')}
                        </ul>
                    </div>
                `;
            });
            content.innerHTML = html;
            container.classList.remove('hidden');
            btnGenPlan.textContent = 'Построить план обучения ⚡';
            btnGenPlan.disabled = false;
        }, 1200);
    });
}

function generatePlanData(subject) {
    // Mock template-based generation
    return [
        {
            title: 'День 1: Фундаментальные основы',
            focus: `Повторение базовых формул и определений по предмету ${subject}.`,
            tasks: ['Посмотреть видео-лекцию (15 мин)', 'Конспект ключевых формул', 'Тест на знание терминологии']
        },
        {
            title: 'День 2: Практическое применение',
            focus: 'Решение типовых задач среднего уровня сложности.',
            tasks: ['Разбор 5 задач повышенной сложности', 'Интерактивный квиз (модуль 2)', 'Обсуждение ошибок с AI-тьютором']
        },
        {
            title: 'День 3: Интенсивная подготовка',
            focus: 'Симуляция экзамена и работа над скоростью.',
            tasks: ['Пробный СОР за 40 минут', 'Анализ пробелов в сложных темах', 'Финальное закрепление материала']
        }
    ];
}

// Notifications Logic
const notifBadge = document.getElementById('notif-badge');
const notifDropdownPanel = document.getElementById('notif-dropdown-panel');
const notifList = document.getElementById('notif-list');
let unreadCount = 0;

document.getElementById('btn-send-notif').addEventListener('click', () => {
    const target = document.getElementById('notif-target').value;
    const msg = document.getElementById('notif-message').value;
    
    if (target && msg) {
        document.getElementById('notif-target').value = '';
        document.getElementById('notif-message').value = '';
        const successMsg = document.getElementById('notif-success');
        successMsg.style.display = 'block';
        setTimeout(() => successMsg.style.display = 'none', 3000);
        
        // Simulate broadcast (just adding to our own unseen notifications for demo)
        unreadCount++;
        notifBadge.textContent = unreadCount;
        notifBadge.classList.remove('hidden');
        
        // Add to kiosk mode announcements dynamically
        const announcementBoard = document.getElementById('kiosk-announcements');
        const newCard = document.createElement('div');
        newCard.className = 'kiosk-card glass-panel alert';
        newCard.innerHTML = `<h4>📢 Уведомление: ${target}</h4><p>${msg}</p>`;
        announcementBoard.prepend(newCard);
        
        // Add to dropdown list
        if(notifList.textContent.includes('Нет новых')) notifList.innerHTML = '';
        notifList.innerHTML = `<div style="padding: 10px; background: rgba(168, 85, 247, 0.1); border-left: 3px solid #a855f7; border-radius: 6px; margin-bottom: 8px;">
            <strong>Кому: ${target}</strong><br>
            <span style="color: white">${msg}</span>
        </div>` + notifList.innerHTML;
    }
});

document.getElementById('notif-bell').addEventListener('click', (e) => {
    // Only toggle if we didn't click inside the dropdown itself
    if (e.target.closest('#notif-dropdown-panel') && e.target.id !== 'notif-bell') return;
    
    notifDropdownPanel.classList.toggle('hidden');
    if (!notifDropdownPanel.classList.contains('hidden')) {
        unreadCount = 0;
        notifBadge.classList.add('hidden');
    }
});

// Schedule Viewer / Editor Logic
let currentScheduleData = JSON.parse(localStorage.getItem('aqbobek_schedule')) || [];

function generateAISchedule() {
    const days = ['Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница'];
    const times = ['1 (08:00)', '2 (08:50)', '3 (09:40)', '4 (10:40)', '5 (11:30)', '6 (12:20)'];
    const subjects = ['Математика', 'Физика', 'Биология', 'История', 'Информатика', 'Литература', 'Химия', 'География', 'Казахский язык', 'Английский язык'];
    const classes = ['7А', '7Б', '8А', '8Б', '9А', '9Б', '9В', '10А', '10Б', '11А'];
    
    const teacherNames = ['Иванов И.И.', 'Азиза К.', 'Сергей В.', 'Анна М.', 'Смирнова А.', 'Петров П.', 'Ахметов А.', 'Сидорова С.', 'Нурлан Н.', 'Дильназ Р.'];
    let numTeachers = Math.floor(Math.random() * 5) + 5;
    const activeTeachers = teacherNames.slice(0, numTeachers);

    const rooms = Array.from({length: 500}, (_, i) => `${i + 1}`); 

    let newSchedule = [];
    
    days.forEach(day => {
        times.forEach(time => {
            let availableTeachers = [...activeTeachers];
            let availableRooms = [...rooms];
            let availableClasses = [...classes];
            
            // Generate lessons for multiple classes per time slot
            const numLessons = Math.min(availableClasses.length, Math.floor(Math.random() * 3) + 3);
            
            for(let i = 0; i < numLessons; i++) {
                if(availableTeachers.length === 0 || availableClasses.length === 0) break;

                const tIndex = Math.floor(Math.random() * availableTeachers.length);
                const rIndex = Math.floor(Math.random() * availableRooms.length);
                const sIndex = Math.floor(Math.random() * subjects.length);
                const cIndex = Math.floor(Math.random() * availableClasses.length);
                
                newSchedule.push({
                    day: day,
                    time: time,
                    subject: subjects[sIndex],
                    teacher: availableTeachers[tIndex],
                    room: availableRooms[rIndex],
                    className: availableClasses[cIndex],
                    isEditing: false
                });
                
                availableTeachers.splice(tIndex, 1);
                availableRooms.splice(rIndex, 1);
                availableClasses.splice(cIndex, 1);
            }
        });
    });
    return newSchedule;
}

function renderScheduleTable(filterQuery = '') {
    renderScheduleCards();
}

// Subject to color mapping for lesson cards
const subjectColors = {
    'Математика': '#6366f1',
    'Физика': '#ef4444',
    'Биология': '#10b981',
    'История': '#f59e0b',
    'Информатика': '#3b82f6',
    'Литература': '#a855f7',
    'Химия': '#ec4899',
    'География': '#14b8a6',
    'Казахский язык': '#f97316',
    'Английский язык': '#06b6d4'
};

let activeScheduleDay = 'Понедельник';
let activeScheduleClass = 'all';

function renderScheduleCards() {
    const container = document.getElementById('schedule-lessons-container');
    if (!container) return;

    if (currentScheduleData.length === 0) {
        container.innerHTML = '<p style="color:var(--text-muted); text-align:center; padding:40px 0;">Расписание пока не создано. Администратор может сгенерировать его через AI.</p>';
        return;
    }

    let data = currentScheduleData;

    // Filter for teacher's personal schedule
    if (currentUser && currentUser.role === 'teacher') {
        const tName = currentUser.name || 'Анна М.';
        data = data.filter(r => r.teacher === tName);
        if (data.length === 0) {
            container.innerHTML = '<p style="color:var(--text-muted); text-align:center; padding:40px 0;">Нет уроков для вас. Попробуйте сгенерировать расписание от имени Админа.</p>';
            return;
        }
    }

    // Filter by active day
    let filtered = data.filter(r => r.day === activeScheduleDay);

    // Filter by class
    if (activeScheduleClass !== 'all') {
        filtered = filtered.filter(r => r.className === activeScheduleClass);
    }

    if (filtered.length === 0) {
        const classLabel = activeScheduleClass === 'all' ? '' : ` для класса ${activeScheduleClass}`;
        container.innerHTML = `<p style="color:var(--text-muted); text-align:center; padding:40px 0;">Нет уроков на ${activeScheduleDay}${classLabel}.</p>`;
        return;
    }

    // Sort by time
    filtered.sort((a, b) => {
        const numA = parseInt(a.time.split(' ')[0]);
        const numB = parseInt(b.time.split(' ')[0]);
        return numA - numB;
    });

    let html = '';
    let lastTime = null;

    filtered.forEach((row, i) => {
        const lessonNum = row.time.split(' ')[0];
        const timeSlot = row.time.split(' ')[1] ? row.time.split(' ')[1].replace(/[()]/g, '') : '';
        const color = subjectColors[row.subject] || '#6366f1';

        // Insert lunch break before lesson 4
        if (lessonNum === '4' && lastTime && lastTime.startsWith('3')) {
            html += `
                <div style="display:flex; align-items:center; gap:12px; padding:10px 0;">
                    <div style="flex:1; height:1px; background:linear-gradient(to right, transparent, var(--accent-gold), transparent);"></div>
                    <span style="color:var(--accent-gold); font-weight:600; font-size:0.9rem; white-space:nowrap;">🍽️ Обед (10:20 — 10:40)</span>
                    <div style="flex:1; height:1px; background:linear-gradient(to right, var(--accent-gold), transparent);"></div>
                </div>
            `;
        }
        lastTime = row.time;

        // Show class badge + teacher info
        const classBadge = row.className ? `<span style="background:rgba(99,102,241,0.2); color:#818cf8; padding:2px 8px; border-radius:6px; font-size:0.8rem; font-weight:600;">${row.className}</span>` : '';
        const teacherInfo = currentUser?.role === 'teacher' 
            ? `Класс: <strong>${row.className || ''}</strong>` 
            : `👤 ${row.teacher}`;

        html += `
            <div class="lesson-card">
                <div class="lesson-time-col">
                    <span class="lesson-num">${lessonNum}</span>
                    <span class="lesson-time-text">${timeSlot}</span>
                </div>
                <div class="lesson-color-bar" style="background:${color};"></div>
                <div class="lesson-body">
                    <div style="display:flex; align-items:center; gap:8px;">
                        <span class="lesson-subject">${row.subject}</span>
                        ${classBadge}
                    </div>
                    <span class="lesson-meta">${teacherInfo}</span>
                </div>
                <div class="lesson-room-badge">
                    <span>каб. ${row.room}</span>
                </div>
            </div>
        `;
    });

    container.innerHTML = html;
}

// Day Tab Click Handlers
document.querySelectorAll('.schedule-day-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.schedule-day-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        activeScheduleDay = btn.getAttribute('data-day');
        renderScheduleCards();
    });
});

// Class Filter Handler
const classFilterEl = document.getElementById('schedule-class-filter');
if (classFilterEl) {
    classFilterEl.addEventListener('change', () => {
        activeScheduleClass = classFilterEl.value;
        renderScheduleCards();
    });
}

function renderTeacherCustomSchedule() {
    renderScheduleCards();
}

window.editScheduleRow = function(index) {
    currentScheduleData[index].isEditing = true;
    renderScheduleTable();
};

window.saveScheduleRow = function(index) {
    currentScheduleData[index].day = document.getElementById(`edit-day-${index}`).value;
    currentScheduleData[index].time = document.getElementById(`edit-time-${index}`).value;
    currentScheduleData[index].subject = document.getElementById(`edit-subject-${index}`).value;
    currentScheduleData[index].teacher = document.getElementById(`edit-teacher-${index}`).value;
    currentScheduleData[index].room = document.getElementById(`edit-room-${index}`).value;
    currentScheduleData[index].isEditing = false;
    
    // Persist changes
    localStorage.setItem('aqbobek_schedule', JSON.stringify(currentScheduleData));
    
    renderScheduleTable();
    
    // Send background notification for demo purposes
    unreadCount++;
    notifBadge.textContent = unreadCount;
    notifBadge.classList.remove('hidden');
    
    const announcementBoard = document.getElementById('kiosk-announcements');
    const newCard = document.createElement('div');
    newCard.className = 'kiosk-card glass-panel alert';
    newCard.innerHTML = `<h4>⚠️ Изменение в расписании</h4><p>${currentScheduleData[index].subject} (${currentScheduleData[index].day} - ${currentScheduleData[index].time}) у ${currentScheduleData[index].teacher} перенесено в каб. ${currentScheduleData[index].room}</p>`;
    // Optional: add to dropdown directly too
    if(notifList && notifList.textContent.includes('Нет новых')) notifList.innerHTML = '';
    notifList.innerHTML = `<div style="padding: 10px; background: rgba(168, 85, 247, 0.1); border-left: 3px solid #a855f7; border-radius: 6px; margin-bottom: 8px;">
        <strong>Система</strong><br>
        <span style="color: white">${currentScheduleData[index].subject} перенесено в каб. ${currentScheduleData[index].room}</span>
    </div>` + notifList.innerHTML;
};

document.getElementById('btn-search-schedule').addEventListener('click', () => {
    // Hide empty state text if present
    const containerText = document.querySelector('#schedule-grid-container p');
    if (containerText) containerText.style.display = 'none';

    const query = document.getElementById('schedule-search').value;
    renderScheduleTable(query);
});

document.getElementById('btn-auto-schedule').addEventListener('click', () => {
    const btn = document.getElementById('btn-auto-schedule');
    btn.textContent = '⏳ Генерируем с помощью AI... (Обработка 500 кабинетов)';
    btn.disabled = true;
    
    // Hide empty state text
    const containerText = document.querySelector('#schedule-grid-container p');
    if (containerText) containerText.style.display = 'none';
    
    setTimeout(() => {
        currentScheduleData = generateAISchedule();
        localStorage.setItem('aqbobek_schedule', JSON.stringify(currentScheduleData));
        renderScheduleTable();
        
        btn.textContent = '🪄 Расписание создано (0 конфликтов)!';
        btn.classList.add('btn-secondary');
        setTimeout(() => {
            btn.textContent = '🪄 Сгенерировать заново (AI)';
            btn.disabled = false;
        }, 3000);
    }, 1500);
});

// Teacher Dashboard Logic
window.updateTeacherDashboardStats = function() {
    const classSelect = document.getElementById('teacher-class-select');
    if (!classSelect || currentUser?.role !== 'teacher') return;
    
    const selectedClass = classSelect.value;
    document.getElementById('teacher-stat-class-name').textContent = selectedClass;
    
    // Logic: calculate Avg Grade from mock data
    // "Средняя Оценка: сумма баллов всех учеников одного класса за прошлую четверть"
    // Mock math based on selection:
    let avg = 4.0;
    let riskCount = 0;
    let attendance = 100;
    
    if (selectedClass === '9В') {
        avg = ((3 + 5 + 4) / 3).toFixed(1); // 4.0
        riskCount = 1; // e.g. 1 student < 65%
        attendance = 92; // e.g. (12-1)/12 * 100 
    } else if (selectedClass === '10А') {
        avg = ((4 + 5 + 5 + 4) / 4).toFixed(1); // 4.5
        riskCount = 0; 
        attendance = 100; 
    } else {
        avg = 3.8;
        riskCount = 3;
        attendance = 85;
    }
    
    document.getElementById('teacher-stat-avg').textContent = avg;
    document.getElementById('teacher-stat-risk').textContent = riskCount;
    document.getElementById('teacher-stat-attendance').textContent = attendance + '%';
};

// EWS Search Logic
const ewsSearch = document.getElementById('ews-search');
if (ewsSearch) {
    ewsSearch.addEventListener('input', (e) => {
        const q = e.target.value.toLowerCase();
        const rows = document.querySelectorAll('#ews-tbody tr');
        rows.forEach(row => {
            const name = row.children[0].textContent.toLowerCase();
            row.style.display = name.includes(q) ? '' : 'none';
        });
    });
}

// Dynamic Grade Rendering for Student
function renderStudentGradesFromDB(myGrades) {
    // === 1. Dashboard Table (tab-student-dashboard) ===
    const dashTbody = document.getElementById('student-dashboard-grades-tbody');
    const gpaLine = document.getElementById('student-gpa-line');
    
    if (dashTbody) {
        if (myGrades.length === 0) {
            dashTbody.innerHTML = '<tr><td colspan="4" style="text-align:center; color:var(--text-muted);">Оценок пока нет. Учитель ещё не выставил оценки.</td></tr>';
            if (gpaLine) gpaLine.textContent = '';
        } else {
            let html = '';
            let totalScore = 0;
            myGrades.slice().reverse().forEach(g => {
                const score = parseFloat(g.score);
                totalScore += score;
                const color = score >= 4 || score >= 80 ? 'var(--accent-green)' : score >= 3 || score >= 65 ? 'var(--accent-gold)' : 'var(--accent-red)';
                html += `<tr><td>${g.subject}</td><td>${g.topic}</td><td><span style="color:${color}; font-weight:bold;">${g.score}</span></td><td>${g.date || '-'}</td></tr>`;
            });
            dashTbody.innerHTML = html;
            const avgScore = (totalScore / myGrades.length).toFixed(1);
            if (gpaLine) gpaLine.textContent = `Средний балл: ${avgScore}`;
        }
    }

    // === 2. Grades Journal Table (tab-grades) ===
    const journalTbody = document.getElementById('grades-journal-tbody');
    if (journalTbody) {
        if (myGrades.length === 0) {
            journalTbody.innerHTML = '<tr><td colspan="4" style="text-align:center; color:var(--text-muted);">Оценок пока нет. Учитель ещё не выставил оценки.</td></tr>';
        } else {
            let html = '';
            myGrades.slice().reverse().forEach(g => {
                const score = parseFloat(g.score);
                const color = score >= 4 || score >= 80 ? 'var(--accent-green)' : score >= 3 || score >= 65 ? 'var(--accent-gold)' : 'var(--accent-red)';
                html += `<tr><td>${g.subject}</td><td>${g.topic}</td><td><span style="color:${color}; font-weight:bold;">${g.score}</span></td><td>${g.date || '-'}</td></tr>`;
            });
            journalTbody.innerHTML = html;
        }
    }

    // === 3. Analysis Panel (tab-grades sidebar) ===
    const analysisContent = document.getElementById('grades-analysis-content');
    if (analysisContent) {
        if (myGrades.length === 0) {
            analysisContent.innerHTML = '<p style="color:var(--text-muted);">Данные для анализа появятся после выставления оценок учителем.</p>';
        } else {
            // Group by subject, compute average
            let subjectMap = {};
            myGrades.forEach(g => {
                if (!subjectMap[g.subject]) subjectMap[g.subject] = [];
                subjectMap[g.subject].push(parseFloat(g.score));
            });
            
            let analysisHtml = '';
            Object.keys(subjectMap).forEach(subj => {
                const arr = subjectMap[subj];
                const avg = arr.reduce((a, b) => a + b, 0) / arr.length;
                const normalized = avg <= 5 ? Math.round(avg * 20) : Math.round(avg);
                const color = normalized >= 75 ? 'var(--accent-green)' : normalized >= 50 ? 'var(--accent-gold)' : 'var(--accent-red)';
                analysisHtml += `
                    <div style="display:flex; justify-content:space-between; align-items:center; padding:8px 0; border-bottom:1px solid rgba(255,255,255,0.05);">
                        <span>${subj}</span>
                        <div style="display:flex; align-items:center; gap:10px;">
                            <div style="width:80px; height:6px; background:rgba(255,255,255,0.1); border-radius:3px; overflow:hidden;">
                                <div style="width:${normalized}%; height:100%; background:${color}; border-radius:3px;"></div>
                            </div>
                            <span style="color:${color}; font-weight:bold; min-width:35px; text-align:right;">${normalized}%</span>
                        </div>
                    </div>
                `;
            });
            analysisContent.innerHTML = analysisHtml;
        }
    }

    // === 4. Risk Warnings (tab-grades bottom) ===
    const risksText = document.getElementById('grades-risks-text');
    if (risksText) {
        if (myGrades.length === 0) {
            risksText.innerHTML = '<span style="color:var(--text-muted);">Анализ рисков появится после выставления оценок.</span>';
        } else {
            let subjectMap = {};
            myGrades.forEach(g => {
                if (!subjectMap[g.subject]) subjectMap[g.subject] = [];
                subjectMap[g.subject].push(parseFloat(g.score));
            });
            
            let riskySubjects = [];
            Object.keys(subjectMap).forEach(subj => {
                const arr = subjectMap[subj];
                const avg = arr.reduce((a, b) => a + b, 0) / arr.length;
                const normalized = avg <= 5 ? Math.round(avg * 20) : Math.round(avg);
                if (normalized < 65) riskySubjects.push({ name: subj, score: normalized });
            });
            
            if (riskySubjects.length > 0) {
                risksText.innerHTML = 'Внимание: ' + riskySubjects.map(r => 
                    `По предмету <strong>${r.name}</strong> средний балл составляет <strong>${r.score}%</strong> (ниже порога 65%).`
                ).join(' ') + ' Рекомендуется уделить время самоподготовке.';
                risksText.style.color = '';
            } else {
                risksText.innerHTML = '✅ Все предметы в норме! Продолжай в том же духе.';
                risksText.style.color = 'var(--accent-green)';
            }
        }
    }
}

async function loadDashboardData() {
    document.getElementById('ai-insights-content').innerHTML = '<div class="loader">Analyzing data via Mock AI...</div>';
    
    // Simulate AI thinking time
    setTimeout(async () => {
        try {
            if (currentUser.role === 'student' || currentUser.role === 'parent') {
                const res = await fetch(`${API_URL}/grades/${currentUser.id}/ai-tutor`);
                if (res.ok) {
                    const data = await res.json();
                    renderInsights(data.recommendations);
                } else throw new Error();
            } else if (currentUser.role === 'teacher') {
                renderInsights([
                    "⚠️ Early Warning: Alikhan P. has a dropping average in Physics (Last 3: 4, 3, 2).",
                    "📊 Class 10A report generated successfully."
                ]);
            } else if (currentUser.role === 'admin') {
                 renderInsights([
                    "✅ Smart Schedule generated: No conflicts detected.",
                    "📈 School average score this week: 4.2 / 5.0."
                ]);
            }
        } catch (e) {
            // Fallback mock data
            if (currentUser.role === 'student') {
                renderInsights(["С вероятностью 80% ты завалишь следующий СОЧ по Физике из-за пробелов в теме 'Кинематика'. Посмотри это видео."]);
            } else if (currentUser.role === 'parent') {
                 renderInsights(["Ваш ребенок молодец в алгебре, но пропустил 2 урока истории. Рекомендация: обсудить тайм-менеджмент."]);
            } else {
                 renderInsights(["System running optimally"]);
            }
        }
    }, 1500);

    // Render Grades Activity (Dynamic from DB)
    const gradesDb = JSON.parse(localStorage.getItem('aqbobek_grades') || '[]');
    let listHTML = '';
    
    if (currentUser.role === 'student') {
        const myGrades = gradesDb.filter(g => g.studentEmail === currentUser.email);
        
        // === Render Student Dashboard Grades Table ===
        renderStudentGradesFromDB(myGrades);
        
        if (myGrades.length > 0) {
            myGrades.slice().reverse().forEach(g => {
                const isLow = parseInt(g.score) <= 3 || (parseInt(g.score) > 10 && parseInt(g.score) < 65);
                listHTML += `<li class="grade-item"><span>${g.subject} (${g.topic})</span> <span class="grade-score ${isLow ? 'low' : ''}">${g.score}</span></li>`;
            });
        } else {
            listHTML = `<li class="grade-item"><span>Оценок пока нет.</span></li>`;
        }
        const gradesListObj = document.querySelector('.grades-list');
        if (gradesListObj) gradesListObj.innerHTML = listHTML;
        
        // Render Portfolio data (Student)
        const pData = JSON.parse(localStorage.getItem(`aqbobek_portfolio_${currentUser.email}`) || '{}');
        const socInp = document.getElementById('portfolio-social');
        if (socInp) {
            socInp.value = pData.social || '';
            document.getElementById('portfolio-moral').value = pData.moral || '';
            document.getElementById('portfolio-physical').value = pData.physical || '';
            document.getElementById('portfolio-intellect').value = pData.intellect || '';
            
            // New sections
            if (document.getElementById('portfolio-creative')) {
                document.getElementById('portfolio-creative').value = pData.creative || '';
                document.getElementById('portfolio-digital').value = pData.digital || '';
                document.getElementById('portfolio-goals').value = pData.goals || '';
                document.getElementById('portfolio-gallery').value = pData.gallery || '';
            }
        }

        // Render Achievements data (Student)
        const allAch = JSON.parse(localStorage.getItem('aqbobek_achievements') || '[]');
        const myAch = allAch.filter(a => a.studentEmail === currentUser.email);
        const achList = document.getElementById('dynamic-achievements-list');
        let totalPts = 0;
        
        if (achList) {
            if (myAch.length > 0) {
                let achHtml = '';
                myAch.forEach(a => {
                    totalPts += (parseInt(a.points) || 0);
                    achHtml += `
                        <div style="background:rgba(255,255,255,0.05); padding:15px; border-radius:10px; display:flex; justify-content:space-between; align-items:center;">
                            <div style="display:flex; flex-direction:column; gap:5px;">
                                <span>${a.title}</span><span style="font-size:0.8rem; color:var(--text-muted)">(${a.date})</span>
                                <a href="${a.fileData}" download="certificate.jpg" style="color:var(--accent-blue); font-size:0.85rem; text-decoration:none;">📥 Скачать сертификат</a>
                            </div>
                            <strong style="color:var(--accent-green)">+${a.points} баллов</strong>
                        </div>
                    `;
                });
                achList.innerHTML = achHtml;
            } else {
                achList.innerHTML = `<p style="color:var(--text-muted);">Достижений пока нет.</p>`;
            }
            
            // Calc level
            let level = 1;
            if (totalPts >= 26) level = 2;
            if (totalPts >= 51) level = 3;
            document.getElementById('achievement-level-text').innerHTML = `⭐ УРОВЕНЬ ${level} ⭐`;
            
            let maxPts = 25;
            if(level === 2) maxPts = 50;
            if(level >= 3) maxPts = 100;
            
            document.getElementById('achievement-points-text').innerHTML = `${totalPts} / ${maxPts} баллов`;
            const pct = Math.min(100, Math.round((totalPts / maxPts) * 100));
            document.getElementById('achievement-progress-bar').style.width = pct + '%';
        }

    } else if (currentUser.role === 'parent') {
        // Parent Grades logic
        const childEmail = 'student@test.com'; // Hardcoded connection
        const childGrades = gradesDb.filter(g => g.studentEmail === childEmail);
        if (childGrades.length > 0) {
            childGrades.reverse().forEach(g => {
                const isLow = parseInt(g.score) <= 3 || (parseInt(g.score) > 10 && parseInt(g.score) < 65);
                listHTML += `<li class="grade-item"><span>${g.subject} (${g.topic})</span> <span class="grade-score ${isLow ? 'low' : ''}">${g.score}</span></li>`;
            });
        } else {
            listHTML = `<li><span style="color:var(--text-muted)">Нет оценок.</span></li>`;
        }
        const pGrades = document.getElementById('parent-grades-list');
        if (pGrades) pGrades.innerHTML = listHTML;
    } else if (currentUser.role === 'admin') {
         listHTML = `
            <li class="grade-item"><span>Global Schedule Sync</span> <span class="grade-score">Success</span></li>
            <li class="grade-item"><span>Kiosk Mode Content Updated</span> <span class="grade-score">Just Now</span></li>
        `;
        const gradesListObj = document.querySelector('.grades-list');
        if (gradesListObj) gradesListObj.innerHTML = listHTML;
    }
    
    renderChat();
}

function renderInsights(recommendations) {
    const html = recommendations.map(r => `<div class="ai-recommendation">${r}</div>`).join('');
    document.getElementById('ai-insights-content').innerHTML = html;
}

// Interactivity
logoutBtn.addEventListener('click', () => {
    currentUser = null;
    dashboardView.classList.add('hidden');
    authView.classList.remove('hidden');
    document.getElementById('login-form').reset();
});

// Kiosk Mode
toggleKioskBtn.addEventListener('click', () => {
    kioskOverlay.classList.remove('hidden');
});
exitKioskBtn.addEventListener('click', () => {
    kioskOverlay.classList.add('hidden');
});

// Keyboard Pause for Kiosk Mode
window.addEventListener('keydown', (e) => {
    if ((e.code === 'Space' || e.key === ' ') && !kioskOverlay.classList.contains('hidden')) {
        e.preventDefault();
        const marquees = document.querySelectorAll('.marquee-content');
        marquees.forEach(m => m.classList.toggle('paused'));
    }
});

// Live Clock
setInterval(() => {
    const now = new Date();
    const timeString = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    document.getElementById('live-clock').textContent = timeString;
    document.getElementById('kiosk-clock').textContent = timeString;
}, 1000);

// Teacher Assign Grade Logic
const gradeForm = document.getElementById('form-assign-grade');
if (gradeForm) {
    gradeForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const sEmail = document.getElementById('grade-student-email').value;
        const subj = document.getElementById('grade-subject').value;
        const topic = document.getElementById('grade-topic').value;
        const score = document.getElementById('grade-score').value;

        const newGrade = { 
            studentEmail: sEmail, 
            subject: subj, 
            topic, 
            score,
            date: new Date().toLocaleDateString()
        };

        const grades = JSON.parse(localStorage.getItem('aqbobek_grades') || '[]');
        grades.push(newGrade);
        localStorage.setItem('aqbobek_grades', JSON.stringify(grades));

        gradeForm.reset();
        const successEl = document.getElementById('grade-success');
        successEl.style.display = 'inline';
        setTimeout(() => successEl.style.display = 'none', 3000);
    });
}

// Student Portfolio Saving Logic
const btnSavePortfolio = document.getElementById('btn-save-portfolio');
if (btnSavePortfolio) {
    btnSavePortfolio.addEventListener('click', () => {
        const pData = {
            social: document.getElementById('portfolio-social').value,
            moral: document.getElementById('portfolio-moral').value,
            physical: document.getElementById('portfolio-physical').value,
            intellect: document.getElementById('portfolio-intellect').value,
            creative: document.getElementById('portfolio-creative').value,
            digital: document.getElementById('portfolio-digital').value,
            goals: document.getElementById('portfolio-goals').value,
            gallery: document.getElementById('portfolio-gallery').value
        };
        const emailKey = currentUser?.email || 'student@test.com';
        localStorage.setItem(`aqbobek_portfolio_${emailKey}`, JSON.stringify(pData));
        
        const okText = document.getElementById('portfolio-save-success');
        if (okText) {
            okText.style.display = 'block';
            setTimeout(() => okText.style.display = 'none', 3000);
        }
    });
}

// Teacher Assign Achievement Logic
const achForm = document.getElementById('form-assign-achievement');
if (achForm) {
    achForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const email = document.getElementById('ach-student-email').value;
        const title = document.getElementById('ach-title').value;
        const pts = parseInt(document.getElementById('ach-points').value) || 0;
        const fileInput = document.getElementById('ach-file');
        
        if (fileInput.files.length > 0) {
            const file = fileInput.files[0];
            const reader = new FileReader();
            reader.onload = function(evt) {
                const base64Data = evt.target.result;
                const newAch = { studentEmail: email, title, points: pts, fileData: base64Data, date: new Date().toLocaleDateString() };
                const achievements = JSON.parse(localStorage.getItem('aqbobek_achievements') || '[]');
                achievements.push(newAch);
                localStorage.setItem('aqbobek_achievements', JSON.stringify(achievements));
                
                achForm.reset();
                document.getElementById('ach-success').style.display = 'inline';
                setTimeout(() => document.getElementById('ach-success').style.display = 'none', 3000);
            };
            reader.readAsDataURL(file);
        }
    });
}

// Parent Chat Logic
const chatInput = document.getElementById('chat-input');
const btnSendChat = document.getElementById('btn-send-chat');
const chatMessages = document.getElementById('chat-messages');

function renderChat() {
    if (!chatMessages) return;
    const history = JSON.parse(localStorage.getItem('aqbobek_chat') || '[]');
    if (history.length > 0) {
        let html = '';
        history.forEach(m => {
            html += `<div class="chat-bubble ${m.sender === 'parent' ? 'sent' : 'received'}">
                        <strong>${m.name}:</strong> ${m.text}
                     </div>`;
        });
        chatMessages.innerHTML = html;
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }
}

if (btnSendChat && chatInput) {
    btnSendChat.addEventListener('click', () => {
        const text = chatInput.value.trim();
        if (!text) return;
        
        const history = JSON.parse(localStorage.getItem('aqbobek_chat') || '[]');
        history.push({
            sender: 'parent',
            name: 'Вы',
            text: text,
            time: new Date().toISOString()
        });
        localStorage.setItem('aqbobek_chat', JSON.stringify(history));
        
        chatInput.value = '';
        renderChat();
        
        // Auto-reply mock
        setTimeout(() => {
            const h = JSON.parse(localStorage.getItem('aqbobek_chat') || '[]');
            h.push({
                sender: 'teacher',
                name: 'Анна М. (Математика)',
                text: 'Спасибо за ваше сообщение. Передала учителям.',
                time: new Date().toISOString()
            });
            localStorage.setItem('aqbobek_chat', JSON.stringify(h));
            renderChat();
        }, 1500);
    });
}

// ==========================================
// Full Stack Task / Homework Feature (MockDB)
// ==========================================
const TASKS_DB_KEY = 'aqbobek_tasks_db';

class TaskManager {
    static getTasks() {
        return JSON.parse(localStorage.getItem(TASKS_DB_KEY) || '[]');
    }
    static saveTasks(tasks) {
        localStorage.setItem(TASKS_DB_KEY, JSON.stringify(tasks));
    }
    
    // File reader to Base64
    static readFileAsDataURL(file) {
        return new Promise((resolve, reject) => {
            if (!file) { resolve(null); return; }
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = error => reject(error);
            reader.readAsDataURL(file);
        });
    }

    // Triggered when Teacher submits the new task form
    static async handleTeacherAssign(e) {
        e.preventDefault();
        const studentEmail = document.getElementById('task-student-email').value;
        const title = document.getElementById('task-title').value;
        const desc = document.getElementById('task-desc').value;
        const fileInput = document.getElementById('task-attachment');
        
        let attachedFileName = null;
        let attachedFileData = null;

        if (fileInput.files.length > 0) {
            const file = fileInput.files[0];
            attachedFileName = file.name;
            attachedFileData = await this.readFileAsDataURL(file);
        }

        const newTask = {
            id: Date.now().toString(),
            teacherEmail: currentUser.email || 'teacher@test.com',
            teacherName: currentUser.name,
            studentEmail: studentEmail,
            title,
            description: desc,
            attachedFileName,
            attachedFileData,
            status: 'pending', // pending, submitted, graded
            submittedFileName: null,
            submittedFileData: null,
            createdAt: new Date().toISOString()
        };

        const tasks = this.getTasks();
        tasks.push(newTask);
        this.saveTasks(tasks);

        document.getElementById('form-assign-task').reset();
        const successEl = document.getElementById('task-assign-success');
        successEl.style.display = 'block';
        setTimeout(() => successEl.style.display = 'none', 3000);

        this.renderTeacherTasks();
    }

    // Triggered when Student submits their solution file
    static async handleStudentSubmit(taskId) {
        const fileInput = document.getElementById(`student-upload-${taskId}`);
        if (!fileInput || fileInput.files.length === 0) {
            alert('Пожалуйста, прикрепите файл с решением!');
            return;
        }

        const file = fileInput.files[0];
        const submittedFileName = file.name;
        const submittedFileData = await this.readFileAsDataURL(file);

        let tasks = this.getTasks();
        const tIndex = tasks.findIndex(t => t.id === taskId);
        if (tIndex > -1) {
            tasks[tIndex].status = 'submitted';
            tasks[tIndex].submittedFileName = submittedFileName;
            tasks[tIndex].submittedFileData = submittedFileData;
            tasks[tIndex].submittedAt = new Date().toISOString();
            this.saveTasks(tasks);
            alert('Задание успешно отправлено на проверку!');
            this.renderStudentTasks(); // Refresh
        }
    }

    // Render for Student View (in Задания Tab)
    static renderStudentTasks() {
        const container = document.getElementById('dynamic-tasks-list');
        if (!container) return;
        
        const tasks = this.getTasks();
        // Since demo accounts log in via email check, email could be tricky if not set.
        // Assuming we mock it here or student sets it to 'student@test.com'
        const myEmail = document.getElementById('login-email') ? document.getElementById('login-email').value : 'student@test.com';
        
        const myTasks = tasks.filter(t => t.studentEmail === myEmail);

        if (myTasks.length === 0) {
            container.innerHTML = '<p style="color:var(--text-muted); padding:10px;">Отличная работа! Новых заданий от учителей пока нет.</p>';
            return;
        }

        let html = '';
        myTasks.forEach(t => {
            const isSubmitted = t.status !== 'pending';
            const borderColor = isSubmitted ? 'var(--accent-green)' : 'var(--accent-gold)';
            const submitBtnStr = isSubmitted 
                ? `<button class="btn-secondary" disabled>Сдано ✔️</button>`
                : `<div style="display:flex; flex-direction:column; gap:5px; margin-top:10px;">
                     <input type="file" id="student-upload-${t.id}" style="color:var(--text-main); font-size:0.8rem;">
                     <button class="btn-primary" onclick="TaskManager.handleStudentSubmit('${t.id}')">Отправить решение</button>
                   </div>`;
                   
            const attachmentLink = t.attachedFileData 
                ? `<a href="${t.attachedFileData}" download="${t.attachedFileName}" style="color:var(--accent-gold); text-decoration:underline; font-size:0.9rem;">📥 Скачать материал: ${t.attachedFileName}</a>`
                : '';

            html += `
            <div class="task-card" style="padding:15px; background:rgba(255,255,255,0.05); border-radius:12px; border-left:4px solid ${borderColor};">
                <div style="display:flex; justify-content:space-between; align-items:flex-start;">
                    <div>
                        <h5 style="font-size:1.1rem; margin-bottom:5px;">${t.title}</h5>
                        <p style="color:var(--text-muted); font-size:0.9rem; margin-bottom:10px;">${t.description}</p>
                        ${attachmentLink}
                        <div style="color:var(--text-muted); font-size:0.85rem; margin-top:5px;">От: ${t.teacherName}</div>
                    </div>
                </div>
                ${submitBtnStr}
            </div>
            `;
        });
        container.innerHTML = html;
    }

    // Render for Teacher View
    static renderTeacherTasks() {
        const container = document.getElementById('teacher-tasks-list');
        if (!container) return;
        
        const tasks = this.getTasks();
        const myEmail = document.getElementById('login-email') ? document.getElementById('login-email').value : 'teacher@test.com';
        const myTasks = tasks.filter(t => t.teacherEmail === myEmail);
        
        if (myTasks.length === 0) {
            container.innerHTML = '<p style="color:var(--text-muted);">Вы еще не выдали ни одного задания.</p>';
            return;
        }

        let html = '';
        myTasks.reverse().forEach(t => {
            let statusTag = '';
            let actionBlock = '';
            
            if (t.status === 'pending') {
                statusTag = `<span style="color:var(--accent-gold); font-size:0.85rem;">Ожидает сдачи ⏳</span>`;
            } else if (t.status === 'submitted') {
                statusTag = `<span style="color:var(--accent-green); font-size:0.85rem;">Решение получено ✔️</span>`;
                actionBlock = `<a href="${t.submittedFileData}" download="${t.submittedFileName}" class="btn-primary" style="text-decoration:none; padding:6px 12px; display:inline-block; font-size:0.85rem;">📥 Скачать ответ: ${t.submittedFileName}</a>`;
            }

            html += `
            <div style="padding:15px; background:rgba(255,255,255,0.05); border-radius:12px; display:flex; justify-content:space-between; align-items:center;">
                <div>
                    <h5 style="font-size:1rem; margin-bottom:5px;">${t.title} (для: ${t.studentEmail})</h5>
                    ${statusTag}
                </div>
                <div>${actionBlock}</div>
            </div>
            `;
        });
        container.innerHTML = html;
    }
}

// Bind the form
const assignForm = document.getElementById('form-assign-task');
if (assignForm) {
    assignForm.addEventListener('submit', (e) => TaskManager.handleTeacherAssign(e));
}

// Ensure local rendering updates whenever loadDashboardData happens
const originalLoadDashboardData = loadDashboardData;
window.loadDashboardData = async function() {
    originalLoadDashboardData();
    if (currentUser && currentUser.role === 'student') {
        TaskManager.renderStudentTasks();
    }
    if (currentUser && currentUser.role === 'teacher') {
        TaskManager.renderTeacherTasks();
    }
};
