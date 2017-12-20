export const baseShaderVertSrc = `
attribute vec4 position;

uniform mat4 projectionMatrix;
uniform mat4 viewMatrix;
uniform mat4 modelMatrix;

void main() {
    gl_Position = projectionMatrix * viewMatrix * modelMatrix * position;
}`;

export const baseShaderFragSrc = `
precision mediump float;

void main() {
    float colorR = gl_FrontFacing ? 1.0 : 0.0;
    float colorG = gl_FrontFacing ? 0.0 : 1.0;
    
    gl_FragColor = vec4(colorR, colorG, 0.0, 1.0);

}`;

export const base2ShaderVertSrc = `#version 300 es
in vec4 position;

uniform mat4 projectionMatrix;
uniform mat4 viewMatrix;
uniform mat4 modelMatrix;

void main() {
    gl_Position = projectionMatrix * viewMatrix * modelMatrix * position;
}
`;

export const base2ShaderFragSrc = `#version 300 es
precision mediump float;

out vec4 outColor;

void main() {
    float colorR = gl_FrontFacing ? 1.0 : 0.0;
    float colorG = gl_FrontFacing ? 0.0 : 1.0;
    
    outColor = vec4(colorR, colorG, 0.0, 1.0);
}
`;
