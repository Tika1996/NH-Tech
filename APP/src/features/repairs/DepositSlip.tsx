import { useRef } from 'react';
import { useAppStore } from '../../store/appStore';
import { Printer, X, QrCode } from 'lucide-react';
import { BRAND } from '../../lib/brand';
import type { RepairDossier } from '../../lib/firebase';

interface DepositSlipProps {
  repair: RepairDossier;
  onClose: () => void;
}

export function DepositSlip({ repair, onClose }: DepositSlipProps) {
  const { language } = useAppStore();
  const isAr = language === 'ar';
  const isEn = language === 'en';
  const printRef = useRef<HTMLDivElement>(null);

  const brand = BRAND;
  const trackingUrl = `https://nhtech.dz/suivi?code=${repair.trackingCode || repair.id}`;
  // High-precision standard ISO 18004 QR Code API URL
  const realQrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(trackingUrl)}`;

  const handlePrint = () => {
    const printContent = printRef.current;
    if (!printContent) return;

    const printWindow = window.open('', '_blank', 'width=600,height=800');
    if (!printWindow) return;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8" />
        <title>Bon de Dépôt — ${repair.id}</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body {
            font-family: 'Segoe UI', Arial, sans-serif;
            padding: 20px;
            color: #1a1a2e;
            max-width: 500px;
            margin: 0 auto;
          }
          .slip-header {
            text-align: center;
            border-bottom: 2px solid #1a1a2e;
            padding-bottom: 12px;
            margin-bottom: 16px;
          }
          .slip-header h1 { font-size: 1.3rem; font-weight: 900; }
          .slip-header p { font-size: 0.75rem; color: #555; margin-top: 4px; }
          .slip-title {
            text-align: center;
            font-size: 1.1rem;
            font-weight: 800;
            background: #1a1a2e;
            color: #fff;
            padding: 8px;
            margin-bottom: 16px;
            border-radius: 4px;
          }
          .slip-id {
            text-align: center;
            font-size: 1.4rem;
            font-weight: 900;
            color: #0057FF;
            margin-bottom: 8px;
            letter-spacing: 0.05em;
          }
          .slip-qr {
            text-align: center;
            margin: 14px 0;
          }
          .slip-qr img { width: 160px; height: 160px; border: 1px solid #ccc; padding: 4px; border-radius: 8px; }
          .slip-qr-url {
            font-size: 0.7rem;
            color: #555;
            margin-top: 4px;
            font-weight: 700;
          }
          .slip-section {
            margin-bottom: 14px;
          }
          .slip-section-title {
            font-size: 0.78rem;
            font-weight: 800;
            text-transform: uppercase;
            color: #666;
            border-bottom: 1px dashed #ccc;
            padding-bottom: 4px;
            margin-bottom: 8px;
          }
          .slip-row {
            display: flex;
            justify-content: space-between;
            font-size: 0.82rem;
            padding: 3px 0;
          }
          .slip-row .label { color: #666; font-weight: 600; }
          .slip-row .value { font-weight: 700; color: #1a1a2e; text-align: right; max-width: 60%; }
          .slip-issue {
            font-size: 0.82rem;
            padding: 8px;
            background: #f5f5f5;
            border-radius: 4px;
            border-left: 3px solid #0057FF;
          }
          .slip-accessories {
            display: flex;
            flex-wrap: wrap;
            gap: 6px;
            font-size: 0.78rem;
          }
          .slip-accessories span {
            background: #e8e8e8;
            padding: 2px 8px;
            border-radius: 4px;
          }
          .slip-legal {
            margin-top: 20px;
            padding: 10px;
            border: 1px dashed #999;
            font-size: 0.68rem;
            color: #666;
            text-align: center;
            line-height: 1.5;
          }
          .slip-signatures {
            display: flex;
            justify-content: space-between;
            margin-top: 30px;
            padding-top: 10px;
          }
          .slip-sig-box {
            width: 45%;
            text-align: center;
            font-size: 0.78rem;
            font-weight: 700;
            color: #666;
          }
          .slip-sig-line {
            border-bottom: 1px solid #999;
            height: 50px;
            margin-bottom: 6px;
          }
          @media print {
            body { padding: 10px; }
          }
        </style>
      </head>
      <body>
        ${printContent.innerHTML}
        <script>
          window.onload = function() { window.print(); window.close(); };
        </script>
      </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <div className="nh-modal-backdrop" onClick={onClose}>
      <div className="nh-modern-modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 560 }}>
        {/* Header */}
        <div className="nh-modal-header">
          <div className="nh-header-icon-box">
            <QrCode size={22} color="#0057FF" />
          </div>
          <div>
            <h3 className="nh-modal-title">{isAr ? 'بون الإيداع' : 'Bon de Dépôt SAV'}</h3>
            <p className="nh-modal-subtitle">{repair.id} • {repair.customerName}</p>
          </div>
          <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
            <button className="nh-btn-primary" onClick={handlePrint}>
              <Printer size={16} />
              <span>{isAr ? 'طباعة' : 'Imprimer'}</span>
            </button>
            <button className="nh-modal-close-btn" onClick={onClose}><X size={18} /></button>
          </div>
        </div>

        {/* Printable content */}
        <div className="nh-modal-body" style={{ background: '#FFFFFF', color: '#1a1a2e' }}>
          <div ref={printRef}>
            {/* Header */}
            <div className="slip-header" style={{ textAlign: 'center', borderBottom: '2px solid #1a1a2e', paddingBottom: 12, marginBottom: 16 }}>
              <h1 style={{ fontSize: '1.3rem', fontWeight: 900, color: '#0057FF' }}>{brand.name.fr}</h1>
              <p style={{ fontSize: '0.75rem', color: '#555', marginTop: 4 }}>
                {brand.subtitle.fr} — Tél: {brand.company?.phone || '—'}
              </p>
            </div>

            {/* Title */}
            <div style={{
              textAlign: 'center', fontSize: '1.05rem', fontWeight: 800,
              background: '#0057FF', color: '#fff', padding: 8, marginBottom: 14, borderRadius: 6
            }}>
              {isAr ? 'بون إيداع — صيانة' : 'BON DE DÉPÔT — RÉPARATION'}
            </div>

            {/* Repair ID */}
            <div style={{ textAlign: 'center', fontSize: '1.4rem', fontWeight: 900, color: '#0057FF', marginBottom: 8, letterSpacing: '0.05em' }}>
              {repair.id}
            </div>

            {/* Scannable Real QR Code */}
            <div style={{ textAlign: 'center', margin: '14px 0' }}>
              <img
                src={realQrUrl}
                alt={`QR Code ${repair.trackingCode || repair.id}`}
                style={{ width: 160, height: 160, padding: 4, background: '#fff', border: '1px solid #ddd', borderRadius: 8 }}
              />
              <div style={{ fontSize: '0.72rem', color: '#2563eb', fontWeight: 700, marginTop: 6 }}>
                {isAr ? 'امسح الرمز لتتبع حالة جهازك عبر الموقع' : isEn ? 'Scan this QR code to track your repair status online' : 'Scannez ce QR code pour suivre la réparation en ligne'}
              </div>
              <div style={{ fontSize: '0.65rem', color: '#64748b', marginTop: 2 }}>
                {trackingUrl}
              </div>
            </div>

            {/* Client info */}
            <div style={{ marginBottom: 14 }}>
              <div style={{ fontSize: '0.78rem', fontWeight: 800, textTransform: 'uppercase', color: '#666', borderBottom: '1px dashed #ccc', paddingBottom: 4, marginBottom: 8 }}>
                {isAr ? 'معلومات العميل' : isEn ? 'CLIENT INFORMATION' : 'INFORMATIONS CLIENT'}
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', padding: '3px 0' }}>
                <span style={{ color: '#666', fontWeight: 600 }}>{isAr ? 'الاسم' : isEn ? 'Client Name' : 'Nom Client'}:</span>
                <strong style={{ color: '#1a1a2e' }}>{repair.customerName}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', padding: '3px 0' }}>
                <span style={{ color: '#666', fontWeight: 600 }}>{isAr ? 'الهاتف' : isEn ? 'Phone Number' : 'N° Téléphone'}:</span>
                <strong style={{ color: '#1a1a2e' }}>{repair.customerPhone}</strong>
              </div>
            </div>

            {/* Device info */}
            <div style={{ marginBottom: 14 }}>
              <div style={{ fontSize: '0.78rem', fontWeight: 800, textTransform: 'uppercase', color: '#666', borderBottom: '1px dashed #ccc', paddingBottom: 4, marginBottom: 8 }}>
                {isAr ? 'الجهاز' : isEn ? 'DEPOSITED DEVICE' : 'APPAREIL DÉPOSÉ'}
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', padding: '3px 0' }}>
                <span style={{ color: '#666', fontWeight: 600 }}>{isAr ? 'النوع' : isEn ? 'Category' : 'Catégorie'}:</span>
                <strong style={{ color: '#1a1a2e' }}>{repair.deviceType === 'laptop' ? 'Laptop' : repair.deviceType === 'desktop' ? 'Desktop' : (isAr ? 'جهاز آخر' : 'Autre Appareil')}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', padding: '3px 0' }}>
                <span style={{ color: '#666', fontWeight: 600 }}>{isAr ? 'العلامة / الموديل' : isEn ? 'Brand / Model' : 'Marque / Modèle'}:</span>
                <strong style={{ color: '#1a1a2e' }}>{repair.deviceBrand} {repair.deviceModel}</strong>
              </div>
              {repair.deviceSerialNumber && (
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', padding: '3px 0' }}>
                  <span style={{ color: '#666', fontWeight: 600 }}>{isAr ? 'الرقم التسلسلي' : isEn ? 'Serial Number (S/N)' : 'N° Série (S/N)'}:</span>
                  <strong style={{ color: '#1a1a2e' }}>{repair.deviceSerialNumber}</strong>
                </div>
              )}
            </div>

            {/* Accessories */}
            {repair.deviceAccessories && repair.deviceAccessories.length > 0 && (
              <div style={{ marginBottom: 14 }}>
                <div style={{ fontSize: '0.78rem', fontWeight: 800, textTransform: 'uppercase', color: '#666', borderBottom: '1px dashed #ccc', paddingBottom: 4, marginBottom: 8 }}>
                  {isAr ? 'الملحقات المتروكة' : isEn ? 'LEFT ACCESSORIES' : 'ACCESSOIRES LAISSÉS'}
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, fontSize: '0.78rem' }}>
                  {repair.deviceAccessories.map((a, i) => (
                    <span key={i} style={{ background: '#e2e8f0', color: '#0f172a', padding: '3px 8px', borderRadius: 4, fontWeight: 600 }}>
                      ✓ {a}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Issue */}
            <div style={{ marginBottom: 14 }}>
              <div style={{ fontSize: '0.78rem', fontWeight: 800, textTransform: 'uppercase', color: '#666', borderBottom: '1px dashed #ccc', paddingBottom: 4, marginBottom: 8 }}>
                {isAr ? 'المشكلة المعلنة' : isEn ? 'DECLARED PROBLEM' : 'PROBLÈME & PANNE DÉCLARÉE'}
              </div>
              <div style={{
                fontSize: '0.85rem', padding: 10, background: '#f8fafc',
                borderRadius: 6, borderLeft: '4px solid #0057FF', color: '#0f172a', fontWeight: 600
              }}>
                {repair.issueDescription}
              </div>
            </div>

            {/* Date */}
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', padding: '4px 0', marginBottom: 14 }}>
              <span style={{ color: '#666', fontWeight: 600 }}>{isAr ? 'تاريخ الإيداع' : isEn ? 'Deposit Date' : 'Date de dépôt'}:</span>
              <strong style={{ color: '#1a1a2e' }}>{repair.depositDate} — {new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</strong>
            </div>

            {/* Legal */}
            <div style={{
              marginTop: 18, padding: 10, border: '1px dashed #cbd5e1',
              fontSize: '0.68rem', color: '#64748b', textAlign: 'center', lineHeight: 1.5
            }}>
              {isAr
                ? 'تنبيه: يرجى الاحتفاظ بهذا البون لاستلام الجهاز. المحل غير مسؤول عن الأجهزة التي تتجاوز مدة 60 يوماً من عدم الاستلام.'
                : isEn
                ? 'Please keep this receipt to collect your device. The workshop is not responsible for unclaimed devices after 60 days.'
                : 'Veuillez conserver ce bon pour retirer votre appareil. L\'atelier décline toute responsabilité pour les matériels non réclamés après 60 jours.'}
            </div>

            {/* Signatures */}
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 24, paddingTop: 10 }}>
              <div style={{ width: '45%', textAlign: 'center', fontSize: '0.78rem', fontWeight: 700, color: '#64748b' }}>
                <div style={{ borderBottom: '1px solid #cbd5e1', height: 40, marginBottom: 6 }} />
                <span>Signature Client</span>
              </div>
              <div style={{ width: '45%', textAlign: 'center', fontSize: '0.78rem', fontWeight: 700, color: '#64748b' }}>
                <div style={{ borderBottom: '1px solid #cbd5e1', height: 40, marginBottom: 6 }} />
                <span>Pour NH TECH</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
