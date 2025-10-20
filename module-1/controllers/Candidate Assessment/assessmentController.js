import Assessment from '../../models/Candidate Assessment/Assessment.js';
import AIServiceIntegrator from '../../utils/AIServiceIntegrator.js';
import { validationResult } from 'express-validator';

// Initialize assessment session
export const initializeAssessment = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { candidateId, jobPostingId, assessmentType } = req.body;

        // Create new assessment
        const assessment = new Assessment({
            candidate: candidateId,
            job_posting: jobPostingId,
            assessment_type: assessmentType,
            status: 'pending'
        });

        // Initialize AI proctoring if required
        if (assessment.proctoring_settings.enabled) {
            const proctoring = await AIServiceIntegrator.initializeProctoring(assessment._id);
            assessment.proctoring_settings = {
                ...assessment.proctoring_settings,
                session_id: proctoring.sessionId
            };
        }

        await assessment.save();
        res.status(201).json(assessment);
    } catch (error) {
        console.error('Error in initializeAssessment:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

// Start assessment
export const startAssessment = async (req, res) => {
    try {
        const assessment = await Assessment.findById(req.params.id);
        if (!assessment) {
            return res.status(404).json({ message: 'Assessment not found' });
        }

        assessment.status = 'in_progress';
        assessment.completion_details.start_time = new Date();
        await assessment.save();

        res.json(assessment);
    } catch (error) {
        console.error('Error in startAssessment:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

// Submit assessment
export const submitAssessment = async (req, res) => {
    try {
        const assessment = await Assessment.findById(req.params.id);
        if (!assessment) {
            return res.status(404).json({ message: 'Assessment not found' });
        }

        // Update completion details
        assessment.status = 'completed';
        assessment.completion_details.end_time = new Date();
        assessment.completion_details.duration = 
            (assessment.completion_details.end_time - assessment.completion_details.start_time) / 1000; // in seconds

        // Process assessment results
        const results = await AIServiceIntegrator.processAssessmentResults(
            assessment._id,
            req.body
        );

        // Update assessment with results
        assessment.scoring = results.predictiveScore;
        if (results.videoAnalysis) {
            assessment.video_analysis_results = results.videoAnalysis;
        }

        await assessment.save();
        res.json(results);
    } catch (error) {
        console.error('Error in submitAssessment:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

// Record proctoring violation
export const recordViolation = async (req, res) => {
    try {
        const { assessmentId } = req.params;
        const violationData = req.body;

        const assessment = await Assessment.findById(assessmentId);
        if (!assessment) {
            return res.status(404).json({ message: 'Assessment not found' });
        }

        // Record violation
        await assessment.recordViolation(violationData);

        // Handle violation through AI service
        await AIServiceIntegrator.handleProctoringViolation({
            assessmentId,
            ...violationData
        });

        res.json({ message: 'Violation recorded successfully' });
    } catch (error) {
        console.error('Error in recordViolation:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

// Get assessment results
export const getAssessmentResults = async (req, res) => {
    try {
        const assessment = await Assessment.findById(req.params.id)
            .populate('candidate', 'name email')
            .populate('job_posting', 'title');

        if (!assessment) {
            return res.status(404).json({ message: 'Assessment not found' });
        }

        res.json({
            assessment_details: {
                type: assessment.assessment_type,
                status: assessment.status,
                duration: assessment.completion_details.duration
            },
            scoring: assessment.scoring,
            proctoring_summary: {
                violations: assessment.proctoring_logs.length,
                severity_breakdown: assessment.proctoring_logs.reduce((acc, log) => {
                    acc[log.severity] = (acc[log.severity] || 0) + 1;
                    return acc;
                }, {})
            },
            video_analysis: assessment.video_analysis_results,
            adaptive_testing: assessment.adaptive_test_metrics
        });
    } catch (error) {
        console.error('Error in getAssessmentResults:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

// Update assessment settings
export const updateAssessmentSettings = async (req, res) => {
    try {
        const { id } = req.params;
        const updates = req.body;

        const assessment = await Assessment.findById(id);
        if (!assessment) {
            return res.status(404).json({ message: 'Assessment not found' });
        }

        // Update settings
        if (updates.proctoring_settings) {
            assessment.proctoring_settings = {
                ...assessment.proctoring_settings,
                ...updates.proctoring_settings
            };
        }

        if (updates.video_interview_settings) {
            assessment.video_interview_settings = {
                ...assessment.video_interview_settings,
                ...updates.video_interview_settings
            };
        }

        await assessment.save();
        res.json(assessment);
    } catch (error) {
        console.error('Error in updateAssessmentSettings:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

// Get assessment analytics
export const getAssessmentAnalytics = async (req, res) => {
    try {
        const { jobPostingId } = req.params;

        const assessments = await Assessment.find({ job_posting: jobPostingId });

        const analytics = {
            total_assessments: assessments.length,
            completion_rate: assessments.filter(a => a.status === 'completed').length / assessments.length,
            average_score: assessments.reduce((acc, a) => acc + (a.scoring?.total_score || 0), 0) / assessments.length,
            success_probability_distribution: assessments.reduce((acc, a) => {
                const prob = Math.floor((a.scoring?.success_probability || 0) * 10) / 10;
                acc[prob] = (acc[prob] || 0) + 1;
                return acc;
            }, {}),
            violation_statistics: {
                total_violations: assessments.reduce((acc, a) => acc + a.proctoring_logs.length, 0),
                average_violations_per_assessment: assessments.reduce((acc, a) => acc + a.proctoring_logs.length, 0) / assessments.length
            }
        };

        res.json(analytics);
    } catch (error) {
        console.error('Error in getAssessmentAnalytics:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};