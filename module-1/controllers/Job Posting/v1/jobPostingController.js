import JobPosting from '../../../models/Job Posting/JobPosting.js';
import jobBoardManager from '../../../services/jobBoards/jobBoardManager.js';

// Create new job posting
export const createPosting = async (req, res) => {
    try {
        // Create posting in our database
        const posting = new JobPosting(req.body);
        await posting.save();

        // Post to external job boards
        const externalResults = await jobBoardManager.postToAllPlatforms({
            title: posting.title,
            description: posting.description,
            jobType: posting.jobType,
            location: posting.location,
            experience: posting.experience,
            skills: posting.skills,
            salary: posting.salary,
            company: {
                name: posting.company.name,
                description: posting.company.description,
                website: posting.company.website
            },
            education: posting.education,
            functionalArea: posting.department,
            industry: posting.industry
        });

        // Update posting with external job IDs
        posting.externalPostings = Object.entries(externalResults).reduce((acc, [platform, result]) => {
            if (result.success) {
                acc[platform] = {
                    id: result.jobId,
                    url: result.externalJobUrl
                };
            }
            return acc;
        }, {});

        await posting.save();

        res.status(201).json({
            posting,
            externalResults
        });
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

// Sync posting metrics from external channels
export const syncPostingMetrics = async (req, res) => {
    try {
        const posting = await JobPosting.findById(req.params.id);
        if (!posting) {
            return res.status(404).json({ message: 'Job posting not found' });
        }

        const metrics = {
            clicks: 0,
            views: 0,
            applies: 0,
            shares: 0,
            saves: 0
        };

        const syncErrors = [];

        // Sync metrics from each platform where the job is posted
        if (posting.externalPostings) {
            for (const [platform, data] of Object.entries(posting.externalPostings)) {
                if (!data.id) continue;

                try {
                    const platformMetrics = await jobBoardManager.getJobMetrics(platform, data.id);

                    if (platformMetrics.success) {
                        // Aggregate metrics from all platforms
                        metrics.clicks += platformMetrics.data.clicks || 0;
                        metrics.views += platformMetrics.data.views || 0;
                        metrics.applies += platformMetrics.data.applications || 0;
                        metrics.shares += platformMetrics.data.shares || 0;
                        metrics.saves += platformMetrics.data.saves || 0;

                        // Update platform-specific metrics
                        posting.externalPostings[platform].metrics = platformMetrics.data;
                        posting.externalPostings[platform].metrics.lastSync = new Date();
                    } else {
                        syncErrors.push({
                            platform,
                            error: platformMetrics.error || 'Unknown error during metrics sync'
                        });
                    }
                } catch (error) {
                    syncErrors.push({
                        platform,
                        error: error.message
                    });
                }
            }
        }

        // Update overall metrics
        posting.metrics = metrics;

        // Update sync status
        posting.sync_status = {
            last_synced_at: new Date(),
            next_sync_at: new Date(Date.now() + 6 * 60 * 60 * 1000), // Next sync in 6 hours
            sync_error: syncErrors.length > 0 ? JSON.stringify(syncErrors) : null,
            retry_count: syncErrors.length > 0 ? (posting.sync_status?.retry_count || 0) + 1 : 0
        };

        // Calculate conversion rate
        if (metrics.views > 0) {
            posting.metrics.conversion_rate = (metrics.applies / metrics.views) * 100;
        }

        await posting.save();

        res.json({
            posting,
            syncStatus: {
                success: syncErrors.length === 0,
                errors: syncErrors,
                lastSync: posting.sync_status.last_synced_at,
                nextSync: posting.sync_status.next_sync_at
            }
        });
    } catch (error) {
        res.status(500).json({
            message: error.message,
            error: 'Error syncing metrics'
        });
    }
};