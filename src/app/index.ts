import fs from 'fs'
import stream from 'stream'
import parser from '../app/parser'
import dot from '../app/dotwriter'
import stringStream from 'string-to-stream'
import through2 from 'through2'

/*
 plugin : function(fileName,format) -> stream

 png := slurp | parse | dot | graphviz(png)

*/

const slurp = (fileName: string): stream.Transform => {
  const content = ''
  return through2.obj(
    function (chunk, enc, callback) {
      content.concat(chunk)
      callback()
    },
    function () {
      this.push({
        content: content,
        fileName: fileName,
      })
    }
  )
}

const pass = (obj: unknown): stream.Transform => {
  const start = stringStream('something')
  return start.pipe(
    through2.obj(function (chunk, enc, callback) {
      this.push(obj)
      callback()
    })
  )
}

type Pipe = () => stream.Transform

const parse: Pipe = () =>
  through2.obj(function (chunk, enc, callback) {
    try {
      const output = parser.parse(String(chunk.content), chunk.fileName)
      this.push(output)
    } catch (e) {
      callback(e)
      return
    }
    callback()
  })

const compile: Pipe = () => {
  return through2.obj(function (chunk, enc, callback) {
    try {
      const output = dot.compile(chunk)
      this.push(output)
    } catch (e) {
      console.log(e)
      callback(e)
      return
    }
    this.emit('end')
    callback()
  })
}
const jsonize: Pipe = () =>
  through2.obj(function (chunk, enc, callback) {
    const output = JSON.stringify(chunk, null, 2)
    this.push(output)
    callback()
  })
type Format = 'dot' | 'meta' | 'json' | 'png' | 'svg'
type Pipeline = Record<Format, Pipe[]>
const FORMAT_TO_PIPELINE = {
  dot: [parse, compile],
  meta: [parse, jsonize],
  json: [parse, jsonize],
  png: [parse, compile], // todo: add graphviz
  svg: [parse, compile], // todo: add graphviz
} satisfies Pipeline

type ErrorHandler = (e: Error) => void
const build = (
  fileName: string,
  format: Format,
  handleError: ErrorHandler
): stream.Transform => {
  const stream = fs.createReadStream(fileName).pipe(slurp(fileName))
  return composeStream(stream, format, handleError)
}

const composeStream = (
  stream: stream.Transform,
  format: Format,
  handleError: ErrorHandler
): stream.Transform => {
  const pipes = FORMAT_TO_PIPELINE[format]
  if (pipes === null) {
    throw new Error('undefined format')
  }
  return pipes.reduce((acc, n) => {
    const next = n()
    if (handleError !== null) next.on('error', handleError)
    return acc.pipe(next)
  }, stream)
}
const buildWithCode = (
  fileName: string,
  code: string,
  format: Format,
  handleError: ErrorHandler
): stream.Transform => {
  const stream = pass({
    fileName: fileName,
    content: code,
  })
  return composeStream(stream, format, handleError)
}
const DOT_PATH = 'dot' as const

const uiflow = {
  DOT_PATH,
  buildWithCode,
  build,
  parser,
  dot,
  FORMAT_TO_PIPELINE,
} as const

export default uiflow
