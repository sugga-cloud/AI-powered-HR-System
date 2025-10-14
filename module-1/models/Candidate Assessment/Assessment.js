import mongoose from 'mongoose';

const assessmentSchema = new mongoose.Schema({
    candidate: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Candidate',
        required: true
    },
    job_posting: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'JobPosting',
        required: true
    },
    assessment_type: {
        type: String,
        enum: ['mcq', 'coding', 'aptitude', 'video_interview'],
        required: true
    },
    status: {
        type: String,
        enum: ['pending', 'in_progress', 'completed', 'evaluated'],
        default: 'pending'
    },
    sections: [{
        type: {
            type: String,
            enum: ['mcq', 'coding', 'aptitude', 'video']
        },
        title: String,
        duration: Number, // in minutes
        questions: [{
            question_text: String,
            type: String,
            options: [String],
            correct_answer: mongoose.Schema.Types.Mixed,
            points: Number,
            skill_category: String,
            difficulty_level: {
                type: String,
                enum: ['easy', 'medium', 'hard']
            }
        }],
        adaptive_settings: {
            enabled: Boolean,
            initial_difficulty: String,
            difficulty_adjustment_rate: Number
        }
    }],
    proctoring_settings: {
        enabled: Boolean,
        face_recognition: Boolean,
        screen_monitoring: Boolean,
        tab_switching_detection: Boolean,
        audio_monitoring: Boolean,
        violation_threshold: Number
    },
    video_interview_settings: {
        duration_per_answer: Number,
        retakes_allowed: Number,
        tone_analysis: Boolean,
        sentiment_analysis: Boolean,
        keyword_detection: Boolean
    },
    scoring: {
        total_score: Number,
        section_scores: [{
            section_id: mongoose.Schema.Types.ObjectId,
            score: Number,
            weighted_score: Number
        }],
        ai_evaluation: {
            technical_score: Number,
            communication_score: Number,
            problem_solving_score: Number,
            cultural_fit_score: Number
        },
        success_probability: Number
    },
    proctoring_logs: [{
        timestamp: Date,
        event_type: {
            type: String,
            enum: ['face_not_detected', 'multiple_faces', 'tab_switch', 'suspicious_movement']
        },
        severity: String,
        details: mongoose.Schema.Types.Mixed,
        screenshot_url: String
    }],
    video_analysis_results: [{
        question_id: mongoose.Schema.Types.ObjectId,
        tone_scores: {
            confidence: Number,
            professionalism: Number,
            enthusiasm: Number,
            clarity: Number
        },
        sentiment_scores: {
            positive: Number,
            negative: Number,
            neutral: Number
        },
        detected_keywords: [{
            keyword: String,
            relevance_score: Number,
            timestamp: Number
        }],
        overall_communication_score: Number
    }],
    adaptive_test_metrics: {
        starting_difficulty: String,
        difficulty_progression: [{
            question_number: Number,
            difficulty: String,
            response_time: Number,
            correct: Boolean
        }],
        final_difficulty_level: String
    },
    completion_details: {
        start_time: Date,
        end_time: Date,
        duration: Number,
        ip_address: String,
        browser_info: String
    },
    historical_performance_metrics: {
        similar_role_success_rate: Number,
        skill_match_percentage: Number,
        experience_relevance_score: Number
    }
}, {
    timestamps: true
});

// Indexes
assessmentSchema.index({ candidate: 1, job_posting: 1 });
assessmentSchema.index({ status: 1 });
assessmentSchema.index({ 'scoring.total_score': -1 });

// Methods

// Initialize adaptive testing
assessmentSchema.methods.initializeAdaptiveTest = async function() {
    const initialQuestions = await this.getQuestionsForDifficulty('medium');
    this.adaptive_test_metrics.starting_difficulty = 'medium';
    return initialQuestions;
};

// Update difficulty based on performance
assessmentSchema.methods.updateDifficulty = function(currentPerformance) {
    const difficultyLevels = ['easy', 'medium', 'hard'];
    let currentIndex = difficultyLevels.indexOf(
        this.adaptive_test_metrics.final_difficulty_level
    );
    
    if (currentPerformance > 0.75) currentIndex++;
    else if (currentPerformance < 0.5) currentIndex--;
    
    currentIndex = Math.max(0, Math.min(currentIndex, difficultyLevels.length - 1));
    this.adaptive_test_metrics.final_difficulty_level = difficultyLevels[currentIndex];
    
    return this.adaptive_test_metrics.final_difficulty_level;
};

// Record proctoring violation
assessmentSchema.methods.recordViolation = function(violationData) {
    this.proctoring_logs.push({
        timestamp: new Date(),
        ...violationData
    });
    return this.save();
};

// Calculate success probability
assessmentSchema.methods.calculateSuccessProbability = async function() {
    const HistoricalData = mongoose.model('HistoricalData');
    
    // Get historical performance data for similar roles
    const historicalData = await HistoricalData.find({
        job_role: this.job_posting.role,
        assessment_type: this.assessment_type
    });

    // Calculate probability based on multiple factors
    const technicalWeight = 0.4;
    const communicationWeight = 0.3;
    const experienceWeight = 0.3;

    const probability = 
        (this.scoring.ai_evaluation.technical_score * technicalWeight) +
        (this.scoring.ai_evaluation.communication_score * communicationWeight) +
        (this.historical_performance_metrics.experience_relevance_score * experienceWeight);

    this.scoring.success_probability = probability;
    return probability;
};

// Analyze video interview
assessmentSchema.methods.analyzeVideoResponse = async function(videoData) {
    // Implement video analysis logic here
    const analysis = {
        tone_scores: await this.analyzeTone(videoData),
        sentiment_scores: await this.analyzeSentiment(videoData),
        detected_keywords: await this.detectKeywords(videoData),
        overall_communication_score: 0
    };

    // Calculate overall communication score
    analysis.overall_communication_score = 
        (analysis.tone_scores.confidence * 0.3) +
        (analysis.tone_scores.professionalism * 0.3) +
        (analysis.tone_scores.clarity * 0.4);

    return analysis;
};

export default mongoose.model('Assessment', assessmentSchema);