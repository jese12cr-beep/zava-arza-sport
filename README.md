# ARZA SPORT™ — Equipaciones Deportivas Personalizadas By Grupo Zava

**Sitio Web Público Activo:** [https://jese12cr-beep.github.io/zava-arza-sport/](https://jese12cr-beep.github.io/zava-arza-sport/)

Aplicación web estática 100% autónoma de personalización deportiva en tiempo real con motor WebGL (`Three.js`), compositing UV en HTML5 Canvas, 13 moldes industriales `.mirl` + patronaje 2D escala `1:1`, uniforme de portero obligatorio en manga larga, configurador de guantes 3D (`.glb`) y asistente guiado de 4 pasos.

- **Sitio público activo (Sin depender de tu PC):** [https://jese12cr-beep.github.io/zava-arza-sport/](https://jese12cr-beep.github.io/zava-arza-sport/)
- **Código madre (Repositorio GitHub):** [https://github.com/jese12cr-beep/zava-arza-sport](https://github.com/jese12cr-beep/zava-arza-sport) (rama `main`)
- **Despliegue automático:** Cada `git push` a `main` ejecuta `.github/workflows/deploy.yml` en GitHub Actions y publica `./dist` en GitHub Pages en ~30 segundos.

---

## Arquitectura del Proyecto

```text
zava-arza-sport/
├── .github/workflows/deploy.yml  # CI/CD automático hacia GitHub Pages
├── AGENTS.md                     # Reglas de aislamiento para futuras sesiones
├── public/                       # Activos estáticos (modelos .mirl, .fish, /fabrics/*.png)
├── src/
│   ├── components/
│   │   ├── brand/                # Logotipo oficial ARZA SPORT y muestras de tela
│   │   └── studio/               # Asistente de 4 pasos, Modo Pro y Pliegos 2D RIP
│   ├── engine/
│   │   ├── compositor/           # Compositor UV 2D/2.5D y exportación CAD/SVG
│   │   ├── core/                 # Estado inmutable, tejidos PBR, paleta y cajas delimitadoras
│   │   └── viewer3d/             # Escena Three.js, mallas .mirl/.glb y luces de estudio
│   └── utils/assetUrl.js         # Resolución automática de rutas para subruta GitHub Pages
└── vite.config.js                # Configuración de compilación con base dinámica
```

---

## Flujo de Trabajo Recomendado (GitHub First)

En futuras sesiones de desarrollo puedes clonar o sincronizar directamente el repositorio en GitHub sin depender de un servidor encendido en tu PC:

```bash
git clone https://github.com/jese12cr-beep/zava-arza-sport.git
cd zava-arza-sport
npm ci
npm run lint
npm run build
git push origin main
```
