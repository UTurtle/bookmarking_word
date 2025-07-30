// Background script for handling keyboard shortcuts and word saving

// Initialize features directly since permissions are now required
function initializeFeatures() {
  console.log('Initializing extension features...');
  
  // Initialize context menu for PDF files
  chrome.contextMenus.create({
    id: "openPdfInViewer",
    title: "Open in Mozilla PDF Viewer (Remote files only)",
    contexts: ["link"],
    targetUrlPatterns: ["*://*/*.pdf"]
  }, () => {
    if (chrome.runtime.lastError) {
      console.log('Context menu creation error:', chrome.runtime.lastError);
    } else {
      console.log('Context menu created successfully');
    }
  });
  
  // Add context menu click listener
  chrome.contextMenus.onClicked.addListener(async (info, tab) => {
    try {
      if (info.menuItemId === "openPdfInViewer") {
        const pdfUrl = info.linkUrl;
        if (pdfUrl && pdfUrl.toLowerCase().endsWith('.pdf')) {
          const pdfViewerUrl = 'https://mozilla.github.io/pdf.js/web/viewer.html?file=' + encodeURIComponent(pdfUrl);
          chrome.tabs.create({ url: pdfViewerUrl });
        }
      }
    } catch (error) {
      console.error('Error in contextMenus.onClicked listener:', error);
    }
  });
  
  // Initialize new tab override
  initializeNewTabOverride();
  
  // Initialize PDF redirect
  initializePdfRedirect();
  
  console.log('All features initialized successfully');
}

// Initialize new tab override functionality
function initializeNewTabOverride() {
  console.log('Initializing new tab override functionality');
  
  // Handle new tab override
  const handleTabCreated = async (tab) => {
    try {
      console.log('Tab created:', {
        id: tab.id,
        pendingUrl: tab.pendingUrl,
        url: tab.url,
        status: tab.status
      });
      
      // Only redirect if this is actually a new tab
      const isNewTab = (tab.pendingUrl === 'chrome://newtab/' || 
                       tab.pendingUrl === 'chrome://new-tab-page/' ||
                       tab.pendingUrl === 'about:newtab');
      
      console.log('Is new tab:', isNewTab, 'pendingUrl:', tab.pendingUrl, 'url:', tab.url);
      
      // More strict redirect condition - only redirect actual new tabs
      const shouldRedirect = isNewTab && 
          tab.pendingUrl !== 'about:blank' && 
          tab.url !== 'about:blank' &&
          tab.status === 'loading';
      
      console.log('Should redirect:', shouldRedirect, {
          isNewTab,
          hasNoUrl: !tab.url,
          isNewTabUrl: tab.url === 'chrome://newtab/' || tab.url === 'about:newtab',
          isNotAboutBlank: tab.pendingUrl !== 'about:blank' && tab.url !== 'about:blank',
          isLoading: tab.status === 'loading'
      });
      
      if (shouldRedirect) {
          // Simple redirect preparation
          console.log('Preparing to redirect new tab to custom page');
          
          // Get the extension URL for the new tab page
          const newTabUrl = chrome.runtime.getURL('src/html/newtab.html');
          console.log('Redirecting to:', newTabUrl);
          
          // Update the tab to our custom new tab page
          await chrome.tabs.update(tab.id, { url: newTabUrl });
          console.log('New tab redirected successfully');
      }
    } catch (error) {
      console.error('Error handling tab creation:', error);
    }
  };
  
  // Add the listener
  chrome.tabs.onCreated.addListener(handleTabCreated);
  console.log('New tab override listener added');
}

// Initialize PDF redirect functionality
function initializePdfRedirect() {
  console.log('Initializing PDF redirect functionality');
  
  const handleBeforeNavigate = async (details) => {
    try {
      // Check if this is a PDF file
      const url = details.url;
      if (url && url.toLowerCase().endsWith('.pdf')) {
        console.log('PDF detected:', url);
        
        // Check if it's a remote PDF (not a local file)
        if (url.startsWith('http://') || url.startsWith('https://')) {
          console.log('Remote PDF detected, redirecting to viewer');
          
          // Redirect to Mozilla PDF viewer
          const pdfViewerUrl = 'https://mozilla.github.io/pdf.js/web/viewer.html?file=' + encodeURIComponent(url);
          
          // Update the current tab to the PDF viewer
          await chrome.tabs.update(details.tabId, { url: pdfViewerUrl });
          console.log('PDF redirected to viewer successfully');
        } else {
          console.log('Local PDF file, not redirecting');
        }
      }
    } catch (error) {
      console.error('Error handling PDF redirect:', error);
    }
  };
  
  // Add the listener
  chrome.webNavigation.onBeforeNavigate.addListener(handleBeforeNavigate);
  console.log('PDF redirect listener added');
}

// Function to validate if text is a valid English word
function isValidWord(text) {
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
            console.log('Sensitive information detected, blocking save:', text);
            return false;
        }
    }
    
    // Final check: must be pure English word (letters, hyphens, apostrophes only)
    if (!/^[a-zA-Z\-']+$/.test(text)) {
        return false;
    }
    
    return true;
}

// Function to save selected word
async function saveSelectedWord(selectedText, tabUrl = null) {
  try {
    if (selectedText && selectedText.trim()) {
      const word = selectedText.trim();
      
      // Validate that it's a valid English word
      if (!isValidWord(word)) {
        console.log('Word validation failed in background script:', word);
        // Invalid words are not saved or transmitted to any server
        return;
      }
      
      const wordLower = word.toLowerCase();
      
      // Get word definition
      const definition = await getWordDefinition(wordLower);
      
      // Save word to storage
      await saveWordToStorage(wordLower, definition, tabUrl);
      
      // Show notification
      chrome.action.setBadgeText({ text: "✓" });
      setTimeout(() => {
        chrome.action.setBadgeText({ text: "" });
      }, 2000);
    }
  } catch (error) {
    console.error("Error saving word:", error);
  }
}

// Function to get word definition from API
async function getWordDefinition(word) {
  try {
    // Additional validation for the word
    if (!word || word.length < 2 || word.length > 20) {
      console.log('Invalid word length:', word);
      return "Invalid word";
    }
    
    // Check if word contains only valid characters
    if (!/^[a-zA-Z\-']+$/.test(word)) {
      console.log('Invalid word characters:', word);
      return "Invalid word format";
    }
    
    console.log('Fetching definition for word:', word);
    
    // First try the regular dictionary API
    const response = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(word)}`);
    
    if (!response.ok) {
      console.log(`Dictionary API returned ${response.status} for word: ${word}`);
      // Try alternative API
      const stopWordsResponse = await fetch(`https://api.datamuse.com/words?sp=${encodeURIComponent(word)}&md=d&max=1`);
      const stopWordsData = await stopWordsResponse.json();
      
      if (stopWordsData && stopWordsData.length > 0) {
        const stopWordEntry = stopWordsData[0];
        if (stopWordEntry.defs && stopWordEntry.defs.length > 0) {
          return stopWordEntry.defs[0];
        }
      }
      return "Definition not found";
    }
    
    const data = await response.json();
    
    if (Array.isArray(data) && data.length > 0) {
      const entry = data[0];
      if (entry.meanings && entry.meanings.length > 0) {
        // Get the first definition
        const definition = entry.meanings[0].definitions[0].definition;
        
        // Add part of speech if available
        const partOfSpeech = entry.meanings[0].partOfSpeech;
        if (partOfSpeech) {
          return `(${partOfSpeech}) ${definition}`;
        }
        
        return definition;
      }
    }
    
    // If definition not found, try stop words API
    console.log(`Definition not found for "${word}", trying stop words API`);
    const stopWordsResponse = await fetch(`https://api.datamuse.com/words?sp=${encodeURIComponent(word)}&md=d&max=1`);
    const stopWordsData = await stopWordsResponse.json();
    
    if (stopWordsData && stopWordsData.length > 0) {
      const stopWordEntry = stopWordsData[0];
      if (stopWordEntry.defs && stopWordEntry.defs.length > 0) {
        return stopWordEntry.defs[0];
      }
    }
    
    return "Definition not found";
  } catch (error) {
    console.error("Error fetching definition:", error);
    return "Definition not available";
  }
}

// Function to save word to storage
async function saveWordToStorage(word, definition, url) {
  try {
    const result = await chrome.storage.local.get(['vocabulary']);
    const vocabulary = result.vocabulary || [];
    
    // Check if word already exists
    const existingIndex = vocabulary.findIndex(item => item.word === word);
    
    if (existingIndex === -1) {
      // Add new word
      vocabulary.push({
        word: word,
        definition: definition,
        url: url,
        dateAdded: new Date().toISOString(),
        reviewCount: 0,
        todayVocaCount: 0
      });
    } else {
      // Update existing word
      vocabulary[existingIndex].reviewCount += 1;
      vocabulary[existingIndex].lastReviewed = new Date().toISOString();
    }
    
    await chrome.storage.local.set({ vocabulary: vocabulary });
    console.log(`Word "${word}" saved successfully`);
  } catch (error) {
    console.error("Error saving to storage:", error);
  }
}

// Handle keyboard shortcut
try {
  chrome.commands.onCommand.addListener(async (command) => {
    if (command === "save-word") {
      try {
        // Get the active tab using activeTab permission
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        
        // Check if the tab URL is accessible
        if (tab.url && tab.url.startsWith('chrome://')) {
          console.log('Cannot access content from chrome:// pages:', tab.url);
          return;
        }
        
        // For chrome-extension:// pages (including newtab), use message passing
        if (tab.url && tab.url.startsWith('chrome-extension://')) {
          console.log('Extension page detected:', tab.url);
          if (tab.url.includes('newtab.html')) {
            console.log('New tab page detected - using message passing for keyboard shortcut');
            // Send message to newtab.js to get selected text
            try {
              const response = await chrome.tabs.sendMessage(tab.id, {
                action: 'getSelectedText'
              });
              
              if (response && response.selectedText) {
                await saveSelectedWord(response.selectedText, response.url);
              }
            } catch (error) {
              console.error('Error getting selected text from newtab page:', error);
            }
            return;
          }
        }
        
        // Execute script to get selected text from content script for regular web pages
        const results = await chrome.scripting.executeScript({
          target: { tabId: tab.id },
          function: () => {
            return {
              selectedText: window.getSelection().toString().trim(),
              url: window.location.href
            };
          }
        });
        
        const result = results[0].result;
        const selectedText = result.selectedText;
        const tabUrl = result.url;
        
        if (selectedText) {
          await saveSelectedWord(selectedText, tabUrl);
        }
      } catch (error) {
        console.error("Error handling keyboard shortcut:", error);
      }
    }
  });
} catch (error) {
  console.log('Commands API not available, skipping keyboard shortcut setup');
}

// Note: Message listener is now handled in the combined listener above

// Enhanced service worker lifecycle management
try {
  chrome.runtime.onStartup.addListener(async () => {
    console.log('Extension startup - initializing features');
    initializeFeatures(); // Call the new initializeFeatures function
  });
} catch (error) {
  console.log('Runtime startup API not available');
}

// Initialize optional features on installation
try {
  chrome.runtime.onInstalled.addListener(async (details) => {
    console.log('Extension installed/updated - initializing features', details);
    initializeFeatures(); // Call the new initializeFeatures function
  });
} catch (error) {
  console.log('Runtime installed API not available');
}

// Handle service worker lifecycle
try {
  chrome.runtime.onSuspend.addListener(() => {
    console.log('Service worker suspending - cleaning up');
    // No specific cleanup needed here as features are initialized on startup/install
  });
} catch (error) {
  console.log('Runtime lifecycle APIs not available');
}

// Note: Chrome Extension Service Workers don't use self.addEventListener
// They use chrome.runtime.onInstalled and chrome.runtime.onStartup instead

// Enhanced service worker management and message handling
try {
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    console.log('Message received:', request);
    
    // Always respond to keep service worker alive
    if (request.action === "ping" || request.action === "keepAlive") {
      sendResponse({ status: "alive", timestamp: Date.now() });
      return true;
    }
    
    if (request.action === "saveWord") {
      // Call saveSelectedWord with the word from content script
      saveSelectedWord(request.word, request.url).then(() => {
        sendResponse({ success: true });
      }).catch((error) => {
        console.error("Error in message handler:", error);
        sendResponse({ success: false, error: error.message });
      });
      return true; // Keep message channel open for async response
    }
    
    if (request.action === "wakeUp") {
      // Simple status check
      console.log('Service worker status check');
      sendResponse({ status: "active", timestamp: Date.now() });
      return true;
    }
    
    // New permission management messages
    if (request.action === "checkPermissions") {
      // This function is no longer needed as permissions are required
      sendResponse({ success: true, permissions: { hasTabs: true, hasWebNavigation: true, hasContextMenus: true } });
      return true;
    }
    
    if (request.action === "requestPermissions") {
      // This function is no longer needed as permissions are required
      sendResponse({ success: true, granted: true });
      return true;
    }
    
    if (request.action === "initializeFeatures") {
      initializeFeatures(); // Call the new initializeFeatures function
      sendResponse({ success: true });
      return true;
    }
  });
} catch (error) {
  console.log('Runtime message API not available, skipping message listener setup');
}