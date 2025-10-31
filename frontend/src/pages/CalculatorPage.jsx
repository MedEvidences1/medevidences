import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Label } from '../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Checkbox } from '../components/ui/checkbox';
import { Badge } from '../components/ui/badge';
import { Separator } from '../components/ui/separator';
import { calculateGutScore } from '../mockData';
import ResultsDisplay from '../components/ResultsDisplay';
import EducationalContent from '../components/EducationalContent';
import { Activity, Apple, Droplet, Heart, Pill, Salad, Moon, CloudOff, Cigarette, Shield } from 'lucide-react';

const CalculatorPage = () => {
  const [formData, setFormData] = useState({
    fiber: '',
    fatType: '',
    fruits: '',
    vegetables: '',
    sugar: '',
    processedFood: '',
    fermentedFood: '',
    nsaids: '',
    alcohol: '',
    water: '',
    activity: '',
    goodSleep: false,
    stressed: false,
    smoker: false,
    antibiotics: false,
    probiotics: false
  });

  const [results, setResults] = useState(null);
  const [showResults, setShowResults] = useState(false);

  const handleSelectChange = (name, value) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleCheckboxChange = (name, checked) => {
    setFormData(prev => ({ ...prev, [name]: checked }));
  };

  const handleCalculate = () => {
    const calculatedResults = calculateGutScore(formData);
    setResults(calculatedResults);
    setShowResults(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleReset = () => {
    setFormData({
      fiber: '',
      fatType: '',
      fruits: '',
      vegetables: '',
      sugar: '',
      processedFood: '',
      fermentedFood: '',
      nsaids: '',
      alcohol: '',
      water: '',
      activity: '',
      goodSleep: false,
      stressed: false,
      smoker: false,
      antibiotics: false,
      probiotics: false
    });
    setResults(null);
    setShowResults(false);
  };

  const isFormComplete = () => {
    return formData.fiber && formData.fatType && formData.fruits && 
           formData.vegetables && formData.sugar && formData.processedFood && 
           formData.fermentedFood && formData.nsaids && formData.alcohol && 
           formData.water && formData.activity;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white py-16 px-4">
        <div className="max-w-6xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full mb-6">
            <Activity className="w-5 h-5" />
            <span className="text-sm font-medium">Science-Based Assessment</span>
          </div>
          <h1 className="text-5xl font-bold mb-4">Gut Microbiome Score Calculator</h1>
          <p className="text-xl text-emerald-50 max-w-3xl mx-auto">
            Discover how your daily habits affect your gut health. Get personalized insights and actionable recommendations to improve your microbiome.
          </p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-12">
        {showResults && results ? (
          <ResultsDisplay results={results} onReset={handleReset} formData={formData} />
        ) : (
          <div className="space-y-8">
            {/* Calculator Form */}
            <Card className="shadow-lg border-emerald-100">
              <CardHeader className="bg-gradient-to-r from-emerald-50 to-teal-50 border-b border-emerald-100">
                <CardTitle className="text-2xl text-emerald-900">Your Health Assessment</CardTitle>
                <CardDescription className="text-emerald-700">
                  Answer all questions to calculate your gut microbiome score
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6 space-y-8">
                {/* Diet Section */}
                <div className="space-y-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
                      <Salad className="w-5 h-5 text-emerald-600" />
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900">Dietary Habits</h3>
                  </div>

                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="fiber" className="text-base font-medium">Fiber Consumption Daily</Label>
                      <Select value={formData.fiber} onValueChange={(value) => handleSelectChange('fiber', value)}>
                        <SelectTrigger id="fiber" className="h-12">
                          <SelectValue placeholder="Select fiber intake" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="little">Little (&lt;15g)</SelectItem>
                          <SelectItem value="medium">Medium (15-25g)</SelectItem>
                          <SelectItem value="much">Much (25-35g)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="fatType" className="text-base font-medium">Dominant Fat Type in Diet</Label>
                      <Select value={formData.fatType} onValueChange={(value) => handleSelectChange('fatType', value)}>
                        <SelectTrigger id="fatType" className="h-12">
                          <SelectValue placeholder="Select fat type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="saturated">Mainly saturated (butter, cream, cheese)</SelectItem>
                          <SelectItem value="unsaturated">Mainly unsaturated (olive oil, nuts, fish)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="fruits" className="text-base font-medium">Fruit Servings Per Day</Label>
                      <Select value={formData.fruits} onValueChange={(value) => handleSelectChange('fruits', value)}>
                        <SelectTrigger id="fruits" className="h-12">
                          <SelectValue placeholder="Select servings" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="0-1">0-1 serving</SelectItem>
                          <SelectItem value="2-3">2-3 servings</SelectItem>
                          <SelectItem value=">3">&gt;3 servings</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="vegetables" className="text-base font-medium">Vegetable Servings Per Day</Label>
                      <Select value={formData.vegetables} onValueChange={(value) => handleSelectChange('vegetables', value)}>
                        <SelectTrigger id="vegetables" className="h-12">
                          <SelectValue placeholder="Select servings" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="0-1">0-1 serving</SelectItem>
                          <SelectItem value="2-3">2-3 servings</SelectItem>
                          <SelectItem value=">3">&gt;3 servings</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="sugar" className="text-base font-medium">Sugar Consumption (tbsp/day)</Label>
                      <Select value={formData.sugar} onValueChange={(value) => handleSelectChange('sugar', value)}>
                        <SelectTrigger id="sugar" className="h-12">
                          <SelectValue placeholder="Select sugar intake" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="low">&lt;3 tbsp</SelectItem>
                          <SelectItem value="medium">3-5 tbsp</SelectItem>
                          <SelectItem value="high">&ge;6 tbsp</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="processedFood" className="text-base font-medium">Processed Food Consumption</Label>
                      <Select value={formData.processedFood} onValueChange={(value) => handleSelectChange('processedFood', value)}>
                        <SelectTrigger id="processedFood" className="h-12">
                          <SelectValue placeholder="Select frequency" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="barely">I barely do</SelectItem>
                          <SelectItem value="few">Few times a week</SelectItem>
                          <SelectItem value="everyday">Everyday</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="fermentedFood" className="text-base font-medium">Fermented Food Consumption</Label>
                      <Select value={formData.fermentedFood} onValueChange={(value) => handleSelectChange('fermentedFood', value)}>
                        <SelectTrigger id="fermentedFood" className="h-12">
                          <SelectValue placeholder="Select frequency" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="barely">I barely do</SelectItem>
                          <SelectItem value="few">Few times a week</SelectItem>
                          <SelectItem value="everyday">Everyday</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Lifestyle Section */}
                <div className="space-y-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-teal-100 rounded-lg flex items-center justify-center">
                      <Heart className="w-5 h-5 text-teal-600" />
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900">Lifestyle Factors</h3>
                  </div>

                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="water" className="text-base font-medium">Water Intake Per Day</Label>
                      <Select value={formData.water} onValueChange={(value) => handleSelectChange('water', value)}>
                        <SelectTrigger id="water" className="h-12">
                          <SelectValue placeholder="Select water intake" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="low">&lt;4 cups</SelectItem>
                          <SelectItem value="medium">4-9 cups</SelectItem>
                          <SelectItem value="high">10-15 cups</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="activity" className="text-base font-medium">Physical Activity Per Week</Label>
                      <Select value={formData.activity} onValueChange={(value) => handleSelectChange('activity', value)}>
                        <SelectTrigger id="activity" className="h-12">
                          <SelectValue placeholder="Select activity level" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">I don't exercise regularly</SelectItem>
                          <SelectItem value="few">A few times per week</SelectItem>
                          <SelectItem value="everyday">Everyday</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="flex items-center space-x-3 p-4 rounded-lg bg-teal-50 border border-teal-100 hover:bg-teal-100 transition-colors">
                      <Checkbox 
                        id="goodSleep" 
                        checked={formData.goodSleep}
                        onCheckedChange={(checked) => handleCheckboxChange('goodSleep', checked)}
                      />
                      <div className="flex items-center gap-2">
                        <Moon className="w-4 h-4 text-teal-600" />
                        <Label htmlFor="goodSleep" className="cursor-pointer font-medium">
                          I get 7-9 hours of sleep each night
                        </Label>
                      </div>
                    </div>

                    <div className="flex items-center space-x-3 p-4 rounded-lg bg-orange-50 border border-orange-100 hover:bg-orange-100 transition-colors">
                      <Checkbox 
                        id="stressed" 
                        checked={formData.stressed}
                        onCheckedChange={(checked) => handleCheckboxChange('stressed', checked)}
                      />
                      <div className="flex items-center gap-2">
                        <CloudOff className="w-4 h-4 text-orange-600" />
                        <Label htmlFor="stressed" className="cursor-pointer font-medium">
                          I am constantly stressed
                        </Label>
                      </div>
                    </div>

                    <div className="flex items-center space-x-3 p-4 rounded-lg bg-red-50 border border-red-100 hover:bg-red-100 transition-colors">
                      <Checkbox 
                        id="smoker" 
                        checked={formData.smoker}
                        onCheckedChange={(checked) => handleCheckboxChange('smoker', checked)}
                      />
                      <div className="flex items-center gap-2">
                        <Cigarette className="w-4 h-4 text-red-600" />
                        <Label htmlFor="smoker" className="cursor-pointer font-medium">
                          I am a smoker (or use nicotine)
                        </Label>
                      </div>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Medication Section */}
                <div className="space-y-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                      <Pill className="w-5 h-5 text-blue-600" />
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900">Medications & Supplements</h3>
                  </div>

                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="nsaids" className="text-base font-medium">NSAIDs Usage (Ibuprofen, Aspirin)</Label>
                      <Select value={formData.nsaids} onValueChange={(value) => handleSelectChange('nsaids', value)}>
                        <SelectTrigger id="nsaids" className="h-12">
                          <SelectValue placeholder="Select usage frequency" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="special">Only under special circumstances</SelectItem>
                          <SelectItem value="monthly">Every other month</SelectItem>
                          <SelectItem value="daily">Every other day</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="alcohol" className="text-base font-medium">Alcohol Consumption</Label>
                      <Select value={formData.alcohol} onValueChange={(value) => handleSelectChange('alcohol', value)}>
                        <SelectTrigger id="alcohol" className="h-12">
                          <SelectValue placeholder="Select frequency" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">I don't drink alcohol</SelectItem>
                          <SelectItem value="monthly">A few times a month</SelectItem>
                          <SelectItem value="weekly">Every week/several times per week</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="flex items-center space-x-3 p-4 rounded-lg bg-red-50 border border-red-100 hover:bg-red-100 transition-colors">
                      <Checkbox 
                        id="antibiotics" 
                        checked={formData.antibiotics}
                        onCheckedChange={(checked) => handleCheckboxChange('antibiotics', checked)}
                      />
                      <div className="flex items-center gap-2">
                        <Pill className="w-4 h-4 text-red-600" />
                        <Label htmlFor="antibiotics" className="cursor-pointer font-medium">
                          I am often/chronically taking antibiotics
                        </Label>
                      </div>
                    </div>

                    <div className="flex items-center space-x-3 p-4 rounded-lg bg-emerald-50 border border-emerald-100 hover:bg-emerald-100 transition-colors">
                      <Checkbox 
                        id="probiotics" 
                        checked={formData.probiotics}
                        onCheckedChange={(checked) => handleCheckboxChange('probiotics', checked)}
                      />
                      <div className="flex items-center gap-2">
                        <Shield className="w-4 h-4 text-emerald-600" />
                        <Label htmlFor="probiotics" className="cursor-pointer font-medium">
                          I am taking probiotics
                        </Label>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Calculate Button */}
                <div className="pt-6">
                  <Button 
                    onClick={handleCalculate} 
                    disabled={!isFormComplete()}
                    className="w-full h-14 text-lg bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-semibold shadow-lg transition-all duration-300 hover:shadow-xl"
                  >
                    Calculate My Gut Health Score
                  </Button>
                  {!isFormComplete() && (
                    <p className="text-sm text-gray-500 text-center mt-3">
                      Please answer all required questions to calculate your score
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Educational Content */}
            <EducationalContent />
          </div>
        )}
      </div>
    </div>
  );
};

export default CalculatorPage;
