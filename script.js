// Konfigurace a výchozí stav
const STARTING_BALANCE = 10000;
const STARTING_BET = 500;
const BUFF_INCREASE_RATE = 1.5; // Dražší o 50%
const BET_INCREASE_RATE = 1.01; // Zdražení točky o 1%
const MAX_SLOTS = 6;

// --- ÚPRAVA ŠANCE NA VÝHRU ---
const MAX_WIN_ROLL = 10000; 
const BASE_CHANCE = 2500; // Základní šance je nyní 25 % (místo původního 1 %)
const LUCK_BUFF_VALUE = 1000; // Každý buff přidá 10 % navíc k šanci

const SYMBOLS = ['💎', '⭐', '🔔', '🍉', '🍊', '🍋', '🍒'];

let state = {
    balance: STARTING_BALANCE,
    bet: STARTING_BET,
    level: 1,
    slotsCount: 3,
    luckPoints: 0, 
    profitMultiplier: 3, 
    prices: { luck: 1000, slots: 2000, profit: 1500 }
};

const ui = {
    balance: document.getElementById('balance'),
    bet: document.getElementById('betPrice'),
    level: document.getElementById('level'),
    p_luck: document.getElementById('p_luck'),
    p_slots: document.getElementById('p_slots'),
    p_profit: document.getElementById('p_profit'),
    container: document.getElementById('reelContainer'),
    status: document.getElementById('gameStatus'),
    spinBtn: document.getElementById('spinBtn')
};

function updateUI() {
    ui.balance.innerText = Math.floor(state.balance);
    ui.bet.innerText = Math.floor(state.bet);
    ui.level.innerText = state.level;
    ui.p_luck.innerText = Math.floor(state.prices.luck);
    ui.p_slots.innerText = Math.floor(state.prices.slots);
    ui.p_profit.innerText = Math.floor(state.prices.profit);

    document.getElementById('buffLuck').disabled = state.balance < state.prices.luck;
    document.getElementById('buffProfit').disabled = state.balance < state.prices.profit;
    document.getElementById('buffSlots').disabled = state.balance < state.prices.slots || state.slotsCount >= MAX_SLOTS;
}

function renderReels() {
    ui.container.innerHTML = '';
    for(let i=0; i<state.slotsCount; i++) {
        ui.container.innerHTML += `<div class="reel" id="reel-${i}">${SYMBOLS[0]}</div>`;
    }
}

// Funkce musí být dostupná z HTML (onclick)
window.buyBuff = function(type) {
    if (state.balance >= state.prices[type]) {
        state.balance -= state.prices[type];
        state.prices[type] *= BUFF_INCREASE_RATE;
        
        if(type === 'luck') state.luckPoints++;
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

function gameOver() {
    alert("GAME OVER! Kredit klesl pod cenu sázky. Začínáme znovu.");
    state = {
        balance: STARTING_BALANCE, bet: STARTING_BET, level: 1, slotsCount: 3,
        luckPoints: 0, profitMultiplier: 3, prices: { luck: 1000, slots: 2000, profit: 1500 }
    };
    renderReels();
    ui.status.innerText = "Nová hra! Přejeme hodně štěstí.";
    ui.status.style.color = "#ccc";
    updateUI();
}

ui.spinBtn.onclick = () => {
    if (state.balance < state.bet) {
        gameOver();
        return;
    }

    state.balance -= state.bet;
    state.bet *= BET_INCREASE_RATE;
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

        // Výpočet šance
        const winTarget = BASE_CHANCE + (state.luckPoints * LUCK_BUFF_VALUE); 
        const roll = Math.floor(Math.random() * MAX_WIN_ROLL);
        
        let isWin = roll < winTarget;
        let resultSymbols = [];

        if (isWin) {
            // Výhra: Zvolíme jeden náhodný symbol a dáme ho do všech slotů
            let winningSymbol = SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)];
            for(let i = 0; i < state.slotsCount; i++) {
                resultSymbols.push(winningSymbol);
            }
        } else {
            // Prohra: Musíme garantovat, že symboly NEJSOU stejné
            let sym1 = SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)];
            let sym2;
            do {
                sym2 = SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)];
            } while (sym1 === sym2); // Přinutíme druhý symbol být jiný než první
            
            resultSymbols.push(sym1, sym2);
            
            // Zbytek slotů může být naprosto náhodný
            for(let i = 2; i < state.slotsCount; i++) {
                resultSymbols.push(SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)]);
            }
        }

        // Zobrazení symbolů v HTML
        reels.forEach((reel, index) => {
            reel.innerText = resultSymbols[index];
        });

        if (isWin) {
            let slotBonus = 1 + ((state.slotsCount - 3) * 0.2); 
            let totalWin = state.bet * state.profitMultiplier * slotBonus;
            state.balance += totalWin;
            ui.status.innerText = "VÝHRA: " + Math.floor(totalWin) + " Kč!";
            ui.status.className = "game-status win-msg";
        } else {
            ui.status.innerText = "Nic nepadlo. Zkusíte to znovu?";
        }

        state.level = Math.floor(state.balance / 10000) + 1;
        ui.spinBtn.disabled = false;
        updateUI();

    }, 1200);
};

renderReels();
updateUI();
