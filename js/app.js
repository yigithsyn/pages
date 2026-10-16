import { initializeHeader } from "./header.js";
import { initializeSidebar } from "./sidebar.js";
import { addPage, downloadJson, newSession, openImport, printPages, setOrientation } from "./workspace.js";

initializeHeader({ addPage, downloadJson, newSession, openImport, printPages, setOrientation });
initializeSidebar();
