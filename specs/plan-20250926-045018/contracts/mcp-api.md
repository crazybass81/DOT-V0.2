# DOT Platform V0.2 - MCP Integration API 계약

## MCP 브릿지 API 개요

DOT Platform V0.2는 Model Context Protocol (MCP)를 통해 다양한 개발 도구들과 통합됩니다. MCP 브릿지 API는 이러한 통합을 관리하고 도구 실행을 중개하는 역할을 합니다.

### 기본 정보
- **Base URL**: `/api/mcp`
- **WebSocket URL**: `ws://localhost:3000/api/mcp/ws`
- **Content-Type**: `application/json`
- **프로토콜**: MCP v1.0 호환
- **인증**: Bearer Token (JWT)

## MCP 서버 관리 API

### GET /api/mcp/servers
연결된 MCP 서버 목록을 조회합니다.

**요청**
```http
GET /api/mcp/servers?status=connected
Authorization: Bearer {token}
```

**응답**
```json
{
  "success": true,
  "data": {
    "servers": [
      {
        "id": "claude-code",
        "name": "Claude Code",
        "description": "AI-powered code generation and review",
        "description_ko": "AI 기반 코드 생성 및 리뷰",
        "version": "1.0.0",
        "status": "connected",
        "url": "ws://localhost:3001",
        "capabilities": [
          "code_generation",
          "code_review",
          "refactoring",
          "documentation"
        ],
        "tools": [
          {
            "name": "generate_code",
            "description": "Generate code from specifications",
            "parameters": ["spec", "language", "style"]
          },
          {
            "name": "review_code",
            "description": "Review code for quality and security",
            "parameters": ["code", "rules", "severity"]
          }
        ],
        "health": {
          "status": "healthy",
          "last_ping": "2025-09-26T04:50:00Z",
          "response_time_ms": 150,
          "error_rate": 0.001
        },
        "connected_at": "2025-09-26T04:00:00Z",
        "last_used_at": "2025-09-26T04:45:00Z"
      },
      {
        "id": "spec-kit",
        "name": "GitHub Spec-Kit",
        "description": "Specification-driven development tools",
        "description_ko": "명세 기반 개발 도구",
        "version": "2.1.0",
        "status": "connected",
        "url": "ws://localhost:3002",
        "capabilities": [
          "specification_creation",
          "validation",
          "code_generation",
          "documentation"
        ],
        "tools": [
          {
            "name": "create_spec",
            "description": "Create technical specification",
            "parameters": ["requirements", "format", "template"]
          },
          {
            "name": "validate_spec",
            "description": "Validate specification completeness",
            "parameters": ["spec", "schema", "rules"]
          }
        ],
        "health": {
          "status": "healthy",
          "last_ping": "2025-09-26T04:49:00Z",
          "response_time_ms": 200,
          "error_rate": 0.0
        },
        "connected_at": "2025-09-26T04:00:00Z",
        "last_used_at": "2025-09-26T04:30:00Z"
      },
      {
        "id": "superclaude",
        "name": "SuperClaude",
        "description": "Advanced AI assistant for code improvement",
        "description_ko": "코드 개선을 위한 고급 AI 어시스턴트",
        "version": "1.5.0",
        "status": "connecting",
        "url": "ws://localhost:3003",
        "capabilities": [
          "code_improvement",
          "bug_detection",
          "performance_optimization",
          "security_analysis"
        ],
        "tools": [
          {
            "name": "improve_code",
            "description": "Suggest code improvements",
            "parameters": ["code", "focus_areas", "preferences"]
          },
          {
            "name": "analyze_security",
            "description": "Analyze code for security vulnerabilities",
            "parameters": ["code", "severity", "report_format"]
          }
        ],
        "health": {
          "status": "connecting",
          "last_ping": null,
          "response_time_ms": null,
          "error_rate": null
        },
        "connected_at": null,
        "last_used_at": "2025-09-25T18:30:00Z"
      }
    ],
    "summary": {
      "total": 3,
      "connected": 2,
      "connecting": 1,
      "error": 0
    }
  }
}
```

### POST /api/mcp/servers/{server_id}/connect
특정 MCP 서버에 연결합니다.

**요청**
```http
POST /api/mcp/servers/superclaude/connect
Authorization: Bearer {token}
Content-Type: application/json

{
  "config": {
    "url": "ws://localhost:3003",
    "timeout_ms": 30000,
    "retry_attempts": 3,
    "auth": {
      "api_key": "sk-...",
      "type": "bearer"
    }
  },
  "options": {
    "auto_reconnect": true,
    "ping_interval": 30000,
    "max_reconnect_attempts": 10
  }
}
```

**응답**
```json
{
  "success": true,
  "data": {
    "server_id": "superclaude",
    "status": "connected",
    "connection_id": "conn_123456",
    "handshake": {
      "protocol_version": "1.0.0",
      "server_info": {
        "name": "SuperClaude",
        "version": "1.5.0"
      },
      "capabilities": [
        "code_improvement",
        "bug_detection",
        "performance_optimization",
        "security_analysis"
      ]
    },
    "connected_at": "2025-09-26T04:50:18Z"
  }
}
```

### DELETE /api/mcp/servers/{server_id}/disconnect
MCP 서버 연결을 해제합니다.

**요청**
```http
DELETE /api/mcp/servers/superclaude/disconnect
Authorization: Bearer {token}
```

**응답**
```json
{
  "success": true,
  "data": {
    "server_id": "superclaude",
    "status": "disconnected",
    "graceful_shutdown": true,
    "connection_duration_seconds": 3600,
    "disconnected_at": "2025-09-26T04:50:18Z"
  }
}
```

### GET /api/mcp/servers/{server_id}/health
MCP 서버의 상태를 확인합니다.

**요청**
```http
GET /api/mcp/servers/claude-code/health
Authorization: Bearer {token}
```

**응답**
```json
{
  "success": true,
  "data": {
    "server_id": "claude-code",
    "status": "healthy",
    "health_check": {
      "timestamp": "2025-09-26T04:50:18Z",
      "response_time_ms": 150,
      "memory_usage_mb": 256,
      "cpu_usage_percent": 12.5,
      "uptime_seconds": 3600
    },
    "metrics": {
      "requests_total": 1250,
      "requests_successful": 1245,
      "requests_failed": 5,
      "error_rate": 0.004,
      "average_response_time_ms": 180,
      "last_24h_requests": 350
    },
    "capabilities_status": {
      "code_generation": "available",
      "code_review": "available",
      "refactoring": "available",
      "documentation": "degraded"
    }
  }
}
```

## MCP 도구 실행 API

### POST /api/mcp/execute
MCP 도구를 실행합니다.

**요청**
```http
POST /api/mcp/execute
Authorization: Bearer {token}
Content-Type: application/json

{
  "server_id": "claude-code",
  "tool": "generate_code",
  "parameters": {
    "spec": {
      "description": "Create a React component for user authentication",
      "requirements": [
        "Email/password login form",
        "Form validation",
        "Loading states",
        "Error handling"
      ],
      "constraints": [
        "Use TypeScript",
        "Use Tailwind CSS",
        "Follow accessibility guidelines"
      ]
    },
    "language": "typescript",
    "style": "functional"
  },
  "options": {
    "timeout_ms": 30000,
    "stream": false,
    "priority": "normal"
  },
  "context": {
    "project": "dot-platform-v2",
    "app": "auth",
    "user_id": "user-uuid"
  }
}
```

**응답**
```json
{
  "success": true,
  "data": {
    "execution_id": "exec_789012",
    "server_id": "claude-code",
    "tool": "generate_code",
    "status": "completed",
    "result": {
      "code": "import React, { useState } from 'react';\nimport { z } from 'zod';\n\n// Generated React component code...",
      "metadata": {
        "language": "typescript",
        "framework": "react",
        "lines_of_code": 85,
        "estimated_complexity": "medium"
      },
      "files": [
        {
          "path": "src/components/LoginForm.tsx",
          "content": "// Component implementation...",
          "type": "component"
        },
        {
          "path": "src/types/auth.ts",
          "content": "// Type definitions...",
          "type": "types"
        }
      ],
      "suggestions": [
        "Consider adding remember me functionality",
        "Add social login options",
        "Implement password strength indicator"
      ]
    },
    "execution_time_ms": 2500,
    "tokens_used": 1250,
    "cost_usd": 0.025,
    "started_at": "2025-09-26T04:50:15Z",
    "completed_at": "2025-09-26T04:50:18Z"
  }
}
```

### POST /api/mcp/execute/batch
여러 MCP 도구를 배치로 실행합니다.

**요청**
```http
POST /api/mcp/execute/batch
Authorization: Bearer {token}
Content-Type: application/json

{
  "executions": [
    {
      "id": "gen-1",
      "server_id": "spec-kit",
      "tool": "create_spec",
      "parameters": {
        "requirements": "User authentication system",
        "format": "markdown",
        "template": "api-spec"
      }
    },
    {
      "id": "gen-2",
      "server_id": "claude-code",
      "tool": "generate_code",
      "parameters": {
        "spec": "{{ gen-1.result.spec }}",
        "language": "typescript"
      },
      "depends_on": ["gen-1"]
    }
  ],
  "options": {
    "parallel": false,
    "fail_fast": true,
    "timeout_ms": 60000
  }
}
```

**응답**
```json
{
  "success": true,
  "data": {
    "batch_id": "batch_345678",
    "status": "completed",
    "executions": [
      {
        "id": "gen-1",
        "status": "completed",
        "result": { /* ... */ },
        "execution_time_ms": 1500
      },
      {
        "id": "gen-2",
        "status": "completed",
        "result": { /* ... */ },
        "execution_time_ms": 2000
      }
    ],
    "summary": {
      "total": 2,
      "completed": 2,
      "failed": 0,
      "total_time_ms": 3500
    },
    "started_at": "2025-09-26T04:50:15Z",
    "completed_at": "2025-09-26T04:50:18Z"
  }
}
```

### GET /api/mcp/executions/{execution_id}
특정 실행의 상태를 조회합니다.

**요청**
```http
GET /api/mcp/executions/exec_789012
Authorization: Bearer {token}
```

**응답**
```json
{
  "success": true,
  "data": {
    "execution_id": "exec_789012",
    "server_id": "claude-code",
    "tool": "generate_code",
    "status": "completed",
    "progress": 100,
    "result": {
      "code": "// Generated code...",
      "metadata": { /* ... */ }
    },
    "logs": [
      {
        "timestamp": "2025-09-26T04:50:15Z",
        "level": "INFO",
        "message": "Starting code generation..."
      },
      {
        "timestamp": "2025-09-26T04:50:17Z",
        "level": "INFO",
        "message": "Analyzing requirements..."
      },
      {
        "timestamp": "2025-09-26T04:50:18Z",
        "level": "INFO",
        "message": "Code generation completed successfully"
      }
    ],
    "metrics": {
      "execution_time_ms": 2500,
      "tokens_used": 1250,
      "memory_peak_mb": 128
    },
    "created_at": "2025-09-26T04:50:15Z",
    "completed_at": "2025-09-26T04:50:18Z"
  }
}
```

## WebSocket 실시간 통신

### 연결 설정
```javascript
const ws = new WebSocket('ws://localhost:3000/api/mcp/ws');

// 인증
ws.send(JSON.stringify({
  type: 'auth',
  data: {
    token: 'Bearer jwt_token_here'
  }
}));
```

### 실시간 이벤트

#### 서버 상태 변경
```json
{
  "type": "server_status_changed",
  "data": {
    "server_id": "claude-code",
    "previous_status": "connecting",
    "current_status": "connected",
    "timestamp": "2025-09-26T04:50:18Z"
  }
}
```

#### 도구 실행 진행상황
```json
{
  "type": "execution_progress",
  "data": {
    "execution_id": "exec_789012",
    "status": "running",
    "progress": 65,
    "message": "Generating component structure...",
    "timestamp": "2025-09-26T04:50:17Z"
  }
}
```

#### 도구 실행 완료
```json
{
  "type": "execution_completed",
  "data": {
    "execution_id": "exec_789012",
    "status": "completed",
    "result": { /* 실행 결과 */ },
    "timestamp": "2025-09-26T04:50:18Z"
  }
}
```

#### MCP 서버 오류
```json
{
  "type": "server_error",
  "data": {
    "server_id": "superclaude",
    "error": {
      "code": "CONNECTION_TIMEOUT",
      "message": "Server connection timed out",
      "details": {
        "timeout_ms": 30000,
        "last_ping": "2025-09-26T04:45:00Z"
      }
    },
    "timestamp": "2025-09-26T04:50:18Z"
  }
}
```

## 개발 워크플로우 통합 API

### POST /api/mcp/workflows/spec-to-code
명세서로부터 코드 생성 워크플로우를 실행합니다.

**요청**
```http
POST /api/mcp/workflows/spec-to-code
Authorization: Bearer {token}
Content-Type: application/json

{
  "spec_file": "specs/auth-feature.md",
  "target_language": "typescript",
  "framework": "react",
  "output_directory": "src/apps/auth",
  "options": {
    "include_tests": true,
    "generate_docs": true,
    "apply_superclaude_review": true
  }
}
```

**응답**
```json
{
  "success": true,
  "data": {
    "workflow_id": "workflow_456789",
    "status": "running",
    "steps": [
      {
        "step": "parse_spec",
        "status": "completed",
        "tool": "spec-kit",
        "result": { "parsed": true }
      },
      {
        "step": "generate_code",
        "status": "running",
        "tool": "claude-code",
        "progress": 45
      },
      {
        "step": "review_code",
        "status": "pending",
        "tool": "superclaude"
      }
    ],
    "estimated_completion": "2025-09-26T04:55:00Z",
    "started_at": "2025-09-26T04:50:18Z"
  }
}
```

### GET /api/mcp/workflows/{workflow_id}
워크플로우 진행상황을 조회합니다.

**요청**
```http
GET /api/mcp/workflows/workflow_456789
Authorization: Bearer {token}
```

**응답**
```json
{
  "success": true,
  "data": {
    "workflow_id": "workflow_456789",
    "status": "completed",
    "progress": 100,
    "steps": [
      {
        "step": "parse_spec",
        "status": "completed",
        "tool": "spec-kit",
        "result": {
          "components": ["LoginForm", "AuthService"],
          "apis": ["/auth/login", "/auth/logout"],
          "types": ["User", "AuthState"]
        },
        "execution_time_ms": 800
      },
      {
        "step": "generate_code",
        "status": "completed",
        "tool": "claude-code",
        "result": {
          "files_generated": 8,
          "lines_of_code": 450,
          "test_files": 3
        },
        "execution_time_ms": 3200
      },
      {
        "step": "review_code",
        "status": "completed",
        "tool": "superclaude",
        "result": {
          "issues_found": 2,
          "suggestions": 5,
          "security_score": 9.2,
          "maintainability_score": 8.7
        },
        "execution_time_ms": 1500
      }
    ],
    "output": {
      "files": [
        "src/apps/auth/components/LoginForm.tsx",
        "src/apps/auth/services/AuthService.ts",
        "src/apps/auth/types/auth.ts"
      ],
      "documentation": "docs/auth-app.md",
      "test_files": [
        "src/apps/auth/__tests__/LoginForm.test.tsx"
      ]
    },
    "total_execution_time_ms": 5500,
    "started_at": "2025-09-26T04:50:18Z",
    "completed_at": "2025-09-26T04:50:24Z"
  }
}
```

## 에러 처리

### MCP 관련 에러 코드

#### 연결 에러 (5000-5099)
- `MCP_CONNECTION_FAILED` (5001): MCP 서버 연결 실패
- `MCP_CONNECTION_TIMEOUT` (5002): 연결 시간 초과
- `MCP_HANDSHAKE_FAILED` (5003): 핸드셰이크 실패
- `MCP_AUTHENTICATION_FAILED` (5004): MCP 서버 인증 실패

#### 도구 실행 에러 (5100-5199)
- `MCP_TOOL_NOT_FOUND` (5101): 요청한 도구를 찾을 수 없음
- `MCP_TOOL_EXECUTION_FAILED` (5102): 도구 실행 실패
- `MCP_INVALID_PARAMETERS` (5103): 잘못된 매개변수
- `MCP_EXECUTION_TIMEOUT` (5104): 실행 시간 초과
- `MCP_QUOTA_EXCEEDED` (5105): 실행 할당량 초과

#### 워크플로우 에러 (5200-5299)
- `WORKFLOW_NOT_FOUND` (5201): 워크플로우를 찾을 수 없음
- `WORKFLOW_STEP_FAILED` (5202): 워크플로우 단계 실패
- `WORKFLOW_DEPENDENCY_ERROR` (5203): 의존성 오류

### 에러 응답 예시
```json
{
  "success": false,
  "error": {
    "code": "MCP_TOOL_EXECUTION_FAILED",
    "message": "Tool execution failed due to invalid input",
    "message_ko": "잘못된 입력으로 인해 도구 실행이 실패했습니다",
    "details": {
      "server_id": "claude-code",
      "tool": "generate_code",
      "execution_id": "exec_789012",
      "server_error": "Invalid specification format",
      "retry_possible": true,
      "max_retries": 3
    },
    "timestamp": "2025-09-26T04:50:18Z",
    "request_id": "req_mcp_123456"
  }
}
```

---

**문서 정보**
- 버전: 1.0.0
- 작성일: 2025년 9월 26일
- 상태: 초안 완료
- MCP 프로토콜 버전: 1.0 호환