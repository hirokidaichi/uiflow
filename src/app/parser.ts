import { Action, Tag } from './interfaces'

const SECTION = /\[([^#\]]*)(#+)?]/
const END_OF_SEES = /^-+$/
const END_OF_ACTION = /=+(?:{([^}]+)})?=+>\s*([^:\]]*)/
const WHITE_LINE = /^\s*$/

interface LineParseResult {
  tag: Tag
  num: number
  rank?: number
  actionText?: string
  api?: string

  title?: string
  text?: string
}

type ParseResult = LineParseResult[]

type State = 'action' | 'see' | 'endaction'

interface TreeNode {
  id: number
  name: string
  rank: number
  lines: number
  see: string[]
  actions: Action[]
  state: State
}

type Tree = Record<string, TreeNode>

export class ParseError extends Error {
  public constructor(
    message: string,
    public lineNumber: number,
    public fileName: string
  ) {
    super(message)
  }
}

const lexer = (text: string): ParseResult => {
  return text.split(/\n/).map(parseByLine)
}
const parseError = (fileName: string) => {
  return (message: string, lineNumber: number) => {
    throw new ParseError(
      [fileName ?? '(anon)', ':', lineNumber, ': error:', message].join(''),
      lineNumber,
      fileName
    )
  }
}

const parseByLine = (line: string, num: number): LineParseResult => {
  const section = line.match(SECTION)
  if (section !== null) {
    const rank = section[2] !== undefined ? section[2].length : 0
    const title = section[1]
    return {
      tag: 'section',
      title,
      rank,
      num,
    }
  }

  const endOfSees = line.match(END_OF_SEES)
  if (endOfSees !== null) {
    return {
      tag: 'endofsee',
      num,
    }
  }

  const endOfAction = line.match(END_OF_ACTION)
  if (endOfAction !== null) {
    const actionText = endOfAction[2]
    const api = endOfAction[1]
    return {
      tag: 'endofaction',
      actionText,
      api,
      num,
    }
  }

  const whiteLine = line.match(WHITE_LINE)
  if (whiteLine !== null) {
    return {
      tag: 'whiteline',
      num,
    }
  }
  return { tag: 'text', text: line, num }
}

const parseTags = (listOfNode: LineParseResult[], fileName: string): Tree => {
  const tree: Tree = {}
  let nId = 1
  let currentSection: string
  let lastAction: Action = { text: [], direction: null }
  let actions: Action[]
  const errorMessage = parseError(fileName)

  listOfNode.forEach((node) => {
    const tag = node.tag
    if (tag === 'whiteline') {
      return
    }
    if (tag === 'section') {
      currentSection = node.title ?? ''
      if (lastAction?.direction == null) {
        lastAction.direction = currentSection
      }

      if (currentSection in tree) {
        errorMessage('Duplicated section:' + currentSection, node.num)
      }

      tree[currentSection] = {
        name: currentSection,
        rank: node.rank ?? 0,
        lines: node.num ?? 0,
        see: [],
        id: nId++,
        actions: [
          {
            text: [],
            direction: null,
            edge: null,
          },
        ],
        state: 'see',
      }
    }

    // endOfAction
    if (tag === 'endofaction') {
      if (!(currentSection in tree)) {
        errorMessage('Undefined section' + '\tL:', node.num)
      }
      actions = tree[currentSection].actions
      actions[actions.length - 1].direction = node.actionText ?? ''
      actions[actions.length - 1].edge = node.api ?? ''

      tree[currentSection].state = 'endaction'
    }

    // endOfSee
    if (tag === 'endofsee') {
      if (!(currentSection in tree)) {
        errorMessage(`Undefined section ${currentSection}]`, node.num)
      }

      if (tree[currentSection].state === 'action') {
        errorMessage('Duplicated sees' + '\tL:', node.num)
      }
      tree[currentSection].state = 'action'
    }

    // text
    if (tag === 'text') {
      if (!(currentSection in tree)) {
        errorMessage('Undefined section' + '\tL:', node.num)
      }

      let state = tree[currentSection].state

      if (state === 'see') {
        tree[currentSection].see.push(node.text ?? '')
      }

      if (state === 'endaction') {
        tree[currentSection].actions.push({
          text: [],
          direction: null,
        })
        state = tree[currentSection].state = 'action'
      }

      if (state === 'action') {
        actions = tree[currentSection].actions
        actions[actions.length - 1].text.push(node.text ?? '')
        lastAction = actions[actions.length - 1]
      }
    }
  })

  return tree
}

export function parse(text: string, fileName: string): Tree {
  return parseTags(lexer(text), fileName)
}
