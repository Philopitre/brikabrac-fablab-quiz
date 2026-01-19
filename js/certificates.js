// certificates.js

function getJsPdf() {
  const jspdf = window.jspdf;
  if (!jspdf || !jspdf.jsPDF) {
    throw new Error("jsPDF n'est pas chargé. Ajoute le script CDN jsPDF dans index.html.");
  }
  return jspdf.jsPDF;
}

function todayFR() {
  try {
    return new Intl.DateTimeFormat("fr-BE", {
      year: "numeric",
      month: "long",
      day: "numeric",
    }).format(new Date());
  } catch {
    return new Date().toLocaleDateString();
  }
}

function todayCompact() {
  const d = new Date();
  const y = String(d.getFullYear());
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}${m}${day}`;
}

function safeName(name) {
  const s = (name || "").trim();
  return s.length ? s : "Participant";
}

function levelTitleShort(level, isFinal) {
  if (isFinal) return "FINAL";
  if (level === 1) return "N1";
  if (level === 2) return "N2";
  if (level === 3) return "N3";
  return `N${level}`;
}

function levelTitleLong(level) {
  if (level === 1) return "Niveau 1 — Découverte";
  if (level === 2) return "Niveau 2 — Progression";
  if (level === 3) return "Niveau 3 — Maîtrise";
  return `Niveau ${level}`;
}

// FNV-1a -> ID court
function fnv1aHex(str) {
  let h = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = (h + ((h << 1) + (h << 4) + (h << 7) + (h << 8) + (h << 24))) >>> 0;
  }
  return ("00000000" + h.toString(16)).slice(-8).toUpperCase();
}

function makeCertificateId({ name, level, score, total, percentage, isFinal, quizUrl }) {
  const base = [
    "BRIKABRAC",
    "FAB-C",
    todayCompact(),
    isFinal ? "FINAL" : `L${level}`,
    name,
    `${score}/${total}`,
    `${percentage}`,
    quizUrl || ""
  ].join("|");
  return `BBFC-${todayCompact()}-${fnv1aHex(base)}`;
}

// jsPDF helper: texte qui tient dans un maxWidth (taille auto)
function fitText(doc, text, maxWidth, startSize, style = "bold", minSize = 12) {
  let size = startSize;
  doc.setFont("helvetica", style);
  while (size > minSize) {
    doc.setFontSize(size);
    if (doc.getTextWidth(text) <= maxWidth) return size;
    size -= 1;
  }
  doc.setFontSize(minSize);
  return minSize;
}

// Filigrane “zine”
function drawWatermark(doc, pageW, pageH, text) {
  doc.setTextColor(245);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(56);
  try {
    doc.text(text, pageW / 2, pageH / 2 + 10, { align: "center", angle: -18 });
  } catch {
    doc.text(text, pageW / 2, pageH / 2 + 10, { align: "center" });
  }
  doc.setTextColor(20);
}

// Cadre fanzine (double + “découpes”)
function drawZineFrame(doc, pageW, pageH) {
  doc.setDrawColor(15);
  doc.setLineWidth(1.2);
  doc.rect(10, 10, pageW - 20, pageH - 20);

  doc.setDrawColor(15);
  doc.setLineWidth(0.35);
  doc.rect(16, 16, pageW - 32, pageH - 32);

  // petits “traits” façon impression
  doc.setLineWidth(0.8);
  for (let i = 0; i < 8; i++) {
    const x = 18 + i * 34;
    doc.line(x, 16, x + 10, 16);
    doc.line(x, pageH - 16, x + 10, pageH - 16);
  }
  doc.setLineWidth(0.35);
}

// Bandeau couleur (style fanzine)
function drawColorHeader(doc, pageW, accent) {
  // grand bandeau
  doc.setFillColor(accent.r, accent.g, accent.b);
  doc.rect(16, 16, pageW - 32, 30, "F");

  // bandeau secondaire (noir)
  doc.setFillColor(10, 10, 10);
  doc.rect(16, 46, pageW - 32, 8, "F");
}

// Badge “tampon”
function drawStampPhilow(doc, x, y, angle = -12) {
  // cercle + texte
  doc.setDrawColor(120, 0, 40);
  doc.setTextColor(120, 0, 40);
  doc.setLineWidth(0.8);

  // cercle
  doc.circle(x, y, 14, "S");

  // traits
  doc.setLineWidth(0.5);
  doc.circle(x, y, 12, "S");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);

  try {
    doc.text("PHILOW", x, y + 2, { align: "center", angle });
    doc.setFontSize(7);
    doc.text("SUPERVISION", x, y + 9, { align: "center", angle });
  } catch {
    doc.text("PHILOW", x, y + 2, { align: "center" });
    doc.setFontSize(7);
    doc.text("SUPERVISION", x, y + 9, { align: "center" });
  }

  // reset
  doc.setTextColor(20);
  doc.setDrawColor(15);
}

// QR code -> dataURL
function makeQrDataUrl(text, sizePx = 220) {
  const qrLib = window.qrcode;
  if (!qrLib) return null;

  const qr = qrLib(0, "M");
  qr.addData(String(text));
  qr.make();

  const count = qr.getModuleCount();
  const margin = 2;
  const totalModules = count + margin * 2;

  const canvas = document.createElement("canvas");
  canvas.width = sizePx;
  canvas.height = sizePx;

  const ctx = canvas.getContext("2d");
  if (!ctx) return null;

  ctx.fillStyle = "#FFFFFF";
  ctx.fillRect(0, 0, sizePx, sizePx);

  const moduleSize = sizePx / totalModules;

  ctx.fillStyle = "#000000";
  for (let r = 0; r < count; r++) {
    for (let c = 0; c < count; c++) {
      if (qr.isDark(r, c)) {
        const x = Math.round((c + margin) * moduleSize);
        const y = Math.round((r + margin) * moduleSize);
        const w = Math.ceil(moduleSize);
        const h = Math.ceil(moduleSize);
        ctx.fillRect(x, y, w, h);
      }
    }
  }

  return canvas.toDataURL("image/png");
}

function accentForLevel(level, isFinal) {
  // couleurs franches “zine”
  if (isFinal) return { r: 250, g: 204, b: 21 };     // jaune “trophée”
  if (level === 1) return { r: 0, g: 185, b: 255 };  // cyan
  if (level === 2) return { r: 255, g: 64, b: 129 }; // magenta
  if (level === 3) return { r: 0, g: 230, b: 118 };  // vert
  return { r: 180, g: 180, b: 180 };
}

export function generateCertificatePdf({
  participantName,
  level,
  score,
  total,
  percentage,
  isFinal = false,
  quizUrl
}) {
  const jsPDF = getJsPdf();
  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });

  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();

  const name = safeName(participantName);
  const dateStr = todayFR();
  const url =
    (quizUrl && String(quizUrl).trim()) ||
    (typeof window !== "undefined" && window.location ? window.location.href.split("#")[0] : "");

  const certId = makeCertificateId({ name, level, score, total, percentage, isFinal, quizUrl: url });

  const accent = accentForLevel(level, isFinal);

  // Base
  doc.setTextColor(20);
  doc.setDrawColor(15);

  // Cadre + watermark
  drawZineFrame(doc, pageW, pageH);
  drawWatermark(doc, pageW, pageH, "BRIKABRAC × FAB-C");

  // Header coloré
  drawColorHeader(doc, pageW, accent);

  // Header text
  doc.setTextColor(255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  doc.text("DIPLOME — QUIZ FABLAB", 22, 34);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  doc.text("Brikabrac × Fab-C — connaissances partagées, connaissances multipliées.", 22, 42);

  // Bandeau noir (tag)
  doc.setTextColor(255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  const tag = isFinal ? "CERTIFICATION FINALE" : `VALIDATION ${levelTitleLong(level).toUpperCase()}`;
  doc.text(tag, 22, 52);

  // Bloc principal (plus compact)
  // Zone gauche pour texte, zone droite dédiée QR (aucun chevauchement)
  const contentX = 22;
  const contentY = 66;
  const contentW = pageW - 44;
  const contentH = 120;

  // séparation colonne QR
  const qrColW = 48;
  const leftW = contentW - qrColW - 10;

  // Boîte nom compacte (pas énorme)
  const nameBoxX = contentX;
  const nameBoxY = contentY + 10;
  const nameBoxW = leftW;
  const nameBoxH = 30;

  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(15);
  doc.setLineWidth(0.35);
  doc.roundedRect(nameBoxX, nameBoxY, nameBoxW, nameBoxH, 3, 3, "FD");

  doc.setTextColor(30);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  doc.text("Décerné à :", nameBoxX + 8, nameBoxY + 11);

  doc.setTextColor(10);
  const nameSize = fitText(doc, name, nameBoxW - 16, 18, "bold", 12);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(nameSize);
  doc.text(name, nameBoxX + nameBoxW / 2, nameBoxY + 23, { align: "center" });

  // Bloc infos (sous le nom)
  const infoY = nameBoxY + nameBoxH + 12;

  doc.setTextColor(20);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.text(isFinal ? "Résultat final" : "Résultat", contentX, infoY);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(12);
  doc.text(`Score : ${score}/${total} — ${percentage}%`, contentX, infoY + 10);

  doc.setFontSize(11);
  doc.setTextColor(40);
  doc.text("Délivré par : Brikabrac × Fab-C", contentX, infoY + 22);
  doc.text("Sous la supervision de Philow", contentX, infoY + 30);
  doc.text(`Date : ${dateStr}`, contentX, infoY + 38);

  // ID certificat (look “étiquette”)
  const idY = infoY + 54;
  doc.setFillColor(245, 245, 245);
  doc.roundedRect(contentX, idY - 8, leftW * 0.72, 14, 2, 2, "F");
  doc.setTextColor(30);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.text(`ID : ${certId}`, contentX + 6, idY + 2);

  // QR colonne droite — zone dédiée (fond blanc + bord)
  const qrBoxX = contentX + leftW + 10;
  const qrBoxY = contentY + 10;
  const qrBoxSize = 40;

  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(15);
  doc.setLineWidth(0.35);
  doc.roundedRect(qrBoxX, qrBoxY, qrColW, 56, 3, 3, "FD");

  doc.setTextColor(20);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.text("REJOUER", qrBoxX + qrColW / 2, qrBoxY + 10, { align: "center" });

  const qrDataUrl = url ? makeQrDataUrl(url, 220) : null;
  if (qrDataUrl) {
    try {
      doc.addImage(qrDataUrl, "PNG", qrBoxX + 4, qrBoxY + 14, qrBoxSize, qrBoxSize);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.setTextColor(60);
      doc.text("Scanner le QR", qrBoxX + qrColW / 2, qrBoxY + 55, { align: "center" });
    } catch {
      // pas de QR si addImage échoue
    }
  } else {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(60);
    doc.text("QR indisponible", qrBoxX + qrColW / 2, qrBoxY + 32, { align: "center" });
  }

  // Tampon Philow (style “encré”)
  drawStampPhilow(doc, qrBoxX + qrColW / 2, qrBoxY + 74, -12);

  // Footer “zine” + devise (couleur accent)
  doc.setFillColor(accent.r, accent.g, accent.b);
  doc.rect(16, pageH - 26, pageW - 32, 10, "F");
  doc.setTextColor(10);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.text("« La connaissance se multiplie quand on la partage. »", pageW / 2, pageH - 19, { align: "center" });

  // File name
  const fileSafe = name.replace(/[^\w\-]+/g, "_").slice(0, 40);
  const fileName = isFinal
    ? `Diplome_Final_${fileSafe}.pdf`
    : `Diplome_${levelTitleShort(level, isFinal)}_${fileSafe}.pdf`;

  // Le save est déclenché par render.js (après confirmation user)
  return { doc, fileName, certId, url };
}
