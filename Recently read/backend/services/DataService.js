/**
 * Data Service
 * Handles all data operations for reading journal entries
 */
 class DataService {
    constructor() {
        this.storageService = new StorageService();
        this.entries = [];
        this.observers = [];
        this.loadEntries();
    }

    /**
     * Load entries from storage
     */
    loadEntries() {
        const storedEntries = this.storageService.getEntries();
        this.entries = storedEntries.map(data => new Entry(data));
        this.notifyObservers('entries_loaded');
    }

    /**
     * Get all entries with optional sorting
     * @param {string} sortBy - Sort by 'created' or 'edited'
     * @returns {Array<Entry>} - Array of entries
     */
    getAllEntries(sortBy = 'created') {
        const entries = [...this.entries]; // Return copy to prevent direct mutation
        
        return entries.sort((a, b) => {
            const dateA = new Date(a.getSortDate(sortBy));
            const dateB = new Date(b.getSortDate(sortBy));
            return dateB - dateA; // Descending order (newest first)
        });
    }

    /**
     * Add a new entry
     * @param {Object} entryData - Entry data object
     * @returns {Object} - Result with success status and entry/error
     */
    addEntry(entryData) {
        try {
            const entry = Entry.create(entryData);
            const validation = entry.validate();

            if (!validation.isValid) {
                return {
                    success: false,
                    error: validation.errors.join(', ')
                };
            }

            this.entries.unshift(entry); // Add to beginning
            this.saveEntries();
            this.notifyObservers('entry_added', entry);

            return {
                success: true,
                entry
            };
        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Get entry by ID
     * @param {number} id - Entry ID
     * @returns {Entry|null} - Entry or null if not found
     */
    getEntryById(id) {
        return this.entries.find(entry => entry.id === id) || null;
    }

    /**
     * Update an existing entry
     * @param {number} id - Entry ID
     * @param {Object} updates - Updates to apply
     * @returns {Object} - Result with success status
     */
    updateEntry(id, updates) {
        const entry = this.entries.find(entry => entry.id === id);
        
        if (!entry) {
            return {
                success: false,
                error: 'Entry not found'
            };
        }

        try {
            entry.update(updates);
            const validation = entry.validate();

            if (!validation.isValid) {
                return {
                    success: false,
                    error: validation.errors.join(', ')
                };
            }

            this.saveEntries();
            this.notifyObservers('entry_updated', entry);

            return {
                success: true,
                entry: entry
            };
        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Delete an entry
     * @param {number} id - Entry ID
     * @returns {Object} - Result with success status
     */
    deleteEntry(id) {
        const entryIndex = this.entries.findIndex(entry => entry.id === id);
        
        if (entryIndex === -1) {
            return {
                success: false,
                error: 'Entry not found'
            };
        }

        const deletedEntry = this.entries.splice(entryIndex, 1)[0];
        this.saveEntries();
        this.notifyObservers('entry_deleted', deletedEntry);

        return {
            success: true,
            entry: deletedEntry
        };
    }

    /**
     * Search entries
     * @param {string} searchTerm - Search term
     * @returns {Array<Entry>} - Filtered entries
     */
    searchEntries(searchTerm) {
        if (!searchTerm || searchTerm.trim() === '') {
            return this.getAllEntries();
        }

        return this.entries.filter(entry => 
            entry.matchesSearch(searchTerm.trim())
        );
    }

    /**
     * Get statistics about entries
     * @returns {Object} - Statistics object
     */
    getStatistics() {
        const totalEntries = this.entries.length;
        const uniqueSources = new Set(
            this.entries.map(e => e.sourceName.toLowerCase())
        ).size;

        // Count entries from this week
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        const thisWeek = this.entries.filter(entry => 
            new Date(entry.timestamp) >= weekAgo
        ).length;

        return {
            totalEntries,
            uniqueSources,
            thisWeek
        };
    }

    /**
     * Save entries to storage
     */
    saveEntries() {
        const entriesData = this.entries.map(entry => entry.toObject());
        this.storageService.saveEntries(entriesData);
    }

    /**
     * Subscribe to data changes
     * @param {Function} callback - Callback function
     */
    subscribe(callback) {
        this.observers.push(callback);
    }

    /**
     * Unsubscribe from data changes
     * @param {Function} callback - Callback function to remove
     */
    unsubscribe(callback) {
        this.observers = this.observers.filter(obs => obs !== callback);
    }

    /**
     * Notify all observers of data changes
     * @param {string} event - Event type
     * @param {*} data - Event data
     */
    notifyObservers(event, data = null) {
        this.observers.forEach(callback => {
            try {
                callback(event, data);
            } catch (error) {
                console.error('Error in observer callback:', error);
            }
        });
    }

    /**
     * Clear all entries (for testing or reset)
     * @returns {boolean} - Success status
     */
    clearAllEntries() {
        this.entries = [];
        this.saveEntries();
        this.notifyObservers('entries_cleared');
        return true;
    }
}