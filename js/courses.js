// Courses Module for NIIT School Management System

document.addEventListener('DOMContentLoaded', function() {
    // Initialize DataTables
    initializeCoursesTable();
    initializeEnrollmentTable();
    
    // Add event listeners
    document.getElementById('saveCourseBtn').addEventListener('click', handleAddCourse);
    document.getElementById('updateCourseBtn').addEventListener('click', handleUpdateCourse);
    document.getElementById('assignStudentSaveBtn').addEventListener('click', handleAssignStudent);
    
    // Add event listener for course filter select
    document.getElementById('courseFilterSelect').addEventListener('change', function() {
        const courseId = this.value;
        loadEnrollmentsByCourse(courseId);
    });
    
    // Load students for assign student modal
    document.getElementById('assignStudentBtn').addEventListener('click', loadStudentsForAssignment);
    
    // Add event delegation for edit and delete buttons
    document.getElementById('coursesTable').addEventListener('click', function(e) {
        if (e.target.classList.contains('btn-edit') || e.target.closest('.btn-edit')) {
            const courseId = e.target.closest('.btn-edit').dataset.id;
            openEditCourseModal(courseId);
        } else if (e.target.classList.contains('btn-delete') || e.target.closest('.btn-delete')) {
            const courseId = e.target.closest('.btn-delete').dataset.id;
            confirmDeleteCourse(courseId);
        }
    });
    
    // Add event delegation for remove enrollment button
    document.getElementById('enrollmentTable').addEventListener('click', function(e) {
        if (e.target.classList.contains('btn-remove') || e.target.closest('.btn-remove')) {
            const enrollmentId = e.target.closest('.btn-remove').dataset.id;
            confirmRemoveEnrollment(enrollmentId);
        }
    });
});

// Initialize DataTable for courses
function initializeCoursesTable() {
    // Fetch courses data
    fetchCourses().then(courses => {
        // Initialize DataTable
        $('#coursesTable').DataTable({
            data: courses,
            columns: [
                { data: 'id' },
                { data: 'name' },
                { data: 'code' },
                { data: 'duration', render: data => `${data} weeks` },
                { data: 'faculty' },
                { data: 'capacity' },
                { data: 'enrolled_count' },
                { 
                    data: null,
                    render: function(data, type, row) {
                        return `
                            <div class="btn-group" role="group">
                                <button type="button" class="btn btn-sm btn-primary btn-edit" data-id="${row.id}">
                                    <i class="fas fa-edit"></i>
                                </button>
                                <button type="button" class="btn btn-sm btn-danger btn-delete" data-id="${row.id}">
                                    <i class="fas fa-trash"></i>
                                </button>
                            </div>
                        `;
                    }
                }
            ],
            responsive: true,
            order: [[0, 'desc']],
            language: {
                search: "Search courses:",
                lengthMenu: "Show _MENU_ courses per page",
                info: "Showing _START_ to _END_ of _TOTAL_ courses",
                infoEmpty: "Showing 0 to 0 of 0 courses",
                infoFiltered: "(filtered from _MAX_ total courses)"
            }
        });
        
        // Populate course filter select
        populateCourseFilterSelect(courses);
        populateAssignCourseSelect(courses);
    }).catch(error => {
        console.error('Error initializing courses table:', error.message);
        showToast('Error loading courses data', 'danger');
    });
}

// Initialize DataTable for enrollments
function initializeEnrollmentTable() {
    // Initialize empty DataTable
    $('#enrollmentTable').DataTable({
        columns: [
            { data: 'student_id' },
            { data: 'student_name' },
            { data: 'email' },
            { data: 'program' },
            { data: 'enrollment_date', render: data => formatDate(data) },
            { 
                data: null,
                render: function(data, type, row) {
                    return `
                        <button type="button" class="btn btn-sm btn-danger btn-remove" data-id="${row.id}">
                            <i class="fas fa-user-minus"></i> Remove
                        </button>
                    `;
                }
            }
        ],
        responsive: true,
        language: {
            search: "Search students:",
            lengthMenu: "Show _MENU_ students per page",
            info: "Showing _START_ to _END_ of _TOTAL_ students",
            infoEmpty: "Showing 0 to 0 of 0 students",
            infoFiltered: "(filtered from _MAX_ total students)",
            emptyTable: "No students enrolled in this course"
        }
    });
}

// Fetch courses data from Supabase
async function fetchCourses() {
    try {
        // Fetch courses
        const { data: courses, error: coursesError } = await supabase
            .from('courses')
            .select('*');
        
        if (coursesError) throw coursesError;
        
        // Fetch enrollment counts for each course
        const { data: enrollments, error: enrollmentsError } = await supabase
            .from('enrollments')
            .select('course_id');
        
        if (enrollmentsError) throw enrollmentsError;
        
        // Add enrollment count to each course
        return courses.map(course => {
            const enrolledCount = enrollments ? enrollments.filter(e => e.course_id === course.id).length : 0;
            return {
                ...course,
                enrolled_count: enrolledCount
            };
        });
    } catch (error) {
        console.error('Error fetching courses:', error.message);
        throw error;
    }
}

// Populate course filter select
function populateCourseFilterSelect(courses) {
    const courseFilterSelect = document.getElementById('courseFilterSelect');
    
    // Clear existing options except the first one
    while (courseFilterSelect.options.length > 1) {
        courseFilterSelect.remove(1);
    }
    
    // Add course options
    courses.forEach(course => {
        const option = document.createElement('option');
        option.value = course.id;
        option.textContent = course.name;
        courseFilterSelect.appendChild(option);
    });
}

// Populate assign course select
function populateAssignCourseSelect(courses) {
    const assignCourseSelect = document.getElementById('assignCourseSelect');
    
    // Clear existing options except the first one
    while (assignCourseSelect.options.length > 1) {
        assignCourseSelect.remove(1);
    }
    
    // Add course options
    courses.forEach(course => {
        const option = document.createElement('option');
        option.value = course.id;
        option.textContent = course.name;
        assignCourseSelect.appendChild(option);
    });
}

// Load enrollments by course
async function loadEnrollmentsByCourse(courseId) {
    // Show loading indicator
    const enrollmentTableContainer = document.getElementById('enrollmentTableContainer');
    if (enrollmentTableContainer) {
        enrollmentTableContainer.classList.add('loading');
        enrollmentTableContainer.innerHTML = '<div class="text-center p-5"><div class="spinner-border text-primary" role="status"></div><p class="mt-2">Loading enrollment data...</p></div>';
    }
    
    try {
        if (!courseId) {
            // Clear table if no course selected
            $('#enrollmentTable').DataTable().clear().draw();
            
            // Show no course selected message
            if (enrollmentTableContainer) {
                enrollmentTableContainer.classList.remove('loading');
                enrollmentTableContainer.innerHTML = '<div class="alert alert-info">Please select a course to view enrollments</div>';
            }
            return;
        }
        
        // Get course name for display
        const { data: courseData, error: courseError } = await supabase
            .from('courses')
            .select('name')
            .eq('id', courseId)
            .single();
            
        if (courseError) {
            console.warn('Could not fetch course name:', courseError.message);
        }
        
        const courseName = courseData ? courseData.name : 'Selected Course';
        
        // Fetch enrollments for the selected course
        const { data, error } = await supabase
            .from('enrollments')
            .select(`
                id,
                course_id,
                student_id,
                students(name, email, program),
                created_at
            `)
            .eq('course_id', courseId);
        
        if (error) throw error;
        
        // Remove loading indicator
        if (enrollmentTableContainer) {
            enrollmentTableContainer.classList.remove('loading');
        }
        
        // Check if we have any enrollments
        if (!data || data.length === 0) {
            // Show no enrollments message
            if (enrollmentTableContainer) {
                enrollmentTableContainer.innerHTML = `<div class="alert alert-info">No students enrolled in ${courseName} yet</div>`;
            }
            
            // Clear table
            $('#enrollmentTable').DataTable().clear().draw();
            return;
        }
        
        // Process data for DataTable
        const enrollmentData = data.map(enrollment => ({
            id: enrollment.id,
            student_id: enrollment.student_id,
            student_name: enrollment.students ? enrollment.students.name : 'Unknown',
            email: enrollment.students ? enrollment.students.email : 'Unknown',
            program: enrollment.students ? enrollment.students.program : 'Unknown',
            enrollment_date: enrollment.created_at
        }));
        
        // Restore table container
        if (enrollmentTableContainer) {
            enrollmentTableContainer.innerHTML = '<table id="enrollmentTable" class="table table-striped table-hover"><thead><tr><th>ID</th><th>Name</th><th>Email</th><th>Program</th><th>Enrollment Date</th><th>Actions</th></tr></thead><tbody></tbody></table>';
        }
        
        // Initialize or refresh DataTable
        if ($.fn.DataTable.isDataTable('#enrollmentTable')) {
            // Update existing table
            const table = $('#enrollmentTable').DataTable();
            table.clear().rows.add(enrollmentData).draw();
        } else {
            // Initialize new table
            $('#enrollmentTable').DataTable({
                data: enrollmentData,
                columns: [
                    { data: 'student_id' },
                    { data: 'student_name' },
                    { data: 'email' },
                    { data: 'program' },
                    { data: 'enrollment_date', render: data => formatDate(data) },
                    { 
                        data: null,
                        render: function(data, type, row) {
                            return `
                                <button type="button" class="btn btn-sm btn-danger btn-remove" data-id="${row.id}">
                                    <i class="fas fa-user-minus"></i> Remove
                                </button>
                            `;
                        }
                    }
                ],
                responsive: true,
                language: {
                    search: "Search students:",
                    lengthMenu: "Show _MENU_ students per page",
                    info: "Showing _START_ to _END_ of _TOTAL_ students",
                    infoEmpty: "Showing 0 to 0 of 0 students",
                    infoFiltered: "(filtered from _MAX_ total students)",
                    emptyTable: "No students enrolled in this course"
                }
            });
        }
        
        // Show success message
        console.log(`Loaded ${enrollmentData.length} enrollments for course ${courseName}`);
    } catch (error) {
        console.error('Error loading enrollments:', error.message);
        showToast('Error loading enrollment data: ' + error.message, 'danger');
        
        // Show error in container
        if (enrollmentTableContainer) {
            enrollmentTableContainer.classList.remove('loading');
            enrollmentTableContainer.innerHTML = `<div class="alert alert-danger">Error loading enrollment data: ${error.message}</div>`;
        }
    }
}

// Load students for assignment
async function loadStudentsForAssignment() {
    try {
        // Fetch students
        const { data, error } = await supabase
            .from('students')
            .select('id, name');
        
        if (error) throw error;
        
        const assignStudentSelect = document.getElementById('assignStudentSelect');
        
        // Clear existing options except the first one
        while (assignStudentSelect.options.length > 1) {
            assignStudentSelect.remove(1);
        }
        
        // Add student options
        data.forEach(student => {
            const option = document.createElement('option');
            option.value = student.id;
            option.textContent = student.name;
            assignStudentSelect.appendChild(option);
        });
    } catch (error) {
        console.error('Error loading students for assignment:', error.message);
        showToast('Error loading student data', 'danger');
    }
}

// Handle add course form submission
async function handleAddCourse() {
    try {
        // Get form values
        const name = document.getElementById('courseName').value;
        const code = document.getElementById('courseCode').value;
        const description = document.getElementById('courseDescription').value;
        const duration = document.getElementById('courseDuration').value;
        const capacity = document.getElementById('courseCapacity').value;
        const faculty = document.getElementById('courseFaculty').value;
        const errorElement = document.getElementById('courseFormError');
        
        // Validate form
        if (!name || !code || !duration || !capacity || !faculty) {
            errorElement.textContent = 'Please fill in all required fields';
            errorElement.classList.remove('d-none');
            return;
        }
        
        // Clear error message
        errorElement.classList.add('d-none');
        
        // Disable save button
        const saveBtn = document.getElementById('saveCourseBtn');
        saveBtn.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Saving...';
        saveBtn.disabled = true;
        
        // Insert course record
        const { error } = await supabase
            .from('courses')
            .insert([
                {
                    name,
                    code,
                    description: description || null,
                    duration: parseInt(duration),
                    capacity: parseInt(capacity),
                    faculty
                }
            ])
            .select();
        
        if (error) throw error;
        
        // Close modal and reset form
        const modal = bootstrap.Modal.getInstance(document.getElementById('addCourseModal'));
        modal.hide();
        document.getElementById('addCourseForm').reset();
        
        // Show success message
        showToast('Course added successfully', 'success');
        
        // Refresh table
        $('#coursesTable').DataTable().destroy();
        initializeCoursesTable();
    } catch (error) {
        console.error('Error adding course:', error.message);
        
        // Show error message
        const errorElement = document.getElementById('courseFormError');
        errorElement.textContent = error.message;
        errorElement.classList.remove('d-none');
    } finally {
        // Reset save button
        const saveBtn = document.getElementById('saveCourseBtn');
        saveBtn.innerHTML = 'Save Course';
        saveBtn.disabled = false;
    }
}

// Open edit course modal
async function openEditCourseModal(courseId) {
    try {
        // Fetch course data
        const { data, error } = await supabase
            .from('courses')
            .select('*')
            .eq('id', courseId)
            .single();
        
        if (error) throw error;
        
        // Populate form fields
        document.getElementById('editCourseId').value = data.id;
        document.getElementById('editCourseName').value = data.name;
        document.getElementById('editCourseCode').value = data.code;
        document.getElementById('editCourseDescription').value = data.description || '';
        document.getElementById('editCourseDuration').value = data.duration;
        document.getElementById('editCourseCapacity').value = data.capacity;
        document.getElementById('editCourseFaculty').value = data.faculty;
        
        // Show modal
        const modal = new bootstrap.Modal(document.getElementById('editCourseModal'));
        modal.show();
    } catch (error) {
        console.error('Error opening edit course modal:', error.message);
        showToast('Error loading course data', 'danger');
    }
}

// Handle update course form submission
async function handleUpdateCourse() {
    try {
        // Get form values
        const id = document.getElementById('editCourseId').value;
        const name = document.getElementById('editCourseName').value;
        const code = document.getElementById('editCourseCode').value;
        const description = document.getElementById('editCourseDescription').value;
        const duration = document.getElementById('editCourseDuration').value;
        const capacity = document.getElementById('editCourseCapacity').value;
        const faculty = document.getElementById('editCourseFaculty').value;
        const errorElement = document.getElementById('editCourseFormError');
        
        // Validate form
        if (!name || !code || !duration || !capacity || !faculty) {
            errorElement.textContent = 'Please fill in all required fields';
            errorElement.classList.remove('d-none');
            return;
        }
        
        // Clear error message
        errorElement.classList.add('d-none');
        
        // Disable update button
        const updateBtn = document.getElementById('updateCourseBtn');
        updateBtn.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Updating...';
        updateBtn.disabled = true;
        
        // Update course record
        const { error } = await supabase
            .from('courses')
            .update({
                name,
                code,
                description: description || null,
                duration: parseInt(duration),
                capacity: parseInt(capacity),
                faculty
            })
            .eq('id', id)
            .select();
        
        if (error) throw error;
        
        // Close modal
        const modal = bootstrap.Modal.getInstance(document.getElementById('editCourseModal'));
        modal.hide();
        
        // Show success message
        showToast('Course updated successfully', 'success');
        
        // Refresh table
        $('#coursesTable').DataTable().destroy();
        initializeCoursesTable();
    } catch (error) {
        console.error('Error updating course:', error.message);
        
        // Show error message
        const errorElement = document.getElementById('editCourseFormError');
        errorElement.textContent = error.message;
        errorElement.classList.remove('d-none');
    } finally {
        // Reset update button
        const updateBtn = document.getElementById('updateCourseBtn');
        updateBtn.innerHTML = 'Update Course';
        updateBtn.disabled = false;
    }
}

// Confirm delete course
function confirmDeleteCourse(courseId) {
    if (confirm('Are you sure you want to delete this course? This will also remove all enrollments for this course. This action cannot be undone.')) {
        deleteCourse(courseId);
    }
}

// Delete course
async function deleteCourse(courseId) {
    try {
        // Delete course record
        const { error } = await supabase
            .from('courses')
            .delete()
            .eq('id', courseId);
        
        if (error) throw error;
        
        // Show success message
        showToast('Course deleted successfully', 'success');
        
        // Refresh table
        $('#coursesTable').DataTable().destroy();
        initializeCoursesTable();
    } catch (error) {
        console.error('Error deleting course:', error.message);
        showToast('Error deleting course', 'danger');
    }
}

// Handle assign student to course
async function handleAssignStudent() {
    try {
        // Get form values
        const courseId = document.getElementById('assignCourseSelect').value;
        const studentId = document.getElementById('assignStudentSelect').value;
        const errorElement = document.getElementById('assignStudentFormError');
        
        // Validate form
        if (!courseId || !studentId) {
            errorElement.textContent = 'Please select both a course and a student';
            errorElement.classList.remove('d-none');
            return;
        }
        
        // Clear error message
        errorElement.classList.add('d-none');
        
        // Disable assign button
        const assignBtn = document.getElementById('assignStudentSaveBtn');
        assignBtn.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Assigning...';
        assignBtn.disabled = true;
        
        // Check if student is already enrolled in the course
        const { data: existingEnrollment } = await supabase
            .from('enrollments')
            .select('id')
            .eq('course_id', courseId)
            .eq('student_id', studentId)
            .single();
        
        if (existingEnrollment) {
            throw new Error('Student is already enrolled in this course');
        }
        
        // Check if course has reached capacity
        const { data: course, error: courseError } = await supabase
            .from('courses')
            .select('capacity')
            .eq('id', courseId)
            .single();
        
        if (courseError) throw courseError;
        
        const { count: currentEnrollments, error: countError } = await supabase
            .from('enrollments')
            .select('id', { count: 'exact', head: true })
            .eq('course_id', courseId);
        
        if (countError) throw countError;
        
        if (currentEnrollments >= course.capacity) {
            throw new Error('Course has reached maximum capacity');
        }
        
        // Insert enrollment record
        const { error } = await supabase
            .from('enrollments')
            .insert([
                {
                    course_id: courseId,
                    student_id: studentId
                }
            ])
            .select();
        
        if (error) throw error;
        
        // Close modal and reset form
        const modal = bootstrap.Modal.getInstance(document.getElementById('assignStudentModal'));
        modal.hide();
        document.getElementById('assignStudentForm').reset();
        
        // Show success message
        showToast('Student assigned to course successfully', 'success');
        
        // Always update the enrollment table with the newly assigned course
        const courseFilterSelect = document.getElementById('courseFilterSelect');
        
        // Set the filter dropdown to the course we just assigned a student to
        courseFilterSelect.value = courseId;
        
        // Refresh the enrollment table with the new data
        loadEnrollmentsByCourse(courseId);
        
        // Refresh courses table to update enrollment count
        $('#coursesTable').DataTable().destroy();
        initializeCoursesTable();
    } catch (error) {
        console.error('Error assigning student:', error.message);
        
        // Show error message
        const errorElement = document.getElementById('assignStudentFormError');
        errorElement.textContent = error.message;
        errorElement.classList.remove('d-none');
    } finally {
        // Reset assign button
        const assignBtn = document.getElementById('assignStudentSaveBtn');
        assignBtn.innerHTML = 'Assign Student';
        assignBtn.disabled = false;
    }
}

// Confirm remove enrollment
function confirmRemoveEnrollment(enrollmentId) {
    if (confirm('Are you sure you want to remove this student from the course?')) {
        removeEnrollment(enrollmentId);
    }
}

// Remove enrollment
async function removeEnrollment(enrollmentId) {
    try {
        // Get current course filter
        const courseId = document.getElementById('courseFilterSelect').value;
        
        // Delete enrollment record
        const { error } = await supabase
            .from('enrollments')
            .delete()
            .eq('id', enrollmentId);
        
        if (error) throw error;
        
        // Show success message
        showToast('Student removed from course successfully', 'success');
        
        // Refresh enrollment table
        loadEnrollmentsByourse(courseId);
        
        // Refresh courses table to update enrollment count
        $('#coursesTable').DataTable().destroy();
        initializeCoursesTable();
    } catch (error) {
        console.error('Error removing enrollment:', error.message);
        showToast('Error removing student from course', 'danger');
    }
}
