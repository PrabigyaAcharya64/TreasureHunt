import * as THREE from "three";
import { SplatMesh } from "@sparkjsdev/spark";
import RAPIER from "https://cdn.skypack.dev/@dimforge/rapier3d-compat";

const GROUND_LEVEL = -1.35; // Ground Y position

const linkCubes = []; // <-- Declare this FIRST

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

// Fix 1: Reduce the helloCube size to be more reasonable
const helloCubeGeometry = new THREE.BoxGeometry(0.5, 0.5, 0.5); // Changed from 3,3,3 to 0.5,0.5,0.5
const helloCubeMaterial = new THREE.MeshLambertMaterial({ color: 0x00ff88 });
const helloCube = new THREE.Mesh(helloCubeGeometry, helloCubeMaterial);
helloCube.position.set(0, GROUND_LEVEL + 0.25, -3); // Sits on ground
helloCube.userData = {
  title: 'Hello Cube',
  url: 'hello'
};
scene.add(helloCube);
linkCubes.push(helloCube);


function moveHelloCube(newX, newY, newZ) {
  helloCube.position.set(newX, newY, newZ);
}

// Debug the position: Add some debug logging to see if the position is actually changing:
// (Place this in your animate loop)
// console.log("Cube position:", helloCube.position);
// console.log("Camera position:", camera.position);


const hello2CubeGeometry = new THREE.BoxGeometry(0.018, 0.018, 0.018); // 10% of previous size
const hello2CubeMaterial = new THREE.MeshLambertMaterial({ color: 0x3399ff, transparent: true, opacity: 0.7 });
const hello2Cube = new THREE.Mesh(hello2CubeGeometry, hello2CubeMaterial);
hello2Cube.position.set(3.15077, 0.75, -3.99356); // Center at y = 0.75
hello2Cube.userData = {
  title: 'Hello 2 Cube',
  url: 'hello2'
};
scene.add(hello2Cube);
linkCubes.push(hello2Cube);


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
  popup.innerHTML = `<div style="font-weight:bold;font-size:22px;margin-bottom:10px;">${title}</div><div>hello 2</div><br><button id="close-popup-btn" style="margin-top:10px;padding:6px 18px;background:#3399ff;color:#222;border:none;border-radius:6px;font-size:15px;cursor:pointer;">Close</button>`;
  document.body.appendChild(popup);
  document.getElementById('close-popup-btn').onclick = () => popup.remove();
}


const originalShowInfoPopup = showInfoPopup;
showInfoPopup = function(title, url) {
  if (url === 'hello2') {
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
    popup.innerHTML = `<div style="font-weight:bold;font-size:22px;margin-bottom:10px;">${title}</div><div>hello 2</div><br><button id="close-popup-btn" style="margin-top:10px;padding:6px 18px;background:#3399ff;color:#222;border:none;border-radius:6px;font-size:15px;cursor:pointer;">Close</button>`;
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
  // Spawn point cube - positioned at player spawn location
  { position: [0, GROUND_LEVEL + 0.3, -2.5], title: "Spawn Point", url: "spawn" },
  // Add more points here if they're within your boundary polygon
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
      // Find the closest meaningful hit (prioritize visible objects over ground plane)
      let bestHit = intersects[0];
      for (const hit of intersects) {
        if (hit.object.name !== 'accurate_ground_plane' && hit.object.material.opacity > 0) {
          bestHit = hit;
          break;
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

// --- PROFESSIONAL HUD SYSTEM ---
class HUDManager {
  constructor() {
    this.elements = {};
    this.createPositionDisplay();
    this.createCrosshair();
  }
  
  createPositionDisplay() {
    const display = document.createElement('div');
    display.id = 'hud-position';
    display.style.cssText = `
      position: fixed;
      top: 20px;
      left: 20px;
      background: rgba(0, 0, 0, 0.85);
      color: #00ff88;
      padding: 12px 16px;
      border-radius: 8px;
      font-family: 'Courier New', monospace;
      font-size: 13px;
      line-height: 1.4;
      border: 1px solid rgba(0, 255, 136, 0.3);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
      backdrop-filter: blur(10px);
      z-index: 1000;
      min-width: 200px;
      transition: all 0.2s ease;
    `;
    document.body.appendChild(display);
    this.elements.position = display;
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
  
  updatePositionDisplay(hitInfo) {
    if (!this.elements.position || !hitInfo) return;
    const pos = hitInfo.worldPosition;
    const distance = hitInfo.distance;
    const objectType = hitInfo.objectType;
    const hasHit = hitInfo.hasHit;
    // Format object name
    const objectName = hitInfo.object?.userData?.title || 
                      hitInfo.object?.name || 
                      objectType.charAt(0).toUpperCase() + objectType.slice(1);
    // Color coding based on object type
    let statusColor = '#00ff88';
    if (objectType === 'interactive') statusColor = '#ffaa00';
    else if (objectType === 'ground') statusColor = '#888';
    else if (objectType === 'void') statusColor = '#666';
    else if (hasHit) statusColor = '#00aaff';
    // High precision coordinates (5 decimal places for accuracy)
    const preciseX = pos.x.toFixed(5);
    const preciseY = pos.y.toFixed(5);
    const preciseZ = pos.z.toFixed(5);
    this.elements.position.innerHTML = `
      <div style="color: ${statusColor}; font-weight: bold; margin-bottom: 6px; font-size: 14px;">
        🎯 ${objectName}
      </div>
      <div style="color: #ccc; line-height: 1.3;">
        <div style="margin-bottom: 2px;">
          <span style="color: #ff6b6b; font-weight: bold;">X:</span> 
          <span style="color: #fff; font-family: monospace;">${preciseX}</span>
        </div>
        <div style="margin-bottom: 2px;">
          <span style="color: #4ecdc4; font-weight: bold;">Y:</span> 
          <span style="color: #fff; font-family: monospace;">${preciseY}</span>
        </div>
        <div style="margin-bottom: 4px;">
          <span style="color: #45b7d1; font-weight: bold;">Z:</span> 
          <span style="color: #fff; font-family: monospace;">${preciseZ}</span>
        </div>
      </div>
      <div style="color: #999; font-size: 11px; border-top: 1px solid #333; padding-top: 4px;">
        ${hasHit ? '📏' : '🎯'} Distance: ${distance.toFixed(3)}m
      </div>
      <div style="color: #666; font-size: 10px; margin-top: 2px;">
        ${hasHit ? 'Surface Hit' : 'Ground Projection'}
      </div>
    `;
  }
  
  updateCrosshairState(hitInfo) {
    if (!this.elements.crosshair) return;
    const elements = this.elements.crosshair.children;
    let color = '#00ff88';
    let intensity = '0.6';
    if (hitInfo.objectType === 'interactive') {
      color = '#ffaa00';
      intensity = '0.8';
    } else if (hitInfo.objectType === 'void') {
      color = '#666';
      intensity = '0.4';
    } else if (hitInfo.hasHit) {
      color = '#00aaff';
      intensity = '0.7';
    }
    for (let element of elements) {
      element.style.background = color;
      element.style.boxShadow = `0 0 4px ${color}${Math.floor(parseInt(intensity) * 255).toString(16)}`;
    }
  }
  
  animateCrosshairClick() {
    if (!this.elements.crosshair) return;
    this.elements.crosshair.style.transform = 'translate(-50%, -50%) scale(1.2)';
    setTimeout(() => {
      this.elements.crosshair.style.transform = 'translate(-50%, -50%) scale(1)';
    }, 100);
  }
}

// --- ENHANCED INTERACTION SYSTEM ---
class InteractionManager {
  constructor(raycastManager, hudManager) {
    this.raycastManager = raycastManager;
    this.hudManager = hudManager;
    this.lastHitObject = null;
  }
  
  update() {
    const hitInfo = this.raycastManager.update();
    // Update HUD
    this.hudManager.updatePositionDisplay(hitInfo);
    this.hudManager.updateCrosshairState(hitInfo);
    // Handle object state changes
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
      object.material.color.setHex(0xffff00);
      object.userData.isHovered = true;
    }
  }
  
  resetObjectState(object) {
    if (linkCubes.includes(object)) {
      object.material.color.setHex(0x00ff88);
      object.userData.isHovered = false;
    }
  }
  
  handleClick(hitInfo) {
    this.hudManager.animateCrosshairClick();
    if (hitInfo.hasHit && hitInfo.object) {
      const userData = hitInfo.object.userData;
      if (userData.title && userData.url) {
        showInfoPopup(userData.title, userData.url);
        return true;
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
      interactionManager.handleClick(hitInfo);
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

  // Player capsule - spawn ON the ground (not floating above it)
  const spawnY = GROUND_LEVEL + PLAYER_RADIUS + 0.01; // Just above ground surface
  const playerBodyDesc = RAPIER.RigidBodyDesc.dynamic().setTranslation(0, spawnY, -2.5);
  playerBody = rapierWorld.createRigidBody(playerBodyDesc);
  playerCollider = rapierWorld.createCollider(
    RAPIER.ColliderDesc.capsule(PLAYER_HEIGHT/2, PLAYER_RADIUS).setTranslation(0, 0, 0),
    playerBody
  );
  
  // Set initial physics properties
  playerBody.setLinearDamping(2.0); // Air resistance for smoother movement
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
}

// Animate link cubes
function animateLinkCubes() {
  const time = Date.now() * 0.001;
  linkCubes.forEach((cube, index) => {
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
      // Update interaction system
      if (isPointerLocked) {
        interactionManager.update();
      }
    }
  }
  
  // Animate link cubes
  animateLinkCubes();
  
  renderer.render(scene, camera);
}
animate();

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

// Add coordinate copying functionality
// (Ctrl+C while pointer locked copies the current HUD coordinates)
document.addEventListener('keydown', (e) => {
  if (e.code === 'KeyC' && e.ctrlKey && isPointerLocked) {
    e.preventDefault();
    if (interactionManager.raycastManager.currentHit) {
      const pos = interactionManager.raycastManager.currentHit.worldPosition;
      const coordString = `${pos.x.toFixed(5)}, ${pos.y.toFixed(5)}, ${pos.z.toFixed(5)}`;
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
        notification.textContent = `Coordinates copied: ${coordString}`;
        document.body.appendChild(notification);
        setTimeout(() => notification.remove(), 2000);
      });
    }
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