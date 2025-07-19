import React from 'react';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { 
  User, 
  Clock, 
  MapPin, 
  Download, 
  Filter,
  Search,
  AlertTriangle,
  CheckCircle
} from 'lucide-react';
import { Input } from './ui/input';

interface Detection {
  id: string;
  name: string;
  confidence: number;
  timestamp: Date;
  location?: { lat: number; lng: number };
  image: string;
  box: { x: number; y: number; width: number; height: number };
}

interface DetectionLogProps {
  detections: Detection[];
  onExport: () => void;
  onClear: () => void;
}

export function DetectionLog({ detections, onExport, onClear }: DetectionLogProps) {
  const [filter, setFilter] = React.useState('');
  const [selectedId, setSelectedId] = React.useState<string | null>(null);

  const filteredDetections = detections.filter(detection =>
    detection.name.toLowerCase().includes(filter.toLowerCase()) ||
    detection.id.toLowerCase().includes(filter.toLowerCase())
  );

  const knownSubjects = detections.filter(d => !d.id.startsWith('unknown'));
  const unknownSubjects = detections.filter(d => d.id.startsWith('unknown'));

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const formatLocation = (location?: { lat: number; lng: number }) => {
    if (!location) return 'Position inconnue';
    return `${location.lat.toFixed(4)}, ${location.lng.toFixed(4)}`;
  };

  return (
    <div className="h-full flex flex-col bg-card rounded-lg shadow-tactical">
      {/* Header */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
            <User className="w-5 h-5" />
            Journal des Détections
          </h2>
          <div className="flex gap-2">
            <Button
              onClick={onExport}
              variant="stealth"
              size="sm"
              disabled={detections.length === 0}
            >
              <Download className="w-4 h-4" />
            </Button>
            <Button
              onClick={onClear}
              variant="destructive"
              size="sm"
              disabled={detections.length === 0}
            >
              Clear
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-2 mb-4">
          <div className="text-center p-2 bg-muted rounded">
            <div className="text-lg font-bold text-accent">{knownSubjects.length}</div>
            <div className="text-xs text-muted-foreground">Connus</div>
          </div>
          <div className="text-center p-2 bg-muted rounded">
            <div className="text-lg font-bold text-warning">{unknownSubjects.length}</div>
            <div className="text-xs text-muted-foreground">Inconnus</div>
          </div>
          <div className="text-center p-2 bg-muted rounded">
            <div className="text-lg font-bold text-primary">{detections.length}</div>
            <div className="text-xs text-muted-foreground">Total</div>
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher par nom ou ID..."
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {/* Detection List - ✅ Conteneur fixe avec scroll */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 max-h-[300px]">
        {filteredDetections.length === 0 ? (
          <div className="text-center text-muted-foreground py-8">
            {detections.length === 0 ? (
              <>
                <Filter className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>Aucune détection pour le moment</p>
                <p className="text-sm">Activez la caméra pour commencer</p>
              </>
            ) : (
              <>
                <Search className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>Aucun résultat pour "{filter}"</p>
              </>
            )}
          </div>
        ) : (
          filteredDetections
            .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
            .map((detection) => (
              <Card
                key={`${detection.id}-${detection.timestamp.getTime()}`}
                className={`p-3 cursor-pointer transition-all duration-200 ${
                  selectedId === detection.id 
                    ? 'ring-2 ring-primary shadow-glow' 
                    : 'hover:shadow-tactical'
                }`}
                onClick={() => setSelectedId(
                  selectedId === detection.id ? null : detection.id
                )}
              >
                <div className="flex items-start gap-3">
                  {/* Detection Image */}
                  <div className="relative">
                    <img
                      src={detection.image}
                      alt={`Detection ${detection.name}`}
                      className="w-16 h-16 rounded-lg object-cover border-2 border-border"
                    />
                    <div className={`absolute -top-1 -right-1 w-4 h-4 rounded-full ${
                      detection.id.startsWith('unknown')
                        ? 'bg-warning'
                        : 'bg-accent'
                    }`}>
                      {detection.id.startsWith('unknown') ? (
                        <AlertTriangle className="w-3 h-3 text-warning-foreground m-0.5" />
                      ) : (
                        <CheckCircle className="w-3 h-3 text-accent-foreground m-0.5" />
                      )}
                    </div>
                  </div>

                  {/* Detection Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="font-semibold text-foreground truncate">
                        {detection.name}
                      </h3>
                      <Badge 
                        variant={detection.confidence > 0.8 ? "default" : "secondary"}
                        className="text-xs"
                      >
                        {(detection.confidence * 100).toFixed(0)}%
                      </Badge>
                    </div>

                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {formatTime(detection.timestamp)}
                      </div>
                      {detection.location && (
                        <div className="flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          <span className="truncate max-w-20">
                            {formatLocation(detection.location)}
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="text-xs text-muted-foreground mt-1">
                      ID: {detection.id}
                    </div>
                  </div>
                </div>

                {/* Expanded Details */}
                {selectedId === detection.id && (
                  <div className="mt-3 pt-3 border-t border-border">
                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div>
                        <span className="text-muted-foreground">Horodatage:</span>
                        <div className="font-mono">
                          {detection.timestamp.toLocaleString('fr-FR')}
                        </div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Confiance:</span>
                        <div className="font-mono">
                          {(detection.confidence * 100).toFixed(2)}%
                        </div>
                      </div>
                      {detection.location && (
                        <div className="col-span-2">
                          <span className="text-muted-foreground">Position GPS:</span>
                          <div className="font-mono text-xs break-all">
                            Lat: {detection.location.lat.toFixed(6)}<br />
                            Lng: {detection.location.lng.toFixed(6)}
                          </div>
                        </div>
                      )}
                      <div className="col-span-2">
                        <span className="text-muted-foreground">Zone détection:</span>
                        <div className="font-mono text-xs">
                          X: {detection.box.x.toFixed(0)}, Y: {detection.box.y.toFixed(0)}<br />
                          W: {detection.box.width.toFixed(0)}, H: {detection.box.height.toFixed(0)}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </Card>
            ))
        )}
      </div>
    </div>
  );
}