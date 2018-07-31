let events = {}

function addEventListener (name, self, callback) {
  let tuple = [self, callback]
  let callbacks = events[name]
  if (Array.isArray(callbacks)) {
    callbacks.push(tuple)
  } else {
    events[name] = [tuple]
  }
}

function removeEventListener (name, self) {
  let callbacks = events[name]
  if (Array.isArray(callbacks)) {
    events[name] = callbacks.filter((tuple) => {
      return tuple[0] !== self
    })
  }
}

function triggerEvent (name, data) {
  let callbacks = events[name]
  if (Array.isArray(callbacks)) {
    callbacks.map((tuple) => {
      let self = tuple[0]
      let callback = tuple[1]
      callback.call(self, data)
    })
  }
}

export default {
  addEventListener,
  removeEventListener,
  triggerEvent
}
