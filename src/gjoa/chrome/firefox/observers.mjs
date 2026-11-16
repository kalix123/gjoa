// Observer-service helpers. Handler errors are logged, never propagated.

// Subscribe to `topic`; returns an unsubscribe function.
export function on(topic, handler) {
  const observer = {
    observe(subject, _topic, data) {
      try {
        handler(subject, data);
      } catch (e) {
        console.error(`gjoa obs handler ${topic}:`, e);
      }
    },
  };
  try { Services.obs.addObserver(observer, topic); } catch {}
  return () => {
    try { Services.obs.removeObserver(observer, topic); } catch {}
  };
}

export function notify(topic, subject, data) {
  try {
    Services.obs.notifyObservers(subject, topic, data);
  } catch (e) {
    console.error(`gjoa obs notify ${topic}:`, e);
  }
}
