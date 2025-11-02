import resumeShortListQueue from '../../queues/resumeShortListQueue.js';

export const shortListController = async (req,res)=>{
    const {jdId} = req.body;
    await resumeShortListQueue.add('shortListResume',{jdId});
    return res.status(200).json({message:"Resume shortlisting in progress" });
}