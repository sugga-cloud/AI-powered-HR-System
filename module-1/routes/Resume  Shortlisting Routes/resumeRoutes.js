import {Router} from 'express';
import { shortListController } from '../../controllers/resumeController/resumeController.js';
const router  = Router();

router.post('/shortlist',shortListController);
router.get('/healthz',(res,req)=>{
    return res.status(200).json({message:"Working fine"});
})
export default router;