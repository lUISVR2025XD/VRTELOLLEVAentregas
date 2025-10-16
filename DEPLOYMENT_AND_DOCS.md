
# Guía de Implementación y Documentación: vrtelolleva

**Nota:** Puedes convertir fácilmente este archivo a un documento PDF utilizando herramientas en línea gratuitas (buscando "Markdown to PDF") o usando extensiones en tu editor de código (como "Markdown PDF" para VS Code).

---

## Parte 1: Guía de Implementación en Hostinger

Implementar este proyecto en una plataforma como Hostinger es un proceso directo. Dado que la aplicación está construida con React y Vite, el objetivo es generar los archivos estáticos (HTML, CSS, JavaScript) y subirlos a tu servidor de hosting.

### Prerrequisitos

1.  **Cuenta de Hostinger:** Debes tener un plan de hosting activo y un dominio asociado.
2.  **Archivos del Proyecto:** El código fuente completo de la aplicación en tu computadora.
3.  **Node.js y npm:** Necesarios para ejecutar los comandos de construcción del proyecto en tu máquina local.

---

### Paso 1: Preparar el Proyecto para Producción (en tu Computadora)

Antes de subir los archivos, necesitas compilar la aplicación. Este proceso transforma tu código de React y TypeScript en archivos optimizados que los navegadores pueden ejecutar directamente.

1.  **Abre una Terminal:** Navega a la carpeta raíz de tu proyecto (donde se encuentran `package.json` y `vite.config.ts`).

2.  **Instala las Dependencias:** Si aún no lo has hecho, ejecuta este comando para instalar todos los paquetes necesarios.
    ```bash
    npm install
    ```

3.  **Configura tu Clave de API de Gemini (¡Crítico!):**
    Tu aplicación necesita una clave de API para funcionar. Vite está configurado para tomar esta clave de un archivo de entorno durante el proceso de construcción.
    -   En la carpeta raíz de tu proyecto, crea un archivo llamado `.env`.
    -   Dentro de este archivo, agrega la siguiente línea, reemplazando `TU_CLAVE_REAL_DE_API` con tu clave de Gemini:
        ```
        GEMINI_API_KEY=TU_CLAVE_REAL_DE_API
        ```
    -   **Seguridad:** Asegúrate de que el archivo `.env` esté listado en tu `.gitignore` para que nunca se suba a un repositorio público.

4.  **Construye el Proyecto:** Ejecuta el siguiente comando en tu terminal:
    ```bash
    npm run build
    ```
    Vite compilará tu aplicación y creará una nueva carpeta llamada `dist` en la raíz de tu proyecto. Esta carpeta contiene todo lo que necesitas subir a Hostinger.

---

### Paso 2: Comprimir los Archivos para Subir

La forma más fácil y rápida de subir los archivos es comprimiéndolos.

1.  Abre la carpeta `dist` en tu explorador de archivos.
2.  Selecciona **todos los archivos y carpetas que están DENTRO** de `dist` (no la carpeta `dist` en sí).
3.  Haz clic derecho y selecciona "Comprimir" o "Enviar a > Carpeta comprimida (en zip)".
4.  Nombra el archivo ZIP como `vrtelolleva-build.zip`.

---

### Paso 3: Subir y Descomprimir los Archivos en Hostinger

Ahora, usaremos el panel de control de Hostinger (hPanel).

1.  **Inicia Sesión en Hostinger** y ve a tu hPanel.
2.  **Busca el Administrador de Archivos:** En la sección "Archivos", haz clic en "Administrador de Archivos".
3.  **Navega a `public_html`:** Esta es la carpeta raíz de tu sitio web. Si existen archivos por defecto de Hostinger (como `default.php`), puedes eliminarlos.
4.  **Sube tu Archivo ZIP:**
    -   En la barra de herramientas superior, haz clic en el ícono de "Subir" (Upload).
    -   Selecciona "Archivo" y elige el archivo `vrtelolleva-build.zip` que creaste.
5.  **Descomprime el Archivo:**
    -   Haz clic derecho sobre el archivo ZIP subido y selecciona "Extraer" (Extract).
    -   Como destino de la extracción, simplemente escribe `.` (un punto) para extraer los archivos en la carpeta actual (`public_html`).

---

### Paso 4: Verificación Final

1.  **Abre tu Sitio Web:** Ve a tu dominio (ej. `www.tudominio.com`). Tu aplicación "vrtelolleva" debería cargarse y funcionar correctamente.
2.  **Solución de Problemas:**
    -   **Página en blanco o error 404:** Asegúrate de que los archivos se extrajeron directamente en `public_html`. Tu `index.html` debe estar en `public_html/index.html`.
    -   **La aplicación no funciona como se espera:** Abre las herramientas de desarrollador (F12) y revisa la pestaña "Consola" en busca de errores. Un error común es que la clave de API no se incluyó correctamente durante el `npm run build`.

---
---

## Parte 2: Documentación Técnica de la Aplicación

### 1. Visión General del Proyecto

**vrtelolleva** es una aplicación web integral de entrega de comida a domicilio diseñada para simular un ecosistema completo que conecta a clientes, negocios, repartidores y administradores en tiempo real.

#### Características Principales

- **Paneles de Control Basados en Roles:** Interfaces de usuario personalizadas para Clientes, Negocios, Repartidores y Administradores, cada una con funcionalidades específicas para su rol.
- **Descubrimiento de Negocios por Ubicación:** Los clientes pueden ver y filtrar restaurantes cercanos a su ubicación.
- **Seguimiento de Pedidos en Tiempo Real:** Visualización en un mapa del progreso de un pedido, desde la preparación hasta la entrega.
- **Gestión Completa del Ciclo de Pedido:** Flujo completo desde la creación del pedido, aceptación por el negocio, asignación al repartidor, hasta la entrega y calificación.
- **Simulación de Backend:** Utiliza `localStorage` y una capa de servicios para simular una base de datos y una API, permitiendo que la aplicación funcione de manera autónoma en el navegador.
- **Notificaciones Push y en la App:** Un sistema de notificaciones en tiempo real para mantener a todos los usuarios informados sobre los cambios en el estado de los pedidos.

#### Pila Tecnológica

- **Frontend:** React 19 con TypeScript
- **Bundler:** Vite
- **Estilos:** Tailwind CSS
- **Mapas:** Leaflet y React-Leaflet
- **Iconos:** Lucide React

---

### 2. Conceptos Clave y Flujo de Datos

#### 2.1. Flujo de Autenticación

1.  Un usuario no autenticado ve la `HomePage`.
2.  Al hacer clic en "Iniciar Sesión" o intentar una acción que requiere autenticación, se abre el `AuthModal`.
3.  El usuario puede iniciar sesión o registrarse.
4.  Al registrarse, se asigna un rol (`CLIENT`, `BUSINESS`, `DELIVERY`). Las cuentas de Negocio y Repartidor se crean con un estado de aprobación `"pending"`.
5.  Tras un inicio de sesión exitoso, el componente `App.tsx` renderiza el panel de control correspondiente al rol del usuario (ej. `ClientDashboard`, `BusinessDashboard`).
6.  La información del usuario se almacena en `localStorage` para simular una sesión persistente.

#### 2.2. Ciclo de Vida de un Pedido

1.  **Creación (Cliente):** Un cliente navega por los menús en `BusinessDetailPage`, agrega productos al `ShoppingCart` y realiza el pedido. El pedido se crea con estado `PENDING`.
2.  **Notificación (Negocio):** El negocio recibe una notificación de un nuevo pedido y lo ve en su `BusinessDashboard`.
3.  **Aceptación/Rechazo (Negocio):** El negocio puede aceptar o rechazar el pedido.
    -   Si se **acepta**, el estado cambia a `IN_PREPARATION`. El negocio establece un tiempo de preparación. El cliente es notificado.
    -   Si se **rechaza**, el estado cambia a `REJECTED`. El cliente es notificado.
4.  **Listo para Recoger (Negocio):** Una vez preparado, el negocio marca el pedido como `READY_FOR_PICKUP`.
5.  **Disponibilidad (Repartidor):** El pedido aparece en la lista de pedidos disponibles en el `DeliveryDashboard` para los repartidores cercanos o afiliados.
6.  **Asignación (Repartidor):** Un repartidor acepta el pedido. El estado cambia a `ON_THE_WAY`. El cliente es notificado y ahora puede ver al repartidor en el mapa.
7.  **Entrega (Repartidor):** El repartidor entrega el pedido y lo marca como `DELIVERED`.
8.  **Finalización (Cliente):** El cliente recibe una notificación de entrega. El pedido pasa al historial (`MyOrdersPage`) y el cliente tiene la opción de calificar al negocio y al repartidor.

#### 2.3. Simulación de Datos y Backend

La aplicación no tiene un backend real. Toda la lógica de la API y la persistencia de datos se simulan en el cliente:

-   **Capa de Servicios (`services/`):** Cada archivo de servicio (ej. `orderService.ts`) exporta un objeto con métodos asíncronos (`getOrders`, `createOrder`, etc.) que simulan llamadas a una API REST. Usan `setTimeout` para emular la latencia de la red.
-   **Base de Datos (`localStorage`):** Cada servicio gestiona su propia "tabla" en `localStorage` (ej. `orderDB`, `userDB`). Los datos se inicializan con un conjunto de datos simulados (`MOCK_ORDERS_INITIAL`, etc.) si no existen.
-   **Notificaciones en Tiempo Real:** El `notificationService.ts` actúa como un bus de eventos (patrón Pub/Sub). Los componentes pueden suscribirse a notificaciones. Cuando un servicio realiza una acción importante (ej. `orderService.updateOrder`), envía una notificación a través de este servicio, que la distribuye a los componentes suscritos y al Service Worker para generar notificaciones push.

---

### 3. Estructura de Archivos y Directorios

```
/
├── components/
│   ├── client/         # Componentes para el dashboard del cliente
│   ├── business/       # Componentes para el dashboard del negocio
│   ├── maps/           # Componentes relacionados con mapas
│   ├── shared/         # Componentes reutilizados en múltiples dashboards
│   └── ui/             # Elementos de UI genéricos (Button, Card, Modal)
├── hooks/              # Hooks de React personalizados
├── pages/              # Componentes de página de nivel superior (dashboards)
├── services/           # Simulación de la capa de API/backend
├── utils/              # Funciones de utilidad reutilizables
├── App.tsx             # Componente raíz de la aplicación
├── constants.ts        # Constantes y mapeos de la aplicación
├── index.html          # Punto de entrada HTML
├── index.tsx           # Punto de entrada de React
├── sw.js               # Service Worker para notificaciones push
├── types.ts            # Definiciones de tipos y interfaces de TypeScript
└── vite.config.ts      # Configuración de Vite
```

#### Descripción de Archivos Clave

-   **`App.tsx`**: Orquesta la autenticación y renderiza el dashboard correcto según el rol del usuario. Contiene el `NotificationProvider` para notificaciones en la app.
-   **`types.ts`**: **Archivo crítico.** Define la estructura de todos los datos de la aplicación (interfaces como `Order`, `Business`, `Profile`) y los `enum` para estados (`OrderStatus`, `UserRole`).
-   **`constants.ts`**: Centraliza valores estáticos como el nombre de la aplicación, mensajes rápidos y mapeos de `enum` a texto y colores para la UI.
-   **`sw.js`**: Gestiona las notificaciones push del navegador, asegurando que los usuarios reciban alertas incluso si la pestaña de la aplicación no está activa.

---

### 4. Componentes (`/components`)

#### 4.1. UI Genérica (`/ui`)

-   **`Button.tsx`**: Botón estilizado con variantes.
-   **`Card.tsx`**: Contenedor base con sombra y bordes.
-   **`Modal.tsx`**: Componente de modal genérico.
-   **`ConfirmationModal.tsx`**: Modal específico para acciones de confirmación.
-   **`DropdownMenu.tsx`**: Menú desplegable.
-   **`NotificationToast.tsx`**: La UI de una notificación individual.
-   **`StarRating.tsx`**: Componente interactivo de 5 estrellas.
-   **`StatsCard.tsx`**: Tarjeta para mostrar métricas y KPIs.
-   **`ToggleSwitch.tsx`**: Interruptor de tipo on/off.

#### 4.2. Compartidos (`/shared`)

-   **`DashboardHeader.tsx`**: El encabezado consistente para todos los usuarios autenticados.
-   **`OrderDetailsModal.tsx`**: Modal detallado para ver la información completa de un pedido.

#### 4.3. Cliente (`/client`)

-   **`BusinessCard.tsx`**: Tarjeta de resumen para un negocio.
-   **`BusinessFilters.tsx`**: Panel de filtros para la búsqueda de negocios.
-   **`ProductCard.tsx`**: Tarjeta para un producto individual en un menú.
-   **`ShoppingCart.tsx`**: Panel lateral del carrito de compras. Gestiona la lista de productos, cálculo de total, selección de ubicación en mapa y la generación del mensaje de WhatsApp.
-   **`RatingModal.tsx`**: Modal para calificar un pedido completado.

#### 4.4. Negocio (`/business`)

-   **`BusinessOrderCard.tsx`**: Tarjeta que representa un pedido activo, con acciones para gestionarlo.
-   **`ProductFormModal.tsx`**: Formulario modal para crear o editar un producto.
-   **`BusinessProfile.tsx`**: Vista para que el negocio edite su perfil, ubicación y documentos.

#### 4.5. Mapas (`/maps`)

-   **`OrderTrackingMap.tsx`**: Componente de mapa centralizado y reutilizable. Muestra ubicaciones, rutas y permite enviar mensajes rápidos.

---

### 5. Páginas (`/pages`)

-   **`HomePage.tsx`**: Página de inicio para visitantes.
-   **`ClientDashboard.tsx`**: Centro de operaciones para el cliente.
-   **`BusinessDetailPage.tsx`**: Muestra el menú de un negocio.
-   **`PizzaBuilderPage.tsx`**: Interfaz para personalizar pizzas.
-   **`MyOrdersPage.tsx`**: Historial de pedidos del cliente.
-   **`BusinessDashboard.tsx`**: Panel de control para dueños de negocios.
-   **`DeliveryDashboard.tsx`**: Panel para repartidores.
-   **`AdminDashboard.tsx`**: Panel de administración con gestión de usuarios, negocios, repartidores y estadísticas.

---

### 6. Servicios (`/services`)

Capa que simula un backend y manipula los datos en `localStorage`.

-   **`authService.ts`**: Gestión de usuarios y sesiones.
-   **`businessService.ts`**: Gestión de datos de negocios.
-   **`deliveryService.ts`**: Gestión de datos de repartidores.
-   **`orderService.ts`**: Gestión del ciclo de vida de los pedidos.
-   **`productService.ts`**: Gestión de productos de los negocios.
-   **`notificationService.ts`**: Bus de eventos para notificaciones en tiempo real.

---

### 7. Hooks (`/hooks`)

-   **`useBusinessFilter.ts`**: Encapsula la lógica de filtrado de negocios.
-   **`useNotification.tsx`**: Provee un contexto para las notificaciones en la app.
-   **`usePushNotifications.tsx`**: Abstrae la lógica de las notificaciones push del navegador.

---

### 8. Utilidades (`/utils`)

-   **`locationUtils.ts`**: Contiene la función `calculateDistance` (fórmula de Haversine).
-   **`deliveryFeeCalculator.ts`**: Lógica para calcular el costo de envío (fijo o por distancia).
-   **`imageCompressor.ts`**: Utilidad para comprimir imágenes en el cliente antes de "subirlas".
