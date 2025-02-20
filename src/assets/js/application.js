function getArea00() {

  /*
  const character = new Character();
  area00.addElement('surface', character, 2, 3);

  character.addEventListener('collision', (data) => {
    data.source.say('Hello my friend, what can I do for you ?');
  });

  character.addEventListener('endCollision', (data) => {
    data.source.clear();
  });
  */

  /*
  setTimeout(() => {
    character.go('right');
  })
  */


  /*
  for(let i = 0 ; i < 10 ; i++) {
    area00.addElement('ground', new GroundConcrete00(), 1 + i, 3);
    area00.addElement('ground', new GroundConcrete00(), 1 + i, 4);
  }

  for(let i = 0 ; i < 7 ; i++) {
    area00.addElement('ground', new GroundConcrete00(), 10, 3 + i);
    area00.addElement('ground', new GroundConcrete00(), 11, 3 + i);
  }

  area00.addElement('surface', new Tree00(), 0, 0);
  area00.addElement('surface', new Tree00(), 0, 7);
  area00.addElement('surface', new Tree00(), 0.5, 7.5);
  area00.addElement('surface', new Tree00(), 1, 7);
  */

  /*
  for(let i = 0 ; i < 10 ; i++) {
    area00.addElement('surface', new Tree00(), 0.5 + Math.random() * i, 7.5 + Math.random() * i);
  }
  */

  // area00.addElement('surface', new House00(), 2, 1);

  // ===========================


  /*
  function getHouseGroup00() {
    const house00Group = new GroupHome00();
    return house00Group;
  }

  area00.addGroup(getHouseGroup00(), 6, 0);

  console.log('%capplication.js :: 59 =============================', 'color: #f00; font-size: 1rem');
  console.log(area00.getBoundingBox());
  */

  // area00.addGroup(getHouseGroup00(), 8, 6);
  // area00.addElement('surface', new Flower02(), 2, 5);
  // area00.addElement('surface', new Fountain00(), 5, 7);

  return area00;
}


document.addEventListener('DOMContentLoaded', () => {

  const viewport = new Viewport();

  // viewport.layers.surface.map.areas[0][0].grid();

  const area00 = new AreaDescriptor();
    const group = new MapElementGroup();

    group.addElement(new House00(), 2, 2);
    group.addElement(new House00(), 8, 2);

    console.log('%capplication.js :: 80 =============================', 'color: #f00; font-size: 1rem');
    console.log(group.getBoundingBox());

  area00.addGroup(group, 0, 0);

  console.log('%capplication.js :: 86 =============================', 'color: #f00; font-size: 1rem');
  console.log(area00.getBoundingBox());

  viewport.loadAreaDescriptor(0, 0, area00);

  viewport.render();



  // viewport.loadAreaDescriptor(0, 0, getArea00());


  viewport.launch();

  const gameConsole = new GameConsole(viewport, '#console');
  document.querySelector('#debug-switch').addEventListener('click', (event) => {
    document.querySelector('body').classList.toggle('debug');
  });

  viewport.addEventListener('move', (data) => {
    const {viewport} = data;
    gameConsole.clear();
    gameConsole.addEntry(`Position : (${viewport.x}, ${viewport.y})`);
    gameConsole.addEntry(`Area : (${viewport.area.x}, ${viewport.area.y})`);
  });

  viewport.addEventListener('endCollision', (data) => {
    const container = document.querySelector('#bottom-panel__content');
    container.innerHTML = '';
  });

  viewport.addEventListener('say', (data) => {

    const template = document.querySelector('#chat-entry');
    const entry = template.content.firstElementChild.cloneNode(true);
    const sentenceElement = document.createElement('div');
    sentenceElement.classList = 'sentence';
    sentenceElement.innerHTML = data.sentence;
    entry.querySelector('.chat-content').appendChild(sentenceElement);

    const container = document.querySelector('#bottom-panel__content');
    container.innerHTML = '';
    container.appendChild(entry);
  });

  const statusBar = new StatusBar(viewport);

});

