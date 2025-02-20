class FenceGroup00 extends Element
{
  constructor(x = 0, y = 0) {
    super(x, y);
    const fenceLeft = 0;
    const right = 16 * 15;


    const fence0 = this.createElement(fenceLeft, 0);
    for(let i = 0 ; i < 15 ; i++) {
      fence0.addElement(i * 16, 0, new Fence00H());
    }

    const fence1 = this.createElement(fenceLeft, 0);
    for(let i = 0 ; i < 12 ; i++) {
      fence1.addElement(0, i * 16, new Fence00V());
    }

    const fenceRight = this.createElement();
    for(let i = 0 ; i < 12 ; i++) {
      fenceRight.addElement(right, i * 16, new Fence00V());
    }

    const fence2 = this.createElement(fenceLeft, 0);
    for(let i = 0 ; i < 5 ; i++) {
      fence2.addElement(i * 16, 12 * 16, new Fence00H());
    }

    const fence3 = this.createElement();
    for(let i = 0 ; i < 7 ; i++) {
      fence3.addElement(
        i * 16 + fenceLeft + 16 * 8 + 8,
        12 * 16,
        new Fence00H()
      );
    }
  }
}
