let board; 
let boardWidth = 800;
let boardHeight = 300;
let context;

let playerWidth = 85;
let playerHeight = 85;
let playerX = 50;
let playerY = boardHeight - playerHeight;
let playerImgs = [];  // อาร์เรย์สำหรับเฟรมของ GIF
let damageImg;  // ภาพสำหรับสถานะอมตะ
let currentFrame = 0;
let frameRate = 200;  // เฟรมเรตในมิลลิวินาที (250ms = 4 เฟรมต่อวินาที)

let player = {
    x: playerX,
    y: playerY,
    width: playerWidth,
    height: playerHeight
};

let gameOver = false;
let score = 0;
let time = 0;

let boxImg;
let boxWidth = 40;
let boxHeight = 80;
let boxsArray = [];
let boxSpeed = -3.6;  // ปรับความเร็วของกล่องให้เพิ่มขึ้น 20%

let velocityY = 0;
let gravity = 0.3;

let nextBoxTime = 0;  // เวลาในการสร้างกล่องถัดไป

let lives = 3;  // จำนวนชีวิตเริ่มต้น
let invincible = false;  // สถานะอมตะ
let invincibleTime = 0;  // เวลาเริ่มต้นของอมตะ

window.onload = () => {
    board = document.getElementById('board');
    board.height = boardHeight;
    board.width = boardWidth;

    context = board.getContext("2d");

    // โหลดเฟรมของ GIF (2 เฟรม)
    for (let i = 0; i < 2; i++) {  // จำนวนเฟรมที่มีใน GIF
        let img = new Image();
        img.src = `tile00${i}.png`;  // ไฟล์ภาพแต่ละเฟรม
        img.onload = () => {
            console.log(`Frame ${i} loaded successfully`);
        };
        img.onerror = () => {
            console.error(`Failed to load frame ${i}`);
        };
        playerImgs.push(img);
    }

    // โหลดภาพ damage.png
    damageImg = new Image();
    damageImg.src = "damage.png";
    damageImg.onload = () => {
        console.log("Damage image loaded successfully");
    };
    damageImg.onerror = () => {
        console.error("Failed to load damage image");
    };

    requestAnimationFrame(update);

    document.addEventListener("keydown", movePlayer);

    boxImg = new Image();
    boxImg.src = "a3.png";
    boxImg.onload = () => {
        scheduleNextBox();  // เริ่มการสร้างกล่อง
    };
    boxImg.onerror = () => {
        console.error("Failed to load box image");
    };

    setInterval(() => { 
        if (!gameOver) {
            time++;
            if (time >= 60) {
                gameOver = true;
                showGameOver();  // ทำการแสดงสรุปคะแนนและเวลาที่หมดเวลา
            }
        }
    }, 1000);

    // เปลี่ยนเฟรม GIF
    setInterval(() => {
        if (!gameOver && !invincible) {
            currentFrame = (currentFrame + 1) % playerImgs.length;
        }
    }, frameRate);
};

function update() {
    requestAnimationFrame(update);

    if (gameOver) {
        showGameOver();
        return;
    }

    context.clearRect(0, 0, boardWidth, boardHeight);

    velocityY += gravity;
    player.y = Math.min(player.y + velocityY, boardHeight - playerHeight);

    // แสดงภาพของผู้เล่น
    if (invincible) {
        if (damageImg) {
            context.drawImage(damageImg, player.x, player.y, player.width, player.height);
        } else {
            console.error("Damage image is not loaded");
        }
    } else {
        if (playerImgs[currentFrame]) {
            context.drawImage(playerImgs[currentFrame], player.x, player.y, player.width, player.height);
        } else {
            console.error("Current frame is not loaded");
        }
    }

    for (let i = 0; i < boxsArray.length; i++) {
        let box = boxsArray[i];
        box.x += boxSpeed;
        context.drawImage(boxImg, box.x, box.y, box.width, box.height);

        if (detectCollision(player, box) && !invincible) {
            lives--;  // ลดจำนวนชีวิตเมื่อชนกล่อง
            if (lives < 0) {
                gameOver = true;
                showGameOver();  // แสดงสรุปคะแนนและเวลาที่หมดเวลา
            } else {
                // รีเซ็ตสถานะการเล่นหลังจากชนกล่อง
                resetPlayer();
                activateInvincibility();  // ทำให้ผู้เล่นอมตะ
            }
        }

        if (box.x + box.width < 0) {
            boxsArray.splice(i, 1);
            i--;
            score++;
        }
    }

    if (invincible) {
        if (Date.now() - invincibleTime > 750) {  // 0.75 วินาที
            invincible = false;
        }
    }

    context.font = "20px Arial";
    context.fillStyle = "black";
    context.fillText("Score: " + score, 100, 30);
    context.fillText("Time: " + time + "s", boardWidth - 100, 30);

    // แสดงข้อมูล debug กล่องถัดไปที่มุมขวาล่าง
    showDebugInfo();
    // แสดงข้อมูลชีวิตที่เหลือ
    showLives();
}

function movePlayer(e) {
    if (e.code === "ArrowUp" && player.y === boardHeight - playerHeight) {
        velocityY = -10;
    }
}

function createBox() {
    let box = {
        x: boardWidth,
        y: boardHeight - boxHeight,
        width: boxWidth,
        height: boxHeight
    };
    boxsArray.push(box);

    // สร้างกล่องถัดไปหลังจากเวลาที่สุ่ม
    scheduleNextBox();
}

function scheduleNextBox() {
    // สุ่มเวลาสำหรับการสร้างกล่องถัดไป (1.5 ถึง 4 วินาที)
    nextBoxTime = Math.random() * (4000 - 1500) + 1500;  // 1500ms ถึง 4000ms
    console.log(`Next box will appear in ${nextBoxTime / 1000} seconds`);  // Debug ข้อมูล
    setTimeout(createBox, nextBoxTime);
}

function detectCollision(player, box) {
    return player.x < box.x + box.width &&
           player.x + player.width > box.x &&
           player.y < box.y + box.height &&
           player.y + player.height > box.y;
}

function showDebugInfo() {
    context.font = "15px Arial";
    context.fillStyle = "blue";
    context.textAlign = "right";
    context.fillText(`Next box in: ${(nextBoxTime / 1000).toFixed(2)}s`, boardWidth - 10, boardHeight - 10);
    context.fillText(`Time left: ${60 - time}s`, boardWidth - 10, boardHeight - 30);  // แสดงเวลาที่เหลือ
}

function showLives() {
    context.font = "20px Arial";
    context.fillStyle = "red";
    context.textAlign = "left";
    context.fillText("Lives: " + lives, 20, 30);  // แสดงจำนวนชีวิตที่เหลือ
}

function showGameOver() {
    context.clearRect(0, 0, boardWidth, boardHeight);
    context.font = "40px Arial";
    context.fillStyle = "red";
    context.textAlign = "center";
    context.fillText("Game Over!!", boardWidth / 2, boardHeight / 2 - 20);
    context.font = "30px Arial";
    context.fillText("Score: " + score, boardWidth / 2, boardHeight / 2 + 20);
    context.fillText("Time: " + time + "s", boardWidth / 2, boardHeight / 2 + 60);
}

function resetPlayer() {
    player.y = boardHeight - playerHeight;
    velocityY = 0;
}

function activateInvincibility() {
    invincible = true;
    invincibleTime = Date.now();
}

function restartGame() {
    location.reload();
}
