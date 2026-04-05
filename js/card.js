// 2026 Apple Music Card Generator: darui3018823 All rights reserved.
// All works created by darui3018823 associated with this repository are the intellectual property of darui3018823.
// Packages and other third-party materials used in this repository are subject to their respective licenses and copyrights.

document.addEventListener('DOMContentLoaded', () => {
    const previewDark    = document.getElementById('previewDark');
    const previewLight   = document.getElementById('previewLight');
    const previewArea    = document.getElementById('previewArea');
    const emptyState     = document.getElementById('emptyState');
    const markdownSection = document.getElementById('markdownSection');
    const markdownOutput = document.getElementById('markdownOutput');
    const copyBtn        = document.getElementById('copyBtn');
    const cardThemeToggle = document.getElementById('cardThemeToggle');
    const toggleThumb    = document.getElementById('toggleThumb');
    const themeLabel     = document.getElementById('themeLabel');
    const pageDarkToggle = document.getElementById('pageDarkToggle');

    let cardTheme = 'dark';

    function buildParams(theme) {
        return new URLSearchParams({
            title:   document.getElementById('title').value,
            artist:  document.getElementById('artist').value,
            album:   document.getElementById('album').value,
            artwork: document.getElementById('artwork').value,
            year:    document.getElementById('year').value,
            dur:     document.getElementById('dur').value,
            theme,
        }).toString();
    }

    function formatDuration(ms) {
        const totalSec = Math.floor(ms / 1000);
        const hours = Math.floor(totalSec / 3600);
        const mins  = Math.floor((totalSec % 3600) / 60);
        const secs  = totalSec % 60;
        const ss = String(secs).padStart(2, '0');
        return hours > 0
            ? `${hours}:${String(mins).padStart(2, '0')}:${ss}`
            : `${mins}:${ss}`;
    }

    function isReady() {
        return ['title', 'artist', 'album', 'artwork'].every(
            id => document.getElementById(id).value.trim() !== ''
        );
    }

    function updatePreview() {
        if (!isReady()) {
            previewArea.classList.add('hidden');
            emptyState.classList.remove('hidden');
            markdownSection.classList.add('hidden');
            return;
        }

        previewArea.classList.remove('hidden');
        emptyState.classList.add('hidden');
        markdownSection.classList.remove('hidden');

        previewDark.src  = `/api/card?${buildParams('dark')}`;
        previewLight.src = `/api/card?${buildParams('light')}`;

        updateMarkdown();
    }

    function updateMarkdown() {
        if (!isReady()) return;

        const title   = document.getElementById('title').value;
        const link    = document.getElementById('link').value.trim();
        const cardURL = `${window.location.origin}/api/card?${buildParams(cardTheme)}`;

        markdownOutput.textContent = link
            ? `[![${title}](${cardURL})](${link})`
            : `![${title}](${cardURL})`;
    }

    function debounce(fn, ms) {
        let t;
        return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), ms); };
    }

    const debouncedUpdate = debounce(updatePreview, 400);

    ['title', 'artist', 'album', 'artwork', 'year', 'dur'].forEach(id => {
        document.getElementById(id).addEventListener('input', debouncedUpdate);
    });
    document.getElementById('link').addEventListener('input', updateMarkdown);

    // iTunes API auto-fill
    const appleMusicURLInput = document.getElementById('appleMusicURL');
    const lookupStatus       = document.getElementById('lookupStatus');

    function setStatus(msg, color) {
        lookupStatus.textContent = msg;
        lookupStatus.className = `text-xs ${color}`;
        lookupStatus.classList.remove('hidden');
    }

    function parseAppleMusicURL(urlStr) {
        let u;
        try { u = new URL(urlStr); } catch { return null; }
        if (u.hostname !== 'music.apple.com') return null;

        const parts = u.pathname.split('/').filter(Boolean);
        // /jp/album/slug/collectionId  → parts[0]=country, parts[1]='album'
        // /album/slug/collectionId     → parts[0]='album' (no country, default 'us')
        let country, albumIndex;
        if (parts[0] === 'album') {
            country = 'us';
            albumIndex = 0;
        } else if (parts[1] === 'album') {
            country = parts[0];
            albumIndex = 1;
        } else {
            return null;
        }

        if (parts.length < albumIndex + 3) return null;

        const trackId = u.searchParams.get('i');
        if (!trackId) return { type: 'album', country };
        return { type: 'track', country, trackId, originalURL: urlStr };
    }

    async function lookupAndFill(urlStr) {
        const parsed = parseAppleMusicURL(urlStr);
        if (!parsed) return;

        if (parsed.type === 'album') {
            setStatus('アルバムURLには対応していません。楽曲URL（?i= を含むURL）を使用してください。', 'text-amber-500 dark:text-amber-400');
            return;
        }

        setStatus('検索中...', 'text-gray-400 dark:text-gray-500');

        try {
            const resp = await fetch(
                `/api/lookup?id=${parsed.trackId}&country=${parsed.country}`
            );
            const data = await resp.json();

            if (!data.results || data.results.length === 0 || data.results[0].kind !== 'song') {
                setStatus('楽曲が見つかりませんでした。', 'text-red-500 dark:text-red-400');
                return;
            }

            const track = data.results[0];
            document.getElementById('title').value   = track.trackName;
            document.getElementById('artist').value  = track.artistName;
            document.getElementById('album').value   = track.collectionName;
            document.getElementById('artwork').value = track.artworkUrl100.replace('/100x100bb.jpg', '/600x600bb.jpg');
            document.getElementById('link').value    = parsed.originalURL;
            document.getElementById('year').value    = track.releaseDate ? track.releaseDate.substring(0, 4) : '';
            document.getElementById('dur').value     = track.trackTimeMillis ? formatDuration(track.trackTimeMillis) : '';

            setStatus(`入力しました: ${track.trackName}`, 'text-green-600 dark:text-green-400');
            updatePreview();
        } catch {
            setStatus('取得に失敗しました。', 'text-red-500 dark:text-red-400');
        }
    }

    appleMusicURLInput.addEventListener('input', debounce(e => {
        const val = e.target.value.trim();
        if (!val) {
            lookupStatus.classList.add('hidden');
            return;
        }
        lookupAndFill(val);
    }, 500));

    // Card theme toggle
    cardThemeToggle.addEventListener('click', () => {
        cardTheme = cardTheme === 'dark' ? 'light' : 'dark';
        const isLight = cardTheme === 'light';

        cardThemeToggle.setAttribute('aria-checked', String(isLight));
        toggleThumb.style.transform = isLight ? 'translateX(1.25rem)' : 'translateX(0.125rem)';
        cardThemeToggle.style.backgroundColor = isLight ? '#fb7185' : '#4b5563';
        themeLabel.textContent = isLight ? 'Light' : 'Dark';

        updateMarkdown();
    });

    // Copy button
    copyBtn.addEventListener('click', () => {
        const text = markdownOutput.textContent;
        if (!text) return;

        navigator.clipboard.writeText(text).then(() => {
            const orig = copyBtn.textContent;
            copyBtn.textContent = 'Copied!';
            setTimeout(() => { copyBtn.textContent = orig; }, 2000);
        });
    });

    // Page dark/light toggle
    function updatePageIcons() {
        const isDark = document.documentElement.classList.contains('dark');
        document.getElementById('sunIcon').classList.toggle('hidden', !isDark);
        document.getElementById('moonIcon').classList.toggle('hidden', isDark);
    }

    pageDarkToggle.addEventListener('click', () => {
        const isDark = document.documentElement.classList.toggle('dark');
        localStorage.setItem('pageTheme', isDark ? 'dark' : 'light');
        updatePageIcons();
    });

    // Initialize page theme from localStorage
    const saved = localStorage.getItem('pageTheme');
    if (saved === 'light') {
        document.documentElement.classList.remove('dark');
    } else {
        document.documentElement.classList.add('dark');
    }
    updatePageIcons();
});
