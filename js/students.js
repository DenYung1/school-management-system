// Students Module for NIIT School Management System

document.addEventListener('DOMContentLoaded', function() {
    // Initialize DataTable
    initializeStudentsTable();
    
    // Load programs and courses for dropdowns
    loadProgramsAndCourses();
    
    // Add event listeners
    document.getElementById('saveStudentBtn').addEventListener('click', handleAddStudent);
    document.getElementById('updateStudentBtn').addEventListener('click', handleUpdateStudent);
    
    // Add event delegation for edit and delete buttons
    document.getElementById('studentsTable').addEventListener('click', function(e) {
        if (e.target.classList.contains('btn-edit') || e.target.closest('.btn-edit')) {
            const studentId = e.target.closest('.btn-edit').dataset.id;
            openEditStudentModal(studentId);
        } else if (e.target.classList.contains('btn-delete') || e.target.closest('.btn-delete')) {
            const studentId = e.target.closest('.btn-delete').dataset.id;
            confirmDeleteStudent(studentId);
        }
    });
});

// Initialize DataTable for students
function initializeStudentsTable() {
    // Clear existing table if it exists
    if ($.fn.DataTable.isDataTable('#studentsTable')) {
        $('#studentsTable').DataTable().destroy();
        $('#studentsTable tbody').empty();
    }
    
    // Show loading indicator
    $('#studentsTable').html('<tbody><tr><td colspan="7" class="text-center">Loading students data...</td></tr></tbody>');
    
    // Fetch students data
    fetchStudents().then(students => {
        console.log('Initializing table with', students.length, 'students');
        
        // Initialize DataTable with clear: true to ensure old data is removed
        $('#studentsTable').DataTable({
            data: students,
            destroy: true,  // Destroy any existing table
            columns: [
                { data: 'id' },
                { data: 'name' },
                { data: 'email' },
                { data: 'program' },
                { data: 'course_name' },
                { data: 'phone' },
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
                search: "Search students:",
                lengthMenu: "Show _MENU_ students per page",
                info: "Showing _START_ to _END_ of _TOTAL_ students",
                infoEmpty: "Showing 0 to 0 of 0 students",
                infoFiltered: "(filtered from _MAX_ total students)"
            }
        });
    }).catch(error => {
        console.error('Error initializing students table:', error);
        showToast('Error loading students data: ' + error.message, 'danger');
    });
}

// Fetch students data from Supabase
async function fetchStudents() {
    try {
        console.log('Fetching students data...');
        
        // Join students with courses to get course names
        const { data, error } = await supabaseClient
            .from('students')
            .select(`
                id,
                name,
                email,
                program,
                course_id,
                courses(name),
                phone,
                address,
                date_of_birth,
                created_at
            `);
        
        if (error) {
            console.error('Supabase query error:', error);
            throw error;
        }
        
        console.log(`Successfully fetched ${data ? data.length : 0} students`);
        
        // Process data to include course name
        let processedData = data.map(student => ({
            ...student,
            course_name: student.courses ? student.courses.name : 'Not Assigned'
        }));
        
        // Filter out any students that have been marked as deleted in localStorage
        if (window.filterDeletedStudents) {
            const filteredData = window.filterDeletedStudents(processedData);
            console.log(`Filtered out ${processedData.length - filteredData.length} deleted students`);
            processedData = filteredData;
        }
        
        return processedData;
    } catch (error) {
        console.error('Error fetching students:', error);
        showToast(`Error fetching students: ${error.message}`, 'danger');
        throw error;
    }
}

// Load programs and courses for dropdowns
async function loadProgramsAndCourses() {
    try {
        // Fetch programs
        const programs = ['Computer Science', 'Information Technology', 'Software Engineering', 'Cybersecurity', 'Data Science', 'Networking'];
        
        // Fetch courses
        const { data: courses, error: coursesError } = await supabaseClient
            .from('courses')
            .select('id, name');
        
        if (coursesError) throw coursesError;
        
        // Populate program dropdowns
        const programDropdowns = [
            document.getElementById('studentProgram'),
            document.getElementById('editStudentProgram')
        ];
        
        programDropdowns.forEach(dropdown => {
            if (dropdown) {
                programs.forEach(program => {
                    const option = document.createElement('option');
                    option.value = program;
                    option.textContent = program;
                    dropdown.appendChild(option);
                });
            }
        });
        
        // Populate course dropdowns
        const courseDropdowns = [
            document.getElementById('studentCourse'),
            document.getElementById('editStudentCourse')
        ];
        
        courseDropdowns.forEach(dropdown => {
            if (dropdown && courses) {
                courses.forEach(course => {
                    const option = document.createElement('option');
                    option.value = course.id;
                    option.textContent = course.name;
                    dropdown.appendChild(option);
                });
            }
        });
    } catch (error) {
        console.error('Error loading programs and courses:', error.message);
        showToast('Error loading form data', 'danger');
    }
}

// Handle add student form submission
async function handleAddStudent() {
    try {
        // Get form values
        const name = document.getElementById('studentName').value;
        const email = document.getElementById('studentEmail').value;
        const program = document.getElementById('studentProgram').value;
        const courseId = document.getElementById('studentCourse').value;
        const phone = document.getElementById('studentPhone').value;
        const dob = document.getElementById('studentDOB').value;
        const address = document.getElementById('studentAddress').value;
        const errorElement = document.getElementById('studentFormError');
        
        // Validate form
        if (!name || !email || !program || !courseId || !phone) {
            errorElement.textContent = 'Please fill in all required fields';
            errorElement.classList.remove('d-none');
            return;
        }
        
        // Clear error message
        errorElement.classList.add('d-none');
        
        // Disable save button
        const saveBtn = document.getElementById('saveStudentBtn');
        saveBtn.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Saving...';
        saveBtn.disabled = true;
        
        // Insert student record
        const { data: _data, error } = await supabaseClient
            .from('students')
            .insert([
                {
                    name,
                    email,
                    program,
                    course_id: courseId,
                    phone,
                    date_of_birth: dob || null,
                    address: address || null
                }
            ])
            .select();
        
        if (error) throw error;
        
        // Close modal and reset form
        const modal = bootstrap.Modal.getInstance(document.getElementById('addStudentModal'));
        modal.hide();
        document.getElementById('addStudentForm').reset();
        
        // Show success message
        showToast('Student added successfully', 'success');
        
        // Refresh table
        $('#studentsTable').DataTable().destroy();
        initializeStudentsTable();
    } catch (error) {
        console.error('Error adding student:', error.message);
        
        // Show error message
        const errorElement = document.getElementById('studentFormError');
        errorElement.textContent = error.message;
        errorElement.classList.remove('d-none');
    } finally {
        // Reset save button
        const saveBtn = document.getElementById('saveStudentBtn');
        saveBtn.innerHTML = 'Save Student';
        saveBtn.disabled = false;
    }
}

// Open edit student modal
async function openEditStudentModal(studentId) {
    try {
        // Fetch student data
        const { data, error } = await supabaseClient
            .from('students')
            .select('*')
            .eq('id', studentId)
            .single();
        
        if (error) throw error;
        
        // Populate form fields
        document.getElementById('editStudentId').value = data.id;
        document.getElementById('editStudentName').value = data.name;
        document.getElementById('editStudentEmail').value = data.email;
        document.getElementById('editStudentProgram').value = data.program;
        document.getElementById('editStudentCourse').value = data.course_id;
        document.getElementById('editStudentPhone').value = data.phone;
        
        if (data.date_of_birth) {
            document.getElementById('editStudentDOB').value = data.date_of_birth.split('T')[0];
        }
        
        if (data.address) {
            document.getElementById('editStudentAddress').value = data.address;
        }
        
        // Show modal
        const modal = new bootstrap.Modal(document.getElementById('editStudentModal'));
        modal.show();
    } catch (error) {
        console.error('Error opening edit student modal:', error.message);
        showToast('Error loading student data', 'danger');
    }
}

// Handle update student form submission
async function handleUpdateStudent() {
    try {
        // Get form values
        const id = document.getElementById('editStudentId').value;
        const name = document.getElementById('editStudentName').value;
        const email = document.getElementById('editStudentEmail').value;
        const program = document.getElementById('editStudentProgram').value;
        const courseId = document.getElementById('editStudentCourse').value;
        const phone = document.getElementById('editStudentPhone').value;
        const dob = document.getElementById('editStudentDOB').value;
        const address = document.getElementById('editStudentAddress').value;
        const errorElement = document.getElementById('editStudentFormError');
        
        // Validate form
        if (!name || !email || !program || !courseId || !phone) {
            errorElement.textContent = 'Please fill in all required fields';
            errorElement.classList.remove('d-none');
            return;
        }
        
        // Clear error message
        errorElement.classList.add('d-none');
        
        // Disable update button
        const updateBtn = document.getElementById('updateStudentBtn');
        updateBtn.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Updating...';
        updateBtn.disabled = true;
        
        // Update student record
        const { data: _data, error } = await supabaseClient
            .from('students')
            .update({
                name,
                email,
                program,
                course_id: courseId,
                phone,
                date_of_birth: dob || null,
                address: address || null
            })
            .eq('id', id)
            .select();
        
        if (error) throw error;
        
        // Close modal
        const modal = bootstrap.Modal.getInstance(document.getElementById('editStudentModal'));
        modal.hide();
        
        // Show success message
        showToast('Student updated successfully', 'success');
        
        // Refresh table
        $('#studentsTable').DataTable().destroy();
        initializeStudentsTable();
    } catch (error) {
        console.error('Error updating student:', error.message);
        
        // Show error message
        const errorElement = document.getElementById('editStudentFormError');
        errorElement.textContent = error.message;
        errorElement.classList.remove('d-none');
    } finally {
        // Reset update button
        const updateBtn = document.getElementById('updateStudentBtn');
        updateBtn.innerHTML = 'Update Student';
        updateBtn.disabled = false;
    }
}

// Confirm delete student
function confirmDeleteStudent(studentId) {
    if (confirm('Are you sure you want to delete this student? This action cannot be undone.')) {
        deleteStudent(studentId);
    }
}

// Delete student - completely new implementation with local storage backup
async function deleteStudent(studentId) {
    try {
        console.log('Attempting to delete student with ID:', studentId);
        
        // Disable all delete buttons to prevent multiple clicks
        const deleteButtons = document.querySelectorAll('.btn-delete');
        deleteButtons.forEach(btn => btn.disabled = true);
        
        // Show deletion in progress message
        showToast('Deleting student...', 'info');
        
        // Get student info before deletion for reference
        const { data: studentData, error: studentError } = await supabaseClient
            .from('students')
            .select('id, name, email')
            .eq('id', studentId)
            .single();
            
        if (studentError) {
            console.error('Error fetching student data:', studentError);
            throw new Error('Could not find student to delete');
        }
        
        if (!studentData) {
            throw new Error('Student not found');
        }
        
        const studentName = studentData.name;
        console.log(`Found student to delete: ${studentName} (${studentData.email})`);
        
        const { error: deleteError } = await supabaseClient
            .from('students')
            .delete()
            .eq('id', studentId);

        if (deleteError) throw deleteError;
        
        // Remove the student from the DataTable immediately
        const table = $('#studentsTable').DataTable();
        if (table) {
            // Find and remove the row
            const rows = table.rows().indexes().filter(idx => {
                return table.row(idx).data().id === studentId;
            });
            
            if (rows.length > 0) {
                table.rows(rows).remove().draw();
                console.log('Row removed from DataTable');
            } else {
                console.warn('Row not found in DataTable');
            }
        }
        
        // Show success message only after the database confirms deletion.
        showToast(`Student ${studentName} deleted successfully`, 'success');
        
        // Force a complete page reload to ensure all data is fresh
        console.log('Scheduling page reload...');
        setTimeout(() => {
            console.log('Reloading page now');
            window.location.reload();
        }, 1000);
        
        return true;
    } catch (error) {
        console.error('Error in deleteStudent function:', error);
        showToast(`Error deleting student: ${error.message}`, 'danger');
        return false;
    } finally {
        // Re-enable delete buttons
        const deleteButtons = document.querySelectorAll('.btn-delete');
        deleteButtons.forEach(btn => btn.disabled = false);
    }
}

// Note: This function was previously unused and has been removed to clean up the code
