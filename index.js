const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');

const map = new Image();
map.src = './img/map.png';

const playerSprite = new Image();
playerSprite.src = './img/player.png'; 

let startTime = Date.now(); 
let time = 0; 

const tileSize = 32; 
const mapWidth = 100; // ancho de tiles del mapa
const mapHeight = 100; 

const ambientSound = new Audio('./audio/ambient.mp3'); 
ambientSound.loop = true; 
ambientSound.volume = 0.5; 

const collisionMap = getCollisionMap(); // De array a Matriz
const tileDimensions = { x: 0, y: 0, width: tileSize, height: tileSize };
const symbolSolidObjects = {
    561: 'wall',
};

function getCollisionMap() { // De array de tiles solidos a Matriz
    const collisionMap = [];
    for (let i = 0; i < mapHeight; i++) {
        const row = [];
        for (let j = 0; j < mapWidth; j++) {
            row.push(collisions[i * mapWidth + j]);
        }
        collisionMap.push(row);
    }
    return collisionMap;
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
            if (symbolSolidObjects[tileValue]) {
                tileDimensions.x = tileX * tileSize;
                tileDimensions.y = tileY * tileSize;
                if (isRectCollision({ x, y, width, height }, tileDimensions)) {
                    return symbolSolidObjects[tileValue]; 
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
function drawTime() {
    ctx.font = '20px Arial';
    ctx.fillStyle = 'white';
    const formattedTime = formatTime(time);
    ctx.fillText('T i e m p o: ' + formattedTime, 10, 30);
}


class Player {
    constructor(x, y, width, height, image, speed) {
        this.health = 3;
        this.score = 0;

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

        const collisionType = isCollisionWithObject(newHitBoxX, newHitBoxY, this.hitbox.width, this.hitbox.height);
        if (!collisionType ) { 
            this.x = newX;
            this.y = newY;
            this.hitbox.x = this.x + 36;
            this.hitbox.y = this.y + 30;
        }

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

const input = {};
window.addEventListener('keydown', (e) => {
    input[e.key] = true;
});
window.addEventListener('keyup', (e) => {
    delete input[e.key];
});

const player = new Player(350, 350, 96, 96, playerSprite, 1); 

let camX = player.x - canvas.width / 2 + player.width / 2;
let camY = player.y - canvas.height / 2 + player.height / 2;

function update() {
    // Limpiar
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Mapa
    ctx.drawImage(map, -camX, -camY);   
    //tiempo
    time = Math.floor((Date.now() - startTime) / 1000); 
    drawTime();
    // Jugador
    player.move(input);

    // Mover camara
    camX = player.x - canvas.width / 2 + player.width / 2;
    camY = player.y - canvas.height / 2 + player.height / 2;

    player.draw(camX, camY);
    // Ver hitbox
    ctx.beginPath();
    ctx.rect(player.hitbox.x - camX, player.hitbox.y - camY, player.hitbox.width, player.hitbox.height);
    ctx.stroke();

    requestAnimationFrame(update);
}

map.onload = () => {
    update();
    //ambientSound.play();
};
