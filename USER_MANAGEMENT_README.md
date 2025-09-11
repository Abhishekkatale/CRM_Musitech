# CRM User Management System

A comprehensive, scalable user management system for CRM applications with hierarchical role-based access control (RBAC).

## 🏗️ System Architecture

### User Hierarchy
```
Admin (Agency Employee)
├── Client 1 (Agency's Client)
│   ├── Sub-user 1 (Social Media Manager)
│   ├── Sub-user 2 (Analytics Viewer)
│   └── Sub-user 3 (Campaign Manager)
├── Client 2
│   └── Sub-user 4 (Lead Manager)
└── Client 3
    └── Sub-user 5 (Full Access)
```

## 👥 User Roles & Capabilities

### 1. Admin (Agency Employee)
- **Authentication**: Secure JWT-based sessions with hashed passwords
- **Client Management**:
  - Create and manage client accounts
  - Assign username & password to clients
  - Update client details (name, email, company)
  - Deactivate/reactivate client accounts
- **Access Control**:
  - Reset client passwords
  - Suspend/unsuspend accounts
- **Audit & Compliance**:
  - View and export comprehensive audit logs
  - Track all account creation/updates
  - Monitor system activity

### 2. Client (Agency's Client)
- **Authentication**: Admin-provided credentials
- **Workspace**: Separate, isolated workspace per client
- **Sub-user Management**:
  - Create sub-user accounts
  - Assign username & password to sub-users
  - Define custom roles and permissions
  - Update/deactivate/reactivate sub-users
- **Permission Control**:
  - Control module access (Leads, Campaigns, Reports, etc.)
  - Set granular permissions (read, write, delete, admin)
  - Use predefined role templates
- **Audit**: View audit logs for their workspace

### 3. Sub-user (Client's Team Member)
- **Authentication**: Client-provided credentials
- **Access**: Limited to assigned client's workspace
- **Permissions**: Strictly limited to client-assigned permissions
- **Restrictions**: Cannot create other accounts

## 🔐 Security Features

### Authentication & Authorization
- **JWT Tokens**: Secure session management with refresh tokens
- **Password Hashing**: bcrypt encryption for all passwords
- **Row Level Security**: Database-level access control
- **Role-based Access**: Hierarchical permission system

### Data Isolation
- **Client Separation**: Complete data isolation between clients
- **Sub-user Scope**: Sub-users can only access their client's data
- **Permission Boundaries**: Strict enforcement of assigned permissions

### Audit & Compliance
- **Comprehensive Logging**: All user actions tracked
- **Export Capabilities**: CSV export of audit logs
- **IP Tracking**: Login attempts and actions logged with IP
- **User Agent Logging**: Device/browser tracking

## 🗄️ Database Schema

### Core Tables
- **`profiles`**: User profiles with roles and status
- **`clients`**: Client company information
- **`subusers`**: Sub-user accounts with permissions
- **`audit_logs`**: Comprehensive audit trail
- **`user_sessions`**: JWT session management

### Key Features
- **Foreign Key Relationships**: Proper data integrity
- **Indexes**: Optimized for performance
- **Triggers**: Automatic timestamp updates
- **Functions**: Secure user creation and management

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- Supabase account and project
- Supabase CLI

### Installation
1. **Clone and Install**:
   ```bash
   cd /home/abhishek/Documents/CRM_MUSITECH
   npm install
   ```

2. **Database Setup**:
   ```bash
   # Apply the migration
   supabase db push
   ```

3. **Create Admin User**:
   - Use Supabase Dashboard or SQL editor
   - Create user in Authentication > Users
   - Insert corresponding profile record

4. **Start Development**:
   ```bash
   npm run dev
   ```

### Initial Setup
1. Login as admin at `/auth`
2. Create your first client from Admin Dashboard
3. Login as client and create sub-users
4. Test the complete workflow

## 📱 User Interfaces

### Admin Dashboard (`/admin`)
- **Client Management**: Create, view, activate/deactivate clients
- **Audit Logs**: View and export system activity
- **Statistics**: Overview of system usage
- **User Creation**: Secure client account creation

### Client Dashboard (`/client`)
- **Sub-user Management**: Create and manage team members
- **Permission Control**: Granular permission assignment
- **Role Templates**: Predefined permission sets
- **Audit Logs**: Workspace-specific activity logs

### Sub-user Dashboard (`/subuser`)
- **Module Access**: Role-based module visibility
- **Permission Display**: Clear indication of available actions
- **Activity Overview**: Recent actions and statistics
- **Restricted Access**: Only assigned modules visible

## 🔧 API Functions

### User Management
- `create_client()`: Secure client account creation
- `create_subuser()`: Sub-user account creation with permissions
- `update_user_status()`: Activate/deactivate accounts
- `update_subuser_permissions()`: Modify user permissions

### Audit & Logging
- `log_user_action()`: Comprehensive action logging
- `update_last_login()`: Track user activity
- `get_audit_logs()`: Retrieve audit history

### Authentication
- JWT token management
- Refresh token handling
- Session persistence
- Secure logout

## 🛡️ Security Best Practices

### Implemented
- ✅ Password hashing with bcrypt
- ✅ JWT token management
- ✅ Row Level Security (RLS)
- ✅ Input validation and sanitization
- ✅ SQL injection prevention
- ✅ XSS protection
- ✅ CSRF protection
- ✅ Audit logging

### Production Recommendations
- 🔄 Regular security audits
- 🔄 Rate limiting implementation
- 🔄 Two-factor authentication
- 🔄 Session timeout policies
- 🔄 Regular password rotation
- 🔄 Monitoring and alerting

## 📊 Permission System

### Modules
- **Dashboard**: Overview and metrics
- **Leads**: Lead management
- **Campaigns**: Marketing campaigns
- **Reports**: Analytics and reporting
- **Integrations**: Third-party connections
- **Attribution**: Marketing attribution
- **Analytics**: Advanced analytics
- **User Management**: Account administration

### Actions
- **Read**: View-only access
- **Write**: Create and modify
- **Delete**: Remove content
- **Admin**: Full administrative control

### Role Templates
- **Social Media Manager**: Campaign and lead management
- **Analytics Viewer**: Read-only analytics access
- **Campaign Manager**: Full campaign control
- **Lead Manager**: Lead-focused permissions
- **Full Access**: Complete system access

## 🔍 Monitoring & Maintenance

### Audit Logs
- User login/logout events
- Account creation/modification
- Permission changes
- Status updates
- System errors

### Performance Monitoring
- Database query optimization
- Index usage analysis
- Session management efficiency
- API response times

### Maintenance Tasks
- Regular database backups
- Audit log cleanup
- Session token cleanup
- Performance optimization

## 🚨 Troubleshooting

### Common Issues
1. **Migration Errors**: Check Supabase connection and permissions
2. **Authentication Issues**: Verify user exists in auth.users
3. **Permission Errors**: Check RLS policies and user roles
4. **Session Problems**: Clear browser storage and retry

### Debug Mode
- Enable detailed logging
- Check browser console
- Review Supabase logs
- Verify database state

## 📈 Scalability Considerations

### Current Architecture
- Supports multiple clients
- Scalable sub-user management
- Efficient permission checking
- Optimized database queries

### Future Enhancements
- Multi-tenant architecture
- Advanced permission inheritance
- Bulk user operations
- API rate limiting
- Caching layer implementation

## 🤝 Contributing

### Development Guidelines
- Follow TypeScript best practices
- Maintain comprehensive test coverage
- Update documentation for changes
- Follow security-first approach

### Code Structure
- `src/contexts/`: Authentication context
- `src/hooks/`: Custom React hooks
- `src/utils/`: Utility functions
- `src/pages/`: Page components
- `supabase/migrations/`: Database migrations

## 📄 License

This project is part of the CRM Musitech system. All rights reserved.

---

**Note**: This system is designed for production use with proper security measures. Always follow security best practices and conduct regular security audits.
