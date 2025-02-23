class ContainerKingdomRenderer
{
  application;
  viewport;

  cellWidth = 150;
  cellHeight = 150;
  layoutWidth = window.innerWidth;
  layoutHeight = window.innerHeight;
  layoutMatrix = [];


  roadWidth = 50;
  roadHeight = 50;

  xCells = 0;
  yCells = 0;

  matrix = {};

  memoryUsageThresholds = [
    {thresholds: 4 * 1024 *1024, caption: '4mb', humanCaption: 'xxs'},
    {thresholds: 8 * 1024 *1024, caption: '8mb', humanCaption: 'xs'},
    {thresholds: 16 * 1024 *1024, caption: '16mb', humanCaption: 's'},
    {thresholds: 32 * 1024 *1024, caption: '32mb', humanCaption: 'm'},
    {thresholds: 64 * 1024 *1024, caption: '64mb', humanCaption: 'xm'},
    {thresholds: 128 * 1024 *1024, caption: '128mb', humanCaption: 'xxm'},
    {thresholds: 256 * 1024 *1024, caption: '256mb', humanCaption: 'l'},
    {thresholds: 512 * 1024 *1024, caption: '512mb', humanCaption: 'xl'},
    {thresholds: 1024 * 1024 *1024, caption: '1024mb', humanCaption: 'xxl'},
    {thresholds: 2048 * 1024 *1024, caption: '2048mb', humanCaption: 'xxxl'},
  ]

  bounds = {
    minX: BigInt(Number.MAX_SAFE_INTEGER),
    minY: BigInt(Number.MAX_SAFE_INTEGER),
    maxX: BigInt(Number.MIN_SAFE_INTEGER),
    maxY: BigInt(Number.MIN_SAFE_INTEGER),
  };


  constructor(application, viewport) {
    this.application = application;
    this.viewport = viewport;

    this.xCells = 15;
    this.yCells = 15;

    const roadElement = new Ground00();
    this.roadWidth = roadElement.width();
    this.roadHeight = roadElement.height();

    this.matrix = this.initMatrix();
  }

  initMatrix()  {
    let layoutMatrix = [];
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
    Object.values(this.application.getComposes()).map(async (compose) => {
      this.drawHouseGroup(
        Object.values(compose.getContainers())
      );
    });
  }


  async drawHouseGroup(containers) {
    const houses = [];
    const firstContainer = Object.values(containers)[0];
    let {x, y} = this.computeContainerCoords(firstContainer);
    ({x, y} = this.getClosestFreeCoords(x, y, 2));
    let house = await this.drawHouse(firstContainer, x, y);
    houses.push(house);

    await Object.values(containers).map(async (container, index) => {
      if(index === 0) {
        return;
      }

      ({x, y} = this.getClosestFreeCoords(x, y, 0));
      let house = await this.drawHouse(container, x, y);
      houses.push(house);
    });

    if(houses.length > 1) {
      this.drawFences(houses);
    }
  }

  drawFences(
    houses
  ) {

    let xMin = Number.MAX_SAFE_INTEGER;
    let xMax = Number.MIN_SAFE_INTEGER;
    let yMin = Number.MAX_SAFE_INTEGER;
    let yMax = Number.MIN_SAFE_INTEGER;

    houses.map((house) => {
      xMin = Math.min(xMin, house.x());
      xMax = Math.max(xMax, house.x() + house.width());
      yMin = Math.min(yMin, house.y());
      yMax = Math.max(yMax, house.y() + house.height());
    });

    xMin -= 20;
    xMax += 20;
    yMin -= 20;
    yMax += 20;

    const board = this.viewport.getBoard();
    const area = board.getAreaAt(0, 0);
    let element = new Element(
      -16,
      -16,
      xMax - xMin,
      yMax - yMin,
      true,
    )
    element.manualZ = 0;

    element.getDom().classList.add('compose-cluster');

    houses[0].addElement(
      -20,
      -20,
      element
    )

    // area.addElement(
    //   xMin,
    //   yMin,
    //   element
    // );



    return;


    // houses.map((house) => {
    //   xMin = Math.min(xMin, house.x());
    //   xMax = Math.max(xMax, house.x() + house.width());
    //   yMin = Math.min(yMin, house.y());
    //   yMax = Math.max(yMax, house.y() + house.height());
    // });
    // console.log({
    //   xMin, xMax, yMin, yMax
    // })

    // xMin -= 20;
    // xMax += 20;
    // yMin -= 20;
    // yMax += 20;

    // const board = this.viewport.getBoard();
    // const area = board.getAreaAt(0, 0);
    // const horizontalFences = Math.floor((xMax - xMin) / 16);
    // const verticalFences = Math.floor((yMax - yMin) / 16);

    // for(let h = 0 ; h <= horizontalFences ; h++) {
    //   area.addElement(
    //     xMin + h * 16,
    //     yMin,
    //     new Fence00H()
    //   );
    // }

    // for(let v = 0 ; v <= verticalFences ; v++) {
    //   area.addElement(
    //     xMin,
    //     yMin + v * 16,
    //     new Fence00V()
    //   );

    //   area.addElement(
    //     xMax,
    //     yMin + v * 16,
    //     new Fence00V()
    //   );
    // }
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

    character.live(3000 + Math.random() * 3);

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

    Object.values(containers).map((container, index) => {
      let containerNetWorks = container.NetworkSettings.Networks;
      containerNetWorks = Object.keys(containerNetWorks).map((networkName) => {
        if(!networks[networkName]) {
          networks[networkName] = [];
        }
        networks[networkName].push(container);
      });
    });


    const roadsMatrix = {};

    Object.keys(networks).map((networkName) => {
      const connectedCells = [];
      networks[networkName].map((container, index) => {
        connectedCells.push(container.rpgEngine.data.coords);
      });

      if(!networks[networkName][0]) {
        return;
      }

      let from = connectedCells[0];
      let fromContainer = networks[networkName][0];
      if(!fromContainer.rpgEngine.data.element) {
        return;
      }

      let offsetLeft = fromContainer.rpgEngine.data.element.width() / 2;
      let offsetTop = fromContainer.rpgEngine.data.element.height();

      for(let i = 1 ; i < connectedCells.length ; i++) {
        if(!networks[networkName][i]) {
          continue;
        }
        const toContainer = networks[networkName][i];
        let to = connectedCells[i];

        let xFromInPixels = from.x * this.cellWidth;
        let yFromInPixels = from.y * this.cellHeight;

        let xToInPixels = to.x * this.cellWidth;
        let yToInPixels = to.y * this.cellHeight;

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
        )
        from = connectedCells[i];
      }
    });

    this.drawRoadTrees(roadsMatrix);

    return networks;
  };

  drawRoadTrees(matrix) {
    const area = this.viewport.getBoard().getAreaAt(0, 0);

    const width = this.roadWidth;
    const height = this.roadHeight;

    Object.keys(matrix).map((x) => {
      Object.keys(matrix[x]).map((y) => {
        const road = matrix[x][y];

        if(Math.random() > 0.8) {
          if(
            (matrix[x + width] && matrix[x + width][y])
            || (matrix[x -width] && matrix[x - width][y])

            // || (matrix[x + width] && matrix[x + width][y - height]) ||
            // || (matrix[x + width] && matrix[x + width][y]) ||
            // || (matrix[x + width] && matrix[x + width][y + height]) ||

            // || (matrix[x - width] && matrix[x - width][y - height]) ||
            // || (matrix[x - width] && matrix[x - width][y]) ||
            // || (matrix[x - width] && matrix[x - width][y + height])
          ){
            return;
          }
          const tree = area.addElement(
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
    let xDiff = xToInPixels - xFromInPixels;
    let xDirection = xDiff > 0 ? 1 : -1;

    let noLockX = 0
    while (Math.abs(xFromInPixels - xToInPixels) > this.roadWidth) {
      if(noLockX > 100) {
        console.error('loop detected on X');
        break;
      }
      noLockX++;
      const road = this.drawRoad(
        networkName,
        xFromInPixels + offsetLeft,
        yFromInPixels + offsetTop,
      )

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
    let yDiff = yToInPixels - yFromInPixels;
    let yDirection = yDiff > 0 ? 1 : -1;


    let noLockY = 0
    while(Math.abs(yFromInPixels - yToInPixels) >= this.roadHeight) {
      if(noLockY > 100) {
        console.error('loop detected on Y');
        break;
      }
      noLockY++;

      const road = this.drawRoad(
        networkName,
        xFromInPixels + offsetLeft,
        yFromInPixels + offsetTop,
      )

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

  // compute methods =============================

  computeBounds(containers) {
    let minX = BigInt(Number.MAX_SAFE_INTEGER);
    let minY = BigInt(Number.MAX_SAFE_INTEGER);
    let maxX = BigInt(Number.MIN_SAFE_INTEGER);
    let maxY = BigInt(Number.MIN_SAFE_INTEGER);

    Object.values(containers).map((container) => {
      let containerId = container.Id;
      let containerLeft = BigInt('0x' + containerId.substring(0,32))
      let containerRight = BigInt('0x' + containerId.substring(32,64));
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
    if(
        this.matrix[x + 1] && this.matrix[x + 1][y + 1]
        || this.matrix[x + 1] && this.matrix[x + 1][y]
        || this.matrix[x + 1] && this.matrix[x + 1][y - 1]

        || this.matrix[x] && this.matrix[x][y + 1]
        || this.matrix[x] && this.matrix[x][y - 1]

        || this.matrix[x - 1] && this.matrix[x - 1][y - 1]
        || this.matrix[x - 1] && this.matrix[x - 1][y]
        || this.matrix[x - 1] && this.matrix[x - 1][y + 1]
    ) {
      return true;
    }

    return false;
  };

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
    let thresholdIndex = 0;
    this.memoryUsageThresholds.map((threshold) => {
      if(usage < threshold.thresholds) {
        return threshold;
      }
      thresholdIndex++;
    });

    return this.memoryUsageThresholds[thresholdIndex] ?? this.memoryUsageThresholds[this.memoryUsageThresholds.length - 1];
  }
}

