// Student Manager Module - Alternative implementation for student management
// This module provides an alternative way to manage students when the standard methods fail

// Store deleted student IDs in localStorage to ensure they remain hidden
function markStudentAsDeleted(studentId) {
    try {
        // Get current list of deleted students
        let deletedStudents = JSON.parse(localStorage.getItem('deletedStudents') || '[]');
        
        // Add this student if not already in the list
        if (!deletedStudents.includes(studentId)) {
            deletedStudents.push(studentId);
            localStorage.setItem('deletedStudents', JSON.stringify(deletedStudents));
            console.log(`Student ${studentId} marked as deleted in local storage`);
        }
        
        return true;
    } catch (error) {
        console.error('Error marking student as deleted in localStorage:', error);
        return false;
    }
}

// Check if a student has been marked as deleted
function isStudentDeleted(studentId) {
    try {
        const deletedStudents = JSON.parse(localStorage.getItem('deletedStudents') || '[]');
        return deletedStudents.includes(studentId);
    } catch (error) {
        console.error('Error checking if student is deleted:', error);
        return false;
    }
}

// Filter out deleted students from an array of students
function filterDeletedStudents(students) {
    if (!students || !Array.isArray(students)) return [];
    
    try {
        const deletedStudents = JSON.parse(localStorage.getItem('deletedStudents') || '[]');
        
        // If no deleted students, return the original array
        if (deletedStudents.length === 0) return students;
        
        // Filter out deleted students
        return students.filter(student => !deletedStudents.includes(student.id));
    } catch (error) {
        console.error('Error filtering deleted students:', error);
        return students; // Return original array on error
    }
}

// Export functions to window object
window.markStudentAsDeleted = markStudentAsDeleted;
window.isStudentDeleted = isStudentDeleted;
window.filterDeletedStudents = filterDeletedStudents;
