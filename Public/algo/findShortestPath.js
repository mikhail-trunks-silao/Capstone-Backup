class PriorityQueue {
  constructor() {
    this.elements = [];
  }

  put(item, priority) {
    this.elements.push({ item, priority });
    this.elements.sort((a, b) => a.priority - b.priority);
  }

  get() {
    return this.elements.shift().item;
  }

  isEmpty() {
    return this.elements.length === 0;
  }
}

function toRad(degrees) {
  return (degrees * Math.PI) / 180;
}

function distance(lat1, lon1, lat2, lon2) {
  const R = 6371e3; // Earth's radius in meters
  const lat1Rad = toRad(lat1);
  const lat2Rad = toRad(lat2);
  const deltaLat = toRad(lat2 - lat1);
  const deltaLon = toRad(lon2 - lon1);

  const a =
    Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
    Math.cos(lat1Rad) * Math.cos(lat2Rad) * Math.sin(deltaLon / 2) * Math.sin(deltaLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

// Helper function to find the nearest start point within 30 meters of user's location
function findNearestStartPoint(jeepneyRoutes, userLocation) {
  let nearestPoint = null;
  let minDistance = Infinity;

  for (const route of Object.values(jeepneyRoutes)) {
    for (const point of route) {
      const d = distance(userLocation[0], userLocation[1], point[0], point[1]);
      if (d <= 50 && d < minDistance) {
        nearestPoint = point;
        minDistance = d;
      }
    }
  }

  return nearestPoint;
}

// Helper function to find the nearest end point within 30 meters of user's destination
function findNearestEndPoint(jeepneyRoutes, userDestination) {
  let nearestPoint = null;
  let minDistance = Infinity;

  for (const route of Object.values(jeepneyRoutes)) {
    for (const point of route) {
      const d = distance(userDestination[0], userDestination[1], point[0], point[1]);
      if (d <= 30 && d < minDistance) {
        nearestPoint = point;
        minDistance = d;
      }
    }
  }

  return nearestPoint;
}

export function preprocessRoutes(jeepneyRoutes, maxDistance = 30) {
  const newJeepneyRoutes = {};

  for (const [routeName, route] of Object.entries(jeepneyRoutes)) {
    const newRoute = [route[0]];

    for (let i = 1; i < route.length; i++) {
      const prev = route[i - 1];
      const curr = route[i];
      const dist = distance(prev[0], prev[1], curr[0], curr[1]);

      if (dist > maxDistance) {
        const numPoints = Math.ceil(dist / maxDistance);
        const latStep = (curr[0] - prev[0]) / numPoints;
        const lngStep = (curr[1] - prev[1]) / numPoints;

        for (let j = 1; j < numPoints; j++) {
          newRoute.push([prev[0] + j * latStep, prev[1] + j * lngStep]);
        }
      }

      newRoute.push(curr);
    }

    newJeepneyRoutes[routeName] = newRoute;
  }

  return newJeepneyRoutes;
}

function precomputeDistances(jeepneyRoutes) {
  const distances = new Map();

  for (const route of Object.values(jeepneyRoutes)) {
    for (const coord1 of route) {
      for (const coord2 of route) {
        if (coord1 !== coord2) {
          const key = `${coord1},${coord2}`;
          if (!distances.has(key)) {
            const dist = distance(coord1[0], coord1[1], coord2[0], coord2[1]);
            distances.set(key, dist);
          }
        }
      }
    }
  }

  return distances;
}

function simplifyRoutes(jeepneyRoutes, minDistance = 5) {
  const newJeepneyRoutes = {};

  for (const [routeName, route] of Object.entries(jeepneyRoutes)) {
    const newRoute = [route[0]];

    for (let i = 1; i < route.length; i++) {
      const prev = newRoute[newRoute.length - 1];
      const curr = route[i];
      const dist = distance(prev[0], prev[1], curr[0], curr[1]);

      if (dist >= minDistance) {
        newRoute.push(curr);
      }
    }

    newJeepneyRoutes[routeName] = newRoute;
  }

  return newJeepneyRoutes;
}


function findAllStartPoints(jeepneyRoutes, currentLocation, walkingDistanceThreshold = 30) {
  const startPoints = [];

  function isWithin20Meters(coord1, coord2) {
    return distance(coord1[0], coord1[1], coord2[0], coord2[1]) <= walkingDistanceThreshold;
  }

  for (const route of Object.values(jeepneyRoutes)) {
    for (const coord of route) {
      if (isWithin20Meters(coord, currentLocation)) {
        startPoints.push(coord);
      }
    }
  }

  return startPoints;
}

export function findShortestPath(jeepneyRoutes, currentLocation, destination, walkingDistanceThreshold = 20) {
  const allStartPoints = findAllStartPoints(jeepneyRoutes, currentLocation);
  const allPaths = [];

  // Find the shortest path for each starting point
  for (const startPoint of allStartPoints) {
    const path = findShortestPathForStartingPoint(jeepneyRoutes, currentLocation, startPoint, destination, walkingDistanceThreshold);
    allPaths.push(path);
  }

  // Choose the path with the least route changes
  let minRouteChanges = Infinity;
  let bestPath = null;

  for (const path of allPaths) {
    const routeChanges = path.filter(coord => Array.isArray(coord) && coord[0] !== null).length;

    if (routeChanges < minRouteChanges) {
      minRouteChanges = routeChanges;
      bestPath = path;
    }
  }

  return bestPath;
}


function  findShortestPathForStartingPoint(jeepneyRoutes, currentLocation, startPoint, destination, walkingDistanceThreshold = 20) {
  const graph = new Map();
  const queue = new PriorityQueue();
  const distances = new Map();
  const previous = new Map();
  const routeNames = new Map();

  for (const [routeName, route] of Object.entries(jeepneyRoutes)) {
    for (const [lat, lng] of route) {
      if (!graph.has(`${lat},${lng}`)) {
        graph.set(`${lat},${lng}`, []);
      }
    }

    for (let i = 0; i < route.length - 1; i++) {
      const start = route[i];
      const end = route[i + 1];
      const weight = 1;
      graph.get(`${start[0]},${start[1]}`).push({ coord: end, weight, routeName });
      graph.get(`${end[0]},${end[1]}`).push({ coord: start, weight, routeName });
    }
  }

  function isWithin20Meters(coord1, coord2) {
    return distance(coord1[0], coord1[1], coord2[0], coord2[1]) <= walkingDistanceThreshold;
  }

  for (const [routeName1, route1] of Object.entries(jeepneyRoutes)) {
    for (const [routeName2, route2] of Object.entries(jeepneyRoutes)) {
      if (routeName1 === routeName2) continue;

      for (const coord1 of route1) {
        for (const coord2 of route2) {
          if (isWithin20Meters(coord1, coord2)) {
            const weight = 10000; // Increase the weight for changing routes
            graph.get(`${coord1[0]},${coord1[1]}`).push({ coord: coord2, weight, routeName: routeName2 });
            graph.get(`${coord2[0]},${coord2[1]}`).push({ coord: coord1, weight, routeName: routeName1 });
          }
        }
      }
    }
  }

  
  const endPoint = findNearestEndPoint(jeepneyRoutes, destination);

  if (!startPoint || !endPoint) {
    throw new Error("No suitable start or end point found within 30 meters of user's location or destination.");
  }

  // Dijkstra's Algorithm
  graph.forEach((_, coord) => {
    distances.set(coord, Infinity);
    previous.set(coord, null);
    routeNames.set(coord, null);
  });

  distances.set(`${startPoint[0]},${startPoint[1]}`, 0);
  queue.put(startPoint, 0);

  while (!queue.isEmpty()) {
    const current = queue.get();
    const currentKey = `${current[0]},${current[1]}`;

    for (const neighbor of graph.get(currentKey)) {
      const alt = distances.get(currentKey) + neighbor.weight;
      const neighborKey = `${neighbor.coord[0]},${neighbor.coord[1]}`;

      if (alt < distances.get(neighborKey)) {
        distances.set(neighborKey, alt);
        previous.set(neighborKey, current);
        routeNames.set(neighborKey, neighbor.routeName);
        queue.put(neighbor.coord, alt);
      }
    }
  }

    // Construct the path
    const path = [];
    let u = endPoint;

    while (u !== null) {
      const routeName = routeNames.get(`${u[0]},${u[1]}`);
      if (routeName !== null) {
        path.unshift([routeName, u]);
      } else {
        path.unshift(u);
      }
      u = previous.get(`${u[0]},${u[1]}`);
    }

    const finalPath = [[null, currentLocation], ...path, [null, destination]];
  
    // Group the path by route name
    const groupedPath = [];
    let currentRouteName = null;
    let currentGroup = [];
  
    for (const coord of path) {
      if (Array.isArray(coord)) {
        if (currentRouteName !== coord[0]) {
          if (currentGroup.length > 0) {
            groupedPath.push([currentRouteName, currentGroup]);
          }
          currentRouteName = coord[0];
          currentGroup = [coord[1]];
        } else {
          currentGroup.push(coord[1]);
        }
      } else {
        if (currentGroup.length > 0) {
          groupedPath.push([currentRouteName, currentGroup]);
          currentGroup = [];
        }
        currentRouteName = null;
      }
    }
  
    if (currentGroup.length > 0) {
      groupedPath.push([currentRouteName, currentGroup]);
    }
  
    // Merge consecutive groups with the same route name
    const mergedGroupedPath = [];
    for (let i = 0; i < groupedPath.length; i++) {
      const [routeName, coords] = groupedPath[i];
      if (i > 0 && groupedPath[i - 1][0] === routeName) {
        mergedGroupedPath[mergedGroupedPath.length - 1][1].push(...coords);
      } else {
        mergedGroupedPath.push([routeName, coords]);
      }
    }
  
    // Return the result in the specified format
    const formattedResult = [
      ["currentLocation", currentLocation],
      ...mergedGroupedPath.map(([routeName, coords]) => [String(routeName), ...coords.map(coord => [coord[0], coord[1]])]),
      ["destination", destination],
    ];

    formattedResult.splice(1, 1);
    return formattedResult;
}


  

// //Two rides
// const currentLocation = [  10.714977752364106,
//     122.56698829688662];
//   const destination = [   10.691509903888004,
//     122.58253628863855];

  //two rides near waypoints
  // const currentLocation = [  10.715843968160446, 122.56646283443526];
  // const destination = [  10.688075603697209, 122.57955443866727];


//One ride inside the waypints
// const currentLocation = [  10.69958746288853,
//   122.58773786228141];
// const destination = [    10.700597045052788,
//   122.57974374378864];

// one ride near the waypoints
// const currentLocation = [10.69968991571916, 122.58765171951806];
// const destination = [10.701819254504704, 122.56895215843554];

// const currentLocation = [10.725000105165213, 122.55766553477783];
// const destination = [10.761731727135045, 122.57753158581632];

    
// Find the shortest path with pre processed waypoints
// const preprocessedJeepneyRoutes = preprocessRoutes(jeepneyRoutes);
// const output = findShortestPath(preprocessedJeepneyRoutes, currentLocation, destination);
// console.log(output);

// const output = findShortestPath(jeepneyRoutes, currentLocation, destination);

// //Shortest path without preprocessed waypoints
// const output = findShortestPath(jeepneyRoutes, currentLocation, destination);
// const output = findShortestPath(preprocessedJeepneyRoutes, currentLocation, destination);
// console.log(output);


// Create and add polylines to the map
// output.forEach(route => {
//   function getRandomColor() {
//         // Generate random values for the red, green, and blue components of the color
//         const r = Math.floor(Math.random() * 256);
//         const g = Math.floor(Math.random() * 256);
//         const b = Math.floor(Math.random() * 256);
      
//         // Construct the color string in RGB format
//         const color = `rgb(${r}, ${g}, ${b})`;
      
//         // Return the color string
//         return color;
//       }
    
//       const randomColor = getRandomColor();

//   const routeName = route[0];
//   const routeCoords = route.slice(1);
//   const polyline = L.polyline(routeCoords, { color: randomColor, weight: 5 }).addTo(map);
// });

// // Fit the map to the bounds of all polylines
// const bounds = L.latLngBounds(output.map(route => route.slice(1)).flat());
// map.fitBounds(bounds);


  



  
// for (let i = 1; i < output.length; i++) {
//   function getRandomColor() {
//     // Generate random values for the red, green, and blue components of the color
//     const r = Math.floor(Math.random() * 256);
//     const g = Math.floor(Math.random() * 256);
//     const b = Math.floor(Math.random() * 256);
  
//     // Construct the color string in RGB format
//     const color = `rgb(${r}, ${g}, ${b})`;
  
//     // Return the color string
//     return color;
//   }

//   const randomColor = getRandomColor();

  // const latLngs = output[i][1].map(coord => L.latLng(coord[0], coord[1]));
  // const polyline = L.polyline(latLngs, { color: randomColor, weight: 5, opacity: 0.7 }).addTo(map);
  // polyline.bindPopup(`Route: ${output[i][0]}`);
  
// }


  // var coordinates = [];

  // shortestPath.path[0].waypoint.forEach(function(coordinate) {
  //     coordinates.push([coordinate[0], coordinate[1]]);
  // });
  
  // var polyline = L.polyline(coordinates, {color: 'red'}).addTo(map);


