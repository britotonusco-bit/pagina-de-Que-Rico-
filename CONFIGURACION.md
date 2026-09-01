# La Esquina del Sabor — Sistema completo

## Archivos
- index.html — página del cliente.
- script.js — menú, carrito, checkout, WhatsApp y pedidos.
- estilos.css — estilos de la página.
- panel.html — panel privado para administrar pedidos desde celular o computador.
- panel.js / panel.css — funcionamiento y estilos del panel.
- config.js — URL y clave pública de Supabase.
- supabase.sql — crea la tabla, seguridad y función de seguimiento.

## Configuración
1. Crea un proyecto en Supabase.
2. Abre SQL Editor y ejecuta `supabase.sql`.
3. En Authentication > Users crea el correo y contraseña que usarás para el panel.
4. Abre `config.js` y coloca:
   - `url`: Project URL de Supabase.
   - `anonKey`: Publishable/anon key pública.
5. Sube TODOS los archivos a la misma carpeta de tu hosting.
6. Abre `panel.html` desde tu celular e inicia sesión.

## Seguridad
- No coloques la `service_role key` en ningún archivo del sitio.
- El cliente solo puede insertar pedidos.
- El cliente no tiene acceso directo a la tabla de pedidos.
- El seguimiento público usa un token privado incluido en el enlace.
- Solo usuarios autenticados pueden consultar y modificar pedidos desde el panel.

## Flujo
Cliente -> pedido -> "En verificación" -> WhatsApp.
Administrador -> valida/invalida -> preparación -> camino -> entregado.
Cliente -> enlace de seguimiento -> estado actualizado.

## Importante
Los precios y productos continúan siendo los del catálogo que ya veníamos trabajando. Los datos bancarios y números de WhatsApp que estaban pendientes deben reemplazarse por los reales.
