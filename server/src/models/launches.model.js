const launchesDatabase = require("./launches.mongo");

const launches = new Map();

let latesFlighNumber = 100;

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
saveLaunch(launch);

async function getAllLaunches() {
  return await launchesDatabase.find({},{"_id": 0,"__v": 0,});
}

async function saveLaunch(launch) {
  console.log("akira launch", launch);
  try {
    await launchesDatabase.updateOne(
      {
        flightNumber: launch.flightNumber,
      },
      {
        ...launch,
      },
      {
        upsert: true,
      },
    );
  } catch (error) {
    console.log("Could not save launch");
  }
}

function addNewLaunch(launch) {
  latesFlighNumber++;
  launches.set(
    latesFlighNumber,
    Object.assign(launch, {
      flightNumber: latesFlighNumber,
      customers: ["ZTM", "NASA"],
      upcoming: true,
      success: true,
    }),
  );
}

function abortLaunch(launchId) {
  const aborted = launches.get(launchId);
  aborted.upcoming = false;
  aborted.success = false;
  return aborted;
}

function launchExists(launchId) {
  return launches.has(launchId);
}

module.exports = {
  launches,
  getAllLaunches,
  addNewLaunch,
  launchExists,
  abortLaunch,
};
