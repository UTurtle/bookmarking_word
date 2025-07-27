// Today Voca System JavaScript
class TodayVoca {
    constructor() {
        this.vocabulary = [];
        this.todayWords = [];
        this.currentWordIndex = 0;
        this.currentStep = 'word';
        this.startTime = null;
        this.isCompleted = false;
        
        this.settings = {
            wordsPerDay: 5,
            includeWrongWords: true,
            includeUnlearnedWords: true
        };
        
        this.srsSystem = window.srsSystem || new SRSSystem();
        
        this.initializeElements();
        this.bindEvents();
        this.init();
    }
    
    async init() {
        await this.loadVocabulary();
        await this.loadSettings();
        this.initializeTodayVoca();
    }
    
    initializeElements() {
        this.todayVocaContainer = document.getElementById('today-voca-container');
        
        this.backToBoardBtn = document.getElementById('back-to-board');
        this.historyBtn = document.getElementById('history-today-voca');
        this.currentProgressSpan = document.getElementById('current-progress');
        this.totalWordsSpan = document.getElementById('total-words');
        this.progressFill = document.getElementById('progress-fill');
        
        this.wordCardContainer = document.getElementById('word-card-container');
        this.wordCard = document.getElementById('word-card');
        this.wordDisplay = document.getElementById('word-display');
        this.definitionDisplay = document.getElementById('definition-display');
        this.wordText = document.getElementById('word-text');
        this.definitionText = document.getElementById('definition-text');
        this.nextBtn = document.getElementById('next-btn');
        
        this.removeBtn = document.getElementById('remove-btn');
        this.pinBtn = document.getElementById('pin-btn');
        this.archiveBtn = document.getElementById('archive-btn');
        this.skipBtn = document.getElementById('skip-btn');
        this.removeBtnDef = document.getElementById('remove-btn-def');
        this.pinBtnDef = document.getElementById('pin-btn-def');
        this.archiveBtnDef = document.getElementById('archive-btn-def');
        this.skipBtnDef = document.getElementById('skip-btn-def');
        
        this.completionMessage = document.getElementById('completion-message');
        this.learnedCountSpan = document.getElementById('learned-count');
        this.timeSpentSpan = document.getElementById('time-spent');
        this.startQuizBtn = document.getElementById('start-quiz-btn');
        this.backToBoardCompleteBtn = document.getElementById('back-to-board-complete');
        
        this.historyModalOverlay = document.getElementById('history-modal-overlay');
        this.historyModalClose = document.getElementById('history-modal-close');
        this.historyList = document.getElementById('history-list');
        
        this.loadingOverlay = document.getElementById('loading-overlay');
        
        this.combinedDisplay = document.getElementById('combined-display');
        this.combinedWordText = document.getElementById('combined-word-text');
        this.combinedDefinitionText = document.getElementById('combined-definition-text');
        this.combinedActions = document.getElementById('combined-actions');
        
        this.removeBtnCombined = document.getElementById('remove-btn-combined');
        this.pinBtnCombined = document.getElementById('pin-btn-combined');
        this.archiveBtnCombined = document.getElementById('archive-btn-combined');
        this.skipBtnCombined = document.getElementById('skip-btn-combined');
        this.editDefinitionCombined = document.getElementById('edit-definition-combined');
    }
    
    bindEvents() {
        if (this.backToBoardBtn) {
            this.backToBoardBtn.addEventListener('click', () => this.goToBoard());
        }
        if (this.historyBtn) {
            this.historyBtn.addEventListener('click', () => this.showHistory());
        }
        if (this.historyModalClose) {
            this.historyModalClose.addEventListener('click', () => this.hideHistory());
        }
        if (this.historyModalOverlay) {
            this.historyModalOverlay.addEventListener('click', (e) => {
                if (e.target === this.historyModalOverlay) {
                    this.hideHistory();
                }
            });
        }
        
        if (this.nextBtn) {
            this.nextBtn.addEventListener('click', () => this.handleNext());
        }
        
        if (this.removeBtn) {
            this.removeBtn.addEventListener('click', () => this.removeCurrentWord());
        }
        if (this.pinBtn) {
            this.pinBtn.addEventListener('click', () => this.pinCurrentWord());
        }
        if (this.archiveBtn) {
            this.archiveBtn.addEventListener('click', () => this.archiveCurrentWord());
        }
        if (this.skipBtn) {
            this.skipBtn.addEventListener('click', () => this.skipCurrentWord());
        }
        
        if (this.removeBtnDef) {
            this.removeBtnDef.addEventListener('click', () => this.removeCurrentWord());
        }
        if (this.pinBtnDef) {
            this.pinBtnDef.addEventListener('click', () => this.pinCurrentWord());
        }
        if (this.archiveBtnDef) {
            this.archiveBtnDef.addEventListener('click', () => this.archiveCurrentWord());
        }
        if (this.skipBtnDef) {
            this.skipBtnDef.addEventListener('click', () => this.skipCurrentWord());
        }
        
        if (this.removeBtnCombined) {
            this.removeBtnCombined.addEventListener('click', () => this.removeCurrentWord());
        }
        if (this.pinBtnCombined) {
            this.pinBtnCombined.addEventListener('click', () => this.pinCurrentWord());
        }
        if (this.archiveBtnCombined) {
            this.archiveBtnCombined.addEventListener('click', () => this.archiveCurrentWord());
        }
        if (this.skipBtnCombined) {
            this.skipBtnCombined.addEventListener('click', () => this.skipCurrentWord());
        }
        if (this.editDefinitionCombined) {
            this.editDefinitionCombined.addEventListener('click', () => this.editCurrentDefinition());
        }
        
        if (this.startQuizBtn) {
            this.startQuizBtn.addEventListener('click', () => this.startQuiz());
        }
        if (this.backToBoardCompleteBtn) {
            this.backToBoardCompleteBtn.addEventListener('click', () => this.goToBoard());
        }
        
        document.addEventListener('keydown', (e) => this.handleKeyboard(e));
    }
    
    async loadVocabulary() {
        try {
            const result = await chrome.storage.local.get(['vocabulary']);
            this.vocabulary = result.vocabulary || [];
            console.log('Today Voca: Loaded vocabulary, count:', this.vocabulary.length);
            
            if (this.vocabulary.length > 0) {
                console.log('Today Voca: Sample words:', this.vocabulary.slice(0, 3).map(w => w.word));
            }
            
            // 기존 단어들에 todayVocaCount 필드 추가 (마이그레이션)
            this.migrateTodayVocaCounts();
        } catch (error) {
            console.error('Error loading vocabulary:', error);
            this.vocabulary = [];
        }
    }
    
    migrateTodayVocaCounts() {
        let hasChanges = false;
        
        this.vocabulary.forEach(word => {
            if (word.todayVocaCount === undefined) {
                word.todayVocaCount = 0;
                hasChanges = true;
            }
        });
        
        if (hasChanges) {
            console.log('Migrated todayVocaCount field for existing words');
            chrome.storage.local.set({ vocabulary: this.vocabulary });
        }
    }
    
    async loadSettings() {
        try {
            const result = await chrome.storage.local.get(['todayVocaSettings']);
            this.settings = { ...this.settings, ...result.todayVocaSettings };
        } catch (error) {
            console.error('Error loading settings:', error);
        }
    }
    
    async saveSettings() {
        try {
            await chrome.storage.local.set({ todayVocaSettings: this.settings });
        } catch (error) {
            console.error('Error saving settings:', error);
        }
    }
    
    initializeTodayVoca() {
        console.log('Today Voca: Initializing Today Voca...');
        this.showLoading(true);
        
        // 매번 새로운 Today Voca 생성
        console.log('Today Voca: Generating new Today Voca');
        this.generateTodayVoca();
    }
    
    generateTodayVoca() {
        console.log('Generating Today Voca...');
        console.log('Vocabulary length:', this.vocabulary.length);
        console.log('Settings wordsPerDay:', this.settings.wordsPerDay);
        
        if (this.vocabulary.length > 0) {
            console.log('Sample vocabulary items:', this.vocabulary.slice(0, 3));
        }
        
        // 모든 단어 중에서 아카이브되지 않은 단어들을 선택
        const availableWords = this.vocabulary.filter(word => !word.isArchived);
        console.log('Available words (not archived):', availableWords.length);
        
        if (availableWords.length === 0) {
            console.log('No words available, showing empty state');
            this.showEmptyState();
            this.showLoading(false);
            return;
        }
        
        // 단어별 Today Voca 출현 횟수 확인
        const wordsWithTodayVocaCount = availableWords.map(word => ({
            ...word,
            todayVocaCount: word.todayVocaCount || 0
        }));
        
        // 모든 단어가 최소 1번 이상 Today Voca에 나왔는지 확인
        const allWordsHaveAppeared = wordsWithTodayVocaCount.every(word => word.todayVocaCount > 0);
        
        let selectedWords;
        
        if (allWordsHaveAppeared) {
            // 모든 단어가 한 번씩 나왔다면 SRS 적용
            console.log('All words have appeared in Today Voca, applying SRS selection');
            selectedWords = this.srsSystem.selectWordsForTodayVoca(
                wordsWithTodayVocaCount, 
                this.settings.wordsPerDay
            );
            
            // SRS로 선택된 단어가 부족하면 추가 선택
            if (selectedWords.length < this.settings.wordsPerDay) {
                const remainingCount = this.settings.wordsPerDay - selectedWords.length;
                const remainingWords = wordsWithTodayVocaCount.filter(word => 
                    !selectedWords.some(selected => selected.word === word.word)
                );
                
                if (remainingWords.length > 0) {
                    this.shuffleArray(remainingWords);
                    const additionalWords = remainingWords.slice(0, remainingCount);
                    selectedWords = [...selectedWords, ...additionalWords];
                }
            }
        } else {
            // 아직 모든 단어가 나오지 않았다면 랜덤 선택 (출현 횟수가 적은 단어 우선)
            console.log('Not all words have appeared in Today Voca, using random selection with priority');
            
            // 출현 횟수가 적은 순으로 정렬
            wordsWithTodayVocaCount.sort((a, b) => a.todayVocaCount - b.todayVocaCount);
            
            // 출현 횟수가 0인 단어들을 우선 선택
            const unappearedWords = wordsWithTodayVocaCount.filter(word => word.todayVocaCount === 0);
            const appearedWords = wordsWithTodayVocaCount.filter(word => word.todayVocaCount > 0);
            
            this.shuffleArray(unappearedWords);
            this.shuffleArray(appearedWords);
            
            // 출현하지 않은 단어들을 먼저 선택
            const unappearedCount = Math.min(unappearedWords.length, this.settings.wordsPerDay);
            const appearedCount = this.settings.wordsPerDay - unappearedCount;
            
            selectedWords = [
                ...unappearedWords.slice(0, unappearedCount),
                ...appearedWords.slice(0, appearedCount)
            ];
            
            // 최종 선택된 단어들도 다시 섞기
            this.shuffleArray(selectedWords);
        }
        
        this.todayWords = selectedWords;
        
        console.log('Selected words for Today Voca:', this.todayWords.length);
        console.log('Selected words:', this.todayWords.map(w => w.word));
        console.log('Selection method:', allWordsHaveAppeared ? 'SRS-based' : 'Random with priority');
        
        // SRS 데이터 초기화
        this.todayWords.forEach(word => {
            if (!word.srsData) {
                word.srsData = this.srsSystem.initializeSRSData(word);
            }
        });
        
        // Reset progress for new Today Voca
        this.currentWordIndex = 0;
        this.isCompleted = false;
        
                this.saveTodayVocaToStorage();
        
        this.updateProgress();
        this.showCurrentWord();
        this.showLoading(false);
    }
    
    loadTodayVocaFromStorage() {
        console.log('Today Voca: Loading from storage...');
        try {
            const stored = localStorage.getItem('todayVocaData');
            console.log('Today Voca: Stored data:', stored);
            
            if (stored) {
                const data = JSON.parse(stored);
                console.log('Today Voca: Parsed data:', data);
                
                // Check if the stored data is from today
                const today = new Date().toDateString();
                const storedDate = data.date;
                
                console.log('Today Voca: Today:', today, 'Stored date:', storedDate);
                
                if (storedDate === today) {
                    // Same day - load existing data
                    this.todayWords = data.words || [];
                    this.currentWordIndex = data.currentIndex || 0;
                    this.isCompleted = data.completed || false;
                    
                    console.log('Today Voca: Loaded words count:', this.todayWords.length);
                    console.log('Today Voca: Current index:', this.currentWordIndex);
                    console.log('Today Voca: Is completed:', this.isCompleted);
                    
                    if (this.todayWords.length === 0) {
                        console.log('Today Voca: No words in storage, generating new Today Voca');
                        this.generateTodayVoca();
                        return;
                    }
                    
                    if (this.isCompleted) {
                        console.log('Today Voca: Today Voca completed, but allowing re-challenge');
                        this.isCompleted = false;
                        this.currentWordIndex = 0;
                        this.updateProgress();
                        this.showCurrentWord();
                    } else {
                        console.log('Today Voca: Today Voca in progress, showing current word');
                        this.updateProgress();
                        this.showCurrentWord();
                    }
                } else {
                    // Different day - generate new Today Voca
                    console.log('Today Voca: Different day, generating new Today Voca');
                    this.generateTodayVoca();
                }
            } else {
                console.log('Today Voca: No stored data, generating new Today Voca');
                this.generateTodayVoca();
            }
        } catch (error) {
            console.error('Error loading today voca from storage:', error);
            this.generateTodayVoca();
        }
        this.showLoading(false);
    }
    
    saveTodayVocaToStorage() {
        try {
            const data = {
                words: this.todayWords,
                currentIndex: this.currentWordIndex,
                completed: this.isCompleted,
                date: new Date().toDateString()
            };
            localStorage.setItem('todayVocaData', JSON.stringify(data));
            
            chrome.storage.local.set({ todayVocaData: data });
            
            if (this.isCompleted) {
                localStorage.setItem('lastTodayVocaDate', new Date().toDateString());
            }
        } catch (error) {
            console.error('Error saving today voca to storage:', error);
        }
    }
    
    updateProgress() {
        const progress = this.currentWordIndex;
        const total = this.todayWords.length;
        
        if (this.currentProgressSpan) {
            this.currentProgressSpan.textContent = progress;
        }
        if (this.totalWordsSpan) {
            this.totalWordsSpan.textContent = total;
        }
        
        const percentage = total > 0 ? (progress / total) * 100 : 0;
        if (this.progressFill) {
            this.progressFill.style.width = `${percentage}%`;
        }
    }
    
    showCurrentWord() {
        if (this.todayWords.length === 0) {
            this.showEmptyState();
            return;
        }
        
        if (this.currentWordIndex >= this.todayWords.length) {
            this.completeTodayVoca();
            return;
        }
        
        const currentWord = this.todayWords[this.currentWordIndex];
        
        if (this.wordText) {
            this.wordText.textContent = currentWord.word;
        }
        if (this.definitionText) {
            this.definitionText.textContent = currentWord.definition;
        }
        
        this.showSRSInfo(currentWord);
        
        this.currentStep = 'word';
        this.showWordStep();
        
        if (this.currentWordIndex === 0) {
            this.startTime = new Date();
            // Today Voca 시작 시 History에 저장
            this.saveTodayVocaHistory();
        }
    }
    
    showSRSInfo(word) {
        if (word.srsData) {
            console.log(`SRS Info for ${word.word}:`, {
                interval: word.srsData.interval,
                repetitions: word.srsData.repetitions,
                easeFactor: word.srsData.easeFactor,
                nextReview: word.srsData.nextReview,
                accuracy: word.srsData.totalReviews > 0 ? 
                    (word.srsData.correctReviews / word.srsData.totalReviews * 100).toFixed(1) + '%' : 'N/A'
            });
        }
    }
    
    showWordStep() {
        if (this.wordDisplay) {
            this.wordDisplay.classList.remove('hidden');
        }
        if (this.definitionDisplay) {
            this.definitionDisplay.classList.add('hidden');
        }
        if (this.combinedDisplay) {
            this.combinedDisplay.classList.add('hidden');
        }
        if (this.nextBtn) {
            this.nextBtn.textContent = 'Next →';
        }
    }
    
    showDefinitionStep() {
        if (this.wordDisplay) {
            this.wordDisplay.classList.add('hidden');
        }
        if (this.definitionDisplay) {
            this.definitionDisplay.classList.remove('hidden');
        }
        if (this.combinedDisplay) {
            this.combinedDisplay.classList.add('hidden');
        }
        if (this.nextBtn) {
            this.nextBtn.textContent = 'Next Word →';
        }
    }
    
    showCombinedStep() {
        if (this.wordDisplay) {
            this.wordDisplay.classList.add('hidden');
        }
        if (this.definitionDisplay) {
            this.definitionDisplay.classList.add('hidden');
        }
        if (this.combinedDisplay) {
            this.combinedDisplay.classList.remove('hidden');
        }
        
        if (this.currentWordIndex < this.todayWords.length) {
            const currentWord = this.todayWords[this.currentWordIndex];
            if (this.combinedWordText) {
                this.combinedWordText.textContent = currentWord.word;
            }
            if (this.combinedDefinitionText) {
                this.combinedDefinitionText.textContent = currentWord.definition || 'Definition not available';
            }
        }
        
        if (this.nextBtn) {
            this.nextBtn.textContent = 'Next Word →';
        }
    }
    
    handleNext() {
        if (this.currentStep === 'word') {
            this.currentStep = 'combined';
            this.showCombinedStep();
        } else if (this.currentStep === 'combined') {
            this.currentWordIndex++;
            this.updateProgress();
            this.showCurrentWord();
        } else {
            this.currentStep = 'combined';
            this.showCombinedStep();
        }
    }
    
    async removeCurrentWord() {
        if (this.currentWordIndex >= this.todayWords.length) return;
        
        const currentWord = this.todayWords[this.currentWordIndex];
        
        this.todayWords.splice(this.currentWordIndex, 1);
        
        const wordIndex = this.vocabulary.findIndex(w => w.word === currentWord.word);
        if (wordIndex !== -1) {
            this.vocabulary.splice(wordIndex, 1);
            await chrome.storage.local.set({ vocabulary: this.vocabulary });
        }
        
        this.updateProgress();
        this.saveTodayVocaToStorage();
        
        if (this.currentWordIndex >= this.todayWords.length) {
            this.completeTodayVoca();
        } else {
            this.showCurrentWord();
        }
    }
    
    async pinCurrentWord() {
        if (this.currentWordIndex >= this.todayWords.length) return;
        
        const currentWord = this.todayWords[this.currentWordIndex];
        
        const wordIndex = this.vocabulary.findIndex(w => w.word === currentWord.word);
        if (wordIndex !== -1) {
            this.vocabulary[wordIndex].isPinned = !this.vocabulary[wordIndex].isPinned;
            await chrome.storage.local.set({ vocabulary: this.vocabulary });
        }
        
        currentWord.isPinned = !currentWord.isPinned;
        this.saveTodayVocaToStorage();
    }
    
    async archiveCurrentWord() {
        if (this.currentWordIndex >= this.todayWords.length) return;
        
        const currentWord = this.todayWords[this.currentWordIndex];
        
        const wordIndex = this.vocabulary.findIndex(w => w.word === currentWord.word);
        if (wordIndex !== -1) {
            this.vocabulary[wordIndex].isArchived = !this.vocabulary[wordIndex].isArchived;
            await chrome.storage.local.set({ vocabulary: this.vocabulary });
        }
        
        currentWord.isArchived = !currentWord.isArchived;
        this.saveTodayVocaToStorage();
    }
    
    skipCurrentWord() {
        this.currentWordIndex++;
        this.updateProgress();
        this.saveTodayVocaToStorage();
        this.showCurrentWord();
    }
    
    editCurrentDefinition() {
        if (this.currentWordIndex >= this.todayWords.length) return;
        
        const currentWord = this.todayWords[this.currentWordIndex];
        const currentDefinition = currentWord.definition || '';
        
        const modal = document.createElement('div');
        modal.className = 'edit-definition-modal';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3>Edit Definition for "${currentWord.word}"</h3>
                    <button class="modal-close">&times;</button>
                </div>
                <div class="modal-body">
                    <div class="definition-input-section">
                        <label for="definition-input">Definition:</label>
                        <textarea id="definition-input" rows="4" placeholder="Enter the definition...">${currentDefinition}</textarea>
                    </div>
                    <div class="definition-actions">
                        <button class="btn btn-primary" id="save-definition-btn">Save</button>
                        <button class="btn btn-outline" id="cancel-definition-btn">Cancel</button>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        const closeBtn = modal.querySelector('.modal-close');
        const cancelBtn = modal.querySelector('#cancel-definition-btn');
        const saveBtn = modal.querySelector('#save-definition-btn');
        const textarea = modal.querySelector('#definition-input');
        
        const closeModal = () => {
            document.body.removeChild(modal);
        };
        
        closeBtn.addEventListener('click', closeModal);
        cancelBtn.addEventListener('click', closeModal);
        
        saveBtn.addEventListener('click', async () => {
            const newDefinition = textarea.value.trim();
            if (newDefinition) {
                currentWord.definition = newDefinition;
                
                const wordIndex = this.vocabulary.findIndex(w => w.word === currentWord.word);
                if (wordIndex !== -1) {
                    this.vocabulary[wordIndex].definition = newDefinition;
                    await chrome.storage.local.set({ vocabulary: this.vocabulary });
                }
                
                this.saveTodayVocaToStorage();
                
                if (this.combinedDefinitionText) {
                    this.combinedDefinitionText.textContent = newDefinition;
                }
                
                closeModal();
            }
        });
        
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                closeModal();
            }
        });
        
        textarea.focus();
    }
    
    completeTodayVoca() {
        if (this.todayWords.length === 0) {
            this.showEmptyState();
            return;
        }
        
        this.isCompleted = true;
        
        // Today Voca에 나온 단어들의 출현 횟수 업데이트
        this.updateTodayVocaCounts();
        
        this.saveTodayVocaToStorage();
        this.saveTodayVocaHistory();
        this.showCompletionMessage();
    }
    
    updateTodayVocaCounts() {
        console.log('Updating Today Voca counts for words:', this.todayWords.map(w => w.word));
        
        this.todayWords.forEach(word => {
            if (!word.todayVocaCount) {
                word.todayVocaCount = 0;
            }
            word.todayVocaCount += 1;
            console.log(`Word "${word.word}" Today Voca count: ${word.todayVocaCount}`);
        });
        
        // 전체 단어장에서 해당 단어들의 출현 횟수 업데이트
        this.vocabulary.forEach(vocabWord => {
            const todayWord = this.todayWords.find(w => w.word === vocabWord.word);
            if (todayWord) {
                vocabWord.todayVocaCount = todayWord.todayVocaCount;
            }
        });
        
        // 단어장 저장
        chrome.storage.local.set({ vocabulary: this.vocabulary });
    }
    
    showCompletionMessage() {
        if (this.wordCardContainer) {
            this.wordCardContainer.classList.add('hidden');
        }
        if (this.completionMessage) {
            this.completionMessage.classList.remove('hidden');
        }
        
        const learnedCount = this.todayWords.length;
        const timeSpent = this.calculateTimeSpent();
        
        if (this.learnedCountSpan) {
            this.learnedCountSpan.textContent = learnedCount;
        }
        if (this.timeSpentSpan) {
            this.timeSpentSpan.textContent = timeSpent;
        }
    }
    
    calculateTimeSpent() {
        if (!this.startTime) return '0 min';
        
        const endTime = new Date();
        const diffMs = endTime - this.startTime;
        const diffMinutes = Math.round(diffMs / 60000);
        
        if (diffMinutes < 1) return 'Less than 1 min';
        return `${diffMinutes} min`;
    }
    
    async saveTodayVocaHistory() {
        try {
            const result = await chrome.storage.local.get(['todayVocaHistory']);
            const history = result.todayVocaHistory || [];
            
            const srsStats = this.srsSystem.calculateSRSStats(this.todayWords);
            const now = new Date();
            
            const historyEntry = {
                id: `today-voca-${now.getTime()}`,
                date: now.toISOString().split('T')[0],
                timestamp: now.toISOString(),
                words: this.todayWords.map(w => w.word),
                completed: this.isCompleted,
                timeSpent: this.calculateTimeSpent(),
                learningTime: now.toISOString(),
                progress: this.currentWordIndex,
                totalWords: this.todayWords.length,
                srsStats: {
                    totalWords: srsStats.totalWords,
                    wordsWithSRS: srsStats.wordsWithSRS,
                    averageAccuracy: srsStats.averageAccuracy,
                    totalReviews: srsStats.totalReviews
                }
            };
            
            // 새로운 History 항목 추가 (기존 항목과 병합하지 않음)
            history.push(historyEntry);
            
            await chrome.storage.local.set({ todayVocaHistory: history });
            console.log('Today Voca history saved:', historyEntry);
        } catch (error) {
            console.error('Error saving today voca history:', error);
        }
    }
    
    async showHistory() {
        try {
            const result = await chrome.storage.local.get(['todayVocaHistory']);
            const history = result.todayVocaHistory || [];
            
            if (!this.historyList) {
                console.error('historyList not found');
                return;
            }
            
            this.historyList.innerHTML = '';
            
            if (history.length === 0) {
                this.historyList.innerHTML = '<p style="text-align: center; color: #6c757d;">No Today Voca history yet.</p>';
            } else {
                history.reverse().forEach(entry => {
                    const historyItem = document.createElement('div');
                    historyItem.className = 'history-item';
                    const srsInfo = entry.srsStats ? 
                        `<span>Accuracy: ${(entry.srsStats.averageAccuracy * 100).toFixed(1)}%</span>` : '';
                    
                    const statusText = entry.completed ? '완료' : `진행중 (${entry.progress || 0}/${entry.totalWords || entry.words.length})`;
                    const statusClass = entry.completed ? 'completed' : 'in-progress';
                    
                    // 타임스탬프가 있으면 사용, 없으면 날짜 사용
                    const displayDate = entry.timestamp ? this.formatDateTime(entry.timestamp) : this.formatDate(entry.date);
                    
                    historyItem.innerHTML = `
                        <div class="history-date">${displayDate}</div>
                        <div class="history-stats">
                            <span>Words: ${entry.words.length}</span>
                            <span>Time: ${entry.timeSpent}</span>
                            <span class="status ${statusClass}">${statusText}</span>
                            ${srsInfo}
                        </div>
                    `;
                    historyItem.addEventListener('click', () => this.viewHistoryDetail(entry));
                    this.historyList.appendChild(historyItem);
                });
            }
            
            this.historyModalOverlay.classList.remove('hidden');
        } catch (error) {
            console.error('Error showing history:', error);
        }
    }
    
    hideHistory() {
        this.historyModalOverlay.classList.add('hidden');
    }
    
    viewHistoryDetail(entry) {
        console.log('Viewing history detail:', entry);
        this.showHistoryDetail(entry);
    }
    
    showHistoryDetail(entry) {
        if (!this.historyModalOverlay) {
            console.error('historyModalOverlay not found');
            return;
        }
        
        const detailHTML = `
            <div class="modal-container">
                <div class="modal-header">
                    <h2>📅 Today Voca Detail - ${this.formatDate(entry.date)}</h2>
                    <button class="modal-close" id="history-detail-close">×</button>
                </div>
                <div class="modal-content">
                    <div class="history-detail-stats">
                        <div class="stat-item">
                            <span class="stat-label">Words:</span>
                            <span class="stat-value">${entry.words.length}</span>
                        </div>
                        <div class="stat-item">
                            <span class="stat-label">Time:</span>
                            <span class="stat-value">${entry.timeSpent}</span>
                        </div>
                        <div class="stat-item">
                            <span class="stat-label">Status:</span>
                            <span class="stat-value ${entry.completed ? 'completed' : 'in-progress'}">
                                ${entry.completed ? '완료' : `진행중 (${entry.progress || 0}/${entry.totalWords || entry.words.length})`}
                            </span>
                        </div>
                    </div>
                    <div class="history-words-list">
                        <h3>Words in this session:</h3>
                        <div class="words-container">
                            ${entry.words.map((word, index) => {
                                const wordData = this.vocabulary.find(v => v.word === word);
                                const definition = wordData ? wordData.definition : 'Definition not found';
                                return `
                                    <div class="history-word-item" data-word="${word}">
                                        <div class="word-info">
                                            <span class="word-number">${index + 1}.</span>
                                            <span class="word-text">${word}</span>
                                            <span class="word-definition">${definition}</span>
                                        </div>
                                        <div class="word-actions">
                                            <button class="action-btn pin-btn" title="Pin" onclick="this.closest('.history-word-item').dispatchEvent(new CustomEvent('pinWord', {detail: '${word}'}))">📌</button>
                                            <button class="action-btn archive-btn" title="Archive" onclick="this.closest('.history-word-item').dispatchEvent(new CustomEvent('archiveWord', {detail: '${word}'}))">📦</button>
                                            <button class="action-btn remove-btn" title="Delete" onclick="this.closest('.history-word-item').dispatchEvent(new CustomEvent('deleteWord', {detail: '${word}'}))">❌</button>
                                        </div>
                                    </div>
                                `;
                            }).join('')}
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        this.historyModalOverlay.innerHTML = detailHTML;
        this.historyModalOverlay.classList.remove('hidden');
        
        // 이벤트 리스너 추가
        const closeBtn = document.getElementById('history-detail-close');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => this.hideHistory());
        }
        
        // 단어 액션 이벤트 리스너 추가
        const wordItems = this.historyModalOverlay.querySelectorAll('.history-word-item');
        wordItems.forEach(item => {
            item.addEventListener('pinWord', (e) => this.pinWordFromHistory(e.detail));
            item.addEventListener('archiveWord', (e) => this.archiveWordFromHistory(e.detail));
            item.addEventListener('deleteWord', (e) => this.deleteWordFromHistory(e.detail));
        });
        
        // 모달 외부 클릭 시 닫기
        this.historyModalOverlay.addEventListener('click', (e) => {
            if (e.target === this.historyModalOverlay) {
                this.hideHistory();
            }
        });
    }
    
    async pinWordFromHistory(word) {
        try {
            const wordIndex = this.vocabulary.findIndex(w => w.word === word);
            if (wordIndex !== -1) {
                this.vocabulary[wordIndex].isPinned = true;
                await chrome.storage.local.set({ vocabulary: this.vocabulary });
                this.showSuccess(`Word "${word}" pinned successfully`);
            }
        } catch (error) {
            console.error('Error pinning word from history:', error);
            this.showError('Failed to pin word');
        }
    }
    
    async archiveWordFromHistory(word) {
        try {
            const wordIndex = this.vocabulary.findIndex(w => w.word === word);
            if (wordIndex !== -1) {
                this.vocabulary[wordIndex].isArchived = true;
                await chrome.storage.local.set({ vocabulary: this.vocabulary });
                this.showSuccess(`Word "${word}" archived successfully`);
            }
        } catch (error) {
            console.error('Error archiving word from history:', error);
            this.showError('Failed to archive word');
        }
    }
    
    async deleteWordFromHistory(word) {
        if (confirm(`Are you sure you want to delete "${word}"?`)) {
            try {
                this.vocabulary = this.vocabulary.filter(w => w.word !== word);
                await chrome.storage.local.set({ vocabulary: this.vocabulary });
                this.showSuccess(`Word "${word}" deleted successfully`);
                // History에서도 해당 단어 제거
                this.removeWordFromHistory(word);
            } catch (error) {
                console.error('Error deleting word from history:', error);
                this.showError('Failed to delete word');
            }
        }
    }
    
    removeWordFromHistory(word) {
        // 모든 History 항목에서 해당 단어 제거
        chrome.storage.local.get(['todayVocaHistory'], (result) => {
            const history = result.todayVocaHistory || [];
            history.forEach(entry => {
                entry.words = entry.words.filter(w => w !== word);
            });
            chrome.storage.local.set({ todayVocaHistory: history });
        });
    }
    
    showSuccess(message) {
        // 간단한 성공 메시지 표시
        const successDiv = document.createElement('div');
        successDiv.className = 'success-message';
        successDiv.textContent = message;
        successDiv.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #d4edda;
            color: #155724;
            padding: 10px 15px;
            border-radius: 5px;
            z-index: 10000;
            font-size: 14px;
        `;
        document.body.appendChild(successDiv);
        setTimeout(() => successDiv.remove(), 3000);
    }
    
    showError(message) {
        // 간단한 에러 메시지 표시
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-message';
        errorDiv.textContent = message;
        errorDiv.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #f8d7da;
            color: #721c24;
            padding: 10px 15px;
            border-radius: 5px;
            z-index: 10000;
            font-size: 14px;
        `;
        document.body.appendChild(errorDiv);
        setTimeout(() => errorDiv.remove(), 3000);
    }
    
    formatDate(dateString) {
        const date = new Date(dateString);
        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        
        if (date.toDateString() === today.toDateString()) {
            return '오늘';
        } else if (date.toDateString() === yesterday.toDateString()) {
            return '어제';
        } else {
            return date.toLocaleDateString('ko-KR', { 
                month: 'long', 
                day: 'numeric',
                weekday: 'long'
            });
        }
    }
    
    formatDateTime(timestamp) {
        const date = new Date(timestamp);
        const now = new Date();
        const diffMs = now - date;
        const diffMinutes = Math.floor(diffMs / (1000 * 60));
        const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
        
        if (diffMinutes < 1) {
            return '방금 전';
        } else if (diffMinutes < 60) {
            return `${diffMinutes}분 전`;
        } else if (diffHours < 24) {
            return `${diffHours}시간 전`;
        } else if (diffDays < 7) {
            return `${diffDays}일 전`;
        } else {
            return date.toLocaleDateString('ko-KR', { 
                month: 'short', 
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
        }
    }
    
    startQuiz() {   
        const quizWords = this.todayWords.map(w => ({
            word: w.word,
            definition: w.definition
        }));
        
        const quizUrl = chrome.runtime.getURL('src/html/today-voca-quiz.html');
        const quizParams = new URLSearchParams({
            words: JSON.stringify(quizWords)
        });
        
        chrome.tabs.create({
            url: `${quizUrl}?${quizParams.toString()}`
        });
    }
    
    goToBoard() {
        const boardUrl = chrome.runtime.getURL('src/html/newtab.html');
        chrome.tabs.update({ url: boardUrl });
    }
    
    handleKeyboard(event) {
        switch (event.key) {
            case 'ArrowRight':
            case ' ':
                event.preventDefault();
                this.handleNext();
                break;
            case 'Escape':
                this.goToBoard();
                break;
            case '1':
                event.preventDefault();
                this.removeCurrentWord();
                break;
            case '2':
                event.preventDefault();
                this.pinCurrentWord();
                break;
            case '3':
                event.preventDefault();
                this.archiveCurrentWord();
                break;
            case '4':
                event.preventDefault();
                this.skipCurrentWord();
                break;
        }
    }
    
    showLoading(show) {
        if (this.loadingOverlay) {
            if (show) {
                this.loadingOverlay.classList.remove('hidden');
            } else {
                this.loadingOverlay.classList.add('hidden');
            }
        }
    }
    
    shuffleArray(array) {
        // 더 강력한 랜덤성을 위해 여러 번 섞기
        for (let shuffle = 0; shuffle < 3; shuffle++) {
            for (let i = array.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [array[i], array[j]] = [array[j], array[i]];
            }
        }
        console.log('Shuffled array with enhanced randomness');
    }
    
    showEmptyState() {
        if (!this.todayVocaContainer) {
            console.error('todayVocaContainer not found');
            return;
        }
        
        if (this.wordCardContainer) {
            this.wordCardContainer.classList.add('hidden');
        }
        
        if (this.completionMessage) {
            this.completionMessage.classList.add('hidden');
        }
        
        const emptyStateHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">📚</div>
                <h2>No Words Available</h2>
                <p>You don't have any words in your vocabulary yet.</p>
                <p>Add some words to start learning!</p>
                <button class="go-to-board-btn" id="go-to-board-empty">Go to Board</button>
            </div>
        `;
        
        this.todayVocaContainer.innerHTML = emptyStateHTML;
        
        const goToBoardBtn = document.getElementById('go-to-board-empty');
        if (goToBoardBtn) {
            goToBoardBtn.addEventListener('click', () => this.goToBoard());
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new TodayVoca();
}); 