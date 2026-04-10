import CandidateTest from "../models/Candidate Assessment Models/CandidateTestModel.js";
import CandidateScore from "../models/Candidate Assessment Models/CandidateScoreModel.js";
import ShortlistedCandidate from "../models/Resume Screening Models/ShortlistedCandidatesModel.js";
import Candidate from "../models/candidateModel.js";
import JD from "../models/jdModel.js";
import { generateAssessmentQuestions } from "../services/aiService.js";

export const initAssessment = async (req, res) => {
  try {
    const { candidate_id, job_id, role, skills, test_type = "MCQ" } = req.body;
    
    // 🧠 Generate Questions using AI
    const questions = await generateAssessmentQuestions(role, skills || []);
    const totalMarks = questions.reduce((acc, q) => acc + (q.marks || 1), 0);

    const newTest = await CandidateTest.create({
      candidate_id,
      job_id,
      test_type,
      test_status: "pending",
      total_marks: totalMarks,
      questions: questions,
    });

    // NOTE: Simplified version without background queue for now
    res.status(201).json({
      success: true,
      message: "AI assessment initialized.",
      test_id: newTest._id,
      status: "in_progress",
    });
  } catch (error) {
    console.error("Assessment Init Error:", error);
    res.status(500).json({ success: false, message: "Failed to initialize test" });
  }
};

export const getTestDetails = async (req, res) => {
  try {
    const { candidate_id } = req.query;
    const test = await CandidateTest.findOne({
      candidate_id,
      test_status: { $in: ["pending", "in_progress"] },
    });

    if (!test) return res.status(404).json({ success: false, message: "No test found" });
    res.status(200).json({ success: true, test });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};

export const submitAssessment = async (req, res) => {
  try {
    const { test_id, responses } = req.body;
    const test = await CandidateTest.findById(test_id);
    if (!test) return res.status(404).json({ success: false, message: "Test not found" });

    // Local evaluation logic
    let obtained = 0;
    test.questions = test.questions.map((q) => {
      const response = responses.find((r) => r.question_id === q.question_id);
      if (response) {
        q.selected_answer = response.answer;
        q.is_correct = q.correct_answer === response.answer;
        if (q.is_correct) obtained += q.marks;
      }
      return q;
    });

    test.total_marks = obtained; // Simplified
    test.test_status = "completed";
    test.completed_at = new Date();
    await test.save();

    const scoreDoc = await CandidateScore.create({
      candidate_id: test.candidate_id,
      job_id: test.job_id,
      test_id: test._id,
      total_score: obtained,
      percentage: (obtained / (test.questions.length || 1)) * 100,
    });

    res.status(200).json({ success: true, score: scoreDoc });
  } catch (error) {
    console.error("Submit Test Error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

export const getShortlistedWithScores = async (req, res) => {
  try {
    const shortlisted = await CandidateScore.find().populate("candidate_id job_id");
    res.status(200).json({ success: true, total: shortlisted.length, shortlisted });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};

export const getAssessmentDetail = async (req, res) => {
  try {
    const { id } = req.params;
    const detail = await CandidateScore.findById(id).populate("candidate_id job_id");
    if (!detail) return res.status(404).json({ success: false, message: "Not found" });
    res.status(200).json({ success: true, shortlisted: detail });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};
