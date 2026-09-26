// Utility functions for NIIT School Management System

// Only define these functions if they don't already exist

// Format date function
if (typeof window.formatDate !== 'function') {
    /**
     * Format a date string to a readable format
     * @param {string} dateString - The date string to format
     * @returns {string} Formatted date string
     */
    window.formatDate = function(dateString) {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
    };
}

// Capitalize first letter function
if (typeof window.capitalizeFirstLetter !== 'function') {
    /**
     * Capitalize the first letter of a string
     * @param {string} string - The string to capitalize
     * @returns {string} Capitalized string
     */
    window.capitalizeFirstLetter = function(string) {
        if (!string) return '';
        return string.charAt(0).toUpperCase() + string.slice(1);
    };
}
