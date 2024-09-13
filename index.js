const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');

const map = new Image();
map.src = './img/map.png';

const playerSprite = new Image();
playerSprite.src = './img/player.png'; 

class Player {
    constructor(x, y, ancho, alto, image, speed) {
        this.health = 3;
        this.score = 0;

        //Atributos de movimiento
        this.x = x;
        this.y = y;
        this.speed = speed;
        this.ancho = ancho;  
        this.alto = alto;   
        this.image = image;
        this.direction = 'down';  
        this.status = 'idle'; // idle, move, attack, death
        this.frameX = 0;
        this.frameY = 0;
        this.frameCount = 0;
        this.maxFrame = 6; 
        
    }
    // pintar en base a la fila de la imagen del sprite del jugador
    draw() {
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

        // En el sprite no viene las imagenes de la direccion izquierda, asi que las volteo aqui
        if (this.direction === 'left') {
            ctx.save();
            ctx.scale(-1, 1); 
            ctx.drawImage(
                this.image,
                this.frameX * this.ancho, this.frameY * this.alto, this.ancho, this.alto,
                -this.x - this.ancho, this.y, this.ancho, this.alto  
            );
            ctx.restore();
        } else {
            ctx.drawImage(
                this.image,
                this.frameX * this.ancho, this.frameY * this.alto, this.ancho, this.alto,
                this.x, this.y, this.ancho, this.alto
            );
        }
    }

    move(input) {
        if (input['ArrowUp'] || input['w']) {
            this.y -= this.speed;
            this.direction = 'up';
            this.status = 'move';
        } else if (input['ArrowDown'] || input['s']) {
            this.y += this.speed;
            this.direction = 'down';
            this.status = 'move';
        } else if (input['ArrowLeft'] || input['a']) {
            this.x -= this.speed;
            this.direction = 'left';
            this.status = 'move';
        } else if (input['ArrowRight'] || input['d']) {
            this.x += this.speed;
            this.direction = 'right';
            this.status = 'move';
        } else {
            this.status = 'idle';  
        }
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

const player = new Player(150, 200, 96, 96, playerSprite, 1); 

function update() {
    // Limpiar
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Mapa
    ctx.drawImage(map, -200, -100);

    // Jugador
    player.move(input);
    player.updateAnimation();
    player.draw();

    requestAnimationFrame(update);
}

map.onload = () => {
    update();
};
