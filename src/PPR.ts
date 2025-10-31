import type { Graph } from "./utils.ts";

/**
 * Compute Personalized PageRank (PPR)
 *
 * PPR is a variant of PageRank where the random surfer teleports back to a
 * specific set of seed nodes (personalization vector) instead of uniformly
 * to all nodes.
 *
 * @param graph The directed graph
 * @param personalization Either {seeds: number[]} for seed nodes or {vector: number[]} for custom personalization vector
 * @param damping Damping factor (default: 0.85)
 * @param maxIterations Maximum number of iterations (default: 100)
 * @param tolerance Convergence tolerance (default: 1e-6)
 * @returns Array of PPR scores for each node (indexed by position in graph.nodes)
 */
export function computePersonalizedPageRank(
  graph: Graph,
  personalization: { seeds: number[] } | { vector: number[] },
  damping: number = 0.85,
  maxIterations: number = 100,
  tolerance: number = 1e-6
): number[] {
  const { incomingEdges, outDegrees, danglingNodes, N, nodeToIndex } =
    preprocessGraph(graph);

  let personalizationVector: number[];

  if ("seeds" in personalization) {
    // Validate seed nodes
    if (personalization.seeds.length === 0) {
      throw new Error("seeds must contain at least one node");
    }

    // Convert seed nodes to indices and validate they exist
    const seedIndices: number[] = [];
    for (const seedNode of personalization.seeds) {
      const index = nodeToIndex.get(seedNode);
      if (index === undefined) {
        throw new Error(`Seed node ${seedNode} not found in graph`);
      }
      seedIndices.push(index);
    }

    // Build personalization vector (non-zero only for seed nodes)
    personalizationVector = new Array(N).fill(0);
    const seedWeight = 1 / seedIndices.length;
    for (const seedIndex of seedIndices) {
      personalizationVector[seedIndex] = seedWeight;
    }
  } else {
    // Validate personalization vector
    if (personalization.vector.length !== N) {
      throw new Error(
        `Personalization vector length (${personalization.vector.length}) must match number of nodes (${N})`
      );
    }

    // Verify vector sums to 1.0
    const sum = personalization.vector.reduce((acc, val) => acc + val, 0);
    if (Math.abs(sum - 1.0) > tolerance) {
      throw new Error(
        `Personalization vector must sum to 1.0 (current sum: ${sum})`
      );
    }

    // Verify all values are non-negative
    if (personalization.vector.some((val) => val < 0)) {
      throw new Error(
        "Personalization vector must contain only non-negative values"
      );
    }

    personalizationVector = personalization.vector;
  }

  // Initialize ranks with personalization vector
  let ranks = [...personalizationVector];

  for (let iter = 0; iter < maxIterations; iter++) {
    // Calculate dangling node contribution
    const danglingSum = danglingNodes.reduce(
      (acc, node) => acc + ranks[node],
      0
    );

    // Initialize all nodes with base rank from personalization vector and dangling nodes
    const newRanks = Array.from({ length: N }, (_, node) => {
      // Base rank: teleportation to this node + dangling contribution
      const teleportation = (1 - damping) * personalizationVector[node];
      const danglingContribution =
        damping * danglingSum * personalizationVector[node];
      let rank = teleportation + danglingContribution;

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
      console.log(`PPR converged after ${iter + 1} iterations`);
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
  nodeToIndex: Map<number, number>;
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
    nodeToIndex,
  };
}
