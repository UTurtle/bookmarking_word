// Background script for handling keyboard shortcuts and word saving

// Check if optional permissions are available
async function checkOptionalPermissions() {
  try {
    const permissions = await chrome.permissions.getAll();
    return {
      hasTabs: permissions.permissions.includes('tabs'),
      hasWebNavigation: permissions.permissions.includes('webNavigation'),
      hasContextMenus: permissions.permissions.includes('contextMenus')
    };
  } catch (error) {
    console.error('Error checking permissions:', error);
    return {
      hasTabs: false,
      hasWebNavigation: false,
      hasContextMenus: false
    };
  }
}

// Initialize optional features if permissions are available
async function initializeOptionalFeaturesIfAvailable() {
  const permissions = await checkOptionalPermissions();
  
  if (permissions.hasTabs || permissions.hasWebNavigation || permissions.hasContextMenus) {
    console.log('Optional permissions detected, initializing optional features...');
    
    // Initialize features directly instead of using import()
    initializeOptionalFeatures(permissions);
  }
}

// Initialize optional features directly
function initializeOptionalFeatures(permissions) {
  // Check if API is available before using it
  function isAPIAvailable(apiName) {
    try {
      return chrome[apiName] !== undefined;
    } catch (error) {
      console.error(`Error checking ${apiName} availability:`, error);
      return false;
    }
  }

  // Initialize context menu for PDF files (only if permission is available)
  if (permissions.hasContextMenus && isAPIAvailable('contextMenus')) {
    try {
      chrome.contextMenus.create({
        id: "openPdfInViewer",
        title: "Open in Mozilla PDF Viewer (Remote files only)",
        contexts: ["link"],
        targetUrlPatterns: ["*://*/*.pdf"]
      });
      console.log('Context menu created successfully');
    } catch (error) {
      console.error('Error creating context menu:', error);
    }
  }
  
  // Initialize new tab override (only if permission is available)
  if (permissions.hasTabs && isAPIAvailable('tabs')) {
    initializeNewTabOverride();
  }
  
  // Initialize PDF redirect (only if permission is available)
  if (permissions.hasWebNavigation && isAPIAvailable('webNavigation')) {
    initializePdfRedirect();
  }
}

// Initialize new tab override functionality
function initializeNewTabOverride() {
  console.log('Initializing new tab override functionality');
  
  // Handle new tab override dynamically
  const handleTabCreated = async (tab) => {
    try {
      console.log('Tab created:', {
        id: tab.id,
        pendingUrl: tab.pendingUrl,
        url: tab.url,
        status: tab.status
      });
      
      // Keep service worker alive by simple logging
      console.log('New tab created - service worker active');
      
      // Only redirect if this is actually a new tab (not a navigation to existing tab)
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
          console.log('Redirecting new tab to custom page');
          
          // Add a small delay to ensure the tab is fully created
          setTimeout(async () => {
              try {
                  const result = await chrome.storage.local.get(['newtabOverride', 'todayVocaPriority']);
                  const newtabOverride = result.newtabOverride !== false; // Default to true
                  const todayVocaPriority = result.todayVocaPriority || false; // Default to false
                  
                  console.log('Newtab override settings:', { newtabOverride, todayVocaPriority });
                  
                  if (newtabOverride) {
                      let targetUrl;
                      
                      if (todayVocaPriority) {
                          const today = new Date().toDateString();
                          
                          try {
                              const todayVocaData = await chrome.storage.local.get(['todayVocaData']);
                              const lastTodayVocaDate = todayVocaData.todayVocaData?.date;
                              
                              if (lastTodayVocaDate === today && todayVocaData.todayVocaData?.completed) {
                                  targetUrl = chrome.runtime.getURL('src/html/newtab.html');
                              } else {
                                  targetUrl = chrome.runtime.getURL('src/html/today-voca.html');
                              }
                          } catch (error) {
                              console.error('Error checking Today Voca status:', error);
                              targetUrl = chrome.runtime.getURL('src/html/today-voca.html');
                          }
                      } else {
                          targetUrl = chrome.runtime.getURL('src/html/newtab.html');
                      }
                      
                      console.log('Redirecting to:', targetUrl);
                      chrome.tabs.update(tab.id, { url: targetUrl });
                  } else {
                      console.log('Newtab override is disabled');
                  }
                  // If override is disabled, let it go to the default new tab page
              } catch (error) {
                  console.error('Error checking newtab override setting:', error);
              }
          }, 100);
      }
    } catch (error) {
      console.error('Error in tabs.onCreated listener:', error);
    }
  };
  
  // Add the listener
  chrome.tabs.onCreated.addListener(handleTabCreated);
  
  console.log('New tab override listener added');
}

// Initialize PDF redirect functionality
function initializePdfRedirect() {
  // Auto-redirect PDF files to PDF.js viewer (optional feature)
  chrome.webNavigation.onBeforeNavigate.addListener(async (details) => {
    try {
      const { pdfAutoRedirect = false } = await chrome.storage.local.get('pdfAutoRedirect');
      if (!pdfAutoRedirect) {
        return;
      }
    } catch (error) {
      return;
    }
    
    // Only process in main frame and check if it's a PDF file
    const isPdfUrl = details.url.toLowerCase().endsWith('.pdf') || 
                     details.url.includes('/pdf/') ||
                     details.url.includes('application/pdf') ||
                     details.url.includes('content-type=application/pdf');
                     
    if (details.frameId === 0 && isPdfUrl) {
      console.log('PDF file detected:', details.url);
      
      // Don't redirect if already on viewer.html page (prevent infinite loop)
      if (details.url.includes('viewer.html')) {
        console.log('Already on viewer.html page, skipping redirect');
        return;
      }
      
      // Don't redirect extension internal URLs
      if (details.url.startsWith(chrome.runtime.getURL(''))) {
        console.log('Extension internal URL, skipping redirect');
        return;
      }
      
      // Don't redirect chrome:// or chrome-extension:// URLs
      if (details.url.startsWith('chrome://') || details.url.startsWith('chrome-extension://')) {
        console.log('Chrome internal URL, skipping redirect');
        return;
      }
      
      // Don't redirect data: URLs
      if (details.url.startsWith('data:')) {
        console.log('Data URL, skipping redirect');
        return;
      }
      
      // Don't redirect local files (use Chrome default behavior)
      if (details.url.startsWith('file:///')) {
        console.log('Local PDF file, not redirecting (using Chrome default behavior)');
        return;
      }
      
      if (details.url.includes('mozilla.github.io/pdf.js/web/viewer.html') && 
          details.url.includes('file%3A%2F%2F%2F')) {
        console.log('Mozilla viewer attempting to load local file - stopping redirect');
        return;
      }
      
      console.log('All conditions passed, attempting redirect');
      
      try {
        const pdfViewerUrl = 'https://mozilla.github.io/pdf.js/web/viewer.html?file=' + encodeURIComponent(details.url);
        console.log('PDF viewer URL (Mozilla):', pdfViewerUrl);
        
        setTimeout(() => {
          chrome.tabs.update(details.tabId, { url: pdfViewerUrl }, (tab) => {
            if (chrome.runtime.lastError) {
              console.error('PDF redirection error:', chrome.runtime.lastError);
            } else {
              console.log('PDF file opened successfully in Mozilla viewer');
            }
          });
        }, 100);
        
      } catch (error) {
        console.error('PDF redirection error:', error);
      }
    }
  });
}

// Handle context menu clicks
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

// Function to save selected word
async function saveSelectedWord(selectedText) {
  try {
    // Get the active tab
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    if (selectedText && selectedText.trim()) {
      const word = selectedText.trim().toLowerCase();
      
      // Get word definition
      const definition = await getWordDefinition(word);
      
      // Save word to storage
      await saveWordToStorage(word, definition, tab.url);
      
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
    // First try the regular dictionary API
    const response = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${word}`);
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
    const stopWordsResponse = await fetch(`https://api.datamuse.com/words?sp=${word}&md=d&max=1`);
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
chrome.commands.onCommand.addListener(async (command) => {
  if (command === "save-word") {
    try {
      // Get the active tab
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      
      // Execute script to get selected text from content script
      const results = await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        function: () => {
          return window.getSelection().toString().trim();
        }
      });
      
      const selectedText = results[0].result;
      
      if (selectedText) {
        await saveSelectedWord(selectedText);
      }
    } catch (error) {
      console.error("Error handling keyboard shortcut:", error);
    }
  }
});

// Note: Message listener is now handled in the combined listener above

// Initialize optional features on startup
chrome.runtime.onStartup.addListener(() => {
  console.log('Extension startup - initializing features');
  initializeOptionalFeaturesIfAvailable();
});

// Initialize optional features on installation
chrome.runtime.onInstalled.addListener((details) => {
  console.log('Extension installed/updated - initializing features', details);
  initializeOptionalFeaturesIfAvailable();
});

// Note: Chrome Extension Service Workers don't use self.addEventListener
// They use chrome.runtime.onInstalled and chrome.runtime.onStartup instead

// Keep service worker alive and handle messages
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('Message received:', request);
  
  // Always respond to keep service worker alive
  if (request.action === "ping" || request.action === "keepAlive") {
    sendResponse({ status: "alive", timestamp: Date.now() });
    return true;
  }
  
  if (request.action === "saveWord") {
    // Call saveSelectedWord with the word from content script
    saveSelectedWord(request.word).then(() => {
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
});