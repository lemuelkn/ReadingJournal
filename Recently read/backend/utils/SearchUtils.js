/**
 * Search utility functions
 */
 class SearchUtils {
    static highlightMatches(text, searchTerm) {
        if (!searchTerm) return text;
        
        const regex = new RegExp(`(${searchTerm})`, 'gi');
        return text.replace(regex, '<mark>$1</mark>');
    }

    static fuzzyMatch(text, searchTerm) {
        const textLower = text.toLowerCase();
        const termLower = searchTerm.toLowerCase();
        
        // Simple fuzzy matching - can be enhanced
        return textLower.includes(termLower);
    }
}