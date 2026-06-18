/**
 * PATRÓN OBSERVER
 * ───────────────────────────────────────────────────────────────────────────
 * Permite que distintas partes del sistema reaccionen automáticamente cuando
 * se genera un plan de recomendación, sin que el RecomendadorService tenga que
 * conocerlas directamente.
 *
 * Contexto en el TPO:
 * Cuando el sistema genera una recomendación, queremos que ocurran varias
 * cosas en paralelo: registrar en el log, detectar si hay sobrecarga, y
 * preparar el contexto para Ollama. En lugar de agregar esa lógica al
 * RecomendadorService (que ya tiene bastante responsabilidad), los delegamos
 * a observers independientes.
 *
 * Participantes:
 *   - EventBus         → Subject (observable): registra observers y emite eventos
 *   - PlanObserver     → interfaz base que deben implementar todos los observers
 *   - LogObserver      → ConcreteObserver: registra el evento en consola/log
 *   - SobrecargaObserver → ConcreteObserver: alerta si la carga supera disponibilidad
 *   - OllamaContextObserver → ConcreteObserver: arma el contexto para Ollama
 */

// ── Interfaz base para todos los observers ────────────────────────────────
class PlanObserver {
  /**
   * @param {string} evento  - Nombre del evento (ej: 'plan:generado')
   * @param {Object} payload - Datos del evento
   */
  update(evento, payload) {
    throw new Error(`update() debe implementarse en ${this.constructor.name}`);
  }
}

// ── Subject: bus de eventos central ──────────────────────────────────────
class EventBus {
  constructor() {
    // Map de evento → array de observers
    this._listeners = new Map();
  }

  /**
   * Registra un observer para un evento específico.
   * @param {string} evento
   * @param {PlanObserver} observer
   */
  suscribir(evento, observer) {
    if (!(observer instanceof PlanObserver)) {
      throw new TypeError('El observer debe extender PlanObserver.');
    }
    if (!this._listeners.has(evento)) {
      this._listeners.set(evento, []);
    }
    this._listeners.get(evento).push(observer);
  }

  /**
   * Elimina un observer de un evento.
   */
  desuscribir(evento, observer) {
    if (!this._listeners.has(evento)) return;
    const lista = this._listeners.get(evento).filter(o => o !== observer);
    this._listeners.set(evento, lista);
  }

  /**
   * Emite un evento y notifica a todos los observers registrados.
   * @param {string} evento
   * @param {Object} payload
   */
  emitir(evento, payload) {
    if (!this._listeners.has(evento)) return;
    for (const observer of this._listeners.get(evento)) {
      try {
        observer.update(evento, payload);
      } catch (err) {
        console.error(`[EventBus] Error en observer ${observer.constructor.name}:`, err.message);
      }
    }
  }
}

// ── ConcreteObserver 1: Log de actividad ─────────────────────────────────
class LogObserver extends PlanObserver {
  update(evento, payload) {
    const ts = new Date().toISOString();
    if (evento === 'plan:generado') {
      const { estudianteId, planId, totalRecomendadas, estrategia } = payload;
      console.log(
        `[LOG] ${ts} | plan:generado | estudiante=${estudianteId} | ` +
        `plan=${planId} | materias=${totalRecomendadas} | estrategia="${estrategia}"`
      );
    } else {
      console.log(`[LOG] ${ts} | ${evento} |`, JSON.stringify(payload));
    }
  }
}

// ── ConcreteObserver 2: Detector de sobrecarga ────────────────────────────
class SobrecargaObserver extends PlanObserver {
  update(evento, payload) {
    if (evento !== 'plan:generado') return;

    const { horasEstudio, disponibilidadEstudio, planId } = payload;
    const uso = disponibilidadEstudio > 0 ? (horasEstudio / disponibilidadEstudio) * 100 : 0;

    if (uso > 90) {
      console.warn(
        `[SOBRECARGA] Plan ${planId}: uso del ${uso.toFixed(0)}% de disponibilidad. ` +
        `Considerar reducir carga (${horasEstudio.toFixed(1)}hs estudio / ${disponibilidadEstudio.toFixed(1)}hs disponibles).`
      );
      // En un sistema real podría guardar una alerta en DB o enviar notificación
    }
  }
}

// ── ConcreteObserver 3: Contexto para Ollama ─────────────────────────────
class OllamaContextObserver extends PlanObserver {
  constructor() {
    super();
    this._ultimoContexto = null;
  }

  update(evento, payload) {
    if (evento !== 'plan:generado') return;

    const { recomendadas, noRecomendadas, estrategia, horasEstudio, horasCursada } = payload;

    // Arma el contexto que ia.service.js puede usar como base del prompt
    this._ultimoContexto = {
      estrategia,
      totalRecomendadas: recomendadas?.length || 0,
      totalRechazadas:   noRecomendadas?.length || 0,
      horasEstudio:      Number(horasEstudio || 0).toFixed(1),
      horasCursada:      Number(horasCursada || 0).toFixed(1),
      materias:          (recomendadas || []).map(m => ({
        nombre:     m.nombre,
        dificultad: m.dificultad,
        hsCursada:  m.horas_semanales,
        hsEstudio:  Number(m.horas_estudio || 0).toFixed(1)
      })),
      motivos: [...new Set((noRecomendadas || []).map(m => m.motivo_rechazo).filter(Boolean))]
    };
  }

  /** Permite que ia.service.js consulte el contexto del último plan generado. */
  getUltimoContexto() {
    return this._ultimoContexto;
  }
}

// ── Singleton: instancia compartida del EventBus ──────────────────────────
const eventBus = new EventBus();

// Registrar observers por defecto
eventBus.suscribir('plan:generado', new LogObserver());
eventBus.suscribir('plan:generado', new SobrecargaObserver());

// OllamaContextObserver se exporta por separado para que ia.service.js lo use
const ollamaContextObserver = new OllamaContextObserver();
eventBus.suscribir('plan:generado', ollamaContextObserver);

module.exports = {
  eventBus,
  ollamaContextObserver,
  // Clases exportadas para poder instanciar observers adicionales
  PlanObserver,
  LogObserver,
  SobrecargaObserver,
  OllamaContextObserver
};
