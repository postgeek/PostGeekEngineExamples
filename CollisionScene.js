import Scene from "@postgeek/post-geek-engine/lib/gameEngine/scene/Scene";
import Point from '@postgeek/post-geek-engine/lib/core/Point';
import TextGraphic from '@postgeek/post-geek-engine/lib/renderingEngine/text/TextGraphic';
import GameObject from '@postgeek/post-geek-engine/lib/gameEngine/gameObjects/GameObject';
import RectangleHitBox from '@postgeek/post-geek-engine//lib/physicsEngine/hitBoxes/RectangleHitBox';
import PhysicsComponent from '@postgeek/post-geek-engine//lib/physicsEngine/PhysicsComponent';
import GraphicsComponent from '@postgeek/post-geek-engine/lib/renderingEngine/GraphicsComponent';
import Rectangle from '@postgeek/post-geek-engine/lib/renderingEngine/geometry/Rectangle';

class RectangleGraphicsComponent extends GraphicsComponent {
  constructor() {
    super();

    this._rectangle = new Rectangle(new Point(100, 100), 100, 100);

    this.graphicObjects = [
      this._rectangle,
    ];
  }

  get rectangle() {
    return this._rectangle;
  }
}

class RectanglePhysicsComponent extends PhysicsComponent {
  constructor(gameObject) {
    super(gameObject, new RectangleHitBox(new Point(100, 100), 100, 100));
    this.isEnabled = true;

    this._velocity = 10;
  }

  internalUpdate() {
    if (this.isCollidingWithWorldBounds) {
      this._velocity = -this._velocity;
    }

    // Should be throwing an event here to update the rectangle.
    this.gameObject.graphics.rectangle.x += this._velocity;
    this.hitBox.x += this._velocity;
  }
}

class RectangleGameObject extends GameObject {
  constructor(scene) {
    super(scene);

    this.graphics = new RectangleGraphicsComponent();
    this.physics = new RectanglePhysicsComponent(this);
  }
}

export default class CollisionScene extends Scene {
  create() {
    this.rectangle = new RectangleGameObject(this);
    this.rectangleText = new TextGraphic(new Point(3, 12), '');
  }

  update() {
    this.rectangle.update();
    this.rectangleText.text = `Rectangle is at x: '${this.rectangle.graphics.rectangle.x}' y: '${this.rectangle.graphics.rectangle.y}'`;
  }

  draw() {
    this.rectangle.draw();
    this.rectangleText.draw();
  }
}
