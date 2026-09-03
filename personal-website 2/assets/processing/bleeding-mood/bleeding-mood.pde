int gridSize = 50; 
int numCols, numRows; 
ArrayList<PatternModule> modules; 

void setup() {
  size(1300, 800);
  numCols = width / gridSize;
  numRows = height / gridSize;
  modules = new ArrayList<PatternModule>();
  initModules();
}

void draw() {
  background(15); 
  for (PatternModule module : modules) {
    module.display();
    module.update(); 
  }
}

void initModules() {
 
  boolean[][] bloodPattern = new boolean[numRows][numCols];
  String blood = "BLOOD";
  int charWidth = blood.length() * 5;  
  int startCol = (numCols - charWidth) / 2;  
  int startRow = numRows / 2 - 3;  


  for (int i = 0; i < blood.length(); i++) {
    char c = blood.charAt(i);
    switch (c) {
      case 'B':
        fillBloodPattern(bloodPattern, startCol + i * 5, startRow, 'B');
        break;
      case 'L':
        fillBloodPattern(bloodPattern, startCol + i * 5, startRow, 'L');
        break;
      case 'O':
        fillBloodPattern(bloodPattern, startCol + i * 5, startRow, 'O');
        break;
      case 'D':
        fillBloodPattern(bloodPattern, startCol + i * 5, startRow, 'D');
        break;
    }
  }


  for (int i = 0; i < numCols; i++) {
    for (int j = 0; j < numRows; j++) {
      if (bloodPattern[j][i]) {
        modules.add(new EyeModule(i * gridSize, j * gridSize, gridSize));
      } else {
        int moduleType = int(random(2)); 
        switch (moduleType) {
          case 0:
            modules.add(new DropModule(i * gridSize, j * gridSize, gridSize));
            break;
          case 1:
            modules.add(new HeartModule(i * gridSize, j * gridSize, gridSize));
            break;
        }
      }
    }
  }
}

void fillBloodPattern(boolean[][] pattern, int startCol, int startRow, char c) {
  if (c == 'B') {
    
    setPatternValue(pattern, startRow, startCol + 2);
    setPatternValue(pattern, startRow, startCol + 3);
    setPatternValue(pattern, startRow, startCol + 1);
    setPatternValue(pattern, startRow + 1, startCol );
    setPatternValue(pattern, startRow + 2, startCol );
    setPatternValue(pattern, startRow + 3, startCol );
    setPatternValue(pattern, startRow + 4, startCol );
    setPatternValue(pattern, startRow , startCol );
    setPatternValue(pattern, startRow + 5, startCol );
    setPatternValue(pattern, startRow + 5, startCol + 1);
    setPatternValue(pattern, startRow + 1, startCol + 4);
    setPatternValue(pattern, startRow + 2, startCol + 3);
    setPatternValue(pattern, startRow + 2, startCol + 4);
    setPatternValue(pattern, startRow + 3, startCol + 3);
    setPatternValue(pattern, startRow + 5, startCol + 3);
    setPatternValue(pattern, startRow + 4, startCol + 4);
    
    setPatternValue(pattern, startRow + 5, startCol + 2);
  }

  else if (c == 'L') {
    setPatternValue(pattern, startRow, startCol);
    setPatternValue(pattern, startRow + 1, startCol);
    setPatternValue(pattern, startRow + 2, startCol);
    setPatternValue(pattern, startRow + 3, startCol);
    setPatternValue(pattern, startRow + 4, startCol);
    setPatternValue(pattern, startRow + 5, startCol);
    setPatternValue(pattern, startRow + 5, startCol + 1);
    setPatternValue(pattern, startRow + 5, startCol + 2);
    setPatternValue(pattern, startRow + 5, startCol + 3);
    setPatternValue(pattern, startRow + 5, startCol + 4);
  }

  else if (c == 'O') {
    setPatternValue(pattern, startRow, startCol + 1);
    setPatternValue(pattern, startRow, startCol + 2);
    setPatternValue(pattern, startRow, startCol + 3);
    setPatternValue(pattern, startRow + 1, startCol);
    setPatternValue(pattern, startRow + 1, startCol + 4);
    setPatternValue(pattern, startRow + 2, startCol);
    setPatternValue(pattern, startRow + 2, startCol + 4);
    setPatternValue(pattern, startRow + 3, startCol);
    setPatternValue(pattern, startRow + 3, startCol + 4);
    setPatternValue(pattern, startRow + 4, startCol + 1);
    setPatternValue(pattern, startRow + 4, startCol + 2);
    setPatternValue(pattern, startRow + 4, startCol + 3);
    setPatternValue(pattern, startRow + 5, startCol + 1);
    setPatternValue(pattern, startRow + 5, startCol + 2);
    setPatternValue(pattern, startRow + 5, startCol + 3);
  }

  else if (c == 'D') {
    setPatternValue(pattern, startRow, startCol + 1);
    setPatternValue(pattern, startRow, startCol );
    setPatternValue(pattern, startRow, startCol + 2);
    setPatternValue(pattern, startRow, startCol + 3);
    setPatternValue(pattern, startRow + 1, startCol);
    setPatternValue(pattern, startRow + 1, startCol + 4);
    setPatternValue(pattern, startRow + 2, startCol);
    setPatternValue(pattern, startRow + 2, startCol + 4);
    setPatternValue(pattern, startRow + 3, startCol);
    setPatternValue(pattern, startRow + 3, startCol + 4);
    setPatternValue(pattern, startRow + 4, startCol);
    setPatternValue(pattern, startRow + 4, startCol + 1);
    setPatternValue(pattern, startRow + 4, startCol + 2);
    setPatternValue(pattern, startRow + 4, startCol + 3);
    setPatternValue(pattern, startRow + 5, startCol );
    setPatternValue(pattern, startRow + 5, startCol + 1);
    setPatternValue(pattern, startRow + 5, startCol + 2);
    setPatternValue(pattern, startRow + 5, startCol + 3);
    
  }
}

void setPatternValue(boolean[][] pattern, int row, int col) {
  if (row >= 0 && row < pattern.length && col >= 0 && col < pattern[0].length) {
    pattern[row][col] = true;
  }
}


abstract class PatternModule {
  float x, y, size;

  PatternModule(float x, float y, float size) {
    this.x = x;
    this.y = y;
    this.size = size;
  }

  abstract void display();
  abstract void update();
}

class EyeModule extends PatternModule {
  boolean isHovered;

  EyeModule(float x, float y, float size) {
    super(x, y, size);
    isHovered = false;
  }

  void display() {

    noStroke();
    fill(240);
    ellipse(x + size / 2, y + size / 2, size * 1.3, size * 0.77);


    if (isHovered) {
      fill(15, 20, 60); 
    } else {
      fill(128, 0, 0); 
    }
    ellipse(x + size / 2, y + size / 2, size / 2, size / 1.5);

  
    stroke(0);
    strokeWeight(2);
    noFill();
    arc(x + size / 2, y + size / 2, size * 1, size * 0.8, PI, TWO_PI); 
    arc(x + size / 2, y + size / 2, size * 1, size * 0.8, 0, PI); 
  }

  void update() {
    if (mouseX > x && mouseX < x + size && mouseY > y && mouseY < y + size) {
      isHovered = true;
    } else {
      isHovered = false;
    }
  }
}


class DropModule extends PatternModule {
  float speed;

  DropModule(float x, float y, float size) {
    super(x, y, size);
    speed = random(1, 3); 
  }

  void display() {
    noStroke();
    fill(128, 0, 0); 
    beginShape();
   
    vertex(x + size / 2, y + size); 
   
    bezierVertex(x + size * 0.85, y + size * 0.8, x + size * 0.6, y + size * 0.2, x + size / 2, y + size * 0.1);

    bezierVertex(x + size * 0.4, y + size * 0.2, x + size * 0.15, y + size * 0.8, x + size / 2, y + size);
    endShape(CLOSE);
  }

  void update() {
    y += speed; 
    if (y > height) {
      y = -size; 
    }
  }
}


class HeartModule extends PatternModule {
  boolean isHovered;
  boolean isBroken;

  HeartModule(float x, float y, float size) {
    super(x, y, size);
    isHovered = false;
    isBroken = false;
  }

  void display() {
    
    if (isHovered) {
      fill(255, 0, 0);  
    } else {
      fill(104, 15, 36);  
    }
    noStroke();  

    if (isBroken) {
      drawBrokenHeart();
    } else {
      drawCompleteHeart();
    }
  }

  void drawCompleteHeart() {
    beginShape();  
    vertex(x + size / 2, y); 

  
    bezierVertex(x + size * 0.9, y - size * 0.5, x + 1.1 * size, y + size * 0.3, x + size / 2, y + size * 0.6);

    vertex(x + size / 2, y + size * 0.6);
  
    bezierVertex(x - size * 0.1, y + size * 0.3, x + size * 0.1, y - size * 0.5, x + size / 2, y); 
    endShape(CLOSE);  
  }

  void drawBrokenHeart() {
    noStroke(); 
    fill(255, 0, 0);  

    beginShape(); 
    vertex(x + size / 2 - size * 0.05, y + size * 0.4); 
    bezierVertex(x + size * 0.3, y, x + size * 0.1, y + size * 0.4, x + size * 0.35, y + size * 0.8); 
    bezierVertex(x + size * 0.4, y + size * 0.9, x + size / 2 - size * 0.1, y + size * 0.9, x + size / 2 - size * 0.05, y + size * 0.4); 
    endShape(); 

    
    beginShape(); 
    vertex(x + size / 2 + size * 0.05, y + size * 0.4);  
    bezierVertex(x + size * 0.7, y, x + size * 0.9, y + size * 0.4, x + size * 0.65, y + size * 0.8); 
    bezierVertex(x + size * 0.6, y + size * 0.9, x + size / 2 + size * 0.1, y + size * 0.9, x + size / 2 + size * 0.05, y + size * 0.4); 
    endShape(); 
  }

  void update() {
    if (mouseX > x && mouseX < x + size && mouseY > y && mouseY < y + size) {
      isHovered = true;
      if (mousePressed) {
        isBroken = true;  
      }
    } else {
      isHovered = false;
    }
  }
}
