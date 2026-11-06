# Museum Navigation

Basic navigation is implemented for the low-poly blockout.

Desktop navigation uses a 1.7 m camera height, WASD movement, mouse look, pointer lock, Escape
release, and lightweight collision against static architectural bounds. Shift increases movement
speed. No camera bob is applied.

Mobile navigation uses named viewpoints with interruptible camera transitions and touch drag to look
around. The four review viewpoints are Entrance, Lobby, Hall, and Plan. A virtual joystick remains
deferred until usability testing demonstrates a need.

Both modes must respect reduced-motion preferences and restore focus when leaving overlays. The
proposed entry camera is `(0, 1.7, 25)`, facing `(0, 1.7, 8)`. Navigation points and collision bounds
live in configuration rather than architectural components. Collision is the union of the lobby and
passage rectangles with the circular forum boundary. Camera height follows the four sunken floor
levels while axis-separated movement preserves wall sliding.
