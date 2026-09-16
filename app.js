// Data Storage
let currentUser = null;
let users = JSON.parse(localStorage.getItem('users')) || [
    { id: 1, username: 'admin', password: '123456', name: 'Administrator', role: 'admin' },
    { id: 2, username: 'karyawan1', password: '123456', name: 'Budi Santoso', role: 'user' },
    { id: 3, username: 'karyawan2', password: '123456', name: 'Siti Nurhaliza', role: 'user' }
];

let attendances = JSON.parse(localStorage.getItem('attendances')) || [];

// Initialize
document.addEventListener('DOMContentLoaded', function() {
    const currentTime = document.getElementById('currentTime');
    const reportMonth = document.getElementById('reportMonth');
    
    // Set default report month to current month
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    reportMonth.value = `${year}-${month}`;
    
    // Update clock
    updateClock();
    setInterval(updateClock, 1000);
    
    // Check if user is logged in
    checkLogin();
});

function updateClock() {
    const now = new Date();
    const options = {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
    };
    const timeString = now.toLocaleDateString('id-ID', options);
    const currentTime = document.getElementById('currentTime');
    if (currentTime) {
        currentTime.textContent = timeString;
    }
}

function checkLogin() {
    const savedUser = localStorage.getItem('currentUser');
    if (savedUser) {
        currentUser = JSON.parse(savedUser);
        showDashboard();
    } else {
        goToPage('loginPage');
    }
}

function goToPage(pageId) {
    const pages = document.querySelectorAll('.page');
    pages.forEach(page => page.classList.remove('active'));
    document.getElementById(pageId).classList.add('active');
    
    if (pageId === 'dashboardPage') {
        loadDashboard();
    } else if (pageId === 'historyPage') {
        loadHistory();
    } else if (pageId === 'adminPage') {
        loadAdmin();
    }
}

// Login
document.getElementById('loginForm')?.addEventListener('submit', function(e) {
    e.preventDefault();
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    
    const user = users.find(u => u.username === username && u.password === password);
    
    if (user) {
        currentUser = user;
        localStorage.setItem('currentUser', JSON.stringify(user));
        localStorage.setItem('users', JSON.stringify(users));
        showDashboard();
    } else {
        alert('Username atau password salah!');
    }
});

function showDashboard() {
    goToPage('dashboardPage');
    loadDashboard();
}

function logout() {
    localStorage.removeItem('currentUser');
    currentUser = null;
    goToPage('loginPage');
    document.getElementById('loginForm').reset();
}

// Load Dashboard
function loadDashboard() {
    document.getElementById('welcomeName').textContent = currentUser.name;
    document.getElementById('userInfo').textContent = `${currentUser.name} (${currentUser.role})`;
    
    // Show admin menu only for admin
    const adminMenuBtn = document.getElementById('adminMenuBtn');
    if (currentUser.role === 'admin') {
        adminMenuBtn.style.display = 'block';
    } else {
        adminMenuBtn.style.display = 'none';
    }
    
    // Load today's attendance
    const today = new Date().toISOString().split('T')[0];
    const todayAttendance = attendances.find(a => a.userId === currentUser.id && a.date === today);
    
    const checkInTime = document.getElementById('checkInTime');
    const checkOutTime = document.getElementById('checkOutTime');
    const checkInBtn = document.getElementById('checkInBtn');
    const checkOutBtn = document.getElementById('checkOutBtn');
    
    if (todayAttendance) {
        checkInTime.textContent = todayAttendance.checkIn || 'Belum absensi';
        checkOutTime.textContent = todayAttendance.checkOut || 'Belum absensi';
        checkInBtn.disabled = true;
        checkInBtn.textContent = 'Sudah Absensi Masuk';
        
        if (todayAttendance.checkOut) {
            checkOutBtn.disabled = true;
            checkOutBtn.textContent = 'Sudah Absensi Pulang';
        } else {
            checkOutBtn.disabled = false;
        }
    } else {
        checkInBtn.disabled = false;
        checkOutBtn.disabled = true;
    }
}

// Check In
function checkIn() {
    const today = new Date().toISOString().split('T')[0];
    const time = new Date().toLocaleTimeString('id-ID', { 
        hour: '2-digit', 
        minute: '2-digit', 
        second: '2-digit' 
    });
    
    let attendance = attendances.find(a => a.userId === currentUser.id && a.date === today);
    
    if (!attendance) {
        attendance = {
            id: Date.now(),
            userId: currentUser.id,
            userName: currentUser.name,
            date: today,
            checkIn: time,
            checkOut: null
        };
        attendances.push(attendance);
    } else {
        attendance.checkIn = time;
    }
    
    localStorage.setItem('attendances', JSON.stringify(attendances));
    loadDashboard();
    alert('Absensi masuk tercatat!');
}

// Check Out
function checkOut() {
    const today = new Date().toISOString().split('T')[0];
    const time = new Date().toLocaleTimeString('id-ID', { 
        hour: '2-digit', 
        minute: '2-digit', 
        second: '2-digit' 
    });
    
    let attendance = attendances.find(a => a.userId === currentUser.id && a.date === today);
    
    if (attendance) {
        attendance.checkOut = time;
        localStorage.setItem('attendances', JSON.stringify(attendances));
        loadDashboard();
        alert('Absensi pulang tercatat!');
    }
}

// Load History
function loadHistory() {
    const userAttendances = attendances
        .filter(a => a.userId === currentUser.id)
        .sort((a, b) => new Date(b.date) - new Date(a.date));
    
    const tableBody = document.getElementById('historyTableBody');
    tableBody.innerHTML = '';
    
    if (userAttendances.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="4" style="text-align: center; padding: 30px;">Belum ada data absensi</td></tr>';
        return;
    }
    
    userAttendances.forEach(attendance => {
        const date = new Date(attendance.date).toLocaleDateString('id-ID', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
        
        const status = attendance.checkIn ? 
            '<span class="status-hadir">Hadir</span>' : 
            '<span class="status-belum">Belum</span>';
        
        const row = `
            <tr>
                <td>${date}</td>
                <td>${attendance.checkIn || '-'}</td>
                <td>${attendance.checkOut || '-'}</td>
                <td>${status}</td>
            </tr>
        `;
        tableBody.innerHTML += row;
    });
}

// Generate Report
function generateReport() {
    const month = document.getElementById('reportMonth').value;
    if (!month) {
        alert('Pilih bulan terlebih dahulu!');
        return;
    }
    
    const [year, monthNum] = month.split('-');
    let reportHTML = '';
    
    if (currentUser.role === 'admin') {
        // Admin report - all employees
        const monthAttendances = attendances.filter(a => {
            const [aYear, aMonth] = a.date.split('-');
            return aYear === year && aMonth === monthNum;
        });
        
        if (monthAttendances.length === 0) {
            reportHTML = '<p style="text-align: center; color: #999;">Tidak ada data absensi untuk bulan ini</p>';
        } else {
            // Group by employee
            const groupedByEmployee = {};
            monthAttendances.forEach(att => {
                if (!groupedByEmployee[att.userId]) {
                    groupedByEmployee[att.userId] = {
                        name: att.userName,
                        attendances: []
                    };
                }
                groupedByEmployee[att.userId].attendances.push(att);
            });
            
            reportHTML = '<h4 style="margin-bottom: 20px;">Laporan Absensi - ' + 
                new Date(year, monthNum - 1).toLocaleDateString('id-ID', { month: 'long', year: 'numeric' }) + '</h4>';
            
            Object.entries(groupedByEmployee).forEach(([userId, data]) => {
                const hadirCount = data.attendances.filter(a => a.checkIn).length;
                const totalDays = data.attendances.length;
                
                reportHTML += `
                    <div style="background: #f9f9f9; padding: 15px; margin-bottom: 15px; border-radius: 8px;">
                        <h5>${data.name}</h5>
                        <p>Total Hadir: <strong>${hadirCount}/${totalDays}</strong> hari</p>
                        <p>Presentase: <strong>${((hadirCount/totalDays)*100).toFixed(2)}%</strong></p>
                    </div>
                `;
            });
        }
    } else {
        // User report - own attendance
        const monthAttendances = attendances.filter(a => {
            return a.userId === currentUser.id && 
                   a.date.startsWith(year + '-' + monthNum);
        });
        
        if (monthAttendances.length === 0) {
            reportHTML = '<p style="text-align: center; color: #999;">Tidak ada data absensi untuk bulan ini</p>';
        } else {
            const hadirCount = monthAttendances.filter(a => a.checkIn).length;
            
            reportHTML = `
                <div style="background: #f9f9f9; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
                    <h4>Laporan Absensi - ${new Date(year, monthNum - 1).toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })}</h4>
                    <p style="margin-top: 15px;">Total Hari Kerja: <strong>${monthAttendances.length}</strong> hari</p>
                    <p>Total Hadir: <strong>${hadirCount}</strong> hari</p>
                    <p>Total Tidak Hadir: <strong>${monthAttendances.length - hadirCount}</strong> hari</p>
                    <p>Presentase Kehadiran: <strong>${((hadirCount/monthAttendances.length)*100).toFixed(2)}%</strong></p>
                </div>
                
                <h4 style="margin-bottom: 15px;">Detail Absensi</h4>
                <table class="history-table">
                    <thead>
                        <tr>
                            <th>Tanggal</th>
                            <th>Jam Masuk</th>
                            <th>Jam Pulang</th>
                            <th>Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${monthAttendances.map(att => {
                            const date = new Date(att.date).toLocaleDateString('id-ID', {
                                weekday: 'short',
                                year: 'numeric',
                                month: '2-digit',
                                day: '2-digit'
                            });
                            const status = att.checkIn ? 
                                '<span class="status-hadir">Hadir</span>' : 
                                '<span class="status-belum">Tidak Hadir</span>';
                            return `
                                <tr>
                                    <td>${date}</td>
                                    <td>${att.checkIn || '-'}</td>
                                    <td>${att.checkOut || '-'}</td>
                                    <td>${status}</td>
                                </tr>
                            `;
                        }).join('')}
                    </tbody>
                </table>
            `;
        }
    }
    
    document.getElementById('reportContent').innerHTML = reportHTML;
}

// Load Admin Panel
function loadAdmin() {
    if (currentUser.role !== 'admin') {
        alert('Anda tidak memiliki akses ke panel admin!');
        goToPage('dashboardPage');
        return;
    }
    
    loadEmployeeTable();
}

function loadEmployeeTable() {
    const tableBody = document.getElementById('employeeTableBody');
    tableBody.innerHTML = '';
    
    users.forEach((user, index) => {
        if (user.role === 'user') {
            const row = `
                <tr>
                    <td>${index}</td>
                    <td>${user.username}</td>
                    <td>${user.name}</td>
                    <td><span style="color: #27ae60;">Aktif</span></td>
                    <td>
                        <button class="btn-delete" onclick="deleteEmployee(${user.id})">Hapus</button>
                    </td>
                </tr>
            `;
            tableBody.innerHTML += row;
        }
    });
}

function deleteEmployee(userId) {
    if (confirm('Yakin ingin menghapus karyawan ini?')) {
        users = users.filter(u => u.id !== userId);
        attendances = attendances.filter(a => a.userId !== userId);
        localStorage.setItem('users', JSON.stringify(users));
        localStorage.setItem('attendances', JSON.stringify(attendances));
        loadEmployeeTable();
        alert('Karyawan berhasil dihapus!');
    }
}

document.getElementById('addEmployeeForm')?.addEventListener('submit', function(e) {
    e.preventDefault();
    
    const username = document.getElementById('newUsername').value;
    const name = document.getElementById('newName').value;
    const password = document.getElementById('newPassword').value;
    
    // Check if username already exists
    if (users.find(u => u.username === username)) {
        alert('Username sudah terdaftar!');
        return;
    }
    
    const newUser = {
        id: Math.max(...users.map(u => u.id)) + 1,
        username: username,
        password: password,
        name: name,
        role: 'user'
    };
    
    users.push(newUser);
    localStorage.setItem('users', JSON.stringify(users));
    
    this.reset();
    loadEmployeeTable();
    alert('Karyawan berhasil ditambahkan!');
});