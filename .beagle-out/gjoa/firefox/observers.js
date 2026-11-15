
export function on(topic, handler) {
  const observer = {observe: (subject, __topic, data) => (() => { try {
    return handler(subject, data);
  } catch (__e) {
    return console.error(("".concat("gjoa obs handler ", topic, ":")), __e);
  } })()};
  (() => { try {
    return Services.obs.addObserver(observer, topic);
  } catch (__e) {
    return null;
  } })();
  return () => (() => { try {
    return Services.obs.removeObserver(observer, topic);
  } catch (__e) {
    return null;
  } })();
}

export function notify(topic, subject, data) {
  return (() => { try {
    return Services.obs.notifyObservers(subject, topic, data);
  } catch (__e) {
    return console.error(("".concat("gjoa obs notify ", topic, ":")), __e);
  } })();
}
