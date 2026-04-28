const SCENE_BASE_MAP = {
  airport: {
    fallback: {
      key: "airport-general",
      src: "https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=900&q=80",
      alt: "Airport terminal with flight displays",
      tip: "Watch for gate, boarding, delay, and rebooking language.",
      label: "Travel support",
    },
    cues: [
      {
        key: "airport-delay",
        match: /\b(delay|late|departure|boarding|gate|terminal)\b/i,
        src: "https://images.unsplash.com/photo-1529074963764-98f45c47344b?w=900&q=80",
        alt: "Airport departure board",
        tip: "Focus on time changes, gate numbers, and boarding steps.",
        label: "Flight update",
      },
      {
        key: "airport-rebook",
        match: /\b(rebook|connection|transfer|next flight|another flight)\b/i,
        src: "https://images.unsplash.com/photo-1483450388369-9ed95738483c?w=900&q=80",
        alt: "Airport traveler with luggage",
        tip: "Listen for connection, next available flight, and seat options.",
        label: "Rebooking",
      },
    ],
  },
  hotel: {
    fallback: {
      key: "hotel-general",
      src: "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=900&q=80",
      alt: "Hotel reception desk",
      tip: "Track reservation, room, and service vocabulary.",
      label: "Front desk",
    },
    cues: [
      {
        key: "hotel-key",
        match: /\b(key|card|room number|checkout)\b/i,
        src: "https://images.unsplash.com/photo-1522798514-97ceb8c4f1c8?w=900&q=80",
        alt: "Hotel room key card",
        tip: "Key phrases here are replacement key, room number, and checkout time.",
        label: "Room access",
      },
    ],
  },
  restaurant: {
    fallback: {
      key: "restaurant-general",
      src: "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=900&q=80",
      alt: "Restaurant table setting",
      tip: "Notice order, menu, and recommendation language.",
      label: "Dining support",
    },
    cues: [
      {
        key: "restaurant-allergy",
        match: /\b(allergy|allergic|nuts?|safe|ingredient)\b/i,
        src: "https://images.unsplash.com/photo-1467003909585-2f8a72700288?w=900&q=80",
        alt: "Plated restaurant meal",
        tip: "Follow allergy warnings, ingredients, and safe substitutions.",
        label: "Allergy check",
      },
    ],
  },
  shopping: {
    fallback: {
      key: "shopping-general",
      src: "https://images.unsplash.com/photo-1483985988355-763728e1935b?w=900&q=80",
      alt: "Retail store interior",
      tip: "Watch for size, price, and product-detail language.",
      label: "Store help",
    },
    cues: [
      {
        key: "shopping-return",
        match: /\b(return|refund|exchange|defect|receipt)\b/i,
        src: "https://images.unsplash.com/photo-1556740749-887f6717d7e4?w=900&q=80",
        alt: "Customer service retail counter",
        tip: "Listen for refund policy, exchange steps, and proof of purchase.",
        label: "Returns desk",
      },
    ],
  },
  hospital: {
    fallback: {
      key: "hospital-general",
      src: "https://images.unsplash.com/photo-1516549655169-df83a0774514?w=900&q=80",
      alt: "Hospital consultation space",
      tip: "Track symptom, timing, and treatment language.",
      label: "Medical consult",
    },
    cues: [
      {
        key: "hospital-symptom",
        match: /\b(headache|pain|dizzy|symptom|treatment|medicine)\b/i,
        src: "https://images.unsplash.com/photo-1584515933487-779824d29309?w=900&q=80",
        alt: "Medical consultation",
        tip: "Key words are symptom, severity, duration, and treatment options.",
        label: "Symptoms",
      },
    ],
  },
  cafe: {
    fallback: {
      key: "cafe-general",
      src: "https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=900&q=80",
      alt: "Cafe interior with coffee bar",
      tip: "Follow drink names, sizes, and milk options.",
      label: "Cafe order",
    },
    cues: [
      {
        key: "cafe-order",
        match: /\b(coffee|latte|milk|pastr|drink|order)\b/i,
        src: "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=900&q=80",
        alt: "Coffee and pastry order",
        tip: "Listen for quantities, milk preferences, and pastry choices.",
        label: "Order details",
      },
    ],
  },
};

export function getSceneAsset(scenarioId) {
  return SCENE_BASE_MAP[scenarioId] || null;
}

export function getDynamicSceneCue(scenarioId, text) {
  const scene = SCENE_BASE_MAP[scenarioId];
  if (!scene) return null;
  const normalizedText = String(text || "");
  const matchedCue = scene.cues?.find((cue) => cue.match.test(normalizedText));
  return matchedCue || scene.fallback || null;
}
