export class Particle {
    x: number;
    y: number;
    vx: number;
    vy: number;
    life: number;
    decay: number;
    color: string | null;

    constructor(x: number, y: number, color: string | null = null) {
        this.x = x;
        this.y = y;
        this.vx = (Math.random() - 0.5) * 4;
        this.vy = (Math.random() - 0.5) * 4;
        this.life = 1.0;
        this.decay = Math.random() * 0.05 + 0.02;
        this.color = color;
    }
    update(dt = 1.0) {
        this.x += this.vx * dt;
        this.y += this.vy * dt;
        this.life -= this.decay * dt;
    }
    draw(ctx: CanvasRenderingContext2D) {
        if (this.color) {
            ctx.fillStyle = this.color;
            ctx.globalAlpha = Math.max(0, this.life);
        } else {
            ctx.fillStyle = `rgba(180, 255, 255, ${Math.max(0, this.life)})`;
        }
        ctx.beginPath();
        ctx.arc(this.x, this.y, 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1.0;
    }
}

export class FloatingText {
    x: number;
    y: number;
    text: string;
    color: string;
    size: number;
    life: number;
    vy: number;

    constructor(x: number, y: number, text: string, color: string, size = 20) {
        this.x = x;
        this.y = y;
        this.text = text;
        this.color = color;
        this.size = size;
        this.life = 1.0;
        this.vy = -1.5 - Math.random();
    }
    update(dt = 1.0) {
        this.y += this.vy * dt;
        this.life -= 0.02 * dt;
    }
    draw(ctx: CanvasRenderingContext2D) {
        ctx.save();
        ctx.globalAlpha = Math.max(0, this.life);
        ctx.fillStyle = this.color;
        ctx.font = `bold ${this.size}px Inter`;
        ctx.textAlign = 'center';
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 3;
        ctx.strokeText(this.text, this.x, this.y);
        ctx.fillText(this.text, this.x, this.y);
        ctx.restore();
    }
}

export class Coin {
    x: number;
    y: number;
    vx: number;
    vy: number;
    gravity: number;
    rotation: number;
    spin: number;

    constructor(x: number, y: number) {
        this.x = x;
        this.y = y;
        this.vx = (Math.random() - 0.5) * 12;
        this.vy = -Math.random() * 15 - 5;
        this.gravity = 0.6;
        this.rotation = Math.random() * Math.PI;
        this.spin = (Math.random() - 0.5) * 0.4;
    }
    update(dt = 1.0) {
        this.x += this.vx * dt;
        this.vy += this.gravity * dt;
        this.y += this.vy * dt;
        this.rotation += this.spin * dt;
    }
    draw(ctx: CanvasRenderingContext2D) {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.scale(Math.cos(this.rotation), 1);
        ctx.beginPath();
        ctx.arc(0, 0, 10, 0, Math.PI * 2);
        let grad = ctx.createLinearGradient(-10, -10, 10, 10);
        grad.addColorStop(0, '#ffee00');
        grad.addColorStop(1, '#ff8800');
        ctx.fillStyle = grad;
        ctx.fill();
        ctx.lineWidth = 2;
        ctx.strokeStyle = '#dd6600';
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(0, 0, 6, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
    }
}
