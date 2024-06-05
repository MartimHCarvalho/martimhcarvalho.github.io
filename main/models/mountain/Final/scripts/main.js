import * as THREE from 'https://threejs.org/build/three.module.js';
import { OrbitControls } from 'https://threejs.org/examples/jsm/controls/OrbitControls.js';

// Criar cena
let cena = new THREE.Scene();

// Criar câmera
let camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.z = 5;

// Criar renderizador
let renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// Adicionar luz
let luz = new THREE.DirectionalLight(0xffffff, 1);
luz.position.set(1, 1, 1).normalize();
cena.add(luz);

// Criar geometria para a praia
let geometria = new THREE.PlaneGeometry(10, 10);

// Adicionar textura
let loader = new THREE.TextureLoader();
let material = new THREE.MeshBasicMaterial({
  map: loader.load('models/aerial_beach_03_diff_4k.jpg')
});

// Adicionar geometria à cena
let praia = new THREE.Mesh(geometria, material);
cena.add(praia);

// Adicionar OrbitControls
let controls = new OrbitControls(camera, renderer.domElement);
controls.update();

// Criar loop de animação
function animate() {
  requestAnimationFrame(animate);
  controls.update(); // necessário se controls.enableDamping ou controls.autoRotate estão definidos como true
  renderer.render(cena, camera);
}
animate();