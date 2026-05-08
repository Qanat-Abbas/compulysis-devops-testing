// frontend/src/utils/assessmentConstants.js

export const LIKERT_SCALE = {
  "Never (0)": 0,
  "Rarely (1)": 1,
  "Sometimes (2)": 2,
  "Often (3)": 3,
  "Always (4)": 4
};

export const GENDER_OPTIONS = ["Male", "Female", "Prefer not to say"];

export const EDUCATION_OPTIONS = [
  "Matric / O-Levels",
  "Intermediate / A-Levels", 
  "Undergraduate",
  "Graduate",
  "Post-Graduate",
  "Other"
];

export const OCD_QUESTIONS = {
  "Contamination_and_Washing": {
    question: "Do you excessively wash or clean due to contamination fears?",
    description: "Concerns about germs, dirt, or contamination leading to repetitive cleaning",
    examples: "Excessive handwashing, avoiding 'contaminated' objects, fear of germs or dirt",
    dimension: "Contamination_and_Washing"
  },
  "Checking_Behavior": {
    question: "Do you repeatedly check things like locks, switches, or appliances?",
    description: "Repetitive checking behaviors to prevent harm or mistakes",
    examples: "Checking locks multiple times, verifying appliances are off, repeatedly asking for reassurance",
    dimension: "Checking_Behavior"
  },
  "Ordering_Symmetry": {
    question: "Do you feel the need to arrange things in a specific order or symmetry?",
    description: "Need for things to be 'just right' or perfectly arranged",
    examples: "Arranging items symmetrically, organizing by specific patterns, need for things to be 'just right'",
    dimension: "Ordering_Symmetry"
  },
  "Hoarding_Collecting": {
    question: "Do you have difficulty discarding items, even useless ones?",
    description: "Difficulty throwing away items due to fear of needing them later",
    examples: "Keeping newspapers, broken items, or seemingly worthless objects, difficulty throwing things away",
    dimension: "Hoarding_Collecting"
  },
  "Intrusive_Thoughts": {
    question: "Do you experience unwanted intrusive thoughts?",
    description: "Unwanted, distressing thoughts that pop into your mind",
    examples: "Violent, sexual, or blasphemous thoughts that cause distress, unwanted aggressive impulses",
    dimension: "Intrusive_Thoughts"
  },
  "Mental_Compulsions_and_Rituals": {
    question: "Do you perform mental rituals (like counting/praying) to reduce anxiety?",
    description: "Internal mental acts performed to neutralize obsessive thoughts",
    examples: "Mental counting, repeating prayers or phrases, mental reviewing, special numbers or words",
    dimension: "Mental_Compulsions_and_Rituals"
  },
  "Avoidance_Behavior": {
    question: "Do you avoid people, places, or things to prevent anxiety or distress?",
    description: "Avoiding situations that trigger obsessive thoughts or compulsions",
    examples: "Avoiding certain numbers, places, or social situations that trigger obsessive thoughts",
    dimension: "Avoidance_Behavior"
  },
  "Emotional_Awareness_and_Insights": {
    question: "Do you recognize that your thoughts/behaviors are excessive or unreasonable?",
    description: "Level of insight into the excessive nature of obsessions/compulsions",
    examples: "Knowing the fears are irrational but feeling unable to stop, awareness of excessive behavior",
    dimension: "Emotional_Awareness_and_Insights"
  },
  "Functioning_Behavior": {
    question: "Have these behaviors affected your daily functioning (school, work, social life)?",
    description: "Impact of symptoms on daily activities and quality of life",
    examples: "Being late due to rituals, avoiding social situations, difficulty completing tasks",
    dimension: "Functioning_Behavior"
  }
};

export const DIMENSIONS = Object.keys(OCD_QUESTIONS);

export const RISK_INTERPRETATIONS = {
  0: {
    level: "Low Risk",
    color: "🟢",
    severity: "low",
    description: "Your responses suggest minimal likelihood of OCD symptoms. Your patterns indicate healthy psychological functioning.",
    recommendations: [
      "💪 Maintain healthy lifestyle and current mental health practices",
      "🧘 Continue stress management techniques and self-care routines",
      "🎯 Stay aware of any changes in behavior patterns or thought processes",
      "💆 Practice mindfulness and maintain work-life balance",
      "📚 Continue education about mental health awareness"
    ],
    clinicalNote: "Low risk assessment indicates good psychological resilience. Maintain preventive care."
  },
  1: {
    level: "Moderate Risk",
    color: "🟡", 
    severity: "moderate",
    description: "Your responses indicate some concerning patterns that warrant attention and monitoring. Early intervention can be very effective.",
    recommendations: [
      "🎯 Monitor symptoms and their impact on daily life activities",
      "📅 Schedule consultation within 2-4 weeks",
      "🧘 Practice stress reduction techniques (meditation, deep breathing, yoga)",
      "📝 Keep a symptom diary to track patterns, triggers, and frequency",
      "👥 Consider joining support groups or therapy sessions",
      "💪 Develop healthy coping mechanisms and routines",
      "🏃 Maintain regular exercise and healthy sleep patterns"
    ],
    clinicalNote: "Moderate risk requires professional evaluation. Consider cognitive behavioral therapy (CBT) or exposure and response prevention (ERP)."
  },
  2: {
    level: "High Risk",
    color: "🔴",
    severity: "high", 
    description: "Your responses suggest significant symptoms that require immediate professional attention.",
    recommendations: [
      "🏥 Seek immediate consultation",
      "📚 Learn about evidence-based treatments (CBT, ERP, medication options)",
      "🆘 If experiencing severe distress or crisis, contact emergency services, healthcare provider, psychiatrist, or crisis helpline",
      "💊 Consider medication evaluation if recommended by psychiatrist",
      "👪 Build a support network of family, friends, and support groups",
      "📋 Referral to OCD specialist or specialized treatment center",
      "🎯 Develop crisis management plan with therapist"
    ],
    clinicalNote: "High risk assessment requires urgent clinical intervention. Comprehensive psychiatric evaluation recommended. Consider intensive outpatient program (IOP) if symptoms are severely impacting functioning.",
    emergencyContacts: {
      pk: "042 3576 5951 - Umang - Pakistan Suicide Prevention Lifeline",
      crisis: "Rozan  - Crisis Text Line - 0304-1111741, National Youth Helpline - 0800-69457",
      international: "Visit IASP.info for international crisis centers"
    }
  }
};

export const getScoreInterpretation = (score) => {
  if (score >= 3) return { level: "High Concern", color: "🔴", class: "risk-high" };
  if (score >= 2) return { level: "Moderate Concern", color: "🟡", class: "risk-moderate" };
  return { level: "Low Concern", color: "🟢", class: "risk-low" };
};

export const calculateTotalScore = (responses) => {
  return Object.values(responses).reduce((sum, score) => sum + score, 0);
};

export const getHighConcernDimensions = (responses) => {
  return Object.entries(responses)
    .filter(([, score]) => score >= 3)
    .map(([dim, score]) => ({
      dimension: OCD_QUESTIONS[dim].description,
      score,
      key: dim
    }));
};

export const getDimensionAnalysis = (responses) => {
  return Object.entries(responses).map(([dim, score]) => {
    const interpretation = getScoreInterpretation(score);
    return {
      dimension: OCD_QUESTIONS[dim].description,
      question: OCD_QUESTIONS[dim].question,
      score,
      maxScore: 4,
      ...interpretation,
      interpretation: score >= 3 
        ? "This area shows significant symptoms that warrant immediate attention."
        : score >= 2
        ? "This area shows some concerning patterns to monitor."
        : "This area shows minimal symptoms."
    };
  });
};