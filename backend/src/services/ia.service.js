const PlanModel = require('../models/plan.model');

const OLLAMA_URL   = process.env.OLLAMA_URL   || 'http://localhost:11434';
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || 'llama3.1';

const IaService = {
  async explicar(planId) {
    const plan = await PlanModel.findById(planId);
    if (!plan) throw new Error('Plan no encontrado.');
    const prompt = this._construirPrompt(plan);
    try {
      const respuesta = await this._llamarOllama(prompt);
      if (respuesta) {
        await PlanModel.updateExplicacion(planId, respuesta, plan.horas_estudio_semanales);
        return { fuente: 'ollama', texto: respuesta };
      }
    } catch (err) {
      console.warn('[IA] Ollama no disponible, usando fallback:', err.message);
    }
    return { fuente: 'reglas', texto: plan.explicacion_ia || 'No hay explicación disponible.' };
  },

  _construirPrompt(plan) {
    const rec = plan.materias.filter(m => m.recomendada);
    const rej = plan.materias.filter(m => !m.recomendada);
    return `Eres un asistente académico universitario. Explica en español, de forma clara y amigable (máximo 150 palabras), por qué se recomienda esta planificación:

Estrategia: ${plan.estrategia || 'equilibrada'}
Materias recomendadas:
${rec.map(m => `- ${m.nombre} (${m.dificultad}, ${m.horas_cursada}hs cursada + ${Number(m.horas_estudio).toFixed(1)}hs estudio)`).join('\n') || 'Ninguna'}

Materias no recomendadas:
${rej.slice(0, 5).map(m => `- ${m.nombre}: ${m.motivo_rechazo}`).join('\n') || 'Ninguna'}

Carga total: ${plan.horas_estudio_semanales?.toFixed(1) || 0}hs/semana.
Responde directamente, sin encabezados, en tono cercano.`;
  },

  async _llamarOllama(prompt) {
    const urls = [
      `${OLLAMA_URL}/api/generate`,
      `${OLLAMA_URL.replace('localhost', '127.0.0.1')}/api/generate`
    ];

    for (const url of urls) {
      const controller = new AbortController();
      const tid = setTimeout(() => controller.abort(), 60000);
      try {
        const r = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ model: OLLAMA_MODEL, prompt, stream: false }),
          signal: controller.signal
        });
        clearTimeout(tid);
        if (!r.ok) throw new Error(`Ollama status ${r.status}`);
        const d = await r.json();
        return d.response || null;
      } catch (e) {
        clearTimeout(tid);
        if (url === urls[urls.length - 1]) throw e;
      }
    }
  }
};

module.exports = IaService;