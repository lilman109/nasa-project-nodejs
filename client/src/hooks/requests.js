const API_URL = "v1";

// Load planets and return as JSON.
async function httpGetPlanets() {
  const res = await fetch(`${API_URL}/planets`);
  return await res.json();
}

// Load launches, sort by flight number, and return as JSON.
async function httpGetLaunches() {
  console.log("http get launches");
  const res = await fetch(`${API_URL}/launches`);
  const fetchedLaunches = await res.json();
  return fetchedLaunches.sort((a, b) => {
    return a.flightNumber - b.flightNumber;
  });
}

// Submit given launch data to launch system.
async function httpSubmitLaunch(launch) {
  try {
    return await fetch(`${API_URL}/launches`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(launch),
    });
  } catch (error) {
    return {
      ok: false,
    };
  }
}

// Delete launch with given ID.
async function httpAbortLaunch(id) {
  try {
    console.log("abort laucnch try");
    return await fetch(`${API_URL}/launches/${id}`, {
      method: "DELETE",
    });
  } catch (error) {
    console.log("abort laucnch error");
    return {
      ok: false,
    };
  }
}

export { httpGetPlanets, httpGetLaunches, httpSubmitLaunch, httpAbortLaunch };
