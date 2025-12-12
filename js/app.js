document.addEventListener("DOMContentLoaded", () => {
    const mainContentContainer = document.querySelector('.page-transition');
    const themeToggleBtn = document.getElementById('theme-toggle-btn');
    
    /* --- 1. 主題切換 (Dark/Light Mode) --- */
    const initTheme = () => {
        const savedTheme = localStorage.getItem('theme');
        if (savedTheme) {
            document.documentElement.setAttribute('data-theme', savedTheme);
            updateThemeIcon(savedTheme);
        } else {
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
            icon.className = 'fa-solid fa-moon'; 
        } else {
            icon.className = 'fa-solid fa-sun'; 
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
        
        // 1. 開始淡出
        document.body.classList.add('fade-out');
        
        // 2. 等待淡出動畫完成 (400ms 配合 CSS transition 時間)
        setTimeout(() => {
            fetchPage(url);
        }, 400); 
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
            
            // 3. 替換內容
            mainContentContainer.innerHTML = newContent;
            document.title = newTitle;

            // URL 處理
            let displayUrl = url;
            if (displayUrl.endsWith('index.html')) {
                displayUrl = displayUrl.replace('/index.html', '/');
            } else {
                displayUrl = displayUrl.replace('.html', '');
            }
            window.history.pushState({ path: displayUrl, fetchUrl: url }, '', displayUrl);

            bindNavLinks();
            updateActiveLink();
            
            window.scrollTo(0, 0);

            // 4. 移除 fade-out class，觸發 CSS 的淡入 transition
            // 使用 requestAnimationFrame 確保瀏覽器已渲染新內容
            requestAnimationFrame(() => {
                document.body.classList.remove('fade-out');
            });

        } catch (error) {
            console.error('頁面加載失敗:', error);
            window.location.href = url; 
        }
    };

    const updateActiveLink = () => {
        let currentPath = window.location.pathname;
        if (currentPath.endsWith('/')) currentPath += 'index.html';
        if (!currentPath.endsWith('.html')) currentPath += '.html';

        document.querySelectorAll('.navbar nav a').forEach(link => {
            const linkPath = new URL(link.href).pathname;
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
        let targetUrl = window.location.href;
        if (event.state && event.state.fetchUrl) {
            targetUrl = event.state.fetchUrl;
        } else if (!targetUrl.endsWith('.html') && !targetUrl.endsWith('/')) {
            targetUrl += '.html';
        }

        document.body.classList.add('fade-out');
        setTimeout(() => {
            fetchPage(targetUrl);
        }, 400);
    });

    bindNavLinks();
    updateActiveLink();
});
