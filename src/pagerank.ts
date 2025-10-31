/**
 * Represents a directed graph using an adjacency list
 */
export interface Graph {
  nodes: number[]; // Array of unique nodes
  edges: [number, number][]; // Array of [from, to] edges
}

export function computePageRank(
  graph: Graph,
  damping: number = 0.85,
  maxIterations: number = 100,
  tolerance: number = 1e-6
): number[] {
  const { graph: cleanedGraph, danglingNodes } = preprocessGraph(graph);
  const N = cleanedGraph.nodes.length;
  const nodes = cleanedGraph.nodes;
  const outDegrees = new Array(N).fill(0);
  cleanedGraph.edges.forEach((edge) => {
    outDegrees[edge[0]]++;
  });

  let ranks = new Array(N).fill(1 / N);

  for (let i = 0; i < maxIterations; i++) {
    const newRanks = new Array(N).fill(0);
    const danglingSum = danglingNodes.reduce((acc, node) => acc + ranks[node], 0);

    nodes.forEach((node) => {
      const danglingContribution = danglingSum / N;
      const dampingTerm = (1 - damping) / N;
      const contribution = dampingTerm + damping * danglingContribution;
      cleanedGraph.edges[node].forEach((neighbor) => {
        newRanks[neighbor] += contribution / outDegrees[node];
      });
    });

    const diff = newRanks.reduce((acc, rank, index) => acc + Math.abs(rank - ranks[index]), 0);

    ranks = newRanks;

    if (diff < tolerance) {
      console.log(`Converged after ${i + 1} iterations`);
      break;
    }
  }

  return ranks;
}

/**
 * Remove self-loops and parallel edges
 * Rename nodes to their position in the nodes array
 * @param graph
 */
function preprocessGraph(graph: Graph): {
  graph: Graph;
  danglingNodes: number[];
} {
  // Create a mapping from original node names to their index
  const nodeToIndex = new Map<number, number>();
  graph.nodes.forEach((node, index) => {
    nodeToIndex.set(node, index);
  });

  const edges = new Map<number, Set<number>>();
  for (const [from, to] of graph.edges) {
    if (from === to) {
      continue;
    }
    // Use the index instead of the original node name
    const fromIndex = nodeToIndex.get(from)!;
    const toIndex = nodeToIndex.get(to)!;

    if (!edges.has(fromIndex)) {
      edges.set(fromIndex, new Set<number>());
    }
    edges.get(fromIndex)!.add(toIndex);
  }

  // Dangling nodes are now represented by their indices
  const danglingNodes: number[] = [];
  for (let i = 0; i < graph.nodes.length; i++) {
    if (!edges.has(i)) {
      danglingNodes.push(i);
    }
  }

  const edgesArray: [number, number][] = [];
  for (const [from, toSet] of edges) {
    for (const to of toSet) {
      edgesArray.push([from, to]);
    }
  }

  return {
    graph: {
      nodes: Array.from({ length: graph.nodes.length }, (_, i) => i),
      edges: edgesArray,
    },
    danglingNodes,
  };
}
