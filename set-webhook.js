// ==================== УСТАНОВКА ВЕБХУКА ====================
const axios = require('axios');
const config = require('./config');

async function setWebhook() {
    const token = config.bot.token;
    const webhookUrl = `${config.server.publicUrl}/webhook/${token}`;

    if (!token) {
        console.error('❌ BOT_TOKEN не указан в конфигурации');
        process.exit(1);
    }

    console.log('🔄 Установка вебхука...');
    console.log(`🌍 Webhook URL: ${webhookUrl}`);

    try {
        // Проверяем текущий вебхук
        const infoResponse = await axios.get(`https://api.telegram.org/bot${token}/getWebhookInfo`);
        console.log('📊 Текущий вебхук:', infoResponse.data);

        // Устанавливаем новый вебхук
        const response = await axios.post(`https://api.telegram.org/bot${token}/setWebhook`, {
            url: webhookUrl,
            max_connections: 40,
            allowed_updates: ['message', 'callback_query']
        });

        if (response.data.ok) {
            console.log('✅ Вебхук успешно установлен!');
            console.log(`🤖 Bot username: @${config.bot.botUsername}`);

            // Проверяем информацию о вебхуке
            const checkResponse = await axios.get(`https://api.telegram.org/bot${token}/getWebhookInfo`);
            console.log('📋 Новая информация о вебхуке:', checkResponse.data);
        } else {
            console.error('❌ Ошибка установки вебхука:', response.data);
        }
    } catch (error) {
        console.error('❌ Ошибка:', error.response?.data || error.message);
    }
}

setWebhook();