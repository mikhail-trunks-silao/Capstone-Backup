function distance(pointA, pointB) {
  const [lat1, lng1] = pointA;
  const [lat2, lng2] = pointB;
  const R = 6371e3; // Earth radius in meters
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLng = (lng2 - lng1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function buildGraph(routes, transferDistance) {
  const graph = {};
  const transferPenalty = 1000; // 5km penalty in meters

  for (const routeId in routes) {
    const route = routes[routeId];
    for (let i = 0; i < route.length; i++) {
      const node = `${routeId}_${i}`;
      graph[node] = {};

      if (i < route.length - 1) {
        const nextNode = `${routeId}_${i + 1}`;
        const travelTime = distance(route[i], route[i + 1]);
        graph[node][nextNode] = travelTime;
      }

      for (const otherRouteId in routes) {
        if (routeId !== otherRouteId) {
          const otherRoute = routes[otherRouteId];
          for (let j = 0; j < otherRoute.length; j++) {
            if (distance(route[i], otherRoute[j]) <= transferDistance) {
              const otherNode = `${otherRouteId}_${j}`;
              const transferTime = distance(route[i], otherRoute[j]) + transferPenalty;
              graph[node][otherNode] = transferTime;
            }
          }
        }
      }
    }
  }

  return graph;
}

function dijkstra(graph, start, end) {
  const pq = new PriorityQueue();
  pq.enqueue(start, 0);
  const distances = {};
  const previous = {};
  const path = [];

  for (const node in graph) {
    distances[node] = node === start ? 0 : Infinity;
    previous[node] = null;
  }

  while (!pq.isEmpty()) {
    const { value: currentNode } = pq.dequeue();
    if (currentNode === end) {
      let temp = currentNode;
      while (temp) {
        path.push(temp);
        temp = previous[temp];
      }
      return path.reverse();
    }

    for (const neighbor in graph[currentNode]) {
      const newDistance = distances[currentNode] + graph[currentNode][neighbor];
      if (newDistance < distances[neighbor]) {
        distances[neighbor] = newDistance;
        previous[neighbor] = currentNode;
        pq.enqueue(neighbor, newDistance);
      }
    }
  }
}

class PriorityQueue {
  constructor() {
    this.values = [];
  }

  enqueue(value, priority) {
    this.values.push({ value, priority });
    this.sort();
  }

  dequeue() {
    return this.values.shift();
  }

  sort() {
    this.values.sort((a, b) => a.priority - b.priority);
  }

  isEmpty() {
    return this.values.length === 0;
  }
}

function findNodeByCoords(coords, routes) {
  for (const routeId in routes) {
    const route = routes[routeId];
    for (let i = 0; i < route.length; i++) {
      if (route[i][0] === coords[0] && route[i][1] === coords[1]) {
        return `${routeId}_${i}`;
      }
    }
  }
  return null;
}

function findNearbyRouteNodes(coords, routes, distanceThreshold) {
  const nearbyNodes = [];
  for (const routeId in routes) {
    const route = routes[routeId];
    for (let i = 0; i < route.length; i++) {
      if (distance(route[i], coords) <= distanceThreshold) {
        nearbyNodes.push(`${routeId}_${i}`);
      }
    }
  }
  return nearbyNodes;
}

export function findBestRoute(routes, origin, destination, transferDistance, distanceThreshold) {
  const graph = buildGraph(routes, transferDistance);
  const nearbyOriginNodes = findNearbyRouteNodes(origin, routes, distanceThreshold);
  const nearbyDestinationNodes = findNearbyRouteNodes(destination, routes, distanceThreshold);

  let bestPath = null;
  let bestDistance = Infinity;

  for (const originNode of nearbyOriginNodes) {
    for (const destinationNode of nearbyDestinationNodes) {
      const path = dijkstra(graph, originNode, destinationNode);
      if (path) { // Check if path is not null before proceeding
        const pathDistance = path.reduce((acc, node) => {
          const [routeId, waypointIdx] = node.split('_');
          const waypoint = routes[routeId][parseInt(waypointIdx)];
          return acc + distance(waypoint, origin);
        }, 0);
  
        if (pathDistance < bestDistance) {
          bestPath = path;
          bestDistance = pathDistance;
        }
      }
    }
  }
  

  if (!bestPath) {
    throw new Error('No path found');
  }

  const groupedPath = [];
  let currentRoute = bestPath[0].split('_')[0];
  let routeChange = {
    routeId: currentRoute,
    waypoints: [],
  };

  bestPath.forEach((node) => {
    const [routeId, waypointIdx] = node.split('_');
    if (routeId !== currentRoute) {
      currentRoute = routeId;
      groupedPath.push(routeChange);
      routeChange = {
        routeId: currentRoute,
        waypoints: [],
      };
    }
    routeChange.waypoints.push(routes[routeId][parseInt(waypointIdx)]);
  });

  groupedPath.push(routeChange);
  return groupedPath;
}




// Usage


// const origin = [10.714977752364106, 122.56698829688662];
// const destination = [10.691509903888004, 122.58253628863855];
import { jeepneyRoutes } from "../waypoints.js";
