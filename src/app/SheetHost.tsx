import { HotelSheet } from '../features/hotels/HotelSheet';
import { TaxiSheet } from '../features/hotels/TaxiSheet';
import { AddStopSheet } from '../features/itinerary/AddStopSheet';
import { ExportSheet } from '../features/itinerary/ExportSheet';
import { StopSheet } from '../features/itinerary/StopSheet';
import { PhraseSheet } from '../features/useful/PhraseSheet';
import { useSheet } from './sheetContext';

/** Renders whatever the sheet should show right now. */
export function SheetHost() {
  const { current } = useSheet();
  if (!current) return null;
  switch (current.kind) {
    case 'stop':
      return (
        <StopSheet
          key={current.stopId}
          date={current.date}
          stopId={current.stopId}
          noLeave={current.noLeave}
        />
      );
    case 'add':
      return <AddStopSheet key={current.date} date={current.date} />;
    case 'export':
      return <ExportSheet key={current.date ?? 'trip'} date={current.date} />;
    case 'hotel':
      return <HotelSheet key={current.hotelId} hotelId={current.hotelId} />;
    case 'taxi':
      return <TaxiSheet key={current.hotelId} hotelId={current.hotelId} />;
    case 'phrase':
      return <PhraseSheet key={current.phraseId} phraseId={current.phraseId} />;
  }
}
