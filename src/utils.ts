/**
 * Represents a directed graph using an adjacency list
 */
export interface Graph {
  nodes: number[]; // Array of unique nodes
  edges: [number, number][]; // Array of [from, to] edges
}