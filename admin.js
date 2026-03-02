// ==================== АДМИН-ПАНЕЛЬ ====================
const express = require('express');
const path = require('path');
const bcrypt = require('bcrypt');
const config = require('./config');
const db = require('./database');

const router = express.Router();

// ==================== МИДЛВАРЫ АДМИНКИ ====================
async function requireAuth(req, res, next) {
    if (!req.session || !req.session.admin) {
        if (req.xhr || req.path.startsWith('/api/')) {
            return res.status(401).json({ success: false, error: 'Unauthorized' });
        }
        return res.redirect('/admin/login');
    }
    next();
}

// ==================== СТРАНИЦЫ ====================
router.get('/login', (req, res) => {
    if (req.session && req.session.admin) {
        return res.redirect('/admin');
    }
    res.send(`
<!DOCTYPE html>
<html lang="ru">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>🔐 Ice Mine Admin 2026</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
            background: linear-gradient(135deg, #1a1f35 0%, #0f1425 100%);
            color: #ffffff;
            min-height: 100vh;
        }
        .login-container {
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
        }
        .login-box {
            background: rgba(0, 0, 0, 0.3);
            padding: 40px;
            border-radius: 20px;
            border: 1px solid rgba(79, 172, 254, 0.3);
            width: 100%;
            max-width: 400px;
        }
        .login-box h1 {
            text-align: center;
            margin-bottom: 30px;
            background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
        }
        .form-group {
            margin-bottom: 20px;
        }
        .form-group label {
            display: block;
            margin-bottom: 8px;
            color: #8e9ab3;
        }
        .form-group input {
            width: 100%;
            padding: 12px 16px;
            background: rgba(0, 0, 0, 0.3);
            border: 1px solid rgba(255, 255, 255, 0.1);
            border-radius: 12px;
            color: white;
            font-size: 16px;
        }
        .form-group input:focus {
            outline: none;
            border-color: #4facfe;
        }
        .login-btn {
            width: 100%;
            padding: 14px;
            background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
            border: none;
            border-radius: 12px;
            color: white;
            font-weight: 700;
            font-size: 16px;
            cursor: pointer;
            transition: opacity 0.2s;
        }
        .login-btn:hover { opacity: 0.9; }
    </style>
</head>
<body>
    <div class="login-container">
        <div class="login-box">
            <h1>🔐 Ice Mine Admin 2026</h1>
            <form id="loginForm">
                <div class="form-group">
                    <label>👤 Имя пользователя</label>
                    <input type="text" id="username" required>
                </div>
                <div class="form-group">
                    <label>🔑 Пароль</label>
                    <input type="password" id="password" required>
                </div>
                <button type="submit" class="login-btn">Войти</button>
            </form>
        </div>
    </div>
    <script>
        document.getElementById('loginForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            const username = document.getElementById('username').value;
            const password = document.getElementById('password').value;
            
            try {
                const response = await fetch('/admin/api/login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ username, password })
                });
                const data = await response.json();
                if (data.success) {
                    window.location.href = '/admin';
                } else {
                    alert('❌ Неверный логин или пароль');
                }
            } catch (error) {
                alert('❌ Ошибка подключения');
            }
        });
    </script>
</body>
</html>
    `);
});

router.post('/api/login', express.json(), async (req, res) => {
    try {
        const { username, password } = req.body;
        const valid = await db.verifyAdmin(username, password);
        if (valid) {
            req.session.admin = { username, loggedIn: Date.now() };
            res.json({ success: true });
        } else {
            res.json({ success: false });
        }
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ success: false });
    }
});

router.get('/logout', (req, res) => {
    req.session.destroy();
    res.redirect('/admin/login');
});

router.get('/', requireAuth, (req, res) => {
    const ranksJson = JSON.stringify(config.game.ranks);

    res.send(`
<!DOCTYPE html>
<html lang="ru">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>❄️ Ice Mine Admin ${new Date().getFullYear()}</title>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
            background: linear-gradient(135deg, #1a1f35 0%, #0f1425 100%);
            color: #ffffff;
            min-height: 100vh;
        }
        .admin-header {
            background: rgba(0, 0, 0, 0.3);
            padding: 20px;
            border-bottom: 1px solid rgba(79, 172, 254, 0.3);
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        .admin-header h1 {
            background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
        }
        .logout-btn {
            background: rgba(244, 67, 54, 0.2);
            border: 1px solid #f44336;
            color: #f44336;
            padding: 8px 16px;
            border-radius: 8px;
            cursor: pointer;
            text-decoration: none;
        }
        .nav-tabs {
            display: flex;
            gap: 10px;
            padding: 20px;
            background: rgba(0, 0, 0, 0.2);
            flex-wrap: wrap;
        }
        .nav-tab {
            padding: 10px 20px;
            background: rgba(0, 0, 0, 0.3);
            border: 1px solid rgba(255, 255, 255, 0.1);
            border-radius: 12px;
            cursor: pointer;
            transition: all 0.2s;
        }
        .nav-tab.active {
            background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
            border-color: #4facfe;
        }
        .tab-content {
            display: none;
            padding: 20px;
        }
        .tab-content.active {
            display: block;
        }
        .stats-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 20px;
            margin-bottom: 30px;
        }
        .stat-card {
            background: rgba(0, 0, 0, 0.3);
            padding: 20px;
            border-radius: 16px;
            border: 1px solid rgba(79, 172, 254, 0.3);
        }
        .stat-card h3 {
            color: #8e9ab3;
            font-size: 14px;
            margin-bottom: 10px;
        }
        .stat-card .value {
            font-size: 28px;
            font-weight: 700;
            background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
        }
        .data-table {
            width: 100%;
            border-collapse: collapse;
            background: rgba(0, 0, 0, 0.3);
            border-radius: 16px;
            overflow: hidden;
        }
        .data-table th, .data-table td {
            padding: 12px 16px;
            text-align: left;
            border-bottom: 1px solid rgba(255, 255, 255, 0.05);
        }
        .data-table th {
            background: rgba(0, 0, 0, 0.5);
            color: #8e9ab3;
            font-weight: 600;
        }
        .data-table tr:hover {
            background: rgba(79, 172, 254, 0.1);
        }
        .action-btn {
            padding: 6px 12px;
            border-radius: 8px;
            border: none;
            cursor: pointer;
            font-size: 12px;
            margin-right: 5px;
        }
        .action-btn.edit {
            background: rgba(79, 172, 254, 0.2);
            color: #4facfe;
        }
        .action-btn.delete {
            background: rgba(244, 67, 54, 0.2);
            color: #f44336;
        }
        .action-btn.ban {
            background: rgba(255, 152, 0, 0.2);
            color: #ff9800;
        }
        .modal {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0, 0, 0, 0.8);
            display: none;
            align-items: center;
            justify-content: center;
            z-index: 1000;
        }
        .modal-content {
            background: #1a1f35;
            border-radius: 20px;
            width: 90%;
            max-width: 500px;
            max-height: 85vh;
            overflow-y: auto;
            border: 1px solid rgba(79, 172, 254, 0.3);
        }
        .modal-header {
            padding: 20px;
            border-bottom: 1px solid rgba(255, 255, 255, 0.1);
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        .modal-body {
            padding: 20px;
        }
        .close-btn {
            background: rgba(255, 255, 255, 0.1);
            border: none;
            color: white;
            width: 32px;
            height: 32px;
            border-radius: 50%;
            cursor: pointer;
        }
        .form-group {
            margin-bottom: 16px;
        }
        .form-group label {
            display: block;
            margin-bottom: 8px;
            color: #8e9ab3;
        }
        .form-group input, .form-group select {
            width: 100%;
            padding: 12px;
            background: rgba(0, 0, 0, 0.3);
            border: 1px solid rgba(255, 255, 255, 0.1);
            border-radius: 12px;
            color: white;
        }
        .save-btn {
            width: 100%;
            padding: 14px;
            background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
            border: none;
            border-radius: 12px;
            color: white;
            font-weight: 700;
            cursor: pointer;
        }
        .config-section {
            background: rgba(0, 0, 0, 0.3);
            border-radius: 16px;
            padding: 20px;
            margin-bottom: 20px;
        }
        .config-section h3 {
            margin-bottom: 15px;
            color: #4facfe;
        }
    </style>
</head>
<body>
    <div class="admin-header">
        <h1>❄️ Ice Mine Admin ${new Date().getFullYear()}</h1>
        <a href="/admin/logout" class="logout-btn">🚪 Выйти</a>
    </div>
    
    <div class="nav-tabs">
        <div class="nav-tab active" data-tab="dashboard">📊 Дашборд</div>
        <div class="nav-tab" data-tab="users">👥 Пользователи</div>
        <div class="nav-tab" data-tab="promocodes">🎫 Промокоды</div>
        <div class="nav-tab" data-tab="referrals">🔗 Рефералы</div>
        <div class="nav-tab" data-tab="config">⚙️ Конфиг</div>
        <div class="nav-tab" data-tab="logs">📋 Логи</div>
    </div>

    <!-- ДАШБОРД -->
    <div class="tab-content active" id="dashboard">
        <div class="stats-grid">
            <div class="stat-card">
                <h3>👥 Всего пользователей</h3>
                <div class="value" id="totalUsers">0</div>
            </div>
            <div class="stat-card">
                <h3>📅 Активных сегодня</h3>
                <div class="value" id="activeToday">0</div>
            </div>
            <div class="stat-card">
                <h3>💰 Всего льда</h3>
                <div class="value" id="totalIce">0</div>
            </div>
            <div class="stat-card">
                <h3>👆 Всего тапов</h3>
                <div class="value" id="totalTaps">0</div>
            </div>
            <div class="stat-card">
                <h3>🔗 Всего рефералов</h3>
                <div class="value" id="totalReferrals">0</div>
            </div>
        </div>
        
        <div class="config-section">
            <h3>🏆 Топ игроков (по балансу)</h3>
            <table class="data-table">
                <thead>
                    <tr><th>#</th><th>ID</th><th>Имя</th><th>Баланс</th></tr>
                </thead>
                <tbody id="topPlayersBody">
                    <tr><td colspan="4">Загрузка...</td></tr>
                </tbody>
            </table>
        </div>
    </div>

    <!-- ПОЛЬЗОВАТЕЛИ -->
    <div class="tab-content" id="users">
        <div class="config-section">
            <h3>👥 Управление пользователями</h3>
            <table class="data-table">
                <thead>
                    <tr>
                        <th>ID</th><th>Имя</th><th>Баланс</th>
                        <th>Тапы</th><th>Ранг</th><th>Статус</th><th>Действия</th>
                    </tr>
                </thead>
                <tbody id="usersBody">
                    <tr><td colspan="7">Загрузка...</td></tr>
                </tbody>
            </table>
        </div>
    </div>

    <!-- ПРОМОКОДЫ -->
    <div class="tab-content" id="promocodes">
        <div class="config-section">
            <h3>🎫 Промокоды</h3>
            <button class="save-btn" style="width: auto; margin-bottom: 15px;" onclick="openPromoModal()">+ Создать промокод</button>
            <table class="data-table">
                <thead>
                    <tr>
                        <th>Код</th><th>Лёд</th><th>Использовано</th>
                        <th>Лимит</th><th>Статус</th><th>Действия</th>
                    </tr>
                </thead>
                <tbody id="promocodesBody">
                    <tr><td colspan="6">Загрузка...</td></tr>
                </tbody>
            </table>
        </div>
    </div>

    <!-- РЕФЕРАЛЫ -->
    <div class="tab-content" id="referrals">
        <div class="stats-grid">
            <div class="stat-card">
                <h3>👥 Всего рефералов</h3>
                <div class="value" id="refTotal">0</div>
            </div>
            <div class="stat-card">
                <h3>💰 Выплачено бонусов</h3>
                <div class="value" id="refBonus">0</div>
            </div>
        </div>
        <div class="config-section">
            <h3>📊 Топ рефералов</h3>
            <table class="data-table">
                <thead>
                    <tr><th>Пользователь</th><th>Код</th><th>Приглашено</th><th>Заработано</th></tr>
                </thead>
                <tbody id="referralsBody">
                    <tr><td colspan="4">Загрузка...</td></tr>
                </tbody>
            </table>
        </div>
    </div>

    <!-- КОНФИГ -->
    <div class="tab-content" id="config">
        <div class="config-section">
            <h3>⚙️ Основные настройки</h3>
            <div class="form-group">
                <label>Множитель цены мультитапа</label>
                <input type="number" id="multitapPriceMultiplier" step="0.1" value="2">
            </div>
            <div class="form-group">
                <label>Множитель цены энергии</label>
                <input type="number" id="energyPriceMultiplier" step="0.1" value="1.8">
            </div>
            <div class="form-group">
                <label>Максимум тапов в секунду (анти-чит)</label>
                <input type="number" id="maxTapsPerSecond" value="20">
            </div>
            <div class="form-group">
                <label>Длительность бана (минуты)</label>
                <input type="number" id="banDuration" value="5">
            </div>
            <button class="save-btn" onclick="saveMainConfig()">Сохранить настройки</button>
        </div>
    </div>

    <!-- ЛОГИ -->
    <div class="tab-content" id="logs">
        <div class="config-section">
            <h3>📋 Системные логи</h3>
            <button class="save-btn" style="width: auto; margin-bottom: 15px;" onclick="loadLogs()">🔄 Обновить</button>
            <table class="data-table">
                <thead>
                    <tr><th>Время</th><th>Пользователь</th><th>Действие</th><th>Детали</th><th>IP</th></tr>
                </thead>
                <tbody id="logsBody">
                    <tr><td colspan="5">Загрузка...</td></tr>
                </tbody>
            </table>
        </div>
    </div>

    <!-- МОДАЛКИ -->
    <div class="modal" id="userModal">
        <div class="modal-content">
            <div class="modal-header">
                <h3>✏️ Редактировать пользователя</h3>
                <button class="close-btn" onclick="closeModal('userModal')">✕</button>
            </div>
            <div class="modal-body">
                <input type="hidden" id="editUserId">
                <div class="form-group">
                    <label>Имя</label>
                    <input type="text" id="editUserName">
                </div>
                <div class="form-group">
                    <label>Баланс</label>
                    <input type="number" id="editUserBalance">
                </div>
                <div class="form-group">
                    <label>Ранг</label>
                    <select id="editUserRank"></select>
                </div>
                <button class="save-btn" onclick="saveUser()">Сохранить</button>
            </div>
        </div>
    </div>

    <div class="modal" id="promoModal">
        <div class="modal-content">
            <div class="modal-header">
                <h3>🎫 Создать промокод</h3>
                <button class="close-btn" onclick="closeModal('promoModal')">✕</button>
            </div>
            <div class="modal-body">
                <div class="form-group">
                    <label>Код</label>
                    <input type="text" id="promoCode" placeholder="WELCOME100">
                </div>
                <div class="form-group">
                    <label>Лёд</label>
                    <input type="number" id="promoIce" value="10000">
                </div>
                <div class="form-group">
                    <label>Максимум использований (0 = без лимита)</label>
                    <input type="number" id="promoMaxUses" value="0">
                </div>
                <div class="form-group">
                    <label>Срок действия (дней, 0 = бессрочно)</label>
                    <input type="number" id="promoExpires" value="0">
                </div>
                <button class="save-btn" onclick="createPromoCode()">Создать</button>
            </div>
        </div>
    </div>

    <script>
        const ranks = ${ranksJson};

        // Навигация
        document.querySelectorAll('.nav-tab').forEach(tab => {
            tab.addEventListener('click', () => {
                document.querySelectorAll('.nav-tab').forEach(t => t.classList.remove('active'));
                document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
                tab.classList.add('active');
                document.getElementById(tab.dataset.tab).classList.add('active');
                loadTabData(tab.dataset.tab);
            });
        });

        function loadTabData(tab) {
            switch(tab) {
                case 'dashboard': loadDashboard(); break;
                case 'users': loadUsers(); break;
                case 'promocodes': loadPromocodes(); break;
                case 'referrals': loadReferrals(); break;
                case 'logs': loadLogs(); break;
            }
        }

        async function loadDashboard() {
            try {
                const response = await fetch('/admin/api/stats');
                const data = await response.json();
                if (data.success) {
                    document.getElementById('totalUsers').textContent = data.data.totalUsers || 0;
                    document.getElementById('activeToday').textContent = data.data.activeToday || 0;
                    document.getElementById('totalIce').textContent = formatNumber(data.data.totalIce || 0);
                    document.getElementById('totalTaps').textContent = formatNumber(data.data.totalTaps || 0);
                    document.getElementById('totalReferrals').textContent = data.data.totalReferrals || 0;
                }
                loadTopPlayers();
            } catch (error) {
                console.error('Dashboard load error:', error);
                document.getElementById('totalUsers').textContent = 'Ошибка';
            }
        }

        async function loadTopPlayers() {
            try {
                const response = await fetch('/admin/api/top-users/balance?limit=10');
                const data = await response.json();
                const tbody = document.getElementById('topPlayersBody');
                if (data.success && data.data.length > 0) {
                    tbody.innerHTML = data.data.map((player, i) => \`
                        <tr>
                            <td>\${i + 1}</td>
                            <td>\${player.user_id}</td>
                            <td>\${player.username || 'Player'}</td>
                            <td>\${formatNumber(player.balance || 0)}</td>
                        </tr>
                    \`).join('');
                } else {
                    tbody.innerHTML = '<tr><td colspan="4">Нет данных</td></tr>';
                }
            } catch (error) {
                console.error('Top players load error:', error);
            }
        }

        async function loadUsers() {
            try {
                const response = await fetch('/admin/api/users');
                const data = await response.json();
                const tbody = document.getElementById('usersBody');
                if (data.success && data.data.length > 0) {
                    tbody.innerHTML = data.data.map(user => \`
                        <tr>
                            <td>\${user.user_id}</td>
                            <td>\${user.username || 'Player'}</td>
                            <td>\${formatNumber(user.balance || 0)}</td>
                            <td>\${formatNumber(user.total_taps || 0)}</td>
                            <td>\${user.rank_index || 0}</td>
                            <td>\${user.banned ? '🚫 Забанен' : '✅ Активен'}</td>
                            <td>
                                <button class="action-btn edit" onclick="editUser('\${user.user_id}')">✏️</button>
                                <button class="action-btn \${user.banned ? '' : 'ban'}" onclick="toggleBan('\${user.user_id}', \${!user.banned})">\${user.banned ? 'Разбанить' : 'Забанить'}</button>
                            </td>
                        </tr>
                    \`).join('');
                } else {
                    tbody.innerHTML = '<tr><td colspan="7">Нет пользователей</td></tr>';
                }
            } catch (error) {
                console.error('Users load error:', error);
            }
        }

        async function loadPromocodes() {
            try {
                const response = await fetch('/admin/api/promocodes');
                const data = await response.json();
                const tbody = document.getElementById('promocodesBody');
                if (data.success && data.data.length > 0) {
                    tbody.innerHTML = data.data.map(promo => \`
                        <tr>
                            <td>\${promo.code}</td>
                            <td>\${formatNumber(promo.ice || 0)}</td>
                            <td>\${promo.used_count || 0}</td>
                            <td>\${promo.max_uses || '∞'}</td>
                            <td>\${promo.active ? '✅ Активен' : '❌ Неактивен'}</td>
                            <td>
                                <button class="action-btn delete" onclick="deletePromo('\${promo.code}')">🗑️</button>
                            </td>
                        </tr>
                    \`).join('');
                } else {
                    tbody.innerHTML = '<tr><td colspan="6">Нет промокодов</td></tr>';
                }
            } catch (error) {
                console.error('Promocodes load error:', error);
            }
        }

        async function loadReferrals() {
            try {
                const response = await fetch('/admin/api/referrals');
                const data = await response.json();
                if (data.success) {
                    document.getElementById('refTotal').textContent = data.data.totalReferrals || 0;
                    document.getElementById('refBonus').textContent = formatNumber(data.data.totalBonus || 0);
                    const tbody = document.getElementById('referralsBody');
                    if (data.data.list && data.data.list.length > 0) {
                        tbody.innerHTML = data.data.list.map(ref => \`
                            <tr>
                                <td>\${ref.first_name || ref.username || 'Player'}</td>
                                <td>\${ref.referral_code}</td>
                                <td>\${ref.level1_count || 0}</td>
                                <td>\${formatNumber(ref.total_earned || 0)}</td>
                            </tr>
                        \`).join('');
                    } else {
                        tbody.innerHTML = '<tr><td colspan="4">Нет данных</td></tr>';
                    }
                }
            } catch (error) {
                console.error('Referrals load error:', error);
            }
        }

        async function loadLogs() {
            try {
                const response = await fetch('/admin/api/logs?limit=50');
                const data = await response.json();
                const tbody = document.getElementById('logsBody');
                if (data.success && data.data.length > 0) {
                    tbody.innerHTML = data.data.map(log => \`
                        <tr>
                            <td>\${new Date(log.created_at).toLocaleString()}</td>
                            <td>\${log.user_id || 'admin'}</td>
                            <td>\${log.action}</td>
                            <td>\${log.details}</td>
                            <td>\${log.ip || '-'}</td>
                        </tr>
                    \`).join('');
                } else {
                    tbody.innerHTML = '<tr><td colspan="5">Нет логов</td></tr>';
                }
            } catch (error) {
                console.error('Logs load error:', error);
            }
        }

        function editUser(userId) {
            document.getElementById('editUserId').value = userId;
            const rankSelect = document.getElementById('editUserRank');
            rankSelect.innerHTML = ranks.map((r, i) => \`<option value="\${i}">\${r.icon} \${r.name}</option>\`).join('');
            
            // Загружаем данные пользователя
            fetch(\`/admin/api/users/\${userId}\`)
                .then(res => res.json())
                .then(data => {
                    if (data.success) {
                        document.getElementById('editUserName').value = data.data.username || '';
                        document.getElementById('editUserBalance').value = data.data.balance || 0;
                        rankSelect.value = data.data.rank_index || 0;
                    }
                });
                
            document.getElementById('userModal').style.display = 'flex';
        }

        function closeModal(modalId) {
            document.getElementById(modalId).style.display = 'none';
        }

        async function saveUser() {
            const userId = document.getElementById('editUserId').value;
            const updates = {
                username: document.getElementById('editUserName').value,
                balance: parseInt(document.getElementById('editUserBalance').value) || 0,
                rank_index: parseInt(document.getElementById('editUserRank').value) || 0
            };
            try {
                const response = await fetch(\`/admin/api/users/\${userId}\`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(updates)
                });
                const data = await response.json();
                if (data.success) {
                    closeModal('userModal');
                    loadUsers();
                    alert('✅ Пользователь обновлен');
                } else {
                    alert('❌ Ошибка: ' + data.error);
                }
            } catch (error) {
                alert('❌ Ошибка сохранения');
            }
        }

        async function toggleBan(userId, banned) {
            try {
                const response = await fetch(\`/admin/api/users/\${userId}/ban\`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ banned })
                });
                const data = await response.json();
                if (data.success) {
                    loadUsers();
                } else {
                    alert('❌ Ошибка: ' + data.error);
                }
            } catch (error) {
                alert('❌ Ошибка');
            }
        }

        function openPromoModal() {
            document.getElementById('promoModal').style.display = 'flex';
        }

        async function createPromoCode() {
            const code = document.getElementById('promoCode').value.trim().toUpperCase();
            const ice = parseInt(document.getElementById('promoIce').value) || 0;
            const maxUses = parseInt(document.getElementById('promoMaxUses').value) || 0;
            const expires = parseInt(document.getElementById('promoExpires').value) || 0;
            
            if (!code) {
                alert('❌ Введите код');
                return;
            }
            if (ice <= 0) {
                alert('❌ Укажите количество льда');
                return;
            }
            
            try {
                const response = await fetch('/admin/api/promocodes', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ 
                        code, 
                        ice, 
                        maxUses, 
                        expiresAt: expires > 0 ? Date.now() + (expires * 24 * 60 * 60 * 1000) : 0 
                    })
                });
                const data = await response.json();
                if (data.success) {
                    closeModal('promoModal');
                    loadPromocodes();
                    alert('✅ Промокод создан');
                } else {
                    alert('❌ Ошибка: ' + (data.error || 'Неизвестная ошибка'));
                }
            } catch (error) {
                alert('❌ Ошибка создания');
            }
        }

        async function deletePromo(code) {
            if (!confirm('Удалить промокод?')) return;
            try {
                const response = await fetch(\`/admin/api/promocodes/\${code}\`, { method: 'DELETE' });
                const data = await response.json();
                if (data.success) {
                    loadPromocodes();
                } else {
                    alert('❌ Ошибка: ' + data.error);
                }
            } catch (error) {
                alert('❌ Ошибка удаления');
            }
        }

        async function saveMainConfig() {
            const config = {
                multitapPriceMultiplier: parseFloat(document.getElementById('multitapPriceMultiplier').value) || 2,
                energyPriceMultiplier: parseFloat(document.getElementById('energyPriceMultiplier').value) || 1.8,
                maxTapsPerSecond: parseInt(document.getElementById('maxTapsPerSecond').value) || 20,
                banDuration: (parseInt(document.getElementById('banDuration').value) || 5) * 60 * 1000
            };
            try {
                const response = await fetch('/admin/api/config/main', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(config)
                });
                const data = await response.json();
                if (data.success) {
                    alert('✅ Основные настройки сохранены');
                } else {
                    alert('❌ Ошибка: ' + data.error);
                }
            } catch (error) {
                alert('❌ Ошибка сохранения');
            }
        }

        function formatNumber(num) {
            if (num >= 1000000000) return (num / 1000000000).toFixed(2) + 'B';
            if (num >= 1000000) return (num / 1000000).toFixed(2) + 'M';
            if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
            return num.toString().replace(/\\B(?=(\\d{3})+(?!\\d))/g, " ");
        }

        // Initial load
        loadDashboard();
    </script>
</body>
</html>
    `);
});

// ==================== API ДЛЯ АДМИНКИ ====================
router.get('/api/stats', requireAuth, async (req, res) => {
    try {
        const stats = await db.getStats();
        const referrals = await db.db.get('SELECT COUNT(*) as total FROM referrals WHERE level1_count > 0');
        res.json({
            success: true,
            data: {
                totalUsers: stats?.totalUsers || 0,
                activeToday: stats?.activeToday || 0,
                totalIce: stats?.totalIce || 0,
                totalTaps: stats?.totalTaps || 0,
                totalReferrals: referrals?.total || 0
            }
        });
    } catch (error) {
        console.error('Stats error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

router.get('/api/top-users/:category', requireAuth, async (req, res) => {
    try {
        const { category } = req.params;
        const limit = parseInt(req.query.limit) || 50;
        const topUsers = await db.getTopUsers(category, limit);
        res.json({ success: true, data: topUsers });
    } catch (error) {
        console.error('Top users error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

router.get('/api/users', requireAuth, async (req, res) => {
    try {
        const users = await db.getAllUsers(1000);
        res.json({ success: true, data: users });
    } catch (error) {
        console.error('Users error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

router.get('/api/users/:userId', requireAuth, async (req, res) => {
    try {
        const { userId } = req.params;
        const user = await db.getUser(userId);
        if (!user) {
            return res.status(404).json({ success: false, error: 'User not found' });
        }
        res.json({ success: true, data: user });
    } catch (error) {
        console.error('Get user error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

router.put('/api/users/:userId', requireAuth, async (req, res) => {
    try {
        const { userId } = req.params;
        const updates = req.body;
        await db.updateUser(userId, updates);
        await db.addLog('admin', 'update_user', `Обновлен пользователь ${userId}`, req.ip);
        res.json({ success: true });
    } catch (error) {
        console.error('Update user error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

router.post('/api/users/:userId/ban', requireAuth, async (req, res) => {
    try {
        const { userId } = req.params;
        const { banned } = req.body;
        await db.db.run(
            'UPDATE users SET banned = ?, ban_reason = ? WHERE user_id = ?',
            [banned ? 1 : 0, banned ? 'Забанен администратором' : null, userId]
        );
        await db.addLog('admin', banned ? 'ban_user' : 'unban_user',
            `${banned ? 'Забанен' : 'Разбанен'} пользователь ${userId}`, req.ip);
        res.json({ success: true });
    } catch (error) {
        console.error('Ban user error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

router.post('/api/users/:userId/add-funds', requireAuth, async (req, res) => {
    try {
        const { userId } = req.params;
        const { amount } = req.body;
        const user = await db.getUser(userId);
        if (!user) {
            return res.status(404).json({ success: false, error: 'User not found' });
        }
        await db.updateUser(userId, { balance: (user.balance || 0) + amount });
        await db.addLog('admin', 'add_funds', `Добавлено ${amount} льда пользователю ${userId}`, req.ip);
        res.json({ success: true });
    } catch (error) {
        console.error('Add funds error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

router.get('/api/promocodes', requireAuth, async (req, res) => {
    try {
        const promocodes = await db.db.all('SELECT * FROM promocodes ORDER BY created_at DESC');
        res.json({ success: true, data: promocodes });
    } catch (error) {
        console.error('Promocodes error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

router.post('/api/promocodes', requireAuth, async (req, res) => {
    try {
        const { code, ice, maxUses, expiresAt } = req.body;
        const exists = await db.db.get('SELECT * FROM promocodes WHERE code = ?', code);
        if (exists) {
            return res.json({ success: false, error: 'Код уже существует' });
        }
        await db.createPromoCode(code, ice, maxUses, expiresAt);
        await db.addLog('admin', 'create_promo', `Создан промокод ${code}`, req.ip);
        res.json({ success: true });
    } catch (error) {
        console.error('Create promo error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

router.delete('/api/promocodes/:code', requireAuth, async (req, res) => {
    try {
        const { code } = req.params;
        await db.deletePromoCode(code);
        await db.addLog('admin', 'delete_promo', `Удален промокод ${code}`, req.ip);
        res.json({ success: true });
    } catch (error) {
        console.error('Delete promo error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

router.get('/api/referrals', requireAuth, async (req, res) => {
    try {
        const referrals = await db.db.all(`
            SELECT u.user_id, u.username, u.first_name, 
                   r.referral_code, r.level1_count, r.total_earned
            FROM referrals r
            JOIN users u ON u.user_id = r.user_id
            ORDER BY r.total_earned DESC
            LIMIT 100
        `);
        const totalReferrals = await db.db.get('SELECT COUNT(*) as total FROM referrals WHERE level1_count > 0');
        const totalBonus = await db.db.get('SELECT SUM(total_earned) as total FROM referrals');
        res.json({
            success: true,
            data: {
                list: referrals || [],
                totalReferrals: totalReferrals?.total || 0,
                totalBonus: totalBonus?.total || 0
            }
        });
    } catch (error) {
        console.error('Referrals error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

router.get('/api/logs', requireAuth, async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 100;
        const logs = await db.getLogs(limit);
        res.json({ success: true, data: logs });
    } catch (error) {
        console.error('Logs error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

router.post('/api/config/main', requireAuth, async (req, res) => {
    try {
        const configData = req.body;
        await db.db.run(
            'INSERT OR REPLACE INTO config (key, value) VALUES (?, ?)',
            ['main_config', JSON.stringify(configData)]
        );
        await db.addLog('admin', 'update_config', 'Обновлен основной конфиг', req.ip);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

module.exports = router;