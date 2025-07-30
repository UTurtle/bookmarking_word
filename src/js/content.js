// Content Script for Vocabulary Bookmarker
// Check if we're on chrome:// pages or newtab page and exit early
const currentUrl = window.location.href;
const isChromePage = currentUrl.startsWith('chrome://') || 
                     currentUrl.startsWith('chrome-extension://') ||
                     currentUrl.includes('newtab.html') || 
                     currentUrl.includes('chrome://newtab') ||
                     (currentUrl.includes('chrome-extension://') && currentUrl.includes('newtab'));

if (isChromePage) {
    // Don't initialize any functionality on chrome:// pages
    // Just exit gracefully
} else {
    
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
  setTimeout(() => {
    const currentSelectedText = window.getSelection().toString().trim();
    
    if (currentSelectedText.length > 0 && currentSelectedText !== selectedText) {
      // Check if this text is already highlighted
      const isAlreadyHighlighted = highlightedWords.includes(currentSelectedText);
      if (isAlreadyHighlighted) {
        return;
      }
      
      selectedText = currentSelectedText;
      
      if (highlightMode) {
        highlightSelectedText();
      } else {
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
  // PDF.js viewer usually has classes like .pdfViewer, .textLayer, .viewer
  if (document.querySelector('.pdfViewer, .textLayer, .viewer, canvas')) {
    isPDFViewer = true;
    pdfMode = true; // Enable PDF mode
  } else {
    isPDFViewer = false;
    pdfMode = false; // Disable PDF mode
  }
}

detectPDFViewer();

// Enhance selectionchange event for PDF.js viewer environment to show popup on text selection
if (isPDFViewer) {
  document.addEventListener('selectionchange', () => {
    const sel = window.getSelection().toString().trim();
    if (sel && sel !== selectedText) {
      selectedText = sel;
      showSaveIndicator();
    }
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
                return;
            }
            
            selectedText = newSelectedText;
            
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
      highlightMode = false;
      return;
    }
    
    const result = await chrome.storage.local.get(['highlightMode']);
    highlightMode = result.highlightMode || false;
  } catch (error) {
    highlightMode = false;
    
    // If extension context is invalidated, stop trying to use Chrome API
    if (error.message.includes('Extension context invalidated') ||
        error.message.includes('Receiving end does not exist') ||
        error.message.includes('Could not establish connection')) {
      chromeAPIAvailable = false;
    }
  }
}

// Listen for messages from popup
if (isChromeAPIAvailable()) {
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
        if (message.action === 'updateHighlightMode') {
            highlightMode = message.highlightMode;
            if (!highlightMode) {
                clearAllHighlights();
            }
        }
    });
}

// Initialize on load with error handling
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        initializeHighlightMode();
        
        if (isChromeAPIAvailable()) {
            startHighlightModeCheck();
        }
    }, 100); // Small delay to ensure DOM is fully ready
});

// Also initialize when window loads (for PDFs and other dynamic content)
window.addEventListener('load', () => {
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
            return basicCheck;
        }
        
        return hasChrome && hasChromeObject && hasStorage && hasLocalStorage && hasRuntime && flagSet;
    } catch (error) {
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
                if (!highlightMode) {
                    clearAllHighlights();
                }
            }
        } catch (error) {
            consecutiveErrors++;
            
            // Check for specific error types and stop immediately
            if (error.message.includes('Extension context invalidated') || 
                error.message.includes('Cannot read properties of undefined') ||
                error.message.includes('chrome.storage is undefined') ||
                error.message.includes('Receiving end does not exist') ||
                error.message.includes('Could not establish connection') ||
                error.message.includes('Extension context invalidated')) {
                
                chromeAPIAvailable = false;
                clearInterval(highlightCheckInterval);
                return;
            }
            
            // Stop after too many consecutive errors
            if (consecutiveErrors >= MAX_CONSECUTIVE_ERRORS) {
                chromeAPIAvailable = false;
                clearInterval(highlightCheckInterval);
                return;
            }
        }
    }, 30000); // Increased interval to 30 seconds to reduce API calls
}



// Function to check custom shortcut
async function checkCustomShortcut(event) {
  // Only process modifier key combinations
  // Ignore single key presses that might interfere with normal typing
  if (!event.ctrlKey && !event.altKey && !event.shiftKey && !event.metaKey) {
    return; // Only process modifier key combinations
  }
  
  try {
    // Check if chrome API is available
    if (!isChromeAPIAvailable()) {
      // Fallback to default shortcut
      if (event.ctrlKey && event.shiftKey && event.key === 'S') {
        event.preventDefault();
        if (selectedText) {
          saveSelectedWord();
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
    // Error checking custom shortcut
    
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
}

// Show popup
function showSaveIndicator() {
  if (!selectedText || selectedText.length < 1) {
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
}

// Function to save selected word
async function saveSelectedWord() {
  // Get the current selected text at the time of function call
  const textToSave = selectedText || window.getSelection().toString().trim();
  
  if (!textToSave) {
    return;
  }
  
  // Validate that it's a valid English word
  if (!isValidWord(textToSave)) {
    showSensitiveInfoWarning(textToSave);
    // Invalid words are not saved or transmitted to any server
    return;
  }
  
  // Show success message only for valid words
  showSaveSuccess();
  
  try {
    // PDF-only mode (default to false if pdfMode is undefined)
    if (typeof pdfMode !== 'undefined' && pdfMode) {
      // Use general storage method if pdfStorage is undefined
      if (typeof pdfStorage !== 'undefined') {
        const success = await pdfStorage.saveWord(textToSave);
        if (success) {
          // Show PDF storage statistics
          if (typeof showPDFStorageInfo === 'function') {
            showPDFStorageInfo();
          }
        }
      } else {
        await saveWordToVocabulary(textToSave);
      }
      return;
    }
    
    // For PDF viewers, use fallback method directly
    if (isPDFViewer) {
      await saveWordToVocabulary(textToSave);
      return;
    }
    
    // Check if chrome API is available
    if (!isChromeAPIAvailable()) {
      return;
    }
    
    // Try direct storage first (more reliable)
    try {
      const saveResult = await saveWordToVocabulary(textToSave);
      if (saveResult) {
        return;
      }
    } catch (directError) {
      // Continue to background script fallback
    }
    
    // Send message to background script as fallback
    try {
      await chrome.runtime.sendMessage({
        action: 'saveWord',
        word: textToSave,
        url: window.location.href
      });
    } catch (messageError) {
      // Background script failed, but we already tried direct storage
    }
    
  } catch (error) {
    // If extension context is invalidated, try direct storage
    if (error.message.includes('Extension context invalidated') ||
        error.message.includes('Receiving end does not exist') ||
        error.message.includes('Could not establish connection')) {
      try {
        await saveWordToVocabulary(textToSave);
      } catch (fallbackError) {
        // Fallback storage also failed
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
        // Word validation failed in highlight mode
        return;
    }
    
    // Check if selection contains HTML elements (already highlighted)
    const fragment = range.cloneContents();
    const hasElements = fragment.querySelector && fragment.querySelector('*');
    
    if (hasElements) {
        // Selection contains HTML elements, using fallback highlight
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
                
                // Individual highlight removed
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
        
    } catch (error) {
        // Fallback method for complex selections
        applyFallbackHighlight(range);
    }
}

function applyFallbackHighlight(range) {
    const rect = range.getBoundingClientRect();
    
    // Validate that it's a valid English word
    if (!isValidWord(selectedText)) {
        // Word validation failed in fallback highlight
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
        // If extension context is invalidated, show success anyway
        if (error.message.includes('Extension context invalidated')) {
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
    // Validate input
    if (!word || typeof word !== 'string' || word.trim().length === 0) {
        return false;
    }
    
    const cleanWord = word.trim();
    
    // Validate that it's a valid English word
    if (!isValidWord(cleanWord)) {
        // Invalid words are not saved or transmitted to any server
        return false;
    }
    
    try {
        // Check if chrome API is available
        if (!isChromeAPIAvailable()) {
            return false;
        }
        
        // Get word definition and pronunciation with stop words fallback
        let definition = 'Definition not available';
        let pronunciation = null;
        let phonetic = null;
        
        try {
            // First try the regular dictionary API
            const response = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(cleanWord)}`);
            const data = await response.json();
            
            if (data && data.length > 0 && data[0].meanings && data[0].meanings.length > 0) {
                const meaning = data[0].meanings[0];
                const partOfSpeech = meaning.partOfSpeech ? `(${meaning.partOfSpeech}) ` : '';
                definition = partOfSpeech + meaning.definitions[0].definition;
                
                // Get pronunciation data
                if (data[0].phonetics && data[0].phonetics.length > 0) {
                    // Find phonetic with audio URL
                    const phoneticWithAudio = data[0].phonetics.find(p => p.audio);
                    if (phoneticWithAudio) {
                        pronunciation = phoneticWithAudio.audio;
                        phonetic = phoneticWithAudio.text;
                    } else if (data[0].phonetics[0]) {
                        phonetic = data[0].phonetics[0].text;
                    }
                }
            } else {
                // If definition not found, try stop words API
                const stopWordsResponse = await fetch(`https://api.datamuse.com/words?sp=${encodeURIComponent(cleanWord)}&md=d&max=1`);
                const stopWordsData = await stopWordsResponse.json();
                
                if (stopWordsData && stopWordsData.length > 0) {
                    const stopWordEntry = stopWordsData[0];
                    if (stopWordEntry.defs && stopWordEntry.defs.length > 0) {
                        definition = stopWordEntry.defs[0];
                    }
                }
            }
        } catch (apiError) {
            // API error, continue with default definition
        }
        
        // Save to storage
        const result = await chrome.storage.local.get(['vocabulary']);
        const vocabulary = result.vocabulary || [];
        
        // Check if word already exists
        const existingIndex = vocabulary.findIndex(w => w.word.toLowerCase() === cleanWord.toLowerCase());
        if (existingIndex === -1) {
            vocabulary.push({
                word: cleanWord,
                definition: definition,
                pronunciation: pronunciation,
                phonetic: phonetic,
                dateAdded: new Date().toISOString(),
                reviewCount: 0,
                url: window.location.href
            });
            
            await chrome.storage.local.set({ vocabulary: vocabulary });
            return true;
        } else {
            // Update existing word with new data
            vocabulary[existingIndex] = {
                ...vocabulary[existingIndex],
                definition: definition,
                pronunciation: pronunciation,
                phonetic: phonetic
            };
            await chrome.storage.local.set({ vocabulary: vocabulary });
            return true;
        }
        
    } catch (error) {
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







 

function addPDFTextLayerSelectionListener() {
  const textLayer = document.querySelector('.textLayer');
  if (textLayer) {
    textLayer.addEventListener('mouseup', () => {
      const sel = window.getSelection().toString().trim();
      if (sel && sel !== selectedText) {
        selectedText = sel;
        showSaveIndicator();
      }
    });
  }
}
addPDFTextLayerSelectionListener(); 



} // Close the else block from the beginning 

// Function to play pronunciation
function playPronunciation(audioUrl) {
  return new Promise((resolve, reject) => {
    const audio = new Audio(audioUrl);
    audio.onended = () => resolve();
    audio.onerror = () => reject(new Error('Audio playback failed'));
    audio.play().catch(reject);
  });
}

// Function to speak text using Web Speech API
function speakText(text, lang = 'en-US') {
  return new Promise((resolve, reject) => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = lang;
      utterance.onend = () => resolve();
      utterance.onerror = (event) => reject(new Error('Speech synthesis failed'));
      speechSynthesis.speak(utterance);
    } else {
      reject(new Error('Speech synthesis not supported'));
    }
  });
}

// Function to get pronunciation for a word
async function getWordPronunciation(word) {
  try {
    // First try to get pronunciation from storage
    const result = await chrome.storage.local.get(['vocabulary']);
    const vocabulary = result.vocabulary || [];
    const wordData = vocabulary.find(w => w.word.toLowerCase() === word.toLowerCase());
    
    if (wordData && wordData.pronunciation) {
      // Use audio URL from storage
      return await playPronunciation(wordData.pronunciation);
    } else if (wordData && wordData.phonetic) {
      // Use Web Speech API with phonetic text
      return await speakText(word, 'en-US');
    } else {
      // Fallback to Web Speech API
      return await speakText(word, 'en-US');
    }
  } catch (error) {
    // Fallback to Web Speech API if audio URL fails
    try {
      return await speakText(word, 'en-US');
    } catch (speechError) {
      console.error('Pronunciation failed:', speechError);
      throw speechError;
    }
  }
} 


