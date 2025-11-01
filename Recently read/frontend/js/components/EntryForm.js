/**
 * Entry Form Component
 * Handles the add/edit entry form
 */
 class EntryForm {
    constructor(options) {
        this.container = options.container;
        this.onSubmit = options.onSubmit;
        this.validationService = new ValidationService();
        
        this.init();
    }

    /**
     * Initialize the form component
     */
    init() {
        this.render();
        this.setupEventListeners();
    }

    /**
     * Render the form HTML
     */
    render() {
        this.container.innerHTML = `
            <div class="entry-form">
                <h2 style="margin-bottom: 20px; color: #2c3e50;">Add New Entry</h2>
                <form id="entryForm">
                    <div class="form-group">
                        <label for="sourceType">Source Type *</label>
                        <select id="sourceType" required>
                            <option value="">Select type...</option>
                            <option value="Book">Book</option>
                            <option value="Article">Article</option>
                            <option value="Substack">Substack</option>
                            <option value="Research Paper">Research Paper</option>
                            <option value="Blog Post">Blog Post</option>
                            <option value="Podcast">Podcast</option>
                            <option value="Video">Video</option>
                            <option value="Other">Other</option>
                        </select>
                        <div class="error-message" id="sourceTypeError"></div>
                    </div>

                    <div class="form-group">
                        <label for="sourceName">Source Title/Name *</label>
                        <input 
                            type="text" 
                            id="sourceName" 
                            placeholder="e.g., 'Atomic Habits' or 'The Future of AI'" 
                            required
                            maxlength="200"
                        >
                        <div class="error-message" id="sourceNameError"></div>
                    </div>

                    <div class="form-group">
                        <label for="author">Author (Optional)</label>
                        <input 
                            type="text" 
                            id="author" 
                            placeholder="Author name"
                            maxlength="100"
                        >
                        <div class="error-message" id="authorError"></div>
                    </div>

                    <div class="form-group">
                        <label for="reflection">Your Thoughts & Summary *</label>
                        <textarea 
                            id="reflection" 
                            placeholder="What did you learn? What were the key insights? How does this connect to what you already know?"
                            required
                            minlength="10"
                            maxlength="5000"
                        ></textarea>
                        <div class="char-counter">
                            <span id="charCount">0</span> / 5000 characters
                        </div>
                        <div class="error-message" id="reflectionError"></div>
                    </div>

                    <div class="form-actions">
                        <button type="submit" class="btn" id="submitBtn">
                            Save Entry
                        </button>
                        <button type="button" class="btn btn-secondary" id="clearBtn">
                            Clear Form
                        </button>
                    </div>
                </form>
            </div>
        `;
    }

    /**
     * Set up form event listeners
     */
    setupEventListeners() {
        const form = document.getElementById('entryForm');
        const clearBtn = document.getElementById('clearBtn');
        const reflectionTextarea = document.getElementById('reflection');
        const charCount = document.getElementById('charCount');

        // Form submission
        form.addEventListener('submit', this.handleSubmit.bind(this));

        // Clear form
        clearBtn.addEventListener('click', this.handleClear.bind(this));

        // Character counter for reflection
        reflectionTextarea.addEventListener('input', () => {
            const count = reflectionTextarea.value.length;
            charCount.textContent = count;
            charCount.style.color = count > 4500 ? '#e74c3c' : '#6c757d';
        });

        // Real-time validation
        this.setupRealtimeValidation();

        // Auto-save draft (optional feature)
        this.setupAutoSave();
    }

    /**
     * Set up real-time field validation
     */
    setupRealtimeValidation() {
        const fields = ['sourceType', 'sourceName', 'author', 'reflection'];
        
        fields.forEach(fieldName => {
            const field = document.getElementById(fieldName);
            if (field) {
                field.addEventListener('blur', () => {
                    this.validateField(fieldName);
                });
                
                field.addEventListener('input', () => {
                    // Clear error on input
                    this.clearFieldError(fieldName);
                });
            }
        });
    }

    /**
     * Set up auto-save draft functionality
     */
    setupAutoSave() {
        const form = document.getElementById('entryForm');
        let autoSaveTimer;

        form.addEventListener('input', () => {
            clearTimeout(autoSaveTimer);
            autoSaveTimer = setTimeout(() => {
                this.saveDraft();
            }, 2000); // Auto-save after 2 seconds of inactivity
        });

        // Load draft on initialization
        this.loadDraft();
    }

    /**
     * Handle form submission
     * @param {Event} event - Form submit event
     */
    handleSubmit(event) {
        event.preventDefault();
        
        if (!this.validateForm()) {
            return;
        }

        const formData = this.getFormData();
        const submitBtn = document.getElementById('submitBtn');
        
        // Show loading state
        this.setSubmitLoading(true);
        
        try {
            if (this.onSubmit) {
                this.onSubmit(formData);
            }
            
            // Clear draft after successful submission
            this.clearDraft();
        } catch (error) {
            console.error('Error submitting form:', error);
            this.showFormError('Failed to save entry. Please try again.');
        } finally {
            this.setSubmitLoading(false);
        }
    }

    /**
     * Handle clear form button
     */
    handleClear() {
        if (confirm('Are you sure you want to clear the form? Any unsaved changes will be lost.')) {
            this.reset();
            this.clearDraft();
        }
    }

    /**
     * Get form data as object
     * @returns {Object} - Form data
     */
    getFormData() {
        return {
            sourceType: document.getElementById('sourceType').value.trim(),
            sourceName: document.getElementById('sourceName').value.trim(),
            author: document.getElementById('author').value.trim(),
            reflection: document.getElementById('reflection').value.trim()
        };
    }

    /**
     * Validate entire form
     * @returns {boolean} - Whether form is valid
     */
    validateForm() {
        const fields = ['sourceType', 'sourceName', 'reflection'];
        let isValid = true;

        // Clear previous form-level errors
        this.clearFormError();

        // Validate each required field
        fields.forEach(fieldName => {
            if (!this.validateField(fieldName)) {
                isValid = false;
            }
        });

        // Additional cross-field validation
        if (isValid) {
            const formData = this.getFormData();
            const validation = this.validationService.validateEntry(formData);
            
            if (!validation.isValid) {
                this.showFormError(validation.errors.join(', '));
                isValid = false;
            }
        }

        return isValid;
    }

    /**
     * Validate individual field
     * @param {string} fieldName - Field to validate
     * @returns {boolean} - Whether field is valid
     */
    validateField(fieldName) {
        const field = document.getElementById(fieldName);
        const value = field.value.trim();
        let isValid = true;
        let errorMessage = '';

        switch (fieldName) {
            case 'sourceType':
                if (!value) {
                    errorMessage = 'Please select a source type';
                    isValid = false;
                }
                break;

            case 'sourceName':
                if (!value) {
                    errorMessage = 'Source name is required';
                    isValid = false;
                } else if (value.length < 2) {
                    errorMessage = 'Source name must be at least 2 characters';
                    isValid = false;
                } else if (value.length > 200) {
                    errorMessage = 'Source name must be less than 200 characters';
                    isValid = false;
                }
                break;

            case 'author':
                if (value && value.length > 100) {
                    errorMessage = 'Author name must be less than 100 characters';
                    isValid = false;
                }
                break;

            case 'reflection':
                if (!value) {
                    errorMessage = 'Reflection is required';
                    isValid = false;
                } else if (value.length < 10) {
                    errorMessage = 'Reflection must be at least 10 characters';
                    isValid = false;
                } else if (value.length > 5000) {
                    errorMessage = 'Reflection must be less than 5000 characters';
                    isValid = false;
                }
                break;
        }

        if (!isValid) {
            this.showFieldError(fieldName, errorMessage);
        } else {
            this.clearFieldError(fieldName);
        }

        return isValid;
    }

    /**
     * Show field-specific error
     * @param {string} fieldName - Field name
     * @param {string} message - Error message
     */
    showFieldError(fieldName, message) {
        const errorElement = document.getElementById(`${fieldName}Error`);
        const field = document.getElementById(fieldName);
        
        if (errorElement) {
            errorElement.textContent = message;
            errorElement.style.display = 'block';
        }
        
        if (field) {
            field.classList.add('error');
        }
    }

    /**
     * Clear field-specific error
     * @param {string} fieldName - Field name
     */
    clearFieldError(fieldName) {
        const errorElement = document.getElementById(`${fieldName}Error`);
        const field = document.getElementById(fieldName);
        
        if (errorElement) {
            errorElement.style.display = 'none';
        }
        
        if (field) {
            field.classList.remove('error');
        }
    }

    /**
     * Show form-level error
     * @param {string} message - Error message
     */
    showFormError(message) {
        // Create or update form error element
        let errorElement = document.getElementById('formError');
        if (!errorElement) {
            errorElement = document.createElement('div');
            errorElement.id = 'formError';
            errorElement.className = 'form-error';
            document.getElementById('entryForm').prepend(errorElement);
        }
        
        errorElement.textContent = message;
        errorElement.style.display = 'block';
    }

    /**
     * Clear form-level error
     */
    clearFormError() {
        const errorElement = document.getElementById('formError');
        if (errorElement) {
            errorElement.style.display = 'none';
        }
    }

    /**
     * Set submit button loading state
     * @param {boolean} loading - Loading state
     */
    setSubmitLoading(loading) {
        const submitBtn = document.getElementById('submitBtn');
        if (submitBtn) {
            submitBtn.disabled = loading;
            submitBtn.textContent = loading ? 'Saving...' : 'Save Entry';
        }
    }

    /**
     * Reset form to empty state
     */
    reset() {
        const form = document.getElementById('entryForm');
        if (form) {
            form.reset();
            
            // Clear all error messages
            document.querySelectorAll('.error-message').forEach(el => {
                el.style.display = 'none';
            });
            
            // Clear error classes
            document.querySelectorAll('.error').forEach(el => {
                el.classList.remove('error');
            });
            
            // Reset character counter
            const charCount = document.getElementById('charCount');
            if (charCount) {
                charCount.textContent = '0';
                charCount.style.color = '#6c757d';
            }
            
            this.clearFormError();
        }
    }

    /**
     * Focus on the first form field
     */
    focus() {
        const firstField = document.getElementById('sourceType');
        if (firstField) {
            firstField.focus();
        }
    }

    /**
     * Save form as draft to localStorage
     */
    saveDraft() {
        try {
            const formData = this.getFormData();
            // Only save if there's meaningful content
            if (formData.sourceName || formData.reflection) {
                localStorage.setItem('readingJournalDraft', JSON.stringify({
                    ...formData,
                    savedAt: new Date().toISOString()
                }));
            }
        } catch (error) {
            console.error('Error saving draft:', error);
        }
    }

    /**
     * Load draft from localStorage
     */
    loadDraft() {
        try {
            const draftData = localStorage.getItem('readingJournalDraft');
            if (draftData) {
                const draft = JSON.parse(draftData);
                
                // Load draft data into form
                if (draft.sourceType) document.getElementById('sourceType').value = draft.sourceType;
                if (draft.sourceName) document.getElementById('sourceName').value = draft.sourceName;
                if (draft.author) document.getElementById('author').value = draft.author;
                if (draft.reflection) {
                    document.getElementById('reflection').value = draft.reflection;
                    // Update character counter
                    const charCount = document.getElementById('charCount');
                    if (charCount) {
                        charCount.textContent = draft.reflection.length;
                    }
                }
                
                // Show draft loaded message (optional)
                console.log('Draft loaded from:', draft.savedAt);
            }
        } catch (error) {
            console.error('Error loading draft:', error);
        }
    }

    /**
     * Clear saved draft
     */
    clearDraft() {
        try {
            localStorage.removeItem('readingJournalDraft');
        } catch (error) {
            console.error('Error clearing draft:', error);
        }
    }

    /**
     * Destroy component and clean up
     */
    destroy() {
        // Remove event listeners would go here if we stored references
        // For now, the component will be cleaned up when container is removed
    }
}