// A function to calculate the similarity between two sentences
// based on the number of common words
function similarity(s1, s2) {
  let words1 = s1.sentence.split(" ");
  let words2 = s2.sentence.split(" ");
  let common = words1.filter((word) => words2.includes(word));
  return common.length / (Math.log(words1.length) + Math.log(words2.length));
}

// A function to create a graph of sentences
// based on their similarity scores
function createGraph(sentences) {
  let graph = [];
  for (let i = 0; i < sentences.length; i++) {
    let row = [];
    for (let j = 0; j < sentences.length; j++) {
      if (i == j) {
        row.push(0); // no self loops
      } else {
        row.push(similarity(sentences[i], sentences[j]));
      }
    }
    graph.push(row);
  }
  return graph;
}

// A function to normalize the graph
// by dividing each row by its sum
function normalizeGraph(graph) {
  let normalized = [];
  for (let i = 0; i < graph.length; i++) {
    let row = graph[i];
    let sum = row.reduce((a, b) => a + b, 0);
    if (sum == 0) {
      normalized.push(row); // avoid division by zero
    } else {
      normalized.push(row.map((x) => x / sum));
    }
  }
  return normalized;
}

// A function to calculate the TextRank scores
// using the power iteration method
function textRank(graph, d = 0.85, eps = 0.001) {
  let n = graph.length;
  let scores = new Array(n).fill(1 / n); // initial scores
  let delta = Infinity; // initial difference
  while (delta > eps) {
    // loop until convergence
    let newScores = new Array(n).fill((1 - d) / n); // damping factor
    for (let i = 0; i < n; i++) {
      // update scores based on graph
      for (let j = 0; j < n; j++) {
        newScores[i] += d * graph[j][i] * scores[j];
      }
    }
    delta = 0; // calculate difference
    for (let i = 0; i < n; i++) {
      delta += Math.abs(newScores[i] - scores[i]);
    }
    scores = newScores; // update scores
  }
  return scores;
}

// A function to extract keywords or summaries
// based on the TextRank scores and a threshold
function extract(sentences, scores, threshold) {
  let extracted = [];
  for (let i = 0; i < sentences.length; i++) {
    if (scores[i] >= threshold) {
      extracted.push(sentences[i]);
    }
  }
  return extracted;
}

function summarize(sentences) {
  // Create a graph of sentences
  let graph = createGraph(sentences);

  // Normalize the graph
  let normalized = normalizeGraph(graph);

  // Calculate the TextRank scores
  let scores = textRank(normalized);

  let copyScores = scores;
  copyScores.sort((a, b) => b - a);

  // Extract the summary
  let summary = extract(
    sentences,
    scores,
    (copyScores[0] + copyScores[2] + copyScores[4]) / 3.5
  );

  // Print the summary
  return summary;
}

module.exports = {
  summarize,
};
