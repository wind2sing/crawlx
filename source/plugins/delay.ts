function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export default function(defaultDelay) {
  return {
    name: "delay",
    priority: 90,
    async before(task) {
      if (task.delay || defaultDelay) await sleep(task.delay);
    }
  };
}
