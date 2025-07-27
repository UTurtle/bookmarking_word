// Quiz JavaScript
class QuizWindow {
    constructor() {
        // Strong prevention of multiple instances
        if (window.quizWindowInstance || window.quizWindowInitializing) {
            console.log('Quiz window already initialized or initializing');
            return;
        }
        
        // Set initialization flags
        window.quizWindowInitializing = true;
        window.quizWindowInstance = this;
        
        this.vocabulary = [];
        this.currentQuiz = null;
        this.selectedQuizType = 'definition-to-word';
        this.isInitialized = false;
        
        this.initializeElements();
        this.bindEvents();
        this.initializeQuiz();
        
        // Reset initialization flag
        window.quizWindowInitializing = false;
    }
    
    initializeElements() {
        this.quizTitle = document.getElementById('quiz-title');
        this.currentQuestionSpan = document.getElementById('current-question');
        this.totalQuestionsSpan = document.getElementById('total-questions');
        this.questionText = document.getElementById('question-text');
        this.quizOptions = document.getElementById('quiz-options');
        this.nextQuestionBtn = document.getElementById('next-question');
        this.quizResult = document.getElementById('quiz-result');
        this.resultMessage = document.getElementById('result-message');
        this.scoreDisplay = document.getElementById('score-display');
        this.closeQuizBtn = document.getElementById('close-quiz');
        
        // Debug: Check for null elements
        const nullElements = [];
        const domElementKeys = [
            'quizTitle', 'currentQuestionSpan', 'totalQuestionsSpan', 'questionText', 
            'quizOptions', 'nextQuestionBtn', 'quizResult', 'resultMessage', 'scoreDisplay', 'closeQuizBtn'
        ];
        
        domElementKeys.forEach(key => {
            if (!this[key]) {
                nullElements.push(key);
            }
        });
        
        if (nullElements.length > 0) {
            console.warn('Null elements found:', nullElements);
        }
    }
    
    bindEvents() {
        if (this.closeQuizBtn) {
            this.closeQuizBtn.addEventListener('click', () => {
                // Reset global flag when window is closed
                if (window.quizWindowOpen !== undefined) {
                    window.quizWindowOpen = false;
                }
                window.close();
            });
        }
        
        if (this.nextQuestionBtn) {
            this.nextQuestionBtn.addEventListener('click', () => {
                this.nextQuestion();
            });
        }
        
        // Listen for window close event
        window.addEventListener('beforeunload', () => {
            // Reset global flag when window is closed
            if (window.quizWindowOpen !== undefined) {
                window.quizWindowOpen = false;
            }
        });
    }
    
    async initializeQuiz() {
        if (this.isInitialized) {
            console.log('Quiz already initialized, skipping...');
            return;
        }
        
        this.isInitialized = true;
        console.log('Initializing quiz...');
        
        // Load vocabulary first
        await this.loadVocabulary();
        
        // Then start quiz
        await this.startQuiz();
    }
    
    async loadVocabulary() {
        try {
            // Show loading message
            if (this.questionText) {
                this.questionText.textContent = 'Loading vocabulary...';
            }
            
            const result = await chrome.storage.local.get(['vocabulary']);
            this.vocabulary = result.vocabulary || [];
            console.log('Vocabulary loaded:', this.vocabulary.length, 'words');
            
            // Show vocabulary count
            if (this.questionText) {
                if (this.vocabulary.length === 0) {
                    this.questionText.textContent = 'No vocabulary words found. Please add some words first!';
                    if (this.quizOptions) {
                        this.quizOptions.innerHTML = '<p style="text-align: center; color: #dc3545;">Please close this window and add some words to your vocabulary.</p>';
                    }
                } else {
                    this.questionText.textContent = `Vocabulary loaded: ${this.vocabulary.length} words found`;
                }
            }
        } catch (error) {
            console.error('Error loading vocabulary:', error);
            this.vocabulary = [];
            if (this.questionText) {
                this.questionText.textContent = 'Error loading vocabulary. Please try again.';
            }
            if (this.quizOptions) {
                this.quizOptions.innerHTML = '<p style="text-align: center; color: #dc3545;">Failed to load vocabulary. Please close this window and try again.</p>';
            }
        }
    }
    
    async startQuiz() {
        // Get quiz type from URL parameters
        const urlParams = new URLSearchParams(window.location.search);
        this.selectedQuizType = urlParams.get('type') || 'definition-to-word';
        
        // Update quiz title
        if (this.quizTitle) {
            this.quizTitle.textContent = this.selectedQuizType === 'word-to-definition' 
                ? '🎯 Word to Definition Quiz' 
                : '🎯 Definition to Word Quiz';
        }
        
        // Check if we have vocabulary words
        if (this.vocabulary.length === 0) {
            console.log('No vocabulary words available');
            return;
        }
        
        // Check if we have enough words
        const validWords = this.vocabulary.filter(word => 
            word.definition && 
            word.definition.trim() !== '' && 
            word.definition !== 'Definition not found' && 
            word.definition !== 'Definition not available'
        );
        
        if (validWords.length < 4) {
            this.showError(`You need at least 4 words with valid definitions to start quizzes! You have ${validWords.length} valid words out of ${this.vocabulary.length} total words.`);
            return;
        }
        
        this.currentQuiz = {
            questions: [],
            currentQuestion: 0,
            score: 0,
            correct: 0,
            incorrect: 0
        };
        
        // Generate quiz questions
        this.currentQuiz.questions = await this.generateQuizQuestions();
        
        if (this.currentQuiz.questions.length === 0) {
            this.showError('Failed to generate quiz questions. Please try again.');
            return;
        }
        
        if (this.totalQuestionsSpan) {
            this.totalQuestionsSpan.textContent = this.currentQuiz.questions.length;
        }
        this.showQuizQuestion();
        console.log('Quiz started with', this.currentQuiz.questions.length, 'questions');
    }
    
    async generateQuizQuestions() {
        const questions = [];
        
        const validWords = this.vocabulary.filter(word => 
            word.definition && 
            word.definition.trim() !== '' && 
            word.definition !== 'Definition not found' && 
            word.definition !== 'Definition not available'
        );
        
        if (validWords.length < 4) {
            console.log('Not enough words with valid definitions for quiz');
            return [];
        }
        
        const shuffledWords = [...validWords].sort(() => Math.random() - 0.5);
        
        // Create 5 questions
        for (let i = 0; i < Math.min(5, shuffledWords.length); i++) {
            const correctWord = shuffledWords[i];
            const otherWords = shuffledWords.filter(w => w.word !== correctWord.word);
            
            // Create 4 options (1 correct + 3 random)
            const options = [correctWord];
            
            // Add 3 random wrong options
            for (let j = 0; j < 3 && otherWords.length > 0; j++) {
                const randomIndex = Math.floor(Math.random() * otherWords.length);
                options.push(otherWords[randomIndex]);
                otherWords.splice(randomIndex, 1);
            }
            
            // Shuffle options
            options.sort(() => Math.random() - 0.5);
            
            const correctIndex = options.findIndex(opt => opt.word === correctWord.word);
            
            questions.push({
                word: correctWord.word,
                definition: correctWord.definition,
                options: options,
                correctIndex: correctIndex
            });
        }
        
        return questions;
    }
    
    showQuizQuestion() {
        if (!this.currentQuiz || this.currentQuiz.currentQuestion >= this.currentQuiz.questions.length) {
            console.log('No quiz or question index out of bounds');
            return;
        }
        
        const question = this.currentQuiz.questions[this.currentQuiz.currentQuestion];
        console.log('Showing question:', question);
        
        // Update question number with null check
        if (this.currentQuestionSpan) {
            this.currentQuestionSpan.textContent = this.currentQuiz.currentQuestion + 1;
        }
        
        // Set question text based on quiz type
        if (this.questionText) {
            if (this.selectedQuizType === 'word-to-definition') {
                this.questionText.textContent = `What does "${question.word}" mean?`;
            } else {
                this.questionText.textContent = `What word means "${question.definition}"?`;
            }
        }
        
        // Generate options HTML
        const isDarkMode = document.body.classList.contains('dark-mode');
        const optionsHTML = question.options.map((option, index) => {
            const optionText = this.selectedQuizType === 'word-to-definition' ? option.definition : option.word;
            return `
                <div class="quiz-option" data-index="${index}">
                    ${optionText}
                </div>
            `;
        }).join('');
        
        // Set options with null check
        if (this.quizOptions) {
            this.quizOptions.innerHTML = optionsHTML;
            
            // Add click events
            this.quizOptions.querySelectorAll('.quiz-option').forEach(option => {
                option.addEventListener('click', () => {
                    this.selectQuizOption(parseInt(option.dataset.index));
                });
            });
        }
        
        console.log('Quiz question displayed successfully');
    }
    
    selectQuizOption(selectedIndex) {
        const question = this.currentQuiz.questions[this.currentQuiz.currentQuestion];
        const isCorrect = selectedIndex === question.correctIndex;
        
        console.log(`Selected option ${selectedIndex}, correct is ${question.correctIndex}, isCorrect: ${isCorrect}`);
        
        // Disable all options with null check
        if (this.quizOptions) {
            this.quizOptions.querySelectorAll('.quiz-option').forEach(option => {
                option.style.pointerEvents = 'none';
            });
            
            // Mark selected option
            const selectedOption = this.quizOptions.querySelector(`[data-index="${selectedIndex}"]`);
            if (selectedOption) {
                if (isCorrect) {
                    selectedOption.classList.add('correct');
                    this.currentQuiz.correct++;
                    this.currentQuiz.score += 10;
                    console.log('Correct answer! +10 points');
                    
                    // 틀린 횟수 카운트 업데이트 (정답인 경우)
                    this.updateWordStats(question.correctWord, true);
                } else {
                    selectedOption.classList.add('incorrect');
                    this.currentQuiz.incorrect++;
                    this.currentQuiz.score -= 10;
                    
                    // Show correct answer
                    const correctOption = this.quizOptions.querySelector(`[data-index="${question.correctIndex}"]`);
                    if (correctOption) {
                        correctOption.classList.add('correct');
                    }
                    
                    console.log('Wrong answer. Correct was:', question.options[question.correctIndex].word, '-10 points');
                    
                    // 틀린 횟수 카운트 업데이트 (오답인 경우)
                    this.updateWordStats(question.correctWord, false);
                }
            }
        }
        
        // Show next button
        if (this.nextQuestionBtn) {
            this.nextQuestionBtn.style.display = 'inline-block';
        }
    }
    
    nextQuestion() {
        this.currentQuiz.currentQuestion++;
        
        if (this.currentQuiz.currentQuestion >= this.currentQuiz.questions.length) {
            this.finishQuiz();
        } else {
            this.showQuizQuestion();
            if (this.nextQuestionBtn) {
                this.nextQuestionBtn.style.display = 'none';
            }
        }
    }
    
    async finishQuiz() {
        console.log('Finishing quiz...');
        
        const finalScore = this.currentQuiz.score;
        
        // Update statistics
        await this.updateQuizStatistics(finalScore);
        
        // Show results
        if (this.resultMessage) {
            this.resultMessage.textContent = `Quiz completed! Final score: ${finalScore}`;
        }
        
        if (this.scoreDisplay) {
            this.scoreDisplay.textContent = `Correct: ${this.currentQuiz.correct}, Incorrect: ${this.currentQuiz.incorrect}`;
        }
        
        // Hide quiz question and show results
        const quizQuestion = document.querySelector('.quiz-question');
        if (quizQuestion) {
            quizQuestion.style.display = 'none';
        }
        
        if (this.quizResult) {
            this.quizResult.style.display = 'block';
        }
        
        if (this.nextQuestionBtn) {
            this.nextQuestionBtn.style.display = 'none';
        }
        
        console.log('Quiz results displayed');
    }
    
    async updateWordStats(word, isCorrect) {
        try {
            // 단어장에서 해당 단어 찾기
            const wordIndex = this.vocabulary.findIndex(w => w.word === word);
            if (wordIndex !== -1) {
                const wordData = this.vocabulary[wordIndex];
                
                // 기존 통계 데이터가 없으면 초기화
                if (!wordData.totalAttempts) wordData.totalAttempts = 0;
                if (!wordData.correctCount) wordData.correctCount = 0;
                if (!wordData.wrongCount) wordData.wrongCount = 0;
                
                // 통계 업데이트
                wordData.totalAttempts++;
                
                if (isCorrect) {
                    wordData.correctCount++;
                } else {
                    wordData.wrongCount++;
                    wordData.lastWrongDate = new Date().toISOString();
                }
                
                // 학습 우선순위 계산 (틀린 횟수와 시간 기반)
                wordData.learningPriority = this.calculateLearningPriority(wordData);
                
                // 단어장 업데이트
                this.vocabulary[wordIndex] = wordData;
                await chrome.storage.local.set({ vocabulary: this.vocabulary });
                
                console.log(`Updated stats for "${word}": attempts=${wordData.totalAttempts}, correct=${wordData.correctCount}, wrong=${wordData.wrongCount}`);
            }
        } catch (error) {
            console.error('Error updating word stats:', error);
        }
    }
    
    calculateLearningPriority(wordData) {
        // 틀린 횟수가 많을수록, 최근에 틀렸을수록 높은 우선순위
        const wrongWeight = wordData.wrongCount * 0.3;
        const timeWeight = 0;
        
        if (wordData.lastWrongDate) {
            const daysSinceLastWrong = (new Date() - new Date(wordData.lastWrongDate)) / (1000 * 60 * 60 * 24);
            timeWeight = Math.max(0, 7 - daysSinceLastWrong) * 0.1; // 최대 7일
        }
        
        return Math.min(1.0, wrongWeight + timeWeight);
    }
    
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
            
            console.log('Quiz statistics updated');
        } catch (error) {
            console.error('Error updating quiz statistics:', error);
        }
    }
    
    showError(message) {
        console.error('Quiz error:', message);
        
        if (this.questionText) {
            this.questionText.textContent = message;
        }
        
        if (this.quizOptions) {
            this.quizOptions.innerHTML = `
                <div style="text-align: center; padding: 20px;">
                    <p style="color: #dc3545; margin-bottom: 15px; font-weight: 600;">${message}</p>
                    <p style="color: #666; font-size: 0.9rem;">Please close this window and try again.</p>
                </div>
            `;
        }
        
        // Hide quiz progress
        const quizProgress = document.querySelector('.quiz-progress');
        if (quizProgress) {
            quizProgress.style.display = 'none';
        }
        
        // Hide quiz navigation
        const quizNavigation = document.querySelector('.quiz-navigation');
        if (quizNavigation) {
            quizNavigation.style.display = 'none';
        }
    }
}

// Initialize QuizWindow when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Prevent multiple initializations
    if (window.quizWindowInstance || window.quizWindowInitializing) {
        console.log('Quiz window already initialized, skipping...');
        return;
    }
    
    new QuizWindow();
}); 