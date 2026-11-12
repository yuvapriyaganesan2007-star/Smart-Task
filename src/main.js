import './style.css'
import { supabase } from './supabase'

const app = document.querySelector('#app')

function escapeHTML(value) {
  return String(value).replace(/[&<>"']/g, char => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  })[char])
}

// DAILY QUOTES

const quotes = [
  'Small steps every day lead to big results.',
  'Focus on progress, not perfection.',
  'Your future is created by what you do today.',
  'Dream big. Start small. Act now.',
  'One task at a time. One day at a time.',
  'Consistency is the key to success.',
  'You are capable of amazing things.',
  'Make today count!',
  "Don't stop until you're proud.",
  'Great things take time. Keep going.'
]

function getDailyQuote() {
  const day = Math.floor(new Date().setHours(0, 0, 0, 0) / 86400000)
  return quotes[day % quotes.length]
}

function getTodayDate() {
  return new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

function localDateString(date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

// AUTHENTICATION

function showAuth() {
  app.innerHTML = `
    <main class="auth-container">
      <section class="auth-card">
        <div class="brand">
          <div class="brand-icon">✓</div>
          <h1>SmartTask</h1>
        </div>

        <p class="subtitle">Make every day productive.</p>

        <div class="auth-tabs">
          <button id="loginTab" class="active">Login</button>
          <button id="signupTab">Sign Up</button>
        </div>

        <form id="authForm">
          <h2 id="formTitle">Welcome back!</h2>
          <p id="formDescription">Log in to continue to your tasks.</p>

          <label>Email address</label>
          <input id="email" type="email"
            placeholder="Enter your email" required />

          <label>Password</label>
          <input id="password" type="password"
            placeholder="Enter your password"
            required minlength="6" />

          <a href="#" id="forgotPassword" class="forgot-link">
            Forgot Password?
          </a>

          <button type="submit" id="submitBtn">Login</button>
          <p id="message" aria-live="polite"></p>
        </form>
      </section>
    </main>
  `

  let mode = 'login'

  const loginTab = document.querySelector('#loginTab')
  const signupTab = document.querySelector('#signupTab')

  function setMode(newMode) {
    mode = newMode

    loginTab.classList.toggle('active', mode === 'login')
    signupTab.classList.toggle('active', mode === 'signup')

    document.querySelector('#formTitle').textContent =
      mode === 'login' ? 'Welcome back!' : 'Create your account'

    document.querySelector('#formDescription').textContent =
      mode === 'login'
        ? 'Log in to continue to your tasks.'
        : 'Sign up and start organizing your day.'

    document.querySelector('#submitBtn').textContent =
      mode === 'login' ? 'Login' : 'Create Account'

    document.querySelector('#forgotPassword').style.display =
      mode === 'login' ? 'block' : 'none'

    document.querySelector('#message').textContent = ''
  }

  loginTab.addEventListener('click', () => setMode('login'))
  signupTab.addEventListener('click', () => setMode('signup'))

  document.querySelector('#authForm').addEventListener('submit', async event => {
    event.preventDefault()

    const email = document.querySelector('#email').value.trim()
    const password = document.querySelector('#password').value
    const message = document.querySelector('#message')
    const button = document.querySelector('#submitBtn')

    button.disabled = true
    message.textContent = 'Please wait...'

    try {
      if (mode === 'signup') {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: window.location.origin
          }
        })

        if (error) throw error

        message.textContent = data.session
          ? 'Account created successfully!'
          : 'Account created! Please check your email to confirm.'
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password
        })

        if (error) throw error
      }
    } catch (error) {
      message.textContent = error.message
    } finally {
      button.disabled = false
    }
  })

  document.querySelector('#forgotPassword').addEventListener('click', async event => {
    event.preventDefault()

    const email = document.querySelector('#email').value.trim()
    const message = document.querySelector('#message')

    if (!email) {
      message.textContent = 'Please enter your registered email first.'
      return
    }

    message.textContent = 'Sending reset link...'

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin
    })

    message.textContent = error
      ? error.message
      : 'Password reset link sent! Check your email.'
  })
}

// RESET PASSWORD

function showResetPassword() {
  app.innerHTML = `
    <main class="auth-container">
      <section class="auth-card">
        <div class="brand">
          <div class="brand-icon">✓</div>
          <h1>SmartTask</h1>
        </div>

        <h2>Reset your password</h2>
        <p class="subtitle">Choose a new secure password.</p>

        <form id="resetForm">
          <label>New Password</label>
          <input id="newPassword" type="password"
            minlength="6" placeholder="Enter new password" required />

          <label>Confirm Password</label>
          <input id="confirmPassword" type="password"
            minlength="6" placeholder="Confirm new password" required />

          <button type="submit" id="resetBtn">Update Password</button>
          <p id="resetMessage" aria-live="polite"></p>
        </form>
      </section>
    </main>
  `

  document.querySelector('#resetForm').addEventListener('submit', async event => {
    event.preventDefault()

    const password = document.querySelector('#newPassword').value
    const confirmPassword = document.querySelector('#confirmPassword').value
    const message = document.querySelector('#resetMessage')
    const button = document.querySelector('#resetBtn')

    if (password !== confirmPassword) {
      message.textContent = 'Passwords do not match.'
      return
    }

    button.disabled = true
    message.textContent = 'Updating password...'

    const { error } = await supabase.auth.updateUser({ password })

    button.disabled = false

    if (error) {
      message.textContent = error.message
    } else {
      message.textContent = 'Password updated! You can now log in.'

      setTimeout(async () => {
        await supabase.auth.signOut()
        showAuth()
      }, 2000)
    }
  })
}

// POMODORO TIMER

let timerInterval = null
let timerSeconds = 25 * 60
let timerMode = 'focus'
let timerRunning = false

function stopTimer() {
  if (timerInterval) {
    clearInterval(timerInterval)
    timerInterval = null
  }

  timerRunning = false
}

function formatTime(seconds) {
  const minutes = Math.floor(seconds / 60)
  const remaining = seconds % 60

  return `${String(minutes).padStart(2, '0')}:${String(remaining).padStart(2, '0')}`
}

function updateTimerDisplay() {
  const display = document.querySelector('#timerDisplay')
  const status = document.querySelector('#timerStatus')
  const startButton = document.querySelector('#timerStart')

  if (!display) return

  display.textContent = formatTime(timerSeconds)

  status.textContent = timerMode === 'focus'
    ? 'Time to focus!'
    : timerMode === 'short'
      ? 'Take a short break!'
      : 'Enjoy your long break!'

  startButton.textContent = timerRunning ? 'Pause' : 'Start'
}

function selectTimerMode(mode) {
  stopTimer()
  timerMode = mode

  timerSeconds = mode === 'focus'
    ? 25 * 60
    : mode === 'short'
      ? 5 * 60
      : 15 * 60

  updateTimerDisplay()
}

function startPauseTimer() {
  if (timerRunning) {
    stopTimer()
    updateTimerDisplay()
    return
  }

  timerRunning = true
  updateTimerDisplay()

  timerInterval = setInterval(() => {
    timerSeconds--

    if (timerSeconds <= 0) {
      stopTimer()
      timerSeconds = 0
      updateTimerDisplay()
      alert('Session complete! Great work!')
      return
    }

    updateTimerDisplay()
  }, 1000)
}

// DASHBOARD

async function showDashboard(user) {
  stopTimer()

  const savedTheme = localStorage.getItem('smarttask-theme') || 'light'
  document.documentElement.dataset.theme = savedTheme

  let calendarDate = new Date()
  let allTasks = []

  app.innerHTML = `
    <main class="dashboard">

      <header class="dashboard-header">
        <div class="brand">
          <div class="brand-icon">✓</div>
          <h1>SmartTask</h1>
        </div>
        <p class="subtitle">Plan smarter. Stay focused. Achieve more 🔥</p>
      </header>

      <div class="dashboard-layout">

        <aside class="sidebar">
          <p class="sidebar-label">MAIN MENU</p>

          <nav class="sidebar-nav">
            <button class="sidebar-link active" data-page="dashboard">
              <span>⌂</span> Dashboard
            </button>

            <button class="sidebar-link" data-page="tasks">
              <span>✓</span> My Tasks
            </button>

            <button class="sidebar-link" data-page="calendar">
              <span>▦</span> Calendar
            </button>

            <button class="sidebar-link" data-page="pomodoro">
              <span>◷</span> Pomodoro
            </button>

            <button class="sidebar-link" data-page="settings">
              <span>⚙</span> Settings
            </button>
          </nav>

          <p class="sidebar-label">ACCOUNT</p>

          <button class="sidebar-link" id="sidebarLogout">
            <span>↪</span> Logout
          </button>
        </aside>

        <div class="dashboard-content">

          <section class="page-section" id="page-dashboard">
            <section class="welcome">
              <p class="subtitle">YOUR PERSONAL PRODUCTIVITY SPACE</p>
              <h2>Welcome back!</h2>
              <p>${escapeHTML(user.email)}</p>
              <h3>${getTodayDate()}</h3>
            </section>

            <section class="quote-card">
              <p class="quote-label">✦ DAILY MOTIVATION</p>
              <h3>"${getDailyQuote()}"</h3>
            </section>

            <section class="stats">
              <div class="stat-card">
                <span>Total Tasks</span>
                <strong id="totalCount">0</strong>
              </div>

              <div class="stat-card">
                <span>Completed</span>
                <strong id="completedCount">0</strong>
              </div>

              <div class="stat-card">
                <span>Pending</span>
                <strong id="pendingCount">0</strong>
              </div>
            </section>
          </section>

          <section class="page-section" id="page-tasks" hidden>
            <section class="task-panel">
              <h2>My Tasks</h2>

              <form id="taskForm" class="task-form">
                <input id="taskTitle" type="text"
                  placeholder="What do you need to do?"
                  maxlength="150" required />

                <select id="taskPriority" aria-label="Task priority">
                  <option value="high">High Priority</option>
                  <option value="medium" selected>Medium Priority</option>
                  <option value="low">Low Priority</option>
                </select>

                <input id="taskDate" type="date" aria-label="Due date" />

                <button type="submit" id="addTaskBtn">+ Add Task</button>
              </form>

              <p id="taskMessage" aria-live="polite"></p>
              <div id="taskList"></div>
            </section>
          </section>

          <section class="page-section" id="page-calendar" hidden>
            <section class="calendar-panel">
              <div class="section-heading">
                <h2>My Calendar</h2>

                <div class="calendar-controls">
                  <button id="prevMonth">←</button>
                  <strong id="monthTitle"></strong>
                  <button id="nextMonth">→</button>
                </div>
              </div>

              <div class="calendar-grid" id="calendarGrid"></div>
            </section>
          </section>

          <section class="page-section" id="page-pomodoro" hidden>
            <section class="pomodoro-panel">
              <h2>Pomodoro Focus Timer</h2>
              <p>Stay focused and take breaks when needed.</p>

              <div class="timer-modes">
                <button data-mode="focus" class="active">Focus 25 min</button>
                <button data-mode="short">Short Break 5 min</button>
                <button data-mode="long">Long Break 15 min</button>
              </div>

              <div class="timer-display" id="timerDisplay">25:00</div>
              <p id="timerStatus">Time to focus!</p>

              <div class="timer-controls">
                <button id="timerStart">Start</button>
                <button id="timerReset">Reset</button>
              </div>
            </section>
          </section>

          <section class="page-section" id="page-settings" hidden>
            <section class="task-panel">
              <h2>Settings</h2>

              <div class="settings-row">
                <div>
                  <strong>Appearance</strong>
                  <p>Switch between light and dark mode.</p>
                </div>
                <button id="themeBtn" class="theme-btn">
                  ${savedTheme === 'dark' ? '☀ Light Mode' : '☾ Dark Mode'}
                </button>
              </div>

              <div class="settings-row">
                <div>
                  <strong>Account</strong>
                  <p>${escapeHTML(user.email)}</p>
                </div>
                <button id="logoutBtn" class="logout-btn">Logout</button>
              </div>
            </section>
          </section>

        </div>
      </div>

    </main>
  `

  const taskList = document.querySelector('#taskList')
  const taskMessage = document.querySelector('#taskMessage')

  // SIDEBAR NAVIGATION

  const navLinks = document.querySelectorAll('.sidebar-link[data-page]')
  const pages = document.querySelectorAll('.page-section')

  function navigateTo(pageName) {
    pages.forEach(page => {
      page.hidden = page.id !== `page-${pageName}`
    })

    navLinks.forEach(link => {
      link.classList.toggle('active', link.dataset.page === pageName)
    })
  }

  navLinks.forEach(link => {
    link.addEventListener('click', () => {
      navigateTo(link.dataset.page)
    })
  })

  // DARK MODE

  function toggleTheme() {
    const current = document.documentElement.dataset.theme
    const next = current === 'dark' ? 'light' : 'dark'

    document.documentElement.dataset.theme = next
    localStorage.setItem('smarttask-theme', next)

    document.querySelector('#themeBtn').textContent =
      next === 'dark' ? '☀ Light Mode' : '☾ Dark Mode'
  }

  document.querySelector('#themeBtn').addEventListener('click', toggleTheme)

  // LOAD TASKS

  async function loadTasks() {
    taskList.innerHTML = '<p>Loading your tasks...</p>'

    const { data: tasks, error } = await supabase
      .from('tasks')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      taskList.textContent = error.message
      return
    }

    allTasks = tasks || []

    const completed = allTasks.filter(task => task.completed).length

    document.querySelector('#totalCount').textContent = allTasks.length
    document.querySelector('#completedCount').textContent = completed
    document.querySelector('#pendingCount').textContent =
      allTasks.length - completed

    if (allTasks.length === 0) {
      taskList.innerHTML =
        '<p class="empty-state">No tasks yet. Add your first task!</p>'
    } else {
      taskList.innerHTML = allTasks.map(task => `
        <article class="task-item ${task.completed ? 'completed' : ''}">
          <label class="task-label">
            <input type="checkbox"
              data-action="toggle"
              data-id="${escapeHTML(task.id)}"
              ${task.completed ? 'checked' : ''}/>
            <span>${escapeHTML(task.title)}</span>
          </label>

          <div class="task-details">
            <span class="priority-badge priority-${escapeHTML(task.priority || 'medium')}">
              ${escapeHTML(task.priority || 'medium')}
            </span>

            <span class="task-due-date">
              ${task.due_date ? 'Due: ' + escapeHTML(task.due_date) : 'No due date'}
            </span>
          </div>

          <div class="task-actions">
            <button data-action="edit"
              data-id="${escapeHTML(task.id)}">Edit</button>

            <button class="delete-btn"
              data-action="delete"
              data-id="${escapeHTML(task.id)}">Delete</button>
          </div>
        </article>
      `).join('')
    }

    renderCalendar()
  }

  // ADD TASK

  document.querySelector('#taskForm').addEventListener('submit', async event => {
    event.preventDefault()

    const titleInput = document.querySelector('#taskTitle')
    const title = titleInput.value.trim()
    const priority = document.querySelector('#taskPriority').value
    const dueDate = document.querySelector('#taskDate').value

    if (!title) return

    const button = document.querySelector('#addTaskBtn')
    button.disabled = true
    taskMessage.textContent = 'Adding task...'

    const { error } = await supabase.from('tasks').insert({
      user_id: user.id,
      title,
      priority,
      due_date: dueDate || null
    })

    button.disabled = false

    if (error) {
      taskMessage.textContent = error.message
      return
    }

    titleInput.value = ''
    document.querySelector('#taskDate').value = ''
    document.querySelector('#taskPriority').value = 'medium'
    taskMessage.textContent = 'Task added successfully!'

    await loadTasks()
  })

  // COMPLETE TASK

  taskList.addEventListener('change', async event => {
    if (event.target.dataset.action !== 'toggle') return

    const id = event.target.dataset.id
    const completed = event.target.checked

    const { error } = await supabase
      .from('tasks')
      .update({ completed })
      .eq('id', id)

    if (error) taskMessage.textContent = error.message

    await loadTasks()
  })

  // EDIT AND DELETE TASKS

  taskList.addEventListener('click', async event => {
    const button = event.target.closest('[data-action]')
    if (!button) return

    const id = button.dataset.id
    const action = button.dataset.action
    const task = allTasks.find(item => item.id === id)

    if (!task) return

    if (action === 'edit') {
      const newTitle = prompt('Edit task title:', task.title)
      if (newTitle === null) return

      const title = newTitle.trim()

      if (!title) {
        taskMessage.textContent = 'Task title cannot be empty.'
        return
      }

      const newPriority = prompt(
        'Enter priority: high, medium, or low',
        task.priority || 'medium'
      )

      if (newPriority === null) return

      const priority = newPriority.trim().toLowerCase()

      if (!['high', 'medium', 'low'].includes(priority)) {
        taskMessage.textContent = 'Please enter high, medium, or low.'
        return
      }

      const { error } = await supabase
        .from('tasks')
        .update({ title, priority })
        .eq('id', id)

      if (error) {
        taskMessage.textContent = error.message
        return
      }

      taskMessage.textContent = 'Task updated!'
      await loadTasks()
    }

    if (action === 'delete') {
      if (!confirm('Are you sure you want to delete this task?')) return

      const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', id)

      if (error) {
        taskMessage.textContent = error.message
        return
      }

      taskMessage.textContent = 'Task deleted.'
      await loadTasks()
    }
  })

  // CALENDAR

  function renderCalendar() {
    const year = calendarDate.getFullYear()
    const month = calendarDate.getMonth()

    document.querySelector('#monthTitle').textContent =
      calendarDate.toLocaleDateString('en-US', {
        month: 'long',
        year: 'numeric'
      })

    const grid = document.querySelector('#calendarGrid')
    const firstDay = new Date(year, month, 1).getDay()
    const daysInMonth = new Date(year, month + 1, 0).getDate()
    const today = localDateString(new Date())

    const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

    let html = weekdays.map(day =>
      `<div class="calendar-weekday">${day}</div>`
    ).join('')

    for (let i = 0; i < firstDay; i++) {
      html += '<div class="calendar-empty"></div>'
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const date = localDateString(new Date(year, month, day))
      const dayTasks = allTasks.filter(task => task.due_date === date)
      const isToday = date === today

      html += `
        <div class="calendar-day ${isToday ? 'today' : ''} ${dayTasks.length ? 'has-tasks' : ''}">
          <span>${day}</span>
          ${dayTasks.length
            ? `<small>${dayTasks.length} task${dayTasks.length > 1 ? 's' : ''}</small>`
            : ''}
        </div>
      `
    }

    grid.innerHTML = html
  }

  document.querySelector('#prevMonth').addEventListener('click', () => {
    calendarDate.setMonth(calendarDate.getMonth() - 1)
    renderCalendar()
  })

  document.querySelector('#nextMonth').addEventListener('click', () => {
    calendarDate.setMonth(calendarDate.getMonth() + 1)
    renderCalendar()
  })

  // POMODORO CONTROLS

  document.querySelectorAll('[data-mode]').forEach(button => {
    button.addEventListener('click', () => {
      document.querySelectorAll('[data-mode]').forEach(item =>
        item.classList.remove('active')
      )

      button.classList.add('active')
      selectTimerMode(button.dataset.mode)
    })
  })

  document.querySelector('#timerStart').addEventListener('click', () => {
    startPauseTimer()
  })

  document.querySelector('#timerReset').addEventListener('click', () => {
    selectTimerMode(timerMode)
  })

  // LOGOUT

  async function logout() {
    stopTimer()
    const { error } = await supabase.auth.signOut()

    if (error) {
      taskMessage.textContent = error.message
    }
  }

  document.querySelector('#logoutBtn').addEventListener('click', logout)
  document.querySelector('#sidebarLogout').addEventListener('click', logout)

  updateTimerDisplay()
  await loadTasks()
}

// AUTH STATE

let currentView = ''

supabase.auth.onAuthStateChange((event, session) => {
  if (event === 'PASSWORD_RECOVERY') {
    currentView = 'reset'
    showResetPassword()
    return
  }

  if (event === 'SIGNED_IN' && session?.user) {
    if (currentView !== 'dashboard') {
      currentView = 'dashboard'
      showDashboard(session.user)
    }
  }

  if (event === 'SIGNED_OUT') {
    currentView = 'auth'
    showAuth()
  }
})

const { data: { session } } = await supabase.auth.getSession()

if (session?.user) {
  currentView = 'dashboard'
  showDashboard(session.user)
} else {
  currentView = 'auth'
  showAuth()
}