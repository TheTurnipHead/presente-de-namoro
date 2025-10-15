// ====================================================================
// VARIÁVEIS E CONFIGURAÇÕES DO JOGO
// ====================================================================
const player = document.getElementById('player');
const container = document.getElementById('game-container');
const dialogBox = document.getElementById('dialog-box');
const dialogText = document.getElementById('dialog-text');
const pokeballs = document.querySelectorAll('.pokeball'); 
// Variáveis de elementos (serão atribuídas em DOMContentLoaded)
let bedObject;
let npcYou;
let shelfObject;
let bigShelfObject;
let presentDisplay;
let rugMini;
let hasPlayedMusic = false;
const dialogCloseButton = document.getElementById('dialog-close');
 
// CONFIGURAÇÕES GERAIS
const SPEED = 1.5; 
const TILE_SIZE = 16; 
const WIDTH = container.clientWidth;
const HEIGHT = container.clientHeight;

// Posição inicial do Personagem (Lembre-se de ajustar esses valores se quiser outro ponto de partida)
let playerX = parseInt(player.style.left) || 250; 
let playerY = parseInt(player.style.top) || 670;

// Variáveis de estado
const keys = {};
let isMoving = false; 
let currentInteractionTarget = null;
let npcDialogueStep = 0;
let shouldTriggerClose = false;

// Diálogos do NPC (Você!)
const NPC_DIALOGUE = [
    "Bem-vinda, Meu Amor! O seus presentes estão nas Pokébolas. Você é livre para escolher o seu inicial, ou melhor, o seu presente!",
    "Antes que pergunte, sim! Sou um rockeiro aqui também hehehe.",
    "Assim como já foi citado na cartinha, isso aqui é um complemento especial que me dediquei a fazer.",
    "Sei que somos apaixonados por pokémon, e nada mais fofo e genial do que seu namorado recriar uma fase do nosso jogo favorito.",
    "MAS VOLTANDO AO ASSUNTO...",
    "Cada uma delas representa algo que eu escolhi pensando com muito carinho em você. Boa sorte!",
];
const NPC_DIALOGUE_FINAL = [
    "Uau! Você escolheu todos eles! Viu só? Eu disse que seria uma grande aventura!",
    "Espero que tenha gostado das minhas escolhas e, mais importante, de todo o carinho que coloquei neste presente.",
    "Agora, a aventura no quarto acabou, mas nossa aventura real continua! Use o tapete da porta quando quiser sair.",
    "Eu te amo muito, Meu Dengo!",
];

// CONFIGURAÇÃO DO SPRITE
const FRAME_SIZE = 96; // Tamanho em pixels de um único frame (96px para escala 3x)

// Mapeamento de Posição (em pixels da sprite sheet)
const SPRITE_POSITIONS = {
    'down': 0 * FRAME_SIZE,  
    'left': 1 * FRAME_SIZE,  
    'right': 2 * FRAME_SIZE, 
    'up': 3 * FRAME_SIZE     
};

let currentDirection = 'down'; // Direção inicial

function getRandomDirection() {
    const directions = ['up', 'down', 'left', 'right', 'idle'];
    // Reduzimos a chance de 'idle' ou de virar a cada frame
    return directions[Math.floor(Math.random() * directions.length)];
}

// ====================================================================
// FUNÇÕES AUXILIARES
// ====================================================================



function areAllPokeballsOpened() {
    // Checa se CADA pokébola TEM a classe 'opened'.
    const openedCount = Array.from(pokeballs).filter(pokeball => 
        pokeball.classList.contains('opened')
    ).length;

    return openedCount === pokeballs.length;
}

function closeInteraction() {
    // Esta função será chamada após o toque final.
    if (!dialogBox.classList.contains('hidden')) {
        closeDialog(); // Chama o fechamento de limpeza
        return true;  // Indica que uma interação foi finalizada
    }
    return false; // Nenhuma interação estava ativa
}

function getPresentAsset(pokeballId) {
    // Mapeamento dos assets de presente
    const assetMap = {
        'pokeball-1': 'roupas.png', 
        'pokeball-2': 'quadro.png',
        'pokeball-3': 'acessorios.png'
    };
    return assetMap[pokeballId] || 'present_sprite.png'; 
}

function closeDialog() {
    dialogBox.classList.add('hidden');
    presentDisplay.classList.add('hidden');
    currentInteractionTarget = null; 
}

function updatePlayerSprite(dirX, dirY) {
    // 1. DEFINE A NOVA DIREÇÃO BASEADO NO INPUT
    if (dirY === 1) {
        currentDirection = 'down';
    } else if (dirY === -1) {
        currentDirection = 'up';
    } else if (dirX === -1) {
        currentDirection = 'left';
    } else if (dirX === 1) {
        currentDirection = 'right';
    }
    
    let backgroundY = SPRITE_POSITIONS[currentDirection];
    let animationFrameX = 0; 

    // 2. DEFINE O FRAME DE ANIMAÇÃO
    if (isMoving) {
        animationFrameX = (Math.floor(Date.now() / 150) % 3) * FRAME_SIZE; 
    } else {
        animationFrameX = 0;
    }

    // 3. APLICA A MUDANÇA
    player.style.backgroundPosition = `-${animationFrameX}px -${backgroundY}px`;
}


function updatePlayerPosition() {
    // 1. BLOQUEIO DE MOVIMENTO
    if (!dialogBox.classList.contains('hidden')) {
        isMoving = false;
        return; 
    }
    
    let newX = playerX;
    let newY = playerY;
    
    isMoving = false; 
    let directionY = 0; 
    let directionX = 0; 

    // 2. LÓGICA DE MOVIMENTO
    if (keys['ArrowUp'] || keys['w']) {
        newY -= SPEED; isMoving = true; directionY = -1;
    }
    if (keys['ArrowDown'] || keys['s']) {
        newY += SPEED; isMoving = true; directionY = 1;
    }
    if (keys['ArrowLeft'] || keys['a']) {
        newX -= SPEED; isMoving = true; directionX = -1;
    }
    if (keys['ArrowRight'] || keys['d']) {
        newX += SPEED; isMoving = true; directionX = 1;
    }

    // 3. LÓGICA DE COLISÃO COM AS BORDAS
    const playerSize = player.clientWidth;
    if (newX < 0) newX = 0;
    if (newX > WIDTH - playerSize) newX = WIDTH - playerSize;
    if (newY < 64) newY = 64; 
    const dialogHeight = dialogBox.clientHeight;
    if (newY > HEIGHT - playerSize - dialogHeight) newY = HEIGHT - playerSize - dialogHeight;

    let proposedX = newX;
    let proposedY = newY;

    // Colisão com Objetos
    if (checkCollision(proposedX, playerY, false)) { newX = playerX; } else { newX = proposedX; }
    if (checkCollision(playerX, proposedY, false)) { newY = playerY; } else { newY = proposedY; }

    // 4. ATUALIZAÇÃO FINAL
    playerX = newX;
    playerY = newY;
    player.style.left = `${playerX}px`;
    player.style.top = `${playerY}px`;
    updatePlayerSprite(directionX, directionY);
}

// ====================================================================
// FUNÇÃO DE COLISÃO
// ====================================================================
function checkCollision(newX, newY) {

    const playerSize = player.clientWidth;

    let collision = false;

   

    // NOVO: HITBOX REDUZIDA DO PERSONAGEM (Apenas a área dos pés)

    const PLAYER_HITBOX_HEIGHT = 32;

    const PLAYER_HITBOX_WIDTH = 64;  

    const playerHitboxOffsetX = (playerSize - PLAYER_HITBOX_WIDTH) / 2;

    const playerHitboxOffsetY = playerSize - PLAYER_HITBOX_HEIGHT;



    const playerHBX = newX + playerHitboxOffsetX;

    const playerHBY = newY + playerHitboxOffsetY;

    const playerHBW = PLAYER_HITBOX_WIDTH;

    const playerHBH = PLAYER_HITBOX_HEIGHT;



    const collidableObjects = [...pokeballs, bedObject, npcYou, shelfObject, bigShelfObject].filter(el => el != null);



    collidableObjects.forEach(object => {

        if (!object || collision) return;

       

        const objectX = object.getBoundingClientRect().left - container.getBoundingClientRect().left;

        const objectY = object.getBoundingClientRect().top - container.getBoundingClientRect().top;

        const objectWidth = object.clientWidth;

        const objectHeight = object.clientHeight;



        let hitboxTop = objectY;

        let hitboxHeight = objectHeight;

        let hitboxLeft = objectX;

        let hitboxWidth = objectWidth;

       

        // --- Lógica da Cama ---

        if (object.id === 'bed-object') {

            const UNCOLLIDABLE_FRONT_BED = 100;

            hitboxTop = objectY;

            hitboxHeight = objectHeight - UNCOLLIDABLE_FRONT_BED;

        }

        // --- Lógica da Estante Pequena ---

        else if (object.id === 'shelf-object') {

            hitboxTop = objectY;

            hitboxHeight = objectHeight;

        }

        // --- Lógica da Estante Grande/Armário ---

        else if (object.id === 'big-shelf-object') {

            const UNCOLLIDABLE_FRONT_SHELF = 96;

            hitboxTop = objectY;

            hitboxHeight = objectHeight - UNCOLLIDABLE_FRONT_SHELF;

        }

       

        // Lógica de Colisão Retangular (AABB)

        if (

            playerHBX < hitboxLeft + hitboxWidth &&

            playerHBX + playerHBW > hitboxLeft &&  

            playerHBY < hitboxTop + hitboxHeight &&

            playerHBY + playerHBH > hitboxTop      

        ) {

            collision = true;

        }

    });



    if (playerHBY < 64) {

        collision = true;

    }

   

    return collision;

}



function checkForInteraction() {
    // Proximidade Segura: Aumentei um pouco o raio máximo para garantir o NPC, mas ele não será o único critério.
    const MAX_PROXIMITY = 100;

    // Raio de Proximidade das Pokébolas (menor)
    const POKEBALL_PROXIMITY = 75;

    let closestTarget = null;
    let minDistance = Infinity;

    const playerCenter = {
        x: playerX + (player.clientWidth / 2),
        y: playerY + (player.clientHeight / 2)
    };

    // NÃO resetamos o currentInteractionTarget aqui, fazemos isso só no closeDialog()

    const interactableTargets = [...pokeballs, npcYou, rugMini].filter(el => el != null);

    interactableTargets.forEach((target) => {
        const rect = target.getBoundingClientRect();
        const containerRect = container.getBoundingClientRect();
        const targetX = rect.left - containerRect.left;
        const targetY = rect.top - containerRect.top;
        const targetCenter = {
            x: targetX + (target.clientWidth / 2),
            y: targetY + (target.clientHeight / 2)
        };
        const distance = Math.sqrt(
            Math.pow(playerCenter.x - targetCenter.x, 2) +
            Math.pow(playerCenter.y - targetCenter.y, 2)
        );

        let allowedDistance = MAX_PROXIMITY;
        if (target.id.startsWith('pokeball-')) {
            allowedDistance = POKEBALL_PROXIMITY;
        }

        if (distance < allowedDistance && distance < minDistance) {
            minDistance = distance;
            closestTarget = target;
        }
    });

    // --- Processamento do Alvo Mais Próximo ---
    // <<<<<<<<<<<< A LÓGICA FOI REORGANIZADA AQUI EMBAIXO >>>>>>>>>>>>
    
    // 1. Só fazemos algo SE um alvo foi encontrado
    if (closestTarget) {
        const target = closestTarget; 
        
        // Bloqueia movimento e abre a caixa de diálogo
        keys['ArrowUp'] = keys['w'] = keys['ArrowDown'] = keys['s'] = keys['ArrowLeft'] = keys['a'] = keys['ArrowRight'] = keys['d'] = false;
        dialogBox.classList.remove('hidden');
        
        if (target.id === 'rug-mini') {
        dialogText.textContent = "Deseja realmente sair do quarto? [Enter] para Sair / [ESC] para Continuar.";
        currentInteractionTarget = 'CONFIRM_EXIT'; // NOVO ESTADO
        return; // Encerra a checagem, pois a interação com o tapete é a prioridade
    }
        // 1. Verificamos o TIPO de alvo
        if (target.id === 'npc-you') {
            // LÓGICA DO NPC (AQUI ESTÁ A CORREÇÃO DE ESTRUTURA)
            
            if (areAllPokeballsOpened()) {
                // Se todas estiverem abertas: DIÁLOGO FINAL
                dialogText.textContent = NPC_DIALOGUE_FINAL[0];
                currentInteractionTarget = 'NPC_CONVERSATION_FINAL'; 
                npcDialogueStep = 1;
            } else {
                // Se ainda houver presentes fechados: DIÁLOGO INICIAL
                dialogText.textContent = NPC_DIALOGUE[0];
                currentInteractionTarget = 'NPC_CONVERSATION';
                npcDialogueStep = 1;
            }

        } else if (target.classList.contains('pokeball')) {
            // LÓGICA DA POKÉBOLA (Permanece igual)

            if (target.classList.contains('opened')) {
                // LÓGICA DA POKÉBOLA JÁ ABERTA
                dialogText.textContent = "Você já pegou este presente.";
                currentInteractionTarget = 'INFO_ONLY'; 

            } else {
                // LÓGICA DA POKÉBOLA FECHADA
                const presentMessages = {
                    'pokeball-1': "Você escolheu a Pokébola 1! São suas ROUPAS! Combina perfeitamente com você!",
                    'pokeball-2': "Você escolheu a Pokébola 2! É o QUADRO! Uma lembrança para guardar no coração!",
                    'pokeball-3': "Você escolheu a Pokébola 3! É o ACESSÓRIO! Tão brilhante quanto você!"
                };
                
                dialogText.textContent = presentMessages[target.id] || "Você encontrou uma Pokébola!";
                presentDisplay.style.backgroundImage = `url('../assets/${getPresentAsset(target.id)}')`;
                currentInteractionTarget = target; // O alvo é o próprio elemento
            }
        }
    }
}


// ====================================================================
// LOOP PRINCIPAL E EVENTOS DE TECLADO
// ====================================================================

function gameLoop() {
    updatePlayerPosition();
    requestAnimationFrame(gameLoop); // Otimiza animação
}


document.addEventListener('keydown', (e) => {
    const key = e.key.toLowerCase();
    
    // Evita o scroll padrão do navegador
    if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright', ' ', 'enter', 'z', 'x'].includes(key)) {
        e.preventDefault();
    }
    
    keys[e.key] = true;
    keys[key] = true; 
});

document.addEventListener('keyup', (e) => {

    if (!hasPlayedMusic) {
        const musicPlayer = document.getElementById('background-music');
        musicPlayer.volume = 0.4; // Define um volume suave (ajuste se necessário)
        musicPlayer.play().then(() => {
            hasPlayedMusic = true;
        }).catch(error => {
            console.error("Autoplay bloqueado. A música não iniciou.", error);
            hasPlayedMusic = true; // Define como true para não tentar tocar novamente
        });
    }

    const key = e.key.toLowerCase();

    // Array de teclas de interesse para o jogo
    const gameKeys = ['arrowup', 'arrowdown', 'arrowleft', 'arrowright', ' ', 'enter', 'z', 'x'];

    // Evita o scroll padrão do navegador para as teclas do jogo
    if (gameKeys.includes(key)) {
        e.preventDefault();
    }

    // Atualiza o estado da tecla (assumindo que há um 'keydown' listener em outro lugar)
    if (keys.hasOwnProperty(e.key)) {
        keys[e.key] = false;
    }
    if (keys.hasOwnProperty(key)) {
        keys[key] = false;
    }

    if (currentInteractionTarget === 'CONFIRM_EXIT') {
        if (e.key === 'Escape') {
            // Se apertar ESC: Cancela a saída e fecha o diálogo.
            closeDialog(); 
            return;
        } else if (e.key === 'Enter') {
            // Se apertar ENTER: Redireciona para a página principal.
            window.location.href = 'index.html'; // CORREÇÃO: Redireciona
            return;
        }
    }

    // Lógica de Interação: Z ou Enter
    if (key === 'z' || key === 'enter') {

        // --- CASO 1: A caixa de diálogo NÃO está visível ---
        // O jogador está tentando iniciar uma nova interação.
        if (dialogBox.classList.contains('hidden')) {
            checkForInteraction();
            return; // Encerra a função aqui, pois a ação deste toque já foi concluída.
        }

        // --- CASO 2: A caixa de diálogo JÁ está visível ---
        // O jogador está progredindo em uma interação existente.

        // Lógica de avanço do diálogo do NPC
            if (currentInteractionTarget === 'NPC_CONVERSATION') {
                if (npcDialogueStep < NPC_DIALOGUE.length) {
                    // Avança para a próxima linha de diálogo
                    dialogText.textContent = NPC_DIALOGUE[npcDialogueStep];
                    npcDialogueStep++;
                    return; // Retorna para manter o diálogo aberto
                } else {
                    // O diálogo terminou, então fecha tudo.
                    closeDialog();
                    return;
                }
            } 
            
            // 2. NOVO: LÓGICA DO DIÁLOGO FINAL (PÓS-PRESENTES)
            else if (currentInteractionTarget === 'NPC_CONVERSATION_FINAL') {
                if (npcDialogueStep < NPC_DIALOGUE_FINAL.length) { // Usa o NOVO array
                    // Avança para a próxima linha de diálogo
                    dialogText.textContent = NPC_DIALOGUE_FINAL[npcDialogueStep];
                    npcDialogueStep++;
                    return; // Retorna para manter o diálogo aberto
                } else {
                    // O diálogo FINAL terminou, então fecha tudo.
                    closeDialog();
                    return;
                }
            }

        // Lógica de revelação da Pokébola (interação tem um alvo e ainda não foi 'aberta')
        // Usamos 'instanceof Element' para garantir que não é a string 'REVEALED'
        else if (currentInteractionTarget instanceof Element && !currentInteractionTarget.classList.contains('opened')) {
            // Aplica a classe que muda o sprite (Pokébola aberta)
            currentInteractionTarget.classList.add('opened');
            presentDisplay.classList.remove('hidden'); // Mostra o presente

            // Atualiza o texto e o estado da interação
            dialogText.textContent = "Você encontrou o presente! Pressione Enter para guardar.";
            currentInteractionTarget = 'REVEALED'; // MUDANÇA DE ESTADO
            return; // Mantém tudo aberto, esperando o próximo toque.
        }

        // Lógica de fechamento PÓS-REVELAÇÃO
        else if (currentInteractionTarget === 'INFO_ONLY' || currentInteractionTarget === 'REVEALED') {
            // O presente foi revelado e o usuário aperta Z/Enter novamente:
            // CHAMADA DIRETA: Em vez de apenas setar uma flag, chamamos a função de fechar imediatamente.
            closeDialog();
            // currentInteractionTarget será resetado dentro de closeDialog()
            return;
        } else {
            checkForInteraction();
        }
    }
});


document.addEventListener('DOMContentLoaded', () => {
    // 1. ATRIBUIÇÃO TARDIA: Elementos agora existem e são atribuídos corretamente
    bedObject = document.getElementById('bed-object');
    npcYou = document.getElementById('npc-you');
    shelfObject = document.getElementById('shelf-object');
    bigShelfObject = document.getElementById('big-shelf-object');
    presentDisplay = document.getElementById('present-display');
    rugMini = document.getElementById('rug-mini');
    gameLoop(); 
});