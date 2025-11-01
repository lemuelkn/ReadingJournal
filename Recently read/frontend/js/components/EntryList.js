/**
 * Entry List Component
 * Displays and manages the list of journal entries
 */
 class EntryList {
    constructor(options) {
        this.container = options.container;
        this.dataService = options.dataService;
        this.currentEntries = [];
        
        this.init();
    }

    /**
     * Initialize the component
     */
    init() {
        this.render();
        this.refresh();
    }

    /**
     * Refresh the entry list with latest data
     */
    refresh() {
        const entries = this.dataService.getAllEntries();
        this.displayEntries(entries);
    }

    /**
     * Display entries in the list
     * @param {Array<Entry>} entries - Entries to display
     */
    displayEntries(entries) {
        this.currentEntries = entries;
        
        if (entries.length === 0) {
            this.renderEmptyState();
            return;
        }

        this.renderEntries(entries);
    }

    /**
     * Render the container structure
     */
    render() {
        // Container is already in DOM, we just manage its content
    }

    /**
     * Render entries list
     * @param {Array<Entry>} entries - Entries to render
     */
    renderEntries(entries) {
        const entriesHTML = entries.map(entry => this.renderEntry(entry)).join('');
        this.container.innerHTML = entriesHTML;
    }

    /**
     * Render a single entry
     * @param {Entry} entry - Entry to render
     * @returns {string} - HTML string for the entry
     */
    renderEntry(entry) {
        const displayTitle = entry.getDisplayTitle();
        const formattedDate = entry.dateFormatted;
        const reflection = this.truncateText(entry.reflection, 300);
        const wordCount = this.getWordCount(entry.reflection);
        
        return `
            <div class="entry-card" data-entry-id="${entry.id}">
                <div class="entry-header">
                    <div class="entry-source">${this.escapeHtml(displayTitle)}</div>
                    <div class="entry-meta">
                        <span class="entry-date">${formattedDate}</span>
                        <span class="entry-word-count">${wordCount} words</span>
                    </div>
                </div>
                <div class="entry-content">
                    <p>${this.escapeHtml(reflection)}</p>
                    ${entry.reflection.length > 300 ? `
                        <button class="expand-btn" onclick="window.entryList.toggleExpand(${entry.id})">
                            Read more...
                        </button>
                    ` : ''}
                </div>
                <div class="entry-actions">
                    <button class="action-btn edit-btn" onclick="window.entryList.editEntry(${entry.id})" title="Edit entry">
                        ✏️
                    </button>
                    <button class="action-btn delete-btn" onclick="window.entryList.deleteEntry(${entry.id})" title="Delete entry">
                        🗑️
                    </button>
                    <button class="action-btn share-btn" onclick="window.entryList.shareEntry(${entry.id})" title="Copy to clipboard">
                        📋
                    </button>
                </div>
            </div>
        `;
    }

    /**
     * Render empty state
     */
    renderEmptyState() {
        const isSearchActive = this.isSearchActive();
        
        this.container.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">📚</div>
                <h3>${isSearchActive ? 'No matching entries found' : 'No entries yet'}</h3>
                <p>${isSearchActive ? 
                    'Try adjusting your search terms or browse all entries.' : 
                    'Start by adding your first reading reflection!'
                }</p>
                ${!isSearchActive ? `
                    <button class="btn" onclick="window.readingJournalApp.showTab('add')">
                        Add Your First Entry
                    </button>
                ` : `
                    <button class="btn btn-secondary" onclick="window.entryList.clearSearch()">
                        Show All Entries
                    </button>
                `}
            </div>
        `;
    }

    /**
     * Toggle expanded view of an entry
     * @param {number} entryId - Entry ID
     */
    toggleExpand(entryId) {
        const entry = this.dataService.getEntryById(entryId);
        if (!entry) return;

        const entryCard = document.querySelector(`[data-entry-id="${entryId}"]`);
        if (!entryCard) return;

        const contentDiv = entryCard.querySelector('.entry-content p');
        const expandBtn = entryCard.querySelector('.expand-btn');
        
        if (entryCard.classList.contains('expanded')) {
            // Collapse
            contentDiv.textContent = this.truncateText(entry.reflection, 300);
            expandBtn.textContent = 'Read more...';
            entryCard.classList.remove('expanded');
        } else {
            // Expand
            contentDiv.textContent = entry.reflection;
            expandBtn.textContent = 'Read less';
            entryCard.classList.add('expanded');
        }
    }

    /**
     * Edit an entry
     * @param {number} entryId - Entry ID
     */
    editEntry(entryId) {
        const entry = this.dataService.getEntryById(entryId);
        if (!entry) {
            alert('Entry not found');
            return;
        }

        // For MVP, we'll show a simple edit dialog
        // In a more advanced version, this could navigate to an edit form
        const newReflection = prompt('Edit your reflection:', entry.reflection);
        
        if (newReflection !== null && newReflection.trim() !== entry.reflection) {
            const result = this.dataService.updateEntry(entryId, {
                reflection: newReflection.trim()
            });
            
            if (result.success) {
                this.refresh();
                alert('Entry updated successfully!');
            } else {
                alert('Error updating entry: ' + result.error);
            }
        }
    }

    /**
     * Delete an entry
     * @param {number} entryId - Entry ID
     */
    deleteEntry(entryId) {
        const entry = this.dataService.getEntryById(entryId);
        if (!entry) {
            alert('Entry not found');
            return;
        }

        const confirmMessage = `Are you sure you want to delete this entry?\n\n"${this.truncateText(entry.sourceName, 50)}"`;
        
        if (confirm(confirmMessage)) {
            const result = this.dataService.deleteEntry(entryId);
            
            if (result.success) {
                this.refresh();
                alert('Entry deleted successfully');
            } else {
                alert('Error deleting entry: ' + result.error);
            }
        }
    }

    /**
     * Share/copy entry to clipboard
     * @param {number} entryId - Entry ID
     */
    shareEntry(entryId) {
        const entry = this.dataService.getEntryById(entryId);
        if (!entry) {
            alert('Entry not found');
            return;
        }

        const shareText = this.formatEntryForSharing(entry);
        
        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(shareText).then(() => {
                alert('Entry copied to clipboard!');
            }).catch(err => {
                console.error('Error copying to clipboard:', err);
                this.fallbackCopyToClipboard(shareText);
            });
        } else {
            this.fallbackCopyToClipboard(shareText);
        }
    }

    /**
     * Format entry for sharing
     * @param {Entry} entry - Entry to format
     * @returns {string} - Formatted text
     */
    formatEntryForSharing(entry) {
        return `📚 Reading Journal Entry

${entry.getDisplayTitle()}
Date: ${entry.dateFormatted}

${entry.reflection}

---
Created with Reading Journal`;
    }

    /**
     * Fallback copy to clipboard method
     * @param {string} text - Text to copy
     */
    fallbackCopyToClipboard(text) {
        const textarea = document.createElement('textarea');
        textarea.value = text;
        document.body.appendChild(textarea);
        textarea.select();
        
        try {
            document.execCommand('copy');
            alert('Entry copied to clipboard!');
        } catch (err) {
            console.error('Fallback copy failed:', err);
            alert('Unable to copy to clipboard. Please copy manually.');
        }
        
        document.body.removeChild(textarea);
    }

    /**
     * Clear active search
     */
    clearSearch() {
        // This would interact with the search component
        const searchBox = document.getElementById('searchBox');
        if (searchBox) {
            searchBox.value = '';
            searchBox.dispatchEvent(new Event('keyup'));
        }
    }

    /**
     * Check if search is currently active
     * @returns {boolean} - Whether search is active
     */
    isSearchActive() {
        const searchBox = document.getElementById('searchBox');
        return searchBox && searchBox.value.trim() !== '';
    }

    /**
     * Truncate text to specified length
     * @param {string} text - Text to truncate
     * @param {number} maxLength - Maximum length
     * @returns {string} - Truncated text
     */
    truncateText(text, maxLength) {
        if (text.length <= maxLength) return text;
        
        // Try to break at word boundary
        const truncated = text.substring(0, maxLength);
        const lastSpace = truncated.lastIndexOf(' ');
        
        if (lastSpace > maxLength * 0.8) {
            return truncated.substring(0, lastSpace) + '...';
        }
        
        return truncated + '...';
    }

    /**
     * Get word count for text
     * @param {string} text - Text to count
     * @returns {number} - Word count
     */
    getWordCount(text) {
        return text.trim().split(/\s+/).filter(word => word.length > 0).length;
    }

    /**
     * Escape HTML to prevent XSS
     * @param {string} text - Text to escape
     * @returns {string} - Escaped text
     */
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    /**
     * Sort entries by different criteria
     * @param {Array<Entry>} entries - Entries to sort
     * @param {string} sortBy - Sort criteria (date, title, author)
     * @param {string} direction - Sort direction (asc, desc)
     * @returns {Array<Entry>} - Sorted entries
     */
    sortEntries(entries, sortBy = 'date', direction = 'desc') {
        return [...entries].sort((a, b) => {
            let comparison = 0;
            
            switch (sortBy) {
                case 'date':
                    comparison = new Date(a.timestamp) - new Date(b.timestamp);
                    break;
                case 'title':
                    comparison = a.sourceName.localeCompare(b.sourceName);
                    break;
                case 'author':
                    comparison = a.author.localeCompare(b.author);
                    break;
                case 'type':
                    comparison = a.sourceType.localeCompare(b.sourceType);
                    break;
                default:
                    comparison = new Date(a.timestamp) - new Date(b.timestamp);
            }
            
            return direction === 'desc' ? -comparison : comparison;
        });
    }

    /**
     * Filter entries by source type
     * @param {Array<Entry>} entries - Entries to filter
     * @param {string} sourceType - Source type to filter by
     * @returns {Array<Entry>} - Filtered entries
     */
    filterByType(entries, sourceType) {
        if (!sourceType || sourceType === 'all') {
            return entries;
        }
        
        return entries.filter(entry => entry.sourceType === sourceType);
    }

    /**
     * Get unique source types from current entries
     * @returns {Array<string>} - Array of unique source types
     */
    getUniqueSourceTypes() {
        const types = new Set(this.currentEntries.map(entry => entry.sourceType));
        return Array.from(types).sort();
    }

    /**
     * Destroy component and clean up
     */
    destroy() {
        this.container.innerHTML = '';
    }
}

// Make EntryList globally available for onclick handlers
window.entryList = null;
document.addEventListener('DOMContentLoaded', () => {
    // This will be set by the main app
});