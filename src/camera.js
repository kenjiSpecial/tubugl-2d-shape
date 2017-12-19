const EventEmitter = require('wolfy87-eventemitter');
import { mat4 } from 'gl-matrix/src/gl-matrix';

/**
 * order of matrix
 * http://www.opengl-tutorial.org/beginners-tutorials/tutorial-3-matrices/
 */

export class Camera extends EventEmitter {
	constructor(position = [0, 0, 100], rotation = [0, 0, 0]) {
		super();

		this._position = position;
		this._rotation = rotation;

		this.viewMatrix = mat4.create();
		this.projectionMatrix = mat4.create();

		mat4.translate(this.viewMatrix, this.viewMatrix, this._position);
		mat4.invert(this.viewMatrix, this.viewMatrix);

		mat4.perspective(
			this.projectionMatrix,
			60 / 180 * Math.PI,
			window.innerWidth / window.innerHeight,
			1,
			1000
		);
	}
	update() {}
}
