class Key {
    constructor(x, y, width, height, image) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.image = image;
        this.isCollected = false;
        this.frameX = 0;
        this.frameCount = 0;
        this.maxFrame = 4; 
    }

    draw(camX, camY) {
        if (!this.isCollected) {
            this.frameCount++;
            if (this.frameCount > 15) { 
                this.frameX++;
                if (this.frameX >= this.maxFrame) this.frameX = 0;
                this.frameCount = 0;
            }
            ctx.drawImage(
                this.image,
                this.frameX * this.width, 0, this.width, this.height, 
                this.x - camX, this.y - camY, this.width, this.height
            );
        }
    }

    collect() {
        this.isCollected = true;
    }
}
