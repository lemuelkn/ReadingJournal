/**
 * Entry Model
 * Defines the structure and behavior of reading journal entries
 */
 class Entry {
    constructor(data) {
        this.id = data.id || Date.now();
        this.sourceType = data.sourceType;
        this.sourceName = data.sourceName;
        this.author = data.author || '';
        this.reflection = data.reflection;
        this.timestamp = data.timestamp || new Date().toISOString();
        this.lastEdited = data.lastEdited || null;
        this.dateFormatted = data.dateFormatted || this.formatDate();
        this.editCount = data.editCount || 0;
        
        // Extended content fields (Notion-like)
        this.additionalNotes = data.additionalNotes || '';
        this.keyTakeaways = data.keyTakeaways || [];
        this.relatedLinks = data.relatedLinks || [];
        this.tags = data.tags || [];
        this.rating = data.rating || null;
        this.progress = data.progress || '';
    }

    /**
     * Create a new entry from form data
     * @param {Object} formData - Form data object
     * @returns {Entry} - New entry instance
     */
    static create(formData) {
        return new Entry({
            sourceType: formData.sourceType,
            sourceName: formData.sourceName,
            author: formData.author,
            reflection: formData.reflection
        });
    }

    /**
     * Update entry with new data
     * @param {Object} updates - Updates to apply
     */
    update(updates) {
        Object.keys(updates).forEach(key => {
            if (this.hasOwnProperty(key) && key !== 'id' && key !== 'timestamp') {
                this[key] = updates[key];
            }
        });
        this.lastEdited = new Date().toISOString();
        this.editCount += 1;
        this.dateFormatted = this.formatDate();
    }

    /**
     * Add a key takeaway
     * @param {string} takeaway - Takeaway text
     */
    addTakeaway(takeaway) {
        if (takeaway && takeaway.trim()) {
            this.keyTakeaways.push({
                id: Date.now(),
                text: takeaway.trim(),
                createdAt: new Date().toISOString()
            });
            this.lastEdited = new Date().toISOString();
        }
    }

    /**
     * Remove a key takeaway
     * @param {number} takeawayId - ID of takeaway to remove
     */
    removeTakeaway(takeawayId) {
        this.keyTakeaways = this.keyTakeaways.filter(t => t.id !== takeawayId);
        this.lastEdited = new Date().toISOString();
    }

    /**
     * Add a related link
     * @param {string} url - URL to add
     * @param {string} title - Optional title
     */
    addRelatedLink(url, title = '') {
        if (url && url.trim()) {
            this.relatedLinks.push({
                id: Date.now(),
                url: url.trim(),
                title: title.trim() || url.trim(),
                createdAt: new Date().toISOString()
            });
            this.lastEdited = new Date().toISOString();
        }
    }

    /**
     * Remove a related link
     * @param {number} linkId - ID of link to remove
     */
    removeRelatedLink(linkId) {
        this.relatedLinks = this.relatedLinks.filter(l => l.id !== linkId);
        this.lastEdited = new Date().toISOString();
    }

    /**
     * Add a tag
     * @param {string} tag - Tag to add
     */
    addTag(tag) {
        if (tag && tag.trim() && !this.tags.includes(tag.trim().toLowerCase())) {
            this.tags.push(tag.trim().toLowerCase());
            this.lastEdited = new Date().toISOString();
        }
    }

    /**
     * Remove a tag
     * @param {string} tag - Tag to remove
     */
    removeTag(tag) {
        this.tags = this.tags.filter(t => t !== tag);
        this.lastEdited = new Date().toISOString();
    }

    /**
     * Set rating
     * @param {number} rating - Rating 1-5
     */
    setRating(rating) {
        if (rating >= 1 && rating <= 5) {
            this.rating = rating;
            this.lastEdited = new Date().toISOString();
        }
    }

    /**
     * Format the entry date for display
     * @returns {string} - Formatted date string
     */
    formatDate() {
        return new Date(this.timestamp).toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    }

    /**
     * Get the sort date based on user preference
     * @param {string} sortBy - 'created' or 'edited'
     * @returns {string} - ISO date string
     */
    getSortDate(sortBy = 'created') {
        if (sortBy === 'edited' && this.lastEdited) {
            return this.lastEdited;
        }
        return this.timestamp;
    }

    /**
     * Get formatted edit date
     * @returns {string} - Formatted edit date or null
     */
    getEditedDate() {
        if (!this.lastEdited) return null;
        return new Date(this.lastEdited).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });
    }

    /**
     * Convert entry to plain object for storage
     * @returns {Object} - Plain object representation
     */
    toObject() {
        return {
            id: this.id,
            sourceType: this.sourceType,
            sourceName: this.sourceName,
            author: this.author,
            reflection: this.reflection,
            timestamp: this.timestamp,
            lastEdited: this.lastEdited,
            dateFormatted: this.dateFormatted,
            editCount: this.editCount,
            additionalNotes: this.additionalNotes,
            keyTakeaways: this.keyTakeaways,
            relatedLinks: this.relatedLinks,
            tags: this.tags,
            rating: this.rating,
            progress: this.progress
        };
    }

    /**
     * Get display title for the entry
     * @returns {string} - Display title
     */
    getDisplayTitle() {
        return `${this.sourceType}: ${this.sourceName}${this.author ? ` by ${this.author}` : ''}`;
    }

    /**
     * Check if entry matches search term
     * @param {string} searchTerm - Search term to match
     * @returns {boolean} - Whether entry matches
     */
    matchesSearch(searchTerm) {
        const term = searchTerm.toLowerCase();
        return (
            this.sourceName.toLowerCase().includes(term) ||
            this.author.toLowerCase().includes(term) ||
            this.reflection.toLowerCase().includes(term) ||
            this.sourceType.toLowerCase().includes(term) ||
            this.additionalNotes.toLowerCase().includes(term) ||
            this.tags.some(tag => tag.includes(term)) ||
            this.keyTakeaways.some(t => t.text.toLowerCase().includes(term))
        );
    }

    /**
     * Validate entry data
     * @returns {Object} - Validation result with isValid and errors
     */
    validate() {
        const errors = [];

        if (!this.sourceType || this.sourceType.trim() === '') {
            errors.push('Source type is required');
        }

        if (!this.sourceName || this.sourceName.trim() === '') {
            errors.push('Source name is required');
        }

        if (!this.reflection || this.reflection.trim() === '') {
            errors.push('Reflection is required');
        }

        return {
            isValid: errors.length === 0,
            errors
        };
    }
}