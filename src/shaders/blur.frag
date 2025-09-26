// Gaussian blur fragment shader (single pass)
#ifdef GL_ES
precision mediump float;
#endif

varying vec2 vTexCoord;
uniform sampler2D u_texture;

// The direction of the blur pass: [1.0, 0.0] for horizontal, [0.0, 1.0] for vertical
uniform vec2 u_direction;

// The resolution of the canvas (e.g., width or height) to calculate texel size
uniform float u_resolution;

// The radius of the blur in pixels
uniform float u_radius;

void main() {
  // Texel size is 1.0 / resolution
  vec2 texelSize = 1.0 / vec2(u_resolution, u_resolution);
  vec4 color = vec4(0.0);

  // Pre-calculated weights for a 9-tap Gaussian filter
  float weights[5] = float[](0.227027, 0.1945946, 0.1216216, 0.05405405, 0.01621621);

  // Apply the blur in the specified direction
  // Center tap
  color += texture2D(u_texture, vTexCoord) * weights[0];
  // Other taps
  for (int i = 1; i < 5; i++) {
    float offset = float(i) * u_radius / 4.0;
    color += texture2D(u_texture, vTexCoord + u_direction * texelSize * offset) * weights[i];
    color += texture2D(u_texture, vTexCoord - u_direction * texelSize * offset) * weights[i];
  }

  gl_FragColor = color;
}