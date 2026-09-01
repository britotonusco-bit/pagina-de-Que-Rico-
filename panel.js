let supabaseClient = null;
let pedidos = [];
let filtroEstado = "";

const cfg = window.SUPABASE_CONFIG || {};
if(cfg.url && !cfg.url.includes("PEGA_AQUI") && cfg.anonKey && !cfg.anonKey.includes("PEGA_AQUI")){
  supabaseClient = window.supabase.createClient(cfg.url,cfg.anonKey);
}

const $ = id => document.getElementById(id);

document.addEventListener("DOMContentLoaded", async ()=>{
  if(!supabaseClient){
    $("loginError").textContent="Configura config.js con la URL y la clave ANON/PUBLIC de Supabase.";
    return;
  }
  $("loginForm").addEventListener("submit", iniciarSesion);
  const {data:{session}} = await supabaseClient.auth.getSession();
  if(session) mostrarPanel();
});

async function iniciarSesion(e){
  e.preventDefault();
  $("loginError").textContent="";
  const {error}=await supabaseClient.auth.signInWithPassword({
    email:$("loginEmail").value.trim(),
    password:$("loginPassword").value
  });
  if(error){$("loginError").textContent="No se pudo iniciar sesión: "+error.message;return;}
  mostrarPanel();
}

async function cerrarSesion(){
  await supabaseClient.auth.signOut();
  $("panelView").classList.add("hidden");
  $("loginView").classList.remove("hidden");
  $("btnSalir").classList.add("hidden");
}

function mostrarPanel(){
  $("loginView").classList.add("hidden");
  $("panelView").classList.remove("hidden");
  $("btnSalir").classList.remove("hidden");
  cargarPedidos();
}

async function cargarPedidos(){
  const {data,error}=await supabaseClient.from("pedidos").select("*").order("creado_en",{ascending:false}).limit(200);
  if(error){$("pedidoList").innerHTML=`<div class="card error">${esc(error.message)}</div>`;return;}
  pedidos=data||[];
  actualizarContadores();
  renderPedidos();
}

function filtrar(estado){filtroEstado=estado;renderPedidos()}

function actualizarContadores(){
  const c={verificacion:0,validado:0,preparacion:0,camino:0,invalido:0};
  pedidos.forEach(p=>{if(c[p.estado]!==undefined)c[p.estado]++});
  Object.entries(c).forEach(([k,v])=>{const el=$("n"+k.charAt(0).toUpperCase()+k.slice(1));if(el)el.textContent=v});
}

function renderPedidos(){
  const suc=$("filtroSucursal").value;
  let list=pedidos.filter(p=>(!filtroEstado||p.estado===filtroEstado)&&(!suc||p.sucursal===suc));
  if(!list.length){$("pedidoList").innerHTML='<div class="card">No hay pedidos con estos filtros.</div>';return;}
  $("pedidoList").innerHTML=list.map(pedidoHTML).join("");
}

function estadoLabel(s){
  return {verificacion:"🟡 En verificación",validado:"🟢 Verificado y validado",invalido:"🔴 Verificado e invalidado",preparacion:"🍳 En preparación",camino:"🛵 En camino",entregado:"✅ Entregado"}[s]||s;
}
function badgeClass(s){return s==="validado"||s==="entregado"?"green":s==="invalido"?"red":s==="camino"?"blue":s==="verificacion"?"yellow":""}

function pedidoHTML(p){
  const cliente=p.cliente||{};
  const items=Array.isArray(p.items)?p.items:[];
  return `<article class="order">
    <div class="order-head">
      <div><h3>Pedido #${esc(p.numero_pedido)}</h3><div class="muted">${esc(cliente.nombre||"")} · ${esc(cliente.telefono||"")} · ${esc(p.sucursal)}</div></div>
      <span class="badge ${badgeClass(p.estado)}">${estadoLabel(p.estado)}</span>
    </div>
    <div class="order-body">
      <div><strong>Entrega:</strong> ${esc(p.modalidad)}<br><strong>Pago:</strong> ${esc(p.metodo_pago||"")}</div>
      <div><strong>Total:</strong> $${Number(p.total||0).toLocaleString("es-CO")}<br><strong>Fecha:</strong> ${new Date(p.creado_en).toLocaleString("es-CO")}</div>
    </div>
    <ul class="items">${items.map(i=>`<li>${esc(i.cantidad)} × ${esc(i.nombre||i.id||"Producto")}</li>`).join("")}</ul>
    ${p.motivo_invalido?`<p class="error"><strong>Motivo:</strong> ${esc(p.motivo_invalido)}</p>`:""}
    <div class="actions">
      ${p.estado==="verificacion"?`<button class="primary" onclick="validar('${p.id}')">✅ Validar pedido</button><button class="danger" onclick="invalidar('${p.id}')">❌ Invalidar</button>`:""}
      ${p.estado==="validado"?`<button class="secondary" onclick="cambiarEstado('${p.id}','preparacion')">🍳 En preparación</button>`:""}
      ${p.estado==="preparacion"?`<button class="secondary" onclick="cambiarEstado('${p.id}','camino')">🛵 En camino</button>`:""}
      ${p.estado==="camino"?`<button class="secondary" onclick="cambiarEstado('${p.id}','entregado')">✅ Entregado</button>`:""}
    </div>
  </article>`;
}

async function validar(id){
  await actualizar(id,{estado:"validado",motivo_invalido:null});
}
async function invalidar(id){
  const motivo=prompt("Indica por qué se invalida el pedido:");
  if(!motivo||!motivo.trim())return;
  await actualizar(id,{estado:"invalido",motivo_invalido:motivo.trim()});
}
async function cambiarEstado(id,estado){await actualizar(id,{estado})}

async function actualizar(id,cambios){
  const {error}=await supabaseClient.from("pedidos").update(cambios).eq("id",id);
  if(error){alert("No se pudo actualizar: "+error.message);return;}
  await cargarPedidos();
}

function esc(v){return String(v??"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[m]))}
