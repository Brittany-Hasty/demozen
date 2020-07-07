import * as THREE from './three.module.js';
import { PointerLockControls } from './PointerLockControls.js';
import { STLLoader } from './STLLoader.js';
// import { PDBLoader } from './PDBLoader.js';
        
var camera, scene, renderer, controls, mobius, skybox, ground, boundingBox, raycasternegY;
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
    // var sunGrid = buildSphereGrid(182, 0xffff00, [-1000, 0, -1050]);
    // scene.add(sunGrid);


    // closest to the sun, fastest body, maybe a race of some sort?
    var mercury;
    // var mercuryGrid = buildSphereGrid(2, 0xffff00, [-1000, 0, ]);
    // scene.add(mercuryGrid);


    // runaway greenhouse effect, add a greenhouse and a few potted plants
    // then add a shovel that can be equipped and used to dig them up
    var venus;
    // var venusGrid = buildSphereGrid(5, 0xffff00, [-1000, 0, ]);
    // scene.add(venusGrid);


    // only planet with liquid water and life
    // Inside a fish's mouth in some pond?
    // Or on a fishing pole as bait nearby?
    var earth;
    // var earthGrid = buildSphereGrid(5, 0xffff00, [-1000, 0, ]);
    // scene.add(earthGrid);


    // last item to be collected
    // denizen will say some dialogue:
    // "Oh dear, I hate to ask for your help again, 
    // but there seems to be one more piece missing...
    // Could you bring me the Moon?"
    // Maybe put inside of a cheese wheel to reference the old myth/wive's tale
        // that the moon is made of cheese
    var moon;
    // var moonGrid = buildSphereGrid(1.5, 0xffff00, [-999.93, 0, ]);
    // scene.add(moonGrid);


    // the 'red planet', inhabited by "Opportunity", NASA's rover
    // make mars one of the rock samples the rover is carrying
    // maybe reference "My battery is low and it's getting dark."
        // aha! make the player give the rover new batteries and turn on a light
    var mars;    
    // var marsGrid = buildSphereGrid(3, 0xffff00, [-1000, 0, ]);
    // scene.add(marsGrid);


    // big gas giant, big red spot
    // field of tornados, inside a tornado with a red spot 
        // add patterns onto other tornados as well so its not as obvious
    var jupiter;
    // var jupiterGrid = buildSphereGrid(60, 0xffff00, [-1000, 0, ]);
    // scene.add(jupiterGrid);


    // well-known for it's many rings, maybe a circle of rocks with one missing?
    var saturn;
    // var saturnGrid = buildSphereGrid(50, 0xffff00, [-1000, 0, ]);
    // scene.add(saturnGrid);


    // it's upside down compared to the other planets
    // a table with multiple cups on top
        // one is upside-down with the planet inside
    var uranus;
    // var uranusGrid = buildSphereGrid(20, 0xffff00, [-1000, 0, ]);
    // scene.add(uranusGrid);


    // blue, with the 'great dark spot'
    // have the player choose a blueberry from a fruit stand 
    var neptune;
    // var neptuneGrid = buildSphereGrid(20, 0xffff00, [-1000, 0, ]);
    // scene.add(neptuneGrid);



    // tiny, not considered a planet anymore, has a heart on the surface
    // have the player match two objects together, have a heart float up after
    var pluto;
    // var plutoGrid = buildSphereGrid(1, 0xffff00, [-1000, 0, 0]);
    // scene.add(plutoGrid);


2222222222222222222




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
    










    
    stlloader.load('./src/models/mobius_2.stl', function (object){
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
    boundingBox.position.x = camera.position.x;
    boundingBox.position.y = camera.position.y;
    boundingBox.position.z = camera.position.z;

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
        box.position.x = Math.floor(Math.random() * 20 - 10) * 200;
        box.position.y = Math.floor(Math.random() * 20) * 20 + 50;
        box.position.z = Math.floor(Math.random() * 20 - 10) * 200;

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

function buildSphereGrid(radius, color, position) {
    var geometry = new THREE.SphereGeometry(radius, 22, 22);
    var material = new THREE.MeshBasicMaterial({
        color: color,
        wireframe: true,
    });
    var sphereGrid = new THREE.Mesh(geometry, material);
    sphereGrid.position.x = position[0];
    sphereGrid.position.y = position[1];
    sphereGrid.position.z = position[2];
    return sphereGrid;
}

function animate() {

    window.playerLocation = camera.position;

    // scene.mobius.rotation.x += 1;
    ground.rotation.y += 0.01;







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