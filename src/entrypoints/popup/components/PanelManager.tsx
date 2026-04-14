import AboutMePanel from './AboutMePanel';
import AutoListPanel from './AutoListPanel';
import HomePanel from './HomePanel';
import InstructionsPanel from './InstructionsPanel';
import ReportIssuePanel from './ReportIssuePanel';
import SettingsPanel from './SettingsPanel';
import usePanelsContext from './panels-context/usePanelsContext';

function PanelManager() {
  const { currentPanel } = usePanelsContext();

  switch (currentPanel) {
    case 'home': return (<HomePanel />);
    case 'instructions': return (<InstructionsPanel />);
    case 'reportIssue': return (<ReportIssuePanel />);
    case 'aboutMe': return (<AboutMePanel />);
    case 'settings': return (<SettingsPanel />);
    case 'autoList': return (<AutoListPanel />);
    default: return null;
  }
}

export default PanelManager;
