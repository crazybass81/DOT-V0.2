// API Type Definitions for DOT Platform V0.2

// Base Types
export type UUID = string;
export type ISODateTime = string;
export type ISODate = string;

// User Types
export enum UserRole {
  ADMIN = 'admin',
  MANAGER = 'manager',
  EMPLOYEE = 'employee'
}

export interface User {
  id: UUID;
  email: string;
  fullName: string;
  role: UserRole;
  department?: string;
  phone?: string;
  language: 'ko' | 'en' | 'ja' | 'zh';
  avatarUrl?: string;
  isActive: boolean;
  createdAt: ISODateTime;
  updatedAt: ISODateTime;
}

// Organization Types
export enum OrganizationType {
  RESTAURANT = 'restaurant',
  CAFE = 'cafe',
  BAR = 'bar',
  FRANCHISE = 'franchise'
}

export interface BusinessHours {
  monday?: { open: string; close: string };
  tuesday?: { open: string; close: string };
  wednesday?: { open: string; close: string };
  thursday?: { open: string; close: string };
  friday?: { open: string; close: string };
  saturday?: { open: string; close: string };
  sunday?: { open: string; close: string };
}

export interface Organization {
  id: UUID;
  name: string;
  type: OrganizationType;
  address?: string;
  phone?: string;
  businessHours?: BusinessHours;
  settings: Record<string, any>;
  createdBy: UUID;
  createdAt: ISODateTime;
  updatedAt: ISODateTime;
}

// Attendance Types
export enum AttendanceStatus {
  PRESENT = 'present',
  ABSENT = 'absent',
  LATE = 'late',
  LEAVE = 'leave'
}

export interface Attendance {
  id: UUID;
  userId: UUID;
  orgId: UUID;
  checkIn?: ISODateTime;
  checkOut?: ISODateTime;
  breakStart?: ISODateTime;
  breakEnd?: ISODateTime;
  status: AttendanceStatus;
  notes?: string;
  createdAt: ISODateTime;
  updatedAt: ISODateTime;
}

// Schedule Types
export interface Schedule {
  id: UUID;
  userId: UUID;
  orgId: UUID;
  date: ISODate;
  shiftStart: string; // HH:mm format
  shiftEnd: string;   // HH:mm format
  breakMinutes: number;
  position?: string;
  notes?: string;
  createdBy: UUID;
  createdAt: ISODateTime;
  updatedAt: ISODateTime;
}

// Payroll Types
export enum PayrollStatus {
  DRAFT = 'draft',
  APPROVED = 'approved',
  PAID = 'paid'
}

export interface Payroll {
  id: UUID;
  userId: UUID;
  orgId: UUID;
  periodStart: ISODate;
  periodEnd: ISODate;
  baseSalary?: number;
  overtimePay?: number;
  deductions?: number;
  bonuses?: number;
  netPay?: number;
  status: PayrollStatus;
  paymentDate?: ISODate;
  paymentMethod?: string;
  createdBy: UUID;
  createdAt: ISODateTime;
  updatedAt: ISODateTime;
}

// Notification Types
export enum NotificationType {
  SCHEDULE_CHANGE = 'schedule_change',
  ATTENDANCE_REMINDER = 'attendance_reminder',
  PAYROLL_READY = 'payroll_ready',
  SYSTEM = 'system'
}

export interface Notification {
  id: UUID;
  userId: UUID;
  type: NotificationType;
  title: string;
  message?: string;
  data?: Record<string, any>;
  isRead: boolean;
  createdAt: ISODateTime;
}

// API Request/Response Types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
  };
}

export interface PaginationParams {
  page?: number;
  limit?: number;
  sort?: string;
  order?: 'asc' | 'desc';
}

export interface FilterParams {
  search?: string;
  startDate?: ISODate;
  endDate?: ISODate;
  status?: string;
  [key: string]: any;
}

// Authentication Types
export interface LoginRequest {
  email: string;
  password: string;
}

export interface SignupRequest {
  email: string;
  password: string;
  fullName: string;
  role?: UserRole;
  organizationId?: UUID;
}

export interface Session {
  user: User;
  accessToken: string;
  refreshToken?: string;
  expiresAt: ISODateTime;
}

// Real-time Event Types
export interface RealtimeEvent<T> {
  type: 'INSERT' | 'UPDATE' | 'DELETE';
  table: string;
  schema: string;
  old?: T;
  new?: T;
  timestamp: ISODateTime;
}