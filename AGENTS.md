# AGENTS.md — ARZA SPORT™ by Grupo Zava (`zava-arza-sport`)

## Fuente de Verdad e Infraestructura Autónoma
- **Repositorio madre:** `https://github.com/jese12cr-beep/zava-arza-sport.git` (rama principal `main`).
- **URL pública en producción:** `https://jese12cr-beep.github.io/zava-arza-sport/` (servida por GitHub Pages mediante `.github/workflows/deploy.yml`).
- **Cero dependencia de PC como servidor:** Toda funcionalidad corre del lado del cliente (`Three.js` + `Canvas` + activos estáticos bajo `public/` usando `resolveAssetUrl`). No dejes servidores locales (`npm run dev` / `vite preview`) corriendo en segundo plano en la PC al finalizar una sesión. Al terminar cambios validados, compila, ejecuta `npm run lint` y `npm run build`, y sube a `origin/main` para desplegar en la nube.

## Aislamiento Entre Proyectos
- Este repositorio (`zava-arza-sport`) es completamente independiente de proyectos previos (como `sport-custom-studio` / `atletiq-studio`) y no debe mezclar commits, rutas ni branding heredado (`public/sitemap.xml`, `public/robots.txt`, `src/utils/assetUrl.js`).
- **Preservación del motor 3D (`src/engine/`):** Mantén intacta la arquitectura modular del visor (`GarmentCanvas3D.jsx`, `mirlModelLoader.js`, `glbModelLoader.js`, `LayerStack25DViewer.jsx`, `fishPartCompositor.js`, `fabricTexturesPBR.js`, `boundingBoxMath.js`, `designStore.js`) para poder reutilizar esta base en proyectos dedicados futuros (por ejemplo, una página independiente enfocada en gorras escaneadas 3D y piezas modulares).
