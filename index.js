const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');

const map = new Image();
map.src = './img/map.png';

const playerSprite = new Image();
playerSprite.src = './img/player.png'; 

const tileSize = 32; 
const mapWidth = 100; // ancho de tiles del mapa
const mapHeight = 100; 

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
            if (this.direction === 'up') this.frameY = 2;
            if (this.direction === 'left') this.frameY = 1;  
        } else if (this.status === 'move') {
            if (this.direction === 'down') this.frameY = 3;
            if (this.direction === 'right') this.frameY = 4;
            if (this.direction === 'up') this.frameY = 5;
            if (this.direction === 'left') this.frameY = 4; 
        }

        const drawX = this.x - camX;
        const drawY = this.y - camY;

        // En el sprite no viene las imagenes de la direccion izquierda, asi que las volteo aqui
        if (this.direction === 'left') {
            ctx.save();
            ctx.scale(-1, 1);
            ctx.drawImage(
                this.image,
                this.frameX * this.width, this.frameY * this.height, this.width, this.height,
                -drawX - this.width, drawY, this.width, this.height  
            );
            ctx.restore();
        } else {
            ctx.drawImage(
                this.image,
                this.frameX * this.width, this.frameY * this.height, this.width, this.height,
                drawX, drawY, this.width, this.height
            );
        }
    }

    move(input) {
        let newHitBoxX = this.hitbox.x;
        let newHitBoxY = this.hitbox.y;
        let newX = this.x;
        let newY = this.y;

        // Movimiento del jugador
        if (input['ArrowUp'] || input['w']) {
            newHitBoxY -= this.speed;
            newY -= this.speed;
            this.direction = 'up';
            this.status = 'move';
        } else if (input['ArrowDown'] || input['s']) {
            newHitBoxY += this.speed;
            newY += this.speed;
            this.direction = 'down';
            this.status = 'move';
        } else if (input['ArrowLeft'] || input['a']) {
            newHitBoxX -= this.speed;
            newX -= this.speed;
            this.direction = 'left';
            this.status = 'move';
        } else if (input['ArrowRight'] || input['d']) {
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
};
