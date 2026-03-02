// ==================== ИНИЦИАЛИЗАЦИЯ TELEGRAM ====================
const tg = window.Telegram.WebApp;
tg.expand();
tg.disableVerticalSwipes();
tg.enableClosingConfirmation();

// ==================== КОНСТАНТЫ ====================
const RANKS = [
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
];

// Обновленные скины - убраны снежинка и алмазный, добавлены новые цвета
const SKINS = [
    { id: 'default', name: 'Классический', icon: '🧊', price: 0, colors: ['#4facfe', '#00f2fe'] },
    { id: 'midnight', name: 'Полночный', icon: '🌙', price: 25000, colors: ['#2c3e50', '#3498db'] },
    { id: 'sunset', name: 'Закат', icon: '🌅', price: 50000, colors: ['#ff6b6b', '#feca57'] },
    { id: 'forest', name: 'Лесной', icon: '🌲', price: 75000, colors: ['#2ecc71', '#27ae60'] },
    { id: 'galaxy', name: 'Галактика', icon: '🌌', price: 100000, colors: ['#8e44ad', '#9b59b6'] },
    { id: 'sunrise', name: 'Рассвет', icon: '☀️', price: 150000, colors: ['#f1c40f', '#e67e22'] }
];

const AVATAR_PRESETS = {
    'default': 'data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 100 100\'%3E%3Crect fill=\'%234facfe\' width=\'100\' height=\'100\'/%3E%3Ctext x=\'50\' y=\'55\' text-anchor=\'middle\' fill=\'white\' font-size=\'40\'%3E👤%3C/text%3E%3C/svg%3E',
    'ice': 'data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 100 100\'%3E%3Crect fill=\'%23a8d8ff\' width=\'100\' height=\'100\'/%3E%3Ctext x=\'50\' y=\'55\' text-anchor=\'middle\' fill=\'white\' font-size=\'40\'%3E🧊%3C/text%3E%3C/svg%3E',
    'diamond': 'data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 100 100\'%3E%3Crect fill=\'%23667eea\' width=\'100\' height=\'100\'/%3E%3Ctext x=\'50\' y=\'55\' text-anchor=\'middle\' fill=\'white\' font-size=\'40\'%3E💎%3C/text%3E%3C/svg%3E',
    'crown': 'data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 100 100\'%3E%3Crect fill=\'%23ffd700\' width=\'100\' height=\'100\'/%3E%3Ctext x=\'50\' y=\'55\' text-anchor=\'middle\' fill=\'white\' font-size=\'40\'%3E👑%3C/text%3E%3C/svg%3E',
    'fire': 'data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 100 100\'%3E%3Crect fill=\'%23ff4757\' width=\'100\' height=\'100\'/%3E%3Ctext x=\'50\' y=\'55\' text-anchor=\'middle\' fill=\'white\' font-size=\'40\'%3E🔥%3C/text%3E%3C/svg%3E',
    'star': 'data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 100 100\'%3E%3Crect fill=\'%23ffa502\' width=\'100\' height=\'100\'/%3E%3Ctext x=\'50\' y=\'55\' text-anchor=\'middle\' fill=\'white\' font-size=\'40\'%3E⭐%3C/text%3E%3C/svg%3E'
};

// ==================== НАЧАЛЬНОЕ СОСТОЯНИЕ ====================
let gameState = {
    userName: 'Player',
    userId: '0',
    userAvatar: '',
    balance: 100000, // Для тестирования
    totalTaps: 0,
    rankIndex: 0,
    boosters: {
        multitap: { level: 0, value: 1, price: 100, increase: 1, nextValue: '+1' },
        energy: { level: 0, value: 100, price: 100, increase: 50, nextValue: '+50' }
    },
    energy: 100,
    maxEnergy: 100,
    freeBoosters: 3,
    maxFreeBoosters: 3,
    vibrationEnabled: true,
    friends: [],
    lastLogin: Date.now(),
    lastRewardClaim: 0,
    usedPromoCodes: [],
    skins: {
        purchased: ['default'],
        active: 'default'
    },
    lastNotificationTime: 0,
    dailyBonus: {
        lastClaim: 0,
        streak: 0,
        claimedDays: [],
        availableToday: true
    },
    wheel: {
        spinsToday: 0,
        maxSpinsPerDay: 3,
        lastSpinTime: 0,
        history: []
    },
    achievements: [],
    achievementsProgress: {},
    dailyQuests: [],
    antiCheat: {
        lastTapTime: 0,
        tapCount: 0,
        tapSpeed: 0,
        warnings: 0,
        blocked: false,
        blockUntil: 0
    },
    referrals: {
        code: '',
        invitedBy: null,
        invitedFriends: [],
        totalEarned: 0,
        level1Count: 0,
        level2Count: 0
    }
};

// ==================== ПОЛУЧЕНИЕ ДАННЫХ ИЗ TELEGRAM ====================
try {
    const user = tg.initDataUnsafe?.user;
    if (user) {
        gameState.userId = user.id.toString();
        gameState.userName = user.first_name || 'Player';
        if (user.photo_url) {
            gameState.userAvatar = user.photo_url;
        }
    }
} catch (e) {
    console.log('Telegram data error:', e);
}

// ==================== ФУНКЦИИ ЗАГРУЗКИ/СОХРАНЕНИЯ ====================
async function loadUserData() {
    try {
        const saved = localStorage.getItem(`icegame_${gameState.userId}`);
        if (saved) {
            const loaded = JSON.parse(saved);
            const now = Date.now();
            const secondsOffline = (now - (loaded.lastLogin || now)) / 1000;

            // Сохраняем купленные скины и активный скин
            if (loaded.skins) {
                gameState.skins = loaded.skins;
                console.log('✅ Загружены скины:', gameState.skins);
            }

            if (secondsOffline > 60 && loaded.boosters?.multitap?.level > 0) {
                const perSecond = loaded.boosters.multitap.value / 3600;
                const offlineEarnings = Math.floor(perSecond * secondsOffline);
                loaded.balance = (loaded.balance || 0) + offlineEarnings;

                if (offlineEarnings > 0) {
                    setTimeout(() => showOfflineEarnings(offlineEarnings), 1000);
                }
            }

            gameState = { ...gameState, ...loaded };
            console.log('✅ Данные загружены из localStorage');
        }
    } catch (e) {
        console.log('Ошибка загрузки из localStorage:', e);
    }

    if (!gameState.referrals.code) {
        generateReferralCode();
    }

    if (!gameState.skins) {
        gameState.skins = { purchased: ['default'], active: 'default' };
    }

    initDailyQuests();
    updateUI();
    checkDailyBonusAvailability();
    updateWheelUI();
    applySkin();
}

async function saveUserData() {
    try {
        gameState.lastLogin = Date.now();

        // Убеждаемся, что скины сохраняются правильно
        const saveState = {
            ...gameState,
            skins: gameState.skins // Явно включаем skins в сохраняемый объект
        };

        localStorage.setItem(`icegame_${gameState.userId}`, JSON.stringify(saveState));
        console.log('✅ Данные сохранены, скины:', gameState.skins);
    } catch (e) {
        console.log('Ошибка сохранения:', e);
    }
}

// ==================== ФОРМАТИРОВАНИЕ ====================
function formatNumber(num, useShortFormat = false) {
    num = Math.floor(num);
    if (useShortFormat) {
        if (num >= 1000000000) return (num / 1000000000).toFixed(2) + 'B';
        if (num >= 1000000) return (num / 1000000).toFixed(2) + 'M';
        if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ");
}

// ==================== УВЕДОМЛЕНИЯ ====================
function showNotification(message, type = 'info') {
    const now = Date.now();
    if (now - gameState.lastNotificationTime < 1500) return;

    gameState.lastNotificationTime = now;

    const container = document.getElementById('notifications');
    if (!container) return;

    container.innerHTML = '';

    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    container.appendChild(notification);

    setTimeout(() => notification.remove(), 2000);
}

// ==================== СКИНЫ ====================
function applySkin() {
    const iceCube = document.querySelector('.ice-cube');
    if (!iceCube) return;

    // Удаляем все классы скинов
    SKINS.forEach(skin => {
        iceCube.classList.remove(`skin-${skin.id}`);
    });

    // Добавляем класс активного скина
    if (gameState.skins.active !== 'default') {
        iceCube.classList.add(`skin-${gameState.skins.active}`);
    }

    // Обновляем название активного скина
    const activeSkin = SKINS.find(s => s.id === gameState.skins.active);
    console.log('✅ Применен скин:', activeSkin?.name || 'Классический');
}

function openSkinsModal() {
    renderSkinsModal();
    document.getElementById('skinsModal').style.display = 'flex';
}

function closeSkinsModal() {
    document.getElementById('skinsModal').style.display = 'none';
}

function renderSkinsModal() {
    const container = document.getElementById('skinsList');
    if (!container) return;

    // Убеждаемся, что gameState.skins существует
    if (!gameState.skins) {
        gameState.skins = { purchased: ['default'], active: 'default' };
    }
    if (!gameState.skins.purchased) {
        gameState.skins.purchased = ['default'];
    }

    let html = '';
    SKINS.forEach(skin => {
        const isPurchased = gameState.skins.purchased.includes(skin.id);
        const isActive = gameState.skins.active === skin.id;

        html += `
            <div class="skin-card ${isActive ? 'active' : ''} ${isPurchased ? 'purchased' : ''}">
                <div class="skin-preview" style="background: linear-gradient(135deg, ${skin.colors[0]}, ${skin.colors[1]})">
                    <span class="skin-preview-icon">${skin.icon}</span>
                </div>
                <div class="skin-info">
                    <div class="skin-name">${skin.name}</div>
                    ${!isPurchased ? `<div class="skin-price">${formatNumber(skin.price)} ❄️</div>` : ''}
                </div>
                <div class="skin-action">
                    ${isActive ? '<span style="color:#4caf50; font-size:24px;">✓</span>' : 
                      isPurchased ? 
                        `<button class="skin-select-btn" onclick="selectSkin('${skin.id}')">Выбрать</button>` : 
                        `<button class="skin-buy-btn" onclick="buySkin('${skin.id}')">Купить</button>`}
                </div>
            </div>
        `;
    });

    container.innerHTML = html;
}

function buySkin(skinId) {
    const skin = SKINS.find(s => s.id === skinId);
    if (!skin) return;

    if (gameState.balance < skin.price) {
        showNotification('❌ Недостаточно льда!', 'warning');
        return;
    }

    gameState.balance -= skin.price;

    // Убеждаемся, что массивы существуют
    if (!gameState.skins) gameState.skins = { purchased: [], active: 'default' };
    if (!gameState.skins.purchased) gameState.skins.purchased = [];

    gameState.skins.purchased.push(skinId);

    showNotification(`✅ Скин "${skin.name}" куплен!`, 'success');
    saveUserData(); // Сохраняем сразу после покупки
    renderSkinsModal();
    updateUI();
    console.log('✅ Скин куплен, текущие скины:', gameState.skins);
}

function selectSkin(skinId) {
    if (!gameState.skins) {
        gameState.skins = { purchased: ['default'], active: 'default' };
    }

    gameState.skins.active = skinId;
    applySkin();
    showNotification(`✅ Скин "${SKINS.find(s => s.id === skinId).name}" выбран!`, 'success');
    saveUserData(); // Сохраняем сразу после выбора
    closeSkinsModal();
    updateUI();
    console.log('✅ Скин выбран, текущие скины:', gameState.skins);
}

// ==================== ОБНОВЛЕНИЕ ИНТЕРФЕЙСА ====================
function updateUI() {
    const balanceEl = document.getElementById('balance');
    if (balanceEl) balanceEl.textContent = formatNumber(gameState.balance, false);

    const energyEl = document.getElementById('energyDisplay');
    if (energyEl) {
        energyEl.innerHTML = `⚡ ${formatNumber(gameState.energy, false)}/${formatNumber(gameState.maxEnergy, false)}`;
    }

    const profitEl = document.getElementById('profitPerHour');
    if (profitEl) {
        const hourlyProfit = gameState.boosters.multitap.level > 0 ? gameState.boosters.multitap.value * 3600 : 0;
        profitEl.textContent = '+' + formatNumber(hourlyProfit, true) + '/ч';
    }

    // Имя пользователя
    const userNameEls = document.querySelectorAll('#settingsUserName, #settingsUserNameDisplay, #profileName, #settingsUserNameSmall');
    userNameEls.forEach(el => {
        if (el) el.textContent = gameState.userName;
    });

    // Аватарка
    const avatarEls = document.querySelectorAll('#userAvatar, #settingsAvatarBig, #profileAvatar');
    avatarEls.forEach(el => {
        if (el) el.src = gameState.userAvatar || AVATAR_PRESETS['default'];
    });

    // ID пользователя
    const userIdEls = document.querySelectorAll('#settingsUserId, #profileId, #settingsUserIdSmall');
    userIdEls.forEach(el => {
        if (el) {
            if (el.id === 'profileId') el.textContent = 'ID: ' + gameState.userId;
            else el.textContent = gameState.userId;
        }
    });

    // Ранг
    const rankNameEl = document.getElementById('rankName');
    const rankLevelEl = document.getElementById('rankLevel');
    const rankIconEl = document.getElementById('rankIcon');
    const profileRankEl = document.getElementById('profileRank');
    const settingsRankBadge = document.getElementById('settingsRankBadge');

    if (rankNameEl) rankNameEl.textContent = RANKS[gameState.rankIndex].name;
    if (rankLevelEl) rankLevelEl.textContent = `${gameState.rankIndex + 1} / ${RANKS.length}`;
    if (rankIconEl) rankIconEl.textContent = RANKS[gameState.rankIndex].icon;
    if (profileRankEl) profileRankEl.textContent = RANKS[gameState.rankIndex].name;
    if (settingsRankBadge) settingsRankBadge.textContent = `${RANKS[gameState.rankIndex].icon} ${RANKS[gameState.rankIndex].name}`;

    // Прогресс до следующего ранга
    const currentReq = RANKS[gameState.rankIndex].requirement;
    const nextReq = gameState.rankIndex < RANKS.length - 1 ?
        RANKS[gameState.rankIndex + 1].requirement : currentReq + 10000000;

    const tapsForNext = gameState.totalTaps - currentReq;
    const tapsNeeded = nextReq - currentReq;
    const progressPercent = tapsNeeded > 0 ? (tapsForNext / tapsNeeded) * 100 : 100;

    const nextRankEl = document.getElementById('nextRankRequirement');
    if (nextRankEl) {
        const remaining = Math.max(0, nextReq - gameState.totalTaps);
        nextRankEl.textContent = formatNumber(remaining, false) + ' тапов';
    }

    const progressBar = document.getElementById('progressBar');
    if (progressBar) progressBar.style.width = Math.min(progressPercent, 100) + '%';

    // Бустеры
    const multitapLevel = document.getElementById('multitapLevel');
    if (multitapLevel) {
        multitapLevel.textContent = formatNumber(gameState.boosters.multitap.value, false) + ' - ' +
            gameState.boosters.multitap.level + ' ур';
    }

    const multitapNext = document.getElementById('multitapNext');
    if (multitapNext) multitapNext.textContent = gameState.boosters.multitap.nextValue;

    const multitapPrice = document.getElementById('multitapPrice');
    if (multitapPrice) multitapPrice.textContent = formatNumber(gameState.boosters.multitap.price, false);

    const energyLevel = document.getElementById('energyLevel');
    if (energyLevel) {
        energyLevel.textContent = formatNumber(gameState.boosters.energy.value, false) + ' - ' +
            gameState.boosters.energy.level + ' ур';
    }

    const energyNext = document.getElementById('energyNext');
    if (energyNext) energyNext.textContent = gameState.boosters.energy.nextValue;

    const energyPrice = document.getElementById('energyPrice');
    if (energyPrice) energyPrice.textContent = formatNumber(gameState.boosters.energy.price, false);

    const freeBoosters = document.getElementById('freeBoostersCount');
    if (freeBoosters) {
        freeBoosters.textContent = gameState.freeBoosters + '/' + gameState.maxFreeBoosters + ' доступно';
    }

    // Шахта
    const currentIce = document.getElementById('currentIcePerHour');
    if (currentIce) {
        const hourlyIncome = gameState.boosters.multitap.level > 0 ? gameState.boosters.multitap.value * 3600 : 0;
        currentIce.textContent = formatNumber(hourlyIncome, true);
    }

    const upgradeCost = document.getElementById('upgradeCost');
    if (upgradeCost) upgradeCost.textContent = formatNumber(gameState.boosters.multitap.price, false);

    const upgradeIncrease = document.getElementById('upgradeIncrease');
    if (upgradeIncrease) {
        const hourlyIncrease = gameState.boosters.multitap.increase * 3600;
        upgradeIncrease.textContent = '+' + formatNumber(hourlyIncrease, true);
    }

    // Профиль статистика
    const profileBalanceEl = document.getElementById('profileBalance');
    const profileTapsEl = document.getElementById('profileTaps');
    const profileHourlyIncomeEl = document.getElementById('profileHourlyIncome');
    const profileLastRewardEl = document.getElementById('profileLastReward');
    const profileAchievementsCount = document.getElementById('profileAchievementsCount');
    const profileQuestsCount = document.getElementById('profileQuestsCount');

    if (profileBalanceEl) profileBalanceEl.textContent = formatNumber(gameState.balance, true);
    if (profileTapsEl) profileTapsEl.textContent = formatNumber(gameState.totalTaps, true);
    if (profileHourlyIncomeEl) {
        const hourlyIncome = gameState.boosters.multitap.level > 0 ? gameState.boosters.multitap.value * 3600 : 0;
        profileHourlyIncomeEl.textContent = formatNumber(hourlyIncome, true);
    }
    if (profileAchievementsCount) {
        profileAchievementsCount.textContent = (gameState.achievements?.length || 0) + '/' + Object.keys(ACHIEVEMENTS_LIST).length;
    }
    if (profileQuestsCount) {
        const completedQuests = gameState.dailyQuests?.filter(q => q.completed)?.length || 0;
        profileQuestsCount.textContent = completedQuests + '/' + (gameState.dailyQuests?.length || 0);
    }
    if (profileLastRewardEl) {
        if (gameState.lastRewardClaim > 0) {
            const lastClaimDate = new Date(gameState.lastRewardClaim);
            profileLastRewardEl.textContent = lastClaimDate.toLocaleDateString();
        } else {
            profileLastRewardEl.textContent = 'Нет';
        }
    }

    // Вибрация
    const vibrationCheckbox = document.getElementById('vibrationEnabled');
    if (vibrationCheckbox) vibrationCheckbox.checked = gameState.vibrationEnabled;

    updateActionIcons();
    updateBalanceRankVisibility();
    applySkin();
}

function updateActionIcons() {
    // Бейдж ежедневного бонуса
    const dailyBadge = document.getElementById('dailyBonusBadge');
    if (dailyBadge) {
        const now = new Date();
        const today = now.toDateString();
        const claimedToday = gameState.dailyBonus.claimedDays?.includes(today);
        dailyBadge.style.display = claimedToday ? 'none' : 'flex';
    }

    // Бейдж колеса удачи
    const wheelBadge = document.getElementById('wheelBadge');
    if (wheelBadge) {
        const spinsLeft = gameState.wheel?.maxSpinsPerDay - (gameState.wheel?.spinsToday || 0);
        wheelBadge.style.display = spinsLeft > 0 ? 'flex' : 'none';
        if (spinsLeft > 0) {
            wheelBadge.textContent = spinsLeft;
        }
    }

    // Бейдж заданий
    const questsBadge = document.getElementById('questsBadge');
    if (questsBadge) {
        const availableQuests = gameState.dailyQuests?.filter(q => q.completed && !q.claimed)?.length || 0;
        questsBadge.style.display = availableQuests > 0 ? 'flex' : 'none';
        if (availableQuests > 0) {
            questsBadge.textContent = availableQuests;
        }
    }

    // Бейдж достижений
    const achievementsBadge = document.getElementById('achievementsBadge');
    if (achievementsBadge) {
        const totalAchievements = Object.keys(ACHIEVEMENTS_LIST).length;
        const completed = gameState.achievements?.length || 0;
        achievementsBadge.textContent = completed + '/' + totalAchievements;
    }

    // Бейдж скинов
    const skinsBadge = document.getElementById('skinsBadge');
    if (skinsBadge) {
        const purchased = gameState.skins?.purchased?.length || 1;
        skinsBadge.textContent = purchased + '/' + SKINS.length;
    }
}

function updateBalanceRankVisibility() {
    const activeTab = document.querySelector('.tab-content.active');
    const balanceContainer = document.getElementById('balanceContainer');
    const rankContainer = document.getElementById('rankContainer');

    if (activeTab && balanceContainer && rankContainer) {
        const showBalance = activeTab.dataset.showBalance === 'true';
        const showRank = activeTab.dataset.showRank === 'true';

        balanceContainer.classList.toggle('hidden', !showBalance);
        rankContainer.classList.toggle('hidden', !showRank);
    }
}

// ==================== ТАПЫ ====================
function handleTap(event) {
    event.preventDefault();
    event.stopPropagation();

    if (!handleTapAntiCheat()) return;

    if (gameState.energy < 1) {
        showNotification('❌ Нет энергии! Используй буст', 'warning');
        return;
    }

    const tapValue = gameState.boosters.multitap.value;
    gameState.energy -= 1;
    gameState.balance += tapValue;
    gameState.totalTaps += 1;

    if (gameState.rankIndex < RANKS.length - 1) {
        const nextReq = RANKS[gameState.rankIndex + 1].requirement;
        if (gameState.totalTaps >= nextReq) {
            gameState.rankIndex++;
            showNotification(`🎉 Новый ранг: ${RANKS[gameState.rankIndex].name}!`, 'success');
            if (gameState.vibrationEnabled) tg.HapticFeedback.notificationOccurred('success');
        }
    }

    updateQuestProgress('taps');
    updateQuestProgress('earn', tapValue);
    checkAchievements();

    updateUI();
    if (gameState.vibrationEnabled) tg.HapticFeedback.impactOccurred('medium');

    createTapEffect(event, tapValue);
    animateIce();
    saveUserData();
}

function createTapEffect(event, value) {
    const effect = document.createElement('div');
    effect.className = 'tap-effect';
    effect.textContent = '+' + formatNumber(value, false);

    let x, y;
    if (event.touches) {
        x = event.touches[0].clientX;
        y = event.touches[0].clientY;
    } else {
        x = event.clientX;
        y = event.clientY;
    }

    effect.style.left = (x - 30) + 'px';
    effect.style.top = (y - 40) + 'px';
    document.body.appendChild(effect);

    setTimeout(() => effect.remove(), 800);
}

function animateIce() {
    const ice = document.querySelector('.ice-cube');
    if (!ice) return;

    ice.style.transform = 'rotate(45deg) scale(0.95)';
    setTimeout(() => {
        ice.style.transform = 'rotate(45deg) scale(1)';
    }, 100);
}

// ==================== БУСТЕРЫ ====================
function useEnergyBoost() {
    if (gameState.freeBoosters <= 0) {
        showNotification('❌ Нет бесплатных бустеров!', 'warning');
        return;
    }

    gameState.energy = gameState.maxEnergy;
    gameState.freeBoosters--;

    updateQuestProgress('boost');

    showNotification('⚡ Энергия восстановлена!', 'success');
    if (gameState.vibrationEnabled) tg.HapticFeedback.impactOccurred('light');

    updateUI();
    saveUserData();
}

function buyBoost(type) {
    const booster = gameState.boosters[type];
    if (gameState.balance < booster.price) {
        showNotification('❌ Недостаточно льда!', 'warning');
        return;
    }

    gameState.balance -= booster.price;
    booster.level++;

    if (type === 'multitap') {
        booster.value += booster.increase;
        booster.price = Math.floor(booster.price * 2);
        booster.increase = Math.floor(booster.increase * 1.5);
        booster.nextValue = '+' + booster.increase;
    } else if (type === 'energy') {
        booster.value += booster.increase;
        booster.price = Math.floor(booster.price * 1.8);
        gameState.maxEnergy += booster.increase;
        gameState.energy += booster.increase;
        booster.nextValue = '+' + booster.increase;
    }

    updateQuestProgress('upgrade');
    checkAchievements();

    showNotification('✅ Бустер улучшен!', 'success');
    if (gameState.vibrationEnabled) tg.HapticFeedback.notificationOccurred('success');

    updateUI();
    saveUserData();
}

function upgradeIceProduction() {
    buyBoost('multitap');
}

// ==================== ДРУЗЬЯ ====================
function inviteFriend(type) {
    const link = getReferralLink();
    const reward = type === 'premium' ? 25000 : 5000;
    const text = type === 'premium' ?
        'Присоединяйся ко мне в Ice Mine и получи бонус 25,000 льда! 🎮❄️' :
        'Играй в Ice Mine, получи 5,000 льда бонусом! 🎮❄️';

    const shareText = encodeURIComponent(text + ' ' + link);
    window.open(`https://t.me/share/url?url=${shareText}`, '_blank');

    showNotification(`👥 Приглашение отправлено!`, 'success');

    setTimeout(() => {
        if (!gameState.referrals.invitedFriends) gameState.referrals.invitedFriends = [];
        gameState.referrals.invitedFriends.push({
            name: 'Новый друг',
            bonus: reward,
            date: Date.now(),
            level: 1
        });

        gameState.referrals.level1Count = (gameState.referrals.level1Count || 0) + 1;
        gameState.referrals.totalEarned = (gameState.referrals.totalEarned || 0) + reward;

        gameState.balance += reward;
        showNotification(`🎉 Бонус за приглашение: +${formatNumber(reward, false)} льда!`, 'success');

        updateFriendsList();
        checkAchievements();
        updateQuestProgress('invite_friend');
        saveUserData();
    }, 5000);
}

function updateFriendsList() {
    const friendsListEl = document.getElementById('friendsListContent');
    if (!friendsListEl) return;

    if (gameState.friends.length === 0 && (!gameState.referrals?.invitedFriends || gameState.referrals.invitedFriends.length === 0)) {
        friendsListEl.textContent = 'Ты еще никого не пригласил';
        friendsListEl.className = 'empty-friends';
        return;
    }

    let html = '';
    const allFriends = [...(gameState.friends || []), ...(gameState.referrals?.invitedFriends || [])];

    allFriends.forEach((friend, index) => {
        html += `
            <div class="friend-item">
                <span>${friend.name || 'Друг'}</span>
                <span>+${formatNumber(friend.bonus || 0, false)}</span>
            </div>
        `;
    });
    friendsListEl.innerHTML = html;
    friendsListEl.className = 'friends-list-content';
}

// ==================== РАНГИ ====================
function showRankInfo() {
    const modal = document.getElementById('rankModal');
    const ranksList = document.getElementById('ranksList');
    const currentRankInfo = document.getElementById('currentRankInfo');
    if (!modal || !ranksList) return;

    let html = '';
    RANKS.forEach((rank, index) => {
        const isCurrent = index === gameState.rankIndex;
        html += `
            <div class="rank-item ${isCurrent ? 'current' : ''}">
                <span class="rank-icon-small">${rank.icon}</span>
                <div class="rank-info">
                    <div class="rank-name-small">${rank.name}</div>
                    <div class="rank-requirement">Требуется: ${formatNumber(rank.requirement, false)} тапов</div>
                </div>
                ${isCurrent ? '<span class="rank-check">✅</span>' : ''}
            </div>
        `;
    });

    ranksList.innerHTML = html;

    if (gameState.rankIndex < RANKS.length - 1) {
        const tapsNeeded = RANKS[gameState.rankIndex + 1].requirement - gameState.totalTaps;
        currentRankInfo.innerHTML = `До следующего ранга: <span style="color: #4facfe;">${formatNumber(tapsNeeded, false)}</span> тапов`;
    } else {
        currentRankInfo.innerHTML = 'Вы достигли максимального ранга! 🎉';
    }

    modal.style.display = 'flex';
}

function closeRankModal() {
    document.getElementById('rankModal').style.display = 'none';
}

// ==================== ПРОФИЛЬ ====================
function openProfileModal() {
    updateUI();
    document.getElementById('profileModal').style.display = 'flex';
}

function closeProfileModal() {
    document.getElementById('profileModal').style.display = 'none';
}

// ==================== ТОП ИГРОКОВ ====================
const leaderboardData = {
    balance: [
        { name: 'Alex', balance: 5000000, avatar: '', userId: '1', username: 'alex' },
        { name: 'Maria', balance: 4500000, avatar: '', userId: '2', username: 'maria' },
        { name: 'John', balance: 4000000, avatar: '', userId: '3', username: 'john' },
        { name: 'Emma', balance: 3500000, avatar: '', userId: '4', username: 'emma' },
        { name: 'David', balance: 3000000, avatar: '', userId: '5', username: 'david' }
    ],
    taps: [
        { name: 'ProGamer', taps: 1000000, avatar: '', userId: '6', username: 'progamer' },
        { name: 'Clicker', taps: 900000, avatar: '', userId: '7', username: 'clicker' },
        { name: 'Master', taps: 800000, avatar: '', userId: '8', username: 'master' },
        { name: 'Legend', taps: 700000, avatar: '', userId: '9', username: 'legend' },
        { name: 'King', taps: 600000, avatar: '', userId: '10', username: 'king' }
    ]
};

let currentLeaderboardCategory = 'balance';

function switchLeaderboardCategory(category) {
    currentLeaderboardCategory = category;

    const buttons = document.querySelectorAll('.category-btn');
    buttons.forEach(btn => btn.classList.remove('active'));
    event.target.classList.add('active');

    renderLeaderboard();
}

function renderLeaderboard() {
    const list = document.getElementById('leaderboardList');
    if (!list) return;

    const data = leaderboardData[currentLeaderboardCategory];
    let html = '';

    data.forEach((player, index) => {
        const rankClass = index === 0 ? 'gold' : index === 1 ? 'silver' : index === 2 ? 'bronze' : '';
        const isCurrent = player.userId === gameState.userId;
        let value = '';

        if (currentLeaderboardCategory === 'balance') value = formatNumber(player.balance, true);
        else if (currentLeaderboardCategory === 'taps') value = formatNumber(player.taps, true) + ' тапов';

        html += `
            <div class="leaderboard-item ${isCurrent ? 'current' : ''}" onclick="openTelegramProfile('${player.username}')">
                <span class="leaderboard-rank ${rankClass}">${index + 1}</span>
                <img src="${player.avatar || AVATAR_PRESETS['default']}" class="leaderboard-avatar">
                <div class="leaderboard-info">
                    <div class="leaderboard-name">${player.name}</div>
                    <div class="leaderboard-value">${value}</div>
                </div>
            </div>
        `;
    });

    const isInTop5 = data.some(p => p.userId === gameState.userId);
    if (!isInTop5) {
        let currentValue = '';
        let playerValue = 0;

        if (currentLeaderboardCategory === 'balance') {
            currentValue = formatNumber(gameState.balance, true);
            playerValue = gameState.balance;
        } else if (currentLeaderboardCategory === 'taps') {
            currentValue = formatNumber(gameState.totalTaps, true) + ' тапов';
            playerValue = gameState.totalTaps;
        }

        let position = 6;
        data.forEach((player, index) => {
            let compareValue = 0;
            if (currentLeaderboardCategory === 'balance') compareValue = player.balance;
            else if (currentLeaderboardCategory === 'taps') compareValue = player.taps;

            if (playerValue > compareValue) position = index + 1;
        });

        html += `
            <div class="leaderboard-item current">
                <span class="leaderboard-rank">${position}</span>
                <img src="${gameState.userAvatar || AVATAR_PRESETS['default']}" class="leaderboard-avatar">
                <div class="leaderboard-info">
                    <div class="leaderboard-name">${gameState.userName} (Вы)</div>
                    <div class="leaderboard-value">${currentValue}</div>
                </div>
            </div>
        `;
    }

    list.innerHTML = html;
}

function openTelegramProfile(username) {
    if (username) tg.openTelegramLink(`https://t.me/${username}`);
}

// ==================== ПРОМОКОДЫ ====================
async function activatePromo() {
    const input = document.getElementById('promoInput');
    const code = input.value.trim().toUpperCase();

    if (!code) {
        showNotification('❌ Введите промокод!', 'warning');
        input.focus();
        return;
    }

    if (gameState.usedPromoCodes.includes(code)) {
        showNotification('❌ Промокод уже использован!', 'warning');
        input.value = '';
        return;
    }

    const PROMO_CODES = {
        'WELCOME100': { ice: 10000 },
        'ICE2024': { ice: 5000 },
        'BONUS200': { ice: 20000 },
        'LUCKY500': { ice: 50000 }
    };

    if (PROMO_CODES[code]) {
        gameState.balance += PROMO_CODES[code].ice;
        gameState.usedPromoCodes.push(code);
        showNotification(`✅ Промокод активирован! +${formatNumber(PROMO_CODES[code].ice)} ❄️`, 'success');
        input.value = '';
        updateUI();
        saveUserData();
    } else {
        showNotification('❌ Неверный промокод!', 'warning');
        input.value = '';
    }
}

// ==================== ИМЯ ====================
function openNameSettings() {
    document.getElementById('nameModal').style.display = 'flex';
    document.getElementById('newNameInput').value = gameState.userName;
}

function closeNameModal() {
    document.getElementById('nameModal').style.display = 'none';
}

function saveNewName() {
    const newName = document.getElementById('newNameInput').value.trim();
    if (newName) {
        gameState.userName = newName;
        updateUI();
        showNotification('✅ Имя сохранено!', 'success');
        saveUserData();
    }
    closeNameModal();
}

// ==================== АВАТАРКА ====================
function changeAvatar() {
    document.getElementById('avatarModal').style.display = 'flex';
}

function closeAvatarModal() {
    document.getElementById('avatarModal').style.display = 'none';
}

function selectAvatar(preset) {
    gameState.userAvatar = AVATAR_PRESETS[preset];
    updateUI();
    saveUserData();
    closeAvatarModal();
    showNotification('✅ Аватарка изменена!', 'success');
}

function handleAvatarUpload(event) {
    const file = event.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
        showNotification('❌ Пожалуйста, выберите изображение', 'warning');
        return;
    }

    if (file.size > 5 * 1024 * 1024) {
        showNotification('❌ Файл слишком большой (макс. 5MB)', 'warning');
        return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
        gameState.userAvatar = e.target.result;
        updateUI();
        saveUserData();
        closeAvatarModal();
        showNotification('✅ Аватарка загружена!', 'success');
    };
    reader.readAsDataURL(file);
}

// ==================== ВИБРАЦИЯ ====================
function toggleVibration() {
    const checkbox = document.getElementById('vibrationEnabled');
    gameState.vibrationEnabled = checkbox.checked;
    if (gameState.vibrationEnabled) tg.HapticFeedback.impactOccurred('light');
    saveUserData();
}

// ==================== ПЕРЕКЛЮЧЕНИЕ ВКЛАДОК ====================
function switchMainTab(tab) {
    const navItems = document.querySelectorAll('.nav-item');
    navItems.forEach(item => {
        item.classList.remove('active');
        if (item.dataset.tab === tab) item.classList.add('active');
    });

    const tabs = ['game', 'boosters', 'mine', 'leaderboard', 'friends', 'settings'];
    tabs.forEach(t => {
        const el = document.getElementById(t + 'Tab');
        if (el) el.classList.remove('active');
    });

    const activeTab = document.getElementById(tab + 'Tab');
    if (activeTab) activeTab.classList.add('active');

    if (tab === 'leaderboard') renderLeaderboard();
    if (tab === 'friends') updateFriendsList();

    updateBalanceRankVisibility();
}

// ==================== ЕЖЕДНЕВНЫЙ БОНУС ====================
function openDailyBonusModal() {
    renderDailyBonusModal();
    document.getElementById('dailyBonusModal').style.display = 'flex';
}

function closeDailyBonusModal() {
    document.getElementById('dailyBonusModal').style.display = 'none';
}

function renderDailyBonusModal() {
    const modalBody = document.querySelector('#dailyBonusModal .modal-body');
    if (!modalBody) return;

    const now = new Date();
    const today = now.getDate();
    const year = now.getFullYear();
    const month = now.getMonth();

    const daysInMonth = new Date(year, month + 1, 0).getDate();

    let calendarHtml = '<div class="bonus-calendar">';

    const weekdays = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];
    weekdays.forEach(day => {
        calendarHtml += `<div class="calendar-weekday">${day}</div>`;
    });

    const firstDay = new Date(year, month, 1).getDay() || 7;
    for (let i = 1; i < firstDay; i++) {
        calendarHtml += '<div class="calendar-day empty"></div>';
    }

    for (let day = 1; day <= daysInMonth; day++) {
        const date = new Date(year, month, day);
        const dateString = date.toDateString();
        const isToday = day === today;
        const isClaimed = gameState.dailyBonus.claimedDays?.includes(dateString);
        const isAvailable = !isClaimed && date <= now;

        let reward = 100;
        if (day % 7 === 0) reward = 500;
        else if (day % 5 === 0) reward = 250;
        else if (day % 3 === 0) reward = 150;

        calendarHtml += `
            <div class="calendar-day ${isToday ? 'today' : ''} ${isClaimed ? 'claimed' : ''} ${isAvailable ? 'available' : ''}"
                 onclick="${isAvailable ? 'claimDailyBonusDay(' + day + ')' : ''}">
                <div class="day-number">${day}</div>
                <div class="day-reward">${reward}</div>
                ${isClaimed ? '<div class="check-mark">✓</div>' : ''}
            </div>
        `;
    }

    calendarHtml += '</div>';

    const streak = gameState.dailyBonus.streak || 0;
    const nextBonus = 100 + (streak * 10);

    modalBody.innerHTML = `
        <div class="daily-bonus-header">
            <div class="streak-info">
                <span class="streak-fire">🔥</span>
                <span class="streak-days">${streak} дней подряд</span>
            </div>
            <div class="next-bonus">
                Завтра: +${nextBonus}
            </div>
        </div>
        ${calendarHtml}
        <div class="daily-bonus-footer">
            <button class="claim-daily-btn" id="dailyBonusClaimBtn" onclick="claimDailyBonus()">
                Забрать сегодняшний бонус
            </button>
        </div>
    `;

    const now2 = new Date();
    const today2 = now2.toDateString();
    const claimedToday = gameState.dailyBonus.claimedDays?.includes(today2);
    const claimBtn = document.getElementById('dailyBonusClaimBtn');
    if (claimBtn) {
        claimBtn.disabled = claimedToday;
        claimBtn.style.opacity = claimedToday ? '0.5' : '1';
    }
}

function checkDailyBonusAvailability() {
    const now = new Date();
    const today = now.toDateString();

    if (!gameState.dailyBonus.claimedDays) gameState.dailyBonus.claimedDays = [];

    gameState.dailyBonus.availableToday = !gameState.dailyBonus.claimedDays.includes(today);

    const dailyBadge = document.getElementById('dailyBonusBadge');
    if (dailyBadge) {
        dailyBadge.style.display = gameState.dailyBonus.availableToday ? 'flex' : 'none';
    }
}

function claimDailyBonus() {
    const now = new Date();
    const today = now.toDateString();

    if (!gameState.dailyBonus.claimedDays) gameState.dailyBonus.claimedDays = [];

    if (gameState.dailyBonus.claimedDays.includes(today)) {
        showNotification('❌ Вы уже получили бонус сегодня!', 'warning');
        return;
    }

    const lastClaim = gameState.dailyBonus.lastClaim ? new Date(gameState.dailyBonus.lastClaim) : null;
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);

    if (lastClaim && lastClaim.toDateString() === yesterday.toDateString()) {
        gameState.dailyBonus.streak = (gameState.dailyBonus.streak || 0) + 1;
    } else {
        gameState.dailyBonus.streak = 1;
    }

    let reward = 100 + (gameState.dailyBonus.streak * 10);
    const day = now.getDate();

    if (day % 7 === 0) reward += 400;
    else if (day % 5 === 0) reward += 150;
    else if (day % 3 === 0) reward += 50;

    gameState.balance += reward;
    gameState.dailyBonus.claimedDays.push(today);
    gameState.dailyBonus.lastClaim = now.getTime();
    gameState.dailyBonus.availableToday = false;

    updateQuestProgress('daily');
    checkAchievements();

    showNotification(`✅ Ежедневный бонус: +${formatNumber(reward, false)} льда!`, 'success');
    if (gameState.vibrationEnabled) tg.HapticFeedback.notificationOccurred('success');

    updateUI();
    saveUserData();
    renderDailyBonusModal();
}

function claimDailyBonusDay(day) {
    claimDailyBonus();
}

// ==================== КОЛЕСО УДАЧИ ====================
const WHEEL_SEGMENTS = [
    { color: '#FF6B6B', prize: 'balance', amount: 1000, icon: '❄️' },
    { color: '#4ECDC4', prize: 'balance', amount: 500, icon: '❄️' },
    { color: '#45B7D1', prize: 'balance', amount: 2000, icon: '❄️' },
    { color: '#96CEB4', prize: 'balance', amount: 5000, icon: '❄️' },
    { color: '#FFEEAD', prize: 'balance', amount: 10000, icon: '❄️' },
    { color: '#D4A5A5', prize: 'balance', amount: 500, icon: '❄️' },
    { color: '#9B59B6', prize: 'balance', amount: 20000, icon: '❄️' },
    { color: '#3498DB', prize: 'multitap', amount: 1, icon: '👆' }
];

let wheelSpinning = false;
let wheelCanvas = null;
let wheelCtx = null;

function initWheel() {
    wheelCanvas = document.getElementById('wheelCanvas');
    if (!wheelCanvas) return;

    wheelCtx = wheelCanvas.getContext('2d');
    drawWheel();
}

function drawWheel(rotateAngle = 0) {
    if (!wheelCtx) return;

    const canvas = wheelCanvas;
    const ctx = wheelCtx;
    const width = canvas.width;
    const height = canvas.height;
    const centerX = width / 2;
    const centerY = height / 2;
    const radius = Math.min(width, height) / 2 - 10;

    ctx.clearRect(0, 0, width, height);

    const anglePerSegment = (Math.PI * 2) / WHEEL_SEGMENTS.length;

    for (let i = 0; i < WHEEL_SEGMENTS.length; i++) {
        const startAngle = i * anglePerSegment + rotateAngle;
        const endAngle = (i + 1) * anglePerSegment + rotateAngle;

        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        ctx.arc(centerX, centerY, radius, startAngle, endAngle);
        ctx.closePath();

        ctx.fillStyle = WHEEL_SEGMENTS[i].color;
        ctx.fill();

        ctx.save();
        ctx.translate(centerX, centerY);
        ctx.rotate(startAngle + anglePerSegment / 2);
        ctx.textAlign = 'center';
        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold 16px Arial';
        ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
        ctx.shadowBlur = 4;
        ctx.fillText(WHEEL_SEGMENTS[i].icon, radius * 0.7, 10);
        ctx.restore();

        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        ctx.arc(centerX, centerY, radius, startAngle, endAngle);
        ctx.lineTo(centerX, centerY);
        ctx.stroke();
    }

    ctx.beginPath();
    ctx.arc(centerX, centerY, 20, 0, Math.PI * 2);
    ctx.fillStyle = '#FFD700';
    ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
    ctx.shadowBlur = 10;
    ctx.fill();
    ctx.shadowBlur = 0;
}

function openWheelModal() {
    initWheel();
    updateWheelUI();
    document.getElementById('wheelModal').style.display = 'flex';
    document.getElementById('wheelBadge').style.display = 'none';
}

function closeWheelModal() {
    document.getElementById('wheelModal').style.display = 'none';
}

function updateWheelUI() {
    const spinsLeft = gameState.wheel?.maxSpinsPerDay - (gameState.wheel?.spinsToday || 0);
    const freeSpinBtn = document.getElementById('wheelFreeSpinBtn');
    if (freeSpinBtn) {
        freeSpinBtn.textContent = `🎡 Бесплатно (${spinsLeft}/${gameState.wheel?.maxSpinsPerDay || 3})`;
        freeSpinBtn.disabled = spinsLeft <= 0;
    }

    const nextFreeEl = document.getElementById('wheelNextFree');
    if (nextFreeEl) {
        if (spinsLeft <= 0 && gameState.wheel?.lastSpinTime) {
            const nextFree = new Date(gameState.wheel.lastSpinTime + 24 * 60 * 60 * 1000);
            const hoursLeft = Math.ceil((nextFree - Date.now()) / (1000 * 60 * 60));
            nextFreeEl.textContent = `${hoursLeft}ч`;
        } else {
            nextFreeEl.textContent = 'Сейчас';
        }
    }

    const historyList = document.getElementById('wheelHistoryList');
    if (historyList && gameState.wheel?.history) {
        let html = '';
        gameState.wheel.history.slice(-5).reverse().forEach(item => {
            let prizeText = '';
            if (item.prize === 'balance') {
                prizeText = `${item.icon} ${item.amount.toLocaleString()} ❄️`;
            } else if (item.prize === 'multitap') {
                prizeText = `👆 Мультитап +${item.amount}`;
            }

            html += `
                <div class="history-item win">
                    <span>${prizeText}</span>
                    <span style="margin-left: auto; font-size: 9px; color: #8e9ab3;">
                        ${new Date(item.time).toLocaleTimeString()}
                    </span>
                </div>
            `;
        });
        historyList.innerHTML = html || '<div style="text-align:center; color:#8e9ab3;">История пуста</div>';
    }
}

function spinWheel(type) {
    if (wheelSpinning) return;

    if (type === 'free') {
        const spinsLeft = gameState.wheel?.maxSpinsPerDay - (gameState.wheel?.spinsToday || 0);
        if (spinsLeft <= 0) {
            showNotification('❌ Нет бесплатных попыток!', 'warning');
            return;
        }
    }

    wheelSpinning = true;

    const spinAngle = Math.random() * Math.PI * 2;
    const rotations = 5;
    const targetAngle = spinAngle + (rotations * Math.PI * 2);

    const segmentIndex = Math.floor((spinAngle / (Math.PI * 2)) * WHEEL_SEGMENTS.length);
    const win = WHEEL_SEGMENTS[segmentIndex];

    let startTime = null;
    const duration = 3000;

    function animateWheel(timestamp) {
        if (!startTime) startTime = timestamp;
        const elapsed = timestamp - startTime;
        const progress = Math.min(elapsed / duration, 1);

        const easeOut = 1 - Math.pow(1 - progress, 3);
        const currentAngle = targetAngle * easeOut;

        drawWheel(currentAngle);

        if (progress < 1) {
            requestAnimationFrame(animateWheel);
        } else {
            wheelSpinning = false;

            let rewardText = '';
            if (win.prize === 'balance') {
                gameState.balance += win.amount;
                rewardText = `+${win.amount.toLocaleString()} ❄️`;
            } else if (win.prize === 'multitap') {
                gameState.boosters.multitap.value += win.amount;
                rewardText = `Мультитап +${win.amount}`;
            }

            if (!gameState.wheel) gameState.wheel = { history: [] };
            if (!gameState.wheel.history) gameState.wheel.history = [];

            gameState.wheel.history.push({
                prize: win.prize,
                amount: win.amount,
                icon: win.icon,
                time: Date.now()
            });

            if (type === 'free') {
                gameState.wheel.spinsToday = (gameState.wheel.spinsToday || 0) + 1;
                gameState.wheel.lastSpinTime = Date.now();
            }

            showNotification(`🎉 Вы выиграли: ${rewardText}!`, 'success');
            if (gameState.vibrationEnabled) tg.HapticFeedback.notificationOccurred('success');

            updateWheelUI();
            updateUI();
            saveUserData();
            updateQuestProgress('wheel');
        }
    }

    requestAnimationFrame(animateWheel);
}

// ==================== ДОСТИЖЕНИЯ ====================
const ACHIEVEMENTS_LIST = {
    'first_tap': {
        name: 'Первый шаг',
        desc: 'Сделайте первый тап',
        reward: 1000,
        icon: '👆',
        condition: (state) => state.totalTaps >= 1
    },
    'tap_1000': {
        name: 'Опытный тапер',
        desc: 'Сделайте 1000 тапов',
        reward: 5000,
        icon: '👆',
        condition: (state) => state.totalTaps >= 1000
    },
    'tap_100000': {
        name: 'Легенда тапа',
        desc: 'Сделайте 100,000 тапов',
        reward: 50000,
        icon: '👑',
        condition: (state) => state.totalTaps >= 100000
    },
    'balance_1000': {
        name: 'Богач',
        desc: 'Накопите 1000 льда',
        reward: 2000,
        icon: '💰',
        condition: (state) => state.balance >= 1000
    },
    'balance_1m': {
        name: 'Миллионер',
        desc: 'Накопите 1,000,000 льда',
        reward: 100000,
        icon: '💎',
        condition: (state) => state.balance >= 1000000
    },
    'friend_1': {
        name: 'Общительный',
        desc: 'Пригласите первого друга',
        reward: 5000,
        icon: '👥',
        condition: (state) => (state.friends?.length || 0) + (state.referrals?.invitedFriends?.length || 0) >= 1
    },
    'friend_5': {
        name: 'Популярный',
        desc: 'Пригласите 5 друзей',
        reward: 15000,
        icon: '👥',
        condition: (state) => (state.friends?.length || 0) + (state.referrals?.invitedFriends?.length || 0) >= 5
    },
    'friend_10': {
        name: 'Звезда',
        desc: 'Пригласите 10 друзей',
        reward: 50000,
        icon: '⭐',
        condition: (state) => (state.friends?.length || 0) + (state.referrals?.invitedFriends?.length || 0) >= 10
    },
    'rank_5': {
        name: 'Серебро',
        desc: 'Достигните 5-го ранга',
        reward: 20000,
        icon: '🥈',
        condition: (state) => state.rankIndex >= 4
    },
    'rank_10': {
        name: 'Бог игры',
        desc: 'Достигните максимального ранга',
        reward: 200000,
        icon: '👑',
        condition: (state) => state.rankIndex >= 9
    },
    'multitap_10': {
        name: 'Мульти-мастер',
        desc: 'Улучшите мультитап до 10 уровня',
        reward: 40000,
        icon: '👆',
        condition: (state) => state.boosters.multitap.level >= 10
    },
    'energy_10': {
        name: 'Энерджайзер',
        desc: 'Улучшите энергию до 10 уровня',
        reward: 40000,
        icon: '⚡',
        condition: (state) => state.boosters.energy.level >= 10
    },
    'wheel_10': {
        name: 'Везунчик',
        desc: 'Крутите колесо удачи 10 раз',
        reward: 30000,
        icon: '🎡',
        condition: (state) => (state.wheel?.history?.length || 0) >= 10
    },
    'daily_7': {
        name: 'Постоянный',
        desc: 'Получите ежедневный бонус 7 дней подряд',
        reward: 25000,
        icon: '📅',
        condition: (state) => state.dailyBonus.streak >= 7
    },
    'skins_all': {
        name: 'Коллекционер',
        desc: 'Соберите все скины',
        reward: 100000,
        icon: '🎨',
        condition: (state) => state.skins?.purchased?.length >= SKINS.length
    }
};

function checkAchievements() {
    if (!gameState.achievements) gameState.achievements = [];

    Object.keys(ACHIEVEMENTS_LIST).forEach(id => {
        if (!gameState.achievements.includes(id)) {
            const achievement = ACHIEVEMENTS_LIST[id];
            if (achievement.condition(gameState)) {
                unlockAchievement(id);
            }
        }
    });
}

function unlockAchievement(achievementId) {
    if (!gameState.achievements) gameState.achievements = [];
    if (gameState.achievements.includes(achievementId)) return;

    const achievement = ACHIEVEMENTS_LIST[achievementId];
    gameState.achievements.push(achievementId);
    gameState.balance += achievement.reward;

    showNotification(`🏆 Достижение: ${achievement.name}! +${formatNumber(achievement.reward)} ❄️`, 'success');
    if (gameState.vibrationEnabled) tg.HapticFeedback.notificationOccurred('success');

    updateUI();
    saveUserData();
}

function openAchievementsModal() {
    renderAchievementsModal();
    document.getElementById('achievementsModal').style.display = 'flex';
}

function closeAchievementsModal() {
    document.getElementById('achievementsModal').style.display = 'none';
}

function renderAchievementsModal() {
    const container = document.getElementById('achievementsList');
    if (!container) return;

    let html = '';
    Object.keys(ACHIEVEMENTS_LIST).forEach(id => {
        const achievement = ACHIEVEMENTS_LIST[id];
        const isCompleted = gameState.achievements?.includes(id);

        html += `
            <div class="achievement-card ${isCompleted ? 'completed' : ''}">
                <div class="achievement-icon">${achievement.icon}</div>
                <div class="achievement-info">
                    <div class="achievement-name">${achievement.name}</div>
                    <div class="achievement-desc">${achievement.desc}</div>
                    <div class="achievement-reward">+${formatNumber(achievement.reward)} ❄️</div>
                </div>
                ${isCompleted ? '<div style="color:#4caf50;">✓</div>' : ''}
            </div>
        `;
    });

    container.innerHTML = html;
}

// ==================== ЕЖЕДНЕВНЫЕ ЗАДАНИЯ ====================
const DAILY_QUESTS_LIST = [
    { id: 'tap_100', name: 'Сделайте 100 тапов', reward: 500, icon: '👆', target: 100, type: 'taps' },
    { id: 'earn_5000', name: 'Заработайте 5000 льда', reward: 1000, icon: '💰', target: 5000, type: 'earn' },
    { id: 'use_boost', name: 'Используйте бесплатный бустер', reward: 300, icon: '⚡', target: 1, type: 'boost' },
    { id: 'upgrade_booster', name: 'Улучшите любой бустер', reward: 600, icon: '⬆️', target: 1, type: 'upgrade' },
    { id: 'spin_wheel', name: 'Крутаните колесо удачи', reward: 400, icon: '🎡', target: 1, type: 'wheel' },
    { id: 'invite_friend', name: 'Пригласите друга', reward: 2000, icon: '👥', target: 1, type: 'invite' },
    { id: 'claim_bonus', name: 'Заберите ежедневный бонус', reward: 300, icon: '📅', target: 1, type: 'daily' }
];

function initDailyQuests() {
    const today = new Date().toDateString();
    const lastReset = localStorage.getItem('dailyQuestsReset');

    if (lastReset !== today || !gameState.dailyQuests || gameState.dailyQuests.length === 0) {
        gameState.dailyQuests = DAILY_QUESTS_LIST.map(q => ({
            ...q,
            progress: 0,
            completed: false,
            claimed: false
        }));
        localStorage.setItem('dailyQuestsReset', today);
    }
}

function updateQuestProgress(questType, amount = 1) {
    if (!gameState.dailyQuests) return;

    gameState.dailyQuests.forEach(quest => {
        if (!quest.completed && quest.type === questType) {
            quest.progress = Math.min(quest.progress + amount, quest.target);

            if (quest.progress >= quest.target && !quest.completed) {
                quest.completed = true;
                showNotification(`✅ Задание выполнено: ${quest.name}!`, 'success');
            }
        }
    });

    updateActionIcons();
    saveUserData();
}

function claimQuestReward(questId) {
    const quest = gameState.dailyQuests?.find(q => q.id === questId);
    if (!quest || !quest.completed || quest.claimed) return;

    quest.claimed = true;
    gameState.balance += quest.reward;

    showNotification(`🎁 Награда: +${quest.reward} льда!`, 'success');
    updateUI();
    saveUserData();
    renderQuestsModal();
    updateActionIcons();
}

function openQuestsModal() {
    renderQuestsModal();
    document.getElementById('questsModal').style.display = 'flex';
}

function closeQuestsModal() {
    document.getElementById('questsModal').style.display = 'none';
}

function renderQuestsModal() {
    const container = document.getElementById('questsList');
    if (!container || !gameState.dailyQuests) return;

    let html = '';
    gameState.dailyQuests.forEach(quest => {
        const progressPercent = (quest.progress / quest.target) * 100;

        html += `
            <div class="quest-card ${quest.completed ? 'completed' : ''}">
                <div class="quest-icon">${quest.icon}</div>
                <div class="quest-info">
                    <div class="quest-name">${quest.name}</div>
                    <div class="quest-progress">${quest.progress}/${quest.target}</div>
                    <div class="quest-progress-bar">
                        <div class="quest-progress-fill" style="width: ${progressPercent}%"></div>
                    </div>
                    <div class="quest-reward">+${quest.reward} ❄️</div>
                </div>
                ${quest.completed && !quest.claimed ? 
                    `<button class="quest-claim-btn" onclick="claimQuestReward('${quest.id}')">Забрать</button>` : 
                    quest.claimed ? '✓' : ''}
            </div>
        `;
    });

    container.innerHTML = html;

    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);

    const msLeft = tomorrow - now;
    const hoursLeft = Math.floor(msLeft / (1000 * 60 * 60));
    const minutesLeft = Math.floor((msLeft % (1000 * 60 * 60)) / (1000 * 60));

    const timerEl = document.getElementById('questsTimer');
    if (timerEl) {
        timerEl.textContent = `⏰ Сброс заданий через: ${hoursLeft}ч ${minutesLeft}м`;
    }
}

// ==================== ЗАЩИТА ОТ ЧИТОВ ====================
function antiCheatCheck() {
    if (!gameState.antiCheat) {
        gameState.antiCheat = {
            lastTapTime: 0,
            tapCount: 0,
            tapSpeed: 0,
            warnings: 0,
            blocked: false,
            blockUntil: 0
        };
    }

    const now = Date.now();

    if (gameState.antiCheat.blocked) {
        if (now < gameState.antiCheat.blockUntil) {
            const badge = document.getElementById('antiCheatBadge');
            if (badge) {
                badge.textContent = '🚫 Заблокирован';
                badge.classList.add('show');
            }
            return false;
        } else {
            gameState.antiCheat.blocked = false;
            const badge = document.getElementById('antiCheatBadge');
            if (badge) badge.classList.remove('show');
        }
    }

    return true;
}

function handleTapAntiCheat() {
    if (!antiCheatCheck()) return false;

    const now = Date.now();
    const timeDiff = now - (gameState.antiCheat.lastTapTime || now);

    if (timeDiff < 50) {
        gameState.antiCheat.tapCount++;
        gameState.antiCheat.tapSpeed = (gameState.antiCheat.tapSpeed || 0) + 1;

        if (gameState.antiCheat.tapSpeed > 10) {
            gameState.antiCheat.warnings++;

            if (gameState.antiCheat.warnings >= 3) {
                gameState.antiCheat.blocked = true;
                gameState.antiCheat.blockUntil = now + (5 * 60 * 1000);
                showNotification('🚫 Обнаружен читинг! Блокировка на 5 минут', 'error');
                return false;
            }

            showNotification('⚠️ Слишком быстрые тапы!', 'warning');
        }

        const badge = document.getElementById('antiCheatBadge');
        if (badge) {
            badge.textContent = '⚠️ Не читери!';
            badge.classList.add('show');
            setTimeout(() => badge.classList.remove('show'), 2000);
        }
    } else {
        gameState.antiCheat.tapSpeed = Math.max(0, (gameState.antiCheat.tapSpeed || 0) - 1);
    }

    if (gameState.antiCheat.warnings > 0 && timeDiff > 10000) {
        gameState.antiCheat.warnings = 0;
    }

    gameState.antiCheat.lastTapTime = now;
    return true;
}

// ==================== РЕФЕРАЛЬНАЯ СИСТЕМА ====================
function generateReferralCode() {
    if (!gameState.referrals) gameState.referrals = {};

    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = gameState.userId.substring(0, 4);
    for (let i = 0; i < 4; i++) {
        code += chars[Math.floor(Math.random() * chars.length)];
    }

    gameState.referrals.code = code;
    saveUserData();
    return code;
}

function getReferralLink() {
    const code = gameState.referrals?.code || generateReferralCode();
    return `https://t.me/icemine_bot?start=${code}`;
}

function checkReferral() {
    const urlParams = new URLSearchParams(window.location.search);
    const startParam = urlParams.get('start');

    if (startParam && startParam !== gameState.referrals?.code) {
        sessionStorage.setItem('referrer_code', startParam);
        showNotification('👋 Вы пришли по приглашению! После регистрации получите бонус!', 'info');
    }
}

async function activateReferral() {
    const referrerCode = sessionStorage.getItem('referrer_code');
    if (!referrerCode || !gameState.referrals) return;

    if (gameState.referrals.invitedBy) {
        sessionStorage.removeItem('referrer_code');
        return;
    }

    try {
        const response = await fetch('/api/referral/enter', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                userId: gameState.userId,
                code: referrerCode
            })
        });

        const data = await response.json();

        if (data.success) {
            gameState.balance += data.bonus;
            showNotification('🎁 Бонус за приглашение: +' + data.bonus + ' льда!', 'success');
            saveUserData();
        }
    } catch (error) {
        console.error('Error activating referral:', error);
    }

    sessionStorage.removeItem('referrer_code');
}

function showReferralInfo() {
    document.getElementById('referralModal').style.display = 'flex';

    const code = gameState.referrals?.code || generateReferralCode();
    const codeDisplay = document.getElementById('referralCodeDisplay');
    if (codeDisplay) {
        codeDisplay.textContent = code;
    }

    const referralLink = document.getElementById('referralLink');
    if (referralLink) {
        referralLink.textContent = `t.me/icemine_bot?start=${code}`;
    }

    const referralCount = document.getElementById('referralCount');
    if (referralCount) {
        referralCount.textContent = gameState.referrals?.invitedFriends?.length || 0;
    }

    const referralEarned = document.getElementById('referralEarned');
    if (referralEarned) {
        referralEarned.textContent = formatNumber(gameState.referrals?.totalEarned || 0, false) + ' льда';
    }

    const modalBody = document.querySelector('#referralModal .modal-body');
    const existingBtn = document.getElementById('enterReferralBtn');

    if (!existingBtn) {
        const enterBtn = document.createElement('button');
        enterBtn.id = 'enterReferralBtn';
        enterBtn.className = 'wheel-spin-btn';
        enterBtn.style.marginTop = '15px';
        enterBtn.style.background = 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)';
        enterBtn.innerHTML = '🔗 У меня есть код';
        enterBtn.onclick = () => {
            closeReferralModal();
            showEnterReferralModal();
        };
        modalBody.appendChild(enterBtn);
    }
}

function closeReferralModal() {
    document.getElementById('referralModal').style.display = 'none';
}

function copyReferralCode() {
    const code = gameState.referrals?.code || generateReferralCode();
    navigator.clipboard.writeText(code).then(() => {
        showNotification('✅ Код скопирован!', 'success');

        const btn = event.currentTarget;
        btn.style.transform = 'scale(0.95)';
        setTimeout(() => {
            btn.style.transform = 'scale(1)';
        }, 200);
    });
}

function showEnterReferralModal() {
    if (gameState.referrals?.invitedBy) {
        showNotification('❌ Вы уже активировали реферальный код!', 'warning');
        return;
    }

    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.id = 'enterReferralModal';
    modal.innerHTML = `
        <div class="modal-content" style="max-width: 350px;">
            <div class="modal-header">
                <h3>🔗 Ввести реферальный код</h3>
                <button class="close-btn" onclick="closeEnterReferralModal()">✕</button>
            </div>
            <div class="modal-body">
                <p style="color: #8e9ab3; margin-bottom: 15px; text-align: center;">
                    Введите код друга и получите бонус 5,000 льда!
                </p>
                <div class="promo-input-group" style="margin-bottom: 15px;">
                    <input type="text" class="promo-input" id="referralCodeInput" 
                           placeholder="XXXXXX" maxlength="8" 
                           style="text-align: center; font-size: 18px; letter-spacing: 2px;">
                </div>
                <button class="claim-daily-btn" onclick="submitReferralCode()" id="submitReferralBtn">
                    Активировать код
                </button>
                <p style="color: #8e9ab3; font-size: 11px; text-align: center; margin-top: 15px;">
                    ⚠️ Код можно ввести только один раз
                </p>
            </div>
        </div>
    `;

    document.body.appendChild(modal);
    modal.style.display = 'flex';

    const input = document.getElementById('referralCodeInput');
    input.addEventListener('input', function() {
        this.value = this.value.toUpperCase();
    });
}

function closeEnterReferralModal() {
    const modal = document.getElementById('enterReferralModal');
    if (modal) {
        modal.style.display = 'none';
        modal.remove();
    }
}

async function submitReferralCode() {
    const input = document.getElementById('referralCodeInput');
    const code = input.value.trim().toUpperCase();
    const btn = document.getElementById('submitReferralBtn');

    if (!code) {
        showNotification('❌ Введите код!', 'warning');
        return;
    }

    if (code.length < 4) {
        showNotification('❌ Неверный формат кода', 'warning');
        return;
    }

    btn.disabled = true;
    btn.textContent = '⏳ Проверка...';

    try {
        const checkResponse = await fetch('/api/referral/check', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ code })
        });

        const checkData = await checkResponse.json();

        if (!checkData.success || !checkData.exists) {
            showNotification('❌ Код не найден!', 'warning');
            btn.disabled = false;
            btn.textContent = 'Активировать код';
            return;
        }

        const response = await fetch('/api/referral/enter', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                userId: gameState.userId,
                code: code
            })
        });

        const data = await response.json();

        if (data.success) {
            showNotification(`✅ Код активирован! +${data.bonus} льда!`, 'success');

            gameState.balance += data.bonus;
            gameState.referrals.invitedBy = code;
            updateUI();
            saveUserData();

            closeEnterReferralModal();
        } else {
            showNotification('❌ ' + (data.error || 'Ошибка активации'), 'warning');
        }
    } catch (error) {
        console.error('Referral error:', error);
        showNotification('❌ Ошибка соединения с сервером', 'error');
    } finally {
        btn.disabled = false;
        btn.textContent = 'Активировать код';
    }
}

// ==================== ПАССИВНЫЙ ДОХОД ====================
setInterval(() => {
    if (gameState.energy < gameState.maxEnergy) {
        gameState.energy = Math.min(gameState.energy + 1, gameState.maxEnergy);
    }

    if (gameState.boosters.multitap.level > 0) {
        const hourlyIncome = gameState.boosters.multitap.value * 3600;
        const perSecond = hourlyIncome / 3600;

        if (!gameState._passiveAccumulator) gameState._passiveAccumulator = 0;
        gameState._passiveAccumulator += perSecond;

        const toAdd = Math.floor(gameState._passiveAccumulator);
        if (toAdd > 0) {
            gameState.balance += toAdd;
            gameState._passiveAccumulator -= toAdd;
        }
    }

    updateUI();
    saveUserData();
}, 1000);

setInterval(() => {
    if (gameState.wheel?.lastSpinTime) {
        const lastSpin = new Date(gameState.wheel.lastSpinTime);
        const now = new Date();
        if (lastSpin.getDate() !== now.getDate()) {
            gameState.wheel.spinsToday = 0;
        }
    }

    updateWheelUI();
}, 60000);

// ==================== ИНИЦИАЛИЗАЦИЯ ====================
document.addEventListener('DOMContentLoaded', async function() {
    console.log('🚀 Инициализация игры...');

    await loadUserData();

    const ice = document.getElementById('mainIce');
    if (ice) {
        ice.addEventListener('click', handleTap);
        ice.addEventListener('touchstart', function(e) {
            e.preventDefault();
            handleTap(e);
        }, { passive: false });
    }

    const promoInput = document.getElementById('promoInput');
    if (promoInput) {
        promoInput.addEventListener('input', function() {
            this.value = this.value.toUpperCase();
        });
    }

    initWheel();
    initDailyQuests();
    checkReferral();
    setTimeout(activateReferral, 2000);
    updateWheelUI();
    setInterval(checkAchievements, 10000);
    setInterval(() => {
        const modal = document.getElementById('questsModal');
        if (modal && modal.style.display === 'flex') {
            renderQuestsModal();
        }
    }, 60000);

    updateFriendsList();
    checkDailyBonusAvailability();
    applySkin();

    console.log('✅ Игра инициализирована');
});