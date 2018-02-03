import { UvPlane } from './uvPlane';
import { Program } from 'tubugl-core/src/program';
import { uvBaseShaderVertSrc, textureBaseShaderFragSrc } from './shaders/base.shader';

export class TexturePlane extends UvPlane {
	constructor(gl, params = {}, width = 100, height = 100, segmentW = 1, segmentH = 1) {
		super(gl, params, width, height, segmentW, segmentH);

		this._textures = params.textures;
	}
	_makeProgram() {
		const vertexShaderSrc = uvBaseShaderVertSrc;
		const fragmentShaderSrc = textureBaseShaderFragSrc;

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
	update(camera) {
		super.update(camera);

		this._textures.forEach(textureData => {
			this._program.setUniformTexture(textureData.texture, textureData.name);
			textureData.texture.activeTexture().bind();
		});

		return this;
	}
}
