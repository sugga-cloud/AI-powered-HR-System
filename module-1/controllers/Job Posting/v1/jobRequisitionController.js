import JobRequisition from '../../../models/Job Posting/JobRequisition.js';

// Create new job requisition
export const createRequisition = async (req, res) => {
    try {
        const requisition = new JobRequisition(req.body);
        await requisition.save();
        res.status(201).json(requisition);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// Get all requisitions with filters
export const getAllRequisitions = async (req, res) => {
    try {
        const requisitions = await JobRequisition.find(req.query)
            .populate('manager_id', 'name email')
            .populate('approval_chain.approver_id', 'name email');
        res.json(requisitions);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Get requisition by ID
export const getRequisitionById = async (req, res) => {
    try {
        const requisition = await JobRequisition.findById(req.params.id)
            .populate('manager_id', 'name email')
            .populate('approval_chain.approver_id', 'name email');
        if (!requisition) {
            return res.status(404).json({ message: 'Job requisition not found' });
        }
        res.json(requisition);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Update requisition
export const updateRequisition = async (req, res) => {
    try {
        const requisition = await JobRequisition.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        ).populate('manager_id', 'name email')
         .populate('approval_chain.approver_id', 'name email');
        
        if (!requisition) {
            return res.status(404).json({ message: 'Job requisition not found' });
        }
        res.json(requisition);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// Delete/Close requisition
export const deleteRequisition = async (req, res) => {
    try {
        const requisition = await JobRequisition.findByIdAndUpdate(
            req.params.id,
            { status: 'closed' },
            { new: true }
        );
        if (!requisition) {
            return res.status(404).json({ message: 'Job requisition not found' });
        }
        res.json({ message: 'Job requisition closed successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Approve requisition
export const approveRequisition = async (req, res) => {
    try {
        const { id } = req.params;
        const { approver_id, level, remarks } = req.body;

        const requisition = await JobRequisition.findById(id);
        if (!requisition) {
            return res.status(404).json({ message: 'Job requisition not found' });
        }

        const approvalIndex = requisition.approval_chain.findIndex(
            approval => approval.level === level && approval.status === 'pending'
        );

        if (approvalIndex === -1) {
            return res.status(400).json({ message: 'Invalid approval request' });
        }

        requisition.approval_chain[approvalIndex] = {
            approver_id,
            level,
            status: 'approved',
            remarks,
            acted_at: new Date()
        };

        // Check if this was the final approval
        const allApproved = requisition.approval_chain.every(
            approval => approval.status === 'approved'
        );

        if (allApproved) {
            requisition.status = 'approved';
        }

        await requisition.save();
        res.json(requisition);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// Reject requisition
export const rejectRequisition = async (req, res) => {
    try {
        const { id } = req.params;
        const { approver_id, level, remarks } = req.body;

        const requisition = await JobRequisition.findById(id);
        if (!requisition) {
            return res.status(404).json({ message: 'Job requisition not found' });
        }

        const approvalIndex = requisition.approval_chain.findIndex(
            approval => approval.level === level && approval.status === 'pending'
        );

        if (approvalIndex === -1) {
            return res.status(400).json({ message: 'Invalid rejection request' });
        }

        requisition.approval_chain[approvalIndex] = {
            approver_id,
            level,
            status: 'rejected',
            remarks,
            acted_at: new Date()
        };

        await requisition.save();
        res.json(requisition);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// Search requisitions
export const searchRequisitions = async (req, res) => {
    try {
        const { query } = req.query;
        const requisitions = await JobRequisition.find(
            { $text: { $search: query } },
            { score: { $meta: "textScore" } }
        )
        .sort({ score: { $meta: "textScore" } })
        .populate('manager_id', 'name email');
        
        res.json(requisitions);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Get requisitions by manager
export const getRequisitionsByManager = async (req, res) => {
    try {
        const requisitions = await JobRequisition.find({ 
            manager_id: req.params.managerId 
        })
        .populate('manager_id', 'name email')
        .populate('approval_chain.approver_id', 'name email');
        
        res.json(requisitions);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Get requisitions by status
export const getRequisitionsByStatus = async (req, res) => {
    try {
        const requisitions = await JobRequisition.find({ 
            status: req.params.status 
        })
        .populate('manager_id', 'name email')
        .populate('approval_chain.approver_id', 'name email');
        
        res.json(requisitions);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};