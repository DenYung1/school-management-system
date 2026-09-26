// Authentication Module for NIIT School Management System

document.addEventListener('DOMContentLoaded', function() {
    // Check if user is logged in
    checkAuthState();

    // Initialize sidebar toggle
    const sidebarToggle = document.getElementById('menu-toggle');
    if (sidebarToggle) {
        sidebarToggle.addEventListener('click', function(e) {
            e.preventDefault();
            document.body.classList.toggle('sb-sidenav-toggled');
        });
    }
    
    // Initialize Google login button
    const googleLoginBtn = document.getElementById('googleLoginBtn');
    if (googleLoginBtn) {
        googleLoginBtn.addEventListener('click', handleGoogleLogin);
    }

    // Initialize login form
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }
    
    // Initialize registration form
    const registerForm = document.getElementById('registerForm');
    if (registerForm) {
        registerForm.addEventListener('submit', handleRegistration);
    }
    
    // Initialize form toggle buttons
    const loginToggle = document.getElementById('loginToggle');
    const registerToggle = document.getElementById('registerToggle');
    
    if (loginToggle && registerToggle) {
        loginToggle.addEventListener('change', toggleForms);
        registerToggle.addEventListener('change', toggleForms);
    }
    
    // Initialize form toggle links
    const registerLink = document.getElementById('registerLink');
    const loginLink = document.getElementById('loginLink');
    
    if (registerLink) {
        registerLink.addEventListener('click', function(e) {
            e.preventDefault();
            document.getElementById('registerToggle').checked = true;
            toggleForms();
        });
    }
    
    if (loginLink) {
        loginLink.addEventListener('click', function(e) {
            e.preventDefault();
            document.getElementById('loginToggle').checked = true;
            toggleForms();
        });
    }

    // Google login button is already initialized above

    // Initialize logout buttons
    const logoutBtn = document.getElementById('logoutBtn');
    const navLogoutBtn = document.getElementById('navLogoutBtn');
    
    if (logoutBtn) {
        logoutBtn.addEventListener('click', handleLogout);
    }
    
    if (navLogoutBtn) {
        navLogoutBtn.addEventListener('click', handleLogout);
    }

    // Initialize forgot password link
    const forgotPasswordLink = document.getElementById('forgotPassword');
    if (forgotPasswordLink) {
        forgotPasswordLink.addEventListener('click', handleForgotPassword);
    }
});

// Check authentication state
async function checkAuthState() {
    try {
        // First check if there's a session
        const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
            console.error('Session error:', sessionError.message);
            // Clear any invalid session data
            await supabase.auth.signOut();
            throw sessionError;
        }
        
        // If no session, user is not logged in
        if (!sessionData.session) {
            handleNotLoggedIn();
            return;
        }
        
        // If we have a session, get the user
        const { data: { user }, error } = await supabase.auth.getUser();
        
        if (error) {
            throw error;
        }

        if (user) {
            // User is logged in
            const currentPage = window.location.pathname.split('/').pop();
            
            // If user logged in with OAuth provider, store provider info
            if (user.app_metadata && user.app_metadata.provider) {
                await storeOAuthProviderInfo(user);
            }
            
            // Update UI with user info
            updateUserInfo(user);
            
            // Redirect to dashboard if on login page
            if (currentPage === '' || currentPage === 'index.html') {
                window.location.href = 'dashboard.html';
            }
        } else {
            // User is not logged in
            const currentPage = window.location.pathname.split('/').pop();
            
            // Redirect to login page if not already there
            if (currentPage !== '' && currentPage !== 'index.html') {
                window.location.href = 'index.html';
            }
        }
    } catch (error) {
        console.error('Error checking auth state:', error.message);
        // Handle error (e.g., show toast)
        showToast(error.message, 'danger');
    }
}

// Handle login form submission
async function handleLogin(e) {
    e.preventDefault();
    
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const loginError = document.getElementById('loginError');
    
    // Validate input
    if (!email || !password) {
        loginError.textContent = 'Please enter both email and password';
        loginError.classList.remove('d-none');
        return;
    }
    
    try {
        // Clear previous error
        loginError.classList.add('d-none');
        
        // Show loading state
        const submitBtn = e.target.querySelector('button[type="submit"]');
        submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Signing in...';
        submitBtn.disabled = true;
        
        console.log('Attempting to sign in with:', email);
        
        // Sign in with Supabase
        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password
        });
        
        if (error) {
            throw error;
        }
        
        console.log('Login successful:', data);
        
        // Successful login
        window.location.href = 'dashboard.html';
    } catch (error) {
        console.error('Login error:', error);
        
        let errorMessage = error.message;
        
        // Handle specific error cases
        if (error.status === 400) {
            if (error.message.includes('Invalid login credentials')) {
                errorMessage = 'Invalid email or password. Please try again.';
            } else if (error.message.includes('Email not confirmed')) {
                errorMessage = 'Please confirm your email before logging in.';
            }
        }
        
        // Show error message
        loginError.textContent = errorMessage;
        loginError.classList.remove('d-none');
        
        // Reset button
        const submitBtn = e.target.querySelector('button[type="submit"]');
        submitBtn.innerHTML = 'Sign In';
        submitBtn.disabled = false;
        
        // Suggest creating an account if user doesn't exist
        if (error.message.includes('Invalid login credentials')) {
            // Check if we have a registration link
            const registerLink = document.getElementById('registerLink');
            if (registerLink) {
                registerLink.classList.add('animate__animated', 'animate__pulse');
            }
        }
    }
}

// Handle logout
async function handleLogout(e) {
    e.preventDefault();
    
    try {
        const { error } = await supabase.auth.signOut();
        
        if (error) {
            throw error;
        }
        
        // Redirect to login page
        window.location.href = 'index.html';
    } catch (error) {
        console.error('Logout error:', error.message);
        showToast(error.message, 'danger');
    }
}

// Handle Google login
async function handleGoogleLogin() {
    try {
        // Show loading state on the button
        const googleLoginBtn = document.getElementById('googleLoginBtn');
        googleLoginBtn.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Connecting...';
        googleLoginBtn.disabled = true;
        
        // Clear any previous error messages
        const loginError = document.getElementById('loginError');
        if (loginError) {
            loginError.classList.add('d-none');
        }
        
        // Sign in with Google using Supabase Auth
        const { data: _data, error } = await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
                redirectTo: window.location.origin + '/dashboard.html',
                queryParams: {
                    access_type: 'offline',
                    prompt: 'consent',
                }
            }
        });
        
        if (error) throw error;
        
        // The OAuth sign in will redirect the user, so we don't need to do anything else here
    } catch (error) {
        console.error('Error signing in with Google:', error.message);
        
        // Show error message
        const loginError = document.getElementById('loginError');
        if (loginError) {
            loginError.textContent = 'Failed to connect to Google. Please try again.';
            loginError.classList.remove('d-none');
        } else {
            alert(`Error signing in with Google: ${error.message}`);
        }
        
        // Reset button state
        const googleLoginBtn = document.getElementById('googleLoginBtn');
        googleLoginBtn.innerHTML = '<img src="https://upload.wikimedia.org/wikipedia/commons/5/53/Google_%22G%22_Logo.svg" alt="Google" width="20" height="20" class="me-2">Sign in with Google';
        googleLoginBtn.disabled = false;
    }
}

// Handle forgot password
async function handleForgotPassword(e) {
    e.preventDefault();
    
    const email = document.getElementById('email').value;
    
    if (!email) {
        showToast('Please enter your email address', 'warning');
        return;
    }
    
    try {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: window.location.origin + '/reset-password.html',
        });
        
        if (error) {
            throw error;
        }
        
        showToast('Password reset email sent. Please check your inbox.', 'success');
    } catch (error) {
        console.error('Forgot password error:', error.message);
        showToast(error.message, 'danger');
    }
}

// Update UI with user information
function updateUserInfo(user) {
    const userNameElements = document.querySelectorAll('#userName');
    
    if (userNameElements.length > 0) {
        const displayName = user.user_metadata?.full_name || user.email.split('@')[0];
        
        userNameElements.forEach(element => {
            element.textContent = displayName;
        });
    }
}

// Check if the current user has admin privileges
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

// Handle not logged in state
function handleNotLoggedIn() {
    // User is not logged in
    const currentPage = window.location.pathname.split('/').pop();
    
    // Redirect to login page if not already there
    if (currentPage !== '' && currentPage !== 'index.html') {
        window.location.href = 'index.html';
    }
}

// Toggle between login and registration forms
function toggleForms() {
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    const loginToggle = document.getElementById('loginToggle');
    
    // Hide all alerts
    document.getElementById('loginError').classList.add('d-none');
    document.getElementById('registerError').classList.add('d-none');
    document.getElementById('registerSuccess').classList.add('d-none');
    
    if (loginToggle.checked) {
        // Show login form, hide registration form
        loginForm.classList.remove('d-none');
        registerForm.classList.add('d-none');
    } else {
        // Show registration form, hide login form
        loginForm.classList.add('d-none');
        registerForm.classList.remove('d-none');
    }
}

// Handle user registration
async function handleRegistration(e) {
    e.preventDefault();
    
    const fullName = document.getElementById('regFullName').value;
    const email = document.getElementById('regEmail').value;
    const password = document.getElementById('regPassword').value;
    const confirmPassword = document.getElementById('regConfirmPassword').value;
    // We no longer use the role from the form for security reasons
    const registerError = document.getElementById('registerError');
    const registerSuccess = document.getElementById('registerSuccess');
    
    // Hide previous messages
    registerError.classList.add('d-none');
    registerSuccess.classList.add('d-none');
    
    // Validate input
    if (!fullName || !email || !password || !confirmPassword) {
        registerError.textContent = 'Please fill in all fields';
        registerError.classList.remove('d-none');
        return;
    }
    
    // Check if this is the first user (who will be an admin)
    // We'll do this by checking if there are any existing users
    let secureRole = 'student'; // Default role
    
    try {
        const { count, error } = await supabase
            .from('profiles')
            .select('*', { count: 'exact', head: true });
            
        if (error) throw error;
        
        // If there are no users yet, make this user an admin
        if (count === 0) {
            secureRole = 'admin';
            console.log('First user detected - assigning admin role');
        }
    } catch (err) {
        console.error('Error checking if first user:', err);
        // Continue with student role if there's an error
    }
    
    if (password.length < 6) {
        registerError.textContent = 'Password must be at least 6 characters long';
        registerError.classList.remove('d-none');
        return;
    }
    
    if (password !== confirmPassword) {
        registerError.textContent = 'Passwords do not match';
        registerError.classList.remove('d-none');
        return;
    }
    
    try {
        // Show loading state
        const submitBtn = e.target.querySelector('button[type="submit"]');
        submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Creating Account...';
        submitBtn.disabled = true;
        
        // Register user with Supabase
        const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: {
                    full_name: fullName,
                    role: secureRole // Always use the secure role (student) for new registrations
                }
            }
        });
        
        if (error) {
            throw error;
        }
        
        console.log('Registration successful:', data);
        
        // Show success message
        registerSuccess.classList.remove('d-none');
        
        // Reset form
        document.getElementById('registerForm').reset();
        
        // Switch to login form after 3 seconds
        setTimeout(() => {
            document.getElementById('loginToggle').checked = true;
            toggleForms();
        }, 3000);
        
    } catch (error) {
        console.error('Registration error:', error);
        
        // Show error message
        registerError.textContent = error.message;
        registerError.classList.remove('d-none');
    } finally {
        // Reset button
        const submitBtn = e.target.querySelector('button[type="submit"]');
        submitBtn.innerHTML = 'Create Account';
        submitBtn.disabled = false;
    }
}

// Export functions for use in other modules

// Store OAuth provider information in our custom table - called in checkAuthState
async function storeOAuthProviderInfo(user) {
    if (!user || !user.app_metadata || !user.app_metadata.provider) return;
    
    try {
        // Get the provider from user metadata
        let provider = user.app_metadata.provider;
        
        // Check if the provider is one of the allowed values in our database
        // According to the schema, only 'google', 'facebook', and 'github' are allowed
        const validProviders = ['google', 'facebook', 'github'];
        
        // If the provider is not valid, log it and return early
        if (!validProviders.includes(provider)) {
            console.log(`Provider '${provider}' is not supported in the oauth_providers table. Skipping record creation.`);
            return;
        }
        
        // Check if provider record already exists
        const { data, error } = await supabase
            .from('oauth_providers')
            .select('*')
            .eq('user_id', user.id)
            .eq('provider', provider)
            .single();
        
        if (error && error.code !== 'PGRST116') { // PGRST116 is the error code for no rows returned
            throw error;
        }
        
        // If record doesn't exist, create it
        if (!data) {
            const { error: insertError } = await supabase
                .from('oauth_providers')
                .insert({
                    user_id: user.id,
                    provider: provider,
                    provider_id: user.app_metadata.provider_id || user.id
                });
            
            if (insertError) throw insertError;
        }
    } catch (error) {
        console.error('Error storing OAuth provider info:', error.message);
    }
}
// Export functions for use in other modules
window.isAdmin = isAdmin;
window.handleGoogleLogin = handleGoogleLogin; // Export Google login handler
