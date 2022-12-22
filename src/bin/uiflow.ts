import fs from 'fs'
import uiflow from '../app'
import { Format } from '../app/interfaces'

let INPUT_FILE: string
let OUTPUT_FILE: string
const FORMAT: Format = 'dot'

const error = (error: Error): void => {
  console.error(error)
  process.exit(-1)
}

op.programName('uiflow')
op.addOption('h', 'help', 'Display this message').action(op.helpAction())
op.addOption('i', 'input', "Set target 'FILE' or 'DIR' like ./sample/xx.txt")
  .argument('FILE|DIR')
  .action(function (d) {
    INPUT_FILE = d
  })
op.addOption('o', 'out', "Write output to 'FILE'")
  .argument('FILE')
  .action(function (d) {
    OUTPUT_FILE = d
  })
op.addOption('f', 'format', 'Set output format')
  .argument('dot=default|json|svg|png')
  .action(function (d) {
    FORMAT = d
  })

op.parse()
if (INPUT_FILE === undefined)
  error("Should be set inputFiles like 'uiflow -i target.txt'")

var output = OUTPUT_FILE
  ? fs.createWriteStream(OUTPUT_FILE, {
      flags: 'w',
      defaultEncoding: 'utf8',
      fd: null,
      autoClose: true,
    })
  : process.stdout

uiflow.build(INPUT_FILE, FORMAT).pipe(output)
