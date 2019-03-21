'use strict';

System.register(['app/core/core'], function (_export, _context) {
  "use strict";

  var appEvents, alert;
  return {
    setters: [function (_appCoreCore) {
      appEvents = _appCoreCore.appEvents;
    }],
    execute: function () {
      _export('alert', alert = function alert(type, title, msg) {
        appEvents.emit('alert-' + type, [title, msg]);
      });

      _export('alert', alert);
    }
  };
});
//# sourceMappingURL=utils.js.map
