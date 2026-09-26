// Dashboard Module for JIT NIIT Authorized Training Center

document.addEventListener('DOMContentLoaded', function() {
    // Initialize dashboard
    initializeDashboard();
});

// Initialize dashboard
async function initializeDashboard() {
    try {
        // Check if user is admin and show/hide admin links
        await checkAndSetupAdminFeatures();
        
        // Fetch dashboard data
        await Promise.all([
            fetchDashboardStats(),
            fetchRecentRegistrations(),
            loadAttendanceSummary(),
            loadCourseEnrollmentTable()
        ]);
    } catch (error) {
        console.error('Error initializing dashboard:', error.message);
        showToast('Error loading dashboard data', 'danger');
    }
}

// Check if user is admin and setup admin features
async function checkAndSetupAdminFeatures() {
    try {
        // Use the isAdmin function from auth.js
        const adminStatus = await isAdmin();
        
        // Show/hide admin-only links based on user role
        const adminUsersLink = document.getElementById('adminUsersLink');
        if (adminUsersLink) {
            if (adminStatus) {
                adminUsersLink.classList.remove('d-none');
            } else {
                adminUsersLink.classList.add('d-none');
            }
        }
    } catch (error) {
        console.error('Error checking admin status:', error.message);
    }
}

// Fetch dashboard statistics
async function fetchDashboardStats() {
    try {
        console.log('Fetching dashboard statistics...');
        
        // Try to clear cache for students table
        try {
            await supabase.rest.cache.purgeCache({
                table: 'students'
            });
            console.log('Cache purged for students table');
        } catch (cacheError) {
            console.warn('Cache purge not supported or failed:', cacheError);
        }
        
        // Fetch all students to filter deleted ones
        const { data: studentsData, error: studentsError } = await supabase
            .from('students')
            .select('id');
        
        if (studentsError) {
            console.error('Error fetching students data:', studentsError);
            throw studentsError;
        }
        
        // Filter out deleted students if the filter function exists
        let filteredStudents = studentsData;
        if (window.filterDeletedStudents) {
            filteredStudents = window.filterDeletedStudents(studentsData);
            console.log(`Filtered out ${studentsData.length - filteredStudents.length} deleted students`);
        }
        
        // Use the filtered count
        const studentsCount = filteredStudents.length;
        console.log('Filtered students count:', studentsCount);
        
        // Fetch total courses count
        const { count: coursesCount, error: coursesError } = await supabase
            .from('courses')
            .select('*', { count: 'exact', head: true })
            .limit(1);
        
        if (coursesError) {
            console.error('Error fetching courses count:', coursesError);
            throw coursesError;
        }
        
        // Fetch attendance data for rate calculation
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        const thirtyDaysAgoIso = thirtyDaysAgo.toISOString();
        
        const { data: attendanceData, error: attendanceError } = await supabase
            .from('attendance')
            .select('status')
            .gte('date', thirtyDaysAgoIso);
        
        if (attendanceError) {
            console.error('Error fetching attendance data:', attendanceError);
            throw attendanceError;
        }
        
        // Calculate attendance rate
        let attendanceRate = 0;
        if (attendanceData && attendanceData.length > 0) {
            const presentCount = attendanceData.filter(record => record.status === 'Present').length;
            attendanceRate = Math.round((presentCount / attendanceData.length) * 100);
        }
        
        // Fetch new registrations (last 7 days)
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        const sevenDaysAgoIso = sevenDaysAgo.toISOString();
        
        const { data: newRegistrationsData, error: regError } = await supabase
            .from('students')
            .select('id')
            .gte('created_at', sevenDaysAgoIso);
        
        if (regError) {
            console.error('Error fetching new registrations:', regError);
            throw regError;
        }
        
        // Filter out deleted students from new registrations
        let filteredNewRegistrations = newRegistrationsData;
        if (window.filterDeletedStudents) {
            filteredNewRegistrations = window.filterDeletedStudents(newRegistrationsData);
            console.log(`Filtered out ${newRegistrationsData.length - filteredNewRegistrations.length} deleted students from new registrations`);
        }
        
        // Use the filtered count
        const newRegistrationsCount = filteredNewRegistrations.length;
        
        // Update UI with stats
        document.getElementById('totalStudents').textContent = studentsCount || 0;
        document.getElementById('totalCourses').textContent = coursesCount || 0;
        document.getElementById('attendanceRate').textContent = `${attendanceRate}%`;
        document.getElementById('newRegistrations').textContent = newRegistrationsCount || 0;
        
        console.log('Dashboard statistics updated successfully');
    } catch (error) {
        console.error('Error fetching dashboard stats:', error);
        showToast(`Error loading dashboard statistics: ${error.message}`, 'danger');
        throw error;
    }
}

// Fetch recent student registrations
async function fetchRecentRegistrations() {
    try {
        console.log('Fetching recent student registrations...');
        
        // Try to clear cache for students table
        try {
            await supabase.rest.cache.purgeCache({
                table: 'students'
            });
        } catch (cacheError) {
            console.warn('Cache purge not supported or failed:', cacheError);
        }
        
        // Show loading indicator
        const tableBody = document.getElementById('recentRegistrationsTable');
        tableBody.innerHTML = '<tr><td colspan="5" class="text-center"><div class="spinner-border spinner-border-sm" role="status"></div> Loading...</td></tr>';
        
        // Fetch recent registrations with cache busting
        const { data, error } = await supabase
            .from('students')
            .select('id, name, email, program, created_at')
            .order('created_at', { ascending: false })
            .limit(10); // Fetch more than we need to account for possible filtered students
        
        if (error) {
            console.error('Error fetching recent registrations:', error);
            throw error;
        }
        
        console.log(`Fetched ${data ? data.length : 0} recent registrations`);
        
        // Filter out deleted students
        let filteredData = data;
        if (window.filterDeletedStudents) {
            filteredData = window.filterDeletedStudents(data);
            console.log(`Filtered out ${data.length - filteredData.length} deleted students from recent registrations`);
        }
        
        // Limit to 5 students after filtering
        filteredData = filteredData.slice(0, 5);
        
        // Clear the table
        tableBody.innerHTML = '';
        
        if (filteredData && filteredData.length > 0) {
            filteredData.forEach((student, index) => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${index + 1}</td>
                    <td>${student.name}</td>
                    <td>${student.email}</td>
                    <td>${student.program}</td>
                    <td>${formatDate(student.created_at)}</td>
                `;
                tableBody.appendChild(row);
            });
        } else {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td colspan="5" class="text-center">No recent registrations found</td>
            `;
            tableBody.appendChild(row);
        }
    } catch (error) {
        console.error('Error fetching recent registrations:', error.message);
        throw error;
    }
}

// Load attendance summary (replacing the attendance chart)
async function loadAttendanceSummary() {
    try {
        console.log('Loading attendance summary...');
        
        // Fetch attendance data for the last 7 days
        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - 6); // Last 7 days including today
        
        // Fetch attendance data
        const { data, error } = await supabase
            .from('attendance')
            .select('status')
            .gte('date', startDate.toISOString())
            .lte('date', endDate.toISOString());
        
        if (error) throw error;
        
        // Count attendance by status
        let presentCount = 0;
        let absentCount = 0;
        let lateCount = 0;
        
        if (data && data.length > 0) {
            data.forEach(record => {
                if (record.status === 'Present') {
                    presentCount++;
                } else if (record.status === 'Absent') {
                    absentCount++;
                } else if (record.status === 'Late') {
                    lateCount++;
                }
            });
        }
        
        const totalCount = presentCount + absentCount + lateCount;
        
        // Calculate percentages
        const presentPercentage = totalCount > 0 ? Math.round((presentCount / totalCount) * 100) : 0;
        const absentPercentage = totalCount > 0 ? Math.round((absentCount / totalCount) * 100) : 0;
        const latePercentage = totalCount > 0 ? Math.round((lateCount / totalCount) * 100) : 0;
        
        // Update the UI
        document.getElementById('presentCount').textContent = presentCount;
        document.getElementById('absentCount').textContent = absentCount;
        document.getElementById('lateCount').textContent = lateCount;
        
        document.getElementById('presentProgressBar').style.width = `${presentPercentage}%`;
        document.getElementById('presentProgressBar').textContent = `${presentPercentage}%`;
        document.getElementById('presentProgressBar').setAttribute('aria-valuenow', presentPercentage);
        
        document.getElementById('absentProgressBar').style.width = `${absentPercentage}%`;
        document.getElementById('absentProgressBar').textContent = `${absentPercentage}%`;
        document.getElementById('absentProgressBar').setAttribute('aria-valuenow', absentPercentage);
        
        document.getElementById('lateProgressBar').style.width = `${latePercentage}%`;
        document.getElementById('lateProgressBar').textContent = `${latePercentage}%`;
        document.getElementById('lateProgressBar').setAttribute('aria-valuenow', latePercentage);
        
        console.log('Attendance summary loaded successfully');
    } catch (error) {
        console.error('Error loading attendance summary:', error);
        // Don't throw the error to prevent dashboard from failing completely
    }
}

// Load course enrollment table (replacing the enrollment chart)
async function loadCourseEnrollmentTable() {
    try {
        console.log('Loading course enrollment table...');
        
        // Get the table body element
        const tableBody = document.getElementById('courseEnrollmentTable');
        if (!tableBody) {
            console.error('Course enrollment table body not found');
            return;
        }
        
        // Clear the table
        tableBody.innerHTML = '<tr><td colspan="3" class="text-center"><div class="spinner-border spinner-border-sm" role="status"></div> Loading...</td></tr>';
        
        // Fetch courses
        const { data: courses, error: coursesError } = await supabase
            .from('courses')
            .select('id, name');
        
        if (coursesError) throw coursesError;
        
        // Fetch enrollments
        const { data: enrollments, error: enrollmentsError } = await supabase
            .from('enrollments')
            .select('course_id');
        
        if (enrollmentsError) throw enrollmentsError;
        
        // Process data for table
        const courseData = [];
        let totalEnrollments = 0;
        
        // Count enrollments by course
        const enrollmentCounts = {};
        if (enrollments && enrollments.length > 0) {
            enrollments.forEach(enrollment => {
                const courseId = enrollment.course_id;
                enrollmentCounts[courseId] = (enrollmentCounts[courseId] || 0) + 1;
                totalEnrollments++;
            });
        }
        
        // Process course data
        if (courses && courses.length > 0) {
            courses.forEach(course => {
                const count = enrollmentCounts[course.id] || 0;
                const percentage = totalEnrollments > 0 ? Math.round((count / totalEnrollments) * 100) : 0;
                
                courseData.push({
                    name: course.name,
                    count: count,
                    percentage: percentage
                });
            });
        }
        
        // Sort courses by enrollment count (descending)
        courseData.sort((a, b) => b.count - a.count);
        
        // Update the table
        tableBody.innerHTML = '';
        
        if (courseData.length > 0) {
            courseData.forEach(course => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${course.name}</td>
                    <td>${course.count}</td>
                    <td>
                        <div class="progress" style="height: 20px;">
                            <div class="progress-bar" role="progressbar" style="width: ${course.percentage}%" aria-valuenow="${course.percentage}" aria-valuemin="0" aria-valuemax="100">${course.percentage}%</div>
                        </div>
                    </td>
                `;
                tableBody.appendChild(row);
            });
        } else {
            const row = document.createElement('tr');
            row.innerHTML = '<td colspan="3" class="text-center">No course enrollment data available</td>';
            tableBody.appendChild(row);
        }
        
        console.log('Course enrollment table loaded successfully');
    } catch (error) {
        console.error('Error loading course enrollment table:', error);
        
        // Show error in the table
        const tableBody = document.getElementById('courseEnrollmentTable');
        if (tableBody) {
            tableBody.innerHTML = '<tr><td colspan="3" class="text-center text-danger">Error loading course data</td></tr>';
        }
    }
}
