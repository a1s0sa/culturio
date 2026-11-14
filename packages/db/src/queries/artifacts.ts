import type { GalleryQuery, GallerySort } from '@culturio/shared';
import { toFtsQuery } from './search.js';

export interface ArtifactImageView {
  id: string;
  alt: string;
  dominantColor: string;
  width: number;
  height: number;
  originalUrl: string;
  src: string;
  srcset: string;
  attribution: string | null;
  license: string | null;
  licenseUrl: string | null;
  sourceInstitution: string | null;
  sourceUrl: string | null;
}
export interface ArtifactCardView {
  id: string;
  slug: string;
  title: string;
  culture: string | null;
  civilization: string | null;
  origin: string | null;
  period: string | null;
  dateDisplay: string | null;
  artifactType: string | null;
  image: ArtifactImageView | null;
}
export interface ArtifactPage {
  items: ArtifactCardView[];
  nextCursor: string | null;
}
export interface ArtifactDetailView extends ArtifactCardView {
  description: string | null;
  alternativeNames: string[];
  materials: string[];
  dimensions: string | null;
  earliestYear: number | null;
  latestYear: number | null;
  dateUncertain: boolean;
  images: ArtifactImageView[];
  sources: {
    institution: string;
    url: string;
    accessionNumber: string | null;
    attribution: string | null;
    license: string | null;
  }[];
  related: ArtifactCardView[];
}
export interface ArtifactFilters {
  cultures: string[];
  countries: string[];
  types: string[];
  periods: string[];
  materials: string[];
}

type Row = Record<string, string | number | null>;
type Cursor = { sort: GallerySort; key: string; values: (string | number)[] };

function encodeCursor(cursor: Cursor): string {
  const bytes = new TextEncoder().encode(JSON.stringify(cursor));
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replaceAll('+', '-').replaceAll('/', '_').replace(/=+$/, '');
}
function decodeCursor(value: string | undefined, sort: GallerySort, key: string): Cursor | null {
  if (!value) return null;
  try {
    const binary = atob(value.replaceAll('-', '+').replaceAll('_', '/'));
    const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
    const parsed = JSON.parse(new TextDecoder().decode(bytes)) as Cursor;
    return parsed.sort === sort && parsed.key === key && Array.isArray(parsed.values)
      ? parsed
      : null;
  } catch {
    return null;
  }
}
function assetUrl(base: string, key: string | null): string | null {
  return key ? `${base.replace(/\/$/, '')}/${key}` : null;
}
function imageFromRow(row: Row, base: string, title: string): ArtifactImageView | null {
  const large = assetUrl(base, row.large_key as string | null);
  const medium = assetUrl(base, row.medium_key as string | null);
  const thumb = assetUrl(base, row.thumb_key as string | null);
  const src = medium ?? large ?? thumb;
  if (!src) return null;
  const entries = [
    [thumb, row.thumb_width],
    [medium, row.medium_width],
    [large, row.large_width]
  ].filter(
    (entry): entry is [string, number] =>
      typeof entry[0] === 'string' && typeof entry[1] === 'number'
  );
  return {
    id: String(row.image_id),
    alt: `${title}${row.search_cultures ? `, ${row.search_cultures}` : ''}. ${row.artifact_type ?? 'Historical artifact'}${row.historical_period ? ` from ${row.historical_period}` : ''}.`,
    dominantColor: String(row.dominant_color ?? '#d8cabb'),
    width: Number(row.image_width ?? row.large_width ?? 640),
    height: Number(row.image_height ?? row.large_height ?? 640),
    originalUrl: String(row.original_url ?? ''),
    src,
    srcset: entries.map(([url, width]) => `${url} ${width}w`).join(', '),
    attribution: row.image_attribution as string | null,
    license: row.license_identifier as string | null,
    licenseUrl: (row.license_url as string | null) ?? null,
    sourceInstitution: (row.image_source_institution as string | null) ?? null,
    sourceUrl: (row.image_source_url as string | null) ?? null
  };
}
function cardFromRow(row: Row, base: string): ArtifactCardView {
  const title = String(row.title);
  return {
    id: String(row.id),
    slug: String(row.slug),
    title,
    culture: row.search_cultures as string | null,
    civilization: row.search_civilizations as string | null,
    origin: row.origin as string | null,
    period: row.historical_period as string | null,
    dateDisplay: row.date_display as string | null,
    artifactType: row.artifact_type as string | null,
    image: imageFromRow(row, base, title)
  };
}

const imageColumns = `i.id image_id,i.original_url,i.width image_width,i.height image_height,i.dominant_color,i.attribution image_attribution,i.license_identifier,i.license_url,
(SELECT s.institution FROM artifact_sources s WHERE s.id=i.source_id) image_source_institution,(SELECT s.source_url FROM artifact_sources s WHERE s.id=i.source_id) image_source_url,
(SELECT object_key FROM image_variants WHERE image_id=i.id AND name='thumbnail') thumb_key,(SELECT width FROM image_variants WHERE image_id=i.id AND name='thumbnail') thumb_width,
(SELECT object_key FROM image_variants WHERE image_id=i.id AND name='medium') medium_key,(SELECT width FROM image_variants WHERE image_id=i.id AND name='medium') medium_width,
(SELECT object_key FROM image_variants WHERE image_id=i.id AND name='large') large_key,(SELECT width FROM image_variants WHERE image_id=i.id AND name='large') large_width,(SELECT height FROM image_variants WHERE image_id=i.id AND name='large') large_height`;
const imageJoin = `LEFT JOIN artifact_images i ON i.id=(SELECT ai.id FROM artifact_images ai WHERE ai.artifact_id=a.id AND ai.redistribution_allowed=1 AND ai.original_object_key IS NOT NULL ORDER BY ai.id LIMIT 1)`;

function ordering(sort: GallerySort) {
  switch (sort) {
    case 'oldest':
      return {
        expr: 'COALESCE(a.earliest_year,2147483647) ASC,a.id ASC',
        values: (row: Row) => [Number(row.earliest_year ?? 2147483647), String(row.id)],
        cursor:
          '(COALESCE(a.earliest_year,2147483647)>? OR (COALESCE(a.earliest_year,2147483647)=? AND a.id>?))'
      };
    case 'newest':
      return {
        expr: 'COALESCE(a.latest_year,-2147483648) DESC,a.id DESC',
        values: (row: Row) => [Number(row.latest_year ?? -2147483648), String(row.id)],
        cursor:
          '(COALESCE(a.latest_year,-2147483648)<? OR (COALESCE(a.latest_year,-2147483648)=? AND a.id<?))'
      };
    case 'recent':
      return {
        expr: 'a.created_at DESC,a.id DESC',
        values: (row: Row) => [Number(row.created_at), String(row.id)],
        cursor: '(a.created_at<? OR (a.created_at=? AND a.id<?))'
      };
    case 'alphabetical':
      return {
        expr: 'LOWER(a.title) ASC,a.id ASC',
        values: (row: Row) => [String(row.title).toLowerCase(), String(row.id)],
        cursor: '(LOWER(a.title)>? OR (LOWER(a.title)=? AND a.id>?))'
      };
    default:
      return {
        expr: 'a.quality_score DESC,a.created_at DESC,a.id DESC',
        values: (row: Row) => [Number(row.quality_score), Number(row.created_at), String(row.id)],
        cursor:
          '(a.quality_score<? OR (a.quality_score=? AND (a.created_at<? OR (a.created_at=? AND a.id<?))))'
      };
  }
}
function cursorParams(values: (string | number)[]): (string | number)[] {
  return values.length === 3
    ? [values[0]!, values[0]!, values[1]!, values[1]!, values[2]!]
    : [values[0]!, values[0]!, values[1]!];
}

export async function getArtifacts(
  database: D1Database,
  query: GalleryQuery,
  assetBaseUrl: string
): Promise<ArtifactPage> {
  const conditions = ["a.publication_status='published'"];
  const params: (string | number)[] = [];
  let ftsJoin = '';
  if (query.q) {
    const fts = toFtsQuery(query.q);
    if (fts) {
      ftsJoin = 'JOIN artifacts_fts ON artifacts_fts.rowid=a.rowid';
      conditions.push('artifacts_fts MATCH ?');
      params.push(fts);
    }
  }
  if (query.culture) {
    conditions.push(
      `(EXISTS (SELECT 1 FROM artifact_cultures ac JOIN cultures c ON c.id=ac.culture_id WHERE ac.artifact_id=a.id AND c.name=?) OR EXISTS (SELECT 1 FROM artifact_civilizations av JOIN civilizations v ON v.id=av.civilization_id WHERE av.artifact_id=a.id AND v.name=?))`
    );
    params.push(query.culture, query.culture);
  }
  if (query.country) {
    conditions.push('a.origin=?');
    params.push(query.country);
  }
  if (query.type) {
    conditions.push('a.artifact_type=?');
    params.push(query.type);
  }
  if (query.period) {
    conditions.push('a.historical_period=?');
    params.push(query.period);
  }
  if (query.material) {
    conditions.push('EXISTS (SELECT 1 FROM json_each(a.materials) m WHERE m.value=?)');
    params.push(query.material);
  }
  const cursorKey = JSON.stringify([
    query.q ?? '',
    query.culture ?? '',
    query.country ?? '',
    query.type ?? '',
    query.period ?? '',
    query.material ?? ''
  ]);
  const order =
    query.q && ftsJoin
      ? {
          expr: 'bm25(artifacts_fts) ASC,a.id ASC',
          values: (row: Row) => [Number(row.search_rank), String(row.id)],
          cursor: '(bm25(artifacts_fts)>? OR (bm25(artifacts_fts)=? AND a.id>?))'
        }
      : ordering(query.sort);
  const cursor = decodeCursor(query.cursor, query.sort, cursorKey);
  if (cursor) {
    conditions.push(order.cursor);
    params.push(...cursorParams(cursor.values));
  }
  const rankColumn = query.q && ftsJoin ? ',bm25(artifacts_fts) search_rank' : '';
  const result = await database
    .prepare(
      `SELECT a.*,${imageColumns}${rankColumn} FROM artifacts a ${ftsJoin} ${imageJoin} WHERE ${conditions.join(' AND ')} ORDER BY ${order.expr} LIMIT ?`
    )
    .bind(...params, query.limit + 1)
    .all<Row>();
  const rows = result.results;
  const hasMore = rows.length > query.limit;
  const visible = rows.slice(0, query.limit);
  const last = visible.at(-1);
  return {
    items: visible.map((row) => cardFromRow(row, assetBaseUrl)),
    nextCursor:
      hasMore && last
        ? encodeCursor({ sort: query.sort, key: cursorKey, values: order.values(last) })
        : null
  };
}

export async function getFeaturedArtifacts(
  database: D1Database,
  assetBaseUrl: string,
  limit = 6
): Promise<ArtifactCardView[]> {
  return (await getArtifacts(database, { sort: 'curated', limit }, assetBaseUrl)).items;
}
export async function getArtifactBySlug(
  database: D1Database,
  slug: string,
  assetBaseUrl: string
): Promise<ArtifactDetailView | null> {
  const base = (
    await database
      .prepare(
        `SELECT a.*,${imageColumns} FROM artifacts a ${imageJoin} WHERE a.slug=? AND a.publication_status='published'`
      )
      .bind(slug)
      .all<Row>()
  ).results[0];
  if (!base) return null;
  const imageRows = (
    await database
      .prepare(
        `SELECT i.id image_id,i.original_url,i.width image_width,i.height image_height,i.dominant_color,i.attribution image_attribution,i.license_identifier,i.license_url,${imageColumns.split('\n').slice(1).join('\n')} FROM artifact_images i WHERE i.artifact_id=? AND i.redistribution_allowed=1 AND i.original_object_key IS NOT NULL ORDER BY i.id`
      )
      .bind(base.id)
      .all<Row>()
  ).results;
  const sourceRows = (
    await database
      .prepare(
        'SELECT institution,source_url,accession_number,attribution,metadata_license FROM artifact_sources WHERE artifact_id=? ORDER BY institution'
      )
      .bind(base.id)
      .all<Row>()
  ).results;
  const relatedRows = (
    await database
      .prepare(
        `SELECT a.*,${imageColumns} FROM artifacts a ${imageJoin} WHERE a.publication_status='published' AND a.id<>? AND (a.search_cultures=? OR a.origin=?) ORDER BY a.quality_score DESC,a.id LIMIT 6`
      )
      .bind(base.id, base.search_cultures ?? '', base.origin ?? '')
      .all<Row>()
  ).results;
  const card = cardFromRow(base, assetBaseUrl);
  return {
    ...card,
    description: base.description as string | null,
    alternativeNames: JSON.parse(String(base.alternative_names ?? '[]')) as string[],
    materials: JSON.parse(String(base.materials ?? '[]')) as string[],
    dimensions: base.dimensions as string | null,
    earliestYear: base.earliest_year as number | null,
    latestYear: base.latest_year as number | null,
    dateUncertain: Boolean(base.date_uncertain),
    images: imageRows
      .map((row) => imageFromRow(row, assetBaseUrl, card.title))
      .filter((image): image is ArtifactImageView => image !== null),
    sources: sourceRows.map((row) => ({
      institution: String(row.institution),
      url: String(row.source_url),
      accessionNumber: row.accession_number as string | null,
      attribution: row.attribution as string | null,
      license: row.metadata_license as string | null
    })),
    related: relatedRows.map((row) => cardFromRow(row, assetBaseUrl))
  };
}
export async function getArtifactFilters(database: D1Database): Promise<ArtifactFilters> {
  const values = async (sql: string) =>
    (await database.prepare(sql).all<{ value: string }>()).results
      .map((row) => row.value)
      .filter(Boolean);
  return {
    cultures: await values(
      `SELECT value FROM (SELECT DISTINCT c.name value FROM cultures c JOIN artifact_cultures ac ON ac.culture_id=c.id JOIN artifacts a ON a.id=ac.artifact_id WHERE a.publication_status='published' UNION SELECT DISTINCT v.name value FROM civilizations v JOIN artifact_civilizations av ON av.civilization_id=v.id JOIN artifacts a ON a.id=av.artifact_id WHERE a.publication_status='published') ORDER BY value`
    ),
    countries: await values(
      "SELECT DISTINCT origin value FROM artifacts WHERE publication_status='published' AND origin IS NOT NULL ORDER BY value"
    ),
    types: await values(
      "SELECT DISTINCT artifact_type value FROM artifacts WHERE publication_status='published' AND artifact_type IS NOT NULL ORDER BY value"
    ),
    periods: await values(
      "SELECT DISTINCT historical_period value FROM artifacts WHERE publication_status='published' AND historical_period IS NOT NULL ORDER BY value"
    ),
    materials: await values(
      "SELECT DISTINCT m.value value FROM artifacts a,json_each(a.materials) m WHERE a.publication_status='published' ORDER BY value"
    )
  };
}
