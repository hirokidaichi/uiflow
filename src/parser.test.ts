import { parse } from './parser'
import fs from 'fs'
test('parser', () => {
  const md = fs.readFileSync('sample/01.txt', 'utf8')
  const result = parse(md, 'hoge.uif')
  console.log(result)
})
