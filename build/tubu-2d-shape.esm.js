import { mat4 } from 'gl-matrix/src/gl-matrix';
import { Program, ArrayBuffer, IndexArrayBuffer, VAO } from 'tubugl-core';
import { generateWireframeIndices } from 'tubugl-utils';
import { Vector3 } from 'tubugl-math/src/vector3';
import { Euler } from 'tubugl-math/src/euler';
import { ArrayBuffer as ArrayBuffer$1 } from 'tubugl-core/src/arrayBuffer';
import { Program as Program$1 } from 'tubugl-core/src/program';

const baseShaderVertSrc = `
attribute vec4 position;

uniform mat4 projectionMatrix;
uniform mat4 viewMatrix;
uniform mat4 modelMatrix;

void main() {
    gl_Position = projectionMatrix * viewMatrix * modelMatrix * position;
}`;

const baseShaderFragSrc = `
precision mediump float;

void main() {
    float colorR = gl_FrontFacing ? 1.0 : 0.0;
    float colorG = gl_FrontFacing ? 0.0 : 1.0;
    
    gl_FragColor = vec4(colorR, colorG, 0.0, 1.0);

}`;

const uvBaseShaderVertSrc = `
attribute vec4 position;
attribute vec2 uv;

uniform mat4 projectionMatrix;
uniform mat4 viewMatrix;
uniform mat4 modelMatrix;

varying vec2 vUv;
void main(){
    gl_Position = projectionMatrix * viewMatrix * modelMatrix * position;
    vUv = uv;
}
`;

const uvBaseShaderFragSrc = `
precision mediump float;

varying vec2 vUv;
void main() {
    float colorR = gl_FrontFacing ? 1.0 : 0.0;
    
    gl_FragColor = vec4(vUv, colorR, 1.0);

}
`;

const textureBaseShaderFragSrc = `
precision mediump float;

uniform sampler2D uTexture;
uniform sampler2D uvTexture;

varying vec2 vUv;

void main(){
    if(gl_FrontFacing){
        gl_FragColor = texture2D(uTexture, vUv);
    }else{
        gl_FragColor = texture2D(uvTexture, vUv);
    }
}
`;

const wireFrameFragSrc = `
precision mediump float;

void main(){
    gl_FragColor = vec4(0.0, 0.0, 0.0, 1.0);
}
`;

const base2ShaderVertSrc = `#version 300 es
in vec4 position;
in vec3 barycentricPosition;

uniform mat4 projectionMatrix;
uniform mat4 viewMatrix;
uniform mat4 modelMatrix;

out vec3 vBarycentricPosition;

void main() {
    gl_Position = projectionMatrix * viewMatrix * modelMatrix * position;
    
    vBarycentricPosition = barycentricPosition; 
}
`;

const base2ShaderFragSrc = `#version 300 es
precision mediump float;
in vec3 vBarycentricPosition;

uniform bool uWireframe;

out vec4 outColor;

void main() {

    if(uWireframe){
        float minBarycentricVal = min(min(vBarycentricPosition.x, vBarycentricPosition.y), vBarycentricPosition.z);
        if(minBarycentricVal > 0.01) discard;
    }
    
    outColor = vec4(1.0, 0.0, 0.0, 1.0);
}
`;

const EventEmitter = require('wolfy87-eventemitter');
class Plane extends EventEmitter {
	constructor(gl, params = {}, width = 100, height = 100, widthSegment = 1, heightSegment = 1) {
		super();

		this.position = new Vector3();
		this.rotation = new Euler();
		this.scale = new Vector3(1, 1, 1);

		this._isGl2 = params.isGl2;
		this._gl = gl;
		this._side = params.side ? params.side : 'double'; // 'front', 'back', 'double'

		this._width = width;
		this._height = height;
		this._widthSegment = widthSegment;
		this._heightSegment = heightSegment;

		this._modelMatrix = mat4.create();
		this._isNeedUpdate = true;
		this._isWire = !!params.isWire;
		this._isDepthTest = params.isDepthTest == undefined ? true : !!params.isDepthTest;
		this._isTransparent = !!params.isTransparent;
		this.disableUpdateModelMatrix = !!params.disableUpdateModelMatrix;

		this._makeProgram(params);
		this._makeBuffer();

		if (this._isWire) {
			this._makeWireframe();
			this._makeWireframeBuffer();
		}
	}

	updateModelMatrix(matrix) {
		this._modelMatrix = matrix;
	}

	setPosition(x, y, z) {
		this._isNeedUpdate = true;

		if (x !== undefined) this.position.x = x;
		if (y !== undefined) this.position.y = y;
		if (z !== undefined) this.position.z = z;

		return this;
	}

	setRotation(x, y, z) {
		this._isNeedUpdate = true;

		if (x !== undefined) this.rotation.x = x;
		if (y !== undefined) this.rotation.y = y;
		if (z !== undefined) this.rotation.z = z;

		return this;
	}

	_makeProgram(params) {
		const fragmentShaderSrc = params.fragmentShaderSrc
			? params.fragmentShaderSrc
			: this._isGl2 ? base2ShaderFragSrc : baseShaderFragSrc;
		const vertexShaderSrc = params.vertexShaderSrc
			? params.vertexShaderSrc
			: this._isGl2 ? base2ShaderVertSrc : baseShaderVertSrc;

		this._program = new Program(this._gl, vertexShaderSrc, fragmentShaderSrc);
	}

	_makeWireframe() {
		this._wireframeProgram = new Program(this._gl, baseShaderVertSrc, wireFrameFragSrc);
	}

	_makeBuffer() {
		if (this._isGl2) {
			this._vao = new VAO(this._gl);
			this._vao.bind();
		}
		this._positionBuffer = new ArrayBuffer(
			this._gl,
			Plane.getVertices(this._width, this._height, this._widthSegment, this._heightSegment)
		);
		this._positionBuffer.setAttribs('position', 2);

		if (this._vao) {
			this._positionBuffer.bind().attribPointer(this._program);
		}

		let indices = Plane.getIndices(this._widthSegment, this._heightSegment);
		this._indexBuffer = new IndexArrayBuffer(this._gl, indices);

		this._cnt = indices.length;
	}

	_makeWireframeBuffer() {
		this._wireframeIndexBuffer = new IndexArrayBuffer(
			this._gl,
			generateWireframeIndices(this._indexBuffer.dataArray)
		);
		this._wireframeIndexCnt = this._wireframeIndexBuffer.dataArray.length;
	}

	_updateAttributes() {
		if (this._vao) {
			this._vao.bind();
		} else {
			this._positionBuffer.bind().attribPointer(this._program);
			this._indexBuffer.bind();
		}
	}

	render(camera) {
		this.update(camera).draw();
		if (this._isWire) this.updateWire(camera).drawWireframe();
	}

	update(camera) {
		if (!this.disableUpdateModelMatrix) this._updateModelMatrix();

		this._program.bind();

		this._updateAttributes();

		this._gl.uniformMatrix4fv(
			this._program.getUniforms('modelMatrix').location,
			false,
			this._modelMatrix
		);
		this._gl.uniformMatrix4fv(
			this._program.getUniforms('viewMatrix').location,
			false,
			camera.viewMatrix
		);
		this._gl.uniformMatrix4fv(
			this._program.getUniforms('projectionMatrix').location,
			false,
			camera.projectionMatrix
		);

		return this;
	}

	updateWire(camera) {
		let prg = this._wireframeProgram;

		prg.bind();
		this._positionBuffer.bind().attribPointer(prg);
		this._wireframeIndexBuffer.bind();

		this._gl.uniformMatrix4fv(
			prg.getUniforms('modelMatrix').location,
			false,
			this._modelMatrix
		);
		this._gl.uniformMatrix4fv(prg.getUniforms('viewMatrix').location, false, camera.viewMatrix);
		this._gl.uniformMatrix4fv(
			prg.getUniforms('projectionMatrix').location,
			false,
			camera.projectionMatrix
		);

		return this;
	}

	draw() {
		if (this._side === 'double') {
			this._gl.disable(this._gl.CULL_FACE);
		} else if (this._side === 'front') {
			this._gl.enable(this._gl.CULL_FACE);
			this._gl.cullFace(this._gl.BACK);
		} else {
			this._gl.enable(this._gl.CULL_FACE);
			this._gl.cullFace(this._gl.FRONT);
		}

		if (this._isDepthTest) this._gl.enable(this._gl.DEPTH_TEST);
		else this._gl.disable(this._gl.DEPTH_TEST);

		if (this._isTransparent) {
			this._gl.blendFunc(this._gl.SRC_ALPHA, this._gl.ONE_MINUS_SRC_ALPHA);
			this._gl.enable(this._gl.BLEND);
		} else {
			this._gl.blendFunc(this._gl.ONE, this._gl.ZERO);
			this._gl.disable(this._gl.BLEND);
		}

		this._gl.drawElements(this._gl.TRIANGLES, this._cnt, this._gl.UNSIGNED_SHORT, 0);

		return this;
	}

	drawWireframe() {
		this._gl.drawElements(this._gl.LINES, this._wireframeIndexCnt, this._gl.UNSIGNED_SHORT, 0);

		return;
	}

	resize() {}

	addGui(gui) {
		let positionFolder = gui.addFolder('position');
		positionFolder.add(this.position, 'x', -200, 200).listen();
		positionFolder.add(this.position, 'y', -200, 200).listen();
		positionFolder.add(this.position, 'z', -200, 200).listen();

		let scaleFolder = gui.addFolder('scale');
		scaleFolder
			.add(this.scale, 'x', 0.05, 2)
			.step(0.01)
			.listen();
		scaleFolder
			.add(this.scale, 'y', 0.05, 2)
			.step(0.01)
			.listen();
		scaleFolder
			.add(this.scale, 'z', 0.05, 2)
			.step(0.01)
			.listen();

		let rotationFolder = gui.addFolder('rotation');
		rotationFolder
			.add(this.rotation, 'x', -Math.PI, Math.PI)
			.step(0.01)
			.listen();
		rotationFolder
			.add(this.rotation, 'y', -Math.PI, Math.PI)
			.step(0.01)
			.listen();
		rotationFolder
			.add(this.rotation, 'z', -Math.PI, Math.PI)
			.step(0.01)
			.listen();

		gui
			.add(this, '_isWire')
			.name('isWire')
			.onChange(() => {
				if (this._isWire && !this._wireframeProgram) {
					this._makeWireframe();
					this._makeWireframeBuffer();
				}
			});
	}
	/**
	 *
	 * @param {Array}targetPosition
	 */
	lookAt(targetPosition) {
		mat4.lookAt(this.rotation.matrix, targetPosition, this.position.array, [0, 1, 0]);
		mat4.invert(this.rotation.matrix, this.rotation.matrix); // TODO: why I need invert matrix

		this.rotation.setFromRotationMatrix(this.rotation.matrix);

		return this;
	}

	_updateModelMatrix() {
		// console.log(this._isNeedUpdate);
		if (
			!this._isNeedUpdate &&
			!this.position.needsUpdate &&
			!this.rotation.needsMatrixUpdate &&
			!this.scale.needsUpdate
		)
			return;

		mat4.fromTranslation(this._modelMatrix, this.position.array);
		mat4.scale(this._modelMatrix, this._modelMatrix, this.scale.array);

		this.rotation.updateMatrix();
		mat4.multiply(this._modelMatrix, this._modelMatrix, this.rotation.matrix);

		this._isNeedUpdate = false;
		this.position.needsUpdate = false;
		this.scale.needsUpdate = false;

		return this;
	}

	static getVertices(width, height, widthSegment, heightSegment) {
		let vertices = [];
		let xRate = 1 / widthSegment;
		let yRate = 1 / heightSegment;

		// set vertices and barycentric vertices
		for (let yy = 0; yy <= heightSegment; yy++) {
			let yPos = (-0.5 + yRate * yy) * height;

			for (let xx = 0; xx <= widthSegment; xx++) {
				let xPos = (-0.5 + xRate * xx) * width;
				vertices.push(xPos);
				vertices.push(yPos);
			}
		}
		vertices = new Float32Array(vertices);

		return vertices;
	}

	static getIndices(widthSegment, heightSegment) {
		let indices = [];

		for (let yy = 0; yy < heightSegment; yy++) {
			for (let xx = 0; xx < widthSegment; xx++) {
				let rowStartNum = yy * (widthSegment + 1);
				let nextRowStartNum = (yy + 1) * (widthSegment + 1);

				indices.push(rowStartNum + xx);
				indices.push(rowStartNum + xx + 1);
				indices.push(nextRowStartNum + xx);

				indices.push(rowStartNum + xx + 1);
				indices.push(nextRowStartNum + xx + 1);
				indices.push(nextRowStartNum + xx);
			}
		}

		indices = new Uint16Array(indices);

		return indices;
	}
}

class UvPlane extends Plane {
	constructor(gl, params = {}, width = 100, height = 100, segmentW = 1, segmentH = 1) {
		super(gl, params, width, height, segmentW, segmentH);
	}
	_makeProgram(params) {
		const vertexShaderSrc = params.vertexShaderSrc
			? params.vertexShaderSrc
			: this._isGl2 ? base2ShaderVertSrc : uvBaseShaderVertSrc;

		const fragmentShaderSrc = params.fragmentShaderSrc
			? params.fragmentShaderSrc
			: this._isGl2 ? base2ShaderFragSrc : uvBaseShaderFragSrc;

		console.log(vertexShaderSrc, fragmentShaderSrc);
		this._program = new Program$1(this._gl, vertexShaderSrc, fragmentShaderSrc);
	}
	_updateAttributes() {
		if (this._vao) {
			this._vao.bind();
		} else {
			this._positionBuffer.bind().attribPointer(this._program);
			this._uvBuffer.bind().attribPointer(this._program);
			this._indexBuffer.bind();
		}
	}
	_makeBuffer() {
		super._makeBuffer();

		this._uvBuffer = new ArrayBuffer$1(
			this._gl,
			UvPlane.getUvs(this._widthSegment, this._heightSegment)
		);
		this._uvBuffer.setAttribs('uv', 2);
	}
	static getUvs(widthSegment, heightSegment) {
		let uvs = [];
		let xRate = 1 / widthSegment;
		let yRate = 1 / heightSegment;

		for (let yy = 0; yy <= heightSegment; yy++) {
			let uvY = 1.0 - yRate * yy;
			for (let xx = 0; xx <= widthSegment; xx++) {
				let uvX = xRate * xx;

				uvs.push(uvX);
				uvs.push(uvY);
			}
		}

		uvs = new Float32Array(uvs);

		return uvs;
	}
}

class TexturePlane extends UvPlane {
	constructor(gl, params = {}, width = 100, height = 100, segmentW = 1, segmentH = 1) {
		super(gl, params, width, height, segmentW, segmentH);

		this._textures = params.textures;
	}
	_makeProgram() {
		const vertexShaderSrc = uvBaseShaderVertSrc;
		const fragmentShaderSrc = textureBaseShaderFragSrc;

		this._program = new Program$1(this._gl, vertexShaderSrc, fragmentShaderSrc);
	}
	_updateAttributes() {
		if (this._vao) {
			this._vao.bind();
		} else {
			this._positionBuffer.bind().attribPointer(this._program);
			this._uvBuffer.bind().attribPointer(this._program);
			this._indexBuffer.bind();
		}
	}
	update(camera) {
		super.update(camera);

		this._textures.forEach(textureData => {
			this._program.setUniformTexture(textureData.texture, textureData.name);
			textureData.texture.activeTexture().bind();
		});

		return this;
	}
}

export { Plane, UvPlane, TexturePlane };
