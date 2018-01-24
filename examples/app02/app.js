/**
 * make demo with rendering of plane(webgl)
 */

const dat = require('../vendor/dat.gui.min');
const TweenLite = require('gsap/TweenLite');
const Stats = require('stats.js');

import imageURL from '../assets/image.jpg';
import uvImageURL from '../assets/uv_img.jpg';

import { TexturePlane } from '../../index';

import { PerspectiveCamera, CameraController } from 'tubugl-camera';
import { Texture } from 'tubugl-core/src/texture';

export default class App {
	constructor(params = {}) {
		this._isMouseDown = false;
		this._isPlaneAnimation = false;
		this._width = params.width ? params.width : window.innerWidth;
		this._height = params.height ? params.height : window.innerHeight;

		this.canvas = document.createElement('canvas');
		this.gl = this.canvas.getContext('webgl');

		this._makeCamera();
		this._makeCameraController();

		this._isDebug = params.isDebug;
	}

	_onload() {
		this._imageCnt++;
		if (this._imageCnt == 2) this._loaded();
	}

	_loaded() {
		this._texture = new Texture(this.gl, 'uTexture');
		this._texture
			.bind()
			.fromImage(this._image, this._image.width, this._image.height)
			.generateMipmap();

		this._uvTexture = new Texture(this.gl, 'uvTexture');
		this._uvTexture
			.bind()
			.fromImage(this._uvImage, this._uvImage.width, this._uvImage.height)
			.generateMipmap();

		this._makePlanes();

		this.resize(this._width, this._height);

		if (this._isDebug) {
			this.stats = new Stats();
			document.body.appendChild(this.stats.dom);
			this._addGui();
		}

		this.isLoop = true;
		TweenLite.ticker.addEventListener('tick', this.loop, this);
	}

	animateIn() {
		this._imageCnt = 0;
		this._uvImage = new Image();
		this._uvImage.onload = () => {
			this._onload();
		};
		this._uvImage.src = uvImageURL;

		this._image = new Image();
		this._image.onload = () => {
			this._onload();
		};
		this._image.src = imageURL;
	}

	loop() {
		if (this.stats) this.stats.update();

		this.gl.clearColor(0, 0, 0, 1);
		this.gl.clear(this.gl.COLOR_BUFFER_BIT);

		this._camera.update();
		this._plane.render(this._camera);
	}

	animateOut() {
		TweenLite.ticker.removeEventListener('tick', this.loop, this);
	}

	mouseMoveHandler(mouse) {
		if (!this._isMouseDown) return;
		this._camera.theta += (mouse.x - this._prevMouse.x) * Math.PI * 2;

		this._prevMouse = mouse;
	}

	mouseDownHandler(mouse) {
		this._isMouseDown = true;
		this._prevMouse = mouse;
	}

	mouseupHandler() {
		this._isMouseDown = false;
	}

	onKeyDown(ev) {
		switch (ev.which) {
			case 27:
				this._playAndStop();
				break;
		}
	}

	_playAndStop() {
		this.isLoop = !this.isLoop;
		if (this.isLoop) {
			TweenLite.ticker.addEventListener('tick', this.loop, this);
			this.playAndStopGui.name('pause');
		} else {
			TweenLite.ticker.removeEventListener('tick', this.loop, this);
			this.playAndStopGui.name('play');
		}
	}

	resize(width, height) {
		this._width = width;
		this._height = height;

		this.canvas.width = this._width;
		this.canvas.height = this._height;
		this.gl.viewport(0, 0, this._width, this._height);

		this._plane.resize(this._width, this._height);
		this._camera.updateSize(this._width, this._height);
	}

	destroy() {}

	_makePlanes() {
		this._plane = new TexturePlane(this.gl, 200, 200, 20, 20, {
			textures: [this._texture, this._uvTexture]
		});
	}

	_makeCamera() {
		this._camera = new PerspectiveCamera();
		this._camera.position.z = 800;
	}
	_makeCameraController() {
		this._cameraController = new CameraController(this._camera, this.canvas);
	}
	_addGui() {
		this.gui = new dat.GUI();
		this.playAndStopGui = this.gui.add(this, '_playAndStop').name('pause');
		this._planeGUIFolder = this.gui.addFolder('plane');
		this._plane.addGui(this._planeGUIFolder);
		this._planeGUIFolder.open();
	}
}
