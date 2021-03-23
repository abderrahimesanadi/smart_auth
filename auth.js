const router = require('express').Router();
const bcrypt = require('bcrypt');
const axios = require('axios');
const jwt = require('jsonwebtoken');
const fs = require('fs');
const RSA_KEY_PRIVATE = fs.readFileSync('./rsa/key');


router.post('/signin',(req,res)=> {

    console.log('/signin');
    axios.get('http://localhost:8082/api/users?email='+req.body.email)
        .then(res_http => {

            if (res_http.data['hydra:totalItems'] === 1) {
                const user = res_http.data['hydra:member'][0];
                console.log(user);
                if (bcrypt.compareSync(req.body.password, user.password)) {

                    const token = jwt.sign({}, RSA_KEY_PRIVATE, {
                        algorithm: 'RS256',
                        subject: user.id.toString()
                    });

                    res.status(200).json(
                        {
                            token: token,
                            idUser: user.id,
                            sessionUsername: user.username,
                            role: user.role
                        });

                } else {
                    res.status(200).json({'status' : 3});
                }
            }
        })
        .catch(error => {
            res.status(200).json({'status':1});

        })
})


/**
 * Route de connexion : Param post attendus : email, username, password, confirmPassword
 */
router.post('/signup',(req,res)=> {

    if (req.body.confirmPassword === req.body.password && req.body.email && req.body.username) {

        const userApi = {
            email: req.body.email,
            username: req.body.username,
            password: bcrypt.hashSync(req.body.password, bcrypt.genSaltSync(8)),
            role: 'standard'
        };


        axios.post('http://localhost:8082/api/users', userApi)
            .then(res_http => {
                res.status(200).json(
                    {
                        'username':req.body.username,
                        'email':req.body.email
                    }
                );
            })
            .catch(error => {
                res.status(200).json({'status':1});
            });
    } else {

        res.status(200).json(
            {
                'status': 3
            }
        );
    }



})

module.exports = router;
