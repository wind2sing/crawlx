import { PriorityQueueArray } from "../source/priority-queue";

test("priority queue operations", async () => {
  const q = new PriorityQueueArray();
  await q.initialize();
  await q.enqueue(3);
  await q.enqueueAll(1, 2, 3, 4, -5, 9);
  expect(await q.peek()).toEqual(9);
  let items = [];
  for await (const val of q) {
    items.push(val);
  }
  expect(items).toEqual([9, 4, 3, 3, 2, 1, -5]);

  await q.clear();
  expect(await q.getSize()).toEqual(0);
  expect(await q.dequeue()).toEqual(undefined);
  await q.dispose();
});
