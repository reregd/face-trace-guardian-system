import React from 'react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { 
  Play, 
  Pause, 
  Eye, 
  EyeOff, 
  Settings, 
  Target,
  Brain,
  Shield,
  Activity,
  Timer
} from 'lucide-react';

interface ControlPanelProps {
  isActive: boolean;
  onToggleActive: () => void;
  mode: 'identification' | 'training' | 'stealth';
  onModeChange: (mode: 'identification' | 'training' | 'stealth') => void;
  sessionTime: number;
  detectionCount: number;
  matchCount: number;
}

export function ControlPanel({
  isActive,
  onToggleActive,
  mode,
  onModeChange,
  sessionTime,
  detectionCount,
  matchCount
}: ControlPanelProps) {
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getModeIcon = (m: string) => {
    switch (m) {
      case 'identification': return <Target className="w-4 h-4" />;
      case 'training': return <Brain className="w-4 h-4" />;
      case 'stealth': return <Shield className="w-4 h-4" />;
      default: return <Target className="w-4 h-4" />;
    }
  };

  const getModeColor = (m: string) => {
    switch (m) {
      case 'identification': return 'bg-primary text-primary-foreground';
      case 'training': return 'bg-warning text-warning-foreground';
      case 'stealth': return 'bg-muted text-muted-foreground';
      default: return 'bg-primary text-primary-foreground';
    }
  };

  return (
    <div className="bg-card rounded-lg shadow-tactical p-4 space-y-4">
      {/* Status Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-foreground">Contrôles</h2>
        <Badge className={`${isActive ? 'bg-accent' : 'bg-destructive'} text-xs font-mono`}>
          {isActive ? 'ACTIF' : 'INACTIF'}
        </Badge>
      </div>

      {/* Main Control */}
      <div className="flex flex-col gap-3">
        <Button
          onClick={onToggleActive}
          variant={isActive ? 'danger' : 'tactical'}
          size="tactical"
          className="w-full"
        >
          {isActive ? (
            <>
              <Pause className="w-5 h-5 mr-2" />
              Arrêter la Surveillance
            </>
          ) : (
            <>
              <Play className="w-5 h-5 mr-2" />
              Démarrer la Surveillance
            </>
          )}
        </Button>

        {/* Mode Selection */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">Mode Opérationnel</label>
          <div className="grid grid-cols-1 gap-2">
            {[
              { key: 'identification' as const, label: 'Identification', desc: 'UI visible, reconnaissance active avec journal' },
              { key: 'training' as const, label: 'Entraînement', desc: 'Capture manuelle pour enrichir la base' },
              { key: 'stealth' as const, label: 'Furtif', desc: 'Surveillance silencieuse, pas d\'affichage UI' }
            ].map((modeOption) => (
              <button
                key={modeOption.key}
                onClick={() => onModeChange(modeOption.key)}
                className={`p-3 rounded-lg border text-left transition-all ${
                  mode === modeOption.key
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-border hover:border-primary/50 text-muted-foreground hover:text-foreground'
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  {getModeIcon(modeOption.key)}
                  <span className="font-medium">{modeOption.label}</span>
                  {mode === modeOption.key && (
                    <Badge variant="outline" className="ml-auto text-xs">Actuel</Badge>
                  )}
                </div>
                <p className="text-xs">{modeOption.desc}</p>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Session Statistics */}
      <div className="space-y-3 pt-3 border-t border-border">
        <h3 className="text-sm font-medium text-foreground flex items-center gap-2">
          <Activity className="w-4 h-4" />
          Statistiques de Session
        </h3>
        
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-muted/50 p-3 rounded-lg">
            <div className="flex items-center gap-2 mb-1">
              <Timer className="w-4 h-4 text-primary" />
              <span className="text-xs text-muted-foreground">Durée</span>
            </div>
            <div className="text-lg font-mono font-bold text-foreground">
              {formatTime(sessionTime)}
            </div>
          </div>

          <div className="bg-muted/50 p-3 rounded-lg">
            <div className="flex items-center gap-2 mb-1">
              <Eye className="w-4 h-4 text-warning" />
              <span className="text-xs text-muted-foreground">Détections</span>
            </div>
            <div className="text-lg font-mono font-bold text-foreground">
              {detectionCount}
            </div>
          </div>

          <div className="bg-muted/50 p-3 rounded-lg col-span-2">
            <div className="flex items-center gap-2 mb-1">
              <Target className="w-4 h-4 text-accent" />
              <span className="text-xs text-muted-foreground">Correspondances</span>
            </div>
            <div className="flex items-baseline gap-2">
              <div className="text-lg font-mono font-bold text-foreground">
                {matchCount}
              </div>
              <div className="text-xs text-muted-foreground">
                ({detectionCount > 0 ? ((matchCount / detectionCount) * 100).toFixed(0) : 0}% du total)
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="space-y-2 pt-3 border-t border-border">
        <h3 className="text-sm font-medium text-foreground">Actions Rapides</h3>
        <div className="flex gap-2">
          <Button
            variant="stealth"
            size="sm"
            className="flex-1"
          >
            <Settings className="w-4 h-4 mr-1" />
            Config
          </Button>
          <Button
            variant="stealth"
            size="sm"
            className="flex-1"
          >
            {mode === 'stealth' ? <EyeOff /> : <Eye />}
            <span className="ml-1">
              {mode === 'stealth' ? 'Montrer' : 'Masquer'}
            </span>
          </Button>
        </div>
      </div>
    </div>
  );
}