type EventCallback = () => void;

class DataEventEmitter {
  private listeners: Map<string, Set<EventCallback>> = new Map();

  on(event: string, callback: EventCallback): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback);

    // Return unsubscribe function
    return () => {
      this.listeners.get(event)?.delete(callback);
    };
  }

  emit(event: string): void {
    this.listeners.get(event)?.forEach((callback) => callback());
  }
}

export const dataEvents = new DataEventEmitter();

// Event names
export const EVENTS = {
  CLIENTE_CREATED: "cliente:created",
  CLIENTE_UPDATED: "cliente:updated",
  CLIENTE_DELETED: "cliente:deleted",
  TRATAMIENTO_CREATED: "tratamiento:created",
  TRATAMIENTO_UPDATED: "tratamiento:updated",
  TRATAMIENTO_DELETED: "tratamiento:deleted",
  TURNO_CREATED: "turno:created",
} as const;
