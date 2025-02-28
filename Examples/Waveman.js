import Scene from '@postgeek/post-geek-engine/lib/gameEngine/scene/Scene';
import GraphicImage from '@postgeek/post-geek-engine/lib/renderingEngine/images/GraphicImage';
import ServiceLocator from '@postgeek/post-geek-engine/lib/core/ServiceLocator';
import KeyboardKey from '@postgeek/post-geek-engine/lib/inputEngine/KeyboardKey';
import Transform from '@postgeek/post-geek-engine/lib/renderingEngine/context/Transform';
import Color from '@postgeek/post-geek-engine/lib/renderingEngine/colors/Color';
import Circle from '@postgeek/post-geek-engine/lib/renderingEngine/geometry/Circle';
import GeometryStyle from '@postgeek/post-geek-engine/lib/renderingEngine/geometry/GeometryStyle';
import Point from '@postgeek/post-geek-engine/lib/core/Point';
import SoundManager from '@postgeek/post-geek-engine/lib/soundEngine/managers/SoundManager';
import ComplexSoundObject from '@postgeek/post-geek-engine/lib/soundEngine/ComplexSoundObject';
import SimpleSoundObject from '@postgeek/post-geek-engine/lib/soundEngine/SimpleSoundObject';
import TextGraphic from '@postgeek/post-geek-engine/lib/renderingEngine/text/TextGraphic';
import TextStyle from '@postgeek/post-geek-engine/lib/renderingEngine/text/TextStyle';

class Bullet {
  constructor(x, y, rotationAngle, isPlayerBullet) {
    this.rotationAngle = rotationAngle;
    this.x = Math.sin(((90 - this.rotationAngle) * Math.PI) / 180) * 16 + x + 12;
    this.y = Math.cos(((90 - this.rotationAngle) * Math.PI) / 180) * 16 + y + 12;
    this.isPlayerBullet = isPlayerBullet;
    this.width = 8;
    this.height = 8;
    this.speedVector = new Point(Math.sin(((90 - this.rotationAngle) * Math.PI) / 180) * 5, Math.cos(((90 - this.rotationAngle) * Math.PI) / 180) * 5);
    this.isBulletOutsideBounds = false;
  }
}

class Enemy {
  constructor(x, y, deathCircle, bulletArray, index) {
    this.x = x;
    this.y = y;
    this.width = 36;
    this.height = 21;
    this.index = index;
    this.bulletArray = bulletArray;
    this.isHitByBullet = false;
    this.deathCircle = deathCircle;
    this.waypoint = this.deathCircle.getRandomPointInCircle();
    this.ticksBeforeRecalculate = 25;
    this.speed = Math.floor(Math.random() * (5 + 1) + 1);
    this.bulletFiringSpeed = Math.floor(Math.random() * (50 + 10) + 10);
    this.currentBulletFiringTick = 0;
  }

  update() {
    let vector = new Point(this.waypoint.x - this.x, this.waypoint.y - this.y);
    let length = Math.sqrt(vector.x * vector.x + vector.y * vector.y);
    let unitVector = new Point(vector.x / length, vector.y / length);
    this.x += unitVector.x * this.speed;
    this.y += unitVector.y * this.speed;
    if ((!this.deathCircle.isPlayerInCircle(new Point(this.x, this.y), this.width, this.height) && this.ticksBeforeRecalculate <= 0) || length < this.speed) {
      this.waypoint = this.deathCircle.getRandomPointInCircle();
      this.ticksBeforeRecalculate = 25;
    }
    this.ticksBeforeRecalculate--;
    this.currentBulletFiringTick++;
    if (this.currentBulletFiringTick >= this.bulletFiringSpeed) {
      // Fire bullet
      let bulletAngle = Math.floor(Math.random() * (359 + 0) + 0);
      this.bulletArray.push(new Bullet(this.x, this.y, bulletAngle, false));
      this.currentBulletFiringTick = 0;
    }
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
  constructor(x, y, radius) {
    this.radius = radius;
    this.circle = new Circle(new Point(x, y), this.radius);
    this.circle.geometryStyle = new GeometryStyle({
      strokeStyle: Color.GREEN,
      lineWidth: 2,
    });
  }

  isPlayerInCircle(player, width, height) {
    var distance = Math.sqrt(Math.pow(this.circle.x - player.x - width / 2, 2) + Math.pow(this.circle.y - player.y - height / 2, 2));
    return distance + 1 <= this.radius;
  }

  getRandomPointInCircle() {
    let r = this.radius * Math.sqrt(Math.random());
    let theta = Math.random() * 2 * Math.PI;
    let x = Math.round(this.circle.x + r * Math.cos(theta));
    let y = Math.round(this.circle.y + r * Math.sin(theta));
    return new Point(x, y);
  }

  decreaseRadius() {
    if (this.radius > 0) {
      this.radius--;
      this.circle.radius--;
    }
  }

  increaseRadius(radius) {
    this.radius += radius;
    this.circle.radius += radius;
  }
}

export default class WavemanScene extends Scene {
  preload() {
    this.cache.registerAsset('waveman_main_audio', './assets/waveman/music/WaveMan_Complete.mp3');
    this.cache.registerAsset('waveman_laser_audio', './assets/waveman/sfx/WaveMan_LaserShot1.mp3');
    this.cache.registerAsset('waveman_enemy_damage_audio', './assets/waveman/sfx/WaveMan_AlienDamage1.mp3');
    this.cache.registerAsset('waveman_explosion_audio', './assets/waveman/sfx/WaveMan_Explosion.mp3');
    this.loadSprite('explosion_sprite', './assets/waveman/json/explosion_sprite.json');
    this.loadImage('waveman', './assets/waveman/images/waveman.png');
    this.loadImage('waveman_ufo', './assets/waveman/images/ufo.png');
    this.loadImage('starfield', './assets/waveman/images/starfield.jpeg');
    this.loadImage('bullet', './assets/waveman/images/waveman_bullet.png');
    this.loadImage('enemy_bullet', './assets/waveman/images/waveman_enemy_bullet.png');
  }

  create() {
    const canvas = document.getElementById('canvas');
    canvas.width = 1300;
    canvas.height = 650;
    canvas.style.height = `650px`;
    this.transform = new Transform();
    this.waevman = new GraphicImage(this.retrieveImage('waveman'), true);
    this.waveman_ufo = new GraphicImage(this.retrieveImage('waveman_ufo'), true);
    this.starfield = new GraphicImage(this.retrieveImage('starfield'), true);
    this.wavemanBullet = new GraphicImage(this.retrieveImage('bullet'), true);
    this.wavemanEnemyBullet = new GraphicImage(this.retrieveImage('enemy_bullet'), true);
    this.waveman_explosion = this.retrieveSprite('explosion_sprite');

    this.debugCircles = [];

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

    this.cache.loadAsset('waveman_explosion_audio').then(() => {
      this.wavemanExplosionSound = new SimpleSoundObject(this.cache.getAsset('waveman_explosion_audio'));
      this.wavemanExplosionSound.volume = 0.4;
    });

    this.deathCircle = new DeathCircle(this._context.canvas.width / 2 + 16, this._context.canvas.height / 2 + 16, 300);

    this.circle = new Circle(new Point(216, 216), 16);
    this.circle.geometryStyle = new GeometryStyle({
      strokeStyle: Color.VIOLET,
      lineWidth: 1,
    });

    this.waveNumber = 0;
    this.waveNumberText = new TextGraphic(new Point(10, 640), `Wave: ${this.waveNumber}`);
    this.waveNumberText.textStyle = new TextStyle({
      strokeStyle: Color.AQUA,
      fillStyle: Color.WHITE,
      font: '14px Arial',
    });

    this.debugText = new TextGraphic(new Point(300, 40), 'Waveman : Earth Defender 2 - Electric Alien Boogaloo');
    this.debugText.textStyle = new TextStyle({
      strokeStyle: Color.AQUA,
      fillStyle: Color.WHITE,
      font: '32px Arial',
    });

    this.scoreText = new TextGraphic(new Point(500, 200), `SCORE: 0`);
    this.scoreText.textStyle = new TextStyle({
      strokeStyle: Color.AQUA,
      fillStyle: Color.WHITE,
      font: '64px Arial',
    });

    this.gameoverText = new TextGraphic(new Point(300, 350), 'GAMEOVER');
    this.gameoverText.textStyle = new TextStyle({
      strokeStyle: Color.SALMON,
      fillStyle: Color.RED,
      lineWidth: 3,
      font: '128px Arial',
    });

    this.deathCountText = new TextGraphic(new Point(570, 400), `Human Death(s): 0`);
    this.deathCountText.textStyle = new TextStyle({
      strokeStyle: Color.RED,
      fillStyle: Color.WHITE,
      font: '14px Arial',
    });

    this.enterToRestartText = new TextGraphic(new Point(576, 420), `Press [Enter] to restart`);
    this.enterToRestartText.textStyle = new TextStyle({
      //strokeStyle: Color.AQUA,
      fillStyle: Color.AQUA,
      font: '12px Arial',
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
    this.keyboard.registerKey(KeyboardKey.N);
    this.keyboard.registerKey(KeyboardKey.TWO);
    this.keyboard.registerKey(KeyboardKey.THREE);
    this.keyboard.registerKey(KeyboardKey.FOUR);
    this.keyboard.registerKey(KeyboardKey.FIVE);
    this.keyboard.registerKey(KeyboardKey.ENTER);

    this.waveManRotationAngle = 0;
    this.waveManTranslate = 1;
    this.wavemanThemePlaying = false;

    this.cameraPosition = new Point(0, 0);
    this.wavemanPosition = new Point(this._context.canvas.width / 2, this._context.canvas.height / 2);
    this.wavemanHardPosition = new Point(this._context.canvas.width / 2, this._context.canvas.height / 2);

    this.wavemanAcceleration = new Point(0, 0);

    this.firedBullets = [];
    this.enemyFiredBullets = [];
    this.spawnedEnemies = [];
    this.bulletDelayTicks = 0;
    this.bulletDelayReset = [10, 5, 2, 1];
    this.bulletResetIndex = 0;
    this.deathCircleTicks = 50;
    this.playIsDead = false;
    this.nextWave = true;
    this.firstTick = true;
    this.pressEnterBlink = 35;
    this.score = 0;

    /*
    HAXXX
    */
    this.stopDeathCircle = false;
    this.multipleBullets = false;

    this.deathCount = 0;
  }

  update() {
    if (this.firstTick) {
      this.firstTick = false;
    }
    if (this.nextWave && !this.playIsDead) {
      this.firedBullets = [];
      this.enemyFiredBullets = [];
      this.spawnWave();
      this.nextWave = false;
    }

    if (!this.wavemanThemePlaying && this.wavemanThemeSound != undefined) {
      this.wavemanThemeSound.play();
      this.wavemanThemePlaying = true;
    }

    if (!this.deathCircle.isPlayerInCircle(this.wavemanPosition, 32, 32) && !this.playIsDead) {
      this.wavemanExplosionSound.play();
      this.firedBullets = [];
      this.enemyFiredBullets = [];
      this.spawnedEnemies = [];
      this.playIsDead = true;
    }

    if (this.playIsDead) {
      this.scoreText.text = `SCORE: ${this.score}`;
      this.deathCount++;
      this.deathCountText.text = `Human Death(s): ${this.deathCount}`;
      this.pressEnterBlink--;
      if (this.pressEnterBlink <= 0) {
        this.enterToRestartText.isVisible = !this.enterToRestartText.isVisible;
        this.pressEnterBlink = 35;
      }
      this.waveman_explosion.update();
    }

    if (this.keyboard.keyDownOnce(KeyboardKey.TWO)) {
      this.bulletResetIndex++;
      if (this.bulletResetIndex >= this.bulletDelayReset.length) this.bulletResetIndex = 0;
    }
    if (this.keyboard.keyDownOnce(KeyboardKey.THREE)) {
      this.stopDeathCircle = !this.stopDeathCircle;
    }
    if (this.keyboard.keyDownOnce(KeyboardKey.FOUR)) {
      this.score += 100000;
    }
    if (this.keyboard.keyDownOnce(KeyboardKey.FIVE)) {
      this.multipleBullets = !this.multipleBullets;
    }

    if (this.playIsDead & this.keyboard.keyDownOnce(KeyboardKey.ENTER)) {
      this.wavemanThemeSound.stop();
      this.waveNumber = 0;
      this.stopDeathCircle = false;
      this.bulletResetIndex = 0;
      this.multipleBullets = false;
      this.score = 0;
      this.wavemanPosition = new Point(this._context.canvas.width / 2, this._context.canvas.height / 2);
      this.cameraPosition = new Point(0, 0);
      this.playIsDead = false;
      this.nextWave = true;
      this.wavemanThemeSound.play();
    }

    if (this.keyboard.keyDownOnce(KeyboardKey.N)) {
      this.spawnedEnemies = [];
    }

    if (!this.playIsDead) {
      if (this.keyboard.keyDownHeld(KeyboardKey.SPACEBAR) && this.bulletDelayTicks == 0) {
        this.createBullet(this.wavemanPosition.x, this.wavemanPosition.y, this.waveManRotationAngle);
        if (this.multipleBullets) {
          for (let i = 0; i < 360 / 30 - 1; i++) {
            this.createBullet(this.wavemanPosition.x, this.wavemanPosition.y, this.waveManRotationAngle + (i + 1) * 30);
          }
        }
        this.wavemanLaserSound.play();
        this.bulletDelayTicks = this.bulletDelayReset[this.bulletResetIndex];
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
    }

    if (this.deathCircleTicks == 0 && this.deathCircle.circle.radius > 0 && !this.playIsDead && !this.stopDeathCircle) {
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

    for (var i = 0; i < this.enemyFiredBullets.length; i++) {
      var firedBullet = this.enemyFiredBullets[i];
      firedBullet.x += firedBullet.speedVector.x;
      firedBullet.y += firedBullet.speedVector.y;
    }

    for (var i = 0; i < this.spawnedEnemies.length; i++) {
      var spawnedEnemy = this.spawnedEnemies[i];
      spawnedEnemy.update();
    }

    let enemiesToKillIndex = [];
    let bulletsToKillIndex = [];
    let enemyBulletsToKillIndex = [];

    for (var i = 0; i < this.enemyFiredBullets.length; i++) {
      var firedBullet = this.enemyFiredBullets[i];
      const bulletColliding = this.isBulletColliding(firedBullet);
      if (bulletColliding) {
        if (!this.stopDeathCircle) this.deathCircle.decreaseRadius();
        enemyBulletsToKillIndex.push(i);
      }
    }

    for (var i = 0; i < this.spawnedEnemies.length; i++) {
      var spawnedEnemy = this.spawnedEnemies[i];
      for (var j = 0; j < this.firedBullets.length; j++) {
        var firedBullet = this.firedBullets[j];
        const bulletColliding = spawnedEnemy.isBulletColliding(firedBullet);
        if (bulletColliding) {
          this.wavemanEnemyDamageSound.play();
          this.score++;
          this.deathCircle.increaseRadius(1);
          enemiesToKillIndex.push(i);
          bulletsToKillIndex.push(j);
          break;
        }
      }
    }

    for (let i = 0; i < enemiesToKillIndex.length; i++) {
      this.spawnedEnemies.splice(enemiesToKillIndex[i], 1);
    }

    for (let i = 0; i < bulletsToKillIndex.length; i++) {
      this.firedBullets.splice(bulletsToKillIndex[i], 1);
    }

    for (let i = 0; i < enemyBulletsToKillIndex.length; i++) {
      this.enemyFiredBullets.splice(enemyBulletsToKillIndex[i], 1);
    }

    if (this.spawnedEnemies.length <= 0) {
      this.nextWave = true;
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
    if (this.playIsDead) {
      this.transform.scale(0.5, 0.5);
      this.waveman_explosion.drawAtPoint(new Point(this.wavemanHardPosition.x * 2 - 50, this.wavemanHardPosition.y * 2 - 40));
    }
    if (!this.playIsDead) {
      this.waevman.drawAtPoint(new Point(this.wavemanHardPosition.x, this.wavemanHardPosition.y));
    }
    this.transform.end();

    this.transform.begin();
    this.transform.translate(this.cameraPosition.x, this.cameraPosition.y);
    this.deathCircle.circle.draw();

    for (var i = 0; i < this.debugCircles.length; i++) {
      var debugCircle = this.debugCircles[i];
      debugCircle.draw();
    }

    for (var i = 0; i < this.spawnedEnemies.length; i++) {
      var spawnedEnemy = this.spawnedEnemies[i];
      this.waveman_ufo.drawAtPoint(new Point(spawnedEnemy.x, spawnedEnemy.y));
    }
    for (var i = 0; i < this.firedBullets.length; i++) {
      var firedBullet = this.firedBullets[i];
      this.wavemanBullet.drawAtPoint(new Point(firedBullet.x, firedBullet.y));
    }
    for (var i = 0; i < this.enemyFiredBullets.length; i++) {
      var firedBullet = this.enemyFiredBullets[i];
      this.wavemanEnemyBullet.drawAtPoint(new Point(firedBullet.x, firedBullet.y));
    }
    this.transform.end();

    if (!this.playIsDead) {
      this.debugText.draw();
      this.waveNumberText.draw();
    }

    if (this.playIsDead) {
      this.gameoverText.draw();
      this.deathCountText.draw();
      this.enterToRestartText.draw();
      this.scoreText.draw();
    }
  }

  createBullet(x, y, rotation) {
    var bullet = new Bullet(x, y, rotation, true);
    this.firedBullets.push(bullet);
  }

  isBulletColliding(bullet) {
    const bulletX = bullet.x;
    const bulletY = bullet.y;
    const bulletWidth = bullet.width;
    const bulletHeight = bullet.height;

    const maxX = 32 + this.wavemanPosition.x;
    const maxY = 32 + this.wavemanPosition.y;
    const minX = this.wavemanPosition.x;
    const minY = this.wavemanPosition.y;

    return minX <= bulletX + bulletWidth && bulletX <= maxX && minY <= bulletY + bulletHeight && bulletY <= maxY;
  }

  spawnWave() {
    this.waveNumber++;
    this.waveNumberText.text = `Wave: ${this.waveNumber}`;
    for (let i = 0; i < 5 * this.waveNumber; i++) {
      var randomPoint = this.deathCircle.getRandomPointInCircle();
      this.spawnedEnemies.push(new Enemy(randomPoint.x, randomPoint.y, this.deathCircle, this.enemyFiredBullets, this.spawnedEnemies.length));
    }
  }
}
