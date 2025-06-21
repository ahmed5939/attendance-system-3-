# Attendance System

A comprehensive attendance management system built with Next.js, Clerk authentication, Prisma ORM, and Tailwind CSS. Features include user management, classroom management, attendance tracking, and face recognition capabilities.

## Features

- **User Management**: Role-based access control (Admin, Teacher, Student)
- **Classroom Management**: Create and manage classes with capacity and location
- **Attendance Tracking**: Record and monitor student attendance
- **Face Recognition**: Admin-only automated attendance using Python-based face recognition
- **Whitelist System**: Controlled user registration through admin-approved whitelist
- **Automatic User Sync**: Seamless user account creation from whitelist on login
- **System Administration**: Comprehensive admin dashboard with system monitoring
- **Real-time Dashboard**: Live statistics and attendance monitoring
- **Responsive Design**: Modern UI with Tailwind CSS

## Tech Stack

- **Frontend**: Next.js 14, React, TypeScript
- **Authentication**: Clerk
- **Database**: PostgreSQL with Prisma ORM
- **Styling**: Tailwind CSS, shadcn/ui components
- **Data Fetching**: SWR for client-side data management
- **Face Recognition**: Python Flask server with face_recognition library
- **Backend Services**: Node.js API routes with Python microservice

## Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Next.js App   │    │  Python Server  │    │   PostgreSQL    │
│   (Frontend)    │◄──►│ (Face Recognition)│    │   (Database)    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Clerk Auth    │    │   SQLite DB     │    │   Prisma ORM    │
│   (Identity)    │    │ (Face Encodings)│    │   (Data Layer)  │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## Getting Started

### 1. Prerequisites
- Node.js 18+ 
- Python 3.8+ (for face recognition server)
- PostgreSQL database
- Clerk account for authentication

### 2. Installation
```bash
git clone <repository-url>
cd attendance-system
npm install
```

### 3. Environment Setup
Create a `.env.local` file with the following variables:
```env
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/attendance_system"

# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
CLERK_SECRET_KEY=your_clerk_secret_key
CLERK_WEBHOOK_SECRET=your_webhook_secret

# App Configuration
NEXT_PUBLIC_CLERK_SIGN_IN_URL=http://localhost:3000/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=http://localhost:3000/sign-up

# Python Face Recognition Server
PYTHON_SERVER_URL=http://localhost:5000
```

### 4. Database Setup
```bash
# Generate Prisma client
npx prisma generate

# Push schema to database
npx prisma db push

# Seed initial data (optional)
npm run seed
```

### 5. Python Face Recognition Server Setup
```bash
# Navigate to Python server directory
cd python_server

# Install system dependencies (Ubuntu/Debian)
sudo apt-get update
sudo apt-get install -y build-essential cmake libopenblas-dev liblapack-dev libx11-dev libgtk-3-dev libboost-python-dev python3-dev python3-pip python3-venv

# Use the startup script (recommended)
chmod +x start.sh
./start.sh

# Or manually set up
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
python app.py
```

### 6. Clerk Webhook Setup
1. Go to your Clerk Dashboard
2. Navigate to Webhooks
3. Create a new webhook endpoint: `https://your-domain.com/api/webhooks/clerk`
4. Select events: `user.created`, `user.updated`, `user.deleted`, `invitation.accepted`
5. Copy the webhook secret to your `.env` file

### 7. Initial Admin Setup
The seed script creates these admin accounts:
- `admin@school.edu` - System Administrator
- `principal@school.edu` - School Principal

Sign up with one of these emails to access admin features.

## Usage

### For Administrators
1. **Manage Whitelist**: Add/remove users from `/admin/whitelist`
2. **System Administration**: Monitor system health and performance from `/admin/system`
3. **Face Recognition**: Configure and manage face recognition system from `/face-recognition`
4. **User Management**: Monitor user activity and roles

### For Teachers
1. **Create Classes**: Set up classrooms with capacity and location
2. **Schedule Sessions**: Create attendance sessions for classes
3. **Track Attendance**: Monitor student attendance and generate reports

### For Students
1. **View Classes**: See enrolled classes and schedules
2. **Check Attendance**: View personal attendance records

## Face Recognition System

The face recognition system is **admin-only** and consists of:

### Python Server Features
- **Face Registration**: Register student faces with high accuracy
- **Face Recognition**: Real-time face detection and matching
- **Configuration Management**: Adjustable recognition thresholds
- **SQLite Database**: Local storage of face encodings
- **RESTful API**: Clean HTTP endpoints for integration

### Security & Access Control
- **Admin-Only Access**: Only administrators can access face recognition features
- **Secure API**: All endpoints require admin authentication
- **Data Privacy**: Face encodings stored locally on the Python server
- **Audit Trail**: All recognition events are logged

### API Endpoints
- `POST /api/face-recognition/register` - Register student face
- `POST /api/face-recognition` - Recognize faces in images
- `GET /api/face-recognition` - Get registered faces

## System Administration

The system administration dashboard (`/admin/system`) provides:

### System Overview
- Database status and health
- Active users and sessions
- System performance metrics
- Quick administrative actions

### Performance Monitoring
- CPU and memory usage
- Disk space utilization
- Network activity
- Real-time system metrics

### Security Management
- Maintenance mode toggle
- Two-factor authentication settings
- Session timeout configuration
- Security alerts and logs

### Backup & Recovery
- Automated backup configuration
- Manual backup creation
- Backup history and status
- Retention policy management

## Automatic User Sync Feature

The system now includes an automatic user synchronization feature that:

1. **Checks on Login**: When a user logs in, the system automatically checks if they exist in the database
2. **Whitelist Verification**: If the user doesn't exist, it checks the whitelist for their email
3. **Automatic Creation**: If found in the whitelist, creates their account with the appropriate role and profile
4. **Profile Setup**: Automatically creates Student or Teacher profiles based on their whitelist entry
5. **Status Tracking**: Updates the whitelist to mark the account as created

### How it Works

1. **User logs in** → Clerk authentication succeeds
2. **Sync Hook Triggers** → `useSyncUser` hook runs automatically
3. **API Call** → `/api/auth/sync-user` endpoint is called
4. **Database Check** → System checks if user exists in database
5. **Whitelist Lookup** → If not found, searches whitelist by email
6. **Account Creation** → Creates user account with role and profile
7. **Success Notification** → User sees welcome message

### Benefits

- **Seamless Experience**: Users don't need to manually create accounts
- **Controlled Access**: Only whitelisted users can access the system
- **Automatic Role Assignment**: Users get correct roles based on whitelist
- **Profile Creation**: Student/Teacher profiles are created automatically
- **Audit Trail**: Tracks when accounts are created from whitelist

## API Endpoints

### Authentication
- `POST /api/auth/check-whitelist` - Check if user is whitelisted
- `POST /api/auth/sync-user` - Sync user account from whitelist

### Admin
- `GET /api/admin/whitelist` - Get all whitelisted users
- `POST /api/admin/whitelist` - Add user to whitelist
- `DELETE /api/admin/whitelist/[id]` - Remove user from whitelist

### Users
- `GET /api/users/me` - Get current user profile

### Classes
- `GET /api/classrooms` - Get all classes
- `POST /api/classrooms` - Create new class
- `GET /api/classrooms/[id]` - Get specific class
- `PUT /api/classrooms/[id]` - Update class
- `DELETE /api/classrooms/[id]` - Delete class

### Sessions
- `GET /api/sessions` - Get all sessions
- `POST /api/sessions` - Create new session

### Students & Teachers
- `GET /api/students` - Get all students
- `POST /api/students` - Create student profile
- `GET /api/teachers` - Get all teachers

### Face Recognition (Admin Only)
- `POST /api/face-recognition/register` - Register student face
- `POST /api/face-recognition` - Recognize faces
- `GET /api/face-recognition` - Get registered faces

### Statistics
- `GET /api/stats` - Get system statistics

## Development

### Running the Application
```bash
# Terminal 1: Start Next.js app
npm run dev

# Terminal 2: Start Python face recognition server
cd python_server
./start.sh
```

### Database Management
```bash
# View database in Prisma Studio
npx prisma studio

# Reset database
npx prisma db push --force-reset

# Generate Prisma client after schema changes
npx prisma generate
```

### Testing
```bash
npm run test
```

## Production Deployment

### Next.js Application
- Deploy to Vercel, Netlify, or your preferred hosting platform
- Set up environment variables
- Configure Clerk webhooks for production domain

### Python Face Recognition Server
- Deploy to a server with Python 3.8+
- Use Gunicorn or uWSGI for production
- Set up SSL/TLS certificates
- Configure firewall rules
- Set up monitoring and logging

### Database
- Use a managed PostgreSQL service (AWS RDS, Google Cloud SQL, etc.)
- Set up automated backups
- Configure connection pooling

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License. 