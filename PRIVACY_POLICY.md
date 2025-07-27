# Privacy Policy

**Last Updated**: January 27, 2025

## 1. Information We Collect

### 1.1 Automatically Collected Information
- **Web History**: URL information is processed for PDF file redirection functionality and to track which pages you visit for word saving context
- **User Activity**: Text selection, mouse clicks, keyboard shortcuts (Ctrl+Shift+S), and right-click menu usage information is processed to enable word saving functionality
- **Website Content**: Selected text/words are read from web pages to save to your vocabulary list

### 1.2 Information We Do Not Collect
- Personally identifiable information (name, address, email, etc.)
- Health information
- Financial and payment information
- Authentication information (passwords, login information)
- Personal communications
- Location information

### 1.3 Information We Transmit to External APIs
- **Selected Words Only**: When you select and save a word, only that specific word is sent to external dictionary APIs
- **Word Validation**: Before transmission, we validate that the selected text is a valid English word (letters, hyphens, apostrophes only, no numbers or special characters)
- **Sensitive Information Filtering**: We automatically filter out text that contains sensitive patterns (passwords, tokens, credit card numbers, etc.)
- **No Context**: We do not send surrounding text, page content, or any other context
- **Purpose**: Words are sent solely to retrieve definitions and example sentences for vocabulary learning

## 2. How We Use Information

### 2.1 Core Features
- **Word Saving**: Save selected text to vocabulary list
- **Word Definition Lookup**: Provide word definitions and examples through external APIs
- **Learning Progress Tracking**: Manage review schedules using SRS algorithm
- **Quiz Features**: Learning quizzes using saved words

### 2.2 Additional Features
- **New Tab Page Replacement**: Customized new tab page for vocabulary learning
- **PDF Redirection**: Enhanced text selection through PDF.js viewer

## 3. Information Storage and Transmission

### 3.1 Local Storage
- All word data is stored locally in the user's browser
- No data is transmitted to servers

### 3.2 External API Usage
- **Dictionary API**: Used only for word definition lookup
- **Datamuse API**: Used only for related words and synonym search
- **Word Validation**: All selected text is validated as valid English words before API transmission
- **Sensitive Data Protection**: Text containing sensitive patterns is automatically blocked from transmission
- **Word Transmission**: Only validated English words are transmitted during API calls
- **No Additional Data**: No surrounding text, page content, or any other user data is transmitted
- **API Purpose**: Valid words are sent exclusively to retrieve definitions and examples for vocabulary learning

## 4. Data Security

### 4.1 Encryption
- All external API communications are encrypted via HTTPS
- Local storage data uses Chrome's secure storage

### 4.2 Access Restrictions
- Developers or third parties cannot access user data
- All data processing occurs only within the user's browser

## 5. User Rights

### 5.1 Data Access and Modification
- Saved words can be viewed, modified, or deleted at any time
- Data can be exported in CSV format

### 5.2 Data Deletion
- All local data is automatically deleted when the extension is removed
- Individual words can be deleted at any time

## 6. Permission Usage

### 6.1 Required Permissions
- **storage**: Store word data locally in your browser
- **activeTab**: Read selected text from current tab to save words
- **scripting**: Execute content scripts for word selection functionality
- **host_permissions**: 
  - Access to all HTTPS websites (`https://*/*`) to enable word saving functionality on any webpage users visit
  - Access to dictionary APIs (api.dictionaryapi.dev, api.datamuse.com) to fetch word definitions, relate words, opposite words, and examples

### 6.2 Optional Permissions
- **tabs**: New tab page replacement functionality
- **webNavigation**: PDF auto-redirect functionality
- **contextMenus**: PDF link right-click menu

## 7. Limited Use Requirements

### 7.1 Permitted Uses
- Provide vocabulary learning and related features
- Word definition lookup by sending validated English words to external APIs
- Learning progress tracking and quiz functionality
- Fetch word definitions and examples from dictionary APIs when you save a valid word
- Validate and filter selected text to ensure only appropriate English words are processed

### 7.2 Prohibited Uses
- Serve personalized advertisements
- Sell user data to third parties
- Allow humans to read user data
- Use for credit assessment or loan purposes
- Use collected data for any purpose other than vocabulary learning and word management
- Share or transmit user data except for the specific word needed for dictionary API lookup

## 8. Policy Changes

This Privacy Policy may be changed without prior notice. Users will be notified of significant changes through extension updates.

## 9. Contact

For questions about this Privacy Policy, please contact us through the GitHub repository Issues.

---

**Confirmation**: This extension complies with Chrome Web Store Developer Program Policies and handles user data safely and transparently. 

## Chrome Web Store Data Collection Declaration

This extension collects the following user data categories as required by Chrome Web Store policies:

### Data Categories Collected:
- **Website Content**: Selected text/words from web pages for vocabulary saving (with validation to ensure only valid English words are processed)
- **User Activity**: Text selection, mouse clicks, keyboard shortcuts for word saving functionality  
- **Web History**: URL information for PDF redirection and word saving context

### Data Categories NOT Collected:
- Personally identifiable information
- Health information  
- Financial and payment information
- Authentication information
- Personal communications
- Location information

### Data Usage Confirmation:
- We do not sell or transfer user data to third parties except for approved use cases (dictionary API lookup)
- We do not use or transmit user data for purposes unrelated to the extension's dedicated purpose (vocabulary learning)
- We do not use or transmit user data for credit assessment or loans 