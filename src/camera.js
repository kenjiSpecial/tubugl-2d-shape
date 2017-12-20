const EventEmitter = require('wolfy87-eventemitter');
import { mat4 } from 'gl-matrix/src/gl-matrix';

export class Camera extends EventEmitter {
	constructor(
		position = [0, 0, 0],
		rotation = [0, 0, 0],
		width = window.innerWidth,
		height = window.innerHeight,
		fov = 60,
		near = 1,
		far = 1000
	) {
		super();

		this._position = new Float32Array(position);
		this._rotation = new Float32Array(rotation);

		this._fov = fov;
		this._width = width;
		this._height = height;
		this._near = near;
		this._far = far;

		this.viewMatrix = mat4.create();
		this.projectionMatrix = mat4.create();

		this._updateViewMatrix();
		this._updateProjectionMatrix();
	}

	update() {
		this._updateViewMatrix();

		return this;
	}

	updatePosition(x, y, z) {
		if (x !== undefined) this._position[0] = x;
		if (y !== undefined) this._position[1] = y;
		if (z !== undefined) this._position[2] = z;

		return this;
	}

	/**
	 *
	 * @param {Array}targetPosition
	 */
	lookAt(targetPosition) {
		mat4.lookAt(this.viewMatrix, this._position, targetPosition, [0, 1, 0]);

		return this;
	}

	log() {
		console.log(
			`[PerspectiveCamera] position: {x: ${this._position[0]}, y: ${
				this._position[1]
			}, z: ${this._position[2]} }`
		);
		console.log(
			`[PerspectiveCamera] position: {x: ${this._rotation[0]}, y: ${
				this._rotation[1]
			}, z: ${this._rotation[2]} }`
		);
	}

	_updateProjectionMatrix() {
		mat4.perspective(
			this.projectionMatrix,
			this._fov / 180 * Math.PI,
			this._width / this._height,
			this._near,
			this._far
		);
	}

	_updateViewMatrix() {
		mat4.fromTranslation(this.viewMatrix, this._position);

		mat4.rotateX(this.viewMatrix, this.viewMatrix, this._rotation[0]);
		mat4.rotateX(this.viewMatrix, this.viewMatrix, this._rotation[1]);
		mat4.rotateX(this.viewMatrix, this.viewMatrix, this._rotation[2]);

		mat4.invert(this.viewMatrix, this.viewMatrix);

		return this;
	}
}
