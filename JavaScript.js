// ===== Medical Equipment Maintenance Monitoring Tool =====
// Complete JavaScript with Login functionality

(function() {
  "use strict";

  // ===== LOGIN FUNCTIONALITY =====
  const loginContainer = document.getElementById('loginContainer');
  const dashboardContainer = document.getElementById('dashboardContainer');
  const loginForm = document.getElementById('loginForm');
  const loginMessage = document.getElementById('loginMessage');
  const loggedInUserSpan = document.getElementById('loggedInUser');
  const logoutBtn = document.getElementById('logoutBtn');

  // Mock user database (in real app, this would be server-side)
  const validUsers = [
    { username: 'admin', password: 'admin123', role: 'Administrator' },
    { username: 'technician', password: 'tech123', role: 'Biomed Technician' },
    { username: 'supervisor', password: 'super123', role: 'Clinical Supervisor' }
  ];

  // Check if user is already logged in (session storage)
  function checkLoginStatus() {
    const loggedIn = sessionStorage.getItem('isLoggedIn');
    const username = sessionStorage.getItem('username');
    
    if (loggedIn === 'true' && username) {
      showDashboard(username);
    } else {
      showLogin();
    }
  }

  // Show login page
  function showLogin() {
    loginContainer.style.display = 'block';
    dashboardContainer.style.display = 'none';
  }

  // Show dashboard
  function showDashboard(username) {
    loginContainer.style.display = 'none';
    dashboardContainer.style.display = 'block';
    loggedInUserSpan.textContent = username;
    
    // Initialize dashboard data
    loadFromStorage();
  }

  // Handle login form submission
  loginForm.addEventListener('submit', (e) => {
    e.preventDefault();
    
    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value;
    const rememberMe = document.getElementById('rememberMe').checked;

    // Validate input
    if (!username || !password) {
      showLoginMessage('Please enter both username and password', 'error');
      return;
    }

    // Check credentials
    const user = validUsers.find(u => u.username === username && u.password === password);

    if (user) {
      // Successful login
      showLoginMessage('Login successful! Redirecting...', 'success');
      
      // Store in session storage
      sessionStorage.setItem('isLoggedIn', 'true');
      sessionStorage.setItem('username', username);
      
      // If remember me is checked, store in localStorage as well
      if (rememberMe) {
        localStorage.setItem('rememberedUser', username);
      } else {
        localStorage.removeItem('rememberedUser');
      }
      
      // Redirect to dashboard after short delay
      setTimeout(() => {
        showDashboard(username);
      }, 1000);
    } else {
      // Failed login
      showLoginMessage('Invalid username or password', 'error');
      
      // Shake animation for error feedback
      loginForm.classList.add('shake');
      setTimeout(() => loginForm.classList.remove('shake'), 500);
    }
  });

  // Show login message
  function showLoginMessage(msg, type) {
    loginMessage.textContent = msg;
    loginMessage.style.borderLeftColor = type === 'error' ? 'var(--danger)' : 'var(--success)';
    loginMessage.style.backgroundColor = type === 'error' ? 'rgba(255,99,71,0.1)' : 'rgba(46,204,113,0.1)';
  }

  // Logout functionality
  logoutBtn.addEventListener('click', () => {
    sessionStorage.removeItem('isLoggedIn');
    sessionStorage.removeItem('username');
    showLogin();
    
    // Clear form
    document.getElementById('username').value = '';
    document.getElementById('password').value = '';
  });

  // Check for remembered user
  const rememberedUser = localStorage.getItem('rememberedUser');
  if (rememberedUser) {
    document.getElementById('username').value = rememberedUser;
    document.getElementById('rememberMe').checked = true;
  }

  // Add shake animation dynamically
  const style = document.createElement('style');
  style.textContent = `
    .shake {
      animation: shake 0.5s ease-in-out;
    }
    
    @keyframes shake {
      0%, 100% { transform: translateX(0); }
      10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
      20%, 40%, 60%, 80% { transform: translateX(5px); }
    }
  `;
  document.head.appendChild(style);

  // ===== DASHBOARD FUNCTIONALITY =====
  
  // CSS custom properties theme toggle
  const body = document.body;
  document.getElementById('themeToggle').addEventListener('click', () => {
    body.classList.toggle('dark-theme');
  });

  // Global state
  let equipment = [];
  let editMode = false;

  // DOM elements
  const tbody = document.getElementById('tableBody');
  const form = document.getElementById('equipmentForm');
  const eqName = document.getElementById('eqName');
  const lastDate = document.getElementById('lastDate');
  const nextDate = document.getElementById('nextDate');
  const notes = document.getElementById('notes');
  const editId = document.getElementById('editId');
  const submitBtn = document.getElementById('submitBtn');
  const cancelEditBtn = document.getElementById('cancelEditBtn');
  const liveMsg = document.getElementById('liveMessage');

  // Helper functions
  function setMessage(msg, isError = false) {
    liveMsg.textContent = msg;
    liveMsg.style.borderLeftColor = isError ? 'var(--danger)' : 'var(--accent)';
  }

  // Load from localStorage
  function loadFromStorage() {
    const stored = localStorage.getItem('medicalEquipment');
    if (stored) {
      try {
        equipment = JSON.parse(stored);
      } catch (e) {
        equipment = [];
        setMessage('⚠️ Corrupted storage, reset.', true);
      }
    } else {
      // Default sample data
      equipment = [
        { id: Date.now() - 100000, name: 'MRI 3T', lastMaintenance: '2025-02-01', nextMaintenance: '2025-05-01', notes: 'Siemens' },
        { id: Date.now() - 200000, name: 'Ventilator', lastMaintenance: '2025-03-10', nextMaintenance: '2025-06-10', notes: '' },
        { id: Date.now() - 150000, name: 'Defibrillator', lastMaintenance: '2025-01-15', nextMaintenance: '2025-04-15', notes: 'Battery ok' }
      ];
    }
    renderTable();
  }

  function saveToStorage() {
    localStorage.setItem('medicalEquipment', JSON.stringify(equipment));
  }

  // Compute status based on nextMaintenance vs today
  function getStatus(nextDateStr) {
    const today = new Date();
    today.setHours(0,0,0,0);
    const next = new Date(nextDateStr + 'T00:00:00');
    if (isNaN(next.getTime())) return 'ok';
    const diffDays = Math.ceil((next - today) / (1000*60*60*24));
    if (diffDays < 0) return 'overdue';
    if (diffDays <= 7) return 'due';
    return 'ok';
  }

  // Render table
  function renderTable() {
    if (!tbody) return;
    tbody.innerHTML = equipment.map(item => {
      const status = getStatus(item.nextMaintenance);
      let statusClass = 'status-badge';
      if (status === 'ok') statusClass += ' status-ok';
      else if (status === 'due') statusClass += ' status-due';
      else statusClass += ' status-overdue';

      return `<tr data-id="${item.id}">
        <td>${escapeHtml(item.name)}</td>
        <td>${escapeHtml(item.lastMaintenance)}</td>
        <td>${escapeHtml(item.nextMaintenance)}</td>
        <td><span class="${statusClass}">${status}</span></td>
        <td>
          <div class="action-group">
            <button class="btn-icon edit" data-id="${item.id}" aria-label="edit">✏️ Edit</button>
            <button class="btn-icon delete" data-id="${item.id}" aria-label="delete">🗑️ Del</button>
            <button class="btn-icon done" data-id="${item.id}" aria-label="mark maintenance done">✅ Done</button>
          </div>
        </td>
      </tr>`;
    }).join('');
  }

  // Escape HTML for XSS prevention
  function escapeHtml(unsafe) {
    return unsafe.replace(/[&<>"]/g, function(m) {
      if(m === '&') return '&amp;';
      if(m === '<') return '&lt;';
      if(m === '>') return '&gt;';
      if(m === '"') return '&quot;';
      return m;
    });
  }

  // Table event delegation
  tbody.addEventListener('click', (e) => {
    const target = e.target.closest('button');
    if (!target) return;
    const row = target.closest('tr');
    if (!row) return;
    const id = Number(row.dataset.id);

    if (target.classList.contains('delete')) {
      // Delete equipment
      if (confirm('Are you sure you want to delete this equipment?')) {
        equipment = equipment.filter(eq => eq.id !== id);
        saveToStorage();
        renderTable();
        setMessage('✅ Equipment deleted successfully');
      }
    }
    else if (target.classList.contains('edit')) {
      // Edit equipment
      const eq = equipment.find(e => e.id === id);
      if (eq) {
        eqName.value = eq.name;
        lastDate.value = eq.lastMaintenance;
        nextDate.value = eq.nextMaintenance;
        notes.value = eq.notes || '';
        editId.value = eq.id;
        submitBtn.textContent = '✏️ Update equipment';
        cancelEditBtn.style.display = 'inline-block';
        editMode = true;
        setMessage(`Editing: ${eq.name}`);
      }
    }
    else if (target.classList.contains('done')) {
      // Mark maintenance as done
      const eq = equipment.find(e => e.id === id);
      if (eq) {
        const today = new Date();
        const yyyy = today.getFullYear();
        const mm = String(today.getMonth() + 1).padStart(2,'0');
        const dd = String(today.getDate()).padStart(2,'0');
        const todayStr = `${yyyy}-${mm}-${dd}`;
        eq.lastMaintenance = todayStr;

        // Set next maintenance to 3 months later
        const next = new Date(today);
        next.setMonth(next.getMonth() + 3);
        const nextY = next.getFullYear();
        const nextM = String(next.getMonth()+1).padStart(2,'0');
        const nextD = String(next.getDate()).padStart(2,'0');
        eq.nextMaintenance = `${nextY}-${nextM}-${nextD}`;

        saveToStorage();
        renderTable();
        setMessage(`✅ Maintenance recorded for ${eq.name}`);
        
        // Highlight row
        const rowEl = document.querySelector(`tr[data-id="${id}"]`);
        if (rowEl) rowEl.classList.add('row-highlight');
        setTimeout(() => rowEl?.classList.remove('row-highlight'), 1500);
      }
    }
  });

  // Form submit (add/update)
  form.addEventListener('submit', (e) => {
    e.preventDefault();

    // Validation
    const nameVal = eqName.value.trim();
    const lastVal = lastDate.value;
    const nextVal = nextDate.value;
    
    if (!nameVal || !lastVal || !nextVal) {
      setMessage('❌ Name and both dates are required.', true);
      return;
    }
    
    if (new Date(nextVal) <= new Date(lastVal)) {
      setMessage('⚠️ Next maintenance must be after last maintenance.', true);
      return;
    }

    const idToEdit = editId.value ? Number(editId.value) : null;

    if (idToEdit) {
      // Update existing
      const index = equipment.findIndex(e => e.id === idToEdit);
      if (index !== -1) {
        equipment[index] = {
          id: idToEdit,
          name: nameVal,
          lastMaintenance: lastVal,
          nextMaintenance: nextVal,
          notes: notes.value.trim()
        };
        setMessage(`🔄 Updated: ${nameVal}`);
      }
    } else {
      // Add new
      const newId = Date.now() + Math.floor(Math.random() * 1000);
      equipment.push({
        id: newId,
        name: nameVal,
        lastMaintenance: lastVal,
        nextMaintenance: nextVal,
        notes: notes.value.trim()
      });
      setMessage(`➕ Added: ${nameVal}`);
    }

    saveToStorage();
    renderTable();
    form.reset();
    editId.value = '';
    submitBtn.textContent = '➕ Add equipment';
    cancelEditBtn.style.display = 'none';
    editMode = false;
  });

  // Cancel edit
  cancelEditBtn.addEventListener('click', () => {
    form.reset();
    editId.value = '';
    submitBtn.textContent = '➕ Add equipment';
    cancelEditBtn.style.display = 'none';
    editMode = false;
    setMessage('Edit cancelled');
  });

  // Load sample data (async with Promise)
  document.getElementById('loadSampleBtn').addEventListener('click', async () => {
    try {
      setMessage('⏳ Fetching sample data...');
      
      const samplePromise = new Promise((resolve) => {
        setTimeout(() => {
          resolve([
            { id: Date.now()-5000, name: 'Ultrasound Logiq', lastMaintenance: '2025-04-01', nextMaintenance: '2025-07-01', notes: 'Probe check' },
            { id: Date.now()-4000, name: 'Anesthesia machine', lastMaintenance: '2025-02-20', nextMaintenance: '2025-05-20', notes: '' },
            { id: Date.now()-3000, name: 'Patient monitor', lastMaintenance: '2025-03-25', nextMaintenance: '2025-06-25', notes: 'Firmware updated' }
          ]);
        }, 1200);
      });

      const sampleData = await samplePromise;
      
      if (confirm('Replace current equipment with sample data?')) {
        equipment = sampleData;
        saveToStorage();
        renderTable();
        setMessage('✅ Sample data loaded successfully');
      } else {
        setMessage('Sample load cancelled');
      }
    } catch (err) {
      setMessage(`❌ Error: ${err.message}`, true);
      console.error(err);
    }
  });

  // Clear all
  document.getElementById('clearAllBtn').addEventListener('click', () => {
    if (equipment.length && confirm('Delete ALL equipment?')) {
      equipment = [];
      saveToStorage();
      renderTable();
      setMessage('🧹 All equipment cleared');
      form.reset();
      editId.value = '';
      submitBtn.textContent = '➕ Add equipment';
      cancelEditBtn.style.display = 'none';
    }
  });

  // Check login status on page load
  checkLoginStatus();
})();
