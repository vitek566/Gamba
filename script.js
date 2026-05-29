// Konfigurace hry
const STARTING_BALANCE = 10000;
const STARTING_MIN_BET = 500;
const BUFF_INCREASE_RATE = 1.5; 
const MIN_BET_INCREASE_RATE = 1.01; // Zdražení minimální sázky o 1% za spin
const MAX_SLOTS = 6;

// Výherní pravděpodobnost (Strop nastaven na 30%)
const MAX_WIN_ROLL = 10000; 
const BASE_CHANCE = 2000; // Základní šance je přesně 20 %
const LUCK_BUFF_VALUE = 200; // Každý buff přidá 2 %
const MAX_LUCK_POINTS = 5; // Max 5 nákupů (20% + 5 * 2% = 30%)

const SYMBOLS = ['💎', '⭐', '🔔', '🍉', '🍊', '🍋', '🍒'];

let state = {
    balance: STARTING_BALANCE,
    minBet: STARTING_MIN_BET,
    level: 1,
    slotsCount: 3,
    luckPoints: 0, 
    profitMultiplier: 3.0, 
    prices: { luck: 1000, slots: 2000, profit: 1500 },
    // Clover Debt parametry
    debt: 3000,
    timeRemaining: 180 // 3 minuty na startu
};

let timerInterval = null;

const ui = {
    balance: document.getElementById('balance'),
    minBet: document.getElementById('minBetDisplay'),
    level: document.getElementById('level'),
    betInput: document.getElementById('betInput'),
    p_luck: document.getElementById('p_luck'),
    p_slots: document.getElementById('p_slots'),
    p_profit: document.getElementById('p_profit'),
    container: document.getElementById('reelContainer'),
    status: document.getElementById('gameStatus'),
    spinBtn: document.getElementById('spinBtn'),
    timer: document.getElementById('timer'),
    debtAmount: document.getElementById('debtAmount'),
    jackpotOverlay: document.getElementById('jackpotOverlay')
};

function updateUI() {
    ui.balance.innerText = Math.floor(state.balance);
    ui.minBet.innerText = Math.floor(state.minBet);
    ui.level.innerText = state.level;
    ui.p_luck.innerText = Math.floor(state.prices.luck);
    ui.p_slots.innerText = Math.floor(state.prices.slots);
    ui.p_profit.innerText = Math.floor(state.prices.profit);
    ui.debtAmount.innerText = Math.floor(state.debt);
    ui.betInput.min = Math.floor(state.minBet);

    // Text a limitace pro štěstí
    let currentChance = 20 + (state.luckPoints * 2);
    if (state.luckPoints >= MAX_LUCK_POINTS) {
        document.getElementById('luckBonusText').innerText = `MAX DOSAŽENO (30%)`;
        document.getElementById('buffLuck').disabled = true;
    } else {
        document.getElementById('luckBonusText').innerText = `Šance +2% (Nyní: ${currentChance}%)`;
        document.getElementById('buffLuck').disabled = state.balance < state.prices.luck;
    }

    document.getElementById('buffProfit').disabled = state.balance < state.prices.profit;
    document.getElementById('buffSlots').disabled = state.balance < state.prices.slots || state.slotsCount >= MAX_SLOTS;
}

function startTimer() {
    if(timerInterval) clearInterval(timerInterval);
    timerInterval = setInterval(() => {
        state.timeRemaining--;
        
        // Formátování času MM:SS
        let minutes = Math.floor(state.timeRemaining / 60);
        let seconds = state.timeRemaining % 60;
        ui.timer.innerText = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

        if (state.timeRemaining <= 0) {
            clearInterval(timerInterval);
            checkDebtPayment();
        }
    }, 1000);
}

function checkDebtPayment() {
    if (state.balance >= state.debt) {
        // Úspěšné splacení
        state.balance -= state.debt;
        state.level++;
        
        // Zvýšení nároků pro další level (Clover pit styl)
        state.debt = Math.floor(state.debt * 2.5); // Dluh roste 2.5x
        state.timeRemaining = 180 + (state.level * 30); // Čas se prodlouží o 30s každý lvl
        
        alert(`Dluh splacen! Postupuješ do Levelu ${state.level}. Nový cíl splátky: ${state.debt} Kč.`);
        
        startTimer();
        updateUI();
    } else {
        // Bankrot
        alert(`Čas vypršel! Nedokázal jsi včas splatit dluh ${state.debt} Kč. BANKROT!`);
        resetGame();
    }
}

function renderReels() {
    ui.container.innerHTML = '';
    for(let i=0; i<state.slotsCount; i++) {
        ui.container.innerHTML += `<div class="reel" id="reel-${i}">${SYMBOLS[0]}</div>`;
    }
}

window.buyBuff = function(type) {
    if (state.balance >= state.prices[type]) {
        state.balance -= state.prices[type];
        state.prices[type] *= BUFF_INCREASE_RATE;
        
        if(type === 'luck' && state.luckPoints < MAX_LUCK_POINTS) state.luckPoints++;
        if(type === 'slots' && state.slotsCount < MAX_SLOTS) { 
            state.slotsCount++; 
            renderReels(); 
        }
        if(type === 'profit') state.profitMultiplier += 1.0;
        
        ui.status.innerText = "Vylepšení zakoupeno!";
        ui.status.style.color = "#4dffff";
        updateUI();
    }
}

function resetGame() {
    state = {
        balance: STARTING_BALANCE, minBet: STARTING_MIN_BET, level: 1, slotsCount: 3,
        luckPoints: 0, profitMultiplier: 3.0, prices: { luck: 1000, slots: 2000, profit: 1500 },
        debt: 3000, timeRemaining: 180
    };
    ui.betInput.value = 500;
    renderReels();
    startTimer();
    updateUI();
}

ui.spinBtn.onclick = () => {
    let currentBet = parseInt(ui.betInput.value);

    // Validace sázky
    if (isNaN(currentBet) || currentBet < Math.floor(state.minBet)) {
        alert(`Sázka musí být minimálně ${Math.floor(state.minBet)} Kč!`);
        return;
    }
    if (state.balance < currentBet) {
        alert("Nemáš dostatek kreditu na tuto sázku!");
        return;
    }

    // Spuštění točení
    state.balance -= currentBet;
    state.minBet *= MIN_BET_INCREASE_RATE; // Zvýšení minimální sázky o 1%
    ui.spinBtn.disabled = true;
    ui.status.innerText = "Točí se...";
    ui.status.className = "game-status";
    updateUI();

    const reels = document.querySelectorAll('.reel');
    reels.forEach(reel => {
        reel.innerHTML = SYMBOLS.join('<br>');
        reel.classList.add('spinning');
    });

    setTimeout(() => {
        reels.forEach(reel => reel.classList.remove('spinning'));

        // Určení výsledku podle vypočítané šance
        const winTarget = BASE_CHANCE + (state.luckPoints * LUCK_BUFF_VALUE); 
        const roll = Math.floor(Math.random() * MAX_WIN_ROLL);
        
        let isWin = roll < winTarget;
        let isJackpot = false;
        let resultSymbols = [];

        if (isWin) {
            let chosenSymbol = SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)];
            // Šance, že výhra bude rovnou čistý Jackpot (15% šance uvnitř výhry)
            if (Math.random() < 0.15) {
                isJackpot = true;
                for(let i=0; i<state.slotsCount; i++) resultSymbols.push(chosenSymbol);
            } else {
                // Klasická výhra: Garantujeme shodu 3 symbolů, zbytek náhodný
                for(let i=0; i<3; i++) resultSymbols.push(chosenSymbol);
                while(resultSymbols.length < state.slotsCount) {
                    resultSymbols.push(SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)]);
                }
                // Promícháme pole, aby shoda nebyla vždy jen na začátku
                resultSymbols.sort(() => Math.random() - 0.5);
            }
        } else {
            // Prohra: Musíme zaručit, že v poli NENÍ žádná trojice stejných symbolů
            // Použijeme bezpečné generování, kde každý symbol smí být max 2x
            let counts = {};
            while(resultSymbols.length < state.slotsCount) {
                let sym = SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)];
                if(!counts[sym]) counts[sym] = 0;
                if(counts[sym] < 2) {
                    counts[sym]++;
                    resultSymbols.push(sym);
                }
            }
        }

        // Vykreslení symbolů do oken
        reels.forEach((reel, index) => {
            reel.innerText = resultSymbols[index];
        });

        // Vyhodnocení zisku na základě nejčastějšího symbolu na ploše
        if (isWin) {
            // Spočítej maximální shodu pro výpočet odměny
            let maxMatches = 3;
            let counts = {};
            resultSymbols.forEach(s => counts[s] = (counts[s] || 0) + 1);
            for(let s in counts) {
                if(counts[s] > maxMatches) maxMatches = counts[s];
            }

            // Kontrola, zda se náhodou neshodovalo úplně všechno (všechny sloty stejné)
            if(maxMatches === state.slotsCount) isJackpot = true;

            let totalWin = 0;
            if (isJackpot) {
                // Celoplošný jackpot efekt a mega odměna
                totalWin = currentBet * state.profitMultiplier * maxMatches * 5;
                state.balance += totalWin;
                
                ui.jackpotOverlay.classList.remove('hidden');
                setTimeout(() => ui.jackpotOverlay.classList.add('hidden'), 2500);

                ui.status.innerText = "🎉 MEGA JACKPOT: " + Math.floor(totalWin) + " Kč! 🎉";
                ui.status.className = "game-status win-msg";
            } else {
                // Běžná trojice/čtyřka/pětka
                totalWin = currentBet * state.profitMultiplier * (maxMatches * 0.8);
                state.balance += totalWin;
                ui.status.innerText = `VÝHRA (Shoda ${maxMatches}x): ` + Math.floor(totalWin) + " Kč!";
                ui.status.className = "game-status win-msg";
            }
        } else {
            ui.status.innerText = "Žádná shoda. Zkus to znovu!";
        }

        ui.spinBtn.disabled = false;
        updateUI();

    }, 1200);
};

// Prvotní spuštění
renderReels();
startTimer();
updateUI();
