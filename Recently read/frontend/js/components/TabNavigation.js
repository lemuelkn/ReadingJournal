/**
 * Tab Navigation Component
 */
 class TabNavigation {
    constructor(options) {
        this.container = options.container;
        this.onTabChange = options.onTabChange;
        this.tabs = [
            { id: 'entries', label: 'My Entries', icon: '📖' },
            { id: 'add', label: 'Add Entry', icon: '✏️' },
            { id: 'export', label: 'Export', icon: '📁' }
        ];
        this.activeTab = 'entries';
        this.init();
    }

    init() {
        this.render();
        this.setupEventListeners();
    }

    render() {
        const tabsHTML = this.tabs.map(tab => `
            <button class="nav-tab ${tab.id === this.activeTab ? 'active' : ''}" 
                    data-tab="${tab.id}">
                <span class="tab-icon">${tab.icon}</span>
                <span class="tab-label">${tab.label}</span>
            </button>
        `).join('');

        this.container.innerHTML = tabsHTML;
    }

    setupEventListeners() {
        this.container.addEventListener('click', (event) => {
            const tabButton = event.target.closest('.nav-tab');
            if (tabButton) {
                const tabId = tabButton.dataset.tab;
                this.setActiveTab(tabId);
            }
        });
    }

    setActiveTab(tabId) {
        if (this.activeTab === tabId) return;

        this.activeTab = tabId;
        
        // Update visual state
        this.container.querySelectorAll('.nav-tab').forEach(tab => {
            tab.classList.remove('active');
        });
        
        const activeTabElement = this.container.querySelector(`[data-tab="${tabId}"]`);
        if (activeTabElement) {
            activeTabElement.classList.add('active');
        }

        // Notify parent
        if (this.onTabChange) {
            this.onTabChange(tabId);
        }
    }
}