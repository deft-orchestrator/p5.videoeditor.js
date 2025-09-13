// This vertex shader is a "pass-through" shader.
// It takes vertex data and passes it directly to the fragment shader
// without any transformation. This is standard for 2D post-processing effects.

// Set the precision for floating point numbers
precision mediump float;

// This is the vertex position passed in from our p5.js geometry
attribute vec3 aPosition;

// This is the texture coordinate passed in from our p5.js geometry
attribute vec2 aTexCoord;

// This is a varying variable that will be passed to the fragment shader
// It will be interpolated between the vertices.
varying vec2 vTexCoord;

void main() {
  // Pass the texture coordinate to the fragment shader
  vTexCoord = aTexCoord;

  // The vertex position is already in clip space, so we can just pass it through.
  // We need to set gl_Position, which is a special variable that holds the final
  // vertex position.
  gl_Position = vec4(aPosition, 1.0);
}
