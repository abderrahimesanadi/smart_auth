const router = require('express').Router();
const axios = require('axios');

const ldConfig ={
    headers: {
        'Content-Type': 'ld+json'
    }
}

router.get('/',  (req, res) => {

    axios.get('http://localhost:8082/api/tags/', ldConfig).then(res_http => {

        const tags = res_http.data['hydra:member'];
        res.status(200).json(tags);

    }).catch((error) => {
        res.status(200).json({'status': 5});

    })
})

module.exports = router;
