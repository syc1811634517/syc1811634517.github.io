document.addEventListener("DOMContentLoaded", () => {
    const mainContentContainer = document.querySelector('.page-transition');

    // 處理點擊事件的函數
    const handleLinkClick = (event) => {
        const link = event.currentTarget;
        const url = link.href;

        // 如果是外部連結、履歷PDF或錨點連結，則正常處理
        if (link.target === '_blank' || link.protocol !== window.location.protocol || url.includes('#')) {
            return;
        }

        // 如果點擊的是當前頁面，則不處理
        if (url === window.location.href) {
            event.preventDefault();
            return;
        }

        event.preventDefault(); // 阻止默認跳轉行為
        
        // 播放淡出動畫
        document.body.classList.add('fade-out');
        
        // 在動畫結束後加載新頁面
        setTimeout(() => {
            fetchPage(url);
        }, 400); // 匹配 CSS transition 時間
    };

    // 透過 fetch 加載並替換頁面內容的函數
    const fetchPage = async (url) => {
        try {
            const response = await fetch(url);
            if (!response.ok) { throw new Error('Network response was not ok.'); }
            const text = await response.text();
            
            const parser = new DOMParser();
            const doc = parser.parseFromString(text, 'text/html');
            
            const newContent = doc.querySelector('.page-transition').innerHTML;
            const newTitle = doc.querySelector('title').innerText;
            
            // 替換內容和標題
            mainContentContainer.innerHTML = newContent;
            document.title = newTitle;

            // 更新網址列
            window.history.pushState({ path: url }, '', url);

            // 重新綁定事件
            bindNavLinks();
            updateActiveLink();
            
            // 移除 fade-out class，讓新內容淡入
            document.body.classList.remove('fade-out');
            window.scrollTo(0, 0); // 切換頁面後滾動到頂部

        } catch (error) {
            console.error('頁面加載失敗:', error);
            window.location.href = url; // 如果 fetch 失敗，則 fallback 到傳統跳轉
        }
    };

    // 更新導覽列 active 狀態
    const updateActiveLink = () => {
        const currentPath = window.location.pathname.replace(/\/$/, ""); // 移除結尾的 /
        document.querySelectorAll('.navbar nav a').forEach(link => {
            const linkPath = new URL(link.href).pathname.replace(/\/$/, "");
             // 如果是專案詳細頁，也讓"專案"標籤保持 active
            if (linkPath === currentPath || (currentPath.startsWith('/projects/') && linkPath.endsWith('/projects.html'))) {
                link.classList.add('active');
            } else {
                link.classList.remove('active');
            }
        });
    };

    // 綁定所有內部連結的點擊事件
    const bindNavLinks = () => {
        document.querySelectorAll('a').forEach(link => {
            // 只為內部連結綁定
             if (link.hostname === window.location.hostname && !link.href.includes('#') && link.target !== '_blank') {
                link.removeEventListener('click', handleLinkClick); // 先移除舊的監聽器避免重複
                link.addEventListener('click', handleLinkClick);
            }
        });
    }

    // 讓瀏覽器的「上一頁/下一頁」也能觸發轉場
    window.addEventListener('popstate', (event) => {
        document.body.classList.add('fade-out');
        setTimeout(() => {
            fetchPage(window.location.href);
        }, 400);
    });

    // 首次加載時執行
    bindNavLinks();
    updateActiveLink();
});