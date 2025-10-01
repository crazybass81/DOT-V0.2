# Paper 데이터베이스 설계

## 📄 Paper 개요

Paper는 DOT 플랫폼의 모든 법적 문서를 통칭하는 개념으로, 다음 3가지 문서 타입을 포함합니다:
1. **사업자등록증** (Business Registration)
2. **근로계약서** (Employment Contract)
3. **권한위임장** (Authority Delegation)

---

## 🗂️ 테이블 구조

### Paper 테이블

```typescript
interface Paper {
  id: string;                    // UUID
  type: PaperType;               // 문서 타입
  status: PaperStatus;           // 문서 상태

  // 작성자 정보
  creatorId: string;             // 문서 작성자 User ID

  // 사업장 정보 (사업자등록증 제외)
  businessRegistrationId?: string; // 연관된 사업자등록증 ID (근로계약서, 권한위임장만)

  // 문서 내용
  content: Record<string, any>;  // 문서별 필드 (JSON)
  fileUrls: string[];            // 첨부파일 URL 배열

  // 검증 정보
  isVerified: boolean;           // 검증 완료 여부
  verifiedAt?: Date;             // 검증 일시
  verificationData?: Record<string, any>; // 검증 결과 데이터

  // 메타데이터
  createdAt: Date;
  updatedAt: Date;
  expiredAt?: Date;              // 문서 만료일 (선택)
  revokedAt?: Date;              // 문서 폐기일
}

enum PaperType {
  BUSINESS_REGISTRATION = 'BUSINESS_REGISTRATION',  // 사업자등록증
  EMPLOYMENT_CONTRACT = 'EMPLOYMENT_CONTRACT',      // 근로계약서
  AUTHORITY_DELEGATION = 'AUTHORITY_DELEGATION'     // 권한위임장
}

enum PaperStatus {
  DRAFT = 'DRAFT',               // 작성 중
  PENDING = 'PENDING',           // 서명 대기
  ACTIVE = 'ACTIVE',             // 유효
  EXPIRED = 'EXPIRED',           // 만료
  REVOKED = 'REVOKED'            // 폐기
}
```

---

## 👥 PaperOwnership 테이블 (문서 소유권)

Paper는 여러 사람이 소유할 수 있으므로 N:M 관계를 위한 중간 테이블이 필요합니다.

```typescript
interface PaperOwnership {
  id: string;                    // UUID
  paperId: string;               // Paper ID
  userId: string;                // 소유자 User ID
  role: OwnershipRole;           // 소유자 역할 (작성자, 서명자 등)

  // 서명 정보
  isSigned: boolean;             // 서명 완료 여부
  signedAt?: Date;               // 서명 일시
  signatureData?: string;        // 서명 데이터

  // 메타데이터
  grantedAt: Date;               // 소유권 부여 일시
  revokedAt?: Date;              // 소유권 폐기 일시
}

enum OwnershipRole {
  CREATOR = 'CREATOR',           // 작성자
  SIGNER = 'SIGNER',             // 서명자
  VIEWER = 'VIEWER'              // 열람자 (선택)
}
```

---

## 📊 문서 타입별 소유권 구조

### 1️⃣ 사업자등록증 (BUSINESS_REGISTRATION)

```typescript
{
  type: 'BUSINESS_REGISTRATION',
  creatorId: 'user-001',         // User 본인
  businessRegistrationId: null,  // 자기 자신이므로 null
  content: {
    businessNumber: '123-45-67890',
    businessName: '카페 ABC',
    ownerName: '김철수',
    address: '서울시 강남구...',
    businessType: '커피전문점',
    // ... 기타 필드
  }
}

// PaperOwnership
[
  {
    paperId: 'paper-001',
    userId: 'user-001',
    role: 'CREATOR',
    isSigned: true
  }
]
```

**소유자**: User 1명 (1:1)

---

### 2️⃣ 근로계약서 (EMPLOYMENT_CONTRACT)

```typescript
{
  type: 'EMPLOYMENT_CONTRACT',
  creatorId: 'user-001',              // Owner 또는 Manager
  businessRegistrationId: 'paper-001', // 사업자등록증 ID
  content: {
    workplaceName: '카페 ABC',
    position: '바리스타',
    startDate: '2024-01-01',
    endDate: '2024-12-31',
    salary: 2500000,
    workingHours: '09:00-18:00',
    // ... 기타 계약 조건
  }
}

// PaperOwnership
[
  {
    paperId: 'paper-002',
    userId: 'user-001',  // Owner
    role: 'CREATOR',
    isSigned: true
  },
  {
    paperId: 'paper-002',
    userId: 'user-002',  // Worker
    role: 'SIGNER',
    isSigned: true
  }
]
```

**소유자**: Owner + Worker (2명, N:M)

---

### 3️⃣ 권한위임장 (AUTHORITY_DELEGATION)

```typescript
{
  type: 'AUTHORITY_DELEGATION',
  creatorId: 'user-001',              // Owner
  businessRegistrationId: 'paper-001', // 사업자등록증 ID
  content: {
    workplaceName: '카페 ABC',
    delegatedAuthorities: [
      'EMPLOYMENT_CONTRACT_CREATION',   // 근로계약서 작성 권한
      'ATTENDANCE_APPROVAL',            // 근태 승인 권한
      'SCHEDULE_MANAGEMENT'             // 일정 관리 권한
    ],
    restrictions: {
      maxEmployees: 10,                 // 관리 가능 인원 제한
      // ... 기타 제한사항
    }
  }
}

// PaperOwnership
[
  {
    paperId: 'paper-003',
    userId: 'user-001',  // Owner
    role: 'CREATOR',
    isSigned: true
  },
  {
    paperId: 'paper-003',
    userId: 'user-003',  // Manager
    role: 'SIGNER',
    isSigned: true
  }
]
```

**소유자**: Owner + Manager (2명, N:M)

---

## 🔐 권한 체크 로직

### 문서 작성 권한

```typescript
// 사업자등록증 작성
function canCreateBusinessRegistration(user: User): boolean {
  return true; // 모든 유저 가능
}

// 근로계약서 작성
function canCreateEmploymentContract(
  user: User,
  businessRegistrationId: string
): boolean {
  // 1. Owner인 경우
  const isOwner = user.ownsPaper(businessRegistrationId, 'BUSINESS_REGISTRATION');

  // 2. 근로계약서 작성 권한이 있는 Manager인 경우
  const hasAuthority = user.hasAuthority(
    businessRegistrationId,
    'EMPLOYMENT_CONTRACT_CREATION'
  );

  return isOwner || hasAuthority;
}

// 권한위임장 작성
function canCreateAuthorityDelegation(
  user: User,
  businessRegistrationId: string
): boolean {
  // Owner만 가능
  return user.ownsPaper(businessRegistrationId, 'BUSINESS_REGISTRATION');
}
```

---

## 🔄 역할과 문서의 관계

```typescript
// UserRole 테이블 (수정)
interface UserRole {
  id: string;
  userId: string;
  role: 'SEEKER' | 'OWNER' | 'WORKER' | 'MANAGER';
  workplaceId: string;
  paperId: string;              // 역할 부여 근거 Paper ID
  grantedAt: Date;
  revokedAt?: Date;
}
```

### 역할별 Paper 매핑

| 역할 | 필요 Paper | Paper 소유권 |
|------|-----------|-------------|
| SEEKER | 없음 | - |
| OWNER | 사업자등록증 | CREATOR (1명) |
| WORKER | 근로계약서 | SIGNER (Owner + Worker) |
| MANAGER | 권한위임장 | SIGNER (Owner + Manager) |

---

## 📈 ER Diagram

```
User (1) ─────< (N) PaperOwnership (N) >───── (1) Paper
                      │
                      └─ role: CREATOR | SIGNER | VIEWER
                      └─ isSigned: boolean

Paper
├─ type: BUSINESS_REGISTRATION | EMPLOYMENT_CONTRACT | AUTHORITY_DELEGATION
├─ status: DRAFT | PENDING | ACTIVE | EXPIRED | REVOKED
└─ businessRegistrationId: (self-reference for contracts)

UserRole (N) ─────> (1) Paper
             (paperId: 역할 부여 근거 문서)
```

---

## 🔍 주요 쿼리 예시

### 1. 특정 사업장의 모든 근로계약서 조회

```typescript
const contracts = await prisma.paper.findMany({
  where: {
    type: 'EMPLOYMENT_CONTRACT',
    businessRegistrationId: 'paper-001',
    status: 'ACTIVE'
  },
  include: {
    ownerships: {
      include: {
        user: true
      }
    }
  }
});
```

### 2. Manager가 작성 가능한 사업장 조회

```typescript
const managerRoles = await prisma.userRole.findMany({
  where: {
    userId: 'user-003',
    role: 'MANAGER'
  },
  include: {
    paper: {
      where: {
        type: 'AUTHORITY_DELEGATION',
        content: {
          path: ['delegatedAuthorities'],
          array_contains: 'EMPLOYMENT_CONTRACT_CREATION'
        }
      }
    }
  }
});
```

### 3. User가 소유한 모든 문서 조회

```typescript
const userPapers = await prisma.paperOwnership.findMany({
  where: {
    userId: 'user-001',
    revokedAt: null
  },
  include: {
    paper: true
  }
});
```

---

## ⚠️ 중요 비즈니스 규칙

1. **사업자등록증**:
   - User 1명만 소유 (1:1)
   - 국세청 API 검증 필수
   - 검증 완료 후 Owner 역할 자동 부여

2. **근로계약서**:
   - Owner 또는 권한 있는 Manager만 작성 가능
   - Owner + Worker 양측 서명 필수
   - 양측 서명 완료 후 Worker 역할 자동 부여

3. **권한위임장**:
   - Owner만 작성 가능
   - Owner + Manager 양측 서명 필수
   - Worker 역할 선행 조건 체크 후 Manager 역할 부여

4. **Paper 폐기**:
   - Paper 폐기 시 연관된 UserRole도 자동 폐기
   - Worker의 근로계약서 폐기 시 Manager 역할도 자동 폐기

---

## 🎯 다음 단계

1. Prisma Schema 작성
2. Migration 파일 생성
3. Paper CRUD API 구현
4. 문서 서명 플로우 구현
5. 역할 자동 부여 로직 구현