// File: /apps/client/src/custom.d.ts (NUEVO ARCHIVO)

// Este archivo le dice a TypeScript cómo tratar los archivos CSS Modules.
// Declara que cualquier importación de un archivo que termine en .module.css
// exportará por defecto un objeto donde las claves y los valores son strings.
declare module '*.module.css' {
  const classes: { readonly [key: string]: string };
  export default classes;
}