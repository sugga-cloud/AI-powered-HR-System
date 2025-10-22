import { Router } from "express";
import {jdCreateController, jdDeleteController, jdGetAllController, jdGetByIdController, jdUpdateController } from '../controllers/jdController.js'
import {jdPostController,/*jdDeletePostController*/ } from '../controllers/jdPostController.js'
const router = Router();

//Job Creation Routes
router.post('/create',jdCreateController);
router.post('/update',jdUpdateController);
router.post('/delete',jdDeleteController);
router.get('/getAll',jdGetAllController);
router.get('/get/:id',jdGetByIdController);

router.post('/createPost',jdPostController);
// router.post('/deletePost',jdDeletePostController);
// router.post('/updatePost',jdPostController);
export default router;