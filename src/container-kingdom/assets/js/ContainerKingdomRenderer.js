class ContainerKingdomRenderer
{
  // Constants
  static DEFAULT_CELL_SIZE = 150;
  static DEFAULT_GRID_SIZE = 15;
  static LOOP_PROTECTION_MAX = 100;

  static MEMORY_USAGE_THRESHOLDS = [
    {threshold: 4 * 1024 * 1024, caption: '4mb', humanCaption: 'xxs'},
    {threshold: 8 * 1024 * 1024, caption: '8mb', humanCaption: 'xs'},
    {threshold: 16 * 1024 * 1024, caption: '16mb', humanCaption: 's'},
    {threshold: 32 * 1024 * 1024, caption: '32mb', humanCaption: 'm'},
    {threshold: 64 * 1024 * 1024, caption: '64mb', humanCaption: 'xm'},
    {threshold: 128 * 1024 * 1024, caption: '128mb', humanCaption: 'xxm'},
    {threshold: 256 * 1024 * 1024, caption: '256mb', humanCaption: 'l'},
    {threshold: 512 * 1024 * 1024, caption: '512mb', humanCaption: 'xl'},
    {threshold: 1024 * 1024 * 1024, caption: '1024mb', humanCaption: 'xxl'},
    {threshold: 2048 * 1024 * 1024, caption: '2048mb', humanCaption: 'xxxl'},
  ];

  application;
  viewport;

  cellWidth = ContainerKingdomRenderer.DEFAULT_CELL_SIZE;
  cellHeight = ContainerKingdomRenderer.DEFAULT_CELL_SIZE;
  layoutWidth = window.innerWidth;
  layoutHeight = window.innerHeight;
  layoutMatrix = [];


  roadWidth = 50;
  roadHeight = 50;

  xCells = 0;
  yCells = 0;

  matrix = {};

  bounds = {
    minX: BigInt(Number.MAX_SAFE_INTEGER),
    minY: BigInt(Number.MAX_SAFE_INTEGER),
    maxX: BigInt(Number.MIN_SAFE_INTEGER),
    maxY: BigInt(Number.MIN_SAFE_INTEGER),
  };


  constructor(application, viewport) {
    this.application = application;
    this.viewport = viewport;

    this.xCells = ContainerKingdomRenderer.DEFAULT_GRID_SIZE;
    this.yCells = ContainerKingdomRenderer.DEFAULT_GRID_SIZE;

    const roadElement = new Ground00();
    this.roadWidth = roadElement.width();
    this.roadHeight = roadElement.height();

    this.matrix = this.initMatrix();
  }

  initMatrix()  {
    const layoutMatrix = [];
    for (let x = 0; x < this.xCells; x++) {
      layoutMatrix[x] = [];
      for (let y = 0; y < this.yCells; y++) {
        layoutMatrix[x][y] = [];
      }
    }

    return layoutMatrix;
  };

  drawContainersMatrix() {
    const area = this.viewport.getBoard().getAreaAt(0, 0);

    for(let x = 0 ; x < this.xCells; x++) {
      for(let y = 0 ; y < this.yCells; y++) {
        const cell = document.createElement('div');
        cell.style.width = this.cellWidth + 'px';
        cell.style.height = this.cellHeight + 'px';
        cell.style.position = 'absolute';
        cell.style.left = x * this.cellWidth + 'px';
        cell.style.top = y * this.cellHeight + 'px';
        cell.style.border = '1px solid #f0f';
        cell.style.backgroundColor = 'rgba(0,0,0,0.1)';
        // cell.style.zIndex = 1000;

        cell.innerHTML = `
          <div style="width: 100%; height: 100%; display: flex; justify-content: center; align-items: center;">
            ${x} - ${y}
          </div>
        `;
        area.getDom().appendChild(cell);
      }
    }
  }


  async drawContainers() {
    this.computeBounds(
      this.application.getContainers(true)
    );

    const composes = Object.values(this.application.getComposes());
    for (const compose of composes) {
      await this.drawHouseGroup(
        Object.values(compose.getContainers())
      );
    }
  }


  async drawHouseGroup(containers) {
    const houses = [];
    const containerList = Object.values(containers);
    const firstContainer = containerList[0];
    
    if (!firstContainer) {
      return;
    }
    
    let {x, y} = this.computeContainerCoords(firstContainer);
    try {
      ({x, y} = this.getClosestFreeCoords(x, y, 2));
    } catch(e) {
      try {
        ({x, y} = this.getClosestFreeCoords(x, y, 1));
      }
      catch(e) {
        console.error('No space available for container', firstContainer);
      }
    }
    const firstHouse = await this.drawHouse(firstContainer, x, y);
    houses.push(firstHouse);

    // Draw remaining containers
    for (const container of containerList.slice(1)) {
      ({x, y} = this.getClosestFreeCoords(x, y, 0));
      const house = await this.drawHouse(container, x, y);
      houses.push(house);
    }

    if(houses.length > 1) {
      this.drawFences(houses);
    }
  }

  drawFences(houses) {
    let xMin = Number.MAX_SAFE_INTEGER;
    let xMax = Number.MIN_SAFE_INTEGER;
    let yMin = Number.MAX_SAFE_INTEGER;
    let yMax = Number.MIN_SAFE_INTEGER;

    houses.forEach((house) => {
      xMin = Math.min(xMin, house.x());
      xMax = Math.max(xMax, house.x() + house.width());
      yMin = Math.min(yMin, house.y());
      yMax = Math.max(yMax, house.y() + house.height());
    });

    const padding = 20;
    xMin -= padding;
    xMax += padding;
    yMin -= padding;
    yMax += padding;

    const element = new Element(
      -16,
      -16,
      xMax - xMin,
      yMax - yMin,
      true,
    );
    element.manualZ = 0;
    element.getDom().classList.add('compose-cluster');

    houses[0].addElement(-padding, -padding, element);
  }


  async drawHouse(container, x, y) {
    if(container.rendered) {
      return;
    }
    const board = this.viewport.getBoard();
    const area = board.getAreaAt(0, 0);

    let house = area.addElement(
      x * this.cellWidth,
      y * this.cellHeight,
      new House00()
    );

    container.rendered = true;
    this.matrix[x][y].push(house);

    container.setRpgEngineData({
      element: house,
      coords: {
        x: x,
        y: y,
      }
    });

    const memoryUsage = container.getMemoryUsage();

    if(memoryUsage) {
      const memoryThreshold = this.getMemoryThreshold(memoryUsage);
      house.addClass('memory--' + memoryThreshold.humanCaption);
      house.addClass('memory--' + memoryThreshold.caption);
    }

    house.getDom().dataset.containerId = container.getId();
    house.getDom().dataset.containerName = container.getName();

    house.addClass('container');
    for(let networkName in container.NetworkSettings.Networks) {
      house.addClass('network--' + networkName);
    }

    house.addClass('state--' + container.State)
    house.setInnerHTML(`
      <div class="container__name">
        ${container.getName()}
      </div>
      <div class="container__memory-usage">
        ${container.getMemoryUsage(true)}
      </div>
      <div class="cpu-indicator"></div>
    `);
    house.data.container = container;

    const characterIndex = Math.floor(Math.random() * 4);
    let character = null

    switch(characterIndex) {
      case 0: {
        character = new Woman00();
        break;
      }
      case 1: {
        character = new Woman01();
        break;
      }
      case 2: {
        character = new Woman02();
        break;
      }
      case 3: {
        character = new Man00();
        break;
      }
    }

    // character.live(3000 + Math.random() * 3);

    character.addEventListener('element.click', (event) => {
      if(container.getDemoUrl())
        character.quickReaction(`
          Hello my friend. Do you want to visit
          <a href="//${container.getDemoUrl()}" target="_blank">${container.getDemoUrl()}</a> ?
        `);
    });



    area.addElement(
      x * this.cellWidth + 80,
      y * this.cellHeight +  this.cellHeight - 40,
      character
    );

    return house;
  }


  drawNetworks(containers) {
    const networks = {};

    Object.values(containers).forEach((container) => {
      const containerNetworks = container.NetworkSettings.Networks;
      Object.keys(containerNetworks).forEach((networkName) => {
        if(!networks[networkName]) {
          networks[networkName] = [];
        }
        networks[networkName].push(container);
      });
    });


    const roadsMatrix = {};

    Object.keys(networks).forEach((networkName) => {
      const connectedCells = [];
      networks[networkName].forEach((container) => {
        connectedCells.push(container.rpgEngine.data.coords);
      });

      if(!networks[networkName][0]) {
        return;
      }

      let from = connectedCells[0];
      const fromContainer = networks[networkName][0];
      if(!fromContainer.rpgEngine.data.element) {
        return;
      }

      const offsetLeft = fromContainer.rpgEngine.data.element.width() / 2;
      const offsetTop = fromContainer.rpgEngine.data.element.height();

      for(let i = 1 ; i < connectedCells.length ; i++) {
        if(!networks[networkName][i]) {
          continue;
        }
        const to = connectedCells[i];

        let xFromInPixels = from.x * this.cellWidth;
        let yFromInPixels = from.y * this.cellHeight;

        const xToInPixels = to.x * this.cellWidth;
        const yToInPixels = to.y * this.cellHeight;

        xFromInPixels = this.drawHorizontalRoads(
          networkName,
          xFromInPixels, xToInPixels,
          yFromInPixels,
          offsetLeft, offsetTop,
          roadsMatrix
        );

        this.drawHVerticalRoads(
          networkName,
          yFromInPixels, yToInPixels,
          xFromInPixels,
          offsetLeft, offsetTop,
          roadsMatrix
        );
        from = connectedCells[i];
      }
    });

    this.drawRoadTrees(roadsMatrix);

    return networks;
  }

  drawRoadTrees(matrix) {
    const area = this.viewport.getBoard().getAreaAt(0, 0);

    const width = this.roadWidth;
    const height = this.roadHeight;

    Object.keys(matrix).forEach((x) => {
      Object.keys(matrix[x]).forEach((y) => {
        if(Math.random() > 0.8) {
          if(
            (matrix[x + width] && matrix[x + width][y])
            || (matrix[x - width] && matrix[x - width][y])
          ){
            return;
          }
          area.addElement(
            parseInt(x),
            parseInt(y) + height * 2,
            new Tree00()
          );
        }
      });
    });
  }

  drawHorizontalRoads(
    networkName,
    xFromInPixels, xToInPixels,
    yFromInPixels,
    offsetLeft, offsetTop,
    roadsMatrix
  ) {
    const xDirection = (xToInPixels - xFromInPixels) > 0 ? 1 : -1;

    let loopCounter = 0;
    while (Math.abs(xFromInPixels - xToInPixels) > this.roadWidth) {
      if(loopCounter > ContainerKingdomRenderer.LOOP_PROTECTION_MAX) {
        console.error('Loop detected on X axis');
        break;
      }
      loopCounter++;
      
      const road = this.drawRoad(
        networkName,
        xFromInPixels + offsetLeft,
        yFromInPixels + offsetTop,
      );

      if(!roadsMatrix[xFromInPixels]) {
        roadsMatrix[xFromInPixels] = {};
      }
      roadsMatrix[xFromInPixels][yFromInPixels] = road;

      xFromInPixels += this.roadWidth * xDirection;
    }
    return xFromInPixels;
  }

  drawHVerticalRoads(
    networkName,
    yFromInPixels, yToInPixels,
    xFromInPixels,
    offsetLeft, offsetTop,
    roadsMatrix
  ) {
    const yDirection = (yToInPixels - yFromInPixels) > 0 ? 1 : -1;

    let loopCounter = 0;
    while(Math.abs(yFromInPixels - yToInPixels) >= this.roadHeight) {
      if(loopCounter > ContainerKingdomRenderer.LOOP_PROTECTION_MAX) {
        console.error('Loop detected on Y axis');
        break;
      }
      loopCounter++;

      const road = this.drawRoad(
        networkName,
        xFromInPixels + offsetLeft,
        yFromInPixels + offsetTop,
      );

      if(!roadsMatrix[xFromInPixels]) {
        roadsMatrix[xFromInPixels] = {};
      }
      roadsMatrix[xFromInPixels][yFromInPixels] = road;

      yFromInPixels += this.roadHeight * yDirection;
    }

    if(yDirection < 1) {
      const road = this.drawRoad(
        networkName,
        xFromInPixels + offsetLeft,
        yFromInPixels + offsetTop,
      )
      if(!roadsMatrix[xFromInPixels]) {
        roadsMatrix[xFromInPixels] = [];
      }
      roadsMatrix[xFromInPixels][yFromInPixels] = road;
    }
  }

  drawRoad(networkName, x, y) {
    const area = this.viewport.getBoard().getAreaAt(0, 0);
    const road = area.addElement(
      x,
      y,
      new Ground00()
    );
    road.addClass('network');
    road.addClass('network--' + networkName);
    return road;
  }

  // Compute methods =============================

  computeBounds(containers) {
    let minX = BigInt(Number.MAX_SAFE_INTEGER);
    let minY = BigInt(Number.MAX_SAFE_INTEGER);
    let maxX = BigInt(Number.MIN_SAFE_INTEGER);
    let maxY = BigInt(Number.MIN_SAFE_INTEGER);

    Object.values(containers).forEach((container) => {
      const containerId = container.Id;
      const containerLeft = BigInt('0x' + containerId.substring(0, 32));
      const containerRight = BigInt('0x' + containerId.substring(32, 64));
      minX = containerLeft < minX ? containerLeft : minX;
      minY = containerRight < minY ? containerRight : minY;
      maxX = containerLeft > maxX ? containerLeft : maxX;
      maxY = containerRight > maxY ? containerRight : maxY;
    });

    this.bounds.minX = minX;
    this.bounds.minY = minY;
    this.bounds.maxX = maxX;
    this.bounds.maxY = maxY;

    return this.bounds;
  }


  hasAdjacentCell(x, y) {
    return (
      (this.matrix[x + 1] && this.matrix[x + 1][y + 1])
      || (this.matrix[x + 1] && this.matrix[x + 1][y])
      || (this.matrix[x + 1] && this.matrix[x + 1][y - 1])
      || (this.matrix[x] && this.matrix[x][y + 1])
      || (this.matrix[x] && this.matrix[x][y - 1])
      || (this.matrix[x - 1] && this.matrix[x - 1][y - 1])
      || (this.matrix[x - 1] && this.matrix[x - 1][y])
      || (this.matrix[x - 1] && this.matrix[x - 1][y + 1])
    );
  }

  getClosestFreeCoords(startX, startY, minDistance = 1) {
    const rows = this.matrix.length;
    const cols = this.matrix[0].length;
    let x = startX, y = startY;
    let step = 1, dir = 0;

    const directions = [
        [1, 0],  // Droite
        [0, 1],  // Bas
        [-1, 0], // Gauche
        [0, -1]  // Haut
    ];

    // Vérifier si la position de départ respecte déjà la distance minimale
    if (this.isPositionValid(x, y, minDistance)) return { x, y };

    while (step < Math.max(rows, cols)) {
        for (let i = 0; i < 2; i++) { // 2 fois chaque step avant d'incrémenter
            for (let j = 0; j < step; j++) {
                x += directions[dir][0];
                y += directions[dir][1];

                if (x >= 0 && y >= 0 && x < rows && y < cols && this.isPositionValid(x, y, minDistance)) {
                    return { x, y }; // Premier emplacement libre respectant la distance
                }
            }
            dir = (dir + 1) % 4; // Tourner dans la spirale
        }
        step++; // Augmenter le pas après 2 itérations
    }

    return null; // Aucun espace libre trouvé
}

// ✅ Fonction auxiliaire pour vérifier la distance minimale
isPositionValid(x, y, minDistance) {

    if(x < 0 || y < 0 || x >= this.matrix.length || y >= this.matrix[0].length) {
      return false;
    }

    if (this.matrix[x][y].length !== 0) return false; // Pas vide, on refuse

    // Vérifier que toutes les cases dans un rayon de `minDistance` sont vides
    for (let dx = -minDistance; dx <= minDistance; dx++) {
        for (let dy = -minDistance; dy <= minDistance; dy++) {
            let nx = x + dx, ny = y + dy;
            if (nx >= 0 && ny >= 0 && nx < this.matrix.length && ny < this.matrix[0].length) {
                if (this.matrix[nx][ny].length !== 0) {
                    return false; // Une case trop proche est occupée
                }
            }
        }
    }
    return true;
  }


  computeContainerCoords(container) {

    const {minX, minY, maxX, maxY} = this.bounds;

    let containerId = container.Id;
    let containerLeft = BigInt('0x' + containerId.substring(0,32)) - minX;
    let containerTop = BigInt('0x' + containerId.substring(32,64)) - minY;

    const rangeX = maxX - minX;
    const rangeY = maxY - minY;

    let x = Number((containerLeft * BigInt(this.xCells)) / rangeX);
    let y = Number((containerTop * BigInt(this.yCells)) / rangeY);

    x = Math.min(x, this.xCells - 1);
    y = Math.min(y, this.yCells - 1);

    return {x, y};
  }

  getMemoryThreshold(usage) {
    const thresholds = ContainerKingdomRenderer.MEMORY_USAGE_THRESHOLDS;
    for (const threshold of thresholds) {
      if (usage < threshold.threshold) {
        return threshold;
      }
    }
    return thresholds[thresholds.length - 1];
  }
}

