import { EventEmitter } from "events";
import { IEventBus } from "./event-bus.interface";

export class EventBus extends EventEmitter implements IEventBus {
  private static instance: EventBus;

  private constructor() {
    super();
  }

  public static getInstance(): EventBus {
    if (!EventBus.instance) {
      EventBus.instance = new EventBus();
    }
    return EventBus.instance;
  }

  public emit<T = unknown>(event: string, payload: T): boolean {
    return super.emit(event, payload);
  }

  public on<T = unknown>(event: string, listener: (payload: T) => void): this {
    super.on(event, listener);
    return this;
  }

  public off<T = unknown>(event: string, listener: (payload: T) => void): this {
    super.off(event, listener);
    return this;
  }
}
