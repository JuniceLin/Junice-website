int density = 42;
float seed = 0.2;

void setup() {
  size(960, 640);
  smooth();
}

void draw() {
  background(255);
  stroke(16);
  strokeWeight(1);
  noFill();

  float centerX = width / 2.0;
  float centerY = height / 2.0;
  float minSide = min(width, height);

  for (int i = 0; i < density; i++) {
    float angle = (float(i) / density) * TWO_PI + frameCount * 0.009 + seed;
    float wobble = sin(frameCount * 0.018 + i * 0.72 + seed) * minSide * 0.07;
    float radius = minSide * (0.12 + float(i) / density * 0.42) + wobble;
    float x = centerX + cos(angle) * radius;
    float y = centerY + sin(angle * 1.4) * radius * 0.62;

    ellipse(x, y, 10 + (i % 9) * 2, 10 + (i % 9) * 2);
    line(centerX, centerY, x, y);
  }

  fill(16);
  noStroke();
  rect(22, 22, 78, 22);
  fill(255);
  text("RUNNING", 32, 37);
}

void mousePressed() {
  seed = random(1000);
}
