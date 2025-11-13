interface SmartQuantityHintProps {
  quantity: number;
  source: 'last_used' | 'weekly_avg' | 'favorite' | 'default';
  logCount?: number;
}

export function SmartQuantityHint({ quantity, source, logCount }: SmartQuantityHintProps) {
  const hints = {
    last_used: `Your last amount: ${quantity}g`,
    weekly_avg: `Your average: ${quantity}g (last ${logCount} logs)`,
    favorite: `Your usual: ${quantity}g`,
    default: `Suggested: ${quantity}g`
  };

  return (
    <p className="text-xs text-muted-foreground mb-2">
      💡 {hints[source]}
    </p>
  );
}
