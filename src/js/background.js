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
    console.log('New tab created:', tab.url, 'pendingUrl:', tab.pendingUrl);
    
    // If this tab has a specific URL from the start, don't redirect it
    if (tab.pendingUrl && 
        tab.pendingUrl !== 'chrome://newtab/' && 
        tab.pendingUrl !== 'about:newtab' &&
        !tab.pendingUrl.startsWith('chrome://newtab')) {
        console.log('Tab has specific URL from start, not redirecting:', tab.pendingUrl);
        redirectedTabs.add(tab.id);
        return;
    }
    
    // Only redirect if this is a truly empty new tab
    const isEmptyNewTab = (!tab.url || 
                          tab.url === 'chrome://newtab/' || 
                          tab.url === 'about:newtab' ||
                          tab.url === 'chrome://newtab') &&
                         (!tab.pendingUrl || 
                          tab.pendingUrl === 'chrome://newtab/' || 
                          tab.pendingUrl === 'about:newtab');
    
    if (isEmptyNewTab) {
        // Use a longer delay for slower computers, but also check if tab was marked as redirected
        setTimeout(async () => {
            try {
                // Check if tab was already marked as redirected during the delay
                if (redirectedTabs.has(tab.id)) {
                    console.log('Tab was marked as redirected during delay, skipping');
                    return;
                }
                
                // Get the updated tab info
                const updatedTab = await chrome.tabs.get(tab.id);
                console.log('Updated tab info after delay:', updatedTab.url, 'pendingUrl:', updatedTab.pendingUrl);
                
                // Double-check if tab was marked as redirected
                if (redirectedTabs.has(updatedTab.id)) {
                    console.log('Tab already marked as redirected, skipping');
                    return;
                }
                
                // Only redirect if this is still a truly empty new tab
                const stillEmptyNewTab = (!updatedTab.url || 
                                         updatedTab.url === 'chrome://newtab/' || 
                                         updatedTab.url === 'about:newtab' ||
                                         updatedTab.url === 'chrome://newtab') &&
                                        (!updatedTab.pendingUrl || 
                                         updatedTab.pendingUrl === 'chrome://newtab/' || 
                                         updatedTab.pendingUrl === 'about:newtab');
                
                if (stillEmptyNewTab) {
                    const { newtabOverride = true } = await chrome.storage.local.get('newtabOverride');
                    console.log('Newtab override setting:', newtabOverride);
                    
                    if (newtabOverride) {
                        // If override is enabled, redirect to vocabulary board
                        console.log('Newtab override enabled, redirecting to vocabulary board');
                        const newtabUrl = chrome.runtime.getURL('src/html/newtab.html');
                        chrome.tabs.update(updatedTab.id, { url: newtabUrl });
                    } else {
                        console.log('Newtab override disabled, keeping default new tab');
                    }
                } else {
                    console.log('Tab is no longer empty, not redirecting');
                }
            } catch (error) {
                console.error('Error checking newtab override setting:', error);
            }
        }, 500); // Increased delay to 500ms for slower computers
    } else {
        console.log('Not an empty new tab, not redirecting');
    }
});

// Handle tab updates to catch URLs that are loaded after tab creation
chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
    // Only process if the URL changed and it's not already marked as redirected
    if (changeInfo.url && !redirectedTabs.has(tabId)) {
        console.log('Tab URL updated:', tabId, changeInfo.url);
        
        // If the URL is not a newtab URL, mark this tab as redirected
        if (changeInfo.url !== 'chrome://newtab/' && 
            changeInfo.url !== 'about:newtab' &&
            !changeInfo.url.startsWith('chrome://newtab')) {
            console.log('Tab got specific URL, marking as redirected:', changeInfo.url);
            redirectedTabs.add(tabId);
        }
    }
});

// Handle navigation events to catch URLs before they load
chrome.webNavigation.onBeforeNavigate.addListener(async (details) => {
    // Only process main frame navigation
    if (details.frameId === 0) {
        console.log('BeforeNavigate event for tab:', details.tabId, 'URL:', details.url);
        
        // If this is not a newtab URL and not our extension URL, mark the tab as redirected
        if (details.url !== 'chrome://newtab/' && 
            details.url !== 'about:newtab' &&
            !details.url.startsWith('chrome://newtab') &&
            !details.url.startsWith(chrome.runtime.getURL(''))) {
            console.log('Tab is navigating to specific URL, marking as redirected:', details.url);
            redirectedTabs.add(details.tabId);
        }
    }
});

// Clean up redirected tabs when they are closed
chrome.tabs.onRemoved.addListener((tabId) => {
    redirectedTabs.delete(tabId);
});

// Listen for messages from newtab page (kept for potential future use)
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    // Handle any future message types here
    console.log('Received message:', request);
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
  console.log('BeforeNavigate event:', details.url, 'frameId:', details.frameId);
  
  // Check if PDF auto-redirect is enabled
  try {
    const { pdfAutoRedirect = false } = await chrome.storage.local.get('pdfAutoRedirect');
    if (!pdfAutoRedirect) {
      console.log('PDF auto-redirect is disabled');
      return;
    }
  } catch (error) {
    console.log('Error checking PDF auto-redirect setting, using default (disabled)');
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
        reviewCount: 0
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