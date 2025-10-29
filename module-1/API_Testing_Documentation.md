# API Testing Documentation for Module-1

This document provides comprehensive testing instructions for all APIs in Module-1 of the AI-powered HR System. All endpoints require authentication via JWT token in the Authorization header (e.g., `Bearer <token>`).

## Base URL
Assuming the server runs on `http://localhost:3000` (adjust as per your setup), and APIs are prefixed with `/api`.

## Authentication
- All routes under `/api` require authentication.
- Obtain a JWT token by logging in via the auth service (Utils/auth).
- Include the token in headers: `Authorization: Bearer <your_jwt_token>`

## Testing Tools
- Use Postman, Insomnia, or curl for testing.
- Ensure the server is running (`npm start` or equivalent in module-1).

## API Endpoints

### Job Description (JD) Routes - Prefix: `/api/jd`

#### 1. Create Job Description
- **Method:** POST
- **Endpoint:** `/api/jd/create`
- **Description:** Creates a new job description.
- **Request Body (JSON):**
  ```json
  {
    "title": "Software Engineer",
    "description": "Develop and maintain software applications.",
    "requirements": ["JavaScript", "Node.js"],
    "location": "Remote",
    "salary": 80000
  }
  ```
- **Response (Success):**
  ```json
  {
    "message": "Job description created successfully",
    "jd": {
      "id": "123",
      "title": "Software Engineer",
      // ... other fields
    }
  }
  ```
- **Testing Steps:**
  1. Send POST request with valid body and auth header.
  2. Verify 201 status and response structure.

#### 2. Update Job Description
- **Method:** POST
- **Endpoint:** `/api/jd/update`
- **Description:** Updates an existing job description.
- **Request Body (JSON):**
  ```json
  {
    "id": "123",
    "title": "Senior Software Engineer",
    "description": "Lead development teams.",
    // ... updated fields
  }
  ```
- **Response (Success):**
  ```json
  {
    "message": "Job description updated successfully",
    "jd": {
      "id": "123",
      // ... updated data
    }
  }
  ```
- **Testing Steps:**
  1. Ensure JD exists (create one first).
  2. Send POST with updated data.
  3. Check 200 status and changes.

#### 3. Delete Job Description
- **Method:** POST
- **Endpoint:** `/api/jd/delete`
- **Description:** Deletes a job description.
- **Request Body (JSON):**
  ```json
  {
    "id": "123"
  }
  ```
- **Response (Success):**
  ```json
  {
    "message": "Job description deleted successfully"
  }
  ```
- **Testing Steps:**
  1. Send POST with valid ID.
  2. Verify 200 status and confirm deletion by fetching all.

#### 4. Get All Job Descriptions
- **Method:** GET
- **Endpoint:** `/api/jd/getAll`
- **Description:** Retrieves all job descriptions.
- **Request Body:** None
- **Response (Success):**
  ```json
  {
    "jds": [
      {
        "id": "123",
        "title": "Software Engineer",
        // ... other fields
      }
    ]
  }
  ```
- **Testing Steps:**
  1. Send GET request.
  2. Check 200 status and array of JDs.

#### 5. Get Job Description by ID
- **Method:** GET
- **Endpoint:** `/api/jd/get/:id` (e.g., `/api/jd/get/123`)
- **Description:** Retrieves a specific job description.
- **Request Body:** None
- **Response (Success):**
  ```json
  {
    "jd": {
      "id": "123",
      "title": "Software Engineer",
      // ... other fields
    }
  }
  ```
- **Testing Steps:**
  1. Use a valid ID from previous tests.
  2. Send GET request.
  3. Verify 200 status and data.

#### 6. Create Job Post
- **Method:** POST
- **Endpoint:** `/api/jd/createPost`
- **Description:** Creates a job post from a JD.
- **Request Body (JSON):**
  ```json
  {
    "jdId": "123",
    "platform": "LinkedIn"
  }
  ```
- **Response (Success):**
  ```json
  {
    "message": "Job post created successfully",
    "post": {
      "id": "456",
      // ... post details
    }
  }
  ```
- **Testing Steps:**
  1. Ensure JD exists.
  2. Send POST request.
  3. Check 201 status.

### Candidate Assessment (CA) Routes - Prefix: `/api/ca`

#### 1. Initialize Assessment
- **Method:** POST
- **Endpoint:** `/api/ca/init`
- **Description:** Initializes candidate assessment (creates test, credentials, sends notification).
- **Request Body (JSON):**
  ```json
  {
    "candidateId": "789",
    "jdId": "123"
  }
  ```
- **Response (Success):**
  ```json
  {
    "message": "Assessment initialized",
    "testId": "101",
    "credentials": {
      "username": "testuser",
      "password": "temp123"
    }
  }
  ```
- **Testing Steps:**
  1. Send POST with candidate and JD IDs.
  2. Verify notification sent (check logs or email).

#### 2. Get Test
- **Method:** GET
- **Endpoint:** `/api/ca/test`
- **Description:** Retrieves the generated test for the candidate.
- **Request Body:** None (likely uses session or token to identify candidate)
- **Response (Success):**
  ```json
  {
    "test": {
      "id": "101",
      "questions": [
        {
          "question": "What is Node.js?",
          "options": ["A", "B", "C", "D"]
        }
      ]
    }
  }
  ```
- **Testing Steps:**
  1. After init, send GET.
  2. Check 200 status and test data.

#### 3. Submit Test
- **Method:** POST
- **Endpoint:** `/api/ca/submit`
- **Description:** Submits the test and calculates score.
- **Request Body (JSON):**
  ```json
  {
    "testId": "101",
    "answers": [
      {"questionId": "1", "answer": "A"}
    ]
  }
  ```
- **Response (Success):**
  ```json
  {
    "message": "Test submitted",
    "score": 85,
    "passed": true
  }
  ```
- **Testing Steps:**
  1. Send POST with answers.
  2. Verify score calculation.

#### 4. Get Shortlisted Candidates
- **Method:** GET
- **Endpoint:** `/api/ca/shortlisted`
- **Description:** Retrieves all shortlisted candidates.
- **Request Body:** None
- **Response (Success):**
  ```json
  {
    "candidates": [
      {
        "id": "789",
        "name": "John Doe",
        "score": 90
      }
    ]
  }
  ```
- **Testing Steps:**
  1. Send GET request.
  2. Check list of shortlisted candidates.

### Interview Scheduling (IS) Routes - Prefix: `/api/is`

#### 1. Create Interview
- **Method:** POST
- **Endpoint:** `/api/is/create`
- **Description:** Creates an interview schedule (AI-assisted).
- **Request Body (JSON):**
  ```json
  {
    "candidateId": "789",
    "interviewerId": "999",
    "date": "2023-10-01T10:00:00Z",
    "type": "Technical"
  }
  ```
- **Response (Success):**
  ```json
  {
    "message": "Interview scheduled",
    "interview": {
      "id": "202",
      // ... details
    }
  }
  ```
- **Testing Steps:**
  1. Send POST with details.
  2. Verify AI suggestions in response.

#### 2. Get Interviews
- **Method:** GET
- **Endpoint:** `/api/is/list`
- **Description:** Retrieves candidate or interviewer schedules.
- **Request Body:** None (query params possible for filtering)
- **Response (Success):**
  ```json
  {
    "interviews": [
      {
        "id": "202",
        "candidate": "John Doe",
        "date": "2023-10-01T10:00:00Z"
      }
    ]
  }
  ```
- **Testing Steps:**
  1. Send GET request.
  2. Check list of interviews.

#### 3. Update Interview Status
- **Method:** PUT
- **Endpoint:** `/api/is/status/:id` (e.g., `/api/is/status/202`)
- **Description:** Updates interview status (completed, cancelled, etc.).
- **Request Body (JSON):**
  ```json
  {
    "status": "completed"
  }
  ```
- **Response (Success):**
  ```json
  {
    "message": "Status updated"
  }
  ```
- **Testing Steps:**
  1. Send PUT with new status.
  2. Verify update.

#### 4. Add Feedback
- **Method:** POST
- **Endpoint:** `/api/is/feedback/:id` (e.g., `/api/is/feedback/202`)
- **Description:** Adds feedback post-interview.
- **Request Body (JSON):**
  ```json
  {
    "feedback": "Good candidate",
    "rating": 4
  }
  ```
- **Response (Success):**
  ```json
  {
    "message": "Feedback added"
  }
  ```
- **Testing Steps:**
  1. Send POST with feedback.
  2. Check if stored.

### Offer and Onboarding (OO) Routes - Prefix: `/api/oo`

#### 1. Create Offer
- **Method:** POST
- **Endpoint:** `/api/oo/create`
- **Description:** Creates a new offer (AI-generated + email sent).
- **Request Body (JSON):**
  ```json
  {
    "candidateId": "789",
    "jdId": "123",
    "salary": 85000,
    "startDate": "2023-11-01"
  }
  ```
- **Response (Success):**
  ```json
  {
    "message": "Offer created and email sent",
    "offer": {
      "id": "303",
      // ... details
    }
  }
  ```
- **Testing Steps:**
  1. Send POST request.
  2. Verify email sent.

#### 2. Get All Offers
- **Method:** GET
- **Endpoint:** `/api/oo/list`
- **Description:** Retrieves all offers for HR/Admin dashboard.
- **Request Body:** None
- **Response (Success):**
  ```json
  {
    "offers": [
      {
        "id": "303",
        "candidate": "John Doe",
        "status": "pending"
      }
    ]
  }
  ```
- **Testing Steps:**
  1. Send GET request.
  2. Check list.

#### 3. Get Offer by ID
- **Method:** GET
- **Endpoint:** `/api/oo/:id` (e.g., `/api/oo/303`)
- **Description:** Retrieves single offer details.
- **Request Body:** None
- **Response (Success):**
  ```json
  {
    "offer": {
      "id": "303",
      // ... full details
    }
  }
  ```
- **Testing Steps:**
  1. Send GET with ID.
  2. Verify details.

#### 4. Update Offer Status
- **Method:** PUT
- **Endpoint:** `/api/oo/status/:id` (e.g., `/api/oo/status/303`)
- **Description:** Updates offer status (approve, reject, accept, etc.).
- **Request Body (JSON):**
  ```json
  {
    "status": "accepted"
  }
  ```
- **Response (Success):**
  ```json
  {
    "message": "Status updated"
  }
  ```
- **Testing Steps:**
  1. Send PUT request.
  2. Check status change.

#### 5. Resend Offer Email
- **Method:** POST
- **Endpoint:** `/api/oo/resend/:id` (e.g., `/api/oo/resend/303`)
- **Description:** Resends offer email to candidate.
- **Request Body:** None
- **Response (Success):**
  ```json
  {
    "message": "Email resent"
  }
  ```
- **Testing Steps:**
  1. Send POST request.
  2. Verify email resent.

#### 6. Create Onboarding Task
- **Method:** POST
- **Endpoint:** `/api/oo/onboarding/create`
- **Description:** Creates onboarding task after offer acceptance.
- **Request Body (JSON):**
  ```json
  {
    "candidateId": "789",
    "tasks": ["Setup email", "HR paperwork"]
  }
  ```
- **Response (Success):**
  ```json
  {
    "message": "Onboarding tasks created",
    "tasks": [
      {
        "id": "404",
        "task": "Setup email"
      }
    ]
  }
  ```
- **Testing Steps:**
  1. Send POST after offer acceptance.
  2. Check tasks created.

#### 7. Get Onboarding Tasks
- **Method:** GET
- **Endpoint:** `/api/oo/onboarding/:candidate_id` (e.g., `/api/oo/onboarding/789`)
- **Description:** Retrieves onboarding tasks for a candidate.
- **Request Body:** None
- **Response (Success):**
  ```json
  {
    "tasks": [
      {
        "id": "404",
        "task": "Setup email",
        "status": "pending"
      }
    ]
  }
  ```
- **Testing Steps:**
  1. Send GET request.
  2. Verify tasks list.

## Error Handling
- **401 Unauthorized:** Invalid or missing JWT token.
- **400 Bad Request:** Invalid request body or parameters.
- **404 Not Found:** Resource not found.
- **500 Internal Server Error:** Server-side issues.

## Notes
- Sample request/response bodies are inferred from route purposes and may need adjustment based on actual controller implementations.
- Ensure database is set up and seeded with test data for realistic testing.
- Check server logs for detailed error messages.
- For AI-assisted endpoints (e.g., create interview, create offer), verify AI service integration.
