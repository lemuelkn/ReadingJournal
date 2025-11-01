/**
 * Modern Reading Journal App
 * Main application logic with edit, sort, and detail view functionality
 */

 class ModernReadingJournalApp {
    constructor() {
        this.dataService = new DataService();
        this.currentFilter = 'all';
        this.currentSort = 'created';
        this.editingEntryId = null;
        this.currentEntryId = null;
        this.currentView = 'home';
        this.selectedMediaType = null;
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.render();
    }

    setupEventListeners() {
        // New entry button
        document.getElementById('newEntryBtn').addEventListener('click', () => {
            this.openModal();
        });

        // Close modal button
        document.getElementById('closeModalBtn').addEventListener('click', () => {
            this.closeModal();
        });

        // Close modal on outside click
        document.getElementById('entryModal').addEventListener('click', (e) => {
            if (e.target.id === 'entryModal') {
                this.closeModal();
            }
        });

        // Form submission
        document.getElementById('entryForm').addEventListener('submit', (e) => {
            this.handleSubmit(e);
        });

        // Character counter
        document.getElementById('reflection').addEventListener('input', () => {
            this.updateCharCount();
        });

        // Search functionality
        document.getElementById('searchBox').addEventListener('input', (e) => {
            this.handleSearch(e.target.value);
        });

        // Filter buttons
        document.getElementById('filterButtons').addEventListener('click', (e) => {
            if (e.target.classList.contains('filter-btn')) {
                this.handleFilter(e.target);
            }
        });

        // Sort toggle
        document.getElementById('sortToggle').addEventListener('change', (e) => {
            this.handleSortChange(e.target.value);
        });

        // Detail view back button
        document.getElementById('backBtn').addEventListener('click', () => {
            this.showHomeView();
        });

        // Detail view edit button
        document.getElementById('detailEditBtn').addEventListener('click', () => {
            if (this.currentEntryId) {
                this.editEntry(this.currentEntryId);
            }
        });

        // Detail view delete button
        document.getElementById('detailDeleteBtn').addEventListener('click', () => {
            if (this.currentEntryId) {
                this.deleteEntry(this.currentEntryId);
            }
        });

        // Additional notes auto-save
        document.getElementById('additionalNotes').addEventListener('blur', () => {
            this.saveAdditionalNotes();
        });

        // Progress select
        document.getElementById('progressSelect').addEventListener('change', (e) => {
            this.updateProgress(e.target.value);
        });

        // Takeaways
        document.getElementById('addTakeawayBtn').addEventListener('click', () => {
            this.addTakeaway();
        });

        document.getElementById('newTakeaway').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.addTakeaway();
            }
        });

        // Links
        document.getElementById('addLinkBtn').addEventListener('click', () => {
            this.addLink();
        });

        // Tags
        document.getElementById('addTagBtn').addEventListener('click', () => {
            this.addTag();
        });

        document.getElementById('newTag').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.addTag();
            }
        });
    }

    render() {
        this.renderEntries();
        this.updateStats();
    }

    renderEntries(filteredEntries = null) {
        const container = document.getElementById('entriesGrid');
        const entries = filteredEntries || this.dataService.getAllEntries(this.currentSort);

        if (entries.length === 0) {
            container.innerHTML = `
                <div class="empty-state" style="grid-column: 1/-1;">
                    <div class="empty-icon">📖</div>
                    <h3>No entries yet</h3>
                    <p>Start your reading journey by adding your first reflection</p>
                    <button class="btn-new-entry" onclick="app.openModal()">Add Your First Entry</button>
                </div>
            `;
            return;
        }

        container.innerHTML = entries.map(entry => {
            const editedBadge = entry.editCount > 0 ? `<span class="entry-edited-badge">Edited</span>` : '';
            const editedDate = entry.getEditedDate() ? `<div class="entry-edited">Last edited: ${entry.getEditedDate()}</div>` : '';
            
            return `
                <div class="entry-card" onclick="app.showEntryDetail(${entry.id})">
                    <div class="entry-header">
                        <div class="entry-type">${entry.sourceType} ${editedBadge}</div>
                        <div class="entry-title">${this.escapeHtml(entry.sourceName)}</div>
                        ${entry.author ? `<div class="entry-author">by ${this.escapeHtml(entry.author)}</div>` : ''}
                    </div>
                    <div class="entry-body">
                        <div class="entry-reflection">${this.escapeHtml(entry.reflection)}</div>
                    </div>
                    <div class="entry-footer">
                        <div class="entry-date-info">
                            <div class="entry-date">${entry.dateFormatted}</div>
                            ${editedDate}
                        </div>
                        <div class="entry-actions">
                            <button class="action-btn" onclick="event.stopPropagation(); app.editEntry(${entry.id})" title="Edit">
                                ✏️
                            </button>
                            <button class="action-btn" onclick="event.stopPropagation(); app.deleteEntry(${entry.id})" title="Delete">
                                🗑️
                            </button>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    }

    updateStats() {
        const stats = this.dataService.getStatistics();
        
        document.getElementById('totalEntries').textContent = stats.totalEntries;
        document.getElementById('uniqueSources').textContent = stats.uniqueSources;
        document.getElementById('thisWeek').textContent = stats.thisWeek;
    }

    showHomeView() {
        document.getElementById('homeView').classList.add('active');
        document.getElementById('entryDetailView').classList.remove('active');
        this.currentView = 'home';
        this.currentEntryId = null;
        this.render();
    }

    showEntryDetail(entryId) {
        this.currentEntryId = entryId;
        const entry = this.dataService.getEntryById(entryId);
        
        if (!entry) {
            this.showToast('Entry not found', 'error');
            return;
        }

        document.getElementById('homeView').classList.remove('active');
        document.getElementById('entryDetailView').classList.add('active');
        this.currentView = 'detail';

        this.renderEntryDetail(entry);
    }

    renderEntryDetail(entry) {
        document.getElementById('detailType').textContent = entry.sourceType;
        document.getElementById('detailTitle').textContent = entry.sourceName;
        document.getElementById('detailAuthor').textContent = entry.author ? `by ${entry.author}` : '';
        document.getElementById('detailDate').textContent = `Created: ${entry.dateFormatted}`;
        document.getElementById('detailEdited').textContent = entry.getEditedDate() ? `Edited: ${entry.getEditedDate()}` : '';

        this.renderRating(entry.rating || 0);

        document.getElementById('detailReflection').textContent = entry.reflection;
        document.getElementById('additionalNotes').value = entry.additionalNotes || '';

        this.renderTakeaways(entry.keyTakeaways);
        this.renderLinks(entry.relatedLinks);
        this.renderTags(entry.tags);

        document.getElementById('progressSelect').value = entry.progress || '';

        document.getElementById('sidebarCreated').textContent = entry.dateFormatted;
        document.getElementById('sidebarEdited').textContent = entry.getEditedDate() || 'Never';
        document.getElementById('sidebarEditCount').textContent = entry.editCount;
    }

    renderRating(rating) {
        const container = document.getElementById('ratingStars');
        container.innerHTML = '';

        for (let i = 1; i <= 5; i++) {
            const star = document.createElement('span');
            star.className = `rating-star ${i <= rating ? 'filled' : 'empty'}`;
            star.textContent = '⭐';
            star.onclick = () => this.setRating(i);
            container.appendChild(star);
        }
    }

    setRating(rating) {
        if (!this.currentEntryId) return;

        const entry = this.dataService.getEntryById(this.currentEntryId);
        entry.setRating(rating);
        this.dataService.saveEntries();
        this.renderRating(rating);
        this.showToast('Rating updated');
    }

    renderTakeaways(takeaways) {
        const container = document.getElementById('takeawaysList');
        
        if (!takeaways || takeaways.length === 0) {
            container.innerHTML = '<div class="empty-list-message">No key takeaways yet</div>';
            return;
        }

        container.innerHTML = takeaways.map(takeaway => `
            <div class="takeaway-item">
                <div class="takeaway-text">${this.escapeHtml(takeaway.text)}</div>
                <button class="remove-btn" onclick="app.removeTakeaway(${takeaway.id})">×</button>
            </div>
        `).join('');
    }

    addTakeaway() {
        const input = document.getElementById('newTakeaway');
        const text = input.value.trim();

        if (!text || !this.currentEntryId) return;

        const entry = this.dataService.getEntryById(this.currentEntryId);
        entry.addTakeaway(text);
        this.dataService.saveEntries();

        input.value = '';
        this.renderTakeaways(entry.keyTakeaways);
        this.showToast('Takeaway added');
    }

    removeTakeaway(takeawayId) {
        if (!this.currentEntryId) return;

        const entry = this.dataService.getEntryById(this.currentEntryId);
        entry.removeTakeaway(takeawayId);
        this.dataService.saveEntries();

        this.renderTakeaways(entry.keyTakeaways);
        this.showToast('Takeaway removed');
    }

    renderLinks(links) {
        const container = document.getElementById('linksList');
        
        if (!links || links.length === 0) {
            container.innerHTML = '<div class="empty-list-message">No related links yet</div>';
            return;
        }

        container.innerHTML = links.map(link => `
            <div class="link-item">
                <div class="link-text">
                    <a href="${this.escapeHtml(link.url)}" target="_blank" rel="noopener">
                        ${this.escapeHtml(link.title)}
                    </a>
                    <div class="link-url">${this.escapeHtml(link.url)}</div>
                </div>
                <button class="remove-btn" onclick="app.removeLink(${link.id})">×</button>
            </div>
        `).join('');
    }

    addLink() {
        const urlInput = document.getElementById('newLinkUrl');
        const titleInput = document.getElementById('newLinkTitle');
        const url = urlInput.value.trim();
        const title = titleInput.value.trim();

        if (!url || !this.currentEntryId) return;

        const entry = this.dataService.getEntryById(this.currentEntryId);
        entry.addRelatedLink(url, title);
        this.dataService.saveEntries();

        urlInput.value = '';
        titleInput.value = '';
        this.renderLinks(entry.relatedLinks);
        this.showToast('Link added');
    }

    removeLink(linkId) {
        if (!this.currentEntryId) return;

        const entry = this.dataService.getEntryById(this.currentEntryId);
        entry.removeRelatedLink(linkId);
        this.dataService.saveEntries();

        this.renderLinks(entry.relatedLinks);
        this.showToast('Link removed');
    }

    renderTags(tags) {
        const container = document.getElementById('tagsContainer');
        
        if (!tags || tags.length === 0) {
            container.innerHTML = '<div class="empty-list-message" style="padding: 0.5rem; font-size: 0.85rem;">No tags</div>';
            return;
        }

        container.innerHTML = tags.map(tag => `
            <div class="tag">
                ${this.escapeHtml(tag)}
                <button class="tag-remove" onclick="app.removeTag('${this.escapeHtml(tag)}')">×</button>
            </div>
        `).join('');
    }

    addTag() {
        const input = document.getElementById('newTag');
        const tag = input.value.trim();

        if (!tag || !this.currentEntryId) return;

        const entry = this.dataService.getEntryById(this.currentEntryId);
        entry.addTag(tag);
        this.dataService.saveEntries();

        input.value = '';
        this.renderTags(entry.tags);
        this.showToast('Tag added');
    }

    removeTag(tag) {
        if (!this.currentEntryId) return;

        const entry = this.dataService.getEntryById(this.currentEntryId);
        entry.removeTag(tag);
        this.dataService.saveEntries();

        this.renderTags(entry.tags);
        this.showToast('Tag removed');
    }

    saveAdditionalNotes() {
        if (!this.currentEntryId) return;

        const notes = document.getElementById('additionalNotes').value;
        const entry = this.dataService.getEntryById(this.currentEntryId);
        
        entry.update({ additionalNotes: notes });
        this.dataService.saveEntries();
        
        document.getElementById('sidebarEdited').textContent = entry.getEditedDate() || 'Never';
        document.getElementById('sidebarEditCount').textContent = entry.editCount;
    }

    updateProgress(progress) {
        if (!this.currentEntryId) return;

        const entry = this.dataService.getEntryById(this.currentEntryId);
        entry.update({ progress });
        this.dataService.saveEntries();
        this.showToast('Progress updated');
    }

    openModal(entryId = null) {
        this.editingEntryId = entryId;
        
        if (entryId) {
            const entry = this.dataService.getEntryById(entryId);
            if (entry) {
                document.getElementById('modalTitle').textContent = 'Edit Entry';
                document.getElementById('submitBtn').textContent = 'Update Entry';
                document.getElementById('entryId').value = entryId;
                
                this.selectMediaType(entry.sourceType);
                this.prefillFormFields(entry);
                
                document.getElementById('reflection').value = entry.reflection;
                this.updateCharCount();
            }
        } else {
            document.getElementById('modalTitle').textContent = 'Add New Entry';
            document.getElementById('submitBtn').textContent = 'Save Entry';
            this.showStep(1);
        }
        
        document.getElementById('entryModal').classList.add('active');
    }

    closeModal() {
        document.getElementById('entryModal').classList.remove('active');
        document.getElementById('entryForm').reset();
        document.getElementById('entryId').value = '';
        this.editingEntryId = null;
        this.selectedMediaType = null;
        this.showStep(1);
        this.updateCharCount();
        
        document.querySelectorAll('.media-fields').forEach(field => {
            field.classList.remove('active');
        });
    }

    showStep(stepNumber) {
        document.querySelectorAll('.form-step').forEach(step => {
            step.classList.remove('active');
        });
        document.getElementById(`step${stepNumber}`).classList.add('active');
    }

    selectMediaType(type) {
        this.selectedMediaType = type;
        this.showStep(2);
        
        const icons = {
            'Book': '📚',
            'Article': '📰',
            'Newsletter': '✉️',
            'Research Paper': '🔬',
            'Blog Post': '💭',
            'Other': '📝'
        };
        
        document.getElementById('selectedMediaIcon').textContent = icons[type] || '📝';
        document.getElementById('selectedMediaText').textContent = type;
        
        document.querySelectorAll('.media-fields').forEach(field => {
            field.classList.remove('active');
        });
        
        const fieldMappings = {
            'Book': 'bookFields',
            'Article': 'articleFields',
            'Newsletter': 'newsletterFields',
            'Research Paper': 'researchFields',
            'Blog Post': 'blogFields',
            'Other': 'otherFields'
        };
        
        const fieldsId = fieldMappings[type];
        if (fieldsId) {
            document.getElementById(fieldsId).classList.add('active');
            
            setTimeout(() => {
                const firstInput = document.getElementById(fieldsId).querySelector('input, textarea');
                if (firstInput) firstInput.focus();
            }, 100);
        }
    }

    backToStep1() {
        this.showStep(1);
        this.selectedMediaType = null;
    }

    prefillFormFields(entry) {
        const metadata = entry.metadata || {};
        
        switch (entry.sourceType) {
            case 'Book':
                if (entry.sourceName) document.getElementById('bookTitle').value = entry.sourceName;
                if (entry.author) document.getElementById('bookAuthor').value = entry.author;
                if (metadata.isbn) document.getElementById('bookISBN').value = metadata.isbn;
                if (metadata.publisher) document.getElementById('bookPublisher').value = metadata.publisher;
                break;
                
            case 'Article':
                if (entry.sourceName) document.getElementById('articleTitle').value = entry.sourceName;
                if (entry.author) document.getElementById('articleAuthor').value = entry.author;
                if (metadata.url) document.getElementById('articleURL').value = metadata.url;
                if (metadata.publication) document.getElementById('articlePublication').value = metadata.publication;
                break;
                
            case 'Newsletter':
                if (entry.sourceName) document.getElementById('newsletterTitle').value = entry.sourceName;
                if (entry.author) document.getElementById('newsletterAuthor').value = entry.author;
                if (metadata.url) document.getElementById('newsletterURL').value = metadata.url;
                break;
                
            case 'Research Paper':
                if (entry.sourceName) document.getElementById('researchTitle').value = entry.sourceName;
                if (entry.author) document.getElementById('researchAuthors').value = entry.author;
                if (metadata.journal) document.getElementById('researchJournal').value = metadata.journal;
                if (metadata.doi) document.getElementById('researchDOI').value = metadata.doi;
                break;
                
            case 'Blog Post':
                if (entry.sourceName) document.getElementById('blogTitle').value = entry.sourceName;
                if (entry.author) document.getElementById('blogAuthor').value = entry.author;
                if (metadata.url) document.getElementById('blogURL').value = metadata.url;
                break;
                
            case 'Other':
                if (entry.sourceName) document.getElementById('otherTitle').value = entry.sourceName;
                if (entry.author) document.getElementById('otherAuthor').value = entry.author;
                if (metadata.url) document.getElementById('otherURL').value = metadata.url;
                break;
        }
    }

    getFormDataByMediaType() {
        let formData = {
            sourceType: this.selectedMediaType,
            reflection: document.getElementById('reflection').value
        };

        let metadata = {};

        switch (this.selectedMediaType) {
            case 'Book':
                formData.sourceName = document.getElementById('bookTitle').value.trim();
                formData.author = document.getElementById('bookAuthor').value.trim();
                metadata.isbn = document.getElementById('bookISBN').value.trim();
                metadata.publisher = document.getElementById('bookPublisher').value.trim();
                break;

            case 'Article':
                formData.sourceName = document.getElementById('articleTitle').value.trim();
                formData.author = document.getElementById('articleAuthor').value.trim();
                metadata.url = document.getElementById('articleURL').value.trim();
                metadata.publication = document.getElementById('articlePublication').value.trim();
                break;

            case 'Newsletter':
                formData.sourceName = document.getElementById('newsletterTitle').value.trim();
                formData.author = document.getElementById('newsletterAuthor').value.trim();
                metadata.url = document.getElementById('newsletterURL').value.trim();
                break;

            case 'Research Paper':
                formData.sourceName = document.getElementById('researchTitle').value.trim();
                formData.author = document.getElementById('researchAuthors').value.trim();
                metadata.journal = document.getElementById('researchJournal').value.trim();
                metadata.doi = document.getElementById('researchDOI').value.trim();
                break;

            case 'Blog Post':
                formData.sourceName = document.getElementById('blogTitle').value.trim();
                formData.author = document.getElementById('blogAuthor').value.trim();
                metadata.url = document.getElementById('blogURL').value.trim();
                break;

            case 'Other':
                formData.sourceName = document.getElementById('otherTitle').value.trim();
                formData.author = document.getElementById('otherAuthor').value.trim();
                metadata.url = document.getElementById('otherURL').value.trim();
                break;
        }

        formData.metadata = metadata;
        return formData;
    }

    handleSubmit(event) {
        event.preventDefault();

        const entryId = document.getElementById('entryId').value;
        const formData = this.getFormDataByMediaType();

        if (!formData.sourceName || !formData.reflection) {
            this.showToast('Please fill in all required fields', 'error');
            return;
        }

        let result;
        
        if (entryId) {
            result = this.dataService.updateEntry(parseInt(entryId), formData);
            if (result.success) {
                this.closeModal();
                
                if (this.currentView === 'detail' && this.currentEntryId === parseInt(entryId)) {
                    this.renderEntryDetail(result.entry);
                } else {
                    this.render();
                }
                
                this.showToast('Entry updated successfully! ✅');
            } else {
                this.showToast('Error: ' + result.error, 'error');
            }
        } else {
            result = this.dataService.addEntry(formData);
            if (result.success) {
                this.closeModal();
                this.render();
                this.showToast('Entry saved successfully! ✅');
            } else {
                this.showToast('Error: ' + result.error, 'error');
            }
        }
    }

    handleSearch(searchTerm) {
        if (!searchTerm.trim()) {
            this.renderEntries();
            return;
        }

        const filtered = this.dataService.searchEntries(searchTerm);
        const sorted = filtered.sort((a, b) => {
            const dateA = new Date(a.getSortDate(this.currentSort));
            const dateB = new Date(b.getSortDate(this.currentSort));
            return dateB - dateA;
        });
        this.renderEntries(sorted);
    }

    handleFilter(button) {
        const filter = button.dataset.filter;
        this.currentFilter = filter;

        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        button.classList.add('active');

        if (filter === 'all') {
            this.renderEntries();
        } else {
            const entries = this.dataService.getAllEntries(this.currentSort);
            const filtered = entries.filter(e => e.sourceType === filter);
            this.renderEntries(filtered);
        }
    }

    handleSortChange(sortBy) {
        this.currentSort = sortBy;
        
        if (this.currentFilter === 'all') {
            this.renderEntries();
        } else {
            const entries = this.dataService.getAllEntries(this.currentSort);
            const filtered = entries.filter(e => e.sourceType === this.currentFilter);
            this.renderEntries(filtered);
        }
    }

    editEntry(id) {
        this.openModal(id);
    }

    deleteEntry(id) {
        if (confirm('Are you sure you want to delete this entry?')) {
            const result = this.dataService.deleteEntry(id);
            
            if (result.success) {
                if (this.currentView === 'detail' && this.currentEntryId === id) {
                    this.showHomeView();
                } else {
                    this.render();
                }
                this.showToast('Entry deleted');
            } else {
                this.showToast('Error deleting entry', 'error');
            }
        }
    }

    updateCharCount() {
        const textarea = document.getElementById('reflection');
        const counter = document.getElementById('charCount');
        counter.textContent = textarea.value.length;
    }

    showToast(message, type = 'success') {
        const toast = document.getElementById('toast');
        const toastMessage = document.getElementById('toastMessage');
        
        toastMessage.textContent = message;
        toast.className = `toast show ${type}`;
        
        setTimeout(() => {
            toast.classList.remove('show');
        }, 3000);
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    exportAsJSON() {
        const exportService = new ExportService(this.dataService);
        exportService.exportAsJSON();
    }

    exportAsMarkdown() {
        const exportService = new ExportService(this.dataService);
        exportService.exportAsMarkdown();
    }
}

// Initialize app when DOM is loaded
let app;
document.addEventListener('DOMContentLoaded', () => {
    app = new ModernReadingJournalApp();
});