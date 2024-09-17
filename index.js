const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');

//Imagenes
const map = new Image();
map.src = './img/map.png';

const playerSprite = new Image();
playerSprite.src = './img/player.png'; 

const keySprite = new Image();
keySprite.src = './img/key.png'; 

const spikeSprite = new Image();
spikeSprite.src = './img/spike.png'; 

const startImage = new Image();
startImage.src = './img/start.png';

const gameOverImage = new Image();
gameOverImage.src = './img/gameOver.png';

const winImage = new Image();
winImage.src = './img/win.png';

const heartImage = new Image();
heartImage.src = './img/heart.png';

const keyImage = new Image();
keyImage.src = './img/barKey.png';

//Sonido
const ambientSound = new Audio('./audio/ambient.mp3'); 
ambientSound.loop = true; 
ambientSound.volume = 0.5; 

const winSound = new Audio('./audio/win.mp3');
winSound.volume = 0.5;

const hurtSound = new Audio('./audio/hurt.mp3');
hurtSound.volume = 0.5;

const keySound = new Audio('./audio/key.mp3');
keySound.volume = 0.5;

const JAJASound = new Audio('./audio/gameOver.mp3');
JAJASound.volume = 0.5;

let startTime = Date.now(); 
let time = 0; 
let won=false;

const tileSize = 48; 
const mapWidth = 130; // ancho de tiles del mapa
const mapHeight = 130; 
const collisionMap = getCollisionMap(); // De array a Matriz
const tileDimensions = { x: 0, y: 0, width: tileSize, height: tileSize };
let keys = []; 
let spikes=[];
let gameState = 'start'; 

const symbolSolidObjects = {
    561: 'wall',
    2684355121:'wall',
    1356:'spikes',
    663:'key',
    662:'door',
};
const input = {};
window.addEventListener('keydown', (e) => {
    input[e.key] = true;

    if (e.key === 'Enter') {
        if (gameState === 'start' || gameState === 'won' || gameState === 'gameOver') {
            resetGame();
        }
    }
});

window.addEventListener('keyup', (e) => {
    delete input[e.key];
});
/*
function drawCollisions(camX, camY) {
    for (let y = 0; y < mapHeight; y++) {
        for (let x = 0; x < mapWidth; x++) {
            const tileValue = collisionMap[y][x];
            if (symbolSolidObjects[tileValue]) {
                // Coordenadas del tile en la pantalla
                const drawX = x * tileSize - camX;
                const drawY = y * tileSize - camY;

                // Dibujar un rectángulo rojo en los tiles con colisión
                ctx.fillStyle = 'rgba(255, 0, 0, 0.5)'; // Rojo semi-transparente
                ctx.fillRect(drawX, drawY, tileSize, tileSize);
            }
        }
    }
}*/


function resetGame() {
    keys = []; 
    spikes=[];
    player.health = 3;
    player.haskey = false;
    player.x = 3200;
    player.y = 4200;
    gameState = 'playing';
    won = false;
    gameOver = false;
    startTime = Date.now(); 
    generateItems();
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    winSound.pause();
    winSound.currentTime = 0;
    ambientSound.play();

}
function isRectCollision(rect1, rect2) {
    return rect1.x < rect2.x + rect2.width &&
           rect1.x + rect1.width > rect2.x &&
           rect1.y < rect2.y + rect2.height &&
           rect1.y + rect1.height > rect2.y;
}

function isCollisionWithObject(x, y, width, height) {
    const isCollisionWithTile = (playerX, playerY) => {
        const tileX = Math.floor(playerX / tileSize);
        const tileY = Math.floor(playerY / tileSize);
        
        if (tileX >= 0 && tileX < mapWidth && tileY >= 0 && tileY < mapHeight) {
            const tileValue = collisionMap[tileY][tileX];
            const objectType = symbolSolidObjects[tileValue];
            if (objectType) {
                tileDimensions.x = tileX * tileSize;
                tileDimensions.y = tileY * tileSize;
                if (isRectCollision({ x, y, width, height }, tileDimensions)) {

                    return objectType; 
                }
            }
        }
        return null;
    };
    // verificar tambien las esquinas 
    return isCollisionWithTile(x, y) ||
           isCollisionWithTile(x + width, y) ||
           isCollisionWithTile(x, y + height) ||
           isCollisionWithTile(x + width, y + height);
}

function formatTime(seconds) {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}


function generateItems() { 
    for (let i = 0; i < mapHeight; i++) {
        for (let j = 0; j < mapWidth; j++) {
            const tileValue = collisionMap[i][j];
            if (tileValue === 663) { //  llave
                keys.push(new Key(j * tileSize,i * tileSize,tileSize,tileSize,keySprite));
            }
            if (tileValue === 1356) { //  spike
                spikes.push({ x: j * tileSize, y: i * tileSize, width: tileSize, height: tileSize });
            }
        }
    }
}
function drawSpikes(camX, camY) {
    spikes.forEach(spike => {
        ctx.drawImage(
            spikeSprite,  
            spike.x - camX, spike.y - camY,  
            spike.width, spike.height  
        );
    });
}

function drawKeys(camX, camY) {
    keys.forEach((key) => {
            key.draw(camX, camY);
    });
}

class Player {
    constructor(x, y, width, height, image, speed) {
        this.health = 3;
        this.score = 0;
        this.lastDamageTime = 0; 
        this.damageCooldown = 1000;
        //Atributos de movimiento
        this.x = x;
        this.y = y;
        this.speed = speed;
        this.width = width;  
        this.height = height;   
        this.image = image;
        this.direction = 'down';  
        this.status = 'idle'; // idle, move, attack, death
        this.frameX = 0;
        this.frameY = 0;
        this.frameCount = 0;
        this.maxFrame = 6;
        this.hitbox = {
            x: this.x + 36,
            y: this.y + 30,
            width: 24,
            height: 35
        };
        this.haskey=false;
    }

    // pintar en base a la fila de la imagen del sprite del jugador
    draw(camX, camY) {
        if (this.status === 'idle') {
            if (this.direction === 'down') this.frameY = 0;
            if (this.direction === 'right') this.frameY = 1;
            if (this.direction === 'up') this.frameY = 3;
            if (this.direction === 'left') this.frameY = 2;  
        } else if (this.status === 'move') {
            if (this.direction === 'down') this.frameY = 4;
            if (this.direction === 'right') this.frameY = 5;
            if (this.direction === 'up') this.frameY = 7;
            if (this.direction === 'left') this.frameY = 6; 
        }
        else if (this.status === 'death') {
            if (this.direction === 'down') this.frameY = 12;
            if (this.direction === 'right') this.frameY = 12;
            if (this.direction === 'up') this.frameY = 12;
            if (this.direction === 'left') this.frameY = 12; 
        }

        const drawX = this.x - camX;
        const drawY = this.y - camY;

        ctx.drawImage(
            this.image,
            this.frameX * this.width, this.frameY * this.height, this.width, this.height,
            drawX, drawY, this.width, this.height
        );
    }

    move(input) {
        let newHitBoxX = this.hitbox.x;
        let newHitBoxY = this.hitbox.y;
        let newX = this.x;
        let newY = this.y;

        // Movimiento del jugador
        if (input['ArrowUp'] || input['w']|| input['W']) {
            newHitBoxY -= this.speed;
            newY -= this.speed;
            this.direction = 'up';
            this.status = 'move';
        } else if (input['ArrowDown'] || input['s']|| input['S']) {
            newHitBoxY += this.speed;
            newY += this.speed;
            this.direction = 'down';
            this.status = 'move';
        } else if (input['ArrowLeft'] || input['a']|| input['A']) {
            newHitBoxX -= this.speed;
            newX -= this.speed;
            this.direction = 'left';
            this.status = 'move';
        } else if (input['ArrowRight'] || input['d']|| input['D']) {
            newHitBoxX += this.speed;
            newX += this.speed;
            this.direction = 'right';
            this.status = 'move';
        } else {
            this.status = 'idle';
        }
        const currentTime = Date.now();
        
        const collisionType = isCollisionWithObject(newHitBoxX, newHitBoxY, this.hitbox.width, this.hitbox.height);
        if (!collisionType || collisionType === 'spikes'|| collisionType === 'key'|| collisionType === 'door') {
            this.x = newX;
            this.y = newY;
            this.hitbox.x = this.x + 36;
            this.hitbox.y = this.y + 30;

            // Mecanica de los picos
            if (collisionType === 'spikes' && currentTime - this.lastDamageTime > this.damageCooldown && this.health > 0) {
                this.health -= 1;
                this.lastDamageTime = currentTime;
                hurtSound.play(); 
                
            }
            if (this.health === 0) {
                gameState = 'gameOver';
                ambientSound.pause(); 
                JAJASound.play();
            }



            // Mecanica de la salida
            if (collisionType === 'door') {
                if (player.haskey){
                    won=true;
                    gameState='won';
                }
            }
            
        }
        // Mecanica de la llave
        keys.forEach(key => {
            if (!key.isCollected) {
                if (isRectCollision(this.hitbox, key)) {
                    this.haskey=true;
                    keySound.play()
                    key.collect(); 
                }
            }
        });
        this.updateAnimation();
    }

    updateAnimation() {
        this.frameCount++;
        if (this.frameCount > 30) {  
            this.frameX++;
            if (this.frameX >= this.maxFrame) this.frameX = 0;
            this.frameCount = 0;
        }
    }
}



const player = new Player(3200, 4200, 96, 96, playerSprite, 3); 

let camX = player.x - canvas.width / 2 + player.width / 2;
let camY = player.y - canvas.height / 2 + player.height / 2;

function drawStartScreen() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(startImage, 0, 0, canvas.width, canvas.height);
}

function drawGameOverScreen() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(gameOverImage, 0, 0, canvas.width, canvas.height);
}

function drawWinScreen() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(winImage, 0, 0, canvas.width, canvas.height);
}

function drawStatusBar() {
    const barHeight = 50; 
    const barY = canvas.height - barHeight; 
    const heartSize = 30; 
    const keySize = 30; 
    ctx.fillStyle = 'black';
    ctx.fillRect(0, barY, canvas.width, barHeight);
    // vida
    for (let i = 0; i < player.health; i++) {
        ctx.drawImage(heartImage, 10 + i * (heartSize + 10), barY + 10, heartSize, heartSize);
    }
    // llave
    if (player.haskey) {
        ctx.drawImage(keyImage, canvas.width - keySize - 10, barY + 10, keySize, keySize);
    }

    //tiempo
    ctx.font = '20px Arial';
    ctx.fillStyle = 'white';
    const formattedTime = formatTime(time);
    ctx.fillText('T i e m p o: ' + formattedTime, 200,canvas.width/2+255 );
    console.log(formattedTime)
    
}
function update() {
    
    if (gameState === 'start') {
         winSound.pause();
        drawStartScreen();
        
    }

    if (gameState === 'gameOver') {
        // winSound.pause();
        // ambientSound.pause();
        
        drawGameOverScreen();
        
    }

    if (gameState === 'won') {
         ambientSound.pause();
         winSound.play();
        drawWinScreen();
        
    }
    if (gameState === 'playing') {
        ambientSound.play();
        
        // Limpiar
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Mapa
        ctx.drawImage(map, -camX, -camY);   
        //drawCollisions(camX, camY);

        // Dibujar objetos
        drawKeys(camX, camY);
        drawSpikes(camX, camY);

        //tiempo
        time = Math.floor((Date.now() - startTime) / 1000); 

        // Jugador
        player.move(input);

        // Mover camara
        camX = player.x - canvas.width / 2 + player.width / 2;
        camY = player.y - canvas.height / 2 + player.height / 2;

        player.draw(camX, camY);

        
        drawStatusBar();
    }

    requestAnimationFrame(update);
}


let imagesLoaded = 0;
const totalImages = 5; 

map.onload = checkAllImagesLoaded;
playerSprite.onload = checkAllImagesLoaded;
keySprite.onload = checkAllImagesLoaded;
spikeSprite.onload = checkAllImagesLoaded;
startImage.onload = checkAllImagesLoaded;

function checkAllImagesLoaded() {
    imagesLoaded++;
    if (imagesLoaded === totalImages) {
        generateItems();
        update();
    }
}
