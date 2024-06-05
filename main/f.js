import * as THREE from "https://cdn.skypack.dev/three@0.132.2";
import { OrbitControls } from "https://cdn.skypack.dev/three@0.132.2/examples/jsm/controls/OrbitControls.js";
import { PointerLockControls } from "https://cdn.skypack.dev/three@0.132.2/examples/jsm/controls/PointerLockControls.js";
import { Water } from "https://cdn.skypack.dev/three@0.132.2/examples/jsm/objects/Water2.js";
import { GLTFLoader } from "https://cdn.skypack.dev/three@0.132.2/examples/jsm/loaders/GLTFLoader.js";

let scene, renderer, player, activeCamera, cameraFPV, cameraTPV;
let orbitControls, pointerLockControls;
let trees = [];
let sun,
  time = 0;
let water; // Declare a variável water aqui
let knife;
let mountain;
const gltfLoader = new GLTFLoader();
let direction = Math.random() * Math.PI * 2; // Direção inicial aleatória
let speed = 0.0005; // Velocidade do modelo
let model;
let knifeNearby = false;
let hasKnife = false;
let dead = false;
let clean = false;
let health = 5; // Inicializa a saúde do jogador
let intersectionCount = 0;
let steak;
let mountain2;
let mountain_top;
let steakNearby = false;

window.onload = function () {
  document.getElementById("deathOverlay").style.display = "none";
};

function updateHealthUI() {
  const healthBar = document.getElementById("healthBar");
  healthBar.innerHTML = ""; // Limpa os corações antigos

  for (let i = 0; i < 5; i++) {
    const heart = document.createElement("div");
    heart.classList.add("heart");
    if (i < health) {
      heart.style.backgroundImage = `url(${
        i < health
          ? "./textures/heart/life.png"
          : "./textures/heart/no_life.png"
      })`;
    } else {
      heart.style.backgroundImage = `url(${
        i < health
          ? "./textures/heart/life.png"
          : "./textures/heart/no_life.png"
      })`;
    }
    healthBar.appendChild(heart);
  }
}

gltfLoader.load("models/steak/scene.gltf", (gltf) => {
  steak = gltf.scene;

  const scaleFactor = 0.5; // Fator de escala desejado
  steak.scale.set(scaleFactor, scaleFactor, scaleFactor);
  steak.position.x = 0;
  steak.position.z = -98;
  steak.position.y = -10; // Ajuste a posição Y conforme necessário

  // Adicione o bife à cena
  scene.add(steak);
});

gltfLoader.load("models/mountain_top/scene.gltf", (gltf) => {
  mountain_top = gltf.scene;
  const scaleFactor = 100; // Fator de escala desejado
  mountain_top.scale.set(scaleFactor + 30, scaleFactor, scaleFactor);

  mountain_top.position.x = 5;
  mountain_top.position.z = 200;
  mountain_top.position.y = -14;

  scene.add(mountain_top);
});

gltfLoader.load("models/mountain/scene.gltf", (gltf) => {
  mountain = gltf.scene;
  const scaleFactor = 100; // Fator de escala desejado
  mountain.scale.set(scaleFactor + 30, scaleFactor, scaleFactor);

  mountain.position.x = 198;
  mountain.position.z = -30;
  (mountain.position.y = -7), 2;
  mountain.rotation.y = Math.PI / 2;

  scene.add(mountain);
});

gltfLoader.load("models/mountain/scene.gltf", (gltf) => {
  mountain2 = gltf.scene;
  const scaleFactor = 100; // Fator de escala desejado
  mountain2.scale.set(scaleFactor + 30, scaleFactor, scaleFactor);

  mountain2.position.x = -198;
  mountain2.position.z = -30;
  (mountain2.position.y = -8), 5;
  mountain2.rotation.y = Math.PI / 2;

  scene.add(mountain2);
});

gltfLoader.load("models/pig/scene.gltf", (gltf) => {
  model = gltf.scene;

  const scaleFactor = 0.01; // Fator de escala desejado
  model.scale.set(scaleFactor, scaleFactor, scaleFactor);

  model.position.x = Math.random() * 200 - 100;
  model.position.z = Math.random() * 200 - 100;
  model.position.y = -3;
  scene.add(model);
  model.hitbox = new THREE.Box3().setFromObject(model);
});

gltfLoader.load("models/beach_house/scene.gltf", (gltf) => {
  const beach_house = gltf.scene;

  const scaleFactor = 0.5; // Fator de escala desejado
  beach_house.scale.set(scaleFactor, scaleFactor, scaleFactor);

  // Ajustar a posição da casa de praia
  beach_house.position.x = 90;
  beach_house.position.z = -100;
  beach_house.position.y = -2;

  scene.add(beach_house);
});

gltfLoader.load("models/knife/scene.gltf", (gltf) => {
  knife = gltf.scene; // Assign to the global variable instead of redeclaring

  const scaleFactor = 0.2; // Fator de escala desejado
  knife.scale.set(scaleFactor, scaleFactor, scaleFactor);
  knife.name = "Knife"; // Defina um nome para a faca

  knife.position.x = 0;
  knife.position.z = -100;
  knife.position.y = -2.9;
  scene.add(knife);

  knife.hitbox = new THREE.Box3().setFromObject(knife);
});

function checkSteakProximity() {
  if(steak){
    const steakDistance = player.position.distanceTo(knife.position);
    if(steakDistance < 2){
      steakNearby = true;
    }
  }else{
    steakNearby = false;
  }
}
function checkKnifeProximity() {
  const knifeDistance = player.position.distanceTo(knife.position);

  if (knifeDistance < 2 && !hasKnife) {
    // Defina o limite de proximidade como 2 unidades
    knifeNearby = true;
    // Exibir a frase na tela
    document.getElementById("interactionText").innerText = "Pegar faca - E";
  } else {
    knifeNearby = false;
    // Ocultar a frase da tela
    document.getElementById("interactionText").innerText = "";
  }
}

function dirtyKnife(knife) {
  knife.traverse((node) => {
    if (node.isMesh) {
      node.material.color.setHex(0xffd700); // Define a cor do material para uma cor suja
    }
  });
}

function cleanKnife(knife) {
  knife.traverse((node) => {
    if (node.isMesh) {
      node.material.color.setHex(0x808080); // Define a cor do material para cinza
    }
  });
}

function pickUpKnife() {
  if (knifeNearby) {
    hasKnife = true;
    console.log("Picked up knife");
  } else {
    console.log("Too far from the knife");
  }
}

function init() {
  // Criação da cena
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0xaaccff);

  // Configuração do renderizador
  renderer = new THREE.WebGLRenderer();
  renderer.setSize(window.innerWidth, window.innerHeight);
  document.body.appendChild(renderer.domElement);

  // Criação do jogador
  const playerGeometry = new THREE.SphereGeometry(1, 32, 32);
  const playerMaterial = new THREE.MeshBasicMaterial({ color: 0x000000 });
  player = new THREE.Mesh(playerGeometry, playerMaterial);
  player.position.set(0, -2, 0);
  scene.add(player);

  // Criação das câmeras
  cameraFPV = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
  );
  cameraFPV.position.set(0, 1, 0);
  cameraTPV = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
  );
  cameraTPV.position.set(0, 5, 5);
  cameraTPV.lookAt(player.position);
  activeCamera = cameraFPV;

  // Configuração dos controles
  orbitControls = new OrbitControls(cameraTPV, renderer.domElement);
  orbitControls.target.copy(player.position);

  pointerLockControls = new PointerLockControls(cameraFPV, document.body);

  // Adicionar evento de clique para ativar o PointerLockControls
  document.addEventListener(
    "click",
    function () {
      pointerLockControls.lock();
    },
    false
  );

  // Adicionar evento para lidar com o bloqueio do ponteiro
  pointerLockControls.addEventListener("lock", function () {
    pointerLockControls.enabled = true;
  });

  pointerLockControls.addEventListener("unlock", function () {
    pointerLockControls.enabled = false;
  });

  document.addEventListener(
    "keydown",
    function (event) {
      const speed = 1;
      const direction = new THREE.Vector3();

      cameraFPV.getWorldDirection(direction);

      const newPosition = player.position.clone();

      switch (event.code) {
        case "KeyW":
          newPosition.x += direction.x * speed;
          newPosition.z += direction.z * speed;
          break;
        case "KeyS":
          newPosition.x -= direction.x * speed;
          newPosition.z -= direction.z * speed;
          break;
        case "KeyA":
          newPosition.x += direction.z * speed;
          newPosition.z -= direction.x * speed;
          break;
        case "KeyD":
          newPosition.x -= direction.z * speed;
          newPosition.z += direction.x * speed;
          break;
        case "KeyC":
          activeCamera = activeCamera === cameraFPV ? cameraTPV : cameraFPV;
          break;
        case "KeyE":
          pickUpKnife(); // Chama a função para pegar a faca quando a tecla "E" é pressionada
          break;
        case "KeyG":
          if (hasKnife) {
            attack(); // Chama a função para atacar quando a tecla "G" é pressionada
          }
          break;
        case "KeyF":
          checkSteakProximity();
          if(steakNearby){
            health = 5;
            updateHealthUI();
            scene.remove(steak);
          }
          break;
      }

      const collision = trees.some(
        (tree) => tree.position.distanceTo(newPosition) < 1.5
      );

      if (!collision) {
        player.position.copy(newPosition);
      }
    },
    false
  );

  // Carregar a textura da areia
  const sandTexture = new THREE.TextureLoader().load(
    "textures/aerial_beach_03_diff_4k.jpg"
  );

  // Criação da praia
  const beachGeometry = new THREE.PlaneGeometry(200, 25);
  const beachMaterial = new THREE.MeshBasicMaterial({
    map: sandTexture,
    side: THREE.DoubleSide,
  });
  const beach = new THREE.Mesh(beachGeometry, beachMaterial);
  beach.rotation.x = Math.PI / 2;
  beach.position.y = -3;
  beach.position.z = -112.5;
  scene.add(beach);

  const params = {
    color: 0xadd8e6,
    scale: 30,
    flowX: 1,
    flowY: 1,
  };

  // Criação do mar;

  const waterGeometry = new THREE.PlaneGeometry(350, 75);
  water = new Water(waterGeometry, {
    color: params.color,
    scale: params.scale,
    flowDirection: new THREE.Vector2(params.flowX, params.flowY),
    textureWidth: 1024,
    textureHeight: 1024,
  });

  water.position.y = -3;
  water.position.z = -162.5;
  water.rotation.x = Math.PI * -0.5;
  scene.add(water);

  // Criação de uma textura para o tronco da árvore
  const trunkTexture = new THREE.TextureLoader().load(
    "textures/pine_bark_diff_4k.jpg"
  );

  // Criação de uma textura para as folhas da árvore
  const leavesTexture = new THREE.TextureLoader().load(
    "textures/leaves_forest_ground_diff_4k.jpg"
  );

  // Criação do material para o tronco e as folhas
  const trunkMaterial = new THREE.MeshPhongMaterial({ map: trunkTexture });
  const leavesMaterial = new THREE.MeshPhongMaterial({ map: leavesTexture });

  // Função para criar uma árvore
  function createTree() {
    const tree = new THREE.Group();

    // Criação do tronco
    const trunkHeight = Math.random() * 5 + 3;
    const trunkGeometry = new THREE.CylinderGeometry(
      Math.random() * 0.1 + 0.05,
      Math.random() * 0.1 + 0.05,
      trunkHeight
    );
    const trunk = new THREE.Mesh(trunkGeometry, trunkMaterial);
    tree.add(trunk);

    // Criação das folhas
    const leavesGeometry = new THREE.SphereGeometry(Math.random() * 1.2 + 0.6);
    const leaves = new THREE.Mesh(leavesGeometry, leavesMaterial);
    leaves.position.y = trunkGeometry.parameters.height / 2;
    tree.add(leaves);

    trees.push(tree);

    // Posicionar a árvore em cima do chão
    tree.position.y = -3 + trunkHeight / 2;

    return tree;
  }

  // Criação do sol
  const sunColor = 0xffffff;
  const sunIntensity = 1;
  sun = new THREE.DirectionalLight(sunColor, sunIntensity);
  sun.position.set(0, 200, -200);
  sun.castShadow = true;
  scene.add(sun);

  // Configuração das sombras
  sun.shadow.mapSize.width = 2048;
  sun.shadow.mapSize.height = 2048;
  sun.shadow.camera.near = 0.5;
  sun.shadow.camera.far = 150;
  const shadowCameraSize = 50;
  sun.shadow.camera.left = -shadowCameraSize;
  sun.shadow.camera.right = shadowCameraSize;
  sun.shadow.camera.top = shadowCameraSize;
  sun.shadow.camera.bottom = -shadowCameraSize;

  // Adiciona lens flare ao sol
  const textureLoader = new THREE.TextureLoader();
  const lensFlareTexture = textureLoader.load("textures/sun.jpg");

  const lensFlare = new THREE.SpriteMaterial({
    map: lensFlareTexture,
    color: sun.color,
    transparent: true,
    blending: THREE.AdditiveBlending,
  });

  const lensFlare1 = new THREE.Sprite(lensFlare);

  lensFlare1.scale.set(100, 100, 1);

  sun.add(lensFlare1);

  // Carregar a textura
  const groundTexture = new THREE.TextureLoader().load(
    "textures/forest_leaves_02_diffuse_4k.jpg"
  );

  // Criação do chão
  const groundGeometry = new THREE.PlaneGeometry(200, 200);
  const groundMaterial = new THREE.MeshBasicMaterial({
    map: groundTexture,
    side: THREE.DoubleSide,
  });
  const ground = new THREE.Mesh(groundGeometry, groundMaterial);
  ground.rotation.x = Math.PI / 2;
  ground.position.y = -3;
  scene.add(ground);

  let jungle = new THREE.Group();

  // Adição da exclusão para as árvores ao redor da casa de praia
  const exclusionZone = new THREE.Box3(
    new THREE.Vector3(85, -Infinity, -105), // min
    new THREE.Vector3(95, Infinity, -95) // max
  );

  // Criação da selva
  for (let i = 0; i < 1000; i++) {
    const tree = createTree();
    tree.position.x = Math.random() * 200 - 100;
    tree.position.z = Math.random() * 200 - 100;

    const treePosition = new THREE.Vector3(tree.position.x, 0, tree.position.z);

    if (!exclusionZone.containsPoint(treePosition)) {
      jungle.add(tree);
    }
  }

  // Adição da selva à cena
  scene.add(jungle);
}

function getBoundingBox(mesh) {
  const box = new THREE.Box3().setFromObject(mesh);
  return box;
}
let timeIncrement = 0.002; // Reduzir a velocidade do movimento do sol

function attack() {
  if (knife) {
    knife.rotation.set(-Math.PI / 2, 0, 0); // Define a rotação da faca para horizontal
    console.log("Atacou com a faca!");
  } else {
    console.log("A variável knife não está definida.");
  }
}

function animate() {
  updateHealthUI();
  requestAnimationFrame(animate);

  if (knife && model) {
    if (intersectionCount > 2) {
      steak.position.copy(model.position);
      scene.remove(model);
      document.getElementById("eatText").innerText = "Comer bife - F";
      intersectionCount = 0;

    } else {
      document.getElementById("eatText").innerText = "";
      // Verifique a interseção
      if (model.hitbox.intersectsBox(knife.hitbox)) {
        intersectionCount++;
        console.log("Intersection count:", intersectionCount);
      }
    }
    //Atualize as hitboxes
    model.hitbox.setFromObject(model);
    knife.hitbox.setFromObject(knife);
    checkKnifeProximity();
    const knifeObject = scene.getObjectByName("Knife");
    if (knifeObject) {
      const waterBox = getBoundingBox(water);
      const knifeBox = getBoundingBox(knifeObject);
      if (knifeBox && waterBox && !clean) {
        if (knifeBox.intersectsBox(waterBox)) {
          console.log("qw");
          clean = true;
          cleanKnife(knifeObject);
        } else {
          dirtyKnife(knifeObject);
        }
      }
    }
    if (objetoNaCena(model, scene)) {
      direction += (Math.random() - 0.5) * 0.5;

      model.position.x += Math.cos(direction) * speed;
      model.position.z += Math.sin(direction) * speed;

      const modelBox = getBoundingBox(model);

      for (let tree of trees) {
        const treeBox = getBoundingBox(tree);

        if (modelBox.intersectsBox(treeBox)) {
          direction += Math.PI * (Math.random() > 0.5 ? 1 : -1);
        }
      }
    }else if(!objetoNaCena(steak, scene)){
      model.position.x += Math.cos(direction) * speed;
      model.position.z += Math.sin(direction) * speed;
      scene.add(model)
    }


    if (hasKnife && pointerLockControls.isLocked) {
      const knifeOffset = new THREE.Vector3(0.2, -0.1, 1); // Ajuste conforme necessário
      const knifePosition = new THREE.Vector3();
      knifePosition
        .copy(cameraFPV.position)
        .add(
          cameraFPV.getWorldDirection(new THREE.Vector3()).multiplyScalar(1.5)
        )
        .add(knifeOffset);

      // Limitar a distância máxima entre a faca e a câmera
      const maxDistance = 1; // Defina o valor máximo de distância desejado
      const distance = knifePosition.distanceTo(cameraFPV.position);
      if (distance > maxDistance) {
        // Reduzir a distância da faca se estiver além do limite máximo
        const direction = new THREE.Vector3()
          .subVectors(knifePosition, cameraFPV.position)
          .normalize();
        knifePosition
          .copy(cameraFPV.position)
          .addScaledVector(direction, maxDistance);
      }

      knife.position.copy(knifePosition);

      // Ajustar a rotação da faca
      knife.rotation.set(
        Math.PI / 2, // Rotação em X conforme a câmera
        -Math.PI / 2, // Rotação em Y conforme a câmera
        0 // Rotação em Z conforme a câmera
      );
    }
  }

  if (pointerLockControls.isLocked) {
    player.rotation.y = cameraFPV.rotation.y;
  } else {
    orbitControls.target.copy(player.position);
    orbitControls.update();
  }

  cameraFPV.position.copy(player.position);
  cameraTPV.position.set(
    player.position.x,
    player.position.y + 4,
    player.position.z + 5
  );
  cameraTPV.lookAt(player.position);

  time += timeIncrement;

  let radius = 300;
  let centerX = 0;
  let centerY = 0;
  let centerZ = 0;
  sun.position.set(
    centerX + radius * Math.cos(time),
    centerY + radius * Math.sin(time),
    centerZ + radius * Math.sin(time)
  );

  let blueComponent = (Math.sin(time) + 1) / 2;
  blueComponent = 0.2 + 0.8 * blueComponent;

  const color = new THREE.Color(0, 0, blueComponent);
  scene.background = color;

  renderer.render(scene, activeCamera);
}

function reduceHealth() {
  if (health > 0) {
    health--; // Diminui a saúde
    updateHealthUI(); // Atualiza a UI da saúde
    if (health === 0) {
      // Trate a morte do jogador aqui
      console.log("O jogador morreu!");
      document.getElementById("deathOverlay").style.display = "flex"; // Mostra o overlay
      pointerLockControls.unlock(); // Libera o controle do ponteiro
    }
  }
}

function objetoNaCena(objeto, cena) {
  var objetosNaCena = cena.children; // Lista de objetos na cena
  
  // Verifica se o objeto está na lista de objetos da cena
  for (var i = 0; i < objetosNaCena.length; i++) {
      if (objetosNaCena[i] === objeto) {
          return true; // O objeto está na cena
      }
  }
  
  return false; // O objeto não está na cena
}

// Configura o intervalo para reduzir a saúde a cada 50 segundos
setInterval(reduceHealth, 50000);
init();
animate();
