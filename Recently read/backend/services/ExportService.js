/**
 * Export Service
 * Handles data export functionality
 */
 class ExportService {
    constructor(dataService) {
        this.dataService = dataService;
    }

    /**
     * Export all entries as JSON
     * @returns {boolean} - Success status
     */
    exportAsJSON() {
        try {
            const entries = this.dataService.getAllEntries();
            const exportData = {
                metadata: {
                    exportDate: new Date().toISOString(),
                    version: '1.0.0',
                    totalEntries: entries.length,
                    appName: 'Reading Journal'
                },
                entries: entries.map(entry => entry.toObject())
            };

            const dataStr = JSON.stringify(exportData, null, 2);
            const fileName = `reading-journal-${this.getDateString()}.json`;
            
            this.downloadFile(dataStr, fileName, 'application/json');
            return true;
        } catch (error) {
            console.error('Error exporting as JSON:', error);
            alert('Failed to export data as JSON. Please try again.');
            return false;
        }
    }

    /**
     * Export all entries as Markdown
     * @returns {boolean} - Success status
     */
    exportAsMarkdown() {
        try {
            const entries = this.dataService.getAllEntries();
            const stats = this.dataService.getStatistics();
            
            let markdown = this.generateMarkdownHeader(stats);
            
            // Group entries by source type for better organization
            const groupedEntries = this.groupEntriesByType(entries);
            
            Object.keys(groupedEntries).sort().forEach(sourceType => {
                markdown += `\n## ${sourceType} Entries\n\n`;
                
                groupedEntries[sourceType].forEach(entry => {
                    markdown += this.entryToMarkdown(entry);
                });
            });

            markdown += this.generateMarkdownFooter();
            
            const fileName = `reading-journal-${this.getDateString()}.md`;
            this.downloadFile(markdown, fileName, 'text/markdown');
            return true;
        } catch (error) {
            console.error('Error exporting as Markdown:', error);
            alert('Failed to export data as Markdown. Please try again.');
            return false;
        }
    }

    /**
     * Export entries for a specific date range
     * @param {Date} startDate - Start date
     * @param {Date} endDate - End date
     * @param {string} format - Export format ('json' or 'markdown')
     * @returns {boolean} - Success status
     */
    exportDateRange(startDate, endDate, format = 'json') {
        try {
            const allEntries = this.dataService.getAllEntries();
            const filteredEntries = allEntries.filter(entry => {
                const entryDate = new Date(entry.timestamp);
                return entryDate >= startDate && entryDate <= endDate;
            });

            if (filteredEntries.length === 0) {
                alert('No entries found in the selected date range.');
                return false;
            }

            // Temporarily override entries for export
            const originalGetAllEntries = this.dataService.getAllEntries;
            this.dataService.getAllEntries = () => filteredEntries;

            const success = format === 'json' ? 
                this.exportAsJSON() : 
                this.exportAsMarkdown();

            // Restore original method
            this.dataService.getAllEntries = originalGetAllEntries;

            return success;
        } catch (error) {
            console.error('Error exporting date range:', error);
            alert('Failed to export date range. Please try again.');
            return false;
        }
    }

    /**
     * Export single entry
     * @param {number} entryId - Entry ID to export
     * @param {string} format - Export format ('json' or 'markdown')
     * @returns {boolean} - Success status
     */
    exportSingleEntry(entryId, format = 'markdown') {
        try {
            const entry = this.dataService.getEntryById(entryId);
            if (!entry) {
                alert('Entry not found.');
                return false;
            }

            let content, fileName, mimeType;

            if (format === 'json') {
                content = JSON.stringify({
                    metadata: {
                        exportDate: new Date().toISOString(),
                        entryId: entry.id,
                        appName: 'Reading Journal'
                    },
                    entry: entry.toObject()
                }, null, 2);
                fileName = `entry-${entry.id}-${this.getDateString()}.json`;
                mimeType = 'application/json';
            } else {
                content = this.entryToMarkdown(entry);
                fileName = `entry-${this.sanitizeFileName(entry.sourceName)}.md`;
                mimeType = 'text/markdown';
            }

            this.downloadFile(content, fileName, mimeType);
            return true;
        } catch (error) {
            console.error('Error exporting single entry:', error);
            alert('Failed to export entry. Please try again.');
            return false;
        }
    }

    /**
     * Generate Markdown header with statistics
     * @param {Object} stats - Statistics object
     * @returns {string} - Markdown header
     */
    generateMarkdownHeader(stats) {
        return `# My Reading Journal

**Exported on:** ${new Date().toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        })}

## Statistics

- **Total Entries:** ${stats.totalEntries}
- **Unique Sources:** ${stats.uniqueSources}
- **Entries This Week:** ${stats.thisWeek}

---

`;
    }

    /**
     * Generate Markdown footer
     * @returns {string} - Markdown footer
     */
    generateMarkdownFooter() {
        return `\n---

*Generated by Reading Journal - Your personal reading companion*
`;
    }

    /**
     * Convert entry to Markdown format
     * @param {Entry} entry - Entry to convert
     * @returns {string} - Markdown representation
     */
    entryToMarkdown(entry) {
        const title = entry.sourceName;
        const author = entry.author ? ` by ${entry.author}` : '';
        const date = entry.dateFormatted;
        const reflection = entry.reflection;

        return `### ${title}${author}

**Date:** ${date}  
**Type:** ${entry.sourceType}

${reflection}

---

`;
    }

    /**
     * Group entries by source type
     * @param {Array<Entry>} entries - Entries to group
     * @returns {Object} - Grouped entries
     */
    groupEntriesByType(entries) {
        return entries.reduce((groups, entry) => {
            const type = entry.sourceType;
            if (!groups[type]) {
                groups[type] = [];
            }
            groups[type].push(entry);
            return groups;
        }, {});
    }

    /**
     * Download file to user's device
     * @param {string} content - File content
     * @param {string} fileName - File name
     * @param {string} mimeType - MIME type
     */
    downloadFile(content, fileName, mimeType) {
        const blob = new Blob([content], { type: mimeType });
        const url = URL.createObjectURL(blob);
        
        const link = document.createElement('a');
        link.href = url;
        link.download = fileName;
        
        // Trigger download
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        // Clean up
        URL.revokeObjectURL(url);
        
        console.log(`Exported: ${fileName}`);
    }

    /**
     * Get formatted date string for file names
     * @returns {string} - Formatted date string
     */
    getDateString() {
        return new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
    }

    /**
     * Sanitize string for use in file names
     * @param {string} str - String to sanitize
     * @returns {string} - Sanitized string
     */
    sanitizeFileName(str) {
        return str
            .replace(/[^a-z0-9]/gi, '-') // Replace non-alphanumeric with dashes
            .replace(/-+/g, '-') // Replace multiple dashes with single dash
            .replace(/^-|-$/g, '') // Remove leading/trailing dashes
            .toLowerCase()
            .substring(0, 50); // Limit length
    }

    /**
     * Create backup export (automated backup)
     * @returns {boolean} - Success status
     */
    createBackupExport() {
        try {
            const entries = this.dataService.getAllEntries();
            const backupData = {
                metadata: {
                    backupDate: new Date().toISOString(),
                    version: '1.0.0',
                    totalEntries: entries.length,
                    isBackup: true
                },
                entries: entries.map(entry => entry.toObject())
            };

            const dataStr = JSON.stringify(backupData, null, 2);
            const fileName = `reading-journal-backup-${this.getDateString()}.json`;
            
            this.downloadFile(dataStr, fileName, 'application/json');
            return true;
        } catch (error) {
            console.error('Error creating backup:', error);
            return false;
        }
    }

    /**
     * Get export statistics
     * @returns {Object} - Export statistics
     */
    getExportStats() {
        const entries = this.dataService.getAllEntries();
        const totalWords = entries.reduce((sum, entry) => {
            return sum + entry.reflection.split(/\s+/).length;
        }, 0);

        const sourceTypes = entries.reduce((types, entry) => {
            types[entry.sourceType] = (types[entry.sourceType] || 0) + 1;
            return types;
        }, {});

        return {
            totalEntries: entries.length,
            totalWords,
            averageWordsPerEntry: Math.round(totalWords / entries.length) || 0,
            sourceTypeBreakdown: sourceTypes,
            dateRange: this.getDateRange(entries),
            estimatedFileSize: {
                json: Math.round(JSON.stringify(entries).length / 1024), // KB
                markdown: Math.round(entries.map(e => this.entryToMarkdown(e)).join('').length / 1024) // KB
            }
        };
    }

    /**
     * Get date range of entries
     * @param {Array<Entry>} entries - Entries to analyze
     * @returns {Object} - Date range info
     */
    getDateRange(entries) {
        if (entries.length === 0) {
            return { earliest: null, latest: null, span: 0 };
        }

        const dates = entries.map(entry => new Date(entry.timestamp)).sort();
        const earliest = dates[0];
        const latest = dates[dates.length - 1];
        const spanDays = Math.ceil((latest - earliest) / (1000 * 60 * 60 * 24));

        return {
            earliest: earliest.toISOString(),
            latest: latest.toISOString(),
            span: spanDays
        };
    }
}