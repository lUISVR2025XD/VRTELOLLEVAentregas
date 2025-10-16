# Guía de Implementación: Desplegar "vrtelolleva" en Firebase Hosting

Firebase Hosting es una excelente opción para desplegar aplicaciones web modernas como esta. Ofrece un rendimiento rápido a través de su CDN global, SSL gratuito y un proceso de implementación muy sencillo.

**Nota:** Aunque a veces se le llama "Firebase Studio", la herramienta web oficial es la **Consola de Firebase** (Firebase Console). Esta guía utiliza la consola y las herramientas de línea de comandos de Firebase (Firebase CLI).

### Prerrequisitos

1.  **Cuenta de Google:** Necesitarás una para crear un proyecto de Firebase.
2.  **Node.js y npm:** Deben estar instalados en tu computadora.
3.  **Firebase CLI:** Las herramientas de línea de comandos de Firebase. Si no las tienes, el primer paso te mostrará cómo instalarlas.

---

### Paso 1: Crear un Proyecto en la Consola de Firebase

1.  **Ve a la Consola de Firebase:** Abre [https://console.firebase.google.com/](https://console.firebase.google.com/) e inicia sesión.
2.  **Crea un Nuevo Proyecto:** Haz clic en "**Agregar proyecto**".
3.  **Nombra tu Proyecto:** Dale un nombre único (ej. `vrtelolleva-app`) y acepta los términos.
4.  **Google Analytics (Opcional):** Para un despliegue simple, puedes deshabilitar Google Analytics por ahora.
5.  **Finaliza la Creación:** Haz clic en "**Crear proyecto**" y espera a que Firebase lo configure.

---

### Paso 2: Instalar e Iniciar Sesión con Firebase CLI

La CLI (Interfaz de Línea de Comandos) te permite gestionar tu proyecto de Firebase desde tu terminal.

1.  **Abre una Terminal** en tu computadora.
2.  **Instala Firebase CLI:** Ejecuta el siguiente comando. La bandera `-g` lo instala globalmente.
    ```bash
    npm install -g firebase-tools
    ```
3.  **Inicia Sesión en Firebase:** Ejecuta este comando.
    ```bash
    firebase login
    ```
    Se abrirá una ventana en tu navegador para que inicies sesión y autorices a la CLI.

---

### Paso 3: Inicializar Firebase en tu Proyecto Local

Ahora, conecta tu código local con el proyecto que creaste en Firebase.

1.  **Navega a la Raíz de tu Proyecto:** En tu terminal, asegúrate de estar en la carpeta principal de `vrtelolleva` (donde está `package.json`).
2.  **Inicia la Configuración:** Ejecuta el siguiente comando:
    ```bash
    firebase init
    ```
3.  **Responde a las Preguntas de la CLI:**
    *   `Are you ready to proceed?` -> **Y** (Sí)
    *   `Which Firebase features do you want to set up?` -> Usa las flechas y la barra espaciadora para seleccionar **Hosting: Configure files for Firebase Hosting...**. Presiona Enter.
    *   `Please select an option:` -> Selecciona **Use an existing project**.
    *   `Select a default Firebase project for this directory:` -> Elige el proyecto que creaste en el Paso 1 (ej. `vrtelolleva-app`).
    *   `What do you want to use as your public directory?` -> **Escribe `dist` y presiona Enter.** (¡Este es el paso más importante! Vite construye los archivos en la carpeta `dist`).
    *   `Configure as a single-page app (rewrite all urls to /index.html)?` -> **y** (Sí). (Esto es fundamental para que el enrutamiento de React funcione).
    *   `Set up automatic builds and deploys with GitHub?` -> **N** (No, para esta guía manual).

    Al finalizar, se crearán dos archivos nuevos en tu proyecto: `.firebaserc` y `firebase.json`.

---

### Paso 4: Construir el Proyecto para Producción

Este paso compila tu aplicación y se asegura de que la clave de API esté incluida.

1.  **Configura tu Clave de API de Gemini:**
    *   Crea un archivo llamado `.env` en la raíz de tu proyecto si no existe.
    *   Añade tu clave: `GEMINI_API_KEY=TU_CLAVE_REAL_DE_API`.

2.  **Construye el Proyecto:** Ejecuta el comando de construcción de Vite.
    ```bash
    npm run build
    ```
    Esto generará (o actualizará) la carpeta `dist` con los archivos optimizados listos para ser desplegados.

---

### Paso 5: Desplegar la Aplicación

Con todo configurado y construido, el despliegue es un solo comando.

1.  **Ejecuta el Comando de Despliegue:** En la misma terminal, en la raíz de tu proyecto, ejecuta:
    ```bash
    firebase deploy
    ```
2.  **Espera a que Finalice:** La CLI subirá los archivos de tu carpeta `dist` a Firebase Hosting. Al terminar, te mostrará un mensaje de éxito y la URL de tu sitio.

---

### Paso 6: ¡Verifica tu Sitio en Vivo!

1.  **Abre la URL:** La salida en la terminal incluirá una `Hosting URL`. Cópiala y pégala en tu navegador.
    ```
    ✔  Deploy complete!

    Project Console: https://console.firebase.google.com/project/vrtelolleva-app/overview
    Hosting URL: https://vrtelolleva-app.web.app
    ```
2.  **¡Listo!** Tu aplicación `vrtelolleva` ahora está en vivo en internet, servida a través de la red global de Firebase.