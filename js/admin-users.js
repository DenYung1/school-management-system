// Admin Users Management Module for NIIT School Management System

// Fallback definitions for utility functions in case utils.js hasn't loaded properly
if (typeof capitalizeFirstLetter !== 'function') {
    window.capitalizeFirstLetter = function(string) {
        if (!string) return '';
        return string.charAt(0).toUpperCase() + string.slice(1);
    };
}

if (typeof formatDate !== 'function') {
    window.formatDate = function(dateString) {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
    };
}

document.addEventListener('DOMContentLoaded', async function() {
    // Check if user is logged in and is an admin
    await checkAdminAccess();
    
    // Set up proper focus management for modals
    setupModalAccessibility();

    // Initialize logout buttons
    const logoutBtn = document.getElementById('logoutBtn');
    const navLogoutBtn = document.getElementById('navLogoutBtn');
    
    if (logoutBtn) {
        logoutBtn.addEventListener('click', handleLogout);
    }
    
    if (navLogoutBtn) {
        navLogoutBtn.addEventListener('click', handleLogout);
    }

    // Initialize save role button
    const saveRoleBtn = document.getElementById('saveRoleBtn');
    if (saveRoleBtn) {
        saveRoleBtn.addEventListener('click', handleRoleChange);
    }
    
    // Initialize add user button
    const saveNewUserBtn = document.getElementById('saveNewUserBtn');
    if (saveNewUserBtn) {
        saveNewUserBtn.addEventListener('click', handleAddUser);
    }
    
    // Initialize delete user button
    const confirmDeleteUserBtn = document.getElementById('confirmDeleteUserBtn');
    if (confirmDeleteUserBtn) {
        confirmDeleteUserBtn.addEventListener('click', handleDeleteUser);
    }
});

// Check if the current user is an admin
async function checkAdminAccess() {
    try {
        const adminStatus = await isAdmin();
        
        if (!adminStatus) {
            // User is not an admin, show warning and hide admin content
            document.getElementById('adminOnlyWarning').classList.remove('d-none');
            document.getElementById('adminContent').classList.add('d-none');
            return;
        }
        
        // User is an admin, show admin content and hide warning
        document.getElementById('adminOnlyWarning').classList.add('d-none');
        document.getElementById('adminContent').classList.remove('d-none');
        
        // Load users data
        await loadUsers();
        
    } catch (error) {
        console.error('Error checking admin access:', error.message);
        // Show error message
        document.getElementById('adminOnlyWarning').classList.remove('d-none');
        document.getElementById('adminContent').classList.add('d-none');
    }
}

// Load all users from the database
async function loadUsers() {
    try {
        console.log('Loading users...');
        
        // Get all users from the profiles table
        console.log('Querying profiles table...');
        
        const { data: users, error } = await supabaseClient
            .from('profiles')
            .select('id, full_name, role, created_at')
            .order('created_at', { ascending: false });
        
        console.log('Query result:', { users, error });
        
        if (error) {
            // Check if the error is because the table doesn't exist
            if (error.message.includes('relation "profiles" does not exist')) {
                // Show error in the table
                const usersTableBody = document.getElementById('usersTableBody');
                usersTableBody.innerHTML = `<tr><td colspan="5" class="text-center text-danger">
                    <p>The profiles table does not exist in your database.</p>
                    <p>Please run the SQL script in db/create_profiles_table.sql to create it.</p>
                </td></tr>`;
                return;
            }
            throw error;
        }
        
        // Clear loading message
        const usersTableBody = document.getElementById('usersTableBody');
        usersTableBody.innerHTML = '';
        
        // Destroy existing DataTable if it exists
        if ($.fn.DataTable.isDataTable('#usersTable')) {
            $('#usersTable').DataTable().destroy();
        }
        
        // Initialize a fresh DataTable
        const dataTable = $('#usersTable').DataTable({
            pageLength: 10,
            responsive: true,
            language: {
                search: "_INPUT_",
                searchPlaceholder: "Search users..."
            }
        });
        
        // Add users to the table
        if (users && users.length > 0) {
            users.forEach(user => {
                const row = [
                    user.full_name || 'N/A',
                    'Managed in Supabase Auth',
                    capitalizeFirstLetter(user.role) || 'Student',
                    formatDate(user.created_at) || 'Unknown',
                    `<div class="btn-group">
                        <button class="btn btn-sm btn-primary change-role-btn me-1" data-id="${user.id}" data-name="${user.full_name}" data-email="${user.email}" data-role="${user.role}">
                            <i class="fas fa-user-edit"></i> Change Role
                        </button>
                        <button class="btn btn-sm btn-danger delete-user-btn" data-id="${user.id}" data-name="${user.full_name}" data-email="${user.email}">
                            <i class="fas fa-trash"></i> Delete
                        </button>
                    </div>`
                ];
                
                dataTable.row.add(row);
            });
            
            dataTable.draw();
            
            // Attach event listeners to buttons
            attachEventListeners();
        } else {
            // No users found
            dataTable.row.add(['No users found', '', '', '', '']);
            dataTable.draw();
        }
        
    } catch (error) {
        console.error('Error loading users:', error.message);
        // Show error message
        const usersTableBody = document.getElementById('usersTableBody');
        usersTableBody.innerHTML = `<tr><td colspan="5" class="text-center text-danger">Error loading users: ${error.message}</td></tr>`;
    }
}

// Handle role change
async function handleRoleChange() {
    try {
        // Show loading state
        const saveBtn = document.getElementById('saveRoleBtn');
        saveBtn.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Saving...';
        saveBtn.disabled = true;
        
        // Get form data
        const userId = document.getElementById('userId').value;
        const newRole = document.getElementById('userRole').value;
        
        // Update user role in the profiles table
        const { error: updateError } = await supabaseClient
            .from('profiles')
            .update({ role: newRole })
            .eq('id', userId);
        
        if (updateError) {
            throw updateError;
        }
        
        // Show success message
        const successMsg = document.getElementById('userManagementSuccess');
        const errorMsg = document.getElementById('userManagementError');
        
        successMsg.classList.remove('d-none');
        errorMsg.classList.add('d-none');
        
        // Hide success message after 3 seconds
        setTimeout(() => {
            successMsg.classList.add('d-none');
        }, 3000);
        
        // Close modal
        const modal = bootstrap.Modal.getInstance(document.getElementById('changeRoleModal'));
        modal.hide();
        
        // Reload users table
        await loadUsers();
        
    } catch (error) {
        console.error('Error updating user role:', error.message);
        
        // Show error message
        const errorMsg = document.getElementById('userManagementError');
        errorMsg.textContent = `Error updating user role: ${error.message}`;
        errorMsg.classList.remove('d-none');
        
        // Hide error message after 5 seconds
        setTimeout(() => {
            errorMsg.classList.add('d-none');
        }, 5000);
    } finally {
        // Reset button
        const saveBtn = document.getElementById('saveRoleBtn');
        saveBtn.innerHTML = 'Save Changes';
        saveBtn.disabled = false;
    }
}

// Helper functions moved to utils.js

// Function to attach event listeners to table buttons
function attachEventListeners() {
    // Add event listeners to change role buttons
    document.querySelectorAll('.change-role-btn').forEach(button => {
        button.addEventListener('click', function() {
            const userId = this.getAttribute('data-id');
            const userName = this.getAttribute('data-name');
            const userEmail = this.getAttribute('data-email');
            const userRole = this.getAttribute('data-role');
            
            // Populate modal with user data
            document.getElementById('userId').value = userId;
            document.getElementById('modalUserName').value = userName;
            document.getElementById('modalUserEmail').value = userEmail;
            document.getElementById('userRole').value = userRole || 'student';
            
            // Show modal
            const modal = new bootstrap.Modal(document.getElementById('changeRoleModal'));
            modal.show();
        });
    });
    
    // Add event listeners to delete user buttons
    document.querySelectorAll('.delete-user-btn').forEach(button => {
        button.addEventListener('click', function() {
            const userId = this.getAttribute('data-id');
            const userName = this.getAttribute('data-name');
            const userEmail = this.getAttribute('data-email');
            
            // Populate delete confirmation modal with user data
            document.getElementById('deleteUserId').value = userId;
            document.getElementById('deleteUserName').textContent = userName || 'this user';
            document.getElementById('deleteUserEmail').textContent = userEmail || '';
            
            // Show modal
            const modal = new bootstrap.Modal(document.getElementById('deleteUserModal'));
            modal.show();
        });
    });
}

// Handle deleting a user
async function handleDeleteUser() {
    try {
        // Show loading state
        const deleteBtn = document.getElementById('confirmDeleteUserBtn');
        deleteBtn.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Deleting...';
        deleteBtn.disabled = true;
        
        // Clear previous error messages
        const errorMsg = document.getElementById('deleteUserError');
        errorMsg.classList.add('d-none');
        
        // Get user ID from hidden input
        const userId = document.getElementById('deleteUserId').value;
        const userName = document.getElementById('deleteUserName').textContent;
        
        if (!userId) {
            throw new Error('User ID is missing');
        }
        
        console.log('Deleting user with ID:', userId);
        
        // Now that we have delete permission, we can directly delete the user
        const { error: deleteError } = await supabaseClient.functions.invoke('delete-user', {
            body: { userId }
        });

        if (deleteError) {
            console.error('Error deleting user:', deleteError);
            throw new Error(`Could not delete user: ${deleteError.message}`);
        }
        
        // Show success message
        const successMsg = document.getElementById('userManagementSuccess');
        successMsg.textContent = `User "${userName}" deleted successfully!`;
        successMsg.classList.remove('d-none');
        
        // Hide success message after 3 seconds
        setTimeout(() => {
            successMsg.classList.add('d-none');
        }, 3000);
        
        // Close modal
        const modal = bootstrap.Modal.getInstance(document.getElementById('deleteUserModal'));
        modal.hide();
        
        // Instead of calling loadUsers, let's manually refresh the table
        try {
            // Get fresh data from the database
            // Filter out users whose names start with [DELETED] since we don't have an is_deleted column
            const { data: freshUsers, error: fetchError } = await supabaseClient
                .from('profiles')
                .select('id, full_name, email, role, last_sign_in_at, created_at')
                .not('full_name', 'like', '[DELETED]%')
                .order('created_at', { ascending: false });
                
            if (fetchError) throw fetchError;
            
            // Destroy existing DataTable
            if ($.fn.DataTable.isDataTable('#usersTable')) {
                $('#usersTable').DataTable().destroy();
            }
            
            // Clear the table body
            const usersTableBody = document.getElementById('usersTableBody');
            usersTableBody.innerHTML = '';
            
            // Initialize a fresh DataTable
            const dataTable = $('#usersTable').DataTable({
                pageLength: 10,
                responsive: true,
                language: {
                    search: "_INPUT_",
                    searchPlaceholder: "Search users..."
                }
            });
            
            // Add users to the table
            if (freshUsers && freshUsers.length > 0) {
                freshUsers.forEach(user => {
                    const row = [
                        user.full_name || 'N/A',
                        user.email || 'N/A',
                        capitalizeFirstLetter(user.role) || 'Student',
                        formatDate(user.last_sign_in_at) || 'Never',
                        `<div class="btn-group">
                            <button class="btn btn-sm btn-primary change-role-btn me-1" data-id="${user.id}" data-name="${user.full_name}" data-email="${user.email}" data-role="${user.role}">
                                <i class="fas fa-user-edit"></i> Change Role
                            </button>
                            <button class="btn btn-sm btn-danger delete-user-btn" data-id="${user.id}" data-name="${user.full_name}" data-email="${user.email}">
                                <i class="fas fa-trash"></i> Delete
                            </button>
                        </div>`
                    ];
                    
                    dataTable.row.add(row);
                });
                
                dataTable.draw();
                
                // Re-attach event listeners
                attachEventListeners();
            } else {
                // No users found
                dataTable.row.add(['No users found', '', '', '', '']);
                dataTable.draw();
            }
        } catch (refreshError) {
            console.error('Error refreshing users table:', refreshError);
        }
        
    } catch (error) {
        console.error('Error deleting user:', error.message);
        
        // Show error message
        const errorMsg = document.getElementById('deleteUserError');
        errorMsg.textContent = `Error deleting user: ${error.message}`;
        errorMsg.classList.remove('d-none');
    } finally {
        // Reset button
        const deleteBtn = document.getElementById('confirmDeleteUserBtn');
        deleteBtn.innerHTML = 'Delete User';
        deleteBtn.disabled = false;
    }
}

// Set up proper focus management for modals to improve accessibility
function setupModalAccessibility() {
    // Add User Modal accessibility
    const addUserModal = document.getElementById('addUserModal');
    if (addUserModal) {
        // Store the element that had focus before the modal was opened
        let previouslyFocusedElement;
        
        // When the modal is about to be shown
        addUserModal.addEventListener('show.bs.modal', function() {
            // Store the current active element
            previouslyFocusedElement = document.activeElement;
        });
        
        // When the modal is fully shown
        addUserModal.addEventListener('shown.bs.modal', function() {
            // Focus the first input field
            const firstInput = addUserModal.querySelector('input');
            if (firstInput) {
                firstInput.focus();
            }
        });
        
        // When the modal is hidden
        addUserModal.addEventListener('hidden.bs.modal', function() {
            // Return focus to the element that had focus before the modal was opened
            if (previouslyFocusedElement) {
                previouslyFocusedElement.focus();
            }
        });
    }
    
    // Change Role Modal accessibility
    const changeRoleModal = document.getElementById('changeRoleModal');
    if (changeRoleModal) {
        // Store the element that had focus before the modal was opened
        let previouslyFocusedElement;
        
        // When the modal is about to be shown
        changeRoleModal.addEventListener('show.bs.modal', function() {
            // Store the current active element
            previouslyFocusedElement = document.activeElement;
        });
        
        // When the modal is fully shown
        changeRoleModal.addEventListener('shown.bs.modal', function() {
            // Focus the role select field
            const roleSelect = document.getElementById('userRole');
            if (roleSelect) {
                roleSelect.focus();
            }
        });
        
        // When the modal is hidden
        changeRoleModal.addEventListener('hidden.bs.modal', function() {
            // Return focus to the element that had focus before the modal was opened
            if (previouslyFocusedElement) {
                previouslyFocusedElement.focus();
            }
        });
    }
}

// Handle adding a new user
async function handleAddUser() {
    try {
        // Show loading state
        const saveBtn = document.getElementById('saveNewUserBtn');
        saveBtn.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Creating User...';
        saveBtn.disabled = true;
        
        // Clear previous error messages
        const errorMsg = document.getElementById('addUserError');
        errorMsg.classList.add('d-none');
        
        // Get form data
        const fullName = document.getElementById('newUserFullName').value;
        const email = document.getElementById('newUserEmail').value;
        const password = document.getElementById('newUserPassword').value;
        const role = document.getElementById('newUserRole').value;
        
        // Validate input
        if (!fullName || !email || !password || !role) {
            errorMsg.textContent = 'Please fill in all fields';
            errorMsg.classList.remove('d-none');
            return;
        }
        
        if (password.length < 6) {
            errorMsg.textContent = 'Password must be at least 6 characters long';
            errorMsg.classList.remove('d-none');
            return;
        }
        
        // Skip admin API and use regular signup directly
        console.log('Creating user with regular signup...');
        const { data: signupData, error: signupError } = await supabaseClient.auth.signUp({
            email,
            password,
            options: {
                data: {
                    full_name: fullName,
                    role: role
                }
            }
        });
        
        if (signupError) {
            throw signupError;
        }
        
        console.log('User signup successful:', signupData);
        
        // Show success message
        const successMsg = document.getElementById('userManagementSuccess');
        successMsg.textContent = 'User created successfully! A confirmation email has been sent.';
        successMsg.classList.remove('d-none');
        
        // Hide success message after 3 seconds
        setTimeout(() => {
            successMsg.classList.add('d-none');
        }, 3000);
        
        // Close modal
        const modal = bootstrap.Modal.getInstance(document.getElementById('addUserModal'));
        modal.hide();
        
        // Reset form
        document.getElementById('addUserForm').reset();
        
        // Reload users table
        await loadUsers();
        
    } catch (error) {
        console.error('Error creating user:', error.message);
        
        // Show error message
        const errorMsg = document.getElementById('addUserError');
        errorMsg.textContent = `Error creating user: ${error.message}`;
        errorMsg.classList.remove('d-none');
    } finally {
        // Reset button
        const saveBtn = document.getElementById('saveNewUserBtn');
        saveBtn.innerHTML = 'Create User';
        saveBtn.disabled = false;
    }
}
