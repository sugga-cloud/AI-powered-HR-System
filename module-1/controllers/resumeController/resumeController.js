import resumeShortListQueue from '../../queues/resumeShortListQueue.js';

export const shortListController = async (req, res) => {
  try {
    const { jdId } = req.body;

    if (!jdId) {
      return res.status(400).json({ message: "jdId is required" });
    }

    await resumeShortListQueue.add('resumeShortlistQueue', { jdId });

    return res.status(200).json({ message: "Resume shortlisting in progress" });
  } catch (error) {
    console.error("Error in shortListController:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};
