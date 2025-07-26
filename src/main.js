import * as THREE from "three";
import { SplatMesh } from "@sparkjsdev/spark";
import RAPIER from "@dimforge/rapier3d-compat";

const GROUND_LEVEL = -1.35; // Ground Y position

const linkCubes = []; // <-- Declare this FIRST

// Store physics bodies for cleanup
const physicsCubes = [];

// Game state system for progressive cube interaction
let gameState = {
  currentLevel: 0, // 0 = helloCube, 1 = newCube, 2 = anotherCube2
  completedLevels: [], // Track which cubes have been clicked
  isGameComplete: false
};

// Define the progression order
const cubeProgression = [
  { cube: 'helloCube', title: 'Clue', level: 0 },
  { cube: 'newCube', title: 'Clue', level: 1 },
  { cube: 'anotherCube2', title: 'Another Cube', level: 2 }
];

// Function to check if a cube is currently clickable
function isCubeClickable(cube) {
  if (!cube || !cube.userData) return false;
  
  // Find which level this cube belongs to
  let cubeLevel = -1;
  if (cube === helloCube) cubeLevel = 0;
  else if (cube === newCube) cubeLevel = 1;
  else if (cube === anotherCube2) cubeLevel = 2;
  
  // Only allow clicking if it's the current level
  return cubeLevel === gameState.currentLevel;
}

// Function to advance to next level
function advanceGameState() {
  gameState.completedLevels.push(gameState.currentLevel);
  gameState.currentLevel++;
  
  if (gameState.currentLevel >= cubeProgression.length) {
    gameState.isGameComplete = true;
    console.log("Game completed! All cubes have been clicked in order.");
  }
  
  console.log(`Advanced to level ${gameState.currentLevel}. Completed levels:`, gameState.completedLevels);
}

// Function to show progression message
function showProgressionMessage() {
  let existing = document.getElementById('progression-popup');
  if (existing) existing.remove();
  
  const popup = document.createElement('div');
  popup.id = 'progression-popup';
  popup.style.cssText = `
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    background: rgba(40, 0, 0, 0.95);
    color: #ff6666;
    padding: 20px 30px;
    border-radius: 12px;
    font-family: 'Courier New', monospace;
    font-size: 16px;
    z-index: 20000;
    border: 2px solid #ff6666;
    box-shadow: 0 8px 32px rgba(255, 102, 102, 0.2);
    text-align: center;
    animation: fadeInOut 3s ease-in-out;
  `;
  
  let message = '';
  if (gameState.currentLevel === 0) {
    message = 'Find and click the first clue first!';
  } else if (gameState.currentLevel === 1) {
    message = 'Complete the previous clue before accessing this one.';
  } else if (gameState.currentLevel === 2) {
    message = 'Follow the sequence - complete the second clue first.';
  } else {
    message = 'You have completed all the clues!';
  }
  
  popup.innerHTML = `
    <div style="font-weight: bold; font-size: 18px; margin-bottom: 10px;">
      🚫 Not Available Yet
    </div>
    <div>${message}</div>
  `;
  
  document.body.appendChild(popup);
  
  // Auto-remove after 3 seconds
  setTimeout(() => {
    if (popup.parentNode) {
      popup.remove();
    }
  }, 3000);
}

// Keep all cubes completely invisible regardless of game state
function updateCubeVisuals() {
  // All cubes remain completely invisible at all times
  // No visual changes based on game progression
}



// Helper function to identify interactive cubes
function isNewCube(object) {
  return object && object.userData && 
         (object.userData.title === 'New Visible Cube' || 
          object.userData.title === 'Another Colorful Cube' ||
          object.userData.title === 'Congratulations!' ||
          object.userData.title === 'Another Cube' ||
          object.userData.isNewCube === true);
}

// Function to create physics body for a cube
function createCubePhysicsBody(cube, world) {
  console.log("Creating physics body for cube:", cube.userData.title, "at position:", cube.position);
  
  const position = cube.position;
  const scale = cube.scale;
  
  // Get the geometry dimensions
  let width, height, depth;
  if (cube.geometry.type === 'BoxGeometry') {
    const params = cube.geometry.parameters;
    width = (params.width || 1) * scale.x * 0.5;
    height = (params.height || 1) * scale.y * 0.5;
    depth = (params.depth || 1) * scale.z * 0.5;
  } else {
    width = 0.125;
    height = 0.125;
    depth = 0.125;
  }
  
  console.log("Physics body dimensions:", { width, height, depth });
  
  // Create fixed (static) rigid body
  const bodyDesc = RAPIER.RigidBodyDesc.fixed()
    .setTranslation(position.x, position.y, position.z);
  
  const rigidBody = world.createRigidBody(bodyDesc);
  
  // Create cuboid collider
  const colliderDesc = RAPIER.ColliderDesc.cuboid(width, height, depth)
    .setFriction(0.8)
    .setRestitution(0.3);
  
  const collider = world.createCollider(colliderDesc, rigidBody);
  
  cube.userData.physicsBody = rigidBody;
  cube.userData.physicsCollider = collider;
  
  console.log("Physics body successfully created at:", rigidBody.translation());
  
  return { body: rigidBody, collider: collider };
}

// --- Three.js Scene & SPLAT ---
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// SPLAT mesh - using correct position from second script
const splatURL = "/KeshavNarayanChowk.splat";
const splat = new SplatMesh({ url: splatURL });
splat.position.set(0, 0, -3);
// Fix orientation - rotate 180 degrees around X axis to flip upside down
splat.rotation.x = Math.PI;
scene.add(splat);

// Add lighting to make MeshLambertMaterial visible
const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
scene.add(ambientLight);
const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
directionalLight.position.set(10, 10, 5);
scene.add(directionalLight);

// Enhanced helloCube with physics - COMPLETELY INVISIBLE
const helloCubeGeometry = new THREE.BoxGeometry(0.25, 0.25, 0.25);
const helloCubeMaterial = new THREE.MeshLambertMaterial({ 
  transparent: true,
  opacity: 0,  // Completely invisible
  visible: false  // Make it invisible but keep physics
});
const helloCube = new THREE.Mesh(helloCubeGeometry, helloCubeMaterial);
helloCube.position.set(2.84, -0.42, -3.30);
helloCube.userData = {
  title: 'Clue',
  url: 'जहाँ चार छायाहरू स्थिर उभिएका छन्,\nती न हल्लिन्छन्, न बोल्छन् तर थाह पाउँछन्।\nतीन पाइला शून्यतिर उक्ल,\nन त आँखा खुला राख न नै मन व्यग्र।\nजुन ठाउँले तिमीलाई फर्काउँछ,\nउहीँबाट मार्ग खुल्छ, यदि तिमी रोक्न जान्छौ।',
  hasPhysics: true
};
scene.add(helloCube);
linkCubes.length = 0; // Remove all previous cubes
linkCubes.push(helloCube);

// Enhanced newCube with physics - COMPLETELY INVISIBLE
const newCubeGeometry = new THREE.BoxGeometry(0.275, 0.275, 0.275);
const newCubeMaterial = new THREE.MeshLambertMaterial({ 
  transparent: true,
  opacity: 0,  // Completely invisible
  visible: false  // Make it invisible but keep physics
});
const newCube = new THREE.Mesh(newCubeGeometry, newCubeMaterial);
newCube.position.set(-0.7, 0.2, -3.9);
newCube.userData = {
  title: 'Clue',
  url: 'पछाडिबाट हेर्दा, यो त दायाँ तिर पर्छ,\nतर अगाडिबाट सीधा हेर्दा, यो बायाँ छ।\nन त लेखिएको छ, न त कोही बताउँछ,\nतर यही थाममा केही लुकेको छ।\nतेस्रो थाम नजिक गई, शान्त भएर उभिई हेर,\nतिमी नबोली बस्यौ भने, त्यसैले केही देखाउनेछ।',
  hasPhysics: true,
  isNewCube: true // <-- Add this
};
scene.add(newCube);
linkCubes.push(newCube);

// Optional: Add a glowing effect to make it even more visible
// const newCubeGlow = new THREE.Mesh(
//   new THREE.BoxGeometry(0.8, 0.8, 0.8), 
//   new THREE.MeshBasicMaterial({
//     color: 0xff8888,
//     transparent: true,
//     opacity: 0.3
//   })
// );
// newCube.add(newCubeGlow);

// Enhanced another cube with physics - COMPLETELY INVISIBLE
const anotherCube2Geometry = new THREE.BoxGeometry(0.1, 0.1, 0.1);
const anotherCube2Material = new THREE.MeshLambertMaterial({ 
  transparent: true,
  opacity: 0,  // Completely invisible
  visible: false  // Make it invisible but keep physics
});
const anotherCube2 = new THREE.Mesh(anotherCube2Geometry, anotherCube2Material);
anotherCube2.position.set(-2.3, 0.1, -0.5);
anotherCube2.userData = {
  title: 'Another Cube',
  url: 'बधाई छ! तपाईंले यो खेल जित्नुभएको छ।',
  hasPhysics: true
};
scene.add(anotherCube2);
linkCubes.push(anotherCube2);



function moveHelloCube(newX, newY, newZ) {
  helloCube.position.set(newX, newY, newZ);
}

// Debug the position: Add some debug logging to see if the position is actually changing:
// (Place this in your animate loop)
// console.log("Cube position:", helloCube.position);
// console.log("Camera position:", camera.position);




function showInfoPopup(title, url) {
  let existing = document.getElementById('info-popup');
  if (existing) existing.remove();
  const popup = document.createElement('div');
  popup.id = 'info-popup';
  popup.style.cssText = `
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    background: rgba(0,0,0,0.95);
    color: #3399ff;
    padding: 24px 32px;
    border-radius: 12px;
    font-family: 'Courier New', monospace;
    font-size: 18px;
    z-index: 20000;
    border: 2px solid #3399ff;
    box-shadow: 0 8px 32px rgba(51,153,255,0.2);
    text-align: center;
  `;
  popup.innerHTML = `<div style="font-weight:bold;font-size:22px;margin-bottom:10px;">${title}</div><div>पछाडिबाट हेर्दा, यो त दायाँ तिर पर्छ,\nतर अगाडिबाट सीधा हेर्दा, यो बायाँ छ।\nन त लेखिएको छ, न त कोही बताउँछ,\nतर यही थाममा केही लुकेको छ।\nतेस्रो थाम नजिक गई, शान्त भएर उभिई हेर,\nतिमी नबोली बस्यौ भने, त्यसैले केही देखाउनेछ।</div><br><button id="close-popup-btn" style="margin-top:10px;padding:6px 18px;background:#3399ff;color:#222;border:none;border-radius:6px;font-size:15px;cursor:pointer;">Close</button>`;
  document.body.appendChild(popup);
  document.getElementById('close-popup-btn').onclick = () => popup.remove();
}


const originalShowInfoPopup = showInfoPopup;
showInfoPopup = function(title, url) {
  if (url === 'जहाँ चार छायाहरू स्थिर उभिएका छन्,\nती न हल्लिन्छन्, न बोल्छन् तर थाह पाउँछन्।\nतीन पाइला शून्यतिर उक्ल,\nन त आँखा खुला राख न नै मन व्यग्र।\nजुन ठाउँले तिमीलाई फर्काउँछ,\nउहीँबाट मार्ग खुल्छ, यदि तिमी रोक्न जान्छौ।') {
    let existing = document.getElementById('info-popup');
    if (existing) existing.remove();
    const popup = document.createElement('div');
    popup.id = 'info-popup';
    popup.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: rgba(0,0,0,0.95);
      color: #3399ff;
      padding: 24px 32px;
      border-radius: 12px;
      font-family: 'Courier New', monospace;
      font-size: 18px;
      z-index: 20000;
      border: 2px solid #3399ff;
      box-shadow: 0 8px 32px rgba(51,153,255,0.2);
      text-align: center;
    `;
    popup.innerHTML = `<div style="font-weight:bold;font-size:22px;margin-bottom:10px;">${title}</div><div>जहाँ चार छायाहरू स्थिर उभिएका छन्,\nती न हल्लिन्छन्, न बोल्छन् तर थाह पाउँछन्।\nतीन पाइला शून्यतिर उक्ल,\nन त आँखा खुला राख न नै मन व्यग्र।\nजुन ठाउँले तिमीलाई फर्काउँछ,\nउहीँबाट मार्ग खुल्छ, यदि तिमी रोक्न जान्छौ।</div><br><button id="close-popup-btn" style="margin-top:10px;padding:6px 18px;background:#3399ff;color:#222;border:none;border-radius:6px;font-size:15px;cursor:pointer;">Close</button>`;
    document.body.appendChild(popup);
    document.getElementById('close-popup-btn').onclick = () => popup.remove();
  } else if (url === 'बधाई छ! तपाईंले यो खेल जित्नुभएको छ।') {
    let existing = document.getElementById('info-popup');
    if (existing) existing.remove();
    const popup = document.createElement('div');
    popup.id = 'info-popup';
    popup.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: rgba(0,0,0,0.95);
      color: #ff4444;
      padding: 24px 32px;
      border-radius: 12px;
      font-family: 'Courier New', monospace;
      font-size: 18px;
      z-index: 20000;
      border: 2px solid #ff4444;
      box-shadow: 0 8px 32px rgba(255,68,68,0.2);
      text-align: center;
    `;
    popup.innerHTML = `<div style="font-weight:bold;font-size:22px;margin-bottom:10px;">${title}</div><div>बधाई छ! तपाईंले यो खेल जित्नुभएको छ।</div><br><button id="close-popup-btn" style="margin-top:10px;padding:6px 18px;background:#ff4444;color:#222;border:none;border-radius:6px;font-size:15px;cursor:pointer;">Close</button>`;
    document.body.appendChild(popup);
    document.getElementById('close-popup-btn').onclick = () => popup.remove();
  } else {
    originalShowInfoPopup(title, url);
  }
};


// --- Replace linkPoints array ---
// Remove the old linkPoints array and old createLinkCubes function

// Create info popup
let infoPopup = null;
function createInfoPopup() {
  infoPopup = document.createElement('div');
  infoPopup.id = 'infoPopup';
  infoPopup.style.cssText = `
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    background: rgba(0, 20, 40, 0.95);
    color: #fff;
    padding: 20px 30px;
    border-radius: 12px;
    font-family: Arial, sans-serif;
    z-index: 10001;
    border: 2px solid #00ff88;
    box-shadow: 0 0 20px rgba(0, 255, 136, 0.3);
    max-width: 400px;
    text-align: center;
    display: none;
  `;
  document.body.appendChild(infoPopup);
}

function hideInfoPopup() {
  if (infoPopup) {
    infoPopup.style.display = 'none';
  }
}

// XZ Plane boundary polygon
const BOUNDARY_POLYGON = [
  [-0.25, 1.4],
  [-4, -2.9], 
  [1.5, -6.8],
  [4, -3]
];

const linkPoints = [
  // Remove spawn point cube - empty array
];

// Create link cubes - updated function
function createLinkCubes() {
  const geometry = new THREE.BoxGeometry(0.6, 0.6, 0.6); // Medium sized cube
  const material = new THREE.MeshLambertMaterial({ 
    color: 0x00ff88,
    transparent: true,
    opacity: 0.8
  });
  
  linkPoints.forEach((point, index) => {
    // Check if point is within boundary before creating cube
    if (isPointInPolygon(point.position[0], point.position[2], BOUNDARY_POLYGON)) {
      const cube = new THREE.Mesh(geometry, material.clone());
      cube.position.set(...point.position);
      cube.userData = {
        index: index,
        title: point.title,
        url: point.url,
        isHovered: false
      };
      
      // Add a gentle glow effect
      const glowGeometry = new THREE.BoxGeometry(0.7, 0.7, 0.7);
      const glowMaterial = new THREE.MeshBasicMaterial({
        color: 0x00ff88,
        transparent: true,
        opacity: 0.3
      });
      const glow = new THREE.Mesh(glowGeometry, glowMaterial);
      cube.add(glow);
      
      scene.add(cube);
      linkCubes.push(cube);
      console.log(`Created cube at: ${point.position[0]}, ${point.position[1]}, ${point.position[2]}`);
    } else {
      console.log(`Cube at ${point.position[0]}, ${point.position[2]} is outside boundary polygon`);
    }
  });
}

// Initialize link system
createLinkCubes();
createInfoPopup();

// --- CROSSHAIR SYSTEM ---
let crosshair = null;
let isPointerLocked = false;

function createCrosshair() {
  // Hide default cursor
  document.body.style.cursor = 'none';
  
  // Create crosshair container
  crosshair = document.createElement('div');
  crosshair.id = 'crosshair';
  crosshair.style.cssText = `
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    pointer-events: none;
    z-index: 10000;
    opacity: 0.8;
    transition: all 0.1s ease;
  `;

  // Center dot
  const centerDot = document.createElement('div');
  centerDot.style.cssText = `
    position: absolute;
    width: 2px;
    height: 2px;
    background: #00ff00;
    border-radius: 50%;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    box-shadow: 0 0 4px rgba(0, 255, 0, 0.5);
  `;

  // Top line
  const topLine = document.createElement('div');
  topLine.style.cssText = `
    position: absolute;
    width: 2px;
    height: 8px;
    background: #00ff00;
    top: calc(50% - 12px);
    left: 50%;
    transform: translateX(-50%);
    box-shadow: 0 0 2px rgba(0, 255, 0, 0.5);
  `;

  // Bottom line
  const bottomLine = document.createElement('div');
  bottomLine.style.cssText = `
    position: absolute;
    width: 2px;
    height: 8px;
    background: #00ff00;
    top: calc(50% + 4px);
    left: 50%;
    transform: translateX(-50%);
    box-shadow: 0 0 2px rgba(0, 255, 0, 0.5);
  `;

  // Left line
  const leftLine = document.createElement('div');
  leftLine.style.cssText = `
    position: absolute;
    width: 8px;
    height: 2px;
    background: #00ff00;
    top: 50%;
    left: calc(50% - 12px);
    transform: translateY(-50%);
    box-shadow: 0 0 2px rgba(0, 255, 0, 0.5);
  `;

  // Right line
  const rightLine = document.createElement('div');
  rightLine.style.cssText = `
    position: absolute;
    width: 8px;
    height: 2px;
    background: #00ff00;
    top: 50%;
    left: calc(50% + 4px);
    transform: translateY(-50%);
    box-shadow: 0 0 2px rgba(0, 255, 0, 0.5);
  `;

  // Append all elements
  crosshair.appendChild(centerDot);
  crosshair.appendChild(topLine);
  crosshair.appendChild(bottomLine);
  crosshair.appendChild(leftLine);
  crosshair.appendChild(rightLine);
  
  document.body.appendChild(crosshair);
  return crosshair;
}

function updateCrosshairColor(color, intensity = 1) {
  if (!crosshair) return;
  
  const elements = crosshair.children;
  for (let element of elements) {
    element.style.background = color;
    element.style.boxShadow = `0 0 ${4 * intensity}px ${color}80`;
    element.style.opacity = intensity;
  }
}

function animateCrosshairClick() {
  if (!crosshair) return;
  
  // Flash red and scale up briefly
  updateCrosshairColor('#ff0000', 1.2);
  crosshair.style.transform = 'translate(-50%, -50%) scale(1.2)';
  
  setTimeout(() => {
    updateCrosshairColor('#00ff00', 0.8);
    crosshair.style.transform = 'translate(-50%, -50%) scale(1)';
  }, 100);
}

function animateCrosshairMovement() {
  if (!crosshair) return;
  
  // Subtle movement animation
  crosshair.style.transform = 'translate(-50%, -50%) scale(1.05)';
  setTimeout(() => {
    crosshair.style.transform = 'translate(-50%, -50%) scale(1)';
  }, 50);
}

// Initialize crosshair
createCrosshair();

// --- Rapier3D Physics & Player Controls ---
let rapierWorld, playerBody, playerCollider;
let isGrounded = false;
let isCrouching = false;
let velocity = new THREE.Vector3();
let moveDir = { forward: 0, right: 0 };
let yaw = 0, pitch = 0;
const PLAYER_HEIGHT = 1.7;
const CROUCH_HEIGHT = 1.0;
const PLAYER_RADIUS = 0.3;
const CAMERA_OFFSET = 0.1;
const MAX_FLY_HEIGHT = GROUND_LEVEL + 0.75; // Maximum flying height (0.75 above ground)
const WALK_SPEED = 4.0;
const CROUCH_SPEED = 2.0;
const JUMP_FORCE = 6.0;
const FLY_SPEED = 3.0;

// Point-in-polygon test (ray casting algorithm)
function isPointInPolygon(x, z, polygon) {
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    if (((polygon[i][1] > z) !== (polygon[j][1] > z)) &&
        (x < (polygon[j][0] - polygon[i][0]) * (z - polygon[i][1]) / (polygon[j][1] - polygon[i][1]) + polygon[i][0])) {
      inside = !inside;
    }
  }
  return inside;
}

// --- PROFESSIONAL RAYCAST SYSTEM ---
class RaycastManager {
  constructor(camera, scene) {
    this.camera = camera;
    this.scene = scene;
    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2(0, 0); // Center screen
    this.currentHit = null;
    this.raycastDistance = 1000;
    // Create invisible ground plane for accurate ground positioning
    this.createAccurateGroundPlane();
  }

  createAccurateGroundPlane() {
    // Create a large invisible plane at exact ground level for precise raycasting
    const groundGeometry = new THREE.PlaneGeometry(200, 200);
    const groundMaterial = new THREE.MeshBasicMaterial({ 
      color: 0x00ff00, 
      transparent: true, 
      opacity: 0,
      side: THREE.DoubleSide
    });
    this.accurateGroundPlane = new THREE.Mesh(groundGeometry, groundMaterial);
    this.accurateGroundPlane.rotation.x = -Math.PI / 2;
    this.accurateGroundPlane.position.set(0, GROUND_LEVEL, -3);
    this.accurateGroundPlane.name = 'accurate_ground_plane';
    this.scene.add(this.accurateGroundPlane);
  }

  // Enhanced raycast with proper world coordinate calculation
  performRaycast() {
    this.raycaster.setFromCamera(this.mouse, this.camera);
    this.raycaster.far = this.raycastDistance;
    // Get ray origin and direction in world space
    const rayOrigin = this.raycaster.ray.origin.clone();
    const rayDirection = this.raycaster.ray.direction.clone();
    // Get all meshes including our accurate ground plane
    const meshes = [];
    this.scene.traverse((child) => {
      if (child.isMesh && child.visible) {
        meshes.push(child);
      }
    });
    const intersects = this.raycaster.intersectObjects(meshes, true);
    if (intersects.length > 0) {
      // Find the closest meaningful hit (prioritize interactive objects, then visible objects)
      let bestHit = intersects[0];
      for (const hit of intersects) {
        // First priority: interactive objects (cubes with userData.title)
        if (hit.object.userData && hit.object.userData.title) {
          bestHit = hit;
          break;
        }
        // Second priority: visible objects (not ground plane and has some opacity)
        if (hit.object.name !== 'accurate_ground_plane' && 
            hit.object.material && 
            hit.object.material.opacity > 0) {
          bestHit = hit;
          // Don't break here, keep looking for interactive objects
        }
      }
      // Calculate precise world position accounting for all transformations
      let worldPosition = bestHit.point.clone();
      // If hitting the SPLAT mesh, adjust coordinates relative to its transform
      if (bestHit.object === splat || bestHit.object.parent === splat) {
        // Account for SPLAT position and rotation
        const splatMatrix = new THREE.Matrix4();
        splat.updateMatrixWorld(true);
        splatMatrix.copy(splat.matrixWorld);
        // Transform the hit point to world coordinates
        worldPosition.applyMatrix4(splatMatrix);
      }
      return {
        hasHit: true,
        point: worldPosition,
        localPoint: bestHit.point.clone(),
        object: bestHit.object,
        distance: bestHit.distance,
        normal: bestHit.face ? bestHit.face.normal.clone().normalize() : new THREE.Vector3(0, 1, 0),
        uv: bestHit.uv || null,
        worldPosition: worldPosition,
        objectType: this.getObjectType(bestHit.object),
        rayOrigin: rayOrigin,
        rayDirection: rayDirection
      };
    } else {
      // No hit - calculate precise ground intersection manually
      const t = (GROUND_LEVEL - rayOrigin.y) / rayDirection.y;
      const groundIntersection = rayOrigin.clone().add(rayDirection.clone().multiplyScalar(t));
      return {
        hasHit: false,
        point: groundIntersection,
        localPoint: groundIntersection.clone(),
        object: null,
        distance: Math.abs(t),
        normal: new THREE.Vector3(0, 1, 0),
        uv: null,
        worldPosition: groundIntersection,
        objectType: 'ground',
        rayOrigin: rayOrigin,
        rayDirection: rayDirection
      };
    }
  }
  
  getObjectType(object) {
    if (!object) return 'void';
    if (object.userData.title) return 'interactive';
    if (object.name) return object.name.toLowerCase();
    if (object.geometry) {
      if (object.geometry.type === 'PlaneGeometry') return 'surface';
      if (object.geometry.type === 'BoxGeometry') return 'cube';
      if (object.geometry.type === 'SphereGeometry') return 'sphere';
    }
    return 'mesh';
  }
  
  update() {
    this.currentHit = this.performRaycast();
    return this.currentHit;
  }
}

// --- PROFESSIONAL HUD SYSTEM (UPDATED FOR PLAYER POSITION) ---
class HUDManager {
  constructor() {
    this.elements = {};
    this.createPlayerPositionDisplay();
    this.createControlsDisplay();
    this.createCrosshair();
  }
  
  createPlayerPositionDisplay() {
    const display = document.createElement('div');
    display.id = 'hud-player-position';
    display.style.cssText = `
      position: fixed;
      top: 20px;
      left: 20px;
      background: rgba(0, 0, 0, 0.85);
      color: #00ff88;
      padding: 8px 12px;
      border-radius: 6px;
      font-family: 'Courier New', monospace;
      font-size: 11px;
      line-height: 1.2;
      border: 1px solid rgba(0, 255, 136, 0.3);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
      backdrop-filter: blur(10px);
      z-index: 1000;
      transition: all 0.2s ease;
      white-space: nowrap;
    `;
    document.body.appendChild(display);
    this.elements.playerPosition = display;
  }
  
  createControlsDisplay() {
    const display = document.createElement('div');
    display.id = 'hud-controls';
    display.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: rgba(0, 0, 0, 0.6);
      color: #00ff88;
      padding: 8px 12px;
      border-radius: 6px;
      font-family: 'Courier New', monospace;
      font-size: 10px;
      line-height: 1.2;
      border: 1px solid rgba(0, 255, 136, 0.2);
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
      backdrop-filter: blur(5px);
      z-index: 1000;
      min-width: 120px;
    `;
    display.innerHTML = `
      <div style="color: #ffaa00; font-weight: bold; margin-bottom: 4px; font-size: 11px;">
        Controls
      </div>
      <div style="color: #ccc; line-height: 1.1;">
        <div style="margin-bottom: 2px;">
          <span style="color: #00ff88; font-weight: bold;">WASD:</span> 
          <span style="color: #fff;">Move</span>
        </div>
        <div style="margin-bottom: 2px;">
          <span style="color: #00ff88; font-weight: bold;">Space:</span> 
          <span style="color: #fff;">Jump/Fly</span>
        </div>
        <div style="margin-bottom: 2px;">
          <span style="color: #00ff88; font-weight: bold;">Shift:</span> 
          <span style="color: #fff;">Fly Down</span>
        </div>
        <div style="margin-bottom: 2px;">
          <span style="color: #00ff88; font-weight: bold;">C:</span> 
          <span style="color: #fff;">Crouch</span>
        </div>
        <div style="margin-bottom: 2px;">
          <span style="color: #00ff88; font-weight: bold;">Mouse:</span> 
          <span style="color: #fff;">Look</span>
        </div>
        <div style="margin-bottom: 2px;">
          <span style="color: #00ff88; font-weight: bold;">Click:</span> 
          <span style="color: #fff;">Interact</span>
        </div>
        <div style="margin-bottom: 2px;">
          <span style="color: #00ff88; font-weight: bold;">ESC:</span> 
          <span style="color: #fff;">Cursor Out</span>
        </div>
      </div>
    `;
    document.body.appendChild(display);
    this.elements.controls = display;
  }
  
  createCrosshair() {
    const crosshair = document.createElement('div');
    crosshair.id = 'hud-crosshair';
    crosshair.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      pointer-events: none;
      z-index: 10000;
      width: 20px;
      height: 20px;
    `;
    // Create crosshair elements
    const elements = [
      { w: 2, h: 8, x: 9, y: 2 }, // top
      { w: 2, h: 8, x: 9, y: 10 }, // bottom  
      { w: 8, h: 2, x: 2, y: 9 }, // left
      { w: 8, h: 2, x: 10, y: 9 }, // right
      { w: 2, h: 2, x: 9, y: 9 }  // center
    ];
    elements.forEach(el => {
      const div = document.createElement('div');
      div.style.cssText = `
        position: absolute;
        width: ${el.w}px;
        height: ${el.h}px;
        left: ${el.x}px;
        top: ${el.y}px;
        background: #00ff88;
        box-shadow: 0 0 4px rgba(0, 255, 136, 0.6);
        transition: all 0.1s ease;
      `;
      crosshair.appendChild(div);
    });
    document.body.appendChild(crosshair);
    this.elements.crosshair = crosshair;
  }
  
  // NEW: Update to show player position with additional status info
  updatePlayerPositionDisplay(playerBody, isGrounded, isCrouching, currentVel) {
    if (!this.elements.playerPosition || !playerBody) return;
    
    const pos = playerBody.translation();
    const velocity = currentVel || { x: 0, y: 0, z: 0 };
    
    // Calculate movement speed (horizontal only)
    const horizontalSpeed = Math.sqrt(velocity.x * velocity.x + velocity.z * velocity.z);
    
    // Determine player state
    let playerState = 'Standing';
    let stateColor = '#00ff88';
    
    if (!isGrounded) {
      if (velocity.y > 0.1) {
        playerState = 'Rising';
        stateColor = '#ffaa00';
      } else if (velocity.y < -0.1) {
        playerState = 'Falling';
        stateColor = '#ff6b6b';
      } else {
        playerState = 'Floating';
        stateColor = '#4ecdc4';
      }
    } else if (isCrouching) {
      playerState = 'Crouching';
      stateColor = '#ff8800';
    } else if (horizontalSpeed > 0.1) {
      playerState = 'Moving';
      stateColor = '#45b7d1';
    }
    
    // High precision coordinates (6 decimal places for maximum accuracy)
    const preciseX = pos.x.toFixed(6);
    const preciseY = pos.y.toFixed(6);
    const preciseZ = pos.z.toFixed(6);
    
    this.elements.playerPosition.innerHTML = `
      <span style="color: #ff6b6b; font-weight: bold;">X:</span> 
      <span style="color: #fff; font-family: monospace;">${preciseX}</span>
      <span style="color: #4ecdc4; font-weight: bold; margin-left: 8px;">Y:</span> 
      <span style="color: #fff; font-family: monospace;">${preciseY}</span>
      <span style="color: #45b7d1; font-weight: bold; margin-left: 8px;">Z:</span> 
      <span style="color: #fff; font-family: monospace;">${preciseZ}</span>
    `;
  }
  
  // Keep the raycast-based crosshair updates for interaction feedback
  updateCrosshairState(hitInfo, playerPosition) {
    if (!this.elements.crosshair) return;
    
    let color = '#00ff88';
    let intensity = '0.6';
    let isInteractive = false;

    if (hitInfo && hitInfo.object && hitInfo.object.userData && hitInfo.object.userData.title && playerPosition) {
      const objPos = hitInfo.object.position;
      const dx = playerPosition.x - objPos.x;
      const dy = playerPosition.y - objPos.y;
      const dz = playerPosition.z - objPos.z;
      const dist = Math.sqrt(dx*dx + dy*dy + dz*dz);

      let threshold = 1.0; // default for helloCube
      if (isNewCube(hitInfo.object)) {
        threshold = 2; // clickable for newCube within 2 meters
      }
      
      // NEW: Check if cube is clickable based on game progression
      const isClickable = isCubeClickable(hitInfo.object);
      
      console.log(`Distance to ${hitInfo.object.userData.title}: ${dist.toFixed(2)}m, threshold: ${threshold}m, clickable: ${isClickable}`);
      
      if (dist < threshold && isClickable) {
        color = '#ffaa00'; // Yellow for interactive
        intensity = '0.8';
        isInteractive = true;
      } else if (dist < threshold && !isClickable) {
        color = '#ff6666'; // Red for not yet clickable
        intensity = '0.6';
        isInteractive = false;
      }
    } else if (hitInfo && hitInfo.objectType === 'void') {
      color = '#666';
      intensity = '0.4';
    } else if (hitInfo && hitInfo.hasHit) {
      color = '#00aaff';
      intensity = '0.7';
    }

    if (isInteractive) {
      this.showCircleCrosshair(color, intensity);
    } else {
      this.showPlusCrosshair(color, intensity);
    }
  }
  
  showCircleCrosshair(color, intensity) {
    if (!this.elements.crosshair) return;
    
    // Clear existing elements
    this.elements.crosshair.innerHTML = '';
    
    // Create circle crosshair
    const circle = document.createElement('div');
    circle.style.cssText = `
      position: absolute;
      width: 16px;
      height: 16px;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      border: 2px solid ${color};
      border-radius: 50%;
      box-shadow: 0 0 8px ${color}${Math.floor(parseInt(intensity) * 255).toString(16)};
      transition: all 0.1s ease;
    `;
    
    // Add center dot
    const centerDot = document.createElement('div');
    centerDot.style.cssText = `
      position: absolute;
      width: 2px;
      height: 2px;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: ${color};
      border-radius: 50%;
      box-shadow: 0 0 4px ${color}${Math.floor(parseInt(intensity) * 255).toString(16)};
    `;
    
    circle.appendChild(centerDot);
    this.elements.crosshair.appendChild(circle);
  }
  
  showPlusCrosshair(color, intensity) {
    if (!this.elements.crosshair) return;
    
    // Clear existing elements
    this.elements.crosshair.innerHTML = '';
    
    // Create plus crosshair elements
    const elements = [
      { w: 2, h: 8, x: 9, y: 2 }, // top
      { w: 2, h: 8, x: 9, y: 10 }, // bottom  
      { w: 8, h: 2, x: 2, y: 9 }, // left
      { w: 8, h: 2, x: 10, y: 9 }, // right
      { w: 2, h: 2, x: 9, y: 9 }  // center
    ];
    
    elements.forEach(el => {
      const div = document.createElement('div');
      div.style.cssText = `
        position: absolute;
        width: ${el.w}px;
        height: ${el.h}px;
        left: ${el.x}px;
        top: ${el.y}px;
        background: ${color};
        box-shadow: 0 0 4px ${color}${Math.floor(parseInt(intensity) * 255).toString(16)};
        transition: all 0.1s ease;
      `;
      this.elements.crosshair.appendChild(div);
    });
  }
  
  animateCrosshairClick() {
    if (!this.elements.crosshair) return;
    this.elements.crosshair.style.transform = 'translate(-50%, -50%) scale(1.2)';
    setTimeout(() => {
      this.elements.crosshair.style.transform = 'translate(-50%, -50%) scale(1)';
    }, 100);
  }
}

// --- ENHANCED INTERACTION SYSTEM (UPDATED) ---
class InteractionManager {
  constructor(raycastManager, hudManager) {
    this.raycastManager = raycastManager;
    this.hudManager = hudManager;
    this.lastHitObject = null;
  }
  
  // Updated to handle both player position and raycast updates
  update(playerBody, isGrounded, isCrouching, currentVel) {
    // Update player position display
    this.hudManager.updatePlayerPositionDisplay(playerBody, isGrounded, isCrouching, currentVel);
    
    // Still do raycast for interaction purposes
    const hitInfo = this.raycastManager.update();
    const playerPos = playerBody ? playerBody.translation() : null;
    this.hudManager.updateCrosshairState(hitInfo, playerPos);
    
    // Handle object interactions
    this.handleObjectInteractions(hitInfo);
    
    return hitInfo;
  }
  
  handleObjectInteractions(hitInfo) {
    // Reset previous object state
    if (this.lastHitObject && this.lastHitObject !== hitInfo.object) {
      this.resetObjectState(this.lastHitObject);
    }
    
    // Update current object state
    if (hitInfo.hasHit && hitInfo.object) {
      this.highlightObject(hitInfo.object, hitInfo.objectType);
    }
    
    this.lastHitObject = hitInfo.object;
  }
  
  highlightObject(object, objectType) {
    if (linkCubes.includes(object)) {
      // Keep the cube transparent, don't change color on hover
      object.userData.isHovered = true;
    }
  }
  
  resetObjectState(object) {
    if (linkCubes.includes(object)) {
      // Keep the cube transparent, don't change color on hover
      object.userData.isHovered = false;
    }
  }
  
  handleClick(hitInfo, playerPosition) {
    this.hudManager.animateCrosshairClick();
    
    if (hitInfo.hasHit && hitInfo.object && playerPosition) {
      const userData = hitInfo.object.userData;
      const objPos = hitInfo.object.position;
      const dx = playerPosition.x - objPos.x;
      const dy = playerPosition.y - objPos.y;
      const dz = playerPosition.z - objPos.z;
      const dist = Math.sqrt(dx*dx + dy*dy + dz*dz);

      let threshold = 1.0; // default for helloCube
      if (isNewCube(hitInfo.object)) {
        threshold = 10.0; // clickable for newCube within 10 meters
      }
      
      // NEW: Check if cube is clickable and within distance
      if (dist < threshold && userData.title && userData.url) {
        const isClickable = isCubeClickable(hitInfo.object);
        
        if (isClickable) {
          // Show popup and advance game state
          showInfoPopup(userData.title, userData.url);
          advanceGameState();
          return true;
        } else {
          // Show message that this cube isn't available yet
          showProgressionMessage();
          return false;
        }
      }
    }
    
    console.log('Click at position:', hitInfo.worldPosition);
    return false;
  }
}

// Initialize professional systems
const raycastManager = new RaycastManager(camera, scene);
const hudManager = new HUDManager();
const interactionManager = new InteractionManager(raycastManager, hudManager);

// Initialize position display
// createPositionDisplay(); // Remove this line

// Enhanced pointer lock for mouse look with crosshair integration
renderer.domElement.addEventListener('click', () => {
  renderer.domElement.requestPointerLock();
  animateCrosshairClick();
});

document.addEventListener('pointerlockchange', () => {
  if (document.pointerLockElement === renderer.domElement) {
    document.addEventListener('mousemove', onMouseMove, false);
    document.addEventListener('mousedown', onMouseDown, false);
    document.addEventListener('mouseup', onMouseUp, false);
    isPointerLocked = true;
    if (crosshair) crosshair.style.display = 'block';
  } else {
    document.removeEventListener('mousemove', onMouseMove, false);
    document.removeEventListener('mousedown', onMouseDown, false);
    document.removeEventListener('mouseup', onMouseUp, false);
    isPointerLocked = false;
    if (crosshair) crosshair.style.display = 'none';
    document.body.style.cursor = 'default';
  }
});

function onMouseMove(e) {
  const sensitivity = 0.002;
  yaw -= e.movementX * sensitivity;
  pitch -= e.movementY * sensitivity;
  pitch = Math.max(-Math.PI/2, Math.min(Math.PI/2, pitch));
  // Professional interaction update
  interactionManager.update();
}

function onMouseDown(e) {
  if (!isPointerLocked) return;
  switch(e.button) {
    case 0: // Left click
      const hitInfo = raycastManager.currentHit;
      const playerPos = playerBody ? playerBody.translation() : null;
      interactionManager.handleClick(hitInfo, playerPos);
      break;
    case 2: // Right click
      hudManager.updateCrosshairState({objectType: 'menu', hasHit: false});
      console.log('Right click detected');
      break;
  }
}

function onMouseUp(e) {
  if (!isPointerLocked) return;
  
  // Reset crosshair color after mouse up
  setTimeout(() => {
    updateCrosshairColor('#00ff00', 0.8);
  }, 150);
}

// Prevent context menu on right click
renderer.domElement.addEventListener('contextmenu', (e) => {
  e.preventDefault();
});

// Keyboard controls
const keys = {};
document.addEventListener('keydown', (e) => { 
  keys[e.code] = true;
  
  // Close popup with Escape
  if (e.code === 'Escape') {
    hideInfoPopup();
  }
  
  // Change crosshair color when certain keys are pressed
  if (e.code === 'Space') {
    updateCrosshairColor('#ffff00', 1.2); // Yellow for jump/fly
  } else if (e.code === 'KeyC') {
    updateCrosshairColor('#ff8800', 0.9); // Orange for crouch
  }
});

document.addEventListener('keyup', (e) => { 
  keys[e.code] = false;
  
  // Reset crosshair color when keys are released
  if (e.code === 'Space' || e.code === 'KeyC') {
    setTimeout(() => {
      updateCrosshairColor('#00ff00', 0.8);
    }, 100);
  }
});

function getMoveInput() {
  moveDir.forward = (keys['KeyW'] ? 1 : 0) - (keys['KeyS'] ? 1 : 0);
  moveDir.right = (keys['KeyD'] ? 1 : 0) - (keys['KeyA'] ? 1 : 0);
}

// --- Initialize Rapier and Player ---
async function initPhysics() {
  await RAPIER.init();
  rapierWorld = new RAPIER.World({ x: 0, y: -9.81, z: 0 });

  // Ground plane positioned at GROUND_LEVEL
  const groundBodyDesc = RAPIER.RigidBodyDesc.fixed().setTranslation(0, GROUND_LEVEL - 0.1, 0);
  const groundBody = rapierWorld.createRigidBody(groundBodyDesc);
  const groundColliderDesc = RAPIER.ColliderDesc.cuboid(50, 0.1, 50);
  rapierWorld.createCollider(groundColliderDesc, groundBody);

  // EXPLICIT BARRIER: Create a physics-only barrier at the helloCube location
  const barrierBodyDesc = RAPIER.RigidBodyDesc.fixed()
    .setTranslation(2.84, -0.42, -3.30); // Exact helloCube position
  const barrierBody = rapierWorld.createRigidBody(barrierBodyDesc);
  const barrierColliderDesc = RAPIER.ColliderDesc.cuboid(0.125, 0.125, 0.125) // Half-extents of helloCube (0.25/2)
    .setFriction(0.8)
    .setRestitution(0.3);
  const barrierCollider = rapierWorld.createCollider(barrierColliderDesc, barrierBody);
  
  console.log("Explicit barrier physics body created at:", barrierBody.translation());

  
  linkCubes.forEach(cube => {
    if (cube.userData.hasPhysics) {
      const physics = createCubePhysicsBody(cube, rapierWorld);
      physicsCubes.push({
        mesh: cube,
        body: physics.body,
        collider: physics.collider
      });
      console.log(`Created physics body for: ${cube.userData.title} at:`, physics.body.translation());
    }
  });

  // Player capsule - spawn ON the ground
  const spawnY = GROUND_LEVEL + PLAYER_RADIUS + 0.01;
  const playerBodyDesc = RAPIER.RigidBodyDesc.dynamic().setTranslation(0, spawnY, -2.5);
  playerBody = rapierWorld.createRigidBody(playerBodyDesc);
  playerCollider = rapierWorld.createCollider(
    RAPIER.ColliderDesc.capsule(PLAYER_HEIGHT/2, PLAYER_RADIUS).setTranslation(0, 0, 0),
    playerBody
  );
  
  playerBody.setLinearDamping(2.0);
  playerCollider.setFriction(0.7);
  playerCollider.setRestitution(0.1);
}

await initPhysics();

// --- First-Person Controls & Physics Update ---
function updatePhysics(dt) {
  if (!playerBody || !playerCollider) return;
  
  // Step physics first to get current state
  rapierWorld.step();
  
  getMoveInput();

  // Calculate direction
  const dir = new THREE.Vector3();
  const forward = new THREE.Vector3(-Math.sin(yaw), 0, -Math.cos(yaw));
  const right = new THREE.Vector3(Math.cos(yaw), 0, -Math.sin(yaw));
  dir.addScaledVector(forward, moveDir.forward);
  dir.addScaledVector(right, moveDir.right);
  if (dir.lengthSq() > 0) dir.normalize();

  // Get current velocity and position
  const currentVel = playerBody.linvel();
  const currentPos = playerBody.translation();
  
  // Ground check (raycast down) - improved detection
  isGrounded = false;
  const rayOriginY = currentPos.y - (isCrouching ? CROUCH_HEIGHT/2 : PLAYER_HEIGHT/2);
  const rayOrigin = { x: currentPos.x, y: rayOriginY, z: currentPos.z };
  const rayDir = { x: 0, y: -1, z: 0 };
  
  try {
    const hit = rapierWorld.castRay(rayOrigin, rayDir, PLAYER_RADIUS + 0.05, true);
    if (hit && hit.colliderHandle !== playerCollider.handle) {
      isGrounded = true;
    }
  } catch (error) {
    console.warn("Raycast error:", error);
  }

  // Additional ground check - if we're very close to ground level
  if (!isGrounded && Math.abs(currentPos.y - (GROUND_LEVEL + PLAYER_RADIUS)) < 0.1) {
    isGrounded = true;
  }

  // Handle crouching
  if (keys['KeyC'] && !isCrouching && isGrounded) {
    isCrouching = true;
  } else if (!keys['KeyC'] && isCrouching) {
    isCrouching = false;
  }

  // Smooth horizontal movement
  const speed = isCrouching ? CROUCH_SPEED : WALK_SPEED;
  velocity.lerp(dir.multiplyScalar(speed), 0.15);

  // Calculate new horizontal position for boundary checking
  const newX = currentPos.x + velocity.x * dt;
  const newZ = currentPos.z + velocity.z * dt;
  
  // Set horizontal velocity only if within boundary
  if (isPointInPolygon(newX, newZ, BOUNDARY_POLYGON)) {
    playerBody.setLinvel({ x: velocity.x, y: currentVel.y, z: velocity.z }, true);
  } else {
    // Stop horizontal movement if trying to go outside boundary
    playerBody.setLinvel({ x: 0, y: currentVel.y, z: 0 }, true);
    velocity.x = 0;
    velocity.z = 0;
  }

  // Vertical movement handling
  let newVelY = currentVel.y;
  
  if (keys['Space']) {
    if (isGrounded) {
      // Jump from ground
      newVelY = JUMP_FORCE;
    } else if (currentPos.y < MAX_FLY_HEIGHT) {
      // Fly up (only if below max height)
      newVelY = Math.max(currentVel.y, FLY_SPEED);
    }
  } else if (keys['ShiftLeft'] || keys['ShiftRight']) {
    // Fly/fall down faster when not grounded
    if (!isGrounded) {
      newVelY = -FLY_SPEED;
    }
  }
  
  // Apply Y velocity change
  if (Math.abs(newVelY - currentVel.y) > 0.1) {
    playerBody.setLinvel({ x: currentVel.x, y: newVelY, z: currentVel.z }, true);
  }

  // Clamp Y position to valid range (less aggressive)
  const pos = playerBody.translation();
  if (pos.y > MAX_FLY_HEIGHT + PLAYER_HEIGHT/2) {
    playerBody.setTranslation({ x: pos.x, y: MAX_FLY_HEIGHT + PLAYER_HEIGHT/2, z: pos.z }, true);
    if (currentVel.y > 0) {
      playerBody.setLinvel({ x: currentVel.x, y: 0, z: currentVel.z }, true);
    }
  }
  
  // UPDATE: Pass player data to interaction manager
  if (isPointerLocked) {
    interactionManager.update(playerBody, isGrounded, isCrouching, currentVel);
  }

  // Add collision check for invisible barriers
  checkPlayerCubeCollisions();
}

// Add collision detection for invisible barriers
function checkPlayerCubeCollisions() {
  if (!playerBody) return;
  
  const playerPos = playerBody.translation();
  
  physicsCubes.forEach(cubeData => {
    const cubePos = cubeData.mesh.position;
    const distance = Math.sqrt(
      Math.pow(playerPos.x - cubePos.x, 2) + 
      Math.pow(playerPos.y - cubePos.y, 2) + 
      Math.pow(playerPos.z - cubePos.z, 2)
    );
    
    // Optional: Make cube barely visible when player is very close
    if (distance < 0.5) {
      if (!cubeData.mesh.userData.glowing) {
        cubeData.mesh.userData.glowing = true;
        // Uncomment these lines if you want a subtle hint when very close:
        // cubeData.mesh.material.opacity = 0.1;
        // cubeData.mesh.material.visible = true;
      }
    } else {
      // Keep cube invisible when player moves away
      if (cubeData.mesh.userData.glowing) {
        cubeData.mesh.userData.glowing = false;
        cubeData.mesh.material.opacity = 0;
        cubeData.mesh.material.visible = false;
      }
    }
  });
}

// Animate link cubes
function animateLinkCubes() {
  const time = Date.now() * 0.001;
  linkCubes.forEach((cube, index) => {
    // Skip animation for helloCube (first cube in array)
    if (index === 0) return;
    
    if (index < linkPoints.length) {
      // Animate only the original link cubes
      const offset = Math.sin(time + index * 2) * 0.05;
      cube.position.y = linkPoints[index].position[1] + offset;
      cube.rotation.y += 0.01;
      cube.rotation.x += 0.005;
    }
    // Do not animate helloCube, pillarCube, hello2Cube, etc.
  });
}

// --- Animation Loop Update ---
function animate() {
  requestAnimationFrame(animate);
  const dt = 1/60;
  
  if (rapierWorld && playerBody && playerCollider) {
    updatePhysics(dt);
    // Sync camera to player
    const pos = playerBody.translation();
    if (pos) {
      camera.position.set(
        pos.x,
        pos.y + (isCrouching ? CROUCH_HEIGHT/2 : PLAYER_HEIGHT/2) + CAMERA_OFFSET,
        pos.z
      );
      camera.rotation.set(pitch, yaw, 0, 'YXZ');
    }
  }
  
  // Animate link cubes
  animateLinkCubes();
  
  // Update cube visuals
  updateCubeVisuals();
  
  renderer.render(scene, camera);
}
animate();

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

// Updated coordinate copying to use player position
document.addEventListener('keydown', (e) => {
  if (e.code === 'KeyC' && e.ctrlKey && isPointerLocked && playerBody) {
    e.preventDefault();
    const pos = playerBody.translation();
    const coordString = `${pos.x.toFixed(6)}, ${pos.y.toFixed(6)}, ${pos.z.toFixed(6)}`;
    // Copy to clipboard
    navigator.clipboard.writeText(coordString).then(() => {
      // Show temporary notification
      const notification = document.createElement('div');
      notification.style.cssText = `
        position: fixed;
        top: 60%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: rgba(0, 255, 136, 0.9);
        color: #000;
        padding: 8px 16px;
        border-radius: 6px;
        font-family: 'Courier New', monospace;
        font-size: 12px;
        font-weight: bold;
        z-index: 10001;
        animation: fadeInOut 2s ease-in-out;
      `;
      notification.textContent = `Player Position Copied: ${coordString}`;
      document.body.appendChild(notification);
      setTimeout(() => notification.remove(), 2000);
    });
  }
});
// Add CSS animation for notification
const style = document.createElement('style');
style.textContent = `
  @keyframes fadeInOut {
    0% { opacity: 0; transform: translate(-50%, -50%) scale(0.8); }
    20% { opacity: 1; transform: translate(-50%, -50%) scale(1); }
    80% { opacity: 1; transform: translate(-50%, -50%) scale(1); }
    100% { opacity: 0; transform: translate(-50%, -50%) scale(0.8); }
  }
`;
document.head.appendChild(style);

console.log("Progressive cube interaction system loaded. Game starts with helloCube (level 0).");
