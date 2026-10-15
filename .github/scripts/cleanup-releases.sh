#!/bin/bash
echo "=== Starting Cleanup of Old GitHub Releases ==="

# Get all releases ordered by creation date (newest first)
# Using awk to extract only the tag names
RELEASES=$(gh release list --limit 100 | awk -F'\t' '{print $1}')

COUNT=0
for RELEASE in $RELEASES; do
  COUNT=$((COUNT+1))
  if [ "$COUNT" -gt 2 ]; then
    echo "Deleting old release and tag: $RELEASE"
    gh release delete "$RELEASE" -y --cleanup-tag
  else
    echo "Keeping recent release: $RELEASE"
  fi
done

echo "=== Cleanup Complete ==="
