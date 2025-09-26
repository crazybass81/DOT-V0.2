# Data Model Design

## Database Schema

### Core Entities

#### 1. Users
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin', 'manager', 'employee')),
  department TEXT,
  phone TEXT,
  language TEXT DEFAULT 'ko',
  avatar_url TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can read their own data" ON users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Managers can read all users" ON users
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
      AND role IN ('admin', 'manager')
    )
  );
```

#### 2. Organizations
```sql
CREATE TABLE organizations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('restaurant', 'cafe', 'bar', 'franchise')),
  address TEXT,
  phone TEXT,
  business_hours JSONB,
  settings JSONB DEFAULT '{}',
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### 3. Attendance
```sql
CREATE TABLE attendance (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) NOT NULL,
  org_id UUID REFERENCES organizations(id) NOT NULL,
  check_in TIMESTAMP WITH TIME ZONE,
  check_out TIMESTAMP WITH TIME ZONE,
  break_start TIMESTAMP WITH TIME ZONE,
  break_end TIMESTAMP WITH TIME ZONE,
  status TEXT CHECK (status IN ('present', 'absent', 'late', 'leave')),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_attendance_user_date ON attendance(user_id, created_at);
CREATE INDEX idx_attendance_org_date ON attendance(org_id, created_at);
```

#### 4. Schedules
```sql
CREATE TABLE schedules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) NOT NULL,
  org_id UUID REFERENCES organizations(id) NOT NULL,
  date DATE NOT NULL,
  shift_start TIME NOT NULL,
  shift_end TIME NOT NULL,
  break_minutes INTEGER DEFAULT 0,
  position TEXT,
  notes TEXT,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, date)
);
```

#### 5. Payroll
```sql
CREATE TABLE payroll (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) NOT NULL,
  org_id UUID REFERENCES organizations(id) NOT NULL,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  base_salary DECIMAL(10,2),
  overtime_pay DECIMAL(10,2),
  deductions DECIMAL(10,2),
  bonuses DECIMAL(10,2),
  net_pay DECIMAL(10,2),
  status TEXT CHECK (status IN ('draft', 'approved', 'paid')),
  payment_date DATE,
  payment_method TEXT,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Supporting Tables

#### 6. Notifications
```sql
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) NOT NULL,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT,
  data JSONB,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### 7. Audit Logs
```sql
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id),
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID,
  old_values JSONB,
  new_values JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## State Management Structure

### Global State (Zustand)
```typescript
interface AppState {
  // User
  user: User | null;
  setUser: (user: User | null) => void;

  // Organization
  currentOrg: Organization | null;
  setCurrentOrg: (org: Organization | null) => void;

  // UI
  theme: 'light' | 'dark';
  toggleTheme: () => void;
  language: 'ko' | 'en' | 'ja' | 'zh';
  setLanguage: (lang: string) => void;

  // Notifications
  notifications: Notification[];
  addNotification: (notification: Notification) => void;
  markAsRead: (id: string) => void;
}
```

### Local State (Component Level)
- Form state: React Hook Form
- Table state: Pagination, sorting, filtering
- Modal state: Open/close, data
- Loading states: Per component

## API Contracts

### Authentication Endpoints
```typescript
// POST /api/auth/login
interface LoginRequest {
  email: string;
  password: string;
}

interface LoginResponse {
  user: User;
  session: Session;
}

// POST /api/auth/signup
interface SignupRequest {
  email: string;
  password: string;
  fullName: string;
  role: UserRole;
}

// POST /api/auth/logout
// GET /api/auth/session
```

### CRUD Operations
```typescript
// Generic CRUD pattern
interface CrudEndpoints<T> {
  list: GET `/api/{resource}` => T[];
  get: GET `/api/{resource}/{id}` => T;
  create: POST `/api/{resource}` => T;
  update: PUT `/api/{resource}/{id}` => T;
  delete: DELETE `/api/{resource}/{id}` => void;
}

// Applied to entities
type UserEndpoints = CrudEndpoints<User>;
type AttendanceEndpoints = CrudEndpoints<Attendance>;
type ScheduleEndpoints = CrudEndpoints<Schedule>;
```

### Real-time Subscriptions
```typescript
// Supabase Realtime channels
const channels = {
  attendance: 'realtime:attendance:org_id=*',
  schedules: 'realtime:schedules:org_id=*',
  notifications: 'realtime:notifications:user_id=*'
};
```

## Data Flow Architecture

### Request Flow
1. Client Component → API Route → Supabase Client → Database
2. Database → RLS Check → Response → API Route → Client

### Real-time Flow
1. Database Change → Postgres WAL → Realtime Server
2. Realtime Server → WebSocket → Client Subscription
3. Client Update → State Update → UI Re-render

### Caching Strategy
- Static data: ISR with 1 hour revalidation
- User data: SWR with 5 minute cache
- Real-time data: No cache, direct subscription

## Security Model

### Row Level Security (RLS)
- Users: Can read own, managers read all
- Attendance: Users read/write own, managers all
- Schedules: Read all, write by managers
- Payroll: Read own, write by admin

### API Security
- JWT validation on all routes
- Rate limiting: 100 requests/minute
- CORS: Restricted to app domain
- Input validation: Zod schemas

### Data Privacy
- PII encryption at rest
- Audit logs for sensitive operations
- GDPR compliance ready
- Data retention policies