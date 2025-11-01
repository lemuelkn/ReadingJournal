/**
 * Main App Controller
 * Initializes and coordinates all components
 */
 class ReadingJournalApp {
    constructor() {
        this.dataService = null;
        this.exportService = null;
        this.components = {};
        this.currentTab = 'entries';
        
        this.init();
    }

    /**
     * Initialize the application
     */
    async init() {
        try {
            // Initialize services
            this.dataService = new DataService();
            this.exportService = new ExportService(this.dataService);

            // Initialize components
            this.initializeComponents();

            // Set up event listeners
            this.setupEventListeners();

            // Subscribe to data changes
            this.dataService.subscribe(this.handleDataChange.bind(this));

            // Show initial tab
            this.showTab('entries');

            console.log('Reading Journal app initialized successfully');
        } catch (error) {
            console.error('Error initializing app:', error);
            this.showError('Failed to initialize app. Please refresh the page.');
        }
    }

    /**
     * Initialize all UI components
     */
    initializeComponents() {
        // Tab Navigation
        this.components.tabNavigation = new TabNavigation({
            container: document.getElementById('navigationTabs'),
            onTabChange: this.handleTabChange.bind(this)
        });

        // Search Box
        this.components.searchBox = new SearchBox({
            container: document.getElementById('searchContainer'),
            onSearch: this.handleSearch.bind(this)
        });

        // Statistics
        this.components.statistics = new Statistics({
            container: document.getElementById('statisticsContainer'),
            dataService: this.dataService
        });

        // Entry List
        this.components.entryList = new EntryList({
            container: document.getElementById('entriesContainer'),
            dataService: this.dataService
        });

        // Entry Form
        this.components.entryForm = new EntryForm({
            container: document.getElementById('entryFormContainer'),
            onSubmit: this.handleNewEntry.bind(this)
        });
    }

    /**
     * Set up global event listeners
     */
    setupEventListeners() {
        // Export buttons
        const exportJSONBtn = document.getElementById('exportJSONBtn');
        const exportMarkdownBtn = document.getElementById('exportMarkdownBtn');

        if (exportJSONBtn) {
            exportJSONBtn.addEventListener('click', () => {
                this.exportService.exportAsJSON();
            });
        }

        if (exportMarkdownBtn) {
            exportMarkdownBtn.addEventListener('click', () => {
                this.exportService.exportAsMarkdown();
            });
        }

        // Handle browser storage errors
        window.addEventListener('storage', this.handleStorageChange.bind(this));
        
        // Handle app errors
        window.addEventListener('error', this.handleError.bind(this));
    }

    /**
     * Handle tab changes
     * @param {string} tabName - Name of the tab to show
     */
    handleTabChange(tabName) {
        this.showTab(tabName);
    }

    /**
     * Show specific tab
     * @param {string} tabName - Tab to show
     */
    showTab(tabName) {
        // Hide all tab contents
        document.querySelectorAll('.tab-content').forEach(tab => {
            tab.classList.remove('active');
        });

        // Show selected tab
        const targetTab = document.getElementById(tabName);
        if (targetTab) {
            targetTab.classList.add('active');
            this.currentTab = tabName;

            // Update components based on active tab
            this.updateActiveTabComponents(tabName);
        }
    }

    /**
     * Update components when tab becomes active
     * @param {string} tabName - Active tab name
     */
    updateActiveTabComponents(tabName) {
        switch (tabName) {
            case 'entries':
                this.components.statistics.refresh();
                this.components.entryList.refresh();
                break;
            case 'add':
                this.components.entryForm.focus();
                break;
            case 'export':
                // No specific updates needed for export tab
                break;
        }
    }

    /**
     * Handle search requests
     * @param {string} searchTerm - Search term
     */
    handleSearch(searchTerm) {
        const filteredEntries = this.dataService.searchEntries(searchTerm);
        this.components.entryList.displayEntries(filteredEntries);
    }

    /**
     * Handle new entry submission
     * @param {Object} entryData - New entry data
     */
    handleNewEntry(entryData) {
        const result = this.dataService.addEntry(entryData);
        
        if (result.success) {
            // Clear the form
            this.components.entryForm.reset();
            
            // Show success message
            this.showSuccess('Entry saved successfully!');
            
            // Switch to entries tab
            this.showTab('entries');
            
            // Clear any active search to show all entries
            this.components.searchBox.clear();
        } else {
            this.showError(result.error);
        }
    }

    /**
     * Handle data service events
     * @param {string} event - Event type
     * @param {*} data - Event data
     */
    handleDataChange(event, data) {
        switch (event) {
            case 'entry_added':
                this.components.statistics.refresh();
                if (this.currentTab === 'entries') {
                    this.components.entryList.refresh();
                }
                break;
                
            case 'entry_updated':
                this.components.entryList.refresh();
                break;
                
            case 'entry_deleted':
                this.components.statistics.refresh();
                this.components.entryList.refresh();
                break;
                
            case 'entries_loaded':
                this.components.statistics.refresh();
                this.components.entryList.refresh();
                break;
        }
    }

    /**
     * Handle storage changes (e.g., from another tab)
     * @param {StorageEvent} event - Storage event
     */
    handleStorageChange(event) {
        if (event.key === 'readingJournalEntries') {
            console.log('Data changed in another tab, reloading...');
            this.dataService.loadEntries();
        }
    }

    /**
     * Handle application errors
     * @param {ErrorEvent} event - Error event
     */
    handleError(event) {
        console.error('Application error:', event.error);
        this.showError('An unexpected error occurred. Please try again.');
    }

    /**
     * Show success message to user
     * @param {string} message - Success message
     */
    showSuccess(message) {
        this.showNotification(message, 'success');
    }

    /**
     * Show error message to user
     * @param {string} message - Error message
     */
    showError(message) {
        this.showNotification(message, 'error');
    }

    /**
     * Show notification to user
     * @param {string} message - Notification message
     * @param {string} type - Notification type (success|error|info)
     */
    showNotification(message, type = 'info') {
        // Simple alert for MVP - can be enhanced with custom notifications later
        if (type === 'error') {
            alert(`Error: ${message}`);
        } else {
            alert(message);
        }
    }

    /**
     * Get current app state
     * @returns {Object} - Current app state
     */
    getAppState() {
        return {
            currentTab: this.currentTab,
            totalEntries: this.dataService.getAllEntries().length,
            lastUpdate: new Date().toISOString()
        };
    }

    /**
     * Cleanup resources (for testing or app shutdown)
     */
    destroy() {
        // Unsubscribe from data service
        if (this.dataService) {
            this.dataService.unsubscribe(this.handleDataChange.bind(this));
        }

        // Clean up components
        Object.values(this.components).forEach(component => {
            if (component.destroy) {
                component.destroy();
            }
        });

        console.log('Reading Journal app destroyed');
    }
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.readingJournalApp = new ReadingJournalApp();
});