export async function suggestBestSlot(candidateAvailability, interviewerAvailability) {
    // In production, this will use AI/NLP reasoning to pick the best slot
    const overlap = candidateAvailability.find((slot) =>
        interviewerAvailability.includes(slot)
    );

    return overlap || candidateAvailability[0]; // fallback
}
