import JDQueue from "../queues/jdQueue.js";
import PlatformQueue from "../queues/jdPostQueue.js";
import JD from "../models/jdModel.js";

/* ───────────────────────────────
   🟩 CREATE JD — Queues Job
──────────────────────────────── */
export async function jdCreateController(req, res) {
  try {
    let { user } = req;
    const { prompt } = req.body;

    if (!prompt) {
      return res.status(400).json({ error: "Prompt is required" });
    }

    console.log("Received JD creation request:", { userId: user._id, prompt });

    // 1️⃣ Create JD with 'queued' status
    const jdDoc = await JD.create({
      userId: user._id,
      prompt,
      aiResponse: {},
      status: "queued",
      approvalStatus: "pending",
    });
    console.log("Created JD document:", jdDoc._id);

    // 2️⃣ Add job to queue
    const job = await JDQueue.add({
      jdId: jdDoc._id,
      userId: user._id,
      prompt,
    });

    console.log("Added job to JDQueue:", job.id);

    // 3️⃣ Respond immediately
    res.status(200).json({
      message: "JD generation job queued",
      jdId: jdDoc._id,
      jobId: job.id,
      status: "queued",
    });
  } catch (err) {
    console.error("JD create error:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
}

/* ───────────────────────────────
   🟨 UPDATE JD — Edit or Approve
──────────────────────────────── */
export async function jdUpdateController(req, res) {
  try {
    let { user } = req;
    const { jdId, prompt, aiResponse, status, approvalStatus } = req.body;

    if (!jdId) {
      console.log("JD update error: JD ID is missing");
      return res.status(400).json({ error: "JD ID is required" });
    }

    // Find the JD that belongs to the user
    const jdDoc = await JD.findOne({ _id: jdId, userId: user._id });
    if (!jdDoc) {
      return res.status(404).json({ error: "JD not found or unauthorized" });
    }

    const updateFields = {};
    let shouldReprocess = false;
    let shouldQueuePost = false;

    // Check if prompt has changed or refinement added
    if (prompt !== undefined && prompt !== jdDoc.prompt) {
      updateFields.prompt = prompt;
      updateFields.status = "queued";
      updateFields.approvalStatus = "pending";
      shouldReprocess = true;
    }

    // Apply manual updates
    if (aiResponse !== undefined) updateFields.aiResponse = aiResponse;

    if (status !== undefined && !shouldReprocess) updateFields.status = status;

    if (approvalStatus !== undefined) {
      updateFields.approvalStatus = approvalStatus;
      // If approvalStatus is approved and it was previously not approved, queue for platform posting
      if (approvalStatus === "approved" && jdDoc.approvalStatus !== "approved") {
        shouldQueuePost = true;
      }
    }

    // Update the JD
    const updatedJD = await JD.findByIdAndUpdate(jdId, updateFields, {
      new: true,
      runValidators: true,
    });

    console.log("JD updated successfully:", updatedJD._id);

    // If prompt changed, reprocess with context (old AI response)
    if (shouldReprocess) {
      const job = await JDQueue.add({
        jdId: updatedJD._id,
        userId: user._id,
        prompt: updatedJD.prompt,
        previousResponse: jdDoc.aiResponse || {}, // old AI response
      });
      console.log("Re-queued JD for AI refinement:", job.id);
    }

    // If JD is approved, queue for posting to platforms
    if (shouldQueuePost) {
      const postJob = await PlatformQueue.add({
        jdId: updatedJD._id,
        userId: user._id,
      });
      console.log("JD approved - queued for posting to platforms:", postJob.id);
    }

    res.status(200).json({
      message: shouldReprocess
        ? "JD refinement queued for AI processing"
        : shouldQueuePost
          ? "JD approved and queued for platform posting"
          : "JD updated successfully",
      jd: updatedJD,
    });
  } catch (err) {
    console.error("JD update error:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

/* ───────────────────────────────
   🟥 DELETE JD
──────────────────────────────── */
export async function jdDeleteController(req, res) {
  try {
    let { user } = req;
    const { jdId } = req.body;

    if (!jdId) {
      return res.status(400).json({ error: "JD ID is required" });
    }

    const jdDoc = await JD.findOneAndDelete({ _id: jdId, userId: user._id });
    if (!jdDoc) {
      return res.status(404).json({ error: "JD not found or unauthorized" });
    }

    console.log("JD deleted successfully:", jdId);

    res.status(200).json({ message: "JD deleted successfully", jdId });
  } catch (err) {
    console.error("JD delete error:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
}

/* ───────────────────────────────
   🟦 GET ALL JDs (for a user)
──────────────────────────────── */
export async function jdGetAllController(req, res) {
  try {
    let { user } = req;

    const jds = await JD.find({ userId: user._id }).sort({ createdAt: -1 });

    res.status(200).json({
      count: jds.length,
      jds,
    });
  } catch (err) {
    console.error("JD getAll error:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
}

/* ───────────────────────────────
   🟪 GET JD BY ID
──────────────────────────────── */
export async function jdGetByIdController(req, res) {
  try {
    let { user } = req;
    const { id } = req.params;

    const jd = await JD.findOne({ _id: id, userId: user._id });
    if (!jd) {
      return res.status(404).json({ error: "JD not found or unauthorized" });
    }

    res.status(200).json({ jd });
  } catch (err) {
    console.error("JD getById error:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
}
