/* script.js
 - Frontend para subir documentos Etapa Productiva
 - Preparado para enviar FormData a Apps Script
*/

// ----- CONFIG -----
const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbzRnE8C6qupbT07VmkRJVuMK3x-WP5gZquF5SBYM8FU4JgEbHVzrHALnChmRRUevCEs/exec'; // <- Pegar URL Apps Script publicada
const DRIVE_FOLDER_ID = '11a92eB5lc4uCtCY6ckAiNAk9ABZm-wX1'; // proporcionada
const SHEET_ID = '1hshJdOKbDVChr8-5oLNuKJOCkmwXltIqGRN6GqmWSkw'; // proporcionada
const MAX_FILE_BYTES = 5 * 1024 * 1024; // 5 MB

// ----- MAPA DE DOCUMENTOS POR MODALIDAD -----
/*
 Cada elemento: { key: 'codigo_interno', label: 'Nombre para mostrar', standardizedName: 'NOMBRE_ARCHIVO_ESTANDAR' }
*/
const MODALIDADES = {
  contrato: [
    { key: 'gfpi', label: 'GFPI-F-165 (Formato de Selección y Modificación)', standardizedName: 'GFPI-F-165' },
    { key: 'contrato_signed', label: 'Copia contrato de aprendizaje firmado', standardizedName: 'CONTRATO_APRENDIZAJE' },
    { key: 'eps', label: 'Copia afiliación EPS', standardizedName: 'CERTIFICADO_EPS' },
    { key: 'arl', label: 'Copia afiliación ARL', standardizedName: 'CERTIFICADO_ARL' }
  ],
  monitorias: [
    { key: 'gfpi', label: 'GFPI-F-165 (Formato de Selección y Modificación)', standardizedName: 'GFPI-F-165' },
    { key: 'resolucion', label: 'Copia de resolución de monitorias', standardizedName: 'RESOLUCION_MONITORIAS' },
    { key: 'oficio', label: 'Oficio dirigido al Coordinador(a) académico', standardizedName: 'OFICIO_COORDINADOR' }
  ],
  vinculo: [
    { key: 'doc_id', label: 'Copia documento de identidad al 150%', standardizedName: 'DOCUMENTO_IDENTIDAD' },
    { key: 'gfpi', label: 'GFPI-F-165 (Formato de Selección y Modificación)', standardizedName: 'GFPI-F-165' },
    { key: 'oficio', label: 'Oficio dirigido al Coordinador(a) académico', standardizedName: 'OFICIO_COORDINADOR' },
    { key: 'acept_representante', label: 'Aceptación de la modalidad por parte del representante legal', standardizedName: 'ACEPTACION_REPRESENTANTE' },
    { key: 'contrato_laboral', label: 'Copia del contrato laboral vigente o certificación laboral con funciones', standardizedName: 'CONTRATO_LABORAL' },
    { key: 'eps', label: 'Copia afiliación EPS', standardizedName: 'CERTIFICADO_EPS' },
    { key: 'arl', label: 'Copia afiliación ARL', standardizedName: 'CERTIFICADO_ARL' }
  ],
  proyecto: [
    { key: 'doc_id', label: 'Copia de la cédula 150%', standardizedName: 'DOCUMENTO_IDENTIDAD' },
    { key: 'gfpi', label: 'GFPI-F-165 (Formato de Selección y Modificación)', standardizedName: 'GFPI-F-165' },
    { key: 'oficio', label: 'Oficio dirigido al Coordinador(a) académico', standardizedName: 'OFICIO_COORDINADOR' },
    { key: 'canvas', label: 'Modelo de negocio CANVAS', standardizedName: 'MODELO_CANVAS' },
    { key: 'eps', label: 'Copia afiliación EPS', standardizedName: 'CERTIFICADO_EPS' },
    { key: 'oficio_arl', label: 'Oficio solicitud de afiliación a ARL', standardizedName: 'OFICIO_SOLICITUD_ARL' }
  ],
  pasantia: [
    { key: 'doc_id', label: 'Copia documento de identidad al 150%', standardizedName: 'DOCUMENTO_IDENTIDAD' },
    { key: 'gfpi', label: 'GFPI-F-165 (Formato de Selección y Modificación)', standardizedName: 'GFPI-F-165' },
    { key: 'oficio', label: 'Oficio dirigido al Coordinador(a) académico', standardizedName: 'OFICIO_COORDINADOR' },
    { key: 'oficio_solicitud_empresa', label: 'Copia Oficio de solicitud de realización prácticas a la empresa', standardizedName: 'OFICIO_SOLICITUD_EMPRESA' },
    { key: 'acept_empresa', label: 'Copia de aceptación de realización de prácticas por parte de la empresa', standardizedName: 'ACEPTACION_EMPRESA' },
    { key: 'eps', label: 'Copia afiliación EPS', standardizedName: 'CERTIFICADO_EPS' },
    { key: 'arl', label: 'Copia afiliación ARL', standardizedName: 'CERTIFICADO_ARL' }
  ]
};

// ----- ELEMENTOS DOM -----
const form = document.getElementById('formEtapa');
const modalidadSelect = document.getElementById('modalidad');
const documentosContainer = document.getElementById('documentosRequeridos');
const mensajes = document.getElementById('mensajes');
const btnSubmit = document.getElementById('btnSubmit');
const btnReset = document.getElementById('btnReset');

// ----- Helpers -----
function showMessage(text, isError = false) {
  mensajes.style.display = 'block';
  mensajes.style.background = isError ? '#ffefef' : '#e8f8ee';
  mensajes.style.color = isError ? '#9b1c1c' : '#1b5e20';
  mensajes.textContent = text;
}

function clearMessage() {
  mensajes.style.display = 'none';
  mensajes.textContent = '';
}

// crea el DOM de los inputs de archivos para la modalidad
function renderDocumentInputs(modKey) {
  documentosContainer.innerHTML = '';
  if (!modKey) return;

  const docs = MODALIDADES[modKey];
  docs.forEach(doc => {
    const card = document.createElement('div');
    card.className = 'doc-card';
    card.dataset.docKey = doc.key;

    const left = document.createElement('div');
    left.className = 'doc-left';

    const title = document.createElement('div');
    title.className = 'doc-title';
    title.textContent = doc.label;

    const desc = document.createElement('div');
    desc.className = 'doc-desc';
    desc.textContent = 'Formato: PDF. Tamaño máximo: 5 MB';

    left.appendChild(title);
    left.appendChild(desc);

    const right = document.createElement('div');
    right.className = 'file-input';

    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = '.pdf';
    fileInput.dataset.key = doc.key; // clave interna
    fileInput.id = `file_${doc.key}`;
    fileInput.name = doc.key;
    fileInput.addEventListener('change', onFileSelected);

    // label boton seleccionar
    const selectBtn = document.createElement('label');
    selectBtn.className = 'btn small-btn';
    selectBtn.htmlFor = fileInput.id;
    selectBtn.textContent = 'Seleccionar PDF';

    // preview nombre
    const preview = document.createElement('div');
    preview.className = 'preview-name';
    preview.id = `preview_${doc.key}`;
    preview.textContent = 'No seleccionado';

    // si el documento es GFPI-F-165, añadimos boton de descarga
    if (doc.standardizedName === 'GFPI-F-165') {
      const downloadBtn = document.createElement('button');
      downloadBtn.type = 'button';
      downloadBtn.className = 'btn small-btn';
      downloadBtn.id = `download_gfpi`;
      downloadBtn.textContent = 'Descargar GFPI-F-165';
      downloadBtn.addEventListener('click', () => {
        // Debes subir GFPI-F-165 al hosting o Drive y poner la URL aquí
        const gfpiUrl = 'https://docs.google.com/uc?export=download&id=PUT_FILE_ID_HERE';
        window.open(gfpiUrl, '_blank');
      });
      right.appendChild(downloadBtn);
    }

    right.appendChild(selectBtn);
    right.appendChild(fileInput);
    right.appendChild(preview);

    card.appendChild(left);
    card.appendChild(right);
    documentosContainer.appendChild(card);
  });
}

// evento cuando se selecciona archivo
function onFileSelected(e) {
  const input = e.target;
  const file = input.files[0];
  const key = input.dataset.key;
  const preview = document.getElementById(`preview_${key}`);

  if (!file) {
    preview.textContent = 'No seleccionado';
    return;
  }

  // Validaciones: tipo PDF y tamaño
  if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
    showMessage('El archivo debe ser PDF.', true);
    input.value = '';
    preview.textContent = 'No seleccionado';
    return;
  }
  if (file.size > MAX_FILE_BYTES) {
    showMessage(`El archivo supera 5 MB. Tamaño: ${(file.size/1024/1024).toFixed(2)} MB`, true);
    input.value = '';
    preview.textContent = 'No seleccionado';
    return;
  }

  // Si es GFPI-F-165, ocultar el botón de descarga para evitar confusiones
  const standardizedName = findStandardNameByKey(key);
  if (standardizedName === 'GFPI-F-165') {
    const dl = document.getElementById('download_gfpi');
    if (dl) dl.style.display = 'none';
  }

  preview.textContent = `${file.name} (${(file.size/1024/1024).toFixed(2)} MB)`;
  clearMessage();
}

function findStandardNameByKey(key) {
  for (const mod in MODALIDADES) {
    for (const d of MODALIDADES[mod]) {
      if (d.key === key) return d.standardizedName;
    }
  }
  return key;
}

// Construye FormData renombrando los archivos con standardizedName
function buildFormData(ficha, identificacion, modalidad) {
  const fd = new FormData();
  fd.append('ficha', ficha);
  fd.append('identificacion', identificacion);
  fd.append('modalidad', modalidad);
  fd.append('driveFolderId', DRIVE_FOLDER_ID);
  fd.append('sheetId', SHEET_ID);

  const docs = MODALIDADES[modalidad];
  for (const doc of docs) {
    const input = document.querySelector(`input[name="${doc.key}"]`);
    if (!input || !input.files[0]) {
      // No seleccionado -> hoy podrías obligar a subir todos. Aquí asumimos que todos son requeridos.
      return { error: `Falta el documento: ${doc.label}` };
    }
    const origFile = input.files[0];
    const ext = '.pdf';
    // normalized filename pattern: <FICHA>_<IDENTIFICACION>_<STANDARDIZEDNAME>.pdf
    const newFileName = `${doc.standardizedName}.pdf`; // renombrado por server a la estructura final si deseas
    // Para enviar un archivo con nuevo nombre usamos File constructor
    const renamed = new File([origFile], newFileName, { type: origFile.type });
    fd.append(doc.key, renamed);
  }
  return { formData: fd };
}

// Verificación previa: opción para llamar al Apps Script si implementas endpoint de check
async function serverCheckAlreadySubmitted(ficha, identificacion) {
  // Si implementas un endpoint de verificación en apps script,
  // úsalo aquí. Por ahora este código intenta llamar al mismo SCRIPT_URL
  // con un parámetro action=check (debes implementarlo en Apps Script).
  try {
    const url = `${SCRIPT_URL}?action=check&ficha=${encodeURIComponent(ficha)}&identificacion=${encodeURIComponent(identificacion)}`;
    const resp = await fetch(url, { method: 'GET' });
    if (!resp.ok) return false;
    const data = await resp.json();
    // Esperamos { exists: true/false }
    return data.exists === true;
  } catch (err) {
    // Si falla la verificación remota, no bloqueamos: la verificación final debe hacerla el Apps Script.
    console.warn('Verificación servidor falló', err);
    return false;
  }
}

// Guardado local para prevenir reenvío (complementario). NO sustituye la verificación server-side.
function markLocalSubmitted(ficha, identificacion) {
  const key = `submitted_${ficha}_${identificacion}`;
  localStorage.setItem(key, '1');
}
function isLocallySubmitted(ficha, identificacion) {
  const key = `submitted_${ficha}_${identificacion}`;
  return localStorage.getItem(key) === '1';
}

// ---- Eventos ----
modalidadSelect.addEventListener('change', (e) => {
  renderDocumentInputs(e.target.value);
  clearMessage();
});

btnReset.addEventListener('click', () => {
  form.reset();
  documentosContainer.innerHTML = '';
  clearMessage();
  // volver a mostrar botón GFPI-F-165 si existía
  const dl = document.getElementById('download_gfpi');
  if (dl) dl.style.display = 'inline-block';
});

form.addEventListener('submit', async (ev) => {
  ev.preventDefault();
  clearMessage();

  const ficha = document.getElementById('ficha').value.trim();
  const identificacion = document.getElementById('identificacion').value.trim();
  const modalidad = modalidadSelect.value;

  if (!ficha || !identificacion || !modalidad) {
    showMessage('Por favor completa ficha, identificación y modalidad.', true);
    return;
  }

  // Prevención local
  if (isLocallySubmitted(ficha, identificacion)) {
    showMessage('Ya enviaste tus documentos desde este navegador para esta ficha/identificación. Si necesitas cambiar algo, contacta al coordinador.', true);
    return;
  }

  // Verificación servidor-side (recomendado): si implementas endpoint check, se usará.
  try {
    btnSubmit.disabled = true;
    btnSubmit.textContent = 'Verificando...';
    const exists = await serverCheckAlreadySubmitted(ficha, identificacion);
    if (exists) {
      showMessage('Ya existe un registro en el sistema para esta ficha/identificación. No es posible enviar de nuevo.', true);
      btnSubmit.disabled = false;
      btnSubmit.textContent = 'Enviar documentos';
      return;
    }
  } catch (err) {
    // continuar — la verificación principal la hará el servidor
    console.warn('Fallo verificación remota (continuando):', err);
  }

  // Construir FormData
  const built = buildFormData(ficha, identificacion, modalidad);
  if (built.error) {
    showMessage(built.error, true);
    btnSubmit.disabled = false;
    btnSubmit.textContent = 'Enviar documentos';
    return;
  }
  const formData = built.formData;

  // Enviar al Apps Script
  try {
    btnSubmit.textContent = 'Enviando...';
    const resp = await fetch(SCRIPT_URL, {
      method: 'POST',
      body: formData
    });

    const text = await resp.text();
    if (!resp.ok) {
      showMessage(`Error al enviar: ${text}`, true);
      btnSubmit.disabled = false;
      btnSubmit.textContent = 'Enviar documentos';
      return;
    }

    // Se considera éxito si servidor devuelve OK o similar
    showMessage('Documentos enviados correctamente. Recibirás confirmación por correo (si está configurado).');
    markLocalSubmitted(ficha, identificacion);
    btnSubmit.disabled = true;
    btnSubmit.textContent = 'Enviado';
  } catch (err) {
    console.error(err);
    showMessage('Error en la conexión. Intenta de nuevo más tarde.', true);
    btnSubmit.disabled = false;
    btnSubmit.textContent = 'Enviar documentos';
  }
});