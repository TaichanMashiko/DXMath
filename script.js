/**
 * 授業記録まとめページ用スクリプト
 * - ダークモード切り替え
 * - 日付によるカードソート
 * - 件数表示 (仮)
 */

document.addEventListener('DOMContentLoaded', () => {

    // ==== 要素取得 ====
    const body = document.body;
    const darkModeToggle = document.getElementById('darkModeToggle');
    const sortButton = document.getElementById('sortButton');
    const cardGrid = document.getElementById('cardGrid');
    const resultsCount = document.getElementById('resultsCount');
    // 将来の拡張用 (検索・フィルタリング)
    // const searchInput = document.getElementById('searchInput');
    // const searchButton = document.getElementById('searchButton');
    // const tagListContainer = document.getElementById('tagList');
    // const resetFiltersButton = document.getElementById('resetFilters');

    // ===========================
    // ==== ダークモード機能 ====
    // ===========================
    if (darkModeToggle) {
        /**
         * 指定されたテーマを適用し、LocalStorageに保存する
         * @param {string} theme 'light' または 'dark'
         */
        const applyTheme = (theme) => {
            if (theme === 'dark') {
                body.classList.add('dark-mode');
                darkModeToggle.innerHTML = '<i class="fa-solid fa-sun"></i>';
                darkModeToggle.title = 'ライトモードに切替';
                localStorage.setItem('theme', 'dark');
            } else {
                body.classList.remove('dark-mode');
                darkModeToggle.innerHTML = '<i class="fa-solid fa-moon"></i>';
                darkModeToggle.title = 'ダークモードに切替';
                localStorage.setItem('theme', 'light');
            }
        };

        // --- 初期テーマ設定 ---
        const savedTheme = localStorage.getItem('theme');
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

        if (savedTheme) {
            applyTheme(savedTheme);
        } else if (prefersDark) {
            applyTheme('dark');
        } else {
            applyTheme('light'); // デフォルト
        }

        // --- ボタンクリックイベント ---
        darkModeToggle.addEventListener('click', () => {
            const newTheme = body.classList.contains('dark-mode') ? 'light' : 'dark';
            applyTheme(newTheme);
        });
    } else {
        console.warn('ダークモード切り替えボタン(#darkModeToggle)が見つかりません。');
    }


    // ===========================
    // ==== 日付ソート機能 ====
    // ===========================
    let currentSortOrder = 'desc'; // 初期値: 新しい順 (desc)

    if (sortButton && cardGrid) {
        // --- 現在表示されているカードを取得する関数 ---
        // 注意: フィルタリング機能実装後は、表示中のカードのみを返すように変更が必要
        const getVisibleCards = () => {
            return Array.from(cardGrid.querySelectorAll('.card'));
        };

        // --- カードをソートしてDOMに再配置する関数 ---
        const sortAndDisplayCards = () => {
            const cards = getVisibleCards(); // 現在表示されているカードを取得

            cards.sort((a, b) => {
                const dateA = new Date(a.dataset.date || 0); // 不正な日付の場合は0として扱う
                const dateB = new Date(b.dataset.date || 0);

                // 日付が不正な場合のハンドリング (例: 不正な日付は常に最後に)
                if (isNaN(dateA.getTime()) && isNaN(dateB.getTime())) return 0;
                if (isNaN(dateA.getTime())) return 1; // Aが不正ならBより後
                if (isNaN(dateB.getTime())) return -1;// Bが不正ならAより後

                if (currentSortOrder === 'desc') {
                    return dateB - dateA; // 新しい順 (降順)
                } else {
                    return dateA - dateB; // 古い順 (昇順)
                }
            });

            // DOMに再配置
            // DocumentFragmentを使うと一度のDOM操作で済むため、パフォーマンスが良い
            const fragment = document.createDocumentFragment();
            cards.forEach(card => fragment.appendChild(card));
            cardGrid.appendChild(fragment); // フラグメントを一括で追加
        };

        // --- ソートボタンの表示を更新する関数 ---
        const updateSortButtonView = () => {
            if (currentSortOrder === 'desc') {
                sortButton.innerHTML = '<i class="fa-solid fa-arrow-down-wide-short"></i> 日付 新しい順';
                sortButton.dataset.sortOrder = 'desc';
            } else {
                sortButton.innerHTML = '<i class="fa-solid fa-arrow-up-short-wide"></i> 日付 古い順';
                sortButton.dataset.sortOrder = 'asc';
            }
        };

        // --- ボタンクリックイベント ---
        sortButton.addEventListener('click', () => {
            currentSortOrder = (currentSortOrder === 'desc') ? 'asc' : 'desc'; // ソート順をトグル
            sortAndDisplayCards(); // ソート実行
            updateSortButtonView(); // ボタン表示更新
        });

        // --- 初期化 ---
        // ページ読み込み時のソート順をボタンのdata属性から読み取る (もし設定されていれば)
        currentSortOrder = sortButton.dataset.sortOrder || 'desc';
        sortAndDisplayCards();    // 初期ソート実行
        updateSortButtonView();   // 初期ボタン表示

    } else {
        if (!sortButton) console.warn('ソートボタン(#sortButton)が見つかりません。');
        if (!cardGrid) console.warn('カードグリッド(#cardGrid)が見つかりません。');
    }


    // ===========================
    // ==== 件数表示 (仮) ====
    // ===========================
    const updateResultsCount = () => {
        if (resultsCount && cardGrid) {
            // 注意: フィルタリング実装後は、表示されている件数を正確にカウントする
            const cardCount = cardGrid.querySelectorAll('.card').length;
            resultsCount.textContent = `${cardCount}件 表示中`;
        } else if (!resultsCount) {
             console.warn('件数表示要素(#resultsCount)が見つかりません。');
        }
    };

    // --- 初期件数表示 ---
    updateResultsCount();


    // ==================================================
    // ==== 将来の機能のためのプレースホルダー ====
    // ==================================================

    // --- 検索機能 ---
    /*
    if (searchButton && searchInput) {
        const handleSearch = () => {
            const searchTerm = searchInput.value.trim().toLowerCase();
            // ここでフィルタリングと表示更新のロジックを呼び出す
            console.log('検索実行:', searchTerm);
            // displayFilteredCards(); // 例: フィルタリングと表示を行う関数
            updateResultsCount(); // 件数更新
        };
        searchButton.addEventListener('click', handleSearch);
        searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                handleSearch();
            }
        });
    }
    */

    // --- タグフィルター機能 ---
    /*
    if (tagListContainer) {
        let currentFilterTag = 'all'; // 初期値

        const handleTagFilter = (event) => {
            if (event.target.classList.contains('tag-filter') && !event.target.classList.contains('reset-filter')) {
                currentFilterTag = event.target.dataset.tag;
                // アクティブクラスの更新
                tagListContainer.querySelectorAll('.tag-filter').forEach(btn => {
                    btn.classList.remove('active');
                });
                event.target.classList.add('active');
                // ここでフィルタリングと表示更新のロジックを呼び出す
                console.log('タグフィルター:', currentFilterTag);
                // displayFilteredCards(); // 例: フィルタリングと表示を行う関数
                updateResultsCount(); // 件数更新
            }
        };
        tagListContainer.addEventListener('click', handleTagFilter);

        // カード内のタグクリックにも対応
        cardGrid.addEventListener('click', (event) => {
             if (event.target.classList.contains('tag')) {
                 const clickedTag = event.target.dataset.tag;
                 // 対応するフィルターボタンを探してクリックイベントを発火させるか、直接処理
                 const filterButton = tagListContainer.querySelector(`.tag-filter[data-tag="${clickedTag}"]`);
                 if (filterButton) {
                     filterButton.click(); // フィルターボタンのクリックイベントを発火
                 } else {
                    // 直接フィルター処理
                    currentFilterTag = clickedTag;
                     console.log('カード内タグフィルター:', currentFilterTag);
                     // displayFilteredCards();
                     updateResultsCount();
                 }
             }
        });

        // リセットボタン
        if (resetFiltersButton) {
            resetFiltersButton.addEventListener('click', () => {
                currentFilterTag = 'all';
                 tagListContainer.querySelectorAll('.tag-filter').forEach(btn => {
                    btn.classList.remove('active');
                });
                tagListContainer.querySelector('.tag-filter[data-tag="all"]').classList.add('active');
                 // 検索もリセットする場合
                 // searchInput.value = '';
                 console.log('フィルターリセット');
                 // displayFilteredCards();
                 updateResultsCount();
            });
        }
    }
    */

    // --- 統合された表示更新関数 (将来の理想形) ---
    /*
    const displayFilteredCards = () => {
        const searchTerm = searchInput.value.trim().toLowerCase();
        const filterTag = currentFilterTag; // 'all' または特定のタグ
        const sortOrder = currentSortOrder;

        // 1. 全カードデータを取得 (初回に一度だけ読み込むのが効率的)
        // const allCardData = getAllCardData(); // 例

        // 2. フィルター (タグ -> 検索)
        // let filteredCards = filterByTag(allCardData, filterTag);
        // filteredCards = filterBySearch(filteredCards, searchTerm);

        // 3. ソート
        // sortCards(filteredCards, sortOrder);

        // 4. DOMに表示
        // renderCards(filteredCards);

        // 5. 件数更新
        // updateResultsCount(filteredCards.length);
    };
    */

}); // End of DOMContentLoaded
