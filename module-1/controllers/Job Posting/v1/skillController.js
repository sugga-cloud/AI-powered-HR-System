import Skill from '../../../models/Job Posting/Skill.js';

// Create new skill
export const createSkill = async (req, res) => {
    try {
        const skill = new Skill(req.body);
        await skill.save();
        res.status(201).json(skill);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// Get all skills with optional filtering
export const getAllSkills = async (req, res) => {
    try {
        const skills = await Skill.find(req.query)
            .sort({ popularity_score: -1 });
        res.json(skills);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Get skill by ID
export const getSkillById = async (req, res) => {
    try {
        const skill = await Skill.findById(req.params.id);
        if (!skill) {
            return res.status(404).json({ message: 'Skill not found' });
        }
        res.json(skill);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Update skill
export const updateSkill = async (req, res) => {
    try {
        const skill = await Skill.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        );
        
        if (!skill) {
            return res.status(404).json({ message: 'Skill not found' });
        }
        res.json(skill);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// Search skills
export const searchSkills = async (req, res) => {
    try {
        const { term } = req.params;
        const skills = await Skill.find({
            $or: [
                { name: { $regex: term, $options: 'i' } },
                { aliases: { $regex: term, $options: 'i' } }
            ]
        }).sort({ popularity_score: -1 });
        
        res.json(skills);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Get popular skills
export const getPopularSkills = async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 10;
        const skills = await Skill.find()
            .sort({ popularity_score: -1 })
            .limit(limit);
        
        res.json(skills);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Batch update skills
export const batchUpdateSkills = async (req, res) => {
    try {
        const { skills } = req.body;
        const operations = skills.map(skill => ({
            updateOne: {
                filter: { name: skill.name },
                update: skill,
                upsert: true
            }
        }));

        const result = await Skill.bulkWrite(operations);
        res.json(result);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};