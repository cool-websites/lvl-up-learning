// ============================================================
//  LvlUp Pro — JUKEBOX
//  A shared, YouTube-powered listening queue. Anyone logged in
//  can suggest a song; enough skip votes moves to the next one.
//  There is no pause/rewind by design — it just plays.
//
//  ONE-TIME SETUP (do this before this file will do anything):
//  1. Run jukebox_schema.sql in your Supabase SQL editor.
//  2. In the Supabase dashboard, go to Database > Replication
//     and make sure "jukebox_current" and "jukebox_queue" are
//     toggled ON (the SQL script also tries to do this for you).
//  3. Drop this file next to index.html and games.js.
//
//  This file is self-contained: it injects its own sidebar tab,
//  view, and styles at load time, and hooks into the existing
//  switchTab() function the same way the other extended tabs do.
// ============================================================

(function () {
    // ── Tunables ──────────────────────────────────────────────────────────
    const SKIP_VOTE_MIN = 2;        // never require fewer than this many votes
    const SKIP_VOTE_RATIO = 0.5;    // ...or this fraction of people in the room, whichever is bigger
    const LEADER_TICK_MS = 3000;    // how often the elected "leader" tab checks for work to do

    // ── State ─────────────────────────────────────────────────────────────
    let ytPlayer = null;
    let ytApiReady = false;
    let playerReady = false;
    let isLeader = false;
    let presenceCount = 1;
    let presenceChannel = null;
    let currentRow = null;      // last-known row from jukebox_current
    let queueRows = [];         // last-known rows from jukebox_queue
    let myVoterId = null;
    let myDisplayName = null;
    let isGhost = true;
    let soundEnabled = false;

    // ── Identity (independent of index.html's internal variables) ──────────
    async function refreshIdentity() {
        try {
            const { data } = await window.sb.auth.getSession();
            const user = data && data.session && data.session.user;
            if (user) {
                isGhost = false;
                myVoterId = user.id;
                myDisplayName = window._currentUsername || (user.user_metadata && user.user_metadata.username) || user.email.split('@')[0];
            } else {
                isGhost = true;
                myVoterId = null;
                myDisplayName = null;
            }
        } catch (e) {
            isGhost = true;
        }
    }

    // ── YouTube URL/ID parsing ───────────────────────────────────────────
    function parseYouTubeId(input) {
        input = (input || '').trim();
        if (/^[\w-]{11}$/.test(input)) return input;
        const m = input.match(/(?:youtube\.com\/watch\?v=|youtube\.com\/shorts\/|youtube\.com\/embed\/|youtu\.be\/)([\w-]{11})/);
        return m ? m[1] : null;
    }

    async function fetchOEmbed(videoId) {
        const url = 'https://www.youtube.com/oembed?format=json&url=' + encodeURIComponent('https://www.youtube.com/watch?v=' + videoId);
        const res = await fetch(url);
        if (!res.ok) throw new Error('Video not found or not embeddable');
        return res.json();
    }

    // ── Styles ────────────────────────────────────────────────────────────
    function injectStyles() {
        const css = `
            #jukebox-view { display: none; padding: 28px 32px; max-width: 900px; }
            .jb-nowplaying { background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius-lg); padding: 20px; display: flex; gap: 18px; align-items: center; margin-bottom: 24px; }
            .jb-thumb { width: 120px; height: 90px; object-fit: cover; border-radius: 10px; background: var(--surface3); flex-shrink: 0; }
            .jb-np-info { flex: 1; min-width: 0; }
            .jb-np-title { font-family: 'Syne', sans-serif; font-weight: 700; font-size: 16px; margin-bottom: 4px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
            .jb-np-sub { color: var(--text-muted); font-size: 12px; }
            .jb-player-box { width: 160px; height: 90px; border-radius: 10px; overflow: hidden; flex-shrink: 0; background: #000; position: relative; }
            .jb-player-box iframe { width: 100%; height: 100%; }
            .jb-sound-btn { position: absolute; inset: 0; background: rgba(0,0,0,0.6); color: white; border: none; font-size: 12px; font-weight: 600; cursor: pointer; }
            .jb-skip-btn { padding: 10px 16px; border-radius: 10px; border: 1px solid var(--border2); background: var(--brand-dim); color: var(--text); font-family: 'Syne', sans-serif; font-weight: 700; font-size: 12px; cursor: pointer; white-space: nowrap; }
            .jb-skip-btn:disabled { opacity: 0.5; cursor: not-allowed; }
            .jb-suggest-row { display: flex; gap: 10px; margin-bottom: 22px; }
            .jb-suggest-input { flex: 1; padding: 12px 16px; border-radius: 10px; border: 1px solid var(--border); background: var(--bg2); color: var(--text); font-family: 'Inter', sans-serif; font-size: 13px; }
            .jb-suggest-btn { padding: 12px 20px; border-radius: 10px; border: none; background: var(--brand); color: white; font-family: 'Syne', sans-serif; font-weight: 700; font-size: 13px; cursor: pointer; }
            .jb-queue-title { font-family: 'Syne', sans-serif; font-weight: 700; font-size: 13px; color: var(--text-dim); margin-bottom: 10px; letter-spacing: 0.5px; }
            .jb-queue-item { display: flex; align-items: center; gap: 12px; padding: 10px; border-radius: 10px; border: 1px solid var(--border); margin-bottom: 8px; background: var(--surface); }
            .jb-queue-thumb { width: 56px; height: 42px; object-fit: cover; border-radius: 6px; background: var(--surface3); flex-shrink: 0; }
            .jb-queue-info { flex: 1; min-width: 0; }
            .jb-queue-song { font-size: 13px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
            .jb-queue-by { font-size: 11px; color: var(--text-muted); }
            .jb-queue-remove { background: none; border: none; color: var(--text-muted); cursor: pointer; font-size: 14px; }
            .jb-empty { color: var(--text-muted); font-size: 13px; padding: 16px; text-align: center; }
            .jb-ghost-note { color: var(--text-muted); font-size: 12px; margin-bottom: 16px; }
        `;
        const style = document.createElement('style');
        style.textContent = css;
        document.head.appendChild(style);
    }

    // ── HTML injection ───────────────────────────────────────────────────
    function injectView() {
        const html = `
            <div id="jukebox-view">
                <div class="lb-header"><h2>🎧 Jukebox</h2></div>
                <div class="jb-nowplaying" id="jb-nowplaying">
                    <div class="jb-player-box">
                        <div id="jb-yt-player"></div>
                        <button class="jb-sound-btn" id="jb-sound-btn" onclick="__jukebox.enableSound()">🔊 Tap for sound</button>
                    </div>
                    <div class="jb-np-info">
                        <div class="jb-np-title" id="jb-np-title">Nothing playing yet</div>
                        <div class="jb-np-sub" id="jb-np-sub">Suggest a song to get things started</div>
                    </div>
                    <button class="jb-skip-btn" id="jb-skip-btn" onclick="__jukebox.voteSkip()" disabled>Vote Skip</button>
                </div>

                <div class="jb-ghost-note" id="jb-ghost-note" style="display:none;">Log in to suggest songs or vote to skip.</div>

                <div class="jb-suggest-row">
                    <input class="jb-suggest-input" id="jb-suggest-input" placeholder="Paste a YouTube link..." onkeydown="if(event.key==='Enter')__jukebox.suggest()">
                    <button class="jb-suggest-btn" onclick="__jukebox.suggest()">+ Add to Queue</button>
                </div>

                <div class="jb-queue-title">UP NEXT</div>
                <div id="jb-queue-list"><div class="jb-empty">Queue is empty</div></div>
            </div>
        `;
        const anchor = document.getElementById('gc-view') || document.querySelector('.sidebar').parentElement;
        anchor.insertAdjacentHTML('afterend', html);

        const navHtml = `
            <div class="nav-item" id="tab-jukebox" onclick="switchTab('jukebox')">
                <span class="nav-icon">🎧</span> Jukebox
            </div>
        `;
        const navAnchor = document.getElementById('tab-shop') || document.querySelector('.sidebar-section');
        navAnchor.insertAdjacentHTML('afterend', navHtml);
    }

    // ── Hook into the existing tab switcher ─────────────────────────────
    function hookSwitchTab() {
        const prevSwitchTab = window.switchTab;
        window.switchTab = function (type) {
            if (type === 'jukebox') {
                document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));
                document.querySelectorAll('[id$="-view"]').forEach(el => { el.style.display = (el.id === 'jukebox-view') ? 'block' : 'none'; });
                document.getElementById('tab-jukebox').classList.add('active');
                const titleEl = document.getElementById('active-title');
                if (titleEl) titleEl.innerText = 'JUKEBOX';
                refreshIdentity().then(updateGatingUI);
                return;
            }
            document.getElementById('jukebox-view').style.display = 'none';
            prevSwitchTab(type);
        };
    }

    function updateGatingUI() {
        document.getElementById('jb-ghost-note').style.display = isGhost ? 'block' : 'none';
        document.getElementById('jb-suggest-input').disabled = isGhost;
        document.querySelector('.jb-suggest-btn').disabled = isGhost;
        renderNowPlaying();
    }

    // ── YouTube player ───────────────────────────────────────────────────
    window.onYouTubeIframeAPIReady = function () {
        ytApiReady = true;
        maybeCreatePlayer();
    };

    function maybeCreatePlayer() {
        if (!ytApiReady || ytPlayer || !document.getElementById('jb-yt-player')) return;
        ytPlayer = new YT.Player('jb-yt-player', {
            height: '90', width: '160',
            playerVars: { autoplay: 1, mute: 1, controls: 0, disablekb: 1, fs: 0, modestbranding: 1, rel: 0, iv_load_policy: 3 },
            events: {
                onReady: function () { playerReady = true; syncPlayerToCurrent(); },
                onStateChange: function (e) {
                    if (e.data === YT.PlayerState.ENDED && isLeader) advanceQueue();
                }
            }
        });
    }

    function syncPlayerToCurrent() {
        if (!playerReady || !ytPlayer) return;
        if (currentRow && currentRow.video_id) {
            const elapsed = currentRow.started_at ? Math.max(0, (Date.now() - new Date(currentRow.started_at).getTime()) / 1000) : 0;
            ytPlayer.loadVideoById({ videoId: currentRow.video_id, startSeconds: elapsed });
            if (!soundEnabled) ytPlayer.mute();
        } else {
            ytPlayer.stopVideo();
        }
    }

    window.__jukebox = window.__jukebox || {};
    window.__jukebox.enableSound = function () {
        soundEnabled = true;
        if (ytPlayer) { ytPlayer.unMute(); ytPlayer.setVolume(100); }
        const btn = document.getElementById('jb-sound-btn');
        if (btn) btn.style.display = 'none';
    };

    // ── Rendering ─────────────────────────────────────────────────────────
    function renderNowPlaying() {
        const titleEl = document.getElementById('jb-np-title');
        const subEl = document.getElementById('jb-np-sub');
        const skipBtn = document.getElementById('jb-skip-btn');
        if (!titleEl) return;

        if (currentRow && currentRow.video_id) {
            titleEl.textContent = currentRow.title || 'Untitled';
            const votes = (currentRow.skip_votes || []).length;
            const threshold = Math.max(SKIP_VOTE_MIN, Math.ceil(presenceCount * SKIP_VOTE_RATIO));
            subEl.textContent = 'Added by ' + (currentRow.added_by || 'someone');
            skipBtn.textContent = 'Vote Skip (' + votes + '/' + threshold + ')';
            const alreadyVoted = myVoterId && (currentRow.skip_votes || []).includes(myVoterId);
            skipBtn.disabled = isGhost || alreadyVoted;
        } else {
            titleEl.textContent = 'Nothing playing yet';
            subEl.textContent = 'Suggest a song to get things started';
            skipBtn.textContent = 'Vote Skip';
            skipBtn.disabled = true;
        }
    }

    function renderQueue() {
        const el = document.getElementById('jb-queue-list');
        if (!el) return;
        if (!queueRows.length) {
            el.innerHTML = '<div class="jb-empty">Queue is empty — add something!</div>';
            return;
        }
        el.innerHTML = queueRows.map(q => `
            <div class="jb-queue-item">
                <img class="jb-queue-thumb" src="${q.thumbnail || ''}" onerror="this.style.visibility='hidden'">
                <div class="jb-queue-info">
                    <div class="jb-queue-song">${escHtml(q.title || 'Untitled')}</div>
                    <div class="jb-queue-by">Added by ${escHtml(q.added_by || 'someone')}</div>
                </div>
                ${(!isGhost && myVoterId === q.added_by_id) ? `<button class="jb-queue-remove" onclick="__jukebox.remove('${q.id}')">✕</button>` : ''}
            </div>
        `).join('');
    }

    // ── Data actions ─────────────────────────────────────────────────────
    window.__jukebox.suggest = async function () {
        if (isGhost) { showToast('Log in to suggest a song'); return; }
        const input = document.getElementById('jb-suggest-input');
        const id = parseYouTubeId(input.value);
        if (!id) { showToast('Paste a valid YouTube link'); return; }
        try {
            const meta = await fetchOEmbed(id);
            const { error } = await window.sb.from('jukebox_queue').insert({
                video_id: id,
                title: meta.title,
                thumbnail: meta.thumbnail_url,
                added_by: myDisplayName,
                added_by_id: myVoterId
            });
            if (error) throw error;
            input.value = '';
            showToast('Added to queue 🎵');
        } catch (e) {
            showToast('Could not add that video');
        }
    };

    window.__jukebox.remove = async function (id) {
        if (isGhost) return;
        await window.sb.from('jukebox_queue').delete().eq('id', id).eq('added_by_id', myVoterId);
    };

    window.__jukebox.voteSkip = async function () {
        if (isGhost || !currentRow || !currentRow.video_id) return;
        const votes = currentRow.skip_votes || [];
        if (votes.includes(myVoterId)) return;
        const newVotes = votes.concat([myVoterId]);
        await window.sb.from('jukebox_current').update({ skip_votes: newVotes }).eq('id', 1);
    };

    async function advanceQueue() {
        const { data: nextSongs } = await window.sb.from('jukebox_queue').select('*').order('created_at', { ascending: true }).limit(1);
        const next = nextSongs && nextSongs[0];
        if (next) {
            await window.sb.from('jukebox_current').update({
                video_id: next.video_id, title: next.title, thumbnail: next.thumbnail,
                added_by: next.added_by, started_at: new Date().toISOString(), skip_votes: []
            }).eq('id', 1);
            await window.sb.from('jukebox_queue').delete().eq('id', next.id);
        } else {
            await window.sb.from('jukebox_current').update({
                video_id: null, title: null, thumbnail: null, added_by: null, started_at: null, skip_votes: []
            }).eq('id', 1);
        }
    }

    // ── Realtime subscriptions ───────────────────────────────────────────
    function subscribeRealtime() {
        window.sb.channel('jukebox-current-changes')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'jukebox_current' }, payload => {
                currentRow = payload.new;
                renderNowPlaying();
                syncPlayerToCurrent();
            })
            .subscribe();

        window.sb.channel('jukebox-queue-changes')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'jukebox_queue' }, () => refreshQueue())
            .subscribe();

        window.sb.from('jukebox_current').select('*').eq('id', 1).single().then(({ data }) => {
            currentRow = data;
            renderNowPlaying();
            syncPlayerToCurrent();
        });
        refreshQueue();
    }

    async function refreshQueue() {
        const { data } = await window.sb.from('jukebox_queue').select('*').order('created_at', { ascending: true });
        queueRows = data || [];
        renderQueue();
    }

    // ── Presence / leader election ───────────────────────────────────────
    function setupPresence() {
        const myKey = 'anon_' + Math.random().toString(36).slice(2);
        presenceChannel = window.sb.channel('jukebox-room', { config: { presence: { key: myKey } } });
        presenceChannel.on('presence', { event: 'sync' }, () => {
            const state = presenceChannel.presenceState();
            const keys = Object.keys(state);
            presenceCount = Math.max(1, keys.length);
            let lowestKey = null, lowestTime = Infinity;
            keys.forEach(k => {
                const t = (state[k][0] && state[k][0].online_at) || Infinity;
                if (t < lowestTime) { lowestTime = t; lowestKey = k; }
            });
            isLeader = (lowestKey === myKey);
            renderNowPlaying();
        });
        presenceChannel.subscribe(async status => {
            if (status === 'SUBSCRIBED') await presenceChannel.track({ online_at: Date.now() });
        });
        setInterval(leaderTick, LEADER_TICK_MS);
    }

    async function leaderTick() {
        if (!isLeader) return;
        if (!currentRow || !currentRow.video_id) {
            if (queueRows.length) advanceQueue();
            return;
        }
        const votes = (currentRow.skip_votes || []).length;
        const threshold = Math.max(SKIP_VOTE_MIN, Math.ceil(presenceCount * SKIP_VOTE_RATIO));
        if (votes >= threshold) advanceQueue();
    }

    // ── Boot ──────────────────────────────────────────────────────────────
    function boot() {
        injectStyles();
        injectView();
        hookSwitchTab();
        refreshIdentity().then(updateGatingUI);
        subscribeRealtime();
        setupPresence();
        maybeCreatePlayer();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', boot);
    } else {
        boot();
    }
})();
