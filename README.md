# 📚 Vocabulary Bookmarker

![Vocabulary Bookmarker Preview](preview_1.png)

A Chrome extension for vocabulary learning with interactive quizzes, progress tracking, and smart word management.

## 🌟 Features

### Core Features
- **Word Bookmarking**: Save words while browsing with `Ctrl+Shift+S`
- **Automatic Definitions**: Fetch definitions from Dictionary API
- **Interactive Quizzes**: 5-question quizzes with 4 multiple choice options
- **Quiz Progress Tracking**: Daily streaks and statistics
- **Pin/Unpin Words**: Mark important words for quick access
- **Archive System**: Archive words you've mastered
- **Add Examples**: Add example sentences to words
- **Related/Opposite Words**: Discover synonyms using Datamuse API
- **CSV Export/Import**: Export vocabulary to CSV and import from CSV files
- **PDF Integration**: Save words from PDF documents using PDF.js viewer
- **View Modes**: Board view and table view

## 🚀 Installation

1. Clone or download this repository
2. Open Chrome and go to `chrome://extensions/`
3. Enable "Developer mode"
4. Click "Load unpacked" and select the extension folder

## 🎯 Usage

### Basic Usage
1. **Save Words**: Select any word and press `Ctrl+Shift+S`
2. **View Vocabulary**: Open a new tab to see your vocabulary board
4. **Search**: Use the search bar to find specific words

### Quiz System
1. Click "🎯 Start Quiz" button
2. Choose quiz type (Definition to Word or Word to Definition)
3. Answer 5 questions
4. View your score and progress

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
- **APIs**: Dictionary API, Datamuse API
- **PDF Viewer**: Mozilla PDF.js integration
- **Build**: Node.js with archiver

## 🔒 Privacy & Security

- **Local Storage**: All data stored locally in Chrome

## 📝 License

MIT License - see LICENSE file for details.

## 🙏 Acknowledgments

- Dictionary API for word definitions
- Datamuse API for word relationships and synonyms
- Mozilla PDF.js for PDF viewing

**Note**: This extension uses the Datamuse API for finding related words and synonyms. The Datamuse API is freely available and does not require an API key.

---

*<small>This project is a simple side project created using Cursor.</small>*
