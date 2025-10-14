import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class AIServiceIntegrator {
    constructor() {
        this.pythonPath = process.env.PYTHON_PATH || 'python';
        this.servicesPath = path.join(__dirname, '..', 'services', 'Candidate Assessment');
    }

    async initializeProctoring(sessionId) {
        try {
            const proctorProcess = spawn(this.pythonPath, [
                path.join(this.servicesPath, 'AIProctor.py'),
                '--session', sessionId
            ]);

            return new Promise((resolve, reject) => {
                let output = '';

                proctorProcess.stdout.on('data', (data) => {
                    output += data.toString();
                });

                proctorProcess.stderr.on('data', (data) => {
                    console.error(`Proctor Error: ${data}`);
                });

                proctorProcess.on('close', (code) => {
                    if (code !== 0) {
                        reject(new Error(`Proctor process exited with code ${code}`));
                        return;
                    }
                    resolve(JSON.parse(output));
                });
            });
        } catch (error) {
            console.error('Error initializing proctoring:', error);
            throw error;
        }
    }

    async analyzeVideoInterview(videoPath, audioPath) {
        try {
            const analyzerProcess = spawn(this.pythonPath, [
                path.join(this.servicesPath, 'VideoInterviewAnalyzer.py'),
                '--video', videoPath,
                '--audio', audioPath
            ]);

            return new Promise((resolve, reject) => {
                let output = '';

                analyzerProcess.stdout.on('data', (data) => {
                    output += data.toString();
                });

                analyzerProcess.stderr.on('data', (data) => {
                    console.error(`Analyzer Error: ${data}`);
                });

                analyzerProcess.on('close', (code) => {
                    if (code !== 0) {
                        reject(new Error(`Analyzer process exited with code ${code}`));
                        return;
                    }
                    resolve(JSON.parse(output));
                });
            });
        } catch (error) {
            console.error('Error analyzing video interview:', error);
            throw error;
        }
    }

    async getPredictiveScore(candidateData) {
        try {
            const scorerProcess = spawn(this.pythonPath, [
                path.join(this.servicesPath, 'PredictiveScoring.py'),
                '--data', JSON.stringify(candidateData)
            ]);

            return new Promise((resolve, reject) => {
                let output = '';

                scorerProcess.stdout.on('data', (data) => {
                    output += data.toString();
                });

                scorerProcess.stderr.on('data', (data) => {
                    console.error(`Scorer Error: ${data}`);
                });

                scorerProcess.on('close', (code) => {
                    if (code !== 0) {
                        reject(new Error(`Scorer process exited with code ${code}`));
                        return;
                    }
                    resolve(JSON.parse(output));
                });
            });
        } catch (error) {
            console.error('Error getting predictive score:', error);
            throw error;
        }
    }

    async handleProctoringViolation(violation) {
        // Implement violation handling logic
        // This could include:
        // 1. Logging the violation
        // 2. Notifying the assessment supervisor
        // 3. Taking automated actions based on severity
        console.log('Handling proctoring violation:', violation);
        // Add your implementation here
    }

    async processAssessmentResults(assessmentId, candidateData) {
        try {
            // 1. Get predictive score
            const predictiveScore = await this.getPredictiveScore(candidateData);

            // 2. Analyze any video components
            let videoAnalysis = null;
            if (candidateData.videoResponse) {
                videoAnalysis = await this.analyzeVideoInterview(
                    candidateData.videoResponse.video,
                    candidateData.videoResponse.audio
                );
            }

            // 3. Combine all results
            const finalResults = {
                assessmentId,
                predictiveScore,
                videoAnalysis,
                timestamp: new Date(),
                status: 'completed'
            };

            // 4. Return combined results
            return finalResults;

        } catch (error) {
            console.error('Error processing assessment results:', error);
            throw error;
        }
    }
}

export default new AIServiceIntegrator();