/**
 * 授業記録まとめページ用スクリプト
 * - ダークモード切り替え
 * - 日付によるカードソート
 * - タグ絞り込みフィルター
 * - キーワード検索フィルター
 * - 件数表示
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

    // ==== 状態変数 ====
    let currentSortOrder = 'desc'; // 初期ソート順
    let currentFilterTag = 'all'; // 初期タグフィルター
    let currentSearchTerm = '';   // 初期検索キーワード
    let allCardData = [];         // 全カード情報を保持する配列

    // ===========================
    // ==== カード情報初期化 ====
    // ===========================
    const initializeCardData = () => {
        if (!cardGrid) return [];
        const cardElements = Array.from(cardGrid.querySelectorAll('.card'));
        return cardElements.map(card => {
            const tagsAttr = card.dataset.tags || '';
            return {
                element: card, // DOM要素への参照
                title: card.querySelector('.card-title a')?.textContent.toLowerCase() || '',
                summary: card.querySelector('.card-summary')?.textContent.toLowerCase() || '',
                date: new Date(card.dataset.date || 0),
                dateString: card.dataset.date,
                tags: tagsAttr ? tagsAttr.split(',').map(t => t.trim().toLowerCase()) : []
            };
        });
    };

    // ===========================
    // ==== ダークモード機能 ====
    // ===========================
    if (darkModeToggle) {
        const applyTheme = (theme) => { /* 省略: 前回のコードと同じ */ };
        const savedTheme = localStorage.getItem('theme');
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        if (savedTheme) applyTheme(savedTheme);
        else if (prefersDark) applyTheme('dark');
        else applyTheme('light');
        darkModeToggle.addEventListener('click', () => applyTheme(body.classList.contains('dark-mode') ? 'light' : 'dark'));
    } else { console.warn('#darkModeToggle not found.'); }


    // ===================================
    // ==== 表示更新 (フィルター＆ソート) ====
    // ===================================
    const updateDisplay = () => {
        if (!cardGrid) return;

        // 1. フィルター (タグ -> 検索)
        const filteredByTag = allCardData.filter(card =>
            currentFilterTag === 'all' || card.tags.includes(currentFilterTag)
        );

        const filteredBySearch = filteredByTag.filter(card => {
            const term = currentSearchTerm; // すでに小文字化されている想定
            return card.title.includes(term) ||
                   card.summary.includes(term) ||
                   card.tags.some(tag => tag.includes(term)) || // タグ自体も検索対象に
                   card.dateString.includes(term); // 日付文字列も検索対象に
        });

        // 2. ソート
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

        // 3. DOM更新
        const fragment = document.createDocumentFragment();
        if (filteredBySearch.length > 0) {
            filteredBySearch.forEach((cardData, index) => {
                // アニメーションのための準備（必要なら）
                // cardData.element.style.animationDelay = `${index * 0.05}s`;
                // cardData.element.style.opacity = '0';
                fragment.appendChild(cardData.element);
                 // setTimeout(() => { cardData.element.style.opacity = '1'; }, 10);
            });
        } else {
            const noResultMessage = document.createElement('p');
            noResultMessage.textContent = '該当する授業記録が見つかりませんでした。';
            fragment.appendChild(noResultMessage);
        }
        // cardGridの中身を入れ替え
        cardGrid.innerHTML = ''; // 中身をクリア
        cardGrid.appendChild(fragment);

        // 4. 件数更新
        updateResultsCount(filteredBySearch.length);

        // 5. ソートボタン表示更新 (ソート状態が変わる可能性があるため)
        updateSortButtonView();

        // 6. アクティブタグ表示更新
        updateActiveTagView();
    };

    // ===========================
    // ==== ソートボタン機能 ====
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
        // 初期ソート順読み込み
        currentSortOrder = sortButton.dataset.sortOrder || 'desc';

        sortButton.addEventListener('click', () => {
            currentSortOrder = (currentSortOrder === 'desc') ? 'asc' : 'desc';
            updateDisplay(); // フィルターとソートを含めて表示更新
        });
    } else { console.warn('#sortButton not found.'); }

    // ==============================
    // ==== フィルターボタン機能 ====
    // ==============================
    const updateActiveTagView = () => {
        if (!tagListContainer) return;
        tagListContainer.querySelectorAll('.tag-filter').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.tag === currentFilterTag);
        });
         // 「すべて表示」ボタンのアクティブ状態も制御
         const allButton = tagListContainer.querySelector('.tag-filter[data-tag="all"]');
         if (allButton) {
            allButton.classList.toggle('active', currentFilterTag === 'all');
         }
    };

    if (tagListContainer) {
        tagListContainer.addEventListener('click', (event) => {
            const target = event.target;
            // クリックされたのがタグフィルターボタン（リセット以外）か確認
            if (target.classList.contains('tag-filter') && !target.classList.contains('reset-filter')) {
                currentFilterTag = target.dataset.tag;
                // 検索ワードもリセットする（必要に応じて）
                // currentSearchTerm = '';
                // searchInput.value = '';
                updateDisplay(); // 表示更新
            }
        });
    } else { console.warn('#tagList not found.'); }

    // --- カード内のタグクリック ---
    if (cardGrid) {
        cardGrid.addEventListener('click', (event) => {
            if (event.target.classList.contains('tag')) {
                const clickedTag = event.target.dataset.tag;
                const filterButton = tagListContainer?.querySelector(`.tag-filter[data-tag="${clickedTag}"]`);
                if (filterButton) {
                    filterButton.click(); // 対応するフィルターボタンをクリックしたことにする
                } else {
                    // フィルターボタンがない場合（動的生成していない場合など）
                    currentFilterTag = clickedTag;
                    updateDisplay();
                }
            }
        });
    }

    // =========================
    // ==== 検索機能 ====
    // =========================
    const performSearch = () => {
        currentSearchTerm = searchInput.value.trim().toLowerCase();
        // 検索実行時にタグフィルターをリセットするかどうかは仕様による
        // currentFilterTag = 'all';
        updateDisplay(); // 表示更新
    };

    if (searchButton && searchInput) {
        searchButton.addEventListener('click', performSearch);
        searchInput.addEventListener('keypress', (e) => {
            // Enterキーでも検索実行
            if (e.key === 'Enter') {
                performSearch();
            }
        });
    } else {
        if (!searchButton) console.warn('#searchButton not found.');
        if (!searchInput) console.warn('#searchInput not found.');
    }

    // =========================
    // ==== リセット機能 ====
    // =========================
    if (resetFiltersButton) {
        resetFiltersButton.addEventListener('click', () => {
            currentFilterTag = 'all';
            currentSearchTerm = '';
            searchInput.value = '';
            // ソート順はリセットしない（または必要ならリセット）
            // currentSortOrder = 'desc';
            updateDisplay(); // 表示更新
        });
    } else { console.warn('#resetFilters not found.'); }

    // ===========================
    // ==== 件数表示機能 ====
    // ===========================
    const updateResultsCount = (count) => {
        if (resultsCount) {
            resultsCount.textContent = `${count}件 表示中`;
        } else if (!resultsCount) {
            // console.warn('#resultsCount not found.'); // 毎回出すと煩わしいかも
        }
    };


    // ===========================
    // ==== 初期化実行 ====
    // ===========================
    allCardData = initializeCardData(); // 全カード情報を取得して保持
    updateDisplay(); // 初期表示 (フィルター・ソート適用)


}); // End of DOMContentLoaded
