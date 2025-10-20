# AI-Powered HR System API Documentation
## Module 1: Job Posting & Requisition

This documentation provides details about the APIs available in the Job Posting & Requisition module.

## Base URL
```
http://localhost:3000/api/v1
```

## Authentication
All endpoints require authentication (currently commented as middleware). Authentication implementation pending.

---

## 1. User Management APIs
Manage users in the system including managers, approvers, and HR personnel.

### Create User
```http
POST /users
```
**Request Body:**
```json
{
    "name": "string",
    "email": "string",
    "role": "manager" | "system" | "hr" | "approver",
    "department": "string",
    "metadata": {
        "phone": "string",
        "title": "string"
    }
}
```
**Response:** `201 Created`
```json
{
    "_id": "string",
    "name": "string",
    "email": "string",
    "role": "string",
    "department": "string",
    "metadata": {
        "phone": "string",
        "title": "string"
    },
    "created_at": "datetime",
    "updated_at": "datetime"
}
```

### Get All Users
```http
GET /users
```
**Query Parameters:**
- `role`: (optional) Filter by user role
- `department`: (optional) Filter by department

### Get User by ID
```http
GET /users/:id
```

### Update User
```http
PUT /users/:id
```

---

## 2. Job Requisition APIs
Manage job requisitions and their approval workflow.

### Create Job Requisition
```http
POST /requisitions
```
**Request Body:**
```json
{
    "manager_id": "string",
    "prompt_text": "string",
    "extracted": {
        "title": "string",
        "department": "string",
        "location": "string",
        "experience_level": "string"
    },
    "required_skills": ["string"],
    "salary_range": {
        "min": number,
        "max": number,
        "currency": "string"
    },
    "approval_chain": [
        {
            "approver_id": "string",
            "level": number,
            "status": "pending"
        }
    ]
}
```

### Get All Requisitions
```http
GET /requisitions
```
**Query Parameters:**
- `status`: Filter by requisition status
- `department`: Filter by department

### Approve Requisition
```http
POST /requisitions/:id/approve
```
**Request Body:**
```json
{
    "approver_id": "string",
    "level": number,
    "remarks": "string"
}
```

### Search Requisitions
```http
GET /requisitions/search/text
```
**Query Parameters:**
- `query`: Search text

---

## 3. AI Processing APIs
Manage AI-powered processing of job requisitions.

### Process Job with AI
```http
POST /ai/process
```
**Request Body:**
```json
{
    "jobId": "string",
    "stage": "prompt_parsing" | "jd_generation" | "skill_prediction" | "timeline_prediction",
    "input": {
        "prompt_text": "string",
        "additional_context": "string"
    }
}
```

### Get AI Predictions
```http
GET /ai/predictions/:jobId
```

### Get Processing Logs
```http
GET /ai/logs/:jobId
```

---

## 4. Job Posting APIs
Manage external job postings across different channels.

### Create Job Posting
```http
POST /postings
```
**Request Body:**
```json
{
    "job_id": "string",
    "channel": "linkedin" | "naukri" | "indeed" | "internal",
    "post_url": "string",
    "status": "pending" | "posted" | "failed"
}
```

### Get Posting Metrics
```http
GET /postings/:id/metrics
```
**Response:**
```json
{
    "clicks": number,
    "views": number,
    "applies": number
}
```

### Sync Posting Metrics
```http
PUT /postings/:id/sync
```

---

## 5. Skills Management APIs
Manage skill database and popularity tracking.

### Create Skill
```http
POST /skills
```
**Request Body:**
```json
{
    "name": "string",
    "aliases": ["string"],
    "popularity_score": number
}
```

### Search Skills
```http
GET /skills/search/:term
```

### Batch Update Skills
```http
POST /skills/batch
```
**Request Body:**
```json
{
    "skills": [
        {
            "name": "string",
            "aliases": ["string"],
            "popularity_score": number
        }
    ]
}
```

---

## Status Codes
- `200`: Success
- `201`: Created
- `400`: Bad Request
- `401`: Unauthorized
- `403`: Forbidden
- `404`: Not Found
- `500`: Internal Server Error

## Data Models

### User
```typescript
{
    _id: ObjectId
    name: string
    email: string (unique)
    role: enum["manager", "system", "hr", "approver"]
    department: string
    metadata: {
        phone: string
        title: string
    }
    created_at: Date
    updated_at: Date
}
```

### JobRequisition
```typescript
{
    _id: ObjectId
    manager_id: ObjectId (ref: User)
    prompt_text: string
    extracted: {
        title: string
        department: string
        location: string
        experience_level: string
    }
    required_skills: string[]
    description: string
    salary_range: {
        min: number
        max: number
        currency: string
    }
    status: enum["initiated", "ai_generated", "approved", "posted", "closed"]
    approval_chain: [{
        approver_id: ObjectId
        level: number
        status: string
        remarks: string
        acted_at: Date
    }]
    suggested_channels: string[]
    created_at: Date
    updated_at: Date
}
```

## Environment Variables
```env
PORT=3000
MONGODB_URI=mongodb://localhost:27017/hr_system
AI_MODEL_VERSION=1.0
```

## Error Responses
All error responses follow this format:
```json
{
    "message": "Error description"
}
```

## Rate Limiting
To be implemented.

## Notes
- All timestamps are in ISO 8601 format
- All IDs are MongoDB ObjectIds
- Authentication implementation pending
- File attachments support to be added in future versions