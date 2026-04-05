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
            theme,
        }).toString();
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

    ['title', 'artist', 'album', 'artwork'].forEach(id => {
        document.getElementById(id).addEventListener('input', debouncedUpdate);
    });
    document.getElementById('link').addEventListener('input', updateMarkdown);

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
