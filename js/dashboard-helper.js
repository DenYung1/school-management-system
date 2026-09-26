// Dashboard Helper Module
// This module helps ensure the dashboard displays consistent data with the student management system

// Import functions from student-manager if available
const filterDeletedStudents = window.filterDeletedStudents || function(students) {
    return students; // Default implementation if student-manager.js is not loaded
};

// Helper function to filter deleted students from dashboard data
function filterDashboardData(data) {
    if (!data || !Array.isArray(data)) return [];
    
    try {
        return filterDeletedStudents(data);
    } catch (error) {
        console.error('Error filtering dashboard data:', error);
        return data; // Return original data on error
    }
}

// Export functions to window
window.filterDashboardData = filterDashboardData;
