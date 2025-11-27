import { Router } from "express";
import {
    caInitController,
    caGetTestController,
    caGetTestByIdController,
    caSubmitTestController,
    caShortlistedController,
    caSendShortlistNotificationsController,
    caGetAssessmentDetailController
} from "../../controllers/Candidate Assessment Controllers/candidateAssessmentController.js";
const router = Router();

router.post('/init', caInitController); // test creation, credential creation, notification
router.get('/test', caGetTestController); // get test by candidate_id
router.get('/test/:test_id', caGetTestByIdController); // get test by test_id (for email links)
router.post('/submit', caSubmitTestController); // submit test, score calculation
router.get('/shortlisted/:id', caGetAssessmentDetailController); // get single assessment detail by ID (must come before catch-all)
router.get('/shortlisted', caShortlistedController); // get all shortlisted candidates
router.post('/notify-shortlisted', caSendShortlistNotificationsController); // send shortlist notification emails (one-time)

export default router;