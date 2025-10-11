import JobPosting from '../../../models/Job Posting/JobPosting.js';

// Create new job posting
export const createPosting = async (req, res) => {
    try {
        const posting = new JobPosting(req.body);
        await posting.save();
        res.status(201).json(posting);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// Get all postings with filters
export const getAllPostings = async (req, res) => {
    try {
        const postings = await JobPosting.find(req.query)
            .populate('job_id');
        res.json(postings);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Get posting by ID
export const getPostingById = async (req, res) => {
    try {
        const posting = await JobPosting.findById(req.params.id)
            .populate('job_id');
        if (!posting) {
            return res.status(404).json({ message: 'Job posting not found' });
        }
        res.json(posting);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Update posting status
export const updatePostingStatus = async (req, res) => {
    try {
        const posting = await JobPosting.findByIdAndUpdate(
            req.params.id,
            { status: req.body.status },
            { new: true }
        ).populate('job_id');
        
        if (!posting) {
            return res.status(404).json({ message: 'Job posting not found' });
        }
        res.json(posting);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// Get postings by job
export const getPostingsByJob = async (req, res) => {
    try {
        const postings = await JobPosting.find({ 
            job_id: req.params.jobId 
        }).populate('job_id');
        
        res.json(postings);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Get postings by channel
export const getPostingsByChannel = async (req, res) => {
    try {
        const postings = await JobPosting.find({ 
            channel: req.params.channel 
        }).populate('job_id');
        
        res.json(postings);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Get posting metrics
export const getPostingMetrics = async (req, res) => {
    try {
        const posting = await JobPosting.findById(req.params.id);
        if (!posting) {
            return res.status(404).json({ message: 'Job posting not found' });
        }
        
        res.json(posting.metrics);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Sync posting metrics from external channel
export const syncPostingMetrics = async (req, res) => {
    try {
        const posting = await JobPosting.findById(req.params.id);
        if (!posting) {
            return res.status(404).json({ message: 'Job posting not found' });
        }

        // TODO: Integrate with external job boards APIs
        // This is a placeholder for external API integration
        const updatedMetrics = await fetchExternalMetrics(posting);
        
        posting.metrics = updatedMetrics;
        posting.last_synced_at = new Date();
        await posting.save();
        
        res.json(posting);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Helper function (to be implemented based on actual external API integration)
async function fetchExternalMetrics(posting) {
    // Placeholder for external API integration
    return {
        clicks: 100,
        views: 500,
        applies: 10
    };
}