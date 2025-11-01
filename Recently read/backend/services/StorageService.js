/**
 * Storage Service
 * Handles localStorage operations for the reading journal
 */
 class StorageService {
    constructor() {
        this.STORAGE_KEY = 'readingJournalEntries';
        this.BACKUP_KEY = 'readingJournalBackup';
        this.SETTINGS_KEY = 'readingJournalSettings';
    }

    /**
     * Check if localStorage is available
     * @returns {boolean} - Whether localStorage is supported
     */
    isStorageAvailable() {
        try {
            const testKey = '__storage_test__';
            localStorage.setItem(testKey, 'test');
            localStorage.removeItem(testKey);
            return true;
        } catch (error) {
            console.warn('localStorage not available:', error.message);
            return false;
        }
    }

    /**
     * Get all entries from storage
     * @returns {Array} - Array of entry objects
     */
    getEntries() {
        if (!this.isStorageAvailable()) {
            return [];
        }

        try {
            const data = localStorage.getItem(this.STORAGE_KEY);
            return data ? JSON.parse(data) : [];
        } catch (error) {
            console.error('Error loading entries from storage:', error);
            return this.restoreFromBackup();
        }
    }

    /**
     * Save entries to storage
     * @param {Array} entries - Array of entry objects
     * @returns {boolean} - Success status
     */
    saveEntries(entries) {
        if (!this.isStorageAvailable()) {
            console.warn('Storage not available, cannot save entries');
            return false;
        }

        try {
            // Create backup before saving
            this.createBackup();
            
            const dataString = JSON.stringify(entries);
            localStorage.setItem(this.STORAGE_KEY, dataString);
            
            // Update last saved timestamp
            this.updateLastSaved();
            
            return true;
        } catch (error) {
            console.error('Error saving entries to storage:', error);
            return false;
        }
    }

    /**
     * Create a backup of current data
     * @returns {boolean} - Success status
     */
    createBackup() {
        if (!this.isStorageAvailable()) {
            return false;
        }

        try {
            const currentData = localStorage.getItem(this.STORAGE_KEY);
            if (currentData) {
                const backup = {
                    data: currentData,
                    timestamp: new Date().toISOString()
                };
                localStorage.setItem(this.BACKUP_KEY, JSON.stringify(backup));
            }
            return true;
        } catch (error) {
            console.error('Error creating backup:', error);
            return false;
        }
    }

    /**
     * Restore data from backup
     * @returns {Array} - Restored entries or empty array
     */
    restoreFromBackup() {
        if (!this.isStorageAvailable()) {
            return [];
        }

        try {
            const backupString = localStorage.getItem(this.BACKUP_KEY);
            if (backupString) {
                const backup = JSON.parse(backupString);
                const entries = JSON.parse(backup.data);
                console.log('Restored from backup created:', backup.timestamp);
                return entries;
            }
        } catch (error) {
            console.error('Error restoring from backup:', error);
        }

        return [];
    }

    /**
     * Clear all stored data
     * @returns {boolean} - Success status
     */
    clearAllData() {
        if (!this.isStorageAvailable()) {
            return false;
        }

        try {
            localStorage.removeItem(this.STORAGE_KEY);
            localStorage.removeItem(this.BACKUP_KEY);
            return true;
        } catch (error) {
            console.error('Error clearing storage:', error);
            return false;
        }
    }

    /**
     * Get storage usage statistics
     * @returns {Object} - Storage usage info
     */
    getStorageInfo() {
        if (!this.isStorageAvailable()) {
            return {
                available: false,
                size: 0,
                quota: 0
            };
        }

        try {
            const data = localStorage.getItem(this.STORAGE_KEY) || '[]';
            const sizeInBytes = new Blob([data]).size;
            const sizeInKB = Math.round(sizeInBytes / 1024);

            return {
                available: true,
                size: sizeInKB,
                quota: this.getStorageQuota(),
                lastSaved: this.getLastSaved()
            };
        } catch (error) {
            console.error('Error getting storage info:', error);
            return {
                available: true,
                size: 0,
                quota: 0,
                error: error.message
            };
        }
    }

    /**
     * Get estimated storage quota (localStorage limit varies by browser)
     * @returns {number} - Estimated quota in KB
     */
    getStorageQuota() {
        // Most browsers have 5-10MB limit for localStorage
        return 5120; // 5MB in KB
    }

    /**
     * Update last saved timestamp
     */
    updateLastSaved() {
        if (this.isStorageAvailable()) {
            try {
                const settings = this.getSettings();
                settings.lastSaved = new Date().toISOString();
                localStorage.setItem(this.SETTINGS_KEY, JSON.stringify(settings));
            } catch (error) {
                console.error('Error updating last saved timestamp:', error);
            }
        }
    }

    /**
     * Get last saved timestamp
     * @returns {string|null} - ISO timestamp or null
     */
    getLastSaved() {
        try {
            const settings = this.getSettings();
            return settings.lastSaved || null;
        } catch (error) {
            return null;
        }
    }

    /**
     * Get app settings
     * @returns {Object} - Settings object
     */
    getSettings() {
        if (!this.isStorageAvailable()) {
            return {};
        }

        try {
            const settings = localStorage.getItem(this.SETTINGS_KEY);
            return settings ? JSON.parse(settings) : {};
        } catch (error) {
            console.error('Error loading settings:', error);
            return {};
        }
    }

    /**
     * Save app settings
     * @param {Object} settings - Settings to save
     * @returns {boolean} - Success status
     */
    saveSettings(settings) {
        if (!this.isStorageAvailable()) {
            return false;
        }

        try {
            localStorage.setItem(this.SETTINGS_KEY, JSON.stringify(settings));
            return true;
        } catch (error) {
            console.error('Error saving settings:', error);
            return false;
        }
    }

    /**
     * Import data from external source
     * @param {Array} entries - Entries to import
     * @returns {boolean} - Success status
     */
    importEntries(entries) {
        if (!Array.isArray(entries)) {
            console.error('Invalid import data: expected array');
            return false;
        }

        try {
            // Validate entries before import
            const validEntries = entries.filter(entry => {
                return entry.id && entry.sourceName && entry.reflection;
            });

            if (validEntries.length === 0) {
                console.error('No valid entries found in import data');
                return false;
            }

            return this.saveEntries(validEntries);
        } catch (error) {
            console.error('Error importing entries:', error);
            return false;
        }
    }
}