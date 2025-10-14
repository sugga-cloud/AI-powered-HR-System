import mongoose from 'mongoose';

const resumeSchema = new mongoose.Schema({
    candidate: {
        name: { type: String, required: true },
        email: { type: String, required: true },
        phone: { type: String },
        linkedin: { type: String },
        portfolio: { type: String }
    },
    job_posting: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'JobPosting',
        required: true
    },
    file: {
        originalName: { type: String, required: true },
        fileName: { type: String, required: true },
        fileType: { type: String, required: true },
        fileSize: { type: Number, required: true },
        path: { type: String, required: true }
    },
    parsed_data: {
        education: [{
            degree: String,
            institution: String,
            field: String,
            year: Number,
            score: Number
        }],
        experience: [{
            title: String,
            company: String,
            location: String,
            startDate: Date,
            endDate: Date,
            description: String,
            highlights: [String]
        }],
        skills: [{
            name: String,
            level: { type: String, enum: ['beginner', 'intermediate', 'advanced', 'expert'] },
            years: Number
        }],
        languages: [{
            name: String,
            proficiency: { type: String, enum: ['basic', 'intermediate', 'fluent', 'native'] }
        }],
        certifications: [{
            name: String,
            issuer: String,
            date: Date,
            expires: Date
        }]
    },
    analysis: {
        match_score: { type: Number, default: 0 }, // 0-100
        skill_match: {
            required_skills: [String],
            matching_skills: [String],
            missing_skills: [String],
            additional_skills: [String],
            skill_score: { type: Number, default: 0 }
        },
        experience_match: {
            required_years: Number,
            actual_years: Number,
            relevance_score: { type: Number, default: 0 }
        },
        education_match: {
            required_degree: String,
            education_score: { type: Number, default: 0 }
        },
        keyword_match: {
            required_keywords: [String],
            found_keywords: [{
                keyword: String,
                count: Number,
                context: [String]
            }],
            keyword_score: { type: Number, default: 0 }
        },
        red_flags: [{
            type: String,
            description: String,
            severity: { type: String, enum: ['low', 'medium', 'high'] }
        }],
        recommendations: [{
            type: { type: String, enum: ['interview', 'reject', 'further_review'] },
            reason: String,
            priority: { type: String, enum: ['low', 'medium', 'high'] }
        }]
    },
    status: {
        type: String,
        enum: ['pending', 'processing', 'analyzed', 'shortlisted', 'rejected'],
        default: 'pending'
    },
    screening_stage: {
        type: String,
        enum: ['initial', 'technical', 'hr', 'final'],
        default: 'initial'
    },
    feedback: [{
        reviewer: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        stage: String,
        rating: Number,
        comments: String,
        timestamp: { type: Date, default: Date.now }
    }],
    tags: [String],
    communication: [{
        type: { type: String, enum: ['email', 'phone', 'other'] },
        date: Date,
        subject: String,
        content: String,
        status: { type: String, enum: ['sent', 'received', 'failed'] }
    }],
    meta: {
        source: String,
        apply_date: { type: Date, default: Date.now },
        last_updated: { type: Date, default: Date.now },
        processing_time: Number, // in milliseconds
        version: { type: String, default: '1.0' }
    }
}, {
    timestamps: true
});

// Indexes
resumeSchema.index({ 'candidate.email': 1 });
resumeSchema.index({ job_posting: 1 });
resumeSchema.index({ status: 1 });
resumeSchema.index({ 'analysis.match_score': -1 });

// Pre-save middleware to update last_updated
resumeSchema.pre('save', function(next) {
    this.meta.last_updated = new Date();
    next();
});

// Methods to update analysis scores
resumeSchema.methods.updateMatchScore = function() {
    const weights = {
        skill: 0.4,
        experience: 0.3,
        education: 0.2,
        keyword: 0.1
    };

    this.analysis.match_score = 
        (this.analysis.skill_match.skill_score * weights.skill) +
        (this.analysis.experience_match.relevance_score * weights.experience) +
        (this.analysis.education_match.education_score * weights.education) +
        (this.analysis.keyword_match.keyword_score * weights.keyword);

    return this.analysis.match_score;
};

// Static method to find top matches for a job posting
resumeSchema.statics.findTopMatches = async function(jobPostingId, limit = 10) {
    return this.find({
        job_posting: jobPostingId,
        status: { $in: ['analyzed', 'shortlisted'] }
    })
    .sort({ 'analysis.match_score': -1 })
    .limit(limit);
};

// Static method to get screening statistics
resumeSchema.statics.getScreeningStats = async function(jobPostingId) {
    return this.aggregate([
        { $match: { job_posting: new mongoose.Types.ObjectId(jobPostingId) } },
        { $group: {
            _id: '$status',
            count: { $sum: 1 },
            avgScore: { $avg: '$analysis.match_score' }
        }},
        { $project: {
            status: '$_id',
            count: 1,
            avgScore: { $round: ['$avgScore', 2] }
        }}
    ]);
};

const Resume = mongoose.model('Resume', resumeSchema);
export default Resume;