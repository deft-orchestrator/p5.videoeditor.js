// Fragment shader for adjusting brightness and contrast
// In WebGL, precision must be defined.
#ifdef GL_ES
precision mediump float;
#endif

// This is the texture from our scene render
varying vec2 vTexCoord;
uniform sampler2D u_texture;

// These are the values passed from our effect
uniform float u_brightness; // -1.0 to 1.0
uniform float u_contrast;   // -1.0 to 1.0

void main() {
  // Get the color of the current pixel
  vec4 texColor = texture2D(u_texture, vTexCoord);

  // Apply brightness
  // Adding brightness value to all RGB channels
  texColor.rgb += u_brightness;

  // Apply contrast
  // For contrast, we move the color towards the midpoint (0.5)
  // and then scale it. A contrast of 0.0 means no change.
  texColor.rgb = (texColor.rgb - 0.5) * (1.0 + u_contrast) + 0.5;

  // Ensure the color values stay within the valid 0.0-1.0 range
  texColor.rgb = clamp(texColor.rgb, 0.0, 1.0);

  gl_FragColor = texColor;
}
