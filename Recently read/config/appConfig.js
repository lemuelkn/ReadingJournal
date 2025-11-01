/**
 * Application Configuration
 */
 const AppConfig = {
    version: '1.0.0',
    name: 'Reading Journal',
    author: 'Your Name',
    
    storage: {
        maxEntries: 10000,
        backupFrequency: 7 // days
    },
    
    ui: {
        itemsPerPage: 20,
        animationSpeed: 300
    },
    
    export: {
        formats: ['json', 'markdown'],
        dateFormat: 'YYYY-MM-DD'
    }
};