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

**Note:** JD operations are asynchronous and use job queues for AI processing. Responses indicate queuing status, not immediate completion. Check the JD status via GET endpoints for updates.

#### 1. Create Job Description
- **Method:** POST
- **Endpoint:** `/api/jd/create`
- **Description:** Initiates JD creation via AI based on a prompt. Queues a job for processing.
- **Request Body (JSON):**
  ```json
  {
    "prompt": "Create a job description for a Software Engineer role requiring React and Node.js skills."
  }
  ```
- **Response (Success):**
  ```json
  {
    "message": "JD generation job queued",
    "jdId": "507f1f77bcf86cd799439011",
    "jobId": "job_12345",
    "status": "queued"
  }
  ```
- **Testing Steps:**
  1. Send POST request with valid prompt and auth header.
  2. Verify 200 status and queued response.
  3. Poll GET /api/jd/get/:jdId to check for completion.

#### 2. Update Job Description
- **Method:** POST
- **Endpoint:** `/api/jd/update`
- **Description:** Updates an existing JD. If prompt changes, re-queues for AI refinement. If approvalStatus changes to "approved", queues for platform posting.
- **Request Body (JSON):**
  ```json
  {
    "jdId": "507f1f77bcf86cd799439011",
    "prompt": "Refine the JD for a Senior Software Engineer.",
    "aiResponse": { /* optional manual overrides */ },
    "status": "completed", // optional
    "approvalStatus": "approved" // optional
  }
  ```
- **Response (Success):**
  ```json
  {
    "message": "JD refinement queued for AI processing" | "JD approved and queued for platform posting" | "JD updated successfully",
    "jd": {
      "_id": "507f1f77bcf86cd799439011",
      "userId": "...",
      "prompt": "...",
      "aiResponse": { /* AI-generated content */ },
      "status": "queued|processing|completed|failed",
      "approvalStatus": "pending|approved|rejected",
      "platformPosts": [ /* if posted */ ],
      "createdAt": "...",
      "updatedAt": "..."
    }
  }
  ```
- **Testing Steps:**
  1. Ensure JD exists (create one first).
  2. Send POST with updates.
  3. Check 200 status and message based on changes (e.g., re-queuing if prompt updated).

#### 3. Delete Job Description
- **Method:** POST
- **Endpoint:** `/api/jd/delete`
- **Description:** Deletes a JD owned by the authenticated user.
- **Request Body (JSON):**
  ```json
  {
    "jdId": "507f1f77bcf86cd799439011"
  }
  ```
- **Response (Success):**
  ```json
  {
    "message": "JD deleted successfully",
    "jdId": "507f1f77bcf86cd799439011"
  }
  ```
- **Testing Steps:**
  1. Send POST with valid jdId.
  2. Verify 200 status and confirm deletion via GET /api/jd/getAll.

#### 4. Get All Job Descriptions
- **Method:** GET
- **Endpoint:** `/api/jd/getAll`
- **Description:** Retrieves all JDs for the authenticated user, sorted by creation date descending.
- **Request Body:** None
- **Response (Success):**
  ```json
  {
    "count": 5,
    "jds": [
      {
        "_id": "507f1f77bcf86cd799439011",
        "userId": "...",
        "prompt": "...",
        "aiResponse": { /* AI-generated content */ },
        "status": "completed",
        "approvalStatus": "approved",
        "platformPosts": [ /* if posted */ ],
        "createdAt": "...",
        "updatedAt": "..."
      }
    ]
  }
  ```
- **Testing Steps:**
  1. Send GET request.
  2. Check 200 status and array of JDs with count.

#### 5. Get Job Description by ID
- **Method:** GET
- **Endpoint:** `/api/jd/get/:id` (e.g., `/api/jd/get/507f1f77bcf86cd799439011`)
- **Description:** Retrieves a specific JD owned by the authenticated user.
- **Request Body:** None
- **Response (Success):**
  ```json
  {
    "jd": {
      "_id": "507f1f77bcf86cd799439011",
      "userId": "...",
      "prompt": "...",
      "aiResponse": { /* AI-generated content */ },
      "status": "completed",
      "approvalStatus": "approved",
      "platformPosts": [ /* if posted */ ],
      "createdAt": "...",
      "updatedAt": "..."
    }
  }
  ```
- **Testing Steps:**
  1. Use a valid ID from previous tests.
  2. Send GET request.
  3. Verify 200 status and JD data.

#### 6. Create Job Post
- **Method:** POST
- **Endpoint:** `/api/jd/createPost`
- **Description:** Initiates posting an approved JD to multiple platforms (LinkedIn, Indeed, Twitter). Note: This endpoint has an inconsistency in the controller implementation—it is not a standard Express handler and may not properly handle req/res. It expects jdId but does not parse from req.body; it may fail or behave unexpectedly.
- **Request Body (JSON):** (Inferred; controller does not properly handle Express req/res)
  ```json
  {
    "jdId": "507f1f77bcf86cd799439011"
  }
  ```
- **Response (Success):** (Uncertain due to controller issue; may not return proper JSON)
  ```json
  {
    "message": "Posting initiated", // or error
    // Actual response depends on fixing the controller
  }
  ```
- **Testing Steps:**
  1. Ensure JD is approved.
  2. Send POST request (may fail due to controller bug).
  3. Check logs for posting attempts; verify platformPosts in JD model.

### Candidate Assessment (CA) Routes - Prefix: `/api/ca`

**Note:** Candidate assessment uses async queues for AI test generation. Initialization queues the test creation; check test status via GET endpoints.

#### 1. Initialize Assessment
- **Method:** POST
- **Endpoint:** `/api/ca/init`
- **Description:** Initializes assessment by creating test entry, generating credentials, queuing AI test generation, and sending notification email.
- **Request Body (JSON):**
  ```json
  {
    "candidate_id": "507f1f77bcf86cd799439011",
    "job_id": "507f1f77bcf86cd799439012",
    "role": "Software Engineer",
    "skills": ["JavaScript", "Node.js", "React"],
    "test_type": "MCQ" // optional, defaults to "MCQ"
  }
  ```
- **Response (Success):**
  ```json
  {
    "success": true,
    "message": "AI test generation started successfully",
    "test_id": "507f1f77bcf86cd799439013",
    "status": "initiated"
  }
  ```
- **Testing Steps:**
  1. Send POST with required fields and auth header.
  2. Verify 201 status and check notification sent (logs/email).
  3. Poll GET /api/ca/test?candidate_id=... to check for test readiness.

#### 2. Get Test
- **Method:** GET
- **Endpoint:** `/api/ca/test`
- **Description:** Retrieves the generated test for a candidate (only if status is pending or in_progress).
- **Query Parameters:** `candidate_id` (required)
- **Request Body:** None
- **Response (Success):**
  ```json
  {
    "success": true,
    "test": {
      "_id": "507f1f77bcf86cd799439013",
      "candidate_id": "507f1f77bcf86cd799439011",
      "job_id": "507f1f77bcf86cd799439012",
      "test_type": "MCQ",
      "test_status": "pending",
      "total_marks": 20,
      "obtained_marks": 0,
      "questions": [
        {
          "question_id": "q1",
          "question": "What is Node.js?",
          "options": ["A. A database", "B. A runtime environment", "C. A framework", "D. A library"],
          "correct_answer": "B",
          "marks": 5,
          "selected_answer": null,
          "is_correct": null
        }
      ],
      "createdAt": "...",
      "updatedAt": "..."
    }
  }
  ```
- **Testing Steps:**
  1. After init, send GET with candidate_id query param.
  2. Check 200 status and test data structure.

#### 3. Submit Test
- **Method:** POST
- **Endpoint:** `/api/ca/submit`
- **Description:** Submits test responses, calculates score, and saves candidate score document.
- **Request Body (JSON):**
  ```json
  {
    "test_id": "507f1f77bcf86cd799439013",
    "responses": [
      {
        "question_id": "q1",
        "answer": "B"
      }
    ]
  }
  ```
- **Response (Success):**
  ```json
  {
    "success": true,
    "message": "Test submitted & evaluated successfully",
    "score": {
      "_id": "507f1f77bcf86cd799439014",
      "candidate_id": "507f1f77bcf86cd799439011",
      "job_id": "507f1f77bcf86cd799439012",
      "test_id": "507f1f77bcf86cd799439013",
      "total_score": 5,
      "percentage": 25,
      "ai_analysis": null, // or AI result if implemented
      "createdAt": "...",
      "updatedAt": "..."
    }
  }
  ```
- **Testing Steps:**
  1. Send POST with test_id and responses.
  2. Verify 200 status and score calculation.

#### 4. Get Shortlisted Candidates
- **Method:** GET
- **Endpoint:** `/api/ca/shortlisted`
- **Description:** Retrieves candidates shortlisted based on AI analysis recommendation ("yes" or "strong_yes"), sends notification emails.
- **Request Body:** None
- **Response (Success):**
  ```json
  {
    "success": true,
    "total": 2,
    "shortlisted": [
      {
        "_id": "507f1f77bcf86cd799439014",
        "candidate_id": {
          "_id": "507f1f77bcf86cd799439011",
          "name": "John Doe",
          "email": "john@example.com"
        },
        "job_id": {
          "_id": "507f1f77bcf86cd799439012",
          "title": "Software Engineer"
        },
        "test_id": "507f1f77bcf86cd799439013",
        "total_score": 15,
        "percentage": 75,
        "ai_analysis": {
          "final_recommendation": "yes"
        },
        "createdAt": "...",
        "updatedAt": "..."
      }
    ]
  }
  ```
- **Testing Steps:**
  1. Send GET request.
  2. Check 200 status and list of shortlisted candidates.
  3. Verify notification emails sent.

### Interview Scheduling (IS) Routes - Prefix: `/api/is`

#### 1. Create Interview
- **Method:** POST
- **Endpoint:** `/api/is/create`
- **Description:** Creates an interview schedule using AI to suggest the best slot based on availabilities, generates meeting link, and sends notification.
- **Request Body (JSON):**
  ```json
  {
    "candidate_id": "507f1f77bcf86cd799439011",
    "job_id": "507f1f77bcf86cd799439012",
    "interviewer_ids": ["507f1f77bcf86cd799439013"],
    "round": "Technical Round 1",
    "candidateAvailability": ["2023-10-01T10:00:00Z", "2023-10-02T14:00:00Z"],
    "interviewerAvailability": ["2023-10-01T10:00:00Z", "2023-10-01T15:00:00Z"],
    "mode": "online" // or "offline"
  }
  ```
- **Response (Success):**
  ```json
  {
    "success": true,
    "message": "Interview scheduled successfully",
    "interview": {
      "_id": "507f1f77bcf86cd799439014",
      "candidate_id": "507f1f77bcf86cd799439011",
      "job_id": "507f1f77bcf86cd799439012",
      "interviewer_ids": ["507f1f77bcf86cd799439013"],
      "round": "Technical Round 1",
      "scheduled_time": "2023-10-01T10:00:00.000Z",
      "mode": "online",
      "meeting_link": "https://meet.example.com/interview123",
      "status": "scheduled",
      "createdAt": "...",
      "updatedAt": "..."
    }
  }
  ```
- **Testing Steps:**
  1. Send POST with required fields and auth header.
  2. Verify 201 status and check notification sent (logs/email).
  3. Confirm AI slot suggestion and meeting link generation.

#### 2. Get Interviews
- **Method:** GET
- **Endpoint:** `/api/is/list`
- **Description:** Retrieves interviews for a user based on role (candidate or interviewer), with populated details.
- **Query Parameters:** `user_id` (required), `role` (required, "candidate" or "interviewer")
- **Request Body:** None
- **Response (Success):**
  ```json
  {
    "success": true,
    "interviews": [
      {
        "_id": "507f1f77bcf86cd799439014",
        "candidate_id": {
          "_id": "507f1f77bcf86cd799439011",
          "name": "John Doe",
          "email": "john@example.com"
        },
        "job_id": {
          "_id": "507f1f77bcf86cd799439012",
          "title": "Software Engineer"
        },
        "interviewer_ids": [
          {
            "_id": "507f1f77bcf86cd799439013",
            "name": "Jane Smith",
            "email": "jane@example.com"
          }
        ],
        "round": "Technical Round 1",
        "scheduled_time": "2023-10-01T10:00:00.000Z",
        "mode": "online",
        "meeting_link": "https://meet.example.com/interview123",
        "status": "scheduled",
        "feedback": null,
        "createdAt": "...",
        "updatedAt": "..."
      }
    ]
  }
  ```
- **Testing Steps:**
  1. Send GET with user_id and role query params.
  2. Check 200 status and populated interview data.

#### 3. Update Interview Status
- **Method:** PUT
- **Endpoint:** `/api/is/status/:id` (e.g., `/api/is/status/507f1f77bcf86cd799439014`)
- **Description:** Updates the status of an interview (e.g., completed, cancelled).
- **Request Body (JSON):**
  ```json
  {
    "status": "completed"
  }
  ```
- **Response (Success):**
  ```json
  {
    "success": true,
    "message": "Interview status updated successfully",
    "interview": {
      "_id": "507f1f77bcf86cd799439014",
      // ... updated interview object
      "status": "completed",
      "updatedAt": "..."
    }
  }
  ```
- **Testing Steps:**
  1. Send PUT with status in body.
  2. Verify 200 status and status change in response.

#### 4. Add Feedback
- **Method:** POST
- **Endpoint:** `/api/is/feedback/:id` (e.g., `/api/is/feedback/507f1f77bcf86cd799439014`)
- **Description:** Adds feedback to an interview post-completion.
- **Request Body (JSON):**
  ```json
  {
    "feedback": "Good candidate with strong technical skills."
  }
  ```
- **Response (Success):**
  ```json
  {
    "success": true,
    "message": "Feedback added successfully",
    "interview": {
      "_id": "507f1f77bcf86cd799439014",
      // ... updated interview object
      "feedback": "Good candidate with strong technical skills.",
      "updatedAt": "..."
    }
  }
  ```
- **Testing Steps:**
  1. Send POST with feedback in body.
  2. Verify 200 status and feedback added to interview.

### Offer and Onboarding (OO) Routes - Prefix: `/api/oo`

#### 1. Create Offer
- **Method:** POST
- **Endpoint:** `/api/oo/create`
- **Description:** Creates a new offer with AI-generated letter text, salary benchmarking, and sends email notification.
- **Request Body (JSON):**
  ```json
  {
    "candidate_id": "507f1f77bcf86cd799439011",
    "job_id": "507f1f77bcf86cd799439012",
    "baseSalary": 85000,
    "positionTitle": "Software Engineer",
    "candidate_email": "john@example.com"
  }
  ```
- **Response (Success):**
  ```json
  {
    "success": true,
    "message": "Offer created and email sent successfully",
    "offer": {
      "_id": "507f1f77bcf86cd799439013",
      "candidate_id": "507f1f77bcf86cd799439011",
      "job_id": "507f1f77bcf86cd799439012",
      "salary_offered": {
        "amount": 85000,
        "currency": "INR",
        "benchmark_position": "75th percentile"
      },
      "offer_letter_text": "AI-generated offer letter content...",
      "status": "approved",
      "signature_link": "https://hrsystem.ai/offers/507f1f77bcf86cd799439011/sign",
      "sent_at": "2023-10-01T10:00:00.000Z",
      "createdAt": "...",
      "updatedAt": "..."
    }
  }
  ```
- **Testing Steps:**
  1. Send POST with required fields and auth header.
  2. Verify 201 status and check email sent (logs).
  3. Confirm AI letter generation and salary benchmarking.

#### 2. Get All Offers
- **Method:** GET
- **Endpoint:** `/api/oo/list`
- **Description:** Retrieves all offers with populated candidate and job details, sorted by creation date descending.
- **Request Body:** None
- **Response (Success):**
  ```json
  {
    "success": true,
    "offers": [
      {
        "_id": "507f1f77bcf86cd799439013",
        "candidate_id": {
          "_id": "507f1f77bcf86cd799439011",
          "name": "John Doe",
          "email": "john@example.com"
        },
        "job_id": {
          "_id": "507f1f77bcf86cd799439012",
          "title": "Software Engineer"
        },
        "salary_offered": {
          "amount": 85000,
          "currency": "INR",
          "benchmark_position": "75th percentile"
        },
        "status": "approved",
        "createdAt": "...",
        "updatedAt": "..."
      }
    ]
  }
  ```
- **Testing Steps:**
  1. Send GET request.
  2. Check 200 status and populated offers list.

#### 3. Get Offer by ID
- **Method:** GET
- **Endpoint:** `/api/oo/:id` (e.g., `/api/oo/507f1f77bcf86cd799439013`)
- **Description:** Retrieves single offer details with populated candidate and job info.
- **Request Body:** None
- **Response (Success):**
  ```json
  {
    "success": true,
    "offer": {
      "_id": "507f1f77bcf86cd799439013",
      "candidate_id": {
        "_id": "507f1f77bcf86cd799439011",
        "name": "John Doe",
        "email": "john@example.com"
      },
      "job_id": {
        "_id": "507f1f77bcf86cd799439012",
        "title": "Software Engineer"
      },
      "salary_offered": {
        "amount": 85000,
        "currency": "INR",
        "benchmark_position": "75th percentile"
      },
      "offer_letter_text": "AI-generated offer letter content...",
      "status": "approved",
      "signature_link": "https://hrsystem.ai/offers/507f1f77bcf86cd799439011/sign",
      "sent_at": "2023-10-01T10:00:00.000Z",
      "createdAt": "...",
      "updatedAt": "..."
    }
  }
  ```
- **Testing Steps:**
  1. Send GET with valid offer ID.
  2. Verify 200 status and full offer details.

#### 4. Update Offer Status
- **Method:** PUT
- **Endpoint:** `/api/oo/status/:id` (e.g., `/api/oo/status/507f1f77bcf86cd799439013`)
- **Description:** Updates the status of an offer (e.g., accepted, rejected).
- **Request Body (JSON):**
  ```json
  {
    "status": "accepted"
  }
  ```
- **Response (Success):**
  ```json
  {
    "success": true,
    "message": "Offer status updated",
    "offer": {
      "_id": "507f1f77bcf86cd799439013",
      // ... updated offer object
      "status": "accepted",
      "updatedAt": "..."
    }
  }
  ```
- **Testing Steps:**
  1. Send PUT with status in body.
  2. Verify 200 status and status change.

#### 5. Resend Offer Email
- **Method:** POST
- **Endpoint:** `/api/oo/resend/:id` (e.g., `/api/oo/resend/507f1f77bcf86cd799439013`)
- **Description:** Resends the offer email to the candidate.
- **Request Body:** None
- **Response (Success):**
  ```json
  {
    "success": true,
    "message": "Offer email resent successfully"
  }
  ```
- **Testing Steps:**
  1. Send POST request.
  2. Verify 200 status and check email resent (logs).

#### 6. Create Onboarding Task
- **Method:** POST
- **Endpoint:** `/api/oo/onboarding/create`
- **Description:** Creates a new onboarding task for a candidate after offer acceptance.
- **Request Body (JSON):**
  ```json
  {
    "candidate_id": "507f1f77bcf86cd799439011",
    "offer_id": "507f1f77bcf86cd799439013",
    "task_title": "Setup Email Account",
    "task_description": "Create corporate email and set up access.",
    "due_date": "2023-11-01T00:00:00Z"
  }
  ```
- **Response (Success):**
  ```json
  {
    "success": true,
    "message": "Onboarding task created successfully",
    "task": {
      "_id": "507f1f77bcf86cd799439014",
      "candidate_id": "507f1f77bcf86cd799439011",
      "offer_id": "507f1f77bcf86cd799439013",
      "task_title": "Setup Email Account",
      "task_description": "Create corporate email and set up access.",
      "due_date": "2023-11-01T00:00:00.000Z",
      "status": "pending",
      "createdAt": "...",
      "updatedAt": "..."
    }
  }
  ```
- **Testing Steps:**
  1. Send POST after offer acceptance.
  2. Verify 201 status and task creation.

#### 7. Get Onboarding Tasks
- **Method:** GET
- **Endpoint:** `/api/oo/onboarding/:candidate_id` (e.g., `/api/oo/onboarding/507f1f77bcf86cd799439011`)
- **Description:** Retrieves all onboarding tasks for a candidate, sorted by due date.
- **Request Body:** None
- **Response (Success):**
  ```json
  {
    "success": true,
    "tasks": [
      {
        "_id": "507f1f77bcf86cd799439014",
        "candidate_id": "507f1f77bcf86cd799439011",
        "offer_id": "507f1f77bcf86cd799439013",
        "task_title": "Setup Email Account",
        "task_description": "Create corporate email and set up access.",
        "due_date": "2023-11-01T00:00:00.000Z",
        "status": "pending",
        "createdAt": "...",
        "updatedAt": "..."
      }
    ]
  }
  ```
- **Testing Steps:**
  1. Send GET with candidate_id.
  2. Verify 200 status and tasks list.

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
