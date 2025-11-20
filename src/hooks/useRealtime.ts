// Stub for real-time subscriptions
// TODO: Implement full real-time functionality with Supabase subscriptions

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type RealtimeCallback = (payload: any) => void;

export function useRealtime() {
  // Stub implementation - returns no-op functions to prevent errors
  const subscribe = (_table: string, _callback: RealtimeCallback) => {
    // Stub: Real-time subscription not yet implemented
    return `subscription-${_table}-${Date.now()}`;
  };

  const unsubscribe = (_subscriptionId: string) => {
    // Stub: Unsubscribe not yet implemented
  };

  return {
    subscribe,
    unsubscribe,
  };
}




