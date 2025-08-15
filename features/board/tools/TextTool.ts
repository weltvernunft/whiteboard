import { Canvas, IText } from "fabric";

interface TextOptions {
  left: number;
  top: number;
  text: string;
  fill: string;
  fontSize: number;
}

export class TextTool {
  private canvas: Canvas;

  constructor(canvas: Canvas) {
    this.canvas = canvas;
  }

  createText(options: TextOptions) {
    const text = new IText(options.text, {
      left: options.left,
      top: options.top,
      fill: options.fill,
      fontSize: options.fontSize,
      selectable: true,
      evented: true,
    });
    this.canvas.add(text);
    this.canvas.setActiveObject(text);
    return text;
  }
}
