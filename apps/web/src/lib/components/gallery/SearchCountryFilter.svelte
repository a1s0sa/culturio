<script lang="ts">
  import { goto } from '$app/navigation';
  import { page } from '$app/state';
  import {
    AO,
    BF,
    BI,
    BJ,
    BW,
    CD,
    CF,
    CG,
    CI,
    CM,
    CV,
    DJ,
    DZ,
    EG,
    EH,
    ER,
    ET,
    GA,
    GH,
    GM,
    GN,
    GQ,
    GW,
    IO,
    KE,
    KM,
    LR,
    LS,
    LY,
    MA,
    MG,
    ML,
    MR,
    MU,
    MW,
    MZ,
    NA,
    NE,
    NG,
    RE,
    RW,
    SC,
    SD,
    SH,
    SL,
    SN,
    SO,
    SS,
    ST,
    SZ,
    TD,
    TG,
    TF,
    TN,
    TZ,
    UG,
    ZA,
    ZM,
    YT,
    ZW
  } from 'country-flag-icons/string/3x2';

  let {
    countries,
    selected
  }: {
    countries: string[];
    selected?: string;
  } = $props();
  let menu = $state<HTMLDetailsElement>();

  const flagByCountry: Record<string, string> = {
    Algeria: DZ,
    Angola: AO,
    Benin: BJ,
    Botswana: BW,
    'Burkina Faso': BF,
    Burundi: BI,
    'Cabo Verde': CV,
    Cameroon: CM,
    'Central African Republic': CF,
    Chad: TD,
    Comoros: KM,
    Congo: CG,
    'Côte d’Ivoire': CI,
    'Democratic Republic of the Congo': CD,
    Djibouti: DJ,
    Egypt: EG,
    'Equatorial Guinea': GQ,
    Eritrea: ER,
    Eswatini: SZ,
    Ethiopia: ET,
    Gabon: GA,
    Gambia: GM,
    Ghana: GH,
    Guinea: GN,
    'Guinea-Bissau': GW,
    Kenya: KE,
    Lesotho: LS,
    Liberia: LR,
    Libya: LY,
    Madagascar: MG,
    Malawi: MW,
    Mali: ML,
    Mauritania: MR,
    Mauritius: MU,
    Morocco: MA,
    Mozambique: MZ,
    Namibia: NA,
    Niger: NE,
    Nigeria: NG,
    Réunion: RE,
    Rwanda: RW,
    Senegal: SN,
    Seychelles: SC,
    'Sierra Leone': SL,
    Somalia: SO,
    'South Africa': ZA,
    'South Sudan': SS,
    Sudan: SD,
    Tanzania: TZ,
    Togo: TG,
    Tunisia: TN,
    Uganda: UG,
    'Western Sahara': EH,
    Zambia: ZM,
    Zimbabwe: ZW,
    'British Indian Ocean Territory': IO,
    'French Southern Territories': TF,
    Mayotte: YT,
    'Saint Helena': SH,
    'Sao Tome and Principe': ST,
    'São Tomé and Príncipe': ST,
    'Cape Verde': CV,
    'Ivory Coast': CI,
    'Republic of the Congo': CG,
    Swaziland: SZ,
    'The Gambia': GM,
    'United Republic of Tanzania': TZ
  };

  const countryNames = Object.keys(flagByCountry).sort((a, b) => b.length - a.length);
  const visibleCountries = $derived(
    [
      ...new Set(countries.map(countryFromOrigin).filter((country): country is string => !!country))
    ].sort((a, b) => a.localeCompare(b))
  );
  const flagByCode = flagByCountry;

  function countryFromOrigin(origin: string) {
    return countryNames.find((country) => origin === country || origin.startsWith(`${country},`));
  }

  function flagFor(country: string) {
    return flagByCode[country];
  }

  async function choose(country?: string) {
    const url = new URL(page.url.href);
    url.searchParams.delete('cursor');
    if (country) url.searchParams.set('country', country);
    else url.searchParams.delete('country');
    menu!.open = false;
    await goto(url, { reset: false });
  }
</script>

<details bind:this={menu} class="country-filter">
  <summary aria-label="Filter by African country">
    {#if selected && flagFor(selected)}
      <span class="flag" aria-hidden="true">{@html flagFor(selected)}</span>
      <span>{selected}</span>
    {:else}
      <span class="continent-icon" aria-hidden="true">◎</span>
      <span>All Africa</span>
    {/if}
    <svg aria-hidden="true" viewBox="0 0 16 16"><path d="m4 6 4 4 4-4" /></svg>
  </summary>
  <div class="menu" role="listbox" aria-label="African countries">
    <button
      class:active={!selected}
      type="button"
      role="option"
      aria-selected={!selected}
      onclick={() => choose()}
    >
      <span class="continent-icon" aria-hidden="true">◎</span>
      <span>All Africa</span>
    </button>
    {#each visibleCountries as country (country)}
      <button
        class:active={selected === country}
        type="button"
        role="option"
        aria-selected={selected === country}
        onclick={() => choose(country)}
      >
        <span class="flag" aria-hidden="true">{@html flagFor(country)}</span>
        <span>{country}</span>
      </button>
    {/each}
  </div>
</details>

<style>
  .country-filter {
    position: relative;
    z-index: 2;
  }
  summary {
    display: flex;
    align-items: center;
    gap: 0.55rem;
    min-height: 2.65rem;
    padding: 0.55rem 0.8rem;
    border: 1px solid var(--color-line);
    border-radius: 999px;
    background: var(--color-paper);
    cursor: pointer;
    list-style: none;
    font-size: 0.84rem;
  }
  summary::-webkit-details-marker {
    display: none;
  }
  summary svg {
    width: 0.85rem;
    margin-left: 0.2rem;
    fill: none;
    stroke: currentColor;
    stroke-width: 1.5;
  }
  .flag {
    display: inline-flex;
    width: 1.25rem;
    height: 0.85rem;
    overflow: hidden;
    border-radius: 2px;
    box-shadow: 0 0 0 1px #201b1720;
  }
  .flag :global(svg) {
    display: block;
    width: 100%;
    height: 100%;
  }
  .continent-icon {
    display: inline-grid;
    width: 1.25rem;
    height: 0.85rem;
    place-items: center;
    color: var(--color-bronze);
    font-size: 1rem;
    line-height: 1;
  }
  .menu {
    position: absolute;
    top: calc(100% + 0.45rem);
    left: 0;
    display: grid;
    width: min(19rem, calc(100vw - 2.5rem));
    max-height: min(24rem, 65vh);
    overflow-y: auto;
    padding: 0.4rem;
    border: 1px solid var(--color-line);
    border-radius: 1rem;
    background: var(--color-paper);
    box-shadow: 0 18px 45px #211d1926;
  }
  .menu button {
    display: flex;
    align-items: center;
    gap: 0.7rem;
    padding: 0.62rem 0.7rem;
    border: 0;
    border-radius: 0.65rem;
    background: transparent;
    color: var(--color-ink);
    text-align: left;
    cursor: pointer;
  }
  .menu button:hover,
  .menu button.active {
    background: color-mix(in srgb, var(--color-bronze) 12%, var(--color-paper));
  }
</style>
