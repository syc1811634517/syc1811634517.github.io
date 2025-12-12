document.addEventListener("DOMContentLoaded", () => {
    const mainContentContainer = document.querySelector('.page-transition');
    const themeToggleBtn = document.getElementById('theme-toggle-btn');
    
    /* --- 1. 主題切換 (Dark/Light Mode) --- */
    // 初始化：檢查 localStorage 或系統偏好
    const initTheme = () => {
        const savedTheme = localStorage.getItem('theme');
        const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        
        if (savedTheme) {
            document.documentElement.setAttribute('data-theme', savedTheme);
            updateThemeIcon(savedTheme);
        } else {
            // 預設為 Dark，如果想預設 Light，可以改這裡
            const defaultTheme = 'dark'; 
            document.documentElement.setAttribute('data-theme', defaultTheme);
            updateThemeIcon(defaultTheme);
        }
    };

    const toggleTheme = () => {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        const newTheme = currentTheme === 'light' ? 'dark' : 'light';
        
        document.documentElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);
        updateThemeIcon(newTheme);
    };

    const updateThemeIcon = (theme) => {
        const icon = themeToggleBtn.querySelector('i');
        if (theme === 'light') {
            icon.className = 'fa-solid fa-moon'; // 亮色模式下顯示月亮 (切換到深色)
        } else {
            icon.className = 'fa-solid fa-sun'; // 深色模式下顯示太陽 (切換到亮色)
        }
    };

    if (themeToggleBtn) {
        themeToggleBtn.addEventListener('click', toggleTheme);
    }
    initTheme();

    /* --- 2. 頁面轉場與網址優化 --- */
    const handleLinkClick = (event) => {
        const link = event.currentTarget;
        const url = link.href;

        if (link.target === '_blank' || link.protocol !== window.location.protocol || url.includes('#')) {
            return;
        }

        if (url === window.location.href) {
            event.preventDefault();
            return;
        }

        event.preventDefault();
        
        document.body.classList.add('fade-out');
        
        setTimeout(() => {
            fetchPage(url);
        }, 300); // 配合 CSS 動畫時間
    };

    const fetchPage = async (url) => {
        try {
            const response = await fetch(url);
            if (!response.ok) throw new Error('Network response was not ok.');
            const text = await response.text();
            
            const parser = new DOMParser();
            const doc = parser.parseFromString(text, 'text/html');
            
            const newContent = doc.querySelector('.page-transition').innerHTML;
            const newTitle = doc.querySelector('title').innerText;
            
            mainContentContainer.innerHTML = newContent;
            document.title = newTitle;

            // --- 網址美化關鍵 ---
            // 移除 .html，如果是 index 也移除
            let displayUrl = url;
            if (displayUrl.endsWith('index.html')) {
                displayUrl = displayUrl.replace('/index.html', '/');
            } else {
                displayUrl = displayUrl.replace('.html', '');
            }
            
            window.history.pushState({ path: displayUrl, fetchUrl: url }, '', displayUrl);

            // 重新綁定事件 (因為 DOM 換了)
            bindNavLinks();
            updateActiveLink();
            
            document.body.classList.remove('fade-out');
            window.scrollTo(0, 0);

        } catch (error) {
            console.error('頁面加載失敗:', error);
            window.location.href = url; 
        }
    };

    const updateActiveLink = () => {
        // 取得當前真實路徑，並處理 .html 結尾的情況以進行比對
        let currentPath = window.location.pathname;
        if (currentPath.endsWith('/')) currentPath += 'index.html';
        if (!currentPath.endsWith('.html')) currentPath += '.html';

        document.querySelectorAll('.navbar nav a').forEach(link => {
            const linkPath = new URL(link.href).pathname;
            
            // 簡單的路徑比對
            if (linkPath === currentPath || (currentPath.includes('/projects/') && linkPath.includes('projects.html'))) {
                link.classList.add('active');
            } else {
                link.classList.remove('active');
            }
        });
    };

    const bindNavLinks = () => {
        document.querySelectorAll('a').forEach(link => {
            if (link.hostname === window.location.hostname && !link.href.includes('#') && link.target !== '_blank') {
                link.removeEventListener('click', handleLinkClick);
                link.addEventListener('click', handleLinkClick);
            }
        });
    }

    window.addEventListener('popstate', (event) => {
        // 如果按上一頁，我們需要知道原本的 HTML 檔案在哪
        // 這裡做一個簡單的 fallback：如果 state 裡沒有 fetchUrl，就嘗試把當前網址加 .html
        let targetUrl = window.location.href;
        if (event.state && event.state.fetchUrl) {
            targetUrl = event.state.fetchUrl;
        } else if (!targetUrl.endsWith('.html') && !targetUrl.endsWith('/')) {
            targetUrl += '.html';
        }

        document.body.classList.add('fade-out');
        setTimeout(() => {
            fetchPage(targetUrl);
        }, 300);
    });

    bindNavLinks();
    updateActiveLink();
});
