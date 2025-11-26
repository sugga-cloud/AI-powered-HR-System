import CandidateTest from "../../models/Candidate Assessment Models/CandidateTestModel.js";
import CandidateScore from "../../models/Candidate Assessment Models/CandidateScoreModel.js";
// import { aiEvaluateTest } from "../../services/"; // ML/AI service (later)
import TestQueue from "../../queues/testQueue.js"; // Bull queue for async processing
import axios from "axios";
import ShortlistedCandidatesModel from "../../models/Resume Screening Models/ShortlistedCandidatesModel.js";

/**
 * @desc Initialize test for candidate (create test entry, generate credentials)
 * @route POST /api/candidate-assessment/init
 */

export const caInitController = async (req, res) => {
  try {
    const { candidate_id, job_id, role, skills, test_type = "MCQ" } = req.body;

    // 1️⃣ Create a base CandidateTest document (status: in_progress)
    const newTest = await CandidateTest.create({
      candidate_id,
      job_id,
      test_type,
      test_status: "in_progress",
      total_marks: 0,
      obtained_marks: 0,
      questions: [],
    });

    // 2️⃣ Generate the AI prompt dynamically
    const prompt = `Generate a ${test_type} assessment for the ${role} role.
Include questions covering ${skills.join(", ")}.
Each question should be clear, professional, and have 4 options with one correct answer.`;

    // 3️⃣ Add this job to Bull Queue for async AI test generation
    await TestQueue.add({
      testId: newTest._id,
      prompt,
      userId: candidate_id,
    });
    const shortlistedCandidate = await ShortlistedCandidatesModel.findOne({
      candidateId: candidate_id,
      jobId: job_id,
    }).populate('candidateId');

    if (!shortlistedCandidate) {
      console.warn("⚠️ Shortlisted candidate not found for:", { candidate_id, job_id });
      return res.status(404).json({ success: false, message: "Candidate not found in shortlisted list" });
    }

    // Get email and name from populated candidateId
    const candidateEmail = shortlistedCandidate.candidateId?.email || shortlistedCandidate.email;
    const candidateName = shortlistedCandidate.candidateId?.name || shortlistedCandidate.name;

    // Verify email exists
    if (!candidateEmail) {
      console.warn("⚠️ Candidate email not found for candidate:", candidate_id);
      return res.status(400).json({ success: false, message: "Candidate email not found" });
    }

    let [loginId, password] = (() => {
      const lid = `cand_${Math.random().toString(36).substring(2, 8)}`;
      const pwd = Math.random().toString(36).substring(2, 10);
      return [lid, pwd];
    })();

    shortlistedCandidate.loginId = loginId;
    shortlistedCandidate.password = password;
    await shortlistedCandidate.save();

    // 4️⃣ Notify candidate (optional)
    try {
      const notificationPayload = {
        to: candidateEmail,
        subject: "Your Candidate Assessment Test is Being Prepared",
        html: `Dear ${candidateName},<br/><br/>
Your assessment test for the applied role is being prepared. You will receive another email once it's ready.<br/><br/>
Login Credentials:<br/> <strong>Login ID:</strong> ${loginId}<br/> <strong>Password:</strong> ${password}<br/><br/>
Best regards,<br/>
HR Team`,
      };

      console.log("📧 Sending notification to:", candidateEmail);
      await axios.post(`${process.env.NOTIFICATION_SERVICE_URL}/api/notifications/send`, notificationPayload);
      console.log("✅ Notification queued successfully for:", candidateEmail);
    } catch (emailError) {
      console.warn("⚠️ Email notification failed, but test will proceed:", emailError.message);
    }

    // 5️⃣ Send response back immediately
    res.status(201).json({
      success: true,
      message: "AI test generation started successfully",
      test_id: newTest._id,
      status: "in_progress",
    });
  } catch (error) {
    console.error("❌ Init Test Error:", error);
    res.status(500).json({ success: false, message: "Failed to initialize test" });
  }
};

/**
 * @desc Fetch test details for candidate
 * @route GET /api/candidate-assessment/test
 */
export const caGetTestController = async (req, res) => {
  try {
    const { test_id } = req.params;

    const test = await CandidateTest.findById(test_id);

    if (!test)
      return res
        .status(404)
        .json({ success: false, message: "No test found for candidate" });

    res.status(200).json({ success: true, test });
  } catch (error) {
    console.error("Get Test Error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

/**
 * @desc Submit test & evaluate score (via AI + rule-based logic)
 * @route POST /api/candidate-assessment/submit
 */
export const caSubmitTestController = async (req, res) => {
  try {
    const { test_id, responses } = req.body;

    const test = await CandidateTest.findById(test_id);
    if (!test)
      return res
        .status(404)
        .json({ success: false, message: "Test not found" });

    // Mark selected answers and calculate raw score
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
    test.obtained_marks = obtained;
    test.test_status = "completed";
    test.completed_at = new Date();
    await test.save();

    // Call AI evaluation microservice for deeper insights
    // const aiResult = await aiEvaluateTest(test._id);
    const aiResult = {}; // Initialize as empty object

    // Save candidate score document
    const scoreDoc = await CandidateScore.create({
      candidate_id: test.candidate_id,
      job_id: test.job_id,
      test_id: test._id,
      total_score: obtained,
      percentage: (obtained / test.total_marks) * 100,
      ai_analysis: aiResult,
    });

    res.status(200).json({
      success: true,
      message: "Test submitted & evaluated successfully",
      score: scoreDoc,
    });
  } catch (error) {
    console.error("Submit Test Error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

/**
 * @desc Fetch shortlisted candidates (based on AI score threshold)
 * @route GET /api/candidate-assessment/shortlisted
 */
export const caShortlistedController = async (req, res) => {
  try {
    const shortlisted = await CandidateScore.find({
      "ai_analysis.final_recommendation": { $in: ["yes", "strong_yes"] },
    }).populate("candidate_id job_id");

    // Send email to each shortlisted candidate
    for (const candidate of shortlisted) {
      try {
        const candidateName = candidate.candidate_id?.name || "Candidate";
        const candidateEmail = candidate.candidate_id?.email;

        if (!candidateEmail) {
          console.warn("⚠️ Email not found for candidate:", candidateName);
          continue;
        }
        const html = `
<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width,initial-scale=1" />
    <style>
      body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial; background:#f4f6f8; margin:0; padding:24px; color:#0f172a; }
      .container { max-width:640px; margin:0 auto; background:#ffffff; border-radius:8px; box-shadow:0 4px 18px rgba(15,23,42,0.06); overflow:hidden; }
      .header { background:#0b6efd; padding:20px 24px; color:#ffffff; text-align:left; }
      .header h1 { margin:0; font-size:20px; letter-spacing:0.2px; }
      .body { padding:24px; line-height:1.6; color:#0f172a; }
      .greeting { font-size:16px; margin-bottom:12px; }
      .muted { color:#475569; font-size:14px; }
      .bold { font-weight:600; color:#0f172a; }
      @media (max-width:600px) {
        .body { padding:16px; }
        .header { padding:16px; }
      }
    </style>
  </head>
  <body>
    <div class="container">
      <div class="header">
        <h1>Congratulations — You’re Shortlisted!</h1>
      </div>

      <div class="body">
        <p class="greeting">Hi <span class="bold">${candidateName}</span>,</p>

        <p class="muted">
          Thank you for participating in the first assessment round. We're pleased to inform you that you have <strong>successfully passed</strong> this round and have been shortlisted for the next stage. The next round details will be coming soon.
        </p>
      </div>
    </div>
  </body>
</html>
`;
        const notificationPayload = {
          to: candidateEmail,
          subject: "You Have Passed the assessment Round",
          html,
        };

        await axios.post(`${process.env.NOTIFICATION_SERVICE_URL}/api/notifications/send`, notificationPayload);
        console.log("✅ Shortlist notification sent to:", candidateEmail);
      } catch (emailError) {
        console.warn("⚠️ Failed to send shortlist email:", emailError.message);
        // Continue with other candidates even if one fails
      }
    }

    res.status(200).json({
      success: true,
      total: shortlisted.length,
      shortlisted,
    });
  } catch (error) {
    console.error("Shortlisted Fetch Error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};
