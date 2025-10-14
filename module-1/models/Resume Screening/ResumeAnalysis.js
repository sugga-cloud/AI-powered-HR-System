import mongoose from 'mongoose';

const resumeAnalysisSchema = new mongoose.Schema({
    resume: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Resume',
        required: true
    },
    job_posting: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'JobPosting',
        required: true
    },
    text_analysis: {
        language: String,
        word_count: Number,
        unique_words: Number,
        spelling_errors: [{
            word: String,
            suggestion: String,
            context: String
        }],
        grammar_errors: [{
            error: String,
            suggestion: String,
            context: String
        }],
        formatting_score: Number // 0-100
    },
    content_analysis: {
        sections: [{
            name: String,
            content: String,
            relevance_score: Number,
            keywords: [String]
        }],
        missing_sections: [String],
        section_order_score: Number // 0-100
    },
    skill_analysis: {
        technical_skills: [{
            name: String,
            mentions: Number,
            contexts: [String],
            verified: Boolean
        }],
        soft_skills: [{
            name: String,
            mentions: Number,
            contexts: [String]
        }],
        skill_diversity_score: Number, // 0-100
        skill_relevance_score: Number // 0-100
    },
    experience_analysis: {
        total_years: Number,
        relevant_years: Number,
        companies: [{
            name: String,
            duration: Number, // in months
            role_relevance: Number, // 0-100
            achievements: [String]
        }],
        career_progression: {
            pattern: String, // 'upward', 'steady', 'varied'
            score: Number // 0-100
        },
        industry_exposure: [String]
    },
    education_analysis: {
        highest_degree: {
            level: String,
            field: String,
            relevance: Number // 0-100
        },
        education_timeline: [{
            year: Number,
            degree: String,
            institution: String,
            score: Number
        }],
        certifications_relevance: Number // 0-100
    },
    achievement_analysis: {
        key_achievements: [{
            description: String,
            impact_score: Number, // 0-100
            category: String
        }],
        metrics: [{
            category: String,
            value: Number,
            unit: String,
            impact: String
        }],
        awards_recognition: [{
            title: String,
            year: Number,
            significance: String
        }]
    },
    personality_insights: {
        communication_style: {
            clarity: Number, // 0-100
            professionalism: Number, // 0-100
            confidence: Number // 0-100
        },
        leadership_indicators: [{
            trait: String,
            evidence: [String],
            score: Number // 0-100
        }],
        cultural_fit: {
            alignment_score: Number, // 0-100
            factors: [{
                aspect: String,
                match_level: String
            }]
        }
    },
    market_fit: {
        industry_trends: [{
            trend: String,
            candidate_alignment: Number // 0-100
        }],
        salary_range: {
            min: Number,
            max: Number,
            confidence: Number // 0-100
        },
        market_demand: {
            current_demand: Number, // 0-100
            future_outlook: String
        }
    },
    ai_insights: {
        strengths: [{
            category: String,
            description: String,
            confidence: Number
        }],
        weaknesses: [{
            category: String,
            description: String,
            improvement_suggestions: [String]
        }],
        development_areas: [{
            skill: String,
            importance: Number,
            resources: [String]
        }],
        interview_recommendations: [{
            topic: String,
            questions: [String],
            focus_areas: [String]
        }]
    },
    fraud_detection: {
        risk_score: Number, // 0-100
        flags: [{
            type: String,
            description: String,
            severity: String
        }],
        verification_status: {
            type: String,
            enum: ['pending', 'verified', 'suspicious', 'fraudulent'],
            default: 'pending'
        }
    },
    processing_metadata: {
        start_time: Date,
        end_time: Date,
        duration: Number,
        ai_model_version: String,
        confidence_score: Number,
        processing_stages: [{
            stage: String,
            duration: Number,
            status: String
        }]
    }
}, {
    timestamps: true
});

// Indexes
resumeAnalysisSchema.index({ resume: 1, job_posting: 1 }, { unique: true });
resumeAnalysisSchema.index({ 'fraud_detection.risk_score': 1 });
resumeAnalysisSchema.index({ 'processing_metadata.confidence_score': 1 });

// Methods
resumeAnalysisSchema.methods.getOverallScore = function() {
    const weights = {
        skills: 0.25,
        experience: 0.25,
        education: 0.2,
        personality: 0.15,
        market_fit: 0.15
    };

    return {
        total_score: (
            (this.skill_analysis.skill_relevance_score * weights.skills) +
            (this.experience_analysis.career_progression.score * weights.experience) +
            (this.education_analysis.highest_degree.relevance * weights.education) +
            (this.personality_insights.cultural_fit.alignment_score * weights.personality) +
            (this.market_fit.current_demand * weights.market_fit)
        ).toFixed(2),
        confidence: this.processing_metadata.confidence_score
    };
};

resumeAnalysisSchema.methods.getFraudRiskAssessment = function() {
    const riskLevel = 
        this.fraud_detection.risk_score < 30 ? 'low' :
        this.fraud_detection.risk_score < 70 ? 'medium' : 'high';

    return {
        risk_level: riskLevel,
        flags: this.fraud_detection.flags,
        verification_needed: riskLevel !== 'low'
    };
};

// Static methods
resumeAnalysisSchema.statics.getAnalysisSummary = async function(jobPostingId) {
    return this.aggregate([
        { $match: { job_posting: new mongoose.Types.ObjectId(jobPostingId) } },
        { $group: {
            _id: null,
            avg_confidence: { $avg: '$processing_metadata.confidence_score' },
            avg_processing_time: { $avg: '$processing_metadata.duration' },
            total_processed: { $sum: 1 },
            high_risk_candidates: {
                $sum: {
                    $cond: [{ $gte: ['$fraud_detection.risk_score', 70] }, 1, 0]
                }
            }
        }}
    ]);
};

const ResumeAnalysis = mongoose.model('ResumeAnalysis', resumeAnalysisSchema);
export default ResumeAnalysis;