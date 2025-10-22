import JD from "../models/jdModel.js";

/**
 * List of platforms (dynamic)
 */
const platforms = [
  {
    name: "LinkedIn",
    post: async (jd) => {
      console.log(`Posting JD ${jd._id} to LinkedIn...`);
      return { success: true, message: "Posted to LinkedIn" };
    },
  },
  {
    name: "Indeed",
    post: async (jd) => {
      console.log(`Posting JD ${jd._id} to Indeed...`);
      return { success: true, message: "Posted to Indeed" };
    },
  },
  {
    name: "Twitter",
    post: async (jd) => {
      const content = `${jd.jobTitle} at ${jd.company}\n${jd.aiMetadata?.shortSummary || ""}\n${(jd.aiMetadata?.hashtags || []).join(" ")}`;
      console.log(`Posting JD ${jd._id} to Twitter:`, content);
      return { success: true, message: "Posted to Twitter" };
    },
  },
];

/**
 * Post a JD to all configured platforms
 */
export async function jdPostController(jdId) {
  const jd = await JD.findById(jdId);
  if (!jd) throw new Error("JD not found");

  const results = [];

  await Promise.all(
    platforms.map(async (platform) => {
      try {
        const result = await platform.post(jd);
        results.push({ platform: platform.name, ...result, status: "success" });
      } catch (err) {
        console.error(`Failed to post to ${platform.name}:`, err.message);
        results.push({ platform: platform.name, success: false, message: err.message, status: "failed" });
      }
    })
  );

  jd.platformPosts = results;
  await jd.save();

  return results;
}
