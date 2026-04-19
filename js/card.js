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
    const badgeToggle    = document.getElementById('badgeToggle');
    const badgeToggleThumb = document.getElementById('badgeToggleThumb');
    const badgeLabel     = document.getElementById('badgeLabel');
    const suffixToggle   = document.getElementById('suffixToggle');
    const suffixToggleThumb = document.getElementById('suffixToggleThumb');
    const suffixLabel    = document.getElementById('suffixLabel');

    let cardTheme = 'dark';
    let showBadge = localStorage.getItem('showBadge') !== 'false';
    let showSuffix = localStorage.getItem('showSuffix') !== 'false';
    let mode = 'track'; // 'track' | 'album'
    let albumCollectionId = null;
    let albumCountry = 'us';
    let albumOriginalURL = null;

    // ── Tab switching ────────────────────────────────────────────────────────
    const tabTrack   = document.getElementById('tabTrack');
    const tabAlbum   = document.getElementById('tabAlbum');
    const trackSection = document.getElementById('trackSection');
    const albumSection = document.getElementById('albumSection');

    const tabActiveClasses   = ['bg-white', 'dark:bg-gray-700', 'text-gray-800', 'dark:text-gray-100', 'shadow-sm'];
    const tabInactiveClasses = ['text-gray-500', 'dark:text-gray-400', 'hover:text-gray-700', 'dark:hover:text-gray-200'];

    function switchTab(newMode) {
        mode = newMode;
        const isTrack = mode === 'track';

        tabTrack.classList.toggle('bg-white', isTrack);
        tabTrack.classList.toggle('dark:bg-gray-700', isTrack);
        tabTrack.classList.toggle('text-gray-800', isTrack);
        tabTrack.classList.toggle('dark:text-gray-100', isTrack);
        tabTrack.classList.toggle('shadow-sm', isTrack);
        tabTrack.classList.toggle('text-gray-500', !isTrack);
        tabTrack.classList.toggle('dark:text-gray-400', !isTrack);

        tabAlbum.classList.toggle('bg-white', !isTrack);
        tabAlbum.classList.toggle('dark:bg-gray-700', !isTrack);
        tabAlbum.classList.toggle('text-gray-800', !isTrack);
        tabAlbum.classList.toggle('dark:text-gray-100', !isTrack);
        tabAlbum.classList.toggle('shadow-sm', !isTrack);
        tabAlbum.classList.toggle('text-gray-500', isTrack);
        tabAlbum.classList.toggle('dark:text-gray-400', isTrack);

        trackSection.classList.toggle('hidden', !isTrack);
        albumSection.classList.toggle('hidden', isTrack);

        // Reset preview when switching tabs
        previewArea.classList.add('hidden');
        emptyState.classList.remove('hidden');
        markdownSection.classList.add('hidden');

        if (!isTrack) updateAlbumPreview();
        else updatePreview();
    }

    tabTrack.addEventListener('click', () => switchTab('track'));
    tabAlbum.addEventListener('click', () => switchTab('album'));

    // ── Album mode ───────────────────────────────────────────────────────────
    const albumMusicURLInput  = document.getElementById('albumMusicURL');
    const albumLookupStatus   = document.getElementById('albumLookupStatus');

    function setAlbumStatus(msg, color) {
        albumLookupStatus.textContent = msg;
        albumLookupStatus.className = `text-xs ${color}`;
        albumLookupStatus.classList.remove('hidden');
    }

    function parseAlbumURL(urlStr) {
        let u;
        try { u = new URL(urlStr); } catch { return null; }
        if (u.hostname !== 'music.apple.com') return null;
        if (u.searchParams.get('i')) return null;
        const parts = u.pathname.split('/').filter(Boolean);
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
        const id = parts[albumIndex + 2];
        if (!id || !/^\d+$/.test(id)) return null;
        return { country, id };
    }

    function albumAPIParams(theme) {
        return `id=${albumCollectionId}&theme=${theme}&badge=${showBadge ? '1' : '0'}&country=${albumCountry}&suffix=${showSuffix ? '1' : '0'}`;
    }

    function updateAlbumPreview() {
        if (!albumCollectionId) {
            previewArea.classList.add('hidden');
            emptyState.classList.remove('hidden');
            markdownSection.classList.add('hidden');
            return;
        }

        previewArea.classList.remove('hidden');
        emptyState.classList.add('hidden');
        markdownSection.classList.remove('hidden');

        previewDark.src  = `/api/album?${albumAPIParams('dark')}`;
        previewLight.src = `/api/album?${albumAPIParams('light')}`;

        updateAlbumMarkdown();
    }

    function updateAlbumMarkdown() {
        if (!albumCollectionId) return;
        const cardURL = `${window.location.origin}/api/album?${albumAPIParams(cardTheme)}`;
        markdownOutput.textContent = albumOriginalURL
            ? `[![Album](${cardURL})](${albumOriginalURL})`
            : `![Album](${cardURL})`;
    }

    albumMusicURLInput.addEventListener('input', debounce(e => {
        const val = e.target.value.trim();
        if (!val) {
            albumLookupStatus.classList.add('hidden');
            albumCollectionId = null;
            albumCountry = 'us';
            albumOriginalURL = null;
            updateAlbumPreview();
            return;
        }
        const parsed = parseAlbumURL(val);
        if (!parsed) {
            setAlbumStatus('アルバムURLが認識できません。例: https://music.apple.com/jp/album/alxd/1440785663', 'text-amber-500 dark:text-amber-400');
            albumCollectionId = null;
            albumCountry = 'us';
            albumOriginalURL = null;
            updateAlbumPreview();
            return;
        }
        albumCollectionId = parsed.id;
        albumCountry = parsed.country;
        albumOriginalURL = val;
        setAlbumStatus(`ID: ${parsed.id} を検出しました`, 'text-green-600 dark:text-green-400');
        updateAlbumPreview();
    }, 500));

    // ── Track mode ───────────────────────────────────────────────────────────
    function buildParams(theme) {
        return new URLSearchParams({
            title:   document.getElementById('title').value,
            artist:  document.getElementById('artist').value,
            album:   document.getElementById('album').value,
            artwork: document.getElementById('artwork').value,
            year:    document.getElementById('year').value,
            dur:     document.getElementById('dur').value,
            theme,
            badge:   showBadge ? '1' : '0',
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

    // Badge toggle
    function applyBadgeToggleUI() {
        badgeToggle.setAttribute('aria-checked', String(showBadge));
        badgeToggleThumb.style.transform = showBadge ? 'translateX(1.25rem)' : 'translateX(0.25rem)';
        badgeToggle.style.backgroundColor = showBadge ? '#f43f5e' : '#4b5563';
        badgeLabel.textContent = showBadge ? '表示' : '非表示';
    }

    badgeToggle.addEventListener('click', () => {
        showBadge = !showBadge;
        localStorage.setItem('showBadge', String(showBadge));
        applyBadgeToggleUI();
        if (mode === 'album') updateAlbumPreview();
        else updatePreview();
    });

    applyBadgeToggleUI();

    // Suffix toggle (album only)
    function applySuffixToggleUI() {
        suffixToggle.setAttribute('aria-checked', String(showSuffix));
        suffixToggleThumb.style.transform = showSuffix ? 'translateX(1.25rem)' : 'translateX(0.25rem)';
        suffixToggle.style.backgroundColor = showSuffix ? '#f43f5e' : '#4b5563';
        suffixLabel.textContent = showSuffix ? '表示' : '非表示';
    }

    suffixToggle.addEventListener('click', () => {
        showSuffix = !showSuffix;
        localStorage.setItem('showSuffix', String(showSuffix));
        applySuffixToggleUI();
        updateAlbumPreview();
    });

    applySuffixToggleUI();

    // Card theme toggle — initialize
    toggleThumb.style.transform = 'translateX(1.25rem)';
    cardThemeToggle.style.backgroundColor = '#f43f5e';
    cardThemeToggle.setAttribute('aria-checked', 'true');

    cardThemeToggle.addEventListener('click', () => {
        cardTheme = cardTheme === 'dark' ? 'light' : 'dark';
        const isDark = cardTheme === 'dark';

        cardThemeToggle.setAttribute('aria-checked', String(isDark));
        toggleThumb.style.transform = isDark ? 'translateX(1.25rem)' : 'translateX(0.25rem)';
        cardThemeToggle.style.backgroundColor = isDark ? '#f43f5e' : '#4b5563';
        themeLabel.textContent = isDark ? 'Dark' : 'Light';

        if (mode === 'album') updateAlbumMarkdown();
        else updateMarkdown();
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
