import './style.css'

const app = document.querySelector('#app')

app.innerHTML = `
  <div id="controls">
    <button id="undoButton">Undo</button>
    <button id="redoButton">Redo</button>
    <button id="clearButton">Clear</button>
    <button id="penButton">Pen</button>
    <button id="eraserButton">Stroke Eraser</button>
    <button id="pixelEraserButton">Pixel Eraser</button>

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
const penButton = document.querySelector('#penButton')
const pixelEraserButton = document.querySelector('#pixelEraserButton')
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

  const width = Math.round(rect.width * dpr)
  const height = Math.round(rect.height * dpr)

  const sizeChanged =
    canvas.width !== width ||
    canvas.height !== height

  if (sizeChanged) {
    canvas.width = width
    canvas.height = height
  }

  ctx.setTransform(dpr, 0, 0, dpr, 0, 0)

  if (sizeChanged) {
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    redrawCanvas()
  }
}


let isDrawing = false
let isPixelErasing = false
let activePointerId = null
let activeTool = 'pen'
let currentStroke = null
let strokeWidth = 4

const strokes = []

const history = []
let historyIndex = -1
saveHistory()
resizeCanvas()

window.addEventListener('resize', resizeCanvas)

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

function finishPixelErasing(event) {
  if (!isPixelErasing) return

  isPixelErasing = false

  saveHistory()

  if (canvas.hasPointerCapture(event.pointerId)) {
    canvas.releasePointerCapture(event.pointerId)
  }
}

function erasePixels(point) {
  const eraserRadius = 15
  const updatedStrokes = []

  for (const stroke of strokes) {
    let remainingPoints = []

    for (const strokePoint of stroke.points) {
      const dx = strokePoint.x - point.x
      const dy = strokePoint.y - point.y

      const distance = Math.sqrt(dx * dx + dy * dy)

      if (distance <= eraserRadius + stroke.width / 2) {
        if (remainingPoints.length >= 2) {
          updatedStrokes.push({
            points: remainingPoints,
            width: stroke.width
          })
        }

        remainingPoints = []
      } else {
        remainingPoints.push(strokePoint)
      }
    }

    if (remainingPoints.length >= 2) {
      updatedStrokes.push({
        points: remainingPoints,
        width: stroke.width
      })
    }
  }

  strokes.length = 0
  strokes.push(...updatedStrokes)

  redrawCanvas()
}

function selectTool(tool) {
  activeTool = tool

  penButton.disabled = tool === 'pen'
  eraserButton.disabled = tool === 'strokeEraser'
  pixelEraserButton.disabled = tool === 'pixelEraser'
}

penButton.addEventListener('click', () => {
  selectTool('pen')
})

eraserButton.addEventListener('click', () => {
  selectTool('strokeEraser')
})

pixelEraserButton.addEventListener('click', () => {
  selectTool('pixelEraser')
})

selectTool('pen')

canvas.addEventListener('pointerdown', (event) => {
  if (activePointerId !== null) return

  activePointerId = event.pointerId
  canvas.setPointerCapture(event.pointerId)

  if (activeTool === 'strokeEraser') {
    eraseStroke(event)
    return
  }

if (activeTool === 'pixelEraser') {
  isPixelErasing = true

  canvas.setPointerCapture(event.pointerId)

  erasePixels(getCanvasPoint(event))
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
  if (event.pointerId !== activePointerId) return

  if (isPixelErasing) {
    erasePixels(getCanvasPoint(event))
    return
  }

  if (!isDrawing) return

  const point = getCanvasPoint(event)

  currentStroke.points.push(point)

  ctx.lineTo(point.x, point.y)
  ctx.stroke()
})

function endPointerInteraction(event) {
  if (event.pointerId !== activePointerId) return

  if (isPixelErasing) {
    finishPixelErasing(event)
  } else if (isDrawing) {
    finishStroke(event)
  }

  if (canvas.hasPointerCapture(event.pointerId)) {
    canvas.releasePointerCapture(event.pointerId)
  }

  activePointerId = null
}

canvas.addEventListener('pointerup', endPointerInteraction)

canvas.addEventListener('pointercancel', endPointerInteraction)

canvas.addEventListener('lostpointercapture', (event) => {
  if (event.pointerId !== activePointerId) return

  if (isPixelErasing) {
    finishPixelErasing(event)
  } else if (isDrawing) {
    finishStroke(event)
  }

  activePointerId = null
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