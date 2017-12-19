const EventEmitter = require('wolfy87-eventemitter');

import { baseShaderFragSrc, baseShaderVertSrc } from './shaders/base.shader';
import { Program, ArrayBuffer, IndexArrayBuffer } from 'tubugl-core';

export class Plane extends EventEmitter {
	constructor(
		gl,
		width = 100,
		height = 100,
		segmentW = 1,
		segmentH = 1,
		params = {}
	) {
		super();

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
		this._makBuffer();
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
		this._program.bind();

		this._positionBuffer.bind().attribPointer(this._program);
		this._indexBuffer.bind();

		this._gl.uniformMatrix4fv(
			this._program.getUniforms('projectionMatrix').location,
			false,
			camera.projectionMatrix
		);
		this._gl.uniformMatrix4fv(
			this._program.getUniforms('viewMatrix').location,
			false,
			camera.viewMatrix
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

		this._gl.drawElements(this._gl.TRIANGLES, 6, this._gl.UNSIGNED_SHORT, 0);

		return this;
	}

	resize() {}
}
