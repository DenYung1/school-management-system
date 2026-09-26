// Mobile Responsiveness Enhancements for NIIT School Management System

document.addEventListener('DOMContentLoaded', function() {
    // Apply mobile-friendly table classes
    makeTablesMobileResponsive();
    
    // Enhance sidebar behavior on mobile
    enhanceMobileSidebar();
    
    // Add responsive resize handler
    window.addEventListener('resize', handleResponsiveResize);
    
    // Initial check
    handleResponsiveResize();
});

// Make tables mobile-responsive
function makeTablesMobileResponsive() {
    const tables = document.querySelectorAll('.table:not(.dataTable)');
    
    tables.forEach(table => {
        // Add responsive class
        table.classList.add('table-mobile-stack');
        
        // Add data-label attributes for mobile view
        const headerCells = table.querySelectorAll('thead th');
        const headerTexts = Array.from(headerCells).map(th => th.textContent.trim());
        
        const bodyRows = table.querySelectorAll('tbody tr');
        bodyRows.forEach(row => {
            const cells = row.querySelectorAll('td');
            cells.forEach((cell, index) => {
                if (index < headerTexts.length) {
                    cell.setAttribute('data-label', headerTexts[index]);
                }
            });
        });
    });
}

// Enhance sidebar behavior on mobile
function enhanceMobileSidebar() {
    const sidebarToggle = document.getElementById('menu-toggle');
    const sidebar = document.getElementById('sidebar-wrapper');
    
    if (!sidebarToggle || !sidebar) return;
    
    // Create overlay for mobile
    let overlay = document.getElementById('sidebar-overlay');
    if (!overlay) {
        overlay = document.createElement('div');
        overlay.id = 'sidebar-overlay';
        overlay.style.position = 'fixed';
        overlay.style.top = '0';
        overlay.style.left = '0';
        overlay.style.width = '100%';
        overlay.style.height = '100%';
        overlay.style.backgroundColor = 'rgba(0,0,0,0.4)';
        overlay.style.zIndex = '1045';
        overlay.style.display = 'none';
        document.body.appendChild(overlay);
    }
    
    // Simple toggle function
    function toggleSidebar() {
        document.body.classList.toggle('sb-sidenav-toggled');
        
        // Show/hide overlay based on sidebar state
        if (window.innerWidth < 768) {
            if (document.body.classList.contains('sb-sidenav-toggled')) {
                overlay.style.display = 'block';
            } else {
                overlay.style.display = 'none';
            }
        }
    }
    
    // Close sidebar when clicking overlay
    overlay.addEventListener('click', function() {
        document.body.classList.remove('sb-sidenav-toggled');
        this.style.display = 'none';
    });
    
    // Toggle sidebar when clicking menu button
    sidebarToggle.addEventListener('click', function(e) {
        e.preventDefault();
        toggleSidebar();
    });
}

// Handle responsive behavior on resize
function handleResponsiveResize() {
    const isMobile = window.innerWidth < 768;
    const overlay = document.getElementById('sidebar-overlay');
    
    // Handle overlay visibility on resize
    if (overlay) {
        if (isMobile && document.body.classList.contains('sb-sidenav-toggled')) {
            // Show overlay on mobile if sidebar is open
            overlay.style.display = 'block';
        } else {
            // Hide overlay otherwise
            overlay.style.display = 'none';
        }
    }
    
    // Adjust DataTables responsive behavior
    adjustDataTablesResponsive();
}

// Adjust DataTables for better mobile experience
function adjustDataTablesResponsive() {
    if ($.fn.dataTable) {
        $('.dataTable').each(function() {
            const table = $(this).DataTable();
            if (table) {
                table.columns.adjust().responsive.recalc();
            }
        });
    }
}
