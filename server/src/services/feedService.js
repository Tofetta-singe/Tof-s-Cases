import { memoryStore } from "../data/memoryStore.js";

export function pushFeedEvent(event) {
  memoryStore.feed.unshift({
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    createdAt: new Date().toISOString(),
    ...event
  });
  memoryStore.feed = memoryStore.feed.slice(0, 15);
  return memoryStore.feed;
}

export function getFeed() {
  return memoryStore.feed;
}
