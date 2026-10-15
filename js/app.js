import { initializeHeader } from "./header.js";
import { initializeSidebar } from "./sidebar.js";
import { addPage, downloadJson, openImport, printPages, setOrientation } from "./workspace.js";

initializeHeader({ addPage, downloadJson, openImport, printPages, setOrientation });
initializeSidebar();
