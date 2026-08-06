import React from 'react';
import { Link } from 'react-router-dom';
import { X, Star, Calendar, Award, Clock } from 'lucide-react';
import { useLanguage } from '../lib/i18n';

export interface Expert {
  name: string;
  specialty: string;
  rating: string;
  img: string;
  bio?: string;
  availableSlots?: string[];
}

interface ExpertModalProps {
  expert: Expert | null;
  onClose: () => void;
}

export default function ExpertModal({ expert, onClose }: ExpertModalProps) {
  const { t } = useLanguage();

  if (!expert) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-container" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close-btn" onClick={onClose}>
          <X size={20} />
        </button>

        <div style={{ display: 'flex', gap: '24px', alignItems: 'center', marginBottom: '24px' }}>
          <img 
            src={expert.img} 
            alt={expert.name} 
            style={{ width: '100px', height: '100px', borderRadius: '50%', objectFit: 'cover', border: '3px solid var(--bleu-clair)' }}
          />
          <div>
            <span className="expert-tag" style={{ marginBottom: '6px' }}>{expert.specialty}</span>
            <h3 style={{ fontSize: '1.35rem', marginBottom: '4px' }}>{expert.name}</h3>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#F59E0B', fontWeight: 700, fontSize: '0.9rem' }}>
              <Star size={16} fill="#F59E0B" color="#F59E0B" />
              <span>{expert.rating}</span>
            </div>
          </div>
        </div>

        <div style={{ background: 'var(--bg-secondary)', padding: '18px', borderRadius: '20px', marginBottom: '24px' }}>
          <h4 style={{ fontSize: '0.95rem', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Award size={18} color="var(--bleu)" /> {t('expert_modal.bio_title')}
          </h4>
          <p style={{ fontSize: '0.9rem', lineHeight: 1.7 }}>
            {expert.bio || t('expert_modal.default_bio')}
          </p>
        </div>

        <div style={{ marginBottom: '24px' }}>
          <h4 style={{ fontSize: '0.9rem', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Clock size={16} color="var(--rose)" /> {t('expert_modal.slots_title')}
          </h4>
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            {(expert.availableSlots || ['Mer. 15 Mai - 14:00', 'Jeu. 16 Mai - 10:00', 'Ven. 17 Mai - 16:00']).map((slot, i) => (
              <span key={i} className="lang-toggle" style={{ background: 'var(--bleu-clair)', color: 'var(--bleu-royal)', borderColor: 'transparent', fontWeight: 700 }}>
                {slot}
              </span>
            ))}
          </div>
        </div>

        <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
          <button className="btn btn-secondary" onClick={onClose}>
            {t('expert_modal.close')}
          </button>
          <Link to="/consultations" className="btn btn-primary" onClick={onClose}>
            <Calendar size={18} /> {t('expert_modal.book_with')} {expert.name.split(' ')[1] || expert.name}
          </Link>
        </div>
      </div>
    </div>
  );
}
