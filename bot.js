// ==================== TELEGRAM BOT ДЛЯ RAILWAY ====================
const TelegramBot = require('node-telegram-bot-api');
const config = require('./config');
const db = require('./database');

class IceMineBot {
    constructor(app) {
        this.token = config.bot.token;
        this.webhookUrl = `${config.server.publicUrl}/webhook/${this.token}`;
        this.botUsername = config.bot.botUsername;

        if (!this.token) {
            console.error('❌ BOT_TOKEN не указан в конфигурации');
            return;
        }

        // Создаем экземпляр бота
        this.bot = new TelegramBot(this.token);

        // Настраиваем вебхук
        this.setupWebhook(app);

        // Настраиваем обработчики команд
        this.setupHandlers();

        console.log('🤖 Ice Mine Bot инициализирован');
    }

    async setupWebhook(app) {
        try {
            // Удаляем предыдущий вебхук
            await this.bot.deleteWebHook();

            // Устанавливаем новый вебхук
            await this.bot.setWebHook(this.webhookUrl, {
                max_connections: 40,
                allowed_updates: ['message', 'callback_query']
            });

            // Добавляем маршрут для вебхука в Express
            app.post(`/webhook/${this.token}`, express.json(), (req, res) => {
                this.bot.processUpdate(req.body);
                res.sendStatus(200);
            });

            // Добавляем маршрут для проверки статуса
            app.get('/webhook/info', async (req, res) => {
                const info = await this.bot.getWebHookInfo();
                res.json(info);
            });

            const webhookInfo = await this.bot.getWebHookInfo();
            console.log(`✅ Вебхук установлен: ${webhookInfo.url}`);
            console.log(`🤖 Bot username: @${this.botUsername}`);
        } catch (error) {
            console.error('❌ Ошибка установки вебхука:', error);
        }
    }

    setupHandlers() {
        // Команда /start
        this.bot.onText(/\/start(?:\s+(.+))?/, async (msg, match) => {
            const chatId = msg.chat.id;
            const userId = msg.from.id.toString();
            const referrerCode = match[1]; // Реферальный код из ссылки

            try {
                // Проверяем, существует ли пользователь
                let user = await db.getUser(userId);

                if (!user) {
                    // Создаем нового пользователя
                    await db.createUser({
                        user_id: userId,
                        username: msg.from.username || '',
                        first_name: msg.from.first_name || 'Player',
                        last_name: msg.from.last_name || '',
                        avatar: msg.from.photo_url || ''
                    });

                    // Если есть реферальный код и он не свой
                    if (referrerCode && referrerCode !== userId) {
                        await this.processReferral(userId, referrerCode);
                    }
                }

                // Отправляем приветствие
                await this.sendWelcomeMessage(chatId, userId, referrerCode);

            } catch (error) {
                console.error('Ошибка в /start:', error);
                await this.bot.sendMessage(chatId, '❌ Произошла ошибка. Попробуйте позже.');
            }
        });

        // Команда /help
        this.bot.onText(/\/help/, async (msg) => {
            const chatId = msg.chat.id;
            await this.sendHelpMessage(chatId);
        });

        // Команда /profile
        this.bot.onText(/\/profile/, async (msg) => {
            const chatId = msg.chat.id;
            const userId = msg.from.id.toString();

            try {
                const user = await db.getUser(userId);
                const stats = await db.getReferralStats(userId);
                const position = await db.getLeaderboardPosition(userId);

                const message = this.formatProfileMessage(user, stats, position);
                await this.bot.sendMessage(chatId, message, {
                    parse_mode: 'HTML',
                    reply_markup: {
                        inline_keyboard: [
                            [{ text: '🎮 Открыть игру', web_app: { url: config.bot.webappUrl } }],
                            [{ text: '🏆 Топ игроков', callback_data: 'top' }],
                            [{ text: '🔗 Реферальная ссылка', callback_data: 'referral' }]
                        ]
                    }
                });

            } catch (error) {
                console.error('Ошибка в /profile:', error);
            }
        });

        // Команда /top
        this.bot.onText(/\/top/, async (msg) => {
            const chatId = msg.chat.id;
            await this.sendTopPlayers(chatId);
        });

        // Команда /referral
        this.bot.onText(/\/referral/, async (msg) => {
            const chatId = msg.chat.id;
            const userId = msg.from.id.toString();
            await this.sendReferralInfo(chatId, userId);
        });

        // Команда /stats
        this.bot.onText(/\/stats/, async (msg) => {
            const chatId = msg.chat.id;

            try {
                const stats = await db.getStats();
                const activeToday = await db.getActiveUsers(1);
                const earnings = await db.getTotalEarnings();

                const message = `📊 <b>Статистика Ice Mine</b>\n\n` +
                    `👥 Всего игроков: <b>${stats.totalUsers}</b>\n` +
                    `📅 Активных сегодня: <b>${activeToday}</b>\n` +
                    `💰 Всего льда: <b>${this.formatNumber(stats.totalIce)}</b>\n` +
                    `👆 Всего тапов: <b>${this.formatNumber(stats.totalTaps)}</b>\n` +
                    `🔗 Выплачено рефералам: <b>${this.formatNumber(earnings.referrals)}</b>`;

                await this.bot.sendMessage(chatId, message, { parse_mode: 'HTML' });

            } catch (error) {
                console.error('Ошибка в /stats:', error);
            }
        });

        // Обработка callback-запросов
        this.bot.on('callback_query', async (query) => {
            const chatId = query.message.chat.id;
            const userId = query.from.id.toString();
            const data = query.data;

            try {
                switch(data) {
                    case 'top':
                        await this.sendTopPlayers(chatId);
                        break;
                    case 'referral':
                        await this.sendReferralInfo(chatId, userId);
                        break;
                    case 'refresh_top':
                        await this.sendTopPlayers(chatId, true);
                        break;
                    case 'play':
                        await this.bot.sendMessage(chatId, '🎮 Запускаю игру...', {
                            reply_markup: {
                                inline_keyboard: [[
                                    { text: '🚀 Открыть Ice Mine', web_app: { url: config.bot.webappUrl } }
                                ]]
                            }
                        });
                        break;
                }

                await this.bot.answerCallbackQuery(query.id);

            } catch (error) {
                console.error('Ошибка в callback_query:', error);
                await this.bot.answerCallbackQuery(query.id, {
                    text: '❌ Произошла ошибка',
                    show_alert: true
                });
            }
        });

        // Обработка ошибок
        this.bot.on('polling_error', (error) => {
            console.error('Polling error:', error);
        });

        this.bot.on('webhook_error', (error) => {
            console.error('Webhook error:', error);
        });
    }

    async sendWelcomeMessage(chatId, userId, referrerCode = null) {
        const userName = (await db.getUser(userId))?.first_name || 'Игрок';

        let message = `❄️ <b>Добро пожаловать в Ice Mine, ${userName}!</b>\n\n` +
            `💰 Тапай по ледяному кубу и зарабатывай лёд!\n` +
            `⚡ Улучшай бустеры, повышай ранг и становись лучшим!\n\n` +
            `🎮 <b>Нажми кнопку ниже, чтобы начать играть!</b>`;

        if (referrerCode && referrerCode !== userId) {
            message += `\n\n🎁 Вы пришли по приглашению! Бонус уже начислен!`;
        }

        const keyboard = {
            inline_keyboard: [
                [{ text: '❄️ ИГРАТЬ В ICE MINE ❄️', web_app: { url: config.bot.webappUrl } }],
                [
                    { text: '👤 Профиль', callback_data: 'profile' },
                    { text: '🏆 Топ', callback_data: 'top' }
                ],
                [{ text: '🔗 Пригласить друга', callback_data: 'referral' }]
            ]
        };

        await this.bot.sendMessage(chatId, message, {
            parse_mode: 'HTML',
            reply_markup: keyboard
        });
    }

    async sendHelpMessage(chatId) {
        const message = `❄️ <b>Ice Mine - Помощь</b>\n\n` +
            `<b>Доступные команды:</b>\n` +
            `/start - Запустить бота\n` +
            `/profile - Ваш профиль\n` +
            `/top - Топ игроков\n` +
            `/referral - Реферальная система\n` +
            `/stats - Статистика игры\n` +
            `/help - Это сообщение\n\n` +
            `<b>Как играть:</b>\n` +
            `1️⃣ Нажми "ИГРАТЬ В ICE MINE"\n` +
            `2️⃣ Тапай по кубу, чтобы зарабатывать лёд\n` +
            `3️⃣ Покупай бустеры для увеличения дохода\n` +
            `4️⃣ Повышай ранг и получай награды\n` +
            `5️⃣ Приглашай друзей и получай бонусы\n\n` +
            `🎮 <b>Удачи в игре!</b>`;

        await this.bot.sendMessage(chatId, message, {
            parse_mode: 'HTML',
            reply_markup: {
                inline_keyboard: [[
                    { text: '❄️ Играть', web_app: { url: config.bot.webappUrl } }
                ]]
            }
        });
    }

    formatProfileMessage(user, stats, position) {
        const rankIcons = ['🥉', '🥈', '🥇', '💎', '🏆', '🔴', '🌟', '⚡', '🔥', '👑'];
        const rankNames = ['Бронза', 'Серебро', 'Золото', 'Алмаз', 'Платина', 'Рубин', 'Легенда', 'Мастер', 'Ультима', 'Бог'];

        const rankIndex = user?.rank_index || 0;
        const rankIcon = rankIcons[rankIndex] || '🥉';
        const rankName = rankNames[rankIndex] || 'Бронза';

        return `❄️ <b>Ваш профиль в Ice Mine</b>\n\n` +
            `👤 Имя: <b>${user?.first_name || 'Player'}</b>\n` +
            `🆔 ID: <code>${user?.user_id}</code>\n\n` +
            `💰 Баланс: <b>${this.formatNumber(user?.balance || 0)}</b> ❄️\n` +
            `👆 Тапов: <b>${this.formatNumber(user?.total_taps || 0)}</b>\n` +
            `${rankIcon} Ранг: <b>${rankName}</b> (${rankIndex + 1}/10)\n` +
            `🏆 Место в топе: <b>${position}</b>\n\n` +
            `🔗 Приглашено друзей: <b>${stats.total}</b>\n` +
            `💰 Заработано с рефералов: <b>${this.formatNumber(stats.earnings)}</b> ❄️\n` +
            `👥 Активных друзей: <b>${stats.active}</b>`;
    }

    async sendTopPlayers(chatId, edit = false) {
        try {
            const topPlayers = await db.getTopUsers('balance', 10);

            let message = `🏆 <b>Топ 10 игроков Ice Mine</b>\n\n`;

            if (topPlayers.length === 0) {
                message += `Пока нет игроков в топе. Будь первым!`;
            } else {
                topPlayers.forEach((player, index) => {
                    const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `${index + 1}.`;
                    const name = player.first_name || player.username || 'Player';
                    const balance = this.formatNumber(player.value);

                    message += `${medal} <b>${name}</b> — ${balance} ❄️\n`;
                });
            }

            const keyboard = {
                inline_keyboard: [
                    [{ text: '🔄 Обновить', callback_data: 'refresh_top' }],
                    [{ text: '🎮 Играть', web_app: { url: config.bot.webappUrl } }]
                ]
            };

            if (edit) {
                await this.bot.editMessageText(message, {
                    chat_id: chatId,
                    message_id: (await this.bot.sendMessage(chatId, '🔄 Обновляем...')).message_id,
                    parse_mode: 'HTML',
                    reply_markup: keyboard
                });
            } else {
                await this.bot.sendMessage(chatId, message, {
                    parse_mode: 'HTML',
                    reply_markup: keyboard
                });
            }

        } catch (error) {
            console.error('Ошибка в sendTopPlayers:', error);
        }
    }

    async sendReferralInfo(chatId, userId) {
        try {
            const user = await db.getUser(userId);
            const referrals = await db.getReferrals(userId);
            const stats = await db.getReferralStats(userId);
            const referralCode = userId; // Используем ID как реферальный код
            const referralLink = `https://t.me/${this.botUsername}?start=${referralCode}`;

            let invitedList = '';
            const invitedFriends = JSON.parse(referrals?.invited_friends || '[]');

            if (invitedFriends.length > 0) {
                invitedList = '\n\n<b>Приглашенные друзья:</b>\n';
                invitedFriends.slice(-5).reverse().forEach((friend, i) => {
                    const date = new Date(friend.date).toLocaleDateString();
                    invitedList += `${i + 1}. ID: ${friend.user_id} (${date})\n`;
                });
            }

            const message = `🔗 <b>Реферальная система Ice Mine</b>\n\n` +
                `💰 <b>Бонусы:</b>\n` +
                `• За друга: <b>+5,000</b> ❄️\n` +
                `• За друга друга: <b>+1,000</b> ❄️\n\n` +
                `<b>Ваша статистика:</b>\n` +
                `👥 Приглашено: <b>${stats.total}</b>\n` +
                `👤 Активных: <b>${stats.active}</b>\n` +
                `💰 Заработано: <b>${this.formatNumber(stats.earnings)}</b> ❄️\n\n` +
                `<b>Ваша реферальная ссылка:</b>\n` +
                `<code>${referralLink}</code>\n\n` +
                `📋 Нажми на ссылку, чтобы скопировать` +
                invitedList;

            const keyboard = {
                inline_keyboard: [
                    [{ text: '🎮 Играть', web_app: { url: config.bot.webappUrl } }]
                ]
            };

            await this.bot.sendMessage(chatId, message, {
                parse_mode: 'HTML',
                reply_markup: keyboard,
                disable_web_page_preview: true
            });

        } catch (error) {
            console.error('Ошибка в sendReferralInfo:', error);
        }
    }

    async processReferral(userId, referrerCode) {
        try {
            // Проверяем, существует ли реферер
            const referrer = await db.getUserByReferralCode(referrerCode);
            if (!referrer) return;

            // Начисляем бонус рефереру
            const baseReward = 5000;
            const referrerUser = await db.getUser(referrer.user_id);

            if (referrerUser) {
                await db.updateUser(referrer.user_id, {
                    balance: (referrerUser.balance || 0) + baseReward
                });

                // Обновляем статистику рефералов
                const referrerRef = await db.getReferrals(referrer.user_id);
                const invitedFriends = JSON.parse(referrerRef?.invited_friends || '[]');
                invitedFriends.push({
                    user_id: userId,
                    date: Date.now(),
                    level: 1
                });

                await db.db.run(
                    `UPDATE referrals 
                     SET invited_friends = ?, level1_count = level1_count + 1, total_earned = total_earned + ? 
                     WHERE user_id = ?`,
                    [JSON.stringify(invitedFriends), baseReward, referrer.user_id]
                );

                // Записываем, кто пригласил пользователя
                await db.db.run(
                    'UPDATE users SET invited_by = ? WHERE user_id = ?',
                    [referrerCode, userId]
                );

                // Логируем
                await db.addLog(userId, 'referral_activated',
                    `Активирован реферальный код ${referrerCode}`, '');

                // Начисляем бонус новому пользователю
                await db.updateUser(userId, {
                    balance: 5000
                });
            }

        } catch (error) {
            console.error('Ошибка в processReferral:', error);
        }
    }

    formatNumber(num) {
        num = Math.floor(num);
        if (num >= 1000000000) return (num / 1000000000).toFixed(2) + 'B';
        if (num >= 1000000) return (num / 1000000).toFixed(2) + 'M';
        if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
        return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ");
    }
}

// Экспортируем класс
module.exports = IceMineBot;

// Добавляем express в глобальную область для вебхука
const express = require('express');