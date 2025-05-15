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
    // ==== カード情報初期化 ====
    // (省略 - 変更なし)
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

    // ===========================
    // ==== ダークモード機能 ====
    // (省略 - 変更なし)
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
    // ===========================


    // ===================================
    // ==== 表示更新 (フィルター＆ソート) ====
    // (省略 - 変更なし)
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
    // ===================================

    // ===========================
    // ==== ソートボタン機能 ====
    // (省略 - 変更なし)
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
    // ===========================

    // ==============================
    // ==== フィルターボタン機能 ====
    // (省略 - 変更なし)
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
    // ==============================

    // =========================
    // ==== 検索機能 ====
    // (省略 - 変更なし)
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
                // performSearch();
            }
        });
    } else {
        if (!searchButton) console.warn('#searchButton not found.');
        if (!searchInput) console.warn('#searchInput not found.');
    }
    // =========================

    // =========================
    // ==== リセット機能 ====
    // (省略 - 変更なし)
    if (resetFiltersButton) {
        resetFiltersButton.addEventListener('click', () => {
            currentFilterTag = 'all';
            currentSearchTerm = '';
            if (searchInput) searchInput.value = '';
            updateDisplay();
        });
    } else { console.warn('#resetFilters not found.'); }
    // =========================

    // ===========================
    // ==== 件数表示機能 ====
    // (省略 - 変更なし)
    const updateResultsCount = (count) => {
        if (resultsCount) {
            resultsCount.textContent = `${count}件 表示中`;
        }
    };
    // ===========================

    // ===========================
    // ==== 訪問回数カウンター機能 (セッションベース) ==== // ★★★ ここが変更されています ★★★
    // ===========================
    if (visitorCounterHeader) {
        // sessionStorageから訪問フラグを取得
        let hasVisitedThisSession = sessionStorage.getItem('visitedThisSession');

        let totalVisits = localStorage.getItem('totalPageVisits'); // 累計訪問回数はlocalStorageで管理
        totalVisits = totalVisits ? Number(totalVisits) : 0;

        if (!hasVisitedThisSession) {
            // このセッションで初めての訪問の場合
            sessionStorage.setItem('visitedThisSession', 'true'); // セッション訪問フラグを設定
            totalVisits += 1; // 累計訪問回数を1増やす
            localStorage.setItem('totalPageVisits', totalVisits); // 新しい累計訪問回数を保存
        }

        // HTMLに表示（累計の回数を表示）
        visitorCounterHeader.textContent = `あなたは ${totalVisits} 人目の訪問者です (セッションカウント)`;
        visitorCounterHeader.title = "ブラウザセッション毎のカウントです。累計訪問回数を表示しています。";

    } else {
        console.warn('#visitorCounterHeader not found. カウンターは表示されません。');
    }


    // ===========================
    // ==== 初期化実行 ====
    // (省略 - 変更なし)
    allCardData = initializeCardData();
    updateDisplay();
    // ===========================

}); // End of DOMContentLoaded
