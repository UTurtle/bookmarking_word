// Background script for handling keyboard shortcuts and word saving

// Initialize features directly since permissions are now required
function initializeFeatures() {
  
  // Initialize context menu for word saving
  chrome.contextMenus.create({
    id: "saveWord",
    title: "Save word to vocabulary",
    contexts: ["selection"]
  }, () => {
    if (chrome.runtime.lastError) {
      // Context menu creation error
    } else {
      // Context menu created successfully
    }
  });
  
  // Add context menu click listener
  chrome.contextMenus.onClicked.addListener(async (info, tab) => {
    try {
      if (info.menuItemId === "saveWord" && info.selectionText) {
        await saveSelectedWord(info.selectionText, tab?.url);
      }
    } catch (error) {
      // Error in contextMenus.onClicked listener
    }
  });
  
  // All features initialized successfully
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
            // Sensitive information detected, blocking save
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
        // Word validation failed in background script
        // Invalid words are not saved or transmitted to any server
        return;
      }
      
      const wordLower = word.toLowerCase();
      
      // Get word definition and pronunciation
      const wordData = await getWordDefinition(wordLower);
      
      // Save word to storage
      await saveWordToStorage(wordLower, wordData, tabUrl);
      
      // Show notification
      chrome.action.setBadgeText({ text: "✓" });
      setTimeout(() => {
        chrome.action.setBadgeText({ text: "" });
      }, 2000);
    }
  } catch (error) {
    // Error saving word
  }
}

// Function to get word definition from API
async function getWordDefinition(word) {
  try {
    // Additional validation for the word
    if (!word || word.length < 2 || word.length > 20) {
      return "Invalid word";
    }
    
    // Check if word contains only valid characters
    if (!/^[a-zA-Z\-']+$/.test(word)) {
      return "Invalid word format";
    }
    
    // Fetching definition for word
    
    // First try the regular dictionary API
    const response = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(word)}`);
    
    if (!response.ok) {
      // Dictionary API returned error status
      // Try alternative API
      const stopWordsResponse = await fetch(`https://api.datamuse.com/words?sp=${encodeURIComponent(word)}&md=d&max=1`);
      const stopWordsData = await stopWordsResponse.json();
      
      if (stopWordsData && stopWordsData.length > 0) {
        const stopWordEntry = stopWordsData[0];
        if (stopWordEntry.defs && stopWordEntry.defs.length > 0) {
          return {
            definition: stopWordEntry.defs[0],
            pronunciation: null,
            phonetic: null
          };
        }
      }
      return {
        definition: "Definition not found",
        pronunciation: null,
        phonetic: null
      };
    }
    
    const data = await response.json();
    
    if (Array.isArray(data) && data.length > 0) {
      const entry = data[0];
      let definition = "Definition not found";
      let pronunciation = null;
      let phonetic = null;
      
      if (entry.meanings && entry.meanings.length > 0) {
        // Get the first definition
        definition = entry.meanings[0].definitions[0].definition;
        
        // Add part of speech if available
        const partOfSpeech = entry.meanings[0].partOfSpeech;
        if (partOfSpeech) {
          definition = `(${partOfSpeech}) ${definition}`;
        }
      }
      
      // Get pronunciation data
      if (entry.phonetics && entry.phonetics.length > 0) {
        // Find phonetic with audio URL
        const phoneticWithAudio = entry.phonetics.find(p => p.audio);
        if (phoneticWithAudio) {
          pronunciation = phoneticWithAudio.audio;
          phonetic = phoneticWithAudio.text;
        } else if (entry.phonetics[0]) {
          phonetic = entry.phonetics[0].text;
        }
      }
      
      return {
        definition: definition,
        pronunciation: pronunciation,
        phonetic: phonetic
      };
    }
    
    // If definition not found, try stop words API
    const stopWordsResponse = await fetch(`https://api.datamuse.com/words?sp=${encodeURIComponent(word)}&md=d&max=1`);
    const stopWordsData = await stopWordsResponse.json();
    
    if (stopWordsData && stopWordsData.length > 0) {
      const stopWordEntry = stopWordsData[0];
      if (stopWordEntry.defs && stopWordEntry.defs.length > 0) {
        return {
          definition: stopWordEntry.defs[0],
          pronunciation: null,
          phonetic: null
        };
      }
    }
    
    return {
      definition: "Definition not found",
      pronunciation: null,
      phonetic: null
    };
  } catch (error) {
    // Error fetching definition
    return {
      definition: "Definition not available",
      pronunciation: null,
      phonetic: null
    };
  }
}

// Function to save word to storage
async function saveWordToStorage(word, wordData, url) {
  try {
    const result = await chrome.storage.local.get(['vocabulary']);
    const vocabulary = result.vocabulary || [];
    
    // Check if word already exists
    const existingIndex = vocabulary.findIndex(w => w.word.toLowerCase() === word.toLowerCase());
    
    if (existingIndex === -1) {
      // Add new word
      vocabulary.push({
        word: word,
        definition: wordData.definition,
        pronunciation: wordData.pronunciation,
        phonetic: wordData.phonetic,
        dateAdded: new Date().toISOString(),
        reviewCount: 0,
        url: url
      });
    } else {
      // Update existing word with new data
      vocabulary[existingIndex] = {
        ...vocabulary[existingIndex],
        definition: wordData.definition,
        pronunciation: wordData.pronunciation,
        phonetic: wordData.phonetic
      };
    }
    
    await chrome.storage.local.set({ vocabulary: vocabulary });
    return true;
  } catch (error) {
    // Error saving word to storage
    return false;
  }
}

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
    const wordData = await getWordDefinition(word);
    
    if (wordData.pronunciation) {
      // Use audio URL from API
      return await playPronunciation(wordData.pronunciation);
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

// Handle keyboard shortcut
try {
  chrome.commands.onCommand.addListener(async (command) => {
    if (command === "save-word") {
      try {
        // Get the active tab using activeTab permission
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        
        // Check if the tab URL is accessible
        if (tab.url && tab.url.startsWith('chrome://')) {
          // Cannot access content from chrome:// pages
          return;
        }
        
        // For chrome-extension:// pages (including newtab), use message passing
        if (tab.url && tab.url.startsWith('chrome-extension://')) {
          // Extension page detected
          if (tab.url.includes('newtab.html')) {
            // New tab page detected - using message passing for keyboard shortcut
            // Send message to newtab.js to get selected text
            try {
              const response = await chrome.tabs.sendMessage(tab.id, {
                action: 'getSelectedText'
              });
              
              if (response && response.selectedText) {
                await saveSelectedWord(response.selectedText, response.url);
              }
                          } catch (error) {
                // Error getting selected text from newtab page
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
        // Error handling keyboard shortcut
      }
    }
  });
} catch (error) {
  // Commands API not available, skipping keyboard shortcut setup
}

// Note: Message listener is now handled in the combined listener above

// Enhanced service worker lifecycle management
try {
  chrome.runtime.onStartup.addListener(async () => {
    // Extension startup - initializing features
    initializeFeatures(); // Call the new initializeFeatures function
  });
} catch (error) {
  // Runtime startup API not available
}

// Initialize optional features on installation
try {
  chrome.runtime.onInstalled.addListener(async (details) => {
    // Extension installed/updated - initializing features
    initializeFeatures(); // Call the new initializeFeatures function
  });
} catch (error) {
  // Runtime installed API not available
}

// Handle service worker lifecycle
try {
  chrome.runtime.onSuspend.addListener(() => {
    // Service worker suspending - cleaning up
    // No specific cleanup needed here as features are initialized on startup/install
  });
} catch (error) {
  // Runtime lifecycle APIs not available
}

// Note: Chrome Extension Service Workers don't use self.addEventListener
// They use chrome.runtime.onInstalled and chrome.runtime.onStartup instead

// Enhanced service worker management and message handling
try {
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    // Message received
    
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
        // Error in message handler
        sendResponse({ success: false, error: error.message });
      });
      return true; // Keep message channel open for async response
    }
    
    if (request.action === "wakeUp") {
      // Simple status check
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
  // Runtime message API not available, skipping message listener setup
}