const axios = require("axios");

const launchesDatabase = require("./launches.mongo");
const planetsDatabase = require("./planets.mongo");

const filteredProperties = require("../constants/mongodbFiltered");

const DEFAULT_FLIGHT_NUMBER = 100;

const launches = new Map();

/* const launch = { */
/*   flightNumber: 100, // flight_number */
/*   mission: "Kepler Exploration X", // name */
/*   rocket: "Explorer IS1", // rocket.name */
/*   launchDate: new Date("December 27, 2030"), // date_local */
/*   target: "Kepler-442 b", // not appliable */
/*   customers: ["ZTM", "NASA"], // payload.customers */
/*   upcoming: true, // upcoming */
/*   success: true, // success */
/* }; */

/* launches.set(launch.flightNumber, launch); */
/* async function populateLaunches() { */
/*   await saveLaunch(launch); */
/* } */

async function getAllLaunches(skip, limit) {
  return await launchesDatabase
    .find({}, filteredProperties)
    .sort({ flightNumber: 1 })
    .skip(skip)
    .limit(limit);
}

async function getLatestFlightNumber() {
  const latestLaunch = await launchesDatabase.findOne().sort("-flightNumber");

  if (!latestLaunch) {
    return DEFAULT_FLIGHT_NUMBER;
  }
  return latestLaunch.flightNumber;
}

const SPACEX_API_URL = "https://api.spacexdata.com/v4/launches/query";
async function populateLaunches() {
  console.log("Downloading spacex launch data");
  const res = await axios.post(SPACEX_API_URL, {
    query: {},
    options: {
      pagination: false,
      populate: [
        {
          path: "rocket",
          select: {
            name: 1,
          },
        },
        {
          path: "payloads",
          select: {
            customers: 1,
          },
        },
      ],
    },
  });

  if (res.status !== 200) {
    console.log("There was a problem downloading launch data");
    throw new Error("Launch data download failed");
  }

  const launchDocs = res.data.docs;

  for (const launchDoc of launchDocs) {
    const payloads = launchDoc["payloads"];
    const customers = payloads.flatMap((payload) => {
      return payload["customers"];
    });

    const launch = {
      flightNumber: launchDoc["flight_number"],
      mission: launchDoc["name"],
      rocket: launchDoc["rocket"]["name"],
      launchDate: launchDoc["date_local"],
      upcoming: launchDoc["upcoming"],
      success: launchDoc["success"],
      customers,
    };
    console.log(`${launch.flightNumber} ${launch.mission}`);

    await saveLaunch(launch);
  }
}

async function loadLaunchesData() {
  const firstLaunch = await findLaunch({
    flightNumber: 1,
    rocket: "Falcon 1",
    mission: "FalconSat",
  });

  if (firstLaunch) {
    console.log("first launch exists");
    return;
  } else {
    await populateLaunches();
  }
}

async function findLaunch(filter) {
  return await launchesDatabase.findOne(filter);
}

async function saveLaunch(launch) {
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
  const planet = await planetsDatabase.findOne({
    keplerName: launch.target,
  });

  console.log("planet", planet);

  if (!planet) {
    throw new Error("No matching planet found");
  }

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
  const exists = await findLaunch({ flightNumber: launchId });
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
  loadLaunchesData,
};
