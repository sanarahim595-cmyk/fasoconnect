-- FasoTontine demo seed data. Safe to run multiple times.

INSERT INTO users (id, phone, email, first_name, last_name, password_hash, birth_date, gender, address, city, country, role, trust_score, status, created_at)
VALUES
  ('10000000-0000-0000-0000-000000000001', '+22670010001', 'awa.ouedraogo@demo.faso', 'Awa', 'Ouedraogo', 'pbkdf2_sha256$260000$d5c2cb5533b0e416b8de9f5a887027b8$2fb325502acebe38fe0f301b1599aa22a71b4eabf4c217f6e166b84d145599e9', '1992-03-12', 'female', 'Secteur 12', 'Ouagadougou', 'Burkina Faso', 'administrateur_plateforme', 96.00, 'active', NOW() - INTERVAL '40 days'),
  ('10000000-0000-0000-0000-000000000002', '+22670010002', 'moussa.traore@demo.faso', 'Moussa', 'Traore', 'pbkdf2_sha256$260000$048491174c39649d24d70079dceb20ed$1ab1e460936c9b92d4b7891b21d1f4d3111ebd920317c8a1de99c0ace7c86730', '1988-07-21', 'male', 'Accart-Ville', 'Bobo-Dioulasso', 'Burkina Faso', 'administrateur_tontine', 91.00, 'active', NOW() - INTERVAL '35 days'),
  ('10000000-0000-0000-0000-000000000003', '+22670010003', 'mariam.kabore@demo.faso', 'Mariam', 'Kabore', 'pbkdf2_sha256$260000$2600ab7d61fa1dffad9aa4f3e57bd2f5$58591f54ec370a19a92b84e7ae7b86f086c7777c402ab55f5eb694aa6c57375a', '1995-11-04', 'female', 'Dapoya', 'Ouagadougou', 'Burkina Faso', 'utilisateur', 84.00, 'active', NOW() - INTERVAL '32 days'),
  ('10000000-0000-0000-0000-000000000004', '+22670010004', 'omar.sawadogo@demo.faso', 'Omar', 'Sawadogo', 'pbkdf2_sha256$260000$55d8c3b400b8ed1330db08d728b5db2e$5647f6f4c2f22361e79bb1e177987a877c53937deb9f8135caa9e6be4945de70', '1990-06-18', 'male', 'Zone commerciale', 'Koudougou', 'Burkina Faso', 'utilisateur', 66.00, 'active', NOW() - INTERVAL '30 days'),
  ('10000000-0000-0000-0000-000000000005', '+22670010005', 'salimata.kone@demo.faso', 'Salimata', 'Kone', 'pbkdf2_sha256$260000$458d2894e093d95ddc3b23b8b68dfb5a$3052510e222b6e868aa7a363a561c43250b277972b154a1dc848ad4f7ff6f6e6', '1986-02-14', 'female', 'Secteur 4', 'Ouahigouya', 'Burkina Faso', 'utilisateur', 73.00, 'pending_verification', NOW() - INTERVAL '28 days'),
  ('10000000-0000-0000-0000-000000000006', '+22670010006', 'issa.ilboudo@demo.faso', 'Issa', 'Ilboudo', 'pbkdf2_sha256$260000$eddbdb8df873795b050b5d05aa65ca85$1d21307a0be05d3f0cab6037e9444639a0832c12949148eef049f04ffbf46899', '1984-09-29', 'male', 'Dioulassoba', 'Bobo-Dioulasso', 'Burkina Faso', 'utilisateur', 88.00, 'active', NOW() - INTERVAL '25 days'),
  ('10000000-0000-0000-0000-000000000007', '+22670010007', 'fatou.compaore@demo.faso', 'Fatou', 'Compaore', 'pbkdf2_sha256$260000$8a6372cc7e516e8204056d658a4cffa3$70500c611dfaa7c6a2b1a0f7b20155801c458f5f4958602f5b964ad7ed8c3dfc', '1998-01-09', 'female', 'Secteur 9', 'Fada N''Gourma', 'Burkina Faso', 'utilisateur', 79.00, 'active', NOW() - INTERVAL '22 days'),
  ('10000000-0000-0000-0000-000000000008', '+22670010008', 'paul.zongo@demo.faso', 'Paul', 'Zongo', 'pbkdf2_sha256$260000$79a94f5e38e3f1737535c986632c3404$e21569973c62f4806fa57f7285f97c9f96e645ebdb0e37aff8a2397d472c7281', '1993-12-27', 'male', 'Tampouy', 'Ouagadougou', 'Burkina Faso', 'utilisateur', 58.00, 'active', NOW() - INTERVAL '20 days')
ON CONFLICT (id) DO UPDATE SET
  phone = EXCLUDED.phone,
  email = EXCLUDED.email,
  first_name = EXCLUDED.first_name,
  last_name = EXCLUDED.last_name,
  password_hash = EXCLUDED.password_hash,
  city = EXCLUDED.city,
  role = EXCLUDED.role,
  trust_score = EXCLUDED.trust_score,
  status = EXCLUDED.status;

INSERT INTO cnib_verifications (id, user_id, cnib_number, first_name_extracted, last_name_extracted, birth_date_extracted, document_front_url, ocr_provider, ocr_raw, status, reviewed_by, reviewed_at, rejection_reason)
VALUES
  ('11000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'B12345678', 'Awa', 'Ouedraogo', '1992-03-12', '/demo/cnib/awa-front.jpg', 'demo_ocr', '{"confidence": 0.98}', 'verified', '10000000-0000-0000-0000-000000000001', NOW() - INTERVAL '38 days', NULL),
  ('11000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000002', 'B23456789', 'Moussa', 'Traore', '1988-07-21', '/demo/cnib/moussa-front.jpg', 'demo_ocr', '{"confidence": 0.95}', 'verified', '10000000-0000-0000-0000-000000000001', NOW() - INTERVAL '34 days', NULL),
  ('11000000-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000003', 'B34567890', 'Mariam', 'Kabore', '1995-11-04', '/demo/cnib/mariam-front.jpg', 'demo_ocr', '{"confidence": 0.93}', 'verified', '10000000-0000-0000-0000-000000000001', NOW() - INTERVAL '31 days', NULL),
  ('11000000-0000-0000-0000-000000000004', '10000000-0000-0000-0000-000000000004', 'B45678901', 'Omar', 'Sawadogo', '1990-06-18', '/demo/cnib/omar-front.jpg', 'demo_ocr', '{"confidence": 0.81}', 'manual_review', NULL, NULL, NULL),
  ('11000000-0000-0000-0000-000000000005', '10000000-0000-0000-0000-000000000005', 'B56789012', 'Salimata', 'Kone', '1986-02-14', '/demo/cnib/salimata-front.jpg', 'demo_ocr', '{"confidence": 0.62}', 'pending', NULL, NULL, NULL)
ON CONFLICT (id) DO NOTHING;

INSERT INTO tontines (id, name, description, organizer_id, contribution_amount, currency, frequency, start_date, max_members, rules, payout_order_locked, status, created_at)
VALUES
  ('20000000-0000-0000-0000-000000000001', 'Tontine Wend-Panga', 'Tontine mensuelle pour commercants de Ouagadougou.', '10000000-0000-0000-0000-000000000002', 10000, 'XOF', 'monthly', CURRENT_DATE - INTERVAL '3 months', 20, '{"internal_rules":"Penalite de 1000 XOF apres 3 jours de retard. Garant obligatoire.","payout_order_mode":"manual"}', TRUE, 'active', NOW() - INTERVAL '90 days'),
  ('20000000-0000-0000-0000-000000000002', 'Solidarite Bobo', 'Tontine hebdomadaire des artisanes de Bobo-Dioulasso.', '10000000-0000-0000-0000-000000000006', 5000, 'XOF', 'weekly', CURRENT_DATE - INTERVAL '45 days', 15, '{"internal_rules":"Cotisation chaque samedi avant 18h.","payout_order_mode":"automatic"}', FALSE, 'active', NOW() - INTERVAL '45 days'),
  ('20000000-0000-0000-0000-000000000003', 'Espoir du Gulmu', 'Tontine d''epargne communautaire a Fada N''Gourma.', '10000000-0000-0000-0000-000000000007', 15000, 'XOF', 'monthly', CURRENT_DATE + INTERVAL '10 days', 12, '{"internal_rules":"Validation des membres par vote simple.","payout_order_mode":"manual"}', FALSE, 'draft', NOW() - INTERVAL '12 days')
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, description = EXCLUDED.description, status = EXCLUDED.status;

INSERT INTO tontine_members (id, tontine_id, user_id, member_number, payout_position, joined_at, validated_at, role, status)
VALUES
  ('30000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000002', 1, 1, NOW() - INTERVAL '88 days', NOW() - INTERVAL '88 days', 'administrator', 'current_beneficiary'),
  ('30000000-0000-0000-0000-000000000002', '20000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000003', 2, 2, NOW() - INTERVAL '85 days', NOW() - INTERVAL '85 days', 'treasurer', 'next_beneficiary'),
  ('30000000-0000-0000-0000-000000000003', '20000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000004', 3, 3, NOW() - INTERVAL '80 days', NOW() - INTERVAL '80 days', 'member', 'late'),
  ('30000000-0000-0000-0000-000000000004', '20000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000005', 4, 4, NOW() - INTERVAL '70 days', NOW() - INTERVAL '70 days', 'member', 'up_to_date'),
  ('30000000-0000-0000-0000-000000000005', '20000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000006', 1, 1, NOW() - INTERVAL '42 days', NOW() - INTERVAL '42 days', 'administrator', 'up_to_date'),
  ('30000000-0000-0000-0000-000000000006', '20000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000008', 2, 2, NOW() - INTERVAL '40 days', NOW() - INTERVAL '40 days', 'member', 'up_to_date'),
  ('30000000-0000-0000-0000-000000000007', '20000000-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000007', 1, 1, NOW() - INTERVAL '10 days', NOW() - INTERVAL '10 days', 'administrator', 'pending')
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, role = EXCLUDED.role;

INSERT INTO guarantors (id, tontine_id, member_id, guarantor_user_id, relationship, guarantee_limit, accepted_at, status)
VALUES
  ('40000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000006', 'Oncle', 30000, NOW() - INTERVAL '80 days', 'called'),
  ('40000000-0000-0000-0000-000000000002', '20000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000004', '10000000-0000-0000-0000-000000000003', 'Amie', 20000, NOW() - INTERVAL '70 days', 'accepted'),
  ('40000000-0000-0000-0000-000000000003', '20000000-0000-0000-0000-000000000002', '30000000-0000-0000-0000-000000000006', '10000000-0000-0000-0000-000000000002', 'Cousin', 15000, NOW() - INTERVAL '40 days', 'accepted')
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status;

INSERT INTO contributions (id, tontine_id, member_id, cycle_number, due_date, paid_at, amount_due, amount_paid, payment_method, transaction_reference, receipt_url, status)
VALUES
  ('50000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000001', 1, CURRENT_DATE - INTERVAL '60 days', NOW() - INTERVAL '60 days', 10000, 10000, 'preuve_manuelle', 'REC-WP-001', '/demo/receipts/wp-001.jpg', 'paid'),
  ('50000000-0000-0000-0000-000000000002', '20000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000002', 1, CURRENT_DATE - INTERVAL '60 days', NOW() - INTERVAL '59 days', 10000, 10000, 'preuve_manuelle', 'REC-WP-002', '/demo/receipts/wp-002.jpg', 'paid'),
  ('50000000-0000-0000-0000-000000000003', '20000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000003', 3, CURRENT_DATE - INTERVAL '6 days', NULL, 10000, 0, NULL, NULL, NULL, 'late'),
  ('50000000-0000-0000-0000-000000000004', '20000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000004', 3, CURRENT_DATE + INTERVAL '7 days', NULL, 10000, 0, NULL, NULL, NULL, 'pending'),
  ('50000000-0000-0000-0000-000000000005', '20000000-0000-0000-0000-000000000002', '30000000-0000-0000-0000-000000000005', 2, CURRENT_DATE - INTERVAL '7 days', NOW() - INTERVAL '7 days', 5000, 5000, 'preuve_manuelle', 'REC-SB-001', '/demo/receipts/sb-001.jpg', 'paid'),
  ('50000000-0000-0000-0000-000000000006', '20000000-0000-0000-0000-000000000002', '30000000-0000-0000-0000-000000000006', 2, CURRENT_DATE + INTERVAL '2 days', NULL, 5000, 0, NULL, NULL, NULL, 'pending')
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, amount_paid = EXCLUDED.amount_paid;

INSERT INTO incidents (id, tontine_id, member_id, contribution_id, guarantor_id, type, severity, title, description, amount, status, resolved_by, resolved_at)
VALUES
  ('60000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000003', '50000000-0000-0000-0000-000000000003', '40000000-0000-0000-0000-000000000001', 'late_payment', 'medium', 'Cotisation en retard', 'Omar Sawadogo n''a pas encore regle le cycle 3.', 10000, 'guarantor_notified', NULL, NULL),
  ('60000000-0000-0000-0000-000000000002', '20000000-0000-0000-0000-000000000002', '30000000-0000-0000-0000-000000000006', NULL, '40000000-0000-0000-0000-000000000003', 'dispute', 'low', 'Discussion sur ordre de passage', 'Le groupe demande une clarification sur le prochain beneficiaire.', NULL, 'resolved', '10000000-0000-0000-0000-000000000006', NOW() - INTERVAL '4 days')
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status;

INSERT INTO community_projects (id, submitted_by, title, description, category, region, city, latitude, longitude, target_amount, collected_amount, currency, status, starts_at, ends_at)
VALUES
  ('70000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000003', 'Forage d''eau potable secteur 12', 'Construire un forage pour 350 habitants qui parcourent plus de deux kilometres pour l''eau.', 'eau', 'Centre', 'Ouagadougou', 12.3714000, -1.5197000, 2500000, 750000, 'XOF', 'approved', CURRENT_DATE - INTERVAL '10 days', CURRENT_DATE + INTERVAL '80 days'),
  ('70000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000006', 'Lampadaires solaires du marche', 'Installer des lampadaires solaires autour du marche central.', 'energie_solaire', 'Hauts-Bassins', 'Bobo-Dioulasso', 11.1771000, -4.2979000, 1800000, 250000, 'XOF', 'pending', NULL, NULL),
  ('70000000-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000005', 'Rehabilitation piste maraichere', 'Reparer une piste rurale pour faciliter l''acces des producteurs au marche.', 'route', 'Nord', 'Ouahigouya', 13.5828000, -2.4216000, 4200000, 0, 'XOF', 'rejected', NULL, NULL),
  ('70000000-0000-0000-0000-000000000004', '10000000-0000-0000-0000-000000000007', 'Point sante mobile', 'Equiper une equipe mobile pour le suivi sanitaire des quartiers peripheriques.', 'sante', 'Est', 'Fada N''Gourma', 12.0616000, 0.3586000, 3200000, 0, 'XOF', 'approved', CURRENT_DATE, CURRENT_DATE + INTERVAL '120 days')
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, collected_amount = EXCLUDED.collected_amount;

INSERT INTO project_images (id, project_id, uploaded_by, image_url, caption, type, verification_status, taken_at, latitude, longitude)
VALUES
  ('71000000-0000-0000-0000-000000000001', '70000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000003', 'https://images.unsplash.com/photo-1541544741938-0af808871cc0?q=80&w=900&auto=format&fit=crop', 'Zone cible du forage', 'cover', 'verified', NOW() - INTERVAL '15 days', 12.3714000, -1.5197000),
  ('71000000-0000-0000-0000-000000000002', '70000000-0000-0000-0000-000000000004', '10000000-0000-0000-0000-000000000007', 'https://images.unsplash.com/photo-1584515933487-779824d29309?q=80&w=900&auto=format&fit=crop', 'Consultation mobile', 'cover', 'verified', NOW() - INTERVAL '8 days', 12.0616000, 0.3586000)
ON CONFLICT (id) DO UPDATE SET verification_status = EXCLUDED.verification_status;

INSERT INTO votes (id, tontine_id, community_project_id, created_by, title, description, type, status, opens_at, closes_at, quorum_percentage, allow_multiple_choices)
VALUES
  ('80000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001', NULL, '10000000-0000-0000-0000-000000000002', 'Validation des regles Wend-Panga', 'Confirmer les penalites et le garant obligatoire.', 'rule_validation', 'open', NOW() - INTERVAL '2 days', NOW() + INTERVAL '5 days', 60, FALSE),
  ('80000000-0000-0000-0000-000000000002', '20000000-0000-0000-0000-000000000001', '70000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000003', 'Soutenir le forage secteur 12', 'Choisir si la tontine affecte une partie du fonds solidaire au forage.', 'community_project', 'open', NOW() - INTERVAL '1 day', NOW() + INTERVAL '7 days', 50, FALSE),
  ('80000000-0000-0000-0000-000000000003', '20000000-0000-0000-0000-000000000002', NULL, '10000000-0000-0000-0000-000000000006', 'Ordre de passage Solidarite Bobo', 'Valider l''ordre automatique propose par FasoTontine.', 'payout_order', 'closed', NOW() - INTERVAL '20 days', NOW() - INTERVAL '15 days', 50, FALSE)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status;

UPDATE community_projects SET vote_id = '80000000-0000-0000-0000-000000000002' WHERE id = '70000000-0000-0000-0000-000000000001';

INSERT INTO vote_options (id, vote_id, label, description, position)
VALUES
  ('81000000-0000-0000-0000-000000000001', '80000000-0000-0000-0000-000000000001', 'J''approuve', 'Les regles sont acceptees.', 0),
  ('81000000-0000-0000-0000-000000000002', '80000000-0000-0000-0000-000000000001', 'Je refuse', 'Les regles doivent etre revues.', 1),
  ('81000000-0000-0000-0000-000000000003', '80000000-0000-0000-0000-000000000002', 'Soutenir le forage', 'Affecter une partie du fonds solidaire.', 0),
  ('81000000-0000-0000-0000-000000000004', '80000000-0000-0000-0000-000000000002', 'Reporter la decision', 'Attendre un devis complementaire.', 1),
  ('81000000-0000-0000-0000-000000000005', '80000000-0000-0000-0000-000000000003', 'Ordre accepte', NULL, 0),
  ('81000000-0000-0000-0000-000000000006', '80000000-0000-0000-0000-000000000003', 'Ordre refuse', NULL, 1)
ON CONFLICT (id) DO UPDATE SET label = EXCLUDED.label;

INSERT INTO vote_responses (id, vote_id, option_id, voter_id, tontine_member_id, comment, voted_at)
VALUES
  ('82000000-0000-0000-0000-000000000001', '80000000-0000-0000-0000-000000000001', '81000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000003', '30000000-0000-0000-0000-000000000002', 'Regles claires.', NOW() - INTERVAL '1 day'),
  ('82000000-0000-0000-0000-000000000002', '80000000-0000-0000-0000-000000000001', '81000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000004', '30000000-0000-0000-0000-000000000003', NULL, NOW() - INTERVAL '20 hours'),
  ('82000000-0000-0000-0000-000000000003', '80000000-0000-0000-0000-000000000002', '81000000-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000002', '30000000-0000-0000-0000-000000000001', 'Projet utile au quartier.', NOW() - INTERVAL '12 hours'),
  ('82000000-0000-0000-0000-000000000004', '80000000-0000-0000-0000-000000000003', '81000000-0000-0000-0000-000000000005', '10000000-0000-0000-0000-000000000008', '30000000-0000-0000-0000-000000000006', NULL, NOW() - INTERVAL '18 days')
ON CONFLICT (id) DO NOTHING;

INSERT INTO notifications (id, user_id, tontine_id, project_id, type, title, message, channel, payload, status, read_at, sent_at)
VALUES
  ('90000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000004', '20000000-0000-0000-0000-000000000001', NULL, 'late_payment', 'Paiement en retard', 'Votre cotisation du cycle 3 est en retard.', 'in_app', '{"contribution_id":"50000000-0000-0000-0000-000000000003"}', 'unread', NULL, NOW() - INTERVAL '5 days'),
  ('90000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000006', '20000000-0000-0000-0000-000000000001', NULL, 'guarantor_called', 'Garant sollicite', 'Vous etes sollicite pour une dette en retard.', 'in_app', '{"incident_id":"60000000-0000-0000-0000-000000000001"}', 'unread', NULL, NOW() - INTERVAL '4 days'),
  ('90000000-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000003', '20000000-0000-0000-0000-000000000001', NULL, 'new_vote', 'Nouveau vote', 'Vote ouvert pour les regles Wend-Panga.', 'in_app', '{"vote_id":"80000000-0000-0000-0000-000000000001"}', 'read', NOW() - INTERVAL '1 day', NOW() - INTERVAL '2 days'),
  ('90000000-0000-0000-0000-000000000004', '10000000-0000-0000-0000-000000000003', NULL, '70000000-0000-0000-0000-000000000001', 'project_approved', 'Projet valide', 'Votre projet de forage est visible publiquement.', 'in_app', '{"project_id":"70000000-0000-0000-0000-000000000001"}', 'unread', NULL, NOW() - INTERVAL '6 days'),
  ('90000000-0000-0000-0000-000000000005', '10000000-0000-0000-0000-000000000003', '20000000-0000-0000-0000-000000000001', NULL, 'next_beneficiary', 'Prochain beneficiaire', 'Vous etes le prochain beneficiaire du cycle Wend-Panga.', 'in_app', '{"member_id":"30000000-0000-0000-0000-000000000002"}', 'unread', NULL, NOW() - INTERVAL '1 day'),
  ('90000000-0000-0000-0000-000000000006', '10000000-0000-0000-0000-000000000005', '20000000-0000-0000-0000-000000000001', NULL, 'member_added', 'Membre ajoute', 'Vous avez ete ajoute a la tontine Wend-Panga.', 'in_app', '{"tontine_id":"20000000-0000-0000-0000-000000000001"}', 'read', NOW() - INTERVAL '60 days', NOW() - INTERVAL '70 days')
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, read_at = EXCLUDED.read_at;

INSERT INTO admin_actions (id, admin_id, target_user_id, tontine_id, project_id, action, reason, metadata)
VALUES
  ('91000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000003', NULL, '70000000-0000-0000-0000-000000000001', 'community_project_approved', 'Projet prioritaire et dossier complet.', '{"reviewed_by":"demo_seed"}'),
  ('91000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000004', '20000000-0000-0000-0000-000000000001', NULL, 'guarantor_called', 'Cotisation cycle 3 en retard.', '{"incident_id":"60000000-0000-0000-0000-000000000001"}'),
  ('91000000-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000005', NULL, '70000000-0000-0000-0000-000000000003', 'community_project_rejected', 'Devis incomplet.', '{"reviewed_by":"demo_seed"}')
ON CONFLICT (id) DO UPDATE SET action = EXCLUDED.action, reason = EXCLUDED.reason;
