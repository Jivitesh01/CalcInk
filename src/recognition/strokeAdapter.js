
export function toModelStrokes(strokes) {
  return strokes.map(stroke => ({
    points: stroke.points.map(point => ({
      x: point.x,
      y: point.y
    })),
    lineWidth: stroke.width
  }))
}
