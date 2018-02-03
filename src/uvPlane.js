import { Plane } from './plane';
import { ArrayBuffer } from 'tubugl-core/src/arrayBuffer';
import { Program } from 'tubugl-core/src/program';
import {
	uvBaseShaderVertSrc,
	uvBaseShaderFragSrc,
	base2ShaderVertSrc,
	base2ShaderFragSrc
} from './shaders/base.shader';

export class UvPlane extends Plane {
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
		this._program = new Program(this._gl, vertexShaderSrc, fragmentShaderSrc);
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

		this._uvBuffer = new ArrayBuffer(
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
