precision mediump float;

uniform vec2 uRes;
uniform sampler2D uTexture;

uniform vec2 uMeshScale;
uniform float uRed;
uniform float uGreen;
uniform float uBlue;

varying vec2 vUv;

void main() {
	gl_FragColor = vec4(uRed,uGreen,uBlue,1.0);
}
