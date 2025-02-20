document.addEventListener('DOMContentLoaded', async () => {
  const MAP_CONFIGURATION = {
    width: 900,
    height: 600,
  }

  const application = new Application(
    '#viewport',
    MAP_CONFIGURATION.width,
    MAP_CONFIGURATION.height,
  );


  application.registerElement('FenceGroup00', FenceGroup00);
  application.registerElement('House00', House00);
  application.registerElement('House01', House01);
  application.registerElement('Fountain00', Fountain00);

  application.registerElement('Woman00', Woman00);
  application.registerElement('Man00', Man00);

  application.registerElement('Flower00', Flower00);
  application.registerElement('Tree00', Tree00);
  application.registerElement('Sunflower00', Sunflower00);
  application.registerElement('Ground00', Ground00);



  const gameConsole = new GameConsole(application, '#game-console');
  gameConsole.addEntry('<em>Hello my friend, what can I do for you ?</em>');

  application.addEventListener('map.update', (event) => {
    // console.log(event);
  });

  application.addEventListener('element.collision', (event) => {

    event.target.getRenderer().getDom().classList.add('collided');
    event.target.getRenderer().getDom().classList.add('shake');
    setTimeout(() => {
      event.target.getRenderer().getDom().classList.remove('shake');
    }, 500);
    gameConsole.addEntry('collision');

    console.log(event.target);
  });

  application.addEventListener('element.collision.end', (event) => {
    event.target.getRenderer().getDom().classList.remove('collided');
  });


  application.addEventListener('element.trigger', (event) => {
    event.target.getRenderer().getDom().classList.add('collided');
  });

  application.addEventListener('element.trigger.end', (event) => {
    event.target.getRenderer().getDom().classList.remove('collided');
  });

  const viewport = application.getViewport();

  const board = viewport.getBoard();


  await board.initializeAsync((area) => {
    // console.log('%cbootstrap.js :: 57 =============================', 'color: #f00; font-size: 1rem');
    // console.log("INITIALIZED");
    // console.log(area);
    // console.log(area.getChildren());
  });

  const flower = board.getAreaAt(0, 0).addElement(0, 300, new Flower00());
  flower.addEventListener('element.trigger', () => {
    console.log('%cbootstrap.js :: 56 =============================', 'color: #f00; font-size: 1rem');
    console.log("ICI");
  });


  flower.addEventListener('element.click', (event) => {
    console.log('%cbootstrap.js :: 65 =============================', 'color: #f00; font-size: 1rem');
    console.log('click on flower detected');
  })



  const woman = board.getAreaAt(0, 0).getChildByName('woman-00');

  woman.addEventListener('element.collision', (event) => {
    gameConsole.addEntry('Hello my friend !');
    woman.quickReaction('Hello my friend !');
  });


  woman.addEventListener('element.collision.end', (event) => {
    console.log('%cbootstrap.js :: 86 =============================', 'color: #f00; font-size: 1rem');
    console.log("END COLLISION");
    woman.clearQuickReaction();
  });


  viewport.render();
  // viewport.renderDebug();
  viewport.run();


});