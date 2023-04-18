const express = require("express");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const path = require("path");

const app = express();
app.use(express.json());
const dbPath = path.join(__dirname, "covid19India.db");

let db = null;
const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () =>
      console.log("Server Running at http://localhost:3000/")
    );
  } catch (e) {
    console.log(`DB Error ${e.message}`);
    process.exit(1);
  }
};

initializeDBAndServer();

const convertDbObjectToServerObject = (dbObject) => {
  return {
    stateId: dbObject.state_id,
    stateName: dbObject.state_name,
    population: dbObject.population,
  };
};

const convertToDistrictObject = (dbDistrict) => {
  return {
    districtId: dbDistrict.district_id,
    districtName: dbDistrict.district_name,
    stateId: dbDistrict.state_id,
    cases: dbDistrict.cases,
    cured: dbDistrict.cured,
    active: dbDistrict.active,
    deaths: dbDistrict.deaths,
  };
};
app.get("/states/", async (request, response) => {
  const getStateQuery = `
    SELECT 
    * 
    FROM
    state;`;
  const statesArray = await db.all(getStateQuery);
  response.send(
    statesArray.map((eachState) => convertDbObjectToServerObject(eachState))
  );
});

app.get("/states/:stateId/", async (request, response) => {
  const { stateId } = request.params;
  const getStateIdQuery = `
    SELECT
    * 
    FROM
    state
    WHERE 
    state_id = ${stateId};`;
  const stateIdArray = await db.get(getStateIdQuery);
  response.send(convertDbObjectToServerObject(stateIdArray));
});
// APT 3
app.post("/districts/", async (request, response) => {
  const { stateId, districtName, cases, cured, active, deaths } = request.body;
  const CreateDistrictQuery = `
    INSERT INTO
    district (state_id,district_name,cases,cured,active,deaths)
    VALUES
    (${stateId},'${districtName}',${cases},${cured},${active},${deaths});`;
  await db.run(CreateDistrictQuery);
  response.send("District Successfully Added");
});

//API 4
app.get("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const getDistrictIds = `
SELECT
* 
FROM 
district 
WHERE district_id = ${districtId};`;
  const districtArray = await db.run(getDistrictIds);
  response.send(convertToDistrictObject(districtArray));
});

//API 5

app.delete("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const deleteQuery = `
    DELETE 
    FROM 
    district 
    WHERE district_id = ${districtId};`;
  await db.run(deleteQuery);
  response.send("District Removed");
});

//API 6
app.put("/districts/:districtId/", async (request, response) => {
  const { districtName, stateId, cases, cured, active, deaths } = request.body;
  const { districtId } = request.params;
  const updateDistrictQuery = `
    UPDATE district
    SET 
    district_name = '${districtName}',
    state_id = ${stateId},
    cases = ${cases},
    cured = ${cured},
    active = ${active},
    deaths = ${deaths}
    WHERE district_id = ${districtId};
    `;
  await db.run(updateDistrictQuery);
  response.send("District Details Updated");
});

app.get("/states/:stateId/stats/", async (request, response) => {
  const { stateId } = request.body;

  const totalCountQuery = `
    SELECT 
    SUM(cases),
    SUM(cured),
    SUM(active),
    SUM(deaths)
    FROM 
    district
    WHERE
    state_id = ${stateId};`;
  const stats = await db.get(totalCountQuery);
  response.send({
    totalCases: stats["SUM(cases"],
    totalCured: stats["SUM(cured)"],
    totalActive: stats["SUM(active)"],
    totalDeaths: stats["SUM(deaths)"],
  });
});

//API 8
app.get("/districts/:districtId/details/", async (request, response) => {
  const { districtId } = request.params;
  const getDistrictQuery = `
   SELECT 
   state_id
   FROM 
   district
   WHERE district_id = ${districtId};`;
  const districtIdArray = await db.get(getDistrictQuery);
  const getStateNameQuery = `
   SELECT state_name AS stateName
   FROM 
   state
   WHERE state_id = ${districtIdArray.state_id};`;
  const getStateNameArray = await db.get(getStateNameQuery);
  response.send(getStateNameArray);
});

module.exports = app;
