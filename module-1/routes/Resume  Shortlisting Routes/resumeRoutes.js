import {Router} from 'express';
import { shortListController, getAllCandidateController, getAllShortlistedController } from '../../controllers/resumeController/resumeController.js';
const router  = Router();

router.post('/shortlist',shortListController);
router.get('/healthz',(res,req)=>{
    return res.status(200).json({message:"Working fine"});
})
router.get('/getAllCandidates/:jdId?',getAllCandidateController);
router.get('/getAllShortListedCandidates/:jdId',getAllShortlistedController);
export default router;