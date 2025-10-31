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
  const { incomingEdges, outDegrees, danglingNodes, N } =
    preprocessGraph(graph);

  let ranks = new Array(N).fill(1 / N);

  for (let i = 0; i < maxIterations; i++) {
    // Calculate dangling node contribution
    const danglingSum = danglingNodes.reduce(
      (acc, node) => acc + ranks[node],
      0
    );
    const danglingContribution = (damping * danglingSum) / N;

    // Base rank from damping factor and dangling nodes
    const baseRank = (1 - damping) / N + danglingContribution;

    // Initialize all nodes with base rank, then add contributions from incoming edges
    const newRanks = Array.from({ length: N }, (_, node) => {
      // Start with base rank
      let rank = baseRank;

      // Add contributions from all nodes that link to this node
      incomingEdges[node].forEach((fromNode) => {
        rank += (damping * ranks[fromNode]) / outDegrees[fromNode];
      });

      return rank;
    });

    // Check for convergence
    const diff = newRanks.reduce(
      (acc, rank, index) => acc + Math.abs(rank - ranks[index]),
      0
    );

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
 * Build reverse adjacency list (incoming edges) and compute out-degrees
 * @param graph
 */
function preprocessGraph(graph: Graph): {
  incomingEdges: number[][];
  outDegrees: number[];
  danglingNodes: number[];
  N: number;
} {
  const N = graph.nodes.length;

  // Create a mapping from original node names to their index
  const nodeToIndex = new Map<number, number>();
  graph.nodes.forEach((node, index) => {
    nodeToIndex.set(node, index);
  });

  // Build forward adjacency list (using Set to avoid parallel edges)
  const outgoingSet: Set<number>[] = Array.from(
    { length: N },
    () => new Set<number>()
  );

  // Build reverse adjacency list (incoming edges)
  const incomingSet: Set<number>[] = Array.from(
    { length: N },
    () => new Set<number>()
  );

  // Add edges to both adjacency sets, filtering out self-loops
  graph.edges.forEach(([from, to]) => {
    if (from !== to) {
      const fromIndex = nodeToIndex.get(from)!;
      const toIndex = nodeToIndex.get(to)!;
      outgoingSet[fromIndex].add(toIndex);
      incomingSet[toIndex].add(fromIndex);
    }
  });

  // Convert Sets to arrays
  const incomingEdges: number[][] = incomingSet.map((set) => Array.from(set));
  const outDegrees: number[] = outgoingSet.map((set) => set.size);

  // Find dangling nodes (nodes with no outgoing edges)
  const danglingNodes: number[] = outDegrees.flatMap((degree, index) =>
    degree === 0 ? [index] : []
  );

  return {
    incomingEdges,
    outDegrees,
    danglingNodes,
    N,
  };
}
