// Background script for handling keyboard shortcuts and word saving

// Create context menu
chrome.runtime.onInstalled.addListener(() => {
      // Create context menu for PDF files
         chrome.contextMenus.create({
         id: "openPdfInViewer",
         title: "Open in Mozilla PDF Viewer (Remote files only)",
         contexts: ["link"],
         targetUrlPatterns: ["*://*/*.pdf"]
       });
});

// Track tabs that should not be redirected
const redirectedTabs = new Set();

// Handle new tab override dynamically
chrome.tabs.onCreated.addListener(async (tab) => {
    console.log('Tab created:', {
        id: tab.id,
        pendingUrl: tab.pendingUrl,
        url: tab.url,
        status: tab.status
    });
    
    // Only redirect if this is actually a new tab (not a navigation to existing tab)
    const isNewTab = (tab.pendingUrl === 'chrome://newtab/' || 
                     tab.pendingUrl === 'about:newtab' ||
                     tab.pendingUrl === undefined ||
                     tab.pendingUrl === null);
    
    console.log('Is new tab:', isNewTab);
    
    // Additional check: make sure this is not a navigation to an existing URL
    // Don't redirect if it's about:blank
    // Only redirect if the tab is actually empty or going to new tab
    const shouldRedirect = isNewTab && 
        (tab.url === 'chrome://newtab/' || tab.url === 'about:newtab' || !tab.url) && 
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
        // Add a small delay to ensure the tab is fully created
        setTimeout(async () => {
            try {
                const result = await chrome.storage.local.get(['newtabOverride', 'todayVocaPriority']);
                const newtabOverride = result.newtabOverride !== false; // Default to true
                const todayVocaPriority = result.todayVocaPriority || false; // Default to false
                
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
                    
                    chrome.tabs.update(tab.id, { url: targetUrl });
                }
                // If override is disabled, let it go to the default new tab page
            } catch (error) {
                console.error('Error checking newtab override setting:', error);
            }
        }, 100);
    }
});



// Handle navigation events to catch URLs before they load
// This is only used for tracking redirected tabs, not for redirecting
chrome.webNavigation.onBeforeNavigate.addListener(async (details) => {
    if (details.frameId === 0) {
        // Only track if this is a navigation to a non-extension URL
        // Don't track about:blank navigations
        if (details.url !== 'chrome://newtab/' && 
            details.url !== 'about:newtab' &&
            details.url !== 'about:blank' &&
            !details.url.startsWith('chrome://newtab') &&
            !details.url.startsWith(chrome.runtime.getURL(''))) {
            redirectedTabs.add(details.tabId);
        }
    }
});

// Clean up redirected tabs when they are closed
chrome.tabs.onRemoved.addListener((tabId) => {
    redirectedTabs.delete(tabId);
});

// Add tab update listener for debugging
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    console.log('Tab updated:', {
        tabId,
        changeInfo,
        url: tab.url,
        status: tab.status,
        pendingUrl: tab.pendingUrl
    });
    
    // Check if this is an unwanted redirect
    if (changeInfo.url && 
        !changeInfo.url.startsWith(chrome.runtime.getURL('')) &&
        changeInfo.url !== 'chrome://newtab/' &&
        changeInfo.url !== 'about:newtab' &&
        changeInfo.url !== 'about:blank') {
        console.log('External URL navigation detected:', changeInfo.url);
    }
});

// Listen for messages from newtab page (kept for potential future use)
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    sendResponse({ success: true });
});

// Handle context menu clicks
chrome.contextMenus.onClicked.addListener((info, tab) => {
           if (info.menuItemId === "openPdfInViewer") {
           const pdfUrl = info.linkUrl;
           if (pdfUrl && pdfUrl.toLowerCase().endsWith('.pdf')) {
             const pdfViewerUrl = 'https://mozilla.github.io/pdf.js/web/viewer.html?file=' + encodeURIComponent(pdfUrl);
             chrome.tabs.create({ url: pdfViewerUrl });
           }
         }
});

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

chrome.commands.onCommand.addListener(async (command) => {
  if (command === "save-word") {
    await saveSelectedWord();
  }
});

// Function to save selected word
async function saveSelectedWord() {
  try {
    // Get the active tab
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    // Execute script to get selected text
    const results = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      function: getSelectedText
    });
    
    const selectedText = results[0].result;
    
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

// Function to get selected text from page
function getSelectedText() {
  return window.getSelection().toString();
}

// Function to get word definition from API with stop words fallback
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

// Listen for messages from content script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "saveWord") {
    saveWordToStorage(request.word, "Definition will be fetched later", sender.tab?.url || "").then(() => {
      sendResponse({ success: true });
    });
    return true; // Keep message channel open for async response
  }
}); 