<figure>
  <div class="plan-frame">
    <svg viewBox="0 0 720 720" role="img" aria-labelledby="plan-title plan-description">
      <title id="plan-title">Revised Culturio museum blockout floor plan</title>
      <desc id="plan-description">
        A south entrance apron leads into an eighteen by sixteen metre lobby, a narrow connecting
        passage, and a forty-four metre circular exhibition forum.
      </desc>

      <defs>
        <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
          <path d="M 20 0 L 0 0 0 20" fill="none" stroke="currentColor" stroke-width="0.5" />
        </pattern>
      </defs>

      <rect class="grid" width="720" height="720" fill="url(#grid)" />
      <text class="north" x="650" y="60">N ↑</text>

      <g class="space hall">
        <circle cx="360" cy="210" r="170" />
        <circle class="forum-ring" cx="360" cy="210" r="92" />
        <text x="360" y="180">Circular exhibition forum</text>
        <text class="dimension" x="360" y="210">Ø 44 × 15 m</text>
        <path class="future-zone" d="M225 240a150 150 0 0 0 270 0" />
        <text class="zone-note" x="360" y="276">Sunken forum · perimeter exhibit ring</text>
      </g>

      <g class="space corridor">
        <rect x="320" y="380" width="80" height="125" rx="3" />
        <text x="360" y="430">Passage</text>
        <text class="dimension" x="360" y="455">6 × 13 × 6 m</text>
      </g>

      <g class="space lobby">
        <rect x="240" y="505" width="240" height="125" rx="4" />
        <text x="360" y="550">Entrance lobby</text>
        <text class="dimension" x="360" y="578">18 × 16 × 9 m</text>
        <path class="light-slot" d="M278 525h164" />
        <text class="zone-note" x="360" y="610">Linear roof light</text>
      </g>

      <g class="space apron">
        <path d="M240 630h240l55 55H185z" />
        <text x="360" y="665">Entry apron</text>
      </g>

      <path class="route" d="M360 690V115" />
      <circle class="camera" cx="360" cy="682" r="8" />
      <text class="camera-label" x="380" y="690">Camera entry</text>
    </svg>
    <span class="status">Circular blockout 02 · awaiting review</span>
  </div>
  <figcaption>
    One world unit equals one metre. The straight primary route preserves orientation; the narrow
    passage creates a deliberate compression before the hall opens out.
  </figcaption>
</figure>

<style>
  figure {
    margin: 0;
  }
  .plan-frame {
    position: relative;
    overflow: hidden;
    border: 1px solid var(--color-line);
    border-radius: 1.25rem;
    background: #eee5d8;
  }
  svg {
    display: block;
    width: 100%;
    color: #a69a8d;
  }
  .grid {
    opacity: 0.28;
  }
  .space rect,
  .space circle,
  .space > path:not(.future-zone):not(.light-slot) {
    fill: #d4b597;
    stroke: #5d4638;
    stroke-width: 3;
  }
  .hall > circle:first-child {
    fill: #c8aa8d;
  }
  .forum-ring {
    fill: #a86d52 !important;
    stroke-dasharray: 9 7;
  }
  .corridor rect {
    fill: #99745d;
  }
  .space text,
  .north,
  .camera-label {
    fill: #2a211c;
    font-family: var(--font-sans);
    font-size: 18px;
    font-weight: 500;
    text-anchor: middle;
  }
  .dimension,
  .zone-note {
    font-size: 14px !important;
    font-weight: 400 !important;
    fill: #5f5249 !important;
  }
  .future-zone,
  .light-slot {
    fill: none;
    stroke: #76523f;
    stroke-width: 7;
    stroke-linecap: round;
    stroke-dasharray: 10 12;
  }
  .route {
    fill: none;
    stroke: #fff9ee;
    stroke-width: 4;
    stroke-dasharray: 7 10;
    opacity: 0.9;
  }
  .camera {
    fill: var(--color-bronze);
    stroke: #fff9ee;
    stroke-width: 3;
  }
  .camera-label {
    font-size: 13px;
    text-anchor: start;
  }
  .north {
    font-family: var(--font-serif);
    font-size: 25px;
  }
  .status {
    position: absolute;
    top: 1rem;
    left: 1rem;
    padding: 0.5rem 0.7rem;
    border-radius: 999px;
    background: var(--color-ink);
    color: var(--color-paper);
    font-size: 0.68rem;
    letter-spacing: 0.1em;
    text-transform: uppercase;
  }
  figcaption {
    margin-top: 0.85rem;
    color: var(--color-muted);
    font-size: 0.84rem;
    line-height: 1.6;
  }
</style>
