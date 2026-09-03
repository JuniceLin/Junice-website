import processing.data.Table;
import processing.data.TableRow;

Table lionData;
float lionWidth, lionHeight;
int page = 0;
int lionsPerPage = 35;
Lion[] lions;
boolean[] isMouseOver;

void setup() {
    size(1400, 1000);
    background(220);
    lionData = loadTable("cars.csv", "header");
    lionWidth = width / 7;
    lionHeight = height / 5;
    drawLions();
}

void draw() {
    drawLions();
    for (int i = 0; i < lions.length; i++) {
        if (lions[i] != null) {
            isMouseOver[i] = lions[i].isMouseOver(mouseX, mouseY);
            lions[i].update(isMouseOver[i]);
            lions[i].draw();
            if (isMouseOver[i]) {
                lions[i].showDetailsNearby(mouseX, mouseY);
            }
        }
    }
}

void mousePressed() {
    page++;
    if (page * lionsPerPage >= lionData.getRowCount()) {
        page = 0;
    }
    drawLions();
}

void drawLions() {
    background(220);
    int startIndex = page * lionsPerPage;
    int endIndex = min(startIndex + lionsPerPage, lionData.getRowCount());
    lions = new Lion[endIndex - startIndex];
    isMouseOver = new boolean[endIndex - startIndex];
    int index = startIndex;
    for (int i = 0; i < 7; i++) {
        for (int j = 0; j < 5; j++) {
            if (index >= endIndex) break;
            float x = i * lionWidth + lionWidth / 2 + 2 * i;
            float y = j * lionHeight + lionHeight / 2;
            float size = min(lionWidth, lionHeight) * 0.6;
            TableRow row = lionData.getRow(index);
            String model = row.getString("model");
            float MPG = row.getFloat("MPG");
            int cylinders = row.getInt("cylinders");
            float horsepower = row.getFloat("horsepower");
            float weight = row.getFloat("weight");
            int year = row.getInt("year");
            String origin = row.getString("origin");
            lions[index - startIndex] = new Lion(x, y, size, model, MPG, cylinders, horsepower, weight, year, origin);
            index++;
        }
    }
}

class Lion {
    float x, y, size, MPG, horsepower, weight;
    int cylinders, year;
    String model, origin;
    boolean isMouseOver;
    boolean isEyeClosed;
    float moveX, moveY;

    Lion(float x, float y, float size, String model, float MPG, int cylinders, float horsepower, float weight, int year, String origin) {
        this.x = x;
        this.y = y;
        this.size = size;
        this.model = model;
        this.MPG = MPG;
        this.cylinders = cylinders;
        this.horsepower = horsepower;
        this.weight = weight;
        this.year = year;
        this.origin = origin;
        this.isEyeClosed = false;
        this.moveX = 0;
        this.moveY = 0;
    }

    boolean isMouseOver(float mx, float my) {
        return dist(mx, my, x, y) < size / 2;
    }

    void update(boolean isOver) {
        this.isMouseOver = isOver;
        if (frameCount % 60 == 0) {
            isEyeClosed =!isEyeClosed;
        }
        moveX = sin(frameCount * 0.01) * 5;
        moveY = cos(frameCount * 0.01) * 5;
    }

    void draw() {
        ellipseMode(CENTER);
        color colorStart = color(2, 1, 1);
        color colorEnd = color(255, 50, 50);
        float colorValue = map(year, 70, 82, 0, 1);
        fill(lerpColor(colorStart, colorEnd, colorValue));
        ellipse(x + moveX, y + moveY, size, size);
        fill(255, 165, 0);
        float earSize = size / 3 + weight * 0.01;
        ellipse(x - size / 4 + moveX, y - size / 4 + moveY, earSize, earSize);
        ellipse(x + size / 4 + moveX, y - size / 4 + moveY, earSize, earSize);
        if (origin.equals("US")) {
            fill(100);
        } else if (origin.equals("Japan")) {
            fill(255, 255, 0);
        } else {
            fill(255);
        }
        ellipse(x + moveX, y + moveY, size * 0.9, size * 0.8);
        strokeWeight(size * 0.02);
        line(x - size / 7 + moveX, y - size / 6 - MPG * 0.3 + moveY, x - size / 14 + moveX, y - size / 7 + moveY);
        line(x + size / 7 + moveX, y - size / 6 - MPG * 0.3 + moveY, x + size / 14 + moveX, y - size / 7 + moveY);
        fill(0);
        if (!isEyeClosed) {
            ellipse(x - size / 6 + moveX, y - size / 10 + moveY, size * 0.04, size * 0.04);
            ellipse(x + size / 6 + moveX, y - size / 10 + moveY, size * 0.04, size * 0.04);
        }
        fill(255, 0, 0);
        ellipse(x + moveX, y + size / 6 + moveY, size * 0.26, size * 0.18);
        fill(255);
        triangle(x - size / 6 + moveX, y + size / 8 + moveY, x - size / 14 + moveX, y + size / 8 + moveY, x - size / 10 + moveX, y + size / 5 + horsepower * 0.06 + moveY);
        triangle(x + size / 6 + moveX, y + size / 8 + moveY, x + size / 14 + moveX, y + size / 8 + moveY, x + size / 10 + moveX, y + size / 5 + horsepower * 0.06 + moveY);
        fill(255);
        ellipse(x - size / 7 + moveX, y + size / 8 + moveY, size * 0.2, size * 0.13);
        ellipse(x + size / 7 + moveX, y + size / 8 + moveY, size * 0.2, size * 0.13);
        fill(0, 47, 146);
        ellipse(x + moveX, y + size / 10 + moveY, size * 0.18, size * 0.12);
        stroke(0);
        strokeWeight(size * 0.03);
        if (cylinders == 3) {
            line(x - size / 3 + moveX, y + size / 8 + moveY, x - size / 6 + moveX, y + size / 8 + moveY);
            line(x + size / 3 + moveX, y + size / 8 + moveY, x + size / 6 + moveX, y + size / 8 + moveY);
            line(x + size / 3 + moveX, y + size / 6 + moveY, x + size / 6 + moveX, y + size / 6 + moveY);
        } else if (cylinders == 4) {
            float yOffset1 = size / 10;
            float yOffset2 = size / 5;
            line(x - size / 3 + moveX, y + yOffset1 + moveY, x - size / 6 + moveX, y + yOffset1 + moveY);
            line(x + size / 3 + moveX, y + yOffset1 + moveY, x + size / 6 + moveX, y + yOffset1 + moveY);
            line(x - size / 3 + moveX, y + yOffset2 + moveY, x - size / 6 + moveX, y + yOffset2 + moveY);
            line(x + size / 3 + moveX, y + yOffset2 + moveY, x + size / 6 + moveX, y + yOffset2 + moveY);
        } else if (cylinders == 5) {
            for (int i = 0; i < 2; i++) {
                float yOffset = size / 12 + (size / 6) * i;
                line(x - size / 3 + moveX, y + yOffset + moveY, x - size / 6 + moveX, y + yOffset + moveY);
                line(x + size / 3 + moveX, y + yOffset + moveY, x + size / 6 + moveX, y + yOffset + moveY);
            }
            line(x - size / 3 + moveX, y + size / 4 + moveY, x - size / 6 + moveX, y + size / 4 + moveY);
        } else if (cylinders == 6) {
            for (int i = 0; i < 3; i++) {
                float yOffset = size / 12 + (size / 12) * i;
                line(x - size / 3 + moveX, y + yOffset + moveY, x - size / 6 + moveX, y + yOffset + moveY);
                line(x + size / 3 + moveX, y + yOffset + moveY, x + size / 6 + moveX, y + yOffset + moveY);
            }
        } else if (cylinders == 8) {
            for (int i = 0; i < 4; i++) {
                float yOffset = size / 16 + (size / 16) * i;
                line(x - size / 3 + moveX, y + yOffset + moveY, x - size / 6 + moveX, y + yOffset + moveY);
                line(x + size / 3 + moveX, y + yOffset + moveY, x + size / 6 + moveX, y + yOffset + moveY);
            }
        }
        textSize(size * 0.1);
        textAlign(CENTER, CENTER);
        fill(0);
        text(model, x + moveX, y + size / 1.5 + moveY);
    }

    void showDetailsNearby(float mx, float my) {
        textSize(12);
        textAlign(LEFT, TOP);
        fill(0);
        String details = "Model: " + model + "\n" +
                "MPG: " + MPG + "\n" +
                "Cylinders: " + cylinders + "\n" +
                "Horsepower: " + horsepower + "\n" +
                "Weight: " + weight + "\n" +
                "Year: " + year + "\n" +
                "Origin: " + origin;
        text(details, mx + 10, my + 10);
    }
}
