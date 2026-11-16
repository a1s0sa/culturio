#!/usr/bin/env bash
set -euo pipefail

usage() {
  cat <<'USAGE'
Usage: ./scripts/publish-remote-drafts.sh <moderator-email> [--yes|--dry-run]

Publishes every eligible draft in remote D1, copies its processed image variants
from culturio-unpublished to culturio-media, and records publication events.

Options:
  --yes       Skip the confirmation prompt
  --dry-run   List eligible drafts and image variants without changing anything
USAGE
}

moderator_email=""
assume_yes=false
dry_run=false
for argument in "$@"; do
  case "$argument" in
    --yes) assume_yes=true ;;
    --dry-run) dry_run=true ;;
    -h|--help) usage; exit 0 ;;
    -* ) echo "Unknown option: $argument" >&2; usage >&2; exit 2 ;;
    * )
      if [[ -n "$moderator_email" ]]; then
        echo "Only one moderator email is accepted." >&2
        usage >&2
        exit 2
      fi
      moderator_email="$argument"
      ;;
  esac
done

if [[ ! "$moderator_email" =~ ^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$ ]]; then
  echo "Pass the email address of the moderator who approved these records." >&2
  usage >&2
  exit 2
fi
if ! command -v jq >/dev/null 2>&1; then
  echo "jq is required. Install jq and retry." >&2
  exit 1
fi

wrangler() {
  pnpm --dir apps/web exec wrangler "$@"
}

moderator_json="$(wrangler d1 execute DB --remote --json --config wrangler.jsonc \
  --command "SELECT id FROM \"user\" WHERE email='${moderator_email}' AND role='moderator';")"
moderator_id="$(jq -r '.[0].results[0].id // empty' <<<"$moderator_json")"
if [[ -z "$moderator_id" ]]; then
  echo "No remote moderator account found for ${moderator_email}. Nothing changed." >&2
  exit 1
fi

drafts_sql="SELECT DISTINCT a.id AS artifact_id,a.title,i.id AS image_id,v.object_key,v.mime_type
FROM artifacts a
JOIN artifact_images i ON i.artifact_id=a.id
JOIN image_variants v ON v.image_id=i.id
WHERE a.publication_status='draft'
  AND i.redistribution_allowed=1
  AND i.processed_at IS NOT NULL
  AND i.original_object_key IS NOT NULL
  AND i.publication_status!='restricted'
ORDER BY a.id,i.id,v.name;"
drafts_json="$(wrangler d1 execute DB --remote --json --config wrangler.jsonc --command "$drafts_sql")"
if ! jq -e '.[0].success == true and (.[0].results | type == "array")' \
  >/dev/null <<<"$drafts_json"; then
  echo "Wrangler did not return the eligible drafts query." >&2
  exit 1
fi

mapfile -t artifact_ids < <(jq -r '[.[0].results[].artifact_id] | unique[]' <<<"$drafts_json")
if ((${#artifact_ids[@]} == 0)); then
  echo "No eligible remote drafts to publish. Nothing changed."
  exit 0
fi

mapfile -t variants < <(jq -r '.[0].results[] | [.object_key,.mime_type] | @tsv' <<<"$drafts_json")
mapfile -t summary < <(
  jq -r '[.[0].results[] | {artifact_id,title}] | unique_by(.artifact_id)[] | [.artifact_id,.title] | @tsv' \
    <<<"$drafts_json"
)
mapfile -t image_counts < <(
  jq -r '[.[0].results[] | {artifact_id,image_id}] | unique_by(.artifact_id + ":" + .image_id) | group_by(.artifact_id)[] | [.[0].artifact_id,(length|tostring)] | @tsv' \
    <<<"$drafts_json"
)

for entry in "${variants[@]}"; do
  IFS=$'\t' read -r key mime_type <<<"$entry"
  if [[ ! "$key" =~ ^[A-Za-z0-9/._-]+$ || "$mime_type" != "image/webp" ]]; then
    echo "Unexpected variant key or media type. Nothing changed." >&2
    exit 1
  fi
done
for id in "${artifact_ids[@]}"; do
  if [[ ! "$id" =~ ^[A-Za-z0-9_-]+$ ]]; then
    echo "Unexpected artifact ID. Nothing changed." >&2
    exit 1
  fi
done

printf 'Moderator: %s\nEligible drafts: %d\nImage variants to copy: %d\n' \
  "$moderator_email" "${#artifact_ids[@]}" "${#variants[@]}"
printf '  %s\n' "${summary[@]}"
if [[ "$dry_run" == true ]]; then
  echo "Dry run only. No R2 or D1 changes were made."
  exit 0
fi

if [[ "$assume_yes" != true ]]; then
  if [[ ! -t 0 ]]; then
    echo "Use --yes for a non-interactive run." >&2
    exit 2
  fi
  read -r -p "Copy images and publish these drafts? [y/N] " confirmation
  [[ "$confirmation" =~ ^[Yy]$ ]] || { echo "Cancelled. Nothing changed."; exit 0; }
fi

copied=0
for entry in "${variants[@]}"; do
  IFS=$'\t' read -r key mime_type <<<"$entry"
  wrangler r2 object get "culturio-unpublished/${key}" --remote --pipe --config wrangler.jsonc |
    wrangler r2 object put "culturio-media/${key}" --remote --pipe \
      --content-type "$mime_type" \
      --cache-control 'public, max-age=300, s-maxage=600' \
      --force --config wrangler.jsonc
  copied=$((copied + 1))
done
echo "Copied ${copied} image variants to culturio-media."

sql_file="$(mktemp "${TMPDIR:-/tmp}/culturio-publish-remote.XXXXXX.sql")"
trap 'rm -f "$sql_file"' EXIT
now_ms="$(($(date +%s) * 1000))"
note="Published via Wrangler at moderator request"

for id in "${artifact_ids[@]}"; do
  printf "UPDATE artifacts SET publication_status='published',updated_at=%s\n" "$now_ms" >>"$sql_file"
  printf "WHERE id='%s' AND publication_status='draft'\n" "$id" >>"$sql_file"
  cat >>"$sql_file" <<'SQL'
AND EXISTS (
  SELECT 1 FROM artifact_images i WHERE i.artifact_id=artifacts.id
  AND i.redistribution_allowed=1 AND i.processed_at IS NOT NULL
  AND i.original_object_key IS NOT NULL AND i.publication_status!='restricted'
  AND EXISTS (SELECT 1 FROM image_variants v WHERE v.image_id=i.id)
);
SQL

  printf "INSERT INTO artifact_publication_events(id,artifact_id,moderator_id,action,note,created_at)\n" >>"$sql_file"
  printf "SELECT lower(hex(randomblob(16))),a.id,(SELECT id FROM \"user\" WHERE email='%s' AND role='moderator'),'publish','%s',%s\n" \
    "$moderator_email" "$note" "$now_ms" >>"$sql_file"
  printf "FROM artifacts a WHERE a.id='%s' AND a.publication_status='published' AND changes()=1\n" "$id" >>"$sql_file"
  printf "AND EXISTS (SELECT 1 FROM \"user\" WHERE email='%s' AND role='moderator');\n" "$moderator_email" >>"$sql_file"

  printf "UPDATE artifact_images SET publication_status='published',updated_at=%s\n" "$now_ms" >>"$sql_file"
  printf "WHERE artifact_id='%s' AND redistribution_allowed=1 AND processed_at IS NOT NULL\n" "$id" >>"$sql_file"
  cat >>"$sql_file" <<'SQL'
AND original_object_key IS NOT NULL AND publication_status!='restricted'
AND EXISTS (SELECT 1 FROM image_variants v WHERE v.image_id=artifact_images.id)
SQL
  printf "AND EXISTS (SELECT 1 FROM artifact_publication_events e WHERE e.artifact_id='%s'\n" "$id" >>"$sql_file"
  printf "  AND e.action='publish' AND e.note='%s' AND e.created_at=%s\n" "$note" "$now_ms" >>"$sql_file"
  printf "  AND e.moderator_id=(SELECT id FROM \"user\" WHERE email='%s'));\n\n" "$moderator_email" >>"$sql_file"
done

wrangler d1 execute DB --remote --yes --config wrangler.jsonc --file "$sql_file"

id_list="$(printf "'%s'," "${artifact_ids[@]}")"
id_list="${id_list%,}"
verify_sql="SELECT COUNT(DISTINCT a.id) AS published_count FROM artifacts a
JOIN artifact_publication_events e ON e.artifact_id=a.id AND e.action='publish'
WHERE a.id IN (${id_list}) AND a.publication_status='published'
  AND e.moderator_id=(SELECT id FROM \"user\" WHERE email='${moderator_email}' AND role='moderator');"
verification="$(wrangler d1 execute DB --remote --json --config wrangler.jsonc --command "$verify_sql")"
published_count="$(jq -r '.[0].results[0].published_count // 0' <<<"$verification")"
if [[ "$published_count" != "${#artifact_ids[@]}" ]]; then
  echo "Expected ${#artifact_ids[@]} publications, but D1 verified ${published_count}. Check remote D1 before retrying." >&2
  exit 1
fi

echo "Published and audited ${published_count} artifacts."
for entry in "${image_counts[@]}"; do
  IFS=$'\t' read -r id count <<<"$entry"
  printf '  %s: %s eligible images\n' "$id" "$count"
done
