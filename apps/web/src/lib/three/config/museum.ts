export const museumConcept = {
  status: 'proposed',
  units: 'metres',
  coordinateSystem: {
    x: 'east–west',
    y: 'up',
    z: 'south–north; visitors enter from the south and travel north'
  },
  spaces: [
    {
      id: 'entrance-apron',
      name: 'Entrance apron',
      width: 18,
      depth: 8,
      height: 0,
      center: [0, 0, 20] as const
    },
    {
      id: 'lobby',
      name: 'Entrance lobby',
      width: 18,
      depth: 16,
      height: 9,
      center: [0, 4.5, 8] as const
    },
    {
      id: 'corridor',
      name: 'Connecting passage',
      width: 6,
      depth: 13,
      height: 6,
      center: [0, 3, -6.5] as const
    },
    {
      id: 'hall',
      name: 'Circular exhibition forum',
      width: 44,
      depth: 44,
      height: 15,
      center: [0, 7.5, -34] as const
    }
  ],
  entrance: { width: 5, height: 7 },
  camera: {
    position: [0, 1.7, 25] as const,
    target: [0, 1.7, 8] as const,
    fieldOfView: 58
  },
  reviewViews: [
    {
      id: 'entrance',
      name: 'Entrance',
      position: [12, 5, 29] as const,
      target: [0, 4, 9] as const
    },
    {
      id: 'lobby',
      name: 'Lobby',
      position: [6.5, 2.2, 13] as const,
      target: [0, 3.2, -1] as const
    },
    {
      id: 'hall',
      name: 'Hall',
      position: [0, 2.4, -15] as const,
      target: [0, -0.8, -34] as const
    },
    {
      id: 'overhead',
      name: 'Plan',
      position: [40, 60, 12] as const,
      target: [0, 0, -24] as const
    }
  ],
  futureExhibitZones: [
    { id: 'hall-west', center: [-14, 0, -34] as const, width: 5, depth: 10 },
    { id: 'hall-north', center: [0, 0, -48] as const, width: 10, depth: 5 },
    { id: 'hall-east', center: [14, 0, -34] as const, width: 5, depth: 10 }
  ]
} as const;

export type MuseumConcept = typeof museumConcept;
export interface MuseumReviewView {
  id: string;
  name: string;
  position: readonly [number, number, number];
  target: readonly [number, number, number];
}
