// This file is the math.js. It contains utility functions for mathematical operations, including a function to calculate the cosine similarity between two vectors. The cosine similarity is a measure of similarity between two non-zero vectors of an inner product space. It is defined as the cosine of the angle between them, which can be computed using the dot product and the magnitudes of the vectors.
function cosineSim(a, b) {
  let dot = 0, magA = 0, magB = 0;
  for (let i = 0; i < a.length; i++) {
    dot  += a[i] * b[i];
    magA += a[i] * a[i];
    magB += b[i] * b[i];
  }
  return dot / (Math.sqrt(magA) * Math.sqrt(magB));
}
