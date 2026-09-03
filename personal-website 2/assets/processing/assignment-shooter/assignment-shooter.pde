float playerX, playerY;
float playerSpeed = 5;
ArrayList<PVector> bullets;
ArrayList<PVector> enemies;
ArrayList<PVector> enemyBullets;
ArrayList<PVector> ammoPickups;
int score = 0;
int highScore = 0;
int health = 5;
int ammo = 10;
boolean gameOver = false;
boolean levelPassed = false;
int currentLevel = 1;
int levelTime = 30;
int levelTarget = 10;
int startTime;
boolean isChallengeMode = false;
boolean isScoreMode = false;
boolean showMenu = true;
boolean showRules = false;
int countdownTimer = 0;
PImage backgroundImg;
PImage playerImg, enemyImg, bulletImg, enemyBulletImg, ammoImg;

float playerWidth = 70, playerHeight = 70;
float enemyWidth = 60, enemyHeight = 60;
float bulletWidth = 15, bulletHeight = 30;
float enemyBulletWidth = 15, enemyBulletHeight = 25;
float ammoWidth = 25, ammoHeight = 25;
import processing.sound.*;

SoundFile scoreSound; 
SoundFile hitSound;  

void setup() {
  size(800, 600);
  scoreSound = new SoundFile(this, "score.wav");
  hitSound = new SoundFile(this, "hit.wav");
  playerX = width / 2;
  playerY = height - 50;
  bullets = new ArrayList<PVector>();
  enemies = new ArrayList<PVector>();
  enemyBullets = new ArrayList<PVector>();
  ammoPickups = new ArrayList<PVector>();
  startTime = millis();

  backgroundImg = loadImage("background.jpg");
  playerImg = loadImage("player.png");
  enemyImg = loadImage("enemy.png");
  bulletImg = loadImage("bullet.png");
  enemyBulletImg = loadImage("enemyBullet.png");
  ammoImg = loadImage("ammo.png");
}

void draw() {
  image(backgroundImg, 0, 0, width, height);

  if (showMenu) {
    displayMenu();
  } else if (showRules) {
    displayRules();
  } else {
    if (!gameOver) {
      if (!levelPassed) {
        checkLevel();
      }
      movePlayer();
      drawPlayer();
      updateBullets();
      updateEnemies();
      updateEnemyBullets();
      updateAmmoPickups();
      checkCollisions();
      spawnEnemies();
      spawnEnemyBullets();
      spawnAmmoPickups();
      displayHUD();
    } else {
      displayGameOver();
    }
  }

  if (countdownTimer > 0) {
    countdownTimer--;
    if (countdownTimer == 0) {
      resetLevel();
    }
  }
}

void displayMenu() {
  fill(0, 0, 0, 200);
  rect(0, 0, width, height);

  fill(255);
  textSize(50);
  textAlign(CENTER, CENTER);
  text("Assignments Shooter", width / 2, height / 2 - 100);

  drawButton(width / 2 - 100, height / 2, 200, 50, "Challenge Mode", color(153, 178, 204));
  drawButton(width / 2 - 100, height / 2 + 80, 200, 50, "Score Mode", color(204, 153, 178));
}

void drawButton(float x, float y, float w, float h, String label, color btnColor) {
  fill(btnColor);
  rect(x, y, w, h, 10);

  fill(0);
  textSize(20);
  textAlign(CENTER, CENTER);
  text(label, x + w / 2, y + h / 2);

  if (mouseX > x && mouseX < x + w && mouseY > y && mouseY < y + h) {
    fill(255, 255, 255, 50);
    rect(x, y, w, h, 10);
  }
}

void displayRules() {
  fill(0, 0, 0, 200);
  rect(0, 0, width, height);

  fill(255);
  textSize(20);
  textAlign(CENTER, CENTER);
  if (isChallengeMode) {
    text("Challenge Mode Rules:\n- 5 Lives\n- 6 Levels\n- Complete objectives within time limits", width / 2, height / 2 - 50);
  } else if (isScoreMode) {
    text("Score Mode Rules:\n- 3 Lives\n- No time limit\n- Aim for the highest score", width / 2, height / 2 - 50);
  }

  drawButton(width / 2 - 100, height / 2 + 50, 200, 50, "Start Game", color(173, 192, 171));
}

void mousePressed() {
  if (showMenu) {
    if (mouseX > width / 2 - 100 && mouseX < width / 2 + 100 && mouseY > height / 2 && mouseY < height / 2 + 50) {
      showMenu = false;
      showRules = true;
      isChallengeMode = true;
      isScoreMode = false;
      health = 5;
    }
    if (mouseX > width / 2 - 100 && mouseX < width / 2 + 100 && mouseY > height / 2 + 80 && mouseY < height / 2 + 130) {
      showMenu = false;
      showRules = true;
      isScoreMode = true;
      isChallengeMode = false;
      health = 3;
    }
  } else if (showRules) {
    if (mouseX > width / 2 - 100 && mouseX < width / 2 + 100 && mouseY > height / 2 + 50 && mouseY < height / 2 + 100) {
      showRules = false;
      resetGame();
    }
  } else if (gameOver) {
    if (mouseX > width / 2 - 100 && mouseX < width / 2 + 100 && mouseY > height / 2 + 120 && mouseY < height / 2 + 170) {
      resetGame();
    }
    if (mouseX > width / 2 - 100 && mouseX < width / 2 + 100 && mouseY > height / 2 + 180 && mouseY < height / 2 + 230) {
      showMenu = true;
      gameOver = false;
      resetGame();
    }
  }
}
void checkLevel() {
  int elapsedTime = (millis() - startTime) / 1000;
  if (isChallengeMode && elapsedTime >= levelTime) {
    if (score >= levelTarget) {
      levelPassed = true;
      countdownTimer = 180;
    } else {
      gameOver = true;
    }
  }
}

void resetLevel() {
  bullets.clear();
  enemies.clear();
  enemyBullets.clear();
  ammoPickups.clear();
  playerX = width / 2;
  playerY = height - 50;
  startTime = millis();
  levelPassed = false;

  if (isChallengeMode) {
    if (currentLevel == 1) {
      levelTarget = 10;
      levelTime = 30;
    } else if (currentLevel == 2) {
      levelTarget = 30;
      levelTime = 40;
    } else {
      levelTarget += 20;
      levelTime = 30;
    }
    currentLevel++;
  }
}

void movePlayer() {
  if (keyPressed) {
    if (keyCode == LEFT || key == 'a') playerX -= playerSpeed;
    if (keyCode == RIGHT || key == 'd') playerX += playerSpeed;
    if (keyCode == UP || key == 'w') playerY -= playerSpeed;
    if (keyCode == DOWN || key == 's') playerY += playerSpeed;
  }
  playerX = constrain(playerX, 0, width - playerWidth);
  playerY = constrain(playerY, 0, height - playerHeight);
}

void drawPlayer() {
  image(playerImg, playerX, playerY, playerWidth, playerHeight);
}

void keyPressed() {
  if (key == ' ' && ammo > 0) {
    bullets.add(new PVector(playerX + playerWidth / 2 - bulletWidth / 2, playerY));
    ammo--;
  }
  if (gameOver && key == 'r') {
    resetGame();
  }
}

void updateBullets() {
  for (int i = bullets.size() - 1; i >= 0; i--) {
    PVector bullet = bullets.get(i);
    bullet.y -= 10;
    image(bulletImg, bullet.x, bullet.y, bulletWidth, bulletHeight);
    if (bullet.y < 0) {
      bullets.remove(i);
    }
  }
}

void spawnEnemies() {
  int spawnRate = 60;
  if (currentLevel >= 2) spawnRate = 50;

  if (frameCount % spawnRate == 0) {
    float x = random(width - enemyWidth);
    float y = -enemyHeight;
    enemies.add(new PVector(x, y));
  }
}

void updateEnemies() {
  for (int i = enemies.size() - 1; i >= 0; i--) {
    PVector enemy = enemies.get(i);
    enemy.y += 2;
    image(enemyImg, enemy.x, enemy.y, enemyWidth, enemyHeight);
    if (enemy.y > height) {
      enemies.remove(i);
    }
  }
}

void spawnEnemyBullets() {
  for (PVector enemy : enemies) {
    if (random(1) < 0.01) {
      enemyBullets.add(new PVector(enemy.x + enemyWidth / 2 - enemyBulletWidth / 2, enemy.y + enemyHeight));
    }
  }
}

void updateEnemyBullets() {
  for (int i = enemyBullets.size() - 1; i >= 0; i--) {
    PVector bullet = enemyBullets.get(i);
    bullet.y += 5;
    image(enemyBulletImg, bullet.x, bullet.y, enemyBulletWidth, enemyBulletHeight);
    if (bullet.y > height) {
      enemyBullets.remove(i);
    }
  }
}

void spawnAmmoPickups() {
  if (frameCount % 200 == 0) {
    float x = random(width - ammoWidth);
    float y = random(height - ammoHeight);
    ammoPickups.add(new PVector(x, y));
  }
}

void updateAmmoPickups() {
  for (int i = ammoPickups.size() - 1; i >= 0; i--) {
    PVector ammoPickup = ammoPickups.get(i);
    image(ammoImg, ammoPickup.x, ammoPickup.y, ammoWidth, ammoHeight);
    if (dist(ammoPickup.x + ammoWidth / 2, ammoPickup.y + ammoHeight / 2, playerX + playerWidth / 2, playerY + playerHeight / 2) < (playerWidth + ammoWidth) / 2) {
      ammoPickups.remove(i);
      ammo += 5;
    }
  }
}

void checkCollisions() {
  for (int i = bullets.size() - 1; i >= 0; i--) {
    PVector bullet = bullets.get(i);
    for (int j = enemies.size() - 1; j >= 0; j--) {
      PVector enemy = enemies.get(j);
      if (dist(bullet.x + bulletWidth / 2, bullet.y + bulletHeight / 2, enemy.x + enemyWidth / 2, enemy.y + enemyHeight / 2) < (bulletWidth + enemyWidth) / 2) {
        bullets.remove(i);
        enemies.remove(j);
        score++;
        if (score > highScore) {
          highScore = score;
        }
        scoreSound.play(); 
        break;
      }
    }
  }

  for (int i = enemyBullets.size() - 1; i >= 0; i--) {
    PVector bullet = enemyBullets.get(i);
    if (dist(bullet.x + enemyBulletWidth / 2, bullet.y + enemyBulletHeight / 2, playerX + playerWidth / 2, playerY + playerHeight / 2) < (enemyBulletWidth + playerWidth) / 2) {
      enemyBullets.remove(i);
      health--;
      hitSound.play(); 
      if (health <= 0) {
        gameOver = true;
      }
    }
  }
}

void displayHUD() {
  fill(255);
  textSize(16);
  text("Score: " + score, 20, 20);
  text("Health: " + health, 20, 40);
  text("Ammo: " + ammo, 20, 60);
  text("High Score: " + highScore, 20, 80);

  if (isChallengeMode) {
    int elapsedTime = (millis() - startTime) / 1000;
    int remainingTime = levelTime - elapsedTime;
    text("Level: " + currentLevel, width - 100, 20);
    text("Time: " + remainingTime, width - 100, 40);
    text("Target: " + levelTarget, width - 100, 60);
  }

  if (levelPassed) {
    textSize(40);
    textAlign(CENTER, CENTER);
    text("Level Passed!", width / 2, height / 2);
    textSize(20);
    text("Next level in: " + (countdownTimer / 60), width / 2, height / 2 + 50);
  }
}

void displayGameOver() {
  fill (255);
  textSize(40);
  textAlign(CENTER, CENTER);
  text("Game Over", width / 2, height / 2);
  textSize(20);
  text("Score: " + score, width / 2, height / 2 + 50);
  text("High Score: " + highScore, width / 2, height / 2 + 80);


  fill(255);
  textSize(50);
  textAlign(CENTER, CENTER);
  text("Assignments Shooter", width / 2, height / 2 - 100);

  drawButton(width / 2 - 100, height / 2 + 120, 200, 50, "Restart", color(153, 178, 204));
  drawButton(width / 2 - 100, height / 2 + 200, 200, 50, "Main  Menu", color(204, 153, 178));
}

void resetGame() {
  gameOver = false;
  levelPassed = false;
  currentLevel = 1;
  score = 0;
  ammo = 10;
  bullets.clear();
  enemies.clear();
  enemyBullets.clear();
  ammoPickups.clear();
  playerX = width / 2;
  playerY = height - 50;
  startTime = millis();

  if (isChallengeMode) {
    health = 5;
  } else if (isScoreMode) {
    health = 3;
  }

  resetLevel();
}
