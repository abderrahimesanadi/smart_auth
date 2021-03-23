const axios = require('axios');
const router = require('express').Router();

const auth = require('./auth');
const tag = require('./tag');
const article = require('./article');

router.use('/api/tags', tag);
router.use('/api/auth', auth);
router.use('/api/article', article);

const ldConfig ={
    headers: {
        'Content-Type': 'ld+json'
    }
}



module.exports = router;
