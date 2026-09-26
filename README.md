# NIIT School Management System

A comprehensive school management application for NIIT that handles student registration, course management, attendance tracking, and administrative functions.

## Features

### Core Features
- Student Registration
- Course Management
- Attendance Tracking
- Admin Dashboard

### Bonus Features (Coming Soon)
- Quiz Upload/Download Area
- Google Login Integration
- Email Notification for Attendance

## Tech Stack
- Frontend: HTML, CSS, JavaScript, Bootstrap 5
- Backend/Database: Supabase
- Deployment: Vercel

## Getting Started

1. Clone this repository
2. Open `index.html` in your browser for local development
3. Set up Supabase credentials in `js/config.js`

## Project Structure
```
/
├── index.html              # Main entry point
├── pages/                  # HTML pages
│   ├── login.html
│   ├── dashboard.html
│   ├── students.html
│   ├── courses.html
│   └── attendance.html
├── css/                    # Stylesheets
│   ├── style.css
│   └── bootstrap.min.css
├── js/                     # JavaScript files
│   ├── app.js
│   ├── auth.js
│   ├── students.js
│   ├── courses.js
│   ├── attendance.js
│   └── config.js
└── assets/                 # Images and other assets
    └── img/
```

## Deployment
This project is configured for one-click deployment on Vercel.

## License
[MIT License](LICENSE)
