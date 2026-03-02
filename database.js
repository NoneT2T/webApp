// ==================== БАЗА ДАННЫХ SQLITE3 ====================
const sqlite3 = require('sqlite3').verbose();
const { open } = require('sqlite');
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcrypt');
const config = require('./config');

class Database {
    constructor() {
        this.db = null;
        this.initPromise = this.init();
    }

    async init() {
        try {
            const dataDir = path.join(__dirname, 'data');
            if (!fs.existsSync(dataDir)) {
                fs.mkdirSync(dataDir, { recursive: true });
                console.log('📁 Папка data создана');
            }

            const dbPath = path.join(dataDir, 'database.sqlite');

            this.db = await open({
                filename: dbPath,
                driver: sqlite3.Database
            });

            await this.createTables();
            console.log('✅ База данных инициализирована');
        } catch (error) {
            console.error('❌ Ошибка инициализации БД:', error);
        }
    }

    async createTables() {
        // Таблица пользователей
        await this.db.exec(`
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id TEXT UNIQUE NOT NULL,
                username TEXT,
                first_name TEXT,
                last_name TEXT,
                avatar TEXT,
                balance INTEGER DEFAULT 0,
                diamonds INTEGER DEFAULT 0,
                total_taps INTEGER DEFAULT 0,
                rank_index INTEGER DEFAULT 0,
                energy INTEGER DEFAULT 100,
                max_energy INTEGER DEFAULT 100,
                free_boosters INTEGER DEFAULT 3,
                last_login INTEGER,
                created_at INTEGER DEFAULT (strftime('%s', 'now') * 1000),
                updated_at INTEGER DEFAULT (strftime('%s', 'now') * 1000),
                banned BOOLEAN DEFAULT 0,
                ban_reason TEXT,
                role TEXT DEFAULT 'user',
                invited_by TEXT
            )
        `);

        // Таблица бустеров
        await this.db.exec(`
            CREATE TABLE IF NOT EXISTS boosters (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id TEXT NOT NULL,
                type TEXT NOT NULL,
                level INTEGER DEFAULT 0,
                value INTEGER DEFAULT 0,
                UNIQUE(user_id, type)
            )
        `);

        // Таблица ежедневного бонуса
        await this.db.exec(`
            CREATE TABLE IF NOT EXISTS daily_bonus (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id TEXT NOT NULL,
                last_claim INTEGER,
                streak INTEGER DEFAULT 0,
                claimed_days TEXT,
                UNIQUE(user_id)
            )
        `);

        // Таблица Ice Pass
        await this.db.exec(`
            CREATE TABLE IF NOT EXISTS ice_pass (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id TEXT NOT NULL,
                level INTEGER DEFAULT 1,
                exp INTEGER DEFAULT 0,
                premium BOOLEAN DEFAULT 0,
                claimed_rewards TEXT,
                month INTEGER,
                year INTEGER,
                UNIQUE(user_id)
            )
        `);

        // Таблица колеса удачи
        await this.db.exec(`
            CREATE TABLE IF NOT EXISTS wheel (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id TEXT NOT NULL,
                spins_today INTEGER DEFAULT 0,
                last_spin INTEGER,
                tickets INTEGER DEFAULT 0,
                history TEXT,
                UNIQUE(user_id)
            )
        `);

        // Таблица достижений
        await this.db.exec(`
            CREATE TABLE IF NOT EXISTS achievements (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id TEXT NOT NULL,
                achievements TEXT,
                UNIQUE(user_id)
            )
        `);

        // Таблица заданий
        await this.db.exec(`
            CREATE TABLE IF NOT EXISTS quests (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id TEXT NOT NULL,
                daily_quests TEXT,
                last_reset INTEGER,
                UNIQUE(user_id)
            )
        `);

        // Таблица рефералов
        await this.db.exec(`
            CREATE TABLE IF NOT EXISTS referrals (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id TEXT NOT NULL,
                referral_code TEXT UNIQUE,
                invited_by TEXT,
                invited_friends TEXT,
                total_earned INTEGER DEFAULT 0,
                level1_count INTEGER DEFAULT 0,
                level2_count INTEGER DEFAULT 0,
                UNIQUE(user_id)
            )
        `);

        // Таблица покупок
        await this.db.exec(`
            CREATE TABLE IF NOT EXISTS purchases (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id TEXT NOT NULL,
                item_id TEXT NOT NULL,
                purchase_date INTEGER,
                expires_at INTEGER
            )
        `);

        // Таблица использованных промокодов
        await this.db.exec(`
            CREATE TABLE IF NOT EXISTS used_promocodes (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id TEXT NOT NULL,
                promo_code TEXT NOT NULL,
                used_at INTEGER,
                UNIQUE(user_id, promo_code)
            )
        `);

        // Таблица промокодов
        await this.db.exec(`
            CREATE TABLE IF NOT EXISTS promocodes (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                code TEXT UNIQUE NOT NULL,
                diamonds INTEGER DEFAULT 0,
                max_uses INTEGER DEFAULT 1,
                used_count INTEGER DEFAULT 0,
                created_at INTEGER,
                expires_at INTEGER
            )
        `);

        // Таблица VIP статусов
        await this.db.exec(`
            CREATE TABLE IF NOT EXISTS vip_status (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id TEXT NOT NULL,
                active BOOLEAN DEFAULT 0,
                expires_at INTEGER,
                UNIQUE(user_id)
            )
        `);

        // Таблица анти-чита
        await this.db.exec(`
            CREATE TABLE IF NOT EXISTS anti_cheat (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id TEXT NOT NULL,
                warnings INTEGER DEFAULT 0,
                blocked BOOLEAN DEFAULT 0,
                block_until INTEGER,
                last_tap_time INTEGER,
                tap_speed INTEGER DEFAULT 0,
                UNIQUE(user_id)
            )
        `);

        // Таблица администраторов
        await this.db.exec(`
            CREATE TABLE IF NOT EXISTS admins (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                username TEXT UNIQUE NOT NULL,
                password_hash TEXT NOT NULL,
                role TEXT DEFAULT 'admin',
                created_at INTEGER
            )
        `);

        // Таблица логов
        await this.db.exec(`
            CREATE TABLE IF NOT EXISTS logs (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id TEXT,
                action TEXT,
                details TEXT,
                ip TEXT,
                timestamp INTEGER
            )
        `);

        // Таблица скинов
        await this.db.exec(`
            CREATE TABLE IF NOT EXISTS skins (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id TEXT NOT NULL,
                purchased TEXT,
                active TEXT DEFAULT 'default',
                UNIQUE(user_id)
            )
        `);

        console.log('✅ Все таблицы созданы');

        // Создаем тестовые промокоды если их нет
        await this.createTestPromoCodes();

        // Создаем админа по умолчанию
        await this.createDefaultAdmin();
    }

    async createTestPromoCodes() {
        const count = await this.db.get('SELECT COUNT(*) as count FROM promocodes');
        if (count.count === 0) {
            const now = Date.now();
            const year = new Date().getFullYear();

            await this.db.run(
                'INSERT INTO promocodes (code, diamonds, max_uses, created_at) VALUES (?, ?, ?, ?)',
                [`WELCOME${year}`, 10000, 1000, now]
            );
            await this.db.run(
                'INSERT INTO promocodes (code, diamonds, max_uses, created_at) VALUES (?, ?, ?, ?)',
                [`ICE${year}`, 5000, 500, now]
            );
            await this.db.run(
                'INSERT INTO promocodes (code, diamonds, max_uses, created_at) VALUES (?, ?, ?, ?)',
                [`BONUS${year}`, 20000, 200, now]
            );
            await this.db.run(
                'INSERT INTO promocodes (code, diamonds, max_uses, created_at) VALUES (?, ?, ?, ?)',
                [`LUCKY${year}`, 50000, 50, now]
            );

            console.log('✅ Тестовые промокоды созданы');
        }
    }

    async createDefaultAdmin() {
        try {
            const adminExists = await this.db.get('SELECT * FROM admins LIMIT 1');
            if (!adminExists) {
                const hash = await bcrypt.hash(config.server.adminPassword, 10);
                await this.db.run(
                    'INSERT INTO admins (username, password_hash, role, created_at) VALUES (?, ?, ?, ?)',
                    ['admin', hash, 'superadmin', Date.now()]
                );
                console.log('✅ Админ по умолчанию создан (admin/admin123)');
            }
        } catch (error) {
            console.error('❌ Ошибка создания админа:', error);
        }
    }

    // ==================== ПОЛЬЗОВАТЕЛИ ====================
    async getUser(userId) {
        try {
            return await this.db.get('SELECT * FROM users WHERE user_id = ?', userId);
        } catch (error) {
            console.error('Ошибка getUser:', error);
            return null;
        }
    }

    async createUser(userData) {
        try {
            const { user_id, username, first_name, last_name, avatar } = userData;

            // Начинаем с 0 баланса
            await this.db.run(
                `INSERT INTO users (user_id, username, first_name, last_name, avatar, last_login, created_at, balance)
                 VALUES (?, ?, ?, ?, ?, ?, ?, 0)`,
                [user_id, username || '', first_name || 'Player', last_name || '', avatar || '', Date.now(), Date.now()]
            );

            // Создаем связанные записи
            await this.db.run(
                'INSERT INTO boosters (user_id, type, level, value) VALUES (?, ?, ?, ?), (?, ?, ?, ?)',
                [user_id, 'multitap', 0, 1, user_id, 'energy', 0, 100]
            );

            await this.db.run(
                'INSERT INTO daily_bonus (user_id, claimed_days) VALUES (?, ?)',
                [user_id, '[]']
            );

            await this.db.run(
                'INSERT INTO ice_pass (user_id, month, year, claimed_rewards) VALUES (?, ?, ?, ?)',
                [user_id, new Date().getMonth(), new Date().getFullYear(), '[]']
            );

            await this.db.run(
                'INSERT INTO wheel (user_id, history) VALUES (?, ?)',
                [user_id, '[]']
            );

            await this.db.run(
                'INSERT INTO achievements (user_id, achievements) VALUES (?, ?)',
                [user_id, '[]']
            );

            await this.db.run(
                'INSERT INTO quests (user_id, daily_quests, last_reset) VALUES (?, ?, ?)',
                [user_id, '[]', Date.now()]
            );

            const referralCode = this.generateReferralCode(user_id);
            await this.db.run(
                'INSERT INTO referrals (user_id, referral_code, invited_friends) VALUES (?, ?, ?)',
                [user_id, referralCode, '[]']
            );

            await this.db.run(
                'INSERT INTO anti_cheat (user_id) VALUES (?)',
                [user_id]
            );

            await this.db.run(
                'INSERT INTO skins (user_id, purchased, active) VALUES (?, ?, ?)',
                [user_id, '["default"]', 'default']
            );

            return await this.getUser(user_id);
        } catch (error) {
            console.error('Ошибка createUser:', error);
            return null;
        }
    }

    async updateUser(userId, data) {
        try {
            const fields = Object.keys(data).map(key => `${key} = ?`).join(', ');
            const values = [...Object.values(data), Date.now(), userId];

            await this.db.run(
                `UPDATE users SET ${fields}, updated_at = ? WHERE user_id = ?`,
                values
            );
            return true;
        } catch (error) {
            console.error('Ошибка updateUser:', error);
            return false;
        }
    }

    async getAllUsers(limit = 1000, offset = 0) {
        try {
            return await this.db.all(
                'SELECT * FROM users ORDER BY balance DESC LIMIT ? OFFSET ?',
                [limit, offset]
            );
        } catch (error) {
            console.error('Ошибка getAllUsers:', error);
            return [];
        }
    }

    // ==================== ТОП ИГРОКОВ ИЗ БД ====================
    async getTopUsers(category = 'balance', limit = 50) {
        try {
            let query = '';
            if (category === 'balance') {
                query = `SELECT user_id, username, first_name, avatar, balance as value 
                         FROM users WHERE balance > 0 ORDER BY balance DESC LIMIT ?`;
            } else if (category === 'taps') {
                query = `SELECT user_id, username, first_name, avatar, total_taps as value 
                         FROM users WHERE total_taps > 0 ORDER BY total_taps DESC LIMIT ?`;
            } else {
                query = `SELECT user_id, username, first_name, avatar, diamonds as value 
                         FROM users ORDER BY diamonds DESC LIMIT ?`;
            }

            return await this.db.all(query, [limit]);
        } catch (error) {
            console.error('Ошибка getTopUsers:', error);
            return [];
        }
    }

    // ==================== БУСТЕРЫ ====================
    async getBoosters(userId) {
        try {
            const boosters = await this.db.all(
                'SELECT * FROM boosters WHERE user_id = ?',
                userId
            );

            const result = { multitap: { level: 0, value: 1 }, energy: { level: 0, value: 100 } };
            boosters.forEach(b => {
                result[b.type] = {
                    level: b.level,
                    value: b.value
                };
            });

            return result;
        } catch (error) {
            console.error('Ошибка getBoosters:', error);
            return { multitap: { level: 0, value: 1 }, energy: { level: 0, value: 100 } };
        }
    }

    async updateBooster(userId, type, level, value) {
        try {
            await this.db.run(
                'UPDATE boosters SET level = ?, value = ? WHERE user_id = ? AND type = ?',
                [level, value, userId, type]
            );
            return true;
        } catch (error) {
            console.error('Ошибка updateBooster:', error);
            return false;
        }
    }

    // ==================== СКИНЫ ====================
    async getSkins(userId) {
        try {
            const skins = await this.db.get('SELECT * FROM skins WHERE user_id = ?', userId);
            if (!skins) {
                return { purchased: ['default'], active: 'default' };
            }
            return {
                purchased: JSON.parse(skins.purchased || '["default"]'),
                active: skins.active || 'default'
            };
        } catch (error) {
            console.error('Ошибка getSkins:', error);
            return { purchased: ['default'], active: 'default' };
        }
    }

    async updateSkins(userId, skins) {
        try {
            await this.db.run(
                'UPDATE skins SET purchased = ?, active = ? WHERE user_id = ?',
                [JSON.stringify(skins.purchased), skins.active, userId]
            );
            return true;
        } catch (error) {
            console.error('Ошибка updateSkins:', error);
            return false;
        }
    }

    // ==================== ЕЖЕДНЕВНЫЙ БОНУС ====================
    async getDailyBonus(userId) {
        try {
            return await this.db.get(
                'SELECT * FROM daily_bonus WHERE user_id = ?',
                userId
            );
        } catch (error) {
            console.error('Ошибка getDailyBonus:', error);
            return null;
        }
    }

    async updateDailyBonus(userId, data) {
        try {
            const { last_claim, streak, claimed_days } = data;
            await this.db.run(
                'UPDATE daily_bonus SET last_claim = ?, streak = ?, claimed_days = ? WHERE user_id = ?',
                [last_claim, streak, claimed_days, userId]
            );
            return true;
        } catch (error) {
            console.error('Ошибка updateDailyBonus:', error);
            return false;
        }
    }

    // ==================== ICE PASS ====================
    async getIcePass(userId) {
        try {
            return await this.db.get(
                'SELECT * FROM ice_pass WHERE user_id = ?',
                userId
            );
        } catch (error) {
            console.error('Ошибка getIcePass:', error);
            return null;
        }
    }

    async updateIcePass(userId, data) {
        try {
            const { level, exp, premium, claimed_rewards } = data;
            await this.db.run(
                'UPDATE ice_pass SET level = ?, exp = ?, premium = ?, claimed_rewards = ? WHERE user_id = ?',
                [level, exp, premium ? 1 : 0, claimed_rewards, userId]
            );
            return true;
        } catch (error) {
            console.error('Ошибка updateIcePass:', error);
            return false;
        }
    }

    // ==================== КОЛЕСО УДАЧИ ====================
    async getWheel(userId) {
        try {
            return await this.db.get(
                'SELECT * FROM wheel WHERE user_id = ?',
                userId
            );
        } catch (error) {
            console.error('Ошибка getWheel:', error);
            return null;
        }
    }

    async updateWheel(userId, data) {
        try {
            const { spins_today, last_spin, tickets, history } = data;
            await this.db.run(
                'UPDATE wheel SET spins_today = ?, last_spin = ?, tickets = ?, history = ? WHERE user_id = ?',
                [spins_today || 0, last_spin || 0, tickets || 0, history || '[]', userId]
            );
            return true;
        } catch (error) {
            console.error('Ошибка updateWheel:', error);
            return false;
        }
    }

    // ==================== ДОСТИЖЕНИЯ ====================
    async getAchievements(userId) {
        try {
            const result = await this.db.get(
                'SELECT achievements FROM achievements WHERE user_id = ?',
                userId
            );
            return result ? JSON.parse(result.achievements || '[]') : [];
        } catch (error) {
            console.error('Ошибка getAchievements:', error);
            return [];
        }
    }

    async addAchievement(userId, achievementId) {
        try {
            const achievements = await this.getAchievements(userId);
            if (!achievements.includes(achievementId)) {
                achievements.push(achievementId);
                await this.db.run(
                    'UPDATE achievements SET achievements = ? WHERE user_id = ?',
                    [JSON.stringify(achievements), userId]
                );
            }
            return true;
        } catch (error) {
            console.error('Ошибка addAchievement:', error);
            return false;
        }
    }

    // ==================== ЗАДАНИЯ ====================
    async getQuests(userId) {
        try {
            const result = await this.db.get(
                'SELECT * FROM quests WHERE user_id = ?',
                userId
            );
            return {
                quests: result ? JSON.parse(result.daily_quests || '[]') : [],
                lastReset: result?.last_reset || 0
            };
        } catch (error) {
            console.error('Ошибка getQuests:', error);
            return { quests: [], lastReset: 0 };
        }
    }

    async updateQuests(userId, dailyQuests, lastReset) {
        try {
            await this.db.run(
                'UPDATE quests SET daily_quests = ?, last_reset = ? WHERE user_id = ?',
                [JSON.stringify(dailyQuests), lastReset, userId]
            );
            return true;
        } catch (error) {
            console.error('Ошибка updateQuests:', error);
            return false;
        }
    }

    // ==================== РЕФЕРАЛЫ ====================
    generateReferralCode(userId) {
        return userId; // Используем ID как реферальный код
    }

    async getReferrals(userId) {
        try {
            return await this.db.get(
                'SELECT * FROM referrals WHERE user_id = ?',
                userId
            );
        } catch (error) {
            console.error('Ошибка getReferrals:', error);
            return null;
        }
    }

    async createReferral(userId, invitedByCode) {
        try {
            const referrer = await this.db.get(
                'SELECT user_id FROM referrals WHERE referral_code = ?',
                invitedByCode
            );

            if (referrer && referrer.user_id !== userId) {
                const referrerData = await this.getReferrals(referrer.user_id);
                const invitedFriends = JSON.parse(referrerData?.invited_friends || '[]');
                invitedFriends.push({
                    user_id: userId,
                    date: Date.now(),
                    level: 1
                });

                await this.db.run(
                    `UPDATE referrals 
                     SET invited_friends = ?, level1_count = level1_count + 1 
                     WHERE user_id = ?`,
                    [JSON.stringify(invitedFriends), referrer.user_id]
                );

                const user = await this.getUser(referrer.user_id);
                if (user) {
                    const newBalance = (user.balance || 0) + 5000;
                    await this.updateUser(referrer.user_id, { balance: newBalance });

                    await this.db.run(
                        'UPDATE referrals SET total_earned = total_earned + ? WHERE user_id = ?',
                        [5000, referrer.user_id]
                    );
                }

                await this.db.run(
                    'UPDATE users SET invited_by = ? WHERE user_id = ?',
                    [invitedByCode, userId]
                );

                return true;
            }
            return false;
        } catch (error) {
            console.error('Ошибка createReferral:', error);
            return false;
        }
    }

    // ==================== ПОКУПКИ ====================
    async addPurchase(userId, itemId, expiresAt = null) {
        try {
            await this.db.run(
                'INSERT INTO purchases (user_id, item_id, purchase_date, expires_at) VALUES (?, ?, ?, ?)',
                [userId, itemId, Date.now(), expiresAt]
            );
            return true;
        } catch (error) {
            console.error('Ошибка addPurchase:', error);
            return false;
        }
    }

    async getUserPurchases(userId) {
        try {
            return await this.db.all(
                'SELECT * FROM purchases WHERE user_id = ?',
                userId
            );
        } catch (error) {
            console.error('Ошибка getUserPurchases:', error);
            return [];
        }
    }

    // ==================== ПРОМОКОДЫ ====================
    async usePromoCode(userId, code) {
        try {
            const promo = await this.db.get(
                'SELECT * FROM promocodes WHERE code = ?',
                code
            );

            if (!promo) return { success: false, reason: 'not_found' };

            if (promo.used_count >= promo.max_uses) {
                return { success: false, reason: 'max_uses' };
            }

            if (promo.expires_at && promo.expires_at < Date.now()) {
                return { success: false, reason: 'expired' };
            }

            const used = await this.db.get(
                'SELECT * FROM used_promocodes WHERE user_id = ? AND promo_code = ?',
                [userId, code]
            );

            if (used) return { success: false, reason: 'already_used' };

            await this.db.run(
                'INSERT INTO used_promocodes (user_id, promo_code, used_at) VALUES (?, ?, ?)',
                [userId, code, Date.now()]
            );

            await this.db.run(
                'UPDATE promocodes SET used_count = used_count + 1 WHERE code = ?',
                code
            );

            const user = await this.getUser(userId);
            const newBalance = (user.balance || 0) + promo.diamonds;
            await this.updateUser(userId, { balance: newBalance });

            return { success: true, diamonds: promo.diamonds };
        } catch (error) {
            console.error('Ошибка usePromoCode:', error);
            return { success: false, reason: 'error' };
        }
    }

    // ==================== АНТИ-ЧИТ ====================
    async getAntiCheat(userId) {
        try {
            return await this.db.get(
                'SELECT * FROM anti_cheat WHERE user_id = ?',
                userId
            );
        } catch (error) {
            console.error('Ошибка getAntiCheat:', error);
            return null;
        }
    }

    async updateAntiCheat(userId, data) {
        try {
            const { warnings, blocked, block_until, last_tap_time, tap_speed } = data;
            await this.db.run(
                `UPDATE anti_cheat 
                 SET warnings = ?, blocked = ?, block_until = ?, last_tap_time = ?, tap_speed = ? 
                 WHERE user_id = ?`,
                [warnings || 0, blocked ? 1 : 0, block_until || 0, last_tap_time || 0, tap_speed || 0, userId]
            );
            return true;
        } catch (error) {
            console.error('Ошибка updateAntiCheat:', error);
            return false;
        }
    }

    // ==================== АДМИНЫ ====================
    async verifyAdmin(username, password) {
        try {
            const admin = await this.db.get(
                'SELECT * FROM admins WHERE username = ?',
                username
            );
            if (!admin) return false;

            return await bcrypt.compare(password, admin.password_hash);
        } catch (error) {
            console.error('Ошибка verifyAdmin:', error);
            return false;
        }
    }

    // ==================== ЛОГИ ====================
    async addLog(userId, action, details, ip) {
        try {
            await this.db.run(
                'INSERT INTO logs (user_id, action, details, ip, timestamp) VALUES (?, ?, ?, ?, ?)',
                [userId, action, details, ip || '', Date.now()]
            );
            return true;
        } catch (error) {
            console.error('Ошибка addLog:', error);
            return false;
        }
    }

    async getLogs(limit = 100) {
        try {
            return await this.db.all(
                'SELECT * FROM logs ORDER BY timestamp DESC LIMIT ?',
                [limit]
            );
        } catch (error) {
            console.error('Ошибка getLogs:', error);
            return [];
        }
    }

    // ==================== СТАТИСТИКА ====================
    async getStats() {
        try {
            const totalUsers = await this.db.get('SELECT COUNT(*) as count FROM users');
            const activeToday = await this.db.get(
                'SELECT COUNT(*) as count FROM users WHERE last_login > ?',
                [Date.now() - 24 * 60 * 60 * 1000]
            );
            const totalBalance = await this.db.get('SELECT SUM(balance) as total FROM users');
            const totalDiamonds = await this.db.get('SELECT SUM(diamonds) as total FROM users');
            const totalTaps = await this.db.get('SELECT SUM(total_taps) as total FROM users');

            return {
                totalUsers: totalUsers?.count || 0,
                activeToday: activeToday?.count || 0,
                totalIce: totalBalance?.total || 0,
                totalDiamonds: totalDiamonds?.total || 0,
                totalTaps: totalTaps?.total || 0
            };
        } catch (error) {
            console.error('Ошибка getStats:', error);
            return {
                totalUsers: 0,
                activeToday: 0,
                totalIce: 0,
                totalDiamonds: 0,
                totalTaps: 0
            };
        }
    }

    // ==================== ЗАГРУЗКА ВСЕХ ДАННЫХ ====================
    async loadGameState(userId) {
        try {
            const user = await this.getUser(userId);
            if (!user) return null;

            const boosters = await this.getBoosters(userId);
            const dailyBonus = await this.getDailyBonus(userId);
            const icePass = await this.getIcePass(userId);
            const wheel = await this.getWheel(userId);
            const achievements = await this.getAchievements(userId);
            const purchases = await this.getUserPurchases(userId);
            const vip = await this.db.get('SELECT * FROM vip_status WHERE user_id = ?', userId);
            const antiCheat = await this.getAntiCheat(userId);
            const referrals = await this.getReferrals(userId);
            const skins = await this.getSkins(userId);

            return {
                userName: user.first_name || 'Player',
                userId: user.user_id,
                userAvatar: user.avatar || '',
                balance: user.balance || 0,
                totalTaps: user.total_taps || 0,
                diamonds: user.diamonds || 0,
                rankIndex: user.rank_index || 0,
                boosters: {
                    multitap: {
                        level: boosters.multitap?.level || 0,
                        value: boosters.multitap?.value || 1,
                        price: 100 * Math.pow(2, boosters.multitap?.level || 0),
                        increase: 1,
                        nextValue: '+1'
                    },
                    energy: {
                        level: boosters.energy?.level || 0,
                        value: boosters.energy?.value || 100,
                        price: 100 * Math.pow(1.8, boosters.energy?.level || 0),
                        increase: 50,
                        nextValue: '+50'
                    }
                },
                energy: user.energy || 100,
                maxEnergy: user.max_energy || 100,
                freeBoosters: user.free_boosters || 3,
                maxFreeBoosters: 3,
                vibrationEnabled: true,
                friends: [],
                lastLogin: user.last_login || Date.now(),
                lastRewardClaim: dailyBonus?.last_claim || 0,
                usedPromoCodes: [],
                purchasedItems: purchases.map(p => p.item_id),
                vipStatus: {
                    active: vip?.active || false,
                    expiresAt: vip?.expires_at || 0
                },
                lastNotificationTime: 0,
                dailyBonus: {
                    lastClaim: dailyBonus?.last_claim || 0,
                    streak: dailyBonus?.streak || 0,
                    claimedDays: JSON.parse(dailyBonus?.claimed_days || '[]'),
                    availableToday: true
                },
                icePass: {
                    level: icePass?.level || 1,
                    exp: icePass?.exp || 0,
                    expToNext: 1000,
                    claimedRewards: JSON.parse(icePass?.claimed_rewards || '[]'),
                    premium: icePass?.premium || false,
                    month: icePass?.month || new Date().getMonth(),
                    year: icePass?.year || new Date().getFullYear(),
                    rewards: []
                },
                wheel: {
                    spinsToday: wheel?.spins_today || 0,
                    maxSpinsPerDay: 3,
                    lastSpinTime: wheel?.last_spin || 0,
                    tickets: wheel?.tickets || 0,
                    history: JSON.parse(wheel?.history || '[]')
                },
                achievements: achievements || [],
                achievementsProgress: {},
                dailyQuests: [],
                antiCheat: {
                    lastTapTime: antiCheat?.last_tap_time || 0,
                    tapCount: 0,
                    tapSpeed: antiCheat?.tap_speed || 0,
                    warnings: antiCheat?.warnings || 0,
                    blocked: antiCheat?.blocked || false,
                    blockUntil: antiCheat?.block_until || 0
                },
                referrals: {
                    code: referrals?.referral_code || '',
                    invitedBy: referrals?.invited_by || null,
                    invitedFriends: JSON.parse(referrals?.invited_friends || '[]'),
                    totalEarned: referrals?.total_earned || 0,
                    level1Count: referrals?.level1_count || 0,
                    level2Count: referrals?.level2_count || 0
                },
                skins: skins || { purchased: ['default'], active: 'default' }
            };
        } catch (error) {
            console.error('Ошибка loadGameState:', error);
            return null;
        }
    }

    // ==================== СОХРАНЕНИЕ ВСЕХ ДАННЫХ ====================
    async saveGameState(userId, gameState) {
        try {
            const user = await this.getUser(userId);

            if (!user) {
                await this.createUser({
                    user_id: userId,
                    username: gameState.userName,
                    first_name: gameState.userName,
                    avatar: gameState.userAvatar
                });
            }

            await this.updateUser(userId, {
                balance: gameState.balance || 0,
                diamonds: gameState.diamonds || 0,
                total_taps: gameState.totalTaps || 0,
                rank_index: gameState.rankIndex || 0,
                energy: gameState.energy || 100,
                max_energy: gameState.maxEnergy || 100,
                free_boosters: gameState.freeBoosters || 3,
                last_login: Date.now(),
                first_name: gameState.userName
            });

            if (gameState.boosters) {
                await this.updateBooster(userId, 'multitap',
                    gameState.boosters.multitap?.level || 0,
                    gameState.boosters.multitap?.value || 1
                );
                await this.updateBooster(userId, 'energy',
                    gameState.boosters.energy?.level || 0,
                    gameState.boosters.energy?.value || 100
                );
            }

            if (gameState.dailyBonus) {
                await this.updateDailyBonus(userId, {
                    last_claim: gameState.dailyBonus.lastClaim || 0,
                    streak: gameState.dailyBonus.streak || 0,
                    claimed_days: JSON.stringify(gameState.dailyBonus.claimedDays || [])
                });
            }

            if (gameState.icePass) {
                await this.updateIcePass(userId, {
                    level: gameState.icePass.level || 1,
                    exp: gameState.icePass.exp || 0,
                    premium: gameState.icePass.premium || false,
                    claimed_rewards: JSON.stringify(gameState.icePass.claimedRewards || [])
                });
            }

            if (gameState.wheel) {
                await this.updateWheel(userId, {
                    spins_today: gameState.wheel.spinsToday || 0,
                    last_spin: gameState.wheel.lastSpinTime || 0,
                    tickets: gameState.wheel.tickets || 0,
                    history: JSON.stringify(gameState.wheel.history || [])
                });
            }

            if (gameState.achievements?.length) {
                await this.db.run(
                    'UPDATE achievements SET achievements = ? WHERE user_id = ?',
                    [JSON.stringify(gameState.achievements), userId]
                );
            }

            if (gameState.vipStatus) {
                const vipExists = await this.db.get('SELECT * FROM vip_status WHERE user_id = ?', userId);
                if (vipExists) {
                    await this.db.run(
                        'UPDATE vip_status SET active = ?, expires_at = ? WHERE user_id = ?',
                        [gameState.vipStatus.active ? 1 : 0, gameState.vipStatus.expiresAt || 0, userId]
                    );
                } else {
                    await this.db.run(
                        'INSERT INTO vip_status (user_id, active, expires_at) VALUES (?, ?, ?)',
                        [userId, gameState.vipStatus.active ? 1 : 0, gameState.vipStatus.expiresAt || 0]
                    );
                }
            }

            if (gameState.antiCheat) {
                await this.updateAntiCheat(userId, gameState.antiCheat);
            }

            if (gameState.skins) {
                await this.updateSkins(userId, gameState.skins);
            }

            return true;
        } catch (error) {
            console.error('Ошибка saveGameState:', error);
            return false;
        }
    }

    // ==================== МЕТОДЫ ДЛЯ АДМИНКИ ====================

    async getPromoCodes() {
        try {
            return await this.db.all('SELECT * FROM promocodes ORDER BY created_at DESC');
        } catch (error) {
            console.error('Ошибка getPromoCodes:', error);
            return [];
        }
    }

    async getPromoCode(code) {
        try {
            return await this.db.get('SELECT * FROM promocodes WHERE code = ?', code);
        } catch (error) {
            console.error('Ошибка getPromoCode:', error);
            return null;
        }
    }

    async createPromoCode(code, diamonds, maxUses, expiresAt = null) {
        try {
            await this.db.run(
                'INSERT INTO promocodes (code, diamonds, max_uses, created_at, expires_at) VALUES (?, ?, ?, ?, ?)',
                [code, diamonds, maxUses, Date.now(), expiresAt]
            );
            return true;
        } catch (error) {
            console.error('Ошибка createPromoCode:', error);
            return false;
        }
    }

    async updatePromoCode(code, data) {
        try {
            const { diamonds, max_uses, expires_at } = data;
            await this.db.run(
                'UPDATE promocodes SET diamonds = ?, max_uses = ?, expires_at = ? WHERE code = ?',
                [diamonds, max_uses, expires_at, code]
            );
            return true;
        } catch (error) {
            console.error('Ошибка updatePromoCode:', error);
            return false;
        }
    }

    async deletePromoCode(code) {
        try {
            await this.db.run('DELETE FROM promocodes WHERE code = ?', code);
            return true;
        } catch (error) {
            console.error('Ошибка deletePromoCode:', error);
            return false;
        }
    }

    async getUserByReferralCode(code) {
        try {
            return await this.db.get(
                'SELECT user_id FROM referrals WHERE referral_code = ?',
                code
            );
        } catch (error) {
            console.error('Ошибка getUserByReferralCode:', error);
            return null;
        }
    }

    async getReferralStats(userId) {
        try {
            const referrals = await this.db.all(
                'SELECT * FROM referrals WHERE invited_by = ?',
                userId
            );

            let stats = {
                total: 0,
                active: 0,
                earnings: 0
            };

            for (const ref of referrals) {
                stats.total++;
                const user = await this.getUser(ref.user_id);
                if (user && user.last_login > Date.now() - 7 * 24 * 60 * 60 * 1000) {
                    stats.active++;
                }
            }

            const earnings = await this.db.get(
                'SELECT SUM(total_earned) as total FROM referrals WHERE invited_by = ?',
                userId
            );
            stats.earnings = earnings?.total || 0;

            return stats;
        } catch (error) {
            console.error('Ошибка getReferralStats:', error);
            return { total: 0, active: 0, earnings: 0 };
        }
    }

    async clearExpiredBans() {
        try {
            const now = Date.now();
            await this.db.run(
                'UPDATE anti_cheat SET blocked = 0, block_until = NULL WHERE block_until < ?',
                [now]
            );
            return true;
        } catch (error) {
            console.error('Ошибка clearExpiredBans:', error);
            return false;
        }
    }

    async resetDailyLimits() {
        try {
            await this.db.run(
                'UPDATE users SET free_boosters = ?',
                [3]
            );

            await this.db.run('UPDATE wheel SET spins_today = 0');

            return true;
        } catch (error) {
            console.error('Ошибка resetDailyLimits:', error);
            return false;
        }
    }

    async getActiveUsers(days = 1) {
        try {
            const since = Date.now() - days * 24 * 60 * 60 * 1000;
            const result = await this.db.get(
                'SELECT COUNT(*) as count FROM users WHERE last_login > ?',
                [since]
            );
            return result?.count || 0;
        } catch (error) {
            console.error('Ошибка getActiveUsers:', error);
            return 0;
        }
    }

    async getTotalEarnings() {
        try {
            const balance = await this.db.get('SELECT SUM(balance) as total FROM users');
            const referrals = await this.db.get('SELECT SUM(total_earned) as total FROM referrals');

            return {
                balance: balance?.total || 0,
                referrals: referrals?.total || 0
            };
        } catch (error) {
            console.error('Ошибка getTotalEarnings:', error);
            return { balance: 0, referrals: 0 };
        }
    }

    async getLeaderboardPosition(userId, category = 'balance') {
        try {
            const field = category === 'balance' ? 'balance' :
                         category === 'taps' ? 'total_taps' : 'diamonds';

            const result = await this.db.get(`
                SELECT COUNT(*) + 1 as position
                FROM users
                WHERE ${field} > (SELECT ${field} FROM users WHERE user_id = ?)
            `, userId);

            return result?.position || 0;
        } catch (error) {
            console.error('Ошибка getLeaderboardPosition:', error);
            return 0;
        }
    }
}

// Создаем и экспортируем экземпляр
const database = new Database();
module.exports = database;