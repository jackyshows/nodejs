var SpotifyWebApi = require('spotify-web-api-node');

var scopes = ['user-top-read user-follow-read'],
    redirectUri = 'http://localhost:4200/home',
    clientId = '51f4e4780c7749e08cd5dce2801e2041',
    state = 'some-state-of-my-choice',
    showDialog = true,
    responseType = 'token';

var spotifyApi = new SpotifyWebApi({
  redirectUri: redirectUri,
  clientId: clientId
});

global.correctAnswers = {
  1: '',
  2: '',
  3: '',
  4: ''
}

require("dotenv").config();
const http = require("http");
const axios = require("axios");
const cors = require("cors");

const express = require("express");
const app = express();
const router = express.Router();

app.use(cors());

router.get("/authorize", (req, res, next) => {
  var authorizeURL = spotifyApi.createAuthorizeURL(
      scopes,
      state,
      showDialog,
      responseType
  );

  return res.status(200).send({ redirectUri: authorizeURL })
});

router.get("/domanda/:numeroDomanda", hasAccessToken, (req, res, next) => {
  const numeroDomanda = req.params['numeroDomanda'];

  if (numeroDomanda === '1') {
    spotifyApi.getMyTopArtists({ limit: 4, time_range: 'long_term' })
      .then(function(data) {
        let topArtists = data.body.items;

        global.correctAnswers[numeroDomanda] = { label: topArtists[0].name };
        const shuffledArtist = shuffle(topArtists);
        const answers = [];

        shuffledArtist.forEach((artist) => {
          answers.push({
            label: artist.name,
            // correct: artist.name === topArtist.label,
          });
        });

        res.status(200).send({ answers });
      }, function(err) {
        console.log('Something went wrong!', err);
        res.status(400).send({ error: 'Non è stato possibile recuperare la domanda!' })
      }
    );
  }

  if (numeroDomanda === '2') {
    spotifyApi.getMyTopTracks({ limit: 4, time_range: 'long_term' })
        .then(function(data) {
              let topTracks = data.body.items;

              global.correctAnswers[numeroDomanda] = { label: topTracks[0].name };
              const shuffledTracks = shuffle(topTracks);
              const answers = [];

              shuffledTracks.forEach((artist) => {
                answers.push({
                  label: artist.name,
                  // correct: artist.name === topArtist.label,
                });
              });

              res.status(200).send({ answers });
            }, function(err) {
              console.log('Something went wrong!', err);
              res.status(400).send({ error: 'Non è stato possibile recuperare la domanda!' })
            }
        );
  }
})

router.get("/answer/:numeroDomanda/:answer", hasAccessToken, (req, res, next) => {
  const numeroDomanda = req.params['numeroDomanda'];
  const answer = req.params['answer'];

  return res.send({ isCorrect: global.correctAnswers[parseInt(numeroDomanda)].label === answer })
})

router.get("/top/artisti", hasAccessToken, (req, res, next) => {
  const config = {
    headers: {
      Authorization: `Bearer ${getAccessToken(req)}`,
    },
  };

  fetch(
    "https://api.spotify.com/v1/me/top/artists?limit=4&time_range=long_term",
    {
      method: "GET",
      headers: {
        authorization: `Bearer ${getAccessToken(req)}`,
      },
    }
  ).then(async (response) => {
    const r = await response.json();
    const artisti = r.items;

    const topArtist = { label: artisti[0].name };
    const shuffledArtist = shuffle(artisti);
    const answers = [];

    shuffledArtist.forEach((artist) => {
      answers.push({
        label: artist.name,
        correct: artist.name === topArtist.label,
      });
    });

    res.send({ topArtist, answers });
  });
});

router.get("/top/brani", hasAccessToken, (req, res, next) => {
  const config = {
    headers: {
      Authorization: `Bearer ${getAccessToken(req)}`,
    },
  };

  fetch(
    "https://api.spotify.com/v1/me/top/tracks?limit=4&time_range=long_term",
    {
      method: "GET",
      headers: {
        authorization: `Bearer ${getAccessToken(req)}`,
      },
    }
  ).then(async (response) => {
    const r = await response.json();
    const artisti = r.items;

    const topTrack = { label: artisti[0].name };
    const shuffledArtist = shuffle(artisti);
    const answers = [];

    shuffledArtist.forEach((artist) => {
      answers.push({
        label: artist.name,
        correct: artist.name === topTrack.label,
      });
    });

    res.send({ topTrack, answers });
  });
});

app.use("/api", router);

function hasAccessToken(req, res, next) {
  const token = getAccessToken(req);

  if (token) {
    spotifyApi.setAccessToken(token);
    next();
  } else {
    res.send("Unauthorized! You must have a valid access_token!");
  }
}

function getAccessToken(req) {
  var header = req.headers.authorization || "";
  return header.split(/\s+/).pop() || "";
}

function shuffle(arrParam) {
  let arr = arrParam.slice(),
    length = arr.length,
    temp,
    i;

  while (length) {
    i = Math.floor(Math.random() * length--);

    temp = arr[length];
    arr[length] = arr[i];
    arr[i] = temp;
  }

  return arr;
}

const server = http.createServer(app);

server.listen(8080, () => {
  console.log("Server is listening on port 8080");
});
