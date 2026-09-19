import { useState, useRef, useEffect } from "react";
import emailjs from "@emailjs/browser";

emailjs.init("USFzBaZJ2xx3Nog9u");

const EMAILJS_SERVICE_ID = "service_3lpshw8";
const EMAILJS_TEMPLATE_ID = "template_ibsh7sj";

const NATIONALITIES = [
  "Marocaine", "Française", "Espagnole", "Italienne", "Britannique", "Américaine",
  "Allemande", "Belge", "Néerlandaise", "Canadienne", "Émiratie", "Saoudienne",
  "Algérienne", "Tunisienne", "Sénégalaise", "Autre"
];

const DOC_TYPES = ["Passeport", "Carte d'identité nationale (CIN)", "Carte de résident", "Autre"];

/* ------------------------------------------------------------------ */
/* Design tokens — beige / navy, matching Medina Moon Stays branding   */
/* ------------------------------------------------------------------ */
const C = {
  bg: "#f7f2e4",
  band: "#efe3c8",
  bandBorder: "#ddcda0",
  navy: "#16213e",
  navySoft: "#3d4a6b",
  navyFaint: "#16213e99",
  navyFainter: "#16213e55",
  border: "#c9bd9a",
  borderStrong: "#16213e",
  inputBg: "#ffffff",
  white: "#ffffff",
  gold: "#c9a24a",
  warnBg: "#fbeee0",
  warnBorder: "#e0b26b",
  errorText: "#a23b2e",
  errorBg: "#fbe9e6",
  errorBorder: "#d98f80",
};

const FONT = "'Helvetica Neue', Arial, sans-serif";

/* ------------------------------------------------------------------ */
/* Image helper — resize + compress before embedding as base64        */
/* ------------------------------------------------------------------ */
function fileToCompressedDataURL(file, maxWidth = 1400, quality = 0.75) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = reject;
    reader.onload = () => {
      const img = new Image();
      img.onerror = reject;
      img.onload = () => {
        const scale = Math.min(1, maxWidth / img.width);
        const canvas = document.createElement("canvas");
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL("image/jpeg", quality));
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
}

/* ------------------------------------------------------------------ */
/* Signature pad                                                       */
/* ------------------------------------------------------------------ */
function SignaturePad({ onSign, signed, label = "Signez ici / Sign here" }) {
  const canvasRef = useRef(null);
  const drawing = useRef(false);
  const lastPos = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = C.navy;
    ctx.lineWidth = 2;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
  }, []);

  const getPos = (e, canvas) => {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    if (e.touches) {
      return { x: (e.touches[0].clientX - rect.left) * scaleX, y: (e.touches[0].clientY - rect.top) * scaleY };
    }
    return { x: (e.clientX - rect.left) * scaleX, y: (e.clientY - rect.top) * scaleY };
  };

  const startDraw = (e) => { e.preventDefault(); drawing.current = true; lastPos.current = getPos(e, canvasRef.current); };
  const draw = (e) => {
    e.preventDefault();
    if (!drawing.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const pos = getPos(e, canvas);
    ctx.beginPath(); ctx.moveTo(lastPos.current.x, lastPos.current.y); ctx.lineTo(pos.x, pos.y); ctx.stroke();
    lastPos.current = pos;
    onSign(canvas.toDataURL());
  };
  const stopDraw = () => { drawing.current = false; };
  const clear = () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = "#ffffff"; ctx.fillRect(0, 0, canvas.width, canvas.height);
    onSign(null);
  };

  return (
    <div style={{ position: "relative" }}>
      <canvas ref={canvasRef} width={600} height={150}
        onMouseDown={startDraw} onMouseMove={draw} onMouseUp={stopDraw} onMouseLeave={stopDraw}
        onTouchStart={startDraw} onTouchMove={draw} onTouchEnd={stopDraw}
        style={{ width: "100%", height: "120px", border: `1.5px solid ${C.borderStrong}`, borderRadius: "6px", cursor: "crosshair", display: "block", touchAction: "none", background: "#fff" }}
      />
      {!signed && (
        <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)", color: C.navyFainter, fontSize: "13px", pointerEvents: "none", fontFamily: FONT, letterSpacing: "1px" }}>
          {label}
        </div>
      )}
      <button onClick={clear} style={{ marginTop: "8px", background: "transparent", border: `1px solid ${C.border}`, color: C.navySoft, padding: "5px 14px", borderRadius: "4px", fontSize: "11px", cursor: "pointer", letterSpacing: "0.5px", fontFamily: FONT }}>
        Effacer / Clear
      </button>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Field / Section / inputs                                            */
/* ------------------------------------------------------------------ */
function Field({ label, labelEn, children, required }) {
  return (
    <div style={{ marginBottom: "20px" }}>
      <label style={{ display: "block", marginBottom: "6px", fontSize: "13px", fontWeight: 700, color: C.navy, fontFamily: FONT }}>
        {label}{labelEn && <span style={{ color: C.navyFaint, marginLeft: "8px", fontSize: "11px", fontWeight: 400 }}>/ {labelEn}</span>}{required && <span style={{ color: "#b2402f", marginLeft: "4px" }}>*</span>}
      </label>
      {children}
    </div>
  );
}

const inputStyle = {
  width: "100%",
  background: C.inputBg,
  border: `1.5px solid ${C.border}`,
  borderRadius: "6px",
  color: C.navy,
  padding: "11px 14px",
  fontSize: "14px",
  fontFamily: FONT,
  outline: "none",
  boxSizing: "border-box",
};
const selectStyle = {
  ...inputStyle,
  appearance: "none",
  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath d='M1 1l5 5 5-5' stroke='%2316213e' stroke-width='1.5' fill='none'/%3E%3C/svg%3E")`,
  backgroundRepeat: "no-repeat",
  backgroundPosition: "right 14px center",
  paddingRight: "36px",
  cursor: "pointer",
};

function SectionTitle({ children }) {
  return (
    <div style={{
      margin: "30px 0 20px", padding: "13px 20px",
      background: C.band, border: `1px solid ${C.bandBorder}`, borderRadius: "6px",
      textAlign: "center",
    }}>
      <span style={{ fontSize: "14px", fontWeight: 700, color: C.navy, fontFamily: FONT }}>{children}</span>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Passport / ID photo upload field                                    */
/* ------------------------------------------------------------------ */
function UploadCloudIcon() {
  return (
    <svg width="34" height="34" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M7 18a4.5 4.5 0 0 1-.4-8.98A5.5 5.5 0 0 1 17.2 8.1 4 4 0 0 1 17 16" stroke={C.navy} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M12 11v7m0-7 3 3m-3-3-3 3" stroke={C.navy} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

const MAX_COMPANIONS = 7;

function CompanionCard({ index, companion, onFieldChange, onRemove, errors }) {
  const errStyle = (k) => errors[`companion_${index}_${k}`] ? { borderColor: "#d98f80" } : {};
  return (
    <div style={{ margin: "0 0 16px", padding: "20px", background: C.white, border: `1.5px solid ${C.border}`, borderRadius: "8px" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
        <span style={{ fontSize: "13px", fontWeight: 700, color: C.navy, fontFamily: FONT }}>Voyageur {index + 2}</span>
        <span onClick={onRemove} style={{ fontSize: "12px", color: C.navySoft, textDecoration: "underline", cursor: "pointer", fontFamily: FONT }}>
          Retirer / Remove
        </span>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 20px" }}>
        <Field label="Nom de famille" labelEn="Last name" required>
          <input value={companion.nom} onChange={e => onFieldChange("nom", e.target.value)} style={{ ...inputStyle, ...errStyle("nom") }} placeholder="DUPONT" />
        </Field>
        <Field label="Prénom(s)" labelEn="First name(s)" required>
          <input value={companion.prenom} onChange={e => onFieldChange("prenom", e.target.value)} style={{ ...inputStyle, ...errStyle("prenom") }} placeholder="Marie" />
        </Field>
        <Field label="Nationalité" labelEn="Nationality">
          <select value={companion.nationalite} onChange={e => onFieldChange("nationalite", e.target.value)} style={selectStyle}>
            <option value="">— Sélectionner —</option>
            {NATIONALITIES.map(n => <option key={n} value={n}>{n}</option>)}
          </select>
        </Field>
        <Field label="Type de document">
          <select value={companion.doc_type} onChange={e => onFieldChange("doc_type", e.target.value)} style={selectStyle}>
            {DOC_TYPES.map(d => <option key={d} value={d}>{d}</option>)}
          </select>
        </Field>
      </div>
      <Field label="Numéro du document" labelEn="Document number" required>
        <input value={companion.doc_numero} onChange={e => onFieldChange("doc_numero", e.target.value)} style={{ ...inputStyle, ...errStyle("doc_numero") }} placeholder="AB123456" />
      </Field>
      <PhotoUpload
        label="Photo de la pièce d'identité (recto) / passeport"
        required
        value={companion.photoRecto}
        fileName={companion.photoRectoName}
        error={errors[`companion_${index}_photo_recto`]}
        onChange={(dataUrl, name) => { onFieldChange("photoRecto", dataUrl); onFieldChange("photoRectoName", name); }}
      />
      <PhotoUpload
        label="Photo de la pièce d'identité (verso)"
        value={companion.photoVerso}
        fileName={companion.photoVersoName}
        onChange={(dataUrl, name) => { onFieldChange("photoVerso", dataUrl); onFieldChange("photoVersoName", name); }}
      />
    </div>
  );
}

function PhotoUpload({ label, required, value, fileName, onChange, error }) {
  const inputRef = useRef(null);
  const [dragOver, setDragOver] = useState(false);

  const handleFiles = async (files) => {
    const file = files?.[0];
    if (!file) return;
    const dataUrl = await fileToCompressedDataURL(file);
    onChange(dataUrl, file.name);
  };

  return (
    <Field label={label} required={required}>
      <div
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => { e.preventDefault(); setDragOver(false); handleFiles(e.dataTransfer.files); }}
        style={{
          border: `1.5px ${dragOver ? "solid" : "dashed"} ${error ? "#d98f80" : dragOver ? C.navy : C.border}`,
          borderRadius: "8px",
          background: C.inputBg,
          padding: value ? "16px" : "32px 16px",
          textAlign: "center",
          cursor: "pointer",
          transition: "border-color 0.15s",
        }}
      >
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          style={{ display: "none" }}
          onChange={(e) => handleFiles(e.target.files)}
        />
        {value ? (
          <div style={{ display: "flex", alignItems: "center", gap: "14px", textAlign: "left" }}>
            <img src={value} alt={label} style={{ width: "64px", height: "64px", objectFit: "cover", borderRadius: "6px", border: `1px solid ${C.border}` }} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: "13px", color: C.navy, fontWeight: 700, fontFamily: FONT, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{fileName}</div>
              <div
                onClick={(e) => { e.stopPropagation(); onChange(null, null); }}
                style={{ fontSize: "12px", color: C.navySoft, textDecoration: "underline", marginTop: "4px", cursor: "pointer", fontFamily: FONT }}
              >
                Remplacer / Replace
              </div>
            </div>
          </div>
        ) : (
          <>
            <div style={{ display: "flex", justifyContent: "center", marginBottom: "10px" }}><UploadCloudIcon /></div>
            <div style={{ fontSize: "14px", fontWeight: 700, color: C.navy, fontFamily: FONT }}>Téléverser un fichier</div>
            <div style={{ fontSize: "12px", color: C.navyFaint, marginTop: "4px", fontFamily: FONT }}>Glissez-déposez une image ici</div>
          </>
        )}
      </div>
      {error && <div style={{ color: "#a23b2e", fontSize: "11px", marginTop: "6px", fontFamily: FONT }}>⚠ Photo requise</div>}
    </Field>
  );
}

/* ------------------------------------------------------------------ */
/* Main component                                                      */
/* ------------------------------------------------------------------ */
export default function FichePolice() {
  const today = new Date().toISOString().split("T")[0];
  const [signature, setSignature] = useState(null);
  const [signatureRental, setSignatureRental] = useState(null);
  const [submitted, setSubmitted] = useState(false);
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState(null);
  const urlParams = new URLSearchParams(window.location.search);
  const propertyFromUrl = urlParams.get("property") || "";

  const ua = typeof navigator !== "undefined" ? navigator.userAgent || "" : "";
  const isInAppBrowser = /Instagram|FBAN|FBAV|WhatsApp|Messenger|Line\/|Twitter|TikTok|Booking\.com/i.test(ua);

  const [form, setForm] = useState({
    property: propertyFromUrl,
    nom: "", prenom: "", date_naissance: "", lieu_naissance: "",
    nationalite: "", doc_type: "Passeport", doc_numero: "",
    doc_delivre_par: "", doc_date_expiration: "",
    adresse_domicile: "", pays_residence: "",
    date_arrivee: today, date_depart: "",
    motif_sejour: "", nb_personnes: "1",
    email: "", telephone: "",
    consent_cndp: false,
    consent_rental: false,
    statut_marital: "",
    acte_mariage: "",
  });

  const [docPhotoRecto, setDocPhotoRecto] = useState(null);
  const [docPhotoRectoName, setDocPhotoRectoName] = useState(null);
  const [docPhotoVerso, setDocPhotoVerso] = useState(null);
  const [docPhotoVersoName, setDocPhotoVersoName] = useState(null);

  const emptyCompanion = () => ({ nom: "", prenom: "", nationalite: "", doc_type: "Passeport", doc_numero: "", photoRecto: null, photoRectoName: null, photoVerso: null, photoVersoName: null });
  const [companions, setCompanions] = useState([]);
  const addCompanion = () => setCompanions(c => c.length >= MAX_COMPANIONS ? c : [...c, emptyCompanion()]);
  const removeCompanion = (i) => setCompanions(c => c.filter((_, idx) => idx !== i));
  const setCompanionField = (i, k, v) => setCompanions(c => c.map((comp, idx) => idx === i ? { ...comp, [k]: v } : comp));

  const [errors, setErrors] = useState({});
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const validate = () => {
    const e = {};
    if (!form.property.trim()) e.property = true;
    if (!form.nom.trim()) e.nom = true;
    if (!form.prenom.trim()) e.prenom = true;
    if (!form.date_naissance) e.date_naissance = true;
    if (!form.nationalite) e.nationalite = true;
    if (!form.doc_numero.trim()) e.doc_numero = true;
    if (!form.date_arrivee) e.date_arrivee = true;
    if (!form.date_depart) e.date_depart = true;
    if (!docPhotoRecto) e.doc_photo_recto = true;
    companions.forEach((comp, i) => {
      if (!comp.nom.trim()) e[`companion_${i}_nom`] = true;
      if (!comp.prenom.trim()) e[`companion_${i}_prenom`] = true;
      if (!comp.doc_numero.trim()) e[`companion_${i}_doc_numero`] = true;
      if (!comp.photoRecto) e[`companion_${i}_photo_recto`] = true;
    });
    if (!form.consent_cndp) e.consent_cndp = true;
    if (!form.consent_rental) e.consent_rental = true;
    if (!signature) e.signature = true;
    if (!signatureRental) e.signatureRental = true;
    const isMoroccan = form.nationalite === "Marocaine";
    const isCouple = parseInt(form.nb_personnes) >= 2;
    if (isMoroccan && isCouple && !form.statut_marital) e.statut_marital = true;
    if (isMoroccan && isCouple && form.statut_marital === "Célibataire") e.statut_marital_blocked = true;
    if (isMoroccan && isCouple && form.statut_marital === "Marié(e)" && !form.acte_mariage.trim()) e.acte_mariage = true;
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const err = (k) => errors[k] ? { borderColor: "#d98f80" } : {};

  const handleSubmit = async () => {
    if (!validate()) return;
    setSending(true);
    setSendError(null);
    try {
      await emailjs.send(
        EMAILJS_SERVICE_ID,
        EMAILJS_TEMPLATE_ID,
        {
          signature_checkin: signature,
          signature_rental: signatureRental,
          doc_photo_recto: docPhotoRecto,
          doc_photo_verso: docPhotoVerso,
          companions_count: companions.length,
          companions_summary: companions.length
            ? companions.map((c, i) => `${i + 2}. ${c.nom} ${c.prenom} — ${c.doc_type} n°${c.doc_numero}${c.nationalite ? " — " + c.nationalite : ""}`).join("\n")
            : "Aucun voyageur supplémentaire",
          companion1_nom: companions[0]?.nom || "", companion1_prenom: companions[0]?.prenom || "",
          companion1_photo_recto: companions[0]?.photoRecto || "", companion1_photo_verso: companions[0]?.photoVerso || "",
          companion2_nom: companions[1]?.nom || "", companion2_prenom: companions[1]?.prenom || "",
          companion2_photo_recto: companions[1]?.photoRecto || "", companion2_photo_verso: companions[1]?.photoVerso || "",
          companion3_nom: companions[2]?.nom || "", companion3_prenom: companions[2]?.prenom || "",
          companion3_photo_recto: companions[2]?.photoRecto || "", companion3_photo_verso: companions[2]?.photoVerso || "",
          companion4_nom: companions[3]?.nom || "", companion4_prenom: companions[3]?.prenom || "",
          companion4_photo_recto: companions[3]?.photoRecto || "", companion4_photo_verso: companions[3]?.photoVerso || "",
          companion5_nom: companions[4]?.nom || "", companion5_prenom: companions[4]?.prenom || "",
          companion5_photo_recto: companions[4]?.photoRecto || "", companion5_photo_verso: companions[4]?.photoVerso || "",
          companion6_nom: companions[5]?.nom || "", companion6_prenom: companions[5]?.prenom || "",
          companion6_photo_recto: companions[5]?.photoRecto || "", companion6_photo_verso: companions[5]?.photoVerso || "",
          companion7_nom: companions[6]?.nom || "", companion7_prenom: companions[6]?.prenom || "",
          companion7_photo_recto: companions[6]?.photoRecto || "", companion7_photo_verso: companions[6]?.photoVerso || "",
          property: form.property,
          nom: form.nom,
          prenom: form.prenom,
          date_naissance: form.date_naissance,
          lieu_naissance: form.lieu_naissance,
          nationalite: form.nationalite,
          doc_type: form.doc_type,
          doc_numero: form.doc_numero,
          doc_delivre_par: form.doc_delivre_par,
          doc_date_expiration: form.doc_date_expiration,
          adresse_domicile: form.adresse_domicile,
          pays_residence: form.pays_residence,
          date_arrivee: form.date_arrivee,
          date_depart: form.date_depart,
          motif_sejour: form.motif_sejour,
          nb_personnes: form.nb_personnes,
          email: form.email,
          telephone: form.telephone,
          statut_marital: form.statut_marital || "N/A",
          acte_mariage: form.acte_mariage || "N/A",
          name: `${form.prenom} ${form.nom}`,
          message: `Check-in form + rental agreement signed on ${new Date().toLocaleDateString("fr-MA")}`,
        }
      );
      setSubmitted(true);
    } catch (err) {
      console.error(err);
      const detail = err?.text || err?.message || (typeof err === "string" ? err : JSON.stringify(err));
      setSendError(detail || "Unknown error");
    } finally {
      setSending(false);
    }
  };

  if (submitted) {
    return (
      <div style={{ minHeight: "100vh", background: C.bg, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: FONT, padding: "20px" }}>
        <div style={{ textAlign: "center", maxWidth: "480px", background: C.white, border: `1px solid ${C.border}`, borderRadius: "12px", padding: "40px 32px" }}>
          <div style={{ fontSize: "44px", marginBottom: "20px", color: C.navy }}>✓</div>
          <h2 style={{ color: C.navy, fontSize: "20px", marginBottom: "12px", fontWeight: 800, fontFamily: FONT }}>Documents Enregistrés</h2>
          <p style={{ color: C.navySoft, fontSize: "15px", lineHeight: 1.8, fontFamily: FONT }}>Merci, <strong style={{ color: C.navy }}>{form.prenom} {form.nom}</strong>.</p>
          <p style={{ color: C.navyFaint, fontSize: "13px", lineHeight: 1.8, fontFamily: FONT }}>
            Votre dossier a été enregistré et transmis à Medina Moon Stays.<br/>
            <span style={{ fontSize: "11px" }}>Your check-in form and rental agreement have been recorded.</span>
          </p>
          <div style={{ marginTop: "24px", padding: "16px", border: `1px solid ${C.bandBorder}`, borderRadius: "8px", background: C.band }}>
            <p style={{ color: C.navy, fontSize: "13px", fontWeight: 700, margin: 0, fontFamily: FONT }}>{form.property}</p>
            <p style={{ color: C.navySoft, fontSize: "12px", margin: "4px 0 0", fontFamily: FONT }}>{form.date_arrivee} → {form.date_depart}</p>
          </div>
          <div style={{ marginTop: "32px", display: "flex", justifyContent: "center", gap: "32px" }}>
            <div>
              <img src={signature} alt="signature 1" style={{ maxWidth: "160px", opacity: 0.9, border: `1px solid ${C.border}`, borderRadius: "6px" }} />
              <p style={{ color: C.navyFainter, fontSize: "10px", letterSpacing: "1px", marginTop: "6px", fontFamily: FONT }}>GUEST REGISTRATION</p>
            </div>
            <div>
              <img src={signatureRental} alt="signature 2" style={{ maxWidth: "160px", opacity: 0.9, border: `1px solid ${C.border}`, borderRadius: "6px" }} />
              <p style={{ color: C.navyFainter, fontSize: "10px", letterSpacing: "1px", marginTop: "6px", fontFamily: FONT }}>RENTAL AGREEMENT</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: C.bg, fontFamily: FONT, color: C.navy }}>
      <div style={{ borderBottom: `1.5px solid ${C.bandBorder}`, padding: "32px 24px 26px", textAlign: "center", background: C.band }}>
        <div style={{ fontSize: "22px", fontWeight: 800, color: C.navy, letterSpacing: "1px", fontFamily: FONT }}>MEDINA MOON STAYS</div>
        <div style={{ fontSize: "14px", color: C.navySoft, marginTop: "6px", fontFamily: FONT }}>Check-in Form &amp; Rental Agreement</div>
        <div style={{ fontSize: "12px", color: C.navyFaint, marginTop: "2px", fontFamily: FONT }}>Guest Registration &amp; Rental Agreement</div>
        <div style={{ fontSize: "10px", color: C.navyFaint, marginTop: "12px", letterSpacing: "0.5px", fontFamily: FONT }}>
          Loi n°80-14 &nbsp;·&nbsp; Décret n°2.23.441 &nbsp;·&nbsp; Loi n°09-08 CNDP
        </div>
      </div>

      <div style={{ maxWidth: "720px", margin: "0 auto", padding: "24px 20px 60px" }}>

        <div style={{ margin: "0 0 20px", padding: "13px 18px", background: C.white, border: `1.5px solid ${C.borderStrong}`, borderLeft: `4px solid ${C.navy}`, borderRadius: "6px", fontSize: "12.5px", color: C.navySoft, lineHeight: 1.7, fontFamily: FONT }}>
          Merci de compléter tous les champs et de signer les deux sections ci-dessous.
          <br /><span style={{ fontSize: "11px", color: C.navyFaint }}>Please complete all fields and sign both sections below.</span>
        </div>

        <div style={{ marginBottom: "10px", padding: "18px", border: `1.5px solid ${errors.property ? "#d98f80" : C.borderStrong}`, borderRadius: "8px", background: C.white, display: "flex", alignItems: "center", justifyContent: "space-between", gap: "16px", flexWrap: "wrap" }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: "12px", fontWeight: 700, color: C.navy, marginBottom: "6px", fontFamily: FONT }}>Propriété / Property *</div>
            {propertyFromUrl ? (
              <div style={{ fontSize: "17px", color: C.navy, fontWeight: 700, fontFamily: FONT }}>{form.property}</div>
            ) : (
              <input value={form.property} onChange={e => set("property", e.target.value)} placeholder="Property name" style={{ ...inputStyle, ...err("property") }} />
            )}
          </div>
        </div>

        <SectionTitle>Séjour et réservation | Stay and booking</SectionTitle>

        <SectionTitle>Identité et contact | Identity and contact</SectionTitle>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 20px" }}>
          <Field label="Nom de famille" labelEn="Last name" required><input value={form.nom} onChange={e => set("nom", e.target.value)} style={{ ...inputStyle, ...err("nom") }} placeholder="DUPONT" /></Field>
          <Field label="Prénom(s)" labelEn="First name(s)" required><input value={form.prenom} onChange={e => set("prenom", e.target.value)} style={{ ...inputStyle, ...err("prenom") }} placeholder="Jean" /></Field>
          <Field label="Date de naissance" labelEn="Date of birth" required><input type="date" value={form.date_naissance} onChange={e => set("date_naissance", e.target.value)} style={{ ...inputStyle, ...err("date_naissance") }} /></Field>
          <Field label="Lieu de naissance" labelEn="Place of birth"><input value={form.lieu_naissance} onChange={e => set("lieu_naissance", e.target.value)} style={inputStyle} placeholder="Paris, France" /></Field>
          <Field label="Nationalité" labelEn="Nationality" required>
            <select value={form.nationalite} onChange={e => set("nationalite", e.target.value)} style={{ ...selectStyle, ...err("nationalite") }}>
              <option value="">— Sélectionner —</option>
              {NATIONALITIES.map(n => <option key={n} value={n}>{n}</option>)}
            </select>
          </Field>
          <Field label="Pays de résidence" labelEn="Country of residence"><input value={form.pays_residence} onChange={e => set("pays_residence", e.target.value)} style={inputStyle} placeholder="France" /></Field>
        </div>
        <Field label="Adresse de domicile" labelEn="Home address"><input value={form.adresse_domicile} onChange={e => set("adresse_domicile", e.target.value)} style={inputStyle} placeholder="12 rue de la Paix, 75001 Paris" /></Field>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 20px" }}>
          <Field label="Email" required><input type="email" value={form.email} onChange={e => set("email", e.target.value)} style={inputStyle} placeholder="jean.dupont@email.com" /></Field>
          <Field label="Téléphone" labelEn="Phone"><input value={form.telephone} onChange={e => set("telephone", e.target.value)} style={inputStyle} placeholder="+33 6 12 34 56 78" /></Field>
        </div>

        <SectionTitle>Voyage et séjour | Travel and stay</SectionTitle>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0 20px" }}>
          <Field label="Date d'arrivée" labelEn="Check-in" required><input type="date" value={form.date_arrivee} onChange={e => set("date_arrivee", e.target.value)} style={{ ...inputStyle, ...err("date_arrivee") }} /></Field>
          <Field label="Date de départ" labelEn="Check-out" required><input type="date" value={form.date_depart} onChange={e => set("date_depart", e.target.value)} style={{ ...inputStyle, ...err("date_depart") }} /></Field>
          <Field label="Nb. personnes" labelEn="Guests"><input type="number" min="1" max="20" value={form.nb_personnes} onChange={e => set("nb_personnes", e.target.value)} style={inputStyle} /></Field>
        </div>
        <Field label="Motif du séjour" labelEn="Purpose of stay">
          <select value={form.motif_sejour} onChange={e => set("motif_sejour", e.target.value)} style={selectStyle}>
            <option value="">— Sélectionner —</option>
            <option>Tourisme / Tourism</option><option>Affaires / Business</option><option>Famille / Family</option><option>Lune de miel / Honeymoon</option><option>Autre / Other</option>
          </select>
        </Field>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 20px" }}>
          <Field label="Type de document" required>
            <select value={form.doc_type} onChange={e => set("doc_type", e.target.value)} style={selectStyle}>
              {DOC_TYPES.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          </Field>
          <Field label="Numéro" labelEn="Number" required><input value={form.doc_numero} onChange={e => set("doc_numero", e.target.value)} style={{ ...inputStyle, ...err("doc_numero") }} placeholder="AB123456" /></Field>
          <Field label="Délivré par" labelEn="Issued by"><input value={form.doc_delivre_par} onChange={e => set("doc_delivre_par", e.target.value)} style={inputStyle} /></Field>
          <Field label="Date d'expiration" labelEn="Expiry date"><input type="date" value={form.doc_date_expiration} onChange={e => set("doc_date_expiration", e.target.value)} style={inputStyle} /></Field>
        </div>

        <SectionTitle>Pièces d'identité | Identity documents</SectionTitle>
        <div style={{ fontSize: "12px", color: C.navyFaint, marginBottom: "14px", fontFamily: FONT, lineHeight: 1.6 }}>
          Conformément à la loi n°80-14, chaque voyageur majeur séjournant sur place doit être enregistré avec sa propre pièce d'identité — ajoutez une fiche pour chaque personne supplémentaire ci-dessous.
        </div>
        <div style={{ fontSize: "12px", fontWeight: 700, color: C.navy, marginBottom: "10px", fontFamily: FONT }}>Voyageur 1 (signataire principal)</div>
        <PhotoUpload
          label="Photo de la pièce d'identité (recto) / passeport"
          required
          value={docPhotoRecto}
          fileName={docPhotoRectoName}
          error={errors.doc_photo_recto}
          onChange={(dataUrl, name) => { setDocPhotoRecto(dataUrl); setDocPhotoRectoName(name); }}
        />
        <PhotoUpload
          label="Photo de la pièce d'identité (verso)"
          value={docPhotoVerso}
          fileName={docPhotoVersoName}
          onChange={(dataUrl, name) => { setDocPhotoVerso(dataUrl); setDocPhotoVersoName(name); }}
        />

        {companions.map((comp, i) => (
          <CompanionCard
            key={i}
            index={i}
            companion={comp}
            errors={errors}
            onFieldChange={(k, v) => setCompanionField(i, k, v)}
            onRemove={() => removeCompanion(i)}
          />
        ))}

        {companions.length < MAX_COMPANIONS && (
          <button
            type="button"
            onClick={addCompanion}
            style={{
              width: "100%", marginBottom: "8px", padding: "13px",
              background: C.white, border: `1.5px dashed ${C.borderStrong}`, borderRadius: "8px",
              color: C.navy, fontSize: "13px", fontWeight: 700, fontFamily: FONT, cursor: "pointer",
            }}
          >
            + Ajouter un voyageur / Add a guest
          </button>
        )}

        {form.nationalite === "Marocaine" && parseInt(form.nb_personnes) >= 2 && (
          <div style={{ margin: "24px 0", padding: "20px", background: C.warnBg, border: `1.5px solid ${errors.statut_marital || errors.statut_marital_blocked ? "#c0392b" : C.warnBorder}`, borderRadius: "8px" }}>
            <div style={{ fontSize: "13px", fontWeight: 700, color: C.navy, marginBottom: "14px", fontFamily: FONT }}>Statut marital / Marital Status</div>
            <div style={{ fontSize: "12.5px", color: C.navySoft, marginBottom: "16px", lineHeight: 1.7, fontFamily: FONT }}>
              Pour les ressortissants marocains, les couples non mariés ne sont pas acceptés conformément à la loi marocaine. — For Moroccan nationals, unmarried couples are not accepted under Moroccan law.
            </div>
            <Field label="Statut marital" labelEn="Marital status" required>
              <select value={form.statut_marital} onChange={e => set("statut_marital", e.target.value)} style={{ ...selectStyle, ...err("statut_marital") }}>
                <option value="">— Sélectionner —</option>
                <option>Marié(e)</option>
                <option>Famille / Amis</option>
                <option>Célibataire</option>
                <option>Autre</option>
              </select>
            </Field>
            {form.statut_marital === "Célibataire" && (
              <div style={{ padding: "14px 18px", background: C.errorBg, border: `1px solid ${C.errorBorder}`, borderRadius: "6px", fontSize: "12.5px", color: C.errorText, lineHeight: 1.7, fontFamily: FONT }}>
                ⚠ Les couples non mariés ne sont pas acceptés conformément à la loi marocaine. Votre réservation pourra être annulée à l'arrivée sans remboursement.
              </div>
            )}
            {form.statut_marital === "Marié(e)" && (
              <Field label="Numéro acte de mariage" labelEn="Marriage certificate number" required>
                <input value={form.acte_mariage} onChange={e => set("acte_mariage", e.target.value)} style={{ ...inputStyle, ...err("acte_mariage") }} placeholder="Ex: 1234/2024" />
              </Field>
            )}
          </div>
        )}

        <SectionTitle>Déclarations, consentement et signature | Declarations, consent and signature</SectionTitle>

        <div style={{ margin: "0 0 24px", padding: "16px 20px", background: C.white, border: `1.5px solid ${errors.consent_cndp ? "#d98f80" : C.border}`, borderRadius: "8px" }}>
          <label style={{ display: "flex", gap: "14px", alignItems: "flex-start", cursor: "pointer" }}>
            <input type="checkbox" checked={form.consent_cndp} onChange={e => set("consent_cndp", e.target.checked)} style={{ marginTop: "3px", accentColor: C.navy, width: "16px", height: "16px", flexShrink: 0 }} />
            <span style={{ fontSize: "12.5px", color: C.navySoft, lineHeight: 1.7, fontFamily: FONT }}>
              Je consens au traitement de mes données personnelles conformément à la loi n°09-08 CNDP. Données conservées 2 ans.
              <br /><span style={{ color: C.navyFaint, fontSize: "11px" }}>I consent to the processing of my personal data for registration purposes, in compliance with Moroccan law n°09-08 / CNDP. Data retained 2 years.</span>
            </span>
          </label>
        </div>

        <div style={{ marginBottom: "8px", fontSize: "12.5px", color: C.navySoft, lineHeight: 1.7, fontFamily: FONT }}>En signant, je confirme l'exactitude des informations fournies ci-dessus.</div>
        <div style={{ border: `1.5px solid ${errors.signature ? "#d98f80" : C.border}`, borderRadius: "8px", padding: "16px", background: C.white, marginBottom: "28px" }}>
          <SignaturePad onSign={setSignature} signed={!!signature} label="Sign here / Signez ici" />
          {errors.signature && <div style={{ color: "#a23b2e", fontSize: "11px", marginTop: "8px", fontFamily: FONT }}>⚠ Signature requise</div>}
        </div>

        <SectionTitle>Contrat de location | Rental agreement</SectionTitle>

        <div style={{ margin: "0 0 16px", padding: "20px", background: C.white, border: `1px solid ${C.border}`, borderRadius: "8px", fontSize: "12.5px", color: C.navySoft, lineHeight: 2, fontFamily: FONT }}>
          <div style={{ fontSize: "13px", color: C.navy, marginBottom: "12px", fontWeight: 700 }}>Règlement intérieur et conditions générales</div>
          <div>• Arrivée à partir de <strong style={{ color: C.navy }}>15h00</strong> — Départ avant <strong style={{ color: C.navy }}>11h00</strong></div>
          <div>• L'occupation maximale doit être respectée</div>
          <div>• Aucune fête ni événement sans accord écrit préalable</div>
          <div>• Interdiction de fumer à l'intérieur</div>
          <div>• Silence entre 22h00 et 8h00</div>
          <div>• Le logement doit être rendu propre</div>
          <div>• Caution restituée sous 48h après le départ en l'absence de dommage</div>
          <div>• Le voyageur est responsable de tout dommage causé pendant le séjour</div>
          <div style={{ marginTop: "12px", fontSize: "11px", color: C.navyFaint }}>Contrat régi par le droit marocain — Loi n°94-14.</div>
        </div>

        <div style={{ margin: "0 0 24px", padding: "16px 20px", background: C.white, border: `1.5px solid ${errors.consent_rental ? "#d98f80" : C.border}`, borderRadius: "8px" }}>
          <label style={{ display: "flex", gap: "14px", alignItems: "flex-start", cursor: "pointer" }}>
            <input type="checkbox" checked={form.consent_rental} onChange={e => set("consent_rental", e.target.checked)} style={{ marginTop: "3px", accentColor: C.navy, width: "16px", height: "16px", flexShrink: 0 }} />
            <span style={{ fontSize: "12.5px", color: C.navySoft, lineHeight: 1.7, fontFamily: FONT }}>
              J'ai lu et j'accepte les conditions générales du contrat de location ci-dessus.
              <br /><span style={{ color: C.navyFaint, fontSize: "11px" }}>I have read and agree to the rental agreement terms and house rules above.</span>
            </span>
          </label>
        </div>

        <div style={{ marginBottom: "8px", fontSize: "12.5px", color: C.navySoft, lineHeight: 1.7, fontFamily: FONT }}>En signant, j'accepte l'intégralité des termes du contrat de location ci-dessus.</div>
        <div style={{ border: `1.5px solid ${errors.signatureRental ? "#d98f80" : C.border}`, borderRadius: "8px", padding: "16px", background: C.white }}>
          <SignaturePad onSign={setSignatureRental} signed={!!signatureRental} label="Sign here / Signez ici" />
          {errors.signatureRental && <div style={{ color: "#a23b2e", fontSize: "11px", marginTop: "8px", fontFamily: FONT }}>⚠ Signature requise</div>}
        </div>

        <div style={{ marginTop: "16px", fontSize: "12px", color: C.navyFaint, display: "flex", justifyContent: "flex-end", fontFamily: FONT }}>
          {new Date().toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" })}
        </div>

        {Object.keys(errors).length > 0 && (
          <div style={{ marginTop: "20px", padding: "12px 16px", background: C.warnBg, border: `1px solid ${C.warnBorder}`, borderRadius: "6px", fontSize: "12.5px", color: C.navy, fontFamily: FONT }}>
            ⚠ Merci de compléter tous les champs requis et de signer les deux sections.
          </div>
        )}

        {isInAppBrowser && (
          <div style={{ marginTop: "16px", padding: "12px 16px", background: C.warnBg, border: `1px solid ${C.warnBorder}`, borderRadius: "6px", fontSize: "12.5px", color: C.navy, fontFamily: FONT }}>
            ⚠ Vous semblez ouvrir ce lien dans une application (WhatsApp / Instagram / Booking.com). Cela peut empêcher l'envoi du formulaire.
            <br />Merci d'ouvrir cette page dans votre navigateur habituel (Safari ou Chrome) via le menu "..." ou "Ouvrir dans le navigateur", puis remplissez à nouveau le formulaire.
          </div>
        )}

        {sendError && (
          <div style={{ marginTop: "16px", padding: "12px 16px", background: C.errorBg, border: `1px solid ${C.errorBorder}`, borderRadius: "6px", fontSize: "12.5px", color: C.errorText, fontFamily: FONT }}>
            ⚠ Erreur lors de l'envoi. Merci de réessayer ou de contacter Medina Moon Stays directement.
            <div style={{ marginTop: "6px", fontSize: "10px", opacity: 0.8, wordBreak: "break-word" }}>Debug: {sendError}</div>
          </div>
        )}

        <button onClick={handleSubmit} disabled={sending} style={{
          marginTop: "28px", width: "100%",
          background: sending ? "#9aa1b0" : C.navy,
          border: "none", borderRadius: "6px", color: "#ffffff", padding: "16px",
          fontSize: "14px", letterSpacing: "0.5px", fontFamily: FONT, fontWeight: 700,
          cursor: sending ? "not-allowed" : "pointer",
        }}>
          {sending ? "Envoi en cours..." : "Envoyer — Check-in Form & Rental Agreement"}
        </button>

        <div style={{ marginTop: "20px", textAlign: "center", fontSize: "10px", color: C.navyFainter, letterSpacing: "0.5px", lineHeight: 2, fontFamily: FONT }}>
          Medina Moon Stays — Loi 80-14 · Décret 2.23.441 · CNDP Loi 09-08
        </div>
      </div>
    </div>
  );
}  errorBorder: "#d98f80",
};

const FONT = "'Helvetica Neue', Arial, sans-serif";

/* ------------------------------------------------------------------ */
/* Image helper — resize + compress before embedding as base64        */
/* ------------------------------------------------------------------ */
function fileToCompressedDataURL(file, maxWidth = 1400, quality = 0.75) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = reject;
    reader.onload = () => {
      const img = new Image();
      img.onerror = reject;
      img.onload = () => {
        const scale = Math.min(1, maxWidth / img.width);
        const canvas = document.createElement("canvas");
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL("image/jpeg", quality));
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
}

/* ------------------------------------------------------------------ */
/* Signature pad                                                       */
/* ------------------------------------------------------------------ */
function SignaturePad({ onSign, signed, label = "Signez ici / Sign here" }) {
  const canvasRef = useRef(null);
  const drawing = useRef(false);
  const lastPos = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = C.navy;
    ctx.lineWidth = 2;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
  }, []);

  const getPos = (e, canvas) => {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    if (e.touches) {
      return { x: (e.touches[0].clientX - rect.left) * scaleX, y: (e.touches[0].clientY - rect.top) * scaleY };
    }
    return { x: (e.clientX - rect.left) * scaleX, y: (e.clientY - rect.top) * scaleY };
  };

  const startDraw = (e) => { e.preventDefault(); drawing.current = true; lastPos.current = getPos(e, canvasRef.current); };
  const draw = (e) => {
    e.preventDefault();
    if (!drawing.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const pos = getPos(e, canvas);
    ctx.beginPath(); ctx.moveTo(lastPos.current.x, lastPos.current.y); ctx.lineTo(pos.x, pos.y); ctx.stroke();
    lastPos.current = pos;
    onSign(canvas.toDataURL());
  };
  const stopDraw = () => { drawing.current = false; };
  const clear = () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = "#ffffff"; ctx.fillRect(0, 0, canvas.width, canvas.height);
    onSign(null);
  };

  return (
    <div style={{ position: "relative" }}>
      <canvas ref={canvasRef} width={600} height={150}
        onMouseDown={startDraw} onMouseMove={draw} onMouseUp={stopDraw} onMouseLeave={stopDraw}
        onTouchStart={startDraw} onTouchMove={draw} onTouchEnd={stopDraw}
        style={{ width: "100%", height: "120px", border: `1.5px solid ${C.borderStrong}`, borderRadius: "6px", cursor: "crosshair", display: "block", touchAction: "none", background: "#fff" }}
      />
      {!signed && (
        <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)", color: C.navyFainter, fontSize: "13px", pointerEvents: "none", fontFamily: FONT, letterSpacing: "1px" }}>
          {label}
        </div>
      )}
      <button onClick={clear} style={{ marginTop: "8px", background: "transparent", border: `1px solid ${C.border}`, color: C.navySoft, padding: "5px 14px", borderRadius: "4px", fontSize: "11px", cursor: "pointer", letterSpacing: "0.5px", fontFamily: FONT }}>
        Effacer / Clear
      </button>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Field / Section / inputs                                            */
/* ------------------------------------------------------------------ */
function Field({ label, labelEn, children, required }) {
  return (
    <div style={{ marginBottom: "20px" }}>
      <label style={{ display: "block", marginBottom: "6px", fontSize: "13px", fontWeight: 700, color: C.navy, fontFamily: FONT }}>
        {label}{labelEn && <span style={{ color: C.navyFaint, marginLeft: "8px", fontSize: "11px", fontWeight: 400 }}>/ {labelEn}</span>}{required && <span style={{ color: "#b2402f", marginLeft: "4px" }}>*</span>}
      </label>
      {children}
    </div>
  );
}

const inputStyle = {
  width: "100%",
  background: C.inputBg,
  border: `1.5px solid ${C.border}`,
  borderRadius: "6px",
  color: C.navy,
  padding: "11px 14px",
  fontSize: "14px",
  fontFamily: FONT,
  outline: "none",
  boxSizing: "border-box",
};
const selectStyle = {
  ...inputStyle,
  appearance: "none",
  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath d='M1 1l5 5 5-5' stroke='%2316213e' stroke-width='1.5' fill='none'/%3E%3C/svg%3E")`,
  backgroundRepeat: "no-repeat",
  backgroundPosition: "right 14px center",
  paddingRight: "36px",
  cursor: "pointer",
};

function SectionTitle({ children }) {
  return (
    <div style={{
      margin: "30px 0 20px", padding: "13px 20px",
      background: C.band, border: `1px solid ${C.bandBorder}`, borderRadius: "6px",
      textAlign: "center",
    }}>
      <span style={{ fontSize: "14px", fontWeight: 700, color: C.navy, fontFamily: FONT }}>{children}</span>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Passport / ID photo upload field                                    */
/* ------------------------------------------------------------------ */
function UploadCloudIcon() {
  return (
    <svg width="34" height="34" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M7 18a4.5 4.5 0 0 1-.4-8.98A5.5 5.5 0 0 1 17.2 8.1 4 4 0 0 1 17 16" stroke={C.navy} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M12 11v7m0-7 3 3m-3-3-3 3" stroke={C.navy} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function PhotoUpload({ label, required, value, fileName, onChange, error }) {
  const inputRef = useRef(null);
  const [dragOver, setDragOver] = useState(false);

  const handleFiles = async (files) => {
    const file = files?.[0];
    if (!file) return;
    const dataUrl = await fileToCompressedDataURL(file);
    onChange(dataUrl, file.name);
  };

  return (
    <Field label={label} required={required}>
      <div
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => { e.preventDefault(); setDragOver(false); handleFiles(e.dataTransfer.files); }}
        style={{
          border: `1.5px ${dragOver ? "solid" : "dashed"} ${error ? "#d98f80" : dragOver ? C.navy : C.border}`,
          borderRadius: "8px",
          background: C.inputBg,
          padding: value ? "16px" : "32px 16px",
          textAlign: "center",
          cursor: "pointer",
          transition: "border-color 0.15s",
        }}
      >
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          style={{ display: "none" }}
          onChange={(e) => handleFiles(e.target.files)}
        />
        {value ? (
          <div style={{ display: "flex", alignItems: "center", gap: "14px", textAlign: "left" }}>
            <img src={value} alt={label} style={{ width: "64px", height: "64px", objectFit: "cover", borderRadius: "6px", border: `1px solid ${C.border}` }} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: "13px", color: C.navy, fontWeight: 700, fontFamily: FONT, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{fileName}</div>
              <div
                onClick={(e) => { e.stopPropagation(); onChange(null, null); }}
                style={{ fontSize: "12px", color: C.navySoft, textDecoration: "underline", marginTop: "4px", cursor: "pointer", fontFamily: FONT }}
              >
                Remplacer / Replace
              </div>
            </div>
          </div>
        ) : (
          <>
            <div style={{ display: "flex", justifyContent: "center", marginBottom: "10px" }}><UploadCloudIcon /></div>
            <div style={{ fontSize: "14px", fontWeight: 700, color: C.navy, fontFamily: FONT }}>Téléverser un fichier</div>
            <div style={{ fontSize: "12px", color: C.navyFaint, marginTop: "4px", fontFamily: FONT }}>Glissez-déposez une image ici</div>
          </>
        )}
      </div>
      {error && <div style={{ color: "#a23b2e", fontSize: "11px", marginTop: "6px", fontFamily: FONT }}>⚠ Photo requise</div>}
    </Field>
  );
}

/* ------------------------------------------------------------------ */
/* Main component                                                      */
/* ------------------------------------------------------------------ */
export default function FichePolice() {
  const today = new Date().toISOString().split("T")[0];
  const [signature, setSignature] = useState(null);
  const [signatureRental, setSignatureRental] = useState(null);
  const [submitted, setSubmitted] = useState(false);
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState(null);
  const urlParams = new URLSearchParams(window.location.search);
  const propertyFromUrl = urlParams.get("property") || "";

  const ua = typeof navigator !== "undefined" ? navigator.userAgent || "" : "";
  const isInAppBrowser = /Instagram|FBAN|FBAV|WhatsApp|Messenger|Line\/|Twitter|TikTok|Booking\.com/i.test(ua);

  const [form, setForm] = useState({
    property: propertyFromUrl,
    nom: "", prenom: "", date_naissance: "", lieu_naissance: "",
    nationalite: "", doc_type: "Passeport", doc_numero: "",
    doc_delivre_par: "", doc_date_expiration: "",
    adresse_domicile: "", pays_residence: "",
    date_arrivee: today, date_depart: "",
    motif_sejour: "", nb_personnes: "1",
    email: "", telephone: "",
    consent_cndp: false,
    consent_rental: false,
    statut_marital: "",
    acte_mariage: "",
  });

  const [docPhotoRecto, setDocPhotoRecto] = useState(null);
  const [docPhotoRectoName, setDocPhotoRectoName] = useState(null);
  const [docPhotoVerso, setDocPhotoVerso] = useState(null);
  const [docPhotoVersoName, setDocPhotoVersoName] = useState(null);

  const [errors, setErrors] = useState({});
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const validate = () => {
    const e = {};
    if (!form.property.trim()) e.property = true;
    if (!form.nom.trim()) e.nom = true;
    if (!form.prenom.trim()) e.prenom = true;
    if (!form.date_naissance) e.date_naissance = true;
    if (!form.nationalite) e.nationalite = true;
    if (!form.doc_numero.trim()) e.doc_numero = true;
    if (!form.date_arrivee) e.date_arrivee = true;
    if (!form.date_depart) e.date_depart = true;
    if (!docPhotoRecto) e.doc_photo_recto = true;
    if (!form.consent_cndp) e.consent_cndp = true;
    if (!form.consent_rental) e.consent_rental = true;
    if (!signature) e.signature = true;
    if (!signatureRental) e.signatureRental = true;
    const isMoroccan = form.nationalite === "Marocaine";
    const isCouple = parseInt(form.nb_personnes) >= 2;
    if (isMoroccan && isCouple && !form.statut_marital) e.statut_marital = true;
    if (isMoroccan && isCouple && form.statut_marital === "Célibataire") e.statut_marital_blocked = true;
    if (isMoroccan && isCouple && form.statut_marital === "Marié(e)" && !form.acte_mariage.trim()) e.acte_mariage = true;
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const err = (k) => errors[k] ? { borderColor: "#d98f80" } : {};

  const handleSubmit = async () => {
    if (!validate()) return;
    setSending(true);
    setSendError(null);
    try {
      await emailjs.send(
        EMAILJS_SERVICE_ID,
        EMAILJS_TEMPLATE_ID,
        {
          signature_checkin: signature,
          signature_rental: signatureRental,
          doc_photo_recto: docPhotoRecto,
          doc_photo_verso: docPhotoVerso,
          property: form.property,
          nom: form.nom,
          prenom: form.prenom,
          date_naissance: form.date_naissance,
          lieu_naissance: form.lieu_naissance,
          nationalite: form.nationalite,
          doc_type: form.doc_type,
          doc_numero: form.doc_numero,
          doc_delivre_par: form.doc_delivre_par,
          doc_date_expiration: form.doc_date_expiration,
          adresse_domicile: form.adresse_domicile,
          pays_residence: form.pays_residence,
          date_arrivee: form.date_arrivee,
          date_depart: form.date_depart,
          motif_sejour: form.motif_sejour,
          nb_personnes: form.nb_personnes,
          email: form.email,
          telephone: form.telephone,
          statut_marital: form.statut_marital || "N/A",
          acte_mariage: form.acte_mariage || "N/A",
          name: `${form.prenom} ${form.nom}`,
          message: `Check-in form + rental agreement signed on ${new Date().toLocaleDateString("fr-MA")}`,
        }
      );
      setSubmitted(true);
    } catch (err) {
      console.error(err);
      const detail = err?.text || err?.message || (typeof err === "string" ? err : JSON.stringify(err));
      setSendError(detail || "Unknown error");
    } finally {
      setSending(false);
    }
  };

  if (submitted) {
    return (
      <div style={{ minHeight: "100vh", background: C.bg, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: FONT, padding: "20px" }}>
        <div style={{ textAlign: "center", maxWidth: "480px", background: C.white, border: `1px solid ${C.border}`, borderRadius: "12px", padding: "40px 32px" }}>
          <div style={{ fontSize: "44px", marginBottom: "20px", color: C.navy }}>✓</div>
          <h2 style={{ color: C.navy, fontSize: "20px", marginBottom: "12px", fontWeight: 800, fontFamily: FONT }}>Documents Enregistrés</h2>
          <p style={{ color: C.navySoft, fontSize: "15px", lineHeight: 1.8, fontFamily: FONT }}>Merci, <strong style={{ color: C.navy }}>{form.prenom} {form.nom}</strong>.</p>
          <p style={{ color: C.navyFaint, fontSize: "13px", lineHeight: 1.8, fontFamily: FONT }}>
            Votre dossier a été enregistré et transmis à Medina Moon Stays.<br/>
            <span style={{ fontSize: "11px" }}>Your check-in form and rental agreement have been recorded.</span>
          </p>
          <div style={{ marginTop: "24px", padding: "16px", border: `1px solid ${C.bandBorder}`, borderRadius: "8px", background: C.band }}>
            <p style={{ color: C.navy, fontSize: "13px", fontWeight: 700, margin: 0, fontFamily: FONT }}>{form.property}</p>
            <p style={{ color: C.navySoft, fontSize: "12px", margin: "4px 0 0", fontFamily: FONT }}>{form.date_arrivee} → {form.date_depart}</p>
          </div>
          <div style={{ marginTop: "32px", display: "flex", justifyContent: "center", gap: "32px" }}>
            <div>
              <img src={signature} alt="signature 1" style={{ maxWidth: "160px", opacity: 0.9, border: `1px solid ${C.border}`, borderRadius: "6px" }} />
              <p style={{ color: C.navyFainter, fontSize: "10px", letterSpacing: "1px", marginTop: "6px", fontFamily: FONT }}>GUEST REGISTRATION</p>
            </div>
            <div>
              <img src={signatureRental} alt="signature 2" style={{ maxWidth: "160px", opacity: 0.9, border: `1px solid ${C.border}`, borderRadius: "6px" }} />
              <p style={{ color: C.navyFainter, fontSize: "10px", letterSpacing: "1px", marginTop: "6px", fontFamily: FONT }}>RENTAL AGREEMENT</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: C.bg, fontFamily: FONT, color: C.navy }}>
      <div style={{ borderBottom: `1.5px solid ${C.bandBorder}`, padding: "32px 24px 26px", textAlign: "center", background: C.band }}>
        <div style={{ fontSize: "22px", fontWeight: 800, color: C.navy, letterSpacing: "1px", fontFamily: FONT }}>MEDINA MOON STAYS</div>
        <div style={{ fontSize: "14px", color: C.navySoft, marginTop: "6px", fontFamily: FONT }}>Check-in Form &amp; Rental Agreement</div>
        <div style={{ fontSize: "12px", color: C.navyFaint, marginTop: "2px", fontFamily: FONT }}>Guest Registration &amp; Rental Agreement</div>
        <div style={{ fontSize: "10px", color: C.navyFaint, marginTop: "12px", letterSpacing: "0.5px", fontFamily: FONT }}>
          Loi n°80-14 &nbsp;·&nbsp; Décret n°2.23.441 &nbsp;·&nbsp; Loi n°09-08 CNDP
        </div>
      </div>

      <div style={{ maxWidth: "720px", margin: "0 auto", padding: "24px 20px 60px" }}>

        <div style={{ margin: "0 0 20px", padding: "13px 18px", background: C.white, border: `1.5px solid ${C.borderStrong}`, borderLeft: `4px solid ${C.navy}`, borderRadius: "6px", fontSize: "12.5px", color: C.navySoft, lineHeight: 1.7, fontFamily: FONT }}>
          Merci de compléter tous les champs et de signer les deux sections ci-dessous.
          <br /><span style={{ fontSize: "11px", color: C.navyFaint }}>Please complete all fields and sign both sections below.</span>
        </div>

        <div style={{ marginBottom: "10px", padding: "18px", border: `1.5px solid ${errors.property ? "#d98f80" : C.borderStrong}`, borderRadius: "8px", background: C.white, display: "flex", alignItems: "center", justifyContent: "space-between", gap: "16px", flexWrap: "wrap" }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: "12px", fontWeight: 700, color: C.navy, marginBottom: "6px", fontFamily: FONT }}>Propriété / Property *</div>
            {propertyFromUrl ? (
              <div style={{ fontSize: "17px", color: C.navy, fontWeight: 700, fontFamily: FONT }}>{form.property}</div>
            ) : (
              <input value={form.property} onChange={e => set("property", e.target.value)} placeholder="Property name" style={{ ...inputStyle, ...err("property") }} />
            )}
          </div>
        </div>

        <SectionTitle>Séjour et réservation | Stay and booking</SectionTitle>

        <SectionTitle>Identité et contact | Identity and contact</SectionTitle>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 20px" }}>
          <Field label="Nom de famille" labelEn="Last name" required><input value={form.nom} onChange={e => set("nom", e.target.value)} style={{ ...inputStyle, ...err("nom") }} placeholder="DUPONT" /></Field>
          <Field label="Prénom(s)" labelEn="First name(s)" required><input value={form.prenom} onChange={e => set("prenom", e.target.value)} style={{ ...inputStyle, ...err("prenom") }} placeholder="Jean" /></Field>
          <Field label="Date de naissance" labelEn="Date of birth" required><input type="date" value={form.date_naissance} onChange={e => set("date_naissance", e.target.value)} style={{ ...inputStyle, ...err("date_naissance") }} /></Field>
          <Field label="Lieu de naissance" labelEn="Place of birth"><input value={form.lieu_naissance} onChange={e => set("lieu_naissance", e.target.value)} style={inputStyle} placeholder="Paris, France" /></Field>
          <Field label="Nationalité" labelEn="Nationality" required>
            <select value={form.nationalite} onChange={e => set("nationalite", e.target.value)} style={{ ...selectStyle, ...err("nationalite") }}>
              <option value="">— Sélectionner —</option>
              {NATIONALITIES.map(n => <option key={n} value={n}>{n}</option>)}
            </select>
          </Field>
          <Field label="Pays de résidence" labelEn="Country of residence"><input value={form.pays_residence} onChange={e => set("pays_residence", e.target.value)} style={inputStyle} placeholder="France" /></Field>
        </div>
        <Field label="Adresse de domicile" labelEn="Home address"><input value={form.adresse_domicile} onChange={e => set("adresse_domicile", e.target.value)} style={inputStyle} placeholder="12 rue de la Paix, 75001 Paris" /></Field>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 20px" }}>
          <Field label="Email" required><input type="email" value={form.email} onChange={e => set("email", e.target.value)} style={inputStyle} placeholder="jean.dupont@email.com" /></Field>
          <Field label="Téléphone" labelEn="Phone"><input value={form.telephone} onChange={e => set("telephone", e.target.value)} style={inputStyle} placeholder="+33 6 12 34 56 78" /></Field>
        </div>

        <SectionTitle>Voyage et séjour | Travel and stay</SectionTitle>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0 20px" }}>
          <Field label="Date d'arrivée" labelEn="Check-in" required><input type="date" value={form.date_arrivee} onChange={e => set("date_arrivee", e.target.value)} style={{ ...inputStyle, ...err("date_arrivee") }} /></Field>
          <Field label="Date de départ" labelEn="Check-out" required><input type="date" value={form.date_depart} onChange={e => set("date_depart", e.target.value)} style={{ ...inputStyle, ...err("date_depart") }} /></Field>
          <Field label="Nb. personnes" labelEn="Guests"><input type="number" min="1" max="20" value={form.nb_personnes} onChange={e => set("nb_personnes", e.target.value)} style={inputStyle} /></Field>
        </div>
        <Field label="Motif du séjour" labelEn="Purpose of stay">
          <select value={form.motif_sejour} onChange={e => set("motif_sejour", e.target.value)} style={selectStyle}>
            <option value="">— Sélectionner —</option>
            <option>Tourisme / Tourism</option><option>Affaires / Business</option><option>Famille / Family</option><option>Lune de miel / Honeymoon</option><option>Autre / Other</option>
          </select>
        </Field>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 20px" }}>
          <Field label="Type de document" required>
            <select value={form.doc_type} onChange={e => set("doc_type", e.target.value)} style={selectStyle}>
              {DOC_TYPES.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          </Field>
          <Field label="Numéro" labelEn="Number" required><input value={form.doc_numero} onChange={e => set("doc_numero", e.target.value)} style={{ ...inputStyle, ...err("doc_numero") }} placeholder="AB123456" /></Field>
          <Field label="Délivré par" labelEn="Issued by"><input value={form.doc_delivre_par} onChange={e => set("doc_delivre_par", e.target.value)} style={inputStyle} /></Field>
          <Field label="Date d'expiration" labelEn="Expiry date"><input type="date" value={form.doc_date_expiration} onChange={e => set("doc_date_expiration", e.target.value)} style={inputStyle} /></Field>
        </div>

        <SectionTitle>Pièces d'identité | Identity documents</SectionTitle>
        <PhotoUpload
          label="Photo de la pièce d'identité (recto) / passeport"
          required
          value={docPhotoRecto}
          fileName={docPhotoRectoName}
          error={errors.doc_photo_recto}
          onChange={(dataUrl, name) => { setDocPhotoRecto(dataUrl); setDocPhotoRectoName(name); }}
        />
        <PhotoUpload
          label="Photo de la pièce d'identité (verso)"
          value={docPhotoVerso}
          fileName={docPhotoVersoName}
          onChange={(dataUrl, name) => { setDocPhotoVerso(dataUrl); setDocPhotoVersoName(name); }}
        />

        {form.nationalite === "Marocaine" && parseInt(form.nb_personnes) >= 2 && (
          <div style={{ margin: "24px 0", padding: "20px", background: C.warnBg, border: `1.5px solid ${errors.statut_marital || errors.statut_marital_blocked ? "#c0392b" : C.warnBorder}`, borderRadius: "8px" }}>
            <div style={{ fontSize: "13px", fontWeight: 700, color: C.navy, marginBottom: "14px", fontFamily: FONT }}>Statut marital / Marital Status</div>
            <div style={{ fontSize: "12.5px", color: C.navySoft, marginBottom: "16px", lineHeight: 1.7, fontFamily: FONT }}>
              Pour les ressortissants marocains, les couples non mariés ne sont pas acceptés conformément à la loi marocaine. — For Moroccan nationals, unmarried couples are not accepted under Moroccan law.
            </div>
            <Field label="Statut marital" labelEn="Marital status" required>
              <select value={form.statut_marital} onChange={e => set("statut_marital", e.target.value)} style={{ ...selectStyle, ...err("statut_marital") }}>
                <option value="">— Sélectionner —</option>
                <option>Marié(e)</option>
                <option>Famille / Amis</option>
                <option>Célibataire</option>
                <option>Autre</option>
              </select>
            </Field>
            {form.statut_marital === "Célibataire" && (
              <div style={{ padding: "14px 18px", background: C.errorBg, border: `1px solid ${C.errorBorder}`, borderRadius: "6px", fontSize: "12.5px", color: C.errorText, lineHeight: 1.7, fontFamily: FONT }}>
                ⚠ Les couples non mariés ne sont pas acceptés conformément à la loi marocaine. Votre réservation pourra être annulée à l'arrivée sans remboursement.
              </div>
            )}
            {form.statut_marital === "Marié(e)" && (
              <Field label="Numéro acte de mariage" labelEn="Marriage certificate number" required>
                <input value={form.acte_mariage} onChange={e => set("acte_mariage", e.target.value)} style={{ ...inputStyle, ...err("acte_mariage") }} placeholder="Ex: 1234/2024" />
              </Field>
            )}
          </div>
        )}

        <SectionTitle>Déclarations, consentement et signature | Declarations, consent and signature</SectionTitle>

        <div style={{ margin: "0 0 24px", padding: "16px 20px", background: C.white, border: `1.5px solid ${errors.consent_cndp ? "#d98f80" : C.border}`, borderRadius: "8px" }}>
          <label style={{ display: "flex", gap: "14px", alignItems: "flex-start", cursor: "pointer" }}>
            <input type="checkbox" checked={form.consent_cndp} onChange={e => set("consent_cndp", e.target.checked)} style={{ marginTop: "3px", accentColor: C.navy, width: "16px", height: "16px", flexShrink: 0 }} />
            <span style={{ fontSize: "12.5px", color: C.navySoft, lineHeight: 1.7, fontFamily: FONT }}>
              Je consens au traitement de mes données personnelles conformément à la loi n°09-08 CNDP. Données conservées 2 ans.
              <br /><span style={{ color: C.navyFaint, fontSize: "11px" }}>I consent to the processing of my personal data for registration purposes, in compliance with Moroccan law n°09-08 / CNDP. Data retained 2 years.</span>
            </span>
          </label>
        </div>

        <div style={{ marginBottom: "8px", fontSize: "12.5px", color: C.navySoft, lineHeight: 1.7, fontFamily: FONT }}>En signant, je confirme l'exactitude des informations fournies ci-dessus.</div>
        <div style={{ border: `1.5px solid ${errors.signature ? "#d98f80" : C.border}`, borderRadius: "8px", padding: "16px", background: C.white, marginBottom: "28px" }}>
          <SignaturePad onSign={setSignature} signed={!!signature} label="Sign here / Signez ici" />
          {errors.signature && <div style={{ color: "#a23b2e", fontSize: "11px", marginTop: "8px", fontFamily: FONT }}>⚠ Signature requise</div>}
        </div>

        <SectionTitle>Contrat de location | Rental agreement</SectionTitle>

        <div style={{ margin: "0 0 16px", padding: "20px", background: C.white, border: `1px solid ${C.border}`, borderRadius: "8px", fontSize: "12.5px", color: C.navySoft, lineHeight: 2, fontFamily: FONT }}>
          <div style={{ fontSize: "13px", color: C.navy, marginBottom: "12px", fontWeight: 700 }}>Règlement intérieur et conditions générales</div>
          <div>• Arrivée à partir de <strong style={{ color: C.navy }}>15h00</strong> — Départ avant <strong style={{ color: C.navy }}>11h00</strong></div>
          <div>• L'occupation maximale doit être respectée</div>
          <div>• Aucune fête ni événement sans accord écrit préalable</div>
          <div>• Interdiction de fumer à l'intérieur</div>
          <div>• Silence entre 22h00 et 8h00</div>
          <div>• Le logement doit être rendu propre</div>
          <div>• Caution restituée sous 48h après le départ en l'absence de dommage</div>
          <div>• Le voyageur est responsable de tout dommage causé pendant le séjour</div>
          <div style={{ marginTop: "12px", fontSize: "11px", color: C.navyFaint }}>Contrat régi par le droit marocain — Loi n°94-14.</div>
        </div>

        <div style={{ margin: "0 0 24px", padding: "16px 20px", background: C.white, border: `1.5px solid ${errors.consent_rental ? "#d98f80" : C.border}`, borderRadius: "8px" }}>
          <label style={{ display: "flex", gap: "14px", alignItems: "flex-start", cursor: "pointer" }}>
            <input type="checkbox" checked={form.consent_rental} onChange={e => set("consent_rental", e.target.checked)} style={{ marginTop: "3px", accentColor: C.navy, width: "16px", height: "16px", flexShrink: 0 }} />
            <span style={{ fontSize: "12.5px", color: C.navySoft, lineHeight: 1.7, fontFamily: FONT }}>
              J'ai lu et j'accepte les conditions générales du contrat de location ci-dessus.
              <br /><span style={{ color: C.navyFaint, fontSize: "11px" }}>I have read and agree to the rental agreement terms and house rules above.</span>
            </span>
          </label>
        </div>

        <div style={{ marginBottom: "8px", fontSize: "12.5px", color: C.navySoft, lineHeight: 1.7, fontFamily: FONT }}>En signant, j'accepte l'intégralité des termes du contrat de location ci-dessus.</div>
        <div style={{ border: `1.5px solid ${errors.signatureRental ? "#d98f80" : C.border}`, borderRadius: "8px", padding: "16px", background: C.white }}>
          <SignaturePad onSign={setSignatureRental} signed={!!signatureRental} label="Sign here / Signez ici" />
          {errors.signatureRental && <div style={{ color: "#a23b2e", fontSize: "11px", marginTop: "8px", fontFamily: FONT }}>⚠ Signature requise</div>}
        </div>

        <div style={{ marginTop: "16px", fontSize: "12px", color: C.navyFaint, display: "flex", justifyContent: "flex-end", fontFamily: FONT }}>
          {new Date().toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" })}
        </div>

        {Object.keys(errors).length > 0 && (
          <div style={{ marginTop: "20px", padding: "12px 16px", background: C.warnBg, border: `1px solid ${C.warnBorder}`, borderRadius: "6px", fontSize: "12.5px", color: C.navy, fontFamily: FONT }}>
            ⚠ Merci de compléter tous les champs requis et de signer les deux sections.
          </div>
        )}

        {isInAppBrowser && (
          <div style={{ marginTop: "16px", padding: "12px 16px", background: C.warnBg, border: `1px solid ${C.warnBorder}`, borderRadius: "6px", fontSize: "12.5px", color: C.navy, fontFamily: FONT }}>
            ⚠ Vous semblez ouvrir ce lien dans une application (WhatsApp / Instagram / Booking.com). Cela peut empêcher l'envoi du formulaire.
            <br />Merci d'ouvrir cette page dans votre navigateur habituel (Safari ou Chrome) via le menu "..." ou "Ouvrir dans le navigateur", puis remplissez à nouveau le formulaire.
          </div>
        )}

        {sendError && (
          <div style={{ marginTop: "16px", padding: "12px 16px", background: C.errorBg, border: `1px solid ${C.errorBorder}`, borderRadius: "6px", fontSize: "12.5px", color: C.errorText, fontFamily: FONT }}>
            ⚠ Erreur lors de l'envoi. Merci de réessayer ou de contacter Medina Moon Stays directement.
            <div style={{ marginTop: "6px", fontSize: "10px", opacity: 0.8, wordBreak: "break-word" }}>Debug: {sendError}</div>
          </div>
        )}

        <button onClick={handleSubmit} disabled={sending} style={{
          marginTop: "28px", width: "100%",
          background: sending ? "#9aa1b0" : C.navy,
          border: "none", borderRadius: "6px", color: "#ffffff", padding: "16px",
          fontSize: "14px", letterSpacing: "0.5px", fontFamily: FONT, fontWeight: 700,
          cursor: sending ? "not-allowed" : "pointer",
        }}>
          {sending ? "Envoi en cours..." : "Envoyer — Check-in Form & Rental Agreement"}
        </button>

        <div style={{ marginTop: "20px", textAlign: "center", fontSize: "10px", color: C.navyFainter, letterSpacing: "0.5px", lineHeight: 2, fontFamily: FONT }}>
          Medina Moon Stays — Loi 80-14 · Décret 2.23.441 · CNDP Loi 09-08
        </div>
      </div>
    </div>
  );
}
