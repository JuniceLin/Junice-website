int tileSize=20;
color pixelColor;
PImage Image;

void setup() {
  size(800, 800);
  Image=loadImage("image.jpg");
  Image.resize(width, height);
  image(Image, 0, 0);
}

void draw() {
  if (mousePressed) {
    if (mouseButton == CENTER) {
      image(Image, 0, 0, width, height);
    }
    if (mouseButton == LEFT) {
      for (int i = 0; i < width; i += 48) {
        for (int j = 0; j < height; j += 48) {
          image(makeTile(Image.get(mouseX, mouseY, 48, 48)), i, j);
        }
      }
    }
    if (mouseButton == RIGHT) {
      for (int i = 0; i < width; i += tileSize) {
        for (int j = 0; j < height; j += tileSize) {
          image(makeTile(Image.get(i, j, tileSize, tileSize)), i, j);
        }
      }
    }
  }
}

PImage makeTile(PImage outputImage) {
  for (int i=0; i<=outputImage.width/2; i++) {
    for (int j=0; j<=outputImage.height/2; j++) {
      pixelColor = outputImage.get(i, j);
      outputImage.set(i, j, pixelColor);
      outputImage.set(outputImage.width-i, j, pixelColor);
      outputImage.set(i, outputImage.height-j, pixelColor);
      outputImage.set(outputImage.width-i, outputImage.height-j, pixelColor);
    }
  }
  return outputImage;
}

void keyPressed() {
  if (key == CODED) {
    if (keyCode == UP) {
      tileSize += 8;
      for (int i=0; i<width; i+=tileSize) {
        for (int j=0; j<height; j+=tileSize) {
          image(makeTile(Image.get(i, j, tileSize, tileSize)), i, j);
        }
      }
    }
    if (keyCode == DOWN) {
      tileSize -= 8;
      for (int i=0; i<width; i+=tileSize) {
        for (int j=0; j<height; j+=tileSize) {
          image(makeTile(Image.get(i, j, tileSize, tileSize)), i, j);
        }
      }
    }
  }
}
