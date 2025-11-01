/**
 * App constants
 */
 const APP_CONSTANTS = {
    APP_NAME: 'Reading Journal',
    VERSION: '1.0.0',
    STORAGE_KEYS: {
        ENTRIES: 'readingJournalEntries',
        SETTINGS: 'readingJournalSettings',
        DRAFT: 'readingJournalDraft'
    },
    SOURCE_TYPES: [
        'Book',
        'Article', 
        'Substack',
        'Research Paper',
        'Blog Post',
        'Podcast',
        'Video',
        'Other'
    ],
    VALIDATION: {
        MAX_SOURCE_NAME_LENGTH: 200,
        MAX_AUTHOR_LENGTH: 100,
        MIN_REFLECTION_LENGTH: 10,
        MAX_REFLECTION_LENGTH: 5000
    },
    UI: {
        DEBOUNCE_DELAY: 300,
        ANIMATION_DURATION: 300,
        TRUNCATE_LENGTH: 300
    }
};ß