import Skill from '../../../models/Job Posting/Skill.js';
import JobPosting from '../../../models/Job Posting/JobPosting.js';
import { Configuration, OpenAIApi } from 'openai';

// Initialize OpenAI
const configuration = new Configuration({
    apiKey: process.env.OPENAI_API_KEY
});
const openai = new OpenAIApi(configuration);

/**
 * Get skill recommendations based on job description and requirements
 */
export const getSkillRecommendations = async (req, res) => {
    try {
        const { 
            jobTitle, 
            description, 
            industry,
            experienceLevel,
            existingSkills = []
        } = req.body;

        // Get AI recommendations
        const prompt = `Analyze this job information and suggest relevant skills:
            Title: ${jobTitle}
            Description: ${description}
            Industry: ${industry}
            Experience Level: ${experienceLevel}
            Existing Skills: ${existingSkills.join(', ')}

            Provide:
            1. Essential technical skills
            2. Important soft skills
            3. Relevant tools and technologies
            4. Industry-specific skills
            5. Nice-to-have certifications`;

        const completion = await openai.createCompletion({
            model: "text-davinci-003",
            prompt,
            max_tokens: 500,
            temperature: 0.7
        });

        const aiSuggestions = completion.data.choices[0].text.trim();

        // Get market-based recommendations
        const marketBasedSkills = await getMarketBasedRecommendations(
            industry,
            experienceLevel,
            existingSkills
        );

        // Get trend-based recommendations
        const trendingSkills = await Skill.findTrending(5);

        // Get correlation-based recommendations
        const relatedSkills = await Skill.findRelatedSkills(existingSkills, 5);

        res.json({
            ai_recommendations: parseAIRecommendations(aiSuggestions),
            market_recommendations: marketBasedSkills,
            trending_skills: trendingSkills,
            related_skills: relatedSkills,
            metadata: {
                industry,
                experience_level: experienceLevel,
                existing_skills: existingSkills
            }
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

/**
 * Get skills gap analysis
 */
export const analyzeSkillsGap = async (req, res) => {
    try {
        const { currentSkills, targetRole, targetLevel } = req.body;

        // Get required skills for target role
        const roleSkills = await Skill.findByJobRole(targetRole);
        
        // Get level-specific skills
        const levelSkills = await Skill.findByExperienceLevel(targetLevel);

        // Analyze gaps
        const missingSkills = roleSkills.filter(
            skill => !currentSkills.includes(skill._id.toString())
        );

        // Get learning recommendations
        const learningPath = await generateLearningPath(missingSkills, targetLevel);

        res.json({
            current_skills: currentSkills,
            required_skills: roleSkills,
            missing_skills: missingSkills,
            learning_path: learningPath,
            metadata: {
                target_role: targetRole,
                target_level: targetLevel,
                gap_score: calculateGapScore(currentSkills, roleSkills)
            }
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

/**
 * Update skill trends and relevance scores
 */
export const updateSkillMetrics = async (req, res) => {
    try {
        const skills = await Skill.find();
        const updates = [];

        for (const skill of skills) {
            await skill.updateTrendingScore();
            await skill.updateRelatedSkills();
            await skill.updateMarketDemand();
            updates.push(skill);
        }

        res.json({
            message: 'Skill metrics updated successfully',
            updated_skills: updates.length
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

/**
 * Get skill insights and trends
 */
export const getSkillInsights = async (req, res) => {
    try {
        const { skillId } = req.params;
        const { timeframe = '6m' } = req.query;

        const skill = await Skill.findById(skillId).populate('related_skills.skill');
        if (!skill) {
            return res.status(404).json({ message: 'Skill not found' });
        }

        // Get historical data
        const historicalData = await getHistoricalTrends(skillId, timeframe);

        // Get industry demand
        const industryDemand = await getIndustryDemand(skillId);

        // Get salary impact
        const salaryImpact = await analyzeSalaryImpact(skillId);

        res.json({
            skill,
            trends: {
                historical: historicalData,
                industry_demand: industryDemand,
                salary_impact: salaryImpact
            },
            related_skills: skill.related_skills,
            market_demand: skill.market_demand
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Helper functions

async function getMarketBasedRecommendations(industry, level, existingSkills) {
    const marketSkills = await Skill.aggregate([
        {
            $match: {
                'industry_relevance.industry': industry,
                'experience_levels.level': level,
                _id: { $nin: existingSkills }
            }
        },
        {
            $addFields: {
                relevanceScore: {
                    $avg: [
                        '$market_demand.score',
                        { 
                            $arrayElemAt: [
                                '$industry_relevance.score',
                                { $indexOfArray: ['$industry_relevance.industry', industry] }
                            ]
                        }
                    ]
                }
            }
        },
        {
            $sort: { relevanceScore: -1 }
        },
        {
            $limit: 10
        }
    ]);

    return marketSkills;
}

function parseAIRecommendations(aiSuggestions) {
    const categories = {
        technical: [],
        soft: [],
        tools: [],
        industry: [],
        certifications: []
    };

    const lines = aiSuggestions.split('\n');
    let currentCategory = null;

    lines.forEach(line => {
        if (line.toLowerCase().includes('technical skills')) {
            currentCategory = 'technical';
        } else if (line.toLowerCase().includes('soft skills')) {
            currentCategory = 'soft';
        } else if (line.toLowerCase().includes('tools')) {
            currentCategory = 'tools';
        } else if (line.toLowerCase().includes('industry')) {
            currentCategory = 'industry';
        } else if (line.toLowerCase().includes('certifications')) {
            currentCategory = 'certifications';
        } else if (currentCategory && line.trim()) {
            categories[currentCategory].push(line.trim());
        }
    });

    return categories;
}

async function generateLearningPath(missingSkills, targetLevel) {
    const path = [];
    const levels = ['entry', 'junior', 'mid', 'senior', 'expert'];
    const currentLevelIndex = levels.indexOf(targetLevel);

    // Group skills by complexity level
    for (let i = 0; i <= currentLevelIndex; i++) {
        const levelSkills = missingSkills.filter(skill => 
            skill.experience_levels.some(exp => 
                exp.level === levels[i]
            )
        );

        if (levelSkills.length > 0) {
            path.push({
                level: levels[i],
                skills: levelSkills,
                estimated_duration: estimateLearningDuration(levelSkills)
            });
        }
    }

    return path;
}

function calculateGapScore(currentSkills, requiredSkills) {
    const totalRequired = requiredSkills.length;
    const matching = requiredSkills.filter(skill => 
        currentSkills.includes(skill._id.toString())
    ).length;

    return (matching / totalRequired) * 100;
}

async function getHistoricalTrends(skillId, timeframe) {
    const periods = {
        '1m': 30,
        '3m': 90,
        '6m': 180,
        '1y': 365
    };

    const days = periods[timeframe] || 180;
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const trends = await JobPosting.aggregate([
        {
            $match: {
                skills: skillId,
                created_at: { $gte: startDate }
            }
        },
        {
            $group: {
                _id: {
                    $dateToString: {
                        format: '%Y-%m-%d',
                        date: '$created_at'
                    }
                },
                count: { $sum: 1 }
            }
        },
        {
            $sort: { '_id': 1 }
        }
    ]);

    return trends;
}

async function getIndustryDemand(skillId) {
    return await JobPosting.aggregate([
        {
            $match: {
                skills: skillId,
                created_at: {
                    $gte: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000)
                }
            }
        },
        {
            $group: {
                _id: '$industry',
                count: { $sum: 1 }
            }
        },
        {
            $sort: { count: -1 }
        }
    ]);
}

function estimateLearningDuration(skills) {
    // Basic estimation: 2 weeks per skill for the given level
    return skills.length * 2;
}

async function analyzeSalaryImpact(skillId) {
    const jobsWithSkill = await JobPosting.find({
        skills: skillId,
        'salary.min': { $exists: true },
        'salary.max': { $exists: true }
    }).select('salary');

    const jobsWithoutSkill = await JobPosting.find({
        skills: { $ne: skillId },
        'salary.min': { $exists: true },
        'salary.max': { $exists: true }
    }).select('salary');

    const withSkillAvg = calculateAverageSalary(jobsWithSkill);
    const withoutSkillAvg = calculateAverageSalary(jobsWithoutSkill);

    return {
        with_skill: withSkillAvg,
        without_skill: withoutSkillAvg,
        difference: withSkillAvg - withoutSkillAvg,
        difference_percentage: ((withSkillAvg - withoutSkillAvg) / withoutSkillAvg) * 100
    };
}

function calculateAverageSalary(jobs) {
    if (jobs.length === 0) return 0;
    
    const total = jobs.reduce((sum, job) => {
        const avgSalary = (job.salary.min + job.salary.max) / 2;
        return sum + avgSalary;
    }, 0);

    return total / jobs.length;
}