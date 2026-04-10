import Offer from "../models/Offer and Onboarding/Offer.js";
import OnboardingTask from "../models/Offer and Onboarding/OnboardingTask.js";

export const createOffer = async (req, res) => {
  try {
    const { candidate_id, job_id, baseSalary, positionTitle } = req.body;
    
    // NOTE: Simplified version without AI offer letter generation microservice for now
    const offer = await Offer.create({
      candidate_id,
      job_id,
      salary_offered: {
        amount: baseSalary,
        currency: "INR",
      },
      offer_letter_text: `Offer letter for ${positionTitle} position.`,
      status: "approved",
      sent_at: new Date(),
    });

    res.status(201).json({
      success: true,
      message: "Offer created successfully",
      offer,
    });
  } catch (error) {
    console.error("Offer Creation Error:", error);
    res.status(500).json({ success: false, message: "Failed to create offer" });
  }
};

export const getOffers = async (req, res) => {
  try {
    const offers = await Offer.find()
      .populate("candidate_id job_id")
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, offers });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to fetch offers" });
  }
};

export const updateOfferStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const offer = await Offer.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );
    if (!offer) return res.status(404).json({ success: false, message: "Offer not found" });
    res.status(200).json({ success: true, offer });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to update offer" });
  }
};

export const createOnboardingTask = async (req, res) => {
  try {
    const { candidate_id, offer_id, task_title, task_description, due_date } = req.body;
    const newTask = await OnboardingTask.create({
      candidate_id,
      offer_id,
      task_title,
      task_description,
      due_date,
    });
    res.status(201).json({ success: true, task: newTask });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to create task" });
  }
};

export const getOnboardingTasks = async (req, res) => {
  try {
    const { candidate_id } = req.params;
    const tasks = await OnboardingTask.find({ candidate_id }).sort({ due_date: 1 });
    res.status(200).json({ success: true, tasks });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to fetch tasks" });
  }
};
