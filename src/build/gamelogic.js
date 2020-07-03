import * as THREE from './three.module.js';
import { PointerLockControls } from './PointerLockControls.js';
import { STLLoader } from './STLLoader.js';
        
var camera, scene, renderer, controls;

var objects = [];

var boundingBox;
// var wireframe;
var movementRay;
// var raycasterposX;
// var raycasterposY;
// var raycasterposZ;
// var raycasternegX;
var raycasternegY;
// var raycasternegZ;

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
var loader = new STLLoader();

init();
animate();

function init() {

    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 1, 1000);
    camera.position.y = 10;

    scene = new THREE.Scene();
    scene.background = new THREE.Color('black');
    // scene.background = new THREE.Color('white');
    // scene.fog = new THREE.Fog(0x000000, 0, 750);
    // var playerLight = new THREE.SpotLight();
    var light = new THREE.HemisphereLight(0xeeeeff, 0x777788, 0.75);
    light.position.set(0.5, 1, 0.75);
    scene.add(light);

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
    // raycasterposY = new THREE.Raycaster(new THREE.Vector3(), new THREE.Vector3(0, 1, 0), 0, 20);
    // raycasternegX = new THREE.Raycaster(new THREE.Vector3(), new THREE.Vector3(- 1, 0, 0), 0, 20);
    // raycasterposX = new THREE.Raycaster(new THREE.Vector3(), new THREE.Vector3(1, 0, 0), 0, 20);
    // raycasternegZ = new THREE.Raycaster(new THREE.Vector3(), new THREE.Vector3(0, 0, - 1), 0, 20);
    // raycasterposZ = new THREE.Raycaster(new THREE.Vector3(), new THREE.Vector3(0, 0, 1), 0, 20);


    movementRay = new THREE.Raycaster(new THREE.Vector3(), new THREE.Vector3(), 0, 10);











    
    // floor
    
    var floorGeometry = new THREE.PlaneBufferGeometry(2000, 2000, 100, 100);
    floorGeometry.rotateX(- Math.PI / 2);
    
    // vertex displacement
    
    // var position = floorGeometry.attributes.position;
    console.log(floorGeometry.attributes.position);
    // for (var i = 0, l = position.count; i < l; i++) {
        
    //     vertex.fromBufferAttribute(position, i);
        
    //     vertex.x += Math.random() * 20 - 10;
    //     vertex.y += Math.random() * 2;
    //     vertex.z += Math.random() * 20 - 10;
        
    //     position.setXYZ(i, vertex.x, vertex.y, vertex.z);
        
    // }
    
    // floorGeometry = floorGeometry.toNonIndexed(); // ensure each face has unique vertices
    
    // position = floorGeometry.attributes.position;
    // var colors = [];
    
    // for (var i = 0, l = position.count; i < l; i++) {
        
    //     color.setHSL(Math.random() * 0.3 + 0.5, 0.75, Math.random() * 0.25 + 0.75);
    //     colors.push(color.r, color.g, color.b);
        
    // }
    
    // floorGeometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
    
    // var floorMaterial = new THREE.MeshNormalMaterial(
    //     // { vertexColors: true }
    //     );
    
    var floorMaterial = new THREE.LineBasicMaterial({
        color: 0x0400ff,
    });
    
    // floorGeometry.computeLineDistances();

    var floor = new THREE.Line(floorGeometry, floorMaterial);
    scene.add(floor);
    










    
    loader.load('./src/models/mobius_2.stl', function (object){
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

        var mobius = new THREE.Mesh(geometry, material);

        mobius.position.set( 0, 25, -50 );
        mobius.rotation.set( (Math.PI / 2), 0, 0 );
        mobius.scale.set( 1, 1, 1 );


        
        mobius.castShadow = true;
        mobius.receiveShadow = true;
        
        
        objects.push(mobius);
        scene.add( mobius );
    });














    boundingBox = new THREE.BoxGeometry(15, 15, 15);
    // boundingBox = new THREE.WireframeGeometry(boundingBox);
    // boundingBox.position = (camera.position.x, 20, camera.position.z);
    // boundingBox.position.y += 10;

    // var material = new THREE.LineBasicMaterial({ color: 0xff0000 });
    // boundingBox = new THREE.LineSegments(boundingBox, material);
    // boundingBox.computeLineDistances();

    // var matLineBasic = new THREE.LineBasicMaterial({ color: 0xff0000 });
    // matLineDashed = new THREE.LineDashedMaterial({ scale: 2, dashSize: 1, gapSize: 1 });

    // wireframe = new THREE.LineSegments(geo, matLineBasic);
    // wireframe.computeLineDistances();
    // wireframe.visible = true;
    // wireframe1.position = camera.position;
    
    var material = new THREE.MeshBasicMaterial({
        wireframe: true,
        // visible: false,
    });

    // material.transparent = true;
    // material.opacity = 5.0;
    boundingBox = new THREE.Mesh( boundingBox, material );
    boundingBox.position.x = camera.position.x;
    boundingBox.position.y = camera.position.y;
    boundingBox.position.z = camera.position.z;

    scene.add(boundingBox);
    // scene.add(wireframe);















    // var geometry = new THREE.ParametricBufferGeometry();
    // var material = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
    // var klein = new THREE.Mesh(geometry, material);
    // klein.position.x = 30;
    // klein.position.y = 10;
    // klein.position.z = 30;
    // scene.add(klein);
    // objects.push(klein);






    // objects
    
    var boxGeometry = new THREE.BoxBufferGeometry(20, 20, 20);
    // boxGeometry = boxGeometry.toNonIndexed(); // ensure each face has unique vertices
    
    // position = boxGeometry.attributes.position;
    // colors = [];

    // for (var i = 0, l = position.count; i < l; i++) {

    //     color.setHSL(Math.random() * 0.3 + 0.5, 0.75, Math.random() * 0.25 + 0.75);
    //     colors.push(color.r, color.g, color.b);

    // }

    // boxGeometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));

    for (var i = 0; i < 500; i++) {

        var boxMaterial = new THREE.MeshNormalMaterial({ 
            specular: 0xffffff, 
            flatShading: true, 
            // vertexColors: true 
        });
        // boxMaterial.color.setHSL(Math.random() * 0.2 + 0.5, 0.75, Math.random() * 0.25 + 0.75);

        var box = new THREE.Mesh(boxGeometry, boxMaterial);
        box.position.x = Math.floor(Math.random() * 20 - 10) * 100;
        box.position.y = Math.floor(Math.random() * 20) * 20 + 10;
        box.position.z = Math.floor(Math.random() * 20 - 10) * 100;

        scene.add(box);
        objects.push(box);

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

function animate() {

    window.playerLocation = camera.position;
    boundingBox.position.x = camera.position.x;
    boundingBox.position.y = camera.position.y;
    boundingBox.position.z = camera.position.z;








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
        // scene.add(new THREE.ArrowHelper(movementRay.ray.direction, movementRay.ray.origin, 300, 0xff0000));
        
        
        
        // console.log(camera.position, movementRay.ray.origin)
        
        
        var time = performance.now();
        var delta = (time - prevTime) / 1000;
        
        velocity.x -= velocity.x * 10.0 * delta;
        velocity.z -= velocity.z * 10.0 * delta;
        
        
        // this one will be modified based on mobius position
        velocity.y -= 9.8 * 100.0 * delta; // 100.0 = mass
        
        direction.z = Number(moveForward) - Number(moveBackward);
        direction.x = Number(moveRight) - Number(moveLeft);
        direction.normalize(); // this ensures consistent movements in all directions
        
        






        movementRay.ray.origin.copy(camera.position);
        
        // direction.x >= 0 ? movementRay.ray.direction.x += 10 : movementRay.ray.direction.x -= 10;
        // direction.y >= 0 ? movementRay.ray.direction.y += 10 : movementRay.ray.direction.y -= 10;
        // direction.z >= 0 ? movementRay.ray.direction.z += 10 : movementRay.ray.direction.z -= 10;



        
        // movementRay.ray.direction = direction * velocity;
        var objectIntercept = movementRay.intersectObjects(objects);
        var collision = objectIntercept.length > 0;
        // console.log(collision);
    
        // scene.add(new THREE.ArrowHelper((camera.position.x + (), camera.position.y + (), camera.position.z + ())), movementRay.ray.origin, 20, 0xff0000));
        
        
        


        let movementSpeed = 500.0;
        if(sprint) movementSpeed += 500.0;
        if(crouch) camera.position.y -= 5.0;

        if (moveForward || moveBackward) velocity.z -= direction.z * movementSpeed * delta;
        if (moveLeft || moveRight) velocity.x -= direction.x * movementSpeed * delta;




        if (negYObject === true) {
            velocity.y = Math.max(0, velocity.y);
        }
        // if (negXObject === true) {
        //     velocity.x = Math.max(0, velocity.x);
        // }
        // if (negZObject === true) {
        //     velocity.z = Math.max(0, velocity.z);
        // }


        // if (posYObject === true) {
        //     velocity.y = Math.min(0, velocity.y);
        // }
        // if (posXObject === true) {
        //     velocity.x = Math.min(0, velocity.y);
        // }
        // if (posZObject === true) {
        //     velocity.z = Math.min(0, velocity.y);
        // }














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
    // console.log(camera.position);
    renderer.render(scene, camera);
    // var tmpVel = velocity;
    // if (tmpVel.x < 0.0001)
    // console.log();
}