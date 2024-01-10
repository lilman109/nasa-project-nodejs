const launchesDatabase = require("./launches.mongo");
const planetsDatabase = require("./planets.mongo");

const filteredProperties = require("../constants/mongodbFiltered");

const DEFAULT_FLIGHT_NUMBER = 100;

const launches = new Map();

const launch = {
  flightNumber: 100,
  mission: "Kepler Exploration X",
  rocket: "Explorer IS1",
  launchDate: new Date("December 27, 2030"),
  target: "Kepler-442 b",
  customers: ["ZTM", "NASA"],
  upcoming: true,
  success: true,
};

/* launches.set(launch.flightNumber, launch); */
/* async function populateLaunches() { */
/*   await saveLaunch(launch); */
/* } */

async function getAllLaunches() {
  return await launchesDatabase.find({}, filteredProperties);
}

async function getLatestFlightNumber() {
  const latestLaunch = await launchesDatabase.findOne().sort("-flightNumber");

  if (!latestLaunch) {
    return DEFAULT_FLIGHT_NUMBER;
  }
  return latestLaunch.flightNumber;
}

async function saveLaunch(launch) {
  const planet = await planetsDatabase.findOne({
    keplerName: launch.target,
  });

  if (!planet) {
    throw new Error("No matching planet found");
  }

  try {
    await launchesDatabase.findOneAndUpdate(
      {
        flightNumber: launch.flightNumber,
      },
      launch,
      {
        upsert: true,
      },
    );
  } catch (error) {
    console.log("Could not save launch");
  }
}

async function scheduleNewLaunch(launch) {
  const newFlightNumber = (await getLatestFlightNumber()) + 1;
  const newLaunch = {
    ...launch,
    success: true,
    upcoming: true,
    customers: ["ZTM", "NASA"],
    flightNumber: newFlightNumber,
  };

  await saveLaunch(newLaunch);
}

/* function addNewLaunch(launch) { */
/*   latesFlighNumber++; */
/*   launches.set( */
/*     latesFlighNumber, */
/*     Object.assign(launch, { */
/*       flightNumber: latesFlighNumber, */
/*       customers: ["ZTM", "NASA"], */
/*       upcoming: true, */
/*       success: true, */
/*     }), */
/*   ); */
/* } */

async function abortLaunch(launchId) {
  const flightToAbort = await launchesDatabase.updateOne(
    {
      flightNumber: launchId,
    },
    {
      upcoming: false,
      success: false,
    },
  );

  return flightToAbort.modifiedCount === 1;
}

/* function abortLaunch(launchId) { */
/*   const aborted = launches.get(launchId); */
/*   aborted.upcoming = false; */
/*   aborted.success = false; */
/*   return aborted; */
/* } */

async function launchExists(launchId) {
  const exists = await launchesDatabase.findOne({ flightNumber: launchId });
  if (!exists) {
    console.log("does not exist");
  }
  return exists;
}

module.exports = {
  /* addNewLaunch, */
  launches,
  getAllLaunches,
  launchExists,
  abortLaunch,
  scheduleNewLaunch,
};
