import React, { useState } from 'react';
import { ISettingsItemComponentProps } from '../typedefs/SettingsWindowTypes';
import { generateUpdatedTriciId } from '../../../common/Utils';

type DisplayUnit = {
  key: string;
  text: string;
};

export function SelectScreenToRecord({ userPreferences, onSave }: ISettingsItemComponentProps) {
  const [state, setState] = useState({ displayUnits: window.bridgeApi.getAllDisplays() });

  const _screenToRecordSelected = (screenIndex: number) => {
    console.log('_screenToRecordSelected', screenIndex);
    if (userPreferences) {
      const idOfDocToDelete = userPreferences._id;
      const updatedId = generateUpdatedTriciId(idOfDocToDelete);
      const updatedUserPreferences = userPreferences?.withMutations(up => {
        up.set('_id', updatedId).set('defaultScreenToRecord', screenIndex);
      });
      onSave(updatedUserPreferences, idOfDocToDelete);
    }
  };

  const displayUnits: DisplayUnit[] = [];

  console.log('state.displayUnits', state.displayUnits);

  state.displayUnits.forEach((displayUnit: any, index) => {
    const primaryDisplayLabel = `(${displayUnit.bounds.x},${displayUnit.bounds.y})`;
    displayUnits.push({
      key: `${index}`,
      text: `${displayUnit.label} | ${displayUnit.size.width} x ${displayUnit.size.height} @ ${primaryDisplayLabel}`,
    });
  });

  if (userPreferences === undefined) {
    return <div>Loading...</div>;
  }

  const screenToRecord = userPreferences.defaultScreenToRecord;
  const selectedDisplay = displayUnits.length > 1 ? screenToRecord.toString() : '0';

  return (
    <div>
      <p>Select screen to record:</p>
      {displayUnits.map((displayUnit: any) => {
        return (
          <div key={displayUnit.key}>
            <input
              type="radio"
              id={displayUnit.key}
              name="screenToRecord"
              value={displayUnit.key}
              checked={displayUnit.key === selectedDisplay}
              onChange={event => _screenToRecordSelected(parseInt(event.target.value))}
            />
            <label htmlFor={displayUnit.key}>{displayUnit.text}</label>
          </div>
        );
      })}
    </div>
  );
}
