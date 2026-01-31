const router=require('express').Router();
const authMiddleware = require('../../middleware/auth.middleware');
const controller=require('./submission.controller');


router.post('/create',authMiddleware.protect,controller.createSubmission);
router.get('/getSubmission',authMiddleware.protect,controller.getSubmission);
router.get('/:id',authMiddleware.protect,controller.getSubmissionById);

module.exports=router