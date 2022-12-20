import { compile, edge, graph, node } from './dotwriter'

const dot = {
  compile,
  graph,
  node,
  edge,
} as const

export default dot
