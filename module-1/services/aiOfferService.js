import AI from "../AI/genAI-1.0.mjs";

const ai = new AI({ apiKey: process.env.OPEN_ROUTER_API });

export async function generateAIOfferLetter({ candidate_id, positionTitle, salary }) {
    const prompt = `
Generate a professional, friendly job offer letter for the role of ${positionTitle}.
Mention a salary of ₹${salary} per annum.
Tone: Formal but warm.
Include joining instructions and welcome message.
`;

    const aiResponse = await ai.ask([{ role: "user", content: prompt }], "text");
    return aiResponse;
}
