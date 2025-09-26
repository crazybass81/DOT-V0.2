// 기본 타입 정의
export type UUID = string
export type ISODateTime = string
export type ISODate = string

// 사용자 관련 타입
export enum UserRole {
  ADMIN = 'admin',
  MANAGER = 'manager',
  EMPLOYEE = 'employee',
}

export interface User {
  id: UUID
  email: string
  fullName: string
  role: UserRole
  department?: string
  phone?: string
  language: 'ko' | 'en' | 'ja' | 'zh'
  avatarUrl?: string
  isActive: boolean
  createdAt: ISODateTime
  updatedAt: ISODateTime
}

// 조직 관련 타입
export enum OrganizationType {
  RESTAURANT = 'restaurant',
  CAFE = 'cafe',
  BAR = 'bar',
  FRANCHISE = 'franchise',
}

export interface Organization {
  id: UUID
  name: string
  type: OrganizationType
  address?: string
  phone?: string
  businessHours?: Record<string, any>
  settings: Record<string, any>
  createdBy: UUID
  createdAt: ISODateTime
  updatedAt: ISODateTime
}

// 출퇴근 관련 타입
export enum AttendanceStatus {
  PRESENT = 'present',
  ABSENT = 'absent',
  LATE = 'late',
  LEAVE = 'leave',
}

export interface Attendance {
  id: UUID
  userId: UUID
  orgId: UUID
  checkIn?: ISODateTime
  checkOut?: ISODateTime
  breakStart?: ISODateTime
  breakEnd?: ISODateTime
  status: AttendanceStatus
  notes?: string
  createdAt: ISODateTime
  updatedAt: ISODateTime
}