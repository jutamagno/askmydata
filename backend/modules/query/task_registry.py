import asyncio


class TaskBuffer:
    """Single-producer, multi-consumer event buffer for SSE background tasks."""

    def __init__(self):
        self.events: list[str] = []
        self.done: bool = False
        self._event = asyncio.Event()

    def push(self, data: str) -> None:
        self.events.append(data)
        self._event.set()

    def mark_done(self) -> None:
        self.done = True
        self._event.set()

    async def stream_from(self, position: int = 0):
        """Yield buffered events from `position`, then stream live until done."""
        while True:
            while position < len(self.events):
                yield self.events[position]
                position += 1

            if self.done:
                return

            # Clear before the second drain to avoid a race where push() fires
            # between the len() check and wait().
            self._event.clear()
            while position < len(self.events):
                yield self.events[position]
                position += 1

            if self.done:
                return

            try:
                await asyncio.wait_for(self._event.wait(), timeout=300.0)
            except asyncio.TimeoutError:
                if self.done:
                    return


class TaskRegistry:
    def __init__(self):
        self._tasks: dict[str, TaskBuffer] = {}

    def create(self, task_id: str) -> TaskBuffer:
        buf = TaskBuffer()
        self._tasks[task_id] = buf
        return buf

    def get(self, task_id: str) -> TaskBuffer | None:
        return self._tasks.get(task_id)

    def remove(self, task_id: str) -> None:
        self._tasks.pop(task_id, None)
