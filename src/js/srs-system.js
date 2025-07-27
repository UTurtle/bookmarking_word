// SRS (Spaced Repetition System) - SuperMemo SM-2 Algorithm
class SRSSystem {
    constructor() {
        this.settings = {
            minInterval: 1,
            maxInterval: 365,
            easeFactor: 2.5,
            minEaseFactor: 1.3,
            maxEaseFactor: 2.5,
            consecutiveCorrect: 0,
            consecutiveWrong: 0
        };
    }
    
    initializeSRSData(word) {
        return {
            interval: 0,
            repetitions: 0,
            easeFactor: this.settings.easeFactor,
            nextReview: new Date(),
            lastReview: null,
            quality: 0,
            streak: 0,
            totalReviews: 0,
            correctReviews: 0,
            wrongReviews: 0
        };
    }
    
    updateSRSData(srsData, quality) {
        quality = Math.max(0, Math.min(5, quality));
        
        const oldSrsData = { ...srsData };
        
        if (quality < 3) {
            srsData.interval = 1;
            srsData.repetitions = 0;
        } else {
            srsData.repetitions += 1;
            
            if (srsData.repetitions === 1) {
                srsData.interval = 1;
            } else if (srsData.repetitions === 2) {
                srsData.interval = 6;
            } else {
                srsData.interval = Math.round(srsData.interval * srsData.easeFactor);
            }
            
            srsData.interval = Math.min(srsData.interval, this.settings.maxInterval);
        }
        
        srsData.easeFactor = this.calculateNewEaseFactor(srsData.easeFactor, quality);
        
        const now = new Date();
        srsData.lastReview = now;
        srsData.nextReview = new Date(now.getTime() + srsData.interval * 24 * 60 * 60 * 1000);
        
        srsData.totalReviews += 1;
        if (quality >= 3) {
            srsData.correctReviews += 1;
            srsData.streak += 1;
            srsData.consecutiveWrong = 0;
        } else {
            srsData.wrongReviews += 1;
            srsData.streak = 0;
            srsData.consecutiveWrong += 1;
        }
        
        srsData.quality = quality;
        
        return srsData;
    }
    
    calculateNewEaseFactor(oldEaseFactor, quality) {
        let newEaseFactor = oldEaseFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
        
        newEaseFactor = Math.max(this.settings.minEaseFactor, 
                                Math.min(this.settings.maxEaseFactor, newEaseFactor));
        
        return newEaseFactor;
    }
    
    calculateReviewPriority(srsData) {
        if (!srsData) return 0;
        
        const now = new Date();
        const nextReview = new Date(srsData.nextReview);
        
        if (nextReview <= now) {
            const daysOverdue = Math.floor((now - nextReview) / (24 * 60 * 60 * 1000));
            return 1000 + daysOverdue;
        }
        
        const daysUntilReview = Math.floor((nextReview - now) / (24 * 60 * 60 * 1000));
        if (daysUntilReview <= 1) {
            return 500 - daysUntilReview;
        }
        
        return Math.max(0, 100 - daysUntilReview);
    }
    
    calculateDifficulty(srsData) {
        if (!srsData) return 0;
        
        const accuracy = srsData.totalReviews > 0 ? 
            srsData.correctReviews / srsData.totalReviews : 0;
        
        const difficulty = 1 - accuracy;
        return Math.max(0, Math.min(1, difficulty));
    }
    
    selectWordsForTodayVoca(vocabulary, count = 5) {
        console.log('SRS: Selecting words for Today Voca');
        console.log('SRS: Total vocabulary:', vocabulary.length);
        console.log('SRS: Requested count:', count);
        
        const now = new Date();
        console.log('SRS: Current time:', now);
        
        const availableWords = vocabulary.filter(word => {
            if (word.isArchived) {
                console.log(`SRS: Excluding archived word: ${word.word}`);
                return false;
            }
            
            if (!word.srsData) {
                console.log(`SRS: Including word without SRS data: ${word.word}`);
                return true;
            }
            
            const nextReview = new Date(word.srsData.nextReview);
            const isDue = nextReview <= now;
            console.log(`SRS: Word ${word.word} - nextReview: ${nextReview}, isDue: ${isDue}`);
            return isDue;
        });
        
        console.log('SRS: Available words after filtering:', availableWords.length);
        console.log('SRS: Available words:', availableWords.map(w => w.word));
        
        availableWords.sort((a, b) => {
            const priorityA = this.calculateReviewPriority(a.srsData);
            const priorityB = this.calculateReviewPriority(b.srsData);
            
            if (priorityA !== priorityB) {
                return priorityB - priorityA;
            }
            
            const difficultyA = this.calculateDifficulty(a.srsData);
            const difficultyB = this.calculateDifficulty(b.srsData);
            return difficultyB - difficultyA;
        });
        
        const result = availableWords.slice(0, count);
        console.log('SRS: Final selected words:', result.length);
        console.log('SRS: Final words:', result.map(w => w.word));
        
        return result;
    }
    
    evaluateQuality(isCorrect, responseTime = null, confidence = null) {
        let quality = 3;
        
        if (isCorrect) {
            if (responseTime && responseTime < 2000) {
                quality = 5;
            } else if (responseTime && responseTime < 5000) {
                quality = 4;
            } else {
                quality = 3;
            }
        } else {
            if (confidence && confidence > 0.7) {
                quality = 1;
            } else {
                quality = 2;
            }
        }
        
        return quality;
    }
    
    calculateSRSStats(vocabulary) {
        const stats = {
            totalWords: vocabulary.length,
            wordsWithSRS: 0,
            wordsDueToday: 0,
            wordsOverdue: 0,
            averageAccuracy: 0,
            totalReviews: 0,
            correctReviews: 0
        };
        
        const now = new Date();
        
        vocabulary.forEach(word => {
            if (word.srsData) {
                stats.wordsWithSRS++;
                stats.totalReviews += word.srsData.totalReviews;
                stats.correctReviews += word.srsData.correctReviews;
                
                const nextReview = new Date(word.srsData.nextReview);
                if (nextReview <= now) {
                    stats.wordsDueToday++;
                    
                    const daysOverdue = Math.floor((now - nextReview) / (24 * 60 * 60 * 1000));
                    if (daysOverdue > 0) {
                        stats.wordsOverdue++;
                    }
                }
            }
        });
        
        if (stats.totalReviews > 0) {
            stats.averageAccuracy = stats.correctReviews / stats.totalReviews;
        }
        
        return stats;
    }
    
    calculateProgress(vocabulary) {
        const stats = this.calculateSRSStats(vocabulary);
        
        if (stats.totalWords === 0) return 0;
        
        const srsRatio = stats.wordsWithSRS / stats.totalWords;
        const accuracy = stats.averageAccuracy;
        const complianceRatio = stats.wordsWithSRS > 0 ? 
            (stats.wordsWithSRS - stats.wordsOverdue) / stats.wordsWithSRS : 1;
        
        const progress = (srsRatio * 0.3) + (accuracy * 0.4) + (complianceRatio * 0.3);
        
        return Math.max(0, Math.min(1, progress));
    }
}

window.srsSystem = new SRSSystem(); 