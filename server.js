const express = require('express');
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt-nodejs');
const cors = require('cors');
const knex = require('knex');
const ContentBasedRecommender = require('content-based-recommender')

const recommender = new ContentBasedRecommender({
  minScore: 0.0,
  maxSimilarDocuments: 152,
  debug: true
});

const db = knex({
    client: 'pg',
    connection: {
        host: '127.0.0.1',
        user: 'postgres',
        password: 'test',
        database: 'thesis-project'
    }
});

const trainRecommender = () => {
    db.select('id','title as content').from('files2').then(data => {
        // console.log(data);
        recommender.train(data)
        const temp = recommender.getSimilarDocuments("49",0,5);    
        console.log(temp)
    })
}

db.select('*').from('users').then(data => {
    // console.log(data);
});

const app = express();

app.use(bodyParser.json())
app.use(cors())



app.get('/', (req, res) => {
    // res.send(database.users)
})

app.post('/signin', (req, res) => {
    db.select('email', 'hash').from('login')
        .where('email', '=', req.body.email)
        .then(data => {
            const isValid = bcrypt.compareSync(req.body.password, data[0].hash);
            if(isValid) {
                return db.select('*').from('users').where('email', '=', req.body.email)
                .then(user => {
                    res.json(user[0])
                })
                .catch(err => res.status(400).json("Unable to get user"))
            }
            else {
                res.status(400).json("Wrong credentials")
            }
        })
        .catch(err => res.status(400).json("Unable to get credentials"))
})

app.post('/register', (req, res) => {
    const {email, name, password} = req.body;
    const hash = bcrypt.hashSync(password);
        db.transaction(trx => {
            trx.insert({
                hash: hash,
                email: email
            }).into('login')
            .returning('email')
            .then(loginEmail => {
                return trx('users')
                .returning('*')
                .insert({
                email: loginEmail[0],
                name: name,
                joined: new Date()
            })
            .then(user => {
                res.json(user[0]);
            })
            .catch(err => res.status(400).json(err))
            })
            .then(trx.commit)
            .catch(trx.rollback)
        })
        .catch(err => res.status(400).json("Unable to register"))
        
})

app.get('/profile/:id', (req, res) => {
    const {id} = req.params;
    db.select('*').from('users').where({
        id: id
    }).then(user => {
        if(user.length) {
            res.json(user[0])
        }
        else {
            res.status(400).json('User not found')
        }
    }).catch(err => res.status(400).json('Error getting user'))
})

app.get('/repository', (req, res) => {
    db.select('*').from('files2').then(data => {
        res.json(data)
        console.log(data)
    })    
})

app.get('/repository/:id', (req, res) => {
    const {id} = req.params;
    db.select('*').from('files2').where({
        id: id
    }).then(thesis => {
        if(thesis.length) {
            res.json(thesis[0])
        }
        else {
            res.status(400).json('Thesis not found')
        }
    }).catch(err => res.status(400).json('Error getting thesis'))
})

// app.get('/repository/:id', (req,res) => {
//     const id = req.params.id;
//     const similarDocuments = recommender.getSimilarDocuments(id, 0, 5);
//     res.json(similarDocuments);
// })

trainRecommender();

app.listen(3001,() => {
    console.log('app is running on port 3001');
})

/*
/ --> res = this is working
/signin --> POST = success/fail
/register --> POST = user
/profile/:userId --> GET = user
*/