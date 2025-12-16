export class Poem {
  constructor(public title: string, public lines: string[]) {}

  public addLine(line: string): void {
    this.lines.push(line);
  }

  public toString(): string {
    return `${this.title}\n\n${this.lines.join('\n')}`;
  }
}

