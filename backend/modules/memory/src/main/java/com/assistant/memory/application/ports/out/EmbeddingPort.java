package com.assistant.memory.application.ports.out;

import java.util.List;

/** Port for generating vector embeddings from textual input. */
public interface EmbeddingPort {

  /**
   * Generates a vector embedding for a single text input.
   *
   * @param text input text
   * @return normalized float array representing the vector
   */
  float[] embed(String text);

  /**
   * Generates vector embeddings for a batch of text inputs.
   *
   * @param texts list of input texts
   * @return list of normalized float arrays
   */
  List<float[]> embedBatch(List<String> texts);

  /**
   * Returns the vector dimension produced by this model (e.g. 384).
   *
   * @return embedding dimension size
   */
  int getDimension();
}
