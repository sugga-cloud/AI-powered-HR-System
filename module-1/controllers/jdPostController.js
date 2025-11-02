import JDQueue from "../queues/jdPostQueue.js";
import JD from "../models/jdModel.js";

/**
 * @desc Queue JD for posting to external platforms
 * @route POST /api/jd/post
 */
export async function jdPostController(req, res) {
  try {
    const { jdId } = req.body;

    // 1️⃣ Validate JD ID
    const jd = await JD.findById(jdId);
    if (!jd) {
      return res.status(404).json({
        success: false,
        message: "JD not found",
      });
    }

    // 2️⃣ Add JD to posting queue (Bull)
    await JDQueue.add(
      { jdId }, // job data
      {
        attempts: 3,          // retry 3 times if fails
        backoff: 5000,        // 5-second delay between retries
        removeOnComplete: true,
        removeOnFail: false,
      }
    );

    console.log(`📤 Queued JD ${jdId} for posting to job platforms...`);

    // 3️⃣ Send Response
    return res.status(200).json({
      success: true,
      message: "JD queued for posting successfully",
      queuedId: jdId,
    });
  } catch (error) {
    console.error("JD Post Queue Error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to queue JD for posting",
      error: error.message,
    });
  }
}
