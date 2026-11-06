export type PlanarPoint = readonly [x: number, z: number];

const walkableZones = [
  { minX: -9, maxX: 9, minZ: 15.5, maxZ: 26 },
  { minX: -8.65, maxX: 8.65, minZ: -0.8, maxZ: 16.2 },
  { minX: -2.65, maxX: 2.65, minZ: -13.3, maxZ: 0.8 }
] as const;

const circularHall = { x: 0, z: -34, radius: 21.65 } as const;

export function isWalkable([x, z]: PlanarPoint, radius = 0.35) {
  const insideRectangle = walkableZones.some(
    (zone) =>
      x >= zone.minX + radius &&
      x <= zone.maxX - radius &&
      z >= zone.minZ + radius &&
      z <= zone.maxZ - radius
  );

  const insideCircularHall =
    Math.hypot(x - circularHall.x, z - circularHall.z) <= circularHall.radius - radius;

  return insideRectangle || insideCircularHall;
}

export function getFloorHeight([x, z]: PlanarPoint) {
  const radius = Math.hypot(x - circularHall.x, z - circularHall.z);

  if (radius <= 7) return -1.6;
  if (radius <= 10) return -1.2;
  if (radius <= 13) return -0.8;
  if (radius <= 16) return -0.4;
  return 0;
}

export function resolveMovement(
  position: PlanarPoint,
  movement: PlanarPoint,
  radius = 0.35
): [number, number] {
  let nextX = position[0];
  let nextZ = position[1];

  if (isWalkable([position[0] + movement[0], nextZ], radius)) {
    nextX += movement[0];
  }

  if (isWalkable([nextX, position[1] + movement[1]], radius)) {
    nextZ += movement[1];
  }

  return [nextX, nextZ];
}
