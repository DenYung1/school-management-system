// Dashboard Helper Module
// This module helps ensure the dashboard displays consistent data with the student management system

// Import functions from student-manager if available

// Helper function to filter deleted students from dashboard data
function filterDashboardData(data) {
    if (!data || !Array.isArray(data)) return [];
    
    try {
        const filter = window.filterDeletedStudents;
        return typeof filter === 'function'
            ? filter(data)
            : data;
    } catch (error) {
        console.error('Error filtering dashboard data:', error);
        return data; // Return original data on error
    }
}

// Export functions to window
window.filterDashboardData = filterDashboardData;
