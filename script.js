/* ============================================================
   LA ESQUINA DEL SABOR
   Script principal — versión ordenada
   ============================================================ */

/* =========================
   1. CONFIGURACIÓN
   ========================= */
const CONFIG = {
  cajaPorPedido: 2000,

  // REEMPLAZA estos números por los WhatsApp reales.
  whatsapp: {
    punto1: "573000000001",
    punto2: "573122064661",
    punto3: "573208687782"
  },

  // Punto 1 NO hace domicilios.
  sucursales: {
    Centro: { punto: 1, domicilios: false, whatsapp: "punto1", ciudad:"Dosquebradas", direccion:"Manzana 10, Casa 16, Bombay 3" },
    Cuba: { punto: 2, domicilios: true, whatsapp: "punto2", ciudad:"Dosquebradas", direccion:"Calle 49 # 19-27, Barrio El Modelo" },
    Circunvalar: { punto: 3, domicilios: true, whatsapp: "punto3", ciudad:"Pereira", direccion:"Carrera 20 # 21-26, Barrio Providencia" }
  },

  tarifasDomicilio: {
    "Centro Pereira": 5000,
    "Cuba": 5000,
    "Circunvalar": 6000,
    "Alamos": 6000,
    "Dosquebradas Centro": 8000,
    "Dosquebradas - La Pradera": 8500,
    "Dosquebradas - La Badea": 9000,
    "Cerritos": 9000,
    "Cerritos - Zona rural": 12000
  }
};

const productos = [
  {id:"papa-tradicional",cat:"Papas rellenas",icon:"🥔",nombre:"Papa Rellena Tradicional",desc:"Papa rellena con carne, arroz y especias.",precio:5000},
  {id:"papa-especial",cat:"Papas rellenas",icon:"🥔",nombre:"Papa Rellena Especial",desc:"Papa rellena con carne, queso e ingredientes especiales.",precio:7000},
  {id:"mega-carne",cat:"Mega empanadas de 30 cm",icon:"🥟",nombre:"Mega Empanada de Carne",desc:"Mega empanada de 30 cm rellena de carne.",precio:12000},
  {id:"mega-pollo",cat:"Mega empanadas de 30 cm",icon:"🥟",nombre:"Mega Empanada de Pollo",desc:"Mega empanada de 30 cm rellena de pollo.",precio:12000},
  {id:"mega-mixta",cat:"Mega empanadas de 30 cm",icon:"🥟",nombre:"Mega Empanada Mixta",desc:"Carne, pollo y queso en 30 cm de sabor.",precio:14000},
  {id:"mega-especial",cat:"Mega empanadas de 30 cm",icon:"🥟",nombre:"Mega Empanada Especial",desc:"Combinación especial de nuestros mejores ingredientes.",precio:16000},
  {id:"emp-carne",cat:"Empanadas",icon:"🥟",nombre:"Empanada de Carne",desc:"Empanada tradicional de carne.",precio:3000},
  {id:"emp-pollo",cat:"Empanadas",icon:"🥟",nombre:"Empanada de Pollo",desc:"Empanada tradicional de pollo.",precio:3000},
  {id:"emp-queso",cat:"Empanadas",icon:"🥟",nombre:"Empanada de Queso",desc:"Empanada rellena de queso.",precio:3500},
  {id:"emp-mixta",cat:"Empanadas",icon:"🥟",nombre:"Empanada Mixta",desc:"Deliciosa combinación de carne y pollo.",precio:4000},
  {id:"emp-carne-queso",cat:"Empanadas",icon:"🥟",nombre:"Empanada de Carne y Queso",desc:"Carne y queso en una sola empanada.",precio:4000},
  {id:"emp-pollo-queso",cat:"Empanadas",icon:"🥟",nombre:"Empanada de Pollo y Queso",desc:"Pollo y queso, recién preparada.",precio:4000},
  {id:"emp-especial",cat:"Empanadas",icon:"🥟",nombre:"Empanada Especial",desc:"Nuestra combinación especial.",precio:5000},
  {id:"arepa-huevo",cat:"Arepas",icon:"🫓",nombre:"Arepa de Huevo",desc:"Arepa tradicional con huevo.",precio:5000}
];

let carrito = JSON.parse(localStorage.getItem("carritoLaEsquina") || "[]");
let pedidoActual = null;
let modalidadEntrega = null;

/* =========================
   2. UTILIDADES
   ========================= */
function dinero(valor) {
  return "$" + Number(valor || 0).toLocaleString("es-CO");
}

function escapar(texto) {
  return String(texto ?? "").replace(/[&<>"']/g, c => ({
    "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"
  }[c]));
}

function guardarCarrito() {
  localStorage.setItem("carritoLaEsquina", JSON.stringify(carrito));
}

function obtenerZonasPorCiudad(ciudad) {
  const zonas = {
    Pereira: ["Centro Pereira","Cuba","Circunvalar","Alamos","Cerritos","Cerritos - Zona rural"],
    Dosquebradas: ["Dosquebradas Centro","Dosquebradas - La Pradera","Dosquebradas - La Badea"]
  };
  return zonas[ciudad] || [];
}

/* =========================
   3. MENÚ
   ========================= */
function filtrarProductos() {
  const q = document.getElementById("buscador").value.toLowerCase().trim();
  document.querySelectorAll(".product").forEach(card => {
    card.style.display = card.dataset.name.includes(q) ? "" : "none";
  });
  document.querySelectorAll(".menu-category").forEach(group => {
    const visibles = [...group.querySelectorAll(".product")].some(x => x.style.display !== "none");
    group.style.display = visibles ? "" : "none";
  });
}

/* =========================
   4. CARRITO
   ========================= */
function agregar(id) {
  const p = productoPorId(id);
  if (!p) return;

  const item = carrito.find(x => x.id === id);
  if (item) item.cantidad++;
  else carrito.push({id, cantidad:1});

  guardarCarrito();
  renderCarrito();
  abrirCarrito();
}

function cambiarCantidad(id, delta) {
  const item = carrito.find(x => x.id === id);
  if (!item) return;

  item.cantidad += delta;
  if (item.cantidad <= 0) carrito = carrito.filter(x => x.id !== id);

  guardarCarrito();
  renderCarrito();
}

function eliminar(id) {
  carrito = carrito.filter(x => x.id !== id);
  guardarCarrito();
  renderCarrito();
}

function calcular() {
  const subtotal = carrito.reduce((total, item) => {
    const p = productoPorId(item.id);
    return total + (p ? p.precio * item.cantidad : 0);
  }, 0);

  let empaque = 0;
  let domicilio = 0;

  if (modalidadEntrega === "domicilio") {
    empaque = carrito.length ? CONFIG.cajaPorPedido : 0;
    const zona = document.getElementById("clienteZona")?.value || "";
    domicilio = CONFIG.tarifasDomicilio[zona] || 0;
  }

  if (modalidadEntrega === "recoger") {
    const empaqueSeleccionado = document.querySelector('input[name="empaque"]:checked')?.value;
    empaque = empaqueSeleccionado === "caja" ? CONFIG.cajaPorPedido : 0;
  }

  return {subtotal, empaque, domicilio, total:subtotal + empaque + domicilio};
}

function renderCarrito() {
  const box = document.getElementById("carritoItems");
  const c = calcular();

  document.getElementById("contadorCarrito").textContent =
    carrito.reduce((s,i) => s + i.cantidad, 0);

  document.getElementById("subtotal").textContent = dinero(c.subtotal);
  document.getElementById("empaque").textContent = dinero(c.empaque);
  document.getElementById("domicilio").textContent = dinero(c.domicilio);
  document.getElementById("total").textContent = dinero(c.total);

  if (!carrito.length) {
    box.innerHTML = `<div class="cart-empty"><div>🛒</div><p>Tu carrito está vacío.</p><small>Agrega productos del menú para comenzar.</small></div>`;
    return;
  }

  const itemsValidos = carrito.filter(i => productoPorId(i.id));
  if(itemsValidos.length !== carrito.length){
    carrito = itemsValidos;
    guardarCarrito();
  }

  box.innerHTML = carrito.map(i => {
    const p = productoPorId(i.id);
    if(!p) return "";
    return `
      <div class="cart-row">
        <div>
          <h4>${p.icon} ${escapar(p.nombre)}</h4>
          <small>${dinero(p.precio)} c/u</small>
          <div class="qty">
            <button onclick="cambiarCantidad('${p.id}',-1)">−</button>
            <strong>${i.cantidad}</strong>
            <button onclick="cambiarCantidad('${p.id}',1)">+</button>
            <button class="remove" onclick="eliminar('${p.id}')">Eliminar</button>
          </div>
        </div>
        <strong>${dinero(p.precio * i.cantidad)}</strong>
      </div>
    `;
  }).join("");
}

function abrirCarrito() {
  document.getElementById("overlayCarrito").classList.remove("hidden");
}
function cerrarCarrito() {
  document.getElementById("overlayCarrito").classList.add("hidden");
}

function agregarMasProductos() {
  cerrarCarrito();
  document.getElementById("menu")?.scrollIntoView({behavior:"smooth", block:"start"});
}

function borrarTodoElCarrito() {
  if (!carrito.length) {
    alert("Tu carrito ya está vacío.");
    return;
  }
  if (!confirm("¿Seguro que quieres borrar todos los productos del carrito?")) return;
  carrito = [];
  guardarCarrito();
  renderCarrito();
}
function cerrarSiOverlay(e) {
  if (e.target.id === "overlayCarrito") cerrarCarrito();
}

/* =========================
   5. CHECKOUT
   ========================= */
function abrirCheckout() {
  if (!v4GetPunto()) {
    mostrarSelectorSucursal();
    alert("Primero selecciona una sucursal.");
    return;
  }
  if (!carrito.length) {
    alert("Agrega al menos un producto al carrito.");
    return;
  }

  cerrarCarrito();
  document.getElementById("overlayCheckout").classList.remove("hidden");
  mostrarPaso("checkoutPaso1");
}

function cerrarCheckout() {
  document.getElementById("overlayCheckout").classList.add("hidden");
}

function mostrarPaso(id) {
  ["checkoutPaso1","checkoutPaso2","checkoutPasoPago","checkoutResultado"].forEach(x => {
    document.getElementById(x).classList.add("hidden");
  });
  document.getElementById(id).classList.remove("hidden");
}

function cargarZonas() {
  const ciudad = document.getElementById("clienteCiudad").value;
  const zona = document.getElementById("clienteZona");

  zona.innerHTML = '<option value="">Selecciona tu barrio o zona</option>';

  obtenerZonasPorCiudad(ciudad).forEach(nombre => {
    const option = document.createElement("option");
    option.value = nombre;
    option.textContent = nombre;
    zona.appendChild(option);
  });

  actualizarDomicilio();
}

function actualizarDomicilio() {
  const zona = document.getElementById("clienteZona").value;
  const valor = CONFIG.tarifasDomicilio[zona] || 0;
  const aviso = document.getElementById("avisoDomicilio");

  aviso.classList.toggle("hidden", !zona);
  document.getElementById("valorDomicilio").textContent = dinero(valor);
  renderCarrito();
}

function mostrarPago(e) {
  e.preventDefault();

  if (!modalidadEntrega) {
    alert("Selecciona domicilio o recoger en sucursal.");
    return;
  }

  const nombre = document.getElementById("clienteNombre").value.trim();
  const telefono = document.getElementById("clienteTelefono").value.trim();
  const nota = document.getElementById("clienteNota").value.trim();

  if (!nombre || !telefono || !nota) {
    alert("Completa nombre, teléfono y observaciones. Si no tienes observaciones, escribe 'Ninguna'.");
    return;
  }

  if (modalidadEntrega === "domicilio") {
    const ciudad = document.getElementById("clienteCiudad").value;
    const zona = document.getElementById("clienteZona").value;
    const direccion = document.getElementById("clienteDireccion").value.trim();
    const sucursalDom = document.getElementById("clienteSucursalDomicilio").value;

    if (!ciudad || !zona || !direccion || !sucursalDom) {
      alert("Completa ciudad, barrio/zona, dirección y selecciona el punto que prepara el domicilio.");
      return;
    }
    if (!V4_PUNTOS[sucursalDom]?.domicilios) {
      alert("Para domicilio debes seleccionar el Punto 2 o el Punto 3.");
      return;
    }
  }

  if (modalidadEntrega === "recoger") {
    const sucursal = document.getElementById("clienteSucursal").value;
    if (!sucursal) {
      alert("Selecciona la sucursal donde recogerás.");
      return;
    }
    const incompatibles = carrito.filter(item => {
      const producto = productoPorId(item.id);
      return !producto || !producto.puntos?.includes(sucursal);
    });
    if (incompatibles.length) {
      alert("Hay productos de tu carrito que no están disponibles en esa sucursal. Cambia el punto de recogida o elimina esos productos.");
      return;
    }
  }

  pedidoActual = {
    numero: nuevoNumeroPedido(),
    cliente: datosCliente(),
    modalidad: modalidadEntrega,
    items: carrito.map(i => ({...i})),
    ...calcular()
  };

  document.getElementById("resumenCheckout").innerHTML = resumenCompletoHTML();
  mostrarPaso("checkoutPaso2");
}

function volverEntrega() {
  mostrarPaso("checkoutPaso1");
}

function irAlPago() {
  mostrarPaso("checkoutPasoPago");
}

function datosCliente() {
  return {
    nombre: document.getElementById("clienteNombre").value.trim(),
    telefono: document.getElementById("clienteTelefono").value.trim(),
    direccion: document.getElementById("clienteDireccion").value.trim(),
    ciudad: document.getElementById("clienteCiudad").value,
    zona: document.getElementById("clienteZona").value,
    sucursal: modalidadEntrega === "domicilio"
      ? document.getElementById("clienteSucursalDomicilio").value
      : document.getElementById("clienteSucursal").value,
    empaque: document.querySelector('input[name="empaque"]:checked')?.value || "caja",
    nota: document.getElementById("clienteNota").value.trim()
  };
}

function nuevoNumeroPedido() {
  const n = Number(localStorage.getItem("ultimoPedidoLaEsquina") || "0") + 1;
  localStorage.setItem("ultimoPedidoLaEsquina", String(n));
  return String(n).padStart(6,"0");
}

function listaPedidoTexto() {
  return pedidoActual.items.map(i => {
    const p = productoPorId(i.id);
    return `${i.cantidad} x ${p.nombre} — ${dinero(p.precio)} c/u = ${dinero(p.precio * i.cantidad)}`;
  }).join("\n");
}

function resumenCompletoHTML() {
  const p = pedidoActual;
  const c = p;

  const entrega = p.modalidad === "domicilio"
    ? `🛵 Domicilio<br>Ciudad: ${escapar(p.cliente.ciudad)}<br>Zona: ${escapar(p.cliente.zona)}<br>Dirección: ${escapar(p.cliente.direccion)}`
    : `🏪 Recoger en sucursal: ${escapar(p.cliente.sucursal)}`;

  return `
    <div class="summary-section"><strong>🧾 Pedido #${escapar(p.numero)}</strong></div>
    <div class="summary-section"><strong>👤 Cliente:</strong> ${escapar(p.cliente.nombre)}<br>📱 ${escapar(p.cliente.telefono)}</div>
    <div class="summary-section"><strong>📍 Entrega</strong><br>${entrega}</div>
    <div class="summary-section"><strong>🍽️ Productos</strong>${p.items.map(i => {
      const x = productoPorId(i.id);
      return `<div class="summary-line"><span>${i.cantidad} × ${escapar(x.nombre)}<small>${dinero(x.precio)} c/u</small></span><strong>${dinero(x.precio*i.cantidad)}</strong></div>`;
    }).join("")}</div>
    <div class="summary-line"><span>Empaque</span><strong>${p.cliente.empaque === "bolsa" && p.modalidad === "recoger" ? "Bolsa — $0" : "Caja — " + dinero(c.empaque)}</strong></div>
    <div class="summary-line"><span>Domicilio</span><strong>${dinero(c.domicilio)}</strong></div>
    <div class="summary-line total"><span>TOTAL</span><strong>${dinero(c.total)}</strong></div>
  `;
}

/* =========================
   6. PAGOS + WHATSAPP
   ========================= */
function seleccionarPago(metodo) {
  pedidoActual.metodo = metodo;

  if (metodo === "transferencia") {
    const datosTransferencia = `
      <div class="payment-info">
        <h3>🏦 Datos para transferencia</h3>
        <p>Transfiere exactamente <strong>${dinero(pedidoActual.total)}</strong>.</p>
        <div class="bank-data">
          <div><span>Banco</span><strong>Bancolombia</strong></div>
          <div><span>Llave de cuenta</span><strong>CONFIGURA_AQUI_LA_LLAVE</strong></div>
          <div><span>Nequi</span><strong>CONFIGURA_AQUI_EL_NUMERO</strong></div>
        </div>
        <p class="warning">Después del pago, envía el comprobante por WhatsApp. El pedido quedará 🟡 EN VERIFICACIÓN hasta que el negocio lo valide.</p>
      </div>`;

    document.getElementById("checkoutResultado").innerHTML = `
      ${datosTransferencia}
      <button class="primary-btn full" onclick="enviarPedidoYComprobante()">📲 Enviar pedido y comprobante</button>
      <button class="secondary-btn full" onclick="mostrarReciboPendiente()">Ver resumen</button>`;
  } else {
    document.getElementById("checkoutResultado").innerHTML = `
      <div class="success">
        <div class="success-icon">🧾</div>
        <span class="order-code">Pedido #${pedidoActual.numero}</span>
        <h2>Pedido listo para enviar</h2>
        ${resumenCompletoHTML()}
        <p><strong>💵 Total a pagar: ${dinero(pedidoActual.total)}</strong></p>
      </div>
      <button class="primary-btn full" onclick="enviarPedidoEfectivo()">📲 Enviar pedido al WhatsApp</button>`;
  }

  mostrarPaso("checkoutResultado");
}

function numeroWhatsAppParaPedido() {
  const sucursal = pedidoActual?.cliente?.sucursal || v4GetPunto();
  const cfg = CONFIG.sucursales[sucursal];
  return cfg ? CONFIG.whatsapp[cfg.whatsapp] : CONFIG.whatsapp.punto2;
}

function mensajePedido(estadoPago) {
  const p = pedidoActual;
  const modalidad = p.modalidad === "domicilio" ? "🛵 DOMICILIO" : "🏪 RECOGER EN SUCURSAL";

  return `*LA ESQUINA DEL SABOR — PEDIDO #${p.numero}*

👤 *CLIENTE*
Nombre: ${p.cliente.nombre}
Teléfono: ${p.cliente.telefono}

📍 *ENTREGA*
Modalidad: ${modalidad}
${p.modalidad === "domicilio"
  ? `Ciudad: ${p.cliente.ciudad}
Zona: ${p.cliente.zona}
Dirección: ${p.cliente.direccion}`
  : `Sucursal: ${p.cliente.sucursal}`}

🍽️ *PRODUCTOS*
${listaPedidoTexto()}

📦 Empaque: ${p.cliente.empaque === "bolsa" && p.modalidad === "recoger" ? "Bolsa — $0" : "Caja — " + dinero(p.empaque)}
🛵 Domicilio: ${dinero(p.domicilio)}
💰 *TOTAL: ${dinero(p.total)}*

💳 Método: ${p.metodo === "transferencia" ? "Transferencia" : "Efectivo"}
🟡 *ESTADO: ${estadoPago}*

📝 Observación: ${p.cliente.nota || "Sin observaciones"}`;
}

function abrirWhatsApp(numero, mensaje) {
  const url = `https://wa.me/${numero}?text=${encodeURIComponent(mensaje)}`;
  window.open(url, "_blank");
}

async function enviarPedidoYComprobante() {
  const btn=event?.currentTarget;
  if(btn){btn.disabled=true;btn.textContent="Guardando pedido…";}
  await guardarPedidoEnNube();
  const numero = numeroWhatsAppParaPedido();
  abrirWhatsApp(numero, mensajePedido("PAGO REALIZADO — COMPROBANTE PENDIENTE DE VERIFICACIÓN") +
    "\n\n⚠️ *ADJUNTA AQUÍ EL COMPROBANTE DE TRANSFERENCIA.*");
  mostrarPantallaVerificacion();
}

async function enviarPedidoEfectivo() {
  await guardarPedidoEnNube();
  abrirWhatsApp(numeroWhatsAppParaPedido(), mensajePedido("PAGO EN EFECTIVO — PENDIENTE DE ENTREGA"));
  mostrarPantallaVerificacion("efectivo");
}

function mostrarPantallaVerificacion(metodo = "transferencia") {
  const url = enlaceSeguimientoNube();

  document.getElementById("checkoutResultado").innerHTML = `
    <div class="verification-screen">
      <div class="status-icon yellow">🟡</div>
      <span class="order-code">Pedido #${pedidoActual.numero}</span>
      <h2>Pedido en verificación</h2>
      <p>Tu pedido fue enviado al negocio.</p>
      <p>${metodo === "transferencia"
        ? "Recibimos el aviso de pago. El negocio verificará el comprobante antes de validar el pedido."
        : "El pedido fue recibido y el negocio continuará con la preparación."}</p>
      <div class="status-note">No cierres esta información si necesitas consultar el número de pedido.</div>
      <button class="secondary-btn full" onclick="copiarSeguimiento()">🔗 Copiar enlace de seguimiento</button>
      <button class="primary-btn full" onclick="cerrarYLimpiar()">Finalizar</button>
    </div>`;

  localStorage.setItem(`pedido_${pedidoActual.numero}`, JSON.stringify({
    estado: "verificacion",
    numero: pedidoActual.numero
  }));
}

function mostrarReciboPendiente() {
  document.getElementById("checkoutResultado").innerHTML = `
    <div class="receipt">
      <span class="eyebrow">Pedido #${pedidoActual.numero}</span>
      <h2>Resumen</h2>
      ${resumenCompletoHTML()}
      <p>🟡 Estado: en verificación después de enviar el comprobante.</p>
    </div>
    <button class="primary-btn full" onclick="enviarPedidoYComprobante()">📲 Enviar comprobante</button>`;
}

function cerrarYLimpiar() {
  carrito = [];
  guardarCarrito();
  renderCarrito();
  cerrarCheckout();
  modalidadEntrega = null;
}


/* =========================
   6B. PEDIDOS EN NUBE
   ========================= */
function supabaseDisponible(){
  const cfg=window.SUPABASE_CONFIG||{};
  return window.supabase && cfg.url && !cfg.url.includes("PEGA_AQUI") && cfg.anonKey && !cfg.anonKey.includes("PEGA_AQUI");
}
function clienteSupabase(){
  if(!supabaseDisponible()) return null;
  if(!window._esquinaSupabase) window._esquinaSupabase=window.supabase.createClient(window.SUPABASE_CONFIG.url,window.SUPABASE_CONFIG.anonKey);
  return window._esquinaSupabase;
}
async function guardarPedidoEnNube(){
  const sb=clienteSupabase();
  if(!sb) return null;
  if(!pedidoActual.trackingToken) pedidoActual.trackingToken=crypto.randomUUID();
  const payload={
    numero_pedido:pedidoActual.numero,
    tracking_token:pedidoActual.trackingToken,
    estado:"verificacion",
    sucursal:pedidoActual.cliente.sucursal,
    modalidad:pedidoActual.modalidad,
    metodo_pago:pedidoActual.metodo||null,
    cliente:pedidoActual.cliente,
    items:pedidoActual.items.map(i=>{
      const p=productoPorId(i.id);
      return {id:i.id,nombre:p?.nombre||i.id,cantidad:i.cantidad,precio:p?.precio||0};
    }),
    subtotal:Number(pedidoActual.subtotal||0),
    empaque:Number(pedidoActual.empaque||0),
    domicilio:Number(pedidoActual.domicilio||0),
    total:Number(pedidoActual.total||0)
  };
  const {error}=await sb.from("pedidos").insert(payload);
  if(error){
    console.error("No se pudo guardar el pedido en Supabase:",error);
    return null;
  }
  localStorage.setItem(`pedido_nube_${pedidoActual.numero}`,pedidoActual.trackingToken);
  return pedidoActual.trackingToken;
}
function enlaceSeguimientoNube(){
  const base=window.location.href.split("#")[0].split("?")[0];
  const token=pedidoActual.trackingToken||localStorage.getItem(`pedido_nube_${pedidoActual.numero}`)||"";
  return token ? `${base}?pedido=${encodeURIComponent(pedidoActual.numero)}&token=${encodeURIComponent(token)}#seguimientoPedido` : crearEnlaceSeguimiento("verificacion");
}
async function consultarPedidoNube(numero,token){
  const sb=clienteSupabase();
  if(!sb||!token) return null;
  const {data,error}=await sb.rpc("consultar_pedido_por_token",{p_token:token});
  if(error){console.error(error);return null;}
  return data?.[0]||null;
}

/* =========================
   7. SEGUIMIENTO
   ========================= */
function crearEnlaceSeguimiento(estado = "verificacion") {
  const base = window.location.href.split("#")[0].split("?")[0];
  return `${base}?pedido=${encodeURIComponent(pedidoActual.numero)}&estado=${encodeURIComponent(estado)}#seguimientoPedido`;
}

function consultarPedido() {
  const numero = document.getElementById("consultaPedido").value.trim().replace("#","");
  if (!numero) {
    alert("Escribe el número de pedido.");
    return;
  }

  const guardado = JSON.parse(localStorage.getItem(`pedido_${numero}`) || "null");
  const q=new URLSearchParams(window.location.search);
  const token=q.get("token");
  if(token){
    consultarPedidoNube(numero,token).then(data=>{
      if(data) mostrarEstadoPedidoNube(data);
      else mostrarEstadoPedido(numero,"verificacion");
    });
    return;
  }
  const estadoURL = q.get("estado");
  const estado = estadoURL || guardado?.estado || "verificacion";
  mostrarEstadoPedido(numero, estado);
}

function mostrarEstadoPedido(numero, estado) {
  const card = document.getElementById("estadoPedidoCard");
  const data = {
    verificacion: {
      icon:"🟡", clase:"yellow", titulo:"Pedido en verificación",
      texto:"Recibimos tu pedido y el comprobante. El negocio está verificando la información."
    },
    valido: {
      icon:"🟢", clase:"green", titulo:"¡Pedido válido!",
      texto:"El negocio validó tu pedido y el pago. Puedes continuar con el proceso de preparación y entrega."
    },
    invalido: {
      icon:"🔴", clase:"red", titulo:"Pedido inválido",
      texto:"El negocio no pudo validar el pedido. Comunícate con el punto correspondiente para revisar la situación."
    }
  };

  const e = data[estado] || data.verificacion;

  card.innerHTML = `
    <div class="status-icon ${e.clase}">${e.icon}</div>
    <span class="order-code">Pedido #${escapar(numero)}</span>
    <h3>${e.titulo}</h3>
    <p>${e.texto}</p>
  `;
  card.scrollIntoView({behavior:"smooth",block:"center"});
}


function mostrarEstadoPedidoNube(p){
  const card=document.getElementById("estadoPedidoCard");
  const data={
    verificacion:{icon:"🟡",clase:"yellow",titulo:"Pedido en verificación",texto:"Recibimos tu pedido. El negocio está verificando la información."},
    validado:{icon:"🟢",clase:"green",titulo:"¡Pedido verificado y validado!",texto:"El negocio revisó y validó tu pedido correctamente."},
    invalido:{icon:"🔴",clase:"red",titulo:"Pedido verificado e invalidado",texto:p.motivo_invalido||"El negocio no pudo validar el pedido."},
    preparacion:{icon:"🍳",clase:"green",titulo:"Pedido en preparación",texto:"Tu pedido fue validado y está siendo preparado."},
    camino:{icon:"🛵",clase:"green",titulo:"Pedido en camino",texto:"Tu pedido está en camino."},
    entregado:{icon:"✅",clase:"green",titulo:"Pedido entregado",texto:"Tu pedido aparece como entregado."}
  };
  const e=data[p.estado]||data.verificacion;
  card.innerHTML=`<div class="status-icon ${e.clase}">${e.icon}</div>
    <span class="order-code">Pedido #${escapar(p.numero_pedido)}</span>
    <h3>${e.titulo}</h3><p>${escapar(e.texto)}</p>
    <p><strong>Sucursal:</strong> ${escapar(p.sucursal)}</p>`;
  card.scrollIntoView({behavior:"smooth",block:"center"});
}

function copiarSeguimiento() {
  const url = enlaceSeguimientoNube();
  navigator.clipboard?.writeText(url).then(() => alert("Enlace de seguimiento copiado."));
}

function cargarEstadoDesdeURL() {
  const q = new URLSearchParams(window.location.search);
  const pedido = q.get("pedido");
  const estado = q.get("estado");
  if (pedido) {
    document.getElementById("consultaPedido").value = pedido;
    const token=q.get("token");
    if(token){
      consultarPedidoNube(pedido,token).then(data=>data?mostrarEstadoPedidoNube(data):mostrarEstadoPedido(pedido,estado||"verificacion"));
    }else{
      mostrarEstadoPedido(pedido, estado || "verificacion");
    }
  }
}

/* =========================================================
   LA ESQUINA DEL SABOR V4 — SUCURSALES, HORARIOS Y MENÚS
   ========================================================= */
const V4_PUNTOS = {
  Centro: {
    numero: 1, nombre: "Punto 1 — Bombay 3", ciudad:"Dosquebradas, Risaralda",
    direccion:"Manzana 10, Casa 16, Bombay 3",
    horario:"Lunes a sábado desde las 3:00 PM", domicilios:false,
    mapa:"https://www.google.com/maps/search/?api=1&query=Manzana+10+Casa+16+Bombay+3+Dosquebradas+Risaralda"
  },
  Cuba: {
    numero: 2, nombre: "Punto 2 — Barrio El Modelo", ciudad:"Dosquebradas, Risaralda",
    direccion:"Calle 49 # 19-27, Barrio El Modelo",
    horario:"Lunes a sábado desde las 2:00 PM", domicilios:true,
    mapa:"https://www.google.com/maps/search/?api=1&query=Calle+49+19-27+Barrio+El+Modelo+Dosquebradas+Risaralda"
  },
  Circunvalar: {
    numero: 3, nombre: "Punto 3 — Barrio Providencia", ciudad:"Pereira, Risaralda",
    direccion:"Carrera 20 # 21-26, Barrio Providencia",
    horario:"Lunes a sábado desde las 3:00 PM", domicilios:true,
    mapa:"https://www.google.com/maps/search/?api=1&query=Carrera+20+21-26+Barrio+Providencia+Pereira+Risaralda"
  }
};

const V4_HORARIOS = {
  Centro:{inicio:15*60, domicilioInicio:null},
  Cuba:{inicio:14*60, domicilioInicio:15*60},
  Circunvalar:{inicio:15*60, domicilioInicio:15*60}
};

const V4_SALSAS = [
  ["salsa-tomate","Salsa de tomate","Salsa para acompañar.",0],
  ["salsa-ajo","Salsa de ajo","Salsa para acompañar.",0],
  ["salsa-rosada","Salsa rosada","Salsa para acompañar.",0],
  ["salsa-picante","Salsa picante","Salsa para acompañar.",0],
  ["salsa-tartara","Salsa tártara","Salsa para acompañar.",0],
  ["salsa-mostaza","Salsa de mostaza","Salsa para acompañar.",0],
  ["salsa-miel-mostaza","Salsa miel mostaza","Salsa para acompañar.",0],
  ["salsa-bbq","Salsa BBQ","Salsa para acompañar.",0],
  ["salsa-chimichurri","Salsa chimichurri","Salsa para acompañar.",0],
  ["salsa-guacamole","Guacamole","Salsa para acompañar.",0],
  ["salsa-hogao","Salsa de hogao","Salsa para acompañar.",0],
  ["salsa-mayonesa","Mayonesa","Salsa para acompañar.",0],
  ["salsa-mayonesa-ajo","Mayonesa de ajo","Salsa para acompañar.",0],
  ["salsa-cilantro","Salsa de cilantro","Salsa para acompañar.",0],
  ["salsa-aguacate","Salsa de aguacate","Salsa para acompañar.",0],
  ["salsa-queso","Salsa de queso","Salsa para acompañar.",0],
  ["salsa-ranch","Salsa ranch","Salsa para acompañar.",0],
  ["salsa-maracuya","Salsa de maracuyá","Salsa para acompañar.",0],
  ["salsa-piña","Salsa de piña","Salsa para acompañar.",0],
  ["salsa-especial","Salsa especial","Salsa para acompañar.",0]
];
const V4_COCA_COLA = [
  ["coca-01","Coca-Cola Original 250 ml","Bebida Coca-Cola.",4000],
  ["coca-02","Coca-Cola Original 400 ml","Bebida Coca-Cola.",4000],
  ["coca-03","Coca-Cola Original 600 ml","Bebida Coca-Cola.",4000],
  ["coca-04","Coca-Cola Original 1.5 L","Bebida Coca-Cola.",4000],
  ["coca-05","Coca-Cola Original 2.5 L","Bebida Coca-Cola.",4000],
  ["coca-06","Coca-Cola Zero 250 ml","Bebida Coca-Cola.",4000],
  ["coca-07","Coca-Cola Zero 400 ml","Bebida Coca-Cola.",4000],
  ["coca-08","Coca-Cola Zero 600 ml","Bebida Coca-Cola.",4000],
  ["coca-09","Coca-Cola Zero 1.5 L","Bebida Coca-Cola.",4000],
  ["coca-10","Coca-Cola Zero 2.5 L","Bebida Coca-Cola.",4000],
  ["coca-11","Coca-Cola Sin Azúcar 250 ml","Bebida Coca-Cola.",4000],
  ["coca-12","Coca-Cola Sin Azúcar 400 ml","Bebida Coca-Cola.",4000],
  ["coca-13","Coca-Cola Sin Azúcar 600 ml","Bebida Coca-Cola.",4000],
  ["coca-14","Coca-Cola Sin Azúcar 1.5 L","Bebida Coca-Cola.",4000],
  ["coca-15","Coca-Cola Sin Azúcar 2.5 L","Bebida Coca-Cola.",4000],
  ["coca-16","Sprite 250 ml","Bebida Coca-Cola.",4000],
  ["coca-17","Sprite 400 ml","Bebida Coca-Cola.",4000],
  ["coca-18","Sprite 600 ml","Bebida Coca-Cola.",4000],
  ["coca-19","Sprite 1.5 L","Bebida Coca-Cola.",4000],
  ["coca-20","Sprite 2.5 L","Bebida Coca-Cola.",4000],
  ["coca-21","Quatro 250 ml","Bebida Coca-Cola.",4000],
  ["coca-22","Quatro 400 ml","Bebida Coca-Cola.",4000],
  ["coca-23","Quatro 600 ml","Bebida Coca-Cola.",4000],
  ["coca-24","Quatro 1.5 L","Bebida Coca-Cola.",4000],
  ["coca-25","Quatro 2.5 L","Bebida Coca-Cola.",4000]
];

const V4_POSTOBON = [
  ["postobon-01","Postobón Manzana 250 ml","Bebida Postobón.",4000],
  ["postobon-02","Postobón Manzana 400 ml","Bebida Postobón.",4000],
  ["postobon-03","Postobón Manzana 600 ml","Bebida Postobón.",4000],
  ["postobon-04","Postobón Manzana 1.5 L","Bebida Postobón.",4000],
  ["postobon-05","Postobón Manzana 2.5 L","Bebida Postobón.",4000],
  ["postobon-06","Postobón Colombiana 250 ml","Bebida Postobón.",4000],
  ["postobon-07","Postobón Colombiana 400 ml","Bebida Postobón.",4000],
  ["postobon-08","Postobón Colombiana 600 ml","Bebida Postobón.",4000],
  ["postobon-09","Postobón Colombiana 1.5 L","Bebida Postobón.",4000],
  ["postobon-10","Postobón Colombiana 2.5 L","Bebida Postobón.",4000],
  ["postobon-11","Postobón Uva 250 ml","Bebida Postobón.",4000],
  ["postobon-12","Postobón Uva 400 ml","Bebida Postobón.",4000],
  ["postobon-13","Postobón Uva 600 ml","Bebida Postobón.",4000],
  ["postobon-14","Postobón Uva 1.5 L","Bebida Postobón.",4000],
  ["postobon-15","Postobón Uva 2.5 L","Bebida Postobón.",4000],
  ["postobon-16","Postobón Naranja 250 ml","Bebida Postobón.",4000],
  ["postobon-17","Postobón Naranja 400 ml","Bebida Postobón.",4000],
  ["postobon-18","Postobón Naranja 600 ml","Bebida Postobón.",4000],
  ["postobon-19","Postobón Naranja 1.5 L","Bebida Postobón.",4000],
  ["postobon-20","Postobón Naranja 2.5 L","Bebida Postobón.",4000],
  ["postobon-21","Postobón Tamarindo 250 ml","Bebida Postobón.",4000],
  ["postobon-22","Postobón Tamarindo 400 ml","Bebida Postobón.",4000],
  ["postobon-23","Postobón Tamarindo 600 ml","Bebida Postobón.",4000],
  ["postobon-24","Postobón Tamarindo 1.5 L","Bebida Postobón.",4000],
  ["postobon-25","Postobón Tamarindo 2.5 L","Bebida Postobón.",4000]
];
const V4_CONGELADAS = [
  ["cong-carne","Empanadas congeladas de carne x12","Paquete de 12 unidades.",24000],
  ["cong-pollo","Empanadas congeladas de pollo x12","Paquete de 12 unidades.",24000],
  ["cong-mixta","Empanadas congeladas mixtas x12","Paquete de 12 unidades.",24000],
  ["cong-queso","Empanadas congeladas de queso x12","Paquete de 12 unidades.",30000],
  ["cong-barril","Empanadas congeladas de carne al barril x12","Paquete de 12 unidades.",30000],
  ["cong-ranchera","Empanadas congeladas rancheras x12","Paquete de 12 unidades.",30000],
  ["cong-chicharron","Empanadas congeladas de chicharrón x12","Paquete de 12 unidades.",30000]
];

function v4HoraColombia(){
  return new Date(new Date().toLocaleString("en-US",{timeZone:"America/Bogota"}));
}
function v4MinutosActuales(){
  const d=v4HoraColombia(); return d.getHours()*60+d.getMinutes();
}
function v4DiaCerrado(){
  return v4HoraColombia().getDay()===0;
}
function v4AbiertoPunto(p){
  if(v4DiaCerrado()) return false;
  return v4MinutosActuales() >= V4_HORARIOS[p].inicio;
}
function v4DomicilioDisponible(p){
  if(v4DiaCerrado() || !V4_PUNTOS[p].domicilios) return false;
  const m=v4MinutosActuales();
  return m>=15*60 && m<=22*60+30;
}
function v4EstadoPunto(p){
  if(v4DiaCerrado()) return "🔴 Cerrado hoy (domingo)";
  const h=V4_HORARIOS[p].inicio;
  if(v4MinutosActuales()<h) return "🕒 Abre desde "+(p==="Cuba"?"2:00 PM":"3:00 PM");
  return "🟢 Abierto";
}
function v4EstadoDomicilio(p){
  if(!V4_PUNTOS[p].domicilios) return "❌ Sin servicio a domicilio";
  if(v4DiaCerrado()) return "🔴 Domicilios cerrados hoy";
  const m=v4MinutosActuales();
  if(m<15*60) return "🕒 Domicilios desde las 3:00 PM";
  if(m>22*60+30) return "🔴 Domicilios cerrados · hasta las 10:30 PM";
  return "🟢 Domicilios disponibles · 3:00 PM a 10:30 PM";
}

function v4Producto(base, id, cat, icon, nombre, desc, precio){
  return {id,cat,icon,nombre,desc,precio,puntos:base};
}

const V4_PRODUCTOS_EXTRA = [
  ...V4_SALSAS.map(x=>v4Producto(["Centro","Cuba","Circunvalar"],x[0],"Salsas","🧂",x[1],x[2],x[3])),
  ...V4_COCA_COLA.map(x=>v4Producto(["Cuba","Circunvalar"],x[0],"Coca-Cola","🥤",x[1],x[2],x[3])),
  ...V4_POSTOBON.map(x=>v4Producto(["Cuba"],x[0],"Postobón","🥤",x[1],x[2],x[3])),
  ...V4_CONGELADAS.map(x=>v4Producto(["Cuba","Circunvalar"],x[0],"Congeladas","🧊",x[1],x[2],x[3]))
];
const V4_BASE_PRODUCTS = [
  {id:"papa-tradicional",cat:"Papas rellenas",icon:"🥔",nombre:"Papa Rellena Tradicional",desc:"Papa rellena tradicional.",precio:5000,puntos:["Centro","Cuba","Circunvalar"]},
  {id:"papa-especial",cat:"Papas rellenas",icon:"🥔",nombre:"Papa Rellena Especial",desc:"Papa rellena especial.",precio:7000,puntos:["Centro","Cuba","Circunvalar"]},

  {id:"emp-carne",cat:"Empanadas",icon:"🥟",nombre:"Empanada de Carne",desc:"Empanada tradicional de carne.",precio:3000,puntos:["Centro","Cuba","Circunvalar"]},
  {id:"emp-pollo",cat:"Empanadas",icon:"🥟",nombre:"Empanada de Pollo",desc:"Empanada tradicional de pollo.",precio:3000,puntos:["Centro","Cuba","Circunvalar"]},
  {id:"emp-queso",cat:"Empanadas",icon:"🥟",nombre:"Empanada de Queso",desc:"Empanada rellena de queso.",precio:3500,puntos:["Centro","Cuba","Circunvalar"]},
  {id:"emp-mixta",cat:"Empanadas",icon:"🥟",nombre:"Empanada Mixta",desc:"Combinación de carne y pollo.",precio:4000,puntos:["Centro","Cuba","Circunvalar"]},
  {id:"emp-carne-queso",cat:"Empanadas",icon:"🥟",nombre:"Empanada de Carne y Queso",desc:"Carne y queso.",precio:4000,puntos:["Centro","Cuba","Circunvalar"]},
  {id:"emp-pollo-queso",cat:"Empanadas",icon:"🥟",nombre:"Empanada de Pollo y Queso",desc:"Pollo y queso.",precio:4000,puntos:["Centro","Cuba","Circunvalar"]},
  {id:"emp-especial",cat:"Empanadas",icon:"🥟",nombre:"Empanada Especial",desc:"Nuestra combinación especial.",precio:5000,puntos:["Centro","Cuba","Circunvalar"]},
  {id:"emp-ranchera",cat:"Empanadas",icon:"🥟",nombre:"Empanada Ranchera",desc:"Empanada con sabor ranchero.",precio:4500,puntos:["Centro","Cuba","Circunvalar"]},

  {id:"arepa-huevo",cat:"Arepas",icon:"🫓",nombre:"Arepa de Huevo",desc:"Arepa tradicional con huevo.",precio:5000,puntos:["Centro","Cuba","Circunvalar"]},

  {id:"mega-carne",cat:"Mega empanadas de 30 cm",icon:"🥟",nombre:"Mega Empanada de Carne",desc:"Mega empanada de 30 cm de carne.",precio:12000,puntos:["Centro","Cuba","Circunvalar"]},
  {id:"mega-pollo",cat:"Mega empanadas de 30 cm",icon:"🥟",nombre:"Mega Empanada de Pollo",desc:"Mega empanada de 30 cm de pollo.",precio:12000,puntos:["Centro","Cuba","Circunvalar"]},
  {id:"mega-mixta",cat:"Mega empanadas de 30 cm",icon:"🥟",nombre:"Mega Empanada Mixta",desc:"Mega empanada de 30 cm mixta.",precio:14000,puntos:["Centro","Cuba","Circunvalar"]},
  {id:"mega-especial",cat:"Mega empanadas de 30 cm",icon:"🥟",nombre:"Mega Empanada Especial",desc:"Mega empanada de 30 cm especial.",precio:16000,puntos:["Centro","Cuba","Circunvalar"]}
];
const PRODUCTOS_V4=[...V4_BASE_PRODUCTS,...V4_PRODUCTOS_EXTRA];

function productoPorId(id){
  return PRODUCTOS_V4.find(x=>x.id===id) || null;
}

function v4SetPunto(p){
  if(!Object.prototype.hasOwnProperty.call(V4_PUNTOS,p)) return false;

  // Guardar el cambio PRIMERO. Así la sucursal queda cambiada
  // aunque alguna actualización visual falle.
  localStorage.setItem("sucursalLaEsquina",p);
  localStorage.setItem("puntoSeleccionado",String(V4_PUNTOS[p].numero));
  localStorage.setItem("sucursalSeleccionada",p);
  window.sucursalSeleccionadaV4=p;

  // Conservar solo productos compatibles con el nuevo punto.
  carrito = carrito.filter(i=>{
    const prod = productoPorId(i.id);
    return prod && Array.isArray(prod.puntos) && prod.puntos.includes(p);
  });
  guardarCarrito();

  return true;
}
function v4GetPunto(){
  const p=localStorage.getItem("sucursalLaEsquina")||"";
  return Object.prototype.hasOwnProperty.call(V4_PUNTOS,p) ? p : "";
}

function renderMenu(){
  const cont=document.getElementById("menuContainer"); if(!cont)return;
  const p=v4GetPunto();
  if(!p){
    cont.innerHTML=`<div class="empty-menu"><div>📍</div><h3>Primero elige tu punto</h3><p>Selecciona una sucursal arriba para ver el menú disponible.</p><button class="primary-btn" onclick="mostrarSelectorSucursal()">Elegir sucursal</button></div>`;
    return;
  }
  const lista=PRODUCTOS_V4.filter(x=>Array.isArray(x.puntos) && x.puntos.includes(p));
  const grupos={}; lista.forEach(x=>(grupos[x.cat]??=[]).push(x));
  cont.innerHTML=Object.entries(grupos).map(([cat,arr])=>`
    <section class="menu-category" data-category="${escapar(cat)}">
      <div class="category-title"><h3>${escapar(cat)}</h3><span>${arr.length} opciones</span></div>
      <div class="product-grid">${arr.map(x=>`
        <article class="product" data-name="${escapar(x.nombre.toLowerCase())}">
          <div class="product-image">${x.icon}</div>
          <div class="product-content"><h4>${escapar(x.nombre)}</h4><p>${escapar(x.desc)}</p>
          <div class="product-bottom"><strong class="price">${Number(x.precio)===0 ? "Gratis" : dinero(x.precio)}</strong><button class="add" onclick="agregar('${x.id}')">+ Agregar</button></div>
          </div>
        </article>`).join("")}</div>
    </section>`).join("");
  const tituloSucursalMenu=document.getElementById("tituloSucursalMenu");
  if(tituloSucursalMenu) tituloSucursalMenu.textContent=V4_PUNTOS[p].nombre;
  const subtituloSucursalMenu=document.getElementById("subtituloSucursalMenu");
  if(subtituloSucursalMenu) subtituloSucursalMenu.textContent=V4_PUNTOS[p].horario+" · "+v4EstadoDomicilio(p);
}
function v4ActualizarUI(){
  const p=v4GetPunto();
  actualizarBannerSucursal(p);
  document.querySelectorAll("[data-v4-punto]").forEach(el=>{
    const q=el.dataset.v4Punto;
    el.classList.toggle("selected",q===p);
    const st=el.querySelector(".v4-status"); if(st) st.textContent=v4EstadoPunto(q);
    const ds=el.querySelector(".v4-delivery"); if(ds) ds.textContent=v4EstadoDomicilio(q);
  });
  if(p) renderMenu();
  actualizarEstadoEntrega(p);
}
function mostrarSelectorSucursal(){
  const o=document.getElementById("overlaySucursal");
  if(!o)return;
  if(!o.querySelector(".v4-simple-options")) v4CrearSelector();
  o.classList.remove("hidden");
}
function cerrarSelectorSucursal(){document.getElementById("overlaySucursal")?.classList.add("hidden");}
function actualizarSucursalEnFormulario(p){
  const recoger=document.getElementById("clienteSucursal");
  if(recoger) recoger.value=p||"";
  const domicilio=document.getElementById("clienteSucursalDomicilio");
  if(domicilio) domicilio.value=(p==="Cuba"||p==="Circunvalar")?p:"";
}
function actualizarBannerSucursal(p){
  const b=document.getElementById("sucursalActualBanner");
  if(!b) return;
  b.innerHTML=p ? `📍 <strong>${V4_PUNTOS[p].nombre}</strong> · ${V4_PUNTOS[p].ciudad}<br><small>${V4_PUNTOS[p].direccion} · ${v4EstadoPunto(p)} · ${v4EstadoDomicilio(p)}</small><button class="link-btn" onclick="mostrarSelectorSucursal();return false;">Cambiar punto</button>` : "";
}
function actualizarEstadoEntrega(p){
  const dom=document.querySelector('.delivery-choice[data-tipo="domicilio"]');
  if(!dom || !p) return;
  const allowed=!!(V4_PUNTOS[p].domicilios && v4DomicilioDisponible(p));
  dom.disabled=!allowed;
  dom.classList.toggle("disabled",!allowed);
  const small=dom.querySelector("small");
  if(small) small.textContent=allowed?"3:00 PM a 10:30 PM":(V4_PUNTOS[p].domicilios?"Disponible de 3:00 PM a 10:30 PM":"Solo puntos 2 y 3");
}
function seleccionarSucursal(nombre){
  if(!Object.prototype.hasOwnProperty.call(V4_PUNTOS,nombre)) return false;

  // Cambiar sucursal sin depender de ninguna otra función para completar el cambio.
  const cambio = v4SetPunto(nombre);
  if(!cambio) return false;

  const overlay=document.getElementById("overlaySucursal");
  if(overlay) overlay.classList.add("hidden");

  document.querySelector(".quick-info")?.classList.add("hidden");
  document.getElementById("puntos")?.classList.add("hidden");

  // Cada actualización es independiente: si una parte falla,
  // la sucursal ya quedó guardada y las demás pueden continuar.
  try{ actualizarSucursalEnFormulario(nombre); }catch(e){ console.error(e); }
  try{ actualizarBannerSucursal(nombre); }catch(e){ console.error(e); }
  try{ actualizarEstadoEntrega(nombre); }catch(e){ console.error(e); }
  try{ renderMenu(); }catch(e){ console.error("Error renderizando menú:",e); }
  try{ renderCarrito(); }catch(e){ console.error("Error renderizando carrito:",e); }

  return true;
}
function seleccionarEntrega(tipo){
  const p=v4GetPunto();
  if(!p){
    mostrarSelectorSucursal();
    alert("Primero selecciona una sucursal.");
    return;
  }
  if(tipo==="domicilio" && (!p || !V4_PUNTOS[p].domicilios || !v4DomicilioDisponible(p))){
    alert(p && V4_PUNTOS[p].domicilios ? "Los domicilios están disponibles de 3:00 PM a 10:30 PM, de lunes a sábado." : "El punto seleccionado no tiene servicio a domicilio.");
    return;
  }
  modalidadEntrega=tipo;
  document.getElementById("formEntrega").classList.remove("hidden");
  document.getElementById("camposDomicilio").classList.toggle("hidden",tipo!=="domicilio");
  document.getElementById("camposRecoger").classList.toggle("hidden",tipo!=="recoger");
  document.getElementById("avisoCajaDomicilio").classList.toggle("hidden",tipo!=="domicilio");
  document.getElementById("clienteCiudad").required=tipo==="domicilio";
  document.getElementById("clienteZona").required=tipo==="domicilio";
  document.getElementById("clienteDireccion").required=tipo==="domicilio";
  document.getElementById("clienteSucursalDomicilio").required=tipo==="domicilio";
  document.getElementById("clienteSucursal").required=tipo==="recoger";
  if(tipo==="domicilio"){
    const sel=document.getElementById("clienteSucursalDomicilio");
    sel.value=p==="Cuba"?"Cuba":p==="Circunvalar"?"Circunvalar":"";
  } else {
    const sel=document.getElementById("clienteSucursal"); if(sel)sel.value=p||"";
  }
  document.getElementById("resumenModalidad").innerHTML=tipo==="domicilio"
    ? `🛵 <strong>Domicilio seleccionado.</strong> ${V4_PUNTOS[p].nombre} · 3:00 PM a 10:30 PM.`
    : `🏪 <strong>Recoger en sucursal.</strong> ${V4_PUNTOS[p]?.nombre||"Selecciona el punto"}.`;
  renderCarrito();
}
function v4CrearSelector(){
  const o=document.getElementById("overlaySucursal");
  if(!o)return;

  o.innerHTML=`<div class="v4-selector v4-selector-simple">
    <button type="button" class="v4-simple-close" aria-label="Cerrar" onclick="cerrarSelectorSucursal()">✕</button>
    <div class="v4-logo">🥟</div>
    <span class="eyebrow">LA ESQUINA DEL SABOR</span>
    <h1>Elige tu sucursal</h1>
    <p>Selecciona el punto donde quieres realizar tu pedido.</p>

    <div class="v4-simple-options">
      ${Object.entries(V4_PUNTOS).map(([k,p])=>`
        <button type="button" class="v4-simple-option" onclick="seleccionarSucursal('${k}')">
          <span class="v4-simple-number">0${p.numero}</span>
          <span class="v4-simple-icon">📍</span>
          <span class="v4-simple-info">
            <strong>${p.nombre}</strong>
            <small>${p.ciudad} · ${p.direccion}</small>
            <small>🕒 ${p.horario}</small>
          </span>
          <span class="v4-simple-arrow">→</span>
        </button>`).join("")}
    </div>

    <div class="v4-sunday">🔴 <strong>Domingo: cerrado.</strong></div>
  </div>`;
}
function v4CrearPuntos(){
  const s=document.getElementById("puntosFisicos"); if(!s)return;
  s.innerHTML=Object.entries(V4_PUNTOS).map(([k,p])=>`
    <article class="location-card">
      <div class="location-top"><span>0${p.numero}</span><span>📍</span></div>
      <h3>${p.nombre}</h3><p>${p.direccion}</p><strong>${p.ciudad}</strong>
      <div class="location-info">🕒 ${p.horario}</div>
      <div class="location-info">${v4EstadoDomicilio(k)}</div>
      <a href="${p.mapa}" target="_blank" rel="noopener" class="map-button">🗺️ Ver ubicación en Google Maps</a>
      <button class="secondary-btn full" onclick="seleccionarSucursal('${k}')">Elegir este punto</button>
    </article>`).join("");
}
function v4Inicial(){
  v4CrearSelector();
  v4CrearPuntos();
  const overlay=document.getElementById("overlaySucursal");
  const p=v4GetPunto();
  if(p){
    document.querySelector(".quick-info")?.classList.add("hidden");
    document.getElementById("puntos")?.classList.add("hidden");
    v4ActualizarUI();
    if(overlay) overlay.classList.add("hidden");
  }else{
    if(overlay) overlay.classList.add("hidden");
    renderMenu();
  }
  setInterval(v4ActualizarUI,30000);
}
/* =========================
   INICIO SEGURO
   ========================= */
document.addEventListener("DOMContentLoaded",()=>{
  v4Inicial();
  renderCarrito();
  cargarEstadoDesdeURL();
});

setInterval(()=>{
  const q=new URLSearchParams(window.location.search);
  const token=q.get("token"), numero=q.get("pedido");
  if(token&&numero&&document.visibilityState!=="hidden"){
    consultarPedidoNube(numero,token).then(data=>{if(data)mostrarEstadoPedidoNube(data)});
  }
},10000);
