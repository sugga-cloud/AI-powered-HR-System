import AIProcessingLog from '../../../models/Job Posting/AIProcessingLog.js';
import AIPrediction from '../../../models/Job Posting/AIPrediction.js';
import JobRequisition from '../../../models/Job Posting/JobRequisition.js';
import { Configuration, OpenAIApi } from 'openai';
import dotenv from 'dotenv';

dotenv.config();

// Initialize OpenAI
const configuration = new Configuration({
    apiKey: process.env.OPENAI_API_KEY
});
const openai = new OpenAIApi(configuration);

// Process job requisition with AI
export const processJobRequisition = async (req, res) => {
    try {
        const { jobId, stage } = req.body;

        // Create processing log
        const processingLog = new AIProcessingLog({
            job_id: jobId,
            stage,
            input_data: req.body.input,
            model_version: process.env.AI_MODEL_VERSION || '1.0'
        });

        // Process with OpenAI
        const aiOutput = await processWithAI(req.body.input, stage);

        processingLog.output_data = aiOutput;
        processingLog.confidence = aiOutput.confidence;
        await processingLog.save();

        // Update job requisition based on AI output
        if (stage === 'jd_generation') {
            await updateJobDescription(jobId, aiOutput);
        }

        res.json(processingLog);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Get AI processing logs for a job
export const getJobProcessingLogs = async (req, res) => {
    try {
        const logs = await AIProcessingLog.find({
            job_id: req.params.jobId
        }).sort({ processed_at: -1 });

        res.json(logs);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Get logs by processing stage
export const getLogsByStage = async (req, res) => {
    try {
        const logs = await AIProcessingLog.find({
            stage: req.params.stage
        }).sort({ processed_at: -1 });

        res.json(logs);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Get AI predictions for a job
export const getJobPredictions = async (req, res) => {
    try {
        const predictions = await AIPrediction.findOne({
            job_id: req.params.jobId
        });

        if (!predictions) {
            return res.status(404).json({ message: 'Predictions not found' });
        }

        res.json(predictions);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Get prediction metrics for a job
export const getJobPredictionMetrics = async (req, res) => {
    try {
        const predictions = await AIPrediction.findOne({
            job_id: req.params.jobId
        });

        if (!predictions) {
            return res.status(404).json({ message: 'Predictions not found' });
        }

        // Extract and format relevant metrics
        const metrics = {
            timeToHire: predictions.predicted_time_to_hire_days,
            candidateAvailability: predictions.candidate_availability_score,
            suggestedChannels: predictions.suggested_channels,
            confidence: predictions.confidence
        };

        res.json(metrics);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Regenerate AI predictions for a job
export const regenerateJobPredictions = async (req, res) => {
    try {
        const { jobId } = req.params;

        // Get the job requisition
        const job = await JobRequisition.findById(jobId);
        if (!job) {
            return res.status(404).json({ message: 'Job requisition not found' });
        }

        // Generate new AI predictions using OpenAI
        const newPredictions = await generateNewPredictions(job);

        // Update or create new predictions
        const predictions = await AIPrediction.findOneAndUpdate(
            { job_id: jobId },
            newPredictions,
            { new: true, upsert: true }
        );

        res.json(predictions);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Generate SEO-optimized job title suggestions
export const generateTitleSuggestions = async (req, res) => {
    try {
        const { currentTitle, skills, department, industry } = req.body;

        const prompt = `Generate 5 SEO-optimized job titles for this position:
            Current Title: ${currentTitle}
            Required Skills: ${skills.join(', ')}
            Department: ${department}
            Industry: ${industry}
            
            Provide titles that are:
            1. SEO-friendly
            2. Industry-standard
            3. Clear and professional
            4. Attractive to candidates
            Include a brief explanation for each suggestion.`;

        const completion = await openai.createCompletion({
            model: "text-davinci-003",
            prompt,
            max_tokens: 500,
            temperature: 0.7
        });

        const suggestions = completion.data.choices[0].text.trim();

        res.json({
            success: true,
            suggestions,
            metadata: {
                originalTitle: currentTitle,
                industry,
                department
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// Generate skill-based screening questions
export const generateScreeningQuestions = async (req, res) => {
    try {
        const { skills, experience, jobType } = req.body;

        const prompt = `Create technical screening questions for:
            Skills: ${skills.join(', ')}
            Experience Level: ${experience} years
            Job Type: ${jobType}
            
            Generate:
            1. 5 technical skill assessment questions
            2. 3 experience-based scenarios
            3. 2 problem-solving challenges
            
            Include for each question:
            - Question text
            - Expected answer points
            - Difficulty (1-5)
            - Assessment criteria`;

        const completion = await openai.createCompletion({
            model: "text-davinci-003",
            prompt,
            max_tokens: 1000,
            temperature: 0.7
        });

        const questions = completion.data.choices[0].text.trim();

        res.json({
            success: true,
            questions,
            metadata: {
                skillsCovered: skills,
                experienceLevel: experience,
                jobType
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// Analyze job posting effectiveness
export const analyzePostingEffectiveness = async (req, res) => {
    try {
        const jobId = req.params.jobId;
        const job = await JobRequisition.findById(jobId);

        if (!job) {
            return res.status(404).json({ message: 'Job requisition not found' });
        }

        // Get posting metrics and performance data
        const metrics = await getPostingMetrics(jobId);

        const prompt = `Analyze this job posting's effectiveness:
            Title: ${job.title}
            Description: ${job.description}
            Active Days: ${metrics.activeDays}
            Views: ${metrics.views}
            Applications: ${metrics.applications}
            Click Rate: ${metrics.clickRate}%
            
            Provide analysis on:
            1. Engagement metrics comparison with industry standards
            2. Content effectiveness
            3. Recommended improvements
            4. Channel performance
            5. Optimization suggestions`;

        const completion = await openai.createCompletion({
            model: "text-davinci-003",
            prompt,
            max_tokens: 800,
            temperature: 0.7
        });

        const analysis = completion.data.choices[0].text.trim();

        res.json({
            success: true,
            analysis,
            metrics,
            recommendations: extractRecommendations(analysis)
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// Helper function to get posting metrics
async function getPostingMetrics(jobId) {
    try {
        // Get job posting analytics from database
        const posting = await JobRequisition.findById(jobId)
            .populate('analytics')
            .populate('applications');

        if (!posting) {
            throw new Error('Job posting not found');
        }

        const analytics = posting.analytics || {};
        const applications = posting.applications || [];

        // Calculate metrics
        const now = new Date();
        const createdAt = posting.created_at;
        const activeDays = Math.ceil((now - createdAt) / (1000 * 60 * 60 * 24));

        const channelBreakdown = {};
        posting.channels.forEach(channel => {
            const channelViews = analytics[`${channel}_views`] || 0;
            const channelApps = applications.filter(app => app.source === channel).length;

            channelBreakdown[channel] = {
                views: channelViews,
                applications: channelApps
            };
        });

        const totalViews = Object.values(channelBreakdown)
            .reduce((sum, channel) => sum + channel.views, 0);
        const totalApplications = applications.length;
        const clickRate = totalViews > 0 ? (totalApplications / totalViews) * 100 : 0;

        return {
            activeDays,
            views: totalViews,
            applications: totalApplications,
            clickRate: parseFloat(clickRate.toFixed(2)),
            channelBreakdown
        };
    } catch (error) {
        console.error('Error getting posting metrics:', error);
        throw error;
    }
};

// Helper function to extract recommendations
function extractRecommendations(analysis) {
    const recommendations = {
        title: [],
        content: [],
        channels: [],
        urgent: []
    };

    const lines = analysis.split('\n');
    let currentCategory = null;

    lines.forEach(line => {
        if (line.toLowerCase().includes('title recommendations')) {
            currentCategory = 'title';
        } else if (line.toLowerCase().includes('content improvements')) {
            currentCategory = 'content';
        } else if (line.toLowerCase().includes('channel suggestions')) {
            currentCategory = 'channels';
        } else if (line.toLowerCase().includes('urgent actions')) {
            currentCategory = 'urgent';
        } else if (currentCategory && line.trim()) {
            recommendations[currentCategory].push(line.trim());
        }
    });

    return recommendations;
}

// Helper functions with OpenAI integration
async function processWithAI(input, stage) {
    let prompt = '';

    switch (stage) {
        case 'jd_generation':
            prompt = `Create a professional job description for the following position:
                Title: ${input.title}
                Skills Required: ${input.skills.join(', ')}
                Experience: ${input.experience} years
                Department: ${input.department}
                Key Responsibilities: ${input.responsibilities.join(', ')}
                
                Generate a well-structured, engaging job description that includes:
                1. Overview of the role
                2. Key responsibilities
                3. Required qualifications
                4. Benefits and perks
                5. Company culture`;
            break;

        case 'skill_analysis':
            prompt = `Analyze the following job requirements and provide insights:
                Skills: ${input.skills.join(', ')}
                Experience Level: ${input.experience} years
                
                Provide:
                1. Core skill groupings
                2. Suggested additional relevant skills
                3. Experience level assessment
                4. Market demand analysis`;
            break;

        case 'market_analysis':
            prompt = `Analyze the job market for:
                Position: ${input.title}
                Industry: ${input.industry}
                Location: ${input.location}
                
                Provide insights on:
                1. Current market demand
                2. Salary range recommendations
                3. Available talent pool
                4. Competition analysis
                5. Recommended posting channels`;
            break;
    }

    const completion = await openai.createCompletion({
        model: "text-davinci-003",
        prompt,
        max_tokens: 1000,
        temperature: 0.7
    });

    const output = completion.data.choices[0].text.trim();

    return {
        confidence: calculateConfidence(output),
        output,
        model: "gpt-3.5-turbo",
        tokens_used: completion.data.usage.total_tokens
    };
}

async function updateJobDescription(jobId, aiOutput) {
    const job = await JobRequisition.findById(jobId);
    if (!job) throw new Error('Job requisition not found');

    // Extract key sections from AI output
    const sections = parseJobDescriptionSections(aiOutput.output);

    // Update job requisition with enhanced content
    await JobRequisition.findByIdAndUpdate(jobId, {
        description: sections.overview,
        responsibilities: sections.responsibilities,
        requirements: sections.requirements,
        benefits: sections.benefits,
        status: 'ai_enhanced',
        ai_metadata: {
            confidence: aiOutput.confidence,
            model: aiOutput.model,
            tokens_used: aiOutput.tokens_used,
            generated_at: new Date()
        }
    });
}

async function generateNewPredictions(job) {
    // Generate market analysis prompt
    const prompt = `Analyze this job posting and provide hiring predictions:
        Title: ${job.title}
        Department: ${job.department}
        Location: ${job.location}
        Required Experience: ${job.experience} years
        Skills: ${job.skills.join(', ')}
        
        Provide predictions for:
        1. Expected time to hire
        2. Candidate availability
        3. Optimal posting channels
        4. Salary range competitiveness
        5. Potential hiring challenges`;

    const completion = await openai.createCompletion({
        model: "text-davinci-003",
        prompt,
        max_tokens: 800,
        temperature: 0.7
    });

    const analysis = completion.data.choices[0].text.trim();
    const predictions = parsePredictions(analysis);

    return {
        predicted_time_to_hire_days: predictions.timeToHire,
        candidate_availability_score: predictions.availabilityScore,
        suggested_channels: predictions.channels,
        salary_competitiveness: predictions.salaryCompetitiveness,
        potential_challenges: predictions.challenges,
        feature_vectors: predictions.featureVectors,
        model_version: process.env.AI_MODEL_VERSION || '1.0',
        confidence_score: predictions.confidence,
        generated_at: new Date()
    };
}

// Utility functions for AI processing
function calculateConfidence(output) {
    // Calculate confidence based on output completeness and quality markers
    const qualityMarkers = [
        output.includes('responsibilities'),
        output.includes('requirements'),
        output.includes('qualifications'),
        output.includes('benefits'),
        output.length > 500
    ];

    return qualityMarkers.filter(Boolean).length / qualityMarkers.length;
}

function parseJobDescriptionSections(output) {
    // Split output into relevant sections
    const sections = {
        overview: '',
        responsibilities: [],
        requirements: [],
        benefits: []
    };

    // Basic parsing logic - can be enhanced with more sophisticated NLP
    const lines = output.split('\n');
    let currentSection = 'overview';

    lines.forEach(line => {
        if (line.toLowerCase().includes('responsibilities')) {
            currentSection = 'responsibilities';
            return;
        }
        if (line.toLowerCase().includes('requirements') || line.toLowerCase().includes('qualifications')) {
            currentSection = 'requirements';
            return;
        }
        if (line.toLowerCase().includes('benefits') || line.toLowerCase().includes('perks')) {
            currentSection = 'benefits';
            return;
        }

        if (line.trim()) {
            if (currentSection === 'overview') {
                sections.overview += line + '\n';
            } else if (Array.isArray(sections[currentSection])) {
                sections[currentSection].push(line.trim());
            }
        }
    });

    return sections;
}

function parsePredictions(analysis) {
    // Initialize prediction object
    const predictions = {
        timeToHire: 30,
        availabilityScore: 0.8,
        channels: ['linkedin', 'indeed'],
        salaryCompetitiveness: 'competitive',
        challenges: [],
        featureVectors: {},
        confidence: 0.85
    };

    // Parse the analysis text to extract predictions
    const lines = analysis.split('\n');
    lines.forEach(line => {
        if (line.includes('time to hire')) {
            const days = parseInt(line.match(/\d+/)?.[0]);
            if (days) predictions.timeToHire = days;
        }
        if (line.includes('availability')) {
            const score = parseFloat(line.match(/\d+\.\d+/)?.[0]);
            if (score) predictions.availabilityScore = score;
        }
        if (line.includes('channels')) {
            const channels = line.match(/\b(linkedin|indeed|naukri|monster|glassdoor)\b/gi);
            if (channels) predictions.channels = channels;
        }
        if (line.includes('challenge')) {
            predictions.challenges.push(line.trim());
        }
    });

    return predictions;
}