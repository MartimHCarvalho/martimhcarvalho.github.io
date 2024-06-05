import * as THREE from "https://cdn.skypack.dev/three@0.132.2";
import { OrbitControls } from "https://cdn.skypack.dev/three@0.132.2/examples/jsm/controls/OrbitControls.js";
import { Water } from "https://cdn.skypack.dev/three@0.132.2/examples/jsm/objects/Water.js";
import { Sky } from "https://cdn.skypack.dev/three@0.132.2/examples/jsm/objects/Sky.js";
import { GLTFLoader } from "https://cdn.skypack.dev/three@0.132.2/examples/jsm/loaders/GLTFLoader.js";

// Definir as dimensões do mapa de normais
const width = 128;
const height = 128;
const depth = 128;

// Criar um array tridimensional para armazenar as normais
const normals = new Array(width).fill(null).map(() =>
  new Array(height).fill(null).map(() =>
    new Array(depth).fill(null)
  )
);

// Função para calcular Perlin Noise 3D (implementação simplificada)
function perlin3D(x, y, z) {
  return Math.sin(x * 0.1) + Math.cos(y * 0.1) + Math.sin(z * 0.1);
}

// Calcular as normais usando Perlin Noise
for (let x = 0; x < width; x++) {
  for (let y = 0; y < height; y++) {
    for (let z = 0; z < depth; z++) {
      // Calcular a intensidade da onda usando Perlin Noise
      const noiseValue = perlin3D(x * 0.01, y * 0.01, z * 0.01);

      // Normalizar a intensidade para o intervalo [-1, 1]
      const intensity = (noiseValue + 1) / 2;

      // Calcular a normal correspondente
      const normal = new THREE.Vector3(
        Math.sin(x * 0.1) * intensity,
        Math.cos(y * 0.1) * intensity,
        Math.sin(z * 0.1) * intensity
      ).normalize();

      // Armazenar a normal no array tridimensional
      normals[x][y][z] = normal;
    }
  }
}

// Criar cena
let cena = new THREE.Scene();

// Criar câmera
let camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);
camera.position.z = 5;

// Criar renderizador
let renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// Adicionar luz
let luz = new THREE.DirectionalLight(0xffffff, 1);
luz.position.set(1, 1, 1).normalize();
cena.add(luz);

// Criar loader de textura
let loader = new THREE.TextureLoader();

// Criar geometria para o prisma retangular
let prismGeometry = new THREE.BoxGeometry(100, 20, 40);

// Carregar textura de areia
let prismTexture = loader.load("models/aerial_beach_03_diff_4k.jpg");

let prismMaterial = new THREE.MeshBasicMaterial({
  map: prismTexture, // Aplicar a textura de areia ao material da pirâmide
});

// Adicionar geometria à cena
let prism = new THREE.Mesh(prismGeometry, prismMaterial);
prism.position.set(0, 1, 0); // Posicionar a pirâmide acima da praia
cena.add(prism);

// Adicionar OrbitControls
let controls = new OrbitControls(camera, renderer.domElement);
controls.update();

// Adicionar oceano
let waterGeometry = new THREE.PlaneGeometry(100, 100, width - 1, depth - 1); // Adicione segmentos à geometria para deformação
let water = new Water(waterGeometry, {
  textureWidth: 512,
  textureHeight: 512,
  waterNormals: new THREE.TextureLoader().load('textures/waternormals.jpg', function (texture) {
    texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  }),
  alpha: 1.0,
  sunDirection: new THREE.Vector3(),
  sunColor: 0xffffff,
  waterColor: 0x001e0f,
  distortionScale: 3.7,
  fog: cena.fog !== undefined
});
water.rotation.x = -Math.PI / 2;
water.position.z = 50;
cena.add(water);

let gltfLoader = new GLTFLoader();

gltfLoader.load('models/character.glb', function(gltf) {
  let character = gltf.scene;

  // Posicionar a personagem em cima do prisma
  character.position.set(0, 3, 0);

  // Adicionar a personagem à cena
  cena.add(character);
});

let prevTime = null;
let moveForward = false;
let moveBackward = false;
let moveLeft = false;
let moveRight = false;

document.addEventListener('keydown', function(event) {
  switch (event.code) {
    case 'ArrowUp':
    case 'KeyW':
      moveForward = true;
      break;
    case 'ArrowLeft':
    case 'KeyA':
      moveLeft = true;
      break;
    case 'ArrowDown':
    case 'KeyS':
      moveBackward = true;
      break;
    case 'ArrowRight':
    case 'KeyD':
      moveRight = true;
      break;
  }
});

document.addEventListener('keyup', function(event) {
  switch (event.code) {
    case 'ArrowUp':
    case 'KeyW':
      moveForward = false;
      break;
    case 'ArrowLeft':
    case 'KeyA':
      moveLeft = false;
      break;
    case 'ArrowDown':
    case 'KeyS':
      moveBackward = false;
      break;
    case 'ArrowRight':
    case 'KeyD':
      moveRight = false;
      break;
  }
});

// Adicionar céu
let sky = new Sky();
sky.scale.setScalar(10000);
cena.add(sky);
let uniforms = sky.material.uniforms;
uniforms["turbidity"].value = 5;
uniforms["rayleigh"].value = 2;
uniforms["mieCoefficient"].value = 0.005;
uniforms["mieDirectionalG"].value = 0.8;

// Atualizar posição do sol
let parameters = {
  distance: 400,
  inclination: 0.49, // inclinação do sol
  azimuth: 0.205, // posição do sol no horizonte
};
let sunSphere = new THREE.Mesh(
  new THREE.SphereBufferGeometry(20000, 16, 8),
  new THREE.MeshBasicMaterial({ color: 0xffffff })
);
sunSphere.position.y = -700000;
sunSphere.visible = false;
cena.add(sunSphere);
function updateSun() {
  let theta = Math.PI * (parameters.inclination - 0.5);
  let phi = 2 * Math.PI * (parameters.azimuth - 0.5);
  luz.position.x = parameters.distance * Math.cos(phi);
  luz.position.y = parameters.distance * Math.sin(phi) * Math.sin(theta);
  luz.position.z = parameters.distance * Math.sin(phi) * Math.cos(theta);
  sky.material.uniforms["sunPosition"].value = luz.position.copy(luz.position);
  water.material.uniforms["sunDirection"].value.copy(luz.position).normalize();
  renderer.render(cena, camera);
}
updateSun();

// Criar loop de animação
function animate() {
  let time = performance.now() * 0.001;

  // Deformar a geometria do oceano
  let position = water.geometry.attributes.position;
  for (let i = 0; i < position.count; i++) {
    let x = position.getX(i);
    let y = position.getY(i);
    let z = position.getZ(i);
    let normal = normals[Math.round(x + width / 2)][Math.round(y + height / 2)][Math.round(z + depth / 2)];
    position.setZ(i, normal.z * 10); // Ajuste o fator de escala conforme necessário
  }
  position.needsUpdate = true; // Informar ao Three.js para atualizar a geometria

  if (controls.isLocked === true) {
    let delta = time - prevTime;

    velocity.x -= velocity.x * 10.0 * delta;
    velocity.z -= velocity.z * 10.0 * delta;

    direction.z = Number(moveForward) - Number(moveBackward);
    direction.x = Number(moveRight) - Number(moveLeft);
    direction.normalize();

    if (moveForward || moveBackward) velocity.z -= direction.z * 400.0 * delta;
    if (moveLeft || moveRight) velocity.x -= direction.x * 400.0 * delta;

    controls.moveRight(-velocity.x * delta);
    controls.moveForward(-velocity.z * delta);
  }

  prevTime = time;

  water.material.uniforms["time"].value += 1.0 / 60.0;
  controls.update();
  renderer.render(cena, camera);
  requestAnimationFrame(animate);
}
animate();