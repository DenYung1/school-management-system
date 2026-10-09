// Settings Module for NIIT School Management System

document.addEventListener('DOMContentLoaded', function() {
    // Load notification settings
    loadNotificationSettings();
    
    // Load connected accounts
    loadConnectedAccounts();
    
    // Add event listeners
    const notificationSettingsForm = document.getElementById('notificationSettingsForm');
    if (notificationSettingsForm) {
        notificationSettingsForm.addEventListener('submit', handleSaveNotificationSettings);
    }
    
    const connectGoogleBtn = document.getElementById('connectGoogleBtn');
    if (connectGoogleBtn) {
        connectGoogleBtn.addEventListener('click', handleConnectGoogle);
    }
    
    const disconnectGoogleBtn = document.getElementById('disconnectGoogleBtn');
    if (disconnectGoogleBtn) {
        disconnectGoogleBtn.addEventListener('click', handleDisconnectGoogle);
    }
});

// Load notification settings from database
async function loadNotificationSettings() {
    try {
        // Get current user
        const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
        
        if (userError) throw userError;
        
        if (!user) {
            window.location.href = 'index.html';
            return;
        }
        
        // Get notification settings
        const { data, error } = await supabaseClient
            .from('email_notifications')
            .select('*')
            .eq('user_id', user.id);
        
        if (error) throw error;
        
        // If no settings exist, create default settings
        if (!data || data.length === 0) {
            await createDefaultNotificationSettings(user.id);
            return;
        }
        
        // Update UI with settings
        data.forEach(setting => {
            const checkbox = document.getElementById(`${setting.notification_type}Notifications`);
            if (checkbox) {
                checkbox.checked = setting.enabled;
            }
        });
    } catch (error) {
        console.error('Error loading notification settings:', error.message);
        showError('Failed to load notification settings. Please try again.');
    }
}

// Create default notification settings for a new user
async function createDefaultNotificationSettings(userId) {
    try {
        const notificationTypes = ['attendance', 'quiz', 'system'];
        
        // Create settings for each notification type
        for (const type of notificationTypes) {
            const { error } = await supabaseClient
                .from('email_notifications')
                .insert({
                    user_id: userId,
                    notification_type: type,
                    enabled: true
                });
            
            if (error) throw error;
        }
        
        // All checkboxes should be checked by default
        document.getElementById('attendanceNotifications').checked = true;
        document.getElementById('quizNotifications').checked = true;
        document.getElementById('systemNotifications').checked = true;
    } catch (error) {
        console.error('Error creating default notification settings:', error.message);
        showError('Failed to create default notification settings. Please try again.');
    }
}

// Handle saving notification settings
async function handleSaveNotificationSettings(e) {
    e.preventDefault();
    
    try {
        // Get current user
        const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
        
        if (userError) throw userError;
        
        if (!user) {
            window.location.href = 'index.html';
            return;
        }
        
        // Get form values
        const attendanceEnabled = document.getElementById('attendanceNotifications').checked;
        const quizEnabled = document.getElementById('quizNotifications').checked;
        const systemEnabled = document.getElementById('systemNotifications').checked;
        
        // Update settings for each notification type
        const notificationTypes = [
            { type: 'attendance', enabled: attendanceEnabled },
            { type: 'quiz', enabled: quizEnabled },
            { type: 'system', enabled: systemEnabled }
        ];
        
        for (const { type, enabled } of notificationTypes) {
            const { error } = await supabaseClient
                .from('email_notifications')
                .upsert({
                    user_id: user.id,
                    notification_type: type,
                    enabled
                }, {
                    onConflict: 'user_id,notification_type'
                });
            
            if (error) throw error;
        }
        
        // Show success message
        showSuccess('Notification settings saved successfully!');
    } catch (error) {
        console.error('Error saving notification settings:', error.message);
        showError(`Failed to save notification settings: ${error.message}`);
    }
}

// Load connected accounts
async function loadConnectedAccounts() {
    try {
        // Get current user
        const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
        
        if (userError) throw userError;
        
        if (!user) {
            window.location.href = 'index.html';
            return;
        }
        
        // Check if user has connected Google account
        const { data, error } = await supabaseClient
            .from('oauth_providers')
            .select('*')
            .eq('user_id', user.id)
            .eq('provider', 'google')
            .single();
        
        if (error && error.code !== 'PGRST116') { // PGRST116 is the error code for no rows returned
            throw error;
        }
        
        // Update UI based on connection status
        const connectBtn = document.getElementById('connectGoogleBtn');
        const disconnectBtn = document.getElementById('disconnectGoogleBtn');
        const statusEl = document.getElementById('googleConnectionStatus');
        const emailEl = document.getElementById('googleEmail');
        
        if (data) {
            // Google is connected
            statusEl.textContent = 'Connected';
            statusEl.classList.add('text-success');
            
            // Show disconnect button, hide connect button
            connectBtn.classList.add('d-none');
            disconnectBtn.classList.remove('d-none');
            
            // Show email if available
            if (user.email && user.app_metadata && user.app_metadata.provider === 'google') {
                emailEl.textContent = user.email;
            }
        } else {
            // Google is not connected
            statusEl.textContent = 'Not connected';
            statusEl.classList.remove('text-success');
            
            // Show connect button, hide disconnect button
            connectBtn.classList.remove('d-none');
            disconnectBtn.classList.add('d-none');
            
            // Clear email
            emailEl.textContent = '';
        }
    } catch (error) {
        console.error('Error loading connected accounts:', error.message);
        // Don't show error to user, just log it
    }
}

// Handle connecting Google account
async function handleConnectGoogle() {
    try {
        // Show loading state
        const connectBtn = document.getElementById('connectGoogleBtn');
        connectBtn.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>';
        connectBtn.disabled = true;
        
        // Link Google to the currently authenticated account.
        const { error } = await supabaseClient.auth.linkIdentity({
            provider: 'google',
            options: {
                redirectTo: window.location.origin + '/settings.html',
                queryParams: {
                    access_type: 'offline',
                    prompt: 'consent',
                }
            }
        });
        
        if (error) throw error;
        
        // The OAuth sign in will redirect the user, so we don't need to do anything else here
    } catch (error) {
        console.error('Error connecting Google account:', error.message);
        showError(`Failed to connect Google account: ${error.message}`);
        
        // Reset button state
        const connectBtn = document.getElementById('connectGoogleBtn');
        connectBtn.innerHTML = 'Connect';
        connectBtn.disabled = false;
    }
}

// Handle disconnecting Google account
async function handleDisconnectGoogle() {
    try {
        // Show loading state
        const disconnectBtn = document.getElementById('disconnectGoogleBtn');
        disconnectBtn.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>';
        disconnectBtn.disabled = true;
        
        // Get current user
        const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
        
        if (userError) throw userError;
        
        // Delete OAuth provider record
        const { error } = await supabaseClient
            .from('oauth_providers')
            .delete()
            .eq('user_id', user.id)
            .eq('provider', 'google');
        
        if (error) throw error;
        
        // Reload connected accounts
        loadConnectedAccounts();
        
        // Show success message
        showSuccess('Google account disconnected successfully!');
    } catch (error) {
        console.error('Error disconnecting Google account:', error.message);
        showError(`Failed to disconnect Google account: ${error.message}`);
    } finally {
        // Reset button state
        const disconnectBtn = document.getElementById('disconnectGoogleBtn');
        disconnectBtn.innerHTML = 'Disconnect';
        disconnectBtn.disabled = false;
    }
}

// Helper functions for showing messages
function showError(message) {
    const errorElement = document.getElementById('notificationSettingsError');
    const successElement = document.getElementById('notificationSettingsSuccess');
    
    errorElement.textContent = message;
    errorElement.classList.remove('d-none');
    successElement.classList.add('d-none');
    
    // Hide error after 5 seconds
    setTimeout(() => {
        errorElement.classList.add('d-none');
    }, 5000);
}

function showSuccess(message) {
    const errorElement = document.getElementById('notificationSettingsError');
    const successElement = document.getElementById('notificationSettingsSuccess');
    
    successElement.textContent = message;
    successElement.classList.remove('d-none');
    errorElement.classList.add('d-none');
    
    // Hide success after 5 seconds
    setTimeout(() => {
        successElement.classList.add('d-none');
    }, 5000);
}
