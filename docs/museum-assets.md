# Museum Assets

The architectural concept uses no downloaded models, textures, audio, or artifact assets.

The museum route dynamically imports its Three.js/Threlte foundation after explicit interaction,
keeping rendering dependencies out of the gallery's initial bundle. Future approved architecture
should prefer reusable primitives and modular GLB files. Texture sizes must be selected from actual
screen-space needs; KTX2/Basis compression should be evaluated before production assets ship.

Future artifact GLBs will be addressed through an asset manager that supports R2 URLs, lazy loading,
caching, progress, failure handling, and disposal. Artifact placement, stands, plaques, and model
processing are intentionally outside this phase.

Any ambient audio must be licensed or original, optional, disabled by default, and loaded separately
from essential scene assets.
