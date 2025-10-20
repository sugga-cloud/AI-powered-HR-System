import Resume from '../../../models/Resume Screening/Resume.js';
import { Configuration, OpenAIApi } from 'openai';
import multer from 'multer';
import path from 'path';
import fs from 'fs/promises';
import pdf from 'pdf-parse';
import mammoth from 'mammoth';
import { promisify } from 'util';
import dotenv from 'dotenv';

dotenv.config();

// Configure OpenAI
const configuration = new Configuration({
    apiKey: process.env.OPENAI_API_KEY
});
const openai = new OpenAIApi(configuration);

// Configure file upload
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = path.join(process.cwd(), 'uploads', 'resumes');
        // Create directory if it doesn't exist
        fs.mkdir(uploadDir, { recursive: true })
            .then(() => cb(null, uploadDir))
            .catch(err => cb(err));
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({
    storage: storage,
    fileFilter: (req, file, cb) => {
        const allowedTypes = ['.pdf', '.doc', '.docx'];
        const ext = path.extname(file.originalname).toLowerCase();
        if (allowedTypes.includes(ext)) {
            cb(null, true);
        } else {
            cb(new Error('Invalid file type. Only PDF and Word documents are allowed.'));
        }
    },
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB limit
    }
}).single('resume');

const uploadAsync = promisify(upload);

/**
 * Upload and parse resume
 * @route POST /api/v1/resumes/upload
 */
export const uploadResume = async (req, res) => {
    try {
        // Handle file upload
        await uploadAsync(req, res);
        
        if (!req.file) {
            return res.status(400).json({ message: 'No file uploaded' });
        }

        const { jobPostingId } = req.body;
        if (!jobPostingId) {
            return res.status(400).json({ message: 'Job posting ID is required' });
        }

        // Parse resume content
        const resumeText = await parseResumeFile(req.file);

        // Extract information using OpenAI
        const parsedData = await extractResumeInformation(resumeText);

        // Create resume record
        const resume = new Resume({
            job_posting: jobPostingId,
            file: {
                originalName: req.file.originalname,
                fileName: req.file.filename,
                fileType: req.file.mimetype,
                fileSize: req.file.size,
                path: req.file.path
            },
            parsed_data: parsedData,
            status: 'pending',
            meta: {
                source: 'direct_upload',
                processing_time: Date.now() - req.file.timestamp
            }
        });

        await resume.save();

        res.status(201).json({
            message: 'Resume uploaded and parsed successfully',
            resumeId: resume._id,
            parsed_data: parsedData
        });
    } catch (error) {
        res.status(500).json({ 
            message: 'Error uploading resume',
            error: error.message 
        });
    }
};

/**
 * Parse resume from URL
 * @route POST /api/v1/resumes/parse-url
 */
export const parseResumeUrl = async (req, res) => {
    try {
        const { url, jobPostingId } = req.body;

        if (!url || !jobPostingId) {
            return res.status(400).json({ 
                message: 'URL and job posting ID are required' 
            });
        }

        // Download and parse resume from URL
        const response = await fetch(url);
        const buffer = await response.buffer();
        const resumeText = await parseResumeBuffer(buffer, path.extname(url));

        // Extract information using OpenAI
        const parsedData = await extractResumeInformation(resumeText);

        // Create resume record
        const resume = new Resume({
            job_posting: jobPostingId,
            file: {
                originalName: path.basename(url),
                fileName: `url-${Date.now()}${path.extname(url)}`,
                fileType: response.headers.get('content-type'),
                fileSize: buffer.length,
                path: url
            },
            parsed_data: parsedData,
            status: 'pending',
            meta: {
                source: 'url_upload'
            }
        });

        await resume.save();

        res.status(201).json({
            message: 'Resume parsed successfully',
            resumeId: resume._id,
            parsed_data: parsedData
        });
    } catch (error) {
        res.status(500).json({ 
            message: 'Error parsing resume from URL',
            error: error.message 
        });
    }
};

/**
 * Batch upload resumes
 * @route POST /api/v1/resumes/batch-upload
 */
export const batchUploadResumes = async (req, res) => {
    try {
        const { jobPostingId } = req.body;
        const files = req.files;

        if (!jobPostingId || !files || files.length === 0) {
            return res.status(400).json({ 
                message: 'Job posting ID and files are required' 
            });
        }

        const results = [];
        const errors = [];

        for (const file of files) {
            try {
                const resumeText = await parseResumeFile(file);
                const parsedData = await extractResumeInformation(resumeText);

                const resume = new Resume({
                    job_posting: jobPostingId,
                    file: {
                        originalName: file.originalname,
                        fileName: file.filename,
                        fileType: file.mimetype,
                        fileSize: file.size,
                        path: file.path
                    },
                    parsed_data: parsedData,
                    status: 'pending',
                    meta: {
                        source: 'batch_upload',
                        processing_time: Date.now() - file.timestamp
                    }
                });

                await resume.save();
                results.push({
                    originalName: file.originalname,
                    resumeId: resume._id,
                    status: 'success'
                });
            } catch (error) {
                errors.push({
                    originalName: file.originalname,
                    error: error.message
                });
            }
        }

        res.status(200).json({
            message: 'Batch upload completed',
            successful: results,
            failed: errors,
            total_processed: results.length + errors.length,
            success_rate: (results.length / (results.length + errors.length)) * 100
        });
    } catch (error) {
        res.status(500).json({ 
            message: 'Error in batch upload',
            error: error.message 
        });
    }
};

// Helper functions

/**
 * Parse resume file based on file type
 */
async function parseResumeFile(file) {
    const buffer = await fs.readFile(file.path);
    return parseResumeBuffer(buffer, path.extname(file.originalname));
}

/**
 * Parse resume buffer based on file extension
 */
async function parseResumeBuffer(buffer, extension) {
    switch (extension.toLowerCase()) {
        case '.pdf':
            const pdfData = await pdf(buffer);
            return pdfData.text;

        case '.doc':
        case '.docx':
            const { value } = await mammoth.extractRawText({ buffer });
            return value;

        default:
            throw new Error('Unsupported file type');
    }
}

/**
 * Extract structured information from resume text using OpenAI
 */
async function extractResumeInformation(resumeText) {
    const prompt = `Extract the following information from this resume:
        1. Education history (degree, institution, field, year)
        2. Work experience (title, company, dates, description)
        3. Skills (technical and soft skills)
        4. Languages
        5. Certifications

        Resume text:
        ${resumeText}

        Provide the information in a structured format.`;

    const completion = await openai.createCompletion({
        model: "text-davinci-003",
        prompt,
        max_tokens: 1000,
        temperature: 0.3
    });

    const response = completion.data.choices[0].text.trim();
    return parseAIResponse(response);
}

/**
 * Parse AI response into structured format
 */
function parseAIResponse(response) {
    // Initialize structured data
    const parsedData = {
        education: [],
        experience: [],
        skills: [],
        languages: [],
        certifications: []
    };

    // Split response into sections
    const sections = response.split('\n\n');
    
    sections.forEach(section => {
        const lines = section.split('\n');
        const sectionTitle = lines[0].toLowerCase();

        if (sectionTitle.includes('education')) {
            parsedData.education = parseEducation(lines.slice(1));
        } else if (sectionTitle.includes('experience')) {
            parsedData.experience = parseExperience(lines.slice(1));
        } else if (sectionTitle.includes('skills')) {
            parsedData.skills = parseSkills(lines.slice(1));
        } else if (sectionTitle.includes('languages')) {
            parsedData.languages = parseLanguages(lines.slice(1));
        } else if (sectionTitle.includes('certifications')) {
            parsedData.certifications = parseCertifications(lines.slice(1));
        }
    });

    return parsedData;
}

function parseEducation(lines) {
    return lines.map(line => {
        const parts = line.split(',').map(part => part.trim());
        return {
            degree: parts[0] || '',
            institution: parts[1] || '',
            field: parts[2] || '',
            year: parseInt(parts[3]) || null
        };
    }).filter(edu => edu.degree || edu.institution);
}

function parseExperience(lines) {
    const experiences = [];
    let currentExp = null;

    lines.forEach(line => {
        if (line.includes(' - ')) {
            if (currentExp) experiences.push(currentExp);
            const [title, company] = line.split(' - ').map(part => part.trim());
            currentExp = { title, company, description: '', highlights: [] };
        } else if (currentExp && line.trim()) {
            currentExp.description += line.trim() + ' ';
        }
    });

    if (currentExp) experiences.push(currentExp);
    return experiences;
}

function parseSkills(lines) {
    return lines.map(line => {
        const [name, level] = line.split('-').map(part => part.trim());
        return {
            name,
            level: level || 'intermediate',
            years: null
        };
    }).filter(skill => skill.name);
}

function parseLanguages(lines) {
    return lines.map(line => {
        const [name, proficiency] = line.split('-').map(part => part.trim());
        return {
            name,
            proficiency: proficiency || 'intermediate'
        };
    }).filter(lang => lang.name);
}

function parseCertifications(lines) {
    return lines.map(line => {
        const parts = line.split(',').map(part => part.trim());
        return {
            name: parts[0] || '',
            issuer: parts[1] || '',
            date: parts[2] ? new Date(parts[2]) : null
        };
    }).filter(cert => cert.name);
}