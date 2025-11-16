export async function getSalaryBenchmark(positionTitle, baseSalary) {
    // In production, connect to external API or dataset
    const marketRange = {
        min: baseSalary * 0.9,
        max: baseSalary * 1.2,
    };
    const percentile =
        baseSalary < marketRange.min
            ? 25
            : baseSalary > marketRange.max
                ? 90
                : 60;

    return { percentile, marketRange };
}
