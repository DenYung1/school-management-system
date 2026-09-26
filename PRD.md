# Product Requirements Document (PRD)
# NIIT School Management System

## 1. Introduction

### 1.1 Purpose
This document outlines the requirements for developing a School Management System for NIIT. The system aims to streamline administrative processes, improve student management, and enhance the overall educational experience for both students and staff.

### 1.2 Scope
The School Management System will provide functionalities for student registration, course management, attendance tracking, and administrative oversight. The system will be web-based, accessible to authorized users, and will serve as a central platform for managing educational operations at NIIT.

### 1.3 Target Audience
- NIIT Administrative Staff
- Faculty Members
- Students
- IT Support Personnel

## 2. Technical Stack

### 2.1 Frontend
- HTML5
- CSS3
- JavaScript
- Bootstrap 5

### 2.2 Backend/Database
- Supabase (open-source Firebase alternative)
  - Authentication
  - Database
  - Storage
  - Serverless Functions

### 2.3 Deployment
- Vercel (1-click deployment)

## 3. Core Features

### 3.1 Student Registration
#### 3.1.1 Requirements
- Capture student information:
  - Full Name
  - Email Address
  - Program Enrolled
  - Course Selection
  - Phone Number
- Generate unique student ID
- Store student profile pictures (optional)
- Email verification for registered accounts
- Form validation for all input fields

#### 3.1.2 User Stories
- As an administrator, I want to register new students so that they can be added to the system.
- As a student, I want to view and update my profile information.

### 3.2 Course Management
#### 3.2.1 Requirements
- Add new courses with details:
  - Course Name
  - Course Code
  - Description
  - Duration
  - Faculty Assigned
- View list of all available courses
- Edit course details
- Assign students to specific courses
- Set maximum capacity for each course
- Track enrollment status

#### 3.2.2 User Stories
- As an administrator, I want to create and manage courses offered by the institution.
- As an administrator, I want to assign students to specific courses.
- As a student, I want to view courses I am enrolled in.

### 3.3 Attendance Tracking
#### 3.3.1 Requirements
- Daily attendance recording mechanism
- Manual entry interface for staff
- Date and time stamping
- Attendance status options (Present, Absent, Late)
- View attendance history by student
- View attendance history by course
- Generate attendance reports

#### 3.3.2 User Stories
- As a faculty member, I want to mark attendance for students in my class.
- As an administrator, I want to view attendance records for all students.
- As a student, I want to check my attendance history.

### 3.4 Admin Dashboard
#### 3.4.1 Requirements
- Overview of key metrics:
  - Total number of students
  - Total number of courses
  - Daily attendance statistics
  - Recent registrations
- Quick access to main functions
- Basic data visualization (charts/graphs)
- User management controls

#### 3.4.2 User Stories
- As an administrator, I want to have a centralized view of all system activities.
- As an administrator, I want to quickly access different sections of the system.

## 4. Bonus Features (Optional)

### 4.1 Quiz Management
#### 4.1.1 Requirements
- Upload quiz materials in various formats (PDF, DOCX, etc.)
- Download quiz materials
- Organize quizzes by course
- Set visibility permissions

#### 4.1.2 User Stories
- As a faculty member, I want to upload quiz materials for students.
- As a student, I want to download quiz materials for my courses.

### 4.2 Google Login Integration
#### 4.2.1 Requirements
- Enable sign-in with Google accounts
- Link existing accounts with Google
- Synchronize basic profile information

#### 4.2.2 User Stories
- As a user, I want to log in using my Google account for convenience.
- As an administrator, I want to provide multiple authentication options for users.

### 4.3 Email Notifications
#### 4.3.1 Requirements
- Send automated emails for attendance status
- Daily/weekly attendance summaries
- Customizable notification settings
- Email templates for different notification types

#### 4.3.2 User Stories
- As an administrator, I want to send automated attendance notifications to students.
- As a student, I want to receive email notifications about my attendance status.

## 5. User Interface Requirements

### 5.1 General UI Requirements
- Responsive design for all screen sizes
- Consistent color scheme aligned with NIIT branding
- Intuitive navigation
- Accessibility compliance
- Loading indicators for asynchronous operations
- Error messages for failed operations

### 5.2 Key Screens
1. Login/Registration Page
2. Student Dashboard
3. Admin Dashboard
4. Course Management Interface
5. Attendance Recording Interface
6. Reports and Analytics Page
7. User Profile Management

## 6. Non-Functional Requirements

### 6.1 Performance
- Page load time under 3 seconds
- Support for at least 100 concurrent users
- Database query response time under 1 second

### 6.2 Security
- Role-based access control
- Encrypted data transmission (HTTPS)
- Secure password storage
- Protection against common web vulnerabilities (XSS, CSRF, SQL Injection)
- Regular security audits

### 6.3 Reliability
- System availability of 99.5% during operational hours
- Automated database backups
- Error logging and monitoring

### 6.4 Scalability
- Ability to handle increasing number of users
- Modular architecture for future feature additions

## 7. Constraints and Assumptions

### 7.1 Constraints
- Development timeline: To be determined
- Budget limitations: To be determined
- Technical limitations of Supabase and Vercel free tiers

### 7.2 Assumptions
- Users have basic computer literacy
- Users have access to internet-connected devices
- NIIT will provide necessary content and branding materials
- NIIT will assign personnel for system testing and feedback

## 8. Implementation Phases

### 8.1 Phase 1: Core System Development
- User authentication system
- Student registration functionality
- Basic course management
- Simple admin dashboard

### 8.2 Phase 2: Feature Enhancement
- Attendance tracking system
- Advanced course management
- Enhanced admin dashboard
- Basic reporting capabilities

### 8.3 Phase 3: Advanced Features (Optional)
- Quiz upload/download functionality
- Google login integration
- Email notification system
- Advanced analytics and reporting

## 9. Success Metrics

### 9.1 Quantitative Metrics
- 90% of student registrations completed successfully
- 95% of attendance records captured accurately
- System downtime less than 0.5% during operational hours

### 9.2 Qualitative Metrics
- Positive user feedback on system usability
- Reduction in administrative workload
- Improved data accuracy compared to previous methods

## 10. Appendix

### 10.1 Glossary
- **NIIT**: National Institute of Information Technology
- **SMS**: School Management System
- **Supabase**: Open-source Firebase alternative for backend services
- **Vercel**: Platform for frontend framework deployment

### 10.2 References
- Supabase Documentation: https://supabase.io/docs
- Vercel Documentation: https://vercel.com/docs
- Bootstrap Documentation: https://getbootstrap.com/docs/5.0/

---

Document Version: 1.0  
Last Updated: May 10, 2025  
Prepared by: Cascade AI
