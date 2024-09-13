const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');

const map = new Image();
map.src = './img/map.png'; 


function update() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(map, -450, -400);
    requestAnimationFrame(update);
}


map.onload = () => {
    update();
};
