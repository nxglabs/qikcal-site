#!/bin/sh
set -eu

ROOT="$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)"
FRAME_DIR="$ROOT/.build/launch-preview"
mkdir -p "$FRAME_DIR" "$ROOT/dist/assets"

swift "$ROOT/scripts/compose-launch-preview.swift" "$ROOT/assets/launch-demo" "$FRAME_DIR"

ffmpeg -y -hide_banner -loglevel error \
  -loop 1 -framerate 30 -t 3.8 -i "$FRAME_DIR/01-preview.png" \
  -loop 1 -framerate 30 -t 3.8 -i "$FRAME_DIR/02-preview.png" \
  -loop 1 -framerate 30 -t 3.8 -i "$FRAME_DIR/03-preview.png" \
  -loop 1 -framerate 30 -t 3.8 -i "$FRAME_DIR/04-preview.png" \
  -loop 1 -framerate 30 -t 3.8 -i "$FRAME_DIR/05-end-card.png" \
  -filter_complex "\
    [0:v]fps=30,settb=AVTB,setpts=PTS-STARTPTS,format=yuv420p[v0];\
    [1:v]fps=30,settb=AVTB,setpts=PTS-STARTPTS,format=yuv420p[v1];\
    [2:v]fps=30,settb=AVTB,setpts=PTS-STARTPTS,format=yuv420p[v2];\
    [3:v]fps=30,settb=AVTB,setpts=PTS-STARTPTS,format=yuv420p[v3];\
    [4:v]fps=30,settb=AVTB,setpts=PTS-STARTPTS,format=yuv420p[v4];\
    [v0][v1]xfade=transition=fade:duration=0.45:offset=3.35[m1];\
    [m1][v2]xfade=transition=fade:duration=0.45:offset=6.70[m2];\
    [m2][v3]xfade=transition=fade:duration=0.45:offset=10.05[m3];\
    [m3][v4]xfade=transition=fade:duration=0.45:offset=13.40,format=yuv420p[outv]" \
  -map "[outv]" -an -r 30 -c:v libx264 -preset medium -crf 23 \
  -movflags +faststart -metadata title="QikCal iPhone food diary preview" \
  "$ROOT/dist/assets/launch-preview.mp4"

ffmpeg -y -hide_banner -loglevel error \
  -i "$FRAME_DIR/01-preview.png" -frames:v 1 -q:v 2 \
  "$ROOT/dist/assets/launch-preview-poster.jpg"
