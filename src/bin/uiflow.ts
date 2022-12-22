import uiflow from '../app'
import { Format } from '../app/interfaces'
import { makeCommand, makeStringFlag, reduceFlag } from 'marron-glace'
import fs from 'fs'

const error = (error: String): void => {
  console.error(error)
  process.exit(-1)
}
const name = 'uiflow' as const
const inputFlag = makeStringFlag('input', {
  alias: 'i',
  usage: `Set target 'FILE' or 'DIR' like ./sample/xx.txt`,
})
const outFlag = makeStringFlag('out', {
  alias: 'o',
  usage: `Write output to 'FILE'`,
})

const formatFlag = makeStringFlag('format', {
  usage: `Set output format`,
  default: 'dot',
})

const flags = reduceFlag(inputFlag, outFlag, formatFlag)
const command = makeCommand({
  name,
  flag: flags,
  handler: (_, flags) => {
    const inputFile = flags.input.value
    const outputFile = flags.out.value
    const format = flags.format.value
    if (inputFile === undefined) {
      error("Should be set inputFiles like 'uiflow -i target.txt'")
      return
    }
    const out = outputFile !== undefined
      ? fs.createWriteStream(outputFile, {
        flags: 'w',
        fd: undefined,
        autoClose: true,
      })
      : process.stdout


    uiflow.build(inputFile, format as Format).pipe(out)
  },
  description:
    'uiflow is the simplest way to write down your ui-flow diagram like markdown.',
  version: '2.0.0',
})

command(process.argv.splice(2))

