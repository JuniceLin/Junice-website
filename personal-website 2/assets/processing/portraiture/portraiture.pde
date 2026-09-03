PImage img;
boolean form = true;

void setup() {
  size(800, 800);
  background(255);
  smooth(200);
  img = loadImage("image.jpg");
  img.resize(width, height);
}

void draw() {
  background(255);
  beginShape();
  noFill();
  stroke(0);
  float adj1 = map(mouseX + mouseY, 0, width + height, 0, 0.55);
  float adj2 = 0.02;
  float upperLimit = 100;
  float adjustedUpperLimit = 70;
  for (float t = 0; t <= upperLimit * TWO_PI; t += PI / 400) {
    float x, y, r, period;
    x = map(t * cos(t), -1 * adjustedUpperLimit * TWO_PI, adjustedUpperLimit * TWO_PI, 0, width);
    y = map(t * sin(t), -1 * adjustedUpperLimit * TWO_PI, adjustedUpperLimit * TWO_PI, height, 0);
    color c = img.get(int(x), int(y));
    float rVal = red(c) * sin(frameCount * 0.01);
    float gVal = green(c) * cos(frameCount * 0.01);
    float bVal = blue(c) * sin(frameCount * 0.02);
    period = map(rVal + gVal + bVal, 0, 255 * 3, adj2, 0);
    r = t + pow(t, adj1) * sin(period * t) + 0.5 * sin(2 * t) + 0.2 * cos(3 * t);
    x = map(r * cos(t), -1 * adjustedUpperLimit * TWO_PI, adjustedUpperLimit * TWO_PI, 0, width);
    y = map(r * sin(t), -1 * adjustedUpperLimit * TWO_PI, adjustedUpperLimit * TWO_PI, height, 0);
    if (x < 0 || x > width || y < 0 || y > height) {
      endShape(OPEN);
      beginShape();
    } else {
      if (form) {
        strokeWeight(1.2);
        stroke(rVal, gVal, bVal);
        point(x, y);
      } else {
        strokeWeight(0.6);
        stroke(rVal, gVal, bVal);
        vertex(x, y);
      }
    }
  }
  endShape();
}

void mousePressed() {
  form = !form;
}
