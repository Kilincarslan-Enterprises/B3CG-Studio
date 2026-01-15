import { useState } from 'react';
import { CheckCircle2, XCircle, Copy, AlertTriangle } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Progress } from '../ui/progress';
import { useToast } from '../../hooks/use-toast';
import type { AnalysisData } from '../../types';

interface AnalysisResultsProps {
  analysis?: AnalysisData;
  onTimestampClick?: (timeInSeconds: number) => void;
}

export default function AnalysisResults({
  analysis,
  onTimestampClick,
}: AnalysisResultsProps) {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('overview');

  if (!analysis) {
    return (
      <div className="p-6 bg-slate-900 rounded-lg border border-slate-700">
        <p className="text-slate-400">No analysis data available</p>
      </div>
    );
  }

  const getScoreColor = (score: number) => {
    if (score >= 71) return 'text-green-400';
    if (score >= 41) return 'text-orange-400';
    return 'text-red-400';
  };

  const getScoreGradient = (score: number) => {
    if (score >= 71) return 'from-green-500 to-emerald-500';
    if (score >= 41) return 'from-orange-500 to-amber-500';
    return 'from-red-500 to-rose-500';
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: 'Copied to clipboard',
      duration: 2000,
    });
  };

  const parseTimeRange = (timeRange: string): number => {
    const match = timeRange.match(/(\d+):(\d+)/);
    if (match) {
      const mins = parseInt(match[1] || '0', 10);
      const secs = parseInt(match[2] || '0', 10);
      return mins * 60 + secs;
    }
    return 0;
  };

  return (
    <div className="space-y-6">
      <Card className="bg-gradient-to-br from-slate-900 to-slate-800 border-slate-700">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <h3 className="text-2xl font-bold text-slate-100 mb-2">
                Virality Score
              </h3>
              <p className="text-slate-400 mb-4">
                {analysis.viralityEvaluation.overallVerdict}
              </p>
              <div className="flex items-center gap-3">
                <Badge variant="outline" className="border-blue-400 text-blue-400">
                  {analysis.viralityEvaluation.confidenceLevel} Confidence
                </Badge>
                {analysis.viralityEvaluation.primaryRisk && (
                  <Badge variant="outline" className="border-orange-400 text-orange-400">
                    <AlertTriangle className="w-3 h-3 mr-1" />
                    {analysis.viralityEvaluation.primaryRisk}
                  </Badge>
                )}
              </div>
            </div>
            <div className="flex flex-col items-center">
              <div
                className={`
                  relative w-32 h-32 rounded-full flex items-center justify-center
                  bg-gradient-to-br ${getScoreGradient(analysis.viralityEvaluation.viralityScore)}
                  shadow-lg
                `}
              >
                <div className="absolute inset-2 bg-slate-900 rounded-full flex items-center justify-center">
                  <span
                    className={`text-4xl font-bold ${getScoreColor(
                      analysis.viralityEvaluation.viralityScore
                    )}`}
                  >
                    {analysis.viralityEvaluation.viralityScore}
                  </span>
                </div>
              </div>
              <p className="text-xs text-slate-500 mt-2">out of 100</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-5 bg-slate-900">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="hook">Hook</TabsTrigger>
          <TabsTrigger value="practices">Practices</TabsTrigger>
          <TabsTrigger value="improvements">Improvements</TabsTrigger>
          <TabsTrigger value="suggestions">Suggestions</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4 mt-4">
          <Card className="bg-slate-900 border-slate-700">
            <CardHeader>
              <CardTitle className="text-slate-100">Retention Analysis</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-sm text-slate-400 mb-1">Early Drop-Off Risk</p>
                <p className="text-slate-200">{analysis.retentionAnalysis.earlyDropOffRisk}</p>
              </div>
              <div>
                <p className="text-sm text-slate-400 mb-1">Pacing Quality</p>
                <p className="text-slate-200">{analysis.retentionAnalysis.pacingQuality}</p>
              </div>
              {analysis.retentionAnalysis.structureIssues.length > 0 && (
                <div>
                  <p className="text-sm text-slate-400 mb-2">Structure Issues</p>
                  <ul className="space-y-1">
                    {analysis.retentionAnalysis.structureIssues.map((issue, idx) => (
                      <li key={idx} className="text-sm text-slate-300 flex items-start gap-2">
                        <span className="text-orange-400 mt-1">•</span>
                        <span>{issue}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="bg-slate-900 border-slate-700">
            <CardHeader>
              <CardTitle className="text-slate-100">Loopability</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-2">
                {analysis.loopabilityAnalysis.loopPresent ? (
                  <CheckCircle2 className="w-5 h-5 text-green-400" />
                ) : (
                  <XCircle className="w-5 h-5 text-red-400" />
                )}
                <p className="text-slate-200">
                  {analysis.loopabilityAnalysis.loopPresent
                    ? 'Loop Detected'
                    : 'No Loop Detected'}
                </p>
              </div>
              <div>
                <p className="text-sm text-slate-400 mb-1">Potential</p>
                <p className="text-slate-200">{analysis.loopabilityAnalysis.loopPotential}</p>
              </div>
              <div>
                <p className="text-sm text-slate-400 mb-1">Recommendation</p>
                <p className="text-slate-200">{analysis.loopabilityAnalysis.recommendation}</p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-900 border-slate-700">
            <CardHeader>
              <CardTitle className="text-slate-100">Top 3 Priority Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <ol className="space-y-3">
                {analysis?.output?.topThreePriorityActions && Array.isArray(analysis.output.topThreePriorityActions) ? (
                  analysis.output.topThreePriorityActions.map((action, idx) => (
                    <li key={idx} className="flex gap-3">
                      <span className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-500 text-white text-sm flex items-center justify-center">
                        {idx + 1}
                      </span>
                      <p className="text-slate-200 flex-1">{action}</p>
                    </li>
                  ))
                ) : (
                  <p className="text-slate-400">No priority actions available</p>
                )}
              </ol>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="hook" className="space-y-4 mt-4">
          <Card className="bg-slate-900 border-slate-700">
            <CardHeader>
              <CardTitle className="text-slate-100">Hook Analysis</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm text-slate-400">First 2 Seconds</p>
                  {analysis.hookEvaluation.hookPresentFirst2Seconds ? (
                    <CheckCircle2 className="w-5 h-5 text-green-400" />
                  ) : (
                    <XCircle className="w-5 h-5 text-red-400" />
                  )}
                </div>
                <p className="text-slate-200">
                  {analysis.hookEvaluation.hookPresentFirst2Seconds
                    ? 'Hook present in first 2 seconds'
                    : 'No hook detected in first 2 seconds'}
                </p>
              </div>

              <div>
                <p className="text-sm text-slate-400 mb-2">Hook Strength</p>
                <div className="flex items-center gap-3">
                  <Progress
                    value={
                      analysis.hookEvaluation.hookStrength === 'strong'
                        ? 100
                        : analysis.hookEvaluation.hookStrength === 'moderate'
                        ? 60
                        : 30
                    }
                    className="flex-1"
                  />
                  <Badge
                    variant={
                      analysis.hookEvaluation.hookStrength === 'strong'
                        ? 'default'
                        : 'outline'
                    }
                    className={
                      analysis.hookEvaluation.hookStrength === 'strong'
                        ? 'bg-green-500'
                        : analysis.hookEvaluation.hookStrength === 'moderate'
                        ? 'border-orange-400 text-orange-400'
                        : 'border-red-400 text-red-400'
                    }
                  >
                    {analysis.hookEvaluation.hookStrength.toUpperCase()}
                  </Badge>
                </div>
              </div>

              <div>
                <p className="text-sm text-slate-400 mb-2">Analysis</p>
                <p className="text-slate-200 leading-relaxed">
                  {analysis.hookEvaluation.reasoning}
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="practices" className="space-y-4 mt-4">
          <Card className="bg-slate-900 border-slate-700">
            <CardHeader>
              <CardTitle className="text-slate-100">Best Practices Comparison</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {analysis?.bestPracticeComparison && Array.isArray(analysis.bestPracticeComparison) ? (
                  analysis.bestPracticeComparison.map((practice, idx) => (
                    <div
                      key={idx}
                      className="p-4 bg-slate-800/50 rounded-lg border border-slate-700"
                    >
                      <div className="flex items-start gap-3">
                        {practice.met ? (
                          <CheckCircle2 className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                        ) : (
                          <XCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                        )}
                        <div className="flex-1">
                          <p className="text-slate-200 font-medium mb-1">{practice.practice}</p>
                          <p className="text-sm text-slate-400">{practice.notes}</p>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-slate-400">No practices available</p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="improvements" className="space-y-4 mt-4">
          <Card className="bg-slate-900 border-slate-700">
            <CardHeader>
              <CardTitle className="text-slate-100">Timestamped Improvements</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {analysis?.timestampedImprovements && Array.isArray(analysis.timestampedImprovements) ? (
                  analysis.timestampedImprovements.map((improvement, idx) => (
                    <div
                      key={idx}
                      className="p-4 bg-slate-800/50 rounded-lg border border-slate-700 hover:border-blue-500 transition-colors cursor-pointer"
                      onClick={() => onTimestampClick?.(parseTimeRange(improvement.timeRange))}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <Badge variant="outline" className="border-blue-400 text-blue-400">
                          {improvement.timeRange}
                        </Badge>
                        <Badge
                          variant="outline"
                          className={
                            improvement.expectedImpact.toLowerCase().includes('high')
                              ? 'border-green-400 text-green-400'
                              : improvement.expectedImpact.toLowerCase().includes('medium')
                              ? 'border-orange-400 text-orange-400'
                              : 'border-slate-400 text-slate-400'
                          }
                        >
                          {improvement.expectedImpact}
                        </Badge>
                      </div>
                      <div className="space-y-2">
                        <div>
                          <p className="text-xs text-slate-500 mb-1">Problem</p>
                          <p className="text-sm text-slate-300">{improvement.problem}</p>
                        </div>
                        <div>
                          <p className="text-xs text-slate-500 mb-1">Suggested Change</p>
                          <p className="text-sm text-slate-200">{improvement.suggestedChange}</p>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-slate-400">No improvements available</p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="suggestions" className="space-y-4 mt-4">
          <Card className="bg-slate-900 border-slate-700">
            <CardHeader>
              <CardTitle className="text-slate-100">Hook Alternatives</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {analysis?.safeRewriteSuggestions?.hookAlternatives && Array.isArray(analysis.safeRewriteSuggestions.hookAlternatives) ? (
                  analysis.safeRewriteSuggestions.hookAlternatives.map((hook, idx) => (
                    <div
                      key={idx}
                      className="p-3 bg-slate-800/50 rounded-lg border border-slate-700 flex items-start justify-between gap-3"
                    >
                      <p className="text-slate-200 flex-1">{hook}</p>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard(hook)}
                        className="flex-shrink-0"
                      >
                        <Copy className="w-4 h-4" />
                      </Button>
                    </div>
                  ))
                ) : (
                  <p className="text-slate-400">No hook alternatives available</p>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-900 border-slate-700">
            <CardHeader>
              <CardTitle className="text-slate-100">CTA Suggestions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {analysis?.safeRewriteSuggestions?.ctaSuggestions && Array.isArray(analysis.safeRewriteSuggestions.ctaSuggestions) ? (
                  analysis.safeRewriteSuggestions.ctaSuggestions.map((cta, idx) => (
                    <div
                      key={idx}
                      className="p-3 bg-slate-800/50 rounded-lg border border-slate-700 flex items-start justify-between gap-3"
                    >
                      <p className="text-slate-200 flex-1">{cta}</p>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard(cta)}
                        className="flex-shrink-0"
                      >
                        <Copy className="w-4 h-4" />
                      </Button>
                    </div>
                  ))
                ) : (
                  <p className="text-slate-400">No CTA suggestions available</p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
