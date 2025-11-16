import { Router } from "express";
import {
    createOfferController,
    getOffersController,
    getOfferByIdController,
    updateOfferStatusController,
    resendOfferEmailController,
    createOnboardingTaskController,
    getOnboardingTasksController
} from "../../controllers/Offer and Onboarding Controllers/offerController.js";

const router = Router();

// OFFER MANAGEMENT ROUTES

// Create new offer (AI-generated + email sent)
router.post("/create", createOfferController);

// Get all offers (for HR/Admin dashboard)
router.get("/list", getOffersController);

// Get single offer details by ID
router.get("/:id", getOfferByIdController);

// Update offer status (approve, reject, accept, etc.)
router.put("/status/:id", updateOfferStatusController);

// Resend offer email to candidate
router.post("/resend/:id", resendOfferEmailController);

// ONBOARDING MANAGEMENT ROUTES

// Create onboarding task after offer acceptance
router.post("/onboarding/create", createOnboardingTaskController);

// Get onboarding tasks for a candidate
router.get("/onboarding/:candidate_id", getOnboardingTasksController);

export default router;
