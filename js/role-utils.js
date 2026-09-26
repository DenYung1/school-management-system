// Role Utility Functions for NIIT School Management System

/**
 * Check if the current user has admin privileges
 * @returns {Promise<boolean>} True if the user is an admin, false otherwise
 */
async function isAdmin() {
    try {
        const { data: { user }, error } = await supabase.auth.getUser();
        
        if (error) {
            throw error;
        }
        
        return user?.user_metadata?.role === 'admin';
    } catch (error) {
        console.error('Error checking admin status:', error.message);
        return false;
    }
}

/**
 * Check if the current user is a teacher
 * @returns {Promise<boolean>} True if the user is a teacher, false otherwise
 */
async function isTeacher() {
    try {
        const { data: { user }, error } = await supabase.auth.getUser();
        
        if (error) {
            throw error;
        }
        
        return user?.user_metadata?.role === 'teacher';
    } catch (error) {
        console.error('Error checking teacher status:', error.message);
        return false;
    }
}

/**
 * Check if the current user is a student
 * @returns {Promise<boolean>} True if the user is a student, false otherwise
 */
async function isStudent() {
    try {
        const { data: { user }, error } = await supabase.auth.getUser();
        
        if (error) {
            throw error;
        }
        
        return user?.user_metadata?.role === 'student';
    } catch (error) {
        console.error('Error checking student status:', error.message);
        return false;
    }
}

/**
 * Get the current user's role
 * @returns {Promise<string|null>} The user's role or null if not logged in
 */
async function getUserRole() {
    try {
        const { data: { user }, error } = await supabase.auth.getUser();
        
        if (error) {
            throw error;
        }
        
        return user?.user_metadata?.role || null;
    } catch (error) {
        console.error('Error getting user role:', error.message);
        return null;
    }
}

// Export functions for use in other modules
window.isAdmin = isAdmin;
window.isTeacher = isTeacher;
window.isStudent = isStudent;
window.getUserRole = getUserRole;
