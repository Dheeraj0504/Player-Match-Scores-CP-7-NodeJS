const express = require('express');
const path = require('path');

const {open} = require('sqlite');
const sqlite3 = require('sqlite3');

const dbPath = path.join(__dirname, 'cricketMatchDetails.db');
const app = express();
app.use(express.json());

let database = null;

const initilizeDbAndServer = async () => {
  try {
    database = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log('Server Running at http://localhost:3000/');
    });
  } catch (error) {
    console.log(`DB Error: ${error.message}`);
    process.exit(1);
  }
};
initilizeDbAndServer();

//Player Details Table
const convertPlayerDbObjectToResponseObject = dbObject => {
  return {
    playerId: dbObject.player_id,
    playerName: dbObject.player_name,
  }
};

//Match Details Table
const convertMatchDetailsDbObjectToResponseObject = dbObject => {
  return {
    matchId: dbObject.match_id,
    match: dbObject.match,
    year: dbObject.year,
  }
};

//Player Match Score Table
const convertPlayerMatchScoreDbObjectToResponseObject = dbObject => {
  return {
    playerMatchId: dbObject.player_match_id,
    playerId: dbObject.player_id,
    matchId: dbObject.match_id,
    score: dbObject.score,
    fours: dbObject.fours,
    sixes: dbObject.sixes,
  }
};

//API 1:Returns a list of all the players in the player table
app.get('/players/', async (request, response) => {
  const getPlayersQuery = `
    SELECT 
      *
    FROM
      player_details;
  `;
  const playersArray = await database.all(getPlayersQuery);
  response.send(
    playersArray.map(eachPlayer =>
      convertPlayerDbObjectToResponseObject(eachPlayer),
    ),
  );
});

//API 2:Returns a specific player based on the player ID
app.get('/players/:playerId/', async (request, response) => {
  const {playerId} = request.params;
  //console.log(playerId);
  const getPlayerQuery = `
    SELECT 
      *
    FROM 
      player_details
    WHERE
      player_id = ${playerId};
  `;
  const player = await database.get(getPlayerQuery);
  response.send(convertPlayerDbObjectToResponseObject(player));
});

//API 3:Updates the details of a specific player based on the player ID
app.put('/players/:playerId/', async (request, response) => {
  const {playerId} = request.params;
  const {playerName} = request.body;
  const updatePlayerQuery = `
    UPDATE
      player_details
    SET
      player_name = '${playerName}'
    WHERE
      player_id = ${playerId};
  `;
  const updatedPlayer = await database.run(updatePlayerQuery);
  //console.log(updatedPlayer);
  response.send('Player Details Updated');
});

//API 4:Returns the match details of a specific match
app.get('/matches/:matchId/', async (request, response) => {
  const {matchId} = request.params;
  //console.log(matchId);
  const getMatchDetailsQuery = `
    SELECT 
      *
    FROM
      match_details
    WHERE
      match_id = ${matchId};
  `;
  const matchDetails = await database.get(getMatchDetailsQuery);
  response.send(convertMatchDetailsDbObjectToResponseObject(matchDetails));
});

//API 5:Returns a list of all the matches of a player
app.get('/players/:playerId/matches', async (request, response) => {
  const {playerId} = request.params;
  const getPlayerMatchesQuery = `
    SELECT
      *
    FROM
      player_match_score
    NATURAL JOIN
      match_details
    WHERE 
      player_id = ${playerId};
  `;
  const playerMatches = await database.all(getPlayerMatchesQuery);
  response.send(
    playerMatches.map(eachMatch =>
      convertMatchDetailsDbObjectToResponseObject(eachMatch),
    ),
  );
});

//API 6:Returns a list of players of a specific match
app.get('/matches/:matchId/players', async (request, response) => {
  const {matchId} = request.params;
  const getMatchPlayersQuery = `
    SELECT
      *
    FROM
      player_match_score
    NATURAL JOIN
      player_details
    WHERE 
      match_id = ${matchId};
  `;
  const playersArray = await database.all(getMatchPlayersQuery);
  response.send(
    playersArray.map(eachPlayer =>
      convertPlayerDbObjectToResponseObject(eachPlayer),
    ),
  );
});

//API 7:Returns the statistics of the total score, fours, sixes of a specific player based on the player ID
app.get('/players/:playerId/playerScores', async (request, response) => {
  const {playerId} = request.params;
  const getMatchStaticsPlayersQuery = `
    SELECT 
      player_id AS playerId,
      player_name AS playerName,
      SUM(score) AS totalScore,
      SUM(fours) AS totalFours,
      SUM(sixes) AS totalSixes
    FROM
      player_match_score
    NATURAL JOIN
      player_details
    WHERE 
      player_id = ${playerId};
  `;
  const playersMatchDetails = await database.get(getMatchStaticsPlayersQuery);
  response.send(playersMatchDetails);
});

// Returns a list of all the matches in the match details table
app.get('/matches/', async (request, response) => {
  const getAllMatchDetailsQuery = `
    SELECT 
      *
    FROM
      match_details;
  `;
  const allMatchDetails = await database.all(getAllMatchDetailsQuery);
  response.send(
    allMatchDetails.map(eachMatch =>
      convertMatchDetailsDbObjectToResponseObject(eachMatch),
    ),
  );
});

// Returns a list of all the Player Matches in the Player Match Score table
app.get('/players/matches/scores/', async (request, response) => {
  const getAllPlayerMatchesQuery = `
    SELECT 
      *
    FROM
      player_match_score;
  `;
  const allPlayerDetails = await database.all(getAllPlayerMatchesQuery);
  response.send(
    allPlayerDetails.map(eachPlayer =>
      convertPlayerMatchScoreDbObjectToResponseObject(eachPlayer),
    ),
  );
});

module.exports = app;
