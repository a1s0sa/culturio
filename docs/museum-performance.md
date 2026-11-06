# Museum Performance

No frame-rate, load-time, draw-call, triangle, or GPU-memory claims have been made. Device profiling
begins after browser access is available for the current low-poly blockout.

At the blockout checkpoint, `/museum` server-renders only HTML, CSS, the floor-plan SVG, and a small
feature-detection script. Three.js, Threlte, controls, and architectural geometry are loaded by
dynamic import only when the visitor enters the blockout. The scene uses primitive boxes, low-segment
cylinders and rings, shared flat materials, five lights, no textures, no models, and no
postprocessing. Repeated screen and wall segments remain individual blockout meshes until profiling
shows whether instancing is needed for the approved design.

Initial targets remain approximately 60 FPS on representative desktop hardware and 30 FPS on a
mid-range mobile device. Future measurements should record bundle transfer size, time to first
rendered frame, median frame time, p95 frame time, draw calls, triangles, textures, geometries, and
renderer pixel ratio for each quality preset.

Low, medium, and high quality presets will be implemented after profiling establishes useful
differences. Adaptive pixel ratio and shadow quality are likely first controls. Diagnostics must be
development-only by default.
