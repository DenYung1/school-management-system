// Attendance Module for NIIT School Management System

document.addEventListener('DOMContentLoaded', function() {
    // Initialize flatpickr for date inputs
    initializeDatepickers();
    
    // Initialize DataTable for attendance records
    initializeAttendanceRecordsTable();
    
    // Load courses for dropdowns
    loadCoursesForDropdowns();
    
    // Add event listeners
    document.getElementById('attendanceForm').addEventListener('submit', handleLoadStudentsForAttendance);
    document.getElementById('saveAttendanceBtn').addEventListener('click', handleSaveAttendance);
    document.getElementById('updateAttendanceBtn').addEventListener('click', handleUpdateAttendance);
    
    // Add event listeners for filters
    document.getElementById('recordFilterCourse').addEventListener('change', applyAttendanceFilters);
    document.getElementById('recordFilterStudent').addEventListener('change', applyAttendanceFilters);
    document.getElementById('recordFilterDate').addEventListener('change', applyAttendanceFilters);
    
    // Add event delegation for edit attendance button
    document.getElementById('attendanceRecordsTable').addEventListener('click', function(e) {
        if (e.target.classList.contains('btn-edit') || e.target.closest('.btn-edit')) {
            const attendanceId = e.target.closest('.btn-edit').dataset.id;
            openEditAttendanceModal(attendanceId);
        }
    });
});

// Initialize flatpickr for date inputs
function initializeDatepickers() {
    // Attendance date picker
    flatpickr('#attendanceDate', {
        dateFormat: 'Y-m-d',
        defaultDate: 'today',
        maxDate: 'today'
    });
    
    // Date range picker for filtering
    flatpickr('#recordFilterDate', {
        mode: 'range',
        dateFormat: 'Y-m-d',
        maxDate: 'today'
    });
}

// Initialize DataTable for attendance records
function initializeAttendanceRecordsTable() {
    // Fetch attendance records
    fetchAttendanceRecords().then(records => {
        // Initialize DataTable
        $('#attendanceRecordsTable').DataTable({
            data: records,
            columns: [
                { data: 'date', render: data => formatDate(data) },
                { data: 'course_name' },
                { data: 'student_name' },
                { 
                    data: 'status',
                    render: function(data) {
                        const statusClass = `status-${data.toLowerCase()}`;
                        return `<span class="${statusClass}">${data}</span>`;
                    }
                },
                { data: 'notes' },
                { 
                    data: null,
                    render: function(data, type, row) {
                        return `
                            <button type="button" class="btn btn-sm btn-primary btn-edit" data-id="${row.id}">
                                <i class="fas fa-edit"></i> Edit
                            </button>
                        `;
                    }
                }
            ],
            responsive: true,
            order: [[0, 'desc']],
            language: {
                search: "Search records:",
                lengthMenu: "Show _MENU_ records per page",
                info: "Showing _START_ to _END_ of _TOTAL_ records",
                infoEmpty: "Showing 0 to 0 of 0 records",
                infoFiltered: "(filtered from _MAX_ total records)"
            }
        });
    }).catch(error => {
        console.error('Error initializing attendance records table:', error.message);
        showToast('Error loading attendance data', 'danger');
    });
}

// Fetch attendance records from Supabase
async function fetchAttendanceRecords() {
    try {
        // Join attendance with courses and students to get names
        const { data, error } = await supabase
            .from('attendance')
            .select(`
                id,
                date,
                course_id,
                courses(name),
                student_id,
                students(name),
                status,
                notes
            `)
            .order('date', { ascending: false });
        
        if (error) throw error;
        
        // Process data to include course and student names
        return data.map(record => ({
            ...record,
            course_name: record.courses ? record.courses.name : 'Unknown',
            student_name: record.students ? record.students.name : 'Unknown'
        }));
    } catch (error) {
        console.error('Error fetching attendance records:', error.message);
        throw error;
    }
}

// Load courses for dropdowns
async function loadCoursesForDropdowns() {
    try {
        console.log('Loading courses for dropdowns...');
        
        // Fetch courses
        const { data: courses, error } = await supabase
            .from('courses')
            .select('id, name');
        
        if (error) {
            console.error('Error fetching courses:', error);
            throw error;
        }
        
        console.log('Courses fetched:', courses);
        
        // Populate course dropdowns
        const attendanceCourseSelect = document.getElementById('attendanceCourse');
        if (!attendanceCourseSelect) {
            console.error('attendanceCourse select element not found');
            return;
        }
        
        const recordFilterCourseSelect = document.getElementById('recordFilterCourse');
        if (!recordFilterCourseSelect) {
            console.error('recordFilterCourse select element not found');
            // Continue anyway since this might be optional
        }
        
        console.log('Clearing existing options from dropdowns');
        
        // Clear existing options except the first one in filter dropdown
        if (recordFilterCourseSelect) {
            while (recordFilterCourseSelect.options.length > 1) {
                recordFilterCourseSelect.remove(1);
            }
        }
        
        // Clear all options in attendance dropdown
        while (attendanceCourseSelect.options.length > 1) {
            attendanceCourseSelect.remove(1);
        }
        
        // Add course options
        if (courses && courses.length > 0) {
            console.log(`Adding ${courses.length} courses to dropdowns`);
            courses.forEach(course => {
                console.log(`Adding course: ${course.id} - ${course.name}`);
                
                // For attendance course select
                const option1 = document.createElement('option');
                option1.value = course.id;
                option1.textContent = course.name;
                attendanceCourseSelect.appendChild(option1);
                
                // For record filter course select if it exists
                if (recordFilterCourseSelect) {
                    const option2 = document.createElement('option');
                    option2.value = course.id;
                    option2.textContent = course.name;
                    recordFilterCourseSelect.appendChild(option2);
                }
            });
            
            console.log('Course options added successfully');
        } else {
            console.warn('No courses found to add to dropdowns');
            showToast('No courses found. Please add courses first.', 'warning');
        }
        
        // Load students for filter dropdown
        try {
            loadStudentsForFilter();
        } catch (filterError) {
            console.error('Error loading students for filter:', filterError);
            // Don't let this error prevent the rest of the function from working
        }
    } catch (error) {
        console.error('Error loading courses for dropdowns:', error);
        showToast('Error loading course data: ' + (error.message || 'Unknown error'), 'danger');
    }
}

// Load students for filter dropdown
async function loadStudentsForFilter() {
    try {
        // Fetch students
        const { data: students, error } = await supabase
            .from('students')
            .select('id, name')
            .order('name');
        
        if (error) throw error;
        
        const studentFilterSelect = document.getElementById('recordFilterStudent');
        
        // Clear existing options except the first one
        while (studentFilterSelect.options.length > 1) {
            studentFilterSelect.remove(1);
        }
        
        // Add student options
        if (students && students.length > 0) {
            students.forEach(student => {
                const option = document.createElement('option');
                option.value = student.id;
                option.textContent = student.name;
                studentFilterSelect.appendChild(option);
            });
        }
    } catch (error) {
        console.error('Error loading students for filter:', error.message);
        showToast('Error loading student data', 'danger');
    }
}

// Handle load students for attendance
async function handleLoadStudentsForAttendance(e) {
    e.preventDefault();
    
    try {
        // Get form values
        const date = document.getElementById('attendanceDate').value;
        const courseId = document.getElementById('attendanceCourse').value;
        
        if (!date || !courseId) {
            showToast('Please select both date and course', 'warning');
            return;
        }
        
        // Update badges
        const courseNameBadge = document.getElementById('courseNameBadge');
        const dateBadge = document.getElementById('dateBadge');
        const courseName = document.getElementById('attendanceCourse').options[document.getElementById('attendanceCourse').selectedIndex].text;
        
        courseNameBadge.textContent = courseName;
        dateBadge.textContent = formatDate(date);
        
        // Fetch students enrolled in the course
        const { data: enrollments, error: enrollmentsError } = await supabase
            .from('enrollments')
            .select(`
                student_id,
                students(id, name)
            `)
            .eq('course_id', courseId);
        
        if (enrollmentsError) throw enrollmentsError;
        
        // Check if any students are enrolled
        if (!enrollments || enrollments.length === 0) {
            document.getElementById('attendanceListContainer').classList.add('d-none');
            document.getElementById('noStudentsMessage').classList.remove('d-none');
            document.getElementById('selectCourseMessage').classList.add('d-none');
            return;
        }
        
        // Fetch existing attendance records for the date and course
        const { data: existingAttendance, error: attendanceError } = await supabase
            .from('attendance')
            .select('student_id, status, notes')
            .eq('date', date)
            .eq('course_id', courseId);
        
        if (attendanceError) throw attendanceError;
        
        // Generate attendance table rows
        const tableBody = document.getElementById('attendanceTableBody');
        tableBody.innerHTML = '';
        
        enrollments.forEach(enrollment => {
            const student = enrollment.students;
            
            // Check if attendance already exists for this student
            const existingRecord = existingAttendance ? existingAttendance.find(record => record.student_id === student.id) : null;
            
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${student.id}</td>
                <td>${student.name}</td>
                <td>
                    <select class="form-select form-select-sm attendance-status" data-student-id="${student.id}">
                        <option value="Present" ${existingRecord && existingRecord.status === 'Present' ? 'selected' : ''}>Present</option>
                        <option value="Absent" ${existingRecord && existingRecord.status === 'Absent' ? 'selected' : ''}>Absent</option>
                        <option value="Late" ${existingRecord && existingRecord.status === 'Late' ? 'selected' : ''}>Late</option>
                        <option value="Excused" ${existingRecord && existingRecord.status === 'Excused' ? 'selected' : ''}>Excused</option>
                    </select>
                </td>
                <td>
                    <input type="text" class="form-control form-control-sm attendance-notes" data-student-id="${student.id}" value="${existingRecord && existingRecord.notes ? existingRecord.notes : ''}">
                </td>
            `;
            
            tableBody.appendChild(row);
        });
        
        // Show attendance list container
        document.getElementById('attendanceListContainer').classList.remove('d-none');
        document.getElementById('noStudentsMessage').classList.add('d-none');
        document.getElementById('selectCourseMessage').classList.add('d-none');
    } catch (error) {
        console.error('Error loading students for attendance:', error.message);
        showToast('Error loading student data', 'danger');
    }
}

// Handle save attendance
async function handleSaveAttendance() {
    try {
        // Get form values
        const date = document.getElementById('attendanceDate').value;
        const courseId = document.getElementById('attendanceCourse').value;
        
        if (!date || !courseId) {
            showToast('Please select both date and course', 'warning');
            return;
        }
        
        // Disable save button
        const saveBtn = document.getElementById('saveAttendanceBtn');
        saveBtn.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Saving...';
        saveBtn.disabled = true;
        
        // Get attendance data from form
        const statusSelects = document.querySelectorAll('.attendance-status');
        
        // Prepare attendance records
        const attendanceRecords = [];
        
        statusSelects.forEach(select => {
            const studentId = select.dataset.studentId;
            const status = select.value;
            const notesInput = document.querySelector(`.attendance-notes[data-student-id="${studentId}"]`);
            const notes = notesInput ? notesInput.value : '';
            
            attendanceRecords.push({
                date,
                course_id: courseId,
                student_id: studentId,
                status,
                notes
            });
        });
        
        // Delete existing attendance records for the date and course
        const { error: deleteError } = await supabase
            .from('attendance')
            .delete()
            .eq('date', date)
            .eq('course_id', courseId);
        
        if (deleteError) throw deleteError;
        
        // Insert new attendance records
        const { data: _insertedRecords, error } = await supabase
            .from('attendance')
            .insert(attendanceRecords)
            .select();
        
        if (error) throw error;
        
        // Show success message immediately after data is saved
        showToast('Attendance saved successfully', 'success');
        
        // Reload attendance records
        reloadAttendanceRecords();
        
        // Reset form
        document.getElementById('attendanceForm').reset();
        document.getElementById('attendanceListContainer').classList.add('d-none');
        document.getElementById('selectCourseMessage').classList.remove('d-none');
        document.getElementById('noStudentsMessage').classList.add('d-none');
        
        // Email notifications have been temporarily disabled to fix the error message issue
        console.log('Attendance saved successfully. Email notifications are disabled.');
    } catch (error) {
        console.error('Error saving attendance:', error.message);
        showToast('Error saving attendance data', 'danger');
    } finally {
        // Reset save button
        const saveBtn = document.getElementById('saveAttendanceBtn');
        saveBtn.innerHTML = 'Save Attendance';
        saveBtn.disabled = false;
    }
}

// Open edit attendance modal
async function openEditAttendanceModal(attendanceId) {
    try {
        // Fetch attendance record
        const { data, error } = await supabase
            .from('attendance')
            .select(`
                id,
                date,
                course_id,
                courses(name),
                student_id,
                students(name),
                status,
                notes
            `)
            .eq('id', attendanceId)
            .single();
        
        if (error) throw error;
        
        // Populate form fields
        document.getElementById('editAttendanceId').value = data.id;
        document.getElementById('editAttendanceStudent').value = data.students ? data.students.name : 'Unknown';
        document.getElementById('editAttendanceCourse').value = data.courses ? data.courses.name : 'Unknown';
        document.getElementById('editAttendanceDate').value = formatDate(data.date);
        document.getElementById('editAttendanceStatus').value = data.status;
        document.getElementById('editAttendanceNotes').value = data.notes || '';
        
        // Show modal
        const modal = new bootstrap.Modal(document.getElementById('editAttendanceModal'));
        modal.show();
    } catch (error) {
        console.error('Error opening edit attendance modal:', error.message);
        showToast('Error loading attendance data', 'danger');
    }
}

// Reload attendance records table
function reloadAttendanceRecords() {
    try {
        console.log('Reloading attendance records...');
        
        // Destroy existing DataTable if it exists
        const table = $('#attendanceRecordsTable').DataTable();
        if (table) {
            table.destroy();
        }
        
        // Reinitialize the table
        initializeAttendanceRecordsTable();
        
        console.log('Attendance records reloaded successfully');
    } catch (error) {
        console.error('Error reloading attendance records:', error);
        // Don't show a toast here to avoid multiple error messages
    }
}

// Handle update attendance
async function handleUpdateAttendance() {
    try {
        // Get form values
        const id = document.getElementById('editAttendanceId').value;
        const status = document.getElementById('editAttendanceStatus').value;
        const notes = document.getElementById('editAttendanceNotes').value;
        
        // Disable update button
        const updateBtn = document.getElementById('updateAttendanceBtn');
        updateBtn.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Updating...';
        updateBtn.disabled = true;
        
        // Update attendance record
        const { data: _, error } = await supabase
            .from('attendance')
            .update({
                status,
                notes
            })
            .eq('id', id)
            .select();
        
        if (error) throw error;
        
        // Close modal
        const modal = bootstrap.Modal.getInstance(document.getElementById('editAttendanceModal'));
        modal.hide();
        
        // Show success message
        showToast('Attendance record updated successfully', 'success');
        
        // Refresh attendance records table
        $('#attendanceRecordsTable').DataTable().destroy();
        initializeAttendanceRecordsTable();
    } catch (error) {
        console.error('Error updating attendance record:', error.message);
        showToast('Error updating attendance record', 'danger');
    } finally {
        // Reset update button
        const updateBtn = document.getElementById('updateAttendanceBtn');
        updateBtn.innerHTML = 'Update Record';
        updateBtn.disabled = false;
    }
}

// Apply attendance filters
function applyAttendanceFilters() {
    const courseId = document.getElementById('recordFilterCourse').value;
    const studentId = document.getElementById('recordFilterStudent').value;
    const dateRange = document.getElementById('recordFilterDate').value;
    
    // Get DataTable instance
    const table = $('#attendanceRecordsTable').DataTable();
    
    // Clear existing filters
    table.search('').columns().search('').draw();
    
    // Apply course filter
    if (courseId) {
        table.column(1).search(document.getElementById('recordFilterCourse').options[document.getElementById('recordFilterCourse').selectedIndex].text).draw();
    }
    
    // Apply student filter
    if (studentId) {
        table.column(2).search(document.getElementById('recordFilterStudent').options[document.getElementById('recordFilterStudent').selectedIndex].text).draw();
    }
    
    // Apply date range filter
    if (dateRange) {
        const dates = dateRange.split(' to ');
        const startDate = dates[0];
        const endDate = dates.length > 1 ? dates[1] : startDate;
        
        // Custom filtering function for date range
        $.fn.dataTable.ext.search.push(
            function(settings, data, _dataIndex) {
                const recordDate = new Date(data[0].split('/').reverse().join('-'));
                const start = new Date(startDate);
                const end = new Date(endDate);
                
                return (recordDate >= start && recordDate <= end);
            }
        );
        
        table.draw();
        
        // Remove the custom filter after drawing
        $.fn.dataTable.ext.search.pop();
    }
}
