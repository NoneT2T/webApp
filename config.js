// ==================== КОНФИГУРАЦИЯ ДЛЯ RAILWAY ====================
require('dotenv').config();

const config = {
    // ==================== НАСТРОЙКИ СЕРВЕРА ====================
    server: {
        port: process.env.PORT || 3000,
        environment: process.env.NODE_ENV || 'development',
        sessionSecret: process.env.SESSION_SECRET || 'ice-mine-super-secret-key-2026',
        adminPassword: process.env.ADMIN_PASSWORD || 'admin123',
        publicUrl: process.env.PUBLIC_URL || 'http://localhost:3000',
    },

    // ==================== НАСТРОЙКИ БОТА ====================
    bot: {
        token: process.env.BOT_TOKEN || '',
        webappUrl: process.env.PUBLIC_URL || 'http://localhost:3000',
        botUsername: process.env.BOT_USERNAME || 'icemine_bot',
    },

    // ==================== НАСТРОЙКИ БАЗЫ ДАННЫХ ====================
    database: {
        path: process.env.DATABASE_URL || './data/database.sqlite',
    },

    // ==================== НАСТРОЙКИ ИГРЫ ====================
    game: {
        ranks: [
            { name: 'bronza', icon: '🥉', requirement: 0 },
            { name: 'silver', icon: '🥈', requirement: 500 },
            { name: 'gold', icon: '🥇', requirement: 2500 },
            { name: 'almaz', icon: '💎', requirement: 10000 },
            { name: 'platina', icon: '🏆', requirement: 50000 },
            { name: 'rubin', icon: '🔴', requirement: 150000 },
            { name: 'legend', icon: '🌟', requirement: 500000 },
            { name: 'master', icon: '⚡', requirement: 1500000 },
            { name: 'ultima', icon: '🔥', requirement: 5000000 },
            { name: 'god', icon: '👑', requirement: 15000000 }
        ],

        boosters: {
            multitap: {
                basePrice: 100,
                priceMultiplier: 2,
                baseValue: 1,
                valueIncrease: 1,
                increaseMultiplier: 1.5
            },
            energy: {
                basePrice: 100,
                priceMultiplier: 1.8,
                baseValue: 100,
                valueIncrease: 50
            }
        },

        energy: {
            maxEnergy: 100,
            energyRegenPerSecond: 1,
            freeBoostersPerDay: 3
        },

        passiveIncome: {
            enabled: true,
            updateInterval: 1000,
            vipMultiplier: 1.2,
            doubleProfitMultiplier: 2
        }
    },

    // ==================== НАСТРОЙКИ ЭКОНОМИКИ ====================
    economy: {
        startingBalance: 0,

        dailyBonus: {
            baseReward: 100,
            streakBonus: 10,
            specialDays: {
                3: 50,
                5: 150,
                7: 400
            }
        },

        referrals: {
            baseReward: 5000,
            level2Reward: 1000,
            maxReferralsPerUser: 100
        },

        promoCodes: {
            'WELCOME2026': { diamonds: 10000, maxUses: 1000 },
            'ICE2026': { diamonds: 5000, maxUses: 500 },
            'BONUS2026': { diamonds: 20000, maxUses: 200 },
            'LUCKY2026': { diamonds: 50000, maxUses: 50 }
        }
    },

    // ==================== НАСТРОЙКИ КОЛЕСА УДАЧИ ====================
    wheel: {
        maxSpinsPerDay: 3,
        spinDuration: 3000,
        segments: [
            { color: '#FF6B6B', prize: 'balance', amount: 1000, icon: '❄️' },
            { color: '#4ECDC4', prize: 'balance', amount: 500, icon: '❄️' },
            { color: '#45B7D1', prize: 'balance', amount: 2000, icon: '❄️' },
            { color: '#96CEB4', prize: 'balance', amount: 5000, icon: '❄️' },
            { color: '#FFEEAD', prize: 'balance', amount: 10000, icon: '❄️' },
            { color: '#D4A5A5', prize: 'balance', amount: 500, icon: '❄️' },
            { color: '#9B59B6', prize: 'balance', amount: 20000, icon: '❄️' },
            { color: '#3498DB', prize: 'multitap', amount: 1, icon: '👆' }
        ]
    },

    // ==================== НАСТРОЙКИ АНТИ-ЧИТА ====================
    antiCheat: {
        enabled: true,
        maxTapsPerSecond: 20,
        maxConsecutiveFastTaps: 10,
        warningsBeforeBan: 3,
        banDuration: 5 * 60 * 1000,
        resetTime: 10000
    },

    // ==================== НАСТРОЙКИ АДМИН-ПАНЕЛИ ====================
    admin: {
        enabled: true,
        path: '/admin',
        statsUpdateInterval: 5000
    }
};

// ==================== ДОСТИЖЕНИЯ ====================
config.achievements = {
    'first_tap': { name: 'Первый шаг', desc: 'Сделайте первый тап', reward: 1000, icon: '👆' },
    'tap_1000': { name: 'Опытный тапер', desc: 'Сделайте 1000 тапов', reward: 5000, icon: '👆' },
    'tap_100000': { name: 'Легенда тапа', desc: 'Сделайте 100,000 тапов', reward: 50000, icon: '👑' },
    'balance_1000': { name: 'Богач', desc: 'Накопите 1000 льда', reward: 2000, icon: '💰' },
    'balance_1m': { name: 'Миллионер', desc: 'Накопите 1,000,000 льда', reward: 100000, icon: '💎' },
    'friend_1': { name: 'Общительный', desc: 'Пригласите первого друга', reward: 5000, icon: '👥' },
    'friend_5': { name: 'Популярный', desc: 'Пригласите 5 друзей', reward: 15000, icon: '👥' },
    'friend_10': { name: 'Звезда', desc: 'Пригласите 10 друзей', reward: 50000, icon: '⭐' },
    'rank_5': { name: 'Серебро', desc: 'Достигните 5-го ранга', reward: 20000, icon: '🥈' },
    'rank_10': { name: 'Бог игры', desc: 'Достигните максимального ранга', reward: 200000, icon: '👑' },
    'multitap_10': { name: 'Мульти-мастер', desc: 'Улучшите мультитап до 10 уровня', reward: 40000, icon: '👆' },
    'energy_10': { name: 'Энерджайзер', desc: 'Улучшите энергию до 10 уровня', reward: 40000, icon: '⚡' },
    'wheel_10': { name: 'Везунчик', desc: 'Крутите колесо удачи 10 раз', reward: 30000, icon: '🎡' },
    'daily_7': { name: 'Постоянный', desc: 'Получите ежедневный бонус 7 дней подряд', reward: 25000, icon: '📅' },
    'skins_all': { name: 'Коллекционер', desc: 'Соберите все скины', reward: 100000, icon: '🎨' }
};

// ==================== ЕЖЕДНЕВНЫЕ ЗАДАНИЯ ====================
config.dailyQuests = [
    { id: 'tap_100', name: 'Сделайте 100 тапов', reward: 500, icon: '👆', target: 100, type: 'taps' },
    { id: 'earn_5000', name: 'Заработайте 5000 льда', reward: 1000, icon: '💰', target: 5000, type: 'earn' },
    { id: 'use_boost', name: 'Используйте бесплатный бустер', reward: 300, icon: '⚡', target: 1, type: 'boost' },
    { id: 'upgrade_booster', name: 'Улучшите любой бустер', reward: 600, icon: '⬆️', target: 1, type: 'upgrade' },
    { id: 'spin_wheel', name: 'Крутаните колесо удачи', reward: 400, icon: '🎡', target: 1, type: 'wheel' },
    { id: 'invite_friend', name: 'Пригласите друга', reward: 2000, icon: '👥', target: 1, type: 'invite' },
    { id: 'claim_bonus', name: 'Заберите ежедневный бонус', reward: 300, icon: '📅', target: 1, type: 'daily' }
];

module.exports = config;