
# Documentación de la Aplicación: vrtelolleva

## 1. Visión General del Proyecto

**vrtelolleva** es una aplicación web integral de entrega de comida a domicilio diseñada para simular un ecosistema completo que conecta a clientes, negocios, repartidores y administradores en tiempo real.

### Características Principales

- **Paneles de Control Basados en Roles:** Interfaces de usuario personalizadas para Clientes, Negocios, Repartidores y Administradores, cada una con funcionalidades específicas para su rol.
- **Descubrimiento de Negocios por Ubicación:** Los clientes pueden ver y filtrar restaurantes cercanos a su ubicación.
- **Seguimiento de Pedidos en Tiempo Real:** Visualización en un mapa del progreso de un pedido, desde la preparación hasta la entrega.
- **Gestión Completa del Ciclo de Pedido:** Flujo completo desde la creación del pedido, aceptación por el negocio, asignación al repartidor, hasta la entrega y calificación.
- **Simulación de Backend:** Utiliza `localStorage` y una capa de servicios para simular una base de datos y una API, permitiendo que la aplicación funcione de manera autónoma en el navegador.
- **Notificaciones Push y en la App:** Un sistema de notificaciones en tiempo real para mantener a todos los usuarios informados sobre los cambios en el estado de los pedidos.

### Pila Tecnológica

- **Frontend:** React 19 con TypeScript
- **Bundler:** Vite
- **Estilos:** Tailwind CSS
- **Mapas:** Leaflet y React-Leaflet
- **Iconos:** Lucide React

---

## 2. Conceptos Clave y Flujo de Datos

### 2.1. Flujo de Autenticación

1.  Un usuario no autenticado ve la `HomePage`.
2.  Al hacer clic en "Iniciar Sesión" o intentar una acción que requiere autenticación, se abre el `AuthModal`.
3.  El usuario puede iniciar sesión o registrarse.
4.  Al registrarse, se asigna un rol (`CLIENT`, `BUSINESS`, `DELIVERY`). Las cuentas de Negocio y Repartidor se crean con un estado de aprobación `"pending"`.
5.  Tras un inicio de sesión exitoso, el componente `App.tsx` renderiza el panel de control correspondiente al rol del usuario (ej. `ClientDashboard`, `BusinessDashboard`).
6.  La información del usuario se almacena en `localStorage` para simular una sesión persistente.

### 2.2. Ciclo de Vida de un Pedido

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

### 2.3. Simulación de Datos y Backend

La aplicación no tiene un backend real. Toda la lógica de la API y la persistencia de datos se simulan en el cliente:

-   **Capa de Servicios (`services/`):** Cada archivo de servicio (ej. `orderService.ts`) exporta un objeto con métodos asíncronos (`getOrders`, `createOrder`, etc.) que simulan llamadas a una API REST. Usan `setTimeout` para emular la latencia de la red.
-   **Base de Datos (`localStorage`):** Cada servicio gestiona su propia "tabla" en `localStorage` (ej. `orderDB`, `userDB`). Los datos se inicializan con un conjunto de datos simulados (`MOCK_ORDERS_INITIAL`, etc.) si no existen.
-   **Notificaciones en Tiempo Real:** El `notificationService.ts` actúa como un bus de eventos (patrón Pub/Sub). Los componentes pueden suscribirse a notificaciones. Cuando un servicio realiza una acción importante (ej. `orderService.updateOrder`), envía una notificación a través de este servicio, que la distribuye a los componentes suscritos y al Service Worker para generar notificaciones push.

---

## 3. Estructura de Archivos y Directorios

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
├── index.css           # Estilos globales (si los hubiera)
├── index.html          # Punto de entrada HTML
├── index.tsx           # Punto de entrada de React
├── sw.js               # Service Worker para notificaciones push
├── types.ts            # Definiciones de tipos y interfaces de TypeScript
└── vite.config.ts      # Configuración de Vite
```

### Descripción de Archivos Clave

-   **`App.tsx`**: Orquesta la autenticación y renderiza el dashboard correcto según el rol del usuario. Contiene el `NotificationProvider` para notificaciones en la app.
-   **`types.ts`**: **Archivo crítico.** Define la estructura de todos los datos de la aplicación (interfaces como `Order`, `Business`, `Profile`) y los `enum` para estados (`OrderStatus`, `UserRole`).
-   **`constants.ts`**: Centraliza valores estáticos como el nombre de la aplicación, mensajes rápidos y mapeos de `enum` a texto y colores para la UI.
-   **`sw.js`**: Gestiona las notificaciones push del navegador, asegurando que los usuarios reciban alertas incluso si la pestaña de la aplicación no está activa.

---

## 4. Componentes (`/components`)

Esta sección detalla los componentes reutilizables que forman los bloques de construcción de la UI.

### 4.1. UI Genérica (`/ui`)

-   **`Button.tsx`**: Botón estilizado con variantes (`primary`, `secondary`, `danger`).
-   **`Card.tsx`**: Contenedor base con sombra y bordes redondeados.
-   **`Modal.tsx`**: Componente de modal genérico para superposiciones.
-   **`ConfirmationModal.tsx`**: Modal específico para acciones de confirmación (ej. "¿Estás seguro?").
-   **`DropdownMenu.tsx`**: Menú desplegable reutilizable.
-   **`NotificationToast.tsx`**: La UI de una notificación individual (toast).
-   **`StarRating.tsx`**: Componente interactivo de 5 estrellas para mostrar y establecer calificaciones.
-   **`StatsCard.tsx`**: Tarjeta para mostrar métricas y KPIs en los dashboards.
-   **`ToggleSwitch.tsx`**: Interruptor de tipo on/off.

### 4.2. Compartidos (`/shared`)

-   **`DashboardHeader.tsx`**: El encabezado consistente para todos los usuarios autenticados. Muestra el nombre del usuario, el título de la vista y acciones como cerrar sesión.
-   **`OrderDetailsModal.tsx`**: Un modal detallado para ver la información completa de un pedido. Usado por Negocios y Repartidores.

### 4.3. Cliente (`/client`)

-   **`BusinessCard.tsx`**: Tarjeta de resumen para un negocio en la lista principal.
-   **`BusinessFilters.tsx`**: Panel de filtros para refinar la búsqueda de negocios.
-   **`ProductCard.tsx`**: Tarjeta para un producto individual en el menú de un negocio.
-   **`ShoppingCart.tsx`**: El panel lateral del carrito de compras. Gestiona la lista de productos, cálculo de total, selección de ubicación en mapa, y el proceso de finalización del pedido, incluyendo la generación del mensaje de WhatsApp.
-   **`RatingModal.tsx`**: Modal que permite a los clientes calificar un pedido completado.
-   **`OrderDetailsModal.tsx`**: Versión del modal de detalles para el cliente.

### 4.4. Negocio (`/business`)

-   **`BusinessOrderCard.tsx`**: Tarjeta que representa un pedido activo, con acciones para aceptarlo, rechazarlo o marcarlo como listo.
-   **`ProductFormModal.tsx`**: Formulario modal para crear o editar un producto en el menú del negocio.
-   **`BusinessProfile.tsx`**: Vista completa para que el negocio edite su perfil, incluyendo nombre, dirección, ubicación en el mapa, y subida de documentos.

### 4.5. Mapas (`/maps`)

-   **`OrderTrackingMap.tsx`**: Componente de mapa centralizado y reutilizable. Muestra las ubicaciones del cliente, negocio y repartidor, traza rutas y proporciona una interfaz para mensajes rápidos.

---

## 5. Páginas (`/pages`)

Estos son los componentes de nivel superior que representan las vistas principales de la aplicación.

-   **`HomePage.tsx`**: La página de inicio para visitantes. Muestra promociones, productos populares y una lista de negocios. Sirve como portal para iniciar sesión/registrarse.
-   **`ClientDashboard.tsx`**: El centro de operaciones para el cliente. Gestiona el estado de la vista actual (comprando, viendo un negocio, rastreando un pedido, etc.) y contiene la lógica principal para la interacción del cliente.
-   **`BusinessDetailPage.tsx`**: Muestra el perfil completo y el menú de un negocio seleccionado, permitiendo al cliente agregar productos al carrito.
-   **`PizzaBuilderPage.tsx`**: Una interfaz dedicada para que los clientes personalicen pizzas configurables.
-   **`MyOrdersPage.tsx`**: Permite al cliente ver su historial de pedidos, rastrear pedidos activos y calificar los completados.
-   **`BusinessDashboard.tsx`**: El panel de control para dueños de negocios. Permite gestionar pedidos entrantes, editar el menú de productos (`ProductFormModal`), ver el historial de pedidos, y editar el perfil del negocio (`BusinessProfile`).
-   **`DeliveryDashboard.tsx`**: El panel para repartidores. Muestra una lista de pedidos listos para recoger, permite aceptar entregas, muestra el mapa de seguimiento para la entrega activa (`OrderTrackingMap`), y permite gestionar su perfil y documentos.
-   **`AdminDashboard.tsx`**: La vista más compleja, para administradores. Ofrece una visión general con estadísticas y un mapa en vivo. Incluye módulos para gestionar usuarios (activar/desactivar), negocios (aprobar/rechazar) y repartidores (aprobar/rechazar/asignar a negocios). También presenta un panel de estadísticas detalladas con gráficos.

---

## 6. Servicios (`/services`)

Esta capa simula un backend y es responsable de toda la manipulación de datos.

-   **`authService.ts`**: Gestiona la "tabla" de usuarios. Lógica de `login`, `register`, `logout`, `getCurrentUser`, `updateUser`.
-   **`businessService.ts`**: Gestiona los datos de los negocios. `getAllBusinesses`, `getBusinessById`, `updateBusiness`, `registerBusiness`.
-   **`deliveryService.ts`**: Gestiona los datos de los repartidores. `getAllDeliveryPeople`, `updateDeliveryPerson`, `registerDeliveryPerson`.
-   **`orderService.ts`**: Gestiona los datos de los pedidos. `getOrders`, `createOrder`, `updateOrder`, `addMessageToOrder`. Es fundamental para el flujo principal de la aplicación.
-   **`productService.ts`**: Gestiona los productos asociados a los negocios. `getProductsByBusinessId`, `addProduct`, `updateProduct`, `deleteProduct`.
-   **`notificationService.ts`**: No gestiona datos persistentes. Es un bus de eventos en memoria que desacopla la comunicación entre los componentes y el service worker.

---

## 7. Hooks (`/hooks`)

Lógica de estado y efectos secundarios reutilizables.

-   **`useBusinessFilter.ts`**: Encapsula toda la lógica de filtrado para la lista de negocios (búsqueda por texto, categorías, rating, etc.).
-   **`useNotification.tsx`**: Proporciona un contexto de React para que cualquier componente pueda acceder a la lista de notificaciones activas y al método para descartarlas.
-   **`usePushNotifications.tsx`**: Abstrae la lógica para verificar el soporte y el permiso de las notificaciones push del navegador.

---

## 8. Utilidades (`/utils`)

Funciones puras y de ayuda.

-   **`locationUtils.ts`**: Contiene la función `calculateDistance` que implementa la fórmula de Haversine para calcular la distancia entre dos coordenadas geográficas.
-   **`deliveryFeeCalculator.ts`**: Lógica de negocio para calcular el costo de envío, ya sea usando una tarifa fija del negocio o calculándola dinámicamente por distancia.
-   **`imageCompressor.ts`**: Utilidad para comprimir imágenes del lado del cliente antes de "subirlas", usando `canvas`. Esto es crucial para mejorar el rendimiento y reducir el uso de datos.
