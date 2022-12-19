export type AST = typeof Array<Node>

interface Tags {
  section: string
  endofsee: string
  endofaction: string
  text: string
  whiteline: string
}

export type Tag = keyof Tags

export interface Action {
  text: string[]
  direction: string | null
  edge?: string | null
}
export interface Node {
  id: number
  name: string
  rank: number
  see: string[]
  tag: Tag
  actions: Action[]
}
