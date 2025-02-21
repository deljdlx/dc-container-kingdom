class LogEntry
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

  ansiToHex(str) {
    const ansiColors = {
      "30": { text: "#000000" },
      "31": { text: "#FF0000" },
      "32": { text: "#00FF00" },
      "33": { text: "#FFFF00" },
      "34": { text: "#0000FF" },
      "35": { text: "#FF00FF" },
      "36": { text: "#00FFFF" },
      "37": { text: "#FFFFFF" },
      "90": { text: "#808080" },
      "91": { text: "#FF5555" },
      "92": { text: "#55FF55" },
      "93": { text: "#FFFF55" },
      "94": { text: "#5555FF" },
      "95": { text: "#FF55FF" },
      "96": { text: "#55FFFF" },
      "97": { text: "#FFFFFF" },


      "40": { background: "#000000" },
      "41": { background: "#FF0000" },
      "42": { background: "#00FF00" },
      "43": { background: "#FFFF00" },
      "44": { background: "#0000FF" },
      "45": { background: "#FF00FF" },
      "46": { background: "#00FFFF" },
      "47": { background: "#FFFFFF" },
      "100": { background: "#808080" },
      "101": { background: "#FF5555" },
      "102": { background: "#55FF55" },
      "103": { background: "#FFFF55" },
      "104": { background: "#5555FF" },
      "105": { background: "#FF55FF" },
      "106": { background: "#55FFFF" },
      "107": { background: "#FFFFFF" },
    };

    let openTags = 0;

    return str.replace(/\x1B\[(\d+)m/g, (match, code) => {
      if (code == 0) {
          let close = "</span>".repeat(openTags);
          openTags = 0;
          return close; // Reset toutes les couleurs
      }

      let style = "";
      if (ansiColors[code]?.text) {
          style += `color:${ansiColors[code].text};`;
      }
      if (ansiColors[code]?.background) {
          style += `background-color:${ansiColors[code].background};`;
      }

      if (style) {
          openTags++;
          return `<span class="console-colored-entry"style="${style}">`;
      }

      return "";
    }) + "</span>".repeat(openTags);
};

  getElement() {
    let buffer = this.logEntry;
    buffer = buffer.replace(/(\x1B\[(\d+)m)\x0D/g, '\n$1');
    buffer = buffer.replace(/\x0D/g, '\n');

    const lines = buffer.split("\n");
    let children = [];
    lines.map((line) => {
      let entry = document.createElement('div');
      let lineBuffer = line;

      entry.innerHTML = lineBuffer;

      this.formatters.map((formatter) => {
        entry = formatter(entry);
      });

      lineBuffer = entry.innerHTML;

      lineBuffer = lineBuffer.replace(/\x00/g, '');
      lineBuffer = lineBuffer.replace(/\x01/g, '');


      lineBuffer = lineBuffer.replace(/\x1B\[\d+m/, '');
      lineBuffer = lineBuffer.replace(/\x1B\[[0-9;?]*[A-Za-z]/g, '');
      lineBuffer = lineBuffer.replace(/\x1B[78]/g, '');


      if(lineBuffer.length) {
        entry.innerHTML = lineBuffer;
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

