import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';

export type Lang = 'fr' | 'ar' | 'en';

interface LanguageContextType {
  lang: Lang;
  setLang: (lang: Lang) => void;
  t: (key: string) => string;
  dir: 'ltr' | 'rtl';
}

const translations: Record<string, Record<Lang, string>> = {
  // Navigation
  'nav.home': { fr: 'Accueil', ar: 'الرئيسية', en: 'Home' },
  'nav.pieces': { fr: 'Vente de Pièces', ar: 'قطع الغيار والعتاد', en: 'Hardware Parts' },
  'nav.laptops': { fr: 'Vente Laptops', ar: 'الحواسيب المحمولة', en: 'Laptops & PCs' },
  'nav.about': { fr: 'À propos', ar: 'من نحن', en: 'About' },
  'nav.contact': { fr: 'Contact', ar: 'تواصل معنا', en: 'Contact' },

  // Hero
  'hero.tagline': { fr: '⚡ NH TECH — High-End PC Builder & Hardware', ar: '⚡ إن إتش تيك — تجميع وحواسيب الألعاب والعتاد', en: '⚡ NH TECH — High-End PC Builder & Hardware' },
  'hero.title1': { fr: 'NH TECH', ar: 'إن إتش تيك', en: 'NH TECH' },
  'hero.title2': { fr: 'BUILD • SELL • UPGRADE', ar: 'تجميع • بيع • تطوير', en: 'BUILD • SELL • UPGRADE' },
  'hero.subtitle': { fr: 'Vente de **composants informatiques** premium, assemblage sur-mesure de **PC Gamer** et vente de **laptops professionnels**.', ar: 'بيع **مكونات الكمبيوتر** الفاخرة، تجميع **حواسيب الألعاب** المخصصة، وبيع الحواسيب المحمولة الاحترافية.', en: 'Sale of premium **IT components**, custom **Gaming PC** builds, and professional laptops.' },
  'hero.cta.formations': { fr: 'Découvrir nos PC & Composants', ar: 'استكشف الحواسيب والقطع', en: 'Explore PCs & Components' },
  'hero.cta.consultation': { fr: 'Suivre ma commande Web', ar: 'متابعة طلبيتي', en: 'Track Web Order' },
  'hero.social_proof': { fr: '+1500 PC assemblés & réparés avec succès', ar: '+1500 حاسوب تم تجميعه وصيانته بنجاح', en: '+1500 PCs built & repaired successfully' },
  'hero.social_proof_rating': { fr: '4.9/5 (Basé sur 680 avis)', ar: '4.9/5 (بناءً على 680 تقييمًا)', en: '4.9/5 (Based on 680 reviews)' },
  'hero.widget.next_appointment': { fr: 'Suivi de Réparation', ar: 'متابعة الصيانة', en: 'Repair Tracking' },
  'hero.widget.see_details': { fr: 'Voir l\'état →', ar: 'عرض الحالة ←', en: 'View status →' },
  'hero.widget.recommended_course': { fr: 'Configuration Recommandée', ar: 'تجميعه موصى بها', en: 'Recommended Build' },
  'hero.widget.online_available': { fr: 'Diagnostic Express', ar: 'تشخيص سريع', en: 'Express Diagnostics' },
  'hero.widget.available': { fr: 'Disponible', ar: 'متاح', en: 'Available' },
  'hero.widget.resources': { fr: 'Conseils & Nouveautés Tech', ar: 'نصائح وأخبار التكنولوجيا', en: 'Tech News & Guides' },
  'hero.widget.new_articles': { fr: 'Derniers composants', ar: 'أحدث المكونات', en: 'Latest hardware' },

  // Stats
  'stats.formations': { fr: 'Composants', ar: 'مكونات', en: 'Components' },
  'stats.students': { fr: 'Clients Satisfaits', ar: 'زبون سعيد', en: 'Happy Clients' },
  'stats.satisfaction': { fr: 'Satisfaction', ar: 'رضا الزبائن', en: 'Satisfaction' },
  'stats.experts': { fr: 'Techniciens', ar: 'تقنيون', en: 'Technicians' },
  'stats.families': { fr: 'PC Sur-Mesure Assemblés', ar: 'حاسوب تم تجميعه', en: 'Custom PCs Built' },
  'stats.experts_qual': { fr: 'Experts Hardware', ar: 'خبراء عتاد', en: 'Hardware Experts' },
  'stats.satisfaction_rate': { fr: 'Taux de satisfaction', ar: 'نسبة الرضا', en: 'Satisfaction rate' },
  'stats.available_courses': { fr: 'Produits en Stock', ar: 'منتج في المخزن', en: 'Products in Stock' },

  // Services
  'services.title': { fr: 'Nos Services Hardware & SAV', ar: 'خدماتنا في الصيانة والعتاد', en: 'Our Hardware & Service Offerings' },
  'services.subtitle': { fr: 'Un accompagnement d\'experts pour le choix, le montage et la réparation de votre matériel informatique', ar: 'دعم ومرافقة من الخبراء لاختيار، تجميع وتصليح عتادك الحاسوبي', en: 'Expert guidance for choosing, assembling, and repairing your hardware' },
  'services.learn_more': { fr: 'En savoir plus', ar: 'اقرأ المزيد', en: 'Learn more' },
  
  'service.consultation.name': { fr: 'Réparation & SAV PC', ar: 'تصليح وصيانة الكمبيوتر', en: 'PC Repair & Service' },
  'service.consultation.desc': { fr: 'Diagnostic de panne, remplacement de pièces, désoxydation et réparation carte mère.', ar: 'تشخيص الأعطال، تغيير القطع، معالجة الرطوبة وتصليح اللوحة الأم.', en: 'Failure diagnosis, component replacement, oxidation removal, and motherboard repair.' },
  'service.psycho.name': { fr: 'Assemblage PC Sur-Mesure', ar: 'تجميع حواسيب حسب الطلب', en: 'Custom Gaming PC Builds' },
  'service.psycho.desc': { fr: 'Montage professionnel, câble management propre, tests de charge et optimisation BIOS.', ar: 'تركيب احترافي، تنظيم الكوابل، اختبار الأداء وتحسين البايوس.', en: 'Professional assembly, clean cable management, stress testing & BIOS tuning.' },
  'service.couple.name': { fr: 'Upgrade & Performance', ar: 'تطوير وتحسين الأداء', en: 'Hardware Upgrade' },
  'service.couple.desc': { fr: 'Ajout de mémoire RAM, SSD NVMe ultra-rapides, GPU de pointe et Watercooling.', ar: 'إضافة الذاكرة، SSD سريع، بطاقات الشاشة وأنظمة التبريد المائي.', en: 'RAM expansion, ultra-fast NVMe SSDs, flagship GPUs, and liquid cooling.' },
  'service.education.name': { fr: 'Nettoyage & Pâte Thermique', ar: 'تنظيف وتغيير المعجون الحراري', en: 'Maintenance & Repasting' },
  'service.education.desc': { fr: 'Dépoussiérage complet, remplacement de pâte thermique haute performance et dépollution.', ar: 'تنظيف شامل من الغبار، وتغيير المعجون الحراري عالي الجودة.', en: 'Deep dust cleaning, premium thermal paste application & thermal management.' },
  'service.formation.name': { fr: 'Vente de Composants Premium', ar: 'بيع قطع غيار فاخرة', en: 'Premium Hardware Store' },
  'service.formation.desc': { fr: 'Processeurs, cartes mères, cartes graphiques, alimentations certifiées et boîtiers.', ar: 'معالجات، لوحات أم، كروت شاشة، مزودات طاقة معتمدة وصناديق الألعاب.', en: 'CPUs, motherboards, GPUs, certified PSUs, and gaming cases.' },
  'service.workshop.name': { fr: 'Diagnostic & Devis Gratuit', ar: 'فحص وتشخيص مجاني', en: 'Free Diagnostic & Estimate' },
  'service.workshop.desc': { fr: 'Évaluation technique rapide de votre machine avec devis transparent sans engagement.', ar: 'تقييم سريع لعتادك الحاسوبي مع تقديم تقرير وشرح شفاف.', en: 'Fast technical evaluation of your PC with transparent, no-obligation estimate.' },

  // Pourquoi Choisir
  'why.title': { fr: 'Pourquoi choisir NH TECH ?', ar: 'لماذا تختار إن إتش تيك؟', en: 'Why choose NH TECH?' },
  'why.subtitle': { fr: 'Notre engagement pour la performance hardware absolue et la satisfaction garantie', ar: 'التزامنا نحو الأداء الفائق والرضا التام للزبائن', en: 'Our commitment to absolute hardware performance and guaranteed satisfaction' },
  'why.confidentiality.title': { fr: 'Garantie & Pièces d\'Origine', ar: 'ضمان وقطع أصلية', en: 'Warranty & Original Parts' },
  'why.confidentiality.desc': { fr: 'Toutes nos pièces et composants sont 100% neufs avec garantie constructeur.', ar: 'جميع القطع والمكونات جديدة 100% وتحت الضمان الرسمي.', en: 'All our parts and components are 100% brand new with official warranty.' },
  'why.kindness.title': { fr: 'Diagnostic Rapide 24/48h', ar: 'تشخيص سريع 24/48 سا', en: 'Fast Diagnostic 24/48h' },
  'why.kindness.desc': { fr: 'Prise en charge prioritaire et détection précise de vos pannes informatiques.', ar: 'تكفل سريع وفحص أولوي لأعطال حاسوبك.', en: 'Priority check-in and precise detection of your PC issues.' },
  'why.experts.title': { fr: 'Techniciens Passionnés', ar: 'تقنيون محترفون', en: 'Expert Technicians' },
  'why.experts.desc': { fr: 'Une équipe d\'experts passionnés de hardware et spécialistes du sur-mesure.', ar: 'فريق محترف وشغوف بمجال العتاد وتجميع الكمبيوتر.', en: 'A team of passionate hardware experts and custom build specialists.' },
  'why.integrated.title': { fr: 'Assemblage Rétro-Éclairé & Pro', ar: 'تجميع احترافي دقيق', en: 'Pro Assembly & Management' },
  'why.integrated.desc': { fr: 'Montage méticuleux avec câble management impeccable et stress-test.', ar: 'تجميع دقيق مع تنظيم عالي المستوى للكوابل واختبار الاستقرار.', en: 'Meticulous assembly with immaculate cable management and stress tests.' },
  'why.accessibility.title': { fr: 'Conseil selon votre Budget', ar: 'نصائح حسب الميزانية', en: 'Customized Budget Advice' },
  'why.accessibility.desc': { fr: 'Conseils personnalisés selon vos besoins réels (Gaming, 3D Render, Bureautique).', ar: 'نصائح مخصصة حسب ميزانيتك وطبيعة عملك (ألعاب/مونتاج/عمل).', en: 'Tailored advice based on your budget and workload (Gaming, 3D, Workstation).' },
  'why.results.title': { fr: 'Transparence & Suivi', ar: 'شفافية ومتابعة', en: 'Transparency & Tracking' },
  'why.results.desc': { fr: 'Tarifs transparents sans frais cachés et suivi de réparation en direct.', ar: 'أسعار واضحة ومتابعة حالة التصليح في الوقت الفعلي.', en: 'Clear pricing with zero hidden fees and live repair tracking.' },

  // Experts section
  'experts.title': { fr: 'Nos Techniciens & Experts SAV', ar: 'خبراؤنا والتقنيون', en: 'Our Hardware Technicians' },
  'experts.subtitle': { fr: 'Des spécialistes certifiés pour prendre soin de votre machine', ar: 'تقنيون مؤهلون وشغوفون في خدمتكم', en: 'Certified specialists ready to build and fix your rig' },
  'experts.view_all': { fr: 'Voir toute l\'équipe', ar: 'عرض جميع التقنيين', en: 'View full team' },
  'experts.book_btn': { fr: 'Demander conseil', ar: 'استشارة تقنية', en: 'Ask an Expert' },
  'expert.see_profile': { fr: 'Voir l\'expert', ar: 'عرض الملف', en: 'View profile' },

  // Expert Modal
  'expert_modal.bio_title': { fr: 'Spécialités & Expérience', ar: 'التخصص والخبرة', en: 'Specialties & Background' },
  'expert_modal.slots_title': { fr: 'Horaires d\'accueil atelier', ar: 'أوقات استلام الحواسيب', en: 'Workshop Availability' },
  'expert_modal.close': { fr: 'Fermer', ar: 'إغلاق', en: 'Close' },
  'expert_modal.book_with': { fr: 'Consulter', ar: 'استشارة مع', en: 'Consult with' },

  // FAQ
  'faq.title': { fr: 'Foire aux questions (FAQ Tech)', ar: 'الأسئلة الشائعة حول الصيانة', en: 'Frequently Asked Questions' },
  'faq.subtitle': { fr: 'Des réponses claires à vos questions sur le matériel et la réparation', ar: 'إجابات واضحة على أسئلتك الأكثر تكراراً', en: 'Clear answers regarding builds, parts & repair services' },
  'faq.q1': { fr: 'Combien de temps prend l\'assemblage d\'un PC Gamer ?', ar: 'كم يستغرق تجميع حاسوب ألعاب مخصص؟', en: 'How long does a custom Gaming PC build take?' },
  'faq.a1': { fr: 'En général, un assemblage complet avec installation de Windows, mise à jour du BIOS, réglage XMP/EXPO et tests de stabilité prend 24 à 48 heures.', ar: 'عادةً، يستغرق التجميع الكامل مع تثبيت النظام وتحديث البايوس واختبارات الاستقرار بين 24 إلى 48 ساعة.', en: 'Generally, a complete build with OS installation, BIOS updates, XMP/EXPO setup & stability tests takes 24 to 48 hours.' },
  'faq.q2': { fr: 'Mes pièces et mon matériel sont-ils sous garantie ?', ar: 'هل القطع والخدمات تحت الضمان؟', en: 'Are parts and repairs covered by warranty?' },
  'faq.a2': { fr: 'Absolument. Tous nos composants neufs bénéficient de la garantie constructeur officielle (1 à 3 ans) et nos réparations sont garanties.', ar: 'بالتأكيد. جميع مكوناتنا الجديدة مغطاة بالضمان الرسمي (من سنة إلى 3 سنوات) والإصلاحات مضمونة.', en: 'Absolutely. All brand new parts carry official manufacturer warranty (1 to 3 years), and repair jobs are fully guaranteed.' },
  'faq.q3': { fr: 'Puis-je apporter mes propres composants pour le montage ?', ar: 'هل يمكنني إحضار قطعي الخاصة للتجميع؟', en: 'Can I bring my own components for assembly?' },
  'faq.a3': { fr: 'Oui ! Nous proposons un service d\'assemblage seul pour vos composants avec câble management professionnel et tests de charge.', ar: 'نعم! نقدم خدمة التركيب والتجميع لقطعك الخاصة مع تنظيم الكوابل والفحص الشامل.', en: 'Yes! We offer standalone assembly services for your own components with pro cable management & load testing.' },
  'faq.q4': { fr: 'Comment faire un devis pour un PC sur-mesure ?', ar: 'كيف أحصل على تسعيرة لحاسوب مخصص؟', en: 'How do I get a quote for a custom PC?' },
  'faq.a4': { fr: 'Contactez-nous via le formulaire en ligne, WhatsApp ou par téléphone en indiquant votre budget et l\'utilisation souhaitée.', ar: 'تواصل معنا عبر النموذج الإلكتروني أو الواتساب أو الهاتف مع تحديد ميزانيتك واستعمالك.', en: 'Contact us via online form, WhatsApp or phone specifying your budget and intended use.' },

  // Formations page & Catalogue
  'formations.title': { fr: 'Catalogue PC & Composants', ar: 'كتالوج الحواسيب والقطع', en: 'PC Builds & Parts Store' },
  'formations.subtitle': { fr: 'Explorez nos composants neufs, configurateurs et services de réparation', ar: 'استكشف قطع الغيار، التجميعات وخدمات الصيانة', en: 'Explore our hardware, builds & repair packages' },
  'formations.all': { fr: 'Tous', ar: 'الكل', en: 'All' },
  'formations.langues': { fr: 'PC Gamer & Workstation', ar: 'حواسيب الألعاب والعمل', en: 'Gaming PCs & Workstations' },
  'formations.religieux': { fr: 'Composants Hardware', ar: 'قطع الغيار والعتاد', en: 'Hardware Components' },
  'formations.soutien': { fr: 'Services & Réparations', ar: 'خدمات الصيانة والتصليح', en: 'Repair & SAV Services' },
  'formations.softskills': { fr: 'Refroidissement & Boîtiers', ar: 'التبريد وصناديق الحاسوب', en: 'Cooling & PC Cases' },
  'formations.featured_title': { fr: 'Configurations & Pièces Mises en Avant', ar: 'تجميعات وقطع مميزة', en: 'Featured Builds & Components' },
  'formations.featured_subtitle': { fr: 'Matériel sélectionné pour ses performances exceptionnelles et sa fiabilité', ar: 'عتاد مختار لأدائه العالي وموثوقيته', en: 'Hardware picked for top performance and reliability' },
  'formations.view_all': { fr: 'Voir tout le catalogue', ar: 'عرض كل الكتالوج', en: 'View full shop' },
  'formations.search_placeholder': { fr: 'Rechercher un composant, un PC Gamer, une pièce...', ar: 'ابحث عن قطعة، حاسوب، خدمة...', en: 'Search for a component, build, service...' },
  'formations.found_count': { fr: 'produits trouvés', ar: 'منتجات موجودة', en: 'products found' },
  'formations.newsletter_title': { fr: 'Ne manquez aucun arrivage ni promo Hardware', ar: 'لا تفوت أي وصول جديد أو تخفيضات في العتاد', en: 'Never miss new arrivals or hardware deals' },
  'formations.newsletter_desc': { fr: 'Inscrivez-vous pour recevoir les nouveautés GPU, CPU et offres exclusives.', ar: 'اشترك للحصول على أحدث وصول لكروت الشاشة والعروض الحصرية.', en: 'Subscribe to get GPU, CPU stock alerts and exclusive deals.' },
  'formations.subscribe': { fr: 'S\'inscrire', ar: 'اشتراك', en: 'Subscribe' },
  'formations.subscribed': { fr: 'Inscrit ✓', ar: 'تم الاشتراك ✓', en: 'Subscribed ✓' },
  'formations.register': { fr: 'Commander / Réserver', ar: 'طلب / حجز', en: 'Order / Reserve' },
  'formations.details': { fr: 'Voir fiche technique', ar: 'عرض المواصفات', en: 'View Specs' },
  'formations.duration': { fr: 'garantie', ar: 'ضمان', en: 'warranty' },
  'formations.level.beginner': { fr: 'Entrée de gamme', ar: 'فئة ابتدائية', en: 'Entry Level' },
  'formations.level.intermediate': { fr: 'Milieu de gamme', ar: 'فئة متوسطة', en: 'Mid-Range' },
  'formations.level.advanced': { fr: 'Haut de gamme (High-End)', ar: 'فئة عليا (High-End)', en: 'High-End Pro' },
  'formations.type.presentiel': { fr: 'En Stock', ar: 'متوفر بالمخزن', en: 'In Stock' },
  'formations.type.online': { fr: 'Sur Commande', ar: 'تحت الطلب', en: 'On Demand' },
  'formations.type.hybrid': { fr: 'Sur-Mesure', ar: 'مخصص', en: 'Custom' },
  'formations.noResults': { fr: 'Aucun produit ne correspond à votre recherche.', ar: 'لا توجد منتجات تطابق بحثك حاليا.', en: 'No products match your criteria.' },
  'formations.loading': { fr: 'Chargement du catalogue...', ar: 'جاري تحميل الكتالوج...', en: 'Loading catalogue...' },

  // Testimonials
  'testimonials.title': { fr: 'Avis & Témoignages Clients', ar: 'آراء وتقييمات زبائننا', en: 'Client Testimonials' },
  'testimonials.subtitle': { fr: 'Découvrez ce que les gamers et professionnels disent des services NH TECH', ar: 'اكتشف ما يقوله اللاعبون والمحترفون عن خدمات إن إتش تيك', en: 'Discover what gamers and creators say about NH TECH' },

  // Bottom CTA Banner
  'cta.banner_title': { fr: 'Prêt à booster vos performances ou réparer votre PC ?', ar: 'هل أنت مستعد لرفع أداء حاسوبك أو إصلحه؟', en: 'Ready to upgrade your performance or fix your PC?' },
  'cta.banner_subtitle': { fr: 'Prenez contact dès maintenant avec nos techniciens experts NH TECH.', ar: 'تواصل الآن مع تقنيي وخبرات إن إتش تيك.', en: 'Get in touch with our NH TECH hardware experts today.' },

  // Detail keys
  'detail.objectives': { fr: 'Points forts', ar: 'النقاط القوية', en: 'Key Features' },
  'detail.curriculum': { fr: 'Fiche Technique', ar: 'المواصفات التقنية', en: 'Specifications' },
  'detail.prerequisites': { fr: 'Compatibilité', ar: 'التوافق', en: 'Compatibility' },
  'detail.targetAudience': { fr: 'Utilisation conseillée', ar: 'الاستخدام الموصى به', en: 'Recommended Usage' },
  'detail.inscription': { fr: 'Commander', ar: 'الطلب', en: 'Order' },
  'detail.price': { fr: 'Prix', ar: 'السعر', en: 'Price' },
  'detail.badge_popular': { fr: 'Populaire', ar: 'شائع', en: 'Popular' },
  'detail.badge_new': { fr: 'Nouveau', ar: 'جديد', en: 'New' },
  'detail.badge_bestseller': { fr: 'Top Vente', ar: 'الأكثر مبيعاً', en: 'Top Seller' },
  'detail.interm_level': { fr: 'Composant Premium', ar: 'قطعة فاخرة', en: 'Premium Component' },
  'detail.modules_count': { fr: 'Garantie 12 Mois', ar: 'ضمان 12 شهراً', en: '12 Month Warranty' },
  'detail.certif_included': { fr: 'Garantie & Support inclus', ar: 'الضمان والدعم مدرج', en: 'Warranty & Support included' },
  'detail.enroll_now': { fr: 'Commander maintenant', ar: 'الطلب الآن', en: 'Order Now' },
  'detail.add_fav': { fr: 'Ajouter aux favoris', ar: 'إضافة للمفضلة', en: 'Add to wishlist' },
  'detail.in_fav': { fr: 'Dans vos favoris', ar: 'في المفضلة', en: 'In wishlist' },
  'detail.about_course': { fr: 'À propos de ce produit / service', ar: 'عن هذا المنتج / الخدمة', en: 'About this product / service' },
  'detail.what_you_learn': { fr: 'Performances & Avantages', ar: 'الأداء والمزايا', en: 'Performance & Benefits' },
  'detail.who_is_it_for': { fr: 'À qui s\'adresse ce matériel ?', ar: 'لمن يوجه هذا العتاد؟', en: 'Who is this hardware for?' },
  'detail.course_program': { fr: 'Détails des caractéristiques', ar: 'المواصفات التفصيلية', en: 'Technical Details' },
  'detail.your_instructor': { fr: 'Expert Référent', ar: 'التقني المسؤول', en: 'Lead Technician' },
  'detail.pricing_title': { fr: 'Prix du produit', ar: 'السعر الحالي', en: 'Price' },
  'detail.special_offer_ends': { fr: '⏰ Offre spéciale stock limité :', ar: '⏰ عرض خاص كمية محدودة:', en: '⏰ Limited stock offer:' },
  'detail.gift_course': { fr: 'Offrir / Commander pour un proche', ar: 'طلب كهدية', en: 'Order as a gift' },
  'detail.includes_title': { fr: 'Ce produit/service inclut :', ar: 'يتضمن هذا المنتج / الخدمة:', en: 'Included with this order:' },
  'detail.lifetime_access': { fr: 'Garantie officielle constructeur', ar: 'ضمان رسمي من المصنّع', en: 'Official manufacturer warranty' },
  'detail.hd_videos': { fr: 'Tests de charge & Benchmarks réalisés', ar: 'اختبارات الاستقرار والأداء', en: 'Stress testing & benchmarks done' },
  'detail.pdf_downloads': { fr: 'Facture détaillée & Certificat de garantie', ar: 'فاتورة تفصيلية وشهادة ضمان', en: 'Itemized invoice & warranty slip' },
  'detail.mobile_access': { fr: 'Support technique dédié', ar: 'دعم تقني مخصص', en: 'Dedicated tech support' },
  'detail.certif_name': { fr: 'SAV et assistance atelier', ar: 'صيانة ومتابعة في الورشة', en: 'SAV & Workshop assistance' },
  'detail.guarantee_text': { fr: 'Garantie produit et satisfait ou échangé.', ar: 'ضمان للمنتجات والاستبدال.', en: 'Product warranty & satisfaction guarantee.' },

  // Consultations page
  'consultations.title': { fr: 'Service Réparation & Maintenance SAV', ar: 'خدمات الصيانة والتصليح', en: 'Repair & Maintenance SAV' },
  'consultations.subtitle': { fr: 'Choisissez la prestation adaptée à votre ordinateur', ar: 'اختر الخدمة المناسبة لحاسوبك', en: 'Select the service package for your PC' },
  'consultations.individual': { fr: 'Diagnostic & Réparation Panne', ar: 'تشخيص وتصليح الأعطال', en: 'Fault Diagnostic & Repair' },
  'consultations.individual.desc': { fr: 'Dépannage matériel ou logiciel, écran noir, problème d\'alimentation ou de surchauffe.', ar: 'فحص وحل مشاكل الشاشة السوداء، الحرارة أو انقطاع الطاقة.', en: 'Hardware/software troubleshooting, black screen, PSU or overheating fix.' },
  'consultations.couple': { fr: 'Montage & Assemblage Sur-Mesure', ar: 'تجميع حواسيب الألعاب', en: 'Custom Gaming PC Build' },
  'consultations.couple.desc': { fr: 'Assemblage de vos pièces avec câble management professionnel et installation de Windows.', ar: 'تجميع قطعك مع تنظيم الكوابل وتثبيت نظام التشغيل.', en: 'Assembly of your parts with pro cable management & OS setup.' },
  'consultations.family': { fr: 'Nettoyage & Remplacement Pâte Thermique', ar: 'تنظيف وتغيير المعجون الحراري', en: 'Deep Clean & Repasting' },
  'consultations.family.desc': { fr: 'Dépoussiérage atelier complet, désoxydation et application de pâte thermique haute performance.', ar: 'تنظيف كامل من الغبار وتغيير المعجون الحراري لتقليل الحرارة.', en: 'Deep dust cleaning, oxidation removal and high performance thermal paste.' },
  'consultations.online': { fr: 'Assistance & Support à Distance', ar: 'دعم ومساعدة عن بعد', en: 'Remote Tech Support' },
  'consultations.online.desc': { fr: 'Résolution de problèmes logiciels, optimisation de pilotes et BIOS à distance.', ar: 'حل المشاكل البرمجية، تحديث التعريفات والبايوس عن بعد.', en: 'Software troubleshooting, driver updates & BIOS optimization remotely.' },
  
  // Consultation New Form Admin Matching
  'consultation.new_title': { fr: 'Demande de Réparation / Devis', ar: 'طلب تصليح / تسعيرة', en: 'Repair Request / Quote' },
  'form.patient_name': { fr: 'Nom complet du client *', ar: 'اسم الزبون الكامل *', en: 'Customer Full Name *' },
  'form.patient_phone': { fr: 'Numéro de téléphone *', ar: 'رقم الهاتف *', en: 'Phone Number *' },
  'form.address': { fr: 'Ville / Adresse *', ar: 'المدينة / العنوان *', en: 'City / Address *' },
  'form.email_optional': { fr: 'Adresse e-mail (facultatif)', ar: 'البريد الإلكتروني (اختياري)', en: 'Email Address (optional)' },
  'form.consultation_type_label': { fr: 'Type de prestation *', ar: 'نوع الخدمة المطلوب *', en: 'Service Type *' },
  'form.mode.presentielle_btn': { fr: 'En Atelier (Dépôt)', ar: 'في الورشة (إيداع)', en: 'At Workshop' },
  'form.mode.online_btn': { fr: 'À Domicile / À Distance', ar: 'عن بعد / في المنزل', en: 'Remote / On-site' },
  'form.session_duration_label': { fr: 'Niveau d\'urgence *', ar: 'مستوى الأولوية *', en: 'Priority Level *' },
  'form.duration_30': { fr: 'Standard 48h', ar: 'عادي 48 سا', en: 'Standard 48h' },
  'form.duration_45': { fr: 'Express 24h', ar: 'سريع 24 سا', en: 'Express 24h' },
  'form.duration_60': { fr: 'Urgent Jour Même', ar: 'مستعجل في نفس اليوم', en: 'Same Day Urgent' },
  'form.notes_optional': { fr: 'Symptômes de la panne / Modèle du PC (facultatif)', ar: 'وصف العطل / نوع الحاسوب (اختياري)', en: 'Symptoms / PC Model (optional)' },
  'form.save_reservation': { fr: 'Valider la demande', ar: 'تأكيد الطلب', en: 'Submit Request' },
  'form.another_reservation': { fr: 'Autre demande', ar: 'طلب آخر', en: 'Another Request' },

  // Form labels
  'form.name': { fr: 'Nom complet', ar: 'الاسم الكامل', en: 'Full Name' },
  'form.phone': { fr: 'Téléphone', ar: 'رقم الهاتف', en: 'Phone Number' },
  'form.email': { fr: 'Email', ar: 'البريد الإلكتروني', en: 'Email Address' },
  'form.date': { fr: 'Date souhaitée', ar: 'التاريخ المطلوب', en: 'Preferred Date' },
  'form.time': { fr: 'Heure', ar: 'الوقت', en: 'Time' },
  'form.notes': { fr: 'Description du besoin / composant', ar: 'وصف الطلب / العتاد', en: 'Details / Hardware Specs' },
  'form.mode': { fr: 'Mode de prise en charge', ar: 'طريقة الاستلام', en: 'Service Mode' },
  'form.mode.presentiel': { fr: 'Dépôt en atelier NH TECH', ar: 'تسليم في ورشة إن إتش تيك', en: 'Drop-off at NH TECH workshop' },
  'form.mode.online': { fr: 'Livraison / Assistance à distance', ar: 'توصيل / دعم عن بعد', en: 'Delivery / Remote help' },
  'form.contact_pref': { fr: 'Moyen de contact préféré', ar: 'وسيلة التواصل المفضلة', en: 'Preferred Contact Method' },
  'form.submit': { fr: 'Envoyer la demande', ar: 'إرسال الطلب', en: 'Submit Request' },
  'form.submitting': { fr: 'Envoi en cours...', ar: 'جاري الإرسال...', en: 'Sending...' },
  'form.required': { fr: 'Champ obligatoire', ar: 'حقل إجباري', en: 'Required field' },
  'form.register': { fr: 'Commander ce matériel', ar: 'طلب هذا العتاد', en: 'Order this hardware' },

  // Success
  'success.reservation': { fr: 'Votre demande a été transmise à notre équipe technique !', ar: 'تم إرسال طلبك إلى فريقنا التقني بنجاح!', en: 'Your request was sent to our tech team!' },
  'success.reservation.desc': { fr: 'Nous vous contacterons rapidement pour valider les détails et la prise en charge.', ar: 'سنتواصل معكم في أقرب وقت لتأكيد التفاصيل والاستلام.', en: 'We will contact you shortly to confirm details and scheduling.' },
  'reservation.code': { fr: 'Code de suivi / ticket', ar: 'رمز تتبع الصيانة', en: 'Tracking Ticket Code' },
  'form.error.required': { fr: 'Veuillez remplir tous les champs obligatoires (*)', ar: 'يرجى ملء جميع الحقول الإجبارية (*)', en: 'Please fill in all required fields (*)' },
  'form.error.submit': { fr: 'Une erreur est survenue lors de l\'envoi. Veuillez réessayer.', ar: 'حدث خطأ أثناء الإرسال. يرجى المحاولة مرة أخرى.', en: 'An error occurred during submission. Please try again.' },
  'success.inscription': { fr: 'Votre commande a bien été enregistrée !', ar: 'تم تسجيل طلبيتك بنجاح!', en: 'Your order was successfully recorded!' },
  'success.inscription.desc': { fr: 'Notre équipe vous contactera pour la confirmation de stock et la livraison.', ar: 'سيتواصل معكم فريقنا بخصوص توفر المنتج والتوصيل.', en: 'Our team will contact you regarding stock confirmation and delivery.' },
  'success.back': { fr: 'Retour à l\'accueil', ar: 'العودة للرئيسية', en: 'Back to Home' },
  
  // Inscription Form Keys
  'inscription.participant_name': { fr: 'Nom complet du client', ar: 'اسم الزبون الكامل', en: 'Customer Full Name' },
  'inscription.participant_phone': { fr: 'Numéro de téléphone', ar: 'رقم الهاتف', en: 'Phone Number' },
  'inscription.participant_email': { fr: 'Adresse e-mail (optionnel)', ar: 'البريد الإلكتروني (اختياري)', en: 'Email address (optional)' },
  'inscription.notes_label': { fr: 'Remarques ou configuration souhaitée', ar: 'ملاحظات أو مواصفات خاصة', en: 'Notes or requested configuration' },
  'inscription.notes_placeholder': { fr: 'Des précisions sur votre processeur, carte graphique ou alimentation ?', ar: 'هل لديك متطلبات خاصة بخصوص المعالج أو كارت الشاشة؟', en: 'Any specific requests for CPU, GPU or PSU?' },
  'inscription.fee_label': { fr: 'Montant total :', ar: 'المبلغ الإجمالي :', en: 'Total Amount:' },
  'inscription.tracking': { fr: 'N° de ticket', ar: 'رقم التتبع', en: 'Tracking No.' },

  // About
  'about.title': { fr: 'À propos de NH TECH', ar: 'من نحن — إن إتش تيك', en: 'About NH TECH' },
  'about.vision.title': { fr: 'Notre Vision', ar: 'رؤيتنا', en: 'Our Vision' },
  'about.vision.text': { fr: 'Être la référence incontournable en matière de technologie, de réparation et d\'innovation informatique en Algérie, en offrant des solutions fiables, durables et performantes.', ar: 'أن نكون المرجع الأول في مجال التكنولوجيا، صيانة وتجميع الكمبيوتر في الجزائر، من خلال تقديم حلول موثوقة وعالية الأداء.', en: 'To be the leading benchmark for technology, PC building & repair services in Algeria, delivering reliable and high-performance hardware.' },
  'about.mission.title': { fr: 'Notre Mission', ar: 'رسالتنا', en: 'Our Mission' },
  'about.mission.text': { fr: 'Fournir des produits et services informatiques de haute qualité, avec expertise, rapidité, transparence et un support client personnalisé pour chaque passionné de tech et professionnel.', ar: 'تقديم منتجات وخدمات حاسوبية فائقة الجودة، بخبرة، سرعة وشفافية تامتين مع دعم مخصص لكل شغوف بالتكنولوجيا.', en: 'To provide top-tier IT products and services with expertise, speed, transparency, and tailored support for gamers and professionals.' },
  'about.values.title': { fr: 'Nos Valeurs', ar: 'قيمنا', en: 'Our Values' },
  'about.promise': { fr: '- BUILD • REPAIR • UPGRADE — La performance sans limites -', ar: '- تجميع • تصليح • تطوير — أداء بلا حدود -', en: '- BUILD • REPAIR • UPGRADE — Performance without limits -' },

  'value.bienveillance': { fr: 'Expertise', ar: 'الخبرة', en: 'Expertise' },
  'value.confiance': { fr: 'Fiabilité', ar: 'الموثوقية', en: 'Reliability' },
  'value.famille': { fr: 'Rapidité', ar: 'السرعة', en: 'Speed' },
  'value.expertise': { fr: 'Innovation', ar: 'الابتكار', en: 'Innovation' },
  'value.serenite': { fr: 'Passion Tech', ar: 'الشغف', en: 'Passion' },
  'value.ecoute': { fr: 'Intégrité', ar: 'النزاهة', en: 'Integrity' },
  'value.formation': { fr: 'Garantie', ar: 'الضمان', en: 'Warranty' },
  'value.developpement': { fr: 'Performance', ar: 'الأداء', en: 'Performance' },

  // Contact
  'contact.title': { fr: 'Contactez NH TECH', ar: 'تواصل مع إن إتش تيك', en: 'Contact NH TECH' },
  'contact.subtitle': { fr: 'Notre équipe d\'experts est à votre disposition en atelier ou en ligne', ar: 'فريق خبرائنا في خدمتكم في الورشة أو عبر الإنترنت', en: 'Our expert team is available at our workshop or online' },
  'contact.address': { fr: 'Adresse de l\'atelier', ar: 'عنوان الورشة والمحل', en: 'Workshop & Shop Address' },
  'contact.address.value': { fr: 'Bouzaréah, Alger, Algérie', ar: 'بوزريعة، الجزائر العاصمة', en: 'Bouzareah, Algiers, Algeria' },
  'contact.phone': { fr: 'Téléphone SAV / Vente', ar: 'الهاتف / المبيعات والصيانة', en: 'Phone / Sales & Support' },
  'contact.email': { fr: 'Email contact', ar: 'البريد الإلكتروني', en: 'Contact Email' },
  'contact.hours': { fr: 'Horaires d\'ouverture', ar: 'أوقات العمل', en: 'Opening Hours' },
  'contact.hours.value': { fr: 'Samedi – Jeudi : 9h – 19h', ar: 'السبت – الخميس: 9:00 – 19:00', en: 'Saturday – Thursday: 9 AM – 7 PM' },
  'contact.message': { fr: 'Envoyez-nous un message', ar: 'أرسل لنا رسالة', en: 'Send us a message' },
  'contact.send': { fr: 'Envoyer', ar: 'إرسال', en: 'Send' },

  // WhatsApp Contact
  'contact.whatsapp.title': { fr: 'Discussion directe WhatsApp', ar: 'محادثة مباشرة عبر واتساب', en: 'Direct WhatsApp Chat' },
  'contact.whatsapp.desc': { fr: 'Conseils et réponse rapide pour vos configs & devis en moins de 15 min.', ar: 'إجابة مباشرة وسريعة لتجميعتك واستفساراتك في أقل من 15 دقيقة.', en: 'Fast response regarding builds and quotes under 15 minutes.' },
  'contact.whatsapp.btn': { fr: 'Discuter sur WhatsApp', ar: 'محادثة عبر واتساب', en: 'Chat on WhatsApp' },

  // Footer
  'footer.description': { fr: 'Boutique informatique & atelier spécialisé en montage PC Gamer, composants de pointe et réparation SAV.', ar: 'محل وورشة متخصصة في تجميع حواسيب الألعاب، بيع قطع الغيار والصيانة السريعة.', en: 'IT store & workshop specialized in custom Gaming PCs, flagship hardware & repair services.' },
  'footer.links': { fr: 'Navigation', ar: 'روابط سريعة', en: 'Quick Links' },
  'footer.services': { fr: 'Services & Vente', ar: 'خدمات ومبيعات', en: 'Services & Shop' },
  'footer.contact': { fr: 'Contact & Atelier', ar: 'التواصل والورشة', en: 'Contact & Workshop' },
  'footer.rights': { fr: '© 2026 NH TECH. Tous droits réservés.', ar: '© 2026 إن إتش تيك. جميع الحقوق محفوظة.', en: '© 2026 NH TECH. All rights reserved.' },
  'footer.slogan': { fr: 'BUILD • REPAIR • UPGRADE — La performance sans limites', ar: 'تجميع • تصليح • تطوير — أداء بلا حدود', en: 'BUILD • REPAIR • UPGRADE — Performance without limits' },

  // Currency
  'currency': { fr: 'DA', ar: 'دج', en: 'DZD' },
};

const LanguageContext = createContext<LanguageContextType | null>(null);

const getInitialLang = (): Lang => {
  const local = localStorage.getItem('nhtech_lang') || localStorage.getItem('qalbi_lang');
  if (local === 'fr' || local === 'ar' || local === 'en') return local;

  const sys = (navigator.language || '').toLowerCase();
  if (sys.startsWith('ar')) return 'ar';
  if (sys.startsWith('en')) return 'en';
  return 'fr';
};

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(getInitialLang);

  const setLang = (newLang: Lang) => {
    setLangState(newLang);
    localStorage.setItem('nhtech_lang', newLang);
  };

  useEffect(() => {
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = lang;
  }, [lang]);

  const t = (key: string): string => {
    const translationSet = translations[key];
    if (!translationSet) return key;
    return translationSet[lang] || translationSet['fr'] || key;
  };

  const dir = lang === 'ar' ? 'rtl' : 'ltr';

  return (
    <LanguageContext.Provider value={{ lang, setLang, t, dir }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useLanguage must be inside LanguageProvider');
  return ctx;
}
