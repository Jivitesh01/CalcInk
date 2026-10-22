import {
  InferenceEngine,
  loadVocab,
  preprocessStrokes,
  isStrokeMeaningful
} from 'ink-on/core'

let engine = null
let vocab = null

export async function loadRecognitionModel() {
  vocab = await loadVocab('/models/comer/vocab.json')

  engine = new InferenceEngine({
    encoderUrl: '/models/comer/encoder_int8.onnx',
    decoderUrl: '/models/comer/decoder_int8.onnx',
    beamWidth: 1,
    executionProvider: 'wasm'
  })

  await engine.init()

  return { engine, vocab }
}

export async function recognizeMath(modelStrokes) {
  if (!engine || !vocab) {
    throw new Error('Recognition model is not loaded yet')
  }

  if (!isStrokeMeaningful(modelStrokes)) {
    return null
  }

  const input = preprocessStrokes(modelStrokes)

  const result = await engine.recognize(
    input,
    vocab,
    'expression'
  )

  return result
}