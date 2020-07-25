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
        "totalModels": 52,
    }
    let velocity = new THREE.Vector3();
    let direction = new THREE.Vector3();
    let vertex = new THREE.Vector3();
    let color = new THREE.Color();
    let prevTime = performance.now();
    let stlloader = new STLLoader();
    // let pdbloader = new THREE.PDBLoader();
    let textureloader = new THREE.TextureLoader();

    state.loaders = {
        "stlloader": stlloader,
        "textureloader": textureloader,
        // "pdbloader": pdbloader,
    }

    let initAngs = {
        "mercury": 0,
        "venus": 0,
        "earth": 0,
        "mars": 0,
        "jupiter": 0,
        "saturn": 0,
        "uranus": 0,
        "neptune": 0,
        "pluto": 0,
    };

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
        "currentOrbitAngs": initAngs,
    }

    state.playerInv = [];
    state.denizen = {};
    state.miniSpaceObjs = {};
    state.spaceObjects = {};
    state.backgroundObjs = {};
    state.backgroundObjCenters = {};
    state.collectableObjs = {};
    state.dynamicObjs = {};

    state.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 1, 10000);
    state.camera.position.y = 10;
    state.camera.position.x = 0;
    state.camera.position.z = -750;
    state.scene = new THREE.Scene();
    state.scene.background = new THREE.CubeTextureLoader()
    .setPath('src/images/')
    .load(['blackSquare.png', 'blackSquare.png', 'blackSquare.png', 'blackSquare.png', 'blackSquare.png', 'skybox.png']);
    let light = new THREE.HemisphereLight(0xffffff, 0xffffff, 1);
    light.position.set(0, 1000, 0);
    state.scene.add(light);
    state.controls = new PointerLockControls(state.camera, document.body);
    state.scene.add(state.controls.getObject());
    let gridHelper = new THREE.GridHelper(10000, 500, 0x0400ff, 0x0400ff);
    state.scene.add(gridHelper);
    state.renderer = new THREE.WebGLRenderer({ antialias: true });
    state.renderer.setPixelRatio(window.devicePixelRatio);
    state.renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(state.renderer.domElement);
    state.raycasternegY = new THREE.Raycaster(new THREE.Vector3(), new THREE.Vector3(0, - 1, 0), 0, 20);
    
    loadSceneModels();          
                
    let onKeyDown = function (event) {
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

            case 69: // e
                if (state.camera.position.distanceTo(new THREE.Vector3(0, 0, -800)) < 50){
                    denizenDialogue();
                } else {
                    objectInteractionHandler();
                }
            break;

            case 76: // l
            console.log(state.camera.position);
            break;
        }
        
    };
    
    let onKeyUp = function (event) {
        
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
    solarSystemOrbits();
    requestAnimationFrame(animate);

    if (state.controls.isLocked === true) {


        // use for collisions later
        state.raycasternegY.ray.origin.copy(state.controls.getObject().position);
        state.raycasternegY.ray.origin.y -= 10;
        let negYIntersections = state.raycasternegY.intersectObjects(Object.values(state.backgroundObjs));
        let negYObject = negYIntersections.length > 0;

        let time = performance.now();
        let delta = (time - state.physicsVars.prevTime) / 1000;
        
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
    minis["the Sun"] = buildSphere(2.5, 0xff8800, [0, 10, 1500], "the Sun", 0, './src/models/textures/sun-texture.jpg', false);
    minis["Mercury"] = buildSphere(2.5, 0xff8800, [751, 23, 1255], "Mercury", 0, './src/models/textures/mercury-texture.jpg', false);
    minis["Venus"] = buildSphere(2.5, 0xff8800, [1384, 25, 716], "Venus", 0, './src/models/textures/venus-texture.jpg', false);
    minis["Earth"] = buildSphere(6, 0xff8800, [1550, 70, 83], "Earth", 0, './src/models/textures/earth-texture.jpg');
    minis["the Moon"] = buildSphere(4, 0xff8800, [1255, 10, -887], "the Moon", 0, './src/models/textures/moon-texture.jpg');
    minis["Mars"] = buildSphere(2.5, 0xff8800, [757, 11, -1292], "Mars", 0, './src/models/textures/mars-texture.jpg', false);
    minis["Jupiter"] = buildSphere(2.5, 0xff8800, [-750, 10, -1305], "Jupiter", 0, './src/models/textures/jupiter-texture.jpg');
    minis["Saturn"] = buildSphere(2.5, 0xff8800, [-1305, 10, -750], "Saturn", 0, './src/models/textures/saturn-texture.jpg', false);
    let unflipped = buildSphere(2.5, 0xff8800, [-1500, 10, 0], "Uranus", 0, './src/models/textures/uranus-texture.jpg');
    unflipped.rotation.z = 1.57;
    minis["Uranus"] = unflipped;
    minis["Neptune"] = buildSphere(2, 0xff8800, [-1305, 10.3, 750], "Neptune", 0, './src/models/textures/neptune-texture.jpg', false);
    minis["Pluto"] = buildSphere(2.5, 0xff8800, [-750, 10, 1305], "Pluto", 0, './src/models/textures/pluto-texture.jpg', false);

    let geometry = new THREE.RingGeometry(4, 6.7, 32);
    let material = new THREE.MeshBasicMaterial({
        color: 0xfaf8b4,
        side: THREE.DoubleSide,
    });
    let saturnRings = new THREE.Mesh(geometry, material);
    saturnRings.position.set(-1305, 10, -750);
    saturnRings.rotation.x = 1.57;
    saturnRings.name = "saturn rings"
    saturnRings.visible = false;
    minis["saturn rings"] = saturnRings;

    geometry = new THREE.RingGeometry(6.16, 6.28, 32);
    material = new THREE.MeshBasicMaterial({
        color: 0xffffff,
        side: THREE.DoubleSide,
    });
    let uranusRings = new THREE.Mesh(geometry, material);
    uranusRings.position.set(-1500, 10, 0);
    uranusRings.rotation.y = 1.57;
    uranusRings.name = "uranus rings";
    minis["uranus rings"] = uranusRings;
    for(var obj in minis){
        state.scene.add(minis[obj]);
    }

    let loader = state.loaders.stlloader;
    loader.load('./src/models/background/mobius.stl', function (object) {
        let material = new THREE.MeshNormalMaterial();
        object.computeBoundingBox();
        object.computeVertexNormals();
        object.center();

        let attrib = object.getAttribute('position');
        let positions = attrib.array;
        let vertices = [];
        for (let i = 0, n = positions.length; i < n; i += 3) {
            let x = positions[i];
            let y = positions[i + 1];
            let z = positions[i + 2];
            vertices.push(new THREE.Vector3(x, y, z));
        }
        let faces = [];
        for (let i = 0, n = vertices.length; i < n; i += 3) {
            faces.push(new THREE.Face3(i, i + 1, i + 2));
        }

        let geometry = new THREE.Geometry();
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
        updateLoadingBar();
        state.scene.add(state.dynamicObjs.mobius);
    });
    loadSTLModel('./src/models/background/cube-structure.stl', [-10, 10, 0], [0,0,0], [0.01,0.01,0.01], "A Strange Cube Structure.", "strangeCube");
    loadSTLModel('./src/models/puzzle/earth/Tree.stl', [1500, 0, 0], [-1.57, 0, 0], [3, 3, 3], "It's a fruit tree.", "backgroundObjs");
    loadSTLModel('./src/models/puzzle/jupiter/tornado.stl', [-750, 0, -1305], [-1.57, 0, 0], [1, 1, 1], "It's a tornado.", "backgroundObjs");
    loadSTLModel('./src/models/puzzle/mars/battery.stl', [120, 0, -180], [-1.57, 0, 0], [0.05, 0.05, 0.05], "It's a battery, this might come in handy later...", "collectableObjs");
    loadSTLModel('./src/models/puzzle/mars/curiosity.stl', [750, 0, -1305], [-1.57, 0, 0], [0.1, 0.1, 0.1], "My battery is low and it's getting dark.", "backgroundObjs");
    loadSTLModel('./src/models/puzzle/mars/streetlamp.stl', [730, 0, -1305], [-1.57, 0, 0], [1, 1, 1], "It's a solar-powered streetlamp.", "backgroundObjs");
    loadSTLModel('./src/models/background/low-poly-face.stl', [750, 0, 1305], [-1.57, 0, 3.14], [1, 1, 1], "It appears sick.", "backgroundObjs");
    loadSTLModel('./src/models/puzzle/mercury/Thermometer.stl', [750, 41, 1275], [-1.57, 1.57, 3.34], [0.4, 0.4, 0.4], "It's a thermometer, this might come in handy later...", "collectableObjs");
    loadSTLModel('./src/models/puzzle/moon/cheese-wheel.stl', [1305, 64, -760], [1.57, 0, 1.57], [4, 4, 4], "A classic cheese wheel.", "backgroundObjs");
    loadSTLModel('./src/models/puzzle/neptune/market-stall.stl', [-1305, 8, 750], [-1.57, 0, -1.57], [2.5, 2.5, 2.5], "It's a fruit stand, I might be able to buy something.", "backgroundObjs");
    loadSTLModel('./src/models/puzzle/neptune/Apple.stl', [-1312.5, 8.5, 750.5], [-1.57, 0, -1.57], [0.01, 0.01, 0.01], "A delicious looking apple.", "backgroundObjs");
    loadSTLModel('./src/models/puzzle/neptune/coin.stl', [-130, 0, 20], [-1.57, 0, -1.57], [0.025, 0.025, 0.025], "It looks like some sort of galactic coin, this might come in handy later...", "collectableObjs");
    loadSTLModel('./src/models/puzzle/neptune/Grapes.stl', [-1310.9, 7.5, 750], [0, -3.14, 0], [0.025, 0.025, 0.025], "Deliciously ripe grapes.", "backgroundObjs");
    loadSTLModel('./src/models/puzzle/neptune/Pineapple.stl', [-1312.5, 8.5, 749], [-1.57, 0, -1.57], [0.05, 0.05, 0.05], "It's a pineapple, yum!", "backgroundObjs");
    loadSTLModel('./src/models/puzzle/neptune/Strawberry.stl', [-1311.5, 8.5, 754], [-1.57, 0, 0], [0.025, 0.025, 0.025], "A single strawberry, but it is sizeable.", "backgroundObjs");
    loadSTLModel('./src/models/puzzle/pluto/bone.stl', [-320, 0, -190], [-1.57, 0, 0], [0.03, 0.03, 0.03], "It looks like a bone and you'd rather not think about where it came from. It may come in handy later...", "collectableObjs");
    loadSTLModel('./src/models/puzzle/pluto/Puppy.stl', [-750, 0, 1305], [-1.57, 0, 0], [0.25, 0.25, 0.25], "A cute puppy. It's looking at me expectantly.", "backgroundObjs");
    loadSTLModel('./src/models/puzzle/saturn/rock-ring.stl', [-1305, 0, -750], [-1.57, 0, 0], [0.05, 0.05, 0.05], "It's a circle of rocks, but one appears to be missing.", "backgroundObjs");
    loadSTLModel('./src/models/puzzle/saturn/pebble.stl', [170, 0, -170], [-1.57, 0, 0], [0.05, 0.05, 0.05], "It's a pebble, this might come in handy later...", "collectableObjs");
    loadSTLModel('./src/models/puzzle/sun/lightbulb-glass.stl', [0, 0, 1500], [-1.57, 0, 0], [0.05, 0.05, 0.05], "It's a lightbulb, and it seems to be touch activated... somehow...", "backgroundObjs");
    loadSTLModel('./src/models/puzzle/sun/lightbulb-plug.stl', [0, 0, 1500], [-1.57, 0, 0], [0.05, 0.05, 0.05], "There is a plug, but it doesn't seem to be connected anywhere", "backgroundObjs");
    loadSTLModel('./src/models/puzzle/uranus/cup-table.stl', [-1500, 0, 0], [-1.57, 0, 0], [2.5,2.5,2.5], "It's a table with some cups on it", "backgroundObjs");
    loadSTLModel('./src/models/puzzle/venus/greenhouse.stl', [1305, 0, 750], [-1.57, 0, 0], [1,1,1], "It's a greenhouse with a few plants inside, one does not seem to have sprouted", "backgroundObjs");
    loadSTLModel('./src/models/puzzle/venus/Dirt.stl', [1305, 0, 750], [-1.57, 0, 0], [1, 1, 1], "There is no flower in this pot, maybe it just didn't grow?", "backgroundObjs");
    loadSTLModel('./src/models/puzzle/venus/shovel.stl', [100, 2, 100], [1.57, 0, 0], [0.05, 0.05, 0.05], "It's a shovel, this might come in handy later...", "collectableObjs");
    loadSTLModel('./src/models/denizen/Denizen-body.stl', [0, 2.5, -800], [-1.57, 0, 0], [0.25, 0.25, 0.25], "torso", "denizen");
    loadSTLModel('./src/models/denizen/Denizen-feet.stl', [0, 0, -800], [-1.57, 0, 0], [0.25, 0.25, 0.25], "feet", "denizen");
    loadSTLModel('./src/models/denizen/Denizen-hands.stl', [0, 2.5, -800], [-1.57, 0, 0], [0.25, 0.25, 0.25], "hands", "denizen");
    loadSTLModel('./src/models/denizen/Denizen-head.stl', [0, 4, -800], [-1.57, 0, 0], [0.25, 0.25, 0.25], "head", "denizen");
    // loadSTLModel('./src/models/background/Mountains.stl', [-100, 0, -100], [-1.57, 0, 1.57], [1, 1, 1], "A mountain range", "backgroundObjs");
    defineCustomModelCenters();
}

function loadSTLModel(path, position, rotation, scale, name, group) {
    let loader = state.loaders.stlloader;
    loader.load(path, function (object) {
        let material = new THREE.MeshNormalMaterial();
        let geometry = object;
        let model = new THREE.Mesh(geometry, material);
        model.position.set(position[0], position[1], position[2]);
        model.rotation.set(rotation[0], rotation[1], rotation[2]);
        model.scale.set(scale[0], scale[1], scale[2]);
        model.name = name;
        if (group != "strangeCube"){
            let collection = state[group];
            collection[name] = model;
            state.scene.add(collection[name]);
        } else {
            state.dynamicObjs[group] = model;
            state.scene.add(state.dynamicObjs[group]);
        }
        updateLoadingBar();
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
    let planetPiece = false;
    let puzzlePiece = false;
    let backgroundInteraction = false;
    let idx = "";

    Object.values(state.spaceObjects).forEach((obj) => {
        let dis = playerPosition.distanceTo(obj.position) - obj.geometry.parameters.radius;
        if (dis < 15) {
            // change based on if piece has been collected
            closestMes = "A missing piece of the solar system! This appears to be where " + obj.name + " should go...";
        }
    })
    let closestDis = 500;
    let minDis = 100;
    Object.values(state.backgroundObjs).forEach((obj) => {
        let dis = playerPosition.distanceTo(obj.position);
        if (obj.name == "A classic cheese wheel."){
            minDis = 250;
        } else {
            minDis = 100;
        }
        if(state.backgroundObjCenters[obj.name]){
            dis = playerPosition.distanceTo(state.backgroundObjCenters[obj.name]);
        }
        if (dis < minDis && dis < closestDis) {
            closestMes = obj.name;
            closestDis = dis;
            backgroundInteraction = true;
            planetPiece = false;
            puzzlePiece = false;
            idx = obj.name;
        }
    })
    Object.values(state.collectableObjs).forEach((obj) => {
        let dis = playerPosition.distanceTo(obj.position); 
        if (dis < 15 && obj.visible != false) {
            closestMes = obj.name;
            puzzlePiece = true;
            planetPiece = false;
            backgroundInteraction = false;
            idx = obj.name;
        }
    })
        
    Object.values(state.miniSpaceObjs).forEach((obj) => {
        let dis = playerPosition.distanceTo(obj.position) - obj.geometry.parameters.radius;
        if (dis < 25 && obj.visible == true) {
            closestMes = "You have collected " + obj.name;
            planetPiece = true;
            puzzlePiece = false;
            backgroundInteraction = false;
            idx = obj.name;
        }
    })

    let itemName = idx;
    if(puzzlePiece == true){
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
            state.scene.remove(state.collectableObjs[idx]);
            if(itemName != "Thermometer" && itemName != "Bone" && itemName != "Pebble"){
                delete state.collectableObjs[idx];
            } else {
                state.collectableObjs[idx].visible = false;
            }
            let invItem = document.createElement("li");
            let invText = document.createTextNode(itemName);
            invItem.appendChild(invText);
            document.getElementById('inventory').appendChild(invItem);
        }
    }
    
    if (planetPiece == true){
        collectSpaceObject(itemName);
    }
    if (backgroundInteraction && state.backgroundObjs[idx] != undefined){
        checkForPlacements(state.backgroundObjs[idx], closestMes);
    } else {
        document.getElementById('dialogue').innerHTML = "";
        let storyText = document.createTextNode(closestMes);
        document.getElementById('dialogue').appendChild(storyText);
        setTimeout(() => document.getElementById('dialogue').innerHTML = "", 5000);
    }
}

function checkForPlacements(obj, defaultMessage=""){
    let messageGen = defaultMessage;
    switch (obj.name) {
        case "My battery is low and it's getting dark.":
            if(state.playerInv.indexOf("Battery") != -1 && state.playerInv.indexOf("the Sun") == -1){
                messageGen = "You place the battery, but it is still getting dark...";
            } else if (state.playerInv.indexOf("Battery") != -1 && state.playerInv.indexOf("the Sun") != -1){
                messageGen = "The rover seems happy and at peace."
                obj.name = messageGen;
                state.scene.children.forEach(child => {
                    if (child.name == "Mars"){
                        child.visible = true;
                    }
                })
                state.playerInv.splice(state.playerInv.indexOf("Battery"), 1);
            } else if (state.playerInv.indexOf("Battery") == -1 && state.playerInv.indexOf("the Sun") != -1){
                messageGen = "It is no longer dark, but the rover still needs a new battery";
            }
            break;

        case "It appears sick.":
            if(state.playerInv.indexOf("Thermometer") != -1){
                let child = state.collectableObjs["It's a thermometer, this might come in handy later..."];
                child.position.x = 750;
                child.position.y = 41;
                child.position.z = 1275;
                child.rotation.x = -1.57;
                child.rotation.y = 1.57;
                child.rotation.z = 3.34;
                child.visible = true;
                state.scene.add(child);
                messageGen = "Wow, that's a high fever.";

                delete state.collectableObjs["It's a thermometer, this might come in handy later..."];
                state.scene.children.forEach(child => {
                    if (child.name == "Mercury") {
                        child.visible = true;
                    }
                    if (child.name == "It appears sick."){
                        child.name = messageGen;
                    }
                })
                state.playerInv.splice(state.playerInv.indexOf("Thermometer"), 1);
            }
            break;

        case "It's a fruit stand, I might be able to buy something.":
            if (state.playerInv.indexOf("Coin") != -1){
                state.scene.children.forEach(child => {
                    if (child.name == "Neptune") {
                        child.visible = true;
                        messageGen = "That's not a blueberry!"
                    }
                    if (child.name == "It's a fruit stand, I might be able to buy something.") {
                        child.name = "I'm out of money.";
                    }
                })
                state.playerInv.splice(state.playerInv.indexOf("Coin"), 1);
            }
            break;

        case "A cute puppy. It's looking at me expectantly.":
            if (state.playerInv.indexOf("Bone") != -1){
                let child = state.collectableObjs["It looks like a bone and you'd rather not think about where it came from. It may come in handy later..."];
                child.position.x = -320;
                child.position.y = 0;
                child.position.z = -190;
                child.rotation.x = -1.57;
                child.rotation.y = 0;
                child.rotation.z = 0;
                child.visible = true;
                state.scene.add(child);
                messageGen = "Good boy";

                delete state.collectableObjs["It looks like a bone and you'd rather not think about where it came from. It may come in handy later..."];
                state.scene.children.forEach(child => {
                    if (child.name == "Pluto") {
                        child.visible = true;
                    }
                    if (child.name == "A cute puppy. It's looking at me expectantly.") {
                        child.name = "A good boy";
                    }
                })
                state.playerInv.splice(state.playerInv.indexOf("Bone"), 1);
            }
            break;

        case "It's a circle of rocks, but one appears to be missing.":
            if (state.playerInv.indexOf("Pebble") != -1) {
                let child = state.collectableObjs["It's a pebble, this might come in handy later..."];
                child.position.x = -1314;
                child.position.y = 0;
                child.position.z = -755;
                child.rotation.x = -1.57;
                child.rotation.y = 0;
                child.rotation.z = 0;
                child.visible = true;
                state.scene.add(child);
                messageGen = "The circle is filled in now";
                delete state.collectableObjs["It's a pebble, this might come in handy later..."];
                state.scene.children.forEach(child => {
                    if (child.name == "Saturn" || child.name == "saturn rings") {
                        child.visible = true;
                    }
                    if (child.name == "It's a circle of rocks, but one appears to be missing.") {
                        child.name = "A ring made of rocks";
                    }
                })
                state.playerInv.splice(state.playerInv.indexOf("Pebble"), 1);
            }
            break;

        case "It's a lightbulb, and it seems to be touch activated... somehow..." || "There is a plug, but it doesn't seem to be connected anywhere":
            break;

        case "There is no flower in this pot, maybe it just didn't grow?":
            if (state.playerInv.indexOf("Shovel") != -1) {
                state.scene.children.forEach(child => {
                    if (child.name == "Venus") {
                        child.visible = true;
                        messageGen = "No wonder it didn't sprout."
                    }
                    if (child.name == "There is no flower in this pot, maybe it just didn't grow?") {
                        child.name = "A flower pot with no flower.";
                        child.visible = false;
                    }
                })
                state.playerInv.splice(state.playerInv.indexOf("Shovel"), 1);
            }
            break;
    
        default:
            break;
    }

    // if no placement is available
    document.getElementById('dialogue').innerHTML = "";
    let storyText = document.createTextNode(messageGen);
    document.getElementById('dialogue').appendChild(storyText);
    setTimeout(() => document.getElementById('dialogue').innerHTML = "", 5000);
}

function buildSphere(radius, color, position, name="", translation=0, skinPath='', visible=true) {
    let geometry = new THREE.SphereGeometry(radius, 22, 22);
    let material = {};
    if (skinPath != ''){
        material = new THREE.MeshBasicMaterial({ 
            map: state.loaders.textureloader.load(skinPath) 
        });
    } else {
        material = new THREE.MeshBasicMaterial({
            color: color,
            wireframe: true,
        });
    }
    geometry.translate(translation, 0, 0);
    let sphere = new THREE.Mesh(geometry, material);
    sphere.position.set(position[0], position[1], position[2])
    sphere.name = name;
    if(!visible){sphere.visible = false;}
    updateLoadingBar();
    return sphere;
}

function buildSolarSystem(){
    state.spaceObjects["the Sun"] = buildSphere(556.8, 0xff8800, [0, 556.8, 0], "the Sun");
    state.spaceObjects["Mercury"] = buildSphere(1.9516, 0xbb9665, [0, 11.9516, 200], "Mercury");
    state.spaceObjects["Venus"] = buildSphere(4.84, 0xe5ab60, [0, 14.84, 250], "Venus");
    state.spaceObjects["Earth"] = buildSphere(5.096, 0x00ad15, [0, 15.096, 300], "Earth");
    state.spaceObjects["the Moon"] = buildSphere(1.3896, 0xb2bdc6, [0, 15.096, 300], "the Moon", 10);
    state.spaceObjects["Mars"] = buildSphere(2.7116, 0xb58f72, [0, 12.7116, 350], "Mars");
    state.spaceObjects["Jupiter"] = buildSphere(55.92, 0xbd7f5a, [0, 65.92, 450], "Jupiter");
    state.spaceObjects["Saturn"] = buildSphere(46.6, 0xfaf8b4, [0, 56.6, 750], "Saturn");
    let geometry = new THREE.RingGeometry(75, 125, 32);
    let material = new THREE.MeshBasicMaterial({
        color: 0xfaf8b4,
        side: THREE.DoubleSide,
        wireframe: true,
    });
    let saturnRings = new THREE.Mesh(geometry, material);
    saturnRings.position.set(0, 56.6, 750);
    saturnRings.rotation.x = 1.57;
    saturnRings.name = "saturn rings";
    state.spaceObjects["saturn rings"] = saturnRings;
    let unflippedUranus = buildSphere(20.288, 0x6eaab9, [0, 55.788, 1000], "Uranus");
    unflippedUranus.rotation.z = 1.57;
    state.spaceObjects["Uranus"] = unflippedUranus;
    geometry = new THREE.RingGeometry(50, 51, 20);
    material = new THREE.MeshBasicMaterial({
        color: 0xffffff,
        side: THREE.DoubleSide,
    });
    let uranusRings = new THREE.Mesh(geometry, material);
    uranusRings.position.set(0, 55.788, 1000);
    uranusRings.rotation.y = 1.57;
    uranusRings.name = "uranus rings";
    state.spaceObjects["uranus rings"] = uranusRings;
    state.spaceObjects["Neptune"] = buildSphere(19.7, 0x415495, [0, 29.7, 1150], "Neptune");
    state.spaceObjects["Pluto"] = buildSphere(0.9488, 0x34030a, [0, 10.9488, 1200], "Pluto");
    for (var obj in state.spaceObjects){
        state.scene.add(state.spaceObjects[obj])
    }
}

function collectSpaceObject(objName){
    // remove the original planet grid
    state.scene.remove(state.spaceObjects[objName]);

    // remove the mini model's rings if it has any
    if (objName == "Uranus") {
        state.scene.remove(state.miniSpaceObjs["uranus rings"]);
        delete state.miniSpaceObjs["uranus rings"];
    }
    if (objName == "Saturn") {
        state.scene.remove(state.miniSpaceObjs["saturn rings"]);
        state.scene.remove(state.spaceObjects["saturn rings"]);
        delete state.miniSpaceObjs["saturn rings"];
    }

    // remove the mini model and add it to inventory
    state.playerInv.push(objName)
    state.scene.remove(state.miniSpaceObjs[objName]);
    delete state.miniSpaceObjs[objName];

    // create the new planet model and add it to the scene
    switch (objName) {
        case "the Sun":
            state.spaceObjects["the Sun"] = buildSphere(556.8, 0xff8800, [0, 556.8, 0], "the Sun", 0, './src/models/textures/sun-texture.jpg');
            break;
        case "Mercury":
            state.spaceObjects["Mercury"] = buildSphere(1.9516, 0xbb9665, [0, 11.9516, 200], "Mercury", 0, './src/models/textures/mercury-texture.jpg');
            break;
        case "Venus":
            state.spaceObjects["Venus"] = buildSphere(4.84, 0xe5ab60, [0, 14.84, 250], "Venus", 0, './src/models/textures/venus-texture.jpg');
            break;
        case "Earth":
            state.spaceObjects["Earth"] = buildSphere(5.096, 0x00ad15, [0, 15.096, 300], "Earth", 0, './src/models/textures/earth-texture.jpg');
            break;
        case "the Moon":
            state.spaceObjects["the Moon"] = buildSphere(1.3896, 0xb2bdc6, [0, 15.096, 300], "the Moon", 10, './src/models/textures/moon-texture.jpg');
            break;
        case "Mars":
            state.spaceObjects["Mars"] = buildSphere(2.7116, 0xb58f72, [0, 12.7116, 350], "Mars", 0, './src/models/textures/mars-texture.jpg');
            break;
        case "Jupiter":
            state.spaceObjects["Jupiter"] = buildSphere(55.92, 0xbd7f5a, [0, 65.92, 450], "Jupiter", 0, './src/models/textures/jupiter-texture.jpg');
            break;
        case "Saturn":
            state.spaceObjects["Saturn"] = buildSphere(46.6, 0xfaf8b4, [0, 56.6, 750], "Saturn", 0, './src/models/textures/saturn-texture.jpg');
            let geometry = new THREE.RingGeometry(75, 125, 32);
            let material = new THREE.MeshBasicMaterial({
                color: 0xfaf8b4,
                side: THREE.DoubleSide,
            });
            let saturnRings = new THREE.Mesh(geometry, material);
            saturnRings.position.set(0, 56.6, 750);
            saturnRings.rotation.x = 1.57;
            state.spaceObjects["saturn rings"] = saturnRings;
            state.scene.add(state.spaceObjects["saturn rings"]);
            break;
        case "Uranus":
            // rings do not have to be added as they remain the same
            let unflippedUranus = buildSphere(20.288, 0x6eaab9, [0, 55.788, 1000], "Uranus", 0, './src/models/textures/uranus-texture.jpg');
            unflippedUranus.rotation.z = 1.57;
            state.spaceObjects["Uranus"] = unflippedUranus;
            break;
        case "Neptune":
            state.spaceObjects["Neptune"] = buildSphere(19.7, 0x415495, [0, 29.7, 1150], "Neptune", 0, './src/models/textures/neptune-texture.jpg');
            break;
        case "Pluto":
            state.spaceObjects["Pluto"] = buildSphere(0.9488, 0x34030a, [0, 10.9488, 1200], "Pluto", 0, './src/models/textures/pluto-texture.jpg');
            break;
        default:
            break;
    }
    state.scene.add(state.spaceObjects[objName]);
}

function rotateSceneObjects(){
    if (state.dynamicObjs.mobius) {
        state.dynamicObjs.mobius.rotation.z += 0.005;
    }
    if (state.dynamicObjs.strangeCube){
        state.dynamicObjs.strangeCube.rotation.z += 0.01;
    }

    // axis rotation
    state.spaceObjects["the Sun"].rotation.y += 0.0005;
    state.spaceObjects["Mercury"].rotation.y += 0.002;
    state.spaceObjects["Venus"].rotation.y -= 0.002;
    state.spaceObjects["Earth"].rotation.y += 0.002;
    state.spaceObjects["the Moon"].rotation.y += 0.006;
    state.spaceObjects["Mars"].rotation.y += 0.002;
    state.spaceObjects["Jupiter"].rotation.y += 0.002;
    state.spaceObjects["Saturn"].rotation.y += 0.002;
    state.spaceObjects["saturn rings"].rotation.z -= 0.002;
    state.spaceObjects["Uranus"].rotation.x += 0.002;
    state.spaceObjects["uranus rings"].rotation.x += 0.002;
    state.spaceObjects["Neptune"].rotation.y += 0.002;
    state.spaceObjects["Pluto"].rotation.y += 0.002;
}

function solarSystemOrbits(){
    
    // orbit speeds relative to each other
    state.physicsVars.currentOrbitAngs.mercury += 1.75 * Math.pow(10, -2);
    state.physicsVars.currentOrbitAngs.venus += 6.83 * Math.pow(10, -3);
    state.physicsVars.currentOrbitAngs.earth += 4.21 * Math.pow(10, -3);
    state.physicsVars.currentOrbitAngs.mars += 2.24 * Math.pow(10, -3);
    state.physicsVars.currentOrbitAngs.jupiter += 3.54 * Math.pow(10, -4);
    state.physicsVars.currentOrbitAngs.saturn += 1.43 * Math.pow(10, -4);
    state.physicsVars.currentOrbitAngs.uranus += 5.06 * Math.pow(10, -5);
    state.physicsVars.currentOrbitAngs.neptune += 2.62 * Math.pow(10, -5);
    state.physicsVars.currentOrbitAngs.pluto += 1.75 * Math.pow(10, -5);

    // position updates
    state.spaceObjects["Mercury"].position.x = 200 * Math.cos(state.physicsVars.currentOrbitAngs.mercury);
    state.spaceObjects["Mercury"].position.z = 200 * Math.sin(state.physicsVars.currentOrbitAngs.mercury);
    state.spaceObjects["Venus"].position.x = 250 * Math.cos(state.physicsVars.currentOrbitAngs.venus);
    state.spaceObjects["Venus"].position.z = 250 * Math.sin(state.physicsVars.currentOrbitAngs.venus);
    state.spaceObjects["Earth"].position.x = 300 * Math.cos(state.physicsVars.currentOrbitAngs.earth);
    state.spaceObjects["Earth"].position.z = 300 * Math.sin(state.physicsVars.currentOrbitAngs.earth);
    state.spaceObjects["the Moon"].position.x = 300 * Math.cos(state.physicsVars.currentOrbitAngs.earth);
    state.spaceObjects["the Moon"].position.z = 300 * Math.sin(state.physicsVars.currentOrbitAngs.earth);
    state.spaceObjects["Mars"].position.x = 350 * Math.cos(state.physicsVars.currentOrbitAngs.mars);
    state.spaceObjects["Mars"].position.z = 350 * Math.sin(state.physicsVars.currentOrbitAngs.mars);
    state.spaceObjects["Jupiter"].position.x = 450 * Math.cos(state.physicsVars.currentOrbitAngs.jupiter);
    state.spaceObjects["Jupiter"].position.z = 450 * Math.sin(state.physicsVars.currentOrbitAngs.jupiter);
    state.spaceObjects["Saturn"].position.x = 750 * Math.cos(state.physicsVars.currentOrbitAngs.saturn);
    state.spaceObjects["Saturn"].position.z = 750 * Math.sin(state.physicsVars.currentOrbitAngs.saturn);
    state.spaceObjects["saturn rings"].position.x = 750 * Math.cos(state.physicsVars.currentOrbitAngs.saturn);
    state.spaceObjects["saturn rings"].position.z = 750 * Math.sin(state.physicsVars.currentOrbitAngs.saturn);
    state.spaceObjects["Uranus"].position.x = 1000 * Math.cos(state.physicsVars.currentOrbitAngs.uranus);
    state.spaceObjects["Uranus"].position.z = 1000 * Math.sin(state.physicsVars.currentOrbitAngs.uranus);
    state.spaceObjects["uranus rings"].position.x = 1000 * Math.cos(state.physicsVars.currentOrbitAngs.uranus);
    state.spaceObjects["uranus rings"].position.z = 1000 * Math.sin(state.physicsVars.currentOrbitAngs.uranus);
    state.spaceObjects["Neptune"].position.x = 1150 * Math.cos(state.physicsVars.currentOrbitAngs.neptune);
    state.spaceObjects["Neptune"].position.z = 1150 * Math.sin(state.physicsVars.currentOrbitAngs.neptune);
    state.spaceObjects["Pluto"].position.x = 1200 * Math.cos(state.physicsVars.currentOrbitAngs.pluto);
    state.spaceObjects["Pluto"].position.z = 1200 * Math.sin(state.physicsVars.currentOrbitAngs.pluto);
}

function defineCustomModelCenters(){
    state.backgroundObjCenters["It's a fruit tree."] = new THREE.Vector3(1540, 0, 100);
    state.backgroundObjCenters["It's a tornado."] = new THREE.Vector3(-780, 0, -1315);
    state.backgroundObjCenters["My battery is low and it's getting dark."] = new THREE.Vector3(750, 0, -1300);
    state.backgroundObjCenters["It's a solar-powered streetlamp."] = new THREE.Vector3(700, 10, -1290);
    state.backgroundObjCenters["It appears sick."] = new THREE.Vector3(750, 0, 1285);
    state.backgroundObjCenters["A classic cheese wheel."] = new THREE.Vector3(1230, 10, -900);
    state.backgroundObjCenters["It's a fruit stand, I might be able to buy something."] = new THREE.Vector3(-1300, 10, 749.4);
    state.backgroundObjCenters["A delicious looking apple."] = new THREE.Vector3(-1312, 10, 750.6);
    state.backgroundObjCenters["Deliciously ripe grapes."] = new THREE.Vector3(-1311, 10, 749.3);
    state.backgroundObjCenters["It's a pineapple, yum!"] = new THREE.Vector3(-1312, 10, 750);
    state.backgroundObjCenters["A single strawberry, but it is sizeable."] = new THREE.Vector3(-1311, 10, 750.4);
    state.backgroundObjCenters["A cute puppy. It's looking at me expectantly."] = new THREE.Vector3(-750, 0, 1300);
    state.backgroundObjCenters["It's a circle of rocks, but one appears to be missing."] = new THREE.Vector3(-1300, 0, -750);
    // state.backgroundObjCenters["It's a lightbulb, and it seems to be touch activated... somehow..."] = new THREE.Vector3();
    // state.backgroundObjCenters["There is a plug, but it doesn't seem to be connected anywhere"] = new THREE.Vector3();
    state.backgroundObjCenters["It's a table with some cups on it"] = new THREE.Vector3(-1485, 42, -21);
    state.backgroundObjCenters["It's a greenhouse with a few plants inside, one does not seem to have sprouted"] = new THREE.Vector3(1250, 15, 750);
    state.backgroundObjCenters["There is no flower in this pot, maybe it just didn't grow?"] = new THREE.Vector3(1380, 15, 715);
}

function denizenDialogue(){
    console.log("Hello!");
    // document.getElementById('dialogue').innerHTML = "";
    // let storyText = document.createTextNode(closestMes);
    // document.getElementById('dialogue').appendChild(storyText);
    // setTimeout(() => document.getElementById('dialogue').innerHTML = "", 5000);
}

function updateLoadingBar(){
    state.loadingBar.loadedModels += 1;
    // let percentTxt = "Now Loading... " + 100 * ((state.loadingBar.loadedModels/state.loadingBar.totalModels).toFixed(2)) + "%";
    // document.getElementById('loadPercent').innerHTML = "";
    // let percent = document.createTextNode(percentTxt);
    // document.getElementById('loadPercent').appendChild(percent);
    // if(state.loadingBar.loadedModels == state.loadingBar.totalModels){
    //     let clickTxt = "Click to begin!";
    //     let message = document.createTextNode(clickTxt);
    //     document.getElementById('startTxt').appendChild(message);
    // }
}