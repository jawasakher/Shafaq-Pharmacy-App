#!/bin/bash
echo "=== Starting Cleanup of Old GitHub Releases ==="

# Get all releases ordered by creation date (newest first)
RELEASES=$(gh release list --limit 100 | awk -F'\t' '{print $3}')
if [ -z "$RELEASES" ]; then
  RELEASES=$(gh release list --limit 100 | awk '{print $1}')
fi

COUNT=0
for RELEASE in $RELEASES; do
  if [ -n "$RELEASE" ]; then
    COUNT=$((COUNT+1))
    if [ "$COUNT" -gt 2 ]; then
      echo "Deleting old release and tag: $RELEASE"
      gh release delete "$RELEASE" -y --cleanup-tag || true
    else
      echo "Keeping recent release: $RELEASE"
    fi
  fi
done

echo "=== Cleanup Complete ==="
