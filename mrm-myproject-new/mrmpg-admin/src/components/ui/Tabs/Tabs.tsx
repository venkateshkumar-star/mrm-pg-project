import React, { useState } from "react";
import "./Tabs.scss";

export interface TabItem {
  id: string;
  label: string;
  count?: number;
  disabled?: boolean;
}

interface TabsProps {
  tabs: TabItem[];
  activeTab?: string;
  onTabChange: (tabId: string) => void;
  size?: 'small' | 'medium' | 'large';
  className?: string;
  showCounts?: boolean;
  fullWidth?: boolean;
}

const Tabs: React.FC<TabsProps> = ({
  tabs,
  activeTab,
  onTabChange,
  size = 'medium',
  className = '',
  showCounts = true,
  fullWidth = false
}) => {
  const [internalActiveTab, setInternalActiveTab] = useState(activeTab || tabs[0]?.id || '');
  
  const currentActiveTab = activeTab !== undefined ? activeTab : internalActiveTab;

  const handleTabClick = (tabId: string) => {
    const tab = tabs.find(t => t.id === tabId);
    if (tab && !tab.disabled) {
      if (activeTab === undefined) {
        setInternalActiveTab(tabId);
      }
      onTabChange(tabId);
    }
  };

  const getTabClasses = (tab: TabItem) => {
    const classes = ['tab-item'];
    
    if (currentActiveTab === tab.id) {
      classes.push('tab-item--active');
    }
    
    if (tab.disabled) {
      classes.push('tab-item--disabled');
    }
    
    classes.push(`tab-item--${size}`);
    
    return classes.join(' ');
  };

  const getTabsContainerClasses = () => {
    const classes = ['tabs-container'];
    
    classes.push(`tabs-container--${size}`);
    
    if (fullWidth) {
      classes.push('tabs-container--full-width');
    }
    
    if (className) {
      classes.push(className);
    }
    
    return classes.join(' ');
  };

  return (
    <div className={getTabsContainerClasses()}>
      <div className="tabs-wrapper">
        <div className="tabs-list" role="tablist">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              className={getTabClasses(tab)}
              onClick={() => handleTabClick(tab.id)}
              disabled={tab.disabled}
              role="tab"
              aria-selected={currentActiveTab === tab.id}
              aria-controls={`panel-${tab.id}`}
              type="button"
            >
              <span className="tab-label">{tab.label}</span>
              {showCounts && typeof tab.count === 'number' && (
                <span className="tab-count">{tab.count}</span>
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Tabs;
