// Popup script for Vocabulary Bookmarker
console.log('Popup script loaded');

class VocabularyPopup {
    constructor() {
        this.vocabulary = [];
        this.filteredVocabulary = [];
        this.searchTerm = '';
        
        this.initializeElements();
        this.bindEvents();
        this.loadVocabulary();
        this.loadSettings();
    }
    
    initializeElements() {
        // Main elements
        this.searchInput = document.getElementById('search-input');
        this.wordsList = document.getElementById('words-list');
        this.wordCount = document.getElementById('word-count');
        this.exportBtn = document.getElementById('export-btn');
        this.clearAllBtn = document.getElementById('clear-all-btn');
        

        
        // Settings elements
        this.toggle = document.getElementById('toggle');
        this.customShortcutInput = document.getElementById('custom-shortcut');
        this.saveShortcutBtn = document.getElementById('save-shortcut-btn');
        this.resetShortcutBtn = document.getElementById('reset-shortcut-btn');
    }
    
    bindEvents() {
        // Search functionality
        this.searchInput.addEventListener('input', (e) => {
            this.searchTerm = e.target.value.toLowerCase();
            this.filterVocabulary();
            this.renderVocabulary();
        });
        
        // Action buttons
        this.exportBtn.addEventListener('click', () => this.exportToCSV());
        this.clearAllBtn.addEventListener('click', () => this.clearAllWords());
        

        
        // Settings
        this.toggle.addEventListener('click', () => this.toggleHighlightMode());
        this.saveShortcutBtn.addEventListener('click', () => this.saveCustomShortcut());
        this.resetShortcutBtn.addEventListener('click', () => this.resetCustomShortcut());
        
        // Shortcut input handling
        this.customShortcutInput.addEventListener('input', (e) => {
            this.formatShortcutInput(e.target);
        });
    }
    
    async loadVocabulary() {
        try {
            const result = await chrome.storage.local.get(['vocabulary']);
            this.vocabulary = result.vocabulary || [];
            this.filteredVocabulary = [...this.vocabulary];
            this.updateWordCount();
            this.renderVocabulary();
        } catch (error) {
            console.error('Error loading vocabulary:', error);
            this.showError('Failed to load vocabulary');
        }
    }
    
    async loadSettings() {
        try {
            const result = await chrome.storage.local.get(['highlightMode', 'customShortcut']);
            
            // Load highlight mode
            const highlightMode = result.highlightMode || false;
            if (highlightMode) {
                this.toggle.classList.add('active');
            } else {
                this.toggle.classList.remove('active');
            }
            
            // Load custom shortcut
            const customShortcut = result.customShortcut || '';
            this.customShortcutInput.value = customShortcut;
            
        } catch (error) {
            console.error('Error loading settings:', error);
        }
    }
    
    filterVocabulary() {
        if (!this.searchTerm) {
            this.filteredVocabulary = [...this.vocabulary];
        } else {
            this.filteredVocabulary = this.vocabulary.filter(word => 
                word.word.toLowerCase().includes(this.searchTerm) ||
                word.definition.toLowerCase().includes(this.searchTerm)
            );
        }
    }
    
    renderVocabulary() {
        if (this.filteredVocabulary.length === 0) {
            if (this.vocabulary.length === 0) {
                this.wordsList.innerHTML = `
                    <div class="empty-state">
                        <div class="icon">📚</div>
                        <div>No words saved yet</div>
                        <div style="font-size: 12px; margin-top: 10px;">
                            Select text on any webpage and use Ctrl+Shift+S to save words
                        </div>
                    </div>
                `;
            } else {
                this.wordsList.innerHTML = `
                    <div class="empty-state">
                        <div class="icon">🔍</div>
                        <div>No words match your search</div>
                    </div>
                `;
            }
            return;
        }
        
        this.wordsList.innerHTML = this.filteredVocabulary.map(word => `
            <div class="word-item" data-word="${word.word}">
                <div class="word-header">
                    <div class="word-text">${this.escapeHtml(word.word)}</div>
                    <div class="word-date">${this.formatDate(word.dateAdded)}</div>
                </div>
                <div class="word-definition">${this.escapeHtml(word.definition)}</div>
                <div class="word-actions">
                    <button class="btn btn-outline delete-word-btn" data-word="${word.word}">Delete</button>
                </div>
            </div>
        `).join('');
        
        // Add delete event listeners
        this.wordsList.querySelectorAll('.delete-word-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const word = e.target.dataset.word;
                this.deleteWord(word);
            });
        });
    }
    
    async deleteWord(wordToDelete) {
        try {
            this.vocabulary = this.vocabulary.filter(word => word.word !== wordToDelete);
            await chrome.storage.local.set({ vocabulary: this.vocabulary });
            this.filterVocabulary();
            this.renderVocabulary();
            this.updateWordCount();
        } catch (error) {
            console.error('Error deleting word:', error);
            this.showError('Failed to delete word');
        }
    }
    
    async clearAllWords() {
        if (!confirm('Are you sure you want to delete all saved words? This action cannot be undone.')) {
            return;
        }
        
        try {
            this.vocabulary = [];
            await chrome.storage.local.set({ vocabulary: this.vocabulary });
            this.filterVocabulary();
            this.renderVocabulary();
            this.updateWordCount();
        } catch (error) {
            console.error('Error clearing words:', error);
            this.showError('Failed to clear words');
        }
    }
    
    async exportToCSV() {
        if (this.vocabulary.length === 0) {
            this.showError('No words to export');
            return;
        }
        
        try {
            const csvContent = this.generateCSV();
            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `vocabulary_${new Date().toISOString().split('T')[0]}.csv`;
            link.click();
            URL.revokeObjectURL(url);
        } catch (error) {
            console.error('Error exporting CSV:', error);
            this.showError('Failed to export CSV');
        }
    }
    
    generateCSV() {
        const headers = ['Word', 'Definition', 'Date Added', 'Review Count', 'URL'];
        const rows = this.vocabulary.map(word => [
            word.word,
            word.definition,
            word.dateAdded,
            word.reviewCount || 0,
            word.url || ''
        ]);
        
        return [headers, ...rows]
            .map(row => row.map(cell => `"${cell.replace(/"/g, '""')}"`).join(','))
            .join('\n');
    }
    
    async toggleHighlightMode() {
        try {
            const isActive = this.toggle.classList.contains('active');
            const newState = !isActive;
            
            this.toggle.classList.toggle('active');
            await chrome.storage.local.set({ highlightMode: newState });
            
            // Send message to content script
            const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
            if (tabs[0]) {
                chrome.tabs.sendMessage(tabs[0].id, {
                    action: 'updateHighlightMode',
                    highlightMode: newState
                });
            }
        } catch (error) {
            console.error('Error toggling highlight mode:', error);
            this.showError('Failed to update highlight mode');
        }
    }
    
    async saveCustomShortcut() {
        try {
            const shortcut = this.customShortcutInput.value.trim();
            if (!shortcut) {
                this.showError('Please enter a shortcut');
                return;
            }
            
            await chrome.storage.local.set({ customShortcut: shortcut });
            this.showSuccess('Shortcut saved successfully');
        } catch (error) {
            console.error('Error saving shortcut:', error);
            this.showError('Failed to save shortcut');
        }
    }
    
    async resetCustomShortcut() {
        try {
            this.customShortcutInput.value = '';
            await chrome.storage.local.remove(['customShortcut']);
            this.showSuccess('Shortcut reset to default (Ctrl+Shift+S)');
        } catch (error) {
            console.error('Error resetting shortcut:', error);
            this.showError('Failed to reset shortcut');
        }
    }
    
    formatShortcutInput(input) {
        let value = input.value;
        
        // Auto-format the input
        value = value.replace(/\s+/g, ' ').trim();
        value = value.replace(/([a-z])/g, (match, letter) => letter.toUpperCase());
        
        input.value = value;
    }
    
    updateWordCount() {
        const count = this.vocabulary.length;
        this.wordCount.textContent = `${count} word${count !== 1 ? 's' : ''}`;
    }
    
    formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString();
    }
    
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
    
    showError(message) {
        // Simple error display - you could enhance this with a proper toast
        alert(`Error: ${message}`);
    }
    
    showSuccess(message) {
        // Simple success display - you could enhance this with a proper toast
        alert(`Success: ${message}`);
    }
    

}

// Initialize popup when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM loaded, initializing VocabularyPopup');
    try {
        const popup = new VocabularyPopup();
        console.log('VocabularyPopup initialized successfully');
        

        
    } catch (error) {
        console.error('Error initializing VocabularyPopup:', error);
    }
}); 