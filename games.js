// ============================================================
//  LvlUp Pro — GAMES LIBRARY
//  Add, remove, or edit games here.
//
//  HOW TO ADD A GAME
//  -----------------
//  There are two types of games:
//
//  1. REMOTE  — loads an external website in an iframe.
//               Just give it a URL. Great for adding any
//               unblocked game site link.
//
//  2. INTERNAL — a game coded directly in JavaScript using
//               the canvas. More work, but no external site needed.
//
//  REMOTE GAME TEMPLATE (easiest — just paste a URL):
//
//    myGameKey: {
//        title: "My Game Title",      // shown in the header
//        type: "remote",
//        xpMultiplier: 10,            // XP awarded when the player exits
//        emoji: "🎮",                 // shown on the card thumbnail
//        color: "linear-gradient(135deg, #1a1a2e, #16213e)",  // card bg
//        url: "https://example.com/game"   // the game URL
//    },
//
//  INTERNAL GAME TEMPLATE (canvas-based):
//
//    myGameKey: {
//        title: "My Game Title",
//        type: "internal",
//        xpMultiplier: 10,
//        emoji: "🕹️",
//        color: "linear-gradient(135deg, #0f0c29, #302b63)",
//        init: function(canvas, ctx, onGameOver) {
//            // canvas — the <canvas> element
//            // ctx    — the 2D drawing context
//            // onGameOver(score) — call this when the game ends,
//            //                     passing the player's score
//            //
//            // Write your game loop here using requestAnimationFrame.
//            // Call onGameOver(score) when the player loses/wins.
//        }
//    },
//
//  AFTER ADDING A GAME:
//  1. Add a sidebar entry in index.html (search "Core Games")
//  2. Add a button in the overlay grid (search "game-grid-overlay")
//  3. Add a card in the Game Library grid (search "card-grid")
//  See the comments in the HTML for exact copy-paste snippets.
// ============================================================

const GamesLib = {

    dodger: {
        title: "NEON DODGER",
        type: "internal",
        xpMultiplier: 10,
        emoji: "🔷",
        color: "linear-gradient(135deg, #1e1b4b, #312e81)",
        init: function(canvas, ctx, onGameOver) {
            let running = true;
            let score = 0;
            let player = { x: 400, y: 250, r: 15, speed: 7 };
            let enemies = [];
            const keys = {};

            window._gameCleanup = () => { running = false; };

            window.onkeydown = e => keys[e.code] = true;
            window.onkeyup = e => keys[e.code] = false;

            function update() {
                if (!running) return;
                ctx.fillStyle = 'rgba(11, 15, 26, 0.2)';
                ctx.fillRect(0, 0, canvas.width, canvas.height);

                if ((keys['KeyW'] || keys['ArrowUp']) && player.y > player.r) player.y -= player.speed;
                if ((keys['KeyS'] || keys['ArrowDown']) && player.y < canvas.height - player.r) player.y += player.speed;
                if ((keys['KeyA'] || keys['ArrowLeft']) && player.x > player.r) player.x -= player.speed;
                if ((keys['KeyD'] || keys['ArrowRight']) && player.x < canvas.width - player.r) player.x += player.speed;

                ctx.shadowBlur = 15;
                ctx.shadowColor = '#6366f1';
                ctx.fillStyle = '#6366f1';
                ctx.beginPath();
                ctx.arc(player.x, player.y, player.r, 0, Math.PI * 2);
                ctx.fill();
                ctx.shadowBlur = 0;

                if (Math.random() < 0.04) {
                    enemies.push({ x: Math.random() * canvas.width, y: -20, s: 20, spd: 4 + Math.random() * 4 });
                }

                enemies.forEach((en, i) => {
                    en.y += en.spd;
                    ctx.fillStyle = '#ef4444';
                    ctx.fillRect(en.x, en.y, en.s, en.s);
                    let dx = player.x - (en.x + en.s / 2);
                    let dy = player.y - (en.y + en.s / 2);
                    if (Math.sqrt(dx * dx + dy * dy) < player.r + en.s / 2) {
                        running = false;
                        onGameOver(score);
                    }
                    if (en.y > canvas.height) { enemies.splice(i, 1); score++; }
                });

                ctx.fillStyle = "white";
                ctx.font = "bold 18px 'Share Tech Mono'";
                ctx.fillText(`SCORE: ${score}`, 20, 34);

                if (running) requestAnimationFrame(update);
            }
            update();
        }
    },

    zombie: {
        title: "DEAD ZONE",
        type: "internal",
        xpMultiplier: 5,
        emoji: "🧟",
        color: "linear-gradient(135deg, #1f0000, #4c0000)",
        init: function(canvas, ctx, onGameOver) {
            const arena = canvas.parentElement;
            let state = {
                hp: 100, score: 0, wave: 1, active: true,
                player: { x: 50, y: 50 }, zombies: [], keys: {}
            };




            window._gameCleanup = () => {
                state.active = false;
                document.querySelectorAll('.z-mob, .z-player').forEach(el => el.remove());
                window.removeEventListener('keydown', handleDown);
                window.removeEventListener('keyup', handleUp);
            };

            if (!document.getElementById('z-styles')) {
                const style = document.createElement('style');
                style.id = 'z-styles';
                style.textContent = `
                    .z-mob { position: absolute; width: 32px; height: 32px; background: #116622; border: 1px solid #22cc44; border-radius: 4px; transform: translate(-50%, -50%); display: flex; align-items: center; justify-content: center; z-index: 5; font-size: 16px; pointer-events:none; }
                    .z-player { position: absolute; width: 36px; height: 36px; background: #3399ff; border-radius: 50%; transform: translate(-50%, -50%); display: flex; align-items: center; justify-content: center; z-index: 10; font-size: 18px; pointer-events:none; }
                    .z-hit { background: #cc2200 !important; box-shadow: 0 0 20px #cc2200; }
                `;
                document.head.appendChild(style);
            }

            const pEl = document.createElement('div');
            pEl.className = "z-player"; pEl.innerHTML = "🧑";
            arena.appendChild(pEl);

            const handleDown = (e) => state.keys[e.code] = true;
            const handleUp = (e) => state.keys[e.code] = false;
            window.addEventListener('keydown', handleDown);
            window.addEventListener('keyup', handleUp);

            canvas.onclick = (e) => {
                if (!state.active) return;
                const rect = canvas.getBoundingClientRect();
                const cx = ((e.clientX - rect.left) / rect.width) * 100;
                const cy = ((e.clientY - rect.top) / rect.height) * 100;
                state.zombies.forEach((z, i) => {
                    if (Math.hypot(z.x - cx, z.y - cy) < 8) {
                        z.el.remove();
                        state.zombies.splice(i, 1);
                        state.score += 10;
                    }
                });
            };

            function spawn() {
                if (!state.active) return;
                const side = Math.floor(Math.random() * 4);
                let x, y;
                if (side === 0) { x = Math.random() * 100; y = -5; }
                else if (side === 1) { x = 105; y = Math.random() * 100; }
                else if (side === 2) { x = Math.random() * 100; y = 105; }
                else { x = -5; y = Math.random() * 100; }
                const el = document.createElement('div');
                el.className = "z-mob"; el.innerHTML = "🧟";
                arena.appendChild(el);
                state.zombies.push({ el, x, y, speed: 0.15 + (state.wave * 0.05) });
                setTimeout(spawn, Math.max(400, 1800 - (state.wave * 150)));
            }

            function loop() {
                if (!state.active) return;
                ctx.fillStyle = "#0e0e0e";
                ctx.fillRect(0, 0, canvas.width, canvas.height);
                const pSpd = 0.8;
                if (state.keys['KeyW']) state.player.y = Math.max(2, state.player.y - pSpd);
                if (state.keys['KeyS']) state.player.y = Math.min(98, state.player.y + pSpd);
                if (state.keys['KeyA']) state.player.x = Math.max(2, state.player.x - pSpd);
                if (state.keys['KeyD']) state.player.x = Math.min(98, state.player.x + pSpd);
                pEl.style.left = state.player.x + "%";
                pEl.style.top = state.player.y + "%";
                state.zombies.forEach(z => {
                    const angle = Math.atan2(state.player.y - z.y, state.player.x - z.x);
                    z.x += Math.cos(angle) * z.speed;
                    z.y += Math.sin(angle) * z.speed;
                    z.el.style.left = z.x + "%";
                    z.el.style.top = z.y + "%";
                    if (Math.hypot(state.player.x - z.x, state.player.y - z.y) < 4) {
                        state.hp -= 0.4;
                        pEl.classList.add('z-hit');
                        setTimeout(() => pEl.classList.remove('z-hit'), 50);
                    }
                });
                ctx.fillStyle = "white";
                ctx.font = "bold 18px 'Share Tech Mono'";
                ctx.fillText(`STABILITY: ${Math.ceil(state.hp)}%`, 20, 40);
                ctx.fillText(`KILLS: ${state.score / 10}`, 20, 68);
                if (state.hp <= 0) {
                    state.active = false;
                    pEl.remove();
                    state.zombies.forEach(z => z.el.remove());
                    window.removeEventListener('keydown', handleDown);
                    window.removeEventListener('keyup', handleUp);
                    onGameOver(state.score);
                } else {
                    requestAnimationFrame(loop);
                }
            }
            spawn();
            loop();
        }
    },

    snake: {
        title: "NEON SNAKE",
        type: "internal",
        xpMultiplier: 8,
        emoji: "🐍",
        color: "linear-gradient(135deg, #052e16, #14532d)",
        init: function(canvas, ctx, onGameOver) {
            const CELL = 20;
            const COLS = canvas.width / CELL;
            const ROWS = canvas.height / CELL;

            let snake = [{ x: 10, y: 12 }, { x: 9, y: 12 }, { x: 8, y: 12 }];
            let dir = { x: 1, y: 0 };
            let nextDir = { x: 1, y: 0 };
            let food = spawnFood();
            let score = 0;
            let running = true;
            let frameCount = 0;

            window._gameCleanup = () => {
                running = false;
                window.removeEventListener('keydown', handleKey);
            };

            function spawnFood() {
                let pos;
                do {
                    pos = { x: Math.floor(Math.random() * COLS), y: Math.floor(Math.random() * ROWS) };
                } while (snake.some(s => s.x === pos.x && s.y === pos.y));
                return pos;
            }

            const handleKey = (e) => {
                if (!running) return;
                if ((e.code === 'ArrowUp' || e.code === 'KeyW') && dir.y !== 1) nextDir = { x: 0, y: -1 };
                if ((e.code === 'ArrowDown' || e.code === 'KeyS') && dir.y !== -1) nextDir = { x: 0, y: 1 };
                if ((e.code === 'ArrowLeft' || e.code === 'KeyA') && dir.x !== 1) nextDir = { x: -1, y: 0 };
                if ((e.code === 'ArrowRight' || e.code === 'KeyD') && dir.x !== -1) nextDir = { x: 1, y: 0 };
            };
            window.addEventListener('keydown', handleKey);

            function drawGrid() {
                ctx.fillStyle = '#080c17';
                ctx.fillRect(0, 0, canvas.width, canvas.height);
                ctx.strokeStyle = 'rgba(99,102,241,0.04)';
                ctx.lineWidth = 1;
                for (let x = 0; x <= canvas.width; x += CELL) {
                    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, canvas.height); ctx.stroke();
                }
                for (let y = 0; y <= canvas.height; y += CELL) {
                    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(canvas.width, y); ctx.stroke();
                }
            }

            function drawFood() {
                const fx = food.x * CELL + CELL / 2;
                const fy = food.y * CELL + CELL / 2;
                const pulse = 0.7 + 0.3 * Math.sin(frameCount * 0.15);
                ctx.shadowBlur = 20 * pulse;
                ctx.shadowColor = '#ef4444';
                ctx.fillStyle = '#ef4444';
                ctx.beginPath();
                ctx.arc(fx, fy, (CELL / 2 - 3) * pulse, 0, Math.PI * 2);
                ctx.fill();
                ctx.shadowBlur = 0;
            }

            function roundRect(ctx, x, y, w, h, r) {
                ctx.beginPath();
                ctx.moveTo(x + r, y);
                ctx.lineTo(x + w - r, y);
                ctx.quadraticCurveTo(x + w, y, x + w, y + r);
                ctx.lineTo(x + w, y + h - r);
                ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
                ctx.lineTo(x + r, y + h);
                ctx.quadraticCurveTo(x, y + h, x, y + h - r);
                ctx.lineTo(x, y + r);
                ctx.quadraticCurveTo(x, y, x + r, y);
                ctx.closePath();
                ctx.fill();
            }

            function drawSnake() {
                snake.forEach((seg, i) => {
                    const isHead = i === 0;
                    const t = 1 - (i / snake.length) * 0.6;
                    const r = Math.floor(99 * t);
                    const g = Math.floor(102 * t);
                    const b = Math.floor(241 * t);
                    const pad = isHead ? 1 : 3;
                    const cornerR = isHead ? 6 : 4;
                    ctx.shadowBlur = isHead ? 18 : 8;
                    ctx.shadowColor = `rgba(${r},${g},${b},0.8)`;
                    ctx.fillStyle = isHead ? '#a5b4fc' : `rgb(${r},${g},${b})`;
                    roundRect(ctx, seg.x * CELL + pad, seg.y * CELL + pad, CELL - pad * 2, CELL - pad * 2, cornerR);
                    ctx.shadowBlur = 0;
                    if (isHead) {
                        ctx.fillStyle = '#080c17';
                        const ex = dir.x, ey = dir.y;
                        const cx = seg.x * CELL + CELL / 2;
                        const cy = seg.y * CELL + CELL / 2;
                        const offPerp = 4, offFwd = 4;
                        const e1x = cx + ey * offPerp + ex * offFwd;
                        const e1y = cy - ex * offPerp + ey * offFwd;
                        const e2x = cx - ey * offPerp + ex * offFwd;
                        const e2y = cy + ex * offPerp + ey * offFwd;
                        ctx.beginPath(); ctx.arc(e1x, e1y, 2, 0, Math.PI * 2); ctx.fill();
                        ctx.beginPath(); ctx.arc(e2x, e2y, 2, 0, Math.PI * 2); ctx.fill();
                    }
                });
            }

            function drawHUD() {
                ctx.fillStyle = 'rgba(8,12,23,0.7)';
                ctx.fillRect(0, 0, canvas.width, 36);
                ctx.fillStyle = '#f1f5f9';
                ctx.font = "bold 14px 'Share Tech Mono'";
                ctx.fillText(`SCORE: ${score}`, 16, 23);
                ctx.fillStyle = '#6366f1';
                ctx.fillText(`LENGTH: ${snake.length}`, 160, 23);
                const lvl = Math.floor(score / 5) + 1;
                ctx.fillStyle = '#10b981';
                ctx.fillText(`LVL: ${lvl}`, 320, 23);
                ctx.fillStyle = '#94a3b8';
                ctx.font = "12px 'Share Tech Mono'";
                ctx.fillText('WASD / ARROWS', canvas.width - 170, 23);
            }

            function loop() {
                if (!running) return;
                frameCount++;
                const currentSpeed = Math.max(4, 8 - Math.floor(score / 5));
                if (frameCount % currentSpeed === 0) {
                    dir = { ...nextDir };
                    const head = { x: snake[0].x + dir.x, y: snake[0].y + dir.y };
                    if (head.x < 0 || head.x >= COLS || head.y < 0 || head.y >= ROWS) {
                        running = false;
                        window.removeEventListener('keydown', handleKey);
                        onGameOver(score);
                        return;
                    }
                    if (snake.some(s => s.x === head.x && s.y === head.y)) {
                        running = false;
                        window.removeEventListener('keydown', handleKey);
                        onGameOver(score);
                        return;
                    }
                    snake.unshift(head);
                    if (head.x === food.x && head.y === food.y) {
                        score++;
                        food = spawnFood();
                    } else {
                        snake.pop();
                    }
                }
                drawGrid();
                drawFood();
                drawSnake();
                drawHUD();
                requestAnimationFrame(loop);
            }
            loop();
        }
    },

    warzone: {
        title: "VOID WARZONE",
        type: "internal",
        xpMultiplier: 12,
        emoji: "🎯",
        color: "linear-gradient(135deg, #1c0505, #450a0a)",
        init: function(canvas, ctx, onGameOver) {
            let running = true;
            let score = 0;
            let wave = 1;
            let frameCount = 0;
            let waveSpawned = 0;
            let waveTotal = 6;
            let betweenWaves = false;
            let betweenTimer = 0;

            const player = {
                x: canvas.width / 2, y: canvas.height / 2,
                r: 14, speed: 3.5, hp: 100, maxHp: 100,
                angle: 0, fireRate: 12, fireCooldown: 0,
                invincible: 0
            };

            let bullets = [];
            let enemies = [];
            let particles = [];
            const keys = {};
            let mouseX = canvas.width / 2, mouseY = canvas.height / 2;

            const handleKey = e => keys[e.code] = true;
            const handleKeyUp = e => keys[e.code] = false;
            const handleMove = e => {
                const rect = canvas.getBoundingClientRect();
                mouseX = (e.clientX - rect.left) * (canvas.width / rect.width);
                mouseY = (e.clientY - rect.top) * (canvas.height / rect.height);
            };
            const handleClick = e => { if (!running) return; shoot(); };

            window.addEventListener('keydown', handleKey);
            window.addEventListener('keyup', handleKeyUp);
            canvas.addEventListener('mousemove', handleMove);
            canvas.addEventListener('click', handleClick);

            function cleanup() {
                running = false;
                window.removeEventListener('keydown', handleKey);
                window.removeEventListener('keyup', handleKeyUp);
                canvas.removeEventListener('mousemove', handleMove);
                canvas.removeEventListener('click', handleClick);
                clearInterval(spawnInterval);
            }

            window._gameCleanup = cleanup;

            function shoot() {
                if (player.fireCooldown > 0) return;
                const angle = Math.atan2(mouseY - player.y, mouseX - player.x);
                bullets.push({
                    x: player.x + Math.cos(angle) * 20,
                    y: player.y + Math.sin(angle) * 20,
                    vx: Math.cos(angle) * 9,
                    vy: Math.sin(angle) * 9,
                    r: 4, life: 80
                });
                player.fireCooldown = player.fireRate;
                for (let i = 0; i < 5; i++) {
                    const a = angle + (Math.random() - 0.5) * 0.6;
                    particles.push({ x: player.x + Math.cos(angle) * 20, y: player.y + Math.sin(angle) * 20, vx: Math.cos(a) * 3, vy: Math.sin(a) * 3, life: 12, color: '#a5b4fc', r: 2 });
                }
            }

            const ENEMY_TYPES = {
                basic: { r: 13, speed: 1.2, hp: 1, color: '#ef4444', glow: '#ef4444', score: 1 },
                fast:  { r: 9,  speed: 2.4, hp: 1, color: '#f59e0b', glow: '#f59e0b', score: 2 },
                tank:  { r: 20, speed: 0.7, hp: 4, color: '#10b981', glow: '#10b981', score: 5 },
                drone: { r: 11, speed: 1.8, hp: 2, color: '#8b5cf6', glow: '#c4b5fd', score: 3 }
            };

            function spawnEnemy() {
                const side = Math.floor(Math.random() * 4);
                let x, y;
                const pad = 30;
                if (side === 0) { x = Math.random() * canvas.width; y = -pad; }
                else if (side === 1) { x = canvas.width + pad; y = Math.random() * canvas.height; }
                else if (side === 2) { x = Math.random() * canvas.width; y = canvas.height + pad; }
                else { x = -pad; y = Math.random() * canvas.height; }
                let type = 'basic';
                const r = Math.random();
                if (wave >= 3 && r < 0.15) type = 'tank';
                else if (wave >= 2 && r < 0.35) type = 'fast';
                else if (wave >= 4 && r < 0.5) type = 'drone';
                const t = ENEMY_TYPES[type];
                enemies.push({ x, y, r: t.r, speed: t.speed + wave * 0.08, hp: t.hp, maxHp: t.hp, color: t.color, glow: t.glow, score: t.score, type, angle: 0 });
                waveSpawned++;
            }

            function spawnParticles(x, y, color, count) {
                for (let i = 0; i < count; i++) {
                    const a = Math.random() * Math.PI * 2;
                    const spd = 1 + Math.random() * 4;
                    particles.push({ x, y, vx: Math.cos(a) * spd, vy: Math.sin(a) * spd, life: 20 + Math.random() * 20, color, r: 2 + Math.random() * 3 });
                }
            }

            function drawBg() {
                ctx.fillStyle = '#06080f';
                ctx.fillRect(0, 0, canvas.width, canvas.height);
                ctx.strokeStyle = 'rgba(99,102,241,0.05)';
                ctx.lineWidth = 1;
                const gs = 40;
                for (let x = 0; x < canvas.width; x += gs) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, canvas.height); ctx.stroke(); }
                for (let y = 0; y < canvas.height; y += gs) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(canvas.width, y); ctx.stroke(); }
            }

            function drawPlayer() {
                player.angle = Math.atan2(mouseY - player.y, mouseX - player.x);
                ctx.save();
                ctx.translate(player.x, player.y);
                ctx.rotate(player.angle);
                const flash = player.invincible > 0 && Math.floor(player.invincible / 3) % 2 === 0;
                ctx.shadowBlur = 20;
                ctx.shadowColor = '#6366f1';
                ctx.fillStyle = flash ? '#fff' : '#6366f1';
                ctx.beginPath();
                ctx.arc(0, 0, player.r, 0, Math.PI * 2);
                ctx.fill();
                ctx.fillStyle = '#a5b4fc';
                ctx.fillRect(6, -3, 14, 6);
                ctx.fillStyle = '#fff';
                ctx.beginPath();
                ctx.arc(0, 0, 5, 0, Math.PI * 2);
                ctx.fill();
                ctx.shadowBlur = 0;
                ctx.restore();
            }

            function drawEnemies() {
                enemies.forEach(en => {
                    ctx.save();
                    ctx.translate(en.x, en.y);
                    en.angle = Math.atan2(player.y - en.y, player.x - en.x);
                    ctx.rotate(en.angle);
                    ctx.shadowBlur = 15;
                    ctx.shadowColor = en.glow;
                    ctx.fillStyle = en.color;
                    if (en.type === 'tank') {
                        ctx.fillRect(-en.r, -en.r * 0.7, en.r * 2, en.r * 1.4);
                        ctx.fillStyle = '#064e3b';
                        ctx.fillRect(0, -4, en.r + 6, 8);
                    } else if (en.type === 'drone') {
                        ctx.beginPath();
                        ctx.moveTo(en.r, 0);
                        ctx.lineTo(-en.r * 0.6, -en.r * 0.8);
                        ctx.lineTo(-en.r * 0.3, 0);
                        ctx.lineTo(-en.r * 0.6, en.r * 0.8);
                        ctx.closePath();
                        ctx.fill();
                    } else {
                        ctx.beginPath();
                        ctx.arc(0, 0, en.r, 0, Math.PI * 2);
                        ctx.fill();
                        ctx.fillStyle = 'rgba(0,0,0,0.4)';
                        ctx.beginPath();
                        ctx.arc(0, 0, en.r * 0.4, 0, Math.PI * 2);
                        ctx.fill();
                    }
                    ctx.shadowBlur = 0;
                    ctx.restore();
                    if (en.maxHp > 1) {
                        const bw = en.r * 2.5;
                        ctx.fillStyle = 'rgba(0,0,0,0.6)';
                        ctx.fillRect(en.x - bw / 2, en.y - en.r - 10, bw, 4);
                        ctx.fillStyle = en.color;
                        ctx.fillRect(en.x - bw / 2, en.y - en.r - 10, bw * (en.hp / en.maxHp), 4);
                    }
                });
            }

            function drawBullets() {
                bullets.forEach(b => {
                    ctx.shadowBlur = 12;
                    ctx.shadowColor = '#a5b4fc';
                    ctx.fillStyle = '#e0e7ff';
                    ctx.beginPath();
                    ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
                    ctx.fill();
                    ctx.shadowBlur = 0;
                });
            }

            function drawParticles() {
                particles.forEach(p => {
                    ctx.globalAlpha = p.life / 40;
                    ctx.fillStyle = p.color;
                    ctx.beginPath();
                    ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
                    ctx.fill();
                });
                ctx.globalAlpha = 1;
            }

            function drawHUD() {
                ctx.fillStyle = 'rgba(6,8,15,0.8)';
                ctx.fillRect(0, 0, canvas.width, 44);
                const hpW = 180;
                ctx.fillStyle = 'rgba(255,255,255,0.1)';
                ctx.fillRect(16, 12, hpW, 14);
                const hpColor = player.hp > 50 ? '#10b981' : player.hp > 25 ? '#f59e0b' : '#ef4444';
                ctx.fillStyle = hpColor;
                ctx.fillRect(16, 12, hpW * (player.hp / player.maxHp), 14);
                ctx.fillStyle = '#fff';
                ctx.font = "bold 10px 'Share Tech Mono'";
                ctx.fillText(`HP ${Math.ceil(player.hp)}`, 20, 23);
                ctx.fillStyle = '#f1f5f9';
                ctx.font = "bold 14px 'Share Tech Mono'";
                ctx.fillText(`KILLS: ${score}`, 220, 28);
                ctx.fillStyle = '#6366f1';
                ctx.fillText(`WAVE: ${wave}`, 360, 28);
                ctx.fillStyle = '#ef4444';
                ctx.fillText(`ENEMIES: ${enemies.length}`, 480, 28);
                ctx.fillStyle = '#94a3b8';
                ctx.font = "11px 'Share Tech Mono'";
                ctx.fillText('WASD + CLICK TO SHOOT', canvas.width - 200, 28);
                if (betweenWaves) {
                    ctx.fillStyle = 'rgba(6,8,15,0.7)';
                    ctx.fillRect(0, canvas.height / 2 - 40, canvas.width, 80);
                    ctx.fillStyle = '#6366f1';
                    ctx.font = "bold 28px 'Syne', sans-serif";
                    ctx.textAlign = 'center';
                    ctx.fillText(`WAVE ${wave} INCOMING`, canvas.width / 2, canvas.height / 2 + 10);
                    ctx.textAlign = 'left';
                }
            }

            let spawnInterval = null;
            function startWave() {
                waveSpawned = 0;
                waveTotal = 6 + wave * 3;
                betweenWaves = false;
                const rate = Math.max(400, 1400 - wave * 100);
                spawnInterval = setInterval(() => {
                    if (!running) { clearInterval(spawnInterval); return; }
                    if (waveSpawned < waveTotal) spawnEnemy();
                }, rate);
            }

            function checkWaveComplete() {
                if (!betweenWaves && waveSpawned >= waveTotal && enemies.length === 0) {
                    betweenWaves = true;
                    betweenTimer = 120;
                    clearInterval(spawnInterval);
                    wave++;
                    player.hp = Math.min(player.maxHp, player.hp + 30);
                }
            }

            startWave();

            function loop() {
                if (!running) return;
                frameCount++;
                if (betweenWaves) { betweenTimer--; if (betweenTimer <= 0) startWave(); }
                if (keys['KeyW'] || keys['ArrowUp'])    player.y = Math.max(player.r, player.y - player.speed);
                if (keys['KeyS'] || keys['ArrowDown'])  player.y = Math.min(canvas.height - player.r, player.y + player.speed);
                if (keys['KeyA'] || keys['ArrowLeft'])  player.x = Math.max(player.r, player.x - player.speed);
                if (keys['KeyD'] || keys['ArrowRight']) player.x = Math.min(canvas.width - player.r, player.x + player.speed);
                if (keys['Space']) shoot();
                if (player.fireCooldown > 0) player.fireCooldown--;
                if (player.invincible > 0) player.invincible--;
                bullets.forEach(b => { b.x += b.vx; b.y += b.vy; b.life--; });
                bullets = bullets.filter(b => b.life > 0 && b.x > -10 && b.x < canvas.width + 10 && b.y > -10 && b.y < canvas.height + 10);
                enemies.forEach(en => {
                    const a = Math.atan2(player.y - en.y, player.x - en.x);
                    en.x += Math.cos(a) * en.speed;
                    en.y += Math.sin(a) * en.speed;
                });
                bullets.forEach((b, bi) => {
                    enemies.forEach((en, ei) => {
                        if (Math.hypot(b.x - en.x, b.y - en.y) < b.r + en.r) {
                            bullets.splice(bi, 1);
                            en.hp--;
                            spawnParticles(en.x, en.y, en.color, 5);
                            if (en.hp <= 0) {
                                spawnParticles(en.x, en.y, en.color, 18);
                                score += en.score;
                                enemies.splice(ei, 1);
                            }
                        }
                    });
                });
                if (player.invincible <= 0) {
                    enemies.forEach(en => {
                        if (Math.hypot(player.x - en.x, player.y - en.y) < player.r + en.r) {
                            player.hp -= 0.5;
                            player.invincible = 20;
                        }
                    });
                }
                particles.forEach(p => { p.x += p.vx; p.y += p.vy; p.life--; p.vx *= 0.92; p.vy *= 0.92; });
                particles = particles.filter(p => p.life > 0);
                checkWaveComplete();
                if (player.hp <= 0) {
                    cleanup();
                    onGameOver(score);
                    return;
                }
                drawBg();
                drawParticles();
                drawBullets();
                drawEnemies();
                drawPlayer();
                drawHUD();
                requestAnimationFrame(loop);
            }
            loop();
        }
    },

    pingpong: {
        title: "PING PONG",
        type: "internal",
        xpMultiplier: 8,
        emoji: "🏓",
        color: "linear-gradient(135deg, #0f0c29, #302b63)",
        init: function(canvas, ctx, onGameOver) {
            const W = canvas.width, H = canvas.height;
            const PADDLE_W = 12, PADDLE_H = 90, BALL_SIZE = 10, SPEED = 5;

            let running = true;
            let playerScore = 0, aiScore = 0;
            const WIN_SCORE = 7;

            const player = { x: 30, y: H / 2 - PADDLE_H / 2, w: PADDLE_W, h: PADDLE_H, speed: 6 };
            const ai     = { x: W - 30 - PADDLE_W, y: H / 2 - PADDLE_H / 2, w: PADDLE_W, h: PADDLE_H, speed: 4 };
            const ball   = { x: W / 2, y: H / 2, vx: SPEED, vy: SPEED * (Math.random() > 0.5 ? 1 : -1), r: BALL_SIZE };

            const keys = {};
            const handleKey = e => keys[e.code] = true;
            const handleKeyUp = e => keys[e.code] = false;
            window.addEventListener('keydown', handleKey);
            window.addEventListener('keyup', handleKeyUp);

            window._gameCleanup = () => {
                running = false;
                window.removeEventListener('keydown', handleKey);
                window.removeEventListener('keyup', handleKeyUp);
            };

            function resetBall(dir) {
                ball.x = W / 2; ball.y = H / 2;
                ball.vx = SPEED * dir;
                ball.vy = SPEED * (Math.random() > 0.5 ? 1 : -1);
            }

            function drawPaddle(p) {
                ctx.fillStyle = '#6366f1';
                ctx.shadowBlur = 12;
                ctx.shadowColor = '#6366f1';
                ctx.beginPath();
                ctx.roundRect(p.x, p.y, p.w, p.h, 6);
                ctx.fill();
                ctx.shadowBlur = 0;
            }

            function drawBall() {
                ctx.fillStyle = '#fff';
                ctx.shadowBlur = 16;
                ctx.shadowColor = '#a5b4fc';
                ctx.beginPath();
                ctx.arc(ball.x, ball.y, ball.r, 0, Math.PI * 2);
                ctx.fill();
                ctx.shadowBlur = 0;
            }

            function drawNet() {
                ctx.setLineDash([10, 14]);
                ctx.strokeStyle = 'rgba(255,255,255,0.1)';
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.moveTo(W / 2, 0);
                ctx.lineTo(W / 2, H);
                ctx.stroke();
                ctx.setLineDash([]);
            }

            function drawScore() {
                ctx.fillStyle = 'rgba(255,255,255,0.08)';
                ctx.fillRect(0, 0, W, 48);
                ctx.fillStyle = '#f1f5f9';
                ctx.font = "bold 28px 'Share Tech Mono'";
                ctx.textAlign = 'center';
                ctx.fillText(playerScore, W / 2 - 80, 34);
                ctx.fillText(aiScore, W / 2 + 80, 34);
                ctx.fillStyle = '#64748b';
                ctx.font = "11px 'Share Tech Mono'";
                ctx.fillText('YOU', W / 2 - 80, 16);
                ctx.fillText('CPU', W / 2 + 80, 16);
                ctx.fillStyle = '#334155';
                ctx.font = "20px 'Share Tech Mono'";
                ctx.fillText(':', W / 2, 34);
                ctx.textAlign = 'left';
            }

            function loop() {
                if (!running) return;
                ctx.fillStyle = '#06080f';
                ctx.fillRect(0, 0, W, H);
                drawNet();
                if ((keys['ArrowUp'] || keys['KeyW']) && player.y > 48) player.y -= player.speed;
                if ((keys['ArrowDown'] || keys['KeyS']) && player.y < H - player.h) player.y += player.speed;
                const aiCenter = ai.y + ai.h / 2;
                if (aiCenter < ball.y - 6) ai.y += ai.speed;
                else if (aiCenter > ball.y + 6) ai.y -= ai.speed;
                ai.y = Math.max(48, Math.min(H - ai.h, ai.y));
                ball.x += ball.vx;
                ball.y += ball.vy;
                if (ball.y - ball.r < 48) { ball.y = 48 + ball.r; ball.vy *= -1; }
                if (ball.y + ball.r > H) { ball.y = H - ball.r; ball.vy *= -1; }
                if (ball.vx < 0 && ball.x - ball.r < player.x + player.w && ball.x + ball.r > player.x && ball.y > player.y && ball.y < player.y + player.h) {
                    ball.x = player.x + player.w + ball.r;
                    const hitPos = (ball.y - (player.y + player.h / 2)) / (player.h / 2);
                    ball.vy = hitPos * 7;
                    ball.vx = Math.abs(ball.vx) * 1.05;
                    if (ball.vx > 14) ball.vx = 14;
                }
                if (ball.vx > 0 && ball.x + ball.r > ai.x && ball.x - ball.r < ai.x + ai.w && ball.y > ai.y && ball.y < ai.y + ai.h) {
                    ball.x = ai.x - ball.r;
                    const hitPos = (ball.y - (ai.y + ai.h / 2)) / (ai.h / 2);
                    ball.vy = hitPos * 7;
                    ball.vx = -Math.abs(ball.vx);
                }
                if (ball.x < 0) {
                    aiScore++;
                    if (aiScore >= WIN_SCORE) { running = false; window.removeEventListener('keydown', handleKey); window.removeEventListener('keyup', handleKeyUp); onGameOver(playerScore); return; }
                    resetBall(1);
                }
                if (ball.x > W) {
                    playerScore++;
                    if (playerScore >= WIN_SCORE) { running = false; window.removeEventListener('keydown', handleKey); window.removeEventListener('keyup', handleKeyUp); onGameOver(playerScore * 10); return; }
                    resetBall(-1);
                }
                drawPaddle(player);
                drawPaddle(ai);
                drawBall();
                drawScore();
                ctx.fillStyle = '#1e293b';
                ctx.font = "11px 'Share Tech Mono'";
                ctx.textAlign = 'center';
                ctx.fillText('W / S  or  ↑ / ↓  to move', W / 2, H - 10);
                ctx.textAlign = 'left';
                requestAnimationFrame(loop);
            }
            loop();
        }
    },

    pacman: {
        title: "Pacman",
        type: "internal",
        xpMultiplier: 12,
        emoji: "🟡",
        color: "linear-gradient(135deg, #000428, #004e92)",
        init: function(canvas, ctx, onGameOver) {
            let running = true;
            let score = 0;
            const TILE_SIZE = 20;

            const map = [
                [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
                [1,2,2,2,2,2,2,2,2,1,2,2,2,2,2,2,2,2,1],
                [1,2,1,1,2,1,1,1,2,1,2,1,1,1,2,1,1,2,1],
                [1,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,1],
                [1,2,1,1,2,1,2,1,1,1,1,1,2,1,2,1,1,2,1],
                [1,2,2,2,2,1,2,2,2,1,2,2,2,1,2,2,2,2,1],
                [1,1,1,1,2,1,1,1,0,1,0,1,1,1,2,1,1,1,1],
                [0,0,0,1,2,1,0,0,0,0,0,0,0,1,2,1,0,0,0],
                [1,1,1,1,2,1,0,1,1,0,1,1,0,1,2,1,1,1,1],
                [0,0,0,0,2,0,0,1,0,0,0,1,0,0,2,0,0,0,0],
                [1,1,1,1,2,1,0,1,1,1,1,1,0,1,2,1,1,1,1],
                [0,0,0,1,2,1,0,0,0,0,0,0,0,1,2,1,0,0,0],
                [1,1,1,1,2,1,2,1,1,1,1,1,2,1,2,1,1,1,1],
                [1,2,2,2,2,2,2,2,2,1,2,2,2,2,2,2,2,2,1],
                [1,2,1,1,2,1,1,1,2,1,2,1,1,1,2,1,1,2,1],
                [1,2,2,1,2,2,2,2,2,0,2,2,2,2,2,1,2,2,1],
                [1,1,2,1,2,1,2,1,1,1,1,1,2,1,2,1,2,1,1],
                [1,2,2,2,2,1,2,2,2,1,2,2,2,1,2,2,2,2,1],
                [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1]
            ];

            const keys = {};
            window._gameCleanup = () => { running = false; };
            window.onkeydown = e => keys[e.code] = true;
            window.onkeyup = e => keys[e.code] = false;

            class Entity {
                constructor(x, y, radius, speed) {
                    this.x = x * TILE_SIZE + TILE_SIZE / 2;
                    this.y = y * TILE_SIZE + TILE_SIZE / 2;
                    this.radius = radius;
                    this.speed = speed;
                    this.vx = 0; this.vy = 0;
                }
                checkCollision(nx, ny) {
                    let m = this.radius - 2;
                    let l = Math.floor((nx - m) / TILE_SIZE), r = Math.floor((nx + m) / TILE_SIZE);
                    let t = Math.floor((ny - m) / TILE_SIZE), b = Math.floor((ny + m) / TILE_SIZE);
                    for (let row = t; row <= b; row++) {
                        for (let col = l; col <= r; col++) {
                            if (map[row] && map[row][col] === 1) return true;
                        }
                    }
                    return false;
                }
            }

            const player = new Entity(9, 15, 8, 2.5);
            const ghosts = [
                { x: 9, y: 9, color: '#ef4444', vx: 1, vy: 0 },
                { x: 8, y: 9, color: '#fb7185', vx: -1, vy: 0 },
                { x: 10, y: 9, color: '#22d3ee', vx: 0, vy: 1 }
            ].map(g => {
                let ghost = new Entity(g.x, g.y, 8, 1.8);
                ghost.color = g.color; ghost.vx = g.vx; ghost.vy = g.vy;
                return ghost;
            });

            function update() {
                if (!running) return;
                let nextVx = 0, nextVy = 0;
                if (keys['ArrowUp'] || keys['KeyW']) nextVy = -1;
                else if (keys['ArrowDown'] || keys['KeyS']) nextVy = 1;
                else if (keys['ArrowLeft'] || keys['KeyA']) nextVx = -1;
                else if (keys['ArrowRight'] || keys['KeyD']) nextVx = 1;
                if ((nextVx !== 0 || nextVy !== 0) && !player.checkCollision(player.x + nextVx * player.speed, player.y + nextVy * player.speed)) {
                    player.vx = nextVx; player.vy = nextVy;
                    if (player.vx !== 0) player.y = Math.floor(player.y / TILE_SIZE) * TILE_SIZE + TILE_SIZE / 2;
                    if (player.vy !== 0) player.x = Math.floor(player.x / TILE_SIZE) * TILE_SIZE + TILE_SIZE / 2;
                }
                if (!player.checkCollision(player.x + player.vx * player.speed, player.y + player.vy * player.speed)) {
                    player.x += player.vx * player.speed;
                    player.y += player.vy * player.speed;
                }
                if (player.x < 0) player.x = canvas.width;
                if (player.x > canvas.width) player.x = 0;
                let gx = Math.floor(player.x / TILE_SIZE), gy = Math.floor(player.y / TILE_SIZE);
                if (map[gy] && map[gy][gx] === 2) { map[gy][gx] = 0; score += 10; }
                ctx.fillStyle = "#06080f";
                ctx.fillRect(0, 0, canvas.width, canvas.height);
                for (let r = 0; r < map.length; r++) {
                    for (let c = 0; c < map[r].length; c++) {
                        if (map[r][c] === 1) {
                            ctx.fillStyle = "#1e1b4b";
                            ctx.fillRect(c * TILE_SIZE, r * TILE_SIZE, TILE_SIZE, TILE_SIZE);
                        } else if (map[r][c] === 2) {
                            ctx.fillStyle = "#fde047";
                            ctx.beginPath(); ctx.arc(c * TILE_SIZE + 10, r * TILE_SIZE + 10, 2, 0, Math.PI * 2); ctx.fill();
                        }
                    }
                }
                ghosts.forEach(g => {
                    if (g.checkCollision(g.x + g.vx * g.speed, g.y + g.vy * g.speed)) {
                        const moves = [{ x: 1, y: 0 }, { x: -1, y: 0 }, { x: 0, y: 1 }, { x: 0, y: -1 }];
                        const valid = moves.filter(m => !g.checkCollision(g.x + m.x * g.speed, g.y + m.y * g.speed));
                        const pick = valid[Math.floor(Math.random() * valid.length)];
                        g.vx = pick.x; g.vy = pick.y;
                    }
                    g.x += g.vx * g.speed; g.y += g.vy * g.speed;
                    ctx.fillStyle = g.color;
                    ctx.beginPath(); ctx.arc(g.x, g.y, g.radius, 0, Math.PI * 2); ctx.fill();
                    if (Math.hypot(player.x - g.x, player.y - g.y) < 12) {
                        running = false;
                        onGameOver(score);
                    }
                });
                ctx.fillStyle = "#fde047";
                ctx.beginPath(); ctx.arc(player.x, player.y, player.radius, 0, Math.PI * 2); ctx.fill();
                ctx.fillStyle = "white";
                ctx.font = "bold 18px 'Share Tech Mono'";
                ctx.fillText(`SCORE: ${score}`, 20, 30);
                if (running) requestAnimationFrame(update);
            }
            update();
        }
    },

    asteroidDodge: {
        title: "Asteroid Dodge",
        type: "internal",
        xpMultiplier: 10,
        emoji: "🚀",
        color: "linear-gradient(135deg, #050a14, #0c1a3a)",
        init: function(canvas, ctx, onGameOver) {
            const W = canvas.width, H = canvas.height;
            let state = 'playing';
            let score = 0, lives = 3, wave = 1;
            let ship, bullets, asteroids, particles, stars;
            let mx = W / 2, my = H / 2;
            let lastTime = 0, spawnTimer = 0, waveTimer = 0;
            let invincible = 0;
            let animFrame;

            window._gameCleanup = () => {
                state = 'over';
                cancelAnimationFrame(animFrame);
                canvas.removeEventListener('mousemove', onMouseMove);
                canvas.removeEventListener('click', onClick);
            };

            function initStars() {
                stars = Array.from({ length: 80 }, () => ({
                    x: Math.random() * W, y: Math.random() * H,
                    r: Math.random() * 1.2 + 0.3, a: Math.random() * 0.6 + 0.2,
                }));
            }

            ship = { x: W / 2, y: H / 2, angle: 0, trail: [] };
            bullets = []; asteroids = []; particles = [];
            initStars();

            function spawnAsteroid(big) {
                const edge = Math.floor(Math.random() * 4);
                let x, y;
                if (edge === 0) { x = Math.random() * W; y = -40; }
                else if (edge === 1) { x = W + 40; y = Math.random() * H; }
                else if (edge === 2) { x = Math.random() * W; y = H + 40; }
                else { x = -40; y = Math.random() * H; }
                const angle = Math.atan2(ship.y - y, ship.x - x) + (Math.random() - 0.5) * 1.2;
                const speed = 0.8 + Math.random() * 0.8 + wave * 0.15;
                const r = big ? 28 + Math.random() * 14 : 12 + Math.random() * 8;
                const sides = Math.floor(Math.random() * 3) + 6;
                const jitter = Array.from({ length: sides }, () => 0.7 + Math.random() * 0.6);
                asteroids.push({ x, y, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed, r, rot: 0, rotSpeed: (Math.random() - 0.5) * 0.03, sides, jitter, big });
            }

            function spawnParticles(x, y, color, n) {
                for (let i = 0; i < n; i++) {
                    const a = Math.random() * Math.PI * 2;
                    const s = 1 + Math.random() * 3;
                    particles.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, life: 1, color });
                }
            }

            function onMouseMove(e) {
                const rect = canvas.getBoundingClientRect();
                mx = (e.clientX - rect.left) * (W / rect.width);
                my = (e.clientY - rect.top) * (H / rect.height);
            }

            function onClick() {
                if (state !== 'playing') return;
                const a = Math.atan2(my - ship.y, mx - ship.x);
                bullets.push({ x: ship.x, y: ship.y, vx: Math.cos(a) * 9, vy: Math.sin(a) * 9, life: 1 });
            }

            canvas.addEventListener('mousemove', onMouseMove);
            canvas.addEventListener('click', onClick);

            function drawShip(x, y, angle, alpha) {
                ctx.save();
                ctx.translate(x, y); ctx.rotate(angle); ctx.globalAlpha = alpha;
                ctx.strokeStyle = '#4af'; ctx.lineWidth = 1.5;
                ctx.shadowColor = '#4af'; ctx.shadowBlur = 8;
                ctx.beginPath(); ctx.moveTo(14, 0); ctx.lineTo(-9, 8); ctx.lineTo(-5, 0); ctx.lineTo(-9, -8); ctx.closePath(); ctx.stroke();
                ctx.globalAlpha = 1; ctx.restore();
            }

            function drawAsteroid(a) {
                ctx.save(); ctx.translate(a.x, a.y); ctx.rotate(a.rot);
                ctx.strokeStyle = '#888'; ctx.lineWidth = 1.2; ctx.shadowColor = '#666'; ctx.shadowBlur = 4;
                ctx.beginPath();
                for (let i = 0; i < a.sides; i++) {
                    const ang = (i / a.sides) * Math.PI * 2;
                    const r = a.r * a.jitter[i];
                    const px = Math.cos(ang) * r, py = Math.sin(ang) * r;
                    i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
                }
                ctx.closePath(); ctx.stroke(); ctx.restore();
            }

            function dist(a, b) { return Math.hypot(a.x - b.x, a.y - b.y); }

            function loop(ts) {
                if (state !== 'playing') return;
                const dt = Math.min(ts - lastTime, 50);
                lastTime = ts;
                ship.trail.push({ x: ship.x, y: ship.y });
                if (ship.trail.length > 12) ship.trail.shift();
                ship.x += (mx - ship.x) * 0.12;
                ship.y += (my - ship.y) * 0.12;
                ship.angle = Math.atan2(my - ship.y, mx - ship.x);
                spawnTimer += dt; waveTimer += dt;
                const spawnRate = Math.max(600, 1800 - wave * 120);
                if (spawnTimer > spawnRate) { spawnAsteroid(Math.random() < 0.4); spawnTimer = 0; }
                if (waveTimer > 15000) { wave++; waveTimer = 0; }
                bullets = bullets.filter(b => { b.x += b.vx; b.y += b.vy; b.life -= 0.012; return b.life > 0 && b.x > -20 && b.x < W + 20 && b.y > -20 && b.y < H + 20; });
                asteroids.forEach(a => { a.x += a.vx; a.y += a.vy; a.rot += a.rotSpeed; });
                asteroids = asteroids.filter(a => !(a.x < -80 || a.x > W + 80 || a.y < -80 || a.y > H + 80));
                for (let i = bullets.length - 1; i >= 0; i--) {
                    for (let j = asteroids.length - 1; j >= 0; j--) {
                        if (dist(bullets[i], asteroids[j]) < asteroids[j].r) {
                            spawnParticles(asteroids[j].x, asteroids[j].y, '#f84', 8);
                            score += asteroids[j].big ? 10 : 5;
                            if (asteroids[j].big) {
                                for (let k = 0; k < 2; k++) {
                                    const a2 = Math.random() * Math.PI * 2;
                                    asteroids.push({ ...asteroids[j], big: false, r: asteroids[j].r * 0.5, vx: Math.cos(a2) * 2, vy: Math.sin(a2) * 2, sides: Math.floor(Math.random() * 3) + 5, jitter: Array.from({ length: 7 }, () => 0.7 + Math.random() * 0.5) });
                                }
                            }
                            asteroids.splice(j, 1); bullets.splice(i, 1); break;
                        }
                    }
                }
                if (invincible > 0) { invincible -= dt; } else {
                    for (let j = asteroids.length - 1; j >= 0; j--) {
                        if (dist(ship, asteroids[j]) < asteroids[j].r - 4) {
                            spawnParticles(ship.x, ship.y, '#4af', 12);
                            lives--; invincible = 2000;
                            if (lives <= 0) { state = 'over'; canvas.removeEventListener('mousemove', onMouseMove); canvas.removeEventListener('click', onClick); cancelAnimationFrame(animFrame); onGameOver(score); return; }
                            break;
                        }
                    }
                }
                particles.forEach(p => { p.x += p.vx; p.y += p.vy; p.vx *= 0.93; p.vy *= 0.93; p.life -= 0.025; });
                particles = particles.filter(p => p.life > 0);
                ctx.fillStyle = '#050a14'; ctx.fillRect(0, 0, W, H);
                stars.forEach(s => { ctx.beginPath(); ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2); ctx.fillStyle = `rgba(200,220,255,${s.a})`; ctx.fill(); });
                ship.trail.forEach((t, i) => { const a = (i / ship.trail.length) * 0.3; ctx.beginPath(); ctx.arc(t.x, t.y, 1.5, 0, Math.PI * 2); ctx.fillStyle = `rgba(68,170,255,${a})`; ctx.fill(); });
                const shipAlpha = invincible > 0 ? (Math.floor(invincible / 120) % 2 === 0 ? 0.3 : 1) : 1;
                drawShip(ship.x, ship.y, ship.angle, shipAlpha);
                bullets.forEach(b => { ctx.save(); ctx.shadowColor = '#ff0'; ctx.shadowBlur = 6; ctx.beginPath(); ctx.arc(b.x, b.y, 2.5, 0, Math.PI * 2); ctx.fillStyle = '#ff4'; ctx.fill(); ctx.restore(); });
                asteroids.forEach(drawAsteroid);
                particles.forEach(p => { ctx.beginPath(); ctx.arc(p.x, p.y, 2 * p.life, 0, Math.PI * 2); ctx.fillStyle = p.color; ctx.globalAlpha = p.life; ctx.fill(); ctx.globalAlpha = 1; });
                ctx.globalAlpha = 1;
                ctx.fillStyle = 'rgba(255,255,255,0.7)'; ctx.font = '13px monospace';
                ctx.textAlign = 'left'; ctx.fillText(`score: ${score}`, 12, 22);
                ctx.textAlign = 'center'; ctx.fillText(`wave ${wave}`, W / 2, 22);
                ctx.textAlign = 'right'; ctx.fillText('♥ '.repeat(lives).trim(), W - 12, 22);
                animFrame = requestAnimationFrame(loop);
            }
            animFrame = requestAnimationFrame(loop);
        }
    },

    flappyBird: {
        title: "Flappy Bird",
        type: "internal",
        xpMultiplier: 12,
        emoji: "🐦",
        color: "linear-gradient(135deg, #0c4a6e, #075985)",
        init: function(canvas, ctx, onGameOver) {
            const W = canvas.width, H = canvas.height;
            const GRAVITY = 0.45, FLAP = -7.5, PIPE_WIDTH = 52, PIPE_GAP = 145, PIPE_SPEED = 2.4, PIPE_INTERVAL = 90;
            let bird, pipes, score, frame, state, animFrame, particles;

            window._gameCleanup = () => {
                state = 'stopped';
                cancelAnimationFrame(animFrame);
                window.removeEventListener('keydown', onKey);
                canvas.removeEventListener('click', onClick);
            };

            function init() {
                bird = { x: W * 0.25, y: H / 2, vy: 0, angle: 0, radius: 12 };
                pipes = []; particles = []; score = 0; frame = 0; state = 'waiting';
            }

            function flap() {
                if (state === 'waiting') { state = 'playing'; }
                if (state !== 'playing') return;
                bird.vy = FLAP;
                spawnParticles(bird.x, bird.y, '#fde68a', 5);
            }
            function onKey(e) { if (e.code === 'Space' || e.code === 'ArrowUp' || e.key === 'w') { e.preventDefault(); flap(); } }
            function onClick() { flap(); }

            window.addEventListener('keydown', onKey);
            canvas.addEventListener('click', onClick);

            function spawnParticles(x, y, color, n) {
                for (let i = 0; i < n; i++) {
                    const a = Math.random() * Math.PI * 2, s = 1 + Math.random() * 2.5;
                    particles.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, life: 1, color });
                }
            }

            function spawnPipe() {
                const topH = Math.floor(Math.random() * (H - PIPE_GAP - 120) + 60);
                pipes.push({ x: W + PIPE_WIDTH, topH, scored: false });
            }

            function drawBird() {
                ctx.save(); ctx.translate(bird.x, bird.y);
                const targetAngle = bird.vy * 3;
                bird.angle += (targetAngle - bird.angle) * 0.2;
                const clampedAngle = Math.max(-0.5, Math.min(1.4, bird.angle * Math.PI / 180));
                ctx.rotate(clampedAngle);
                ctx.fillStyle = '#fbbf24'; ctx.shadowColor = '#f59e0b'; ctx.shadowBlur = 8;
                ctx.beginPath(); ctx.ellipse(0, 0, 14, 11, 0, 0, Math.PI * 2); ctx.fill();
                ctx.fillStyle = '#f59e0b'; ctx.shadowBlur = 0;
                ctx.beginPath(); ctx.ellipse(-3, 3, 8, 5, -0.3, 0, Math.PI * 2); ctx.fill();
                ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(6, -3, 4, 0, Math.PI * 2); ctx.fill();
                ctx.fillStyle = '#1e293b'; ctx.beginPath(); ctx.arc(7, -3, 2, 0, Math.PI * 2); ctx.fill();
                ctx.fillStyle = '#f97316'; ctx.beginPath(); ctx.moveTo(12, -1); ctx.lineTo(18, 1); ctx.lineTo(12, 3); ctx.closePath(); ctx.fill();
                ctx.restore();
            }

            function drawPipe(pipe) {
                ctx.fillStyle = '#22c55e'; ctx.shadowColor = '#16a34a'; ctx.shadowBlur = 6;
                ctx.beginPath(); ctx.roundRect(pipe.x, 0, PIPE_WIDTH, pipe.topH - 10, [0, 0, 6, 6]); ctx.fill();
                ctx.fillStyle = '#16a34a';
                ctx.beginPath(); ctx.roundRect(pipe.x - 5, pipe.topH - 20, PIPE_WIDTH + 10, 20, [0, 0, 6, 6]); ctx.fill();
                const bottomY = pipe.topH + PIPE_GAP;
                ctx.beginPath(); ctx.roundRect(pipe.x - 5, bottomY, PIPE_WIDTH + 10, 20, [6, 6, 0, 0]); ctx.fill();
                ctx.fillStyle = '#22c55e';
                ctx.beginPath(); ctx.roundRect(pipe.x, bottomY + 20, PIPE_WIDTH, H - (bottomY + 20), [0, 0, 0, 0]); ctx.fill();
                ctx.shadowBlur = 0;
            }

            function drawBackground() {
                ctx.fillStyle = '#7dd3fc'; ctx.fillRect(0, 0, W, H);
                ctx.fillStyle = 'rgba(255,255,255,0.6)';
                [[80, 60, 40], [200, 90, 30], [360, 50, 50], [500, 75, 35]].forEach(([cx, cy, r]) => {
                    ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.arc(cx + r * 0.7, cy - r * 0.3, r * 0.7, 0, Math.PI * 2); ctx.arc(cx - r * 0.6, cy - r * 0.2, r * 0.6, 0, Math.PI * 2); ctx.fill();
                });
                ctx.fillStyle = '#854d0e'; ctx.fillRect(0, H - 20, W, 20);
                ctx.fillStyle = '#65a30d'; ctx.fillRect(0, H - 26, W, 10);
            }

            function checkCollision() {
                const r = bird.radius;
                if (bird.y + r >= H - 20 || bird.y - r <= 0) return true;
                for (const pipe of pipes) {
                    if (bird.x + r > pipe.x + 4 && bird.x - r < pipe.x + PIPE_WIDTH - 4 && (bird.y - r < pipe.topH - 10 || bird.y + r > pipe.topH + PIPE_GAP + 10)) return true;
                }
                return false;
            }

            function end() {
                state = 'over'; spawnParticles(bird.x, bird.y, '#fbbf24', 18);
                window.removeEventListener('keydown', onKey); canvas.removeEventListener('click', onClick);
                setTimeout(() => { cancelAnimationFrame(animFrame); onGameOver(score); }, 700);
            }

            init();

            function loop() {
                if (state !== 'playing' && state !== 'over' && state !== 'waiting') return;
                frame++;
                if (state === 'waiting') {
                    bird.y = H / 2 + Math.sin(frame * 0.05) * 6;
                    bird.vy = 0; bird.angle = 0;
                    drawBackground();
                    drawBird();
                    ctx.fillStyle = 'rgba(0,0,0,0.35)';
                    ctx.beginPath(); ctx.roundRect(W/2 - 110, H/2 - 52, 220, 44, 10); ctx.fill();
                    ctx.fillStyle = '#fff'; ctx.font = 'bold 16px monospace'; ctx.textAlign = 'center';
                    ctx.fillText('Click or Space to Start', W/2, H/2 - 24);
                    ctx.font = '12px monospace'; ctx.fillStyle = 'rgba(255,255,255,0.7)'; ctx.textAlign = 'left';
                    ctx.fillText('space / click to flap', 10, 22);
                    animFrame = requestAnimationFrame(loop);
                    return;
                }
                if (state === 'playing') {
                    bird.vy += GRAVITY; bird.y += bird.vy;
                    if (frame % PIPE_INTERVAL === 0) spawnPipe();
                    for (const pipe of pipes) {
                        pipe.x -= PIPE_SPEED;
                        if (!pipe.scored && pipe.x + PIPE_WIDTH < bird.x) { pipe.scored = true; score++; spawnParticles(bird.x, bird.y - 20, '#a3e635', 6); }
                    }
                    pipes = pipes.filter(p => p.x + PIPE_WIDTH > -10);
                    if (checkCollision()) { end(); }
                }
                particles.forEach(p => { p.x += p.vx; p.y += p.vy; p.vx *= 0.92; p.vy *= 0.92; p.life -= 0.035; });
                particles = particles.filter(p => p.life > 0);
                drawBackground(); pipes.forEach(drawPipe);
                particles.forEach(p => { ctx.beginPath(); ctx.arc(p.x, p.y, 4 * p.life, 0, Math.PI * 2); ctx.fillStyle = p.color; ctx.globalAlpha = p.life; ctx.fill(); ctx.globalAlpha = 1; });
                drawBird();
                ctx.fillStyle = 'rgba(0,0,0,0.4)'; ctx.font = 'bold 28px monospace'; ctx.textAlign = 'center'; ctx.fillText(score, W / 2 + 1, 48 + 1);
                ctx.fillStyle = '#fff'; ctx.fillText(score, W / 2, 48);
                ctx.font = '12px monospace'; ctx.fillStyle = 'rgba(255,255,255,0.7)'; ctx.textAlign = 'left'; ctx.fillText('space / click to flap', 10, 22);
                animFrame = requestAnimationFrame(loop);
            }
            animFrame = requestAnimationFrame(loop);
        }
    },

    tetris: {
        title: "Tetris",
        type: "internal",
        xpMultiplier: 5,
        emoji: "🧱",
        color: "linear-gradient(135deg, #0f172a, #334155)",
        init: function(canvas, ctx, onGameOver) {
            const cols = 10, rows = 20;
            const maxBlockWidth = Math.floor(canvas.width / cols);
            const maxBlockHeight = Math.floor(canvas.height / rows);
            const blockSize = Math.min(maxBlockWidth, maxBlockHeight) - 1;
            const xOffset = Math.floor((canvas.width - (cols * blockSize)) / 2);
            const yOffset = Math.floor((canvas.height - (rows * blockSize)) / 2);

            const playfield = [];
            for (let r = 0; r < rows; r++) { playfield[r] = []; for (let c = 0; c < cols; c++) playfield[r][c] = 0; }

            const tetrominoes = [
                [],
                [[0,0,0,0],[1,1,1,1],[0,0,0,0],[0,0,0,0]],
                [[2,0,0],[2,2,2],[0,0,0]],
                [[0,0,3],[3,3,3],[0,0,0]],
                [[4,4],[4,4]],
                [[0,5,5],[5,5,0],[0,0,0]],
                [[0,6,0],[6,6,6],[0,0,0]],
                [[7,7,0],[0,7,7],[0,0,0]]
            ];

            const colors = [null, '#00E5FF', '#2962FF', '#FF6D00', '#FFEA00', '#00E676', '#AA00FF', '#D50000'];

            let score = 0, isGameOver = false, dropCounter = 0, dropInterval = 1000, lastTime = 0, animationId;
            let player = { pos: { x: 0, y: 0 }, matrix: null };

            window._gameCleanup = () => {
                isGameOver = true;
                cancelAnimationFrame(animationId);
                document.removeEventListener('keydown', handleInput);
            };

            function createPiece() {
                const typeId = Math.floor(Math.random() * 7) + 1;
                player.matrix = tetrominoes[typeId];
                player.pos.y = 0;
                player.pos.x = Math.floor(cols / 2) - Math.floor(player.matrix[0].length / 2);
                if (collide(playfield, player)) { isGameOver = true; cancelAnimationFrame(animationId); document.removeEventListener('keydown', handleInput); onGameOver(score); }
            }

            function collide(arena, player) {
                const m = player.matrix, o = player.pos;
                for (let y = 0; y < m.length; ++y) for (let x = 0; x < m[y].length; ++x) if (m[y][x] !== 0 && (arena[y + o.y] && arena[y + o.y][x + o.x]) !== 0) return true;
                return false;
            }

            function merge(arena, player) { player.matrix.forEach((row, y) => row.forEach((value, x) => { if (value !== 0) arena[y + player.pos.y][x + player.pos.x] = value; })); }

            function rotate(matrix, dir) {
                for (let y = 0; y < matrix.length; ++y) for (let x = 0; x < y; ++x) [matrix[x][y], matrix[y][x]] = [matrix[y][x], matrix[x][y]];
                if (dir > 0) matrix.forEach(row => row.reverse()); else matrix.reverse();
            }

            function playerDrop() {
                player.pos.y++;
                if (collide(playfield, player)) { player.pos.y--; merge(playfield, player); arenaSweep(); createPiece(); }
                dropCounter = 0;
            }

            function playerMove(offset) { player.pos.x += offset; if (collide(playfield, player)) player.pos.x -= offset; }

            function playerRotate(dir) {
                const pos = player.pos.x; let offset = 1; rotate(player.matrix, dir);
                while (collide(playfield, player)) { player.pos.x += offset; offset = -(offset + (offset > 0 ? 1 : -1)); if (offset > player.matrix[0].length) { rotate(player.matrix, -dir); player.pos.x = pos; return; } }
            }

            function arenaSweep() {
                let rowCount = 1;
                outer: for (let y = playfield.length - 1; y >= 0; --y) {
                    for (let x = 0; x < playfield[y].length; ++x) if (playfield[y][x] === 0) continue outer;
                    const row = playfield.splice(y, 1)[0].fill(0); playfield.unshift(row); ++y;
                    score += rowCount * 100; rowCount *= 2;
                    dropInterval = Math.max(100, dropInterval - 20);
                }
            }

            function drawMatrix(matrix, offset) {
                matrix.forEach((row, y) => row.forEach((value, x) => {
                    if (value !== 0) {
                        ctx.fillStyle = colors[value];
                        ctx.fillRect(xOffset + (x + offset.x) * blockSize, yOffset + (y + offset.y) * blockSize, blockSize - 1, blockSize - 1);
                        ctx.fillStyle = 'rgba(255,255,255,0.2)';
                        ctx.fillRect(xOffset + (x + offset.x) * blockSize + 2, yOffset + (y + offset.y) * blockSize + 2, blockSize - 5, blockSize - 5);
                    }
                }));
            }

            function draw() {
                ctx.fillStyle = '#0f172a'; ctx.fillRect(0, 0, canvas.width, canvas.height);
                ctx.fillStyle = '#1e293b'; ctx.fillRect(xOffset, yOffset, cols * blockSize, rows * blockSize);
                ctx.strokeStyle = '#334155'; ctx.lineWidth = 2; ctx.strokeRect(xOffset - 2, yOffset - 2, (cols * blockSize) + 4, (rows * blockSize) + 4);
                drawMatrix(playfield, { x: 0, y: 0 });
                if (player.matrix !== null) drawMatrix(player.matrix, player.pos);
                ctx.fillStyle = '#f8fafc'; ctx.font = 'bold 24px "Segoe UI", Arial, sans-serif'; ctx.textAlign = 'left'; ctx.fillText(`SCORE: ${score}`, 20, 40);
            }

            function update(time = 0) {
                if (isGameOver) return;
                const deltaTime = time - lastTime; lastTime = time; dropCounter += deltaTime;
                if (dropCounter > dropInterval) playerDrop();
                draw();
                animationId = requestAnimationFrame(update);
            }

            function handleInput(event) {
                if (isGameOver) return;
                if (["ArrowUp","ArrowDown","ArrowLeft","ArrowRight"," "].includes(event.key)) event.preventDefault();
                if (event.key === "ArrowLeft") playerMove(-1);
                else if (event.key === "ArrowRight") playerMove(1);
                else if (event.key === "ArrowDown") playerDrop();
                else if (event.key === "ArrowUp") playerRotate(1);
                else if (event.key === " ") {
                    while (!collide(playfield, player)) player.pos.y++;
                    player.pos.y--; merge(playfield, player); arenaSweep(); createPiece(); dropCounter = 0;
                }
            }

            document.addEventListener('keydown', handleInput);
            createPiece();
            update();
        }
    },

    screenSaver: {
        title: "SCREEN SAVER",
        type: "internal",
        xpMultiplier: 0,
        emoji: "📺",
        color: "linear-gradient(135deg, #000000, #434343)",
        init: function(canvas, ctx, onGameOver) {
            let score = 0;
            let animationId;

            const logo = {
                text: "DVD",
                x: Math.random() * (canvas.width - 150),
                y: Math.random() * (canvas.height - 50),
                dx: 2, dy: 2, width: 140, height: 40, hue: 0,
                update: function() {
                    this.x += this.dx; this.y += this.dy;
                    if (this.x <= 0 || this.x + this.width >= canvas.width) { this.dx *= -1; this.hue = (this.hue + 45) % 360; score++; }
                    if (this.y <= 0 || this.y + this.height >= canvas.height) { this.dy *= -1; this.hue = (this.hue + 45) % 360; score++; }
                },
                draw: function() {
                    ctx.fillStyle = 'rgba(0,0,0,0.05)'; ctx.fillRect(0, 0, canvas.width, canvas.height);
                    ctx.fillStyle = `hsl(${this.hue},100%,60%)`; ctx.font = 'bold 32px Arial'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
                    ctx.fillText(this.text, this.x + this.width / 2, this.y + this.height / 2);
                    ctx.strokeStyle = `hsl(${this.hue},100%,60%)`; ctx.lineWidth = 3; ctx.strokeRect(this.x, this.y, this.width, this.height);
                    ctx.fillStyle = "#ffffff"; ctx.font = "14px monospace"; ctx.textAlign = "left"; ctx.textBaseline = "alphabetic";
                    ctx.fillText(`BOUNCES: ${score}`, 20, 20);
                }
            };

            window._gameCleanup = () => {
                cancelAnimationFrame(animationId);
                document.removeEventListener('keydown', handleKeys);
            };

            function loop() {
                logo.update(); logo.draw();
                animationId = requestAnimationFrame(loop);
            }

            const handleKeys = (e) => {
                if (e.key === "Escape" || e.key === "Backspace") {
                    cancelAnimationFrame(animationId);
                    document.removeEventListener('keydown', handleKeys);
                    onGameOver(score);
                }
            };

            document.addEventListener('keydown', handleKeys);
            ctx.fillStyle = "#000000"; ctx.fillRect(0, 0, canvas.width, canvas.height);
            loop();
        }
    },

    snowRider: {
        title: "Snow Rider 3D",
        type: "remote",
        xpMultiplier: 0,
        emoji: "🎿",
        color: "linear-gradient(135deg, #0f2027, #1a3a4a)",
        url: "https://snow-rider3d.github.io/file/"
    },
    neonDrift: {
    title: "NEON DRIFT",
    type: "internal",
    xpMultiplier: 10,
    emoji: "🚀",
    color: "linear-gradient(135deg, #0f172a, #334155)",

    init: function(canvas, ctx, onGameOver) {
        // Game State
        let score = 0;
        let gameActive = true;
        let particles = [];
        let enemies = [];
        let powerups = [];
        let frame = 0;

        const player = {
            x: canvas.width / 2,
            y: canvas.height / 2,
            radius: 10,
            color: "#22d3ee",
            targetX: canvas.width / 2,
            targetY: canvas.height / 2,
            speed: 0.15
        };

        // Input Handling
        const moveHandler = (e) => {
            const rect = canvas.getBoundingClientRect();
            player.targetX = e.clientX - rect.left;
            player.targetY = e.clientY - rect.top;
        };

        canvas.addEventListener('mousemove', moveHandler);

        function spawnEnemy() {
            const side = Math.floor(Math.random() * 4);
            let x, y;
            if (side === 0) { x = Math.random() * canvas.width; y = -20; }
            else if (side === 1) { x = canvas.width + 20; y = Math.random() * canvas.height; }
            else if (side === 2) { x = Math.random() * canvas.width; y = canvas.height + 20; }
            else { x = -20; y = Math.random() * canvas.height; }

            const angle = Math.atan2(player.y - y, player.x - x);
            const speed = 2 + Math.random() * 3 + (score / 500);
            
            enemies.push({ x, y, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed, size: 15 });
        }

        function spawnPowerup() {
            powerups.push({
                x: Math.random() * (canvas.width - 40) + 20,
                y: Math.random() * (canvas.height - 40) + 20,
                size: 8,
                pulse: 0
            });
        }

        function update() {
            if (!gameActive) return;
            frame++;

            // Player Movement (Lerp)
            player.x += (player.targetX - player.x) * player.speed;
            player.y += (player.targetY - player.y) * player.speed;

            // Spawning Logic
            if (frame % Math.max(10, 60 - Math.floor(score / 100)) === 0) spawnEnemy();
            if (frame % 120 === 0) spawnPowerup();

            // Update Enemies
            for (let i = enemies.length - 1; i >= 0; i--) {
                let e = enemies[i];
                e.x += e.vx;
                e.y += e.vy;

                // Collision Check
                const dx = player.x - e.x;
                const dy = player.y - e.y;
                const dist = Math.sqrt(dx * dx + dy * dy);

                if (dist < player.radius + e.size) {
                    gameActive = false;
                    canvas.removeEventListener('mousemove', moveHandler);
                    onGameOver(Math.floor(score));
                }

                // Remove off-screen
                if (e.x < -50 || e.x > canvas.width + 50 || e.y < -50 || e.y > canvas.height + 50) {
                    enemies.splice(i, 1);
                }
            }

            // Update Powerups
            for (let i = powerups.length - 1; i >= 0; i--) {
                let p = powerups[i];
                p.pulse += 0.1;
                const dx = player.x - p.x;
                const dy = player.y - p.y;
                const dist = Math.sqrt(dx * dx + dy * dy);

                if (dist < player.radius + p.size) {
                    score += 50;
                    powerups.splice(i, 1);
                }
            }

            draw();
            requestAnimationFrame(update);
        }

        function draw() {
            // Trail Effect
            ctx.fillStyle = 'rgba(15, 23, 42, 0.2)';
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            // Draw Powerups
            powerups.forEach(p => {
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.size + Math.sin(p.pulse) * 2, 0, Math.PI * 2);
                ctx.fillStyle = "#fbbf24";
                ctx.shadowBlur = 15;
                ctx.shadowColor = "#fbbf24";
                ctx.fill();
                ctx.closePath();
            });

            // Draw Enemies
            enemies.forEach(e => {
                ctx.beginPath();
                ctx.rect(e.x - e.size/2, e.y - e.size/2, e.size, e.size);
                ctx.fillStyle = "#f43f5e";
                ctx.shadowBlur = 10;
                ctx.shadowColor = "#f43f5e";
                ctx.fill();
                ctx.closePath();
            });

            // Draw Player
            ctx.beginPath();
            ctx.arc(player.x, player.y, player.radius, 0, Math.PI * 2);
            ctx.fillStyle = player.color;
            ctx.shadowBlur = 20;
            ctx.shadowColor = player.color;
            ctx.fill();
            ctx.closePath();

            // Draw Score
            ctx.shadowBlur = 0;
            ctx.fillStyle = "white";
            ctx.font = "bold 20px sans-serif";
            ctx.fillText("Score: " + Math.floor(score), 20, 40);
            
            // Increment passive score
            score += 0.1;
        }

        update();
    }
},
motocrossx3m: {
    title: "Moto cross x3m",
    type: "remote",
    xpMultiplier: 10,
    emoji: "🎮",
    color: "linear-gradient(135deg, #1e1b4b, #312e81)",
    url: "https://sportedu25.github.io/g26/class-459/"
},

    goalkeeper: {
        title: "GOAL KEEPER CHALLENGE",
        type: "remote",
        xpMultiplier: 10,
        emoji: "⚽",
        color: "linear-gradient(135deg, #0a001a, #1a0040)",
        url: "https://inkyedu118.github.io/g68/class-1049/"
},

    stickmerge: {
        title: "Stick Merge",
        type: "remote",
        xpMultiplier: 10,
        emoji: "🔫",
        color: "linear-gradient(135deg, #0a001a, #1a0040)",
        url: "https://inkyedu118.github.io/g69/class-410/"
 },

    chess: {
        title: "Chess",
        type: "remote",
        xpMultiplier: 10,
        emoji: "♟️",
        color: "linear-gradient(135deg, #0a001a, #1a0040)",
        url: "https://inkyedu118.github.io/g66/class-998/"
 },

    happyroom: {
        title: "Happy room :)",
        type: "remote",
        xpMultiplier: 10,
        emoji: "😊",
        color: "linear-gradient(135deg, #ff0505, #000000)",
        url: "https://inkyedu118.github.io/g97/class-507/"
    },

    // ─── REMOTE GAMES ────────────────────────────────────────────────────────
    tileMatch: {
         title: "Tile Match",
          type: "remote",
           xpMultiplier: 8,
            emoji: "🀄",
             color: "linear-gradient(135deg, #1a1a2e, #16213e)",
             url: "https://sportedu25.github.io/g68/class-1097/" },
    crazyPig: { title: "Crazy Pig Simulator", type: "remote", xpMultiplier: 8, emoji: "🐷", color: "linear-gradient(135deg, #2d1b69, #11998e)", url: "http://sportedu25.github.io/g68/class-1034/" },
    fourthGoal: { title: "4th & Goal", type: "remote", xpMultiplier: 8, emoji: "🏈", color: "linear-gradient(135deg, #134e5e, #71b280)", url: "http://sportedu25.github.io/g68/class-1045/" },
    bikerStreet: { title: "Biker Street", type: "remote", xpMultiplier: 8, emoji: "🏍️", color: "linear-gradient(135deg, #1a1a2e, #e94560)", url: "https://sportedu25.github.io/g68/class-1059/" },
    oldTower: { title: "Old Tower", type: "remote", xpMultiplier: 8, emoji: "🏰", color: "linear-gradient(135deg, #2c3e50, #4a6741)", url: "https://sportedu25.github.io/g68/class-1062/" },
    circuloid: { title: "Circuloid", type: "remote", xpMultiplier: 8, emoji: "⭕", color: "linear-gradient(135deg, #0f0c29, #302b63)", url: "https://sportedu25.github.io/g68/class-1121/" },
    bigNeonTower: { title: "Big Neon Tower vs Tiny Square", type: "remote", xpMultiplier: 10, emoji: "🔲", color: "linear-gradient(135deg, #000000, #e040fb)", url: "https://sportedu25.github.io/g68/class-1074/" },
    whackEmAll: { title: "Whack Em All", type: "remote", xpMultiplier: 8, emoji: "🔨", color: "linear-gradient(135deg, #1a472a, #2d6a4f)", url: "https://sportedu25.github.io/g68/class-1126/" },
    caveChaos: { title: "Cave Chaos", type: "remote", xpMultiplier: 8, emoji: "🦇", color: "linear-gradient(135deg, #0d0d0d, #1a1a2e)", url: "https://sportedu25.github.io/g68/class-1057/" },
    frostwing: { title: "Frostwing", type: "remote", xpMultiplier: 10, emoji: "🐉", color: "linear-gradient(135deg, #0f2027, #2c5364)", url: "https://sportedu25.github.io/g68/class-1130/" },
    numbskull: { title: "Numbskull", type: "remote", xpMultiplier: 8, emoji: "💀", color: "linear-gradient(135deg, #1a1a2e, #e94560)", url: "https://sportedu25.github.io/g68/class-1108/" },
    americanFootball: { title: "American Football Challenge", type: "remote", xpMultiplier: 8, emoji: "🏟️", color: "linear-gradient(135deg, #134e5e, #71b280)", url: "https://sportedu25.github.io/g68/class-1026/" },
    idleTreeCity: { title: "Idle Tree City", type: "remote", xpMultiplier: 5, emoji: "🌳", color: "linear-gradient(135deg, #1a472a, #2d6a4f)", url: "https://sportedu25.github.io/g68/class-1021/" },
    idleFarming: { title: "Idle Farming Business", type: "remote", xpMultiplier: 5, emoji: "🌾", color: "linear-gradient(135deg, #3d2b1f, #7b5e3a)", url: "https://sportedu25.github.io/g68/class-1018/" },
    portraitObsession: { title: "Portrait of an Obsession", type: "remote", xpMultiplier: 8, emoji: "🎨", color: "linear-gradient(135deg, #0f0c29, #302b63)", url: "https://sportedu25.github.io/g68/class-1061/" },
    doodleBlock: { title: "Doodle Block Puzzle", type: "remote", xpMultiplier: 8, emoji: "🧩", color: "linear-gradient(135deg, #1a1200, #3d2e00)", url: "https://sportedu25.github.io/g68/class-1102/" },
    slope2: { title: "Slope 2", type: "remote", xpMultiplier: 10, emoji: "🔺", color: "linear-gradient(135deg, #0f2027, #203a43)", url: "https://sportedu25.github.io/g2/class-437/" },
    boostBuddies: { title: "Boost Buddies", type: "remote", xpMultiplier: 8, emoji: "🚀", color: "linear-gradient(135deg, #1e1b4b, #312e81)", url: "https://sportedu25.github.io/g68/class-1064/" },
    trafficRush: { title: "Traffic Rush", type: "remote", xpMultiplier: 8, emoji: "🚗", color: "linear-gradient(135deg, #1a1a2e, #e94560)", url: "https://sportedu25.github.io/g22/class-393/" },
    villageCraft: { title: "Village Craft", type: "remote", xpMultiplier: 8, emoji: "🏘️", color: "linear-gradient(135deg, #1a472a, #2d6a4f)", url: "https://sportedu25.github.io/g22/class-389/" },
    superLiquidSoccer: { title: "Super Liquid Soccer", type: "remote", xpMultiplier: 8, emoji: "⚽", color: "linear-gradient(135deg, #134e5e, #71b280)", url: "https://sportedu25.github.io/g69/class-628/" },
    getawayShooter: { title: "Getaway Shooter", type: "remote", xpMultiplier: 10, emoji: "🔫", color: "linear-gradient(135deg, #1c0505, #450a0a)", url: "https://sportedu25.github.io/g9/class-479/" },
    highwayBike: { title: "Highway Bike Simulator", type: "remote", xpMultiplier: 8, emoji: "🏍️", color: "linear-gradient(135deg, #0d0d0d, #1a1a2e)", url: "https://sportedu25.github.io/g3/class-314/" },
    subwaySurfers: { title: "Subway Surfers", type: "remote", xpMultiplier: 10, emoji: "🏃", color: "linear-gradient(135deg, #1a1a2e, #e94560)", url: "https://sportedu25.github.io/g26/class-444/" },
    tag: { title: "TAG", type: "remote", xpMultiplier: 8, emoji: "🏷️", color: "linear-gradient(135deg, #0f0c29, #302b63)", url: "https://sportedu25.github.io/g22/class-364/" },
    gunspin: { title: "Gunspin", type: "remote", xpMultiplier: 8, emoji: "🌀", color: "linear-gradient(135deg, #1c0505, #450a0a)", url: "https://sportedu25.github.io/g5/class-533/" },
    rushRace: { title: "Rush Race", type: "remote", xpMultiplier: 8, emoji: "🏎️", color: "linear-gradient(135deg, #0f2027, #203a43)", url: "https://sportedu25.github.io/g50/class-10/" },
    rooftopSniper2: { title: "Rooftop Sniper 2", type: "remote", xpMultiplier: 10, emoji: "🎯", color: "linear-gradient(135deg, #1a1a2e, #2c3e50)", url: "https://sportedu25.github.io/g2/class-424/" },
    battleWheels: { title: "Battle Wheels", type: "remote", xpMultiplier: 10, emoji: "💥", color: "linear-gradient(135deg, #1c0505, #450a0a)", url: "https://sportedu25.github.io/g16/class-647/" },
    cookieClicker: { title: "Cookie Clicker", type: "remote", xpMultiplier: 5, emoji: "🍪", color: "linear-gradient(135deg, #3d2b1f, #7b5e3a)", url: "https://sportedu25.github.io/g5/class-448/" },
    idleAnts: { title: "Idle Ants", type: "remote", xpMultiplier: 5, emoji: "🐜", color: "linear-gradient(135deg, #1a472a, #2d6a4f)", url: "https://sportedu25.github.io/g72/class-631/" },

    // ─── GEOMETRY RUSH (Geometry Dash clone) ─────────────────────────────────
    geometryRush: {
        title: "GEOMETRY RUSH",
        type: "internal",
        xpMultiplier: 15,
        emoji: "🔷",
        color: "linear-gradient(135deg, #0f0c29, #302b63)",
        init: function(canvas, ctx, onGameOver) {
            let running = true;
            let frameCount = 0;
            let score = 0;
            let animId;
            let bgHue = 220;
            let attempt = 1;
            let bestScore = 0;

            const GROUND_Y = canvas.height - 80;
            const TILE = 40;
            const SPEED_INIT = 5;

            // ── LEVELS ──────────────────────────────────────────────────────
            // Each level: name, hue, speedMult, obstaclePatterns
            const LEVELS = [
                { name: "STEREO MADNESS",  hue: 220, speedMult: 1.0,  patternSet: 'easy'   },
                { name: "BACK ON TRACK",   hue: 160, speedMult: 1.15, patternSet: 'easy'   },
                { name: "POLARGEIST",      hue: 280, speedMult: 1.25, patternSet: 'medium' },
                { name: "DRY OUT",         hue: 30,  speedMult: 1.35, patternSet: 'medium' },
                { name: "BASE AFTER BASE", hue: 0,   speedMult: 1.45, patternSet: 'medium' },
                { name: "CANT LET GO",     hue: 190, speedMult: 1.55, patternSet: 'hard'   },
                { name: "JUMPER",          hue: 330, speedMult: 1.65, patternSet: 'hard'   },
                { name: "TIME MACHINE",    hue: 50,  speedMult: 1.75, patternSet: 'insane' },
                { name: "CYCLES",          hue: 260, speedMult: 1.9,  patternSet: 'insane' },
                { name: "xSTEP",           hue: 130, speedMult: 2.1,  patternSet: 'demon'  },
            ];
            let currentLevel = 0;
            let levelProgress = 0; // distance traveled in this level
            const LEVEL_LENGTH = 2000; // score units per level

            // Show level select screen
            let gamePhase = 'levelselect'; // levelselect | playing
            let selectedLevel = 0;

            // ── PLAYER ──────────────────────────────────────────────────────
            let speed = SPEED_INIT;
            const player = { x: 120, y: GROUND_Y - 36, w: 36, h: 36, vy: 0, onGround: true, rotation: 0, dead: false };
            const GRAVITY = 0.55;
            const JUMP_FORCE = -12.5;

            let obstacles = [];
            let particles = [];
            let stars = [];
            let nextObstacleX = canvas.width + 200;

            for (let i = 0; i < 60; i++) {
                stars.push({ x: Math.random() * canvas.width, y: Math.random() * (GROUND_Y - 20), r: Math.random() * 1.5 + 0.3, speed: Math.random() * 0.8 + 0.2 });
            }

            window._gameCleanup = () => { running = false; cancelAnimationFrame(animId); window.removeEventListener('keydown', onKey); window.removeEventListener('keyup', onKeyUp); canvas.removeEventListener('click', onTap); removeLevelSelect(); };

            // ── OBSTACLE PATTERNS ───────────────────────────────────────────
            function genObstacle(baseX, patternSet) {
                const items = [];
                const patterns = {
                    easy: [
                        () => [{ type:'spike', x:baseX, y:GROUND_Y }],
                        () => [{ type:'spike', x:baseX, y:GROUND_Y }, { type:'spike', x:baseX+TILE*0.85, y:GROUND_Y }],
                        () => [{ type:'block', x:baseX, y:GROUND_Y-TILE, w:TILE, h:TILE }],
                        () => [{ type:'block', x:baseX, y:GROUND_Y-TILE, w:TILE, h:TILE }, { type:'spike', x:baseX+TILE+10, y:GROUND_Y }],
                    ],
                    medium: [
                        () => [{ type:'spike', x:baseX, y:GROUND_Y }, { type:'spike', x:baseX+TILE*0.85, y:GROUND_Y }, { type:'spike', x:baseX+TILE*1.7, y:GROUND_Y }],
                        () => [{ type:'block', x:baseX, y:GROUND_Y-TILE*1.5, w:TILE, h:TILE*1.5 }],
                        () => [{ type:'block', x:baseX, y:GROUND_Y-TILE, w:TILE, h:TILE }, { type:'block', x:baseX+TILE+20, y:GROUND_Y-TILE*1.5, w:TILE, h:TILE*1.5 }],
                        () => [{ type:'spike', x:baseX, y:GROUND_Y }, { type:'block', x:baseX+TILE+5, y:GROUND_Y-TILE, w:TILE, h:TILE }, { type:'spike', x:baseX+TILE*2+10, y:GROUND_Y }],
                    ],
                    hard: [
                        () => [{ type:'block', x:baseX, y:GROUND_Y-TILE, w:TILE, h:TILE }, { type:'spike', x:baseX+TILE+5, y:GROUND_Y }, { type:'spike', x:baseX+TILE*1.9, y:GROUND_Y }, { type:'block', x:baseX+TILE*3, y:GROUND_Y-TILE*1.5, w:TILE, h:TILE*1.5 }],
                        () => [{ type:'spike', x:baseX, y:GROUND_Y }, { type:'spike', x:baseX+TILE*0.85, y:GROUND_Y }, { type:'spike', x:baseX+TILE*1.7, y:GROUND_Y }, { type:'spike', x:baseX+TILE*2.55, y:GROUND_Y }],
                        () => [{ type:'block', x:baseX, y:GROUND_Y-TILE*2, w:TILE, h:TILE*2 }, { type:'spike', x:baseX+TILE+5, y:GROUND_Y }, { type:'spike', x:baseX+TILE*1.9, y:GROUND_Y }],
                        () => [{ type:'block', x:baseX, y:GROUND_Y-TILE, w:TILE*2, h:TILE }, { type:'spike', x:baseX+TILE*2+10, y:GROUND_Y }, { type:'block', x:baseX+TILE*3+10, y:GROUND_Y-TILE, w:TILE, h:TILE }],
                    ],
                    insane: [
                        () => [{ type:'spike', x:baseX, y:GROUND_Y }, { type:'block', x:baseX+TILE*0.85, y:GROUND_Y-TILE*2, w:TILE, h:TILE*2 }, { type:'spike', x:baseX+TILE*2, y:GROUND_Y }, { type:'spike', x:baseX+TILE*2.85, y:GROUND_Y }, { type:'block', x:baseX+TILE*4, y:GROUND_Y-TILE, w:TILE, h:TILE }],
                        () => [{ type:'block', x:baseX, y:GROUND_Y-TILE, w:TILE*3, h:TILE }, { type:'spike', x:baseX+TILE*3+5, y:GROUND_Y }, { type:'spike', x:baseX+TILE*3.9, y:GROUND_Y }, { type:'spike', x:baseX+TILE*4.75, y:GROUND_Y }],
                        () => [0,1,2,3,4].map(i => ({ type:'spike', x:baseX+i*TILE*0.85, y:GROUND_Y })).flat(),
                        () => [{ type:'block', x:baseX, y:GROUND_Y-TILE*1.5, w:TILE, h:TILE*1.5 }, { type:'block', x:baseX+TILE+15, y:GROUND_Y-TILE*2, w:TILE, h:TILE*2 }, { type:'block', x:baseX+TILE*2+30, y:GROUND_Y-TILE*2.5, w:TILE, h:TILE*2.5 }],
                    ],
                    demon: [
                        () => [{ type:'block', x:baseX, y:GROUND_Y-TILE, w:TILE, h:TILE }, { type:'spike', x:baseX+TILE+5, y:GROUND_Y }, { type:'spike', x:baseX+TILE*1.9, y:GROUND_Y }, { type:'spike', x:baseX+TILE*2.75, y:GROUND_Y }, { type:'block', x:baseX+TILE*3.6, y:GROUND_Y-TILE*2, w:TILE, h:TILE*2 }, { type:'spike', x:baseX+TILE*4.7, y:GROUND_Y }],
                        () => [0,1,2,3,4,5].map(i => ({ type:'spike', x:baseX+i*TILE*0.82, y:GROUND_Y })).flat(),
                        () => [0,1,2,3].map(i => ({ type:'block', x:baseX+i*(TILE+10), y:GROUND_Y-TILE*(1+i*0.5), w:TILE, h:TILE*(1+i*0.5) })).flat(),
                        () => [{ type:'spike', x:baseX, y:GROUND_Y }, { type:'block', x:baseX+TILE*0.85, y:GROUND_Y-TILE*3, w:TILE, h:TILE*3 }, { type:'spike', x:baseX+TILE*2, y:GROUND_Y }, { type:'spike', x:baseX+TILE*2.85, y:GROUND_Y }, { type:'spike', x:baseX+TILE*3.7, y:GROUND_Y }, { type:'block', x:baseX+TILE*4.6, y:GROUND_Y-TILE, w:TILE*2, h:TILE }],
                    ],
                };
                const set = patterns[patternSet] || patterns.easy;
                return set[Math.floor(Math.random() * set.length)]();
            }

            let jumpPressed = false;
            const onKey = e => { if ((e.code === 'Space' || e.code === 'ArrowUp' || e.code === 'KeyW') && !jumpPressed) { jumpPressed = true; doJump(); } };
            const onKeyUp = e => { if (e.code === 'Space' || e.code === 'ArrowUp' || e.code === 'KeyW') jumpPressed = false; };
            const onTap = () => doJump();
            window.addEventListener('keydown', onKey);
            window.addEventListener('keyup', onKeyUp);
            canvas.addEventListener('click', onTap);

            function doJump() {
                if (gamePhase !== 'playing') return;
                if (player.onGround && !player.dead) { player.vy = JUMP_FORCE; player.onGround = false; spawnJumpParticles(); }
            }

            function spawnJumpParticles() {
                for (let i = 0; i < 8; i++) {
                    const a = Math.PI + (Math.random() - 0.5) * 1.2;
                    particles.push({ x: player.x + player.w / 2, y: player.y + player.h, vx: Math.cos(a) * (1 + Math.random() * 3), vy: Math.sin(a) * (1 + Math.random() * 3) - 1, life: 1, color: `hsl(${bgHue + 40},100%,70%)` });
                }
            }

            function spawnDeathParticles() {
                for (let i = 0; i < 24; i++) {
                    const a = Math.random() * Math.PI * 2, spd = 2 + Math.random() * 5;
                    particles.push({ x: player.x + player.w / 2, y: player.y + player.h / 2, vx: Math.cos(a) * spd, vy: Math.sin(a) * spd, life: 1, color: `hsl(${Math.random() * 60 + 10},100%,65%)` });
                }
            }

            function rectOverlap(ax, ay, aw, ah, bx, by, bw, bh) {
                return ax < bx + bw && ax + aw > bx && ay < by + bh && ay + ah > by;
            }

            function drawRoundedRect(x, y, w, h, r, fill, glow) {
                ctx.beginPath();
                ctx.moveTo(x + r, y); ctx.lineTo(x + w - r, y); ctx.quadraticCurveTo(x + w, y, x + w, y + r);
                ctx.lineTo(x + w, y + h - r); ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
                ctx.lineTo(x + r, y + h); ctx.quadraticCurveTo(x, y + h, x, y + h - r);
                ctx.lineTo(x, y + r); ctx.quadraticCurveTo(x, y, x + r, y); ctx.closePath();
                if (glow) { ctx.shadowBlur = 18; ctx.shadowColor = glow; }
                ctx.fillStyle = fill; ctx.fill(); ctx.shadowBlur = 0;
            }

            // ── LEVEL SELECT OVERLAY ─────────────────────────────────────────
            const lsOverlay = document.createElement('div');
            lsOverlay.id = 'gr-level-select';
            lsOverlay.style.cssText = `position:absolute;inset:0;background:rgba(8,6,24,0.97);display:flex;flex-direction:column;align-items:center;justify-content:flex-start;z-index:200;overflow-y:auto;padding:20px;font-family:'Share Tech Mono',monospace;color:#f1f5f9;`;
            canvas.parentElement.appendChild(lsOverlay);

            const diffColors = { easy:'#22c55e', medium:'#f59e0b', hard:'#ef4444', insane:'#a855f7', demon:'#ec4899' };
            const diffLabels = { easy:'EASY', medium:'NORMAL', hard:'HARD', insane:'INSANE', demon:'DEMON' };

            function renderLevelSelect() {
                lsOverlay.innerHTML = `
                    <div style="text-align:center;width:100%;max-width:700px;">
                        <div style="font-size:36px;margin-bottom:4px;">🔷</div>
                        <div style="font-family:'Syne',sans-serif;font-size:24px;font-weight:700;color:#818cf8;letter-spacing:3px;margin-bottom:20px;">GEOMETRY RUSH</div>
                        <div style="display:grid;grid-template-columns:repeat(2,1fr);gap:10px;margin-bottom:16px;">
                            ${LEVELS.map((lv, i) => `
                                <div onclick="window._grSelectLevel(${i})" style="cursor:pointer;background:rgba(99,102,241,0.08);border:2px solid ${i===selectedLevel?'#818cf8':'rgba(99,102,241,0.2)'};border-radius:12px;padding:14px 16px;display:flex;align-items:center;gap:12px;transition:all 0.15s;">
                                    <div style="font-size:22px;min-width:32px;text-align:center;">${['1️⃣','2️⃣','3️⃣','4️⃣','5️⃣','6️⃣','7️⃣','8️⃣','9️⃣','🔟'][i]}</div>
                                    <div style="text-align:left;flex:1;">
                                        <div style="font-size:12px;font-weight:700;letter-spacing:1px;color:#f1f5f9;">${lv.name}</div>
                                        <div style="font-size:10px;color:${diffColors[lv.patternSet]};letter-spacing:2px;margin-top:2px;">${diffLabels[lv.patternSet]} · ${lv.speedMult}x SPEED</div>
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                        <button onclick="window._grStartLevel()" style="width:100%;max-width:300px;padding:14px;background:linear-gradient(135deg,#4f46e5,#7c3aed);border:none;border-radius:12px;color:#fff;font-size:15px;font-family:'Share Tech Mono',monospace;cursor:pointer;letter-spacing:2px;margin-bottom:8px;">▶ PLAY ${LEVELS[selectedLevel].name}</button>
                    </div>`;
            }

            window._grSelectLevel = (i) => { selectedLevel = i; renderLevelSelect(); };
            window._grStartLevel = () => {
                currentLevel = selectedLevel;
                bgHue = LEVELS[currentLevel].hue;
                speed = SPEED_INIT * LEVELS[currentLevel].speedMult;
                lsOverlay.style.display = 'none';
                gamePhase = 'playing';
                attempt = 1; score = 0; levelProgress = 0;
                player.y = GROUND_Y - 36; player.vy = 0; player.onGround = true; player.dead = false; player.rotation = 0;
                obstacles = []; particles = [];
                nextObstacleX = canvas.width + 200;
            };

            function removeLevelSelect() {
                lsOverlay.remove();
                delete window._grSelectLevel;
                delete window._grStartLevel;
            }

            renderLevelSelect();

            function resetLevel() {
                attempt++;
                if (score > bestScore) bestScore = score;
                score = 0; levelProgress = 0;
                player.y = GROUND_Y - 36; player.vy = 0; player.onGround = true; player.dead = false; player.rotation = 0;
                obstacles = []; nextObstacleX = canvas.width + 200;
                speed = SPEED_INIT * LEVELS[currentLevel].speedMult;
                bgHue = LEVELS[currentLevel].hue;
            }

            function loop() {
                if (!running) return;
                frameCount++;

                // Draw background even during level select for ambiance
                const grad = ctx.createLinearGradient(0, 0, 0, canvas.height);
                grad.addColorStop(0, `hsl(${bgHue},60%,8%)`);
                grad.addColorStop(1, `hsl(${bgHue + 30},50%,4%)`);
                ctx.fillStyle = grad; ctx.fillRect(0, 0, canvas.width, canvas.height);

                if (gamePhase !== 'playing') { animId = requestAnimationFrame(loop); return; }

                bgHue += 0.08;

                stars.forEach(s => {
                    s.x -= s.speed * (speed / SPEED_INIT);
                    if (s.x < 0) s.x = canvas.width;
                    ctx.beginPath(); ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
                    ctx.fillStyle = `rgba(255,255,255,${0.3 + s.r * 0.2})`; ctx.fill();
                });

                // Ground
                ctx.fillStyle = `hsl(${bgHue},70%,30%)`;
                ctx.fillRect(0, GROUND_Y, canvas.width, canvas.height - GROUND_Y);
                ctx.shadowBlur = 12; ctx.shadowColor = `hsl(${bgHue},90%,60%)`;
                ctx.fillStyle = `hsl(${bgHue},90%,60%)`; ctx.fillRect(0, GROUND_Y, canvas.width, 3); ctx.shadowBlur = 0;

                const gridOff = (frameCount * speed) % 80;
                ctx.strokeStyle = `hsla(${bgHue},60%,50%,0.2)`; ctx.lineWidth = 1;
                for (let gx = -gridOff; gx < canvas.width; gx += 80) { ctx.beginPath(); ctx.moveTo(gx, GROUND_Y); ctx.lineTo(gx, canvas.height); ctx.stroke(); }

                // Level progress bar
                const pct = Math.min(levelProgress / LEVEL_LENGTH, 1);
                ctx.fillStyle = 'rgba(0,0,0,0.4)'; ctx.fillRect(0, canvas.height - 8, canvas.width, 8);
                const progGrad = ctx.createLinearGradient(0, 0, canvas.width, 0);
                progGrad.addColorStop(0, `hsl(${bgHue},90%,55%)`);
                progGrad.addColorStop(1, `hsl(${bgHue+60},90%,65%)`);
                ctx.fillStyle = progGrad; ctx.fillRect(0, canvas.height - 8, canvas.width * pct, 8);

                // Spawn obstacles
                nextObstacleX -= speed;
                const lvl = LEVELS[currentLevel];
                const gap = Math.max(160, 260 - score * 0.05) + Math.random() * 120;
                if (nextObstacleX <= canvas.width + 10) {
                    obstacles.push(...genObstacle(canvas.width + gap, lvl.patternSet));
                    nextObstacleX = canvas.width + gap + 100 + Math.random() * 80;
                }

                obstacles.forEach(o => { o.x -= speed; });
                obstacles = obstacles.filter(o => o.x > -120);

                obstacles.forEach(o => {
                    if (o.type === 'spike') {
                        ctx.beginPath(); ctx.moveTo(o.x, o.y + 2); ctx.lineTo(o.x + TILE, o.y + 2); ctx.lineTo(o.x + TILE / 2, o.y - TILE * 0.8); ctx.closePath();
                        ctx.shadowBlur = 14; ctx.shadowColor = '#ef4444'; ctx.fillStyle = '#ef4444'; ctx.fill();
                        ctx.strokeStyle = '#fca5a5'; ctx.lineWidth = 1.5; ctx.stroke(); ctx.shadowBlur = 0;
                    } else {
                        drawRoundedRect(o.x, o.y, o.w, o.h, 4, `hsl(${bgHue + 60},70%,35%)`, `hsl(${bgHue + 60},80%,50%)`);
                        ctx.fillStyle = `hsla(${bgHue + 60},80%,70%,0.15)`; ctx.fillRect(o.x + 4, o.y + 4, o.w - 8, 8);
                    }
                });

                if (!player.dead) {
                    player.vy += GRAVITY;
                    player.y += player.vy;

                    if (player.y + player.h >= GROUND_Y) {
                        player.y = GROUND_Y - player.h;
                        player.vy = 0; player.onGround = true;
                        player.rotation = Math.round(player.rotation / 90) * 90;
                    } else {
                        player.onGround = false;
                    }

                    if (!player.onGround) player.rotation += 4 * (speed / SPEED_INIT);

                    for (const o of obstacles) {
                        const shrink = 5;
                        const px = player.x + shrink, py = player.y + shrink, pw = player.w - shrink * 2, ph = player.h - shrink * 2;
                        if (o.type === 'spike') {
                            if (rectOverlap(px, py, pw, ph, o.x + TILE * 0.25, o.y - TILE * 0.72, TILE * 0.5, TILE * 0.72)) {
                                if (!player.dead) { player.dead = true; spawnDeathParticles(); setTimeout(() => { if (running) { resetLevel(); } }, 700); }
                            }
                        } else {
                            if (rectOverlap(px, py, pw, ph, o.x, o.y, o.w, o.h)) {
                                const playerBottom = player.y + player.h;
                                const prevBottom = playerBottom - player.vy;
                                const landingOnTop = prevBottom <= o.y + 2 && player.x + player.w - shrink > o.x + 2 && player.x + shrink < o.x + o.w - 2;
                                if (!landingOnTop) {
                                    if (!player.dead) { player.dead = true; spawnDeathParticles(); setTimeout(() => { if (running) { resetLevel(); } }, 700); }
                                } else {
                                    player.y = o.y - player.h; player.vy = 0; player.onGround = true;
                                    player.rotation = Math.round(player.rotation / 90) * 90;
                                }
                            }
                        }
                    }

                    ctx.save();
                    ctx.translate(player.x + player.w / 2, player.y + player.h / 2);
                    ctx.rotate((player.rotation * Math.PI) / 180);
                    const hue2 = (bgHue + 180) % 360;
                    ctx.shadowBlur = 20; ctx.shadowColor = `hsl(${hue2},100%,60%)`;
                    ctx.fillStyle = `hsl(${hue2},90%,55%)`; ctx.fillRect(-player.w / 2, -player.h / 2, player.w, player.h);
                    ctx.shadowBlur = 0; ctx.strokeStyle = `hsl(${hue2},100%,80%)`; ctx.lineWidth = 2;
                    ctx.strokeRect(-player.w / 2 + 4, -player.h / 2 + 4, player.w - 8, player.h - 8);
                    ctx.fillStyle = `hsl(${hue2},100%,85%)`; ctx.beginPath(); ctx.arc(0, 0, 4, 0, Math.PI * 2); ctx.fill();
                    ctx.restore();

                    score += speed * 0.03;
                    levelProgress += speed * 0.03;

                    // Level complete
                    if (levelProgress >= LEVEL_LENGTH) {
                        player.dead = true;
                        // Flash + show next level
                        ctx.fillStyle = 'rgba(0,255,100,0.15)'; ctx.fillRect(0,0,canvas.width,canvas.height);
                        setTimeout(() => {
                            if (!running) return;
                            if (currentLevel < LEVELS.length - 1) {
                                selectedLevel = currentLevel + 1;
                                renderLevelSelect();
                                lsOverlay.style.display = 'flex';
                                gamePhase = 'levelselect';
                            } else {
                                running = false; cancelAnimationFrame(animId); onGameOver(Math.floor(score));
                            }
                        }, 800);
                    }
                }

                particles.forEach(p => {
                    p.x += p.vx; p.y += p.vy; p.vy += 0.15; p.life -= 0.03;
                    const r = Math.max(0, 3 * p.life);
                    if (r <= 0) return;
                    ctx.globalAlpha = Math.max(0, p.life);
                    ctx.beginPath(); ctx.arc(p.x, p.y, r, 0, Math.PI * 2); ctx.fillStyle = p.color; ctx.fill();
                });
                ctx.globalAlpha = 1;
                particles = particles.filter(p => p.life > 0);

                // HUD
                ctx.fillStyle = 'rgba(0,0,0,0.4)'; ctx.fillRect(0, 0, canvas.width, 44);
                ctx.fillStyle = '#f1f5f9'; ctx.font = "bold 13px 'Share Tech Mono'";
                ctx.textAlign = 'left'; ctx.fillText(`${LEVELS[currentLevel].name}`, 16, 16);
                ctx.fillStyle = `hsl(${bgHue},80%,65%)`; ctx.fillText(`SCORE: ${Math.floor(score)}  ATTEMPT: ${attempt}  BEST: ${Math.floor(bestScore)}`, 16, 34);
                ctx.fillStyle = `hsl(${bgHue+60},70%,60%)`; ctx.textAlign = 'right';
                ctx.fillText(`${Math.floor(pct*100)}%`, canvas.width - 16, 28); ctx.textAlign = 'left';

                if (running) animId = requestAnimationFrame(loop);
            }
            animId = requestAnimationFrame(loop);
        }
    },


    // ─── BATTLE ROYALE (Fortnite-style) with Lobby ───────────────────────────
    battleRoyale: {
        title: "BATTLE ROYALE",
        type: "internal",
        xpMultiplier: 20,
        emoji: "🪖",
        color: "linear-gradient(135deg, #1a2a1a, #0d1f0d)",
        init: function(canvas, ctx, onGameOver) {
            let running = true;
            let animId;

            const W = canvas.width, H = canvas.height;

            // ── LOBBY SYSTEM ──────────────────────────────────────────────────
            let lobbyState = 'menu';
            let partyCode = '';
            let partyMembers = [];
            let isHost = false;
            let myName = 'Player';
            let channel = null;

            const _unEl = document.getElementById('username-display') || document.querySelector('[id*="username"]');
            if (_unEl && _unEl.innerText && _unEl.innerText !== 'Ghost') myName = _unEl.innerText.trim();
            if (window._currentUsername) myName = window._currentUsername;
            const sbClient = window.sb;

            function genCode() { return Math.random().toString(36).substring(2,7).toUpperCase(); }

            function subscribeToParty(code, onSubscribed, onGameStart) {
                if (channel) { try { sbClient.removeChannel(channel); } catch(e){} channel = null; }
                channel = sbClient.channel(`party-${code}`, { config: { broadcast: { self: true } } });
                channel
                    .on('broadcast', { event: 'member_join' }, ({ payload }) => {
                        // Someone new joined — merge them in, then rebroadcast full list
                        if (payload.member) {
                            const exists = partyMembers.find(m => m.name === payload.member.name);
                            if (!exists) partyMembers = [...partyMembers, payload.member];
                            drawLobby();
                            // Rebroadcast full list so joiner sees everyone
                            if (channel) channel.send({ type:'broadcast', event:'member_sync', payload:{ members: partyMembers } });
                        }
                    })
                    .on('broadcast', { event: 'member_sync' }, ({ payload }) => {
                        // Full authoritative list from host — replace
                        if (payload.members) { partyMembers = payload.members; drawLobby(); }
                    })
                    .on('broadcast', { event: 'member_leave' }, ({ payload }) => {
                        if (payload.name) { partyMembers = partyMembers.filter(m => m.name !== payload.name); drawLobby(); }
                    })
                    .on('broadcast', { event: 'start_game' }, ({ payload }) => {
                        selectedMapIdx = payload.mapIdx || 0;
                        onGameStart();
                    })
                    .subscribe((status) => { if (status === 'SUBSCRIBED') onSubscribed(); });
            }

            // Host/joiner announce themselves — everyone merges
            function announceJoin() {
                if (channel) channel.send({ type:'broadcast', event:'member_join', payload:{ member: partyMembers.find(m => m.name === myName) } });
            }
            // Host sends full list to sync late joiners
            function broadcastSync() {
                if (channel) channel.send({ type:'broadcast', event:'member_sync', payload:{ members: partyMembers } });
            }
            function broadcastLeave() {
                if (channel) channel.send({ type:'broadcast', event:'member_leave', payload:{ name: myName } });
            }
            function broadcastStart(mapIdx) { if (channel) channel.send({ type:'broadcast', event:'start_game', payload:{ mapIdx } }); }

            // ── LOBBY OVERLAY ─────────────────────────────────────────────────
            const overlay = document.createElement('div');
            overlay.id = 'br-lobby-overlay';
            overlay.style.cssText = `position:absolute;inset:0;background:rgba(10,20,10,0.97);display:flex;flex-direction:column;align-items:center;justify-content:flex-start;overflow-y:auto;padding:24px;z-index:200;font-family:'Share Tech Mono',monospace;color:#f1f5f9;`;
            canvas.parentElement.appendChild(overlay);

            const MAPS = [
                { name: 'VERDANT ISLAND',  emoji: '🌴', desc: 'Tropical paradise. Dense trees, open center.',  color: '#166534' },
                { name: 'FROZEN TUNDRA',   emoji: '❄️', desc: 'Ice fields. Few cover spots. High visibility.', color: '#1e3a5f' },
                { name: 'DESERT RUINS',    emoji: '🏜️', desc: 'Ancient ruins. Many buildings. Tight corridors.', color: '#78350f' },
            ];
            let selectedMapIdx = 0;

            function drawLobby() {
                if (lobbyState === 'menu') {
                    const mapCards = MAPS.map((m,i) => `
                        <div onclick="window._brPickMap(${i})" style="cursor:pointer;padding:10px 14px;background:rgba(74,222,128,0.06);border:2px solid ${i===selectedMapIdx?'#4ade80':'rgba(74,222,128,0.15)'};border-radius:10px;flex:1;min-width:120px;text-align:center;">
                            <div style="font-size:22px;">${m.emoji}</div>
                            <div style="font-size:10px;color:#4ade80;letter-spacing:1px;margin-top:4px;">${m.name}</div>
                            <div style="font-size:9px;color:#6b7280;margin-top:2px;">${m.desc}</div>
                        </div>`).join('');

                    overlay.innerHTML = `
                        <div style="text-align:center;max-width:460px;width:100%;">
                            <div style="font-size:36px;margin-bottom:4px;">🪖</div>
                            <div style="font-family:'Syne',sans-serif;font-size:24px;font-weight:700;color:#4ade80;letter-spacing:2px;margin-bottom:4px;">BATTLE ROYALE</div>
                            <div style="font-size:11px;color:#6b7280;margin-bottom:16px;letter-spacing:2px;">PLAYING AS: ${myName}</div>
                            <div style="font-size:11px;color:#6b7280;letter-spacing:2px;margin-bottom:8px;">SELECT MAP</div>
                            <div style="display:flex;gap:8px;margin-bottom:20px;">${mapCards}</div>
                            <button id="br-create" style="width:100%;padding:13px;background:linear-gradient(135deg,#166534,#15803d);border:none;border-radius:10px;color:#fff;font-size:14px;font-family:'Share Tech Mono',monospace;cursor:pointer;margin-bottom:10px;letter-spacing:2px;">⚔ CREATE PARTY</button>
                            <div style="color:#6b7280;font-size:11px;margin:8px 0;letter-spacing:2px;">─── OR JOIN ───</div>
                            <div style="display:flex;gap:8px;margin-bottom:6px;">
                                <input id="br-code-input" placeholder="ENTER CODE" maxlength="5" style="flex:1;padding:12px;background:#1a2a1a;border:1px solid #374151;border-radius:8px;color:#4ade80;font-family:'Share Tech Mono',monospace;font-size:16px;letter-spacing:4px;text-align:center;text-transform:uppercase;" />
                                <button id="br-join" style="padding:12px 18px;background:#1e3a5f;border:none;border-radius:8px;color:#93c5fd;font-family:'Share Tech Mono',monospace;cursor:pointer;font-size:13px;">JOIN</button>
                            </div>
                            <div id="br-err" style="color:#ef4444;font-size:11px;min-height:14px;margin-bottom:8px;"></div>
                            <button id="br-solo" style="width:100%;padding:11px;background:transparent;border:1px solid #374151;border-radius:10px;color:#6b7280;font-size:12px;font-family:'Share Tech Mono',monospace;cursor:pointer;">▷ PLAY SOLO</button>
                        </div>`;

                    window._brPickMap = (i) => { selectedMapIdx = i; drawLobby(); };
                    document.getElementById('br-create').onclick = () => {
                        partyCode = genCode(); isHost = true;
                        partyMembers = [{ name: myName, host: true }];
                        document.getElementById('br-create').innerText = 'Connecting...';
                        subscribeToParty(partyCode, () => { announceJoin(); lobbyState = 'lobby'; drawLobby(); }, () => { overlay.remove(); startGame(); });
                    };
                    document.getElementById('br-join').onclick = () => {
                        const code = document.getElementById('br-code-input').value.trim().toUpperCase();
                        if (code.length !== 5) { document.getElementById('br-err').innerText = 'Code must be 5 characters'; return; }
                        partyCode = code; isHost = false;
                        document.getElementById('br-join').innerText = '...';
                        subscribeToParty(partyCode, () => {
                            partyMembers = [{ name: myName, host: false }];
                            announceJoin(); lobbyState = 'lobby'; drawLobby();
                        }, () => { overlay.remove(); startGame(); });
                    };
                    document.getElementById('br-solo').onclick = () => { overlay.remove(); startGame(); };

                } else if (lobbyState === 'lobby') {
                    const rows = partyMembers.map(m => `
                        <div style="display:flex;align-items:center;gap:10px;padding:10px 14px;background:rgba(74,222,128,0.07);border-radius:8px;margin-bottom:6px;">
                            <span>${m.host?'👑':'🪖'}</span>
                            <span style="flex:1;color:${m.host?'#4ade80':'#f1f5f9'};font-size:13px;">${m.name}</span>
                            <span style="font-size:10px;color:#10b981;letter-spacing:2px;">READY</span>
                        </div>`).join('');
                    const mapInfo = MAPS[selectedMapIdx];
                    overlay.innerHTML = `
                        <div style="text-align:center;max-width:420px;width:100%;">
                            <div style="font-family:'Syne',sans-serif;font-size:20px;font-weight:700;color:#4ade80;margin-bottom:4px;">PARTY LOBBY</div>
                            <div style="font-size:11px;color:#6b7280;margin-bottom:6px;letter-spacing:2px;">SHARE CODE WITH FRIENDS</div>
                            <div style="font-size:30px;font-weight:700;color:#fbbf24;letter-spacing:10px;background:#1a2a1a;padding:12px 20px;border-radius:10px;border:1px solid #374151;margin-bottom:12px;">${partyCode}</div>
                            <div style="padding:8px 14px;background:rgba(74,222,128,0.06);border-radius:8px;margin-bottom:14px;font-size:12px;">
                                MAP: <span style="color:#4ade80;">${mapInfo.emoji} ${mapInfo.name}</span>
                            </div>
                            <div style="font-size:11px;color:#6b7280;margin-bottom:8px;">PARTY (${partyMembers.length}/4)</div>
                            <div style="margin-bottom:16px;">${rows}</div>
                            ${isHost
                                ? `<button id="br-start" style="width:100%;padding:13px;background:linear-gradient(135deg,#166534,#15803d);border:none;border-radius:10px;color:#fff;font-size:14px;font-family:'Share Tech Mono',monospace;cursor:pointer;letter-spacing:2px;">▶ START GAME</button>`
                                : `<div style="color:#6b7280;font-size:12px;padding:13px;border:1px solid #374151;border-radius:10px;">Waiting for host to start...</div>`
                            }
                            <button id="br-leave" style="width:100%;margin-top:8px;padding:10px;background:transparent;border:1px solid #374151;border-radius:8px;color:#6b7280;font-size:12px;font-family:'Share Tech Mono',monospace;cursor:pointer;">✕ LEAVE PARTY</button>
                        </div>`;
                    if (isHost) {
                        document.getElementById('br-start').onclick = () => {
                            broadcastStart(selectedMapIdx);
                            setTimeout(() => { overlay.remove(); startGame(); }, 150);
                        };
                    }
                    document.getElementById('br-leave').onclick = () => {
                        broadcastLeave();
                        try { sbClient.removeChannel(channel); } catch(e){}
                        channel = null; lobbyState = 'menu'; partyMembers = []; partyCode = '';
                        drawLobby();
                    };
                }
            }
            drawLobby();
            // ── MAIN GAME ─────────────────────────────────────────────────────
            function startGame() {
                lobbyState = 'game';
                let frameCount = 0;
                let kills = 0;
                let alive = 50;
            const MAP_SIZE = 2400;
            const cam = { x: 0, y: 0 };
            const storm = { cx: MAP_SIZE / 2, cy: MAP_SIZE / 2, r: MAP_SIZE * 0.48, targetR: MAP_SIZE * 0.15, shrinkRate: 0.035 };

            // Spawn teammates near player if in party
            const spawnOffset = partyMembers.length > 1 ? 200 : 0;
            const player = { x: MAP_SIZE / 2 + (Math.random() - 0.5) * 400, y: MAP_SIZE / 2 + (Math.random() - 0.5) * 400, r: 14, angle: 0, speed: 3.2, hp: 100, maxHp: 100, shield: 50, maxShield: 50, ammo: 30, maxAmmo: 30, reloading: false, reloadTimer: 0, dead: false, invincible: 0, fireRate: 8, fireCooldown: 0, name: myName };

            // Teammate state — populated via Supabase broadcast
            let teammates = {};  // key: playerName => { x, y, angle, hp, dead, name }

            let bullets = [], bots = [], loot = [], buildings = [], trees = [], particles = [];
            const keys = {};
            let mouseX = W / 2, mouseY = H / 2;

            // ── NICKNAME CHANGE UI ────────────────────────────────────────────
            const nickBtn = document.createElement('div');
            nickBtn.id = 'br-nick-btn';
            nickBtn.style.cssText = `position:absolute;bottom:58px;right:12px;background:rgba(0,0,0,0.6);border:1px solid rgba(255,255,255,0.15);border-radius:8px;padding:5px 10px;font-family:'Share Tech Mono',monospace;font-size:11px;color:#94a3b8;cursor:pointer;z-index:50;`;
            nickBtn.innerText = `✏ ${player.name}`;
            canvas.parentElement.appendChild(nickBtn);

            nickBtn.onclick = () => {
                const input = prompt('Enter new nickname (max 16 chars):', player.name);
                if (input && input.trim().length > 0) {
                    player.name = input.trim().substring(0, 16);
                    myName = player.name;
                    nickBtn.innerText = `✏ ${player.name}`;
                    broadcastPosition();
                }
            };

            // ── TEAM POSITION SYNC ────────────────────────────────────────────
            // Always create pos channel — works for any party size
            // Use partyCode if in party, else a throwaway solo code
            const posChanName = partyCode ? `pos-${partyCode}` : `pos-solo-${Math.random().toString(36).slice(2)}`;
            const posChannel = sbClient.channel(posChanName, { config: { broadcast: { self: false } } });
            posChannel
                .on('broadcast', { event: 'pos' }, ({ payload }) => {
                    if (payload.name && payload.name !== player.name) {
                        teammates[payload.name] = {
                            x: payload.x, y: payload.y,
                            angle: payload.angle, hp: payload.hp,
                            dead: payload.dead, name: payload.name
                        };
                    }
                })
                .subscribe((status) => {
                    if (status === 'SUBSCRIBED') broadcastPosition();
                });

            let posSyncTimer = 0;
            function broadcastPosition() {
                posChannel.send({ type: 'broadcast', event: 'pos', payload: {
                    name: player.name, x: player.x, y: player.y,
                    angle: player.angle, hp: player.hp, dead: player.dead
                }});
            }

            window._gameCleanup = () => {
                running = false;
                cancelAnimationFrame(animId);
                window.removeEventListener('keydown', handleKey);
                window.removeEventListener('keyup', handleKeyUp);
                canvas.removeEventListener('mousemove', handleMove);
                canvas.removeEventListener('click', handleClick);
                if (posChannel) { try { sbClient.removeChannel(posChannel); } catch(e){} }
                const nb = document.getElementById('br-nick-btn');
                if (nb) nb.remove();
            };

            // Map generation — varies by selectedMapIdx
            const mapThemes = [
                { ground:'#1a2a1a', trees:80,  treeColor:'#166534', buildings:20, buildColor:(r)=>`hsl(${140+r*20},30%,${20+r*10}%)`, name:'VERDANT ISLAND'  },
                { ground:'#1a2a3a', trees:30,  treeColor:'#1e3a5f', buildings:15, buildColor:(r)=>`hsl(${200+r*20},25%,${30+r*10}%)`, name:'FROZEN TUNDRA'   },
                { ground:'#2a1a0a', trees:20,  treeColor:'#78350f', buildings:45, buildColor:(r)=>`hsl(${25+r*15},30%,${25+r*10}%)`,  name:'DESERT RUINS'   },
            ];
            const mapTheme = mapThemes[selectedMapIdx] || mapThemes[0];
            const numBuildings = mapTheme.buildings;
            const numTrees = mapTheme.trees;
            for (let i = 0; i < numBuildings; i++) { const r = Math.random(); buildings.push({ x: 100 + r * (MAP_SIZE-200), y: 100 + Math.random()*(MAP_SIZE-200), w: 60+r*140, h: 60+Math.random()*140, color: mapTheme.buildColor(r) }); }
            for (let i = 0; i < numTrees; i++) trees.push({ x: Math.random()*MAP_SIZE, y: Math.random()*MAP_SIZE, r: 14+Math.random()*10, color: mapTheme.treeColor });

            const lootTypes = [
                { name: 'medkit', emoji: '💊', color: '#10b981', effect: () => { player.hp = Math.min(player.maxHp, player.hp + 50); } },
                { name: 'shield', emoji: '🛡️', color: '#6366f1', effect: () => { player.shield = Math.min(player.maxShield, player.shield + 30); } },
                { name: 'ammo', emoji: '🔶', color: '#f59e0b', effect: () => { player.ammo = player.maxAmmo; } },
            ];
            for (let i = 0; i < 30; i++) { const lt = lootTypes[Math.floor(Math.random() * lootTypes.length)]; loot.push({ x: 100 + Math.random() * (MAP_SIZE - 200), y: 100 + Math.random() * (MAP_SIZE - 200), ...lt, r: 10, picked: false }); }

            for (let i = 0; i < 49; i++) bots.push({ x: 100 + Math.random() * (MAP_SIZE - 200), y: 100 + Math.random() * (MAP_SIZE - 200), r: 13, hp: 60 + Math.random() * 60, maxHp: 120, angle: 0, speed: 0.8 + Math.random() * 0.8, fireCooldown: Math.floor(Math.random() * 80), fireRate: 50 + Math.floor(Math.random() * 60), dead: false, color: `hsl(${Math.random() * 360},70%,50%)`, wanderAngle: Math.random() * Math.PI * 2, state: 'wander' });

            const handleKey = e => { keys[e.code] = true; if (e.code === 'KeyR' && !player.reloading) { player.reloading = true; player.reloadTimer = 120; } };
            const handleKeyUp = e => keys[e.code] = false;
            const handleMove = e => { const rect = canvas.getBoundingClientRect(); mouseX = (e.clientX - rect.left) * (W / rect.width); mouseY = (e.clientY - rect.top) * (H / rect.height); };
            const handleClick = () => { if (!player.dead && running) shoot(); };
            window.addEventListener('keydown', handleKey); window.addEventListener('keyup', handleKeyUp);
            canvas.addEventListener('mousemove', handleMove); canvas.addEventListener('click', handleClick);

            function collidesBuilding(nx, ny, r) { for (const b of buildings) if (nx + r > b.x && nx - r < b.x + b.w && ny + r > b.y && ny - r < b.y + b.h) return true; return false; }

            function shoot() {
                if (player.fireCooldown > 0 || player.reloading || player.ammo <= 0) return;
                const wx = mouseX + cam.x, wy = mouseY + cam.y;
                const angle = Math.atan2(wy - player.y, wx - player.x);
                bullets.push({ x: player.x + Math.cos(angle) * 20, y: player.y + Math.sin(angle) * 20, vx: Math.cos(angle) * 12, vy: Math.sin(angle) * 12, owner: 'player', life: 100, r: 4 });
                player.fireCooldown = player.fireRate; player.ammo--;
                for (let i = 0; i < 5; i++) { const a = angle + (Math.random() - 0.5) * 0.5; particles.push({ x: player.x, y: player.y, vx: Math.cos(a) * (2 + Math.random() * 3), vy: Math.sin(a) * (2 + Math.random() * 3), life: 1, color: '#fde68a', r: 2 }); }
            }

            function spawnBlood(x, y) { for (let i = 0; i < 8; i++) { const a = Math.random() * Math.PI * 2, s = 1 + Math.random() * 3; particles.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, life: 1, color: '#ef4444', r: 2 + Math.random() * 2 }); } }
            function toScreen(wx, wy) { return { sx: wx - cam.x, sy: wy - cam.y }; }

            function drawMinimap() {
                const MW = 140, MH = 140, MX = W - MW - 12, MY = 12, scale = MW / MAP_SIZE;
                ctx.fillStyle = 'rgba(0,0,0,0.55)'; ctx.fillRect(MX, MY, MW, MH);
                ctx.strokeStyle = 'rgba(255,255,255,0.2)'; ctx.lineWidth = 1; ctx.strokeRect(MX, MY, MW, MH);
                ctx.beginPath(); ctx.arc(MX + storm.cx * scale, MY + storm.cy * scale, storm.r * scale, 0, Math.PI * 2);
                ctx.strokeStyle = 'rgba(124,58,237,0.7)'; ctx.lineWidth = 1.5; ctx.stroke();
                buildings.forEach(b => { ctx.fillStyle = 'rgba(200,180,140,0.4)'; ctx.fillRect(MX + b.x * scale, MY + b.y * scale, b.w * scale, b.h * scale); });
                bots.filter(b => !b.dead).forEach(b => { ctx.beginPath(); ctx.arc(MX + b.x * scale, MY + b.y * scale, 2, 0, Math.PI * 2); ctx.fillStyle = '#ef4444'; ctx.fill(); });
                // Teammates on minimap (cyan)
                Object.values(teammates).forEach(tm => {
                    if (tm.dead) return;
                    ctx.beginPath(); ctx.arc(MX + tm.x * scale, MY + tm.y * scale, 3.5, 0, Math.PI * 2); ctx.fillStyle = '#38bdf8'; ctx.fill();
                    ctx.strokeStyle = '#0ea5e9'; ctx.lineWidth = 1; ctx.stroke();
                });
                // Player (green)
                ctx.beginPath(); ctx.arc(MX + player.x * scale, MY + player.y * scale, 4, 0, Math.PI * 2); ctx.fillStyle = '#10b981'; ctx.fill();
                ctx.strokeStyle = '#fff'; ctx.lineWidth = 1; ctx.stroke();
                // Teammate names on minimap
                ctx.font = "7px 'Share Tech Mono'"; ctx.fillStyle = '#38bdf8'; ctx.textAlign = 'center';
                Object.values(teammates).forEach(tm => { if (!tm.dead) ctx.fillText(tm.name || '?', MX + tm.x * scale, MY + tm.y * scale - 5); });
                ctx.textAlign = 'left';
            }

            function loop() {
                if (!running) return;
                frameCount++;
                if (storm.r > storm.targetR) storm.r -= storm.shrinkRate;

                // Broadcast position every 3 frames
                posSyncTimer++;
                if (posSyncTimer % 3 === 0) broadcastPosition();

                if (!player.dead) {
                    const wx = mouseX + cam.x, wy = mouseY + cam.y;
                    player.angle = Math.atan2(wy - player.y, wx - player.x);
                    let dx = 0, dy = 0;
                    if (keys['KeyW'] || keys['ArrowUp']) dy -= 1;
                    if (keys['KeyS'] || keys['ArrowDown']) dy += 1;
                    if (keys['KeyA'] || keys['ArrowLeft']) dx -= 1;
                    if (keys['KeyD'] || keys['ArrowRight']) dx += 1;
                    if (dx !== 0 && dy !== 0) { dx *= 0.707; dy *= 0.707; }
                    const nx = player.x + dx * player.speed, ny = player.y + dy * player.speed;
                    if (!collidesBuilding(nx, player.y, player.r)) player.x = Math.max(player.r, Math.min(MAP_SIZE - player.r, nx));
                    if (!collidesBuilding(player.x, ny, player.r)) player.y = Math.max(player.r, Math.min(MAP_SIZE - player.r, ny));
                    if (player.fireCooldown > 0) player.fireCooldown--;
                    if (player.reloading) { player.reloadTimer--; if (player.reloadTimer <= 0) { player.reloading = false; player.ammo = player.maxAmmo; } }
                    if (player.invincible > 0) player.invincible--;
                    if (keys['Space']) shoot();
                    if (Math.hypot(player.x - storm.cx, player.y - storm.cy) > storm.r) player.hp -= 0.08;
                    loot.filter(l => !l.picked).forEach(l => { if (Math.hypot(player.x - l.x, player.y - l.y) < player.r + l.r + 10) { l.picked = true; l.effect(); } });
                    if (player.hp <= 0) {
                        player.dead = true; spawnBlood(player.x, player.y);
                        setTimeout(() => { running = false; window.removeEventListener('keydown', handleKey); window.removeEventListener('keyup', handleKeyUp); canvas.removeEventListener('mousemove', handleMove); canvas.removeEventListener('click', handleClick); cancelAnimationFrame(animId); onGameOver(kills * 100 + Math.max(0, 50 - alive)); }, 800);
                    }
                }

                cam.x = Math.max(0, Math.min(MAP_SIZE - W, player.x - W / 2));
                cam.y = Math.max(0, Math.min(MAP_SIZE - H, player.y - H / 2));

                bots.filter(b => !b.dead).forEach(b => {
                    const dist = Math.hypot(player.x - b.x, player.y - b.y);
                    if (dist < 300) b.state = 'chase'; else if (dist > 500) b.state = 'wander';
                    let mAngle = b.state === 'chase' ? Math.atan2(player.y - b.y, player.x - b.x) : (b.wanderAngle += (Math.random() - 0.5) * 0.15, b.wanderAngle);
                    b.angle = mAngle;
                    const bnx = b.x + Math.cos(mAngle) * b.speed, bny = b.y + Math.sin(mAngle) * b.speed;
                    if (!collidesBuilding(bnx, b.y, b.r)) b.x = Math.max(b.r, Math.min(MAP_SIZE - b.r, bnx));
                    if (!collidesBuilding(b.x, bny, b.r)) b.y = Math.max(b.r, Math.min(MAP_SIZE - b.r, bny));
                    if (Math.hypot(b.x - storm.cx, b.y - storm.cy) > storm.r) b.hp -= 0.05;
                    if (b.hp <= 0) { b.dead = true; alive--; spawnBlood(b.x, b.y); return; }
                    b.fireCooldown--;
                    if (b.fireCooldown <= 0 && b.state === 'chase' && dist < 350 && !player.dead) {
                        b.fireCooldown = b.fireRate;
                        const ang = Math.atan2(player.y - b.y, player.x - b.x) + (Math.random() - 0.5) * 0.35;
                        bullets.push({ x: b.x + Math.cos(ang) * 16, y: b.y + Math.sin(ang) * 16, vx: Math.cos(ang) * 9, vy: Math.sin(ang) * 9, owner: 'bot', life: 80, r: 3 });
                    }
                });

                bullets.forEach(bu => { bu.x += bu.vx; bu.y += bu.vy; bu.life--; });
                bullets = bullets.filter(bu => {
                    if (bu.life <= 0 || collidesBuilding(bu.x, bu.y, bu.r) || bu.x < 0 || bu.x > MAP_SIZE || bu.y < 0 || bu.y > MAP_SIZE) return false;
                    if (bu.owner === 'player') {
                        for (let i = bots.length - 1; i >= 0; i--) {
                            const b = bots[i];
                            if (!b.dead && Math.hypot(bu.x - b.x, bu.y - b.y) < bu.r + b.r) { b.hp -= 25 + Math.random() * 15; spawnBlood(b.x, b.y); if (b.hp <= 0) { b.dead = true; alive--; kills++; spawnBlood(b.x, b.y); } return false; }
                        }
                    }
                    // Bots don't hurt teammates
                    const hitTeammate = Object.values(teammates).some(tm => !tm.dead && Math.hypot(bu.x - tm.x, bu.y - tm.y) < bu.r + 14);
                    if (hitTeammate) return false;
                    if (bu.owner === 'bot' && !player.dead && player.invincible <= 0 && Math.hypot(bu.x - player.x, bu.y - player.y) < bu.r + player.r) {
                        const dmg = 10 + Math.random() * 10;
                        if (player.shield > 0) { player.shield -= dmg; if (player.shield < 0) { player.hp += player.shield; player.shield = 0; } } else player.hp -= dmg;
                        player.invincible = 15; spawnBlood(player.x, player.y); return false;
                    }
                    return true;
                });

                particles.forEach(p => { p.x += p.vx; p.y += p.vy; p.vx *= 0.92; p.vy *= 0.92; p.life -= 0.04; });
                particles = particles.filter(p => p.life > 0);

                // Draw ground
                const ts = 80, sx2 = Math.floor(cam.x / ts) * ts, sy2 = Math.floor(cam.y / ts) * ts;
                for (let gx = sx2; gx < cam.x + W + ts; gx += ts) for (let gy = sy2; gy < cam.y + H + ts; gy += ts) { ctx.fillStyle = ((Math.floor(gx / ts) + Math.floor(gy / ts)) % 2) === 0 ? 'hsl(120,35%,18%)' : 'hsl(120,35%,20%)'; ctx.fillRect(gx - cam.x, gy - cam.y, ts, ts); }
                // Map border
                ctx.strokeStyle = '#ef4444'; ctx.lineWidth = 4; ctx.strokeRect(-cam.x, -cam.y, MAP_SIZE, MAP_SIZE);

                // Storm overlay
                const { sx: scx, sy: scy } = toScreen(storm.cx, storm.cy);
                ctx.save(); ctx.globalAlpha = 0.18; ctx.fillStyle = '#7c3aed'; ctx.fillRect(0, 0, W, H);
                ctx.globalCompositeOperation = 'destination-out'; ctx.beginPath(); ctx.arc(scx, scy, storm.r, 0, Math.PI * 2); ctx.fill(); ctx.restore();
                ctx.beginPath(); ctx.arc(scx, scy, storm.r, 0, Math.PI * 2); ctx.strokeStyle = 'rgba(124,58,237,0.6)'; ctx.lineWidth = 3; ctx.stroke();

                trees.forEach(t => { const { sx, sy } = toScreen(t.x, t.y); if (sx < -t.r * 2 || sx > W + t.r * 2 || sy < -t.r * 2 || sy > H + t.r * 2) return; ctx.beginPath(); ctx.arc(sx, sy, t.r, 0, Math.PI * 2); ctx.fillStyle = '#166534'; ctx.shadowBlur = 6; ctx.shadowColor = '#14532d'; ctx.fill(); ctx.shadowBlur = 0; ctx.beginPath(); ctx.arc(sx - 2, sy - 3, t.r * 0.65, 0, Math.PI * 2); ctx.fillStyle = '#15803d'; ctx.fill(); });
                buildings.forEach(b => { const { sx, sy } = toScreen(b.x, b.y); if (sx > W || sx + b.w < 0 || sy > H || sy + b.h < 0) return; ctx.fillStyle = b.color; ctx.fillRect(sx, sy, b.w, b.h); ctx.strokeStyle = 'rgba(255,255,255,0.1)'; ctx.lineWidth = 1; ctx.strokeRect(sx, sy, b.w, b.h); ctx.fillStyle = 'rgba(0,0,0,0.4)'; ctx.fillRect(sx + b.w / 2 - 8, sy + b.h - 20, 16, 20); });
                loot.filter(l => !l.picked).forEach(l => { const { sx, sy } = toScreen(l.x, l.y); if (sx < -20 || sx > W + 20 || sy < -20 || sy > H + 20) return; ctx.shadowBlur = 12; ctx.shadowColor = l.color; ctx.beginPath(); ctx.arc(sx, sy, l.r, 0, Math.PI * 2); ctx.fillStyle = l.color; ctx.fill(); ctx.shadowBlur = 0; ctx.font = '14px serif'; ctx.textAlign = 'center'; ctx.fillText(l.emoji, sx, sy + 5); });

                bots.filter(b => !b.dead).forEach(b => {
                    const { sx, sy } = toScreen(b.x, b.y); if (sx < -30 || sx > W + 30 || sy < -30 || sy > H + 30) return;
                    ctx.save(); ctx.translate(sx, sy); ctx.rotate(b.angle + Math.PI / 2);
                    ctx.shadowBlur = 10; ctx.shadowColor = b.color; ctx.fillStyle = b.color;
                    ctx.beginPath(); ctx.ellipse(0, 0, b.r, b.r * 1.3, 0, 0, Math.PI * 2); ctx.fill();
                    ctx.fillStyle = '#374151'; ctx.shadowBlur = 0; ctx.fillRect(-3, -b.r * 1.3 - 10, 6, 14); ctx.restore();
                    const bw2 = 30; ctx.fillStyle = '#1f2937'; ctx.fillRect(sx - bw2 / 2, sy - b.r - 14, bw2, 4);
                    ctx.fillStyle = '#ef4444'; ctx.fillRect(sx - bw2 / 2, sy - b.r - 14, bw2 * (b.hp / b.maxHp), 4);
                });

                // Draw teammates
                Object.values(teammates).forEach(tm => {
                    if (tm.dead) return;
                    const { sx, sy } = toScreen(tm.x, tm.y);
                    if (sx < -40 || sx > W + 40 || sy < -40 || sy > H + 40) return;
                    ctx.save(); ctx.translate(sx, sy); ctx.rotate((tm.angle || 0) + Math.PI / 2);
                    ctx.shadowBlur = 16; ctx.shadowColor = '#38bdf8';
                    ctx.fillStyle = '#38bdf8';
                    ctx.beginPath(); ctx.ellipse(0, 0, player.r, player.r * 1.3, 0, 0, Math.PI * 2); ctx.fill();
                    ctx.fillStyle = '#374151'; ctx.shadowBlur = 0; ctx.fillRect(-3, -player.r * 1.3 - 12, 6, 16);
                    ctx.restore();
                    // Teammate name tag
                    ctx.fillStyle = 'rgba(0,0,0,0.55)'; ctx.fillRect(sx - 28, sy - player.r * 1.3 - 28, 56, 14);
                    ctx.fillStyle = '#38bdf8'; ctx.font = "bold 9px 'Share Tech Mono'"; ctx.textAlign = 'center';
                    ctx.fillText(tm.name || '?', sx, sy - player.r * 1.3 - 17);
                    // Teammate HP bar
                    ctx.fillStyle = '#1f2937'; ctx.fillRect(sx - 20, sy - player.r * 1.3 - 14, 40, 4);
                    ctx.fillStyle = '#10b981'; ctx.fillRect(sx - 20, sy - player.r * 1.3 - 14, 40 * Math.max(0, (tm.hp || 100) / 100), 4);
                    ctx.textAlign = 'left';
                });

                if (!player.dead) {
                    const { sx, sy } = toScreen(player.x, player.y);
                    const flash = player.invincible > 0 && Math.floor(player.invincible / 3) % 2 === 0;
                    ctx.save(); ctx.translate(sx, sy); ctx.rotate(player.angle + Math.PI / 2);
                    ctx.shadowBlur = 16; ctx.shadowColor = '#10b981'; ctx.fillStyle = flash ? '#fff' : '#10b981';
                    ctx.beginPath(); ctx.ellipse(0, 0, player.r, player.r * 1.3, 0, 0, Math.PI * 2); ctx.fill();
                    ctx.fillStyle = '#374151'; ctx.shadowBlur = 0; ctx.fillRect(-3, -player.r * 1.3 - 12, 6, 16);
                    ctx.fillStyle = '#064e3b'; ctx.fillRect(player.r - 4, -8, 8, 12); ctx.restore();
                    // Player name tag
                    ctx.fillStyle = 'rgba(0,0,0,0.55)'; ctx.fillRect(sx - 28, sy - player.r * 1.3 - 28, 56, 14);
                    ctx.fillStyle = '#10b981'; ctx.font = "bold 9px 'Share Tech Mono'"; ctx.textAlign = 'center';
                    ctx.fillText(player.name, sx, sy - player.r * 1.3 - 17); ctx.textAlign = 'left';
                    ctx.strokeStyle = 'rgba(255,255,255,0.5)'; ctx.lineWidth = 1;
                    ctx.beginPath(); ctx.moveTo(mouseX - 10, mouseY); ctx.lineTo(mouseX + 10, mouseY); ctx.stroke();
                    ctx.beginPath(); ctx.moveTo(mouseX, mouseY - 10); ctx.lineTo(mouseX, mouseY + 10); ctx.stroke();
                    ctx.beginPath(); ctx.arc(mouseX, mouseY, 4, 0, Math.PI * 2); ctx.strokeStyle = 'rgba(255,255,255,0.3)'; ctx.stroke();
                }

                bullets.forEach(bu => { const { sx, sy } = toScreen(bu.x, bu.y); ctx.shadowBlur = 8; ctx.shadowColor = bu.owner === 'player' ? '#fde68a' : '#f87171'; ctx.fillStyle = bu.owner === 'player' ? '#fde68a' : '#f87171'; ctx.beginPath(); ctx.arc(sx, sy, bu.r, 0, Math.PI * 2); ctx.fill(); ctx.shadowBlur = 0; });
                particles.forEach(p => { const { sx, sy } = toScreen(p.x, p.y); ctx.globalAlpha = Math.max(0, p.life); ctx.fillStyle = p.color; ctx.beginPath(); ctx.arc(sx, sy, p.r * p.life, 0, Math.PI * 2); ctx.fill(); });
                ctx.globalAlpha = 1;

                // HUD
                ctx.fillStyle = 'rgba(0,0,0,0.5)'; ctx.fillRect(0, 0, W, 50);
                const hpW = 180;
                ctx.fillStyle = '#1f2937'; ctx.fillRect(16, 14, hpW, 10);
                ctx.fillStyle = player.hp > 50 ? '#10b981' : player.hp > 25 ? '#f59e0b' : '#ef4444'; ctx.fillRect(16, 14, hpW * (Math.max(0, player.hp) / player.maxHp), 10);
                ctx.fillStyle = '#fff'; ctx.font = "bold 11px 'Share Tech Mono'"; ctx.textAlign = 'left'; ctx.fillText(`❤ ${Math.ceil(Math.max(0, player.hp))}`, 20, 24);
                ctx.fillStyle = '#1f2937'; ctx.fillRect(16, 28, hpW, 8);
                ctx.fillStyle = '#6366f1'; ctx.fillRect(16, 28, hpW * (player.shield / player.maxShield), 8);
                ctx.fillStyle = '#a5b4fc'; ctx.font = "bold 10px 'Share Tech Mono'"; ctx.fillText(`🛡 ${Math.ceil(Math.max(0, player.shield))}`, 20, 38);
                ctx.fillStyle = '#f1f5f9'; ctx.font = "bold 13px 'Share Tech Mono'"; ctx.textAlign = 'center';
                ctx.fillText(`☠ KILLS: ${kills}`, W / 2, 26); ctx.fillText(`👥 ALIVE: ${alive}`, W / 2, 43);
                ctx.textAlign = 'right'; ctx.fillStyle = player.reloading ? '#f59e0b' : '#f1f5f9'; ctx.font = "bold 13px 'Share Tech Mono'";
                ctx.fillText(player.reloading ? 'RELOADING...' : `🔶 ${player.ammo}/${player.maxAmmo}`, W - 16, 26);
                ctx.fillStyle = '#64748b'; ctx.font = "11px 'Share Tech Mono'"; ctx.fillText('CLICK to shoot · R reload · WASD move', W - 16, 43);
                ctx.textAlign = 'left';

                // Team panel (bottom left)
                const tmList = Object.values(teammates);
                if (tmList.length > 0) {
                    ctx.fillStyle = 'rgba(0,0,0,0.5)'; ctx.fillRect(12, H - 50 - tmList.length * 34, 160, tmList.length * 34 + 4);
                    tmList.forEach((tm, i) => {
                        const ty = H - 46 - (tmList.length - 1 - i) * 34;
                        ctx.fillStyle = tm.dead ? '#ef4444' : '#38bdf8';
                        ctx.font = "bold 10px 'Share Tech Mono'"; ctx.textAlign = 'left';
                        ctx.fillText((tm.dead ? '💀 ' : '🤝 ') + (tm.name || 'Teammate'), 18, ty);
                        if (!tm.dead) {
                            ctx.fillStyle = '#1f2937'; ctx.fillRect(18, ty + 4, 140, 6);
                            ctx.fillStyle = '#10b981'; ctx.fillRect(18, ty + 4, 140 * Math.max(0, (tm.hp || 0) / 100), 6);
                        }
                    });
                }

                const pDist = Math.hypot(player.x - storm.cx, player.y - storm.cy);
                if (pDist > storm.r - 120) { ctx.fillStyle = 'rgba(124,58,237,0.85)'; ctx.fillRect(W / 2 - 100, H - 40, 200, 28); ctx.fillStyle = '#fff'; ctx.font = "bold 12px 'Share Tech Mono'"; ctx.textAlign = 'center'; ctx.fillText('⚠ STORM APPROACHING', W / 2, H - 22); ctx.textAlign = 'left'; }

                drawMinimap();
                if (running) animId = requestAnimationFrame(loop);
            }
            animId = requestAnimationFrame(loop);
            } // end startGame

            // Clean up everything including lobby overlay
            window._gameCleanup = () => {
                running = false;
                cancelAnimationFrame(animId);
                if (channel && channel._ws) channel._ws.close();
                const lo = document.getElementById('br-lobby-overlay');
                if (lo) lo.remove();
            };
        }
    },
    
    fnaeEpsteins: {
        title: "Five Nights At Epstiens",
        type: "remote",
        xpMultiplier: 15,
        emoji: "👁️",
        color: "linear-gradient(135deg, #0a0000, #1a0000)",
        url: "https://cool-websites.github.io/Five-Nights-at-Epstein/"
    },

    amongus: {
        title: "among us",
        type: "remote",
        xpMultiplier: 15,
        emoji: "👽",
        color: "linear-gradient(135deg, #0a0000, #1a0000)",
        url: "https://db.duckmath.org/html/among_us/"
    },

    minecraft: {
        title: "minecraft",
        type: "remote",
        xpMultiplier: 15,
        emoji: "🧱",
        color: "linear-gradient(135deg, #0a0000, #1a0000)",
        url: "https://db.duckmath.org/html/minecraft/"
    },
    classicminecraft: {
        title: "classic minecraft",
        type: "remote",
        xpMultiplier: 15,
        emoji: "🧱",
        color: "linear-gradient(135deg, #0a0000, #1a0000",
        url: "https://db2.duckmath.org/2026/more/duckcraft/pre.html"
};
