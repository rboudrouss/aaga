import { computePageRank, Graph } from "./src/pagerank.ts";

const graph: Graph = {
  nodes: [0, 1],
  edges: [
    [0, 1],
    [1, 1],
    [1, 0],
  ],
};

if (import.meta.main) {
  console.log(computePageRank(graph));
}
