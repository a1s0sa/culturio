<span class="loader" aria-hidden="true">
  <!-- Original line art inspired by The Met's public-domain pendant mask, object 1978.412.323. -->
  <svg viewBox="0 0 100 132" focusable="false">
    <defs>
      <clipPath id="idia-mask-shape">
        <path
          d="M28 39 28 19l9 5 4-14 9 10 9-10 4 14 9-5v20c7 5 10 14 7 23l-4 18c-2 12-8 23-16 30l6 9 13 4H22l13-4 6-9c-8-7-14-18-16-30l-4-18c-3-9 0-18 7-23Z"
        />
      </clipPath>
    </defs>
    <rect class="fill" x="0" y="0" width="100" height="132" clip-path="url(#idia-mask-shape)" />
    <g
      class="lines"
      fill="none"
      stroke="currentColor"
      stroke-linecap="round"
      stroke-linejoin="round"
    >
      <path
        d="M28 39 28 19l9 5 4-14 9 10 9-10 4 14 9-5v20c7 5 10 14 7 23l-4 18c-2 12-8 23-16 30l6 9 13 4H22l13-4 6-9c-8-7-14-18-16-30l-4-18c-3-9 0-18 7-23Z"
      />
      <path d="M31 47c4-9 11-14 19-14s15 5 19 14l-3 28c-2 14-8 24-16 29-8-5-14-15-16-29l-3-28Z" />
      <path
        d="M36 51c4-3 8-3 12 0m4 0c4-3 8-3 12 0M38 57c3 2 6 2 9 0m6 0c3 2 6 2 9 0M50 59v17m-7 8c4 3 10 3 14 0"
      />
      <path d="M42 39v5m4-6v6m4-6v6m4-6v6m-4 67 4 5 4-5m-16-1c3 5 9 8 16 8s13-3 16-8" />
    </g>
    <g class="beads" fill="currentColor">
      <circle cx="38" cy="108" r="1.6" />
      <circle cx="43" cy="112" r="1.6" />
      <circle cx="50" cy="114" r="1.6" />
      <circle cx="57" cy="112" r="1.6" />
      <circle cx="62" cy="108" r="1.6" />
    </g>
  </svg>
</span>

<style>
  .loader {
    display: inline-grid;
    width: 2rem;
    flex: 0 0 2rem;
    place-items: center;
    color: var(--color-bronze);
  }
  svg {
    display: block;
    width: 100%;
    overflow: visible;
  }
  .fill {
    fill: currentColor;
    opacity: 0.8;
    transform: scaleY(0);
    transform-box: fill-box;
    transform-origin: center bottom;
    animation: fill-mask 1.6s var(--ease-out) infinite;
  }
  .lines {
    stroke-width: 1.7;
  }
  .beads {
    opacity: 0.9;
  }
  @keyframes fill-mask {
    0% {
      transform: scaleY(0);
      opacity: 0.45;
    }
    72%,
    88% {
      transform: scaleY(1);
      opacity: 0.8;
    }
    100% {
      transform: scaleY(0);
      opacity: 0.45;
    }
  }
  @media (prefers-reduced-motion: reduce) {
    .fill {
      animation: none;
      transform: scaleY(0.5);
      opacity: 0.8;
    }
  }
</style>
