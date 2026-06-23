#!/bin/sh
# nextjs-skeletons audit. Read-only and idempotent. Prints:
#  - route segments missing a sibling loading file
#  - duplicate loading files
#  - server data fetch without coverage (with a distinct layout.* warning)
#  - client data hooks lacking a matched skeleton
#  - EXISTING skeletons that look broken (wrong color, missing a11y / reduced-motion)
#  - spinner-only / Loading... text
# Globs src/ variants and includes route groups. All lines are advisory; review each.

echo "== Router detection =="
for d in app src/app pages src/pages; do
  [ -d "$d" ] && echo "found: $d"
done

echo
echo "== App Router: page segments missing a sibling loading file =="
echo "(parallel route @slot folders own their own loading.tsx too; check those by hand)"
for root in app src/app; do
  [ -d "$root" ] || continue
  find "$root" -type f -name 'page.*' 2>/dev/null | while IFS= read -r p; do
    dir=$(dirname "$p")
    if ! ls "$dir"/loading.* >/dev/null 2>&1; then
      echo "MISSING loading: $dir"
    fi
  done
done

echo
echo "== Duplicate loading files in a single segment (should be at most one) =="
for root in app src/app; do
  [ -d "$root" ] || continue
  find "$root" -type d 2>/dev/null | while IFS= read -r dir; do
    n=$(ls "$dir"/loading.* 2>/dev/null | wc -l | tr -d ' ')
    [ "$n" -gt 1 ] && echo "DUPLICATE ($n) loading files: $dir"
  done
done

echo
echo "== Server data fetch in page/layout without proper coverage =="
echo "(layout.* is NOT covered by a sibling loading.*; it needs its own in-file Suspense)"
for root in app src/app; do
  [ -d "$root" ] || continue
  find "$root" -type f \( -name 'page.*' -o -name 'layout.*' \) 2>/dev/null | while IFS= read -r f; do
    if grep -qE 'await |fetch\(|prisma|drizzle' "$f" 2>/dev/null; then
      base=$(basename "$f")
      has_suspense=no; grep -q 'Suspense' "$f" 2>/dev/null && has_suspense=yes
      case "$base" in
        layout.*)
          # A sibling loading.* does NOT cover a data-awaiting layout; only in-file Suspense does.
          if [ "$has_suspense" = no ]; then
            echo "LAYOUT awaits data, loading.tsx will not cover it (add in-file Suspense): $f"
          fi
          ;;
        *)
          dir=$(dirname "$f")
          has_loading=no; ls "$dir"/loading.* >/dev/null 2>&1 && has_loading=yes
          if [ "$has_loading" = no ] && [ "$has_suspense" = no ]; then
            echo "SERVER FETCH no loading/Suspense: $f"
          fi
          ;;
      esac
    fi
  done
done

echo
echo "== Client data hooks that may lack a matched skeleton =="
for root in app src/app pages src/pages components src/components; do
  [ -d "$root" ] || continue
  grep -rlE "useSWR|useQuery|useFormStatus|useActionState|useEffect|(^|[^a-zA-Z])use\(" "$root" \
    --include='*.tsx' --include='*.jsx' 2>/dev/null | while IFS= read -r f; do
    grep -q "'use client'" "$f" 2>/dev/null || grep -q '"use client"' "$f" 2>/dev/null || continue
    grep -qiE 'Skeleton' "$f" 2>/dev/null || echo "CLIENT FETCH no Skeleton import: $f"
  done
done

echo
echo "== REVIEW existing skeleton: files that USE a Skeleton but look broken =="
echo "(Phase 5 targets: wrong color, missing a11y, missing reduced-motion, single box in a map)"
for root in app src/app pages src/pages components src/components; do
  [ -d "$root" ] || continue
  grep -rlE 'Skeleton' "$root" --include='*.tsx' --include='*.jsx' 2>/dev/null | while IFS= read -r f; do
    # hardcoded grays / raw colors break dark mode
    if grep -qE 'bg-(gray|slate|zinc|neutral|stone)-|#[0-9a-fA-F]{3,6}|rgb\(' "$f" 2>/dev/null; then
      echo "REVIEW existing skeleton (hardcoded color): $f"
    fi
    # missing a11y status region
    if ! grep -qE 'role="status"|aria-busy' "$f" 2>/dev/null; then
      echo "REVIEW existing skeleton (no role=status/aria-busy): $f"
    fi
    # animates but does not honor reduced motion
    if grep -qE 'animate-' "$f" 2>/dev/null && ! grep -q 'motion-reduce' "$f" 2>/dev/null; then
      echo "REVIEW existing skeleton (no motion-reduce): $f"
    fi
    # a single Skeleton with no .map and no repeat count, in a file that fetches a collection,
    # often means a card grid / table got one box. Flag single-skeleton files for a shape check.
    sk=$(grep -cE '<Skeleton' "$f" 2>/dev/null)
    if [ "$sk" = 1 ] && ! grep -qE '\.map\(|Array\.from' "$f" 2>/dev/null; then
      echo "REVIEW existing skeleton (single box, verify it is not standing in for a list/grid/table): $f"
    fi
  done
done

echo
echo "== Possible spinner-only / Loading... text where a matched skeleton belongs =="
for root in app src/app pages src/pages components src/components; do
  [ -d "$root" ] || continue
  grep -rnE 'Loading\.\.\.|>Loading<|animate-spin' "$root" \
    --include='*.tsx' --include='*.jsx' 2>/dev/null
done

echo
echo "Done. Lines are advisory. Apply fixes per SKILL.md phases, then re-run."