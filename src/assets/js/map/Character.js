class Character extends Element
{

  animationIndex = 0;
  direction;

  spriteSheetOffsetLeft = 0;
  spriteSheetOffsetTop = 0;


  tickInterval = 7;
  tick = 0;

  pixelsPerTick = 6;



  alive = false;
  lastActionTime = null;
  actionDuration = 5000;
  newActionThreshold = 0.5;

  constructor(
    x = null,
    y = null,
    spriteSheetOffsetLeft = 0,
    spriteSheetOffsetTop = 0
  ) {
    super(x, y, 48, 48);

    this.spriteSheetOffsetLeft = spriteSheetOffsetLeft;
    this.spriteSheetOffsetTop = spriteSheetOffsetTop;

    this.createCollisionZone(16, 24, 14, 12);
    this.setRenderer(new CharacterRenderer(this));
  }

  getTimeSinceLastAction() {
    return new Date().getTime() - this.lastActionTime;
  }

  startNewAction() {
    this.lastActionTime = new Date().getTime();
  }

  live(actionDuration) {
    this.actionDuration = actionDuration;
    this.alive = true;
    this.lastActionTime = new Date().getTime();
    this.loop();
  }

  loop() {

    if(this.alive && !this.getDirection()) {
      this.setDirection(
        this.getRandomDirection()
      );
    }

    if(
      this.getTimeSinceLastAction() >= this.actionDuration
      && Math.random() > this.newActionThreshold
    ) {
      this.startNewAction();
      this.setDirection(
        this.getRandomDirection()
      );
    }

    const savedGeometry = this.geometry.clone();

    switch(this.getDirection()) {
      case 'up':
        this.y(this.y() - this.pixelsPerTick);
        break;
      case 'down':
        this.y(this.y() + this.pixelsPerTick);
        break;
      case 'left':
        this.x(this.x() - this.pixelsPerTick);
        break;
      case 'right':
        this.x(this.x() + this.pixelsPerTick);
        break;
    }


    const collisions = this.getCollision(this.getBoard());
    if(collisions.length > 0) {
      this.direction = this.getRandomDirection();
      this.geometry = savedGeometry;
    }

    this.update();

    setTimeout(() => {
      this.loop();
    }, 100);
  }

  getRandomDirection() {
    const directions = ['up', 'down', 'left', 'right'];
    return directions[Math.floor(Math.random() * directions.length)];
  }

  stop() {
    this.direction = null;
  }

  getSpriteSheetOffsetLeft() {
    return this.spriteSheetOffsetLeft;
  }

  getSpriteSheetOffsetTop() {
    return this.spriteSheetOffsetTop;
  }

  getDirection() {
    return this.direction;
  }

  getAnimationIndex() {
    return this.animationIndex;
  }

  update() {
    const tickInterval = Math.round(this.moveSpeed() / 80);
    this.tick = (++this.tick % tickInterval);
    if(this.tick === 0) {
      this.animationIndex = (++this.animationIndex % 3);
    }
    this.getRenderer().update();
  }

  setDirection(direction) {
    this.direction = direction;
  }

  quickReaction(content, autoClose = true, closeAfter = 10000) {
    this.getRenderer()._domQuickReaction.innerHTML = content;
    this.getRenderer()._domQuickReaction.classList.add('quickReaction--enable');
    if(autoClose) {
      setTimeout(() => {
        this.clearQuickReaction();
      }, closeAfter);
    }
    return this;
  }

  clearQuickReaction() {
    this.getRenderer()._domQuickReaction.innerHTML = '';
    this.getRenderer()._domQuickReaction.classList.remove('quickReaction--enable');
    console.log('%cCharacter.js :: 62 =============================', 'color: #f00; font-size: 1rem');
    console.log("ICI");
    return this;
  }
}
