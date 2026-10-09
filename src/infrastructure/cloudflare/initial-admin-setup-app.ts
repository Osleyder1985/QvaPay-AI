/**
 * @archivo src/infrastructure/cloudflare/initial-admin-setup-app.ts
 * @proposito Construye la interfaz web de configuración inicial de Administración.
 * @responsabilidades Implementar y proteger las reglas propias de este módulo sin mezclar responsabilidades de otras capas.
 * @ubicacion src/infrastructure/cloudflare dentro de la arquitectura de QvaPay-AI.
 */
const HTML = `<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="description" content="QvaPay-AI · configuración inicial"><title>QvaPay-AI · Configuración inicial</title><style>:root{color-scheme:dark;--bg:#070b14;--panel:#0d1424;--line:#263552;--text:#edf3ff;--muted:#8f9dbb;--accent:#7c9cff;--gold:#ffd746}*{box-sizing:border-box}body{margin:0;min-height:100vh;display:grid;place-items:center;background:radial-gradient(circle at 20% 10%,#16233f,transparent 35%),radial-gradient(circle at 80% 80%,#211a3e,transparent 35%),var(--bg);color:var(--text);font-family:Inter,ui-sans-serif,system-ui}.card{width:min(460px,calc(100% - 30px));padding:32px;border:1px solid var(--line);border-radius:24px;background:rgba(13,20,36,.94);box-shadow:0 25px 80px rgba(0,0,0,.45)}.logo{width:52px;height:52px;display:grid;place-items:center;border-radius:16px;background:linear-gradient(135deg,#6f8cff,#9b6dff);font-size:25px}.eyebrow{margin-top:22px;color:var(--muted);font-size:10px;font-weight:800;letter-spacing:.14em;text-transform:uppercase}.title{font-size:28px;font-weight:850;margin:6px 0}.copy{color:var(--muted);font-size:13px;line-height:1.6}.field{display:grid;gap:7px;margin-top:18px}.field label{font-size:11px;font-weight:750}.field input{width:100%;padding:13px 14px;border:1px solid var(--line);border-radius:11px;background:#090f1c;color:var(--text);outline:none}.field input:focus{border-color:var(--accent)}button{width:100%;margin-top:20px;padding:13px;border:0;border-radius:11px;background:linear-gradient(135deg,#6f8cff,#9b6dff);color:white;font-weight:850;cursor:pointer}button:disabled{opacity:.6}.error{min-height:20px;margin-top:12px;color:#ff7188;font-size:11px}.security{margin-top:20px;padding:12px;border:1px solid rgba(255,215,70,.22);border-radius:11px;color:var(--muted);font-size:10px;line-height:1.55}.security b{color:var(--gold)}.back{display:block;margin-top:16px;text-align:center;color:var(--muted);font-size:11px}</style></head><body><main class="card"><div class="logo">⚡</div><div class="eyebrow">Configuración inicial · Administración</div><div class="title">Crear acceso de Administración</div><p class="copy">Este asistente solo funciona una vez, mientras no exista ningún usuario. Elige el usuario y la contraseña que utilizarás para entrar a producción.</p><form id="setup"><div class="field"><label for="username">Usuario de Administración</label><input id="username" autocomplete="username" minlength="3" maxlength="64" pattern="[A-Za-z0-9._-]{3,64}" required></div><div class="field"><label for="password">Contraseña</label><input id="password" type="password" autocomplete="new-password" minlength="12" required></div><div class="field"><label for="confirm">Confirmar contraseña</label><input id="confirm" type="password" autocomplete="new-password" minlength="12" required></div><button id="submit" type="submit">Crear Administración</button><div class="error" id="error"></div></form><div class="security"><b>Uso único.</b> La primera cuenta de Administración se crea una sola vez mientras no existan usuarios. La contraseña se almacena únicamente como verificador PBKDF2-HMAC-SHA-256 con salt aleatorio.</div><a class="back" href="/">← Volver al acceso</a></main><script>const form=document.getElementById("setup"),button=document.getElementById("submit"),error=document.getElementById("error");form.addEventListener("submit",async event=>{event.preventDefault();error.textContent="";const username=document.getElementById("username").value.trim(),password=document.getElementById("password").value,confirm=document.getElementById("confirm").value;if(!/^[A-Za-z0-9._-]{3,64}$/.test(username)){error.textContent="El usuario debe tener entre 3 y 64 caracteres y usar solo letras, números, punto, guion o guion bajo.";return}if(password.length<12){error.textContent="La contraseña debe tener al menos 12 caracteres.";return}if(password!==confirm){error.textContent="Las contraseñas no coinciden.";return}button.disabled=true;try{const response=await fetch("/api/auth/bootstrap",{method:"POST",headers:{"content-type":"application/json","accept":"application/json"},credentials:"same-origin",body:JSON.stringify({username,password})});const body=await response.json().catch(()=>({}));if(!response.ok)throw new Error(body.error||"No fue posible crear la Administración.");document.getElementById("password").value="";document.getElementById("confirm").value="";location.href="/";}catch(e){error.textContent=e instanceof Error?e.message:String(e)}finally{button.disabled=false}});</script></body></html>`;
const COMPLETED_HTML = HTML.replace(
  "<div class=\"eyebrow\">Configuración inicial · Administración</div><div class=\"title\">Crear acceso de Administración</div><p class=\"copy\">Este asistente solo funciona una vez, mientras no exista ningún usuario. Elige el usuario y la contraseña que utilizarás para entrar a producción.</p><form id=\"setup\" novalidate>",
  "<div class=\"eyebrow\">Configuración inicial · Administración</div><div class=\"title\">Configuración ya completada</div><p class=\"copy\">La aplicación ya tiene usuarios registrados. Por seguridad, la creación inicial de Administración está cerrada.</p><div class=\"security\"><b>Acceso protegido.</b> Inicia sesión con una cuenta existente o solicita a un usuario de Administración que gestione las cuentas.</div><a class=\"back\" href=\"/\">← Volver al acceso</a>",
);

/**
 * Genera la respuesta HTML para el estado de configuración inicial ya completado.
 * @returns Respuesta HTTP sin caché con la interfaz de configuración completada.
 */
export function createInitialAdminSetupCompletedResponse(): Response {
  return new Response(COMPLETED_HTML, {
    status: 200,
    headers: {
      "content-type": "text/html; charset=UTF-8",
      "cache-control": "no-store",
      "x-content-type-options": "nosniff",
      "content-security-policy":
        "default-src 'none'; style-src 'unsafe-inline'; script-src 'unsafe-inline'; connect-src 'self'; base-uri 'none'; frame-ancestors 'none'",
    },
  });
}

/**
 * Genera la respuesta HTML para el asistente de creación inicial de Administración.
 * @returns Respuesta HTTP sin caché con el formulario de configuración inicial.
 */
export function createInitialAdminSetupResponse(): Response {
  return new Response(HTML, {
    status: 200,
    headers: {
      "content-type": "text/html; charset=UTF-8",
      "cache-control": "no-store",
      "x-content-type-options": "nosniff",
      "content-security-policy":
        "default-src 'none'; style-src 'unsafe-inline'; script-src 'unsafe-inline'; connect-src 'self'; base-uri 'none'; frame-ancestors 'none'",
    },
  });
}
