import './style.css'

const app = document.querySelector('#app')

app.innerHTML = `
  <div id="controls">
    <button id="undoButton">Undo</button>
    <button id="redoButton">Redo</button>
    <button id="clearButton">Clear</button>

    <label>
      Stroke width:
      <input
        id="strokeWidth"
        type="range"
        min="1"
        max="20"
        value="4"
      >
    </label>
  </div>

  <canvas id="canvas"></canvas>
`

const canvas = document.querySelector('#canvas')
const ctx = canvas.getContext('2d')
const undoButton = document.querySelector('#undoButton')
const redoButton = document.querySelector('#redoButton')
const clearButton = document.querySelector('#clearButton')
const strokeWidthInput = document.querySelector('#strokeWidth')

undoButton.addEventListener('click', undo)
redoButton.addEventListener('click', redo)
clearButton.addEventListener('click', clearCanvas)
strokeWidthInput.addEventListener('input', (event) => {
  strokeWidth = Number(event.target.value)
})

function clearCanvas() {
  strokes.length = 0
  redoStrokes.length = 0
  currentStroke = null

  ctx.clearRect(
    0,
    0,
    canvas.width,
    canvas.height
  )

  console.log('After clear:', strokes)
}

function resizeCanvas() {
  const rect = canvas.getBoundingClientRect()
  const dpr = window.devicePixelRatio || 1

  canvas.width = rect.width * dpr
  canvas.height = rect.height * dpr

  ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
}

resizeCanvas()

window.addEventListener('resize', resizeCanvas)

let isDrawing = false

const strokes = []
const redoStrokes = []

let currentStroke = null
let strokeWidth = 4

function redrawCanvas() {
  ctx.clearRect(
    0,
    0,
    canvas.width,
    canvas.height
  )

  for (const stroke of strokes) {
    if (stroke.points.length === 0) continue

    ctx.lineWidth = stroke.width

    ctx.beginPath()

    const firstPoint = stroke.points[0]

    ctx.moveTo(firstPoint.x, firstPoint.y)

    for (let i = 1; i < stroke.points.length; i++) {
      const point = stroke.points[i]

      ctx.lineTo(point.x, point.y)
    }

    ctx.stroke()
  }
}

function undo() {
  if (strokes.length === 0) return

  const stroke = strokes.pop()

  redoStrokes.push(stroke)

  redrawCanvas()
}

function redo() {
  if (redoStrokes.length === 0) return

  const stroke = redoStrokes.pop()

  strokes.push(stroke)

  redrawCanvas()
}

function getCanvasPoint(event) {
  const rect = canvas.getBoundingClientRect()

  return {
    x: event.clientX - rect.left,
    y: event.clientY - rect.top
  }
}

canvas.addEventListener('pointerdown', (event) => {
  isDrawing = true

  canvas.setPointerCapture(event.pointerId)

  const point = getCanvasPoint(event)

  currentStroke = {
    points: [point],
    width: strokeWidth
  }

  ctx.lineWidth = strokeWidth
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'

  ctx.beginPath()
  ctx.moveTo(point.x, point.y)
})

canvas.addEventListener('pointermove', (event) => {
  if (!isDrawing) return

  const point = getCanvasPoint(event)

  currentStroke.points.push(point)

  ctx.lineTo(point.x, point.y)
  ctx.stroke()
})

canvas.addEventListener('pointerup', (event) => {
  finishStroke(event)

  console.log('Current strokes:', strokes)
})

canvas.addEventListener('pointercancel', (event) => {
  finishStroke(event)
})

function finishStroke(event) {
  if (!isDrawing) return

  isDrawing = false

  if (currentStroke && currentStroke.points.length > 0) {
    strokes.push(currentStroke)
    redoStrokes.length = 0
  }

  currentStroke = null

  if (canvas.hasPointerCapture(event.pointerId)) {
    canvas.releasePointerCapture(event.pointerId)
  }

  console.log('Total strokes:', strokes.length)
}