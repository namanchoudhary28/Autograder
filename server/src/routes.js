const router=require('express').Router();
const authRouter=require('./components/auth')
const problemRouter=require('./components/problem')
const submissionRouter=require('./components/submission')

router.use('/auth',authRouter)
router.use('/problems',problemRouter)
router.use('/submission',submissionRouter)


module.exports=router