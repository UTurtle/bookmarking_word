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
        this.animationToggle = document.getElementById('animation-toggle');
        this.pdfRedirectToggle = document.getElementById('pdf-redirect-toggle');
        this.darkModeToggle = document.getElementById('dark-mode-toggle');

        this.streakBonusToggle = document.getElementById('streak-bonus-toggle');
        this.newtabOverrideToggle = document.getElementById('newtab-override-toggle');
        this.todayVocaToggle = document.getElementById('today-voca-toggle');
        this.openMainBtn = document.getElementById('open-main-btn');
        this.customShortcutInput = document.getElementById('custom-shortcut');
        this.saveShortcutBtn = document.getElementById('save-shortcut-btn');
        this.resetShortcutBtn = document.getElementById('reset-shortcut-btn');
        
        // Today Voca settings
        this.todayVocaWordsCountInput = document.getElementById('today-voca-words-count');
        this.saveWordsCountBtn = document.getElementById('save-words-count-btn');

        // Permission request buttons
        this.requestPdfPermissionsBtn = document.getElementById('request-pdf-permissions');
        this.requestTabsPermissionsBtn = document.getElementById('request-tabs-permissions');
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
        this.animationToggle.addEventListener('click', () => this.toggleAnimation());
        this.pdfRedirectToggle.addEventListener('click', () => this.togglePdfRedirect());
        this.darkModeToggle.addEventListener('click', () => this.toggleDarkMode());

        this.streakBonusToggle.addEventListener('click', () => this.toggleStreakBonus());
        this.newtabOverrideToggle.addEventListener('click', () => this.toggleNewtabOverride());
        this.todayVocaToggle.addEventListener('click', () => this.toggleTodayVoca());
        this.openMainBtn.addEventListener('click', () => this.openMainBoard());
        this.saveShortcutBtn.addEventListener('click', () => this.saveCustomShortcut());
        this.resetShortcutBtn.addEventListener('click', () => this.resetCustomShortcut());
        
        // Today Voca settings
        this.saveWordsCountBtn.addEventListener('click', () => this.saveTodayVocaWordsCount());
        
        // Shortcut input handling
        this.customShortcutInput.addEventListener('input', (e) => {
            this.formatShortcutInput(e.target);
        });

        // Permission request buttons
        if (this.requestPdfPermissionsBtn) {
            this.requestPdfPermissionsBtn.addEventListener('click', () => this.requestPdfPermissions());
        }
        if (this.requestTabsPermissionsBtn) {
            this.requestTabsPermissionsBtn.addEventListener('click', () => this.requestTabsPermission());
        }
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
            const result = await chrome.storage.local.get([
                'highlightMode', 
                'animationsEnabled', 
                'pdfAutoRedirect', 
                'darkMode',

                'streakBonusEnabled',
                'newtabOverride',
                'todayVocaPriority',
                'customShortcut',
                'todayVocaSettings'
            ]);
            
            // Load highlight mode
            const highlightMode = result.highlightMode || false;
            if (highlightMode) {
                this.toggle.classList.add('active');
            } else {
                this.toggle.classList.remove('active');
            }
            
            // Load animation setting
            const animationsEnabled = result.animationsEnabled || false; // Default to false
            if (animationsEnabled) {
                this.animationToggle.classList.add('active');
            } else {
                this.animationToggle.classList.remove('active');
            }
            
            // Load PDF redirect setting (default to false for compliance)
            const pdfAutoRedirect = result.pdfAutoRedirect || false;
            if (pdfAutoRedirect) {
                this.pdfRedirectToggle.classList.add('active');
            } else {
                this.pdfRedirectToggle.classList.remove('active');
            }
            
            // Load dark mode setting
            const darkMode = result.darkMode || false;
            if (darkMode) {
                this.darkModeToggle.classList.add('active');
            } else {
                this.darkModeToggle.classList.remove('active');
            }
            

            
            // Load streak bonus setting
            const streakBonusEnabled = result.streakBonusEnabled !== false; // Default to true
            if (streakBonusEnabled) {
                this.streakBonusToggle.classList.add('active');
            } else {
                this.streakBonusToggle.classList.remove('active');
            }
            
            // Load newtab override setting (default to true)
            const newtabOverride = result.newtabOverride !== false; // Default to true
            if (newtabOverride) {
                this.newtabOverrideToggle.classList.add('active');
            } else {
                this.newtabOverrideToggle.classList.remove('active');
            }
            
            // Load Today Voca priority setting (default to false)
            const todayVocaPriority = result.todayVocaPriority || false; // Default to false
            if (todayVocaPriority) {
                this.todayVocaToggle.classList.add('active');
            } else {
                this.todayVocaToggle.classList.remove('active');
            }
            
            // Load custom shortcut
            const customShortcut = result.customShortcut || '';
            this.customShortcutInput.value = customShortcut;
            
            // Load Today Voca settings
            const todayVocaSettings = result.todayVocaSettings || {};
            const wordsPerDay = todayVocaSettings.wordsPerDay || 10;
            this.todayVocaWordsCountInput.value = wordsPerDay;
            
        } catch (error) {
            console.error('Error loading settings:', error);
        }
    }

    // Update permission request buttons - now all permissions are required
    async updatePermissionButtons() {
        try {
            // Update PDF permissions button
            const pdfPermissionsBtn = document.getElementById('request-pdf-permissions');
            if (pdfPermissionsBtn) {
                pdfPermissionsBtn.textContent = 'Permission Granted';
                pdfPermissionsBtn.disabled = true;
                pdfPermissionsBtn.style.background = '#28a745';
            }
            
            // Update tabs permissions button
            const tabsPermissionsBtn = document.getElementById('request-tabs-permissions');
            if (tabsPermissionsBtn) {
                tabsPermissionsBtn.textContent = 'Permission Granted';
                tabsPermissionsBtn.disabled = true;
                tabsPermissionsBtn.style.background = '#28a745';
            }
        } catch (error) {
            console.error('Error updating permission buttons:', error);
        }
    }

    // Request PDF-related permissions - now all permissions are required
    async requestPdfPermissions() {
        this.showMessage('PDF features are now enabled by default!', 'success');
        this.updatePermissionButtons();
    }

    // Request tabs permission - now all permissions are required
    async requestTabsPermission() {
        this.showMessage('New tab override is now enabled by default!', 'success');
        this.updatePermissionButtons();
    }

    // Show message to user
    showMessage(message, type = 'info') {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message message-${type}`;
        messageDiv.textContent = message;
        messageDiv.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 10px 15px;
            border-radius: 5px;
            color: white;
            font-size: 0.9rem;
            z-index: 1000;
            background: ${type === 'success' ? '#28a745' : type === 'error' ? '#dc3545' : '#17a2b8'};
        `;
        
        document.body.appendChild(messageDiv);
        
        setTimeout(() => {
            messageDiv.remove();
        }, 3000);
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
    
    async toggleAnimation() {
        try {
            const isActive = this.animationToggle.classList.contains('active');
            const newState = !isActive;
            
            this.animationToggle.classList.toggle('active');
            await chrome.storage.local.set({ animationsEnabled: newState });
        } catch (error) {
            console.error('Error toggling animation:', error);
            this.showError('Failed to update animation setting');
        }
    }
    
    async togglePdfRedirect() {
        try {
            const isActive = this.pdfRedirectToggle.classList.contains('active');
            const newState = !isActive;
            
            this.pdfRedirectToggle.classList.toggle('active');
            await chrome.storage.local.set({ pdfAutoRedirect: newState });
        } catch (error) {
            console.error('Error toggling PDF redirect:', error);
            this.showError('Failed to update PDF redirect setting');
        }
    }
    
    async toggleDarkMode() {
        try {
            const isActive = this.darkModeToggle.classList.contains('active');
            const newState = !isActive;
            
            this.darkModeToggle.classList.toggle('active');
            await chrome.storage.local.set({ darkMode: newState });
        } catch (error) {
            console.error('Error toggling dark mode:', error);
            this.showError('Failed to update dark mode setting');
        }
    }
    

    
    async toggleStreakBonus() {
        try {
            const isActive = this.streakBonusToggle.classList.contains('active');
            const newState = !isActive;
            
            this.streakBonusToggle.classList.toggle('active');
            await chrome.storage.local.set({ streakBonusEnabled: newState });
        } catch (error) {
            console.error('Error toggling streak bonus:', error);
            this.showError('Failed to update streak bonus setting');
        }
    }
    
    async toggleNewtabOverride() {
        try {
            const isActive = this.newtabOverrideToggle.classList.contains('active');
            const newState = !isActive;
            
            // Update UI immediately
            this.newtabOverrideToggle.classList.toggle('active');
            
            // Save to storage
            await chrome.storage.local.set({ newtabOverride: newState });
            
            // Show success message
            if (newState) {
                this.showSuccess('New tab override enabled - new tabs will show vocabulary board');
            } else {
                this.showSuccess('New tab override disabled - new tabs will show default page');
            }
        } catch (error) {
            console.error('Error toggling newtab override:', error);
            this.showError('Failed to update newtab override setting');
        }
    }
    
    async toggleTodayVoca() {
        try {
            const isActive = this.todayVocaToggle.classList.contains('active');
            const newState = !isActive;
            
            // Update UI immediately
            this.todayVocaToggle.classList.toggle('active');
            
            // Save to storage
            await chrome.storage.local.set({ todayVocaPriority: newState });
            
            // Show success message
            if (newState) {
                this.showSuccess('Today Voca priority enabled - new tabs will show Today Voca');
            } else {
                this.showSuccess('Today Voca priority disabled - new tabs will show vocabulary board');
            }
        } catch (error) {
            console.error('Error toggling Today Voca priority:', error);
            this.showError('Failed to update Today Voca priority setting');
        }
    }
    
    async openMainBoard() {
        try {
            const newtabUrl = chrome.runtime.getURL('src/html/newtab.html');
            
            // Try to update current tab first (uses activeTab permission)
            const [currentTab] = await chrome.tabs.query({ active: true, currentWindow: true });
            if (currentTab) {
                await chrome.tabs.update(currentTab.id, { url: newtabUrl });
                console.log('Current tab updated to main board');
            } else {
                // Fallback to creating new tab if current tab not found
                await chrome.tabs.create({ url: newtabUrl });
            }
        } catch (error) {
            console.error('Error opening main board:', error);
            this.showError('Failed to open vocabulary board');
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
    
    async saveTodayVocaWordsCount() {
        try {
            const wordsCount = parseInt(this.todayVocaWordsCountInput.value);
            
            if (isNaN(wordsCount) || wordsCount < 1 || wordsCount > 50) {
                this.showError('Please enter a valid number between 1 and 50');
                return;
            }
            
            const todayVocaSettings = {
                wordsPerDay: wordsCount
            };
            
            await chrome.storage.local.set({ todayVocaSettings });
            this.showSuccess(`Today Voca words count saved: ${wordsCount}`);
        } catch (error) {
            console.error('Error saving Today Voca words count:', error);
            this.showError('Failed to save words count');
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
document.addEventListener('DOMContentLoaded', async function() {
    console.log('DOM loaded, initializing VocabularyPopup');
    try {
        const popup = new VocabularyPopup();
        console.log('VocabularyPopup initialized successfully');
        
        // Update permission buttons after initialization
        await popup.updatePermissionButtons();
        
    } catch (error) {
        console.error('Error initializing VocabularyPopup:', error);
    }
}); 