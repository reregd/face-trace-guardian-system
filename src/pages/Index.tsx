import React, { useState, useEffect } from 'react';
import { FaceDetection } from '@/components/FaceDetection';
import { DetectionLog } from '@/components/DetectionLog';
import { ControlPanel } from '@/components/ControlPanel';
import { FileExplorer } from '@/components/FileExplorer';
import { UploadComponent } from '@/components/UploadComponent';
import { BucketAnalyzer } from '@/components/BucketAnalyzer';
import { BucketScanner } from '@/components/BucketScanner';
import { SystemLogs } from '@/components/SystemLogs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Eye, 
  EyeOff, 
  Shield, 
  AlertTriangle,
  Settings,
  Files,
  Upload
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { useDetectionLogs } from '@/hooks/useDetectionLogs';

interface Detection {
  id: string;
  name: string;
  confidence: number;
  timestamp: Date;
  location?: { lat: number; lng: number };
  image: string;
  box: { x: number; y: number; width: number; height: number };
}

const Index = () => {
  const [isActive, setIsActive] = useState(false);
  const [mode, setMode] = useState<'identification' | 'training' | 'stealth'>('identification');
  const [detections, setDetections] = useState<Detection[]>([]);
  const [sessionTime, setSessionTime] = useState(0);
  const [showInterface, setShowInterface] = useState(true);
  const [activeTab, setActiveTab] = useState('detection');

  // Real detection logs from Supabase
  const { logs: realLogs, loading: logsLoading } = useDetectionLogs();

  // Session timer
  useEffect(() => {
    if (!isActive) return;

    const interval = setInterval(() => {
      setSessionTime(prev => prev + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [isActive]);

  // Calculate statistics from both UI detections and real logs
  const matchCount = detections.filter(d => !d.id.startsWith('unknown')).length;
  const totalRealDetections = realLogs.length;
  const realMatchCount = realLogs.filter(log => log.match_status === 'known').length;

  const handleDetection = (detection: Detection) => {
    setDetections(prev => [detection, ...prev]);
    
    // Show toast for new detections
    if (!detection.id.startsWith('unknown')) {
      toast({
        title: "Correspondance Trouvée",
        description: `${detection.name} détecté avec ${(detection.confidence * 100).toFixed(0)}% de confiance`,
      });
    } else if (mode === 'training') {
      toast({
        title: "Nouveau Visage",
        description: "Visage ajouté à la base d'entraînement",
      });
    }
  };

  const handleExport = () => {
    // Create CSV export
    const csvContent = [
      ['ID', 'Nom', 'Confiance', 'Horodatage', 'Latitude', 'Longitude'].join(','),
      ...detections.map(d => [
        d.id,
        d.name,
        (d.confidence * 100).toFixed(2) + '%',
        d.timestamp.toISOString(),
        d.location?.lat || 'N/A',
        d.location?.lng || 'N/A'
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `detections-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);

    toast({
      title: "Export Terminé",
      description: `${detections.length} détections exportées`,
    });
  };

  const handleClear = () => {
    setDetections([]);
    setSessionTime(0);
    toast({
      title: "Journal Effacé",
      description: "Toutes les détections ont été supprimées",
    });
  };

  const toggleInterface = () => {
    setShowInterface(!showInterface);
  };

  if (mode === 'stealth' && !showInterface) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        {/* Stealth Mode - Minimal Interface */}
        <div className="absolute top-4 left-4 z-50">
          <Button
            onClick={toggleInterface}
            variant="stealth"
            size="icon"
            className="opacity-20 hover:opacity-100"
          >
            <Eye className="w-4 h-4" />
          </Button>
        </div>

        <div className="absolute top-4 right-4 z-50 flex gap-2">
          <Badge className="bg-muted/80 text-muted-foreground">
            STEALTH
          </Badge>
          {isActive && (
            <Badge className="bg-accent/80 text-accent-foreground animate-pulse">
              RECORDING
            </Badge>
          )}
        </div>

        {/* Full Screen Camera */}
        <div className="flex-1">
          <FaceDetection
            onDetection={handleDetection}
            isActive={isActive}
            mode={mode}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-3">
            <Shield className="w-8 h-8 text-primary" />
            Système de Reconnaissance Tactique
          </h1>
          
          <div className="flex items-center gap-2">
            {mode === 'stealth' && (
              <Button
                onClick={toggleInterface}
                variant="stealth"
                size="sm"
                className="mr-2"
              >
                <EyeOff className="w-4 h-4 mr-1" />
                Mode Furtif
              </Button>
            )}
            
            <Badge 
              className={`${
                isActive 
                  ? 'bg-accent text-accent-foreground animate-pulse-glow' 
                  : 'bg-muted text-muted-foreground'
              } font-mono`}
            >
              {isActive ? 'OPÉRATIONNEL' : 'EN ATTENTE'}
            </Badge>
          </div>
        </div>

        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <div className={`w-2 h-2 rounded-full ${
              isActive ? 'bg-accent animate-pulse' : 'bg-muted'
            }`} />
            Statut: {isActive ? 'Surveillance Active' : 'Surveillance Inactive'}
          </div>
          <div>Mode: {mode.charAt(0).toUpperCase() + mode.slice(1)}</div>
          <div>{detections.length} détection(s) totales</div>
        </div>
      </div>

      {/* Main Layout with Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="detection">Détection</TabsTrigger>
          <TabsTrigger value="logs">Logs ({totalRealDetections})</TabsTrigger>
          <TabsTrigger value="images">Images</TabsTrigger>
          <TabsTrigger value="analyzer">Analyse</TabsTrigger>
        </TabsList>

        <TabsContent value="detection" className="space-y-0">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-280px)]">
            {/* Camera Feed - Takes most space */}
            <div className="lg:col-span-2 h-full">
              <FaceDetection
                onDetection={handleDetection}
                isActive={isActive}
                mode={mode}
              />
            </div>

            {/* Right Panel - Controls and Log */}
            <div className="space-y-6 h-full flex flex-col">
              {/* Control Panel */}
              <div className="flex-shrink-0">
                <ControlPanel
                  isActive={isActive}
                  onToggleActive={() => setIsActive(!isActive)}
                  mode={mode}
                  onModeChange={setMode}
                  sessionTime={sessionTime}
                  detectionCount={totalRealDetections}
                  matchCount={realMatchCount}
                />
              </div>

              {/* Detection Log */}
              <div className="flex-1 min-h-0">
                <DetectionLog
                  detections={detections}
                  onExport={handleExport}
                  onClear={handleClear}
                />
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="logs" className="space-y-4">
          <div className="h-[calc(100vh-280px)]">
            <Tabs defaultValue="system" className="w-full h-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="system">Logs Système</TabsTrigger>
                <TabsTrigger value="detection">Détections ({totalRealDetections})</TabsTrigger>
              </TabsList>
              
              <TabsContent value="system" className="mt-4 h-[calc(100%-60px)]">
                <SystemLogs />
              </TabsContent>
              
              <TabsContent value="detection" className="mt-4 h-[calc(100%-60px)]">
                {logsLoading ? (
                  <div className="flex items-center justify-center h-full">
                    <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full"></div>
                  </div>
                ) : (
                  <div className="space-y-4 h-full overflow-auto">
                    <h3 className="text-lg font-semibold">Logs de détection en temps réel</h3>
                    <div className="grid gap-4">
                      {realLogs.map((log) => (
                        <div key={log.id} className="p-4 border rounded-lg">
                          <div className="flex items-center justify-between mb-2">
                            <Badge variant={log.match_status === 'known' ? 'default' : 'secondary'}>
                              {log.match_status}
                            </Badge>
                            <span className="text-sm text-muted-foreground">
                              {new Date(log.timestamp).toLocaleString()}
                            </span>
                          </div>
                          <p className="font-medium">Face ID: {log.face_id}</p>
                          {log.confidence && (
                            <p className="text-sm">Confiance: {(log.confidence * 100).toFixed(1)}%</p>
                          )}
                          {log.location && (
                            <p className="text-sm text-muted-foreground">
                              Location: {JSON.parse(log.location).lat?.toFixed(4)}, {JSON.parse(log.location).lng?.toFixed(4)}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </div>
        </TabsContent>

        <TabsContent value="images" className="space-y-4">
          <div className="h-[calc(100vh-280px)]">
            <Tabs defaultValue="files" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="files">Fichiers</TabsTrigger>
                <TabsTrigger value="upload">Upload</TabsTrigger>
              </TabsList>
              <TabsContent value="files" className="mt-4">
                <FileExplorer />
              </TabsContent>
              <TabsContent value="upload" className="mt-4">
                <UploadComponent />
              </TabsContent>
            </Tabs>
          </div>
        </TabsContent>

        <TabsContent value="analyzer" className="space-y-4">
          <div className="h-[calc(100vh-280px)] overflow-auto">
            <div className="space-y-6">
              <BucketScanner />
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                <BucketAnalyzer bucketName="religion" />
                <BucketAnalyzer bucketName="faces_known" />
                <BucketAnalyzer bucketName="faces_unknown" />
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* Mobile Bottom Bar */}
      <div className="lg:hidden fixed bottom-4 left-4 right-4">
        <div className="bg-card/95 backdrop-blur-sm rounded-lg p-4 shadow-tactical border border-border">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button
                onClick={() => setIsActive(!isActive)}
                variant={isActive ? 'danger' : 'tactical'}
                size="sm"
              >
                {isActive ? 'Stop' : 'Start'}
              </Button>
              
              <div className="text-xs">
                <div className="font-mono text-foreground">
                  {detections.length} détections
                </div>
                <div className="text-muted-foreground">
                  {matchCount} correspondances
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {mode === 'stealth' && (
                <Button
                  onClick={toggleInterface}
                  variant="stealth"
                  size="icon"
                >
                  <EyeOff className="w-4 h-4" />
                </Button>
              )}
              
              <Button
                variant="stealth"
                size="icon"
              >
                <Settings className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Warning for Unknown Detections */}
      {detections.filter(d => d.id.startsWith('unknown')).length > 0 && (
        <div className="fixed top-20 right-4 max-w-sm">
          <div className="bg-warning/20 border border-warning text-warning-foreground p-3 rounded-lg shadow-tactical">
            <div className="flex items-center gap-2 mb-1">
              <AlertTriangle className="w-4 h-4" />
              <span className="font-medium">Sujets Non Identifiés</span>
            </div>
            <p className="text-xs">
              {detections.filter(d => d.id.startsWith('unknown')).length} nouveau(x) visage(s) détecté(s)
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default Index;
