import { parse } from './parser'
import fs from 'fs'
test('parser', () => {
  fs.readdirSync('sample').forEach((f) => {
    const fileName = `sample/${f}`
    const md = fs.readFileSync(fileName, 'utf8')
    const result = parse(md, fileName)
    expect(result).toMatchSnapshot()
  })
})
