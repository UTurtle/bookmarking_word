// Today Voca Quiz System JavaScript
class TodayVocaQuiz {
    constructor() {
        this.quizWords = [];
        this.questions = [];
        this.currentQuestionIndex = 0;
        this.score = 0;
        this.correctCount = 0;
        this.wrongCount = 0;
        this.startTime = null;
        this.isCompleted = false;
        
        this.initializeElements();
        this.bindEvents();
        this.initializeQuiz();
    }
    
    initializeElements() {
        this.backToTodayVocaBtn = document.getElementById('back-to-today-voca');
        this.currentQuestionNumSpan = document.getElementById('current-question-num');
        this.totalQuestionsSpan = document.getElementById('total-questions');
        this.currentScoreSpan = document.getElementById('current-score');
        this.quizProgressFill = document.getElementById('quiz-progress-fill');
        
        this.quizQuestionContainer = document.getElementById('quiz-question-container');
        this.questionText = document.getElementById('question-text');
        this.questionOptions = document.getElementById('question-options');
        this.nextQuestionBtn = document.getElementById('next-question-btn');
        
        this.quizResultContainer = document.getElementById('quiz-result-container');
        this.finalScoreSpan = document.getElementById('final-score');
        this.correctCountSpan = document.getElementById('correct-count');
        this.wrongCountSpan = document.getElementById('wrong-count');
        this.quizTimeSpentSpan = document.getElementById('quiz-time-spent');
        this.retryQuizBtn = document.getElementById('retry-quiz-btn');
        this.backToBoardBtn = document.getElementById('back-to-board-btn');
        
        this.loadingOverlay = document.getElementById('loading-overlay');
    }
    
    bindEvents() {
        this.backToTodayVocaBtn.addEventListener('click', () => this.goToTodayVoca());
        this.retryQuizBtn.addEventListener('click', () => this.retryQuiz());
        this.backToBoardBtn.addEventListener('click', () => this.goToBoard());
        
        this.nextQuestionBtn.addEventListener('click', () => this.nextQuestion());
        
        document.addEventListener('keydown', (e) => this.handleKeyboard(e));
    }
    
    async initializeQuiz() {
        this.showLoading(true);
        
        try {
            const urlParams = new URLSearchParams(window.location.search);
            const wordsParam = urlParams.get('words');
            
            if (wordsParam) {
                const wordsData = JSON.parse(wordsParam);
                this.quizWords = wordsData.map(item => item.word || item);
                this.wordsData = wordsData;
            } else {
                await this.loadTodayVocaWords();
            }
            
            if (this.quizWords.length === 0) {
                alert('No words available for quiz. Please complete Today Voca first.');
                this.goToTodayVoca();
                return;
            }
            
            await this.generateQuestions();
            
            this.updateQuizInfo();
            this.showCurrentQuestion();
            
            this.startTime = new Date();
            
        } catch (error) {
            // Error initializing quiz
            alert('Error initializing quiz. Please try again.');
            this.goToTodayVoca();
        }
        
        this.showLoading(false);
    }
    
    async loadTodayVocaWords() {
        try {
            const result = await chrome.storage.local.get(['todayVocaHistory']);
            const history = result.todayVocaHistory || [];
            
            const today = new Date().toISOString().split('T')[0];
            const todayVoca = history.find(h => h.date === today);
            
            if (todayVoca && todayVoca.words) {
                this.quizWords = todayVoca.words;
            }
        } catch (error) {
            // Error loading today voca words
        }
    }
    
    async generateQuestions() {
        this.questions = [];
        
        for (const word of this.quizWords) {
            const wordToDefQuestion = await this.createWordToDefinitionQuestion(word);
            this.questions.push(wordToDefQuestion);
            
            const defToWordQuestion = await this.createDefinitionToWordQuestion(word);
            this.questions.push(defToWordQuestion);
        }
        
        this.shuffleArray(this.questions);
        
        this.questions = this.questions.slice(0, 10);
    }
    
    async createWordToDefinitionQuestion(word) {
        const otherWords = this.quizWords.filter(w => w !== word);
        const wrongOptions = await this.getRandomDefinitions(otherWords, 3);

        const correctDefinition = await this.getWordDefinition(word);
        
        const options = [
            { text: correctDefinition, isCorrect: true },
            ...wrongOptions.map(def => ({ text: def, isCorrect: false }))
        ];
        
        this.shuffleArray(options);
        
        return {
            type: 'word-to-definition',
            question: `What is the definition of "${word}"?`,
            options: options,
            correctWord: word,
            correctDefinition: correctDefinition
        };
    }
    
    async createDefinitionToWordQuestion(word) {
        const otherWords = this.quizWords.filter(w => w !== word);
        const wrongOptions = this.getRandomWords(otherWords, 3);
        
        const options = [
            { text: word, isCorrect: true },
            ...wrongOptions.map(w => ({ text: w, isCorrect: false }))
        ];
        
        this.shuffleArray(options);
        
        const definition = await this.getWordDefinition(word);
        
        return {
            type: 'definition-to-word',
            question: `Which word corresponds to "${definition}"?`,
            options: options,
            correctWord: word,
            correctDefinition: definition
        };
    }
    
    async getWordDefinition(word) {
        try {
            if (this.wordsData) {
                const wordData = this.wordsData.find(w => w.word === word);
                if (wordData && wordData.definition) {
                    return wordData.definition;
                }
            }
            
            const result = await chrome.storage.local.get(['vocabulary']);
            const vocabulary = result.vocabulary || [];
            
            const wordData = vocabulary.find(w => w.word === word);
            if (wordData && wordData.definition) {
                return wordData.definition;
            }
            
            const defaultDefinitions = {
                'serendipity': 'the occurrence and development of events by chance in a happy or beneficial way',
                'ubiquitous': 'present, appearing, or found everywhere',
                'ephemeral': 'lasting for a very short time',
                'effervescent': 'vivacious and enthusiastic',
                'quintessential': 'representing the most perfect or typical example of a quality or class',
                'mellifluous': 'sweet or musical; pleasant to hear',
                'plethora': 'a large or excessive amount of something',
                'indubitable': 'impossible to doubt; unquestionable'
            };
            
            return defaultDefinitions[word] || `Definition of ${word}`;
        } catch (error) {
            // Error getting word definition
            return `Definition of ${word}`;
        }
    }
    
    async getRandomDefinitions(words, count) {
        const definitions = await Promise.all(words.map(word => this.getWordDefinition(word)));
        return this.getRandomElements(definitions, count);
    }
    
    getRandomWords(words, count) {
        return this.getRandomElements(words, count);
    }
    
    getRandomElements(array, count) {
        const shuffled = [...array];
        this.shuffleArray(shuffled);
        return shuffled.slice(0, count);
    }
    
    shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
    }
    
    updateQuizInfo() {
        this.currentQuestionNumSpan.textContent = this.currentQuestionIndex + 1;
        this.totalQuestionsSpan.textContent = this.questions.length;
        this.currentScoreSpan.textContent = this.score;
        
        const progress = this.questions.length > 0 ? 
            ((this.currentQuestionIndex) / this.questions.length) * 100 : 0;
        this.quizProgressFill.style.width = `${progress}%`;
    }
    
    showCurrentQuestion() {
        if (this.currentQuestionIndex >= this.questions.length) {
            this.completeQuiz();
            return;
        }
        
        const question = this.questions[this.currentQuestionIndex];
        
        this.questionText.innerHTML = `<h2>${question.question}</h2>`;
        
        this.questionOptions.innerHTML = '';
        question.options.forEach((option, index) => {
            const optionElement = document.createElement('div');
            optionElement.className = 'quiz-option';
            optionElement.textContent = option.text;
            optionElement.dataset.index = index;
            optionElement.addEventListener('click', () => this.selectOption(index));
            this.questionOptions.appendChild(optionElement);
        });
        
        this.nextQuestionBtn.style.display = 'none';
        
        this.updateQuizInfo();
    }
    
    selectOption(selectedIndex) {
        const question = this.questions[this.currentQuestionIndex];
        const isCorrect = question.options[selectedIndex].isCorrect;
        
        this.questionOptions.querySelectorAll('.quiz-option').forEach(option => {
            option.style.pointerEvents = 'none';
        });
        
        const selectedOption = this.questionOptions.querySelector(`[data-index="${selectedIndex}"]`);
        if (selectedOption) {
            if (isCorrect) {
                selectedOption.classList.add('correct');
                this.correctCount++;
                this.score += 10;
            } else {
                selectedOption.classList.add('incorrect');
                this.wrongCount++;
                this.score -= 5;

                const correctIndex = question.options.findIndex(opt => opt.isCorrect);
                const correctOption = this.questionOptions.querySelector(`[data-index="${correctIndex}"]`);
                if (correctOption) {
                    correctOption.classList.add('correct-answer');
                }
            }
        }
        
        this.updateWordStats(question.correctWord, isCorrect);
        
        this.nextQuestionBtn.style.display = 'inline-block';
        
        this.currentScoreSpan.textContent = this.score;
    }
    
    async updateWordStats(word, isCorrect) {
        try {
            const result = await chrome.storage.local.get(['vocabulary']);
            const vocabulary = result.vocabulary || [];
            
            const wordIndex = vocabulary.findIndex(w => w.word === word);
            if (wordIndex !== -1) {
                const wordData = vocabulary[wordIndex];
                
                if (!window.srsSystem) {
                    window.srsSystem = new SRSSystem();
                }
                
                if (!wordData.srsData) {
                    wordData.srsData = window.srsSystem.initializeSRSData(wordData);
                }
                
                const responseTime = 3000; // 기본값
                
                const quality = window.srsSystem.evaluateQuality(isCorrect, responseTime);
                
                wordData.srsData = window.srsSystem.updateSRSData(wordData.srsData, quality);
                
                if (!wordData.totalAttempts) wordData.totalAttempts = 0;
                if (!wordData.correctCount) wordData.correctCount = 0;
                if (!wordData.wrongCount) wordData.wrongCount = 0;
                
                wordData.totalAttempts++;
                
                if (isCorrect) {
                    wordData.correctCount++;
                } else {
                    wordData.wrongCount++;
                    wordData.lastWrongDate = new Date().toISOString();
                }
                
                wordData.learningPriority = window.srsSystem.calculateReviewPriority(wordData.srsData);
                
                vocabulary[wordIndex] = wordData;
                await chrome.storage.local.set({ vocabulary: vocabulary });
            }
        } catch (error) {
            // Error updating word stats
        }
    }
    
    calculateLearningPriority(wordData) {
        const wrongWeight = wordData.wrongCount * 0.3;
        let timeWeight = 0;
        
        if (wordData.lastWrongDate) {
            const daysSinceLastWrong = (new Date() - new Date(wordData.lastWrongDate)) / (1000 * 60 * 60 * 24);
            timeWeight = Math.max(0, 7 - daysSinceLastWrong) * 0.1;
        }
        
        return Math.min(1.0, wrongWeight + timeWeight);
    }
    
    nextQuestion() {
        this.currentQuestionIndex++;
        this.showCurrentQuestion();
    }
    
    completeQuiz() {
        this.isCompleted = true;
        this.saveQuizResult();
        this.showQuizResult();
    }
    
    showQuizResult() {
        this.quizQuestionContainer.classList.add('hidden');
        this.quizResultContainer.classList.remove('hidden');
        
        this.finalScoreSpan.textContent = this.score;
        this.correctCountSpan.textContent = this.correctCount;
        this.wrongCountSpan.textContent = this.wrongCount;
        this.quizTimeSpentSpan.textContent = this.calculateTimeSpent();
    }
    
    calculateTimeSpent() {
        if (!this.startTime) return '0 min';
        
        const endTime = new Date();
        const diffMs = endTime - this.startTime;
        const diffMinutes = Math.round(diffMs / 60000);
        
        if (diffMinutes < 1) return 'Less than 1 min';
        return `${diffMinutes} min`;
    }
    
    async saveQuizResult() {
        try {
            const result = await chrome.storage.local.get(['todayVocaHistory']);
            const history = result.todayVocaHistory || [];
            
            const today = new Date().toISOString().split('T')[0];
            const todayVoca = history.find(h => h.date === today);
            
            if (todayVoca) {
                todayVoca.quizResults = {
                    totalQuestions: this.questions.length,
                    correctAnswers: this.correctCount,
                    wrongAnswers: this.wrongCount,
                    score: this.score,
                    timeSpent: this.calculateTimeSpent(),
                    completedAt: new Date().toISOString()
                };
                
                await chrome.storage.local.set({ todayVocaHistory: history });
            }
        } catch (error) {
            // Error saving quiz result
        }
    }
    
    retryQuiz() {
        this.currentQuestionIndex = 0;
        this.score = 0;
        this.correctCount = 0;
        this.wrongCount = 0;
        this.startTime = new Date();
        this.isCompleted = false;
        
        this.shuffleArray(this.questions);
        
        this.quizQuestionContainer.classList.remove('hidden');
        this.quizResultContainer.classList.add('hidden');
        this.showCurrentQuestion();
    }
    
    goToTodayVoca() {
        const todayVocaUrl = chrome.runtime.getURL('src/html/today-voca.html');
        window.open(todayVocaUrl, '_blank', 'width=1000,height=800');
    }
    
    goToBoard() {
        const boardUrl = chrome.runtime.getURL('src/html/newtab.html');
        window.open(boardUrl, '_blank', 'width=1200,height=800');
    }
    
    handleKeyboard(event) {
        switch (event.key) {
            case '1':
            case '2':
            case '3':
            case '4':
                event.preventDefault();
                const optionIndex = parseInt(event.key) - 1;
                const options = this.questionOptions.querySelectorAll('.quiz-option');
                if (optionIndex < options.length) {
                    this.selectOption(optionIndex);
                }
                break;
            case 'ArrowRight':
            case ' ':
                event.preventDefault();
                if (this.nextQuestionBtn.style.display !== 'none') {
                    this.nextQuestion();
                }
                break;
            case 'Escape':
                this.goToTodayVoca();
                break;
        }
    }
    
    showLoading(show) {
        if (show) {
            this.loadingOverlay.classList.remove('hidden');
        } else {
            this.loadingOverlay.classList.add('hidden');
        }
    }
}
    
document.addEventListener('DOMContentLoaded', () => {
    new TodayVocaQuiz();
}); 