import React, { useState, useEffect } from 'react';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { 
  Terminal, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  Filter,
  Search,
  Download,
  RefreshCw
} from 'lucide-react';

interface SystemLog {
  id: string;
  timestamp: Date;
  level: 'info' | 'warning' | 'error';
  category: 'detection' | 'comparison' | 'system' | 'storage';
  message: string;
  details?: any;
}

export function SystemLogs() {
  const [logs, setLogs] = useState<SystemLog[]>([]);
  const [filter, setFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [levelFilter, setLevelFilter] = useState<string>('all');

  useEffect(() => {
    // Simulate system logs
    const generateLogs = () => {
      const categories: SystemLog['category'][] = ['detection', 'comparison', 'system', 'storage'];
      const levels: SystemLog['level'][] = ['info', 'warning', 'error'];
      const messages = {
        detection: [
          'Nouveau visage détecté dans la zone de surveillance',
          'Détection de faible qualité rejetée (résolution insuffisante)',
          'Points de repère faciaux extraits avec succès'
        ],
        comparison: [
          'Recherche de correspondance dans la base de données',
          'Match trouvé avec 42% de similarité',
          'Échec de comparaison - base de données indisponible'
        ],
        system: [
          'Modèles face-api.js chargés avec succès',
          'Connexion à la caméra établie',
          'Erreur d\'accès aux modèles IA'
        ],
        storage: [
          'Image sauvegardée dans le bucket faces_unknown',
          'Échec d\'upload - bucket introuvable',
          'Synchronisation avec Supabase terminée'
        ]
      };

      return Array.from({ length: 50 }, (_, i) => {
        const category = categories[Math.floor(Math.random() * categories.length)];
        const level = levels[Math.floor(Math.random() * levels.length)];
        const categoryMessages = messages[category];
        const message = categoryMessages[Math.floor(Math.random() * categoryMessages.length)];
        
        return {
          id: `log-${i}`,
          timestamp: new Date(Date.now() - Math.random() * 86400000), // Last 24h
          level,
          category,
          message,
          details: { 
            sessionId: `session-${Math.floor(Math.random() * 1000)}`,
            processingTime: Math.floor(Math.random() * 500) + 'ms'
          }
        };
      }).sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
    };

    setLogs(generateLogs());
  }, []);

  const filteredLogs = logs.filter(log => {
    const matchesSearch = log.message.toLowerCase().includes(filter.toLowerCase()) ||
                         log.category.toLowerCase().includes(filter.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || log.category === categoryFilter;
    const matchesLevel = levelFilter === 'all' || log.level === levelFilter;
    
    return matchesSearch && matchesCategory && matchesLevel;
  });

  const getLogIcon = (level: SystemLog['level']) => {
    switch (level) {
      case 'error': return <AlertTriangle className="w-4 h-4 text-destructive" />;
      case 'warning': return <AlertTriangle className="w-4 h-4 text-warning" />;
      case 'info': return <CheckCircle className="w-4 h-4 text-accent" />;
    }
  };

  const getLogBadge = (level: SystemLog['level']) => {
    switch (level) {
      case 'error': return 'destructive';
      case 'warning': return 'secondary';
      case 'info': return 'default';
    }
  };

  const getCategoryColor = (category: SystemLog['category']) => {
    switch (category) {
      case 'detection': return 'bg-primary/10 text-primary';
      case 'comparison': return 'bg-accent/10 text-accent';
      case 'system': return 'bg-warning/10 text-warning';
      case 'storage': return 'bg-muted/50 text-muted-foreground';
    }
  };

  const exportLogs = () => {
    const csvContent = [
      ['Timestamp', 'Level', 'Category', 'Message'].join(','),
      ...filteredLogs.map(log => [
        log.timestamp.toISOString(),
        log.level,
        log.category,
        `"${log.message}"`
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `system-logs-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="h-full flex flex-col bg-card rounded-lg shadow-tactical">
      {/* Header */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
            <Terminal className="w-5 h-5" />
            Logs Système
          </h2>
          <div className="flex gap-2">
            <Button
              onClick={exportLogs}
              variant="stealth"
              size="sm"
              disabled={filteredLogs.length === 0}
            >
              <Download className="w-4 h-4" />
            </Button>
            <Button
              onClick={() => window.location.reload()}
              variant="stealth"
              size="sm"
            >
              <RefreshCw className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher dans les logs..."
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="pl-9"
            />
          </div>
          
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Catégorie" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toutes catégories</SelectItem>
              <SelectItem value="detection">Détections</SelectItem>
              <SelectItem value="comparison">Comparaisons</SelectItem>
              <SelectItem value="system">Système</SelectItem>
              <SelectItem value="storage">Stockage</SelectItem>
            </SelectContent>
          </Select>

          <Select value={levelFilter} onValueChange={setLevelFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Niveau" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous niveaux</SelectItem>
              <SelectItem value="info">Info</SelectItem>
              <SelectItem value="warning">Warning</SelectItem>
              <SelectItem value="error">Erreur</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-2">
          <div className="text-center p-2 bg-muted rounded">
            <div className="text-sm font-bold text-destructive">
              {logs.filter(l => l.level === 'error').length}
            </div>
            <div className="text-xs text-muted-foreground">Erreurs</div>
          </div>
          <div className="text-center p-2 bg-muted rounded">
            <div className="text-sm font-bold text-warning">
              {logs.filter(l => l.level === 'warning').length}
            </div>
            <div className="text-xs text-muted-foreground">Warnings</div>
          </div>
          <div className="text-center p-2 bg-muted rounded">
            <div className="text-sm font-bold text-accent">
              {logs.filter(l => l.level === 'info').length}
            </div>
            <div className="text-xs text-muted-foreground">Info</div>
          </div>
          <div className="text-center p-2 bg-muted rounded">
            <div className="text-sm font-bold text-primary">{filteredLogs.length}</div>
            <div className="text-xs text-muted-foreground">Affichés</div>
          </div>
        </div>
      </div>

      {/* Logs List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2 max-h-[400px]">
        {filteredLogs.length === 0 ? (
          <div className="text-center text-muted-foreground py-8">
            <Terminal className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>Aucun log trouvé</p>
            <p className="text-sm">Modifiez vos filtres pour voir plus de résultats</p>
          </div>
        ) : (
          filteredLogs.map((log) => (
            <Card key={log.id} className="p-3 hover:shadow-tactical transition-all duration-200">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 mt-0.5">
                  {getLogIcon(log.level)}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <Badge variant={getLogBadge(log.level)} className="text-xs">
                        {log.level.toUpperCase()}
                      </Badge>
                      <span className={`text-xs px-2 py-0.5 rounded ${getCategoryColor(log.category)}`}>
                        {log.category}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Clock className="w-3 h-3" />
                      {log.timestamp.toLocaleTimeString('fr-FR')}
                    </div>
                  </div>
                  
                  <p className="text-sm text-foreground mb-1">{log.message}</p>
                  
                  {log.details && (
                    <div className="text-xs text-muted-foreground font-mono">
                      Session: {log.details.sessionId} | Temps: {log.details.processingTime}
                    </div>
                  )}
                </div>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}