import { UvPlane } from './uvPlane';
import { Program } from 'tubugl-core/src/program';
import { uvBaseShaderVertSrc, textureBaseShaderFragSrc } from './shaders/base.shader';

export class TexturePlane extends UvPlane {
	constructor(gl, width = 100, height = 100, segmentW = 1, segmentH = 1, params = {}) {
		super(gl, width, height, segmentW, segmentH, params);

		this._textures = params.textures;
	}
	_makeProgram() {
		const vertexShaderSrc = uvBaseShaderVertSrc;
		const fragmentShaderSrc = textureBaseShaderFragSrc;

		this._program = new Program(this._gl, vertexShaderSrc, fragmentShaderSrc);
	}
	_updateAttributres() {
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

		this._textures.forEach(texture => {
			this._program.setUniformTexture(texture);
			texture.activeTexture().bind();
		});

		return this;
	}
}
