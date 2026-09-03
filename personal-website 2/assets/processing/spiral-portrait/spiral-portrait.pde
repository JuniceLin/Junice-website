PImage img;
boolean form = false; // 默认使用线模式

void setup() {
  size(600, 800);
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
  float upperLimit = 200; // 增加上限
  float adjustedUpperLimit = 150; // 增加调整上限
  for (float t = 0; t <= upperLimit * TWO_PI; t += PI / 1000) { // 增加点的密度
    float x, y, r, period;
    x = map(t * cos(t), -1 * adjustedUpperLimit * TWO_PI, adjustedUpperLimit * TWO_PI, 0, width);
    y = map(t * sin(t), -1 * adjustedUpperLimit * TWO_PI, adjustedUpperLimit * TWO_PI, height, 0);
    color c = img.get(int(x), int(y));
    float rVal = red(c); // 移除动态效果
    float gVal = green(c);
    float bVal = blue(c);
    period = map(rVal + gVal + bVal, 0, 255 * 3, adj2, 0);
    r = t + pow(t, adj1) * sin(period * t) + 0.5 * sin(2 * t) + 0.2 * cos(3 * t);
    x = map(r * cos(t), -1 * adjustedUpperLimit * TWO_PI, adjustedUpperLimit * TWO_PI, 0, width) + random(-2, 2); // 添加随机偏移
    y = map(r * sin(t), -1 * adjustedUpperLimit * TWO_PI, adjustedUpperLimit * TWO_PI, height, 0) + random(-2, 2);
    if (x < 0 || x > width || y < 0 || y > height) {
      endShape(OPEN);
      beginShape();
    } else {
      if (form) {
        strokeWeight(1.2);
        stroke(rVal, gVal, bVal);
        point(x, y);
      } else {
        strokeWeight(0.3); // 更细的线条
        stroke(rVal, gVal, bVal);
        vertex(x, y);
      }
    }
  }
  endShape();
}

void mousePressed() {
  form = !form; // 切换模式
}
