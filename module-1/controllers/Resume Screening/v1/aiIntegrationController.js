import Resume from '../../../models/Resume Screening/Resume.js';
import ResumeAnalysis from '../../../models/Resume Screening/ResumeAnalysis.js';
import JobPosting from '../../../models/Job Posting/JobPosting.js';
import { Configuration, OpenAIApi } from 'openai';
import natural from 'natural';
import { Worker } from 'worker_threads';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config();

// Initialize OpenAI
const configuration = new Configuration({
    apiKey: process.env.OPENAI_API_KEY
});
const openai = new OpenAIApi(configuration);

// Initialize NLP tools
const TfIdf = natural.TfIdf;
const tokenizer = new natural.WordTokenizer();
const classifier = new natural.BayesClassifier();

/**
 * Compare resumes with job requirements
 * @route POST /api/v1/ai/compare-resumes
 */
export const compareResumes = async (req, res) => {
    try {
        const { jobPostingId, resumeIds } = req.body;

        // Validate input
        if (!jobPostingId || !resumeIds || resumeIds.length === 0) {
            return res.status(400).json({
                message: 'Job posting ID and resume IDs are required'
            });
        }

        // Get job posting and resumes
        const [jobPosting, resumes] = await Promise.all([
            JobPosting.findById(jobPostingId),
            Resume.find({ _id: { $in: resumeIds } }).populate('parsed_data')
        ]);

        if (!jobPosting) {
            return res.status(404).json({ message: 'Job posting not found' });
        }

        // Generate comparison matrix
        const comparisonMatrix = await generateComparisonMatrix(jobPosting, resumes);

        // Rank candidates
        const rankedCandidates = rankCandidates(comparisonMatrix);

        // Generate recommendations
        const recommendations = await generateRecommendations(rankedCandidates, jobPosting);

        res.json({
            job_posting: jobPosting.title,
            candidates_compared: resumes.length,
            comparison_matrix: comparisonMatrix,
            rankings: rankedCandidates,
            recommendations
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

/**
 * Perform intelligent candidate matching
 * @route POST /api/v1/ai/match-candidates
 */
export const matchCandidates = async (req, res) => {
    try {
        const { jobPostingId, filters } = req.body;

        // Get job posting
        const jobPosting = await JobPosting.findById(jobPostingId);
        if (!jobPosting) {
            return res.status(404).json({ message: 'Job posting not found' });
        }

        // Get all analyzed resumes for this posting
        const resumes = await Resume.find({
            job_posting: jobPostingId,
            status: 'analyzed'
        }).populate('parsed_data');

        // Apply AI matching algorithm
        const matches = await performIntelligentMatching(jobPosting, resumes, filters);

        // Generate match insights
        const insights = await generateMatchInsights(matches, jobPosting);

        res.json({
            total_candidates: resumes.length,
            matches,
            insights,
            filters_applied: filters
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

/**
 * Generate candidate profiles
 * @route POST /api/v1/ai/generate-profiles
 */
export const generateCandidateProfiles = async (req, res) => {
    try {
        const { resumeIds } = req.body;

        const resumes = await Resume.find({ _id: { $in: resumeIds } })
            .populate('parsed_data')
            .populate('analysis');

        const profiles = await Promise.all(
            resumes.map(resume => generateProfile(resume))
        );

        res.json({
            profiles,
            generated_at: new Date(),
            total_profiles: profiles.length
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

/**
 * Predict candidate success
 * @route POST /api/v1/ai/predict-success
 */
export const predictCandidateSuccess = async (req, res) => {
    try {
        const { resumeId, jobPostingId } = req.body;

        const [resume, jobPosting] = await Promise.all([
            Resume.findById(resumeId).populate('analysis'),
            JobPosting.findById(jobPostingId)
        ]);

        if (!resume || !jobPosting) {
            return res.status(404).json({ 
                message: 'Resume or job posting not found' 
            });
        }

        // Generate success prediction
        const prediction = await generateSuccessPrediction(resume, jobPosting);

        // Get similar successful candidates
        const similarCandidates = await findSimilarSuccessfulCandidates(resume);

        res.json({
            candidate_name: resume.candidate.name,
            job_title: jobPosting.title,
            prediction,
            similar_candidates: similarCandidates,
            confidence_score: prediction.confidence
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

/**
 * Analyze candidate potential
 * @route POST /api/v1/ai/analyze-potential
 */
export const analyzeCandidatePotential = async (req, res) => {
    try {
        const { resumeId } = req.body;

        const resume = await Resume.findById(resumeId)
            .populate('parsed_data')
            .populate('analysis');

        if (!resume) {
            return res.status(404).json({ message: 'Resume not found' });
        }

        // Analyze growth potential
        const potentialAnalysis = await analyzeGrowthPotential(resume);

        // Generate development plan
        const developmentPlan = await generateDevelopmentPlan(resume, potentialAnalysis);

        res.json({
            candidate_name: resume.candidate.name,
            potential_analysis: potentialAnalysis,
            development_plan: developmentPlan,
            recommendations: potentialAnalysis.recommendations
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Helper Functions

async function generateComparisonMatrix(jobPosting, resumes) {
    const matrix = [];
    const criteria = [
        'skills_match',
        'experience_relevance',
        'education_fit',
        'overall_score'
    ];

    for (const resume of resumes) {
        const scores = {
            resume_id: resume._id,
            candidate_name: resume.candidate.name,
            criteria: {}
        };

        // Calculate scores for each criterion
        scores.criteria.skills_match = calculateSkillsMatch(
            resume.parsed_data.skills,
            jobPosting.requirements.skills
        );

        scores.criteria.experience_relevance = calculateExperienceRelevance(
            resume.parsed_data.experience,
            jobPosting.requirements.experience
        );

        scores.criteria.education_fit = calculateEducationFit(
            resume.parsed_data.education,
            jobPosting.requirements.education
        );

        scores.criteria.overall_score = calculateOverallScore(scores.criteria);

        matrix.push(scores);
    }

    return matrix;
}

function rankCandidates(comparisonMatrix) {
    return comparisonMatrix
        .sort((a, b) => b.criteria.overall_score - a.criteria.overall_score)
        .map((candidate, index) => ({
            rank: index + 1,
            resume_id: candidate.resume_id,
            candidate_name: candidate.candidate_name,
            overall_score: candidate.criteria.overall_score,
            strengths: identifyStrengths(candidate.criteria),
            areas_of_improvement: identifyAreasOfImprovement(candidate.criteria)
        }));
}

async function generateRecommendations(rankedCandidates, jobPosting) {
    const prompt = `Based on these candidate rankings and job requirements, provide recommendations:
        Job Title: ${jobPosting.title}
        Required Skills: ${jobPosting.requirements.skills.join(', ')}
        Top Candidates: ${rankedCandidates.slice(0, 3).map(c => 
            `${c.candidate_name} (Score: ${c.overall_score})`
        ).join(', ')}

        Provide:
        1. Interview strategy for top candidates
        2. Skill assessment focus areas
        3. Risk mitigation suggestions
        4. Diversity and inclusion considerations`;

    const completion = await openai.createCompletion({
        model: "text-davinci-003",
        prompt,
        max_tokens: 500,
        temperature: 0.7
    });

    return parseRecommendations(completion.data.choices[0].text);
}

async function performIntelligentMatching(jobPosting, resumes, filters) {
    const matches = [];
    
    // Train the classifier with historical data
    await trainMatchingModel();

    for (const resume of resumes) {
        // Generate feature vector
        const features = extractMatchingFeatures(resume, jobPosting);
        
        // Apply filters
        if (!meetsFilters(features, filters)) continue;

        // Calculate match score
        const matchScore = classifier.classify(features);
        
        // Calculate confidence score
        const confidence = calculateMatchConfidence(features, jobPosting);

        matches.push({
            resume_id: resume._id,
            candidate_name: resume.candidate.name,
            match_score: matchScore,
            confidence,
            key_matching_points: identifyKeyMatchingPoints(features, jobPosting),
            potential_fit: assessPotentialFit(features, jobPosting)
        });
    }

    return matches.sort((a, b) => b.match_score - a.match_score);
}

async function generateProfile(resume) {
    // Extract key information
    const experience = analyzeExperienceProfile(resume.parsed_data.experience);
    const skills = analyzeSkillsProfile(resume.parsed_data.skills);
    const education = analyzeEducationProfile(resume.parsed_data.education);
    
    // Generate AI insights
    const insights = await generateProfileInsights(resume);

    return {
        candidate_id: resume._id,
        name: resume.candidate.name,
        summary: {
            total_experience: experience.total_years,
            key_skills: skills.core_competencies,
            highest_education: education.highest_degree,
            expertise_level: determineExpertiseLevel(experience, skills)
        },
        detailed_analysis: {
            experience_progression: experience.progression,
            skill_mastery: skills.mastery_levels,
            educational_background: education.background,
            achievements: extractAchievements(resume.parsed_data)
        },
        ai_insights: insights,
        potential_roles: await suggestPotentialRoles(resume),
        development_areas: identifyDevelopmentAreas(resume)
    };
}

async function generateSuccessPrediction(resume, jobPosting) {
    // Extract predictive features
    const features = extractPredictiveFeatures(resume, jobPosting);
    
    // Generate prediction using AI
    const prompt = `Analyze candidate success potential:
        Skills Match: ${features.skillsMatchScore}
        Experience Relevance: ${features.experienceRelevanceScore}
        Education Fit: ${features.educationFitScore}
        Previous Achievements: ${features.achievementsScore}
        
        Predict:
        1. Success probability
        2. Key success factors
        3. Potential challenges
        4. Risk factors`;

    const completion = await openai.createCompletion({
        model: "text-davinci-003",
        prompt,
        max_tokens: 500,
        temperature: 0.7
    });

    return parsePredictionResponse(completion.data.choices[0].text);
}

async function analyzeGrowthPotential(resume) {
    // Analyze learning ability
    const learningAbility = analyzeLearningAbility(resume.parsed_data);
    
    // Analyze adaptability
    const adaptability = analyzeAdaptability(resume.parsed_data);
    
    // Analyze leadership potential
    const leadershipPotential = analyzeLeadershipPotential(resume.parsed_data);
    
    // Generate AI insights
    const prompt = `Analyze candidate's growth potential:
        Learning Ability: ${learningAbility.score}
        Adaptability: ${adaptability.score}
        Leadership Potential: ${leadershipPotential.score}
        
        Provide insights on:
        1. Growth trajectory
        2. Development opportunities
        3. Recommended training areas
        4. Long-term potential`;

    const completion = await openai.createCompletion({
        model: "text-davinci-003",
        prompt,
        max_tokens: 500,
        temperature: 0.7
    });

    return {
        learning_ability: learningAbility,
        adaptability,
        leadership_potential: leadershipPotential,
        insights: parseGrowthInsights(completion.data.choices[0].text)
    };
}

export default {
    compareResumes,
    matchCandidates,
    generateCandidateProfiles,
    predictCandidateSuccess,
    analyzeCandidatePotential
};