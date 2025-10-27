// @ts-check
import { defineConfig } from 'astro/config';

import react from '@astrojs/react';

import tailwindcss from '@tailwindcss/vite';

// https://astro.build/config
export default defineConfig({
  integrations: [react()],

  vite: {
    plugins: [tailwindcss()],
    server: {
      headers: {
        // Prevenir clickjacking
        'X-Frame-Options': 'DENY',
        // Prevenir MIME type sniffing
        'X-Content-Type-Options': 'nosniff',
        // Activar protección XSS del navegador
        'X-XSS-Protection': '1; mode=block',
        // Controlar el referrer
        'Referrer-Policy': 'strict-origin-when-cross-origin',
        // Controlar permisos del navegador
        'Permissions-Policy': 'geolocation=(), microphone=(), camera=()',
        // Forzar HTTPS (HSTS)
        'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
        // Prevenir políticas cross-domain
        'X-Permitted-Cross-Domain-Policies': 'none',
        // Prevenir caché de datos sensibles
        'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
        'Pragma': 'no-cache',
        // Content Security Policy
        'Content-Security-Policy': [
          "default-src 'self'",
          // unsafe-inline y unsafe-eval necesarios para React, Leaflet y Chart.js
          "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
          "style-src 'self' 'unsafe-inline'",
          // Permitir tiles de mapas y imágenes externas
          "img-src 'self' data: https: http:",
          // Permitir conexión a la API
          "connect-src 'self' https://aguatrasparenteapi-h2d4gvbcfvcjfycr.eastus2-01.azurewebsites.net",
          "font-src 'self' data:",
          "object-src 'none'",
          "base-uri 'self'",
          "form-action 'self'",
          "frame-ancestors 'none'"
        ].join('; ')
      }
    }
  },
});