export const brandKit = {
  company: "GreenLeaf Organics",
  voice: {
    summary: "Warm, honest, and simple. We speak like a friendly neighbour, not a salesperson.",
    rules: [
      { id: "V1", rule: "Use a friendly, conversational tone. Avoid hype words like 'revolutionary', 'miracle', or 'game-changing'." },
      { id: "V2", rule: "Never use ALL CAPS for emphasis or more than one exclamation mark per post." },
      { id: "V3", rule: "Address the reader directly with 'you' and refer to the company as 'we'." },
    ],
  },
  terminology: [
    { id: "T1", use: "plant-based", avoid: ["vegan-friendly", "100% vegan"], note: "Our products are labelled plant-based." },
    { id: "T2", use: "GreenLeaf", avoid: ["Green Leaf", "greenleaf organics inc"], note: "Always one word, capital G and L." },
    { id: "T3", use: "certified organic", avoid: ["totally organic", "pure organic"], note: "Only use 'certified organic' for products with the certification." },
  ],
  approvedFacts: [
    { id: "F1", fact: "Founded in 2018 in Bengaluru." },
    { id: "F2", fact: "Over 40 products, all plant-based." },
    { id: "F3", fact: "Sourced from partner farms in Karnataka and Kerala." },
    { id: "F4", fact: "Packaging is 80% recycled material." },
    { id: "F5", fact: "Rated 4.5 out of 5 by customers on our own website, based on 1,200 reviews." },
  ],
  claimsPolicy: {
    id: "C1",
    rule: "Any claim of being 'number one', 'best', 'cures', or 'guaranteed results', and any statistic or customer count, is not allowed unless an approved fact supports it. Health claims are never allowed.",  },
  visual: {
    palette: [
      { name: "Leaf Green", hex: "#2E7D5B" },
      { name: "Warm Cream", hex: "#FAF5E9" },
      { name: "Sun Orange", hex: "#F2A65A" },
      { name: "Soil Brown", hex: "#5B4636" },
    ],
    minContrastRatio: 4.5,
    logoRule: "The logo must appear in the top-left or bottom-right corner, never stretched, and never recoloured.",
  },
  accessibility: {
    id: "A1",
    rule: "All images need alt text. Text must have a contrast ratio of at least 4.5:1 against its background.",
  },
};