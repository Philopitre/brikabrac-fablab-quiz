// certificates.js — Version Diplôme Officiel

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

// Nouveau cadre officiel
function drawDiplomaFrame(doc, pageW, pageH) {
  // Bordure extérieure dorée
  doc.setDrawColor(201, 162, 39);
  doc.setLineWidth(2.2);
  doc.rect(10, 10, pageW - 20, pageH - 20);

  // Bordure intérieure fine
  doc.setDrawColor(80);
  doc.setLineWidth(0.6);
  doc.rect(16, 16, pageW - 32, pageH - 32);
}

// Sceau officiel
function drawOfficialSeal(doc, x, y) {
  doc.setDrawColor(201, 162, 39);
  doc.setFillColor(255, 255, 255);

  doc.setLineWidth(1.5);
  doc.circle(x, y, 18, "S");

  doc.setLineWidth(0.8);
  doc.circle(x, y, 14, "S");

  doc.setFont("times", "bold");
  doc.setFontSize(10);
  doc.text("FABLAB", x, y - 2, { align: "center" });
  doc.setFontSize(8);
  doc.text("CERTIFIÉ", x, y + 4, { align: "center" });
}

// Signatures officielles
function drawSignatures(doc, pageW, pageH) {
  const y = pageH - 35;

  doc.setFont("times", "italic");
  doc.setFontSize(12);

  // Ligne gauche (Sylvain)
  doc.line(40, y, 120, y);
  doc.text("Responsable du FabLab", 80, y + 6, { align: "center" });
  doc.setFont("times", "bold");
  doc.text("Sylvain", 80, y + 12, { align: "center" });

  // Ligne droite (Philow)
  doc.setFont("times", "italic");
  doc.line(pageW - 120, y, pageW - 40, y);
  doc.text("Coordinateur pédagogique", pageW - 80, y + 6, { align: "center" });
  doc.setFont("times", "bold");
  doc.text("Philow", pageW - 80, y + 12, { align: "center" });
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

  // Cadre officiel
  drawDiplomaFrame(doc, pageW, pageH);

  // Titre
  doc.setFont("times", "bold");
  doc.setFontSize(32);
  doc.setTextColor(20);
  doc.text("CERTIFICAT DE RÉUSSITE", pageW / 2, 40, { align: "center" });

  doc.setFont("times", "italic");
  doc.setFontSize(16);
  doc.text("Décerné par le FabLab Brikabrac × Fab-C", pageW / 2, 52, { align: "center" });

  // Nom
  doc.setFont("times", "normal");
  doc.setFontSize(16);
  doc.text("Ce certificat est attribué à", pageW / 2, 80, { align: "center" });

  doc.setFont("times", "bold");
  doc.setFontSize(26);
  doc.text(name, pageW / 2, 100, { align: "center" });

  // Résultat
  doc.setFont("helvetica", "normal");
  doc.setFontSize(14);
  doc.text(
    isFinal ? "Pour avoir validé l'ensemble du parcours" : `Pour avoir validé ${levelTitleLong(level)}`,
    pageW / 2,
    120,
    { align: "center" }
  );

  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text(`Score : ${score}/${total} (${percentage}%)`, pageW / 2, 135, { align: "center" });

  // QR code
  const qrDataUrl = url ? makeQrDataUrl(url, 220) : null;
  if (qrDataUrl) {
    doc.addImage(qrDataUrl, "PNG", pageW - 70, 30, 40, 40);
  }

  // ID
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text(`ID : ${certId}`, 20, pageH - 20);

  // Sceau officiel
  drawOfficialSeal(doc, 40, 150);

  // Signatures
  drawSignatures(doc, pageW, pageH);

  // Nom du fichier
  const fileSafe = name.replace(/[^\w\-]+/g, "_").slice(0, 40);
  const fileName = isFinal
    ? `Diplome_Final_${fileSafe}.pdf`
    : `Diplome_${levelTitleShort(level, isFinal)}_${fileSafe}.pdf`;

  return { doc, fileName, certId, url };
}
