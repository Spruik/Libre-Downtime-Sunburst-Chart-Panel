import { appEvents } from 'app/core/core'

export const alert = (type, title, msg) => {
  appEvents.emit('alert-' + type, [title, msg])
}