const { parse } = require("csv-parse");
const fs = require("fs");
const path = require("path");

const planetsDatabase = require("./planets.mongo");

const habitablePlanets = [];

const isHabitablePlanet = (planet) => {
  return (
    planet["koi_disposition"] === "CONFIRMED" &&
    planet["koi_insol"] > 0.36 &&
    planet["koi_insol"] < 1.11 &&
    planet["koi_prad"] < 1.6
  );
};

function loadPlanetsData() {
  return new Promise((resolve, reject) => {
    fs.createReadStream(
      path.join(__dirname, "..", "..", "data", "kepler_data.csv"),
    )
      .pipe(
        parse({
          comment: "#", // # is the comment character in the file
          columns: true, //
        }),
      )
      .on("data", async (data) => {
        if (isHabitablePlanet(data)) {
          await savePlanets(data);
        }
      })
      .on("error", (err) => {
        console.log("error");
        reject(err);
      })
      .on("end", async () => {
        /* console.log( */
        /*   habitablePlanets.map((planet) => { */
        /*     return planet["kepler_name"]; */
        /*   }), */
        /* ); */
        const countPlanetsFound = (await getAllPlanets()).length;
        console.log(`Found ${countPlanetsFound} habitable planets.`);
        resolve();
      });
  });
}

async function getAllPlanets() {
  return await planetsDatabase.find({});
}

// upserts only inserts if data is not already in data
async function savePlanets(planet) {
  try {
    await planetsDatabase.updateOne(
      {
        keplerName: planet.kepler_name,
      },
      {
        keplerName: planet.kepler_name,
      },
      {
        upsert: true,
      },
    );
  } catch (err) {
    console.log(`Could not save plane ${planet}`);
  }
}

module.exports = {
  loadPlanetsData,
  getAllPlanets,
};
