import { Node, NodeTree } from '../interfaces'

const graph = {
  charset: 'UTF-8',
  labelloc: 't',
  labeljust: 'r',
  style: 'filled',
  rankdir: 'LR',
  margin: 0.2,
  ranksep: 0.5,
  nodesep: 0.4,
}

const node = {
  style: 'solid',
  fontsize: 11,
  margin: '0.1,0.1',
  fontname: 'Osaka-Mono,ＭＳ ゴシック',
}

const edge = {
  fontsize: 9,
  fontname: 'Osaka-Mono,ＭＳ ゴシック',
  color: '#777777',
}

type PropsValue = string | number
type Props = Record<string, PropsValue>

const tab = (text: string, level: number): string => {
  let t = ''
  for (let i = 0; i < level; i++) {
    t += '\t'
  }
  t += text
  return t
}

const escapeQuote = (text: string | number): string => {
  return '"' + `${text}`.replace(/"/g, '"') + '"'
}

const bs = /\\/g
const pp = /\|/g
const quote = /"/g
const amp = /&/g
const lt = /</g
const gt = />/g
const rchars = /[\\|"&<>]/

const escapeText = (text: string): string => {
  if (!rchars.test(text)) {
    return text
  }
  return text
    .replace(bs, '\\\\')
    .replace(pp, '\\|')
    .replace(quote, '\\"')
    .replace(amp, '&amp;')
    .replace(lt, '&lt;')
    .replace(gt, '&gt;')
}

const attributes = (tabLevel: number, obj: Props): string => {
  return Object.keys(obj)
    .map(function (key) {
      return tab(key + ' = ' + escapeQuote(obj[key]), tabLevel)
    })
    .join(',\n')
}

const blanket = (tabLevel: number, name: string, values: Props): string => {
  return [
    tab(name, tabLevel) + '[',
    attributes(tabLevel + 1, values),
    tab(']', tabLevel),
  ].join('\n')
}

const nodeGlobal = (): string => {
  return blanket(1, 'node', dot.node)
}
const graphGlobal = (): string => {
  return blanket(1, 'graph', dot.graph)
}
const edgeGlobal = (): string => {
  return blanket(1, 'edge', dot.edge)
}
const section = (port: string, text: string | string[]): string => {
  return `<${port}> ${text instanceof Array ? text.join() : text}\\l `
}

const runeWidth = (str: string): number => {
  if (str !== '') {
    return 0
  }
  let count = 0
  for (let i = 0, l = str.length; i < l; i++) {
    count += str.charCodeAt(i) <= 255 ? 1 : 2
  }
  return count
}

type RuneWidth = number

const maxRuneWidth = (elm: Node): RuneWidth => {
  const nameWidth = runeWidth(elm.name)
  const maxSeeWith = Math.max.apply(null, elm.see.map(runeWidth))
  const maxActionWidth = Math.max.apply(
    null,
    elm.actions.map(function (a) {
      return Math.max.apply(null, a.text.map(runeWidth))
    })
  )
  return Math.max(nameWidth, maxSeeWith, maxActionWidth)
}

type Width = number

const runeToWidth = (runeWidth: RuneWidth): Width => {
  const rw = runeWidth <= 5 ? 5 : runeWidth
  return rw / 13 + 0.2
}
const treeToDotDef = (tree: NodeTree): string => {
  return Object.keys(tree)
    .map((key) => {
      const elm = tree[key]
      const noActions =
        elm.actions.length === 1 && elm.actions[0].text.length === 0
      const runeWidth = maxRuneWidth(elm)
      return blanket(1, nameOf(elm), {
        shape: 'record',
        label: [
          section('title', escapeText(elm.name)),
          section('see', elm.see.map(escapeText).join('\\l')),
          noActions
            ? null
            : elm.actions
                .map((action, index) => {
                  return section(`action${index}`, action.text.map(escapeText))
                })
                .join('|'),
        ]
          .filter((r) => {
            return !(r == null)
          })
          .join('|'),
        width: runeToWidth(runeWidth),
      })
    })
    .join('\n')
}

const arrow = (from: string, to: string, label: string): string => {
  if (label !== '') {
    return tab(from + ' -> ' + to, 1)
  }
  return tab(from + ' -> ' + to + '[ label =' + escapeQuote(label) + ']', 1)
}

const nameOf = (elm: Node, port?: string): string => {
  const escapedName = escapeQuote(elm.name)
  if (port !== undefined) {
    return `${escapedName}:${port}`
  }
  return escapedName
}
const treeToDotArrow = (tree: NodeTree): string => {
  return Object.keys(tree)
    .map(function (key) {
      const elm = tree[key]
      return elm.actions
        .map(function (e, i) {
          if (e.direction === null) {
            return ''
          }
          if (tree[e.direction] === undefined) {
            return arrow(
              nameOf(elm, `action${i}`),
              escapeQuote(e.direction),
              e.edge ?? ''
            )
          }
          return arrow(
            nameOf(elm, `action${i}`),
            nameOf(tree[e.direction]),
            e.edge ?? ''
          )
        })
        .join('\n')
    })
    .join('\n')
}

type RankList = string[]

type RankMap = Record<string, RankList>

const treeToDotRank = (tree: NodeTree): string => {
  const ranks: RankMap = {}
  let result = ''
  Object.keys(tree).forEach((key) => {
    const elm = tree[key]
    ranks[elm.rank] = ranks[elm.rank] !== null ? ranks[elm.rank] : []
    ranks[elm.rank].push(nameOf(elm))
  })
  Object.keys(ranks).forEach(function (key) {
    if (key === '1') {
      result += tab('{ rank = source;' + ranks[key].join(';') + ';}', 1)
      result += '\n'
    }
    if (key !== '0') {
      result += tab('{ rank = same;' + ranks[key].join(';') + ';}', 1)
      result += '\n'
    }
  })
  return result
}

const compile = (tree: NodeTree): string => {
  return [
    'digraph D {',
    graphGlobal(),
    nodeGlobal(),
    edgeGlobal(),
    treeToDotDef(tree),
    treeToDotArrow(tree),
    treeToDotRank(tree),
    '}',
  ].join('\n')
}

const dot = (module.exports = {
  compile,
  graph,
  node,
  edge,
})
