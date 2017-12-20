const EventEmitter = require('wolfy87-eventemitter');
import { mat4 } from 'gl-matrix/src/gl-matrix';
import { baseShaderFragSrc, baseShaderVertSrc } from './shaders/base.shader';
import { Program, ArrayBuffer, IndexArrayBuffer } from 'tubugl-core';
import {
	CULL_FACE,
	FRONT,
	BACK,
	TRIANGLES,
	LINE_LOOP,
	UNSIGNED_SHORT
} from 'tubugl-constants';

export class Plane extends EventEmitter {
	constructor(
		gl,
		width = 100,
		height = 100,
		segmentW = 1,
		segmentH = 1,
		position = [0, 0, 0],
		rotation = [0, 0, 0],
		params = {}
	) {
		super();

		this._position = new Float32Array(position);
		this._rotation = new Float32Array(rotation);

		this._isGL2 = params.isGL2;
		this._gl = gl;

		this._side = params.side ? params.side : 'double'; // 'front', 'back', 'double'

		let fragmentShaderSrc = params.fragmentShaderSrc
			? params.fragmentShaderSrc
			: baseShaderFragSrc;
		let vertexShaderSrc = params.vertexShaderSrc
			? params.vertexShaderSrc
			: baseShaderVertSrc;

		this._width = width;
		this._height = height;
		this._segmentW = segmentW;
		this._segmentH = segmentH;
		this._program = new Program(this._gl, vertexShaderSrc, fragmentShaderSrc);
		this._modelMatrix = mat4.create();
		this._isNeedUpdate = true;
		this._isLine = false;

		this._makBuffer();
	}

	setPosition(x, y, z) {
		this._isNeedUpdate = true;

		if (x !== undefined) this._position[0] = x;
		if (y !== undefined) this._position[1] = y;
		if (z !== undefined) this._position[2] = z;

		return this;
	}

	setRotation(x, y, z) {
		this._isNeedUpdate = true;

		if (x !== undefined) this._rotation[0] = x;
		if (y !== undefined) this._rotation[1] = y;
		if (z !== undefined) this._rotation[2] = z;

		return this;
	}

	_makBuffer() {
		this._positionBuffer = new ArrayBuffer(
			this._gl,
			this._getVertice(
				this._width,
				this._height,
				this._segmentW,
				this._segmentH
			)
		);
		this._positionBuffer.setAttribs('position', 2);

		let indices = this._getIndices(this._segmentW, this._segmentH);
		this._indexBuffer = new IndexArrayBuffer(this._gl, indices);

		this._cnt = indices.length;
	}

	update(camera) {
		this._updateModelMatrix();

		this._program.bind();

		this._positionBuffer.bind().attribPointer(this._program);
		this._indexBuffer.bind();

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
		// console.log(camera.viewMatrix);

		return this;
	}

	draw() {
		if (this._side === 'double') {
			this._gl.disable(CULL_FACE);
		} else if (this._side === 'front') {
			this._gl.enable(CULL_FACE);
			this._gl.cullFace(BACK);
		} else {
			this._gl.enable(CULL_FACE);
			this._gl.cullFace(FRONT);
		}

		this._gl.drawElements(
			this._isLine ? LINE_LOOP : TRIANGLES,
			6,
			UNSIGNED_SHORT,
			0
		);

		return this;
	}

	resize() {}

	addGui(gui) {
		gui.add(this, '_isLine').name('isLine');
	}

	_updateModelMatrix() {
		if (!this._isNeedUpdate) return;

		mat4.fromTranslation(this._modelMatrix, this._position);

		mat4.rotateX(this._modelMatrix, this._modelMatrix, this._rotation[0]);
		mat4.rotateY(this._modelMatrix, this._modelMatrix, this._rotation[1]);
		mat4.rotateZ(this._modelMatrix, this._modelMatrix, this._rotation[2]);

		this._isNeedUpdate = false;

		return this;
	}

	_getVertice(width, height, segmentW, segmentH) {
		let vertices = [];
		let xRate = 1 / segmentW;
		let yRate = 1 / segmentH;
		let xx, yy;

		// set vertices
		for (yy = 0; yy <= segmentH; yy++) {
			let yPos = (-0.5 + yRate * yy) * height;
			for (xx = 0; xx <= segmentW; xx++) {
				let xPos = (-0.5 + xRate * xx) * width;
				vertices.push(xPos);
				vertices.push(yPos);
			}
		}
		vertices = new Float32Array(vertices);

		return vertices;
	}

	_getIndices(segmentW, segmentH) {
		let indices = [];
		let xx, yy;

		for (yy = 0; yy < segmentH; yy++) {
			for (xx = 0; xx < segmentW; xx++) {
				let rowStartNum = yy * (segmentW + 1);
				let nextRowStartNum = (yy + 1) * (segmentW + 1);

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
