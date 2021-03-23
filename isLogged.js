const isLogged = function (req, res, next) {

    const token = req.headers.authorization;
    const fs = require('fs');
    const RSA_PUBLIC_KEY = fs.readFileSync('./rsa/key.pub');
    const jwt = require('jsonwebtoken');
    const axios = require('axios');

    if (token) {
        jwt.verify(token, RSA_PUBLIC_KEY, (err, decoded) => {
            if (err) {
                return res.status(200).json({'status':2});
            } else {

                const idDecoded = decoded.sub;
                axios.get('http://localhost:8082/api/users/' + idDecoded)
                    .then(res_http => {

                        if (res_http.data['id'] > 0) {
                            req.user = res_http.data;
                            next();
                        } else {
                            return res.status(401).json({'status':2});
                        }

                    })
                    .catch(error => {
                        return res.status(401).json({'status':1});
                    })

            }

        })
    }
}

module.exports = isLogged;
