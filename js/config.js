// Supabase Configuration
const SUPABASE_URL = 'https://eynpdommgdlczzibjkqv.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV5bnBkb21tZ2RsY3p6aWJqa3F2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTA0MzczNjMsImV4cCI6MjEwNjAxMzM2M30.pPLgEtaHrlV7MihUH_5F0xPV5WuyQLtkIcOJDp5TaYA';

// Initialize Supabase client
const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// Export the supabase client for use in other files
window.supabaseClient = supabaseClient;

// Global app configuration
const appConfig = {
    appName: 'NIIT School Management System',
    version: '1.0.0',
    dateFormat: 'YYYY-MM-DD',
    timeFormat: 'HH:mm:ss',
    defaultPageSize: 10,
    toastDuration: 3000, // milliseconds
    attendanceStatuses: ['Present', 'Absent', 'Late', 'Excused']
};

// Helper functions
const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
    });
};

const formatTime = (timeString) => {
    const date = new Date(timeString);
    return date.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit'
    });
};

const formatDateTime = (dateTimeString) => {
    const date = new Date(dateTimeString);
    return `${formatDate(date)} ${formatTime(date)}`;
};

const showToast = (message, type = 'success') => {
    // Check if toast container exists, if not create it
    let toastContainer = document.getElementById('toast-container');
    if (!toastContainer) {
        toastContainer = document.createElement('div');
        toastContainer.id = 'toast-container';
        toastContainer.className = 'position-fixed bottom-0 end-0 p-3';
        document.body.appendChild(toastContainer);
    }

    // Create toast element
    const toastId = `toast-${Date.now()}`;
    const toast = document.createElement('div');
    toast.className = `toast align-items-center text-white bg-${type} border-0`;
    toast.id = toastId;
    toast.setAttribute('role', 'alert');
    toast.setAttribute('aria-live', 'assertive');
    toast.setAttribute('aria-atomic', 'true');

    // Create toast content
    toast.innerHTML = `
        <div class="d-flex">
            <div class="toast-body">
                ${message}
            </div>
            <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>
        </div>
    `;

    // Add toast to container
    toastContainer.appendChild(toast);

    // Initialize and show toast
    const toastElement = new bootstrap.Toast(toast, {
        autohide: true,
        delay: appConfig.toastDuration
    });
    toastElement.show();

    // Remove toast after it's hidden
    toast.addEventListener('hidden.bs.toast', () => {
        toast.remove();
    });
};

// Export configuration and helper functions
window.appConfig = appConfig;
window.formatDate = formatDate;
window.formatTime = formatTime;
window.formatDateTime = formatDateTime;
window.showToast = showToast;
