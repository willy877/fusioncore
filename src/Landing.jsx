export default function Landing() {
  return (
    <div className="bg-neutral-950 text-white min-h-screen">

      {/* HERO */}
      <section className="flex flex-col items-center justify-center text-center px-6 py-32">
        <h1 className="text-6xl font-bold mb-6">
          Fusion Core
        </h1>

        <p className="text-xl text-gray-400 max-w-2xl mb-8">
          Un ecosistema digital donde convergen Social, Gaming y Nova AI.
          Una sola plataforma. Un solo núcleo.
        </p>

        <div className="flex gap-4">
          <a
            href="/register"
            className="bg-white text-black px-6 py-3 rounded-xl font-semibold"
          >
            Comenzar
          </a>

          <a
            href="/login"
            className="border border-white px-6 py-3 rounded-xl"
          >
            Ya tengo cuenta
          </a>
        </div>
      </section>

      {/* SECCIÓN SOCIAL */}
      <section className="px-8 py-20 bg-neutral-900 text-center">
        <h2 className="text-3xl font-bold mb-4">Social</h2>
        <p className="text-gray-400 max-w-2xl mx-auto">
          Comunidades, chats en tiempo real, perfiles avanzados y conexión
          inteligente entre usuarios.
        </p>
      </section>

      {/* SECCIÓN GAMING */}
      <section className="px-8 py-20 text-center">
        <h2 className="text-3xl font-bold mb-4">Gaming</h2>
        <p className="text-gray-400 max-w-2xl mx-auto">
          Rankings, estadísticas, historial de partidas y reputación híbrida
          usuario + IA.
        </p>
      </section>

      {/* SECCIÓN NOVA */}
      <section className="px-8 py-20 bg-neutral-900 text-center">
        <h2 className="text-3xl font-bold mb-4">Nova AI</h2>
        <p className="text-gray-400 max-w-2xl mx-auto">
          Un asistente inteligente integrado que aprende, recomienda y
          potencia tu experiencia dentro del ecosistema.
        </p>
      </section>

      {/* FOOTER */}
      <footer className="text-center py-10 text-gray-500 text-sm">
        © 2026 Fusion Core. All rights reserved.
      </footer>
    </div>
  );
}

