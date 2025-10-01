# DOT Platform V0.2 - Platform Core API 계약

## API 개요

DOT Platform V0.2의 플랫폼 코어 API는 마이크로 앱들이 플랫폼과 상호작용하기 위한 표준 인터페이스를 제공합니다.

### 기본 정보
- **Base URL**: `/api/platform`
- **Content-Type**: `application/json`
- **인증**: Bearer Token (JWT)
- **버전**: v1.0.0

## 플랫폼 관리 API

### GET /api/platform/info
플랫폼 기본 정보를 조회합니다.

**요청**
```http
GET /api/platform/info
Authorization: Bearer {token}
```

**응답**
```json
{
  "success": true,
  "data": {
    "name": "DOT Platform V0.2",
    "version": "1.0.0",
    "status": "active",
    "maintenance_mode": false,
    "max_concurrent_apps": 10,
    "max_users_per_app": 1000,
    "supported_features": [
      "dynamic_loading",
      "app_isolation",
      "realtime_sync",
      "mcp_integration"
    ],
    "updated_at": "2025-09-26T04:50:18Z"
  }
}
```

### POST /api/platform/initialize
플랫폼을 초기화합니다. (관리자 전용)

**요청**
```http
POST /api/platform/initialize
Authorization: Bearer {admin_token}
Content-Type: application/json

{
  "reset_apps": false,
  "reset_users": false,
  "maintenance_mode": false
}
```

**응답**
```json
{
  "success": true,
  "data": {
    "initialized": true,
    "apps_reset": false,
    "users_reset": false,
    "timestamp": "2025-09-26T04:50:18Z"
  }
}
```

## 앱 관리 API

### GET /api/apps
설치 가능한 앱 목록을 조회합니다.

**요청**
```http
GET /api/apps?category={category}&status={status}&limit={limit}&offset={offset}
Authorization: Bearer {token}
```

**쿼리 매개변수**
- `category` (선택): 앱 카테고리 필터
- `status` (선택): 앱 상태 필터 ('active', 'published')
- `limit` (선택): 결과 수 제한 (기본: 20)
- `offset` (선택): 페이지네이션 오프셋 (기본: 0)

**응답**
```json
{
  "success": true,
  "data": {
    "apps": [
      {
        "id": "uuid",
        "app_id": "auth",
        "name": "Authentication",
        "display_name_ko": "인증 관리",
        "description": "User authentication and authorization",
        "description_ko": "사용자 인증 및 권한 관리",
        "version": "1.0.0",
        "category": "core",
        "tags": ["auth", "security", "users"],
        "status": "active",
        "install_count": 150,
        "average_rating": 4.5,
        "total_ratings": 30,
        "manifest": {
          "routes": [
            { "path": "/login", "component": "LoginPage" },
            { "path": "/profile", "component": "ProfilePage" }
          ],
          "permissions": ["auth:read", "auth:write"],
          "dependencies": ["core"]
        },
        "developer": {
          "id": "dev-uuid",
          "name": "DOT Platform Team"
        },
        "created_at": "2025-09-26T00:00:00Z",
        "updated_at": "2025-09-26T04:50:18Z"
      }
    ],
    "pagination": {
      "total": 5,
      "limit": 20,
      "offset": 0,
      "has_more": false
    }
  }
}
```

### GET /api/apps/{app_id}
특정 앱의 상세 정보를 조회합니다.

**요청**
```http
GET /api/apps/auth
Authorization: Bearer {token}
```

**응답**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "app_id": "auth",
    "name": "Authentication",
    "display_name_ko": "인증 관리",
    "description": "Complete user authentication and authorization system",
    "description_ko": "완전한 사용자 인증 및 권한 관리 시스템",
    "version": "1.0.0",
    "category": "core",
    "tags": ["auth", "security", "users", "permissions"],
    "status": "active",
    "install_count": 150,
    "active_users_count": 45,
    "average_rating": 4.5,
    "total_ratings": 30,
    "max_memory_mb": 50,
    "max_storage_mb": 100,
    "requires_network": true,
    "manifest": {
      "routes": [
        { "path": "/login", "component": "LoginPage", "public": true },
        { "path": "/register", "component": "RegisterPage", "public": true },
        { "path": "/profile", "component": "ProfilePage", "auth": true }
      ],
      "permissions": [
        "auth:read",
        "auth:write",
        "user:profile",
        "session:manage"
      ],
      "dependencies": ["core"],
      "api_endpoints": [
        { "method": "POST", "path": "/auth/login" },
        { "method": "POST", "path": "/auth/logout" },
        { "method": "GET", "path": "/auth/me" }
      ]
    },
    "developer": {
      "id": "dev-uuid",
      "name": "DOT Platform Team",
      "verified": true
    },
    "repository_url": "https://github.com/dot-platform/auth-app",
    "documentation_url": "https://docs.dot-platform.com/apps/auth",
    "screenshots": [
      "https://cdn.dot-platform.com/screenshots/auth-login.png",
      "https://cdn.dot-platform.com/screenshots/auth-profile.png"
    ],
    "changelog": [
      {
        "version": "1.0.0",
        "date": "2025-09-26",
        "changes": ["Initial release", "Basic auth features"]
      }
    ],
    "created_at": "2025-09-26T00:00:00Z",
    "updated_at": "2025-09-26T04:50:18Z",
    "published_at": "2025-09-26T02:00:00Z"
  }
}
```

### POST /api/apps/{app_id}/install
사용자에게 앱을 설치합니다.

**요청**
```http
POST /api/apps/auth/install
Authorization: Bearer {token}
Content-Type: application/json

{
  "settings": {
    "auto_login": true,
    "remember_me_duration": "7d"
  },
  "permissions": [
    "auth:read",
    "auth:write",
    "user:profile"
  ]
}
```

**응답**
```json
{
  "success": true,
  "data": {
    "installation": {
      "id": "install-uuid",
      "app_id": "auth",
      "user_id": "user-uuid",
      "status": "installed",
      "settings": {
        "auto_login": true,
        "remember_me_duration": "7d"
      },
      "permissions": [
        "auth:read",
        "auth:write",
        "user:profile"
      ],
      "installed_at": "2025-09-26T04:50:18Z"
    }
  }
}
```

### DELETE /api/apps/{app_id}
사용자로부터 앱을 제거합니다.

**요청**
```http
DELETE /api/apps/auth
Authorization: Bearer {token}
```

**응답**
```json
{
  "success": true,
  "data": {
    "uninstalled": true,
    "app_id": "auth",
    "cleanup_completed": true,
    "data_removed": true,
    "uninstalled_at": "2025-09-26T04:50:18Z"
  }
}
```

### PATCH /api/apps/{app_id}/update
앱을 업데이트합니다.

**요청**
```http
PATCH /api/apps/auth/update
Authorization: Bearer {token}
Content-Type: application/json

{
  "version": "1.1.0",
  "auto_update": true
}
```

**응답**
```json
{
  "success": true,
  "data": {
    "updated": true,
    "app_id": "auth",
    "previous_version": "1.0.0",
    "new_version": "1.1.0",
    "changes": [
      "Added two-factor authentication",
      "Improved password strength validation",
      "Bug fixes and performance improvements"
    ],
    "updated_at": "2025-09-26T04:50:18Z"
  }
}
```

## 앱 상태 관리 API

### GET /api/apps/{app_id}/state
앱의 상태 데이터를 조회합니다.

**요청**
```http
GET /api/apps/auth/state?keys=user_preferences,session_data
Authorization: Bearer {token}
```

**응답**
```json
{
  "success": true,
  "data": {
    "app_id": "auth",
    "user_id": "user-uuid",
    "state": {
      "user_preferences": {
        "theme": "dark",
        "language": "ko",
        "remember_me": true
      },
      "session_data": {
        "last_login": "2025-09-26T04:30:00Z",
        "login_count": 15,
        "device_trusted": true
      }
    },
    "metadata": {
      "total_keys": 2,
      "total_size_bytes": 1024,
      "last_updated": "2025-09-26T04:50:18Z"
    }
  }
}
```

### POST /api/apps/{app_id}/state
앱의 상태 데이터를 저장합니다.

**요청**
```http
POST /api/apps/auth/state
Authorization: Bearer {token}
Content-Type: application/json

{
  "data": {
    "user_preferences": {
      "theme": "light",
      "language": "ko",
      "remember_me": false
    }
  },
  "options": {
    "merge": true,
    "expires_in": 3600
  }
}
```

**응답**
```json
{
  "success": true,
  "data": {
    "saved": true,
    "app_id": "auth",
    "keys_updated": ["user_preferences"],
    "total_size_bytes": 512,
    "expires_at": "2025-09-26T05:50:18Z",
    "updated_at": "2025-09-26T04:50:18Z"
  }
}
```

### DELETE /api/apps/{app_id}/state
앱의 상태 데이터를 초기화합니다.

**요청**
```http
DELETE /api/apps/auth/state?keys=session_data,temp_data
Authorization: Bearer {token}
```

**응답**
```json
{
  "success": true,
  "data": {
    "cleared": true,
    "app_id": "auth",
    "keys_removed": ["session_data", "temp_data"],
    "keys_remaining": ["user_preferences"],
    "cleared_at": "2025-09-26T04:50:18Z"
  }
}
```

## 사용자 앱 관리 API

### GET /api/user/apps
사용자가 설치한 앱 목록을 조회합니다.

**요청**
```http
GET /api/user/apps?status=installed
Authorization: Bearer {token}
```

**응답**
```json
{
  "success": true,
  "data": {
    "installed_apps": [
      {
        "app_id": "auth",
        "name": "Authentication",
        "display_name_ko": "인증 관리",
        "version": "1.0.0",
        "status": "installed",
        "settings": {
          "auto_login": true,
          "remember_me_duration": "7d"
        },
        "usage_stats": {
          "launch_count": 25,
          "last_used_at": "2025-09-26T04:30:00Z",
          "total_usage_minutes": 120
        },
        "user_rating": 5,
        "installed_at": "2025-09-25T10:00:00Z"
      }
    ],
    "summary": {
      "total_installed": 3,
      "total_active": 2,
      "total_disabled": 1
    }
  }
}
```

### PATCH /api/user/apps/{app_id}
사용자의 앱 설정을 업데이트합니다.

**요청**
```http
PATCH /api/user/apps/auth
Authorization: Bearer {token}
Content-Type: application/json

{
  "status": "installed",
  "settings": {
    "auto_login": false,
    "notifications_enabled": true
  },
  "rating": 4,
  "review": "Good app but needs more features"
}
```

**응답**
```json
{
  "success": true,
  "data": {
    "updated": true,
    "app_id": "auth",
    "changes": ["settings", "rating", "review"],
    "updated_at": "2025-09-26T04:50:18Z"
  }
}
```

## 에러 응답 형식

### 표준 에러 응답
```json
{
  "success": false,
  "error": {
    "code": "APP_NOT_FOUND",
    "message": "The requested app does not exist",
    "message_ko": "요청한 앱을 찾을 수 없습니다",
    "details": {
      "app_id": "invalid_app",
      "available_apps": ["auth", "schedule", "community"]
    },
    "timestamp": "2025-09-26T04:50:18Z",
    "request_id": "req_123456"
  }
}
```

### 에러 코드 목록

#### 플랫폼 에러 (1000-1999)
- `PLATFORM_MAINTENANCE` (1001): 플랫폼이 유지보수 모드
- `PLATFORM_OVERLOAD` (1002): 플랫폼 과부하 상태
- `PLATFORM_ERROR` (1999): 일반적인 플랫폼 오류

#### 앱 관련 에러 (2000-2999)
- `APP_NOT_FOUND` (2001): 앱을 찾을 수 없음
- `APP_INSTALL_FAILED` (2002): 앱 설치 실패
- `APP_ALREADY_INSTALLED` (2003): 앱이 이미 설치됨
- `APP_NOT_INSTALLED` (2004): 앱이 설치되지 않음
- `APP_PERMISSION_DENIED` (2005): 앱 권한 부족
- `APP_VERSION_CONFLICT` (2006): 앱 버전 충돌
- `APP_QUOTA_EXCEEDED` (2007): 앱 할당량 초과

#### 사용자 관련 에러 (3000-3999)
- `USER_NOT_AUTHENTICATED` (3001): 사용자 인증 필요
- `USER_PERMISSION_DENIED` (3002): 사용자 권한 부족
- `USER_QUOTA_EXCEEDED` (3003): 사용자 할당량 초과

#### 데이터 관련 에러 (4000-4999)
- `DATA_VALIDATION_ERROR` (4001): 데이터 검증 실패
- `DATA_SIZE_EXCEEDED` (4002): 데이터 크기 초과
- `DATA_NOT_FOUND` (4003): 데이터를 찾을 수 없음
- `DATA_CONFLICT` (4004): 데이터 충돌

## 인증 및 권한

### JWT 토큰 구조
```json
{
  "sub": "user-uuid",
  "email": "user@example.com",
  "role": "user",
  "platform_permissions": [
    "app:install",
    "app:use",
    "data:read",
    "data:write"
  ],
  "app_permissions": {
    "auth": ["auth:read", "auth:write"],
    "schedule": ["schedule:read"]
  },
  "exp": 1640995200,
  "iat": 1640991600,
  "iss": "dot-platform-v2"
}
```

### 권한 체계
- **platform_admin**: 플랫폼 전체 관리
- **app_developer**: 앱 개발 및 배포
- **user**: 일반 사용자 권한

## Rate Limiting

### 제한 정책
- **일반 사용자**: 100 requests/minute
- **개발자**: 1000 requests/minute
- **관리자**: 무제한

### 제한 초과 응답
```json
{
  "success": false,
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "Too many requests",
    "retry_after": 60,
    "limit": 100,
    "remaining": 0,
    "reset_time": "2025-09-26T05:00:00Z"
  }
}
```

---

**문서 정보**
- 버전: 1.0.0
- 작성일: 2025년 9월 26일
- 상태: 초안 완료
- 검토: 필요