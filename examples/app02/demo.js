'use strict';

import App from './index';

let app;

init();
start();

function init() {
	app = new App({
		isDebug: true
	});

	document.body.appendChild(app.canvas);
}

function start() {
	app.animateIn();
}

window.addEventListener('resize', function() {
	app.resize(window.innerWidth, window.innerHeight);
});

window.addEventListener('keydown', function(ev) {
	app.onKeyDown(ev);
});
