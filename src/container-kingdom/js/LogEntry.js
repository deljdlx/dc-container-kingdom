export class LogEntry
{
  logEntry;
  element;

  formatters = [];

  constructor( logEntry ) {
    this.logEntry = logEntry;
    this.element = document.createElement('div');
    this.element.classList.add('log-entry');
  }

  addFormatter(callback) {
    this.formatters.push(callback);
  }

  getElement() {
    let buffer = this.logEntry;
    buffer = buffer.replace(/(\x1B\[(\d+)m)\x0D/g, '\n$1');
    buffer = buffer.replace(/\x0D/g, '\n');

    const lines = buffer.split("\n");
    let children = [];
    lines.map((line) => {
      let entry = document.createElement('div');
      let lineBuffer = line;

      // A log line is whatever a container decided to print — never markup.
      // Interpreting it as HTML handed script execution to this page, which
      // holds an unauthenticated Docker API session.
      entry.textContent = lineBuffer;

      this.formatters.map((formatter) => {
        entry = formatter(entry);
      });

      lineBuffer = entry.textContent;

      lineBuffer = lineBuffer.replace(/\x00/g, '');
      lineBuffer = lineBuffer.replace(/\x01/g, '');


      lineBuffer = lineBuffer.replace(/\x1B\[\d+m/, '');
      lineBuffer = lineBuffer.replace(/\x1B\[[0-9;?]*[A-Za-z]/g, '');
      lineBuffer = lineBuffer.replace(/\x1B[78]/g, '');


      if(lineBuffer.length) {
        entry.textContent = lineBuffer;
        children.push(entry);
      }
    });

    let container = null;
    if(children.length > 1) {
      container = document.createElement('details');
      const summary = document.createElement('summary');
      const lastEntry = children.pop();
      summary.appendChild(lastEntry);
      container.appendChild(summary);
      children.map((entry) => {
        container.appendChild(entry);
      })
    }
    else {
      container = children.pop();
    }
    if(container) {
      this.element.appendChild(container);
    }

    return this.element;
  }
}

