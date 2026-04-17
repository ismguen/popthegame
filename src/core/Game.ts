import { LEVELS } from '../data/LevelConfig';
import SHOP_ITEMS from '../data/shop.json';
export const canvas = document.getElementById('gameCanvas') as HTMLCanvasElement;
const ctx = canvas.getContext('2d');
const scoreDisplay = document.getElementById('score-display');
const dropsDisplay = document.getElementById('drops-display');

// --- AUDIO SYSTEM ---
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

function playSound(type, pitchMultiplier = 0) {
    if (audioCtx.state === 'suspended') audioCtx.resume();
    
    const osc = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();
    
    osc.connect(gainNode);
    gainNode.connect(audioCtx.destination);
    
    const now = audioCtx.currentTime;
    
    if (type === 'grow') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(300 + (pitchMultiplier * 100), now);
        osc.frequency.exponentialRampToValueAtTime(600 + (pitchMultiplier * 100), now + 0.1);
        gainNode.gain.setValueAtTime(0, now);
        gainNode.gain.linearRampToValueAtTime(0.5, now + 0.02);
        gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
        osc.start(now);
        osc.stop(now + 0.15);
    } else if (type === 'pop') {
        osc.type = 'triangle';
        const baseFreq = 200 + (pitchMultiplier * 40); 
        osc.frequency.setValueAtTime(baseFreq, now);
        osc.frequency.exponentialRampToValueAtTime(baseFreq * 2, now + 0.15);
        gainNode.gain.setValueAtTime(0, now);
        gainNode.gain.linearRampToValueAtTime(0.6, now + 0.02);
        gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
        osc.start(now);
        osc.stop(now + 0.3);
    } else if (type === 'rock_hit') {
        osc.type = 'square';
        osc.frequency.setValueAtTime(100, now);
        osc.frequency.exponentialRampToValueAtTime(40, now + 0.1);
        gainNode.gain.setValueAtTime(0, now);
        gainNode.gain.linearRampToValueAtTime(0.3, now + 0.01);
        gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
        osc.start(now);
        osc.stop(now + 0.1);
    } else if (type === 'coin') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(1200 + (pitchMultiplier*50), now);
        osc.frequency.exponentialRampToValueAtTime(2000 + (pitchMultiplier*50), now + 0.1);
        gainNode.gain.setValueAtTime(0, now);
        gainNode.gain.linearRampToValueAtTime(0.4, now + 0.02);
        gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
        osc.start(now);
        osc.stop(now + 0.2);
    } else if (type === 'web_break') {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(800, now);
        osc.frequency.exponentialRampToValueAtTime(100, now + 0.1);
        const filter = audioCtx.createBiquadFilter();
        filter.type = 'highpass';
        filter.frequency.value = 1000;
        osc.disconnect();
        osc.connect(filter);
        filter.connect(gainNode);
        gainNode.gain.setValueAtTime(0, now);
        gainNode.gain.linearRampToValueAtTime(0.2, now + 0.02);
        gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
        osc.start(now);
        osc.stop(now + 0.1);
    } else if (type === 'glass_shatter') {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(1500, now);
        osc.frequency.exponentialRampToValueAtTime(100, now + 0.1);
        gainNode.gain.setValueAtTime(0, now);
        gainNode.gain.linearRampToValueAtTime(0.4, now + 0.01);
        gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
        osc.start(now);
        osc.stop(now + 0.15);
    } else if (type === 'acid_burn') {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(100, now);
        osc.frequency.exponentialRampToValueAtTime(50, now + 0.2);
        gainNode.gain.setValueAtTime(0, now);
        gainNode.gain.linearRampToValueAtTime(0.3, now + 0.02);
        gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
        osc.start(now);
        osc.stop(now + 0.2);
    } else if (type === 'portal_warp') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(800, now);
        osc.frequency.exponentialRampToValueAtTime(200, now + 0.3);
        gainNode.gain.setValueAtTime(0, now);
        gainNode.gain.linearRampToValueAtTime(0.4, now + 0.05);
        gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
        osc.start(now);
        osc.stop(now + 0.3);
    } else if (type === 'void_suck') {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(50, now);
        osc.frequency.exponentialRampToValueAtTime(800, now + 0.5);
        gainNode.gain.setValueAtTime(0, now);
        gainNode.gain.linearRampToValueAtTime(0.5, now + 0.1);
        gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.5);
        osc.start(now);
        osc.stop(now + 0.5);
    }
}

const GRID_SIZE = 8; // Perfekte Balance: Groß, aber übersichtlich
const CELL_SIZE = canvas.width / GRID_SIZE;

let grid = [];
let fragments = [];
let particles = [];
let floatingTexts = [];
let coins = [];
let score = 0;
let dropsLeft = 10;
let progress = JSON.parse(localStorage.getItem('dewDropProgress')) || {
    unlockedLevels: 1,
    stars: {},
    totalCoins: 0,
    inventory: []
};
if (!progress.inventory) progress.inventory = [];
let totalCoins = progress.totalCoins || 0;

let activeSkill = null;
let comboCount = 0;
let level = 1;
let transitioning = false;
let slowMoFactor = 1.0;
let bosses = [];

const coinsDisplay = document.getElementById('coins-display');

function saveProgress() {
    progress.totalCoins = totalCoins;
    localStorage.setItem('dewDropProgress', JSON.stringify(progress));
}

window.resetProgress = function() {
    progress = { unlockedLevels: 1, stars: {}, totalCoins: 0 };
    totalCoins = 0;
    saveProgress();
    window.showMap();
};

const levelPositions = [
    { x: 30, y: 98 }, // 1
    { x: 60, y: 95 }, // 2
    { x: 80, y: 91 }, // 3
    { x: 50, y: 88 }, // 4
    { x: 20, y: 85 }, // 5
    { x: 15, y: 81 }, // 6
    { x: 40, y: 78 }, // 7
    { x: 70, y: 75 }, // 8
    { x: 85, y: 71 }, // 9
    { x: 65, y: 68 }, // 10 (Boss)
    { x: 35, y: 65 }, // 11
    { x: 15, y: 61 }, // 12
    { x: 30, y: 58 }, // 13
    { x: 60, y: 55 }, // 14
    { x: 50, y: 52 }, // 15 (Boss)
    { x: 75, y: 48 }, // 16
    { x: 85, y: 45 }, // 17
    { x: 60, y: 41 }, // 18
    { x: 30, y: 38 }, // 19
    { x: 15, y: 35 }, // 20 (Boss)
    { x: 35, y: 31 }, // 21
    { x: 65, y: 28 }, // 22
    { x: 80, y: 25 }, // 23
    { x: 50, y: 21 }, // 24
    { x: 25, y: 18 }, // 25 (Boss)
    { x: 10, y: 15 }, // 26
    { x: 30, y: 11 }, // 27
    { x: 60, y: 8 },  // 28
    { x: 85, y: 5 },  // 29
    { x: 50, y: 2 }   // 30 (Boss)
];

window.generateMap = function() {
    const container = document.getElementById('level-path-container');
    const svg = document.getElementById('path-lines');
    if (!container || !svg) return;
    
    container.querySelectorAll('.level-node').forEach(n => n.remove());
    
    // We assume container is 600px width and 2000px height based on CSS
    let w = 600;
    let h = 2000;
    
    let pathD = "";
    
    // Add Chapter Headers
    let chapter1 = document.createElement('div');
    chapter1.className = 'chapter-title';
    chapter1.style.top = '99%';
    chapter1.innerText = 'CHAPTER 1: THE WHISPERING GLADE';
    container.appendChild(chapter1);
    
    let chapter2 = document.createElement('div');
    chapter2.className = 'chapter-title chapter-crystal';
    chapter2.style.top = '49%';
    chapter2.innerText = 'CHAPTER 2: THE CRYSTAL CAVES';
    container.appendChild(chapter2);
    
    for (let i = 1; i <= 30; i++) {
        let pos = levelPositions[i-1];
        let px = (pos.x / 100) * w;
        let py = (pos.y / 100) * h;
        
        if (i === 1) pathD += `M ${px} ${py} `;
        else pathD += `L ${px} ${py} `;
        
        let node = document.createElement('div');
        let isLocked = i > progress.unlockedLevels;
        
        node.className = `level-node ${isLocked ? 'locked' : 'unlocked'}`;
        if (i >= 16) node.classList.add('crystal-node'); // Chapter 2 styling
        if (i % 5 === 0 && i >= 10) node.classList.add('boss');
        
        node.style.left = pos.x + '%';
        node.style.top = pos.y + '%';
        
        node.innerHTML = `<div>${i}</div>`;
        
        if (i === progress.unlockedLevels) {
            node.innerHTML += `<div class="current-player-marker">🧚‍♀️</div>`;
        }
        
        if (!isLocked && progress.stars[i] !== undefined) {
            let stars = progress.stars[i];
            let starHtml = '';
            for(let s=1; s<=3; s++) {
                starHtml += `<span class="${s <= stars ? 'earned' : ''}">★</span>`;
            }
            node.innerHTML += `<div class="stars-container">${starHtml}</div>`;
        } else if (!isLocked) {
            node.innerHTML += `<div class="stars-container">★★★</div>`;
        }
        
        if (!isLocked) {
            node.onclick = () => window.startGame(i);
        }
        container.appendChild(node);
    }
    
    svg.innerHTML = `
        <defs>
            <filter id="shadow" x="-10%" y="-10%" width="120%" height="120%">
                <feDropShadow dx="0" dy="5" stdDeviation="3" flood-opacity="0.6"/>
            </filter>
        </defs>
        <path d="${pathD}" fill="none" stroke="#2a140b" stroke-width="26" stroke-linecap="round" stroke-linejoin="round" filter="url(#shadow)"/>
        <path d="${pathD}" fill="none" stroke="#6e3e22" stroke-width="20" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="${pathD}" fill="none" stroke="#8c512d" stroke-width="16" stroke-linecap="round" stroke-linejoin="round" transform="translate(0, -2)"/>
        <path d="${pathD}" fill="none" stroke="#ffffff" stroke-width="10" stroke-dasharray="0, 30" stroke-linecap="round" stroke-linejoin="round" opacity="0.9" filter="url(#shadow)"/>
    `;
    
    setTimeout(() => {
        let currentPos = levelPositions[Math.min(29, progress.unlockedLevels - 1)].y;
        let scrollArea = document.getElementById('map-scroll-area');
        if (scrollArea) {
            let targetY = (currentPos / 100) * h;
            scrollArea.scrollTop = targetY - 250;
        }
    }, 50);
};

export function startGame(l: number) {
    document.querySelectorAll('.overlay').forEach(el => el.classList.remove('active'));
    if (typeof stopJackpot === 'function') stopJackpot();
    level = l;
    score = 0;
    dropsLeft = 10;
    activeSkill = null;
    transitioning = false;
    initGrid();
    updateHUD();
};

window.restartLevel = function() {
    document.querySelectorAll('.overlay').forEach(el => el.classList.remove('active'));
    if (typeof stopJackpot === 'function') stopJackpot();
    score = Math.floor(score * 0.5); 
    dropsLeft = 10;
    activeSkill = null;
    transitioning = false;
    initGrid();
    updateHUD();
};

window.nextLevel = function() {
    if (level < 30) {
        window.startGame(level + 1);
    } else {
        window.showMap();
    }
};

export function showMenu() {
    document.querySelectorAll('.overlay').forEach(el => el.classList.remove('active'));
    document.getElementById('map-screen').classList.add('active');
    if (typeof stopJackpot === 'function') stopJackpot();
    (window as any).generateMap();
}

export const showMap = showMenu;

window.activateSkill = function(skill) {
    if (activeSkill === skill) {
        activeSkill = null;
        updateHUD();
        return;
    }
    
    let cost = skill === 'hammer' ? 50 : skill === 'sunbeam' ? 100 : skill === 'rain' ? 150 : 200;
    if (totalCoins >= cost) {
        if (skill === 'rain') {
            totalCoins -= 150;
            dropsLeft += 5;
            playSound('grow', 2);
            activeSkill = null;
        } else {
            activeSkill = skill;
        }
        updateHUD();
    }
};

function initGrid() {
    grid = [];
    bosses = [];
    
    // Level Design Structure
    let config = LEVELS.find(l => l.id === level) || LEVELS[0];
    let features = config.features;
    
    if (config.boss) {
        bosses.push(new Boss(config.boss.type, config.boss.hp, config.boss.width, config.boss.height));
    }

    let emptiesForPortals = [];

    for (let r = 0; r < GRID_SIZE; r++) {
        let row = [];
        for (let c = 0; c < GRID_SIZE; c++) {
            let rand = Math.random();
            
            // Prevent spawning blocks under Boss
            let underBoss = false;
            bosses.forEach(b => {
                if (r >= b.r && r < b.r + b.height && c >= b.c && c < b.c + b.width) underBoss = true;
            });

            if (underBoss) {
                row.push({ type: 'empty' });
                continue;
            }

            if (rand < features.rocks) {
                row.push({ type: 'rock', hp: 3 });
            } else if (rand < features.rocks + (features.brambles || 0)) {
                row.push({ type: 'bramble', hp: 3 });
            } else if (rand < features.rocks + (features.brambles || 0) + features.mirrors) {
                row.push({ type: 'mirror', dir: Math.random() > 0.5 ? '/' : '\\' });
            } else if (rand < features.rocks + (features.brambles || 0) + features.mirrors + features.wind) {
                row.push({ type: 'wind', dir: ['up','down','left','right'][Math.floor(Math.random()*4)] });
            } else if (rand > 0.4) {
                let isWebbed = Math.random() < features.webs;
                let isFrozen = !isWebbed && Math.random() < features.ice;
                let el = features.elements[Math.floor(Math.random() * features.elements.length)];
                if (Math.random() > 0.3) el = 'water'; // Bias zu Wasser

                row.push({ type: 'drop', size: Math.floor(Math.random() * 3) + 1, webbed: isWebbed, frozen: isFrozen, element: el });
            } else {
                row.push({ type: 'empty' });
                emptiesForPortals.push({r, c});
            }
        }
        grid.push(row);
    }

    if (features.portals && emptiesForPortals.length >= 2) {
        emptiesForPortals.sort(() => Math.random() - 0.5);
        grid[emptiesForPortals[0].r][emptiesForPortals[0].c] = { type: 'portal', id: 1 };
        grid[emptiesForPortals[1].r][emptiesForPortals[1].c] = { type: 'portal', id: 2 };
    }
}

class Particle {
    constructor(x, y, color = null) {
        this.x = x;
        this.y = y;
        this.vx = (Math.random() - 0.5) * 4;
        this.vy = (Math.random() - 0.5) * 4;
        this.life = 1.0;
        this.decay = Math.random() * 0.05 + 0.02;
        this.color = color;
    }
    update(dt = 1.0) {
        this.x += this.vx * dt;
        this.y += this.vy * dt;
        this.life -= this.decay * dt;
    }
    draw(ctx) {
        if (this.color) {
            ctx.fillStyle = this.color;
            ctx.globalAlpha = Math.max(0, this.life);
        } else {
            ctx.fillStyle = `rgba(180, 255, 255, ${Math.max(0, this.life)})`;
        }
        ctx.beginPath();
        ctx.arc(this.x, this.y, 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1.0;
    }
}

class FloatingText {
    constructor(x, y, text, color, size = 20) {
        this.x = x;
        this.y = y;
        this.text = text;
        this.color = color;
        this.size = size;
        this.life = 1.0;
        this.vy = -1.5 - Math.random();
    }
    update(dt = 1.0) {
        this.y += this.vy * dt;
        this.life -= 0.02 * dt;
    }
    draw(ctx) {
        ctx.save();
        ctx.globalAlpha = Math.max(0, this.life);
        ctx.fillStyle = this.color;
        ctx.font = `bold ${this.size}px Inter`;
        ctx.textAlign = 'center';
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 3;
        ctx.strokeText(this.text, this.x, this.y);
        ctx.fillText(this.text, this.x, this.y);
        ctx.restore();
    }
}

class Coin {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.vx = (Math.random() - 0.5) * 12;
        this.vy = -Math.random() * 15 - 5;
        this.gravity = 0.6;
        this.rotation = Math.random() * Math.PI;
        this.spin = (Math.random() - 0.5) * 0.4;
    }
    update(dt = 1.0) {
        this.x += this.vx * dt;
        this.vy += this.gravity * dt;
        this.y += this.vy * dt;
        this.rotation += this.spin * dt;
    }
    draw(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.scale(Math.cos(this.rotation), 1);
        ctx.beginPath();
        ctx.arc(0, 0, 10, 0, Math.PI * 2);
        let grad = ctx.createLinearGradient(-10, -10, 10, 10);
        grad.addColorStop(0, '#ffee00');
        grad.addColorStop(1, '#ff8800');
        ctx.fillStyle = grad;
        ctx.fill();
        ctx.lineWidth = 2;
        ctx.strokeStyle = '#dd6600';
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(0, 0, 6, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
    }
}

class Fragment {
    constructor(x, y, dx, dy, color = '#ccffff', element = 'water', pierce = false) {
        this.x = x;
        this.y = y;
        this.dx = dx;
        this.dy = dy;
        this.speed = pierce ? 15 : 6;
        this.radius = pierce ? 4 : 6;
        this.active = true;
        this.color = color;
        this.element = element;
        this.pierce = pierce;
        this.hitCells = new Set();
    }

    update(dt = 1.0) {
        if (!this.active) return;
        
        let steps = Math.ceil(this.speed);
        for (let s = 0; s < steps; s++) {
            this.x += (this.dx * this.speed / steps) * dt;
            this.y += (this.dy * this.speed / steps) * dt;

            // Boss Kollision
            for (let i = bosses.length - 1; i >= 0; i--) {
                let b = bosses[i];
                let bx = b.c * CELL_SIZE;
                let by = b.r * CELL_SIZE;
                let bw = b.width * CELL_SIZE;
                let bh = b.height * CELL_SIZE;
                
                if (this.x >= bx && this.x <= bx + bw && this.y >= by && this.y <= by + bh) {
                    if (!this.hitCells.has('boss_' + i)) {
                        this.hitCells.add('boss_' + i);
                        let dmg = (this.element === 'fire' || this.element === 'lightning' || this.element === 'acid') ? 2 : 1;
                        b.hp -= dmg;
                        playSound('rock_hit');
                        spawnParticles(this.x, this.y, 15, b.color);
                        floatingTexts.push(new FloatingText(this.x, this.y, `-${dmg}`, '#ff0000', 20));
                        
                        if (!this.pierce) this.active = false;
                        
                        if (b.hp <= 0) {
                            score += 5000;
                            dropsLeft += 10;
                            totalCoins += 50;
                            floatingTexts.push(new FloatingText(bx + bw/2, by + bh/2, "BOSS DEFEATED!", '#ffff00', 40));
                            spawnParticles(bx + bw/2, by + bh/2, 100, b.color);
                            playSound('pop', 5);
                            triggerJackpot(bx + bw/2, by + bh/2, 50);
                            bosses.splice(i, 1);
                            
                            slowMoFactor = 0.2;
                            setTimeout(() => { slowMoFactor = 1.0; }, 1500);
                            updateHUD();
                        }
                        if (!this.active) return;
                    }
                }
            }

            const c = Math.floor(this.x / CELL_SIZE);
            const r = Math.floor(this.y / CELL_SIZE);

            if (r >= 0 && r < GRID_SIZE && c >= 0 && c < GRID_SIZE) {
                let centerX = c * CELL_SIZE + CELL_SIZE / 2;
                let centerY = r * CELL_SIZE + CELL_SIZE / 2;
                let dist = Math.hypot(this.x - centerX, this.y - centerY);
                let cell = grid[r][c];
                let cellKey = `${r},${c}`;

                if (cell.type === 'empty' && comboCount >= 8 && !this.hitCells.has(cellKey)) {
                    this.hitCells.add(cellKey);
                    if (Math.random() < 0.2) { 
                        spawnParticles(centerX, centerY, 3, '#ff00ff');
                    }
                }

                if (dist < 15 && cell.type !== 'empty' && !this.hitCells.has(cellKey)) {
                    if (cell.type === 'portal') {
                        if (!this.hitCells.has('portal_cooldown')) {
                            playSound('portal_warp');
                            spawnParticles(this.x, this.y, 10, '#aa00ff');
                            
                            for (let pr = 0; pr < GRID_SIZE; pr++) {
                                for (let pc = 0; pc < GRID_SIZE; pc++) {
                                    if (grid[pr][pc].type === 'portal' && (pr !== r || pc !== c)) {
                                        this.x = pc * CELL_SIZE + CELL_SIZE / 2 + (this.dx * 10);
                                        this.y = pr * CELL_SIZE + CELL_SIZE / 2 + (this.dy * 10);
                                        this.hitCells.add(`${pr},${pc}`);
                                        this.hitCells.add('portal_cooldown');
                                        spawnParticles(this.x, this.y, 10, '#aa00ff');
                                        break;
                                    }
                                }
                            }
                        }
                    } else if (cell.type === 'mirror') {
                        this.hitCells.add(cellKey);
                        playSound('rock_hit');
                        if (cell.dir === '/') {
                            let temp = this.dx; this.dx = -this.dy; this.dy = -temp;
                        } else {
                            let temp = this.dx; this.dx = this.dy; this.dy = temp;
                        }
                        this.x = centerX; this.y = centerY;
                        spawnParticles(this.x, this.y, 5, '#ffffff');
                    } else if (cell.type === 'wind') {
                        this.hitCells.add(cellKey);
                        if (cell.dir === 'up') { this.dx=0; this.dy=-1; }
                        else if (cell.dir === 'down') { this.dx=0; this.dy=1; }
                        else if (cell.dir === 'left') { this.dx=-1; this.dy=0; }
                        else if (cell.dir === 'right') { this.dx=1; this.dy=0; }
                        this.x = centerX; this.y = centerY;
                        this.speed = Math.min(this.speed + 4, 25);
                        spawnParticles(this.x, this.y, 5, '#aaffff');
                    } else {
                        if (!this.pierce || cell.type === 'rock' || cell.type === 'bramble') {
                            this.active = false;
                        }
                        this.hitCells.add(cellKey);
                        
                        if (cell.type === 'rock') {
                            if (this.element === 'acid') {
                                cell.hp = 0;
                            } else {
                                cell.hp -= (this.element === 'fire' ? 2 : 1);
                            }
                            playSound('rock_hit');
                            spawnParticles(this.x, this.y, 5, '#888888');
                            
                            if (cell.hp <= 0) {
                                grid[r][c] = { type: 'empty' };
                                score += 50;
                                floatingTexts.push(new FloatingText(centerX, centerY, "SMASH! +50", '#aaaaaa', 20));
                                spawnParticles(centerX, centerY, 15, '#aaaaaa');
                            }
                        } else if (cell.type === 'bramble') {
                            if (this.element === 'fire' || this.element === 'acid') {
                                cell.hp -= 2;
                            } else {
                                cell.hp -= 1;
                            }
                            playSound('web_break');
                            spawnParticles(this.x, this.y, 8, '#00ff00');
                            
                            if (cell.hp <= 0) {
                                grid[r][c] = { type: 'empty' };
                                score += 40;
                                floatingTexts.push(new FloatingText(centerX, centerY, "CLEARED! +40", '#00ff00', 20));
                                spawnParticles(centerX, centerY, 15, '#00ff00');
                            }
                        } else if (cell.type === 'drop') {
                            if (this.element === 'acid') {
                                playSound('acid_burn');
                                spawnParticles(centerX, centerY, 10, '#00ff00');
                                if (cell.frozen || cell.webbed) {
                                    cell.frozen = false; cell.webbed = false;
                                    floatingTexts.push(new FloatingText(centerX, centerY, "DISSOLVED!", '#00ff00', 15));
                                } else {
                                    cell.size--;
                                    floatingTexts.push(new FloatingText(centerX, centerY, "-1 SIZE!", '#00ff00', 15));
                                    if (cell.size <= 0) {
                                        grid[r][c] = { type: 'empty' };
                                        score += 100;
                                        floatingTexts.push(new FloatingText(centerX, centerY, "MELTED! +100", '#00ff00', 20));
                                    }
                                }
                            } else if (cell.frozen) {
                                if (this.element === 'fire' || this.element === 'lightning') {
                                    cell.frozen = false;
                                    playSound('glass_shatter');
                                    spawnParticles(centerX, centerY, 15, '#ccffff');
                                    floatingTexts.push(new FloatingText(centerX, centerY, "THAWED!", '#ff5500', 15));
                                } else {
                                    playSound('glass_shatter');
                                    spawnParticles(centerX, centerY, 5, '#ffffff');
                                    floatingTexts.push(new FloatingText(centerX, centerY, "ICE!", '#00ffff', 15));
                                }
                            } else if (cell.webbed) {
                                cell.webbed = false;
                                playSound('web_break');
                                spawnParticles(centerX, centerY, 8, '#ffffff');
                                floatingTexts.push(new FloatingText(centerX, centerY, "FREED!", '#ffffff', 15));
                            } else {
                                if (cell.overcharged) {
                                    cell.size++;
                                    if (cell.size >= 7) {
                                        explodeSuperNova(r, c);
                                    }
                                } else {
                                    cell.size++;
                                    if (cell.size >= 4) {
                                        explode(r, c);
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }

        if (this.x < 0 || this.x > canvas.width || this.y < 0 || this.y > canvas.height) {
            this.active = false;
        }
    }

    draw(ctx) {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        ctx.shadowBlur = 10;
        ctx.shadowColor = this.color;
        ctx.fill();
        ctx.shadowBlur = 0;
        ctx.closePath();
    }
}

function spawnParticles(x, y, count, color = null) {
    for (let i = 0; i < count; i++) {
        particles.push(new Particle(x, y, color));
    }
}

let jackpotInterval = null;

function triggerJackpot(x, y, amount) {
    totalCoins += amount;
    saveProgress();
    let visualAmount = Math.min(amount, 20);
    for(let i=0; i<visualAmount; i++) {
        coins.push(new Coin(x + (Math.random()-0.5)*100, y + (Math.random()-0.5)*100));
    }
}

function stopJackpot() {}

function explodeSuperNova(r, c) {
    grid[r][c] = { type: 'empty' };
    playSound('pop', 10);
    let centerX = c * CELL_SIZE + CELL_SIZE/2;
    let centerY = r * CELL_SIZE + CELL_SIZE/2;
    spawnParticles(centerX, centerY, 100, '#00ff00');
    floatingTexts.push(new FloatingText(centerX, centerY, "SUPER NOVA!", '#00ff00', 40));
    
    for(let i=-2; i<=2; i++) {
        for(let j=-2; j<=2; j++) {
            let nr = r + i, nc = c + j;
            if (nr>=0 && nr<GRID_SIZE && nc>=0 && nc<GRID_SIZE && grid[nr][nc].type !== 'portal') {
                if(grid[nr][nc].type === 'rock' || grid[nr][nc].type === 'bramble' || grid[nr][nc].type === 'drop') {
                    grid[nr][nc] = { type: 'empty' };
                    score += 200;
                    spawnParticles(nc*CELL_SIZE+CELL_SIZE/2, nr*CELL_SIZE+CELL_SIZE/2, 10, '#00ff00');
                }
            }
        }
    }
    
    let fragColor = '#00ff00';
    let dirs = [ [0,-1], [0,1], [-1,0], [1,0], [-1,-1], [1,-1], [-1,1], [1,1], 
                 [-0.5,-1], [0.5,-1], [-0.5,1], [0.5,1], [-1,-0.5], [-1,0.5], [1,-0.5], [1,0.5] ];
    dirs.forEach(d => {
        fragments.push(new Fragment(centerX, centerY, d[0], d[1], fragColor, 'acid', true));
    });
    
    let shake = 40;
    canvas.style.transform += ` translate(${(Math.random()-0.5)*shake}px, ${(Math.random()-0.5)*shake}px)`;
    setTimeout(() => { canvas.style.transform = 'translate(0px, 0px) scale(1)'; }, 100);
    updateHUD();
}

function explode(r, c) {
    let element = grid[r][c].element || 'water';
    grid[r][c] = { type: 'empty' };
    comboCount++;
    
    let points = (element === 'fire' || element === 'lightning' ? 20 : 10) * comboCount;
    score += points;
    
    playSound('pop', comboCount);

    let centerX = c * CELL_SIZE + CELL_SIZE / 2;
    let centerY = r * CELL_SIZE + CELL_SIZE / 2;

    floatingTexts.push(new FloatingText(centerX, centerY, `+${points}`, '#aaffaa', 20));
    
    if (comboCount > 1) {
        let comboSize = Math.min(20 + (comboCount * 2), 40);
        floatingTexts.push(new FloatingText(centerX, centerY - 25, `${comboCount}x COMBO!`, '#ffcc00', comboSize));
    }

    if (comboCount > 3) {
        dropsLeft++;
        floatingTexts.push(new FloatingText(centerX, centerY - 50, `+1 DROP!`, '#00ffff', 24));
    }
    
    if (comboCount >= 4) {
        playSound('coin', comboCount);
        for(let i=0; i< (comboCount * 2); i++) {
            coins.push(new Coin(centerX, centerY));
        }
    }

    if (element === 'void') {
        playSound('void_suck', comboCount);
        spawnParticles(centerX, centerY, 50, '#550055');
        floatingTexts.push(new FloatingText(centerX, centerY - 60, `VOID COLLAPSE!`, '#aa00ff', 30));
        
        let voidPoints = 0;
        for (let i = -1; i <= 1; i++) {
            for (let j = -1; j <= 1; j++) {
                let nr = r + i;
                let nc = c + j;
                if (nr >= 0 && nr < GRID_SIZE && nc >= 0 && nc < GRID_SIZE) {
                    if (grid[nr][nc].type !== 'empty' && grid[nr][nc].type !== 'portal') {
                        voidPoints += 500;
                        grid[nr][nc] = { type: 'empty' };
                        spawnParticles(nc * CELL_SIZE + CELL_SIZE/2, nr * CELL_SIZE + CELL_SIZE/2, 10, '#000000');
                    }
                }
            }
        }
        score += voidPoints;
        floatingTexts.push(new FloatingText(centerX, centerY, `+${voidPoints} MASS`, '#ff00ff', 25));
        canvas.style.transform = `scale(0.95)`;
        setTimeout(() => { canvas.style.transform = 'scale(1)'; }, 100);
        
    } else if (element === 'prism') {
        spawnParticles(centerX, centerY, 30, '#ffffff');
        floatingTexts.push(new FloatingText(centerX, centerY - 60, `PRISM BURST!`, '#ff00ff', 25));
        
        const elements = ['water', 'fire', 'lightning', 'acid'];
        const colors = ['#ccffff', '#ff8800', '#ffff00', '#00ff00'];
        const dirs = [ [0,-1], [0,1], [-1,0], [1,0], [-1,-1], [1,-1], [-1,1], [1,1] ];
        
        dirs.forEach(d => {
            let rnd = Math.floor(Math.random() * elements.length);
            let el = elements[rnd];
            let col = colors[rnd];
            let isPierce = (el === 'lightning');
            fragments.push(new Fragment(centerX, centerY, d[0], d[1], col, el, isPierce));
        });
        
        canvas.style.transform = `translate(${(Math.random()-0.5)*15}px, ${(Math.random()-0.5)*15}px)`;
        
    } else if (element === 'acid') {
        spawnParticles(centerX, centerY, 30, '#00ff00');
        floatingTexts.push(new FloatingText(centerX, centerY - 60, `ACID BURST!`, '#00ff00', 25));
        
        fragments.push(new Fragment(centerX, centerY, 0, -1, '#00ff00', 'acid'));
        fragments.push(new Fragment(centerX, centerY, 0, 1, '#00ff00', 'acid'));
        fragments.push(new Fragment(centerX, centerY, -1, 0, '#00ff00', 'acid'));
        fragments.push(new Fragment(centerX, centerY, 1, 0, '#00ff00', 'acid'));
        
    } else if (element === 'fire') {
        spawnParticles(centerX, centerY, 30, '#ff5500');
        floatingTexts.push(new FloatingText(centerX, centerY - 60, `FIRE NOVA!`, '#ff5500', 25));
        
        let fragColor = '#ff8800';
        fragments.push(new Fragment(centerX, centerY, 0, -1, fragColor, 'fire'));
        fragments.push(new Fragment(centerX, centerY, 0, 1, fragColor, 'fire'));
        fragments.push(new Fragment(centerX, centerY, -1, 0, fragColor, 'fire'));
        fragments.push(new Fragment(centerX, centerY, 1, 0, fragColor, 'fire'));
        fragments.push(new Fragment(centerX, centerY, -1, -1, fragColor, 'fire'));
        fragments.push(new Fragment(centerX, centerY, 1, -1, fragColor, 'fire'));
        fragments.push(new Fragment(centerX, centerY, -1, 1, fragColor, 'fire'));
        fragments.push(new Fragment(centerX, centerY, 1, 1, fragColor, 'fire'));
        
        canvas.style.transform = `translate(${(Math.random()-0.5)*20}px, ${(Math.random()-0.5)*20}px)`;
    } else if (element === 'lightning') {
        spawnParticles(centerX, centerY, 30, '#ffff00');
        floatingTexts.push(new FloatingText(centerX, centerY - 60, `ZAP!`, '#ffff00', 25));
        playSound('laser', comboCount);
        
        let fragColor = '#ffff00';
        fragments.push(new Fragment(centerX, centerY, 0, -1, fragColor, 'lightning', true));
        fragments.push(new Fragment(centerX, centerY, 0, 1, fragColor, 'lightning', true));
        fragments.push(new Fragment(centerX, centerY, -1, 0, fragColor, 'lightning', true));
        fragments.push(new Fragment(centerX, centerY, 1, 0, fragColor, 'lightning', true));
        
        canvas.style.transform = `translate(${(Math.random()-0.5)*15}px, ${(Math.random()-0.5)*15}px)`;
    } else {
        spawnParticles(centerX, centerY, 20);
        fragments.push(new Fragment(centerX, centerY, 0, -1, '#ccffff', 'water'));
        fragments.push(new Fragment(centerX, centerY, 0, 1, '#ccffff', 'water'));
        fragments.push(new Fragment(centerX, centerY, -1, 0, '#ccffff', 'water'));
        fragments.push(new Fragment(centerX, centerY, 1, 0, '#ccffff', 'water'));
        
        let shake = Math.min(comboCount * 1.5, 20);
        canvas.style.transform += ` translate(${(Math.random()-0.5)*shake}px, ${(Math.random()-0.5)*shake}px)`;
    }

    setTimeout(() => { canvas.style.transform = 'translate(0px, 0px) scale(1)'; }, 50);

    updateHUD();
}

canvas.addEventListener('click', (e) => {
    if (dropsLeft <= 0 || transitioning) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const c = Math.floor(x / CELL_SIZE);
    const r = Math.floor(y / CELL_SIZE);

    if (r >= 0 && r < GRID_SIZE && c >= 0 && c < GRID_SIZE) {
        
        for (let i = 0; i < bosses.length; i++) {
            let b = bosses[i];
            if (r >= b.r && r < b.r + b.height && c >= b.c && c < b.c + b.width) {
                floatingTexts.push(new FloatingText(x, y, "BOSS IMMUNE", '#ff0000', 14));
                return;
            }
        }
        
        if (activeSkill) {
            if (activeSkill === 'hammer') {
                totalCoins -= 50;
                grid[r][c] = { type: 'empty' };
                spawnParticles(x, y, 20, '#ffffff');
                playSound('glass_shatter');
                floatingTexts.push(new FloatingText(x, y, "SMASH!", '#ffffff', 20));
            } else if (activeSkill === 'sunbeam') {
                totalCoins -= 100;
                for (let i = 0; i < GRID_SIZE; i++) {
                    if (grid[i][c].type === 'drop') {
                        grid[i][c].size++;
                        if (grid[i][c].size >= 4) {
                            setTimeout(() => explode(i, c), i * 50);
                        }
                    } else if (grid[i][c].type === 'empty') {
                        grid[i][c] = { type: 'drop', size: 1, element: 'water' };
                    }
                }
                playSound('laser');
            } else if (activeSkill === 'roots') {
                if (grid[r][c].type === 'drop') {
                    totalCoins -= 200;
                    grid[r][c].overcharged = true;
                    playSound('grow', 3);
                } else {
                    return;
                }
            }
            activeSkill = null;
            updateHUD();
            return;
        }

        let cell = grid[r][c];
        
        if (cell.type === 'empty' || cell.type === 'drop') {
            if (audioCtx.state === 'suspended') audioCtx.resume();

            if (cell.type === 'drop' && cell.webbed) {
                cell.webbed = false;
                dropsLeft--;
                comboCount = 0;
                playSound('web_break');
                updateHUD();
                return;
            }
            if (cell.type === 'drop' && cell.frozen) {
                cell.frozen = false;
                dropsLeft--;
                comboCount = 0;
                playSound('glass_shatter');
                updateHUD();
                return;
            }

            if (cell.type === 'empty') {
                grid[r][c] = { type: 'drop', size: 1, element: 'water' };
            } else {
                cell.size++;
            }
            
            dropsLeft--;
            comboCount = 0; 
            
            if (grid[r][c].overcharged) {
                if (grid[r][c].size >= 6) {
                    explodeSuperNova(r, c);
                } else {
                    playSound('grow', grid[r][c].size);
                }
            } else {
                if (grid[r][c].size >= 4) {
                    explode(r, c);
                } else {
                    playSound('grow', grid[r][c].size);
                }
            }
            
            bosses.forEach(b => b.takeTurn());
            
            updateHUD();
        } else if (cell.type === 'rock') {
            playSound('rock_hit');
            canvas.style.transform = `translate(${(Math.random()-0.5)*4}px, ${(Math.random()-0.5)*4}px)`;
            setTimeout(() => { canvas.style.transform = 'translate(0px, 0px)'; }, 50);
        } else if (cell.type === 'bramble') {
            playSound('web_break');
            canvas.style.transform = `translate(${(Math.random()-0.5)*2}px, ${(Math.random()-0.5)*2}px)`;
            setTimeout(() => { canvas.style.transform = 'translate(0px, 0px)'; }, 50);
        }
    }
});

function updateHUD() {
    let lvlDisp = document.getElementById('level-display-num');
    if(lvlDisp) lvlDisp.innerText = level;
    
    let dropsDisp = document.getElementById('drops-text');
    if(dropsDisp) dropsDisp.innerText = dropsLeft;
    
    let coinsDisp = document.getElementById('coins-display');
    if (coinsDisp) {
        coinsDisp.innerText = `🪙 ${totalCoins}`;
        saveProgress();
    }
    
    let fill = document.getElementById('star-fill');
    if(fill) {
        let percent = 0;
        if (dropsLeft >= 8) percent = 100;
        else if (dropsLeft >= 4) percent = 66;
        else if (dropsLeft >= 0) percent = 33;
        fill.style.width = percent + '%';
        
        let s1 = document.getElementById('star-1');
        let s2 = document.getElementById('star-2');
        let s3 = document.getElementById('star-3');
        if(s1) s1.className = `star-marker ${dropsLeft >= 0 ? 'filled' : ''}`;
        if(s2) s2.className = `star-marker ${dropsLeft >= 4 ? 'filled' : ''}`;
        if(s3) s3.className = `star-marker ${dropsLeft >= 8 ? 'filled' : ''}`;
    }
    
    ['hammer', 'sunbeam', 'rain', 'roots'].forEach(id => {
        let btn = document.getElementById('btn-' + id);
        if(btn) {
            let cost = id === 'hammer' ? 50 : id === 'sunbeam' ? 100 : id === 'rain' ? 150 : 200;
            btn.disabled = totalCoins < cost;
            if (activeSkill === id) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        }
    });
}

function drawGrid() {
    for (let r = 0; r < GRID_SIZE; r++) {
        for (let c = 0; c < GRID_SIZE; c++) {
            let x = c * CELL_SIZE;
            let y = r * CELL_SIZE;

            ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
            ctx.lineWidth = 1;
            ctx.strokeRect(x, y, CELL_SIZE, CELL_SIZE);

            let cell = grid[r][c];
            let cx = x + CELL_SIZE / 2;
            let cy = y + CELL_SIZE / 2;

            if (cell.type === 'drop') {
                let radius = cell.size * 10 + 5;
                if (cell.size === 4) radius = 38;
                if (cell.size === 3) radius += Math.sin(Date.now() / 150) * 2;

                let baseColors = {
                    'water': { hue: 200, sat: 100, light: 50 },
                    'fire': { hue: 10, sat: 100, light: 50 },
                    'lightning': { hue: 50, sat: 100, light: 50 },
                    'acid': { hue: 130, sat: 100, light: 40 },
                    'prism': { hue: (Date.now() / 10) % 360, sat: 100, light: 60 },
                    'void': { hue: 280, sat: 100, light: 20 }
                };
                let c = baseColors[cell.element] || baseColors['water'];

                ctx.shadowBlur = cell.size * 5;
                ctx.shadowColor = `hsla(${c.hue}, ${c.sat}%, ${c.light}%, 0.8)`;

                // Main Bubble Body
                ctx.beginPath();
                ctx.arc(cx, cy, radius, 0, Math.PI * 2);
                let grad = ctx.createRadialGradient(cx, cy - radius/2, radius/4, cx, cy, radius);
                grad.addColorStop(0, `hsla(${c.hue}, ${c.sat}%, ${c.light + 30}%, 0.95)`);
                grad.addColorStop(0.7, `hsla(${c.hue}, ${c.sat}%, ${c.light}%, 0.85)`);
                grad.addColorStop(1, `hsla(${c.hue}, ${c.sat}%, ${Math.max(0, c.light - 30)}%, 0.95)`);
                ctx.fillStyle = grad;
                ctx.fill();
                ctx.shadowBlur = 0;

                // Top Specular Highlight (Crisp reflection)
                ctx.beginPath();
                ctx.ellipse(cx, cy - radius*0.5, radius*0.5, radius*0.2, 0, 0, Math.PI * 2);
                let topGrad = ctx.createLinearGradient(cx, cy - radius*0.7, cx, cy - radius*0.3);
                topGrad.addColorStop(0, 'rgba(255, 255, 255, 0.9)');
                topGrad.addColorStop(1, 'rgba(255, 255, 255, 0)');
                ctx.fillStyle = topGrad;
                ctx.fill();

                // Bottom Bounce Light (Liquid glass effect)
                ctx.beginPath();
                ctx.ellipse(cx, cy + radius*0.6, radius*0.4, radius*0.15, 0, 0, Math.PI * 2);
                ctx.fillStyle = `hsla(${c.hue}, ${c.sat}%, 80%, 0.4)`;
                ctx.fill();

                // Dark rim for definition
                ctx.beginPath();
                ctx.arc(cx, cy, radius, 0, Math.PI * 2);
                ctx.strokeStyle = `hsla(${c.hue}, ${c.sat}%, 10%, 0.5)`;
                ctx.lineWidth = 1;
                ctx.stroke();

                if (cell.webbed) {
                    ctx.beginPath();
                    ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
                    ctx.lineWidth = 1.5;
                    ctx.moveTo(cx - radius, cy); ctx.lineTo(cx + radius, cy);
                    ctx.moveTo(cx, cy - radius); ctx.lineTo(cx, cy + radius);
                    ctx.moveTo(cx - radius*0.7, cy - radius*0.7); ctx.lineTo(cx + radius*0.7, cy + radius*0.7);
                    ctx.moveTo(cx - radius*0.7, cy + radius*0.7); ctx.lineTo(cx + radius*0.7, cy - radius*0.7);
                    ctx.stroke();
                    ctx.beginPath();
                    ctx.arc(cx, cy, radius * 0.4, 0, Math.PI * 2);
                    ctx.stroke();
                    ctx.beginPath();
                    ctx.arc(cx, cy, radius * 0.8, 0, Math.PI * 2);
                    ctx.stroke();
                }

                if (cell.overcharged) {
                    ctx.beginPath();
                    ctx.strokeStyle = '#00ff00';
                    ctx.lineWidth = 3;
                    ctx.arc(cx, cy, radius + 5, 0, Math.PI * 2);
                    ctx.stroke();
                    ctx.shadowBlur = 15;
                    ctx.shadowColor = '#00ff00';
                    ctx.stroke();
                    ctx.shadowBlur = 0;
                }

                if (cell.frozen) {
                    ctx.fillStyle = 'rgba(200, 255, 255, 0.4)';
                    ctx.fillRect(x + 4, y + 4, CELL_SIZE - 8, CELL_SIZE - 8);
                    ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
                    ctx.lineWidth = 2;
                    ctx.strokeRect(x + 4, y + 4, CELL_SIZE - 8, CELL_SIZE - 8);
                    ctx.beginPath();
                    ctx.moveTo(x + 8, y + 8);
                    ctx.lineTo(x + CELL_SIZE/2, y + 8);
                    ctx.stroke();
                }
                
            } else if (cell.type === 'portal') {
                ctx.beginPath();
                ctx.arc(cx, cy, 20, 0, Math.PI * 2);
                let gradient = ctx.createRadialGradient(cx, cy, 5, cx, cy, 20);
                gradient.addColorStop(0, '#000000');
                gradient.addColorStop(0.5, '#aa00ff');
                gradient.addColorStop(1, '#ff00ff');
                ctx.fillStyle = gradient;
                
                ctx.save();
                ctx.translate(cx, cy);
                ctx.rotate(Date.now() / 500);
                ctx.strokeStyle = '#ffffff';
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.moveTo(0,0); ctx.lineTo(20,0);
                ctx.moveTo(0,0); ctx.lineTo(-20,0);
                ctx.stroke();
                ctx.restore();
                
                ctx.shadowBlur = 15;
                ctx.shadowColor = '#ff00ff';
                ctx.fill();
                ctx.shadowBlur = 0;
            } else if (cell.type === 'mirror') {
                ctx.strokeStyle = '#aaffff';
                ctx.lineWidth = 4;
                ctx.beginPath();
                if (cell.dir === '/') {
                    ctx.moveTo(x + CELL_SIZE - 10, y + 10);
                    ctx.lineTo(x + 10, y + CELL_SIZE - 10);
                } else {
                    ctx.moveTo(x + 10, y + 10);
                    ctx.lineTo(x + CELL_SIZE - 10, y + CELL_SIZE - 10);
                }
                ctx.stroke();
                ctx.shadowBlur = 10;
                ctx.shadowColor = '#aaffff';
                ctx.stroke();
                ctx.shadowBlur = 0;
            } else if (cell.type === 'wind') {
                ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
                ctx.fillRect(x + 10, y + 10, CELL_SIZE - 20, CELL_SIZE - 20);
                ctx.fillStyle = '#ffffff';
                ctx.font = '24px Inter';
                ctx.textAlign = 'center';
                let arrow = cell.dir === 'up' ? '↑' : cell.dir === 'down' ? '↓' : cell.dir === 'left' ? '←' : '→';
                ctx.fillText(arrow, cx, cy + 8);
            } else if (cell.type === 'rock') {
                let radius = 18 + (cell.hp * 2);
                ctx.beginPath();
                ctx.arc(cx, cy, radius, 0, Math.PI * 2);
                let gradient = ctx.createRadialGradient(cx - radius/4, cy - radius/4, radius/10, cx, cy, radius);
                gradient.addColorStop(0, '#a0a0a0');
                gradient.addColorStop(1, '#4a4a4a');
                ctx.fillStyle = gradient;
                ctx.fill();
                
                ctx.strokeStyle = '#222';
                ctx.lineWidth = 2;
                if (cell.hp <= 2) {
                    ctx.beginPath();
                    ctx.moveTo(cx - 10, cy - 10);
                    ctx.lineTo(cx + 5, cy);
                    ctx.stroke();
                }
                if (cell.hp <= 1) {
                    ctx.beginPath();
                    ctx.moveTo(cx + 5, cy);
                    ctx.lineTo(cx + 10, cy + 15);
                    ctx.moveTo(cx, cy - 15);
                    ctx.lineTo(cx - 5, cy + 10);
                    ctx.stroke();
                }
            } else if (cell.type === 'bramble') {
                ctx.save();
                ctx.translate(cx, cy);
                // Rotate slightly based on coordinates for variation
                ctx.rotate((r * c) * 0.5);
                
                ctx.strokeStyle = '#1e5e2e'; // Dark green vines
                ctx.lineWidth = 4 + (cell.hp);
                ctx.lineCap = 'round';
                ctx.lineJoin = 'round';
                ctx.shadowBlur = 5;
                ctx.shadowColor = '#00ff00';
                
                // Draw vines
                ctx.beginPath();
                ctx.moveTo(-CELL_SIZE*0.4, -CELL_SIZE*0.4);
                ctx.quadraticCurveTo(0, -CELL_SIZE*0.1, CELL_SIZE*0.4, CELL_SIZE*0.4);
                
                if (cell.hp >= 2) {
                    ctx.moveTo(CELL_SIZE*0.4, -CELL_SIZE*0.4);
                    ctx.quadraticCurveTo(CELL_SIZE*0.1, 0, -CELL_SIZE*0.4, CELL_SIZE*0.4);
                }
                
                if (cell.hp >= 3) {
                    ctx.moveTo(-CELL_SIZE*0.4, 0);
                    ctx.quadraticCurveTo(0, CELL_SIZE*0.2, CELL_SIZE*0.4, 0);
                }
                ctx.stroke();
                
                // Draw magical purple thorns/buds
                ctx.fillStyle = '#aa00ff';
                ctx.shadowColor = '#ff00ff';
                for(let i=0; i<cell.hp * 2; i++) {
                    let angle = (i / (cell.hp * 2)) * Math.PI * 2;
                    let dist = CELL_SIZE * 0.25;
                    ctx.beginPath();
                    ctx.arc(Math.cos(angle) * dist, Math.sin(angle) * dist, 3 + cell.hp, 0, Math.PI * 2);
                    ctx.fill();
                }
                
                ctx.restore();
            }
        }
    }
}

function checkGameState() {
    let emptyCount = 0;
    for (let r = 0; r < GRID_SIZE; r++) {
        for (let c = 0; c < GRID_SIZE; c++) {
            if (grid[r][c].type === 'empty') emptyCount++;
        }
    }

    if (emptyCount === GRID_SIZE * GRID_SIZE && !transitioning && bosses.length === 0) {
        transitioning = true;
        
        let stars = 1;
        if (dropsLeft >= 8) stars = 3;
        else if (dropsLeft >= 4) stars = 2;
        
        progress.stars[level] = Math.max(progress.stars[level] || 0, stars);
        if (level === progress.unlockedLevels) {
            progress.unlockedLevels = Math.min(30, level + 1);
        }
        saveProgress();
        
        playSound('pop', 5);
        triggerJackpot(canvas.width / 2, canvas.height / 2, 30 + comboCount * 5);
        
        setTimeout(() => {
            document.getElementById('level-stats').innerText = `Score: ${score} | Drops Left: ${dropsLeft}`;
            let starDisplay = document.getElementById('star-display');
            starDisplay.innerHTML = '';
            for(let s=1; s<=3; s++) {
                starDisplay.innerHTML += s <= stars ? '⭐' : '⬛';
            }
            document.getElementById('level-complete').classList.add('active');
        }, 3000);
    } else if (dropsLeft <= 0 && fragments.length === 0 && !transitioning) {
        transitioning = true;
        slowMoFactor = 0.2;
        setTimeout(() => {
            slowMoFactor = 1.0;
            document.getElementById('final-score').innerText = `Final Score: ${score}`;
            document.getElementById('game-over').classList.add('active');
        }, 1500);
    }
}

function loop() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    if (comboCount >= 8) {
        let hue = (Date.now() / 5) % 360;
        ctx.fillStyle = `rgba(255, 255, 255, ${Math.abs(Math.sin(Date.now()/100))*0.05})`;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        canvas.style.boxShadow = `0 0 80px hsl(${hue}, 100%, 50%)`;
        
        ctx.save();
        ctx.globalAlpha = 0.3;
        ctx.font = 'bold 80px Inter';
        ctx.fillStyle = `hsl(${hue}, 100%, 50%)`;
        ctx.textAlign = 'center';
        ctx.fillText("FEVER MODE!", canvas.width/2, canvas.height/2);
        ctx.restore();
    } else {
        canvas.style.boxShadow = `inset 0 0 60px rgba(0, 0, 0, 0.7)`;
    }

    drawGrid();
    
    bosses.forEach(b => b.draw(ctx));

    for (let i = particles.length - 1; i >= 0; i--) {
        let p = particles[i];
        p.update(slowMoFactor);
        p.draw(ctx);
        if (p.life <= 0) particles.splice(i, 1);
    }
    
    for (let i = floatingTexts.length - 1; i >= 0; i--) {
        let ft = floatingTexts[i];
        ft.update(slowMoFactor);
        ft.draw(ctx);
        if (ft.life <= 0) floatingTexts.splice(i, 1);
    }
    
    for (let i = coins.length - 1; i >= 0; i--) {
        let c = coins[i];
        c.update(slowMoFactor);
        c.draw(ctx);
        if (c.y > canvas.height + 50) {
            totalCoins++;
            updateHUD();
            coins.splice(i, 1);
        }
    }

    for (let i = fragments.length - 1; i >= 0; i--) {
        let f = fragments[i];
        f.update(slowMoFactor);
        f.draw(ctx);
        if (!f.active) fragments.splice(i, 1);
    }

    checkGameState();

    requestAnimationFrame(loop);
}

class Boss {
    type: string;
    r: number;
    c: number;
    width: number;
    height: number;
    hp: number;
    maxHp: number;
    color: string;
    turnTimer: number;
    name: string;

    constructor(type, hp, width, height) {
        this.type = type;
        this.r = 2; // default spawn
        this.c = 2;
        this.width = width;
        this.height = height;
        this.hp = hp;
        this.maxHp = hp;
        this.turnTimer = 0;
        
        if (type === 'spider') {
            this.color = '#aa00ff';
            this.name = 'SHADOW SPIDER';
        } else if (type === 'bat') {
            this.color = '#00ffff';
            this.name = 'FROST BAT';
        } else if (type === 'crystal_golem') {
            this.color = '#ff00ff';
            this.name = 'CRYSTAL GOLEM';
        } else {
            this.color = '#ff0000';
            this.name = 'UNKNOWN BOSS';
        }
    }

    draw(ctx) {
        let x = this.c * CELL_SIZE;
        let y = this.r * CELL_SIZE;
        let w = this.width * CELL_SIZE;
        let h = this.height * CELL_SIZE;

        ctx.save();
        ctx.translate(x + w / 2, y + h / 2);

        // Body Shadow
        ctx.shadowBlur = 20;
        ctx.shadowColor = this.color;

        if (this.type === 'bat') {
            // Draw Bat
            ctx.fillStyle = '#110033';
            ctx.beginPath();
            // Wings
            ctx.moveTo(0, 0);
            ctx.quadraticCurveTo(-w, -h/2, -w, 0);
            ctx.quadraticCurveTo(-w/2, h/4, 0, h/3);
            ctx.moveTo(0, 0);
            ctx.quadraticCurveTo(w, -h/2, w, 0);
            ctx.quadraticCurveTo(w/2, h/4, 0, h/3);
            ctx.fill();
            
            // Body
            ctx.beginPath();
            ctx.arc(0, 0, w/4, 0, Math.PI * 2);
            ctx.fill();
            
            // Eyes
            ctx.fillStyle = this.color;
            ctx.beginPath();
            ctx.arc(-w/8, -h/8, 6, 0, Math.PI * 2);
            ctx.arc(w/8, -h/8, 6, 0, Math.PI * 2);
            ctx.fill();
        } else if (this.type === 'spider') {
            // Draw Spider
            ctx.strokeStyle = '#220022';
            ctx.lineWidth = 6;
            // Legs
            for (let i = 0; i < 4; i++) {
                let angle = (Math.PI / 4) * i - Math.PI / 8;
                ctx.beginPath();
                ctx.moveTo(0, 0);
                ctx.lineTo(Math.cos(angle) * w/1.5, Math.sin(angle) * h/1.5);
                ctx.moveTo(0, 0);
                ctx.lineTo(-Math.cos(angle) * w/1.5, Math.sin(angle) * h/1.5);
                ctx.stroke();
            }
            // Body
            ctx.fillStyle = '#1a001a';
            ctx.beginPath();
            ctx.arc(0, h/6, w/3, 0, Math.PI * 2); // Abdomen
            ctx.arc(0, -h/6, w/4, 0, Math.PI * 2); // Thorax
            ctx.fill();
            // Eyes
            ctx.fillStyle = this.color;
            ctx.beginPath();
            ctx.arc(-w/10, -h/4, 5, 0, Math.PI * 2);
            ctx.arc(w/10, -h/4, 5, 0, Math.PI * 2);
            ctx.fill();
        } else if (this.type === 'crystal_golem') {
            // Draw Crystal Golem
            ctx.fillStyle = '#2b0033';
            ctx.strokeStyle = this.color;
            ctx.lineWidth = 4;
            ctx.beginPath();
            ctx.moveTo(0, -h/2);
            ctx.lineTo(w/3, -h/4);
            ctx.lineTo(w/2, h/4);
            ctx.lineTo(0, h/2);
            ctx.lineTo(-w/2, h/4);
            ctx.lineTo(-w/3, -h/4);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();
            
            ctx.fillStyle = this.color;
            ctx.globalAlpha = 0.5;
            ctx.beginPath();
            ctx.moveTo(0, -h/2);
            ctx.lineTo(0, h/2);
            ctx.lineTo(w/2, h/4);
            ctx.fill();
            ctx.globalAlpha = 1.0;
        }

        ctx.restore();

        // Healthbar Background
        ctx.fillStyle = 'rgba(0,0,0,0.8)';
        ctx.fillRect(x, y - 20, w, 12);
        
        // Healthbar Fill
        ctx.fillStyle = '#00ff00';
        let hpRatio = Math.max(0, this.hp / this.maxHp);
        if (hpRatio < 0.3) ctx.fillStyle = '#ff0000';
        else if (hpRatio < 0.6) ctx.fillStyle = '#ffaa00';
        ctx.fillRect(x + 1, y - 19, (w - 2) * hpRatio, 10);
        
        // Boss Name
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 16px Inter';
        ctx.textAlign = 'center';
        ctx.shadowBlur = 4;
        ctx.shadowColor = '#000000';
        ctx.fillText(this.name, x + w/2, y - 25);
        ctx.shadowBlur = 0;
    }

    takeTurn() {
        this.turnTimer++;
        if (this.turnTimer >= 3) {
            this.turnTimer = 0;
            let dirs = [[-1,0],[1,0],[0,-1],[0,1]];
            let validDirs = dirs.filter(d => {
                let nr = this.r + d[0], nc = this.c + d[1];
                return nr >= 0 && nr + this.height <= GRID_SIZE && nc >= 0 && nc + this.width <= GRID_SIZE;
            });
            if (validDirs.length > 0) {
                let move = validDirs[Math.floor(Math.random() * validDirs.length)];
                this.r += move[0];
                this.c += move[1];
                playSound('grow', 1);
            }
            
            if (this.type === 'spider') {
                for (let i=-1; i<=this.height; i++) {
                    for (let j=-1; j<=this.width; j++) {
                        if (Math.random() < 0.25) {
                            let tr = this.r + i, tc = this.c + j;
                            if (tr >= 0 && tr < GRID_SIZE && tc >= 0 && tc < GRID_SIZE) {
                                if (grid[tr][tc].type === 'drop') {
                                    grid[tr][tc].webbed = true;
                                }
                            }
                        }
                    }
                }
            } else if (this.type === 'bat') {
                for (let i=-2; i<=this.height+1; i++) {
                    for (let j=-2; j<=this.width+1; j++) {
                        if (Math.random() < 0.1) {
                            let tr = this.r + i, tc = this.c + j;
                            if (tr >= 0 && tr < GRID_SIZE && tc >= 0 && tc < GRID_SIZE) {
                                if (grid[tr][tc].type === 'drop') {
                                    grid[tr][tc].frozen = true;
                                }
                            }
                        }
                    }
                }
            } else if (this.type === 'crystal_golem') {
                for (let i=0; i<3; i++) {
                    let tr = Math.floor(Math.random() * GRID_SIZE);
                    let tc = Math.floor(Math.random() * GRID_SIZE);
                    if (grid[tr][tc].type === 'empty' || grid[tr][tc].type === 'drop') {
                        grid[tr][tc] = { type: 'rock', hp: 3 };
                    }
                }
            }
        }
    }
}

export function initGame() {
    initGrid();
    updateHUD();
    (window as any).generateMap();
    loop();
}

// ---- BAZAAR LOGIC ----
(window as any).openShop = function() {
    document.getElementById('map-screen')?.classList.remove('active');
    document.getElementById('shop-screen')?.classList.add('active');
    renderShop();
};

(window as any).closeShop = function() {
    document.getElementById('shop-screen')?.classList.remove('active');
    document.getElementById('map-screen')?.classList.add('active');
};

function renderShop() {
    let container = document.getElementById('dynamic-shop-container');
    if (!container) return;
    container.innerHTML = '';
    
    SHOP_ITEMS.forEach(item => {
        let isOwned = progress.inventory.includes(item.id);
        let canAfford = totalCoins >= item.cost;
        let btnText = isOwned && item.type !== 'consumable' ? 'OWNED' : `${item.cost} 🪙`;
        let disabled = (isOwned && item.type !== 'consumable') || (!canAfford && !isOwned);
        
        let el = document.createElement('div');
        el.className = 'shop-item';
        el.style.opacity = disabled && !isOwned ? '0.5' : '1';
        el.innerHTML = `
            <div class="item-icon" style="color: ${item.color}">${item.icon}</div>
            <div class="item-name">${item.name}</div>
            <div class="item-amount" style="font-size: 12px; margin-bottom: 10px;">${item.description}</div>
            <button class="price-btn" style="background: ${disabled && !isOwned ? '#555' : isOwned && item.type !== 'consumable' ? '#00aa00' : '#44bbff'}" 
                ${disabled ? 'disabled' : ''} onclick="buyItem('${item.id}', ${item.cost}, '${item.type}')">${btnText}</button>
        `;
        container.appendChild(el);
    });
}

(window as any).buyItem = function(id: string, cost: number, type: string) {
    if (totalCoins >= cost) {
        totalCoins -= cost;
        if (type !== 'consumable') {
            progress.inventory.push(id);
        } else {
            // handle consumable adding
            if (id === 'consumable_rain') dropsLeft += 5;
        }
        saveProgress();
        playSound('coin', 1);
        
        let coinsDisplay = document.getElementById('coins-display');
        if (coinsDisplay) coinsDisplay.innerText = `🪙 ${totalCoins}`;
        
        renderShop();
    }
};
