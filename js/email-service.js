// Email Service Module for NIIT School Management System

// Check if a user has enabled notifications for a specific type
async function isNotificationEnabled(userId, notificationType) {
    try {
        const { data, error } = await supabaseClient
            .from('email_notifications')
            .select('enabled')
            .eq('user_id', userId)
            .eq('notification_type', notificationType)
            .single();
        
        if (error) {
            console.error('Error checking notification status:', error.message);
            return false;
        }
        
        return data ? data.enabled : false;
    } catch (error) {
        console.error('Error checking notification status:', error.message);
        return false;
    }
}

// Send attendance notification email
async function sendAttendanceNotification(studentId, courseId, date, status) {
    try {
        // Get student details
        const { data: studentData, error: studentError } = await supabaseClient
            .from('students')
            .select('name, email')
            .eq('id', studentId)
            .single();
        
        if (studentError) throw studentError;
        
        // Get course details
        const { data: courseData, error: courseError } = await supabaseClient
            .from('courses')
            .select('name')
            .eq('id', courseId)
            .single();
        
        if (courseError) throw courseError;
        
        // Format date for display
        const formattedDate = new Date(date).toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
        
        // Prepare email data
        const emailData = {
            to: studentData.email,
            subject: `Attendance Update: ${courseData.name}`,
            body: `
                <h2>Attendance Update</h2>
                <p>Hello ${studentData.name},</p>
                <p>Your attendance for <strong>${courseData.name}</strong> on <strong>${formattedDate}</strong> has been marked as <strong>${status}</strong>.</p>
                <p>If you believe this is incorrect, please contact your instructor or administrator.</p>
                <p>Thank you,<br>NIIT School Management System</p>
            `,
            student_id: studentId,
            notification_type: 'attendance'
        };
        
        // Call Supabase Edge Function to send email
        // In a real implementation, this would call a serverless function
        // For now, we'll just log the email data
        console.log('Email notification would be sent:', emailData);
        
        // In a real implementation with Supabase Edge Functions:
        // const { data, error } = await supabase.functions.invoke('send-email', { body: emailData });
        // if (error) throw error;
        
        return true;
    } catch (error) {
        console.error('Error sending attendance notification:', error.message);
        return false;
    }
}

// Send quiz notification email
async function sendQuizNotification(studentIds, quizId) {
    try {
        // Get quiz details
        const { data: quizData, error: quizError } = await supabaseClient
            .from('quizzes')
            .select(`
                title,
                description,
                courses(name)
            `)
            .eq('id', quizId)
            .single();
        
        if (quizError) throw quizError;
        
        // Get student details
        const { data: studentsData, error: studentsError } = await supabaseClient
            .from('students')
            .select('id, name, email')
            .in('id', studentIds);
        
        if (studentsError) throw studentsError;
        
        // Send email to each student
        for (const student of studentsData) {
            // Check if student has enabled quiz notifications
            const notificationsEnabled = await isNotificationEnabled(student.id, 'quiz');
            
            if (!notificationsEnabled) continue;
            
            // Prepare email data
            const emailData = {
                to: student.email,
                subject: `New Quiz: ${quizData.title}`,
                body: `
                    <h2>New Quiz Available</h2>
                    <p>Hello ${student.name},</p>
                    <p>A new quiz titled <strong>${quizData.title}</strong> has been added to your course <strong>${quizData.courses.name}</strong>.</p>
                    <p><strong>Description:</strong> ${quizData.description || 'No description provided.'}</p>
                    <p>Please log in to the system to access the quiz materials.</p>
                    <p>Thank you,<br>NIIT School Management System</p>
                `,
                student_id: student.id,
                notification_type: 'quiz'
            };
            
            // Call Supabase Edge Function to send email
            // In a real implementation, this would call a serverless function
            // For now, we'll just log the email data
            console.log('Email notification would be sent:', emailData);
            
            // In a real implementation with Supabase Edge Functions:
            // const { data, error } = await supabase.functions.invoke('send-email', { body: emailData });
            // if (error) throw error;
        }
        
        return true;
    } catch (error) {
        console.error('Error sending quiz notification:', error.message);
        return false;
    }
}

// Export functions
window.emailService = {
    isNotificationEnabled,
    sendAttendanceNotification,
    sendQuizNotification
};
