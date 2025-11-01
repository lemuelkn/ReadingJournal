/**
 * Search Box Component
 */
 class SearchBox {
    constructor(options) {
        this.container = options.container;
        this.onSearch = options.onSearch;
        this.debounceTimer = null;
        this.debounceDelay = 300; // ms
        
        this.init();
    }

    init() {
        this.render();
        this.setupEventListeners();
    }

    render() {
        this.container.innerHTML = `
            <div class="search-container">
                <input type="text" 
                       id="searchBox" 
                       class="search-box" 
                       placeholder="🔍 Search your entries..."
                       autocomplete="off">
                <div class="search-suggestions" id="searchSuggestions" style="display: none;">
                    <!-- Dynamic suggestions will go here -->
                </div>
            </div>
        `;
    }

    setupEventListeners() {
        const searchBox = document.getElementById('searchBox');
        
        searchBox.addEventListener('input', (event) => {
            this.handleSearch(event.target.value);
        });

        searchBox.addEventListener('keydown', (event) => {
            if (event.key === 'Escape') {
                this.clear();
            }
        });

        // Clear search when clicking outside
        document.addEventListener('click', (event) => {
            if (!this.container.contains(event.target)) {
                this.hideSuggestions();
            }
        });
    }

    handleSearch(searchTerm) {
        // Clear previous timer
        if (this.debounceTimer) {
            clearTimeout(this.debounceTimer);
        }

        // Debounce search to avoid too many calls
        this.debounceTimer = setTimeout(() => {
            if (this.onSearch) {
                this.onSearch(searchTerm);
            }
            this.updateSuggestions(searchTerm);
        }, this.debounceDelay);
    }

    updateSuggestions(searchTerm) {
        // For MVP, we'll skip complex suggestions
        // In a full version, this could show recent searches, popular terms, etc.
        this.hideSuggestions();
    }

    showSuggestions() {
        const suggestions = document.getElementById('searchSuggestions');
        if (suggestions) {
            suggestions.style.display = 'block';
        }
    }

    hideSuggestions() {
        const suggestions = document.getElementById('searchSuggestions');
        if (suggestions) {
            suggestions.style.display = 'none';
        }
    }

    clear() {
        const searchBox = document.getElementById('searchBox');
        if (searchBox) {
            searchBox.value = '';
            this.handleSearch('');
        }
    }

    getValue() {
        const searchBox = document.getElementById('searchBox');
        return searchBox ? searchBox.value : '';
    }
}