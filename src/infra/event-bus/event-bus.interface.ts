export interface IEventBus {
  emit<T = unknown>(event: string, payload: T): boolean;
  on<T = unknown>(event: string, listener: (payload: T) => void): this;
  off<T = unknown>(event: string, listener: (payload: T) => void): this;
}
