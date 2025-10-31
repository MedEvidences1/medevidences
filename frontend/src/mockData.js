// Mock data for gut microbiome calculator

export const calculateGutScore = (formData) => {
  let score = 0;
  let maxScore = 100;
  
  // Fiber consumption (0-10 points)
  const fiberPoints = {
    'little': 3,
    'medium': 6,
    'much': 10
  };
  score += fiberPoints[formData.fiber] || 0;
  
  // Fat type (0-10 points)
  const fatPoints = {
    'saturated': 3,
    'unsaturated': 10
  };
  score += fatPoints[formData.fatType] || 0;
  
  // Fruits servings (0-8 points)
  const fruitsPoints = {
    '0-1': 2,
    '2-3': 5,
    '>3': 8
  };
  score += fruitsPoints[formData.fruits] || 0;
  
  // Vegetables servings (0-8 points)
  const vegetablesPoints = {
    '0-1': 2,
    '2-3': 5,
    '>3': 8
  };
  score += vegetablesPoints[formData.vegetables] || 0;
  
  // Sugar consumption (0-8 points, inverse scoring)
  const sugarPoints = {
    'low': 8,
    'medium': 4,
    'high': 1
  };
  score += sugarPoints[formData.sugar] || 0;
  
  // Processed food (0-7 points, inverse scoring)
  const processedPoints = {
    'barely': 7,
    'few': 4,
    'everyday': 1
  };
  score += processedPoints[formData.processedFood] || 0;
  
  // Fermented food (0-7 points)
  const fermentedPoints = {
    'barely': 2,
    'few': 5,
    'everyday': 7
  };
  score += fermentedPoints[formData.fermentedFood] || 0;
  
  // NSAIDs (0-6 points, inverse scoring)
  const nsaidPoints = {
    'special': 6,
    'monthly': 3,
    'daily': 1
  };
  score += nsaidPoints[formData.nsaids] || 0;
  
  // Alcohol (0-6 points, inverse scoring)
  const alcoholPoints = {
    'none': 6,
    'monthly': 4,
    'weekly': 2
  };
  score += alcoholPoints[formData.alcohol] || 0;
  
  // Water intake (0-8 points)
  const waterPoints = {
    'low': 3,
    'medium': 6,
    'high': 8
  };
  score += waterPoints[formData.water] || 0;
  
  // Physical activity (0-8 points)
  const activityPoints = {
    'none': 2,
    'few': 5,
    'everyday': 8
  };
  score += activityPoints[formData.activity] || 0;
  
  // Additional checkboxes (0-14 points)
  if (formData.goodSleep) score += 6;
  if (!formData.stressed) score += 4;
  if (!formData.smoker) score += 4;
  if (!formData.antibiotics) score += 3;
  if (formData.probiotics) score += 3;
  
  // Calculate category scores
  const dietScore = Math.round(
    ((fiberPoints[formData.fiber] || 0) / 10 +
    (fatPoints[formData.fatType] || 0) / 10 +
    (fruitsPoints[formData.fruits] || 0) / 8 +
    (vegetablesPoints[formData.vegetables] || 0) / 8 +
    (sugarPoints[formData.sugar] || 0) / 8 +
    (processedPoints[formData.processedFood] || 0) / 7 +
    (fermentedPoints[formData.fermentedFood] || 0) / 7) / 7 * 100
  );
  
  const lifestyleScore = Math.round(
    ((waterPoints[formData.water] || 0) / 8 +
    (activityPoints[formData.activity] || 0) / 8 +
    (formData.goodSleep ? 1 : 0) +
    (!formData.stressed ? 1 : 0) +
    (!formData.smoker ? 1 : 0)) / 5 * 100
  );
  
  const medicationScore = Math.round(
    ((nsaidPoints[formData.nsaids] || 0) / 6 +
    (alcoholPoints[formData.alcohol] || 0) / 6 +
    (!formData.antibiotics ? 1 : 0) +
    (formData.probiotics ? 1 : 0)) / 4 * 100
  );
  
  return {
    totalScore: score,
    dietScore,
    lifestyleScore,
    medicationScore,
    recommendations: generateRecommendations(formData, score)
  };
};

const generateRecommendations = (formData, score) => {
  const recommendations = [];
  
  if (formData.fiber === 'little') {
    recommendations.push({
      category: 'Diet',
      issue: 'Low fiber intake',
      suggestion: 'Increase fiber consumption to 25-35g daily through whole grains, legumes, fruits, and vegetables.',
      priority: 'high'
    });
  }
  
  if (formData.fatType === 'saturated') {
    recommendations.push({
      category: 'Diet',
      issue: 'High saturated fat intake',
      suggestion: 'Switch to unsaturated fats like olive oil, avocados, nuts, and fatty fish rich in omega-3.',
      priority: 'high'
    });
  }
  
  if (formData.fruits === '0-1') {
    recommendations.push({
      category: 'Diet',
      issue: 'Insufficient fruit consumption',
      suggestion: 'Aim for at least 2-3 servings of diverse fruits daily to support beneficial bacteria.',
      priority: 'medium'
    });
  }
  
  if (formData.vegetables === '0-1') {
    recommendations.push({
      category: 'Diet',
      issue: 'Low vegetable intake',
      suggestion: 'Increase vegetable consumption to 3+ servings daily for optimal gut health.',
      priority: 'medium'
    });
  }
  
  if (formData.sugar === 'high') {
    recommendations.push({
      category: 'Diet',
      issue: 'High sugar intake',
      suggestion: 'Reduce sugar consumption to less than 3 tablespoons daily to prevent harmful bacteria growth.',
      priority: 'high'
    });
  }
  
  if (formData.processedFood === 'everyday') {
    recommendations.push({
      category: 'Diet',
      issue: 'Frequent processed food consumption',
      suggestion: 'Minimize processed foods and focus on whole, natural foods.',
      priority: 'high'
    });
  }
  
  if (formData.fermentedFood === 'barely') {
    recommendations.push({
      category: 'Diet',
      issue: 'Low probiotic food intake',
      suggestion: 'Include fermented foods like yogurt, kefir, sauerkraut, or kimchi several times per week.',
      priority: 'medium'
    });
  }
  
  if (formData.water === 'low') {
    recommendations.push({
      category: 'Lifestyle',
      issue: 'Insufficient hydration',
      suggestion: 'Drink 8-10 cups of water daily to support digestion and gut bacteria.',
      priority: 'high'
    });
  }
  
  if (formData.activity === 'none') {
    recommendations.push({
      category: 'Lifestyle',
      issue: 'Lack of physical activity',
      suggestion: 'Engage in regular exercise at least 3-4 times per week to improve gut diversity.',
      priority: 'medium'
    });
  }
  
  if (!formData.goodSleep) {
    recommendations.push({
      category: 'Lifestyle',
      issue: 'Poor sleep quality',
      suggestion: 'Aim for 7-9 hours of quality sleep each night to support gut health.',
      priority: 'medium'
    });
  }
  
  if (formData.stressed) {
    recommendations.push({
      category: 'Lifestyle',
      issue: 'Chronic stress',
      suggestion: 'Practice stress management techniques like meditation, yoga, or deep breathing exercises.',
      priority: 'high'
    });
  }
  
  if (formData.smoker) {
    recommendations.push({
      category: 'Lifestyle',
      issue: 'Smoking/nicotine use',
      suggestion: 'Quit smoking to restore gut barrier function and improve microbiome diversity.',
      priority: 'high'
    });
  }
  
  if (formData.nsaids === 'daily') {
    recommendations.push({
      category: 'Medication',
      issue: 'Frequent NSAID use',
      suggestion: 'Consult your doctor about alternative pain management to reduce gut irritation.',
      priority: 'medium'
    });
  }
  
  if (formData.alcohol === 'weekly') {
    recommendations.push({
      category: 'Medication',
      issue: 'Regular alcohol consumption',
      suggestion: 'Reduce alcohol intake to occasional use or eliminate completely for better gut health.',
      priority: 'medium'
    });
  }
  
  if (formData.antibiotics) {
    recommendations.push({
      category: 'Medication',
      issue: 'Chronic antibiotic use',
      suggestion: 'Discuss with your doctor about probiotic supplementation during and after antibiotic treatment.',
      priority: 'high'
    });
  }
  
  if (!formData.probiotics && score < 70) {
    recommendations.push({
      category: 'Medication',
      issue: 'No probiotic supplementation',
      suggestion: 'Consider adding a high-quality probiotic supplement to support gut bacteria diversity.',
      priority: 'low'
    });
  }
  
  return recommendations;
};

export const educationalContent = [
  {
    id: 1,
    title: 'What is the Gut Microbiome?',
    icon: 'microscope',
    content: 'Your gut microbiome is a vibrant community of trillions of microorganisms living in your digestive system. These tiny residents outnumber your own cells and play crucial roles in digestion, immunity, and overall health.',
    expandedContent: 'The gut microbiome consists of bacteria, viruses, fungi, and other microorganisms. The number of bacterial cells in your gut even exceeds the number of your own cells! While we often associate bacteria with illness, your gut bacteria are actually some of your greatest allies.'
  },
  {
    id: 2,
    title: 'Why Gut Health Matters',
    icon: 'heart',
    content: 'Your gut is often called the "second brain" because it produces neurotransmitters like serotonin and dopamine. A healthy microbiome supports immunity, metabolism, mental health, and disease prevention.',
    expandedContent: 'Your gut bacteria help control metabolism, determine how well you fight off infections, and influence your risk of developing certain diseases including cancer. They produce vital substances called metabolites that regulate fat burning, sugar metabolism, inflammation control, and immune cell maturation.'
  },
  {
    id: 3,
    title: 'Short-Chain Fatty Acids (SCFAs)',
    icon: 'molecule',
    content: 'Gut bacteria produce SCFAs from dietary fiber. These powerful compounds fuel healthy colon cells, regulate metabolism and immune function, and possess anti-cancer and anti-inflammatory properties.',
    expandedContent: 'SCFAs power our healthy colon cells and selectively suppress cancerous cells. They regulate the activity of genes related to metabolism and immune function, control appetite, and travel through the bloodstream to other organs like the pancreas, liver, fat tissue, and muscles.'
  },
  {
    id: 4,
    title: 'The Dangers of Gut Imbalance',
    icon: 'warning',
    content: 'When harmful bacteria outnumber beneficial ones (dysbiosis), your gut barrier weakens, leading to chronic inflammation. This can contribute to heart disease, diabetes, cancer, liver disease, and neurological disorders.',
    expandedContent: 'Bad bacteria produce harmful substances and cell wall components like lipopolysaccharides that trigger inflammation. As these enter the bloodstream, they cause low-grade chronic inflammation throughout the body, disrupting immune function and metabolism across multiple organs.'
  },
  {
    id: 5,
    title: 'Foods That Heal Your Gut',
    icon: 'apple',
    content: 'Feed your beneficial bacteria with fiber-rich foods, fermented foods, omega-3 fatty acids, and plenty of fruits and vegetables. These provide the nutrients your microbiome needs to thrive.',
    expandedContent: 'Focus on whole grains, legumes, nuts, seeds, olive oil, fatty fish, yogurt, kefir, sauerkraut, and kimchi. These foods provide fiber (the primary food for good bacteria), natural probiotics, beneficial metabolites, and anti-inflammatory compounds. Stay well-hydrated with water to support digestion.'
  },
  {
    id: 6,
    title: 'Foods That Harm Your Gut',
    icon: 'warning-triangle',
    content: 'Minimize sugar, saturated fats, processed foods, artificial additives, and excessive alcohol. These promote harmful bacteria growth and disrupt your microbiome balance.',
    expandedContent: 'Sugar reduces beneficial bacteria populations. Saturated fats promote harmful bacteria growth. Food additives like preservatives, artificial sweeteners, and emulsifiers can significantly disrupt your gut microbiome. Alcohol irritates the gut lining and causes bacterial imbalances.'
  },
  {
    id: 7,
    title: 'Lifestyle Factors',
    icon: 'activity',
    content: 'Beyond diet, exercise, sleep quality, stress management, and avoiding smoking all significantly impact your gut health. Regular physical activity helps improve digestion and supports beneficial bacteria.',
    expandedContent: 'Exercise produces lactate that bacteria use to create beneficial SCFAs. Good sleep (7-9 hours) supports gut health, while poor sleep increases cortisol and disrupts the microbiome. Chronic stress raises cortisol, causing gut inflammation. Smoking disrupts the gut barrier and should be avoided.'
  },
  {
    id: 8,
    title: 'Medications and Your Gut',
    icon: 'pill',
    content: 'Antibiotics, NSAIDs (like ibuprofen), and other medications can disrupt your gut microbiome. Use them only when necessary and consider probiotic support during treatment.',
    expandedContent: 'Antibiotics kill both harmful and beneficial bacteria, significantly disrupting your microbiome. Use only when medically necessary. NSAIDs can modify your gut bacteria negatively with routine use. Probiotic supplements can help restore balance during and after medication use.'
  }
];
