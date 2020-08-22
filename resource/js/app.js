const WEBSITE = (() => {

    let website = {},
        scroll = {},
        mouse = {},
        wheel = {},
        gl,
        vertex,
        fragment,
        imgArr = [];

    website.body = document.body;
    website.url = document.URL;
    website.winW = window.innerWidth;
    website.winH = window.innerHeight;
    website.breakPoint = 768;
    website.isDesktop = true;
    website.isFirst = true;
    website.animationFrame = null;

    if (website.breakPoint >= website.winW) {
        website.isDesktop = false;
    }

    const Utils = {

        loadFile(url, data, callback, errorCallback) {
            let request = new XMLHttpRequest();
            request.open('GET', url, true);
            request.onreadystatechange = function() { if (request.readyState == 4) { if (request.status == 200) { callback(request.responseText, data) } else { errorCallback(url); } } };
            request.send(null);
        },

        loadFiles(urls, callback, errorCallback) {
            let numUrls = urls.length,
                numComplete = 0,
                result = [];

            function partialCallback(text, urlIndex) {
                result[urlIndex] = text;
                numComplete++;
                if (numComplete == numUrls) {
                    callback(result);
                }
            }
            for (let i = 0; i < numUrls; i++) { Utils.loadFile(urls[i], i, partialCallback, errorCallback); }
        }
    }

    const GL = () => {

        function Texture(el, i) {

            this.dom = el.img;
            this.i = i;

            this.texture = new THREE.Texture(this.dom);
            this.texture.needsUpdate = true;
            this.texture.minFilter = THREE.LinearFilter;

            this.textureL = new THREE.Texture(this.dom);
            this.textureL.needsUpdate = true;
            this.textureL.minFilter = THREE.LinearFilter;

            ['getPoint', 'getSize', 'getColor', 'addObjects', 'setMesh', 'setUniform'].forEach(fn => this[fn]());

            gl.groupC.add(this.groupC);
            gl.groupT.add(this.groupT);
            gl.groupB.add(this.groupB);
        }

        Texture.prototype.getPoint = function() {
            this.panelLen = 10;
            this.step = (Math.PI * 2) / this.panelLen;

            this.radiusP = website.winW * 1.35;
            this.planeX = Math.sin(this.i * -this.step) * this.radiusP;
            this.planeY = 0;
            this.planeZ = Math.cos(this.i * -this.step) * this.radiusP;
            this.planeAngle = Math.PI + -((Math.PI * 2) / this.panelLen * this.i);

            this.radiusI = website.winW * 1.32;
            this.imgX = Math.sin(this.i * -this.step) * this.radiusI;
            this.imgY = 0;
            this.imgZ = Math.cos(this.i * -this.step) * this.radiusI;
            this.imgAngle = Math.PI + -((Math.PI * 2) / this.panelLen * this.i);
        }

        Texture.prototype.getSize = function() {
            this.panelW = website.winW * 0.65;
            this.panelH = this.panelW;

            this.imgW = website.winW * 0.35;
            this.imgH = this.imgW;

            this.ratio = this.imgW / this.imgH;
            this.viewRatio = window.innerWidth / window.innerHeight;
        }

        Texture.prototype.getFullSize = function() {
            const fov = (gl.camera.fov * Math.PI) / 180;
            const height = Math.abs(gl.camera.position.z * Math.tan(fov / 2) * 2);
            return { width: height * gl.camera.aspect, height };
        }

        Texture.prototype.getColor = function() {

            this.color = this.dom.getAttribute('data-color');

            let result1 = this.color.split('rgb(').join(''),
                result2 = result1.split(')').join(''),
                count = 0,
                r = '',
                g = '',
                b = '';

            for (let i = 0; i < result2.length; i++) {
                if (result2[i] === ',') {
                    count++;
                } else {
                    if (count === 0) {
                        r = r + result2[i];
                    } else if (count === 1) {
                        g = g + result2[i];
                    } else if (count === 2) {
                        b = b + result2[i];
                    }
                }
            }

            this.r = Number(r) / 255;
            this.g = Number(g) / 255;
            this.b = Number(b) / 255;
        }

        Texture.prototype.addObjects = function() {

            this.groupC = new THREE.Object3D();
            this.groupT = new THREE.Object3D();
            this.groupB = new THREE.Object3D();

            this.geometryPanel = new THREE.PlaneBufferGeometry(1, 1, 18, 18);
            this.materialPanel = new THREE.ShaderMaterial({
                side: THREE.DoubleSide,
                uniforms: {
                    uTexture: { type: 't', value: null },
                    uRed: { type: 't', value: this.r },
                    uGreen: { type: 't', value: this.g },
                    uBlue: { type: 't', value: this.b },
                    uRes: { type: 'v2', value: new THREE.Vector2(0.5, 0.5) },
                    uPlaneCenter: { value: new THREE.Vector2(0, 0) },
                    uMeshScale: { value: new THREE.Vector2(0, 0) },
                    uStrength: { type: 'f', value: 0 }
                },
                transparent: true,
                vertexShader: vertex,
                fragmentShader: fragment
            });

            this.meshPanel1 = new THREE.Mesh(this.geometryPanel, this.materialPanel);
            this.meshPanel2 = new THREE.Mesh(this.geometryPanel, this.materialPanel);
            this.meshPanel3 = new THREE.Mesh(this.geometryPanel, this.materialPanel);

            this.groupC.add(this.meshPanel1);
            this.groupT.add(this.meshPanel2);
            this.groupB.add(this.meshPanel3);


            this.geometryImg = new THREE.PlaneBufferGeometry(1, 1, 18, 18);
            this.materialImg = new THREE.MeshBasicMaterial({ map: this.texture });

            this.meshImg1 = new THREE.Mesh(this.geometryImg, this.materialImg);
            this.meshImg2 = new THREE.Mesh(this.geometryImg, this.materialImg);
            this.meshImg3 = new THREE.Mesh(this.geometryImg, this.materialImg);

            this.groupC.add(this.meshImg1);
            this.groupT.add(this.meshImg2);
            this.groupB.add(this.meshImg3);
        }

        Texture.prototype.setMesh = function() {

            this.meshPanel1.scale.set(this.panelW, this.panelH, this.panelW / 2);
            this.meshPanel2.scale.set(this.panelW, this.panelH, this.panelW / 2);
            this.meshPanel3.scale.set(this.panelW, this.panelH, this.panelW / 2);

            this.meshPanel1.position.x = this.meshPanel2.position.x = this.meshPanel3.position.x = this.planeX;
            this.meshPanel1.position.y = this.meshPanel2.position.y = this.meshPanel3.position.y = this.planeY;
            this.meshPanel1.position.z = this.meshPanel2.position.z = this.meshPanel3.position.z = this.planeZ;
            this.meshPanel1.rotation.y = this.meshPanel2.rotation.y = this.meshPanel3.rotation.y = this.planeAngle;


            this.meshImg1.scale.set(this.imgW, this.imgH, this.imgW / 2);
            this.meshImg2.scale.set(this.imgW, this.imgH, this.imgW / 2);
            this.meshImg3.scale.set(this.imgW, this.imgH, this.imgW / 2);

            this.meshImg1.position.x = this.meshImg2.position.x = this.meshImg3.position.x = this.imgX;
            this.meshImg1.position.y = this.meshImg2.position.y = this.meshImg3.position.y = this.imgY;
            this.meshImg1.position.z = this.meshImg2.position.z = this.meshImg3.position.z = this.imgZ;
            this.meshImg1.rotation.y = this.meshImg2.rotation.y = this.meshImg3.rotation.y = this.imgAngle;

        }

        Texture.prototype.setUniform = function() {

            // this.material.uniforms.uTexture.value = this.texture;
            // this.material.uniforms.uTexture.value.needsUpdate = true;

            // this.material.uniforms.uRes.value.x = this.x;
            // this.material.uniforms.uRes.value.y = this.y;

            // this.material.uniforms.uMeshScale.value.x = this.width;
            // this.material.uniforms.uMeshScale.value.y = this.height;

            // this.material.uniforms.uScaleToFullSize.value.x = this.fullSize.width / this.width - 1;
            // this.material.uniforms.uScaleToFullSize.value.y = this.fullSize.height / this.height - 1;

        }

        Texture.prototype.updateUniform = function() {

            // this.material.uniforms.uPlaneCenter.value.x = this.mesh.position.x / this.width;
            // this.material.uniforms.uPlaneCenter.value.y = this.mesh.position.y / this.height;

            this.materialPanel.uniforms.uRes.value.x = this.x;
            this.materialPanel.uniforms.uRes.value.y = this.y;

            // this.materialPanel.uniforms.uStrength.value = wheel.angle * 0.0005;

            // this.material.uniforms.uRadius.value = 0.8 + scroll.strength;

            // this.material.uniforms.uStretchV.value.y = -(this.mesh.position.y / this.mesh.scale.y - 0.5);

        }

        Texture.prototype.render = function() {
            // this.getSize();
            this.setMesh();
            this.updateUniform();
        }

        function Scene() {

            this.scene = new THREE.Scene();

            this.renderer = new THREE.WebGLRenderer({
                antialias: true,
                alpha: true
            });

            this.renderer.setPixelRatio(window.devicePixelRatio || 1);
            this.renderer.setSize(website.winW, website.winH);
            this.renderer.sortObjects = false;

            this.renderer.outputEncoding = THREE.sRGBEncoding;

            this.container = document.getElementById('c');
            this.container.appendChild(this.renderer.domElement);

            this.camera = new THREE.PerspectiveCamera(45, website.winW / website.winH, 1, 13000);
            this.cameraDistance = website.winW / 2;
            this.camera.position.set(0, 0, this.cameraDistance);

            this.groupC = new THREE.Object3D();
            this.scene.add(this.groupC);

            this.groupT = new THREE.Object3D();
            this.scene.add(this.groupT);

            this.groupB = new THREE.Object3D();
            this.scene.add(this.groupB);

            this.zoom = -(website.winW * 6);
            this.param1 = {
                distance: 0
            };

            this.param2 = {
                rotate: 0
            };

            this.scaled = false;

            // this.resize();
            this.wheel();
            this.render();

            // window.addEventListener('mousedown', this.mousedown.bind(this));
            // window.addEventListener('resize', this.resize.bind(this));
        }

        // Scene.prototype.mousedown = function() {}

        // Scene.prototype.resize = function() {
        //     this.renderer.setSize(window.innerWidth, window.innerHeight);
        //     this.camera.aspect = window.innerWidth / window.innerHeight;
        //     this.camera.updateProjectionMatrix();
        // }

        Scene.prototype.wheel = function() {

            const indicator = new WheelIndicator({
                elem: window,
                callback: function(e) {
                    wheel.direction = e.direction;
                }
            });

            $(document).off(wheel.wheelEvent);

            wheel.wheelEvent = 'onwheel' in document ? 'wheel' : 'onmousewheel' in document ? 'mousewheel' : 'DOMMouseScroll';
            wheel.delta = null;
            wheel.velocity = 0.08;
            wheel.angle = 0;

            $(document).on(wheel.wheelEvent, function(e) {
                wheel.delta = e.originalEvent.deltaY ? -(e.originalEvent.deltaY) : e.originalEvent.wheelDelta ? e.originalEvent.wheelDelta : -(e.originalEvent.detail);
            });
        }

        Scene.prototype.render = function() {

            wheel.angle = this.easing(wheel.angle, wheel.delta, wheel.velocity);
            if (wheel.angle > -1.5 || 1.5 > wheel.angle) { wheel.delta = 0; };

            this.camera.rotation.x = this.param2.rotate;
            this.camera.rotation.z = (wheel.angle * 0.0005) + (-0.4 * this.param1.distance);

            this.groupC.rotation.x = 0.4 * this.param1.distance;
            this.groupC.rotation.y += 0.0015 - (wheel.angle * 0.001);
            this.groupC.position.z = this.zoom * this.param1.distance;

            this.groupT.rotation.x = 0.4 * this.param1.distance;
            this.groupT.rotation.y -= 0.0015 - (wheel.angle * 0.001);
            this.groupT.position.z = this.zoom * this.param1.distance;
            this.groupT.position.y = website.winW * 0.8;

            this.groupB.rotation.x = 0.4 * this.param1.distance;
            this.groupB.rotation.y -= 0.001 - (wheel.angle * 0.0015);
            this.groupB.position.z = this.zoom * this.param1.distance;
            this.groupB.position.y = -(website.winW * 0.8);

            for (let i = 0; i < imgArr.length; i++) { imgArr[i].render(); }

            this.renderer.render(this.scene, this.camera);
        }

        Scene.prototype.easing = function(start, end, multiplier) { return (1 - multiplier) * start + multiplier * end; }


        // ---- //

        let IMAGES;

        const preloadImages = new Promise((resolve, reject) => {
            imagesLoaded(document.querySelectorAll('img'), { background: true }, resolve);
        });

        preloadImages.then(target => { IMAGES = target.images; });

        Utils.loadFiles(['/f2/resource/js/_shader/sh.vert', '/f2/resource/js/_shader/sh.frag'], function(shaderText) {

            vertex = shaderText[0];
            fragment = shaderText[1];

            Promise.all([preloadImages]).then(() => {
                for (let i = 0; i < IMAGES.length; i++) {
                    if (IMAGES[i].img.classList.contains('gl-img')) {
                        imgArr.push(new Texture(IMAGES[i], i));
                    }
                }
            });

            return gl = new Scene();
        });
    };

    const App = {

        init() {
            GL();
            App.updates();
        },

        updates() {
            website.animationFrame = window.requestAnimationFrame(App.updates);
            
            if (gl === undefined) { return };
            gl.render();
        }
    }

    App.init();

})();