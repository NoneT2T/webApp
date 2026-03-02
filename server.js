// ==================== ОСНОВНОЙ СЕРВЕР ====================
const express = require('express');
const session = require('express-session');
const path = require('path');
const config = require('./config');
const db = require('./database');
const adminRouter = require('./admin');

const app = express();

// Сессии для админки
app.use(session({
    secret: config.server.sessionSecret,
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false, maxAge: 24 * 60 * 60 * 1000 }
}));

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname)));

// Подключаем админ роутер
app.use('/admin', adminRouter);

// ==================== API ДЛЯ ТОПА ИГРОКОВ ====================
app.get('/api/top/:category', async (req, res) => {
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

// ==================== API ДЛЯ ЗАГРУЗКИ СОСТОЯНИЯ ====================
app.post('/api/load', express.json(), async (req, res) => {
    try {
        const { userId, userName, userAvatar } = req.body;

        let user = await db.getUser(userId);

        if (!user) {
            await db.createUser({
                user_id: userId,
                username: userName,
                first_name: userName,
                avatar: userAvatar
            });
            user = await db.getUser(userId);
        }

        const gameState = await db.loadGameState(userId);

        res.json({ success: true, data: gameState });
    } catch (error) {
        console.error('Load error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// ==================== API ДЛЯ СОХРАНЕНИЯ СОСТОЯНИЯ ====================
app.post('/api/save', express.json(), async (req, res) => {
    try {
        const { userId, gameState } = req.body;

        await db.saveGameState(userId, gameState);

        res.json({ success: true });
    } catch (error) {
        console.error('Save error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// ==================== РЕФЕРАЛЬНЫЙ API ====================
app.post('/api/referral/activate', express.json(), async (req, res) => {
    try {
        const { userId, referrerCode, userName } = req.body;

        if (!userId || !referrerCode) {
            return res.json({ success: false, error: 'missing_data' });
        }

        if (userId === referrerCode) {
            return res.json({ success: false, error: 'self_referral' });
        }

        // Проверяем, существует ли пригласивший
        const referrer = await db.getUser(referrerCode);
        if (!referrer) {
            return res.json({ success: false, error: 'referrer_not_found' });
        }

        // Проверяем, не активировал ли уже пользователь код
        const user = await db.getUser(userId);
        if (user && user.invited_by) {
            return res.json({ success: false, error: 'already_used' });
        }

        // Создаем пользователя если его нет
        if (!user) {
            await db.createUser({
                user_id: userId,
                username: userName,
                first_name: userName
            });
        }

        // Обновляем invited_by у пользователя
        await db.db.run(
            'UPDATE users SET invited_by = ? WHERE user_id = ?',
            [referrerCode, userId]
        );

        // Начисляем бонус пригласившему
        const baseReward = 5000;
        await db.db.run(
            'UPDATE users SET balance = balance + ? WHERE user_id = ?',
            [baseReward, referrerCode]
        );

        // Обновляем статистику рефералов
        const referrerReferrals = await db.getReferrals(referrerCode);
        const invitedFriends = JSON.parse(referrerReferrals?.invited_friends || '[]');
        invitedFriends.push({
            user_id: userId,
            date: Date.now(),
            level: 1
        });

        await db.db.run(
            `UPDATE referrals 
             SET invited_friends = ?, level1_count = level1_count + 1, total_earned = total_earned + ? 
             WHERE user_id = ?`,
            [JSON.stringify(invitedFriends), baseReward, referrerCode]
        );

        // Добавляем запись в лог
        await db.addLog(userId, 'referral_activated',
            `Активирован реферальный код ${referrerCode}`, req.ip);

        // Получаем обновленную статистику
        const referralStats = await db.db.get(
            'SELECT level1_count, total_earned FROM referrals WHERE user_id = ?',
            [referrerCode]
        );

        res.json({
            success: true,
            bonus: baseReward,
            referralStats: referralStats || { level1_count: 1, total_earned: baseReward }
        });
    } catch (error) {
        console.error('Referral activation error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Проверка реферального кода
app.post('/api/referral/check', express.json(), async (req, res) => {
    try {
        const { code } = req.body;
        const user = await db.getUser(code);
        res.json({ success: true, exists: !!user });
    } catch (error) {
        console.error('Referral check error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// ==================== API ДЛЯ ПРОМОКОДОВ ====================
app.post('/api/promo/use', express.json(), async (req, res) => {
    try {
        const { userId, code } = req.body;

        const result = await db.usePromoCode(userId, code);

        if (result.success) {
            await db.addLog(userId, 'use_promo', `Использован промокод ${code}`, req.ip);
        }

        res.json(result);
    } catch (error) {
        console.error('Promo use error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// ==================== ГЛАВНАЯ СТРАНИЦА ====================
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// ==================== ЗАПУСК СЕРВЕРА ====================
const PORT = config.server.port;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`\n🚀 Сервер запущен на порту ${PORT}`);
    console.log(`📱 Web App URL: ${config.bot.webappUrl}`);
    console.log(`👑 Админ-панель: http://localhost:${PORT}/admin`);
    console.log(`💰 Топ игроков доступен по /api/top/balance`);
});

module.exports = app;