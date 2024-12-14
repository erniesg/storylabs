export class WavRenderer {
    static drawBars(
      canvas: HTMLCanvasElement,
      ctx: CanvasRenderingContext2D,
      values: Float32Array,
      color: string,
      barWidth: number = 10,
      minHeight: number = 0,
      scale: number = 8
    ) {
      const width = canvas.width;
      const height = canvas.height;
      const bars = Math.floor(width / barWidth);
      const step = Math.floor(values.length / bars);
  
      ctx.fillStyle = color;
      
      for (let i = 0; i < bars; i++) {
        const value = values[i * step];
        const barHeight = Math.max(value * height * scale, minHeight);
        const x = i * barWidth;
        const y = (height - barHeight) / 2;
        
        ctx.fillRect(x, y, barWidth - 2, barHeight);
      }
    }
  }