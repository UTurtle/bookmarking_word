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

// PDF redirection functionality removed for Chrome Web Store compliance
// Users can manually open PDFs in the viewer if needed

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

// Function to get word definition from API
async function getWordDefinition(word) {
    try {
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
    saveSelectedWord().then(() => {
      sendResponse({ success: true });
    });
    return true; // Keep message channel open for async response
  }
}); 