import Resume from '../../../models/Resume Screening/Resume.js';
import ResumeAnalysis from '../../../models/Resume Screening/ResumeAnalysis.js';
import JobPosting from '../../../models/Job Posting/JobPosting.js';
import User from '../../../models/User.js';
import { Configuration, OpenAIApi } from 'openai';
import dotenv from 'dotenv';

dotenv.config();

// Initialize OpenAI
const configuration = new Configuration({
    apiKey: process.env.OPENAI_API_KEY
});
const openai = new OpenAIApi(configuration);

/**
 * Update resume screening status
 * @route PUT /api/v1/screening/:resumeId/status
 */
export const updateScreeningStatus = async (req, res) => {
    try {
        const { resumeId } = req.params;
        const { status, stage, feedback } = req.body;

        const resume = await Resume.findById(resumeId);
        if (!resume) {
            return res.status(404).json({ message: 'Resume not found' });
        }

        // Validate status transition
        if (!isValidStatusTransition(resume.status, status)) {
            return res.status(400).json({
                message: 'Invalid status transition',
                current: resume.status,
                requested: status
            });
        }

        // Update resume status
        resume.status = status;
        if (stage) resume.screening_stage = stage;

        // Add feedback if provided
        if (feedback) {
            resume.feedback.push({
                reviewer: req.user._id,
                stage: stage || resume.screening_stage,
                rating: feedback.rating,
                comments: feedback.comments
            });
        }

        await resume.save();

        // Trigger notifications
        await notifyStatusChange(resume);

        res.json({
            message: 'Screening status updated',
            resume: {
                id: resume._id,
                status: resume.status,
                stage: resume.screening_stage
            }
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

/**
 * Assign resume to reviewer
 * @route POST /api/v1/screening/:resumeId/assign
 */
export const assignReviewer = async (req, res) => {
    try {
        const { resumeId } = req.params;
        const { reviewerId, stage } = req.body;

        // Validate reviewer
        const reviewer = await User.findById(reviewerId);
        if (!reviewer || !reviewer.roles.includes('reviewer')) {
            return res.status(400).json({ message: 'Invalid reviewer' });
        }

        const resume = await Resume.findById(resumeId);
        if (!resume) {
            return res.status(404).json({ message: 'Resume not found' });
        }

        // Create assignment
        const assignment = {
            reviewer: reviewerId,
            stage,
            assigned_at: new Date(),
            status: 'pending'
        };

        resume.assignments = resume.assignments || [];
        resume.assignments.push(assignment);
        
        // Update screening stage if provided
        if (stage) {
            resume.screening_stage = stage;
        }

        await resume.save();

        // Notify reviewer
        await notifyReviewer(reviewer, resume);

        res.json({
            message: 'Reviewer assigned successfully',
            assignment
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

/**
 * Get screening workflow status
 * @route GET /api/v1/screening/:resumeId/workflow
 */
export const getWorkflowStatus = async (req, res) => {
    try {
        const { resumeId } = req.params;
        
        const resume = await Resume.findById(resumeId)
            .populate('feedback.reviewer')
            .populate('assignments.reviewer');

        if (!resume) {
            return res.status(404).json({ message: 'Resume not found' });
        }

        // Get workflow timeline
        const timeline = await generateWorkflowTimeline(resume);
        
        // Get next steps
        const nextSteps = determineNextSteps(resume);
        
        // Get screening metrics
        const metrics = calculateScreeningMetrics(resume);

        res.json({
            current_status: resume.status,
            current_stage: resume.screening_stage,
            timeline,
            next_steps: nextSteps,
            metrics,
            feedback: resume.feedback,
            assignments: resume.assignments
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

/**
 * Submit screening feedback
 * @route POST /api/v1/screening/:resumeId/feedback
 */
export const submitFeedback = async (req, res) => {
    try {
        const { resumeId } = req.params;
        const { rating, comments, recommendation, tags } = req.body;

        const resume = await Resume.findById(resumeId);
        if (!resume) {
            return res.status(404).json({ message: 'Resume not found' });
        }

        // Validate reviewer assignment
        const isAssigned = resume.assignments?.some(
            a => a.reviewer.toString() === req.user._id.toString() && a.status === 'pending'
        );

        if (!isAssigned && !req.user.roles.includes('admin')) {
            return res.status(403).json({ message: 'Not authorized to provide feedback' });
        }

        // Create feedback entry
        const feedback = {
            reviewer: req.user._id,
            stage: resume.screening_stage,
            rating,
            comments,
            recommendation,
            timestamp: new Date()
        };

        resume.feedback.push(feedback);

        // Update tags if provided
        if (tags && tags.length > 0) {
            resume.tags = [...new Set([...resume.tags, ...tags])];
        }

        // Update assignment status
        const assignment = resume.assignments.find(
            a => a.reviewer.toString() === req.user._id.toString() && a.status === 'pending'
        );
        if (assignment) {
            assignment.status = 'completed';
            assignment.completed_at = new Date();
        }

        await resume.save();

        // Generate AI recommendations based on feedback
        const aiRecommendations = await generateAIRecommendations(resume, feedback);

        res.json({
            message: 'Feedback submitted successfully',
            feedback,
            ai_recommendations: aiRecommendations
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

/**
 * Get screening statistics
 * @route GET /api/v1/screening/statistics
 */
export const getScreeningStatistics = async (req, res) => {
    try {
        const { jobPostingId, startDate, endDate } = req.query;

        const query = {
            ...(jobPostingId && { job_posting: jobPostingId }),
            ...(startDate && endDate && {
                'meta.apply_date': {
                    $gte: new Date(startDate),
                    $lte: new Date(endDate)
                }
            })
        };

        const stats = await Resume.aggregate([
            { $match: query },
            { $group: {
                _id: '$status',
                count: { $sum: 1 },
                avg_processing_time: { $avg: '$meta.processing_time' },
                avg_match_score: { $avg: '$analysis.match_score' }
            }},
            { $sort: { count: -1 } }
        ]);

        // Get stage-wise metrics
        const stageMetrics = await getStageWiseMetrics(query);
        
        // Get reviewer performance
        const reviewerMetrics = await getReviewerMetrics(query);
        
        // Get trending tags
        const trendingTags = await getTrendingTags(query);

        res.json({
            overall_stats: stats,
            stage_metrics: stageMetrics,
            reviewer_metrics: reviewerMetrics,
            trending_tags: trendingTags,
            date_range: {
                start: startDate,
                end: endDate
            }
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Helper Functions

function isValidStatusTransition(currentStatus, newStatus) {
    const validTransitions = {
        'pending': ['processing', 'analyzed', 'rejected'],
        'processing': ['analyzed', 'rejected'],
        'analyzed': ['shortlisted', 'rejected'],
        'shortlisted': ['rejected']
    };

    return validTransitions[currentStatus]?.includes(newStatus);
}

async function notifyStatusChange(resume) {
    // Implement notification logic (email, in-app, etc.)
    // This is a placeholder
    console.log(`Status changed to ${resume.status} for resume ${resume._id}`);
}

async function notifyReviewer(reviewer, resume) {
    // Implement reviewer notification logic
    // This is a placeholder
    console.log(`Reviewer ${reviewer._id} assigned to resume ${resume._id}`);
}

async function generateWorkflowTimeline(resume) {
    const timeline = [];

    // Add initial application
    timeline.push({
        stage: 'application',
        status: 'completed',
        date: resume.meta.apply_date,
        duration: 0
    });

    // Add analysis stage
    if (resume.status !== 'pending') {
        timeline.push({
            stage: 'analysis',
            status: resume.status === 'processing' ? 'in_progress' : 'completed',
            date: resume.meta.last_updated,
            duration: resume.meta.processing_time
        });
    }

    // Add review stages
    resume.feedback.forEach(feedback => {
        timeline.push({
            stage: feedback.stage,
            status: 'completed',
            date: feedback.timestamp,
            reviewer: feedback.reviewer,
            rating: feedback.rating
        });
    });

    return timeline.sort((a, b) => a.date - b.date);
}

function determineNextSteps(resume) {
    const steps = [];
    
    switch (resume.status) {
        case 'pending':
            steps.push({
                action: 'initiate_analysis',
                priority: 'high',
                assignee: 'system'
            });
            break;
        case 'analyzed':
            steps.push({
                action: 'technical_review',
                priority: 'high',
                assignee: 'technical_reviewer'
            });
            break;
        case 'shortlisted':
            steps.push({
                action: 'schedule_interview',
                priority: 'medium',
                assignee: 'hr'
            });
            break;
    }

    return steps;
}

function calculateScreeningMetrics(resume) {
    return {
        total_time: Date.now() - resume.meta.apply_date,
        stages_completed: resume.feedback.length,
        average_rating: calculateAverageRating(resume.feedback),
        completion_percentage: calculateCompletionPercentage(resume)
    };
}

async function generateAIRecommendations(resume, feedback) {
    const prompt = `Based on this screening feedback, provide recommendations:
        Resume Score: ${resume.analysis.match_score}
        Reviewer Rating: ${feedback.rating}
        Comments: ${feedback.comments}
        Stage: ${feedback.stage}

        Provide:
        1. Next steps recommendation
        2. Risk assessment
        3. Interview focus areas
        4. Development suggestions`;

    const completion = await openai.createCompletion({
        model: "text-davinci-003",
        prompt,
        max_tokens: 500,
        temperature: 0.7
    });

    return parseAIRecommendations(completion.data.choices[0].text);
}

async function getStageWiseMetrics(query) {
    return Resume.aggregate([
        { $match: query },
        { $group: {
            _id: '$screening_stage',
            count: { $sum: 1 },
            avg_time: { $avg: '$meta.processing_time' },
            feedback_count: { $sum: { $size: '$feedback' } }
        }},
        { $sort: { _id: 1 } }
    ]);
}

async function getReviewerMetrics(query) {
    return Resume.aggregate([
        { $match: query },
        { $unwind: '$feedback' },
        { $group: {
            _id: '$feedback.reviewer',
            reviews_completed: { $sum: 1 },
            avg_rating: { $avg: '$feedback.rating' },
            avg_response_time: {
                $avg: {
                    $subtract: ['$feedback.timestamp', '$meta.apply_date']
                }
            }
        }},
        { $lookup: {
            from: 'users',
            localField: '_id',
            foreignField: '_id',
            as: 'reviewer'
        }},
        { $unwind: '$reviewer' },
        { $project: {
            reviewer: { name: 1, email: 1 },
            reviews_completed: 1,
            avg_rating: 1,
            avg_response_time: 1
        }}
    ]);
}

async function getTrendingTags(query) {
    return Resume.aggregate([
        { $match: query },
        { $unwind: '$tags' },
        { $group: {
            _id: '$tags',
            count: { $sum: 1 }
        }},
        { $sort: { count: -1 } },
        { $limit: 10 }
    ]);
}

function calculateAverageRating(feedback) {
    if (!feedback.length) return 0;
    return feedback.reduce((acc, f) => acc + f.rating, 0) / feedback.length;
}

function calculateCompletionPercentage(resume) {
    const totalStages = 4; // initial, technical, hr, final
    const completedStages = new Set(resume.feedback.map(f => f.stage)).size;
    return (completedStages / totalStages) * 100;
}

function parseAIRecommendations(text) {
    const sections = text.split('\n\n');
    return {
        next_steps: parseSectionItems(sections[0]),
        risks: parseSectionItems(sections[1]),
        interview_focus: parseSectionItems(sections[2]),
        development: parseSectionItems(sections[3])
    };
}

function parseSectionItems(section) {
    return section
        .split('\n')
        .filter(line => line.trim())
        .map(line => line.replace(/^\d+\.\s*/, '').trim());
}

export default {
    updateScreeningStatus,
    assignReviewer,
    getWorkflowStatus,
    submitFeedback,
    getScreeningStatistics
};