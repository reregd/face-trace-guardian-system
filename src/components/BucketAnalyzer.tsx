import React, { useState } from 'react';
import { Button } from './ui/button';
import { Progress } from './ui/progress';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Scan, Database, AlertCircle, CheckCircle } from 'lucide-react';
import { useBucketAnalyzer } from '@/hooks/useBucketAnalyzer';
import { toast } from '@/hooks/use-toast';

interface BucketAnalyzerProps {
  bucketName: string;
}

export function BucketAnalyzer({ bucketName }: BucketAnalyzerProps) {
  const { analyzeBucket, isAnalyzing, progress, error } = useBucketAnalyzer();
  const [lastResult, setLastResult] = useState<any>(null);

  const handleAnalyze = async () => {
    try {
      const result = await analyzeBucket(bucketName);
      setLastResult(result);
      
      toast({
        title: "Analysis Complete",
        description: `Processed ${result.processed} files, found ${result.faces_found} faces`,
      });
    } catch (err) {
      toast({
        title: "Analysis Failed",
        description: err instanceof Error ? err.message : 'Unknown error',
        variant: "destructive"
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="w-5 h-5" />
          Bucket Analysis: {bucketName}
        </CardTitle>
        <CardDescription>
          Analyze all images in the bucket and extract face embeddings for the database
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {isAnalyzing && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Scan className="w-4 h-4 animate-spin" />
              Analyzing images... {Math.round(progress)}%
            </div>
            <Progress value={progress} className="w-full" />
          </div>
        )}

        {error && (
          <div className="flex items-center gap-2 text-sm text-destructive">
            <AlertCircle className="w-4 h-4" />
            {error}
          </div>
        )}

        {lastResult && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm text-green-600">
              <CheckCircle className="w-4 h-4" />
              Last Analysis Results:
            </div>
            <div className="text-sm space-y-1 text-muted-foreground">
              <div>Files processed: {lastResult.processed}</div>
              <div>Faces found: {lastResult.faces_found}</div>
              {lastResult.errors.length > 0 && (
                <div>Errors: {lastResult.errors.length}</div>
              )}
            </div>
          </div>
        )}

        <Button 
          onClick={handleAnalyze} 
          disabled={isAnalyzing}
          className="w-full"
        >
          {isAnalyzing ? (
            <>
              <Scan className="w-4 h-4 mr-2 animate-spin" />
              Analyzing...
            </>
          ) : (
            <>
              <Scan className="w-4 h-4 mr-2" />
              Analyze Bucket
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}