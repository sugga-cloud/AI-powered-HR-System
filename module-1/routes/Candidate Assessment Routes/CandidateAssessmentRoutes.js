import { Router } from "express";
const router = Router();

router.post('/init', caInitController); // test creation, credential creation, notification
router.get('/test', caGetTestController); // get the generated test
router.post('/submit', caSubmitTestController); // submit test, score calculation
router.get('/shortlisted', caShortlistedContoller); // get all shortlisted candidates