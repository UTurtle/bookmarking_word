// Content Script for Vocabulary Bookmarker
// Check if we're on the newtab page and exit early
const currentUrl = window.location.href;
const isNewTabPage = currentUrl.includes('newtab.html') || 
                     currentUrl.includes('chrome://newtab') ||
                     (currentUrl.includes('chrome-extension://') && currentUrl.includes('newtab'));

if (isNewTabPage) {
    console.log('Content script disabled on newtab page:', currentUrl);
    // Don't initialize any functionality on newtab page
    // Just exit gracefully
} else {
    console.log('Content script loaded on:', currentUrl);
    
    let selectedText = '';
    let indicator = null;
    let highlightMode = false;
    let highlightedWords = [];
    let highlightElements = [];
    let selectionTimeout = null;
    let saveIndicator = null;
    let highlightSaveButton = null;
    let chromeAPIAvailable = true;
    let consecutiveErrors = 0;
    const MAX_CONSECUTIVE_ERRORS = 3;
    let isPDFViewer = false;
    let pdfMode = false;


// Listen for text selection with multiple events (non-PDF only)
// mouseup event is only used for popup display
document.addEventListener('mouseup', () => {
  console.log('[Content Script] mouseup event fired');
  setTimeout(() => {
    const currentSelectedText = window.getSelection().toString().trim();
    console.log('[Content Script] Selected text:', currentSelectedText);
    
    if (currentSelectedText.length > 0 && currentSelectedText !== selectedText) {
      // Check if this text is already highlighted
      const isAlreadyHighlighted = highlightedWords.includes(currentSelectedText);
      if (isAlreadyHighlighted) {
        console.log('[Content Script] Text already highlighted, skipping');
        return;
      }
      
      selectedText = currentSelectedText;
      console.log('[Content Script] New text selected:', selectedText);
      
      if (highlightMode) {
        console.log('[Content Script] Highlight mode active, highlighting text');
        highlightSelectedText();
      } else {
        console.log('[Content Script] Normal mode, showing save indicator');
        showSaveIndicator();
      }
    }
  }, 10);
});

// mousedown event is only used for popup hiding
document.addEventListener('mousedown', (e) => {
      // Ignore if clicking on the popup itself
  if (indicator && indicator.contains(e.target)) {
    return;
  }
  
  // Only hide popup when not in highlight mode
  if (!highlightMode) {
    hideSaveIndicator();
  }
});

document.addEventListener('keyup', handleTextSelection);
document.addEventListener('touchend', handleTextSelection); // For mobile devices

// Also listen for selection changes
document.addEventListener('selectionchange', () => {

  // Ignore in input, textarea, etc.
  const active = document.activeElement;
  if (active && (active.tagName === 'INPUT' || active.tagName === 'TEXTAREA' || active.isContentEditable)) {
    // hideSaveIndicator();
    return;
  }
  const sel = window.getSelection().toString().trim();
  if (sel && sel !== selectedText) {
    // Check if this text is already highlighted
    const isAlreadyHighlighted = highlightedWords.includes(sel);
    if (isAlreadyHighlighted) {
      return;
    }
    
    selectedText = sel;
    setTimeout(() => {
      if (highlightMode) {
        highlightSelectedText();
      } else {
        showSaveIndicator();
      }
    }, 0); // Execute in next event loop
  } else if (!sel) {
    selectedText = '';
    if (highlightMode) {
      // Don't clear highlights when text is deselected in highlight mode
      // Only clear when mode is turned off
    } else {
      // Hide popup when text is deselected while popup is displayed
      const indicator = document.getElementById('vocab-save-indicator');
      if (indicator && indicator.style.display !== 'none') {
        hideSaveIndicator();
        return;
      }
    }
  }
});

// Detect PDF.js based PDF viewer environment
function detectPDFViewer() {
  // Log current URL
      console.log('Current page URL:', window.location.href);
    console.log('Current page domain:', window.location.hostname);
  
  // PDF.js viewer usually has classes like .pdfViewer, .textLayer, .viewer
  if (document.querySelector('.pdfViewer, .textLayer, .viewer, canvas')) {
    isPDFViewer = true;
          pdfMode = true; // Enable PDF mode
      console.log('PDF.js based PDF viewer detected');
          console.log('PDF.js viewer DOM structure:', {
      pdfViewer: !!document.querySelector('.pdfViewer'),
      textLayer: !!document.querySelector('.textLayer'),
      viewer: !!document.querySelector('.viewer'),
      canvas: !!document.querySelector('canvas')
    });
  } else {
    isPDFViewer = false;
    pdfMode = false; // Disable PDF mode
    console.log('PDF.js viewer not detected');
  }
}

detectPDFViewer();

// Enhance selectionchange event for PDF.js viewer environment to show popup on text selection
if (isPDFViewer) {
  document.addEventListener('selectionchange', () => {
    const sel = window.getSelection().toString().trim();
    console.log('[PDF] selectionchange fired, sel:', sel);
    if (sel && sel !== selectedText) {
      selectedText = sel;
      showSaveIndicator();
      console.log('[PDF] showSaveIndicator called for:', sel);
    }
  });
  
  // Additional: Log mouseup event in PDF.js environment
  document.addEventListener('mouseup', () => {
    const sel = window.getSelection().toString().trim();
    console.log('[PDF] mouseup fired, sel:', sel);
  });
}

function handleTextSelection() {
    
    // Clear any existing timeout
    if (selectionTimeout) {
        clearTimeout(selectionTimeout);
    }
    
    // Small delay to ensure selection is complete
    selectionTimeout = setTimeout(() => {
        const newSelectedText = window.getSelection().toString().trim();
        
        if (newSelectedText && newSelectedText !== selectedText) {
            // Check if this text is already highlighted
            const isAlreadyHighlighted = highlightedWords.includes(newSelectedText);
            if (isAlreadyHighlighted) {
                console.log('Text already highlighted, skipping:', newSelectedText);
                return;
            }
            
            selectedText = newSelectedText;
            console.log('Text selected:', selectedText); // Debug log
            
            if (highlightMode) {
                highlightSelectedText();
            } else {
                showSaveIndicator();
            }
        }
        // Popup hiding logic removed - handled in mousedown event
    }, 50); // Reduced delay for faster response
}

// Listen for keyboard shortcuts
document.addEventListener('keydown', function(event) {
  console.log('Keydown event:', event.key, 'Ctrl:', event.ctrlKey, 'Shift:', event.shiftKey);
  
  // Handle Escape key
  if (event.key === 'Escape') {
    if (highlightMode) {
      clearAllHighlights();
    } else {
      hideSaveIndicator();
    }
    return;
  }
  
  // Check for custom shortcut first, then default
  checkCustomShortcut(event);
});

// Initialize highlight mode
async function initializeHighlightMode() {
  try {
    
    // Check if chrome API is available
    if (!isChromeAPIAvailable()) {
      console.log('Chrome API not available during initialization');
      highlightMode = false;
      return;
    }
    
    const result = await chrome.storage.local.get(['highlightMode']);
    highlightMode = result.highlightMode || false;
    console.log('Highlight mode initialized:', highlightMode);
  } catch (error) {
    console.error('Error loading highlight mode:', error);
    highlightMode = false;
    
    // If extension context is invalidated, stop trying to use Chrome API
    if (error.message.includes('Extension context invalidated') ||
        error.message.includes('Receiving end does not exist') ||
        error.message.includes('Could not establish connection')) {
      console.log('Extension context invalidated, disabling Chrome API usage');
      chromeAPIAvailable = false;
    }
  }
}

// Listen for messages from popup
if (isChromeAPIAvailable()) {
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
        console.log('Message received:', message);
        if (message.action === 'updateHighlightMode') {
            highlightMode = message.highlightMode;
            console.log('Highlight mode updated via message:', highlightMode);
            if (!highlightMode) {
                clearAllHighlights();
            }
        } else if (message.action === 'debugHighlightMode') {
            console.log('=== Content Script Debug Info ===');
            console.log('Current highlight mode:', highlightMode);
            console.log('Highlighted words:', highlightedWords);
            console.log('Highlight elements:', highlightElements);
            console.log('Selected text:', selectedText);
            
            // Check storage
            if (isChromeAPIAvailable()) {
                chrome.storage.local.get(['highlightMode'], (result) => {
                    console.log('Storage highlight mode:', result.highlightMode);
                });
            }
        }
    });
} else {
    console.log('Chrome API not available or PDF viewer, skipping message listener');
}

// Initialize on load with error handling
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded, initializing content script');
    setTimeout(() => {
        initializeHighlightMode();
        
        if (isChromeAPIAvailable()) {
            startHighlightModeCheck();
        } else {
            console.log('Chrome API not available or PDF viewer, skipping highlight mode check');
        }
    }, 100); // Small delay to ensure DOM is fully ready
});

// Also initialize when window loads (for PDFs and other dynamic content)
window.addEventListener('load', () => {
    console.log('Window loaded, checking initialization');
    setTimeout(() => {
        if (!highlightMode && isChromeAPIAvailable()) {
            initializeHighlightMode();
            startHighlightModeCheck();
        }
    }, 200); // Longer delay for dynamic content
});

// Handle page visibility changes
document.addEventListener('visibilitychange', () => {
    if (!document.hidden && isChromeAPIAvailable()) {
        console.log('Page became visible, reinitializing if needed');
        setTimeout(() => {
            if (!highlightMode) {
                initializeHighlightMode();
            }
        }, 100);
    }
});

// Periodically check for highlight mode changes
let highlightCheckInterval = null;

function isChromeAPIAvailable() {
    try {
        // Check if we're on a PDF page
        const isPDFPage = window.location.href.includes('pdf.js') || 
                         window.location.href.includes('viewer.html') ||
                         isPDFViewer;
        
        const hasChrome = typeof chrome !== 'undefined';
        const hasChromeObject = !!chrome;
        const hasStorage = !!(chrome && chrome.storage);
        const hasLocalStorage = !!(chrome && chrome.storage && chrome.storage.local);
        const hasRuntime = !!(chrome && chrome.runtime);
        const flagSet = chromeAPIAvailable;
        
        // On PDF pages, be more lenient with API checks
        if (isPDFPage) {
            const basicCheck = hasChrome && hasChromeObject && flagSet;
            console.log('PDF page Chrome API check:', {
                isPDFPage,
                basicCheck,
                hasChrome,
                hasChromeObject,
                flagSet
            });
            return basicCheck;
        }
        
        console.log('Chrome API availability check:', {
            hasChrome,
            hasChromeObject,
            hasStorage,
            hasLocalStorage,
            hasRuntime,
            flagSet
        });
        
        return hasChrome && hasChromeObject && hasStorage && hasLocalStorage && hasRuntime && flagSet;
    } catch (error) {
        console.error('Error in isChromeAPIAvailable:', error);
        return false;
    }
}

function startHighlightModeCheck() {
    if (highlightCheckInterval) {
        clearInterval(highlightCheckInterval);
    }
  
    highlightCheckInterval = setInterval(async () => {
        try {
            // Check if chrome API is available
            if (!isChromeAPIAvailable()) {
                if (chromeAPIAvailable) {
                    console.log('Chrome API became unavailable, stopping interval');
                    chromeAPIAvailable = false;
                }
                clearInterval(highlightCheckInterval);
                return;
            }
            
            chromeAPIAvailable = true;
            consecutiveErrors = 0; // Reset error count on success
            
            const result = await chrome.storage.local.get(['highlightMode']);
            const newHighlightMode = result.highlightMode || false;
            if (newHighlightMode !== highlightMode) {
                highlightMode = newHighlightMode;
                console.log('Highlight mode changed to:', highlightMode);
                if (!highlightMode) {
                    clearAllHighlights();
                }
            }
        } catch (error) {
            consecutiveErrors++;
            console.error(`Error checking highlight mode (attempt ${consecutiveErrors}):`, error);
            
            // Check for specific error types and stop immediately
            if (error.message.includes('Extension context invalidated') || 
                error.message.includes('Cannot read properties of undefined') ||
                error.message.includes('chrome.storage is undefined') ||
                error.message.includes('Receiving end does not exist') ||
                error.message.includes('Could not establish connection') ||
                error.message.includes('Extension context invalidated')) {
                
                console.log('Extension context invalid, disabling Chrome API and stopping interval');
                chromeAPIAvailable = false;
                clearInterval(highlightCheckInterval);
                return;
            }
            
            // Stop after too many consecutive errors
            if (consecutiveErrors >= MAX_CONSECUTIVE_ERRORS) {
                console.log(`Too many consecutive errors (${consecutiveErrors}), stopping interval`);
                chromeAPIAvailable = false;
                clearInterval(highlightCheckInterval);
                return;
            }
        }
    }, 30000); // Increased interval to 30 seconds to reduce API calls
}

// Debug function to check highlight mode status
window.checkHighlightMode = async () => {
    try {
        if (!isChromeAPIAvailable()) {
            console.log('Chrome API not available for debug');
            return null;
        }
        
        const result = await chrome.storage.local.get(['highlightMode']);
        console.log('Current highlight mode from storage:', result.highlightMode);
        console.log('Current highlight mode in script:', highlightMode);
        return result.highlightMode;
    } catch (error) {
        console.error('Error in debug function:', error);
        
        // If extension context is invalidated, disable Chrome API
        if (error.message.includes('Extension context invalidated')) {
            chromeAPIAvailable = false;
        }
        
        return null;
    }
};

// Debug function to test word saving
window.testWordSave = async (word = 'test') => {
    console.log('Testing word save with:', word);
    try {
        const result = await saveWordToVocabulary(word);
        console.log('Test save result:', result);
        return result;
    } catch (error) {
        console.error('Test save error:', error);
        return false;
    }
};

// Debug function to check vocabulary storage
window.checkVocabulary = async () => {
    try {
        if (!isChromeAPIAvailable()) {
            console.log('Chrome API not available for vocabulary check');
            return null;
        }
        
        const result = await chrome.storage.local.get(['vocabulary']);
        console.log('Vocabulary from storage:', result.vocabulary);
        console.log('Vocabulary count:', result.vocabulary ? result.vocabulary.length : 0);
        return result.vocabulary;
    } catch (error) {
        console.error('Error checking vocabulary:', error);
        return null;
    }
};

// Debug function to check service worker status
window.checkServiceWorker = async () => {
    try {
        if (!isChromeAPIAvailable()) {
            console.log('Chrome API not available for service worker check');
            return false;
        }
        
        const response = await chrome.runtime.sendMessage({ action: 'ping' });
        console.log('Service worker response:', response);
        return response && response.status === 'alive';
    } catch (error) {
        console.error('Service worker check failed:', error);
        return false;
    }
};

// Function to check custom shortcut
async function checkCustomShortcut(event) {
  console.log('Checking custom shortcut for:', event.key, 'Ctrl:', event.ctrlKey, 'Shift:', event.shiftKey);
  console.log('Selected text:', selectedText);
  
  // Only process modifier key combinations
  // Ignore single key presses that might interfere with normal typing
  if (!event.ctrlKey && !event.altKey && !event.shiftKey && !event.metaKey) {
    return; // Only process modifier key combinations
  }
  
  try {
    // Check if chrome API is available
    if (!isChromeAPIAvailable()) {
      console.log('Chrome API not available, using default shortcut');
      // Fallback to default shortcut
      if (event.ctrlKey && event.shiftKey && event.key === 'S') {
        console.log('Default shortcut detected, saving word');
        event.preventDefault();
        if (selectedText) {
          saveSelectedWord();
        } else {
          console.log('No text selected');
        }
      }
      return;
    }
    
    const result = await chrome.storage.local.get(['customShortcut']);
    const customShortcut = result.customShortcut;
    
    if (customShortcut) {
      // Check if it's a sequence (contains space)
      if (customShortcut.includes(' ')) {
        // Handle sequence shortcuts like "Shift+A S"
        if (checkSequenceShortcut(event, customShortcut)) {
          event.preventDefault();
          if (selectedText) {
            saveSelectedWord();
          }
          return;
        }
      } else {
        // Handle single combination shortcuts like "Ctrl+Shift+S"
        const keys = customShortcut.split('+');
        let matches = true;
        
        // Check modifier keys
        if (keys.includes('Ctrl') && !event.ctrlKey) matches = false;
        if (keys.includes('Alt') && !event.altKey) matches = false;
        if (keys.includes('Shift') && !event.shiftKey) matches = false;
        if (keys.includes('Cmd') && !event.metaKey) matches = false;
        
        // Check main key
        const mainKey = keys[keys.length - 1];
        if (mainKey && event.key.toUpperCase() !== mainKey) matches = false;
        
        if (matches) {
          event.preventDefault();
          if (selectedText) {
            saveSelectedWord();
          }
          return;
        }
      }
    }
    
    // Default shortcut (Ctrl+Shift+S)
    if (event.ctrlKey && event.shiftKey && event.key === 'S') {
      event.preventDefault();
      if (selectedText) {
        saveSelectedWord();
      }
    }
  } catch (error) {
    console.error('Error checking custom shortcut:', error);
    
    // If extension context is invalidated, disable Chrome API
    if (error.message.includes('Extension context invalidated')) {
      chromeAPIAvailable = false;
    }
    
    // Fallback to default shortcut
    if (event.ctrlKey && event.shiftKey && event.key === 'S') {
      event.preventDefault();
      if (selectedText) {
        saveSelectedWord();
      }
    }
  }
}

// Function to check sequence shortcuts
function checkSequenceShortcut(event, shortcut) {
  // Initialize sequence tracking if not exists
  if (!window.shortcutSequence) {
    window.shortcutSequence = [];
    window.shortcutSequenceTimeout = null;
  }
  
  // Clear existing timeout
  if (window.shortcutSequenceTimeout) {
    clearTimeout(window.shortcutSequenceTimeout);
  }
  
  // Get current key combination
  const modifiers = [];
  if (event.ctrlKey) modifiers.push('Ctrl');
  if (event.altKey) modifiers.push('Alt');
  if (event.shiftKey) modifiers.push('Shift');
  if (event.metaKey) modifiers.push('Cmd');
  
  const currentKey = event.key.toUpperCase();
  const currentCombo = [...modifiers, currentKey].join('+');
  
  // Add to sequence if it's a valid key
  if (currentKey && currentKey !== 'CONTROL' && currentKey !== 'ALT' && currentKey !== 'SHIFT' && currentKey !== 'META') {
    window.shortcutSequence.push(currentCombo);
  }
  
  // Set timeout to clear sequence
  window.shortcutSequenceTimeout = setTimeout(() => {
    window.shortcutSequence = [];
  }, 2000);
  
  // Check if sequence matches
  const expectedSequence = shortcut.split(' ');
  if (window.shortcutSequence.length >= expectedSequence.length) {
    const lastKeys = window.shortcutSequence.slice(-expectedSequence.length);
    
    for (let i = 0; i < expectedSequence.length; i++) {
      if (lastKeys[i] !== expectedSequence[i]) {
        return false;
      }
    }
    
    // Match found, clear sequence
    window.shortcutSequence = [];
    return true;
  }
  
  return false;
}

// Hide popup
function hideSaveIndicator() {
  if (indicator) {
    indicator.style.display = 'none';
  }
  console.log('hideSaveIndicator called - popup hidden');
}

// Show popup
function showSaveIndicator() {
  console.log('[Content Script] showSaveIndicator called with text:', selectedText);
  if (!selectedText || selectedText.length < 1) {
    console.log('[Content Script] No valid text to show indicator for');
    return;
  }
  
  // Check if selected text contains sensitive information
  if (!isValidWord(selectedText)) {
    showSensitiveInfoWarning(selectedText);
    // Hide any existing indicator
    if (indicator) {
      indicator.style.display = 'none';
    }
    return;
  }

  let displayText = selectedText;
  if (selectedText.length > 50) {
    displayText = selectedText.slice(0, 47) + '...';
  }

  if (!indicator) {
    indicator = document.createElement('div');
    indicator.id = 'vocab-save-indicator';
    document.body.appendChild(indicator);

    // Left click event (save)
    indicator.addEventListener('click', saveSelectedWord);
    // Right click event removed
    // indicator.addEventListener('contextmenu', ...)

    // Popup style - small and unobtrusive, fixed to bottom right
    indicator.style.cssText = `
      position: fixed;
      background: #ff4444;
      color: white;
      padding: 6px 12px;
      border-radius: 6px;
      cursor: pointer;
      z-index: 999999;
      font-family: Arial, sans-serif;
      font-size: 13px;
      font-weight: bold;
      box-shadow: 0 2px 8px rgba(0,0,0,0.25);
      user-select: none;
      border: 2px solid #cc0000;
      min-width: 120px;
      max-width: 250px;
      text-align: center;
      bottom: 32px;
      right: 32px;
      opacity: 0.95;
    `;
  }

  indicator.innerHTML = `💾 Click to save "${displayText}"`;
  indicator.style.display = 'block';
  indicator.style.opacity = '1';
  console.log('[Content Script] Save indicator displayed for:', displayText);
}

// Function to save selected word
async function saveSelectedWord() {
  // Get the current selected text at the time of function call
  const textToSave = selectedText || window.getSelection().toString().trim();
  
  console.log('saveSelectedWord called with:', textToSave);
  if (!textToSave) {
    console.log('No selected text, returning');
    return;
  }
  
  // Validate that it's a valid English word
  if (!isValidWord(textToSave)) {
    console.log('Word validation failed in saveSelectedWord:', textToSave);
    showSensitiveInfoWarning(textToSave);
    // Invalid words are not saved or transmitted to any server
    return;
  }
  
  // Show success message only for valid words
  showSaveSuccess();
  
  try {
    // PDF-only mode (default to false if pdfMode is undefined)
    if (typeof pdfMode !== 'undefined' && pdfMode) {
      console.log('PDF mode detected, using PDF storage');
      // Use general storage method if pdfStorage is undefined
      if (typeof pdfStorage !== 'undefined') {
        const success = await pdfStorage.saveWord(textToSave);
        if (success) {
          // Show PDF storage statistics
          if (typeof showPDFStorageInfo === 'function') {
            showPDFStorageInfo();
          }
        } else {
          console.log('Word already exists in PDF storage');
        }
      } else {
        console.log('PDF storage not available, using fallback method');
        await saveWordToVocabulary(textToSave);
      }
      return;
    }
    
    // For PDF viewers, use fallback method directly
    if (isPDFViewer) {
      console.log('PDF viewer detected, using fallback save method');
      await saveWordToVocabulary(textToSave);
      return;
    }
    
    // Check if chrome API is available
    if (!isChromeAPIAvailable()) {
      console.log('Chrome API not available, cannot save word');
      return;
    }
    
    // Try direct storage first (more reliable)
    try {
      const saveResult = await saveWordToVocabulary(textToSave);
      console.log('Direct storage result:', saveResult);
      if (saveResult) {
        console.log('Word saved successfully');
        return;
      } else {
        console.log('Direct storage failed, trying background script');
      }
    } catch (directError) {
      console.log('Direct storage failed, trying background script:', directError);
    }
    
    // Send message to background script as fallback
    try {
      const response = await chrome.runtime.sendMessage({
        action: 'saveWord',
        word: textToSave,
        url: window.location.href
      });
      
      if (response && response.success) {
        console.log('Background script saved word successfully');
      } else {
        console.log('Background script failed');
      }
    } catch (messageError) {
      console.log('Message to background script failed:', messageError);
    }
    
  } catch (error) {
    console.error('Error saving word:', error);
    
    // If extension context is invalidated, try direct storage
    if (error.message.includes('Extension context invalidated') ||
        error.message.includes('Receiving end does not exist') ||
        error.message.includes('Could not establish connection')) {
      console.log('Extension context invalidated, trying direct storage');
      try {
        await saveWordToVocabulary(textToSave);
      } catch (fallbackError) {
        console.error('Fallback storage also failed:', fallbackError);
      }
    }
  }
}

// Function to show save success message
function showSaveSuccess() {
  const successMsg = document.createElement('div');
  successMsg.id = 'vocab-save-success';
  successMsg.innerHTML = `
    <div class="vocab-success-content">
      <span>✅ "${selectedText}" saved!</span>
    </div>
  `;
  document.body.appendChild(successMsg);
  
  // Position near the indicator
  const indicator = document.getElementById('vocab-save-indicator');
  if (indicator) {
    const rect = indicator.getBoundingClientRect();
    successMsg.style.top = (rect.top + window.scrollY - 40) + 'px';
    successMsg.style.left = (rect.left + window.scrollX) + 'px';
  }
  
  // Remove after 2 seconds
  setTimeout(() => {
    if (successMsg.parentNode) {
      successMsg.parentNode.removeChild(successMsg);
    }
  }, 2000);
  
  // Clear selection
  window.getSelection().removeAllRanges();
  selectedText = '';
  hideSaveIndicator(); // Hide popup
}

function showSensitiveInfoWarning(text) {
  // Create warning message
  const warningMsg = document.createElement('div');
  warningMsg.id = 'vocab-sensitive-warning';
  warningMsg.style.cssText = `
    position: fixed;
    background: #ff6b35;
    color: white;
    padding: 8px 12px;
    border-radius: 6px;
    cursor: pointer;
    z-index: 999999;
    font-family: Arial, sans-serif;
    font-size: 12px;
    font-weight: bold;
    box-shadow: 0 2px 8px rgba(0,0,0,0.3);
    user-select: none;
    border: 2px solid #e55a2b;
    max-width: 300px;
    text-align: center;
    bottom: 32px;
    right: 32px;
    opacity: 0.95;
  `;
  
  warningMsg.innerHTML = `⚠️ "${text.substring(0, 20)}${text.length > 20 ? '...' : ''}" is not a valid word`;
  
  // Add click to dismiss
  warningMsg.addEventListener('click', () => {
    if (warningMsg.parentNode) {
      warningMsg.parentNode.removeChild(warningMsg);
    }
  });
  
  document.body.appendChild(warningMsg);
  
  setTimeout(() => {
    if (warningMsg.parentNode) {
      warningMsg.parentNode.removeChild(warningMsg);
    }
  }, 150);
  
}

function isValidWord(text) {
    if (!text || text.length === 0) return false;
    
    // Check for any whitespace (space, tab, newline, etc.)
    if (/\s/.test(text)) {
        return false;
    }
    
    // Check for any digits
    if (/\d/.test(text)) {
        return false;
    }
    
    // Check for any special characters (except hyphen and apostrophe for English words)
    if (/[^a-zA-Z\-']/.test(text)) {
        return false;
    }
    
    // Length check
    if (text.length < 2 || text.length > 20) {
        return false;
    }
    
    // Check for sensitive information patterns (more specific to avoid blocking common words)
    const sensitivePatterns = [
        /^password$/i,
        /^passwd$/i,
        /^pwd$/i,
        /^secret$/i,
        /^private$/i,
        /^confidential$/i,
        /^api[_-]?key$/i,
        /^auth[_-]?token$/i,
        /^session[_-]?id$/i,
        /^credit[_-]?card$/i,
        /^card[_-]?number$/i,
        /^ssn$/i,
        /^social[_-]?security$/i,
        /^phone[_-]?number$/i,
        /^email[_-]?address$/i,
        /^zip[_-]?code$/i,
        /^postal[_-]?code$/i,
        /^bank[_-]?account$/i,
        /^account[_-]?number$/i,
        /^routing[_-]?number$/i,
        /^swift[_-]?code$/i,
        /^iban$/i,
        /^cvv$/i,
        /^cvc$/i,
        /^expiry$/i,
        /^expiration$/i
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

function highlightSelectedText() {
    const selection = window.getSelection();
    if (!selection.rangeCount) return;
    
    const range = selection.getRangeAt(0);
    const selectedText = range.toString().trim();
    
    if (!selectedText) return;
    
    // Validate that it's a valid English word
    if (!isValidWord(selectedText)) {
        console.log('Word validation failed in highlight mode:', selectedText);
        return;
    }
    
    // Check if selection contains HTML elements (already highlighted)
    const fragment = range.cloneContents();
    const hasElements = fragment.querySelector && fragment.querySelector('*');
    
    if (hasElements) {
        console.log('Selection contains HTML elements, using fallback highlight');
        applyFallbackHighlight(range);
        return;
    }
    
    // Count words in selection
    const wordCount = selectedText.split(/\s+/).filter(word => word.length > 0).length;
    
    try {
        // Create highlight element
        const highlightSpan = document.createElement('span');
        highlightSpan.className = 'vocab-highlight';
        highlightSpan.style.cssText = `
            background-color: #ffeb3b;
            color: #000;
            padding: 2px 4px;
            border-radius: 3px;
            cursor: pointer;
            display: inline;
            position: relative;
            z-index: 1;
        `;
        highlightSpan.setAttribute('data-word-count', wordCount);
        highlightSpan.setAttribute('data-selected-text', selectedText);
        
        // Add right-click event for individual removal
        highlightSpan.addEventListener('contextmenu', function(e) {
            e.preventDefault();
            e.stopPropagation();
            
            // Remove this specific highlight
            const parent = highlightSpan.parentNode;
            if (parent) {
                parent.replaceChild(document.createTextNode(selectedText), highlightSpan);
                parent.normalize(); // Merge adjacent text nodes
                
                // Remove from highlightedWords array
                const index = highlightedWords.indexOf(selectedText);
                if (index > -1) {
                    highlightedWords.splice(index, 1);
                }
                
                // Remove from highlightElements array
                const elementIndex = highlightElements.indexOf(highlightSpan);
                if (elementIndex > -1) {
                    highlightElements.splice(elementIndex, 1);
                }
                
                console.log('Individual highlight removed:', selectedText);
            }
        });
        
        // Prevent text selection when clicking on highlighted text
        highlightSpan.addEventListener('mousedown', function(e) {
            e.preventDefault();
            e.stopPropagation();
        });
        
        // Prevent text selection when clicking on highlighted text
        highlightSpan.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
        });
        
        // Wrap the selected text
        range.surroundContents(highlightSpan);
        
        // Add to arrays
        if (!highlightedWords.includes(selectedText)) {
            highlightedWords.push(selectedText);
        }
        highlightElements.push(highlightSpan);
        
        // Show save button with correct word count
        showHighlightSaveButton();
        
        console.log('Text highlighted:', selectedText, 'Word count:', wordCount);
        
    } catch (error) {
        console.error('Error highlighting text:', error);
        // Fallback method for complex selections
        applyFallbackHighlight(range);
    }
}

function applyFallbackHighlight(range) {
    const rect = range.getBoundingClientRect();
    
    // Validate that it's a valid English word
    if (!isValidWord(selectedText)) {
        console.log('Word validation failed in fallback highlight:', selectedText);
        return;
    }
    
    const highlightElement = document.createElement('div');
    highlightElement.className = 'vocab-highlight-fallback';
    highlightElement.style.cssText = `
        position: absolute;
        background: rgba(255, 235, 59, 0.7);
        border-radius: 3px;
        pointer-events: none;
        z-index: 9999;
        left: ${rect.left + window.scrollX}px;
        top: ${rect.top + window.scrollY}px;
        width: ${rect.width}px;
        height: ${rect.height}px;
        animation: highlightFadeIn 0.3s ease-out;
    `;
    
    document.body.appendChild(highlightElement);
    highlightElements.push(highlightElement);
    
    // Add word to highlighted words list
    if (!highlightedWords.includes(selectedText)) {
        highlightedWords.push(selectedText);
        console.log('Added valid word to highlights (fallback):', selectedText);
    }
    
    // Show save button for highlighted words
    showHighlightSaveButton();
}

function showHighlightSaveButton() {
    // Remove existing button
    const existingButton = document.getElementById('highlight-save-button');
    if (existingButton) {
        existingButton.remove();
    }
    
    if (highlightedWords.length === 0) return;
    
    // Calculate total word count from all highlights
    let totalWordCount = 0;
    highlightElements.forEach(element => {
        const wordCount = parseInt(element.getAttribute('data-word-count')) || 1;
        totalWordCount += wordCount;
    });
    
    const button = document.createElement('div');
    button.id = 'highlight-save-button';
    button.innerHTML = `
        <div style="
            position: fixed;
            top: 20px;
            right: 20px;
            background: #4CAF50;
            color: white;
            padding: 12px 20px;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
            cursor: pointer;
            z-index: 10000;
            font-family: Arial, sans-serif;
            font-size: 14px;
            display: flex;
            align-items: center;
            gap: 8px;
            animation: slideIn 0.3s ease-out;
        ">
            <span style="font-weight: bold;">💾</span>
            <span>Save ${highlightedWords.length} selection${highlightedWords.length > 1 ? 's' : ''} (${totalWordCount} words)</span>
            <button id="clear-highlights-btn" style="
                background: rgba(255,255,255,0.2);
                border: none;
                color: white;
                padding: 4px 8px;
                border-radius: 4px;
                cursor: pointer;
                font-size: 12px;
                margin-left: 8px;
            ">Clear All</button>
        </div>
    `;
    
    button.addEventListener('click', saveHighlightedWords);
    document.body.appendChild(button);
    
    // Add event listener for clear button
    const clearButton = button.querySelector('#clear-highlights-btn');
    if (clearButton) {
        clearButton.addEventListener('click', (e) => {
            e.stopPropagation();
            clearAllHighlights();
        });
    }
    
    // Add CSS animation
    if (!document.getElementById('highlight-animations')) {
        const style = document.createElement('style');
        style.id = 'highlight-animations';
        style.textContent = `
            @keyframes slideIn {
                from { transform: translateX(100%); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
            }
        `;
        document.head.appendChild(style);
    }
}

function clearAllHighlights() {
    // Remove all highlight elements
    highlightElements.forEach(element => {
        if (element && element.parentNode) {
            if (element.tagName === 'SPAN' && element.className.includes('vocab-highlight')) {
                const parent = element.parentNode;
                const textContent = element.textContent;
                const textNode = document.createTextNode(textContent);
                parent.replaceChild(textNode, element);
            } else {
                element.parentNode.removeChild(element);
            }
        }
    });
    highlightElements = [];
    
    // Clear highlighted words
    highlightedWords = [];
    
    // Remove save button
    const saveButton = document.getElementById('highlight-save-button');
    if (saveButton) {
        saveButton.remove();
    }
}

async function saveHighlightedWords() {
    if (highlightedWords.length === 0) return;
    
    try {
        // Check if chrome API is available
        if (!isChromeAPIAvailable()) {
            console.log('Chrome API not available, cannot save highlighted words');
            showHighlightSaveSuccess(highlightedWords.length);
            clearAllHighlights();
            return;
        }
        
        // Save each highlighted word
        for (const word of highlightedWords) {
            if (word && word.trim()) {
                await saveWordToVocabulary(word.trim());
            }
        }
        
        // Show success message
        showHighlightSaveSuccess(highlightedWords.length);
        
        // Clear highlights
        clearAllHighlights();
        
    } catch (error) {
        console.error('Error saving highlighted words:', error);
        
        // If extension context is invalidated, show success anyway
        if (error.message.includes('Extension context invalidated')) {
            console.log('Extension context invalidated, showing success message');
            showHighlightSaveSuccess(highlightedWords.length);
            clearAllHighlights();
        } else {
            alert('Error saving highlighted words');
        }
    }
}

function showHighlightSaveSuccess(wordCount) {
    // Remove existing success message if any
    const existingMessage = document.getElementById('vocab-save-success');
    if (existingMessage) {
        existingMessage.remove();
    }
    
    const successMessage = document.createElement('div');
    successMessage.id = 'vocab-save-success';
    successMessage.textContent = `${wordCount} word${wordCount > 1 ? 's' : ''} saved!`;
    successMessage.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #28a745;
        color: white;
        padding: 12px 20px;
        border-radius: 8px;
        font-size: 14px;
        font-weight: 600;
        z-index: 10000;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        animation: slideIn 0.3s ease-out;
    `;
    
    document.body.appendChild(successMessage);
    
    setTimeout(() => {
        if (successMessage && successMessage.parentNode) {
            successMessage.remove();
        }
    }, 3000);
}

async function saveWordToVocabulary(word) {
    console.log('saveWordToVocabulary called with word:', word);
    
    // Validate input
    if (!word || typeof word !== 'string' || word.trim().length === 0) {
        console.log('Invalid word provided:', word);
        return false;
    }
    
    const cleanWord = word.trim();
    console.log('Cleaned word:', cleanWord);
    
    // Validate that it's a valid English word
    if (!isValidWord(cleanWord)) {
        console.log('Word validation failed:', cleanWord);
        // Invalid words are not saved or transmitted to any server
        return false;
    }
    
    try {
        // Check if chrome API is available
        if (!isChromeAPIAvailable()) {
            console.log('Chrome API not available, cannot save word');
            return false;
        }
        
        console.log('Chrome API is available, proceeding with save');
        
        // Get word definition with stop words fallback
        let definition = 'Definition not available';
        
        try {
            console.log('Fetching definition for word:', cleanWord);
            // First try the regular dictionary API
            const response = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(cleanWord)}`);
            const data = await response.json();
            
            if (data && data.length > 0 && data[0].meanings && data[0].meanings.length > 0) {
                const meaning = data[0].meanings[0];
                const partOfSpeech = meaning.partOfSpeech ? `(${meaning.partOfSpeech}) ` : '';
                definition = partOfSpeech + meaning.definitions[0].definition;
                console.log('Definition found:', definition);
            } else {
                // If definition not found, try stop words API
                console.log(`Definition not found for "${cleanWord}", trying stop words API`);
                const stopWordsResponse = await fetch(`https://api.datamuse.com/words?sp=${encodeURIComponent(cleanWord)}&md=d&max=1`);
                const stopWordsData = await stopWordsResponse.json();
                
                if (stopWordsData && stopWordsData.length > 0) {
                    const stopWordEntry = stopWordsData[0];
                    if (stopWordEntry.defs && stopWordEntry.defs.length > 0) {
                        definition = stopWordEntry.defs[0];
                        console.log('Definition found from stop words API:', definition);
                    }
                }
            }
        } catch (apiError) {
            console.error('Error fetching definition from APIs:', apiError);
        }
        
        console.log('Saving word to storage:', cleanWord);
        // Save to storage
        const result = await chrome.storage.local.get(['vocabulary']);
        const vocabulary = result.vocabulary || [];
        console.log('Current vocabulary count:', vocabulary.length);
        
        // Check if word already exists
        const existingIndex = vocabulary.findIndex(w => w.word.toLowerCase() === cleanWord.toLowerCase());
        if (existingIndex === -1) {
            console.log('Word does not exist, adding to vocabulary');
            vocabulary.push({
                word: cleanWord,
                definition: definition,
                dateAdded: new Date().toISOString(),
                reviewCount: 0,
                url: window.location.href
            });
            
            await chrome.storage.local.set({ vocabulary: vocabulary });
            console.log('Word saved successfully to storage');
            return true;
        } else {
            console.log('Word already exists in vocabulary');
            return true; // Still return true as it's not an error
        }
        
    } catch (error) {
        console.error('Error saving word:', error);
        
        // If extension context is invalidated, disable Chrome API
        if (error.message.includes('Extension context invalidated')) {
            chromeAPIAvailable = false;
        }
        return false;
    }
}

// Add context menu item
document.addEventListener('contextmenu', function(event) {
  const selection = window.getSelection().toString().trim();
  if (selection) {
    // Store selected text for context menu
    window.selectedTextForContext = selection;
  }
});

// Escape key handling is now integrated into the main keydown listener

document.addEventListener('click', (e) => {
  if (e.target.closest('#highlight-save-button')) {
    e.stopPropagation();
    return;
  }
});

// Additional event listeners for better text selection detection
document.addEventListener('mouseover', function(event) {
    // Check for text selection on mouse over
    const selection = window.getSelection().toString().trim();
    if (selection && selection !== selectedText) {
        selectedText = selection;
        if (highlightMode) {
            highlightSelectedText();
        } else {
            showSaveIndicator();
        }
    }
});

// Listen for input events that might change selection
document.addEventListener('input', handleTextSelection);
document.addEventListener('paste', handleTextSelection);
document.addEventListener('cut', handleTextSelection);

// Force check for selection periodically
setInterval(() => {
    const currentSelection = window.getSelection().toString().trim();
    if (currentSelection && currentSelection !== selectedText) {
        selectedText = currentSelection;
        if (highlightMode) {
            highlightSelectedText();
        } else {
            showSaveIndicator();
        }
    }
}, 500);

// Keep service worker alive with simple ping
let lastPingSuccess = true;
setInterval(() => {
    // Skip pinging on PDF pages to avoid errors
    if (window.location.href.includes('pdf.js') || window.location.href.includes('viewer.html')) {
        return;
    }
    
    if (isChromeAPIAvailable() && lastPingSuccess) {
        try {
            chrome.runtime.sendMessage({ action: 'ping' })
                .then(response => {
                    // Success - service worker is alive
                    lastPingSuccess = true;
                })
                .catch(error => {
                    // Service worker is inactive - stop pinging for a while
                    lastPingSuccess = false;
                    console.log('Service worker inactive, pausing pings');
                });
        } catch (error) {
            // Service worker is inactive - stop pinging for a while
            lastPingSuccess = false;
        }
    }
}, 60000); // Send ping every 60 seconds

// Reset ping status when user interacts with the page
document.addEventListener('click', () => {
    lastPingSuccess = true; // Allow pinging again
}, { passive: true }); 

function addPDFTextLayerSelectionListener() {
  const textLayer = document.querySelector('.textLayer');
  if (textLayer) {
    textLayer.addEventListener('mouseup', () => {
      const sel = window.getSelection().toString().trim();
      console.log('[PDF] textLayer mouseup, sel:', sel);
      if (sel && sel !== selectedText) {
        selectedText = sel;
        showSaveIndicator();
      }
    });
  }
}
addPDFTextLayerSelectionListener(); 



} // Close the else block from the beginning 


