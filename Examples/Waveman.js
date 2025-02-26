import Scene from '@postgeek/post-geek-engine/lib/gameEngine/scene/Scene';
import GraphicImage from '@postgeek/post-geek-engine/lib/renderingEngine/images/GraphicImage';
import ServiceLocator from '@postgeek/post-geek-engine/lib/core/ServiceLocator';
import KeyboardKey from '@postgeek/post-geek-engine/lib/inputEngine/KeyboardKey';
import Transform from '@postgeek/post-geek-engine/lib/renderingEngine/context/Transform';
import Color from '@postgeek/post-geek-engine/lib/renderingEngine/colors/Color';
import Circle from '@postgeek/post-geek-engine/lib/renderingEngine/geometry/Circle';
import Rectangle from '@postgeek/post-geek-engine/lib/renderingEngine/geometry/Rectangle';
import GeometryStyle from '@postgeek/post-geek-engine/lib/renderingEngine/geometry/GeometryStyle';
import Point from '@postgeek/post-geek-engine/lib/core/Point';
import SoundManager from '@postgeek/post-geek-engine/lib/soundEngine/managers/SoundManager';
import ComplexSoundObject from '@postgeek/post-geek-engine/lib/soundEngine/ComplexSoundObject';
import SimpleSoundObject from '@postgeek/post-geek-engine/lib/soundEngine/SimpleSoundObject';
import TextGraphic from '@postgeek/post-geek-engine/lib/renderingEngine/text/TextGraphic';
import TextStyle from '@postgeek/post-geek-engine/lib/renderingEngine/text/TextStyle';

class Bullet {
  constructor(x, y, rotationAngle) {
    this.rotationAngle = rotationAngle;
    this.x = Math.sin(((90 - this.rotationAngle) * Math.PI) / 180) * 16 + x + 12;
    this.y = Math.cos(((90 - this.rotationAngle) * Math.PI) / 180) * 16 + y + 12;
    this.width = 8;
    this.height = 8;
    this.speedVector = new Point(Math.sin(((90 - this.rotationAngle) * Math.PI) / 180) * 5, Math.cos(((90 - this.rotationAngle) * Math.PI) / 180) * 5);
    this.isBulletOutsideBounds = false;
  }
}

class Enemy {
  constructor(x, y, index) {
    this.x = x;
    this.y = y;
    this.width = 36;
    this.height = 21;
    this.index = index;
    this.isHitByBullet = false;

    this.debugRectangle = new Rectangle(new Point(this.x, this.x), this.width, this.height);
    this.debugRectangle.geometryStyle = new GeometryStyle({
      strokeStyle: Color.WHITE,
      lineWidth: 1,
    });
  }
  /*
    const mouseX = event.x;
    const mouseY = event.y;
    const inputX = this.point.x;
    const inputY = this.point.y;
    const inputWidth = this.width;
    const inputHeight = this.height;

    const maxX = inputWidth + inputX;
    const maxY = inputHeight + inputY;
    const minX = inputX;
    const minY = inputY;

    // Check for collision with the mouse
    return (minX <= mouseX && mouseX <= maxX && minY <= mouseY && mouseY <= maxY);
  */

  setRectColor(color) {
    this.debugRectangle.geometryStyle.strokeStyle = color;
  }

  isBulletColliding(bullet) {
    const bulletX = bullet.x;
    const bulletY = bullet.y;
    const bulletWidth = bullet.width;
    const bulletHeight = bullet.height;

    const maxX = this.width + this.x;
    const maxY = this.height + this.y;
    const minX = this.x;
    const minY = this.y;

    return minX <= bulletX + bulletWidth && bulletX <= maxX && minY <= bulletY + bulletHeight && bulletY <= maxY;
  }
}

class DeathCircle {
  constructor(radius) {
    this.radius = radius;
    this.circle = new Circle(new Point(216, 216), this.radius);
    this.circle.geometryStyle = new GeometryStyle({
      strokeStyle: Color.GREEN,
      lineWidth: 1,
    });
  }

  decreaseRadius() {
    this.radius--;
    this.circle.radius--;
  }

  increaseRadius() {
    this.radius++;
    this.circle.radius++;
  }
}

export default class WavemanScene extends Scene {
  preload() {
    this.cache.registerAsset('waveman_main_audio', './assets/waveman/music/WaveMan_Complete.mp3');
    this.cache.registerAsset('waveman_laser_audio', './assets/waveman/sfx/WaveMan_LaserShot1.mp3');
    this.cache.registerAsset('waveman_enemy_damage_audio', './assets/waveman/sfx/WaveMan_AlienDamage1.mp3');
    this.loadImage('waveman', './assets/waveman/images/waveman.png');
    this.loadImage('waveman_ufo', './assets/waveman/images/ufo.png');
    this.loadImage('starfield', './assets/waveman/images/starfield.jpeg');
    this.loadImage('bullet', './assets/waveman/images/waveman_bullet.png');
  }

  create() {
    this.transform = new Transform();
    this.waevman = new GraphicImage(this.retrieveImage('waveman'), true);
    this.waveman_ufo = new GraphicImage(this.retrieveImage('waveman_ufo'), true);
    this.starfield = new GraphicImage(this.retrieveImage('starfield'), true);
    this.wavemanBullet = new GraphicImage(this.retrieveImage('bullet'), true);

    this.soundManager = new SoundManager();

    this.cache.loadAsset('waveman_main_audio').then(() => {
      this.soundManager.addSound('waveman_main_sound', new ComplexSoundObject(this.cache.getAsset('waveman_main_audio')));
      this.wavemanThemeSound = this.soundManager.getSound('waveman_main_sound');
    });

    this.cache.loadAsset('waveman_laser_audio').then(() => {
      this.wavemanLaserSound = new SimpleSoundObject(this.cache.getAsset('waveman_laser_audio'));
      this.wavemanLaserSound.volume = 0.2;
    });

    this.cache.loadAsset('waveman_enemy_damage_audio').then(() => {
      this.wavemanEnemyDamageSound = new SimpleSoundObject(this.cache.getAsset('waveman_enemy_damage_audio'));
      this.wavemanEnemyDamageSound.volume = 0.2;
    });

    this.deathCircle = new DeathCircle(100);

    this.circle = new Circle(new Point(216, 216), 16);
    this.circle.geometryStyle = new GeometryStyle({
      strokeStyle: Color.VIOLET,
      lineWidth: 1,
    });

    this.debugText = new TextGraphic(new Point(500, 40), 'TEST');
    this.debugText.textStyle = new TextStyle({
      strokeStyle: Color.WHITE,
      fillStyle: Color.AQUAMARINE,
      font: '32px Arial',
    });

    this.keyboard = ServiceLocator.instance.locate('keyboard');
    this.keyboard.registerKey(KeyboardKey.R);
    this.keyboard.registerKey(KeyboardKey.P);
    this.keyboard.registerKey(KeyboardKey.UP);
    this.keyboard.registerKey(KeyboardKey.DOWN);
    this.keyboard.registerKey(KeyboardKey.RIGHT);
    this.keyboard.registerKey(KeyboardKey.LEFT);
    this.keyboard.registerKey(KeyboardKey.SPACEBAR);
    this.keyboard.registerKey(KeyboardKey.W);
    this.keyboard.registerKey(KeyboardKey.A);
    this.keyboard.registerKey(KeyboardKey.S);
    this.keyboard.registerKey(KeyboardKey.D);
    this.keyboard.registerKey(KeyboardKey.U);

    this.waveManRotationAngle = 0;
    this.waveManTranslate = 1;
    this.wavemanThemePlaying = false;

    this.cameraPosition = new Point(0, 0);
    this.wavemanPosition = new Point(this._context.canvas.width / 2, this._context.canvas.height / 2);
    this.wavemanHardPosition = new Point(this._context.canvas.width / 2, this._context.canvas.height / 2);

    this.wavemanAcceleration = new Point(0, 0);

    this.firedBullets = [];
    this.spawnedEnemies = [];
    this.bulletDelayTicks = 0;
    this.deathCircleTicks = 20;
  }

  update() {
    this.debugText.text = 'Waveman Demo';
    if (!this.wavemanThemePlaying && this.wavemanThemeSound != undefined) {
      //this.wavemanThemeSound.play();
      this.wavemanThemePlaying = true;
    }
    if (this.keyboard.keyDownOnce(KeyboardKey.U)) {
      this.spawnedEnemies.push(new Enemy(50, 50, this.spawnedEnemies.length));
      /*
      for (var i = 0; i < this.firedBullets.length; i++) {
        var firedBullet = this.firedBullets[i];
        firedBullet.x += firedBullet.speedVector.x;
        firedBullet.y += firedBullet.speedVector.y;
      }*/
    }
    if (this.keyboard.keyDownHeld(KeyboardKey.SPACEBAR) && this.bulletDelayTicks == 0) {
      this.createBullet(this.wavemanPosition.x, this.wavemanPosition.y);
      //this.wavemanLaserSound.play();
      this.bulletDelayTicks = 10;
    }
    if (this.keyboard.keyDownHeld(KeyboardKey.D) || this.keyboard.keyDownHeld(KeyboardKey.RIGHT)) {
      this.waveManRotationAngle += 2;
      if (this.waveManRotationAngle >= 360) this.waveManRotationAngle = 0;
    }
    if (this.keyboard.keyDownHeld(KeyboardKey.A) || this.keyboard.keyDownHeld(KeyboardKey.LEFT)) {
      this.waveManRotationAngle -= 2;
      if (this.waveManRotationAngle <= 0) this.waveManRotationAngle = 360;
    }

    if (this.keyboard.keyDownHeld(KeyboardKey.W) || this.keyboard.keyDownHeld(KeyboardKey.UP)) {
      var speedVector = new Point(Math.sin(((90 - this.waveManRotationAngle) * Math.PI) / 180), Math.cos(((90 - this.waveManRotationAngle) * Math.PI) / 180));
      this.wavemanPosition.x += speedVector.x * 3;
      this.wavemanPosition.y += speedVector.y * 3;
      this.cameraPosition.x += speedVector.x * -3;
      this.cameraPosition.y += speedVector.y * -3;
    }

    if (this.deathCircleTicks == 0) {
      this.deathCircle.decreaseRadius();
      this.deathCircleTicks = 20;
    }

    if (this.bulletDelayTicks > 0) this.bulletDelayTicks--;
    if (this.deathCircleTicks > 0) this.deathCircleTicks--;

    for (var i = 0; i < this.firedBullets.length; i++) {
      var firedBullet = this.firedBullets[i];
      firedBullet.x += firedBullet.speedVector.x;
      firedBullet.y += firedBullet.speedVector.y;
    }

    for (var i = 0; i < this.spawnedEnemies.length; i++) {
      var spawnedEnemy = this.spawnedEnemies[i];
      for (var j = 0; j < this.firedBullets.length; j++) {
        var firedBullet = this.firedBullets[j];
        const bulletColliding = spawnedEnemy.isBulletColliding(firedBullet);
        if (bulletColliding) {
          spawnedEnemy.setRectColor(Color.RED);
          //this.wavemanEnemyDamageSound.play();
          this.deathCircle.increaseRadius();
          console.log('COLLISION');
          break;
        } else {
          spawnedEnemy.setRectColor(Color.WHITE);
        }
      }
    }
  }

  draw() {
    for (let i = 0; i < this._context.canvas.width / 512; i++) {
      for (let j = 0; j < this._context.canvas.height / 512; j++) {
        this.starfield.drawAtPoint(new Point(i * 512, j * 512));
      }
    }
    this.transform.begin();
    this.transform.translate(this.wavemanHardPosition.x + 16, this.wavemanHardPosition.y + 16);
    this.transform.rotate(this.waveManRotationAngle);
    this.transform.translate(-1 * (this.wavemanHardPosition.x + 16), -1 * (this.wavemanHardPosition.y + 16));
    this.waevman.drawAtPoint(new Point(this.wavemanHardPosition.x, this.wavemanHardPosition.y));
    this.transform.end();

    this.transform.begin();
    this.transform.translate(this.cameraPosition.x, this.cameraPosition.y);
    this.deathCircle.circle.draw();

    for (var i = 0; i < this.spawnedEnemies.length; i++) {
      var spawnedEnemy = this.spawnedEnemies[i];
      this.waveman_ufo.drawAtPoint(new Point(spawnedEnemy.x, spawnedEnemy.y));
      spawnedEnemy.debugRectangle.draw();
    }
    for (var i = 0; i < this.firedBullets.length; i++) {
      var firedBullet = this.firedBullets[i];
      this.wavemanBullet.drawAtPoint(new Point(firedBullet.x, firedBullet.y));
    }
    this.transform.end();
    this.debugText.draw();
  }

  createBullet(x, y) {
    var bullet = new Bullet(x, y, this.waveManRotationAngle);
    this.firedBullets.push(bullet);
  }
}
