import Resume from '../../../models/Resume Screening/Resume.js';
import ResumeAnalysis from '../../../models/Resume Screening/ResumeAnalysis.js';
import JobPosting from '../../../models/Job Posting/JobPosting.js';
import { Configuration, OpenAIApi } from 'openai';
import natural from 'natural';
import dotenv from 'dotenv';

dotenv.config();

// Initialize OpenAI
const configuration = new Configuration({
    apiKey: process.env.OPENAI_API_KEY
});
const openai = new OpenAIApi(configuration);

// Initialize NLP tools
const tokenizer = new natural.WordTokenizer();
const TfIdf = natural.TfIdf;
const spellcheck = new natural.Spellcheck();

/**
 * Analyze a resume
 * @route POST /api/v1/resumes/:id/analyze
 */
export const analyzeResume = async (req, res) => {
    try {
        const { id } = req.params;
        const resume = await Resume.findById(id).populate('job_posting');
        
        if (!resume) {
            return res.status(404).json({ message: 'Resume not found' });
        }

        // Start analysis process
        resume.status = 'processing';
        await resume.save();

        const startTime = Date.now();

        // Create analysis record
        const analysis = new ResumeAnalysis({
            resume: resume._id,
            job_posting: resume.job_posting._id,
            processing_metadata: {
                start_time: new Date(),
                ai_model_version: process.env.AI_MODEL_VERSION || '1.0'
            }
        });

        // Perform various analyses
        const [
            textAnalysis,
            contentAnalysis,
            skillAnalysis,
            experienceAnalysis,
            educationAnalysis,
            achievementAnalysis,
            personalityInsights,
            marketFit,
            fraudDetection
        ] = await Promise.all([
            performTextAnalysis(resume.parsed_data),
            analyzeContent(resume.parsed_data),
            analyzeSkills(resume.parsed_data.skills, resume.job_posting),
            analyzeExperience(resume.parsed_data.experience, resume.job_posting),
            analyzeEducation(resume.parsed_data.education, resume.job_posting),
            analyzeAchievements(resume.parsed_data),
            generatePersonalityInsights(resume.parsed_data),
            assessMarketFit(resume.parsed_data, resume.job_posting),
            detectFraud(resume.parsed_data)
        ]);

        // Update analysis record
        Object.assign(analysis, {
            text_analysis: textAnalysis,
            content_analysis: contentAnalysis,
            skill_analysis: skillAnalysis,
            experience_analysis: experienceAnalysis,
            education_analysis: educationAnalysis,
            achievement_analysis: achievementAnalysis,
            personality_insights: personalityInsights,
            market_fit: marketFit,
            fraud_detection: fraudDetection
        });

        // Generate AI insights
        analysis.ai_insights = await generateAIInsights(analysis);

        // Update processing metadata
        analysis.processing_metadata.end_time = new Date();
        analysis.processing_metadata.duration = Date.now() - startTime;
        analysis.processing_metadata.confidence_score = calculateConfidenceScore(analysis);

        await analysis.save();

        // Update resume status and analysis reference
        resume.status = 'analyzed';
        resume.analysis.match_score = analysis.getOverallScore().total_score;
        await resume.save();

        res.json({
            message: 'Resume analysis completed',
            analysis_id: analysis._id,
            match_score: resume.analysis.match_score,
            processing_time: analysis.processing_metadata.duration
        });
    } catch (error) {
        res.status(500).json({ 
            message: 'Error analyzing resume',
            error: error.message 
        });
    }
};

/**
 * Get analysis results
 * @route GET /api/v1/resumes/:id/analysis
 */
export const getAnalysis = async (req, res) => {
    try {
        const { id } = req.params;
        const analysis = await ResumeAnalysis.findOne({ resume: id })
            .populate('resume')
            .populate('job_posting');

        if (!analysis) {
            return res.status(404).json({ message: 'Analysis not found' });
        }

        res.json(analysis);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

/**
 * Update analysis flags
 * @route PATCH /api/v1/resumes/:id/analysis/flags
 */
export const updateAnalysisFlags = async (req, res) => {
    try {
        const { id } = req.params;
        const { flags } = req.body;

        const analysis = await ResumeAnalysis.findOne({ resume: id });
        if (!analysis) {
            return res.status(404).json({ message: 'Analysis not found' });
        }

        analysis.fraud_detection.flags = flags;
        analysis.fraud_detection.verification_status = 
            flags.length > 0 ? 'suspicious' : 'verified';

        await analysis.save();

        res.json({
            message: 'Analysis flags updated',
            verification_status: analysis.fraud_detection.verification_status
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

/**
 * Get batch analysis summary
 * @route GET /api/v1/resumes/analysis/summary
 */
export const getAnalysisSummary = async (req, res) => {
    try {
        const { jobPostingId } = req.query;
        
        const summary = await ResumeAnalysis.getAnalysisSummary(jobPostingId);
        const matchScoreDistribution = await getMatchScoreDistribution(jobPostingId);
        const skillGapAnalysis = await getSkillGapAnalysis(jobPostingId);
        const timelineMetrics = await getProcessingTimelineMetrics(jobPostingId);

        res.json({
            summary: summary[0],
            match_score_distribution: matchScoreDistribution,
            skill_gaps: skillGapAnalysis,
            timeline_metrics: timelineMetrics
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Analysis Helper Functions

async function performTextAnalysis(parsedData) {
    const text = JSON.stringify(parsedData);
    const tokens = tokenizer.tokenize(text);
    
    // Perform spell check
    const spellingErrors = tokens.map(word => {
        if (!spellcheck.isCorrect(word)) {
            return {
                word,
                suggestion: spellcheck.getCorrections(word)[0],
                context: getWordContext(text, word)
            };
        }
        return null;
    }).filter(error => error !== null);

    // Calculate text metrics
    return {
        language: detectLanguage(text),
        word_count: tokens.length,
        unique_words: new Set(tokens).size,
        spelling_errors: spellingErrors,
        formatting_score: calculateFormattingScore(text)
    };
}

async function analyzeContent(parsedData) {
    const tfidf = new TfIdf();
    const sections = Object.entries(parsedData).map(([name, content]) => {
        tfidf.addDocument(JSON.stringify(content));
        return { name, content: JSON.stringify(content) };
    });

    return {
        sections: sections.map((section, idx) => ({
            ...section,
            relevance_score: calculateSectionRelevance(section.content),
            keywords: getKeywords(tfidf, idx)
        })),
        missing_sections: identifyMissingSections(parsedData),
        section_order_score: calculateSectionOrderScore(sections)
    };
}

async function analyzeSkills(skills, jobPosting) {
    const requiredSkills = new Set(jobPosting.requirements.skills);
    
    const technicalSkills = [];
    const softSkills = [];

    for (const skill of skills) {
        const skillAnalysis = {
            name: skill.name,
            mentions: countSkillMentions(skill.name),
            contexts: getSkillContexts(skill.name),
            verified: requiredSkills.has(skill.name)
        };

        if (isTechnicalSkill(skill.name)) {
            technicalSkills.push(skillAnalysis);
        } else {
            softSkills.push(skillAnalysis);
        }
    }

    return {
        technical_skills: technicalSkills,
        soft_skills: softSkills,
        skill_diversity_score: calculateSkillDiversity(skills),
        skill_relevance_score: calculateSkillRelevance(skills, jobPosting)
    };
}

async function analyzeExperience(experience, jobPosting) {
    const totalYears = calculateTotalExperience(experience);
    const relevantYears = calculateRelevantExperience(experience, jobPosting);
    
    return {
        total_years: totalYears,
        relevant_years: relevantYears,
        companies: analyzeCompanies(experience),
        career_progression: analyzeCareerProgression(experience),
        industry_exposure: getIndustryExposure(experience)
    };
}

async function generateAIInsights(analysis) {
    const prompt = `Based on this resume analysis, provide insights on:
        1. Key strengths and weaknesses
        2. Development areas and resources
        3. Recommended interview questions
        4. Cultural fit assessment

        Analysis data:
        ${JSON.stringify(analysis)}`;

    const completion = await openai.createCompletion({
        model: "text-davinci-003",
        prompt,
        max_tokens: 1000,
        temperature: 0.7
    });

    return parseAIInsights(completion.data.choices[0].text);
}

async function detectFraud(parsedData) {
    const riskFactors = [
        checkInconsistentDates(parsedData),
        checkUnrealisticClaims(parsedData),
        checkDuplicateContent(parsedData),
        validateEducation(parsedData.education),
        validateExperience(parsedData.experience)
    ];

    const riskScore = calculateRiskScore(riskFactors);
    
    return {
        risk_score: riskScore,
        flags: riskFactors.filter(factor => factor.severity !== 'none'),
        verification_status: determineVerificationStatus(riskScore)
    };
}

// Utility functions

function calculateConfidenceScore(analysis) {
    const factors = [
        analysis.text_analysis.formatting_score,
        analysis.skill_analysis.skill_relevance_score,
        analysis.experience_analysis.career_progression.score,
        analysis.education_analysis.highest_degree.relevance,
        1 - (analysis.fraud_detection.risk_score / 100)
    ];

    return factors.reduce((acc, score) => acc + score, 0) / factors.length;
}

function getMatchScoreDistribution(jobPostingId) {
    return Resume.aggregate([
        { $match: { job_posting: jobPostingId } },
        { $group: {
            _id: {
                $switch: {
                    branches: [
                        { case: { $gte: ['$analysis.match_score', 90] }, then: '90-100' },
                        { case: { $gte: ['$analysis.match_score', 80] }, then: '80-89' },
                        { case: { $gte: ['$analysis.match_score', 70] }, then: '70-79' },
                        { case: { $gte: ['$analysis.match_score', 60] }, then: '60-69' }
                    ],
                    default: 'Below 60'
                }
            },
            count: { $sum: 1 }
        }},
        { $sort: { '_id': -1 } }
    ]);
}

function detectLanguage(text) {
    // Implement language detection logic
    return 'en'; // Default to English for now
}

function calculateFormattingScore(text) {
    // Implement formatting analysis
    return 85; // Placeholder score
}

function getKeywords(tfidf, documentIndex) {
    return tfidf.listTerms(documentIndex)
        .slice(0, 10)
        .map(item => item.term);
}

function identifyMissingSections(parsedData) {
    const requiredSections = ['education', 'experience', 'skills'];
    return requiredSections.filter(section => !parsedData[section] || parsedData[section].length === 0);
}

function calculateSectionOrderScore(sections) {
    // Implement section order analysis
    return 90; // Placeholder score
}

function calculateSkillDiversity(skills) {
    // Implement skill diversity analysis
    return 85; // Placeholder score
}

function calculateSkillRelevance(skills, jobPosting) {
    // Implement skill relevance analysis
    return 80; // Placeholder score
}

function isTechnicalSkill(skill) {
    // Implement technical skill detection
    const technicalKeywords = ['programming', 'software', 'database', 'framework', 'language'];
    return technicalKeywords.some(keyword => skill.toLowerCase().includes(keyword));
}

function countSkillMentions(skill) {
    // Implement skill mention counting
    return 3; // Placeholder count
}

function getSkillContexts(skill) {
    // Implement context extraction
    return ['experience', 'projects']; // Placeholder contexts
}

function calculateSectionRelevance(content) {
    // Implement section relevance calculation
    return 85; // Placeholder score
}

function parseAIInsights(text) {
    // Parse AI response into structured format
    const sections = text.split('\n\n');
    return {
        strengths: extractSection(sections[0]),
        weaknesses: extractSection(sections[1]),
        development_areas: extractSection(sections[2]),
        interview_recommendations: extractSection(sections[3])
    };
}

function extractSection(text) {
    // Extract and structure section content
    return text.split('\n')
        .filter(line => line.trim())
        .map(line => ({
            category: line.split(':')[0],
            description: line.split(':')[1]
        }));
}

export default {
    analyzeResume,
    getAnalysis,
    updateAnalysisFlags,
    getAnalysisSummary
};