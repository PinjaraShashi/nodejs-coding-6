const express = require("express");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const path = require("path");
const app = express();
app.use(express.json());

const dbPath = path.join(__dirname, "covid19India.db");

let db = null;
const initializeDbAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(6000, () => {
      console.log("server is running at http://localhost:6000/");
    });
  } catch (e) {
    console.log(`db error is ${e.message}`);
    process.exit(1);
  }
};

initializeDbAndServer();

// 1. GET ALL STATES

app.get("/states/", async (request, response) => {
  const getStateQuery = `
    SELECT
    state_id AS stateId,
    state_name AS stateName,
    population 
    FROM 
    state
    `;
  const getStateArray = await db.all(getStateQuery);
  response.send(getStateArray);
});

// 2. GET SINGLE STATE

app.get("/states/:stateId", async (request, response) => {
  const { stateId } = request.params;
  const getSIngleStateQuery = `
    SELECT 
    state_id AS stateId,
    state_name AS stateName,
    population
    FROM
    state
    WHERE
    state_id = ${stateId}
    `;
  const getSingleStateArray = await db.get(getSIngleStateQuery);
  response.send(getSingleStateArray);
});

// 3. CREATE A NEW DISTRICT

app.post("/districts/", async (request, response) => {
  const districtDetails = request.body;
  const {
    districtName,
    stateId,
    cases,
    cured,
    active,
    deaths,
  } = districtDetails;

  const addDistrictDetailsQuery = `
    INSERT INTO
    district (district_name,state_id,cases,cured,active,deaths)
    VALUES
    (
        '${districtName}',
        ${stateId},
        ${cases},
        ${cured},
        ${active},
        ${deaths}
    )
    `;
  const dbResponse = await db.run(addDistrictDetailsQuery);
  response.send("District Successfully Added");
});

//4. GET SINGLE DISTRICT

app.get("/districts/:districtId", async (request, response) => {
  const { districtId } = request.params;
  const getSingleDistrictQuery = `
    SELECT
    district_id AS districtId,
    district_name As districtName,
    state_id AS stateId,
    cases,
    cured,
    active,
    deaths
    FROM
    district
    WHERE
    district_id = ${districtId}
    `;
  const getSingleDistrictArray = db.get(getSingleDistrictQuery);
  response.send(getSingleDistrictArray);
});

// DELETE DISTRICT

app.delete("/districts/:districtId", async (request, response) => {
  const { districtId } = request.params;

  const deleteDistrictQuery = `
    DELETE FROM
    district
    WHERE
    district_id = ${districtId}
    `;
  await db.run(deleteDistrictQuery);
  response.send("District Removed");
});

//6. UPDATE DISTRICT DETAILS

app.put("/districts/:districtId", async (request, response) => {
  const { districtId } = request.params;
  const districtDetails = request.body;
  const {
    districtName,
    stateId,
    cases,
    cured,
    active,
    deaths,
  } = districtDetails;
  const updateDistrictQuery = `
    UPDATE
    district
    SET
    district_name = '${districtName}',
    state_id = ${stateId},
    cases = ${cases},
    cured = ${cured},
    active = ${active},
    deaths = ${deaths}
    WHERE
    district_id = ${districtId}
    `;
  await db.run(updateDistrictQuery);
  response.send("District Details Updated");
});

// 7. GET STATE

app.get("/states/:stateId/stats", async (request, response) => {
  const { stateId } = request.params;
  const getStateIdStatsQuery = `
    SELECT
    SUM(cases), 
    SUM(cured),
    SUM(active), 
    SUM(deaths)
    FROM
    district
    WHERE
    state_id = ${stateId}
    `;
  const stats = await db.get(getStateIdStatsQuery);
  console.log(stats);
  response.send({
    totalCases: stats["SUM(cases)"],
    totalCured: stats["SUM(cured)"],
    totalActive: stats["SUM(active)"],
    totalDeaths: stats["SUM(deaths)"],
  });
});

// 8.

app.get("/districts/:districtId/details", async (request, response) => {
  const { districtId } = request.params;
  const getStateNameQuery = `
    SELECT
    state_name AS stateName
    FROM
    district
    NATURAL JOIN
    state
    WHERE
    district_id = ${districtId}
    `;
  const getStateNameArray = await db.get(getStateNameQuery);
  response.send(getStateNameArray);
});

module.exports = app;