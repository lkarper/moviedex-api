require('dotenv').config();
const express = require('express');
const morgan = require('morgan');
const cors = require('cors');
const helmet = require('helmet');
const MOVIES = require('./MOVIES.json');

const app = express();

app.use(morgan('dev'));
app.use(helmet());
app.use(cors());

app.use(validateBearerToken);

function validateBearerToken(req, res, next) {
    const authToken = req.get('Authorization');
    const apiToken = process.env.API_TOKEN;

    if (!authToken || authToken.split(' ')[1] !== apiToken) {
        return res.status(401).json({ error: 'Unauthorized request' });
    }

    next();
}

app.get('/movie', handleGetMovies);

function handleGetMovies(req, res) {
    let error = false;
    Object.keys(req.query).forEach(query => {
        if (!['genre', 'country', 'avg_vote'].includes(query)) {
            error = true;
        }
    });

    if (error) {
        return res.status(400).json({ error: `Each query parameter must be one of: 'genre', 'country', or 'avg_vote'`});
    }

    const { genre = '', country = '', avg_vote = '' } = req.query;

    const movies = MOVIES;
    const foundMovies = [...movies];

    if (genre) {
        movies.forEach(movie => {
            if (movie.genre.toLowerCase().indexOf(genre.toLowerCase()) === -1) {
                const i = foundMovies.findIndex(mov => mov.filmtv_ID === movie.filmtv_ID);
                foundMovies.splice(i, 1);
            }
        });
    }

    if (country) {
        movies.forEach(movie => {
            if (movie.country.toLowerCase().indexOf(country.toLowerCase()) === -1) {
                const i = foundMovies.findIndex(mov => mov.filmtv_ID === movie.filmtv_ID);
                i !== -1 && foundMovies.splice(i, 1);
            }
        });
    }

    if (avg_vote) {
        const avgVoteNum = Number(avg_vote);

        if (isNaN(avgVoteNum)) {
            return res.status(400).json({ 'invalid request': 'avg_vote must contain a number (e.g. 5, 7.3)' });
        }

        movies.forEach(movie => {
            if (movie.avg_vote < avgVoteNum) {
                const i = foundMovies.findIndex(mov => mov.filmtv_ID === movie.filmtv_ID);
                i !== -1 && foundMovies.splice(i, 1);
            }
        });
    }

    if (!foundMovies.length) {
        return res.json({ results: 'Sorry, no results found within those parameters' });
    }

    return res.json(foundMovies);

}

app.listen(8000, () => {
    console.log('Server listening on port 8000');
});