import { parse } from './parser'
import fs from 'fs'
test('parser', () => {
  const md = fs.readFileSync('sample/simple-graph.txt', 'utf8')
  const result = parse(md, 'hoge.uif')
  expect(result).toMatchSnapshot()
})
