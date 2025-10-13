import axios from 'axios';
import { config } from '../../config/config.js';

class LinkedInJobService {
    constructor() {
        this.apiUrl = 'https://api.linkedin.com/v2';
        this.accessToken = config.linkedin.accessToken;
        this.organizationId = config.linkedin.organizationId;
    }

    async postJob(jobData) {
        try {
            const linkedinJobData = this.transformJobData(jobData);
            const response = await axios.post(
                `${this.apiUrl}/jobs`,
                linkedinJobData,
                {
                    headers: {
                        'Authorization': `Bearer ${this.accessToken}`,
                        'Content-Type': 'application/json',
                        'X-Restli-Protocol-Version': '2.0.0'
                    }
                }
            );
            return {
                success: true,
                jobId: response.data.id,
                platform: 'linkedin',
                externalJobUrl: response.data.jobPostingUrl
            };
        } catch (error) {
            console.error('LinkedIn Job Posting Error:', error);
            return {
                success: false,
                platform: 'linkedin',
                error: error.message
            };
        }
    }

    async updateJob(externalJobId, jobData) {
        try {
            const linkedinJobData = this.transformJobData(jobData);
            await axios.patch(
                `${this.apiUrl}/jobs/${externalJobId}`,
                linkedinJobData,
                {
                    headers: {
                        'Authorization': `Bearer ${this.accessToken}`,
                        'Content-Type': 'application/json',
                        'X-Restli-Protocol-Version': '2.0.0'
                    }
                }
            );
            return {
                success: true,
                platform: 'linkedin'
            };
        } catch (error) {
            console.error('LinkedIn Job Update Error:', error);
            return {
                success: false,
                platform: 'linkedin',
                error: error.message
            };
        }
    }

    async closeJob(externalJobId) {
        try {
            await axios.post(
                `${this.apiUrl}/jobs/${externalJobId}/close`,
                {},
                {
                    headers: {
                        'Authorization': `Bearer ${this.accessToken}`,
                        'Content-Type': 'application/json',
                        'X-Restli-Protocol-Version': '2.0.0'
                    }
                }
            );
            return {
                success: true,
                platform: 'linkedin'
            };
        } catch (error) {
            console.error('LinkedIn Job Closing Error:', error);
            return {
                success: false,
                platform: 'linkedin',
                error: error.message
            };
        }
    }

    transformJobData(jobData) {
        return {
            author: this.organizationId,
            description: {
                text: jobData.description
            },
            locationPlaces: [{
                country: jobData.location.country,
                localizedName: jobData.location.city
            }],
            title: jobData.title,
            employmentType: this.mapEmploymentType(jobData.jobType),
            experience: this.mapExperienceLevel(jobData.experienceLevel),
            seniorityLevel: this.mapSeniorityLevel(jobData.seniorityLevel),
            skills: jobData.skills.map(skill => ({ skill: { name: skill } }))
        };
    }

    mapEmploymentType(jobType) {
        const typeMap = {
            'full-time': 'FULL_TIME',
            'part-time': 'PART_TIME',
            'contract': 'CONTRACT',
            'temporary': 'TEMPORARY',
            'internship': 'INTERNSHIP'
        };
        return typeMap[jobType.toLowerCase()] || 'FULL_TIME';
    }

    mapExperienceLevel(level) {
        const levelMap = {
            'entry': 'ENTRY_LEVEL',
            'mid': 'MID_SENIOR',
            'senior': 'SENIOR',
            'executive': 'EXECUTIVE'
        };
        return levelMap[level.toLowerCase()] || 'NOT_APPLICABLE';
    }

    mapSeniorityLevel(level) {
        const levelMap = {
            'entry': 'ENTRY_LEVEL',
            'associate': 'ASSOCIATE',
            'mid-senior': 'MID_SENIOR',
            'director': 'DIRECTOR',
            'executive': 'EXECUTIVE'
        };
        return levelMap[level.toLowerCase()] || 'NOT_APPLICABLE';
    }
}

export default new LinkedInJobService();