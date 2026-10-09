import './style.css'

const app = document.querySelector('#app')

app.innerHTML = `
  <div id="controls">
    <button id="undoButton">Undo</button>
    <button id="redoButton">Redo</button>
    <button id="clearButton">Clear</button>
    <button id="eraserButton">Stroke Eraser</button>

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
const eraserButton = document.querySelector('#eraserButton')
const strokeWidthInput = document.querySelector('#strokeWidth')

undoButton.addEventListener('click', undo)
redoButton.addEventListener('click', redo)
clearButton.addEventListener('click', clearCanvas)
strokeWidthInput.addEventListener('input', (event) => {
  strokeWidth = Number(event.target.value)
})

function clearCanvas() {
  if (strokes.length === 0) return

  strokes.length = 0
  currentStroke = null

  redrawCanvas()

  saveHistory()

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
let isErasing = false
let currentStroke = null
let strokeWidth = 4

const strokes = []

const history = []
let historyIndex = -1
saveHistory()

function saveHistory() {
  const snapshot = structuredClone(strokes)

  history.splice(historyIndex + 1)

  history.push(snapshot)

  historyIndex++
}

function restoreHistory() {
  strokes.length = 0

  strokes.push(
    ...structuredClone(history[historyIndex])
  )

  redrawCanvas()
}

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
  if (historyIndex <= 0) return

  historyIndex--

  restoreHistory()
}

function redo() {
  if (historyIndex >= history.length - 1) return

  historyIndex++

  restoreHistory()
}

function getCanvasPoint(event) {
  const rect = canvas.getBoundingClientRect()

  return {
    x: event.clientX - rect.left,
    y: event.clientY - rect.top
  }
}

function eraseStroke(event) {
  const point = getCanvasPoint(event)

  const eraserRadius = 15

  for (let i = strokes.length - 1; i >= 0; i--) {
    const stroke = strokes[i]

    for (const strokePoint of stroke.points) {
      const dx = strokePoint.x - point.x
      const dy = strokePoint.y - point.y

      const distance = Math.sqrt(
        dx * dx + dy * dy
      )

      if (distance <= eraserRadius) {

        strokes.splice(i, 1)

        redrawCanvas()

        saveHistory()

        return
      }
    }
  }
}

eraserButton.addEventListener('click', () => {
  isErasing = !isErasing

  eraserButton.textContent =
    isErasing ? 'Exit Eraser' : 'Stroke Eraser'
})

canvas.addEventListener('pointerdown', (event) => {
  if (isErasing) {
    eraseStroke(event)
    return
  }

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
    saveHistory()
  }

  currentStroke = null

  if (canvas.hasPointerCapture(event.pointerId)) {
    canvas.releasePointerCapture(event.pointerId)
  }

  console.log('Total strokes:', strokes.length)
}