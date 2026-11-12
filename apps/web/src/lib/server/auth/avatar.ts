import { Avatar } from '@dicebear/core';
import shapes from '@dicebear/styles/shapes.json';

export function avatarForUser(userId: string) {
  return new Avatar(shapes, {
    seed: userId,
    backgroundColor: ['f4efe6'],
    shape1Color: ['211d19'],
    shape2Color: ['995b3d'],
    shape3Color: ['d9d0c3']
  }).toDataUri();
}
