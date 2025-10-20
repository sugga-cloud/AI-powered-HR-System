import axios from 'axios';
import { config } from '../../config/config.js';

class NaukriJobService {
    constructor() {
        this.apiUrl = 'https://api.naukri.com/v1';
        this.apiKey = config.naukri.apiKey;
        this.clientId = config.naukri.clientId;
    }

    async postJob(jobData) {
        try {
            const naukriJobData = this.transformJobData(jobData);
            const response = await axios.post(
                `${this.apiUrl}/jobs`,
                naukriJobData,
                {
                    headers: {
                        'Authorization': `Bearer ${this.apiKey}`,
                        'Content-Type': 'application/json',
                        'X-Client-Id': this.clientId
                    }
                }
            );
            return {
                success: true,
                jobId: response.data.jobId,
                platform: 'naukri',
                externalJobUrl: response.data.jobUrl
            };
        } catch (error) {
            console.error('Naukri Job Posting Error:', error);
            return {
                success: false,
                platform: 'naukri',
                error: error.message
            };
        }
    }

    async updateJob(externalJobId, jobData) {
        try {
            const naukriJobData = this.transformJobData(jobData);
            await axios.put(
                `${this.apiUrl}/jobs/${externalJobId}`,
                naukriJobData,
                {
                    headers: {
                        'Authorization': `Bearer ${this.apiKey}`,
                        'Content-Type': 'application/json',
                        'X-Client-Id': this.clientId
                    }
                }
            );
            return {
                success: true,
                platform: 'naukri'
            };
        } catch (error) {
            console.error('Naukri Job Update Error:', error);
            return {
                success: false,
                platform: 'naukri',
                error: error.message
            };
        }
    }

    async closeJob(externalJobId) {
        try {
            await axios.delete(
                `${this.apiUrl}/jobs/${externalJobId}`,
                {
                    headers: {
                        'Authorization': `Bearer ${this.apiKey}`,
                        'Content-Type': 'application/json',
                        'X-Client-Id': this.clientId
                    }
                }
            );
            return {
                success: true,
                platform: 'naukri'
            };
        } catch (error) {
            console.error('Naukri Job Closing Error:', error);
            return {
                success: false,
                platform: 'naukri',
                error: error.message
            };
        }
    }

    transformJobData(jobData) {
        return {
            title: jobData.title,
            description: jobData.description,
            employmentType: this.mapEmploymentType(jobData.jobType),
            location: {
                city: jobData.location.city,
                state: jobData.location.state,
                country: jobData.location.country
            },
            minExperience: jobData.experience.min,
            maxExperience: jobData.experience.max,
            minSalary: jobData.salary.min,
            maxSalary: jobData.salary.max,
            currency: jobData.salary.currency,
            skills: jobData.skills,
            industry: jobData.industry,
            functionalArea: jobData.functionalArea,
            education: this.mapEducation(jobData.education),
            companyDetails: {
                name: jobData.company.name,
                description: jobData.company.description,
                website: jobData.company.website
            }
        };
    }

    mapEmploymentType(jobType) {
        const typeMap = {
            'full-time': 'Full Time',
            'part-time': 'Part Time',
            'contract': 'Contract',
            'temporary': 'Temporary',
            'internship': 'Internship'
        };
        return typeMap[jobType.toLowerCase()] || 'Full Time';
    }

    mapEducation(education) {
        const eduMap = {
            'bachelors': 'UG',
            'masters': 'PG',
            'phd': 'Doctorate',
            'diploma': 'Diploma'
        };
        return eduMap[education.toLowerCase()] || 'Any';
    }
}

export default new NaukriJobService();