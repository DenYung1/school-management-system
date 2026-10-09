// Quiz Management Module for NIIT School Management System

document.addEventListener('DOMContentLoaded', function() {
    // Initialize DataTable
    const _quizzesTable = $('#quizzesTable').DataTable({
        responsive: true,
        order: [[5, 'desc']] // Sort by created_at by default
    });

    // Load quizzes when page loads
    loadQuizzes();
    
    // Load courses for dropdowns
    loadCourses();

    // Add event listeners
    const saveQuizBtn = document.getElementById('saveQuizBtn');
    if (saveQuizBtn) {
        saveQuizBtn.addEventListener('click', handleAddQuiz);
    }

    const updateQuizBtn = document.getElementById('updateQuizBtn');
    if (updateQuizBtn) {
        updateQuizBtn.addEventListener('click', handleUpdateQuiz);
    }

    const confirmDeleteQuizBtn = document.getElementById('confirmDeleteQuizBtn');
    if (confirmDeleteQuizBtn) {
        confirmDeleteQuizBtn.addEventListener('click', handleDeleteQuiz);
    }

    // Add event delegation for view, edit, and delete buttons
    const quizTableBody = document.getElementById('quizTableBody');
    if (quizTableBody) {
        quizTableBody.addEventListener('click', function(e) {
            const target = e.target.closest('button');
            if (!target) return;

            const quizId = target.dataset.quizId;
            
            if (target.classList.contains('view-files-btn')) {
                viewQuizFiles(quizId);
            } else if (target.classList.contains('edit-quiz-btn')) {
                editQuiz(quizId);
            } else if (target.classList.contains('delete-quiz-btn')) {
                document.getElementById('deleteQuizId').value = quizId;
            }
        });
    }
});

// Load all quizzes
async function loadQuizzes() {
    try {
        console.log('Loading quizzes...');
        
        // First, check if the quizzes table exists
        const { error: tableCheckError } = await supabaseClient
            .from('quizzes')
            .select('id')
            .limit(1);
        
        // The quizzes table must be provisioned by the database migration.
        if (tableCheckError) {
            console.error('Error checking quizzes table:', tableCheckError);
            throw tableCheckError;
        }
        
        // Now try to load the quizzes with a simpler query
        const { data, error } = await supabaseClient
            .from('quizzes')
            .select('id, title, description, course_id, created_by, created_at')
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching quizzes:', error);
            throw error;
        }

        // Get courses for reference
        const { data: coursesData } = await supabaseClient
            .from('courses')
            .select('id, name');
        
        // Create a map of course IDs to names
        const courseMap = {};
        if (coursesData) {
            coursesData.forEach(course => {
                courseMap[course.id] = course.name;
            });
        }

        const quizTableBody = document.getElementById('quizTableBody');
        quizTableBody.innerHTML = '';

        const quizzesTable = $('#quizzesTable').DataTable();
        quizzesTable.clear();

        if (data && data.length > 0) {
            data.forEach(quiz => {
                const courseName = courseMap[quiz.course_id] || 'N/A';
                const createdBy = 'Admin'; // Simplified for now
                const createdAt = new Date(quiz.created_at).toLocaleString();
                
                quizzesTable.row.add([
                    quiz.title,
                    courseName,
                    quiz.description || 'No description',
                    `<button class="btn btn-sm btn-info view-files-btn" data-quiz-id="${quiz.id}" data-bs-toggle="modal" data-bs-target="#viewQuizFilesModal">
                        <i class="fas fa-file me-1"></i> View Files
                    </button>`,
                    createdBy,
                    createdAt,
                    `<div class="btn-group" role="group">
                        <button class="btn btn-sm btn-primary edit-quiz-btn" data-quiz-id="${quiz.id}" data-bs-toggle="modal" data-bs-target="#editQuizModal">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn btn-sm btn-danger delete-quiz-btn" data-quiz-id="${quiz.id}" data-bs-toggle="modal" data-bs-target="#deleteQuizModal">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>`
                ]);
            });
        }
        
        quizzesTable.draw();
    } catch (error) {
        console.error('Error loading quizzes:', error);
        alert('Failed to load quizzes. Please try again.');
    }
}

// Load courses for dropdowns
async function loadCourses() {
    try {
        const { data, error } = await supabaseClient
            .from('courses')
            .select('id, name')
            .order('name');

        if (error) throw error;

        const quizCourseSelect = document.getElementById('quizCourse');
        const editQuizCourseSelect = document.getElementById('editQuizCourse');
        
        if (quizCourseSelect) {
            quizCourseSelect.innerHTML = '<option value="">Select Course</option>';
            
            if (data && data.length > 0) {
                data.forEach(course => {
                    const option = document.createElement('option');
                    option.value = course.id;
                    option.textContent = course.name;
                    quizCourseSelect.appendChild(option);
                });
            }
        }
        
        if (editQuizCourseSelect) {
            editQuizCourseSelect.innerHTML = '<option value="">Select Course</option>';
            
            if (data && data.length > 0) {
                data.forEach(course => {
                    const option = document.createElement('option');
                    option.value = course.id;
                    option.textContent = course.name;
                    editQuizCourseSelect.appendChild(option);
                });
            }
        }
    } catch (error) {
        console.error('Error loading courses:', error);
        alert('Failed to load courses. Please try again.');
    }
}

// Handle adding a new quiz
async function handleAddQuiz() {
    try {
        const title = document.getElementById('quizTitle').value.trim();
        const courseId = document.getElementById('quizCourse').value;
        const description = document.getElementById('quizDescription').value.trim();
        const quizFiles = document.getElementById('quizFiles').files;
        
        const errorElement = document.getElementById('addQuizError');
        
        // Validate inputs
        if (!title || !courseId) {
            errorElement.textContent = 'Please fill in all required fields';
            errorElement.classList.remove('d-none');
            return;
        }
        
        // Clear error message
        errorElement.classList.add('d-none');
        
        // Disable save button
        const saveBtn = document.getElementById('saveQuizBtn');
        saveBtn.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Saving...';
        saveBtn.disabled = true;
        
        // Get current user
        const { data: { user } } = await supabaseClient.auth.getUser();
        
        // Insert quiz
        const { data: quizData, error: quizError } = await supabaseClient
            .from('quizzes')
            .insert({
                title,
                description,
                course_id: courseId,
                created_by: user.id
            })
            .select();
        
        if (quizError) throw quizError;
        
        const quizId = quizData[0].id;
        
        // Upload files if any
        if (quizFiles.length > 0) {
            for (let i = 0; i < quizFiles.length; i++) {
                const file = quizFiles[i];
                
                // Upload file to storage
                const filePath = `quizzes/${quizId}/${file.name}`;
                const { error: storageError } = await supabaseClient.storage
                    .from('quiz_files')
                    .upload(filePath, file);
                
                if (storageError) throw storageError;
                
                // Public URL generation removed (unused variable)
                // const { data: { publicUrl } } = supabase.storage
                //     .from('quiz_files')
                //     .getPublicUrl(filePath);
                
                // Insert file record
                const { error: fileError } = await supabaseClient
                    .from('quiz_files')
                    .insert({
                        quiz_id: quizId,
                        file_name: file.name,
                        file_path: filePath,
                        file_type: file.type,
                        file_size: file.size,
                        uploaded_by: user.id
                    });
                
                if (fileError) throw fileError;
            }
        }
        
        // Reset form
        document.getElementById('addQuizForm').reset();
        
        // Close modal
        const modal = bootstrap.Modal.getInstance(document.getElementById('addQuizModal'));
        modal.hide();
        
        // Send email notifications to students enrolled in the course
        try {
            // Get students enrolled in the course
            const { data: enrollments, error: enrollmentsError } = await supabaseClient
                .from('enrollments')
                .select('student_id')
                .eq('course_id', courseId);
            
            if (enrollmentsError) throw enrollmentsError;
            
            if (enrollments && enrollments.length > 0) {
                // Extract student IDs
                const studentIds = enrollments.map(enrollment => enrollment.student_id);
                
                // Send notifications in the background
                setTimeout(async () => {
                    try {
                        // Check if email-service.js is loaded
                        if (window.emailService) {
                            await window.emailService.sendQuizNotification(studentIds, quizId);
                        } else {
                            console.log('Email service not available, notifications not sent');
                        }
                    } catch (error) {
                        console.error('Error sending quiz notifications:', error);
                    }
                }, 0);
            }
        } catch (error) {
            console.error('Error preparing quiz notifications:', error);
            // Non-critical error, don't show to user
        }
        
        // Reload quizzes
        loadQuizzes();
        
        // Show success message
        alert('Quiz added successfully!');
    } catch (error) {
        console.error('Error adding quiz:', error);
        const errorElement = document.getElementById('addQuizError');
        errorElement.textContent = `Failed to add quiz: ${error.message}`;
        errorElement.classList.remove('d-none');
    } finally {
        // Re-enable save button
        const saveBtn = document.getElementById('saveQuizBtn');
        saveBtn.innerHTML = 'Save Quiz';
        saveBtn.disabled = false;
    }
}

// View quiz files
async function viewQuizFiles(quizId) {
    try {
        const { data, error } = await supabaseClient
            .from('quiz_files')
            .select('*')
            .eq('quiz_id', quizId);
        
        if (error) throw error;
        
        const quizFilesList = document.getElementById('quizFilesList');
        quizFilesList.innerHTML = '';
        
        if (data && data.length > 0) {
            data.forEach(file => {
                // Get public URL
                const { data: { publicUrl } } = supabaseClient.storage
                    .from('quiz_files')
                    .getPublicUrl(file.file_path);
                
                const fileSize = formatFileSize(file.file_size);
                const fileType = getFileTypeIcon(file.file_type);
                
                const li = document.createElement('li');
                li.className = 'list-group-item d-flex justify-content-between align-items-center';
                li.innerHTML = `
                    <div>
                        <i class="${fileType} me-2"></i>
                        ${file.file_name}
                        <span class="badge bg-secondary rounded-pill ms-2">${fileSize}</span>
                    </div>
                    <a href="${publicUrl}" class="btn btn-sm btn-primary" target="_blank" download>
                        <i class="fas fa-download"></i>
                    </a>
                `;
                
                quizFilesList.appendChild(li);
            });
        } else {
            quizFilesList.innerHTML = '<li class="list-group-item">No files available for this quiz</li>';
        }
    } catch (error) {
        console.error('Error loading quiz files:', error);
        alert('Failed to load quiz files. Please try again.');
    }
}

// Edit quiz
async function editQuiz(quizId) {
    try {
        // Get quiz data
        const { data: quizData, error: quizError } = await supabaseClient
            .from('quizzes')
            .select('*')
            .eq('id', quizId)
            .single();
        
        if (quizError) throw quizError;
        
        // Populate form
        document.getElementById('editQuizId').value = quizId;
        document.getElementById('editQuizTitle').value = quizData.title;
        document.getElementById('editQuizCourse').value = quizData.course_id;
        document.getElementById('editQuizDescription').value = quizData.description || '';
        
        // Load current files
        const { data: filesData, error: filesError } = await supabaseClient
            .from('quiz_files')
            .select('*')
            .eq('quiz_id', quizId);
        
        if (filesError) throw filesError;
        
        const editQuizFilesList = document.getElementById('editQuizFilesList');
        editQuizFilesList.innerHTML = '';
        
        if (filesData && filesData.length > 0) {
            filesData.forEach(file => {
                // Get public URL
                const { data: { publicUrl } } = supabaseClient.storage
                    .from('quiz_files')
                    .getPublicUrl(file.file_path);
                
                const fileSize = formatFileSize(file.file_size);
                const fileType = getFileTypeIcon(file.file_type);
                
                const li = document.createElement('li');
                li.className = 'list-group-item d-flex justify-content-between align-items-center';
                li.innerHTML = `
                    <div>
                        <i class="${fileType} me-2"></i>
                        ${file.file_name}
                        <span class="badge bg-secondary rounded-pill ms-2">${fileSize}</span>
                    </div>
                    <div>
                        <a href="${publicUrl}" class="btn btn-sm btn-primary me-1" target="_blank" download>
                            <i class="fas fa-download"></i>
                        </a>
                        <button class="btn btn-sm btn-danger delete-file-btn" data-file-id="${file.id}">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                `;
                
                editQuizFilesList.appendChild(li);
            });
            
            // Add event listeners for delete file buttons
            const deleteFileBtns = document.querySelectorAll('.delete-file-btn');
            deleteFileBtns.forEach(btn => {
                btn.addEventListener('click', async function() {
                    const fileId = this.dataset.fileId;
                    if (confirm('Are you sure you want to delete this file?')) {
                        await deleteQuizFile(fileId);
                        this.closest('li').remove();
                    }
                });
            });
        } else {
            editQuizFilesList.innerHTML = '<li class="list-group-item">No files available for this quiz</li>';
        }
    } catch (error) {
        console.error('Error loading quiz for edit:', error);
        alert('Failed to load quiz details. Please try again.');
    }
}

// Handle updating a quiz
async function handleUpdateQuiz() {
    try {
        const quizId = document.getElementById('editQuizId').value;
        const title = document.getElementById('editQuizTitle').value.trim();
        const courseId = document.getElementById('editQuizCourse').value;
        const description = document.getElementById('editQuizDescription').value.trim();
        const quizFiles = document.getElementById('editQuizFiles').files;
        
        const errorElement = document.getElementById('editQuizError');
        
        // Validate inputs
        if (!title || !courseId) {
            errorElement.textContent = 'Please fill in all required fields';
            errorElement.classList.remove('d-none');
            return;
        }
        
        // Clear error message
        errorElement.classList.add('d-none');
        
        // Disable update button
        const updateBtn = document.getElementById('updateQuizBtn');
        updateBtn.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Updating...';
        updateBtn.disabled = true;
        
        // Update quiz
        const { error: quizError } = await supabaseClient
            .from('quizzes')
            .update({
                title,
                description,
                course_id: courseId
            })
            .eq('id', quizId);
        
        if (quizError) throw quizError;
        
        // Upload new files if any
        if (quizFiles.length > 0) {
            // Get current user
            const { data: { user } } = await supabaseClient.auth.getUser();
            
            for (let i = 0; i < quizFiles.length; i++) {
                const file = quizFiles[i];
                
                // Upload file to storage
                const filePath = `quizzes/${quizId}/${file.name}`;
                const { error: storageError } = await supabaseClient.storage
                    .from('quiz_files')
                    .upload(filePath, file);
                
                if (storageError) throw storageError;
                
                // Public URL generation removed (unused variable)
                // const { data: { publicUrl } } = supabase.storage
                //     .from('quiz_files')
                //     .getPublicUrl(filePath);
                
                // Insert file record
                const { error: fileError } = await supabaseClient
                    .from('quiz_files')
                    .insert({
                        quiz_id: quizId,
                        file_name: file.name,
                        file_path: filePath,
                        file_type: file.type,
                        file_size: file.size,
                        uploaded_by: user.id
                    });
                
                if (fileError) throw fileError;
            }
        }
        
        // Reset form
        document.getElementById('editQuizForm').reset();
        
        // Close modal
        const modal = bootstrap.Modal.getInstance(document.getElementById('editQuizModal'));
        modal.hide();
        
        // Reload quizzes
        loadQuizzes();
        
        // Show success message
        alert('Quiz updated successfully!');
    } catch (error) {
        console.error('Error updating quiz:', error);
        const errorElement = document.getElementById('editQuizError');
        errorElement.textContent = `Failed to update quiz: ${error.message}`;
        errorElement.classList.remove('d-none');
    } finally {
        // Re-enable update button
        const updateBtn = document.getElementById('updateQuizBtn');
        updateBtn.innerHTML = 'Update Quiz';
        updateBtn.disabled = false;
    }
}

// Delete a quiz file
async function deleteQuizFile(fileId) {
    try {
        // Get file data first to get the file path
        const { data, error: getError } = await supabaseClient
            .from('quiz_files')
            .select('file_path')
            .eq('id', fileId)
            .single();
        
        if (getError) throw getError;
        
        // Delete from storage
        const { error: storageError } = await supabaseClient.storage
            .from('quiz_files')
            .remove([data.file_path]);
        
        if (storageError) throw storageError;
        
        // Delete from database
        const { error: dbError } = await supabaseClient
            .from('quiz_files')
            .delete()
            .eq('id', fileId);
        
        if (dbError) throw dbError;
        
        return true;
    } catch (error) {
        console.error('Error deleting quiz file:', error);
        alert('Failed to delete file. Please try again.');
        return false;
    }
}

// Handle deleting a quiz
async function handleDeleteQuiz() {
    try {
        const quizId = document.getElementById('deleteQuizId').value;
        
        // Disable delete button
        const deleteBtn = document.getElementById('confirmDeleteQuizBtn');
        deleteBtn.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Deleting...';
        deleteBtn.disabled = true;
        
        // Get all files for this quiz
        const { data: filesData, error: filesError } = await supabaseClient
            .from('quiz_files')
            .select('file_path')
            .eq('quiz_id', quizId);
        
        if (filesError) throw filesError;
        
        // Delete files from storage if any
        if (filesData && filesData.length > 0) {
            const filePaths = filesData.map(file => file.file_path);
            
            const { error: storageError } = await supabaseClient.storage
                .from('quiz_files')
                .remove(filePaths);
            
            if (storageError) throw storageError;
        }
        
        // Delete quiz (this will cascade delete the quiz_files records)
        const { error: quizError } = await supabaseClient
            .from('quizzes')
            .delete()
            .eq('id', quizId);
        
        if (quizError) throw quizError;
        
        // Close modal
        const modal = bootstrap.Modal.getInstance(document.getElementById('deleteQuizModal'));
        modal.hide();
        
        // Reload quizzes
        loadQuizzes();
        
        // Show success message
        alert('Quiz deleted successfully!');
    } catch (error) {
        console.error('Error deleting quiz:', error);
        alert(`Failed to delete quiz: ${error.message}`);
    } finally {
        // Re-enable delete button
        const deleteBtn = document.getElementById('confirmDeleteQuizBtn');
        deleteBtn.innerHTML = 'Delete';
        deleteBtn.disabled = false;
    }
}

// Helper function to format file size
function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Helper function to get file type icon
function getFileTypeIcon(fileType) {
    if (fileType.includes('pdf')) {
        return 'fas fa-file-pdf text-danger';
    } else if (fileType.includes('word') || fileType.includes('doc')) {
        return 'fas fa-file-word text-primary';
    } else if (fileType.includes('excel') || fileType.includes('sheet') || fileType.includes('csv')) {
        return 'fas fa-file-excel text-success';
    } else if (fileType.includes('powerpoint') || fileType.includes('presentation')) {
        return 'fas fa-file-powerpoint text-warning';
    } else if (fileType.includes('image')) {
        return 'fas fa-file-image text-info';
    } else if (fileType.includes('zip') || fileType.includes('compressed')) {
        return 'fas fa-file-archive text-secondary';
    } else {
        return 'fas fa-file text-secondary';
    }
}
