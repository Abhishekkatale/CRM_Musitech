# Database Setup Instructions

## Prerequisites
1. Supabase project set up
2. Supabase CLI installed
3. Database migration files in place

## Step 1: Run the Migration

Run the complete user management system migration:

```bash
# Navigate to your project directory
cd /home/abhishek/Documents/CRM_MUSITECH

# Apply the migration
supabase db push
```

## Step 2: Create Initial Admin User

After running the migration, you need to create an initial admin user manually:

### Option A: Using Supabase Dashboard
1. Go to your Supabase project dashboard
2. Navigate to Authentication > Users
3. Click "Add user" and create a user with:
   - Email: `admin@musitech.com`
   - Password: `admin123` (change this in production!)
   - Auto Confirm User: Yes

### Option B: Using SQL
Run this SQL in your Supabase SQL editor:

```sql
-- Insert admin profile
INSERT INTO public.profiles (
  auth_user_id,
  email,
  full_name,
  role,
  status
) VALUES (
  'YOUR_ADMIN_USER_ID_FROM_AUTH_USERS', -- Replace with actual user ID
  'admin@musitech.com',
  'System Administrator',
  'admin',
  'active'
);
```

## Step 3: Test the System

1. Start your development server:
   ```bash
   npm run dev
   ```

2. Navigate to `http://localhost:5173/auth`

3. Login with the admin credentials:
   - Email: `admin@musitech.com`
   - Password: `admin123`

4. You should be redirected to the Admin Dashboard

## Step 4: Create Test Clients

From the Admin Dashboard:
1. Click "Create Client"
2. Fill in the form with test data:
   - Full Name: `John Doe`
   - Email: `client@example.com`
   - Password: `client123`
   - Company Name: `Example Corp`
   - Company Domain: `example.com`

3. The client will be created and can now login at `/auth`

## Step 5: Create Test Subusers

From the Client Dashboard:
1. Login as the client you just created
2. Click "Create Subuser"
3. Fill in the form:
   - Full Name: `Jane Smith`
   - Email: `subuser@example.com`
   - Password: `subuser123`
   - Role Template: `Social Media Manager`

4. The subuser will be created with appropriate permissions

## Security Notes

⚠️ **Important Security Considerations:**

1. **Change Default Passwords**: Update all default passwords in production
2. **Environment Variables**: Use environment variables for sensitive data
3. **Row Level Security**: The migration includes RLS policies for data isolation
4. **Audit Logging**: All actions are logged for compliance
5. **Password Hashing**: Passwords are automatically hashed using bcrypt

## Troubleshooting

### Common Issues:

1. **Migration Fails**: Check that you have the correct Supabase project linked
2. **RLS Policies**: Ensure RLS is enabled on all tables
3. **Auth Issues**: Verify the auth user exists before creating profiles
4. **Permission Errors**: Check that the user has the correct role

### Reset Database (Development Only):
```bash
supabase db reset
```

## Production Deployment

For production deployment:

1. Update environment variables
2. Change all default passwords
3. Configure proper CORS settings
4. Set up proper backup procedures
5. Monitor audit logs regularly
6. Implement proper session management
7. Set up proper error logging and monitoring

## API Endpoints

The system provides these key functions:

- `create_client()` - Create new client accounts
- `create_subuser()` - Create new subuser accounts  
- `log_user_action()` - Log user actions for audit
- `update_last_login()` - Update user login timestamps

## Database Schema

The system includes these main tables:

- `profiles` - User profiles with roles
- `clients` - Client company information
- `subusers` - Subuser accounts with permissions
- `audit_logs` - Comprehensive audit trail
- `user_sessions` - JWT session management

All tables include proper foreign key relationships and RLS policies for security.
