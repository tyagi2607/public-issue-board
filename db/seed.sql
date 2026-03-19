-- ============================================================
-- Seed Data for Public Issue Board
-- ============================================================

-- ── Jurisdictions ──────────────────────────────────────────
INSERT INTO jurisdictions (name, level, country, province) VALUES
-- Federal
('Government of Canada',            'federal',      'Canada', NULL),
-- Provincial
('Province of Ontario',             'provincial',   'Canada', 'Ontario'),
('Province of British Columbia',    'provincial',   'Canada', 'British Columbia'),
('Province of Alberta',             'provincial',   'Canada', 'Alberta'),
('Province of Quebec',              'provincial',   'Canada', 'Quebec'),
-- Municipal
('City of Toronto',                 'municipal',    'Canada', 'Ontario'),
('City of Vancouver',               'municipal',    'Canada', 'British Columbia'),
('City of Calgary',                 'municipal',    'Canada', 'Alberta'),
('City of Edmonton',                'municipal',    'Canada', 'Alberta'),
('City of Montreal',                'municipal',    'Canada', 'Quebec'),
('City of Ottawa',                  'municipal',    'Canada', 'Ontario'),
('City of Mississauga',             'municipal',    'Canada', 'Ontario');

-- ── Government Bodies ──────────────────────────────────────
INSERT INTO government_bodies (name, jurisdiction_id) VALUES
('Transport Canada',                 1),
('Health Canada',                    1),
('Environment and Climate Change Canada', 1),
('Public Safety Canada',             1),
('Ministry of Transportation (ON)',  2),
('Ministry of Health (ON)',          2),
('Ministry of Environment (ON)',     2),
('Ministry of Transportation (BC)',  3),
('Ministry of Health (BC)',          3),
('Toronto Public Works',             6),
('Toronto Public Health',            6),
('Vancouver Public Works',           7),
('City of Calgary Roads',            8);

-- ── Categories ─────────────────────────────────────────────
INSERT INTO categories (name, slug, description, icon, color) VALUES
('Infrastructure',      'infrastructure',   'Roads, bridges, sidewalks, street lights',          '🛣️',  '#EF4444'),
('Healthcare',          'healthcare',       'Hospitals, clinics, mental health services',         '🏥',  '#EC4899'),
('Environment',         'environment',      'Pollution, parks, green spaces, waste management',   '🌱',  '#10B981'),
('Public Safety',       'public-safety',    'Police, fire services, emergency response',          '🚨',  '#F59E0B'),
('Education',           'education',        'Schools, libraries, youth programs',                 '📚',  '#3B82F6'),
('Transportation',      'transportation',   'Public transit, cycling, pedestrian access',         '🚌',  '#8B5CF6'),
('Housing',             'housing',          'Affordable housing, homelessness, social housing',   '🏠',  '#F97316'),
('Utilities',           'utilities',        'Water, electricity, internet, sewage',               '💡',  '#06B6D4'),
('Community Services',  'community',        'Recreation centres, social programs, seniors',       '🤝',  '#84CC16'),
('Governance',          'governance',       'Transparency, accountability, public consultation',  '🏛️',  '#6B7280');
