import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { Separator } from './ui/separator';
import { Alert, AlertDescription } from './ui/alert';
import { Share2, Download, RotateCcw, TrendingUp, TrendingDown, Minus, AlertTriangle, CheckCircle2, Info } from 'lucide-react';
import { useToast } from '../hooks/use-toast';

const ResultsDisplay = ({ results, onReset, formData }) => {
  const { toast } = useToast();
  const [showAllRecommendations, setShowAllRecommendations] = useState(false);

  const getScoreColor = (score) => {
    if (score >= 80) return 'text-emerald-600';
    if (score >= 60) return 'text-teal-600';
    if (score >= 40) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBgColor = (score) => {
    if (score >= 80) return 'bg-emerald-500';
    if (score >= 60) return 'bg-teal-500';
    if (score >= 40) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const getScoreLabel = (score) => {
    if (score >= 80) return 'Excellent';
    if (score >= 60) return 'Good';
    if (score >= 40) return 'Fair';
    return 'Needs Improvement';
  };

  const handleShare = () => {
    const shareText = `I scored ${results.totalScore}/100 on my Gut Microbiome Health Assessment! Check your gut health at [Your App URL]`;
    
    if (navigator.share) {
      navigator.share({
        title: 'My Gut Microbiome Score',
        text: shareText,
      }).catch(err => console.log('Error sharing:', err));
    } else {
      navigator.clipboard.writeText(shareText);
      toast({
        title: 'Link copied!',
        description: 'Share text has been copied to your clipboard.',
      });
    }
  };

  const handleSave = () => {
    // This will be connected to backend later
    const resultData = {
      ...results,
      formData,
      timestamp: new Date().toISOString()
    };
    
    // For now, just show a toast
    toast({
      title: 'Results saved!',
      description: 'Your gut health assessment has been saved successfully.',
    });
    
    console.log('Saving results:', resultData);
  };

  const priorityRecommendations = results.recommendations.filter(r => r.priority === 'high');
  const displayRecommendations = showAllRecommendations ? results.recommendations : priorityRecommendations;

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Main Score Card */}
      <Card className="shadow-xl border-2 border-emerald-100 overflow-hidden">
        <div className="bg-gradient-to-r from-emerald-500 to-teal-500 p-8 text-white">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl font-bold mb-2">Your Gut Microbiome Score</h2>
            <p className="text-emerald-50 mb-6">Based on your lifestyle and dietary habits</p>
            
            <div className="inline-flex flex-col items-center">
              <div className="relative">
                <div className="w-48 h-48 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center mb-4">
                  <div className="text-center">
                    <div className={`text-7xl font-bold ${getScoreColor(results.totalScore)} text-white`}>
                      {results.totalScore}
                    </div>
                    <div className="text-2xl text-white/90">/ 100</div>
                  </div>
                </div>
              </div>
              <Badge className="text-lg px-6 py-2 bg-white text-emerald-700 hover:bg-white">
                {getScoreLabel(results.totalScore)}
              </Badge>
            </div>
          </div>
        </div>

        <CardContent className="p-8">
          {/* Category Scores */}
          <div className="grid md:grid-cols-3 gap-6 mb-8">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-gray-700">Diet Score</span>
                <span className={`text-2xl font-bold ${getScoreColor(results.dietScore)}`}>
                  {results.dietScore}%
                </span>
              </div>
              <Progress value={results.dietScore} className="h-3" />
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-gray-700">Lifestyle Score</span>
                <span className={`text-2xl font-bold ${getScoreColor(results.lifestyleScore)}`}>
                  {results.lifestyleScore}%
                </span>
              </div>
              <Progress value={results.lifestyleScore} className="h-3" />
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-gray-700">Medication Score</span>
                <span className={`text-2xl font-bold ${getScoreColor(results.medicationScore)}`}>
                  {results.medicationScore}%
                </span>
              </div>
              <Progress value={results.medicationScore} className="h-3" />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-3 justify-center">
            <Button onClick={handleSave} className="bg-emerald-600 hover:bg-emerald-700">
              <Download className="w-4 h-4 mr-2" />
              Save Results
            </Button>
            <Button onClick={handleShare} variant="outline" className="border-emerald-600 text-emerald-600 hover:bg-emerald-50">
              <Share2 className="w-4 h-4 mr-2" />
              Share Results
            </Button>
            <Button onClick={onReset} variant="outline">
              <RotateCcw className="w-4 h-4 mr-2" />
              Take Again
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Score Interpretation */}
      <Card className="shadow-lg border-blue-100">
        <CardHeader className="bg-gradient-to-r from-blue-50 to-cyan-50">
          <CardTitle className="flex items-center gap-2 text-blue-900">
            <Info className="w-5 h-5" />
            Understanding Your Score
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold mb-3 text-lg">Score Ranges</h4>
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <div className="w-4 h-4 rounded-full bg-emerald-500"></div>
                  <span><strong>80-100:</strong> Excellent gut health</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-4 h-4 rounded-full bg-teal-500"></div>
                  <span><strong>60-79:</strong> Good gut health</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-4 h-4 rounded-full bg-yellow-500"></div>
                  <span><strong>40-59:</strong> Fair, room for improvement</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-4 h-4 rounded-full bg-red-500"></div>
                  <span><strong>Below 40:</strong> Needs significant improvement</span>
                </div>
              </div>
            </div>
            <div>
              <h4 className="font-semibold mb-3 text-lg">What This Means</h4>
              <p className="text-gray-700 leading-relaxed">
                {results.totalScore >= 80 && "Congratulations! You're doing an excellent job maintaining your gut health. Keep up your healthy habits and continue to support your beneficial gut bacteria."}
                {results.totalScore >= 60 && results.totalScore < 80 && "You have a good foundation for gut health! There are still some areas where you can improve to optimize your microbiome and overall wellness."}
                {results.totalScore >= 40 && results.totalScore < 60 && "Your gut health is fair, but there's significant room for improvement. Focus on the recommendations below to enhance your microbiome diversity and function."}
                {results.totalScore < 40 && "Your gut health needs attention. Don't worry - small, consistent changes can make a big difference. Start with the high-priority recommendations below."}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recommendations */}
      <Card className="shadow-lg border-orange-100">
        <CardHeader className="bg-gradient-to-r from-orange-50 to-amber-50">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2 text-orange-900">
                <AlertTriangle className="w-5 h-5" />
                Personalized Recommendations
              </CardTitle>
              <CardDescription className="text-orange-700">
                {priorityRecommendations.length} high-priority improvements identified
              </CardDescription>
            </div>
            {results.recommendations.length > priorityRecommendations.length && (
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setShowAllRecommendations(!showAllRecommendations)}
                className="border-orange-300 text-orange-700 hover:bg-orange-50"
              >
                {showAllRecommendations ? 'Show Priority Only' : `Show All (${results.recommendations.length})`}
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="p-6">
          {displayRecommendations.length === 0 ? (
            <Alert className="bg-emerald-50 border-emerald-200">
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              <AlertDescription className="text-emerald-800">
                Great work! You don't have any high-priority areas to address. Keep maintaining your excellent habits!
              </AlertDescription>
            </Alert>
          ) : (
            <div className="space-y-4">
              {displayRecommendations.map((rec, index) => (
                <div 
                  key={index} 
                  className={`p-4 rounded-lg border-l-4 ${
                    rec.priority === 'high' ? 'bg-red-50 border-red-500' :
                    rec.priority === 'medium' ? 'bg-yellow-50 border-yellow-500' :
                    'bg-blue-50 border-blue-500'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="outline" className="text-xs">
                          {rec.category}
                        </Badge>
                        <Badge className={`text-xs ${
                          rec.priority === 'high' ? 'bg-red-500' :
                          rec.priority === 'medium' ? 'bg-yellow-500' :
                          'bg-blue-500'
                        }`}>
                          {rec.priority} priority
                        </Badge>
                      </div>
                      <h4 className="font-semibold text-gray-900 mb-1">{rec.issue}</h4>
                      <p className="text-gray-700 text-sm leading-relaxed">{rec.suggestion}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Medical Disclaimer */}
      <Alert className="bg-blue-50 border-blue-200">
        <Info className="h-4 w-4 text-blue-600" />
        <AlertDescription className="text-blue-900">
          <strong>Important:</strong> This calculator provides educational insights based on research-backed patterns. 
          It cannot replace professional medical advice. If you have health concerns, please consult with a healthcare provider.
        </AlertDescription>
      </Alert>
    </div>
  );
};

export default ResultsDisplay;
