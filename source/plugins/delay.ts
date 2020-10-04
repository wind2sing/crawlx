function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export default function(defaultDelay) {
  return {
    name: "delay",
    priority: 90,
    async before(task) {
      const delay = task.delay || defaultDelay
      if (delay) await sleep(delay);
    }
  };
}
