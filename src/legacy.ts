import { installDragdrop } from "./features/dragdrop";
import { installJQueryBridges } from "./jquery";
import { installModal } from "./features/modal";
import { installMultiselect } from "./features/multiselect";
import { installPagination } from "./features/pagination";
import { installPopover } from "./features/popover";
import { installTabs } from "./features/tabs";
import { installTheme } from "./features/theme";
import { installToast } from "./features/toast";
import type { LegacyRequiredApi } from "./internal";

(function () {
  const root = window;

  /* v8 ignore next -- alternate startup path is preserving an existing namespace */
  if (!root.LegacyCss) {
    root.LegacyCss = {};
  }

  const legacy = root.LegacyCss as LegacyRequiredApi;

  installTheme(legacy);
  installModal(legacy);
  installToast(legacy);
  installPopover(legacy);
  installTabs(legacy);
  installDragdrop(legacy);
  installMultiselect(legacy);
  installPagination(legacy);
  installJQueryBridges(root, legacy);
})();
