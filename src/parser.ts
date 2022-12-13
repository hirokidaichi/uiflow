import { AST, Tag } from './interfaces'

const SECTION = /\[([^#\]]*)(#+)?\]/
const END_OF_SEES = /^-+$/
const END_OF_ACTION = /=+(?:{([^}]+)})?=+>\s*([^:\]]*)/
const WHITE_LINE = /^\s*$/

const lexer = (text: string): unknown => {
  return text.split(/\n/).map(parseByLine)
}

interface ParseResult {
  tag: Tag
  rank?: number
  actionText?: string
  api?: string
  num: number
  title?: string
  text?: string
}

const parseByLine = (line: string, num: number): ParseResult => {
  const section = line.match(SECTION)
  if (section !== null) {
    const rank = section[2].length
    const title = section[1]
    return {
      tag: 'section',
      title,
      rank,
      num: num,
    }
  }
  return { tag: 'text', num: num }
}

export function parse(text: string, fileName: string): AST {}
