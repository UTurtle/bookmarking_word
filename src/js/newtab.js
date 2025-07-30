// New Tab Page JavaScript - Board Layout
class VocabularyBoard {
    constructor() {
        this.vocabulary = [];
        this.definitionVisible = {};
        this.animationsEnabled = true;
        this.weeklyScore = 0;
        this.quizQuestions = [];
        this.currentQuiz = null;
        this.selectedQuizType = 'definition-to-word'; // Default setting
        this.allDefinitionsHidden = false;
        this.allWordsHidden = false;
        this.currentView = 'board'; // 'board' or 'table'
        this.streakCount = 0;
        this.lastQuizDate = null;
        this.streakBonusEnabled = true;
        this.cardClickToggleEnabled = true; // 카드 클릭 토글 기능 활성화 여부
        this.currentLayout = 'compact'; // 'compact' or 'classic'
        this.cardButtonsVisible = true; // 카드 버튼 표시 여부
        
        // Search prevention flags
        this.searchingWord = false;
        this.lastSearchTime = null;
        
        // Card click debouncing
        this.lastCardClickTime = 0;
        this.cardClickDebounceDelay = 100; // 0.1초 딜레이
        
        // Quiz is now handled in separate window, no cleanup needed
        
        // Local quiz tracking
        this.quizHistory = [];
        
        this.initializeElements();
        this.bindEvents();
        this.loadVocabulary();
        this.loadSettings();
        this.loadWeeklyScore();
        this.startTimeUpdate();
    }
    
    initializeElements() {
        this.wordsContainer = document.getElementById('words-container');
        this.wordsGrid = document.getElementById('words-grid');
        this.wordsTable = document.getElementById('words-table');
        this.refreshBtn = document.getElementById('refresh-words');
        this.addSampleBtn = document.getElementById('add-sample');
        this.exportBtn = document.getElementById('export-words');
        this.importBtn = document.getElementById('import-words');
        this.importFileInput = document.getElementById('import-file-input');
        this.manageWordsBtn = document.getElementById('manage-words');
        this.clearAllBtn = document.getElementById('clear-all');
        this.darkModeToggle = document.getElementById('dark-mode-toggle');
        this.animationToggle = document.getElementById('animation-toggle');
        this.layoutToggle = document.getElementById('layout-toggle');
        this.totalWordsSpan = document.getElementById('total-words');
        this.todayReviewedSpan = document.getElementById('today-reviewed');
        this.weeklyScoreSpan = document.getElementById('weekly-score');
        this.progressFill = document.getElementById('progress-fill');
        this.progressText = document.getElementById('progress-text');
        this.searchInput = document.getElementById('search-input');
        this.clearSearchBtn = document.getElementById('clear-search');
        this.sortSelect = document.getElementById('sort-select');
        this.startQuizBtn = document.getElementById('start-quiz');
        this.statusBtn = document.getElementById('status');
        
        // View controls
        this.boardViewBtn = document.getElementById('board-view');
        this.tableViewBtn = document.getElementById('table-view');
        this.toggleAllDefinitionsBtn = document.getElementById('toggle-all-definitions');
        this.toggleAllWordsBtn = document.getElementById('toggle-all-words');
        this.toggleCardButtonsBtn = document.getElementById('toggle-card-buttons');
        this.toggleCardClickBtn = document.getElementById('toggle-card-click');
        this.pinAllBtn = document.getElementById('pin-all');
        
        // Sidebar menu elements
        this.sidebarMenu = document.getElementById('sidebar-menu');
        this.sidebarToggle = document.getElementById('sidebar-toggle');
        this.menuToggleBtn = document.getElementById('menu-toggle-btn');
        

        this.unpinAllBtn = document.getElementById('unpin-all');
        
        // Quiz elements are now in separate window
        
        // Quiz type modal
        this.quizTypeModal = document.getElementById('quiz-type-modal');
        this.scoreModal = document.getElementById('score-modal');
        this.statusModal = document.getElementById('status-modal');

        
        // Score modal elements
        this.finalScoreSpan = document.getElementById('final-score-text');
        this.scoreDetails = document.getElementById('score-details');
        this.weeklyScoreDisplay = document.getElementById('weekly-score-display');
        this.correctCount = document.getElementById('correct-count');
        this.incorrectCount = document.getElementById('incorrect-count');
        
        // Status elements
        this.statusContent = document.getElementById('status-content');
        this.closeStatusBtn = document.getElementById('close-status');
        this.currentStreakSpan = document.getElementById('current-streak');
        this.bestStreakSpan = document.getElementById('best-streak');

        this.todayQuizzesCountSpan = document.getElementById('today-quizzes-count');
        this.todayTotalScoreSpan = document.getElementById('today-total-score');
        
        // Time display elements
        this.currentTimeSpan = document.getElementById('current-time');
        this.currentDateSpan = document.getElementById('current-date');
        
        // URL search elements
        this.urlSearchForm = document.getElementById('url-search-form');
        this.urlSearchInput = document.getElementById('url-search-input');
        

        
        // Optional: Check for critical missing elements
        const criticalElements = ['wordsGrid', 'searchInput', 'sortSelect'];
        const missingCritical = criticalElements.filter(key => !this[key]);
        
        if (missingCritical.length > 0) {
            console.error('Critical elements missing:', missingCritical);
        }
    }
    
    bindEvents() {
        // Main buttons
        if (this.refreshBtn) this.refreshBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.loadVocabulary();
        });
        if (this.addSampleBtn) this.addSampleBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.addSampleWords();
        });
        if (this.exportBtn) this.exportBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.exportWords();
        });
        if (this.importBtn) this.importBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.importWords();
        });
        if (this.importFileInput) this.importFileInput.addEventListener('change', (e) => this.handleImportFile(e));
        
        // View controls
        if (this.boardViewBtn) this.boardViewBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.switchView('board');
        });
        if (this.tableViewBtn) this.tableViewBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.switchView('table');
        });
        
        // Toggle buttons
        if (this.toggleAllDefinitionsBtn) this.toggleAllDefinitionsBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.toggleAllDefinitions();
        });
        if (this.toggleAllWordsBtn) this.toggleAllWordsBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.toggleAllWords();
        });
        
        // Pin buttons
        if (this.pinAllBtn) this.pinAllBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.pinAllWords();
        });
        if (this.unpinAllBtn) this.unpinAllBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.unpinAllWords();
        });
        
        // Archived words button
        const showArchivedBtn = document.getElementById('show-archived');
        if (showArchivedBtn) showArchivedBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.showArchivedWords();
        });
        
        // Update examples button
        const updateExamplesBtn = document.getElementById('update-examples');
        if (updateExamplesBtn) updateExamplesBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.updateExistingWordsWithExamples();
        });
        

        
        // Today Voca button
        const startTodayVocaBtn = document.getElementById('start-today-voca');
        if (startTodayVocaBtn) startTodayVocaBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.startTodayVoca();
        });
        
        // Today Voca icon button
        const startTodayVocaIconBtn = document.getElementById('start-today-voca-icon');
        if (startTodayVocaIconBtn) startTodayVocaIconBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.startTodayVoca();
        });
        
        if (this.manageWordsBtn) this.manageWordsBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.openPopup();
        });
        if (this.clearAllBtn) this.clearAllBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.clearAllWords();
        });
        if (this.darkModeToggle) this.darkModeToggle.addEventListener('click', (e) => {
            e.stopPropagation();
            this.toggleDarkMode();
        });
        if (this.animationToggle) this.animationToggle.addEventListener('click', (e) => {
            e.stopPropagation();
            this.toggleAnimations();
        });
        if (this.layoutToggle) this.layoutToggle.addEventListener('click', (e) => {
            e.stopPropagation();
            this.toggleLayout();
        });
        
        // Keyboard shortcut handling for newtab page
        document.addEventListener('keydown', (e) => {
            // Ctrl+Shift+S for saving selected word
            if (e.ctrlKey && e.shiftKey && e.key === 'S') {
                e.preventDefault();
                this.handleKeyboardShortcut();
            }
        });
        if (this.toggleCardButtonsBtn) this.toggleCardButtonsBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.toggleCardButtons();
        });
        
        if (this.toggleCardClickBtn) this.toggleCardClickBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.toggleCardClick();
        });
        

        
        // Sidebar menu events
        if (this.menuToggleBtn) {
            this.menuToggleBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.toggleSidebar();
            });
        }
        
        // Icon button events (for collapsed sidebar)
        const iconButtons = [
            { id: 'refresh-words-icon', action: () => this.loadVocabulary() },
            { id: 'export-words-icon', action: () => this.exportWords() },
            { id: 'import-words-icon', action: () => this.importWords() },
            { id: 'toggle-all-definitions-icon', action: () => this.toggleAllDefinitions() },
            { id: 'toggle-all-words-icon', action: () => this.toggleAllWords() },
            { id: 'toggle-card-buttons-icon', action: () => this.toggleCardButtons() },
            { id: 'toggle-card-click-icon', action: () => this.toggleCardClick() },
            { id: 'pin-all-icon', action: () => this.pinAllWords() },
            { id: 'unpin-all-icon', action: () => this.unpinAllWords() },
            { id: 'show-archived-icon', action: () => this.showArchivedWords() },
            { id: 'update-examples-icon', action: () => this.updateExistingWordsWithExamples() },
            { id: 'start-quiz-icon', action: () => this.showQuizTypeSelection() },
            { id: 'status-icon', action: () => this.showStatus() }
        ];
        
        iconButtons.forEach(({ id, action }) => {
            const btn = document.getElementById(id);
            if (btn) {
                btn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    action.call(this);
                });
            }
        });
        
        if (this.sidebarToggle) {
            this.sidebarToggle.addEventListener('click', (e) => {
                e.stopPropagation();
                this.closeSidebar();
            });
        }
        

        if (this.startQuizBtn) this.startQuizBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.showQuizTypeSelection();
        });
        if (this.statusBtn) this.statusBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.showStatus();
        });
        
        // Search and sort
        if (this.searchInput) this.searchInput.addEventListener('input', () => this.renderWordsGrid());
        if (this.clearSearchBtn) this.clearSearchBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.clearSearch();
        });
        if (this.sortSelect) this.sortSelect.addEventListener('change', () => this.renderWordsGrid());
        
        // URL search form
        if (this.urlSearchForm) this.urlSearchForm.addEventListener('submit', (e) => this.handleUrlSearch(e));
        

        
        // Quiz type selection
        const closeQuizTypeBtn = document.getElementById('close-quiz-type');
        if (closeQuizTypeBtn) closeQuizTypeBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.closeQuizTypeModal();
        });
        
        const quizTypeOptions = document.querySelectorAll('.quiz-type-option');
        quizTypeOptions.forEach(option => {
            option.addEventListener('click', (event) => {
                event.stopPropagation();
                this.selectQuizType(event);
            });
        });
        
        // Quiz now opens in separate window
        
        // Quiz functionality is now handled in separate window
        
        // Score modal
        const closeScoreBtn = document.getElementById('close-score');
        if (closeScoreBtn) closeScoreBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.closeScoreModal();
        });
        
        const retryQuizBtn = document.getElementById('retry-quiz');
        if (retryQuizBtn) retryQuizBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.retryQuiz();
        });
        
        const shareScoreBtn = document.getElementById('share-score');
        if (shareScoreBtn) shareScoreBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.shareScore();
        });
        
        // Status modal
        if (this.closeStatusBtn) this.closeStatusBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.closeStatusModal();
        });
        
        // Modal backdrop clicks
        if (this.quizTypeModal) {
            this.quizTypeModal.addEventListener('click', (e) => {
                if (e.target === this.quizTypeModal) this.closeQuizTypeModal();
            });
        }
        
        // Quiz modal is no longer used
        
        if (this.scoreModal) {
            this.scoreModal.addEventListener('click', (e) => {
                if (e.target === this.scoreModal) this.closeScoreModal();
            });
        }
        
        if (this.statusModal) {
            this.statusModal.addEventListener('click', (e) => {
                if (e.target === this.statusModal) this.closeStatusModal();
            });
        }
        

        
        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            // Ctrl+L: Toggle layout
            if (e.ctrlKey && e.key === 'l') {
                e.preventDefault();
                this.toggleLayout();
            }
            // Ctrl+D: Toggle dark mode
            if (e.ctrlKey && e.key === 'd') {
                e.preventDefault();
                this.toggleDarkMode();
            }
            // Ctrl+B: Toggle card buttons
            if (e.ctrlKey && e.key === 'b') {
                e.preventDefault();
                this.toggleCardButtons();
            }

        });
        
        // Text selection for word saving - Improved version with debouncing
        let lastSelectedText = '';
        let selectionTimeout = null;
        
        document.addEventListener('mouseup', (e) => {
            // Don't trigger text selection on buttons and interactive elements
            if (e.target.closest('.btn, .delete-btn, .edit-definition-btn, .related-btn, .opposite-btn, .search-word-btn, .modal-close, .quiz-option, .word-action-btn, .sort-select, .search-input, .modal, .modal-content')) {
                return;
            }
            
            // Don't trigger if clicking on the save indicator itself
            if (e.target.closest('#word-save-indicator')) {
                return;
            }
            
            // Don't trigger if clicking on word cards or their content
            if (e.target.closest('.word-card')) {
                return;
            }
            
            // Don't trigger if clicking on header elements
            if (e.target.closest('.header, .header-controls, .stats, .controls')) {
                return;
            }
            
            // Clear previous timeout
            if (selectionTimeout) {
                clearTimeout(selectionTimeout);
            }
            
            // Debounced text selection check
            selectionTimeout = setTimeout(() => {
                const selectedText = window.getSelection().toString().trim();
                if (selectedText && selectedText.length > 0 && selectedText !== lastSelectedText) {
                    lastSelectedText = selectedText;
                    this.showWordSaveIndicator(selectedText);
                }
            }, 200);
        });

        // Improved selection change event with debouncing
        document.addEventListener('selectionchange', () => {
            // Clear previous timeout
            if (selectionTimeout) {
                clearTimeout(selectionTimeout);
            }
            
            // Debounced selection change check
            selectionTimeout = setTimeout(() => {
                const selectedText = window.getSelection().toString().trim();
                if (selectedText && selectedText.length > 0 && selectedText !== lastSelectedText) {
                    lastSelectedText = selectedText;
                    this.showWordSaveIndicator(selectedText);
                }
            }, 300);
        });

        document.addEventListener('mousedown', (e) => {
            // Hide save indicator when clicking outside
            const indicator = document.getElementById('word-save-indicator');
            if (indicator && !indicator.contains(e.target)) {
                this.hideWordSaveIndicator();
                lastSelectedText = '';
            }
            
            // Clear any existing text selection when clicking on interactive elements
            if (e.target.closest('.btn, .delete-btn, .edit-definition-btn, .related-btn, .opposite-btn, .search-word-btn, .modal-close, .quiz-option, .word-action-btn, .sort-select, .search-input, .modal, .modal-content')) {
                window.getSelection().removeAllRanges();
                lastSelectedText = '';
            }
        });
        
        // Add keyboard shortcut for saving selected text
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey && e.shiftKey && e.key === 'S') {
                e.preventDefault();
                const selectedText = window.getSelection().toString().trim();
                if (selectedText && selectedText.length > 0) {
                    this.saveSelectedWord(selectedText);
                }
            }
        });
        
        // Remove periodic check as it's causing too many logs
        // setInterval(() => {
        //     const selectedText = window.getSelection().toString().trim();
        //     if (selectedText && selectedText.length > 0) {
        //         console.log('Periodic check - text selected:', selectedText);
        //         this.showWordSaveIndicator(selectedText);
        //     }
        // }, 1000);
        
        // Add direct event listeners after rendering
        this.addDirectEventListeners();

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.key === 'd' || e.key === 'D') {
                if (e.ctrlKey) {
                    e.preventDefault();
                    this.toggleDarkMode();
                }
            }
            if (e.key === 'q' || e.key === 'Q') {
                if (e.ctrlKey) {
                    e.preventDefault();
                    this.showQuizTypeSelection();
                }
            }
        });
        
        // 메시지 리스너 추가: background.js에서 getSelectedText 요청 처리
        chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
            if (request.action === 'getSelectedText') {
                const selectedText = window.getSelection().toString().trim();
                sendResponse({
                    selectedText,
                    url: window.location.href
                });
                return true; // 비동기 응답 허용
            }
        });
    }
    
    async loadSettings() {
        try {
            const result = await chrome.storage.local.get([
                'animationsEnabled', 
                'darkMode', 
                'allDefinitionsHidden',
                'allWordsHidden',
                'currentView',
                'cardClickToggleEnabled',
                'pdfAutoRedirect'
            ]);
            
            const syncResult = await chrome.storage.local.get([
                'currentLayout',
                'cardButtonsVisible'
            ]);
            
            this.animationsEnabled = result.animationsEnabled || false; // Default to false
            this.darkMode = result.darkMode || false; // Default to false
            this.allDefinitionsHidden = result.allDefinitionsHidden || false; // Default to false
            this.allWordsHidden = result.allWordsHidden || false; // Default to false
            this.currentView = result.currentView || 'board'; // Default to board view
            this.cardClickToggleEnabled = result.cardClickToggleEnabled !== false; // Default to true
            this.pdfAutoRedirect = result.pdfAutoRedirect !== false; // Default to true
            this.currentLayout = syncResult.currentLayout || 'compact'; // Default to compact
            this.cardButtonsVisible = syncResult.cardButtonsVisible !== false; // Default to true
            
            if (!this.animationsEnabled) {
                document.body.classList.add('animations-disabled');
                this.animationToggle.classList.add('disabled');
                this.animationToggle.textContent = '⏸️';
            }
            
            // Apply dark mode
            this.applyDarkMode();
            
            // Update header button
            if (this.darkModeToggle) {
                this.darkModeToggle.textContent = this.darkMode ? '☀️' : '🌙';
            }
            
            // Update settings modal checkbox
            if (this.settingsDarkModeToggle) {
                this.settingsDarkModeToggle.checked = this.darkMode;
            }
            
            // Update toggle all definitions button
            if (this.toggleAllDefinitionsBtn) {
                this.toggleAllDefinitionsBtn.textContent = this.allDefinitionsHidden ? 
                    '👁️ Show All Definitions' : '🙈 Hide All Definitions';
            }
            
            // Update toggle all words button
            if (this.toggleAllWordsBtn) {
                this.toggleAllWordsBtn.textContent = this.allWordsHidden ? 
                    '👁️ Show All Words' : '🙈 Hide All Words';
            }
            
            // Set initial view without re-rendering
            this.currentView = this.currentView || 'board';
            this.boardViewBtn.classList.toggle('active', this.currentView === 'board');
            this.tableViewBtn.classList.toggle('active', this.currentView === 'table');
            this.wordsGrid.classList.toggle('active', this.currentView === 'board');
            this.wordsTable.classList.toggle('active', this.currentView === 'table');
            
            // Apply layout
            document.body.classList.remove('compact-layout', 'classic-layout');
            document.body.classList.add(`${this.currentLayout}-layout`);
            
            // Update layout button
            if (this.layoutToggle) {
                const icon = this.layoutToggle.querySelector('.layout-icon');
                if (icon) {
                    icon.textContent = this.currentLayout === 'compact' ? '📐' : '📏';
                }
            }
            
            // Apply card buttons visibility
            if (!this.cardButtonsVisible) {
                document.body.classList.add('cards-buttons-hidden');
            }
            
                                // Update card buttons toggle button
                    if (this.toggleCardButtonsBtn) {
                        this.toggleCardButtonsBtn.textContent = this.cardButtonsVisible ? '🔘 Hide Card Buttons' : '🔘 Show Card Buttons';
                    }
                    
                    // Update card click toggle button
                    if (this.toggleCardClickBtn) {
                        this.toggleCardClickBtn.textContent = this.cardClickToggleEnabled ? '🖱️ Disable Card Click' : '🖱️ Enable Card Click';
                    }
        } catch (error) {
            console.error('Error loading settings:', error);
        }
    }
    
    async loadWeeklyScore() {
        try {
            const result = await chrome.storage.local.get(['weeklyScore', 'lastScoreReset', 'streakCount', 'lastQuizDate', 'streakBonusEnabled', 'quizHistory']);
            
            this.weeklyScore = result.weeklyScore || 0;
            this.streakCount = result.streakCount || 0;
            this.lastQuizDate = result.lastQuizDate || null;
            this.streakBonusEnabled = result.streakBonusEnabled !== false; // Default to true
            this.quizHistory = result.quizHistory || [];
            
            const lastReset = result.lastScoreReset ? new Date(result.lastScoreReset) : null;
            const currentMonday = this.getMondayOfWeek(new Date());
            
            // Reset weekly score if it's a new week
            if (!lastReset || lastReset < currentMonday) {
                this.weeklyScore = 0;
                await chrome.storage.local.set({ 
                    weeklyScore: 0, 
                    lastScoreReset: currentMonday.toISOString() 
                });
            }
            
            this.updateWeeklyScoreDisplay();
        } catch (error) {
            console.error('Error loading weekly score:', error);
        }
    }
    
    async saveStreakData() {
        try {
            await chrome.storage.local.set({
                streakCount: this.streakCount,
                lastQuizDate: this.lastQuizDate,
                streakBonusEnabled: this.streakBonusEnabled
            });
        } catch (error) {
            console.error('Error saving streak data:', error);
        }
    }
    
    calculateStreakBonus() {
        if (!this.streakBonusEnabled) return 0;
        
        const today = new Date().toDateString();
        const lastDate = this.lastQuizDate ? new Date(this.lastQuizDate).toDateString() : null;
        
        if (!lastDate) {
            // First time taking quiz
            this.streakCount = 1;
            this.lastQuizDate = new Date().toISOString();
            this.saveStreakData();
            return 0; // No bonus for first time
        }
        
        if (lastDate === today) {
            // Already took quiz today, no bonus
            return 0;
        }
        
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayString = yesterday.toDateString();
        
        if (lastDate === yesterdayString) {
            // Consecutive day
            this.streakCount++;
            this.lastQuizDate = new Date().toISOString();
            this.saveStreakData();
        } else {
            // Streak broken
            this.streakCount = 1;
            this.lastQuizDate = new Date().toISOString();
            this.saveStreakData();
        }
        
        // Calculate bonus (max 30 points)
        const bonus = Math.min((this.streakCount - 1) * 2, 30);
        return bonus;
    }
    
    getMondayOfWeek(date) {
        const d = new Date(date);
        const day = d.getDay();
        const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
        return new Date(d.setDate(diff));
    }
    
    updateWeeklyScoreDisplay() {
        if (this.weeklyScoreSpan) {
            this.weeklyScoreSpan.textContent = this.weeklyScore;
            
            // Add streak information
            if (this.streakCount > 1) {
                this.weeklyScoreSpan.innerHTML = `
                    ${this.weeklyScore} 
                    <span class="streak-info" title="Current streak: ${this.streakCount} days">🔥 ${this.streakCount}</span>
                `;
            }
        }
    }
    
    async loadVocabulary() {
        try {
            const result = await chrome.storage.local.get(['vocabulary']);
            this.vocabulary = result.vocabulary || [];
            
            this.renderWordsGrid();
            this.updateStats();
            this.updateProgress();
        } catch (error) {
            console.error('Error loading vocabulary:', error);
        }
    }
    
    filterWords() {
        const searchTerm = this.searchInput.value.toLowerCase().trim();
        
        if (!searchTerm) {
            return this.vocabulary;
        }
        
        return this.vocabulary.filter(word => {
            const wordText = word.word.toLowerCase();
            const definition = word.definition.toLowerCase();
            return wordText.includes(searchTerm) || definition.includes(searchTerm);
        });
    }
    
    clearSearch() {
        this.searchInput.value = '';
        this.renderWordsGrid();
    }
    
    sortWords(filteredVocabulary = null) {
        const sortBy = this.sortSelect ? this.sortSelect.value : 'date';
        let sortedVocabulary = filteredVocabulary || [...this.vocabulary];
        
        // First, sort by pinned status (pinned words first)
        sortedVocabulary.sort((a, b) => {
            const aPinned = a.pinned || false;
            const bPinned = b.pinned || false;
            if (aPinned && !bPinned) return -1;
            if (!aPinned && bPinned) return 1;
            return 0;
        });
        
        // Then sort by the selected criteria within each group (pinned/unpinned)
        switch (sortBy) {
            case 'alphabetical':
                sortedVocabulary.sort((a, b) => {
                    const aPinned = a.pinned || false;
                    const bPinned = b.pinned || false;
                    if (aPinned === bPinned) {
                        return a.word.localeCompare(b.word);
                    }
                    return 0; // Keep pinned order
                });
                break;
            case 'wrong-count':
                sortedVocabulary.sort((a, b) => {
                    const aPinned = a.pinned || false;
                    const bPinned = b.pinned || false;
                    if (aPinned === bPinned) {
                        const aWrongCount = a.wrongCount || 0;
                        const bWrongCount = b.wrongCount || 0;
                        return bWrongCount - aWrongCount; // 높은 틀린 횟수 우선
                    }
                    return 0; // Keep pinned order
                });
                break;
            case 'learning-priority':
                sortedVocabulary.sort((a, b) => {
                    const aPinned = a.pinned || false;
                    const bPinned = b.pinned || false;
                    if (aPinned === bPinned) {
                        const aPriority = a.learningPriority || 0;
                        const bPriority = b.learningPriority || 0;
                        return bPriority - aPriority; // 높은 우선순위 우선
                    }
                    return 0; // Keep pinned order
                });
                break;
            case 'date':
            default:
                sortedVocabulary.sort((a, b) => {
                    const aPinned = a.pinned || false;
                    const bPinned = b.pinned || false;
                    if (aPinned === bPinned) {
                        return new Date(b.dateAdded) - new Date(a.dateAdded);
                    }
                    return 0; // Keep pinned order
                });
                break;
        }
        
        // Only update vocabulary and re-render if this is a direct sort (not from renderWordsGrid)
        if (!filteredVocabulary) {
            this.vocabulary = sortedVocabulary;
            // Don't call renderWordsGrid here to avoid infinite recursion
        }
        return sortedVocabulary;
    }
    
    renderWordsGrid() {
        if (this.vocabulary.length === 0) {
            this.showEmptyState();
            return;
        }
        
        const filteredWords = this.filterWords();
        const sortedWords = this.sortWords(filteredWords);
        
        if (this.currentView === 'board') {
            this.wordsGrid.innerHTML = sortedWords.map(word => this.createWordCardHTML(word)).join('');
        } else {
            this.wordsTable.innerHTML = this.createTableHTML(sortedWords);
        }
        
        this.addDirectEventListeners();
    }
    
    createTableHTML(words) {
        // Always create all columns, individual elements will be hidden
        const tableHeader = `
            <div class="table-header">
                <div class="table-cell">Pin</div>
                <div class="table-cell">Word</div>
                <div class="table-cell">Definition</div>
                <div class="table-cell">Example</div>
                <div class="table-cell">Date Added</div>
                <div class="table-cell">Wrong/Correct Count</div>
                <div class="table-cell">Actions</div>
            </div>
        `;
        
        const tableRows = words.map(word => {
            const dateAdded = new Date(word.dateAdded).toLocaleDateString();
            const isPinned = word.pinned || false;
            
            return `
                <div class="table-row" data-word="${word.word}">
                    <div class="table-cell">
                        <button class="pin-btn ${isPinned ? 'pinned' : ''}" title="${isPinned ? 'Unpin word' : 'Pin word'}" data-word="${word.word}">
                            ${isPinned ? '📌' : '📍'}
                        </button>
                    </div>
                    <div class="table-cell">
                        <div class="word-text ${this.allWordsHidden ? 'hidden' : ''}">${word.word}</div>
                    </div>
                    <div class="table-cell">
                        <div class="definition ${this.allDefinitionsHidden ? 'hidden' : ''}">${word.definition}</div>
                    </div>
                    <div class="table-cell">
                        <div class="example ${(this.allDefinitionsHidden || this.allWordsHidden) ? 'hidden' : ''}" data-word="${word.word}">${word.example ? `💬 ${word.example}` : '-'}</div>
                    </div>
                    <div class="table-cell">
                        <div class="date-added ${(this.allDefinitionsHidden || this.allWordsHidden) ? 'hidden' : ''}">${dateAdded}</div>
                    </div>
                    <div class="table-cell">
                        <div class="wrong-count ${(this.allDefinitionsHidden || this.allWordsHidden) ? 'hidden' : ''}">
                            ${word.wrongCount || 0}/${word.correctCount || 0}
                        </div>
                    </div>
                    <div class="table-cell">
                        <div class="actions ${(this.allDefinitionsHidden || this.allWordsHidden) ? 'hidden' : ''}">
                            <button class="archive-btn" title="Archive word" data-word="${word.word}">📦</button>
                            <button class="delete-btn" title="Delete word" data-word="${word.word}">×</button>
                            <button class="edit-definition-btn" title="Edit definition" data-word="${word.word}">📝</button>
                            <button class="search-word-btn" title="Search word online" data-word="${word.word}">🔍</button>
                            <button class="related-btn" title="Show related words" data-word="${word.word}">Related</button>
                            <button class="opposite-btn" title="Show opposite words" data-word="${word.word}">Opposite</button>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
        
        return tableHeader + tableRows;
    }
    
    createWordCardHTML(word) {
        const dateAdded = new Date(word.dateAdded).toLocaleDateString();
        const isPinned = word.pinned || false;
        const pinnedClass = isPinned ? 'pinned' : '';
        const hiddenClasses = [];
        
        if (this.allDefinitionsHidden) hiddenClasses.push('definition hidden');
        if (this.allWordsHidden) hiddenClasses.push('word-text hidden');
        if (this.allDefinitionsHidden || this.allWordsHidden) {
            hiddenClasses.push('word-actions hidden');
            hiddenClasses.push('word-meta hidden');
        }
        
        // 틀린 횟수 정보 표시
        const wrongCount = word.wrongCount || 0;
        const totalAttempts = word.totalAttempts || 0;
        const correctCount = word.correctCount || 0;
        const wrongCountDisplay = wrongCount > 0 ? `<span class="wrong-count" title="틀린 횟수: ${wrongCount}">❌${wrongCount}</span>` : '';
        const statsDisplay = totalAttempts > 0 ? `<span class="stats-info" title="정답: ${correctCount}, 시도: ${totalAttempts}">📊${correctCount}/${totalAttempts}</span>` : '';
        
        return `
            <div class="word-card ${pinnedClass}" data-word="${word.word}">
                <button class="archive-btn" title="Archive word">📦</button>
                <button class="delete-btn" title="Delete word">×</button>
                <button class="pin-btn ${isPinned ? 'pinned' : ''}" title="${isPinned ? 'Unpin word' : 'Pin word'}" data-word="${word.word}">
                    ${isPinned ? '📌' : '📍'}
                </button>
                <div class="word-text ${this.allWordsHidden ? 'hidden' : ''}">
                    ${word.word}
                </div>
                <div class="definition ${this.allDefinitionsHidden ? 'hidden' : ''}">${word.definition}</div>
                <!-- Example is hidden in board view for cleaner look -->
                <div class="word-actions ${(this.allDefinitionsHidden || this.allWordsHidden) ? 'hidden' : ''}">
                    <button class="edit-definition-btn" title="Edit definition" data-word="${word.word}">📝</button>
                    <button class="search-word-btn" title="Search word online" data-word="${word.word}">🔍</button>
                    <button class="related-btn" title="Show related words" data-word="${word.word}">Related Words</button>
                    <button class="opposite-btn" title="Show opposite words" data-word="${word.word}">Opposite Words</button>
                </div>
                <div class="word-meta ${(this.allDefinitionsHidden || this.allWordsHidden) ? 'hidden' : ''}">
                    <span class="date-added">${dateAdded}</span>
                    ${wrongCountDisplay}
                    ${statsDisplay}
                </div>
            </div>
        `;
    }
    
    // addWordCardEventListeners() { // REMOVED
    //     // Event delegation is now handled in bindEvents()
    //     // This method is kept for compatibility but no longer needed
    //     console.log('Event delegation is now handled in bindEvents()');
    // }
    
    isReviewedToday(word) {
        if (!word.lastReviewed) return false;
        const today = new Date().toDateString();
        const lastReviewed = new Date(word.lastReviewed).toDateString();
        return lastReviewed === today;
    }
    
    async markAsReviewed(wordText) {
        try {
            const wordIndex = this.vocabulary.findIndex(w => w.word === wordText);
            if (wordIndex !== -1) {
                const word = this.vocabulary[wordIndex];
                const today = new Date().toDateString();
                const lastReviewed = word.lastReviewed ? new Date(word.lastReviewed).toDateString() : null;
                
                // Only increment if not already reviewed today
                if (lastReviewed !== today) {
                    word.reviewCount += 1;
                    word.lastReviewed = new Date().toISOString();
                    
                    await chrome.storage.local.set({ vocabulary: this.vocabulary });
                    
                    // Enhanced refresh after marking as reviewed
                    await this.refreshVocabularyDisplay();
                }
            }
        } catch (error) {
            console.error('Error marking word as reviewed:', error);
        }
    }
    
    async deleteWord(wordText) {
        try {
            this.vocabulary = this.vocabulary.filter(w => w.word !== wordText);
            await chrome.storage.local.set({ vocabulary: this.vocabulary });
            
            // Enhanced refresh after deletion
            await this.refreshVocabularyDisplay();
        } catch (error) {
            console.error('Error deleting word:', error);
        }
    }
    
    async addSampleWords() {
        const sampleWords = [
            'serendipity',
            'ubiquitous',
            'ephemeral',
            'effervescent',
            'quintessential',
            'mellifluous',
            'plethora',
            'indubitable'
        ];
        
        let addedCount = 0;
        for (const word of sampleWords) {
            const wasAdded = await this.addWordWithDefinition(word);
            if (wasAdded) addedCount++;
        }
        
        if (addedCount > 0) {
            // Delayed refresh after all words are added
            setTimeout(async () => {
                await this.refreshVocabularyDisplay();
            }, 1000);
            this.showSuccess(`${addedCount} sample words added successfully!`);
        } else {
            alert('All sample words already exist!');
        }
    }
    
    async addWordWithDefinition(word) {
        try {
            // Check if word already exists
            const exists = this.vocabulary.find(w => w.word === word);
            if (exists) return false;
            
            // Get definition and example from API
            const wordData = await this.getWordDefinition(word);
            
            // Add to vocabulary
            const newWord = {
                word: word,
                definition: wordData.definition,
                example: wordData.example,
                dateAdded: new Date().toISOString(),
                reviewCount: 0
            };
            
            this.vocabulary.push(newWord);
            await chrome.storage.local.set({ vocabulary: this.vocabulary });
            
            return true;
            
        } catch (error) {
            console.error('Error adding sample word:', error);
            return false;
        }
    }
    
    async getWordDefinition(word) {
        try {
            const response = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${word}`);
            const data = await response.json();
            
            if (Array.isArray(data) && data.length > 0) {
                const entry = data[0];
                if (entry.meanings && entry.meanings.length > 0) {
                    const meaning = entry.meanings[0];
                    const definition = meaning.definitions[0].definition;
                    
                    // Try to get an example sentence
                    let example = null;
                    if (meaning.definitions[0].example) {
                        example = meaning.definitions[0].example;
                    } else if (entry.meanings.some(m => m.definitions.some(d => d.example))) {
                        // Look for examples in other meanings
                        for (const m of entry.meanings) {
                            for (const d of m.definitions) {
                                if (d.example) {
                                    example = d.example;
                                    break;
                                }
                            }
                            if (example) break;
                        }
                    }
                    
                    return {
                        definition: definition,
                        example: example
                    };
                }
            }
            return {
                definition: "Definition not found",
                example: null
            };
        } catch (error) {
            console.error('Error fetching definition:', error);
            return {
                definition: "Definition not available",
                example: null
            };
        }
    }
    
    updateStats() {
        const totalWords = this.vocabulary.length;
        const pinnedWords = this.vocabulary.filter(word => word.pinned).length;
        
        if (this.totalWordsSpan) {
            this.totalWordsSpan.textContent = `${totalWords} words`;
        }
        if (this.todayReviewedSpan) {
            this.todayReviewedSpan.textContent = `${pinnedWords} pinned`;
        }
        if (this.weeklyScoreSpan) {
            this.weeklyScoreSpan.textContent = `Weekly Score: ${this.weeklyScore}`;
        }
    }
    
    updateProgress() {
        if (this.vocabulary.length === 0) {
            this.progressFill.style.width = '0%';
            this.progressText.textContent = '0% pinned';
            return;
        }
        
        const pinnedWords = this.vocabulary.filter(word => word.pinned).length;
        const progressPercentage = Math.round((pinnedWords / this.vocabulary.length) * 100);
        this.progressFill.style.width = `${progressPercentage}%`;
        this.progressText.textContent = `${progressPercentage}% pinned`;
    }
    
    showEmptyState() {
        const emptyStateHTML = `
            <div class="empty-state">
                <h3>No vocabulary words yet</h3>
                <p>Start browsing and save words using <strong>Ctrl+Shift+S</strong>, or click "Add Sample" to see how it works!</p>
                <div class="invalid-word-notice">
                    <p><strong>⚠️ Invalid Word Notice:</strong> Please do not save words containing sensitive information. Most invalid words are blocked automatically, but English words that contain sensitive information may still be transmitted to API servers.</p>
                </div>
            </div>
        `;
        
        if (this.currentView === 'board') {
            this.wordsGrid.innerHTML = emptyStateHTML;
        } else {
            this.wordsTable.innerHTML = emptyStateHTML;
        }
    }
    
    showErrorState() {
        const errorStateHTML = `
            <div class="empty-state">
                <h3>Error loading vocabulary</h3>
                <p>Please try refreshing the page or check the extension settings.</p>
            </div>
        `;
        
        if (this.currentView === 'board') {
            this.wordsGrid.innerHTML = errorStateHTML;
        } else {
            this.wordsTable.innerHTML = errorStateHTML;
        }
    }
    
    async toggleDarkMode() {
        this.darkMode = !this.darkMode;
        
        // Apply dark mode
        this.applyDarkMode();
        
        // Update header button
        if (this.darkModeToggle) {
            this.darkModeToggle.textContent = this.darkMode ? '☀️' : '🌙';
        }
        
        // Update settings modal checkbox
        if (this.settingsDarkModeToggle) {
            this.settingsDarkModeToggle.checked = this.darkMode;
        }
        
        // Save preference
        try {
            await chrome.storage.local.set({ darkMode: this.darkMode });
        } catch (error) {
            console.error('Error saving dark mode preference:', error);
        }
    }
    
    async toggleAnimations() {
        this.animationsEnabled = !this.animationsEnabled;
        
        if (this.animationsEnabled) {
            document.body.classList.remove('animations-disabled');
            this.animationToggle.classList.remove('disabled');
            this.animationToggle.textContent = '🎬';
        } else {
            document.body.classList.add('animations-disabled');
            this.animationToggle.classList.add('disabled');
            this.animationToggle.textContent = '⏸️';
        }
        
        // Save preference
        try {
            await chrome.storage.local.set({ animationsEnabled: this.animationsEnabled });
        } catch (error) {
            console.error('Error saving animation preference:', error);
        }
    }
    
    async toggleLayout() {
        this.currentLayout = this.currentLayout === 'compact' ? 'classic' : 'compact';
        
        // Apply layout
        document.body.classList.remove('compact-layout', 'classic-layout');
        document.body.classList.add(`${this.currentLayout}-layout`);
        
        // Update button text
        if (this.layoutToggle) {
            const icon = this.layoutToggle.querySelector('.layout-icon');
            if (icon) {
                icon.textContent = this.currentLayout === 'compact' ? '📐' : '📏';
            }
        }
        
        // Save setting
        try {
            await chrome.storage.local.set({ currentLayout: this.currentLayout });
        } catch (error) {
            console.error('Error saving layout setting:', error);
        }
    }
    
    async toggleCardButtons() {
        this.cardButtonsVisible = !this.cardButtonsVisible;
        
        // Apply to body for global toggle
        if (this.cardButtonsVisible) {
            document.body.classList.remove('cards-buttons-hidden');
        } else {
            document.body.classList.add('cards-buttons-hidden');
        }
        
        // Update button text
        if (this.toggleCardButtonsBtn) {
            this.toggleCardButtonsBtn.textContent = this.cardButtonsVisible ? '🔘 Hide Card Buttons' : '🔘 Show Card Buttons';
        }
        
        // Save setting
        try {
            await chrome.storage.local.set({ cardButtonsVisible: this.cardButtonsVisible });
        } catch (error) {
            console.error('Error saving card buttons setting:', error);
        }
    }
    
    async toggleCardClick() {
        this.cardClickToggleEnabled = !this.cardClickToggleEnabled;
        
        // Update button text
        if (this.toggleCardClickBtn) {
            this.toggleCardClickBtn.textContent = this.cardClickToggleEnabled ? '🖱️ Disable Card Click' : '🖱️ Enable Card Click';
        }
        
        // Save setting
        try {
            await chrome.storage.local.set({ cardClickToggleEnabled: this.cardClickToggleEnabled });
        } catch (error) {
            console.error('Error saving card click setting:', error);
        }
    }
    
    toggleSidebar() {
        if (this.sidebarMenu) {
            this.sidebarMenu.classList.toggle('open');
        }
    }
    
    closeSidebar() {
        if (this.sidebarMenu) {
            this.sidebarMenu.classList.remove('open');
        }
    }
    
    openPopup() {
        chrome.action.openPopup();
    }
    
    async clearAllWords() {
        if (!confirm('Are you sure you want to delete all vocabulary words? This action cannot be undone.')) {
            return;
        }
        
        try {
            this.vocabulary = [];
            await chrome.storage.local.set({ vocabulary: this.vocabulary });
            
            // Enhanced refresh after clearing all words
            await this.refreshVocabularyDisplay();
        } catch (error) {
            console.error('Error clearing all words:', error);
        }
    }
    
    async exportWords() {
        try {
            const csvContent = this.generateCSV();
            const blob = new Blob([csvContent], { type: 'text/csv' });
            const url = URL.createObjectURL(blob);
            
            const a = document.createElement('a');
            a.href = url;
            a.download = `vocabulary_${new Date().toISOString().split('T')[0]}.csv`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        } catch (error) {
            console.error('Error exporting words:', error);
        }
    }
    
    generateCSV() {
        const headers = ['Word', 'Definition', 'Date Added', 'Review Count', 'Pinned', 'Example'];
        const rows = this.vocabulary.map(word => [
            word.word,
            `"${word.definition.replace(/"/g, '""')}"`,
            word.dateAdded,
            word.reviewCount,
            word.pinned ? 'Yes' : 'No',
            word.example ? `"${word.example.replace(/"/g, '""')}"` : ''
        ]);
        
        return [headers, ...rows].map(row => row.join(',')).join('\n');
    }

    importWords() {
        this.importFileInput.click();
    }

    async handleImportFile(event) {
        const file = event.target.files[0];
        if (!file) return;

        if (!file.name.toLowerCase().endsWith('.csv')) {
            this.showError('Please select a CSV file');
            return;
        }

        try {
            const text = await file.text();
            const lines = text.split('\n');
            
            if (lines.length < 2) {
                this.showError('Invalid CSV file format');
                return;
            }

            const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
            const importedWords = [];

            for (let i = 1; i < lines.length; i++) {
                const line = lines[i].trim();
                if (!line) continue;

                const values = this.parseCSVLine(line);
                if (values.length < 2) continue;

                const word = {
                    word: values[0].trim(),
                    definition: values[1].trim(),
                    dateAdded: values[2] ? values[2].trim() : new Date().toISOString(),
                    reviewCount: parseInt(values[3]) || 0,
                    pinned: values[4] === 'Yes',
                    example: values[5] ? values[5].trim() : null
                };

                if (word.word && word.definition) {
                    importedWords.push(word);
                }
            }

            if (importedWords.length === 0) {
                this.showError('No valid words found in the CSV file');
                return;
            }

            // Add imported words to vocabulary
            for (const word of importedWords) {
                const existingIndex = this.vocabulary.findIndex(w => w.word.toLowerCase() === word.word.toLowerCase());
                if (existingIndex !== -1) {
                    // Update existing word
                    this.vocabulary[existingIndex] = { ...this.vocabulary[existingIndex], ...word };
                } else {
                    // Add new word
                    this.vocabulary.push(word);
                }
            }

            await chrome.storage.local.set({ vocabulary: this.vocabulary });
            
            // Delayed refresh after import
            setTimeout(async () => {
                await this.refreshVocabularyDisplay();
            }, 1000);

            this.showSuccess(`Successfully imported ${importedWords.length} words!`);
            
            // Clear file input
            this.importFileInput.value = '';

        } catch (error) {
            console.error('Error importing words:', error);
            this.showError('Error importing words. Please check the file format.');
        }
    }

    parseCSVLine(line) {
        const values = [];
        let current = '';
        let inQuotes = false;
        
        for (let i = 0; i < line.length; i++) {
            const char = line[i];
            
            if (char === '"') {
                inQuotes = !inQuotes;
            } else if (char === ',' && !inQuotes) {
                values.push(current);
                current = '';
            } else {
                current += char;
            }
        }
        
        values.push(current);
        return values.map(v => v.trim().replace(/^"|"$/g, ''));
    }
    
    // Quiz System - Now opens in separate window
    showQuizTypeSelection() {
        // Check if we have enough words for quizzes
        const validWords = this.vocabulary.filter(word => 
            word.definition && 
            word.definition.trim() !== '' && 
            word.definition !== 'Definition not found' && 
            word.definition !== 'Definition not available'
        );
        
        if (validWords.length < 4) {
            alert(`You need at least 4 words with valid definitions to start quizzes! You have ${validWords.length} valid words out of ${this.vocabulary.length} total words.`);
            return;
        }
        
        // Show quiz type selection modal
        this.quizTypeModal.classList.add('show');
    }
    
    closeQuizTypeModal() {
        this.quizTypeModal.classList.remove('show');
    }
    
    selectQuizType(event) {
        const selectedType = event.currentTarget.dataset.type;
        this.selectedQuizType = selectedType;
        
        // Close quiz type selection modal
        this.closeQuizTypeModal();
        
        // Prevent multiple quiz starts
        if (window.quizWindowOpen || this.quizWindowOpening) {
            console.log('Quiz window already open or opening, preventing duplicate start');
            return;
        }
        
        // Start quiz with selected type
        this.startQuiz();
    }
    
    async startQuiz() {
        // Check if we have enough words with valid definitions
        const validWords = this.vocabulary.filter(word => 
            word.definition && 
            word.definition.trim() !== '' && 
            word.definition !== 'Definition not found' && 
            word.definition !== 'Definition not available'
        );
        
        if (validWords.length < 4) {
            alert(`You need at least 4 words with valid definitions to start quizzes! You have ${validWords.length} valid words out of ${this.vocabulary.length} total words.`);
            return;
        }
        
        // Strong prevention of multiple quiz windows
        if (window.quizWindowOpen || this.quizWindowOpening) {
            console.log('Quiz window already open or opening, preventing duplicate');
            return;
        }
        
        // Set opening flag immediately
        this.quizWindowOpening = true;
        window.quizWindowOpen = true;
        
        // Check if quiz window is already open
        try {
            const windows = await chrome.windows.getAll({ windowTypes: ['popup'] });
            const existingQuizWindow = windows.find(window => 
                window.url && window.url.includes('quiz.html')
            );
            
            if (existingQuizWindow) {
                console.log('Quiz window already exists, focusing on it');
                chrome.windows.update(existingQuizWindow.id, { focused: true });
                // Reset flags
                this.quizWindowOpening = false;
                window.quizWindowOpen = false;
                return;
            }
        } catch (error) {
            console.error('Error checking existing windows:', error);
        }
        
        // Open quiz in new window
        const quizUrl = chrome.runtime.getURL('src/html/quiz.html') + `?type=${this.selectedQuizType}`;
        chrome.windows.create({
            url: quizUrl,
            type: 'popup',
            width: 800,
            height: 600,
            focused: true
        });
        
        console.log('Quiz opened in new window');
        
        // Reset opening flag after a delay
        setTimeout(() => {
            this.quizWindowOpening = false;
        }, 2000);
        
        // Listen for window removal
        const handleWindowRemoved = (windowId) => {
            window.quizWindowOpen = false;
            this.quizWindowOpening = false;
            chrome.windows.onRemoved.removeListener(handleWindowRemoved);
        };
        
        chrome.windows.onRemoved.addListener(handleWindowRemoved);
    }
    
    async startTodayVoca() {
        // Today Voca 창 열기
        const todayVocaUrl = chrome.runtime.getURL('src/html/today-voca.html');
        
        try {
            // Try to update current tab first (uses activeTab permission)
            const [currentTab] = await chrome.tabs.query({ active: true, currentWindow: true });
            if (currentTab) {
                await chrome.tabs.update(currentTab.id, { url: todayVocaUrl });
                console.log('Current tab updated to Today Voca');
            } else {
                // Fallback to creating new tab if current tab not found
                chrome.tabs.create({
                    url: todayVocaUrl,
                    active: true
                });
            }
        } catch (error) {
            console.error('Error in startTodayVoca:', error);
            // Fallback to creating new tab if update fails
            try {
                chrome.tabs.create({
                    url: todayVocaUrl,
                    active: true
                });
            } catch (fallbackError) {
                console.error('Fallback tab creation also failed:', fallbackError);
            }
        }
    }
    
    // Quiz questions are now generated in the separate quiz window
    
    // Quiz questions are now displayed in the separate quiz window
    
    // Quiz functionality is now handled in the separate quiz window
    
    async updateQuizStatistics(finalScore) {
        try {
            const result = await chrome.storage.local.get(['streakCount', 'bestStreak', 'todayReviewed', 'todayQuizzes', 'todayTotalScore', 'lastQuizDate']);
            
            let currentStreak = result.streakCount || 0;
            let bestStreak = result.bestStreak || 0;
            let todayReviewed = result.todayReviewed || 0;
            let todayQuizzes = result.todayQuizzes || 0;
            let todayTotalScore = result.todayTotalScore || 0;
            const lastQuizDate = result.lastQuizDate || null;
            
            // Update today's quiz count
            todayQuizzes++;
            todayTotalScore += finalScore;
            
            // Update streak
            const today = new Date().toDateString();
            if (lastQuizDate) {
                const lastDate = new Date(lastQuizDate).toDateString();
                if (lastDate === today) {
                    // Already took quiz today, no streak change
                } else {
                    const yesterday = new Date();
                    yesterday.setDate(yesterday.getDate() - 1);
                    const yesterdayString = yesterday.toDateString();
                    
                    if (lastDate === yesterdayString) {
                        // Consecutive day
                        currentStreak++;
                    } else {
                        // Streak broken
                        currentStreak = 1;
                    }
                }
            } else {
                // First time taking quiz
                currentStreak = 1;
            }
            
            // Update best streak
            if (currentStreak > bestStreak) {
                bestStreak = currentStreak;
            }
            
            // Save updated statistics
            await chrome.storage.local.set({
                streakCount: currentStreak,
                bestStreak: bestStreak,
                todayReviewed: todayReviewed,
                todayQuizzes: todayQuizzes,
                todayTotalScore: todayTotalScore,
                lastQuizDate: new Date().toISOString()
            });
            
            console.log('Quiz statistics updated:', { currentStreak, bestStreak, todayQuizzes, todayTotalScore });
        } catch (error) {
            console.error('Error updating quiz statistics:', error);
        }
    }
    
    async saveQuizResult() {
        try {
            const quizResult = {
                date: new Date().toISOString(),
                score: this.currentQuiz.score,
                correct: this.currentQuiz.correct,
                incorrect: this.currentQuiz.incorrect,
                totalQuestions: this.currentQuiz.questions.length,
                quizType: this.currentQuiz.type,
                questions: this.currentQuiz.questions.map(q => ({
                    word: q.word,
                    definition: q.definition,
                    correctIndex: q.correctIndex,
                    userAnswer: q.userAnswer || null
                }))
            };
            
            // Add to local quiz history
            this.quizHistory.push(quizResult);
            
            // Keep only last 50 quiz results
            if (this.quizHistory.length > 50) {
                this.quizHistory = this.quizHistory.slice(-50);
            }
            
            // Save to local storage
            await chrome.storage.local.set({ quizHistory: this.quizHistory });
            
            console.log('Quiz result saved locally');
        } catch (error) {
            console.error('Error saving quiz result:', error);
        }
    }
    
    async getUserId() {
        try {
            const result = await chrome.storage.local.get(['userId']);
            if (result.userId) {
                return result.userId;
            }
            
            // Generate new user ID
            const userId = 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
            await chrome.storage.local.set({ userId: userId });
            return userId;
        } catch (error) {
            console.error('Error getting user ID:', error);
            return 'anonymous_' + Date.now();
        }
    }
    
    getUserName() {
        // Return a simple user name for local tracking
        return 'Vocabulary Learner';
    }
    
    // Quiz modal is no longer used - quiz opens in separate window
    
    closeScoreModal() {
        this.scoreModal.classList.remove('show');
    }
    
    retryQuiz() {
        this.closeScoreModal();
        
        // Prevent multiple quiz starts
        if (window.quizWindowOpen || this.quizWindowOpening) {
            console.log('Quiz window already open or opening, preventing duplicate retry');
            return;
        }
        
        // Quiz now opens in separate window
        this.showQuizTypeSelection();
    }
    
    async shareScore() {
        try {
            const shareData = {
                title: 'Vocabulary Quiz Score',
                text: `I scored ${this.weeklyScore} points in the vocabulary quiz this week!`,
                url: window.location.href
            };
            
            if (navigator.share) {
                await navigator.share(shareData);
            } else {
                // Fallback: copy to clipboard
                const text = `${shareData.text}\n${shareData.url}`;
                await navigator.clipboard.writeText(text);
                this.showSuccess('Score copied to clipboard!');
            }
        } catch (error) {
            console.error('Error sharing score:', error);
            this.showError('Failed to share score');
        }
    }
    
    async showStatus() {
        this.statusModal.classList.add('show');
        
        try {
            // Load current streak data
            const result = await chrome.storage.local.get(['streakCount', 'bestStreak', 'todayReviewed', 'todayQuizzes', 'todayTotalScore']);
            
            const currentStreak = result.streakCount || 0;
            const bestStreak = result.bestStreak || 0;

            const todayQuizzes = result.todayQuizzes || 0;
            const todayTotalScore = result.todayTotalScore || 0;
            
            // Update status display
            if (this.currentStreakSpan) this.currentStreakSpan.textContent = currentStreak;
            if (this.bestStreakSpan) this.bestStreakSpan.textContent = bestStreak;

            if (this.todayQuizzesCountSpan) this.todayQuizzesCountSpan.textContent = todayQuizzes;
            if (this.todayTotalScoreSpan) this.todayTotalScoreSpan.textContent = todayTotalScore;
            
            console.log('Status displayed:', { currentStreak, bestStreak, todayQuizzes, todayTotalScore });
        } catch (error) {
            console.error('Error loading status:', error);
        }
    }
    
    closeStatusModal() {
        this.statusModal.classList.remove('show');
    }
    
    async showRelatedWords(word) {
        try {
            // Show loading state
            this.showWordModal(`Loading related words for "${word}"...`, 'loading');
            
            // Get related words from API
            const relatedWords = await this.getRelatedWords(word);
            
            if (relatedWords && relatedWords.length > 0) {
                const relatedWordsHTML = relatedWords.map(related => `
                    <div class="related-word-item">
                        <span class="related-word">${related.word}</span>
                        <span class="related-definition">${related.definition}</span>
                    </div>
                `).join('');
                
                this.showWordModal(`
                    <h3>Related Words for "${word}"</h3>
                    <div class="related-words-list">
                        ${relatedWordsHTML}
                    </div>
                    <div class="modal-actions">
                        <button class="btn btn-primary save-all-related-btn" data-words='${JSON.stringify(relatedWords)}'>
                            💾 Save All Related Words (${relatedWords.length})
                        </button>
                    </div>
                `, 'related');
            } else {
                this.showWordModal(`
                    <h3>Related Words for "${word}"</h3>
                    <p>No related words found.</p>
                `, 'related');
            }
        } catch (error) {
            console.error('Error showing related words:', error);
            this.showWordModal(`
                <h3>Error</h3>
                <p>Failed to load related words for "${word}".</p>
            `, 'error');
        }
    }
    
    async showOppositeWords(word) {
        try {
            // Show loading state
            this.showWordModal(`Loading opposite words for "${word}"...`, 'loading');
            
            // Get opposite words from API
            const oppositeWords = await this.getOppositeWords(word);
            
            if (oppositeWords && oppositeWords.length > 0) {
                const oppositeWordsHTML = oppositeWords.map(opposite => `
                    <div class="opposite-word-item">
                        <span class="opposite-word">${opposite.word}</span>
                        <span class="opposite-definition">${opposite.definition}</span>
                    </div>
                `).join('');
                
                this.showWordModal(`
                    <h3>Opposite Words for "${word}"</h3>
                    <div class="opposite-words-list">
                        ${oppositeWordsHTML}
                    </div>
                    <div class="modal-actions">
                        <button class="btn btn-primary save-all-opposite-btn" data-words='${JSON.stringify(oppositeWords)}'>
                            💾 Save All Opposite Words (${oppositeWords.length})
                        </button>
                    </div>
                `, 'opposite');
            } else {
                this.showWordModal(`
                    <h3>Opposite Words for "${word}"</h3>
                    <p>No opposite words found.</p>
                `, 'opposite');
            }
        } catch (error) {
            console.error('Error showing opposite words:', error);
            this.showWordModal(`
                <h3>Error</h3>
                <p>Failed to load opposite words for "${word}".</p>
            `, 'error');
        }
    }
    
    async getRelatedWords(word) {
        try {
            const response = await fetch(`https://api.datamuse.com/words?rel_syn=${word}&max=10`);
            const data = await response.json();
            
            if (data && data.length > 0) {
                // Get definitions for related words
                const relatedWordsWithDefinitions = await Promise.all(
                    data.slice(0, 5).map(async (item) => {
                        try {
                            const wordData = await this.getWordDefinition(item.word);
                            return {
                                word: item.word,
                                definition: wordData.definition || 'Definition not available'
                            };
                        } catch (error) {
                            return {
                                word: item.word,
                                definition: 'Definition not available'
                            };
                        }
                    })
                );
                
                // Filter out words that don't have valid definitions
                const validRelatedWords = relatedWordsWithDefinitions.filter(item => 
                    item.definition !== "Definition not found" && 
                    item.definition !== "Definition not available"
                );
                
                return validRelatedWords;
            }
            
            return [];
        } catch (error) {
            console.error('Error fetching related words:', error);
            return [];
        }
    }
    
    async getOppositeWords(word) {
        try {
            const response = await fetch(`https://api.datamuse.com/words?rel_ant=${word}&max=10`);
            const data = await response.json();
            
            if (data && data.length > 0) {
                // Get definitions for opposite words
                const oppositeWordsWithDefinitions = await Promise.all(
                    data.slice(0, 5).map(async (item) => {
                        try {
                            const wordData = await this.getWordDefinition(item.word);
                            return {
                                word: item.word,
                                definition: wordData.definition || 'Definition not available'
                            };
                        } catch (error) {
                            return {
                                word: item.word,
                                definition: 'Definition not available'
                            };
                        }
                    })
                );
                
                // Filter out words that don't have valid definitions
                const validOppositeWords = oppositeWordsWithDefinitions.filter(item => 
                    item.definition !== "Definition not found" && 
                    item.definition !== "Definition not available"
                );
                
                return validOppositeWords;
            }
            
            return [];
        } catch (error) {
            console.error('Error fetching opposite words:', error);
            return [];
        }
    }
    
    editDefinition(wordText) {
        // Find the word in vocabulary
        const word = this.vocabulary.find(w => w.word === wordText);
        if (!word) {
            console.error('Word not found:', wordText);
            return;
        }
        
        // Create edit definition modal content
        const content = `
            <div class="edit-definition-modal">
                <h3>Edit Definition for "${wordText}"</h3>
                <div class="definition-input-section">
                    <label for="definition-input">Definition:</label>
                    <textarea id="definition-input" rows="4" placeholder="Enter the definition...">${word.definition || ''}</textarea>
                </div>
                <div class="definition-actions">
                    <button class="btn btn-primary save-definition-btn">Save Definition</button>
                    <button class="btn btn-outline auto-fetch-btn">Auto Fetch Definition</button>
                    <button class="btn btn-outline search-word-btn">🔍 Search Word Online</button>
                    <button class="btn btn-outline cancel-btn">Cancel</button>
                </div>
            </div>
        `;
        
        // Show modal
        this.showWordModal(content, 'edit-definition');
        
        // Add event listeners for the modal
        const modal = document.querySelector('.word-modal');
        const saveBtn = modal.querySelector('.save-definition-btn');
        const autoFetchBtn = modal.querySelector('.auto-fetch-btn');
        const searchWordBtn = modal.querySelector('.search-word-btn');
        const cancelBtn = modal.querySelector('.cancel-btn');
        const definitionInput = modal.querySelector('#definition-input');
        
        // Save definition
        saveBtn.addEventListener('click', async () => {
            const newDefinition = definitionInput.value.trim();
            if (newDefinition) {
                await this.updateWordDefinition(wordText, newDefinition);
                modal.remove();
            } else {
                alert('Please enter a definition.');
            }
        });
        
        // Auto fetch definition
        autoFetchBtn.addEventListener('click', async () => {
            autoFetchBtn.textContent = 'Fetching...';
            autoFetchBtn.disabled = true;
            
            try {
                const definition = await this.getWordDefinition(wordText);
                if (definition && definition !== 'Definition not found' && definition !== 'Definition not available') {
                    definitionInput.value = definition;
                    this.showSuccess('Definition fetched successfully!');
                } else {
                    this.showError('Could not fetch definition automatically.');
                }
            } catch (error) {
                this.showError('Error fetching definition: ' + error.message);
            } finally {
                autoFetchBtn.textContent = 'Auto Fetch Definition';
                autoFetchBtn.disabled = false;
            }
        });
        
        // Search word online
        searchWordBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            e.preventDefault();
            e.stopImmediatePropagation();
            console.log('Search word button clicked in modal:', wordText, 'at:', new Date().toISOString());
            
            // Prevent duplicate execution with immediate flag check
            if (this.searchingWord) {
                console.log('Search already in progress, ignoring modal click');
                return;
            }
            
            // Add a longer delay to prevent duplicate execution
            setTimeout(() => {
                if (!this.searchingWord) {
                    this.searchWordOnline(wordText);
                }
            }, 50);
            modal.remove();
        });
        
        // Cancel
        cancelBtn.addEventListener('click', () => {
            modal.remove();
        });
        
        // Focus on textarea
        setTimeout(() => {
            definitionInput.focus();
        }, 100);
    }
    
    async updateWordDefinition(wordText, newDefinition) {
        try {
            const wordIndex = this.vocabulary.findIndex(w => w.word === wordText);
            if (wordIndex !== -1) {
                this.vocabulary[wordIndex].definition = newDefinition;
                await chrome.storage.local.set({ vocabulary: this.vocabulary });
                
                // Enhanced refresh after definition update
                await this.refreshVocabularyDisplay();
                
                this.showSuccess(`Definition updated for "${wordText}"`);
            }
        } catch (error) {
            console.error('Error updating definition:', error);
            this.showError('Failed to update definition');
        }
    }
    
    async toggleAllDefinitions() {
        try {
            // Toggle the global state
            this.allDefinitionsHidden = !this.allDefinitionsHidden;
            
            // If turning on Hide All Definitions, turn off Hide All Words
            if (this.allDefinitionsHidden) {
                this.allWordsHidden = false;
            }
            
            // Update button text
            if (this.toggleAllDefinitionsBtn) {
                this.toggleAllDefinitionsBtn.textContent = this.allDefinitionsHidden ? 
                    '👁️ Show All Definitions' : '🙈 Hide All Definitions';
            }
            
            // Update sidebar icon button text
            const toggleIconBtn = document.getElementById('toggle-all-definitions-icon');
            if (toggleIconBtn) {
                toggleIconBtn.textContent = this.allDefinitionsHidden ? '👁️' : '🙈';
                toggleIconBtn.title = this.allDefinitionsHidden ? 'Show All Definitions' : 'Hide All Definitions';
            }
            
            // Update Hide All Words button text
            const toggleWordsBtn = document.getElementById('toggle-all-words');
            if (toggleWordsBtn) {
                toggleWordsBtn.textContent = this.allWordsHidden ? '👁️ Show All Words' : '🙈 Hide All Words';
            }
            
            // Update Hide All Words icon button text
            const toggleWordsIconBtn = document.getElementById('toggle-all-words-icon');
            if (toggleWordsIconBtn) {
                toggleWordsIconBtn.textContent = this.allWordsHidden ? '👁️' : '🙈';
                toggleWordsIconBtn.title = this.allWordsHidden ? 'Show All Words' : 'Hide All Words';
            }
            
            // Enhanced refresh to apply changes
            await this.refreshVocabularyDisplay();
            
            // Save state to storage
            await chrome.storage.local.set({ 
                allDefinitionsHidden: this.allDefinitionsHidden,
                allWordsHidden: this.allWordsHidden 
            });
            
            const action = this.allDefinitionsHidden ? 'hidden' : 'shown';
            this.showSuccess(`All definitions ${action}`);
            
        } catch (error) {
            console.error('Error toggling all definitions:', error);
            this.showError('Failed to toggle all definitions');
        }
    }
    
    showWordModal(content, type = 'default') {
        // Remove existing modal
        const existingModal = document.querySelector('.word-modal');
        if (existingModal) {
            existingModal.remove();
        }
        
        // Create modal
        const modal = document.createElement('div');
        modal.className = `word-modal word-modal-${type}`;
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <button class="modal-close">×</button>
                </div>
                <div class="modal-body">
                    ${content}
                </div>
            </div>
        `;
        
        // Add event listeners
        const closeBtn = modal.querySelector('.modal-close');
        closeBtn.addEventListener('click', () => modal.remove());
        
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.remove();
            }
        });
        
        // Add save buttons event listeners
        const saveRelatedBtn = modal.querySelector('.save-all-related-btn');
        if (saveRelatedBtn) {
            saveRelatedBtn.addEventListener('click', () => {
                const wordsData = JSON.parse(saveRelatedBtn.dataset.words);
                this.saveAllWordsFromModal(wordsData, 'related');
            });
        }
        
        const saveOppositeBtn = modal.querySelector('.save-all-opposite-btn');
        if (saveOppositeBtn) {
            saveOppositeBtn.addEventListener('click', () => {
                const wordsData = JSON.parse(saveOppositeBtn.dataset.words);
                this.saveAllWordsFromModal(wordsData, 'opposite');
            });
        }
        
        // Add archived words event listeners
        if (type === 'archived') {
            // Individual restore buttons
            const restoreButtons = modal.querySelectorAll('.restore-btn');
            restoreButtons.forEach(button => {
                button.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const word = button.dataset.word;
                    this.restoreArchivedWord(word);
                });
            });
            
            // Individual delete buttons
            const deleteButtons = modal.querySelectorAll('.delete-archived-btn');
            deleteButtons.forEach(button => {
                button.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const word = button.dataset.word;
                    this.deleteArchivedWord(word);
                });
            });
            
            // Restore all button
            const restoreAllBtn = modal.querySelector('.restore-all-btn');
            if (restoreAllBtn) {
                restoreAllBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    this.restoreAllArchivedWords();
                });
            }
            
            // Delete all button
            const deleteAllBtn = modal.querySelector('.delete-all-archived-btn');
            if (deleteAllBtn) {
                deleteAllBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    this.deleteAllArchivedWords();
                });
            }
        }
        
        // Add to page
        document.body.appendChild(modal);
        
        // Add animation
        setTimeout(() => modal.classList.add('show'), 10);
    }
    
    async saveAllWordsFromModal(wordsData, type) {
        try {
            let savedCount = 0;
            let skippedCount = 0;
            
            // Show loading state
            const modal = document.querySelector('.word-modal');
            const modalBody = modal.querySelector('.modal-body');
            const originalContent = modalBody.innerHTML;
            
            modalBody.innerHTML = `
                <div class="loading-save">
                    <h3>Saving words...</h3>
                    <div class="loading-spinner"></div>
                    <p>Please wait while we save the words to your vocabulary.</p>
                </div>
            `;
            
            // Save each word
            for (const wordData of wordsData) {
                const wasAdded = await this.addWordWithDefinition(wordData.word);
                if (wasAdded) {
                    savedCount++;
                } else {
                    skippedCount++;
                }
            }
            
            // Show success message
            modalBody.innerHTML = `
                <div class="save-success">
                    <h3>✅ Words Saved Successfully!</h3>
                    <div class="save-stats">
                        <p><strong>${savedCount}</strong> new words added</p>
                        <p><strong>${skippedCount}</strong> words already existed</p>
                    </div>
                    <button class="btn btn-primary close-modal-btn">Close</button>
                </div>
            `;
            
            // Add close button event listener
            const closeBtn = modalBody.querySelector('.close-modal-btn');
            closeBtn.addEventListener('click', () => {
                modal.remove();
                this.loadVocabulary(); // Refresh the vocabulary board
            });
            
        } catch (error) {
            console.error('Error saving words from modal:', error);
            
            // Show error message
            const modal = document.querySelector('.word-modal');
            const modalBody = modal.querySelector('.modal-body');
            modalBody.innerHTML = `
                <div class="save-error">
                    <h3>❌ Error Saving Words</h3>
                    <p>An error occurred while saving the words. Please try again.</p>
                    <button class="btn btn-primary close-modal-btn">Close</button>
                </div>
            `;
            
            const closeBtn = modalBody.querySelector('.close-modal-btn');
            closeBtn.addEventListener('click', () => modal.remove());
        }
    }


    
    applyDarkMode() {
        if (this.darkMode) {
            document.body.classList.add('dark-mode');
        } else {
            document.body.classList.remove('dark-mode');
        }
    }
    
    applyAnimations() {
        if (!this.animationsEnabled) {
            document.body.classList.add('animations-disabled');
        } else {
            document.body.classList.remove('animations-disabled');
        }
    }
    
    startTimeUpdate() {
        const updateTime = () => {
            const now = new Date();
            
            // Update time
            const timeString = now.toLocaleTimeString('en-US', {
                hour12: false,
                hour: '2-digit',
                minute: '2-digit'
            });
            
            // Update date
            const dateString = now.toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
            
            if (this.currentTimeSpan) {
                this.currentTimeSpan.textContent = timeString;
            }
            if (this.currentDateSpan) {
                this.currentDateSpan.textContent = dateString;
            }
        };
        
        // Update immediately
        updateTime();
        
        // Update every minute
        setInterval(updateTime, 60000);
    }
    
    handleUrlSearch(event) {
        event.preventDefault();
        
        const query = this.urlSearchInput.value.trim();
        if (!query) return;
        
        let url;
        
        // Check if it's a valid URL
        if (query.includes('.') && !query.includes(' ') && 
            (query.startsWith('http://') || query.startsWith('https://') || 
             query.startsWith('www.') || !query.startsWith('http'))) {
            
            // It looks like a URL
            if (query.startsWith('http://') || query.startsWith('https://')) {
                url = query;
            } else if (query.startsWith('www.')) {
                url = 'https://' + query;
            } else {
                url = 'https://www.' + query;
            }
        } else {
            // It's a search query
            url = 'https://www.google.com/search?q=' + encodeURIComponent(query);
        }
        
        // Open in new tab
        chrome.tabs.create({ url: url });
        
        // Clear the input
        this.urlSearchInput.value = '';
    }
    
    showSuccess(message) {
        // Create success notification
        const notification = document.createElement('div');
        notification.className = 'success-notification';
        notification.textContent = message;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #28a745;
            color: white;
            padding: 12px 20px;
            border-radius: 8px;
            z-index: 10000;
            font-size: 14px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            animation: slideInRight 0.3s ease-out;
        `;
        
        document.body.appendChild(notification);
        
        // Remove after 3 seconds
        setTimeout(() => {
            notification.style.animation = 'slideOutRight 0.3s ease-in';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, 3000);
    }
    
    showError(message) {
        // Create error notification
        const notification = document.createElement('div');
        notification.className = 'error-notification';
        notification.textContent = message;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #dc3545;
            color: white;
            padding: 12px 20px;
            border-radius: 8px;
            z-index: 10000;
            font-size: 14px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            animation: slideInRight 0.3s ease-out;
        `;
        
        document.body.appendChild(notification);
        
        // Remove after 4 seconds
        setTimeout(() => {
            notification.style.animation = 'slideOutRight 0.3s ease-in';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, 4000);
    }

    showWordSaveIndicator(selectedText) {
        // Don't show indicator for very short text
        if (selectedText.length < 2) {
            return;
        }
        
        // Clean the selected text
        const cleanText = selectedText.trim().replace(/\s+/g, ' ');
        if (cleanText.length < 2) {
            return;
        }
        
        // Check if word already exists in vocabulary
        const existingWord = this.vocabulary.find(word => word.word.toLowerCase() === cleanText.toLowerCase());
        if (existingWord) {
            return;
        }

        let displayText = cleanText;
        if (cleanText.length > 30) {
            displayText = cleanText.slice(0, 27) + '...';
        }

        let indicator = document.getElementById('word-save-indicator');
        if (!indicator) {
            indicator = document.createElement('div');
            indicator.id = 'word-save-indicator';
            indicator.style.cssText = `
                position: fixed;
                background: #28a745;
                color: white;
                padding: 8px 16px;
                border-radius: 8px;
                cursor: pointer;
                z-index: 10000;
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                font-size: 14px;
                font-weight: bold;
                box-shadow: 0 4px 12px rgba(0,0,0,0.25);
                border: 2px solid #1e7e34;
                min-width: 140px;
                max-width: 300px;
                text-align: center;
                bottom: 32px;
                right: 32px;
                opacity: 0.95;
                transition: all 0.2s ease;
                pointer-events: auto;
                user-select: none;
            `;
            
            indicator.addEventListener('click', (e) => {
                e.stopPropagation();
                this.saveSelectedWord(cleanText);
            });
            
            document.body.appendChild(indicator);
        }

        indicator.innerHTML = `💾 Click to save "${displayText}"`;
        indicator.style.display = 'block';
        indicator.style.opacity = '1';
    }

    hideWordSaveIndicator() {
        const indicator = document.getElementById('word-save-indicator');
        if (indicator) {
            indicator.style.opacity = '0';
            setTimeout(() => {
                if (indicator.parentNode) {
                    indicator.parentNode.removeChild(indicator);
                }
            }, 200);
        }
    }

    async saveSelectedWord(word) {
        try {
            // Clean the word
            const cleanWord = word.trim().replace(/\s+/g, ' ');
            if (cleanWord.length < 2) {
                this.showError('Please select a valid word');
                return;
            }
            
            // Check if it's a valid word using the same validation as content script
            if (!this.isValidWord(cleanWord)) {
                this.showError(`"${cleanWord}" is not a valid word`);
                this.hideWordSaveIndicator();
                return;
            }
            
            // Check if word already exists
            const existingWord = this.vocabulary.find(w => w.word.toLowerCase() === cleanWord.toLowerCase());
            if (existingWord) {
                this.showSuccess(`"${cleanWord}" is already in your vocabulary!`);
                this.hideWordSaveIndicator();
                return;
            }
            
            // Add word and get definition
            const wasAdded = await this.addWordWithDefinition(cleanWord);
            
            if (wasAdded) {
                this.hideWordSaveIndicator();
                this.showSuccess(`"${cleanWord}" added to vocabulary!`);
                
                // Delayed refresh to ensure API calls are complete
                setTimeout(async () => {
                    await this.loadVocabulary();
                    this.updateStats();
                    this.updateProgress();
                    this.renderWordsGrid();
                }, 1000);
            } else {
                this.showError('Failed to add word');
            }
            
        } catch (error) {
            console.error('Error saving word:', error);
            this.showError('Failed to save word');
        }
    }

    // Enhanced refresh method for vocabulary display
    async refreshVocabularyDisplay() {
        try {
            // Reload vocabulary from storage
            await this.loadVocabulary();
            
            // Update all related displays
            this.updateStats();
            this.updateProgress();
            
            // Force re-render with current settings
            this.renderWordsGrid();
            
            // Update weekly score display
            this.updateWeeklyScoreDisplay();
        } catch (error) {
            console.error('Error refreshing vocabulary display:', error);
        }
    }

    // Add the same word validation function as in content.js
    isValidWord(text) {
        if (!text || text.length === 0) return false;
        
        // Check for any whitespace (space, tab, newline, etc.)
        if (/\s/.test(text)) return false;
        
        // Check for any digits
        if (/\d/.test(text)) return false;
        
        // Check for any special characters (except hyphen and apostrophe for English words)
        if (/[^a-zA-Z\-']/.test(text)) return false;
        
        // Length check
        if (text.length < 2 || text.length > 20) return false;
        
        // Check for sensitive information patterns
        const sensitivePatterns = [
            /password/i,
            /passwd/i,
            /pwd/i,
            /secret/i,
            /private/i,
            /confidential/i,
            /token/i,
            /key/i,
            /api[_-]?key/i,
            /auth[_-]?token/i,
            /session[_-]?id/i,
            /cookie/i,
            /credit[_-]?card/i,
            /card[_-]?number/i,
            /ssn/i,
            /social[_-]?security/i,
            /phone[_-]?number/i,
            /email[_-]?address/i,
            /address/i,
            /zip[_-]?code/i,
            /postal[_-]?code/i,
            /bank[_-]?account/i,
            /account[_-]?number/i,
            /routing[_-]?number/i,
            /swift[_-]?code/i,
            /iban/i,
            /pin/i,
            /cvv/i,
            /cvc/i,
            /expiry/i,
            /expiration/i
        ];
        
        // Check if text contains sensitive patterns
        for (const pattern of sensitivePatterns) {
            if (pattern.test(text)) {
                return false;
            }
        }
        
        // Final check: must be pure English word (letters, hyphens, apostrophes only)
        if (!/^[a-zA-Z\-']+$/.test(text)) {
            return false;
        }
        
        return true;
    }

    async searchWordOnline(word) {
        // Strong prevention of duplicate execution
        if (this.searchingWord) {
            console.log('Search already in progress, preventing duplicate for:', word);
            return;
        }
        
        // Additional check for recent searches
        const now = Date.now();
        if (this.lastSearchTime && (now - this.lastSearchTime) < 2000) {
            console.log('Search too recent, preventing duplicate for:', word);
            return;
        }
        
        this.searchingWord = true;
        this.lastSearchTime = now;
        console.log('Searching word online:', word, 'at:', new Date().toISOString());
        
        const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(word + ' definition')}`;
        
        try {
            // Try to update current tab first (uses activeTab permission)
            const [currentTab] = await chrome.tabs.query({ active: true, currentWindow: true });
            if (currentTab) {
                await chrome.tabs.update(currentTab.id, { url: searchUrl });
                console.log('Current tab updated successfully');
            } else {
                // Fallback to creating new tab if current tab not found
                chrome.tabs.create({ url: searchUrl }, (tab) => {
                    if (chrome.runtime.lastError) {
                        console.error('Error creating tab:', chrome.runtime.lastError);
                    } else {
                        console.log('Tab created successfully:', tab.id);
                    }
                });
            }
        } catch (error) {
            console.error('Error in searchWordOnline:', error);
            // Fallback to creating new tab if update fails
            try {
                chrome.tabs.create({ url: searchUrl });
            } catch (fallbackError) {
                console.error('Fallback tab creation also failed:', fallbackError);
            }
        }
        
        // Reset flag after a longer delay
        setTimeout(() => {
            this.searchingWord = false;
            console.log('Search flag reset for:', word);
        }, 3000);
    }
    
    addDirectEventListeners() {
        // Remove existing event listeners first
        const existingButtons = this.wordsGrid.querySelectorAll('.delete-btn, .edit-definition-btn, .search-word-btn, .related-btn, .opposite-btn, .pin-btn');
        existingButtons.forEach(button => {
            button.replaceWith(button.cloneNode(true));
        });
        
        // Add new event listeners for board view
        const deleteButtons = this.wordsGrid.querySelectorAll('.delete-btn');
        const editButtons = this.wordsGrid.querySelectorAll('.edit-definition-btn');
        const searchButtons = this.wordsGrid.querySelectorAll('.search-word-btn');
        const relatedButtons = this.wordsGrid.querySelectorAll('.related-btn');
        const oppositeButtons = this.wordsGrid.querySelectorAll('.opposite-btn');
        const pinButtons = this.wordsGrid.querySelectorAll('.pin-btn');
        const archiveButtons = this.wordsGrid.querySelectorAll('.archive-btn');
        const wordCards = this.wordsGrid.querySelectorAll('.word-card');
        
        // Delete buttons
        deleteButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                e.stopPropagation();
                e.preventDefault();
                const wordCard = button.closest('.word-card');
                const word = wordCard.dataset.word;
                console.log('Delete button clicked directly:', word);
                this.deleteWord(word);
            });
        });
        
        // Edit definition buttons
        editButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                e.stopPropagation();
                e.preventDefault();
                const wordCard = button.closest('.word-card');
                const word = wordCard.dataset.word;
                console.log('Edit definition button clicked directly:', word);
                this.editDefinition(word);
            });
        });
        
        // Search word buttons
        searchButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                e.stopPropagation();
                e.preventDefault();
                e.stopImmediatePropagation();
                const wordCard = button.closest('.word-card');
                const word = wordCard.dataset.word;
                console.log('Search word button clicked directly:', word, 'at:', new Date().toISOString());
                
                // Prevent duplicate execution
                if (this.searchingWord) {
                    console.log('Search already in progress, ignoring direct click');
                    return;
                }
                
                // Immediate execution without delay
                this.searchWordOnline(word);
            });
        });
        
        // Related words buttons
        relatedButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                e.stopPropagation();
                e.preventDefault();
                const wordCard = button.closest('.word-card');
                const word = wordCard.dataset.word;
                console.log('Related words button clicked directly:', word);
                this.showRelatedWords(word);
            });
        });
        
        // Opposite words buttons
        oppositeButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                e.stopPropagation();
                e.preventDefault();
                const wordCard = button.closest('.word-card');
                const word = wordCard.dataset.word;
                console.log('Opposite words button clicked directly:', word);
                this.showOppositeWords(word);
            });
        });
        
        // Pin buttons
        pinButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                e.stopPropagation();
                e.preventDefault();
                const wordCard = button.closest('.word-card');
                const word = wordCard.dataset.word;
                console.log('Pin button clicked directly:', word);
                this.togglePin(word);
            });
        });
        
        // Archive buttons
        archiveButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                e.stopPropagation();
                e.preventDefault();
                const wordCard = button.closest('.word-card');
                const word = wordCard.dataset.word;
                console.log('Archive button clicked directly:', word);
                this.archiveWord(word);
            });
        });
        
        // Word card clicks for toggling definitions/words
        wordCards.forEach(card => {
            card.addEventListener('click', (e) => {
                // Don't trigger if clicking on buttons or actions
                if (e.target.closest('.word-actions') || e.target.closest('.delete-btn') || e.target.closest('.pin-btn')) {
                    return;
                }
                
                // Check if card click toggle is enabled
                if (!this.cardClickToggleEnabled) {
                    console.log('Card click toggle disabled, ignoring click');
                    return;
                }
                
                // Debounce card clicks to prevent rapid toggling
                const currentTime = Date.now();
                if (currentTime - this.lastCardClickTime < this.cardClickDebounceDelay) {
                    console.log('Card click debounced, ignoring rapid click');
                    return;
                }
                this.lastCardClickTime = currentTime;
                
                const word = card.dataset.word;
                console.log('Card clicked directly:', word);
                
                // Toggle visibility based on current state
                const definition = card.querySelector('.definition');
                const wordText = card.querySelector('.word-text');
                const wordActions = card.querySelector('.word-actions');
                const wordMeta = card.querySelector('.word-meta');
                
                if (definition && wordText) {
                    const isDefinitionVisible = !definition.classList.contains('hidden');
                    const isWordVisible = !wordText.classList.contains('hidden');
                    
                    if (this.allWordsHidden) {
                        // Hide All Words mode: definition is visible, word is hidden
                        if (isDefinitionVisible && !isWordVisible) {
                            // Show both word and definition
                            wordText.classList.remove('hidden');
                            if (wordActions) wordActions.classList.remove('hidden');
                            if (wordMeta) wordMeta.classList.remove('hidden');
                        } else if (isDefinitionVisible && isWordVisible) {
                            // Hide word, show only definition
                            wordText.classList.add('hidden');
                            if (wordActions) wordActions.classList.add('hidden');
                            if (wordMeta) wordMeta.classList.add('hidden');
                            definition.classList.remove('hidden'); // Ensure definition stays visible
                        }
                    } else if (this.allDefinitionsHidden) {
                        // Hide All Definitions mode: word is visible, definition is hidden
                        if (isWordVisible && !isDefinitionVisible) {
                            // Show both word and definition
                            definition.classList.remove('hidden');
                            if (wordActions) wordActions.classList.remove('hidden');
                            if (wordMeta) wordMeta.classList.remove('hidden');
                        } else if (isWordVisible && isDefinitionVisible) {
                            // Hide definition, show only word
                            definition.classList.add('hidden');
                            if (wordActions) wordActions.classList.add('hidden');
                            if (wordMeta) wordMeta.classList.add('hidden');
                        }
                    } else {
                        // Normal mode: both are visible
                        if (isWordVisible && isDefinitionVisible) {
                            // Hide definition, show only word
                            definition.classList.add('hidden');
                            if (wordActions) wordActions.classList.add('hidden');
                            if (wordMeta) wordMeta.classList.add('hidden');
                        } else {
                            // Show both word and definition
                            definition.classList.remove('hidden');
                            wordText.classList.remove('hidden');
                            if (wordActions) wordActions.classList.remove('hidden');
                            if (wordMeta) wordMeta.classList.remove('hidden');
                        }
                    }
                }
            });
        });
        
        // Add event listeners for example editing (table view only)
        const exampleElements = document.querySelectorAll('.example');
        exampleElements.forEach(example => {
            example.addEventListener('click', (e) => {
                e.stopPropagation();
                e.preventDefault();
                const word = example.dataset.word;
                if (word) {
                    console.log('Example clicked directly:', word);
                    this.editExample(word);
                }
            });
        });
        
        // Add event listeners for table view
        const tableDeleteButtons = this.wordsTable.querySelectorAll('.delete-btn');
        const tableEditButtons = this.wordsTable.querySelectorAll('.edit-definition-btn');
        const tableSearchButtons = this.wordsTable.querySelectorAll('.search-word-btn');
        const tableRelatedButtons = this.wordsTable.querySelectorAll('.related-btn');
        const tableOppositeButtons = this.wordsTable.querySelectorAll('.opposite-btn');
        const tablePinButtons = this.wordsTable.querySelectorAll('.pin-btn');
        const tableArchiveButtons = this.wordsTable.querySelectorAll('.archive-btn');
        const tableRows = this.wordsTable.querySelectorAll('.table-row');
        
        // Table delete buttons
        tableDeleteButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                e.stopPropagation();
                e.preventDefault();
                const word = button.dataset.word;
                console.log('Table delete button clicked directly:', word);
                this.deleteWord(word);
            });
        });
        
        // Table edit buttons
        tableEditButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                e.stopPropagation();
                e.preventDefault();
                const word = button.dataset.word;
                console.log('Table edit button clicked directly:', word);
                this.editDefinition(word);
            });
        });
        
        // Table search buttons
        tableSearchButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                e.stopPropagation();
                e.preventDefault();
                const word = button.dataset.word;
                console.log('Table search button clicked directly:', word);
                this.searchWordOnline(word);
            });
        });
        
        // Table related buttons
        tableRelatedButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                e.stopPropagation();
                e.preventDefault();
                const word = button.dataset.word;
                console.log('Table related button clicked directly:', word);
                this.showRelatedWords(word);
            });
        });
        
        // Table opposite buttons
        tableOppositeButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                e.stopPropagation();
                e.preventDefault();
                const word = button.dataset.word;
                console.log('Table opposite button clicked directly:', word);
                this.showOppositeWords(word);
            });
        });
        
        // Table pin buttons
        tablePinButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                e.stopPropagation();
                e.preventDefault();
                const word = button.dataset.word;
                console.log('Table pin button clicked directly:', word);
                this.togglePin(word);
            });
        });
        
        // Table archive buttons
        tableArchiveButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                e.stopPropagation();
                e.preventDefault();
                const word = button.dataset.word;
                console.log('Table archive button clicked directly:', word);
                this.archiveWord(word);
            });
        });
        
        // Table row clicks
        tableRows.forEach(row => {
            row.addEventListener('click', (e) => {
                // Don't trigger if clicking on buttons
                if (e.target.closest('button')) {
                    return;
                }
                
                // Check if card click toggle is enabled
                if (!this.cardClickToggleEnabled) {
                    console.log('Card click toggle disabled, ignoring table row click');
                    return;
                }
                
                // Debounce table row clicks to prevent rapid toggling
                const currentTime = Date.now();
                if (currentTime - this.lastCardClickTime < this.cardClickDebounceDelay) {
                    console.log('Table row click debounced, ignoring rapid click');
                    return;
                }
                this.lastCardClickTime = currentTime;
                
                const word = row.dataset.word;
                console.log('Table row clicked directly:', word);
                
                // Toggle visibility based on current state
                const definition = row.querySelector('.definition');
                const wordText = row.querySelector('.word-text');
                const wordActions = row.querySelector('.word-actions');
                const wordMeta = row.querySelector('.word-meta');
                
                if (definition && wordText) {
                    const isDefinitionVisible = !definition.classList.contains('hidden');
                    const isWordVisible = !wordText.classList.contains('hidden');
                    
                    if (this.allWordsHidden) {
                        // Hide All Words mode: definition is visible, word is hidden
                        if (isDefinitionVisible && !isWordVisible) {
                            // Show both word and definition
                            wordText.classList.remove('hidden');
                            if (wordActions) wordActions.classList.remove('hidden');
                            if (wordMeta) wordMeta.classList.remove('hidden');
                        } else if (isDefinitionVisible && isWordVisible) {
                            // Hide word, show only definition
                            wordText.classList.add('hidden');
                            if (wordActions) wordActions.classList.add('hidden');
                            if (wordMeta) wordMeta.classList.add('hidden');
                            definition.classList.remove('hidden'); // Ensure definition stays visible
                        }
                    } else if (this.allDefinitionsHidden) {
                        // Hide All Definitions mode: word is visible, definition is hidden
                        if (isWordVisible && !isDefinitionVisible) {
                            // Show both word and definition
                            definition.classList.remove('hidden');
                            if (wordActions) wordActions.classList.remove('hidden');
                            if (wordMeta) wordMeta.classList.remove('hidden');
                        } else if (isWordVisible && isDefinitionVisible) {
                            // Hide definition, show only word
                            definition.classList.add('hidden');
                            if (wordActions) wordActions.classList.add('hidden');
                            if (wordMeta) wordMeta.classList.add('hidden');
                        }
                    } else {
                        // Normal mode: both are visible
                        if (isWordVisible && isDefinitionVisible) {
                            // Hide definition, show only word
                            definition.classList.add('hidden');
                            if (wordActions) wordActions.classList.add('hidden');
                            if (wordMeta) wordMeta.classList.add('hidden');
                        } else {
                            // Show both word and definition
                            definition.classList.remove('hidden');
                            wordText.classList.remove('hidden');
                            if (wordActions) wordActions.classList.remove('hidden');
                            if (wordMeta) wordMeta.classList.remove('hidden');
                        }
                    }
                }
            });
        });
    }
    
    // New methods for view switching and pin functionality
    switchView(view) {
        this.currentView = view;
        
        // Update button states
        this.boardViewBtn.classList.toggle('active', view === 'board');
        this.tableViewBtn.classList.toggle('active', view === 'table');
        
        // Show/hide containers
        this.wordsGrid.classList.toggle('active', view === 'board');
        this.wordsTable.classList.toggle('active', view === 'table');
        
        // Re-render content only if vocabulary is loaded
        if (this.vocabulary && this.vocabulary.length > 0) {
            this.renderWordsGrid();
        }
        
        // Save view preference
        chrome.storage.local.set({ currentView: view });
    }
    
    async toggleAllWords() {
        try {
            // Toggle the global state
            this.allWordsHidden = !this.allWordsHidden;
            
            // If turning on Hide All Words, turn off Hide All Definitions
            if (this.allWordsHidden) {
                this.allDefinitionsHidden = false;
            }
            
            // Update button text
            if (this.toggleAllWordsBtn) {
                this.toggleAllWordsBtn.textContent = this.allWordsHidden ? 
                    '👁️ Show All Words' : '🙈 Hide All Words';
            }
            
            // Update sidebar icon button text
            const toggleIconBtn = document.getElementById('toggle-all-words-icon');
            if (toggleIconBtn) {
                toggleIconBtn.textContent = this.allWordsHidden ? '👁️' : '🙈';
                toggleIconBtn.title = this.allWordsHidden ? 'Show All Words' : 'Hide All Words';
            }
            
            // Update Hide All Definitions button text
            const toggleDefinitionsBtn = document.getElementById('toggle-all-definitions');
            if (toggleDefinitionsBtn) {
                toggleDefinitionsBtn.textContent = this.allDefinitionsHidden ? 
                    '👁️ Show All Definitions' : '🙈 Hide All Definitions';
            }
            
            // Update Hide All Definitions icon button text
            const toggleDefinitionsIconBtn = document.getElementById('toggle-all-definitions-icon');
            if (toggleDefinitionsIconBtn) {
                toggleDefinitionsIconBtn.textContent = this.allDefinitionsHidden ? '👁️' : '🙈';
                toggleDefinitionsIconBtn.title = this.allDefinitionsHidden ? 'Show All Definitions' : 'Hide All Definitions';
            }
            
            // Enhanced refresh to apply changes
            await this.refreshVocabularyDisplay();
            
            // Save state to storage
            await chrome.storage.local.set({ 
                allWordsHidden: this.allWordsHidden,
                allDefinitionsHidden: this.allDefinitionsHidden 
            });
            
            const action = this.allWordsHidden ? 'hidden' : 'shown';
            this.showSuccess(`All words ${action}`);
            
        } catch (error) {
            console.error('Error toggling all words:', error);
            this.showError('Failed to toggle all words');
        }
    }
    
    async togglePin(wordText) {
        const wordIndex = this.vocabulary.findIndex(w => w.word === wordText);
        if (wordIndex !== -1) {
            this.vocabulary[wordIndex].pinned = !this.vocabulary[wordIndex].pinned;
            await chrome.storage.local.set({ vocabulary: this.vocabulary });
            
            // Enhanced refresh after pin toggle
            await this.refreshVocabularyDisplay();
        }
    }
    
    async pinAllWords() {
        this.vocabulary.forEach(word => {
            word.pinned = true;
        });
        await chrome.storage.local.set({ vocabulary: this.vocabulary });
        
        // Enhanced refresh after pin all
        await this.refreshVocabularyDisplay();
        this.showSuccess('All words pinned! 📌');
    }
    
    async unpinAllWords() {
        this.vocabulary.forEach(word => {
            word.pinned = false;
        });
        await chrome.storage.local.set({ vocabulary: this.vocabulary });
        
        // Enhanced refresh after unpin all
        await this.refreshVocabularyDisplay();
        this.showSuccess('All words unpinned! 📍');
    }
    
    async archiveWord(wordText) {
        try {
            const wordIndex = this.vocabulary.findIndex(w => w.word === wordText);
            if (wordIndex !== -1) {
                const word = this.vocabulary[wordIndex];
                const archivedWord = {
                    ...word,
                    archivedAt: new Date().toISOString()
                };
                
                // 보관된 단어 목록에 추가
                const { archivedWords = [] } = await chrome.storage.local.get('archivedWords');
                archivedWords.push(archivedWord);
                await chrome.storage.local.set({ archivedWords });
                
                // 현재 단어 목록에서 제거
                this.vocabulary.splice(wordIndex, 1);
                await chrome.storage.local.set({ vocabulary: this.vocabulary });
                
                // Enhanced refresh after archiving
                await this.refreshVocabularyDisplay();
                
                this.showSuccess(`"${wordText}" archived successfully`);
            }
        } catch (error) {
            console.error('Error archiving word:', error);
            this.showError('Failed to archive word');
        }
    }
    
    async showArchivedWords() {
        try {
            const { archivedWords = [] } = await chrome.storage.local.get('archivedWords');
            
            if (archivedWords.length === 0) {
                this.showError('No archived words found');
                return;
            }
            
            const content = `
                <div class="archived-words-modal">
                    <h3>📦 Archived Words (${archivedWords.length})</h3>
                    <div class="archived-words-list">
                        ${archivedWords.map(word => `
                            <div class="archived-word-item">
                                <div class="archived-word-header">
                                    <strong>${word.word}</strong>
                                    <button class="restore-btn" data-word="${word.word}">🔄 Restore</button>
                                    <button class="delete-archived-btn" data-word="${word.word}">🗑️ Delete</button>
                                </div>
                                <div class="archived-word-definition">${word.definition}</div>
                                <div class="archived-word-meta">
                                    <span>Archived: ${new Date(word.archivedAt).toLocaleDateString()}</span>
                                    <span>Added: ${new Date(word.dateAdded).toLocaleDateString()}</span>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                    <div class="archived-words-actions">
                        <button class="restore-all-btn">🔄 Restore All</button>
                        <button class="delete-all-archived-btn">🗑️ Delete All</button>
                    </div>
                </div>
            `;
            
            this.showWordModal(content, 'archived');
        } catch (error) {
            console.error('Error showing archived words:', error);
            this.showError('Failed to load archived words');
        }
    }
    
    async restoreArchivedWord(wordText) {
        try {
            console.log('Restoring archived word:', wordText);
            
            // Get current archived words
            const { archivedWords = [] } = await chrome.storage.local.get('archivedWords');
            const { vocabulary = [] } = await chrome.storage.local.get('vocabulary');
            
            // Find the word in archived words
            const archivedWordIndex = archivedWords.findIndex(w => w.word === wordText);
            if (archivedWordIndex === -1) {
                this.showError('Word not found in archived words');
                return;
            }
            
            const archivedWord = archivedWords[archivedWordIndex];
            
            // Check if word already exists in vocabulary
            const existingWord = vocabulary.find(w => w.word.toLowerCase() === wordText.toLowerCase());
            if (existingWord) {
                this.showError(`"${wordText}" already exists in vocabulary`);
                return;
            }
            
            // Remove from archived words
            archivedWords.splice(archivedWordIndex, 1);
            
            // Add back to vocabulary (remove archivedAt property)
            const { archivedAt, ...wordToRestore } = archivedWord;
            vocabulary.push(wordToRestore);
            
            // Save both arrays
            await chrome.storage.local.set({ 
                archivedWords: archivedWords,
                vocabulary: vocabulary 
            });
            
            // Update local state
            this.vocabulary = vocabulary;
            
            // Show success message
            this.showSuccess(`"${wordText}" restored successfully`);
            
            // Close modal and refresh
            const modal = document.querySelector('.word-modal');
            if (modal) {
                modal.remove();
            }
            
            // Enhanced refresh after restoration
            await this.refreshVocabularyDisplay();
            
        } catch (error) {
            console.error('Error restoring archived word:', error);
            this.showError('Failed to restore word');
        }
    }
    
    async deleteArchivedWord(wordText) {
        try {
            console.log('Deleting archived word:', wordText);
            
            // Get current archived words
            const { archivedWords = [] } = await chrome.storage.local.get('archivedWords');
            
            // Find and remove the word
            const archivedWordIndex = archivedWords.findIndex(w => w.word === wordText);
            if (archivedWordIndex === -1) {
                this.showError('Word not found in archived words');
                return;
            }
            
            archivedWords.splice(archivedWordIndex, 1);
            
            // Save updated archived words
            await chrome.storage.local.set({ archivedWords: archivedWords });
            
            // Show success message
            this.showSuccess(`"${wordText}" deleted permanently`);
            
            // Close modal and refresh
            const modal = document.querySelector('.word-modal');
            if (modal) {
                modal.remove();
            }
            
            // Enhanced refresh after deletion
            await this.refreshVocabularyDisplay();
            
        } catch (error) {
            console.error('Error deleting archived word:', error);
            this.showError('Failed to delete word');
        }
    }
    
    async restoreAllArchivedWords() {
        try {
            console.log('Restoring all archived words');
            
            // Get current archived words and vocabulary
            const { archivedWords = [] } = await chrome.storage.local.get('archivedWords');
            const { vocabulary = [] } = await chrome.storage.local.get('vocabulary');
            
            if (archivedWords.length === 0) {
                this.showError('No archived words to restore');
                return;
            }
            
            let restoredCount = 0;
            let skippedCount = 0;
            
            // Process each archived word
            for (const archivedWord of archivedWords) {
                // Check if word already exists in vocabulary
                const existingWord = vocabulary.find(w => w.word.toLowerCase() === archivedWord.word.toLowerCase());
                if (existingWord) {
                    skippedCount++;
                    continue;
                }
                
                // Remove archivedAt property and add to vocabulary
                const { archivedAt, ...wordToRestore } = archivedWord;
                vocabulary.push(wordToRestore);
                restoredCount++;
            }
            
            // Save updated vocabulary and clear archived words
            await chrome.storage.local.set({ 
                vocabulary: vocabulary,
                archivedWords: [] 
            });
            
            // Update local state
            this.vocabulary = vocabulary;
            
            // Show success message
            this.showSuccess(`${restoredCount} words restored, ${skippedCount} skipped (already existed)`);
            
            // Close modal and refresh
            const modal = document.querySelector('.word-modal');
            if (modal) {
                modal.remove();
            }
            
            // Enhanced refresh after restoring all archived words
            await this.refreshVocabularyDisplay();
            
        } catch (error) {
            console.error('Error restoring all archived words:', error);
            this.showError('Failed to restore words');
        }
    }
    
    async deleteAllArchivedWords() {
        try {
            console.log('Deleting all archived words');
            
            // Get current archived words
            const { archivedWords = [] } = await chrome.storage.local.get('archivedWords');
            
            if (archivedWords.length === 0) {
                this.showError('No archived words to delete');
                return;
            }
            
            // Clear archived words
            await chrome.storage.local.set({ archivedWords: [] });
            
            // Show success message
            this.showSuccess(`${archivedWords.length} archived words deleted permanently`);
            
            // Close modal and refresh
            const modal = document.querySelector('.word-modal');
            if (modal) {
                modal.remove();
            }
            
            // Enhanced refresh after deleting all archived words
            await this.refreshVocabularyDisplay();
            
        } catch (error) {
            console.error('Error deleting all archived words:', error);
            this.showError('Failed to delete words');
        }
    }
    
    async updateExistingWordsWithExamples() {
        try {
            console.log('Updating existing words with examples...');
            
            // Show loading modal
            const loadingModal = this.showLoadingModal('Updating Examples', 'Preparing to update words with examples...');
            
            let updatedCount = 0;
            let totalWords = 0;
            let processedWords = 0;
            
            // Count words that need updating
            for (const word of this.vocabulary) {
                if (!word.example) {
                    totalWords++;
                }
            }
            
            if (totalWords === 0) {
                loadingModal.remove();
                this.showSuccess('All words already have examples!');
                return;
            }
            
            for (let i = 0; i < this.vocabulary.length; i++) {
                const word = this.vocabulary[i];
                
                // Skip if word already has an example
                if (word.example) {
                    continue;
                }
                
                processedWords++;
                
                // Update loading progress
                this.updateLoadingProgress(loadingModal, processedWords, totalWords, `Fetching example for "${word.word}"...`);
                
                try {
                    const wordData = await this.getWordDefinition(word.word);
                    if (wordData.example) {
                        this.vocabulary[i].example = wordData.example;
                        updatedCount++;
                    }
                    
                    // Add a small delay to avoid overwhelming the API
                    await new Promise(resolve => setTimeout(resolve, 500));
                    
                } catch (error) {
                    console.error(`Error updating example for "${word.word}":`, error);
                }
            }
            
            // Close loading modal
            loadingModal.remove();
            
            if (updatedCount > 0) {
                await chrome.storage.local.set({ vocabulary: this.vocabulary });
                this.renderWordsGrid();
                this.showSuccess(`Updated ${updatedCount} words with examples!`);
            } else {
                this.showSuccess('No examples found for the words.');
            }
            
        } catch (error) {
            console.error('Error updating words with examples:', error);
            this.showError('Failed to update words with examples');
        }
    }
    
    showLoadingModal(title, initialMessage) {
        const modal = document.createElement('div');
        modal.className = 'loading-modal';
        modal.innerHTML = `
            <div class="loading-modal-content">
                <h3>${title}</h3>
                <div class="loading-progress">
                    <div class="loading-bar">
                        <div class="loading-fill"></div>
                    </div>
                    <div class="loading-text">${initialMessage}</div>
                    <div class="loading-stats">0 / 0</div>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        return modal;
    }
    
    updateLoadingProgress(modal, current, total, message) {
        const progressFill = modal.querySelector('.loading-fill');
        const progressText = modal.querySelector('.loading-text');
        const progressStats = modal.querySelector('.loading-stats');
        
        const percentage = total > 0 ? (current / total) * 100 : 0;
        
        progressFill.style.width = `${percentage}%`;
        progressText.textContent = message;
        progressStats.textContent = `${current} / ${total}`;
    }
    
    async editExample(wordText) {
        try {
            const wordIndex = this.vocabulary.findIndex(w => w.word === wordText);
            if (wordIndex === -1) {
                this.showError('Word not found');
                return;
            }
            
            const word = this.vocabulary[wordIndex];
            const currentExample = word.example || '';
            
            const content = `
                <div class="edit-example-modal">
                    <h3>Edit Example for "${wordText}"</h3>
                    <div class="example-input-section">
                        <label for="example-input">Example Sentence:</label>
                        <textarea id="example-input" placeholder="Enter an example sentence..." rows="4">${currentExample}</textarea>
                    </div>
                    <div class="example-actions">
                        <button class="btn btn-primary save-example-btn">💾 Save Example</button>
                        <button class="btn btn-secondary cancel-example-btn">❌ Cancel</button>
                        ${currentExample ? `<button class="btn btn-danger clear-example-btn">🗑️ Clear Example</button>` : ''}
                    </div>
                </div>
            `;
            
            this.showWordModal(content, 'edit-example');
            
            // Add event listeners
            const saveBtn = document.querySelector('.save-example-btn');
            const cancelBtn = document.querySelector('.cancel-example-btn');
            const clearBtn = document.querySelector('.clear-example-btn');
            
            saveBtn.addEventListener('click', async () => {
                const newExample = document.getElementById('example-input').value.trim();
                await this.updateWordExample(wordText, newExample);
                document.querySelector('.word-modal').remove();
            });
            
            cancelBtn.addEventListener('click', () => {
                document.querySelector('.word-modal').remove();
            });
            
            if (clearBtn) {
                clearBtn.addEventListener('click', async () => {
                    await this.updateWordExample(wordText, '');
                    document.querySelector('.word-modal').remove();
                });
            }
            
            // Focus on textarea
            document.getElementById('example-input').focus();
            
        } catch (error) {
            console.error('Error editing example:', error);
            this.showError('Failed to edit example');
        }
    }
    
    async updateWordExample(wordText, newExample) {
        try {
            const wordIndex = this.vocabulary.findIndex(w => w.word === wordText);
            if (wordIndex === -1) {
                this.showError('Word not found');
                return;
            }
            
            this.vocabulary[wordIndex].example = newExample || null;
            await chrome.storage.local.set({ vocabulary: this.vocabulary });
            
            // Enhanced refresh after example update
            await this.refreshVocabularyDisplay();
            this.showSuccess(`Example ${newExample ? 'updated' : 'cleared'} successfully!`);
            
        } catch (error) {
            console.error('Error updating example:', error);
            this.showError('Failed to update example');
        }
    }
    
    // Handle keyboard shortcut for newtab page
    async handleKeyboardShortcut() {
        try {
            const selectedText = window.getSelection().toString().trim();
            
            if (!selectedText) {
                this.showError('No text selected');
                return;
            }
            
            // Validate the selected text
            if (!this.isValidWord(selectedText)) {
                this.showError('Invalid word selected');
                return;
            }
            
            // Save the selected word
            await this.saveSelectedWord(selectedText);
            
        } catch (error) {
            console.error('Error handling keyboard shortcut:', error);
            this.showError('Failed to save word');
        }
    }





}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded, initializing VocabularyBoard');
    if (!window.vocabularyBoard) {
        window.vocabularyBoard = new VocabularyBoard();
    }
});

// Also initialize when window loads (for dynamic content)
window.addEventListener('load', () => {
    console.log('Window loaded, checking if VocabularyBoard needs initialization');
    if (!window.vocabularyBoard) {
        window.vocabularyBoard = new VocabularyBoard();
    }
}); 