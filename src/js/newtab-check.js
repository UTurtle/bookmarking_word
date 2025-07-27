// Check if newtab override is enabled
chrome.storage.local.get('newtabOverride', function(result) {
    const newtabOverride = result.newtabOverride !== false; // Default to true
    if (!newtabOverride) {
        // Try to redirect to a different URL that might work
        try {
            // Try multiple URLs to find one that works
            const urls = [
                'chrome-search://local-ntp/local-ntp.html',
                'about:newtab',
                'chrome://newtab/',
                'chrome://newtab'
            ];
            
            // Try the first URL
            window.location.href = urls[0];
        } catch (error) {
            // If redirect fails, show the message
            document.body.innerHTML = `
                <div style="display: flex; justify-content: center; align-items: center; height: 100vh; font-family: Arial, sans-serif; color: #666; background: #f8f9fa;">
                    <div style="text-align: center; padding: 40px; background: white; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
                        <h2 style="color: #333; margin-bottom: 20px;">📚 Vocabulary Board Disabled</h2>
                        <p style="margin-bottom: 30px; line-height: 1.6;">
                            The vocabulary board is currently disabled for new tabs.<br>
                            You can enable it in the extension popup settings.
                        </p>
                        <button onclick="enableVocabularyBoard()" style="padding: 12px 24px; background: #007cba; color: white; border: none; border-radius: 6px; cursor: pointer; font-size: 14px; margin-right: 10px;">
                            Enable Now
                        </button>
                        <button onclick="window.location.reload()" style="padding: 12px 24px; background: #6c757d; color: white; border: none; border-radius: 6px; cursor: pointer; font-size: 14px;">
                            Refresh
                        </button>
                    </div>
                </div>
            `;
        }
    }
});

function enableVocabularyBoard() {
    chrome.storage.local.set({ newtabOverride: true }, function() {
        window.location.reload();
    });
} 