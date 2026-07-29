import { LogEntry } from './LogEntry.js';

export class Log
{
  buffer;
  lines = [];

  constructor(buffer) {
    this.buffer = buffer;
    this.parse(buffer);
  }


  parse(buffer) {
    buffer = buffer.replace(/(\s+)/, '$1');
    this.lines = buffer.split("\n");
  }

  getEntries() {
    return this.lines.map((line) => {
      const logEntry = new LogEntry(line);
      logEntry.addFormatter(this.highlightErrors);
      return logEntry;
    });
  }

  // Reads the rendered *text*, not the markup: deciding on `innerHTML` meant a
  // line could be painted red by an attribute the reader never sees.
  highlightErrors(element) {
    if(element.textContent.match(/error/gi)) {
      element.classList.add('log-entry--error');
    }
    return element;
  }
}