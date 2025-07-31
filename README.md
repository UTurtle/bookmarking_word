# 📚 Vocabulary Learning Note

![Vocabulary Learning Note Preview](preview_1.png)

A Chrome extension for vocabulary learning with interactive quizzes, progress tracking, and smart word management.

## 🌟 Features

### Core Features
- **Word Save to Note**: Save words while browsing with `Ctrl+Shift+S`
- **Automatic Definitions**: Fetch definitions from Dictionary API
- **Audio Pronunciation**: 🔊 Play pronunciation for saved words
- **Interactive Card**: Toggle hide/show card word and define
- **Quiz Progress Tracking**: Daily streaks and statistics
- **Pin/Unpin Words**: Mark important words for quick access
- **Archive System**: Archive words you've mastered
- **Related/Opposite Words**: Discover synonyms using Datamuse API
- **CSV Export/Import**: Export vocabulary to CSV and import from CSV files
- **PDF Integration**: Save words from PDF documents using PDF.js viewer
- **View Modes**: Board view and table view
- **New Tab Override**: Customizable new tab page with vocabulary board
- **Hide All Words/Definitions**: Global toggle modes for focused learning
- **Multiple Word Selection**: Select and save multiple words at once when Highlight mode is enabled
- **Today Voca System**: Daily vocabulary learning with SRS algorithm, interactive quizzes, and progress tracking

### Learning Features
- **Today Voca**: Daily vocabulary learning system with SRS (Spaced Repetition System)
- **SRS Algorithm**: SuperMemo SM-2 algorithm for optimal learning intervals
- **Today Voca Quiz**: Interactive quiz system for Today Voca words
- **Learning History**: Track daily learning progress and completion history
- **Smart Word Selection**: Intelligent word selection based on learning priority and review schedule

## 🚀 Installation

1. Clone or download this repository
2. Open Chrome and go to `chrome://extensions/`
3. Enable "Developer mode"
4. Click "Load unpacked" and select the extension folder

## 🎯 Usage

### Basic Usage
1. **Save Words**: Select any word and press `Ctrl+Shift+S`
2. **View Vocabulary**: Open a new tab to see your vocabulary board
3. **Play Pronunciation**: Click 🔊 button on any word card to hear pronunciation
4. **Search**: Use the search bar to find specific words

### Quiz System
1. Click "🎯 Start Quiz" button
2. Choose quiz type (Definition to Word or Word to Definition)
3. Answer 5 questions
4. View your score and progress

### Today Voca System
1. Click "📚 Today Voca" button on the main board
2. Learn 5 words daily with SRS algorithm
3. Complete word learning and take quiz
4. Track your learning history and progress

### Import/Export
- **Export**: Click "📤 Export" to download vocabulary as CSV
- **Import**: Click "📥 Import" to load vocabulary from CSV file

## 📄 PDF Support

This extension includes PDF.js integration for enhanced PDF reading:

- **Automatic PDF Redirection**: PDF files automatically open in PDF.js viewer
- **Text Selection**: Select and save words directly from PDF documents
- **Settings Control**: Toggle PDF auto-redirection in settings

**Note**: When you open a PDF file, it will automatically redirect to the PDF.js viewer for better text selection capabilities. You can disable this feature in the settings.

## ⌨️ Keyboard Shortcuts

- `Ctrl+Shift+S`: Save selected word
- `R`: Refresh vocabulary board
- `Ctrl+A`: Toggle animations
- `Ctrl+Q`: Start quiz

## 🔧 Configuration

- **Dark Mode**: Click 🌙/☀️ button to toggle
- **Animations**: Click 🎬 button to toggle
- **Settings**: Click ⚙️ button for advanced settings
- **PDF Auto-redirect**: Toggle in settings
- **All data stored locally**: No server required

## 🏗️ Technical Details

### Architecture
- **Frontend**: Vanilla JavaScript (ES6+)
- **Storage**: Chrome Storage API
- **APIs**: Dictionary API, Datamuse API, Web Speech API
- **PDF Viewer**: Mozilla PDF.js integration
- **SRS System**: SuperMemo SM-2 algorithm implementation
- **Build**: Node.js with archiver

## 🔒 Privacy & Security

- **Local Storage**: All data stored locally in Chrome
- **No Server Required**: No data transmitted to external servers
- **HTTPS Encryption**: All external API communications encrypted
- **Optional Permissions**: Advanced features require explicit user permission
- **Privacy Policy**: Full compliance with Chrome Web Store policies

### Permission Management

The extension uses a minimal permission approach:

#### Required Permissions
- **storage**: Store vocabulary data locally
- **activeTab**: Read selected text from current tab
- **scripting**: Execute content scripts for word selection

#### Optional Permissions
- **tabs**: Replace new tab page with vocabulary board
- **webNavigation**: Auto-redirect PDF files to PDF.js viewer
- **contextMenus**: Add PDF link right-click menu

Users can request optional permissions through the extension popup interface.

### Data Collection

This extension collects only the minimum data necessary for functionality:

#### Collected Data
- **Web History**: URL information for PDF redirection (optional)
- **User Activity**: Text selection and interaction data
- **Website Content**: Selected text for vocabulary saving

#### Not Collected
- Personally identifiable information
- Health information
- Financial and payment information
- Authentication information
- Personal communications
- Location information

### Limited Use Compliance

This extension complies with Chrome Web Store's Limited Use requirements:

- ✅ **Permitted Uses**: Vocabulary learning and related features only
- ✅ **No Advertising**: No personalized or targeted ads
- ✅ **No Data Sale**: User data is never sold to third parties
- ✅ **No Human Review**: No human access to user data
- ✅ **No Credit Assessment**: Data not used for credit or loan purposes

For complete privacy information, see [Privacy Policy](privacy-policy.md).

## 🔮 Future Work

### Smart Vocabulary Management
- **Automatic Word Categorization**: AI-powered classification of words into different categories (academic, casual, technical, etc.)
- **Dynamic Word Sets**: Create multiple vocabulary books for different purposes
- **Adaptive Learning**: Adjust difficulty based on user performance

### Enhanced Learning Features
- **Context Examples**: Save words with their original context
- **Pronunciation Practice**: Learn accurate pronunciation and intonation

### Zotero Addon for Paper

## 📝 License

Apache-2.0 License - see LICENSE file for details.

## 🙏 Acknowledgments

- Dictionary API for word definitions and phonetic data
- Datamuse API for word relationships and synonyms
- Web Speech API for text-to-speech functionality
- Mozilla PDF.js for PDF viewing

**Note**: This extension uses the Datamuse API for finding related words and synonyms. The Datamuse API is freely available and does not require an API key.

---

*<small>This project is a simple side project created using Cursor.</small>*
