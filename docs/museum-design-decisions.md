# Museum Design Decisions

This log distinguishes proposals from user-approved decisions. Silence is never treated as approval.

## Checkpoint 01 — Architectural concept

Date: 2026-11-06  
Status: **approved by user on 2026-11-06**

Proposed:

- Contemporary West African/Sahelian direction using earthen massing, deep shade, and restrained
  light rather than applied cultural motifs.
- A straight south-to-north sequence: entrance apron, 18 × 16 m lobby, 6 × 10 m passage, and an
  initially proposed 30 × 36 m main hall.
- A 9 m lobby ceiling, 6 m passage ceiling, and initially proposed 11 m hall ceiling.
- A monumental recessed entrance, linear lobby roof light, compressed passage, and controlled hall
  clerestory light.
- Three flexible, empty exhibit bands reserved for later artifact integration.

Implemented at this checkpoint:

- Reviewable responsive floor plan and dimension schedule.
- Browser-only, interaction-triggered Three.js/Threlte renderer foundation.
- Neutral one-metre grid and human-height marker only; no architectural blockout.

The user approved the concept and requested implementation of the low-poly blockout.

## Checkpoint 02 — Low-poly blockout

Date: 2026-11-06  
Status: **awaiting review**

Implemented:

- Primitive entrance masses, lobby shell, connecting passage, and main hall at approved dimensions.
- Lobby roof-light slot, hall clerestory gaps, structural rhythm, and empty future exhibit floor area.
- Repeatable Entrance, Lobby, Hall, and Plan cameras.
- Desktop pointer-lock WASD navigation with lightweight collision and wall sliding.
- Mobile guided viewpoints with touch drag-look and reduced-motion handling.
- WebGL capability, renderer failure, and context-loss fallbacks.

The scene intentionally has no downloaded assets, textures, ornaments, artifact models, stands, or
plaques. External assets were unnecessary for a revisable blockout. Entrance geometry, room
proportions, openings, circulation, and lighting remain unapproved until the user reviews the scene.

### Revision 01 — Larger reference-led hall

Date: 2026-11-06  
Status: **awaiting review**

User feedback requested a larger hall and supplied an interior reference. The blockout now uses:

- A 40 × 52 m hall with a 13 m ceiling.
- Warm earthen side walls and repeated empty arched recesses.
- A dark steel-like structural grid with spaced warm canopy slats and linear daylight gaps.
- A 30 m glazed north-end opening with dark mullions.
- Updated collision bounds, review cameras, plan dimensions, and future exhibit zones.

The reference's artifacts, pedestals, carpets, and graphic wall motifs were not reproduced. Applied
motifs require a coherent, attributable design source during the later detailed-material review.

### Revision 02 — Circular brick forum

Date: 2026-11-06  
Status: **awaiting review; supersedes Revision 01**

The user rejected the rectangular hall and referenced
[Dong Yugan's Red Brick Art Museum photography by He Lian](https://www.archdaily.com/884521/dong-yugans-brick-art-museum-through-the-lens-of-he-lian).
The plan and blockout now use:

- A 44 m diameter, 15 m tall circular hall connected by a 13 m passage.
- Four concentric levels descending 1.6 m into a central public forum.
- Sixteen ground-level columns supporting a circular balcony.
- Segmented inner parapets and upper screens representing perforated brickwork at blockout fidelity.
- A dark annular roof with radial beams and a concentrated central skylight.
- Circular collision bounds and camera height that follows the stepped floor.

This is a spatial interpretation, not a reproduction. No reference photography or proprietary model
assets are included. The former rectangular hall, arch niches, canopy, and glazed end wall were
removed.
