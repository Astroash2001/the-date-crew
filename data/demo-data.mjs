/**
 * The Date Crew - Safe Mock Data & Rules Contract
 * Fully sanitized, fictional profiles and rejection notes for pre-send gate demonstration.
 */

export const SEEDED_CLIENT = {
  id: 'client_101',
  name: 'Elena Rostova',
  age: 31,
  city: 'London',
  occupation: 'Architectural Designer',
  active_since: '2026-08-15',
  avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=160&auto=format&fit=crop&q=80',
  confirmed_preferences: [
    {
      id: 'pref_smoke',
      category: 'smoking',
      label: 'Smoking',
      rule: 'Strictly non-smoker (including social/occasional smoking)',
      polarity: 'must_not_have',
      allowed_values: ['non_smoker'],
      disallowed_values: ['social_smoker', 'smoker', 'vaper'],
      hard_soft: 'hard',
      source: 'Onboarding agreement & confirmed feedback'
    },
    {
      id: 'pref_kids',
      category: 'children',
      label: 'Children & Family',
      rule: 'Must want children / open to starting a family',
      polarity: 'must_have',
      allowed_values: ['wants_children', 'open_to_children'],
      disallowed_values: ['does_not_want_children', 'undecided'],
      hard_soft: 'hard',
      source: 'Onboarding interview'
    },
    {
      id: 'pref_loc',
      category: 'location',
      label: 'Geographic Location',
      rule: 'Resident in Greater London, or confirmed willing to relocate to London',
      polarity: 'must_have',
      target_city: 'London',
      allow_relocation_to_target: true,
      hard_soft: 'hard',
      source: 'Onboarding interview'
    },
    {
      id: 'pref_age',
      category: 'age_range',
      label: 'Age Range',
      rule: 'Aged 28 to 37',
      polarity: 'must_have',
      min_age: 28,
      max_age: 37,
      hard_soft: 'hard',
      source: 'Onboarding interview'
    },
    {
      id: 'pref_faith',
      category: 'faith',
      label: 'Faith / Heritage',
      rule: 'Culturally Jewish / receptive to shared traditions',
      polarity: 'must_have',
      preferred_values: ['Jewish', 'Culturally Jewish'],
      hard_soft: 'soft',
      source: 'Client preference notes'
    }
  ],
  past_rejections: [
    {
      id: 'rej_1',
      candidate_name: 'David K.',
      date: '2026-09-12',
      feedback_text: "David was very pleasant and thoughtful, but he mentioned during dinner that he smokes socially on weekends and when out with colleagues. That is an absolute dealbreaker for me—as I highlighted during onboarding, I cannot date a smoker under any circumstances."
    },
    {
      id: 'rej_2',
      candidate_name: 'Marcus T.',
      date: '2026-09-21',
      feedback_text: "Marcus was charming, but he was completely unambiguous about being child-free and having zero desire to ever have kids. Starting a family is non-negotiable for my next serious relationship. Please do not send me any more profiles who do not want children."
    }
  ]
};

export const CANDIDATE_PROFILES = [
  {
    id: 'cand_julian',
    name: 'Julian Vance',
    age: 33,
    city: 'London',
    occupation: 'Creative Director',
    smoking: 'social_smoker',
    children: 'wants_children',
    willing_to_relocate: false,
    faith: 'Agnostic',
    summary: 'Brand designer and weekend cyclist. Enjoys social drinks, gallery hops, and casual weekend cigarettes with friends.',
    expected_status: 'block',
    expected_primary_conflict: 'smoking'
  },
  {
    id: 'cand_liam',
    name: 'Liam Chen',
    age: 35,
    city: 'London',
    occupation: 'Software Engineering Lead',
    smoking: 'non_smoker',
    children: 'does_not_want_children',
    willing_to_relocate: false,
    faith: 'Secular',
    summary: 'Outdoor runner and espresso enthusiast. Firmly embraces a child-free lifestyle with a focus on career and international travel.',
    expected_status: 'block',
    expected_primary_conflict: 'children'
  },
  {
    id: 'cand_lucas',
    name: 'Lucas Silva',
    age: 32,
    city: 'Manchester',
    occupation: 'Product Designer',
    smoking: 'non_smoker',
    children: 'wants_children',
    willing_to_relocate: 'unknown',
    faith: 'Catholic',
    summary: 'Based in Manchester, passionate about industrial design and street photography. Relocation flexibility has not yet been confirmed.',
    expected_status: 'review',
    expected_primary_conflict: 'location'
  },
  {
    id: 'cand_alexander',
    name: 'Alexander Wright',
    age: 34,
    city: 'London',
    occupation: 'Landscape Architect',
    smoking: 'non_smoker',
    children: 'wants_children',
    willing_to_relocate: false,
    faith: 'Jewish',
    summary: 'Specializes in sustainable urban spaces and community gardens. Family-oriented, culturally Jewish, avid home cook.',
    expected_status: 'clear',
    expected_primary_conflict: null
  },
  {
    id: 'cand_sebastian',
    name: 'Sebastian Meyer',
    age: 43,
    city: 'London',
    occupation: 'Financial Analyst',
    smoking: 'non_smoker',
    children: 'wants_children',
    willing_to_relocate: false,
    faith: 'Agnostic',
    summary: 'Classical pianist and marathon runner based in Central London.',
    expected_status: 'block',
    expected_primary_conflict: 'age_range'
  }
];

export const DETERMINISTIC_FALLBACK_ANALYSIS = {
  source: 'fallback',
  provider_label: 'Demo fallback - live AI unavailable',
  model: 'deterministic-rules-extractor-v1',
  analyzed_at: new Date().toISOString(),
  suggestions: [
    {
      id: 'sug_smoke_01',
      category: 'smoking',
      label: 'Smoking Status',
      normalized_preference: 'Strictly non-smoker; no social or occasional smoking permitted',
      polarity: 'must_not_have',
      hard_soft: 'hard',
      evidence_snippet: "he mentioned during dinner that he smokes socially on weekends... That is an absolute dealbreaker for me",
      confidence: 0.98,
      needs_human_confirmation: false,
      client_quote_source: 'David K. rejection feedback'
    },
    {
      id: 'sug_kids_02',
      category: 'children',
      label: 'Desire for Children',
      normalized_preference: 'Must actively want children / open to starting a family',
      polarity: 'must_have',
      hard_soft: 'hard',
      evidence_snippet: "Starting a family is non-negotiable for my next serious relationship. Please do not send me any more profiles who do not want children.",
      confidence: 0.99,
      needs_human_confirmation: false,
      client_quote_source: 'Marcus T. rejection feedback'
    }
  ]
};
