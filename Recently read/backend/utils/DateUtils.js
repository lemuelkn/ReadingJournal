/**
 * Date utility functions
 */
 class DateUtils {
    static formatForDisplay(dateString) {
        return new Date(dateString).toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    }

    static formatForFilename(dateString = null) {
        const date = dateString ? new Date(dateString) : new Date();
        return date.toISOString().split('T')[0]; // YYYY-MM-DD
    }

    static getRelativeTime(dateString) {
        const date = new Date(dateString);
        const now = new Date();
        const diffInSeconds = Math.floor((now - date) / 1000);

        if (diffInSeconds < 60) return 'just now';
        if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`;
        if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
        if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)} days ago`;
        
        return this.formatForDisplay(dateString);
    }

    static isThisWeek(dateString) {
        const date = new Date(dateString);
        const now = new Date();
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        
        return date >= weekAgo && date <= now;
    }

    static getWeekRange() {
        const now = new Date();
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        
        return {
            start: weekAgo.toISOString(),
            end: now.toISOString()
        };
    }
}