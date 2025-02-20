class House01 extends Element
{
  constructor() {
    super(0, 0 , 0, 0)

    this.getRenderer().addShadow();


    this.addElement(84, 170, new Ground00());

    const fence =  new FenceGroup00();
    this.addElement(0, 0, fence);

    this.addElement(30, 50, new House00());


    const flowersCount = Math.random() * 5;
    for(let i = 0 ; i < flowersCount ; i++) {
      const left = 130 + Math.random() * 50;
      const top = Math.random() * 100 + 5;
      this.addElement(left, top, new Sunflower00());
    }

    fence.addElement(170, 0, new Tree00());
    fence.addElement(160, 70, new Tree00());
  }
}
