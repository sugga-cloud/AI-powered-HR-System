import mongoose from "mongoose";

const skillSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    category: {
        type: String,
        required: true,
        enum: [
            'technical',
            'soft',
            'domain',
            'tool',
            'certification',
            'language'
        ]
    },
    aliases: {
        type: [String],
        default: []
    },
    description: String,
    popularity_score: {
        type: Number,
        default: 0,
        min: 0
    },
    trending_score: {
        type: Number,
        default: 0,
        min: 0
    },
    market_demand: {
        score: {
            type: Number,
            default: 0,
            min: 0,
            max: 1.0
        },
        growth_rate: {
            type: Number,
            default: 0
        },
        last_updated: Date
    },
    related_skills: [{
        skill: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Skill'
        },
        correlation: {
            type: Number,
            min: 0,
            max: 1.0
        }
    }],
    industry_relevance: [{
        industry: String,
        score: {
            type: Number,
            min: 0,
            max: 1.0
        }
    }],
    job_roles: [{
        role: String,
        relevance: {
            type: Number,
            min: 0,
            max: 1.0
        }
    }],
    experience_levels: [{
        level: {
            type: String,
            enum: ['entry', 'junior', 'mid', 'senior', 'expert']
        },
        relevance: {
            type: Number,
            min: 0,
            max: 1.0
        }
    }],
    metadata: {
        source: String,
        version: String,
        last_verified: Date,
        verification_source: String
    },
    created_at: {
        type: Date,
        default: Date.now
    },
    updated_at: Date
}, {
    timestamps: true
});

// Indexes for better query performance
skillSchema.index({ name: 1 }, { unique: true });
skillSchema.index({ category: 1 });
skillSchema.index({ aliases: 1 });
skillSchema.index({ trending_score: -1 });
skillSchema.index({ 'industry_relevance.industry': 1 });
skillSchema.index({ 'job_roles.role': 1 });
skillSchema.index({ 'experience_levels.level': 1 });

// Pre-save middleware
skillSchema.pre('save', function(next) {
    this.updated_at = new Date();
    next();
});

// Instance methods
skillSchema.methods = {
    async updateTrendingScore() {
        const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        
        const recentPostings = await mongoose.model('JobPosting').countDocuments({
            skills: this._id,
            created_at: { $gte: thirtyDaysAgo }
        });

        const totalPostings = await mongoose.model('JobPosting').countDocuments({
            skills: this._id
        });

        this.trending_score = totalPostings > 0 ? recentPostings / totalPostings : 0;
        return this.save();
    },

    async updateRelatedSkills() {
        const coOccurringSkills = await mongoose.model('JobPosting').aggregate([
            {
                $match: { skills: this._id }
            },
            {
                $unwind: '$skills'
            },
            {
                $match: { skills: { $ne: this._id } }
            },
            {
                $group: {
                    _id: '$skills',
                    count: { $sum: 1 }
                }
            },
            {
                $sort: { count: -1 }
            },
            {
                $limit: 10
            }
        ]);

        const totalPostings = await mongoose.model('JobPosting').countDocuments({
            skills: this._id
        });

        this.related_skills = coOccurringSkills.map(skill => ({
            skill: skill._id,
            correlation: totalPostings > 0 ? skill.count / totalPostings : 0
        }));

        return this.save();
    },

    async updateMarketDemand() {
        const now = new Date();
        const sixMonthsAgo = new Date(now.setMonth(now.getMonth() - 6));
        
        const recentPostings = await mongoose.model('JobPosting').find({
            skills: this._id,
            created_at: { $gte: sixMonthsAgo }
        }).select('created_at');

        // Calculate growth rate
        const monthlyPostings = new Array(6).fill(0);
        recentPostings.forEach(posting => {
            const monthIndex = posting.created_at.getMonth();
            monthlyPostings[monthIndex]++;
        });

        const growthRate = monthlyPostings.reduce((acc, curr, i) => {
            if (i === 0) return acc;
            const growth = curr - monthlyPostings[i-1];
            return acc + growth;
        }, 0) / 5; // Average monthly growth

        this.market_demand = {
            score: recentPostings.length / 100, // Normalize to 0-1
            growth_rate: growthRate,
            last_updated: new Date()
        };

        return this.save();
    }
};

// Static methods
skillSchema.statics = {
    findTrending(limit = 10) {
        return this.find()
            .sort({ trending_score: -1 })
            .limit(limit);
    },

    findByIndustry(industry) {
        return this.find({
            'industry_relevance.industry': industry
        }).sort({
            'industry_relevance.score': -1
        });
    },

    findByJobRole(role) {
        return this.find({
            'job_roles.role': role
        }).sort({
            'job_roles.relevance': -1
        });
    },

    findByExperienceLevel(level) {
        return this.find({
            'experience_levels.level': level
        }).sort({
            'experience_levels.relevance': -1
        });
    },

    async findRelatedSkills(skillIds, limit = 10) {
        return this.aggregate([
            {
                $match: { _id: { $in: Array.isArray(skillIds) ? skillIds : [skillIds] } }
            },
            {
                $unwind: '$related_skills'
            },
            {
                $group: {
                    _id: '$related_skills.skill',
                    total_correlation: { $sum: '$related_skills.correlation' }
                }
            },
            {
                $sort: { total_correlation: -1 }
            },
            {
                $limit: limit
            },
            {
                $lookup: {
                    from: 'skills',
                    localField: '_id',
                    foreignField: '_id',
                    as: 'skill_details'
                }
            }
        ]);
    }
};

const Skill = mongoose.model("Skill", skillSchema);
export default Skill;