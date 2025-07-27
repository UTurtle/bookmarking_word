# Chrome Web Store Permission Explanations

## Required Permissions

### storage
**Required to store vocabulary data locally in the user's browser. This permission is essential for the core functionality of saving and managing words. No data is transmitted to external servers.**

### activeTab
**Required to read selected text from the currently active tab when users press Ctrl+Shift+S or use the word saving functionality. This permission is necessary for the primary feature of capturing words from web pages.**

### scripting
**Required to execute content scripts that enable word selection and saving functionality across web pages. This permission allows the extension to interact with web page content to capture selected text.**

## Host Permissions

### https://*/*
**Required for content scripts to run on all HTTPS websites to enable word saving functionality. This permission is essential because users need to save words from any website they visit - whether it's educational content, news articles, research papers, or any other web page. The extension only accesses the specific text selected by the user and does not collect any other page content or browsing data. This is the core functionality of the extension and cannot be limited to specific websites as users need to save vocabulary from any webpage they encounter.**

## Optional Permissions

### tabs
**Optional for replacing the new tab page with a vocabulary learning board. This provides users with a customized learning experience when opening new tabs. Users can choose to enable this feature through the extension settings.**

### webNavigation
**Optional for automatically redirecting PDF files to PDF.js viewer because default browser PDF viewers often prevent word saving functionality entirely. This feature enables users to save words from PDF documents where the default viewer blocks text selection. This feature is optional and can be disabled by users. Only processes PDF URLs and does not collect browsing history.**

### contextMenus
**Optional for creating a right-click context menu for PDF links that allows users to open PDF files in PDF.js viewer. This provides an alternative way to access PDF files when the default browser PDF viewer prevents word saving functionality.**

## API Host Permissions

### https://api.dictionaryapi.dev/*
**Required to retrieve word definitions and meanings when users save words or look up definitions. This API provides comprehensive word information including definitions, examples, and phonetic data. The extension only sends the specific word being looked up and does not transmit any other user data.**

### https://api.datamuse.com/*
**Required to find related words, synonyms, and antonyms for saved vocabulary. This API also serves as a fallback for word definitions when the primary dictionary API doesn't have results. The extension only sends the specific word being searched and does not transmit any other user data.**

## Data Collection Disclosure

### Web History
**URL information is processed for PDF file redirection functionality when the optional webNavigation permission is granted. This is limited to PDF URLs only and does not collect general browsing history.**

### User Activity
**Text selection and right-click menu usage information is processed to enable word saving functionality. This includes detecting when users select text and interact with the extension's interface.**

### Website Content
**Selected text is read to save words to the vocabulary list. Only the specific text selected by the user is processed, and no other page content is accessed or stored. The extension includes comprehensive security measures to prevent saving sensitive information such as passwords, credit card numbers, personal identifiers, or any text containing numbers or special characters. Only pure English words (letters, hyphens, and apostrophes only) between 2-20 characters are accepted for vocabulary saving.**

## Security and Privacy Protection

### Sensitive Information Detection
**The extension automatically detects and blocks attempts to save sensitive information including:**
- Passwords, API keys, tokens, and authentication data
- Credit card numbers, bank account information, and financial data
- Social security numbers, phone numbers, and personal identifiers
- Email addresses and postal codes
- Any text containing numbers or special characters

### Input Validation
**Only pure English words are accepted for vocabulary saving:**
- Letters (a-z, A-Z) only
- Hyphens (-) and apostrophes (') allowed for compound words
- Length: 2-20 characters
- No spaces, numbers, or special characters
- No Korean or other non-English characters

### User Feedback
**When sensitive information is detected, users receive a clear warning message explaining why the text cannot be saved, ensuring transparency and user awareness.**

## Limited Use Compliance

This extension complies with Chrome Web Store's Limited Use requirements:

- **Permitted Uses**: All data collection and usage is limited to providing vocabulary learning and related features
- **No Advertising**: No personalized, re-targeted, or interest-based advertisements are served
- **No Data Sale**: User data is never sold or transferred to third parties for any purpose
- **No Human Review**: No human access to user data is permitted
- **No Credit Assessment**: Data is never used for credit assessment or loan purposes

All data is stored locally in the user's browser and is not transmitted to external servers except for the specific API calls mentioned above.

## Web Accessible Resources

### Extension Resources
**The extension's HTML, CSS, and JavaScript files are made accessible to web pages to enable the vocabulary learning features such as the custom new tab page, quiz functionality, and today's vocabulary interface. These resources are only loaded when users explicitly interact with the extension's features and do not collect any user data.** 