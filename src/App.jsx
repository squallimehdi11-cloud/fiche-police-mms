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

function SignaturePad({ onSign, signed, label = "Signez ici / Sign here" }) {
  const canvasRef = useRef(null);
  const drawing = useRef(false);
  const lastPos = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = "#0f0e0c";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = "#c9a84c";
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
    ctx.fillStyle = "#0f0e0c"; ctx.fillRect(0, 0, canvas.width, canvas.height);
    onSign(null);
  };

  return (
    <div style={{ position: "relative" }}>
      <canvas ref={canvasRef} width={600} height={150}
        onMouseDown={startDraw} onMouseMove={draw} onMouseUp={stopDraw} onMouseLeave={stopDraw}
        onTouchStart={startDraw} onTouchMove={draw} onTouchEnd={stopDraw}
        style={{ width: "100%", height: "120px", border: "1px solid #c9a84c44", borderRadius: "4px", cursor: "crosshair", display: "block", touchAction: "none" }}
      />
      {!signed && (
        <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)", color: "#c9a84c44", fontSize: "13px", pointerEvents: "none", fontFamily: "'Cormorant Garamond', serif", letterSpacing: "2px" }}>
          {label}
        </div>
      )}
      <button onClick={clear} style={{ marginTop: "8px", background: "transparent", border: "1px solid #c9a84c33", color: "#c9a84c88", padding: "4px 12px", borderRadius: "3px", fontSize: "11px", cursor: "pointer", letterSpacing: "1px" }}>
        Effacer / Clear
      </button>
    </div>
  );
}

function Field({ label, labelEn, children, required }) {
  return (
    <div style={{ marginBottom: "20px" }}>
      <label style={{ display: "block", marginBottom: "6px", fontSize: "11px", letterSpacing: "2px", textTransform: "uppercase", color: "#c9a84c", fontFamily: "'Cormorant Garamond', serif" }}>
        {label}{labelEn && <span style={{ color: "#c9a84c66", marginLeft: "8px", fontSize: "10px" }}>/ {labelEn}</span>}{required && <span style={{ color: "#c9a84c", marginLeft: "4px" }}>*</span>}
      </label>
      {children}
    </div>
  );
}

const inputStyle = { width: "100%", background: "#0f0e0c", border: "1px solid #c9a84c33", borderRadius: "4px", color: "#f0e6c8", padding: "10px 14px", fontSize: "14px", fontFamily: "'Cormorant Garamond', serif", outline: "none", boxSizing: "border-box" };
const selectStyle = { ...inputStyle, appearance: "none", backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath d='M1 1l5 5 5-5' stroke='%23c9a84c' stroke-width='1.5' fill='none'/%3E%3C/svg%3E")`, backgroundRepeat: "no-repeat", backgroundPosition: "right 14px center", paddingRight: "36px", cursor: "pointer" };

function SectionTitle({ children }) {
  return (
    <div style={{ margin: "28px 0 16px", display: "flex", alignItems: "center", gap: "14px" }}>
      <div style={{ flex: 1, height: "1px", background: "#c9a84c22" }} />
      <span style={{ fontSize: "10px", letterSpacing: "3px", color: "#c9a84c", textTransform: "uppercase", whiteSpace: "nowrap" }}>{children}</span>
      <div style={{ flex: 1, height: "1px", background: "#c9a84c22" }} />
    </div>
  );
}

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

  const err = (k) => errors[k] ? { borderColor: "#c9a84c88" } : {};

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
      <div style={{ minHeight: "100vh", background: "#080807", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Cormorant Garamond', serif", padding: "20px" }}>
        <div style={{ textAlign: "center", maxWidth: "480px" }}>
          <div style={{ fontSize: "48px", marginBottom: "24px", color: "#c9a84c" }}>✓</div>
          <h2 style={{ color: "#c9a84c", fontSize: "22px", letterSpacing: "4px", textTransform: "uppercase", marginBottom: "12px", fontWeight: 400 }}>Documents Enregistrés</h2>
          <p style={{ color: "#f0e6c888", fontSize: "15px", lineHeight: 1.8 }}>Merci, <strong style={{ color: "#f0e6c8" }}>{form.prenom} {form.nom}</strong>.</p>
          <p style={{ color: "#f0e6c866", fontSize: "13px", lineHeight: 1.8 }}>
            Votre dossier a été enregistré et transmis à Medina Moon Stays.<br/>
            <span style={{ fontSize: "11px" }}>Your check-in form and rental agreement have been recorded.</span>
          </p>
          <div style={{ marginTop: "24px", padding: "16px", border: "1px solid #c9a84c22", borderRadius: "6px", background: "#c9a84c08" }}>
            <p style={{ color: "#c9a84c", fontSize: "13px", letterSpacing: "1px", margin: 0 }}>{form.property}</p>
            <p style={{ color: "#f0e6c866", fontSize: "12px", margin: "4px 0 0" }}>{form.date_arrivee} → {form.date_depart}</p>
          </div>
          <div style={{ marginTop: "32px", display: "flex", justifyContent: "center", gap: "32px" }}>
            <div>
              <img src={signature} alt="signature 1" style={{ maxWidth: "160px", opacity: 0.8 }} />
              <p style={{ color: "#c9a84c44", fontSize: "10px", letterSpacing: "2px", marginTop: "6px" }}>GUEST REGISTRATION</p>
            </div>
            <div>
              <img src={signatureRental} alt="signature 2" style={{ maxWidth: "160px", opacity: 0.8 }} />
              <p style={{ color: "#c9a84c44", fontSize: "10px", letterSpacing: "2px", marginTop: "6px" }}>RENTAL AGREEMENT</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: "#080807", fontFamily: "'Cormorant Garamond', serif", color: "#f0e6c8" }}>
      <div style={{ borderBottom: "1px solid #c9a84c22", padding: "28px 32px", display: "flex", alignItems: "center", justifyContent: "space-between", background: "#0a0907" }}>
        <div>
          <div style={{ fontSize: "11px", letterSpacing: "4px", color: "#c9a84c", textTransform: "uppercase", marginBottom: "4px" }}>◈ Medina Moon Stays</div>
          <div style={{ fontSize: "18px", letterSpacing: "1px", color: "#f0e6c8" }}>Check-in Form & Rental Agreement</div>
          <div style={{ fontSize: "12px", color: "#f0e6c844" }}>Guest Registration & Rental Agreement</div>
        </div>
        <div style={{ fontSize: "10px", color: "#c9a84c55", letterSpacing: "1px", textAlign: "right", lineHeight: 2 }}>
          <div>Loi n°80-14</div><div>Décret n°2.23.441</div><div>Loi n°09-08 CNDP</div>
        </div>
      </div>

      <div style={{ margin: "20px 32px", padding: "14px 18px", background: "#c9a84c08", border: "1px solid #c9a84c22", borderLeft: "3px solid #c9a84c", borderRadius: "4px", fontSize: "11px", color: "#c9a84c99", lineHeight: 1.8 }}>
        Please complete all fields and sign both sections below. — Merci de compléter tous les champs et de signer les deux sections ci-dessous.
      </div>

      <div style={{ padding: "0 32px 40px" }}>
        <div style={{ marginBottom: "28px", padding: "20px", border: `1px solid ${errors.property ? "#c9a84c88" : "#c9a84c33"}`, borderRadius: "6px", background: "#c9a84c06", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "16px", flexWrap: "wrap" }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: "10px", letterSpacing: "3px", color: "#c9a84c", textTransform: "uppercase", marginBottom: "6px" }}>Propriété / Property *</div>
            {propertyFromUrl ? (
              <div style={{ fontSize: "18px", color: "#f0e6c8" }}>{form.property}</div>
            ) : (
              <input value={form.property} onChange={e => set("property", e.target.value)} placeholder="Property name" style={{ ...inputStyle, ...err("property") }} />
            )}
          </div>
          <div style={{ fontSize: "10px", color: "#c9a84c55", letterSpacing: "1px", textAlign: "right", lineHeight: 2 }}>
            <div>Medina Moon Stays</div>
          </div>
        </div>

        <div style={{ margin: "32px 0 8px", padding: "10px 18px", background: "#c9a84c11", border: "1px solid #c9a84c33", borderRadius: "4px" }}>
          <span style={{ fontSize: "12px", letterSpacing: "3px", color: "#c9a84c", textTransform: "uppercase" }}>Part 1 — Guest Information / Informations du Séjour</span>
        </div>

        <SectionTitle>Guest Identity / Identité du voyageur</SectionTitle>
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

        <SectionTitle>Identity Document / Document d'identité</SectionTitle>
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

        <SectionTitle>Stay Details / Informations du séjour</SectionTitle>
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

        <SectionTitle>Contact</SectionTitle>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 20px" }}>
          <Field label="Email"><input type="email" value={form.email} onChange={e => set("email", e.target.value)} style={inputStyle} placeholder="jean.dupont@email.com" /></Field>
          <Field label="Téléphone" labelEn="Phone"><input value={form.telephone} onChange={e => set("telephone", e.target.value)} style={inputStyle} placeholder="+33 6 12 34 56 78" /></Field>
        </div>

        {form.nationalite === "Marocaine" && parseInt(form.nb_personnes) >= 2 && (
          <div style={{ margin: "24px 0", padding: "20px", background: "#c9a84c08", border: `1px solid ${errors.statut_marital || errors.statut_marital_blocked ? "#c9a84c88" : "#c9a84c33"}`, borderRadius: "6px" }}>
            <div style={{ fontSize: "11px", letterSpacing: "3px", color: "#c9a84c", textTransform: "uppercase", marginBottom: "16px" }}>◈ Statut marital / Marital Status</div>
            <div style={{ fontSize: "12px", color: "#f0e6c877", marginBottom: "16px", lineHeight: 1.7 }}>
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
              <div style={{ padding: "14px 18px", background: "#ff000011", border: "1px solid #ff000044", borderRadius: "4px", fontSize: "12px", color: "#ff6666", lineHeight: 1.7 }}>
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

        <div style={{ margin: "24px 0", padding: "16px 20px", background: "#c9a84c06", border: `1px solid ${errors.consent_cndp ? "#c9a84c88" : "#c9a84c22"}`, borderRadius: "4px" }}>
          <label style={{ display: "flex", gap: "14px", alignItems: "flex-start", cursor: "pointer" }}>
            <input type="checkbox" checked={form.consent_cndp} onChange={e => set("consent_cndp", e.target.checked)} style={{ marginTop: "3px", accentColor: "#c9a84c", width: "16px", height: "16px", flexShrink: 0 }} />
            <span style={{ fontSize: "12px", color: "#f0e6c8bb", lineHeight: 1.7 }}>
              I consent to the processing of my personal data for registration purposes, in compliance with Moroccan law n°09-08 / CNDP. Data retained 2 years.
              <br /><span style={{ color: "#f0e6c866", fontSize: "11px" }}>Je consens au traitement de mes données personnelles conformément à la loi n°09-08 CNDP. Données conservées 2 ans.</span>
            </span>
          </label>
        </div>

        <SectionTitle>Signature — Guest Registration</SectionTitle>
        <div style={{ marginBottom: "8px", fontSize: "12px", color: "#f0e6c866", lineHeight: 1.7 }}>By signing, I confirm the accuracy of the information provided above.</div>
        <div style={{ border: `1px solid ${errors.signature ? "#c9a84c88" : "#c9a84c22"}`, borderRadius: "6px", padding: "16px", background: "#0f0e0c" }}>
          <SignaturePad onSign={setSignature} signed={!!signature} label="Sign here / Signez ici" />
          {errors.signature && <div style={{ color: "#c9a84c", fontSize: "11px", marginTop: "8px" }}>⚠ Signature required</div>}
        </div>

        <div style={{ margin: "40px 0 8px", padding: "10px 18px", background: "#c9a84c11", border: "1px solid #c9a84c33", borderRadius: "4px" }}>
          <span style={{ fontSize: "12px", letterSpacing: "3px", color: "#c9a84c", textTransform: "uppercase" }}>Part 2 — Rental Agreement / Contrat de Location</span>
        </div>

        <div style={{ margin: "16px 0", padding: "20px", background: "#0f0e0c", border: "1px solid #c9a84c22", borderRadius: "6px", fontSize: "12px", color: "#f0e6c8aa", lineHeight: 2 }}>
          <div style={{ fontSize: "13px", color: "#c9a84c", letterSpacing: "1px", marginBottom: "12px", fontWeight: "bold" }}>House Rules & General Terms</div>
          <div>• Check-in from <strong style={{ color: "#f0e6c8" }}>3:00 PM</strong> — Check-out before <strong style={{ color: "#f0e6c8" }}>11:00 AM</strong></div>
          <div>• Maximum occupancy must be respected</div>
          <div>• No parties or events without prior written approval</div>
          <div>• No smoking inside the property</div>
          <div>• Quiet hours 10:00 PM – 8:00 AM</div>
          <div>• Property must be returned in clean condition</div>
          <div>• Security deposit returned within 48h after departure if no damage</div>
          <div>• Guest is liable for any damages caused during the stay</div>
          <div style={{ marginTop: "12px", fontSize: "11px", color: "#f0e6c855" }}>Agreement governed by Moroccan law — Law no. 94-14.</div>
        </div>

        <div style={{ margin: "16px 0", padding: "16px 20px", background: "#c9a84c06", border: `1px solid ${errors.consent_rental ? "#c9a84c88" : "#c9a84c22"}`, borderRadius: "4px" }}>
          <label style={{ display: "flex", gap: "14px", alignItems: "flex-start", cursor: "pointer" }}>
            <input type="checkbox" checked={form.consent_rental} onChange={e => set("consent_rental", e.target.checked)} style={{ marginTop: "3px", accentColor: "#c9a84c", width: "16px", height: "16px", flexShrink: 0 }} />
            <span style={{ fontSize: "12px", color: "#f0e6c8bb", lineHeight: 1.7 }}>
              I have read and agree to the rental agreement terms and house rules above.
              <br /><span style={{ color: "#f0e6c866", fontSize: "11px" }}>J'ai lu et j'accepte les conditions générales du contrat de location ci-dessus.</span>
            </span>
          </label>
        </div>

        <SectionTitle>Signature — Rental Agreement</SectionTitle>
        <div style={{ marginBottom: "8px", fontSize: "12px", color: "#f0e6c866", lineHeight: 1.7 }}>By signing, I agree to all terms of the rental agreement above.</div>
        <div style={{ border: `1px solid ${errors.signatureRental ? "#c9a84c88" : "#c9a84c22"}`, borderRadius: "6px", padding: "16px", background: "#0f0e0c" }}>
          <SignaturePad onSign={setSignatureRental} signed={!!signatureRental} label="Sign here / Signez ici" />
          {errors.signatureRental && <div style={{ color: "#c9a84c", fontSize: "11px", marginTop: "8px" }}>⚠ Signature required</div>}
        </div>

        <div style={{ marginTop: "16px", fontSize: "12px", color: "#f0e6c855", display: "flex", justifyContent: "flex-end", letterSpacing: "1px" }}>
          {new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "long", year: "numeric" })}
        </div>

        {Object.keys(errors).length > 0 && (
          <div style={{ marginTop: "20px", padding: "12px 16px", background: "#c9a84c08", border: "1px solid #c9a84c44", borderRadius: "4px", fontSize: "12px", color: "#c9a84c" }}>
            ⚠ Please complete all required fields and sign both sections.
          </div>
        )}

        {isInAppBrowser && (
          <div style={{ marginTop: "16px", padding: "12px 16px", background: "#c9a84c11", border: "1px solid #c9a84c44", borderRadius: "4px", fontSize: "12px", color: "#c9a84c" }}>
            ⚠ You seem to be opening this link inside an app (WhatsApp / Instagram / Booking.com). This can cause the form to fail when sending.
            <br />Please open this page in your regular browser (Safari or Chrome) using the "..." or "Open in browser" menu, then fill out the form again.
          </div>
        )}

        {sendError && (
          <div style={{ marginTop: "16px", padding: "12px 16px", background: "#ff000011", border: "1px solid #ff000044", borderRadius: "4px", fontSize: "12px", color: "#ff6666" }}>
            ⚠ Sending error. Please try again or contact Medina Moon Stays directly.
            <div style={{ marginTop: "6px", fontSize: "10px", opacity: 0.8, wordBreak: "break-word" }}>Debug: {sendError}</div>
          </div>
        )}

        <button onClick={handleSubmit} disabled={sending} style={{ marginTop: "28px", width: "100%", background: sending ? "#888" : "linear-gradient(135deg, #c9a84c, #a8872e)", border: "none", borderRadius: "4px", color: "#080807", padding: "16px", fontSize: "13px", letterSpacing: "3px", textTransform: "uppercase", fontFamily: "'Cormorant Garamond', serif", fontWeight: 700, cursor: sending ? "not-allowed" : "pointer" }}>
          {sending ? "Sending..." : "Submit — Check-in Form & Rental Agreement"}
        </button>

        <div style={{ marginTop: "20px", textAlign: "center", fontSize: "10px", color: "#f0e6c833", letterSpacing: "1px", lineHeight: 2 }}>
          Medina Moon Stays — Loi 80-14 · Décret 2.23.441 · CNDP Loi 09-08
        </div>
      </div>
    </div>
  );
}    if (e.touches) {
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
    ctx.fillStyle = "#0f0e0c"; ctx.fillRect(0, 0, canvas.width, canvas.height);
    onSign(null);
  };

  return (
    <div style={{ position: "relative" }}>
      <canvas ref={canvasRef} width={600} height={150}
        onMouseDown={startDraw} onMouseMove={draw} onMouseUp={stopDraw} onMouseLeave={stopDraw}
        onTouchStart={startDraw} onTouchMove={draw} onTouchEnd={stopDraw}
        style={{ width: "100%", height: "120px", border: "1px solid #c9a84c44", borderRadius: "4px", cursor: "crosshair", display: "block", touchAction: "none" }}
      />
      {!signed && (
        <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)", color: "#c9a84c44", fontSize: "13px", pointerEvents: "none", fontFamily: "'Cormorant Garamond', serif", letterSpacing: "2px" }}>
          {label}
        </div>
      )}
      <button onClick={clear} style={{ marginTop: "8px", background: "transparent", border: "1px solid #c9a84c33", color: "#c9a84c88", padding: "4px 12px", borderRadius: "3px", fontSize: "11px", cursor: "pointer", letterSpacing: "1px" }}>
        Effacer / Clear
      </button>
    </div>
  );
}

function Field({ label, labelEn, children, required }) {
  return (
    <div style={{ marginBottom: "20px" }}>
      <label style={{ display: "block", marginBottom: "6px", fontSize: "11px", letterSpacing: "2px", textTransform: "uppercase", color: "#c9a84c", fontFamily: "'Cormorant Garamond', serif" }}>
        {label}{labelEn && <span style={{ color: "#c9a84c66", marginLeft: "8px", fontSize: "10px" }}>/ {labelEn}</span>}{required && <span style={{ color: "#c9a84c", marginLeft: "4px" }}>*</span>}
      </label>
      {children}
    </div>
  );
}

const inputStyle = { width: "100%", background: "#0f0e0c", border: "1px solid #c9a84c33", borderRadius: "4px", color: "#f0e6c8", padding: "10px 14px", fontSize: "14px", fontFamily: "'Cormorant Garamond', serif", outline: "none", boxSizing: "border-box" };
const selectStyle = { ...inputStyle, appearance: "none", backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath d='M1 1l5 5 5-5' stroke='%23c9a84c' stroke-width='1.5' fill='none'/%3E%3C/svg%3E")`, backgroundRepeat: "no-repeat", backgroundPosition: "right 14px center", paddingRight: "36px", cursor: "pointer" };

function SectionTitle({ children }) {
  return (
    <div style={{ margin: "28px 0 16px", display: "flex", alignItems: "center", gap: "14px" }}>
      <div style={{ flex: 1, height: "1px", background: "#c9a84c22" }} />
      <span style={{ fontSize: "10px", letterSpacing: "3px", color: "#c9a84c", textTransform: "uppercase", whiteSpace: "nowrap" }}>{children}</span>
      <div style={{ flex: 1, height: "1px", background: "#c9a84c22" }} />
    </div>
  );
}

export default function FichePolice() {
  const today = new Date().toISOString().split("T")[0];
  const [signature, setSignature] = useState(null);
  const [signatureRental, setSignatureRental] = useState(null);
  const [submitted, setSubmitted] = useState(false);
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState(false);
  const urlParams = new URLSearchParams(window.location.search);
  const propertyFromUrl = urlParams.get("property") || "";

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

  const err = (k) => errors[k] ? { borderColor: "#c9a84c88" } : {};

  const handleSubmit = async () => {
    if (!validate()) return;
    setSending(true);
    setSendError(false);
    try {
      await emailjs.send(
        EMAILJS_SERVICE_ID,
        EMAILJS_TEMPLATE_ID,
        {
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
      setSendError(true);
    } finally {
      setSending(false);
    }
  };

  if (submitted) {
    return (
      <div style={{ minHeight: "100vh", background: "#080807", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Cormorant Garamond', serif", padding: "20px" }}>
        <div style={{ textAlign: "center", maxWidth: "480px" }}>
          <div style={{ fontSize: "48px", marginBottom: "24px", color: "#c9a84c" }}>✓</div>
          <h2 style={{ color: "#c9a84c", fontSize: "22px", letterSpacing: "4px", textTransform: "uppercase", marginBottom: "12px", fontWeight: 400 }}>Documents Enregistrés</h2>
          <p style={{ color: "#f0e6c888", fontSize: "15px", lineHeight: 1.8 }}>Merci, <strong style={{ color: "#f0e6c8" }}>{form.prenom} {form.nom}</strong>.</p>
          <p style={{ color: "#f0e6c866", fontSize: "13px", lineHeight: 1.8 }}>
            Votre dossier a été enregistré et transmis à Medina Moon Stays.<br/>
            <span style={{ fontSize: "11px" }}>Your check-in form and rental agreement have been recorded.</span>
          </p>
          <div style={{ marginTop: "24px", padding: "16px", border: "1px solid #c9a84c22", borderRadius: "6px", background: "#c9a84c08" }}>
            <p style={{ color: "#c9a84c", fontSize: "13px", letterSpacing: "1px", margin: 0 }}>{form.property}</p>
            <p style={{ color: "#f0e6c866", fontSize: "12px", margin: "4px 0 0" }}>{form.date_arrivee} → {form.date_depart}</p>
          </div>
          <div style={{ marginTop: "32px", display: "flex", justifyContent: "center", gap: "32px" }}>
            <div>
              <img src={signature} alt="signature 1" style={{ maxWidth: "160px", opacity: 0.8 }} />
              <p style={{ color: "#c9a84c44", fontSize: "10px", letterSpacing: "2px", marginTop: "6px" }}>GUEST REGISTRATION</p>
            </div>
            <div>
              <img src={signatureRental} alt="signature 2" style={{ maxWidth: "160px", opacity: 0.8 }} />
              <p style={{ color: "#c9a84c44", fontSize: "10px", letterSpacing: "2px", marginTop: "6px" }}>RENTAL AGREEMENT</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: "#080807", fontFamily: "'Cormorant Garamond', serif", color: "#f0e6c8" }}>
      <div style={{ borderBottom: "1px solid #c9a84c22", padding: "28px 32px", display: "flex", alignItems: "center", justifyContent: "space-between", background: "#0a0907" }}>
        <div>
          <div style={{ fontSize: "11px", letterSpacing: "4px", color: "#c9a84c", textTransform: "uppercase", marginBottom: "4px" }}>◈ Medina Moon Stays</div>
          <div style={{ fontSize: "18px", letterSpacing: "1px", color: "#f0e6c8" }}>Check-in Form & Rental Agreement</div>
          <div style={{ fontSize: "12px", color: "#f0e6c844" }}>Guest Registration & Rental Agreement</div>
        </div>
        <div style={{ fontSize: "10px", color: "#c9a84c55", letterSpacing: "1px", textAlign: "right", lineHeight: 2 }}>
          <div>Loi n°80-14</div><div>Décret n°2.23.441</div><div>Loi n°09-08 CNDP</div>
        </div>
      </div>

      <div style={{ margin: "20px 32px", padding: "14px 18px", background: "#c9a84c08", border: "1px solid #c9a84c22", borderLeft: "3px solid #c9a84c", borderRadius: "4px", fontSize: "11px", color: "#c9a84c99", lineHeight: 1.8 }}>
        Please complete all fields and sign both sections below. — Merci de compléter tous les champs et de signer les deux sections ci-dessous.
      </div>

      <div style={{ padding: "0 32px 40px" }}>
        <div style={{ marginBottom: "28px", padding: "20px", border: `1px solid ${errors.property ? "#c9a84c88" : "#c9a84c33"}`, borderRadius: "6px", background: "#c9a84c06", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "16px", flexWrap: "wrap" }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: "10px", letterSpacing: "3px", color: "#c9a84c", textTransform: "uppercase", marginBottom: "6px" }}>Propriété / Property *</div>
            {propertyFromUrl ? (
              <div style={{ fontSize: "18px", color: "#f0e6c8" }}>{form.property}</div>
            ) : (
              <input value={form.property} onChange={e => set("property", e.target.value)} placeholder="Property name" style={{ ...inputStyle, ...err("property") }} />
            )}
          </div>
          <div style={{ fontSize: "10px", color: "#c9a84c55", letterSpacing: "1px", textAlign: "right", lineHeight: 2 }}>
            <div>Medina Moon Stays</div>
          </div>
        </div>

        <div style={{ margin: "32px 0 8px", padding: "10px 18px", background: "#c9a84c11", border: "1px solid #c9a84c33", borderRadius: "4px" }}>
          <span style={{ fontSize: "12px", letterSpacing: "3px", color: "#c9a84c", textTransform: "uppercase" }}>Part 1 — Guest Information / Informations du Séjour</span>
        </div>

        <SectionTitle>Guest Identity / Identité du voyageur</SectionTitle>
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

        <SectionTitle>Identity Document / Document d'identité</SectionTitle>
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

        <SectionTitle>Stay Details / Informations du séjour</SectionTitle>
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

        <SectionTitle>Contact</SectionTitle>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 20px" }}>
          <Field label="Email"><input type="email" value={form.email} onChange={e => set("email", e.target.value)} style={inputStyle} placeholder="jean.dupont@email.com" /></Field>
          <Field label="Téléphone" labelEn="Phone"><input value={form.telephone} onChange={e => set("telephone", e.target.value)} style={inputStyle} placeholder="+33 6 12 34 56 78" /></Field>
        </div>

        {form.nationalite === "Marocaine" && parseInt(form.nb_personnes) >= 2 && (
          <div style={{ margin: "24px 0", padding: "20px", background: "#c9a84c08", border: `1px solid ${errors.statut_marital || errors.statut_marital_blocked ? "#c9a84c88" : "#c9a84c33"}`, borderRadius: "6px" }}>
            <div style={{ fontSize: "11px", letterSpacing: "3px", color: "#c9a84c", textTransform: "uppercase", marginBottom: "16px" }}>◈ Statut marital / Marital Status</div>
            <div style={{ fontSize: "12px", color: "#f0e6c877", marginBottom: "16px", lineHeight: 1.7 }}>
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
              <div style={{ padding: "14px 18px", background: "#ff000011", border: "1px solid #ff000044", borderRadius: "4px", fontSize: "12px", color: "#ff6666", lineHeight: 1.7 }}>
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

        <div style={{ margin: "24px 0", padding: "16px 20px", background: "#c9a84c06", border: `1px solid ${errors.consent_cndp ? "#c9a84c88" : "#c9a84c22"}`, borderRadius: "4px" }}>
          <label style={{ display: "flex", gap: "14px", alignItems: "flex-start", cursor: "pointer" }}>
            <input type="checkbox" checked={form.consent_cndp} onChange={e => set("consent_cndp", e.target.checked)} style={{ marginTop: "3px", accentColor: "#c9a84c", width: "16px", height: "16px", flexShrink: 0 }} />
            <span style={{ fontSize: "12px", color: "#f0e6c8bb", lineHeight: 1.7 }}>
              I consent to the processing of my personal data for registration purposes, in compliance with Moroccan law n°09-08 / CNDP. Data retained 2 years.
              <br /><span style={{ color: "#f0e6c866", fontSize: "11px" }}>Je consens au traitement de mes données personnelles conformément à la loi n°09-08 CNDP. Données conservées 2 ans.</span>
            </span>
          </label>
        </div>

        <SectionTitle>Signature — Guest Registration</SectionTitle>
        <div style={{ marginBottom: "8px", fontSize: "12px", color: "#f0e6c866", lineHeight: 1.7 }}>By signing, I confirm the accuracy of the information provided above.</div>
        <div style={{ border: `1px solid ${errors.signature ? "#c9a84c88" : "#c9a84c22"}`, borderRadius: "6px", padding: "16px", background: "#0f0e0c" }}>
          <SignaturePad onSign={setSignature} signed={!!signature} label="Sign here / Signez ici" />
          {errors.signature && <div style={{ color: "#c9a84c", fontSize: "11px", marginTop: "8px" }}>⚠ Signature required</div>}
        </div>

        <div style={{ margin: "40px 0 8px", padding: "10px 18px", background: "#c9a84c11", border: "1px solid #c9a84c33", borderRadius: "4px" }}>
          <span style={{ fontSize: "12px", letterSpacing: "3px", color: "#c9a84c", textTransform: "uppercase" }}>Part 2 — Rental Agreement / Contrat de Location</span>
        </div>

        <div style={{ margin: "16px 0", padding: "20px", background: "#0f0e0c", border: "1px solid #c9a84c22", borderRadius: "6px", fontSize: "12px", color: "#f0e6c8aa", lineHeight: 2 }}>
          <div style={{ fontSize: "13px", color: "#c9a84c", letterSpacing: "1px", marginBottom: "12px", fontWeight: "bold" }}>House Rules & General Terms</div>
          <div>• Check-in from <strong style={{ color: "#f0e6c8" }}>3:00 PM</strong> — Check-out before <strong style={{ color: "#f0e6c8" }}>11:00 AM</strong></div>
          <div>• Maximum occupancy must be respected</div>
          <div>• No parties or events without prior written approval</div>
          <div>• No smoking inside the property</div>
          <div>• Quiet hours 10:00 PM – 8:00 AM</div>
          <div>• Property must be returned in clean condition</div>
          <div>• Security deposit returned within 48h after departure if no damage</div>
          <div>• Guest is liable for any damages caused during the stay</div>
          <div style={{ marginTop: "12px", fontSize: "11px", color: "#f0e6c855" }}>Agreement governed by Moroccan law — Law no. 94-14.</div>
        </div>

        <div style={{ margin: "16px 0", padding: "16px 20px", background: "#c9a84c06", border: `1px solid ${errors.consent_rental ? "#c9a84c88" : "#c9a84c22"}`, borderRadius: "4px" }}>
          <label style={{ display: "flex", gap: "14px", alignItems: "flex-start", cursor: "pointer" }}>
            <input type="checkbox" checked={form.consent_rental} onChange={e => set("consent_rental", e.target.checked)} style={{ marginTop: "3px", accentColor: "#c9a84c", width: "16px", height: "16px", flexShrink: 0 }} />
            <span style={{ fontSize: "12px", color: "#f0e6c8bb", lineHeight: 1.7 }}>
              I have read and agree to the rental agreement terms and house rules above.
              <br /><span style={{ color: "#f0e6c866", fontSize: "11px" }}>J'ai lu et j'accepte les conditions générales du contrat de location ci-dessus.</span>
            </span>
          </label>
        </div>

        <SectionTitle>Signature — Rental Agreement</SectionTitle>
        <div style={{ marginBottom: "8px", fontSize: "12px", color: "#f0e6c866", lineHeight: 1.7 }}>By signing, I agree to all terms of the rental agreement above.</div>
        <div style={{ border: `1px solid ${errors.signatureRental ? "#c9a84c88" : "#c9a84c22"}`, borderRadius: "6px", padding: "16px", background: "#0f0e0c" }}>
          <SignaturePad onSign={setSignatureRental} signed={!!signatureRental} label="Sign here / Signez ici" />
          {errors.signatureRental && <div style={{ color: "#c9a84c", fontSize: "11px", marginTop: "8px" }}>⚠ Signature required</div>}
        </div>

        <div style={{ marginTop: "16px", fontSize: "12px", color: "#f0e6c855", display: "flex", justifyContent: "flex-end", letterSpacing: "1px" }}>
          {new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "long", year: "numeric" })}
        </div>

        {Object.keys(errors).length > 0 && (
          <div style={{ marginTop: "20px", padding: "12px 16px", background: "#c9a84c08", border: "1px solid #c9a84c44", borderRadius: "4px", fontSize: "12px", color: "#c9a84c" }}>
            ⚠ Please complete all required fields and sign both sections.
          </div>
        )}

        {sendError && (
          <div style={{ marginTop: "16px", padding: "12px 16px", background: "#ff000011", border: "1px solid #ff000044", borderRadius: "4px", fontSize: "12px", color: "#ff6666" }}>
            ⚠ Sending error. Please try again or contact Medina Moon Stays directly.
          </div>
        )}

        <button onClick={handleSubmit} disabled={sending} style={{ marginTop: "28px", width: "100%", background: sending ? "#888" : "linear-gradient(135deg, #c9a84c, #a8872e)", border: "none", borderRadius: "4px", color: "#080807", padding: "16px", fontSize: "13px", letterSpacing: "3px", textTransform: "uppercase", fontFamily: "'Cormorant Garamond', serif", fontWeight: 700, cursor: sending ? "not-allowed" : "pointer" }}>
          {sending ? "Sending..." : "Submit — Check-in Form & Rental Agreement"}
        </button>

        <div style={{ marginTop: "20px", textAlign: "center", fontSize: "10px", color: "#f0e6c833", letterSpacing: "1px", lineHeight: 2 }}>
          Medina Moon Stays — Loi 80-14 · Décret 2.23.441 · CNDP Loi 09-08
        </div>
      </div>
    </div>
  );
}
