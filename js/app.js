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
        
        // 1. 淡出
        document.body.classList.add('fade-out');
        
        // 2. 等待動畫完成後 (400ms) 載入新內容
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
            
            mainContentContainer.innerHTML = newContent;
            document.title = newTitle;

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

            // 3. 移除 fade-out class 觸發淡入
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
            // 比對路徑來決定哪個連結亮起
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
