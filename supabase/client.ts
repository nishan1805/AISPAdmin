import { supabaseAnonKey, supabaseUrl } from "@/lib/env";
import { createClient } from "@supabase/supabase-js";

type Waiter = () => void;

const localLockState = new Map<string, { locked: boolean; queue: Waiter[] }>();

const localProcessLock = async <R>(
  name: string,
  _acquireTimeout: number,
  fn: () => Promise<R>
): Promise<R> => {
  let state = localLockState.get(name);
  if (!state) {
    state = { locked: false, queue: [] };
    localLockState.set(name, state);
  }

  await new Promise<void>((resolve) => {
    if (!state!.locked) {
      state!.locked = true;
      resolve();
      return;
    }

    state!.queue.push(resolve);
  });

  try {
    return await fn();
  } finally {
    const next = state.queue.shift();
    if (next) {
      next();
    } else {
      state.locked = false;
    }
  }
};

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    lock: localProcessLock,
  },
});
