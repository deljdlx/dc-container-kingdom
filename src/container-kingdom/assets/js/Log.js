class Log
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
      const logEntry =  new LogEntry(line);
      logEntry.addFormatter(this.highlightErrors);
      return logEntry;
    })
  }

  highlightErrors(element) {
    if(element.innerHTML.match(/error/gi)) {
      element.classList.add('log-entry--error');
    }
    return element;
  }


}