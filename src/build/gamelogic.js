import * as THREE from './three.module.js';
import { PointerLockControls } from './PointerLockControls.js';
import { STLLoader } from './STLLoader.js';
// import { PDBLoader } from './PDBLoader.js';
        
var camera, scene, renderer, controls, mobius, skybox, ground, boundingBox, raycasternegY;
var sunGrid, mercuryGrid, venusGrid, earthGrid, moonGrid, marsGrid, jupiterGrid, 
saturnGrid, saturnRings, uranusGrid, uranusRings, neptuneGrid, plutoGrid;
var objects = [];
var stars = [];
var solarSystem = [];
var denizen = [];

var moveForward = false;
var moveBackward = false;
var moveLeft = false;
var moveRight = false;
var sprint = false;
var crouch = false;
var canJump = false;

var prevTime = performance.now();
var velocity = new THREE.Vector3();
var direction = new THREE.Vector3();
var vertex = new THREE.Vector3();
var color = new THREE.Color();
var stlloader = new STLLoader();

init();
animate();

function init() {
    
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 1, 10000);
    camera.position.y = 10;
    
    scene = new THREE.Scene();
    scene.background = new THREE.Color('black');

    var light = new THREE.HemisphereLight(0xffffff, 0xffffff, 1);
    light.position.set(0, 1000, 0);
    scene.add(light);


    // objects to be collected through puzzles or minigames
    // inspired by the corresponding body's characteristics

    
    // main source of light, something involving lightbulbs?
    var sun;
    sunGrid = buildSphereGrid(556.8, 0xff8800, [575, 556.8, 1000]);
    scene.add(sunGrid);


    // closest to the sun, fastest body, maybe a race of some sort?
    var mercury;
    mercuryGrid = buildSphereGrid(1.9516, 0xbb9665, [-50, 556.8, 1000]);
    scene.add(mercuryGrid);
    
    
    // runaway greenhouse effect, add a greenhouse and a few potted plants
    // then add a shovel that can be equipped and used to dig them up
    var venus;
    venusGrid = buildSphereGrid(4.84, 0xe5ab60, [-100, 556.8, 1000]);
    // venusGrid.rotation.z = 2.05;
    scene.add(venusGrid);
    
    
    // only planet with liquid water and life
    // Inside a fish's mouth in some pond?
    // Or on a fishing pole as bait nearby?
    // growing on a tree?
    var earth;
    earthGrid = buildSphereGrid(5.096, 0x00ad15, [-150, 556.8, 1000]);
    // earthGrid.rotation.z = 0.41;
    scene.add(earthGrid);
    
    // last item to be collected
    // denizen will say some dialogue:
    // "Oh dear, I hate to ask for your help again, 
    // but there seems to be one more piece missing...
    // Could you bring me the Moon?"
    // Maybe put inside of a cheese wheel to reference the old myth/wive's tale
    // that the moon is made of cheese
    var moon;
    moonGrid = buildSphereGrid(1.3896, 0xb2bdc6, [-150, 556.8, 1000], 10);
    // moonGrid.rotation.z = 0.12;
    scene.add(moonGrid);
    
    // moonOrbit = new THREE.Group();
    // moonOrbit.add(moonGrid);
    // moonOrbit.position.set(earthGrid.position);
    
    
    // the 'red planet', inhabited by "Opportunity", NASA's rover
    // make mars one of the rock samples the rover is carrying
    // maybe reference "My battery is low and it's getting dark."
    // aha! make the player give the rover new batteries and turn on a light
    var mars;    
    marsGrid = buildSphereGrid(2.7116, 0xb58f72, [-200, 556.8, 1000]);
    // marsGrid.rotation.z = 0.44;
    scene.add(marsGrid);
    
    
    // big gas giant, big red spot
    // field of tornados, inside a tornado with a red spot 
    // add patterns onto other tornados as well so its not as obvious
    var jupiter;
    jupiterGrid = buildSphereGrid(55.92, 0xbd7f5a, [-300, 556.8, 1000]);
    // jupiterGrid.rotation.z = 0.054;
    scene.add(jupiterGrid);
    
    
    // well-known for it's many rings, maybe a circle of rocks with one missing?
    var saturn;
    saturnGrid = buildSphereGrid(46.6, 0xfaf8b4, [-500, 556.8, 1000]);
    // saturnGrid.rotation.z = 0.47;
    var geometry = new THREE.RingGeometry(75, 125, 32);
    var material = new THREE.MeshBasicMaterial({
        color: 0xfaf8b4, 
        // opacity: 0.1,
        side: THREE.DoubleSide,
        wireframe: true,
    });
    saturnRings = new THREE.Mesh(geometry, material);
    saturnRings.position.set(-500, 556.8, 1000);
    saturnRings.rotation.x = 1.57;
    scene.add(saturnRings);
    scene.add(saturnGrid);
    
    
    // it's upside down compared to the other planets
    // a table with multiple cups on top
    // one is upside-down with the planet inside
    var uranus;
    uranusGrid = buildSphereGrid(20.288, 0x6eaab9, [-690, 556.8, 1000]);
    // uranusGrid.rotation.z = 1.71;
    uranusGrid.rotation.z = 1.57;
    geometry = new THREE.RingGeometry(50, 51, 20);
    material = new THREE.MeshBasicMaterial({
        color: 0xffffff,
        // opacity: 0.5,
        side: THREE.DoubleSide,
        wireframe: true,
    });
    uranusRings = new THREE.Mesh(geometry, material);
    uranusRings.position.set(-690, 556.8, 1000);
    uranusRings.rotation.y = 1.57;
    scene.add(uranusRings);
    
    scene.add(uranusGrid);



    // blue, with the 'great dark spot'
    // have the player choose a blueberry from a fruit stand 
    var neptune;
    neptuneGrid = buildSphereGrid(19.7, 0x415495, [-775, 556.8, 1000]);
    // neptuneGrid.rotation.z = 0.49;
    scene.add(neptuneGrid);



    // tiny, not considered a planet anymore, has a heart on the surface
    // have the player match two objects together, have a heart float up after
    var pluto;
    plutoGrid = buildSphereGrid(0.9488, 0x34030a, [-850, 556.8, 1000]);
    // plutoGrid.rotation.z = 2.14;
    // plutoGrid.rotation.y = 1.71;
    scene.add(plutoGrid);


    controls = new PointerLockControls(camera, document.body);

    document.body.addEventListener('click', function () {

        controls.lock();

    }, false);

    scene.add(controls.getObject());

    var onKeyDown = function (event) {
        // console.log(event.keyCode);
        switch (event.keyCode) {

            case 38: // up
            case 87: // w
            moveForward = true;
            break;
            
            case 37: // left
            case 65: // a
            moveLeft = true;
            break;
            
            case 40: // down
            case 83: // s
            moveBackward = true;
            break;
            
            case 39: // right
            case 68: // d
            moveRight = true;
            break;
            
            case 32: // space
            if (canJump === true) velocity.y += 350;
            canJump = false;
            break;
            
            case 16: // shift
            sprint = true;
            break;
            
            case 17: // control
            crouch = true;
            break;
        }
        
    };
    
    var onKeyUp = function (event) {
        
        switch (event.keyCode) {
            
            case 38: // up
            case 87: // w
            moveForward = false;
            break;
            
            case 37: // left
            case 65: // a
            moveLeft = false;
            break;
            
            case 40: // down
            case 83: // s
            moveBackward = false;
            break;
            
            case 39: // right
            case 68: // d
            moveRight = false;
            break;
            
            case 16:
            sprint = false;
            break;

            case 17: 
            crouch = false;
            break;
        }
            
    };
        
    document.addEventListener('keydown', onKeyDown, false);
    document.addEventListener('keyup', onKeyUp, false);

    raycasternegY = new THREE.Raycaster(new THREE.Vector3(), new THREE.Vector3(0, - 1, 0), 0, 20);

    ground = new THREE.Group();
    scene.add(ground);

    var materialArray = [];
    materialArray.push(new THREE.MeshBasicMaterial({ color: 0x000000 }));
    materialArray.push(new THREE.MeshBasicMaterial({ color: 0x000000 }));
    materialArray.push(new THREE.MeshBasicMaterial({ color: 0x000000 }));
    materialArray.push(new THREE.MeshBasicMaterial({ color: 0x000000 }));
    materialArray.push(new THREE.MeshBasicMaterial({ color: 0x000000 }));
    var image = new THREE.TextureLoader().load('src/images/skybox.png');
    materialArray.push(new THREE.MeshBasicMaterial({ map: image }));
    for (var i = 0; i < 6; i++)
        materialArray[i].side = THREE.BackSide;
    var skyboxMaterial = materialArray;
    var skyboxGeom = new THREE.CubeGeometry(9000, 9000, 9000, 1, 1, 1);
    skybox = new THREE.Mesh(skyboxGeom, skyboxMaterial);
    scene.add(skybox);








    
    // floor

    var gridHelper = new THREE.GridHelper(10000, 500, 0x0400ff, 0x0400ff);
    scene.add(gridHelper);
    










    
    stlloader.load('./src/models/mobius.stl', function (object){
        var material = new THREE.MeshNormalMaterial();
        object.computeBoundingBox();
        object.computeVertexNormals();
        object.center();

        var attrib = object.getAttribute('position');
        var positions = attrib.array;
        var vertices = [];
        for (var i = 0, n = positions.length; i < n; i += 3) {
            var x = positions[i];
            var y = positions[i + 1];
            var z = positions[i + 2];
            vertices.push(new THREE.Vector3(x, y, z));
        }
        var faces = [];
        for (var i = 0, n = vertices.length; i < n; i += 3) {
            faces.push(new THREE.Face3(i, i + 1, i + 2));
        }

        var geometry = new THREE.Geometry();
        geometry.vertices = vertices;
        geometry.faces = faces;
        geometry.computeFaceNormals();
        geometry.mergeVertices()
        geometry.computeVertexNormals();

        mobius = new THREE.Mesh(geometry, material);

        mobius.position.set( 0, -1000, 0 );
        mobius.rotation.set( (Math.PI / 2), 0, 0 );
        mobius.scale.set( 38, 38, 38 );


        
        mobius.castShadow = true;
        mobius.receiveShadow = true;
        
        ground.add(mobius);
    });













    boundingBox = new THREE.BoxGeometry(10, 10, 10);

    
    var material = new THREE.MeshBasicMaterial({
        wireframe: true,
        // visible: false,
    });

    boundingBox = new THREE.Mesh( boundingBox, material );
    boundingBox.position.set(camera.position);

    scene.add(boundingBox);















    // var geometry = new THREE.ParametricBufferGeometry();
    // var material = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
    // var klein = new THREE.Mesh(geometry, material);
    // klein.position.x = 30;
    // klein.position.y = 10;
    // klein.position.z = 30;
    // scene.add(klein);
    // objects.push(klein);


    // var light = new THREE.PointLight(0xff0000, 1, 100);
    // light.position.set(50, 50, 50);
    // scene.add(light);







    // objects
    
    var boxGeometry = new THREE.TorusBufferGeometry(20, 10);

    for (var i = 0; i < 500; i++) {

        var boxMaterial = new THREE.MeshNormalMaterial({ 
            // specular: 0xffffff, 
            flatShading: true, 
        });

        var box = new THREE.Mesh(boxGeometry, boxMaterial);
        box.position.set(
            Math.floor(Math.random() * 20 - 10) * 200,
            Math.floor(Math.random() * 20) * 20 + 50,
            Math.floor(Math.random() * 20 - 10) * 200
        );

        // scene.add(box);
        // objects.push(box);
        // rename objects later


    }






    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);

    window.addEventListener('resize', onWindowResize, false);

}

function onWindowResize() {

    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();

    renderer.setSize(window.innerWidth, window.innerHeight);

}

function buildSphereGrid(radius, color, position, translation=0) {
    var geometry = new THREE.SphereGeometry(radius, 22, 22);
    var material = new THREE.MeshBasicMaterial({
        color: color,
        wireframe: true,
    });
    geometry.translate(translation, 0, 0);
    var sphereGrid = new THREE.Mesh(geometry, material);
    sphereGrid.position.set(position[0], position[1], position[2])
    return sphereGrid;
}

function animate() {

    window.playerLocation = camera.position;
    ground.rotation.y += 0.01;

    // axis rotation
    sunGrid.rotation.y += 0.0005;
    mercuryGrid.rotation.y += 0.002;
    venusGrid.rotation.y -= 0.002;
    earthGrid.rotation.y += 0.002;
    marsGrid.rotation.y += 0.002;
    jupiterGrid.rotation.y += 0.002;
    saturnGrid.rotation.y += 0.002;
    saturnRings.rotation.z -= 0.002;
    uranusGrid.rotation.x += 0.002;
    uranusRings.rotation.x += 0.002;
    neptuneGrid.rotation.y += 0.002;
    plutoGrid.rotation.y += 0.002;
    
    // revolutions (days) to hours
    // moon around earth - 27.322 - 655.728
    moonGrid.rotation.y += 0.003;

    // mercury - 87.97 - 2111.28 
    // mercuryGrid.rotation.y += 0.00276231;
    
    // venus - 224.7 - 5392.8              
    // venusGrid.rotation.y += 0.00108144;
    
    // earth - 365.26 - 8766.24             
    // earthGrid.rotation.y += 0.00066528;
    
    // mars - 686.98 - 16487.52             
    // marsGrid.rotation.y += 0.00035372;
    
    // jupiter - 4332.82 - 103987.68        
    // jupiterGrid.rotation.y += 0.00005608;
    
    // saturn - 10755.7 - 258136.8          
    // saturnGrid.rotation.y += 0.00002259;
    
    // uranus - 30687.15 - 736491.6         
    // uranusGrid.rotation.y += 0.00000792;
    
    // neptune - 60190.03 - 1444560.72      
    // neptuneGrid.rotation.y += 0.00000404;
    
    // pluto - 90553 - 2173272              
    // plutoGrid.rotation.y += 0.00000268;

    // console.log(boundingBox.position.x == camera.position.x);
    // boundingBox
    // boundingBox.position = camera.position;
    // boundingBox.setXYZ(camera.position);

    requestAnimationFrame(animate);

    if (controls.isLocked === true) {


        // use for collisions later
        raycasternegY.ray.origin.copy(controls.getObject().position);
        raycasternegY.ray.origin.y -= 10;
        var negYIntersections = raycasternegY.intersectObjects(objects);
        var negYObject = negYIntersections.length > 0;

        // var boxIntersections = boundingBox.intersectObjects(objects);
        // console.log(boxIntersections, boxIntersections.length);
        
        // scene.add(new THREE.ArrowHelper(raycasternegY.ray.direction, raycasternegY.ray.origin, 300, 0xff0000));

        
        
        var time = performance.now();
        var delta = (time - prevTime) / 1000;
        
        velocity.x -= velocity.x * 10.0 * delta;
        velocity.z -= velocity.z * 10.0 * delta;
        
        
        // this one will be modified based on mobius position
        velocity.y -= 9.8 * 100.0 * delta; // 100.0 = mass
        
        direction.z = Number(moveForward) - Number(moveBackward);
        direction.x = Number(moveRight) - Number(moveLeft);
        direction.normalize(); // this ensures consistent movements in all directions


        let movementSpeed = 500.0;
        if(sprint) movementSpeed += 500.0;
        if(crouch){
            camera.position.y -= 5.0;
            movementSpeed /= 2;
        } 

        if (moveForward || moveBackward) velocity.z -= direction.z * movementSpeed * delta;
        if (moveLeft || moveRight) velocity.x -= direction.x * movementSpeed * delta;




        if (negYObject === true) {
            velocity.y = Math.max(0, velocity.y);
            canJump = true;
        }

        controls.moveRight(- velocity.x * delta);
        controls.moveForward(- velocity.z * delta);

        controls.getObject().position.y += (velocity.y * delta); // new behavior
        
        if (controls.getObject().position.y < 10) {
            
            velocity.y = 0;
            controls.getObject().position.y = 10;
            
            canJump = true;
            
        }
        
        prevTime = time;
        
    }
    
    boundingBox.position.y = camera.position.y;
    boundingBox.position.x = camera.position.x;
    boundingBox.position.z = camera.position.z;

    renderer.render(scene, camera);
}