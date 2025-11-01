/**
 * Statistics Component
 */
 class Statistics {
    constructor(options) {
        this.container = options.container;
        this.dataService = options.dataService;
        
        this.init();
    }

    init() {
        this.render();
        this.refresh();
    }

    render() {
        this.container.innerHTML = `
            <div class="stats">
                <div class="stat-card">
                    <div class="stat-number" id="totalEntries">-</div>
                    <div class="stat-label">Total Entries</div>
                </div>
                <div class="stat-card">
                    <div class="stat-number" id="uniqueSources">-</div>
                    <div class="stat-label">Unique Sources</div>
                </div>
                <div class="stat-card">
                    <div class="stat-number" id="thisWeek">-</div>
                    <div class="stat-label">This Week</div>
                </div>
            </div>
        `;
    }

    refresh() {
        const stats = this.dataService.getStatistics();
        
        document.getElementById('totalEntries').textContent = stats.totalEntries;
        document.getElementById('uniqueSources').textContent = stats.uniqueSources;
        document.getElementById('thisWeek').textContent = stats.thisWeek;
    }
}