import linkedinService from './linkedinService.js';
import naukriService from './naukriService.js';

class JobBoardManager {
    constructor() {
        this.platforms = {
            linkedin: linkedinService,
            naukri: naukriService
        };
    }

    async postToAllPlatforms(jobData) {
        const results = {};
        const platforms = Object.keys(this.platforms);

        for (const platform of platforms) {
            try {
                const result = await this.platforms[platform].postJob(jobData);
                results[platform] = result;
            } catch (error) {
                console.error(`Error posting to ${platform}:`, error);
                results[platform] = {
                    success: false,
                    error: error.message,
                    platform
                };
            }
        }

        return results;
    }

    async updateOnAllPlatforms(externalIds, jobData) {
        const results = {};
        
        for (const [platform, externalId] of Object.entries(externalIds)) {
            if (this.platforms[platform]) {
                try {
                    const result = await this.platforms[platform].updateJob(externalId, jobData);
                    results[platform] = result;
                } catch (error) {
                    console.error(`Error updating on ${platform}:`, error);
                    results[platform] = {
                        success: false,
                        error: error.message,
                        platform
                    };
                }
            }
        }

        return results;
    }

    async closeOnAllPlatforms(externalIds) {
        const results = {};
        
        for (const [platform, externalId] of Object.entries(externalIds)) {
            if (this.platforms[platform]) {
                try {
                    const result = await this.platforms[platform].closeJob(externalId);
                    results[platform] = result;
                } catch (error) {
                    console.error(`Error closing on ${platform}:`, error);
                    results[platform] = {
                        success: false,
                        error: error.message,
                        platform
                    };
                }
            }
        }

        return results;
    }
}

export default new JobBoardManager();