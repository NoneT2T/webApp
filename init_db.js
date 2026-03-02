// ==================== ИНИЦИАЛИЗАЦИЯ БАЗЫ ДАННЫХ ====================
const db = require('./database');
const config = require('./config');

async function initDatabase() {
    console.log('🚀 Инициализация базы данных...');
    console.log('📊 Конфигурация:');
    console.log(`   🖥️  Окружение: ${config.server.environment}`);
    console.log(`   📁 Путь к БД: ${config.database.path}`);

    try {
        // Ждем инициализации БД
        await db.initPromise;

        console.log('✅ База данных готова!');
        console.log('📊 Статистика:');

        const stats = await db.getStats();
        console.log(`   👥 Пользователей: ${stats.totalUsers}`);
        console.log(`   💰 Всего льда: ${stats.totalIce}`);
        console.log(`   👆 Всего тапов: ${stats.totalTaps}`);
        console.log(`   💎 Всего алмазов: ${stats.totalDiamonds}`);

        // Получаем информацию о промокодах
        const promocodes = await db.getPromoCodes();
        console.log(`   🎫 Промокодов: ${promocodes.length}`);

        // Сбрасываем ежедневные лимиты
        console.log('🔄 Сброс ежедневных лимитов...');
        await db.resetDailyLimits();

        // Очищаем истекшие баны
        console.log('🧹 Очистка истекших банов...');
        await db.clearExpiredBans();

        console.log('\n✅ Инициализация завершена успешно!');
        process.exit(0);

    } catch (error) {
        console.error('❌ Ошибка инициализации:', error);
        process.exit(1);
    }
}

initDatabase();