import { parse } from './parser'
test('parser', () => {
  const result = parse(
    `[hoge]
  test
  `,
    'hoge.uif'
  )
  console.log(result)
})
