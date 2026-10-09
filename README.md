# NIIT School Management System

A comprehensive school management application for NIIT that handles student registration, course management, attendance tracking, and administrative functions.

## Features

### Core Features
- Student Registration
- Course Management
- Attendance Tracking
- Admin Dashboard

### Additional Features
- Quiz Upload/Download Area
- Google Login Integration
- Notification preferences

## Tech Stack
- Frontend: HTML, CSS, JavaScript, Bootstrap 5
- Backend/Database: Supabase
- Deployment: Netlify

## Getting Started

1. Clone this repository.
2. Serve the folder over HTTP, for example `php -S localhost:8000`.
3. Set the current Supabase project URL and anon key in `js/config.js`.
4. Run `supabase-schema-fixed.sql` in the Supabase SQL Editor for a new database.
5. Run `db/fix-role-permissions.sql` for an existing database.
6. Run `db/bootstrap-admin.sql` with an approved administrator email.
7. Deploy `supabase/functions/delete-user` with `supabase functions deploy delete-user`.

## Project Structure
```
/
├── index.html              # Main entry point
├── index.html              # Login page
├── dashboard.html          # Dashboard
├── students.html           # Student management
├── courses.html            # Course and enrollment management
├── attendance.html         # Attendance management
├── quizzes.html            # Quiz management
├── settings.html           # User settings
├── reset-password.html     # Password reset destination
├── css/                    # Application styles
├── js/                     # Application modules
└── db/                     # Database migrations
```

## Deployment
This project is configured for Netlify in `netlify.toml`.

## License
[MIT License](LICENSE)
