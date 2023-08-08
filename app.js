const express = require("express");
const path = require("path");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const app = express();
app.use(express.json());
const dbPath = path.join(__dirname, "cricketMatchDetails.db");
let db = null;

const initializeDbAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server Start at http://localhost:3000");
    });
  } catch (error) {
    console.log(`DB Error: ${error.message}`);
    process.exit(1);
  }
};

initializeDbAndServer();

const convertPlayerDbObjectToResponseObject = (db) => {
  return {
    playerId: db.player_id,
    playerName: db.player_name,
  };
};

const convertMatchDetailsDbObjectToResponseObject = (db) => {
  return {
    matchId: db.match_id,
    match: db.match,
    year: db.year,
  };
};

app.get("/players/", async (request, response) => {
  const getPlayersQuery = `
    SELECT
        *
    FROM 
        player_details;
    `;
  const playersArray = await db.all(getPlayersQuery);
  response.send(
    playersArray.map((eachPlayer) =>
      convertPlayerDbObjectToResponseObject(eachPlayer)
    )
  );
});

app.get("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const getPlayerQuery = `
    SELECT
       *
    FROM
       player_details
    WHERE 
       player_id = ${playerId};
    `;
  const player = await db.get(getPlayerQuery);
  response.send(convertPlayerDbObjectToResponseObject(player));
});

app.put("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const { playerName } = request.body;
  const updatePlayerQuery = `
    UPDATE
      player_details
    SET
     player_name = '${playerName}'
    WHERE
      player_id = ${playerId};
    `;
  await db.run(updatePlayerQuery);
  response.send("Player Details Updated");
});

app.get("/matches/:matchId/", async (request, response) => {
  const { matchId } = request.params;
  const matchDetailsQuery = `
    SELECT
       *
    FROM
       match_details
    WHERE 
       match_id = ${matchId};
    `;
  const matchDetails = await db.get(matchDetailsQuery);
  response.send(convertMatchDetailsDbObjectToResponseObject(matchDetails));
});

app.get("/players/:playerId/matches/", async (request, response) => {
  const { playerId } = request.params;
  const getPlayerMatchQuery = `
    SELECT
       *
    FROM
       player_match_score
         NATURAL JOIN match_details
    WHERE 
       player_id = ${playerId};
    `;
  const playerMatches = await db.all(getPlayerMatchQuery);
  response.send(
    playerMatches.map((eachMatch) =>
      convertMatchDetailsDbObjectToResponseObject(eachMatch)
    )
  );
});

app.get("/matches/:matchId/players", async (request, response) => {
  const { matchId } = request.params;
  const getMatchPlayerQuery = `
    SELECT
       *
    FROM
       player_match_score
        NATURAL JOIN player_details
    WHERE 
       match_id = ${matchId};
    `;
  const playersArray = await db.all(getMatchPlayerQuery);
  response.send(
    playersArray.map((eachPlayer) =>
      convertPlayerDbObjectToResponseObject(eachPlayer)
    )
  );
});

app.get("/players/:playerId/playerScores/", async (request, response) => {
  const { playerId } = request.params;
  const getmatchPlayerQuery = `
    SELECT
       player_id AS playerId,
       player_name AS playerName,
       SUM(score) AS totalScore,
       SUM(fours) AS totalFours,
       SUM(sixes) AS totalSixes
    FROM
       player_match_score
         NATURAL JOIN player_details
    WHERE 
       player_id = ${playerId};
    `;
  const playerMatchDetails = await db.get(getmatchPlayerQuery);
  response.send(playerMatchDetails);
});

module.exports = app;
