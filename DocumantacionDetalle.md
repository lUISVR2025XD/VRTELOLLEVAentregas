# Documentación Detallada de la Aplicación: vrtelolleva

## 1. Introducción y Filosofía de Diseño

**vrtelolleva** es más que una simple aplicación de UI; es una simulación de un ecosistema completo de entrega de comida. Su objetivo principal es demostrar la interacción compleja entre múltiples roles de usuario (Clientes, Negocios, Repartidores, Administradores) dentro de un flujo de trabajo en tiempo real.

La filosofía central es operar **sin un backend real** (`backendless`), simulando todas las operaciones de la base de datos y la comunicación en tiempo real directamente en el navegador del cliente. Esto se logra a través de tres pilares arquitectónicos:

1.  **Capa de Servicios (`/services`):** Actúa como un SDK (Software Development Kit) falso para una API. Cada servicio (`orderService`, `authService`, etc.) expone métodos asíncronos que imitan las llamadas a un servidor, utilizando `setTimeout` para simular la latencia de la red.
2.  **Persistencia en `localStorage`:** Cada servicio gestiona su propia "tabla" de base de datos como una cadena JSON en el `localStorage` del navegador. Esto permite que el estado de la aplicación persista entre recargas de página, simulando una base de datos real.
3.  **Bus de Eventos para "Tiempo Real" (`notificationService`):** Este servicio es el corazón de las interacciones en tiempo real. Funciona como un sistema de publicación/suscripción (Pub/Sub). Cuando una acción ocurre (ej. un negocio acepta un pedido), el servicio correspondiente publica una notificación. Otros componentes de la aplicación (posiblemente en una sesión de navegador diferente, simulada por diferentes roles) que están suscritos a ese tipo de evento, reaccionan y actualizan su UI.

El archivo `types.ts` es la **única fuente de verdad** para la estructura de todos los datos, garantizando la coherencia en toda la aplicación.

---

## 2. Flujo de Operaciones Detallado por Rol

### 2.1. El Visitante (No Autenticado)

-   **Punto de Entrada:** `HomePage.tsx`.
-   **Capacidades:**
    -   **Exploración Pasiva:** Puede ver promociones destacadas, productos populares y una lista de negocios cercanos. La ubicación se solicita al navegador o se utiliza una ubicación por defecto.
    -   **Búsqueda y Filtrado:** Puede utilizar la barra de búsqueda y los filtros (`BusinessFilters`) para explorar los restaurantes disponibles.
-   **El "Muro" de Autenticación:** Cualquier acción que requiera un estado de usuario (hacer clic en un negocio, agregar un producto al carrito, etc.) no procede directamente. En su lugar, invoca la función `onLoginRequest`, que activa el `AuthModal.tsx`. Esto asegura que solo los usuarios autenticados puedan interactuar con el sistema de pedidos.

### 2.2. El Cliente (`ClientDashboard.tsx`)

Este es el panel más dinámico, gestionando múltiples "vistas" dentro de un solo componente.

#### a) Flujo de Compra (`shopping` y `businessDetail`)

1.  **Descubrimiento:** El cliente comienza en la vista de `shopping`, que es similar a la `HomePage` pero con funcionalidad completa. Utiliza `useBusinessFilter.ts` para una experiencia de filtrado interactiva.
2.  **Selección de Negocio:** Al hacer clic en una `BusinessCard`, el estado de la vista cambia a `businessDetail`, renderizando `BusinessDetailPage.tsx`. La información del negocio seleccionado se pasa como prop.
3.  **Exploración del Menú:** El cliente puede buscar productos dentro del menú del negocio.
4.  **Personalización de Pizza:** Si un producto está marcado como `is_configurable_pizza`, en lugar de agregarlo directamente al carrito, se abre la vista `pizzaBuilder` (`PizzaBuilderPage.tsx`), que permite una personalización detallada.
5.  **Agregar al Carrito (`handleAddToCart`):**
    -   Se comprueba si el carrito está vacío o si el nuevo producto es del mismo negocio que los productos ya existentes.
    -   **Conflicto de Negocios:** Si el producto es de un negocio diferente, se muestra un modal de confirmación (`isClearCartModalVisible`) para preguntar al usuario si desea vaciar el carrito actual y comenzar uno nuevo.
    -   Se agrega el `CartItem` al estado del carrito.

#### b) Carrito y Finalización del Pedido (`ShoppingCart.tsx`)

1.  **Visualización:** El carrito se muestra como un panel lateral. Lista todos los `CartItem`, permite ajustar cantidades o eliminarlos.
2.  **Cálculo de Envío (`deliveryFeeCalculator.ts`):** El costo de envío se calcula dinámicamente cada vez que la ubicación de entrega en el mapa cambia. Utiliza la tarifa fija del negocio si está definida; de lo contrario, calcula por distancia usando `locationUtils.ts`. Un `setTimeout` simula el cálculo asíncrono.
3.  **Selección de Ubicación:** Se utiliza un componente de mapa interactivo (`LocationPicker`) que permite al cliente hacer clic para establecer su punto de entrega exacto.
4.  **Realizar Pedido y Generación de Mensaje de WhatsApp:**
    -   Al hacer clic en "Realizar Pedido", se ejecuta `handlePlaceOrderClick`.
    -   Se construye un objeto `Order` con estado `PENDING`.
    -   **Lógica Clave de WhatsApp:** Se genera un mensaje de texto formateado que incluye: nombre del negocio, lista detallada de productos con precios, subtotal, ubicación de entrega (con coordenadas y un enlace de Google Maps), notas especiales y forma de pago.
    -   Este mensaje se codifica para URL (`encodeURIComponent`).
    -   Se abre una nueva pestaña del navegador con una URL de `https://wa.me/...`, que abre directamente una conversación de WhatsApp con el número de teléfono predefinido, con el mensaje del pedido ya escrito y listo para enviar.
    -   Simultáneamente, la función `onPlaceOrder` se llama para registrar el pedido en el sistema de simulación local.
    -   El estado del carrito se limpia.

#### c) Seguimiento del Pedido (`tracking`)

1.  **Activación:** Esta vista se activa si un usuario inicia sesión y tiene un pedido en estado "rastreable" o cuando un pedido nuevo cambia a un estado rastreable.
2.  **Visualización en Mapa (`OrderTrackingMap.tsx`):** Muestra la ubicación del negocio, la ubicación de entrega del cliente y la ubicación del repartidor.
3.  **Simulación de Movimiento:** Un `setInterval` en `ClientDashboard.tsx` actualiza la posición del repartidor, moviéndola gradualmente hacia la ubicación del cliente para simular el trayecto en tiempo real.
4.  **Temporizador de Preparación:** Cuando un pedido pasa a `IN_PREPARATION`, se inicia un temporizador de cuenta regresiva visible para el cliente, basado en el `preparation_time` establecido por el negocio.
5.  **Mensajes Rápidos:** El cliente puede enviar mensajes predefinidos al repartidor, lo que actualiza el objeto del pedido y envía una notificación al rol `DELIVERY`.

### 2.3. El Negocio (`BusinessDashboard.tsx`)

#### a) Gestión de Pedidos (`orders`)

1.  **Notificación:** Al recibir un pedido (`PENDING`), una notificación (`new_order`) activa una actualización de datos.
2.  **`BusinessOrderCard.tsx`:** Muestra la información esencial del pedido.
3.  **Aceptación:** Al hacer clic en "Aceptar", se abre `AcceptOrderModal`. Aquí, el negocio **debe** establecer el tiempo estimado de preparación y puede confirmar o ajustar la tarifa de envío. Al confirmar, el estado del pedido cambia a `IN_PREPARATION`.
4.  **Rechazo:** Cambia el estado a `REJECTED`.
5.  **Marcar como Listo:** Cuando la comida está lista, el negocio cambia el estado a `READY_FOR_PICKUP`. Esto desencadena una notificación para los repartidores.

#### b) Gestión del Menú (`products`) y Perfil (`profile`)

-   **CRUD de Productos:** El negocio tiene control total sobre su menú. Puede agregar, editar y eliminar productos a través del `ProductFormModal.tsx`.
-   **Gestión de Perfil (`BusinessProfile.tsx`):** Permite al negocio actualizar su información de contacto, dirección, y **muy importante**, su ubicación en el mapa. También pueden subir documentos (menús en PDF, flyers) que serían revisados por un administrador en una aplicación real.

### 2.4. El Repartidor (`DeliveryDashboard.tsx`)

#### a) Disponibilidad y Aceptación de Pedidos (`available`)

1.  **Estado en Línea:** El repartidor debe estar "En Línea" (usando el `ToggleSwitch`) para ver y aceptar pedidos.
2.  **Visualización de Pedidos:** La vista muestra una lista de todos los pedidos en estado `READY_FOR_PICKUP` que no han sido asignados.
3.  **Aceptación:** Al aceptar un pedido, el repartidor se asigna a sí mismo (`delivery_person_id`), y el estado del pedido cambia a `ON_THE_WAY`. Esto cambia la vista del repartidor a `active`.

#### b) Entrega Activa (`active`)

1.  **Mapa de Navegación:** La vista se centra en el `OrderTrackingMap.tsx`, mostrando la ruta desde el negocio hasta el cliente.
2.  **Comunicación:** Puede enviar y recibir mensajes rápidos del cliente.
3.  **Marcar como Entregado:** Al llegar al destino y entregar el producto, el repartidor marca el pedido como `DELIVERED`, finalizando el ciclo de entrega.

### 2.5. El Administrador (`AdminDashboard.tsx`)

Este es el panel de control omnisciente, con capacidades de supervisión y gestión.

1.  **Visión General:** Muestra KPIs clave y un mapa de actividad en vivo que rastrea a todos los repartidores y negocios.
2.  **Gestión de Usuarios:** Puede activar/desactivar cualquier cuenta de usuario o cambiar su rol (excepto a Admin).
3.  **Gestión de Negocios y Repartidores (Flujo de Aprobación):**
    -   El administrador ve las solicitudes de registro en estado `pending`.
    -   Puede **aprobar** una solicitud, lo que cambia `approvalStatus` a `'approved'` y `isActive` a `true`, desbloqueando la funcionalidad completa para ese usuario.
    -   Puede **rechazar** una solicitud, cambiando `approvalStatus` a `'rejected'`.
4.  **Asignación de Repartidores:** Una funcionalidad clave es la capacidad de asignar un repartidor a un negocio específico (`adscrito_al_negocio_id`). Esto podría usarse para modelos donde los negocios tienen su propia flota.
5.  **Estadísticas:** Una vista dedicada para analizar el rendimiento de la plataforma con filtros por fecha, negocio y repartidor, y visualizaciones de datos.

---

## 3. Arquitectura Técnica Detallada

### 3.1. Sistema de Notificaciones

-   **`notificationService.ts`**: Es un singleton (una única instancia) que mantiene un `Set` de funciones *listener*.
    -   `subscribe(listener)`: Agrega una función a la lista.
    -   `sendNotification(notification)`: Itera sobre todos los listeners y los invoca con el objeto de notificación. Además, utiliza `navigator.serviceWorker.ready` para enviar la misma notificación al Service Worker a través de `postMessage`.
-   **`useNotification.tsx`**: Un Context Provider de React que se suscribe al `notificationService` y gestiona un estado (`useState`) de las notificaciones activas. El `NotificationContainer` consume este contexto para renderizar los `NotificationToast`.
-   **`sw.js` (Service Worker):**
    -   Escucha el evento `message` para las notificaciones enviadas desde la aplicación principal (cuando la pestaña está abierta).
    -   Escucha el evento `push` para notificaciones push reales (no implementado en esta simulación, pero el código está listo).
    -   Usa `self.registration.showNotification()` para mostrar la notificación nativa del sistema operativo.
    -   El evento `notificationclick` se encarga de enfocar la ventana de la aplicación si está abierta, o abrir una nueva si no lo está.

### 3.2. Lógica de Mapas

-   **`OrderTrackingMap.tsx`:** Es el componente central. Recibe las ubicaciones como props.
-   **Ajuste Automático de Vista (`fitBounds`):** Un `useEffect` clave monitorea los cambios en las ubicaciones. Cuando cambian, crea un `L.latLngBounds` que abarca todos los puntos y utiliza `map.fitBounds()` para hacer zoom y centrar el mapa automáticamente, manteniendo todos los marcadores importantes a la vista.
-   **`MapController`:** Un pequeño componente hijo que se utiliza para acceder programáticamente a la instancia del mapa de Leaflet, una técnica común en `react-leaflet` para ejecutar comandos imperativos en el mapa.

### 3.3. Compresión de Imágenes

-   **`utils/imageCompressor.ts`**: Antes de "subir" una imagen (es decir, antes de guardarla como una URL de datos en el estado/localStorage), esta utilidad la procesa.
-   **Funcionamiento:**
    1.  Carga la imagen en un elemento `<img>` en memoria.
    2.  Dibuja la imagen en un `<canvas>` con dimensiones reducidas si es necesario.
    3.  Utiliza `canvas.toBlob()` con calidad `image/jpeg` para exportar la imagen.
    4.  Comprueba el tamaño del `Blob`. Si es demasiado grande, reduce la calidad y vuelve a intentarlo recursivamente hasta alcanzar el tamaño deseado.
    5.  Devuelve un nuevo objeto `File`, que es mucho más pequeño que el original.
