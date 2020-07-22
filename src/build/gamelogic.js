import * as THREE from './three.module.js';
import { PointerLockControls } from './PointerLockControls.js';
import { STLLoader } from './STLLoader.js';

// import { PDBLoader } from './PDBLoader.js';

const state = {};

init();
animate();

function init() {
    state.loadingBar = {
        "loadedModels": 0,
        "totalModels": 3,
    }
    var velocity = new THREE.Vector3();
    var direction = new THREE.Vector3();
    var vertex = new THREE.Vector3();
    var color = new THREE.Color();
    var prevTime = performance.now();
    let stlloader = new STLLoader();
    // let pdbloader = new THREE.PDBLoader();
    let textureloader = new THREE.TextureLoader();

    state.loaders = {
        "stlloader": stlloader,
        "textureloader": textureloader,
        // "pdbloader": pdbloader,
    }

    state.physicsVars = {
        "moveForward": false,
        "moveBackward": false,
        "moveLeft": false,
        "moveRight": false,
        "sprint": false,
        "crouch": false,
        "canJump": false,
        "velocity": velocity,
        "direction": direction,
        "vertex": vertex,
        "color": color,
        "prevTime": prevTime,
    }

    state.playerInv = [];
    state.miniSpaceObjs = [];
    state.spaceObjGrids = [];
    state.backgroundObjs = [];
    state.collectableObjs = [];
    state.dynamicObjs = {};
    state.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 1, 10000);
    state.camera.position.y = 10;
    state.scene = new THREE.Scene();
    state.scene.background = new THREE.CubeTextureLoader()
    .setPath('src/images/')
    .load(['blackSquare.png', 'blackSquare.png', 'blackSquare.png', 'blackSquare.png', 'blackSquare.png', 'skybox.png']);
    var light = new THREE.HemisphereLight(0xffffff, 0xffffff, 1);
    light.position.set(0, 1000, 0);
    state.scene.add(light);
    state.controls = new PointerLockControls(state.camera, document.body);
    state.scene.add(state.controls.getObject());
    var gridHelper = new THREE.GridHelper(10000, 500, 0x0400ff, 0x0400ff);
    state.scene.add(gridHelper);
    state.renderer = new THREE.WebGLRenderer({ antialias: true });
    state.renderer.setPixelRatio(window.devicePixelRatio);
    state.renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(state.renderer.domElement);
    state.raycasternegY = new THREE.Raycaster(new THREE.Vector3(), new THREE.Vector3(0, - 1, 0), 0, 20);
    
    loadSceneModels();          
                
    var onKeyDown = function (event) {
        // console.log(event.keyCode);
        switch (event.keyCode) {
    
            case 38: // up
            case 87: // w
            state.physicsVars.moveForward = true;
            break;
            
            case 37: // left
            case 65: // a
            state.physicsVars.moveLeft = true;
            break;
            
            case 40: // down
            case 83: // s
            state.physicsVars.moveBackward = true;
            break;
            
            case 39: // right
            case 68: // d
            state.physicsVars.moveRight = true;
            break;
            
            case 32: // space
            if (state.physicsVars.canJump === true) state.physicsVars.velocity.y += 350;
            state.physicsVars.canJump = false;
            break;
            
            case 16: // shift
            state.physicsVars.sprint = true;
            break;
            
            case 17: // control
            state.physicsVars.crouch = true;
            break;

            case 69: // e
            objectInteractionHandler();
            break;

            case 76: // l
            console.log(state.camera.position);
            break;
        }
        
    };
    
    var onKeyUp = function (event) {
        
        switch (event.keyCode) {
            
            case 38: // up
            case 87: // w
            state.physicsVars.moveForward = false;
            break;
            
            case 37: // left
            case 65: // a
            state.physicsVars.moveLeft = false;
            break;
            
            case 40: // down
            case 83: // s
            state.physicsVars.moveBackward = false;
            break;
            
            case 39: // right
            case 68: // d
            state.physicsVars.moveRight = false;
            break;
            
            case 16:
            state.physicsVars.sprint = false;
            break;
    
            case 17: 
            state.physicsVars.crouch = false;
            break;
        }
            
    };
        

    document.body.addEventListener('click', function () {

        state.controls.lock();

    }, false);
    document.addEventListener('keydown', onKeyDown, false);
    document.addEventListener('keyup', onKeyUp, false);
    window.addEventListener('resize', onWindowResize, false);
                
    console.log(state);
                
}

function animate() {

    window.playerLocation = state.camera.position;

    rotateSceneObjects();
    requestAnimationFrame(animate);

    if (state.controls.isLocked === true) {


        // use for collisions later
        state.raycasternegY.ray.origin.copy(state.controls.getObject().position);
        state.raycasternegY.ray.origin.y -= 10;
        var negYIntersections = state.raycasternegY.intersectObjects(state.backgroundObjs);
        var negYObject = negYIntersections.length > 0;

        var time = performance.now();
        var delta = (time - state.physicsVars.prevTime) / 1000;
        
        state.physicsVars.velocity.x -= state.physicsVars.velocity.x * 10.0 * delta;
        state.physicsVars.velocity.z -= state.physicsVars.velocity.z * 10.0 * delta;
    
        state.physicsVars.velocity.y -= 9.8 * 100.0 * delta; // 100.0 = mass
        
        state.physicsVars.direction.z = Number(state.physicsVars.moveForward) - Number(state.physicsVars.moveBackward);
        state.physicsVars.direction.x = Number(state.physicsVars.moveRight) - Number(state.physicsVars.moveLeft);
        state.physicsVars.direction.normalize(); // this ensures consistent movements in all directions

        let movementSpeed = 500.0;
        if(state.physicsVars.sprint) movementSpeed += 500.0;
        if(state.physicsVars.crouch){
            state.camera.position.y -= 5.0;
            movementSpeed /= 2;
        } 

        if (state.physicsVars.moveForward || state.physicsVars.moveBackward) state.physicsVars.velocity.z -= state.physicsVars.direction.z * movementSpeed * delta;
        if (state.physicsVars.moveLeft || state.physicsVars.moveRight) state.physicsVars.velocity.x -= state.physicsVars.direction.x * movementSpeed * delta;




        if (negYObject === true) {
            state.physicsVars.velocity.y = Math.max(0, state.physicsVars.velocity.y);
            state.physicsVars.canJump = true;
        }

        state.controls.moveRight(- state.physicsVars.velocity.x * delta);
        state.controls.moveForward(- state.physicsVars.velocity.z * delta);

        state.controls.getObject().position.y += (state.physicsVars.velocity.y * delta); // new behavior
        
        if (state.controls.getObject().position.y < 10) {
            
            state.physicsVars.velocity.y = 0;
            state.controls.getObject().position.y = 10;
            
            state.physicsVars.canJump = true;
            
        }
        
        state.physicsVars.prevTime = time;
        
    }

    state.renderer.render(state.scene, state.camera);
}

function loadSceneModels() {
    buildSolarSystem();
    let minis = state.miniSpaceObjs;
    minis.push(buildSphere(2.5, 0xff8800, [40, 10, 40], "the Sun", 0, './src/models/textures/sun-texture.jpg'));
    minis.push(buildSphere(2.5, 0xff8800, [30, 10, 40], "Mercury", 0, './src/models/textures/mercury-texture.jpg'));
    minis.push(buildSphere(2.5, 0xff8800, [20, 10, 40], "Venus", 0, './src/models/textures/venus-texture.jpg'));
    minis.push(buildSphere(2.5, 0xff8800, [10, 10, 40], "Earth", 0, './src/models/textures/earth-texture.jpg'));
    minis.push(buildSphere(2.5, 0xff8800, [0, 10, 40], "the Moon", 0, './src/models/textures/moon-texture.jpg'));
    minis.push(buildSphere(2.5, 0xff8800, [-10, 10, 40], "Mars", 0, './src/models/textures/mars-texture.jpg'));
    minis.push(buildSphere(2.5, 0xff8800, [-20, 10, 40], "Jupiter", 0, './src/models/textures/jupiter-texture.jpg'));
    minis.push(buildSphere(2.5, 0xff8800, [-30, 10, 40], "Saturn", 0, './src/models/textures/saturn-texture.jpg'));
    minis.push(buildSphere(2.5, 0xff8800, [-40, 10, 40], "Uranus", 0, './src/models/textures/uranus-texture.jpg'));
    minis.push(buildSphere(2.5, 0xff8800, [-50, 10, 40], "Neptune", 0, './src/models/textures/neptune-texture.jpg'));
    minis.push(buildSphere(2.5, 0xff8800, [-60, 10, 40], "Pluto", 0, './src/models/textures/pluto-texture.jpg'));
    minis.forEach((obj) => state.scene.add(obj));

    let loader = state.loaders.stlloader;
    loader.load('./src/models/background/mobius.stl', function (object) {
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

        state.dynamicObjs.mobius = new THREE.Mesh(geometry, material);

        state.dynamicObjs.mobius.position.set(0, -775, 0);
        state.dynamicObjs.mobius.rotation.set((Math.PI / 2), 0, 0);
        state.dynamicObjs.mobius.scale.set(150, 150, 150);
        state.dynamicObjs.mobius.name = "Mobius";
        state.scene.add(state.dynamicObjs.mobius);
    });
    loadSTLModel('./src/models/background/cube-structure.stl', [-10, 10, 0], [0,0,0], [0.01,0.01,0.01], "A Strange Cube Structure.", "strangeCube");
    loadSTLModel('./src/models/puzzle/earth/Tree.stl', [-150, 0, -300], [-1.57, 0, 0], [3, 3, 3], "It's a fruit tree.", "backgroundObjs");
    loadSTLModel('./src/models/puzzle/jupiter/tornado.stl', [50, -3, -200], [-1.57, 0, 0], [1, 1, 1], "It's a tornado.", "backgroundObjs");
    loadSTLModel('./src/models/puzzle/mars/battery.stl', [120, 0, -180], [-1.57, 0, 0], [0.05, 0.05, 0.05], "It's a battery, this might come in handy later...", "collectableObjs");
    loadSTLModel('./src/models/puzzle/mars/curiosity.stl', [140, 0, -200], [-1.57, 0, 0], [0.1, 0.1, 0.1], "My battery is low and it's getting dark.", "backgroundObjs");
    loadSTLModel('./src/models/puzzle/mars/streetlamp.stl', [120, 0, -200], [-1.57, 0, 0], [1, 1, 1], "It's a solar-powered streetlamp.", "backgroundObjs");
    loadSTLModel('./src/models/background/low-poly-face.stl', [-200, 0, -220], [-1.57, 0, 0], [1, 1, 1], "Its gaze pierces your soul and it appears sick.", "backgroundObjs");
    loadSTLModel('./src/models/puzzle/mercury/Thermometer.stl', [-200, -3, -185], [-1.57, 1.57, 0.2], [0.4, 0.4, 0.4], "It's a thermometer, this might come in handy later...", "collectableObjs");
    loadSTLModel('./src/models/puzzle/moon/cheese-wheel.stl', [-240, 7, -185], [1.57, 0, 1.57], [0.4, 0.4, 0.4], "A classic cheese wheel.", "backgroundObjs");
    loadSTLModel('./src/models/puzzle/neptune/market-stall.stl', [-290, 8, -200], [-1.57, 0, -1.57], [2.5, 2.5, 2.5], "It's a fruit stand, I might be able to buy something.", "backgroundObjs");
    loadSTLModel('./src/models/puzzle/neptune/Apple.stl', [-297.5, 8.5, -199.5], [-1.57, 0, -1.57], [0.01, 0.01, 0.01], "A delicious looking apple.", "backgroundObjs");
    loadSTLModel('./src/models/puzzle/neptune/coin.stl', [-295, 0, -190], [-1.57, 0, -1.57], [0.025, 0.025, 0.025], "It looks like some sort of galactic coin, this might come in handy later...", "collectableObjs");
    loadSTLModel('./src/models/puzzle/neptune/Grapes.stl', [-295.9, 7.5, -200], [0, -3.14, 0], [0.025, 0.025, 0.025], "Deliciously ripe grapes.", "backgroundObjs");
    loadSTLModel('./src/models/puzzle/neptune/Pineapple.stl', [-297.5, 8.5, -201], [-1.57, 0, -1.57], [0.05, 0.05, 0.05], "It's a pineapple, yum!", "backgroundObjs");
    loadSTLModel('./src/models/puzzle/neptune/Strawberry.stl', [-296.5, 8.5, -196], [-1.57, 0, 0], [0.025, 0.025, 0.025], "A single strawberry, but it is sizeable.", "backgroundObjs");
    loadSTLModel('./src/models/puzzle/pluto/bone.stl', [-320, 0, -190], [-1.57, 0, 0], [0.03, 0.03, 0.03], "It looks like a bone and you'd rather not think about where it came from. It may come in handy later...", "collectableObjs");
    loadSTLModel('./src/models/puzzle/pluto/Puppy.stl', [-320, 0, -200], [-1.57, 0, 0], [0.25, 0.25, 0.25], "A cute puppy. It looks at you expectantly.", "backgroundObjs");
    loadSTLModel('./src/models/puzzle/saturn/rock-ring.stl', [170, 0, -200], [-1.57, 0, 0], [0.05, 0.05, 0.05], "It's a circle of rocks, but one appears to be missing.", "backgroundObjs");
    loadSTLModel('./src/models/puzzle/saturn/pebble.stl', [170, 0, -170], [-1.57, 0, 0], [0.05, 0.05, 0.05], "It's a pebble, this might come in handy later...", "collectableObjs");
    loadSTLModel('./src/models/puzzle/sun/lightbulb-glass.stl', [200, 0, -200], [-1.57, 0, 0], [0.05, 0.05, 0.05], "It's a lightbulb, and it seems to be touch activated... somehow...", "backgroundObjs");
    loadSTLModel('./src/models/puzzle/sun/lightbulb-plug.stl', [200, 0, -200], [-1.57, 0, 0], [0.05, 0.05, 0.05], "There is a plug, but it doesn't seem to be connected anywhere", "backgroundObjs");
    loadSTLModel('./src/models/puzzle/uranus/cup-table.stl', [300, 0, -200], [-1.57, 0, 0], [2.5,2.5,2.5], "It's a table with some cups on it", "backgroundObjs");
    loadSTLModel('./src/models/puzzle/venus/greenhouse.stl', [300, 0, 0], [-1.57, 0, 0], [1,1,1], "It's a greenhouse with a few plants inside, one does not seem to have sprouted", "backgroundObjs");
    loadSTLModel('./src/models/puzzle/venus/Dirt.stl', [300, 0, 0], [-1.57, 0, 0], [1, 1, 1], "There is no flower in this pot, maybe it just didn't grow?", "backgroundObjs");
    loadSTLModel('./src/models/puzzle/venus/shovel.stl', [100, 2, 100], [1.57, 0, 0], [0.05, 0.05, 0.05], "It's a shovel, this might come in handy later...", "collectableObjs");
    loadSTLModel('./src/models/denizen/Denizen-body.stl', [0, 10, 50], [-1.57, 0, 3.14], [1, 1, 1], "A strange torso for a strange being", "backgroundObjs");
    loadSTLModel('./src/models/denizen/Denizen-feet.stl', [0, 0, 50], [-1.57, 0, 3.14], [1, 1, 1], "The being appears to have chicken feet", "backgroundObjs");
    loadSTLModel('./src/models/denizen/Denizen-hands.stl', [0, 10, 50], [-1.57, 0, 3.14], [1, 1, 1], "The being's large gloved hands grasp a pencil loosely", "backgroundObjs");
    loadSTLModel('./src/models/denizen/Denizen-head.stl', [0, 20, 50], [-1.57, 0, 3.14], [1, 1, 1], "You assume that this is the being's head, but its shape defies reason", "backgroundObjs");
    // loadSTLModel('./src/models/background/Mountains.stl', [-100, 0, -100], [-1.57, 0, 1.57], [1, 1, 1], "A mountain range", "backgroundObjs");
}

function loadSTLModel(path, position, rotation, scale, name, group) {
    let loader = state.loaders.stlloader;
    loader.load(path, function (object) {
        var material = new THREE.MeshNormalMaterial();
        var geometry = object;
        var model = new THREE.Mesh(geometry, material);
        model.position.set(position[0], position[1], position[2]);
        model.rotation.set(rotation[0], rotation[1], rotation[2]);
        model.scale.set(scale[0], scale[1], scale[2]);
        model.name = name;
        if (group != "strangeCube"){
            let collection = state[group];
            collection.push(model);
            state.scene.add(collection[collection.length-1]);
        } else {
            state.dynamicObjs[group] = model;
            state.scene.add(state.dynamicObjs[group]);
        }
        if(group == "backgroundObjs"){
            state.loadingBar.loadedModels += 1;
        }
    });
}

function onWindowResize() {
    
    state.camera.aspect = window.innerWidth / window.innerHeight;
    state.camera.updateProjectionMatrix();
    
    state.renderer.setSize(window.innerWidth, window.innerHeight);
    
}

function objectInteractionHandler(){
    let playerPosition = state.camera.position;
    let closestMes = "";
    let closestDis = 50;
    let puzzlePiece = false;

    state.miniSpaceObjs.forEach((obj) => {
        let dis = playerPosition.distanceTo(obj.position) - obj.geometry.parameters.radius;
        if (dis < 10 && dis < closestDis) {
            closestDis = dis;
            closestMes = "You have collected " + obj.name;
        }
    })
    state.spaceObjGrids.forEach((obj) => {
        let dis = playerPosition.distanceTo(obj.position) - obj.geometry.parameters.radius;
        if (dis < 10 && dis < closestDis) {
            closestDis = dis;
            closestMes = "A missing piece of the solar system! This appears to be where " + obj.name + " should go...";
        }
    })
    state.backgroundObjs.forEach((obj) => {
        let heightDif = playerPosition.y - obj.position.y;
        if (heightDif < 0){heightDif *= -1;}
        let dis = playerPosition.distanceTo(obj.position) - heightDif;
        if (dis < 50 && dis < closestDis) {
            closestDis = dis;
            closestMes = obj.name;
        }
    })
    state.collectableObjs.forEach((obj) => {
        let heightDif = playerPosition.y - obj.position.y;
        if (heightDif < 0) {
            heightDif *= -1;
        }
        let dis = playerPosition.distanceTo(obj.position) - heightDif;
        if (dis < 50 && dis < closestDis) {
            closestDis = dis;
            closestMes = obj.name;
            puzzlePiece = true;
        }
    })

    if(closestMes != ""){
        console.log(closestMes);
    }

    if(puzzlePiece == true){
        let itemName = "";
        switch (closestMes) {
            case "It's a battery, this might come in handy later...":
                itemName = "Battery";
                
                break;
            case "It's a thermometer, this might come in handy later...":
                itemName = "Thermometer";

                break;
            case "It looks like some sort of galactic coin, this might come in handy later...":
                itemName = "Coin";

                break;
            case "It looks like a bone and you'd rather not think about where it came from. It may come in handy later...":
                itemName = "Bone";

                break;
            case "It's a pebble, this might come in handy later...":
                itemName = "Pebble";

                break;
            case "It's a shovel, this might come in handy later...":
                itemName = "Shovel";

                break;
            default:
                break;
        }

        if (state.playerInv.indexOf(itemName) == -1){
            state.playerInv.push(itemName);
            let invItem = document.createElement("li");
            let invText = document.createTextNode(itemName);
            invItem.appendChild(invText);
            document.getElementById('inventory').appendChild(invItem);
        }
    }
}

function buildSphere(radius, color, position, name="", translation=0, skinPath='') {
    var geometry = new THREE.SphereGeometry(radius, 22, 22);
    if (skinPath != ''){
        var material = new THREE.MeshBasicMaterial({ 
            map: state.loaders.textureloader.load(skinPath) 
        });
    } else {
        var material = new THREE.MeshBasicMaterial({
            color: color,
            wireframe: true,
        });
    }
    geometry.translate(translation, 0, 0);
    var sphere = new THREE.Mesh(geometry, material);
    sphere.position.set(position[0], position[1], position[2])
    sphere.name = name;
    return sphere;
}

function buildSolarSystem(){
    // objects to be collected through puzzles or minigames
    // inspired by the corresponding body's characteristics
    

    // main source of light, something involving lightbulbs?
    state.spaceObjGrids.push(buildSphere(556.8, 0xff8800, [575, 556.8, 1000], "the Sun"));


    // closest to the sun, fastest body, maybe a race of some sort?
    state.spaceObjGrids.push(buildSphere(1.9516, 0xbb9665, [-50, 556.8, 1000], "Mercury"));


    // runaway greenhouse effect, add a greenhouse and a few potted plants
    // then add a shovel that can be equipped and used to dig them up
    state.spaceObjGrids.push(buildSphere(4.84, 0xe5ab60, [-100, 556.8, 1000], "Venus"));


    // only planet with liquid water and life
    // Inside a fish's mouth in some pond?
    // Or on a fishing pole as bait nearby?
    // growing on a tree?
    state.spaceObjGrids.push(buildSphere(5.096, 0x00ad15, [-150, 556.8, 1000], "Earth"));

    // last item to be collected
    // denizen will say some dialogue:
    // "Oh dear, I hate to ask for your help again, 
    // but there seems to be one more piece missing...
    // Could you bring me the Moon?"
    // Maybe put inside of a cheese wheel to reference the old myth/wive's tale
    // that the moon is made of cheese
    state.spaceObjGrids.push(buildSphere(1.3896, 0xb2bdc6, [-150, 556.8, 1000], "the Moon", 10));



    // the 'red planet', inhabited by "Opportunity", NASA's rover
    // make mars one of the rock samples the rover is carrying
    // maybe reference "My battery is low and it's getting dark."
    // aha! make the player give the rover new batteries and turn on a light
    state.spaceObjGrids.push(buildSphere(2.7116, 0xb58f72, [-200, 556.8, 1000], "Mars"));


    // big gas giant, big red spot
    // field of tornados, inside a tornado with a red spot 
    // add patterns onto other tornados as well so its not as obvious
    state.spaceObjGrids.push(buildSphere(55.92, 0xbd7f5a, [-300, 556.8, 1000], "Jupiter"));


    // well-known for it's many rings, maybe a circle of rocks with one missing?
    state.spaceObjGrids.push(buildSphere(46.6, 0xfaf8b4, [-500, 556.8, 1000], "Saturn"));
    var geometry = new THREE.RingGeometry(75, 125, 32);
    var material = new THREE.MeshBasicMaterial({
        color: 0xfaf8b4,
        // opacity: 0.1,
        side: THREE.DoubleSide,
        wireframe: true,
    });
    var saturnRings = new THREE.Mesh(geometry, material);
    saturnRings.position.set(-500, 556.8, 1000);
    saturnRings.rotation.x = 1.57;
    state.spaceObjGrids.push(saturnRings);



    // it's upside down compared to the other planets
    // a table with multiple cups on top
    // one is upside-down with the planet inside
    state.spaceObjGrids.push(buildSphere(20.288, 0x6eaab9, [-690, 556.8, 1000], "Uranus"));
    geometry = new THREE.RingGeometry(50, 51, 20);
    material = new THREE.MeshBasicMaterial({
        color: 0xffffff,
        side: THREE.DoubleSide,
        wireframe: true,
    });
    var uranusRings = new THREE.Mesh(geometry, material);
    uranusRings.position.set(-690, 556.8, 1000);
    uranusRings.rotation.y = 1.57;
    state.spaceObjGrids.push(uranusRings);



    // blue, with the 'great dark spot'
    // have the player choose a blueberry from a fruit stand 
    state.spaceObjGrids.push(buildSphere(19.7, 0x415495, [-775, 556.8, 1000], "Neptune"));


    // tiny, not considered a planet anymore, has a heart on the surface
    // have the player match two objects together, have a heart float up after
    state.spaceObjGrids.push(buildSphere(0.9488, 0x34030a, [-850, 556.8, 1000], "Pluto"));
    state.spaceObjGrids.forEach((obj) => state.scene.add(obj));
}

function rotateSceneObjects(){
    if (state.dynamicObjs.mobius) {
        state.dynamicObjs.mobius.rotation.z += 0.005;
    }

    // axis rotation
    state.spaceObjGrids[0].rotation.y += 0.0005;
    state.spaceObjGrids[1].rotation.y += 0.002;
    state.spaceObjGrids[2].rotation.y -= 0.002;
    state.spaceObjGrids[3].rotation.y += 0.002;
    state.spaceObjGrids[4].rotation.y += 0.003;
    state.spaceObjGrids[5].rotation.y += 0.002;
    state.spaceObjGrids[6].rotation.y += 0.002;
    state.spaceObjGrids[7].rotation.y += 0.002;
    state.spaceObjGrids[8].rotation.z -= 0.002;
    state.spaceObjGrids[9].rotation.x += 0.002;
    state.spaceObjGrids[10].rotation.x += 0.002;
    state.spaceObjGrids[11].rotation.y += 0.002;
    state.spaceObjGrids[12].rotation.y += 0.002;

    if (state.dynamicObjs.strangeCube)
    {
        state.dynamicObjs.strangeCube.rotation.z += 0.01;
    }
}

// function buildBlackHole(){
//     blackHole = new THREE.Group();
//     var blackHoleTexture = new THREE.CubeTextureLoader()
//         .setPath('src/images/')
//         .load(['blackHole.png', 'blackHole.png', 'blackHole.png', 'blackHole.png', 'blackHole.png', 'blackHole.png'])

//     var geometry = new THREE.SphereBufferGeometry(100, 32, 16);
//     var material = new THREE.MeshBasicMaterial({ color: 0xffffff, envMap: blackHoleTexture, refractionRatio: 0.5 });
//     material.envMap.mapping = THREE.CubeRefractionMapping;
//     var outerBlackHole = new THREE.Mesh(geometry, material);


//     geometry = new THREE.SphereBufferGeometry(75, 32, 16);
//     material = new THREE.MeshBasicMaterial({ color: 0x000000, opacity: 0.9, transparent: true });
//     var innerBlackHole = new THREE.Mesh(geometry, material);


//     geometry = new THREE.SphereBufferGeometry(75, 32, 16);
//     material = new THREE.MeshBasicMaterial({ color: 0xff0000, wireframe: true });
//     var blackHoleGrid = new THREE.Mesh(geometry, material);


//     blackHole.add(blackHoleGrid);
//     blackHole.add(outerBlackHole);
//     blackHole.add(innerBlackHole);
//     blackHole.position.set(0, 0, -250);
//     state.scene.add(blackHole);
// }