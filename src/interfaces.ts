export type AST = typeof Array<Node>

interface Tags {
    endOfSection: string
}
export interface Node {
    tag: keyof Tags
}
