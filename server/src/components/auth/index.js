const router=require('express').Router();
const authMiddleware = require('../../middleware/auth.middleware');
const controller=require('./auth.controller');


router.post('/register',controller.registerUser);
router.post('/login',controller.loginUser);
router.get('/user/me',authMiddleware.protect,controller.me)

module.exports=router