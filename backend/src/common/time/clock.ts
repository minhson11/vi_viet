export interface Clock {
  now(): Date;
}

export const CLOCK_PORT = Symbol('ClockPort');

export class SystemClock implements Clock {
  now(): Date {
    return new Date();
  }
}
