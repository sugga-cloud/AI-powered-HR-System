export async function generateMeetingLink(interview) {
    if (interview.mode === "online") {
        return `https://meet.google.com/${Math.random().toString(36).substring(7)}`;
    } else {
        return "Onsite Interview at Office HQ";
    }
}