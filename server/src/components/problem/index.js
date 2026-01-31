const router=require('express').Router();
const authMiddleware = require('../../middleware/auth.middleware');
const controller=require('./problem.controller');


router.post('/create',authMiddleware.protect,authMiddleware.isAdmin,controller.createProblem);
router.get('/all',authMiddleware.protect,controller.getAll);
router.get('/:id',authMiddleware.protect,controller.getProblemById);

module.exports=router