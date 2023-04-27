import {jeepneyRoutes} from '../waypoints.js'


const nearestNodesCache = {};

function findNearestNodes(location, jeepneyRoutes, threshold) {
  const cacheKey = JSON.stringify(location);
  if (nearestNodesCache[cacheKey]) {
    return nearestNodesCache[cacheKey];
  }

  const nearestNodes = [];

  for (const routeId in jeepneyRoutes) {
    const route = jeepneyRoutes[routeId];
    for (let i = 0; i < route.length; i++) {
      const key = `${routeId}_${i}`;
      const distance = calculateDistance(location, route[i]);
      if (distance <= threshold) {
        nearestNodes.push(key);
      }
    }
  }

  nearestNodesCache[cacheKey] = nearestNodes;
  return nearestNodes;
}



class PriorityQueue {
  constructor() {
    this.queue = [];
  }

  enqueue(item, priority) {
    this.queue.push({ item, priority });
    this._bubbleUp(this.queue.length - 1);
  }

  dequeue() {
    const min = this.queue[0];
    const last = this.queue.pop();
    if (this.queue.length > 0) {
      this.queue[0] = last;
      this._sinkDown(0);
    }
    return min.item;
  }

  isEmpty() {
    return this.queue.length === 0;
  }

  _bubbleUp(index) {
    while (index > 0) {
      const parentIndex = Math.floor((index + 1) / 2) - 1;
      if (this.queue[parentIndex].priority <= this.queue[index].priority) {
        break;
      }
      [this.queue[parentIndex], this.queue[index]] = [
        this.queue[index],
        this.queue[parentIndex],
      ];
      index = parentIndex;
    }
  }

  _sinkDown(index) {
    const length = this.queue.length;
    while (true) {
      const leftChildIndex = (index + 1) * 2 - 1;
      const rightChildIndex = leftChildIndex + 1;
      let swapIndex = null;

      if (
        leftChildIndex < length &&
        this.queue[leftChildIndex].priority < this.queue[index].priority
      ) {
        swapIndex = leftChildIndex;
      }
      if (
        rightChildIndex < length &&
        this.queue[rightChildIndex].priority <
          (swapIndex === null
            ? this.queue[index].priority
            : this.queue[leftChildIndex].priority)
      ) {
        swapIndex = rightChildIndex;
      }

      if (swapIndex === null) {
        break;
      }
      [this.queue[index], this.queue[swapIndex]] = [
        this.queue[swapIndex],
        this.queue[index],
      ];
      index = swapIndex;
    }
  }
}

function calculateDistance(pointA, pointB) {
  const latDiff = pointA[0] - pointB[0];
  const lngDiff = pointA[1] - pointB[1];
  const R = 6371000; // Earth radius in meters
  const dLat = (pointB[0] - pointA[0]) * (Math.PI / 180);
  const dLng = (pointB[1] - pointA[1]) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(pointA[0] * (Math.PI / 180)) * Math.cos(pointB[0] * (Math.PI / 180)) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;
  return distance;
}


function generateGraph(jeepneyRoutes, transferDistance) {
  const graph = {};

  for (const routeId in jeepneyRoutes) {
    const route = jeepneyRoutes[routeId];
    for (let i = 0; i < route.length; i++) {
      const key = `${routeId}_${i}`;

      if (!graph[key]) {
        graph[key] = {};
      }
    }
  }

  for (const routeId in jeepneyRoutes) {
    const route = jeepneyRoutes[routeId];
    for (let i = 0; i < route.length; i++) {
      const key = `${routeId}_${i}`;

      if (i > 0) {
        const prevKey = `${routeId}_${i - 1}`;
        const distance = calculateDistance(route[i], route[i - 1]);
        graph[key][prevKey] = { distance, routeChange: false };
        graph[prevKey][key] = { distance, routeChange: false };
      }

      for (const otherRouteId in jeepneyRoutes) {
        if (routeId === otherRouteId) continue;

        const otherRoute = jeepneyRoutes[otherRouteId];
        for (let j = 0; j < otherRoute.length; j++) {
          const otherKey = `${otherRouteId}_${j}`;

          const distance = calculateDistance(route[i], otherRoute[j]);
          if (distance <= transferDistance) {
            graph[key][otherKey] = { distance, routeChange: true };
            graph[otherKey][key] = { distance, routeChange: true };
          }
        }
      }
    }
  }

  return graph;
}



function findClosestNode(graph, point) {
  let minDistance = Infinity;
  let closestNode = null;

  for (const node in graph) {
    const coords = jeepneyRoutes[node.split('_')[0]][parseInt(node.split('_')[1])];
    const distance = calculateDistance(coords, point);
    if (distance < minDistance) {
      minDistance = distance;
      closestNode = node;
    }
  }

  console.log(`Closest node to point [${point}]: ${closestNode}`);
  return closestNode;
}


function findShortestPath(graph, startNodes, endNodes) {
  let bestResult = null;

  for (const start of startNodes) {
    for (const end of endNodes) {
      const result = findShortestPathSingle(graph, start, end);
      if (!bestResult || (result.routeChanges < bestResult.routeChanges) || (result.routeChanges === bestResult.routeChanges && result.distance < bestResult.distance)) {
        bestResult = result;
      }
    }
  }

  return bestResult;
}

function findShortestPathSingle(graph, start, end) {
  const pq = new PriorityQueue();
  const distances = {};
  const previous = {};
  const routeChanges = {};
  const penaltyInMeters = 5000000000000000;
 

  for (const node in graph) {
    if (node === start) {
      distances[node] = 0;
      pq.enqueue(node, 0);
      routeChanges[node] = 0;
    } else {
      distances[node] = Infinity;
      pq.enqueue(node, Infinity);
      routeChanges[node] = Infinity;
    }

    previous[node] = null;
  }

  while (!pq.isEmpty()) {
    const currentNode = pq.dequeue();

    for (const neighbor in graph[currentNode]) {
      const edge = graph[currentNode][neighbor];
      const newDistance = distances[currentNode] + edge.distance + (edge.routeChange ? penaltyInMeters : 0);
      const newRouteChange = routeChanges[currentNode] + (edge.routeChange ? 1 : 0);

      if (newDistance < distances[neighbor] || (newDistance === distances[neighbor] && newRouteChange < routeChanges[neighbor])) {
        distances[neighbor] = newDistance;
        previous[neighbor] = currentNode;
        routeChanges[neighbor] = newRouteChange;
        pq.enqueue(neighbor, newDistance + penaltyInMeters * newRouteChange);
      }
    }
  }

  const path = [];
  let current = end;

  while (current !== null) {
    path.unshift(current);
    current = previous[current];
  }

  const groupedPath = [];
  let currentGroup = [];
  let currentRoute = start.split('_')[0];
  let previousRoute = null;

  for (const node of path) {
    const route = node.split('_')[0];
    const coords = jeepneyRoutes[node.split('_')[0]][parseInt(node.split('_')[1])];


    if (route !== currentRoute || (previousRoute && previousRoute !== route)) {
      groupedPath.push({ route: currentRoute, waypoints: currentGroup });
      currentGroup = [];
      currentRoute = route;
    }

    currentGroup.push(coords);
    previousRoute = route;
  }
  groupedPath.push({ route: currentRoute, waypoints: currentGroup });

  return {
    path: groupedPath,
    distance: distances[end],
    routeChanges: routeChanges[end]
  };
}
const currentLocation = [  10.714977752364106,
  122.56698829688662];
const destination = [   10.691509903888004,
  122.58253628863855];


const transferDistance = 0.0002// approximately 20 meters in latitude/longitude degrees
const searchThreshold = 0.0002; // approximately 20 meters in latitude/longitude degrees

const graph = generateGraph(jeepneyRoutes, transferDistance);

// const currentLocation = [10.69958746288853, 122.58773786228141];
// const destination = [10.700597045052788, 122.57974374378864];

const startNodes = findNearestNodes(currentLocation, jeepneyRoutes, searchThreshold);
const endNodes = findNearestNodes(destination, jeepneyRoutes, searchThreshold);

const result = findShortestPath(graph, startNodes, endNodes);

console.log(result);
