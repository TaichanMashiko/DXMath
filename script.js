/**
 * 授業記録まとめページ用スクリプト
 * - ダークモード切り替え
 * - 日付によるカードソート
 * - タグ絞り込みフィルター
 * - キーワード検索フィルター
 * - 件数表示
 * - 訪問回数カウンター (セッションベース)
 */

document.addEventListener('DOMContentLoaded', () => {

    // ==== 要素取得 ====
    const body = document.body;
    const darkModeToggle = document.getElementById('darkModeToggle');
    const sortButton = document.getElementById('sortButton');
    const cardGrid = document.getElementById('cardGrid');
    const resultsCount = document.getElementById('resultsCount');
    const searchInput = document.getElementById('searchInput');
    const searchButton = document.getElementById('searchButton');
    const tagListContainer = document.getElementById('tagList');
    const resetFiltersButton = document.getElementById('resetFilters');
    const visitorCounterHeader = document.getElementById('visitorCounterHeader');

    // ==== 状態変数 ====
    let currentSortOrder = 'desc';
    let currentFilterTag = 'all';
    let currentSearchTerm = '';
    let allCardData = [];

    // ===========================
    //  カード情報初期化
    // ===========================
    const initializeCardData = () => {
        if (!cardGrid) return [];
        const cardElements = Array.from(cardGrid.querySelectorAll('.card'));
        return cardElements.map(card => {
            const tagsAttr = card.dataset.tags || '';
            return {
                element: card,
                title: card.querySelector('.card-title a')?.textContent.toLowerCase() || '',
                summary: card.querySelector('.card-summary')?.textContent.toLowerCase() || '',
                date: new Date(card.dataset.date || 0),
                dateString: card.dataset.date,
                tags: tagsAttr ? tagsAttr.split(',').map(t => t.trim().toLowerCase()) : []
            };
        });
    };

    // ===========================
    //  ダークモード機能
    // ===========================
    if (darkModeToggle) {
        const applyTheme = (theme) => {
            if (theme === 'dark') {
                body.classList.add('dark-mode');
                body.classList.remove('light-mode');
                darkModeToggle.innerHTML = '<i class="fa-solid fa-sun"></i>';
                localStorage.setItem('theme', 'dark');
            } else {
                body.classList.add('light-mode');
                body.classList.remove('dark-mode');
                darkModeToggle.innerHTML = '<i class="fa-solid fa-moon"></i>';
                localStorage.setItem('theme', 'light');
            }
        };
        const savedTheme = localStorage.getItem('theme');
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        if (savedTheme) applyTheme(savedTheme);
        else if (prefersDark) applyTheme('dark');
        else applyTheme('light');
        darkModeToggle.addEventListener('click', () => applyTheme(body.classList.contains('dark-mode') ? 'light' : 'dark'));
    } else { console.warn('#darkModeToggle not found.'); }


    // ===================================
    //  表示更新 (フィルター＆ソート)
    // ===================================
    const updateDisplay = () => {
        if (!cardGrid) return;
        const filteredByTag = allCardData.filter(card =>
            currentFilterTag === 'all' || card.tags.includes(currentFilterTag)
        );
        const filteredBySearch = filteredByTag.filter(card => {
            const term = currentSearchTerm;
            return card.title.includes(term) ||
                   card.summary.includes(term) ||
                   card.tags.some(tag => tag.includes(term)) ||
                   card.dateString.includes(term);
        });
        filteredBySearch.sort((a, b) => {
            const dateA = a.date;
            const dateB = b.date;
            if (isNaN(dateA.getTime()) && isNaN(dateB.getTime())) return 0;
            if (isNaN(dateA.getTime())) return 1;
            if (isNaN(dateB.getTime())) return -1;
            if (currentSortOrder === 'desc') {
                return dateB - dateA;
            } else {
                return dateA - dateB;
            }
        });
        const fragment = document.createDocumentFragment();
        if (filteredBySearch.length > 0) {
            filteredBySearch.forEach((cardData) => {
                fragment.appendChild(cardData.element);
            });
        } else {
            const noResultMessage = document.createElement('p');
            noResultMessage.textContent = '該当する授業記録が見つかりませんでした。';
            noResultMessage.className = 'no-results-message';
            fragment.appendChild(noResultMessage);
        }
        cardGrid.innerHTML = '';
        cardGrid.appendChild(fragment);
        updateResultsCount(filteredBySearch.length);
        updateSortButtonView();
        updateActiveTagView();
    };

    // ===========================
    //  ソートボタン機能
    // ===========================
    const updateSortButtonView = () => {
        if (!sortButton) return;
        if (currentSortOrder === 'desc') {
            sortButton.innerHTML = '<i class="fa-solid fa-arrow-down-wide-short"></i> 日付 新しい順';
            sortButton.dataset.sortOrder = 'desc';
        } else {
            sortButton.innerHTML = '<i class="fa-solid fa-arrow-up-short-wide"></i> 日付 古い順';
            sortButton.dataset.sortOrder = 'asc';
        }
    };
    if (sortButton) {
        currentSortOrder = sortButton.dataset.sortOrder || 'desc';
        sortButton.addEventListener('click', () => {
            currentSortOrder = (currentSortOrder === 'desc') ? 'asc' : 'desc';
            updateDisplay();
        });
    } else { console.warn('#sortButton not found.'); }

    // ==============================
    //  フィルターボタン機能
    // ==============================
    const updateActiveTagView = () => {
        if (!tagListContainer) return;
        tagListContainer.querySelectorAll('.tag-filter').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.tag === currentFilterTag);
        });
         const allButton = tagListContainer.querySelector('.tag-filter[data-tag="all"]');
         if (allButton) {
            allButton.classList.toggle('active', currentFilterTag === 'all');
         }
    };
    if (tagListContainer) {
        tagListContainer.addEventListener('click', (event) => {
            const target = event.target.closest('.tag-filter');
            if (target && target.classList.contains('tag-filter') && !target.classList.contains('reset-filter')) {
                currentFilterTag = target.dataset.tag;
                updateDisplay();
            }
        });
    } else { console.warn('#tagList not found.'); }
    if (cardGrid) {
        cardGrid.addEventListener('click', (event) => {
            if (event.target.classList.contains('tag')) {
                const clickedTag = event.target.dataset.tag;
                const filterButton = tagListContainer?.querySelector(`.tag-filter[data-tag="${clickedTag}"]`);
                if (filterButton) {
                    filterButton.click();
                } else {
                    currentFilterTag = clickedTag;
                    updateDisplay();
                }
            }
        });
    }

    // =========================
    //  検索機能
    // =========================
    const performSearch = () => {
        if (!searchInput) return;
        currentSearchTerm = searchInput.value.trim().toLowerCase();
        updateDisplay();
    };
    if (searchButton && searchInput) {
        searchButton.addEventListener('click', performSearch);
        searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                performSearch();
            }
        });
        searchInput.addEventListener('input', () => {
            if (searchInput.value.trim() === '' && currentSearchTerm !== '') {
                // 意図的に何もしない
            }
        });
    } else {
        if (!searchButton) console.warn('#searchButton not found.');
        if (!searchInput) console.warn('#searchInput not found.');
    }

    // =========================
    //  リセット機能
    // =========================
    if (resetFiltersButton) {
        resetFiltersButton.addEventListener('click', () => {
            currentFilterTag = 'all';
            currentSearchTerm = '';
            if (searchInput) searchInput.value = '';
            updateDisplay();
        });
    } else { console.warn('#resetFilters not found.'); }

    // ===========================
    //  件数表示機能
    // ===========================
    const updateResultsCount = (count) => {
        if (resultsCount) {
            resultsCount.textContent = `${count}件 表示中`;
        }
    };

    // ===========================
    //  訪問回数カウンター機能 (セッションベース) - デバッグログ付き
    // ===========================
    if (visitorCounterHeader) {
        console.log("カウンター処理開始");

        let hasVisitedThisSession = sessionStorage.getItem('visitedThisSession');
        console.log("hasVisitedThisSession:", hasVisitedThisSession);

        let storedVisits = localStorage.getItem('totalSessionPageVisits');
        console.log("storedVisits (from localStorage):", storedVisits);
        let totalSessionVisits = Number(storedVisits) || 0;
        console.log("totalSessionVisits (初期値):", totalSessionVisits);

        if (!hasVisitedThisSession) {
            console.log("このセッションは初めての訪問です。");
            totalSessionVisits += 1;
            console.log("totalSessionVisits (加算後):", totalSessionVisits);
            try {
                localStorage.setItem('totalSessionPageVisits', totalSessionVisits);
                console.log("localStorageに totalSessionPageVisits を保存しました:", totalSessionVisits);
            } catch (e) {
                console.error("localStorageへの保存に失敗しました:", e);
            }
            try {
                sessionStorage.setItem('visitedThisSession', 'true');
                console.log("sessionStorageに visitedThisSession を保存しました: true");
            } catch (e) {
                console.error("sessionStorageへの保存に失敗しました:", e);
            }
        } else {
            console.log("このセッションでは既に訪問済みです。");
        }

        visitorCounterHeader.innerHTML = `<span class="counter-number">${totalSessionVisits}</span><span class="counter-text"> 回目のアクセスです！</span>`;
        console.log("カウンター表示を更新しました:", visitorCounterHeader.innerHTML);

        visitorCounterHeader.title = "このブラウザでのセッションごとの累計アクセス回数です。";

    } else {
        console.warn('#visitorCounterHeader not found. カウンターは表示されません。');
    }


    // ===========================
    //  初期化実行
    // ===========================
    allCardData = initializeCardData();
    updateDisplay();

}); 
