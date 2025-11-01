/**
 * Lightweight Markdown Parser
 * Converts markdown syntax to HTML for display
 */

 class MarkdownParser {
    /**
     * Parse markdown text to HTML
     * @param {string} text - Markdown text
     * @returns {string} - HTML string
     */
    static parse(text) {
        if (!text) return '';
        
        let html = text;
        
        // Escape HTML first to prevent XSS
        html = this.escapeHtml(html);
        
        // Auto-detect and convert URLs to links
        html = this.autoLinkUrls(html);
        
        // Bold: **text** or __text__
        html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
        html = html.replace(/__(.+?)__/g, '<strong>$1</strong>');
        
        // Italic: *text* or _text_
        html = html.replace(/\*(.+?)\*/g, '<em>$1</em>');
        html = html.replace(/_(.+?)_/g, '<em>$1</em>');
        
        // Strikethrough: ~~text~~
        html = html.replace(/~~(.+?)~~/g, '<del>$1</del>');
        
        // Code inline: `code`
        html = html.replace(/`(.+?)`/g, '<code>$1</code>');
        
        // Convert line breaks to proper paragraphs
        html = this.convertParagraphs(html);
        
        // Lists (unordered)
        html = this.convertLists(html);
        
        return html;
    }

    /**
     * Escape HTML to prevent XSS
     * @param {string} text - Text to escape
     * @returns {string} - Escaped text
     */
    static escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    /**
     * Auto-detect URLs and convert to clickable links
     * @param {string} text - Text with potential URLs
     * @returns {string} - Text with HTML links
     */
    static autoLinkUrls(text) {
        // Match URLs (http, https, www)
        const urlRegex = /(https?:\/\/[^\s]+)|(www\.[^\s]+)/g;
        
        return text.replace(urlRegex, (url) => {
            const href = url.startsWith('www.') ? `https://${url}` : url;
            return `<a href="${href}" target="_blank" rel="noopener noreferrer" class="auto-link">${url}</a>`;
        });
    }

    /**
     * Convert newlines to paragraphs
     * @param {string} text - Text with newlines
     * @returns {string} - Text with paragraph tags
     */
    static convertParagraphs(text) {
        // Split by double newlines for paragraphs
        const paragraphs = text.split(/\n\s*\n/);
        
        return paragraphs
            .map(p => {
                // Don't wrap if it's a list item
                if (p.trim().startsWith('-') || p.trim().startsWith('*') || p.trim().startsWith('•')) {
                    return p.replace(/\n/g, '<br>');
                }
                return p.trim() ? `<p>${p.replace(/\n/g, '<br>')}</p>` : '';
            })
            .join('');
    }

    /**
     * Convert markdown lists to HTML
     * @param {string} text - Text with list syntax
     * @returns {string} - Text with HTML lists
     */
    static convertLists(text) {
        // Unordered lists: lines starting with -, *, or •
        const listRegex = /((?:^|\n)[-*•]\s+.+(?:\n[-*•]\s+.+)*)/gm;
        
        return text.replace(listRegex, (match) => {
            const items = match
                .split('\n')
                .filter(line => line.trim())
                .map(line => {
                    const cleaned = line.replace(/^[-*•]\s+/, '').trim();
                    return `<li>${cleaned}</li>`;
                })
                .join('');
            
            return `<ul>${items}</ul>`;
        });
    }

    /**
     * Strip all markdown formatting (for plain text display)
     * @param {string} text - Markdown text
     * @returns {string} - Plain text
     */
    static stripMarkdown(text) {
        if (!text) return '';
        
        return text
            .replace(/\*\*(.+?)\*\*/g, '$1')  // Bold
            .replace(/__(.+?)__/g, '$1')
            .replace(/\*(.+?)\*/g, '$1')      // Italic
            .replace(/_(.+?)_/g, '$1')
            .replace(/~~(.+?)~~/g, '$1')      // Strikethrough
            .replace(/`(.+?)`/g, '$1')        // Code
            .replace(/^[-*•]\s+/gm, '')       // List markers
            .trim();
    }
}

/**
 * Markdown Editor Toolbar
 * Adds formatting buttons to textareas
 */
class MarkdownToolbar {
    constructor(textareaId) {
        this.textarea = document.getElementById(textareaId);
        this.init();
    }

    init() {
        if (!this.textarea) return;
        
        // Create toolbar
        const toolbar = document.createElement('div');
        toolbar.className = 'markdown-toolbar';
        toolbar.innerHTML = `
            <button type="button" class="md-btn" data-action="bold" title="Bold (Ctrl/Cmd+B)">
                <strong>B</strong>
            </button>
            <button type="button" class="md-btn" data-action="italic" title="Italic (Ctrl/Cmd+I)">
                <em>I</em>
            </button>
            <button type="button" class="md-btn" data-action="strikethrough" title="Strikethrough">
                <del>S</del>
            </button>
            <span class="md-divider"></span>
            <button type="button" class="md-btn" data-action="list" title="Bullet List">
                • List
            </button>
            <button type="button" class="md-btn" data-action="link" title="Insert Link">
                🔗 Link
            </button>
            <span class="md-divider"></span>
            <button type="button" class="md-btn" data-action="preview" title="Preview">
                👁️ Preview
            </button>
        `;
        
        // Insert toolbar before textarea
        this.textarea.parentNode.insertBefore(toolbar, this.textarea);
        
        // Add event listeners
        toolbar.addEventListener('click', (e) => {
            const btn = e.target.closest('.md-btn');
            if (btn) {
                const action = btn.dataset.action;
                this.executeAction(action);
            }
        });
        
        // Keyboard shortcuts
        this.textarea.addEventListener('keydown', (e) => {
            if (e.ctrlKey || e.metaKey) {
                if (e.key === 'b') {
                    e.preventDefault();
                    this.executeAction('bold');
                } else if (e.key === 'i') {
                    e.preventDefault();
                    this.executeAction('italic');
                }
            }
        });
    }

    executeAction(action) {
        const start = this.textarea.selectionStart;
        const end = this.textarea.selectionEnd;
        const selectedText = this.textarea.value.substring(start, end);
        const beforeText = this.textarea.value.substring(0, start);
        const afterText = this.textarea.value.substring(end);
        
        let newText, cursorPos;
        
        switch (action) {
            case 'bold':
                newText = `**${selectedText || 'bold text'}**`;
                cursorPos = start + (selectedText ? newText.length : 2);
                break;
                
            case 'italic':
                newText = `*${selectedText || 'italic text'}*`;
                cursorPos = start + (selectedText ? newText.length : 1);
                break;
                
            case 'strikethrough':
                newText = `~~${selectedText || 'strikethrough text'}~~`;
                cursorPos = start + (selectedText ? newText.length : 2);
                break;
                
            case 'list':
                if (selectedText) {
                    // Convert each line to a list item
                    const lines = selectedText.split('\n');
                    newText = lines.map(line => `- ${line}`).join('\n');
                } else {
                    newText = '- List item';
                }
                cursorPos = start + newText.length;
                break;
                
            case 'link':
                const url = prompt('Enter URL:', 'https://');
                if (url) {
                    newText = selectedText ? `[${selectedText}](${url})` : url;
                    cursorPos = start + newText.length;
                } else {
                    return; // Cancelled
                }
                break;
                
            case 'preview':
                this.showPreview();
                return;
                
            default:
                return;
        }
        
        // Update textarea
        this.textarea.value = beforeText + newText + afterText;
        
        // Restore focus and cursor position
        this.textarea.focus();
        this.textarea.setSelectionRange(cursorPos, cursorPos);
        
        // Trigger input event for character counter
        this.textarea.dispatchEvent(new Event('input'));
    }

    showPreview() {
        const text = this.textarea.value;
        const html = MarkdownParser.parse(text);
        
        // Create preview modal
        const modal = document.createElement('div');
        modal.className = 'markdown-preview-modal';
        modal.innerHTML = `
            <div class="markdown-preview-content">
                <div class="markdown-preview-header">
                    <h3>Preview</h3>
                    <button class="close-preview">✕</button>
                </div>
                <div class="markdown-preview-body">
                    ${html}
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Close preview
        modal.querySelector('.close-preview').addEventListener('click', () => {
            modal.remove();
        });
        
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.remove();
            }
        });
    }
}