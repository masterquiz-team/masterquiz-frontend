type HttpStatusMessages = {
  fallback: string;
  statuses: Partial<Record<number, string>>;
};

export function getHttpStatusMessage(
  status: number | undefined,
  messages: HttpStatusMessages,
): string {
  return (
    (status === undefined ? undefined : messages.statuses[status]) ??
    messages.fallback
  );
}
