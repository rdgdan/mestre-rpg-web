// Componente de Notificações de Combate
// Exibe atividades em cards do combate (sincronizado com mestre)

import React from 'react';

export interface CombatNotification {
  id: string;
  timestamp: number;
  characterName: string;
  characterId: string;
  type: 'spell-use' | 'rest-short' | 'rest-long' | 'ability-use' | 'effect-applied' | 'effect-removed' | 'hp-change';
  message: string;
  icon: string;
  severity: 'info' | 'warning' | 'success' | 'alert';
}

interface CombatNotificationsProps {
  notifications: CombatNotification[];
  maxNotifications?: number;
}

export const CombatNotifications: React.FC<CombatNotificationsProps> = ({
  notifications,
  maxNotifications = 5
}) => {
  // Mostrar apenas as N notificações mais recentes
  const displayNotifications = notifications.slice(0, maxNotifications);

  const getSeverityStyles = (severity: CombatNotification['severity']) => {
    switch (severity) {
      case 'alert':
        return 'bg-red-900/40 border-red-500/50 text-red-200';
      case 'warning':
        return 'bg-yellow-900/40 border-yellow-500/50 text-yellow-200';
      case 'success':
        return 'bg-green-900/40 border-green-500/50 text-green-200';
      default:
        return 'bg-blue-900/40 border-blue-500/50 text-blue-200';
    }
  };

  return (
    <div className="space-y-2">
      {displayNotifications.map((notif) => (
        <div
          key={notif.id}
          className={`p-2 rounded border animate-in fade-in slide-in-from-top-2 duration-300 ${getSeverityStyles(
            notif.severity
          )}`}
        >
          <div className="flex items-start gap-2">
            <span className="text-lg shrink-0">{notif.icon}</span>
            <div className="flex-grow">
              <p className="text-xs font-bold">{notif.characterName}</p>
              <p className="text-xs leading-tight">{notif.message}</p>
              <p className="text-[10px] opacity-60 mt-1">
                {new Date(notif.timestamp).toLocaleTimeString()}
              </p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default CombatNotifications;
