const router = require('express').Router();

const fs = require('fs');
const isLogged = require('./isLogged');
const axios = require('axios');


const ldConfig ={
    headers: {
        'Content-Type': 'ld+json'
    }
}


router.get('/getArticle', isLogged, (req, res) => {

    axios.get('http://localhost:8082/api/articles/' + req.query.idArticle, ldConfig).then(res_http => {

        const apiArticle = res_http.data;

        delete apiArticle['@context'];
        delete apiArticle['@id'];
        delete apiArticle['@type'];
        apiArticle['Tag'] = apiArticle['Tag'].map(t=>t.split('tags/')[1]);

        if (req.user.role === "admin" || apiArticle.user['@id'] === req.user['@id'] || !apiArticle['draft']) {
            apiArticle.isEditable = req.user.role === "admin" || apiArticle.user['@id'] === req.user['@id'];
            res.status(200).json(apiArticle);
        } else {
            res.status(200).json({'status': 4});
        }

    }).catch((error) => {
        res.status(200).json({'status': 5});

    })
})




/**
 * Route de reherche d'articles : Paramètres Post attendus : query, searchedTags
 */
router.post('/searchArticles', isLogged, (req, res) => {

    const query = req.body.query;
    console.log(query);
    let searchTags = req.body.searchedTags;
    console.log("##################searchTags######################");
    console.log(searchTags);

    let paginationNumber = 1;

    if (req.body.pageNumber) {
        paginationNumber = req.body.pageNumber;
    }

    var searchTagQuery = '';

    if (searchTags.length > 0) {

        searchTags.forEach((tag, k) => {
            searchTagQuery += (k ? '&' : '') + 'Tag.id[]=' + tag;
        })

    }

    console.log("###############queryText#########################");
    const queryText = query ? '&content=' + query + '&name=' + query : '';
    console.log(queryText);

    searchTagQuery = (queryText ? '&':'') + searchTagQuery;
    console.log("###############searchTagQuery#########################");
    console.log(searchTagQuery);

    axios.get('http://localhost:8082/api/articles?page='+ paginationNumber + queryText + searchTagQuery).then(res_http => {

        const articles = res_http.data['hydra:member'];
        console.log("res_http.data");
        let nextPage = 'end';

        if (res_http.data['hydra:view']['hydra:next']) {
            nextPage = parseInt(res_http.data['hydra:view']['hydra:next'].split('page=')[1]);
        } else {
            nextPage = "end";
        }

        const totalResults = res_http.data['hydra:totalItems'];

        res.status(200).json(
            {
                articles: articles,
                nextPage: nextPage,
                totalResults: totalResults
            });

    }).catch(error => {
        console.log(error);
        res.status(200).json({'status':1});

    })
})


/**
 * Route d'ajout d'un article : Paramètres Post attendus : name, content, draft, tags
 */
router.post('/addArticle', isLogged, (req, res) => {

    const articleApi = {
        name: req.body.name,
        content: req.body.content,
        draft: req.body.draft,
        user: req.user['@id'],
        Tag: req.body.tags.map(t=>'/api/tags/'+t)
    };

    axios.post('http://localhost:8082/api/articles', articleApi)
        .then(res_http => {

            const apiArticle = res_http.data;

            delete apiArticle['@context'];
            delete apiArticle['@id'];
            delete apiArticle['@type'];

            apiArticle['Tag'] = apiArticle['Tag'].map(t=>t.split('tags/')[1]);
            apiArticle.isEditable = true;

            res.status(200).json(apiArticle);


        })
        .catch(error => {
            res.status(200).json({'status':1});
        });

})


/**
 * Route de mise à jour d'un article : Paramètres Post attendus : id, name, content, draft, tags
 */
router.post('/updateArticle', isLogged, (req, res) => {

    axios.get('http://localhost:8082/api/articles/' + req.body.id, ldConfig).then(res_http => {

        const apiArticle = res_http.data;

        // Sécurité coté serveur additionnelle.
        
        if (apiArticle.user['@id'] === req.user['@id'] || req.user['role'] === "admin") {

            const upadatesApi = {
                name: req.body.name,
                content: req.body.content,
                draft: req.body.draft,
                Tag: req.body.tags.map(t => '/api/tags/' + t)
            };

            axios.patch('http://localhost:8082/api/articles/' + req.body.id, upadatesApi, {
                headers: {
                    'Content-Type': 'application/merge-patch+json'
                }
            })
                .then(res_http => {

                    const apiArticle = res_http.data;

                    delete apiArticle['@context'];
                    delete apiArticle['@id'];
                    delete apiArticle['@type'];

                    apiArticle['Tag'] = apiArticle['Tag'].map(t => t.split('tags/')[1]);

                    apiArticle.isEditable = req.user.role === "admin" || apiArticle.user['@id'] === req.user['@id'];

                    res.status(200).json(apiArticle);

                })
                .catch(error => {
                    res.status(200).json({'status': 1});
                });

        } else {
            res.status(200).json({'status':2});
        }


    }).catch(error => {
        res.status(200).json({'status': 1});

    })

})



/**
 * Route de mise à jour d'un article : Paramètres Post attendus : id
 */
router.post('/deleteArticle', isLogged, (req, res) => {

    axios.get('http://localhost:8082/api/articles/' + req.body.id, ldConfig).then(res_http => {

        const apiArticle = res_http.data;

        // Sécurité coté serveur additionnelle. Seul l'auteur de l'article peut le supprimer

        if (apiArticle.user['@id'] === req.user['@id']) {

            axios.delete('http://localhost:8082/api/articles/' + req.body.id)
                .then(res_http => {

                    res.status(200).json({status:0});

                })
                .catch(error => {
                    res.status(200).json({'status': 1});
                });

        } else {
            res.status(200).json({'status':2});
        }

    }).catch(error => {
        res.status(200).json({'status': 1});

    })

})



/**
 * Route de mise à jour d'un article : Aucun paramètre Get demandé
 */
router.get('/getTags', isLogged, (req, res) => {

    axios.get('http://localhost:8082/api/tags', ldConfig).then(res_http => {

        const apiTag = res_http.data['hydra:member'];
        delete apiTag['@context'];
        delete apiTag['@id'];
        delete apiTag['@type'];

        res.status(200).json(apiTag);

    }).catch(error => {
        res.status(200).json({'status':1});

    })
})


/**
 * Route d'ajout de commentaire : Paramètre Post demandé : idArticle
 */
router.post('/addComment', isLogged, (req, res) => {

    const commentApi = {
        content: req.body.text,
        article: '/api/articles/' + req.body.idArticle,
        user: req.user['@id']
    };

    axios.post('http://localhost:8082/api/comments', commentApi)
        .then(res_http => {

            const apiComment = res_http.data;
            delete apiComment['@context'];
            delete apiComment['@id'];
            delete apiComment['@type'];

            res.status(200).json(apiComment);

        })
        .catch(error => {
            res.status(200).json({'status':1});
        });

})



/**
 * Route d'ajout d'une réaction' : Paramètre Post demandé : idArticle, type
 */
router.post('/addReaction', isLogged, (req, res) => {

    const reactionApi = {
        type: req.body.type,
        article: '/api/articles/' + req.body.idArticle,
        user: req.user['@id']
    };

    axios.post('http://localhost:8082/api/reactions', reactionApi)
        .then(res_http => {

            const apiReaction = res_http.data;
            delete apiReaction['@context'];
            delete apiReaction['@id'];
            delete apiReaction['@type'];

            res.status(200).json(apiReaction);

        })
        .catch(error => {
            res.status(200).json({'status':1});
        });

})



/**
 * Route de mise à jour d'un article : Paramètres Post attendus : id (de la réaction)
 */
router.post('/removeReaction', isLogged, (req, res) => {

    axios.get('http://localhost:8082/api/reactions/' + req.body.id).then(res_http => {
        const apiReaction = res_http.data;

        // Sécurité additionnelle :
        // On vérifie que le détenteur de la réaction est bien le user connecté

        if (apiReaction['user'] === req.user['@id']) {

            axios.delete('http://localhost:8082/api/reactions/' + req.body.id).then(res_http => {

                res.status(200).json({'status': 0});

            }).catch(error => {

                res.status(200).json({'status': 1});
            });
        } else {
            res.status(200).json({'status': 2});
        }

    }).catch(error => {

        res.status(200).json({'status': 1});
    });


})


module.exports = router;
